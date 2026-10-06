
import { bindDialog } from "../dialog.js";
import { escapeHtml, titleCase } from "../format.js";

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const THREE_D = new Set(["model","rig","animation","material","hdri"]);

function caps(kind) {
  if (kind === "video") return ["video_generation"];
  if (kind === "image") return ["image_generation"];
  if (kind === "audio") return ["audio_generation"];
  if (THREE_D.has(kind)) return ["true_3d"];
  return [];
}

function providerList(all, need) {
  if (!need) return [];
  if (need.kind === "audio") return all.filter(p => p.id === "elevenlabs");
  if (need.kind === "video") return all.filter(p => p.id === "google_flow");
  if (THREE_D.has(need.kind)) return [];
  return all.filter(p => ["chatgpt_browser","meta_ai"].includes(p.id));
}

function http(value) {
  try {
    const u = new URL(String(value || ""));
    return ["http:","https:"].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

function summary(needs) {
  if (!needs.length) return "No external/reusable assets are needed.";
  const counts = {};
  for (const item of needs) counts[item.decision] = (counts[item.decision] || 0) + 1;
  return "Asset decisions confirmed: " +
    Object.entries(counts).map(([key,val]) => val + " " + titleCase(key)).join(", ") +
    ".";
}

export function createAssetWorkflow({ api, getState, onState, mediaUrl, toast }) {
  const drawer = bindDialog($("#asset-drawer"));
  const costDialog = bindDialog($("#cost-approval-dialog"));
  const openButton = $("#assets-open");
  const needForm = $("#asset-need-form");
  const completeButton = $("#asset-plan-complete");
  const summaryInput = $("#asset-plan-summary");
  const libraryQuery = $("#asset-library-query");
  const openForm = $("#asset-open-search");
  const generationForm = $("#generation-form");

  let tab = "needs";
  let needId = null;
  let providerId = null;
  let openResults = [];
  let searched = false;
  let approvalPayload = null;

  const run = () => getState()?.active_run || null;
  const plan = () => run()?.asset_plan || null;
  const editable = () => Boolean(plan()?.editable);
  const need = () => plan()?.needs?.find(x => x.id === needId) || null;

  function ensureNeed() {
    const needs = plan()?.needs || [];
    if (!needs.some(x => x.id === needId)) needId = needs[0]?.id || null;
  }

  function selectTab(next) {
    tab = ["needs","library","open","generate"].includes(next) ? next : "needs";
    $$("[data-asset-tab]").forEach(btn => {
      const active = btn.dataset.assetTab === tab;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    $$("[data-asset-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.assetPanel === tab);
    });
    renderAll();
  }

  function renderContext() {
    const p = plan();
    const n = need();
    const node = $("#asset-context");
    if (!p) {
      node.innerHTML = '<span class="asset-context-kind">NO ACTIVE PLAN</span><strong>Nothing to decide yet</strong><small>Start a production run first.</small>';
      return;
    }
    if (!n) {
      node.innerHTML = '<span class="asset-context-kind">' + escapeHtml(titleCase(p.status)) + '</span><strong>No asset need selected</strong><small>Add or select a need.</small>';
      return;
    }
    const warn = run()?.route?.length || run()?.build_plan_status
      ? '<em>Changing assets reopens routing/build/review.</em>' : '';
    node.innerHTML =
      '<span class="asset-context-kind">' + escapeHtml(titleCase(n.kind)) + '</span>' +
      '<strong>' + escapeHtml(n.description) + '</strong>' +
      '<small>' + escapeHtml(titleCase(n.decision)) + '</small>' + warn;
  }

  async function updateNeed(id, changes, message) {
    try {
      const result = await api("/api/asset-plan-update", {
        method: "POST",
        body: JSON.stringify({ runId: run().id, needId: id, changes })
      });
      onState(result.state);
      toast(message);
    } catch (error) {
      toast(error.message, true);
    }
  }

  async function removeNeed(id) {
    try {
      const result = await api("/api/asset-plan-remove", {
        method: "POST",
        body: JSON.stringify({ runId: run().id, needId: id })
      });
      if (needId === id) needId = null;
      onState(result.state);
      toast("Asset need removed.");
    } catch (error) {
      toast(error.message, true);
    }
  }

  function renderNeeds() {
    const p = plan();
    const list = $("#asset-needs-list");
    if (!p) {
      list.innerHTML = '<div class="aurora-empty-state">Start a production run first.</div>';
      return;
    }
    const needs = p.needs || [];
    needForm.hidden = !editable();
    list.innerHTML = needs.length ? needs.map(item => {
      const names = (item.selected_assets || []).map(a => a.name).join(", ") || "No tracked item selected";
      return '<article class="asset-need-card ' + (item.id === needId ? 'selected' : '') + '" data-need="' + escapeHtml(item.id) + '" tabindex="0">' +
        '<div class="asset-need-top"><div><span class="asset-need-kind">' + escapeHtml(titleCase(item.kind)) + '</span><strong>' + escapeHtml(item.description) + '</strong></div>' +
        '<span class="asset-decision-badge ' + escapeHtml(item.decision) + '">' + escapeHtml(titleCase(item.decision)) + '</span></div>' +
        '<p>' + escapeHtml(names) + '</p>' +
        '<div class="asset-need-actions">' +
        '<button class="aurora-button" type="button" data-use-library="' + escapeHtml(item.id) + '"' + (editable() ? '' : ' disabled') + '>Library</button>' +
        '<button class="aurora-button" type="button" data-build-new="' + escapeHtml(item.id) + '"' + (editable() ? '' : ' disabled') + '>Build new</button>' +
        '<button class="aurora-button" type="button" data-not-needed="' + escapeHtml(item.id) + '"' + (editable() ? '' : ' disabled') + '>Not needed</button>' +
        '<button class="aurora-icon-button asset-need-remove" type="button" data-remove-need="' + escapeHtml(item.id) + '" aria-label="Remove asset need"' + (editable() ? '' : ' disabled') + '><svg><use href="#i-trash"/></svg></button></div></article>';
    }).join("") : '<div class="aurora-empty-state">No asset needs yet. A procedural build can confirm an empty plan.</div>';

    if (!summaryInput.matches(":focus") && !summaryInput.value.trim()) {
      summaryInput.value = p.summary || summary(needs);
    }
    summaryInput.disabled = !editable();
    completeButton.disabled = !editable() || p.status === "completed";
    completeButton.textContent = p.status === "completed" ? "Assets confirmed" : "Confirm assets";

    list.querySelectorAll("[data-need]").forEach(card => {
      const choose = () => { needId = card.dataset.need; renderAll(); };
      card.addEventListener("click", e => { if (!e.target.closest("button")) choose(); });
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); }
      });
    });
    list.querySelectorAll("[data-use-library]").forEach(btn => btn.addEventListener("click", () => {
      needId = btn.dataset.useLibrary; selectTab("library");
    }));
    list.querySelectorAll("[data-build-new]").forEach(btn => btn.addEventListener("click", () => {
      const item = needs.find(x => x.id === btn.dataset.buildNew);
      updateNeed(item.id, { decision: "build_new", required_capabilities: caps(item.kind) }, "Asset will be built new.");
    }));
    list.querySelectorAll("[data-not-needed]").forEach(btn => btn.addEventListener("click", () =>
      updateNeed(btn.dataset.notNeeded, { decision: "not_needed" }, "Asset marked not needed.")
    ));
    list.querySelectorAll("[data-remove-need]").forEach(btn => btn.addEventListener("click", () =>
      removeNeed(btn.dataset.removeNeed)
    ));
  }

  function assetPreview(item) {
    if (item.preview?.type === "image") return '<img src="' + escapeHtml(mediaUrl(item.preview)) + '" alt="" />';
    if (item.preview?.type === "video") return '<video muted preload="metadata" src="' + escapeHtml(mediaUrl(item.preview)) + '"></video>';
    return '<span class="asset-kind-visual">' + escapeHtml(titleCase(item.kind || item.type || "asset")) + '</span>';
  }

  async function chooseLibrary(id, decision) {
    if (!need()) return toast("Select an asset need first.", true);
    await updateNeed(need().id, { decision, selected_library_ids: [id] },
      decision === "reuse" ? "Asset selected for reuse." : "Asset selected for modification.");
    selectTab("needs");
  }

  function renderLibrary() {
    const query = libraryQuery.value.trim().toLowerCase();
    const items = (getState()?.library_all || []).filter(item => {
      if (!query) return true;
      return [item.name,item.description,item.kind,item.type,item.source_name,item.license?.id,...(item.tags||[]),...(item.tools||[])]
        .filter(Boolean).join(" ").toLowerCase().includes(query);
    });
    const node = $("#asset-library-results");
    node.innerHTML = items.length ? items.map(item => {
      const canUse = editable() && need() && item.approved;
      return '<article class="asset-result-card"><div class="asset-result-preview">' + assetPreview(item) +
        '<span class="asset-result-status ' + (item.approved ? 'approved' : 'pending') + '">' + (item.approved ? 'Approved' : 'Pending') + '</span></div>' +
        '<div class="asset-result-body"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description || titleCase(item.kind || item.type)) + '</p>' +
        '<div class="asset-result-meta"><span>' + escapeHtml(item.source_name || "Local / project") + '</span><span>' + escapeHtml(item.license?.id || "unknown") + '</span></div></div>' +
        '<div class="asset-result-actions">' + (canUse
          ? '<button class="aurora-button" data-reuse="' + escapeHtml(item.id) + '">Reuse</button><button class="aurora-button" data-modify="' + escapeHtml(item.id) + '">Modify</button>'
          : '<button class="aurora-button" disabled>' + (need() ? 'Needs approval' : 'Select a need') + '</button>') + '</div></article>';
    }).join("") : '<div class="aurora-empty-state">No tracked Library items match this search.</div>';
    node.querySelectorAll("[data-reuse]").forEach(btn => btn.addEventListener("click", () => chooseLibrary(btn.dataset.reuse, "reuse")));
    node.querySelectorAll("[data-modify]").forEach(btn => btn.addEventListener("click", () => chooseLibrary(btn.dataset.modify, "modify")));
  }

  function renderOpen() {
    const node = $("#asset-open-results");
    if (!openResults.length) {
      node.innerHTML = searched
        ? '<div class="aurora-empty-state">No Poly Haven matches found.</div>'
        : '<div class="aurora-empty-state">Search Poly Haven when your tracked Library has no good fit.</div>';
      return;
    }
    node.innerHTML = openResults.map((item, index) => {
      const thumb = http(item.thumbnail_url);
      return '<article class="asset-result-card"><div class="asset-result-preview">' +
        (thumb ? '<img src="' + escapeHtml(thumb) + '" alt="" loading="lazy" />' : '<span class="asset-kind-visual">' + escapeHtml(titleCase(item.asset_type)) + '</span>') +
        '<span class="asset-result-status approved">CC0</span></div><div class="asset-result-body"><strong>' + escapeHtml(item.name) + '</strong><p>' +
        escapeHtml(item.description || titleCase(item.category)) + '</p><div class="asset-result-meta"><span>Poly Haven</span><span>CC0-1.0</span><span>' +
        escapeHtml(titleCase(item.asset_type)) + '</span></div></div><div class="asset-result-actions"><button class="aurora-button" data-variant="primary" data-track="' +
        index + '">' + (need() ? 'Track & use' : 'Track') + '</button></div></article>';
    }).join("");
    node.querySelectorAll("[data-track]").forEach(btn => btn.addEventListener("click", async () => {
      const asset = openResults[Number(btn.dataset.track)];
      try {
        const result = await api("/api/open-assets/track", { method: "POST", body: JSON.stringify({ asset }) });
        onState(result.state);
        if (need()) await chooseLibrary(result.item.id, "reuse");
        else toast("CC0 asset tracked in AurorA Library.");
      } catch (error) { toast(error.message, true); }
    }));
  }

  function renderGenerate() {
    const providers = providerList(getState()?.providers || [], need());
    if (!providers.some(p => p.id === providerId && p.available)) {
      providerId = providers.find(p => p.available)?.id || null;
    }
    $("#generation-providers").innerHTML = !need()
      ? '<div class="aurora-empty-state">Select an asset need first.</div>'
      : !providers.length
        ? '<div class="aurora-empty-state">No configured generator fits this asset type. Use Build new for Blender/HyperFrames.</div>'
        : providers.map(p => '<button class="provider-card ' + (p.id === providerId ? 'selected ' : '') + (p.available ? '' : 'disabled') +
          '" type="button" data-provider="' + escapeHtml(p.id) + '"' + (p.available ? '' : ' disabled') + '><span><strong>' +
          escapeHtml(p.name) + '</strong><small>' + escapeHtml(p.available ? 'Ready' : (p.blocked_reason === 'browser_control_unavailable' ? 'Browser control is off' : 'Not configured')) +
          '</small></span><em>Live cost</em></button>').join("");
    $("#generation-providers").querySelectorAll("[data-provider]").forEach(btn => btn.addEventListener("click", () => {
      providerId = btn.dataset.provider; renderGenerate();
    }));

    const requests = run()?.generation_requests || [];
    $("#generation-request-list").innerHTML = requests.length
      ? '<span class="section-label">REQUESTS</span>' + requests.map(r =>
          '<div class="generation-request-item"><span class="status-led warn"></span><div><strong>' +
          escapeHtml(r.provider_name || titleCase(r.provider)) + '</strong><small>' + escapeHtml(titleCase(r.status)) +
          (r.resolution ? ' · ' + escapeHtml(r.resolution) : '') + '</small></div></div>').join("")
      : "";

    const selectedProvider = (getState()?.providers || []).find(p => p.id === providerId);
    const disabled = !editable() || !need() || !selectedProvider?.available;
    [...generationForm.elements].forEach(el => { if (el.type !== "submit") el.disabled = disabled; });
    $("#generation-submit").disabled = disabled;
    const prompt = generationForm.elements.namedItem("prompt");
    if (need() && prompt && !prompt.matches(":focus") && !prompt.value.trim()) prompt.value = need().description;
  }

  function renderAll() {
    ensureNeed(); renderContext(); renderNeeds(); renderLibrary(); renderOpen(); renderGenerate();
  }

  needForm.addEventListener("submit", async event => {
    event.preventDefault();
    const data = new FormData(needForm);
    const description = String(data.get("description") || "").trim();
    const kind = String(data.get("kind") || "other");
    if (!description || !run() || !editable()) return;
    try {
      const result = await api("/api/asset-plan-add", { method: "POST", body: JSON.stringify({
        runId: run().id, description, kind, decision: "build_new",
        required_capabilities: caps(kind), search_queries: [description]
      }) });
      needId = result.need_id; needForm.reset(); onState(result.state); toast("Asset need added.");
    } catch (error) { toast(error.message, true); }
  });

  completeButton.addEventListener("click", async () => {
    if (!run() || !editable()) return;
    try {
      const result = await api("/api/asset-plan-complete", { method: "POST", body: JSON.stringify({
        runId: run().id, summary: summaryInput.value.trim() || summary(plan()?.needs || [])
      }) });
      onState(result.state); toast("Asset decisions confirmed."); drawer.close("completed");
    } catch (error) { toast(error.message, true); }
  });

  libraryQuery.addEventListener("input", renderLibrary);
  openForm.addEventListener("submit", async event => {
    event.preventDefault();
    const data = new FormData(openForm);
    const query = String(data.get("query") || "").trim();
    if (!query) return;
    const button = openForm.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = "Searching…";
    try {
      const result = await api("/api/open-assets/search", { method: "POST", body: JSON.stringify({
        query, type: data.get("type") || "all", limit: 12
      }) });
      openResults = result.results || []; searched = true; renderOpen();
      if (result.warning) toast(result.warning);
    } catch (error) { toast(error.message, true); }
    finally { button.disabled = false; button.textContent = "Search"; }
  });

  function generationPayload(ownerApproved) {
    const data = new FormData(generationForm);
    return {
      runId: run()?.id, needId: need()?.id, provider: providerId,
      prompt: String(data.get("prompt") || "").trim(),
      resolution: String(data.get("resolution") || "").trim() || null,
      quantity: String(data.get("quantity") || "").trim() || null,
      unit: String(data.get("unit") || "credits").trim() || "credits",
      estimated_usd: String(data.get("estimated_usd") || "").trim() || null,
      ownerApproved: Boolean(ownerApproved)
    };
  }

  async function submitGeneration(event, ownerApproved) {
    event?.preventDefault?.();
    const payload = ownerApproved && approvalPayload ? { ...approvalPayload, ownerApproved: true } : generationPayload(ownerApproved);
    if (!payload.prompt || !payload.provider || !payload.needId) return toast("Select a need and configured provider first.", true);
    try {
      const result = await api("/api/generation-request", { method: "POST", body: JSON.stringify(payload) });
      if (result.approval_required) {
        approvalPayload = payload;
        $("#cost-approval-title").textContent = "Approve " + (result.provider?.name || "provider") + " cost";
        $("#cost-approval-copy").textContent = "This request crossed your owner-approval threshold. AurorA will not continue until you approve it.";
        $("#cost-approval-metrics").innerHTML = '<div><span>Projected USD</span><strong>' +
          (result.budget?.projected_usd != null ? '$' + Number(result.budget.projected_usd).toFixed(2) : 'Unknown') +
          '</strong></div><div><span>Reason</span><strong>' + escapeHtml(titleCase(result.budget?.reason || "approval required")) + '</strong></div>';
        costDialog.open(); return;
      }
      approvalPayload = null; costDialog.close("approved"); onState(result.state);
      toast("Generation request queued for your agent.");
    } catch (error) { toast(error.message, true); }
  }

  generationForm.addEventListener("submit", e => submitGeneration(e, false));
  $("#cost-approval-cancel").addEventListener("click", () => { approvalPayload = null; costDialog.close("cancel"); });
  $("#cost-approval-confirm").addEventListener("click", () => submitGeneration(null, true));
  $$("[data-asset-tab]").forEach(btn => btn.addEventListener("click", () => selectTab(btn.dataset.assetTab)));

  function open() {
    if (!plan()) return toast("This run has no asset plan yet.", true);
    ensureNeed(); selectTab("needs"); drawer.open(); renderAll();
  }
  openButton.addEventListener("click", open);

  function sync(state = getState()) {
    const current = state?.active_run?.asset_plan;
    openButton.hidden = !current;
    openButton.disabled = !current;
    if (!current) {
      needId = null;
      if (drawer.open) drawer.close("no-plan");
      return;
    }
    ensureNeed();
    if (drawer.open) renderAll();
  }

  return { open, sync, setTab: selectTab };
}
