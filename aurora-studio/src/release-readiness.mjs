import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(HERE, "..");
const EXPECTED_REPOSITORY = "https://github.com/bassam1998new-ops/hyperframe.git";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function evaluateReleaseReadiness({
  packageJson,
  release,
  root = PACKAGE_ROOT
}) {
  const blockers = [];
  const warnings = [];

  const name = String(packageJson?.name || "").trim();
  const version = String(packageJson?.version || "").trim();
  const releaseVersion = String(release?.latest_version || "").trim();

  if (!name) blockers.push("package_name_missing");
  if (/(-local|local$)/i.test(name)) blockers.push("package_name_is_local_placeholder");
  if (packageJson?.private === true) blockers.push("package_is_private");

  if (!release?.public_install_ready) blockers.push("release_public_install_not_enabled");
  if (!release?.package_name) blockers.push("release_package_name_missing");

  const hyperframesVersion = String(release?.hyperframes_version || "").trim();
  if (release?.public_install_ready && !hyperframesVersion) {
    blockers.push("hyperframes_version_missing");
  } else if (
    hyperframesVersion &&
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(hyperframesVersion)
  ) {
    blockers.push("hyperframes_version_must_be_exact");
  }
  if (release?.package_name && name && release.package_name !== name) {
    blockers.push("release_package_name_mismatch");
  }

  if (!version || !releaseVersion || version !== releaseVersion) {
    blockers.push("package_release_version_mismatch");
  }

  const licenseFile = path.join(root, "LICENSE");
  const readmeFile = path.join(root, "README.md");
  if (!fs.existsSync(licenseFile)) blockers.push("license_file_missing");
  if (!fs.existsSync(readmeFile)) blockers.push("readme_missing");

  const bins = packageJson?.bin && typeof packageJson.bin === "object"
    ? Object.values(packageJson.bin)
    : [];
  if (!bins.length) blockers.push("cli_bin_missing");

  for (const bin of bins) {
    if (!fs.existsSync(path.resolve(root, String(bin)))) {
      blockers.push(`cli_bin_target_missing:${bin}`);
    }
  }

  const repositoryUrl = String(packageJson?.repository?.url || "").trim();
  if (!repositoryUrl) {
    blockers.push("repository_url_missing");
  } else if (repositoryUrl !== EXPECTED_REPOSITORY) {
    blockers.push("repository_url_mismatch");
  }

  if (packageJson?.publishConfig?.access !== "public") {
    warnings.push("publish_access_not_explicitly_public");
  }

  return {
    ready: blockers.length === 0,
    package: {
      name: name || null,
      version: version || null,
      private: Boolean(packageJson?.private)
    },
    release: {
      package_name: release?.package_name || null,
      version: releaseVersion || null,
      public_install_ready: Boolean(release?.public_install_ready),
      channel: release?.channel || null,
      hyperframes_version: hyperframesVersion || null
    },
    blockers,
    warnings,
    recommended_publish_security: "npm trusted publishing via GitHub OIDC after the package identity exists"
  };
}

export function releaseReadiness(root = PACKAGE_ROOT) {
  const packageJson = readJson(path.join(root, "package.json"));
  const release = readJson(path.join(root, "release.json"));
  return evaluateReleaseReadiness({ packageJson, release, root });
}
