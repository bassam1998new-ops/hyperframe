
import { commaList, escapeHtml, listValue } from "../format.js";

const $ = selector => document.querySelector(selector);

function toolDetail(tool, diagnostic) {
  if (tool.id === "hyperframe") {
    const installed = tool.version || (diagnostic && diagnostic.version) || "Version not read";
    const tested = tool.tested_version || "No tested version recorded";
    const compatibility =
      tool.compatible === true
        ? "Exact tested version"
        : tool.compatible === false
          ? "Different from tested version"
          : "Compatibility not verified";
    return installed + " · tested " + tested + " · " + compatibility;
  }

  if (diagnostic && diagnostic.version) return diagnostic.version;
  if (tool.executable) return tool.executable;
  return tool.available ? "Detected" : "Not detected";
}

function toolActions(tool) {
  const actions = [
    '<button class="text-button settings-action" type="button" data-tool-action="doctor" data-tool="' +
      escapeHtml(tool.id) +
      '">Test</button>'
  ];

  if (tool.id === "hyperframe") {
    if (!tool.available) {
      actions.push(
        '<button class="aurora-button settings-action" data-variant="primary" type="button" data-tool-action="install" data-tool="hyperframe">Install tested core</button>'
      );
    } else {
      actions.push(
        '<button class="text-button settings-action" type="button" data-tool-action="upgrade_check" data-tool="hyperframe">Check update</button>'
      );
    }
  }

  return actions.join("");
}

function agentCard(name, label, value) {
  const skillCount = (value && value.skills ? value.skills.length : 0);
  const expected = (value && value.expected_skill_count) || 0;
  const hasAnything =
    Boolean(value && value.pointer) ||
    skillCount > 0 ||
    Boolean(value && value.hook);
  const ready =
    Boolean(value && value.complete) &&
    Boolean(value && value.hook) &&
    Boolean(value && value.live_hook);

  return (
    '<article class="agent-settings-card">' +
      '<div class="agent-settings-head">' +
        '<div class="status-main">' +
          '<i class="status-led ' + (ready ? "ok" : hasAnything ? "warn" : "") + '"></i>' +
          '<div>' +
            '<b>' + escapeHtml(label) + '</b>' +
            '<small>' +
              (ready
                ? (
                    name === "codex"
                      ? "AurorA integration is ready. For reliable live activity, launch Codex from the project root."
                      : "AurorA pointer, skills, context hook and live activity hooks are ready."
                  )
                : hasAnything
                  ? "AurorA integration is partial; reinstall to repair it."
                  : "AurorA integration is not installed for this agent.") +
            '</small>' +
          '</div>' +
        '</div>' +
        '<span class="settings-agent-state">' + (ready ? "Ready" : hasAnything ? "Partial" : "Off") + '</span>' +
      '</div>' +
      '<div class="agent-settings-meta">' +
        '<span>Pointer <b>' + (value && value.pointer ? "Yes" : "No") + '</b></span>' +
        '<span>Skills <b>' + skillCount + "/" + expected + '</b></span>' +
        '<span>Context <b>' + (value && value.hook ? "Yes" : "No") + '</b></span>' +
        '<span>Live <b>' + (value && value.live_hook ? "Yes" : "No") + '</b></span>' +
      '</div>' +
      '<div class="agent-settings-actions">' +
        '<button class="aurora-button" type="button" data-agent-action="install" data-agent-target="' +
          escapeHtml(name) +
          '">' + (hasAnything ? "Reinstall" : "Install") + '</button>' +
        '<button class="text-button" type="button" data-agent-action="remove" data-agent-target="' +
          escapeHtml(name) +
          '" ' + (hasAnything ? "" : "disabled") + '>Remove</button>' +
      '</div>' +
    '</article>'
  );
}

function setBudgetHelp(mode) {
  const cap = $("#budget-cap");
  const help = $("#budget-help");
  if (!cap || !help) return;

  cap.required = mode === "cap";

  if (mode === "cap") {
    help.textContent =
      "Hard cap blocks known USD spend above the cap. AurorA still asks for owner approval above the threshold.";
  } else if (mode === "warn") {
    help.textContent =
      "Soft cap warns when known USD spend crosses the cap. Owner approval still applies above the threshold.";
  } else {
    help.textContent =
      "Track known USD spend and ask for owner approval above the threshold. Provider credits remain separate.";
  }
}

export function updateBudgetModeUi() {
  setBudgetHelp($("#budget-mode")?.value || "observe");
}

