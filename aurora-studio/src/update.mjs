import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_RELEASE = path.resolve(HERE, "../release.json");
const DEFAULT_MANIFEST_URL =
  "https://raw.githubusercontent.com/bassam1998new-ops/hyperframe/main/aurora-studio/release.json";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function localRelease() {
  return readJson(LOCAL_RELEASE);
}

export function compareVersions(a, b) {
  const parse = value => String(value || "0.0.0")
    .split(".")
    .map(part => Number.parseInt(part.replace(/\D.*$/, ""), 10) || 0)
    .slice(0, 3);

  const av = parse(a);
  const bv = parse(b);
  while (av.length < 3) av.push(0);
  while (bv.length < 3) bv.push(0);

  for (let i = 0; i < 3; i++) {
    if (av[i] > bv[i]) return 1;
    if (av[i] < bv[i]) return -1;
  }
  return 0;
}

export async function fetchReleaseManifest({
  url = DEFAULT_MANIFEST_URL,
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("This Node runtime does not provide fetch.");
  }

  const response = await fetchImpl(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "AurorA-Studio-Updater/0.2"
    }
  });

  if (!response.ok) {
    throw new Error(`Update manifest returned HTTP ${response.status}`);
  }

  const manifest = await response.json();
  if (manifest?.product !== "AurorA Studio" || !manifest?.latest_version) {
    throw new Error("Remote update manifest is invalid.");
  }

  return { manifest, url };
}

export async function checkForUpdate(options = {}) {
  const local = localRelease();
  const remote = await fetchReleaseManifest(options);
  const cmp = compareVersions(remote.manifest.latest_version, local.latest_version);

  return {
    current_version: local.latest_version,
    latest_version: remote.manifest.latest_version,
    update_available: cmp > 0,
    same_version: cmp === 0,
    local_newer: cmp < 0,
    channel: remote.manifest.channel,
    notes: remote.manifest.notes || { new: [], fixed: [] },
    public_install_ready: Boolean(remote.manifest.public_install_ready),
    package_name: remote.manifest.package_name || null,
    workspace_schema_version:
      Number(remote.manifest.workspace_schema_version || 0) || null,
    install_command:
      remote.manifest.public_install_ready && remote.manifest.package_name
        ? `npm install -g ${remote.manifest.package_name}@${remote.manifest.latest_version}`
        : null,
    manifest_url: remote.url
  };
}

function auroraDir(cwd) {
  return path.join(cwd, ".aurora");
}

function backupRoot(cwd) {
  return path.join(auroraDir(cwd), "backups");
}

function safeStamp(date = new Date()) {
  return date.toISOString().replace(/[-:.]/g, "");
}

function copyFileIfExists(source, destination) {
  if (!fs.existsSync(source)) return false;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return true;
}

export function backupWorkspaceState(cwd = process.cwd()) {
  const root = auroraDir(cwd);
  if (!fs.existsSync(root)) {
    throw new Error("Workspace is not configured.");
  }

  const dir = path.join(backupRoot(cwd), safeStamp());
  fs.mkdirSync(dir, { recursive: true });

  const files = [
    "workspace.json",
    "project.json",
    "discovery.json",
    "decisions.jsonl",
    "lessons.jsonl",
    "learning-proposals.jsonl"
  ];

  const copied = [];
  for (const name of files) {
    if (copyFileIfExists(path.join(root, name), path.join(dir, name))) copied.push(name);
  }

  for (const folder of ["references", "library", "styles"]) {
    const source = path.join(root, folder);
    if (!fs.existsSync(source)) continue;
    fs.cpSync(source, path.join(dir, folder), { recursive: true });
    copied.push(folder + "/");
  }

  const runsSource = path.join(root, "runs");
  if (fs.existsSync(runsSource)) {
    const runsTarget = path.join(dir, "runs");
    fs.cpSync(runsSource, runsTarget, {
      recursive: true,
      filter: source => {
        const relative = path.relative(runsSource, source);
        if (!relative) return true;
        return !relative.split(path.sep).includes("temp");
      }
    });
    copied.push("runs/");
  }

  return { backup_dir: dir, copied };
}

