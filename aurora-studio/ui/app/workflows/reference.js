import { bindDialog } from "../dialog.js";
import { escapeHtml, titleCase } from "../format.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function selectedRole(name) {
  return document.querySelector(
    'input[name="' + name + '"]:checked'
  )?.value || "visual";
}

function previewMarkup(reference, mediaUrl) {
  if (reference.preview?.type === "image") {
    return `
      <span class="reference-list-thumb">
        <img
          src="${escapeHtml(mediaUrl(reference.preview))}"
          alt=""
        />
      </span>
    `;
  }

  if (reference.preview?.type === "video") {
    return `
      <span class="reference-list-thumb">
        <video
          muted
          preload="metadata"
          src="${escapeHtml(mediaUrl(reference.preview))}"
        ></video>
      </span>
    `;
  }

  const icon = reference.source_type === "url"
    ? "i-link"
    : reference.role === "source_material"
      ? "i-file-text"
      : "i-image";

  return `
    <span class="reference-list-icon">
      <svg><use href="#${icon}"/></svg>
    </span>
  `;
}

export function createReferenceWorkflow({
  api,
  rawApi,
  mediaUrl,
  getState,
  onState,
  toast,
  onSelectionChange
}) {
  const dialogNode = $("#reference-dialog");
  const dialog = bindDialog(dialogNode);

  let selectedReferenceId = null;
  let selectionTouched = false;
  let pendingFile = null;
  let uploading = false;

  function referenceById(id) {
    return (getState()?.references || [])
      .find(item => item.id === id) || null;
  }

  function setSelected(id, { manual = true } = {}) {
    selectedReferenceId = id || null;
    if (manual) selectionTouched = true;
    renderSelection();
    renderRecent();
    onSelectionChange?.(
      selectedReferenceId,
      referenceById(selectedReferenceId)
    );
  }

  function getSelectedId() {
    return selectedReferenceId;
  }

  function setFromRun(run) {
    if (selectionTouched) return;
    if (!run?.reference_id) return;
    if (selectedReferenceId) return;
    setSelected(run.reference_id, { manual: false });
  }

  function renderSelection() {
    const chip = $("#selected-reference");
    const reference = referenceById(selectedReferenceId);

    chip.classList.toggle("empty", !reference);
    chip.querySelector("span").textContent =
      reference?.name || "No reference";
    chip.querySelector("small").textContent = reference
      ? reference.role === "source_material"
        ? "Source material"
        : "Visual reference"
      : "Add one";
  }

  function renderRecent() {
    const list = $("#reference-list");
    const references = getState()?.references || [];

    if (!references.length) {
      list.innerHTML =
        '<div class="aurora-empty-state">No references yet.</div>';
      return;
    }

    list.innerHTML = references.map(reference => {
      const selected = reference.id === selectedReferenceId;
      const detail = [
        reference.role === "source_material"
          ? "Source material"
          : "Visual reference",
        reference.source_type === "url"
          ? "Link"
          : reference.original_name || titleCase(reference.source_type)
      ].filter(Boolean).join(" · ");

      return `
        <button
          class="reference-list-item ${selected ? "selected" : ""}"
          type="button"
          data-reference-id="${escapeHtml(reference.id)}"
        >
          ${previewMarkup(reference, mediaUrl)}
          <span>
            <strong>${escapeHtml(reference.name)}</strong>
            <small>${escapeHtml(detail)}</small>
          </span>
          ${
            selected
              ? '<svg class="reference-check"><use href="#i-check"/></svg>'
              : ""
          }
        </button>
      `;
    }).join("");

    list.querySelectorAll("[data-reference-id]").forEach(button => {
      button.addEventListener("click", () => {
        setSelected(button.dataset.referenceId);
        dialog.close("selected");
      });
    });
  }

  function switchTab(name) {
    $$("[data-reference-tab]").forEach(button => {
      const active = button.dataset.referenceTab === name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    $$("[data-reference-panel]").forEach(panel => {
      panel.classList.toggle(
        "active",
        panel.dataset.referencePanel === name
      );
    });
  }

  function setPendingFile(file) {
    pendingFile = file || null;
    const selection = $("#reference-upload-selection");
    const name = $("#reference-upload-name");

    selection.hidden = !pendingFile;
    name.textContent = pendingFile
      ? `${pendingFile.name} · ${Math.max(1, Math.round(pendingFile.size / 1024))} KB`
      : "";
  }

  async function uploadPending() {
    if (!pendingFile || uploading) return;

    const button = $("#reference-upload-submit");
    uploading = true;
    button.disabled = true;
    button.textContent = "Uploading…";

    try {
      const payload = await rawApi("/api/reference-upload", {
        method: "POST",
        headers: {
          "Content-Type":
            pendingFile.type || "application/octet-stream",
          "X-Aurora-Filename": encodeURIComponent(pendingFile.name),
          "X-Aurora-Reference-Role": selectedRole("upload-reference-role")
        },
        body: pendingFile
      });

      onState(payload.state);
      setSelected(payload.reference.id);
      setPendingFile(null);
      $("#reference-file").value = "";
      toast("Reference added.");
      dialog.close("uploaded");
    } catch (error) {
      toast(error.message, true);
    } finally {
      uploading = false;
      button.disabled = false;
      button.textContent = "Add reference";
    }
  }

  async function addLink(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Adding…";

    try {
      const payload = await api("/api/reference-link", {
        method: "POST",
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(),
          url: String(data.get("url") || "").trim(),
          role: String(data.get("role") || "visual")
        })
      });

      onState(payload.state);
      setSelected(payload.reference.id);
      form.reset();
      toast("Reference link added.");
      dialog.close("linked");
    } catch (error) {
      toast(error.message, true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Add link";
    }
  }

  $("#reference-open").addEventListener("click", () => {
    renderRecent();
    dialog.open();
  });

  $("#selected-reference").addEventListener("click", () => {
    renderRecent();
    dialog.open();
  });

  $$("[data-reference-tab]").forEach(button => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.referenceTab);
    });
  });

  $("#reference-file").addEventListener("change", event => {
    setPendingFile(event.target.files?.[0] || null);
  });

  const dropzone = $("#reference-dropzone");
  for (const eventName of ["dragenter", "dragover"]) {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    });
  }

  for (const eventName of ["dragleave", "drop"]) {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      dropzone.classList.remove("dragging");
    });
  }

  dropzone.addEventListener("drop", event => {
    const file = event.dataTransfer?.files?.[0] || null;
    if (file) {
      setPendingFile(file);
    }
  });

  $("#reference-upload-submit").addEventListener(
    "click",
    uploadPending
  );

  $("#reference-link-form").addEventListener(
    "submit",
    addLink
  );

  $("#reference-clear").addEventListener("click", () => {
    setSelected(null);
    toast("Reference cleared.");
  });

  return {
    dialog,
    getSelectedId,
    render() {
      renderSelection();
      renderRecent();
    },
    setFromRun,
    setSelected
  };
}
