/* c3d-g3.js — chemistry 3D gap scenes: laws of chemical combination; types of crystalline solids (ionic, metallic, covalent network, molecular; SiO₂ vs CO₂) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;

  /* =============================== laws of chemical combination =============================== */
  const LAWS = ["Conservation of mass: precipitation in a sealed flask", "Conservation of mass: open vs closed system (marble + acid)", "Constant composition: copper(II) oxide made three ways", "Multiple proportions: two compounds of the same elements"];
  const PAIRS = [
    { a: "CO", b: "CO₂", el: "carbon", fix: "12 g C", oa: 16, ob: 32, spec: [[{ el: "C", h: "sp", nh: 0 }, { el: "O", p: 0, o: 3 }], [{ el: "C", h: "sp" }, { el: "O", p: 0, o: 2 }, { el: "O", p: 0, o: 2 }]] },
    { a: "H₂O", b: "H₂O₂", el: "hydrogen", fix: "2 g H", oa: 16, ob: 32, spec: [[{ el: "O" }], [{ el: "O", nh: 1 }, { el: "O", p: 0, nh: 1 }]] },
    { a: "Cu₂O (red)", b: "CuO (black)", el: "copper", fix: "127 g Cu", oa: 16, ob: 32, heaps: [[180, 50, 40], [28, 28, 30]] },
  ];
  const CUO = [{ m: "heating copper in air", mass: 2.385 }, { m: "heating copper(II) trioxonitrate(V)", mass: 1.952 }, { m: "heating copper(II) trioxocarbonate(IV)", mass: 3.106 }];
  C3.scenes.chemicalCombination = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.74, fov: 36, free: true, cam: [[1.7, 2.9, 7.6], [1.0, 1.3, 0]],
    values: { law: 0, closed: 0, pair: 0 },
    state: () => ({ p: 0, go: 0 }),
    get controls() {
      return [
        { type: "select", key: "law", label: "Law to investigate", options: LAWS.map((m, i) => ({ value: i, label: m })) },
        { type: "button", label: "Start the reaction (tip the tube / drop in the marble / analyse)", action: (S, s) => { s.go = 1; } },
        { type: "toggle", key: "closed", label: "Open vs closed: put a balloon over the flask (closed system)" },
        { type: "select", key: "pair", label: "Multiple proportions: pair of compounds", options: PAIRS.map((m, i) => ({ value: i, label: m.a + " and " + m.b })) },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s) => { s.p = 0; s.go = 0; } },
      ];
    },
    views: [{ label: "This experiment", cam: (S, s, c) => CCV[c.law | 0] }, { label: "Read the balance", cam: [[0.5, 1.0, 2.6], [0.1, 0.55, 0]] }],
    note: "Law of conservation of mass: matter is neither created nor destroyed in a chemical reaction, so the total mass of the products equals the total mass of the reactants (a closed system must be used if a gas is formed). Law of constant (definite) composition: a pure compound always contains the same elements combined in the same fixed proportion by mass, however it is made. Law of multiple proportions: when two elements form more than one compound, the masses of one element that combine with a fixed mass of the other are in a simple whole-number ratio.",
    onChange(S, s, c, key) { if (key === "law" || key === "closed" || key === "pair") { s.p = 0; s.go = 0; if (key === "law") C3.setView(S, { cam: CCV[c.law | 0] }); if (key === "pair") rebuildPair(S, s, c); } },
    reset(S, s, c) { Object.assign(c, { law: 0, closed: 0, pair: 0 }); s.p = 0; s.go = 0; rebuildPair(S, s, c); C3.setView(S, { cam: CCV[0] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(9, 0.06, 3.6, M.matte(0xb69a76, 0.62), 0, 0, 0).receiveShadow = true;
      /* balance + flask (laws 0 and 1) */
      s.bal = G.balance(S, 0, 0); const fl = K.flask(); fl.group.position.y = s.bal.panY; s.fl = fl; s.fL = fl.addLiquid({ color: [225, 238, 246], opacity: 0.22 }); s.fL.setVolume(60);
      s.ppt = K.precipitate(fl, s.fL, { color: 0xf8f8f6, n: 1600, size: 0.03 }); s.bub = K.bubbles(fl, s.fL, { n: 70, spread: 0.6 });
      s.inner = new T.Group(); s.inner.position.set(0.4 * CM, s.bal.panY + 0.35 * CM, 0); sc.add(s.inner); const it = K.vessel("testtube", { noAdd: true }); it.group.scale.set(0.9, 0.62, 0.9); s.inner.add(it.group); s.itL = it.addLiquid({ color: [235, 240, 245], opacity: 0.25 }); s.itL.setVolume(8); s.it = it;
      s.bungF = G.bung(S, 1.45, 2.2); s.bungF.position.set(0, s.bal.panY + 13.2 * CM, 0);
      s.marble = G.crystals(5, "lump", [240, 238, 232], 0.6, { mat: G.powderMat([236, 234, 228], 0.6) }); sc.add(s.marble);
      s.balloon = new T.Mesh(new T.SphereGeometry(1, 40, 30), new T.MeshPhysicalMaterial({ color: 0xd83a3a, roughness: 0.35, clearcoat: 0.8, transparent: true, opacity: 0.92 })); s.balloon.castShadow = true; sc.add(s.balloon);
      /* constant composition: three crucibles of CuO */
      s.gC = new T.Group(); sc.add(s.gC); s.cru = CUO.map((x, i) => { const v = K.vessel(G.DEFS.crucible, { noAdd: true }); G.opaque(v, M.ceramic(0xf2efe6)); v.group.position.set(-1.0 + i * 0.95, 0.02, 0.2); s.gC.add(v.group);
        const hp = G.heap(2.1, 1.3, [26, 26, 28]); hp.position.y = 0.3 * CM; v.group.add(hp); const lab = G.labelCard(["Cu + O₂", "Cu(NO₃)₂", "CuCO₃"][i], 5, 1.4); lab.position.set(-1.0 + i * 0.95, 0.06, 0.95); lab.rotation.x = -Math.PI / 2; s.gC.add(lab); return { v, hp }; });
      /* multiple proportions display */
      s.gM = new T.Group(); sc.add(s.gM); const ped = new T.Mesh(new T.CylinderGeometry(1.7, 1.8, 0.1, 64), M.plastic(0x1f2833, 0.3)); ped.position.set(0, 0.05, 0); ped.receiveShadow = true; s.gM.add(ped);
      rebuildPair(S, s, c); C3.setView(S, { cam: CCV[c.law | 0] });
    },
    update(S, s, c, dt) {
      const L = c.law | 0, t = S.t; const bal = L <= 1; s.bal.group.visible = bal; s.fl.group.visible = bal; s.gC.visible = L === 2; s.gM.visible = L === 3; (s.pairObjs || []).forEach((o) => { o.visible = L === 3; });
      if (s.go && dt > 0) s.p = clamp(s.p + dt * (L === 1 ? 0.06 : L === 2 ? 0.12 : 0.35), 0, 1);
      s.inner.visible = L === 0; s.bungF.visible = L === 0; s.marble.visible = L === 1; s.balloon.visible = L === 1 && c.closed;
      if (L === 0) { /* AgNO₃ in the small tube + NaCl in the flask; tip it: white AgCl, mass unchanged */
        const tip = G.smooth(0, 0.35, s.p); s.inner.rotation.z = tip * 1.25; s.itL.setVolume(8 * (1 - G.smooth(0.15, 0.5, s.p))); s.ppt.amount = G.smooth(0.2, 1, s.p) * 0.9; s.fL.setVolume(60 + 7 * G.smooth(0.15, 0.5, s.p)); s.fL.setColor([238, 240, 242], 0.22 + 0.5 * G.smooth(0.2, 0.8, s.p)); s.fL.agit = s.p > 0 && s.p < 1 ? 0.6 : 0;
        s.mass = 152.38; s.bal.set(s.mass); s.ppt.update(dt); s.itL.update(t); s.fL.update(t);
      } else if (L === 1) { /* CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂ ; 2.00 g marble (0.0200 mol) with excess acid */
        const ext = 1 - Math.exp(-4 * s.p), co2 = 0.0200 * ext * 44.01; s.co2 = co2; s.mass = 148.62 + 2.0 - (c.closed ? 0 : co2); s.bal.set(s.go ? s.mass : 148.62);
        const fy = s.bal.panY, drop = G.smooth(0, 0.08, s.p); s.marble.layout((i) => ({ x: (i - 2) * 0.12 * (1 - drop * 0.5), y: lerp(fy + 2.8, fy + 0.12 + (i % 2) * 0.05, drop) - (drop >= 1 ? 0.02 * ext * (i % 3) : 0), z: (i % 2 ? 0.08 : -0.06), rx: i, ry: i * 2, s: (1 - 0.8 * ext) * (0.7 + 0.12 * i) }));
        s.bub.rate = s.go && drop >= 1 ? 120 * (1 - ext) + 2 : 0; s.fL.agit = s.bub.rate > 10 ? 0.7 : 0; s.bub.update(dt, t); s.fL.update(t);
        const bv = c.closed ? 0.25 + 1.2 * Math.cbrt(ext) : 0.25; s.balloon.scale.set(bv * 0.55, bv * 0.75, bv * 0.55); s.balloon.position.set(0, fy + 12.6 * CM + bv * 0.62, 0);
        s.puffT = (s.puffT || 0) + dt; if (!c.closed && s.bub.rate > 20 && s.puffT > 0.3) { s.puffT = 0; G.wisp(S, 0, fy + 2.15, 0, 0xdde6ee, { op: 0.12 }); }
      } else if (L === 2) { s.cru.forEach((q, i) => { const k = G.smooth(i * 0.25, i * 0.25 + 0.4, s.p); q.hp.material.color.setRGB(lerp(1, 4.0, k), lerp(1, 1.7, k), lerp(1, 1.1, k)); q.hp.material.roughness = lerp(0.96, 0.45, k); q.hp.material.metalness = 0.5 * k; }); }
      else { (s.pairObjs || []).forEach((o, i) => { o.rotation.y += dt * 0.4 * (i ? -1 : 1); }); }
    },
    overlay(ctx, s, c, w, h, S) {
      const L = c.law | 0, px = w - 250; ctx.save();
      if (L === 0) { G.titles(ctx, "Law of conservation of mass", "AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)   in a stoppered flask");
        G.panel(ctx, px, 58, 240, "Balance reading", ["before mixing: 152.38 g", "after: " + s.mass.toFixed(2) + " g", ["Δm = 0.00 g: mass of products = mass of reactants", "#8dffb8"], "white precipitate of silver chloride forms but no matter enters or leaves"]);
        G.status(ctx, s.p > 0.25 ? "white precipitate (AgCl) forms; the balance reading does not change" : s.go ? "tipping the small tube…" : "press Start to tip the tube", s.p > 0.25 ? "ok" : "info"); }
      else if (L === 1) { G.titles(ctx, "Open vs closed system", "CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)");
        G.panel(ctx, px, 58, 240, "Balance", ["start (flask + acid + marble): 150.62 g", "CO₂ formed so far: " + (s.co2 || 0).toFixed(3) + " g", "reading now: " + (s.go ? s.mass : 150.62).toFixed(2) + " g", [c.closed ? "closed: the CO₂ is trapped in the balloon, so the mass stays constant" : "open: CO₂ escapes into the air, so the mass falls by the mass of CO₂", c.closed ? "#8dffb8" : "#ffb38a"], "max CO₂ = 0.0200 mol × 44 g/mol = 0.88 g"]); }
      else if (L === 2) { G.titles(ctx, "Law of constant composition", "CuO reduced to copper: CuO + H₂ → Cu + H₂O"); const rows = CUO.map((x, i) => { const cu = x.mass * 63.55 / 79.55, k = s.p > i * 0.25 + 0.4; return [x.m + ": " + x.mass.toFixed(3) + " g CuO → " + (k ? cu.toFixed(3) + " g Cu  = " + (cu / x.mass * 100).toFixed(1) + " % Cu" : "…"), k ? "#e8f0ff" : "#9fb2d2"]; });
        rows.push(["every sample: 79.9 % Cu, 20.1 % O — the same compound has a fixed composition", s.p > 0.95 ? "#8dffb8" : "#9fb2d2"]); G.panel(ctx, px, 58, 240, "Results", rows); s.cru.forEach((q, i) => G.tag(ctx, S, q.v.group.position.clone().add(V3(0, 0.95, 0)), s.p > i * 0.25 + 0.4 ? "pink-brown Cu" : "black CuO", "#cfe0f5", 8)); }
      else { const P = PAIRS[c.pair | 0]; G.titles(ctx, "Law of multiple proportions", P.a + " and " + P.b);
        G.panel(ctx, px, 58, 240, "Mass of oxygen per " + P.fix, [P.a + ": " + P.oa + " g O", P.b + ": " + P.ob + " g O", ["ratio " + P.oa + " : " + P.ob + " = 1 : 2  (simple whole numbers)", "#8dffb8"]]);
        (s.pairObjs || []).forEach((o, i) => G.tag(ctx, S, o.position.clone().add(V3(0, 1.0, 0)), i ? P.b : P.a, "#ffe9b8", 10)); }
      ctx.restore();
    },
    readouts(s, c) { const L = c.law | 0; if (L <= 1) return [["Balance reading", (s.mass || 0).toFixed(2) + " g"], ["System", L === 0 ? "closed (stoppered)" : c.closed ? "closed (balloon)" : "open"], ["Progress", Math.round(s.p * 100) + " %"]]; if (L === 2) return [["Cu in CuO", "79.9 % by mass"], ["O in CuO", "20.1 % by mass"]]; const P = PAIRS[c.pair | 0]; return [["Compounds", P.a + ", " + P.b], ["O per fixed mass of " + P.el, P.oa + " g : " + P.ob + " g"], ["Ratio", "1 : 2"]]; },
    steps(s, c) { return [["Weigh the apparatus and reactants", "done"], ["Start the reaction", s.go ? "done" : "now"], ["Weigh / analyse again", s.p > 0.6 ? "now" : ""], ["Compare and state the law", s.p > 0.95 ? "now" : ""]]; },
  };
  const CCV = [[[1.7, 2.9, 7.6], [1.0, 1.3, 0]], [[1.7, 3.1, 7.8], [1.0, 1.5, 0]], [[1.3, 2.7, 3.8], [0.8, 0.2, 0]], [[1.4, 2.4, 6.2], [1.0, 1.1, 0]]];
  function rebuildPair(S, s, c) {
    (s.pairObjs || []).forEach((o) => G.disposeGroup(o)); s.pairObjs = []; const P = PAIRS[c.pair | 0], K = s.K;
    if (P.spec) P.spec.forEach((sp, i) => { const mo = G.molecule(K, G.build(sp), { scale: 0.75 }); mo.group.position.set(-0.8 + i * 1.6, 1.0, 0); s.pairObjs.push(mo.group); });
    else P.heaps.forEach((rgb, i) => { const hp = G.heap(5, 2.2, rgb, { rough: 0.85 }); hp.position.set(-0.8 + i * 1.6, 0.1, 0); S.scene.add(hp); s.pairObjs.push(hp); });
  }

  /* =============================== types of crystalline solid =============================== */
  const SOL = [
    { key: "ionic", name: "Ionic lattice — sodium chloride, NaCl", mp: 801, bp: 1413, cond: "no as a solid; yes when molten or dissolved (ions free to move)", hard: "hard but brittle", solw: "soluble in water, insoluble in organic solvents", force: "strong electrostatic attraction between oppositely charged ions in all directions" },
    { key: "metal", name: "Metallic lattice — copper, Cu", mp: 1085, bp: 2562, cond: "yes, solid and liquid (delocalised electrons)", hard: "malleable and ductile (layers slide)", solw: "insoluble", force: "metallic bonding: cations in a sea of delocalised electrons" },
    { key: "covalent", name: "Giant covalent (network) — diamond, C", mp: 3550, bp: 4827, cond: "no (every electron in a bond)", hard: "hardest natural substance", solw: "insoluble in all solvents", force: "strong covalent bonds throughout the whole crystal (each C bonded to 4 others)" },
    { key: "molecular", name: "Simple molecular — iodine, I₂", mp: 114, bp: 184, cond: "no (neutral molecules)", hard: "soft, easily crushed", solw: "barely soluble in water; dissolves in organic solvents (purple)", force: "strong covalent bond inside each I₂ but weak van der Waals forces between molecules", sub: true },
    { key: "silica", name: "Silicon(IV) oxide vs carbon(IV) oxide", mp: 1713, bp: 2950, cond: "no", hard: "SiO₂ very hard (sand, quartz); CO₂ a gas", solw: "both: SiO₂ insoluble; CO₂ slightly soluble (acidic)", force: "SiO₂: giant covalent network of SiO₄ tetrahedra; CO₂: small O=C=O molecules with weak forces between them" },
  ];
  function latticeAtoms(key) {
    const A = [], B = []; const add = (el, x, y, z, r, col, mol) => { A.push({ el, p: V3(x, y, z), r, col, mol: mol == null ? A.length : mol }); return A.length - 1; };
    if (key === "ionic") { const d = 0.82, n = 4; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const na = (i + j + k) % 2; add(na ? "Na" : "Cl", (i - 1.5) * d, (j - 1.5) * d, (k - 1.5) * d, na ? 0.26 : 0.42, na ? 0xab5cf2 : 0x22d03a); } }
    else if (key === "metal") { const a = 1.25, n = 2, b = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]]; for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) for (let k = 0; k <= n; k++) b.forEach((q) => { const x = i + q[0], y = j + q[1], z = k + q[2]; if (x > n || y > n || z > n) return; add("Cu", (x - n / 2) * a, (y - n / 2) * a, (z - n / 2) * a, 0.34, 0xc8703f); }); }
    else if (key === "covalent" || key === "silica") {
      const a = key === "silica" ? 1.9 : 1.45, n = 2, P = [], b = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) b.forEach((q) => { P.push(V3(i + q[0], j + q[1], k + q[2])); P.push(V3(i + q[0] + 0.25, j + q[1] + 0.25, k + q[2] + 0.25)); });
      [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]].forEach(() => { }); const pts = P.filter((p) => p.x <= n && p.y <= n && p.z <= n).map((p) => p.clone().subScalar(n / 2 - 0.125).multiplyScalar(a));
      const ids = pts.map((p) => add(key === "silica" ? "Si" : "C", p.x, p.y, p.z, key === "silica" ? 0.2 : 0.17, key === "silica" ? 0xf0c8a0 : 0x3b3f46)); const bl = a * Math.sqrt(3) / 4;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (Math.abs(pts[i].distanceTo(pts[j]) - bl) < 0.02) { if (key === "silica") { const m = pts[i].clone().add(pts[j]).multiplyScalar(0.5).add(V3(rnd(-0.05, 0.05), rnd(-0.05, 0.05), rnd(-0.05, 0.05))); const o = add("O", m.x, m.y, m.z, 0.16, 0xe8281c); B.push([ids[i], o], [o, ids[j]]); } else B.push([ids[i], ids[j]]); }
      if (key === "silica") A.forEach((q) => q.p.x -= 1.4);
    } else if (key === "molecular") { const d = 1.2, n = 3; let m = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const c = V3((i - 1) * d, (j - 1) * d * 0.9, (k - 1) * d), ang = ((i + j + k) % 2 ? 1 : -1) * 0.7, u = V3(Math.cos(ang), 0.25, Math.sin(ang)).normalize().multiplyScalar(0.3); const a1 = add("I", c.x + u.x, c.y + u.y, c.z + u.z, 0.3, 0x6a2a8a, m), a2 = add("I", c.x - u.x, c.y - u.y, c.z - u.z, 0.3, 0x6a2a8a, m); B.push([a1, a2]); m++; } }
    if (key === "silica") { /* CO₂ molecules for comparison, on the right */ const dirs = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => V3(...v).normalize()); let m = 1000, k2 = 0; const a = 1.25;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]].forEach((q, qi) => { const c = V3((i + q[0] - 0.75) * a + 2.9, (j + q[1] - 0.75) * a, (k + q[2] - 0.75) * a), u0 = 0, u = dirs[qi].clone().multiplyScalar(0.27); const cc = add("C", c.x, c.y, c.z, 0.13, 0x3b3f46, m), o1 = add("O", c.x + u.x, c.y + u.y, c.z + u.z, 0.15, 0xe8281c, m), o2 = add("O", c.x - u.x, c.y - u.y, c.z - u.z, 0.15, 0xe8281c, m); B.push([cc, o1], [cc, o2]); m++; k2++; }); }
    return { A, B };
  }
  C3.scenes.solidTypes = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.6, 2.6, 8.4], [1.2, 1.5, 0]],
    values: { type: 0, T: 25, test: 0 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "type", label: "Type of solid", options: SOL.map((x, i) => ({ value: i, label: x.name })) },
        { type: "range", key: "T", label: "Temperature (°C)", min: -100, max: 3600, step: 5 },
        { type: "toggle", key: "test", label: "Test electrical conductivity (battery + bulb)" },
      ];
    },
    views: [{ label: "Lattice + sample", cam: [[1.6, 2.6, 8.4], [1.2, 1.5, 0]] }, { label: "Lattice close", cam: [[-0.4, 2.2, 5.2], [-0.6, 1.7, 0]] }],
    note: "Ionic solids (NaCl): a giant lattice of ions; high melting point, brittle, conduct only when molten or in solution. Metallic solids: cations in a sea of delocalised electrons; conduct as solids, malleable and ductile. Giant covalent (network) solids such as diamond and silicon(IV) oxide: every atom joined by covalent bonds; very high melting point, very hard, do not conduct (graphite is the exception). Simple molecular solids such as iodine, ice and solid carbon(IV) oxide: small molecules held by weak van der Waals forces or hydrogen bonds; low melting points, soft, non-conductors. SiO₂ and CO₂ have similar formulae but SiO₂ is a giant network (sand, m.p. 1713 °C) while CO₂ is made of separate molecules (sublimes at −78 °C).",
    onChange(S, s, c, key) { if (key === "type") rebuild(S, s, c); },
    reset(S, s, c) { Object.assign(c, { type: 0, T: 25, test: 0 }); rebuild(S, s, c); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(10, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0.5, 0, 0).receiveShadow = true;
      const ped = S.mk.cyl(1.9, 2.0, 0.1, M.plastic(0x1f2833, 0.3), -0.6, 0.05, 0); ped.receiveShadow = true;
      /* conductivity tester */
      s.tester = new T.Group(); sc.add(s.tester); const bat = S.mk.rbox(0.5, 0.36, 0.3, 0.04, M.paint(0x2a2a2a), 2.6, 0.18, 0.9); sc.remove(bat); s.tester.add(bat); const tip = S.mk.cyl(0.08, 0.08, 0.05, M.brass(), 2.6, 0.385, 0.9); sc.remove(tip); s.tester.add(tip);
      const bl = new T.Mesh(new T.SphereGeometry(0.13, 28, 20), new T.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xffd27a, emissiveIntensity: 0, transparent: true, opacity: 0.75, roughness: 0.05 })); bl.position.set(2.15, 0.42, 1.1); s.tester.add(bl); s.bulb = bl; const bh = S.mk.cyl(0.08, 0.08, 0.14, M.brass(), 2.15, 0.28, 1.1); sc.remove(bh); s.tester.add(bh);
      s.bLight = new T.PointLight(0xffd27a, 0, 4, 1.6); s.bLight.position.copy(bl.position); s.tester.add(s.bLight);
      const wr = (pts, col) => { const m = S.mk.tube(pts.map((p) => V3(...p)), 0.012, M.plastic(col, 0.4), 40); sc.remove(m); s.tester.add(m); };
      wr([[2.6, 0.38, 0.9], [2.4, 0.5, 1.0], [2.15, 0.22, 1.1]], 0xd02020); wr([[2.15, 0.22, 1.1], [1.9, 0.3, 0.8], [1.45, 0.25, 0.55]], 0x202020); wr([[2.75, 0.3, 0.9], [2.4, 0.3, 0.5], [1.7, 0.25, 0.35]], 0x2020d0);
      rebuild(S, s, c);
    },
    update(S, s, c, dt) {
      const X = SOL[c.type | 0], t = S.t, Tk = c.T + 273, mpK = X.mp + 273, melted = c.T >= X.mp, frac = clamp(Tk / mpK, 0, 1.6);
      const amp = 0.012 + 0.07 * Math.pow(Math.min(frac, 1), 1.5) + (melted ? 0.12 : 0), m4 = new T.Matrix4(); s.melted = melted;
      /* CO₂ in the silica mode sublimes at −78 °C */ const co2gone = X.key === "silica" && c.T > -78;
      s.pos = s.pos || []; s.L.A.forEach((a, i) => { const mol = a.mol, isCO2 = mol >= 1000; let off = V3(Math.sin(t * 13 + i * 1.7), Math.sin(t * 11.3 + i * 2.3), Math.sin(t * 12.1 + i * 0.9)).multiplyScalar(amp * (isCO2 ? 1.5 : 1));
        const free = (X.key === "molecular" && melted) || (isCO2 && co2gone); if (free) { const ph = mol * 2.1; const drift = clamp((c.T - (isCO2 ? -78 : X.mp)) / (isCO2 ? 150 : 120), 0, 1) * 2.2 + 0.35; off.add(V3(Math.sin(t * 0.7 + ph) * drift, Math.abs(Math.sin(t * 0.5 + ph * 1.3)) * drift * 0.8, Math.cos(t * 0.6 + ph) * drift)); }
        s.pos[i] = a.p.clone().add(off); });
      s.groups.forEach((gp) => { gp.ids.forEach((id, k) => { m4.makeScale(s.L.A[id].r, s.L.A[id].r, s.L.A[id].r); m4.setPosition(s.pos[id]); gp.im.setMatrixAt(k, m4); }); gp.im.instanceMatrix.needsUpdate = true; });
      if (s.bondIM) { const up = V3(0, 1, 0), q = new T.Quaternion(); s.L.B.forEach(([i, j], k) => { const a = s.pos[i], b = s.pos[j], d = b.clone().sub(a), L = d.length(); q.setFromUnitVectors(up, d.clone().normalize()); m4.compose(a.clone().addScaledVector(d, 0.5), q, V3(1, L, 1)); s.bondIM.setMatrixAt(k, m4); }); s.bondIM.instanceMatrix.needsUpdate = true; }
      if (s.elec) { const E = s.elec; for (let i = 0; i < E.n; i++) { const p = E.p[i]; p.addScaledVector(E.v[i], dt * (1 + frac)); ["x", "y", "z"].forEach((ax) => { if (p[ax] > 1.35) p[ax] -= 2.7; if (p[ax] < -1.35) p[ax] += 2.7; }); m4.makeTranslation(p.x + s.lat.position.x * 0, p.y, p.z); E.im.setMatrixAt(i, m4); } E.im.instanceMatrix.needsUpdate = true; }
      /* sample appearance */ if (s.sampleMat) { const glow = clamp((c.T - 500) / 900, 0, 1); if (s.sampleMat.emissive) { s.sampleMat.emissive.copy(G.glowCol(c.T)); s.sampleMat.emissiveIntensity = glow * 1.5; } }
      if (s.sample) { s.sample.visible = !(X.key === "molecular" && c.T > X.bp + 40); s.sample.scale.y = melted && X.key !== "molecular" ? 0.35 : 1; }
      if (s.vapour && dt > 0) { s.vapT = (s.vapT || 0) + dt; if (X.key === "molecular" && c.T > 60 && s.vapT > 0.25) { s.vapT = 0; S.puff(1.3, 0.45, 0.6, { n: 1, color: 0x9a3fd0, speed: 0.1, up: 0.4, life: 2.6, size: 0.4, op: clamp((c.T - 60) / 140, 0.05, 0.5) }); } if (X.key === "silica" && c.T < -60 && s.vapT > 0.3) { s.vapT = 0; S.puff(2.0, 0.25, 0.7, { n: 1, color: 0xf2f6fa, speed: 0.15, up: 0.05, life: 2.4, size: 0.5, op: 0.35 }); } }
      if (s.dryIce) s.dryIce.visible = c.T < -78;
      const conducts = c.test && (X.key === "metal" || (X.key === "ionic" && melted)); s.tester.visible = !!c.test; s.cond = conducts; const k = conducts ? 1 : 0; s.bulb.material.emissiveIntensity = 3 * k; s.bLight.intensity = 6 * k;
    },
    overlay(ctx, s, c, w, h, S) {
      const X = SOL[c.type | 0], px = w - 250; ctx.save(); G.titles(ctx, X.name, X.key === "silica" ? "left: SiO₂ network;   right: CO₂ molecules (dry ice)" : "particles vibrate more as the temperature rises");
      const state = X.key === "silica" ? ("SiO₂ " + (c.T >= X.mp ? "molten" : "solid") + ";  CO₂ " + (c.T > -78 ? "gas (sublimed at −78 °C)" : "solid (dry ice)")) : (c.T >= X.bp ? "gas" : c.T >= X.mp ? (X.sub ? "liquid / vapour" : "liquid (molten)") : "solid");
      G.panel(ctx, px, 58, 240, "Properties", ["bonding: " + X.force, "m.p. " + X.mp + " °C, b.p. " + X.bp + " °C", "conductivity: " + X.cond, "hardness: " + X.hard, "solubility: " + X.solw, ["at " + c.T + " °C: " + state, "#ffe9b8"]]);
      if (c.test) G.status(ctx, s.cond ? "the bulb lights: the substance conducts" : "the bulb does not light", s.cond ? "ok" : "bad");
      if (X.key === "silica") { G.tag(ctx, S, V3(-1.6, 2.7, 0), "SiO₂: each Si bonded to 4 O", "#f0c8a0", 8.5); G.tag(ctx, S, V3(0.9, 2.7, 0), "CO₂: separate molecules", "#ff9d8a", 8.5); }
      ctx.restore();
    },
    readouts(s, c) { const X = SOL[c.type | 0]; return [["Melting point", X.mp + " °C"], ["State now", c.T >= X.mp ? "melted / vaporised" : "solid"], ["Conducts?", X.cond], ["Forces", X.key === "molecular" ? "weak intermolecular" : "strong, throughout the lattice"]]; },
    table() { return G.table(["Type", "Example", "m.p. / °C", "Conducts", "Hardness"], [["ionic", "NaCl, MgO", "801, 2852", "molten/aq only", "hard, brittle"], ["metallic", "Cu, Fe, Na", "1085, 1538, 98", "yes", "malleable"], ["giant covalent", "diamond, SiO₂", "3550, 1713", "no (graphite yes)", "very hard"], ["simple molecular", "I₂, ice, dry ice", "114, 0, −78 (subl.)", "no", "soft"]]); },
  };
  function rebuild(S, s, c) {
    const sc = S.scene, X = SOL[c.type | 0]; G.disposeGroup(s.lat); G.disposeGroup(s.sample); s.lat = new T.Group(); s.lat.position.set(-0.6, 1.55, 0); s.lat.scale.setScalar(X.key === "silica" ? 0.5 : 0.62); sc.add(s.lat); s.elec = null; s.bondIM = null; s.sampleMat = null; s.vapour = true;
    s.L = latticeAtoms(X.key); const by = {}; s.L.A.forEach((a, i) => { (by[a.el] = by[a.el] || { col: a.col, ids: [] }).ids.push(i); });
    s.groups = Object.keys(by).map((el) => { const im = new T.InstancedMesh(new T.SphereGeometry(1, 28, 20), new T.MeshPhysicalMaterial({ color: by[el].col, roughness: el === "Cu" ? 0.2 : 0.25, metalness: el === "Cu" ? 0.85 : 0, clearcoat: 0.8 }), by[el].ids.length); im.castShadow = true; im.frustumCulled = false; s.lat.add(im); return { im, ids: by[el].ids }; });
    if (s.L.B.length) { s.bondIM = new T.InstancedMesh(new T.CylinderGeometry(X.key === "molecular" ? 0.09 : 0.045, X.key === "molecular" ? 0.09 : 0.045, 1, 10), M.matte(X.key === "molecular" ? 0x6a2a8a : 0xb8bec8, 0.35), s.L.B.length); s.bondIM.frustumCulled = false; s.lat.add(s.bondIM); }
    if (X.key === "metal") { const n = 160, im = new T.InstancedMesh(new T.SphereGeometry(0.05, 8, 6), M.glow(0x8fd8ff, 0.9), n), p = [], v = []; for (let i = 0; i < n; i++) { p.push(V3(rnd(-1.3, 1.3), rnd(-1.3, 1.3), rnd(-1.3, 1.3))); v.push(V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0.6, 1.4))); } im.frustumCulled = false; s.lat.add(im); s.elec = { n, im, p, v }; }
    /* macroscopic sample on the bench */
    const g = new T.Group(); g.position.set(1.4, 0.03, 0.55); sc.add(g); s.sample = g;
    if (X.key === "ionic") { const im = G.crystals(26, "box", [250, 250, 250], 0.9, { op: 0.9 }); im.layout((i) => ({ x: rnd(-0.35, 0.35), y: 0.06 + (i > 16 ? 0.12 : 0), z: rnd(-0.3, 0.3), ry: rnd(0, 3), s: rnd(0.6, 1.1) })); g.add(im); s.sampleMat = im.material; s.sampleMat.emissive = new T.Color(0); }
    else if (X.key === "metal") { const m = S.mk.rbox(0.9, 0.22, 0.5, 0.03, M.copper()); sc.remove(m); m.position.y = 0.11; g.add(m); s.sampleMat = m.material; const wire = S.mk.helix ? null : null; }
    else if (X.key === "covalent") { const gem = new T.Mesh(new T.OctahedronGeometry(0.22, 0), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.55, ior: 2.42, envMapIntensity: 4, emissive: new T.Color(0) })); gem.scale.y = 0.75; gem.position.y = 0.2; gem.castShadow = true; g.add(gem); s.sampleMat = gem.material; const st = S.mk.cyl(0.25, 0.3, 0.04, M.plastic(0x1a1a22, 0.3)); sc.remove(st); st.position.y = 0.02; g.add(st); }
    else if (X.key === "molecular") { const im = G.crystals(30, "box", [40, 30, 50], 0.6, { mat: new T.MeshPhysicalMaterial({ color: 0x2a2030, metalness: 0.6, roughness: 0.18, clearcoat: 1 }) }); im.layout((i) => ({ x: rnd(-0.3, 0.3), y: 0.03, z: rnd(-0.25, 0.25), rx: rnd(-0.2, 0.2), ry: rnd(0, 3), s: rnd(0.6, 1.2), sy: 0.25 })); g.add(im); }
    else { const q = new T.Group(); const mat = new T.MeshPhysicalMaterial({ color: 0xf6f2ee, roughness: 0.05, transparent: true, opacity: 0.6, clearcoat: 1, ior: 1.54, envMapIntensity: 3 }); const pr = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.5, 6), mat), pk = new T.Mesh(new T.ConeGeometry(0.12, 0.2, 6), mat); pr.position.y = 0.25; pk.position.y = 0.6; q.add(pr, pk); q.rotation.z = 0.25; q.position.x = -0.45; g.add(q); s.sampleMat = mat; s.sampleMat.emissive = new T.Color(0);
      const ice = G.crystals(6, "box", [240, 244, 248], 1.4, { mat: new T.MeshStandardMaterial({ color: 0xf2f5f8, roughness: 0.75 }) }); ice.layout((i) => ({ x: 0.35 + (i % 3) * 0.2, y: 0.06, z: (i > 2 ? 0.18 : -0.05), ry: rnd(0, 1) })); g.add(ice); s.dryIce = ice; }
  }
  C3.scenes.silicaCO2 = Object.assign({}, C3.scenes.solidTypes, { values: { type: 4, T: -100, test: 0 }, reset(S, s, c) { Object.assign(c, { type: 4, T: -100, test: 0 }); rebuild(S, s, c); } });
})();
