const WEIGHTS = {
  task_fit: 0.30,
  quality: 0.25,
  control: 0.15,
  reliability: 0.10,
  cost_efficiency: 0.10,
  speed: 0.10
};

export function inferRequirements(taskText = "") {
  const q = taskText.toLowerCase();
  return {
    true3d: /(\b3d\b|avatar|character|rig|modeling|product render|physics|cinematic 3d)/.test(q),
    compositing: /(vfx|composit|tracking|roto|after effects|ae finish|screen replacement)/.test(q),
    motion2d: /(caption|typography|kinetic|ui|explainer|social|html|gsap|motion graphic)/.test(q),
    variants: /(variant|resize|multi-format|multiple format|9:16|16:9|1:1)/.test(q),
    captions: /(caption|subtitle|karaoke)/.test(q),
    speed_sensitive: /(fast|quick|today|rapid|draft)/.test(q),
    premium: /(premium|hero|highest quality|cinematic|photoreal|high quality)/.test(q)
  };
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

export function scoreRoutes(taskText, availability = {}) {
  const req = inferRequirements(taskText);
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

export function chooseRoute(taskText, availability = {}) {
  const result = scoreRoutes(taskText, availability);
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
