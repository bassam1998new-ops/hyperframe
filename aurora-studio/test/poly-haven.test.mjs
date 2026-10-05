import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { searchPolyHaven, getPolyHavenFiles } from "../src/open-assets/poly-haven.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-polyhaven-"));
}

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return data; }
  };
}

test("Poly Haven search ranks matching CC0 assets", async () => {
  const cwd = temp();
  let userAgent = null;

  const fetchImpl = async (_url, init) => {
    userAgent = init.headers["User-Agent"];
    return response({
      studio_small_09: {
        name: "Small Studio",
        description: "Soft studio lighting HDRI",
        category: "Studio",
        tags: ["studio", "soft", "light"],
        type: 0,
        max_resolution: [16384, 8192]
      },
      forest_path: {
        name: "Forest Path",
        description: "Outdoor forest",
        category: "Nature",
        tags: ["forest", "trees"],
        type: 0
      }
    });
  };

  const result = await searchPolyHaven("soft studio light", {
    type: "hdris",
    cwd,
    fetchImpl
  });

  assert.match(userAgent, /AurorA-Studio/);
  assert.equal(result.results[0].id, "studio_small_09");
  assert.equal(result.results[0].license.id, "CC0-1.0");
  assert.equal(result.results[0].source.api_credit_required, true);
});

test("Poly Haven search uses fresh local cache", async () => {
  const cwd = temp();
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return response({
      chair: { name: "Chair", tags: ["chair"], category: "Furniture", type: 2 }
    });
  };

  await searchPolyHaven("chair", { type: "models", cwd, fetchImpl });
  const second = await searchPolyHaven("chair", {
    type: "models",
    cwd,
    fetchImpl: async () => {
      throw new Error("network should not be used");
    }
  });

  assert.equal(calls, 1);
  assert.equal(second.cached, true);
  assert.equal(second.results[0].asset_type, "model");
});

test("Poly Haven files endpoint preserves provider/license metadata", async () => {
  const result = await getPolyHavenFiles("chair", {
    fetchImpl: async (url, init) => {
      assert.match(String(url), /\/files\/chair$/);
      assert.match(init.headers["User-Agent"], /AurorA-Studio/);
      return response({ blend: { "1k": { url: "https://example.test/chair.blend" } } });
    }
  });

  assert.equal(result.license, "CC0-1.0");
  assert.equal(result.api_credit_required, true);
  assert.ok(result.files.blend);
});
