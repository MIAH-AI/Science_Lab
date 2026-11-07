/* c3d-qualanalysis.js — chemistry 3D, new module: qualitative analysis bench (cation and anion tests, plus unknown samples) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const W = 0xf2f2ee, PB = 0x6ab8f0, DG = 0x5f7d4a, RB = 0x9a4a1e, CRM = 0xefe3a8, YEL = 0xf0dc3c;
  /* ---- the reactions (observations are the standard WAEC results) ---- */
  const pp = (c, amt, text, eq) => ({ ppt: { c, amt }, text, eq });
  const sol = (liq, text, eq) => ({ ppt: null, liq: liq || null, text, eq });
  const none = (text) => ({ text });
  const gas = (name, test, text, eq) => ({ gas: { name, test }, text, eq });
  const insol = (t) => ({ text: t || "precipitate does not dissolve in excess" });
  const RX = {
    Ca2: { naoh: [pp(W, 0.5, "white precipitate", "Ca²⁺(aq) + 2OH⁻(aq) → Ca(OH)₂(s)"), insol("precipitate insoluble in excess NaOH(aq)")], nh3: [none("no precipitate (at most a faint cloudiness)"), none("still no precipitate")] },
    Mg2: { naoh: [pp(W, 0.6, "white precipitate", "Mg²⁺(aq) + 2OH⁻(aq) → Mg(OH)₂(s)"), insol("precipitate insoluble in excess NaOH(aq)")], nh3: [pp(W, 0.5, "white precipitate", "Mg²⁺(aq) + 2NH₃(aq) + 2H₂O(l) → Mg(OH)₂(s) + 2NH₄⁺(aq)"), insol("precipitate insoluble in excess NH₃(aq)")] },
    Al3: { naoh: [pp(W, 0.7, "white gelatinous precipitate", "Al³⁺(aq) + 3OH⁻(aq) → Al(OH)₃(s)"), sol(null, "precipitate dissolves → colourless solution", "Al(OH)₃(s) + OH⁻(aq) → [Al(OH)₄]⁻(aq)")], nh3: [pp(W, 0.7, "white gelatinous precipitate", "Al³⁺(aq) + 3NH₃(aq) + 3H₂O(l) → Al(OH)₃(s) + 3NH₄⁺(aq)"), insol("precipitate insoluble in excess NH₃(aq)")] },
    Zn2: { naoh: [pp(W, 0.6, "white precipitate", "Zn²⁺(aq) + 2OH⁻(aq) → Zn(OH)₂(s)"), sol(null, "precipitate dissolves → colourless solution", "Zn(OH)₂(s) + 2OH⁻(aq) → [Zn(OH)₄]²⁻(aq)")], nh3: [pp(W, 0.6, "white precipitate", "Zn²⁺(aq) + 2NH₃(aq) + 2H₂O(l) → Zn(OH)₂(s) + 2NH₄⁺(aq)"), sol(null, "precipitate dissolves → colourless solution", "Zn(OH)₂(s) + 4NH₃(aq) → [Zn(NH₃)₄]²⁺(aq) + 2OH⁻(aq)")] },
    Pb2: { naoh: [pp(W, 0.6, "white precipitate", "Pb²⁺(aq) + 2OH⁻(aq) → Pb(OH)₂(s)"), sol(null, "precipitate dissolves → colourless solution", "Pb(OH)₂(s) + 2OH⁻(aq) → [Pb(OH)₄]²⁻(aq)")], nh3: [pp(W, 0.6, "white precipitate", "Pb²⁺(aq) + 2NH₃(aq) + 2H₂O(l) → Pb(OH)₂(s) + 2NH₄⁺(aq)"), insol("precipitate insoluble in excess NH₃(aq)")] },
    Cu2: { naoh: [pp(PB, 0.7, "pale blue precipitate", "Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s)"), insol("precipitate insoluble in excess NaOH(aq)")], nh3: [pp(PB, 0.7, "pale blue precipitate", "Cu²⁺(aq) + 2NH₃(aq) + 2H₂O(l) → Cu(OH)₂(s) + 2NH₄⁺(aq)"), sol([22, 60, 175], "precipitate dissolves → deep (inky) blue solution", "Cu(OH)₂(s) + 4NH₃(aq) → [Cu(NH₃)₄]²⁺(aq) + 2OH⁻(aq)")] },
    Fe2: { naoh: [pp(DG, 0.7, "dirty green precipitate (turns brown on standing in air)", "Fe²⁺(aq) + 2OH⁻(aq) → Fe(OH)₂(s)"), insol("precipitate insoluble in excess NaOH(aq)")], nh3: [pp(DG, 0.7, "dirty green precipitate (turns brown on standing in air)", "Fe²⁺(aq) + 2NH₃(aq) + 2H₂O(l) → Fe(OH)₂(s) + 2NH₄⁺(aq)"), insol("precipitate insoluble in excess NH₃(aq)")] },
    Fe3: { naoh: [pp(RB, 0.8, "reddish-brown precipitate", "Fe³⁺(aq) + 3OH⁻(aq) → Fe(OH)₃(s)"), insol("precipitate insoluble in excess NaOH(aq)")], nh3: [pp(RB, 0.8, "reddish-brown precipitate", "Fe³⁺(aq) + 3NH₃(aq) + 3H₂O(l) → Fe(OH)₃(s) + 3NH₄⁺(aq)"), insol("precipitate insoluble in excess NH₃(aq)")] },
    NH4: { naoh: [none("no precipitate — now WARM the tube (reagent: NaOH, warmed)")], heat: [gas("NH₃", "litmus", "pungent gas turns damp red litmus paper blue", "NH₄⁺(aq) + OH⁻(aq) → NH₃(g) + H₂O(l)")], alfoil: [gas("NH₃", "litmus", "ammonia is released (from NH₄⁺ itself) — turns damp red litmus blue", "NH₄⁺(aq) + OH⁻(aq) → NH₃(g) + H₂O(l)")] },
    CO3: { hcl: [gas("CO₂", "limewater", "effervescence; gas turns limewater milky", "CO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + CO₂(g)")], bacl: [none("no precipitate — the acid has already destroyed the carbonate")], agno: [none("no precipitate — acid has destroyed the carbonate")] },
    SO3: { hcl: [gas("SO₂", "dichromate", "pungent gas turns acidified K₂Cr₂O₇ paper orange → green", "SO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + SO₂(g)")], bacl: [none("no precipitate — SO₃²⁻ is destroyed by the acid (SO₂ escapes)")] },
    SO4: { bacl: [pp(W, 0.75, "white precipitate, insoluble in the acid", "Ba²⁺(aq) + SO₄²⁻(aq) → BaSO₄(s)")], agno: [none("no precipitate (Ag₂SO₄ is only slightly soluble)")] },
    Cl: { agno: [pp(W, 0.65, "white precipitate", "Ag⁺(aq) + Cl⁻(aq) → AgCl(s)"), sol(null, "precipitate dissolves in dilute NH₃(aq)", "AgCl(s) + 2NH₃(aq) → [Ag(NH₃)₂]⁺(aq) + Cl⁻(aq)")] },
    Br: { agno: [pp(CRM, 0.65, "cream precipitate", "Ag⁺(aq) + Br⁻(aq) → AgBr(s)"), { ppt: { c: CRM, amt: 0.4 }, text: "precipitate only slightly soluble in dilute NH₃(aq) (dissolves in concentrated)" }] },
    I: { agno: [pp(YEL, 0.65, "yellow precipitate", "Ag⁺(aq) + I⁻(aq) → AgI(s)"), insol("precipitate insoluble in NH₃(aq)")] },
    NO3: { alfoil: [gas("NH₃", "litmus", "pungent gas turns damp red litmus paper blue", "3NO₃⁻(aq) + 8Al(s) + 5OH⁻(aq) + 18H₂O(l) → 3NH₃(g) + 8[Al(OH)₄]⁻(aq)")] },
  };
  const NAME = { Ca2: "Ca²⁺", Mg2: "Mg²⁺", Al3: "Al³⁺", Zn2: "Zn²⁺", Pb2: "Pb²⁺", Cu2: "Cu²⁺", Fe2: "Fe²⁺", Fe3: "Fe³⁺", NH4: "NH₄⁺", Cl: "Cl⁻", SO4: "SO₄²⁻", CO3: "CO₃²⁻", NO3: "NO₃⁻", SO3: "SO₃²⁻", Br: "Br⁻", I: "I⁻" };
  const CATS = ["Ca2", "Mg2", "Al3", "Zn2", "Pb2", "Cu2", "Fe2", "Fe3", "NH4"], ANS = ["Cl", "SO4", "CO3", "NO3", "SO3", "Br", "I"];
  const BASE = { Cu2: [150, 205, 238], Fe2: [196, 226, 192], Fe3: [238, 208, 120] }, CLEAR = [226, 241, 250];
  const REAG = [
    { k: "naoh", label: "Sodium hydroxide, NaOH(aq)", short: "NaOH(aq)", b: 0, xl: "excess NaOH" },
    { k: "nh3", label: "Aqueous ammonia, NH₃(aq)", short: "NH₃(aq)", b: 1, xl: "excess NH₃" },
    { k: "heat", label: "NaOH(aq), warmed gently", short: "NaOH, warm", b: 0, xl: "—" },
    { k: "hcl", label: "Dilute hydrochloric acid, HCl", short: "dil. HCl", b: 2, xl: "—" },
    { k: "bacl", label: "BaCl₂(aq) (sample acidified with HCl first)", short: "BaCl₂ / HCl", b: 3, xl: "—" },
    { k: "agno", label: "AgNO₃(aq) (acidified with HNO₃), then NH₃(aq)", short: "AgNO₃ / HNO₃", b: 4, xl: "add NH₃(aq)" },
    { k: "alfoil", label: "NaOH(aq) + aluminium foil, warmed", short: "NaOH + Al, warm", b: 0, xl: "—" },
  ];
  const BOTT = [{ l: "NaOH", s: "1 mol/dm³" }, { l: "NH₃", s: "1 mol/dm³" }, { l: "HCl", s: "dilute" }, { l: "BaCl₂", s: "0.1 mol/dm³" }, { l: "AgNO₃", s: "0.1 mol/dm³" }];
  const R = (id, rg, st) => { const a = RX[id] && RX[id][rg]; if (!a) return { text: "no visible change" }; return a[Math.min(st, a.length - 1)] || { text: "no visible change" }; };
  const hasStage1 = (id, rg) => !!(RX[id] && RX[id][rg] && RX[id][rg].length > 1);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const TX = 0.2, TZ = 0.2, TY = 0.24, LX = 1.2, BZ = -0.6, BX0 = -4.0, BDX = 0.62;
  const rgbCss = (a) => "rgb(" + a.map((v) => Math.round(v)).join(",") + ")";

  C3.scenes.qualAnalysis = {
    env: "chemlab", envI: 1, fov: 36, free: true, cam: [[-0.4, 2.4, 7.6], [-0.4, 1.25, 0]],
    values: { smp: "Zn2", rg: "naoh", guess: "Cu2" },
    state: () => ({ prog: { id: null, rg: null, p0: 0, p1: 0, t0: 0, t1: 0, clock: 0 }, logs: {}, hid: { X: pick(CATS), Y: pick(ANS) }, msg: "", shown: null, dropT: 0 }),
    get controls() {
      const opt = [{ value: "_c", label: "— known cations —", disabled: true }].slice(1);
      return [
        { type: "select", key: "smp", label: "Sample in the test tube", options: CATS.map((k) => ({ value: k, label: NAME[k] + "  (known cation)" })).concat(ANS.map((k) => ({ value: k, label: NAME[k] + "  (known anion)" })), [{ value: "X", label: "Unknown X — a cation: identify it" }, { value: "Y", label: "Unknown Y — an anion: identify it" }]) },
        { type: "select", key: "rg", label: "Reagent", options: REAG.map((r) => ({ value: r.k, label: r.label })) },
        { type: "button", label: "Add a few drops of the reagent", action: (S, s, c) => add(s, c, 0) },
        { type: "button", label: "Add excess / do the next step", action: (S, s, c) => add(s, c, 1) },
        { type: "button", label: "Fresh sample in a clean tube", action: (S, s) => { s.prog.id = null; } , cls: "secondary" },
        { type: "select", key: "guess", label: "Your conclusion for the unknown", options: CATS.concat(ANS).map((k) => ({ value: k, label: NAME[k] })) },
        { type: "button", label: "Check my answer", action: (S, s, c) => check(s, c) },
        { type: "button", label: "New random unknowns", action: (S, s) => { s.hid = { X: pick(CATS), Y: pick(ANS) }; s.logs.X = {}; s.logs.Y = {}; s.msg = ""; s.prog.id = null; }, cls: "secondary" },
      ];
    },
    views: [{ label: "Tube", cam: [[-0.4, 2.4, 7.6], [-0.4, 1.25, 0]] }, { label: "Close up", cam: [[0.5, 2.2, 5.0], [0.5, 1.35, 0.2]] }, { label: "Reagents", cam: [[-2.7, 1.8, 5.2], [-2.7, 0.7, -0.6]] }],
    note: "Identify an ion from the pattern of observations: the colour of the hydroxide precipitate, whether it dissolves in excess NaOH(aq) or NH₃(aq) (amphoteric hydroxides dissolve in NaOH; Zn²⁺ and Cu²⁺ also dissolve in excess NH₃ by forming complex ions), and gas tests. Test a known sample first to learn the patterns, then try the unknowns. Always acidify before adding BaCl₂ or AgNO₃ so that carbonates and sulphites do not give a false precipitate.",
    onChange(S, s, c, key) { if (key === "smp" || key === "rg") { s.prog.id = null; } },
    reset(S, s, c) { Object.assign(c, { smp: "Zn2", rg: "naoh", guess: "Cu2" }); s.prog.id = null; s.logs = {}; s.msg = ""; },
    table(s, c) {
      const key = ident(s, c).key, L = s.logs[key] || {}, rows = REAG.filter((r) => L[r.k]);
      if (!rows.length) return '<table class="c3-table"><tr><th style="text-align:left">Observations — ' + title(s, c) + '</th></tr><tr><td style="text-align:left;color:#9fb2d2">No tests done yet. Choose a reagent and add it to the tube.</td></tr></table>';
      return '<table class="c3-table"><tr><th style="text-align:left">Reagent</th><th style="text-align:left">A few drops</th><th style="text-align:left">Excess / next step</th></tr>' + rows.map((r) => '<tr><td style="text-align:left">' + r.short + '</td><td style="text-align:left">' + (L[r.k][0] || "") + '</td><td style="text-align:left">' + (L[r.k][1] || "") + "</td></tr>").join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K;
      S.mk.rbox(2.5, 0.22, 0.9, 0.06, M.matte(0x7a5330, 0.55), 0.75, 0.11, TZ); S.mk.rbox(0.8, 0.08, 0.6, 0.03, M.matte(0x7a5330, 0.55), 2.6, 0.04, 0.9);
      s.tube = K.testTube(); s.tube.group.position.set(TX, TY, TZ); s.liq = s.tube.addLiquid({ color: CLEAR, opacity: 0.3 }); s.liq.setColor(CLEAR, 0.3); s.liq.setVolume(6);
      s.ppt = K.precipitate(s.tube, s.liq, { n: 1600, size: 0.12, color: 0xffffff });
      s.bub = K.bubbles(s.tube, s.liq, { n: 90, x: 0, z: 0, baseY: 0.5, spread: 0.35 });
      s.tube2 = K.testTube(); s.tube2.group.position.set(LX, TY, TZ); s.lw = s.tube2.addLiquid({ color: CLEAR, opacity: 0.18 }); s.lw.setColor(CLEAR, 0.16); s.lw.setVolume(5);
      /* stopper + delivery tube to limewater (only used for gas that is tested with limewater) */
      s.del = new T.Group(); const rub = M.rubber(), gl = M.matte(0xcfe8f5, 0.1); const top = TY + 15 * CM;
      const sg = new T.Mesh(new T.CylinderGeometry(0.1, 0.082, 0.2, 20), rub); sg.position.set(TX, top + 0.0, TZ); s.del.add(sg);
      const seg = [[V3(TX, top + 0.1, TZ), V3(TX, top + 0.55, TZ)], [V3(TX, top + 0.55, TZ), V3(LX, top + 0.55, TZ)], [V3(LX, top + 0.55, TZ), V3(LX, TY + 6.5 * CM, TZ)]];
      seg.forEach(([a, b]) => { const m = S.mk.rod(a, b, 0.028, gl); S.scene.remove(m); s.del.add(m); }); S.scene.add(s.del); s.del.visible = false;
      /* litmus / dichromate paper held above the mouth of the tube */
      s.strip = S.mk.box ? S.mk.box(0.34, 0.015, 0.12, new T.MeshStandardMaterial({ color: 0xcc3b3b, roughness: 0.9 }), TX + 0.03, top + 0.35, TZ) : null;
      if (!s.strip) { s.strip = new T.Mesh(new T.BoxGeometry(0.5, 0.02, 0.18), new T.MeshStandardMaterial({ color: 0xcc3b3b, roughness: 0.9 })); s.strip.position.set(TX + 0.03, top + 0.35, TZ); S.scene.add(s.strip); }
      s.strip.visible = false; s.forceps = S.mk.rod(V3(TX + 0.2, top + 0.35, TZ), V3(TX + 1.0, top + 0.8, TZ), 0.018, M.steel()); s.forceps.visible = false;
      /* dropper pipette over the tube */
      s.dropper = new T.Group(); const pg = new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 0.9, 14), M.matte(0xd8eaf5, 0.08)); pg.position.y = 0.45; const pb = new T.Mesh(new T.SphereGeometry(0.13, 20, 14), M.rubber()); pb.position.y = 1.05; pb.scale.y = 1.4; s.dropper.add(pg, pb); s.dropper.position.set(TX, top + 0.55, TZ + 0.0); S.scene.add(s.dropper); s.dropper.visible = false;
      s.drops = K.drops({ color: 0xd6ecf7 });
      /* reagent bottles in a back row */
      s.bot = BOTT.map((b, i) => { const g = K.bottle({ h: 9, r: 1.7, label: b.l, sub: b.s, color: i === 0 || i === 1 ? 0x2a6aa8 : 0x8a4a14 }); g.position.set(BX0 + i * BDX, 0.0, BZ); return g; });
      S.mk.box ? 0 : 0; const foil = new T.Mesh(new T.BoxGeometry(0.5, 0.01, 0.34), M.chrome ? M.chrome() : M.steel()); foil.position.set(-2.0, 0.01, 0.8); foil.rotation.y = 0.3; S.scene.add(foil);
      s.bun = K.bunsen({ x: 2.6, z: 0.9, flameH: 7 }); s.bun.setAir(1); s.bun.setGas(0);
      s.dropAcc = 0; s.k = 0;
    },
    update(S, s, c, dt) {
      const id = ident(s, c).id, rg = c.rg, P = s.prog, rd = REAG.find((r) => r.k === rg);
      sync(s, c);
      const r0 = R(id, rg, 0), r1 = R(id, rg, 1), st1 = hasStage1(id, rg), base = BASE[id] || CLEAR;
      if (dt > 0) { if (P.t0 > P.p0) P.p0 = Math.min(P.t0, P.p0 + dt * 0.5); if (P.p0 >= 1 && P.t1 > P.p1) P.p1 = Math.min(P.t1, P.p1 + dt * 0.4); if (P.p0 > 0) P.clock += dt; }
      const key = ident(s, c).key; s.logs[key] = s.logs[key] || {}; const lg = s.logs[key], L = lg[rg] || [], put = () => { lg[rg] = L; };
      if (P.p0 >= 1 && !P.did0) { P.did0 = true; L[0] = r0.text; put(); s.shown = { stage: 0, r: r0, rg }; } if (P.p1 >= 1 && !P.did1) { P.did1 = true; L[1] = st1 ? r1.text : "no further change"; put(); s.shown = { stage: 1, r: st1 ? r1 : { text: "no further change" }, rg }; }
      /* precipitate + liquid appearance */
      const a0 = r0.ppt ? r0.ppt.amt : 0, hasP1 = "ppt" in r1, a1 = st1 && hasP1 ? (r1.ppt ? r1.ppt.amt : 0) : a0, pc = (st1 && hasP1 && r1.ppt ? r1.ppt : r0.ppt || {}).c || 0xffffff;
      s.ppt.setColor(pc); s.ppt.amount = P.p1 > 0 ? lerp(a0, a1, P.p1) : a0 * P.p0; s.ppt.update(dt);
      const liq0 = r0.liq || base, liq1 = st1 && "liq" in r1 ? r1.liq || CLEAR : liq0;
      const col = P.p1 > 0 ? liq0.map((v, i) => lerp(v, liq1[i], P.p1)) : base.map((v, i) => lerp(v, liq0[i], P.p0));
      s.liq.setColor(col, 0.34); s.liq.setVolume(6 + 0.8 * P.p0 + (rg === "naoh" || rg === "nh3" || rg === "agno" ? 3.2 : 1.2) * P.p1); s.liq.update(S.t);
      /* gas */
      const g = r0.gas; const gc = g && P.p0 > 0 ? clamp(P.clock / 2.6, 0, 1) : 0, warm = (rg === "heat" || rg === "alfoil") && P.p0 > 0;
      s.bub.rate = g && P.p0 > 0.05 ? 75 * clamp(1.4 - P.clock / 14, 0.15, 1) : warm ? 3 : 0; s.bub.update(dt, S.t);
      s.bun.setGas(warm ? 0.8 : 0); s.bun.flame.update(S.t);
      const test = g ? g.test : null; s.del.visible = test === "limewater"; s.strip.visible = s.forceps.visible = test === "litmus" || test === "dichromate";
      if (test === "litmus") s.strip.material.color.setRGB(lerp(0.8, 0.28, gc), lerp(0.23, 0.38, gc), lerp(0.23, 0.85, gc)); if (test === "dichromate") s.strip.material.color.setRGB(lerp(0.92, 0.27, gc), lerp(0.52, 0.55, gc), lerp(0.1, 0.27, gc));
      const mk = test === "limewater" ? clamp((P.clock - 0.8) / 3, 0, 1) : 0; s.lw.setColor([lerp(226, 245, mk), lerp(241, 245, mk), lerp(250, 240, mk)], lerp(0.16, 0.72, mk)); s.lw.update(S.t);
      /* dropper and drops */
      const adding = (P.t0 > P.p0 && P.p0 < 1) || (P.t1 > P.p1 && P.p0 >= 1); s.dropper.visible = adding || s.dropper.visible && (S.t - (s.lastAdd || 0) < 0.6);
      if (adding) s.lastAdd = S.t; s.dropper.visible = S.t - (s.lastAdd || -9) < 0.7;
      const topY = TY + 15 * CM + 0.45;
      if (dt > 0 && adding) { s.dropAcc += dt * (P.p0 < 1 ? 3.5 : 7); while (s.dropAcc >= 1) { s.dropAcc -= 1; s.drops.emit(TX + 0.0, topY, TZ, TY + s.liq.level * CM, 0.032); } }
      s.drops.update(dt);
      const sel = REAG.find((r) => r.k === rg).b; s.sel = sel;
    },
    overlay(ctx, s, c, w, h, S) {
      const idd = ident(s, c), rg = REAG.find((r) => r.k === c.rg), P = s.prog;
      H.pill(ctx, 10, 22, title(s, c), "#ffe9b8", 11); H.pill(ctx, 10, 44, "reagent: " + rg.short, "#9fe3ff", 10);
      const q = S.proj(V3(BX0 + rg.b * BDX, 1.75, BZ)); H.pill(ctx, q.x, q.y, "▼ in use", "#ffd27a", 9.5, "center");
      const qq = S.proj(V3(TX, TY + 15 * CM + 0.15, TZ)); const where = idd.known ? null : null;
      /* observation panel along the bottom */
      const px = 10, py = 314, pw = 620, ph = 76; H.panel(ctx, px, py, pw, ph); ctx.save(); ctx.textAlign = "left"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff";
      const sh = s.shown && s.shown.rg === c.rg ? s.shown : null; ctx.fillText("Observation", px + 10, py + 15);
      ctx.font = "10.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; const txt = sh ? (sh.stage ? "With excess / next step: " : "A few drops: ") + sh.r.text : P.p0 > 0 && P.p0 < 1 ? "adding reagent…" : "Choose a reagent, then press “Add a few drops”.";
      let y = wrapText(ctx, txt, px + 10, py + 32, pw - 20, 14);
      if (sh && sh.r.eq && idd.known) { ctx.fillStyle = "#ffd27a"; ctx.font = "10px 'IBM Plex Mono',monospace"; y = wrapText(ctx, sh.r.eq, px + 10, y + 2, pw - 20, 13); }
      else if (sh && !idd.known) { ctx.fillStyle = "#9fb2d2"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillText("(the equation is hidden for unknowns — use the observations to decide)", px + 10, y + 4); }
      if (s.msg && !idd.known) { ctx.font = "600 10.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = s.msg.startsWith("✔") ? "#7dffbd" : "#ff9a9a"; wrapText(ctx, s.msg, px + 10, py + ph - 8, pw - 20, 13); }
      ctx.restore();
    },
    readouts(s, c) {
      const idd = ident(s, c), rg = REAG.find((r) => r.k === c.rg), sh = s.shown && s.shown.rg === c.rg ? s.shown : null;
      return [["Sample", idd.known ? NAME[idd.id] + " in solution" : "Unknown " + c.smp + " (" + (c.smp === "X" ? "a cation" : "an anion") + ")"], ["Reagent", rg.label], ["Latest observation", sh ? sh.r.text : "—"], ["Ionic equation", sh && sh.r.eq && idd.known ? sh.r.eq : idd.known ? "—" : "hidden for unknowns"], ["Tests recorded", Object.keys(s.logs[idd.key] || {}).length + " reagent(s)"]];
    },
    steps(s, c) { const L = s.logs[ident(s, c).key] || {}, n = Object.keys(L).length; return [["Pick a sample and a reagent", "done"], ["Add a few drops — note the colour of the precipitate or gas", n ? "done" : "now"], ["Add excess — does the precipitate dissolve?", n ? "now" : ""], ["Compare with the table; identify the ion; check your answer", s.msg ? "done" : ""]]; },
  };
  function ident(s, c) { const smp = c.smp, known = smp !== "X" && smp !== "Y", id = known ? smp : s.hid[smp]; return { id, known, key: known ? smp : smp + ":" + id }; }
  function title(s, c) { const i = ident(s, c); return i.known ? "Sample: " + NAME[i.id] + " (aq)" : "Unknown " + c.smp + ": " + (c.smp === "X" ? "which cation?" : "which anion?"); }
  function sync(s, c) { const P = s.prog, id = ident(s, c).id; if (P.id !== id + "|" + c.rg) { Object.assign(P, { id: id + "|" + c.rg, rg: c.rg, p0: 0, p1: 0, t0: 0, t1: 0, clock: 0, did0: false, did1: false, sid: id }); s.ppt && s.ppt.reset(); } }
  function add(s, c, stage) { sync(s, c); const P = s.prog; if (stage === 0) { P.t0 = 1; } else { P.t0 = 1; P.t1 = hasStage1(ident(s, c).id, c.rg) ? 1 : 0; if (!hasStage1(ident(s, c).id, c.rg)) { P.p1 = 0; s.shown = { stage: 1, r: { text: "no further step for this reagent" }, rg: c.rg }; } } }
  function check(s, c) { const i = ident(s, c); if (i.known) { s.msg = "Pick Unknown X or Y first, test it, then check your answer."; return; } s.msg = c.guess === i.id ? "✔ Correct — the unknown is " + NAME[i.id] + "." : "✘ Not " + NAME[c.guess] + ". Re-read your observations; the tests you have not done may separate the candidates."; }
  function wrapText(ctx, text, x, y, maxW, lh) { const words = String(text).split(" "); let line = ""; for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = wd; } else line = t; } if (line) { ctx.fillText(line, x, y); y += lh; } return y; }
})();
