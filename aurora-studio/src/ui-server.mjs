import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { buildStudioSnapshot, resolveWorkspaceMedia } from "./ui-data.mjs";
import {
  MAX_REFERENCE_BYTES,
  createUrlReference,
  storeReferenceUpload
} from "./reference-files.mjs";
import {
  addBuildPlanShot,
  updateBuildPlanShot,
  reorderBuildPlanShots,
  duplicateBuildPlanShot,
  removeBuildPlanShot,
  moveBuildPlanShot
} from "./build-plan.mjs";
import {
  addAssetPlanNeed,
  updateAssetPlanNeed,
  removeAssetPlanNeed,
  completeAssetPlan,
  readAssetPlan
} from "./asset-plan.mjs";
import {
  readLibrary,
  updateLibraryItem,
  removeLibraryItem,
  upsertLibraryItem
} from "./library.mjs";
import { licenseGate } from "./asset-sources.mjs";
import { searchPolyHaven } from "./open-assets/poly-haven.mjs";
import {
  createGenerationRequest,
  generationCapabilityForNeed
} from "./generation-requests.mjs";
import { requestRevision } from "./revisions.mjs";
import {
  readReviewReport,
  validateReviewReportFile
} from "./review-report.mjs";
import { readLearningReview } from "./learning.mjs";
import { probeRender } from "./quality.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI_ROOT = path.resolve(HERE, "../ui");
const require = createRequire(import.meta.url);

const MEDIA_CHROME_VENDOR = "/vendor/media-chrome.js";
const SORTABLE_VENDOR = "/vendor/sortable.js";

const FLOATING_VENDOR = {
  "/vendor/floating-ui-utils.js": {
    package: "@floating-ui/utils",
    file: "dist/floating-ui.utils.umd.js"
  },
  "/vendor/floating-ui-utils-dom.js": {
    package: "@floating-ui/utils",
    file: "dist/floating-ui.utils.dom.umd.js"
  },
  "/vendor/floating-ui-core.js": {
    package: "@floating-ui/core",
    file: "dist/floating-ui.core.umd.js"
  },
  "/vendor/floating-ui-dom.js": {
    package: "@floating-ui/dom",
    file: "dist/floating-ui.dom.umd.js"
  }
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime"
};


const PROJECT_FIELDS = new Set([
  "product",
  "website",
  "purpose",
  "audience",
  "offer",
  "positioning",
  "brand.personality",
  "brand.colors",
  "brand.fonts",
  "brand.logo_paths",
  "brand.avoid",
  "content.languages",
  "content.channels",
  "creative.preferred_moods",
  "creative.avoid_moods",
  "creative.recurring_constraints"
]);

const RESOURCE_FIELDS = new Set([
  "browser_control",
  "chatgpt_browser",
  "google_flow",
  "meta_ai",
  "elevenlabs",
  "local_paths"
]);

function packageRootFromEntry(entry, expectedName) {
  let dir = path.dirname(entry);

  for (let depth = 0; depth < 8; depth += 1) {
    const packageFile = path.join(dir, "package.json");

    if (fs.existsSync(packageFile)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
        if (pkg.name === expectedName) return dir;
      } catch {
        // Keep walking upward; malformed nested metadata is not authoritative.
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

function resolveSortableVendor() {
  try {
    const file = require.resolve("sortablejs");
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    return file;
  } catch {
    return null;
  }
}

function resolveMediaChromeVendor() {
  try {
    const entry = require.resolve("media-chrome");
    const root = packageRootFromEntry(entry, "media-chrome");
    if (!root) return null;

    const file = path.join(root, "dist", "iife", "index.js");

    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    return file;
  } catch {
    return null;
  }
}

function resolveFloatingVendor(urlPath) {
  const spec = FLOATING_VENDOR[urlPath];
  if (!spec) return null;

  try {
    const packageJson = require.resolve(spec.package + "/package.json");
    const root = path.dirname(packageJson);
    const file = path.join(root, spec.file);

    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    return file;
  } catch {
    return null;
  }
}

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function unauthorized(res) {
  json(res, 401, { error: "Unauthorized Studio request." });
}

function safeStaticFile(urlPath) {
  const requested = urlPath === "/" ? "index.html" : urlPath.replace(/^\//, "");
  const file = path.resolve(UI_ROOT, requested);
  const rel = path.relative(UI_ROOT, file);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return file;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error("Invalid JSON body.")); }
    });
    req.on("error", reject);
  });
}

