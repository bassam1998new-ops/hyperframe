const params = new URLSearchParams(location.search);
const token = params.get("token") || "";

let state = null;
let busy = false;
let pollTimer = null;
let currentView = "create";
let projectDirty = false;
let settingsDirty = false;
let libraryFilter = "all";
let libraryQuery = "";
let remoteUpdate = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function titleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function money(value) {
  return "$" + Number(value || 0).toFixed(2);
}

function listValue(value) {
  return Array.isArray(value) ? value.join(", ") : String(value || "");
}

function commaList(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function nested(object, dotted) {
  return dotted.split(".").reduce((value, key) => value?.[key], object);
}

function mediaUrl(media) {
  if (!media?.path) return null;
  return "/media?path=" + encodeURIComponent(media.path) + "&token=" + encodeURIComponent(token);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("X-Aurora-Token", token);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.stderr || "AurorA request failed.");
  }
  return payload;
}

function toast(message, error = false) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.toggle("error", error);
  node.classList.add("show");
  clearTimeout(node._timer);
  node._timer = setTimeout(() => node.classList.remove("show"), 2800);
}

function daypart() {
  const hour = new Date().getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function switchView(view, updateHash = true) {
  const allowed = new Set(["create", "library", "project", "settings", "updates", "setup"]);
  if (!allowed.has(view)) view = "create";
  if (state && !state.configured) view = "setup";

  currentView = view;
  $$("[data-view-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });
  $$(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  $("#crumb-view").textContent = titleCase(view === "setup" ? "Setup" : view);
  document.body.classList.toggle("setup-mode", view === "setup");

  if (updateHash && view !== "setup") {
    history.replaceState(null, "", location.pathname + location.search + "#" + view);
  }
}

function phaseRows(run) {
  if (!run) return [];
  const stages = new Map((run.stages || []).map(stage => [stage.id, stage]));
  const groups = run.mode === "director"
    ? [
        ["Direction", ["understand", "concept", "mood"]],
        ["Assets", ["assets"]],
        ["Build", ["routing", "build_plan", "build"]],
        ["Review", ["pre_render_review", "render", "post_render_review"]],
        ["Ready", ["approval", "finalize"]]
      ]
    : [
        ["Understand", ["understand", "concept", "mood"]],
        ["Assets", ["assets"]],
        ["Build", ["routing", "build_plan", "build"]],
        ["Review", ["pre_render_review", "render", "post_render_review"]],
        ["Ready", ["approval", "finalize"]]
      ];

  return groups.map(([label, ids]) => {
    const items = ids.map(id => stages.get(id)).filter(Boolean);
    const current = items.find(item => item.current);
    let status = current ? "in_progress" : "pending";

    if (items.some(item => item.status === "failed")) status = "failed";
    else if (items.some(item => item.status === "awaiting_human")) status = "awaiting_human";
    else if (items.length && items.every(item => ["completed", "skipped"].includes(item.status))) status = "completed";
    else if (items.some(item => ["completed", "in_progress"].includes(item.status))) status = "in_progress";

    return {
      label,
      status,
      detail: current
        ? "Current: " + titleCase(current.id)
        : status === "completed"
          ? "Complete"
          : "Waiting"
    };
  });
}

function renderPreview(run) {
  const stage = $("#preview-stage");
  const status = $("#preview-status");
  const meta = $("#preview-meta");
  const title = $("#preview-title");
  const detail = $("#preview-detail");
  const chips = $("#route-chips");

  title.textContent = run?.task || "AurorA Studio";
  detail.textContent = run
    ? titleCase(run.current_stage) + " · " + titleCase(run.mode) + " mode"
    : "Waiting for a production run";

  const statusText = run ? titleCase(run.status) : "Ready";
  status.innerHTML = "<i></i> " + escapeHtml(statusText);
  meta.textContent = run?.review?.decision && run.review.decision !== "PENDING"
    ? "Review: " + run.review.decision
    : run?.preview
      ? "Live workspace render"
      : "No render yet";

  chips.innerHTML = (run?.route || []).map(route =>
    '<span class="route-chip">' + escapeHtml(titleCase(route)) + "</span>"
  ).join("");

  if (!run?.preview) {
    stage.innerHTML = `
      <div class="preview-empty">
        <div class="aurora-scene">
          <div class="scene-orbit orbit-one"></div>
          <div class="scene-orbit orbit-two"></div>
          <div class="scene-glow"></div>
          <div class="scene-word">AURORA</div>
        </div>
        <div class="preview-empty-copy">
          <strong>${run ? "No preview file yet" : "Nothing rendering yet"}</strong>
          <span>${run ? escapeHtml(titleCase(run.current_stage)) + " is in progress." : "Start a run and AurorA will show the current render here."}</span>
        </div>
      </div>`;
    return;
  }

  const src = mediaUrl(run.preview);
  if (run.preview.type === "video") {
    stage.innerHTML = '<video controls playsinline src="' + escapeHtml(src) + '"></video>';
  } else {
    stage.innerHTML = '<img alt="Current AurorA render" src="' + escapeHtml(src) + '" />';
  }
}

function renderBoard(run) {
  const eyebrow = $("#board-eyebrow");
  const title = $("#board-title");
  const list = $("#board-list");
  const count = $("#board-count");
  const footer = $("#board-footer-text");

  if (!run) {
    eyebrow.textContent = "PRODUCTION";
    title.textContent = "No active run";
    count.textContent = "0";
    list.innerHTML = '<div class="empty-card">Start a run to see the real production board.</div>';
    footer.textContent = "AurorA keeps routing and checkpoints behind the scenes.";
    return;
  }

  const shots = run.shots || [];
  const director = run.mode === "director";
  eyebrow.textContent = director ? "DIRECTOR BOARD" : "PRODUCTION";
  title.textContent = run.task;

  if (shots.length) {
    count.textContent = String(shots.length);
    footer.textContent = "Each shot uses the engine selected by the real build plan.";
    list.innerHTML = shots.map(shot => `
      <div class="board-row">
        <div class="board-number">${shot.number}</div>
        <div class="board-copy">
          <strong>${escapeHtml(shot.purpose || shot.id)}</strong>
          <p>${escapeHtml(shot.output || "Output not set")}</p>
        </div>
        <div class="board-side">
          <span class="engine-chip">${escapeHtml(titleCase(shot.engine))}</span>
          <span class="quality-chip">${escapeHtml(titleCase(shot.quality || "normal"))}</span>
        </div>
      </div>
    `).join("");
    return;
  }

  const phases = phaseRows(run);
  count.textContent = String(phases.length);
  footer.textContent = director
    ? "Concept and final approval stay visible. Internal routing stays behind the scenes."
    : "Direct mode keeps the internal stage machine simple.";
  list.innerHTML = phases.map((phase, index) => `
    <div class="board-row ${phase.status === "in_progress" ? "current" : ""}">
      <div class="board-number">${index + 1}</div>
      <div class="board-copy">
        <strong>${escapeHtml(phase.label)}</strong>
        <p>${escapeHtml(phase.detail)}</p>
      </div>
      <div class="board-side">
        <span class="stage-state ${escapeHtml(phase.status)}">${escapeHtml(titleCase(phase.status))}</span>
      </div>
    </div>
  `).join("");
}

function renderActivity(activity) {
  const list = $("#activity-list");
  if (!activity?.length) {
    list.innerHTML = '<div class="empty-card compact">No run activity yet.</div>';
    return;
  }

  list.innerHTML = activity.map(item => `
    <div class="activity-item ${escapeHtml(item.status || "info")}">
      <strong><i></i>${escapeHtml(titleCase(item.title))}</strong>
      <p>${escapeHtml(item.detail || titleCase(item.status || "updated"))}</p>
    </div>
  `).join("");
}

function renderTools(tools) {
  const available = (tools || []).filter(tool => tool.available).length;
  $("#tool-summary").textContent = tools?.length
    ? available + " of " + tools.length + " production tools reachable"
    : "Workspace tools not detected yet";
  $("#studio-dot").style.background = available ? "var(--green)" : "var(--amber)";

  $("#tool-chips").innerHTML = (tools || []).map(tool => `
    <span class="tool-chip ${tool.available ? "on" : ""}">
      <i></i>${escapeHtml(tool.name)}
    </span>
  `).join("") || '<span class="tool-chip"><i></i>No tool state</span>';
}

function renderUsage(run) {
  const node = $("#usage-content");
  if (!run?.usage) {
    node.textContent = "No paid usage recorded.";
    return;
  }

  const pieces = [];
  if (run.usage.actual_usd > 0) pieces.push("Known spend " + money(run.usage.actual_usd));
  for (const [provider, values] of Object.entries(run.usage.units || {})) {
    for (const [unit, amount] of Object.entries(values)) {
      pieces.push(titleCase(provider) + ": " + amount + " " + unit);
    }
  }

  node.textContent = pieces.join(" · ") || "No paid usage recorded.";
}

function libraryCard(item) {
  let media = '<span class="library-kind">' + escapeHtml(titleCase(item.kind || item.type || "asset")) + "</span>";
  if (item.preview?.type === "image") {
    media = '<img alt="" src="' + escapeHtml(mediaUrl(item.preview)) + '" />';
  } else if (item.preview?.type === "video") {
    media = '<video muted preload="metadata" src="' + escapeHtml(mediaUrl(item.preview)) + '"></video>';
  }

  const tools = (item.tools || []).map(titleCase).join(" + ");
  return `
    <article class="library-card">
      <div class="library-thumb">${media}</div>
      <div class="library-body">
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(tools || titleCase(item.type || item.kind || "asset"))} · ${escapeHtml(item.license || "unknown")}</p>
      </div>
    </article>
  `;
}

function renderLibraryShelf(items) {
  const grid = $("#library-grid");
  if (!items?.length) {
    grid.innerHTML = '<div class="empty-card">Your approved assets, styles and media will appear here.</div>';
    return;
  }
  grid.innerHTML = items.map(libraryCard).join("");
}

function libraryMatches(item) {
  const q = libraryQuery.trim().toLowerCase();
  const haystack = [
    item.name,
    item.kind,
    item.type,
    item.license,
    ...(item.tools || [])
  ].filter(Boolean).join(" ").toLowerCase();

  if (q && !haystack.includes(q)) return false;
  if (libraryFilter === "all") return true;
  if (libraryFilter === "style") return item.kind === "style";
  if (libraryFilter === "audio") return item.kind === "audio" || item.type === "audio";
  if (libraryFilter === "font") return item.kind === "font" || item.type === "font";
  if (libraryFilter === "model") {
    return ["model", "rig", "animation", "material", "hdri"].includes(item.kind) ||
      /3d|glb|gltf|blend|fbx|obj/i.test(item.type || "");
  }
  if (libraryFilter === "asset") {
    return !["style", "audio", "font", "model", "rig", "animation", "material", "hdri"].includes(item.kind);
  }
  return item.kind === libraryFilter;
}

function renderFullLibrary(items) {
  const matches = (items || []).filter(libraryMatches);
  $("#library-full-count").textContent = matches.length + " item" + (matches.length === 1 ? "" : "s");
  $("#library-full-grid").innerHTML = matches.length
    ? matches.map(libraryCard).join("")
    : '<div class="empty-card">No tracked library items match this filter.</div>';
}

function fillProjectForm(project) {
  if (projectDirty) return;
  const form = $("#project-form");
  if (!form) return;

  const fields = [
    "product",
    "website",
    "purpose",
    "audience",
    "offer",
    "positioning",
    "brand.personality",
    "brand.colors",
    "brand.fonts",
    "brand.logo_paths",
    "brand.avoid",
    "content.languages",
    "content.channels",
    "creative.preferred_moods",
    "creative.avoid_moods",
    "creative.recurring_constraints"
  ];

  for (const field of fields) {
    const input = form.elements.namedItem(field);
    if (!input) continue;
    const value = nested(project || {}, field);
    input.value = Array.isArray(value) ? listValue(value) : String(value || "");
  }
}

function projectChanges() {
  const form = $("#project-form");
  const listFields = new Set([
    "audience",
    "brand.personality",
    "brand.colors",
    "brand.fonts",
    "brand.logo_paths",
    "brand.avoid",
    "content.languages",
    "content.channels",
    "creative.preferred_moods",
    "creative.avoid_moods",
    "creative.recurring_constraints"
  ]);

  const changes = {};
  for (const element of [...form.elements]) {
    if (!element.name) continue;
    changes[element.name] = listFields.has(element.name)
      ? commaList(element.value)
      : element.value.trim();
  }
  return changes;
}

function renderSettings(next) {
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
      <span class="status-value">${tool.available ? "Detected" : tool.required ? "Missing" : "Not detected"}</span>
    </div>
  `).join("");

  const runtime = next.runtime || {};
  const runtimeRows = [
    {
      name: "Node",
      ok: Boolean(runtime.node?.ok),
      value: runtime.node?.version ? "v" + runtime.node.version.replace(/^v/, "") : "Unknown",
      detail: "AurorA runtime"
    },
    {
      name: "FFmpeg",
      ok: Boolean(runtime.ffmpeg?.available),
      value: runtime.ffmpeg?.available ? "Detected" : "Missing",
      detail: runtime.ffmpeg?.available ? "Media/render runtime" : runtime.ffmpeg?.install_hint || "Required"
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
      detail: next.system?.needs_sync ? "Sync needed" : "Managed knowledge/runtime"
    }
  ];

  $("#runtime-status").innerHTML = runtimeRows.map(row => `
    <div class="status-row">
      <div class="status-main">
        <i class="status-led ${row.ok ? "ok" : "warn"}"></i>
        <div><b>${escapeHtml(row.name)}</b><small>${escapeHtml(row.detail)}</small></div>
      </div>
      <span class="status-value">${escapeHtml(row.value)}</span>
    </div>
  `).join("");

  if (!settingsDirty) {
    const resources = next.workspace?.resources || {};
    const settingsView = $("[data-view-panel='settings']");
    for (const name of ["browser_control", "chatgpt_browser", "google_flow", "meta_ai", "elevenlabs"]) {
      const input = settingsView.querySelector('[name="' + name + '"]');
      if (input) input.checked = Boolean(resources[name]);
    }
    const paths = settingsView.querySelector('[name="local_paths"]');
    if (paths) paths.value = listValue(resources.local_paths || []);
  }
}

function resourceChanges() {
  const settingsView = $("[data-view-panel='settings']");
  const resources = {};
  for (const name of ["browser_control", "chatgpt_browser", "google_flow", "meta_ai", "elevenlabs"]) {
    const input = settingsView.querySelector('[name="' + name + '"]');
    resources[name] = Boolean(input?.checked);
  }
  const paths = settingsView.querySelector('[name="local_paths"]');
  resources.local_paths = commaList(paths?.value || "");
  return resources;
}

function renderUpdates(next) {
  const release = remoteUpdate || next.release || {};
  $("#update-version").textContent = "Version " + (release.latest_version || release.version || "—");

  if (remoteUpdate) {
    $("#update-state").textContent = remoteUpdate.update_available
      ? "Update available from the configured release channel."
      : remoteUpdate.local_newer
        ? "This local build is newer than the published release."
        : "You are up to date.";
  } else {
    $("#update-state").textContent =
      "Channel: " + titleCase(next.release?.channel || "dev") +
      (next.release?.public_install_ready ? "" : " · public install not enabled yet");
  }

  const notes = release.notes || next.release?.notes || { new: [], fixed: [] };
  $("#update-new").innerHTML = (notes.new || []).map(item =>
    "<li>" + escapeHtml(item) + "</li>"
  ).join("") || "<li>No new notes.</li>";
  $("#update-fixed").innerHTML = (notes.fixed || []).map(item =>
    "<li>" + escapeHtml(item) + "</li>"
  ).join("") || "<li>No fixes listed.</li>";
}

function render(next) {
  state = next;
  const configured = Boolean(next.configured);
  const run = next.active_run;
  const product = next.project?.product || "your project";

  if (!configured) {
    switchView("setup", false);
  } else if (currentView === "setup") {
    switchView((location.hash || "#create").slice(1) || "create", false);
  }

  $("#daypart").textContent = daypart();
  $("#hero-title").textContent = run
    ? run.status === "completed"
      ? "The last run is complete."
      : "AurorA is working."
    : configured
      ? "Ready for " + product + "."
      : "Set up this workspace first.";

  $("#hero-subtitle").textContent = run
    ? titleCase(run.current_stage) + " · " + (run.task || "Current production")
    : configured
      ? "Direct keeps it fast. Director gives you concepts first."
      : "Complete the short first-run setup.";

  $("#stat-finals").textContent = String(next.stats?.finals ?? 0);
  $("#stat-spend").textContent = money(next.active_run?.usage?.actual_usd ?? 0);
  $("#stat-library").textContent = String(next.stats?.library_approved ?? 0);

  const mode = next.workspace?.mode || "direct";
  $$(".mode-switch button").forEach(button => {
    button.classList.toggle("active", button.dataset.mode === mode);
    button.disabled = !configured || busy;
  });

  const pill = $("#run-pill");
  const pillLabel = pill.querySelector(".run-label");
  $("#run-pill-text").textContent = run ? run.task : configured ? "Ready to create" : "Setup required";
  pillLabel.textContent = run ? titleCase(run.current_stage).toUpperCase() : "READY";

  $("#prompt-input").disabled = !configured || busy;
  $("#prompt-input").placeholder = configured ? "What are we making?" : "Run setup first";

  renderTools(next.tools || []);
  renderPreview(run);
  renderBoard(run);
  renderActivity(next.activity || []);
  renderUsage(run);
  renderLibraryShelf(next.library || []);
  renderFullLibrary(next.library_all || []);
  fillProjectForm(next.project || {});
  renderSettings(next);
  renderUpdates(next);
}

async function refresh(showError = false) {
  try {
    const next = await api("/api/state");
    render(next);
  } catch (error) {
    if (showError) toast(error.message, true);
  }
}

async function changeMode(mode) {
  if (busy || !state?.configured || state.workspace?.mode === mode) return;
  busy = true;
  try {
    const result = await api("/api/mode", {
      method: "POST",
      body: JSON.stringify({ mode })
    });
    render(result.state);
    toast("AurorA mode: " + titleCase(mode));
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
  }
}

$("#prompt-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (busy || !state?.configured) return;

  const input = $("#prompt-input");
  const task = input.value.trim();
  if (!task) return;

  busy = true;
  input.disabled = true;
  toast("Starting AurorA production…");

  try {
    const result = await api("/api/plan", {
      method: "POST",
      body: JSON.stringify({ task })
    });
    if (!result.ok) throw new Error(result.stderr || "AurorA could not start the run.");
    input.value = "";
    render(result.state);
    switchView("create");
    toast("Run created. Your agent can continue the production.");
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
    input.disabled = false;
  }
});

$$(".mode-switch button").forEach(button =>
  button.addEventListener("click", () => changeMode(button.dataset.mode))
);

$$("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    if (!state?.configured && button.dataset.view !== "setup") return;
    switchView(button.dataset.view);
  });
});

$("#refresh-button").addEventListener("click", () => refresh(true));

$("#library-search").addEventListener("input", event => {
  libraryQuery = event.target.value;
  renderFullLibrary(state?.library_all || []);
});

$$(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    libraryFilter = button.dataset.filter;
    $$(".filter-button").forEach(item => item.classList.toggle("active", item === button));
    renderFullLibrary(state?.library_all || []);
  });
});

$("#project-form").addEventListener("input", () => {
  projectDirty = true;
});

$("#project-save").addEventListener("click", async () => {
  if (busy || !state?.configured) return;
  busy = true;
  try {
    const result = await api("/api/project", {
      method: "POST",
      body: JSON.stringify({ changes: projectChanges() })
    });
    projectDirty = false;
    render(result.state);
    toast("Project brain updated.");
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
  }
});

const settingsView = $("[data-view-panel='settings']");
settingsView.addEventListener("input", () => {
  settingsDirty = true;
});

$("#settings-save").addEventListener("click", async () => {
  if (busy || !state?.configured) return;
  busy = true;
  try {
    const result = await api("/api/resources", {
      method: "POST",
      body: JSON.stringify({ resources: resourceChanges() })
    });
    settingsDirty = false;
    render(result.state);
    toast("Studio resources updated.");
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
  }
});

$("#update-check").addEventListener("click", async () => {
  if (busy || !state?.configured) return;
  busy = true;
  $("#update-check").textContent = "Checking…";
  try {
    const result = await api("/api/update-check", {
      method: "POST",
      body: "{}"
    });
    remoteUpdate = result.update;
    renderUpdates(state);
    toast(remoteUpdate?.update_available ? "AurorA update available." : "AurorA is up to date.");
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
    $("#update-check").textContent = "Check for update";
  }
});

$("#setup-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (busy) return;

  const form = event.currentTarget;
  const data = new FormData(form);
  busy = true;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = "Setting up…";

  try {
    const result = await api("/api/setup", {
      method: "POST",
      body: JSON.stringify({
        product: String(data.get("product") || "").trim(),
        website: String(data.get("website") || "").trim(),
        purpose: String(data.get("purpose") || "").trim(),
        mode: String(data.get("mode") || "direct"),
        install_hyperframes: data.get("install_hyperframes") === "on",
        install_agents: data.get("install_agents") === "on",
        resources: {}
      })
    });

    render(result.state);
    switchView("create");
    toast("AurorA Studio is ready.");
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
    submit.disabled = false;
    submit.textContent = "Set up Studio";
  }
});

async function start() {
  if (!token) {
    toast("Open Studio using the URL printed by aurora-studio ui.", true);
    return;
  }

  const initial = (location.hash || "#create").slice(1);
  if (["create", "library", "project", "settings", "updates"].includes(initial)) {
    currentView = initial;
  }

  switchView(currentView, false);
  await refresh(true);
  pollTimer = setInterval(() => refresh(false), 2500);
}

window.addEventListener("beforeunload", () => clearInterval(pollTimer));
start();
