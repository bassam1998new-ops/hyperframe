import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createReference, referencesDir } from "./brain.mjs";

const ALLOWED_EXTENSIONS = new Set([
  ".mp4", ".mov", ".m4v", ".webm", ".mkv",
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg",
  ".pdf", ".txt", ".md", ".docx"
]);

export const MAX_REFERENCE_BYTES = 512 * 1024 * 1024;

function safeBaseName(value) {
  const base = path.basename(String(value || "reference"))
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return base.slice(0, 160) || "reference";
}

function role(value) {
  return value === "source_material" ? "source_material" : "visual";
}

function uniqueStoredName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const stem = path.basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "reference";

  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${stem}${ext}`;
}

function uniqueReferenceName(name, cwd) {
  const dir = referencesDir(cwd);
  const base = String(name || "Reference").trim() || "Reference";
  let candidate = base;
  let counter = 2;

  while (true) {
    const id = candidate
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "reference";

    if (!fs.existsSync(path.join(dir, `${id}.json`))) return candidate;
    candidate = `${base} (${counter++})`;
  }
}

export function validateReferenceFileName(filename) {
  const safe = safeBaseName(filename);
  const ext = path.extname(safe).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(
      "Unsupported reference file type. Use video, image, PDF, text/markdown, or DOCX."
    );
  }

  return {
    original_name: safe,
    extension: ext
  };
}

export function referenceFilesDir(cwd = process.cwd()) {
  return path.join(referencesDir(cwd), "files");
}

export function createUrlReference({
  name,
  url,
  referenceRole = "visual"
}, cwd = process.cwd()) {
  let parsed;
  try {
    parsed = new URL(String(url || ""));
  } catch {
    throw new Error("Reference URL is invalid.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Reference URL must use http or https.");
  }

  const finalName = uniqueReferenceName(
    name || parsed.hostname || "Reference",
    cwd
  );

  return createReference(finalName, {
    type: "url",
    value: parsed.toString(),
    role: role(referenceRole)
  }, cwd);
}

export async function storeReferenceUpload(req, {
  cwd = process.cwd(),
  filename,
  name = null,
  referenceRole = "visual",
  mime = null,
  maxBytes = MAX_REFERENCE_BYTES
} = {}) {
  const validated = validateReferenceFileName(filename);
  const declared = Number(req.headers?.["content-length"] || 0);

  if (declared > maxBytes) {
    throw new Error("Reference file is larger than the 512 MB Studio limit.");
  }

  const dir = referenceFilesDir(cwd);
  fs.mkdirSync(dir, { recursive: true });

  const storedName = uniqueStoredName(validated.original_name);
  const finalFile = path.join(dir, storedName);
  const tempFile = finalFile + ".uploading";

  let size = 0;

  try {
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(tempFile, { flags: "wx" });

      const fail = error => {
        output.destroy();
        reject(error);
      };

      req.on("data", chunk => {
        size += chunk.length;
        if (size > maxBytes) {
          req.destroy();
          fail(new Error("Reference file exceeded the 512 MB Studio limit."));
        }
      });

      req.on("error", fail);
      output.on("error", reject);
      output.on("finish", resolve);
      req.pipe(output);
    });

    if (size === 0) {
      throw new Error("Reference file is empty.");
    }

    fs.renameSync(tempFile, finalFile);

    const relative = path.relative(cwd, finalFile).split(path.sep).join("/");
    const displayName = uniqueReferenceName(
      name || path.basename(validated.original_name, validated.extension),
      cwd
    );

    const result = createReference(displayName, {
      type: "file",
      value: relative,
      role: role(referenceRole),
      mime: mime || "application/octet-stream",
      original_name: validated.original_name
    }, cwd);

    return {
      ...result,
      stored_file: finalFile,
      size_bytes: size
    };
  } catch (error) {
    fs.rmSync(tempFile, { force: true });
    if (fs.existsSync(finalFile) && !fs.existsSync(tempFile)) {
      // Keep finalized files only when a matching reference record exists.
      const refs = fs.readdirSync(referencesDir(cwd))
        .filter(item => item.endsWith(".json"))
        .some(item => {
          try {
            const data = JSON.parse(
              fs.readFileSync(path.join(referencesDir(cwd), item), "utf8")
            );
            return data.source?.value === path.relative(cwd, finalFile).split(path.sep).join("/");
          } catch {
            return false;
          }
        });
      if (!refs) fs.rmSync(finalFile, { force: true });
    }
    throw error;
  }
}
