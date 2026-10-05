import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  HYPERFRAMES_RANGE,
  ensureToolsPackage,
  hyperframesInstallPlan,
  installHyperframesCore
} from "../src/tool-install.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-tools-"));
}

test("workspace tools package is isolated under .aurora", () => {
  const cwd = temp();
  const result = ensureToolsPackage(cwd);

  assert.ok(result.prefix.includes(path.join(".aurora", "tools")));
  assert.ok(fs.existsSync(result.package_file));

  const pkg = JSON.parse(fs.readFileSync(result.package_file, "utf8"));
  assert.equal(pkg.private, true);
});

test("HyperFrames install plan does not modify project package.json", () => {
  const cwd = temp();
  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ name: "user-project" }));

  const plan = hyperframesInstallPlan(cwd);

  assert.ok(plan.args.includes("--prefix"));
  assert.ok(plan.args.includes(`hyperframes@${HYPERFRAMES_RANGE}`));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8")).name,
    "user-project"
  );
});

test("HyperFrames installer supports dry run without network", () => {
  const cwd = temp();
  const result = installHyperframesCore({ cwd, dryRun: true });

  assert.equal(result.dry_run, true);
  assert.ok(result.binary.includes("hyperframes"));
});
