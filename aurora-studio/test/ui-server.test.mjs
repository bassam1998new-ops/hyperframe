import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStudioUiServer } from "../src/ui-server.mjs";
import { writeConfiguredWorkspace } from "../src/configured-setup.mjs";
import { hyperframesBin } from "../src/tool-install.mjs";
import {
  checkpoint,
  createRun,
  loadRun,
  setRunRoute
} from "../src/governance.mjs";
import {
  createBuildPlan,
  readBuildPlan
} from "../src/build-plan.mjs";
import {
  createConceptSet,
  readConceptSet
} from "../src/concepts.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(HERE, "../bin/aurora-studio.mjs");

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-ui-server-"));
}

function fakeRuntime(cwd) {
  const hf = hyperframesBin(cwd);
  fs.mkdirSync(path.dirname(hf), { recursive: true });
  fs.writeFileSync(hf, "");

  const ffmpeg = path.join(
    cwd,
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  fs.writeFileSync(ffmpeg, "");

  return { hf, ffmpeg };
}

test("Studio API requires its local session token and mode action uses real CLI", async () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    studio: "AurorA Studio",
    default_mode: "direct",
    project: { product: "Demo", purpose: "video" },
    tools: [],
    resources: {}
  }));

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const unauthorized = await fetch(`http://127.0.0.1:${ui.port}/api/state`);
    assert.equal(unauthorized.status, 401);

    const stateResponse = await fetch(`http://127.0.0.1:${ui.port}/api/state`, {
      headers: { "X-Aurora-Token": ui.token }
    });
    assert.equal(stateResponse.status, 200);
    const state = await stateResponse.json();
    assert.equal(state.workspace.mode, "direct");

    const modeResponse = await fetch(`http://127.0.0.1:${ui.port}/api/mode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurora-Token": ui.token
      },
      body: JSON.stringify({ mode: "director" })
    });
    assert.equal(modeResponse.status, 200);

    const changed = JSON.parse(
      fs.readFileSync(path.join(cwd, ".aurora", "workspace.json"), "utf8")
    );
    assert.equal(changed.default_mode, "director");
  } finally {
    await ui.close();
  }
});

test("Studio static shell is available without exposing workspace API", async () => {
  const cwd = temp();
  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const page = await fetch(`http://127.0.0.1:${ui.port}/`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /AurorA Studio/);
    assert.match(html, /LIVE PREVIEW/);
  } finally {
    await ui.close();
  }
});


test("first-run UI setup creates the real AurorA workspace", async () => {
  const cwd = temp();
  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const response = await fetch(`http://127.0.0.1:${ui.port}/api/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurora-Token": ui.token
      },
      body: JSON.stringify({
        product: "UI Product",
        purpose: "launch videos",
        website: "https://example.test",
        mode: "director",
        install_hyperframes: false,
        install_agents: false,
        resources: {}
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.state.configured, true);
    assert.equal(payload.state.workspace.mode, "director");
    assert.equal(payload.state.project.product, "UI Product");
    assert.ok(
      fs.existsSync(path.join(cwd, ".aurora", "system", "ui", "index.html"))
    );
  } finally {
    await ui.close();
  }
});

test("Project UI writes through the existing project set command", async () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    studio: "AurorA Studio",
    default_mode: "direct",
    project: { product: "Old", purpose: "video", website: "" },
    tools: [],
    resources: {}
  }));
  fs.writeFileSync(path.join(cwd, ".aurora", "project.json"), JSON.stringify({
    schema_version: 1,
    project_id: "old",
    product: "Old",
    purpose: "video",
    website: "",
    audience: [],
    offer: "",
    positioning: "",
    brand: {
      personality: [],
      colors: [],
      fonts: [],
      logo_paths: [],
      avoid: []
    },
    content: {
      channels: [],
      default_formats: [],
      languages: [],
      recurring_series: []
    },
    creative: {
      preferred_moods: [],
      avoid_moods: [],
      recurring_constraints: []
    },
    notes: []
  }));

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const response = await fetch(`http://127.0.0.1:${ui.port}/api/project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurora-Token": ui.token
      },
      body: JSON.stringify({
        changes: {
          product: "New Product",
          audience: ["Founders", "Marketers"],
          "brand.colors": ["#111111", "#8844ff"]
        }
      })
    });

    assert.equal(response.status, 200);
    const project = JSON.parse(
      fs.readFileSync(path.join(cwd, ".aurora", "project.json"), "utf8")
    );
    assert.equal(project.product, "New Product");
    assert.deepEqual(project.audience, ["Founders", "Marketers"]);
    assert.deepEqual(project.brand.colors, ["#111111", "#8844ff"]);
  } finally {
    await ui.close();
  }
});

