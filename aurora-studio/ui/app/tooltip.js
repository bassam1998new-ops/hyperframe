const SCRIPTS = [
  "/vendor/floating-ui-utils.js",
  "/vendor/floating-ui-utils-dom.js",
  "/vendor/floating-ui-core.js",
  "/vendor/floating-ui-dom.js"
];

let floatingPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-aurora-vendor="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.auroraVendor = src;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.append(script);
  });
}

async function loadFloatingUi() {
  if (window.FloatingUIDOM) return window.FloatingUIDOM;
  if (floatingPromise) return floatingPromise;

  floatingPromise = (async () => {
    try {
      for (const src of SCRIPTS) {
        await loadScript(src);
      }
      return window.FloatingUIDOM || null;
    } catch {
      return null;
    }
  })();

  return floatingPromise;
}

function tooltipText(target) {
  return target.dataset.tooltip || target.getAttribute("title") || "";
}

export async function initTooltips({
  selector = "[data-tooltip], .nav-item[title], .icon-button[title]",
  delay = 180
} = {}) {
  const targets = [...document.querySelectorAll(selector)]
    .filter(target => tooltipText(target));

  if (!targets.length) return { enhanced: false, count: 0 };

  const floating = await loadFloatingUi();
  if (!floating?.computePosition) {
    return { enhanced: false, count: targets.length };
  }

  const {
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift
  } = floating;

  const tooltip = document.createElement("div");
  tooltip.className = "aurora-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);

  let activeTarget = null;
  let cleanup = null;
  let timer = null;

  async function updatePosition(target) {
    const { x, y } = await computePosition(target, tooltip, {
      placement: target.dataset.tooltipPlacement || "right",
      middleware: [
        offset(8),
        flip(),
        shift({ padding: 8 })
      ]
    });

    Object.assign(tooltip.style, {
      left: `${Math.round(x)}px`,
      top: `${Math.round(y)}px`
    });
  }

  function hide() {
    clearTimeout(timer);
    cleanup?.();
    cleanup = null;
    activeTarget = null;
    tooltip.hidden = true;
  }

  function show(target) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const text = tooltipText(target);
      if (!text) return;

      activeTarget = target;
      tooltip.textContent = text;
      tooltip.hidden = false;

      cleanup?.();
      cleanup = autoUpdate(
        target,
        tooltip,
        () => updatePosition(target),
        { animationFrame: false }
      );
    }, delay);
  }

  for (const target of targets) {
    target.dataset.tooltip ||= target.getAttribute("title") || "";
    target.removeAttribute("title");

    target.addEventListener("pointerenter", () => show(target));
    target.addEventListener("pointerleave", hide);
    target.addEventListener("focus", () => show(target));
    target.addEventListener("blur", hide);
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeTarget) hide();
  });

  return {
    enhanced: true,
    count: targets.length,
    destroy() {
      hide();
      tooltip.remove();
    }
  };
}
