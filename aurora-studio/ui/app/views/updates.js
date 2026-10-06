import {
  escapeHtml,
  titleCase
} from "../format.js";

const $ = selector => document.querySelector(selector);

export function renderUpdates(next, remoteUpdate = null) {
  const release = remoteUpdate || next.release || {};

  $("#update-version").textContent =
    "Version " +
    (release.latest_version || release.version || "—");

  if (remoteUpdate) {
    $("#update-state").textContent = remoteUpdate.update_available
      ? "Update available from the configured release channel."
      : remoteUpdate.local_newer
        ? "This local build is newer than the published release."
        : "You are up to date.";
  } else {
    $("#update-state").textContent =
      "Channel: " +
      titleCase(next.release?.channel || "dev") +
      (next.release?.public_install_ready
        ? ""
        : " · public install not enabled yet");
  }

  const notes =
    release.notes ||
    next.release?.notes ||
    { new: [], fixed: [] };

  $("#update-new").innerHTML =
    (notes.new || [])
      .map(item => "<li>" + escapeHtml(item) + "</li>")
      .join("") ||
    "<li>No new notes.</li>";

  $("#update-fixed").innerHTML =
    (notes.fixed || [])
      .map(item => "<li>" + escapeHtml(item) + "</li>")
      .join("") ||
    "<li>No fixes listed.</li>";
}
