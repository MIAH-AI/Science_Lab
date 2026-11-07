/* c3d-atmosphere.js — chemistry 3D, new module: greenhouse effect, acid rain and air pollutants */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  /* measured atmospheric CO₂ (ppm, approximate annual means, Mauna Loa and ice-core record) */
  const REC = [[1900, 296], [1920, 303], [1940, 310], [1960, 317], [1970, 326], [1980, 339], [1990, 354], [2000, 369], [2010, 389], [2020, 414], [2025, 425]];
  const tau = (co2, ch4) => Math.max(0.05, 0.35 + 0.9 * Math.log(co2 / 280) + (ch4 ? 0.25 : 0));
  const Tmean = (co2, ch4) => 13.9 + 0.8 * 5.35 * Math.log(co2 / 280) + (ch4 ? 0.4 : 0);          // simple climate-sensitivity model: ΔT = λ·ΔF, ΔF = 5.35 ln(C/C₀) W/m²
  const rainH = (so2, scrub) => 10 ** -5.6 + 3.0e-5 * ((so2 * (scrub ? 0.05 : 1)) / 50);
  const POLL = [
    ["CO", "carbon monoxide", "incomplete combustion of fuels (car engines, fires)", "binds to haemoglobin: poisonous", "catalytic converters, good ventilation"],
    ["CO₂ / CH₄", "carbon dioxide, methane", "burning fossil fuels, deforestation; decay, cattle, rice fields", "greenhouse gases: global warming", "renewable energy, planting trees"],
    ["SO₂", "sulphur dioxide", "burning sulphur-containing coal/oil; smelting sulphide ores", "acid rain; irritates lungs", "flue-gas scrubbers (CaO/CaCO₃), low-sulphur fuel"],
    ["NO / NO₂", "oxides of nitrogen", "hot car engines (N₂ + O₂ at high T); lightning", "acid rain; smog; breathing problems", "catalytic converters"],
    ["CFCs", "chlorofluorocarbons", "old fridges, aerosols, solvents", "destroy the ozone layer (more UV)", "banned (Montreal Protocol); use substitutes"],
    ["Smoke / dust", "particulates", "burning wood and waste; quarries", "lung disease; reduces visibility", "filters, electrostatic precipitators"],
    ["Pb compounds", "lead", "leaded petrol, lead smelters", "damages the nervous system", "unleaded petrol"],
  ];

  C3.scenes.airPollution = {
    env: "studio", envOpts: { top: "#0b1a38", bottom: "#050810" }, envI: 0.8, fov: 38, free: true, cam: [[2.2, 3.8, 18.5], [2.6, 2.6, 0]],
    values: { mode: "gh", co2: 420, ch4: 0, so2: 40, scrub: 0 },
    state: () => ({ t: 0, pr: [], acc: 0, back: 0, esc: 0, made: 0, yr: 0, eros: 0, snd: 0, parts: [], drops: [] }),
    controls: [
      { type: "select", key: "mode", label: "Topic", options: [{ value: "gh", label: "Greenhouse effect and global warming" }, { value: "acid", label: "Acid rain (SO₂ and NOₓ)" }] },
      { type: "range", key: "co2", label: "Atmospheric CO₂ concentration (ppm)", min: 200, max: 1000, step: 5, unit: " ppm" },
      { type: "toggle", key: "ch4", label: "Add methane, CH₄ (another greenhouse gas)" },
      { type: "range", key: "so2", label: "SO₂ released by the factory (ppb in the air)", min: 0, max: 100, step: 1, unit: " ppb" },
      { type: "toggle", key: "scrub", label: "Fit a flue-gas scrubber (CaO removes SO₂)" },
      { type: "button", label: "Restore the statue and tree", action: (S, s) => { s.eros = 0; } },
    ],
    views: [{ label: "Scene", cam: [[2.2, 3.8, 18.5], [2.6, 2.6, 0]] }, { label: "Close up", cam: [[-1, 2.8, 10], [0.5, 2.4, 0]] }],
    note: "Greenhouse gases (CO₂, CH₄, water vapour, N₂O) let short-wave sunlight through but absorb the infrared that the warm Earth radiates, sending some of it back down. More greenhouse gas → more heat trapped → higher average temperature (here ΔT = λ·ΔF with ΔF = 5.35 ln(C/280) W/m² — a simple model, not a forecast). Acid rain: SO₂ and NOₓ dissolve in cloud water to make H₂SO₄/HNO₃ (pH < 5.6, the natural value set by dissolved CO₂). It attacks limestone and marble (CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂), harms plants and acidifies lakes.",
    onChange() {},
    reset(S, s, c) { Object.assign(c, { mode: "gh", co2: 420, ch4: 0, so2: 40, scrub: 0 }); s.eros = 0; },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Pollutant</th><th style="text-align:left">Main source</th><th style="text-align:left">Harm</th><th style="text-align:left">Control</th></tr>' + POLL.map((r) => '<tr><td style="text-align:left">' + r[0] + '</td><td style="text-align:left">' + r[2] + '</td><td style="text-align:left">' + r[3] + '</td><td style="text-align:left">' + r[4] + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) {
      const sg = (g) => { g.visible = false; S.scene.add(g); return g; }; s.gg = sg(new T.Group()); s.ga = sg(new T.Group());
      const ground = new T.Mesh(new T.BoxGeometry(14, 0.5, 4), new T.MeshStandardMaterial({ color: 0x2f6a3a, roughness: 0.9 })); ground.position.y = -0.15; S.scene.add(ground);
      const sea = new T.Mesh(new T.BoxGeometry(5, 0.52, 3.6), new T.MeshStandardMaterial({ color: 0x1f5fb0, roughness: 0.15, metalness: 0.1 })); sea.position.set(-3.2, -0.14, 0); S.scene.add(sea);
      /* greenhouse view */
      const sun = S.mk.soft(0xffd27a, 3.6, -5.6, 6.3, 0, 1); S.scene.remove(sun); s.gg.add(sun); const sunB = new T.Mesh(new T.SphereGeometry(0.55, 32, 24), new T.MeshBasicMaterial({ color: 0xffe08a })); sunB.position.set(-5.6, 6.3, 0); s.gg.add(sunB);
      s.band = new T.Mesh(new T.BoxGeometry(14, 0.8, 3.8), new T.MeshBasicMaterial({ color: 0x59a8ff, transparent: true, opacity: 0.14, depthWrite: false })); s.band.position.y = 2.4; s.gg.add(s.band);
      s.gasI = new T.InstancedMesh(new T.SphereGeometry(0.04, 8, 6), new T.MeshBasicMaterial({ color: 0xdfe9ff }), 220); s.gasI.frustumCulled = false; s.gg.add(s.gasI); s.gm = []; for (let i = 0; i < 220; i++) s.gm.push({ x: (Math.random() - 0.5) * 13, y: 2.05 + Math.random() * 0.7, z: (Math.random() - 0.5) * 1.8, ph: Math.random() * 6.28 });
      s.ray = new T.InstancedMesh(new T.SphereGeometry(0.075, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }), 140); s.ray.frustumCulled = false; s.gg.add(s.ray); for (let i = 0; i < 140; i++) s.pr.push({ on: false });
      s.therm = new T.Group(); const tube = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.6, 14), new T.MeshStandardMaterial({ color: 0xf2f5fa, roughness: 0.2 })); tube.position.y = 0.8; s.therm.add(tube); s.thf = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1, 12), new T.MeshBasicMaterial({ color: 0xff2a2a })); s.therm.add(s.thf); s.therm.position.set(3.4, 0, 1.2); s.gg.add(s.therm);
      /* acid-rain view */
      const ga = s.ga; const fac = new T.Mesh(new T.BoxGeometry(1.8, 1.1, 1.2), M.paint(0x6a7480)); fac.position.set(-5.2, 0.55, 0); ga.add(fac); const ch = new T.Mesh(new T.CylinderGeometry(0.16, 0.22, 2.4, 20), M.paint(0x8a3a2a)); ch.position.set(-5.5, 2.0, 0); ga.add(ch);
      s.cloud = []; for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.SphereGeometry(0.55 + Math.random() * 0.35, 16, 12), new T.MeshStandardMaterial({ color: 0xe8edf5, roughness: 1, transparent: true, opacity: 0.9 })); m.position.set(-0.8 + i * 0.42 + Math.random() * 0.2, 4.7 + Math.random() * 0.3, (Math.random() - 0.5) * 0.7); ga.add(m); s.cloud.push(m); }
      s.smoke = new T.InstancedMesh(new T.SphereGeometry(0.08, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }), 90); s.smoke.frustumCulled = false; ga.add(s.smoke); s.sm = []; for (let i = 0; i < 90; i++) s.sm.push({ u: Math.random(), z: (Math.random() - 0.5) * 0.4, ph: Math.random() * 6.28 });
      s.rainI = new T.InstancedMesh(new T.SphereGeometry(0.035, 8, 6), new T.MeshBasicMaterial({ color: 0xbfe0ff }), 150); s.rainI.frustumCulled = false; ga.add(s.rainI); s.rm = []; for (let i = 0; i < 150; i++) s.rm.push({ x: 0.3 + Math.random() * 5.2, y: Math.random() * 4.3, z: (Math.random() - 0.5) * 1.4, v: 2.2 + Math.random() });
      s.stat = new T.Mesh(new T.BoxGeometry(0.9, 1.3, 0.7), new T.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.45 })); s.stat.position.set(4.2, 0.65, 0.2); ga.add(s.stat); s.head = new T.Mesh(new T.SphereGeometry(0.3, 20, 16), s.stat.material); s.head.position.set(4.2, 1.5, 0.2); ga.add(s.head);
      s.trunk = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.8, 10), new T.MeshStandardMaterial({ color: 0x6b4a2c })); s.trunk.position.set(2.2, 0.4, 0.4); ga.add(s.trunk); s.leaf = new T.Mesh(new T.ConeGeometry(0.55, 1.2, 16), new T.MeshStandardMaterial({ color: 0x2f9a45, roughness: 0.8 })); s.leaf.position.set(2.2, 1.3, 0.4); ga.add(s.leaf);
      s.lake = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 0.03, 36), new T.MeshStandardMaterial({ color: 0x2a78d0, roughness: 0.1, metalness: 0.1 })); s.lake.position.set(0.6, 0.12, 0.7); ga.add(s.lake);
      s.m4 = new T.Matrix4(); s.cl = new T.Color();
    },
    update(S, s, c, dt) {
      const gh = c.mode === "gh"; s.gg.visible = gh; s.ga.visible = !gh;
      if (gh) {
        const g = 1 - Math.exp(-tau(c.co2, c.ch4)), alb = 0.3; if (dt > 0) { s.acc += dt * 5.0; while (s.acc >= 1) { s.acc -= 1; const p = s.pr.find((q) => !q.on); if (!p) break; Object.assign(p, { on: true, k: 0, x: (Math.random() - 0.5) * 8 - 1.5, y: 6.0, z: (Math.random() - 0.5) * 1.5, vx: 0.9, vy: -2.4, alb: Math.random() < alb, crossed: false }); } }
        s.pr.forEach((p, i) => { if (!p.on) { s.m4.makeScale(0, 0, 0); s.ray.setMatrixAt(i, s.m4); return; }
          if (dt > 0) {
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.k === 0 && p.alb && p.y < 3.3) { p.k = 1; p.vx = -0.9; p.vy = 2.4; }                      // reflected sunlight (albedo)
            else if (p.k === 0 && p.y <= 0.1) { p.k = 2; p.vx = (Math.random() - 0.5) * 0.4; p.vy = 1.7; s.made++; }   // absorbed → infrared
            else if (p.k === 2 && p.vy > 0 && p.y >= 2.0 && !p.crossed) { p.crossed = true; if (Math.random() < g) { if (Math.random() < 0.5) { p.vy = -1.7; p.vx = (Math.random() - 0.5) * 0.9; p.back = true; s.back++; } else { p.vx = (Math.random() - 0.5) * 0.9; } } }
            else if (p.k === 2 && p.vy < 0 && p.y <= 0.1) { p.vy = 1.7; p.crossed = false; }
            if (p.k === 2 && p.y > 6.2) { p.on = false; s.esc++; } if (p.y > 6.6 || p.x > 8.5 || p.x < -8.5 || (p.k === 1 && p.y > 6.2)) p.on = false;
          }
          s.m4.makeTranslation(p.x, p.y, p.z); s.ray.setMatrixAt(i, s.m4); s.cl.setHex(p.k === 2 ? (p.back ? 0xff3a1a : 0xff7a3a) : p.k === 1 ? 0xfff3c0 : 0xffe05a); s.ray.setColorAt(i, s.cl); });
        s.ray.instanceMatrix.needsUpdate = true; s.ray.instanceColor && (s.ray.instanceColor.needsUpdate = true);
        const nG = Math.floor(220 * clamp(g / 0.9, 0, 1)); s.gm.forEach((q, i) => { if (i >= nG) { s.m4.makeScale(0, 0, 0); s.gasI.setMatrixAt(i, s.m4); return; } s.m4.makeTranslation(q.x + Math.sin(S.t + q.ph) * 0.1, q.y + Math.cos(S.t * 0.8 + q.ph) * 0.05, q.z); s.gasI.setMatrixAt(i, s.m4); }); s.gasI.instanceMatrix.needsUpdate = true;
        s.band.material.opacity = 0.08 + 0.2 * g; const Tm = Tmean(c.co2, c.ch4); const f = clamp((Tm - 8) / 14, 0.1, 1); s.thf.scale.y = 1.4 * f; s.thf.position.y = 0.1 + 0.7 * f; s.Tm = Tm; s.g = g;
      } else {
        const hH = rainH(c.so2, c.scrub), pH = -Math.log10(hH), rate = c.so2 * (c.scrub ? 0.05 : 1) / 100; s.pH = pH;
        s.sm.forEach((q, i) => { q.u = (q.u + dt * 0.12) % 1; const x = lerp(-5.5, 0.5, q.u), y = 3.2 + 0.0 + (q.u < 0.2 ? (q.u / 0.2) * 1.0 : 1.0) * 1.0 + q.u * 1.4; const on = i < 90 * clamp(0.15 + c.so2 / 100, 0, 1) * (c.scrub ? 0.4 : 1); if (!on) { s.m4.makeScale(0, 0, 0); s.smoke.setMatrixAt(i, s.m4); return; } s.m4.makeTranslation(x, 3.2 + q.u * 1.5 + Math.sin(q.ph + S.t) * 0.1 - (1 - Math.min(1, q.u * 4)) * 0.8, q.z); s.smoke.setMatrixAt(i, s.m4); s.cl.setHex(c.scrub ? 0xd0d6e0 : 0xb6a85a); s.smoke.setColorAt(i, s.cl); }); s.smoke.instanceMatrix.needsUpdate = true; s.smoke.instanceColor && (s.smoke.instanceColor.needsUpdate = true);
        s.rm.forEach((q, i) => { if (dt > 0) { q.y -= q.v * dt; if (q.y < 0.15) { q.y = 4.4; q.x = -0.2 + Math.random() * 5.8; } } s.m4.makeTranslation(q.x, q.y, q.z); s.rainI.setMatrixAt(i, s.m4); s.cl.setHex(pH > 5 ? 0xbfe0ff : pH > 4.5 ? 0xcfe8b0 : 0xe8e07a); s.rainI.setColorAt(i, s.cl); }); s.rainI.instanceMatrix.needsUpdate = true; s.rainI.instanceColor && (s.rainI.instanceColor.needsUpdate = true);
        const dirt = clamp(rate * 0.9 + (c.so2 > 0 ? 0.1 : 0), 0, 1); s.cloud.forEach((m) => m.material.color.setRGB(lerp(0.91, 0.5, dirt * 0.7), lerp(0.93, 0.46, dirt * 0.7), lerp(0.96, 0.4, dirt * 0.7)));
        if (dt > 0) s.eros = clamp(s.eros + (hH - 10 ** -5.6) * dt * 380, 0, 1); const e = s.eros; s.stat.scale.y = 1 - 0.18 * e; s.stat.position.y = 0.65 * s.stat.scale.y; s.head.scale.setScalar(1 - 0.3 * e); s.head.position.y = 1.5 - 0.23 * e; s.stat.material.color.setRGB(lerp(0.96, 0.72, e), lerp(0.95, 0.68, e), lerp(0.92, 0.55, e)); s.stat.material.roughness = 0.45 + e * 0.5;
        const bad = clamp((4.9 - pH) / 1.2, 0, 1) * clamp(s.eros * 2, 0, 1) + clamp((4.9 - pH) / 1.2, 0, 1) * 0.4; s.leaf.material.color.setRGB(lerp(0.18, 0.5, bad), lerp(0.6, 0.35, bad), lerp(0.27, 0.12, bad)); s.lake.material.color.setRGB(lerp(0.16, 0.45, bad * 0.8), lerp(0.47, 0.5, bad * 0.8), lerp(0.82, 0.4, bad * 0.8));
      }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save();
      if (c.mode === "gh") {
        const g = s.g, Tm = s.Tm; H.pill(ctx, 10, 22, "Greenhouse effect — CO₂ = " + c.co2 + " ppm" + (c.ch4 ? " + CH₄" : ""), "#ffe9b8", 11); H.pill(ctx, 10, 44, "mean surface temperature ≈ " + Tm.toFixed(1) + " °C  (" + (Tm - 13.9 >= 0 ? "+" : "") + (Tm - 13.9).toFixed(1) + " °C vs 280 ppm)", Tm > 15.5 ? "#ff9a7a" : "#9fe3ff", 10);
        H.pill(ctx, 10, 66, "● sunlight (short-wave)   ● infrared (long-wave)   ● IR sent back down", "#bcd0ea", 8.5);
        const gx = w - 250, gy = 58, gw = 240, gh = 140; H.graph(ctx, gx, gy, gw, gh, { series: [{ pts: REC.map(([y, p]) => [y, p]), color: "#ffd27a", width: 1.8 }], xmin: 1900, xmax: 2030, ymin: 250, ymax: 450, ticksX: 4, ticksY: 4, xl: "year", yl: "CO₂ / ppm (measured)" });
        const X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40, py = (v) => Y0 + PH - ((clamp(v, 250, 450) - 250) / 200) * PH; ctx.strokeStyle = "#ff7a5a"; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X0, py(c.co2)); ctx.lineTo(X0 + PW, py(c.co2)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#ff9a7a"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.textAlign = "right"; ctx.fillText("your setting " + c.co2, X0 + PW - 2, py(c.co2) - 3);
        const qx = w - 250; H.panel(ctx, qx, 204, 240, 82); ctx.textAlign = "left"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; ctx.fillText("IR absorbed ≈ " + (g * 100).toFixed(0) + " %", qx + 8, 220); ctx.fillText("ΔF = 5.35 ln(C/280) = " + (5.35 * Math.log(c.co2 / 280)).toFixed(2) + " W/m²", qx + 8, 234); ctx.fillStyle = "#ffd27a"; ctx.fillText("ΔT = 0.8 × ΔF ≈ " + (0.8 * 5.35 * Math.log(c.co2 / 280)).toFixed(1) + " °C", qx + 8, 248); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("simple model: trend, not a forecast", qx + 8, 268);
        const q = S.proj(V3(0, 2.9, 0)); H.pill(ctx, q.x, q.y, "greenhouse gases (CO₂, CH₄)", "#8fb4ff", 9, "center"); const q2 = S.proj(V3(3.4, 1.9, 1.2)); H.pill(ctx, q2.x, q2.y, Tm.toFixed(1) + " °C", "#ff9a9a", 9, "center"); const q3 = S.proj(V3(-5.6, 7.2, 0)); H.pill(ctx, q3.x, q3.y, "Sun", "#ffe08a", 9, "center");
      } else {
        const pH = s.pH; H.pill(ctx, 10, 22, "Acid rain — SO₂ " + c.so2 + " ppb" + (c.scrub ? " (scrubbed)" : ""), "#ffe9b8", 11); H.pill(ctx, 10, 44, "rain pH = " + pH.toFixed(1) + (pH < 5.6 ? "  (natural rain ≈ 5.6)" : "  (natural, from dissolved CO₂)"), pH < 4.8 ? "#ff9a7a" : pH < 5.4 ? "#ffd27a" : "#9fe3ff", 10);
        const lab = (x, y, t) => { const q = S.proj(V3(x, y, 0)); H.pill(ctx, q.x, q.y, t, "#bcd0ea", 8.5, "center"); }; lab(-5.3, 3.5, "factory: SO₂, NOₓ"); lab(2.6, 5.7, "cloud: H₂SO₄, HNO₃ form"); lab(4.2, 2.0, "marble statue"); lab(2.2, 2.2, "tree"); lab(0.6, 0.45, "lake");
        const px = w - 250, py = 58; H.panel(ctx, px, py, 240, 150); ctx.textAlign = "left"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Reactions", px + 8, py + 15); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; const L = ["S + O₂ → SO₂", "2SO₂ + O₂ + 2H₂O → 2H₂SO₄", "N₂ + O₂ → 2NO (hot engines)", "4NO₂ + O₂ + 2H₂O → 4HNO₃", "CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂", "SO₂ + CaO → CaSO₃  (scrubber)"]; L.forEach((t, i) => { ctx.fillStyle = i === 5 ? "#7dffbd" : "#e8f0ff"; ctx.fillText(t, px + 8, py + 32 + i * 16); }); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("[H⁺] = " + (10 ** -pH).toExponential(1) + " mol/dm³", px + 8, py + 138);
        H.panel(ctx, px, 214, 240, 60); ctx.fillStyle = "#dbe7ff"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillText("statue eroded: " + (s.eros * 100).toFixed(0) + " % of damage scale", px + 8, 232); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("leaves brown, lake turns murky as pH falls", px + 8, 248); ctx.fillText("below about 4.8", px + 8, 260);
      }
      ctx.restore();
    },
    readouts(s, c) { if (c.mode === "gh") return [["CO₂ concentration", c.co2 + " ppm (280 ppm before industry; ~425 ppm in 2025)"], ["Radiative forcing, ΔF", (5.35 * Math.log(c.co2 / 280)).toFixed(2) + " W/m²"], ["Mean surface temperature", s.Tm.toFixed(1) + " °C  (pre-industrial ≈ 13.9 °C)"], ["Fraction of IR absorbed", (s.g * 100).toFixed(0) + " %"], ["Greenhouse gases", "CO₂, CH₄, N₂O, H₂O vapour, CFCs"], ["Reduce it by", "less fossil fuel, renewable energy, forests, energy efficiency"]]; return [["SO₂ in the air", c.so2 + " ppb" + (c.scrub ? " (95 % removed by scrubber)" : "")], ["Rain pH", s.pH.toFixed(2)], ["[H⁺] in rain", (10 ** -s.pH).toExponential(2) + " mol/dm³"], ["Effects", "corrodes marble/limestone and metals, harms plants, acidifies lakes, kills fish"], ["Cure", "fit scrubbers (CaO/CaCO₃), low-sulphur fuel, catalytic converters for NOₓ"]]; },
    steps(s, c) { return c.mode === "gh" ? [["Watch yellow sunlight reach the ground and turn into red infrared", "done"], ["Raise CO₂: more infrared is absorbed and re-emitted downward", "now"], ["Read the temperature rise; compare with the measured CO₂ record", ""], ["Add methane to see another greenhouse gas at work", c.ch4 ? "done" : ""]] : [["Raise the SO₂ and watch the rain pH fall", "now"], ["See the marble erode and the tree and lake suffer", ""], ["Fit the scrubber and compare the pH", c.scrub ? "done" : ""], ["Read the reactions in the panel", ""]]; },
  };
})();
