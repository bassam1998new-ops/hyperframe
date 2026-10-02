/* =====================================================================
   aurora.js — "Aurora", the speaker mascot of the Story-of-AI reel series.
   Built on the hatch kit (hatch.js, global HATCH): same block body, legs, nub arms, tall eyes and
   pencil hatching as the kit mascot, so the eye dive (K.dive + K.eyePoint) works unchanged.
   What Aurora adds: mint body with soft aurora ribbons, a sparkle antenna, blush, a MOUTH (talk),
   more faces (wide / think / wink / sad-soft) and free arms (wave, point, both-up, chin).

   var K = HATCH.kit({ w, h, seed, theme });
   var A = AURORA.create(K, { glow: true });            // build once (seeded hatching)
   A.draw(ctx, x, y, scale, AURORA.pose("talk", t));    // draw from the timeline time only
   A.draw(ctx, x, y, scale, AURORA.pose("talk", t, { env: env, fps: 30 }));   // mouth from a voice envelope

   Moves (AURORA.MOVES): idle, talk, hello, happy, surprise, think, wave, point, pointUp, cheer, nod, listen, look, dive,
     walk, walkLook, settle, lookAround. walk/walkLook/settle take { dir: heading ±1, walkT: time since the walk began (keeps the
     leg phase continuous into settle) }; walkLook also { look: buddy side ±1 }. settle is dive-ready at 0.45 s.
   A.turn(ctx, x, y, scale, turn, state): turnaround view, turn 0 front / 0.5 three-quarter / 1 side
   State fields (all optional): t, hop, squash, tilt, look (-1..1), lookY (-1..1), eyes ("open"|"happy"|"blink"|
     "wide"|"think"|"wink"), mouth 0..1 (open amount), mouthShape ("smile"|"o"|"flat"), armL/armR (rad, + = up),
     armLen (point stretch 0..1), walk, walkAmt, glowAmt, spark 0..1 (antenna glow), blush 0..1
   Screen-left arm = armL. Geometry = HATCH.geom (body 230 x 144 at scale 1; sole at G.FOOT).
   ===================================================================== */
