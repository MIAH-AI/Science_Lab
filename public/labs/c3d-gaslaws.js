/* c3d-gaslaws.js — chemistry 3D, new module: gas laws (Boyle, Charles, pressure law, Avogadro) with PV = nRT */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const RG = 8.314, N0 = 0.004, P_ATM = 101.3; /* mol, kPa */
  const TUBE_H = 3.6, VMAX = 175, BASE = 0.3, RAD = 0.62, NP = 110;
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const MODES = { boyle: "Boyle's law (constant T, n)", charles: "Charles's law (constant P, n)", pressure: "Pressure law (constant V, n)", avogadro: "Avogadro's law (constant T, P)" };
  /* the state of the gas for the chosen law */
  function gas(c) {
    let n = N0, Tk = 300, V, P;
    if (c.mode === "boyle") { V = c.V; P = (n * RG * Tk) / (V * 1e-6) / 1000; }
    else if (c.mode === "charles") { Tk = c.T; P = P_ATM; V = ((n * RG * Tk) / (P * 1000)) * 1e6; }
    else if (c.mode === "pressure") { Tk = c.T; V = 80; P = (n * RG * Tk) / (V * 1e-6) / 1000; }
    else { n = c.n; Tk = 300; P = P_ATM; V = ((n * RG * Tk) / (P * 1000)) * 1e6; }
    return { n, T: Tk, V, P };
  }

  C3.scenes.gasLaws3D = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.85, fov: 36, free: true, cam: [[1.2, 2.9, 10.5], [1.5, 2.3, 0]],
    values: { mode: "boyle", V: 60, T: 300, n: 0.004 },
    state: () => ({ t: 0, Vd: 60, parts: [], hist: [], hit: 0, hitWin: [] }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Gas law", options: Object.keys(MODES).map((k) => ({ value: k, label: MODES[k] })) },
        { type: "range", key: "V", label: "Volume (cm³) — Boyle's law", min: 20, max: 120, step: 1, unit: " cm³" },
        { type: "range", key: "T", label: "Temperature (K) — Charles / pressure law", min: 200, max: 500, step: 5, unit: " K" },
        { type: "range", key: "n", label: "Amount of gas (mol) — Avogadro's law", min: 0.002, max: 0.008, step: 0.0005, unit: " mol" },
        { type: "button", label: "Reset", action: (S, s, c) => { Object.assign(c, { V: 60, T: 300, n: 0.004 }); } },
      ];
    },
    views: [{ label: "Gas syringe", cam: [[1.2, 2.9, 10.5], [1.5, 2.3, 0]] }, { label: "Close", cam: [[0.8, 2.6, 7.4], [1.1, 2.1, 0]] }],
    note: "The gas laws describe how the pressure P, volume V and temperature T of a fixed amount of gas n are linked. Boyle: P ∝ 1/V at constant T, so PV is constant. Charles: V ∝ T (in kelvin) at constant P, a straight line through the origin; extended backwards it meets V = 0 at −273 °C, absolute zero. Pressure law: P ∝ T at constant V. Avogadro: equal volumes of gases at the same T and P hold equal numbers of molecules, so V ∝ n. Together: PV = nRT with R = 8.314 J mol⁻¹ K⁻¹. In the model P is calculated from the ideal-gas equation and the particles are drawn only to show the idea: faster (hotter) particles hit the walls harder and more often, and a smaller volume means more collisions per second. Real gases deviate at high pressure and low temperature.",
    onChange(S, s, c, key) { s.hist = []; },
    reset(S, s, c) { Object.assign(c, { mode: "boyle", V: 60, T: 300, n: 0.004 }); s.Vd = 60; },
    table(s, c) {
      const g = gas(c); return '<table class="c3-table"><tr><th style="text-align:left">Law</th><th style="text-align:left">Constant</th><th style="text-align:left">Relation</th><th style="text-align:left">Graph</th></tr><tr><td style="text-align:left">Boyle</td><td style="text-align:left">T, n</td><td style="text-align:left">P₁V₁ = P₂V₂</td><td style="text-align:left">P vs 1/V straight line</td></tr><tr><td style="text-align:left">Charles</td><td style="text-align:left">P, n</td><td style="text-align:left">V₁/T₁ = V₂/T₂</td><td style="text-align:left">V vs T line through 0 K</td></tr><tr><td style="text-align:left">Pressure law</td><td style="text-align:left">V, n</td><td style="text-align:left">P₁/T₁ = P₂/T₂</td><td style="text-align:left">P vs T line through 0 K</td></tr><tr><td style="text-align:left">Avogadro</td><td style="text-align:left">T, P</td><td style="text-align:left">V₁/n₁ = V₂/n₂</td><td style="text-align:left">V vs n line through 0</td></tr></table><div style="font:12px/1.5 IBM Plex Mono;color:#7dffbd">PV = nRT → ' + g.P.toFixed(1) + ' kPa × ' + g.V.toFixed(1) + ' cm³ = ' + g.n.toFixed(4) + ' mol × 8.314 × ' + g.T.toFixed(0) + ' K</div>';
    },
    build(S, s, c) {
      const K = C3.kit(S); S.mk.box(9, 0.1, 4, M.matte(0x1d222b, 0.7), 1.2, -0.05, 0);
            s.base = new T.Mesh(new T.CylinderGeometry(0.95, 1.02, 0.3, 40), M.steel()); s.base.position.set(0, 0.15, 0); S.scene.add(s.base);
      s.plate = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.04, 40), new T.MeshStandardMaterial({ color: 0x331a10, emissive: 0xff5a1a, emissiveIntensity: 0, roughness: 0.6 })); s.plate.position.set(0, 0.32, 0); S.scene.add(s.plate);
      s.tube = new T.Mesh(new T.CylinderGeometry(0.72, 0.72, TUBE_H, 40, 1, true), K.glassMat({ opacity: 0.1 })); s.tube.position.set(0, BASE + TUBE_H / 2, 0); s.tube.renderOrder = 4; S.scene.add(s.tube);
      /* graduations */
      for (let v = 0; v <= 120; v += 20) { const y = BASE + (v / VMAX) * TUBE_H; S.mk.box(0.18, 0.012, 0.012, M.matte(0xcfe0f5, 0.5), 0.76, y, 0.0); }
      s.pg = new T.Group(); S.scene.add(s.pg);
      const disk = new T.Mesh(new T.CylinderGeometry(0.71, 0.71, 0.14, 40), M.rubber()); s.pg.add(disk); const rod = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.8, 12), M.steel()); rod.position.y = 0.45; s.pg.add(rod); const knob = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.1, 24), M.steel()); knob.position.y = 0.9; s.pg.add(knob);
      s.mass = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.28, 24), M.brass()); s.mass.position.y = 0.3; s.pg.add(s.mass);
      s.pins = new T.Group(); [-1, 1].forEach((d) => { const pn = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.9, 8), new T.MeshStandardMaterial({ color: 0xd24a3a, roughness: 0.4 })); pn.rotation.z = Math.PI / 2; pn.position.set(0, 0, d * 0.0); s.pins.add(pn); }); s.pins.children[1].visible = false; S.scene.add(s.pins);
      s.flame = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(64, "rgba(255,170,70,1)"), color: 0xffa040, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); s.flame.scale.set(2.2, 0.7, 1); s.flame.position.set(0, 0.35, 0); S.scene.add(s.flame);
      s.ice = new T.Mesh(new T.BoxGeometry(2.1, 0.24, 1.7), new T.MeshPhysicalMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.0, roughness: 0.1 })); s.ice.position.set(0, 0.12, 0); S.scene.add(s.ice);
      s.inst = new T.InstancedMesh(new T.SphereGeometry(0.075, 12, 8), new T.MeshStandardMaterial({ color: 0x7cc4ff, roughness: 0.3 }), NP); s.inst.frustumCulled = false; S.scene.add(s.inst); s.m4 = new T.Matrix4();
      s.parts = []; for (let i = 0; i < NP; i++) s.parts.push({ x: (Math.random() * 2 - 1) * 0.45, y: Math.random(), z: (Math.random() * 2 - 1) * 0.45, vx: gauss(), vy: gauss(), vz: gauss() });
      S.scene.add(s.pg);
    },
    update(S, s, c, dt) {
      const g = gas(c); s.g = g; s.Vd += (g.V - s.Vd) * Math.min(1, dt * 5); const V = s.Vd, pyTop = BASE + (V / VMAX) * TUBE_H; s.pg.position.y = pyTop; s.pyTop = pyTop;
      s.mass.visible = c.mode === "charles" || c.mode === "avogadro"; s.pins.children[0].visible = c.mode === "pressure"; s.pins.children[0].position.y = BASE + (80 / VMAX) * TUBE_H + 0.22; s.pins.visible = c.mode === "pressure";
      const hot = clamp((g.T - 300) / 200, 0, 1), cold = clamp((300 - g.T) / 100, 0, 1); s.plate.material.emissiveIntensity = hot * 1.6; s.flame.material.opacity = hot * 0.85; s.ice.material.opacity = cold * 0.55; s.ice.visible = c.mode !== "boyle" && c.mode !== "avogadro" ? true : false;
      const nShow = Math.round(NP * (g.n / 0.008) * 0.9 + 10), sp = 1.6 * Math.sqrt(g.T / 300), yLo = BASE + 0.12, yHi = pyTop - 0.12, d = Math.min(dt, 0.04);
      let hits = 0; const cr = RAD;
      for (let i = 0; i < nShow; i++) { const q = s.parts[i]; if (q.init == null) { q.init = 1; q.y = yLo + Math.random() * Math.max(0.1, yHi - yLo); q.vx = gauss() * 0.6; q.vy = gauss() * 0.6; q.vz = gauss() * 0.6; } const k = sp * 0.6; q.x += q.vx * k * d; q.y += q.vy * k * d; q.z += q.vz * k * d;
        if (q.y > yHi) { q.y = yHi; q.vy = -Math.abs(q.vy); hits++; } if (q.y < yLo) { q.y = yLo; q.vy = Math.abs(q.vy); }
        const r2 = q.x * q.x + q.z * q.z; if (r2 > cr * cr) { const r = Math.sqrt(r2), nx = q.x / r, nz = q.z / r, dv = q.vx * nx + q.vz * nz; if (dv > 0) { q.vx -= 2 * dv * nx; q.vz -= 2 * dv * nz; } q.x = nx * cr; q.z = nz * cr; }
        /* keep speeds tied to T */ const sd = Math.hypot(q.vx, q.vy, q.vz); if (sd < 0.25) { q.vx *= 2; q.vy *= 2; q.vz *= 2; } else if (sd > 2.4) { q.vx *= 0.7; q.vy *= 0.7; q.vz *= 0.7; } }
      s.inst.count = nShow; const m4 = s.m4; for (let i = 0; i < nShow; i++) { const q = s.parts[i]; m4.makeTranslation(q.x, q.y, q.z); s.inst.setMatrixAt(i, m4); } s.inst.instanceMatrix.needsUpdate = true;
      s.inst.material.color.setHSL(0.58 - hot * 0.55 + cold * 0.02, 0.9, 0.62);
      s.hitWin.push([S.t, hits]); while (s.hitWin.length && s.hitWin[0][0] < S.t - 1) s.hitWin.shift(); s.hitRate = s.hitWin.reduce((a, e) => a + e[1], 0);
    },
    overlay(ctx, s, c, w, h, S) {
      const g = s.g || gas(c); ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      H.pill(ctx, 10, 22, MODES[c.mode], "#ffe9b8", 11); H.pill(ctx, 10, 44, "PV = nRT   (R = 8.314 J mol⁻¹ K⁻¹)", "#9fe3ff", 9.5);
      /* pressure gauge */
      const gx = 64, gy = 132, gr = 46; ctx.fillStyle = "rgba(10,16,28,0.88)"; ctx.beginPath(); ctx.arc(gx, gy, gr + 6, 0, 7); ctx.fill(); ctx.strokeStyle = "#9fb2d2"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(gx, gy, gr + 6, 0, 7); ctx.stroke();
      ctx.font = "7px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; for (let k = 0; k <= 6; k++) { const a = Math.PI * 0.8 + (k / 6) * Math.PI * 1.4, x1 = gx + Math.cos(a) * (gr - 4), y1 = gy + Math.sin(a) * (gr - 4), x2 = gx + Math.cos(a) * (gr + 1), y2 = gy + Math.sin(a) * (gr + 1); ctx.strokeStyle = "#cfe0f5"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.fillStyle = "#9fb2d2"; ctx.fillText(String(k * 100), gx + Math.cos(a) * (gr - 13), gy + Math.sin(a) * (gr - 13) + 2); }
      const pa = Math.PI * 0.8 + clamp(g.P / 600, 0, 1) * Math.PI * 1.4; ctx.strokeStyle = "#ff6a5a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(pa) * (gr - 6), gy + Math.sin(pa) * (gr - 6)); ctx.stroke(); ctx.fillStyle = "#ffe9b8"; ctx.beginPath(); ctx.arc(gx, gy, 3, 0, 7); ctx.fill(); ctx.fillStyle = "#e8f0ff"; ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.fillText(g.P.toFixed(0) + " kPa", gx, gy + 24); ctx.font = "7.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb2d2"; ctx.fillText("pressure gauge", gx, gy + 62); ctx.textAlign = "left";
      /* tube labels */
      const q1 = S.proj(V3(0.0, s.pyTop + 0.2, 0.9)); H.pill(ctx, q1.x + 40, q1.y - 6, "V = " + g.V.toFixed(0) + " cm³", "#bfe6ff", 9.5);
      const q2 = S.proj(V3(0.0, 0.0, 1.2)); H.pill(ctx, q2.x, q2.y + 14, "T = " + g.T.toFixed(0) + " K  (" + (g.T - 273.15).toFixed(0) + " °C)", g.T > 320 ? "#ffb48a" : g.T < 280 ? "#a9ddff" : "#cfe0f5", 9.5, "center");
      let lock = c.mode === "boyle" ? "water bath keeps T = 300 K: change V" : c.mode === "charles" ? "piston free under a fixed weight: P stays 101.3 kPa" : c.mode === "pressure" ? "piston pinned: V stays 80 cm³" : "same T and P: more gas pushes the piston up";
      H.pill(ctx, 10, 262, lock, "#8dffb8", 8.5);
      /* graph */
      let pts = [], xmin = 0, xmax, ymax, xl, yl, dot, dash = null;
      if (c.mode === "boyle") { xmin = 20; xmax = 120; ymax = 520; xl = "V / cm³"; yl = "P / kPa"; for (let v = 20; v <= 120; v += 2) pts.push([v, (N0 * RG * 300) / (v * 1e-6) / 1000]); dot = [g.V, g.P, "#ffd27a"]; }
      else if (c.mode === "charles") { xmax = 500; ymax = 200; xl = "T / K"; yl = "V / cm³"; for (let t = 0; t <= 500; t += 10) pts.push([t, ((N0 * RG * t) / (P_ATM * 1000)) * 1e6]); dot = [g.T, g.V, "#ffd27a"]; }
      else if (c.mode === "pressure") { xmax = 500; ymax = 600; xl = "T / K"; yl = "P / kPa"; for (let t = 0; t <= 500; t += 10) pts.push([t, (N0 * RG * t) / (80e-6) / 1000]); dot = [g.T, g.P, "#ffd27a"]; }
      else { xmax = 0.01; ymax = 260; xl = "n / mol"; yl = "V / cm³"; for (let n = 0; n <= 0.01; n += 0.0005) pts.push([n, ((n * RG * 300) / (P_ATM * 1000)) * 1e6]); dot = [g.n, g.V, "#ffd27a"]; }
      H.graph(ctx, px, 58, 240, 130, { series: [{ pts, color: "#7cc4ff", width: 2 }], xmin, xmax, ymin: 0, ymax, ticksX: 4, ticksY: 3, xl, yl, dot });
      H.panel(ctx, px, 194, 240, 110); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("PV = nRT", px + 8, 209); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff";
      ctx.fillText("P = " + g.P.toFixed(1) + " kPa   V = " + g.V.toFixed(1) + " cm³", px + 8, 224); ctx.fillText("n = " + g.n.toFixed(4) + " mol   T = " + g.T.toFixed(0) + " K", px + 8, 238);
      ctx.fillStyle = "#8dffb8"; const lab = c.mode === "boyle" ? "PV = " + (g.P * g.V).toFixed(0) + " kPa·cm³ (constant)" : c.mode === "charles" ? "V/T = " + (g.V / g.T).toFixed(3) + " cm³/K (constant)" : c.mode === "pressure" ? "P/T = " + (g.P / g.T).toFixed(3) + " kPa/K (constant)" : "V/n = " + (g.V / g.n).toFixed(0) + " cm³/mol (constant)"; ctx.fillText(lab, px + 8, 254);
      ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; wrapT(ctx, c.mode === "boyle" ? "Halve the volume and the pressure doubles: particles hit the wall twice as often." : c.mode === "charles" ? "Hotter particles push the piston up until the pressure inside equals the weight." : c.mode === "pressure" ? "Hotter particles hit the fixed walls harder and more often." : "More particles in the same T and P need more room.", px + 8, 270, 224, 10);
      ctx.restore();
    },
    readouts(s, c) { const g = s.g || gas(c); return [["Pressure P", g.P.toFixed(1) + " kPa"], ["Volume V", g.V.toFixed(1) + " cm³ (" + (g.V / 1000).toFixed(4) + " dm³)"], ["Temperature T", g.T.toFixed(0) + " K = " + (g.T - 273.15).toFixed(0) + " °C"], ["Amount of gas n", g.n.toFixed(4) + " mol  (" + (g.n * 6.022e23).toExponential(2) + " molecules)"], ["PV / nT", ((g.P * 1000 * g.V * 1e-6) / (g.n * g.T)).toFixed(3) + " J mol⁻¹ K⁻¹ (= R)"], ["Wall hits per second (model)", String(s.hitRate || 0)]]; },
    steps(s, c) { return [["Choose a gas law and see which quantity is held constant", "done"], ["Change the variable control and watch the graph dot move", "now"], ["Check the constant quantity in the panel", ""], ["Use PV = nRT with the readouts to calculate R", ""]]; },
  };
})();
