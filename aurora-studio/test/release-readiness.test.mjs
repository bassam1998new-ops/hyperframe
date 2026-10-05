import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  evaluateReleaseReadiness,
  releaseReadiness
} from "../src/release-readiness.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-release-"));
}

test("current development package is intentionally not public-ready", () => {
  const result = releaseReadiness();
  assert.equal(result.ready, false);
  assert.ok(result.blockers.includes("package_name_is_local_placeholder"));
  assert.ok(result.blockers.includes("package_is_private"));
  assert.ok(result.blockers.includes("release_public_install_not_enabled"));
});

test("synthetic public package passes readiness gate", () => {
  const root = temp();
  fs.writeFileSync(path.join(root, "LICENSE"), "MIT");
  fs.writeFileSync(path.join(root, "README.md"), "# AurorA");
  fs.mkdirSync(path.join(root, "bin"), { recursive: true });
  fs.writeFileSync(path.join(root, "bin", "aurora.mjs"), "");

  const result = evaluateReleaseReadiness({
    root,
    packageJson: {
      name: "@matrix/aurora-studio",
      version: "1.0.0",
      private: false,
      bin: { "aurora-studio": "./bin/aurora.mjs" },
      repository: { url: "https://github.com/example/aurora" },
      publishConfig: { access: "public" }
    },
    release: {
      latest_version: "1.0.0",
      package_name: "@matrix/aurora-studio",
      public_install_ready: true,
      channel: "stable"
    }
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.blockers, []);
});