test("Settings UI persists resource availability without installing tools", async () => {
  const cwd = temp();
  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    schema_version: 1,
    studio: "AurorA Studio",
    default_mode: "direct",
    project: { product: "Demo", purpose: "video", website: "" },
    tools: [],
    integrations: [],
    resources: {
      browser_control: false,
      chatgpt_browser: false,
      google_flow: false,
      meta_ai: false,
      elevenlabs: false,
      local_paths: []
    },
    learning: {
      decision_log: ".aurora/decisions.jsonl",
      lesson_log: ".aurora/lessons.jsonl",
      approved_only: true
    }
  }));
  fs.writeFileSync(path.join(cwd, ".aurora", "project.json"), JSON.stringify({
    schema_version: 1,
    project_id: "demo",
    product: "Demo",
    purpose: "video",
    website: "",
    audience: [],
    offer: "",
    positioning: "",
    brand: { personality: [], colors: [], fonts: [], logo_paths: [], avoid: [] },
    content: { channels: [], default_formats: [], languages: [], recurring_series: [] },
    creative: { preferred_moods: [], avoid_moods: [], recurring_constraints: [] },
    claims_to_protect: [],
    sources: [],
    notes: []
  }));

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const response = await fetch(`http://127.0.0.1:${ui.port}/api/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurora-Token": ui.token
      },
      body: JSON.stringify({
        resources: {
          browser_control: true,
          google_flow: true,
          elevenlabs: true,
          local_paths: ["D:/Assets"]
        }
      })
    });

    assert.equal(response.status, 200);
    const workspace = JSON.parse(
      fs.readFileSync(path.join(cwd, ".aurora", "workspace.json"), "utf8")
    );
    assert.equal(workspace.resources.browser_control, true);
    assert.equal(workspace.resources.google_flow, true);
    assert.equal(workspace.resources.elevenlabs, true);
    assert.deepEqual(workspace.resources.local_paths, ["D:/Assets"]);
  } finally {
    await ui.close();
  }
});


test("reference endpoints create real tracked references and reject unsafe input", async () => {
  const cwd = temp();
  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const linkResponse = await fetch(
      `http://127.0.0.1:${ui.port}/api/reference-link`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aurora-Token": ui.token
        },
        body: JSON.stringify({
          name: "Launch Reference",
          url: "https://example.com/reference",
          role: "visual"
        })
      }
    );

    assert.equal(linkResponse.status, 200);
    const linkPayload = await linkResponse.json();
    assert.equal(linkPayload.reference.source.type, "url");
    assert.equal(linkPayload.reference.source.role, "visual");

    const uploadResponse = await fetch(
      `http://127.0.0.1:${ui.port}/api/reference-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
          "Content-Length": "10",
          "X-Aurora-Token": ui.token,
          "X-Aurora-Filename": encodeURIComponent("hero.png"),
          "X-Aurora-Reference-Role": "source_material"
        },
        body: Buffer.from("0123456789")
      }
    );

    assert.equal(uploadResponse.status, 200);
    const uploadPayload = await uploadResponse.json();
    assert.equal(uploadPayload.reference.source.type, "file");
    assert.equal(uploadPayload.reference.source.role, "source_material");
    assert.match(uploadPayload.reference.source.value, /^\.aurora\/references\/files\//);

    const badLink = await fetch(
      `http://127.0.0.1:${ui.port}/api/reference-link`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aurora-Token": ui.token
        },
        body: JSON.stringify({
          name: "Unsafe",
          url: "file:///etc/passwd"
        })
      }
    );
    assert.equal(badLink.status, 400);
  } finally {
    await ui.close();
  }
});