export function workspaceSchemaVersion(cwd = process.cwd()) {
  const file = path.join(auroraDir(cwd), "workspace.json");
  if (!fs.existsSync(file)) return null;
  const workspace = readJson(file);
  return Number(workspace.schema_version || 0);
}

export function planWorkspaceMigration({
  cwd = process.cwd(),
  targetVersion = localRelease().workspace_schema_version
} = {}) {
  const current = workspaceSchemaVersion(cwd);
  if (current === null) {
    return {
      needed: false,
      blocked: true,
      reason: "workspace_not_configured",
      current_version: null,
      target_version: targetVersion,
      steps: []
    };
  }

  if (current > targetVersion) {
    return {
      needed: false,
      blocked: true,
      reason: "workspace_newer_than_cli",
      current_version: current,
      target_version: targetVersion,
      steps: []
    };
  }

  if (current === targetVersion) {
    return {
      needed: false,
      blocked: false,
      reason: null,
      current_version: current,
      target_version: targetVersion,
      steps: []
    };
  }

  return {
    needed: true,
    blocked: true,
    reason: "no_builtin_migration_path",
    current_version: current,
    target_version: targetVersion,
    steps: []
  };
}


export function listWorkspaceBackups(cwd = process.cwd()) {
  const root = backupRoot(cwd);
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const dir = path.join(root, entry.name);
      const stat = fs.statSync(dir);

      return {
        id: entry.name,
        backup_dir: dir,
        created_at: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

export function activeProductionRuns(cwd = process.cwd()) {
  const root = path.join(auroraDir(cwd), "runs");
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(entry => {
      const stateFile = path.join(root, entry.name, "state.json");
      if (!fs.existsSync(stateFile)) return [];

      try {
        const state = readJson(stateFile);
        if (state.status === "completed") return [];

        return [{
          run_id: state.run_id || entry.name,
          task: state.task || entry.name,
          status: state.status || "unknown",
          current_stage: state.current_stage || null,
          updated_at: state.updated_at || null
        }];
      } catch {
        return [{
          run_id: entry.name,
          task: entry.name,
          status: "invalid_state",
          current_stage: null,
          updated_at: null
        }];
      }
    })
    .sort((a, b) =>
      String(b.updated_at || "").localeCompare(String(a.updated_at || ""))
    );
}

export function updateSafetyPlan({
  cwd = process.cwd(),
  targetWorkspaceSchemaVersion = localRelease().workspace_schema_version,
  manifest = null
} = {}) {
  const local = localRelease();
  const targetSchema =
    Number(
      targetWorkspaceSchemaVersion ||
      manifest?.workspace_schema_version ||
      local.workspace_schema_version
    ) || local.workspace_schema_version;

  const migration = planWorkspaceMigration({
    cwd,
    targetVersion: targetSchema
  });
  const active_runs = activeProductionRuns(cwd);
  const backups = listWorkspaceBackups(cwd);
  const publicInstallReady =
    manifest?.public_install_ready ??
    local.public_install_ready ??
    false;
  const packageName =
    manifest?.package_name ||
    local.package_name ||
    null;

  const blockers = [];

  if (active_runs.length) {
    blockers.push({
      code: "active_production",
      message: "Finish or finalize active production before applying an AurorA update."
    });
  }

  if (migration.blocked) {
    blockers.push({
      code: "workspace_migration_blocked",
      message:
        migration.reason === "workspace_newer_than_cli"
          ? "This workspace is newer than the installed AurorA package."
          : migration.reason === "workspace_not_configured"
            ? "AurorA workspace is not configured."
            : "No safe workspace migration path exists for this update."
    });
  }

  if (!publicInstallReady || !packageName) {
    blockers.push({
      code: "public_package_not_ready",
      message: "AurorA public package/update apply is not enabled yet."
    });
  }

  blockers.push({
    code: "update_apply_not_implemented",
    message: "This build can safely check, plan and back up updates, but does not apply package updates yet."
  });

  return {
    current_version: local.latest_version,
    target_workspace_schema_version: targetSchema,
    migration,
    active_runs,
    latest_backup: backups[0] || null,
    backup_count: backups.length,
    public_install_ready: Boolean(publicInstallReady),
    package_name: packageName,
    safe_to_prepare:
      active_runs.length === 0 &&
      !migration.blocked,
    apply_supported: false,
    can_apply: false,
    blockers
  };
}
