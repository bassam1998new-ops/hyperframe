import {
  commaList,
  listValue,
  nested
} from "../format.js";

const $ = selector => document.querySelector(selector);

const FIELDS = [
  "product",
  "website",
  "purpose",
  "audience",
  "offer",
  "positioning",
  "brand.personality",
  "brand.colors",
  "brand.fonts",
  "brand.logo_paths",
  "brand.avoid",
  "content.languages",
  "content.channels",
  "creative.preferred_moods",
  "creative.avoid_moods",
  "creative.recurring_constraints"
];

const LIST_FIELDS = new Set([
  "audience",
  "brand.personality",
  "brand.colors",
  "brand.fonts",
  "brand.logo_paths",
  "brand.avoid",
  "content.languages",
  "content.channels",
  "creative.preferred_moods",
  "creative.avoid_moods",
  "creative.recurring_constraints"
]);

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
