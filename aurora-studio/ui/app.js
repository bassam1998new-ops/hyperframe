import { createApi, createMediaUrl } from "./app/api.js";
import { createViewRouter } from "./app/router.js";
import { createToast } from "./app/toast.js";
import { initTooltips } from "./app/tooltip.js";
import {
  renderActivity,
  renderBoard,
  renderPreview,
  renderTools,
  renderUsage
} from "./app/views/create.js";
import {
  renderFullLibrary,
  renderLibraryShelf
} from "./app/views/library.js";
import {
  fillProjectForm,
  projectChanges
} from "./app/views/project.js";
import {
  renderSettings,
  resourceChanges
} from "./app/views/settings.js";
import { renderUpdates } from "./app/views/updates.js";
import {
  daypart,
  money,
  titleCase
} from "./app/format.js";

const params = new URLSearchParams(location.search);
const token = params.get("token") || "";

let state = null;
let busy = false;
let pollTimer = null;
let projectDirty = false;
let settingsDirty = false;
let libraryFilter = "all";
let libraryQuery = "";
let remoteUpdate = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const api = createApi(token);
const mediaUrl = createMediaUrl(token);

const toast = createToast();
const router = createViewRouter({
  getState: () => state,
  titleCase
});
const switchView = router.switchView;

function render(next) {
  state = next;
  const configured = Boolean(next.configured);
  const run = next.active_run;
  const product = next.project?.product || "your project";

  if (!configured) {
    switchView("setup", false);
  } else if (router.currentView === "setup") {
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
  renderPreview(run, mediaUrl);
  renderBoard(run);
  renderActivity(next.activity || []);
  renderUsage(run);
  renderLibraryShelf(next.library || [], mediaUrl);
  renderFullLibrary(next.library_all || [], {
    query: libraryQuery,
    filter: libraryFilter,
    mediaUrl
  });
  fillProjectForm(next.project || {}, { dirty: projectDirty });
  renderSettings(next, { dirty: settingsDirty });
  renderUpdates(next, remoteUpdate);
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
  renderFullLibrary(state?.library_all || [], {
    query: libraryQuery,
    filter: libraryFilter,
    mediaUrl
  });
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
    renderUpdates(state, remoteUpdate);
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
        resources: {
          browser_control: data.get("browser_control") === "on",
          chatgpt_browser: data.get("chatgpt_browser") === "on",
          google_flow: data.get("google_flow") === "on",
          meta_ai: data.get("meta_ai") === "on",
          elevenlabs: data.get("elevenlabs") === "on"
        }
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

  router.setInitial(router.initialFromLocation());
  switchView(router.currentView, false);
  await refresh(true);
  initTooltips();
  pollTimer = setInterval(() => refresh(false), 2500);
}

window.addEventListener("beforeunload", () => clearInterval(pollTimer));
start();
