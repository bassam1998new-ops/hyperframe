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

  function render() {
    $$("#quality-options [data-quality]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.quality === quality
      );
    });

    $$("#aspect-options [data-aspect]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.aspect === aspect
      );
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

  return {
    get value() {
      return { quality, aspect };
    },
    render,
    setFromRun
  };
}
