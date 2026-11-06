/* p3d-mechanics.js — photoreal three.js scenes + corrected physics for the Mechanics simulations.
   Each scene is keyed by the simulation's modeName. step() replaces the original stepper, overlay() is the 2D HUD. */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, G = 9.80665;
  const deg = (r) => (r * 180) / Math.PI, rad = (d) => (d * Math.PI) / 180;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const earth = () => new T.MeshStandardMaterial({ color: 0x6b5236, roughness: 1 });
  function rk4(f, y, dt) {
    const k1 = f(y), y2 = y.map((v, i) => v + 0.5 * dt * k1[i]), k2 = f(y2), y3 = y.map((v, i) => v + 0.5 * dt * k2[i]), k3 = f(y3), y4 = y.map((v, i) => v + dt * k3[i]), k4 = f(y4);
    return y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  function protractorTex() {
    const c = P.util.cv(1024, 1024), g = c.getContext("2d"), cx = 512, cy = 512;
    g.clearRect(0, 0, 1024, 1024); g.fillStyle = "rgba(210,235,255,0.16)"; g.beginPath(); g.arc(cx, cy, 500, 0, TAU); g.fill();
    g.strokeStyle = "rgba(235,246,255,0.9)"; g.fillStyle = "rgba(235,246,255,0.95)"; g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let d = -90; d <= 90; d++) {
      const big = d % 10 === 0, mid = d % 5 === 0, a = rad(d), r0 = big ? 420 : mid ? 450 : 470;
      g.lineWidth = big ? 3 : 1.5; g.beginPath(); g.moveTo(cx + 500 * Math.sin(a), cy + 500 * Math.cos(a)); g.lineTo(cx + r0 * Math.sin(a), cy + r0 * Math.cos(a)); g.stroke();
      if (big && d !== 0 || d === 0) g.fillText(String(Math.abs(d)), cx + 385 * Math.sin(a), cy + 385 * Math.cos(a));
    }
    g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 500, 0, TAU); g.stroke();
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  function poleTex(h) {
    const c = P.util.cv(64, 64 * h), g = c.getContext("2d");
    for (let i = 0; i < h; i++) { g.fillStyle = i % 2 ? "#f3f3f1" : "#d6372d"; g.fillRect(0, c.height - (i + 1) * 64, 64, 64); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }

  /* =================== SIMPLE PENDULUM =================== */
  const PY = 3.0, BR = 0.1, MASS = 1.0;
  P.scenes["Simple Pendulum"] = {
    env: "lab", envOpts: { w: 13, d: 8 }, cam: [[0.35, 2.15, 5.3], [-0.1, 1.85, 0]], sub: 2,
    build(S, s, c) {
      const mk = S.mk, o = S.objs;
      mk.stand(3.35, -1.5, 0); mk.rod(V3(-1.95, PY, 0), V3(0.3, PY, 0), 0.035, M.chrome());
      mk.box(0.2, 0.16, 0.2, M.steel(), -1.95, PY, 0); mk.box(0.2, 0.09, 0.15, M.steel(), 0.02, PY - 0.03, 0);
      const pr = new T.Mesh(new T.CircleGeometry(1.15, 96, Math.PI, Math.PI), new T.MeshPhysicalMaterial({ map: protractorTex(), transparent: true, roughness: 0.1, clearcoat: 1, side: T.DoubleSide, depthWrite: false }));
      pr.position.set(0, PY, -0.2); pr.renderOrder = 1; S.scene.add(pr);
      o.string = mk.rod(V3(0, PY, 0), V3(0, PY - 1, 0), 0.007, M.matte(0xf2efe6, 0.9), 8);
      o.bob = mk.sphere(BR, M.chrome()); o.eye = mk.torus(0.022, 0.007, M.steel());
      const gm = new T.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.14, depthWrite: false });
      o.gA = mk.sphere(BR, gm); o.gB = mk.sphere(BR, gm); o.gA.castShadow = o.gB.castShadow = false;
      o.aW = mk.arrow(0xff5a5a, 0.022, 0.07); o.aT = mk.arrow(0x58a6ff, 0.022, 0.07); o.aF = mk.arrow(0xffc857, 0.022, 0.07);
    },
    reset(s, c) { s.th = rad(c.amp); s.w = 0; s.t = 0; s.ampSet = c.amp; s.Tm = null; s.lastX = null; s.trace = []; },
    step(s, c, dt) {
      if (s.ampSet !== c.amp || s.th === undefined) P.scenes["Simple Pendulum"].reset(s, c);
      const f = (y) => [y[1], -(c.g / c.length) * Math.sin(y[0])], n = 6, h = dt / n;
      for (let i = 0; i < n; i++) {
        const prev = s.th, y = rk4(f, [s.th, s.w], h); s.th = y[0]; s.w = y[1]; s.t += h;
        if (prev > 0 && s.th <= 0) { const tc = s.t - h + h * (prev / (prev - s.th)); if (s.lastX !== null) s.Tm = tc - s.lastX; s.lastX = tc; }
      }
    },
    update(S, s, c, dt) {
      if (s.th === undefined) return; const o = S.objs, L = c.length, th = s.th, sn = Math.sin(th), cs = Math.cos(th);
      const piv = V3(0, PY, 0), dir = V3(sn, -cs, 0), end = piv.clone().addScaledVector(dir, L - BR * 0.92), bp = piv.clone().addScaledVector(dir, L);
      o.bob.position.copy(bp); S.setRod(o.string, piv, end); o.eye.position.copy(end); o.eye.rotation.z = th;
      const a = rad(c.amp); o.gA.position.set(L * Math.sin(a), PY - L * Math.cos(a), 0); o.gB.position.set(-L * Math.sin(a), PY - L * Math.cos(a), 0);
      const Tn = MASS * (c.g * cs + L * s.w * s.w), sc = 0.07;
      S.setArrow(o.aW, bp, V3(0, -MASS * c.g, 0), sc); S.setArrow(o.aT, bp, dir.clone().multiplyScalar(-Tn), sc);
      S.setArrow(o.aF, bp, V3(cs, sn, 0).multiplyScalar(-MASS * c.g * sn), sc * 1.6);
      s.Tn = Tn; if (dt > 0) pushTrace(s, "trace", deg(th), 260);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.th === undefined) return;
      const L = c.length, bp = V3(L * Math.sin(s.th), PY - L * Math.cos(s.th), 0);
      H.at(ctx, S, bp, `θ = ${f1(deg(s.th), 1)}°`, "#ffd27a", 16, -16, 12.5);
      H.pill(ctx, 14, 26, "● W = mg", "#ff7b7b", 11); H.pill(ctx, 14, 48, "● T  (string tension)", "#7db8ff", 11); H.pill(ctx, 14, 70, "● F = −mg sinθ  (restoring)", "#ffd27a", 11);
      H.pill(ctx, w - 14, 26, `m = ${MASS.toFixed(1)} kg · L = ${f1(c.length, 2)} m · g = ${f1(c.g, 1)} m/s²`, "#cfe0ff", 10.5, "right");
      H.panel(ctx, 14, 316, 318, 72);
      drawTrace(ctx, s.trace, 24, 336, 298, 44, "#7fe3da", -65, 65);
      label(ctx, 22, 330, "angle θ (°) vs time — non-sinusoidal at large amplitude", "#bcd0ea", 9.5);
    },
    readouts(s, c) {
      const T0 = TAU * Math.sqrt(c.length / c.g), A = rad(c.amp), Ttrue = T0 * (1 + A * A / 16 + (11 * A ** 4) / 3072);
      const vmax = Math.sqrt(2 * c.g * c.length * (1 - Math.cos(A)));
      return [["Period T (large-angle)", `${f1(Ttrue, 3)} s`], ["Small-angle T₀ = 2π√(L/g)", `${f1(T0, 3)} s`], ["Measured period", s.Tm ? `${f1(s.Tm, 3)} s` : "timing…"],
        ["Frequency f = 1/T", `${f1(1 / Ttrue, 3)} Hz`], ["Max speed (bottom)", `${f1(vmax, 2)} m/s`], ["T₀ error at this amplitude", `${f1((Ttrue / T0 - 1) * 100, 1)} %`]];
    },
  };

  /* =================== PROJECTILE MOTION =================== */
  const KD = 0.0022, BALL = 0.3, BLEN = 1.7;
  const pf = (k) => (y) => { const sp = Math.hypot(y[2], y[3]); return [y[2], y[3], -k * sp * y[2], -G - k * sp * y[3]]; };
  function flight(c) {                                                  // full trajectory (for the prediction dots and range readouts)
    const a = rad(c.angle), k = c.drag ? KD : 0, pts = []; let y = [0, BALL, c.speed * Math.cos(a), c.speed * Math.sin(a)], t = 0, apex = 0;
    for (let i = 0; i < 4000; i++) {
      pts.push([y[0], y[1], t]); apex = Math.max(apex, y[1] - BALL); const n = rk4(pf(k), y, 0.01);
      if (n[1] <= BALL && i > 0) { const fr = Math.min(1, Math.max(0, (y[1] - BALL) / (y[1] - n[1]))); pts.push([y[0] + (n[0] - y[0]) * fr, BALL, t + 0.01 * fr]); t += 0.01 * fr; y = n; break; }
      y = n; t += 0.01;
    }
    const last = pts[pts.length - 1]; return { pts, range: last[0], T: last[2], apex };
  }
  P.scenes["Projectile Motion"] = {
    env: "outdoor", envOpts: { shadowArea: 34 }, cam: [[6, 5, 38], [30, 7, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs;
      const mound = new T.Mesh(new T.SphereGeometry(1.7, 40, 20, 0, TAU, 0, Math.PI / 2), earth()); mound.scale.set(1.2, 0.55, 1.0); mound.position.set(-0.4, 0, 0); mound.castShadow = mound.receiveShadow = true; S.scene.add(mound);
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i - 4) * 0.34, sb = mk.sphere(0.4, M.matte(0xb69a6b, 1), -0.6 + Math.cos(a) * 2.3, 0.2, Math.sin(a) * 2.0); sb.scale.set(1.3, 0.55, 0.8); sb.rotation.y = -a; }
      o.bg = new T.Group(); o.bg.position.set(0, BALL, 0); S.scene.add(o.bg);
      const barrel = new T.Mesh(new T.CylinderGeometry(0.2, 0.33, BLEN, 40), M.iron()); barrel.position.y = BLEN / 2; barrel.castShadow = true;
      const band = new T.Mesh(new T.TorusGeometry(0.31, 0.04, 12, 40), M.brass()); band.rotation.x = Math.PI / 2; band.position.y = 0.45;
      const band2 = band.clone(); band2.scale.setScalar(0.88); band2.position.y = BLEN - 0.1;
      const cap = new T.Mesh(new T.SphereGeometry(0.33, 24, 16), M.iron()); cap.position.y = 0; o.bg.add(barrel, band, band2, cap);
      o.ball = mk.sphere(BALL, M.iron()); o.flash = mk.soft(0xffc670, 3.4, 0, 0, 0, 0); o.flash.material.opacity = 0;
      o.pred = mk.particles(80, 0.1, M.glow(0xbfefff, 0.8)); o.trail = mk.particles(90, 0.07, M.glow(0xffc857, 0.9));
      o.land = new T.Mesh(new T.RingGeometry(0.6, 0.85, 40), M.glow(0xff5a5a, 0.9)); o.land.rotation.x = -Math.PI / 2; o.land.position.y = 0.03; S.scene.add(o.land);
      o.stakes = new T.Group(); S.scene.add(o.stakes); o.stakeStep = 0;
      o.aVx = mk.arrow(0x6ee7a8, 0.05, 0.16); o.aVy = mk.arrow(0xff6b6b, 0.05, 0.16); o.aV = mk.arrow(0xffc857, 0.06, 0.2);
    },
    reset(s, c) { s.phase = 0; s.t = 0; s.hold = 0.8; s.sig = ""; s.trailT = 0; s.nTrail = 0; },
    step(s, c, dt) {
      const sig = `${c.speed}|${c.angle}|${c.drag}`; if (s.sig !== sig) { s.sig = sig; s.fl = flight(c); s.phase = 0; s.hold = 0.7; s.y = null; s.nTrail = 0; s.puffed = false; }
      if (s.phase === 0) { s.hold -= dt; if (s.hold <= 0) { const a = rad(c.angle); s.y = [0, BALL, c.speed * Math.cos(a), c.speed * Math.sin(a)]; s.t = 0; s.phase = 1; s.fired = true; s.trailT = 0; s.nTrail = 0; } return; }
      if (s.phase === 2) { s.hold -= dt; if (s.hold <= 0) { s.phase = 0; s.hold = 0.8; s.nTrail = 0; } return; }
      const k = c.drag ? KD : 0, n = 4, h = dt / n;
      for (let i = 0; i < n && s.phase === 1; i++) {
        const nx = rk4(pf(k), s.y, h);
        if (nx[1] <= BALL) { const fr = Math.min(1, Math.max(0, (s.y[1] - BALL) / Math.max(1e-9, s.y[1] - nx[1]))); s.y = [s.y[0] + (nx[0] - s.y[0]) * fr, BALL, nx[2], 0]; s.t += h * fr; s.phase = 2; s.hold = 1.6; s.landed = true; }
        else { s.y = nx; s.t += h; }
      }
      s.trailT += dt; if (s.trailT > 0.12 && s.nTrail < 89) { s.trailT = 0; s.trail = s.trail || []; s.trail[s.nTrail++] = [s.y[0], s.y[1]]; }
    },
    update(S, s, c, dt) {
      if (!s.fl) { P.scenes["Projectile Motion"].step(s, c, 0); } const o = S.objs, a = rad(c.angle), fl = s.fl; if (!fl) return;
      const dx = Math.cos(a), dy = Math.sin(a);
      const R0 = Math.max(14, fl.range), Hh0 = Math.max(4, fl.apex), dist = Math.max(22, R0 * 0.95 + Hh0 * 0.7), kv = Math.min(3.2, Math.max(1, dist / 22));   // exaggerate the small objects as the view widens
      o.bg.scale.setScalar(Math.sqrt(kv)); const BL = BLEN * Math.sqrt(kv); o.bg.rotation.z = a - Math.PI / 2; o.bg.position.set(-BL * dx, BALL - BL * dy, 0);
      const bx = s.phase === 0 || !s.y ? 0 : s.y[0], by = s.phase === 0 || !s.y ? BALL : s.y[1];
      o.ball.scale.setScalar(kv); o.ball.position.set(bx, by + (kv - 1) * BALL, 0); o.pred.scale.setScalar(kv); o.trail.scale.setScalar(kv);
      if (s.fired) { s.fired = false; o.flash.position.set(dx * 0.6, BALL + dy * 0.6, 0); o.flash.material.opacity = 1; S.puff(dx * 1.1, BALL + dy * 1.1, 0, { n: 14, color: 0xcfcfcf, size: 1.2, speed: 3, life: 1.4, op: 0.5, up: 0.6 }); }
      if (o.flash.material.opacity > 0) o.flash.material.opacity = Math.max(0, o.flash.material.opacity - 0.09);
      if (s.landed) { s.landed = false; S.puff(bx, 0.2, 0, { n: 18, color: 0x8c7650, size: 1.1, speed: 3.2, life: 1.2, op: 0.7 }); }
      /* prediction dots */
      const pts = fl.pts, np = Math.min(80, pts.length); o.pred.count = np; for (let i = 0; i < np; i++) { const p = pts[Math.min(pts.length - 1, Math.round((i / (np - 1)) * (pts.length - 1)))]; o.pred.set(i, p[0], p[1], 0); } o.pred.instanceMatrix.needsUpdate = true;
      const tr = s.trail || [], nt = s.nTrail || 0; o.trail.count = nt; for (let i = 0; i < nt; i++) o.trail.set(i, tr[i][0], tr[i][1], 0); o.trail.instanceMatrix.needsUpdate = true;
      o.land.position.x = fl.range; o.land.scale.setScalar(Math.max(0.7, fl.range / 60));
      /* distance stakes every 10/20/50 m */
      const step = fl.range < 70 ? 10 : fl.range < 150 ? 20 : 50; if (o.stakeStep !== step) {
        o.stakeStep = step; while (o.stakes.children.length) { const m = o.stakes.children.pop(); m.geometry && m.geometry.dispose(); }
        for (let x = step; x <= Math.max(step, fl.range * 1.15); x += step) { const post = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.6, 10), M.matte(0xf2f2ef, 0.5)); post.position.set(x, 0.8, 2.2); post.castShadow = true; const flag = new T.Mesh(new T.PlaneGeometry(0.7, 0.4), new T.MeshStandardMaterial({ color: 0xe0382d, side: T.DoubleSide })); flag.position.set(x + 0.37, 1.35, 2.2); flag.castShadow = true; o.stakes.add(post, flag); }
      }
      /* velocity components */
      const vv = s.y && s.phase === 1 ? s.y : [0, 0, 0, 0], sc = 0.09, B = V3(bx, by, 0);
      S.setArrow(o.aVx, B, V3(vv[2], 0, 0), sc); S.setArrow(o.aVy, B, V3(0, vv[3], 0), sc); S.setArrow(o.aV, B, V3(vv[2], vv[3], 0), sc);
      /* sun and camera follow the action */
      if (S.sunLight) { S.sunLight.target.position.set(bx, 0, 0); S.sunLight.position.set(bx - 18, 26, -14); }
      S.aim([R0 * 0.5, Hh0 * 0.5, 0], dist, 0.16, 0.12);
    },
    overlay(ctx, s, c, w, h, S) {
      const fl = s.fl; if (!fl) return; const a = rad(c.angle);
      const Rid = (c.speed * c.speed * Math.sin(2 * a)) / G, Hid = (c.speed * c.speed * Math.sin(a) ** 2) / (2 * G), Tid = (2 * c.speed * Math.sin(a)) / G;
      H.pill(ctx, 14, 26, `Range R = u²sin2θ/g = ${f1(Rid, 1)} m`, "#ffd27a", 11.5); H.pill(ctx, 14, 48, `Max height H = u²sin²θ/2g = ${f1(Hid, 1)} m`, "#ffd27a", 11.5); H.pill(ctx, 14, 70, `Time of flight T = 2u sinθ/g = ${f1(Tid, 2)} s`, "#ffd27a", 11.5);
      if (c.drag) H.pill(ctx, 14, 92, `With air drag: R = ${f1(fl.range, 1)} m · H = ${f1(fl.apex, 1)} m`, "#ff9d8a", 11.5);
      H.pill(ctx, w - 14, 26, "● vₓ constant", "#6ee7a8", 11, "right"); H.pill(ctx, w - 14, 48, "● v_y  (g acts downward)", "#ff7b7b", 11, "right"); H.pill(ctx, w - 14, 70, "● v  resultant", "#ffd27a", 11, "right");
      const o = S.objs; if (o.stakeStep) for (let x = o.stakeStep; x <= Math.max(o.stakeStep, fl.range * 1.15); x += o.stakeStep) { const q = S.proj(V3(x, 2.1, 2.2)); if (q.z < 1) H.pill(ctx, q.x, q.y, `${x} m`, "#ffffff", 10, "center"); }
      if (s.y && s.phase === 1) { const q = S.proj(V3(s.y[0], s.y[1], 0)), sp = Math.hypot(s.y[2], s.y[3]); H.pill(ctx, q.x + 14, q.y - 16, `v = ${f1(sp, 1)} m/s · y = ${f1(s.y[1] - BALL, 1)} m`, "#ffe8b0", 10.5); }
    },
    readouts(s, c) {
      const fl = s.fl || flight(c), a = rad(c.angle), v = s.y ? Math.hypot(s.y[2], s.y[3]) : c.speed;
      return [["Horizontal speed uₓ = u cosθ", `${f1(c.speed * Math.cos(a), 1)} m/s`], ["Vertical launch uᵧ = u sinθ", `${f1(c.speed * Math.sin(a), 1)} m/s`], ["Range (this run)", `${f1(fl.range, 1)} m`], ["Max height (this run)", `${f1(fl.apex, 1)} m`], ["Time of flight", `${f1(fl.T, 2)} s`], ["Speed now", `${f1(v, 1)} m/s`]];
    },
  };

  /* =================== CONSERVATION OF ENERGY =================== */
  const ER = 0.65, BR2 = (m) => 0.17 * Math.cbrt(m);
  P.scenes["Conservation of Energy"] = {
    env: "outdoor", envOpts: { shadowArea: 22 }, cam: [[5.5, 4.2, 11], [0, 3.2, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, slab = M.matte(0x8f9298, 0.9);
      o.slab = mk.box(3.2, 0.2, 3.2, slab, 0, -0.1, 0); o.slab.receiveShadow = true;
      const pt = poleTex(12); o.pole = new T.Mesh(new T.BoxGeometry(0.1, 12, 0.1), new T.MeshStandardMaterial({ map: pt, roughness: 0.5 })); o.pole.position.set(-1.0, 6, -0.6); o.pole.castShadow = true; S.scene.add(o.pole);
      mk.box(0.9, 0.12, 0.9, M.iron(), -1.0, 0.06, -0.6);
      o.arm = mk.rod(V3(-1, 5, -0.6), V3(0, 5, 0), 0.04, M.chrome()); o.mag = mk.cyl(0.14, 0.14, 0.18, M.steel(), 0, 5, 0);
      o.ball = mk.sphere(0.2, M.steel()); o.glow = mk.soft(0x8be0ff, 0.5, 0, 0, 0, 0);
      o.shadowDisc = new T.Mesh(new T.CircleGeometry(1, 32), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0, depthWrite: false })); o.shadowDisc.rotation.x = -Math.PI / 2; o.shadowDisc.position.y = 0.005; S.scene.add(o.shadowDisc);
    },
    reset(s, c) { s.h = c.height; s.v = 0; s.hold = 0.9; s.rest = 0; s.sq = 0; s.setH = c.height; s.setM = c.mass; s.bounces = 0; },
    step(s, c, dt) {
      if (s.setH !== c.height || s.setM !== c.mass || s.h === undefined) P.scenes["Conservation of Energy"].reset(s, c);
      if (s.hold > 0) { s.hold -= dt; return; } if (s.rest > 0) { s.rest -= dt; if (s.rest <= 0) P.scenes["Conservation of Energy"].reset(s, c); return; }
      let h = s.h + s.v * dt - 0.5 * G * dt * dt, v = s.v - G * dt;
      if (h <= 0) {
        const vi = Math.sqrt(s.v * s.v + 2 * G * s.h), t1 = (vi + s.v) / G, rem = Math.max(0, dt - t1), vu = ER * vi; s.sq = Math.min(1, vi / 14); s.hit = vi; s.bounces++;
        if (vu < 0.4) { h = 0; v = 0; s.rest = 1.6; } else { h = vu * rem - 0.5 * G * rem * rem; v = vu - G * rem; if (h < 0) { h = 0; } }
      }
      s.h = h; s.v = v;
    },
    update(S, s, c, dt) {
      if (s.h === undefined) { P.scenes["Conservation of Energy"].reset(s, c); } const o = S.objs, r = BR2(c.mass), y = s.h + r;
      o.ball.scale.setScalar(r / 0.2); const sqz = Math.max(0, s.sq || 0); if (dt > 0) s.sq = Math.max(0, (s.sq || 0) - dt * 7);
      o.ball.scale.y *= 1 - 0.28 * sqz * (y < r + 0.05 ? 1 : 0.0); o.ball.scale.x *= 1 + 0.12 * sqz * (y < r + 0.05 ? 1 : 0); o.ball.scale.z = o.ball.scale.x;
      o.ball.position.set(0, y - (r * 0.28 * sqz * (y < r + 0.05 ? 1 : 0)), 0);
      if (s.hit) { S.puff(0, 0.1, 0, { n: 8, color: 0x9a9a98, size: 0.55, speed: 1.2 + s.hit * 0.15, life: 0.9, op: 0.45 }); s.hit = 0; }
      const top = c.height + r * 2 + 0.2; S.setRod(o.arm, V3(-1, top + 0.1, -0.6), V3(0, top + 0.1, 0)); o.mag.position.set(0, top + 0.1 - 0.08, 0); o.mag.visible = true;
      const held = s.hold > 0 || (s.h >= c.height - 1e-3 && s.v === 0); o.glow.position.set(0, c.height + r + 0.1, 0); o.glow.material.opacity = held ? 0.9 : 0; o.glow.scale.setScalar(0.7);
      const k = Math.max(0, 1 - s.h / (c.height + 1)); o.shadowDisc.scale.setScalar(r * (1.2 + (1 - k) * 0.6)); o.shadowDisc.material.opacity = 0.0;
      S.aim([0, c.height * 0.5 + 0.5, 0], Math.max(7, c.height * 1.55 + 3.2), 0.45, 0.16);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.h === undefined) return; const PE = c.mass * G * s.h, KE = 0.5 * c.mass * s.v * s.v, E = c.mass * G * c.height, lost = Math.max(0, E - PE - KE);
      for (let m = 0; m <= c.height + 0.01; m += c.height > 6 ? 2 : 1) { const q = S.proj(V3(-1.0, m, -0.6 + 0.07)); H.pill(ctx, q.x - 26, q.y + 4, `${m} m`, "#fff", 9.5, "right"); }
      const bx = w - 150, by0 = 334, bh = 240, bw = 40; H.panel(ctx, bx - 14, 40, 148, 330);
      const seg = (v0, v, col) => { const hh = (v / E) * bh; ctx.fillStyle = col; ctx.fillRect(bx, by0 - v0 - hh, bw, hh); return hh; };
      ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.strokeRect(bx, by0 - bh, bw, bh);
      let a = 0; a += seg(a, PE, "#4ee1d0"); a += seg(a, KE, "#ff6b5e"); seg(a, lost, "#8a93a6");
      label(ctx, bx - 4, 54, "ENERGY (J)", "#cfe0ff", 10.5);
      label(ctx, bx + bw + 6, by0 - ((PE) / E) * bh / 2, `PE ${f1(PE, 0)}`, "#4ee1d0", 10.5);
      label(ctx, bx + bw + 6, by0 - ((PE + KE / 2) / E) * bh, `KE ${f1(KE, 0)}`, "#ff8b80", 10.5);
      if (lost > 0.5) label(ctx, bx + bw + 6, by0 - ((PE + KE + lost / 2) / E) * bh, `lost ${f1(lost, 0)}`, "#b7bfd0", 10);
      label(ctx, bx - 6, by0 + 20, `E = mgH = ${f1(E, 0)} J`, "#ffd27a", 10.5);
      H.pill(ctx, 14, 26, "PE = mgh   KE = ½mv²   PE + KE + (heat & sound) = constant", "#ffd27a", 10.5);
    },
    readouts(s, c) {
      if (s.h === undefined) return []; const PE = c.mass * G * s.h, KE = 0.5 * c.mass * s.v * s.v, E = c.mass * G * c.height;
      return [["Height h", `${f1(s.h, 2)} m`], ["Speed |v|", `${f1(Math.abs(s.v), 2)} m/s`], ["P.E. = mgh", `${f1(PE, 1)} J`], ["K.E. = ½mv²", `${f1(KE, 1)} J`], ["P.E. + K.E.", `${f1(PE + KE, 1)} J`], ["Lost to heat & sound", `${f1(Math.max(0, E - PE - KE), 1)} J`]];
    },
  };
})();
