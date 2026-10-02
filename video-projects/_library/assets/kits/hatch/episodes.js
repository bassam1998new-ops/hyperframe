/* =====================================================================
   episodes.js — episode buddies + props for the Story-of-AI series (eps 2–5), on the hatch kit (HATCH).
   Aurora is aurora.js, the ep 1 Bombe is bombe.js. Palettes = EPS.themes (same values as the Editor's
   parts/series-parts.js SERIES.themes), passed to HATCH.kit({ theme: EPS.themes.ep2 }).

   var K = HATCH.kit({ w, h, seed, theme: EPS.themes.ep2 });
   var E = EPS.eniac(K);                       // build once (seeded hatching)
   E.draw(ctx, x, y, scale, EPS.pose("eniac", "calc", t));
   var P = EPS.props2(K); P.calculator(ctx, x, y, s, t) ...
   Every buddy: draw(c, x, y, sc, state) with y = body centre, feet at y + foot * sc.
   Shared state: t, hop, squash, tilt, look, eyes ("open"|"happy"|"blink"), armL/armR (+ = up), armLenL/armLenR, walk, walkAmt, glowAmt
   ===================================================================== */
(function () {
  var H = window.HATCH, sstep = H.sstep, clamp = H.clamp, mix = H.mix, rgba = H.rgba;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
  function win(t, a, b) { return t >= a && t < b; }
  function blinkAt(t, s) { var p = (t + s) % 3.5; return p > 3.3 && p < 3.42; }

  var themes = {
    ep2: { canvas: "#1F2A3A", halo: "#2E3F57", ink: "#2A1E12", paper: "#E9D7B3", light: "#F6EBD3", star: "#E9D7B3", core: "#FFE29A",
      hero: "#5fd6b6", buddy: "#3D6E9E", a1: "#D9A441", a2: "#3D6E9E", a3: "#C0583A", a4: "#6FA3C8", a5: "#A89A80", a6: "#8FB08A" },
    ep3: { canvas: "#14231B", halo: "#1F3527", ink: "#1A1A14", paper: "#E8DFC8", light: "#F3EEDF", star: "#BFE8C9", core: "#7CF0A8",
      hero: "#5fd6b6", buddy: "#D8CDB2", a1: "#57D68D", a2: "#7A8C5A", a3: "#E07A3F", a4: "#4BA3A0", a5: "#B5A98C", a6: "#C9D86B" },
    ep4: { canvas: "#111114", halo: "#26262E", ink: "#0B0B0D", paper: "#EDEAE2", light: "#F7F5EF", star: "#D9D9E3", core: "#FFF1C2",
      hero: "#5fd6b6", buddy: "#EDEAE2", a1: "#E9C46A", a2: "#4A4E69", a3: "#C8553D", a4: "#5C7AEA", a5: "#9A9AB0", a6: "#7FB38F" },
    ep5: { canvas: "#2B2D5C", halo: "#4A3F7A", ink: "#1B1733", paper: "#FFF1DE", light: "#FFF7EC", star: "#FFE3C4", core: "#FFD9A0",
      hero: "#5fd6b6", buddy: "#F4C7A1", a1: "#FFB86B", a2: "#7AA6E8", a3: "#FF7E6B", a4: "#5ED4CE", a5: "#B9A6F2", a6: "#9EDC9A" }
  };

  /* ---------------- shared rig: hatched block + legs + arms (nub or cable) ---------------- */
  function hatchSet(K, w, h) {
    return {
      main: K.hatch(w / 2 + 10, h / 2 + 10, { angle: -0.98, spacing: 6.5, len: 24, gapMin: 8, gapMax: 34, jit: 0.07, keep: function (x, y) { return x / w + 1.3 * y / h > K.rr(-1.1, 0.35); } }),
      cross: K.hatch(w / 2 + 10, h / 2 + 10, { angle: -2.3, spacing: 6.5, len: 18, gapMin: 6, gapMax: 26, jit: 0.08, keep: function (x, y) { return x * 0.6 + y > 30 + K.rr(-30, 30); } }),
      light: K.hatch(w / 2 + 10, h / 2 + 10, { angle: -0.03, spacing: 5, len: 30, gapMin: 14, gapMax: 50, jit: 0.04, keep: function (x, y) { return y < -h * 0.18 + K.rr(-22, 22); } })
    };
  }
  // fills a closed path (already built on c) with fill + pencil hatch, outlines it
  function hatchFill(c, K, hs, fill, ol, lightAmt) {
    var T = K.T;
    c.fillStyle = fill; c.fill();
    c.save(); c.clip(); c.lineCap = "round"; c.lineWidth = 1.05;
    c.strokeStyle = rgba(mix(fill, T.ink, 0.6), 0.5); c.stroke(hs.main); c.stroke(hs.cross);
    c.strokeStyle = rgba(mix(fill, "#ffffff", 0.6), lightAmt == null ? 0.45 : lightAmt); c.stroke(hs.light); c.restore();
    c.lineWidth = ol; c.strokeStyle = T.ink; c.stroke();
  }
  /* cfg: { w, h, rad, fill, legs: [x..], legW, legL, arms: "nub"|"cable"|false, armY, cable (colour), face(c, st, t), panel(c, st, t) (drawn over the hatch, under the face), glow (colour) } */
  function rig(K, cfg) {
    var T = K.T, w = cfg.w, h = cfg.h, hs = hatchSet(K, w, h), legW = cfg.legW || 22, legL = cfg.legL || 40, foot = h / 2 + legL + 4;
    var armY = cfg.armY == null ? h * 0.08 : cfg.armY;
    function arm(c, sd, ang, len, ol, st) {
      var up = sstep(0.4, 1.4, ang);
      if (cfg.arms === "cable") { // cable from the side, ending in a plug; len stretches it out
        var sx = sd * (w / 2 - 2), sy = armY, L = 60 + len * 140, a = -ang + (st.t ? Math.sin(st.t * 2.4 + sd) * 0.08 : 0);
        var ex = sx + sd * Math.cos(a) * L, ey = sy - Math.sin(ang) * L + (1 - up) * 40 * (1 - len);
        c.beginPath(); c.moveTo(sx, sy); c.bezierCurveTo(sx + sd * L * 0.5, sy + 30, ex - sd * 20, ey + 10, ex, ey);
        c.lineCap = "round"; c.lineWidth = 11; c.strokeStyle = T.ink; c.stroke(); c.lineWidth = 6; c.strokeStyle = cfg.cable || T.a1; c.stroke();
        c.save(); c.translate(ex, ey); c.rotate(sd > 0 ? -ang * 0.5 : Math.PI + ang * 0.5);
        rr(c, -4, -10, 22, 20, 5); c.fillStyle = mix(cfg.cable || T.a1, T.ink, 0.25); c.fill(); c.lineWidth = 3.5; c.strokeStyle = T.ink; c.stroke();
        c.fillStyle = T.ink; c.fillRect(18, -7, 8, 4); c.fillRect(18, 3, 8, 4); c.restore();
        return;
      }
      var NW = cfg.nubW || 40, NH = cfg.nubH || 40;
      c.save(); c.translate(sd * (w / 2 + 2 - up * 6), armY - up * h * 0.32); c.rotate(-sd * ang);
      var Lr = NW + 6 + Math.min(1, Math.max(0, ang) / 1.2) * 10 + len * 34;
      rr(c, sd < 0 ? -Lr : -10, -NH / 2, Lr + 10, NH, NH * 0.42); c.fillStyle = cfg.armFill || cfg.fill; c.fill(); c.lineWidth = ol; c.strokeStyle = T.ink; c.stroke();
      c.restore();
    }
    function draw(c, x, y, sc, st) {
      st = st || {};
      var t = st.t || 0, ol = 4, ph = (st.walk || 0) * Math.PI * 2 / 0.5, amt = st.walkAmt || 0;
      c.save(); c.translate(x, y); c.scale(sc, sc); c.lineJoin = "round";
      var ga = st.glowAmt == null ? 1 : st.glowAmt;
      if (ga > 0.01 && cfg.glow !== false) { var gr = Math.max(w, h) * 0.95, g = c.createRadialGradient(0, 0, 30, 0, 0, gr); g.addColorStop(0, rgba(cfg.glow || cfg.fill, 0.3 * ga)); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; circ(c, 0, 0, gr); c.fill(); }
      c.translate(0, -(st.hop || 0) - Math.abs(Math.sin(ph)) * 5 * amt);
      c.rotate((st.tilt || 0) + Math.sin(ph + 0.6) * 0.05 * amt);
      var sq = st.squash || 0; c.translate(0, foot); c.scale(1 + sq * 0.6, 1 - sq); c.translate(0, -foot);
      var legs = cfg.legs || [];
      for (var i = 0; i < legs.length; i++) {
        var a = (i % 2 ? -1 : 1) * Math.sin(ph) * 0.17 * amt;
        c.save(); c.translate(legs[i], h / 2 - 6); c.rotate(a); rr(c, -legW / 2, 0, legW, legL + 6, legW * 0.42); c.fillStyle = cfg.legFill || cfg.fill; c.fill(); c.lineWidth = ol; c.strokeStyle = T.ink; c.stroke(); c.restore();
      }
      if (cfg.back) cfg.back(c, st, t);
      var UP = 0.55, aL = st.armL || 0, aR = st.armR || 0, cab = cfg.arms === "cable";
      if (cfg.arms) { if (cab || aL < UP) arm(c, -1, aL, st.armLenL || 0, ol, st); if (cab || aR < UP) arm(c, 1, aR, st.armLenR || 0, ol, st); }
      if (cfg.shape) cfg.shape(c); else rr(c, -w / 2, -h / 2, w, h, cfg.rad == null ? 16 : cfg.rad);
      hatchFill(c, K, hs, cfg.fill, ol * 1.1, cfg.lightAmt);
      if (cfg.panel) cfg.panel(c, st, t);
      if (cfg.face) cfg.face(c, st, t);
      if (cfg.arms && !cab) { if (aL >= UP) arm(c, -1, aL, st.armLenL || 0, ol, st); if (aR >= UP) arm(c, 1, aR, st.armLenR || 0, ol, st); }
      if (cfg.front) cfg.front(c, st, t);
      c.restore();
    }
    return { draw: draw, foot: foot, w: w, h: h, hs: hs };
  }
  // kit-style eyes: tall rounded ink eye with a highlight, ^ ^ when happy, line when blinking
  function eye(c, T, x, y, s, kind, look) {
    var ew = 19 * s, eh = 35 * s, lx = (look || 0) * 6 * s;
    c.lineCap = "round"; c.strokeStyle = T.ink; c.lineWidth = 4.4 * Math.max(0.8, s);
    if (kind === "happy") { c.beginPath(); c.moveTo(x + lx - ew * 0.85, y + eh * 0.12); c.lineTo(x + lx, y - eh * 0.22); c.lineTo(x + lx + ew * 0.85, y + eh * 0.12); c.stroke(); return; }
    if (kind === "blink") { c.beginPath(); c.moveTo(x + lx - ew * 0.6, y); c.lineTo(x + lx + ew * 0.6, y); c.stroke(); return; }
    rr(c, x + lx - ew / 2, y - eh / 2, ew, eh, ew * 0.32); c.fillStyle = T.eyeInk; c.fill();
    var hs = ew * 0.36; rr(c, x + lx + ew / 2 - hs - 2, y - eh / 2 + 2.5 * s, hs, hs, hs * 0.3); c.fillStyle = T.highlight; c.fill();
  }
  // simple person figure, hatched, no face: head, hair, torso; o: { hair, top, skirt (bool), arm: 0..1 raise, s }
  function person(c, K, hs, x, y, s, o) {
    var T = K.T; o = o || {}; var skin = o.skin || "#e3b48c", hair = o.hair || T.ink;
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round"; c.lineCap = "round";
    // legs + shoes
    c.lineWidth = 9; c.strokeStyle = T.ink; c.beginPath(); c.moveTo(-9, 66); c.lineTo(-10, 104); c.moveTo(9, 66); c.lineTo(10, 104); c.stroke();
    c.lineWidth = 5; c.strokeStyle = skin; c.beginPath(); c.moveTo(-9, 70); c.lineTo(-10, 100); c.moveTo(9, 70); c.lineTo(10, 100); c.stroke();
    rr(c, -20, 100, 16, 9, 4); c.fillStyle = T.ink; c.fill(); rr(c, 4, 100, 16, 9, 4); c.fill();
    // blouse (hatched) + skirt (hatched, darker)
    c.beginPath(); c.moveTo(-20, -6); c.quadraticCurveTo(0, -12, 20, -6); c.lineTo(17, 30); c.lineTo(-17, 30); c.closePath(); hatchFill(c, K, hs, o.top || T.a2, 3.5, 0.35);
    c.beginPath(); c.moveTo(-17, 28); c.lineTo(17, 28); c.lineTo(27, 72); c.lineTo(-27, 72); c.closePath(); hatchFill(c, K, hs, o.skirt || mix(o.top || T.a2, T.ink, 0.35), 3.5, 0.25);
    rr(c, -18, 25, 36, 7, 2); c.fillStyle = T.ink; c.fill(); // belt
    // white collar
    c.beginPath(); c.moveTo(-11, -9); c.lineTo(0, 2); c.lineTo(-3, -9); c.closePath(); c.moveTo(11, -9); c.lineTo(0, 2); c.lineTo(3, -9); c.closePath();
    c.fillStyle = "#fbf6ea"; c.fill(); c.lineWidth = 2; c.strokeStyle = T.ink; c.stroke();
    // arms (sleeves + hands)
    var ra = (o.arm || 0) * 2.2, hx = 18 + Math.sin(0.25 + ra) * 40, hy = 0 + Math.cos(0.25 + ra) * 40;
    c.lineWidth = 12; c.strokeStyle = T.ink; c.beginPath(); c.moveTo(-18, 0); c.lineTo(-27, 40); c.moveTo(18, 0); c.lineTo(hx, hy); c.stroke();
    c.lineWidth = 8; c.strokeStyle = o.top || T.a2; c.beginPath(); c.moveTo(-18, 0); c.lineTo(-23, 22); c.moveTo(18, 0); c.lineTo(18 + (hx - 18) * 0.55, hy * 0.55); c.stroke();
    circ(c, -27, 41, 5); c.fillStyle = skin; c.fill(); circ(c, hx, hy, 5); c.fill();
    // head (no face) + 1940s rolled hair: two victory rolls on top, curled bob at the back
    c.lineWidth = 3; c.strokeStyle = T.ink;
    c.beginPath(); c.moveTo(-5, -10); c.lineTo(-5, -16); c.lineTo(5, -16); c.lineTo(5, -10); c.fillStyle = skin; c.fill(); // neck
    circ(c, 0, -32, 19); c.fillStyle = skin; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-21, -26); c.quadraticCurveTo(-26, -8, -14, -10); c.quadraticCurveTo(-20, -18, -17, -30); c.closePath();
    c.moveTo(21, -26); c.quadraticCurveTo(26, -8, 14, -10); c.quadraticCurveTo(20, -18, 17, -30); c.closePath();
    c.fillStyle = hair; c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -36, 19, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(10, -44, 0, -40); c.quadraticCurveTo(-10, -44, -18, -40); c.closePath(); c.fill(); c.stroke();
    circ(c, -10, -52, 8); c.fill(); c.stroke(); circ(c, 10, -52, 8); c.fill(); c.stroke();
    c.restore();
  }

  /* ======================= EP 2: ENIAC ======================= */
  function eniac(K) {
    // three tall cabinets side by side (like ENIAC's panels), warm cream / olive-grey metal, amber bulbs, brass cable arms
    var T = K.T, PW = 104, GAP = 8, W = PW * 3 + GAP * 2, Hh = 300, metal = "#c8c1a0", brass = "#c9a24a";
    var bulbOn = "#ffc24a", bulbOff = mix(metal, T.ink, 0.42), px = [-(PW + GAP), 0, PW + GAP];
    var R = rig(K, { w: W, h: Hh, fill: metal, legs: [-130, -50, 50, 130], legW: 22, legL: 30, arms: "cable", cable: brass, armY: Hh * 0.12, glow: bulbOn,
      shape: function (c) { c.beginPath(); for (var i = 0; i < 3; i++) c.roundRect(px[i] - PW / 2, -Hh / 2 + (i === 1 ? 0 : 14), PW, Hh - (i === 1 ? 0 : 14), 10); },
      panel: function (c, st, t) {
        for (var i = 0; i < 3; i++) {
          var x0 = px[i], top = -Hh / 2 + (i === 1 ? 0 : 14);
          // cap strip + vent lines
          c.fillStyle = rgba(T.ink, 0.18); c.fillRect(x0 - PW / 2 + 4, top + 4, PW - 8, 12);
          c.strokeStyle = rgba(T.ink, 0.35); c.lineWidth = 2;
          for (var v = 0; v < 3; v++) { c.beginPath(); c.moveTo(x0 - 30, Hh / 2 - 26 - v * 9); c.lineTo(x0 + 30, Hh / 2 - 26 - v * 9); c.stroke(); }
          // bulbs: 2 columns x 5 rows (middle cabinet starts lower: the eyes sit on top)
          for (var r = (i === 1 ? 2 : 0); r < 5; r++) for (var q = 0; q < 2; q++) {
            var bx = x0 + (q ? 22 : -22), by = top + 42 + r * 40, on = bulbState(st, t, i, r, q);
            if (on > 0.3) { var g = c.createRadialGradient(bx, by, 0, bx, by, 24); g.addColorStop(0, rgba(bulbOn, 0.6 * on)); g.addColorStop(1, rgba(bulbOn, 0)); c.fillStyle = g; circ(c, bx, by, 24); c.fill(); }
            circ(c, bx, by, 11); c.fillStyle = on > 0.3 ? mix(bulbOff, bulbOn, on) : bulbOff; c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke();
            if (on > 0.3) { circ(c, bx - 3.5, by - 3.5, 3); c.fillStyle = "#fff6dc"; c.fill(); }
          }
          // a knob at the bottom of the outer cabinets
          if (i !== 1) { circ(c, x0, Hh / 2 - 60, 12); c.fillStyle = brass; c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke(); c.save(); c.translate(x0, Hh / 2 - 60); c.rotate(t * (st.bulbs === "race" ? 6 : 0.5) + i); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -10); c.stroke(); c.restore(); }
        }
      },
      face: function (c, st, t) {
        for (var e = -1; e <= 1; e += 2) { // two big bulb eyes on top of the middle cabinet
          var ex = e * 25, ey = -Hh / 2 + 54;
          var g = c.createRadialGradient(ex, ey, 0, ex, ey, 42); g.addColorStop(0, rgba(bulbOn, 0.55)); g.addColorStop(1, rgba(bulbOn, 0)); c.fillStyle = g; circ(c, ex, ey, 42); c.fill();
          circ(c, ex, ey, 25); c.fillStyle = mix(bulbOn, "#ffffff", 0.55); c.fill(); c.lineWidth = 4; c.strokeStyle = T.ink; c.stroke();
          eye(c, T, ex, ey + 1, 0.85, st.eyes, st.look);
        }
        c.lineCap = "round"; c.lineWidth = 4; c.strokeStyle = T.ink; c.beginPath();
        if (st.eyes === "happy") c.arc(0, -Hh / 2 + 84, 11, 0.1 * Math.PI, 0.9 * Math.PI); else c.arc(0, -Hh / 2 + 80, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        c.stroke();
      } });
    function bulbState(st, t, i, r, q) {
      var mode = st.bulbs || "idle", n = i * 10 + r * 2 + q;
      if (mode === "all") return 1;
      if (mode === "race") { var p = (t * 16) % 30; var d = (n - p + 30) % 30; return d < 5 ? 1 - d / 5 : 0; }
      return Math.sin(t * 1.7 + n * 2.39) > 0.35 ? 1 : 0;
    }
    return R;
  }
  function props2(K) {
    var T = K.T, hsA = hatchSet(K, 120, 90), hsB = hatchSet(K, 200, 60), hsP = hatchSet(K, 34, 80);
    return {
      // hand-crank desk calculator; crank turns with t * speed
      calculator: function (c, x, y, s, t, speed) {
        c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round";
        var a = t * (speed == null ? 6 : speed);
        // crank on the right
        c.save(); c.translate(118, -6); c.rotate(a); c.lineCap = "round"; c.lineWidth = 9; c.strokeStyle = T.ink; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -46); c.stroke();
        c.lineWidth = 5; c.strokeStyle = T.a5; c.stroke(); rr(c, -8, -62, 16, 22, 6); c.fillStyle = T.a3; c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke(); c.restore();
        circ(c, 118, -6, 10); c.fillStyle = T.a5; c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke();
        c.beginPath(); c.moveTo(-110, 70); c.lineTo(110, 70); c.lineTo(96, -60); c.lineTo(-96, -60); c.closePath(); hatchFill(c, K, hsA, mix(T.a5, T.paper, 0.2), 4);
        // carriage of number wheels
        rr(c, -86, -80, 172, 30, 8); hatchFill(c, K, hsP, mix(T.a5, T.ink, 0.15), 3.5);
        c.fillStyle = T.paper; c.font = "bold 18px monospace"; c.textAlign = "center"; c.textBaseline = "middle";
        for (var i = 0; i < 7; i++) { rr(c, -78 + i * 23, -75, 19, 20, 3); c.fillStyle = T.paper; c.fill(); c.fillStyle = T.ink; c.fillText(String(Math.floor(Math.abs(Math.sin(i * 3.1 + Math.floor(a / 1.2)) * 10)) % 10), -68.5 + i * 23, -64); }
        // key rows
        for (var r = 0; r < 4; r++) for (var q = 0; q < 8; q++) { circ(c, -70 + q * 20, -30 + r * 22, 7); c.fillStyle = r === 0 ? T.a3 : T.paper; c.fill(); c.lineWidth = 2; c.strokeStyle = T.ink; c.stroke(); }
        c.restore();
      },
      // desk with paper + a pencil writing lines (prog 0..1 = how much is written)
      desk: function (c, x, y, s, t, prog) {
        c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round";
        c.fillStyle = T.ink; rr(c, -150, 20, 14, 110, 4); c.fill(); rr(c, 136, 20, 14, 110, 4); c.fill();
        rr(c, -170, 0, 340, 26, 6); hatchFill(c, K, hsB, mix(T.a3, T.ink, 0.25), 4);
        c.save(); c.translate(0, -6); c.transform(1, 0, -0.35, 0.35, 0, 0); rr(c, -90, -120, 180, 120, 4); c.fillStyle = T.paper; c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke(); c.restore();
        var p = prog == null ? (t * 0.25) % 1 : prog, lines = 5, px = 0, py = 0;
        c.lineCap = "round"; c.strokeStyle = rgba(T.ink, 0.8); c.lineWidth = 2.5;
        for (var i = 0; i < lines; i++) {
          var lp = clamp(p * lines - i, 0, 1); if (lp <= 0) break;
          var ly = -38 + i * 8, x0 = -50 + ly * 0.35 * -1 * 0, len = 110 * lp;
          c.beginPath(); for (var k = 0; k <= len; k += 4) c.lineTo(-58 - (ly + 6) * 1 + 20 + k, ly + Math.sin(k * 0.6 + i) * 1.4); c.stroke();
          px = -58 - (ly + 6) + 20 + len; py = ly;
        }
        // pencil at the writing point
        c.save(); c.translate(px, py); c.rotate(-0.9 + Math.sin(t * 20) * 0.05);
        rr(c, 0, -5, 70, 10, 2); c.fillStyle = T.a1; c.fill(); c.lineWidth = 2.5; c.strokeStyle = T.ink; c.stroke();
        c.beginPath(); c.moveTo(0, -5); c.lineTo(-14, 0); c.lineTo(0, 5); c.closePath(); c.fillStyle = T.paper; c.fill(); c.stroke();
        c.fillStyle = T.a3; c.fillRect(62, -5, 8, 10); c.restore();
        c.restore();
      },
      // blueprint panel where a shell's path draws itself (prog 0..1)
      trajectory: function (c, x, y, s, prog) {
        c.save(); c.translate(x, y); c.scale(s, s);
        rr(c, -220, -140, 440, 280, 10); c.fillStyle = mix(T.a2, T.canvas, 0.25); c.fill(); c.lineWidth = 4; c.strokeStyle = T.ink; c.stroke();
        c.strokeStyle = rgba(T.light, 0.18); c.lineWidth = 1.2;
        for (var gx = -200; gx <= 200; gx += 25) { c.beginPath(); c.moveTo(gx, -128); c.lineTo(gx, 128); c.stroke(); }
        for (var gy = -125; gy <= 125; gy += 25) { c.beginPath(); c.moveTo(-208, gy); c.lineTo(208, gy); c.stroke(); }
        c.strokeStyle = rgba(T.light, 0.7); c.lineWidth = 2.5; c.beginPath(); c.moveTo(-190, 100); c.lineTo(195, 100); c.stroke();
        var p = clamp(prog, 0, 1), N = 60, last = null;
        c.setLineDash([10, 7]); c.strokeStyle = T.core; c.lineWidth = 4; c.lineCap = "round"; c.beginPath();
        for (var i = 0; i <= N * p; i++) { var u = i / N, px = -180 + u * 360, py = 100 - 4 * 190 * u * (1 - u) * (1 - 0.15 * u); c.lineTo(px, py); last = [px, py]; }
        c.stroke(); c.setLineDash([]);
        circ(c, -180, 100, 8); c.fillStyle = T.a3; c.fill();
        if (last && p < 1) { H.sparkle(c, last[0], last[1], 18, 14, "#ffffff", 0.5, rgba(T.core, 0.9)); }
        if (p >= 1) { circ(c, 180, 100, 12); c.fillStyle = T.core; c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke(); }
        c.restore();
      },
      // the six women programmers, hatched, no face; i = 0..5, pose: { arm 0..1 }
      programmer: function (c, x, y, s, i, pose) {
        var tops = [T.a2, T.a3, T.a6, T.a1, mix(T.a2, T.paper, 0.4), T.a5], hairs = [T.ink, "#5a3a22", "#2a1e12", "#7a5232", "#3b2a1a", "#1c140c"], skins = ["#e3b48c", "#d9a37a", "#f0c8a0", "#c98f63", "#e8bd93", "#dcae85"];
        person(c, K, hsP, x, y, s, { top: tops[i % 6], hair: hairs[i % 6], skin: skins[i % 6], arm: (pose && pose.arm) || 0 });
      },
      // wall socket for the plug-in pose
      socket: function (c, x, y, s, lit) {
        c.save(); c.translate(x, y); c.scale(s, s);
        rr(c, -34, -44, 68, 88, 10); c.fillStyle = mix(T.paper, T.a5, 0.3); c.fill(); c.lineWidth = 4; c.strokeStyle = T.ink; c.stroke();
        for (var k = -1; k <= 1; k += 2) { rr(c, -6, k * 16 - 8, 12, 16, 3); c.fillStyle = T.ink; c.fill(); }
        if (lit) H.sparkle(c, 30, -40, 22 * lit, 18 * lit, T.core, 0.6 * lit);
        c.restore();
      }
    };
  }


  /* ======================= EP 3: SPREADSHEET + ATM ======================= */
  function crtEye(c, T, x, y, s, kind, look, col) { // green-screen pixel eyes
    var lx = (look || 0) * 5 * s; c.fillStyle = col; c.strokeStyle = col; c.lineCap = "round"; c.lineWidth = 5 * s;
    if (kind === "happy") { c.beginPath(); c.moveTo(x + lx - 11 * s, y + 5 * s); c.lineTo(x + lx, y - 7 * s); c.lineTo(x + lx + 11 * s, y + 5 * s); c.stroke(); return; }
    if (kind === "blink" || kind === "sleep") { c.beginPath(); c.moveTo(x + lx - 9 * s, y); c.lineTo(x + lx + 9 * s, y); c.stroke(); return; }
    rr(c, x + lx - 6 * s, y - 13 * s, 12 * s, 26 * s, 3 * s); c.fill();
  }
  function spreadsheet(K) {
    var T = K.T, W = 300, Hh = 200, CW = W / 6, RH = Hh / 5, green = T.a1, glowG = T.core;
    var R = rig(K, { w: W, h: Hh, rad: 10, fill: T.buddy, legs: [-105, -40, 40, 105], legW: 20, legL: 34, arms: "nub", nubW: 34, nubH: 36, glow: glowG,
      panel: function (c, st, t) {
        c.strokeStyle = rgba(T.ink, 0.55); c.lineWidth = 2;
        for (var i = 1; i < 6; i++) { c.beginPath(); c.moveTo(-W / 2 + i * CW, -Hh / 2 + 4); c.lineTo(-W / 2 + i * CW, Hh / 2 - 4); c.stroke(); }
        for (var j = 1; j < 5; j++) { c.beginPath(); c.moveTo(-W / 2 + 4, -Hh / 2 + j * RH); c.lineTo(W / 2 - 4, -Hh / 2 + j * RH); c.stroke(); }
        // header row tint
        c.fillStyle = rgba(T.a2, 0.25); c.fillRect(-W / 2 + 3, -Hh / 2 + 3, W - 6, RH - 3);
        // numbers in cells (calc mode flashes them, total cell glows)
        c.font = "bold 15px monospace"; c.textAlign = "center"; c.textBaseline = "middle";
        for (var r = 2; r < 5; r++) for (var q = 0; q < 6; q++) {
          if (r === 4 && q === 5) continue;
          var flash = st.calc ? (Math.sin(t * 9 + r * 1.7 + q * 2.3) > 0.2 ? 1 : 0.35) : 0.6;
          c.fillStyle = rgba(T.ink, flash * 0.75); c.fillText(String((r * 37 + q * 53 + (st.calc ? Math.floor(t * 6) * 7 : 0)) % 100), -W / 2 + q * CW + CW / 2, -Hh / 2 + r * RH + RH / 2 + 1);
        }
        var tot = st.calc ? 0.5 + 0.5 * Math.sin(t * 6) : (st.eyes === "happy" ? 1 : 0.3);
        c.fillStyle = mix(T.buddy, green, tot * 0.8); c.fillRect(-W / 2 + 5 * CW + 2, -Hh / 2 + 4 * RH + 2, CW - 4, RH - 4);
        c.fillStyle = T.ink; c.fillText("Σ", W / 2 - CW / 2, Hh / 2 - RH / 2 + 1);
      },
      face: function (c, st, t) {
        for (var e = -1; e <= 1; e += 2) { // eye cells: green screen cells in row 1
          var cx = e < 0 ? -W / 2 + 1.5 * CW : -W / 2 + 4.5 * CW, cy = -Hh / 2 + RH * 1.5 - 4;
          rr(c, cx - CW * 0.48 - 2, cy - RH * 0.9, CW * 0.96 + 4, RH * 1.8, 6); c.fillStyle = mix(T.canvas, green, 0.18); c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke();
          crtEye(c, T, cx, cy, 1, st.eyes, st.look, green);
        }
        // smile in the middle cells
        c.lineCap = "round"; c.lineWidth = 4; c.strokeStyle = T.ink; c.beginPath();
        if (st.eyes === "happy") c.arc(0, -Hh / 2 + RH * 2.2, 13, 0.1 * Math.PI, 0.9 * Math.PI); else c.arc(0, -Hh / 2 + RH * 1.9, 10, 0.2 * Math.PI, 0.8 * Math.PI);
        c.stroke();
      } });
    return R;
  }
  function atm(K) {
    var T = K.T, W = 180, Hh = 290, body = mix(T.a2, T.buddy, 0.35), green = T.a1;
    var R = rig(K, { w: W, h: Hh, rad: 14, fill: body, legs: [-50, 50], legW: 22, legL: 34, arms: "nub", nubW: 32, nubH: 34, armY: Hh * 0.02, glow: T.core,
      panel: function (c, st, t) {
        // screen face
        var on = st.dim ? 0.25 : 1;
        rr(c, -W / 2 + 18, -Hh / 2 + 20, W - 36, 100, 12); c.fillStyle = mix(T.canvas, green, 0.12 * on); c.fill(); c.lineWidth = 4; c.strokeStyle = T.ink; c.stroke();
        var g = c.createRadialGradient(0, -Hh / 2 + 70, 0, 0, -Hh / 2 + 70, 80); g.addColorStop(0, rgba(green, 0.28 * on)); g.addColorStop(1, rgba(green, 0)); c.fillStyle = g; c.fillRect(-W / 2 + 20, -Hh / 2 + 22, W - 40, 96);
        // scanlines
        c.strokeStyle = rgba(green, 0.12 * on); c.lineWidth = 1; for (var y0 = -Hh / 2 + 26; y0 < -Hh / 2 + 118; y0 += 5) { c.beginPath(); c.moveTo(-W / 2 + 22, y0); c.lineTo(W / 2 - 22, y0); c.stroke(); }
        // keypad
        for (var r = 0; r < 4; r++) for (var q = 0; q < 3; q++) { rr(c, -36 + q * 26, -Hh / 2 + 140 + r * 22, 20, 16, 4); c.fillStyle = r === 3 && q === 2 ? T.a6 : r === 3 && q === 0 ? T.a3 : T.paper; c.fill(); c.lineWidth = 2.2; c.strokeStyle = T.ink; c.stroke(); }
        // card slot + cash slot
        rr(c, 46, -Hh / 2 + 142, 26, 8, 3); c.fillStyle = T.ink; c.fill();
        rr(c, -60, Hh / 2 - 48, 120, 14, 5); c.fillStyle = T.ink; c.fill();
      },
      face: function (c, st, t) {
        var col = st.dim ? mix(green, T.canvas, 0.6) : green;
        crtEye(c, T, -26, -Hh / 2 + 62, 1.15, st.eyes, st.look, col); crtEye(c, T, 26, -Hh / 2 + 62, 1.15, st.eyes, st.look, col);
        c.lineCap = "round"; c.lineWidth = 4; c.strokeStyle = col; c.beginPath();
        if (st.dim) { c.moveTo(-10, -Hh / 2 + 100); c.lineTo(10, -Hh / 2 + 100); } else c.arc(0, -Hh / 2 + 90, 10, 0.2 * Math.PI, 0.8 * Math.PI);
        c.stroke();
      },
      front: function (c, st, t) { // bills sliding out of the cash slot
        var k = st.cash || 0; if (k <= 0) return;
        for (var i = 0; i < 3; i++) {
          var kk = clamp(k * 3 - i, 0, 1); if (kk <= 0) continue;
          c.save(); c.translate(-6 + i * 6, Hh / 2 - 44 + kk * 30 + i * 4); c.rotate(-0.08 + i * 0.06);
          rr(c, -44, 0, 88, 40, 4); c.fillStyle = mix(T.a6, T.paper, 0.35); c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke();
          circ(c, 0, 20, 10); c.lineWidth = 2; c.stroke(); c.restore();
        }
      } });
    return R;
  }
  function props3(K) {
    var T = K.T, hs1 = hatchSet(K, 130, 110), hs2 = hatchSet(K, 70, 70), hs3 = hatchSet(K, 90, 90), green = T.a1;
    return {
      // beige PC with a green VisiCalc grid on the CRT; t animates the cursor
      pc: function (c, x, y, s, t) {
        c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round";
        rr(c, -150, 70, 300, 46, 8); hatchFill(c, K, hs1, T.buddy, 4); // keyboard
        for (var r = 0; r < 3; r++) for (var q = 0; q < 12; q++) { rr(c, -134 + q * 22.5, 78 + r * 12, 18, 9, 2); c.fillStyle = mix(T.buddy, T.ink, 0.12); c.fill(); }
        rr(c, -130, -150, 260, 210, 16); hatchFill(c, K, hs1, T.buddy, 4); // monitor
        rr(c, -50, 56, 100, 16, 3); c.fillStyle = mix(T.buddy, T.ink, 0.2); c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke();
        rr(c, -108, -130, 216, 160, 14); c.fillStyle = mix(T.canvas, green, 0.1); c.fill(); c.lineWidth = 4; c.stroke();
        c.strokeStyle = rgba(green, 0.5); c.lineWidth = 1.4;
        for (var i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-104 + i * 42, -124); c.lineTo(-104 + i * 42, 26); c.stroke(); }
        for (var j = 1; j < 7; j++) { c.beginPath(); c.moveTo(-104, -126 + j * 22); c.lineTo(104, -126 + j * 22); c.stroke(); }
        var cur = Math.floor(t * 2) % 20, cq = cur % 5, cr = Math.floor(cur / 5) + 1;
        c.fillStyle = rgba(green, 0.85); c.fillRect(-104 + cq * 42 + 2, -126 + cr * 22 + 2, 38, 18);
        c.fillStyle = rgba(green, 0.7); for (var k = 0; k < 18; k++) { var kq = k % 5, kr = Math.floor(k / 5) + 1; if (kq === cq && kr === cr) continue; c.fillRect(-98 + kq * 42, -118 + kr * 22, 10 + (k * 7) % 20, 4); }
        circ(c, 112, 46, 5); c.fillStyle = green; c.fill();
        c.restore();
      },
      // stack of ledger books (n books)
      ledgers: function (c, x, y, s, n) {
        c.save(); c.translate(x, y); c.scale(s, s); n = n || 5;
        var cols = [T.a3, T.a2, mix(T.a3, T.ink, 0.3), T.a5, mix(T.a2, T.ink, 0.25)];
        for (var i = 0; i < n; i++) { var w = 170 - (i % 2) * 14, ox = ((i * 37) % 13) - 6; c.save(); c.translate(ox, -i * 30); rr(c, -w / 2, -26, w, 28, 4); hatchFill(c, K, hs2, cols[i % 5], 3.5);
          c.fillStyle = T.paper; c.fillRect(w / 2 - 12, -22, 8, 20); c.strokeStyle = T.ink; c.lineWidth = 2; c.strokeRect(w / 2 - 12, -22, 8, 20); c.restore(); }
        c.restore();
      },
      // two bar stacks: left shrinks, right grows as k goes 0 → 1 (heights in units of 40 px blocks)
      bars: function (c, x, y, s, k, from, to) {
        c.save(); c.translate(x, y); c.scale(s, s); from = from || [4, 3]; to = to || [2, 6];
        c.lineWidth = 4; c.strokeStyle = T.ink; c.beginPath(); c.moveTo(-170, 0); c.lineTo(170, 0); c.stroke();
        var cols = [T.a3, green];
        for (var b = 0; b < 2; b++) {
          var hgt = (from[b] + (to[b] - from[b]) * clamp(k, 0, 1)) * 40, bx = b === 0 ? -130 : 30;
          rr(c, bx, -hgt, 100, hgt, [8, 8, 0, 0]); hatchFill(c, K, hs3, cols[b], 4);
          for (var u = 40; u < hgt - 2; u += 40) { c.beginPath(); c.moveTo(bx + 4, -u); c.lineTo(bx + 96, -u); c.lineWidth = 2; c.strokeStyle = rgba(T.ink, 0.4); c.stroke(); }
        }
        c.restore();
      },
      // small bank building with columns
      bank: function (c, x, y, s, lit) {
        c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round";
        c.beginPath(); c.moveTo(-100, -100); c.lineTo(0, -150); c.lineTo(100, -100); c.closePath(); hatchFill(c, K, hs2, T.paper, 4);
        rr(c, -95, -100, 190, 16, 2); hatchFill(c, K, hs2, mix(T.paper, T.a5, 0.3), 3.5);
        for (var i = 0; i < 4; i++) { rr(c, -80 + i * 46, -84, 22, 70, 2); hatchFill(c, K, hs2, T.paper, 3); }
        rr(c, -105, -14, 210, 16, 2); hatchFill(c, K, hs2, mix(T.paper, T.a5, 0.3), 3.5);
        if (lit) { c.fillStyle = rgba(T.core, 0.5 * lit); c.fillRect(-26, -80, 22, 60); }
        circ(c, 0, -118, 9); c.fillStyle = T.a1; c.fill(); c.lineWidth = 2.5; c.strokeStyle = T.ink; c.stroke();
        c.restore();
      },
      // smartphone with a bank app (tap = 0..1 pulse)
      phone: function (c, x, y, s, t, tap) {
        c.save(); c.translate(x, y); c.scale(s, s);
        rr(c, -60, -115, 120, 230, 18); c.fillStyle = T.ink; c.fill();
        rr(c, -52, -100, 104, 196, 10); c.fillStyle = mix(T.paper, T.a4, 0.2); c.fill();
        rr(c, -40, -86, 80, 50, 8); c.fillStyle = T.a4; c.fill();
        c.fillStyle = T.paper; c.font = "bold 22px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("$", 0, -61);
        for (var i = 0; i < 4; i++) { rr(c, -40, -22 + i * 24, 80, 16, 5); c.fillStyle = mix(T.a5, T.paper, 0.4 + 0.1 * i); c.fill(); }
        var p = tap == null ? (t % 1.5) / 1.5 : tap; if (p < 0.6) { circ(c, 10, 40, 10 + p * 40); c.strokeStyle = rgba(T.a4, 1 - p / 0.6); c.lineWidth = 4; c.stroke(); }
        c.restore();
      }
    };
  }


  /* ======================= EP 4: KNIGHT + DEEP BLUE ======================= */
  function knight(K) {
    var T = K.T, ivory = T.paper, accent = T.a1;
    var R = rig(K, { w: 110, h: 272, fill: ivory, legs: [-50, 50], legW: 22, legL: 26, arms: "nub", nubW: 30, nubH: 32, armY: 18, glow: T.core, lightAmt: 0.6,
      shape: function (c) {
        c.beginPath();
        c.moveTo(-74, 100); c.quadraticCurveTo(-80, 40, -58, -10); c.quadraticCurveTo(-66, -70, -40, -112);
        c.lineTo(-30, -150); c.lineTo(-8, -122); c.lineTo(4, -148); c.lineTo(18, -116);
        c.quadraticCurveTo(60, -100, 96, -40); c.quadraticCurveTo(104, -18, 84, -10); c.quadraticCurveTo(54, -6, 34, -22);
        c.quadraticCurveTo(28, 10, 58, 46); c.quadraticCurveTo(74, 70, 74, 100); c.closePath();
        c.roundRect(-96, 96, 192, 34, 10); c.roundRect(-82, 80, 164, 24, 8);
      },
      face: function (c, st, t) {
        eye(c, T, 20, -78, 0.95, st.eyes, (st.look || 0) * 0.6);
        c.fillStyle = T.ink; circ(c, 80, -30, 4); c.fill(); // nostril
        // mane hatch accent
        c.strokeStyle = rgba(T.ink, 0.55); c.lineWidth = 3; c.lineCap = "round";
        for (var i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-48 + i * 4, -96 + i * 30); c.lineTo(-30 + i * 4, -88 + i * 30); c.stroke(); }
        if (st.eyes === "happy") { c.beginPath(); c.arc(62, -24, 9, 0.1 * Math.PI, 0.9 * Math.PI); c.lineWidth = 3.5; c.stroke(); }
        if (st.sweat) { c.fillStyle = mix(T.a4, "#ffffff", 0.4); c.beginPath(); c.moveTo(-20, -120); c.quadraticCurveTo(-12, -104, -20, -98); c.quadraticCurveTo(-28, -104, -20, -120); c.fill(); c.lineWidth = 2; c.strokeStyle = T.ink; c.stroke(); }
      } });
    R.foot = 136 + 26 + 4; // base sits low
    return R;
  }
  function deepBlue(K) {
    var T = K.T, body = "#25283a", led = T.a4, accent = T.a1, W = 200, Hh = 330;
    var R = rig(K, { w: W, h: Hh, rad: 12, fill: body, legs: [-55, 55], legW: 24, legL: 28, arms: "nub", nubW: 30, nubH: 38, armY: -20, glow: led, lightAmt: 0.25,
      panel: function (c, st, t) {
        // rack slots
        c.strokeStyle = rgba("#ffffff", 0.12); c.lineWidth = 2;
        for (var i = 0; i < 9; i++) { rr(c, -W / 2 + 18, -Hh / 2 + 110 + i * 22, W - 36, 14, 3); c.stroke(); }
        // little status lights per slot
        for (var j = 0; j < 9; j++) { var on = Math.sin(t * (st.compute ? 11 : 2.2) + j * 1.9) > 0.2; circ(c, W / 2 - 30, -Hh / 2 + 117 + j * 22, 3.5); c.fillStyle = on ? (j === 4 ? accent : led) : rgba("#ffffff", 0.15); c.fill(); }
        // logo stripe
        c.fillStyle = rgba(led, 0.35); c.fillRect(-W / 2 + 18, Hh / 2 - 46, 70, 8);
      },
      face: function (c, st, t) { // LED visor: a scanning bar, two brighter eye blocks
        rr(c, -W / 2 + 16, -Hh / 2 + 30, W - 32, 54, 12); c.fillStyle = "#0d0f18"; c.fill(); c.lineWidth = 4; c.strokeStyle = T.ink; c.stroke();
        var col = st.win ? accent : led, n = 9, sp = st.compute ? 3.2 : 0.8, pos = (Math.sin(t * sp) * 0.5 + 0.5) * (n - 1);
        for (var k = 0; k < n; k++) {
          var x = -W / 2 + 30 + k * ((W - 60) / (n - 1)), a = Math.max(0.3, 1 - Math.abs(k - pos) / 2.2);
          if (st.eyes === "happy" || st.win) a = (k === 2 || k === 6) ? 1 : 0.15;
          circ(c, x, -Hh / 2 + 57, 7.5); c.fillStyle = rgba(col, a); c.fill();
          if (a > 0.6) { var g = c.createRadialGradient(x, -Hh / 2 + 57, 0, x, -Hh / 2 + 57, 18); g.addColorStop(0, rgba(col, 0.5 * a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; circ(c, x, -Hh / 2 + 57, 18); c.fill(); }
        }
        if (st.eyes === "happy" || st.win) { c.strokeStyle = col; c.lineWidth = 4; c.lineCap = "round"; for (var e = -1; e <= 1; e += 2) { var ex = e * 44; c.beginPath(); c.moveTo(ex - 12, -Hh / 2 + 66); c.lineTo(ex, -Hh / 2 + 52); c.lineTo(ex + 12, -Hh / 2 + 66); c.stroke(); } }
      } });
    return R;
  }
  function props4(K) {
    var T = K.T, hsB = hatchSet(K, 200, 120), hsK = hatchSet(K, 40, 90), hsM = hatchSet(K, 120, 160);
    function king(c, x, y, s, ang, col) {
      c.save(); c.translate(x, y); c.rotate(ang || 0); c.scale(s, s); // pivot at the base's right corner when tipping
      c.beginPath(); c.moveTo(-26, 0); c.lineTo(26, 0); c.lineTo(20, -14); c.lineTo(12, -16); c.quadraticCurveTo(22, -70, 14, -86); c.lineTo(22, -94); c.lineTo(-22, -94); c.lineTo(-14, -86); c.quadraticCurveTo(-22, -70, -12, -16); c.lineTo(-20, -14); c.closePath();
      c.roundRect(-16, -112, 32, 18, 8);
      hatchFill(c, K, hsK, col || T.ink, 3.5, 0.3);
      c.lineWidth = 6; c.strokeStyle = T.ink; c.lineCap = "round"; c.beginPath(); c.moveTo(0, -112); c.lineTo(0, -134); c.moveTo(-9, -124); c.lineTo(9, -124); c.stroke();
      c.lineWidth = 3; c.strokeStyle = col === T.ink ? T.a1 : T.ink; c.beginPath(); c.moveTo(0, -112); c.lineTo(0, -134); c.moveTo(-9, -124); c.lineTo(9, -124); c.stroke();
      c.restore();
    }
    return {
      // chessboard seen at an angle (flat squash), spotlight glow on top
      board: function (c, x, y, s, lit) {
        c.save(); c.translate(x, y); c.scale(s, s);
        if (lit !== 0) { var g = c.createRadialGradient(0, -40, 0, 0, -40, 320); g.addColorStop(0, rgba(T.core, 0.35)); g.addColorStop(1, rgba(T.core, 0)); c.fillStyle = g; circ(c, 0, -40, 320); c.fill(); }
        c.save(); c.transform(1, 0, -0.45, 0.42, 0, 0);
        rr(c, -170, -170, 340, 340, 8); c.fillStyle = "#3a2f28"; c.fill(); c.lineWidth = 6; c.strokeStyle = T.ink; c.stroke();
        for (var r = 0; r < 8; r++) for (var q = 0; q < 8; q++) { c.fillStyle = (r + q) % 2 ? "#2b2b30" : T.paper; c.fillRect(-160 + q * 40, -160 + r * 40, 40, 40); }
        c.lineWidth = 3; c.strokeStyle = T.ink; c.strokeRect(-160, -160, 320, 320);
        c.restore();
        c.beginPath(); c.moveTo(-170 + 0.45 * 170 * 0.42 * 0, 0); c.restore();
      },
      // king that tips over: k 0 = standing, 1 = lying on its side
      king: function (c, x, y, s, k, col) { var a = HATCH.sstep(0, 1, k) * 1.45; king(c, x + 26 * s * Math.min(1, k * 1.2) * 0, y, s, a, col); },
      // seated human silhouette (no face), head resting on a hand; worry 0..1 bows the head
      human: function (c, x, y, s, worry) {
        c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round"; var w = worry || 0, col = "#3a3b46";
        rr(c, -90, 60, 180, 22, 6); hatchFill(c, K, hsM, mix(T.a3, T.ink, 0.45), 3.5, 0.2); // table edge
        c.beginPath(); c.moveTo(-70, 60); c.quadraticCurveTo(-80, -40, -30, -60); c.lineTo(40, -60); c.quadraticCurveTo(84, -40, 74, 60); c.closePath(); hatchFill(c, K, hsM, col, 4, 0.18); // torso
        c.beginPath(); c.moveTo(40, -40); c.quadraticCurveTo(70, 20, 30, 56); c.lineTo(10, 46); c.quadraticCurveTo(44, 10, 22, -40); c.closePath(); hatchFill(c, K, hsM, mix(col, "#000000", 0.15), 3.5, 0.15); // arm to the table
        c.save(); c.translate(0, -84); c.rotate(0.18 * w); circ(c, 0, -10 + w * 8, 40); c.fillStyle = mix(col, T.paper, 0.12); c.fill(); c.lineWidth = 4; c.strokeStyle = T.ink; c.stroke();
        c.beginPath(); c.arc(0, -16 + w * 8, 40, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(10, -46, -40, -18); c.fillStyle = "#1c1c22"; c.fill(); c.restore(); // hair
        c.beginPath(); c.moveTo(-50, -30); c.quadraticCurveTo(-74, -66, -36, -92); c.lineWidth = 16; c.strokeStyle = T.ink; c.lineCap = "round"; c.stroke(); c.lineWidth = 10; c.strokeStyle = col; c.stroke(); // hand to head
        c.restore();
      },
      // grid of tiny phones each with a glowing mini chessboard (n phones, twinkle by t)
      phones: function (c, x, y, s, t, n) {
        c.save(); c.translate(x, y); c.scale(s, s); n = n || 24; var cols = 6, rows = Math.ceil(n / cols);
        for (var i = 0; i < n; i++) {
          var q = i % cols, r = Math.floor(i / cols), px = (q - (cols - 1) / 2) * 62, py = (r - (rows - 1) / 2) * 100, tw = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
          var g = c.createRadialGradient(px, py, 0, px, py, 46); g.addColorStop(0, rgba(T.core, 0.25 * tw)); g.addColorStop(1, rgba(T.core, 0)); c.fillStyle = g; circ(c, px, py, 46); c.fill();
          rr(c, px - 22, py - 40, 44, 80, 9); c.fillStyle = T.ink; c.fill(); c.lineWidth = 2.2; c.strokeStyle = rgba(T.light, 0.75); c.stroke();
          rr(c, px - 7, py - 37, 14, 4, 2); c.fillStyle = rgba(T.light, 0.6); c.fill(); // notch
          for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) { c.fillStyle = (a + b) % 2 ? rgba(T.paper, 0.35 + 0.5 * tw) : rgba(T.a1, 0.25 + 0.5 * tw); c.fillRect(px - 16 + b * 8, py - 16 + a * 8, 8, 8); }
        }
        c.restore();
      }
    };
  }


  /* ======================= EP 5: "YOU" ======================= */
  function you(K) {
    var T = K.T;
    var R = rig(K, { w: 170, h: 116, rad: 22, fill: T.buddy, legs: [-56, -22, 22, 56], legW: 17, legL: 30, arms: "nub", nubW: 26, nubH: 30, armY: 10, glow: T.core,
      face: function (c, st, t) {
        var ek = st.eyes === "wide" ? "open" : st.eyes, sc = st.eyes === "wide" ? 1.15 : 0.9;
        eye(c, T, -40, -10, sc, ek, st.look); eye(c, T, 40, -10, sc, ek, st.look);
        c.lineCap = "round"; c.lineWidth = 4; c.strokeStyle = T.ink; c.beginPath();
        if (st.eyes === "wide") { circ(c, (st.look || 0) * 5, 26, 7); c.fillStyle = T.eyeInk; c.fill(); }
        else { c.arc((st.look || 0) * 5, 16, st.eyes === "happy" ? 12 : 9, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
        c.globalAlpha = 0.45; c.fillStyle = T.a3; c.beginPath(); c.ellipse(-62, 14, 11, 6, 0, 0, Math.PI * 2); c.ellipse(62, 14, 11, 6, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      } });
    return R;
  }
  function props5(K) {
    var T = K.T, hsL = hatchSet(K, 160, 120), hsD = hatchSet(K, 60, 110), hsB = hatchSet(K, 110, 60);
    return {
      // X-ray lightbox; spot 0..1 draws a ring around the spot the AI found
      lightbox: function (c, x, y, s, t, spot) {
        c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round";
        rr(c, -150, -120, 300, 240, 14); hatchFill(c, K, hsL, mix(T.paper, T.a5, 0.2), 5);
        rr(c, -128, -100, 256, 200, 8); c.fillStyle = "#1d2236"; c.fill(); c.lineWidth = 3; c.strokeStyle = T.ink; c.stroke();
        var g = c.createRadialGradient(0, 0, 10, 0, 0, 160); g.addColorStop(0, rgba("#cfe6ff", 0.35)); g.addColorStop(1, rgba("#cfe6ff", 0.05)); c.fillStyle = g; c.fillRect(-126, -98, 252, 196);
        c.strokeStyle = rgba("#eaf4ff", 0.8); c.lineWidth = 6; c.lineCap = "round";
        c.beginPath(); c.moveTo(0, -84); c.lineTo(0, 84); c.stroke(); // spine
        for (var i = 0; i < 6; i++) { var yy = -64 + i * 24; for (var sd = -1; sd <= 1; sd += 2) { c.beginPath(); c.moveTo(0, yy); c.quadraticCurveTo(sd * 70, yy - 14, sd * (86 - i * 4), yy + 26); c.lineWidth = 5; c.stroke(); } }
        var k = clamp(spot || 0, 0, 1);
        if (k > 0) { c.beginPath(); c.arc(48, -10, 26, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); c.lineWidth = 5; c.strokeStyle = T.a1; c.stroke(); if (k >= 1) H.sparkle(c, 78, -40, 16, 13, T.a1, 0.5); }
        c.restore();
      },
      // chat bubble: k 0..1 pops in; side ±1 (tail side); typing = true shows the 3 dots, else text bars
      bubble: function (c, x, y, s, t, k, side, typing, col) {
        var p = clamp(k == null ? 1 : k, 0, 1); if (p <= 0) return;
        var pop = p < 1 ? 1.12 * Math.sin(p * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) : 1;
        c.save(); c.translate(x, y); c.scale(s * pop, s * pop); side = side || 1; var fill = col || (side > 0 ? T.paper : T.a2);
        c.beginPath(); c.roundRect(-110, -50, 220, 90, 28); c.moveTo(side * 60, 36); c.lineTo(side * 92, 66); c.lineTo(side * 30, 38);
        hatchFill(c, K, hsB, fill, 4, 0.4);
        if (typing) for (var i = -1; i <= 1; i++) { circ(c, i * 30, -4 - Math.max(0, Math.sin(t * 8 - i * 1.2)) * 8, 9); c.fillStyle = T.ink; c.fill(); }
        else { c.fillStyle = rgba(T.ink, 0.7); rr(c, -80, -26, 150, 12, 6); c.fill(); rr(c, -80, -2, 110, 12, 6); c.fill(); }
        c.restore();
      },
      // a door; open 0..1 (0 = closed), light behind it when open
      door: function (c, x, y, s, open, light) {
        c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round"; var o = clamp(open, 0, 1);
        rr(c, -64, -200, 128, 204, [10, 10, 0, 0]); c.fillStyle = T.ink; c.fill(); // frame hole
        if (o > 0.01) { // light spilling out
          c.save(); rr(c, -58, -194, 116, 196, [8, 8, 0, 0]); c.clip();
          var g = c.createLinearGradient(0, -194, 0, 0); g.addColorStop(0, mix(T.core, "#ffffff", 0.5)); g.addColorStop(1, T.a1); c.fillStyle = g; c.globalAlpha = o; c.fillRect(-60, -200, 120, 204); c.restore();
          if (light !== false) { c.globalAlpha = 0.35 * o; c.fillStyle = T.core; c.beginPath(); c.moveTo(-58, 2); c.lineTo(58, 2); c.lineTo(120 + 60 * o, 60); c.lineTo(-120 - 60 * o, 60); c.closePath(); c.fill(); c.globalAlpha = 1; }
        }
        var w = 116 * (1 - o * 0.82); // door leaf swings (gets narrower), hinge on the left
        c.beginPath(); c.moveTo(-58, -194); c.lineTo(-58 + w, -194 + o * 14); c.lineTo(-58 + w, 2 - o * 6); c.lineTo(-58, 2); c.closePath();
        hatchFill(c, K, hsD, mix(T.a3, T.paper, 0.25), 4, 0.35);
        circ(c, -58 + w - 14, -92, 6); c.fillStyle = T.a1; c.fill(); c.lineWidth = 2; c.strokeStyle = T.ink; c.stroke();
        rr(c, -74, 0, 148, 10, 3); c.fillStyle = T.ink; c.fill();
        c.restore();
      }
    };
  }

  /* ---------------- poses (time only, seek-safe) ---------------- */
  function pose(who, move, t, opt) {
    opt = opt || {};
    var s = { t: t, eyes: blinkAt(t, 0.7) ? "blink" : "open", squash: Math.sin(t * 2.1) * 0.02, armL: 0.1, armR: 0.1, hop: 0 };
    if (who === "eniac") {
      s.bulbs = "idle";
      if (move === "calc") { s.bulbs = "race"; s.squash = Math.sin(t * 14) * 0.015; s.look = Math.sin(t * 2.5) * 0.6; s.hop = Math.abs(Math.sin(t * 14)) * 2; }
      if (move === "plug") { // right cable reaches out and plugs into a socket on the right at ~0.9 s
        var p = sstep(0.2, 0.9, t); s.armR = 0.15 * p; s.armLenR = p; s.look = 0.8 * p; s.bulbs = t > 0.95 ? "race" : "idle"; s.eyes = t > 1.0 ? "happy" : s.eyes; }
      if (move === "proud") { var j = Math.sin(clamp(((t % 1.8) - 0.2) / 0.6, 0, 1) * Math.PI); s.hop = j * 34; s.squash = -j * 0.05; s.eyes = "happy"; s.bulbs = "all"; s.armL = 0.6 + j * 0.6; s.armR = 0.6 + j * 0.6; }
      if (move === "look") { var k = sstep(0.2, 0.5, t); s.look = (opt.dir || 1) * k; s.eyes = win(t, 1.1, 2.0) ? "happy" : s.eyes; }
      if (move === "walk") { s.walk = t; s.walkAmt = 1; }
    }
    if (who === "spreadsheet" || who === "atm") {
      if (move === "calc") { s.calc = true; s.look = Math.sin(t * 2.5) * 0.6; s.hop = Math.abs(Math.sin(t * 10)) * 3; }
      if (move === "happy" || move === "proud") { var j2 = Math.sin(clamp(((t % 1.6) - 0.25) / 0.55, 0, 1) * Math.PI); s.hop = j2 * 34; s.squash = -j2 * 0.06; s.eyes = "happy"; s.armL = 0.3 + j2 * 1.1; s.armR = 0.3 + j2 * 1.1; }
      if (move === "look") { var k2 = sstep(0.2, 0.5, t); s.look = (opt.dir || 1) * k2; s.eyes = win(t, 1.1, 2.0) ? "happy" : s.eyes; }
      if (move === "dispense") { s.cash = sstep(0.3, 1.4, t); s.eyes = t > 1.4 ? "happy" : s.eyes; s.armR = 0.1 + sstep(1.4, 1.7, t) * 1.0; }
      if (move === "sleepy") { s.dim = true; s.eyes = "sleep"; s.squash = 0.04 + Math.sin(t * 1.2) * 0.02; s.tilt = 0.06; }
      if (move === "walk") { s.walk = t; s.walkAmt = 1; }
    }
    if (who === "knight" || who === "deepblue") {
      if (move === "hop") { var cy = t % 1.4, jj = Math.sin(clamp((cy - 0.2) / 0.6, 0, 1) * Math.PI); s.hop = jj * 60; s.squash = cy < 0.2 ? sstep(0, 0.2, cy) * 0.1 : -jj * 0.06; s.tilt = jj * 0.15; }
      if (move === "think") { s.look = 0.6; s.armR = 1.6; s.tilt = -0.04; s.compute = true; }
      if (move === "worried") { s.sweat = true; s.tilt = -0.08 + Math.sin(t * 9) * 0.02; s.squash = 0.05; s.look = -0.5; }
      if (move === "compute") { s.compute = true; s.squash = Math.sin(t * 12) * 0.012; }
      if (move === "win" || move === "proud") { var j3 = Math.sin(clamp(((t % 1.6) - 0.25) / 0.55, 0, 1) * Math.PI); s.hop = j3 * 30; s.eyes = "happy"; s.win = who === "deepblue"; s.armL = 0.4 + j3 * 1.0; s.armR = 0.4 + j3 * 1.0; }
      if (move === "look") { var k4 = sstep(0.2, 0.5, t); s.look = (opt.dir || 1) * k4; s.eyes = win(t, 1.1, 2.0) ? "happy" : s.eyes; }
      if (move === "walk") { s.walk = t; s.walkAmt = 1; }
    }
    if (who === "you") {
      if (move === "idle") { s.look = Math.sin(t * 0.7) * 0.4; s.hop = Math.sin(t * 2.2) * 2; }
      if (move === "wave") { s.armR = 1.1 + 0.3 * Math.sin(t * 14); s.eyes = (t % 4) < 1.2 ? "happy" : s.eyes; }
      if (move === "surprise") { var a5 = sstep(0.2, 0.32, t % 3) * (1 - sstep(2.2, 2.6, t % 3)); s.eyes = a5 > 0.5 ? "wide" : s.eyes; s.hop = a5 * 20 * (1 - sstep(0.32, 0.7, t % 3)); s.armL = 0.1 + a5 * 0.9; s.armR = 0.1 + a5 * 0.9; }
      if (move === "happy") { var j5 = Math.sin(clamp(((t % 1.6) - 0.25) / 0.55, 0, 1) * Math.PI); s.hop = j5 * 40; s.squash = -j5 * 0.07; s.eyes = "happy"; s.armL = 0.3 + j5 * 1.1; s.armR = 0.3 + j5 * 1.1; }
      if (move === "look") { var k5 = sstep(0.2, 0.5, t); s.look = (opt.dir || 1) * k5; s.eyes = win(t, 1.1, 2.0) ? "happy" : s.eyes; }
      if (move === "walk") { s.walk = t; s.walkAmt = 1; }
    }
    return s;
  }

  window.EPS = { themes: themes, rig: rig, eye: eye, person: person, hatchFill: hatchFill, hatchSet: hatchSet, eniac: eniac, props2: props2, spreadsheet: spreadsheet, atm: atm, props3: props3, knight: knight, deepBlue: deepBlue, props4: props4, you: you, props5: props5, pose: pose };
})();
