import {
  commaList,
  escapeHtml,
  listValue
} from "../format.js";

const $ = selector => document.querySelector(selector);

export function renderSettings(next, { dirty = false } = {}) {
  const toolList = $("#settings-tools");

  toolList.innerHTML = (next.tools || []).map(tool => `
    <div class="status-row">
      <div class="status-main">
        <i class="status-led ${tool.available ? "ok" : tool.required ? "warn" : ""}"></i>
        <div>
          <b>${escapeHtml(tool.name)}</b>
          <small>${tool.required ? "Required core" : "Optional engine"}</small>
        </div>
      </div>
      <span class="status-value">${
        tool.available ? "Detected" : tool.required ? "Missing" : "Not detected"
      }</span>
    </div>
  `).join("");

  const runtime = next.runtime || {};
  const runtimeRows = [
    {
      name: "Node",
      ok: Boolean(runtime.node?.ok),
      value: runtime.node?.version
        ? "v" + runtime.node.version.replace(/^v/, "")
        : "Unknown",
      detail: "AurorA runtime"
    },
    {
      name: "FFmpeg",
      ok: Boolean(runtime.ffmpeg?.available),
      value: runtime.ffmpeg?.available ? "Detected" : "Missing",
      detail: runtime.ffmpeg?.available
        ? "Media/render runtime"
        : runtime.ffmpeg?.install_hint || "Required"
    },
    {
      name: "ffprobe",
      ok: Boolean(runtime.ffprobe?.available),
      value: runtime.ffprobe?.available ? "Detected" : "Not detected",
      detail: "Render validation"
    },
    {
      name: "AurorA system",
      ok: Boolean(next.system?.installed),
      value: next.system?.installed_version || "Missing",
      detail: next.system?.needs_sync
        ? "Sync needed"
        : "Managed knowledge/runtime"
    },
    {
      name: "Obsidian",
      ok: Boolean(next.integrations?.obsidian?.available),
      value: next.integrations?.obsidian?.available
        ? "Detected"
        : "Optional",
      detail:
        next.integrations?.obsidian?.note ||
        "Optional knowledge UI"
    }
  ];

  $("#runtime-status").innerHTML = runtimeRows.map(row => `
    <div class="status-row">
      <div class="status-main">
        <i class="status-led ${row.ok ? "ok" : "warn"}"></i>
        <div>
          <b>${escapeHtml(row.name)}</b>
          <small>${escapeHtml(row.detail)}</small>
        </div>
      </div>
      <span class="status-value">${escapeHtml(row.value)}</span>
    </div>
  `).join("");

  if (dirty) return;

  const resources = next.workspace?.resources || {};
  const settings = $("[data-view-panel='settings']");

  for (const name of [
    "browser_control",
    "chatgpt_browser",
    "google_flow",
    "meta_ai",
    "elevenlabs"
  ]) {
    const input = settings.querySelector('[name="' + name + '"]');
    if (input) input.checked = Boolean(resources[name]);
  }

  const paths = settings.querySelector('[name="local_paths"]');
  if (paths) paths.value = listValue(resources.local_paths || []);
}

export function resourceChanges() {
  const settings = $("[data-view-panel='settings']");
  const resources = {};

  for (const name of [
    "browser_control",
    "chatgpt_browser",
    "google_flow",
    "meta_ai",
    "elevenlabs"
  ]) {
    const input = settings.querySelector('[name="' + name + '"]');
    resources[name] = Boolean(input?.checked);
  }

  const paths = settings.querySelector('[name="local_paths"]');
  resources.local_paths = commaList(paths?.value || "");

  return resources;
}
