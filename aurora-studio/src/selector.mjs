const WEIGHTS = {
  task_fit: 0.30,
  quality: 0.25,
  control: 0.15,
  reliability: 0.10,
  cost_efficiency: 0.10,
  speed: 0.10
};

export function inferRequirements(taskText = "", overrides = {}) {
  const q = taskText.toLowerCase();
  const detected = {
    true3d: /(\b3d\b|avatar|character|rig|modeling|product render|physics|cinematic 3d)/.test(q),
    compositing: /(vfx|composit|tracking|roto|after effects|ae finish|screen replacement)/.test(q),
    motion2d: /(caption|typography|kinetic|ui|explainer|social|html|gsap|motion graphic)/.test(q),
    variants: /(variant|resize|multi-format|multiple format|9:16|16:9|1:1)/.test(q),
    captions: /(caption|subtitle|karaoke)/.test(q),
    speed_sensitive: /(fast|quick|today|rapid|draft)/.test(q),
    premium: /(premium|hero|highest quality|cinematic|photoreal|high quality)/.test(q)
  };
  return Object.fromEntries(
    Object.entries(detected).map(([key, value]) => [
      key,
      typeof overrides[key] === "boolean" ? overrides[key] : value
    ])
  );
}

function routeKey(route) {
  return route.join("+");
}

function baseDimensions(route, req) {
  const has = id => route.includes(id);
  let taskFit = 5;
  let quality = 6;
  let control = 6;
  let reliability = 8;
  let costEfficiency = 8;
  let speed = 8;

  if (req.true3d) {
    taskFit += has("blender") ? 4 : -8;
    quality += has("blender") ? 3 : -5;
    control += has("blender") ? 3 : -3;
  }

  if (req.compositing) {
    taskFit += has("after_effects") ? 4 : has("hyperframe") ? 1 : -3;
    quality += has("after_effects") ? 2 : 0;
    control += has("after_effects") ? 2 : 0;
  }

  if (req.motion2d || req.captions || req.variants) {
    taskFit += has("hyperframe") ? 4 : -4;
    control += has("hyperframe") ? 2 : 0;
    speed += has("hyperframe") ? 2 : 0;
  }

  if (req.premium && has("blender")) quality += 1;
  if (req.premium && req.compositing && has("after_effects")) quality += 1;

  const complexityPenalty = Math.max(0, route.length - 1);
  costEfficiency -= complexityPenalty * 2;
  speed -= complexityPenalty * 2;
  reliability -= complexityPenalty;

  if (req.speed_sensitive) speed += has("hyperframe") ? 1 : 0;

  const clamp = n => Math.max(0, Math.min(10, n));
  return {
    task_fit: clamp(taskFit),
    quality: clamp(quality),
    control: clamp(control),
    reliability: clamp(reliability),
    cost_efficiency: clamp(costEfficiency),
    speed: clamp(speed)
  };
}

function weightedScore(dimensions) {
  return Object.entries(WEIGHTS).reduce(
    (sum, [key, weight]) => sum + dimensions[key] * weight,
    0
  );
}

export function scoreRoutes(taskText, availability = {}, requirementOverrides = {}) {
  const req = inferRequirements(taskText, requirementOverrides);
  const candidates = [];

  const available = id => Boolean(availability[id]);

  if (available("hyperframe")) candidates.push(["hyperframe"]);
  if (available("blender")) candidates.push(["blender"]);
  if (available("after_effects")) candidates.push(["after_effects"]);

  if (available("blender") && available("hyperframe")) {
    candidates.push(["blender", "hyperframe"]);
  }
  if (available("blender") && available("after_effects")) {
    candidates.push(["blender", "after_effects"]);
  }
  if (available("after_effects") && available("hyperframe")) {
    candidates.push(["after_effects", "hyperframe"]);
  }
  if (available("blender") && available("after_effects") && available("hyperframe")) {
    candidates.push(["blender", "after_effects", "hyperframe"]);
  }

  const scored = candidates.map(route => {
    const dimensions = baseDimensions(route, req);
    return {
      route,
      route_id: routeKey(route),
      dimensions,
      score: Number(weightedScore(dimensions).toFixed(2))
    };
  }).sort((a, b) => b.score - a.score);

  return { requirements: req, candidates: scored };
}

export function chooseRoute(taskText, availability = {}, requirementOverrides = {}) {
  const result = scoreRoutes(taskText, availability, requirementOverrides);
  const top = result.candidates[0] || null;
  const safeTop = top && top.dimensions.task_fit >= 5 ? top : null;
  return {
    ...result,
    selected: safeTop,
    confidence: !safeTop
      ? 0
      : result.candidates.length < 2
        ? 0.70
        : Number(Math.min(0.99, 0.55 + Math.max(0, result.candidates[0].score - result.candidates[1].score) / 10).toFixed(2))
  };
}


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function routeEquals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((value, index) => value === b[index]);
}

export function applyExperiencePrior(decision, experience = []) {
  if (!decision?.candidates?.length) return decision;

  const approved = (experience || []).filter(item =>
    item?.approved === true &&
    Array.isArray(item.route) &&
    Number(item.retrieval_score || 0) > 0
  );

  if (!approved.length) {
    return {
      ...decision,
      experience_used: 0,
      experience_adjusted: false
    };
  }

  const candidates = decision.candidates.map(candidate => {
    let bonus = 0;
    const evidence = [];

    for (const item of approved) {
      if (!routeEquals(item.route, candidate.route)) continue;

      const relevance = clamp(Number(item.retrieval_score || 0) / 4, 0.15, 1);
      const quality = item.quality_score == null
        ? 0.85
        : clamp(Number(item.quality_score) / 10, 0.5, 1);
      const revisionFactor = item.revisions == null
        ? 1
        : clamp(1 - Math.min(Number(item.revisions) || 0, 5) * 0.08, 0.6, 1);

      const contribution = 0.35 * relevance * quality * revisionFactor;
      bonus += contribution;

      evidence.push({
        run_id: item.run_id || null,
        retrieval_score: Number(item.retrieval_score || 0),
        quality_score: item.quality_score ?? null,
        revisions: item.revisions ?? null,
        contribution: Number(contribution.toFixed(3))
      });
    }

    bonus = Math.min(0.8, bonus);

    return {
      ...candidate,
      base_score: candidate.score,
      experience_bonus: Number(bonus.toFixed(2)),
      experience_evidence: evidence,
      score: Number((candidate.score + bonus).toFixed(2))
    };
  }).sort((a, b) => b.score - a.score);

  const top = candidates[0] || null;
  const selected = top && top.dimensions.task_fit >= 5 ? top : null;
  const confidence = !selected
    ? 0
    : candidates.length < 2
      ? 0.70
      : Number(
          Math.min(
            0.99,
            0.55 + Math.max(0, candidates[0].score - candidates[1].score) / 10
          ).toFixed(2)
        );

  return {
    ...decision,
    candidates,
    selected,
    confidence,
    experience_used: approved.length,
    experience_adjusted: candidates.some(candidate => candidate.experience_bonus > 0)
  };
}
