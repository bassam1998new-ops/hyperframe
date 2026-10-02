/* =====================================================================
   bombe.js — "Bombe", the ep 1 buddy of the Story-of-AI series (Turing's code-breaking machine).
   Built on the hatch kit (global HATCH): wide hatched block, four short legs, nub arms, rows of
   spinning code drums. The two big drums in the top row are its eyes.
   Ep 1 palette: navy body, amber drums and lamp.

   var K = HATCH.kit({ w, h, seed, theme });
   var B = BOMBE.create(K);
   B.draw(ctx, x, y, scale, BOMBE.pose("crunch", t));
   B.key(ctx, x, y, scale, rot)   // the amber key prop it hands to Aurora at the end

   Moves (BOMBE.MOVES): idle, crunch (drums whirl, lamp flickers), eureka (drums lock, lamp lights, ^ ^ hop),
     look (opt.dir ±1), give (arm out holding the key, opt.dir ±1), walk
   State: t, spin (drum speed), lock 0..1 (drums settle to the same letter), lamp 0..1, eyes ("open"|"happy"|"blink"),
     look, hop, squash, tilt, armL/armR (+ = up), armLenL/armLenR, key (true = key in the right/left hand), walk, walkAmt
   ===================================================================== */
(function () {
  var H = window.HATCH, G = H.geom, sstep = H.sstep, clamp = H.clamp, mix = H.mix, rgba = H.rgba;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
  var PAL = { body: "#5670a8", side: "#435789", drumA: "#f2b84b", drumB: "#d9673f", drumC: "#e8dcc0", lamp: "#ffc94a", key: "#f2b84b" };
  var BW = 360, BH = 176, RAD = 16, LEG_X = [-0.4, -0.2, 0.2, 0.4].map(function (f) { return f * BW; }), LEG_W = 20, LEG_L = 34;
  var FOOT = BH / 2 + LEG_L + 4;
  // drum grid: 3 rows x 5; top row's 2nd and 4th are the eyes
  var COLS = [-0.36, -0.18, 0, 0.18, 0.36].map(function (f) { return f * BW; }), ROWS = [-0.2, 0.08, 0.32].map(function (f) { return f * BH; });

  function create(K, o) {
    o = o || {};
    var T = K.T, pal = {}; for (var k in PAL) pal[k] = (o.pal && o.pal[k]) || PAL[k];
    var hatch = {
      main: K.hatch(BW / 2 + 10, BH / 2 + 10, { angle: -0.98, spacing: 6.5, len: 24, gapMin: 8, gapMax: 34, jit: 0.07, keep: function (x, y) { return x / BW + 1.3 * y / BH > K.rr(-1.1, 0.35); } }),
      cross: K.hatch(BW / 2 + 10, BH / 2 + 10, { angle: -2.3, spacing: 6.5, len: 18, gapMin: 6, gapMax: 26, jit: 0.08, keep: function (x, y) { return x * 0.6 + y > 40 + K.rr(-30, 30); } }),
      light: K.hatch(BW / 2 + 10, BH / 2 + 10, { angle: -0.03, spacing: 5, len: 30, gapMin: 14, gapMax: 50, jit: 0.04, keep: function (x, y) { return y < -BH * 0.25 + K.rr(-22, 22); } })
    };
    var dark = rgba(mix(pal.body, T.ink, 0.6), 0.55), light = rgba(mix(pal.body, "#ffffff", 0.55), 0.35);
    var phase = []; for (var i = 0; i < 15; i++) phase.push(K.rr(0, 6.28));
    var drumCols = [pal.drumA, pal.drumB, pal.drumC];

    function drum(c, x, y, r, ang, col, ol) {
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.lineWidth = ol; c.strokeStyle = T.ink; c.stroke();
      c.beginPath(); c.arc(x, y, r * 0.62, 0, Math.PI * 2); c.lineWidth = 1.6; c.strokeStyle = rgba(T.ink, 0.6); c.stroke();
      for (var j = 0; j < 8; j++) { // letter ticks around the rim spin with the drum
        var a = ang + j * Math.PI / 4; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); c.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
        c.lineWidth = j === 0 ? 3.2 : 1.4; c.strokeStyle = T.ink; c.stroke();
      }
      c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fillStyle = T.ink; c.fill();
    }
    function eye(c, x, y, r, st, ang, ol) {
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = pal.drumC; c.fill(); c.lineWidth = ol; c.strokeStyle = T.ink; c.stroke();
      for (var j = 0; j < 12; j++) { var a = ang + j * Math.PI / 6; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82); c.lineTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95); c.lineWidth = 1.6; c.strokeStyle = rgba(T.ink, 0.7); c.stroke(); }
      var lx = (st.look || 0) * 6, ew = G.EYE_W * 0.95, eh = G.EYE_H * 0.95;
      c.lineCap = "round"; c.strokeStyle = T.ink; c.lineWidth = 4.4;
      if (st.eyes === "happy") { c.beginPath(); c.moveTo(x + lx - ew * 0.85, y + eh * 0.12); c.lineTo(x + lx, y - eh * 0.22); c.lineTo(x + lx + ew * 0.85, y + eh * 0.12); c.stroke(); return; }
      if (st.eyes === "blink") { c.beginPath(); c.moveTo(x + lx - ew * 0.6, y); c.lineTo(x + lx + ew * 0.6, y); c.stroke(); return; }
      rr(c, x + lx - ew / 2, y - eh / 2, ew, eh, G.EYE_R); c.fillStyle = T.eyeInk; c.fill();
      var hs = ew * 0.36; rr(c, x + lx + ew / 2 - hs - 2.2, y - eh / 2 + 2.6, hs, hs, hs * 0.3); c.fillStyle = T.highlight; c.fill();
    }
    function arm(c, sd, ang, len, ol, holdKey) {
      var up = sstep(0.4, 1.4, ang);
      c.save(); c.translate(sd * (BW / 2 + 2), BH * 0.12 - up * BH * 0.3); c.rotate(-sd * ang);
      var L = 46 + len * 46, NH = 42;
      rr(c, sd < 0 ? -L : -10, -NH / 2, L + 10, NH, NH * 0.42); c.fillStyle = pal.body; c.fill(); c.lineWidth = ol; c.strokeStyle = T.ink; c.stroke();
      if (holdKey) { c.save(); c.translate(sd * (L - 2), -4); c.rotate(sd > 0 ? -0.15 : Math.PI + 0.15); drawKey(c, 0, 0, 1.25); c.restore(); }
      c.restore();
    }
    function drawKey(c, x, y, s) {
      c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round";
      c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.moveTo(14, -5); c.lineTo(78, -5); c.lineTo(78, 5); c.lineTo(14, 5);
      c.fillStyle = pal.key; c.fill(); c.lineWidth = 4; c.strokeStyle = T.ink; c.stroke();
      rr(c, 52, 4, 9, 16, 2); c.fill(); c.stroke(); rr(c, 66, 4, 9, 22, 2); c.fill(); c.stroke();
      c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fillStyle = T.eyeInk; c.fill();
      H.sparkle(c, -10, -16, 10, 8, "#ffffff", 0);
      c.restore();
    }

    function draw(c, x, y, sc, st) {
      st = st || {};
      var t = st.t || 0, ol = 4, ink = T.ink, ph = (st.walk || 0) * Math.PI * 2 / 0.5, amt = st.walkAmt || 0;
      c.save(); c.translate(x, y); c.scale(sc, sc); c.lineJoin = "round";
      if (o.glow !== false) { var gw = c.createRadialGradient(0, 0, 60, 0, 0, 330); gw.addColorStop(0, rgba(pal.lamp, 0.12 + 0.25 * (st.lamp || 0))); gw.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gw; c.beginPath(); c.arc(0, 0, 330, 0, Math.PI * 2); c.fill(); }
      c.translate(0, -(st.hop || 0) - Math.abs(Math.sin(ph)) * 5 * amt); c.rotate((st.tilt || 0) + Math.sin(ph + 0.6) * 0.04 * amt);
      var sq = st.squash || 0; c.translate(0, FOOT); c.scale(1 + sq * 0.6, 1 - sq); c.translate(0, -FOOT);
      for (var i = 0; i < 4; i++) {
        var a = (i % 2 ? -1 : 1) * Math.sin(ph) * 0.17 * amt;
        c.save(); c.translate(LEG_X[i], BH / 2 - 6); c.rotate(a); rr(c, -LEG_W / 2, 0, LEG_W, LEG_L + 6, LEG_W * 0.42); c.fillStyle = pal.side; c.fill(); c.lineWidth = ol; c.strokeStyle = ink; c.stroke(); c.restore();
      }
      var UP = 0.55, aL = st.armL || 0, aR = st.armR || 0, kd = st.key ? (st.keySide || 1) : 0;
      if (aL < UP) arm(c, -1, aL, st.armLenL || 0, ol, kd < 0); if (aR < UP) arm(c, 1, aR, st.armLenR || 0, ol, kd > 0);
      // lamp on top (lights up when a code breaks)
      var lp = clamp(st.lamp || 0, 0, 1);
      rr(c, -26, -BH / 2 - 22, 52, 26, [13, 13, 0, 0]); c.fillStyle = mix(pal.side, pal.lamp, lp); c.fill(); c.lineWidth = ol; c.strokeStyle = ink; c.stroke();
      if (lp > 0.05) H.sparkle(c, 0, -BH / 2 - 14, 18 + 26 * lp, 14 + 20 * lp, mix(pal.lamp, "#ffffff", 0.5), 0.8 * lp, rgba(pal.lamp, 0.9));
      // body
      rr(c, -BW / 2, -BH / 2, BW, BH, RAD); c.fillStyle = pal.body; c.fill();
      c.save(); c.clip(); c.lineCap = "round"; c.lineWidth = 1.05; c.strokeStyle = dark; c.stroke(hatch.main); c.stroke(hatch.cross); c.strokeStyle = light; c.stroke(hatch.light); c.restore();
      rr(c, -BW / 2, -BH / 2, BW, BH, RAD); c.lineWidth = ol * 1.1; c.strokeStyle = ink; c.stroke();
      // drums
      var spin = st.spin == null ? 0.6 : st.spin, lock = clamp(st.lock || 0, 0, 1), n = 0;
      for (var r = 0; r < 3; r++) for (var q = 0; q < 5; q++) {
        var dx = COLS[q], dy = ROWS[r], base = phase[n] + t * spin * (2 + (n % 4) * 0.7) * (n % 2 ? 1 : -1), ang = base * (1 - lock) + (-Math.PI / 2) * lock;
        if (r === 0 && (q === 1 || q === 3)) eye(c, dx, dy - 4, 34, st, ang, ol);
        else if (r === 0) drum(c, dx, dy - 2, 20, ang, drumCols[(n + 1) % 3], ol * 0.8);
        else drum(c, dx, dy, 22, ang, drumCols[n % 3], ol * 0.8);
        n++;
      }
      if (aL >= UP) arm(c, -1, aL, st.armLenL || 0, ol, kd < 0); if (aR >= UP) arm(c, 1, aR, st.armLenR || 0, ol, kd > 0);
      c.restore();
    }
    return { draw: draw, key: function (c, x, y, s, rot) { c.save(); c.translate(x, y); c.rotate(rot || 0); drawKey(c, 0, 0, s); c.restore(); }, pal: pal,
      eyePoint: function (x, y, sc, side) { return [x + (side || -1) * -COLS[1] * sc * -1 * -1, y + (ROWS[0] - 4) * sc]; }, geom: { BW: BW, BH: BH, FOOT: FOOT } };
  }

  function win(t, a, b) { return t >= a && t < b; }
  function blink(t, s) { var p = (t + s) % 3.7; return p > 3.5 && p < 3.62; }
  function pose(move, t, opt) {
    opt = opt || {};
    var s = { t: t, spin: 0.6, lock: 0, lamp: 0, eyes: blink(t, 0.9) ? "blink" : "open", squash: Math.sin(t * 2) * 0.02, armL: 0.06, armR: 0.06 };
    switch (move) {
      case "idle": s.look = Math.sin(t * 0.6) * 0.4; break;
      case "crunch": s.spin = 3.2; s.lamp = (Math.sin(t * 23) > 0.6 ? 0.35 : 0); s.squash = Math.sin(t * 16) * 0.02; s.hop = Math.abs(Math.sin(t * 16)) * 3; s.look = Math.sin(t * 3) * 0.6; break;
      case "eureka": { // whirl, then lock and light up at 1.2 s
        var lk = sstep(0.8, 1.2, t); s.spin = 3.2 * (1 - lk); s.lock = lk; s.lamp = sstep(1.15, 1.3, t);
        var j = win(t, 1.25, 1.85) ? Math.sin((t - 1.25) / 0.6 * Math.PI) : 0; s.hop = j * 36; s.squash = -j * 0.06;
        s.eyes = t > 1.25 ? "happy" : s.eyes; s.armL = 0.06 + j * 1.2 + (t > 1.85 ? 0.3 : 0); s.armR = s.armL; break;
      }
      case "look": { var d = opt.dir || 1, k = sstep(0.2, 0.5, t); s.look = d * k; s.tilt = d * 0.04 * k; s.eyes = win(t, 1.1, 2.0) ? "happy" : s.eyes; break; }
      case "give": { // reach out with the key toward a side
        var g = opt.dir || 1, p = sstep(0.2, 0.7, t); s.key = true; s.keySide = g; s.look = g * 0.8 * p; s.tilt = g * 0.05 * p; s.lamp = 0.6;
        if (g > 0) { s.armR = 0.25 * p; s.armLenR = p; } else { s.armL = 0.25 * p; s.armLenL = p; }
        s.eyes = t > 0.9 ? "happy" : s.eyes; break;
      }
      case "walk": s.walk = t; s.walkAmt = 1; s.spin = 1.2; break;
    }
    return s;
  }
  window.BOMBE = { create: create, pose: pose, pal: PAL, MOVES: ["idle", "crunch", "eureka", "look", "give", "walk"] };
})();
