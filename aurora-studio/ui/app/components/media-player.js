const SCRIPT = "/vendor/media-chrome.js";
let mediaChromePromise = null;

function loadScript() {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-aurora-vendor="media-chrome"]'
    );

    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = false;
    script.dataset.auroraVendor = "media-chrome";
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", reject, { once: true });
    document.head.append(script);
  });
}

export async function ensureMediaChrome() {
  if (customElements.get("media-controller")) return true;
  if (mediaChromePromise) return mediaChromePromise;

  mediaChromePromise = (async () => {
    try {
      await loadScript();
      return Boolean(customElements.get("media-controller"));
    } catch {
      return false;
    }
  })();

  return mediaChromePromise;
}

function escapeAttribute(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function enhancedMarkup(src, label) {
  return `
    <media-controller class="aurora-media-controller" data-aurora-player>
      <video
        slot="media"
        playsinline
        preload="metadata"
        src="${escapeAttribute(src)}"
        aria-label="${escapeAttribute(label)}"
      ></video>
      <media-loading-indicator
        slot="centered-chrome"
        noautohide
      ></media-loading-indicator>
      <media-control-bar class="aurora-media-controls">
        <media-play-button></media-play-button>
        <span class="aurora-media-clock" data-aurora-clock aria-hidden="true">0:00</span>
        <media-time-range></media-time-range>
        <media-duration-display></media-duration-display>
        <media-mute-button></media-mute-button>
        <media-volume-range></media-volume-range>
        <button
          class="aurora-media-speed"
          type="button"
          data-aurora-speed
          aria-label="1× playback speed"
        >1×</button>
        <media-fullscreen-button></media-fullscreen-button>
      </media-control-bar>
    </media-controller>
  `;
}

function formatMediaTime(value) {
  const seconds = Number.isFinite(Number(value))
    ? Math.max(0, Math.floor(Number(value)))
    : 0;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes + ":" + String(rest).padStart(2, "0");
}

function bindAuroraControls(container) {
  const video = container.querySelector("video");
  const clock = container.querySelector("[data-aurora-clock]");
  const speed = container.querySelector("[data-aurora-speed]");
  if (!video) return;

  const updateClock = () => {
    if (clock) clock.textContent = formatMediaTime(video.currentTime);
  };

  video.addEventListener("timeupdate", updateClock);
  video.addEventListener("loadedmetadata", updateClock);
  updateClock();

  if (speed) {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    speed.addEventListener("click", () => {
      const current = Number(video.playbackRate || 1);
      const index = rates.findIndex(rate => Math.abs(rate - current) < 0.001);
      const next = rates[(index + 1 + rates.length) % rates.length];
      video.playbackRate = next;
      const visible = String(next).replace(/\.0$/, "") + "×";
      speed.textContent = visible;
      speed.setAttribute("aria-label", visible + " playback speed");
    });
  }
}

function fallbackMarkup(src, label) {
  return `
    <video
      class="aurora-native-preview"
      controls
      playsinline
      preload="metadata"
      src="${escapeAttribute(src)}"
      aria-label="${escapeAttribute(label)}"
    ></video>
  `;
}

export function mountMediaPlayer(container, {
  src,
  label = "AurorA Studio preview"
} = {}) {
  if (!container || !src) return;

  const key = String(src);
  if (
    container.dataset.mediaKey === key &&
    container.querySelector("video")
  ) {
    return;
  }

  container.dataset.mediaKey = key;
  container.innerHTML = fallbackMarkup(src, label);

  ensureMediaChrome().then(ready => {
    if (!ready) return;
    if (container.dataset.mediaKey !== key) return;
    container.innerHTML = enhancedMarkup(src, label);
    bindAuroraControls(container);
  });
}
