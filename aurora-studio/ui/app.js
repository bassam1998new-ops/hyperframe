const params = new URLSearchParams(location.search);
const token = params.get("token") || "";
let state = null;
let busy = false;
let pollTimer = null;

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

function renderLibrary(items) {
  const grid = $("#library-grid");
  $("#library-note").textContent = state?.stats
    ? state.stats.library_approved + " approved · " + state.stats.library_total + " total"
    : "Approved assets and styles first";

  if (!items?.length) {
    grid.innerHTML = '<div class="empty-card">Your approved assets, styles and media will appear here.</div>';
    return;
  }

  grid.innerHTML = items.map(item => {
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
  }).join("");
}

function render(next) {
  state = next;
  const configured = Boolean(next.configured);
  const run = next.active_run;
  const product = next.project?.product || "your project";

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
      : "Run aurora-studio setup, then refresh this page.";

  $("#stat-finals").textContent = String(next.stats?.finals ?? 0);
  $("#stat-spend").textContent = money(next.stats?.actual_usd ?? 0);
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
  renderLibrary(next.library || []);
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

$("[data-scroll='create']").addEventListener("click", () =>
  $("#create").scrollIntoView({ behavior: "smooth" })
);
$("[data-scroll='library']").addEventListener("click", () =>
  $("#library").scrollIntoView({ behavior: "smooth" })
);

$("#refresh-button").addEventListener("click", () => refresh(true));

async function start() {
  if (!token) {
    toast("Open Studio using the URL printed by aurora-studio ui.", true);
    return;
  }
  await refresh(true);
  pollTimer = setInterval(() => refresh(false), 2500);
}

window.addEventListener("beforeunload", () => clearInterval(pollTimer));
start();
