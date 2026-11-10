/* p3dx-matter.js — photoreal 3D scenes for the T1/T3/T5/T6 simulations added in p2d-matter.js.
   Physics, controls and readouts come from the 2D variants; these scenes rebuild the apparatus in three.js. */
(function () {
  "use strict";
  const X = window.PX3; if (!X || !X.ready) return;
  const T = THREE, P = window.P3D, M = P.mat, H = P.hud, V = X.V, K = window.PK, TAU = Math.PI * 2;
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v));
  /* shared apparatus */
  const glassBox = (S, w, h, d, x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); S.scene.add(g);
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), M.glass()); m.position.y = h / 2; m.renderOrder = 3; g.add(m);
    const e = M.matte(0x1d232c, 0.5); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => X.mesh(new T.BoxGeometry(0.035, h, 0.035), e, g, (a * w) / 2, h / 2, (b * d) / 2));
    X.mesh(new T.BoxGeometry(w + 0.04, 0.04, d + 0.04), e, g, 0, 0.02, 0); return g; };
  const liquid = (parent, w, d, col, mat) => { const m = new T.Mesh(new T.BoxGeometry(w, 1, d), mat || M.water(col)); m.renderOrder = 2; parent.add(m); m.setH = (y0, y1) => { m.scale.y = Math.max(0.001, y1 - y0); m.position.y = (y0 + y1) / 2; }; return m; };
  const balance = (S, x, z) => { const g = X.group(S, x, 0, z); X.mesh(new T.BoxGeometry(1.0, 0.22, 0.85), M.plastic(0xe9ecef, 0.3), g, 0, 0.11, 0);
    X.mesh(new T.CylinderGeometry(0.34, 0.34, 0.03, 48), M.steel(), g, 0, 0.245, -0.05); X.mesh(new T.BoxGeometry(0.68, 0.18, 0.04), M.plastic(0x20252c, 0.4), g, 0, 0.115, 0.43);
    const lcd = X.screen(g, 0.62, 0.15, { bg: "#a9c29b", fg: "#18241a", glow: 0.15, fs: 0.95 }); lcd.position.set(0, 0.115, 0.452); g.lcd = lcd; return g; };
  const stand = (S, x, z, h) => { const g = X.group(S, x, 0, z); X.mesh(new T.BoxGeometry(1.3, 0.1, 0.8), M.matte(0x2a2f37, 0.45), g, 0, 0.05, 0);
    X.mesh(new T.CylinderGeometry(0.04, 0.04, h, 20), M.chrome(), g, -0.45, h / 2, 0); return g; };
  const solidMat = (rho) => (rho < 1000 ? M.wood() : rho < 2550 ? M.glass(0xbfe3d6) : rho < 2650 ? M.matte(0x7d7a74, 0.85) : rho < 3000 ? M.aluminium() : rho < 8000 ? M.iron() : M.brass());

  /* ---------- Brownian motion: smoke cell under a microscope ---------- */
  const bx = (x) => (x - 225) * 0.008, by = (y) => 0.5 + (366 - y) * 0.008;
  X.def("Brownian Motion — Smoke Cell", {
    env: "dark", envOpts: { w: 12, d: 7 }, cam: [[0, 2.1, 7.2], [0, 1.85, 0]], exposure: 1.15,
    build(S, s, c, mk, o) {
      const cell = glassBox(S, 3.3, 2.95, 0.8, 0, 0.35, 0); o.cell = cell;
      X.mesh(new T.BoxGeometry(3.25, 2.9, 0.02), M.matte(0x020306, 0.95), cell, 0, 1.47, -0.38);
      X.mesh(new T.BoxGeometry(3.6, 0.35, 1.0), M.brass(), S.scene, 0, 0.175, 0);
      const lamp = X.group(S, -2.55, 1.85, 0.05); X.mesh(new T.CylinderGeometry(0.2, 0.24, 0.7, 32), M.matte(0x22262d, 0.4), lamp).rotation.z = Math.PI / 2;
      const lens = X.mesh(new T.SphereGeometry(0.2, 32, 16), M.glass(0xfff4d0), lamp, 0.38, 0, 0); lens.scale.set(0.3, 1, 1);
      X.mesh(new T.CylinderGeometry(0.04, 0.04, 1.85, 12), M.chrome(), lamp, 0, -0.92, 0);
      const beam = new T.Mesh(new T.ConeGeometry(0.75, 3.4, 40, 1, true), M.glow(0xfff1c8, 0.07)); beam.rotation.z = Math.PI / 2; beam.position.set(-0.75, 1.85, 0.05); S.scene.add(beam);
      mk.soft(0xfff0c0, 0.9, -2.15, 1.85, 0.05, 0.75);
      o.mol = mk.particles(170, 0.022, new T.MeshStandardMaterial({ color: 0x9fc3ff, emissive: 0x6c9cff, emissiveIntensity: 0.9, roughness: 0.4 }));
      o.mz = Array.from({ length: 170 }, (_, i) => (((i * 7919) % 100) / 100 - 0.5) * 0.55);
      o.sp = mk.sphere(0.075, new T.MeshStandardMaterial({ color: 0xfff6e2, emissive: 0xfff0d0, emissiveIntensity: 1.6, roughness: 0.5 }), 0, 1.8, 0); o.spg = mk.soft(0xffe9b0, 0.55, 0, 1.8, 0, 0.7);
      o.tr = X.line(S, 1200, 0xffb703, 0.85);
      const scope = X.group(S, 0, 3.55, 0.05); X.mesh(new T.CylinderGeometry(0.16, 0.12, 0.6, 32), M.matte(0x1f2329, 0.35), scope); X.mesh(new T.CylinderGeometry(0.1, 0.1, 0.14, 24), M.chrome(), scope, 0, -0.36, 0);
    },
    update(S, s, c) {
      const o = S.objs; if (!s.m) return;
      o.mol.visible = !!c.show; if (c.show) { s.m.forEach((q, i) => o.mol.set(i, bx(q.x), by(q.y), o.mz[i])); o.mol.instanceMatrix.needsUpdate = true; }
      const x = bx(s.P.x), y = by(s.P.y); o.sp.position.set(x, y, 0); o.spg.position.set(x, y, 0);
      o.tr.setPts(s.trail.map((p) => [bx(p[0]), by(p[1]), 0]));
    },
    hud(ctx, s, c, S) { X.lbl(ctx, S, V(-1.6, 3.35, 0.4), "Smoke cell · side-lit · seen through microscope", "#dbe7ff", 0, 0, 10.5); if (s.P) X.lbl(ctx, S, S.objs.sp.position, "smoke speck", "#ffd27a"); },
  });

  /* ---------- Capillarity ---------- */
  const LIQ = [["Water", 0.072, 0, 1000, 0x3d9fd6], ["Mercury", 0.465, 140, 13600, 0xc8ccd4], ["Ethanol", 0.022, 0, 789, 0x8fd0f0], ["Soapy water", 0.03, 0, 1000, 0xa9d8f5]];
  X.def("Cohesion, Adhesion & Capillarity", {
    cam: [[0, 1.9, 6.2], [0, 1.35, 0]],
    build(S, s, c, mk, o) {
      o.trough = glassBox(S, 3.8, 0.55, 1.1, 0, 0, 0); o.mats = LIQ.map((l, i) => (i === 1 ? new T.MeshPhysicalMaterial({ color: 0xd9dde3, metalness: 1, roughness: 0.08 }) : M.water(l[4]))); o.cm = LIQ.map((l, i) => { if (i === 1) return o.mats[1]; const m = M.water(l[4]); m.opacity = 0.85; m.color.multiplyScalar(0.8); return m; });
      o.bath = liquid(o.trough, 3.74, 1.04, 0, o.mats[0]); o.bath.setH(0.04, 0.42);
      o.tubes = [1, 2, 4].map((mul, i) => { const x = -1.2 + i * 1.2, r = 0.028 + mul * 0.022, g = X.group(S, x, 0, 0);
        const gl = new T.Mesh(new T.CylinderGeometry(r + 0.018, r + 0.018, 2.6, 32, 1, true), M.glass()); gl.position.y = 1.4; gl.renderOrder = 3; g.add(gl);
        const col = new T.Mesh(new T.CylinderGeometry(r, r, 1, 28), o.mats[0]); col.userData.col = true; col.renderOrder = 2; g.add(col);
        const cap = new T.Mesh(new T.SphereGeometry(r, 28, 12, 0, TAU, 0, Math.PI / 2), o.mats[0]); cap.renderOrder = 2; g.add(cap);
        const ring = new T.Mesh(new T.TorusGeometry(r, r * 0.22, 8, 32), M.glow(0xffffff, 0.35)); ring.rotation.x = Math.PI / 2; g.add(ring);
        X.mesh(new T.BoxGeometry(0.05, 0.5, 0.05), M.matte(0x2a2f37), g, 0, 2.55, -0.08); return { g, r, mul, col, cap, ring, x }; });
      X.mesh(new T.BoxGeometry(3.4, 0.06, 0.1), M.wood(), S.scene, 0, 2.82, -0.08);
    },
    update(S, s, c) {
      const o = S.objs, L = LIQ[c.liq], mat = o.mats[c.liq]; o.bath.material = mat;
      o.tubes.forEach((t) => { const r = (c.r * t.mul) / 1000, h = (2 * L[1] * Math.cos(K.rad(L[2]))) / (L[3] * K.g * r), y = clampv(0.42 + h * 1000 * 0.02, 0.16, 2.62);
        t.h = h; t.col.material = t.cap.material = o.cm[c.liq]; t.col.scale.y = y - 0.12; t.col.position.y = (y + 0.12) / 2;
        const convex = L[2] > 90; t.cap.position.y = convex ? y : y - t.r * 0.6; t.cap.scale.set(1, convex ? 0.55 : 0.001, 1); t.ring.position.y = convex ? y - t.r * 0.1 : y; t.top = y; });
    },
    hud(ctx, s, c, S) { S.objs.tubes.forEach((t) => { if (t.h == null) return; const mm = t.h * 1000; X.lbl(ctx, S, V(t.x, t.top + 0.08, 0), (mm >= 0 ? "+" : "") + K.f(mm, 1) + " mm", mm >= 0 ? "#7fe3da" : "#ef7a6d", -26, -6);
      X.lbl(ctx, S, V(t.x, 2.98, 0), "r = " + K.f(c.r * t.mul, 1) + " mm", "#c9d6ea", -34, 0, 10); }); X.lbl(ctx, S, V(-1.85, 0.42, 0.56), LIQ[c.liq][0] + " in a trough", "#e6eef8", 0, 26, 10.5); },
  });

  /* ---------- Crystalline vs amorphous: ball-and-stick model on a turntable ---------- */
  X.def("Crystalline vs Amorphous Solids", {
    cam: [[0, 2.3, 5.6], [0, 1.45, 0]],
    build(S, s, c, mk, o) {
      X.mesh(new T.CylinderGeometry(0.95, 1.05, 0.14, 64), M.wood(), S.scene, 0, 0.07, 0); X.mesh(new T.CylinderGeometry(0.08, 0.08, 0.5, 20), M.chrome(), S.scene, 0, 0.38, 0);
      o.rot = X.group(S, 0, 1.55, 0);
    },
    update(S, s, c) {
      const o = S.objs; o.rot.rotation.y = s.a || 0; o.rot.rotation.x = 0.18;
      if (X.changed(S, "cell" + c.cell)) {
        while (o.rot.children.length) { const q = o.rot.children.pop(); q.geometry && q.geometry.dispose(); }
        const a = 0.72, pts = [], rod = M.steel(), add = (p, col, r) => { X.mesh(new T.SphereGeometry(r, 40, 28), M.plastic(col, 0.25), o.rot, p[0] * a, p[1] * a, p[2] * a); pts.push(p); };
        const bond = (p, q) => { const m = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 1, 12), rod); S.setRod(m, V(p[0] * a, p[1] * a, p[2] * a), V(q[0] * a, q[1] * a, q[2] * a)); m.castShadow = true; o.rot.add(m); };
        if (c.cell < 3) {
          const Vv = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) { Vv.push([x, y, z]); add([x, y, z], 0x2fb8a8, 0.17); }
          Vv.forEach((p, i) => Vv.forEach((q, j) => { if (j > i && Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) === 2) bond(p, q); }));
          if (c.cell === 1) { add([0, 0, 0], 0xf0a020, 0.19); Vv.forEach((p) => bond([0, 0, 0], p)); }
          if (c.cell === 2) [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]].forEach((f) => { add(f, 0xf0a020, 0.17); Vv.forEach((p) => { if (p[0] * f[0] + p[1] * f[1] + p[2] * f[2] === 1) bond(f, p); }); });
          const cube = new T.Mesh(new T.BoxGeometry(2 * a, 2 * a, 2 * a), new T.MeshPhysicalMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.08, roughness: 0.1, depthWrite: false, side: T.DoubleSide })); cube.renderOrder = 3; o.rot.add(cube);
        } else {
          const r = K.rnd(11), P2 = []; for (let i = 0; i < 26; i++) { const p = [r() * 2.4 - 1.2, r() * 2.4 - 1.2, r() * 2.4 - 1.2]; P2.push(p); add(p, 0x9a74e8, 0.15); }
          P2.forEach((p, i) => P2.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 0.85) bond(p, q); }));
        }
      }
    },
    hud(ctx, s, c, S) { X.lbl(ctx, S, V(-0.9, 0.45, 0.9), c.cell < 3 ? "ball-and-stick unit cell (teal: corners · amber: centre / faces)" : "glass: random network, no repeating cell", "#dbe7ff", -40, 22, 10); },
  });

  /* ---------- Vernier calipers and micrometer screw gauge ---------- */
  const mmTex = (w, h, draw) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const g = cv.getContext("2d"); draw(g, w, h); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16; return t; };
  const VSC = 0.07, VX0 = -1.75, BEAM = 4.3;
  X.def("Vernier Calipers & Micrometer", {
    cam: [[0, 1.6, 5.6], [0, 1.45, 0]], fov: 34, shift: [0, 52],
    build(S, s, c, mk, o) {
      const st = M.steel(); st.roughness = 0.22; const vg = (o.vg = X.group(S, 0, 0, 0)), mg = (o.mg = X.group(S, 0, 0, 0));
      /* vernier: beam with engraved main scale */
      const mainTex = mmTex(4096, 160, (g, w, h) => { g.fillStyle = "#d9dde2"; g.fillRect(0, 0, w, h); g.strokeStyle = g.fillStyle = "#111"; g.font = "bold 44px Arial";
        for (let mm = 0; mm <= 55; mm++) { const u = ((VX0 + mm * VSC + BEAM / 2) / BEAM) * w, L = mm % 10 === 0 ? 70 : mm % 5 === 0 ? 50 : 34; g.lineWidth = 3; g.beginPath(); g.moveTo(u, h); g.lineTo(u, h - L); g.stroke(); if (mm % 10 === 0) { g.textAlign = "center"; g.fillText(String(mm / 10), u, h - 84); } } g.fillText("cm", w * 0.97, 60); });
      const fm = [st, st, st, st, new T.MeshPhysicalMaterial({ map: mainTex, metalness: 0.75, roughness: 0.3 }), st];
      X.mesh(new T.BoxGeometry(BEAM, 0.24, 0.05), fm, vg, 0, 2.0, 0);
      X.mesh(new T.BoxGeometry(0.16, 1.15, 0.06), st, vg, VX0 - 0.08, 1.48, 0); X.mesh(new T.BoxGeometry(0.1, 0.32, 0.05), st, vg, VX0 - 0.05, 2.28, 0);
      o.sl = X.group(S, 0, 0, 0); vg.add(o.sl);
      X.mesh(new T.BoxGeometry(0.95, 0.07, 0.11), st, o.sl, 0.47, 2.155, 0); X.mesh(new T.BoxGeometry(0.95, 0.04, 0.11), st, o.sl, 0.47, 2.14, -0.06);
      o.vPlate = X.mesh(new T.BoxGeometry(0.95, 0.24, 0.035), st, o.sl, 0.47, 1.77, 0.01);
      X.mesh(new T.BoxGeometry(0.16, 1.15, 0.06), st, o.sl, 0.08, 1.48, 0); X.mesh(new T.BoxGeometry(0.1, 0.32, 0.05), st, o.sl, 0.05, 2.28, 0);
      X.mesh(new T.CylinderGeometry(0.06, 0.06, 0.05, 24), M.brass(), o.sl, 0.62, 2.22, 0.05).rotation.x = Math.PI / 2;
      o.vTex = mmTex(1024, 128, () => {}); o.vFace = new T.Mesh(new T.PlaneGeometry(0.93, 0.115), new T.MeshPhysicalMaterial({ map: o.vTex, metalness: 0.6, roughness: 0.32 })); o.vFace.position.set(0.47, 1.83, 0.03); o.sl.add(o.vFace);
      o.obj = X.mesh(new T.BoxGeometry(1, 0.42, 0.42), M.brass(), vg, 0, 1.15, 0);
      /* micrometer */
      const fr = M.paint(0x284b8a); const fx = -1.35;
      mk.tube([[fx - 0.12, 1.75, 0], [fx - 0.5, 1.45, 0], [fx - 0.35, 0.85, 0], [fx + 0.55, 0.78, 0], [fx + 1.25, 1.2, 0], [fx + 1.35, 1.65, 0]], 0.12, fr, 64).removeFromParent();
      const frame = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V(fx - 0.12, 1.75, 0), V(fx - 0.5, 1.45, 0), V(fx - 0.35, 0.85, 0), V(fx + 0.55, 0.78, 0), V(fx + 1.25, 1.2, 0), V(fx + 1.32, 1.68, 0)]), 64, 0.12, 16), fr); frame.castShadow = true; mg.add(frame);
      const ax = (m) => { m.rotation.z = Math.PI / 2; return m; };
      ax(X.mesh(new T.CylinderGeometry(0.075, 0.075, 0.3, 32), M.chrome(), mg, fx, 1.78, 0));
      o.ms0 = fx + 1.3; ax(X.mesh(new T.CylinderGeometry(0.15, 0.15, 0.2, 40), M.chrome(), mg, o.ms0 - 0.1, 1.78, 0));
      const sleeveTex = mmTex(2048, 160, (g, w, h) => { g.fillStyle = "#cfd3d8"; g.fillRect(0, 0, w, h); g.strokeStyle = g.fillStyle = "#111"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); g.font = "bold 30px Arial"; g.textAlign = "center";
        for (let k = 0; k <= 52; k++) { const u = (k * 0.5 / 26) * w * 0.98 + 6; g.beginPath(); g.moveTo(u, h / 2); g.lineTo(u, k % 2 === 0 ? h / 2 - 34 : h / 2 + 30); g.stroke(); if (k % 10 === 0) g.fillText(String(k / 2), u, h / 2 - 44); } });
      o.sleeve = ax(X.mesh(new T.CylinderGeometry(0.115, 0.115, 1.7, 48), new T.MeshPhysicalMaterial({ map: sleeveTex, metalness: 0.7, roughness: 0.3 }), mg, o.ms0 + 0.85, 1.78, 0));
      sleeveTex.wrapS = T.RepeatWrapping; sleeveTex.repeat.set(1, 1);
      o.sleeve.geometry.dispose(); o.sleeve.geometry = new T.PlaneGeometry(1.7, 0.2); o.sleeve.rotation.set(0, 0, 0); o.sleeve.position.set(o.ms0 + 0.85, 1.78, 0.116);
      ax(X.mesh(new T.CylinderGeometry(0.11, 0.11, 1.7, 40), M.chrome(), mg, o.ms0 + 0.85, 1.78, 0));
      const thTex = mmTex(2048, 256, (g, w, h) => { g.fillStyle = "#c4c9cf"; g.fillRect(0, 0, w, h); g.strokeStyle = g.fillStyle = "#111"; g.lineWidth = 4; g.font = "bold 46px Arial"; g.textAlign = "center";
        for (let i = 0; i < 50; i++) { const u = w - (i / 50) * w; g.beginPath(); g.moveTo(u, 0); g.lineTo(u, i % 5 === 0 ? 90 : 55); g.stroke(); if (i % 5 === 0) { g.save(); g.translate(u, 140); g.fillText(String(i), 0, 0); g.restore(); } } });
      o.th = X.group(S, 0, 1.78, 0); mg.add(o.th);
      const thm = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.75, 64, 1, true), new T.MeshPhysicalMaterial({ map: thTex, metalness: 0.75, roughness: 0.28 })); thm.rotation.z = -Math.PI / 2; thm.position.x = 0.375; thm.castShadow = true; o.th.add(thm);
      const cone = new T.Mesh(new T.CylinderGeometry(0.17, 0.125, 0.06, 64), M.chrome()); cone.rotation.z = Math.PI / 2; cone.position.x = -0.03; o.th.add(cone);
      const kn = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.3, 24), M.matte(0x30343b, 0.6)); kn.rotation.z = Math.PI / 2; kn.position.x = 0.9; o.th.add(kn);
      o.spindle = ax(X.mesh(new T.CylinderGeometry(0.075, 0.075, 1, 32), M.chrome(), mg, 0, 1.78, 0));
      o.ball = X.mesh(new T.BoxGeometry(1, 0.2, 0.2), M.brass(), mg, 0, 1.78, 0); o.fx = fx;
    },
    update(S, s, c) {
      const o = S.objs, vern = c.ins === 0; o.vg.visible = vern; o.mg.visible = !vern;
      if (vern) {
        const read = Math.round((c.L + c.z) * 10) / 10; o.sl.position.x = VX0 + read * VSC; o.obj.scale.x = c.L * VSC; o.obj.position.x = VX0 + (c.L * VSC) / 2;
        if (X.changed(S, "v" + read)) { const al = Math.round((read * 10) % 10), cv = o.vTex.image, g = cv.getContext("2d"), w = cv.width, h = cv.height; g.fillStyle = "#dfe2e6"; g.fillRect(0, 0, w, h); g.font = "bold 34px Arial"; g.textAlign = "center";
          for (let i = 0; i <= 10; i++) { const uu = (i * 0.9 * VSC / 0.93) * w + 4; g.strokeStyle = g.fillStyle = i === al || (al === 10 && i === 0) ? "#d12b1f" : "#111"; g.lineWidth = i === al ? 6 : 3; g.beginPath(); g.moveTo(uu, 0); g.lineTo(uu, i % 5 === 0 ? 64 : 42); g.stroke(); if (i % 5 === 0) g.fillText(String(i), uu, 104); } o.vTex.needsUpdate = true; }
      } else {
        const read = Math.round((c.L + c.z) * 100) / 100, kk = (0.98 * 1.7) / 26, gap = Math.min(read, 14) * kk, xa = o.fx + 0.15, xs = xa + gap;
        o.ball.position.x = xa + gap / 2; o.ball.scale.x = Math.max(0.01, gap);
        o.spindle.scale.y = o.ms0 - xs + 0.05; o.spindle.position.x = (xs + o.ms0) / 2;
        o.th.position.x = o.ms0 + gap + (6 / 2048) * 1.7; o.th.rotation.x = -((read % 0.5) / 0.5) * TAU;
      }
    },
    hud(ctx, s, c, S) { const o = S.objs; if (c.ins === 0) { X.lbl(ctx, S, V(VX0 + 0.2, 1.15, 0.25), "object (true length " + K.f(c.L, 2) + " mm)", "#ffd27a", 0, 34, 10.5); X.lbl(ctx, S, V(o.sl.position.x + 0.5, 1.68, 0.05), "vernier scale", "#e6eef8", 0, 30, 10); X.lbl(ctx, S, V(-1.0, 2.15, 0.05), "main scale", "#e6eef8", 0, -16, 10); }
      else { X.lbl(ctx, S, o.ball.position, "object", "#ffd27a", -24, -22, 10.5); X.lbl(ctx, S, V(o.ms0 + 0.6, 1.92, 0.1), "sleeve", "#e6eef8", 0, -12, 10); X.lbl(ctx, S, V(o.th.position.x + 0.4, 1.98, 0.1), "thimble", "#e6eef8", 0, -10, 10); } },
  });

  /* ---------- Timing an interval: pendulum and stopwatch ---------- */
  X.def("Timing an Interval — Stopwatch & Pendulum", {
    cam: [[0.2, 2.1, 6.6], [0.2, 1.7, 0]], shift: 70,
    build(S, s, c, mk, o) {
      stand(S, -1.0, 0, 3.6); const arm = X.mesh(new T.CylinderGeometry(0.03, 0.03, 1.2, 16), M.chrome(), S.scene, -0.9, 3.35, 0); arm.rotation.z = Math.PI / 2;
      X.mesh(new T.BoxGeometry(0.16, 0.12, 0.12), M.matte(0x30343b), S.scene, -1.45, 3.35, 0); X.mesh(new T.BoxGeometry(0.1, 0.1, 0.18), M.wood(), S.scene, -0.3, 3.32, 0);
      o.str = mk.rod(V(0, 0, 0), V(0, -1, 0), 0.007, M.matte(0xe8e2cf, 0.9)); o.bob = mk.sphere(0.12, M.brass()); o.piv = V(-0.3, 3.27, 0);
      X.mesh(new T.ConeGeometry(0.04, 0.16, 16), M.paint(0xd23a2a), S.scene, -0.3, 0.08, 0.35);
      const sw = (o.sw = X.group(S, 0.75, 2.45, 0.6)); sw.rotation.x = -0.12;
      X.mesh(new T.CylinderGeometry(0.46, 0.46, 0.14, 64), M.chrome(), sw).rotation.x = Math.PI / 2;
      const dial = mmTex(512, 512, (g, w) => { g.fillStyle = "#f7f5ef"; g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, TAU); g.fill(); g.strokeStyle = g.fillStyle = "#111"; g.textAlign = "center"; g.font = "bold 40px Arial";
        for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU, r1 = w * 0.47, r2 = i % 5 ? w * 0.43 : w * 0.39; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(w / 2 + r1 * Math.sin(a), w / 2 - r1 * Math.cos(a)); g.lineTo(w / 2 + r2 * Math.sin(a), w / 2 - r2 * Math.cos(a)); g.stroke(); if (i % 10 === 0) g.fillText(String(i || 60), w / 2 + w * 0.32 * Math.sin(a), w / 2 - w * 0.32 * Math.cos(a) + 14); } g.font = "28px Arial"; g.fillText("SECONDS", w / 2, w * 0.68); });
      X.mesh(new T.CircleGeometry(0.4, 64), new T.MeshPhysicalMaterial({ map: dial, roughness: 0.3, clearcoat: 1 }), sw, 0, 0, 0.072);
      const crys = new T.Mesh(new T.SphereGeometry(0.42, 48, 12, 0, TAU, 0, 0.5), M.glass()); crys.rotation.x = Math.PI / 2; crys.position.z = -0.29; crys.renderOrder = 3; sw.add(crys);
      o.hand = new T.Group(); o.hand.position.z = 0.08; sw.add(o.hand); X.mesh(new T.BoxGeometry(0.016, 0.38, 0.01), M.paint(0xd0261c), o.hand, 0, 0.15, 0); X.mesh(new T.CylinderGeometry(0.03, 0.03, 0.02, 20), M.chrome(), o.hand).rotation.x = Math.PI / 2;
      X.mesh(new T.CylinderGeometry(0.06, 0.06, 0.12, 20), M.chrome(), sw, 0, 0.53, 0); X.mesh(new T.TorusGeometry(0.07, 0.018, 10, 24), M.chrome(), sw, 0, 0.64, 0);
    },
    update(S, s, c) {
      const o = S.objs, Tp = TAU * Math.sqrt(c.L / K.g), th = 0.25 * Math.cos((TAU * (s.t || 0)) / Tp), Lv = 0.55 + c.L * 1.2;
      const b = V(o.piv.x + Lv * Math.sin(th), o.piv.y - Lv * Math.cos(th), 0); S.setRod(o.str, o.piv, b); o.bob.position.copy(b); o.hand.rotation.z = -((s.t || 0) / 60) * TAU; o.Tp = Tp;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.Tp) return; X.lbl(ctx, S, V(0.75, 1.9, 0.6), K.f(s.t || 0, 2) + " s", "#7fe3da", -30, 6, 14); X.lbl(ctx, S, V(-0.3, 0.1, 0.35), "fiducial mark (start timing at the centre)", "#ffd27a", -40, -26, 10); H.pill(ctx, 20, 392, "Swings counted: " + Math.floor((s.t || 0) / o.Tp) + " / " + c.n, "#e6eef8", 12); },
  });

  /* ---------- Density & relative density ---------- */
  const SOL = [["Aluminium", 2700], ["Iron", 7870], ["Brass", 8500], ["Glass", 2500], ["Hard wood", 700], ["Stone", 2600]];
  const LQ = [["Kerosene", 800, 0xe8d79a], ["Olive oil", 920, 0xb9a32a], ["Sea water", 1030, 0x4a9fc8], ["Glycerine", 1260, 0xdfe9ec], ["Mercury", 13600, 0xc8ccd4]];
  X.def("Density & Relative Density", {
    cam: [[0, 2.0, 6.4], [0, 1.25, 0]],
    build(S, s, c, mk, o) {
      const g0 = (o.g0 = X.group(S)), g1 = (o.g1 = X.group(S));
      const cyl = X.group(S, -0.9, 0, 0); g0.add(cyl); const pts = [new T.Vector2(0.001, 0), new T.Vector2(0.55, 0), new T.Vector2(0.55, 0.1), new T.Vector2(0.36, 0.12), new T.Vector2(0.36, 2.75), new T.Vector2(0.42, 2.8)];
      const gl = new T.Mesh(new T.LatheGeometry(pts, 64), M.glass()); gl.renderOrder = 3; cyl.add(gl);
      const scl = X.scaleTex(100, { w: 128, h: 1024, fg: "#f4f8ff", major: 10, fs: 30, label: (i) => (i % 20 === 0 ? String(i) : "") }); const sp = new T.Mesh(new T.PlaneGeometry(0.24, 2.5), new T.MeshBasicMaterial({ map: scl, transparent: true, depthWrite: false })); sp.position.set(-0.18, 1.37, 0.365); cyl.add(sp);
      o.w = new T.Mesh(new T.CylinderGeometry(0.345, 0.345, 1, 56), M.water(0x5aaee6)); o.w.renderOrder = 2; cyl.add(o.w); o.cyl = cyl;
      o.solid = X.mesh(new T.BoxGeometry(1, 1, 1), M.aluminium(), cyl, 0, 1, 0); o.thread = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.006, M.matte(0xeeeeee)); g0.add(o.thread);
      o.bal = balance(S, 1.0, 0.4); g0.add(o.bal);
      o.bot = [0, 1, 2].map((i) => { const b = balance(S, -1.35 + i * 1.35, 0.2); g1.add(b); const bt = X.group(S, 0, 0.26, -0.05); b.add(bt);
        const pr = [new T.Vector2(0.001, 0), new T.Vector2(0.26, 0), new T.Vector2(0.28, 0.05), new T.Vector2(0.28, 0.42), new T.Vector2(0.12, 0.62), new T.Vector2(0.08, 0.7), new T.Vector2(0.08, 0.82)];
        const gb = new T.Mesh(new T.LatheGeometry(pr, 56), M.glass()); gb.renderOrder = 3; bt.add(gb); X.mesh(new T.CylinderGeometry(0.085, 0.07, 0.12, 24), M.glass(0xdff4ff), bt, 0, 0.86, 0);
        const fill = new T.Mesh(new T.LatheGeometry(pr.map((p) => new T.Vector2(Math.max(0.001, p.x - 0.015), p.y + 0.01)), 48), M.water(0x4aa8ff)); fill.renderOrder = 2; bt.add(fill); fill.visible = i > 0; b.fill = fill; return b; });
    },
    update(S, s, c) {
      const o = S.objs, m0 = c.m === 0; o.g0.visible = m0; o.g1.visible = !m0;
      if (m0) { const [nm, rho] = SOL[c.sol], k = Math.min(1, (s.t || 0) * 1.4), V2 = 50 + c.V * k, y = (v) => 0.12 + (v / 100) * 2.5; o.w.scale.y = y(V2) - 0.12; o.w.position.y = (y(V2) + 0.12) / 2;
        const side = 0.15 + c.V * 0.0055; o.solid.scale.setScalar(side); if (X.changed(S, "s" + c.sol)) { o.solid.material = solidMat(rho); }
        const yb = 0.12 + side / 2 + (1 - k) * 2.9; o.solid.position.y = yb; S.setRod(o.thread, V(-0.9, yb + side / 2, 0), V(-0.9, 3.4, 0)); o.thread.visible = k < 1;
        o.bal.lcd.set(K.f((rho * c.V) / 1000, 1) + " g"); o.V2 = V2; o.yw = y(V2);
      } else { const [nm, rho, col] = LQ[c.liq], m1 = 25, m2 = 75, m3 = m1 + (rho * 50) / 1000; [m1, m2, m3].forEach((m, i) => o.bot[i].lcd.set(K.f(m, 1) + " g"));
        if (X.changed(S, "l" + c.liq)) o.bot[2].fill.material = c.liq === 4 ? new T.MeshPhysicalMaterial({ color: 0xd9dde3, metalness: 1, roughness: 0.1 }) : M.water(col); }
    },
    hud(ctx, s, c, S) { const o = S.objs; if (c.m === 0) { if (o.yw) X.lbl(ctx, S, V(-0.5, o.yw, 0.35), "← " + K.f(o.V2, 1) + " cm³", "#7fe3da", 6, 4); X.lbl(ctx, S, V(1.0, 0.1, 0.85), "balance: mass of solid", "#c9d6ea", -60, 26, 10); X.lbl(ctx, S, V(-0.9, 0.05, 0.6), "measuring cylinder", "#c9d6ea", -55, 26, 10); }
      else ["Empty bottle m₁", "Full of water m₂", "Full of " + LQ[c.liq][0].toLowerCase() + " m₃"].forEach((t, i) => X.lbl(ctx, S, V(-1.35 + i * 1.35, 0.02, 0.65), t, "#c9d6ea", -50, 26, 9.5)); },
  });

  /* ---------- Archimedes' principle with a spring balance ---------- */
  X.def("Archimedes' Principle — Spring Balance", {
    cam: [[-0.1, 2.3, 7.6], [-0.1, 2.0, 0]], shift: 128,
    build(S, s, c, mk, o) {
      stand(S, 1.35, -0.1, 4.0); const arm = X.mesh(new T.CylinderGeometry(0.03, 0.03, 1.5, 16), M.chrome(), S.scene, 0.17, 3.85, -0.1); arm.rotation.z = Math.PI / 2;
      const sb = X.group(S, -0.55, 3.75, 0); o.sb = sb; X.mesh(new T.CylinderGeometry(0.11, 0.11, 1.15, 32), M.aluminium(), sb, 0, -0.62, 0);
      const st = X.scaleTex(40, { w: 96, h: 512, fg: "#111", bg: "#f2efe6", major: 10, fs: 22, label: (i) => (i % 10 === 0 ? String(40 - i) : "") }); st.flipY = true;
      const face = new T.Mesh(new T.PlaneGeometry(0.13, 0.9), new T.MeshStandardMaterial({ map: st, roughness: 0.6 })); face.position.set(0, -0.62, 0.111); sb.add(face);
      X.mesh(new T.TorusGeometry(0.06, 0.015, 10, 24), M.steel(), sb, 0, 0.02, 0); o.ptr = X.mesh(new T.BoxGeometry(0.17, 0.018, 0.02), M.paint(0xd0261c), sb, 0, -0.2, 0.125);
      o.hook = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.012, M.steel()); o.str = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.006, M.matte(0xeeeeee));
      o.blk = X.mesh(new T.BoxGeometry(1, 1, 1), M.iron(), S.scene, -0.55, 1, 0);
      o.bk = mk.beaker(0.62, 1.25, 0.8, 0x4aa8ff); o.bk.position.set(-0.55, 0, 0); X.mesh(new T.CylinderGeometry(0.05, 0.05, 0.4, 16), M.glass(), S.scene, 0.25, 1.05, 0).rotation.z = Math.PI / 2.4;
      o.cat = mk.beaker(0.3, 0.55, 0.01, 0x4aa8ff); o.cat.position.set(0.55, 0, 0.45);
      o.aU = mk.arrow(0x2fd6c4); o.aW = mk.arrow(0xff5a4a);
    },
    update(S, s, c) {
      const o = S.objs, rf = [1000, 800, 1200][c.liq], Vm = c.V * 1e-6, W = c.rho * Vm * K.g, U = rf * Vm * c.d * K.g, R = W - U, side = Math.cbrt(c.V) * 0.058;
      if (X.changed(S, "a" + c.liq + (c.rho < 4000))) { o.bk.water.material = M.water([0x4aa8ff, 0xd8c070, 0x7ab8d8][c.liq]); o.cat.water.material = o.bk.water.material; o.blk.material = c.rho < 4000 ? M.aluminium() : M.iron(); }
      const ext = clampv(R / 40, 0, 1.05) * 0.8; o.ptr.position.y = -0.2 - ext; const hookY = 3.75 - 1.22 - ext * 0.15; const wl = 0.03 + 0.95;
      const yb = wl + side / 2 + 0.08 - c.d * (side + 0.08); o.blk.scale.setScalar(side); o.blk.position.y = yb;
      S.setRod(o.hook, V(-0.55, 3.75 - 1.2, 0), V(-0.55, hookY, 0)); S.setRod(o.str, V(-0.55, hookY, 0), V(-0.55, yb + side / 2, 0)); o.bk.setLevel(0.95);
      o.cat.setLevel(clampv((U / K.g) * 1000 * 0.0012, 0.005, 0.5)); const mid = V(-0.55, yb, side / 2 + 0.05);
      S.setArrow(o.aU, mid.clone().add(V(-side / 2 - 0.12, 0, 0)), V(0, U, 0), 0.03); S.setArrow(o.aW, mid.clone().add(V(side / 2 + 0.12, 0, 0)), V(0, -W, 0), 0.03); o.W = W; o.U = U; o.R = R; o.yb = yb; o.side = side;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (o.W == null) return; X.lbl(ctx, S, V(-0.55 - o.side / 2 - 0.14, o.yb + o.U * 0.03, 0.3), "U = " + K.f(o.U, 2) + " N", "#7fe3da", -86, 0); X.lbl(ctx, S, V(-0.55 + o.side / 2 + 0.14, o.yb - o.W * 0.03, 0.3), "W = " + K.f(o.W, 2) + " N", "#ff8f80", 4, 8);
      X.lbl(ctx, S, V(-0.55, 3.0, 0.15), "reads " + K.f(o.R, 2) + " N", "#ffd27a", 18, 0); X.lbl(ctx, S, V(0.55, 0.6, 0.45), "displaced " + K.f((o.U / K.g) * 1000, 0) + " g", "#c9d6ea", -40, -6, 10); },
  });

  /* ---------- U-tube manometer ---------- */
  X.def("U-tube Manometer", {
    cam: [[0, 2.0, 6.4], [0, 1.85, 0]],
    build(S, s, c, mk, o) {
      const board = X.mesh(new T.BoxGeometry(1.9, 3.4, 0.08), M.wood(), S.scene, 0, 1.85, -0.16); void board;
      const sc = X.scaleTex(60, { w: 96, h: 1024, fg: "#1a1a1a", major: 10, fs: 26, label: (i) => (i % 10 === 0 ? String((i - 30) * 5) : "") });
      const sp = new T.Mesh(new T.PlaneGeometry(0.24, 3.0), new T.MeshStandardMaterial({ map: sc, transparent: true, roughness: 0.7 })); sp.position.set(0, 1.9, -0.11); S.scene.add(sp);
      const R = 0.42, path = []; for (let y = 3.3; y > 0.62; y -= 0.3) path.push(V(-R, y, 0)); for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; path.push(V(R * Math.cos(a), 0.6 + R * Math.sin(a), 0)); } for (let y = 0.62; y < 3.31; y += 0.3) path.push(V(R, y, 0));
      const gl = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(path), 160, 0.075, 20), M.glass()); gl.renderOrder = 3; S.scene.add(gl);
      o.lm = M.water(0x4aa8ff); o.colL = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.055, o.lm, 24); o.colR = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.055, o.lm, 24);
      o.bend = new T.Mesh(new T.TorusGeometry(R, 0.055, 16, 48, Math.PI), o.lm); o.bend.rotation.z = Math.PI; o.bend.position.y = 0.6; S.scene.add(o.bend); [o.colL, o.colR, o.bend].forEach((m) => (m.renderOrder = 2));
      mk.tube([[-R, 3.3, 0], [-R, 3.65, 0.05], [-0.95, 3.75, 0.2], [-1.35, 3.2, 0.25], [-1.42, 1.2, 0.25], [-1.42, 0.75, 0.25]], 0.06, M.matte(0x8a2f1c, 0.55), 80);
      const tap = X.group(S, -1.42, 0, 0.25); X.mesh(new T.CylinderGeometry(0.16, 0.2, 0.7, 24), M.brass(), tap, 0, 0.35, 0); X.mesh(new T.BoxGeometry(0.4, 0.06, 0.08), M.paint(0xd0a020), tap, 0, 0.62, 0.12);
      o.meniL = new T.Mesh(new T.CircleGeometry(0.055, 24), M.glow(0xffffff, 0.45)); o.meniL.rotation.x = -Math.PI / 2; o.meniR = o.meniL.clone(); S.scene.add(o.meniL, o.meniR);
    },
    update(S, s, c) {
      const o = S.objs, rho = [1000, 13600, 800][c.liq], dh = (c.dp * 1000) / (rho * K.g), half = clampv(dh / 2, -1.1, 1.1), mid = 1.9, yL = mid - half, yR = mid + half;
      if (X.changed(S, "m" + c.liq)) { const m = c.liq === 1 ? new T.MeshPhysicalMaterial({ color: 0xd9dde3, metalness: 1, roughness: 0.08 }) : M.water([0x4aa8ff, 0, 0xe8d070][c.liq]); [o.colL, o.colR, o.bend].forEach((q) => (q.material = m)); }
      S.setRod(o.colL, V(-0.42, 0.6, 0), V(-0.42, yL, 0)); S.setRod(o.colR, V(0.42, 0.6, 0), V(0.42, yR, 0)); o.meniL.position.set(-0.42, yL + 0.002, 0); o.meniR.position.set(0.42, yR + 0.002, 0); o.yL = yL; o.yR = yR; o.dh = dh;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (o.yL == null) return; H.line(ctx, S, V(-0.42, o.yL, 0), V(0.75, o.yL, 0), "#ffb703", 1.2, [4, 3]); H.line(ctx, S, V(0.42, o.yR, 0), V(0.75, o.yR, 0), "#ffb703", 1.2, [4, 3]);
      H.vec(ctx, S, V(0.7, o.yL, 0), V(0.7, o.yR, 0), "#ffb703"); X.lbl(ctx, S, V(0.7, (o.yL + o.yR) / 2, 0), "Δh = " + K.f(o.dh * 100, 1) + " cm", "#ffd27a", 6, 4, 12);
      X.lbl(ctx, S, V(0.42, 3.4, 0), "open to air", "#c9d6ea", -30, -4, 10); X.lbl(ctx, S, V(-1.42, 0.75, 0.25), "gas supply", "#ff8fc7", -30, 30, 10.5); },
  });

  /* ---------- Siphon ---------- */
  const yLev = (h) => 0.31 + 0.85 * h;
  X.def("Siphon", {
    cam: [[-0.1, 2.0, 6.6], [-0.1, 1.45, 0]],
    build(S, s, c, mk, o) {
      X.mesh(new T.BoxGeometry(1.6, 0.7, 1.1), M.wood(), S.scene, -1.2, 0.35, 0); o.tA = glassBox(S, 1.4, 1.1, 0.9, -1.2, 0.7, 0); o.tB = glassBox(S, 1.5, 1.5, 0.95, 0.95, 0, 0);
      o.wA = liquid(o.tA, 1.36, 0.86, 0x3f9fd8); o.wB = liquid(o.tB, 1.46, 0.91, 0x3f9fd8); o.fl = mk.particles(40, 0.022, M.emissive(0xffffff, 1.2));
    },
    update(S, s, c) {
      const o = S.objs; if (s.hA == null) return;
      if (X.changed(S, "c" + c.crest + "d" + c.d)) {
        X.clear(S, [o.tube, o.inner]); const cy = 1.95 + Math.min(c.crest, 3) * 0.45, r = 0.03 + c.d * 0.0035, pts = [V(-0.95, 0.85, 0), V(-0.95, cy - 0.25, 0), V(-0.75, cy, 0), V(0.55, cy, 0), V(0.75, cy - 0.25, 0), V(0.75, 0.2, 0)];
        o.curve = new T.CatmullRomCurve3(pts, false, "centripetal", 0.2); o.tube = new T.Mesh(new T.TubeGeometry(o.curve, 120, r + 0.015, 16), M.glass()); o.tube.renderOrder = 3; S.scene.add(o.tube);
        o.inner = new T.Mesh(new T.TubeGeometry(o.curve, 120, r, 12), M.water(0x3f9fd8)); o.inner.renderOrder = 2; S.scene.add(o.inner); o.cy = cy;
      }
      const yA = yLev(s.hA) - 0.7, yB = yLev(s.hB); o.wA.setH(0.04, clampv(yA, 0.05, 1.08)); o.wB.setH(0.04, clampv(yB, 0.05, 1.48)); o.inner.visible = s.v > 0; o.fl.visible = s.v > 0;
      if (s.v > 0) { s.p.forEach((u, i) => { const p = o.curve.getPointAt(u); o.fl.set(i, p.x, p.y, p.z + 0.01); }); o.fl.instanceMatrix.needsUpdate = true; }
      o.yA = yA + 0.7; o.yB = yB;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (o.yA == null) return; const ok = c.crest * 1000 * K.g < 99000; X.lbl(ctx, S, V(-0.2, o.cy + 0.06, 0), "crest " + K.f(c.crest, 1) + " m above surface", ok ? "#c9d6ea" : "#ef7a6d", -80, -8, 10);
      H.line(ctx, S, V(-0.5, o.yA, 0.45), V(0.4, o.yA, 0.45), "#ffb703", 1.1, [4, 3]); H.vec(ctx, S, V(-0.15, o.yA, 0.45), V(-0.15, o.yB, 0.45), "#ffb703"); X.lbl(ctx, S, V(-0.15, (o.yA + o.yB) / 2, 0.45), "Δh " + K.f(s.hA - s.hB, 2) + " m", "#ffd27a", 6, 4, 11); },
  });

  /* ---------- Flotation: hydrometer, boat, submarine ---------- */
  const WL = 1.9;
  X.def("Flotation — Hydrometer, Boat & Submarine", {
    cam: [[0, 2.9, 7.9], [0, 1.25, 0]],
    build(S, s, c, mk, o) {
      o.tank = glassBox(S, 4.0, 2.3, 1.6, 0, 0, 0); o.liq = liquid(o.tank, 3.96, 1.56, 0x2a6ab8); o.liq.setH(0.04, WL);
      const hy = (o.hy = X.group(S)); const gm = M.glass(0xeef8ff); gm.opacity = 0.35;
      X.mesh(new T.SphereGeometry(0.24, 40, 28), gm, hy, 0, 0.13, 0).scale.y = 1.45; X.mesh(new T.SphereGeometry(0.1, 24, 16), M.matte(0x3a3d42, 0.5), hy, 0, -0.08, 0);
      const stem = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 1.35, 24), gm); stem.position.y = 0.48 + 0.675; stem.renderOrder = 4; hy.add(stem);
      const m = 0.02, Vb = 1.35e-5, A = 7e-5, stTex = (() => { const cv = document.createElement("canvas"); cv.width = 64; cv.height = 1024; const g = cv.getContext("2d"); g.fillStyle = "#f8f4e4"; g.fillRect(0, 0, 64, 1024); g.fillStyle = g.strokeStyle = "#111"; g.font = "bold 18px Arial";
        for (let r = 700; r <= 1400; r += 50) { const xx = (m / r - Vb) / A; if (xx < 0 || xx > 0.22) continue; const yy = 1024 - (xx * 5 / 1.3) * 1024; g.lineWidth = 2; g.beginPath(); g.moveTo(0, yy); g.lineTo(r % 100 ? 18 : 30, yy); g.stroke(); if (r % 100 === 0) g.fillText((r / 1000).toFixed(1), 30, yy + 6); } const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; })();
      const paper = new T.Mesh(new T.PlaneGeometry(0.075, 1.3), new T.MeshStandardMaterial({ map: stTex, roughness: 0.8 })); paper.position.set(0, 0.48 + 0.65, 0.01); hy.add(paper);
      const bt = (o.boat = X.group(S)); const sh = new T.Shape(); sh.moveTo(-1.05, 0.55); sh.lineTo(1.05, 0.55); sh.lineTo(0.85, 0); sh.lineTo(-0.85, 0); sh.closePath();
      const hull = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.8, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }), M.paint(0xb4382a)); hull.position.z = -0.4; hull.castShadow = true; bt.add(hull);
      X.mesh(new T.BoxGeometry(2.0, 0.04, 0.78), M.wood(), bt, 0, 0.53, 0); o.plim = X.mesh(new T.CircleGeometry(0.06, 24), M.paint(0xffffff), bt, 0.55, 0.3, 0.44);
      o.crates = Array.from({ length: 8 }, (_, i) => X.mesh(new T.BoxGeometry(0.4, 0.26, 0.4), M.wood(), bt, -0.66 + (i % 4) * 0.44, 0.68 + Math.floor(i / 4) * 0.27, 0));
      const sb = (o.sub = X.group(S)); const hullS = new T.Mesh(new T.CapsuleGeometry(0.28, 1.7, 12, 32), M.paint(0x3d4450)); hullS.rotation.z = Math.PI / 2; hullS.castShadow = true; sb.add(hullS);
      X.mesh(new T.BoxGeometry(0.4, 0.3, 0.2), M.paint(0x3d4450), sb, 0.1, 0.36, 0); X.mesh(new T.CylinderGeometry(0.02, 0.02, 0.3, 10), M.steel(), sb, 0.18, 0.62, 0);
      const win = new T.Mesh(new T.BoxGeometry(1.2, 0.2, 0.02), M.glass()); win.position.set(0, -0.08, 0.27); sb.add(win); o.bal = X.mesh(new T.BoxGeometry(1.18, 1, 0.01), M.water(0x4aa8ff), sb, 0, 0, 0.275);
      X.mesh(new T.ConeGeometry(0.12, 0.3, 4), M.paint(0x2a2f37), sb, -1.18, 0, 0).rotation.z = Math.PI / 2;
    },
    update(S, s, c) {
      const o = S.objs; o.hy.visible = c.o === 0; o.boat.visible = c.o === 1; o.sub.visible = c.o === 2;
      o.liq.material.color.set(c.rho > 1100 ? 0x3a7aa8 : c.rho < 900 ? 0xc8b06a : 0x2a6ab8);
      if (c.o === 0) { const x = clampv((0.02 / c.rho - 1.35e-5) / 7e-5, 0, 0.22); o.hy.position.set(0, WL - 0.48 - x * 5, 0); }
      else if (c.o === 1) { const mB = 400 + c.load * 1200, draft = mB / (c.rho * 3.0); o.boat.position.set(0, WL - draft * 0.6, 0); const n = Math.round(c.load * 8); o.crates.forEach((q, i) => (q.visible = i < n)); o.draft = draft; }
      else { o.sub.position.set(0, WL - 0.3 - (s.y || 0) * 0.38, 0); o.bal.scale.y = Math.max(0.001, 0.18 * c.load); o.bal.position.y = -0.17 + 0.09 * c.load; o.sub.rotation.z = (s.v || 0) * -0.3; }
    },
    hud(ctx, s, c, S) { const o = S.objs; if (c.o === 0) X.lbl(ctx, S, V(0.1, WL + 0.15, 0), "reads " + K.f(c.rho / 1000, 2), "#ffd27a", 10, -8, 12); else if (c.o === 1 && o.draft != null) { X.lbl(ctx, S, V(0, WL - 0.1, 0.5), "draft " + K.f(o.draft * 100, 1) + " cm", "#ffd27a", -40, 30, 11); X.lbl(ctx, S, V(0.55, o.boat.position.y + 0.3, 0.45), "Plimsoll mark", "#ff8f80", 8, -4, 9.5); }
      else if (c.o === 2) X.lbl(ctx, S, V(0, o.sub.position.y - 0.3, 0.3), "ballast tank " + Math.round(c.load * 100) + " % full", "#c9d6ea", -60, 26, 10); X.lbl(ctx, S, V(-1.95, WL, 0.8), "liquid ρ = " + c.rho + " kg/m³", "#9fd0ff", 0, -6, 10); },
  });
})();
