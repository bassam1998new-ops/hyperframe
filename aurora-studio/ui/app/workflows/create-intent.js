import { titleCase } from "../format.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

export function createIntentWorkflow({
  getSelectedReference,
  getReference
}) {
  let quality = "normal";
  let aspect = "project";
  let touched = false;
  let locked = false;

  function render() {
    $("#quality-options [data-quality]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.quality === quality
      );
      button.disabled = locked;
    });

    $("#aspect-options [data-aspect]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.aspect === aspect
      );
      button.disabled = locked;
    });

    const reference = getReference?.(getSelectedReference?.());
    $("#intent-hint").textContent = [
      titleCase(quality) + " quality",
      aspect === "project" ? "project aspect" : aspect,
      reference?.name || "no reference"
    ].join(" · ");
  }

  function setFromRun(run) {
    if (!run?.intent || touched) return;
    quality = run.intent.quality || "normal";
    aspect = run.intent.aspect || "project";
    render();
  }

  $$("#quality-options [data-quality]").forEach(button => {
    button.addEventListener("click", () => {
      touched = true;
      quality = button.dataset.quality;
      render();
    });
  });

  $$("#aspect-options [data-aspect]").forEach(button => {
    button.addEventListener("click", () => {
      touched = true;
      aspect = button.dataset.aspect;
      render();
    });
  });

  function sync(next) {
    locked = Boolean(
      next?.active_run &&
      next.active_run.status !== "completed"
    );
    render();
  }

  return {
    get aspect() {
      return aspect;
    },
    get locked() {
      return locked;
    },
    get quality() {
      return quality;
    },
    get value() {
      return { quality, aspect };
    },
    render,
    setFromRun,
    sync
  };
}
