import { bindDialog } from "../dialog.js";
import { escapeHtml, titleCase } from "../format.js";

const $ = selector => document.querySelector(selector);

function costLabel(value) {
  if (value === "free") return "Free";
  if (value === "unknown") return "Cost unknown";
  return titleCase(value) + " cost";
}

function conceptCard(concept, {
  setStatus,
  locked
}) {
  const grammar = (concept.visual_motion_grammar || [])
    .slice(0, 5)
    .map(item => `<span>${escapeHtml(item)}</span>`)
    .join("");

  const selected = Boolean(concept.selected);
  const selectable = setStatus === "ready" || setStatus === "selected";

  return `
    <article
      class="concept-card ${selected ? "selected" : ""}"
      data-concept-card="${escapeHtml(concept.id)}"
    >
      <div class="concept-card-top">
        <div class="concept-card-title">
          <span>DIRECTION</span>
          <h3>${escapeHtml(concept.name)}</h3>
        </div>
        <div class="concept-badges">
          ${selected ? '<span class="concept-badge selected">Selected</span>' : ""}
          <span class="concept-badge">${escapeHtml(titleCase(concept.complexity))}</span>
          <span class="concept-badge">${escapeHtml(costLabel(concept.cost_class))}</span>
        </div>
      </div>

      <div class="concept-card-body">
        <p class="concept-core">${escapeHtml(concept.core_idea)}</p>

        <div class="concept-detail-grid">
          <div class="concept-detail">
            <span>WHY IT FITS</span>
            <p>${escapeHtml(concept.project_fit)}</p>
          </div>
          <div class="concept-detail">
            <span>EMOTIONAL ARC</span>
            <p>${escapeHtml(concept.emotional_arc)}</p>
          </div>
        </div>

        <div class="concept-grammar">
          ${grammar}
        </div>

        <div class="concept-risk">
          <b>Risk</b>
          <span>${escapeHtml(concept.biggest_risk)}</span>
        </div>
      </div>

      <div class="concept-actions">
        <button
          class="aurora-button select-concept"
          data-variant="${selected ? "default" : "primary"}"
          type="button"
          data-concept-select="${escapeHtml(concept.id)}"
          ${!selectable || locked || selected ? "disabled" : ""}
        >
          ${selected ? "Selected direction" : "Select direction"}
        </button>
        <button
          class="aurora-button"
          type="button"
          data-concept-refine="${escapeHtml(concept.id)}"
          ${locked ? "disabled" : ""}
        >
          Refine
        </button>
      </div>
    </article>
  `;
}

