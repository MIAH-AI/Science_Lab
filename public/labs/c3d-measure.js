/* c3d-measure.js — chemistry 3D, new module: measurement of physical quantities (measuring cylinder, thermometer, balance): reading, parallax, precision */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180;
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const PAR = 0.6; /* cm³ of reading error per cm of eye offset (cylinder) */
  const INST = {
    cyl: { n: "100 cm³ measuring cylinder", unit: "cm³", lo: 10, hi: 95, div: 1, dec: 1, rmin: 0, rmax: 100, step: 0.5 },
    therm: { n: "laboratory thermometer (−10 to 110 °C)", unit: "°C", lo: 8, hi: 92, div: 1, dec: 1, rmin: -10, rmax: 110, step: 0.5 },
    bal: { n: "top-pan balance", unit: "g", lo: 5, hi: 90, div: 0.1, dec: 1, rmin: 0, rmax: 100, step: 0.1 },
  };
  const rndv = (i) => { const q = INST[i]; return i === "bal" ? Math.round((q.lo + Math.random() * (q.hi - q.lo)) * 1000) / 1000 : Math.round((q.lo + Math.random() * (q.hi - q.lo)) * 2) / 2 + (Math.random() < 0.4 ? 0.0 : 0); };
  function fmtBal(v, res) { return v.toFixed(Math.round(-Math.log10(res))); }
  function sf(str) { const d = str.replace(".", "").replace(/^0+/, ""); return d.length; }

  C3.scenes.measurement = {
    env: "chemlab", envOpts: { w: 30, d: 11, wallH: 30, shadowArea: 12 }, envI: 0.75, fov: 38, free: true, cam: [[1.4, 2.2, 7.0], [0.7, 1.9, 0]],
    values: { inst: "cyl", eye: 0, my: 50, res: 0.01 },
    state: () => ({ true: 47, score: 0, tries: 0, msg: "", tare: 0, tared: 0, sample: 12.346 }),
    get controls() {
      return [
        { type: "select", key: "inst", label: "Instrument", options: Object.keys(INST).map((k) => ({ value: k, label: INST[k].n })) },
        { type: "range", key: "eye", label: "Eye level relative to the meniscus (cm; 0 = level)", min: -3, max: 3, step: 0.1 },
        { type: "range", key: "my", label: "Your reading", min: 0, max: 100, step: 0.5 },
        { type: "button", label: "Check my reading", action: (S, s, c) => { const q = INST[c.inst], app = apparent(s, c); s.tries++; const err = c.my - s.true; if (Math.abs(err) <= q.div * 0.5 + 1e-9) { s.score++; s.msg = "Correct: within half a division"; } else s.msg = "Out by " + (err > 0 ? "+" : "") + err.toFixed(1) + " " + q.unit + ": the true value is " + s.true.toFixed(1); } },
        { type: "button", label: "New value to read", cls: "secondary", action: (S, s, c) => { s.true = rndv(c.inst); s.msg = ""; } },
        { type: "select", key: "res", label: "Balance resolution (g)", options: [{ value: 0.1, label: "0.1 g" }, { value: 0.01, label: "0.01 g" }, { value: 0.001, label: "0.001 g" }] },
        { type: "button", label: "Tare (zero the empty container)", action: (S, s) => { s.tared = 1; } },
        { type: "button", label: "Add a new sample", cls: "secondary", action: (S, s) => { s.sample = Math.round((2 + Math.random() * 30) * 10000) / 10000; s.tared = 1; } },
      ];
    },
    views: [{ label: "Bench", cam: [[1.4, 2.2, 7.0], [0.7, 1.9, 0]] }, { label: "Instrument", cam: [[1.0, 2.2, 5.0], [0.5, 1.9, 0]] }],
    note: "Reading instruments: read the measuring cylinder with your eye level with the bottom of the meniscus; looking from above makes the reading too high and from below too low (parallax). Estimate between divisions to half of the smallest division and record every digit you are sure of plus one estimated digit. A balance shows its own precision: 0.01 g means the last digit is uncertain by ±0.01 g, so 12.35 g has 4 significant figures and the true mass lies in about 12.34–12.36 g. Use tare to subtract the container. The parallax size here is a simple model (about 0.6 cm³ per cm of eye offset) and the practice values are random.",
    onChange(S, s, c, key) { if (key === "inst") { s.true = rndv(c.inst); c.my = INST[c.inst].lo + 10; s.msg = ""; c.eye = 0; } },
    reset(S, s, c) { Object.assign(c, { inst: "cyl", eye: 0, my: 50, res: 0.01 }); s.true = 47; s.score = 0; s.tries = 0; s.msg = ""; s.tared = 0; },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Instrument</th><th>smallest division</th><th>read to</th><th style="text-align:left">Good practice</th></tr><tr><td style="text-align:left">100 cm³ measuring cylinder</td><td>1 cm³</td><td>±0.5 cm³</td><td style="text-align:left">eye level with the bottom of the meniscus</td></tr><tr><td style="text-align:left">thermometer</td><td>1 °C</td><td>±0.5 °C</td><td style="text-align:left">bulb fully in the liquid, wait for a steady reading, do not touch the walls</td></tr><tr><td style="text-align:left">top-pan balance (0.01 g)</td><td>0.01 g</td><td>±0.01 g</td><td style="text-align:left">tare the container; record every digit shown</td></tr></table>';
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.tile(18);
      /* measuring cylinder */
      s.cyl = K.vessel("cylinder"); s.cyl.group.position.set(0.2, 0.0, 0); s.cl = s.cyl.addLiquid({ color: 0x90c8f0, opacity: 0.35 }); K.contact(0.2, 0, 0, 3.2, 0.5);
      const ticks = []; for (let v = 0; v <= 100; v++) ticks.push({ y: s.cyl.tab.yAt(v), len: v % 10 === 0 ? 1 : v % 5 === 0 ? 0.68 : 0.38, label: v % 10 === 0 ? v : null });
      s.cScale = K.scale({ r: 1.43, y0: s.cyl.tab.yAt(0) - 0.2, y1: s.cyl.tab.yAt(100) + 0.5, ticks, arc: rad(110) }); s.cScale.position.x = 0.2; s.cScale.position.z = 0; S.scene.add(s.cScale); s.cyl.group.add(s.cScale); s.cScale.position.set(0, s.cScale.position.y, 0);
      /* thermometer */
      s.th = new T.Group(); S.scene.add(s.th); const gl = new T.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false });
      const stem = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 3.8, 20), gl); stem.position.y = 2.1; s.th.add(stem); const bulb = new T.Mesh(new T.SphereGeometry(0.2, 22, 16), new T.MeshStandardMaterial({ color: 0xd62828, roughness: 0.3 })); bulb.position.y = 0.15; s.th.add(bulb);
      s.hg = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1, 12), new T.MeshStandardMaterial({ color: 0xd62828, roughness: 0.3 })); s.th.add(s.hg);
      const tick = new T.InstancedMesh(new T.BoxGeometry(1, 0.008, 0.01), new T.MeshBasicMaterial({ color: 0x14171c }), 121); const m4 = new T.Matrix4(); for (let i = 0; i <= 120; i++) { const T0 = -10 + i, len = T0 % 10 === 0 ? 0.2 : T0 % 5 === 0 ? 0.14 : 0.08; m4.compose(V3(0.2 + len / 2, 0.55 + (i / 120) * 3.3, 0.1), new T.Quaternion(), V3(len, 1, 1)); tick.setMatrixAt(i, m4); } s.th.add(tick); s.th.position.set(0.2, 0.0, 0);
      S.mk.box(0.7, 0.05, 0.4, M.matte(0x3a4250, 0.5), 0.2, 0.025, 0).visible = true;
      /* balance */
      s.bal = new T.Group(); S.scene.add(s.bal); const base = new T.Mesh(new T.BoxGeometry(3.0, 0.5, 2.2), M.matte(0xd8dde4, 0.4)); base.position.y = 0.25; s.bal.add(base); const pan = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.06, 36), M.steel()); pan.position.y = 0.6; s.bal.add(pan);
      const scr = new T.Mesh(new T.BoxGeometry(1.5, 0.3, 0.02), new T.MeshBasicMaterial({ color: 0x0b1a10 })); scr.position.set(0, 0.28, 1.11); scr.rotation.x = -0.2; s.bal.add(scr);
      s.bb = s.K.beaker(); s.bb.group.scale.setScalar(0.5); S.scene.remove(s.bb.group); s.bal.add(s.bb.group); s.bb.group.position.set(0, 0.63, 0); s.bal.position.set(0.4, 0, 0);
      s.sol = new T.Mesh(new T.SphereGeometry(0.22, 18, 12), M.matte(0xe8e4dc, 0.7)); s.sol.scale.y = 0.4; s.sol.position.set(0, 0.7, 0); s.bal.add(s.sol);
      s.true = 47;
    },
    update(S, s, c, dt) {
      const i = c.inst, cyl = i === "cyl", th = i === "therm", ba = i === "bal"; s.cyl.group.visible = cyl; s.th.visible = th; s.bal.visible = ba;
      if (cyl) { s.cl.setVolume(s.true); s.cl.setColor([70, 150, 230], 0.6); s.cl.update(S.t); }
      if (th) { const y0 = 0.55, h = ((s.true + 10) / 120) * 3.3; s.hg.scale.set(1, y0 - 0.15 + h, 1); s.hg.position.set(0, 0.15 + (y0 - 0.15 + h) / 2, 0); }
      if (ba) { s.sol.visible = true; s.sol.scale.setScalar(0.12 + s.sample / 90); s.sol.scale.y = s.sol.scale.x * 0.5; }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, q = INST[c.inst];
      H.pill(ctx, 10, 22, q.n, "#ffe9b8", 11); H.pill(ctx, 10, 44, s.msg || (c.inst === "bal" ? "record every digit shown" : "estimate between divisions; read at eye level"), s.msg.startsWith("Correct") ? "#8dffb8" : s.msg ? "#ff9d8a" : "#9fe3ff", 9.5);
      if (c.inst === "bal") balOv(ctx, s, c, w, h, S, px); else insetOv(ctx, s, c, w, h, S, px);
      H.pill(ctx, 10, 386, "score: " + s.score + " / " + s.tries, "#bcd0ea", 10);
      ctx.restore();
    },
    readouts(s, c) {
      const q = INST[c.inst]; if (c.inst === "bal") { const disp = fmtBal(balMass(s, c), c.res); return [["Balance resolution", c.res + " g"], ["Display", disp + " g"], ["Significant figures", String(sf(disp))], ["Uncertainty", "±" + c.res + " g"], ["Range of true value", (parseFloat(disp) - c.res).toFixed(3) + " – " + (parseFloat(disp) + c.res).toFixed(3) + " g"], ["Tare", "zeroes the container so only the sample is shown"]]; }
      const app = apparent(s, c); return [["Instrument", q.n], ["Smallest division", q.div + " " + q.unit], ["Read to", "±" + q.div / 2 + " " + q.unit], ["Your reading", c.my.toFixed(1) + " " + q.unit], ["Eye position", c.eye === 0 ? "level: no parallax" : c.eye > 0 ? "above the meniscus: reads too high" : "below the meniscus: reads too low"], ["Score", s.score + " of " + s.tries]];
    },
    steps(s, c) { return [["Choose an instrument and a value to read", "done"], ["Put your eye level with the meniscus or mark", c.eye === 0 ? "done" : "now"], ["Set your reading and press Check", s.tries > 0 ? "done" : ""], ["Try different values until you score consistently", ""]]; },
  };
  const apparent = (s, c) => (c.inst === "cyl" ? s.true + c.eye * PAR : s.true);
  const balMass = (s, c) => (s.tared ? s.sample : 48.3 + s.sample);
  function insetOv(ctx, s, c, w, h, S, px) {
    const q = INST[c.inst], app = apparent(s, c), x = 10, y = 72, iw = 112, ih = 200; H.panel(ctx, x, y, iw, ih);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, iw, ih); ctx.clip();
    const win = c.inst === "cyl" ? 3.2 : 3.2, cyc = y + ih / 2 + 8, k = (ih - 46) / (2 * win), cx = x + 46, tw = 30;
    ctx.fillStyle = "#f3f3ee"; ctx.fillRect(cx - tw / 2 - 9, y + 24, tw + 18, ih - 28);
    ctx.fillStyle = "rgba(190,220,240,.55)"; ctx.fillRect(cx - tw / 2, cyc, tw, y + ih - cyc); ctx.strokeStyle = "rgba(60,90,120,.9)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(cx - tw / 2, y + 24); ctx.lineTo(cx - tw / 2, y + ih - 8); ctx.moveTo(cx + tw / 2, y + 24); ctx.lineTo(cx + tw / 2, y + ih - 8); ctx.stroke();
    ctx.strokeStyle = "rgba(30,60,90,.95)"; ctx.beginPath(); ctx.moveTo(cx - tw / 2, cyc - 7); ctx.quadraticCurveTo(cx - tw / 2 + 3, cyc, cx, cyc); ctx.quadraticCurveTo(cx + tw / 2 - 3, cyc, cx + tw / 2, cyc - 7); ctx.stroke();
    ctx.fillStyle = "#223"; ctx.font = "bold 9px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    for (let i = Math.ceil((s.true - win) * 2); i <= Math.floor((s.true + win) * 2); i++) { const v = i / 2, yy = cyc - (v - s.true) * k, whole = Math.abs(v - Math.round(v)) < 1e-6; if (!whole) continue; const L = Math.round(v) % 5 === 0 ? 14 : 7; ctx.strokeStyle = "#1a1d22"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx + tw / 2, yy); ctx.lineTo(cx + tw / 2 + L, yy); ctx.stroke(); if (Math.round(v) % 5 === 0) ctx.fillText(String(Math.round(v)), cx + tw / 2 + 17, yy); }
    ctx.restore(); ctx.save(); const sy = cyc - (app - s.true) * k; ctx.strokeStyle = "rgba(255,200,90,.95)"; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x + 2, sy); ctx.lineTo(x + iw - 2, sy); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#cfe0ff"; ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.fillText(c.inst === "cyl" ? "zoom: meniscus" : "zoom: mercury top", x + 6, y + 13); ctx.restore();
    H.pill(ctx, x + iw / 2, y + ih + 20, "you see " + app.toFixed(1) + " " + q.unit, c.eye === 0 ? "#ffd27a" : "#ff9d8a", 10, "center");
    H.panel(ctx, px, 58, 240, 130); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Reading rules", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("smallest division: " + q.div + " " + q.unit, px + 8, 89); ctx.fillText("read to: ±" + q.div / 2 + " " + q.unit + " (half a division)", px + 8, 103); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, c.inst === "cyl" ? "Eye level with the bottom of the meniscus. Eye above: reading too high (parallax). Eye below: too low. Parallax here: " + (c.eye * PAR).toFixed(1) + " cm³." : "Wait until the mercury stops moving, keep the bulb in the liquid and away from the glass, and read the top of the mercury at eye level.", px + 8, 120, 224, 10.5);
    H.panel(ctx, px, 194, 240, 96); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Your reading: " + c.my.toFixed(1) + " " + q.unit, px + 8, 209); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, "Set it with the slider, then press ‘Check my reading’. You score if you are within half a division of the true value. Try with the eye level and then with the eye above or below.", px + 8, 224, 224, 10.5);
  }
  function balOv(ctx, s, c, w, h, S, px) {
    const m = balMass(s, c), shown = s.tared ? fmtBal(s.sample, c.res) : fmtBal(m, c.res), p = S.proj(V3(0.4, 0.3, 1.1)); const bw = 100, bh = 34; ctx.fillStyle = "#06150c"; ctx.fillRect(p.x - bw / 2, p.y - bh / 2 + 6, bw, bh); ctx.fillStyle = "#6bff9a"; ctx.font = "700 20px 'IBM Plex Mono',monospace"; ctx.textAlign = "right"; ctx.fillText(shown, p.x + bw / 2 - 22, p.y + bh / 2 - 6); ctx.font = "700 11px 'IBM Plex Mono',monospace"; ctx.fillText("g", p.x + bw / 2 - 6, p.y + bh / 2 - 6); ctx.textAlign = "left";
    H.pill(ctx, 10, 66, s.tared ? "tared: beaker mass subtracted; sample = " + shown + " g" : "not tared: beaker + sample = " + shown + " g", "#bcd0ea", 9.5);
    H.panel(ctx, px, 58, 240, 120); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Precision and significant figures", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("display: " + shown + " g", px + 8, 89); ctx.fillText("significant figures: " + sf(shown), px + 8, 103); ctx.fillText("uncertainty: ±" + c.res + " g", px + 8, 117); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, "Write down every digit shown. A balance reading 12.35 g is uncertain in the last digit.", px + 8, 134, 224, 10.5);
    H.panel(ctx, px, 184, 240, 100); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; wrapT(ctx, "Change the resolution: 0.1 g, 0.01 g or 0.001 g. A finer balance gives more significant figures. Use ‘Tare’ so the beaker is not included, then add a new sample.", px + 8, 200, 224, 11);
  }
})();
