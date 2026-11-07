/* c3d-redoxtit.js — chemistry 3D, new module: redox titration (potassium manganate(VII), self-indicating) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const CMN = 0.02; /* mol/dm³ KMnO4 in the burette */
  const CASES = [
    { label: "Fe²⁺ (iron(II) sulfate, acidified) ← KMnO₄", a: "Fe²⁺", name: "iron(II) sulfate", rmn: 1, ran: 5, c0: 0.1, base: [215, 238, 205], op0: 0.2, after: [236, 214, 150], eq: "MnO₄⁻ + 8H⁺ + 5Fe²⁺ → Mn²⁺ + 4H₂O + 5Fe³⁺", half: "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O      Fe²⁺ → Fe³⁺ + e⁻", ox: "MnO₄⁻ is reduced (Mn +7 → +2); Fe²⁺ is oxidised (Fe +2 → +3)", warm: false, ratio: "1 : 5" },
    { label: "Ethanedioate C₂O₄²⁻ (warm, acidified) ← KMnO₄", a: "C₂O₄²⁻", name: "ethanedioic acid", rmn: 2, ran: 5, c0: 0.05, base: [225, 238, 245], op0: 0.15, after: [225, 238, 245], eq: "2MnO₄⁻ + 5C₂O₄²⁻ + 16H⁺ → 2Mn²⁺ + 10CO₂ + 8H₂O", half: "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O      C₂O₄²⁻ → 2CO₂ + 2e⁻", ox: "MnO₄⁻ is reduced (Mn +7 → +2); C in C₂O₄²⁻ is oxidised (+3 → +4). Warm to about 60 °C: the reaction is slow when cold", warm: true, ratio: "2 : 5" },
    { label: "Hydrogen peroxide H₂O₂ (acidified) ← KMnO₄", a: "H₂O₂", name: "hydrogen peroxide", rmn: 2, ran: 5, c0: 0.05, base: [225, 238, 245], op0: 0.15, after: [225, 238, 245], eq: "2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O", half: "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O      H₂O₂ → O₂ + 2H⁺ + 2e⁻", ox: "MnO₄⁻ is reduced; H₂O₂ is oxidised (O −1 → 0) and bubbles of O₂ appear", warm: false, ratio: "2 : 5" },
  ];
  const PURPLE = [190, 30, 140], DEEP = [120, 0, 105];
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const Veq = (cs, ca, Va) => (ca * Va * cs.rmn / cs.ran) / CMN;
  const excessC = (cs, c, V) => { const Ve = Veq(cs, c.ca, c.Va); return V <= Ve ? 0 : (CMN * (V - Ve) / 1000) / ((c.Va + V) / 1000); };
  const pinkOf = (cc) => 1 - Math.exp(-2400 * cc * 3); /* Beer–Lambert, ε ≈ 2400 dm³ mol⁻¹ cm⁻¹, l ≈ 3 cm */
  const cfg = (c) => CASES[c.cs | 0];
  function newRun(s, c) { s.V = 0; s.R = 0; s.hang = 0; s.msg = ""; s.plumeT = 0; s.plumes && s.plumes.forEach((p) => { p.sp.parent && p.sp.parent.remove(p.sp); p.sp.material.dispose(); }); s.plumes = []; s.hist = [[0, 0]]; s.lastHist = 0; if (s.bur) { s.bur.setReading(0); s.drops.setStream(0, 0, 0, 0, false); s.drops.setHang(0, 0, 0, 0); } }
  function addVol(S, s, c, dv) { s.R = Math.min(50, s.R + dv); s.V = s.R; }
  function plume(S, s, c) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: s.softTex, color: 0xc0207a, transparent: true, depthWrite: false, opacity: 0.85 })); sp.scale.setScalar(0.4); sp.position.set(0, s.flask.group.position.y + s.flL.level * CM - 0.05, 0); S.scene.add(sp); s.plumes.push({ sp, age: 0 });
  }
  function release(S, s, c) {
    addVol(S, s, c, 0.05); const surf = s.flask.group.position.y + s.flL.level * CM;
    s.drops.emit(0, s.tipY - 0.03, 0, surf, 0.036, () => plume(S, s, c));
  }

  C3.scenes.redoxTitration = {
    env: "chemlab", envOpts: { w: 30, d: 11, wallH: 30, shadowArea: 12 }, envI: 0.75, fov: 38, free: false,
    cam: [[4.6, 4.6, 12.8], [1.4, 3.7, 0]],
    values: { cs: 0, ca: 0.1, Va: 25, tap: 0, swirl: 1, warm: 0 },
    state: () => ({ records: [], V: 0, R: 0 }),
    get controls() {
      return [
        { type: "select", key: "cs", label: "Titration", options: CASES.map((x, i) => ({ value: i, label: x.label })) },
        { type: "range", key: "ca", label: "Concentration in the flask (mol/dm³)", min: 0.04, max: 0.1, step: 0.005 },
        { type: "select", key: "Va", label: "Volume pipetted into the flask (cm³)", options: [10, 20, 25].map((v) => ({ value: v, label: v + " cm³" })) },
        { type: "range", key: "tap", label: "Burette tap (0 shut → 1 open)", min: 0, max: 1, step: 0.01 },
        { type: "button", label: "+ 1 drop (≈ 0.05 cm³)", action: (S, s, c) => { release(S, s, c); } },
        { type: "button", label: "+ 1 cm³", action: (S, s, c) => { for (let i = 0; i < 20; i++) release(S, s, c); } },
        { type: "button", label: "Close tap", cls: "secondary", action: (S, s, c, ref) => { c.tap = 0; ref(); } },
        { type: "toggle", key: "warm", label: "Warm the flask to about 60 °C" },
        { type: "toggle", key: "swirl", label: "Swirl the flask" },
        { type: "button", label: "Record the end point", action: (S, s, c) => { const Ve = Veq(cfg(c), c.ca, c.Va); if (s.V < 0.5) { s.msg = "Add titrant first"; return; } s.records.push({ t: s.V, ok: excessC(cfg(c), c, s.V) > 0 && s.V - Ve < 0.35 }); s.msg = ""; } },
        { type: "button", label: "Refill burette and new flask", cls: "secondary", action: (S, s, c, ref) => { c.tap = 0; newRun(s, c); ref(); } },
      ];
    },
    views: [{ label: "Burette + flask", cam: [[4.6, 4.6, 12.8], [1.4, 3.7, 0]] }, { label: "Flask", cam: [[3.4, 3.0, 6.2], [1.1, 1.7, 0]] }, { label: "Read burette", cam: (S, s) => { const y = s.bur.levelWorldY(); return [[0.25, y + 0.05, 2.1], [0, y, 0]]; } }],
    note: "Potassium manganate(VII) is its own indicator: MnO₄⁻ is intensely purple but Mn²⁺ is almost colourless, so each drop decolourises while the analyte is still in excess. The end point is the first permanent pale pink. Acidify with dilute sulfuric acid (never hydrochloric acid: Cl⁻ is oxidised too). Read the burette at the top of the meniscus because the solution is dark. Mole ratio from the balanced equation: n(MnO₄⁻) : n(Fe²⁺) = 1 : 5. The pink colour is modelled with the Beer–Lambert law, ε ≈ 2400 dm³ mol⁻¹ cm⁻¹; the slow start of the warm ethanedioate reaction is shown qualitatively.",
    onChange(S, s, c, key) { if (key === "cs") { c.ca = CASES[c.cs | 0].c0; } if (key === "cs" || key === "ca" || key === "Va") { s.records = []; c.tap = 0; newRun(s, c); } },
    reset(S, s, c) { Object.assign(c, { cs: 0, ca: 0.1, Va: 25, tap: 0, swirl: 1, warm: 0 }); s.records = []; newRun(s, c); },
    table(s, c) {
      const cs = cfg(c), Ve = Veq(cs, c.ca, c.Va), r = s.records;
      let h = '<table class="c3-table"><tr><th></th><th>titre / cm³</th><th>note</th></tr>' + (r.length ? r.map((x, i) => "<tr><td>" + (i + 1) + "</td><td>" + x.t.toFixed(2) + "</td><td>" + (x.ok ? "at the end point" : "overshot or too early") + "</td></tr>").join("") : '<tr><td colspan="3" style="text-align:left">No titres yet: use “Record the end point” when the pink first persists.</td></tr>') + "</table>";
      const g = r.filter((x) => x.ok); if (g.length) { const t = g[g.length - 1].t, nmn = CMN * t / 1000, nan = nmn * cs.ran / cs.rmn, cc = nan / (c.Va / 1000); h += '<div style="font:12px/1.5 IBM Plex Mono;color:#7dffbd">n(MnO₄⁻) = 0.020 × ' + t.toFixed(2) + " ÷ 1000 = " + nmn.toExponential(3) + " mol → n(" + cs.a + ") = " + nmn.toExponential(3) + " × " + cs.ran + "/" + cs.rmn + " = " + nan.toExponential(3) + " mol → c = " + cc.toFixed(4) + " mol/dm³ (set value " + c.ca.toFixed(3) + ")</div>"; }
      return h;
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.softTex = U.softDot(64, "rgba(255,255,255,1)");
      K.tile(18); K.contact(0, 0.8 * CM, 0, 5.4, 0.5);
      const flask = K.flask(); flask.group.position.set(0, 0.8 * CM, 0); s.flask = flask; s.flL = flask.addLiquid({ color: 0xd7eecd, opacity: 0.2 });
      const stand = K.retort({ x: -1.8, z: -0.9, h: 88 }); K.contact(-1.8, 0, 0, 8, 0.55);
      const bur = K.burette({ color: 0x96147a, opacity: 0.4 }); bur.position.set(0, 17.5 * CM, 0); s.bur = bur; s.tipY = bur.position.y;
      K.clampArm(stand, 46, 0, 0, 0.66); K.clampArm(stand, 64, 0, 0, 0.66);
      s.drops = K.drops({ color: 0xa01c78 }); s.drops.setColor([170, 25, 120]);
      [[-4.7, -3.7, "KMnO₄"], [-3.3, -3.7, "H₂SO₄"], [8, -3.7, "FeSO₄"], [9.6, -3.7, "H₂C₂O₄"]].forEach(([x, z, l]) => { const b = K.bottle({ label: l, sub: l === "KMnO₄" ? "0.020 mol/dm³" : "" }); b.position.set(x, 0, z); });
      s.bur.setLiquid([150, 20, 115], 0.55); s.plumes = []; s.swirlPh = 0; s.records = []; newRun(s, c);
    },
    update(S, s, c, dt) {
      const cs = cfg(c), fl = s.flL, sw = c.swirl; s.bur.tapAngle(clamp(c.tap, 0, 1));
      const tap = clamp(c.tap, 0, 1), rate = tap < 0.02 ? 0 : 3.3 * Math.pow(tap, 1.5), empty = s.R >= 49.999; if (empty) s.msg = "Burette empty: refill";
      const surfY = s.flask.group.position.y + fl.level * CM; let stream = false;
      if (rate > 0 && !empty && dt > 0) { if (rate > 0.7) { addVol(S, s, c, Math.min(rate * dt, 50 - s.R)); stream = true; s.hang = 0; s.plumeT += dt; if (s.plumeT > 0.14) { s.plumeT = 0; plume(S, s, c); } } else { s.hang += rate * dt; if (s.hang >= 0.05) { s.hang -= 0.05; release(S, s, c); } } }
      s.drops.setStream(0, s.tipY, 0, surfY, stream); s.drops.setHang(0, s.tipY, 0, stream ? 0 : clamp(s.hang / 0.05, 0, 1), 0.036); s.drops.update(dt);
      /* flask colour: analyte colour + (excess MnO4- pink via Beer–Lambert) */
      const Ve = Veq(cs, c.ca, c.Va), prog = clamp(s.V / Ve, 0, 1), exc = excessC(cs, c, s.V), pk = pinkOf(exc);
      const base = mixc(cs.base, cs.after, prog), w = pk / (pk + cs.op0 * 0.8 + 1e-6), tone = mixc(PURPLE, DEEP, clamp(exc / 0.002, 0, 1));
      const col = mixc(base, tone, s.V > Ve ? w : 0), op = Math.max(cs.op0 + 0.1 * prog, s.V > Ve ? 0.12 + 0.75 * pk : 0);
      s.flaskCol = col; s.pk = pk; s.exc = exc; fl.setColor(col, op); fl.setVolume(c.Va + s.V); s.bur.setReading(s.R); fl.agit = sw ? 0.9 : 0;
      s.flask.group.position.x = sw ? Math.cos(s.swirlPh) * 0.045 : 0; s.flask.group.position.z = sw ? Math.sin(s.swirlPh) * 0.045 : 0; if (sw && dt > 0) s.swirlPh += dt * 2.6 * Math.PI * 2;
      /* decolourising plumes: fade fast while analyte remains, persist once it has run out; cold ethanedioate is slow */
      const slow = cs.warm && !c.warm, past = s.V > Ve + 0.01; const life = past ? 6 : (sw ? 0.5 : 2.8) * (slow ? 6 : 1);
      for (let i = s.plumes.length - 1; i >= 0; i--) { const p = s.plumes[i]; p.age += dt; const k = p.age / life; if (k >= 1) { S.scene.remove(p.sp); p.sp.material.dispose(); s.plumes.splice(i, 1); continue; } p.sp.material.opacity = 0.85 * (1 - k) * (1 - k); p.sp.scale.setScalar(0.35 + k * 0.45); p.sp.position.y -= dt * 0.1; }
      if (s.V - s.lastHist >= 0.2) { s.hist.push([s.V, exc * 1e4]); s.lastHist = s.V; }
      if (cs.warm && !c.warm && s.V > 0.5 && s.V < Ve) s.msg = "cold: the reaction is slow; warm the flask to about 60 °C"; else if (s.msg.startsWith("cold")) s.msg = "";
      [fl, s.bur.ves.liq].forEach((l) => l.update(S.t));
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const cs = cfg(c), px = w - 250, Ve = Veq(cs, c.ca, c.Va);
      H.pill(ctx, 10, 22, cs.eq, "#ffe9b8", 10.5); H.pill(ctx, 10, 44, "mole ratio MnO₄⁻ : " + cs.a + " = " + cs.ratio + "     n = c × V", "#bcd0ea", 10);
      const q = S.proj(V3(0.3, s.tipY + 1.1, 0)); H.pill(ctx, q.x - 14, clamp(q.y + 4, 20, 380), "burette: 0.020 mol/dm³ KMnO₄ (purple)", "#e7a8d4", 10, "right");
      H.pill(ctx, 10, 386, "flask: " + c.Va + " cm³ " + cs.name + " (" + c.ca.toFixed(3) + " M) + dilute H₂SO₄", "#cfe8ff", 10);
      const xm = Math.max(10, Math.ceil((Ve * 1.5) / 5) * 5), exm = Math.max(1, excessC(cs, c, xm) * 1e4 * 1.1);
      H.graph(ctx, px, 58, 240, 130, { series: [{ pts: s.hist, color: "#ff8fd0", width: 2 }], xmin: 0, xmax: xm, ymin: 0, ymax: exm, ticksX: 5, ticksY: 3, xl: "V(KMnO₄) / cm³", yl: "excess MnO₄⁻ / 10⁻⁴ M", dot: [Math.min(s.V, xm), s.exc * 1e4, "#ffd27a"] });
      H.panel(ctx, px, 194, 240, 100); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Half-equations", px + 8, 209); ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; let y2 = 222; cs.half.split("      ").forEach((ln, i) => { y2 = wrapT(ctx, ln, px + 8, y2, 224, 10.5) + 11; }); y2 -= 11; ctx.fillStyle = "#9fb2d2"; wrapT(ctx, cs.ox, px + 8, y2 + 14, 224, 10.5);
      const st = s.V < 0.05 ? "" : s.V < Ve - 0.05 ? "each drop decolourises: analyte still in excess" : Math.abs(s.V - Ve) <= 0.15 ? "END POINT: first permanent pale pink" : s.V > Ve ? "overshot: flask is pink-purple" : "";
      if (st) H.pill(ctx, 10, 66, st, st.startsWith("END") ? "#8dffb8" : s.V > Ve ? "#ff9aa8" : "#9fe3ff", 10);
      if (s.msg) H.pill(ctx, 10, 88, s.msg, "#ff9d8a", 10); ctx.restore();
    },
    readouts(s, c) {
      const cs = cfg(c), nmn = CMN * s.V / 1000, Ve = Veq(cs, c.ca, c.Va);
      return [["Burette reading", s.R.toFixed(2) + " cm³"], ["Volume of KMnO₄ added", s.V.toFixed(2) + " cm³"], ["n(MnO₄⁻) added", (nmn * 1000).toFixed(3) + " mmol"], ["n(" + cs.a + ") reacted", (nmn * cs.ran / cs.rmn * 1000).toFixed(3) + " mmol"], ["Flask colour", s.V < Ve - 0.05 ? "colourless/pale (purple decolourised)" : s.V <= Ve + 0.3 ? "faint permanent pink" : "pink to purple (excess)"], ["Mole ratio", cs.ratio], ["Theoretical end point", Ve.toFixed(2) + " cm³"]];
    },
    steps(s, c) {
      const cs = cfg(c), Ve = Veq(cs, c.ca, c.Va), r = s.records, st = (d, n) => (d ? "done" : n ? "now" : "");
      return [["Pipette " + c.Va + " cm³ " + cs.name + " into the flask and add dilute sulfuric acid", "done"], [cs.warm ? "Warm the flask to about 60 °C" : "Fill the burette with 0.020 mol/dm³ KMnO₄ and read the top of the meniscus", st(cs.warm ? c.warm : true, cs.warm)], ["Run KMnO₄ in, swirling; each drop decolourises while analyte remains", st(s.V > 1, true)], ["Add dropwise near the end: stop at the first permanent pale pink", st(r.length > 0, s.V > Ve - 3)], ["Record the titre and calculate: n(MnO₄⁻) → n(" + cs.a + ") → concentration", st(r.some((x) => x.ok), r.length > 0)]];
    },
  };
})();
