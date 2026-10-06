import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadRun } from "./governance.mjs";
import { listProviders } from "./providers.mjs";
import {
  checkPaidAction,
  recordUsage
} from "./usage.mjs";

function requestFile(run) {
  return path.join(run.dir, "generation-requests.jsonl");
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];

  return raw.split("\n").filter(Boolean).flatMap(line => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

export function readGenerationRequests(
  runId,
  cwd = process.cwd()
) {
  const run = loadRun(cwd, runId);
  return readJsonl(requestFile(run));
}

function providerById(id, cwd) {
  return listProviders(cwd).find(provider => provider.id === id) || null;
}

export function generationCapabilityForNeed(need = {}) {
  const kind = String(need.kind || "").toLowerCase();

  if (kind === "video") return "video_generation";
  if (kind === "audio") return "audio_generation";
  if (["model", "rig", "animation", "material", "hdri"].includes(kind)) {
    return "3d_asset_generation";
  }
  return "image_generation";
}

export function createGenerationRequest(
  input,
  {
    cwd = process.cwd(),
    ownerApproved = false
  } = {}
) {
  const run = loadRun(cwd, input.run_id);

  if (run.state.checkpoints?.finalize?.status === "completed") {
    throw new Error("Finalized runs cannot create generation requests.");
  }

  const provider = providerById(input.provider, cwd);
  if (!provider) throw new Error("Unknown generation provider.");
  if (!provider.available) {
    throw new Error(
      provider.blocked_reason === "browser_control_unavailable"
        ? `${provider.name} is configured but browser control is unavailable.`
        : `${provider.name} is not configured for this workspace.`
    );
  }

  const prompt = String(input.prompt || "").trim();
  if (!prompt) throw new Error("Generation request needs a prompt.");

  const quantity =
    input.quantity === null || input.quantity === undefined || input.quantity === ""
      ? 0
      : Number(input.quantity);

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error("Generation quantity must be a non-negative number.");
  }

  const estimatedUsd =
    input.estimated_usd === null ||
    input.estimated_usd === undefined ||
    input.estimated_usd === ""
      ? null
      : Number(input.estimated_usd);

  const budget = checkPaidAction({
    run_id: input.run_id,
    provider: provider.id,
    operation: String(input.operation || "asset_generation"),
    quantity,
    unit: String(input.unit || "credits"),
    estimated_usd: estimatedUsd
  }, cwd);

  if (
    budget.allowed === false &&
    budget.action === "block"
  ) {
    throw new Error(
      "Generation request exceeds the run budget cap."
    );
  }

  if (
    budget.allowed === false &&
    budget.action === "ask_owner" &&
    !ownerApproved
  ) {
    return {
      created: false,
      approval_required: true,
      budget,
      provider: {
        id: provider.id,
        name: provider.name
      }
    };
  }

  const now = new Date().toISOString();
  const request = {
    schema_version: 1,
    id: crypto.randomUUID(),
    run_id: input.run_id,
    need_id: input.need_id ? String(input.need_id) : null,
    provider: provider.id,
    provider_name: provider.name,
    capability: String(
      input.capability ||
      "asset_generation"
    ),
    prompt,
    model: input.model ? String(input.model) : null,
    resolution: input.resolution ? String(input.resolution) : null,
    quantity,
    unit: String(input.unit || "credits"),
    estimated_usd: estimatedUsd,
    status: "pending_agent",
    owner_approved_cost: Boolean(
      ownerApproved &&
      budget.action === "ask_owner"
    ),
    created_at: now,
    updated_at: now
  };

  const file = requestFile(run);
  fs.appendFileSync(file, JSON.stringify(request) + "\n");

  if (quantity > 0 || estimatedUsd !== null) {
    recordUsage({
      run_id: input.run_id,
      phase: "estimate",
      provider: provider.id,
      operation: String(input.operation || "asset_generation"),
      model: request.model,
      quantity,
      unit: request.unit,
      usd: estimatedUsd,
      resolution: request.resolution,
      note: `generation_request:${request.id}`
    }, cwd);
  }

  return {
    created: true,
    approval_required: false,
    request,
    budget,
    file
  };
}
