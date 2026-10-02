/* =====================================================================
   series.js — quick hero scenes for Story-of-AI eps 2–5 (and shared ones), on the hatch kit (HATCH).
   Same contract as ep01.js: every scene paints the whole 9:16 frame from the time t, one big subject, one strong action,
   animated on twos. Real people are hatched silhouettes with NO face detail. No real logos.

   var K = HATCH.kit({ w: 1080, h: 1920, seed: 1946, theme: EPS.themes.ep2 });   // the episode's palette
   var S = SERIES.create(K);
   S.ep2.wiener(ctx, t, { mode: "walk" });
   Shared: S.figure(ctx, x, y, scale, opts) (a silhouette person, feet at y), S.globe, S.usMap.
   The year dial and calendar are EP01.create(K).calendar (pass this episode's K so it takes its colours).
   Options on every scene: { twos: true, cam: 1, cameraPush: true (steady push-in), pushRate: 0.1 (zoom per second) }. Event times (…At) are seconds from the scene start.
   ===================================================================== */
(function () {
  var H = window.HATCH, sstep = H.sstep, clamp = H.clamp, mix = H.mix, rgba = H.rgba, sparkle = H.sparkle;
  var TAU = Math.PI * 2;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
  function twos(t) { return Math.floor(t * 15 + 1e-6) / 15; }
  function backOut(u) { u = clamp(u, 0, 1); var s = 2.2; u -= 1; return 1 + u * u * ((s + 1) * u + s); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  var SKIN = ["#E3B48C", "#C98E64", "#F0C9A4", "#A86E4A"];

  function create(K) {
    var T = K.T, ink = T.ink, R = K.rr, DW = 1080, DH = 1920;
    var LAMP = "#FFE7A6", AMB = T.a1, CREAM = T.paper;
    function hs(hw, hh, o) {
      o = o || {};
      return { main: K.hatch(hw, hh, { angle: o.angle == null ? -0.98 : o.angle, spacing: o.spacing || 6.5, len: o.len || 22, gapMin: 8, gapMax: 34, jit: 0.07 }),
        cross: K.hatch(hw, hh, { angle: -2.3, spacing: (o.spacing || 6.5) * 1.1, len: 16, gapMin: 10, gapMax: 60, jit: 0.08, keep: function (x, y) { return x * 0.6 + y > R(-60, 160); } }) };
    }
    function hfill(c, h, fill, ol, o) {
      o = o || {};
      c.fillStyle = fill; c.fill();
      c.save(); c.clip(); c.lineCap = "round"; c.lineWidth = o.lw || 1.3;
      c.strokeStyle = rgba(mix(fill, ink, 0.6), o.ha == null ? 0.55 : o.ha); c.stroke(h.main); if (o.cross !== false) c.stroke(h.cross);
      c.restore();
      if (ol) { c.lineWidth = ol; c.strokeStyle = ink; c.stroke(); }
    }
    function glow(c, x, y, r, col, a) {
      if (a <= 0.003 || r <= 0) return;
      var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(0.35, rgba(col, 0.45)); g.addColorStop(1, rgba(col, 0));
      c.globalAlpha = a; c.fillStyle = g; circ(c, x, y, r); c.fill(); c.globalAlpha = 1;
    }
    function addGlow(c, x, y, r, col, a) { c.globalCompositeOperation = "lighter"; glow(c, x, y, r, col, a); c.globalCompositeOperation = "source-over"; }
    function zoomAt(c, z, x, y) { c.translate(x, y); c.scale(z, z); c.translate(-x, -y); }
    var BG = { stars: K.stars(140, 640, 1000), stars2: K.stars(50, 640, 1000), rain: K.rain(700, 1100), blobs: [K.blob(330, 230, "violet", 0.5), K.blob(280, 210, "tealD", 0.45), K.blob(300, 220, "magD", 0.4)] };
    function space(c, t, o) {
      o = o || {};
      c.fillStyle = T.canvas; c.fillRect(-200, -200, DW + 400, DH + 400);
      var g = c.createRadialGradient(DW / 2, DH * 0.45, 60, DW / 2, DH * 0.45, DH * 0.75); g.addColorStop(0, T.halo); g.addColorStop(1, rgba(T.canvas, 0)); c.fillStyle = g; c.fillRect(-200, -200, DW + 400, DH + 400);
      if (o.blobs !== false) { var bp = [[140, 330], [960, 820], [180, 1600]]; for (var i = 0; i < 3; i++) K.drawBlob(c, BG.blobs[i], bp[i][0] + Math.sin(t * 0.6 + i * 2) * 40 - t * 18, bp[i][1] + Math.cos(t * 0.5 + i) * 26, 1, undefined, o.blobA == null ? 0.7 : o.blobA); }
      c.save(); c.translate(DW / 2 - ((t * 60) % 120), DH / 2 + ((t * 140) % 280)); K.drawRain(c, BG.rain, 0.1); c.restore();
      c.save(); c.translate(DW / 2, DH / 2); K.drawStars(c, BG.stars, t, 40); K.drawStars(c, BG.stars2, t * 1.3, 110); c.restore();
    }
    // a warm room wall (for indoor scenes), with a slow drifting light pool
    var WALL = hs(700, 1100, { spacing: 9, len: 28 });
    function room(c, t, col, lightX, lightY) {
      c.fillStyle = col; c.fillRect(-200, -200, DW + 400, DH + 400);
      rr(c, -200, -200, DW + 400, DH + 400, 0); hfill(c, WALL, col, 0, { ha: 0.35, cross: false });
      addGlow(c, (lightX || 540) + Math.sin(t * 0.7) * 30, lightY || 700, 900, AMB, 0.22);
    }
    var NEED = []; for (var ni = 0; ni < 9; ni++) NEED.push({ x: R(60, 1020), y: R(140, 1780), s: R(10, 24), ph: R(0, 6.28), f: R(0.4, 0.9) });
    function needles(c, t, a) { for (var i = 0; i < NEED.length; i++) { var n = NEED[i], k = 0.55 + 0.45 * Math.sin(t * TAU * n.f + n.ph); sparkle(c, n.x - t * 12, n.y, n.s * k, n.s * 0.7 * k, T.light, 0.25 * (a == null ? 1 : a), rgba(T.light, 0.6)); } }
    function frame(c, t, o, body) {
      o = o || {};
      var tt = o.twos === false ? t : twos(t), W = c.canvas.width, Hh = c.canvas.height, s = Math.max(W / DW, Hh / DH) * (o.cam || 1);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.translate(W / 2, Hh / 2); c.scale(s, s); c.translate(-DW / 2, -DH / 2);
      c.lineJoin = "round"; c.lineCap = "round";
      if (o.cameraPush !== false) { var pz = 1 + (o.pushRate == null ? 0.1 : o.pushRate) * tt; c.translate(DW / 2, DH / 2); c.scale(pz, pz); c.translate(-DW / 2, -DH / 2); } // steady push-in (no shake)
      body(tt, o); c.restore();
    }
    function burst(c, x, y, t, a, col, n, len) { // rotating ray burst
      if (a <= 0) return; c.save(); c.translate(x, y); c.rotate(t * 0.6);
      for (var i = 0; i < (n || 14); i++) { c.rotate(TAU / (n || 14)); c.beginPath(); c.moveTo(120, -12); c.lineTo(len || 1000, -60); c.lineTo(len || 1000, 60); c.lineTo(120, 12); c.closePath(); c.fillStyle = rgba(i % 2 ? LAMP : (col || AMB), 0.2 * a); c.fill(); }
      c.restore();
    }
    function star(c, x, y, r, col, rot) { c.save(); c.translate(x, y); c.rotate(rot || 0); c.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = Math.max(3, r * 0.1); c.strokeStyle = ink; c.stroke(); c.restore(); }

    /* ---------------- the silhouette person (front view, feet at y; no face detail) ----------------
       o: { top, bottom, skirt, suit (lapels + tie), tie, skin, hair, hairStyle ("short"|"bald"|"rolls"|"bun"|"curly"|"long"|"grey"),
            glasses, beard, armL / armR: [upper, fore] (rad, 0 = hanging down, + = outward/up), walk (time), walkAmt, sit (hide legs), alpha } */
    var FG = { top: hs(110, 140, { spacing: 5.5, len: 14 }), low: hs(90, 110, { spacing: 6, len: 14 }), hair: hs(70, 60, { spacing: 4.5, len: 10 }) };
    function arm(c, sd, a, col, skin) {
      var up = a ? a[0] : 0.1, fo = a ? a[1] : 0.1, sx = sd * 62, sy = -268, L1 = 78, L2 = 72;
      var ex = sx + sd * Math.sin(up) * L1, ey = sy + Math.cos(up) * L1, ang2 = up + fo, hx = ex + sd * Math.sin(ang2) * L2, hy = ey + Math.cos(ang2) * L2;
      if (a && a.length > 2) { ex = sx + sd * 46; ey = sy + 96; hx = a[2]; hy = a[3]; } // [_, _, x, y]: elbow down, hand to a point (chin, forehead)
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.lineWidth = 36; c.strokeStyle = ink; c.stroke(); c.lineWidth = 26; c.strokeStyle = col; c.stroke();
      circ(c, hx, hy, 15); c.fillStyle = skin; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
      return [hx, hy];
    }
    function figure(c, x, y, s, o) {
      o = o || {};
      var top = o.top || T.a2, bot = o.bottom || mix(top, ink, 0.35), skin = o.skin || SKIN[0], hair = o.hair || "#3A2A1C", ph = (o.walk || 0) * TAU / 0.5, wa = o.walkAmt || 0;
      c.save(); c.translate(x, y); c.scale(s, s); if (o.alpha != null) c.globalAlpha = o.alpha;
      if (o.sit) c.translate(0, 120); // seated: hips drop behind the desk
      c.lineJoin = "round"; c.lineCap = "round";
      var hands = {};
      if (!o.sit) { // legs
        for (var sd = -1; sd <= 1; sd += 2) {
          c.save(); c.translate(sd * 24, -150); c.rotate(sd * Math.sin(ph) * 0.22 * wa);
          rr(c, -17, 0, 34, 148, 12); hfill(c, FG.low, o.skirt ? skin : bot, 5, { cross: false });
          rr(c, -22, 138, 44, 20, 8); c.fillStyle = ink; c.fill(); c.restore();
        }
        if (o.skirt) { c.beginPath(); c.moveTo(-50, -160); c.lineTo(50, -160); c.lineTo(66, -60); c.lineTo(-66, -60); c.closePath(); hfill(c, FG.low, bot, 6); }
      }
      var swing = Math.sin(ph) * 0.35 * wa;
      function arms() { hands.L = arm(c, -1, o.armL || [0.12 + swing, 0.1], top, skin); hands.R = arm(c, 1, o.armR || [0.12 - swing, 0.1], top, skin); }
      if (!o.armsFront) arms();
      // torso
      c.beginPath(); c.moveTo(-64, -282); c.quadraticCurveTo(0, -298, 64, -282); c.lineTo(52, -146); c.lineTo(-52, -146); c.closePath(); hfill(c, FG.top, top, 6);
      if (o.suit || o.tie) { c.beginPath(); c.moveTo(-26, -288); c.lineTo(0, -220); c.lineTo(26, -288); c.closePath(); c.fillStyle = "#F4EFE4"; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
        c.beginPath(); c.moveTo(-8, -270); c.lineTo(8, -270); c.lineTo(5, -228); c.lineTo(0, -218); c.lineTo(-5, -228); c.closePath(); c.fillStyle = o.tieCol || T.a3; c.fill(); c.lineWidth = 3; c.stroke(); }
      if (o.suit) { c.beginPath(); c.moveTo(-30, -288); c.lineTo(-6, -200); c.moveTo(30, -288); c.lineTo(6, -200); c.lineWidth = 5; c.strokeStyle = ink; c.stroke(); }
      if (!o.suit && !o.tie) { c.beginPath(); c.moveTo(-24, -288); c.lineTo(0, -262); c.lineTo(24, -288); c.lineWidth = 9; c.strokeStyle = "#F4EFE4"; c.stroke(); }
      if (o.badge) { var bk = o.badge; star(c, 34, -240, 26 * bk, AMB, 0.2); }
      if (o.armsFront) arms(); // hands on the chin / forehead sit over the body
      // neck + head (blank: no face detail)
      rr(c, -14, -312, 28, 30, 6); c.fillStyle = skin; c.fill();
      c.save(); c.translate(0, -352 + (o.headY || 0)); c.rotate(o.headTilt || 0);
      c.beginPath(); c.ellipse(0, 0, 44, 52, 0, 0, TAU); c.fillStyle = skin; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
      var hs2 = o.hairStyle || "short", hc = hs2 === "grey" ? "#C9C6C0" : hair;
      c.beginPath();
      if (hs2 === "bald" || hs2 === "grey") { c.moveTo(-46, 4); c.quadraticCurveTo(-50, -26, -34, -34); c.lineTo(-30, -6); c.closePath(); c.moveTo(46, 4); c.quadraticCurveTo(50, -26, 34, -34); c.lineTo(30, -6); c.closePath(); if (hs2 === "grey") { c.moveTo(-34, -36); c.quadraticCurveTo(0, -66, 34, -36); c.quadraticCurveTo(0, -48, -34, -36); } }
      else if (hs2 === "curly") { for (var cu = 0; cu < 7; cu++) { var ca = Math.PI * (1.0 + cu / 6), cx2 = Math.cos(ca) * 44, cy2 = Math.sin(ca) * 50 - 2; c.moveTo(cx2 + 16, cy2); c.arc(cx2, cy2, 16, 0, TAU); } }
      else { c.arc(0, -6, 47, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(24, -26, 0, -22); c.quadraticCurveTo(-26, -26, -46, -2); }
      c.closePath(); hfill(c, FG.hair, hc, 5);
      if (hs2 === "rolls") { circ(c, -22, -50, 15); hfill(c, FG.hair, hc, 4); circ(c, 22, -50, 15); hfill(c, FG.hair, hc, 4); c.beginPath(); c.moveTo(-46, 6); c.quadraticCurveTo(-60, 46, -30, 44); c.moveTo(46, 6); c.quadraticCurveTo(60, 46, 30, 44); c.lineWidth = 14; c.strokeStyle = hc; c.stroke(); }
      if (hs2 === "bun") { circ(c, 0, -60, 20); hfill(c, FG.hair, hc, 4); }
      if (hs2 === "long") { c.beginPath(); c.moveTo(-44, -4); c.quadraticCurveTo(-58, 50, -40, 80); c.lineTo(-24, 40); c.moveTo(44, -4); c.quadraticCurveTo(58, 50, 40, 80); c.lineTo(24, 40); c.lineWidth = 16; c.strokeStyle = hc; c.stroke(); }
      if (o.beard) { c.beginPath(); c.moveTo(-40, 14); c.quadraticCurveTo(-30, 66, 0, 66); c.quadraticCurveTo(30, 66, 40, 14); c.quadraticCurveTo(0, 30, -40, 14); c.closePath(); c.fillStyle = o.beardCol || hc; c.fill(); c.lineWidth = 3; c.strokeStyle = ink; c.stroke(); }
      if (o.glasses) { c.beginPath(); c.arc(-17, 0, 14, 0, TAU); c.moveTo(31, 0); c.arc(17, 0, 14, 0, TAU); c.moveTo(-3, 0); c.lineTo(3, 0); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); }
      c.restore();
      c.restore(); c.globalAlpha = 1;
      var oy = o.sit ? 120 : 0;
      return { L: [x + hands.L[0] * s, y + (hands.L[1] + oy) * s], R: [x + hands.R[0] * s, y + (hands.R[1] + oy) * s] };
    }
    // a desk in front of a seated figure (front view), with optional prop
    var DK = hs(260, 80, { spacing: 6 }), PROP = hs(120, 90, { spacing: 5, len: 12 });
    function desk(c, x, y, s, prop, t, i, on) {
      c.save(); c.translate(x, y); c.scale(s, s);
      if (prop === "screen") { rr(c, -90, -180, 180, 130, 12); c.fillStyle = "#D8CDB2"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); rr(c, -74, -166, 148, 98, 6); c.fillStyle = mix("#0E2A1A", T.a1, 0.25 * (on == null ? 1 : on)); c.fill();
        c.beginPath(); for (var g = 1; g < 4; g++) { c.moveTo(-74 + g * 37, -166); c.lineTo(-74 + g * 37, -68); } for (g = 1; g < 4; g++) { c.moveTo(-74, -166 + g * 24.5); c.lineTo(74, -166 + g * 24.5); } c.lineWidth = 2; c.strokeStyle = rgba(T.a1, 0.7 * (on == null ? 1 : on)); c.stroke(); }
      rr(c, -200, -50, 400, 70, 10); hfill(c, DK, "#8A5A32", 6);
      if (prop === "ledger") { c.beginPath(); c.moveTo(0, -46); c.lineTo(-120, -60); c.lineTo(-120, -20); c.lineTo(0, -10); c.lineTo(120, -20); c.lineTo(120, -60); c.closePath(); hfill(c, PROP, CREAM, 4, { ha: 0.2, cross: false }); c.beginPath(); for (var l = 0; l < 3; l++) { c.moveTo(-100, -50 + l * 10); c.lineTo(-20, -42 + l * 10); c.moveTo(20, -42 + l * 10); c.lineTo(100, -50 + l * 10); } c.lineWidth = 2; c.strokeStyle = rgba(ink, 0.4); c.stroke(); }
      if (prop === "paper") { rr(c, -70, -62, 140, 30, 4); c.fillStyle = CREAM; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); }
      c.restore();
    }

    /* ---------------- shared: globe (filled with dots) and US map ---------------- */
    var GLB = hs(420, 420, { spacing: 7 });
    var CONT = [ // rough continents on the globe (lon, lat)
      [[-125, 48], [-95, 49], [-70, 45], [-80, 25], [-97, 18], [-117, 32]], [[-80, 10], [-50, 0], [-35, -8], [-55, -35], [-70, -50], [-75, -15]],
      [[-10, 36], [10, 44], [30, 46], [40, 55], [30, 70], [5, 60], [-8, 44]], [[-15, 15], [10, 5], [40, 10], [50, 12], [35, -30], [20, -35], [10, -5], [-15, 10]],
      [[40, 55], [80, 70], [140, 60], [140, 40], [120, 22], [100, 10], [75, 8], [60, 25], [45, 40]], [[115, -20], [150, -25], [145, -38], [118, -34]]];
    function globe(c, x, y, r, t, o) { // o: { spin, dots 0..1 (users flooding in), dotCol, avatars }
      o = o || {}; var rot = t * (o.spin || 0.5);
      addGlow(c, x, y, r * 1.6, T.a4, 0.35);
      circ(c, x, y, r); c.save(); c.translate(x, y); hfill(c, GLB, mix(T.a2, T.canvas, 0.2), 8); c.restore();
      c.save(); circ(c, x, y, r); c.clip();
      function P(lon, lat) { var la = lat * Math.PI / 180, lo = lon * Math.PI / 180 + rot; return [x + r * Math.cos(la) * Math.sin(lo), y - r * Math.sin(la), Math.cos(la) * Math.cos(lo)]; }
      CONT.forEach(function (poly) { c.beginPath(); var vis = 0; for (var i = 0; i <= 24 * poly.length; i++) { var k = i / 24, a = poly[Math.floor(k) % poly.length], b = poly[(Math.floor(k) + 1) % poly.length], u = k - Math.floor(k), p = P(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u); if (p[2] < 0) { p = [x + (p[0] - x) * 1, p[1]]; } if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); if (P(a[0], a[1])[2] > 0) vis++; }
        c.closePath(); if (vis > 0) { c.fillStyle = rgba(T.a6, 0.85); c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke(); } });
      // meridians
      for (var m = 0; m < 6; m++) { var lo = m / 6 * Math.PI + rot % (Math.PI / 6); c.beginPath(); c.ellipse(x, y, Math.abs(Math.sin(lo)) * r, r, 0, 0, TAU); c.lineWidth = 2; c.strokeStyle = rgba(T.light, 0.2); c.stroke(); }
      var nd = Math.floor((o.dots == null ? 1 : o.dots) * 260);
      for (var d = 0; d < nd; d++) { var p2 = P(hash(d) * 360 - 180, hash(d + 99) * 140 - 60); if (p2[2] <= 0) continue; var pop = 1; circ(c, p2[0], p2[1], 7 + 3 * Math.sin(t * 6 + d)); c.fillStyle = [AMB, T.a3, T.a5, LAMP][d % 4]; c.fill(); c.lineWidth = 2; c.strokeStyle = ink; c.stroke(); }
      c.restore();
      circ(c, x, y, r); c.lineWidth = 9; c.strokeStyle = ink; c.stroke();
      c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.6, Math.PI * 1.05, Math.PI * 1.45); c.lineWidth = 12; c.strokeStyle = rgba("#ffffff", 0.3); c.stroke();
    }
    var USP = [[-124.5, 48.5], [-123, 46], [-124, 42], [-120.5, 34.5], [-117, 32.5], [-111, 31.3], [-106.5, 31.8], [-104.5, 29.6], [-101.5, 29.8], [-97.4, 26], [-97.3, 27.8], [-93.8, 29.7], [-89.6, 29.3], [-85, 29.7], [-82.8, 28], [-81, 25.2], [-80, 26.8], [-81.4, 30.7], [-75.5, 35.5], [-76, 38.5], [-74, 40.5], [-70, 41.6], [-70.7, 43], [-67, 44.8], [-69, 47.3], [-71.5, 45], [-75, 45], [-79, 43.4], [-83.3, 46], [-88.4, 48.3], [-95.2, 49], [-123, 49]];
    function usProj(p) { return [540 + (p[0] + 96) * 15.5, 960 - (p[1] - 38) * 20]; }
    var US = new Path2D(); USP.forEach(function (p, i) { var q = usProj(p); if (i) US.lineTo(q[0], q[1]); else US.moveTo(q[0], q[1]); }); US.closePath();
    var USH = hs(560, 400, { spacing: 7 });
    var USDOTS = []; for (var ud = 0; ud < 60; ud++) { var tries = 0, q; do { q = usProj([-122 + R(0, 52), 27 + R(0, 21)]); tries++; } while (tries < 30 && !isIn(q)); USDOTS.push(q); }
    function isIn(q) { var inside = false, pts = USP.map(usProj); for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) { var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if (((yi > q[1]) !== (yj > q[1])) && (q[0] < (xj - xi) * (q[1] - yi) / (yj - yi) + xi)) inside = !inside; } return inside; }
    function usMap(c, t, o) { // o: { dotsAt (dots light up), popAt (little branches pop up), dotCol }
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.5 });
        if (o.push !== false) zoomAt(c, 1 + 0.08 * t, 540, 960);
        c.save(); c.translate(14, 18); c.fillStyle = rgba(ink, 0.5); c.fill(US); c.restore();
        c.fillStyle = mix(T.a2, T.paper, 0.35); c.fill(US); c.save(); c.clip(US); c.translate(540, 960); c.lineWidth = 1.4; c.strokeStyle = rgba(ink, 0.35); c.stroke(USH.main); c.restore();
        c.lineWidth = 8; c.strokeStyle = ink; c.stroke(US);
        var da = o.dotsAt == null ? 0.1 : o.dotsAt, pa = o.popAt;
        for (var i = 0; i < USDOTS.length; i++) {
          var q = USDOTS[i], on = sstep(0, 0.08, t - da - hash(i) * 1.2);
          if (on > 0) { circ(c, q[0], q[1], 10 * on + 2); c.fillStyle = o.dotCol || AMB; c.fill(); c.lineWidth = 3; c.strokeStyle = ink; c.stroke(); addGlow(c, q[0], q[1], 60, o.dotCol || AMB, 0.4 * on * (0.7 + 0.3 * Math.sin(t * 8 + i))); }
          if (pa != null && i % 4 === 0) { var pu = clamp((t - pa - hash(i + 5) * 0.8) / 0.25, 0, 1); if (pu > 0) branch(c, q[0], q[1] - 6, backOut(pu) * 0.55); }
        }
      });
    }
    var BR = hs(120, 120, { spacing: 5, len: 12 });
    function branch(c, x, y, s, col) { // a little bank branch (no text, no logo)
      c.save(); c.translate(x, y); c.scale(s, s);
      c.beginPath(); c.moveTo(-90, -100); c.lineTo(0, -150); c.lineTo(90, -100); c.closePath(); hfill(c, BR, col || CREAM, 6, { cross: false });
      rr(c, -80, -100, 160, 100, 4); hfill(c, BR, col || CREAM, 6, { ha: 0.3, cross: false });
      c.beginPath(); for (var k = -1; k <= 1; k++) { c.moveTo(k * 46, -92); c.lineTo(k * 46, -8); } c.lineWidth = 12; c.strokeStyle = ink; c.stroke(); c.lineWidth = 7; c.strokeStyle = "#F4EFE4"; c.stroke();
      rr(c, -94, -10, 188, 16, 4); c.fillStyle = T.a5; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
      c.restore();
    }

    /* ======================= EP 2 ======================= */
    var ep2 = {};
    // Wiener: round glasses, 1918 suit, bald top + beard; mode "walk" (walks toward us) | "sit" (at a desk, writing)
    ep2.wiener = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        var who = { suit: true, top: "#4A4F5E", bottom: "#3A3E4A", hairStyle: "bald", hair: "#2A221C", glasses: true, beard: true, beardCol: "#3A2E26", tieCol: T.a3 };
        if (o.mode === "sit") {
          room(c, t, mix(T.canvas, T.a2, 0.3), 640, 760);
          var wr = Math.sin(t * 22) * 0.12; who.sit = true; who.armR = [0.3 + wr * 0.2, -1.4 + wr]; who.armL = [0.3, -1.3]; who.headTilt = 0.08 + Math.sin(t * 1.6) * 0.04;
          figure(c, 540, 1300, 2.0, who); desk(c, 540, 1300, 2.2, "paper", t);
          for (var p = 0; p < 4; p++) { var pu = (t * 0.8 + p / 4) % 1; c.save(); c.translate(380 + p * 110, 1200 - pu * 500); c.rotate(pu * 3 + p); c.font = "800 70px Georgia, serif"; c.fillStyle = rgba(LAMP, 0.8 * Math.sin(pu * Math.PI)); c.textAlign = "center"; c.fillText(["∫", "π", "Σ", "√"][p], 0, 0); c.restore(); }
          return;
        }
        // walking toward us along a corridor of light, growing
        room(c, t, mix(T.canvas, T.a2, 0.2), 540, 900);
        c.beginPath(); c.moveTo(380, 760); c.lineTo(700, 760); c.lineTo(1200, 2000); c.lineTo(-120, 2000); c.closePath(); c.fillStyle = rgba(LAMP, 0.12); c.fill();
        var k = (t * 0.25) % 1, sc = 2.0 + k * 1.0;
        who.walk = t; who.walkAmt = 1;
        c.fillStyle = rgba(ink, 0.35); c.beginPath(); c.ellipse(540, 1500 + k * 200, 140 * sc / 1.4, 18, 0, 0, TAU); c.fill();
        figure(c, 540, 1500 + k * 200 - Math.abs(Math.sin(t * TAU / 0.5)) * 10, sc, who);
      });
    };
    // trajectory: dotted arc drawn on blueprint, hand-written numbers, X target stamps (no gun, no shell)
    var BP = hs(700, 1100, { spacing: 10, len: 30 });
    ep2.trajectory = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        var dur = o.dur || 1.6;
        c.fillStyle = "#1E4E7A"; c.fillRect(-200, -200, 1480, 2320); rr(c, -200, -200, 1480, 2320, 0); hfill(c, BP, "#1E4E7A", 0, { ha: 0.3, cross: false });
        c.beginPath(); for (var g = -200; g < 1300; g += 60) { c.moveTo(g, -200); c.lineTo(g, 2120); } for (g = -200; g < 2120; g += 60) { c.moveTo(-200, g); c.lineTo(1280, g); } c.lineWidth = 1.5; c.strokeStyle = rgba("#CFE6FF", 0.18); c.stroke();
        zoomAt(c, 1 + 0.05 * t, 540, 960);
        var x0 = 140, y0 = 1500, x1 = 900, y1 = 1400, top = 520, u = clamp(t / dur, 0, 1);
        function pt(k) { return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - 4 * (y0 - top) * k * (1 - k)]; }
        c.beginPath(); c.moveTo(80, 1520); c.lineTo(1000, 1520); c.lineWidth = 5; c.strokeStyle = rgba("#F4EFE4", 0.8); c.stroke();
        for (var i = 0; i <= 40; i++) { var k = i / 40; if (k > u) break; var p = pt(k); circ(c, p[0], p[1], 9); c.fillStyle = "#F4EFE4"; c.fill(); }
        var hp = pt(u); addGlow(c, hp[0], hp[1], 120, LAMP, 0.6 * (1 - sstep(dur - 0.1, dur, t)));
        // numbers written along the arc
        c.font = "italic 700 64px Georgia, serif"; c.fillStyle = rgba("#F4EFE4", 0.85); c.textAlign = "center";
        [[0.15, "37°"], [0.5, "1.2 km"], [0.8, "4.6 s"]].forEach(function (n, j) { if (u > n[0]) { var p3 = pt(n[0]); c.globalAlpha = sstep(n[0], n[0] + 0.1, u); c.fillText(n[1], p3[0] + (j === 1 ? 0 : 60), p3[1] - 50); c.globalAlpha = 1; } });
        // X target stamps at the end
        var xs = backOut((t - dur) / 0.2) * (t > dur ? 1 : 0);
        if (xs > 0) { c.save(); c.translate(x1, y1); c.scale(xs, xs); c.beginPath(); c.moveTo(-60, -60); c.lineTo(60, 60); c.moveTo(60, -60); c.lineTo(-60, 60); c.lineWidth = 26; c.strokeStyle = ink; c.stroke(); c.lineWidth = 16; c.strokeStyle = T.a3; c.stroke(); c.beginPath(); c.arc(0, 0, 90, 0, TAU); c.lineWidth = 6; c.strokeStyle = rgba("#F4EFE4", 0.8); c.stroke(); c.restore(); }
        // compass + ruler
        c.save(); c.translate(820, 360); c.rotate(Math.sin(t * 2) * 0.05); c.beginPath(); c.moveTo(0, 0); c.lineTo(-60, 220); c.moveTo(0, 0); c.lineTo(60, 220); c.lineWidth = 12; c.strokeStyle = ink; c.stroke(); c.lineWidth = 6; c.strokeStyle = "#C9C3B0"; c.stroke(); circ(c, 0, 0, 18); c.fillStyle = T.a1; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); c.restore();
      });
    };
    // university building (columns, pediment, steps), windows light up in a wave
    var UV = hs(560, 500, { spacing: 7 });
    function university(c, t, o, bodyCol) {
      space(c, t, { blobA: 0.5 });
      if (o.push !== false) zoomAt(c, 1 + 0.08 * t, 540, 1000);
      var la = o.lightsAt == null ? 0.1 : o.lightsAt;
      c.save(); c.translate(540, 1150);
      c.beginPath(); c.moveTo(-760, 380); c.quadraticCurveTo(0, 330, 760, 380); c.lineTo(760, 1000); c.lineTo(-760, 1000); c.closePath(); hfill(c, UV, mix(T.a6, T.canvas, 0.4), 6);
      rr(c, -480, -300, 960, 600, 4); hfill(c, UV, bodyCol || "#D8CDB2", 7, { ha: 0.35 });
      c.beginPath(); c.moveTo(-520, -300); c.lineTo(0, -560); c.lineTo(520, -300); c.closePath(); hfill(c, UV, mix(bodyCol || "#D8CDB2", ink, 0.15), 7);
      circ(c, 0, -390, 50); c.fillStyle = mix(T.canvas, LAMP, 0.6 + 0.4 * Math.sin(t * 3)); c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
      for (var w = 0; w < 8; w++) { var wx = -430 + w * 122, row = 0; for (row = 0; row < 2; row++) { var on = sstep(0, 0.1, t - la - (w + row * 8) * 0.06); rr(c, wx, -230 + row * 220, 70, 150, [35, 35, 4, 4]); c.fillStyle = mix("#1C2133", LAMP, on); c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); if (on > 0) addGlow(c, wx + 35, -155 + row * 220, 160, AMB, 0.35 * on); } }
      for (var cI = 0; cI < 6; cI++) { rr(c, -440 + cI * 168, -300, 44, 600, 6); hfill(c, UV, "#F4EFE4", 5, { ha: 0.25, cross: false }); }
      for (var s = 0; s < 3; s++) { rr(c, -520 - s * 30, 300 + s * 26, 1040 + s * 60, 28, 4); hfill(c, UV, "#C9C3B0", 5, { cross: false }); }
      c.restore(); needles(c, t, 0.7);
    }
    ep2.university = function (c, t, o) { frame(c, t, o, function (t, o) { university(c, t, o); }); };
    // a desk room of women computers: rows fill (fillAt), pencils move, and switch off row by row (offAt)
    function deskRows(c, t, o, look) {
      var rows = 4, cols = 3, fa = o.fillAt == null ? 0 : o.fillAt, off = o.offAt;
      for (var r = 0; r < rows; r++) {
        var k = [0.48, 0.62, 0.8, 1.05][r], y = 760 + [0, 250, 560, 960][r], dead = off == null ? 0 : sstep(0, 0.12, t - off - (rows - 1 - r) * 0.3);
        var lamp = 1 - dead;
        addGlow(c, 540, y - 260 * k, 520 * k + 200, AMB, 0.25 * lamp);
        for (var cI = 0; cI < cols; cI++) {
          var i = r * cols + cI, x = 540 + (cI - 1) * 360 * k * 1.15, ta = fa + i * 0.12, u = (t - ta) / 0.3;
          if (u > 0 && dead < 1) {
            var pop = backOut(u), wr = Math.sin(t * 20 + i) * 0.15, flick = dead > 0 ? (Math.sin(t * 60 + i) > 0 ? 0.3 : 1) * (1 - dead) : 1;
            var who = look(i); who.sit = true; who.armR = who.armR || [0.3 + wr * 0.2, -1.4 + wr]; who.armL = who.armL || [0.3, -1.3]; who.alpha = flick;
            figure(c, x, y + (1 - pop) * 120 * k, 1.05 * k * clamp(pop, 0, 1.1), who);
          }
          desk(c, x, y, 1.1 * k, o.prop || "paper", t, i, 1 - dead);
        }
      }
    }
    ep2.computers = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        room(c, t, mix(T.canvas, T.a2, 0.25), 540, 600);
        if (o.push !== false) zoomAt(c, 1 + 0.05 * t, 540, 900);
        deskRows(c, t, o, function (i) { return { top: [T.a2, T.a3, T.a6, T.a5][i % 4], hairStyle: i % 3 ? "rolls" : "bun", hair: ["#3A2A1C", "#6B4426", "#1C1A22"][i % 3], skin: SKIN[i % 4], skirt: true }; });
      });
    };
    // ENIAC switch-on: a wall of panel columns lights bottom-up, cable arms with sparks running along them
    var EN = hs(140, 900, { spacing: 7 });
    ep2.eniacOn = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        var on0 = o.onAt == null ? 0.2 : o.onAt;
        c.fillStyle = "#151B24"; c.fillRect(-200, -200, 1480, 2320);
        if (o.push !== false) zoomAt(c, 1 + 0.05 * t, 540, 960);
        for (var col = 0; col < 4; col++) {
          var x = 40 + col * 255;
          rr(c, x, 120, 235, 1700, 14); hfill(c, EN, "#C9BC98", 7, { ha: 0.4 });
          for (var b = 0; b < 12; b++) for (var bb = 0; bb < 3; bb++) {
            var by = 1720 - b * 130, bx = x + 50 + bb * 68, on = sstep(0, 0.06, t - on0 - col * 0.12 - b * 0.05) * (0.75 + 0.25 * Math.sin(t * (9 + bb) + b + col));
            circ(c, bx, by, 22); c.fillStyle = mix("#5A4A2A", LAMP, on); c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
            if (on > 0.5 && (b + bb + col) % 3 === 0) addGlow(c, bx, by, 80, AMB, 0.4 * on);
          }
        }
        // cables in front, sparks travel along
        var cabs = [[120, 300, 960, 700], [80, 1200, 1000, 900], [200, 1600, 900, 1350]];
        cabs.forEach(function (cb, j) {
          var p = new Path2D(); p.moveTo(cb[0], cb[1]); p.bezierCurveTo(cb[0] + 300, cb[1] + 300, cb[2] - 300, cb[3] + 300, cb[2], cb[3]);
          c.lineWidth = 30; c.strokeStyle = ink; c.stroke(p); c.lineWidth = 20; c.strokeStyle = [T.a1, T.a3, T.a4][j]; c.stroke(p);
          if (t > on0) { c.setLineDash([10, 120]); c.lineDashOffset = -t * 900 - j * 40; c.lineWidth = 16; c.strokeStyle = LAMP; c.stroke(p); c.setLineDash([]); }
          var su = ((t - on0) * 1.6 + j * 0.3) % 1; if (t > on0) { var sx = (1 - su) * (1 - su) * (1 - su) * cb[0] + 3 * (1 - su) * (1 - su) * su * (cb[0] + 300) + 3 * (1 - su) * su * su * (cb[2] - 300) + su * su * su * cb[2], sy = (1 - su) * (1 - su) * (1 - su) * cb[1] + 3 * (1 - su) * (1 - su) * su * (cb[1] + 300) + 3 * (1 - su) * su * su * (cb[3] + 300) + su * su * su * cb[3]; addGlow(c, sx, sy, 120, LAMP, 0.8); sparkle(c, sx, sy, 50, 34, "#FFFBEA", 0.4, rgba(LAMP, 0.9)); }
        });
        var fl = sstep(on0, on0 + 0.05, t) * (1 - sstep(on0 + 0.1, on0 + 0.5, t)); if (fl > 0) { c.fillStyle = rgba(LAMP, 0.35 * fl); c.fillRect(-200, -200, 1480, 2320); }
      });
    };
    // six programmers in a row step forward into a spotlight and get star badges (stepAt, gap)
    ep2.programmers = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.4 });
        var sa = o.stepAt == null ? 0.2 : o.stepAt, gap = o.gap || 0.25;
        c.beginPath(); c.moveTo(-200, 1500); c.lineTo(1280, 1500); c.lineWidth = 5; c.strokeStyle = rgba(T.light, 0.4); c.stroke();
        for (var i = 0; i < 6; i++) {
          var u = clamp((t - sa - i * gap) / 0.3, 0, 1), x = 100 + i * 176, fwd = backOut(u);
          if (u > 0) { c.beginPath(); c.moveTo(x - 30, -200); c.lineTo(x + 30, -200); c.lineTo(x + 150, 1560); c.lineTo(x - 150, 1560); c.closePath(); c.fillStyle = rgba(LAMP, 0.16 * clamp(u * 2, 0, 1)); c.fill(); addGlow(c, x, 1560, 220, LAMP, 0.4 * u); }
          var badge = sstep(0.6, 1, u) * backOut(clamp((t - sa - i * gap - 0.3) / 0.2, 0, 1));
          figure(c, x, 1500 + fwd * 120, 1.2 + fwd * 0.2, { top: [T.a2, T.a3, T.a6, T.a5, T.a4, T.a1][i], skirt: true, hairStyle: ["rolls", "bun", "short", "rolls", "long", "bun"][i], hair: ["#3A2A1C", "#6B4426", "#1C1A22", "#8A5A2E"][i % 4], skin: SKIN[i % 4], badge: badge, armR: u > 0.8 ? [0.3 + 0.1 * Math.sin(t * 6 + i), 0.3] : null });
          if (badge > 0.5 && badge < 1.05) sparkle(c, x + 40 * (1.2 + fwd * 0.2), 1500 + fwd * 120 - 240 * (1.2 + fwd * 0.2), 50 * badge, 34 * badge, "#FFFBEA", 0.4, rgba(LAMP, 0.9));
        }
      });
    };


    /* ======================= EP 3 ======================= */
    var ep3 = {}, BEIGE = "#D8CDB2", GREEN = "#57D68D";
    var PC = hs(420, 420, { spacing: 6 });
    // a beige 1980s computer, green screen switches on at onAt (line → glow → rows + cursor)
    ep3.pc = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        var oa = o.onAt == null ? 0.3 : o.onAt, u = t - oa;
        room(c, t, mix(T.canvas, T.a2, 0.25), 540, 800);
        if (o.push !== false) zoomAt(c, 1 + 0.06 * t, 540, 820);
        rr(c, 120, 1240, 840, 240, 20); hfill(c, PC, BEIGE, 7); // base unit
        rr(c, 560, 1300, 340, 40, 8); c.fillStyle = "#3A3A30"; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke(); // floppy slot
        circ(c, 220, 1400, 16); c.fillStyle = u > 0 ? "#57D68D" : "#2A3A2A"; c.fill(); c.lineWidth = 4; c.stroke(); if (u > 0) addGlow(c, 220, 1400, 60, GREEN, 0.6);
        rr(c, 160, 440, 760, 760, 50); hfill(c, PC, BEIGE, 8); // monitor
        rr(c, 230, 510, 620, 520, 40); c.fillStyle = "#0B1A12"; c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
        c.save(); rr(c, 230, 510, 620, 520, 40); c.clip();
        if (u > 0) {
          var line = sstep(0, 0.12, u), open = sstep(0.1, 0.3, u);
          c.fillStyle = rgba(GREEN, 0.9 * (1 - open) * line); c.fillRect(540 - 300 * line, 768, 600 * line, 6);
          if (open > 0) {
            c.fillStyle = rgba(GREEN, 0.12 * open); c.fillRect(230, 770 - 260 * open, 620, 520 * open);
            var rows = Math.floor(clamp((u - 0.3) / 0.08, 0, 12));
            for (var r = 0; r < rows; r++) { var w = 120 + hash(r) * 380; c.fillStyle = rgba(GREEN, 0.85); c.fillRect(270, 545 + r * 38, w, 18); }
            if (Math.floor(t * 4) % 2) { c.fillStyle = GREEN; c.fillRect(270 + (rows ? 0 : 0), 545 + rows * 38, 22, 24); }
            c.globalAlpha = 0.15; for (var sl = 510; sl < 1030; sl += 8) { c.fillStyle = "#000"; c.fillRect(230, sl, 620, 3); } c.globalAlpha = 1;
          }
        }
        c.restore();
        if (u > 0) addGlow(c, 540, 770, 600, GREEN, 0.3 * sstep(0.1, 0.4, u));
        c.beginPath(); c.arc(330, 620, 140, Math.PI * 1.05, Math.PI * 1.4); c.lineWidth = 12; c.strokeStyle = rgba("#ffffff", 0.18); c.stroke();
        rr(c, 140, 1560, 800, 140, 18); hfill(c, PC, mix(BEIGE, ink, 0.08), 7); // keyboard
        for (var k = 0; k < 24; k++) { var kx = 180 + (k % 12) * 62, ky = 1585 + Math.floor(k / 12) * 56, dn = Math.floor(t * 8) % 24 === k && u > 0.4 ? 6 : 0; rr(c, kx, ky + dn, 50, 42, 8); c.fillStyle = "#EFE5CC"; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); }
      });
    };
    ep3.usMap = usMap; // dots light (dotsAt), branches pop (popAt)
    // clerks with ledger books (rows blink out with offAt); accountants with spreadsheet screens + a growing chart bar
    ep3.clerks = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        room(c, t, mix(T.canvas, T.a2, 0.3), 540, 600);
        if (o.push !== false) zoomAt(c, 1 + 0.05 * t, 540, 900);
        o.prop = "ledger";
        deskRows(c, t, o, function (i) { return { top: [T.a5, T.a2, T.a3, "#6B5A48"][i % 4], tie: true, tieCol: T.a3, hairStyle: ["short", "bald", "short", "bun"][i % 4], hair: ["#3A2A1C", "#6B4426", "#1C1A22"][i % 3], skin: SKIN[i % 4], glasses: i % 3 === 0 }; });
      });
    };
    ep3.accountants = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        room(c, t, mix(T.canvas, T.a2, 0.2), 540, 500);
        // big bar chart on the wall grows
        var ga = o.growAt == null ? 0.2 : o.growAt;
        for (var b = 0; b < 5; b++) { var h = (160 + b * 110) * sstep(0, 0.4, t - ga - b * 0.12) * (1 + 0.04 * Math.sin(t * 4 + b)); rr(c, 200 + b * 150, 700 - h, 110, h, 8); hfill(c, PC, b === 4 ? GREEN : mix(GREEN, T.canvas, 0.35), 6); }
        c.beginPath(); c.moveTo(160, 700); c.lineTo(960, 700); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
        var au = sstep(0, 0.4, t - ga - 0.6); if (au > 0) { c.beginPath(); c.moveTo(220, 600); c.lineTo(220 + 700 * au, 600 - 520 * au); c.lineWidth = 14; c.strokeStyle = ink; c.stroke(); c.lineWidth = 8; c.strokeStyle = T.a1; c.stroke(); }
        o.prop = "screen";
        c.save(); c.translate(0, 260); c.scale(1, 1); deskRows(c, t, Object.assign({}, o, { offAt: null }), function (i) { return { top: [T.a4, T.a6, T.a5, T.a3][i % 4], tie: i % 2 === 0, hairStyle: ["short", "long", "short", "bun"][i % 4], hair: ["#3A2A1C", "#6B4426", "#1C1A22"][i % 3], skin: SKIN[(i + 1) % 4], armR: [0.25, -1.2 + Math.sin(t * 16 + i) * 0.2] }; }); c.restore();
      });
    };
    // bank teller behind a counter: fades (fadeAt), splits into copies (splitAt) that stack up
    ep3.teller = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        var fa = o.fadeAt == null ? 0.5 : o.fadeAt, sa = o.splitAt == null ? 1.0 : o.splitAt;
        room(c, t, mix(T.canvas, T.a6, 0.15), 540, 700);
        var fade = 1 - 0.55 * sstep(fa, fa + 0.3, t), sp = sstep(sa, sa + 0.3, t), st = sstep(sa + 0.3, sa + 0.7, t);
        var who = { top: T.a2, tie: true, tieCol: T.a1, hairStyle: "short", hair: "#3A2A1C", sit: true, armR: [0.3, -1.2], armL: [0.3, -1.2] };
        if (sp <= 0) figure(c, 540, 1240, 2.0, Object.assign({ alpha: fade }, who));
        else for (var k = -2; k <= 2; k++) { // copies spread out, then fly up into a stack
          var x = 540 + k * 220 * sp * (1 - st), y = 1240 - st * (k + 2) * 170, s = 2.0 - 0.9 * sp;
          figure(c, x, y, s, Object.assign({ alpha: fade * (0.6 + 0.4 * st) }, who));
        }
        // counter + glass with a grille
        rr(c, -200, 1240, 1480, 700, 0); hfill(c, PC, "#6E4B2A", 8);
        rr(c, 60, 1200, 960, 60, 10); hfill(c, PC, "#8A5A32", 7);
        c.beginPath(); for (var g = 0; g < 7; g++) { c.moveTo(100 + g * 147, 300); c.lineTo(100 + g * 147, 1200); } c.lineWidth = 10; c.strokeStyle = rgba(ink, 0.6); c.stroke(); c.lineWidth = 5; c.strokeStyle = rgba(T.a1, 0.7); c.stroke();
        rr(c, 80, 300, 920, 40, 8); c.fillStyle = T.a1; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
        c.fillStyle = rgba("#BFE3FF", 0.06); c.fillRect(80, 340, 920, 860);
      });
    };
    // a little bank branch with a swinging price tag (o.tagAt drops it in)
    ep3.branch = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.5 });
        if (o.push !== false) zoomAt(c, 1 + 0.06 * t, 540, 1000);
        c.beginPath(); c.moveTo(-200, 1450); c.quadraticCurveTo(540, 1400, 1280, 1450); c.lineTo(1280, 2120); c.lineTo(-200, 2120); c.closePath(); hfill(c, PC, mix(T.a6, T.canvas, 0.45), 6);
        branch(c, 540, 1460, 4.2, BEIGE);
        var ta = o.tagAt == null ? 0.2 : o.tagAt, du = clamp((t - ta) / 0.35, 0, 1), sw = Math.sin((t - ta) * 5) * 0.3 * Math.exp(-(t - ta) * 1.2) + Math.sin(t * 2.4) * 0.06;
        if (du > 0) {
          var px = 820, py = 740 - (1 - backOut(du)) * 700;
          c.save(); c.translate(px, py - 120); c.rotate(sw);
          c.beginPath(); c.moveTo(0, -200); c.lineTo(0, 120); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
          c.beginPath(); c.moveTo(-90, 120); c.lineTo(0, 120); c.lineTo(90, 170); c.lineTo(90, 400); c.lineTo(-90, 400); c.closePath(); hfill(c, PC, T.a1, 7);
          circ(c, 0, 160, 16); c.fillStyle = T.canvas; c.fill(); c.lineWidth = 5; c.stroke();
          c.font = "900 130px Cairo, 'Arial Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = ink; c.fillText("$", 0, 300);
          c.restore();
          addGlow(c, px, py + 100, 300, T.a1, 0.3);
        }
      });
    };

    /* ======================= EP 4 ======================= */
    var ep4 = {};
    var BOARD = hs(300, 300, { spacing: 6 });
    function chessBoard(c, x, y, w, t) { // board in perspective + a few pieces (silhouettes)
      var d = w * 0.38;
      for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
        var y0 = y - d / 2 + r * d / 8, y1 = y0 + d / 8, k0 = 0.75 + 0.25 * r / 8, k1 = 0.75 + 0.25 * (r + 1) / 8;
        c.beginPath(); c.moveTo(x + (-w / 2 + f * w / 8) * k0, y0); c.lineTo(x + (-w / 2 + (f + 1) * w / 8) * k0, y0); c.lineTo(x + (-w / 2 + (f + 1) * w / 8) * k1, y1); c.lineTo(x + (-w / 2 + f * w / 8) * k1, y1); c.closePath();
        c.fillStyle = (r + f) % 2 ? "#3A3A44" : "#E8E2D2"; c.fill();
      }
      c.beginPath(); c.moveTo(x - w / 2 * 0.75, y - d / 2); c.lineTo(x + w / 2 * 0.75, y - d / 2); c.lineTo(x + w / 2, y + d / 2); c.lineTo(x - w / 2, y + d / 2); c.closePath(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
      [[-0.3, 0.2, 1], [0.1, -0.1, 0], [0.25, 0.3, 1], [-0.1, -0.3, 0]].forEach(function (p, i) { var px = x + p[0] * w, py = y + p[1] * d, s = 1 + p[1] * 0.3; c.save(); c.translate(px, py); c.scale(s, s); c.beginPath(); c.moveTo(-20, 0); c.lineTo(-12, -50); c.arc(0, -64, 16, Math.PI * 0.7, Math.PI * 2.3); c.lineTo(12, -50); c.lineTo(20, 0); c.closePath(); c.fillStyle = p[2] ? "#F4EFE4" : "#2A2A30"; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); c.restore(); });
    }
    // Kasparov (silhouette, dark curly hair, no face): pose "think" | "forehead" | "handshake"
    ep4.kasparov = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        var pose = o.pose || "think";
        room(c, t, mix(T.canvas, T.a2, 0.2), 540, 700);
        addGlow(c, 540, 1000, 700, T.a1, 0.2);
        if (o.push !== false) zoomAt(c, 1 + 0.05 * t, 540, 900);
        var who = { suit: true, top: "#2E3040", bottom: "#24252F", hairStyle: "curly", hair: "#1C1A1A", sit: true, armsFront: pose !== "handshake", tieCol: T.a3, headTilt: Math.sin(t * 1.4) * 0.05 };
        if (pose === "think") { who.armR = [0, 0, 18 + Math.sin(t * 3) * 4, -296]; who.armL = [0.3, -1.3]; who.headTilt = 0.1; }
        if (pose === "forehead") { who.armR = [0, 0, 6, -378 + Math.sin(t * 2) * 6]; who.armL = [0.3, -1.3]; who.headTilt = -0.12 + Math.sin(t * 2) * 0.04; who.headY = 8; }
        if (pose === "handshake") { var hu = sstep(0.1, 0.4, t); who.armR = [0.4 + 0.9 * hu, -0.4 * hu - 0.6 * (1 - hu)]; who.armL = [0.3, -1.3]; }
        var hands = figure(c, 540, 1240, 2.3, who);
        if (pose === "handshake") { // a hand comes in from the right and shakes (the Deep Blue side)
          var sh = Math.sin(t * 14) * 10 * sstep(0.4, 0.5, t), hx = hands.R[0], hy = hands.R[1] + sh;
          c.beginPath(); c.moveTo(1300, hy - 10); c.lineTo(hx + 30, hy); c.lineWidth = 70; c.strokeStyle = ink; c.stroke(); c.lineWidth = 58; c.strokeStyle = "#3E5A9E"; c.stroke();
          circ(c, hx + 20, hy, 34); c.fillStyle = "#C9C6C0"; c.fill(); c.lineWidth = 5; c.stroke();
        }
        rr(c, -200, 1260, 1480, 700, 0); hfill(c, BOARD, "#4A3A2E", 7);
        chessBoard(c, 540, 1420, 900, t);
      });
    };
    // split-flap score board flips to 3½ – 2½ (landAt)
    ep4.score = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.5 });
        var la = o.landAt == null ? 1.0 : o.landAt, fin = o.final || ["3½", "2½"], ch = "0123456½";
        rr(c, 60, 560, 960, 760, 40); hfill(c, PC, "#2A2A30", 9);
        for (var s = 0; s < 2; s++) {
          var x = 290 + s * 500, y = 940, landed = t >= la + s * 0.15, flip = (t * 14) % 1;
          rr(c, x - 200, y - 260, 400, 520, 24); c.fillStyle = "#16161A"; c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
          var txt = landed ? fin[s] : ch[Math.floor(t * 14 + s * 3) % ch.length];
          c.font = "900 240px Cairo, 'Arial Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#F4EFE4"; c.fillText(txt, x, y + 10);
          if (!landed) { c.save(); c.translate(x, y); c.scale(1, Math.cos(flip * Math.PI)); rr(c, -190, -250, 380, 250, 20); c.fillStyle = "#26262C"; c.fill(); c.restore(); }
          c.beginPath(); c.moveTo(x - 200, y); c.lineTo(x + 200, y); c.lineWidth = 6; c.strokeStyle = "#000"; c.stroke();
          var fl = landed ? 1 - sstep(la + s * 0.15, la + s * 0.15 + 0.5, t) : 0; if (fl > 0) addGlow(c, x, y, 360, T.a1, 0.5 * fl);
        }
        c.font = "900 160px Cairo, 'Arial Black', sans-serif"; c.fillStyle = T.a1; c.fillText("–", 540, 940);
        for (var b = 0; b < 12; b++) { var on = (Math.floor(t * 10) + b) % 3 === 0; circ(c, 120 + b * 76, 620, 14); c.fillStyle = on ? T.a1 : "#4A4A50"; c.fill(); circ(c, 120 + b * 76, 1260, 14); c.fillStyle = !on ? T.a1 : "#4A4A50"; c.fill(); }
      });
    };
    // trophy with a fluttering ribbon, shine sweep and sparkles
    ep4.trophy = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.6 });
        var ia = o.inAt == null ? 0 : o.inAt, u = clamp((t - ia) / 0.4, 0, 1), s = backOut(u) * 1.0;
        burst(c, 540, 820, t, u, T.a1, 16, 1100);
        c.save(); c.translate(540, 960 + Math.sin(t * 2) * 10); c.scale(s, s);
        var gold = "#E9C46A";
        c.beginPath(); c.moveTo(-280, -420); c.lineTo(280, -420); c.quadraticCurveTo(280, 60, 0, 120); c.quadraticCurveTo(-280, 60, -280, -420); c.closePath(); hfill(c, PC, gold, 9);
        c.beginPath(); c.moveTo(-280, -360); c.bezierCurveTo(-460, -360, -460, -80, -230, -40); c.moveTo(280, -360); c.bezierCurveTo(460, -360, 460, -80, 230, -40); c.lineWidth = 46; c.strokeStyle = ink; c.stroke(); c.lineWidth = 32; c.strokeStyle = gold; c.stroke();
        rr(c, -50, 110, 100, 200, 10); hfill(c, PC, mix(gold, ink, 0.15), 7); rr(c, -200, 300, 400, 90, 14); hfill(c, PC, "#2A2A30", 8); rr(c, -250, 380, 500, 80, 14); hfill(c, PC, "#2A2A30", 8);
        // ribbon flutters
        for (var sd = -1; sd <= 1; sd += 2) { c.beginPath(); c.moveTo(sd * 30, 120); for (var k = 0; k <= 10; k++) c.lineTo(sd * (30 + k * 26), 120 + k * 46 + Math.sin(t * 9 + k * 0.7 + sd) * 14 * k / 10); c.lineWidth = 56; c.strokeStyle = ink; c.stroke(); c.lineWidth = 44; c.strokeStyle = sd < 0 ? T.a3 : T.a4; c.stroke(); }
        // shine sweep
        c.save(); c.beginPath(); c.moveTo(-280, -420); c.lineTo(280, -420); c.quadraticCurveTo(280, 60, 0, 120); c.quadraticCurveTo(-280, 60, -280, -420); c.clip();
        var sx = -500 + ((t * 600) % 1400); c.beginPath(); c.moveTo(sx, -500); c.lineTo(sx + 80, -500); c.lineTo(sx - 120, 200); c.lineTo(sx - 200, 200); c.closePath(); c.fillStyle = rgba("#ffffff", 0.5); c.fill(); c.restore();
        star(c, 0, -200, 90, "#FFF3B0", t * 0.5);
        c.restore();
        for (var p = 0; p < 6; p++) { var k2 = 0.5 + 0.5 * Math.sin(t * 5 + p * 1.3); sparkle(c, 540 + Math.cos(p * 1.05 + t * 0.3) * 420, 900 + Math.sin(p * 1.05 + t * 0.3) * 520, 40 * k2, 26 * k2, "#FFFBEA", 0.4, rgba(T.a1, 0.9)); }
      });
    };
    // a laptop with avatars pouring out of the screen; mode "globe": a globe filling with avatar dots
    function avatar(c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); circ(c, 0, 0, 40); c.fillStyle = col; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke(); circ(c, 0, -10, 13); c.fillStyle = "#F4EFE4"; c.fill(); c.beginPath(); c.arc(0, 26, 22, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 9; c.strokeStyle = "#F4EFE4"; c.stroke(); c.restore(); }
    var AVC = [T.a1, T.a3, T.a4, T.a5, T.a6];
    ep4.laptop = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.5 });
        if (o.mode === "globe") { globe(c, 540, 960, 420, t, { dots: sstep(0, 2, t - (o.fillAt || 0)) * 0.9 + 0.1, spin: 0.6 }); return; }
        var flow = o.flowAt == null ? 0.2 : o.flowAt;
        addGlow(c, 540, 1060, 600, T.a4, 0.35);
        // screen + base (no logo)
        c.beginPath(); c.moveTo(200, 1060); c.lineTo(880, 1060); c.lineTo(860, 640); c.lineTo(220, 640); c.closePath(); hfill(c, PC, "#3A3A44", 8);
        c.beginPath(); c.moveTo(240, 1030); c.lineTo(840, 1030); c.lineTo(824, 670); c.lineTo(256, 670); c.closePath(); c.fillStyle = mix("#0E1A2A", T.a4, 0.35); c.fill();
        c.beginPath(); c.moveTo(120, 1180); c.lineTo(960, 1180); c.lineTo(880, 1060); c.lineTo(200, 1060); c.closePath(); hfill(c, PC, "#C9C6C0", 8);
        for (var a = 0; a < 26; a++) {
          var u = ((t - flow) * 0.8 + hash(a)) % 1; if (t < flow) continue;
          var ang = -Math.PI / 2 + (hash(a + 9) - 0.5) * 2.6, d = u * 1100, x = 540 + Math.cos(ang) * d, y = 850 + Math.sin(ang) * d * 0.9 - u * 200, s = 0.5 + u * 1.3;
          avatar(c, x, y, s, AVC[a % 5]);
        }
      });
    };
    // three doors open in sequence (openAt, gap); mode "coach": a coach points at a board, a camera on a tripod films it (REC blinks)
    var DOOR = hs(160, 400, { spacing: 6 });
    function door(c, x, y, w, h, open, col, inside) {
      rr(c, x - w / 2, y - h, w, h, [w / 2, w / 2, 0, 0]); c.fillStyle = inside || LAMP; c.fill(); c.lineWidth = 8; c.strokeStyle = ink; c.stroke();
      if (open > 0.02) addGlow(c, x, y - h / 2, h, T.a1, 0.4 * open);
      var dw = w * Math.cos(clamp(open, 0, 1.1) * 1.4);
      if (Math.abs(dw) > 3) { c.beginPath(); c.moveTo(x - w / 2, y - h + w / 2 * 0.6); c.quadraticCurveTo(x - w / 2 + dw / 2, y - h - w * 0.1, x - w / 2 + dw, y - h + w / 2 * 0.6); c.lineTo(x - w / 2 + dw, y); c.lineTo(x - w / 2, y); c.closePath(); hfill(c, DOOR, col, 7); }
    }
    ep4.doors = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        if (o.mode === "coach") {
          room(c, t, mix(T.canvas, T.a2, 0.25), 540, 700);
          rr(c, 520, 380, 500, 500, 14); hfill(c, PC, "#2A2A30", 8); // wall board with a chess diagram
          for (var r = 0; r < 6; r++) for (var f = 0; f < 6; f++) { rr(c, 560 + f * 70, 420 + r * 70, 70, 70, 0); c.fillStyle = (r + f) % 2 ? "#3A3A44" : "#E8E2D2"; c.fill(); }
          var ar = sstep(0.2, 0.5, t); c.beginPath(); c.moveTo(700, 770); c.lineTo(700 + 140 * ar, 770 - 210 * ar); c.lineWidth = 14; c.strokeStyle = T.a3; c.stroke();
          figure(c, 330, 1500, 1.9, { top: T.a3, hairStyle: "grey", suit: true, tieCol: T.a1, armR: [1.6 + Math.sin(t * 6) * 0.08, 0.15] });
          // camera on a tripod, REC blinks
          c.save(); c.translate(860, 1330); c.beginPath(); c.moveTo(0, 0); c.lineTo(-90, 420); c.moveTo(0, 0); c.lineTo(90, 420); c.moveTo(0, 0); c.lineTo(0, 420); c.lineWidth = 14; c.strokeStyle = ink; c.stroke(); c.lineWidth = 7; c.strokeStyle = "#9A9488"; c.stroke();
          c.rotate(-0.25); rr(c, -120, -110, 220, 120, 16); hfill(c, PC, "#3A3A44", 7); rr(c, -190, -90, 80, 80, 10); c.fillStyle = "#1C1C22"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); circ(c, -150, -50, 26); c.fillStyle = mix("#22344A", T.a4, 0.4); c.fill(); c.stroke();
          var rec = Math.floor(t * 2) % 2; circ(c, 60, -80, 14); c.fillStyle = rec ? "#E63946" : "#4A1E22"; c.fill(); if (rec) addGlow(c, 60, -80, 60, "#E63946", 0.6); c.restore();
          return;
        }
        space(c, t, { blobA: 0.4 });
        var oa = o.openAt == null ? 0.2 : o.openAt, gap = o.gap || 0.35;
        c.beginPath(); c.moveTo(-200, 1500); c.lineTo(1280, 1500); c.lineWidth = 5; c.strokeStyle = rgba(T.light, 0.4); c.stroke();
        for (var d = 0; d < 3; d++) { var x = 195 + d * 345, op = backOut((t - oa - d * gap) / 0.35) * (t > oa + d * gap ? 1 : 0); door(c, x, 1500, 300, 900, op, [T.a2, T.a3, T.a4][d]); }
      });
    };
    // a crowd of players cheering, confetti
    ep4.crowd = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.4 }); addGlow(c, 540, 600, 800, T.a1, 0.3);
        for (var row = 0; row < 3; row++) for (var i = 0; i < 5; i++) {
          var k = [0.95, 1.25, 1.6][row], x = 540 + (i - 2) * 230 * k * 0.9 + (row % 2) * 90, y = 1180 + row * 260, j = Math.abs(Math.sin(t * 7 + i * 1.3 + row)) * 30 * k, id = row * 5 + i;
          var up = 2.5 + Math.sin(t * 9 + id) * 0.25;
          figure(c, x, y - j, k, { top: [T.a1, T.a3, T.a4, T.a5, T.a6, T.a2][id % 6], skirt: id % 3 === 0, hairStyle: ["short", "long", "curly", "bun", "short"][id % 5], hair: ["#3A2A1C", "#6B4426", "#1C1A22", "#8A5A2E"][id % 4], skin: SKIN[id % 4], armL: [up, 0.2], armR: [up + 0.1, 0.2] });
        }
        for (var p = 0; p < 60; p++) { var u = (t * (0.4 + hash(p) * 0.4) + hash(p + 3)) % 1, x2 = hash(p + 7) * 1080 + Math.sin(t * 3 + p) * 40, y2 = -100 + u * 2100; c.save(); c.translate(x2, y2); c.rotate(t * 6 + p); c.fillStyle = AVC[p % 5]; c.fillRect(-12, -6, 24, 12); c.restore(); }
      });
    };

    /* ======================= EP 5 ======================= */
    var ep5 = {};
    // Hinton (silhouette, grey hair, no face) at a lectern, pointing
    ep5.hinton = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        room(c, t, mix(T.canvas, T.a2, 0.25), 540, 600);
        if (o.push !== false) zoomAt(c, 1 + 0.05 * t, 540, 900);
        // screen behind with a neural-net doodle
        rr(c, 120, 260, 840, 520, 20); hfill(c, PC, "#F4EFE4", 8, { ha: 0.2 });
        var N = [[260, 400], [260, 640], [540, 360], [540, 520], [540, 680], [820, 520]]; c.beginPath(); [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5]].forEach(function (e) { c.moveTo(N[e[0]][0], N[e[0]][1]); c.lineTo(N[e[1]][0], N[e[1]][1]); }); c.lineWidth = 5; c.strokeStyle = rgba(ink, 0.6); c.stroke();
        N.forEach(function (p, i) { var on = 0.5 + 0.5 * Math.sin(t * 6 - i); circ(c, p[0], p[1], 34); c.fillStyle = mix(T.a5, T.a1, on); c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke(); });
        var pt = sstep(0.1, 0.35, t);
        figure(c, 420, 1500, 2.1, { suit: true, top: "#3A3A4A", hairStyle: "grey", tieCol: T.a2, armR: [0.2 + 2.1 * pt + Math.sin(t * 5) * 0.05 * pt, 0.1], armL: [0.3, -1.0], headTilt: 0.1 * pt });
        c.beginPath(); c.moveTo(220, 1180); c.lineTo(620, 1180); c.lineTo(580, 1800); c.lineTo(260, 1800); c.closePath(); hfill(c, PC, "#6B4426", 8); // lectern
        rr(c, 200, 1150, 440, 50, 8); hfill(c, PC, "#8A5A32", 7);
      });
    };
    // light box with an X-ray and a scan line; mode "scale": a balance that tips (tipAt, dir)
    ep5.lightbox = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        room(c, t, mix(T.canvas, T.a2, 0.3), 540, 800);
        if (o.mode === "scale") {
          var ta = o.tipAt == null ? 0.4 : o.tipAt, tip = (o.dir || 1) * 0.32 * backOut((t - ta) / 0.45) * (t > ta ? 1 : 0) + Math.sin(t * 2.4) * 0.02;
          rr(c, 500, 700, 80, 900, 10); hfill(c, PC, "#C9973F", 7); rr(c, 340, 1580, 400, 70, 14); hfill(c, PC, "#C9973F", 7);
          c.save(); c.translate(540, 720); c.rotate(tip);
          rr(c, -420, -18, 840, 36, 12); hfill(c, PC, "#E9C46A", 7);
          for (var sd = -1; sd <= 1; sd += 2) { c.save(); c.translate(sd * 400, 0); c.rotate(-tip); c.beginPath(); c.moveTo(0, 0); c.lineTo(-110, 300); c.moveTo(0, 0); c.lineTo(110, 300); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
            c.beginPath(); c.ellipse(0, 300, 150, 40, 0, 0, Math.PI); c.closePath(); hfill(c, PC, "#E9C46A", 7);
            if (sd < 0) { rr(c, -70, 200, 140, 100, 14); hfill(c, PC, T.a4, 6); } else { circ(c, -40, 260, 40); hfill(c, PC, T.a3, 6); circ(c, 40, 260, 40); hfill(c, PC, T.a1, 6); circ(c, 0, 210, 40); hfill(c, PC, T.a5, 6); }
            c.restore(); }
          c.restore(); circ(c, 540, 720, 30); c.fillStyle = ink; c.fill();
          return;
        }
        rr(c, 140, 300, 800, 1100, 30); hfill(c, PC, "#C9C6C0", 9);
        rr(c, 190, 350, 700, 1000, 16); c.fillStyle = "#EAF4FF"; c.fill(); addGlow(c, 540, 850, 700, "#EAF4FF", 0.35);
        rr(c, 260, 420, 560, 860, 10); c.fillStyle = "#14202C"; c.fill(); // film
        c.save(); rr(c, 260, 420, 560, 860, 10); c.clip();
        c.strokeStyle = rgba("#EAF4FF", 0.85); c.lineCap = "round";
        c.beginPath(); c.moveTo(540, 470); c.lineTo(540, 1240); c.lineWidth = 26; c.stroke(); // spine
        for (var rb = 0; rb < 8; rb++) { var ry = 560 + rb * 80; for (var sd2 = -1; sd2 <= 1; sd2 += 2) { c.beginPath(); c.moveTo(540, ry); c.bezierCurveTo(540 + sd2 * 120, ry - 40, 540 + sd2 * 230, ry + 10, 540 + sd2 * 210, ry + 90); c.lineWidth = 16 - rb; c.stroke(); } }
        c.beginPath(); c.moveTo(330, 500); c.quadraticCurveTo(540, 440, 750, 500); c.lineWidth = 18; c.stroke(); // collar bones
        var sy = 420 + ((t * 0.7) % 1) * 860; c.fillStyle = rgba("#57D68D", 0.25); c.fillRect(260, sy - 60, 560, 60); c.fillStyle = "#57D68D"; c.fillRect(260, sy - 6, 560, 12); addGlow(c, 540, sy, 300, "#57D68D", 0.4);
        var spot = sstep(0.5, 0.6, (t * 0.7) % 1); if (spot > 0) { c.beginPath(); c.arc(640, 840, 60, 0, TAU); c.lineWidth = 8; c.strokeStyle = rgba(T.a1, spot); c.stroke(); }
        c.restore();
      });
    };
    // radiologist with task bubbles popping around (popAt, gap); mode "clock": a clock pie with a third shaded (fillAt)
    function bubble(c, x, y, s, kind, col) {
      c.save(); c.translate(x, y); c.scale(s, s);
      rr(c, -110, -80, 220, 160, 40); hfill(c, PC, col, 6, { ha: 0.25 }); c.beginPath(); c.moveTo(-40, 78); c.lineTo(-70, 130); c.lineTo(0, 78); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
      c.lineWidth = 9; c.strokeStyle = ink; c.beginPath();
      if (kind === 0) { rr(c, -50, -50, 100, 100, 10); c.stroke(); c.beginPath(); c.moveTo(-30, 10); c.lineTo(-10, -20); c.lineTo(10, 20); c.lineTo(30, -10); } // scan
      else if (kind === 1) { c.moveTo(-50, -30); c.lineTo(50, -30); c.moveTo(-50, 0); c.lineTo(50, 0); c.moveTo(-50, 30); c.lineTo(20, 30); } // notes
      else if (kind === 2) { c.arc(-20, -10, 22, 0, TAU); c.moveTo(20, -10); c.arc(30, -10, 18, 0, TAU); c.moveTo(-50, 50); c.quadraticCurveTo(-20, 10, 10, 50); } // patient chat
      else { c.moveTo(-40, 0); c.lineTo(-10, 30); c.lineTo(45, -35); } // check
      c.stroke(); c.restore();
    }
    ep5.radiologist = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        room(c, t, mix(T.canvas, T.a2, 0.3), 540, 800);
        if (o.mode === "clock") {
          var fa = o.fillAt == null ? 0.3 : o.fillAt, f = sstep(fa, fa + 0.5, t) / 3, cx = 540, cy = 940, R0 = 380;
          circ(c, cx, cy, R0 + 30); hfill(c, PC, "#F4EFE4", 10, { ha: 0.2 });
          c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R0, -Math.PI / 2, -Math.PI / 2 + f * TAU); c.closePath(); c.fillStyle = T.a3; c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
          if (f > 0.3) addGlow(c, cx + 150, cy - 150, 300, T.a3, 0.4 * sstep(fa + 0.45, fa + 0.6, t));
          for (var k = 0; k < 12; k++) { var a = k / 12 * TAU; c.beginPath(); c.moveTo(cx + Math.cos(a) * (R0 - 10), cy + Math.sin(a) * (R0 - 10)); c.lineTo(cx + Math.cos(a) * (R0 - 50), cy + Math.sin(a) * (R0 - 50)); c.lineWidth = 9; c.strokeStyle = ink; c.stroke(); }
          var ha = t * 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ha - Math.PI / 2) * R0 * 0.85, cy + Math.sin(ha - Math.PI / 2) * R0 * 0.85); c.lineWidth = 14; c.stroke();
          circ(c, cx, cy, 26); c.fillStyle = ink; c.fill();
          return;
        }
        var who = { top: "#F4F1EA", hairStyle: "bun", hair: "#3A2A1C", skin: SKIN[1], armR: [0.6 + Math.sin(t * 3) * 0.1, 0.4], armL: [0.2, 0.1] };
        figure(c, 540, 1700, 2.6, who);
        c.beginPath(); c.moveTo(470, 1020); c.quadraticCurveTo(430, 1180, 540, 1220); c.quadraticCurveTo(650, 1180, 610, 1020); c.lineWidth = 8; c.strokeStyle = ink; c.stroke(); circ(c, 540, 1230, 14); c.fillStyle = "#9A9488"; c.fill(); c.stroke(); // stethoscope
        var pa = o.popAt == null ? 0.2 : o.popAt, gap = o.gap || 0.25, P = [[220, 520], [860, 460], [180, 1050], [900, 1000]];
        for (var b = 0; b < 4; b++) { var u = clamp((t - pa - b * gap) / 0.25, 0, 1); if (u > 0) bubble(c, P[b][0], P[b][1] + Math.sin(t * 2.5 + b) * 12, backOut(u) * 1.15, b, [T.a1, T.a4, T.a5, T.a6][b]); }
      });
    };
    // a generic chat window (no logo) with a typing indicator; mode "globe": a globe flooding with user dots
    ep5.chat = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.5 });
        if (o.mode === "globe") { globe(c, 540, 960, 430, t, { dots: clamp((t - (o.fillAt || 0)) / 1.6, 0.05, 1), spin: 0.5 }); return; }
        rr(c, 110, 300, 860, 1320, 50); hfill(c, PC, "#F4EFE4", 9, { ha: 0.15 });
        rr(c, 110, 300, 860, 120, [50, 50, 0, 0]); c.fillStyle = T.a2; c.fill(); c.lineWidth = 9; c.strokeStyle = ink; c.stroke();
        circ(c, 190, 360, 30); c.fillStyle = T.a1; c.fill(); c.lineWidth = 5; c.stroke();
        var msgs = [[0, 0.1, 520], [1, 0.5, 600], [0, 1.0, 420]], y = 480;
        msgs.forEach(function (m, i) {
          var u = clamp((t - m[1]) / 0.2, 0, 1); if (u <= 0) return; var w = m[2], x = m[0] ? 920 - w : 160, h = 150;
          c.save(); c.translate(x + (m[0] ? w : 0), y + h / 2); c.scale(backOut(u), backOut(u)); c.translate(-(x + (m[0] ? w : 0)), -(y + h / 2));
          rr(c, x, y, w, h, 40); c.fillStyle = m[0] ? T.a4 : "#DDD7CB"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
          c.beginPath(); c.moveTo(x + 40, y + 55); c.lineTo(x + w - 60, y + 55); c.moveTo(x + 40, y + 100); c.lineTo(x + w * 0.6, y + 100); c.lineWidth = 12; c.strokeStyle = rgba(ink, 0.35); c.stroke();
          c.restore(); y += h + 40;
        });
        rr(c, 160, y, 220, 110, 50); c.fillStyle = "#DDD7CB"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); // typing indicator
        for (var d = 0; d < 3; d++) { var b = Math.max(0, Math.sin(t * 9 - d * 0.9)); circ(c, 215 + d * 55, y + 55 - b * 14, 15); c.fillStyle = mix("#7A7A80", ink, b); c.fill(); }
        rr(c, 150, 1480, 780, 100, 50); c.fillStyle = "#ffffff"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); // input
        if (Math.floor(t * 3) % 2) { c.fillStyle = ink; c.fillRect(200, 1505, 8, 50); }
      });
    };
    // a wall of doors: grey ones close, bright ones open, one door glows (closeAt, openAt)
    ep5.doorsWall = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.3 });
        if (o.push !== false) zoomAt(c, 1 + 0.06 * t, 540, 960);
        var ca = o.closeAt == null ? 0.2 : o.closeAt, oa = o.openAt == null ? 0.7 : o.openAt;
        for (var r = 0; r < 4; r++) for (var k = 0; k < 4; k++) {
          var id = r * 4 + k, x = 175 + k * 243, y = 560 + r * 420, grey = hash(id + 4) < 0.45, hero = id === 9;
          var op = grey ? 1 - sstep(0, 0.2, t - ca - hash(id) * 0.4) : sstep(0, 0.25, t - oa - hash(id) * 0.4);
          if (hero) op = sstep(0, 0.3, t - oa - 0.4);
          door(c, x, y, 170, 340, op * 0.95, grey ? "#6A6A72" : [T.a1, T.a3, T.a4, T.a5, T.a6][id % 5], grey ? "#3A3A44" : LAMP);
          if (hero && op > 0) { addGlow(c, x, y - 170, 600, LAMP, 0.6 * op); sparkle(c, x + 60, y - 300, 60 * op, 40 * op, "#FFFBEA", 0.5, rgba(LAMP, 0.9)); }
        }
      });
    };
    // a crystal ball with a forecast chart rising inside, swirling mist
    ep5.crystal = function (c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.6 });
        var cx = 540, cy = 860, R0 = 380, ga = o.growAt == null ? 0.2 : o.growAt;
        addGlow(c, cx, cy, 800, T.a5, 0.4);
        c.beginPath(); c.moveTo(cx - 280, cy + 470); c.lineTo(cx + 280, cy + 470); c.lineTo(cx + 200, cy + 330); c.lineTo(cx - 200, cy + 330); c.closePath(); hfill(c, PC, "#6B4426", 8);
        rr(c, cx - 320, cy + 460, 640, 80, 20); hfill(c, PC, "#4A2E1C", 8);
        circ(c, cx, cy, R0); c.fillStyle = rgba(mix(T.a5, T.canvas, 0.3), 0.85); c.fill();
        c.save(); circ(c, cx, cy, R0); c.clip();
        for (var m = 0; m < 5; m++) { c.save(); c.translate(cx, cy); c.rotate(t * (0.6 + m * 0.15) + m); c.beginPath(); c.ellipse(80, 0, 260 - m * 30, 90, 0.4, 0, TAU); c.fillStyle = rgba([T.a1, T.a4, T.a3, LAMP, T.a6][m], 0.18); c.fill(); c.restore(); }
        c.beginPath(); c.moveTo(cx - 280, cy + 200); c.lineTo(cx + 280, cy + 200); c.moveTo(cx - 280, cy + 200); c.lineTo(cx - 280, cy - 250); c.lineWidth = 6; c.strokeStyle = rgba("#ffffff", 0.6); c.stroke();
        var u = clamp((t - ga) / 1.2, 0, 1), pts = [[-260, 150], [-150, 110], [-60, 130], [40, 40], [130, 0], [220, -160]];
        c.beginPath(); for (var i = 0; i < pts.length; i++) { var k = i / (pts.length - 1); if (k > u + 0.001) { var a = pts[i - 1], b = pts[i], f = (u - (i - 1) / (pts.length - 1)) * (pts.length - 1); c.lineTo(cx + a[0] + (b[0] - a[0]) * f, cy + a[1] + (b[1] - a[1]) * f); break; } if (i) c.lineTo(cx + pts[i][0], cy + pts[i][1]); else c.moveTo(cx + pts[i][0], cy + pts[i][1]); }
        c.lineWidth = 22; c.strokeStyle = ink; c.stroke(); c.lineWidth = 13; c.strokeStyle = T.a1; c.stroke();
        if (u >= 1) { star(c, cx + 220, cy - 160, 44, LAMP, t); }
        c.restore();
        circ(c, cx, cy, R0); c.lineWidth = 10; c.strokeStyle = ink; c.stroke();
        c.beginPath(); c.arc(cx - 110, cy - 110, R0 * 0.55, Math.PI * 1.05, Math.PI * 1.45); c.lineWidth = 20; c.strokeStyle = rgba("#ffffff", 0.45); c.stroke();
        for (var p = 0; p < 5; p++) { var k2 = 0.5 + 0.5 * Math.sin(t * 5 + p * 1.3); sparkle(c, cx + Math.cos(p * 1.25 + t * 0.4) * 470, cy + Math.sin(p * 1.25 + t * 0.4) * 470, 36 * k2, 24 * k2, "#FFFBEA", 0.4, rgba(LAMP, 0.9)); }
      });
    };
    ep5.usMap = usMap;

    return { figure: figure, globe: globe, usMap: usMap, branch: branch, door: door, space: space, desk: desk, ep2: ep2, ep3: ep3, ep4: ep4, ep5: ep5 };
  }

  window.SERIES = { create: create, twos: twos, util: { rr: rr, circ: circ, backOut: backOut, hash: hash } };
})();
