import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = path.resolve(HERE, "../knowledge/providers/registry.json");

function readRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
}

function readWorkspace(cwd) {
  const file = path.join(cwd, ".aurora", "workspace.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

export function listProviders(cwd = process.cwd()) {
  const workspace = readWorkspace(cwd);
  const resources = workspace?.resources || {};

  return readRegistry().providers.map(provider => {
    const accountAvailable = Boolean(resources[provider.resource_flag]);
    const browserControlRequired = provider.kind === "browser";
    const browserControlAvailable = Boolean(resources.browser_control);
    const available =
      accountAvailable &&
      (!browserControlRequired || browserControlAvailable);

    return {
      ...provider,
      account_available: accountAvailable,
      browser_control_required: browserControlRequired,
      browser_control_available: browserControlAvailable,
      available,
      blocked_reason:
        accountAvailable && browserControlRequired && !browserControlAvailable
          ? "browser_control_unavailable"
          : null
    };
  });
}

export function availableProviders(cwd = process.cwd()) {
  return listProviders(cwd).filter(provider => provider.available);
}

export function providersFor(capability, cwd = process.cwd()) {
  const q = String(capability || "").toLowerCase();
  return availableProviders(cwd)
    .map(provider => ({
      ...provider,
      capability_score: provider.best_for.reduce((score, item) => {
        const text = item.toLowerCase();
        if (!q) return score;
        if (text.includes(q) || q.includes(text)) return score + 4;
        const words = q.split(/\s+/).filter(Boolean);
        return score + words.filter(word => text.includes(word)).length;
      }, 0)
    }))
    .sort((a, b) => b.capability_score - a.capability_score);
}