test("Create API persists selected reference quality and aspect into the real run plan", async () => {
  const cwd = temp();
  const { ffmpeg } = fakeRuntime(cwd);
  const previousFfmpeg = process.env.AURORA_FFMPEG_PATH;
  process.env.AURORA_FFMPEG_PATH = ffmpeg;

  try {
    writeConfiguredWorkspace({
      product: "UI-11 Product",
      purpose: "launch videos",
      mode: "direct",
      agents: "none",
      install_hyperframes: false,
      resources: {}
    }, { cwd });

    const ui = await startStudioUiServer({
      cwd,
      port: 0,
      open: false,
      cliPath: CLI
    });

    try {
      const refResponse = await fetch(
        `http://127.0.0.1:${ui.port}/api/reference-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Aurora-Token": ui.token
          },
          body: JSON.stringify({
            name: "Premium Reference",
            url: "https://example.com/premium-reference",
            role: "visual"
          })
        }
      );
      assert.equal(refResponse.status, 200);
      const reference = (await refResponse.json()).reference;

      const planResponse = await fetch(
        `http://127.0.0.1:${ui.port}/api/plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Aurora-Token": ui.token
          },
          body: JSON.stringify({
            task: "Make a premium vertical launch film",
            referenceId: reference.id,
            quality: "hero",
            aspect: "9:16"
          })
        }
      );

      assert.equal(planResponse.status, 200);
      const payload = await planResponse.json();
      assert.equal(payload.state.active_run.reference_id, reference.id);
      assert.deepEqual(payload.state.active_run.intent, {
        quality: "hero",
        aspect: "9:16"
      });

      const runId = payload.state.active_run.id;
      const plan = JSON.parse(
        fs.readFileSync(
          path.join(cwd, ".aurora", "runs", runId, "plan.json"),
          "utf8"
        )
      );

      assert.equal(plan.reference_id, reference.id);
      assert.deepEqual(plan.intent, {
        quality: "hero",
        aspect: "9:16"
      });
    } finally {
      await ui.close();
    }
  } finally {
    if (previousFfmpeg === undefined) delete process.env.AURORA_FFMPEG_PATH;
    else process.env.AURORA_FFMPEG_PATH = previousFfmpeg;
  }
});


