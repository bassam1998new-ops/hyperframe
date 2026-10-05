import { spawnSync } from "node:child_process";

function findOnPath(command) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [command], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map(x => x.trim()).find(Boolean) || null;
}

export function findObsidianCli() {
  return findOnPath("obsidian");
}

export function obsidianInfo() {
  const executable = findObsidianCli();
  if (!executable) {
    return {
      available: false,
      executable: null,
      note: "Install/enable the official Obsidian CLI to use this optional integration."
    };
  }

  const result = spawnSync(executable, ["help"], {
    encoding: "utf8",
    timeout: 15000
  });

  return {
    available: result.status === 0,
    executable,
    help_available: result.status === 0,
    note: result.status === 0
      ? "Obsidian CLI ready."
      : "CLI found, but Obsidian may need to be updated, enabled, or running."
  };
}

export function searchObsidian(query, { vault = null, limit = 20 } = {}) {
  const executable = findObsidianCli();
  if (!executable) throw new Error("Obsidian CLI is not installed or not on PATH.");

  const args = [
    "search",
    `query=${query}`,
    "format=json"
  ];
  if (vault) args.push(`vault=${vault}`);

  const result = spawnSync(executable, args, {
    encoding: "utf8",
    timeout: 30000,
    maxBuffer: 16 * 1024 * 1024
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Obsidian search failed").trim());
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout || "[]");
  } catch {
    parsed = result.stdout.trim();
  }

  if (Array.isArray(parsed)) return parsed.slice(0, Math.max(1, Number(limit || 20)));
  return parsed;
}
