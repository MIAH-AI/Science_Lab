/* p3dx-modern.js — photoreal 3D scenes for T29, T30, H4 and H8 simulations in p2d-modern.js. */
(function () {
  "use strict";
  const X = window.PX3; if (!X || !X.ready) return;
  const T = THREE, P = window.P3D, M = P.mat, H = P.hud, V = X.V, K = window.PK, TAU = Math.PI * 2;
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v));
  const lab = (ctx, S, p, t, col, dx, dy, sz) => X.lbl(ctx, S, p, t, col, dx, dy, sz);
  const nucleus = (S, n, rmax) => { const im = new T.InstancedMesh(new T.SphereGeometry(1, 20, 14), new T.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.8 }), n); im.castShadow = true; S.scene.add(im); im.fill = (Z, A, R, cx = 0, cy = 0, cz = 0, seed = 1) => { const r = K.rnd(seed), m = new T.Matrix4(), col = new T.Color(), rn = Math.min(0.12, R * 0.45 / Math.cbrt(Math.max(1, A)) * 1.25), order = Array.from({ length: A }, (_, i) => i < Z).sort(() => r() - 0.5);
      for (let i = 0; i < n; i++) { if (i < A) { const k = i + 0.5, ph = Math.acos(1 - (2 * k) / A), th = Math.PI * (1 + Math.sqrt(5)) * k, rr = R * Math.cbrt((i + 1) / A); m.makeScale(rn, rn, rn); m.setPosition(cx + rr * Math.sin(ph) * Math.cos(th), cy + rr * Math.cos(ph), cz + rr * Math.sin(ph) * Math.sin(th)); im.setColorAt(i, col.set(order[i] ? 0xe0402f : 0x9aa0a8)); } else m.makeScale(0, 0, 0); im.setMatrixAt(i, m); } im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }; return im; };

  /* ---------- Rutherford scattering & atomic models ---------- */
  const rx = (px) => (px - 320) * 0.009, ry = (py) => 1.6 + (200 - py) * 0.009;
  X.def("Models of the Atom — Rutherford Scattering", {
    env: "dark", envOpts: { w: 12, d: 8 }, cam: [[0.4, 2.2, 6.8], [0.0, 1.6, 0]], shift: [0, 0],
    build(S, s, c, mk, o) { const foil = new T.Mesh(new T.BoxGeometry(0.02, 2.9, 1.2), new T.MeshPhysicalMaterial({ color: 0xf2c21a, metalness: 1, roughness: 0.2, transparent: true, opacity: 0.35, depthWrite: false })); foil.position.set(0, 1.6, 0); S.scene.add(foil);
      const src = X.group(S, rx(20), ry(200), 0); X.mesh(new T.BoxGeometry(0.3, 0.4, 0.4), M.matte(0x4a4d55, 0.5), src); const scr = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 1.2, 64, 1, true, Math.PI * 0.1, Math.PI * 1.6), new T.MeshStandardMaterial({ color: 0x0c1a10, emissive: 0x1a5a2a, emissiveIntensity: 0.35, side: T.DoubleSide, transparent: true, opacity: 0.5 })); scr.position.set(0, 1.6, 0); scr.rotation.x = Math.PI / 2; void scr;
      o.al = mk.particles(120, 0.045, M.emissive(0xffb703, 1.6)); o.mods = [0, 1, 2, 3].map(() => X.group(S, 0, 1.6, 0));
      X.mesh(new T.SphereGeometry(0.55, 40, 28), new T.MeshPhysicalMaterial({ color: 0xff7a6a, transparent: true, opacity: 0.35, roughness: 0.3, depthWrite: false }), o.mods[0]); for (let i = 0; i < 9; i++) X.mesh(new T.SphereGeometry(0.05, 16, 12), M.emissive(0x4a8aff, 1.2), o.mods[0], ((i % 3) - 1) * 0.25, (Math.floor(i / 3) - 1) * 0.25, ((i * 7) % 3 - 1) * 0.15);
      X.mesh(new T.SphereGeometry(0.05, 16, 12), M.emissive(0xff4a3a, 1.5), o.mods[1]); X.mesh(new T.SphereGeometry(0.63, 32, 20), new T.MeshBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.06, wireframe: true }), o.mods[1]);
      X.mesh(new T.SphereGeometry(0.06, 16, 12), M.emissive(0xff4a3a, 1.5), o.mods[2]); o.orb = [0.27, 0.5, 0.72].map((r) => { X.mesh(new T.TorusGeometry(r, 0.006, 6, 64), M.glow(0x7fe3da, 0.6), o.mods[2]); return { r, e: X.mesh(new T.SphereGeometry(0.04, 12, 10), M.emissive(0x4a8aff, 1.4), o.mods[2]) }; });
      const cl = mk.particles(400, 0.012, M.emissive(0x7cb3ff, 0.8)); o.mods[3].add(cl); const r = K.rnd(5); for (let i = 0; i < 400; i++) { const rr = -Math.log(r() + 1e-6) * 0.2, u = r() * 2 - 1, a = r() * TAU, q = Math.sqrt(1 - u * u); cl.set(i, rr * q * Math.cos(a), rr * u, rr * q * Math.sin(a)); } cl.instanceMatrix.needsUpdate = true; X.mesh(new T.SphereGeometry(0.045, 16, 12), M.emissive(0xff4a3a, 1.5), o.mods[3]); },
    update(S, s, c) { const o = S.objs, t = S.t || 0; o.mods.forEach((g, i) => (g.visible = i === c.m)); if (c.m === 2) o.orb.forEach((q, i) => { const a = t * (2.2 - i * 0.6); q.e.position.set(q.r * Math.cos(a), q.r * Math.sin(a), 0); }); o.mods[3].rotation.y = t * 0.2;
      const p = s.p || []; for (let i = 0; i < 120; i++) { const q = p[i]; if (q) o.al.set(i, rx(q.x), ry(q.y), 0); else o.al.set(i, 0, -9, 0); } o.al.instanceMatrix.needsUpdate = true; },
    hud(ctx, s, c, S) { lab(ctx, S, V(0, 3.1, 0), "gold foil", "#f2c21a", -24, -4, 10); lab(ctx, S, V(rx(20), ry(220), 0), "α source", "#c9d6ea", -24, 18, 10); lab(ctx, S, V(0, 0.95, 0.3), ["Thomson: plum pudding", "Rutherford: tiny dense nucleus", "Bohr: energy levels n = 1, 2, 3", "electron cloud (orbitals)"][c.m], "#ffd27a", -60, 18, 10); },
  });

  /* ---------- Thermionic emission ---------- */
  const tx = (px) => (px - 330) * 0.009, ty = (py) => 1.55 + (200 - py) * 0.009;
  X.def("Thermionic Emission — Diode Valve & CRO", {
    env: "dark", envOpts: { w: 12, d: 8 }, cam: [[0.2, 2.2, 5.6], [0.1, 1.45, 0]], shift: [0, 50],
    build(S, s, c, mk, o) { o.env = new T.Mesh(new T.SphereGeometry(1, 48, 32), M.glass()); o.env.renderOrder = 3; S.scene.add(o.env); X.mesh(new T.CylinderGeometry(0.5, 0.6, 0.3, 32), M.matte(0x1a1a1a, 0.5), S.scene, tx(260), 0.15, 0);
      o.cat = X.mesh(new T.BoxGeometry(0.16, 0.9, 0.16), new T.MeshStandardMaterial({ color: 0x552211, emissive: 0xff6a20, emissiveIntensity: 0.2 }), S.scene, tx(110), ty(200), 0); o.cg = mk.soft(0xff8a3a, 0.8, tx(110), ty(200), 0, 0.5);
      o.an = X.mesh(new T.BoxGeometry(0.12, 1.1, 0.6), M.steel(), S.scene, tx(407), ty(200), 0); o.crt = X.group(S); [205, 233].forEach((px) => X.mesh(new T.CylinderGeometry(0.2, 0.2, 0.09, 32, 1, true), M.steel(), o.crt, tx(px), ty(200), 0).rotation.z = Math.PI / 2); [150, 250].forEach((py) => X.mesh(new T.BoxGeometry(0.55, 0.02, 0.4), M.steel(), o.crt, tx(330), ty(py), 0));
      o.scr = X.mesh(new T.CylinderGeometry(0.9, 0.9, 0.04, 48), new T.MeshStandardMaterial({ color: 0x0b2a14, emissive: 0x2a8a3a, emissiveIntensity: 0.3 }), o.crt, tx(624), ty(200), 0); o.scr.rotation.z = Math.PI / 2; o.spot = mk.soft(0x7dff9a, 0.4, tx(622), ty(200), 0, 0.8); o.crt.add(o.spot); o.e = mk.particles(200, 0.022, M.emissive(0x5a9aff, 1.6)); },
    update(S, s, c) { const o = S.objs, crt = c.m === 1, glow = clampv((c.Th - 800) / 1700, 0, 1), em = Math.exp(30160 * (1 / 2000 - 1 / c.Th)), I = c.Va > 0 ? Math.min(em * 2, Math.pow(c.Va, 1.5) * 0.02) : 0;
      if (X.changed(S, "m" + c.m)) { o.env.position.set(tx(crt ? 340 : 260), ty(200), 0); o.env.scale.set(crt ? 2.65 : 1.75, 1.0, 0.9); } o.an.visible = !crt; o.crt.visible = crt; o.cat.material.emissiveIntensity = 0.2 + glow * 2.2; o.cg.material.opacity = 0.15 + glow * 0.65; o.spot.material.opacity = clampv(I / 3, 0, 0.85);
      const p = s.p || []; for (let i = 0; i < 200; i++) { const q = p[i]; if (q) o.e.set(i, tx(q.x), ty(crt ? 200 + (q.y - 200) * Math.max(0.05, 1 - (q.x - 120) / 500) : q.y), 0); else o.e.set(i, 0, -9, 0); } o.e.instanceMatrix.needsUpdate = true; },
    hud(ctx, s, c, S) { lab(ctx, S, V(tx(110), ty(270), 0), "hot cathode (−)", "#ffb07a", -50, 10, 10); if (c.m === 0) lab(ctx, S, V(tx(407), ty(270), 0), "anode (" + (c.Va >= 0 ? "+" : "") + c.Va + " V)", "#c9d6ea", -40, 10, 10); else lab(ctx, S, V(tx(620), ty(110), 0), "fluorescent screen", "#7dff9a", -60, -6, 10); lab(ctx, S, V(tx(260), ty(95), 0), "vacuum", "#93aac4", -20, -4, 10); },
  });

  /* ---------- Nuclide builder ---------- */
  const EL = ["", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn"];
  X.def("Nuclide Builder — A, Z, N and Isotopes", {
    env: "dark", envOpts: { w: 12, d: 8 }, cam: [[0.2, 1.9, 5.2], [0.1, 1.5, 0]], shift: 112,
    build(S, s, c, mk, o) { o.nuc = nucleus(S, 70, 0.6); o.plaque = X.screen(S.scene, 1.0, 1.0, { pw: 256, bg: "#141a24", fg: "#ffd27a", glow: 0.6 }); o.plaque.position.set(1.6, 1.5, 0); X.mesh(new T.BoxGeometry(1.1, 1.1, 0.06), M.brass(), S.scene, 1.6, 1.5, -0.04); },
    update(S, s, c) { const o = S.objs, A = c.Z + c.N, R = 0.18 * Math.cbrt(A) + 0.05; if (X.changed(S, c.Z + "," + c.N)) { o.nuc.fill(c.Z, A, R, 0, 0, 0, A * 7 + c.Z); const cv = document.createElement("canvas"); void cv; o.plaque.set([A + "      ", EL[c.Z], c.Z + "      "], "#ffd27a"); } o.nuc.position.set(-0.6, 1.5, 0); o.nuc.rotation.y = (S.t || 0) * 0.4; o.R = R; },
    hud(ctx, s, c, S) { lab(ctx, S, V(-0.6, 1.5 - (S.objs.R || 0.5) - 0.2, 0), "● proton   ● neutron", "#c9d6ea", -60, 18, 10.5); lab(ctx, S, V(1.6, 0.85, 0), "nuclide symbol ᴬ_Z X", "#c9d6ea", -60, 18, 10); },
  });

  /* ---------- α, β, γ ---------- */
  const ax = (px) => (px - 300) * 0.0095, ay = (py) => 1.5 + (200 - py) * 0.0095;
  X.def("α, β, γ — Penetration, Deflection & G-M Counter", {
    env: "dark", envOpts: { w: 12, d: 8 }, cam: [[0.3, 2.4, 7.4], [0.1, 1.4, 0]], shift: [0, 60],
    build(S, s, c, mk, o) { X.mesh(new T.CylinderGeometry(0.2, 0.22, 0.4, 28), M.matte(0x5a5a62, 0.4), S.scene, ax(45), ay(200), 0).rotation.z = Math.PI / 2; o.abs = [0, 1, 2].map((i) => { const m = X.mesh(new T.BoxGeometry([0.02, 0.05, 0.2][i], 1.6, 1.0), [M.matte(0xf4f0e0, 0.9), M.aluminium(), M.matte(0x5a5a64, 0.5)][i], S.scene, ax(203), ay(200), 0); return m; });
      o.plates = [X.mesh(new T.BoxGeometry(1.4, 0.04, 0.8), M.paint(0xd23a2a), S.scene, ax(290), ay(124), 0), X.mesh(new T.BoxGeometry(1.4, 0.04, 0.8), M.paint(0x2a5ad8), S.scene, ax(290), ay(276), 0)];
      const gm = X.mesh(new T.CylinderGeometry(0.12, 0.12, 0.6, 28), M.steel(), S.scene, ax(560), ay(200), 0); gm.rotation.z = Math.PI / 2; X.mesh(new T.CircleGeometry(0.1, 24), M.matte(0x3a2a1a), S.scene, ax(530) - 0.005, ay(200), 0).rotation.y = -Math.PI / 2; const box = X.group(S, ax(580), 0.5, 0); X.mesh(new T.BoxGeometry(0.8, 0.5, 0.5), M.plastic(0x2a2f38, 0.4), box); o.lcd = X.screen(box, 0.6, 0.2, { bg: "#0f1d10", fg: "#7dff9a" }); o.lcd.position.z = 0.252; S.scene.add(wire2([[ax(590), ay(200), 0], [ax(620), 1.0, 0], [ax(580), 0.75, 0]]));
      o.p = mk.particles(200, 0.045, M.emissive(0xffffff, 1.5)); },
    update(S, s, c) { const o = S.objs; o.abs.forEach((m, i) => (m.visible = c.abs === i + 1)); o.plates.forEach((m) => (m.visible = !!c.fld)); o.p.material.emissive.set([0xff4a3a, 0x5a9aff, 0x5bd68c][c.t]); const r = c.t === 0 ? 1.4 : 1; const p = (s.p || []).filter((q) => q.alive); for (let i = 0; i < 200; i++) { const q = p[i]; if (q) o.p.set(i, ax(q.x), ay(q.y), 0, r); else o.p.set(i, 0, -9, 0); } o.p.instanceMatrix.needsUpdate = true; o.lcd.set(K.f(s.cpm || 0, 0) + " /min"); },
    hud(ctx, s, c, S) { lab(ctx, S, V(ax(45), ay(230), 0), "source", "#c9d6ea", -20, 14, 10); lab(ctx, S, V(ax(560), ay(170), 0), "G-M tube", "#c9d6ea", -24, -6, 10); if (c.abs) lab(ctx, S, V(ax(203), ay(110), 0), ["paper", "3 mm aluminium", "2 cm lead"][c.abs - 1], "#e6eef8", -30, -6, 10); if (c.fld) { lab(ctx, S, V(ax(360), ay(124), 0.4), "+ plate", "#ff8f80", 4, 0, 10); lab(ctx, S, V(ax(360), ay(276), 0.4), "− plate", "#8fb8ff", 4, 0, 10); } },
  });
  function wire2(pts) { const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => V(...p))), 40, 0.015, 6), M.plastic(0x1a1a1a, 0.4)); return m; }

  /* ---------- Mass defect: a balance comparing a nucleus with its separate nucleons ---------- */
  const NUC = [["Helium-4", 2, 2, 4.001506], ["Carbon-12", 6, 6, 11.996709], ["Oxygen-16", 8, 8, 15.990526], ["Iron-56", 26, 30, 55.920687], ["Uranium-235", 92, 143, 234.993459]];
  X.def("Mass Defect & Binding Energy", {
    cam: [[0.1, 2.0, 5.2], [0.1, 1.2, 0]], shift: [100, -60], hudOpt0: { bg: 1, place: (r) => (r[0] < 380 ? X.fit(r, 4, 4, 250, 220) : null) },
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(1.0, 0.1, 0.6), M.wood(), S.scene, 0, 0.05, 0); X.mesh(new T.CylinderGeometry(0.05, 0.06, 1.6, 16), M.brass(), S.scene, 0, 0.85, 0); o.beam = X.group(S, 0, 1.65, 0); X.mesh(new T.BoxGeometry(2.6, 0.06, 0.08), M.brass(), o.beam); X.mesh(new T.ConeGeometry(0.06, 0.12, 4), M.brass(), o.beam, 0, -0.06, 0).rotation.x = Math.PI;
      o.pans = [-1.25, 1.25].map((x) => { const g = X.group(S); X.mesh(new T.CylinderGeometry(0.55, 0.45, 0.06, 40), M.brass(), g); [0, 1, 2].forEach((k) => { const a = (k / 3) * TAU; const st = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 0.7, 6), M.steel()); st.position.set(0.4 * Math.cos(a) * 0.5, 0.35, 0.4 * Math.sin(a) * 0.5); g.add(st); }); g.userData.x = x; return g; });
      o.bound = nucleus(S, 240, 0.4); o.free = nucleus(S, 240, 0.4); },
    update(S, s, c) { const o = S.objs, [nm, Z, N, mN] = NUC[c.n], A = Z + N, dm = Z * 1.007276 + N * 1.008665 - mN, tilt = clampv(dm / A, 0, 0.01) * 14; o.beam.rotation.z = -tilt;
      o.pans.forEach((g, i) => { const x = g.userData.x, y = 1.65 + (i ? -1 : 1) * Math.sin(tilt) * 1.25 * -1; g.position.set(x * Math.cos(tilt), 1.65 - (i ? 1 : -1) * Math.sin(-tilt) * 1.25 - 0.72, 0); void y; });
      if (X.changed(S, "n" + c.n)) { const R = 0.07 * Math.cbrt(A) + 0.04; o.bound.fill(Z, A, R, 0, 0, 0, 3); const r = K.rnd(9), m = new T.Matrix4(), col = new T.Color(), sz = Math.min(0.06, 0.38 / Math.sqrt(A)); for (let i = 0; i < 240; i++) { if (i < A) { const a = r() * TAU, rr = Math.sqrt(r()) * 0.42; m.makeScale(sz, sz, sz); m.setPosition(rr * Math.cos(a), 0.06 + sz + Math.floor(i / 60) * sz * 1.8, rr * Math.sin(a)); o.free.setColorAt(i, col.set(i < Z ? 0xe0402f : 0x9aa0a8)); } else m.makeScale(0, 0, 0); o.free.setMatrixAt(i, m); } o.free.instanceMatrix.needsUpdate = true; o.free.instanceColor.needsUpdate = true; o.Rb = R; }
      o.bound.position.copy(o.pans[0].position).add(V(0, 0.06 + o.Rb, 0)); o.free.position.copy(o.pans[1].position); o.dm = dm; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.dm == null) return; lab(ctx, S, o.pans[0].position.clone().add(V(0, -0.1, 0.5)), "nucleus " + NUC[c.n][3] + " u", "#ffd27a", -50, 22, 10); lab(ctx, S, o.pans[1].position.clone().add(V(0, -0.1, 0.5)), "separate nucleons", "#c9d6ea", -50, 22, 10); lab(ctx, S, V(0, 1.95, 0), "Δm = " + K.f(o.dm, 5) + " u → " + K.f(o.dm * 931, 1) + " MeV", "#7fe3da", -90, -6, 10.5); },
  });

  /* ---------- Young's modulus (Searle-type wires) ---------- */
  const WIRE = [["Steel", 200e9, 250e6, 450e6, 0xc8ccd4], ["Copper", 117e9, 70e6, 220e6, 0xc87a4a], ["Brass", 100e9, 120e6, 350e6, 0xd8b450], ["Rubber (approx.)", 0.01e9, 7e6, 15e6, 0x2a2a2a]];
  X.def("Young's Modulus — Stress & Strain", {
    cam: [[0.3, 2.1, 5.6], [0.1, 1.9, 0]], shift: 182, hudOpt0: { bgAll: 1 },
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(1.8, 0.16, 0.5), M.wood(), S.scene, 0, 3.8, 0); X.mesh(new T.BoxGeometry(0.1, 3.8, 0.1), M.steel(), S.scene, -0.85, 1.9, -0.2); X.mesh(new T.BoxGeometry(1.0, 0.08, 0.6), M.matte(0x2a2f37), S.scene, -0.85, 0.04, -0.2);
      o.ref = mk.rod(V(-0.35, 3.72, 0), V(-0.35, 1.2, 0), 0.008, M.steel()); X.mesh(new T.BoxGeometry(0.12, 0.25, 0.12), M.iron(), S.scene, -0.35, 1.1, 0); o.w1 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.008, M.steel()); o.w2 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.008, M.steel()); o.hang = X.group(S); o.ver = X.mesh(new T.BoxGeometry(0.5, 0.05, 0.05), M.brass(), S.scene, 0, 1.2, 0); },
    update(S, s, c) { const o = S.objs, [nm, E, el, uts, col] = WIRE[c.w], Ar = Math.PI * Math.pow((c.d / 2) * 1e-3, 2), st = c.F / Ar, plastic = st > el, broke = st > uts, strain = plastic ? el / E + (st - el) / (E * 0.05) : st / E, e = strain * c.L, ext = clampv(e * 1000 * 0.04, 0, 1.3), x = 0.35;
      [o.w1, o.w2].forEach((w) => (w.material.color.set(col))); const r = 0.004 + c.d * 0.006; o.w1.scale.x = o.w1.scale.z = r / 0.008; o.w2.scale.x = o.w2.scale.z = r / 0.008; const bot = 1.3 - ext;
      if (X.changed(S, "F" + Math.round(c.F / 50) + broke)) { while (o.hang.children.length) o.hang.remove(o.hang.children[0]); const n = clampv(Math.round(c.F / 50), 1, 8); for (let i = 0; i < n; i++) X.mesh(new T.CylinderGeometry(0.16, 0.16, 0.06, 32), M.iron(), o.hang, 0, -0.1 - i * 0.065, 0); X.mesh(new T.CylinderGeometry(0.012, 0.012, 0.6, 8), M.steel(), o.hang, 0, -0.3, 0); }
      if (!broke) { S.setRod(o.w1, V(x, 3.72, 0), V(x, bot, 0)); o.w2.visible = false; o.hang.position.set(x, bot, 0); o.ver.position.set(0, bot, 0); } else { S.setRod(o.w1, V(x, 3.72, 0), V(x, 2.6, 0)); o.w2.visible = true; S.setRod(o.w2, V(x + 0.05, 0.75, 0), V(x + 0.3, 0.12, 0.1)); o.hang.position.set(x + 0.1, 0.62, 0); o.ver.position.set(0, 1.25, 0); }
      o.e = e; o.broke = broke; o.bot = bot; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.e == null) return; lab(ctx, S, V(-0.35, 2.4, 0), "reference wire", "#c9d6ea", -100, 0, 10); lab(ctx, S, V(0.35, 2.4, 0), "test wire", "#c9d6ea", 10, 0, 10); H.pill(ctx, 14, 390, o.broke ? "WIRE BROKE" : "extension e = " + K.f(o.e * 1000, 3) + " mm (drawn magnified)", o.broke ? "#ef7a6d" : "#ffd27a", 11); },
  });

  /* ---------- Thermal conductivity & solar water heater ---------- */
  const MATS = [["Copper", 400], ["Aluminium", 237], ["Steel", 50], ["Glass", 0.8], ["Wood", 0.15], ["Polystyrene foam", 0.03]];
  X.def("Thermal Conductivity & Solar Water Heater", {
    env: "outdoor", cam: [[0.4, 2.6, 6.6], [0.5, 1.3, 0]], shift: 0,
    build(S, s, c, mk, o) { const g0 = (o.g0 = X.group(S, -1.0, 0, 0)), g1 = (o.g1 = X.group(S, 1.2, 0, 0)); X.mesh(new T.BoxGeometry(2.8, 0.7, 1.4), M.matte(0x5a5148, 0.9), g0, 0.4, 0.35, 0); o.hot = X.mesh(new T.BoxGeometry(0.7, 1.2, 1.0), new T.MeshStandardMaterial({ color: 0x7a1a10, emissive: 0xff3a1a, emissiveIntensity: 0.8 }), g0, -0.6, 1.3, 0); o.cold = X.mesh(new T.BoxGeometry(0.7, 1.2, 1.0), M.plastic(0x2a6ad8, 0.3), g0, 1.2, 1.3, 0); o.slab = X.mesh(new T.BoxGeometry(1, 1.2, 1.0), M.copper(), g0, 0.3, 1.3, 0); o.dots = mk.particles(10, 0.04, M.emissive(0xffb703, 1.4)); g0.add(o.dots);
      const pan = X.group(S, 0.0, 1.2, 0.2); g1.add(pan); pan.rotation.x = -0.5; X.mesh(new T.BoxGeometry(2.0, 0.08, 1.2), M.matte(0x111111, 0.6), pan); for (let i = 0; i < 6; i++) X.mesh(new T.CylinderGeometry(0.025, 0.025, 1.1, 10), M.copper(), pan, -0.8 + i * 0.32, 0.05, 0).rotation.x = Math.PI / 2; const cov = new T.Mesh(new T.BoxGeometry(2.0, 0.02, 1.2), M.glass()); cov.position.y = 0.12; cov.renderOrder = 3; pan.add(cov); o.ins = X.mesh(new T.BoxGeometry(2.0, 0.1, 1.2), M.matte(0xe8d8a0, 1), pan, 0, -0.1, 0);
      X.mesh(new T.CylinderGeometry(0.06, 0.06, 2.4, 12), M.steel(), g1, -0.8, 1.2, -0.5); const tank = X.mesh(new T.CylinderGeometry(0.35, 0.35, 1.2, 32), M.steel(), g1, 0.2, 2.6, -0.6); tank.rotation.z = Math.PI / 2; g1.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V(0.9, 1.5, -0.1), V(0.9, 2.3, -0.5), V(0.7, 2.6, -0.6)]), 20, 0.03, 8), M.paint(0xd03030))); g1.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V(-0.3, 2.6, -0.6), V(-1.0, 1.8, -0.2), V(-0.9, 0.9, 0.5)]), 20, 0.03, 8), M.paint(0x2a5ad8)));
      o.rays = Array.from({ length: 6 }, (_, i) => mk.beam(V(-0.6 + i * 0.3 + 1.2, 4.2, -1.4), V(-0.8 + i * 0.32 + 1.2, 1.2, 0.2), 0xffd84a, 0.01)); },
    update(S, s, c) { const o = S.objs, m0 = c.m === 0; o.g0.visible = m0; o.g1.visible = !m0; o.rays.forEach((r) => (r.visible = !m0));
      if (m0) { const k = MATS[c.mat][1], w = 0.2 + c.x * 0.04, q = (k * 0.01 * 80) / (c.x / 1000); o.slab.scale.x = w; o.slab.position.x = -0.25 + w / 2; o.cold.position.x = -0.25 + w + 0.35; if (X.changed(S, "mt" + c.mat)) o.slab.material = [M.copper(), M.aluminium(), M.steel(), M.glass(0xcfeee8), M.wood(), M.matte(0xf4f4f0, 1)][c.mat]; for (let i = 0; i < 10; i++) { const u = ((s.t || 0) * clampv(q / 400, 0.05, 2) + i / 10) % 1; o.dots.set(i, -0.25 + u * w, 0.85 + (i % 5) * 0.2, 0.52); } o.dots.instanceMatrix.needsUpdate = true; }
      else { o.ins.scale.y = 0.3 + c.x / 20; o.rays.forEach((r) => (r.userData.halo.material.opacity = 0.1 + (c.I / 1000) * 0.3)); } },
    hud(ctx, s, c, S) { if (c.m === 0) { lab(ctx, S, V(-1.6, 2.0, 0), "100 °C", "#ff8f80", -20, -6, 11); lab(ctx, S, S.objs.cold.getWorldPosition(V()).add(V(0, 0.7, 0)), "20 °C", "#8fb8ff", -20, -6, 11); lab(ctx, S, V(-0.95, 0.7, 0.7), MATS[c.mat][0] + " slab, " + c.x + " mm", "#ffd27a", -40, 22, 10.5); } else { lab(ctx, S, V(1.4, 3.0, -0.6), "hot-water tank", "#c9d6ea", -40, -10, 10); lab(ctx, S, V(1.2, 0.9, 0.9), "black absorber · glass cover · insulation", "#ffd27a", -110, 24, 10); } },
  });

  /* ---------- Band theory ---------- */
  X.def("Band Theory & Doping (p-type, n-type)", {
    env: "dark", envOpts: { w: 12, d: 8 }, cam: [[0.6, 2.3, 7.4], [0.2, 1.8, 0]], shift: 150,
    build(S, s, c, mk, o) { o.vb = new T.Mesh(new T.BoxGeometry(2.6, 0.7, 1.2), new T.MeshPhysicalMaterial({ color: 0x4a7ad8, transparent: true, opacity: 0.35, roughness: 0.2, clearcoat: 1, depthWrite: false })); o.cb = new T.Mesh(new T.BoxGeometry(2.6, 0.7, 1.2), new T.MeshPhysicalMaterial({ color: 0xffb703, transparent: true, opacity: 0.22, roughness: 0.2, clearcoat: 1, depthWrite: false })); o.vb.renderOrder = o.cb.renderOrder = 4; S.scene.add(o.vb, o.cb);
      o.el = mk.particles(40, 0.05, M.emissive(0x5a9aff, 1.4)); o.ho = new T.InstancedMesh(new T.TorusGeometry(0.05, 0.014, 8, 20), M.emissive(0xff4a3a, 1.4), 30); S.scene.add(o.ho); o.lev = X.mesh(new T.BoxGeometry(2.4, 0.01, 1.1), M.glow(0x5bd68c, 0.5), S.scene); o.gap = mk.arrow(0xc9d6ea, 0.015, 0.06); },
    update(S, s, c) { const o = S.objs, gap = [0, 1.1, 1.1, 1.1, 5.5][c.m], vbY = 0.8, cbY = c.m === 0 ? vbY + 0.5 : vbY + 0.75 + gap * 0.28, t = s.t || 0; o.vb.position.set(0, vbY, 0); o.cb.position.set(0, cbY, 0);
      const th = c.m === 4 ? 0 : Math.round(clampv(14 * Math.exp(-1000 * 1.1 * (1 / c.T - 1 / 600)), 0, 14)), ne = c.m === 0 ? 30 : c.m === 4 ? 0 : th + (c.m === 2 ? 10 : 0), nh = c.m === 0 || c.m === 4 ? 0 : th + (c.m === 3 ? 10 : 0), r = K.rnd(7), m = new T.Matrix4();
      for (let i = 0; i < 40; i++) { if (i < ne) { const a = r(), b = r(), z = r(); o.el.set(i, -1.2 + ((a * 2.4 + t * 0.4 * (b + 0.2)) % 2.4), cbY - 0.25 + b * 0.5, -0.5 + z); } else o.el.set(i, 0, -9, 0); } o.el.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 30; i++) { if (i < nh) { const a = r(), b = r(), z = r(); m.makeTranslation(-1.2 + ((((a * 2.4 - t * 0.2) % 2.4) + 2.4) % 2.4), vbY - 0.25 + b * 0.5, -0.5 + z); } else m.makeScale(0, 0, 0); o.ho.setMatrixAt(i, m); } o.ho.instanceMatrix.needsUpdate = true;
      o.lev.visible = c.m === 2 || c.m === 3; o.lev.material.color.set(c.m === 2 ? 0x5bd68c : 0xff8fc7); o.lev.position.set(0, c.m === 2 ? cbY - 0.47 : vbY + 0.47, 0); o.gap.visible = gap > 0; if (gap) S.setArrow(o.gap, V(1.5, vbY + 0.35, 0), V(0, 1, 0), cbY - vbY - 0.7); o.cbY = cbY; o.ne = ne; o.nh = nh; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.cbY == null) return; lab(ctx, S, V(-1.2, 0.8 - 0.35, 0.6), "valence band", "#8fb8ff", 0, 20, 10.5); lab(ctx, S, V(-1.2, o.cbY + 0.35, 0.6), "conduction band", "#ffd27a", 0, -6, 10.5); const gap = [0, 1.1, 1.1, 1.1, 5.5][c.m]; if (gap) lab(ctx, S, V(1.5, (0.8 + o.cbY) / 2, 0), "gap " + gap + " eV", "#c9d6ea", 8, 4, 10); if (c.m === 2) lab(ctx, S, V(1.3, o.cbY - 0.47, 0.5), "donor level", "#5bd68c", 6, 4, 9.5); if (c.m === 3) lab(ctx, S, V(1.3, 1.27, 0.5), "acceptor level", "#ff8fc7", 6, 4, 9.5); },
  });
})();
