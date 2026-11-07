/* c3d-organic2.js — chemistry 3D, new modules: alkenes & alkynes, benzene, functional groups & alkanoic acids */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const COL = { H: 0xf4f4f4, C: 0x3b3f46, N: 0x3454e8, O: 0xe8281c, Cl: 0x22d03a, Br: 0x8b2a14 }, RC = { H: 0.31, C: 0.76, N: 0.71, O: 0.66, Cl: 1.02, Br: 1.2 };
  const FONT = "'IBM Plex Mono',monospace";
  function disposeGroup(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.material.userData.keep) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); g.parent && g.parent.remove(g); }
  /* molecule definition from Å coordinates: bonds found from covalent radii; ord = {"i-j": order} */
  function def(atoms, ord, g) { const b = []; for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) { const A = atoms[i], B = atoms[j], d = Math.hypot(A[1] - B[1], A[2] - B[2], A[3] - B[3]); if (d < (RC[A[0]] + RC[B[0]]) * 1.25) b.push([i, j, (ord && ord[i + "-" + j]) || 1]); } return { a: atoms, b, g: g || null }; }
  function mkMol(K, d, o) {
    o = o || {}; const n = d.a.length; let cx = 0, cy = 0, cz = 0; if (!o.raw) { d.a.forEach((a) => { cx += a[1]; cy += a[2]; cz += a[3]; }); cx /= n; cy /= n; cz /= n; }
    const mol = K.molecule({ atoms: d.a.map((a) => ({ el: a[0], p: [a[1] - cx, a[2] - cy, a[3] - cz] })), bonds: d.b }); mol.refresh(o.style == null ? 0.15 : o.style);
    mol.atoms.forEach((at, i) => at.mesh.material.color.setHex(COL[d.a[i][0]] || 0xcccccc));
    const xs = d.a.map((a) => a[1]), ext = Math.max(...xs) - Math.min(...xs); mol.group.scale.setScalar(Math.min(o.max || 1, (o.fit || 99) / (ext * 1.15 + 1.1))); mol.def = d; return mol;
  }
  function highlight(mol, set) { const d = mol.def; mol.atoms.forEach((at, i) => { const on = !set || set.indexOf(i) >= 0; if (!on) at.mesh.material.color.multiplyScalar(0.4); else if (set && at.mesh.material.emissive) at.mesh.material.emissive.setHex(0x3a2200); }); }
  function clearRoot(s) { while (s.root.children.length) disposeGroup(s.root.children[0]); s.mols = []; }
  function lay(s, K, keys, lib, y, fit, max, rotX) {
    const n = keys.length, xs = n === 1 ? [0] : n === 2 ? [-1.55, 1.7] : [-2.2, 0.1, 2.3];
    keys.forEach((k, i) => { const m = mkMol(K, lib[k], { fit: n === 1 ? 4.4 : n === 2 ? fit || 2.9 : 2.1, max: max || 0.8 }); m.group.position.set(xs[i], y, 0); if (rotX) m.group.rotation.x = rotX; s.root.add(m.group); s.mols.push(m); s.labs.push({ x: xs[i], y: y - 1.45, t: lib[k].f }); });
  }
  function sp(ctx, px, y, h, title, lines, fs) { H.panel(ctx, px, y, 240, h); ctx.textAlign = "left"; ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText(title, px + 8, y + 15); ctx.font = (fs || 8.6) + "px " + FONT; let yy = y + 29; lines.forEach((t) => { ctx.fillStyle = "#e8f0ff"; yy = wrapT(ctx, t, px + 8, yy, 224, 10.5) + 11.5; }); }
  function bars(ctx, x, y, w, h, items, o) {
    const mx = o.max, mn = o.min || 0, n = items.length, bw = (w - (n - 1) * 8) / n; ctx.save(); ctx.textAlign = "center";
    items.forEach((it, i) => { const bx = x + i * (bw + 8), hh = ((it.v - mn) / (mx - mn)) * h; ctx.fillStyle = it.hi ? "#ffd27a" : "#52627c"; if (o.neg) { const z = y + h * (mx / (mx - mn)); ctx.fillRect(bx, it.v >= 0 ? z - (it.v / (mx - mn)) * h : z, bw, Math.abs(it.v / (mx - mn)) * h); } else ctx.fillRect(bx, y + h - hh, bw, hh); ctx.fillStyle = "#e8f0ff"; ctx.font = "8px " + FONT; ctx.fillText(it.l, bx + bw / 2, y + h + 11); ctx.fillText(it.t, bx + bw / 2, o.neg ? y - 3 : y + h - hh - 3); });
    ctx.restore();
  }
  function labels(ctx, s, S, rootY) { s.labs.forEach((l) => { const p = S.proj(V3(l.x, l.y + rootY, 0)); H.pill(ctx, p.x, p.y, l.t, "#cfe0f5", 9.5, "center"); }); }
  function arrowRow(ctx, S, y, text, color) { const p = S.proj(V3(0.1, y, 0)); H.pill(ctx, p.x, p.y, text, color || "#ffe9b8", 9.5, "center"); }

  /* ---------- molecule library (coordinates in Å) ---------- */
  const m4 = (x, y, z) => [x, y, z];
  const LIB = {
    h2: Object.assign(def([["H", -0.37, 0, 0], ["H", 0.37, 0, 0]]), { f: "H₂" }),
    br2: Object.assign(def([["Br", -1.14, 0, 0], ["Br", 1.14, 0, 0]]), { f: "Br₂" }),
    hbr: Object.assign(def([["H", -0.7, 0, 0], ["Br", 0.71, 0, 0]]), { f: "HBr" }),
    h2o: Object.assign(def([["O", 0, 0, 0], ["H", 0.757, 0.586, 0], ["H", -0.757, 0.586, 0]]), { f: "H₂O" }),
    c2h6: Object.assign(def([["C", -0.77, 0, 0], ["C", 0.77, 0, 0], ["H", -1.16, 1.03, 0], ["H", -1.16, -0.51, 0.89], ["H", -1.16, -0.51, -0.89], ["H", 1.16, -1.03, 0], ["H", 1.16, 0.51, 0.89], ["H", 1.16, 0.51, -0.89]]), { f: "C₂H₆" }),
    c2h4: Object.assign(def([["C", -0.67, 0, 0], ["C", 0.67, 0, 0], ["H", -1.24, 0.93, 0], ["H", -1.24, -0.93, 0], ["H", 1.24, 0.93, 0], ["H", 1.24, -0.93, 0]], { "0-1": 2 }), { f: "C₂H₄" }),
    c2h2: Object.assign(def([["C", -0.6, 0, 0], ["C", 0.6, 0, 0], ["H", -1.66, 0, 0], ["H", 1.66, 0, 0]], { "0-1": 3 }), { f: "C₂H₂" }),
    c3h6: Object.assign(def([["C", 0, 0, 0], ["C", 1.33, 0, 0], ["C", -0.75, 1.3, 0], ["H", 1.9, 0.93, 0], ["H", 1.9, -0.93, 0], ["H", -0.55, -0.93, 0], ["H", -0.1, 2.15, 0], ["H", -1.38, 1.5, 0.89], ["H", -1.38, 1.5, -0.89]], { "0-1": 2 }), { f: "C₃H₆" }),
    c3h4: Object.assign(def([["C", 0, 0, 0], ["C", 1.2, 0, 0], ["C", -1.46, 0, 0], ["H", 2.26, 0, 0], ["H", -1.83, 1.03, 0], ["H", -1.83, -0.51, 0.89], ["H", -1.83, -0.51, -0.89]], { "0-1": 3 }), { f: "C₃H₄" }),
    c2h5br: Object.assign(def([["C", -0.77, 0, 0], ["C", 0.77, 0, 0], ["Br", 1.41, -1.8, 0], ["H", 1.16, 0.51, 0.89], ["H", 1.16, 0.51, -0.89], ["H", -1.16, 1.03, 0], ["H", -1.16, -0.51, 0.89], ["H", -1.16, -0.51, -0.89]]), { f: "C₂H₅Br" }),
    c2h4br2: Object.assign(def([["C", -0.77, 0, 0], ["C", 0.77, 0, 0], ["Br", -1.45, 1.82, 0], ["Br", 1.45, -1.82, 0], ["H", -1.16, -0.51, 0.89], ["H", -1.16, -0.51, -0.89], ["H", 1.16, 0.51, 0.89], ["H", 1.16, 0.51, -0.89]]), { f: "C₂H₄Br₂" }),
    c2h5oh: Object.assign(def([["C", -0.76, 0, 0], ["C", 0.76, 0, 0], ["O", 1.33, 1.29, 0], ["H", 2.23, 1.6, 0], ["H", 1.15, -0.51, 0.89], ["H", 1.15, -0.51, -0.89], ["H", -1.15, 1.03, 0], ["H", -1.15, -0.51, 0.89], ["H", -1.15, -0.51, -0.89]]), { f: "C₂H₅OH" }),
    bromopropane: Object.assign(def([["C", 0, 0.3, 0], ["C", -1.26, -0.45, 0], ["C", 1.26, -0.45, 0], ["Br", 0, 1.2, 1.7], ["H", 0, 0.95, -0.89], ["H", -2.15, -0.05, 0], ["H", -1.28, -1.1, 0.89], ["H", -1.28, -1.1, -0.89], ["H", 2.15, -0.05, 0], ["H", 1.28, -1.1, 0.89], ["H", 1.28, -1.1, -0.89]]), { f: "CH₃CHBrCH₃" }),
    pe: Object.assign(def([["C", 0, 0, 0], ["C", 1.25, 0.78, 0], ["C", 2.5, 0, 0], ["C", 3.75, 0.78, 0], ["H", 0, -0.55, 0.89], ["H", 0, -0.55, -0.89], ["H", 1.25, 1.33, 0.89], ["H", 1.25, 1.33, -0.89], ["H", 2.5, -0.55, 0.89], ["H", 2.5, -0.55, -0.89], ["H", 3.75, 1.33, 0.89], ["H", 3.75, 1.33, -0.89], ["H", -0.95, -0.35, 0], ["H", 4.7, 1.13, 0]]), { f: "–(CH₂CH₂)ₙ–" }),
  };

  /* =================== 1. ALKENES & ALKYNES =================== */
  const INFO = {
    c2h6: { n: "Ethane", f: "C₂H₆", ser: "alkane", gen: "CₙH₂ₙ₊₂", bond: "C–C single bond", len: 154, en: 346, ang: "109.5°", hyb: "sp³", unsat: 0 },
    c2h4: { n: "Ethene", f: "C₂H₄", ser: "alkene", gen: "CₙH₂ₙ", bond: "C=C double bond", len: 134, en: 614, ang: "120°", hyb: "sp²", unsat: 2 },
    c2h2: { n: "Ethyne", f: "C₂H₂", ser: "alkyne", gen: "CₙH₂ₙ₋₂", bond: "C≡C triple bond", len: 120, en: 839, ang: "180°", hyb: "sp", unsat: 3 },
    c3h6: { n: "Propene", f: "C₃H₆", ser: "alkene", gen: "CₙH₂ₙ", bond: "C=C double bond", len: 134, en: 614, ang: "120°", hyb: "sp²", unsat: 2 },
    c3h4: { n: "Propyne", f: "C₃H₄", ser: "alkyne", gen: "CₙH₂ₙ₋₂", bond: "C≡C triple bond", len: 120, en: 839, ang: "180°", hyb: "sp", unsat: 3 },
  };
  const IK = Object.keys(INFO);
  const URX = {
    h2: { l: "Hydrogenation", r: ["c2h4", "h2"], p: ["c2h6"], eq: "C₂H₄ + H₂ → C₂H₆", cond: "Ni catalyst, about 150 °C", type: "addition", note: "H–H adds across the C=C bond: the double bond becomes a single bond and the alkene becomes an alkane (saturated). Used to harden vegetable oils into margarine." },
    br: { l: "Bromine addition", r: ["c2h4", "br2"], p: ["c2h4br2"], eq: "C₂H₄ + Br₂ → CH₂BrCH₂Br", cond: "room temperature (bromine water or in tetrachloromethane)", type: "addition", note: "Orange-brown bromine is decolourised as it adds across C=C to give 1,2-dibromoethane. This is the test for unsaturation." },
    hbr: { l: "Hydrogen bromide", r: ["c2h4", "hbr"], p: ["c2h5br"], eq: "C₂H₄ + HBr → C₂H₅Br", cond: "room temperature", type: "addition", note: "HBr adds across the double bond to give bromoethane, a haloalkane." },
    h2o: { l: "Hydration", r: ["c2h4", "h2o"], p: ["c2h5oh"], eq: "C₂H₄ + H₂O → C₂H₅OH", cond: "steam, about 300 °C, 60 atm, H₃PO₄ catalyst", type: "addition", note: "Steam adds across C=C to give ethanol: the industrial route to ethanol from ethene." },
    mk: { l: "Markovnikov addition", r: ["c3h6", "hbr"], p: ["bromopropane"], eq: "CH₃CH=CH₂ + HBr → CH₃CHBrCH₃", cond: "room temperature", type: "addition (major product)", note: "In an unsymmetrical alkene the H adds to the carbon that already has more hydrogen atoms (Markovnikov's rule), so 2-bromopropane is the major product, not 1-bromopropane." },
    pe: { l: "Polymerisation", r: ["c2h4"], p: ["pe"], eq: "n CH₂=CH₂ → –(CH₂–CH₂)ₙ–", cond: "high pressure, catalyst", type: "addition polymerisation", note: "Thousands of ethene molecules join as the double bonds open: poly(ethene), or polythene. Only one repeat section of the chain is drawn." },
    yne: { l: "Ethyne + H₂", r: ["c2h2", "h2"], p: ["c2h4"], eq: "C₂H₂ + H₂ → C₂H₄", cond: "Ni catalyst (more H₂ gives ethane)", type: "addition", note: "A triple bond adds two molecules of reagent in turn: first to a C=C alkene, then to a C–C alkane." },
  };
  const UK = Object.keys(URX);
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  C3.scenes.unsaturated = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[2.2, 2.4, 10.5], [2.2, 2.0, 0]],
    values: { mode: "struct", mol: "c2h4", clouds: 1, spin: 1, rx: "h2", rg: "br", gas: 0 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Activity", options: [{ value: "struct", label: "Structure: bonds and shapes" }, { value: "test", label: "Test for unsaturation" }, { value: "react", label: "Addition reactions" }] },
        { type: "select", key: "mol", label: "Hydrocarbon (structure and test)", options: IK.map((k) => ({ value: k, label: INFO[k].f + " — " + INFO[k].n })) },
        { type: "toggle", key: "clouds", label: "Show π electron clouds (structure)" },
        { type: "toggle", key: "spin", label: "Rotate molecule (structure)" },
        { type: "select", key: "rg", label: "Test reagent", options: [{ value: "br", label: "Bromine water (orange)" }, { value: "mn", label: "Acidified KMnO₄ (purple)" }] },
        { type: "toggle", key: "gas", label: "Bubble the gas through the reagent (test)" },
        { type: "select", key: "rx", label: "Reaction (addition mode)", options: UK.map((k) => ({ value: k, label: URX[k].l + ": " + URX[k].eq })) },
      ];
    },
    views: [{ label: "Wide", cam: [[2.2, 2.4, 10.5], [2.2, 2.0, 0]] }, { label: "Close", cam: [[1.6, 2.2, 7.2], [1.6, 2.0, 0]] }],
    note: "Alkanes are saturated: every C–C bond is a single σ bond (CₙH₂ₙ₊₂, 154 pm, sp³, 109.5°). Alkenes (CₙH₂ₙ) contain one C=C double bond, a σ bond plus a π bond made by sideways overlap of p orbitals above and below the molecular plane; the carbons are sp², the bond angle is 120° and the bond is shorter (134 pm) and stronger (614 kJ/mol) but the π bond is the weak, reactive part. Alkynes (CₙH₂ₙ₋₂) contain a C≡C triple bond (one σ and two π bonds, sp, 180°, 120 pm, 839 kJ/mol). Unsaturated compounds decolourise bromine water and acidified potassium manganate(VII) and undergo addition reactions; alkanes do neither. Bond lengths and energies are typical textbook values; the π cloud is a schematic picture.",
    onChange(S, s, c, key) { if (key === "mode" || key === "mol" || key === "rx") { rebuild(S, s, c); if (key === "mode") { s.tt = 0; C3.setView(S, { cam: c.mode === "test" ? [[1.4, 2.0, 6.8], [1.9, 1.7, 0]] : c.mode === "react" ? [[2.6, 2.0, 13.5], [2.6, 2.0, 0]] : [[2.2, 2.4, 10.5], [2.2, 2.0, 0]] }); } } if (key === "rg" || key === "mol") s.tt = 0; if (key === "gas" && c.gas) s.tt = 0; },
    reset(S, s, c) { Object.assign(c, { mode: "struct", mol: "c2h4", clouds: 1, spin: 1, rx: "h2", rg: "br", gas: 0 }); s.tt = 0; rebuild(S, s, c); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Series</th><th style="text-align:left">General formula</th><th style="text-align:left">Bond</th><th style="text-align:left">Length (pm)</th><th style="text-align:left">Energy (kJ/mol)</th></tr><tr><td style="text-align:left">alkane</td><td style="text-align:left">CₙH₂ₙ₊₂</td><td style="text-align:left">C–C</td><td style="text-align:left">154</td><td style="text-align:left">346</td></tr><tr><td style="text-align:left">alkene</td><td style="text-align:left">CₙH₂ₙ</td><td style="text-align:left">C=C</td><td style="text-align:left">134</td><td style="text-align:left">614</td></tr><tr><td style="text-align:left">alkyne</td><td style="text-align:left">CₙH₂ₙ₋₂</td><td style="text-align:left">C≡C</td><td style="text-align:left">120</td><td style="text-align:left">839</td></tr></table>'; },
    build(S, s, c) {
      s.K = C3.kit(S); S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.root = new T.Group(); s.root.position.set(0, 2.0, 0); S.scene.add(s.root); s.mols = []; s.labs = []; s.tt = 0;
      s.tube = s.K.vessel("testtube"); s.tube.group.position.set(-0.6, 0.07, 0); s.liq = s.tube.addLiquid({ color: [255, 160, 50], opacity: 0.55 }); s.liq.setVolume(12); s.bub = s.K.bubbles(s.tube, s.liq, { n: 40, x: 0, z: 0, baseY: 0.3, spread: 0.12 }); rebuild(S, s, c);
    },
    update(S, s, c, dt) {
      const test = c.mode === "test"; s.tube.group.visible = test; const inf = INFO[c.mol];
      if (c.mode === "struct" && c.spin) s.root.rotation.y += dt * 0.5; else if (c.mode !== "struct") s.root.rotation.y = 0;
      if (s.pi) s.pi.forEach((m) => (m.material.opacity = (c.clouds ? 0.3 + 0.12 * Math.sin(S.t * 3) : 0)));
      const rate = inf.unsat === 2 ? 0.22 : inf.unsat === 3 ? 0.13 : 0; if (test) { if (c.gas) s.tt += dt; s.fr = clamp(s.tt * rate, 0, 1); const A = c.rg === "br" ? [[255, 160, 50, 0.55], [235, 240, 245, 0.14]] : [[150, 20, 175, 0.75], [235, 235, 242, 0.14]], col = lerp3(A[0], A[1], s.fr); s.liq.setColor(col.slice(0, 3), col[3]); s.liq.update(S.t); s.bub.rate = c.gas ? 0.8 : 0; s.bub.update(dt, S.t); }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, inf = INFO[c.mol];
      if (c.mode === "struct") {
        H.pill(ctx, 10, 22, inf.n + " (" + inf.f + ")  ·  " + inf.ser, "#ffe9b8", 10.5); H.pill(ctx, 10, 44, inf.bond + "  ·  " + inf.hyb + "  ·  " + inf.ang, "#9fe3ff", 9.5); H.pill(ctx, 10, 66, inf.unsat ? "UNSATURATED: has a multiple bond" : "SATURATED: single bonds only", inf.unsat ? "#ffb48a" : "#8dffb8", 9.5);
        sp(ctx, px, 58, 128, "Carbon–carbon bond", ["C–C length: " + inf.len + " pm", "bond energy: " + inf.en + " kJ/mol", "bond angle: " + inf.ang + "  (" + inf.hyb + ")", "general formula: " + inf.gen]);
        H.panel(ctx, px, 194, 240, 126); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Bond length (pm): shorter = stronger", px + 8, 209);
        bars(ctx, px + 16, 224, 206, 62, [{ l: "C–C", t: "154", v: 154, hi: inf.unsat === 0 }, { l: "C=C", t: "134", v: 134, hi: inf.unsat === 2 }, { l: "C≡C", t: "120", v: 120, hi: inf.unsat === 3 }], { max: 160, min: 90 });
        ctx.font = "8px " + FONT; ctx.fillStyle = "#9fb2d2"; ctx.fillText("energy 346 → 614 → 839 kJ/mol", px + 8, 312);
        if (inf.unsat) H.pill(ctx, 190, 340, "blue lobes: π cloud (above and below the bond)", "#9fc4ff", 8.6, "center");
      } else if (c.mode === "test") {
        const br = c.rg === "br"; H.pill(ctx, 10, 22, (br ? "Bromine water" : "Acidified KMnO₄") + " + " + inf.n, "#ffe9b8", 10.5); H.pill(ctx, 10, 44, inf.unsat ? (s.fr > 0.98 ? "decolourised: UNSATURATED" : c.gas ? "colour fading..." : "press: bubble the gas") : (c.gas ? "no change: SATURATED" : "press: bubble the gas"), inf.unsat ? "#ffb48a" : "#8dffb8", 9.5);
        sp(ctx, px, 58, 128, "Observation", [inf.unsat ? (br ? "orange-brown bromine water turns colourless" : "purple KMnO₄ turns colourless") : "the reagent colour stays the same", br ? "C₂H₄ + Br₂ → CH₂BrCH₂Br (addition)" : "MnO₄⁻ (purple) → Mn²⁺ (colourless)", "alkane: no reaction in the dark"]);
        sp(ctx, px, 194, 126, "Conclusion", ["Decolourising bromine water or KMnO₄ shows a C=C or C≡C bond.", "Alkanes (single bonds only) do not react, so the colour stays."]);
        const q = S.proj(V3(-0.6, 2.65, 0)); H.pill(ctx, q.x, q.y, "reagent in test tube", "#cfe0f5", 8.6, "center"); const t2 = S.proj(V3(1.9, 0.3, 0)); H.pill(ctx, t2.x, t2.y, inf.f + " " + inf.n, "#cfe0f5", 8.6, "center");
      } else {
        const r = URX[c.rx]; H.pill(ctx, 10, 22, r.l + ": " + r.type, "#ffe9b8", 10); H.pill(ctx, 10, 44, r.eq, "#9fe3ff", 10); H.pill(ctx, 10, 66, "conditions: " + r.cond, "#ffd27a", 8.6);
        sp(ctx, px, 58, 150, "What happens", [r.note]); sp(ctx, px, 216, 100, "Key idea", ["Addition: two reactants join to give one product, and the C=C (or C≡C) bond opens. Alkanes cannot do this."]);
        labels(ctx, s, S, 2.0);
        const a = S.proj(V3(0.1, 2.0 + 0.25, 0)); H.pill(ctx, a.x, a.y, "↓", "#ffe9b8", 14, "center");
        const pl = S.proj(V3(0.1, 2.0 + 1.6, 0)); if (r.r.length > 1) H.pill(ctx, pl.x, pl.y, "+", "#ffe9b8", 12, "center");
      }
      ctx.restore();
    },
    readouts(s, c) { const inf = INFO[c.mol]; if (c.mode === "react") { const r = URX[c.rx]; return [["Reaction", r.l], ["Equation", r.eq], ["Conditions", r.cond], ["Type", r.type]]; } return [["Compound", inf.n + " (" + inf.f + "), " + inf.ser], ["Bond", inf.bond + ", " + inf.len + " pm, " + inf.en + " kJ/mol"], ["Shape", inf.ang + " about each carbon (" + inf.hyb + ")"], ["General formula", inf.gen], ["Decolourises Br₂ water", inf.unsat ? "yes (unsaturated)" : "no (saturated)"]]; },
    steps(s, c) { return [["Compare C–C, C=C and C≡C lengths and energies", c.mode === "struct" ? "now" : "done"], ["Test each hydrocarbon with bromine water", c.mode === "test" ? "now" : ""], ["Follow an addition reaction from alkene to product", c.mode === "react" ? "now" : ""], ["Use Markovnikov's rule for propene + HBr", c.rx === "mk" ? "now" : ""]]; },
  };
  function rebuild(S, s, c) {
    clearRoot(s); s.labs = []; s.pi = []; s.root.rotation.y = 0;
    if (c.mode === "react") { const r = URX[c.rx]; lay(s, s.K, r.r, LIB, 1.6, 2.9, 0.6); lay(s, s.K, r.p, LIB, -1.15, 2.9, 0.6); s.labs = s.labs.map((l) => l); return; }
    if (c.mode === "test") { const m = mkMol(s.K, LIB[c.mol], { fit: 2.4, max: 0.5 }); m.group.position.set(1.3, 0.9, 0); s.root.add(m.group); s.root.position.y = 1.3; s.mols.push(m); return; }
    s.root.position.y = 2.0; const m = mkMol(s.K, LIB[c.mol], { fit: 4.4, max: 0.85 }); s.root.add(m.group); s.mols.push(m);
    const inf = INFO[c.mol]; if (inf.unsat) { const A = m.atoms[0].mesh.position, B = m.atoms[1].mesh.position, mid = A.clone().add(B).multiplyScalar(0.5), len = A.distanceTo(B); const offs = inf.unsat === 2 ? [[0, 0, 0.4], [0, 0, -0.4]] : [[0, 0.32, 0], [0, -0.32, 0], [0, 0, 0.32], [0, 0, -0.32]]; offs.forEach((o) => { const l = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshStandardMaterial({ color: 0x6ab0ff, emissive: 0x1a4f9a, emissiveIntensity: 0.5, transparent: true, opacity: 0.3, depthWrite: false })); l.scale.set(len * 0.85, 0.42, 0.42); l.position.copy(mid).add(new T.Vector3(o[0] * 1.9, o[1] * 1.9, o[2] * 1.9)); m.group.add(l); s.pi.push(l); }); }
  }

  /* =================== 2. BENZENE =================== */
  const BR = 1.397, BH = 2.48;
  const ring = (sub, kek) => {
    const at = []; for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; at.push(["C", BR * Math.cos(a), 0, BR * Math.sin(a)]); }
    const ord = kek === 1 ? { "0-1": 2, "2-3": 2, "4-5": 2 } : kek === 2 ? { "1-2": 2, "3-4": 2, "0-5": 2 } : null;
    for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; if (i === 0 && sub) { if (sub === "Br") at.push(["Br", 3.3, 0, 0]); else { at.push(["N", 2.87, 0, 0]); at.push(["O", 3.48, 0, 1.06]); at.push(["O", 3.48, 0, -1.06]); } } else at.push(["H", BH * Math.cos(a), 0, BH * Math.sin(a)]); }
    let o2 = ord ? Object.assign({}, ord) : {}; if (sub === "NO2") { o2["6-8"] = 2; } return def(at, o2);
  };
  const chair = () => { const at = []; for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3, up = k % 2 ? -1 : 1, x = 1.45 * Math.cos(a), z = 1.45 * Math.sin(a); at.push(["C", x, 0.25 * up, z]); } for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3, up = k % 2 ? -1 : 1, x = 1.45 * Math.cos(a), z = 1.45 * Math.sin(a), xo = 2.4 * Math.cos(a), zo = 2.4 * Math.sin(a); at.push(["H", x, 0.25 * up + 1.09 * up, z]); at.push(["H", xo, 0.25 * up - 0.35 * up, zo]); } return def(at); };
  const BL = {
    benzene: Object.assign(ring(null, 0), { f: "C₆H₆" }), kek1: Object.assign(ring(null, 1), { f: "C₆H₆" }), kek2: Object.assign(ring(null, 2), { f: "C₆H₆" }),
    bromobenzene: Object.assign(ring("Br", 0), { f: "C₆H₅Br" }), nitrobenzene: Object.assign(ring("NO2", 0), { f: "C₆H₅NO₂" }), cyclohexane: Object.assign(chair(), { f: "C₆H₁₂" }),
    br2: LIB.br2, hbr: LIB.hbr, h2: LIB.h2, h2o: LIB.h2o, hno3: Object.assign(def([["N", 0, 0, 0], ["O", 1.2, 0.5, 0], ["O", -1.1, 0.7, 0], ["O", 0.1, -1.3, 0], ["H", 0.9, -1.7, 0]]), { f: "HNO₃" }),
  };
  const BRX = {
    br: { l: "Bromination (FeBr₃)", r: ["benzene", "br2"], p: ["bromobenzene", "hbr"], eq: "C₆H₆ + Br₂ → C₆H₅Br + HBr", cond: "FeBr₃ catalyst, room temperature", type: "electrophilic SUBSTITUTION", note: "One H is replaced by Br and the delocalised ring is kept. The ring is so stable that it substitutes rather than adds." },
    no2: { l: "Nitration", r: ["benzene", "hno3"], p: ["nitrobenzene", "h2o"], eq: "C₆H₆ + HNO₃ → C₆H₅NO₂ + H₂O", cond: "concentrated HNO₃ + concentrated H₂SO₄, about 55 °C", type: "electrophilic SUBSTITUTION", note: "The NO₂ group replaces a hydrogen atom. Nitrobenzene is the first step towards dyes and explosives such as TNT." },
    none: { l: "Bromine water: no reaction", r: ["benzene", "br2"], p: ["benzene"], eq: "C₆H₆ + Br₂ (aq, no catalyst) → no reaction", cond: "room temperature, no catalyst", type: "no addition", note: "Unlike an alkene, benzene does not decolourise bromine water because the delocalised π system is unusually stable. Benzene is NOT a simple triene." },
    h2: { l: "Hydrogenation", r: ["benzene", "h2"], p: ["cyclohexane"], eq: "C₆H₆ + 3H₂ → C₆H₁₂", cond: "Ni catalyst, 150 °C, 3 atm (harsher than for alkenes)", type: "ADDITION (forced)", note: "Under forcing conditions benzene does add 3 H₂ to give cyclohexane, losing the delocalisation. Only one H₂ molecule is drawn for the 3 needed." },
  };
  const BK = Object.keys(BRX);
  C3.scenes.benzene = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[2.2, 4.4, 9.2], [2.2, 2.0, 0]],
    values: { mode: "deloc", flip: 0, spin: 1, rx: "br" },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Model", options: [{ value: "kek", label: "Kekulé model (alternating bonds)" }, { value: "deloc", label: "Delocalised π ring (real structure)" }, { value: "energy", label: "Hydrogenation enthalpy evidence" }, { value: "react", label: "Reactions: substitution vs addition" }] },
        { type: "toggle", key: "flip", label: "Switch to the other Kekulé structure (Kekulé model)" },
        { type: "toggle", key: "spin", label: "Rotate molecule" },
        { type: "select", key: "rx", label: "Reaction (reaction mode)", options: BK.map((k) => ({ value: k, label: BRX[k].l })) },
      ];
    },
    views: [{ label: "Above the ring", cam: [[2.2, 4.4, 9.2], [2.2, 2.0, 0]] }, { label: "Side view", cam: [[2.2, 2.4, 10.0], [2.2, 2.0, 0]] }],
    note: "Benzene, C₆H₆, is a planar ring of six carbon atoms with six equal C–C bonds of 139 pm: between the single (154 pm) and double (134 pm) bond lengths. Each carbon is sp² and uses its fourth electron in a p orbital; the six p orbitals overlap sideways to form a ring of delocalised π electrons above and below the plane. Kekulé's two alternating structures are only a way of writing it: the real molecule is a resonance hybrid. Evidence: all bonds equal; hydrogenation releases 208 kJ/mol instead of the 3 × 120 = 360 kJ/mol predicted for three C=C bonds, so benzene is 152 kJ/mol more stable (delocalisation energy); it does not decolourise bromine water; it undergoes substitution (keeping the ring) rather than addition. Distances and energies are textbook values; the π cloud is schematic.",
    onChange(S, s, c, key) { if (key === "mode" || key === "flip" || key === "rx") rebuild(S, s, c); },
    reset(S, s, c) { Object.assign(c, { mode: "deloc", flip: 0, spin: 1, rx: "br" }); rebuild(S, s, c); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Compound</th><th style="text-align:left">C–C length (pm)</th><th style="text-align:left">ΔH hydrogenation (kJ/mol)</th></tr><tr><td style="text-align:left">cyclohexene (1 C=C)</td><td style="text-align:left">134 and 154</td><td style="text-align:left">−120</td></tr><tr><td style="text-align:left">cyclohexa-1,3,5-triene (predicted)</td><td style="text-align:left">134 and 154</td><td style="text-align:left">−360</td></tr><tr><td style="text-align:left">benzene (measured)</td><td style="text-align:left">139 (all six)</td><td style="text-align:left">−208</td></tr></table>'; },
    build(S, s, c) { s.K = C3.kit(S); S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.root = new T.Group(); s.root.position.set(0, 2.0, 0); S.scene.add(s.root); s.mols = []; s.labs = []; s.cl = []; rebuild(S, s, c); },
    update(S, s, c, dt) {
      if (c.mode !== "react" && c.mode !== "energy" && c.spin) s.root.rotation.y += dt * 0.4; else if (c.mode === "react") s.root.rotation.y = 0;
      s.root.visible = c.mode !== "energy"; if (s.cl) s.cl.forEach((m) => (m.material.opacity = 0.28 + 0.1 * Math.sin(S.t * 3)));
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      if (c.mode === "kek") { H.pill(ctx, 10, 22, "Kekulé model: " + (c.flip ? "structure B" : "structure A"), "#ffe9b8", 10.5); H.pill(ctx, 10, 44, "alternating C–C (154 pm) and C=C (134 pm)", "#9fe3ff", 9.5); H.pill(ctx, 10, 66, "but the real bonds are all 139 pm: the model is not exact", "#ffb48a", 9);
        sp(ctx, px, 58, 128, "Kekulé structures", ["Two structures differ only in where the double bonds are.", "If either were real, benzene would show 3 short and 3 long C–C bonds.", "Measurement: all six are 139 pm."]); sp(ctx, px, 194, 100, "Resonance", ["Benzene is a hybrid of both: the π electrons are shared over the whole ring."]); }
      else if (c.mode === "deloc") { H.pill(ctx, 10, 22, "Benzene C₆H₆: delocalised π electrons", "#ffe9b8", 10.5); H.pill(ctx, 10, 44, "6 equal C–C bonds, 139 pm, bond angle 120°", "#9fe3ff", 9.5); H.pill(ctx, 10, 66, "blue rings: π cloud above and below the plane", "#9fc4ff", 9);
        sp(ctx, px, 58, 128, "Shape and bonding", ["planar hexagon, each C is sp²", "σ bonds: C–C and C–H in the plane", "6 p electrons delocalised in the ring", "formula: C₆H₆ (unsaturated, but stable)"]); sp(ctx, px, 194, 100, "Why it matters", ["The delocalised ring is why benzene substitutes rather than adds, and why it is aromatic."]); }
      else if (c.mode === "energy") {
        H.panel(ctx, 10, 18, 340, 300); ctx.font = "600 10px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Enthalpy of hydrogenation (kJ/mol)", 20, 36);
        const y0 = 60, sc = 0.55, X = 36; /* levels measured down from 0 */ const lvl = (v, x0, x1, col, lab) => { const y = y0 + (-v) * sc * 0.0 + 0; };
        const yT = 70, yB = yT + 152 * 0.9, yC = yT + 360 * 0.9 * 0.62; const sy = (d) => yT + d * 0.45;
        const lines = [[0, "#ffd27a", "cyclohexa-1,3,5-triene + 3H₂ (hypothetical, 3 C=C)"], [152, "#8fe3a0", "benzene + 3H₂ (real, 152 kJ more stable)"], [360, "#9fb2d2", "cyclohexane (C₆H₁₂)"]];
        lines.forEach((L) => { const y = sy(L[0]); ctx.strokeStyle = L[1]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(160, y); ctx.stroke(); ctx.fillStyle = L[1]; ctx.font = "8.4px " + FONT; ctx.textAlign = "left"; wrapT(ctx, L[2], 170, y - (L[0] === 360 ? 0 : 3), 170, 10); });
        const arr = (x, y1, y2, col, t) => { ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2 - 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 5, y2 - 8); ctx.lineTo(x + 5, y2 - 8); ctx.lineTo(x, y2); ctx.fill(); ctx.font = "8.6px " + FONT; ctx.textAlign = "center"; ctx.fillText(t, x, (y1 + y2) / 2 + 3); };
        arr(65, sy(0), sy(360), "#ffd27a", "−360"); arr(125, sy(152), sy(360), "#8fe3a0", "−208"); ctx.textAlign = "left";
        ctx.fillStyle = "#e8f0ff"; ctx.font = "9px " + FONT; wrapT(ctx, "predicted: 3 × (−120) = −360 kJ/mol   measured: −208 kJ/mol   difference = 152 kJ/mol delocalisation energy", 20, 292, 320, 11);
        sp(ctx, px, 58, 128, "Evidence from enthalpy", ["Cyclohexene (1 C=C): −120 kJ/mol.", "3 isolated C=C would give −360.", "Benzene gives only −208: it is 152 kJ/mol lower in energy, i.e. extra stable."]); sp(ctx, px, 194, 100, "Conclusion", ["The extra stability comes from delocalisation of the π electrons around the ring."]); }
      else { const r = BRX[c.rx]; H.pill(ctx, 10, 22, r.l + ": " + r.type, "#ffe9b8", 10); H.pill(ctx, 10, 44, r.eq, "#9fe3ff", 9.2); H.pill(ctx, 10, 66, "conditions: " + r.cond, "#ffd27a", 8.4);
        sp(ctx, px, 58, 150, "What happens", [r.note]); sp(ctx, px, 216, 100, "Compare with alkenes", ["Alkenes ADD (decolourise Br₂ water). Benzene SUBSTITUTES (needs a catalyst) and keeps its ring."]);
        labels(ctx, s, S, 2.0); const a = S.proj(V3(0.1, 2.35, 0)); H.pill(ctx, a.x, a.y, "↓", "#ffe9b8", 14, "center"); if (r.r.length > 1) { const pl = S.proj(V3(0.1, 3.6, 0)); H.pill(ctx, pl.x, pl.y, "+", "#ffe9b8", 12, "center"); } }
      ctx.restore();
    },
    readouts(s, c) { if (c.mode === "react") { const r = BRX[c.rx]; return [["Reaction", r.l], ["Equation", r.eq], ["Conditions", r.cond], ["Type", r.type]]; } return [["Formula", "C₆H₆"], ["C–C bond length", "139 pm (all six equal)"], ["Bond angle", "120°, planar"], ["ΔH hydrogenation", "−208 kJ/mol (predicted −360)"], ["Delocalisation energy", "152 kJ/mol"], ["Typical reaction", "substitution, not addition"]]; },
    steps(s, c) { return [["Compare the Kekulé model with the delocalised ring", c.mode === "kek" || c.mode === "deloc" ? "now" : "done"], ["Use the enthalpy of hydrogenation as evidence", c.mode === "energy" ? "now" : ""], ["Brominate and nitrate benzene: substitution", c.mode === "react" ? "now" : ""], ["Show that bromine water does not react", c.rx === "none" ? "now" : ""]]; },
  };
  C3.scenes.benzene._rb = true;
  function rebuildB(S, s, c) {
    clearRoot(s); s.labs = []; s.cl = []; s.root.rotation.y = 0;
    if (c.mode === "react") { const r = BRX[c.rx]; lay(s, s.K, r.r, BL, 1.6, 2.9, 0.6, 0.85); lay(s, s.K, r.p, BL, -1.15, 2.9, 0.6, 0.85); s.root.position.y = 2.0; return; }
    if (c.mode === "energy") return;
    const key = c.mode === "kek" ? (c.flip ? "kek2" : "kek1") : "benzene"; s.root.position.y = 2.0; const m = mkMol(s.K, BL[key], { fit: 4.4, max: 0.85 }); s.root.add(m.group); s.mols.push(m);
    if (c.mode === "deloc") [0.5, -0.5].forEach((y) => { const t = new T.Mesh(new T.TorusGeometry(BR * 1.15, 0.26, 14, 48), new T.MeshStandardMaterial({ color: 0x6ab0ff, emissive: 0x1a4f9a, emissiveIntensity: 0.5, transparent: true, opacity: 0.3, depthWrite: false })); t.rotation.x = Math.PI / 2; t.position.set(0, y, 0); m.group.add(t); s.cl.push(t); });
  }

  /* =================== 3. FUNCTIONAL GROUPS & ALKANOIC ACIDS =================== */
  const ME = (x, y, o) => [["H", x + 1.05 * o, y + 0.35, 0], ["H", x - 0.05 * o, y - 0.4, 0.9], ["H", x - 0.05 * o, y - 0.4, -0.9]];
  const FG = {
    alkane: { n: "Propane", f: "CH₃CH₂CH₃", grp: "C–C and C–H single bonds", series: "alkane", suffix: "-ane", test: "No reaction with bromine water; burns in oxygen; reacts with Cl₂ in UV light.", bp: -42, d: def([["C", 0, 0.3, 0], ["C", -1.26, -0.45, 0], ["C", 1.26, -0.45, 0], ["H", 0, 0.95, 0.89], ["H", 0, 0.95, -0.89], ["H", -2.15, -0.05, 0], ["H", -1.28, -1.1, 0.89], ["H", -1.28, -1.1, -0.89], ["H", 2.15, -0.05, 0], ["H", 1.28, -1.1, 0.89], ["H", 1.28, -1.1, -0.89]]), g: null },
    alkene: { n: "Propene", f: "CH₃CH=CH₂", grp: "C=C double bond", series: "alkene", suffix: "-ene", test: "Decolourises bromine water; adds H₂, HBr, H₂O.", bp: -48, d: LIB.c3h6, g: [0, 1] },
    alkyne: { n: "Propyne", f: "CH₃C≡CH", grp: "C≡C triple bond", series: "alkyne", suffix: "-yne", test: "Decolourises bromine water; ethyne with ammoniacal Cu₂Cl₂ gives a red precipitate (terminal alkyne).", bp: -23, d: LIB.c3h4, g: [0, 1] },
    halo: { n: "Chloroethane", f: "CH₃CH₂Cl", grp: "–Cl (halogen)", series: "haloalkane", suffix: "chloro- (prefix)", test: "Warm with NaOH(aq) then acidify with HNO₃ and add AgNO₃: white precipitate of AgCl.", bp: 12, d: def([["C", -0.76, 0, 0], ["C", 0.76, 0, 0], ["Cl", 1.38, -1.67, 0], ["H", 1.15, 0.51, 0.89], ["H", 1.15, 0.51, -0.89], ["H", -1.15, 1.03, 0], ["H", -1.15, -0.51, 0.89], ["H", -1.15, -0.51, -0.89]]), g: [1, 2] },
    alkanol: { n: "Ethanol", f: "CH₃CH₂OH", grp: "–OH (hydroxyl)", series: "alkanol", suffix: "-ol", test: "Na gives H₂; acidified K₂Cr₂O₇ turns orange → green on warming; esterifies with acids.", bp: 78, d: LIB.c2h5oh, g: [2, 3] },
    alkanal: { n: "Ethanal", f: "CH₃CHO", grp: "–CHO (aldehyde)", series: "alkanal", suffix: "-al", test: "Warm with Fehling's solution: red precipitate; Tollens' reagent: silver mirror.", bp: 21, d: def([["C", 0, 0, 0], ["O", 0, 1.21, 0], ["H", -0.95, -0.55, 0], ["C", 1.3, -0.75, 0]].concat(ME(1.3, -0.75, 1)), { "0-1": 2 }), g: [0, 1, 2] },
    alkanone: { n: "Propanone", f: "CH₃COCH₃", grp: "C=O between two carbons (ketone)", series: "alkanone", suffix: "-one", test: "No reaction with Fehling's or Tollens' (unlike an aldehyde); gives an orange precipitate with 2,4-DNPH.", bp: 56, d: def([["C", 0, 0, 0], ["O", 0, 1.21, 0], ["C", 1.3, -0.75, 0]].concat(ME(1.3, -0.75, 1), [["C", -1.3, -0.75, 0]], ME(-1.3, -0.75, -1)), { "0-1": 2 }), g: [0, 1] },
    acid: { n: "Ethanoic acid", f: "CH₃COOH", grp: "–COOH (carboxyl)", series: "alkanoic acid", suffix: "-oic acid", test: "Turns blue litmus red; fizzes with Na₂CO₃ (CO₂); reacts with Mg (H₂); esterifies with alcohols.", bp: 118, d: null, g: [0, 1, 2, 3] },
    ester: { n: "Methyl ethanoate", f: "CH₃COOCH₃", grp: "–COO– (ester link)", series: "alkanoate (ester)", suffix: "-oate", test: "Sweet, fruity smell; hydrolysed by hot NaOH(aq) to a carboxylate salt and an alcohol.", bp: 57, d: def([["C", 0, 0, 0], ["O", 0, 1.21, 0], ["O", -1.1, -0.75, 0], ["C", 1.3, -0.75, 0], ["C", -2.45, -0.2, 0]].concat(ME(1.3, -0.75, 1), [["H", -2.3, 0.88, 0], ["H", -3.0, -0.5, 0.89], ["H", -3.0, -0.5, -0.89]]), { "0-1": 2 }), g: [0, 1, 2] },
    amine: { n: "Methylamine", f: "CH₃NH₂", grp: "–NH₂ (amino)", series: "amine", suffix: "-amine", test: "Fishy smell; weak base: turns red litmus blue.", bp: -6, d: def([["C", 0, 0, 0], ["N", 1.47, 0, 0], ["H", 1.85, 0.55, 0.8], ["H", 1.85, 0.55, -0.8], ["H", -0.36, 1.02, 0], ["H", -0.36, -0.51, 0.89], ["H", -0.36, -0.51, -0.89]]), g: [1, 2, 3] },
    amide: { n: "Ethanamide", f: "CH₃CONH₂", grp: "–CONH₂ (amide)", series: "amide", suffix: "-amide", test: "Warm with NaOH(aq): ammonia is given off (turns damp red litmus blue). Amide link joins amino acids in proteins.", bp: 221, d: def([["C", 0, 0, 0], ["O", 0, 1.22, 0], ["N", 1.15, -0.72, 0], ["H", 2.05, -0.2, 0], ["H", 1.15, -1.73, 0], ["C", -1.3, -0.75, 0]].concat(ME(-1.3, -0.75, -1)), { "0-1": 2 }), g: [0, 1, 2, 3, 4] },
  };
  /* carboxylic acid R–COOH, with chain of n carbons (R has n−1 carbons) */
  function acidDef(n, dimer) {
    const at = [["C", -2.2, 0, 0], ["O", -1.45, -1.15, 0], ["O", -1.45, 1.15, 0], ["H", -0.5, 1.15, 0]];
    if (n === 1) at.push(["H", -3.25, 0, 0]);
    else for (let i = 1; i < n; i++) { const x = -3.7 - (i - 1), y = (i - 1) % 2 === 0 ? 0 : -1.15, up = y === 0 ? 1 : -1, last = i === n - 1; at.push(["C", x, y, 0]); if (last) { if (i === 1) { at.push(["H", x - 0.37, 1.02, 0], ["H", x - 0.37, -0.51, 0.89], ["H", x - 0.37, -0.51, -0.89]); } else { at.push(["H", x, y + 0.55 * up, 0.89], ["H", x, y + 0.55 * up, -0.89], ["H", x - 0.95, y + 0.4 * up, 0]); } } else at.push(["H", x, y + 0.55 * up, 0.89], ["H", x, y + 0.55 * up, -0.89]); }
    const mono = at; if (!dimer) return def(mono, { "0-1": 2 });
    const all = mono.concat(mono.map((a) => [a[0], -a[1], -a[2], a[3]])), N = mono.length; return def(all, { "0-1": 2, [N + "-" + (N + 1)]: 2 });
  }
  FG.acid.d = acidDef(2, false);
  const AC = [{ n: 1, nm: "Methanoic acid", f: "HCOOH", bp: 101, pka: 3.75 }, { n: 2, nm: "Ethanoic acid", f: "CH₃COOH", bp: 118, pka: 4.76 }, { n: 3, nm: "Propanoic acid", f: "CH₃CH₂COOH", bp: 141, pka: 4.87 }, { n: 4, nm: "Butanoic acid", f: "CH₃CH₂CH₂COOH", bp: 164, pka: 4.82 }];
  const ARX = {
    litmus: { l: "Blue litmus", eq: "litmus: blue → red", c0: [70, 100, 225, 0.6], c1: [225, 60, 60, 0.6], gas: 0, g: "", note: "Aqueous ethanoic acid is a weak acid (about 1 % ionised in 0.1 M solution): H⁺ ions turn blue litmus red." },
    na2co3: { l: "Sodium carbonate", eq: "2CH₃COOH + Na₂CO₃ → 2CH₃COONa + H₂O + CO₂", c0: [225, 235, 240, 0.14], c1: [225, 235, 240, 0.14], gas: 1, g: "CO₂", note: "Carbonates fizz with carboxylic acids: carbon dioxide forms (it turns limewater milky). Phenols do not do this, so this test distinguishes acids." },
    mg: { l: "Magnesium", eq: "2CH₃COOH + Mg → (CH₃COO)₂Mg + H₂", c0: [225, 235, 240, 0.14], c1: [225, 235, 240, 0.14], gas: 1, g: "H₂", note: "Reactive metals displace hydrogen from the acid: bubbles of hydrogen, which pops with a lighted splint." },
    naoh: { l: "NaOH + phenolphthalein", eq: "CH₃COOH + NaOH → CH₃COONa + H₂O", c0: [235, 50, 150, 0.6], c1: [235, 235, 242, 0.14], gas: 0, g: "", note: "Neutralisation: the pink of phenolphthalein in alkali fades when enough acid is added; the salt is sodium ethanoate." },
    ester: { l: "Ethanol + H₂SO₄", eq: "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O", c0: [225, 235, 240, 0.14], c1: [240, 235, 190, 0.2], gas: 0, g: "", note: "Esterification: warm the acid with ethanol and a little concentrated H₂SO₄ catalyst. A sweet fruity smell shows the ester ethyl ethanoate; the reaction is reversible." },
  };
  const AK = Object.keys(ARX), GK = Object.keys(FG);
  C3.scenes.functionalGroups = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[2.2, 2.4, 10.5], [2.2, 2.0, 0]],
    values: { mode: "grp", g: "alkanol", acid: 2, dimer: 1, ar: "na2co3", prog: 0, run: 1, spin: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Activity", options: [{ value: "grp", label: "Functional groups: highlight the group" }, { value: "dimer", label: "Alkanoic acids: dimers and boiling points" }, { value: "react", label: "Alkanoic acids: reactions" }] },
        { type: "select", key: "g", label: "Functional group (groups mode)", options: GK.map((k) => ({ value: k, label: FG[k].series + ": " + FG[k].f })) },
        { type: "select", key: "acid", label: "Alkanoic acid (dimer mode)", options: AC.map((a) => ({ value: a.n, label: a.f + " — " + a.nm })) },
        { type: "toggle", key: "dimer", label: "Show the hydrogen-bonded dimer (dimer mode)" },
        { type: "select", key: "ar", label: "Reagent (reaction mode)", options: AK.map((k) => ({ value: k, label: ARX[k].l })) },
        { type: "range", key: "prog", label: "Extent of reaction (%)", min: 0, max: 100, step: 1, unit: " %" },
        { type: "toggle", key: "run", label: "Run the reaction automatically" },
        { type: "toggle", key: "spin", label: "Rotate molecule" },
      ];
    },
    views: [{ label: "Wide", cam: [[2.2, 2.4, 10.5], [2.2, 2.0, 0]] }, { label: "Close", cam: [[1.7, 2.2, 7.4], [1.7, 2.0, 0]] }],
    note: "A functional group is the atom or group of atoms that gives an organic compound its characteristic reactions. Alkenes C=C and alkynes C≡C are unsaturated; haloalkanes contain –X; alkanols –OH; alkanals –CHO (aldehyde, at the end of a chain); alkanones C=O inside the chain (ketone); alkanoic acids –COOH; alkanoates (esters) –COO–; amines –NH₂; amides –CONH₂. Carboxylic acids have unusually high boiling points because two molecules form a cyclic dimer joined by two O–H···O hydrogen bonds; they are weak acids, turning litmus red, fizzing with carbonates (CO₂), reacting with reactive metals (H₂) and forming esters with alcohols. The structures are real geometries drawn schematically; the dimer hydrogen bonds are shown as dashed lines.",
    onChange(S, s, c, key) { if (key === "mode" || key === "g" || key === "acid" || key === "dimer" || key === "ar") { rebuildF(S, s, c); if (key === "ar") c.prog = 0; } if (key === "mode") { c.prog = 0; C3.setView(S, { cam: c.mode === "react" ? [[1.4, 2.0, 6.8], [1.9, 1.7, 0]] : [[2.2, 2.4, 10.5], [2.2, 2.0, 0]] }); } },
    reset(S, s, c) { Object.assign(c, { mode: "grp", g: "alkanol", acid: 2, dimer: 1, ar: "na2co3", prog: 0, run: 1, spin: 1 }); rebuildF(S, s, c); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Series</th><th style="text-align:left">Group</th><th style="text-align:left">Example</th><th style="text-align:left">Name ending</th></tr>' + GK.map((k) => '<tr><td style="text-align:left">' + FG[k].series + '</td><td style="text-align:left">' + FG[k].grp + '</td><td style="text-align:left">' + FG[k].f + '</td><td style="text-align:left">' + FG[k].suffix + '</td></tr>').join("") + "</table>"; },
    build(S, s, c) {
      s.K = C3.kit(S); S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.root = new T.Group(); s.root.position.set(0, 2.0, 0); S.scene.add(s.root); s.mols = []; s.labs = []; s.dl = [];
      s.tube = s.K.vessel("testtube"); s.tube.group.position.set(-0.6, 0.07, 0); s.liq = s.tube.addLiquid({ color: [225, 235, 240], opacity: 0.14 }); s.liq.setVolume(12); s.bub = s.K.bubbles(s.tube, s.liq, { n: 40, x: 0, z: 0, baseY: 0.3, spread: 0.12 }); rebuildF(S, s, c);
    },
    update(S, s, c, dt) {
      const react = c.mode === "react"; s.tube.group.visible = react; if (c.mode === "grp" && c.spin || c.mode === "dimer" && c.spin) s.root.rotation.y += dt * 0.35; else if (react) s.root.rotation.y = 0;
      if (react) { const r = ARX[c.ar]; if (c.run && c.prog < 100) c.prog = Math.min(100, c.prog + dt * 14); const f = c.prog / 100, col = lerp3(r.c0, r.c1, f); s.liq.setColor(col.slice(0, 3), col[3]); s.liq.update(S.t); s.bub.rate = r.gas && c.prog > 0 && c.prog < 100 ? 0.9 : 0; s.bub.update(dt, S.t); }
      if (s.dl) s.dl.forEach((l) => { l.ln.material.opacity = 0.6 + 0.3 * Math.sin(S.t * 4); });
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      if (c.mode === "grp") { const f = FG[c.g]; H.pill(ctx, 10, 22, f.n + " (" + f.f + ")  ·  " + f.series, "#ffe9b8", 10.5); H.pill(ctx, 10, 44, "functional group: " + f.grp, "#ffd27a", 9.5); H.pill(ctx, 10, 66, "bright atoms = the functional group; dim atoms = the rest", "#9fb2d2", 8.6);
        sp(ctx, px, 58, 128, "Group and name", ["group: " + f.grp, "series: " + f.series, "name ending: " + f.suffix, "boiling point: " + f.bp + " °C"]); sp(ctx, px, 194, 126, "Characteristic test or reaction", [f.test], 8.4); }
      else if (c.mode === "dimer") { const a = AC.find((q) => q.n === c.acid) || AC[1]; H.pill(ctx, 10, 22, a.nm + " (" + a.f + ")", "#ffe9b8", 10.5); H.pill(ctx, 10, 44, c.dimer ? "dimer: two O–H···O hydrogen bonds (dashed)" : "single molecule", "#9fe3ff", 9.5); H.pill(ctx, 10, 66, "boiling point " + a.bp + " °C   pKa " + a.pka, "#ffd27a", 9);
        sp(ctx, px, 58, 128, "Why acids boil high", ["The –COOH group pairs two molecules into a dimer joined by two hydrogen bonds, so more energy is needed to separate them.", "pKa " + a.pka + ": a weak acid."], 8.4);
        H.panel(ctx, px, 194, 240, 126); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Boiling point (°C), Mr about 60", px + 8, 209); bars(ctx, px + 16, 232, 206, 62, [{ l: "butane", t: "-1", v: -1 }, { l: "propanone", t: "56", v: 56 }, { l: "propanol", t: "97", v: 97 }, { l: "ethanoic", t: "118", v: 118, hi: true }], { max: 125 }); }
      else { const r = ARX[c.ar]; H.pill(ctx, 10, 22, "Ethanoic acid + " + r.l, "#ffe9b8", 10.5); H.pill(ctx, 10, 44, r.eq, "#9fe3ff", 8.6); H.pill(ctx, 10, 66, r.gas ? "gas given off: " + r.g + "   progress " + c.prog.toFixed(0) + " %" : "progress " + c.prog.toFixed(0) + " %", "#ffd27a", 9);
        sp(ctx, px, 58, 150, "Observation", [r.note], 8.4); sp(ctx, px, 216, 100, "Weak acid", ["Ethanoic acid only partly ionises: CH₃COOH ⇌ CH₃COO⁻ + H⁺, so its reactions are slower than HCl at the same concentration."], 8.4);
        const q = S.proj(V3(-0.6, 2.65, 0)); H.pill(ctx, q.x, q.y, "ethanoic acid + reagent", "#cfe0f5", 8.6, "center"); }
      ctx.restore();
    },
    readouts(s, c) { if (c.mode === "grp") { const f = FG[c.g]; return [["Compound", f.n + " (" + f.f + ")"], ["Series", f.series], ["Functional group", f.grp], ["Name ending", f.suffix], ["Boiling point", f.bp + " °C"], ["Test", f.test]]; } if (c.mode === "dimer") { const a = AC.find((q) => q.n === c.acid) || AC[1]; return [["Acid", a.nm + " (" + a.f + ")"], ["Boiling point", a.bp + " °C"], ["pKa", String(a.pka)], ["Bonding", "cyclic dimer, two O–H···O hydrogen bonds"]]; } const r = ARX[c.ar]; return [["Reaction", r.l], ["Equation", r.eq], ["Observation", r.gas ? "effervescence: " + r.g : "colour change or smell"]]; },
    steps(s, c) { return [["Pick a functional group and read its test", c.mode === "grp" ? "now" : "done"], ["Show the carboxylic acid dimer", c.mode === "dimer" ? "now" : ""], ["Test ethanoic acid with litmus, Na₂CO₃ and Mg", c.mode === "react" ? "now" : ""], ["Compare aldehyde with ketone using Fehling's and Tollens' tests", c.g === "alkanal" || c.g === "alkanone" ? "now" : ""]]; },
  };
  function rebuildF(S, s, c) {
    clearRoot(s); s.labs = []; s.dl = []; s.root.rotation.y = 0; s.root.position.y = 2.0;
    if (c.mode === "grp") { const f = FG[c.g], m = mkMol(s.K, f.d, { fit: 4.4, max: 0.85 }); s.root.add(m.group); s.mols.push(m); highlight(m, f.g); return; }
    if (c.mode === "dimer") {
      const a = c.acid, d = acidDef(a, !!c.dimer), m = mkMol(s.K, d, { fit: 4.8, max: 0.8, raw: false }); s.root.add(m.group); s.mols.push(m);
      if (c.dimer) { const N = d.a.length / 2, pairs = [[3, N + 1], [N + 3, 1]]; pairs.forEach((p) => { const A = m.atoms[p[0]].mesh.position, B = m.atoms[p[1]].mesh.position, g = new T.BufferGeometry().setFromPoints([A.clone(), B.clone()]), ln = new T.Line(g, new T.LineDashedMaterial({ color: 0xffd27a, dashSize: 0.1, gapSize: 0.08, transparent: true, opacity: 0.9 })); ln.computeLineDistances(); m.group.add(ln); s.dl.push({ ln }); }); }
      return;
    }
    s.root.position.y = 1.3; const m = mkMol(s.K, acidDef(2, false), { fit: 2.4, max: 0.5 }); m.group.position.set(1.3, 0.9, 0); s.root.add(m.group); s.mols.push(m);
  }
  /* wire the per-scene rebuild functions */
  C3.scenes.benzene.onChange = function (S, s, c, key) { if (key === "mode" || key === "flip" || key === "rx") rebuildB(S, s, c); if (key === "mode") C3.setView(S, { cam: c.mode === "react" ? [[2.6, 2.0, 13.5], [2.6, 2.0, 0]] : [[2.2, 4.4, 9.2], [2.2, 2.0, 0]] }); };
  C3.scenes.benzene.reset = function (S, s, c) { Object.assign(c, { mode: "deloc", flip: 0, spin: 1, rx: "br" }); rebuildB(S, s, c); };
  const _bb = C3.scenes.benzene.build; C3.scenes.benzene.build = function (S, s, c) { s.K = C3.kit(S); S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.root = new T.Group(); s.root.position.set(0, 2.0, 0); S.scene.add(s.root); s.mols = []; s.labs = []; s.cl = []; rebuildB(S, s, c); };
})();
