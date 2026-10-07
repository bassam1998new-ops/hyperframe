import { bindDialog } from "../dialog.js";
import {
  escapeHtml,
  money,
  titleCase
} from "../format.js";
import { mountMediaPlayer } from "../components/media-player.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function seconds(value) {
  const number = Number(value);
  if (!(number >= 0)) return "—";
  const minutes = Math.floor(number / 60);
  const remaining = Math.floor(number % 60);
  return minutes
    ? `${minutes}:${String(remaining).padStart(2, "0")}`
    : `${remaining}s`;
}

function copyText(value) {
  const text = String(value || "");
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();

    try {
      if (!document.execCommand("copy")) {
        throw new Error("copy_failed");
      }
      resolve();
    } catch (error) {
      reject(error);
    } finally {
      field.remove();
    }
  });
}

function humanValidationError(value) {
  const text = String(value || "");

  if (/technical/i.test(text) || /ffprobe/i.test(text)) {
    return "Technical validation has not passed yet.";
  }
  if (/visual_evidence|sampled visual review frames|Review frame/i.test(text)) {
    return "Visual review evidence is incomplete.";
  }
  if (/creative checks|creative check/i.test(text)) {
    return "AurorA has not completed every required creative quality check.";
  }
  if (/licenses_ok|license/i.test(text)) {
    return "Asset license review is incomplete.";
  }
  if (/watermark/i.test(text)) {
    return "Watermark review is incomplete.";
  }
  if (/unresolved issues/i.test(text)) {
    return "The review still has unresolved issues.";
  }
  if (/summary/i.test(text)) {
    return "AurorA review summary is incomplete.";
  }

  return "AurorA review is not ready for approval yet.";
}

function renderMedia(container, media, mediaUrl, label) {
  container.dataset.mediaKey = "";

  if (!media?.path) {
    container.innerHTML = `
      <div class="aurora-empty-state">
        No visual media is available for this view.
      </div>
    `;
    return;
  }

  const src = mediaUrl(media);

  if (media.type === "video") {
    mountMediaPlayer(container, { src, label });
    return;
  }

  if (media.type === "image") {
    container.innerHTML =
      '<img src="' + escapeHtml(src) + '" alt="' +
      escapeHtml(label) + '" />';
    return;
  }

  container.innerHTML =
    '<div class="aurora-empty-state">This reference is not directly previewable.</div>';
}

function metric(label, value) {
  return `
    <div class="review-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "—")}</strong>
    </div>
  `;
}

