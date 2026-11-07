/* c3d-transition.js — chemistry 3D, new module: transition-metal chemistry (variable oxidation states, coloured ions, complex ions) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  /* oxidation-state ladders (species from highest to lowest oxidation state) and the E° of each couple: species i is reduced to i+1 */
  const LAD = {
    v: { name: "Vanadium", st: [{ f: "VO₂⁺", ox: 5, col: [238, 214, 60], d: 0, nm: "yellow" }, { f: "VO²⁺", ox: 4, col: [50, 110, 225], d: 1, nm: "blue" }, { f: "V³⁺", ox: 3, col: [50, 160, 90], d: 2, nm: "green" }, { f: "V²⁺", ox: 2, col: [150, 100, 205], d: 3, nm: "violet" }], E: [1.0, 0.34, -0.26], eqs: ["VO₂⁺ + 2H⁺ + e⁻ → VO²⁺ + H₂O   E° = +1.00 V", "VO²⁺ + 2H⁺ + e⁻ → V³⁺ + H₂O   E° = +0.34 V", "V³⁺ + e⁻ → V²⁺   E° = −0.26 V"] },
    cr: { name: "Chromium", st: [{ f: "Cr₂O₇²⁻", ox: 6, col: [236, 130, 30], d: 0, nm: "orange" }, { f: "Cr³⁺", ox: 3, col: [70, 150, 80], d: 3, nm: "green" }, { f: "Cr²⁺", ox: 2, col: [60, 110, 225], d: 4, nm: "blue" }], E: [1.33, -0.41], eqs: ["Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O   E° = +1.33 V", "Cr³⁺ + e⁻ → Cr²⁺   E° = −0.41 V"] },
  };
  const RED = { fe: { n: "Fe²⁺ (iron(II) ions)", E: 0.77, eq: "Fe³⁺ + e⁻ ⇌ Fe²⁺ (E° = +0.77 V)" }, zn: { n: "Zinc metal in acid", E: -0.76, eq: "Zn²⁺ + 2e⁻ ⇌ Zn (E° = −0.76 V)" } };
  const CX = {
    cunh3: { n: "Cu²⁺(aq) + NH₃(aq)", ion: "[Cu(H₂O)₆]²⁺", stages: [{ x: 0, f: "[Cu(H₂O)₆]²⁺", col: [130, 195, 240], nm: "pale blue solution" }, { x: 1.5, f: "Cu(OH)₂(s)", col: [140, 190, 240], nm: "pale blue precipitate", ppt: 1 }, { x: 5, f: "[Cu(NH₃)₄(H₂O)₂]²⁺", col: [25, 55, 190], nm: "deep blue solution" }], eq: "Cu²⁺ + 2OH⁻ → Cu(OH)₂↓ ;  Cu(OH)₂ + 4NH₃ → [Cu(NH₃)₄]²⁺ + 2OH⁻", lig: "NH₃(aq)" },
    cucl: { n: "Cu²⁺(aq) + conc. HCl", ion: "[Cu(H₂O)₆]²⁺", stages: [{ x: 0, f: "[Cu(H₂O)₆]²⁺", col: [130, 195, 240], nm: "blue solution" }, { x: 4, f: "mixture", col: [90, 190, 130], nm: "green (mixture of both)" }, { x: 9, f: "[CuCl₄]²⁻", col: [205, 200, 60], nm: "yellow-green solution" }], eq: "[Cu(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CuCl₄]²⁻ + 6H₂O", lig: "conc. HCl" },
    fescn: { n: "Fe³⁺(aq) + SCN⁻(aq)", ion: "[Fe(H₂O)₆]³⁺", stages: [{ x: 0, f: "[Fe(H₂O)₆]³⁺", col: [240, 228, 170], nm: "pale yellow solution" }, { x: 3, f: "[Fe(SCN)(H₂O)₅]²⁺", col: [200, 40, 40], nm: "blood-red solution" }, { x: 8, f: "[Fe(SCN)(H₂O)₅]²⁺", col: [150, 20, 25], nm: "intense blood-red" }], eq: "[Fe(H₂O)₆]³⁺ + SCN⁻ ⇌ [Fe(SCN)(H₂O)₅]²⁺ + H₂O", lig: "KSCN(aq)" },
    cocl: { n: "Co²⁺(aq) + conc. HCl", ion: "[Co(H₂O)₆]²⁺", stages: [{ x: 0, f: "[Co(H₂O)₆]²⁺", col: [244, 150, 175], nm: "pink solution" }, { x: 4, f: "mixture", col: [150, 110, 190], nm: "violet (mixture)" }, { x: 9, f: "[CoCl₄]²⁻", col: [50, 90, 205], nm: "blue solution" }], eq: "[Co(H₂O)₆]²⁺ + 4Cl⁻ ⇌ [CoCl₄]²⁻ + 6H₂O", lig: "conc. HCl" },
    ninh3: { n: "Ni²⁺(aq) + NH₃(aq)", ion: "[Ni(H₂O)₆]²⁺", stages: [{ x: 0, f: "[Ni(H₂O)₆]²⁺", col: [120, 200, 130], nm: "green solution" }, { x: 1.5, f: "Ni(OH)₂(s)", col: [150, 210, 150], nm: "pale green precipitate", ppt: 1 }, { x: 5, f: "[Ni(NH₃)₆]²⁺", col: [90, 110, 215], nm: "blue-violet solution" }], eq: "Ni²⁺ + 2OH⁻ → Ni(OH)₂↓ ;  Ni(OH)₂ + 6NH₃ → [Ni(NH₃)₆]²⁺ + 2OH⁻", lig: "NH₃(aq)" },
  };
  const MN = { acid: { n: "acidic (dilute H₂SO₄)", prod: "Mn²⁺", col: [250, 235, 240], nm: "almost colourless (pale pink)", eq: "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O" }, neutral: { n: "neutral", prod: "MnO₂", col: [120, 80, 40], nm: "brown precipitate", eq: "MnO₄⁻ + 2H₂O + 3e⁻ → MnO₂ + 4OH⁻" }, alk: { n: "strongly alkaline", prod: "MnO₄²⁻", col: [30, 150, 70], nm: "green manganate(VI)", eq: "MnO₄⁻ + e⁻ → MnO₄²⁻" } };
  const D_BLOCK = [["Sc", "[Ar]3d¹4s²", "+3", "colourless"], ["Ti", "[Ar]3d²4s²", "+4, +3", "colourless / purple"], ["V", "[Ar]3d³4s²", "+5, +4, +3, +2", "yellow, blue, green, violet"], ["Cr", "[Ar]3d⁵4s¹", "+6, +3, +2", "orange, green, blue"], ["Mn", "[Ar]3d⁵4s²", "+7, +4, +2", "purple, brown, pale pink"], ["Fe", "[Ar]3d⁶4s²", "+3, +2", "yellow-brown, pale green"], ["Co", "[Ar]3d⁷4s²", "+3, +2", "pink (Co²⁺)"], ["Ni", "[Ar]3d⁸4s²", "+2", "green"], ["Cu", "[Ar]3d¹⁰4s¹", "+2, +1", "blue (Cu²⁺)"], ["Zn", "[Ar]3d¹⁰4s²", "+2", "colourless (full d)"]];
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const rgb = (c) => "rgb(" + c.map((v) => Math.round(v)).join(",") + ")";
  function ladder(c) { const L = LAD[c.mode === "cr" ? "cr" : "v"], R = RED[c.red]; let lim = 0; L.E.forEach((e, i) => { if (e > R.E && lim === i) lim = i + 1; }); return { L, R, lim }; }
  function refs(c) {
    if (c.mode === "v" || c.mode === "cr") return LAD[c.mode].st.map((s) => ({ f: s.f, sub: "+" + s.ox, col: s.col, d: s.d, nm: s.nm }));
    if (c.mode === "mn") return [{ f: "MnO₄⁻", sub: "+7", col: [140, 30, 160], d: 0, nm: "purple" }, { f: "MnO₄²⁻", sub: "+6", col: [30, 150, 70], d: 1, nm: "green" }, { f: "MnO₂", sub: "+4", col: [120, 80, 40], d: 3, nm: "brown solid" }, { f: "Mn²⁺", sub: "+2", col: [250, 235, 240], d: 5, nm: "pale pink" }];
    return CX[c.sys].stages.map((s) => ({ f: s.f, sub: "", col: s.col, nm: s.nm }));
  }
  function mainCol(c, s) {
    if (c.mode === "v" || c.mode === "cr") { const { L, lim } = ladder(c), pos = s.prog * lim, i = Math.min(L.st.length - 2, Math.floor(pos)), f = pos - i; if (lim === 0) return { col: L.st[0].col, idx: 0 }; const a = L.st[Math.min(i, L.st.length - 1)].col, b = L.st[Math.min(i + 1, L.st.length - 1)].col; return { col: pos >= L.st.length - 1 ? L.st[L.st.length - 1].col : mixc(a, b, f), idx: Math.round(pos) }; }
    if (c.mode === "mn") { const Vv = c.V, ep = 12.5, md = MN[c.med]; if (c.med === "acid") { const ex = Math.max(0, Vv - ep); return { col: Vv < ep ? mixc([218, 232, 208], [240, 232, 190], Vv / ep) : mixc([240, 232, 190], [190, 60, 170], clamp(ex / 2.5, 0, 1)), idx: Vv < ep ? 3 : ex > 0.1 ? 0 : 3 }; } return { col: Vv <= 0 ? [218, 232, 208] : mixc([218, 232, 208], md.col, clamp(Vv / 6, 0, 1)), idx: c.med === "neutral" ? 2 : 1 }; }
    const st = CX[c.sys].stages, x = c.x; let i = 0; while (i < st.length - 1 && x >= st[i + 1].x) i++; const a = st[i], b = st[Math.min(i + 1, st.length - 1)], f = i === st.length - 1 ? 0 : clamp((x - a.x) / (b.x - a.x), 0, 1); const col = mixc(a.col, b.col, f); let ppt = 0; if (CX[c.sys].stages.some((q) => q.ppt)) { const p = CX[c.sys].stages.find((q) => q.ppt); ppt = x < 0.3 ? 0 : x < p.x ? clamp((x - 0.3) / (p.x - 0.3), 0, 1) : clamp(1 - (x - p.x) / 2.5, 0, 1); } return { col, ppt, idx: f > 0.5 ? Math.min(st.length - 1, i + 1) : i };
  }

  C3.scenes.transitionMetals = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[0.8, 2.4, 9.6], [1.0, 1.6, 0]],
    values: { mode: "v", red: "zn", prog: 0, med: "acid", V: 0, sys: "cunh3", x: 0 },
    state: () => ({ prog: 0, run: false }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Topic", options: [{ value: "v", label: "Vanadium: four oxidation states" }, { value: "cr", label: "Chromium: oxidation states" }, { value: "mn", label: "Manganate(VII): colour and medium" }, { value: "cx", label: "Complex ions and ligand exchange" }] },
        { type: "select", key: "red", label: "Reducing agent", options: [{ value: "fe", label: "Fe²⁺ (E° +0.77 V)" }, { value: "zn", label: "Zinc in acid (E° −0.76 V)" }] },
        { type: "button", label: "Reduce the solution (add reducing agent)", action: (S, s) => { s.run = true; } },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s) => { s.prog = 0; s.run = false; } },
        { type: "select", key: "med", label: "Medium for KMnO₄", options: Object.keys(MN).map((k) => ({ value: k, label: MN[k].n })) },
        { type: "range", key: "V", label: "KMnO₄ (0.020 mol/dm³) added to 25 cm³ of 0.050 M Fe²⁺", min: 0, max: 20, step: 0.1, unit: " cm³" },
        { type: "select", key: "sys", label: "Metal ion and ligand", options: Object.keys(CX).map((k) => ({ value: k, label: CX[k].n })) },
        { type: "range", key: "x", label: "Ligand added (cm³)", min: 0, max: 10, step: 0.1, unit: " cm³" },
      ];
    },
    views: [{ label: "Bench", cam: [[0.8, 2.4, 9.6], [1.0, 1.6, 0]] }, { label: "Tubes", cam: [[0.3, 1.7, 5.4], [0.5, 1.2, 0]] }],
    note: "Transition elements have partly filled d subshells. That gives them (1) several oxidation states, (2) coloured compounds, because light promotes d electrons between split d orbitals and the complementary colour is seen, (3) complex ions with ligands (H₂O, NH₃, Cl⁻, SCN⁻) and (4) catalytic activity. Ions with an empty d⁰ or full d¹⁰ subshell (Sc³⁺, Zn²⁺) are colourless. A species is reduced by a reducing agent only if the reducing agent's E° is lower than the couple's: zinc (−0.76 V) can reduce all vanadium states to V²⁺, but Fe²⁺ (+0.77 V) stops at VO²⁺.",
    onChange(S, s, c, key) { s.prog = 0; s.run = false; },
    reset(S, s, c) { Object.assign(c, { mode: "v", red: "zn", prog: 0, med: "acid", V: 0, sys: "cunh3", x: 0 }); s.prog = 0; s.run = false; },
    table(s, c) { return '<table class="c3-table"><tr><th>Element</th><th style="text-align:left">Configuration</th><th>Oxidation states</th><th style="text-align:left">Colours of ions</th></tr>' + D_BLOCK.map((r) => '<tr class="' + (r[0] === (c.mode === "v" ? "V" : c.mode === "cr" ? "Cr" : c.mode === "mn" ? "Mn" : c.sys.slice(0, 2).replace(/^./, (ch) => ch.toUpperCase())) ? "ok" : "") + '"><td>' + r[0] + '</td><td style="text-align:left">' + r[1] + "</td><td>" + r[2] + '</td><td style="text-align:left">' + r[3] + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.m4 = new T.Matrix4(); S.mk.box(10, 0.1, 3, M.matte(0x2a2e36, 0.7), 0.4, -0.05, 0);
      s.bk = K.vessel("beaker"); s.bk.group.position.set(-3.0, 0, 0); s.liq = s.bk.addLiquid({ color: [238, 214, 60], opacity: 0.6 }); s.liq.setVolume(120); s.bub = K.bubbles(s.bk, s.liq, { n: 60, x: 0, z: 0, baseY: 0.8, spread: 1.8 }); s.ppt = K.precipitate(s.bk, s.liq, { n: 900, size: 0.1, color: 0x8ec0f0 });
      s.zn = new T.InstancedMesh(new T.SphereGeometry(0.1, 10, 8), M.steel(), 14); s.bk.group.add(s.zn); for (let i = 0; i < 14; i++) { s.m4.makeTranslation(Math.cos(i * 2.4) * (0.2 + (i % 4) * 0.12), 0.1 + (i % 3) * 0.05, Math.sin(i * 2.4) * (0.2 + (i % 4) * 0.12)); s.zn.setMatrixAt(i, s.m4); }
      s.tubes = []; s.liqs = []; for (let i = 0; i < 4; i++) { const t = K.vessel("testtube"); t.group.position.set(-1.0 + i * 0.85, 0.2, 0); const l = t.addLiquid({ color: [238, 214, 60], opacity: 0.6 }); l.setVolume(9); s.tubes.push(t); s.liqs.push(l); }
      s.rack = S.mk.rbox(3.6, 0.2, 1.0, 0.05, M.matte(0x7a5330, 0.55), 0.55, 0.1, 0); s.mk = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 16), new T.MeshBasicMaterial({ color: 0xffd27a })); s.mk.rotation.x = Math.PI; S.scene.add(s.mk);
      s.dr = new T.Group(); const pg = new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 0.8, 14), M.matte(0xd8eaf5, 0.08)); pg.position.y = 0.4; s.dr.add(pg); const pb = new T.Mesh(new T.SphereGeometry(0.12, 18, 12), M.rubber()); pb.position.y = 0.95; pb.scale.y = 1.3; s.dr.add(pb); s.dr.position.set(-3.0, 3.1, 0); S.scene.add(s.dr); s.drops = K.drops({ color: 0xb02ca0 });
    },
    update(S, s, c, dt) {
      const lad = c.mode === "v" || c.mode === "cr", mn = c.mode === "mn", cx = c.mode === "cx", rf = refs(c);
      if (lad && s.run && dt > 0) s.prog = Math.min(1, s.prog + dt / 8); const mc = mainCol(c, s); s.mc = mc;
      s.liq.setColor(mc.col, mn && c.med === "acid" && c.V < 12.5 ? 0.55 : 0.85); s.liq.setVolume(120 + (mn ? c.V * 2 : 0) + (cx ? c.x * 2 : 0)); s.liq.update(S.t);
      s.zn.visible = lad && c.red === "zn"; s.bub.rate = lad && c.red === "zn" && s.run && s.prog < 1 ? 30 : 0; s.bub.update(dt, S.t);
      s.ppt.amount = mn && c.med === "neutral" ? clamp(c.V / 6, 0, 1) : cx ? (mc.ppt || 0) : 0; s.ppt.setColor(mn ? 0x5a3a18 : cx ? (CX[c.sys].stages.find((q) => q.ppt) ? rgbhex(CX[c.sys].stages.find((q) => q.ppt).col) : 0xffffff) : 0xffffff); s.ppt.update(dt);
      s.tubes.forEach((t, i) => { const r = rf[i]; t.group.visible = !!r; if (r) { s.liqs[i].setColor(r.col, r.nm.indexOf("solid") >= 0 || r.col[0] > 245 ? 0.45 : 0.62); s.liqs[i].setVolume(9); s.liqs[i].update(S.t); } });
      const mi = clamp(mc.idx, 0, rf.length - 1); s.mk.position.set(-1.0 + mi * 0.85, 2.8 + 0.06 * Math.sin(S.t * 3), 0); s.mi = mi;
      s.dr.visible = mn && c.med === "acid"; if (dt > 0 && mn && c.med === "acid") { s.dd = (s.dd || 0) + (s.lastV != null ? Math.max(0, c.V - s.lastV) : 0) * 18; if (s.dd > 0.5 && c.V > 0) { s.dd -= 1; s.drops.emit(-3.0, 3.0, 0, 0.18 + s.liq.level * CM, 0.03); } } s.lastV = c.V; s.drops.update(dt);
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); const px = w - 250, rf = refs(c), mc = s.mc; ctx.textAlign = "left"; let title, sub, eqs;
      if (c.mode === "v" || c.mode === "cr") { const { L, R, lim } = ladder(c); title = L.name + " + " + R.n; sub = "now " + L.st[s.mi].f + ", oxidation state +" + L.st[s.mi].ox + " (" + L.st[s.mi].nm + ")"; eqs = L.eqs.concat([R.eq, "reduces down to " + L.st[lim].f + " (+" + L.st[lim].ox + ")"]); }
      else if (c.mode === "mn") { const md = MN[c.med], ep = 12.5; title = "KMnO₄ in " + md.n + " medium"; sub = c.med === "acid" ? (c.V < ep ? "purple MnO₄⁻ is decolourised by Fe²⁺" : c.V < ep + 0.2 ? "END-POINT: first permanent pink" : "excess MnO₄⁻: solution stays purple") : "product: " + md.prod + " (" + md.nm + ")"; eqs = [md.eq, c.med === "acid" ? "MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O" : "colour depends on the medium", c.med === "acid" ? "end-point at 12.5 cm³ (1.25 mmol Fe²⁺ ÷ 5 = 0.25 mmol MnO₄⁻)" : ""]; }
      else { const X = CX[c.sys]; title = X.n; sub = rf[Math.min(rf.length - 1, s.mi)].nm; eqs = [X.eq, "ligand added: " + X.lig + ", " + c.x.toFixed(1) + " cm³"]; }
      H.pill(ctx, 10, 22, title, "#ffe9b8", 11); H.pill(ctx, 10, 44, sub, "#9fe3ff", 10);
      H.panel(ctx, px, 58, 240, 118); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Species in the rack", px + 8, 73);
      rf.forEach((r, i) => { const y = 88 + i * 20; ctx.fillStyle = rgb(r.col); ctx.fillRect(px + 8, y - 9, 16, 12); ctx.strokeStyle = i === s.mi ? "#ffd27a" : "rgba(255,255,255,0.3)"; ctx.lineWidth = i === s.mi ? 2 : 1; ctx.strokeRect(px + 8, y - 9, 16, 12); ctx.font = (i === s.mi ? "600 " : "") + "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = i === s.mi ? "#ffd27a" : "#e8f0ff"; ctx.fillText(r.f + (r.sub ? "  " + r.sub : ""), px + 30, y); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText(r.nm + (r.d != null ? "  d" + r.d : ""), px + 128, y); });
      H.panel(ctx, px, 182, 240, 108); ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; let y = 197; eqs.filter(Boolean).forEach((e, i) => { ctx.fillStyle = i === eqs.length - 1 ? "#7dffbd" : "#e8f0ff"; y = wrapT(ctx, e, px + 8, y, 224, 10.5) + 13; });
      const q = S.proj(V3(-3.0, 2.2, 0)); H.pill(ctx, q.x, q.y, c.mode === "cx" ? "beaker" : "reaction beaker", "#bcd0ea", 8.5, "center"); rf.forEach((r, i) => { const t = S.proj(V3(-1.0 + i * 0.85, 2.0, 0)); H.pill(ctx, t.x, t.y, r.f.length > 9 ? "" + (i + 1) : r.f, "#bcd0ea", 8, "center"); });
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "v" || c.mode === "cr") { const { L, R, lim } = ladder(c); return [["Element", L.name], ["Species now", L.st[s.mi].f + ", oxidation state +" + L.st[s.mi].ox + ", " + L.st[s.mi].nm + ", d" + L.st[s.mi].d], ["Reducing agent", R.n + ", " + R.eq], ["Lowest state reached", L.st[lim].f + " (+" + L.st[lim].ox + ")  because E°(couple) > " + R.E.toFixed(2) + " V only down to there"], ["Why coloured", "d–d transitions: the d orbitals split; light is absorbed and the complementary colour is seen"]]; }
      if (c.mode === "mn") { const md = MN[c.med]; return [["Medium", md.n], ["Product", md.prod + ": " + md.nm], ["Equation", md.eq], ["Volume", c.V.toFixed(1) + " cm³ (end-point 12.5 cm³ in acid)"], ["Use", "KMnO₄ is its own indicator in acid: no extra indicator needed"]]; }
      const X = CX[c.sys]; return [["System", X.n], ["Now", refs(c)[s.mi].f + ": " + refs(c)[s.mi].nm], ["Equation", X.eq], ["Ligand exchange", "water ligands are replaced; the colour changes because the d-orbital splitting changes"]];
    },
    steps(s, c) { return [["Pick a topic and a reducing agent or ligand", "done"], ["Reduce or add ligand and watch the colour change", s.prog > 0 || c.V > 0 || c.x > 0 ? "done" : "now"], ["Match the colour to the species in the rack", ""], ["Change the reducing agent or medium and compare", ""]]; },
  };
  function rgbhex(c) { return (Math.round(c[0]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[2]); }
})();
