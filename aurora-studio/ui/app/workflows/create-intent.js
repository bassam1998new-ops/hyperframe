import { titleCase } from "../format.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

async function copyText(text) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      textarea.remove();
    }
  }
}

export function createIntentWorkflow({
  getState,
  referenceWorkflow,
  toast
}) {
  let quality = "normal";
  let aspect = "project";
  let locked = false;

  function setQuality(value) {
    if (locked) return;
    if (!["draft", "normal", "premium", "hero"].includes(value)) return;
    quality = value;
    sync(getState());
  }

  function setAspect(value) {
    if (locked) return;
    if (!["project", "9:16", "16:9", "1:1"].includes(value)) return;
    aspect = value;
    sync(getState());
  }

  function sync(state) {
    const run = state?.active_run;
    locked = Boolean(run && run.status !== "completed");

    if (locked) {
      quality = run.intent?.quality || "normal";
      aspect = run.intent?.aspect || "project";
    }

    $$("[data-quality]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.quality === quality
      );
      button.disabled = locked;
    });

    $$("[data-aspect]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.aspect === aspect
      );
      button.disabled = locked;
    });

    const reference = $("#selected-reference");
    const referenceOpen = $("#reference-open");
    if (reference) reference.disabled = locked;
    if (referenceOpen) referenceOpen.disabled = locked;

    const prompt = $("#prompt-input");
    if (prompt) {
      prompt.disabled = !state?.configured || locked;
      prompt.placeholder = !state?.configured
        ? "Run setup first"
        : locked
          ? "Current production is active"
          : "What are we making?";
    }

    const selectedReference = referenceWorkflow.selectedReferenceId
      ? (state?.references || []).find(
          item => item.id === referenceWorkflow.selectedReferenceId
        )
      : null;

    const hint = $("#intent-hint");
    if (hint) {
      hint.textContent = [
        titleCase(quality) + " quality",
        aspect === "project" ? "project aspect" : aspect,
        selectedReference
          ? selectedReference.name
          : "no reference"
      ].join(" · ");
    }

    const handoff = $("#agent-handoff");
    const message = $("#agent-handoff-message");

    const shouldShow = Boolean(
      locked &&
      state?.agent?.handoff?.message
    );

    if (handoff) {
      handoff.hidden = !shouldShow;
      const title = handoff.querySelector("strong");
      if (title) {
        title.textContent =
          state?.agent?.handoff?.title ||
          "Run created — continue in Claude or Codex.";
      }
    }
    if (message) {
      message.textContent = shouldShow
        ? state.agent.handoff.message
        : "";
    }
  }

  $$("[data-quality]").forEach(button => {
    button.addEventListener("click", () =>
      setQuality(button.dataset.quality)
    );
  });

  $$("[data-aspect]").forEach(button => {
    button.addEventListener("click", () =>
      setAspect(button.dataset.aspect)
    );
  });

  $("#copy-agent-handoff")?.addEventListener("click", async () => {
    const text = getState()?.agent?.handoff?.message;
    const ok = await copyText(text);
    toast(
      ok ? "Agent task copied." : "Could not copy the agent task.",
      !ok
    );
  });

  return {
    get quality() {
      return quality;
    },
    get aspect() {
      return aspect;
    },
    get locked() {
      return locked;
    },
    sync,
    setQuality,
    setAspect
  };
}
