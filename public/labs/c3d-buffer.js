/* c3d-buffer.js — chemistry 3D, new module: pH titration curves (strong/weak acid and base) with indicators, and buffer solutions */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const KW = 1e-14, KA = 1.8e-5, KNH4 = 5.6e-10, PKA = -Math.log10(KA);
  const CASE = {
    sasb: { name: "Strong acid + strong base", an: "25.0 cm³ of 0.100 mol/dm³ HCl", ti: "0.100 mol/dm³ NaOH", eq: "HCl + NaOH → NaCl + H₂O", eqpH: 7.0, dir: 1 },
    wasb: { name: "Weak acid + strong base", an: "25.0 cm³ of 0.100 mol/dm³ CH₃COOH", ti: "0.100 mol/dm³ NaOH", eq: "CH₃COOH + NaOH → CH₃COONa + H₂O", eqpH: null, dir: 1 },
    sawb: { name: "Weak base + strong acid", an: "25.0 cm³ of 0.100 mol/dm³ NH₃", ti: "0.100 mol/dm³ HCl", eq: "NH₃ + HCl → NH₄Cl", eqpH: null, dir: -1 },
  };
  const IND = {
    mo: { n: "Methyl orange", lo: 3.1, hi: 4.4, a: [236, 70, 60], b: [244, 210, 70], ca: "red", cb: "yellow" },
    pp: { n: "Phenolphthalein", lo: 8.3, hi: 10.0, a: [226, 238, 246], b: [236, 60, 150], ca: "colourless", cb: "pink" },
    bb: { n: "Bromothymol blue", lo: 6.0, hi: 7.6, a: [244, 214, 70], b: [60, 110, 220], ca: "yellow", cb: "blue" },
    lt: { n: "Litmus", lo: 5.0, hi: 8.0, a: [230, 70, 70], b: [70, 100, 220], ca: "red", cb: "blue" },
  };
  const solve = (f) => { let lo = 0, hi = 14.5; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (f(10 ** -mid) > 0) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  function pHcurve(cs, V) {
    const nA = 2.5, nT = 0.1 * V, Vt = 25 + V;
    if (cs === "sasb") { const net = nA - nT; if (Math.abs(net) < 1e-9) return 7; return net > 0 ? -Math.log10(net / Vt + 1e-14) : 14 + Math.log10(-net / Vt); }
    if (cs === "wasb") { const cNa = nT / Vt, cA = nA / Vt; return solve((h) => cNa + h - KW / h - cA * KA / (KA + h)); }
    const cB = nA / Vt, cCl = nT / Vt; return solve((h) => h + cB * h / (h + KNH4) - cCl - KW / h);   // h big -> positive -> raises lo (lower pH)
  }
  const colour = (ind, pH) => { const I = IND[ind]; return mixc(I.a, I.b, clamp((pH - I.lo) / (I.hi - I.lo), 0, 1)); };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  /* buffer: 50 cm³ of acetic acid / acetate with concentration c (total) and A-/HA ratio r; added strong acid/base in mmol */
  function bufpH(c, r, nAdd) {
    const tot = c * 50, nA = tot * r / (1 + r), nHA = tot / (1 + r), Vt = 50 + Math.abs(nAdd) / 0.1 * 0;   // nAdd mmol: + acid, - base (volume change ignored: small)
    const a = nA - nAdd, b = nHA + nAdd; if (a <= 0.001) return -Math.log10(Math.max(1e-12, (nAdd - nA) / 50 + 1e-12)) * 1; if (b <= 0.001) return 14 + Math.log10(Math.max(1e-12, (-nAdd - nHA) / 50 + 1e-12)); return PKA + Math.log10(a / b);
  }
  const wpH = (nAdd) => { const net = nAdd / 50; if (Math.abs(net) < 1e-9) return 7; return net > 0 ? -Math.log10(net) : 14 + Math.log10(-net); };

  C3.scenes.bufferCurves = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[3.2, 3.0, 10.4], [3.5, 2.8, 0]],
    values: { mode: "curve", cs: "wasb", ind: "pp", V: 0, c: 0.5, r: 1, nAdd: 0 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Topic", options: [{ value: "curve", label: "Titration curves" }, { value: "buffer", label: "Buffer solutions" }] },
        { type: "select", key: "cs", label: "Titration", options: Object.keys(CASE).map((k) => ({ value: k, label: CASE[k].name })) },
        { type: "select", key: "ind", label: "Indicator", options: Object.keys(IND).map((k) => ({ value: k, label: IND[k].n + " (" + IND[k].lo + " – " + IND[k].hi + ")" })) },
        { type: "range", key: "V", label: "Volume of titrant added (cm³)", min: 0, max: 50, step: 0.2, unit: " cm³" },
        { type: "range", key: "c", label: "Buffer: total concentration (mol/dm³)", min: 0.05, max: 1, step: 0.05, unit: " mol/dm³" },
        { type: "range", key: "r", label: "Buffer: [CH₃COO⁻] / [CH₃COOH] ratio", min: 0.1, max: 10, step: 0.1 },
        { type: "button", label: "Add 1 mmol of HCl (strong acid) to both", action: (S, s, c) => { c.nAdd = Math.min(c.nAdd + 1, 40); } },
        { type: "button", label: "Add 1 mmol of NaOH (strong base) to both", action: (S, s, c) => { c.nAdd = Math.max(c.nAdd - 1, -40); } },
        { type: "button", label: "Reset additions", cls: "secondary", action: (S, s, c) => { c.nAdd = 0; } },
      ];
    },
    views: [{ label: "Bench", cam: [[3.2, 3.0, 10.4], [3.5, 2.8, 0]] }, { label: "Beaker", cam: [[0.6, 1.4, 4.6], [1.1, 1.0, 0]] }],
    note: "A titration curve plots pH against the volume of titrant. The equivalence point is where moles of acid = moles of base (here at 25.0 cm³). For strong acid + strong base it is at pH 7 and the curve is very steep; for a weak acid + strong base it is above 7 (the salt hydrolyses, so use phenolphthalein), and for a weak base + strong acid it is below 7 (use methyl orange). At half-equivalence a weak acid has [HA] = [A⁻], so pH = pKa (4.74 for ethanoic acid). A buffer, a weak acid with its salt, resists pH change because it holds both a source and a sink for H⁺: pH = pKa + log([A⁻]/[HA]) (Henderson–Hasselbalch).",
    onChange() {}, reset(S, s, c) { Object.assign(c, { mode: "curve", cs: "wasb", ind: "pp", V: 0, c: 0.5, r: 1, nAdd: 0 }); },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Titration</th><th>pH at start</th><th>pH at 12.5 cm³</th><th>pH at 25.0 cm³ (equivalence)</th><th>pH at 37.5 cm³</th><th style="text-align:left">Best indicator</th></tr>' + Object.keys(CASE).map((k) => { const best = k === "sasb" ? "any (all within the steep part)" : k === "wasb" ? "phenolphthalein" : "methyl orange"; return '<tr class="' + (k === c.cs ? "ok" : "") + '"><td style="text-align:left">' + CASE[k].name + "</td>" + [0, 12.5, 25, 37.5].map((v) => "<td>" + pHcurve(k, v).toFixed(2) + "</td>").join("") + '<td style="text-align:left">' + best + "</td></tr>"; }).join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.m4 = new T.Matrix4(); S.mk.box(9, 0.1, 3, M.matte(0x2a2e36, 0.7), 1.2, -0.05, 0);
      s.bk = K.vessel("beaker"); s.bk.group.position.set(1.4, 0, 0); s.liq = s.bk.addLiquid({ color: [226, 238, 246], opacity: 0.5 }); s.liq.setVolume(60);
      s.bk2 = K.vessel("beaker"); s.bk2.group.position.set(3.4, 0, 0); s.liq2 = s.bk2.addLiquid({ color: [226, 238, 246], opacity: 0.5 }); s.liq2.setVolume(60);
      /* burette stand */
      s.bur = new T.Group(); const tube = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 3.4, 20, 1, true), new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false })); tube.position.y = 3.6; s.bur.add(tube); s.bcol = new T.Mesh(new T.CylinderGeometry(0.085, 0.085, 1, 16), new T.MeshStandardMaterial({ color: 0xaecff0, transparent: true, opacity: 0.55 })); s.bur.add(s.bcol); const tap = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.3, 12), M.matte(0x2a7ad0, 0.4)); tap.rotation.z = Math.PI / 2; tap.position.y = 1.85; s.bur.add(tap); const tip = new T.Mesh(new T.CylinderGeometry(0.03, 0.01, 0.35, 10), new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.6 })); tip.position.y = 1.65; s.bur.add(tip); s.bur.position.set(1.4, 0, 0); S.scene.add(s.bur);
      s.stand = S.mk.rod(V3(0.4, 0, -0.5), V3(0.4, 5.4, -0.5), 0.04, M.steel()); s.arm = S.mk.rod(V3(0.4, 4.9, -0.5), V3(1.35, 4.9, -0.1), 0.03, M.steel());
      s.drops = K.drops({ color: 0xaecff0 });
      /* pH meter probes */
      const probe = (x) => { const g = new T.Group(); const rod = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.6, 12), M.matte(0x2a2c30, 0.5)); rod.position.y = 1.1; g.add(rod); const bulb = new T.Mesh(new T.SphereGeometry(0.08, 14, 10), new T.MeshStandardMaterial({ color: 0xcfe3ee, roughness: 0.2 })); bulb.position.y = 0.3; g.add(bulb); g.position.set(x, 0.3, 0); S.scene.add(g); return g; };
      s.pr1 = probe(1.0); s.pr2 = probe(3.0); s.pr2.position.z = 0;
    },
    update(S, s, c, dt) {
      const cur = c.mode === "curve"; s.bur.visible = cur; s.stand.visible = cur; s.arm.visible = cur; s.bk2.group.visible = !cur; s.pr2.visible = !cur; s.bk.group.position.x = cur ? 1.4 : 0.6; s.pr1.position.x = cur ? 1.0 : 0.2;
      if (cur) {
        const cs = CASE[c.cs], pH = pHcurve(c.cs, c.V); s.pH = pH; const base = c.cs === "sawb" ? 11.1 : 0; s.liq.setColor(colour(c.ind, pH), 0.55); s.liq.setVolume(60 + c.V * 1.1); s.liq.update(S.t);
        const left = 1 - c.V / 55; s.bcol.scale.y = Math.max(0.05, 3.1 * left); s.bcol.position.y = 5.1 - 1.55 * (1 - left) * 2 * 0.5 * 0 - (3.1 * (1 - left)) / 2 * 1 - 0.0 + 0.0 - 0.0; s.bcol.position.y = 5.2 - (3.1 * left) / 2 - 3.1 * (1 - left) * 0 - 0.0;
        s.bcol.position.y = 1.9 + (3.1 * left) / 2; s.bcol.material.color.setRGB(...(c.cs === "sawb" ? [0.75, 0.82, 0.95] : [0.7, 0.8, 0.95]));
        if (dt > 0) { if (s.lastV != null && Math.abs(c.V - s.lastV) > 0.01) { s.dr = (s.dr || 0) + Math.abs(c.V - s.lastV) * 12; } s.dr = Math.max(0, (s.dr || 0) - dt * 8); if (s.dr > 0.3) { s.drops.emit(1.4, 1.62, 0, 0.14 + s.liq.level * CM, 0.03); } } s.lastV = c.V; s.drops.update(dt);
      } else {
        const p1 = bufpH(c.c, c.r, c.nAdd), p2 = wpH(c.nAdd); s.p1 = p1; s.p2 = p2; s.liq.setColor(colour(c.ind, p1), 0.55); s.liq2.setColor(colour(c.ind, p2), 0.55); s.liq.setVolume(60); s.liq2.setVolume(60); s.liq.update(S.t); s.liq2.update(S.t); s.drops.update(dt);
      }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); const px = w - 250; ctx.textAlign = "left"; const I = IND[c.ind];
      if (c.mode === "curve") {
        const cs = CASE[c.cs], pH = s.pH, pts = []; for (let v = 0; v <= 50; v += 0.5) pts.push([v, pHcurve(c.cs, v)]);
        H.pill(ctx, 10, 22, cs.name, "#ffe9b8", 11); H.pill(ctx, 10, 44, "pH = " + pH.toFixed(2) + "   indicator: " + (pH < I.lo ? I.ca : pH > I.hi ? I.cb : "mid-change colour"), "#9fe3ff", 10);
        H.graph(ctx, px, 58, 240, 150, { series: [{ pts, color: "#7dd3ff", width: 2 }], xmin: 0, xmax: 50, ymin: 0, ymax: 14, ticksX: 5, ticksY: 7, xl: "titrant / cm³", yl: "pH", dot: [c.V, pH, "#ffd27a"] });
        const gx0 = px + 34, gy0 = 58 + 16, PW = 240 - 46, PH = 150 - 40, yp = (v) => gy0 + PH - (v / 14) * PH; ctx.fillStyle = "rgba(255,210,122,0.18)"; ctx.fillRect(gx0, yp(I.hi), PW, yp(I.lo) - yp(I.hi)); ctx.fillStyle = "#ffd27a"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText(I.n, gx0 + 4, yp(I.hi) - 2);
        const ex = gx0 + (25 / 50) * PW; ctx.strokeStyle = "rgba(125,255,189,0.6)"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(ex, gy0); ctx.lineTo(ex, gy0 + PH); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#7dffbd"; ctx.fillText("equivalence", ex + 2, gy0 + 9);
        H.panel(ctx, px, 214, 240, 78); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText(cs.eq, px + 8, 229); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("flask: " + cs.an, px + 8, 243); ctx.fillText("burette: " + cs.ti, px + 8, 255); ctx.fillStyle = c.V < 25 ? "#ffd27a" : "#7dffbd"; ctx.fillText(c.V < 24.8 ? "before equivalence" : c.V <= 25.2 ? "AT the equivalence point" : "after equivalence (excess titrant)", px + 8, 270);
        const q = S.proj(V3(1.4, 2.7, 0)); H.pill(ctx, q.x, q.y, "flask + indicator", "#bcd0ea", 8.5, "center"); const q2 = S.proj(V3(1.55, 5.4, 0)); H.pill(ctx, q2.x + 10, q2.y, "burette", "#bcd0ea", 8.5, "left");
        const pq = S.proj(V3(1.0, 2.1, 0)); H.pill(ctx, pq.x - 44, pq.y, "pH " + pH.toFixed(2), "#ffd27a", 9, "center");
      } else {
        const p1 = s.p1, p2 = s.p2; H.pill(ctx, 10, 22, "Buffer vs water: add acid or base", "#ffe9b8", 11); H.pill(ctx, 10, 44, "added: " + (c.nAdd > 0 ? c.nAdd + " mmol HCl" : c.nAdd < 0 ? -c.nAdd + " mmol NaOH" : "nothing"), "#9fe3ff", 10);
        H.panel(ctx, px, 58, 240, 150); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("pH after the additions", px + 8, 73); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("Buffer: pH = " + p1.toFixed(2), px + 8, 94); ctx.fillStyle = "#ff9a8a"; ctx.fillText("Water : pH = " + p2.toFixed(2), px + 8, 112); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("start (buffer) = " + bufpH(c.c, c.r, 0).toFixed(2) + " ; start (water) = 7.00", px + 8, 132); ctx.fillText("change: buffer " + (p1 - bufpH(c.c, c.r, 0)).toFixed(2) + " ; water " + (p2 - 7).toFixed(2), px + 8, 148); wrapT(ctx, "The buffer barely changes until its acid or base is used up; water swings by several pH units.", px + 8, 166, 224, 10.5);
        H.panel(ctx, px, 214, 240, 78); ctx.fillStyle = "#e8f0ff"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText("pH = pKa + log([A⁻]/[HA])", px + 8, 230); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("pKa(ethanoic acid) = 4.74", px + 8, 245); ctx.fillText("ratio now = " + c.r.toFixed(1) + ", total = " + c.c.toFixed(2) + " mol/dm³", px + 8, 259); ctx.fillText("capacity: " + (c.c * 50 * Math.min(c.r, 1 / c.r) / (1 + Math.min(c.r, 1 / c.r))).toFixed(1) + " mmol", px + 8, 273);
        const q = S.proj(V3(0.6, 2.7, 0)); H.pill(ctx, q.x, q.y, "buffer", "#bcd0ea", 8.5, "center"); const q2 = S.proj(V3(3.4, 2.7, 0)); H.pill(ctx, q2.x, q2.y, "water", "#bcd0ea", 8.5, "center");
        const a = S.proj(V3(0.2, 2.1, 0)); H.pill(ctx, a.x - 30, a.y, "pH " + p1.toFixed(2), "#ffd27a", 9, "center"); const b = S.proj(V3(3.0, 2.1, 0)); H.pill(ctx, b.x - 30, b.y, "pH " + p2.toFixed(2), "#ff9a8a", 9, "center");
      }
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "curve") { const cs = CASE[c.cs], pH = s.pH, I = IND[c.ind]; return [["Titration", cs.name], ["Equation", cs.eq], ["Volume added", c.V.toFixed(1) + " cm³ (equivalence at 25.0 cm³)"], ["pH", pH.toFixed(2) + "   [H⁺] = " + (10 ** -pH).toExponential(2) + " mol/dm³"], ["Indicator", I.n + ": " + I.ca + " below " + I.lo + ", " + I.cb + " above " + I.hi], ["Half-equivalence (weak acid)", "pH = pKa = 4.74 at 12.5 cm³"], ["Choose the indicator", "its range must lie on the steep part of the curve"]]; }
      return [["Buffer", "CH₃COOH / CH₃COO⁻, " + c.c.toFixed(2) + " mol/dm³, ratio " + c.r.toFixed(1)], ["Starting pH", bufpH(c.c, c.r, 0).toFixed(2)], ["After additions", "buffer " + s.p1.toFixed(2) + " ; water " + s.p2.toFixed(2)], ["Henderson–Hasselbalch", "pH = pKa + log([A⁻]/[HA])"], ["Why it works", "added H⁺ is mopped up by CH₃COO⁻; added OH⁻ by CH₃COOH"]];
    },
    steps(s, c) { return c.mode === "curve" ? [["Pick a titration and an indicator", "done"], ["Add titrant and watch the pH and colour", c.V > 0 ? "done" : "now"], ["Find the steep part and the equivalence point", c.V > 24 ? "done" : ""], ["Check which indicator suits each titration", ""]] : [["Set the buffer ratio and concentration", "done"], ["Add acid and base to both beakers", c.nAdd !== 0 ? "done" : "now"], ["Compare how far each pH moves", ""], ["Increase the concentration to raise the capacity", ""]]; },
  };
})();
