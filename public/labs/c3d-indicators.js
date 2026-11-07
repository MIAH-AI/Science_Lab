/* c3d-indicators.js — chemistry 3D, new module: acid–base indicators and their colour ranges */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  /* [pH, [r,g,b], opacity] colour stops */
  const IND = {
    litmus: { name: "Litmus", acid: "red", base: "blue", lo: 5.0, hi: 8.0, ac: "#d22838", bc: "#3a58d0", use: "only shows acid or alkali: the change is gradual over three pH units, so it is not used for titrations", stops: [[0, [210, 40, 50], 0.62], [5, [215, 45, 55], 0.62], [6.5, [150, 60, 140], 0.62], [8, [55, 85, 205], 0.62], [14, [50, 80, 210], 0.62]] },
    mo: { name: "Methyl orange", acid: "red", base: "yellow", lo: 3.1, hi: 4.4, ac: "#e63a28", bc: "#fad72d", use: "strong acid + weak base (e.g. HCl with NH₃): the end point is on the acid side", stops: [[0, [225, 45, 40], 0.62], [3.1, [230, 60, 40], 0.62], [3.75, [245, 140, 40], 0.62], [4.4, [250, 215, 45], 0.62], [14, [250, 215, 45], 0.62]] },
    pp: { name: "Phenolphthalein", acid: "colourless", base: "pink", lo: 8.3, hi: 10.0, ac: "#e8eef4", bc: "#e6288c", use: "weak acid + strong base (e.g. ethanoic acid with NaOH): the end point is on the alkaline side", stops: [[0, [236, 242, 248], 0.16], [8.3, [236, 242, 248], 0.16], [9.2, [240, 130, 195], 0.5], [10, [230, 40, 140], 0.72], [14, [220, 30, 130], 0.8]] },
    btb: { name: "Bromothymol blue", acid: "yellow", base: "blue", lo: 6.0, hi: 7.6, ac: "#f5d732", bc: "#3264d2", use: "strong acid + strong base: changes colour near pH 7, so it is a good choice", stops: [[0, [245, 215, 50], 0.62], [6, [245, 215, 50], 0.62], [6.8, [70, 170, 85], 0.62], [7.6, [50, 100, 210], 0.62], [14, [45, 95, 205], 0.62]] },
    ui: { name: "Universal indicator", acid: "red", base: "violet", lo: 1.0, hi: 13.0, ac: "#de1c24", bc: "#702898", use: "a mixture that gives a different colour for every pH, so it measures pH approximately", stops: [[0, [222, 28, 36], 0.62], [3, [240, 88, 30], 0.62], [5, [250, 200, 32], 0.62], [7, [62, 170, 72], 0.62], [9, [40, 112, 204], 0.62], [11, [86, 62, 172], 0.62], [14, [112, 40, 152], 0.62]] },
  };
  const KEYS = Object.keys(IND), SHORT = { litmus: "Litmus", mo: "Me orange", pp: "Phenolph.", btb: "BTB", ui: "Universal" };
  function colour(k, pH) { const st = IND[k].stops; pH = clamp(pH, 0, 14); let i = 0; while (i < st.length - 2 && pH > st[i + 1][0]) i++; const a = st[i], b = st[i + 1], t = clamp((pH - a[0]) / (b[0] - a[0]), 0, 1); return { rgb: a[1].map((v, j) => v + (b[1][j] - v) * t), op: a[2] + (b[2] - a[2]) * t }; }
  const css = (rgb) => "rgb(" + rgb.map((v) => Math.round(v)).join(",") + ")";
  const PHS = [1, 3, 5, 7, 9, 11, 13];
  const NAMES = { 1: "strong acid", 3: "acid", 5: "weak acid", 7: "neutral", 9: "weak alkali", 11: "alkali", 13: "strong alkali" };

  C3.scenes.indicators = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[1.7, 2.0, 8.8], [1.8, 1.0, 0]],
    values: { mode: "series", ind: "mo", pH: 7 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Experiment", options: [{ value: "series", label: "One indicator in solutions of pH 1 to 13" }, { value: "compare", label: "All indicators in one solution (set the pH)" }] },
        { type: "select", key: "ind", label: "Indicator", options: KEYS.map((k) => ({ value: k, label: IND[k].name })) },
        { type: "range", key: "pH", label: "pH of the solution (compare mode)", min: 0, max: 14, step: 0.1 },
      ];
    },
    views: [{ label: "Test-tube rack", cam: [[1.7, 2.0, 8.8], [1.8, 1.0, 0]] }, { label: "Close", cam: [[1.0, 1.6, 5.0], [1.2, 1.0, 0]] }],
    note: "An indicator is a weak acid or base whose acid form and alkali form have different colours. It changes colour over a pH range, not at one exact value. Litmus: red below 5, blue above 8. Methyl orange: red below 3.1, yellow above 4.4. Phenolphthalein: colourless below 8.3, pink above 10. Bromothymol blue: yellow below 6, blue above 7.6. Universal indicator is a mixture and shows a different colour at every pH. For a titration choose the indicator whose range lies on the steep part of the pH curve: methyl orange for strong acid + weak base, phenolphthalein for weak acid + strong base, either for strong acid + strong base. Colours here are typical textbook values.",
    reset(S, s, c) { Object.assign(c, { mode: "series", ind: "mo", pH: 7 }); },
    table() {
      return '<table class="c3-table"><tr><th style="text-align:left">Indicator</th><th style="text-align:left">Acid colour</th><th style="text-align:left">Range (pH)</th><th style="text-align:left">Alkali colour</th></tr>' + KEYS.map((k) => '<tr><td style="text-align:left">' + IND[k].name + '</td><td style="text-align:left">' + IND[k].acid + '</td><td style="text-align:left">' + IND[k].lo + ' – ' + IND[k].hi + '</td><td style="text-align:left">' + IND[k].base + '</td></tr>').join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); S.mk.box(11, 0.1, 4, M.matte(0xb99a74, 0.6), 0.5, -0.05, 0);
      s.rack = S.mk.box(5.6, 0.07, 0.6, M.matte(0x7a5330, 0.6), 0, 0.035, 0);
      s.tubes = []; for (let i = 0; i < 7; i++) { const v = K.vessel("testtube"); v.group.position.set((i - 3) * 0.62, 0.07, 0); const l = v.addLiquid({ color: [240, 240, 240], opacity: 0.4 }); l.setVolume(12); s.tubes.push({ v, l }); }
    },
    update(S, s, c, dt) {
      const ser = c.mode === "series";
      s.tubes.forEach((t, i) => {
        let k, p, vis = true;
        if (ser) { k = c.ind; p = PHS[i]; } else { vis = i < KEYS.length; k = KEYS[i] || "ui"; p = c.pH; }
        t.v.group.visible = vis; t.k = k; t.p = p; t.x = (ser ? (i - 3) * 0.62 : (i - 2) * 0.8); if (!ser) t.v.group.position.x = t.x; else t.v.group.position.x = t.x;
        const cc = colour(k, p); t.cc = cc; t.l.setColor(cc.rgb, cc.op); t.l.update(S.t);
      });
      s.rack.scale.x = ser ? 1 : 4.4 / 5.6; s.rack.position.x = 0;
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, ser = c.mode === "series", I = IND[c.ind];
      H.pill(ctx, 10, 22, ser ? I.name + " in solutions of increasing pH" : "Five indicators in a solution of pH " + c.pH.toFixed(1), "#ffe9b8", 11);
      H.pill(ctx, 10, 44, ser ? "range pH " + I.lo + " – " + I.hi + ":  " + I.acid + " → " + I.base : "a different colour for each indicator at the same pH", "#9fe3ff", 9.5);
      s.tubes.forEach((t) => { if (!t.v.group.visible) return; const q = S.proj(V3(t.x, 2.35, 0)); H.pill(ctx, q.x, q.y, ser ? "pH " + t.p : SHORT[t.k], "#cfe0f5", 8.5, "center"); if (ser) { const q2 = S.proj(V3(t.x, -0.1, 0.5)); H.pill(ctx, q2.x, q2.y + 6, NAMES[t.p], "#9fb2d2", 7.5, "center"); } });
      /* colour bar */
      const k = ser ? c.ind : "ui", bx = px + 10, by = 92, bw = 220, bh = 22; H.panel(ctx, px, 58, 240, 128); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText((ser ? I.name : "Universal indicator") + " colour scale", px + 8, 73);
      for (let i = 0; i < bw; i++) { const cc = colour(k, (i / bw) * 14); ctx.fillStyle = css(cc.rgb); ctx.globalAlpha = k === "pp" ? clamp(cc.op * 1.4, 0.15, 1) : 1; ctx.fillRect(bx + i, by, 1.5, bh); } ctx.globalAlpha = 1; ctx.strokeStyle = "#9fb2d2"; ctx.strokeRect(bx, by, bw, bh);
      ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb2d2"; ctx.textAlign = "center"; for (let p = 0; p <= 14; p += 2) { ctx.fillText(String(p), bx + (p / 14) * bw, by + bh + 11); } ctx.textAlign = "left";
      if (ser) { const x1 = bx + (I.lo / 14) * bw, x2 = bx + (I.hi / 14) * bw; ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x1, by - 4); ctx.lineTo(x1, by + bh + 2); ctx.moveTo(x2, by - 4); ctx.lineTo(x2, by + bh + 2); ctx.stroke(); ctx.fillStyle = "#ffd27a"; ctx.fillText("transition " + I.lo + "–" + I.hi, x1, by - 8); }
      else { const xm = bx + (c.pH / 14) * bw; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(xm, by + bh + 14); ctx.lineTo(xm - 4, by + bh + 22); ctx.lineTo(xm + 4, by + bh + 22); ctx.fill(); }
      ctx.fillStyle = "#e8f0ff"; ctx.font = "8.6px 'IBM Plex Mono',monospace"; ctx.fillText("pH", bx + bw - 12, by + bh + 22); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace";
      ctx.fillText(ser ? "acid form: " + I.acid + "   alkali form: " + I.base : "the bar shows universal indicator", px + 8, by + bh + 38); wrapT(ctx, "pH = −log₁₀[H⁺];  pH < 7 acid, pH 7 neutral, pH > 7 alkaline", px + 8, by + bh + 52, 224, 10);
      H.panel(ctx, px, 194, 240, 100); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText(ser ? "Use in titration" : "Reading the colours", px + 8, 209); ctx.font = "8.4px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff";
      wrapT(ctx, ser ? I.use : "Compare the colours with the table: litmus and universal indicator change slowly, methyl orange and phenolphthalein change sharply but in different regions.", px + 8, 224, 224, 11);
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "series") { const I = IND[c.ind]; return [["Indicator", I.name], ["Acid colour", I.acid], ["Alkali colour", I.base], ["Colour change range", "pH " + I.lo + " – " + I.hi], ["Best for", I.use]]; }
      const rows = KEYS.map((k) => { const cc = colour(k, c.pH), I = IND[k]; const nm = c.pH <= I.lo ? I.acid : c.pH >= I.hi ? I.base : "in between (transition colour)"; return [I.name, nm]; }); return [["pH", c.pH.toFixed(1) + (c.pH < 6.95 ? " (acidic)" : c.pH > 7.05 ? " (alkaline)" : " (neutral)")], ["[H⁺]", Math.pow(10, -c.pH).toExponential(2) + " mol/dm³"]].concat(rows);
    },
    steps(s, c) { return [["Pick an indicator and note its two colours", "done"], ["Look at where the colour changes along pH 1–13", c.mode === "series" ? "now" : "done"], ["Switch to compare mode and slide the pH", c.mode === "compare" ? "done" : ""], ["Choose the right indicator for a titration", ""]]; },
  };
})();
