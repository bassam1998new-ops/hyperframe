import { bindDialog } from "../dialog.js";
import { escapeHtml, titleCase } from "../format.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function prettySource(reference) {
  if (reference.source_type === "file") {
    return reference.original_name || reference.source_value || "Local file";
  }
  if (reference.source_type === "url") {
    try {
      return new URL(reference.source_value).hostname;
    } catch {
      return reference.source_value || "URL";
    }
  }
  return titleCase(reference.source_type || "reference");
}

export function createReferenceWorkflow({
  api,
  getState,
  onState,
  mediaUrl,
  toast
}) {
  const dialogElement = $("#reference-dialog");
  const dialog = bindDialog(dialogElement);
  const fileInput = $("#reference-file");
  const dropzone = $("#reference-dropzone");
  const uploadSelection = $("#reference-upload-selection");
  const uploadName = $("#reference-upload-name");
  const uploadSubmit = $("#reference-upload-submit");
  const linkForm = $("#reference-link-form");

  let selectedReferenceId = null;
  let pendingFile = null;
  let uploading = false;

  function referenceById(id, state = getState()) {
    return (state?.references || []).find(item => item.id === id) || null;
  }

  function renderSelected(state = getState()) {
    const chip = $("#selected-reference");
    if (!chip) return;

    const reference = referenceById(selectedReferenceId, state);
    chip.classList.toggle("empty", !reference);
    chip.disabled = false;

    if (!reference) {
      chip.innerHTML = `
        <svg><use href="#i-image"/></svg>
        <span>No reference</span>
        <small>Add one</small>
      `;
      return;
    }

    const icon = reference.source_type === "file" &&
      reference.mime?.startsWith("image/")
      ? "i-image"
      : "i-file-text";

    chip.innerHTML = `
      <svg><use href="#${icon}"/></svg>
      <span>${escapeHtml(reference.name)}</span>
      <small>${escapeHtml(titleCase(reference.role || "visual"))}</small>
    `;
  }

  function renderRecent(state = getState()) {
    const list = $("#reference-list");
    if (!list) return;

    const items = state?.references || [];
    if (!items.length) {
      list.innerHTML =
        '<div class="aurora-empty-state">No references yet. Upload a file or add a link.</div>';
      return;
    }

    list.innerHTML = items.map(item => {
      let preview = `
        <div class="reference-list-icon">
          <svg><use href="#${item.source_type === "file" ? "i-file-text" : "i-link"}"/></svg>
        </div>
      `;

      if (item.preview?.type === "image") {
        preview = `
          <div class="reference-list-thumb">
            <img alt="" src="${escapeHtml(mediaUrl(item.preview))}" />
          </div>
        `;
      } else if (item.preview?.type === "video") {
        preview = `
          <div class="reference-list-thumb">
            <video muted preload="metadata" src="${escapeHtml(mediaUrl(item.preview))}"></video>
          </div>
        `;
      }

      return `
        <button
          class="reference-list-item ${item.id === selectedReferenceId ? "selected" : ""}"
          type="button"
          data-reference-id="${escapeHtml(item.id)}"
        >
          ${preview}
          <span>
            <strong>${escapeHtml(item.name)}</strong>
            <small>
              ${escapeHtml(titleCase(item.role || "visual"))}
              ·
              ${escapeHtml(prettySource(item))}
            </small>
          </span>
          ${item.id === selectedReferenceId ? '<svg class="reference-check"><use href="#i-check"/></svg>' : ""}
        </button>
      `;
    }).join("");
  }

  function setSelected(id, {
    close = false,
    state = getState()
  } = {}) {
    selectedReferenceId = id || null;
    renderSelected(state);
    renderRecent(state);
    if (close) dialog.close("selected");
  }

  function renderUploadSelection() {
    uploadSelection.hidden = !pendingFile;

    if (!pendingFile) {
      uploadName.textContent = "";
      return;
    }

    const mb = (pendingFile.size / (1024 * 1024)).toFixed(
      pendingFile.size >= 1024 * 1024 ? 1 : 2
    );
    uploadName.textContent = `${pendingFile.name} · ${mb} MB`;
  }

  function selectFile(file) {
    if (!file) return;
    pendingFile = file;
    renderUploadSelection();
  }

  async function uploadPending() {
    if (!pendingFile || uploading) return;

    uploading = true;
    uploadSubmit.disabled = true;
    uploadSubmit.textContent = "Uploading…";

    try {
      const role =
        document.querySelector(
          'input[name="upload-reference-role"]:checked'
        )?.value || "visual";

      const result = await api("/api/reference-upload", {
        method: "POST",
        headers: {
          "Content-Type":
            pendingFile.type || "application/octet-stream",
          "X-Aurora-Filename": encodeURIComponent(pendingFile.name),
          "X-Aurora-Reference-Role": role
        },
        body: pendingFile
      });

      pendingFile = null;
      fileInput.value = "";
      renderUploadSelection();
      onState(result.state);
      setSelected(result.reference.id, {
        close: true,
        state: result.state
      });
      toast("Reference added.");
    } catch (error) {
      toast(error.message, true);
    } finally {
      uploading = false;
      uploadSubmit.disabled = false;
      uploadSubmit.textContent = "Add reference";
    }
  }

  function switchTab(tab) {
    $$("[data-reference-tab]").forEach(button => {
      const active = button.dataset.referenceTab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });

    $$("[data-reference-panel]").forEach(panel => {
      panel.classList.toggle(
        "active",
        panel.dataset.referencePanel === tab
      );
    });
  }

  $$("[data-reference-tab]").forEach(button => {
    button.addEventListener("click", () =>
      switchTab(button.dataset.referenceTab)
    );
  });

  $("#reference-open")?.addEventListener("click", () => {
    renderRecent();
    dialog.open();
  });

  $("#selected-reference")?.addEventListener("click", () => {
    renderRecent();
    dialog.open();
  });

  fileInput?.addEventListener("change", () => {
    selectFile(fileInput.files?.[0]);
  });

  dropzone?.addEventListener("dragover", event => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  });

  dropzone?.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragging");
  });

  dropzone?.addEventListener("drop", event => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
    selectFile(event.dataTransfer?.files?.[0]);
  });

  uploadSubmit?.addEventListener("click", uploadPending);

  linkForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const data = new FormData(linkForm);
    const url = String(data.get("url") || "").trim();
    if (!url) return;

    const submit = linkForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Adding…";

    try {
      const result = await api("/api/reference-link", {
        method: "POST",
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(),
          url,
          role: String(data.get("role") || "visual")
        })
      });

      linkForm.reset();
      onState(result.state);
      setSelected(result.reference.id, {
        close: true,
        state: result.state
      });
      toast("Reference link added.");
    } catch (error) {
      toast(error.message, true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Add link";
    }
  });

  $("#reference-list")?.addEventListener("click", event => {
    const button = event.target.closest("[data-reference-id]");
    if (!button) return;
    setSelected(button.dataset.referenceId, { close: true });
  });

  $("#reference-clear")?.addEventListener("click", () => {
    setSelected(null, { close: true });
    toast("Reference cleared.");
  });

  return {
    get selectedReferenceId() {
      return selectedReferenceId;
    },
    setSelected,
    sync(state) {
      const run = state?.active_run;
      if (
        run &&
        run.status !== "completed" &&
        run.reference_id
      ) {
        selectedReferenceId = run.reference_id;
      }
      renderSelected(state);
      renderRecent(state);
    },
    open() {
      renderRecent();
      dialog.open();
    }
  };
}
