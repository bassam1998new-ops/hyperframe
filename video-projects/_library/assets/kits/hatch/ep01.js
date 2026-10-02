/* =====================================================================
   ep01.js — ep 1 ("born in a war") hero scenes for the Story-of-AI series, on the hatch kit (HATCH).
   Built after the reference study: ONE big subject per scene, filling the 9:16 frame, doing one strong action.
   Every scene paints the whole frame (its own background + drifting parallax layers) from the time t only.

   var K = HATCH.kit({ w: 1080, h: 1920, seed: 19390901, theme: EP01.theme });
   var S = EP01.create(K);                       // build once (seeded hatching)
   S.enigma(ctx, t);                             // inside draw(t)
   S.chalk(ctx, t, { dur: 3.2 });                // options per scene, see each function
   Scenes: enigma (lamps light), rotors (spin + step), bombe (drums whirl, lock, lamp flash), turing (writes, sheets fly),
           room (Bletchley desk room fills), huts (hut windows light, smoke), colossus (tape races, valves flicker),
           chalk (Dartmouth board, chalk writes a doodle on; no words: words stay outside the canvas)
   Options for every scene: { twos: true (animate on twos, 15 steps/s), cam: 1 (extra zoom about the centre), bg: true }
   Design space is 1080 x 1920; other sizes are fitted (cover) about the centre.
   ===================================================================== */
