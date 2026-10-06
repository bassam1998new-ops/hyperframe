export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function titleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function money(value) {
  return "$" + Number(value || 0).toFixed(2);
}

export function listValue(value) {
  return Array.isArray(value) ? value.join(", ") : String(value || "");
}

export function commaList(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

export function nested(object, dotted) {
  return dotted.split(".").reduce((value, key) => value?.[key], object);
}

export function daypart(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}
