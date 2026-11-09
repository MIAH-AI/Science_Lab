/* p3dx-waves-a.js — photoreal 3D scenes for T17–T20 simulations in p2d-waves.js (waves, ripple tank, eclipses, mirrors, depth). */
(function () {
  "use strict";
  const X = window.PX3; if (!X || !X.ready) return;
  const T = THREE, P = window.P3D, M = P.mat, H = P.hud, V = X.V, K = window.PK, TAU = Math.PI * 2;
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const lab = (ctx, S, p, t, col, dx, dy, sz) => X.lbl(ctx, S, p, t, col, dx, dy, sz);
  /* water surface grid (displaced each frame) */
  const surface = (S, w, d, nx, nz, mat) => { const g = new T.PlaneGeometry(w, d, nx, nz); g.rotateX(-Math.PI / 2); const m = new T.Mesh(g, mat); m.receiveShadow = true; S.scene.add(m);
    m.disp = (fn) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, fn(p.getX(i), p.getZ(i))); p.needsUpdate = true; g.computeVertexNormals(); }; return m; };
  const tankMat = () => new T.MeshPhysicalMaterial({ color: 0x2a7fb8, roughness: 0.06, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6 });

  /* ---------- Slinky & rope ---------- */
  const wx = (px) => (px - 320) * 0.0105;
  X.def("Mechanical Waves — Slinky & Rope", {
    cam: [[0, 2.0, 6.6], [0, 1.25, 0]], shift: [0, -26], hudOpt0: { bgAll: 1 },
    build(S, s, c, mk, o) {
      o.hand = X.mesh(new T.BoxGeometry(0.25, 0.8, 0.3), M.wood(), S.scene, wx(27), 1.25, 0); X.mesh(new T.BoxGeometry(0.3, 0.6, 0.6), M.matte(0x2a2f37), S.scene, wx(615), 1.25, 0);
      o.ring = new T.InstancedMesh(new T.TorusGeometry(0.22, 0.012, 6, 28), M.steel(), 61); o.ring.castShadow = true; S.scene.add(o.ring); o.marker = mk.sphere(0.05, M.emissive(0xff4a3a, 1.4)); o.mtx = new T.Matrix4(); o.q = new T.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI / 2);
      o.ar = mk.arrow(0xffb703, 0.04, 0.14); S.setArrow(o.ar, V(wx(60), 0.12, 0.6), V(1, 0, 0), wx(580) - wx(60));
    },
    update(S, s, c) {
      const o = S.objs, t = s.t || 0, N = 60, src = (tt) => (c.m === 2 ? Math.sin(TAU * c.f * tt) : tt > 0 && tt < 1 / c.f / 2 ? Math.sin(TAU * c.f * tt) : 0), pts = [];
      for (let i = 0; i <= N; i++) { const x0 = 40 + (i * 560) / N; pts.push([x0, src(t - (x0 - 40) / c.v)]); }
      o.hand.position.y = 1.25 + (c.m === 0 ? src(t) * 0.6 : 0); o.hand.position.x = wx(27) + (c.m > 0 ? src(t) * 0.14 : 0);
      if (c.m === 0) { o.ring.visible = false; X.clear(S, [o.rope]); o.rope = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(([x, d]) => V(wx(x), 1.25 + d * 0.6, 0))), 120, 0.035, 10), M.matte(0xd8b46a, 0.85)); o.rope.castShadow = true; S.scene.add(o.rope); o.marker.position.set(wx(pts[30][0]), 1.25 + pts[30][1] * 0.6, 0.04); }
      else { if (o.rope) o.rope = X.clear(S, [o.rope])[0]; o.ring.visible = true; pts.forEach(([x0, d], i) => { o.mtx.compose(V(wx(x0) + d * 0.14, 1.25, 0), o.q, V(1, 1, 1)); o.ring.setMatrixAt(i, o.mtx); }); o.ring.instanceMatrix.needsUpdate = true; o.marker.position.set(wx(pts[30][0]) + pts[30][1] * 0.14, 1.25 + 0.24, 0); }
    },
    hud(ctx, s, c, S) { const o = S.objs; lab(ctx, S, V(0, 0.12, 0.6), "direction of energy transfer", "#ffd27a", -90, 22, 11); lab(ctx, S, o.marker.position, c.m === 0 ? "red marker only moves up and down" : "red coil only moves back and forth", "#ff8f80", -100, 50, 10); },
  });

  /* ---------- Wave equation: vibrating string + tucked graphs ---------- */
  X.def("Wave Equation y = A sin(ωt − kx)", {
    cam: [[0, 1.6, 6.4], [0, 1.6, 0]], shift: [100, 0],
    hudOpt0: { bg: 1, place: (r) => (r[0] > 440 ? null : r[1] < 200 ? X.fit(r, 4, 4, 300, 128) : X.fit(r, 4, 286, 300, 110)) },
    build(S, s, c, mk, o) { const cv = document.createElement("canvas"); cv.width = 1200; cv.height = 400; const g = cv.getContext("2d"); g.fillStyle = "#f3f1ea"; g.fillRect(0, 0, 1200, 400); g.strokeStyle = "rgba(40,90,160,.25)"; for (let x = 0; x <= 1200; x += 25) { g.lineWidth = x % 100 ? 1 : 2.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 400); g.stroke(); } for (let y = 0; y <= 400; y += 25) { g.lineWidth = (y - 200) % 100 ? 1 : 2.5; g.beginPath(); g.moveTo(0, y); g.lineTo(1200, y); g.stroke(); } g.fillStyle = "#335"; g.font = "bold 22px Arial"; for (let k = 0; k <= 12; k++) g.fillText(String(k), k * 100 + 3, 222);
      const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; X.mesh(new T.BoxGeometry(4.9, 1.65, 0.04), [M.wood(), M.wood(), M.wood(), M.wood(), new T.MeshStandardMaterial({ map: t, roughness: 0.8 }), M.wood()], S.scene, 0, 1.6, -0.12);
      X.mesh(new T.BoxGeometry(0.3, 0.5, 0.4), M.matte(0x2a2f37, 0.4), S.scene, -2.6, 1.6, 0); o.bead = mk.sphere(0.07, M.emissive(0xff4a3a, 1.3)); },
    update(S, s, c) { const o = S.objs, t = s.t || 0, y = (x) => c.A * Math.sin(TAU * c.f * t - (TAU * x) / c.lam), X0 = (x) => -2.4 + x * 0.4, Y0 = (v) => 1.6 + v * 0.22; const pts = []; for (let i = 0; i <= 96; i++) { const x = (12 * i) / 96; pts.push(V(X0(x), Y0(y(x)), 0.02)); }
      X.clear(S, [o.str]); o.str = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, 0.022, 8), M.plastic(0x1fb5a5, 0.3)); o.str.castShadow = true; S.scene.add(o.str); o.bead.position.set(X0(c.x), Y0(y(c.x)), 0.05); },
    hud(ctx, s, c, S) { lab(ctx, S, S.objs.bead.position, "watch point x = " + c.x + " cm", "#ff8f80", 10, -10, 10); },
  });

  /* ---------- Ripple tank ---------- */
  const rx = (px) => (px - 320) * 0.008, rz = (py) => (py - 200) * 0.008;
  X.def("Ripple Tank — Reflection & Refraction", {
    cam: [[0, 4.2, 3.9], [0, 0.4, 0.15]], shift: 0, envI: 0.75,
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(5.1, 0.35, 3.1), M.matte(0x22262d, 0.4), S.scene, 0, 0.17, 0); o.w = surface(S, 4.8, 2.88, 150, 90, tankMat()); o.w.position.y = 0.42;
      o.bar = X.mesh(new T.BoxGeometry(0.06, 0.12, 2.88), M.steel(), S.scene, 0, 0.45, 0); o.plate = X.mesh(new T.BoxGeometry(2.4, 0.02, 2.88), M.glass(0xffffff), S.scene, 1.2, 0.38, 0); o.dip = X.mesh(new T.SphereGeometry(0.05, 20, 12), M.matte(0xff4a3a, 0.4), S.scene, 0, 0.46, 0); },
    update(S, s, c) { const o = S.objs, t = s.t || 0, lam = 34, kk = TAU / lam, th = rad(c.th), ph = t * 60 * kk, A = 0.018; o.bar.visible = c.m < 2; o.plate.visible = c.m === 2; o.dip.visible = c.m === 1;
      const toP = (x, z) => [x / 0.008 + 320, z / 0.008 + 200];
      if (c.m === 0) { const bx = 420; o.bar.position.x = rx(bx); o.w.disp((x, z) => { const [px, py] = toP(x, z); if (px > bx) return 0; const inc = Math.cos(kk * (px * Math.cos(th) + py * Math.sin(th)) - ph), ref = Math.cos(kk * ((2 * bx - px) * Math.cos(th) + py * Math.sin(th)) - ph); return A * (inc + ref) * 0.6; }); }
      else if (c.m === 1) { const bx = 450, sx = 260, sy = 200; o.bar.position.x = rx(bx); o.dip.position.set(rx(sx), 0.46, rz(sy)); o.w.disp((x, z) => { const [px, py] = toP(x, z); if (px > bx) return 0; const r1 = Math.hypot(px - sx, py - sy) + 4, r2 = Math.hypot(px - 2 * bx + sx, py - sy) + 4; return A * 2.2 * (Math.cos(kk * r1 - ph) / Math.sqrt(r1 / 30) + Math.cos(kk * r2 - ph) / Math.sqrt(r2 / 30)) * 0.5; }); }
      else { const bx = 320, sR = Math.asin(clampv(Math.sin(th) * c.r, -1, 1)), k1 = kk, k2 = k1 / c.r, wt = t * 6; o.sR = sR; o.w.disp((x, z) => { const [px, py] = toP(x, z), p2 = px < bx ? k1 * (px * Math.cos(th) + py * Math.sin(th)) : k1 * (bx * Math.cos(th) + py * Math.sin(th)) + k2 * ((px - bx) * Math.cos(sR)) + (k2 * Math.sin(sR) - k1 * Math.sin(th)) * py; return A * (px < bx ? 1 : 0.7) * Math.cos(p2 - wt); }); } },
    hud(ctx, s, c, S) { if (c.m === 0) H.pill(ctx, 14, 390, "angle of incidence = angle of reflection = " + c.th + "°", "#e6eef8", 10.5); else if (c.m === 1) { lab(ctx, S, V(rx(2 * 450 - 260), 0.5, 0), "image source (behind barrier)", "#ffd27a", -90, -14, 10); H.pill(ctx, 14, 390, "reflected waves appear to come from an image behind the barrier", "#e6eef8", 10.5); }
      else { lab(ctx, S, V(1.2, 0.45, -1.3), "shallow water (glass plate)", "#e6eef8", -60, -6, 10); lab(ctx, S, V(-1.2, 0.45, -1.3), "deep water", "#e6eef8", -40, -6, 10); H.pill(ctx, 14, 390, "refracted angle " + K.f(deg(S.objs.sR || 0), 1) + "° · wavelength ×" + c.r + " · frequency unchanged", "#e6eef8", 10.5); } },
  });

  /* ---------- Two-source interference ---------- */
  X.def("Interference from Two Sources", {
    cam: [[0, 4.8, 3.6], [-0.2, 0.4, 0.1]], shift: 75, envI: 0.75,
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(4.2, 0.35, 3.6), M.matte(0x22262d, 0.4), S.scene, 0, 0.17, 0); o.w = surface(S, 4.0, 3.42, 130, 110, tankMat()); o.w.position.y = 0.42; o.w.geometry.setAttribute("color", new T.BufferAttribute(new Float32Array(o.w.geometry.attributes.position.count * 3).fill(1), 3));
      o.p1 = mk.sphere(0.05, M.matte(0xff4a3a, 0.4)); o.p2 = mk.sphere(0.05, M.matte(0xff4a3a, 0.4)); o.bar = X.mesh(new T.BoxGeometry(0.06, 0.06, 1), M.steel(), S.scene, -1.75, 0.62, 0); },
    update(S, s, c) { const o = S.objs, t = s.t || 0, k = TAU / c.lam, sc = 0.0095, toP = (x, z) => [x / sc + 230, z / sc + 200], s1 = [50, 200 - c.d / 2], s2 = [50, 200 + c.d / 2], col = o.w.geometry.attributes.color, pos = o.w.geometry.attributes.position, inst = c.view === 0;
      o.p1.position.set((s1[0] - 230) * sc, 0.46, (s1[1] - 200) * sc); o.p2.position.set((s2[0] - 230) * sc, 0.46, (s2[1] - 200) * sc); o.bar.scale.z = c.d * sc + 0.1;
      o.w.material.vertexColors = !inst; o.w.material.needsUpdate = o.w.material.vertexColors !== o.vc; o.vc = o.w.material.vertexColors;
      o.w.disp((x, z) => { const [px, py] = toP(x, z), r1 = Math.hypot(px - s1[0], py - s1[1]) + 3, r2 = Math.hypot(px - s2[0], py - s2[1]) + 3; return inst ? 0.012 * (Math.sin(k * r1 - 3 * t) + Math.sin(k * r2 - 3 * t)) : 0; });
      if (!inst) for (let i = 0; i < pos.count; i++) { const [px, py] = toP(pos.getX(i), pos.getZ(i)), r1 = Math.hypot(px - s1[0], py - s1[1]), r2 = Math.hypot(px - s2[0], py - s2[1]), v = Math.abs(Math.cos((k * (r1 - r2)) / 2)); col.setXYZ(i, 0.15 + 0.85 * v, 0.3 + 0.7 * v, 0.45 + 0.55 * v); } col.needsUpdate = true; },
    hud(ctx, s, c, S) { lab(ctx, S, S.objs.p1.position, "coherent sources (two prongs of one dipper)", "#ff8f80", 6, -16, 10); },
  });

  /* ---------- Eclipses ---------- */
  const ex = (px) => (px - 320) * 0.012, ey = (py) => (200 - py) * 0.012;
  X.def("Eclipses — Umbra & Penumbra", {
    env: "space", cam: [[0.2, 1.4, 9.2], [0.1, 0, 0]], shift: 0, fov: 34,
    build(S, s, c, mk, o) {
      mk.sphere(55 * 0.012, new T.MeshBasicMaterial({ color: 0xffe07a })).position.set(ex(70), ey(200), 0); mk.soft(0xffd27a, 2.6, ex(70), ey(200), 0, 0.75); const pl = new T.PointLight(0xfff2dc, 60, 40, 1.4); pl.position.set(ex(70), ey(200), 0); pl.castShadow = true; pl.shadow.mapSize.set(1024, 1024); S.scene.add(pl);
      const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256; const g = cv.getContext("2d"); g.fillStyle = "#1d58a8"; g.fillRect(0, 0, 512, 256); const r = K.rnd(8); g.fillStyle = "#3f8a3a"; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(r() * 512, 40 + r() * 176, 20 + r() * 50, 10 + r() * 30, r() * 3, 0, TAU); g.fill(); } g.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse(r() * 512, r() * 256, 10 + r() * 40, 3 + r() * 8, 0, 0, TAU); g.fill(); }
      const et = new T.CanvasTexture(cv); et.colorSpace = T.SRGBColorSpace; o.earth = X.mesh(new T.SphereGeometry(34 * 0.012, 64, 40), new T.MeshStandardMaterial({ map: et, roughness: 0.7 }), S.scene, ex(500), ey(200), 0); o.moon = X.mesh(new T.SphereGeometry(12 * 0.012, 40, 28), M.matte(0xbfc3c8, 0.95), S.scene);
      o.pen = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 48, 1, true), new T.MeshBasicMaterial({ color: 0x5a6a8a, transparent: true, opacity: 0.16, depthWrite: false, side: T.DoubleSide })); o.um = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 48, 1, true), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false, side: T.DoubleSide })); o.pen.renderOrder = 5; o.um.renderOrder = 6; S.scene.add(o.pen, o.um);
    },
    update(S, s, c) {
      const o = S.objs, Sx = 70, Rs = 55, E = [500, 200], Re = 34, mr = c.m === 0 ? 150 : 90, ang = rad(c.a + (c.m === 0 ? 180 : 0)), Mn = [E[0] + mr * Math.cos(ang), E[1] + mr * Math.sin(ang)], Rm = 12; o.moon.position.set(ex(Mn[0]), ey(Mn[1]), 0); o.earth.rotation.y += 0.002;
      const [O, Ro] = c.m === 0 ? [Mn, Rm] : [E, Re], d = O[0] - Sx, L = 640 - O[0], ku = (Rs - Ro) / d, kp = (Rs + Ro) / d, cone = (m, r0, r1, rot) => { m.geometry.dispose(); m.geometry = new T.CylinderGeometry(Math.max(0.001, r1 * 0.012), r0 * 0.012, L * 0.012, 48, 1, true); m.position.set(ex(O[0] + L / 2), ey(O[1]), 0); m.rotation.set(0, 0, -Math.PI / 2 + rot); };
      const tilt = Math.atan2(-(O[1] - 200), d) * 0; cone(o.um, Ro, Math.max(0, Ro - ku * L), tilt); cone(o.pen, Ro, Ro + kp * L, tilt); o.moon.castShadow = c.m === 0; o.earth.castShadow = c.m === 1; o.earth.receiveShadow = true; o.moon.receiveShadow = true; o.Mn = Mn;
      const T2 = c.m === 0 ? E : Mn, Rt = c.m === 0 ? Re : Rm, off = T2[1] - O[1] - (T2[0] - O[0]) * ((O[1] - 200) / d), ur = Ro - ku * (T2[0] - O[0]), pr = Ro + kp * (T2[0] - O[0]), beyond = T2[0] > O[0];
      o.res = !beyond ? "No eclipse — Moon out of line" : Math.abs(off) < Math.max(0, ur) + Rt ? (c.m === 0 ? "Total eclipse for places in the umbra; partial in the penumbra" : "Total lunar eclipse — Moon in Earth's umbra (looks red)") : Math.abs(off) < pr + Rt ? (c.m === 0 ? "Partial solar eclipse" : "Partial / penumbral lunar eclipse") : "No eclipse — Moon out of line";
      o.moon.material.color.set(c.m === 1 && /Total/.test(o.res) ? 0xb0503a : 0xbfc3c8);
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.res) return; H.pill(ctx, 320, 30, o.res, "#ffd27a", 12, "center"); lab(ctx, S, V(ex(70), ey(270), 0), "Sun (luminous)", "#ffd84a", -40, 10, 10.5); lab(ctx, S, o.earth.position, "Earth", "#9fc6ff", 24, -16, 10); lab(ctx, S, o.moon.position, "Moon", "#e6eef8", 10, -10, 10);
      lab(ctx, S, V(ex(610), ey(200), 0), "umbra", "#c9d6ea", -10, 4, 9.5); H.pill(ctx, 320, 392, "Moon and Earth are non-luminous: seen by reflected sunlight. Not to scale.", "#93aac4", 9.5, "center"); },
  });

  /* ---------- Inclined plane mirrors ---------- */
  X.def("Inclined Plane Mirrors & Kaleidoscope", {
    cam: [[0.4, 5.2, 2.6], [0.5, 0.0, -0.4]], shift: 110,
    build(S, s, c, mk, o) { o.m1 = X.group(S); o.m2 = X.group(S); [o.m1, o.m2].forEach((g) => { X.mesh(new T.BoxGeometry(2.4, 1.0, 0.03), new T.MeshPhysicalMaterial({ color: 0xe8eef4, metalness: 1, roughness: 0.03 }), g, 1.2, 0.5, 0); X.mesh(new T.BoxGeometry(2.44, 1.04, 0.02), M.matte(0x20242a), g, 1.2, 0.5, -0.03); });
      o.obj = X.group(S); X.mesh(new T.CylinderGeometry(0.07, 0.07, 0.4, 24), M.ceramic(0xf6efe0), o.obj, 0, 0.2, 0); const fl = mk.soft(0xffb040, 0.35, 0, 0.47, 0, 0.75); o.obj.add(fl); X.mesh(new T.ConeGeometry(0.03, 0.09, 12), M.emissive(0xffb040, 2), o.obj, 0, 0.46, 0);
      o.imgs = Array.from({ length: 12 }, () => { const g = X.group(S); const m = new T.MeshStandardMaterial({ color: 0xffb703, transparent: true, opacity: 0.4, emissive: 0x7a4a00, emissiveIntensity: 0.6 }); X.mesh(new T.CylinderGeometry(0.07, 0.07, 0.4, 20), m, g, 0, 0.2, 0).castShadow = false; X.mesh(new T.ConeGeometry(0.03, 0.09, 10), M.emissive(0xffb040, 1.2), g, 0, 0.46, 0); return g; }); },
    update(S, s, c) {
      const o = S.objs, th = rad(c.th); o.m1.rotation.y = 0; o.m2.rotation.y = th; o.m1.position.set(0, 0, 0); o.m2.position.set(0, 0, 0);
      const ob = Math.min(rad(c.a), th * 0.9), r0 = 1.1, n = Math.round(360 / c.th) - 1, refl = (a, m) => 2 * m - a; let A = [ob], B = [ob]; const seen = [];
      for (let k = 0; k < 12; k++) { A = A.map((a) => (k % 2 === 0 ? refl(a, 0) : refl(a, -th))); B = B.map((a) => (k % 2 === 0 ? refl(a, -th) : refl(a, 0))); [A[0], B[0]].forEach((a) => { const aa = ((a % TAU) + TAU) % TAU; if (!seen.some((q) => Math.abs(q - aa) < 0.02) && Math.abs(aa - ((ob + TAU) % TAU)) > 0.02) seen.push(aa); }); }
      const P2 = (a) => V(r0 * Math.cos(-a), 0.02, r0 * Math.sin(-a)); o.obj.position.copy(P2(ob)); o.imgs.forEach((g, i) => { g.visible = i < Math.max(0, n) && i < seen.length; if (g.visible) g.position.copy(P2(seen[i])); }); o.n = n;
    },
    hud(ctx, s, c, S) { const o = S.objs; lab(ctx, S, o.obj.position.clone().add(V(0, 0.5, 0)), "object (candle)", "#ff8f80", 8, -6, 10); H.pill(ctx, 14, 26, "images (amber ghosts) lie on a circle about the hinge · n = 360/θ − 1 = " + K.f(360 / c.th - 1, 1), "#ffd27a", 10.5); },
  });

  /* ---------- Real & apparent depth ---------- */
  X.def("Real & Apparent Depth", {
    cam: [[0.3, 2.8, 9.2], [0.25, 2.15, 0]], shift: 112,
    build(S, s, c, mk, o) { o.tank = new T.Mesh(new T.BoxGeometry(2.6, 3.1, 1.2), M.glass()); o.tank.renderOrder = 3; S.scene.add(o.tank); o.liq = new T.Mesh(new T.BoxGeometry(2.56, 1, 1.16), M.water(0x2a6ab8)); o.liq.renderOrder = 2; S.scene.add(o.liq);
      o.coin = X.mesh(new T.CylinderGeometry(0.13, 0.13, 0.02, 40), M.gold(), S.scene, 0, 0.03, 0); o.img = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.02, 40), new T.MeshBasicMaterial({ color: 0xffb703, transparent: true, opacity: 0.45, depthWrite: false })); S.scene.add(o.img);
      o.b = [0, 1, 2, 3].map(() => mk.beam(V(0, 0, 0), V(0, 1, 0), 0x7fe3da, 0.012)); o.v = [0, 1].map(() => mk.beam(V(0, 0, 0), V(0, 1, 0), 0xffb703, 0.008));
      const eye = (o.eye = X.group(S)); X.mesh(new T.SphereGeometry(0.16, 32, 24), M.ceramic(0xf4f4f4), eye); X.mesh(new T.SphereGeometry(0.07, 24, 16), M.plastic(0x3a6a3a, 0.2), eye, 0, -0.1, 0.08); X.mesh(new T.SphereGeometry(0.035, 16, 12), M.matte(0x050505), eye, 0, -0.14, 0.1); },
    update(S, s, c) {
      const o = S.objs, n = [1.33, 1.44, 1.5][c.liq], sc = 0.045, by = 0.05, top = by + c.D * sc, cx = 0; o.tank.position.set(0, 1.55, 0); o.liq.scale.y = top - 0.04; o.liq.position.y = (top + 0.04) / 2; o.liq.material.color.set([0x2a6ab8, 0xc8b06a, 0x9fd8e8][c.liq]);
      o.coin.position.set(cx, by, 0); const app = c.D / n, ay = top - app * sc; o.img.position.set(cx, ay, 0);
      [-1, 1].forEach((sg, j) => { const r = rad(c.v + sg * 3), i = Math.asin(Math.sin(r) / n), xs = cx + (top - by) * Math.tan(i), out = V(xs + 1.6 * Math.sin(r), top + 1.6 * Math.cos(r), 0); S.setBeam(o.b[j * 2], V(cx, by, 0), V(xs, top, 0)); S.setBeam(o.b[j * 2 + 1], V(xs, top, 0), out); S.setBeam(o.v[j], V(xs, top, 0), V(cx, ay, 0)); });
      const r = rad(c.v); o.eye.position.set(1.75 * Math.sin(r) + 0.15, top + 1.75 * Math.cos(r), 0); o.top = top; o.app = app; o.ay = ay;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (o.top == null) return; lab(ctx, S, V(-1.25, 0.2, 0.6), "real " + c.D + " cm", "#e6eef8", 0, 4, 10.5); lab(ctx, S, V(-1.25, o.ay, 0.6), "apparent " + K.f(o.app, 1) + " cm", "#ffd27a", 0, 4, 10.5); lab(ctx, S, o.eye.position, "eye", "#c9d6ea", 14, -8, 10); },
  });
})();