(function () {
  var H = window.HATCH, sstep = H.sstep, clamp = H.clamp, mix = H.mix, rgba = H.rgba, sparkle = H.sparkle;
  var TAU = Math.PI * 2;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
  function twos(t) { return Math.floor(t * 15 + 1e-6) / 15; }
  function backOut(u) { u = clamp(u, 0, 1); var s = 2.2; u -= 1; return 1 + u * u * ((s + 1) * u + s); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  var theme = { canvas: "#0E1530", halo: "#1B2850", ink: "#0A0E1C", paper: "#EFE5CC", light: "#F5ECD6", star: "#C8D3F0", core: "#FFD27A",
    hero: "#5fd6b6", buddy: "#B98A4A", a1: "#F2B544", a2: "#3E5F96", a3: "#E07A3F", a4: "#46B3AE", a5: "#98A3D4", a6: "#9CC79E" };
  var C = { amber: "#F2B544", lampHot: "#FFE7A6", wood: "#7A4E2C", woodL: "#9A6A3E", steel: "#2B3550", steelL: "#46557E", cream: "#EFE5CC",
    brass: "#C9973F", red: "#D9574A", bombe: "#5670a8", slate: "#24453D", chalk: "#F2EEDD", green: "#3F6B4E", tweed: "#6B5A48", skin: "#E3B48C" };

  function create(K) {
    var T = K.T, ink = T.ink, R = K.rr;
    var DW = 1080, DH = 1920;
    // ---------- shared builders ----------
    function hs(hw, hh, o) {
      o = o || {};
      return {
        main: K.hatch(hw, hh, { angle: o.angle == null ? -0.98 : o.angle, spacing: o.spacing || 6.5, len: o.len || 24, gapMin: 8, gapMax: 34, jit: 0.07 }),
        cross: K.hatch(hw, hh, { angle: -2.3, spacing: (o.spacing || 6.5) * 1.1, len: 18, gapMin: 10, gapMax: 60, jit: 0.08, keep: function (x, y) { return x * 0.6 + y > R(-60, 160); } })
      };
    }
    // fill the current path with fill + pencil hatch (+ optional cross), outline it
    function hfill(c, h, fill, ol, o) {
      o = o || {};
      c.fillStyle = fill; c.fill();
      c.save(); c.clip(); c.lineCap = "round"; c.lineWidth = o.lw || 1.3;
      c.strokeStyle = rgba(mix(fill, ink, 0.6), o.ha == null ? 0.55 : o.ha); c.stroke(h.main);
      if (o.cross !== false) c.stroke(h.cross);
      c.restore();
      if (ol) { c.lineWidth = ol; c.strokeStyle = ink; c.stroke(); }
    }
    function glow(c, x, y, r, col, a) {
      if (a <= 0.003) return;
      var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(0.35, rgba(col, 0.45)); g.addColorStop(1, rgba(col, 0));
      c.globalAlpha = a; c.fillStyle = g; circ(c, x, y, r); c.fill(); c.globalAlpha = 1;
    }
    function ellipseGlow(c, x, y, rx, ry, col, a) { c.save(); c.translate(x, y); c.scale(1, ry / rx); glow(c, 0, 0, rx, col, a); c.restore(); }

    // ---------- space background: canvas, halo, drifting rain + stars + blobs (3 parallax layers) ----------
    var BGL = { stars: K.stars(140, 640, 1000), stars2: K.stars(50, 640, 1000), rain: K.rain(700, 1100),
      blobs: [K.blob(330, 230, "violet", 0.5), K.blob(280, 210, "tealD", 0.45), K.blob(300, 220, "magD", 0.4)] };
    function space(c, t, o) {
      o = o || {};
      c.fillStyle = o.canvas || T.canvas; c.fillRect(-200, -200, DW + 400, DH + 400);
      var g = c.createRadialGradient(DW / 2, DH * 0.45, 60, DW / 2, DH * 0.45, DH * 0.75);
      g.addColorStop(0, o.halo || T.halo); g.addColorStop(1, rgba(o.canvas || T.canvas, 0)); c.fillStyle = g; c.fillRect(-200, -200, DW + 400, DH + 400);
      if (o.blobs !== false) {
        var bp = [[140, 330], [960, 820], [180, 1600]];
        for (var i = 0; i < 3; i++) K.drawBlob(c, BGL.blobs[i], bp[i][0] + Math.sin(t * 0.6 + i * 2) * 40 - t * 18, bp[i][1] + Math.cos(t * 0.5 + i) * 26, 1, undefined, o.blobA == null ? 0.8 : o.blobA);
      }
      c.save(); c.translate(DW / 2 - ((t * 60) % 120), DH / 2 + ((t * 140) % 280)); K.drawRain(c, BGL.rain, 0.12); c.restore();
      c.save(); c.translate(DW / 2, DH / 2); K.drawStars(c, BGL.stars, t, 40); K.drawStars(c, BGL.stars2, t * 1.3, 110); c.restore();
    }
    // needle stars that twinkle around a subject
    var NEEDLES = []; for (var ni = 0; ni < 9; ni++) NEEDLES.push({ x: R(60, 1020), y: R(140, 1780), s: R(10, 24), ph: R(0, 6.28), f: R(0.4, 0.9) });
    function needles(c, t, a) {
      for (var i = 0; i < NEEDLES.length; i++) { var n = NEEDLES[i], k = 0.55 + 0.45 * Math.sin(t * TAU * n.f + n.ph); sparkle(c, n.x - t * 12, n.y, n.s * k, n.s * 0.7 * k, T.light, 0.25 * (a == null ? 1 : a), rgba(T.light, 0.6)); }
    }
    function zoomAt(c, z, x, y) { c.translate(x, y); c.scale(z, z); c.translate(-x, -y); }
    // frame wrapper: fit design space, optional extra cam zoom, twos
    function frame(c, t, o, body) {
      o = o || {};
      var tt = o.twos === false ? t : twos(t), W = c.canvas.width, Hh = c.canvas.height, s = Math.max(W / DW, Hh / DH) * (o.cam || 1);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      c.translate(W / 2, Hh / 2); c.scale(s, s); c.translate(-DW / 2, -DH / 2);
      c.lineJoin = "round"; c.lineCap = "round";
      body(tt, o);
      c.restore();
    }

    /* ======================= ENIGMA: the lamp board, lamps light up big ======================= */
    var EN = { panel: hs(600, 1000, { spacing: 7 }), plate: hs(560, 700, { spacing: 6 }), key: hs(80, 80, { spacing: 5, len: 12 }), cols: 4, rows: 5 };
    EN.order = []; for (var ei = 0; ei < 64; ei++) EN.order.push(Math.floor(hash(ei + 3) * EN.cols * EN.rows));
    function enigma(c, t, o) {
      frame(c, t, o, function (t, o) {
        var step = o.step || 0.42; // a new lamp every step seconds
        space(c, t, { blobA: 0.5 });
        // wooden case filling the frame, metal lamp plate inside
        rr(c, 40, 120, 1000, 1700, 46); hfill(c, EN.panel, C.wood, 7);
        rr(c, 90, 190, 900, 1180, 30); hfill(c, EN.plate, C.steel, 5, { ha: 0.6 });
        // screws
        [[120, 220], [960, 220], [120, 1340], [960, 1340]].forEach(function (p) { circ(c, p[0], p[1], 11); c.fillStyle = C.brass; c.fill(); c.lineWidth = 3; c.strokeStyle = ink; c.stroke(); c.beginPath(); c.moveTo(p[0] - 6, p[1]); c.lineTo(p[0] + 6, p[1]); c.stroke(); });
        var n = Math.floor(t / step), within = t - n * step;
        var cur = EN.order[n % 64], prev = EN.order[(n + 63) % 64];
        var lx0 = 225, ly0 = 330, dx = 210, dy = 220, r = 78;
        for (var row = 0; row < EN.rows; row++) for (var col = 0; col < EN.cols; col++) {
          var id = row * EN.cols + col, x = lx0 + col * dx + (row % 2 ? 0 : 0), y = ly0 + row * dy;
          var on = id === cur ? sstep(0, 0.06, within) : id === prev ? 1 - sstep(0, 0.22, within) : 0;
          // socket ring
          circ(c, x, y, r + 14); c.fillStyle = mix(C.steel, ink, 0.4); c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
          // glass dome
          circ(c, x, y, r); c.fillStyle = mix("#2A3350", C.lampHot, on); c.fill();
          c.save(); c.clip(); c.lineWidth = 1.4; c.strokeStyle = rgba(on > 0.5 ? C.amber : "#8090c0", 0.35); c.translate(x, y); c.stroke(EN.key.main); c.restore();
          circ(c, x, y, r); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
          // stencil ring (letter window) — a ring, not a letter
          c.beginPath(); c.arc(x, y, r * 0.42, 0, TAU); c.lineWidth = 6; c.strokeStyle = on > 0.3 ? rgba("#B8741A", 0.8) : rgba("#0A0E1C", 0.55); c.stroke();
          // highlight
          c.beginPath(); c.arc(x - r * 0.15, y - r * 0.15, r * 0.62, Math.PI * 1.05, Math.PI * 1.45); c.lineWidth = 7; c.strokeStyle = rgba("#ffffff", 0.35 + 0.4 * on); c.stroke();
        }
        // glow on top (separate pass so neighbours get lit)
        for (var k = 0; k < 2; k++) {
          var idk = k === 0 ? cur : prev, onk = k === 0 ? sstep(0, 0.06, within) : 1 - sstep(0, 0.22, within);
          var gx = lx0 + (idk % EN.cols) * dx, gy = ly0 + Math.floor(idk / EN.cols) * dy;
          c.globalCompositeOperation = "lighter"; glow(c, gx, gy, 520, C.amber, 0.85 * onk); glow(c, gx, gy, 200, C.lampHot, 0.9 * onk); glow(c, gx, gy, 90, "#FFFFFF", 0.7 * onk); c.globalCompositeOperation = "source-over";
          if (k === 0) sparkle(c, gx + 30, gy - 34, 46 * onk * (1 - 0.3 * sstep(0.1, 0.4, within)), 30 * onk, "#FFFBEA", 0.5 * onk, rgba(C.lampHot, 0.9));
        }
        // keyboard at the bottom: big cream keys, the pressed one drops
        var kn = 4, kx0 = 180, kdx = 240, ky = 1560;
        for (var ki = 0; ki < kn; ki++) {
          var press = (cur % kn) === ki ? sstep(0, 0.05, within) * (1 - sstep(0.16, 0.3, within)) : 0, kx = kx0 + ki * kdx, kyy = ky + press * 26;
          rr(c, kx - 14, ky + 30, 28, 120, 8); c.fillStyle = mix(C.steel, ink, 0.3); c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
          circ(c, kx, kyy + 8, 86); c.fillStyle = mix(ink, C.steel, 0.4); c.fill();
          circ(c, kx, kyy, 82); c.fillStyle = "#1C2133"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
          circ(c, kx, kyy, 62); c.save(); c.translate(kx, kyy); hfill(c, EN.key, C.cream, 5, { ha: 0.35 }); c.restore();
          c.beginPath(); c.arc(kx, kyy, 26, 0, TAU); c.lineWidth = 5; c.strokeStyle = rgba(ink, 0.5); c.stroke();
        }
        needles(c, t, 0.8);
      });
    }

    /* ======================= ROTORS: three big rotor wheels spin and step ======================= */
    var RO = []; for (var ri = 0; ri < 3; ri++) RO.push({ face: hs(340, 340, { spacing: 6 }), rim: hs(360, 360, { spacing: 5, len: 14 }) });
    function rotorAngle(i, t) {
      // fast continuous spin + a hard step every 0.25 s (the notch jolt), each wheel its own speed
      var sp = [2.6, -1.7, 1.05][i], n = 26, st = 0.25 * (i + 1), steps = Math.floor(t / st), u = (t - steps * st) / st;
      return sp * t + (steps + sstep(0, 0.35, u)) * TAU / n * (i % 2 ? -1 : 1);
    }
    function rotorWheel(c, i, x, y, r, a, speed) {
      var n = 26, body = RO[i], ol = 6;
      // motion arcs behind the rim (strength from speed)
      var arcs = clamp(Math.abs(speed) / 2.6, 0, 1);
      for (var q = 0; q < 3; q++) {
        c.beginPath(); var a0 = a + q * TAU / 3, len = 0.6 * arcs + 0.15;
        c.arc(x, y, r + 34 + q * 8, speed > 0 ? a0 - len : a0, speed > 0 ? a0 : a0 + len); c.lineWidth = 6 - q * 1.5; c.strokeStyle = rgba(T.light, 0.55 * arcs); c.stroke();
      }
      c.save(); c.translate(x, y); c.rotate(a);
      // toothed brass rim
      c.beginPath();
      for (var k = 0; k <= n * 2; k++) { var ang = k / (n * 2) * TAU, rad = k % 2 ? r + 22 : r + 6; var ang2 = ang + (k % 2 ? 0.04 : -0.04); c.lineTo(Math.cos(ang2) * rad, Math.sin(ang2) * rad); }
      c.closePath(); hfill(c, body.rim, C.brass, ol);
      // face
      circ(c, 0, 0, r - 8); hfill(c, body.face, i === 1 ? "#C8C2AE" : C.cream, ol, { ha: 0.4 });
      // contacts + tick marks
      for (k = 0; k < n; k++) {
        var aa = k / n * TAU, cx = Math.cos(aa), sy = Math.sin(aa);
        c.beginPath(); c.moveTo(cx * (r - 30), sy * (r - 30)); c.lineTo(cx * (r - 56), sy * (r - 56)); c.lineWidth = 4; c.strokeStyle = rgba(ink, 0.7); c.stroke();
        circ(c, cx * (r - 84), sy * (r - 84), 11); c.fillStyle = k % 2 ? C.amber : C.brass; c.fill(); c.lineWidth = 3; c.strokeStyle = ink; c.stroke();
      }
      // inner ring + spoke holes + hub
      circ(c, 0, 0, r * 0.52); c.fillStyle = mix(C.steel, "#ffffff", 0.08); c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
      for (k = 0; k < 5; k++) { var ha = k / 5 * TAU; c.beginPath(); c.ellipse(Math.cos(ha) * r * 0.32, Math.sin(ha) * r * 0.32, r * 0.1, r * 0.13, ha, 0, TAU); c.fillStyle = T.canvas; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); }
      circ(c, 0, 0, r * 0.13); c.fillStyle = C.brass; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
      circ(c, 0, 0, r * 0.05); c.fillStyle = ink; c.fill();
      // index notch (red) so the eye can follow the turn
      rr(c, r - 50, -10, 40, 20, 6); c.fillStyle = C.red; c.fill(); c.lineWidth = 3; c.strokeStyle = ink; c.stroke();
      c.restore();
      // static shine (light from top-left)
      c.beginPath(); c.arc(x, y, r - 22, Math.PI * 1.08, Math.PI * 1.42); c.lineWidth = 9; c.strokeStyle = rgba("#ffffff", 0.35); c.stroke();
    }
    function rotors(c, t, o) {
      frame(c, t, o, function (t) {
        space(c, t, {});
        // axle bar through all three
        rr(c, 520, 120, 40, 1680, 18); c.fillStyle = C.steelL; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
        var P = [[600, 400, 320], [470, 960, 330], [610, 1520, 320]];
        for (var i = 2; i >= 0; i--) {
          var a = rotorAngle(i, t), sp = (rotorAngle(i, t + 0.03) - a) / 0.03;
          rotorWheel(c, i, P[i][0], P[i][1], P[i][2], a, sp);
        }
        // sparks where the wheels touch, on each step
        for (i = 0; i < 2; i++) {
          var st = 0.25 * (i + 1), u = (t % st) / st, k = 1 - sstep(0, 0.4, u), mx = (P[i][0] + P[i + 1][0]) / 2 + 160, my = (P[i][1] + P[i + 1][1]) / 2;
          c.globalCompositeOperation = "lighter"; glow(c, mx, my, 160, C.amber, 0.6 * k); c.globalCompositeOperation = "source-over";
          sparkle(c, mx, my, 40 * k, 26 * k, "#FFFBEA", 0.4 * k, rgba(C.lampHot, 0.9));
        }
        needles(c, t, 0.7);
      });
    }

    /* ======================= BOMBE: wall of drums whirl, lock, lamp flash ======================= */
    var BO = { body: hs(600, 1000, { spacing: 7 }), drum: hs(170, 170, { spacing: 5.5, len: 16 }), cols: ["#F2B544", "#D9574A", "#EFE5CC"] };
    function bombeDrum(c, x, y, r, a, col, lockGlow) {
      c.save(); c.translate(x, y);
      circ(c, 0, 4, r + 10); c.fillStyle = mix(ink, C.bombe, 0.3); c.fill();
      circ(c, 0, 0, r + 6); c.fillStyle = "#1C2133"; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
      c.rotate(a);
      circ(c, 0, 0, r - 4); hfill(c, BO.drum, col, 5, { ha: 0.45 });
      // ring bands + 26 notches
      c.beginPath(); c.arc(0, 0, r * 0.68, 0, TAU); c.lineWidth = 16; c.strokeStyle = mix(col, ink, 0.35); c.stroke();
      c.beginPath(); c.arc(0, 0, r * 0.68, 0, TAU); c.lineWidth = 3; c.strokeStyle = ink; c.stroke();
      for (var k = 0; k < 26; k++) { var aa = k / 26 * TAU; c.beginPath(); c.moveTo(Math.cos(aa) * (r - 6), Math.sin(aa) * (r - 6)); c.lineTo(Math.cos(aa) * (r - (k % 2 ? 18 : 28)), Math.sin(aa) * (r - (k % 2 ? 18 : 28))); c.lineWidth = 3.5; c.strokeStyle = rgba(ink, 0.75); c.stroke(); }
      circ(c, 0, 0, r * 0.36); c.fillStyle = mix(col, "#ffffff", 0.25); c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
      // index pointer
      c.beginPath(); c.moveTo(0, -r + 8); c.lineTo(14, -r * 0.42); c.lineTo(-14, -r * 0.42); c.closePath(); c.fillStyle = ink; c.fill();
      circ(c, 0, 0, 14); c.fillStyle = ink; c.fill(); circ(c, -4, -4, 4); c.fillStyle = "#ffffff"; c.fill();
      c.restore();
      if (lockGlow > 0) { c.globalCompositeOperation = "lighter"; glow(c, x, y, r * 1.6, C.amber, 0.4 * lockGlow); c.globalCompositeOperation = "source-over"; }
    }
    function bombe(c, t, o) {
      frame(c, t, o, function (t, o) {
        var L = o.cycle || 4, u = t % L, cyc = Math.floor(t / L);
        space(c, t, { blobs: false });
        // the Bombe front panel fills the frame
        rr(c, 30, 200, 1020, 1640, 40); hfill(c, BO.body, C.bombe, 7);
        // lamp on top
        var flash = sstep(2.9, 3.0, u) * (1 - sstep(3.3, 3.9, u));
        rr(c, 470, 92, 140, 130, 30); c.fillStyle = mix("#3a2a10", C.lampHot, flash); c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
        rr(c, 440, 196, 200, 34, 12); c.fillStyle = C.steel; c.fill(); c.lineWidth = 5; c.stroke();
        // drums: spin hard, slow down and lock pointing up at 2.9 s, hold, then spin again
        var cols = 3, rows = 4, r = 140;
        for (var row = 0; row < rows; row++) for (var col = 0; col < cols; col++) {
          var i = row * cols + col, x = 210 + col * 330, y = 440 + row * 350;
          var spd = (5 + hash(i) * 6) * (hash(i + 9) > 0.5 ? 1 : -1);
          // angle: integral of a speed that eases to 0 by 2.9 then restarts after 3.5; ends on a full turn (pointer up)
          var run = clamp(u, 0, 2.9), ease = run < 2.2 ? run : 2.2 + (2.9 - 2.2) * (1 - Math.pow(1 - (run - 2.2) / 0.7, 2)) * 0.5;
          var turns = Math.round(spd * 2.55 / TAU), a = ease / 2.55 * turns * TAU;
          if (u > 3.5) a += spd * Math.pow(u - 3.5, 2) * 1.2;
          a += cyc * 0; // each cycle starts from up
          var lockG = sstep(2.85, 2.95, u) * (1 - sstep(3.3, 3.8, u));
          bombeDrum(c, x, y, r, a, BO.cols[(i + row) % 3], lockG);
          // whirl arcs while fast
          var fast = 1 - sstep(1.9, 2.8, u) + sstep(3.6, 4, u);
          if (fast > 0.05) for (var q = 0; q < 2; q++) { c.beginPath(); var a0 = a + q * Math.PI; c.arc(x, y, r + 22, spd > 0 ? a0 - 0.9 : a0, spd > 0 ? a0 : a0 + 0.9); c.lineWidth = 5; c.strokeStyle = rgba(T.light, 0.7 * clamp(fast, 0, 1)); c.stroke(); }
        }
        if (flash > 0) { c.globalCompositeOperation = "lighter"; glow(c, 540, 160, 700, C.amber, 0.7 * flash); glow(c, 540, 160, 200, C.lampHot, 0.9 * flash); c.globalCompositeOperation = "source-over"; sparkle(c, 540, 150, 120 * flash, 70 * flash, "#FFFBEA", 0.6 * flash, rgba(C.lampHot, 0.9)); }
      });
    }

    /* ======================= TURING at his desk: writes fast, sheets fly off ======================= */
    var TU = { desk: hs(560, 200), suit: hs(320, 420, { spacing: 6 }), hair: hs(120, 100, { spacing: 5, len: 14 }), wall: hs(600, 1000, { spacing: 9, len: 30 }), paper: hs(240, 160, { spacing: 7, len: 14 }) };
    function turing(c, t, o) {
      frame(c, t, o, function (t) {
        // night room: wall + window with stars
        c.fillStyle = "#16203F"; c.fillRect(-200, -200, 1480, 2320);
        rr(c, -40, -40, 1160, 2000, 0); hfill(c, TU.wall, "#1A2548", 0, { ha: 0.4, cross: false });
        rr(c, 600, 220, 380, 520, 16); c.fillStyle = T.canvas; c.fill();
        c.save(); c.clip(); c.translate(790, 480); K.drawStars(c, BGL.stars2, t, 30); c.restore();
        sparkle(c, 700 + Math.sin(t) * 6, 330, 20, 14, T.light, 0.3, rgba(T.light, 0.6));
        rr(c, 600, 220, 380, 520, 16); c.lineWidth = 14; c.strokeStyle = "#3a2a1c"; c.stroke(); c.beginPath(); c.moveTo(790, 220); c.lineTo(790, 740); c.moveTo(600, 480); c.lineTo(980, 480); c.lineWidth = 10; c.stroke();
        // lamp light pool (flickers a little)
        var fl = 0.85 + 0.1 * Math.sin(t * 23) * Math.sin(t * 7.1);
        c.globalCompositeOperation = "lighter"; ellipseGlow(c, 700, 1180, 520, 300, C.amber, 0.55 * fl); c.globalCompositeOperation = "source-over";
        // desk lamp: base, stem, arm, shade opening down onto the paper
        c.beginPath(); c.moveTo(940, 1232); c.lineTo(910, 900); c.lineTo(720, 870); c.lineWidth = 16; c.strokeStyle = ink; c.stroke(); c.lineWidth = 9; c.strokeStyle = C.brass; c.stroke();
        rr(c, 890, 1210, 100, 24, 8); c.fillStyle = C.brass; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
        // light cone from the shade mouth to the desk
        c.beginPath(); c.moveTo(640, 950); c.lineTo(780, 950); c.lineTo(900, 1232); c.lineTo(470, 1232); c.closePath(); c.fillStyle = rgba(C.lampHot, 0.13 * fl); c.fill();
        c.beginPath(); c.moveTo(680, 860); c.lineTo(740, 860); c.lineTo(790, 955); c.lineTo(630, 955); c.closePath(); hfill(c, TU.paper, C.green, 6);
        c.globalCompositeOperation = "lighter"; ellipseGlow(c, 710, 960, 120, 40, C.lampHot, 0.8 * fl); c.globalCompositeOperation = "source-over";
        // chair back
        rr(c, 70, 980, 70, 560, 20); hfill(c, TU.desk, C.woodL, 6);
        // body (seated, leaning to the desk, facing right) — a silhouette with tweed hatching, no face detail
        var nod = Math.sin(t * TAU / 1.6) * 0.03 + Math.sin(t * TAU / 0.8) * 0.01;
        c.save(); c.translate(300, 1300); c.rotate(-0.12 + nod * 0.5);
        c.beginPath(); c.moveTo(-170, 200); c.bezierCurveTo(-190, -40, -150, -330, -40, -380); c.bezierCurveTo(60, -400, 140, -330, 160, -230); c.lineTo(190, 200); c.closePath();
        hfill(c, TU.suit, C.tweed, 7);
        // collar + tie hint
        c.beginPath(); c.moveTo(40, -360); c.lineTo(110, -300); c.lineTo(60, -270); c.closePath(); c.fillStyle = C.cream; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
        // head
        c.save(); c.translate(70, -450); c.rotate(nod * 3 + 0.12);
        c.beginPath(); c.ellipse(0, 0, 100, 112, 0, 0, TAU); c.fillStyle = C.skin; c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
        c.beginPath(); c.moveTo(98, 10); c.quadraticCurveTo(122, 30, 100, 44); c.fillStyle = C.skin; c.fill(); c.lineWidth = 6; c.stroke(); // nose bump
        c.beginPath(); c.moveTo(-104, 20); c.bezierCurveTo(-120, -90, -40, -150, 50, -116); c.bezierCurveTo(110, -96, 120, -50, 96, -40); c.bezierCurveTo(40, -80, -10, -40, -30, 10); c.bezierCurveTo(-50, 50, -80, 60, -104, 20); c.closePath();
        hfill(c, TU.hair, "#4A3322", 6);
        c.beginPath(); c.ellipse(-20, 18, 18, 26, 0.2, 0, TAU); c.fillStyle = mix(C.skin, ink, 0.2); c.fill(); c.lineWidth = 4; c.stroke(); // ear
        c.restore();
        c.restore();
        // desk
        rr(c, 120, 1230, 980, 70, 14); hfill(c, TU.desk, C.wood, 7);
        rr(c, 180, 1300, 50, 600, 10); hfill(c, TU.desk, mix(C.wood, ink, 0.2), 6); rr(c, 960, 1300, 50, 600, 10); hfill(c, TU.desk, mix(C.wood, ink, 0.2), 6);
        // cup + steam
        rr(c, 900, 1130, 90, 100, 14); c.fillStyle = C.cream; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
        for (var s = 0; s < 3; s++) { var sp = (t * 0.6 + s / 3) % 1; c.beginPath(); for (var yy = 0; yy < 90; yy += 6) c.lineTo(945 + Math.sin(yy * 0.08 + t * 4 + s) * 14, 1110 - sp * 120 - yy); c.lineWidth = 5; c.strokeStyle = rgba(T.light, 0.5 * (1 - sp)); c.stroke(); }
        // paper pad + writing scribble lines growing (resets with each sheet)
        var per = 0.8, n = Math.floor(t / per), u = (t - n * per) / per;
        rr(c, 460, 1180, 330, 56, 6); c.fillStyle = C.cream; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
        c.save(); c.translate(625, 1205); c.scale(1, 0.18);
        c.beginPath(); for (var l = 0; l < 5; l++) { var lw = clamp(u * 5 - l, 0, 1) * 260; if (lw <= 0) break; c.moveTo(-140, -110 + l * 50); for (var xx = 0; xx < lw; xx += 10) c.lineTo(-140 + xx, -110 + l * 50 + Math.sin(xx * 0.35 + l) * 12); }
        c.lineWidth = 6; c.strokeStyle = rgba(ink, 0.8); c.stroke(); c.restore();
        // writing arm + pencil (zig-zags fast along the line)
        var line = Math.floor(u * 5), lu = u * 5 - line, px = 500 + lu * 260, py = 1196 + line * 2 + Math.sin(t * 60) * 4;
        c.beginPath(); c.moveTo(350, 980); c.quadraticCurveTo(420, 1180, px - 20, py - 10); c.lineWidth = 64; c.strokeStyle = ink; c.stroke(); c.lineWidth = 52; c.strokeStyle = C.tweed; c.stroke();
        circ(c, px - 8, py - 14, 28); c.fillStyle = C.skin; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
        c.save(); c.translate(px, py); c.rotate(-0.9); rr(c, -6, -70, 12, 74, 3); c.fillStyle = C.amber; c.fill(); c.lineWidth = 3; c.stroke(); c.restore();
        // finished sheets fly off to the right, fluttering
        for (var f = 0; f < 3; f++) {
          var age = u * per + f * per; if (n - f < 1) continue;
          var k = age / (per * 3), fx = 640 + k * 900, fy = 1180 - Math.sin(k * Math.PI) * 520 - k * 200, rot = k * 5 + Math.sin(age * 9) * 0.3;
          c.save(); c.translate(fx, fy); c.rotate(rot); c.scale(1, 0.6 + 0.4 * Math.cos(age * 8)); rr(c, -110, -140, 220, 280, 8); hfill(c, TU.paper, C.cream, 5, { ha: 0.25, cross: false });
          c.beginPath(); for (var pl = 0; pl < 6; pl++) { c.moveTo(-80, -100 + pl * 38); c.lineTo(60 - (pl % 3) * 20, -100 + pl * 38); } c.lineWidth = 5; c.strokeStyle = rgba(ink, 0.45); c.stroke(); c.restore();
        }
        // idea spark over the head every other sheet
        var ik = sstep(0, 0.15, u) * (1 - sstep(0.4, 0.8, u)) * (n % 2);
        sparkle(c, 470, 640, 70 * ik, 46 * ik, "#FFFBEA", 0.5 * ik, rgba(C.lampHot, 0.9));
      });
    }

    /* ======================= ROOM: a Bletchley hut room fills with people, lamps on ======================= */
    var RM = { wall: hs(600, 1000, { spacing: 9, len: 28 }), desk: hs(200, 80), top: hs(160, 200, { spacing: 6 }), hair: hs(60, 60, { spacing: 4.5, len: 10 }),
      tops: ["#3E5F96", "#9C4A3C", "#46B3AE", "#7A6A9E", "#B98A4A", "#5C7E5A"], hairs: ["#3A2A1C", "#6B4426", "#1C1A22", "#8A5A2E"] };
    var VP = [540, 640];
    function roomSlot(row, col) { var z = [3.6, 2.5, 1.7, 1.15][row], k = 1 / z, x = VP[0] + (col - 1) * 470 * k, y = VP[1] + 1250 * k; return { x: x, y: y, k: k }; }
    function backFigure(c, x, y, k, i, t, typing) {
      c.save(); c.translate(x, y); c.scale(k, k);
      var sh = typing ? Math.sin(t * 22 + i) * 7 : 0;
      // chair back
      rr(c, -100, -60, 200, 230, 20); hfill(c, RM.desk, C.woodL, 6, { cross: false });
      // torso (cardigan) seen from behind
      c.beginPath(); c.moveTo(-120, 150); c.bezierCurveTo(-130, -40, -100, -150, 0, -160 + sh); c.bezierCurveTo(100, -150, 130, -40, 120, 150); c.closePath();
      c.save(); c.translate(0, 0); hfill(c, RM.top, RM.tops[i % RM.tops.length], 6); c.restore();
      // collar
      c.beginPath(); c.moveTo(-40, -150); c.lineTo(0, -120); c.lineTo(40, -150); c.lineWidth = 10; c.strokeStyle = C.cream; c.stroke();
      // head from behind: all hair, victory rolls on top, bob curls
      var hc = RM.hairs[i % RM.hairs.length];
      c.save(); c.translate(0, -240 + sh * 0.5);
      c.beginPath(); c.ellipse(0, 0, 78, 88, 0, 0, TAU); hfill(c, RM.hair, hc, 6);
      c.beginPath(); c.ellipse(-40, -78, 34, 26, -0.4, 0, TAU); hfill(c, RM.hair, hc, 5); c.beginPath(); c.ellipse(40, -78, 34, 26, 0.4, 0, TAU); hfill(c, RM.hair, hc, 5);
      c.beginPath(); c.moveTo(-80, 30); c.quadraticCurveTo(-95, 90, -50, 84); c.quadraticCurveTo(0, 104, 50, 84); c.quadraticCurveTo(95, 90, 80, 30); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
      c.restore();
      // elbows moving (typing)
      for (var sd = -1; sd <= 1; sd += 2) { circ(c, sd * 130, 30 + (typing ? Math.sin(t * 22 + i + sd) * 6 : 0), 34); c.fillStyle = RM.tops[i % RM.tops.length]; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); }
      c.restore();
    }
    function room(c, t, o) {
      frame(c, t, o, function (t, o) {
        var fillDur = o.fillDur || 2.6, N = 12;
        if (o.push !== false) zoomAt(c, 1 + 0.035 * t, VP[0], VP[1] + 300); // slow dolly into the room
        // walls: back wall + side walls + floor + ceiling, one-point perspective
        c.fillStyle = "#2A3A34"; c.fillRect(-200, -200, 1480, 2320);
        var bx0 = 300, bx1 = 780, by0 = 470, by1 = 860;
        c.beginPath(); c.moveTo(-200, 2120); c.lineTo(bx0, by1); c.lineTo(bx1, by1); c.lineTo(1280, 2120); c.closePath(); hfill(c, RM.wall, "#6E4B2A", 0, { ha: 0.5 }); // floor
        c.beginPath(); for (var b = -8; b <= 8; b++) { c.moveTo(540 + b * 26, by1); c.lineTo(540 + b * 230, 2120); } c.lineWidth = 3; c.strokeStyle = rgba(ink, 0.4); c.stroke();
        c.beginPath(); c.moveTo(-200, -200); c.lineTo(bx0, by0); c.lineTo(bx0, by1); c.lineTo(-200, 2120); c.closePath(); hfill(c, RM.wall, "#4F6A5A", 0); // left wall
        c.beginPath(); c.moveTo(1280, -200); c.lineTo(bx1, by0); c.lineTo(bx1, by1); c.lineTo(1280, 2120); c.closePath(); hfill(c, RM.wall, "#46604F", 0); // right wall
        c.beginPath(); c.moveTo(-200, -200); c.lineTo(1280, -200); c.lineTo(bx1, by0); c.lineTo(bx0, by0); c.closePath(); hfill(c, RM.wall, "#22302A", 0, { cross: false }); // ceiling
        rr(c, bx0, by0, bx1 - bx0, by1 - by0, 0); hfill(c, RM.wall, "#5E7B68", 0); // back wall
        // night windows on the side walls
        for (var w = 0; w < 3; w++) { var k = [0.35, 0.55, 0.85][w], wy = by0 + (380 - by0) * k * 0 ;
          var lx = bx0 - (bx0 + 200) * k * 0.9, top = by0 + (-200 - by0) * k * 0.55 + 60 * k, hgt = (by1 - by0) * (1 + 2.6 * k) * 0.38;
          c.beginPath(); c.rect(lx - 40 * (1 + 2 * k), top + hgt * 0.55, 80 * (1 + 2 * k) * 0.6, hgt * 0.6); c.fillStyle = T.canvas; c.fill(); c.lineWidth = 6; c.strokeStyle = "#2a1c12"; c.stroke();
          c.beginPath(); c.rect(1080 - lx - 40 * (1 + 2 * k) * 0.6 + 40 * (1 + 2 * k) - 40 * (1 + 2 * k), top + hgt * 0.55, 80 * (1 + 2 * k) * 0.6, hgt * 0.6); c.fillStyle = T.canvas; c.fill(); c.stroke(); }
        // people arrive back row first, each with a bob; each row's ceiling lamp lights when its first person sits
        var order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        for (var row = 0; row < 4; row++) {
          var sl = roomSlot(row, 1), lampOn = sstep(0, 0.12, t - (row * 3) / N * fillDur);
          // hanging lamp
          var lx2 = sl.x + Math.sin(t * 2.4 + row) * 40 * sl.k, ly2 = VP[1] - 520 * sl.k - 120;
          c.beginPath(); c.moveTo(sl.x, -200); c.lineTo(lx2, ly2); c.lineWidth = 4 * sl.k + 1; c.strokeStyle = ink; c.stroke();
          c.save(); c.translate(lx2, ly2); c.scale(sl.k * 1.4, sl.k * 1.4);
          c.beginPath(); c.moveTo(-70, 40); c.quadraticCurveTo(0, -60, 70, 40); c.closePath(); hfill(c, RM.desk, C.green, 6, { cross: false });
          circ(c, 0, 46, 18); c.fillStyle = mix("#3a3a2a", C.lampHot, lampOn); c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
          c.restore();
          if (lampOn > 0) { c.globalCompositeOperation = "lighter"; ellipseGlow(c, lx2, ly2 + 300 * sl.k, 700 * sl.k + 120, 500 * sl.k + 80, C.amber, 0.35 * lampOn); c.globalCompositeOperation = "source-over"; }
        }
        for (row = 0; row < 4; row++) for (var col = 0; col < 3; col++) {
          var i = row * 3 + col, s = roomSlot(row, col), ta = order[i] / N * fillDur, u = (t - ta) / 0.35;
          // desk (top edge visible past the figure)
          c.save(); c.translate(s.x, s.y - 300 * s.k); c.scale(s.k, s.k);
          rr(c, -190, -40, 380, 80, 10); hfill(c, RM.desk, C.woodL, 6);
          rr(c, -60, -110, 120, 74, 12); c.fillStyle = "#1C2133"; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke(); // typewriter
          rr(c, -40, -150, 80, 50, 4); c.fillStyle = C.cream; c.fill(); c.lineWidth = 4; c.stroke();
          c.restore();
          if (u <= 0) continue;
          var pop = backOut(u), bob = Math.max(0, Math.sin(clamp(u, 0, 1) * Math.PI)) * 30;
          backFigure(c, s.x, s.y + (1 - pop) * 200 * s.k - bob * s.k, s.k * 1.05, i, t, u > 1.2);
          if (u < 1.2) sparkle(c, s.x + 120 * s.k, s.y - 420 * s.k, 40 * s.k * (1 - clamp(u - 0.4, 0, 1)), 26 * s.k, "#FFFBEA", 0.3, rgba(C.lampHot, 0.8));
        }
      });
    }

    /* ======================= HUTS: a big Bletchley hut at night, windows light one by one, smoke ======================= */
    var HU = { wall: hs(560, 340, { angle: -0.3, spacing: 8, len: 30 }), roof: hs(600, 200, { spacing: 6 }), ground: hs(700, 300, { spacing: 7 }), puff: K.blob(90, 70, "greyLilac", 0.85), tree: hs(200, 400) };
    function huts(c, t, o) {
      frame(c, t, o, function (t, o) {
        if (o.push !== false) zoomAt(c, 1 + 0.03 * t, 540, 1150);
        space(c, t, { blobA: 0.6 });
        // moon
        var moon = K.planet(110, "light"); K.drawPlanet(c, moon, 800 - t * 6, 380, 1, 0, false);
        c.globalCompositeOperation = "lighter"; glow(c, 800 - t * 6, 380, 360, T.light, 0.18); c.globalCompositeOperation = "source-over";
        // trees behind (slower parallax)
        for (var tr = 0; tr < 3; tr++) { var tx = [120, 980, 560][tr] - t * 10, ty = 960; c.beginPath(); c.moveTo(tx, ty - 520); c.lineTo(tx + 170, ty + 60); c.lineTo(tx - 170, ty + 60); c.closePath(); hfill(c, HU.tree, "#1E3A2E", 5); }
        // ground
        c.beginPath(); c.moveTo(-200, 1440); c.quadraticCurveTo(540, 1380, 1280, 1440); c.lineTo(1280, 2120); c.lineTo(-200, 2120); c.closePath(); hfill(c, HU.ground, "#2F4A36", 6);
        // hut body
        c.save(); c.translate(540, 1240); c.scale(1.22, 1.22);
        rr(c, -480, -200, 960, 360, 6); hfill(c, HU.wall, "#5B6E50", 7);
        c.beginPath(); for (var pl = -150; pl < 160; pl += 44) { c.moveTo(-476, pl); c.lineTo(476, pl); } c.lineWidth = 3; c.strokeStyle = rgba(ink, 0.45); c.stroke();
        // roof
        c.beginPath(); c.moveTo(-540, -190); c.lineTo(-430, -400); c.lineTo(430, -400); c.lineTo(540, -190); c.closePath(); hfill(c, HU.roof, "#3B3530", 7);
        // chimney + smoke puffs (rise, grow, drift)
        rr(c, 270, -480, 80, 150, 6); hfill(c, HU.roof, "#7A4436", 6);
        for (var p = 0; p < 5; p++) { var pu = ((t * 0.55) + p / 5) % 1, sc = 0.4 + pu * 1.1; K.drawBlob(c, HU.puff, 310 + pu * 160 + Math.sin(pu * 6 + p) * 20, -520 - pu * 520, sc, pu * 1.2, 0.9 * (1 - pu)); }
        // windows: light up one by one, people pass behind them
        var per = o.step || 0.45;
        for (var wi = 0; wi < 5; wi++) {
          var wx = -400 + wi * 170, on = sstep(0, 0.1, t - wi * per) * (0.9 + 0.1 * Math.sin(t * 17 + wi * 3));
          if (wi === 2) { rr(c, wx - 10, -130, 140, 290, 6); c.fillStyle = "#3A2A1C"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); circ(c, wx + 100, 20, 8); c.fillStyle = C.brass; c.fill(); continue; } // door
          rr(c, wx, -130, 120, 150, 6); c.fillStyle = mix(T.canvas, C.lampHot, on); c.fill();
          var walker = ((t * 0.9 + wi * 0.37) % 2) - 0.5; // silhouette slides past
          if (on > 0.5) { c.save(); rr(c, wx, -130, 120, 150, 6); c.clip(); circ(c, wx + walker * 160, -60, 26); c.fillStyle = rgba(ink, 0.7); c.fill(); rr(c, wx + walker * 160 - 36, -36, 72, 80, 20); c.fill(); c.restore(); }
          rr(c, wx, -130, 120, 150, 6); c.lineWidth = 7; c.strokeStyle = "#2a1c12"; c.stroke(); c.beginPath(); c.moveTo(wx + 60, -130); c.lineTo(wx + 60, 20); c.moveTo(wx, -55); c.lineTo(wx + 120, -55); c.lineWidth = 5; c.stroke();
          if (on > 0) { c.globalCompositeOperation = "lighter"; glow(c, wx + 60, -55, 240, C.amber, 0.45 * on); c.globalCompositeOperation = "source-over"; }
          // light spill on the ground
          if (on > 0) { c.beginPath(); c.moveTo(wx, 160); c.lineTo(wx + 120, 160); c.lineTo(wx + 170, 360); c.lineTo(wx - 50, 360); c.closePath(); c.fillStyle = rgba(C.amber, 0.14 * on); c.fill(); }
        }
        c.restore();
        needles(c, t, 0.8);
      });
    }

    /* ======================= COLOSSUS: tape races round the pulleys, valves flicker ======================= */
    var CO = { rack: hs(600, 1000, { spacing: 8 }), pul: hs(200, 200, { spacing: 5, len: 14 }), box: hs(160, 160) };
    function pulley(c, x, y, r, a) {
      c.save(); c.translate(x, y);
      circ(c, 0, 0, r); hfill(c, CO.pul, "#B7B2A2", 6, { ha: 0.4 });
      c.rotate(a);
      for (var k = 0; k < 6; k++) { c.save(); c.rotate(k / 6 * TAU); rr(c, -9, r * 0.2, 18, r * 0.66, 8); c.fillStyle = C.steel; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); c.restore(); }
      circ(c, 0, 0, r * 0.22); c.fillStyle = C.brass; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
      c.restore();
      c.beginPath(); c.arc(x, y, r - 14, Math.PI * 1.1, Math.PI * 1.45); c.lineWidth = 8; c.strokeStyle = rgba("#ffffff", 0.35); c.stroke();
    }
    function colossus(c, t, o) {
      frame(c, t, o, function (t) {
        c.fillStyle = "#0B1024"; c.fillRect(-200, -200, 1480, 2320);
        // valve rack fills the frame
        rr(c, 20, 60, 1040, 1800, 24); hfill(c, CO.rack, "#2B3550", 7);
        for (var row = 0; row < 11; row++) for (var col = 0; col < 7; col++) {
          var x = 110 + col * 145, y = 150 + row * 160, i = row * 7 + col;
          var on = 0.25 + 0.75 * sstep(0.45, 0.6, Math.sin(t * (5 + hash(i) * 7) + hash(i + 40) * 6 + row * 0.6 - t * 3));
          rr(c, x - 34, y - 52, 68, 104, 30); c.fillStyle = mix("#2E3A5A", "#FFC46B", on * 0.75); c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
          c.beginPath(); c.moveTo(x - 10, y + 20); c.lineTo(x - 10, y - 10); c.lineTo(x + 10, y - 10); c.lineTo(x + 10, y + 20); c.lineWidth = 4; c.strokeStyle = on > 0.5 ? "#FFF2C8" : rgba(ink, 0.6); c.stroke();
          rr(c, x - 38, y + 46, 76, 22, 6); c.fillStyle = "#151B2E"; c.fill(); c.stroke();
          if (on > 0.55) { c.globalCompositeOperation = "lighter"; glow(c, x, y, 90, "#FFB347", 0.35 * on); c.globalCompositeOperation = "source-over"; }
        }
        // tape loop: big pulleys on the left, guides on the right, tape races round
        var P = [[300, 520, 190], [300, 1400, 190], [800, 600, 100], [800, 1320, 100]], sp = 9; // rad/s on the big ones
        // tape path: around the outside
        var path = new Path2D(); path.moveTo(110, 520); path.arc(300, 520, 190, Math.PI, Math.PI * 1.5); path.lineTo(800, 500); path.arc(800, 600, 100, -Math.PI / 2, 0);
        path.lineTo(900, 1320); path.arc(800, 1320, 100, 0, Math.PI / 2); path.lineTo(300, 1590); path.arc(300, 1400, 190, Math.PI / 2, Math.PI); path.closePath();
        c.lineWidth = 58; c.strokeStyle = ink; c.stroke(path); c.lineWidth = 48; c.strokeStyle = "#F3E6C4"; c.stroke(path);
        // holes streaming along the tape
        c.setLineDash([4, 26]); c.lineDashOffset = -t * 900; c.lineWidth = 12; c.strokeStyle = rgba(ink, 0.75); c.stroke(path);
        c.setLineDash([3, 41]); c.lineDashOffset = -t * 900 + 11; c.lineWidth = 8; c.stroke(path); c.setLineDash([]);
        // speed streaks on the straight runs
        for (var q = 0; q < 6; q++) { var su = ((t * 3 + q / 6) % 1); c.beginPath(); c.moveTo(380 + su * 380, 470 - (q % 2) * 18); c.lineTo(380 + su * 380 + 70, 470 - (q % 2) * 18); c.lineWidth = 4; c.strokeStyle = rgba(T.light, 0.7); c.stroke(); }
        for (var pi = 0; pi < 4; pi++) pulley(c, P[pi][0], P[pi][1], P[pi][2] - 30, t * sp * 190 / P[pi][2]);
        // photo reader on the right run: light flashes through the holes
        var flash = 0.5 + 0.5 * Math.sin(t * 40) * Math.sin(t * 13);
        rr(c, 820, 860, 200, 200, 20); hfill(c, CO.box, "#5A6C9A", 6);
        c.globalCompositeOperation = "lighter"; glow(c, 900, 960, 260, "#BFE3FF", 0.5 * flash); glow(c, 900, 960, 70, "#FFFFFF", 0.7 * flash); c.globalCompositeOperation = "source-over";
        sparkle(c, 900, 960, 60 * flash, 40 * flash, "#FFFFFF", 0.3, rgba("#BFE3FF", 0.8));
      });
    }

    /* ======================= CHALK: Dartmouth board, chalk writes a doodle on (no words) ======================= */
    var CH = { board: hs(560, 760, { spacing: 10, len: 30 }), frame: hs(600, 1000, { spacing: 6 }), strokes: [], total: 0 };
    (function buildChalk() {
      function jit(pts, a) { var out = [], prev = null; for (var i = 0; i < pts.length - 1; i++) { var p = pts[i], q = pts[i + 1], d = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(2, Math.ceil(d / 12)); for (var k = 0; k < n; k++) { var u = k / n; out.push([p[0] + (q[0] - p[0]) * u + R(-a, a), p[1] + (q[1] - p[1]) * u + R(-a, a)]); } } out.push(pts[pts.length - 1]); return out; }
      function circlePts(x, y, r, a0) { var p = []; for (var k = 0; k <= 30; k++) { var a = a0 + k / 28 * TAU; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return p; }
      function add(pts, w) { var s = jit(pts, 2.2), L = 0; for (var i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); CH.strokes.push({ p: s, L: L, w: w || 9 }); CH.total += L; }
      // a little network: 3 inputs → 4 → 2, drawn node by node with its links
      var L1 = [[230, 520], [230, 760], [230, 1000]], L2 = [[520, 420], [520, 640], [520, 860], [520, 1080]], L3 = [[810, 620], [810, 880]];
      L1.forEach(function (p) { add(circlePts(p[0], p[1], 44, R(0, 6))); });
      L1.forEach(function (a) { L2.forEach(function (b) { add([[a[0] + 44, a[1]], [b[0] - 44, b[1]]], 6); }); });
      L2.forEach(function (p) { add(circlePts(p[0], p[1], 44, R(0, 6))); });
      L2.forEach(function (a) { L3.forEach(function (b) { add([[a[0] + 44, a[1]], [b[0] - 44, b[1]]], 6); }); });
      L3.forEach(function (p) { add(circlePts(p[0], p[1], 50, R(0, 6))); });
      // arrow down to a light bulb
      add([[810, 960], [810, 1180]], 9); add([[770, 1140], [810, 1185], [850, 1140]], 9);
      var bulb = []; for (var k = 0; k <= 34; k++) { var a = Math.PI * 0.72 + k / 34 * Math.PI * 1.56; bulb.push([540 + Math.cos(a) * 120, 1330 + Math.sin(a) * 120]); }
      bulb.push([490, 1480]); bulb.push([590, 1480]); bulb.push(bulb[0]); // close via the base
      add([[690, 1250], [600, 1300]], 8); add(bulb, 10);
      add([[495, 1500], [585, 1500]], 8); add([[500, 1525], [580, 1525]], 8);
      add([[505, 1380], [525, 1330], [545, 1380], [565, 1330], [580, 1380]], 7); // filament
      for (var ry = 0; ry < 5; ry++) { var ra = -Math.PI * 0.95 + ry * 0.45; add([[540 + Math.cos(ra) * 150, 1330 + Math.sin(ra) * 150], [540 + Math.cos(ra) * 200, 1330 + Math.sin(ra) * 200]], 8); } // rays
      // underline swoosh + a star doodle
      add([[150, 1620], [400, 1600], [700, 1630], [930, 1605]], 9);
      var star = []; for (k = 0; k <= 10; k++) { var sa = -Math.PI / 2 + k * Math.PI * 2 / 5 * 2 / 2, rad = k % 2 ? 26 : 62; star.push([210 + Math.cos(-Math.PI / 2 + k * Math.PI / 5) * rad, 1330 + Math.sin(-Math.PI / 2 + k * Math.PI / 5) * rad]); }
      add(star, 8);
    })();
    function chalkTip(d) { // point at distance d along all strokes
      for (var i = 0; i < CH.strokes.length; i++) { var s = CH.strokes[i]; if (d <= s.L) { for (var k = 1; k < s.p.length; k++) { var a = s.p[k - 1], b = s.p[k], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) return [a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l]; d -= l; } } else d -= s.L; }
      var last = CH.strokes[CH.strokes.length - 1].p; return last[last.length - 1];
    }
    function chalk(c, t, o) {
      frame(c, t, o, function (t, o) {
        var dur = o.dur || 3.2, ease = clamp(t / dur, 0, 1), done = ease * CH.total;
        var erase = o.loop ? sstep(dur + 0.25, (o.loopLen || 4) - 0.05, t) : 0;
        if (o.follow !== false) { // camera rides the chalk: close on the tip while writing, pulls back to the whole board at the end
          var back = sstep(dur - 0.5, dur + 0.3, t), tp = chalkTip(Math.min(done, CH.total)), fz = 1 + 0.45 * (1 - back);
          var fx = 540 + (tp[0] - 540) * (1 - back), fy = 960 + (tp[1] - 960) * (1 - back);
          fx = clamp(fx, 40 + 540 / fz, 1040 - 540 / fz); fy = clamp(fy, 160 + 960 / fz, 1800 - 960 / fz); // stay on the board
          c.translate(540, 960); c.scale(fz, fz); c.translate(-fx, -fy);
        }
        c.fillStyle = "#3a2a1c"; c.fillRect(-200, -200, 1480, 2320);
        rr(c, 20, 140, 1040, 1640, 30); hfill(c, CH.frame, C.wood, 7);
        rr(c, 70, 190, 940, 1540, 12); hfill(c, CH.board, C.slate, 6, { ha: 0.35, cross: false });
        // old chalk smudges
        c.globalAlpha = 0.07; c.fillStyle = C.chalk; c.beginPath(); c.ellipse(300, 400, 220, 70, -0.2, 0, TAU); c.ellipse(760, 1500, 200, 60, 0.15, 0, TAU); c.fill(); c.globalAlpha = 1;
        // chalk tray
        rr(c, 40, 1740, 1000, 40, 8); hfill(c, CH.frame, C.woodL, 5); rr(c, 700, 1712, 140, 34, 6); c.fillStyle = "#4a3a2a"; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
        // strokes written so far (chalk: soft wide line + grainy core)
        c.save(); rr(c, 70, 190, 940, 1540, 12); c.clip();
        var left = done;
        for (var i = 0; i < CH.strokes.length && left > 0; i++) {
          var s = CH.strokes[i], upto = Math.min(left, s.L); left -= s.L;
          c.beginPath(); var acc = 0; c.moveTo(s.p[0][0], s.p[0][1]);
          for (var k = 1; k < s.p.length; k++) { var a = s.p[k - 1], b = s.p[k], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc + l >= upto) { var u = (upto - acc) / l; c.lineTo(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u); break; } c.lineTo(b[0], b[1]); acc += l; }
          c.lineWidth = s.w + 6; c.strokeStyle = rgba(C.chalk, 0.18); c.stroke();
          c.lineWidth = s.w; c.strokeStyle = rgba(C.chalk, 0.85); c.stroke();
          c.setLineDash([3, 5]); c.lineWidth = s.w * 0.5; c.strokeStyle = rgba(C.slate, 0.45); c.stroke(); c.setLineDash([]);
        }
        // bulb lights when the doodle is finished
        var lit = sstep(dur, dur + 0.3, t) * (1 - erase);
        if (lit > 0) { c.globalCompositeOperation = "lighter"; glow(c, 540, 1330, 420, "#FFE7A6", 0.45 * lit); c.globalCompositeOperation = "source-over"; sparkle(c, 540, 1330, 90 * lit, 60 * lit, "#FFFBEA", 0.5 * lit, rgba("#FFE7A6", 0.9)); }
        // eraser wipe for loops
        if (erase > 0) { var ex = -300 + erase * 1700; c.fillStyle = C.slate; c.fillRect(-200, 0, ex + 200, 2000); c.save(); c.translate(ex, 0); c.globalAlpha = 0.3; c.fillStyle = C.chalk; c.fillRect(-60, 0, 60, 2000); c.restore(); c.globalAlpha = 1; }
        c.restore();
        if (erase > 0) { var exx = -300 + erase * 1700; rr(c, exx - 80, 700 + Math.sin(erase * 30) * 200, 160, 90, 14); c.fillStyle = "#6B4426"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); }
        // chalk stick at the tip with hand wobble + dust falling from recent positions
        if (ease < 1) {
          var tip = chalkTip(done), wob = Math.sin(t * 31) * 3;
          for (var dI = 1; dI <= 8; dI++) { var age = dI * 0.06, pt = chalkTip(clamp((t - age) / dur, 0, 1) * CH.total); circ(c, pt[0] + hash(dI) * 14 - 7, pt[1] + age * 260, 3 + hash(dI + 5) * 3); c.fillStyle = rgba(C.chalk, 0.6 * (1 - dI / 9)); c.fill(); }
          c.save(); c.translate(tip[0] + wob, tip[1] + wob * 0.5); c.rotate(-0.7); rr(c, -12, -120, 24, 124, 8); c.fillStyle = C.chalk; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke(); c.restore();
        }
      });
    }

    return { enigma: enigma, rotors: rotors, bombe: bombe, turing: turing, room: room, huts: huts, colossus: colossus, chalk: chalk, space: space };
  }

  window.EP01 = { create: create, theme: theme, colours: C, twos: twos,
    SCENES: ["enigma", "rotors", "bombe", "turing", "room", "huts", "colossus", "chalk"] };
})();