test("Director concept UI endpoints select and refine real run artifacts", async () => {
  const cwd = temp();

  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    schema_version: 1,
    studio: "AurorA Studio",
    default_mode: "director",
    project: {
      product: "Director Product",
      purpose: "launch videos",
      website: ""
    },
    tools: [],
    integrations: [],
    resources: {},
    learning: {
      decision_log: ".aurora/decisions.jsonl",
      lesson_log: ".aurora/lessons.jsonl",
      approved_only: true
    }
  }));
  fs.writeFileSync(path.join(cwd, ".aurora", "project.json"), JSON.stringify({
    schema_version: 1,
    project_id: "director-product",
    product: "Director Product",
    purpose: "launch videos",
    website: "",
    audience: [],
    offer: "",
    positioning: "",
    brand: {
      personality: [],
      colors: [],
      fonts: [],
      logo_paths: [],
      avoid: []
    },
    content: {
      channels: [],
      default_formats: [],
      languages: [],
      recurring_series: []
    },
    creative: {
      preferred_moods: [],
      avoid_moods: [],
      recurring_constraints: []
    },
    claims_to_protect: [],
    sources: [],
    notes: []
  }));

  const run = createRun({
    cwd,
    task: "Director UI concept test",
    mode: "director",
    routeDecision: null
  });

  checkpoint({
    cwd,
    runId: run.id,
    stage: "understand",
    status: "completed"
  });

  const record = createConceptSet(run.id, cwd);
  record.concept_set.status = "ready";
  record.concept_set.concepts = [
    {
      id: "a",
      name: "Direction A",
      core_idea: "Quiet build into a clean reveal.",
      project_fit: "Fits the premium product.",
      emotional_arc: "Curiosity to confidence.",
      visual_motion_grammar: ["slow orbit", "restrained type"],
      complexity: "medium",
      cost_class: "low",
      biggest_risk: "Could be too restrained.",
      preview: null,
      notes: []
    },
    {
      id: "b",
      name: "Direction B",
      core_idea: "Fast signal pattern becomes the product.",
      project_fit: "Fits the technology story.",
      emotional_arc: "Tension to clarity.",
      visual_motion_grammar: ["signal pulse", "sharp edit"],
      complexity: "high",
      cost_class: "medium",
      biggest_risk: "Could feel too technical.",
      preview: null,
      notes: []
    }
  ];
  fs.writeFileSync(
    record.file,
    JSON.stringify(record.concept_set, null, 2) + "\n"
  );

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  try {
    const selectResponse = await fetch(
      `http://127.0.0.1:${ui.port}/api/concept-select`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aurora-Token": ui.token
        },
        body: JSON.stringify({
          runId: run.id,
          conceptId: "b"
        })
      }
    );

    assert.equal(selectResponse.status, 200);
    const selectedPayload = await selectResponse.json();
    assert.equal(
      selectedPayload.state.active_run.concepts.selected_id,
      "b"
    );
    assert.equal(
      selectedPayload.state.active_run.concepts.selected.name,
      "Direction B"
    );

    let saved = loadRun(cwd, run.id);
    assert.equal(saved.state.checkpoints.concept.status, "completed");
    assert.equal(saved.state.checkpoints.concept.human_approved, true);

    const refineResponse = await fetch(
      `http://127.0.0.1:${ui.port}/api/concept-refine`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aurora-Token": ui.token
        },
        body: JSON.stringify({
          runId: run.id,
          conceptId: "b",
          note: "Keep the signal idea but make it warmer."
        })
      }
    );

    assert.equal(refineResponse.status, 200);
    const refinedPayload = await refineResponse.json();
    assert.equal(
      refinedPayload.state.active_run.concepts.status,
      "pending"
    );
    assert.equal(
      refinedPayload.state.active_run.concepts.selected_id,
      null
    );
    assert.equal(
      refinedPayload.state.active_run.concepts.refinement_requests.length,
      1
    );

    const reread = readConceptSet(run.id, cwd);
    assert.equal(reread.concept_set.status, "pending");
    assert.equal(reread.concept_set.selected_id, null);
    assert.equal(
      reread.concept_set.refinement_requests[0].note,
      "Keep the signal idea but make it warmer."
    );

    saved = loadRun(cwd, run.id);
    assert.equal(saved.state.checkpoints.concept.status, "in_progress");
  } finally {
    await ui.close();
  }
});


