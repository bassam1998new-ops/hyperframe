import test from "node:test";
import assert from "node:assert/strict";
import {
  recommendAssetSources,
  licenseGate,
  sourceImportDefaults
} from "../src/asset-sources.mjs";

test("3D material search prefers safe automated CC0 sources", () => {
  const results = recommendAssetSources("3d material hdri");
  assert.equal(results[0].id, "poly-haven");
  assert.ok(results.some(x => x.id === "ambientcg"));
});

test("unknown license blocks use", () => {
  const gate = licenseGate({
    license: {
      id: "unknown",
      commercial_allowed: null,
      redistribution_allowed: null,
      attribution_required: null
    }
  });
  assert.equal(gate.allowed, false);
  assert.equal(gate.reason, "license_not_verified");
});

test("commercial asset that forbids redistribution can be used but not bundled", () => {
  const asset = {
    license: {
      id: "QAL-1.0",
      commercial_allowed: true,
      redistribution_allowed: false,
      attribution_required: false
    }
  };
  assert.equal(licenseGate(asset).allowed, true);
  const bundleGate = licenseGate(asset, { forBundling: true });
  assert.equal(bundleGate.allowed, false);
  assert.equal(bundleGate.reason, "raw_redistribution_forbidden");
});

test("Quaternius requires per-asset license verification", () => {
  const defaults = sourceImportDefaults("quaternius");
  assert.equal(defaults.requires_verification, true);
  assert.equal(defaults.license_id, "unknown");
});

test("Poly Haven import defaults are CC0 and redistributable", () => {
  const defaults = sourceImportDefaults("poly-haven");
  assert.equal(defaults.requires_verification, false);
  assert.equal(defaults.license_id, "CC0-1.0");
  assert.equal(defaults.redistribution_allowed, true);
});
