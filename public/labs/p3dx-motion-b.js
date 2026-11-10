/* p3dx-motion-b.js — photoreal 3D scenes for T10–T13 simulations in p2d-motion.js (river crossing … impulse). */
(function () {
  "use strict";
  const X = window.PX3; if (!X || !X.ready) return;
  const T = THREE, P = window.P3D, M = P.mat, H = P.hud, V = X.V, K = window.PK, TAU = Math.PI * 2;
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180, wrap = (v, L) => ((((v + L / 2) % L) + L) % L) - L / 2;
  const lab = (ctx, S, p, t, col, dx, dy, sz) => X.lbl(ctx, S, p, t, col, dx, dy, sz);
  const stand = (S, x, z, h) => { const g = X.group(S, x, 0, z); X.mesh(new T.BoxGeometry(1.3, 0.1, 0.8), M.matte(0x2a2f37, 0.45), g, 0, 0.05, 0); X.mesh(new T.CylinderGeometry(0.04, 0.04, h, 20), M.chrome(), g, -0.45, h / 2, 0); return g; };
  const hang = (S, mass, mat) => { const g = X.group(S); X.mesh(new T.CylinderGeometry(0.012, 0.012, 0.12, 8), M.steel(), g, 0, -0.06, 0); const n = clampv(Math.round(mass), 1, 8); for (let i = 0; i < n; i++) X.mesh(new T.CylinderGeometry(0.13, 0.13, 0.055, 32), mat || M.brass(), g, 0, -0.15 - i * 0.06, 0); g.h = 0.15 + n * 0.06; return g; };

  /* ---------- River crossing ---------- */
  X.def("Resultant Velocity — Crossing a River", {
    env: "outdoor", cam: [[0, 4.9, 4.9], [0, 0, 0.1]], shift: 40,
    build(S, s, c, mk, o) {
      o.river = new T.Mesh(new T.BoxGeometry(16, 0.04, 1), new T.MeshPhysicalMaterial({ color: 0x1f5f96, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.88 })); o.river.receiveShadow = true; S.scene.add(o.river);
      o.bed = X.mesh(new T.BoxGeometry(16, 0.02, 1), M.matte(0x3b3022, 1), S.scene, 0, -0.03, 0); o.banks = [-1, 1].map(() => X.mesh(new T.BoxGeometry(16, 0.09, 0.16), M.matte(0x5c4630, 0.95), S.scene));
      o.foam = new T.InstancedMesh(new T.BoxGeometry(0.28, 0.005, 0.025), new T.MeshBasicMaterial({ color: 0xe6f3ff, transparent: true, opacity: 0.55 }), 46); S.scene.add(o.foam); o.fz = Array.from({ length: 46 }, (_, i) => (((i * 37) % 100) / 100 - 0.5)); o.fx = Array.from({ length: 46 }, (_, i) => ((i * 53) % 100) / 100 * 14 - 7);
      const b = (o.boat = X.group(S)); X.mesh(new T.BoxGeometry(0.5, 0.12, 0.24), M.paint(0xf2efe6), b, -0.05, 0.08, 0); const bow = X.mesh(new T.ConeGeometry(0.12, 0.26, 4), M.paint(0xf2efe6), b, 0.32, 0.08, 0); bow.rotation.z = -Math.PI / 2; bow.rotation.x = Math.PI / 4; bow.scale.set(1, 1, 0.7);
      X.mesh(new T.BoxGeometry(0.52, 0.03, 0.25), M.paint(0xc8342a), b, -0.05, 0.13, 0); X.mesh(new T.SphereGeometry(0.06, 16, 12), M.matte(0xffa020, 0.8), b, -0.12, 0.22, 0);
      o.aB = mk.arrow(0x2fd6c4); o.aR = mk.arrow(0x6aa8ff); o.aS = mk.arrow(0xffb703, 0.06, 0.18); o.path = X.line(S, 2, 0xffd27a, 0.9);
    },
    update(S, s, c) {
      const o = S.objs, a = rad(c.hd), vx = c.vr - c.vb * Math.sin(a), vy = c.vb * Math.cos(a), Wv = 3.2, sc = Wv / c.w, x0 = -2.2, z0 = Wv / 2;
      o.river.scale.z = Wv; o.bed.scale.z = Wv; o.banks.forEach((m, i) => m.position.set(0, 0.03, (i ? 1 : -1) * (Wv / 2 + 0.08)));
      const tg = S.t || 0, m4 = new T.Matrix4(); for (let i = 0; i < 46; i++) { m4.makeTranslation(wrap(o.fx[i] + tg * c.vr * sc, 14), 0.025, o.fz[i] * Wv * 0.9); o.foam.setMatrixAt(i, m4); } o.foam.instanceMatrix.needsUpdate = true;
      const tc = vy > 0 ? c.w / vy : Infinity, t = Math.min(s.t || 0, tc), bx = x0 + vx * t * sc, bz = z0 - vy * t * sc; o.boat.position.set(bx, 0.0, bz); o.boat.rotation.y = Math.atan2(Math.cos(a), -Math.sin(a));
      if (isFinite(tc)) o.path.setPts([[x0, 0.05, z0], [x0 + vx * tc * sc, 0.05, -Wv / 2]]); const B = V(bx, 0.32, bz), k = 0.2, hv = V(-Math.sin(a), 0, -Math.cos(a)).multiplyScalar(c.vb);
      S.setArrow(o.aB, B, hv, k); S.setArrow(o.aR, B.clone().addScaledVector(hv, k), V(c.vr, 0, 0), k); S.setArrow(o.aS, B, V(vx, 0, -vy), k); o.B = B; o.res = Math.hypot(vx, vy); o.hv = hv; o.vx = vx; o.vy = vy;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.B) return; const k = 0.2; lab(ctx, S, o.B.clone().addScaledVector(o.hv, k), "boat " + c.vb + " m/s", "#7fe3da", -40, -10, 10); lab(ctx, S, o.B.clone().add(V(o.vx * k, 0, -o.vy * k)), "resultant " + K.f(o.res, 2) + " m/s", "#ffd27a", 8, 4, 10.5);
      lab(ctx, S, V(2.0, 0.05, 1.3), "current " + c.vr + " m/s →", "#9fc6ff", 0, 0, 10); lab(ctx, S, V(-2.2, 0.05, 1.75), "start bank", "#c9d6ea", -30, 22, 10); },
  });

  /* ---------- Couple: steering wheel ---------- */
  X.def("Couple — Steering Wheel & Tap", {
    cam: [[0.4, 2.2, 6.0], [0, 1.75, 0]],
    build(S, s, c, mk, o) {
      X.mesh(new T.BoxGeometry(3.6, 0.9, 1.2), M.matte(0x1e2126, 0.55), S.scene, 0, 0.45, -1.3); const col = mk.rod(V(0, 1.75, -0.12), V(0, 0.9, -1.0), 0.07, M.matte(0x22252b, 0.4)); void col;
      o.w = X.group(S, 0, 1.75, 0); o.parts = new T.Group(); o.w.add(o.parts); o.F1 = mk.arrow(0xffb703, 0.05, 0.16); o.F2 = mk.arrow(0xffb703, 0.05, 0.16); o.dash = X.line(S, 2, 0xc9d6ea, 0.8);
    },
    update(S, s, c) {
      const o = S.objs, R = (c.d / 2) * 6, a = -(s.a || 0);
      if (X.changed(S, "d" + c.d)) { while (o.parts.children.length) o.parts.remove(o.parts.children[0]); const lea = M.matte(0x17181b, 0.62);
        X.mesh(new T.TorusGeometry(R, 0.075, 24, 96), lea, o.parts); X.mesh(new T.CylinderGeometry(0.2, 0.22, 0.14, 40), M.matte(0x2a2d33, 0.4), o.parts).rotation.x = Math.PI / 2; X.mesh(new T.CircleGeometry(0.12, 32), M.chrome(), o.parts, 0, 0, 0.075);
        for (let k = 0; k < 3; k++) { const b = Math.PI / 2 + (k * TAU) / 3, m = new T.Mesh(new T.BoxGeometry(R - 0.15, 0.09, 0.05), M.matte(0x2a2d33, 0.45)); m.position.set(Math.cos(b) * (R / 2 + 0.06), Math.sin(b) * (R / 2 + 0.06), 0); m.rotation.z = b; m.castShadow = true; o.parts.add(m); } }
      o.w.rotation.z = a; const c0 = o.w.position, p1 = V(c0.x + R * Math.cos(a), c0.y + R * Math.sin(a), 0.1), p2 = V(c0.x - R * Math.cos(a), c0.y - R * Math.sin(a), 0.1), t1 = V(Math.sin(a), -Math.cos(a), 0);
      S.setArrow(o.F1, p1, t1, c.F * 0.024); S.setArrow(o.F2, p2, t1.clone().negate(), c.F * 0.024); o.dash.setPts([[p1.x, p1.y, 0.1], [p2.x, p2.y, 0.1]]); o.p1 = p1; o.p2 = p2;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.p1) return; lab(ctx, S, o.p1, "F = " + c.F + " N", "#ffd27a", 12, 4, 10.5); lab(ctx, S, o.p2, "F = " + c.F + " N", "#ffd27a", -80, 4, 10.5); lab(ctx, S, V(0, 1.75, 0.2), "d = " + c.d + " m", "#c9d6ea", 10, -16, 10); },
  });

  /* ---------- Force board ---------- */
  const P1 = V(-1.4, 3.3, 0.12), P2 = V(1.4, 3.3, 0.12);
  X.def("Equilibrium of Three Forces — Force Board", {
    cam: [[0, 2.1, 6.4], [0, 2.0, 0]], hudOpt0: { extra: [X.bgr(400, 166, 228, 208)] },
    build(S, s, c, mk, o) {
      X.mesh(new T.BoxGeometry(3.7, 3.5, 0.08), M.wood(), S.scene, 0, 1.95, -0.02); X.mesh(new T.PlaneGeometry(3.2, 2.7), M.matte(0xf5f3ec, 0.9), S.scene, 0, 1.95, 0.025);
      [P1, P2].forEach((p) => { const g = X.group(S, p.x, p.y, p.z + 0.04); const wh = X.mesh(new T.CylinderGeometry(0.13, 0.13, 0.05, 40), M.brass(), g); wh.rotation.x = Math.PI / 2; X.mesh(new T.TorusGeometry(0.13, 0.012, 8, 40), M.steel(), g); });
      o.s1 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.008, M.matte(0x2b2b2b)); o.s2 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.008, M.matte(0x2b2b2b)); o.s3 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.008, M.matte(0x2b2b2b));
      o.d1 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.008, M.matte(0x2b2b2b)); o.d2 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.008, M.matte(0x2b2b2b)); o.knot = mk.sphere(0.035, M.matte(0x111111));
      o.a1 = mk.arrow(0x2fd6c4); o.a2 = mk.arrow(0xffb703); o.a3 = mk.arrow(0xef5a4a);
    },
    update(S, s, c) {
      const o = S.objs, Sv = S.variant.solve(c), key = [c.W1, c.W2, c.W3].join();
      if (X.changed(S, key)) { X.clear(S, [o.h1, o.h2, o.h3]); o.h1 = hang(S, c.W1); o.h2 = hang(S, c.W2); o.h3 = hang(S, c.W3, M.iron()); }
      let kn; if (Sv) { const t1 = Math.tan(Sv.a1), t2 = Math.tan(Sv.a2), hh = (P2.x - P1.x) / (t1 + t2); kn = V(P1.x + hh * t1, clampv(P1.y - hh, 0.85, 3.2), 0.12); } else kn = V(0, 1.6, 0.12);
      o.knot.position.copy(kn); S.setRod(o.s1, kn, P1.clone().add(V(0.09, 0.09, 0))); S.setRod(o.s2, kn, P2.clone().add(V(-0.09, 0.09, 0))); const yk = kn.y - 0.45; S.setRod(o.s3, kn, V(kn.x, yk, 0.12)); o.h3.position.set(kn.x, yk, 0.14);
      S.setRod(o.d1, P1.clone().add(V(-0.13, 0, 0)), V(P1.x - 0.13, 2.25, 0.12)); S.setRod(o.d2, P2.clone().add(V(0.13, 0, 0)), V(P2.x + 0.13, 2.25, 0.12)); o.h1.position.set(P1.x - 0.13, 2.25, 0.14); o.h2.position.set(P2.x + 0.13, 2.25, 0.14);
      [o.a1, o.a2, o.a3].forEach((a) => (a.visible = !!Sv)); if (Sv) { const k = 0.11, kz = kn.clone().add(V(0, 0, 0.05)); S.setArrow(o.a1, kz, V(-Math.sin(Sv.a1), Math.cos(Sv.a1), 0), c.W1 * k); S.setArrow(o.a2, kz, V(Math.sin(Sv.a2), Math.cos(Sv.a2), 0), c.W2 * k); S.setArrow(o.a3, kz, V(0, -1, 0), c.W3 * k * 0.6); }
      o.kn = kn; o.Sv = Sv;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.kn) return; if (!o.Sv) { H.pill(ctx, 30, 380, "No equilibrium: one weight exceeds the sum of the other two", "#ef7a6d", 11); return; }
      lab(ctx, S, V(P1.x - 0.13, 2.25 - o.h1.h, 0.14), c.W1 + " N", "#7fe3da", -16, 16, 10); lab(ctx, S, V(P2.x + 0.13, 2.25 - o.h2.h, 0.14), c.W2 + " N", "#ffd27a", -16, 16, 10); lab(ctx, S, V(o.kn.x, o.kn.y - 0.45 - o.h3.h, 0.14), c.W3 + " N", "#ff8f80", -16, 16, 10); },
  });

  /* ---------- S.H.M.: spring or loaded test-tube, reference circle ---------- */
  const EQ = 1.75;
  X.def("S.H.M. — Spring, Reference Circle & Energy", {
    cam: [[0.5, 2.1, 6.6], [0.5, 1.9, 0]], shift: 150, hudOpt0: { extra: [X.bgr(362, 98, 122, 262)] },
    build(S, s, c, mk, o) {
      const g0 = (o.g0 = X.group(S)), g1 = (o.g1 = X.group(S)); stand(S, -0.15, -0.2, 4.0).children.forEach(() => {}); const arm = X.mesh(new T.CylinderGeometry(0.035, 0.035, 0.8, 16), M.chrome(), S.scene, -0.3, 3.85, -0.2); arm.rotation.z = Math.PI / 2;
      X.mesh(new T.BoxGeometry(0.16, 0.08, 0.16), M.steel(), g0, 0, 3.8, -0.1); o.spr = mk.spring(16, 0.11, 0.012, M.steel()); g0.add(o.spr); o.mass = hang(S, 4); g0.add(o.mass);
      o.bk = mk.beaker(0.55, 2.3, 1.9, 0x3f9fd8); o.bk.position.set(0, 0, 0); g1.add(o.bk); const tt = (o.tube = X.group(S)); g1.add(tt); const gm = M.glass(0xeef8ff); gm.opacity = 0.4;
      const tub = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 1.5, 32, 1, true), gm); tub.renderOrder = 4; tt.add(tub); X.mesh(new T.SphereGeometry(0.13, 32, 12, 0, TAU, Math.PI / 2, Math.PI / 2), gm, tt, 0, -0.75, 0); X.mesh(new T.CylinderGeometry(0.11, 0.12, 0.3, 24), M.matte(0x6d6f73, 0.6), tt, 0, -0.62, 0);
      const disc = X.mesh(new T.CylinderGeometry(1, 1, 0.04, 64), M.plastic(0x1c2533, 0.3), S.scene, 1.55, EQ, -0.1); disc.rotation.x = Math.PI / 2; o.disc = disc; o.peg = mk.sphere(0.07, M.emissive(0xffb703, 1.2)); o.arm = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.015, M.steel());
      X.mesh(new T.BoxGeometry(1.2, 0.01, 0.02), M.glow(0xffffff, 0.35), S.scene, 0.45, EQ, 0.25);
    },
    update(S, s, c) {
      const o = S.objs, v = S.variant, k = v.kk(c), w = Math.sqrt(k / c.m), x = c.A * Math.cos(w * (s.t || 0)), sc = 10, y = EQ - x * sc; o.g0.visible = c.sys === 0; o.g1.visible = c.sys === 1;
      if (c.sys === 0) { o.mass.position.set(0, y + 0.15, -0.1); o.spr.position.set(0, y + 0.18, -0.1); o.spr.scale.y = 3.76 - (y + 0.18); } else o.tube.position.set(0, y + 0.25, 0);
      const R = c.A * sc; o.disc.scale.set(R + 0.12, 1, R + 0.12); const ph = w * (s.t || 0), pp = V(1.55 + R * Math.sin(ph), EQ - R * Math.cos(ph), 0); o.peg.position.copy(pp); S.setRod(o.arm, V(1.55, EQ, -0.06), pp); o.pp = pp; o.y = y;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.pp) return; H.line(ctx, S, o.pp, V(0.2, o.y, o.pp.z), "#ffb703", 1, [3, 3]); lab(ctx, S, V(-0.6, EQ, 0.25), "equilibrium", "#c9d6ea", -40, -6, 9.5); lab(ctx, S, V(1.55, EQ - c.A * 10 - 0.2, 0), "reference circle (ω)", "#c9d6ea", -60, 18, 9.5); },
  });

  /* ---------- Barton's pendulums ---------- */
  const BL = [0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5], SA = V(-2.7, 3.55, 0), SB = V(1.5, 3.3, 0), sy = (x) => SA.y + ((x - SA.x) / (SB.x - SA.x)) * (SB.y - SA.y);
  X.def("Forced Vibration & Resonance (Barton's Pendulums)", {
    cam: [[-3.4, 2.7, 6.6], [-0.7, 2.0, 0]], shift: 70, hudOpt0: { bgAll: 1 },
    build(S, s, c, mk, o) {
      [SA, SB].forEach((p) => { const g = stand(S, p.x + 0.45, -0.0, p.y + 0.15); void g; }); mk.rod(SA, SB, 0.01, M.matte(0xd8c9a0, 0.9));
      o.p = BL.map((L, i) => ({ L, x: -2.0 + i * 0.5, str: mk.rod(V(0, 0, 0), V(0, 1, 0), 0.005, M.matte(0xe6e0d0, 0.9)), bob: (() => { const m = X.mesh(new T.ConeGeometry(0.09, 0.2, 28), M.matte(0xf4efe2, 0.85), S.scene); m.rotation.x = Math.PI; return m; })() }));
      o.d = { str: mk.rod(V(0, 0, 0), V(0, 1, 0), 0.008, M.matte(0xe6e0d0, 0.9)), bob: mk.sphere(0.16, M.brass()) };
    },
    update(S, s, c) {
      const o = S.objs, v = S.variant, w = Math.sqrt(K.g / c.Ld), amax = v.amp(c.Ld, c), t = s.t || 0, put = (x, len, th, str, bob, off) => { const top = V(x, sy(x), 0), b = V(x, top.y - len * Math.cos(th), len * Math.sin(th)); S.setRod(str, top, b); bob.position.copy(b).add(V(0, off, 0)); };
      o.p.forEach((q) => { const A = (v.amp(q.L, c) / amax) * 0.35, w0 = Math.sqrt(K.g / q.L), ph = Math.atan2(c.b * 2 * w, w0 * w0 - w * w), th = A * Math.cos(w * t - ph); put(q.x, 0.35 + q.L * 1.45, th, q.str, q.bob, -0.08); q.bob.material.color.set(Math.abs(q.L - c.Ld) < 0.06 ? 0xffb703 : 0xf4efe2); });
      put(-2.5, 0.35 + c.Ld * 1.45, 0.35 * Math.cos(w * t), o.d.str, o.d.bob, -0.12);
    },
    hud(ctx, s, c, S) { const o = S.objs; o.p.forEach((q) => lab(ctx, S, V(q.x, 0.25, 0), q.L.toFixed(1), "#c9d6ea", -10, 14, 9)); lab(ctx, S, o.d.bob.position, "driver", "#ff8f80", -56, 0, 10); H.pill(ctx, 14, 390, "pendulum lengths (m) · they swing towards you", "#c9d6ea", 10); },
  });

  /* ---------- Determining g ---------- */
  X.def("Determining g — Graph of T² against L", {
    cam: [[0.2, 2.0, 6.2], [0.2, 1.75, 0]], shift: [40, 0], hudOpt0: { bg: 1, place: (r) => (r[0] < 400 ? X.fit(r, 4, 186, 250, 210) : null) },
    build(S, s, c, mk, o) {
      stand(S, 0.1, 0, 3.6); const arm = X.mesh(new T.CylinderGeometry(0.03, 0.03, 1.1, 16), M.chrome(), S.scene, 0.2, 3.38, 0); arm.rotation.z = Math.PI / 2; X.mesh(new T.BoxGeometry(0.12, 0.1, 0.18), M.wood(), S.scene, 0.72, 3.34, 0);
      o.piv = V(0.72, 3.3, 0); o.str = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.006, M.matte(0xe8e2cf, 0.9)); o.bob = mk.sphere(0.1, M.brass());
      const rt = X.scaleTex(160, { w: 96, h: 2048, fg: "#1b1b1b", bg: "#e8d9a4", major: 10, fs: 26, label: (i) => (i % 10 === 0 ? String(i / 100) : "") }); const rl = X.mesh(new T.BoxGeometry(0.16, 2.72, 0.03), [M.wood(), M.wood(), M.wood(), M.wood(), new T.MeshStandardMaterial({ map: rt, roughness: 0.6 }), M.wood()], S.scene, 1.15, 3.3 - 1.36, -0.05); rl.scale.y = -1; rl.rotation.z = 0;
    },
    update(S, s, c) {
      const o = S.objs, D = S.variant.data(c), n = D.pts.length, i = Math.floor((S.t || 0) / 4) % n, p = D.pts[i], Lv = p[0] * 1.7, th = 0.16 * Math.cos((TAU * (S.t || 0)) / p[1]);
      const b = V(o.piv.x + Lv * Math.sin(th), o.piv.y - Lv * Math.cos(th), 0); S.setRod(o.str, o.piv, b); o.bob.position.copy(b); o.cur = { i, p };
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.cur) return; const { i, p } = o.cur; H.pill(ctx, 14, 28, "Reading " + (i + 1) + ": L = " + K.f(p[0], 2) + " m · T = " + K.f(p[1], 3) + " s", "#ffd27a", 11); lab(ctx, S, V(1.15, 0.5, 0), "metre rule", "#c9d6ea", 6, 0, 9.5); },
  });

  /* ---------- Inertia: coin, card and glass ---------- */
  X.def("Inertia — Coin, Card & Glass", {
    cam: [[0.2, 2.0, 4.6], [0.2, 1.05, 0]], shift: 110,
    build(S, s, c, mk, o) {
      const pts = [new T.Vector2(0.001, 0), new T.Vector2(0.36, 0), new T.Vector2(0.4, 0.04), new T.Vector2(0.44, 1.4), new T.Vector2(0.42, 1.4), new T.Vector2(0.38, 0.06), new T.Vector2(0.001, 0.06)];
      const gl = new T.Mesh(new T.LatheGeometry(pts, 64), M.glass()); gl.renderOrder = 3; S.scene.add(gl);
      o.card = X.mesh(new T.BoxGeometry(1.4, 0.014, 0.9), M.paint(0xe23a4a), S.scene, 0, 1.41, 0); o.coin = X.mesh(new T.CylinderGeometry(0.14, 0.14, 0.025, 48), M.gold(), S.scene, 0, 1.43, 0);
    },
    update(S, s, c) {
      const o = S.objs, sc = 15, kx = (s.xk || 0) * sc, cx = (s.xc || 0) * sc; o.card.position.x = kx; o.card.visible = kx < 6;
      let y = 1.43; if (s.state === 1) { const inG = Math.abs(cx) < 0.3; y = inG ? Math.max(0.075, 1.43 - 0.5 * K.g * (s.drop || 0) * (s.drop || 0) * 6) : Math.max(0.013, 1.43 - 0.5 * K.g * (s.drop || 0) * (s.drop || 0) * 6); }
      o.coin.position.set(cx, y, 0); o.coin.rotation.z = s.state === 1 ? Math.min(0.5, (s.drop || 0) * 2) * Math.sign(cx || 1) * (Math.abs(cx) > 0.3 ? 1 : 0.2) : 0;
    },
    hud(ctx, s, c, S) { const o = S.objs; lab(ctx, S, o.coin.position, "coin", "#ffd27a", 12, -10, 10); if (o.card.visible) lab(ctx, S, o.card.position.clone().add(V(0.6, 0, 0.45)), "card", "#ff8f80", 6, 10, 10); lab(ctx, S, V(-0.44, 0.7, 0.3), "glass tumbler", "#c9d6ea", -96, 0, 10); },
  });

  /* ---------- Impulse: dropping an egg ---------- */
  const SURF = [0x8a8a8a, 0x4f7d36, 0xf2c84a, 0xe8e0c0];
  X.def("Impulse — Ft = Δ(mv)", {
    cam: [[0, 1.5, 4.3], [0, 1.25, 0]], shift: 180,
    build(S, s, c, mk, o) {
      o.slab = X.mesh(new T.BoxGeometry(1.4, 0.2, 1.1), M.matte(0x8a8a8a, 0.9), S.scene, 0, 0.1, 0);
      const pr = []; for (let i = 0; i <= 24; i++) { const u = i / 24, a = u * Math.PI; pr.push(new T.Vector2(Math.max(0.001, Math.sin(a) * 0.11 * (1 - 0.18 * Math.cos(a))), -Math.cos(a) * 0.14)); } o.egg = X.mesh(new T.LatheGeometry(pr, 40), M.ceramic(0xf3ecdc), S.scene, 0, 1, 0);
      o.yolk = X.mesh(new T.CylinderGeometry(0.16, 0.18, 0.02, 32), M.plastic(0xf2b81a, 0.2), S.scene, 0, 0.21, 0); o.white = X.mesh(new T.CylinderGeometry(0.32, 0.34, 0.01, 40), M.water(0xfffdf2), S.scene, 0.05, 0.205, 0.02);
      o.shell = [0, 1, 2, 3].map((i) => X.mesh(new T.SphereGeometry(0.06, 12, 8, 0, 2, 0, 1.2), M.ceramic(0xf3ecdc), S.scene, Math.cos(i * 1.7) * 0.28, 0.23, Math.sin(i * 1.7) * 0.22));
      const rt = X.scaleTex(50, { w: 96, h: 1024, fg: "#111", bg: "#f3efe4", major: 10, fs: 30, label: (i) => (i % 10 === 0 ? String(i / 10) + " m" : "") }); X.mesh(new T.BoxGeometry(0.12, 2.25, 0.04), [M.wood(), M.wood(), M.wood(), M.wood(), new T.MeshStandardMaterial({ map: rt, roughness: 0.6 }), M.wood()], S.scene, -0.75, 0.34 + 1.125, 0);
    },
    update(S, s, c) {
      const o = S.objs, tf = Math.sqrt((2 * c.h) / K.g), y = Math.min(c.h, 0.5 * K.g * (s.t || 0) * (s.t || 0)), F = (c.m * Math.sqrt(2 * K.g * c.h)) / [0.002, 0.012, 0.06, 0.12][c.sf] + c.m * K.g, landed = (s.t || 0) >= tf, broke = landed && F > 25 && c.m < 0.1;
      o.slab.material.color.set(SURF[c.sf]); o.slab.scale.y = c.sf >= 2 ? 1.6 : 1; o.slab.position.y = (0.2 * o.slab.scale.y) / 2; const top = 0.2 * o.slab.scale.y;
      o.egg.visible = !broke; o.egg.position.y = top + 0.2 + (c.h - y) * 0.45; o.egg.scale.setScalar(1.3 + c.m * 3); [o.yolk, o.white, ...o.shell].forEach((m) => { m.visible = broke; m.position.y = top + 0.01; }); o.F = F; o.landed = landed;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (o.F == null) return; lab(ctx, S, V(0.3, 0.3, 0.55), ["Concrete floor", "Grass", "Sponge cushion", "Air bag / sand pit"][c.sf], "#c9d6ea", -40, 24, 10); if (o.landed) lab(ctx, S, V(0, 0.6, 0), "F ≈ " + K.f(o.F, 1) + " N", o.F > 25 ? "#ef7a6d" : "#5bd68c", -30, -10, 12); },
  });
})();
