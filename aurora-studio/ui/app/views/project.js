import {
  commaList,
  escapeHtml,
  listValue,
  nested,
  titleCase
} from "../format.js";

const $ = selector => document.querySelector(selector);

const FIELDS = [
  "product",
  "website",
  "purpose",
  "audience",
  "audience_context.knowledge_level",
  "audience_context.priorities",
  "offer",
  "positioning",
  "claims_to_protect",
  "brand.personality",
  "brand.colors",
  "brand.fonts",
  "brand.logo_paths",
  "brand.avoid",
  "content.languages",
  "content.channels",
  "content.default_formats",
  "content.recurring_series",
  "creative.preferred_moods",
  "creative.avoid_moods",
  "creative.recurring_constraints",
  "notes"
];

const LIST_FIELDS = new Set([
  "audience",
  "audience_context.priorities",
  "claims_to_protect",
  "brand.personality",
  "brand.colors",
  "brand.fonts",
  "brand.logo_paths",
  "brand.avoid",
  "content.languages",
  "content.channels",
  "content.default_formats",
  "content.recurring_series",
  "creative.preferred_moods",
  "creative.avoid_moods",
  "creative.recurring_constraints",
  "notes"
]);

function safeHttp(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function sourceMarkup(source) {
  const type = String(source?.type || "other");
  const value = String(source?.value || "");
  const checked = source?.checked_at
    ? "Checked " + formatDate(source.checked_at)
    : "Source recorded";
  const note = source?.note ? String(source.note) : "";
  const url = type === "website" ? safeHttp(value) : null;

  return `
    <article class="project-source-item">
      <div class="project-source-icon">
        <span>${escapeHtml(type.slice(0, 1).toUpperCase())}</span>
      </div>
      <div class="project-source-copy">
        <strong>${escapeHtml(titleCase(type))}</strong>
        <p>${escapeHtml(note || value || "No source detail")}</p>
        <small>${escapeHtml(checked)}</small>
      </div>
      ${
        url
          ? `<a
              class="project-source-link"
              href="${escapeHtml(url)}"
              target="_blank"
              rel="noopener noreferrer"
            >Inspect</a>`
          : ""
      }
    </article>
  `;
}

export function fillProjectForm(project, { dirty = false } = {}) {
  if (dirty) return;

  const form = $("#project-form");
  if (!form) return;

  for (const field of FIELDS) {
    const input = form.elements.namedItem(field);
    if (!input) continue;

    const value = nested(project || {}, field);
    input.value = Array.isArray(value)
      ? listValue(value)
      : String(value || "");
  }
}

export function renderProjectMeta(project, { dirty = false } = {}) {
  const profile = project || {};

  $("#project-source-count").textContent =
    String((profile.sources || []).length);
  $("#project-claim-count").textContent =
    String((profile.claims_to_protect || []).length);
  $("#project-updated-at").textContent =
    formatDate(profile.updated_at);

  const sources = $("#project-source-list");
  const rows = profile.sources || [];

  sources.innerHTML = rows.length
    ? rows.map(sourceMarkup).join("")
    : '<div class="aurora-empty-state compact">No provenance sources recorded yet.</div>';

  fillProjectForm(profile, { dirty });
}

export function projectChanges() {
  const form = $("#project-form");
  const changes = {};

  for (const element of [...form.elements]) {
    if (!element.name) continue;

    changes[element.name] = LIST_FIELDS.has(element.name)
      ? commaList(element.value)
      : element.value.trim();
  }

  return changes;
}

export function resetProjectField(field) {
  if (!FIELDS.includes(field)) return false;

  const form = $("#project-form");
  const input = form?.elements.namedItem(field);
  if (!input) return false;

  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
  return true;
}

export const projectFields = [...FIELDS];