export function createReviewWorkflow({
  api,
  mediaUrl,
  getState,
  onState,
  toast
}) {
  const revisionDialog = bindDialog($("#revision-dialog"));
  const approvalDialog = bindDialog($("#approval-dialog"));

  let compareMode = "result";
  let revisionKind = "fix";
  let busy = false;

  function currentRun() {
    return getState()?.active_run || null;
  }

  function reviewVisible(run = currentRun()) {
    return Boolean(run?.review);
  }

  function renderReady(run = currentRun()) {
    const panel = $("#render-ready");
    const render = run?.render;

    const visible = Boolean(
      run &&
      render &&
      render.pre_render_ready &&
      !render.render_complete &&
      !reviewVisible(run)
    );

    panel.hidden = !visible;
    if (!visible) return;

    $("#render-ready-title").textContent =
      render.direct_execution_available
        ? "Ready to render"
        : "Ready — continue the render in your agent";

    $("#render-ready-copy").textContent =
      render.direct_execution_available
        ? "This route can be executed directly from Studio."
        : render.direct_execution_reason ||
          "The build is ready, but this route remains agent-driven.";

    $("#render-handoff-message").textContent =
      render.handoff_message || "";

    const candidates = render.candidates || [];
    const field = $("#render-candidate-field");
    const select = $("#render-candidate");
    const register = $("#render-register");

    field.hidden = candidates.length === 0;
    register.hidden = candidates.length === 0;

    select.innerHTML = candidates.map(item => `
      <option value="${escapeHtml(item.path)}">
        ${escapeHtml(
          (item.shot_purpose || item.shot_id || "Video output") +
          (item.engine ? " · " + titleCase(item.engine) : "")
        )}
      </option>
    `).join("");

    $("#copy-render-handoff").hidden = !render.handoff_message;
  }

  function renderCompare(run) {
    const review = run?.review;
    const result = review?.video;
    const reference = run?.selected_reference?.preview || null;
    const stage = $("#review-media-stage");

    const refTab = $("#review-reference-tab");
    const sideTab = $("#review-side-tab");
    refTab.disabled = !reference;
    sideTab.disabled = !reference;

    if (!reference && compareMode !== "result") {
      compareMode = "result";
    }

    $$("[data-review-view]").forEach(button => {
      const selected = button.dataset.reviewView === compareMode;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.tabIndex = selected ? 0 : -1;
    });

    if (compareMode === "side" && reference) {
      stage.innerHTML = `
        <div class="review-side-by-side">
          <div class="review-compare-cell">
            <span class="review-compare-label">Result</span>
            <div class="review-compare-media" id="review-result-cell"></div>
          </div>
          <div class="review-compare-cell">
            <span class="review-compare-label">Reference</span>
            <div class="review-compare-media" id="review-reference-cell"></div>
          </div>
        </div>
      `;

      renderMedia(
        $("#review-result-cell"),
        result,
        mediaUrl,
        "AurorA result"
      );
      renderMedia(
        $("#review-reference-cell"),
        reference,
        mediaUrl,
        "Visual reference"
      );
      return;
    }

    stage.innerHTML =
      '<div class="review-media-single" id="review-single-media"></div>';

    renderMedia(
      $("#review-single-media"),
      compareMode === "reference" ? reference : result,
      mediaUrl,
      compareMode === "reference"
        ? "Visual reference"
        : "AurorA result"
    );
  }

  function renderEvidence(review) {
    const container = $("#review-evidence");
    const frames = review?.evidence || [];

    if (!frames.length) {
      container.innerHTML =
        '<div class="aurora-empty-state">Visual review frames are not available yet.</div>';
      return;
    }

    container.innerHTML = frames.map(frame => `
      <div class="review-evidence-item">
        <img
          alt="Review frame ${escapeHtml(frame.index)}"
          src="${escapeHtml(mediaUrl(frame.media))}"
        />
        <span>${escapeHtml(seconds(frame.time_seconds))}</span>
      </div>
    `).join("");
  }

  function renderTechnical(review) {
    const tech = review?.technical || {};

    $("#review-technical").innerHTML = [
      metric(
        "Resolution",
        tech.width && tech.height
          ? `${tech.width}×${tech.height}`
          : "—"
      ),
      metric("Duration", seconds(tech.duration_seconds)),
      metric("Video", tech.video_codec || "—"),
      metric(
        "Audio",
        tech.audio_codec
          ? `${tech.audio_codec}${tech.audio_channels ? " · " + tech.audio_channels + "ch" : ""}`
          : "—"
      )
    ].join("");
  }

  function renderIssues(review) {
    const block = $("#review-issues-block");
    const userIssues = [
      ...(review?.issues || []),
      ...new Set(
        (review?.validation_errors || []).map(humanValidationError)
      )
    ].filter(Boolean);

    const unique = [...new Set(userIssues)];

    block.hidden = unique.length === 0;

    $("#review-issues").innerHTML = unique.map(issue => `
      <div class="review-issue">${escapeHtml(issue)}</div>
    `).join("");
  }

  function renderChecks(review) {
    const checks = [
      ...(review?.checks || []),
      {
        id: "licenses_ok",
        label: "Asset licenses",
        required: true,
        value: review?.assets?.licenses_ok ?? null
      },
      {
        id: "watermark_free",
        label: "Watermark free",
        required: true,
        value: review?.assets?.watermark_free ?? null
      }
    ];

    $("#review-checks").innerHTML = checks
      .filter(check => check.required || check.value !== null)
      .map(check => {
        const state =
          check.value === true
            ? "pass"
            : check.value === false
              ? "fail"
              : "pending";

        const label =
          check.value === true
            ? "✓"
            : check.value === false
              ? "×"
              : "—";

        return `
          <div class="review-check ${state}">
            <b>${escapeHtml(check.label)}</b>
            <span class="review-check-state">${label}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderProduction(run) {
    const route = (run?.route || []).map(titleCase).join(" → ") || "Not routed";
    const spend = money(run?.usage?.actual_usd || 0);
    const revisionCount = (run?.revisions || []).length;

    $("#review-production").innerHTML = [
      metric("Route", route),
      metric("Known spend", spend),
      metric("Quality", titleCase(run?.intent?.quality || "normal")),
      metric("Revisions", String(revisionCount))
    ].join("");
  }

  function renderApprovalState(run) {
    const approved = run?.approval?.human_approved === true;
    const finalized = Boolean(run?.final?.media?.path);
    const note = $("#review-approved-note");

    const finalLink = $("#review-open-final");
    const finalAvailable = Boolean(run.final?.media?.path);
    finalLink.hidden = !finalAvailable;
    if (finalAvailable) {
      finalLink.href = mediaUrl(run.final.media);
    } else {
      finalLink.removeAttribute("href");
    }

    if (finalized) {
      note.hidden = false;
      note.innerHTML =
        "Approved and finalized. Saved to <strong>" +
        escapeHtml(run.final.final_path || "renders/final") +
        "</strong>.";
      return;
    }

    if (approved) {
      note.hidden = false;
      note.textContent =
        run.learning?.status === "completed"
          ? "Owner approved this reviewed render. Learning is complete; finalization still needs attention."
          : "Owner approved this reviewed render. Continue the agent to finish learning and finalization.";
      return;
    }

    if (run.approval?.stale) {
      note.hidden = false;
      note.textContent =
        "Previous approval was invalidated because the reviewed render changed.";
      return;
    }

    $("#review-open-final").hidden = true;
    $("#review-open-final").removeAttribute("href");
    note.hidden = true;
    note.textContent = "";
  }

  function renderReview(run) {
    const visible = reviewVisible(run);
    $("#review-workspace").hidden = !visible;
    $("#create-workspace").hidden = visible;
    $("#create-library-shelf").hidden = visible;

    if (!visible) return;

    const review = run.review;
    const decision = review.decision || "PENDING";
    const normalized = decision.toLowerCase();

    $("#review-decision").textContent = titleCase(decision);
    $("#review-decision").className =
      "review-decision " + normalized;

    $("#review-state-pill").textContent =
      run.final?.media?.path
        ? "Finalized"
        : run.approval?.human_approved
          ? "Approved"
          : review.can_approve
            ? "Ready"
            : titleCase(decision);

    $("#review-state-pill").className =
      "review-state-pill " +
      (review.can_approve ? "pass" : normalized);

    $("#review-summary-title").textContent =
      review.can_approve
        ? "AurorA review passed"
        : decision === "FIX"
          ? "A focused fix is needed"
          : decision === "REBUILD"
            ? "The current approach needs rebuilding"
            : "Review in progress";

    $("#review-summary-copy").textContent =
      review.summary ||
      (review.can_approve
        ? "The exact reviewed render passed AurorA's technical, creative, license and watermark gates."
        : "AurorA is still completing the review or has issues that need attention.");

    renderCompare(run);
    renderEvidence(review);
    renderTechnical(review);
    renderIssues(review);
    renderChecks(review);
    renderProduction(run);
    renderApprovalState(run);

    const approved = run.approval?.human_approved === true;
    const finalized = Boolean(run.final?.media?.path);

    $("#review-approve").disabled =
      !review.can_approve ||
      approved ||
      finalized ||
      busy;

    $("#review-approve").innerHTML = finalized
      ? '<svg><use href="#i-check"/></svg> Finalized'
      : approved
        ? '<svg><use href="#i-check"/></svg> Approved'
        : '<svg><use href="#i-check"/></svg> Approve';

    $("#review-revise").disabled = finalized || busy;
    $("#review-rebuild").disabled = finalized || busy;

    const direction = $("#review-change-direction");
    direction.hidden = run.mode !== "director";
    direction.disabled = finalized || busy;
  }

  function renderAll(state = getState()) {
    const run = state?.active_run || null;
    renderReady(run);
    renderReview(run);
  }

  async function registerRender() {
    const run = currentRun();
    const path = $("#render-candidate").value;

    if (!run || !path || busy) return;

    busy = true;
    $("#render-register").disabled = true;

    try {
      const result = await api("/api/render-register", {
        method: "POST",
        body: JSON.stringify({
          runId: run.id,
          path
        })
      });

      onState(result.state);
      toast("Render registered. AurorA review started.");
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy = false;
      $("#render-register").disabled = false;
    }
  }

  async function refreshReview() {
    const run = currentRun();
    if (!run || busy) return;

    busy = true;
    $("#review-refresh").disabled = true;

    try {
      const result = await api("/api/review-refresh", {
        method: "POST",
        body: JSON.stringify({ runId: run.id })
      });

      onState(result.state);
      toast("Review evidence refreshed.");
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy = false;
      $("#review-refresh").disabled = false;
    }
  }

  function setRevisionKind(kind) {
    const run = currentRun();

    if (
      !["fix", "rebuild", "change_direction"].includes(kind)
    ) {
      kind = "fix";
    }

    if (kind === "change_direction" && run?.mode !== "director") {
      kind = "rebuild";
    }

    revisionKind = kind;

    $$("[data-revision-kind]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.revisionKind === kind
      );
    });

    const shotField = $("#revision-shot-field");
    shotField.hidden = kind === "change_direction";

    const impact = {
      fix:
        "Fix keeps the current direction and storyboard, then reopens Build.",
      rebuild:
        "Rebuild keeps the creative direction but reopens the build plan and downstream production.",
      change_direction:
        "Change direction archives the current derived plan and reopens Director concepts."
    };

    $("#revision-impact").textContent = impact[kind];
    $("#revision-dialog-title").textContent =
      kind === "fix"
        ? "Tell AurorA what to fix"
        : kind === "rebuild"
          ? "Tell AurorA what should be rebuilt"
          : "Describe the new direction";
  }

  function openRevision(kind = "fix") {
    const run = currentRun();
    if (!run) return;

    const select = $("#revision-shot");
    select.innerHTML = [
      '<option value="">Whole production</option>',
      ...(run.shots || []).map(shot =>
        '<option value="' +
        escapeHtml(shot.id) +
        '">' +
        escapeHtml(
          "Shot " +
          shot.number +
          " · " +
          (shot.purpose || shot.id)
        ) +
        "</option>"
      )
    ].join("");

    $("#revision-direction-option").hidden =
      run.mode !== "director";

    $("#revision-form").reset();
    setRevisionKind(kind);
    revisionDialog.open();
  }

  async function submitRevision(event) {
    event.preventDefault();

    const run = currentRun();
    if (!run || busy) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const note = String(data.get("note") || "").trim();
    const shotId = String(data.get("shot_id") || "").trim();

    if (!note) return;

    busy = true;
    $("#revision-submit").disabled = true;

    try {
      const result = await api("/api/revision", {
        method: "POST",
        body: JSON.stringify({
          runId: run.id,
          kind: revisionKind,
          note,
          shotId: shotId || null
        })
      });

      revisionDialog.close("submitted");
      onState(result.state);
      toast(
        revisionKind === "change_direction"
          ? "Direction reopened."
          : revisionKind === "rebuild"
            ? "Production reopened at the build plan."
            : "Revision requested."
      );
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy = false;
      $("#revision-submit").disabled = false;
    }
  }

  function openApproval() {
    const run = currentRun();
    if (!run?.review?.can_approve) return;

    const review = run.review;
    $("#approval-summary").innerHTML = [
      '<div class="approval-summary-row"><span>Decision</span><strong>' +
        escapeHtml(titleCase(review.decision)) +
        "</strong></div>",
      '<div class="approval-summary-row"><span>Render</span><strong>' +
        escapeHtml(review.video?.path || "Reviewed video") +
        "</strong></div>",
      '<div class="approval-summary-row"><span>SHA-256</span><strong>' +
        escapeHtml((review.video_sha256 || "").slice(0, 16) + "…") +
        "</strong></div>"
    ].join("");

    approvalDialog.open();
  }

  async function approve() {
    const run = currentRun();
    if (!run || busy) return;

    busy = true;
    $("#approval-confirm").disabled = true;

    try {
      const result = await api("/api/approve", {
        method: "POST",
        body: JSON.stringify({
          runId: run.id,
          confirm: true
        })
      });

      approvalDialog.close("approved");
      onState(result.state);

      if (result.finalized) {
        toast("Approved and finalized.");
      } else if (result.finalization?.ok === false) {
        toast(
          "Approved, but finalization needs attention: " +
          (result.finalization.error || "unknown finalization error"),
          true
        );
      } else if (result.needs_learning) {
        toast(
          "Approved. Continue in Claude/Codex to finish learning and finalization."
        );
      } else {
        toast("Owner approval recorded.");
      }
    } catch (error) {
      toast(error.message, true);
    } finally {
      busy = false;
      $("#approval-confirm").disabled = false;
    }
  }

  const reviewTabs = $$("[data-review-view]");

  reviewTabs.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      compareMode = button.dataset.reviewView;
      renderCompare(currentRun());
    });

    button.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const enabled = reviewTabs.filter(tab => !tab.disabled);
      const current = enabled.indexOf(button);
      if (current < 0) return;

      let target = current;
      if (event.key === "ArrowLeft") target = (current - 1 + enabled.length) % enabled.length;
      if (event.key === "ArrowRight") target = (current + 1) % enabled.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = enabled.length - 1;

      const next = enabled[target];
      compareMode = next.dataset.reviewView;
      renderCompare(currentRun());
      next.focus();
    });
  });

  $("#copy-render-handoff").addEventListener("click", async () => {
    const message = currentRun()?.render?.handoff_message || "";
    if (!message) return;

    try {
      await copyText(message);
      toast("Render task copied.");
    } catch {
      toast("Could not copy the render task.", true);
    }
  });

  $("#render-register").addEventListener("click", registerRender);
  $("#review-refresh").addEventListener("click", refreshReview);
  $("#review-revise").addEventListener("click", () => openRevision("fix"));
  $("#review-rebuild").addEventListener("click", () => openRevision("rebuild"));
  $("#review-change-direction").addEventListener(
    "click",
    () => openRevision("change_direction")
  );
  $("#review-approve").addEventListener("click", openApproval);
  $("#revision-form").addEventListener("submit", submitRevision);

  $$("[data-revision-kind]").forEach(button => {
    button.addEventListener("click", () => {
      setRevisionKind(button.dataset.revisionKind);
    });
  });

  $("#approval-cancel").addEventListener(
    "click",
    () => approvalDialog.close("cancel")
  );
  $("#approval-confirm").addEventListener("click", approve);

  return {
    render: renderAll,
    sync: renderAll,
    openApproval,
    openRevision
  };
}
