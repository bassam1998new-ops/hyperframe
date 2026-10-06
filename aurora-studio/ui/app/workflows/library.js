import { bindDialog } from "../dialog.js";
import {
  commaList,
  escapeHtml,
  titleCase
} from "../format.js";

const $ = selector => document.querySelector(selector);

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

function yesNoUnknown(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Unknown";
}

function historyMarkup(history = []) {
  if (!history.length) {
    return '<div class="library-history-empty">Not used in a tracked run yet.</div>';
  }

  return history.map(entry => `
    <div class="library-history-item">
      <i></i>
      <div>
        <strong>${escapeHtml(entry.task || entry.run_id)}</strong>
        <small>${escapeHtml(
          entry.type === "shot"
            ? "Shot · " + (entry.detail || entry.shot_id || "Build")
            : titleCase(entry.decision || "asset decision") +
              (entry.detail ? " · " + entry.detail : "")
        )}</small>
      </div>
    </div>
  `).join("");
}

export function createLibraryWorkflow({
  api,
  getState,
  onState,
  mediaUrl,
  toast,
  switchView,
  assetWorkflow
}) {
  const drawer = bindDialog($("#library-detail-drawer"));
  const removeDialog = bindDialog($("#library-remove-dialog"));
  let selectedId = null;

  function item() {
    return (getState()?.library_all || [])
      .find(entry => entry.id === selectedId) || null;
  }

  function previewMarkup(value) {
    if (value?.preview?.type === "image") {
      return `<img src="${escapeHtml(mediaUrl(value.preview))}" alt="" />`;
    }

    if (value?.preview?.type === "video") {
      return `
        <video
          muted
          controls
          preload="metadata"
          src="${escapeHtml(mediaUrl(value.preview))}"
        ></video>
      `;
    }

    return `
      <div class="library-detail-placeholder">
        <span>${escapeHtml(titleCase(value?.kind || value?.type || "asset"))}</span>
      </div>
    `;
  }

  function render() {
    const value = item();
    if (!value) {
      if (drawer.open) drawer.close("missing");
      return;
    }

    $("#library-detail-preview").innerHTML = previewMarkup(value);
    $("#library-detail-kind").textContent =
      titleCase(value.kind || value.type || "asset");
    $("#library-detail-title").textContent = value.name;
    $("#library-detail-status").textContent =
      value.approved ? "Approved" : "Pending review";
    $("#library-detail-status").className =
      "library-approval-pill " + (value.approved ? "approved" : "pending");

    const form = $("#library-detail-form");
    form.elements.namedItem("name").value = value.name || "";
    form.elements.namedItem("description").value = value.description || "";
    form.elements.namedItem("tags").value = (value.tags || []).join(", ");
    form.elements.namedItem("quality_tier").value =
      ["unknown", "draft", "normal", "premium", "hero"].includes(value.quality_tier)
        ? value.quality_tier
        : "unknown";
    form.elements.namedItem("approved").checked = Boolean(value.approved);

    $("#library-detail-tools").innerHTML =
      (value.tools || []).length
        ? value.tools.map(tool =>
            '<span class="route-chip">' +
            escapeHtml(titleCase(tool)) +
            "</span>"
          ).join("")
        : '<span class="library-meta-empty">No tool tags</span>';

    const source = safeHttp(value.source_url);
    const sourceButton = $("#library-source-open");
    sourceButton.hidden = !source;
    if (source) sourceButton.href = source;

    const reveal = $("#library-reveal");
    reveal.disabled = !value.local_available;
    reveal.title = value.local_available
      ? "Reveal tracked local item"
      : "Tracked local file/folder is unavailable";

    $("#library-local-path").textContent =
      value.path || "No local path";
    $("#library-source-name").textContent =
      value.source_name || (source ? "External source" : "Local / project");
    $("#library-license-id").textContent =
      value.license?.id || "unknown";
    $("#library-license-commercial").textContent =
      yesNoUnknown(value.license?.commercial_allowed);
    $("#library-license-redistribution").textContent =
      yesNoUnknown(value.license?.redistribution_allowed);
    $("#library-license-attribution").textContent =
      yesNoUnknown(value.license?.attribution_required);
    $("#library-use-count").textContent =
      String(value.use_count || 0);
    $("#library-use-history").innerHTML =
      historyMarkup(value.use_history || []);

    const canUse = Boolean(
      getState()?.active_run?.asset_plan?.editable
    );
    const useButton = $("#library-use-current");
    useButton.disabled = !canUse;
    useButton.title = canUse
      ? "Choose which asset need should use this item"
      : "The active run has no editable asset plan";

    $("#library-remove-name").textContent = value.name;
  }

  function open(id) {
    selectedId = id;
    render();
    if (item()) drawer.open();
  }

  async function save(event) {
    event.preventDefault();
    const value = item();
    if (!value) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const submit = $("#library-detail-save");
    submit.disabled = true;
    submit.textContent = "Saving…";

    try {
      const result = await api("/api/library-update", {
        method: "POST",
        body: JSON.stringify({
          id: value.id,
          changes: {
            name: String(data.get("name") || "").trim(),
            description: String(data.get("description") || "").trim(),
            tags: commaList(data.get("tags")),
            quality_tier: String(data.get("quality_tier") || "unknown"),
            approved: data.get("approved") === "on"
          }
        })
      });

      onState(result.state);
      toast(
        result.item.approved
          ? "Library item saved and approved."
          : "Library item saved."
      );
      render();
    } catch (error) {
      toast(error.message, true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Save item";
    }
  }

  async function reveal() {
    const value = item();
    if (!value?.local_available) return;

    try {
      await api("/api/library-reveal", {
        method: "POST",
        body: JSON.stringify({ id: value.id })
      });
      toast("Opened tracked local item.");
    } catch (error) {
      toast(error.message, true);
    }
  }

  function useCurrent() {
    const value = item();
    if (!value) return;

    const opened = assetWorkflow?.openLibraryItem?.(value.id);
    if (!opened) return;

    drawer.close("use");
    switchView("create");
    toast("Choose the asset need that should use this item.");
  }

  async function remove() {
    const value = item();
    if (!value) return;

    const button = $("#library-remove-confirm");
    button.disabled = true;
    button.textContent = "Removing…";

    try {
      const result = await api("/api/library-remove", {
        method: "POST",
        body: JSON.stringify({ id: value.id })
      });

      selectedId = null;
      removeDialog.close("removed");
      drawer.close("removed");
      onState(result.state);
      toast(
        result.source_file_deleted
          ? "Library item and source file removed."
          : "Removed from AurorA Library. Source file was kept."
      );
    } catch (error) {
      toast(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Remove from Library";
    }
  }

  $("#library-detail-form").addEventListener("submit", save);
  $("#library-reveal").addEventListener("click", reveal);
  $("#library-use-current").addEventListener("click", useCurrent);
  $("#library-remove-open").addEventListener("click", () => {
    render();
    removeDialog.open();
  });
  $("#library-remove-cancel").addEventListener("click", () => {
    removeDialog.close("cancel");
  });
  $("#library-remove-confirm").addEventListener("click", remove);

  function sync() {
    if (!selectedId) return;
    if (!item()) {
      selectedId = null;
      if (drawer.open) drawer.close("missing");
      if (removeDialog.open) removeDialog.close("missing");
      return;
    }
    if (drawer.open) render();
  }

  return {
    get selectedId() {
      return selectedId;
    },
    open,
    render,
    sync
  };
}