export function createConceptWorkflow({
  api,
  getState,
  onState,
  toast
}) {
  const panel = $("#concepts-panel");
  const board = $("#board-panel");
  const list = $("#concepts-list");
  const status = $("#concept-status");
  const title = $("#concepts-title");
  const footer = $("#concepts-footer-text");
  const back = $("#concepts-back");
  const directionOpen = $("#direction-open");

  const refineDialogElement = $("#concept-refine-dialog");
  const refineDialog = bindDialog(refineDialogElement);
  const refineForm = $("#concept-refine-form");
  const refineId = $("#concept-refine-id");
  const refineTitle = $("#concept-refine-title");
  const refineNote = $("#concept-refine-note");
  const refineSubmit = $("#concept-refine-submit");

  let forcedOpen = false;
  let actionBusy = false;

  function directorState(state = getState()) {
    const run = state?.active_run;
    if (!run || run.mode !== "director") return null;
    return {
      run,
      concepts: run.concepts || null
    };
  }

  function shouldAutoOpen(run, concepts) {
    if (!run || !concepts) return false;
    if (run.current_stage === "concept") return true;
    if (concepts.status === "ready" && !concepts.selected_id) return true;
    if (concepts.status === "pending" && !concepts.selected_id) return true;
    return false;
  }

  function renderPending(concepts) {
    const request = concepts?.refinement_requests?.[0];

    list.innerHTML = `
      <div class="concepts-pending">
        <div class="brand-orb concept-orb"></div>
        <strong>${
          request
            ? "Refinement requested."
            : "AurorA is preparing directions."
        }</strong>
        <p>${
          request
            ? escapeHtml(request.note)
            : "Your agent will write 2–3 genuinely different concepts here."
        }</p>
      </div>
    `;
  }

  function renderConcepts(concepts) {
    const items = concepts?.items || [];
    if (!items.length) {
      renderPending(concepts);
      return;
    }

    list.innerHTML = items
      .map(item =>
        conceptCard(item, {
          setStatus: concepts.status,
          locked: concepts.direction_locked
        })
      )
      .join("");
  }

  function sync(state = getState()) {
    const current = directorState(state);

    if (!current?.concepts) {
      panel.hidden = true;
      board.hidden = false;
      directionOpen.hidden = true;
      forcedOpen = false;
      return;
    }

    const { run, concepts } = current;
    const show = forcedOpen || shouldAutoOpen(run, concepts);

    panel.hidden = !show;
    board.hidden = show;

    status.textContent = concepts.direction_locked
      ? "Locked"
      : titleCase(concepts.status || "pending");
    status.className =
      "concept-status " +
      (concepts.direction_locked
        ? "locked"
        : concepts.status || "pending");

    title.textContent = concepts.selected
      ? concepts.selected.name
      : concepts.status === "ready"
        ? "Choose the direction"
        : "Preparing directions";

    renderConcepts(concepts);

    const selected = concepts.selected;
    directionOpen.hidden = !selected;
    directionOpen.textContent = selected
      ? `Direction: ${selected.name}`
      : "View direction";

    const naturalConceptView = shouldAutoOpen(run, concepts);
    back.hidden = naturalConceptView && !forcedOpen;

    if (concepts.direction_locked) {
      footer.textContent =
        "Direction is locked because production has started. Use the revision workflow for changes.";
    } else if (concepts.status === "selected") {
      footer.textContent =
        "Direction selected. You can still change it until actual build work starts.";
    } else if (concepts.status === "ready") {
      footer.textContent =
        "Choose one direction before AurorA locks mood, assets and production planning.";
    } else if (concepts.refinement_requests?.length) {
      footer.textContent =
        "Refinement is waiting on the agent. Downstream planning was reset safely.";
    } else {
      footer.textContent =
        "Software stays unlocked until the creative direction is chosen.";
    }
  }

  async function select(conceptId) {
    const current = directorState();
    if (
      !current ||
      !conceptId ||
      actionBusy ||
      current.concepts?.direction_locked
    ) {
      return;
    }

    actionBusy = true;
    try {
      const result = await api("/api/concept-select", {
        method: "POST",
        body: JSON.stringify({
          runId: current.run.id,
          conceptId
        })
      });

      onState(result.state);
      toast("Direction selected.");
    } catch (error) {
      toast(error.message, true);
    } finally {
      actionBusy = false;
    }
  }

  function openRefine(conceptId) {
    const current = directorState();
    if (!current || current.concepts?.direction_locked) return;

    const concept = current.concepts?.items?.find(
      item => item.id === conceptId
    );

    refineId.value = conceptId || "";
    refineTitle.textContent = concept
      ? `Refine: ${concept.name}`
      : "Refine the direction";
    refineNote.value = "";
    refineDialog.open();
  }

  async function refine() {
    const current = directorState();
    if (!current || actionBusy) return;

    const note = refineNote.value.trim();
    if (!note) {
      refineNote.focus();
      return;
    }

    actionBusy = true;
    refineSubmit.disabled = true;
    refineSubmit.textContent = "Requesting…";

    try {
      const result = await api("/api/concept-refine", {
        method: "POST",
        body: JSON.stringify({
          runId: current.run.id,
          conceptId: refineId.value || null,
          note
        })
      });

      forcedOpen = true;
      onState(result.state);
      refineDialog.close("submitted");
      toast(
        result.state?.agent?.bridge_connected
          ? "Refinement requested."
          : "Refinement saved. Continue in Claude or Codex."
      );
    } catch (error) {
      toast(error.message, true);
    } finally {
      actionBusy = false;
      refineSubmit.disabled = false;
      refineSubmit.textContent = "Request refinement";
    }
  }

  list?.addEventListener("click", event => {
    const selectButton = event.target.closest("[data-concept-select]");
    if (selectButton) {
      select(selectButton.dataset.conceptSelect);
      return;
    }

    const refineButton = event.target.closest("[data-concept-refine]");
    if (refineButton) {
      openRefine(refineButton.dataset.conceptRefine);
    }
  });

  directionOpen?.addEventListener("click", () => {
    forcedOpen = true;
    sync();
  });

  back?.addEventListener("click", () => {
    forcedOpen = false;
    sync();
  });

  refineForm?.addEventListener("submit", event => {
    event.preventDefault();
    refine();
  });

  return {
    sync,
    openSelectedDirection() {
      forcedOpen = true;
      sync();
    }
  };
}
