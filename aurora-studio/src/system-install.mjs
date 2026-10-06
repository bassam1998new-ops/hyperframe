import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(HERE, "..");

const SYSTEM_ITEMS = [
  "README.md",
  "package.json",
  "release.json",
  "studio.manifest.json",
  "bin",
  "src",
  "ui",
  "skills",
  "agent-skills",
  "knowledge",
  "schemas",
  path.join("hooks", "runtime"),
  "prompts",
  path.join("blender", "helpers")
];

function auroraDir(cwd = process.cwd()) {
  return path.join(cwd, ".aurora");
}

function systemDir(cwd = process.cwd()) {
  return path.join(auroraDir(cwd), "system");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function packageVersion() {
  return readJson(path.join(PACKAGE_ROOT, "package.json")).version;
}

function copyItem(relativePath, destinationRoot) {
  const source = path.join(PACKAGE_ROOT, relativePath);
  if (!fs.existsSync(source)) {
    throw new Error(`AurorA package is missing required system item: ${relativePath}`);
  }

  const destination = path.join(destinationRoot, relativePath);
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
  } else {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

export function syncSystemKnowledge(cwd = process.cwd()) {
  const root = auroraDir(cwd);
  fs.mkdirSync(root, { recursive: true });

  const target = systemDir(cwd);

  if (path.resolve(PACKAGE_ROOT) === path.resolve(target)) {
    const status = systemStatus(cwd);
    return {
      system_dir: target,
      studio_version: status.installed_version || packageVersion(),
      items: SYSTEM_ITEMS,
      no_op: true,
      source_is_workspace_snapshot: true
    };
  }
  const next = path.join(root, "system.__next__");
  const previous = path.join(root, "system.__previous__");

  fs.rmSync(next, { recursive: true, force: true });
  fs.rmSync(previous, { recursive: true, force: true });
  fs.mkdirSync(next, { recursive: true });

  for (const item of SYSTEM_ITEMS) copyItem(item, next);

  const metadata = {
    schema_version: 1,
    studio_version: packageVersion(),
    synced_at: new Date().toISOString(),
    managed: true,
    note: "Generated from the installed AurorA Studio package. Put user/project knowledge outside .aurora/system."
  };
  fs.writeFileSync(path.join(next, "system.json"), JSON.stringify(metadata, null, 2) + "\n");

  let movedPrevious = false;
  try {
    if (fs.existsSync(target)) {
      fs.renameSync(target, previous);
      movedPrevious = true;
    }

    fs.renameSync(next, target);
    fs.rmSync(previous, { recursive: true, force: true });
  } catch (error) {
    fs.rmSync(next, { recursive: true, force: true });
    if (movedPrevious && !fs.existsSync(target) && fs.existsSync(previous)) {
      fs.renameSync(previous, target);
    }
    throw error;
  }

  return {
    system_dir: target,
    studio_version: metadata.studio_version,
    items: SYSTEM_ITEMS
  };
}

export function systemStatus(cwd = process.cwd()) {
  const target = systemDir(cwd);
  const metadataFile = path.join(target, "system.json");

  if (!fs.existsSync(metadataFile)) {
    return {
      installed: false,
      system_dir: target,
      installed_version: null,
      package_version: packageVersion(),
      needs_sync: true
    };
  }

  const metadata = readJson(metadataFile);
  const current = packageVersion();

  return {
    installed: true,
    system_dir: target,
    installed_version: metadata.studio_version || null,
    package_version: current,
    needs_sync: metadata.studio_version !== current,
    synced_at: metadata.synced_at || null
  };
}
