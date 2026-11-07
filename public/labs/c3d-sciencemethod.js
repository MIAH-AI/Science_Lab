/* c3d-sciencemethod.js — chemistry 3D, batch D (part 5): the scientific method as a real investigation
   Question: does water temperature change how fast an effervescent tablet dissolves?
   Model: t = 60·exp(−0.03·(T−20)) s, with random experimental scatter (≈6 %) so repeats differ. */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const STEPS = [
    { t: "1  Observation", d: "Notice something and ask a question." },
    { t: "2  Hypothesis", d: "Propose a testable explanation / prediction." },
    { t: "3  Experiment", d: "Change ONE variable, control the rest, measure, repeat." },
    { t: "4  Analysis", d: "Process the data: mean, range, units, significant figures." },
    { t: "5  Law / Theory", d: "Does the evidence support it? Can it be generalised?" },
  ];
  const HYP = { up: "Hotter water makes the tablet dissolve FASTER", down: "Hotter water makes the tablet dissolve SLOWER", none: "Temperature makes NO difference" };
  const TEMPS = [10, 20, 30, 40, 50, 60, 70];
  const trueTime = (Tc) => 60 * Math.exp(-0.03 * (Tc - 20));
  const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const CAMS = [[[-0.4, 3.2, 10.4], [-0.4, 2.2, 0]], [[-0.4, 3.6, 11.5], [-0.4, 2.3, 0]], [[-0.4, 3.2, 10.4], [-0.4, 2.2, 0]], [[-0.4, 3.8, 12], [-0.4, 1.9, 0]], [[-0.4, 3.8, 12], [-0.4, 1.9, 0]]];
  const SPEED = 6;                                                  // simulated seconds of dissolving per real second

  function stats(tr, Tc) { const a = tr.filter((q) => q.T === Tc).map((q) => q.t); if (!a.length) return null; const mean = a.reduce((x, y) => x + y, 0) / a.length; return { n: a.length, mean, min: Math.min(...a), max: Math.max(...a) }; }
  function byTemp(tr) { const out = []; TEMPS.forEach((Tc) => { const st = stats(tr, Tc); if (st) out.push(Object.assign({ T: Tc }, st)); }); return out; }
  function verdict(tr) {
    const g = byTemp(tr); if (g.length < 3) return null;
    const n = g.length, mx = g.reduce((a, b) => a + b.T, 0) / n, my = g.reduce((a, b) => a + b.mean, 0) / n;
    let sxy = 0, sxx = 0, syy = 0; g.forEach((q) => { sxy += (q.T - mx) * (q.mean - my); sxx += (q.T - mx) ** 2; syy += (q.mean - my) ** 2; });
    const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0; return { slope: sxy / sxx, r, trend: r < -0.7 ? "up" : r > 0.7 ? "down" : "none", n };
  }
  function sig(v, n) { return v === 0 ? "0" : Number(v.toPrecision(n)).toString(); }
  function wrap(ctx, text, x, y, maxW, lh) { const words = text.split(" "); let line = ""; for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) ctx.fillText(line, x, y); return y + lh; }

  C3.scenes.scientificMethod = {
    env: "chemlab", envI: 1, fov: 36, free: true, cam: CAMS[0],
    values: { step: 0, hyp: "up", T: 20 },
    state: () => ({ trials: [], run: null, last: null, hotT: 20, clock: 0 }),
    controls: [
      { type: "select", key: "step", label: "Stage of the scientific method", options: STEPS.map((q, i) => ({ value: i, label: q.t })) },
      { type: "button", label: "Next stage ▶", action: (S, s, c, rf) => { c.step = Math.min(4, c.step + 1); C3.setView(S, { cam: CAMS[c.step] }); rf && rf(); } },
      { type: "select", key: "hyp", label: "Your hypothesis (stage 2)", options: Object.keys(HYP).map((k) => ({ value: k, label: HYP[k] })) },
      { type: "select", key: "T", label: "Independent variable: water temperature, T (°C)", options: TEMPS.map((v) => ({ value: v, label: v + " °C" })) },
      { type: "button", label: "▶ Run one trial (drop in a tablet and time it)", action: (S, s, c) => startTrial(s, c) },
      { type: "button", label: "Run 3 repeats at this temperature", action: (S, s, c) => { s.queue = 2; startTrial(s, c); } },
      { type: "button", label: "Clear all results", action: (S, s) => { s.trials = []; s.last = null; s.run = null; s.queue = 0; }, cls: "secondary" },
    ],
    views: [{ label: "Bench", cam: CAMS[0] }, { label: "Close up", cam: [[0, 2.9, 5.2], [0, 2.3, 0]] }, { label: "Wide", cam: [[0, 4.6, 13], [0, 2.2, 0]] }],
    note: "A fair test changes only the independent variable (temperature) and keeps the control variables the same: 100 cm³ of water, one tablet of the same brand, the same stirring, the same timing method. Repeating the trial shows the random scatter in real measurements; the mean is a better estimate than any single result. A hypothesis that survives many independent tests becomes accepted knowledge — but it can always be revised if new evidence disagrees.",
    onChange(S, s, c, key) { if (key === "step") C3.setView(S, { cam: CAMS[c.step] }); if (key === "T") { s.run = null; } },
    reset(S, s, c) { Object.assign(c, { step: 0, hyp: "up", T: 20 }); s.trials = []; s.run = null; s.last = null; s.queue = 0; C3.setView(S, { cam: CAMS[0] }); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.queue = 0;
      s.plate = S.mk.cyl(1.55, 1.6, 0.22, M.matte(0x2a2f3a, 0.4), 0, 0.12, 0); S.mk.cyl(1.3, 1.34, 0.04, M.matte(0x151820, 0.3), 0, 0.24, 0);
      s.glow = new T.Mesh(new T.TorusGeometry(1.0, 0.045, 10, 48), new T.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0 })); s.glow.rotation.x = Math.PI / 2; s.glow.position.y = 0.27; S.scene.add(s.glow);
      s.bk = K.beaker(); s.bk.group.position.set(0, 0.26, 0); s.liq = s.bk.addLiquid({ color: 0xcfe9ff, opacity: 0.3 }); s.liq.setVolume(100);
      s.bub = K.bubbles(s.bk, s.liq, { n: 140, x: 0, z: 0, baseY: 0.6, spread: 1.2 });
      s.tab = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.09, 24), new T.MeshStandardMaterial({ color: 0xf4f1e6, roughness: 0.7 })); s.tab.visible = false; S.scene.add(s.tab);
      /* thermometer standing in the beaker */
      S.mk.cyl(0.05, 0.05, 2.9, M.matte(0xf1f5fa, 0.2), 0.95, 1.7, 0.15); s.th = S.mk.cyl(0.026, 0.026, 1.0, M.matte(0xff2a2a, 0.2), 0.95, 1.2, 0.2); s.th.scale.y = 0.5;
      /* stopwatch */
      s.swC = U.cv(256, 128); s.swT = new T.CanvasTexture(s.swC); s.swT.colorSpace = T.SRGBColorSpace;
      S.mk.rbox(1.7, 1.0, 0.5, 0.09, M.paint(0x2c3a54), 3.2, 0.5, 0.2); const scr = new T.Mesh(new T.PlaneGeometry(1.44, 0.72), new T.MeshBasicMaterial({ map: s.swT })); scr.position.set(3.2, 0.55, 0.56); S.scene.add(scr);
      /* tablets, balance-style tray + measuring cylinder as controlled-variable props */
      S.mk.cyl(0.55, 0.55, 0.05, M.matte(0xe8ecf2, 0.4), -3.2, 0.03, 0.4); for (let i = 0; i < 4; i++) S.mk.cyl(0.2, 0.2, 0.09, new T.MeshStandardMaterial({ color: 0xf4f1e6, roughness: 0.7 }), -3.2 + (i % 2) * 0.35 - 0.17, 0.1 + Math.floor(i / 2) * 0.1, 0.4);
      s.mc = K.measCylinder(); s.mc.group.position.set(-4.6, 0.02, 0.2); s.mc.addLiquid({ color: 0xcfe9ff, opacity: 0.3 }).setVolume(100);
      s.ping = 0;
    },
    update(S, s, c, dt) {
      s.hotT += (c.T - s.hotT) * Math.min(1, dt * 2.5);
      const run = s.run; let dissolved = 0;
      if (run && dt > 0) {
        run.t += dt * SPEED; run.fall = Math.min(1, run.fall + dt * 2.2);
        if (run.t >= run.dur) { const rec = { T: run.T, t: run.meas }; s.trials.push(rec); s.last = rec; s.run = null; if (s.queue > 0) { s.queue--; startTrial(s, c); } }
      }
      const r = s.run; if (r) dissolved = r.t / r.dur;
      s.tab.visible = !!r && dissolved < 0.98; if (r) { const y = lerpY(r); s.tab.position.set(0.1, y, 0); s.tab.rotation.set(S.t * 1.7, S.t, 0.4); const k = Math.max(0.05, 1 - dissolved); s.tab.scale.set(k ** 0.5, k, k ** 0.5); }
      s.bub.rate = r && r.fall >= 1 ? 90 * (1 - dissolved) + 6 : 0; s.bub.update(dt, S.t);
      s.liq.setColor(dissolved > 0 && r ? 0xe8f4ff : 0xcfe9ff, dissolved > 0 && r ? 0.38 : 0.3); s.liq.update && s.liq.update(S.t);
      const hot = clamp((s.hotT - 20) / 50, 0, 1); s.glow.material.opacity = hot * 0.9; s.th.scale.y = 0.2 + (s.hotT / 80) * 0.9; s.th.position.y = 0.6 + s.th.scale.y * 0.5;
      /* stopwatch face */
      const g = s.swC.getContext("2d"); g.fillStyle = "#0b1a10"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#6dffa6"; g.font = "700 62px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
      const shown = r ? Math.min(r.t, r.meas) : s.last ? s.last.t : 0; g.fillText(shown.toFixed(1), 128, 56); g.font = "600 24px monospace"; g.fillStyle = "#9fe3b8"; g.fillText("seconds", 128, 104); s.swT.needsUpdate = true;
    },
    overlay(ctx, s, c, w, h, S) {
      const st = STEPS[c.step]; H.pill(ctx, 10, 22, st.t + " — " + st.d, "#ffe9b8", 10.5);
      for (let i = 0; i < 5; i++) { const x = 14 + i * 22; ctx.beginPath(); ctx.arc(x, 44, 6, 0, 6.3); ctx.fillStyle = i < c.step ? "#7dffbd" : i === c.step ? "#ffd27a" : "rgba(255,255,255,0.18)"; ctx.fill(); }
      ctx.save(); ctx.textAlign = "left"; ctx.font = "9.5px 'IBM Plex Mono',monospace";
      const pan = (x, y, wd, ht) => H.panel(ctx, x, y, wd, ht);
      if (c.step === 0) { pan(10, 62, 250, 124); ctx.fillStyle = "#bcd0ea"; let y = 78; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Observations", 18, y); ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; y += 6; y = wrap(ctx, "• An effervescent tablet fizzes when dropped in water (CO₂ bubbles).", 18, y + 10, 232, 12); y = wrap(ctx, "• It seems to vanish faster in warm water than in cold.", 18, y, 232, 12); wrap(ctx, "Question: does temperature change the dissolving time? Press Run to watch a tablet.", 18, y, 232, 12); }
      if (c.step === 1) { pan(10, 62, 270, 118); let y = 78; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("A good hypothesis is testable", 18, y); ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; y = wrap(ctx, "If the water is hotter, then the dissolving time will change as follows:", 18, y + 16, 252, 12); ctx.fillStyle = "#ffd27a"; y = wrap(ctx, "“" + HYP[c.hyp] + "”", 18, y + 2, 252, 12); ctx.fillStyle = "#bcd0ea"; wrap(ctx, "Independent variable: temperature (°C). Dependent variable: time (s). Control: 100 cm³ water, 1 tablet.", 18, y + 2, 252, 12); }
      if (c.step === 2) { const q = S.proj(V3(3.2, 1.3, 0.2)); H.pill(ctx, q.x, q.y, "stopwatch: time, t (s)", "#9fe3b8", 9.5, "center"); const q2 = S.proj(V3(0.95, 3.4, 0.15)); H.pill(ctx, q2.x, q2.y - 6, "thermometer: " + c.T + " °C", "#ff9a9a", 9.5, "center"); const q3 = S.proj(V3(-4.6, 2.3, 0.2)); H.pill(ctx, q3.x, q3.y, "100 cm³ (controlled)", "#9fd4ff", 9.5, "center"); const q4 = S.proj(V3(-3.2, 0.7, 0.4)); H.pill(ctx, q4.x, q4.y, "identical tablets", "#e8e2c8", 9.5, "center");
        const tr = s.trials; pan(10, 62, 190, 28 + Math.min(tr.length, 8) * 12 + 6); ctx.fillStyle = "#8fb4ff"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillText("Trial   T/°C   t/s", 18, 78); ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; tr.slice(-8).forEach((q, i) => ctx.fillText(String(tr.length - Math.min(tr.length, 8) + i + 1).padStart(3) + "     " + String(q.T).padStart(3) + "    " + q.t.toFixed(1), 18, 92 + i * 12)); if (!tr.length) { ctx.fillStyle = "#7f93b5"; ctx.fillText("no results yet", 18, 92); } }
      if (c.step >= 3) {
        const gx = 10, gy = 64, gw = 360, gh = 160, g = byTemp(s.trials), pts = g.map((q) => [q.T, q.mean]);
        H.graph(ctx, gx, gy, gw, gh, { series: [{ pts: pts, color: "#ffd27a", width: 1.6 }], xmin: 0, xmax: 80, ymin: 0, ymax: 120, ticksX: 8, ticksY: 6, xl: "T / °C", yl: "mean t / s" });
        const X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40, px = (v) => X0 + (v / 80) * PW, py = (v) => Y0 + PH - (clamp(v, 0, 120) / 120) * PH;
        s.trials.forEach((q) => { ctx.beginPath(); ctx.arc(px(q.T), py(q.t), 2.4, 0, 6.3); ctx.fillStyle = "rgba(140,200,255,0.8)"; ctx.fill(); });
        g.forEach((q) => { ctx.beginPath(); ctx.arc(px(q.T), py(q.mean), 4, 0, 6.3); ctx.fillStyle = "#ffd27a"; ctx.fill(); ctx.strokeStyle = "#ffd27a"; ctx.beginPath(); ctx.moveTo(px(q.T), py(q.min)); ctx.lineTo(px(q.T), py(q.max)); ctx.stroke(); });
        if (!g.length) { ctx.fillStyle = "#9fb2d2"; ctx.textAlign = "center"; ctx.fillText("Collect results in stage 3 first (blue dots = single trials, gold = mean with range)", gx + gw / 2, gy + gh / 2); ctx.textAlign = "left"; }
        const sd = stats(s.trials, c.T); if (sd) { pan(380, 64, 256, 84); ctx.fillStyle = "#8fb4ff"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillText("At " + c.T + " °C  (" + sd.n + " trials)", 388, 80); ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; ctx.fillText("mean = " + sig(sd.mean, 3) + " s", 388, 96); ctx.fillText("range = " + sig(sd.min, 3) + " – " + sig(sd.max, 3) + " s", 388, 108); ctx.fillStyle = "#ffd27a"; ctx.fillText("spread = ±" + sig((sd.max - sd.min) / 2, 2) + " s", 388, 120); ctx.fillStyle = "#9fb2d2"; ctx.fillText("quote the mean to 3 s.f.", 388, 138); }
      }
      if (c.step === 4) { const v = verdict(s.trials); pan(380, 156, 256, 130); let y = 172; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Conclusion", 388, y); ctx.font = "9.5px 'IBM Plex Mono',monospace";
        if (!v) { ctx.fillStyle = "#ffb8a0"; wrap(ctx, "Not enough data: you need results at 3 or more different temperatures.", 388, y + 16, 240, 12); }
        else { const ok = v.trend === c.hyp; ctx.fillStyle = ok ? "#7dffbd" : "#ff9a9a"; y = wrap(ctx, ok ? "Your hypothesis is SUPPORTED by the data." : "Your hypothesis is NOT supported — revise it.", 388, y + 16, 240, 12); ctx.fillStyle = "#dbe7ff"; y = wrap(ctx, "Trend: " + (v.trend === "up" ? "time falls as T rises" : v.trend === "down" ? "time rises as T rises" : "no clear trend") + "  (r = " + v.r.toFixed(2) + ")", 388, y, 240, 12); ctx.fillStyle = "#bcd0ea"; wrap(ctx, "Explanation (theory): warmer particles move faster and collide harder and more often, so the reaction rate rises. Many repeated tests lead to a law; the explanation is a theory.", 388, y, 240, 12); }
      }
      ctx.restore();
    },
    readouts(s, c) {
      const sd = stats(s.trials, c.T), v = verdict(s.trials);
      return [["Stage", STEPS[c.step].t], ["Hypothesis", HYP[c.hyp]], ["Independent variable", "temperature T = " + c.T + " °C"], ["Dependent variable", "dissolving time t (s)"], ["Controlled", "100 cm³ water, 1 tablet, same timing"], ["Trials recorded", s.trials.length], ["Mean at " + c.T + " °C", sd ? sig(sd.mean, 3) + " s  (range " + sig(sd.min, 3) + "–" + sig(sd.max, 3) + ")" : "no data"], ["Trend", v ? (v.trend === "up" ? "t decreases with T" : v.trend === "down" ? "t increases with T" : "none") + "  (r = " + v.r.toFixed(2) + ")" : "need ≥ 3 temperatures"]];
    },
    steps(s, c) { return STEPS.map((q, i) => [q.t + " — " + q.d, i < c.step ? "done" : i === c.step ? "now" : ""]); },
  };
  function lerpY(r) { const y0 = 4.6, y1 = 1.2; const k = clamp(r.fall, 0, 1); return y0 + (y1 - y0) * (k * k); }
  function startTrial(s, c) {
    const T0 = c.T, dur = trueTime(T0) * (1 + 0.06 * randn());
    s.run = { T: T0, dur: Math.max(5, dur), meas: Math.max(5, dur), t: 0, fall: 0 };
  }
})();