export function renderSettings(next, options = {}) {
  const dirty = Boolean(options.dirty);
  const diagnostics = options.diagnostics || {};
  const developerMode = Boolean(options.developerMode);
  const toolList = $("#settings-tools");

  toolList.innerHTML = (next.tools || []).map(tool => {
    const diagnostic = diagnostics[tool.id] || null;
    const state =
      tool.available
        ? tool.compatible === false
          ? "warn"
          : "ok"
        : tool.required
          ? "warn"
          : "";

    return (
      '<article class="settings-tool-row">' +
        '<div class="settings-tool-copy">' +
          '<div class="status-main">' +
            '<i class="status-led ' + state + '"></i>' +
            '<div><b>' + escapeHtml(tool.name) + '</b><small>' +
              (tool.required ? "Required core" : "Optional engine") +
            '</small></div>' +
          '</div>' +
          '<p>' + escapeHtml(toolDetail(tool, diagnostic)) + '</p>' +
        '</div>' +
        '<div class="settings-tool-actions">' + toolActions(tool) + '</div>' +
      '</article>'
    );
  }).join("");

  const runtime = next.runtime || {};
  const runtimeRows = [
    {
      name: "Node",
      ok: Boolean(runtime.node && runtime.node.ok),
      value: runtime.node && runtime.node.version ? "v" + runtime.node.version.replace(/^v/, "") : "Unknown",
      detail: "AurorA runtime"
    },
    {
      name: "FFmpeg",
      ok: Boolean(runtime.ffmpeg && runtime.ffmpeg.available),
      value: runtime.ffmpeg && runtime.ffmpeg.available ? "Detected" : "Missing",
      detail:
        runtime.ffmpeg && runtime.ffmpeg.available
          ? runtime.ffmpeg.path || "Media/render runtime"
          : (runtime.ffmpeg && runtime.ffmpeg.install_hint) || "Required"
    },
    {
      name: "ffprobe",
      ok: Boolean(runtime.ffprobe && runtime.ffprobe.available),
      value: runtime.ffprobe && runtime.ffprobe.available ? "Detected" : "Not detected",
      detail: (runtime.ffprobe && runtime.ffprobe.path) || "Render validation"
    },
    {
      name: "AurorA system",
      ok: Boolean(next.system && next.system.installed),
      value: (next.system && next.system.installed_version) || "Missing",
      detail:
        next.system && next.system.needs_sync
          ? "Sync needed"
          : "Managed knowledge/runtime"
    }
  ];

  $("#runtime-status").innerHTML = runtimeRows.map(row =>
    '<div class="status-row">' +
      '<div class="status-main">' +
        '<i class="status-led ' + (row.ok ? "ok" : "warn") + '"></i>' +
        '<div><b>' + escapeHtml(row.name) + '</b><small>' + escapeHtml(row.detail) + '</small></div>' +
      '</div>' +
      '<span class="status-value">' + escapeHtml(row.value) + '</span>' +
    '</div>'
  ).join("");

  const agents = (next.settings && next.settings.agents) || {};
  const expected = agents.expected_skill_count || 0;

  $("#settings-agents").innerHTML = [
    agentCard("claude", "Claude", {
      ...(agents.claude || {}),
      expected_skill_count: expected
    }),
    agentCard("codex", "Codex", {
      ...(agents.codex || {}),
      expected_skill_count: expected
    })
  ].join("");

  const obsidian = next.integrations && next.integrations.obsidian;
  $("#settings-obsidian-status").textContent =
    obsidian && obsidian.available ? "Obsidian detected" : "Obsidian optional";

  if (!dirty) {
    const resources = (next.workspace && next.workspace.resources) || {};
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

    const localPaths = settings.querySelector('[name="local_paths"]');
    if (localPaths) localPaths.value = listValue(resources.local_paths || []);

    const budget = (next.settings && next.settings.budget) || {};
    const mode = settings.querySelector('[name="budget_mode"]');
    const threshold = settings.querySelector('[name="budget_threshold"]');
    const cap = settings.querySelector('[name="budget_cap"]');

    if (mode) mode.value = budget.mode || "observe";
    if (threshold) threshold.value = String(budget.approval_threshold_usd ?? 1);
    if (cap) cap.value = budget.cap_usd == null ? "" : String(budget.cap_usd);

    const toolPaths = (next.settings && next.settings.tool_paths) || {};
    for (const key of ["blender", "after_effects", "ffmpeg"]) {
      const input = settings.querySelector('[name="tool_path_' + key + '"]');
      if (input) input.value = toolPaths[key] || "";
    }
  }

  updateBudgetModeUi();

  const saveStatus = $("#settings-save-status");
  if (saveStatus) {
    saveStatus.textContent = dirty ? "Unsaved changes" : "Saved";
    saveStatus.classList.toggle("dirty", dirty);
  }

  const pathValues = (next.settings && next.settings.paths) || {};
  $("#settings-path-readout").innerHTML = Object.entries(pathValues)
    .map(([key, value]) =>
      '<div><span>' +
      escapeHtml(key.replaceAll("_", " ")) +
      '</span><code>' +
      escapeHtml(value) +
      '</code></div>'
    )
    .join("");

  const raw = $("#settings-raw-diagnostics");
  if (raw) {
    raw.hidden = !developerMode;
    if (developerMode) {
      raw.textContent = JSON.stringify({
        tools: next.tools || [],
        runtime: next.runtime || {},
        system: next.system || {},
        integrations: next.integrations || {},
        settings: next.settings || {}
      }, null, 2);
    }
  }

  const developer = $("#settings-developer-mode");
  if (developer) developer.checked = developerMode;
}

export function settingsChanges() {
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
    resources[name] = Boolean(input && input.checked);
  }

  const localPaths = settings.querySelector('[name="local_paths"]');
  resources.local_paths = commaList((localPaths && localPaths.value) || "");

  const mode = settings.querySelector('[name="budget_mode"]')?.value || "observe";
  const thresholdRaw = settings.querySelector('[name="budget_threshold"]')?.value ?? "1";
  const capRaw = settings.querySelector('[name="budget_cap"]')?.value ?? "";

  const tool_paths = {};
  for (const key of ["blender", "after_effects", "ffmpeg"]) {
    const input = settings.querySelector('[name="tool_path_' + key + '"]');
    tool_paths[key] = String((input && input.value) || "").trim();
  }

  return {
    resources,
    budget: {
      mode,
      approval_threshold_usd: Number(thresholdRaw),
      cap_usd: String(capRaw).trim() === "" ? null : Number(capRaw)
    },
    tool_paths
  };
}
