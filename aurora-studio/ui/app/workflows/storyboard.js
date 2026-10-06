import { bindDialog } from "../dialog.js";
import { titleCase } from "../format.js";

const $ = selector => document.querySelector(selector);

const SORTABLE_SCRIPT = "/vendor/sortable.js";
let sortablePromise = null;

function loadSortable() {
  if (window.Sortable) return Promise.resolve(window.Sortable);
  if (sortablePromise) return sortablePromise;

  sortablePromise = new Promise(resolve => {
    const existing = document.querySelector(
      'script[data-aurora-vendor="sortablejs"]'
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve(window.Sortable || null);
        return;
      }

      existing.addEventListener(
        "load",
        () => resolve(window.Sortable || null),
        { once: true }
      );
      existing.addEventListener(
        "error",
        () => resolve(null),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SORTABLE_SCRIPT;
    script.async = false;
    script.dataset.auroraVendor = "sortablejs";
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve(window.Sortable || null);
    }, { once: true });
    script.addEventListener("error", () => resolve(null), { once: true });
    document.head.append(script);
  });

  return sortablePromise;
}

function shotById(state, shotId) {
  return state?.active_run?.shots?.find(
    shot => shot.id === shotId
  ) || null;
}

function routeEngines(state) {
  return state?.active_run?.route || [];
}

function setSelectOptions(select, values, selected) {
  select.innerHTML = values.map(value => `
    <option value="${value}" ${value === selected ? "selected" : ""}>
      ${titleCase(value)}
    </option>
  `).join("");
}

