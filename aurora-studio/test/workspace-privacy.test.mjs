import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ensureWorkspacePrivacyFiles } from "../src/workspace-privacy.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-privacy-"));
}

test("AurorA workspace is Git-ignored by default", () => {
  const cwd = temp();
  const result = ensureWorkspacePrivacyFiles(cwd);

  assert.ok(fs.existsSync(result.gitignore));
  assert.ok(fs.existsSync(result.readme));

  const ignore = fs.readFileSync(result.gitignore, "utf8");
  assert.match(ignore, /^\*/m);
  assert.match(ignore, /!\.gitignore/);
  assert.match(ignore, /!README\.md/);
});

test("privacy setup never overwrites a user-customized ignore file", () => {
  const cwd = temp();
  const aurora = path.join(cwd, ".aurora");
  fs.mkdirSync(aurora, { recursive: true });
  const file = path.join(aurora, ".gitignore");
  fs.writeFileSync(file, "# custom\nproject.json\n");

  ensureWorkspacePrivacyFiles(cwd);

  assert.equal(
    fs.readFileSync(file, "utf8"),
    "# custom\nproject.json\n"
  );
});
