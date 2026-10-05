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
    var GR = hs(160, 160, { spacing: 5, len: 12 });
    function gear(c, x, y, r, n, a, col) {
      c.save(); c.translate(x, y); c.rotate(a); c.beginPath();
      for (var i = 0; i < n * 4; i++) { var aa = i / (n * 4) * TAU, rad = (i % 4 < 2) ? r : r * 0.8; c.lineTo(Math.cos(aa) * rad, Math.sin(aa) * rad); }
      c.closePath(); hfill(c, GR, col, 6);
      circ(c, 0, 0, r * 0.32); c.fillStyle = ink; c.fill(); circ(c, 0, 0, r * 0.14); c.fillStyle = C.cream; c.fill();
      c.restore();
    }
    // turing o: { bulbAt (s: a bulb pops above his head and lights with a ray burst), gearsAt (s: gears slide into his head and click), stack: true (the finished
    //   paper piles up taller than the frame and tilts, instead of flying off) }
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
        if (o.stack) { // paper stack on the desk grows past the top of the frame and starts to sway
          var cnt = Math.floor(t * 28), hgt = cnt * 13, sway = Math.pow(clamp(hgt / 1300, 0, 1), 2) * 0.12 * Math.sin(t * 2.2);
          c.save(); c.translate(860, 1232); c.rotate(sway);
          rr(c, -120, -hgt, 240, hgt, 6); hfill(c, TU.paper, C.cream, 6, { ha: 0.2, cross: false });
          c.beginPath(); for (var sh = 13; sh < hgt; sh += 13) { var jx = (hash(sh) - 0.5) * 16; c.moveTo(-120 + jx, -sh); c.lineTo(120 + jx, -sh); } c.lineWidth = 2.5; c.strokeStyle = rgba(ink, 0.4); c.stroke();
          var dropU = (t * 28) % 1; c.save(); c.translate(0, -hgt - 13 - (1 - dropU) * 120); c.rotate((1 - dropU) * 0.5); rr(c, -120, -6, 240, 12, 3); c.fillStyle = C.cream; c.fill(); c.lineWidth = 3; c.strokeStyle = ink; c.stroke(); c.restore();
          c.restore();
        }
        for (var f = 0; f < 3 && !o.stack; f++) {
          var age = u * per + f * per; if (n - f < 1) continue;
          var k = age / (per * 3), fx = 640 + k * 900, fy = 1180 - Math.sin(k * Math.PI) * 520 - k * 200, rot = k * 5 + Math.sin(age * 9) * 0.3;
          c.save(); c.translate(fx, fy); c.rotate(rot); c.scale(1, 0.6 + 0.4 * Math.cos(age * 8)); rr(c, -110, -140, 220, 280, 8); hfill(c, TU.paper, C.cream, 5, { ha: 0.25, cross: false });
          c.beginPath(); for (var pl = 0; pl < 6; pl++) { c.moveTo(-80, -100 + pl * 38); c.lineTo(60 - (pl % 3) * 20, -100 + pl * 38); } c.lineWidth = 5; c.strokeStyle = rgba(ink, 0.45); c.stroke(); c.restore();
        }
        // idea spark over the head every other sheet
        var ik = sstep(0, 0.15, u) * (1 - sstep(0.4, 0.8, u)) * (n % 2);
        if (o.bulbAt == null && o.gearsAt == null) sparkle(c, 470, 640, 70 * ik, 46 * ik, "#FFFBEA", 0.5 * ik, rgba(C.lampHot, 0.9));
        if (o.gearsAt != null) { // gears slide into his head from both sides and click together, then turn in sync
          var gu = clamp((t - o.gearsAt) / 0.35, 0, 1), ge = backOut(gu), gs = t > o.gearsAt + 0.35 ? (t - o.gearsAt - 0.35) * 2.4 : 0;
          var hx = 372, hy = 842;
          c.globalCompositeOperation = "lighter"; glow(c, hx, hy, 300, C.amber, 0.35 * gu); c.globalCompositeOperation = "source-over";
          gear(c, hx - 60 - (1 - ge) * 600, hy - 20, 112, 10, gs, C.amber);
          gear(c, hx + 120 + (1 - ge) * 600, hy + 50, 84, 8, -gs * 112 / 84 + 0.2, T.a4);
          gear(c, hx + 60, hy - 170 - (1 - ge) * 700, 64, 7, -gs * 112 / 64, C.red);
          var ck = sstep(0.3, 0.36, gu) * (1 - sstep(0.4, 0.8, (t - o.gearsAt)));
          sparkle(c, hx + 30, hy - 10, 60 * ck, 40 * ck, "#FFFBEA", 0.5 * ck, rgba(C.lampHot, 0.9));
        }
        if (o.bulbAt != null) { // a bulb pops above his head, lights, ray burst
          var bu = clamp((t - o.bulbAt) / 0.25, 0, 1), bon = sstep(o.bulbAt + 0.15, o.bulbAt + 0.25, t), bx = 400, by = 560, bs = backOut(bu) * 1.3;
          if (bu > 0) {
            if (bon > 0) {
              c.globalCompositeOperation = "lighter"; glow(c, bx, by, 900, C.amber, 0.6 * bon); glow(c, bx, by, 220, "#FFFFFF", 0.7 * bon); c.globalCompositeOperation = "source-over";
              c.save(); c.translate(bx, by); c.rotate(t * 0.8); for (var ry = 0; ry < 16; ry++) { c.rotate(TAU / 16); var rl = 260 + 900 * sstep(o.bulbAt + 0.15, o.bulbAt + 0.5, t); c.beginPath(); c.moveTo(150, -10); c.lineTo(rl, -40); c.lineTo(rl, 40); c.lineTo(150, 10); c.closePath(); c.fillStyle = rgba(ry % 2 ? C.lampHot : C.amber, 0.25 * bon); c.fill(); } c.restore();
            }
            c.save(); c.translate(bx, by); c.scale(bs, bs);
            c.beginPath(); c.arc(0, -20, 90, Math.PI * 0.78, Math.PI * 2.22); c.lineTo(36, 100); c.lineTo(-36, 100); c.closePath(); c.fillStyle = mix("#D8D2BE", "#FFF6C8", bon); c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
            c.beginPath(); c.moveTo(-20, 60); c.lineTo(-10, -10); c.lineTo(0, 30); c.lineTo(10, -10); c.lineTo(20, 60); c.lineWidth = 5; c.strokeStyle = bon > 0.5 ? C.amber : rgba(ink, 0.6); c.stroke();
            rr(c, -40, 100, 80, 50, 10); c.fillStyle = "#9A9488"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); c.beginPath(); c.moveTo(-40, 116); c.lineTo(40, 116); c.moveTo(-40, 132); c.lineTo(40, 132); c.lineWidth = 4; c.stroke();
            c.restore();
          }
        }
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
          var chase = (col + row) % 18 === Math.floor(t * 18) % 18 || (col - row + 18) % 18 === Math.floor(t * 18 + 9) % 18; // running lights sweep the rack
          var on = Math.min(1, 0.2 + 0.6 * sstep(0.45, 0.6, Math.sin(t * (5 + hash(i) * 7) + hash(i + 40) * 6 + row * 0.6 - t * 3)) + (chase ? 0.8 : 0));
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


    /* ======================= MAP: Europe 1939 as weather (no soldiers, no weapons) =======================
       o: { storm 0..1 (clouds over the map), lightning true, glowAt (s: Germany turns amber), pinAt (s: a pin drops on Berlin),
            clearAt (s: the clouds are pulled away fast and the sun breaks in) } */
    function proj(p) { return [540 + (p[0] - 11) * 46, 960 - (p[1] - 51) * 70]; }
    var MAPP = {
      iberia: [[-9, 43.5], [-1.5, 43.4], [3.2, 42.4], [0.5, 40.5], [-0.5, 38.5], [-2, 36.7], [-5.5, 36], [-7, 37], [-8.9, 37], [-8.8, 40]],
      france: [[-1.5, 43.4], [-1.8, 46.5], [-4.6, 48.4], [-1.5, 48.7], [1.5, 50.9], [2.5, 51.1], [4.2, 49.9], [6.2, 49.5], [8.2, 49], [7.6, 47.6], [6.8, 46.3], [7.5, 43.8], [3.2, 43.3], [3.2, 42.4]],
      benelux: [[2.5, 51.1], [3.4, 51.4], [4.8, 53.2], [7.1, 53.5], [6.0, 50.8], [6.2, 49.5], [4.2, 49.9]],
      germany: [[7.1, 53.5], [8.6, 54.9], [11, 54], [14.2, 53.9], [14.6, 52.6], [15, 51.1], [12.1, 50.3], [13.8, 48.7], [16.9, 48.6], [16.5, 47], [13, 46.6], [10.5, 47.5], [7.6, 47.6], [8.2, 49], [6.2, 49.5], [6.0, 50.8]],
      prussia: [[19.5, 54.4], [22.8, 54.4], [22.6, 55.1], [21.2, 55.2], [19.6, 54.6]],
      denmark: [[8.1, 55.5], [8.6, 57.1], [10.6, 57.7], [10.5, 56.2], [10.9, 56], [9.6, 55], [8.6, 54.9]],
      poland: [[14.2, 53.9], [19.5, 54.4], [22.8, 54.4], [24, 53], [24, 50.5], [22.6, 49.1], [19, 49.4], [16.9, 50.4], [15, 51.1], [14.6, 52.6]],
      czech: [[12.1, 50.3], [15, 51.1], [16.9, 50.4], [19, 49.4], [22.6, 49.1], [22, 48.4], [17.2, 47.8], [16.9, 48.6], [13.8, 48.7]],
      italy: [[6.8, 46.3], [10.5, 46.8], [13.7, 46.5], [13.6, 45.6], [12.3, 44.9], [13.6, 43.5], [16, 41.9], [18.5, 40.1], [16.9, 40.4], [16.6, 38.9], [15.7, 38], [15.6, 40], [13, 41.2], [11, 42.4], [10.2, 43.9], [8.7, 44.4], [7.5, 43.8]],
      balkans: [[16.5, 47], [22, 48.4], [24, 50.5], [28, 48], [29.5, 45], [28, 41.5], [26, 40.8], [24, 40], [22, 37], [21, 39], [19.4, 41.8], [15.5, 44.5], [13.6, 45.6], [13.7, 46.5]],
      east: [[24, 53], [24, 50.5], [28, 48], [29.5, 45], [36, 45], [36, 62], [30, 62], [28, 60], [27, 57.5], [21, 57], [21.2, 55.2], [22.6, 55.1], [22.8, 54.4]],
      britain: [[-5.7, 50.1], [1.4, 51.1], [1.7, 52.7], [0.2, 53.5], [-1.6, 55.6], [-2, 57.7], [-3.1, 58.6], [-5, 58.6], [-6.2, 56.6], [-5, 55], [-3, 54.9], [-3.2, 53.3], [-4.7, 52.8], [-5.2, 51.7], [-3.3, 51.4]],
      ireland: [[-6, 52.2], [-6.3, 54.1], [-7.5, 55.3], [-8.6, 54.3], [-10, 53.4], [-9.9, 51.7], [-8, 51.6]],
      scandi: [[5, 59], [5.3, 62.3], [10, 64], [14, 67], [18, 69.6], [25, 71], [28, 70.6], [25, 68.5], [23.5, 66], [21.5, 65], [17.6, 62.5], [18.8, 60], [16.5, 57.5], [14.2, 55.4], [12.6, 56.2], [11.5, 58.9], [10.5, 59.3], [8, 58], [5.7, 58.1]]
    };
    var MAPC = { iberia: "#C9B98A", france: "#B7C39A", benelux: "#C9B98A", germany: "#B9AE96", prussia: "#B9AE96", denmark: "#C3C9A0", poland: "#CDB98F", czech: "#BFC6A2",
      italy: "#CDBB8E", balkans: "#B9C39E", east: "#C2B48E", britain: "#A9C3A0", ireland: "#B7CDA4", scandi: "#BDC7A4" };
    var MP = { land: hs(700, 1100, { spacing: 7, len: 18 }), sea: K.hatch(700, 1100, { angle: 0, spacing: 22, len: 26, gapMin: 30, gapMax: 90, jit: 0.02 }),
      cloud: [K.blob(340, 210, "magD", 0.92, { spacing: 5 }), K.blob(300, 190, "violet", 0.9, { spacing: 5 }), K.blob(380, 220, "maroon", 0.92, { spacing: 5 }), K.blob(280, 180, "mauve", 0.9, { spacing: 5 }), K.blob(320, 200, "magD", 0.9, { spacing: 5 })],
      rain: K.hatch(700, 1100, { angle: 1.25, spacing: 18, len: 40, gapMin: 40, gapMax: 160, jit: 0.03 }) };
    MP.paths = {}; for (var mk in MAPP) { var mpth = new Path2D(); MAPP[mk].forEach(function (p, i) { var q = proj(p); if (i) mpth.lineTo(q[0], q[1]); else mpth.moveTo(q[0], q[1]); }); mpth.closePath(); MP.paths[mk] = mpth; }
    var CLOUDP = [[260, 560], [760, 640], [520, 900], [180, 1180], [860, 1120]];
    function bolt(c, x, y, len, seed, a) {
      if (a <= 0) return;
      var pts = [[x, y]], cx = x, cy = y; for (var i = 1; i <= 9; i++) { cx += (hash(seed + i) - 0.5) * 90; cy += len / 9; pts.push([cx, cy]); }
      c.globalCompositeOperation = "lighter"; glow(c, x, y + len / 2, len * 0.8, "#BFD0FF", 0.5 * a); c.globalCompositeOperation = "source-over";
      c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
      c.lineWidth = 16; c.strokeStyle = rgba(ink, 0.8 * a); c.stroke(); c.lineWidth = 9; c.strokeStyle = rgba("#FFF6C8", a); c.stroke();
    }
    function map(c, t, o) {
      frame(c, t, o, function (t, o) {
        var storm = o.storm == null ? 1 : o.storm, clr = o.clearAt == null ? 0 : sstep(o.clearAt, o.clearAt + 0.45, t), cl = storm * (1 - clr);
        var gl = o.glowAt == null ? 0 : sstep(o.glowAt, o.glowAt + 0.15, t), pin = o.pinAt == null ? -1 : t - o.pinAt;
        if (o.push !== false) zoomAt(c, 1 + 0.12 * t, proj([12, 51.5])[0], proj([12, 51.5])[1]); // steady push toward Germany
        // sea
        c.fillStyle = mix("#2C4A6E", T.canvas, 0.35 * cl); c.fillRect(-200, -200, 1480, 2320);
        c.save(); c.translate(540 + ((t * 30) % 60), 960); c.lineWidth = 3; c.strokeStyle = rgba("#9CC0E0", 0.35); c.stroke(MP.sea); c.restore();
        // land
        for (var k in MP.paths) {
          var fill = MAPC[k];
          if (k === "germany" || k === "prussia") fill = mix(fill, C.amber, gl);
          fill = mix(fill, "#2A2F48", 0.45 * cl);
          c.fillStyle = fill; c.fill(MP.paths[k]);
          c.save(); c.clip(MP.paths[k]); c.lineWidth = 1.4; c.strokeStyle = rgba(mix(fill, ink, 0.6), 0.5); c.stroke(MP.land.main); c.restore();
          c.lineWidth = 5; c.strokeStyle = ink; c.stroke(MP.paths[k]);
        }
        if (gl > 0) { // Germany glows and pulses
          var pu = 0.75 + 0.25 * Math.sin(t * 9);
          c.globalCompositeOperation = "lighter"; glow(c, proj([11.5, 51])[0], proj([11.5, 51])[1], 420, C.amber, 0.55 * gl * pu); c.globalCompositeOperation = "source-over";
          c.lineWidth = 9; c.strokeStyle = rgba("#FFE7A6", 0.8 * gl); c.stroke(MP.paths.germany);
        }
        // pin drops on Berlin, bounces, rings spread
        if (pin >= 0) {
          var bp = proj([13.4, 52.5]), fall = 1 - backOut(pin / 0.3), py = bp[1] - 600 * Math.max(0, fall) - (fall < 0 ? fall * 40 : 0);
          for (var rg = 0; rg < 3; rg++) { var ru = (pin - 0.3 - rg * 0.25); if (ru > 0 && ru < 1.2) { c.beginPath(); c.ellipse(bp[0], bp[1], ru * 260, ru * 90, 0, 0, TAU); c.lineWidth = 7 * (1 - ru / 1.2); c.strokeStyle = rgba(C.red, 1 - ru / 1.2); c.stroke(); } }
          c.beginPath(); c.ellipse(bp[0], bp[1], 22, 8, 0, 0, TAU); c.fillStyle = rgba(ink, 0.4); c.fill();
          c.beginPath(); c.moveTo(bp[0], bp[1]); c.lineTo(bp[0] - 8, py - 90); c.lineTo(bp[0] + 8, py - 90); c.closePath(); c.fillStyle = "#C9C3B0"; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
          circ(c, bp[0], py - 120, 44); c.fillStyle = C.red; c.fill(); c.lineWidth = 6; c.stroke(); circ(c, bp[0] - 14, py - 134, 12); c.fillStyle = rgba("#ffffff", 0.6); c.fill();
        }
        // storm: rain, dark clouds that roll; they fly off to the sides when cleared, sun rays break in
        if (cl > 0.01) {
          c.save(); c.translate(540 - ((t * 120) % 240), 960 + ((t * 600) % 1200) - 600); c.lineWidth = 3; c.strokeStyle = rgba("#C8D3F0", 0.35 * cl); c.stroke(MP.rain); c.restore();
          var fl = (o.lightning !== false) ? Math.max(0, 1 - ((t + 0.2) % 1.3) / 0.18) : 0;
          if (fl > 0) { c.fillStyle = rgba("#DDE6FF", 0.25 * fl * cl); c.fillRect(-200, -200, 1480, 2320); bolt(c, 420 + Math.floor(t / 1.3) % 3 * 160, 760, 620, Math.floor(t / 1.3) * 13, fl * cl); }
        }
        for (var i = 0; i < CLOUDP.length; i++) {
          var p = CLOUDP[i], side = p[0] < 540 ? -1 : 1, away = clr * 1300 * side;
          var a = storm * (1 - clr * 0.6);
          if (a <= 0.01) continue;
          K.drawBlob(c, MP.cloud[i], p[0] + Math.sin(t * 0.9 + i) * 40 + away, p[1] + Math.cos(t * 0.7 + i * 2) * 20 - clr * 120, 1 + 0.05 * Math.sin(t * 1.3 + i), undefined, a);
        }
        if (clr > 0) { // sun breaks in
          var sx = 540, sy = 280, ra = clr;
          c.globalCompositeOperation = "lighter"; glow(c, sx, sy, 900, "#FFE7A6", 0.55 * ra); c.globalCompositeOperation = "source-over";
          c.save(); c.translate(sx, sy); c.rotate(t * 0.6); for (var r = 0; r < 14; r++) { c.rotate(TAU / 14); c.beginPath(); c.moveTo(150, -18); c.lineTo(150 + 900 * ra, -60); c.lineTo(150 + 900 * ra, 60); c.lineTo(150, 18); c.closePath(); c.fillStyle = rgba("#FFE7A6", 0.18 * ra); c.fill(); } c.restore();
          circ(c, sx, sy, 130 * ra); c.fillStyle = "#FFD27A"; c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
        }
      });
    }

    /* ======================= RADIO: a tower sends rings, envelopes fly out ======================= */
    var RD = { env: hs(120, 80, { spacing: 5, len: 12 }), mast: hs(300, 900, { spacing: 7 }) };
    function envelope(c, x, y, s, rot, flap) {
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
      rr(c, -90, -58, 180, 116, 10); hfill(c, RD.env, C.cream, 6, { ha: 0.3, cross: false });
      c.beginPath(); c.moveTo(-88, -54); c.lineTo(0, 10 - flap * 40); c.lineTo(88, -54); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
      circ(c, 0, 8 - flap * 40, 14); c.fillStyle = C.red; c.fill(); c.lineWidth = 3; c.stroke(); // wax seal
      c.restore();
    }
    function radio(c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.6 });
        var top = [540, 560], per = o.ring || 0.4;
        // rings (big, alternate amber / teal)
        for (var i = 0; i < 6; i++) {
          var u = ((t / per) + i) % 6 / 6, rad = 60 + u * 1300;
          c.beginPath(); c.arc(top[0], top[1], rad, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = 22 * (1 - u) + 2; c.strokeStyle = ink; c.globalAlpha = 1 - u; c.stroke();
          c.lineWidth = 16 * (1 - u) + 1; c.strokeStyle = i % 2 ? T.a4 : C.amber; c.stroke(); c.globalAlpha = 1;
        }
        // lattice mast
        c.beginPath(); c.moveTo(540, top[1]); c.lineTo(300, 1840); c.lineTo(780, 1840); c.closePath(); c.fillStyle = rgba(T.canvas, 0.6); c.fill();
        c.lineWidth = 14; c.strokeStyle = ink; c.lineJoin = "round"; c.stroke(); c.lineWidth = 8; c.strokeStyle = "#C9C3B0"; c.stroke();
        c.beginPath(); for (var k = 0; k < 9; k++) { var y0 = top[1] + 60 + k * 140, y1 = y0 + 140, w0 = (y0 - top[1]) / (1840 - top[1]) * 240, w1 = (y1 - top[1]) / (1840 - top[1]) * 240; c.moveTo(540 - w0, y0); c.lineTo(540 + w1, y1); c.moveTo(540 + w0, y0); c.lineTo(540 - w1, y1); c.moveTo(540 - w1, y1); c.lineTo(540 + w1, y1); }
        c.lineWidth = 10; c.strokeStyle = ink; c.stroke(); c.lineWidth = 5; c.strokeStyle = "#C9C3B0"; c.stroke();
        // beacon on top blinks with each ring
        var bl = 1 - ((t / per) % 1); circ(c, top[0], top[1] - 30, 30); c.fillStyle = mix("#5a1a14", C.red, bl); c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
        c.globalCompositeOperation = "lighter"; glow(c, top[0], top[1] - 30, 200, C.red, 0.6 * bl); c.globalCompositeOperation = "source-over";
        // envelopes fly out along arcs, fluttering, growing toward camera
        for (var e = 0; e < 7; e++) {
          var eu = ((t * 0.7) + e / 7) % 1, side = e % 2 ? 1 : -1, ang = -Math.PI / 2 + side * (0.4 + hash(e) * 0.9);
          var ex = top[0] + Math.cos(ang) * eu * 900, ey = top[1] + Math.sin(ang) * eu * 700 + eu * eu * 500;
          envelope(c, ex, ey, 0.5 + eu * 1.1, side * eu * 1.2 + Math.sin(t * 9 + e) * 0.25, 0.5 + 0.5 * Math.sin(t * 14 + e));
        }
        needles(c, t, 0.7);
      });
    }

    /* ======================= CALENDAR: a dial that spins to a year; pages that flip or tear =======================
       o: { mode: "dial" | "flip" | "tear", landAt (dial: s when the hand lands), year (optional numerals on the dial; default none) } */
    var CA = { page: hs(420, 520, { spacing: 7, len: 18 }), dial: hs(480, 480, { spacing: 6 }), key: hs(60, 30, { spacing: 4, len: 8 }) };
    function keyShape(c, x, y, s, rot) {
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
      c.beginPath(); c.arc(-60, 0, 34, 0, TAU); c.moveTo(-26, -10); c.lineTo(70, -10); c.lineTo(70, 0); c.lineTo(84, 0); c.lineTo(84, 22); c.lineTo(62, 22); c.lineTo(62, 10); c.lineTo(46, 10); c.lineTo(46, 24); c.lineTo(30, 24); c.lineTo(30, 10); c.lineTo(-26, 10); c.closePath();
      hfill(c, CA.key, C.amber, 6, { ha: 0.4, cross: false }); circ(c, -60, 0, 13); c.fillStyle = ink; c.fill();
      c.restore();
    }
    function calendarPage(c, w, h, tint) {
      rr(c, -w / 2, -h / 2, w, h, 18); hfill(c, CA.page, mix(C.cream, "#ffffff", 0.2), 7, { ha: 0.22, cross: false });
      rr(c, -w / 2, -h / 2, w, h * 0.2, [18, 18, 0, 0]); c.fillStyle = tint || C.red; c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
      // a grid of day boxes (no numbers)
      c.beginPath(); for (var gx = 1; gx < 7; gx++) { c.moveTo(-w / 2 + gx * w / 7, -h / 2 + h * 0.3); c.lineTo(-w / 2 + gx * w / 7, h / 2 - 30); } for (var gy = 0; gy < 6; gy++) { var yy = -h / 2 + h * 0.3 + gy * (h * 0.7 - 30) / 5; c.moveTo(-w / 2 + 20, yy); c.lineTo(w / 2 - 20, yy); }
      c.lineWidth = 3; c.strokeStyle = rgba(ink, 0.35); c.stroke();
    }
    function calendar(c, t, o) {
      frame(c, t, o, function (t, o) {
        var mode = o.mode || "flip";
        space(c, t, { blobA: 0.6 });
        if (mode === "dial") {
          var land = o.landAt == null ? 1.0 : o.landAt, u = clamp(t / land, 0, 1), ang = (1 - Math.pow(1 - u, 3)) * TAU * 4 + (t > land ? Math.sin((t - land) * 30) * 0.05 * Math.exp(-(t - land) * 6) : 0);
          var cx = 540, cy = 900, R0 = 430, done = sstep(land, land + 0.1, t);
          // rings
          c.save(); c.translate(cx, cy); c.rotate(-ang * 0.25);
          circ(c, 0, 0, R0); hfill(c, CA.dial, "#2F3B66", 8);
          for (var k = 0; k < 60; k++) { var a = k / 60 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * (R0 - 16), Math.sin(a) * (R0 - 16)); c.lineTo(Math.cos(a) * (R0 - (k % 5 ? 40 : 76)), Math.sin(a) * (R0 - (k % 5 ? 40 : 76))); c.lineWidth = k % 5 ? 4 : 9; c.strokeStyle = C.cream; c.stroke(); }
          c.restore();
          circ(c, cx, cy, R0 * 0.62); hfill(c, CA.dial, C.cream, 7, { ha: 0.25 });
          for (k = 0; k < 12; k++) { var a2 = k / 12 * TAU + ang * 0.6; circ(c, cx + Math.cos(a2) * R0 * 0.5, cy + Math.sin(a2) * R0 * 0.5, 16); c.fillStyle = k % 3 ? T.a2 : C.red; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); }
          // the hand
          c.save(); c.translate(cx, cy); c.rotate(ang - Math.PI / 2); rr(c, 0, -16, R0 * 0.95, 32, 16); c.fillStyle = C.red; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); c.restore();
          circ(c, cx, cy, 38); c.fillStyle = C.brass; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
          // the year window (over the hand's root)
          rr(c, cx - 190, cy - 80, 380, 160, 26); c.fillStyle = mix("#1C2133", C.amber, 0.15 + 0.6 * done); c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
          if (o.year) { c.fillStyle = mix(C.cream, ink, done * 0.9); c.font = "900 120px Cairo, 'Arial Black', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(o.year), cx, cy + 6); }
          // motion arcs while spinning, flash on landing
          var sp = (1 - u) * (1 - u); if (sp > 0.02) for (var q = 0; q < 3; q++) { c.beginPath(); c.arc(cx, cy, R0 + 40 + q * 18, ang - 1.2 * sp - q, ang - q); c.lineWidth = 8 - q * 2; c.strokeStyle = rgba(T.light, 0.7 * Math.sqrt(sp)); c.stroke(); }
          var fl = sstep(land, land + 0.06, t) * (1 - sstep(land + 0.1, land + 0.6, t));
          if (fl > 0) { c.globalCompositeOperation = "lighter"; glow(c, cx, cy, 700, C.amber, 0.6 * fl); c.globalCompositeOperation = "source-over"; sparkle(c, cx + 260, cy - 300, 80 * fl, 50 * fl, "#FFFBEA", 0.5 * fl, rgba(C.lampHot, 0.9)); }
          return;
        }
        // pad of pages (spiral top), pages flip up fast or tear off and fly
        var per = o.per || (mode === "tear" ? 0.5 : 0.22), n = Math.floor(t / per), u2 = (t - n * per) / per, pw = 780, ph = 980, px = 540, py = 1010;
        c.save(); c.translate(px + 14, py + 22); rr(c, -pw / 2, -ph / 2, pw, ph, 18); c.fillStyle = rgba(ink, 0.5); c.fill(); c.restore();
        c.save(); c.translate(px, py); calendarPage(c, pw, ph, (n + 1) % 2 ? C.red : T.a2); c.restore();
        if (mode === "flip") {
          var fold = Math.cos(u2 * Math.PI); // 1 → -1: page swings up over the top
          c.save(); c.translate(px, py - ph / 2); c.scale(1, fold); c.translate(0, ph / 2);
          if (fold > 0) calendarPage(c, pw, ph, n % 2 ? C.red : T.a2); else { rr(c, -pw / 2, -ph / 2, pw, ph, 18); c.fillStyle = mix(C.cream, ink, 0.25); c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke(); }
          c.restore();
          var kg = sstep(0.55, 0.7, u2) * (1 - sstep(0.85, 1, u2)); // a key glints on each new page
          keyShape(c, px + 120, py + 140, 1.3, -0.4); sparkle(c, px + 230, py + 100, 70 * kg, 46 * kg, "#FFFBEA", 0.6 * kg, rgba(C.lampHot, 0.9));
        } else {
          for (var f = 0; f < 3; f++) {
            var age = u2 * per + f * per; if (n - f < 0) continue;
            var k2 = age / (per * 3), side = (n - f) % 2 ? 1 : -1;
            c.save(); c.translate(px + side * k2 * 1100, py - k2 * 700 - Math.sin(k2 * Math.PI) * 200); c.rotate(side * k2 * 2.6); c.scale(1 - k2 * 0.3, 1 - k2 * 0.3);
            if (age < 0.12) c.translate(0, -age * 200);
            calendarPage(c, pw, ph, (n - f) % 2 ? C.red : T.a2);
            // torn top edge
            c.beginPath(); c.moveTo(-pw / 2, -ph / 2); for (var z = 0; z <= 20; z++) c.lineTo(-pw / 2 + z * pw / 20, -ph / 2 + (z % 2 ? 16 : 0)); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
            c.restore();
          }
        }
        // spiral binding
        rr(c, px - pw / 2 - 20, py - ph / 2 - 60, pw + 40, 70, 16); c.fillStyle = C.steel; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
        for (var s2 = 0; s2 < 12; s2++) { var sx = px - pw / 2 + 40 + s2 * (pw - 80) / 11; rr(c, sx - 9, py - ph / 2 - 90, 18, 70, 9); c.fillStyle = "#C9C3B0"; c.fill(); c.lineWidth = 4; c.stroke(); }
      });
    }

    /* ======================= BOOKS: old books, a big open one with pages fluttering ======================= */
    var BK = { cover: hs(520, 300, { spacing: 6 }), page: hs(420, 400, { spacing: 9, len: 20 }), spine: hs(500, 80, { spacing: 5, len: 14 }) };
    function books(c, t, o) {
      frame(c, t, o, function (t, o) {
        c.fillStyle = "#1E1A2E"; c.fillRect(-200, -200, 1480, 2320);
        c.globalCompositeOperation = "lighter"; glow(c, 540, 880, 900, C.amber, 0.3); c.globalCompositeOperation = "source-over";
        // stack of closed books behind (spines toward us), slight bob
        var cols = ["#7A2E2A", "#2E4A6E", "#5A6B3A", "#6B4426", "#4A2E5A"];
        for (var b = 0; b < 5; b++) {
          var by = 520 - b * 92 + Math.sin(t * 3 + b) * 3, bw = 760 - b * 50 + (b % 2) * 60;
          rr(c, 540 - bw / 2 + (b % 2 ? 30 : -20), by, bw, 86, 12); hfill(c, BK.spine, cols[b], 6);
          c.beginPath(); c.moveTo(540 - bw / 2 + 70, by + 10); c.lineTo(540 - bw / 2 + 70, by + 76); c.moveTo(540 + bw / 2 - 90, by + 10); c.lineTo(540 + bw / 2 - 90, by + 76); c.lineWidth = 8; c.strokeStyle = C.brass; c.stroke();
        }
        // open book: covers, page blocks, fluttering pages
        var cx = 540, cy = 1180, w = 470, h = 640;
        c.beginPath(); c.moveTo(cx, cy - h / 2 + 30); c.lineTo(cx - w - 30, cy - h / 2 + 10); c.lineTo(cx - w - 40, cy + h / 2 + 30); c.lineTo(cx, cy + h / 2 + 50); c.lineTo(cx + w + 40, cy + h / 2 + 30); c.lineTo(cx + w + 30, cy - h / 2 + 10); c.closePath(); hfill(c, BK.cover, "#6B2E24", 7);
        function pageShape(dir, lift, curl) { // dir -1 left, +1 right; lift 0 flat .. 1 vertical
          var ex = cx + dir * w * Math.cos(lift * Math.PI / 2), up = Math.sin(lift * Math.PI / 2) * 160;
          c.beginPath(); c.moveTo(cx, cy - h / 2 + 20);
          c.bezierCurveTo(cx + dir * w * 0.4 * (1 - lift * 0.6), cy - h / 2 - 40 - up * 0.7 - curl * 50, ex, cy - h / 2 - up, ex, cy - h / 2 + 10 - up);
          c.lineTo(ex, cy + h / 2 - up * 0.6); c.bezierCurveTo(ex, cy + h / 2 + 10 - up * 0.3, cx + dir * w * 0.4, cy + h / 2 + 20, cx, cy + h / 2 + 30); c.closePath();
        }
        pageShape(-1, 0, 0); hfill(c, BK.page, C.cream, 6, { ha: 0.2, cross: false });
        pageShape(1, 0, 0); hfill(c, BK.page, C.cream, 6, { ha: 0.2, cross: false });
        // text-like lines (unreadable)
        c.beginPath(); for (var l = 0; l < 12; l++) for (var sd = -1; sd <= 1; sd += 2) { var yy = cy - h / 2 + 90 + l * 44; c.moveTo(cx + sd * 50, yy); c.lineTo(cx + sd * (w - 60 - (l % 4) * 30), yy); } c.lineWidth = 5; c.strokeStyle = rgba(ink, 0.25); c.stroke();
        // pages turning right → left, 3 at a time
        var sp = o.speed || 1.6;
        for (var p = 0; p < 3; p++) {
          var u = ((t * sp) + p / 3) % 1, lift = u < 0.5 ? u * 2 : (1 - u) * 2, dir = u < 0.5 ? 1 : -1, curl = Math.sin(u * TAU * 2 + p) * 0.5;
          pageShape(dir, lift, curl); hfill(c, BK.page, mix(C.cream, "#ffffff", 0.1 + 0.2 * lift), 5, { ha: 0.18, cross: false });
        }
        // spine shadow + ribbon
        c.beginPath(); c.moveTo(cx, cy - h / 2 + 20); c.lineTo(cx, cy + h / 2 + 30); c.lineWidth = 8; c.strokeStyle = rgba(ink, 0.6); c.stroke();
        c.beginPath(); c.moveTo(cx + 10, cy + h / 2 + 20); c.quadraticCurveTo(cx + 40 + Math.sin(t * 5) * 20, cy + h / 2 + 140, cx + 20, cy + h / 2 + 240); c.lineWidth = 22; c.strokeStyle = ink; c.stroke(); c.lineWidth = 14; c.strokeStyle = C.red; c.stroke();
        // dust motes in the light
        for (var d = 0; d < 26; d++) { var du = (t * (0.05 + hash(d) * 0.08) + hash(d + 50)) % 1; circ(c, 200 + hash(d + 3) * 680 + Math.sin(t + d) * 30, 1500 - du * 1300, 3 + hash(d + 7) * 4); c.fillStyle = rgba(C.lampHot, 0.5 * Math.sin(du * Math.PI)); c.fill(); }
      });
    }

    /* ======================= MANSION + DOOR: Bletchley Park; a house door opens and people walk out =======================
       o: { mode: "mansion" | "door", lightsAt (mansion: first window lights), openAt (door) } */
    var MA = { brick: hs(560, 500, { angle: -0.4, spacing: 7, len: 22 }), roof: hs(560, 300, { spacing: 6 }), dome: hs(140, 140, { spacing: 5, len: 12 }), coat: hs(60, 90, { spacing: 4.5, len: 10 }) };
    var WALKERS = ["#3E5F96", "#9C4A3C", "#46B3AE", "#7A6A9E", "#B98A4A"];
    function walker(c, x, y, s, col, t, i) { // small hatched figure walking toward camera-right, no face
      var ph = t * TAU / 0.5 + i, bob = Math.abs(Math.sin(ph)) * 6;
      c.save(); c.translate(x, y - bob); c.scale(s, s);
      c.lineWidth = 10; c.strokeStyle = ink; c.beginPath(); c.moveTo(-8, 60); c.lineTo(-8 + Math.sin(ph) * 14, 110); c.moveTo(8, 60); c.lineTo(8 - Math.sin(ph) * 14, 110); c.stroke();
      c.beginPath(); c.moveTo(-26, -10); c.quadraticCurveTo(0, -18, 26, -10); c.lineTo(34, 70); c.lineTo(-34, 70); c.closePath(); hfill(c, MA.coat, col, 5, { cross: false });
      circ(c, 0, -40, 24); c.fillStyle = C.skin; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke();
      c.beginPath(); c.arc(0, -44, 25, Math.PI, TAU); c.lineTo(22, -34); c.quadraticCurveTo(0, -52, -22, -34); c.closePath(); c.fillStyle = "#3A2A1C"; c.fill(); c.stroke();
      circ(c, -14, -64, 9); c.fill(); c.stroke(); circ(c, 14, -64, 9); c.fill(); c.stroke();
      c.restore();
    }
    function mansion(c, t, o) {
      frame(c, t, o, function (t, o) {
        if (o.mode === "door") {
          var oa = o.openAt == null ? 0.3 : o.openAt, open = backOut((t - oa) / 0.35) * (t > oa ? 1 : 0);
          c.fillStyle = "#6E3A2E"; c.fillRect(-200, -200, 1480, 2320);
          c.save(); c.translate(540, 960); c.fillStyle = "#7A4436"; c.fillRect(-740, -1160, 1480, 2320);
          rr(c, -740, -1160, 1480, 2320, 0); hfill(c, MA.brick, "#8A4A3A", 0, { ha: 0.45 });
          c.beginPath(); for (var by = -1100; by < 1160; by += 46) { c.moveTo(-740, by); c.lineTo(740, by); } c.lineWidth = 2.5; c.strokeStyle = rgba(ink, 0.35); c.stroke();
          // door frame + warm inside
          rr(c, -300, -700, 600, 1100, [300, 300, 0, 0]); c.fillStyle = "#FFE2A0"; c.fill(); c.lineWidth = 10; c.strokeStyle = ink; c.stroke();
          c.globalCompositeOperation = "lighter"; glow(c, 0, -100, 800, C.amber, 0.5 * clamp(open, 0, 1)); c.globalCompositeOperation = "source-over";
          // light spill on the step
          c.beginPath(); c.moveTo(-300, 400); c.lineTo(300, 400); c.lineTo(520, 1000); c.lineTo(-520, 1000); c.closePath(); c.fillStyle = rgba(C.lampHot, 0.25 * clamp(open, 0, 1)); c.fill();
          rr(c, -360, 400, 720, 60, 8); hfill(c, MA.roof, "#9A9488", 6, { cross: false });
          // people walk out one by one, growing as they come toward us
          for (var i = 0; i < 5; i++) {
            var wt = t - oa - 0.3 - i * 0.28; if (wt <= 0) continue;
            var k = clamp(wt / 1.6, 0, 1.3), sc = 1 + k * 2.2;
            walker(c, -40 + (i % 2 ? 1 : -1) * (40 + k * 520) + i * 10, 300 + k * 520, sc, WALKERS[i], t, i);
          }
          // the door swings on its left hinge
          var dw = 600 * Math.cos(clamp(open, 0, 1.1) * 1.35);
          c.save(); c.translate(-300, 0);
          c.beginPath(); c.moveTo(0, -700 + (1 - Math.abs(dw) / 600) * 0); c.lineTo(dw, -700 + 300 * (1 - Math.abs(dw) / 600) * 0); c.lineTo(dw, 400); c.lineTo(0, 400); c.closePath();
          c.save(); c.clip(); rr(c, 0, -1000, 600, 1400, [300, 300, 0, 0]); c.restore();
          c.beginPath(); if (Math.abs(dw) > 4) { c.moveTo(0, -560); c.quadraticCurveTo(dw / 2, -760, dw, -560 - 140 * Math.abs(dw) / 600); c.lineTo(dw, 400); c.lineTo(0, 400); c.closePath(); hfill(c, MA.roof, "#2E5A44", 8); circ(c, dw * 0.85, -60, 18); c.fillStyle = C.brass; c.fill(); c.lineWidth = 5; c.stroke(); }
          c.restore();
          c.restore();
          return;
        }
        space(c, t, { blobA: 0.5 });
        var la = o.lightsAt == null ? 0.2 : o.lightsAt;
        if (o.push !== false) zoomAt(c, 1 + 0.1 * t, 540, 1000);
        c.save(); c.translate(540, 1150); c.scale(1.05, 1.05);
        // lawn
        c.beginPath(); c.moveTo(-760, 360); c.quadraticCurveTo(0, 300, 760, 360); c.lineTo(760, 1000); c.lineTo(-760, 1000); c.closePath(); hfill(c, MA.roof, "#2F4A36", 6);
        // main block, left wing gable, right copper dome tower
        rr(c, -470, -260, 940, 620, 6); hfill(c, MA.brick, "#9A4E3A", 7);
        c.beginPath(); c.moveTo(-500, -250); c.lineTo(-330, -500); c.lineTo(-160, -250); c.closePath(); hfill(c, MA.roof, "#3B3530", 7); // left gable
        c.beginPath(); c.moveTo(-170, -250); c.lineTo(-120, -380); c.lineTo(240, -380); c.lineTo(280, -250); c.closePath(); hfill(c, MA.roof, "#3B3530", 7);
        rr(c, 200, -480, 240, 840, 6); hfill(c, MA.brick, "#A65A44", 7); // tower
        c.beginPath(); c.moveTo(180, -480); c.quadraticCurveTo(320, -760, 460, -480); c.closePath(); hfill(c, MA.dome, "#5FA08A", 7); // copper dome
        c.beginPath(); c.moveTo(320, -700); c.lineTo(320, -800); c.lineWidth = 8; c.strokeStyle = ink; c.stroke(); circ(c, 320, -810, 14); c.fillStyle = C.brass; c.fill(); c.lineWidth = 5; c.stroke();
        // chimneys with smoke
        [[-380, -540], [80, -440]].forEach(function (ch, j) { rr(c, ch[0], ch[1], 60, 140, 4); hfill(c, MA.brick, "#7A3E30", 6); for (var p = 0; p < 3; p++) { var pu = (t * 0.5 + p / 3 + j * 0.2) % 1; K.drawBlob(c, HU.puff, ch[0] + 30 + pu * 100, ch[1] - 30 - pu * 300, 0.3 + pu * 0.6, pu, 0.8 * (1 - pu)); } });
        // windows: light in a wave
        var W = [[-420, -120], [-300, -120], [-120, -120], [0, -120], [260, -340], [260, -120], [-420, 120], [-300, 120], [-120, 120], [0, 120], [260, 120]];
        for (var wi = 0; wi < W.length; wi++) {
          var wx = W[wi][0], wy = W[wi][1], on = sstep(0, 0.1, t - la - wi * 0.09) * (0.9 + 0.1 * Math.sin(t * 13 + wi));
          rr(c, wx, wy, 90, 150, [40, 40, 4, 4]); c.fillStyle = mix("#1C2133", C.lampHot, on); c.fill(); c.lineWidth = 7; c.strokeStyle = "#EFE5CC"; c.stroke();
          c.beginPath(); c.moveTo(wx + 45, wy + 6); c.lineTo(wx + 45, wy + 150); c.moveTo(wx, wy + 70); c.lineTo(wx + 90, wy + 70); c.lineWidth = 5; c.stroke();
          if (on > 0) { c.globalCompositeOperation = "lighter"; glow(c, wx + 45, wy + 75, 220, C.amber, 0.4 * on); c.globalCompositeOperation = "source-over"; }
        }
        // front door + porch arch
        rr(c, -100, 180, 120, 180, [60, 60, 0, 0]); c.fillStyle = "#2E5A44"; c.fill(); c.lineWidth = 7; c.strokeStyle = ink; c.stroke();
        c.restore();
        needles(c, t, 0.8);
      });
    }

    /* ======================= JIGSAW: a big piece spins in; a grid where the last piece clicks in =======================
       o: { mode: "piece" | "grid", inAt (piece: spin-in start), clickAt (grid: last piece lands), glow (grid: 0..1 after click) } */
    var JG = { h: hs(260, 260, { spacing: 6 }) };
    function piecePath(c, s, e) { // s = size, e = [top, right, bottom, left] each 1 tab / -1 blank / 0 flat
      var h = s / 2, n = s * 0.2;
      c.beginPath(); c.moveTo(-h, -h);
      function side(x0, y0, dx, dy, k) { // walk one side from (x0,y0) along (dx,dy) (unit), tab outward normal (dy,-dx)
        var nx = dy, ny = -dx, L = s;
        function P(u, v) { return [x0 + dx * L * u + nx * v, y0 + dy * L * u + ny * v]; }
        if (!k) { var q = P(1, 0); c.lineTo(q[0], q[1]); return; }
        var a = P(0.36, 0), b = P(0.3, k * n * 0.9), cc = P(0.5, k * n * 1.5), d = P(0.7, k * n * 0.9), f = P(0.64, 0), g = P(1, 0);
        c.lineTo(a[0], a[1]); c.bezierCurveTo(b[0], b[1], P(0.28, k * n * 1.6)[0], P(0.28, k * n * 1.6)[1], cc[0], cc[1]);
        c.bezierCurveTo(P(0.72, k * n * 1.6)[0], P(0.72, k * n * 1.6)[1], d[0], d[1], f[0], f[1]); c.lineTo(g[0], g[1]);
      }
      side(-h, -h, 1, 0, e[0]); side(h, -h, 0, 1, e[1]); side(h, h, -1, 0, e[2]); side(-h, h, 0, -1, e[3]);
      c.closePath();
    }
    function question(c, s, col) { // a "?" mark drawn as a shape (hook + dot)
      c.beginPath(); c.arc(0, -s * 0.18, s * 0.2, Math.PI * 1.05, Math.PI * 0.45, false); c.lineTo(0, s * 0.12);
      c.lineWidth = s * 0.11; c.strokeStyle = col; c.lineCap = "round"; c.stroke(); circ(c, 0, s * 0.3, s * 0.065); c.fillStyle = col; c.fill();
    }
    var JCOL = ["#F2B544", "#46B3AE", "#D9574A", "#98A3D4", "#9CC79E", "#E07A3F"];
    function jigsaw(c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.7 });
        if ((o.mode || "piece") === "piece") {
          var ia = o.inAt == null ? 0 : o.inAt, u = clamp((t - ia) / 0.5, 0, 1), sc = backOut(u) * 2.0, rot = (1 - u) * 5 + Math.sin(t * 2.4) * 0.08 * u;
          c.globalCompositeOperation = "lighter"; glow(c, 540, 940, 700 * u, C.amber, 0.35 * u); c.globalCompositeOperation = "source-over";
          c.save(); c.translate(540, 940 + Math.sin(t * 2) * 14); c.rotate(rot); c.scale(sc, sc);
          piecePath(c, 300, [1, -1, 1, -1]); hfill(c, JG.h, C.amber, 6 / Math.max(sc, 0.3));
          question(c, 300, ink); c.restore();
          if (u >= 1) sparkle(c, 760, 600, 50 + 20 * Math.sin(t * 6), 34, "#FFFBEA", 0.4, rgba(C.lampHot, 0.9));
          return;
        }
        // grid: 4 x 5 pieces, the last (centre) one flies in and clicks
        var cols = 4, rows = 5, s = 230, x0 = 540 - (cols - 1) * s / 2, y0 = 960 - (rows - 1) * s / 2, ca = o.clickAt == null ? 1.0 : o.clickAt;
        var last = [1, 2], u2 = clamp((t - (ca - 0.6)) / 0.6, 0, 1), clicked = t >= ca, g = clicked ? (o.glow == null ? sstep(ca, ca + 0.3, t) : o.glow) : 0;
        function edges(r, cI) { var tp = r === 0 ? 0 : ((r + cI) % 2 ? -1 : 1), bt = r === rows - 1 ? 0 : -((r + 1 + cI) % 2 ? -1 : 1), lf = cI === 0 ? 0 : -((r + cI) % 2 ? 1 : -1), rt = cI === cols - 1 ? 0 : ((r + cI + 1) % 2 ? 1 : -1); return [tp, rt, bt, lf]; }
        for (var r = 0; r < rows; r++) for (var cI = 0; cI < cols; cI++) {
          var isLast = r === last[1] && cI === last[0], x = x0 + cI * s, y = y0 + r * s, bob = Math.sin(t * 3 + r + cI * 1.7) * 4 * (1 - g);
          if (isLast) { var e2 = 1 - Math.pow(1 - u2, 3); x += (1 - e2) * 700; y -= (1 - e2) * 500; }
          c.save(); c.translate(x, y + bob); if (isLast) { c.rotate((1 - u2) * 3); c.scale(1 + (1 - u2) * 0.6, 1 + (1 - u2) * 0.6); }
          piecePath(c, s, edges(r, cI)); hfill(c, JG.h, mix(JCOL[(r * cols + cI) % 6], C.lampHot, g * 0.4), 6);
          c.restore();
        }
        if (clicked) {
          var fl = 1 - sstep(ca, ca + 0.5, t);
          c.globalCompositeOperation = "lighter"; glow(c, x0 + last[0] * s, y0 + last[1] * s, 400, C.lampHot, 0.8 * fl); glow(c, 540, 960, 1000, C.amber, 0.45 * g); c.globalCompositeOperation = "source-over";
          sparkle(c, x0 + last[0] * s + 60, y0 + last[1] * s - 70, 90 * fl, 60 * fl, "#FFFBEA", 0.6 * fl, rgba(C.lampHot, 0.9));
        }
        needles(c, t, 0.8);
      });
    }

    /* ======================= ENIGMA MACHINE: the whole machine from above, rotors, lamps, keys, plugboard =======================
       o: { slamAt (s: it slams in from big with a bounce), step (s between key presses) } */
    var EM = { box: hs(600, 1000, { spacing: 7 }), plate: hs(520, 300, { spacing: 6 }), key: hs(50, 50, { spacing: 4.5, len: 10 }), wheel: hs(60, 160, { spacing: 5, len: 12 }) };
    function enigmaMachine(c, t, o) {
      frame(c, t, o, function (t, o) {
        space(c, t, { blobA: 0.5 });
        if (o.slamAt != null) { var su = clamp((t - o.slamAt) / 0.3, 0, 1), z = 1 + (1 - backOut(su)) * 0.9; c.translate(540, 960); c.scale(z, z); c.translate(-540, -960); }
        var step = o.step || 0.2, n = Math.floor(t / step), w = t - n * step;
        // wooden case + open lid behind
        rr(c, 60, 40, 960, 260, 30); hfill(c, EM.box, "#5E3B20", 7);
        rr(c, 30, 200, 1020, 1680, 40); hfill(c, EM.box, C.wood, 8);
        // rotor slot: three thumbwheels, ridges scroll as they turn
        rr(c, 170, 260, 740, 260, 24); hfill(c, EM.plate, C.steel, 6);
        for (var r = 0; r < 3; r++) {
          var rx = 290 + r * 250, ry = 390, off = ((t * (3 - r) * 260) + (r === 2 ? Math.floor(t / step) * 30 : 0)) % 36;
          rr(c, rx - 70, ry - 110, 140, 220, 30); c.fillStyle = "#1C2133"; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
          c.save(); rr(c, rx - 60, ry - 100, 120, 200, 26); c.clip(); c.fillStyle = C.cream; c.fillRect(rx - 60, ry - 100, 120, 200);
          c.translate(rx, ry); c.lineWidth = 1.3; c.strokeStyle = rgba(ink, 0.35); c.stroke(EM.wheel.main);
          for (var g = -4; g <= 4; g++) { var yy = g * 36 + off - 18; c.beginPath(); c.moveTo(-60, yy); c.lineTo(60, yy); c.lineWidth = 6; c.strokeStyle = rgba(ink, 0.6 * (1 - Math.abs(yy) / 110)); c.stroke(); }
          c.restore();
          c.beginPath(); c.moveTo(rx - 60, ry - 40); c.lineTo(rx + 60, ry - 40); c.moveTo(rx - 60, ry + 40); c.lineTo(rx + 60, ry + 40); c.lineWidth = 4; c.strokeStyle = rgba(ink, 0.3); c.stroke();
          rr(c, rx + 78, ry - 30, 34, 60, 8); c.fillStyle = C.amber; c.fill(); c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); // letter window
        }
        // lamp board 3 rows (9/8/9) — several lamps flicker, the pressed key's lamp lights big
        rr(c, 90, 560, 900, 470, 26); hfill(c, EM.plate, C.steel, 6);
        var lit = Math.floor(hash(n + 7) * 26), rowsN = [9, 8, 9], idx = 0, litPos = null;
        for (var row = 0; row < 3; row++) for (var k = 0; k < rowsN[row]; k++, idx++) {
          var lx = 540 + (k - (rowsN[row] - 1) / 2) * 96, ly = 650 + row * 140, on = idx === lit ? sstep(0, 0.03, w) : 0;
          if (on > 0) litPos = [lx, ly, on];
          circ(c, lx, ly, 44); c.fillStyle = mix("#2A3350", C.lampHot, on); c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
          c.beginPath(); c.arc(lx - 6, ly - 6, 28, Math.PI * 1.05, Math.PI * 1.45); c.lineWidth = 5; c.strokeStyle = rgba("#ffffff", 0.3 + 0.5 * on); c.stroke();
        }
        if (litPos) { c.globalCompositeOperation = "lighter"; glow(c, litPos[0], litPos[1], 360, C.amber, 0.8 * litPos[2]); glow(c, litPos[0], litPos[1], 110, "#FFFFFF", 0.7 * litPos[2]); c.globalCompositeOperation = "source-over"; }
        // keyboard 3 rows, one key down per step
        var press = Math.floor(hash(n + 31) * 26); idx = 0;
        for (row = 0; row < 3; row++) for (k = 0; k < rowsN[row]; k++, idx++) {
          var kx = 540 + (k - (rowsN[row] - 1) / 2) * 104 + (row === 1 ? 0 : 0), ky = 1130 + row * 150, dn = idx === press ? sstep(0, 0.03, w) * (1 - sstep(0.1, 0.18, w)) : 0;
          circ(c, kx, ky + 12, 48); c.fillStyle = rgba(ink, 0.6); c.fill();
          c.save(); c.translate(kx, ky + dn * 12); circ(c, 0, 0, 46); c.fillStyle = "#1C2133"; c.fill(); c.lineWidth = 5; c.strokeStyle = ink; c.stroke();
          circ(c, 0, 0, 34); hfill(c, EM.key, C.cream, 4, { ha: 0.3, cross: false }); c.restore();
        }
        // plugboard: sockets + a few looping cables
        rr(c, 90, 1560, 900, 260, 20); hfill(c, EM.plate, "#3A2A1C", 6);
        for (var pI = 0; pI < 13; pI++) for (var pr = 0; pr < 2; pr++) { circ(c, 150 + pI * 65, 1630 + pr * 110, 14); c.fillStyle = ink; c.fill(); }
        [[2, 7, C.red], [4, 10, T.a4], [8, 12, C.amber]].forEach(function (cb, j) {
          var ax = 150 + cb[0] * 65, bx = 150 + cb[1] * 65, sag = 120 + Math.sin(t * 3 + j) * 20;
          c.beginPath(); c.moveTo(ax, 1630); c.bezierCurveTo(ax, 1630 + sag, bx, 1740 + sag, bx, 1740); c.lineWidth = 18; c.strokeStyle = ink; c.stroke(); c.lineWidth = 11; c.strokeStyle = cb[2]; c.stroke();
        });
        needles(c, t, 0.6);
      });
    }

    return { map: map, radio: radio, calendar: calendar, books: books, mansion: mansion, jigsaw: jigsaw, enigmaMachine: enigmaMachine,
      enigma: enigma, rotors: rotors, bombe: bombe, turing: turing, room: room, huts: huts, colossus: colossus, chalk: chalk, space: space };
  }

  window.EP01 = { create: create, theme: theme, colours: C, twos: twos,
    SCENES: ["enigma", "enigmaMachine", "rotors", "bombe", "turing", "room", "huts", "mansion", "colossus", "chalk", "map", "radio", "calendar", "books", "jigsaw"] };
})();
