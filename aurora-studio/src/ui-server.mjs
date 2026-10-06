import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildStudioSnapshot, resolveWorkspaceMedia } from "./ui-data.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI_ROOT = path.resolve(HERE, "../ui");

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

        const args = ["plan", task];
        if (body.referenceId) args.push("--reference", String(body.referenceId));
        const result = runCli(cliPath, cwd, args);
        return json(res, result.ok ? 200 : 400, {
          ...result,
          state: buildStudioSnapshot(cwd)
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
