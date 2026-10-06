const ALLOWED_VIEWS = new Set([
  "create",
  "library",
  "project",
  "settings",
  "updates",
  "setup"
]);

export function createViewRouter({
  getState,
  titleCase,
  onChange = null
}) {
  let currentView = "create";

  function normalize(view) {
    return ALLOWED_VIEWS.has(view) ? view : "create";
  }

  function switchView(view, updateHash = true) {
    let next = normalize(view);
    const state = getState?.();

    if (state && !state.configured) next = "setup";

    currentView = next;

    document.querySelectorAll("[data-view-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.viewPanel === next);
    });

    document.querySelectorAll(".nav-item").forEach(button => {
      button.classList.toggle("active", button.dataset.view === next);
      if (button.dataset.view) {
        button.setAttribute(
          "aria-current",
          button.dataset.view === next ? "page" : "false"
        );
      }
    });

    const crumb = document.querySelector("#crumb-view");
    if (crumb) crumb.textContent = titleCase(next === "setup" ? "Setup" : next);

    document.body.classList.toggle("setup-mode", next === "setup");

    if (updateHash && next !== "setup") {
      history.replaceState(
        null,
        "",
        location.pathname + location.search + "#" + next
      );
    }

    onChange?.(next);
    return next;
  }

  function initialFromLocation() {
    const candidate = (location.hash || "#create").slice(1);
    return normalize(candidate);
  }

  function setInitial(view) {
    currentView = normalize(view);
    return currentView;
  }

  return {
    get currentView() {
      return currentView;
    },
    initialFromLocation,
    setInitial,
    switchView
  };
}
