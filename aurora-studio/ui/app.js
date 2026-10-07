import { createApi, createMediaUrl } from "./app/api.js";
import { createViewRouter } from "./app/router.js";
import { createToast } from "./app/toast.js";
import { initTooltips } from "./app/tooltip.js";
import { createReferenceWorkflow } from "./app/workflows/reference.js";
import { createIntentWorkflow } from "./app/workflows/create-intent.js";
import { createConceptWorkflow } from "./app/workflows/concepts.js";
import { createStoryboardWorkflow } from "./app/workflows/storyboard.js";
import { createAssetWorkflow } from "./app/workflows/assets.js";
import { createLibraryWorkflow } from "./app/workflows/library.js";
import { createReviewWorkflow } from "./app/workflows/review.js";
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
  projectChanges,
  renderProjectMeta,
  resetProjectField
} from "./app/views/project.js";
import {
  renderSettings,
  settingsChanges,
  updateBudgetModeUi
} from "./app/views/settings.js";
import { createSettingsWorkflow } from "./app/workflows/settings.js";
import { renderUpdates } from "./app/views/updates.js";
import { createUpdateWorkflow } from "./app/workflows/updates.js";
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

const referenceWorkflow = createReferenceWorkflow({
  api,
  getState: () => state,
  onState: next => render(next),
  mediaUrl,
  toast
});

const intentWorkflow = createIntentWorkflow({
  getState: () => state,
  referenceWorkflow,
  toast
});

const conceptWorkflow = createConceptWorkflow({
  api,
  getState: () => state,
  onState: next => render(next),
  toast
});

const storyboardWorkflow = createStoryboardWorkflow({
  api,
  getState: () => state,
  onState: next => render(next),
  toast
});

const assetWorkflow = createAssetWorkflow({
  api,
  getState: () => state,
  onState: next => render(next),
  mediaUrl,
  toast
});

const libraryWorkflow = createLibraryWorkflow({
  api,
  getState: () => state,
  onState: next => render(next),
  mediaUrl,
  toast,
  switchView,
  assetWorkflow
});

const reviewWorkflow = createReviewWorkflow({
  api,
  mediaUrl,
  getState: () => state,
  onState: next => render(next),
  toast
});


const settingsWorkflow = createSettingsWorkflow({
  api,
  getState: () => state,
  onState: next => render(next),
  toast
});


const updateWorkflow = createUpdateWorkflow({
  api,
  getState: () => state,
  onState: next => render(next),
  toast
});

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

  referenceWorkflow.sync(next);
  intentWorkflow.sync(next);

  renderTools(next.tools || []);
  renderPreview(run, mediaUrl);
  renderBoard(run, mediaUrl);
  conceptWorkflow.sync(next);
  storyboardWorkflow.sync(next);
  assetWorkflow.sync(next);
  libraryWorkflow.sync(next);
  reviewWorkflow.sync(next);
  renderActivity(next.activity || []);
  renderUsage(run);
  renderLibraryShelf(
    next.library || [],
    mediaUrl,
    id => libraryWorkflow.open(id)
  );
  renderFullLibrary(next.library_all || [], {
    query: libraryQuery,
    filter: libraryFilter,
    mediaUrl,
    onOpen: id => libraryWorkflow.open(id)
  });
  renderProjectMeta(next.project || {}, { dirty: projectDirty });
  renderSettings(next, {
    dirty: settingsDirty,
    diagnostics: settingsWorkflow.diagnostics,
    developerMode: settingsWorkflow.developerMode
  });
  renderUpdates(next, {
    remoteUpdate: updateWorkflow.remoteUpdate,
    safetyPlan: updateWorkflow.safetyPlan,
    hyperframesUpdate: updateWorkflow.hyperframesUpdate,
    dismissedVersion: updateWorkflow.dismissedVersion
  });
}