export function createStoryboardWorkflow({
  api,
  getState,
  onState,
  toast
}) {
  const dialog = bindDialog($("#shot-inspector"));
  const form = $("#shot-form");
  const addButton = $("#storyboard-add");
  const existingActions = $("#shot-existing-actions");
  const title = $("#shot-inspector-title");
  const meta = $("#shot-inspector-meta");
  const saveButton = $("#shot-save");
  const removeButton = $("#shot-remove");

  let sortable = null;
  let currentShotId = null;
  let removeArmed = false;
  let lastBoardKey = "";

  function currentRun() {
    return getState()?.active_run || null;
  }

  function editable() {
    return Boolean(currentRun()?.storyboard_editable);
  }

  function resetRemove() {
    removeArmed = false;
    removeButton.textContent = "Remove";
    removeButton.innerHTML =
      '<svg><use href="#i-trash"/></svg> Remove';
  }

  function fillInspector(shot = null) {
    const run = currentRun();
    const route = routeEngines(getState());

    currentShotId = shot?.id || null;
    removeArmed = false;

    form.elements.namedItem("shot_id").value = currentShotId || "";
    form.elements.namedItem("purpose").value = shot?.purpose || "";
    form.elements.namedItem("duration_seconds").value =
      shot?.duration_seconds ?? "";

    setSelectOptions(
      form.elements.namedItem("engine"),
      route,
      shot?.engine || route[0] || "hyperframe"
    );

    form.elements.namedItem("quality").value =
      shot?.quality ||
      run?.intent?.quality ||
      "normal";

    form.elements.namedItem("output").value = shot?.output || "";

    existingActions.hidden = !shot;
    title.textContent = shot ? "Edit shot" : "Add shot";

    meta.innerHTML = shot
      ? `
          <span>${titleCase(shot.status || "planned")}</span>
          <span>${shot.number ? "Shot " + shot.number : shot.id}</span>
          ${
            shot.handoff?.to
              ? `<span>${titleCase(shot.engine)} → ${titleCase(shot.handoff.to)}</span>`
              : ""
          }
        `
      : `
          <span>New build unit</span>
          <span>${route.map(titleCase).join(" → ")}</span>
        `;

    resetRemove();
  }

  function openNew() {
    if (!editable()) {
      toast("Storyboard is not editable yet.", true);
      return;
    }

    fillInspector(null);
    dialog.open();
  }

  function openExisting(shotId) {
    if (!editable()) return;
    const shot = shotById(getState(), shotId);
    if (!shot) return;

    fillInspector(shot);
    dialog.open();
  }

  async function mutate(path, body, message) {
    const result = await api(path, {
      method: "POST",
      body: JSON.stringify(body)
    });

    onState(result.state);
    toast(message);
    return result;
  }

  async function save(event) {
    event.preventDefault();
    const run = currentRun();
    if (!run || !editable()) return;

    const purpose = form.elements.namedItem("purpose").value.trim();
    if (!purpose) {
      form.elements.namedItem("purpose").focus();
      return;
    }

    const durationRaw =
      form.elements.namedItem("duration_seconds").value.trim();

    const body = {
      purpose,
      duration_seconds: durationRaw === ""
        ? null
        : Number(durationRaw),
      engine: form.elements.namedItem("engine").value,
      quality: form.elements.namedItem("quality").value,
      output: form.elements.namedItem("output").value.trim()
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving…";

    try {
      if (currentShotId) {
        await mutate(
          "/api/storyboard-update",
          {
            runId: run.id,
            shotId: currentShotId,
            changes: body
          },
          "Shot updated. Downstream build/review reopened."
        );
      } else {
        await mutate(
          "/api/storyboard-add",
          {
            runId: run.id,
            ...body
          },
          "Shot added."
        );
      }

      dialog.close("saved");
    } catch (error) {
      toast(error.message, true);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Save shot";
    }
  }

  async function duplicate() {
    const run = currentRun();
    if (!run || !currentShotId || !editable()) return;

    try {
      const result = await mutate(
        "/api/storyboard-duplicate",
        {
          runId: run.id,
          shotId: currentShotId
        },
        "Shot duplicated."
      );

      dialog.close("duplicated");
      requestAnimationFrame(() => {
        const newShot = shotById(
          result.state,
          result.shot_id
        );
        if (newShot) openExisting(newShot.id);
      });
    } catch (error) {
      toast(error.message, true);
    }
  }

  async function remove() {
    const run = currentRun();
    if (!run || !currentShotId || !editable()) return;

    if (!removeArmed) {
      removeArmed = true;
      removeButton.innerHTML =
        '<svg><use href="#i-trash"/></svg> Remove?';
      toast("Press Remove again to confirm.");
      return;
    }

    try {
      await mutate(
        "/api/storyboard-remove",
        {
          runId: run.id,
          shotId: currentShotId
        },
        "Shot removed."
      );
      dialog.close("removed");
    } catch (error) {
      toast(error.message, true);
    } finally {
      resetRemove();
    }
  }

  async function move(direction) {
    const run = currentRun();
    if (!run || !currentShotId || !editable()) return;

    try {
      await mutate(
        "/api/storyboard-move",
        {
          runId: run.id,
          shotId: currentShotId,
          direction
        },
        direction === "up" ? "Shot moved up." : "Shot moved down."
      );

      const shot = shotById(getState(), currentShotId);
      if (shot) fillInspector(shot);
    } catch (error) {
      toast(error.message, true);
    }
  }

  async function reorderFromDom() {
    const run = currentRun();
    if (!run || !editable()) return;

    const order = [
      ...document.querySelectorAll(
        "#board-list [data-shot-id]"
      )
    ].map(node => node.dataset.shotId);

    const current = (run.shots || []).map(shot => shot.id);

    if (
      order.length !== current.length ||
      order.every((id, index) => id === current[index])
    ) {
      return;
    }

    try {
      await mutate(
        "/api/storyboard-reorder",
        {
          runId: run.id,
          order
        },
        "Storyboard reordered."
      );
    } catch (error) {
      toast(error.message, true);
      onState(getState());
    }
  }

  function bindRows() {
    document
      .querySelectorAll("#board-list [data-shot-id]")
      .forEach(row => {
        row.addEventListener("click", event => {
          if (
            event.target.closest(".shot-drag-handle") ||
            event.target.closest("[data-shot-open]")
          ) {
            if (event.target.closest("[data-shot-open]")) {
              openExisting(row.dataset.shotId);
            }
            return;
          }

          openExisting(row.dataset.shotId);
        });

        row.addEventListener("keydown", event => {
          if (
            (event.key === "Enter" || event.key === " ") &&
            !event.target.closest(".shot-drag-handle")
          ) {
            event.preventDefault();
            openExisting(row.dataset.shotId);
          }
        });
      });
  }

  async function syncSortable(state) {
    const run = state?.active_run;
    const board = $("#board-list");
    const shots = run?.shots || [];
    const key = [
      run?.id || "",
      run?.storyboard_editable ? "editable" : "locked",
      shots.map(shot => shot.id).join(",")
    ].join("|");

    if (key === lastBoardKey) return;
    lastBoardKey = key;

    sortable?.destroy?.();
    sortable = null;

    bindRows();

    if (!run?.storyboard_editable || shots.length < 2) {
      return;
    }

    const Sortable = await loadSortable();
    if (!Sortable || key !== lastBoardKey) return;

    sortable = new Sortable(board, {
      animation: 150,
      handle: ".shot-drag-handle",
      draggable: "[data-shot-id]",
      ghostClass: "storyboard-ghost",
      chosenClass: "storyboard-chosen",
      dragClass: "storyboard-drag",
      onEnd: reorderFromDom
    });
  }

  function sync(state = getState()) {
    const run = state?.active_run;
    const visible = Boolean(
      run?.shots?.length || run?.storyboard_editable
    );

    addButton.hidden = !run?.storyboard_editable;
    addButton.disabled = !run?.storyboard_editable;

    if (!visible) {
      sortable?.destroy?.();
      sortable = null;
      lastBoardKey = "";
      return;
    }

    syncSortable(state);
  }

  addButton.addEventListener("click", openNew);
  form.addEventListener("submit", save);
  $("#shot-duplicate").addEventListener("click", duplicate);
  $("#shot-remove").addEventListener("click", remove);
  $("#shot-move-up").addEventListener(
    "click",
    () => move("up")
  );
  $("#shot-move-down").addEventListener(
    "click",
    () => move("down")
  );

  return {
    sync,
    openNew,
    openExisting,
    destroy() {
      sortable?.destroy?.();
      sortable = null;
    }
  };
}
