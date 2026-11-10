/* p2d-heat.js — Topics 14–16: energy conversions, world energy resources, work & power, wheel/screw/gears,
   thermometers & scales, anomalous expansion of water, land/sea breezes & vacuum flask, general gas law,
   specific heat capacity, specific latent heat, evaporation, saturated vapour pressure & boiling, wet/dry-bulb hygrometer. */
window.PX.push(function () {
  const K = window.PK, C = K.C, { txt, line, rect, circ, arr, panel, notes, axes, plot, f, clamp, rad } = K;

  /* ---------- T14 Energy conversions (Sankey) ---------- */
  const DEV = [["Hydro-electric station", "gravitational P.E. of water", [["Electrical", 85], ["Heat & sound (turbine, friction)", 15]], ["P.E. → K.E. of water → K.E. of turbine → electrical"]], ["Car engine", "chemical (petrol)", [["Kinetic", 25], ["Heat (exhaust, radiator)", 65], ["Sound", 10]], ["chemical → heat → kinetic"]], ["Solar cell", "light (solar)", [["Electrical", 20], ["Heat", 80]], ["light → electrical"]], ["Torch (dry cell + bulb)", "chemical (cell)", [["Light", 10], ["Heat", 90]], ["chemical → electrical → light + heat"]], ["Loudspeaker", "electrical", [["Sound", 5], ["Heat", 95]], ["electrical → kinetic (cone) → sound"]], ["Nuclear power station", "nuclear", [["Electrical", 33], ["Heat (cooling towers)", 67]], ["nuclear → heat → K.E. of steam/turbine → electrical"]], ["LED lamp", "electrical", [["Light", 40], ["Heat", 60]], ["electrical → light"]]];
  K.add("14", {
    modeName: "Energy Conversions (Sankey Diagram)", tag: "FORMS OF ENERGY", eqn: "Energy is converted from one form to another; total output (useful + wasted) = input. Efficiency = useful output ÷ input × 100 %",
    controls: [K.sel("d", "Device", DEV.map((x) => x[0]), 0), K.rng("E", "Energy input", 100, 1000, 50, 500, " J")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const [nm, inp, outs, chain] = DEV[c.d], x0 = 40, y0 = 120, H = 140, xs = 230; rect(ctx, x0, y0, xs - x0, H, "rgba(255,183,3,.35)"); txt(ctx, x0 + 8, y0 - 8, "Input: " + c.E + " J of " + inp, C.amber, 12, "left", true);
      let yy = 40; outs.forEach(([o, p], i) => { const h = (H * p) / 100, useful = i === 0, col = useful ? "rgba(127,227,218,.55)" : "rgba(239,122,109,.45)"; const ty = y0 + outs.slice(0, i).reduce((a, q) => a + (H * q[1]) / 100, 0); const ey = useful ? yy : yy + 40 * i; ctx.save(); ctx.beginPath(); ctx.moveTo(xs, ty); ctx.bezierCurveTo(xs + 90, ty, xs + 90, ey, xs + 180, ey); ctx.lineTo(xs + 180, ey + h); ctx.bezierCurveTo(xs + 90, ey + h, xs + 90, ty + h, xs, ty + h); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.restore(); txt(ctx, xs + 186, ey + h / 2, o.split(" (")[0], useful ? C.teal : C.red, 11, "left", useful); txt(ctx, xs + 186, ey + h / 2 + 14, f((c.E * p) / 100, 0) + " J (" + p + " %)", useful ? C.teal : C.red, 10.5); yy = ey + h + 30; });
      for (let i = 0; i < 8; i++) { const u = ((s.t * 0.4 + i / 8) % 1); circ(ctx, x0 + u * (xs - x0), y0 + H / 2 + Math.sin(i * 2) * 40, 3, C.amber); }
      panel(ctx, 30, 290, 598, 80, nm); notes(ctx, 40, 326, 580, [["Chain: " + chain[0], C.chalk], "Efficiency = " + outs[0][1] + " % — the rest is mostly wasted as heat, but no energy is destroyed (conservation of energy). Forms: mechanical, heat, chemical, electrical, light, sound, nuclear."], 11);
    },
    readouts(s, c) { const [nm, , outs] = DEV[c.d]; return [["Device", nm], ["Useful output", f((c.E * outs[0][1]) / 100, 0) + " J"], ["Efficiency", outs[0][1] + " %"]]; },
  });

  /* ---------- T14 World energy resources ---------- */
  const RES = [["Oil (petroleum)", 0, 31, "Burnt for transport and power; CO₂ and pollution; will run out."], ["Coal", 0, 26, "Burnt in power stations; most polluting; large reserves."], ["Natural gas", 0, 23, "Cleaner fossil fuel; gas turbines, cooking; finite."], ["Hydro-electric", 1, 6, "Falling water drives turbines (Kainji, Akosombo dams); no fuel cost; floods valleys."], ["Nuclear", 0, 4, "Fission of uranium; no CO₂; radioactive waste; finite fuel."], ["Wind", 1, 3, "Moving air turns turbines; intermittent; noisy."], ["Solar", 1, 2.5, "Solar cells and heaters; free and clean; needs sunshine and storage."], ["Biomass (wood, dung, biofuel)", 1, 4, "Burnt or fermented; renewable if replanted; smoke; deforestation."], ["Tidal & wave", 1, 0.1, "Tides drive turbines; predictable; few suitable sites."], ["Geothermal", 1, 0.4, "Heat from hot rocks underground; reliable where available."]];
  K.add("14", {
    modeName: "World Energy Resources", tag: "RENEWABLE vs NON-RENEWABLE", eqn: "Renewable: replaced naturally as used (sun, wind, water, biomass) · Non-renewable: finite stores (fossil fuels, nuclear)",
    controls: [K.sel("r", "Resource", RES.map((x) => x[0]), 6)],
    draw(ctx, s, c) {
      const A = { x: 40, y: 40, w: 330, h: 320 }; txt(ctx, 40, 30, "Approximate share of world primary energy (%)", C.chalk, 11, "left", true);
      RES.forEach(([n, ren, p], i) => { const y = A.y + i * 31, w = (p / 32) * 260, sel = i === c.r; rect(ctx, 150, y, w, 22, ren ? (sel ? C.green : "rgba(91,214,140,.5)") : sel ? C.red : "rgba(239,122,109,.5)"); txt(ctx, 145, y + 15, n.split(" (")[0], sel ? C.chalk : C.dim, 10.5, "right", sel); txt(ctx, 154 + w, y + 15, p + "%", C.dim, 10); });
      const R = RES[c.r]; panel(ctx, 420, 30, 208, 340, R[0]); notes(ctx, 430, 70, 190, [[R[1] ? "RENEWABLE" : "NON-RENEWABLE", R[1] ? C.green : C.red], R[3], "World share ≈ " + R[2] + " % (figures approximate).", "Fossil fuels still supply about four-fifths of world energy; switching to renewables cuts CO₂ emissions and climate change."]);
    },
    readouts(s, c) { const R = RES[c.r]; return [["Resource", R[0]], ["Type", R[1] ? "renewable" : "non-renewable"], ["World share (approx)", R[2] + " %"]]; },
  });

  /* ---------- T15 Work, power and the kilowatt-hour ---------- */
  K.add("15", {
    modeName: "Work & Power — Stairs, Pulling & kWh", tag: "W = F·s·cosθ · P = W/t", eqn: "Work = force × distance moved in direction of force (J) · Power = work ÷ time (W) · 1 kWh = 3.6 × 10⁶ J",
    controls: [K.sel("m", "Situation", ["Running up stairs", "Pulling a sledge at an angle", "Electrical energy bill"], 0), K.rng("a", "Mass / force / appliance power", 10, 2000, 10, 60), K.rng("b", "Height / distance / hours per day", 1, 50, 0.5, 4), K.rng("t", "Time taken / angle / tariff ₦ per kWh", 1, 300, 1, 5)],
    reset(s) { s.u = 0; }, step(s, c, dt) { s.u = (s.u + dt * 0.3) % 1; },
    draw(ctx, s, c) {
      if (c.m === 0) { const m = c.a, h = Math.min(c.b, 20), W = m * K.g * h, P = W / c.t; for (let i = 0; i < 10; i++) rect(ctx, 60 + i * 26, 340 - i * 24, 26, 24 + i * 24, "#6a5a4a", "#3a2a1a"); const k = Math.floor(s.u * 10); circ(ctx, 73 + k * 26, 316 - k * 24 - 20, 10, C.amber); rect(ctx, 66 + k * 26, 316 - k * 24 - 10, 14, 26, "#2a6ad8");
        panel(ctx, 360, 30, 268, 340, "Stair climb"); notes(ctx, 370, 70, 250, ["Mass " + m + " kg, height " + h + " m, time " + c.t + " s", ["Work against gravity = mgh = " + m + " × 9.8 × " + h + " = " + f(W, 0) + " J", C.amber], ["Power = W ÷ t = " + f(P, 1) + " W", C.teal], "Running up quickly needs more power but the same work as walking.", "Work done = energy transferred (joule, J)."]); }
      else if (c.m === 1) { const F = Math.min(c.a, 500), d = c.b, th = Math.min(c.t, 80), W = F * d * Math.cos(rad(th)); rect(ctx, 20, 300, 320, 10, "#e8eef8"); const x = 60 + s.u * 160; rect(ctx, x, 270, 70, 30, "#a05030"); line(ctx, x + 70, 285, x + 70 + 120 * Math.cos(rad(th)), 285 - 120 * Math.sin(rad(th)), C.chalk, 1.5); arr(ctx, x + 70, 285, x + 70 + 90 * Math.cos(rad(th)), 285 - 90 * Math.sin(rad(th)), C.amber); arr(ctx, x + 70, 285, x + 70 + 90 * Math.cos(rad(th)), 285, C.teal);
        panel(ctx, 360, 30, 268, 340, "Force at an angle"); notes(ctx, 370, 70, 250, ["Pull " + F + " N at " + th + "° over " + d + " m", ["W = F·s·cosθ = " + F + " × " + d + " × cos" + th + "° = " + f(W, 0) + " J", C.amber], "Only the component along the motion does work. At 90° (carrying a load horizontally) no work is done against gravity.", "Weight does no work when the sledge moves horizontally."]); }
      else { const P = c.a, hrs = Math.min(c.b, 24), tariff = c.t, kwh = (P / 1000) * hrs * 30, cost = kwh * tariff; rect(ctx, 60, 120, 160, 140, "#e8e8ea", "#555"); rect(ctx, 80, 140, 120, 40, "#1a2a1a"); txt(ctx, 140, 168, f(kwh, 1) + " kWh", C.green, 16, "center", true); txt(ctx, 140, 230, "energy meter (month)", "#333", 10, "center");
        panel(ctx, 360, 30, 268, 340, "Electricity bill"); notes(ctx, 370, 70, 250, ["Appliance " + P + " W used " + hrs + " h/day for 30 days", ["Energy = P × t = " + P / 1000 + " kW × " + hrs * 30 + " h = " + f(kwh, 1) + " kWh", C.amber], ["Cost = " + f(kwh, 1) + " × ₦" + tariff + " = ₦" + f(cost, 0), C.teal], "1 kWh = 1000 W × 3600 s = 3.6 × 10⁶ J.", "Save energy: switch off, use LED lamps, efficient appliances."]); }
    },
    readouts(s, c) { if (c.m === 0) { const W = c.a * K.g * Math.min(c.b, 20); return [["Work", f(W, 0) + " J"], ["Power", f(W / c.t, 1) + " W"], ["Unit", "J, W"]]; } if (c.m === 1) { const W = Math.min(c.a, 500) * c.b * Math.cos(rad(Math.min(c.t, 80))); return [["Work done", f(W, 0) + " J"], ["Angle", Math.min(c.t, 80) + "°"], ["Unit", "joule"]]; } const kwh = (c.a / 1000) * Math.min(c.b, 24) * 30; return [["Energy", f(kwh, 1) + " kWh"], ["In joules", K.sci(kwh * 3.6e6) + " J"], ["Cost", "₦" + f(kwh * c.t, 0)]]; },
  });

  /* ---------- T15 Wheel and axle, screw jack, gears ---------- */
  K.add("15", {
    modeName: "Wheel & Axle, Screw Jack and Gears", tag: "V.R. · M.A. · EFFICIENCY", eqn: "V.R. = distance moved by effort ÷ distance moved by load · M.A. = load ÷ effort · efficiency = M.A./V.R. × 100 %",
    controls: [K.sel("m", "Machine", ["Wheel and axle", "Screw jack", "Gear train"], 0), K.rng("p1", "Wheel radius / handle length / driver teeth", 5, 60, 1, 30), K.rng("p2", "Axle radius / pitch (mm) / driven teeth", 1, 60, 1, 6), K.rng("L", "Load", 100, 5000, 50, 1000, " N"), K.rng("eff", "Efficiency", 30, 100, 1, 70, " %")],
    reset(s) { s.a = 0; }, step(s, c, dt) { s.a += dt; },
    vr(c) { return c.m === 0 ? c.p1 / Math.max(1, c.p2) : c.m === 1 ? (K.TAU * c.p1 * 10) / Math.max(1, c.p2) : c.p2 / Math.max(1, c.p1); },
    draw(ctx, s, c) {
      const VR = this.vr(c), MA = (VR * c.eff) / 100, E = c.L / MA, a = s.a;
      if (c.m === 0) { const R = 40 + c.p1 * 1.6, r = 8 + c.p2 * 1.6, cx = 180, cy = 170; circ(ctx, cx, cy, R, null, "#888", 6); circ(ctx, cx, cy, r, "#555", "#999", 3); for (let k = 0; k < 6; k++) line(ctx, cx, cy, cx + R * Math.cos(a + k), cy + R * Math.sin(a + k), "#666", 2); line(ctx, cx + R, cy, cx + R, cy + 120, C.chalk, 1.5); arr(ctx, cx + R, cy + 120, cx + R, cy + 160, C.amber); txt(ctx, cx + R + 6, cy + 150, "effort", C.amber, 10.5); line(ctx, cx - r, cy, cx - r, cy + 140, C.chalk, 1.5); rect(ctx, cx - r - 18, cy + 140, 36, 30, "#8a8f99"); txt(ctx, cx - r, cy + 186, "load", C.dim, 10.5, "center"); txt(ctx, cx, cy - R - 10, "windlass / well / screwdriver / steering", C.dim, 10, "center"); }
      else if (c.m === 1) { const cx = 180; rect(ctx, cx - 50, 320, 100, 30, "#555"); for (let i = 0; i < 12; i++) line(ctx, cx - 20, 310 - i * 14, cx + 20, 304 - i * 14, "#aaa", 3); rect(ctx, cx - 60, 130, 120, 16, "#8a8f99"); txt(ctx, cx, 122, "car (load)", C.dim, 10, "center"); const hl = 60 + c.p1 * 2.5; line(ctx, cx, 200, cx + hl * Math.cos(a), 200 + hl * Math.sin(a) * 0.3, C.amber, 4); txt(ctx, cx, 380, "one turn of handle raises load by one pitch", C.dim, 10, "center"); }
      else { const r1 = 10 + c.p1 * 1.4, r2 = 10 + c.p2 * 1.4, x1 = 130, x2 = x1 + r1 + r2 + 4, y = 190; const gear = (x, rr, n, ang, col) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const R = i % 2 ? rr : rr + 6, t = (i / (n * 2)) * K.TAU; ctx.lineTo(R * Math.cos(t), R * Math.sin(t)); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = "#222"; ctx.stroke(); ctx.restore(); circ(ctx, x, y, 5, "#222"); }; gear(x1, r1, Math.round(c.p1), a, "#8aa0c0"); gear(x2, r2, Math.round(c.p2), (-a * c.p1) / c.p2 + Math.PI / c.p2, "#c0a070"); txt(ctx, x1, y + r1 + 24, "driver " + Math.round(c.p1) + " teeth", C.dim, 10, "center"); txt(ctx, x2, y + r2 + 24, "driven " + Math.round(c.p2) + " teeth", C.dim, 10, "center"); }
      panel(ctx, 400, 30, 228, 340, ["Wheel and axle", "Screw jack", "Gear train"][c.m]); notes(ctx, 410, 70, 210, [[c.m === 0 ? "V.R. = R ÷ r = " + c.p1 + " ÷ " + c.p2 : c.m === 1 ? "V.R. = 2πL ÷ pitch = 2π × " + c.p1 * 10 + " mm ÷ " + c.p2 + " mm" : "V.R. = driven teeth ÷ driver teeth = " + c.p2 + " ÷ " + c.p1, C.chalk], ["V.R. = " + f(VR, 2), C.amber], ["M.A. = V.R. × efficiency = " + f(MA, 2), C.teal], ["Effort needed = " + c.L + " ÷ " + f(MA, 2) + " = " + f(E, 1) + " N", C.amber], c.m === 2 ? "Small gear driving a large one: more turning force, lower speed (bicycle low gear)." : "Machines make work easier — they never give out more work than is put in.", "Efficiency < 100 % because of friction and the weight of moving parts."]);
    },
    readouts(s, c) { const VR = this.vr(c), MA = (VR * c.eff) / 100; return [["Velocity ratio", f(VR, 2)], ["Mechanical advantage", f(MA, 2)], ["Effort", f(c.L / MA, 1) + " N"]]; },
  });

  /* ---------- T16 Thermometers and temperature scales ---------- */
  K.add("16", {
    modeName: "Thermometers & Temperature Scales", tag: "FIXED POINTS", eqn: "θ = (L_θ − L₀)/(L₁₀₀ − L₀) × 100 °C     T(K) = θ(°C) + 273",
    controls: [K.rng("th", "Temperature", -40, 120, 1, 37, " °C"), K.sel("liq", "Thermometric liquid", ["Mercury (−39 to 357 °C)", "Alcohol (−115 to 78 °C)"], 0), K.rng("L0", "Column length at ice point L₀", 2, 6, 0.1, 3, " cm")],
    draw(ctx, s, c) {
      const L100 = c.L0 + 16, Lt = c.L0 + (c.th / 100) * 16, x = 120, base = 340, sc = 14, ok = c.liq === 0 ? c.th > -39 : c.th < 78; rect(ctx, x - 9, base - 22 * sc, 18, 22 * sc, "rgba(220,235,255,.15)", "#e8f0ff"); circ(ctx, x, base + 12, 16, c.liq ? "#d84a5a" : "#c8ccd4", "#e8f0ff", 1.5); rect(ctx, x - 4, base - Math.max(0, Lt) * sc, 8, Math.max(0, Lt) * sc + 4, c.liq ? "#d84a5a" : "#c8ccd4");
      [[c.L0, "0 °C (ice point)"], [L100, "100 °C (steam point)"]].forEach(([L, lab]) => { line(ctx, x + 10, base - L * sc, x + 34, base - L * sc, C.amber, 1.5); txt(ctx, x + 38, base - L * sc, lab, C.amber, 10); txt(ctx, x + 38, base - L * sc + 13, "L = " + f(L, 1) + " cm", C.amber, 10); }); line(ctx, x - 30, base - Lt * sc, x - 10, base - Lt * sc, C.teal, 1.5); txt(ctx, x - 34, base - Lt * sc + 4, f(Lt, 2) + " cm", C.teal, 10, "right");
      const K_ = c.th + 273, F = c.th * 1.8 + 32; panel(ctx, 390, 30, 238, 340, "Scales"); notes(ctx, 400, 70, 220, [["Celsius: " + c.th + " °C", C.chalk], ["Kelvin: " + f(K_, 0) + " K", C.amber], ["Fahrenheit: " + f(F, 1) + " °F", C.chalk], "From the column: θ = (" + f(Lt, 2) + " − " + c.L0 + ") ÷ (" + f(L100, 1) + " − " + c.L0 + ") × 100 = " + f(c.th, 1) + " °C", ok ? "" : ["Outside this liquid's range — choose the other liquid!", C.red], "Types: liquid-in-glass, clinical (constriction, 35–43 °C), maximum–minimum (Six's), thermocouple (wide range, fast), platinum-resistance (accurate), constant-volume gas thermometer (standard).", "Mercury: opaque, uniform expansion, does not wet glass. Alcohol: low freezing point — good for polar regions."], 10.5);
    },
    readouts(s, c) { return [["Celsius", c.th + " °C"], ["Kelvin", c.th + 273 + " K"], ["Column length", f(c.L0 + (c.th / 100) * 16, 2) + " cm"]]; },
  });

  /* ---------- T16 Anomalous expansion of water ---------- */
  const rhoW = (T) => 1000 * (1 - (Math.pow(T - 3.98, 2) * 6.8e-6)) ;
  K.add("16", {
    modeName: "Anomalous Expansion of Water", tag: "MAX DENSITY AT 4 °C", eqn: "Water contracts from 0 °C to 4 °C, then expands — maximum density (1000 kg/m³) at 4 °C",
    controls: [K.rng("Ta", "Air temperature above pond", -15, 15, 0.5, -6, " °C"), K.rng("T", "Probe temperature (graph)", 0, 15, 0.1, 4, " °C")],
    draw(ctx, s, c) {
      const A = axes(ctx, 70, 40, 250, 150, { x0: 0, x1: 15, y0: 999.0, y1: 1000.05, nx: 5, ny: 3, xl: "temperature (°C)", yl: "density (kg/m³)", title: "Density of water" }); plot(ctx, A, rhoW, 0, 15, C.teal); circ(ctx, A.X(c.T), A.Y(rhoW(c.T)), 5, C.amber);
      const B = axes(ctx, 70, 230, 250, 120, { x0: 0, x1: 15, y0: 0.99995, y1: 1.0011, nx: 5, ny: 2, xl: "temperature (°C)", yl: "volume (cm³ per g)" }); plot(ctx, B, (T) => 1000 / rhoW(T), 0, 15, C.amber);
      const px = 360, py = 120, W = 260, H = 230, ice = c.Ta < 0 ? clamp(-c.Ta * 3, 0, 60) : 0; rect(ctx, px, py, W, H, "#2a6ab8"); for (let i = 0; i < 6; i++) { const y = py + ice + ((H - ice) * i) / 6, T = c.Ta < 4 ? 4 - ((5 - i) / 5) * (4 - Math.max(0, c.Ta)) * (i < 5 ? 1 : 1) : c.Ta - ((i / 5) * (c.Ta - 4)); txt(ctx, px + W - 6, y + 20, f(clamp(T, 0, 30), 1) + " °C", "#e8f4ff", 10, "right"); }
      if (ice) rect(ctx, px, py, W, ice, "#e8f4ff"); txt(ctx, px + W / 2, py - 10, ice ? "Ice floats and insulates the water below" : "No ice", C.chalk, 11, "center"); for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(px + 60 + i * 70, py + H - 30); K.poly(ctx, [[0, 0], [20, -8], [20, 8]], null, "#f2a020"); ctx.restore(); }
      txt(ctx, px + W / 2, py + H + 16, "Bottom stays at ≈ 4 °C — fish survive", C.teal, 10.5, "center");
    },
    readouts(s, c) { return [["Density at probe", f(rhoW(c.T), 3) + " kg/m³"], ["Pond surface", c.Ta < 0 ? "frozen" : "liquid"], ["Bottom water", "≈ 4 °C"]]; },
  });

  /* ---------- T16 Land/sea breezes and the vacuum flask ---------- */
  K.add("16", {
    modeName: "Land & Sea Breezes · Vacuum Flask", tag: "CONVECTION · REDUCING HEAT LOSS", eqn: "Land heats and cools faster than sea (lower specific heat capacity) → convection currents · Flask: vacuum stops conduction & convection, silvering reduces radiation",
    controls: [K.sel("m", "Show", ["Sea breeze (day)", "Land breeze (night)", "Vacuum flask vs open cup"], 0), K.rng("t", "Time (flask)", 0, 300, 5, 60, " min")],
    reset(s) { s.u = 0; }, step(s, c, dt) { s.u += dt; },
    draw(ctx, s, c) {
      if (c.m < 2) { const day = c.m === 0; rect(ctx, 0, 0, 640, 400, day ? "#3a6ab8" : "#0a1428"); rect(ctx, 0, 280, 330, 120, "#c8a060"); rect(ctx, 330, 290, 310, 110, "#2a6ab8"); circ(ctx, day ? 80 : 560, 60, 30, day ? "#ffd84a" : "#e8e8f0"); txt(ctx, 160, 340, day ? "land HOT (" + 34 + " °C)" : "land COOL (20 °C)", "#222", 12, "center", true); txt(ctx, 480, 350, day ? "sea cooler (27 °C)" : "sea warmer (25 °C)", "#e8f4ff", 12, "center", true);
        const dir = day ? 1 : -1, cx1 = day ? 160 : 480, cx2 = day ? 480 : 160; const loop = [[cx2, 260], [cx1, 260], [cx1, 110], [cx2, 110]]; for (let i = 0; i < 18; i++) { const u = ((s.u * 0.12 + i / 18) % 1) * 4, k = Math.floor(u), r = u - k, a = loop[k], b = loop[(k + 1) % 4]; circ(ctx, a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r, 4, "rgba(255,255,255,.75)"); }
        arr(ctx, cx2 + (day ? -40 : 40), 255, cx1 + (day ? 60 : -60), 255, "#fff", 2.6); txt(ctx, 320, 245, day ? "SEA BREEZE (from sea to land)" : "LAND BREEZE (from land to sea)", "#fff", 13, "center", true); txt(ctx, cx1, 100, "warm air rises", "#fff", 10.5, "center"); txt(ctx, cx2, 100, "cool air sinks", "#fff", 10.5, "center"); }
      else { const Tr = 25, T0 = 90, kf = 0.0025, kc = 0.03, Tf = Tr + (T0 - Tr) * Math.exp(-kf * c.t), Tc = Tr + (T0 - Tr) * Math.exp(-kc * c.t); const x = 90; rect(ctx, x - 40, 80, 80, 240, "#9aa0a8", "#555"); rect(ctx, x - 30, 90, 60, 220, "#e8eef8"); rect(ctx, x - 24, 96, 48, 208, "#3a2a1a"); rect(ctx, x - 20, 60, 40, 30, "#c8a060"); txt(ctx, x + 50, 70, "stopper (insulator)", C.dim, 9.5); txt(ctx, x + 50, 140, "vacuum between walls", C.dim, 9.5); txt(ctx, x + 50, 200, "silvered glass walls", C.dim, 9.5); txt(ctx, x + 50, 300, "felt/cork support", C.dim, 9.5);
        const A = axes(ctx, 300, 50, 300, 230, { x0: 0, x1: 300, y0: 20, y1: 95, nx: 5, xl: "time (min)", yl: "temperature (°C)", title: "Cooling of hot tea" }); plot(ctx, A, (t) => Tr + (T0 - Tr) * Math.exp(-kf * t), 0, 300, C.teal); plot(ctx, A, (t) => Tr + (T0 - Tr) * Math.exp(-kc * t), 0, 300, C.red); line(ctx, A.X(c.t), A.y, A.X(c.t), A.y + A.h, C.dim, 1, [4, 3]); txt(ctx, 310, 300, "flask " + f(Tf, 1) + " °C   ·   open cup " + f(Tc, 1) + " °C after " + c.t + " min", C.chalk, 11); }
    },
    readouts(s, c) { if (c.m === 2) { const Tf = 25 + 65 * Math.exp(-0.0025 * c.t), Tc = 25 + 65 * Math.exp(-0.03 * c.t); return [["Flask", f(Tf, 1) + " °C"], ["Open cup", f(Tc, 1) + " °C"], ["Time", c.t + " min"]]; } return [["Breeze", c.m === 0 ? "sea → land" : "land → sea"], ["Cause", "unequal heating"], ["Transfer", "convection"]]; },
  });

  /* ---------- T16 General gas law ---------- */
  K.add("16", {
    modeName: "General Gas Law — PV/T = constant", tag: "P₁V₁/T₁ = P₂V₂/T₂", eqn: "For a fixed mass of gas: P·V / T = constant  (T in kelvin)",
    controls: [K.rng("T", "Temperature", 200, 600, 5, 300, " K"), K.rng("V", "Volume", 0.5, 2, 0.05, 1, " L", 2)],
    reset(s) { const r = K.rnd(5); s.p = []; for (let i = 0; i < 70; i++) { const a = r() * K.TAU; s.p.push({ x: r(), y: r(), vx: Math.cos(a), vy: Math.sin(a) }); } s.hits = 0; s.ht = 0; s.rate = 0; },
    step(s, c, dt) { const sp = 0.6 * Math.sqrt(c.T / 300); s.ht += dt; s.p.forEach((q) => { q.x += q.vx * sp * dt; q.y += (q.vy * sp * dt) / c.V; if (q.x < 0 || q.x > 1) { q.vx *= -1; q.x = clamp(q.x, 0, 1); s.hits++; } if (q.y < 0 || q.y > 1) { q.vy *= -1; q.y = clamp(q.y, 0, 1); s.hits++; } }); if (s.ht > 1) { s.rate = s.hits / s.ht; s.hits = 0; s.ht = 0; } },
    draw(ctx, s, c) {
      const P = (100 * c.T) / 300 / c.V, H = 120 * c.V, x0 = 60, y0 = 340 - H, W = 200; rect(ctx, x0, y0, W, H, "rgba(255,143,199,.08)", "#e8f0ff", 2); rect(ctx, x0 - 6, y0 - 14, W + 12, 14, "#8a8f99"); line(ctx, x0 + W / 2, y0 - 14, x0 + W / 2, 30, "#8a8f99", 6);
      s.p.forEach((q) => circ(ctx, x0 + q.x * W, y0 + q.y * H, 3.5, C.pink)); const hot = clamp((c.T - 200) / 400, 0, 1); rect(ctx, x0, 342, W, 12, `rgb(${120 + 135 * hot},${80},${60})`); txt(ctx, x0 + W / 2, 372, "heater " + c.T + " K", C.dim, 10, "center");
      circ(ctx, 330, 90, 40, "#141e2e", C.teal, 2); const ga = -Math.PI * 0.75 + clamp(P / 400, 0, 1) * Math.PI * 1.5; line(ctx, 330, 90, 330 + 32 * Math.cos(ga), 90 + 32 * Math.sin(ga), C.red, 2); txt(ctx, 330, 150, f(P, 1) + " kPa", C.teal, 13, "center", true);
      panel(ctx, 400, 30, 228, 340, "PV/T check"); notes(ctx, 410, 70, 210, [["P = " + f(P, 1) + " kPa, V = " + f(c.V, 2) + " L, T = " + c.T + " K", C.chalk], ["PV/T = " + f((P * c.V) / c.T, 4) + " kPa·L/K (constant)", C.amber], "Wall collisions per second (simulated): " + f(s.rate || 0, 0), "Hotter → faster molecules → harder, more frequent collisions → higher pressure.", "Smaller volume → molecules hit the walls more often → higher pressure.", "Combines Boyle's (T constant), Charles' (P constant) and the pressure law (V constant)."]);
    },
    readouts(s, c) { const P = (100 * c.T) / 300 / c.V; return [["Pressure", f(P, 1) + " kPa"], ["PV/T", f((P * c.V) / c.T, 4)], ["Temperature", c.T + " K"]]; },
  });

  /* ---------- T16 Specific heat capacity ---------- */
  const MET = [["Copper", 390], ["Aluminium", 900], ["Iron", 450], ["Lead", 130]];
  K.add("16", {
    modeName: "Specific Heat Capacity — Mixtures & Electrical Method", tag: "Q = m·c·Δθ", eqn: "Heat lost by hot body = heat gained by cold bodies (method of mixtures) · electrical: c = P·t ÷ (m·Δθ)",
    controls: [K.sel("m", "Method", ["Method of mixtures", "Electrical method"], 0), K.sel("met", "Metal block", MET.map((x) => x[0]), 1), K.rng("mm", "Mass of metal", 0.1, 1, 0.05, 0.5, " kg", 2), K.rng("mw", "Mass of water", 0.1, 0.5, 0.01, 0.2, " kg", 2), K.rng("P", "Heater power (electrical)", 10, 100, 5, 50, " W")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t = Math.min(s.t + dt, 30); },
    draw(ctx, s, c) {
      const [nm, cm] = MET[c.met]; if (c.m === 0) { const th1 = 100, th2 = 25, mc = 0.1, cc = 390, cw = 4200, thf = (c.mm * cm * th1 + (c.mw * cw + mc * cc) * th2) / (c.mm * cm + c.mw * cw + mc * cc), u = clamp(s.t / 6, 0, 1), thw = th2 + (thf - th2) * (1 - Math.exp(-4 * u));
        rect(ctx, 80, 160, 160, 170, "#c87a3a", "#5a3a1a", 2); rect(ctx, 88, 175, 144, 150, "#4aa8ff88"); rect(ctx, 130, 160 + Math.max(0, 1 - u * 4) * -100 + 40, 50, 40, "#8a8f99", "#333"); rect(ctx, 220, 80, 8, 200, "rgba(220,235,255,.3)", "#e8f0ff"); rect(ctx, 222, 280 - (thw - 20) * 2, 4, (thw - 20) * 2, C.red); txt(ctx, 236, 280 - (thw - 20) * 2, f(thw, 1) + " °C", C.chalk, 11);
        panel(ctx, 330, 30, 298, 340, "Method of mixtures"); notes(ctx, 340, 70, 280, ["Hot " + nm.toLowerCase() + ": " + c.mm + " kg at 100 °C (boiling water bath)", "Water: " + c.mw + " kg at 25 °C in a 0.1 kg copper calorimeter", ["Heat lost by metal = heat gained by water + calorimeter", C.amber], c.mm + "·c·(100 − θ) = (" + c.mw + "×4200 + 0.1×390)(θ − 25)", ["Final temperature θ = " + f(thf, 2) + " °C", C.teal], "Solving for c with the measured θ gives c(" + nm.toLowerCase() + ") = " + cm + " J/(kg·K).", "Precautions: lag the calorimeter, transfer quickly, stir, read the maximum temperature."], 10.5); }
      else { const t = s.t * 20, dth = (c.P * t) / (c.mm * cm) * 0.95; rect(ctx, 80, 150, 160, 160, "#8a8f99", "#333"); circ(ctx, 130, 160, 8, "#222"); circ(ctx, 190, 160, 8, "#222"); txt(ctx, 160, 340, nm + " block (" + c.mm + " kg), lagged", C.dim, 10, "center"); rect(ctx, 125, 100, 10, 120, "#c84a2a"); rect(ctx, 186, 60, 8, 140, "rgba(220,235,255,.3)", "#e8f0ff"); rect(ctx, 188, 200 - Math.min(120, dth * 3), 4, Math.min(120, dth * 3), C.red);
        panel(ctx, 330, 30, 298, 340, "Electrical method"); notes(ctx, 340, 70, 280, ["Heater power P = " + c.P + " W (P = IV from ammeter and voltmeter)", "Time t = " + f(t, 0) + " s", ["Temperature rise Δθ = " + f(dth, 2) + " K", C.amber], ["c = P·t ÷ (m·Δθ) = " + c.P + " × " + f(t, 0) + " ÷ (" + c.mm + " × " + f(dth, 2) + ") ≈ " + f(t > 0 ? (c.P * t) / (c.mm * dth) : 0, 0) + " J/(kg·K)", C.teal], "(≈5 % of the heat is lost, so the value is a little high.)", "Water has a very high specific heat capacity (4200 J/(kg·K)): it heats and cools slowly — used in car radiators and central heating."], 10.5); }
    },
    readouts(s, c) { const [nm, cm] = MET[c.met]; return [["Metal", nm], ["Specific heat capacity", cm + " J/(kg·K)"], ["Heat capacity of block", f(c.mm * cm, 0) + " J/K"]]; },
  });

  /* ---------- T16 Specific latent heat ---------- */
  K.add("16", {
    modeName: "Specific Latent Heat — Electrical Method", tag: "Q = m·L", eqn: "Latent heat of fusion: l = P·t ÷ (m_test − m_control) ≈ 3.34 × 10⁵ J/kg · vaporisation: ≈ 2.26 × 10⁶ J/kg",
    controls: [K.sel("m", "Change of state", ["Fusion (melting ice)", "Vaporisation (boiling water)"], 0), K.rng("P", "Heater power", 20, 200, 5, 60, " W"), K.rng("tm", "Heating time", 60, 900, 30, 300, " s")],
    draw(ctx, s, c) {
      const fus = c.m === 0, L = fus ? 3.34e5 : 2.26e6, ctrl = fus ? 0.004 : 0, mt = (c.P * c.tm) / L + ctrl, mc = ctrl;
      if (fus) { [[110, "Test (heater ON)", mt], [270, "Control (heater OFF)", mc]].forEach(([x, lab, m]) => { K.poly(ctx, [[x - 50, 100], [x + 50, 100], [x + 8, 200], [x - 8, 200]], "#e8f0ff", "rgba(232,244,255,.6)"); if (x === 110) rect(ctx, x - 4, 70, 8, 110, "#c84a2a"); rect(ctx, x - 30, 260, 60, 60, null, "#e8f0ff", 1.5); rect(ctx, x - 28, 320 - Math.min(58, m * 1000), 56, Math.min(58, m * 1000), "#4aa8ffaa"); txt(ctx, x, 345, f(m * 1000, 1) + " g melted", C.teal, 11, "center"); txt(ctx, x, 60, lab, C.dim, 10, "center"); for (let i = 0; i < 6; i++) circ(ctx, x, 200 + ((i * 20 + Date.now() / 30) % 60), 2, "#4aa8ff"); }); }
      else { rect(ctx, 80, 160, 160, 140, "#c8ccd4", "#555"); rect(ctx, 88, 200, 144, 96, "#4aa8ff99"); for (let i = 0; i < 12; i++) circ(ctx, 100 + (i * 37) % 130, 290 - ((i * 23 + Date.now() / 20) % 90), 4, "rgba(255,255,255,.7)"); rect(ctx, 80, 300, 160, 30, "#2a2f38"); txt(ctx, 160, 320, "balance: −" + f(mt * 1000, 1) + " g", C.green, 12, "center", true); }
      panel(ctx, 370, 30, 258, 340, fus ? "Fusion" : "Vaporisation"); notes(ctx, 380, 70, 240, ["Energy supplied Q = P·t = " + c.P + " × " + c.tm + " = " + f(c.P * c.tm, 0) + " J", fus ? "Mass melted by heater = " + f(mt * 1000, 1) + " − " + f(mc * 1000, 1) + " = " + f((mt - mc) * 1000, 1) + " g (control funnel corrects for heat from the room)" : "Mass boiled away = " + f(mt * 1000, 1) + " g", ["l = Q ÷ m = " + K.sci((c.P * c.tm) / (mt - mc)) + " J/kg", C.amber], "During a change of state the temperature stays constant: the energy breaks bonds between particles instead of raising their kinetic energy.", "Steam scalds badly because it releases 2.26 MJ/kg as it condenses on skin."], 10.5);
    },
    readouts(s, c) { const L = c.m === 0 ? 3.34e5 : 2.26e6; return [["Energy supplied", f(c.P * c.tm, 0) + " J"], ["Mass changed", f(((c.P * c.tm) / L) * 1000, 1) + " g"], ["Specific latent heat", K.sci(L) + " J/kg"]]; },
  });

  /* ---------- T16 Evaporation ---------- */
  const psat = (T) => 0.6108 * Math.exp((17.27 * T) / (T + 237.3)); // kPa
  K.add("16", {
    modeName: "Evaporation — Factors and Cooling Effect", tag: "SURFACE PHENOMENON", eqn: "Rate ∝ surface area × (p_sat(T) − p_air) × (1 + draught)  · evaporation takes latent heat → cooling",
    controls: [K.rng("T", "Liquid temperature", 5, 60, 1, 30, " °C"), K.rng("rh", "Relative humidity of air", 0, 100, 5, 50, " %"), K.rng("A", "Surface area", 20, 400, 10, 150, " cm²"), K.rng("w", "Draught (wind speed)", 0, 5, 0.25, 1, " m/s")],
    reset(s) { s.p = []; s.r = K.rnd(9); }, step(s, c, dt) { const rate = this.rate(c); if (s.r() < rate * dt * 0.8) s.p.push({ x: 60 + s.r() * c.A * 0.6, y: 250, vx: c.w * 20 + (s.r() - 0.5) * 20, vy: -40 - s.r() * 40 }); s.p.forEach((q) => { q.x += q.vx * dt; q.y += q.vy * dt; }); s.p = s.p.filter((q) => q.y > 20 && q.x < 400); },
    rate(c) { return Math.max(0, (c.A / 100) * (psat(c.T) - (c.rh / 100) * psat(25)) * (1 + 0.6 * c.w)) * 10; },
    draw(ctx, s, c) {
      const wpx = c.A * 0.6; rect(ctx, 50, 250, wpx + 20, 30, "#4aa8ffaa", "#e8f0ff", 2); (s.p || []).forEach((q) => circ(ctx, q.x, q.y, 3, "rgba(200,230,255,.85)")); for (let i = 0; i < 4 && c.w > 0; i++) arr(ctx, 40, 120 + i * 30, 40 + c.w * 30, 120 + i * 30, "rgba(147,170,196,.6)", 1.4);
      const r = this.rate(c), cool = clamp(r * 0.6, 0, 12); txt(ctx, 60, 310, "rate ≈ " + f(r, 2) + " g/min (relative)", C.teal, 12, "left", true); txt(ctx, 60, 330, "liquid cooled by ≈ " + f(cool, 1) + " °C below surroundings", C.amber, 11);
      panel(ctx, 400, 30, 228, 340, "Evaporation vs boiling"); notes(ctx, 410, 70, 210, ["Faster evaporation with: higher temperature, larger surface area, drier air (low humidity), more draught, lower pressure.", "The fastest molecules escape, so the average KE of those left falls → the liquid COOLS (sweating, clay pots, fridges).", ["Evaporation: at any temperature, only at the surface, silent.", C.teal], ["Boiling: at a fixed temperature (boiling point), throughout the liquid with bubbles.", C.amber]], 10.5);
    },
    readouts(s, c) { return [["Evaporation rate", f(this.rate(c), 2) + " (relative)"], ["Vapour pressure at T", f(psat(c.T), 2) + " kPa"], ["Air humidity", c.rh + " %"]]; },
  });

  /* ---------- T16 Saturated vapour pressure and boiling ---------- */
  const bp = (P) => { let lo = 0, hi = 200; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; psat(m) < P ? (lo = m) : (hi = m); } return (lo + hi) / 2; };
  K.add("16", {
    modeName: "Saturated Vapour Pressure & Boiling", tag: "BOILS WHEN SVP = EXTERNAL PRESSURE", eqn: "A liquid boils when its saturated vapour pressure equals the external pressure — lower pressure, lower boiling point",
    controls: [K.sel("pl", "Where", ["Sea level (101 kPa)", "Jos Plateau 1 200 m (88 kPa)", "Mt Kilimanjaro 5 900 m (50 kPa)", "Pressure cooker (200 kPa)", "Custom"], 0), K.rng("P", "Custom external pressure", 10, 220, 1, 101, " kPa"), K.rng("T", "Water temperature", 20, 125, 0.5, 80, " °C")],
    draw(ctx, s, c) {
      const Pex = [101.3, 88, 50, 200, c.P][c.pl], Tb = bp(Pex), boiling = c.T >= Tb; const A = axes(ctx, 70, 40, 300, 280, { x0: 20, x1: 125, y0: 0, y1: 230, nx: 5, ny: 5, xl: "temperature (°C)", yl: "SVP (kPa)", title: "SVP of water" }); plot(ctx, A, psat, 20, 125, C.teal); line(ctx, A.x, A.Y(Pex), A.x + A.w, A.Y(Pex), C.amber, 1.5, [5, 4]); txt(ctx, A.x + 6, A.Y(Pex) - 5, "external pressure " + Pex + " kPa", C.amber, 10); line(ctx, A.X(Tb), A.Y(0), A.X(Tb), A.Y(Pex), C.red, 1.2, [3, 3]); circ(ctx, A.X(Tb), A.Y(Pex), 5, C.red); circ(ctx, A.X(c.T), A.Y(psat(c.T)), 5, C.chalk);
      rect(ctx, 420, 220, 120, 90, "#c8ccd4", "#555"); rect(ctx, 426, 250, 108, 56, "#4aa8ff99"); if (boiling) for (let i = 0; i < 10; i++) circ(ctx, 436 + (i * 29) % 96, 300 - ((i * 17 + Date.now() / 15) % 50), 4, "rgba(255,255,255,.8)");
      notes(ctx, 400, 60, 228, [["Boiling point here = " + f(Tb, 1) + " °C", C.red], "SVP at " + c.T + " °C = " + f(psat(c.T), 1) + " kPa", boiling ? ["Water is boiling.", C.amber] : "Not boiling: SVP < external pressure, bubbles collapse.", "High altitude → food cooks slowly. Pressure cooker → water boils above 100 °C, cooks faster.", "Impurities (salt) raise the boiling point."], 10.5);
    },
    readouts(s, c) { const Pex = [101.3, 88, 50, 200, c.P][c.pl]; return [["External pressure", Pex + " kPa"], ["Boiling point", f(bp(Pex), 1) + " °C"], ["SVP at liquid temp", f(psat(c.T), 1) + " kPa"]]; },
  });

  /* ---------- T16 Wet- and dry-bulb hygrometer; dew, fog and rain ---------- */
  const wetBulb = (T, RH) => T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) + Math.atan(T + RH) - Math.atan(RH - 1.676331) + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
  const dewP = (T, RH) => { const g = Math.log(RH / 100) + (17.27 * T) / (T + 237.3); return (237.3 * g) / (17.27 - g); };
  K.add("16", {
    modeName: "Wet & Dry Bulb Hygrometer — Dew, Fog and Rain", tag: "HUMIDITY AND WEATHER", eqn: "Big difference between dry and wet bulb → dry air · dew/fog form when air cools to its dew point",
    controls: [K.rng("T", "Dry-bulb (air) temperature", 10, 40, 0.5, 30, " °C"), K.rng("rh", "Relative humidity", 10, 100, 1, 70, " %"), K.rng("Tn", "Night minimum temperature", 5, 35, 0.5, 22, " °C")],
    draw(ctx, s, c) {
      const Tw = wetBulb(c.T, c.rh), Td = dewP(c.T, c.rh); [[110, "dry bulb", c.T], [190, "wet bulb", Tw]].forEach(([x, lab, T]) => { rect(ctx, x - 6, 60, 12, 240, "rgba(220,235,255,.2)", "#e8f0ff"); circ(ctx, x, 310, 12, "#c8ccd4", "#e8f0ff"); rect(ctx, x - 3, 300 - (T - 0) * 6, 6, (T - 0) * 6, "#c8ccd4"); txt(ctx, x, 345, lab, C.dim, 10, "center"); txt(ctx, x, 50, f(T, 1) + " °C", C.chalk, 12, "center", true); });
      ctx.save(); ctx.strokeStyle = "#e8e0d0"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(190, 312); ctx.quadraticCurveTo(200, 360, 230, 360); ctx.stroke(); ctx.restore(); rect(ctx, 220, 350, 50, 24, "#4aa8ff88", "#e8f0ff"); txt(ctx, 245, 390, "wick in water", C.dim, 9.5, "center");
      const fog = c.Tn <= Td; panel(ctx, 300, 30, 328, 340, "Readings and weather"); notes(ctx, 310, 70, 310, [["Depression = " + f(c.T - Tw, 1) + " °C", C.amber], "Evaporation from the wet wick cools the wet bulb — the drier the air, the faster the evaporation and the bigger the depression.", ["Dew point = " + f(Td, 1) + " °C", C.teal], fog ? ["Tonight the air cools to " + c.Tn + " °C, below the dew point: water vapour condenses — dew on grass, mist or fog near the ground (harmattan mornings are usually dry; rainy-season nights give dew and fog).", C.green] : "Night minimum stays above the dew point: no dew or fog.", "Rain: warm moist air rises, expands and cools below its dew point; droplets form clouds and grow until they fall."], 10.5);
    },
    readouts(s, c) { const Tw = wetBulb(c.T, c.rh), Td = dewP(c.T, c.rh); return [["Wet bulb", f(Tw, 1) + " °C"], ["Dew point", f(Td, 1) + " °C"], ["Dew / fog tonight?", c.Tn <= Td ? "yes" : "no"]]; },
  });
});
