/* c3d-oxnum.js — chemistry 3D, new module: oxidation numbers and redox equations */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const sgn = (n) => (n > 0 ? "+" + n : n < 0 ? "−" + Math.abs(n) : "0");
  const d4 = (r) => [[r, r, r], [-r, -r, r], [-r, r, -r], [r, -r, -r]]; /* tetrahedral vertices */
  const tet = (ce, onc, le, onl, r) => [{ el: ce, on: onc, p: [0, 0, 0] }].concat(d4(r).map((p) => ({ el: le, on: onl, p })));
  const SP = {
    h2o: { f: "H₂O", name: "Water", q: 0, atoms: [{ el: "O", on: -2, p: [0, 0, 0] }, { el: "H", on: 1, p: [0.757, 0.586, 0] }, { el: "H", on: 1, p: [-0.757, 0.586, 0] }], bonds: [[0, 1, 1], [0, 2, 1]], hint: "H is +1 and O is −2: 2(+1) + (−2) = 0, the charge of the molecule." },
    nacl: { f: "NaCl", name: "Sodium chloride (ionic)", q: 0, atoms: [{ el: "Na", on: 1, p: [-1.4, 0, 0] }, { el: "Cl", on: -1, p: [1.4, 0, 0] }], bonds: [], hint: "In an ionic compound the oxidation number equals the ion charge: Na⁺ is +1 and Cl⁻ is −1." },
    co2: { f: "CO₂", name: "Carbon dioxide", q: 0, atoms: [{ el: "C", on: 4, p: [0, 0, 0] }, { el: "O", on: -2, p: [1.16, 0, 0] }, { el: "O", on: -2, p: [-1.16, 0, 0] }], bonds: [[0, 1, 2], [0, 2, 2]], hint: "O is −2, so 2(−2) + C = 0 gives C = +4." },
    ch4: { f: "CH₄", name: "Methane", q: 0, atoms: tet("C", -4, "H", 1, 0.63), bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], hint: "H is +1, so 4(+1) + C = 0 gives C = −4: carbon is more electronegative than hydrogen." },
    h2o2: { f: "H₂O₂", name: "Hydrogen peroxide", q: 0, atoms: [{ el: "O", on: -1, p: [-0.74, 0, 0] }, { el: "O", on: -1, p: [0.74, 0, 0] }, { el: "H", on: 1, p: [-1.1, 0.85, 0.4] }, { el: "H", on: 1, p: [1.1, -0.85, 0.4] }], bonds: [[0, 1, 1], [0, 2, 1], [1, 3, 1]], hint: "An exception: in a peroxide O–O bond, O is −1 (not −2). 2(+1) + 2(−1) = 0." },
    so2: { f: "SO₂", name: "Sulphur dioxide", q: 0, atoms: [{ el: "S", on: 4, p: [0, 0, 0] }, { el: "O", on: -2, p: [1.24, 0.7, 0] }, { el: "O", on: -2, p: [-1.24, 0.7, 0] }], bonds: [[0, 1, 2], [0, 2, 2]], hint: "O is −2, so S + 2(−2) = 0 gives S = +4." },
    h2s: { f: "H₂S", name: "Hydrogen sulphide", q: 0, atoms: [{ el: "S", on: -2, p: [0, 0, 0] }, { el: "H", on: 1, p: [0.96, 0.94, 0] }, { el: "H", on: 1, p: [-0.96, 0.94, 0] }], bonds: [[0, 1, 1], [0, 2, 1]], hint: "H is +1, so 2(+1) + S = 0 gives S = −2." },
    so4: { f: "SO₄²⁻", name: "Sulphate ion", q: -2, atoms: tet("S", 6, "O", -2, 0.85), bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [0, 4, 2]], hint: "O is −2, so S + 4(−2) = −2 gives S = +6. The sum must equal the ion charge." },
    no3: { f: "NO₃⁻", name: "Nitrate ion", q: -1, atoms: [{ el: "N", on: 5, p: [0, 0, 0] }, { el: "O", on: -2, p: [1.24, 0, 0] }, { el: "O", on: -2, p: [-0.62, 0, 1.07] }, { el: "O", on: -2, p: [-0.62, 0, -1.07] }], bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1]], hint: "N + 3(−2) = −1 gives N = +5." },
    nh4: { f: "NH₄⁺", name: "Ammonium ion", q: 1, atoms: tet("N", -3, "H", 1, 0.6), bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], hint: "H is +1, so N + 4(+1) = +1 gives N = −3." },
    mno4: { f: "MnO₄⁻", name: "Permanganate ion", q: -1, atoms: tet("Mn", 7, "O", -2, 0.94), bonds: [[0, 1, 2], [0, 2, 2], [0, 3, 2], [0, 4, 1]], hint: "Mn + 4(−2) = −1 gives Mn = +7, the highest oxidation state of manganese: a strong oxidising agent." },
    cr2o7: { f: "Cr₂O₇²⁻", name: "Dichromate ion", q: -2, atoms: [{ el: "Cr", on: 6, p: [-1.5, 0, 0] }, { el: "Cr", on: 6, p: [1.5, 0, 0] }, { el: "O", on: -2, p: [0, 0.4, 0] }, { el: "O", on: -2, p: [-2.0, 0.95, 0] }, { el: "O", on: -2, p: [-2.0, -0.45, 0.85] }, { el: "O", on: -2, p: [-2.0, -0.45, -0.85] }, { el: "O", on: -2, p: [2.0, 0.95, 0] }, { el: "O", on: -2, p: [2.0, -0.45, 0.85] }, { el: "O", on: -2, p: [2.0, -0.45, -0.85] }], bonds: [[0, 2, 1], [1, 2, 1], [0, 3, 2], [0, 4, 1], [0, 5, 1], [1, 6, 2], [1, 7, 1], [1, 8, 1]], hint: "2Cr + 7(−2) = −2 gives 2Cr = +12, so Cr = +6: a strong oxidising agent (orange)." },
    fe2o3: { f: "Fe₂O₃", name: "Iron(III) oxide (ionic)", q: 0, atoms: [{ el: "Fe", on: 3, p: [-1.6, 0, 0] }, { el: "Fe", on: 3, p: [1.6, 0, 0] }, { el: "O", on: -2, p: [0, 1.1, 0] }, { el: "O", on: -2, p: [0, -0.55, 0.95] }, { el: "O", on: -2, p: [0, -0.55, -0.95] }], bonds: [], hint: "3(−2) + 2Fe = 0 gives 2Fe = +6, so Fe = +3: the name iron(III) oxide shows the oxidation state." },
    cl2: { f: "Cl₂", name: "Chlorine (element)", q: 0, atoms: [{ el: "Cl", on: 0, p: [-1.0, 0, 0] }, { el: "Cl", on: 0, p: [1.0, 0, 0] }], bonds: [[0, 1, 1]], hint: "An atom in an uncombined element always has oxidation number 0." },
    o2: { f: "O₂", name: "Oxygen (element)", q: 0, atoms: [{ el: "O", on: 0, p: [-0.6, 0, 0] }, { el: "O", on: 0, p: [0.6, 0, 0] }], bonds: [[0, 1, 2]], hint: "Elements have oxidation number 0, even though O is usually −2 in compounds." },
  };
  const SK = Object.keys(SP);
  const COLS = { Mn: 0x9a3ad6, Cr: 0x8a96a8, Fe: 0xb8651b };
  /* redox reactions: changes [element, from, to], half-equations, colours (r,g,b,opacity) */
  const RX = {
    mg: { eq: "Mg + 2HCl → MgCl₂ + H₂", ch: [["Mg", 0, 2], ["H", 1, 0]], ox: "Mg", red: "H⁺ (in HCl)", ho: "Mg → Mg²⁺ + 2e⁻", hr: "2H⁺ + 2e⁻ → H₂", e: 2, c0: [225, 235, 240, 0.14], c1: [225, 235, 240, 0.14], gas: 1, solid: "Mg", look: "magnesium dissolves, hydrogen bubbles off" },
    zncu: { eq: "Zn + CuSO₄ → ZnSO₄ + Cu", ch: [["Zn", 0, 2], ["Cu", 2, 0]], ox: "Zn", red: "Cu²⁺", ho: "Zn → Zn²⁺ + 2e⁻", hr: "Cu²⁺ + 2e⁻ → Cu", e: 2, c0: [60, 130, 220, 0.6], c1: [225, 235, 240, 0.14], gas: 0, solid: "Zn", look: "blue colour fades, red-brown copper deposits on the zinc" },
    fei: { eq: "2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂", ch: [["Fe", 3, 2], ["I", -1, 0]], ox: "I⁻", red: "Fe³⁺", ho: "2I⁻ → I₂ + 2e⁻", hr: "2Fe³⁺ + 2e⁻ → 2Fe²⁺", e: 2, c0: [235, 215, 120, 0.35], c1: [140, 70, 30, 0.75], gas: 0, solid: "", look: "pale yellow turns brown as iodine forms" },
    cl2br: { eq: "Cl₂ + 2Br⁻ → 2Cl⁻ + Br₂", ch: [["Cl", 0, -1], ["Br", -1, 0]], ox: "Br⁻", red: "Cl₂", ho: "2Br⁻ → Br₂ + 2e⁻", hr: "Cl₂ + 2e⁻ → 2Cl⁻", e: 2, c0: [235, 245, 225, 0.15], c1: [240, 140, 40, 0.65], gas: 0, solid: "", look: "colourless turns orange-brown as bromine forms" },
    mnfe: { eq: "MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O", ch: [["Mn", 7, 2], ["Fe", 2, 3]], ox: "Fe²⁺", red: "MnO₄⁻", ho: "Fe²⁺ → Fe³⁺ + e⁻   (× 5)", hr: "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O", e: 5, c0: [150, 20, 120, 0.8], c1: [250, 238, 200, 0.18], gas: 0, solid: "", look: "purple permanganate decolourises" },
    crfe: { eq: "Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O", ch: [["Cr", 6, 3], ["Fe", 2, 3]], ox: "Fe²⁺", red: "Cr₂O₇²⁻", ho: "Fe²⁺ → Fe³⁺ + e⁻   (× 6)", hr: "Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O", e: 6, c0: [240, 140, 30, 0.72], c1: [50, 140, 70, 0.72], gas: 0, solid: "", look: "orange dichromate turns green" },
    h2o2: { eq: "2H₂O₂ → 2H₂O + O₂", ch: [["O", -1, -2], ["O", -1, 0]], ox: "H₂O₂ (forming O₂)", red: "H₂O₂ (forming H₂O)", ho: "H₂O₂ → O₂ + 2H⁺ + 2e⁻", hr: "H₂O₂ + 2H⁺ + 2e⁻ → 2H₂O", e: 2, c0: [225, 235, 240, 0.14], c1: [225, 235, 240, 0.14], gas: 1, solid: "", look: "oxygen bubbles off (MnO₂ catalyst): H₂O₂ is both oxidised and reduced, a disproportionation" },
  };
  const RK = Object.keys(RX);

  C3.scenes.oxidationNumbers = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[1.7, 2.4, 8.2], [1.7, 1.6, 0]],
    values: { mode: "assign", sp: "so4", rx: "mnfe", prog: 0, run: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Activity", options: [{ value: "assign", label: "Assign oxidation numbers to atoms in a species" }, { value: "react", label: "Follow oxidation numbers in a redox reaction" }] },
        { type: "select", key: "sp", label: "Species (assign mode)", options: SK.map((k) => ({ value: k, label: SP[k].f + " — " + SP[k].name })) },
        { type: "select", key: "rx", label: "Reaction (reaction mode)", options: RK.map((k) => ({ value: k, label: RX[k].eq })) },
        { type: "range", key: "prog", label: "Extent of reaction (%)", min: 0, max: 100, step: 1, unit: " %" },
        { type: "toggle", key: "run", label: "Run the reaction automatically" },
        { type: "button", label: "Restart reaction", action: (S, s, c) => { c.prog = 0; } },
      ];
    },
    views: [{ label: "Front", cam: [[1.7, 2.4, 8.2], [1.7, 1.6, 0]] }, { label: "Beaker", cam: [[1.5, 1.9, 5.4], [1.5, 1.3, 0]] }],
    note: "The oxidation number is the charge an atom would have if all its bonds were treated as ionic. Rules: an atom in an element is 0; a monatomic ion has its own charge; O is −2 (−1 in peroxides); H is +1 (−1 in metal hydrides); the numbers in a species add up to its charge. Oxidation is an increase in oxidation number (loss of electrons) and reduction is a decrease (gain of electrons). The reducing agent is oxidised; the oxidising agent is reduced. In a balanced redox equation the electrons lost equal the electrons gained, which is how the half-equations are scaled. The model gives textbook oxidation numbers; the extent slider just moves the colour change along.",
    onChange(S, s, c, key) { if (key === "mode" || key === "sp") rebuildMol(S, s, c); if (key === "rx") c.prog = 0; if (key === "mode") C3.setView(S, { cam: c.mode === "react" ? [[1.5, 1.9, 5.4], [1.5, 1.3, 0]] : [[1.7, 2.4, 8.2], [1.7, 1.6, 0]] }); },
    reset(S, s, c) { Object.assign(c, { mode: "assign", sp: "so4", rx: "mnfe", prog: 0, run: 1 }); rebuildMol(S, s, c); },
    table() {
      return '<table class="c3-table"><tr><th style="text-align:left">Rule</th><th style="text-align:left">Oxidation number</th><th style="text-align:left">Example</th></tr><tr><td style="text-align:left">atom in an element</td><td style="text-align:left">0</td><td style="text-align:left">Cl₂, O₂, Fe</td></tr><tr><td style="text-align:left">monatomic ion</td><td style="text-align:left">its charge</td><td style="text-align:left">Na⁺ +1, Cl⁻ −1</td></tr><tr><td style="text-align:left">oxygen</td><td style="text-align:left">−2 (peroxides −1)</td><td style="text-align:left">H₂O −2, H₂O₂ −1</td></tr><tr><td style="text-align:left">hydrogen</td><td style="text-align:left">+1 (metal hydrides −1)</td><td style="text-align:left">HCl +1, NaH −1</td></tr><tr><td style="text-align:left">total</td><td style="text-align:left">= charge on the species</td><td style="text-align:left">SO₄²⁻: +6 + 4(−2) = −2</td></tr></table>';
    },
    build(S, s, c) {
      s.K = C3.kit(S); S.mk.box(11, 0.1, 4, M.matte(0xb99a74, 0.6), 0.5, -0.05, 0);
      s.bk = s.K.beaker(); s.bk.group.position.set(0, 0, 0); s.liq = s.bk.addLiquid({ color: 0xdddddd, opacity: 0.3 }); s.liq.setVolume(240);
      s.strip = new T.Mesh(new T.BoxGeometry(0.12, 1.6, 0.5), M.steel()); s.strip.position.set(0, 1.05, 0); S.scene.add(s.strip);
      s.cu = new T.Mesh(new T.BoxGeometry(0.16, 1.2, 0.54), new T.MeshStandardMaterial({ color: 0xb4592f, roughness: 0.5, metalness: 0.5 })); s.cu.position.set(0, 0.8, 0); S.scene.add(s.cu);
      s.bub = s.K.bubbles(s.bk, s.liq, { n: 70, x: 0, z: 0, baseY: 0.4, spread: 0.5 }); s.molG = new T.Group(); S.scene.add(s.molG); s.mol = null; rebuildMol(S, s, c);
    },
    update(S, s, c, dt) {
      const assign = c.mode === "assign"; s.molG.visible = assign; s.bk.group.visible = !assign;
      if (assign) { s.molG.rotation.y += dt * 0.35; s.strip.visible = s.cu.visible = false; s.bub.update && 0; return; }
      const r = RX[c.rx]; if (c.run && c.prog < 100 && dt > 0) c.prog = Math.min(100, c.prog + dt * 9); const p = c.prog / 100;
      const col = r.c0.map((v, i) => v + (r.c1[i] - v) * p); s.liq.setColor(col.slice(0, 3), col[3]); s.liq.update(S.t);
      s.strip.visible = !!r.solid; s.cu.visible = r.solid === "Zn" && p > 0.02;
      if (r.solid) { s.strip.material = r.solid === "Mg" ? M.matte(0xc9ccd2, 0.4) : M.matte(0x9aa3ad, 0.45); const k = clamp(1 - p * (r.solid === "Mg" ? 0.92 : 0.5), 0.06, 1); s.strip.scale.set(k, 1, k); s.cu.scale.set(clamp(p * 1.2, 0.01, 1), 1, 1); }
      s.bub.rate = r.gas ? 0.25 + (1 - p) * 0.9 : 0; s.bub.update(dt, S.t);
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      if (c.mode === "assign") ovAssign(ctx, s, c, w, h, S, px); else ovReact(ctx, s, c, w, h, S, px);
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "assign") { const sp = SP[c.sp], rows = []; const seen = {}; sp.atoms.forEach((a) => { const k = a.el + a.on; if (!seen[k]) seen[k] = { el: a.el, on: a.on, n: 0 }; seen[k].n++; }); Object.values(seen).forEach((x) => rows.push([x.el + " (× " + x.n + ")", "oxidation number " + sgn(x.on)])); rows.push(["Sum of oxidation numbers", sgn(sp.atoms.reduce((q, a) => q + a.on, 0)) + " = charge " + (sp.q > 0 ? "+" + sp.q : sp.q < 0 ? "−" + Math.abs(sp.q) : "0")]); return rows; }
      const r = RX[c.rx]; return [["Reaction", r.eq]].concat(r.ch.map((x) => [x[0], sgn(x[1]) + " → " + sgn(x[2]) + (x[2] > x[1] ? "  oxidised" : "  reduced")])).concat([["Oxidising agent (reduced)", r.red], ["Reducing agent (oxidised)", r.ox], ["Electrons transferred", String(r.e)]]);
    },
    steps(s, c) { return [["Pick a species and find the atoms with fixed oxidation numbers (O, H)", "done"], ["Use 'sum = charge' to find the other atom", c.mode === "assign" ? "now" : "done"], ["Switch to a reaction and find which atom's number goes up", c.mode === "react" ? "now" : ""], ["Write the two half-equations and balance the electrons", ""]]; },
  };
  function rebuildMol(S, s, c) {
    if (s.mol) { s.molG.remove(s.mol.group); s.mol = null; } const sp = SP[c.sp]; if (!sp) return;
    const cx = sp.atoms.reduce((q, a) => q + a.p[0], 0) / sp.atoms.length, cy = sp.atoms.reduce((q, a) => q + a.p[1], 0) / sp.atoms.length, cz = sp.atoms.reduce((q, a) => q + a.p[2], 0) / sp.atoms.length;
    const mol = s.K.molecule({ atoms: sp.atoms.map((a) => ({ el: a.el, p: [a.p[0] - cx, a.p[1] - cy, a.p[2] - cz] })), bonds: sp.bonds }); mol.refresh(0.15); s.molG.add(mol.group); s.mol = mol; s.molG.position.set(0, 2.0, 0);
    mol.atoms.forEach((a, i) => { const on = sp.atoms[i].on, col = new T.Color(COLS[a.el] || (a.mesh.material.color.getHex())); a.mesh.material.color.copy(col); if (!(a.el in { H: 1, C: 1, N: 1, O: 1, S: 1, Cl: 1, Na: 1 })) { a.vdw = 1.5; a.bs = 0.36; } a.mesh.scale.setScalar(a.bs * (sp.atoms.length > 6 ? 0.9 : 1.05)); });
    mol.group.scale.setScalar(sp.atoms.length > 6 ? 0.9 : 1.1);
  }
  function ovAssign(ctx, s, c, w, h, S, px) {
    const sp = SP[c.sp]; H.pill(ctx, 10, 22, sp.f + " — " + sp.name, "#ffe9b8", 11); H.pill(ctx, 10, 44, "oxidation numbers add up to the charge: " + (sp.q > 0 ? "+" + sp.q : sp.q < 0 ? "−" + Math.abs(sp.q) : "0"), "#9fe3ff", 9.5);
    s.mol.atoms.forEach((a, i) => { const on = sp.atoms[i].on, wpos = s.mol.group.localToWorld(a.p.clone()), q = S.proj(wpos); H.pill(ctx, q.x, q.y - 4, sgn(on), on > 0 ? "#ffb48a" : on < 0 ? "#9fd0ff" : "#cfe0f5", 9.5, "center"); });
    const seen = {}; sp.atoms.forEach((a) => { const k = a.el + "|" + a.on; if (!seen[k]) seen[k] = { el: a.el, on: a.on, n: 0 }; seen[k].n++; }); const parts = Object.values(seen).map((x) => x.n + "×(" + sgn(x.on) + ")"); const tot = sp.atoms.reduce((q, a) => q + a.on, 0);
    H.panel(ctx, px, 58, 240, 120); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Add them up", px + 8, 73); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff";
    let y = 90; Object.values(seen).forEach((x) => { ctx.fillStyle = x.on > 0 ? "#ffb48a" : x.on < 0 ? "#9fd0ff" : "#cfe0f5"; ctx.fillText(x.el + ":  " + x.n + " × (" + sgn(x.on) + ") = " + sgn(x.n * x.on), px + 8, y); y += 14; });
    ctx.fillStyle = "#8dffb8"; ctx.fillText("Σ = " + parts.join(" + ") + " = " + sgn(tot), px + 8, y + 6); ctx.fillText("charge = " + (sp.q > 0 ? "+" + sp.q : sp.q < 0 ? "−" + Math.abs(sp.q) : "0") + "   ✓", px + 8, y + 22);
    H.panel(ctx, px, 186, 240, 100); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Working", px + 8, 201); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; wrapT(ctx, sp.hint, px + 8, 216, 224, 11);
    ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb2d2"; ctx.fillText("orange chip = positive, blue chip = negative oxidation number", 10, h - 12);
  }
  function ovReact(ctx, s, c, w, h, S, px) {
    const r = RX[c.rx], p = c.prog / 100; H.pill(ctx, 10, 22, r.eq, "#ffe9b8", 10); H.pill(ctx, 10, 44, r.look, "#9fe3ff", 8.8); H.pill(ctx, 10, 66, "extent of reaction " + c.prog.toFixed(0) + " %", "#8dffb8", 9);
    /* number line −4 … +7 */
    H.panel(ctx, px, 58, 240, 128); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Oxidation number line", px + 8, 73);
    const x0 = px + 18, x1 = px + 222, ly = 152, f = (v) => x0 + ((v + 4) / 11) * (x1 - x0); ctx.strokeStyle = "#9fb2d2"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0 - 6, ly); ctx.lineTo(x1 + 6, ly); ctx.stroke(); ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; for (let v = -4; v <= 7; v++) { ctx.fillStyle = "#9fb2d2"; ctx.beginPath(); ctx.moveTo(f(v), ly - 3); ctx.lineTo(f(v), ly + 3); ctx.stroke(); ctx.fillText(sgn(v), f(v), ly + 13); }
    r.ch.forEach((x, i) => { const y = ly - 24 - i * 32, a = f(x[1]), b = f(x[1] + (x[2] - x[1]) * Math.min(1, p * 1.6)), up = x[2] > x[1]; ctx.strokeStyle = up ? "#ff9a6a" : "#7ab8ff"; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y); ctx.stroke(); ctx.beginPath(); ctx.arc(f(x[1]), y, 3, 0, 7); ctx.fill(); const dir = up ? 1 : -1; if (Math.abs(b - a) > 6) { ctx.beginPath(); ctx.moveTo(b, y); ctx.lineTo(b - dir * 6, y - 4); ctx.lineTo(b - dir * 6, y + 4); ctx.fill(); } ctx.fillStyle = "#e8f0ff"; ctx.fillText(x[0] + ": " + sgn(x[1]) + " → " + sgn(x[2]), (f(x[1]) + f(x[2])) / 2, y - 6); ctx.fillStyle = up ? "#ff9a6a" : "#7ab8ff"; ctx.fillText(up ? "oxidised" : "reduced", (f(x[1]) + f(x[2])) / 2, y + 12); });
    ctx.textAlign = "left"; H.panel(ctx, px, 194, 240, 118); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Half-equations (" + r.e + " e⁻ transferred)", px + 8, 209); ctx.font = "8.6px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#ffb48a"; ctx.fillText("ox: " + r.ho, px + 8, 224); ctx.fillStyle = "#9fd0ff"; wrapT(ctx, "red: " + r.hr, px + 8, 238, 224, 10); ctx.fillStyle = "#8dffb8"; ctx.fillText("electrons lost = electrons gained = " + r.e, px + 8, 266); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("reducing agent: " + r.ox, px + 8, 281); ctx.fillText("oxidising agent: " + r.red, px + 8, 293);
  }
})();
