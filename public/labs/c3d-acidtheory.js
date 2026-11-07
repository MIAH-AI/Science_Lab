/* c3d-acidtheory.js — chemistry 3D, new modules: acid–base definitions and electrolyte strength; equilibrium constant Kc */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (x) => x * x * (3 - 2 * x);
  const FONT = "'IBM Plex Mono',monospace";
  const rnd = (() => { let a = 424242; return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  function sp(ctx, px, y, h, title, lines, fs) { H.panel(ctx, px, y, 240, h); ctx.textAlign = "left"; ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText(title, px + 8, y + 15); ctx.font = (fs || 8.6) + "px " + FONT; let yy = y + 29; lines.forEach((t) => { ctx.fillStyle = "#e8f0ff"; yy = wrapT(ctx, t, px + 8, yy, 224, 10.5) + 11.5; }); }
  const pillAt = (ctx, S, x, y, z, t, col, size) => { const p = S.proj(V3(x, y, z)); H.pill(ctx, p.x, p.y, t, col || "#cfe0f5", size || 9, "center"); };
  function disposeGroup(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.material.userData.keep) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); g.parent && g.parent.remove(g); }
  const COL = { H: 0xf4f4f4, C: 0x3b3f46, N: 0x3454e8, O: 0xe8281c, Cl: 0x22d03a, B: 0xffa8a0, F: 0x8ee04a }, RC = { H: 0.31, C: 0.76, N: 0.71, O: 0.66, Cl: 1.02, B: 0.84, F: 0.57 };
  function def(atoms, ord) { const b = []; for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) { const A = atoms[i], B = atoms[j], d = Math.hypot(A[1] - B[1], A[2] - B[2], A[3] - B[3]); if (d < (RC[A[0]] + RC[B[0]]) * 1.25) b.push([i, j, (ord && ord[i + "-" + j]) || 1]); } return { a: atoms, b }; }
  function mkMol(K, d, o) {
    o = o || {}; const n = d.a.length; let cx = 0, cy = 0, cz = 0; d.a.forEach((a) => { cx += a[1]; cy += a[2]; cz += a[3]; }); cx /= n; cy /= n; cz /= n;
    const mol = K.molecule({ atoms: d.a.map((a) => ({ el: a[0], p: [a[1] - cx, a[2] - cy, a[3] - cz] })), bonds: d.b }); mol.refresh(0.15); mol.atoms.forEach((at, i) => at.mesh.material.color.setHex(COL[d.a[i][0]] || 0xcccccc));
    const xs = d.a.map((a) => a[1]), ext = Math.max(...xs) - Math.min(...xs); mol.group.scale.setScalar(Math.min(o.max || 1, (o.fit || 99) / (ext * 1.15 + 1.1))); mol.def = d; return mol;
  }
  const tetH = (r) => [[r, r, r], [-r, -r, r], [-r, r, -r], [r, -r, -r]].map((p) => ["H", p[0], p[1], p[2]]);
  const ac = (anion) => { const a = [["C", -2.2, 0, 0], ["O", -1.45, -1.15, 0], ["O", -1.45, 1.15, 0]]; if (!anion) a.push(["H", -0.5, 1.15, 0]); a.push(["C", -3.7, 0, 0], ["H", -4.07, 1.02, 0], ["H", -4.07, -0.51, 0.89], ["H", -4.07, -0.51, -0.89]); return def(a, { "0-1": 2 }); };
  const LIBM = {
    hcl: Object.assign(def([["H", -0.64, 0, 0], ["Cl", 0.64, 0, 0]]), { f: "HCl", h: 0 }),
    cl: Object.assign(def([["Cl", 0, 0, 0]]), { f: "Cl⁻" }),
    h2o: Object.assign(def([["O", 0, 0, 0], ["H", 0.757, 0.586, 0], ["H", -0.757, 0.586, 0]]), { f: "H₂O", h: 1 }),
    h3o: Object.assign(def([["O", 0, 0.15, 0], ["H", 0.94, -0.25, 0], ["H", -0.47, -0.25, 0.81], ["H", -0.47, -0.25, -0.81]]), { f: "H₃O⁺" }),
    oh: Object.assign(def([["O", 0, 0, 0], ["H", 0.97, 0, 0]]), { f: "OH⁻" }),
    nh3: Object.assign(def([["N", 0, 0.1, 0], ["H", 0.94, -0.3, 0], ["H", -0.47, -0.3, 0.81], ["H", -0.47, -0.3, -0.81]]), { f: "NH₃" }),
    nh4: Object.assign(def([["N", 0, 0, 0]].concat(tetH(0.58))), { f: "NH₄⁺" }),
    ch3cooh: Object.assign(ac(false), { f: "CH₃COOH", h: 3 }), ch3coo: Object.assign(ac(true), { f: "CH₃COO⁻" }),
    hplus: Object.assign(def([["H", 0, 0, 0]]), { f: "H⁺" }),
    bf3: Object.assign(def([["B", 0, 0, 0], ["F", 1.31, 0, 0], ["F", -0.655, 0, 1.134], ["F", -0.655, 0, -1.134]]), { f: "BF₃" }),
    adduct: Object.assign(def([["B", 0, 0, 0], ["N", 0, 1.67, 0], ["H", 0.94, 2.0, 0], ["H", -0.47, 2.0, 0.81], ["H", -0.47, 2.0, -0.81], ["F", 1.2, -0.45, 0], ["F", -0.6, -0.45, 1.04], ["F", -0.6, -0.45, -1.04]]), { f: "H₃N→BF₃" }),
  };
  const BLR = {
    hcl: { a: "hcl", b: "h2o", cb: "cl", ca: "h3o", eq: "HCl + H₂O → Cl⁻ + H₃O⁺", note: "HCl donates a proton to water: HCl is the acid and H₂O the base. Cl⁻ is the conjugate base of HCl; H₃O⁺ is the conjugate acid of H₂O. HCl is a strong acid, so the reaction goes to completion.", strong: 1 },
    nh3: { a: "h2o", b: "nh3", cb: "oh", ca: "nh4", eq: "NH₃ + H₂O ⇌ NH₄⁺ + OH⁻", note: "Ammonia accepts a proton from water: NH₃ is the base and water the acid (water is amphoteric). OH⁻ is the conjugate base of water; NH₄⁺ is the conjugate acid of NH₃. Ammonia is a weak base, so equilibrium lies to the left.", strong: 0 },
    ch3: { a: "ch3cooh", b: "h2o", cb: "ch3coo", ca: "h3o", eq: "CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺", note: "Ethanoic acid donates one proton to water, but only about 1 % of molecules ionise at 0.1 mol/dm³: a weak acid. CH₃COO⁻ is the conjugate base, and it is a fairly strong base because the acid is weak.", strong: 0 },
    auto: { a: "h2o", b: "h2o", cb: "oh", ca: "h3o", eq: "H₂O + H₂O ⇌ OH⁻ + H₃O⁺", note: "Water reacts with itself: one molecule acts as an acid, the other as a base. At 25 °C [H₃O⁺] = [OH⁻] = 1.0 × 10⁻⁷ mol/dm³, so Kw = 1.0 × 10⁻¹⁴.", strong: 0 },
    nh3hcl: { a: "hcl", b: "nh3", cb: "cl", ca: "nh4", eq: "HCl + NH₃ → Cl⁻ + NH₄⁺", note: "Even without water HCl is an acid and NH₃ a base: a proton passes from HCl to NH₃. This gives the white smoke of ammonium chloride when the two gases meet.", strong: 1 },
  };
  const BK = Object.keys(BLR);
  const LW = {
    nh3bf3: { a: "bf3", b: "nh3", p: "adduct", eq: "NH₃ + BF₃ → H₃N→BF₃", note: "NH₃ has a lone pair of electrons on N: it is a Lewis base (electron-pair donor). BF₃ has an empty orbital on B: it is a Lewis acid (electron-pair acceptor). The lone pair forms a dative (coordinate) covalent bond N→B." },
    nh3h: { a: "hplus", b: "nh3", p: "nh4", eq: "NH₃ + H⁺ → NH₄⁺", note: "The bare proton H⁺ accepts the lone pair on NH₃ to form a dative bond. Once formed, the dative bond is identical to the other three N–H bonds in NH₄⁺." },
    h2oh: { a: "hplus", b: "h2o", p: "h3o", eq: "H₂O + H⁺ → H₃O⁺", note: "Water uses a lone pair on O to bond to H⁺: this is how H⁺(aq) really exists, as the hydroxonium ion H₃O⁺, with one dative covalent bond." },
  };
  const LK = Object.keys(LW);
  /* electrolytes: alpha from Ka or Kb (weak) or fixed */
  const EL = {
    hcl: { n: "Hydrochloric acid, HCl", type: "strong acid", k: 0, A: "H⁺", B: "Cl⁻", kind: "acid" },
    hno3: { n: "Nitric acid, HNO₃", type: "strong acid", k: 0, A: "H⁺", B: "NO₃⁻", kind: "acid" },
    naoh: { n: "Sodium hydroxide, NaOH", type: "strong base", k: 0, A: "Na⁺", B: "OH⁻", kind: "base" },
    nacl: { n: "Sodium chloride, NaCl", type: "salt (strong electrolyte)", k: 0, A: "Na⁺", B: "Cl⁻", kind: "salt" },
    ch3cooh: { n: "Ethanoic acid, CH₃COOH", type: "weak acid", k: 1.8e-5, A: "H⁺", B: "CH₃COO⁻", kind: "acid" },
    hf: { n: "Hydrofluoric acid, HF", type: "weak acid", k: 6.8e-4, A: "H⁺", B: "F⁻", kind: "acid" },
    nh3: { n: "Ammonia solution, NH₃", type: "weak base", k: 1.8e-5, A: "NH₄⁺", B: "OH⁻", kind: "base" },
    glucose: { n: "Glucose, C₆H₁₂O₆", type: "non-electrolyte", k: -1, A: "", B: "", kind: "none" },
    ethanol: { n: "Ethanol, C₂H₅OH", type: "non-electrolyte", k: -1, A: "", B: "", kind: "none" },
  };
  const EK = Object.keys(EL);
  const alpha = (e, c) => (e.k < 0 ? 0 : e.k === 0 ? 1 : clamp(Math.sqrt(e.k / c), 0, 1));

  C3.scenes.acidDefinitions = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[2.6, 2.0, 12.0], [2.6, 2.0, 0]],
    values: { mode: "bl", bl: "hcl", lw: "nh3bf3", el: "ch3cooh", conc: 0.1, run: 1, prog: 0 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Activity", options: [{ value: "bl", label: "Brønsted–Lowry: proton transfer, conjugate pairs" }, { value: "lewis", label: "Lewis: electron-pair donation" }, { value: "strength", label: "Strong and weak electrolytes" }] },
        { type: "select", key: "bl", label: "Reaction (Brønsted–Lowry)", options: BK.map((k) => ({ value: k, label: BLR[k].eq })) },
        { type: "select", key: "lw", label: "Reaction (Lewis)", options: LK.map((k) => ({ value: k, label: LW[k].eq })) },
        { type: "range", key: "prog", label: "Progress of the reaction (%)", min: 0, max: 100, step: 1, unit: " %" },
        { type: "toggle", key: "run", label: "Run automatically" },
        { type: "select", key: "el", label: "Electrolyte (strength)", options: EK.map((k) => ({ value: k, label: EL[k].n + " — " + EL[k].type })) },
        { type: "range", key: "conc", label: "Concentration, c (strength)", min: 0.01, max: 1, step: 0.01, unit: " mol/dm³" },
      ];
    },
    views: [{ label: "Wide", cam: [[2.6, 2.0, 12.0], [2.6, 2.0, 0]] }, { label: "Close", cam: [[2.2, 2.0, 9.5], [2.2, 2.0, 0]] }],
    note: "Arrhenius: an acid gives H⁺ (H₃O⁺) in water and a base gives OH⁻. Brønsted–Lowry: an acid is a proton (H⁺) donor and a base is a proton acceptor. Every acid has a conjugate base (what is left after it loses H⁺), and every base has a conjugate acid; the stronger the acid, the weaker its conjugate base. Water is amphoteric: it can act as an acid or a base. Lewis: an acid is an electron-pair acceptor and a base is an electron-pair donor, so a Lewis acid–base reaction forms a dative (coordinate) covalent bond; this includes acids with no H such as BF₃. Strength is not concentration: a strong acid or base ionises completely in water (HCl, HNO₃, H₂SO₄, NaOH, KOH) while a weak one ionises only slightly (CH₃COOH, HF, H₂CO₃, NH₃). Strong electrolytes carry current well because there are many free ions; weak electrolytes carry little; non-electrolytes (glucose, ethanol) carry none. For weak acids α ≈ √(Ka/c). Particle numbers and sizes are schematic.",
    onChange(S, s, c, key) { if (key === "mode" || key === "bl" || key === "lw") { c.prog = 0; rebuild(S, s, c); if (key === "mode") C3.setView(S, { cam: c.mode === "strength" ? [[2.2, 2.6, 11.6], [2.2, 2.1, 0]] : [[2.6, 2.0, 12.0], [2.6, 2.0, 0]] }); } },
    reset(S, s, c) { Object.assign(c, { mode: "bl", bl: "hcl", lw: "nh3bf3", el: "ch3cooh", conc: 0.1, run: 1, prog: 0 }); rebuild(S, s, c); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Electrolyte</th><th style="text-align:left">Type</th><th style="text-align:left">Ionisation (0.1 mol/dm³)</th></tr>' + EK.map((k) => '<tr><td style="text-align:left">' + EL[k].n + '</td><td style="text-align:left">' + EL[k].type + '</td><td style="text-align:left">' + (EL[k].k < 0 ? "none" : (alpha(EL[k], 0.1) * 100 >= 99.5 ? "≈ 100 %" : (alpha(EL[k], 0.1) * 100).toFixed(1) + " %")) + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.root = new T.Group(); s.root.position.set(0, 2.0, 0); S.scene.add(s.root); s.mols = []; s.labs = [];
      s.proton = new T.Mesh(new T.SphereGeometry(0.16, 16, 12), new T.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffa010, emissiveIntensity: 0.8 })); S.scene.add(s.proton); s.proton.visible = false;
      s.sg = new T.Group(); S.scene.add(s.sg); s.sg.position.set(0, -0.2, 0);
      const bx = new T.Mesh(new T.BoxGeometry(3.6, 2.4, 1.8), new T.MeshPhysicalMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false, side: T.DoubleSide })); bx.position.set(0, 1.3, 0); s.sg.add(bx);
      [-1, 1].forEach((sg) => { const e = new T.Mesh(new T.BoxGeometry(0.1, 2.6, 1.4), M.steel()); e.position.set(sg * 1.55, 1.4, 0); s.sg.add(e); const w = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.9, 8), M.steel()); w.position.set(sg * 1.55, 3.1, 0); s.sg.add(w); }); const wt = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 3.1, 8), M.steel()); wt.rotation.z = Math.PI / 2; wt.position.set(0, 3.5, 0); s.sg.add(wt);
      s.bulb = new T.Mesh(new T.SphereGeometry(0.4, 24, 18), new T.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffc83a, emissiveIntensity: 0, transparent: true, opacity: 0.9, roughness: 0.2 })); s.bulb.position.set(0, 3.9, 0); s.sg.add(s.bulb); s.glow = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(64, "rgba(255,210,90,1)"), color: 0xffd25a, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); s.glow.scale.set(2.6, 2.6, 1); s.glow.position.copy(s.bulb.position); s.sg.add(s.glow);
      s.un = []; for (let i = 0; i < 48; i++) { const a = new T.Mesh(new T.SphereGeometry(0.13, 12, 10), new T.MeshStandardMaterial({ roughness: 0.4 })), b = new T.Mesh(new T.SphereGeometry(0.17, 12, 10), new T.MeshStandardMaterial({ roughness: 0.4 })); const bond = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1, 6), new T.MeshStandardMaterial({ color: 0xc8cfd8, roughness: 0.5 })); const u = { a, b, bond, pa: V3((rnd() - 0.5) * 2.8, 0.4 + rnd() * 1.8, (rnd() - 0.5) * 1.2), pb: V3(0, 0, 0), va: V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.1), vb: V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.1), ion: false }; u.pb.copy(u.pa).add(V3(0.3, 0, 0)); s.sg.add(a, b, bond); s.un.push(u); }
      rebuild(S, s, c);
    },
    update(S, s, c, dt) {
      const st = c.mode === "strength"; s.sg.visible = st; s.root.visible = !st; s.proton.visible = false; const d = clamp(dt, 0, 0.05);
      if (!st) { if (c.run && c.prog < 100) c.prog = Math.min(100, c.prog + dt * 14); const p = c.prog / 100; if (c.mode === "bl" && s.mols.length >= 4) { const r = BLR[c.bl], A = s.mols[0], tgt = s.mols[3]; const p0 = A.group.localToWorld(A.atoms[LIBM[r.a].h || 0].mesh.position.clone()).add(V3(0, 0, 0.1)), p1 = tgt.group.position.clone().add(s.root.position).add(V3(0, 0.5, 0.3)); const f = sm(p), mid = p0.clone().lerp(p1, 0.5).add(V3(0, 0.0, 0.0)); s.proton.position.set(p0.x + (p1.x - p0.x) * f, p0.y + (p1.y - p0.y) * f + 0.5 * Math.sin(f * Math.PI), p0.z + 0.6 * Math.sin(f * Math.PI)); s.proton.visible = p > 0.02 && p < 0.98; s.mols.forEach((m, i) => { m.group.visible = i < 2 ? true : true; }); }
        if (c.mode === "lewis" && s.mols.length >= 3) { const r = LW[c.lw]; s.mols[2].group.visible = p > 0.5; s.mols[0].group.visible = p <= 0.5; s.mols[1].group.visible = p <= 0.5; if (p > 0.02 && p <= 0.5) { const A = s.mols[0].group.position, B = s.mols[1].group.position, f = p / 0.5; s.mols[0].group.position.x = -1.5 + 1.0 * f * 0.0; } s.root.children.forEach((o) => 0); const ff = sm(clamp(p / 0.5, 0, 1)); s.mols[0].group.position.x = -1.6 + 0.9 * ff; s.mols[1].group.position.x = 1.7 - 0.9 * ff; s.proton.visible = false; }
      } else {
        const e = EL[c.el], al = alpha(e, c.conc), n = 48, ionN = Math.round(al * n), kk = e.k < 0 ? 0 : 1; s.al = al;
        s.un.forEach((u, i) => { const want = e.kind !== "none" && i < ionN, tr = e.kind === "none" ? 0x9aa4b4 : null; if (want !== u.ion) { u.ion = want; if (!want) u.pb.copy(u.pa).add(V3(0.3, 0, 0)); } const colA = e.kind === "base" ? 0x4a8fe8 : e.kind === "salt" ? 0x4a8fe8 : 0xffd23a, colB = e.kind === "acid" ? 0x58d68d : e.kind === "salt" ? 0x58d68d : e.kind === "base" ? 0xe8503a : 0x9aa4b4; u.a.material.color.setHex(e.kind === "none" ? 0x9aa4b4 : colA); u.b.material.color.setHex(colB); u.a.scale.setScalar(e.kind === "none" ? 1.2 : 1); u.b.scale.setScalar(e.kind === "none" ? 1.5 : 1); const step = (p, v, f) => { p.addScaledVector(v, d * f); ["x", "y", "z"].forEach((ax, k) => { const lim = [1.55, [0.25, 2.35], 0.7][k]; if (k === 1) { if (p.y < lim[0]) { p.y = lim[0]; v.y = Math.abs(v.y); } if (p.y > lim[1]) { p.y = lim[1]; v.y = -Math.abs(v.y); } } else { if (p[ax] < -lim) { p[ax] = -lim; v[ax] = Math.abs(v[ax]); } if (p[ax] > lim) { p[ax] = lim; v[ax] = -Math.abs(v[ax]); } } }); if (Math.random() < 0.02) v.add(V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.8)); if (v.length() > 1.4) v.multiplyScalar(0.9); };
          step(u.pa, u.va, 1); if (u.ion) step(u.pb, u.vb, 1); else u.pb.copy(u.pa).add(V3(0.3, 0.0, 0)); u.a.position.copy(u.pa); u.b.position.copy(u.pb); u.bond.visible = !u.ion; if (!u.ion) { u.bond.position.copy(u.pa).addScaledVector(V3(0.3, 0, 0), 0.5); u.bond.scale.set(1, 0.3, 1); u.bond.rotation.z = Math.PI / 2; } });
        const cond = al * c.conc; s.cond = cond; const lum = clamp(cond / 0.6, 0, 1); s.bulb.material.emissiveIntensity = 2.2 * lum; s.glow.material.opacity = 0.85 * lum;
      }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, p = c.prog / 100;
      if (c.mode === "bl") {
        const r = BLR[c.bl]; H.pill(ctx, 10, 22, "Brønsted–Lowry: " + r.eq, "#ffe9b8", 9.4); H.pill(ctx, 10, 44, "acid = proton donor    base = proton acceptor", "#9fe3ff", 9); H.pill(ctx, 10, 66, "yellow ball = H⁺ moving    progress " + c.prog.toFixed(0) + " %", "#ffd27a", 8.8);
        const Y0 = 2.0 + 1.6, Y1 = 2.0 - 1.15, xs = [-1.55, 1.7]; pillAt(ctx, S, xs[0], Y0 - 1.05, 0, "acid 1: " + LIBM[r.a].f, "#ff9a8a", 9); pillAt(ctx, S, xs[1], Y0 - 1.05, 0, "base 2: " + LIBM[r.b].f, "#9fc4ff", 9); pillAt(ctx, S, xs[0], Y1 - 1.35, 0, "base 1: " + LIBM[r.cb].f, "#9fc4ff", 9); pillAt(ctx, S, xs[1], Y1 - 1.35, 0, "acid 2: " + LIBM[r.ca].f, "#ff9a8a", 9);
        pillAt(ctx, S, -0.2, 2.0 + 0.0, 0, "↓  conjugate pairs: acid 1 / base 1 and base 2 / acid 2", "#ffe9b8", 8.4);
        sp(ctx, px, 58, 150, "What happens", [r.note], 8.3); sp(ctx, px, 216, 104, "Conjugate pairs", [LIBM[r.a].f + " / " + LIBM[r.cb].f + "   (acid / conjugate base)", LIBM[r.ca].f + " / " + LIBM[r.b].f + "   (conjugate acid / base)", "Strong acid → very weak conjugate base."], 8.3);
      } else if (c.mode === "lewis") {
        const r = LW[c.lw]; H.pill(ctx, 10, 22, "Lewis: " + r.eq, "#ffe9b8", 9.6); H.pill(ctx, 10, 44, "base donates an electron pair; acid accepts it", "#9fe3ff", 9); H.pill(ctx, 10, 66, p > 0.5 ? "dative (coordinate) covalent bond formed" : "lone pair approaches the empty orbital", p > 0.5 ? "#8dffb8" : "#ffd27a", 8.8);
        if (p <= 0.5) { pillAt(ctx, S, s.mols[0] ? s.mols[0].group.position.x : -1.6, 2.0 + 1.5, 0, "Lewis acid: " + LIBM[r.a].f + " (accepts pair)", "#ff9a8a", 8.6); pillAt(ctx, S, s.mols[1] ? s.mols[1].group.position.x : 1.7, 2.0 + 1.5, 0, "Lewis base: " + LIBM[r.b].f + " (donates pair)", "#9fc4ff", 8.6); } else pillAt(ctx, S, 0.1, 2.0 + 1.5, 0, LIBM[r.p].f + " : N→B / O→H dative bond", "#8dffb8", 9);
        sp(ctx, px, 58, 150, "What happens", [r.note], 8.3); sp(ctx, px, 216, 104, "Three definitions", ["Arrhenius: H⁺ / OH⁻ in water", "Brønsted–Lowry: proton donor / acceptor", "Lewis: electron-pair acceptor / donor"], 8.3);
      } else {
        const e = EL[c.el], al = s.al || 0, cond = s.cond || 0; H.pill(ctx, 10, 22, e.n + "   c = " + c.conc.toFixed(2) + " mol/dm³", "#ffe9b8", 9.6); H.pill(ctx, 10, 44, e.type + ":  " + (e.kind === "none" ? "no ions, bulb stays off" : "α = " + (al * 100).toFixed(al > 0.995 ? 0 : 1) + " % ionised"), "#9fe3ff", 9.2); H.pill(ctx, 10, 66, "bulb brightness ∝ ion concentration = α·c = " + cond.toFixed(3) + " mol/dm³", cond > 0.3 ? "#8dffb8" : "#ffb48a", 8.8);
        const q = S.proj(V3(0, 0.2 + 0.5, 0.95)); if (e.kind !== "none") { H.pill(ctx, q.x - 70, q.y + 8, e.A + " (ion)", "#ffd27a", 8.4, "center"); H.pill(ctx, q.x + 70, q.y + 8, e.B + " (ion)", "#8fe3a0", 8.4, "center"); } else H.pill(ctx, q.x, q.y + 8, "molecules stay whole", "#cfd8ea", 8.4, "center");
        const pH = e.kind === "acid" ? -Math.log10(Math.max(al * c.conc, 1e-14)) : e.kind === "base" ? 14 + Math.log10(Math.max(al * c.conc, 1e-14)) : 7;
        sp(ctx, px, 58, 128, "Ionisation", [e.k === 0 ? "complete: strong electrolyte, one-way arrow →" : e.k < 0 ? "none: non-electrolyte, no free ions" : "partial: weak electrolyte, ⇌ with α = √(K/c)", "free ions: " + Math.round(al * 48) + " of 48 units shown", e.kind === "acid" || e.kind === "base" ? "pH of the solution = " + pH.toFixed(2) : "neutral salt or molecule"], 8.4);
        sp(ctx, px, 194, 126, "Strength vs concentration", ["Strong: fully ionised at any c.", "Weak: α rises as it is diluted (α = √(K/c)).", "A dilute strong acid can have lower conductivity than a concentrated weak one."], 8.3);
      }
      ctx.restore();
    },
    readouts(s, c) { if (c.mode === "bl") { const r = BLR[c.bl]; return [["Reaction", r.eq], ["Acid 1 / base 1", LIBM[r.a].f + " / " + LIBM[r.cb].f], ["Base 2 / acid 2", LIBM[r.b].f + " / " + LIBM[r.ca].f], ["Strength", r.strong ? "goes to completion (strong acid)" : "reversible (weak)"]]; } if (c.mode === "lewis") { const r = LW[c.lw]; return [["Reaction", r.eq], ["Lewis acid (acceptor)", LIBM[r.a].f], ["Lewis base (donor)", LIBM[r.b].f], ["Bond formed", "dative (coordinate) covalent"]]; } const e = EL[c.el], al = alpha(e, c.conc); return [["Electrolyte", e.n], ["Type", e.type], ["Degree of ionisation α", e.k < 0 ? "0 %" : (al * 100).toFixed(2) + " %"], ["Ion concentration α·c", (al * c.conc).toFixed(4) + " mol/dm³"], ["Conduction", e.k < 0 ? "none" : al * c.conc > 0.3 ? "good" : "poor"]]; },
    steps(s, c) { return [["Find the proton donor and acceptor in each reaction", c.mode === "bl" ? "now" : "done"], ["Name both conjugate pairs", ""], ["See how a Lewis base donates a lone pair to BF₃", c.mode === "lewis" ? "now" : ""], ["Compare HCl and ethanoic acid conductivity at equal concentration", c.mode === "strength" ? "now" : ""]]; },
  };
  function rebuild(S, s, c) {
    while (s.root.children.length) disposeGroup(s.root.children[0]); s.mols = []; s.root.rotation.y = 0;
    const add = (k, x, y, fit) => { const m = mkMol(s.K, LIBM[k], { fit: fit || 2.8, max: 0.7 }); m.group.position.set(x, y, 0); s.root.add(m.group); s.mols.push(m); return m; };
    if (c.mode === "bl") { const r = BLR[c.bl]; add(r.a, -1.55, 1.6); add(r.b, 1.7, 1.6); add(r.cb, -1.55, -1.15); add(r.ca, 1.7, -1.15); }
    else if (c.mode === "lewis") { const r = LW[c.lw]; add(r.a, -1.6, 0.2, 2.6); add(r.b, 1.7, 0.2, 2.6); const m = add(r.p, 0.1, 0.2, 3.0); m.group.visible = false; }
  }

  /* =================== EQUILIBRIUM CONSTANT Kc =================== */
  const ER = {
    n2o4: { eq: "N₂O₄ ⇌ 2NO₂", sp: [["N₂O₄", 1], ["", 0], ["NO₂", 2], ["", 0]], K: 0.0059, cond: "25 °C", init: [0.5, 0, 0, 0], note: "Colourless N₂O₄ dissociates to brown NO₂. Kc is small at 25 °C, so mostly N₂O₄ remains." },
    hi: { eq: "H₂ + I₂ ⇌ 2HI", sp: [["H₂", 1], ["I₂", 1], ["HI", 2], ["", 0]], K: 54, cond: "430 °C", init: [1, 1, 0, 0], note: "Kc = 54 at 430 °C, so the products are favoured. The number of moles of gas is the same on both sides, so Kc has no units and pressure does not change the position." },
    nh3: { eq: "N₂ + 3H₂ ⇌ 2NH₃", sp: [["N₂", 1], ["H₂", 3], ["NH₃", 2], ["", 0]], K: 0.5, cond: "400 °C", init: [1, 1.5, 0, 0], note: "Kc = 0.50 mol⁻² dm⁶ at 400 °C: the Haber process gives only a modest yield per pass, so unreacted gas is recycled." },
    ester: { eq: "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O", sp: [["ethanoic acid", 1], ["ethanol", 1], ["ethyl ethanoate", 1], ["water", 1]], K: 4, cond: "25 °C", init: [1, 1, 0, 0], note: "Kc = 4, so starting with 1 mol each gives about 67 % conversion. Adding more of one reagent pushes the equilibrium to the right." },
  };
  const RK = Object.keys(ER);
  const SC = [0xe8503a, 0xe8a23a, 0x4a8fe8, 0x3ac8b8];
  function solveEq(r, c0) {
    const co = r.sp.map((q) => q[1]); const K = r.K; const conc = (xi) => co.map((v, i) => (i < 2 ? c0[i] - v * xi : c0[i] + v * xi));
    let lo = -Infinity, hi = Infinity; co.forEach((v, i) => { if (!v) return; if (i < 2) hi = Math.min(hi, c0[i] / v); else lo = Math.max(lo, -c0[i] / v); }); if (!isFinite(lo)) lo = -1e3; if (!isFinite(hi)) hi = 1e3;
    const Q = (cc) => { let n = 1, d = 1; co.forEach((v, i) => { if (!v) return; if (i < 2) d *= Math.pow(Math.max(cc[i], 0), v); else n *= Math.pow(Math.max(cc[i], 0), v); }); return d === 0 ? Infinity : n / d; };
    if (hi - lo < 1e-9) return { xi: 0, eq: c0.slice(), Q0: Q(c0), none: true, Q };
    let a = lo, b = hi; for (let i = 0; i < 90; i++) { const m = (a + b) / 2; const q = Q(conc(m)); if (q > K) b = m; else a = m; } const xi = (a + b) / 2; return { xi, eq: conc(xi), Q0: Q(c0), none: false, Q, conc };
  }
  C3.scenes.equilibriumConstant = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[2.2, 2.4, 10.4], [2.2, 1.9, 0]],
    values: { rx: "hi", a0: 1, b0: 1, c0: 0, d0: 0, run: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "rx", label: "Reaction", options: RK.map((k) => ({ value: k, label: ER[k].eq + "   (Kc = " + ER[k].K + ", " + ER[k].cond + ")" })) },
        { type: "range", key: "a0", label: "Initial [reactant 1]", min: 0, max: 2, step: 0.05, unit: " mol/dm³" },
        { type: "range", key: "b0", label: "Initial [reactant 2] (if present)", min: 0, max: 2, step: 0.05, unit: " mol/dm³" },
        { type: "range", key: "c0", label: "Initial [product 1]", min: 0, max: 2, step: 0.05, unit: " mol/dm³" },
        { type: "range", key: "d0", label: "Initial [product 2] (if present)", min: 0, max: 2, step: 0.05, unit: " mol/dm³" },
        { type: "toggle", key: "run", label: "Run to equilibrium" },
        { type: "button", label: "Restart from the initial mixture", action: (S, s, c) => { s.t = 0; } },
      ];
    },
    views: [{ label: "Front", cam: [[2.2, 2.4, 10.4], [2.2, 1.9, 0]] }, { label: "Close", cam: [[1.6, 2.2, 7.2], [1.6, 1.9, 0]] }],
    note: "At equilibrium the forward and reverse rates are equal and the concentrations stay constant. For a A + b B ⇌ c C + d D the equilibrium constant is Kc = [C]ᶜ[D]ᵈ / ([A]ᵃ[B]ᵇ), using equilibrium concentrations in mol/dm³; pure solids and liquids do not appear. Kc depends only on temperature: a large Kc means products are favoured, a small Kc means reactants. The reaction quotient Q has the same form but uses the concentrations at any moment: if Q < Kc the reaction goes forward, if Q > Kc it goes in reverse, and at Q = Kc it is at equilibrium. An ICE table (Initial, Change, Equilibrium) is used to find the equilibrium concentrations. Catalysts and changes in concentration or pressure do not change Kc, only temperature does. The approach to equilibrium here is drawn as an exponential relaxation; real rates depend on the mechanism, so time is only qualitative.",
    onChange(S, s, c, key) { if (key === "rx") { const r = ER[c.rx]; c.a0 = r.init[0]; c.b0 = r.init[1]; c.c0 = r.init[2]; c.d0 = r.init[3]; } s.t = 0; },
    reset(S, s, c) { Object.assign(c, { rx: "hi", a0: 1, b0: 1, c0: 0, d0: 0, run: 1 }); s.t = 0; },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Reaction</th><th style="text-align:left">Kc</th><th style="text-align:left">Conditions</th></tr>' + RK.map((k) => '<tr><td style="text-align:left">' + ER[k].eq + '</td><td style="text-align:left">' + ER[k].K + '</td><td style="text-align:left">' + ER[k].cond + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) {
      S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.t = 0; const bx = new T.Mesh(new T.BoxGeometry(3.8, 2.6, 1.8), new T.MeshPhysicalMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.14, roughness: 0.05, depthWrite: false, side: T.DoubleSide })); bx.position.set(0, 1.4, 0); S.scene.add(bx);
      s.pool = [[], [], [], []]; for (let k = 0; k < 4; k++) for (let i = 0; i < 60; i++) { const m = new T.Mesh(new T.SphereGeometry(0.11, 12, 10), new T.MeshStandardMaterial({ color: SC[k], roughness: 0.35 })); m.userData = { p: V3((rnd() - 0.5) * 3.2, 0.2 + rnd() * 2.2, (rnd() - 0.5) * 1.4), v: V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(1.4) }; S.scene.add(m); s.pool[k].push(m); }
    },
    update(S, s, c, dt) {
      const r = ER[c.rx], c0 = [c.a0, r.sp[1][1] ? c.b0 : 0, c.c0, r.sp[3][1] ? c.d0 : 0]; const sol = solveEq(r, c0); s.sol = sol; s.c0 = c0; if (c.run) s.t += dt; const tau = 3.5, f = sol.none ? 1 : 1 - Math.exp(-s.t / tau), xi = sol.xi * f; s.xi = xi; const cur = sol.none ? c0 : sol.conc(xi); s.cur = cur; s.Qn = sol.none ? 0 : sol.Q(cur);
      const d = clamp(dt, 0, 0.05); s.pool.forEach((arr, k) => { const n = r.sp[k][1] ? Math.min(60, Math.round(cur[k] * 24)) : 0; arr.forEach((m, i) => { m.visible = i < n; if (!m.visible) return; const u = m.userData; u.p.addScaledVector(u.v, d); [["x", 1.7], ["y", 1.2], ["z", 0.75]].forEach(([ax, lim]) => { const ctr = ax === "y" ? 1.4 : 0, q = u.p[ax] - ctr; if (q < -lim) { u.p[ax] = ctr - lim; u.v[ax] = Math.abs(u.v[ax]); } if (q > lim) { u.p[ax] = ctr + lim; u.v[ax] = -Math.abs(u.v[ax]); } }); if (Math.random() < 0.02) u.v.add(V3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.9)); if (u.v.length() > 1.6) u.v.multiplyScalar(0.9); m.position.copy(u.p); }); });
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, r = ER[c.rx], sol = s.sol, cur = s.cur || [0, 0, 0, 0], K = r.K; const nm = r.sp.map((q) => q[0]);
      const Kexp = (() => { const num = [2, 3].filter((i) => r.sp[i][1]).map((i) => "[" + nm[i] + "]" + (r.sp[i][1] > 1 ? "^" + r.sp[i][1] : "")).join(""), den = [0, 1].filter((i) => r.sp[i][1]).map((i) => "[" + nm[i] + "]" + (r.sp[i][1] > 1 ? "^" + r.sp[i][1] : "")).join(""); return num + " / " + den; })();
      const dn = r.sp[2][1] + r.sp[3][1] - r.sp[0][1] - r.sp[1][1];
      H.pill(ctx, 10, 22, r.eq + "     Kc = " + K + " (" + r.cond + ")", "#ffe9b8", 9.2); H.pill(ctx, 10, 44, "Kc = " + Kexp, "#9fe3ff", 9);
      const dir = sol.none ? "no reaction possible" : Math.abs(s.Qn - K) / K < 0.01 ? "at equilibrium: Q = Kc" : s.Qn < K ? "Q < Kc: reaction goes forward →" : "Q > Kc: reaction goes in reverse ←"; H.pill(ctx, 10, 66, "Q = " + (isFinite(s.Qn) ? (s.Qn < 0.001 && s.Qn > 0 ? s.Qn.toExponential(2) : s.Qn.toFixed(3)) : "∞") + "   " + dir, Math.abs(s.Qn - K) / K < 0.01 ? "#8dffb8" : "#ffd27a", 8.8);
      /* legend below box */
      let lx = 20; [0, 1, 2, 3].forEach((i) => { if (!r.sp[i][1]) return; const col = "#" + SC[i].toString(16).padStart(6, "0"); const pp = S.proj(V3(-1.6 + i * 0.0, 0, 0)); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx, 344, 5, 0, 7); ctx.fill(); ctx.fillStyle = "#e8f0ff"; ctx.font = "8.6px " + FONT; ctx.textAlign = "left"; ctx.fillText(nm[i] + " " + cur[i].toFixed(2), lx + 9, 347); lx += 18 + ctx.measureText(nm[i] + " " + cur[i].toFixed(2)).width + 8; });
      /* ICE table */
      H.panel(ctx, px, 58, 240, 140); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("ICE table (mol/dm³)", px + 8, 73); ctx.font = "8.3px " + FONT; ctx.fillStyle = "#9fb2d2"; ctx.fillText("species", px + 8, 88); ["Initial", "Change", "Equilib."].forEach((t, i) => ctx.fillText(t, px + 100 + i * 46, 88));
      let yy = 102; [0, 1, 2, 3].forEach((i) => { if (!r.sp[i][1]) return; const c0 = s.c0[i], eqv = sol.eq[i]; ctx.fillStyle = "#e8f0ff"; ctx.fillText(nm[i].slice(0, 12), px + 8, yy); ctx.fillText(c0.toFixed(2), px + 100, yy); const ch = eqv - c0; ctx.fillText((ch >= 0 ? "+" : "") + ch.toFixed(3), px + 146, yy); ctx.fillStyle = "#ffd27a"; ctx.fillText(eqv.toFixed(3), px + 192, yy); yy += 14; });
      ctx.fillStyle = "#9fb2d2"; ctx.font = "8px " + FONT; ctx.fillText("Kc check: Q at equilibrium = " + (sol.none ? "—" : sol.Q(sol.eq).toFixed(sol.Q(sol.eq) < 0.01 ? 4 : 2)), px + 8, 184);
      H.panel(ctx, px, 206, 240, 114); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Concentration against time", px + 8, 221);
      const tmax = 14, series = []; [0, 1, 2, 3].forEach((i) => { if (!r.sp[i][1]) return; const pts = []; for (let t = 0; t <= tmax; t += 0.5) { const f = sol.none ? 1 : 1 - Math.exp(-t / 3.5), v = sol.none ? s.c0[i] : sol.conc(sol.xi * f)[i]; pts.push([t, v]); } series.push({ pts, color: "#" + SC[i].toString(16).padStart(6, "0"), width: 2 }); });
      const ymax = Math.max(0.5, ...sol.eq, ...s.c0) * 1.1; H.graph(ctx, px + 8, 228, 224, 76, { series, xmin: 0, xmax: tmax, ymin: 0, ymax, ticksX: 3, ticksY: 2, xl: "t (schematic)", yl: "c", dot: [Math.min(s.t, tmax), cur[0], "#ffffff"] });
      ctx.restore();
    },
    readouts(s, c) { const r = ER[c.rx], sol = s.sol, K = r.K, dn = r.sp[2][1] + r.sp[3][1] - r.sp[0][1] - r.sp[1][1]; if (!sol) return [["Reaction", r.eq]]; return [["Reaction", r.eq], ["Kc (" + r.cond + ")", String(K) + (dn === 0 ? " (no units)" : " (mol/dm³)^" + dn)], ["Q now", isFinite(s.Qn) ? s.Qn.toPrecision(3) : "∞"], ["Direction", sol.none ? "none" : Math.abs(s.Qn - K) / K < 0.01 ? "at equilibrium" : s.Qn < K ? "forward" : "reverse"], ["Extent ξ at equilibrium", sol.xi.toFixed(3) + " mol/dm³"], ["Yield of products", r.sp[2][1] ? (100 * (sol.eq[2] - s.c0[2]) / Math.max(1e-9, (s.c0[0] / r.sp[0][1]) * r.sp[2][1])).toFixed(0) + " % of maximum" : "—"]]; },
    steps(s, c) { return [["Write the Kc expression from the equation", "done"], ["Fill in the ICE table and find the equilibrium concentrations", "now"], ["Compare Q with Kc to predict the direction", ""], ["Change the initial amounts: does Kc change? (no, only temperature does)", ""]]; },
  };
})();
