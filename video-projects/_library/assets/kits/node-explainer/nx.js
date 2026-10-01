/* =====================================================================
   node-explainer kit — nx.js  (v2, 2026-10-01)   global: NX
   Needs: gsap + DrawSVGPlugin loaded first (vendored copies).

   Every tween helper ADDS to the timeline you pass, at the time you pass,
   and returns the time its build finishes:
       var t = NX.ignite(tl, ai, 0.3);
       t = NX.draw(tl, line, t + 0.4);
   Seek-safe: no tl.call() side effects; typed text and counters come from
   tweened proxies; start states are written by fromTo / set at build time.

   Positions: NX.connect() measures with offsetLeft/offsetTop up to the
   stage — NOT getBoundingClientRect() (the Studio preview scales the page).

   Colours: NX.theme(root, "neon" | "midnight" | "light" | {tokens}) — the
   brand fills the role tokens; glows/shadows/ghosts adapt to dark/light.
   ===================================================================== */
(function (global) {
  "use strict";

  // Inlined lucide glyph bodies (from _library/assets/icons/lucide (not in the public repo)). Stroke-only.
  var ICONS = {
    cpu: '<path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
    server: '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "shopping-cart": '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "app-window": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    terminal: '<path d="M12 19h8"/><path d="m4 17 6-6-6-6"/>',
    mail: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
    "file-text": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    "file-pen": '<path d="M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  };
  // Brand marks (simple-icons, CC0). Filled, drawn in the tile's --r colour.
  var LOGOS = {
    gmail: { color: "#EA4335", d: "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" },
    github: { color: null, d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" },
  };
  var CURSOR = '<svg viewBox="0 0 24 24"><path d="M4 2.5v17.2l4.6-4.4 3.1 7 3.2-1.4-3.1-6.9h6.4z" fill="currentColor" stroke="#0b0f14" stroke-width="1.2" stroke-linejoin="round"/></svg>';

  /* Timing tokens (seconds) — MEASURED on the reference at 10 fps
     (2026-10-01, tests/2026-10-01-gap-list.md):
       a part goes dim ghost -> lit in 0.1–0.2 s; a line draws in 0.2–0.4 s;
       the packet is ~10% of the line and crosses in ~0.3 s; labels type at
       ~25 chars/s; pops have a slight overshoot; the headline is already
       there on the cut frame; the old diagram vanishes (hard cut).
     Between build steps the reference waits for the VOICE: 0.4–1.2 s. */
  var T = {
    ghost: 0.1, ignite: 0.22, line: 0.35, packet: 0.32, pop: 0.3, cps: 25,
    stagger: 0.12, beat: 0.6, hold: 0.8,
  };

  /* ---------------- themes ---------------------------------------------- */
  // A brand fills these. Anything left out keeps the nx.css default (neon).
  var THEMES = {
    neon: {}, // the reference look (nx.css defaults)
    // "midnight" — example — not a real brand: a dark slate stage, amber key words, cool role tiles.
    midnight: {
      bg: "#101418", surface: "#1A2027", border: "#2C3540", text: "#F3F5F7", dim: "#9AA6B2",
      accent: "#F5A524", "accent-2": "#F07B3F",
      "role-1": "#3DD9A4", "role-2": "#4CC3F0", "role-3": "#7A8CFF", "role-4": "#EEF2F6",
      ok: "#3DD9A4", warn: "#F5C451", danger: "#F0605D",
    },
    // "light" — example — not a real brand: a warm paper stage with one ink blue (light mode).
    light: {
      bg: "#F6F5F2", surface: "#FFFFFF", border: "#E3E1DB", text: "#1D1F23", dim: "#6A6E76",
      accent: "#1F5FD6", "accent-2": "#1F5FD6",
      "role-1": "#1F5FD6", "role-2": "#2A9D8F", "role-3": "#6C5CE7", "role-4": "#FFFFFF",
      ok: "#2E8B57", warn: "#C98A12", danger: "#C8453B", depth: 0.35, glow: 0.8,
      "head-font": '"Cairo", system-ui, sans-serif',
    },
  };

  var _probe = null;
  function rgb(color, root) {
    if (!_probe) {
      _probe = document.createElement("i");
      _probe.style.cssText = "position:absolute;width:0;height:0;visibility:hidden";
      (root || document.body).appendChild(_probe);
    }
    _probe.style.color = "";
    _probe.style.color = color;
    var m = getComputedStyle(_probe).color.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }
  function lum(c) {
    var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  /* NX.theme(root, nameOrTokens [, extraTokens])
     Writes --nx-<token> on root, picks dark/light mode from --nx-bg, and
     computes the on-colours (text on a filled role colour) for contrast. */
  function theme(root, t, extra) {
    var tokens = Object.assign({}, typeof t === "string" ? THEMES[t] || {} : t || {}, extra || {});
    Object.keys(tokens).forEach(function (k) { root.style.setProperty("--nx-" + k, tokens[k]); });
    var cs = getComputedStyle(root);
    var bg = rgb(cs.getPropertyValue("--nx-bg").trim(), root);
    var light = lum(bg) > 0.4;
    root.setAttribute("data-nx-mode", light ? "light" : "dark");
    var ink = light ? rgb(cs.getPropertyValue("--nx-text").trim(), root) : [4, 18, 26];
    var inkCss = "rgb(" + ink.join(",") + ")";
    [["1", "role-1"], ["2", "role-2"], ["3", "role-3"], ["4", "role-4"], ["ok", "ok"], ["warn", "warn"], ["danger", "danger"]].forEach(function (p) {
      var c = rgb(cs.getPropertyValue("--nx-" + p[1]).trim(), root);
      root.style.setProperty("--nx-on-" + p[0], contrast(c, ink) >= contrast(c, [255, 255, 255]) ? inkCss : "#ffffff");
    });
    return light ? "light" : "dark";
  }

  function rootOf(el) { return (el.closest && el.closest(".nx")) || document.body; }
  function isLight(el) { return rootOf(el).getAttribute("data-nx-mode") === "light"; }
  function glowK(el) { var v = parseFloat(getComputedStyle(rootOf(el)).getPropertyValue("--nx-glow")); return isNaN(v) ? 1 : v; }
  function roleRGB(el) {
    var v = getComputedStyle(el).getPropertyValue("--r").trim();
    if (!v) v = getComputedStyle(rootOf(el)).getPropertyValue("--nx-role-2").trim();
    return rgb(v, rootOf(el));
  }
  // glow on dark brands, soft coloured shadow on light brands (same 2-shadow shape)
  function glow(el, a, blur) {
    var c = roleRGB(el).join(", ");
    a = a * glowK(el);
    if (isLight(el)) {
      return "0 " + Math.round((blur || 46) * 0.3) + "px " + Math.round((blur || 46) * 0.7) + "px -6px rgba(" + c + ", " + (a * 0.75).toFixed(3) +
        "), 0 2px 6px 0px rgba(15, 23, 42, " + (a * 0.18).toFixed(3) + ")";
    }
    return "0 0 " + (blur || 46) + "px 2px rgba(" + c + ", " + a.toFixed(3) + "), 0 0 0px 0px rgba(0, 0, 0, 0)";
  }
  function ghostState(el) {
    return isLight(el)
      ? { opacity: 0.42, filter: "brightness(1.08) saturate(0.2)" }
      : { opacity: 1, filter: "brightness(0.22) saturate(0.55)" };
  }
  var LIT = "brightness(1) saturate(1)";

  /* ---------------- icons / logos ------------------------------------------ */
  function svgIcon(name, stroke) {
    var body = ICONS[name];
    if (!body) throw new Error("NX: unknown icon " + name);
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (stroke || 2) +
      '" stroke-linecap="round" stroke-linejoin="round">' + body + "</svg>";
  }
  // <i data-nx-icon="cpu" data-nx-stroke="2">  and  <i data-nx-logo="gmail">
  function icons(root) {
    (root || document).querySelectorAll("[data-nx-icon]").forEach(function (el) {
      el.classList.add("nx-ico");
      el.innerHTML = svgIcon(el.getAttribute("data-nx-icon"), el.getAttribute("data-nx-stroke"));
    });
    (root || document).querySelectorAll("[data-nx-logo]").forEach(function (el) {
      var L = LOGOS[el.getAttribute("data-nx-logo")];
      if (!L) throw new Error("NX: unknown logo " + el.getAttribute("data-nx-logo"));
      el.classList.add("nx-ico");
      el.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="' + L.d + '"/></svg>';
      var tile = el.closest(".nx-tile");
      if (tile && L.color && !tile.style.getPropertyValue("--r")) tile.style.setProperty("--r", L.color);
      if (tile && !L.color) tile.style.setProperty("--r", "var(--nx-text)");
    });
    (root || document).querySelectorAll(".nx-cursor").forEach(function (el) { if (!el.innerHTML.trim()) el.innerHTML = CURSOR; });
  }

  /* ---------------- geometry ------------------------------------------------ */
  function box(el, stage) {
    var x = 0, y = 0, n = el;
    while (n && n !== stage) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    if (n !== stage) throw new Error("NX: stage must be a positioned ancestor of the element");
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }
  var SIDES = { left: [0, 0.5, -1, 0], right: [1, 0.5, 1, 0], top: [0.5, 0, 0, -1], bottom: [0.5, 1, 0, 1], center: [0.5, 0.5, 0, 0] };
  function anchor(b, side, gap) {
    var s = SIDES[side || "center"];
    return { x: b.x + b.w * s[0] + s[2] * gap, y: b.y + b.h * s[1] + s[3] * gap, nx: s[2], ny: s[3] };
  }
  /* NX.connect(svg, fromEl, toEl, {from:'right', to:'left', curve:0.5, gap:0, cls:'nx-line', align})
     curve 0 = straight; 0.3–0.6 = S-bezier along the side normals.
     align:'from' keeps the line on the FROM part's x (top/bottom sides) or y
     (left/right sides) — a straight drop onto a wide bar; align:'to' = the TO part's. */
  function connect(svg, a, b, o) {
    o = o || {};
    var stage = svg.parentNode, gap = o.gap || 0;
    var p = anchor(box(a, stage), o.from || "right", gap);
    var q = anchor(box(b, stage), o.to || "left", gap);
    if (o.align) {
      var vertical = !p.nx && !q.nx, src = o.align === "to" ? q : p, dst = o.align === "to" ? p : q;
      if (vertical) dst.x = src.x; else dst.y = src.y;
    }
    var d;
    if (!o.curve) d = "M" + p.x + " " + p.y + " L" + q.x + " " + q.y;
    else {
      var k = o.curve * Math.hypot(q.x - p.x, q.y - p.y);
      d = "M" + p.x + " " + p.y + " C" + (p.x + p.nx * k) + " " + (p.y + p.ny * k) + " " + (q.x + q.nx * k) + " " + (q.y + q.ny * k) + " " + q.x + " " + q.y;
    }
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", o.cls || "nx-line");
    svg.appendChild(path);
    return path;
  }

  /* ---------------- scene + states ------------------------------------------ */
  // hard-cut scene (visibility, so hidden scenes keep layout for NX.connect)
  function scene(tl, el, start, end) {
    if (start > 0) { gsap.set(el, { autoAlpha: 0 }); tl.set(el, { autoAlpha: 1 }, start); }
    if (end != null) tl.set(el, { autoAlpha: 0 }, end);
    return start;
  }
  function lit(el, a) { gsap.set(el, { opacity: 1, filter: LIT, boxShadow: glow(el, a == null ? 0.42 : a) }); }
  function ghost(el) { gsap.set(el, Object.assign({ boxShadow: glow(el, 0), scale: 0.97 }, ghostState(el))); }

  /* ---------------- tween helpers (all return their end time) --------------- */
  // headline: on the cut frame, whole (reference). o.rise = true adds a 0.3 s rise.
  function headline(tl, el, at, o) {
    o = o || {};
    if (!o.rise) {
      if (at > 0) { gsap.set(el, { opacity: 0 }); tl.set(el, { opacity: 1 }, at); }
      return at;
    }
    tl.fromTo(el, { opacity: o.from == null ? 0.35 : o.from, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, at);
    return at + 0.3;
  }

  // dim ghost -> lit with glow. o.ghost (s), o.glow (0..1), o.dx (side slide), o.fromGhost
  function ignite(tl, el, at, o) {
    o = o || {};
    var a = o.glow == null ? 0.42 : o.glow;
    var G = ghostState(el);
    var litTo = { opacity: 1, scale: 1, x: 0, y: 0, filter: LIT, boxShadow: glow(el, a), duration: T.ignite, ease: "power2.out" };
    if (o.fromGhost) {
      tl.fromTo(el, Object.assign({ boxShadow: glow(el, 0), scale: 0.97, x: 0, y: 0 }, G), litTo, at);
      return at + T.ignite;
    }
    var g = o.ghost == null ? T.ghost : o.ghost;
    var dx = o.dx || 0;
    var t0 = Math.max(0, at - g);
    tl.fromTo(el,
      { opacity: 0, scale: 0.92, x: dx, y: dx ? 0 : 12, filter: G.filter, boxShadow: glow(el, 0) },
      { opacity: G.opacity, scale: 0.97, x: dx * 0.3, y: dx ? 0 : 3, duration: Math.max(0.08, g), ease: "power2.out" }, t0);
    var s = Math.max(at, t0 + 0.08);
    tl.to(el, litTo, s);
    return s + T.ignite;
  }

  function draw(tl, path, at, dur) {
    dur = dur || T.line;
    tl.fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%", duration: dur, ease: "power2.inOut" }, at);
    return at + dur;
  }

  // bright short packet along a connector. o.hot: hot colour; o.len: % of the path
  function packet(tl, path, at, dur, o) {
    o = o || {};
    dur = dur || T.packet;
    var svg = path.parentNode, parts = [path.cloneNode(), path.cloneNode()];
    parts[0].setAttribute("class", "nx-packet-halo" + (o.hot ? " nx-packet-halo--hot" : ""));
    parts[1].setAttribute("class", "nx-packet" + (o.hot ? " nx-packet--hot" : ""));
    parts.forEach(function (p) { p.removeAttribute("style"); svg.appendChild(p); });
    var len = o.len || 10;
    tl.fromTo(parts, { drawSVG: "0% " + len + "%", opacity: 0 }, { drawSVG: 100 - len + "% 100%", duration: dur, ease: "power1.inOut" }, at);
    tl.to(parts, { opacity: 1, duration: 0.06, ease: "none" }, at);
    tl.to(parts, { opacity: 0, duration: 0.1, ease: "none" }, at + dur - 0.04);
    return at + dur;
  }

  // seek-safe typing of a Latin mono label (never Arabic)
  function type(tl, el, at, cps) {
    cps = cps || T.cps;
    var full = el.getAttribute("data-nx-text");
    if (full == null) { full = el.textContent; el.setAttribute("data-nx-text", full); }
    el.textContent = "";
    var p = { n: 0 }, dur = Math.max(0.1, full.length / cps);
    tl.fromTo(p, { n: 0 }, {
      n: full.length, duration: dur, ease: "none",
      onUpdate: function () { el.textContent = full.slice(0, Math.floor(p.n + 0.001)); },
    }, at);
    return at + dur;
  }

  // tool pill: ghost slides in, lights, label types
  function pill(tl, el, at, o) {
    o = o || {};
    var lit_ = ignite(tl, el, at, { ghost: o.ghost == null ? 0.12 : o.ghost, glow: o.glow == null ? 0.3 : o.glow, dx: o.dx == null ? -20 : o.dx });
    var label = el.querySelector(".nx-label");
    return label ? Math.max(lit_, type(tl, label, at + 0.06, o.cps)) : lit_;
  }

  // generic pop (badges, "No", dots): scale up with a slight overshoot
  function pop(tl, el, at, o) {
    o = o || {};
    var a = o.glow == null ? 0.45 : o.glow;
    tl.fromTo(el, { opacity: 0, scale: 0.3, boxShadow: glow(el, 0, o.blur || 30) },
      { opacity: 1, scale: 1, boxShadow: glow(el, a, o.blur || 30), duration: T.pop, ease: "back.out(1.7)" }, at);
    return at + T.pop;
  }
  function check(tl, el, at) {
    var e = pop(tl, el, at, { glow: 0.5 });
    var tick = el.querySelectorAll("path");
    if (tick.length) tl.fromTo(tick, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.22, ease: "power2.out" }, at + 0.1);
    return e;
  }
  function chip(tl, el, at) {
    tl.fromTo(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.26, ease: "back.out(2)" }, at);
    return at + 0.26;
  }
  function rise(tl, el, at, dur) {
    dur = dur || 0.3;
    tl.fromTo(el, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: dur, ease: "power3.out" }, at);
    return at + dur;
  }

  /* terminal: card rises, then each .nx-tl in order. A line with .nx-type types
     it; other lines slide in. data-nx-pause="0.3" on a line = a beat before it. */
  function term(tl, card, at, o) {
    o = o || {};
    var t = rise(tl, card, at, 0.3) + 0.08;
    card.querySelectorAll(".nx-tl").forEach(function (line) {
      t += parseFloat(line.getAttribute("data-nx-pause") || 0);
      var typed = line.querySelector(".nx-type");
      if (typed) {
        tl.fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none" }, t);
        t = type(tl, typed, t + 0.05, o.cps || 32) + 0.14;
      } else {
        tl.fromTo(line, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.2, ease: "power2.out" }, t);
        line.querySelectorAll(".nx-chip").forEach(function (c) { chip(tl, c, t + 0.08); });
        t += o.lineGap || 0.12;
      }
    });
    return t;
  }

  // steps row: bubble pops, track fills, next bubble…
  function steps(tl, row, at) {
    tl.fromTo(row, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, at);
    var t = at + 0.12;
    Array.prototype.forEach.call(row.children, function (c) {
      if (c.classList.contains("nx-step")) {
        pop(tl, c.querySelector(".nx-bubble"), t, { glow: 0.45, blur: 26 });
        var lb = c.querySelector(".nx-step-label");
        if (lb) tl.fromTo(lb, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, t + 0.08);
        t += 0.22;
      } else if (c.classList.contains("nx-track")) {
        tl.fromTo(c.querySelector(".nx-fill"), { scaleX: 0 }, { scaleX: 1, duration: 0.34, ease: "power2.inOut" }, t);
        t += 0.32;
      }
    });
    return t;
  }

  /* hub fans out: line draws to each child, child lights as the line arrives.
     o.from/o.to sides, o.curve, o.pill (children are pills), o.stagger, o.cls */
  function fanout(tl, hub, children, svg, at, o) {
    o = o || {};
    var end = at, paths = [];
    Array.prototype.forEach.call(children, function (c, i) {
      var p = connect(svg, hub, c, { from: o.from || "right", to: o.to || "left", curve: o.curve == null ? 0.45 : o.curve, gap: o.gap || 0, cls: o.cls });
      paths.push(p);
      var d = draw(tl, p, at + i * (o.stagger || T.stagger), o.line || T.line);
      end = Math.max(end, o.pill ? pill(tl, c, d - 0.1, o) : ignite(tl, c, d - 0.1, o));
    });
    return { end: end, paths: paths };
  }

  /* ---------------- new parts (round 2) -------------------------------------- */

  // signal arcs ")))": each arc draws, 0.1 s apart
  function arcs(tl, svgEl, at) {
    var ps = svgEl.querySelectorAll("path"), t = at;
    ps.forEach(function (p, i) {
      tl.fromTo(p, { drawSVG: "50% 50%", opacity: 0 }, { drawSVG: "0% 100%", opacity: 1, duration: 0.2, ease: "power2.out" }, at + i * 0.1);
      t = at + i * 0.1 + 0.2;
    });
    return t;
  }

  /* cursor: moves along targets, clicks. steps = [{el, dx, dy, dur, click, hl}]
     (el = a target inside the cursor's stage; the tip lands at its centre + dx/dy).
     A click squeezes the cursor and fades in the target's .nx-hl (selected state). */
  function cursor(tl, cur, at, steps_) {
    var stage = cur.offsetParent, t = at;
    tl.fromTo(cur, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, at);
    steps_.forEach(function (s) {
      var b = box(s.el, stage);
      var x = b.x + b.w * (s.fx == null ? 0.5 : s.fx) + (s.dx || 0), y = b.y + b.h * (s.fy == null ? 0.5 : s.fy) + (s.dy || 0);
      if (s.jump) gsap.set(cur, { x: x, y: y });
      else { tl.to(cur, { x: x, y: y, duration: s.dur || 0.45, ease: "power2.inOut" }, t); t += s.dur || 0.45; }
      if (s.click) {
        tl.to(cur, { scale: 0.82, duration: 0.07, ease: "power1.in", transformOrigin: "15% 10%" }, t);
        tl.to(cur, { scale: 1, duration: 0.12, ease: "power1.out" }, t + 0.07);
        var hl = s.el.querySelector(".nx-hl");
        if (hl) tl.fromTo(hl, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, t + 0.05);
        t += 0.19;
      }
      t += s.wait || 0;
    });
    return t;
  }

  /* skeleton page fills in: bars grow left -> right, 0.06 s apart.
     o.keep = the old page stays visible before `at` (reference: the docs page is
     already there, the click reloads it) — also keeps the cover frame from reading black. */
  function skel(tl, page, at, o) {
    o = o || {};
    var bars = page.querySelectorAll(".nx-skel");
    tl.fromTo(bars, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.3, ease: "power2.out", stagger: 0.06, immediateRender: !o.keep }, at);
    return at + 0.3 + 0.06 * (bars.length - 1);
  }

  /* dotted path under cards: items = [{card, dot}]. Each card lights, its dot pops,
     then a hot line grows dot -> next dot with a packet head. o.gap = s per item. */
  function trail(tl, items, svg, at, o) {
    o = o || {};
    var gap = o.gap || 0.9, t = at;
    items.forEach(function (it, i) {
      ignite(tl, it.card, t, { glow: 0, ghost: 0.12 });
      pop(tl, it.dot, t + 0.12, { glow: 0.5, blur: 18 });
      if (items[i + 1]) {
        var p = connect(svg, it.dot, items[i + 1].dot, { from: "right", to: "left", cls: "nx-line nx-line--hot" });
        var s = t + gap - 0.36;
        draw(tl, p, s, 0.32);
        packet(tl, p, s, 0.32, { hot: true, len: 18 });
      }
      t += gap;
    });
    return t - gap + 0.42;
  }

  /* split comparison: panels show, the divider draws top -> bottom, then each
     panel's fill wipes in from its outer side. o.left / o.right = delays (s). */
  function split(tl, el, at, o) {
    o = o || {};
    var panels = el.querySelectorAll(".nx-panel"), div = el.querySelector(".nx-divider");
    tl.fromTo(panels, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none" }, at);
    tl.fromTo(div, { scaleY: 0, boxShadow: glow(div, 0, 24) }, { scaleY: 1, boxShadow: glow(div, 0.6, 24), duration: 0.3, ease: "power2.inOut" }, at + 0.15);
    var end = at + 0.45;
    [o.left == null ? 0.6 : o.left, o.right == null ? 1.3 : o.right].forEach(function (d, i) {
      var f = panels[i] && panels[i].querySelector(".nx-panel-fill");
      if (!f) return;
      tl.fromTo(f, { clipPath: i ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.32, ease: "power2.out" }, at + d);
      end = Math.max(end, at + d + 0.32);
    });
    return end;
  }

  /* counter: the number steps to 1, 2, 3… at the given times (seek-safe proxy).
     immediateRender:false + an anchor at t=0, so a seek BEFORE the first call
     shows the start number (a fromTo would paint its from-state at build time). */
  function count(tl, numEl, times, from) {
    var base = from || 0, p = { v: base };
    var paint = function () { numEl.textContent = String(Math.round(p.v)); };
    numEl.textContent = String(base);
    tl.fromTo(p, { v: base }, { v: base, duration: 0.001, ease: "none", immediateRender: false, onUpdate: paint }, 0);
    times.forEach(function (t, i) {
      tl.fromTo(p, { v: base + i }, { v: base + i + 1, duration: 0.12, ease: "none", immediateRender: false, onUpdate: paint }, t);
    });
    return times[times.length - 1] + 0.12;
  }

  // a status dot turns ok (green-ish) — e.g. when the call reaches the API
  function okDot(tl, dot, at) {
    var root = rootOf(dot), cs = getComputedStyle(root);
    var from = "rgb(" + rgb(cs.getPropertyValue("--nx-border").trim(), root).join(",") + ")";
    var to = "rgb(" + rgb(cs.getPropertyValue("--nx-ok").trim(), root).join(",") + ")";
    tl.fromTo(dot, { backgroundColor: from, scale: 1 }, { backgroundColor: to, scale: 1, duration: 0.2, ease: "none" }, at);
    return at + 0.2;
  }

  // row scan: the bar sweeps the row while it runs, then fades
  function scan(tl, bar, at, dur) {
    dur = dur || 0.45;
    tl.fromTo(bar, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: dur, ease: "power1.inOut" }, at);
    tl.to(bar, { opacity: 0, duration: 0.15, ease: "none" }, at + dur);
    return at + dur + 0.15;
  }

  // strike-through (myth busted)
  function strike(tl, el, at) {
    tl.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.inOut" }, at);
    return at + 0.3;
  }

  /* SFX: there is no helper on purpose. The renderer mixes only <audio> tags that
     are in the HTML — audio a script adds at build time plays in preview but is NOT
     rendered (tested 2026-10-01). Write each cue as a static timed <audio>
     (see the demo blocks: ui-tick on a part lighting, ui-pop on a check / click). */

  global.NX = {
    T: T, ICONS: ICONS, LOGOS: LOGOS, THEMES: THEMES,
    theme: theme, rgb: rgb, contrast: contrast, svgIcon: svgIcon, icons: icons, connect: connect,
    scene: scene, lit: lit, ghost: ghost, headline: headline, ignite: ignite, draw: draw, packet: packet,
    type: type, pill: pill, pop: pop, check: check, chip: chip, rise: rise, term: term, steps: steps,
    fanout: fanout, arcs: arcs, cursor: cursor, skel: skel, trail: trail, split: split, count: count,
    okDot: okDot, scan: scan, strike: strike,
  };
})(window);
