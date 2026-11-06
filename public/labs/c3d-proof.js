/* c3d-proof.js — first two chemistry scenes built on the 3D chemistry kit:
   1. titration (Acid–Base Titration)   2. molecularShapes (VSEPR)                                             */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, chem = C3.chem, CM = C3.CM, sub = chem.sub;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180;
  function disposeGroup(g) {
    g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
    g.parent && g.parent.remove(g);
  }

  /* ===================================================================== 1. TITRATION */
  const CASES = [
    { label: "HCl in flask ← NaOH from burette", an: { type: "SA" }, tit: { type: "SB" }, aName: "HCl", tName: "NaOH", eq: "HCl + NaOH → NaCl + H₂O", note: "strong acid + strong base: equivalence pH = 7, so any of the three indicators changes colour inside the steep jump." },
    { label: "CH₃COOH in flask ← NaOH from burette", an: { type: "WA", K: 1.74e-5 }, tit: { type: "SB" }, aName: "CH₃COOH", tName: "NaOH", eq: "CH₃COOH + NaOH → CH₃COONa + H₂O", note: "weak acid + strong base: equivalence pH ≈ 8.7 (salt hydrolysis), so use phenolphthalein; methyl orange changes far too early." },
    { label: "NH₃ in flask ← HCl from burette", an: { type: "WB", K: 1.8e-5 }, tit: { type: "SA" }, aName: "NH₃(aq)", tName: "HCl", eq: "NH₃ + HCl → NH₄Cl", note: "weak base + strong acid: equivalence pH ≈ 5.3, so use methyl orange; phenolphthalein changes too early." },
    { label: "NaOH in flask ← HCl from burette", an: { type: "SB" }, tit: { type: "SA" }, aName: "NaOH", tName: "HCl", eq: "NaOH + HCl → NaCl + H₂O", note: "strong base + strong acid, titrated the other way round: pH falls from about 13 to 1." },
  ];
  const IND_KEYS = ["phenolphthalein", "methylOrange", "bromothymolBlue"];

  function cfg(c) {
    const cs = CASES[c.cs | 0], an = Object.assign({ c: c.ca }, cs.an), tit = Object.assign({ c: 0.1 }, cs.tit);
    return { cs, an, tit, ind: chem.indicators[c.ind], Ve: (an.c * c.Va) / tit.c };
  }
  function newRun(s, c) {
    const f = cfg(c); s.f = f; s.V = 0; s.R0 = Math.round(Math.random() * 16) * 0.05; s.R = s.R0; s.hang = 0; s.msg = "";
    s.curveKey = [c.cs, c.ca, c.Va].join("|"); s.xmax = clamp(Math.ceil((f.Ve * 2) / 5) * 5, 20, 50);
    s.curve = chem.curve(f.an, f.tit, c.Va, s.xmax, 0.25); s.hist = []; s.phNow = chem.ph(f.an, f.tit, c.Va, 0); s.phShown = s.phNow; s.lastHist = -9; s.stream = 0; s.plumeT = 0;
    s.hist.push([0, s.phNow]);
    (s.plumes || []).forEach((p) => { p.sp.parent && p.sp.parent.remove(p.sp); p.sp.material.dispose(); }); s.plumes = [];
    if (s.bur) { s.bur.setReading(s.R); s.flL.setVolume(c.Va); s.drops.setStream(0, 0, 0, 0, false); s.drops.setHang(0, 0, 0, 0); }
  }
  function titreStats(s) {
    const acc = s.records.slice(1); let best = null;
    for (let i = 0; i < acc.length; i++) for (let j = i + 1; j < acc.length; j++) { const d = Math.abs(acc[i].t - acc[j].t); if (d <= 0.1 + 1e-9 && (!best || d < best.d)) best = { i: i + 1, j: j + 1, d, mean: (acc[i].t + acc[j].t) / 2 }; }
    return best;
  }

  C3.scenes.titration = {
    env: "chemlab", envOpts: { w: 30, d: 11, wallH: 30, shadowArea: 12 }, envI: 0.75, fov: 38, free: false,
    cam: [[3.4, 4.6, 12.5], [0, 3.7, 0]],
    values: { cs: 0, ind: "phenolphthalein", ca: 0.1, Va: 25, tap: 0, swirl: 1, show: 1 },
    state: () => ({ records: [] }),
    controls: [
      { type: "select", key: "cs", label: "Titration", options: CASES.map((x, i) => ({ value: i, label: x.label })) },
      { type: "select", key: "ind", label: "Indicator", options: [{ value: "phenolphthalein", label: "Phenolphthalein (8.2–10.0)" }, { value: "methylOrange", label: "Methyl orange (3.1–4.4)" }, { value: "bromothymolBlue", label: "Bromothymol blue (6.0–7.6)" }] },
      { type: "range", key: "ca", label: "Flask concentration (mol/dm³)", min: 0.05, max: 0.15, step: 0.005 },
      { type: "range", key: "Va", label: "Flask volume (cm³)", min: 10, max: 25, step: 5, unit: " cm³" },
      { type: "range", key: "tap", label: "Burette tap (0 shut → 1 open)", min: 0, max: 1, step: 0.01 },
      { type: "button", label: "+ 1 drop (≈ 0.05 cm³)", action: (S, s) => dropNow(S, s, 1) },
      { type: "button", label: "+ 1 cm³", action: (S, s) => dropNow(S, s, 20), cls: "secondary" },
      { type: "button", label: "Close tap", action: (S, s, c, ref) => { c.tap = 0; ref(); }, cls: "secondary" },
      { type: "button", label: "Record final reading", action: (S, s) => record(s) },
      { type: "button", label: "Refill burette & new flask", action: (S, s, c, ref) => { c.tap = 0; newRun(s, c); ref(); }, cls: "secondary" },
      { type: "toggle", key: "swirl", label: "Swirl the flask" },
      { type: "toggle", key: "show", label: "Show theoretical curve" },
    ],
    views: [
      { label: "Whole bench", cam: [[3.6, 7.6, 26], [0, 6.8, 0]] },
      { label: "Burette + flask", cam: [[3.4, 4.6, 12.5], [0, 3.7, 0]] },
      { label: "Flask", cam: [[2.6, 3.0, 6.0], [0, 1.7, 0]] },
      { label: "Read burette", cam: (S, s) => { const y = s.bur.levelWorldY(); return [[0.25, y + 0.05, 2.1], [0, y, 0]]; } },
    ],
    note: "Titrate until the indicator first changes colour and the colour persists on swirling. Read the burette at eye level from the bottom of the meniscus; titre = final reading − initial reading. Repeat until two titres agree within 0.10 cm³, then use the mean titre.",
    onChange(S, s, c, key) { if (key === "cs" || key === "ca" || key === "Va" || key === "ind") { if (key !== "ind") { s.records = []; c.tap = 0; } newRun(s, c); } },
    reset(S, s, c) { s.records = []; c.tap = 0; newRun(s, c); },

    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.softTex = U.softDot(64, "rgba(255,255,255,1)");
      K.tile(18); K.contact(0, 0.8 * CM, 0, 5.4, 0.5);
      const flask = K.flask(); flask.group.position.set(0, 0.8 * CM, 0); s.flask = flask; s.flL = flask.addLiquid({ color: 0xcfe8f5, opacity: 0.22 });
      const stand = K.retort({ x: -1.8, z: -0.9, h: 88 }); K.contact(-1.8, 0, 0, 8, 0.55);
      const bur = K.burette({ color: 0xcfe8f5 }); bur.position.set(0, 17.5 * CM, 0); s.bur = bur; s.tipY = bur.position.y;
      K.clampArm(stand, 46, 0, 0, 0.66); K.clampArm(stand, 64, 0, 0, 0.66);
      s.drops = K.drops({ color: 0xcfe8f5 }); s.drops.setColor(0xd6ecf7);
      [[-4.7, -3.7, "HCl"], [-3.3, -3.7, "NaOH"], [8, -3.7, "CH₃COOH"], [9.6, -3.7, "NH₃"]].forEach(([x, z, l]) => { const b = K.bottle({ label: l, sub: "0.100 mol/dm³" }); b.position.set(x, 0, z); });
      s.swirlPh = 0; s.plumes = [];
      newRun(s, c);
    },

    update(S, s, c, dt) {
      const K = s.K, f = s.f, fl = s.flL, sw = c.swirl;
      /* tap → flow rate (cm³/s): drops at low opening, a stream when wide open */
      const tap = clamp(c.tap, 0, 1), rate = tap < 0.02 ? 0 : 3.3 * Math.pow(tap, 1.5);
      s.bur.tapAngle(tap);
      const empty = s.R >= 49.999; if (empty) s.msg = "Burette empty — refill";
      const surfY = s.flask.group.position.y + fl.level * CM;
      let streamOn = false;
      if (rate > 0 && !empty && dt > 0) {
        if (rate > 0.7) {                                   // continuous stream
          const dv = Math.min(rate * dt, 50 - s.R); s.R += dv; s.V += dv; streamOn = true; s.hang = 0; s.plumeT += dt; if (s.plumeT > 0.12) { s.plumeT = 0; plume(S, s, c); }
        } else { s.hang += rate * dt; if (s.hang >= 0.05) { s.hang -= 0.05; releaseDrop(S, s, c); } }
      }
      s.drops.setStream(0, s.tipY, 0, surfY, streamOn);
      s.drops.setHang(0, s.tipY, 0, streamOn ? 0 : clamp(s.hang / 0.05, 0, 1), 0.036);
      s.drops.update(dt);
      /* chemistry */
      s.phNow = chem.ph(f.an, f.tit, c.Va, s.V);
      const tau = sw ? 0.22 : 3.5; s.phShown += (s.phNow - s.phShown) * (1 - Math.exp(-dt / tau));
      const col = chem.indicatorAt(f.ind, s.phShown); s.col = col; fl.setColor(col.rgb, col.op); fl.setVolume(c.Va + s.V);
      s.bur.setReading(s.R);
      if (s.V - s.lastHist >= 0.1 || Math.abs(s.V - s.lastHist) < 1e-9 && false) { s.hist.push([s.V, s.phNow]); s.lastHist = s.V; }
      /* swirl */
      if (sw && dt > 0) s.swirlPh += dt * 2.6 * TAUV; fl.agit = sw ? 0.9 : 0;
      s.flask.group.position.x = sw ? Math.cos(s.swirlPh) * 0.045 : 0; s.flask.group.position.z = sw ? Math.sin(s.swirlPh) * 0.045 : 0;
      /* plumes (local colour where titrant lands; fades as the flask is swirled) */
      for (let i = s.plumes.length - 1; i >= 0; i--) {
        const p = s.plumes[i]; p.age += dt; const k = p.age / (sw ? 0.5 : 2.8);
        if (k >= 1) { S.scene.remove(p.sp); p.sp.material.dispose(); s.plumes.splice(i, 1); continue; }
        p.sp.material.opacity = 0.85 * (1 - k) * (1 - k); p.sp.scale.setScalar(0.35 + k * 0.5); p.sp.position.y -= dt * 0.12;
      }
      [fl, s.bur.ves.liq].forEach((l) => l.update(S.t));
    },

    overlay(ctx, s, c, w, h, S) {
      const f = s.f, ind = f.ind;
      H.pill(ctx, 10, 22, f.cs.eq, "#ffe9b8", 12); H.pill(ctx, 10, 44, "n = c × V   ·   at equivalence  n(acid) = n(base)  →  c₁V₁ = c₂V₂", "#bcd0ea", 10.5);
      /* labels */
      const q = S.proj(V3(0.3, s.tipY + 1.1, 0)); H.pill(ctx, q.x - 14, clamp(q.y + 4, 20, 380), "burette: " + f.tit.c.toFixed(3) + " mol/dm³ " + f.cs.tName, "#cfe8ff", 10.5, "right");
      H.pill(ctx, 10, 386, "flask: " + c.Va.toFixed(1) + " cm³ " + f.cs.aName + " (" + f.an.c.toFixed(3) + " M) + " + ind.name.toLowerCase(), chem.rgbCss(s.col.rgb), 10.5);
      /* zoomed burette scale: the meniscus reading, read at eye level */
      readingInset(ctx, s);
      /* pH curve */
      const gx = 396, gy = 112, gw = 240, gh = 158, X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40, xm = s.xmax;
      const series = []; if (c.show) series.push({ pts: s.curve, color: "rgba(150,190,255,.55)", width: 1.6 }); series.push({ pts: s.hist, color: "#ffd27a", width: 2.4 });
      H.graph(ctx, gx, gy, gw, gh, { series, xmin: 0, xmax: xm, ymin: 0, ymax: 14, ticksX: 5, ticksY: 7, xl: "V(titrant) / cm³", yl: "pH", dot: [Math.min(s.V, xm), s.phNow, "#ffd27a"] });
      const Y = (v) => Y0 + PH - (v / 14) * PH, X = (v) => X0 + (v / xm) * PW;
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, PW, PH); ctx.clip();
      const g = ctx.createLinearGradient(0, Y(ind.hi), 0, Y(ind.lo)); g.addColorStop(0, chem.rgbCss(ind.ramp[ind.ramp.length - 1][1], 0.38)); g.addColorStop(1, chem.rgbCss(ind.ramp[0][1], 0.38));
      ctx.fillStyle = g; ctx.fillRect(X0, Y(ind.hi), PW, Y(ind.lo) - Y(ind.hi));
      if (c.show) { ctx.strokeStyle = "rgba(120,255,190,.8)"; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X(f.Ve), Y0); ctx.lineTo(X(f.Ve), Y0 + PH); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dfe9f7"; ctx.textAlign = "right"; ctx.fillText(ind.name + " range", X0 + PW - 3, Y(ind.hi) - 3); ctx.restore();
      if (c.show) H.pill(ctx, gx + gw - 4, gy + gh + 17, "equivalence: " + f.Ve.toFixed(2) + " cm³", "#7dffbd", 10, "right");
      if (s.msg) H.pill(ctx, 320, 380, s.msg, "#ff9d8a", 11.5, "center");
      if (s.records.length) { const rough = s.records[0].t; H.pill(ctx, 10, 66, "rough titre " + rough.toFixed(2) + " cm³ → add fast to ≈ " + Math.max(0, rough - 2).toFixed(1) + ", then dropwise", "#9fe3ff", 10.5); }
    },

    readouts(s, c) {
      const f = s.f, vAdd = s.V; const nA = f.an.c * c.Va / 1000, nT = f.tit.c * vAdd / 1000;
      return [["Burette reading", s.R.toFixed(2) + " cm³"], ["Volume added", vAdd.toFixed(2) + " cm³"], ["pH of flask", s.phNow.toFixed(2)], ["Indicator colour", s.col ? s.col.label : "—"],
        ["n(flask) = c × V", (nA * 1000).toFixed(3) + " mmol"], ["n(added) = c × V", (nT * 1000).toFixed(3) + " mmol"], ["Mole ratio (acid : base)", "1 : 1"]];
    },
    steps(s, c) {
      const f = s.f, rec = s.records, best = titreStats(s);
      const st = (cond, now) => (cond ? "done" : now ? "now" : "");
      return [
        ["Fill the burette with " + f.tit.c.toFixed(3) + " mol/dm³ " + f.cs.tName + ", remove the air bubble, read the initial volume", "done"],
        ["Pipette " + c.Va.toFixed(1) + " cm³ " + f.cs.aName + " into the flask; add 2–3 drops of " + f.ind.name.toLowerCase(), "done"],
        ["Rough titration: run titrant in quickly, swirling, until the colour changes — record the reading", st(rec.length >= 1, true)],
        ["Refill; add quickly to within ≈ 2 cm³ of the rough titre, then drop by drop to the permanent end point", st(rec.length >= 2, rec.length === 1)],
        ["Repeat until two accurate titres agree within 0.10 cm³", st(!!best, rec.length >= 2)],
        ["Mean of the concordant titres → c = c(titrant) × V(titre) ÷ V(flask)", st(!!best, false)],
      ];
    },
    table(s, c) {
      const r = s.records; if (!r.length) return '<div style="font:12px IBM Plex Sans;color:#9fb3d1;margin:8px 0">No titres recorded yet — use “Record final reading” at the end point.</div>';
      const best = titreStats(s), f = s.f;
      let h = '<table class="c3-table"><tr><th></th><th>Initial</th><th>Final</th><th>Titre (cm³)</th></tr>';
      r.forEach((x, i) => { h += '<tr class="' + (best && (i === best.i || i === best.j) ? "ok" : "") + '"><td>' + (i === 0 ? "Rough" : i) + "</td><td>" + x.r0.toFixed(2) + "</td><td>" + x.r1.toFixed(2) + "</td><td>" + x.t.toFixed(2) + "</td></tr>"; });
      h += "</table>";
      if (best) { const cc = (f.tit.c * best.mean) / c.Va; h += '<div style="font:12px/1.5 IBM Plex Mono;color:#7dffbd">Mean titre = ' + best.mean.toFixed(2) + " cm³ → c(" + f.cs.aName + ") = " + f.tit.c.toFixed(3) + " × " + best.mean.toFixed(2) + " ÷ " + c.Va.toFixed(1) + " = " + cc.toFixed(4) + " mol/dm³ (set value " + f.an.c.toFixed(3) + ")</div>"; }
      return h;
    },
  };
  const TAUV = Math.PI * 2;
  function readingInset(ctx, s) {
    const x = 10, y = 72, w = 100, h = 176; H.panel(ctx, x, y, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const R = s.R, cx = x + 44, tw = 30, win = 2.6, cyc = y + h / 2 + 8, k = (h - 46) / (2 * win), top = y + 24;
    ctx.fillStyle = "#f3f3ee"; ctx.fillRect(cx - tw / 2 - 9, top, tw + 18, h - 28);                       // white card
    ctx.fillStyle = "#0b0b0b"; ctx.fillRect(cx - tw / 2 - 9, cyc + 1, tw + 18, 46);                       // black band under the meniscus
    ctx.fillStyle = "rgba(190,220,240,.55)"; ctx.beginPath(); ctx.moveTo(cx - tw / 2, top); ctx.lineTo(cx - tw / 2, cyc - 7); ctx.quadraticCurveTo(cx - tw / 2 + 3, cyc, cx, cyc); ctx.quadraticCurveTo(cx + tw / 2 - 3, cyc, cx + tw / 2, cyc - 7); ctx.lineTo(cx + tw / 2, top); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(60,90,120,.9)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx - tw / 2, top); ctx.lineTo(cx - tw / 2, y + h - 8); ctx.moveTo(cx + tw / 2, top); ctx.lineTo(cx + tw / 2, y + h - 8); ctx.stroke();
    ctx.strokeStyle = "rgba(30,60,90,.95)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - tw / 2, cyc - 7); ctx.quadraticCurveTo(cx - tw / 2 + 3, cyc, cx, cyc); ctx.quadraticCurveTo(cx + tw / 2 - 3, cyc, cx + tw / 2, cyc - 7); ctx.stroke();
    ctx.fillStyle = "#223"; ctx.font = "bold 10px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    for (let i = Math.ceil((R - win) * 10); i <= Math.floor((R + win) * 10); i++) {
      if (i < 0 || i > 500) continue; const yy = cyc + (i / 10 - R) * k, L = i % 10 === 0 ? 17 : i % 5 === 0 ? 11 : 6;
      ctx.strokeStyle = "#1a1d22"; ctx.lineWidth = i % 10 === 0 ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(cx + tw / 2, yy); ctx.lineTo(cx + tw / 2 + L, yy); ctx.stroke(); if (i % 10 === 0) ctx.fillText(String(i / 10), cx + tw / 2 + 21, yy);
    }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = "rgba(255,200,90,.95)"; ctx.lineWidth = 1.3; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x + 2, cyc); ctx.lineTo(x + w - 2, cyc); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#cfe0ff"; ctx.textAlign = "left"; ctx.fillText("burette scale (zoom)", x + 6, y + 13); ctx.fillStyle = "#ffd27a"; ctx.fillText("eye level", x + 5, cyc - 6); ctx.restore();
    H.pill(ctx, x + w / 2, y + h + 20, "reading " + R.toFixed(2) + " cm³", "#ffd27a", 11, "center");
  }
  function releaseDrop(S, s, c) {
    s.R = Math.min(50, s.R + 0.05); s.msg = "";
    const surf = s.flask.group.position.y + s.flL.level * CM;
    s.drops.emit(0, s.tipY - 0.03, 0, surf, 0.034, () => { s.V += 0.05; plume(S, s, c); });
  }
  function dropNow(S, s, n) {                           // instant additions from the buttons (drops are released one by one)
    const c = S.variant.values; if (s.R >= 49.99) { s.msg = "Burette empty — refill"; return; }
    for (let i = 0; i < n; i++) { if (s.R >= 49.999) break; s.R = Math.min(50, s.R + 0.05); s.V += 0.05; }
    plume(S, s, c); s.drops.ripple(0, s.flask.group.position.y + s.flL.level * CM, 0);
  }
  function plume(S, s, c) {
    const f = s.f, loc = chem.ph(f.an, f.tit, c.Va, s.V + 1.5), a = chem.indicatorAt(f.ind, loc), b = s.col || a, d = Math.abs(a.rgb[0] - b.rgb[0]) + Math.abs(a.rgb[1] - b.rgb[1]) + Math.abs(a.rgb[2] - b.rgb[2]);
    if (d < 30 && Math.abs(a.op - b.op) < 0.08) return;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: s.softTex, color: new T.Color(a.rgb[0] / 255, a.rgb[1] / 255, a.rgb[2] / 255).convertSRGBToLinear(), transparent: true, opacity: 0.85, depthWrite: false }));
    sp.scale.setScalar(0.35); sp.position.set(0, s.flask.group.position.y + s.flL.level * CM - 0.1, 0); sp.renderOrder = 7; S.scene.add(sp); s.plumes.push({ sp, age: 0 });
  }
  function record(s) {
    const c = P3D.S.variant.values, t = s.R - s.R0; if (t < 0.05) return;
    s.records.push({ r0: s.R0, r1: s.R, t }); s.msg = "Recorded titre " + t.toFixed(2) + " cm³ — refill for the next run";
  }

  /* ===================================================================== 2. VSEPR molecular shapes */
  const MOLS = {
    BeCl2: { label: "BeCl₂", c: "Be", l: "Cl", n: 2, lp: 0, ang: 180, ideal: 180, len: 1.77, ord: 1, shape: "Linear", dom: "Linear", ax: "AX₂" },
    BF3: { label: "BF₃", c: "B", l: "F", n: 3, lp: 0, ang: 120, ideal: 120, len: 1.3, ord: 1, shape: "Trigonal planar", dom: "Trigonal planar", ax: "AX₃" },
    CH4: { label: "CH₄", c: "C", l: "H", n: 4, lp: 0, ang: 109.47, ideal: 109.47, len: 1.09, ord: 1, shape: "Tetrahedral", dom: "Tetrahedral", ax: "AX₄" },
    NH3: { label: "NH₃", c: "N", l: "H", n: 3, lp: 1, ang: 107, ideal: 109.47, len: 1.012, ord: 1, shape: "Trigonal pyramidal", dom: "Tetrahedral", ax: "AX₃E" },
    H2O: { label: "H₂O", c: "O", l: "H", n: 2, lp: 2, ang: 104.5, ideal: 109.47, len: 0.958, ord: 1, shape: "Bent (V-shaped)", dom: "Tetrahedral", ax: "AX₂E₂" },
    CO2: { label: "CO₂", c: "C", l: "O", n: 2, lp: 0, ang: 180, ideal: 180, len: 1.16, ord: 2, shape: "Linear", dom: "Linear", ax: "AX₂" },
  };
  function geom(m, ang) {                                // → ligand + lone-pair direction vectors (unit) for the bond angle `ang`
    const L = [], P = [];
    if (m.n === 2 && m.lp === 0) { L.push(V3(1, 0, 0), V3(-1, 0, 0)); }
    else if (m.n === 2) { const a = rad(ang / 2); L.push(V3(Math.sin(a), -Math.cos(a), 0), V3(-Math.sin(a), -Math.cos(a), 0)); const ps = rad(58); P.push(V3(0, Math.cos(ps), Math.sin(ps)), V3(0, Math.cos(ps), -Math.sin(ps))); }
    else if (m.n === 3 && m.lp === 0) { for (let k = 0; k < 3; k++) { const p = rad(90 + k * 120); L.push(V3(Math.cos(p), Math.sin(p), 0)); } }
    else if (m.n === 3) { const cph = Math.sqrt(clamp((Math.cos(rad(ang)) + 0.5) / 1.5, 0, 1)), ph = Math.acos(cph); for (let k = 0; k < 3; k++) { const p = rad(90 + k * 120); L.push(V3(Math.sin(ph) * Math.cos(p), -Math.cos(ph), Math.sin(ph) * Math.sin(p))); } P.push(V3(0, 1, 0)); }
    else { [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].forEach((v) => L.push(V3(...v).normalize())); }
    return { L, P };
  }
  function buildMol(S, s, c) {
    const K = s.K; if (s.mol) { disposeGroup(s.mol.group); s.mol = null; }
    const m = (s.m = MOLS[c.mol]), g = geom(m, m.ang), d = m.len * 1.15;
    const atoms = [{ el: m.c, p: [0, 0, 0] }], bonds = [];
    g.L.forEach((v, i) => { atoms.push({ el: m.l, p: [v.x * m.len, v.y * m.len, v.z * m.len] }); bonds.push([0, i + 1, m.ord]); });
    s.mol = K.molecule({ atoms, bonds, lone: g.P.map((v) => ({ atom: 0, dir: [v.x, v.y, v.z] })) });
    /* electron-domain wireframe, arc, arrows live in the molecule group so they rotate with it */
    if (s.dom) { s.dom.geometry.dispose(); s.dom.parent && s.dom.parent.remove(s.dom); }
    s.nDom = m.n + m.lp; const pairs = []; for (let i = 0; i < s.nDom; i++) for (let j = i + 1; j < s.nDom; j++) pairs.push([i, j]);
    const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(new Float32Array(pairs.length * 6), 3));
    s.dom = new T.LineSegments(dg, new T.LineBasicMaterial({ color: 0x78b8ff, transparent: true, opacity: 0.7 })); s.dom.userData.pairs = pairs; s.dom.frustumCulled = false; s.mol.group.add(s.dom);
    const ag = new T.BufferGeometry(); ag.setAttribute("position", new T.BufferAttribute(new Float32Array(26 * 3), 3));
    s.arc = new T.Line(ag, new T.LineBasicMaterial({ color: 0xffd27a })); s.arc.frustumCulled = false; s.mol.group.add(s.arc);
    s.arrows = []; for (let i = 0; i < m.n; i++) { const a = S.mk.arrow(0x7dffbd, 0.028, 0.09); s.mol.group.add(a); s.arrows.push(a); }
    s.net = S.mk.arrow(0xff5fd2, 0.05, 0.16); s.mol.group.add(s.net);
    /* net dipole from electronegativity differences (vector sum over bonds, pointing toward the more electronegative end) */
    const EN = C3.data.EN; let net = V3(); s.bondDip = [];
    g.L.forEach((v) => { const dd = (EN[m.l] - EN[m.c]) * (m.ord === 2 ? 1 : 1); net.addScaledVector(v, dd); });
    s.dEN = Math.abs(EN[m.l] - EN[m.c]); s.netDip = net.length() < 0.02 ? 0 : net.length();
    s.bonds = g.L.length; s.curAng = m.ang;
  }

  C3.scenes.molecularShapes = {
    env: "studio", envOpts: {}, fov: 36, free: true, cam: [[0.4, 1.1, 7.4], [0, 0.15, 0]],
    values: { mol: "CH4", style: 0, rep: 1, dip: 0, dom: 1, spin: 1 },
    state: () => ({}),
    controls: [
      { type: "select", key: "mol", label: "Molecule", options: Object.keys(MOLS).map((k) => ({ value: k, label: MOLS[k].label + " — " + MOLS[k].shape })) },
      { type: "range", key: "style", label: "Ball-and-stick ← → space-filling", min: 0, max: 1, step: 0.01 },
      { type: "range", key: "rep", label: "Lone-pair repulsion (0 = ideal angle)", min: 0, max: 1, step: 0.01 },
      { type: "toggle", key: "dom", label: "Show electron-domain geometry" },
      { type: "toggle", key: "dip", label: "Show bond dipoles (ΔEN) and net dipole" },
      { type: "toggle", key: "spin", label: "Auto-rotate" },
    ],
    views: [{ label: "Front", cam: [[0.4, 1.1, 7.4], [0, 0.15, 0]] }, { label: "Side", cam: [[6.4, 0.6, 0.4], [0, -0.1, 0]] }, { label: "Top", cam: [[0.3, 6.2, 1.4], [0, 0, 0]] }],
    note: "Electron pairs (bonding and lone) arrange themselves as far apart as possible. Lone pairs repel more strongly than bonding pairs, so they squeeze the bond angle: NH₃ is 107° and H₂O is 104.5°, below the ideal tetrahedral 109.5°. Move the repulsion slider to 0 to see the ideal angle.",
    onChange(S, s, c, key) { if (key === "mol") buildMol(S, s, c); },
    reset(S, s, c) { buildMol(S, s, c); },
    build(S, s, c) { s.K = C3.kit(S); buildMol(S, s, c); },
    update(S, s, c, dt) {
      const m = s.m, mo = s.mol, EN = C3.data.EN;
      if (c.spin && !S.orbit.dragging && !S.orbit.touched) mo.group.rotation.y += dt * 0.35;
      const ang = m.ang + (m.ideal - m.ang) * (m.lp ? 1 - c.rep : 0); s.curAng = ang;
      const g = geom(m, ang);
      g.L.forEach((v, i) => mo.atoms[i + 1].p.copy(v).multiplyScalar(m.len * mo.A2U));
      mo.lone.forEach((l, i) => l.dir.copy(g.P[i]));
      mo.refresh(c.style);
      /* domain wireframe */
      const dirs = g.L.concat(g.P).map((v) => v.clone().multiplyScalar(m.len * mo.A2U * 1.1)), pa = s.dom.geometry.attributes.position, pr = s.dom.userData.pairs;
      pr.forEach(([a, b], k) => { pa.setXYZ(k * 2, dirs[a].x, dirs[a].y, dirs[a].z); pa.setXYZ(k * 2 + 1, dirs[b].x, dirs[b].y, dirs[b].z); }); pa.needsUpdate = true; s.dom.visible = !!c.dom && s.nDom > 2 || (!!c.dom && s.nDom === 2 && false);
      /* angle arc between ligand 0 and 1 */
      const u1 = g.L[0], u2 = g.L[1], ap = s.arc.geometry.attributes.position, R = 0.85 * (0.6 + 0.4 * (1 - c.style));
      s.arc.visible = ang < 175;
      if (s.arc.visible) for (let i = 0; i < 26; i++) { const k = i / 25, v = V3().lerpVectors(u1, u2, k).normalize().multiplyScalar(R); ap.setXYZ(i, v.x, v.y, v.z); } ap.needsUpdate = true;
      s.arcMid = V3().addVectors(u1, u2).normalize().multiplyScalar(R + 0.35);
      if (ang >= 175) s.arcMid = V3(0, 0.55, 0);
      /* dipoles */
      const sign = EN[m.l] - EN[m.c], show = !!c.dip;
      s.arrows.forEach((a, i) => { a.visible = show; if (!show) return; const L = mo.atoms[i + 1].p, tail = sign > 0 ? V3() : L.clone(), head = sign > 0 ? L.clone() : V3(); const dir = head.clone().sub(tail), off = V3(0, 0, 0.5); const mid = tail.clone().addScaledVector(dir, 0.2).add(off); S.setArrow(a, mid, dir.clone().multiplyScalar(0.6), 1); });
      const net = V3(); g.L.forEach((v) => net.addScaledVector(v, sign)); s.netVec = net;
      S.setArrow(s.net, V3(0, 0, -0.55), net.clone().multiplyScalar(0.55 * mo.A2U), 1); s.net.visible = show && net.length() > 0.02;
    },
    overlay(ctx, s, c, w, h, S) {
      const m = s.m, K = s.K, ang = s.curAng;
      K.labelAtoms(ctx, s.mol, 13);
      H.pill(ctx, 10, 22, m.ax + "  →  " + m.shape, "#ffe9b8", 13); H.pill(ctx, 10, 44, "electron domains " + (m.n + m.lp) + " (" + m.n + " bonding + " + m.lp + " lone) → " + m.dom.toLowerCase() + " arrangement", "#bcd0ea", 10.5);
      if (ang < 175) { const q = S.proj(s.mol.group.localToWorld(s.arcMid.clone())); H.pill(ctx, q.x, q.y, ang.toFixed(1) + "°", "#ffd27a", 12, "center"); }
      else H.pill(ctx, 320, 380, "bond angle 180°  (linear)", "#ffd27a", 12, "center");
      const bl = S.proj(s.mol.group.localToWorld(s.mol.atoms[1].p.clone().multiplyScalar(0.55)));
      H.pill(ctx, bl.x + 14, bl.y + 30, m.c + (m.ord === 2 ? "=" : "–") + m.l + "  " + Math.round(m.len * 100) + " pm", "#9fe3ff", 10);
      if (c.dip) {
        H.pill(ctx, 10, 66, "ΔEN(" + m.l + "−" + m.c + ") = " + s.dEN.toFixed(2) + "   " + (s.netDip ? "net dipole ≠ 0 → POLAR molecule" : "dipoles cancel → NON-POLAR molecule"), s.netDip ? "#ff9be6" : "#7dffbd", 10.5);
      }
      if (m.lp) H.pill(ctx, 630, 22, "lone pairs repel more than bonding pairs", "#ffe08a", 10, "right");
    },
    readouts(s, c) {
      const m = s.m, ang = s.curAng;
      return [["Molecule", m.label], ["Electron domains", m.n + m.lp + " (" + m.n + " bonding, " + m.lp + " lone)"], ["Electron-domain geometry", m.dom], ["Molecular shape", m.shape],
        ["Bond angle", ang.toFixed(1) + "°   (ideal " + m.ideal.toFixed(1) + "°)"], ["Bond length", Math.round(m.len * 100) + " pm"], ["Polarity", s.netDip ? "polar (net dipole)" : "non-polar"]];
    },
  };
})();
