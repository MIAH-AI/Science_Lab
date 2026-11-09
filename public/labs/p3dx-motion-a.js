/* p3dx-motion-a.js — photoreal 3D scenes for T7–T10 simulations in p2d-motion.js (relative motion … resolution of vectors). */
(function () {
  "use strict";
  const X = window.PX3; if (!X || !X.ready) return;
  const T = THREE, P = window.P3D, M = P.mat, H = P.hud, V = X.V, K = window.PK, TAU = Math.PI * 2;
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180;
  const wrap = (v, L) => ((((v + L / 2) % L) + L) % L) - L / 2;
  const asphalt = () => M.matte(0x2b2e33, 0.92);
  /* a straight road along x with dashed centre line */
  const road = (S, len, w, z = 0) => { const g = X.group(S, 0, 0, z); X.mesh(new T.BoxGeometry(len, 0.06, w), asphalt(), g, 0, 0.03, 0);
    [-1, 1].forEach((k) => X.mesh(new T.BoxGeometry(len, 0.012, 0.05), M.matte(0xe8e2c8, 0.6), g, 0, 0.066, (k * w) / 2 - k * 0.08)); return g; };
  const dashes = (S, n, z, sp) => { const im = new T.InstancedMesh(new T.BoxGeometry(sp * 0.45, 0.012, 0.07), M.matte(0xf2f2ec, 0.55), n); im.receiveShadow = true; S.scene.add(im); im.place = (shift) => { const m = new T.Matrix4(); for (let i = 0; i < n; i++) { m.makeTranslation(wrap(-((n * sp) / 2) + i * sp + shift, n * sp), 0.068, z); im.setMatrixAt(i, m); } im.instanceMatrix.needsUpdate = true; }; return im; };
  const spinWheels = (car, v, dt, r = 0.3) => car.wheels && car.wheels.forEach((w) => (w.rotation.z -= (v * dt) / r));
  const setPaint = (car, col) => car.traverse((q) => { if (q.isMesh && q.material && q.material.clearcoat > 0 && q.material.metalness < 0.5 && q.material.opacity === 1) q.material.color.set(col); });
  /* gauge: 0..max dial with a needle, faces +z */
  const gauge = (parent, max, unit, r = 0.45) => { const g = new T.Group(); parent.add(g);
    const cv = document.createElement("canvas"); cv.width = cv.height = 512; const x = cv.getContext("2d"); x.fillStyle = "#101418"; x.beginPath(); x.arc(256, 256, 256, 0, TAU); x.fill(); x.strokeStyle = x.fillStyle = "#f2f2f2"; x.textAlign = "center"; x.font = "bold 44px Arial";
    for (let i = 0; i <= 30; i++) { const a = -2.36 + (i / 30) * 4.72, r1 = 235, r2 = i % 5 ? 212 : 190; x.lineWidth = i % 5 ? 3 : 7; x.beginPath(); x.moveTo(256 + r1 * Math.sin(a), 256 - r1 * Math.cos(a)); x.lineTo(256 + r2 * Math.sin(a), 256 - r2 * Math.cos(a)); x.stroke(); if (i % 5 === 0) x.fillText(String(Math.round((max * i) / 30)), 256 + 150 * Math.sin(a), 256 - 150 * Math.cos(a) + 15); }
    x.font = "34px Arial"; x.fillText(unit, 256, 370); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
    X.mesh(new T.CylinderGeometry(r * 1.08, r * 1.08, 0.08, 64), M.chrome(), g).rotation.x = Math.PI / 2; X.mesh(new T.CircleGeometry(r, 64), new T.MeshPhysicalMaterial({ map: t, roughness: 0.4, clearcoat: 1 }), g, 0, 0, 0.042);
    const nd = new T.Group(); nd.position.z = 0.05; g.add(nd); X.mesh(new T.BoxGeometry(0.025, r * 0.85, 0.01), M.emissive(0xff4a2a, 1.4), nd, 0, r * 0.38, 0); X.mesh(new T.CylinderGeometry(0.04, 0.04, 0.02, 20), M.chrome(), nd).rotation.x = Math.PI / 2;
    g.set = (v) => { nd.rotation.z = -(-2.36 + clampv(v / max, 0, 1.03) * 4.72); }; return g; };
  const crate = (S, s) => X.mesh(new T.BoxGeometry(s, s, s), M.wood(), S.scene, 0, s / 2, 0);
  const lab = (ctx, S, p, t, col, dx, dy, sz) => X.lbl(ctx, S, p, t, col, dx, dy, sz);

  /* ---------- Relative motion ---------- */
  const RK = 0.025;
  X.def("Relative Motion (co-linear)", {
    env: "outdoor", cam: [[0, 7.0, 15.5], [0, 0.0, 0]], shift: [0, 92],
    build(S, s, c, mk, o) {
      road(S, 60, 2.6); o.d = dashes(S, 30, 0, 1.5); o.cA = mk.car(0x2a6ad8); o.cB = mk.car(0xd84a3a); o.cA.scale.setScalar(0.75); o.cB.scale.setScalar(0.75);
      o.posts = Array.from({ length: 12 }, () => { const g = X.group(S); X.mesh(new T.CylinderGeometry(0.04, 0.05, 1.6, 12), M.steel(), g, 0, 0.8, 0); X.mesh(new T.BoxGeometry(0.4, 0.05, 0.12), M.steel(), g, 0.18, 1.6, 0); X.mesh(new T.BoxGeometry(0.2, 0.04, 0.1), M.emissive(0xfff0c0, 1.2), g, 0.33, 1.57, 0); return g; });
      o.aA = mk.arrow(0x6aa8ff); o.aB = mk.arrow(0xff7a6a);
    },
    update(S, s, c, dt) {
      const o = S.objs, t = s.t || 0, fr = c.frame === 1, shift = fr ? -c.vA * t * RK : 0, xA = fr ? 0 : c.vA * t, xB = fr ? c.d0 + (c.vB - c.vA) * t : c.d0 + c.vB * t;
      o.d.place(shift); o.posts.forEach((p, i) => p.position.set(wrap(-10.8 + i * 1.8 + shift, 21.6), 0, -1.75));
      const A = wrap(-7.6 + xA * RK, 18), B = wrap(-7.6 + xB * RK, 18); o.cA.position.set(A, 0.035, -0.6); o.cB.position.set(B, 0.035, 0.6);
      o.cA.rotation.y = c.vA < 0 ? Math.PI : 0; o.cB.rotation.y = c.vB < 0 ? Math.PI : 0; spinWheels(o.cA, Math.abs(c.vA) * RK * 2, dt); spinWheels(o.cB, Math.abs(c.vB) * RK * 2, dt);
      const vAs = fr ? 0 : c.vA, vBs = fr ? c.vB - c.vA : c.vB; S.setArrow(o.aA, V(A, 1.35, -0.6), V(vAs, 0, 0), 0.07); S.setArrow(o.aB, V(B, 1.35, 0.6), V(vBs, 0, 0), 0.07); o.A = A; o.B = B; o.vAs = vAs; o.vBs = vBs;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (o.A == null) return; lab(ctx, S, V(o.A, 1.4, -0.6), "A  " + o.vAs + " m/s", "#8fc0ff", -20, -14); lab(ctx, S, V(o.B, 1.4, 0.6), "B  " + o.vBs + " m/s", "#ff9a8a", -20, -14);
      H.pill(ctx, 14, 26, c.frame ? "View from car A: A seems still, the road moves" : "View from the ground", "#e6eef8", 11); },
  });

  /* ---------- Force: contact vs field ---------- */
  X.def("Force — Cause of Motion; Contact vs Field Forces", {
    cam: [[-0.3, 1.9, 6.6], [-0.3, 1.0, 0]],
    build(S, s, c, mk, o) {
      const g = (o.g = [0, 1, 2, 3].map(() => X.group(S)));
      X.mesh(new T.BoxGeometry(6.4, 0.08, 1.4), M.wood(), g[0], -0.3, 0.04, 0); o.box = X.mesh(new T.BoxGeometry(0.62, 0.62, 0.62), M.wood(), g[0], 0, 0.39, 0);
      o.rope = mk.rod(V(0, 0, 0), V(1, 0, 0), 0.015, M.matte(0xd8c9a0, 0.9)); g[0].add(o.rope); o.aT = mk.arrow(0xffb703); o.aF = mk.arrow(0xef5a4a); o.aN = mk.arrow(0x2fd6c4); o.aW = mk.arrow(0xb48cff); [o.aT, o.aF, o.aN, o.aW].forEach((a) => g[0].add(a));
      X.mesh(new T.BoxGeometry(0.5, 0.36, 0.36), M.paint(0xd23a2a), g[1], -1.45, 1.0, 0); X.mesh(new T.BoxGeometry(0.5, 0.36, 0.36), M.paint(0x2a5ad8), g[1], -0.95, 1.0, 0);
      [-1, 1].forEach((sd) => [0.25, 0.45, 0.65].forEach((k) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI; pts.push(V(-1.2 + Math.cos(a) * (0.35 + k), 1.0 + sd * Math.sin(a) * (0.15 + k * 0.8), 0)); } const tb = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.008, 6), M.glow(0x8fd8ff, 0.35)); g[1].add(tb); }));
      o.clip = new T.Mesh(new T.TorusGeometry(0.11, 0.012, 8, 32), M.steel()); o.clip.scale.set(1.6, 0.6, 1); o.clip.rotation.x = Math.PI / 2; g[1].add(o.clip);
      X.mesh(new T.BoxGeometry(3.2, 0.06, 1.2), M.matte(0x5b4632, 0.7), g[2], -0.4, 0.03, 0); const rod = X.mesh(new T.CylinderGeometry(0.06, 0.06, 1.9, 24), M.plastic(0x1c1d22, 0.2), g[2], -0.6, 2.05, 0); rod.rotation.z = Math.PI / 2;
      o.bits = Array.from({ length: 6 }, (_, i) => X.mesh(new T.BoxGeometry(0.1, 0.008, 0.08), M.matte(0xf6f4ee, 0.8), g[2], -1.25 + i * 0.25, 0.07, (i % 2) * 0.1));
      X.mesh(new T.BoxGeometry(3.0, 0.1, 1.4), M.matte(0x3f7a2e, 1), g[3], -0.6, 0.05, 0); o.ball = X.mesh(new T.SphereGeometry(0.18, 40, 28), M.plastic(0xf2a020, 0.35), g[3], -0.6, 2, 0); o.aG = mk.arrow(0xb48cff); g[3].add(o.aG);
    },
    update(S, s, c) {
      const o = S.objs; o.g.forEach((q, i) => (q.visible = i === c.sc));
      if (c.sc === 0) { const x = -1.7 + (s.x || 0) * 0.42, N = 4 * K.g, fr = Math.min(c.F, c.mu * N); o.box.position.x = x; S.setRod(o.rope, V(x + 0.31, 0.39, 0), V(x + 1.6, 0.5, 0));
        S.setArrow(o.aT, V(x + 0.31, 0.39, 0.33), V(c.F, 0, 0), 0.035); S.setArrow(o.aF, V(x - 0.31, 0.1, 0.33), V(-fr, 0, 0), 0.035); S.setArrow(o.aN, V(x, 0.7, 0), V(0, N, 0), 0.02); S.setArrow(o.aW, V(x, 0.39, 0.33), V(0, -N, 0), 0.02); o.x = x; o.fr = fr; o.N = N; }
      else if (c.sc === 1) { const gap = clampv(140 - c.F * 2.5, 30, 140) * 0.012, osc = c.F > 10 ? 0 : 0.04 * Math.sin((s.t || 0) * 6); o.clip.position.set(-0.7 + gap, 1.0 + osc, 0); }
      else if (c.sc === 2) o.bits.forEach((b, i) => { b.position.y = 0.07 + clampv(c.F * 4 - i * 10, 0, 140) * 0.0135; b.rotation.z = b.position.y > 0.1 ? 0.6 * Math.sin(i + (s.t || 0) * 3) : 0; });
      else { const t = (s.t || 0) % 1.6, y = Math.max(0.28, 2.9 - 0.5 * K.g * t * t * 0.3); o.ball.position.y = y; S.setArrow(o.aG, V(-0.32, y, 0), V(0, -1, 0), 0.5); }
    },
    hud(ctx, s, c, S) { const o = S.objs;
      if (c.sc === 0 && o.x != null) { lab(ctx, S, V(o.x + 0.35 + c.F * 0.035, 0.39, 0.33), "tension " + c.F + " N", "#ffd27a", 6, 4, 10); lab(ctx, S, V(o.x - 0.31 - o.fr * 0.035, 0.1, 0.33), "friction " + K.f(o.fr, 1) + " N", "#ff8f80", -10, 26, 10);
        lab(ctx, S, V(o.x, 0.7 + o.N * 0.02, 0), "normal reaction " + K.f(o.N, 1) + " N", "#7fe3da", 8, 0, 10); lab(ctx, S, V(o.x, 0.39 - o.N * 0.02, 0.33), "weight " + K.f(o.N, 1) + " N (field)", "#c4a7ff", 8, 10, 10); }
      else if (c.sc === 3) lab(ctx, S, V(-0.32, o.ball.position.y - 0.5, 0), "weight (gravity)", "#c4a7ff", 8, 0, 10);
      else H.pill(ctx, 30, 380, "No contact needed — the force acts across the gap", "#7fe3da", 11); if (c.sc === 1) lab(ctx, S, o.clip.position, "steel clip", "#c9d6ea", 10, -10, 10); if (c.sc === 2) lab(ctx, S, V(0.3, 2.05, 0), "charged rod", "#c9d6ea", 6, -10, 10); },
  });

  /* ---------- Banking of roads ---------- */
  const RI = 1.6, RO = 2.7, RM = 2.15;
  X.def("Banking of Roads", {
    env: "outdoor", cam: [[0.6, 5.6, 8.8], [0.2, 0.2, 0]], shift: [78, 10],
    build(S, s, c, mk, o) { o.car = mk.car(0x2a6ad8); o.car.scale.setScalar(0.32); o.car.rotation.order = "YXZ"; o.aN = mk.arrow(0x2fd6c4); o.aW = mk.arrow(0xb48cff); o.aC = mk.arrow(0xffb703); o.aFr = mk.arrow(0xef5a4a); },
    update(S, s, c) {
      const o = S.objs, t = rad(c.th), tn = Math.tan(t);
      if (X.changed(S, "b" + c.th)) { X.clear(S, [o.ring, o.line, o.wall]);
        const mkRing = (r0, r1, dy, mat) => { const gg = new T.RingGeometry(r0, r1, 160, 3), p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); p.setZ(i, (r - RI) * tn + dy); } gg.rotateX(-Math.PI / 2); gg.computeVertexNormals(); const m = new T.Mesh(gg, mat); m.receiveShadow = true; m.position.y = 0.06; S.scene.add(m); return m; };
        o.ring = mkRing(RI, RO, 0, M.matte(0x34373c, 0.9)); o.line = mkRing(RM - 0.025, RM + 0.025, 0.004, M.matte(0xf0f0e8, 0.6));
        const wg = new T.CylinderGeometry(RO, RO, 1, 160, 1, true); o.wall = new T.Mesh(wg, M.matte(0x8c8577, 0.95)); o.wall.scale.y = Math.max(0.02, (RO - RI) * tn + 0.06); o.wall.position.y = o.wall.scale.y / 2; S.scene.add(o.wall); }
      const B = S.variant.calc(c), a = s.a || 0, h = 0.06 + (RM - RI) * tn, p = V(RM * Math.cos(a), h, RM * Math.sin(a)); o.car.position.copy(p);
      o.car.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); o.car.rotation.x = t; setPaint(o.car, B.st[0] === "h" ? 0x2a6ad8 : 0xd8402e);
      const inw = V(-Math.cos(a), 0, -Math.sin(a)), up = V(0, 1, 0), base = p.clone().add(V(0, 0.32, 0)), nrm = up.clone().multiplyScalar(Math.cos(t)).add(inw.clone().multiplyScalar(Math.sin(t)));
      S.setArrow(o.aN, base, nrm, 0.9 / Math.max(0.5, Math.cos(t))); S.setArrow(o.aW, base, V(0, -0.9, 0), 1); S.setArrow(o.aC, base, inw, 0.9 * Math.max(0.15, (c.v * c.v) / (c.r * K.g)));
      const fdir = c.v > B.v0 ? 1 : -1, slope = V(Math.cos(t), -Math.sin(t), 0); void slope; const along = inw.clone().multiplyScalar(Math.cos(t)).add(V(0, -Math.sin(t), 0));
      if (c.mu > 0 && Math.abs(c.v - B.v0) > 0.5) S.setArrow(o.aFr, p.clone().add(V(0, 0.05, 0)), along.multiplyScalar(fdir), 0.6); else o.aFr.visible = false; o.p = p; o.B = B;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.p) return; lab(ctx, S, o.p.clone().add(V(0, 1.25, 0)), "N", "#7fe3da", 4, 0, 11); lab(ctx, S, o.p.clone().add(V(0, -0.6, 0)), "mg", "#c4a7ff", 6, 0, 11);
      lab(ctx, S, V(0, 0.1, 0), "centre of bend", "#ffd27a", -44, 0, 10); H.pill(ctx, 14, 26, "θ = " + c.th + "° · r = " + c.r + " m · v = " + c.v + " m/s", "#e6eef8", 11); },
  });

  /* ---------- Speed vs velocity: a journey ---------- */
  X.def("Speed vs Velocity — A Journey", {
    env: "outdoor", cam: [[0, 6.6, 6.4], [0, 0, -0.9]], shift: 118,
    build(S, s, c, mk, o) {
      const w = (o.walker = X.group(S)); const cloth = M.matte(0x2f6fd0, 0.8), skin = M.matte(0x7a4a2c, 0.7);
      X.mesh(new T.CapsuleGeometry(0.11, 0.32, 6, 16), cloth, w, 0, 0.62, 0); X.mesh(new T.SphereGeometry(0.1, 24, 16), skin, w, 0, 0.98, 0);
      o.legs = [-1, 1].map((k) => { const l = new T.Group(); l.position.set(0, 0.42, k * 0.06); w.add(l); X.mesh(new T.BoxGeometry(0.07, 0.4, 0.07), M.matte(0x1d2430, 0.8), l, 0, -0.2, 0); return l; });
      const fl = X.group(S); X.mesh(new T.CylinderGeometry(0.015, 0.015, 0.9, 10), M.steel(), fl, 0, 0.45, 0); X.mesh(new T.BoxGeometry(0.3, 0.18, 0.01), M.paint(0x2bb04a), fl, 0.15, 0.8, 0); o.flag = fl;
      o.disp = mk.arrow(0xffb703, 0.04, 0.13);
    },
    update(S, s, c, dt) {
      const o = S.objs, v = S.variant, Pth = v.path(c.rt), k = [0.025, 0.011, 0.035][c.rt], off = [[-2.5, 0], [-1.65, 2.0], [0, 2.23]][c.rt], W = (p) => V(off[0] + p[0] * k, 0, off[1] - p[1] * k);
      if (X.changed(S, "r" + c.rt)) { X.clear(S, [o.path, o.track]); if (c.rt === 2) { o.track = new T.Mesh(new T.RingGeometry(63.7 * k - 0.35, 63.7 * k + 0.35, 128), M.matte(0xa8452e, 0.9)); o.track.rotation.x = -Math.PI / 2; o.track.position.set(0, 0.012, off[1] - 63.7 * k); o.track.receiveShadow = true; S.scene.add(o.track); }
        const pts = (c.rt === 0 ? [[0, 0], [200, 0]] : Pth).map((p) => W(p).add(V(0, 0.03, c.rt === 0 ? 0 : 0))); o.path = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, false, "catmullrom", 0), pts.length * 8, 0.03, 8), M.matte(0xf4f4ee, 0.7)); S.scene.add(o.path); o.flag.position.copy(W([0, 0])); }
      const q = v.pos(Pth, (s.t || 0) * c.sp), p = W(q), prev = o.prevP || p.clone(), d = p.clone().sub(prev); o.walker.position.copy(p); if (d.length() > 1e-5) o.walker.rotation.y = Math.atan2(-d.z, d.x); o.prevP = p.clone();
      const ph = (s.t || 0) * c.sp * 3; o.legs.forEach((l, i) => (l.rotation.z = (d.length() > 1e-5 ? 0.5 : 0) * Math.sin(ph + i * Math.PI)));
      S.setArrow(o.disp, W([0, 0]).add(V(0, 0.08, 0)), p.clone().sub(W([0, 0])), 1); o.q = q; void dt;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.q) return; lab(ctx, S, o.flag.position.clone().add(V(0, 0.9, 0)), "start", "#5bd68c", -10, -6, 10); const dsp = Math.hypot(o.q[0], o.q[1]); lab(ctx, S, o.walker.position.clone().add(V(0, 1.1, 0)), "displacement " + K.f(dsp, 0) + " m", "#ffd27a", -50, -8, 10); },
  });

  /* ---------- Instantaneous speed: car on a road + tucked s–t graph ---------- */
  const sOf = (t) => 2 * t + 0.6 * t * t - 0.03 * t * t * t, IK = 0.075;
  const signTex = (txt) => X.textTex(txt, { w: 128, h: 64, bg: "#f4f4ec", fg: "#14321d", bold: true });
  X.def("Instantaneous Speed — Tangent to s–t Graph", {
    env: "outdoor", cam: [[0, 2.6, 8.6], [0, 0.4, 0]], shift: [108, -78],
    hudOpt0: { bg: 1, place: (r) => (r[0] < 420 ? X.fit(r, 4, 4, 236, 200) : null) },
    build(S, s, c, mk, o) {
      road(S, 9, 1.4); o.car = mk.car(0x2a6ad8); o.car.scale.setScalar(0.32); o.gh = mk.car(0xd8402e); o.gh.scale.setScalar(0.32); o.gh.traverse((q) => { if (q.isMesh) { q.material = q.material.clone(); q.material.transparent = true; q.material.opacity = 0.35; q.castShadow = false; } });
      for (let m = 0; m <= 80; m += 10) { const g = X.group(S, -3 + m * IK, 0, -0.95); X.mesh(new T.CylinderGeometry(0.018, 0.018, 0.55, 8), M.steel(), g, 0, 0.27, 0); X.mesh(new T.PlaneGeometry(0.34, 0.17), new T.MeshStandardMaterial({ map: signTex(m + " m"), roughness: 0.6 }), g, 0, 0.62, 0.01); }
    },
    update(S, s, c) { const o = S.objs, t2 = Math.min(12, c.t + c.dt); o.car.position.set(-3 + sOf(c.t) * IK, 0.06, 0.3); o.gh.position.set(-3 + sOf(t2) * IK, 0.06, -0.3); o.v = 2 + 1.2 * c.t - 0.09 * c.t * c.t; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.v == null) return; lab(ctx, S, o.car.position.clone().add(V(0, 0.5, 0)), "t = " + c.t + " s · v = " + K.f(o.v, 1) + " m/s", "#ffd27a", -60, -6, 10.5); lab(ctx, S, o.gh.position.clone().add(V(0, 0.5, 0)), "t + Δt", "#ff8f80", -14, -6, 10); },
  });

  /* ---------- Free fall & vertical throw ---------- */
  X.def("Motion Under Gravity — Free Fall & Vertical Throw", {
    env: "outdoor", cam: [[0.3, 1.9, 6.4], [0.3, 1.75, 0]], shift: 222,
    build(S, s, c, mk, o) { o.tower = X.mesh(new T.BoxGeometry(0.7, 1, 0.7), M.matte(0x9a8f80, 0.9), S.scene, -0.15, 0.5, 0); o.ball = mk.sphere(0.13, M.plastic(0xf2a020, 0.3)); o.av = mk.arrow(0x2fd6c4); o.top = X.mesh(new T.BoxGeometry(1.4, 0.01, 0.02), M.glow(0xffffff, 0.5), S.scene, 0.3, 0, 0.3); o.pl = -1; },
    update(S, s, c) {
      const o = S.objs, g = [9.8, 1.6, 3.7][c.pl], tf = (c.u + Math.sqrt(c.u * c.u + 2 * g * c.h0)) / g, t = Math.min(s.t || 0, tf), y = c.h0 + c.u * t - 0.5 * g * t * t, v = c.u - g * t, Hh = c.h0 + (c.u > 0 ? (c.u * c.u) / (2 * g) : 0), sc = 3.3 / Math.max(10, Hh * 1.1);
      if (o.pl !== c.pl) { o.pl = c.pl; const gm = S.objs.ground.material, sk = S.objs.skyMat.uniforms; if (!gm.userData.map) gm.userData.map = gm.map; gm.color.set([0xffffff, 0x8d8d8d, 0xc8724a][c.pl]); gm.map = c.pl ? null : gm.userData.map; gm.needsUpdate = true;
        sk.top.value.set([0x2f6fc2, 0x05060c, 0xb07850][c.pl]); sk.hor.value.set([0xcfe5f4, 0x1a1c22, 0xe6b48a][c.pl]); S.scene.background.set(sk.hor.value); S.scene.fog.color.set(sk.hor.value); S.objs.trees.visible = c.pl === 0; }
      o.tower.scale.y = Math.max(0.001, c.h0 * sc); o.tower.position.y = (c.h0 * sc) / 2; o.tower.visible = c.h0 > 0.2;
      const by = Math.max(0, y) * sc + 0.13; o.ball.position.set(0.3, by, 0); S.setArrow(o.av, V(0.55, by, 0), V(0, v, 0), 0.04); o.top.position.y = Hh * sc + 0.13; o.top.visible = Hh > 0.1; o.st = { v, Hh, sc, by };
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.st) return; lab(ctx, S, V(0.6, o.st.by, 0), "v = " + K.f(o.st.v, 1) + " m/s", o.st.v > 0 ? "#7fe3da" : "#ff8f80", 14, 4, 10); if (o.st.Hh > 0.1) lab(ctx, S, V(-0.35, o.top.position.y, 0.3), "max " + K.f(o.st.Hh, 1) + " m", "#c9d6ea", -20, -6, 9.5); H.pill(ctx, 10, 390, ["Earth", "Moon", "Mars"][c.pl] + " · g = " + [9.8, 1.6, 3.7][c.pl] + " m/s²", "#e6eef8", 10.5); },
  });

  /* ---------- Uniform vs non-uniform acceleration: car with speedometer + tucked v–t graph ---------- */
  const VT = [(t) => 2 + 2 * t, (t) => Math.max(0, 24 - 3 * t), (t) => 0.25 * t * t, (t) => 25 * (1 - Math.exp(-t / 3)), () => 12];
  X.def("Uniform vs Non-uniform Acceleration (v–t)", {
    env: "outdoor", cam: [[0, 2.6, 8.6], [0, 0.6, 0]], shift: [108, -70],
    hudOpt0: { bg: 1, place: (r) => (r[0] < 420 ? X.fit(r, 4, 4, 236, 200) : null) },
    build(S, s, c, mk, o) { road(S, 9, 1.4); o.car = mk.car(0x2a6ad8); o.car.scale.setScalar(0.32); const post = X.group(S, 1.3, 0, -1.25); X.mesh(new T.CylinderGeometry(0.04, 0.04, 1.3, 12), M.steel(), post, 0, 0.65, 0); o.g = gauge(post, 30, "m/s", 0.42); o.g.position.set(0, 1.62, 0.05);
      for (let m = 0; m <= 180; m += 30) { const g = X.group(S, -3.2 + m * 0.033, 0, -0.95); X.mesh(new T.CylinderGeometry(0.018, 0.018, 0.55, 8), M.steel(), g, 0, 0.27, 0); X.mesh(new T.PlaneGeometry(0.34, 0.17), new T.MeshStandardMaterial({ map: signTex(m + " m"), roughness: 0.6 }), g, 0, 0.62, 0.01); } },
    update(S, s, c, dt) { const o = S.objs, fn = VT[c.m]; let area = 0; for (let i = 0; i < 200; i++) { const a = (c.t * i) / 200, b = (c.t * (i + 1)) / 200; area += ((fn(a) + fn(b)) / 2) * (b - a); } o.car.position.set(-3.2 + area * 0.033, 0.06, 0.25); o.g.set(fn(c.t)); spinWheels(o.car, fn(c.t) * 0.033, dt * 0.2); o.area = area; o.v = fn(c.t); },
    hud(ctx, s, c, S) { const o = S.objs; if (o.v == null) return; lab(ctx, S, o.car.position.clone().add(V(0, 0.5, 0)), "s = " + K.f(o.area, 1) + " m", "#7fe3da", -30, -6, 10.5); lab(ctx, S, o.g.getWorldPosition(V(0, 0, 0)).add(V(0, -0.5, 0)), "v = " + K.f(o.v, 1) + " m/s", "#ffd27a", -36, 18, 10.5); },
  });

  /* ---------- Scalar or vector ---------- */
  const QTY = [["Mass", 0, "kg"], ["Distance", 0, "m"], ["Speed", 0, "m/s"], ["Time", 0, "s"], ["Energy", 0, "J"], ["Temperature", 0, "K"], ["Density", 0, "kg/m³"], ["Weight", 1, "N"], ["Displacement", 1, "m"], ["Velocity", 1, "m/s"], ["Acceleration", 1, "m/s²"], ["Force", 1, "N"], ["Momentum", 1, "kg·m/s"], ["Electric field", 1, "N/C"]];
  X.def("Scalar or Vector?", {
    cam: [[0, 4.6, 3.9], [0, 0.2, -0.2]], shift: -150,
    hudOpt0: { extra: [X.bgr(28, 38, 364, 304)], keep: (r) => !!r.bg, place: (r) => X.fit(r, 6, 34, 250, 230) },
    build(S, s, c, mk, o) {
      const cv = document.createElement("canvas"); cv.width = cv.height = 1024; const g = cv.getContext("2d"); const gr = g.createRadialGradient(512, 512, 100, 512, 512, 512); gr.addColorStop(0, "#efe6cf"); gr.addColorStop(1, "#d8c7a0"); g.fillStyle = gr; g.beginPath(); g.arc(512, 512, 512, 0, TAU); g.fill();
      g.strokeStyle = g.fillStyle = "#2a2014"; for (let i = 0; i < 72; i++) { const a = (i / 72) * TAU, r2 = i % 9 ? 470 : 430; g.lineWidth = i % 9 ? 3 : 7; g.beginPath(); g.moveTo(512 + 500 * Math.sin(a), 512 - 500 * Math.cos(a)); g.lineTo(512 + r2 * Math.sin(a), 512 - r2 * Math.cos(a)); g.stroke(); }
      g.font = "bold 90px Georgia"; g.textAlign = "center"; g.textBaseline = "middle"; [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach(([t, d]) => { const a = rad(d); g.fillText(t, 512 + 360 * Math.sin(a), 512 - 360 * Math.cos(a)); });
      g.lineWidth = 2; g.globalAlpha = 0.35; for (let r = 100; r < 420; r += 80) { g.beginPath(); g.arc(512, 512, r, 0, TAU); g.stroke(); } const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16;
      t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; const disc = X.mesh(new T.CylinderGeometry(1.45, 1.5, 0.08, 96), [M.wood(), new T.MeshStandardMaterial({ map: t, roughness: 0.55 }), M.wood()], S.scene, 0, 0.04, 0); void disc;
      o.arr = mk.arrow(0xffb703, 0.06, 0.2); o.bar = X.mesh(new T.CylinderGeometry(0.2, 0.2, 1, 40), M.plastic(0x2fb8a8, 0.25), S.scene, 0, 0.5, 0);
    },
    update(S, s, c) { const o = S.objs, [nm, vec] = QTY[c.q], a = rad(c.dir); o.arr.visible = !!vec; o.bar.visible = !vec;
      if (vec) S.setArrow(o.arr, V(0, 0.12, 0), V(Math.sin(a), 0, -Math.cos(a)), c.mag * 0.13); else { o.bar.scale.y = c.mag * 0.18; o.bar.position.y = 0.08 + c.mag * 0.09; } o.nm = nm; },
    hud(ctx, s, c, S) { const [nm, vec, u] = QTY[c.q]; H.panel(ctx, 400, 282, 230, 86); H.pill(ctx, 408, 308, nm + " = " + c.mag + " " + u, vec ? "#ffd27a" : "#7fe3da", 12.5);
      ctx.save(); ctx.font = "11px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#c9d6ea"; ctx.fillText(vec ? "VECTOR · bearing " + String(c.dir).padStart(3, "0") + "°" : "SCALAR · size only, no direction", 410, 334); ctx.fillText(vec ? "arrow length ∝ magnitude (to scale)" : "adds by ordinary arithmetic", 410, 354); ctx.restore(); },
  });

  /* ---------- Resolution of a vector ---------- */
  X.def("Resolution of a Vector", {
    cam: [[0, 1.9, 6.6], [0, 1.1, 0]],
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(6, 0.08, 1.4), M.wood(), S.scene, 0, 0.04, 0); o.box = crate(S, 0.85); o.box.position.set(-1.6, 0.505, 0); o.rope = mk.rod(V(0, 0, 0), V(1, 0, 0), 0.016, M.matte(0xd8c9a0, 0.9)); o.aF = mk.arrow(0xffb703, 0.06, 0.18); o.aX = mk.arrow(0x2fd6c4); o.aY = mk.arrow(0xef5a4a); o.dash = X.line(S, 2, 0xc9d6ea, 0.7); },
    update(S, s, c) { const o = S.objs, t = rad(c.th), Fx = c.F * Math.cos(t), Fy = c.F * Math.sin(t), A = V(-1.17, 0.55, 0.0), sc = 0.03, dir = V(Math.cos(t), Math.sin(t), 0);
      S.setRod(o.rope, A, A.clone().addScaledVector(dir, 3.0)); const A2 = A.clone().add(V(0, 0, 0.12)); S.setArrow(o.aF, A2, V(Fx, Fy, 0), sc); S.setArrow(o.aX, A2, V(Fx, 0, 0), sc); S.setArrow(o.aY, A2.clone().add(V(Fx * sc, 0, 0)), V(0, Fy, 0), sc);
      o.dash.setPts([[A2.x, A2.y + Fy * sc, A2.z], [A2.x + Fx * sc, A2.y + Fy * sc, A2.z]]); o.A = A2; o.Fx = Fx; o.Fy = Fy; },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.A) return; const sc = 0.03, q = S.proj(o.A); ctx.save(); ctx.strokeStyle = "#c9d6ea"; ctx.beginPath(); ctx.arc(q.x, q.y, 34, -rad(c.th), 0); ctx.stroke(); ctx.restore(); H.pill(ctx, q.x + 38, q.y - 4, "θ", "#c9d6ea", 11);
      lab(ctx, S, o.A.clone().add(V(o.Fx * sc / 2, 0, 0)), "Fx = " + K.f(o.Fx, 1) + " N", "#7fe3da", -30, 24, 10.5); lab(ctx, S, o.A.clone().add(V(o.Fx * sc, o.Fy * sc / 2, 0)), "Fy = " + K.f(o.Fy, 1) + " N", "#ff8f80", 8, 4, 10.5); lab(ctx, S, o.A.clone().add(V(o.Fx * sc / 2, o.Fy * sc / 2, 0)), "F = " + c.F + " N", "#ffd27a", -80, -12, 11); },
  });
})();