function openBrowser(url) {
  let command;
  let args;

  if (process.platform === "win32") {
    command = "cmd.exe";
    args = ["/c", "start", "", url];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  try {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

function runCli(cliPath, cwd, args) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });

  return {
    ok: result.status === 0,
    exit_code: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || ""
  };
}


function cliValue(value) {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return JSON.stringify(value);
  }
  return value == null ? "" : String(value);
}

function writeTemporarySetupConfig(cwd, config) {
  const dir = path.join(cwd, ".aurora", "temp");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `ui-setup-${crypto.randomBytes(6).toString("hex")}.json`);
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
  return file;
}

function runConfiguredSetup(cliPath, cwd, config) {
  const file = writeTemporarySetupConfig(cwd, config);
  try {
    return runCli(cliPath, cwd, ["setup", "--config", file]);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function parseCliJson(stdout) {
  try {
    return JSON.parse(String(stdout || "").trim());
  } catch {
    return null;
  }
}

export async function startStudioUiServer({
  cwd = process.cwd(),
  port = 4317,
  host = "127.0.0.1",
  open = true,
  cliPath
} = {}) {
  if (!cliPath) throw new Error("AurorA Studio UI requires a CLI path.");

  const token = crypto.randomBytes(24).toString("hex");

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${host}`);

      if (url.pathname.startsWith("/api/") || url.pathname === "/media") {
        const supplied = req.headers["x-aurora-token"] || url.searchParams.get("token");
        if (supplied !== token) return unauthorized(res);
      }

      if (req.method === "GET" && url.pathname === SORTABLE_VENDOR) {
        const file = resolveSortableVendor();
        if (!file) {
          return json(res, 404, {
            error: "SortableJS is not installed."
          });
        }

        const body = fs.readFileSync(file);
        res.writeHead(200, {
          "Content-Type": "text/javascript; charset=utf-8",
          "Content-Length": body.length,
          "Cache-Control": "public, max-age=31536000, immutable"
        });
        res.end(body);
        return;
      }

      if (req.method === "GET" && url.pathname === MEDIA_CHROME_VENDOR) {
        const file = resolveMediaChromeVendor();
        if (!file) {
          return json(res, 404, {
            error: "Media Chrome is not installed."
          });
        }

        const body = fs.readFileSync(file);
        res.writeHead(200, {
          "Content-Type": "text/javascript; charset=utf-8",
          "Content-Length": body.length,
          "Cache-Control": "public, max-age=31536000, immutable"
        });
        res.end(body);
        return;
      }

      if (req.method === "GET" && FLOATING_VENDOR[url.pathname]) {
        const file = resolveFloatingVendor(url.pathname);
        if (!file) {
          return json(res, 404, {
            error: "Optional Floating UI dependency is not installed."
          });
        }

        const body = fs.readFileSync(file);
        res.writeHead(200, {
          "Content-Type": "text/javascript; charset=utf-8",
          "Content-Length": body.length,
          "Cache-Control": "public, max-age=31536000, immutable"
        });
        res.end(body);
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/state") {
        return json(res, 200, buildStudioSnapshot(cwd));
      }

      if (req.method === "POST" && url.pathname === "/api/mode") {
        const body = await readBody(req);
        if (!["direct", "director"].includes(body.mode)) {
          return json(res, 400, { error: "Mode must be direct or director." });
        }
        const result = runCli(cliPath, cwd, ["mode", body.mode]);
        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
        });
      }

      if (req.method === "POST" && url.pathname === "/api/plan") {
        const body = await readBody(req);
        const task = String(body.task || "").trim();
        if (!task) return json(res, 400, { error: "Tell AurorA what you want to make." });

        const quality = ["draft", "normal", "premium", "hero"].includes(body.quality)
          ? body.quality
          : "normal";
        const aspect = ["project", "9:16", "16:9", "1:1"].includes(body.aspect)
          ? body.aspect
          : "project";

        const args = ["plan", task, "--quality", quality, "--aspect", aspect];
        if (body.referenceId) args.push("--reference", String(body.referenceId));
        const result = runCli(cliPath, cwd, args);
        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
        });
      }


      if (req.method === "POST" && url.pathname === "/api/reference-link") {
        const body = await readBody(req);
        try {
          const result = createUrlReference({
            name: String(body.name || "").trim(),
            url: body.url,
            referenceRole: body.role
          }, cwd);

          return json(res, 200, {
            ok: true,
            reference: result.reference,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/reference-upload") {
        const encodedName = req.headers["x-aurora-filename"];
        if (!encodedName) {
          return json(res, 400, { error: "Reference upload is missing a file name." });
        }

        let filename;
        let displayName;
        try {
          filename = decodeURIComponent(String(encodedName));
          displayName = req.headers["x-aurora-reference-name"]
            ? decodeURIComponent(String(req.headers["x-aurora-reference-name"]))
            : null;
        } catch {
          return json(res, 400, { error: "Reference upload metadata is invalid." });
        }

        try {
          const result = await storeReferenceUpload(req, {
            cwd,
            filename,
            name: displayName,
            referenceRole: req.headers["x-aurora-reference-role"],
            mime: req.headers["content-type"],
            maxBytes: MAX_REFERENCE_BYTES
          });

          return json(res, 200, {
            ok: true,
            reference: result.reference,
            size_bytes: result.size_bytes,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }


      if (req.method === "POST" && url.pathname === "/api/concept-select") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();
        const conceptId = String(body.conceptId || "").trim();

        if (!runId || !conceptId) {
          return json(res, 400, {
            error: "Concept selection requires runId and conceptId."
          });
        }

        const result = runCli(
          cliPath,
          cwd,
          ["concepts", "select", runId, conceptId]
        );

        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
        });
      }

      if (req.method === "POST" && url.pathname === "/api/concept-refine") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();
        const conceptId = body.conceptId == null
          ? null
          : String(body.conceptId).trim();
        const note = String(body.note || "").trim();

        if (!runId || !note) {
          return json(res, 400, {
            error: "Concept refinement requires runId and a note."
          });
        }

        const args = ["concepts", "refine", runId, "--note", note];
        if (conceptId) args.push("--concept", conceptId);

        const result = runCli(cliPath, cwd, args);

        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
        });
      }


      if (req.method === "POST" && url.pathname === "/api/storyboard-add") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();

        if (!runId) {
          return json(res, 400, { error: "Storyboard add requires runId." });
        }

        try {
          const result = addBuildPlanShot(runId, {
            purpose: body.purpose,
            duration_seconds: body.duration_seconds,
            engine: body.engine,
            quality: body.quality,
            output: body.output
          }, cwd);

          return json(res, 200, {
            ok: true,
            shot_id: result.shot_id,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/storyboard-update") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();
        const shotId = String(body.shotId || "").trim();

        if (!runId || !shotId) {
          return json(res, 400, {
            error: "Storyboard update requires runId and shotId."
          });
        }

        try {
          updateBuildPlanShot(
            runId,
            shotId,
            body.changes && typeof body.changes === "object"
              ? body.changes
              : {},
            cwd
          );

          return json(res, 200, {
            ok: true,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/storyboard-reorder") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();

        if (!runId || !Array.isArray(body.order)) {
          return json(res, 400, {
            error: "Storyboard reorder requires runId and order."
          });
        }

        try {
          reorderBuildPlanShots(
            runId,
            body.order.map(String),
            cwd
          );

          return json(res, 200, {
            ok: true,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/storyboard-duplicate") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();
        const shotId = String(body.shotId || "").trim();

        if (!runId || !shotId) {
          return json(res, 400, {
            error: "Storyboard duplicate requires runId and shotId."
          });
        }

        try {
          const result = duplicateBuildPlanShot(runId, shotId, cwd);
          return json(res, 200, {
            ok: true,
            shot_id: result.shot_id,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/storyboard-remove") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();
        const shotId = String(body.shotId || "").trim();

        if (!runId || !shotId) {
          return json(res, 400, {
            error: "Storyboard remove requires runId and shotId."
          });
        }

        try {
          removeBuildPlanShot(runId, shotId, cwd);
          return json(res, 200, {
            ok: true,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/storyboard-move") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();
        const shotId = String(body.shotId || "").trim();
        const direction = String(body.direction || "").trim();

        if (!runId || !shotId) {
          return json(res, 400, {
            error: "Storyboard move requires runId and shotId."
          });
        }

        try {
          moveBuildPlanShot(runId, shotId, direction, cwd);
          return json(res, 200, {
            ok: true,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }


      if (req.method === "POST" && url.pathname === "/api/asset-plan-update") {
        const body = await readBody(req);
        try {
          const result = updateAssetPlanNeed(
            String(body.runId || ""),
            String(body.needId || ""),
            body.changes && typeof body.changes === "object"
              ? body.changes
              : {},
            cwd
          );

          return json(res, 200, {
            ok: true,
            result: {
              plan: result.plan,
              validation: result.validation,
              invalidation: result.invalidation
            },
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/asset-plan-add") {
        const body = await readBody(req);
        try {
          const result = addAssetPlanNeed(
            String(body.runId || ""),
            {
              description: body.description,
              kind: body.kind,
              decision: body.decision,
              required_capabilities: Array.isArray(body.required_capabilities)
                ? body.required_capabilities
                : [],
              search_queries: Array.isArray(body.search_queries)
                ? body.search_queries
                : []
            },
            cwd
          );

          return json(res, 200, {
            ok: true,
            need_id: result.need_id,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/asset-plan-remove") {
        const body = await readBody(req);
        try {
          removeAssetPlanNeed(
            String(body.runId || ""),
            String(body.needId || ""),
            cwd
          );

          return json(res, 200, {
            ok: true,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/asset-plan-complete") {
        const body = await readBody(req);
        try {
          const result = completeAssetPlan(
            String(body.runId || ""),
            String(body.summary || "").trim(),
            cwd
          );

          return json(res, 200, {
            ok: true,
            validation: result.validation,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/library-update") {
        const body = await readBody(req);
        try {
          const id = String(body.id || "");
          const changes =
            body.changes && typeof body.changes === "object"
              ? body.changes
              : {};

          if (changes.approved === true) {
            const existing = readLibrary(cwd).find(item => item.id === id);
            if (!existing) {
              return json(res, 400, { error: "Library item not found." });
            }

            const gate = licenseGate(existing);
            if (!gate.allowed) {
              return json(res, 400, {
                error:
                  "Library item cannot be approved until its license is verified.",
                license_gate: gate
              });
            }
          }

          const result = updateLibraryItem(
            id,
            changes,
            cwd
          );

          return json(res, 200, {
            ok: true,
            item: result.item,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/library-remove") {
        const body = await readBody(req);
        try {
          const result = removeLibraryItem(
            String(body.id || ""),
            cwd
          );

          return json(res, 200, {
            ok: true,
            removed: result.removed,
            source_file_deleted: false,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/open-assets/search") {
        const body = await readBody(req);
        try {
          const result = await searchPolyHaven(
            String(body.query || ""),
            {
              type: String(body.type || "all"),
              limit: Math.max(1, Math.min(24, Number(body.limit || 12))),
              forceRefresh: Boolean(body.forceRefresh),
              cwd
            }
          );

          return json(res, 200, {
            ok: true,
            ...result
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/open-assets/track") {
        const body = await readBody(req);
        const asset = body.asset && typeof body.asset === "object"
          ? body.asset
          : {};
        const id = String(asset.id || "").trim();

        if (!/^[a-z0-9_-]+$/i.test(id)) {
          return json(res, 400, { error: "Poly Haven asset id is invalid." });
        }

        const kindByType = {
          model: "model",
          texture: "material",
          hdri: "hdri"
        };
        const kind = kindByType[String(asset.asset_type || "").toLowerCase()] || "asset";

        try {
          const result = upsertLibraryItem({
            id: `poly-haven-${id}`,
            kind,
            name: String(asset.name || id).trim(),
            description: String(asset.description || "").trim(),
            type: String(asset.asset_type || "other"),
            path: null,
            source_url: `https://polyhaven.com/a/${encodeURIComponent(id)}`,
            source_name: "Poly Haven",
            license_id: "CC0-1.0",
            commercial_allowed: true,
            redistribution_allowed: true,
            attribution_required: false,
            tags: Array.isArray(asset.tags)
              ? asset.tags.map(String).filter(Boolean)
              : [],
            tools: ["blender"],
            approved: true,
            quality_tier: "unknown"
          }, cwd);

          return json(res, 200, {
            ok: true,
            item: result.item,
            created: result.created,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/generation-request") {
        const body = await readBody(req);
        const runId = String(body.runId || "");
        const needId = body.needId ? String(body.needId) : null;

        try {
          let need = null;
          if (needId) {
            const record = readAssetPlan(runId, cwd);
            need = record?.plan?.needs?.find(item => item.id === needId) || null;
            if (!need) {
              return json(res, 400, { error: "Asset need not found." });
            }
          }

          const capability = body.capability ||
            generationCapabilityForNeed(need || { kind: body.kind });

          const result = createGenerationRequest({
            run_id: runId,
            need_id: needId,
            provider: body.provider,
            capability,
            prompt: body.prompt,
            operation: body.operation || "asset_generation",
            model: body.model,
            resolution: body.resolution,
            quantity: body.quantity,
            unit: body.unit || "credits",
            estimated_usd: body.estimated_usd
          }, {
            cwd,
            ownerApproved: Boolean(body.ownerApproved)
          });

          if (result.approval_required) {
            return json(res, 200, {
              ok: false,
              approval_required: true,
              budget: result.budget,
              provider: result.provider,
              state: buildStudioSnapshot(cwd)
            });
          }

          if (needId && result.request) {
            const existingNotes = Array.isArray(need?.notes)
              ? need.notes
              : [];
            const required = [
              ...(need?.required_capabilities || []),
              capability
            ];

            updateAssetPlanNeed(
              runId,
              needId,
              {
                decision: "build_new",
                required_capabilities: [...new Set(required)],
                notes: [
                  ...existingNotes,
                  `Generation request ${result.request.id} queued for ${result.request.provider_name}.`
                ]
              },
              cwd
            );
          }

          return json(res, 200, {
            ok: true,
            request: result.request,
            budget: result.budget,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }


      if (req.method === "POST" && url.pathname === "/api/render-register") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();
        const requested = String(body.path || "").trim();

        if (!runId || !requested) {
          return json(res, 400, {
            error: "Render registration requires runId and path."
          });
        }

        const file = resolveWorkspaceMedia(cwd, requested);
        if (!file) {
          return json(res, 400, {
            error: "Render artifact is missing or outside the workspace."
          });
        }

        const ext = path.extname(file).toLowerCase();
        if (![".mp4", ".mov", ".m4v", ".webm", ".mkv"].includes(ext)) {
          return json(res, 400, {
            error: "Render artifact must be a supported video file."
          });
        }

        const technical = probeRender(file);
        if (!technical.ok) {
          return json(res, 400, {
            error:
              "Render artifact failed technical validation: " +
              (technical.errors || []).join(", "),
            technical
          });
        }

        const relative = path.relative(cwd, file).split(path.sep).join("/");
        const result = runCli(
          cliPath,
          cwd,
          [
            "checkpoint",
            runId,
            "render",
            "completed",
            "--artifact",
            relative,
            "--note",
            "Render artifact registered from AurorA Studio UI."
          ]
        );

        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
        });
      }

      if (req.method === "POST" && url.pathname === "/api/review-refresh") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();

        if (!runId) {
          return json(res, 400, { error: "Review refresh requires runId." });
        }

        const snapshot = buildStudioSnapshot(cwd);
        const active = snapshot.active_run;
        if (!active || active.id !== runId) {
          return json(res, 400, { error: "Active run not found." });
        }

        const video =
          active.review?.video?.path ||
          active.render?.artifact?.path;

        if (!video) {
          return json(res, 400, {
            error: "No registered render exists for review."
          });
        }

        const result = runCli(
          cliPath,
          cwd,
          ["review", "create", runId, "--video", video]
        );

        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
        });
      }

      if (req.method === "POST" && url.pathname === "/api/revision") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();
        const kind = String(body.kind || "fix").trim();
        const note = String(body.note || "").trim();
        const shotId = body.shotId == null
          ? null
          : String(body.shotId).trim();

        try {
          const result = requestRevision(
            runId,
            {
              kind,
              note,
              shotId: shotId || null
            },
            cwd
          );

          return json(res, 200, {
            ok: true,
            revision: result.revision,
            state: buildStudioSnapshot(cwd)
          });
        } catch (error) {
          return json(res, 400, { error: error.message });
        }
      }

      if (req.method === "POST" && url.pathname === "/api/approve") {
        const body = await readBody(req);
        const runId = String(body.runId || "").trim();

        if (!runId || body.confirm !== true) {
          return json(res, 400, {
            error: "Final approval requires runId and explicit confirmation."
          });
        }

        const validation = validateReviewReportFile(runId, cwd);
        if (!validation.can_complete_post_review) {
          return json(res, 400, {
            error:
              "The current render has not passed AurorA review. " +
              (validation.errors || []).join("; "),
            validation
          });
        }

        const postReview = runCli(
          cliPath,
          cwd,
          ["checkpoint", runId, "post_render_review", "completed"]
        );
        if (!postReview.ok) {
          return json(res, 400, {
            error: postReview.stderr || "Could not complete post-render review."
          });
        }

        const approval = runCli(
          cliPath,
          cwd,
          [
            "checkpoint",
            runId,
            "approval",
            "completed",
            "--approved",
            "--note",
            "Owner approved the reviewed render in AurorA Studio."
          ]
        );
        if (!approval.ok) {
          return json(res, 400, {
            error: approval.stderr || "Could not record owner approval."
          });
        }

        const review = readReviewReport(runId, cwd);
        const learning = readLearningReview(runId, cwd);
        let finalization = null;

        if (learning?.review?.status === "completed" && review?.report?.video) {
          const finalized = runCli(
            cliPath,
            cwd,
            [
              "finalize",
              runId,
              "--video",
              review.report.video
            ]
          );

          finalization = {
            ok: finalized.ok,
            result: parseCliJson(finalized.stdout),
            error: finalized.ok
              ? null
              : finalized.stderr || "Finalization needs attention."
          };
        }

        const state = buildStudioSnapshot(cwd);

        return json(res, 200, {
          ok: true,
          approved: true,
          finalized: Boolean(finalization?.ok),
          finalization,
          needs_learning:
            !learning || learning.review?.status !== "completed",
          handoff: state.agent?.handoff || null,
          state
        });
      }


      if (req.method === "POST" && url.pathname === "/api/project") {
        const body = await readBody(req);
        const changes = body.changes && typeof body.changes === "object"
          ? body.changes
          : {};

        for (const [field, value] of Object.entries(changes)) {
          if (!PROJECT_FIELDS.has(field)) {
            return json(res, 400, { error: `Project field is not editable from Studio UI: ${field}` });
          }

          const result = runCli(cliPath, cwd, ["project", "set", field, cliValue(value)]);
          if (!result.ok) {
            return json(res, 400, {
              error: result.stderr || `Could not update project field: ${field}`
            });
          }
        }

        return json(res, 200, {
          ok: true,
          state: buildStudioSnapshot(cwd)
        });
      }

      if (req.method === "POST" && url.pathname === "/api/resources") {
        const body = await readBody(req);
        const snapshot = buildStudioSnapshot(cwd);
        if (!snapshot.configured) {
          return json(res, 400, { error: "Set up the AurorA workspace first." });
        }

        const incoming = body.resources && typeof body.resources === "object"
          ? body.resources
          : {};
        const mergedResources = { ...(snapshot.workspace?.resources || {}) };

        for (const [key, value] of Object.entries(incoming)) {
          if (!RESOURCE_FIELDS.has(key)) {
            return json(res, 400, { error: `Resource setting is not editable: ${key}` });
          }
          mergedResources[key] = key === "local_paths"
            ? (Array.isArray(value) ? value.map(String) : [])
            : Boolean(value);
        }

        const { local_paths = [], ...providerResources } = mergedResources;
        const result = runConfiguredSetup(cliPath, cwd, {
          product: snapshot.project?.product || "",
          purpose: snapshot.project?.purpose || "",
          website: snapshot.project?.website || "",
          mode: snapshot.workspace?.mode || "direct",
          resources: providerResources,
          local_paths,
          agents: "none",
          install_hyperframes: false
        });

        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
        });
      }

      if (req.method === "POST" && url.pathname === "/api/setup") {
        const body = await readBody(req);
        const mode = ["direct", "director"].includes(body.mode) ? body.mode : "direct";
        const resources = body.resources && typeof body.resources === "object"
          ? body.resources
          : {};

        const safeResources = {};
        for (const key of RESOURCE_FIELDS) {
          if (!(key in resources)) continue;
          safeResources[key] = key === "local_paths"
            ? (Array.isArray(resources[key]) ? resources[key].map(String) : [])
            : Boolean(resources[key]);
        }

        const { local_paths = [], ...providerResources } = safeResources;
        const result = runConfiguredSetup(cliPath, cwd, {
          product: String(body.product || "").trim(),
          purpose: String(body.purpose || "").trim(),
          website: String(body.website || "").trim(),
          mode,
          resources: providerResources,
          local_paths,
          agents: body.install_agents === false ? "none" : "all",
          install_hyperframes: body.install_hyperframes !== false
        });

        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
        });
      }

      if (req.method === "POST" && url.pathname === "/api/update-check") {
        const result = runCli(cliPath, cwd, ["update", "check"]);
        return json(res, result.ok ? 200 : 400, {
          ...result,
          update: parseCliJson(result.stdout)
        });
      }

      if (req.method === "GET" && url.pathname === "/media") {
        const requested = url.searchParams.get("path");
        const file = resolveWorkspaceMedia(cwd, requested);
        if (!file) return json(res, 404, { error: "Media not found." });

        const stat = fs.statSync(file);
        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Content-Length": stat.size,
          "Cache-Control": "no-store"
        });
        fs.createReadStream(file).pipe(res);
        return;
      }

      if (req.method !== "GET") return json(res, 405, { error: "Method not allowed." });

      const file = safeStaticFile(url.pathname);
      if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        return json(res, 404, { error: "Not found." });
      }

      const body = fs.readFileSync(file);
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Content-Length": body.length,
        "Cache-Control": "no-store"
      });
      res.end(body);
    } catch (error) {
      json(res, 500, { error: error.message });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : port;
  const url = `http://${host}:${actualPort}/?token=${token}`;

  if (open) openBrowser(url);

  return {
    server,
    token,
    host,
    port: actualPort,
    url,
    close: () => new Promise(resolve => server.close(resolve))
  };
}
