import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CLI = path.join(ROOT, "bin", "aurora-studio.mjs");

test("current development package is blocked by fail-closed release gate", () => {
  const result = spawnSync(
    process.execPath,
    [CLI, "release", "gate"],
    {
      cwd: ROOT,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 2);

  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ready, false);
  assert.ok(parsed.blockers.includes("package_name_is_local_placeholder"));
  assert.ok(parsed.blockers.includes("release_public_install_not_enabled"));
});
