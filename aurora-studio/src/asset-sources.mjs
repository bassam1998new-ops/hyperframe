import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(HERE, "../knowledge/assets/sources.json");

function registry() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function words(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function listAssetSources() {
  return registry().sources;
}

export function recommendAssetSources(query = "") {
  const q = words(query);

  return listAssetSources()
    .map(source => {
      let score = 0;
      const categories = source.categories.join(" ").toLowerCase();
      const notes = source.notes.join(" ").toLowerCase();

      for (const word of q) {
        if (categories.includes(word)) score += 4;
        if (source.name.toLowerCase().includes(word)) score += 3;
        if (notes.includes(word)) score += 1;
      }

      if (source.automation === "preferred") score += 2;
      if (source.license_policy === "library-wide" && source.default_license === "CC0-1.0") score += 2;
      if (source.automation === "discovery-only") score -= 1;

      return {
        id: source.id,
        name: source.name,
        url: source.url,
        categories: source.categories,
        automation: source.automation,
        license_policy: source.license_policy,
        score
      };
    })
    .filter(source => !q.length || source.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function sourceById(id) {
  return listAssetSources().find(source => source.id === id) || null;
}

export function licenseGate(asset, { forBundling = false } = {}) {
  const license = asset?.license || {};
  const id = String(license.id || "unknown").toUpperCase();

  if (license.commercial_allowed === false) {
    return {
      allowed: false,
      reason: "commercial_use_not_allowed",
      action: "do_not_use"
    };
  }

  if (forBundling && license.redistribution_allowed !== true) {
    return {
      allowed: false,
      reason: license.redistribution_allowed === false
        ? "raw_redistribution_forbidden"
        : "raw_redistribution_not_verified",
      action: "keep_external_reference_only"
    };
  }

  if (
    id === "UNKNOWN" ||
    license.commercial_allowed === null ||
    license.commercial_allowed === undefined
  ) {
    return {
      allowed: false,
      reason: "license_not_verified",
      action: "verify_original_source"
    };
  }

  return {
    allowed: true,
    reason: null,
    action: license.attribution_required
      ? "use_with_attribution"
      : "use"
  };
}

export function sourceImportDefaults(sourceId, verifiedLicenseId = null) {
  const source = sourceById(sourceId);
  if (!source) throw new Error(`Unknown asset source: ${sourceId}`);

  if (source.license_policy === "verify-each-asset" && !verifiedLicenseId) {
    return {
      source,
      license_id: "unknown",
      commercial_allowed: null,
      redistribution_allowed: null,
      attribution_required: null,
      requires_verification: true
    };
  }

  if (source.license_policy === "verify-original-source") {
    return {
      source,
      license_id: verifiedLicenseId || "unknown",
      commercial_allowed: null,
      redistribution_allowed: null,
      attribution_required: null,
      requires_verification: true
    };
  }

  return {
    source,
    license_id: verifiedLicenseId || source.default_license || "unknown",
    commercial_allowed: source.commercial_allowed,
    redistribution_allowed: source.raw_redistribution_allowed,
    attribution_required: source.attribution_required_for_asset,
    requires_verification: false
  };
}
