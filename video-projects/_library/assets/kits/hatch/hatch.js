/* hatch kit v1 — hand-drawn "pencil cosmos" look on ONE canvas (style card: hatch-cosmos).
   Everything is drawn from the timeline time t: seeded, seek-safe, no clocks, no network.
   Colours are ROLES the brand fills (HATCH.theme). The default theme "cosmos" = the reference look.

   var K = HATCH.kit({ w: 1080, h: 1920, seed: 7, theme: "cosmos" });   // or theme: { ...brand tokens }
   K.hatch / K.blob + K.drawBlob / K.planet + K.drawPlanet / K.dot / HATCH.sparkle / K.stars + K.drawStars /
   K.rain / K.paper / K.drawFloor / K.wobble + K.drawWobble / K.speed / HATCH.ring / K.mascot + K.drawMascot /
   K.galaxy + K.drawGalaxy / K.travel + K.drawTravel / K.dive (eye → window → inner scene) / K.lift
   README.md in this folder has the full API. */
(function () {
  "use strict";

  /* ---------------- math ---------------- */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sstep(a, b, v) { v = clamp((v - a) / (b - a), 0, 1); return v * v * (3 - 2 * v); }
  function wrap(v, lo, span) { v = (v - lo) % span; if (v < 0) v += span; return lo + v; }
  function win(t, a, b) { return t >= a && t < b; }
  function hex(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function toHex(c) { return "#" + c.map(function (v) { v = Math.round(clamp(v, 0, 255)); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
  function mix(a, b, k) { var x = hex(a), y = hex(b); return toHex([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]); }
  function rgba(h, a) { var c = hex(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function lum(h) { var c = hex(h); return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]; }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

  /* ---------------- themes: roles the brand fills ----------------
     canvas  space / stage            halo   galaxy halo + vignette       ink    outlines, eyes, dark pencil
     paper   paper mode ground        light  pale pencil lines + highlights   star   star specks
     core    galaxy core glow         hero   main mascot body             buddy  companion mascot body
     a1..a6  rings, dots, planets, rays (ref: yellow, red, orange, cyan, lavender, green)
     clouds  nebula fills — leave out and they are DERIVED from a1..a6 + canvas + paper (never hand-set per brand) */
  var COSMOS = {
    canvas: "#140f2c", halo: "#322451", ink: "#1a1030", paper: "#e4e4db", light: "#f1e6dc", star: "#d8d2ff", core: "#fff6a0",
    hero: "#d57452", buddy: "#e4f0ee",
    a1: "#f2c335", a2: "#e5336a", a3: "#f19a36", a4: "#2fc3d3", a5: "#8f88d6", a6: "#2dc08a",
    // measured on the reference (fills solved for alpha 0.85 so the composite matches its medians)
    clouds: { pink: "#d79bb1", pinkL: "#e2b3c4", tealL: "#87c5d2", tealD: "#4890a6", green: "#7db69a", greyLilac: "#acb2d7",
      mag: "#a43364", magD: "#6f295a", rose: "#a85f71", mauve: "#764d72", greyMauve: "#9b8f99", maroon: "#563147", violet: "#5d5590" },
    heroHatch: "rgba(112,38,20,0.6)", heroLight: "rgba(255,190,160,0.45)", heroGlow: "rgba(241,154,54,0.30)",
    buddyHatch: "rgba(34,86,100,0.5)", buddyLight: "rgba(255,255,255,0.7)", buddyGlow: "rgba(135,197,210,0.28)"
  };
  var THEMES = {
    cosmos: COSMOS,
    // brand/<name>.md: midnight #1F1428, panels #2B1C38, violet/lavender chrome, white, pink only as punctuation,
    // one scarce mint. Hexes as in the node-explainer kit's midnight theme; clouds derived.
    midnight: { canvas: "#1F1428", halo: "#2B1C38", ink: "#0d0919", paper: "#ECE8F6", light: "#F1E4FD", star: "#cfc4ff", core: "#F1E4FD", _(example colours — not a real brand)_
      hero: "#B881F5", buddy: "#F1E4FD", _(example colours — not a real brand)_
      // a2 drives the big pink masses in the reference → violet here; pink (a3) only lands on one ring, a few dots and planets
      a1: "#F1E4FD", a2: "#A15FF2", a3: "#F2617F", a4: "#816EF3", a5: "#CAA4F8", a6: "#5ED4CE" } _(example colours — not a real brand)_
  };
  function deriveClouds(T) {
    var cv = T.canvas, pp = T.paper;
    return {
      pink: mix(T.a2, pp, 0.55), pinkL: mix(T.a2, pp, 0.7), tealL: mix(T.a4, pp, 0.45), tealD: mix(T.a4, cv, 0.4),
      green: mix(T.a6, pp, 0.4), greyLilac: mix(T.a5, pp, 0.5), mag: mix(T.a2, cv, 0.3), magD: mix(T.a2, cv, 0.55),
      rose: mix(mix(T.a3, T.a2, 0.5), cv, 0.35), mauve: mix(mix(T.a5, T.a2, 0.5), cv, 0.45), greyMauve: mix(mix(T.a5, pp, 0.35), cv, 0.3),
      maroon: mix(T.a2, cv, 0.7), violet: mix(T.a5, cv, 0.45)
    };
  }
  function theme(nameOrTokens, extra) {
    var base = typeof nameOrTokens === "string" ? (THEMES[nameOrTokens] || COSMOS) : (nameOrTokens || {});
    var T = {}, k;
    var src = base === COSMOS ? COSMOS : base;
    for (k in COSMOS) if (k !== "clouds" && k.indexOf("hero") !== 0 && k.indexOf("buddy") !== 0) T[k] = COSMOS[k];
    for (k in src) T[k] = src[k];
    if (extra) for (k in extra) T[k] = extra[k];
    if (!T.hero) T.hero = COSMOS.hero;
    if (!T.buddy) T.buddy = COSMOS.buddy;
    if (!T.clouds) T.clouds = deriveClouds(T);
    T.acc = [T.a1, T.a2, T.a3, T.a4, T.a5, T.a6];
    // mascot hatch colours derive from the body fill when the brand does not set them
    function md(fill, pre) {
      if (!T[pre + "Hatch"]) T[pre + "Hatch"] = rgba(mix(fill, T.ink, 0.55), 0.55);
      if (!T[pre + "Light"]) T[pre + "Light"] = rgba(mix(fill, "#ffffff", 0.55), lum(fill) > 200 ? 0.7 : 0.45);
      if (!T[pre + "Glow"]) T[pre + "Glow"] = rgba(fill, 0.28);
    }
    md(T.hero, "hero"); md(T.buddy, "buddy");
    T.eyeInk = T.eyeInk || mix(T.ink, "#000000", 0.1);
    T.highlight = T.highlight || "#f6efe6";
    return T;
  }

  /* ---------------- 4-point needle sparkle (no rng) ---------------- */
  function sparkle(c, x, y, rv, rh, col, glow, glowCol) {
    if (rv <= 0.3) return;
    if (glow > 0) {
      var gr = Math.max(rv, rh) * 0.9, g = c.createRadialGradient(x, y, 0, x, y, gr);
      g.addColorStop(0, glowCol || col); g.addColorStop(1, "rgba(0,0,0,0)");
      c.globalAlpha = glow; c.fillStyle = g; c.beginPath(); c.arc(x, y, gr, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    }
    var k = Math.max(1.2, Math.max(rv, rh) * 0.07);
    c.fillStyle = col; c.beginPath();
    c.moveTo(x, y - rv); c.lineTo(x + k, y - k); c.lineTo(x + rh, y); c.lineTo(x + k, y + k);
    c.lineTo(x, y + rv); c.lineTo(x - k, y + k); c.lineTo(x - rh, y); c.lineTo(x - k, y - k);
    c.closePath(); c.fill();
  }
  // orbit ring: colour stroke with a thin ink edge just outside (reference)
  function ring(c, x, y, rx, ry, rot, col, lw, ink) {
    c.beginPath(); c.ellipse(x, y, rx + lw * 0.58, ry + lw * 0.58, rot, 0, Math.PI * 2); c.strokeStyle = ink; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.strokeStyle = col; c.lineWidth = lw; c.stroke();
  }
  function dashedRing(c, x, y, rx, ry, rot, col, lw) {
    c.setLineDash([9, 7]); c.strokeStyle = col; c.lineWidth = lw || 1.6;
    c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
  }

  /* ---------------- mascot geometry (measured on the reference creature) ---------------- */
  var G = { BW: 230, BH: 144 };
  G.LEG_X = [0.135, 0.31, 0.68, 0.85].map(function (f) { return (f - 0.5) * G.BW; });
  G.LEG_W = 0.08 * G.BW; G.LEG_L = 0.27 * G.BH;
  G.NUB_W = 0.15 * G.BW; G.NUB_H = 0.27 * G.BH; G.NUB_Y = 0.08 * G.BH;
  G.EYE_W = 0.083 * G.BW; G.EYE_H = 0.24 * G.BH; G.EYE_X = 0.255 * G.BW; G.EYE_Y = -0.06 * G.BH; G.EYE_R = G.EYE_W * 0.32;
  G.FOOT = G.BH / 2 + G.LEG_L + 4; // body centre → sole

  /* =====================================================================
     kit instance: seeded rng + theme + all builders
     ===================================================================== */
  function kit(opt) {
    opt = opt || {};
    var W = opt.w || 1920, H = opt.h || 1080, CX = W / 2, CY = H / 2;
    var T = theme(opt.theme || "cosmos", opt.themeExtra);
    var R = mulberry32(opt.seed == null ? 20261002 : opt.seed);
    function rr(a, b) { return a + (b - a) * R(); }
    function pick(arr) { return arr[Math.floor(R() * arr.length)]; }
    function canvas(w, h) { var x = document.createElement("canvas"); x.width = w || W; x.height = h || H; return x; }
    var K = { w: W, h: H, cx: CX, cy: CY, T: T, R: R, rr: rr, pick: pick, canvas: canvas, geom: G };

    /* ---- hatch: one Path2D of short strokes in local coords ----
       o: angle, spacing, len, gapMin, gapMax, jit, keep(x,y), lmin, lmax */
    K.hatch = function (hw, hh, o) {
      var p = new Path2D(), ang = o.angle, sp = o.spacing, len = o.len;
      var ca = Math.cos(ang), sa = Math.sin(ang), Rm = Math.hypot(hw, hh) + len;
      for (var v = -Rm; v <= Rm; v += sp * rr(0.7, 1.3)) {
        var u = -Rm + rr(0, len * 2);
        while (u < Rm) {
          var L = len * rr(o.lmin || 0.65, o.lmax || 1.4), ja = rr(-o.jit, o.jit);
          var c2 = Math.cos(ang + ja), s2 = Math.sin(ang + ja), vv = v + rr(-sp * 0.3, sp * 0.3);
          var x = u * ca - vv * sa, y = u * sa + vv * ca;
          if (Math.abs(x) < hw + len && Math.abs(y) < hh + len && (!o.keep || o.keep(x, y))) { p.moveTo(x, y); p.lineTo(x + L * c2, y + L * s2); }
          u += L + rr(o.gapMin, o.gapMax);
        }
      }
      return p;
    };
    // hatch colour = the fill darkened (subtle on light warm fills, inky on the rest) — measured
    K.hatchFor = function (h) {
      var c = hex(h), k = (c[0] > c[1] + 40 && lum(h) > 130) ? 0.85 : 0.6;
      return "rgb(" + Math.round(c[0] * k) + "," + Math.round(c[1] * k) + "," + Math.round(Math.min(255, c[2] * k * 1.05)) + ")";
    };
    function colourOf(role) { return T.clouds[role] || T[role] || role; }

    /* ---- translucent hatched blob (lumpy union of circles + faint construction arcs) ---- */
    K.blob = function (rx, ry, role, alpha, o) {
      o = o || {};
      var p = new Path2D(), arcs = new Path2D(), n = o.n || 5, col = colourOf(role);
      p.ellipse(0, 0, rx * 0.74, ry * 0.74, 0, 0, Math.PI * 2);
      for (var i = 0; i < n; i++) {
        var a = rr(0, Math.PI * 2), d = rr(0.25, 0.5), cx = Math.cos(a) * rx * d, cy = Math.sin(a) * ry * d, r = Math.min(rx, ry) * rr(0.42, 0.62);
        p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, Math.PI * 2);
        if (i < 2) { var a0 = rr(0, 6.28); arcs.moveTo(cx + Math.cos(a0) * r * 0.8, cy + Math.sin(a0) * r * 0.8); arcs.arc(cx, cy, r * 0.8, a0, a0 + rr(1.2, 2.6)); }
      }
      var rot = o.rot || 0;
      return { path: p, arcs: arcs, col: col, alpha: alpha == null ? 0.85 : alpha, rot: rot,
        hatch: K.hatch(rx * 1.15, ry * 1.15, { angle: (o.angle == null ? -1.14 : o.angle) - rot, spacing: o.spacing || 4.2, len: o.len || 12, gapMin: 2, gapMax: 11, jit: 0.07 }),
        hcol: o.hcol || K.hatchFor(col) };
    };
    // s = scale (hatch stays a thin pencil line when zoomed: width ∝ s^-0.7)
    K.drawBlob = function (c, o, x, y, s, rot, alphaMul) {
      var a = o.alpha * (alphaMul == null ? 1 : alphaMul);
      if (a <= 0.003) return;
      c.save(); c.translate(x, y); c.rotate(rot == null ? o.rot : rot); c.scale(s, s);
      c.globalAlpha = a; c.fillStyle = o.col; c.fill(o.path); c.clip(o.path);
      c.lineCap = "round"; c.lineWidth = 1.5 * Math.pow(Math.max(s, 1), 0.3) / s; c.strokeStyle = o.hcol; c.stroke(o.hatch);
      c.globalAlpha = a * 0.28; c.strokeStyle = T.ink; c.lineWidth = 1.6; c.stroke(o.arcs);
      c.restore(); c.globalAlpha = 1;
    };

    /* ---- planet: flat fill, ink outline, hatch on the shadow side; optional ring ---- */
    K.planet = function (r, role, ringRole) {
      var body = new Path2D(); body.arc(0, 0, r, 0, Math.PI * 2);
      return { r: r, col: colourOf(role), ringCol: colourOf(ringRole || role), body: body,
        hatch: K.hatch(r * 1.1, r * 1.1, { angle: -0.9, spacing: Math.max(2.6, r * 0.13), len: r * 0.5, gapMin: r * 0.06, gapMax: r * 0.3, jit: 0.06,
          keep: function (x, y) { return x * 0.75 + y * 0.35 > r * 0.12; } }) };
    };
    K.drawPlanet = function (c, p, x, y, s, rot, ringed) {
      c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
      var r = p.r;
      function band(front) {
        c.beginPath(); c.ellipse(0, 0, r * 1.85, r * 0.42, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
        c.lineWidth = Math.max(2.4, r * 0.1) + 2.6; c.strokeStyle = T.ink; c.stroke();
        c.lineWidth = Math.max(2.4, r * 0.1); c.strokeStyle = p.ringCol; c.stroke();
      }
      if (ringed) band(false);
      c.fillStyle = p.col; c.fill(p.body);
      c.save(); c.clip(p.body); c.lineCap = "round"; c.lineWidth = Math.max(1.2, r * 0.045); c.strokeStyle = rgba(T.ink, 0.6); c.stroke(p.hatch); c.restore();
      c.lineWidth = Math.max(2, r * 0.09); c.strokeStyle = T.ink; c.stroke(p.body);
      if (ringed) band(true);
      c.restore();
    };
    K.dot = function (c, x, y, r, col, lw) {
      c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.lineWidth = lw; c.strokeStyle = T.ink; c.stroke();
    };

    /* ---- star layer + pencil rain ---- */
    K.stars = function (n, hw, hh) { var a = []; for (var i = 0; i < n; i++) a.push({ x: rr(-hw, hw), y: rr(-hh, hh), s: rr(1, 2.6), a: rr(0.25, 0.85), ph: rr(0, 6.28) }); return { list: a, hw: hw }; };
    K.drawStars = function (c, L, t, drift) {
      c.fillStyle = T.star;
      for (var i = 0; i < L.list.length; i++) {
        var st = L.list[i]; c.globalAlpha = st.a * (0.6 + 0.4 * Math.sin(t * 3.3 + st.ph));
        c.fillRect(drift ? wrap(st.x - t * drift, -L.hw, L.hw * 2) : st.x, st.y, st.s, st.s);
      }
      c.globalAlpha = 1;
    };
    K.rain = function (hw, hh) { return K.hatch(hw, hh, { angle: -1.14, spacing: 30, len: 14, gapMin: 60, gapMax: 220, jit: 0.05 }); };
    K.drawRain = function (c, path, alpha) { c.globalAlpha = alpha == null ? 0.13 : alpha; c.strokeStyle = mix(T.star, "#ffffff", 0.1); c.lineWidth = 1.4; c.lineCap = "round"; c.stroke(path); c.globalAlpha = 1; };

    /* ---- texture: "paper" (cream sheet, specks + fibres, like the reference intro) or "grain" (overlay for dark scenes) ---- */
    K.paper = function (mode, w, h) {
      w = w || W; h = h || H;
      var x = canvas(w, h), g = x.getContext("2d"), i;
      if (mode === "paper") {
        g.fillStyle = T.paper; g.fillRect(0, 0, w, h);
        var vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
        vg.addColorStop(0, "rgba(255,255,255,0.05)"); vg.addColorStop(1, "rgba(60,50,40,0.06)");
        g.fillStyle = vg; g.fillRect(0, 0, w, h);
        for (i = 0; i < w * h / 160; i++) { g.fillStyle = R() < 0.6 ? "rgba(70,60,50,0.05)" : "rgba(255,255,255,0.08)"; g.fillRect(rr(0, w), rr(0, h), rr(0.8, 1.8), rr(0.8, 1.8)); }
        g.lineCap = "round";
        for (i = 0; i < w * h / 9000; i++) {
          var fx = rr(0, w), fy = rr(0, h), fa = rr(0, 6.28), fl = rr(3, 9);
          g.strokeStyle = "rgba(60,50,45," + rr(0.08, 0.22).toFixed(2) + ")"; g.lineWidth = rr(0.6, 1.2);
          g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl); g.stroke();
        }
      } else {
        for (i = 0; i < w * h / 230; i++) { g.fillStyle = R() < 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.06)"; g.fillRect(rr(0, w), rr(0, h), rr(0.8, 2), rr(0.8, 2)); }
      }
      return x;
    };
    // paper-mode floor: thin pencil line + tiny scribbles that slide with the walk
    K.floor = function (n) { var a = []; for (var i = 0; i < (n || 26); i++) a.push({ x: rr(0, 1), l: rr(14, 46), dy: rr(2, 9), a: rr(0.15, 0.35) }); return a; };
    K.drawFloor = function (c, F, y, x0, x1, t, speed) {
      c.lineCap = "round"; c.strokeStyle = rgba(T.ink, 0.35); c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
      var span = x1 - x0;
      for (var i = 0; i < F.length; i++) {
        var f = F[i], fx = x0 + wrap(f.x * span - t * (speed || 0), 0, span);
        c.strokeStyle = rgba(T.ink, f.a); c.lineWidth = 1;
        c.beginPath(); c.moveTo(fx, y + f.dy); c.lineTo(Math.min(x1, fx + f.l), y + f.dy + 0.6); c.stroke();
      }
    };

    /* ---- outline wobble: a closed shape traced with seeded noise; `boil` variants swap at boilFps (0 = fixed, like the reference) ---- */
    K.wobble = function (shape, o) {
      o = o || {};
      var n = o.points || 64, amp = o.amp || 2.5, variants = [], nv = Math.max(1, o.variants || (o.boilFps ? 3 : 1));
      for (var v = 0; v < nv; v++) {
        var ph1 = rr(0, 6.28), ph2 = rr(0, 6.28), f1 = Math.round(rr(3, 6)), f2 = Math.round(rr(7, 11)), p = new Path2D(), pts = [];
        for (var i = 0; i < n; i++) {
          var u = i / n, q = shape(u), d = amp * (0.65 * Math.sin(u * 6.283 * f1 + ph1) + 0.35 * Math.sin(u * 6.283 * f2 + ph2));
          pts.push([q[0] + q[2] * d, q[1] + q[3] * d]);
        }
        for (var j = 0; j <= n; j++) {
          var a = pts[j % n], b = pts[(j + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
          if (j === 0) p.moveTo(mx, my); else p.quadraticCurveTo(a[0], a[1], mx, my);
        }
        p.closePath(); variants.push(p);
      }
      return { v: variants, fps: o.boilFps || 0 };
    };
    // shape helpers for K.wobble: return u -> [x, y, nx, ny] (point + outward normal)
    K.ellipseShape = function (rx, ry) { return function (u) { var a = u * 6.283, x = Math.cos(a) * rx, y = Math.sin(a) * ry, l = Math.hypot(x / (rx * rx), y / (ry * ry)) || 1; return [x, y, x / (rx * rx) / l, y / (ry * ry) / l]; }; };
    K.pathOf = function (wb, t) { return wb.fps ? wb.v[Math.floor(t * wb.fps) % wb.v.length] : wb.v[0]; };
    K.drawWobble = function (c, wb, t, fill, stroke, lw) {
      var p = K.pathOf(wb, t);
      if (fill) { c.fillStyle = fill; c.fill(p); }
      if (stroke) { c.lineJoin = "round"; c.strokeStyle = stroke; c.lineWidth = lw || 3; c.stroke(p); }
    };

    /* ---- speed / radial pencil lines + concentric circles (the dive burst) ---- */
    K.speed = function (n, rings) {
      var o = { lines: [], circles: [] };
      for (var k = 0; k < (n || 420); k++) o.lines.push({ a: rr(0, 6.283), r: rr(0.05, 1.0), l: rr(40, 240), w: rr(1.0, 2.4), light: R() < 0.55 });
      for (var i = 0; i < (rings || 6); i++) o.circles.push({ r: 120 + i * 150 + rr(-20, 20), dash: i % 2 === 1 });
      return o;
    };
    // amount 0..1 (opacity), s = camera scale (lines lengthen), inner = radius kept clear
    K.drawSpeed = function (c, sp, t, x, y, amount, s, inner) {
      if (amount < 0.001) return;
      c.save(); c.translate(x, y);
      for (var ci = 0; ci < sp.circles.length; ci++) {
        var cr = sp.circles[ci].r * Math.pow(s, 0.6);
        if (cr > Math.max(W, H) * 1.3) continue;
        c.globalAlpha = 0.42 * amount; c.strokeStyle = mix(T.star, T.light, 0.3); c.lineWidth = 1.4;
        if (sp.circles[ci].dash) c.setLineDash([8, 9]);
        c.beginPath(); c.arc(0, 0, cr, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      }
      var spd = clamp((s - 1) / 3, 0, 1), reach = Math.max(W, H) * 0.42;
      c.lineCap = "round";
      for (var li = 0; li < sp.lines.length; li++) {
        var sl = sp.lines[li], r0 = inner + 40 + sl.r * reach * 2 * (0.5 + 0.5 * ((sl.r * 7.3 + t * 2.2) % 1));
        var L = sl.l * (0.4 + 1.8 * spd), ca = Math.cos(sl.a), sa = Math.sin(sl.a);
        c.globalAlpha = amount * (sl.light ? 0.5 : 0.55); c.strokeStyle = sl.light ? T.light : T.ink; c.lineWidth = sl.w;
        c.beginPath(); c.moveTo(ca * r0, sa * r0); c.lineTo(ca * (r0 + L), sa * (r0 + L)); c.stroke();
      }
      c.restore(); c.globalAlpha = 1;
    };

    /* ---- block mascot rig ----
       K.mascot({ fill, radius, hatch, light, glow, mark(c, BW, BH) })   — colours default to the theme's hero role
       state: { walk (s), walkAmt 0..1, legWiggle, look -1..1, eyes "open"|"happy"|"blink", wave 0..1, waveSide ±1, tilt, zoom, glowAmt } */
    function mascotHatch() {
      var BW = G.BW, BH = G.BH;
      return {
        main: K.hatch(BW / 2 + 10, BH / 2 + 10, { angle: -0.98, spacing: 6.5, len: 24, gapMin: 8, gapMax: 34, jit: 0.07, keep: function (x, y) { return x / BW + 1.3 * y / BH > rr(-1.1, 0.35); } }),
        cross: K.hatch(BW / 2 + 10, BH / 2 + 10, { angle: -2.3, spacing: 6.5, len: 18, gapMin: 6, gapMax: 26, jit: 0.08, keep: function (x, y) { return x * 0.6 + y > 30 + rr(-30, 30); } }),
        light: K.hatch(BW / 2 + 10, BH / 2 + 10, { angle: -0.03, spacing: 5, len: 30, gapMin: 14, gapMax: 50, jit: 0.04, keep: function (x, y) { return y < -BH * 0.12 + rr(-22, 22); } })
      };
    }
    K.mascot = function (o) {
      o = o || {};
      var role = o.role || "hero";
      return { fill: o.fill || T[role], radius: o.radius == null ? 7 : o.radius, h: mascotHatch(),
        hDark: o.hatch || T[role + "Hatch"], hLight: o.light || T[role + "Light"], glow: o.glow || T[role + "Glow"], mark: o.mark || null };
    };
    K.drawMascot = function (c, m, x, y, sc, st) {
      var BW = G.BW, BH = G.BH, z = Math.max(st.zoom || 1, 1);
      var zk = Math.pow(z, 0.35) / z; // pencil weight stays thin when the camera zooms in
      var ol = 4 * zk, ph = (st.walk || 0) * Math.PI * 2 / 0.5, amt = st.walkAmt || 0, ink = T.ink;
      c.save(); c.translate(x, y); c.scale(sc, sc);
      var ga = (st.glowAmt == null ? 1 : st.glowAmt) * (1 - sstep(1.5, 3, z));
      if (ga > 0.003 && m.glow) {
        var gw = c.createRadialGradient(0, 10, 40, 0, 10, 260);
        gw.addColorStop(0, m.glow); gw.addColorStop(1, "rgba(0,0,0,0)");
        c.globalAlpha = ga; c.fillStyle = gw; c.beginPath(); c.arc(0, 10, 260, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      }
      c.translate(0, -Math.abs(Math.sin(ph)) * 5 * amt);
      c.rotate((st.tilt || 0) + Math.sin(ph + 0.6) * 0.06 * amt);
      c.lineJoin = "round";
      for (var i = 0; i < 4; i++) { // legs behind the body, alternating pairs
        var a = (i % 2 === 0 ? 1 : -1) * Math.sin(ph) * 0.17 * amt + (st.legWiggle || 0) * Math.sin((st.walk || 0) * 9 + i * 1.7);
        c.save(); c.translate(G.LEG_X[i], BH / 2 - 6); c.rotate(a);
        rrect(c, -G.LEG_W / 2, 0, G.LEG_W, G.LEG_L + 6, G.LEG_W * 0.42);
        c.fillStyle = m.fill; c.fill(); c.lineWidth = ol; c.strokeStyle = ink; c.stroke(); c.restore();
      }
      for (var sd = -1; sd <= 1; sd += 2) { // side arms (one can wave)
        c.save(); c.translate(sd * BW / 2, G.NUB_Y);
        if (sd === st.waveSide && st.wave > 0) c.rotate(-sd * (0.7 + 0.35 * Math.sin((st.walk || 0) * 18)) * st.wave);
        rrect(c, sd < 0 ? -G.NUB_W : -6, -G.NUB_H / 2, G.NUB_W + 6, G.NUB_H, 6);
        c.fillStyle = m.fill; c.fill(); c.lineWidth = ol; c.strokeStyle = ink; c.stroke(); c.restore();
      }
      rrect(c, -BW / 2, -BH / 2, BW, BH, m.radius); c.fillStyle = m.fill; c.fill();
      c.save(); c.clip(); c.lineCap = "round"; c.lineWidth = 1.05 * zk;
      c.strokeStyle = m.hDark; c.stroke(m.h.main); c.stroke(m.h.cross);
      c.strokeStyle = m.hLight; c.stroke(m.h.light);
      if (m.mark) m.mark(c, BW, BH);
      c.restore();
      rrect(c, -BW / 2, -BH / 2, BW, BH, m.radius); c.lineWidth = ol * 1.1; c.strokeStyle = ink; c.stroke();
      var lx = (st.look || 0) * 7;
      for (var e = -1; e <= 1; e += 2) {
        var ex = e * G.EYE_X + lx, ey = G.EYE_Y;
        if (st.eyes === "happy") { // ^ ^
          c.beginPath(); c.moveTo(ex - G.EYE_W * 0.85, ey + G.EYE_H * 0.12); c.lineTo(ex, ey - G.EYE_H * 0.22); c.lineTo(ex + G.EYE_W * 0.85, ey + G.EYE_H * 0.12);
          c.lineWidth = 4.2; c.lineCap = "round"; c.strokeStyle = ink; c.stroke();
        } else if (st.eyes === "blink") {
          c.beginPath(); c.moveTo(ex - G.EYE_W * 0.6, ey); c.lineTo(ex + G.EYE_W * 0.6, ey); c.lineWidth = 4.2; c.lineCap = "round"; c.strokeStyle = ink; c.stroke();
        } else {
          rrect(c, ex - G.EYE_W / 2, ey - G.EYE_H / 2, G.EYE_W, G.EYE_H, G.EYE_R); c.fillStyle = T.eyeInk; c.fill();
          var hs = G.EYE_W * 0.36, hx = e < 0 ? ex + G.EYE_W / 2 - hs - 2.2 : ex - G.EYE_W / 2 + 2.2; // highlight faces inward
          rrect(c, hx, ey - G.EYE_H / 2 + 2.6, hs, hs, hs * 0.3); c.fillStyle = T.highlight; c.fill();
        }
      }
      c.restore();
    };
    // screen point of an eye (side -1 = the mascot's left on screen) for a mascot drawn at (x, y, sc)
    K.eyePoint = function (x, y, sc, side) { return [x + (side || -1) * G.EYE_X * sc, y + G.EYE_Y * sc]; };

    /* ---- the deep galaxy (layout traced from the reference) ----
       opt: { stars: [hw, hh], scale } */
    K.galaxy = function (o) {
      o = o || {};
      var Gx = { blobs: [], rings: [], dots: [], sparks: [], rain: null, planets: [], dashes: [], rays: [], stars: null, beams: [] };
      var plan = [
        [-344, -144, 80, 135, "violet"], [-289, -233, 62, 112, "mauve"], [-222, -255, 70, 104, "greyLilac"],
        [-22, -290, 70, 48, "tealL"], [-60, -205, 52, 40, "tealD"],
        [-178, -122, 70, 70, "green"], [-111, -70, 100, 60, "green"], [22, -133, 42, 58, "greyMauve"], [96, -92, 46, 60, "rose"],
        [-378, 66, 66, 110, "magD"], [-344, 150, 80, 165, "mag"], [-300, 300, 60, 80, "magD"],
        [11, 105, 300, 125, "pink"], [-44, 25, 210, 74, "pinkL"], [130, 190, 190, 90, "pink"], [-89, 270, 150, 74, "pink"],
        [455, 30, 140, 125, "maroon"], [344, -36, 90, 80, "maroon"], [420, 180, 120, 90, "maroon"],
        [-211, 340, 76, 54, "mauve"], [-155, 400, 90, 34, "tealD"], [266, -282, 44, 54, "tealL"], [236, -200, 28, 42, "tealD"],
        [200, -300, 30, 26, "mag"], [60, 330, 120, 50, "greyMauve"]
      ];
      for (var i = 0; i < plan.length; i++) {
        var q = plan[i], rot0 = rr(-0.3, 0.3), b = K.blob(q[2] * 1.15, q[3] * 1.15, q[4], rr(0.8, 0.88), { rot: rot0 });
        b.x = q[0]; b.y = q[1]; b.drift = rr(-0.012, 0.012); Gx.blobs.push(b);
      }
      var A = T.acc, rs = [[165, 395, A[5], -0.06], [190, 420, A[1], 0.04], [210, 440, A[2], -0.02], [245, 455, A[3], 0.03], [300, 470, A[4], -0.03]];
      for (var k = 0; k < rs.length; k++) Gx.rings.push({ rx: rs[k][0], ry: rs[k][1], col: rs[k][2], rot: rs[k][3] * 2.2, spin: rr(-0.035, 0.035), wob: rr(0, 6.28), lw: 5.5, ox: rr(-45, 45), oy: rr(-30, 30) });
      var dotCols = [A[2], mix(A[3], T.canvas, 0.2), A[3], mix(A[1], A[4], 0.3), A[0], mix(A[4], T.canvas, 0.25), T.clouds.tealL, A[1], mix(A[1], A[2], 0.5)];
      for (var d = 0; d < 56; d++) {
        var big = false, rad = Math.pow(R(), 0.8) * 300, an = rr(0, 6.283); big = R() < 0.035;
        Gx.dots.push({ r: rad, a: an, s: big ? rr(8, 10) : rr(3, 4.8), lw: big ? 2.8 : 1.2, col: big ? mix(A[3], T.canvas, 0.55) : pick(dotCols) });
      }
      var sparkCols = ["#ffffff", mix(A[0], "#ffffff", 0.7), mix(A[3], "#ffffff", 0.75), mix(A[1], "#ffffff", 0.78)];
      for (var s = 0; s < 22; s++) Gx.sparks.push({ x: rr(-760, 760), y: rr(-470, 470), r: rr(9, 20), col: pick(sparkCols), ph: rr(0, 6.28), f: rr(2.5, 5.5) });
      var sz = o.stars || [1500, 900];
      Gx.stars = K.stars(260, sz[0], sz[1]);
      Gx.rain = K.rain(sz[0], sz[1] + 50);
      Gx.planets = [
        { p: K.planet(20, "a3", "a3"), ring: 2, ph: 4.55, ringed: true, sp: 0.1 },
        { p: K.planet(21, "a2", "a2"), ring: 4, ph: 5.75, ringed: true, sp: 0.07 },
        { p: K.planet(12, mix(A[2], A[1], 0.35), "a3"), ring: 1, ph: 3.75, ringed: false, sp: 0.12 },
        { p: K.planet(11, mix(A[3], T.canvas, 0.55), "a4"), ring: 0, ph: 3.5, ringed: false, sp: 0.14 },
        { p: K.planet(11, mix(T.paper, T.a3, 0.08), "a4"), ring: 3, ph: 2.6, ringed: false, sp: 0.1 },
        { p: K.planet(12, "a1", "a3"), ring: 2, ph: 1.62, ringed: false, sp: 0.09 },
        { p: K.planet(36, mix(A[4], T.paper, 0.3), "a5"), ring: 4, ph: 2.85, ringed: false, sp: 0.04 }
      ];
      var dashCols = [A[0], mix(A[3], T.canvas, 0.15), A[2]];
      for (var dd = 0; dd < 14; dd++) Gx.dashes.push({ x: rr(-800, 800), y: rr(-470, 470), a: rr(-0.5, 0.5) + (R() < 0.4 ? 1.3 : 0), col: pick(dashCols), l: rr(8, 13) });
      var rayCols = [A[3], A[0], A[5], A[1], A[4], "#ffffff"];
      for (var ry = 0; ry < 46; ry++) Gx.rays.push({ a: rr(0, 6.283), r0: rr(60, 320), l: rr(120, 420), col: pick(rayCols) });
      for (var bm = 0; bm < 9; bm++) Gx.beams.push({ a: rr(0, 3.1416), l: rr(300, 700) });
      return Gx;
    };
    function ringPoint(rg, ang, t) {
      var rx = rg.rx * (1 + 0.03 * Math.sin(t * 0.7 + rg.wob)), px = Math.cos(ang) * rx, py = Math.sin(ang) * rg.ry;
      var cr = Math.cos(rg.rot + rg.spin * t), sr = Math.sin(rg.rot + rg.spin * t);
      return [rg.ox + px * cr - py * sr, rg.oy + px * sr + py * cr];
    }
    // v: { x, y (centre on screen), z (scale), rot, entry 0..1 (colour ray burst), clear: true }
    K.drawGalaxy = function (c, Gx, t, v) {
      var A = T.acc, ink = T.ink;
      if (v.clear !== false) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.fillStyle = T.canvas; c.fillRect(0, 0, c.canvas.width, c.canvas.height); }
      c.save(); c.translate(v.x, v.y); c.rotate(v.rot || 0);
      var z = v.z, zf = 0.55 + 0.45 * z;
      c.save(); c.scale(zf, zf); K.drawStars(c, Gx.stars, t, 0); K.drawRain(c, Gx.rain); c.restore();
      c.scale(z, z);
      c.beginPath(); c.ellipse(0, 0, 650, 900, 0.03 + t * 0.006, 0, Math.PI * 2); c.strokeStyle = ink; c.lineWidth = 2; c.stroke(); c.strokeStyle = A[0]; c.lineWidth = 5; c.stroke();
      c.beginPath(); c.ellipse(0, 0, 480, 660, 0.02 + t * 0.008, 0, Math.PI * 2); c.strokeStyle = mix(A[4], T.canvas, 0.12); c.lineWidth = 4; c.stroke();
      dashedRing(c, 0, 0, 400, 560, -0.02, rgba(mix(T.star, "#ffffff", 0.2), 0.55));
      dashedRing(c, 0, 0, 800, 980, 0.03, rgba(mix(T.star, "#ffffff", 0.2), 0.55));
      c.fillStyle = T.halo; c.globalAlpha = 0.96; c.beginPath(); c.ellipse(0, 10, 470, 560, 0.04, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1; c.strokeStyle = rgba(mix(T.halo, T.star, 0.55), 0.45); c.lineWidth = 2; c.stroke();
      for (var b = 0; b < Gx.blobs.length; b++) { var o = Gx.blobs[b]; K.drawBlob(c, o, o.x + Math.sin(t * 0.7 + b) * 5, o.y + Math.cos(t * 0.55 + b) * 4, 1, o.rot + o.drift * t, 1); }
      var cg = c.createRadialGradient(0, 0, 0, 0, 0, 170);
      cg.addColorStop(0, rgba(mix(T.core, "#ffffff", 0.3), 0.75)); cg.addColorStop(0.3, rgba(mix(T.core, A[5], 0.15), 0.25)); cg.addColorStop(1, rgba(T.core, 0));
      c.fillStyle = cg; c.beginPath(); c.arc(0, 0, 170, 0, Math.PI * 2); c.fill();
      c.strokeStyle = rgba(mix(T.core, "#ffffff", 0.5), 0.16); c.lineWidth = 1.3;
      for (var m = 0; m < Gx.beams.length; m++) { var bq = Gx.beams[m], ca0 = Math.cos(bq.a + t * 0.02), sa0 = Math.sin(bq.a + t * 0.02); c.beginPath(); c.moveTo(-ca0 * bq.l, -sa0 * bq.l); c.lineTo(ca0 * bq.l, sa0 * bq.l); c.stroke(); }
      for (var d = 0; d < Gx.dots.length; d++) { var q = Gx.dots[d], a = q.a + t * (0.35 * 120 / (q.r + 80)); K.dot(c, Math.cos(a) * q.r * 0.62, Math.sin(a) * q.r * 1.12, q.s, q.col, q.lw); }
      for (var k = 0; k < Gx.rings.length; k++) { var rg = Gx.rings[k]; ring(c, rg.ox, rg.oy, rg.rx * (1 + 0.03 * Math.sin(t * 0.7 + rg.wob)), rg.ry, rg.rot + rg.spin * t, rg.col, rg.lw, ink); }
      for (var p = 0; p < Gx.planets.length; p++) { var pl = Gx.planets[p], pt = ringPoint(Gx.rings[pl.ring], pl.ph + t * pl.sp, t); K.drawPlanet(c, pl.p, pt[0], pt[1], 1, -0.2, pl.ringed); }
      c.lineCap = "round"; c.lineWidth = 3.2;
      for (var ds = 0; ds < Gx.dashes.length; ds++) {
        var dq = Gx.dashes[ds]; if (Math.sin(t * 7 + ds * 2.1) < -0.6) continue; // dashes blink
        c.strokeStyle = dq.col; c.beginPath(); c.moveTo(dq.x, dq.y); c.lineTo(dq.x + Math.cos(dq.a) * dq.l, dq.y + Math.sin(dq.a) * dq.l); c.stroke();
      }
      for (var s = 0; s < Gx.sparks.length; s++) { var sp = Gx.sparks[s], tw = 0.55 + 0.45 * Math.sin(t * sp.f + sp.ph); sparkle(c, sp.x, sp.y, sp.r * tw, sp.r * tw * 0.8, sp.col, 0.35 * tw); }
      var ct = 0.88 + 0.12 * Math.sin(t * 6.0), hg = c.createRadialGradient(0, 0, 0, 0, 0, 60);
      hg.addColorStop(0, rgba(mix(T.core, "#ffffff", 0.85), 1)); hg.addColorStop(0.25, rgba(mix(T.core, "#ffffff", 0.3), 0.85)); hg.addColorStop(1, rgba(mix(T.core, A[5], 0.1), 0));
      c.fillStyle = hg; c.beginPath(); c.arc(0, 0, 60, 0, Math.PI * 2); c.fill();
      sparkle(c, 0, 0, 100 * ct, 70 * ct, mix(T.core, "#ffffff", 0.8), 0);
      c.fillStyle = "#ffffff"; c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); c.fill();
      sparkle(c, 70, 18, 26 * (1.1 - ct), 22 * (1.1 - ct) + 6, mix(A[0], "#ffffff", 0.25), 0.3);
      var entry = v.entry || 0;
      if (entry > 0.01) {
        c.lineCap = "round";
        for (var r = 0; r < Gx.rays.length; r++) {
          var rq = Gx.rays[r], cr = Math.cos(rq.a), sr = Math.sin(rq.a), r0 = rq.r0 * (1 + (1 - entry) * 2);
          c.globalAlpha = entry * 0.85; c.strokeStyle = rq.col; c.lineWidth = 2.5;
          c.beginPath(); c.moveTo(cr * r0, sr * r0); c.lineTo(cr * (r0 + rq.l * entry), sr * (r0 + rq.l * entry)); c.stroke();
        }
        c.globalAlpha = 1;
      }
      c.restore();
    };

    /* ---- travel layers: parallax space the mascots walk through (or a paper sheet with a floor) ----
       o: { ys: y spread (1 = 16:9, ~1.7 = 9:16), xs: x spread (1 = 16:9, ~0.6 = 9:16 so the narrow frame still sees 3–5 shapes), look: "space" | "paper" } */
    K.travel = function (o) {
      o = o || {};
      var ys = o.ys || 1, xs = o.xs || 1, A = T.acc, TR = { xs: xs, look: o.look || "space", far: [], planets: [], sparks: [], streaks: [], arcs: [], trail: [] };
      TR.stars = K.stars(360, 1800, 700 * ys);
      TR.rain = K.rain(1900, 800 * ys);
      var farPlan = [[-1500, -330, 260, 170, "violet"], [-900, 360, 300, 150, "maroon"], [-350, -390, 240, 140, "tealD"], [250, 400, 280, 150, "magD"],
        [800, -360, 260, 180, "mauve"], [1350, 330, 300, 160, "violet"], [1700, -250, 220, 150, "tealD"], [-1150, 30, 160, 120, "greyMauve"], [1100, 40, 160, 110, "rose"]];
      for (var f = 0; f < farPlan.length; f++) { var q = farPlan[f], rot1 = rr(-0.4, 0.4), b = K.blob(q[2], q[3], q[4], rr(0.5, 0.62), { rot: rot1 }); b.x = q[0] * xs; b.y = q[1] * ys; TR.far.push(b); }
      TR.arcs = [{ x: -500, y: 80, rx: 700, ry: 1150 * Math.max(1, ys * 0.8), col: A[0], rot: 0.25 }, { x: 1300, y: -40, rx: 520, ry: 900 * Math.max(1, ys * 0.8), col: A[3], rot: -0.2 }, { x: 300, y: 0, rx: 1300, ry: 760 * ys, rot: 0.1, dash: true }];
      var pp = [[30, "a3", "a3", -700, -330, true], [21, "a2", "a2", 250, 380, true], [44, mix(A[4], T.paper, 0.3), "a5", 1000, 340, false], [14, mix(A[3], T.canvas, 0.55), "a4", 1500, -380, false],
        [24, "green", "a6", -1350, 380, true], [12, "a1", "a3", 1750, 120, false], [16, mix(T.paper, A[2], 0.08), "a4", -150, -420, false]];
      for (var p = 0; p < pp.length; p++) TR.planets.push({ p: K.planet(pp[p][0], pp[p][1], pp[p][2]), x: pp[p][3] * xs, y: pp[p][4] * ys, ringed: pp[p][5] });
      var sparkCols = ["#ffffff", mix(A[0], "#ffffff", 0.7), mix(A[3], "#ffffff", 0.75), mix(A[1], "#ffffff", 0.78)];
      for (var s = 0; s < 30; s++) TR.sparks.push({ x: rr(-1800, 1800) * xs, y: rr(-520, 520) * ys, r: rr(9, 20), col: pick(sparkCols), ph: rr(0, 6.28), f: rr(2.5, 5.5), d: rr(0.4, 1.0) });
      for (var w = 0; w < 24; w++) TR.streaks.push({ x: rr(-1800, 1800) * xs, y: rr(-520, 520) * ys, l: rr(60, 160), col: pick([rgba(T.star, 0.3), rgba(mix(T.light, A[2], 0.2), 0.26), rgba(mix(A[3], "#ffffff", 0.7), 0.26)]) });
      TR.paperTex = TR.look === "paper" ? K.paper("paper") : null;
      TR.grain = K.paper("grain");
      TR.floor = K.floor(34);
      return TR;
    };
    // cam(depth) applies the camera for a layer at that depth (from K.dive or K.flatCam). Draws everything except the mascots.
    K.drawTravel = function (c, TR, t, cam) {
      var A = T.acc, X0 = -1900 * TR.xs, XS = 3800 * TR.xs;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      if (TR.look === "paper") { c.drawImage(TR.paperTex, 0, 0); return; }
      c.fillStyle = T.canvas; c.fillRect(0, 0, W, H);
      var vg = c.createRadialGradient(CX, CY, 40, CX, CY, Math.max(W, H) * 0.47);
      vg.addColorStop(0, rgba(T.halo, 0.55)); vg.addColorStop(1, rgba(T.halo, 0)); c.fillStyle = vg; c.fillRect(0, 0, W, H);
      c.save(); cam(c, 0.25); c.translate(CX, CY); K.drawStars(c, TR.stars, t, 40);
      c.save(); c.translate(-((t * 70) % 300), 0); K.drawRain(c, TR.rain); c.restore(); c.restore();
      c.save(); cam(c, 0.4); c.translate(CX, CY);
      for (var f = 0; f < TR.far.length; f++) { var o = TR.far[f]; K.drawBlob(c, o, wrap(o.x - t * 110, X0, XS), o.y, 1, o.rot, 1); }
      c.restore();
      c.save(); cam(c, 0.6); c.translate(CX, CY);
      for (var k = 0; k < TR.arcs.length; k++) {
        var ar = TR.arcs[k], ax = ar.x - t * 200;
        if (ar.dash) dashedRing(c, ax, ar.y, ar.rx, ar.ry, ar.rot + t * 0.03, rgba(mix(T.star, "#ffffff", 0.2), 0.5));
        else ring(c, ax, ar.y, ar.rx, ar.ry, ar.rot + t * 0.03, ar.col, 5.5, T.ink);
      }
      c.restore();
      c.save(); cam(c, 0.8); c.translate(CX, CY); c.lineCap = "round"; c.lineWidth = 3;
      for (var w = 0; w < TR.streaks.length; w++) { var sk = TR.streaks[w], sx = wrap(sk.x - t * 520, X0, XS); c.strokeStyle = sk.col; c.beginPath(); c.moveTo(sx, sk.y); c.lineTo(sx + sk.l, sk.y); c.stroke(); }
      c.restore();
      c.save(); cam(c, 0.75); c.translate(CX, CY);
      for (var p = 0; p < TR.planets.length; p++) { var pl = TR.planets[p]; K.drawPlanet(c, pl.p, wrap(pl.x - t * 300, X0, XS), pl.y + Math.sin(t + p) * 8, 1, -0.2, pl.ringed); }
      c.restore();
      c.save(); cam(c, 0.9); c.translate(CX, CY);
      for (var q = 0; q < TR.sparks.length; q++) { var sp = TR.sparks[q], tw = 0.5 + 0.5 * Math.sin(t * sp.f + sp.ph), rs = sp.r * tw; sparkle(c, wrap(sp.x - t * 260 * sp.d, X0, XS), sp.y, rs, rs * 0.8, sp.col, 0.35 * tw); }
      c.restore();
    };
    // footprint dots shed while the mascots walk on nothing. feet: [{x, y (sole), cols:[..]}], amt(tb) = walk amount at birth time
    K.trail = function (n, who) { var a = []; for (var i = 0; i < n; i++) a.push({ who: i % who, born: i * 0.038, jx: rr(-10, 10), jy: rr(-24, 24), s: rr(3.5, 6.5), pk: R() }); return a; };
    K.drawTrail = function (c, tr, t, feet, sc, amt, speed) {
      for (var i = 0; i < tr.length; i++) {
        var d = tr[i], cyc = 2.43, age = ((t - d.born) % cyc + cyc) % cyc, tb = t - age;
        if (age > 0.9) continue;
        var ft = feet[d.who](tb), cols = ft.cols;
        c.globalAlpha = (1 - age / 0.9) * 0.9 * amt(tb);
        K.dot(c, ft.x + G.LEG_X[i % 4] * sc - (speed || 400) * age + d.jx, ft.y + d.jy * 0.3 + age * 10, d.s * 0.7 * (1 - age * 0.5), cols[Math.floor(d.pk * cols.length)], 1.3);
      }
      c.globalAlpha = 1;
    };

    /* ---- the dive: camera pushes into a mascot's eye; the eye becomes a rounded window (eye highlight = white
       square, like a phone); the inner scene shows through it and takes over once the window covers the frame.
       o: { z0, z1, smax, target(t) -> [x,y] eye centre at scale 1, eyeScale (mascot scale), rim, panDur, centre [x,y] (where the eye ends up),
            inner: { start, end, zEnd, fitK, roll, settle } } */
    K.dive = function (o) {
      var CC = o.centre || [CX, CY];
      var D = { z0: o.z0, z1: o.z1, smax: o.smax || 160, rim: o.rim == null ? 0.05 : o.rim, panDur: o.panDur || 0.6, ms: o.eyeScale || 1 };
      var inn = o.inner || {}, iStart = inn.start == null ? D.z0 - 0.05 : inn.start, iEnd = inn.end == null ? D.z1 + 0.3 : inn.end;
      var zEnd = inn.zEnd || 1.35, fitK = inn.fitK || 0.03, roll = inn.roll == null ? -0.9 : inn.roll;
      D.inner = K.canvas(W, H); var ic = D.inner.getContext("2d");
      D.scale = function (t) { if (t <= D.z0) return 1; var u = clamp((t - D.z0) / (D.z1 - D.z0), 0, 1.4); return Math.exp(Math.log(D.smax) * u * u); };
      D.pan = function (t) { var e = o.target(t), k = sstep(D.z0, D.z0 + D.panDur, t); return { e: e, p: [e[0] + (CC[0] - e[0]) * k, e[1] + (CC[1] - e[1]) * k] }; };
      // camera for the travel layers: layer at depth d (1 = the mascot plane)
      D.cam = function (s, cp) { return function (c, d) { var sd = 1 + (s - 1) * d, e = cp.e, P = cp.p; c.translate(e[0] + (P[0] - e[0]) * d, e[1] + (P[1] - e[1]) * d); c.scale(sd, sd); c.translate(-e[0], -e[1]); return sd; }; };
      // inner-scene camera: tiny inside the eye, grows, rolls in and settles; entry = colour ray burst
      D.innerCam = function (t, s) {
        var v = clamp((t - iStart) / (iEnd - iStart), 0, 1);
        var e = v < 0.72 ? Math.pow(v / 0.72, 2.2) * 0.86 : 0.86 + 0.14 * (1 - Math.pow(1 - (v - 0.72) / 0.28, 3));
        var z = Math.min(zEnd * Math.exp(Math.log(0.11) * (1 - e)), fitK * s);
        var drift = sstep(iEnd - 0.1, iEnd + 2.5, t);
        return { z: z * (1 + 0.06 * drift), rot: roll * (1 - e) + 0.06 * drift, entry: clamp(1 - Math.abs(v - 0.6) / 0.45, 0, 1) * (t < iEnd + 0.1 ? 1 : 0), panx: -26 * drift, pany: 14 * drift };
      };
      function eyeRect(s, P, inset) { var k = s * D.ms, w = G.EYE_W * k, h = G.EYE_H * k, i = inset * G.EYE_W * k; return { x: P[0] - w / 2 + i, y: P[1] - h / 2 + i, w: w - 2 * i, h: h - 2 * i, r: Math.max(1, G.EYE_R * k - i * 0.6) }; }
      D.covers = function (s, P) {
        var n = eyeRect(s, P, D.rim);
        if (n.x > -2 || n.y > -2 || n.x + n.w < W + 2 || n.y + n.h < H + 2) return false;
        var x0 = n.x + n.r, y0 = n.y + n.r, x1 = n.x + n.w - n.r, y1 = n.y + n.h - n.r;
        function ok(px, py, cx, cy, sx, sy) { return (px - cx) * sx <= 0 || (py - cy) * sy <= 0 || Math.hypot(px - cx, py - cy) <= n.r - 2; }
        return ok(0, 0, x0, y0, -1, -1) && ok(W, 0, x1, y0, 1, -1) && ok(0, H, x0, y1, -1, 1) && ok(W, H, x1, y1, 1, 1);
      };
      D.drawWindow = function (c, t, s, P) {
        var wa = sstep(D.z0 - 0.05, D.z0 + 0.2, t); if (wa < 0.002) return;
        var a = eyeRect(s, P, 0), n = eyeRect(s, P, D.rim);
        c.save(); rrect(c, a.x, a.y, a.w, a.h, a.r); c.fillStyle = T.eyeInk; c.fill();
        rrect(c, n.x, n.y, n.w, n.h, n.r); c.clip(); c.globalAlpha = wa; c.drawImage(D.inner, 0, 0); c.globalAlpha = 1; c.restore();
        var hk = s * D.ms, hs = G.EYE_W * 0.36 * hk, hx = a.x + a.w - hs - 2.2 * hk;
        rrect(c, hx, a.y + 2.6 * hk, hs, hs, hs * 0.3); c.fillStyle = T.highlight; c.fill();
      };
      D.fxAmount = function (t) { return sstep(D.z0 - 0.1, D.z0 + 0.25, t) * (1 - sstep(D.z1 - 0.04, D.z1 + 0.1, t)); };
      D.innerRadius = function (s) { return G.EYE_H / 2 * D.ms * s * 1.05; };
      /* one frame: drawOuter(c, t, s, cam, cp) draws the travel scene; drawInner(ic, t, innerCam, centre) draws the inner scene
         (centre = where the eye sits on screen). Returns true when only the inner scene was drawn. */
      D.frame = function (c, t, drawOuter, drawInner, speedLines, grain) {
        var s = D.scale(t), cp = D.pan(t), ib = D.innerCam(t, s);
        var showInner = t >= D.z0 - 0.06;
        if (showInner) drawInner(ic, t, ib, [cp.p[0] + ib.panx, cp.p[1] + ib.pany]);
        c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
        if (showInner && D.covers(s, cp.p)) { c.drawImage(D.inner, 0, 0); if (grain) c.drawImage(grain, 0, 0); return true; }
        drawOuter(c, t, s, D.cam(s, cp), cp);
        c.setTransform(1, 0, 0, 1, 0, 0);
        if (speedLines) K.drawSpeed(c, speedLines, t, cp.p[0], cp.p[1], D.fxAmount(t), s, D.innerRadius(s));
        if (showInner) D.drawWindow(c, t, s, cp.p);
        if (grain) c.drawImage(grain, 0, 0);
        return false;
      };
      return D;
    };
    // the MP4 encode lands ~3 levels darker than the canvas; an additive lift makes the decoded video match the canvas
    K.lift = function (c, v) { v = v == null ? 3 : v; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "lighter"; c.fillStyle = "rgb(" + v + "," + v + "," + (v + 1) + ")"; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "source-over"; };
    return K;
  }

  window.HATCH = { kit: kit, theme: theme, THEMES: THEMES, sparkle: sparkle, ring: ring, dashedRing: dashedRing, geom: G,
    clamp: clamp, sstep: sstep, wrap: wrap, win: win, mix: mix, rgba: rgba, mulberry32: mulberry32 };
})();
