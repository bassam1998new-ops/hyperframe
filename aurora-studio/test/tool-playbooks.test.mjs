import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

test("every production tool playbook in registry exists", () => {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, "knowledge", "tools", "registry.json"), "utf8")
  );

  for (const tool of registry.tools) {
    assert.ok(tool.playbook, `${tool.id} is missing a playbook`);
    const file = path.join(ROOT, tool.playbook);
    assert.ok(fs.existsSync(file), `${tool.id} playbook does not exist: ${tool.playbook}`);
  }
});