async function refresh(showError = false) {
  try {
    const next = await api("/api/state");
    render(next);
    window.__AURORA_STUDIO_READY__ = true;
    window.__AURORA_STUDIO_ERROR__ = null;
    document.documentElement.dataset.studioReady = "true";
    document.documentElement.removeAttribute("data-studio-error");
  } catch (error) {
    window.__AURORA_STUDIO_READY__ = false;
    window.__AURORA_STUDIO_ERROR__ = error?.message || String(error);
    document.documentElement.dataset.studioReady = "error";
    document.documentElement.dataset.studioError =
      error?.message || String(error);
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
  if (intentWorkflow.locked) {
    toast("Finish or revise the active run before starting another.", true);
    return;
  }

  const input = $("#prompt-input");
  const task = input.value.trim();
  if (!task) return;

  busy = true;
  input.disabled = true;
  toast("Starting AurorA production…");

  try {
    const result = await api("/api/plan", {
      method: "POST",
      body: JSON.stringify({
        task,
        referenceId: referenceWorkflow.selectedReferenceId,
        quality: intentWorkflow.quality,
        aspect: intentWorkflow.aspect
      })
    });
    if (!result.ok) throw new Error(result.stderr || "AurorA could not start the run.");
    input.value = "";
    render(result.state);
    switchView("create");
    toast(
      result.state?.agent?.bridge_connected
        ? "Run created."
        : "Run created. Continue in Claude or Codex."
    );
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
    input.disabled =
      !state?.configured ||
      intentWorkflow.locked;
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
    mediaUrl,
    onOpen: id => libraryWorkflow.open(id)
  });
});

$$(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    libraryFilter = button.dataset.filter;
    $$(".filter-button").forEach(item => item.classList.toggle("active", item === button));
    renderFullLibrary(state?.library_all || [], {
      query: libraryQuery,
      filter: libraryFilter,
      mediaUrl,
      onOpen: id => libraryWorkflow.open(id)
    });
  });
});

$("#project-form").addEventListener("input", () => {
  projectDirty = true;
  document.body.dataset.projectDirty = "true";
});

document.querySelectorAll("[data-project-reset]").forEach(button => {
  button.addEventListener("click", () => {
    if (resetProjectField(button.dataset.projectReset)) {
      projectDirty = true;
      document.body.dataset.projectDirty = "true";
    }
  });
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
    document.body.dataset.projectDirty = "false";
    render(result.state);
    toast("Project brain updated.");
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
  }
});

const settingsView = $("[data-view-panel='settings']");
settingsView.addEventListener("input", event => {
  if (event.target?.dataset?.localPreference) return;
  settingsDirty = true;
  document.body.dataset.settingsDirty = "true";

  if (event.target?.name === "budget_mode") {
    updateBudgetModeUi();
  }
});

$("#settings-save").addEventListener("click", async () => {
  if (busy || !state?.configured) return;
  busy = true;
  try {
    const result = await api("/api/settings", {
      method: "POST",
      body: JSON.stringify(settingsChanges())
    });
    settingsDirty = false;
    document.body.dataset.settingsDirty = "false";
    render(result.state);
    toast("Studio settings updated.");
  } catch (error) {
    toast(error.message, true);
  } finally {
    busy = false;
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
  window.__AURORA_STUDIO_READY__ = false;
  window.__AURORA_STUDIO_ERROR__ = null;
  document.documentElement.dataset.studioReady = "loading";

  if (!token) {
    const message = "Open Studio using the URL printed by aurora-studio ui.";
    window.__AURORA_STUDIO_ERROR__ = message;
    document.documentElement.dataset.studioReady = "error";
    document.documentElement.dataset.studioError = message;
    toast(message, true);
    return;
  }

  router.setInitial(router.initialFromLocation());
  switchView(router.currentView, false);
  settingsWorkflow.bind();
  updateWorkflow.bind();
  await refresh(true);
  initTooltips();
  pollTimer = setInterval(() => refresh(false), 2500);
}

window.addEventListener("beforeunload", () => clearInterval(pollTimer));
start();