test("Storyboard UI endpoints mutate the real build plan safely", async () => {
  const cwd = temp();

  fs.mkdirSync(path.join(cwd, ".aurora"), { recursive: true });
  fs.writeFileSync(path.join(cwd, ".aurora", "workspace.json"), JSON.stringify({
    schema_version: 1,
    studio: "AurorA Studio",
    default_mode: "direct",
    project: {
      product: "Storyboard Product",
      purpose: "social video",
      website: ""
    },
    tools: [],
    integrations: [],
    resources: {},
    learning: {
      decision_log: ".aurora/decisions.jsonl",
      lesson_log: ".aurora/lessons.jsonl",
      approved_only: true
    }
  }));
  fs.writeFileSync(path.join(cwd, ".aurora", "project.json"), JSON.stringify({
    schema_version: 1,
    project_id: "storyboard-product",
    product: "Storyboard Product",
    purpose: "social video",
    website: "",
    audience: [],
    offer: "",
    positioning: "",
    brand: {
      personality: [],
      colors: [],
      fonts: [],
      logo_paths: [],
      avoid: []
    },
    content: {
      channels: [],
      default_formats: [],
      languages: [],
      recurring_series: []
    },
    creative: {
      preferred_moods: [],
      avoid_moods: [],
      recurring_constraints: []
    },
    claims_to_protect: [],
    sources: [],
    notes: []
  }));

  const run = createRun({
    cwd,
    task: "Storyboard UI test",
    mode: "direct",
    routeDecision: null,
    intent: {
      quality: "premium",
      aspect: "16:9"
    }
  });

  checkpoint({ cwd, runId: run.id, stage: "understand", status: "completed" });
  checkpoint({ cwd, runId: run.id, stage: "concept", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "mood", status: "skipped" });
  checkpoint({ cwd, runId: run.id, stage: "assets", status: "completed" });

  setRunRoute({
    cwd,
    runId: run.id,
    routeDecision: {
      selected: {
        route: ["hyperframe", "blender"],
        score: 9
      },
      confidence: 0.9,
      candidates: [{
        route: ["hyperframe", "blender"],
        score: 9
      }]
    }
  });

  createBuildPlan(run.id, cwd);

  const ui = await startStudioUiServer({
    cwd,
    port: 0,
    open: false,
    cliPath: CLI
  });

  const post = async (pathName, body) => {
    const response = await fetch(
      `http://127.0.0.1:${ui.port}${pathName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aurora-Token": ui.token
        },
        body: JSON.stringify(body)
      }
    );
    return {
      response,
      payload: await response.json()
    };
  };

  try {
    const a = await post("/api/storyboard-add", {
      runId: run.id,
      purpose: "Open with product",
      duration_seconds: 2.5,
      engine: "hyperframe",
      quality: "premium",
      output: "renders/open.mp4"
    });
    assert.equal(a.response.status, 200);

    const b = await post("/api/storyboard-add", {
      runId: run.id,
      purpose: "3D hero",
      duration_seconds: 4,
      engine: "blender",
      quality: "hero",
      output: ""
    });
    assert.equal(b.response.status, 200);

    assert.equal(b.payload.state.active_run.shots.length, 2);
    assert.equal(b.payload.state.active_run.storyboard_editable, true);
    assert.equal(
      b.payload.state.active_run.build_plan_status,
      "pending"
    );

    const updated = await post("/api/storyboard-update", {
      runId: run.id,
      shotId: b.payload.shot_id,
      changes: {
        purpose: "3D hero revised",
        duration_seconds: 5,
        quality: "premium"
      }
    });
    assert.equal(updated.response.status, 200);

    const reordered = await post("/api/storyboard-reorder", {
      runId: run.id,
      order: [b.payload.shot_id, a.payload.shot_id]
    });
    assert.equal(reordered.response.status, 200);
    assert.deepEqual(
      reordered.payload.state.active_run.shots.map(shot => shot.id),
      [b.payload.shot_id, a.payload.shot_id]
    );

    const duplicated = await post("/api/storyboard-duplicate", {
      runId: run.id,
      shotId: a.payload.shot_id
    });
    assert.equal(duplicated.response.status, 200);
    assert.ok(duplicated.payload.shot_id);
    assert.equal(duplicated.payload.state.active_run.shots.length, 3);

    const moved = await post("/api/storyboard-move", {
      runId: run.id,
      shotId: duplicated.payload.shot_id,
      direction: "up"
    });
    assert.equal(moved.response.status, 200);

    const removed = await post("/api/storyboard-remove", {
      runId: run.id,
      shotId: duplicated.payload.shot_id
    });
    assert.equal(removed.response.status, 200);
    assert.equal(removed.payload.state.active_run.shots.length, 2);

    const invalidEngine = await post("/api/storyboard-update", {
      runId: run.id,
      shotId: a.payload.shot_id,
      changes: {
        engine: "after_effects"
      }
    });
    assert.equal(invalidEngine.response.status, 400);
    assert.match(
      invalidEngine.payload.error,
      /selected production route/
    );

    const plan = readBuildPlan(run.id, cwd).plan;
    assert.equal(plan.status, "pending");
    assert.equal(plan.shots.length, 2);
    assert.equal(plan.shots[0].purpose, "3D hero revised");

    const saved = loadRun(cwd, run.id);
    assert.equal(saved.state.current_stage, "build_plan");
    assert.equal(
      saved.state.checkpoints.build_plan.status,
      "in_progress"
    );
  } finally {
    await ui.close();
  }
});