(function () {
  var H = window.HATCH, G = H.geom, sstep = H.sstep, clamp = H.clamp, mix = H.mix, rgba = H.rgba;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

  var BRAND = { fill: "#5fd6b6", ribbons: ["#a98bf0", "#f28bb5", "#c9f7e8"], spark: "#fff3b0", blush: "#f28bb5", tongue: "#f27d96" };

  function create(K, o) {
    o = o || {};
    var T = K.T, BW = G.BW, BH = G.BH, fill = o.fill || BRAND.fill;
    var m = K.mascot({ fill: fill, radius: o.radius == null ? 30 : o.radius,
      hatch: rgba(mix(fill, T.ink, 0.6), 0.5), light: rgba(mix(fill, "#ffffff", 0.6), 0.55), glow: rgba(fill, 0.3) });
    var rib = o.ribbons || BRAND.ribbons;
    // ribbon hatch: short pencil strokes so the aurora bands read hand-drawn, not gradient
    var ribHatch = K.hatch(BW / 2, 30, { angle: -1.1, spacing: 5, len: 12, gapMin: 4, gapMax: 14, jit: 0.1 });

    function ribbons(c, t) {
      for (var i = 0; i < rib.length; i++) {
        var y0 = -BH * 0.5 + 10 + i * 9, amp = 6 + i * 2, ph = t * (0.9 + i * 0.25) + i * 1.7;
        c.beginPath();
        for (var x = -BW / 2 - 4; x <= BW / 2 + 4; x += 6) c.lineTo(x, y0 + Math.sin(x * 0.03 + ph) * amp);
        for (x = BW / 2 + 4; x >= -BW / 2 - 4; x -= 6) c.lineTo(x, y0 + 9 + Math.sin(x * 0.03 + ph + 0.5) * amp * 0.8);
        c.closePath();
        c.save(); c.globalAlpha = i === 2 ? 0.55 : 0.5; c.fillStyle = rib[i]; c.fill(); c.clip();
        c.globalAlpha = 0.5; c.strokeStyle = mix(rib[i], T.ink, 0.35); c.lineWidth = 1; c.translate(0, y0); c.stroke(ribHatch); c.restore();
      }
    }

    function arm(c, sd, ang, len, ol) {
      // pivot at the shoulder (body edge); arm points sideways, + ang raises it
      var up = sstep(0.4, 1.4, ang); // raised arms move their shoulder up toward the top corner
      c.save(); c.translate(sd * (BW / 2 + 2 - up * 6), G.NUB_Y - up * BH * 0.36); c.rotate(-sd * ang);
      var L = G.NUB_W + 8 + Math.min(1, Math.max(0, ang) / 1.2) * 10 + len * 34, in0 = 10;
      rr(c, sd < 0 ? -L : -in0, -G.NUB_H / 2, L + in0, G.NUB_H, G.NUB_H * 0.42);
      c.fillStyle = m.fill; c.fill(); c.lineWidth = ol; c.strokeStyle = T.ink; c.stroke();
      c.restore();
    }

    function eyes(c, st) {
      var ink = T.ink, lx = (st.look || 0) * 8, ly = (st.lookY || 0) * 6;
      for (var e = -1; e <= 1; e += 2) {
        var ex = e * G.EYE_X + lx, ey = G.EYE_Y + ly, kind = st.eyes || "open";
        if (kind === "wink") kind = e < 0 ? "happy" : "open";
        c.lineCap = "round"; c.strokeStyle = ink; c.lineWidth = 4.4;
        if (kind === "happy") {
          c.beginPath(); c.moveTo(ex - G.EYE_W * 0.85, ey + G.EYE_H * 0.12); c.lineTo(ex, ey - G.EYE_H * 0.22); c.lineTo(ex + G.EYE_W * 0.85, ey + G.EYE_H * 0.12); c.stroke();
        } else if (kind === "blink") {
          c.beginPath(); c.moveTo(ex - G.EYE_W * 0.6, ey); c.lineTo(ex + G.EYE_W * 0.6, ey); c.stroke();
        } else {
          var w = G.EYE_W, h = G.EYE_H;
          if (kind === "wide") { w *= 1.18; h *= 1.22; }
          if (kind === "think" && e > 0) { h *= 0.62; ey += G.EYE_H * 0.12; } // curious squint on one eye, never a frown
          rr(c, ex - w / 2, ey - h / 2, w, h, G.EYE_R * (kind === "wide" ? 1.3 : 1)); c.fillStyle = T.eyeInk; c.fill();
          var hs = w * (kind === "wide" ? 0.42 : 0.36), hx = e < 0 ? ex + w / 2 - hs - 2.2 : ex - w / 2 + 2.2;
          rr(c, hx, ey - h / 2 + 2.6, hs, hs, hs * 0.3); c.fillStyle = T.highlight; c.fill();
        }
      }
    }

    function mouth(c, st) {
      var ink = T.ink, mx = (st.look || 0) * 8, my = BH * 0.13 + (st.lookY || 0) * 4, open = clamp(st.mouth || 0, 0, 1), shape = st.mouthShape || "smile";
      c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = ink; c.lineWidth = 4;
      if (shape === "o") {
        var r = 6 + open * 5; c.beginPath(); c.ellipse(mx, my + 2, r * 0.8, r, 0, 0, Math.PI * 2); c.fillStyle = T.eyeInk; c.fill(); return;
      }
      if (open < 0.06) {
        c.beginPath();
        if (shape === "flat") { c.moveTo(mx - 9, my); c.lineTo(mx + 9, my); }
        else c.ellipse(mx, my - 4, 12, 8, 0, 0.2 * Math.PI, 0.8 * Math.PI);
        c.stroke(); return;
      }
      var mw = 13 + open * 5, mh = 4 + open * 11;
      c.beginPath(); c.moveTo(mx - mw, my - 3);
      c.quadraticCurveTo(mx, my - 3 + (shape === "flat" ? 0 : 3), mx + mw, my - 3);
      c.quadraticCurveTo(mx + mw * 0.9, my + mh, mx, my + mh); c.quadraticCurveTo(mx - mw * 0.9, my + mh, mx - mw, my - 3);
      c.closePath(); c.fillStyle = T.eyeInk; c.fill();
      if (open > 0.35) { c.save(); c.clip(); c.beginPath(); c.ellipse(mx, my + mh + 2, mw * 0.6, mh * 0.45, 0, 0, Math.PI * 2); c.fillStyle = BRAND.tongue; c.fill(); c.restore(); }
    }

    // voice grille: 3 sound bars on her chest; they pulse with the voice (st.voice, defaults to the mouth)
    function grille(c, st, t) {
      var v = clamp(st.voice == null ? (st.mouth || 0) : st.voice, 0, 1), gx = (st.look || 0) * 5, gy = BH * 0.35;
      for (var i = -1; i <= 1; i++) {
        var k = i === 0 ? 1 : 0.6 + 0.4 * Math.sin(t * 17 + i * 2.1), h = 20 + v * k * 22, bx = gx + i * 15 - 4;
        rr(c, bx, gy - h / 2, 8, h, 4); c.fillStyle = mix(m.fill, "#ffffff", 0.3 + v * 0.6); c.fill();
        c.lineWidth = 2.6; c.strokeStyle = T.ink; c.stroke();
      }
    }

    function antenna(c, st, t, ol) {
      var sw = Math.sin(t * 3.1) * 0.08 + (st.tilt || 0) * -0.8;
      c.save(); c.translate(0, -BH / 2 + 2); c.rotate(sw);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -22, 0, -40); c.lineWidth = ol; c.strokeStyle = T.ink; c.lineCap = "round"; c.stroke();
      var sp = st.spark == null ? 0.35 : st.spark, tw = 1 + 0.12 * Math.sin(t * 7), r = (15 + 9 * sp) * tw;
      H.sparkle(c, 0, -46, r, r * 0.78, BRAND.spark, 0.35 + 0.65 * sp, rgba(BRAND.spark, 0.9));
      c.restore();
    }

    function draw(c, x, y, sc, st) {
      st = st || {};
      var t = st.t || 0, z = Math.max(st.zoom || 1, 1), zk = Math.pow(z, 0.35) / z, ol = 4 * zk, ink = T.ink;
      var ph = (st.walk || 0) * Math.PI * 2 / 0.5, amt = st.walkAmt || 0;
      c.save(); c.translate(x, y); c.scale(sc, sc);
      var ga = (st.glowAmt == null ? (o.glow === false ? 0 : 1) : st.glowAmt) * (1 - sstep(1.5, 3, z));
      if (ga > 0.003) {
        var gw = c.createRadialGradient(0, 0, 40, 0, 0, 270); gw.addColorStop(0, m.glow); gw.addColorStop(1, "rgba(0,0,0,0)");
        c.globalAlpha = ga; c.fillStyle = gw; c.beginPath(); c.arc(0, 0, 270, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      }
      c.translate(0, -(st.hop || 0) - Math.abs(Math.sin(ph)) * 5 * amt);
      c.rotate((st.tilt || 0) + Math.sin(ph + 0.6) * 0.06 * amt);
      var sq = st.squash || 0; // + squash (wide, low), - stretch; pivot at the soles so feet stay planted
      c.translate(0, G.FOOT); c.scale(1 + sq * 0.6, 1 - sq); c.translate(0, -G.FOOT);
      c.lineJoin = "round";
      for (var i = 0; i < 4; i++) {
        var a = (i % 2 === 0 ? 1 : -1) * Math.sin(ph) * 0.17 * amt + (st.legWiggle || 0) * Math.sin(t * 9 + i * 1.7);
        c.save(); c.translate(G.LEG_X[i], BH / 2 - 6); c.rotate(a);
        rr(c, -G.LEG_W / 2, 0, G.LEG_W, G.LEG_L + 6, G.LEG_W * 0.42); c.fillStyle = m.fill; c.fill(); c.lineWidth = ol; c.strokeStyle = ink; c.stroke(); c.restore();
      }
      antenna(c, st, t, ol);
      var UP = 0.55, aL = st.armL || 0, aR = st.armR || 0; // lowered arms sit behind the body, raised ones in front
      if (aL < UP) arm(c, -1, aL, st.armLenL || 0, ol); if (aR < UP) arm(c, 1, aR, st.armLenR || 0, ol);
      rr(c, -BW / 2, -BH / 2, BW, BH, m.radius); c.fillStyle = m.fill; c.fill();
      c.save(); c.clip(); c.lineCap = "round"; c.lineWidth = 1.05 * zk;
      ribbons(c, t);
      c.strokeStyle = m.hDark; c.stroke(m.h.main); c.stroke(m.h.cross); c.strokeStyle = m.hLight; c.stroke(m.h.light);
      var bl = st.blush == null ? 0.6 : st.blush;
      if (bl > 0) for (var e = -1; e <= 1; e += 2) { c.globalAlpha = 0.5 * bl; c.fillStyle = BRAND.blush; c.beginPath(); c.ellipse(e * (G.EYE_X + 22) + (st.look || 0) * 8, BH * 0.08, 15, 8, 0, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1; c.restore();
      rr(c, -BW / 2, -BH / 2, BW, BH, m.radius); c.lineWidth = ol * 1.1; c.strokeStyle = ink; c.stroke();
      eyes(c, st); mouth(c, st); grille(c, st, t);
      if (aL >= UP) arm(c, -1, aL, st.armLenL || 0, ol); if (aR >= UP) arm(c, 1, aR, st.armLenR || 0, ol);
      c.restore();
    }
    /* turnaround view (for model sheets): turn 0 = front, 0.5 = three-quarter, 1 = side (facing screen left) */
    var DEP = BW * 0.62;
    function drawTurn(c, x, y, sc, turn, st) {
      st = st || {}; var t = st.t || 0, a = turn * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), ink = T.ink, ol = 4;
      var fw = BW * ca, sw = DEP * sa, x0 = -(fw + sw) / 2, sideFill = mix(m.fill, T.ink, 0.13);
      c.save(); c.translate(x, y); c.scale(sc, sc); c.lineJoin = "round";
      if (o.glow !== false) { var gw = c.createRadialGradient(0, 0, 40, 0, 0, 270); gw.addColorStop(0, m.glow); gw.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gw; c.beginPath(); c.arc(0, 0, 270, 0, Math.PI * 2); c.fill(); }
      function leg(lx, col) { rr(c, lx - G.LEG_W / 2, BH / 2 - 6, G.LEG_W, G.LEG_L + 6, G.LEG_W * 0.42); c.fillStyle = col; c.fill(); c.lineWidth = ol; c.strokeStyle = ink; c.stroke(); }
      if (sw > 1) { leg(x0 + fw + sw * 0.82, sideFill); leg(x0 + fw + sw * 0.6, sideFill); }      // back legs peek out on the side
      if (fw > 1) for (var i = 0; i < 4; i++) leg(x0 + fw / 2 + G.LEG_X[i] * ca, m.fill);
      else { leg(x0 + 12, m.fill); leg(x0 + 34, m.fill); }
      // antenna on the top centre of the box
      c.save(); c.translate(x0 + fw / 2 + sw / 2 * (fw > 1 ? 0.35 : 1), -BH / 2 + 2);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -22, 0, -40); c.lineWidth = ol; c.strokeStyle = ink; c.lineCap = "round"; c.stroke();
      H.sparkle(c, 0, -46, 20, 16, BRAND.spark, 0.6, rgba(BRAND.spark, 0.9)); c.restore();
      if (ca > 0.2) { // both side arms behind the body (front + three-quarter)
        c.save(); c.translate(x0 + fw / 2, 0); c.scale(ca, 1); arm(c, -1, 0.08, 0, ol / ca); c.restore();
        c.save(); c.translate(x0 + fw + sw - BW / 2, 0); arm(c, 1, 0.08, 0, ol); c.restore();
      }
      function face(px, w, col, front, radii, seam) {
        rr(c, px, -BH / 2, w, BH, radii); c.fillStyle = col; c.fill();
        c.save(); c.clip(); c.translate(px + w / 2, 0); c.scale(Math.max(w / BW, 0.01), 1);
        ribbons(c, t); c.lineCap = "round"; c.lineWidth = 1.05;
        c.strokeStyle = m.hDark; c.stroke(m.h.main); c.stroke(m.h.cross); if (front) { c.strokeStyle = m.hLight; c.stroke(m.h.light); }
        c.restore();
        if (seam) { c.beginPath(); c.moveTo(px + w, -BH / 2 + 3); c.lineTo(px + w, BH / 2 - 3); c.lineWidth = 2; c.strokeStyle = rgba(T.ink, 0.35); c.stroke(); return; }
        rr(c, px, -BH / 2, w, BH, radii); c.lineWidth = ol * 1.1; c.strokeStyle = ink; c.stroke();
      }
      var R0 = Math.min(m.radius, (fw + sw) / 2);
      if (sw > 1) face(x0, fw + sw, sideFill, false, R0); // whole block in the side tone, front face laid over it
      if (fw > 1) {
        face(x0, fw, m.fill, true, sw > 1 ? [R0, 0, 0, R0] : R0, sw > 1);
        c.save(); c.translate(x0 + fw / 2 - sa * 18, 0); c.scale(ca, 1);
        c.save(); c.globalAlpha = 0.3; c.fillStyle = BRAND.blush; for (var e = -1; e <= 1; e += 2) { c.beginPath(); c.ellipse(e * (G.EYE_X + 22), BH * 0.08, 15, 8, 0, 0, Math.PI * 2); c.fill(); } c.restore();
        eyes(c, st); mouth(c, st); grille(c, st, t); c.restore();
      } else { // pure side: one eye + mouth at the front edge
        rr(c, x0 + 14, G.EYE_Y - G.EYE_H / 2, G.EYE_W * 0.8, G.EYE_H, G.EYE_R); c.fillStyle = T.eyeInk; c.fill();
        rr(c, x0 + 16, G.EYE_Y - G.EYE_H / 2 + 2.6, 6, 6, 2); c.fillStyle = T.highlight; c.fill();
        c.beginPath(); c.ellipse(x0 + 14, BH * 0.13 - 4, 8, 6, 0, 0.2 * Math.PI, 0.65 * Math.PI); c.lineWidth = 4; c.strokeStyle = ink; c.lineCap = "round"; c.stroke();
      }
      if (fw <= 1) { // side view: the near arm sticks out of the side toward the viewer
        var ax = x0 + fw + sw * 0.5; rr(c, ax - G.NUB_W * 0.55, G.NUB_Y - G.NUB_H / 2 + 6, G.NUB_W * 1.1, G.NUB_H, G.NUB_H * 0.45);
        c.fillStyle = m.fill; c.fill(); c.lineWidth = ol; c.strokeStyle = ink; c.stroke();
      }
      c.restore();
    }
    return { m: m, draw: draw, turn: drawTurn, brand: BRAND, eyePoint: K.eyePoint };
  }

  /* ---------------- moves: state from time only (seek-safe) ---------------- */
  function blink(t, seed) { var p = (t + seed) % 3.3; return p > 3.12 && p < 3.24; }
  function chatter(t) { // fake speech: syllables ~5/s, phrase gaps every few seconds
    var syl = Math.max(0, Math.sin(t * 31.4) * 0.55 + Math.sin(t * 13.2 + 1.3) * 0.45);
    var phrase = sstep(-0.2, 0.3, Math.sin(t * 1.15 + 0.4)); return clamp(syl * 1.25, 0, 1) * phrase;
  }
  function envAt(env, fps, t) { if (!env || !env.length) return null; var f = t * (fps || 30), i = Math.floor(f), k = f - i; var a = env[Math.min(i, env.length - 1)] || 0, b = env[Math.min(i + 1, env.length - 1)] || 0; return a + (b - a) * k; }

  // pose(move, t, opt): opt { env, fps (voice envelope 0..1 per frame), dir ±1 (point side), k (move strength 0..1) }
  function pose(move, t, opt) {
    opt = opt || {};
    var breathe = Math.sin(t * 2.2) * 0.025, s = { t: t, squash: breathe, hop: 0, eyes: blink(t, 0.4) ? "blink" : "open", mouth: 0, spark: 0.35 + 0.15 * Math.sin(t * 2), armL: 0.08, armR: 0.08 };
    var cyc;
    switch (move) {
      case "idle":
        s.look = sstep(1.0, 1.4, t % 6) * (1 - sstep(2.6, 3.0, t % 6)) * 0.8 - sstep(3.6, 4.0, t % 6) * (1 - sstep(4.8, 5.2, t % 6)) * 0.6;
        s.hop = Math.sin(t * 2.2) * 3; s.armL = 0.1 + Math.sin(t * 2.2) * 0.05; s.armR = 0.1 + Math.sin(t * 2.2 + 0.4) * 0.05; break;
      case "talk": case "hello": case "listen": {
        var v = envAt(opt.env, opt.fps, t); v = v == null ? chatter(t) : clamp(v, 0, 1);
        s.mouth = move === "listen" ? 0 : v; s.spark = 0.35 + 0.65 * s.mouth;
        s.squash = breathe - s.mouth * 0.035; s.hop = s.mouth * 4 + Math.sin(t * 2.2) * 2;
        s.tilt = Math.sin(t * 1.3) * 0.035; s.look = Math.sin(t * 0.7) * 0.25;
        // hand gestures land on the beats of the phrase
        var g = sstep(0.2, 0.6, Math.sin(t * 0.9 + 0.3)), g2 = sstep(0.3, 0.7, Math.sin(t * 0.75 + 2.2));
        s.armR = 0.1 + g * (0.6 + 0.15 * Math.sin(t * 6)); s.armL = 0.1 + g2 * (0.45 + 0.12 * Math.sin(t * 5 + 1));
        if (move === "hello") { var w = sstep(0.1, 0.4, t); s.armR = 0.1 + w * (1.0 + 0.3 * Math.sin(t * 15)); s.eyes = win(t, 0.5, 1.6) ? "happy" : s.eyes; s.hop += sstep(0, 0.15, t) * (1 - sstep(0.15, 0.4, t)) * 30; }
        if (move === "listen") { s.tilt = 0.12 * sstep(0, 0.5, t); s.look = 0.5; s.lookY = -0.2; s.armL = 0.1; s.armR = 0.1; s.eyes = blink(t, 1.1) ? "blink" : "open"; }
        break;
      }
      case "happy": // little jump with ^ ^ every 1.6 s
        cyc = t % 1.6; var j = Math.sin(clamp((cyc - 0.25) / 0.55, 0, 1) * Math.PI);
        s.hop = j * 46; s.squash = cyc < 0.25 ? sstep(0, 0.25, cyc) * 0.12 : cyc > 0.8 && cyc < 1.05 ? 0.12 * (1 - sstep(0.8, 1.05, cyc)) : -j * 0.08;
        s.eyes = "happy"; s.mouth = 0.55; s.armL = 0.3 + j * 1.1; s.armR = 0.3 + j * 1.1; s.spark = 0.6 + 0.4 * j; s.blush = 1; break;
      case "cheer":
        s.eyes = "happy"; s.mouth = 0.75; s.armL = 1.35 + Math.sin(t * 12) * 0.2; s.armR = 1.35 + Math.sin(t * 12 + 1.5) * 0.2; s.hop = Math.abs(Math.sin(t * 6)) * 14; s.spark = 1; s.blush = 1; break;
      case "surprise": {
        var k = sstep(0.2, 0.32, t % 3), back = 1 - sstep(2.2, 2.6, t % 3);
        var a = k * back; s.eyes = a > 0.5 ? "wide" : s.eyes; s.mouthShape = a > 0.5 ? "o" : "smile"; s.mouth = a;
        s.hop = a * 22 * (1 - sstep(0.32, 0.7, t % 3)) + a * 4; s.squash = -a * 0.08; s.armL = 0.1 + a * 0.9; s.armR = 0.1 + a * 0.9; s.spark = 0.35 + 0.65 * a; s.tilt = -a * 0.04; break;
      }
      case "think":
        s.eyes = blink(t, 2) ? "blink" : "think"; s.look = 0.6; s.lookY = -0.5; s.mouthShape = "o"; s.mouth = 0.3; s.tilt = 0.08;
        s.armR = 1.75 + Math.sin(t * 4) * 0.06; s.armL = 0.05; // hand up by the head, scratching
        s.spark = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * 5)); break;
      case "wave":
        s.armR = 1.1 + 0.3 * Math.sin(t * 14); s.eyes = (t % 4) < 1.2 ? "happy" : s.eyes; s.mouth = 0.35; s.tilt = -0.05 + Math.sin(t * 7) * 0.02; break;
      case "point": { // point to a screen side (dir -1 left, +1 right) and explain
        var d = opt.dir || 1, p = sstep(0.05, 0.35, t);
        if (d > 0) { s.armR = 0.35 * p; s.armLenR = p; } else { s.armL = 0.35 * p; s.armLenL = p; }
        s.look = d * 0.9 * p; s.tilt = d * 0.05 * p; s.mouth = t > 0.5 ? chatter(t) * 0.8 : 0; s.spark = 0.35 + 0.5 * s.mouth; break;
      }
      case "pointUp": {
        var q = sstep(0.05, 0.35, t), dd = opt.dir || 1;
        if (dd > 0) { s.armR = 1.25 * q; s.armLenR = q; } else { s.armL = 1.25 * q; s.armLenL = q; }
        s.look = dd * 0.4; s.lookY = -0.8 * q; s.mouth = t > 0.5 ? chatter(t) * 0.7 : 0; break;
      }
      case "look": { // look at a buddy on one side (dir -1 left, +1 right), smile when they meet
        var dl = opt.dir || 1, lk = sstep(0.2, 0.5, t);
        s.look = dl * lk; s.tilt = dl * 0.06 * lk; s.eyes = win(t, 1.1, 2.0) ? "happy" : s.eyes; s.mouth = win(t, 1.1, 2.0) ? 0.3 : 0;
        if (dl > 0) s.armR = 0.08 + 0.25 * lk; else s.armL = 0.08 + 0.25 * lk; break;
      }
      case "nod":
        cyc = t % 1.2; s.tilt = 0; s.hop = -Math.abs(Math.sin(cyc / 1.2 * Math.PI * 2)) * 6; s.squash = Math.abs(Math.sin(cyc / 1.2 * Math.PI * 2)) * 0.05; s.eyes = "happy"; s.mouth = 0; break;
      case "walk": case "walkLook": { // walk cycle (style card: 0.5 s step, 5 px bob, legs swing 0.17 rad in pairs); dir = heading
        var wd = opt.dir || 1, wph = (opt.walkT == null ? t : opt.walkT) * Math.PI * 2 / 0.5;
        s.walk = opt.walkT == null ? t : opt.walkT; s.walkAmt = opt.k == null ? 1 : opt.k;
        s.armL = 0.12 + Math.sin(wph) * 0.2 * s.walkAmt; s.armR = 0.12 - Math.sin(wph) * 0.2 * s.walkAmt; // arms swing against the legs
        s.look = wd * 0.35; s.tilt = wd * 0.03; s.squash = Math.abs(Math.cos(wph)) * 0.025 * s.walkAmt;
        s.spark = 0.4 + 0.2 * Math.abs(Math.sin(wph));
        if (move === "walkLook") { // glance at a buddy on side opt.look while walking, ^ ^ when eyes meet
          var lb = opt.look || -wd, gk = sstep(0.3, 0.55, t) * (1 - sstep(2.2, 2.5, t));
          s.look = s.look * (1 - gk) + lb * gk; s.tilt += lb * 0.04 * gk;
          s.eyes = win(t, 0.9, 1.7) ? "happy" : s.eyes; s.mouth = win(t, 0.9, 1.7) ? 0.35 : 0; s.blush = 0.6 + 0.4 * gk;
        }
        break;
      }
      case "settle": { // stop walking and stand still: legs ease out by 0.25 s, a small landing squash, blink, eyes front by 0.45 s (dive-ready)
        var wt = opt.walkT == null ? t : opt.walkT, sd2 = opt.dir || 1;
        s.walk = wt; s.walkAmt = 1 - sstep(0, 0.25, t);
        var bump = sstep(0.18, 0.28, t) * (1 - sstep(0.28, 0.45, t));
        s.squash = bump * 0.08; s.hop = -bump * 4;
        s.look = sd2 * 0.35 * (1 - sstep(0.15, 0.4, t)); s.tilt = sd2 * 0.03 * (1 - sstep(0.1, 0.35, t)) - bump * sd2 * 0.03;
        var wp = wt * Math.PI * 2 / 0.5; s.armL = 0.08 + Math.sin(wp) * 0.2 * s.walkAmt; s.armR = 0.08 - Math.sin(wp) * 0.2 * s.walkAmt;
        s.eyes = win(t, 0.3, 0.4) ? "blink" : (t > 0.45 && blink(t, 0.4) ? "blink" : "open"); s.mouth = 0; break;
      }
      case "lookAround": { // look left, back, look right, back (3 s, loops)
        var lt = t % 3, L1 = sstep(0.2, 0.45, lt) * (1 - sstep(1.0, 1.25, lt)), R1 = sstep(1.55, 1.8, lt) * (1 - sstep(2.35, 2.6, lt));
        s.look = -L1 + R1; s.tilt = (-L1 + R1) * 0.06; s.lookY = -0.15 * (L1 + R1);
        s.eyes = win(lt, 1.3, 1.42) || win(lt, 2.8, 2.92) ? "blink" : "open"; break;
      }
      case "dive": // calm, eyes front, ready for K.dive into the left eye
        s.look = 0; s.lookY = 0; s.eyes = "open"; s.mouth = 0; s.hop = 0; s.squash = 0; break;
    }
    if (opt.k != null) { /* strength blend toward idle-neutral */ var n = opt.k; s.armL *= n; s.armR *= n; s.hop *= n; }
    return s;
  }
  function win(t, a, b) { return t >= a && t < b; }
  // blend two poses (for transitions): numeric fields lerp, discrete fields switch at 0.5
  function blend(a, b, k) { var o = {}, key; for (key in a) o[key] = a[key]; for (key in b) { var x = a[key], y = b[key]; o[key] = (typeof y === "number" && typeof x === "number") ? x + (y - x) * k : (k < 0.5 && x !== undefined ? x : y); } return o; }

  window.AURORA = { create: create, pose: pose, blend: blend, brand: BRAND,
    MOVES: ["idle", "talk", "hello", "happy", "surprise", "think", "wave", "point", "pointUp", "cheer", "nod", "listen", "look", "dive", "walk", "walkLook", "settle", "lookAround"] };
})();
