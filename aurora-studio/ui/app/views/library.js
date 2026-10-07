import { escapeHtml, titleCase } from "../format.js";

const $ = selector => document.querySelector(selector);

function card(item, mediaUrl) {
  let media =
    '<span class="library-kind">' +
    escapeHtml(titleCase(item.kind || item.type || "asset")) +
    "</span>";

  if (item.preview?.type === "image") {
    media =
      '<img alt="" src="' +
      escapeHtml(mediaUrl(item.preview)) +
      '" />';
  } else if (item.preview?.type === "video") {
    media =
      '<video muted preload="metadata" src="' +
      escapeHtml(mediaUrl(item.preview)) +
      '"></video>';
  }

  const tools = (item.tools || []).map(titleCase).join(" + ");

  const status = item.approved ? "Approved" : "Pending";
  const licenseId = typeof item.license === "string"
    ? item.license
    : item.license?.id || "unknown";

  return `
    <button
      class="library-card"
      type="button"
      data-library-id="${escapeHtml(item.id)}"
      title="Open ${escapeHtml(item.name)} details"
    >
      <div class="library-thumb">
        ${media}
        <span class="library-card-status ${item.approved ? "approved" : "pending"}">
          ${status}
        </span>
      </div>
      <div class="library-body">
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(
          tools || titleCase(item.type || item.kind || "asset")
        )} · ${escapeHtml(licenseId)}</p>
        <div class="library-card-foot">
          <span>${escapeHtml(titleCase(item.quality_tier || "unknown"))}</span>
          <span>${Number(item.use_count || 0)} use${Number(item.use_count || 0) === 1 ? "" : "s"}</span>
        </div>
      </div>
    </button>
  `;
}

function matches(item, query, filter) {
  const q = String(query || "").trim().toLowerCase();
  const haystack = [
    item.name,
    item.kind,
    item.type,
    item.license,
    ...(item.tools || [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (q && !haystack.includes(q)) return false;
  if (filter === "all") return true;
  if (filter === "style") return item.kind === "style";
  if (filter === "audio") {
    return item.kind === "audio" || item.type === "audio";
  }
  if (filter === "font") {
    return item.kind === "font" || item.type === "font";
  }
  if (filter === "template") {
    return item.kind === "template" || item.type === "template";
  }
  if (filter === "approved") return Boolean(item.approved);
  if (filter === "pending") return !item.approved;
  if (filter === "model") {
    return (
      ["model", "rig", "animation", "material", "hdri"].includes(item.kind) ||
      /3d|glb|gltf|blend|fbx|obj/i.test(item.type || "")
    );
  }
  if (filter === "asset") {
    return ![
      "style",
      "audio",
      "font",
      "model",
      "rig",
      "animation",
      "material",
      "hdri"
    ].includes(item.kind);
  }

  return item.kind === filter;
}

function bindOpen(container, onOpen) {
  if (typeof onOpen !== "function") return;
  container.querySelectorAll("[data-library-id]").forEach(button => {
    button.addEventListener("click", () => {
      onOpen(button.dataset.libraryId);
    });
  });
}

export function renderLibraryShelf(items, mediaUrl, onOpen = null) {
  const grid = $("#library-grid");
  if (!items?.length) {
    grid.innerHTML =
      '<div class="empty-card">Your approved assets, styles and media will appear here.</div>';
    return;
  }

  grid.innerHTML = items.map(item => card(item, mediaUrl)).join("");
  bindOpen(grid, onOpen);
}

export function renderFullLibrary(
  items,
  {
    query = "",
    filter = "all",
    mediaUrl,
    onOpen = null
  } = {}
) {
  const filtered = (items || []).filter(item =>
    matches(item, query, filter)
  );

  $("#library-full-count").textContent =
    filtered.length +
    " item" +
    (filtered.length === 1 ? "" : "s");

  const grid = $("#library-full-grid");
  grid.innerHTML = filtered.length
    ? filtered.map(item => card(item, mediaUrl)).join("")
    : '<div class="empty-card">No tracked library items match this filter.</div>';

  bindOpen(grid, onOpen);
}
