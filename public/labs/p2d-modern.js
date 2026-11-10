/* p2d-modern.js — Topics 29–30 and harmonised topics: models of the atom & Rutherford scattering, thermionic emission,
   nuclide builder (A, Z, N, isotopes), alpha/beta/gamma penetration & deflection with a G-M counter,
   mass defect & binding energy, Young's modulus, thermal conductivity & solar collector, band theory & doping. */
window.PX.push(function () {
  const K = window.PK, C = K.C, { txt, line, rect, circ, arr, panel, notes, axes, plot, f, clamp, rad, deg } = K;
  const gl = (ctx, pts, col, w = 2.2) => (typeof glowLine === "function" ? glowLine(ctx, pts, col, w, 6) : K.poly(ctx, pts, col, null, w, false));

  /* ---------- T29 Models of the atom & Rutherford scattering ---------- */
  K.add("29", {
    modeName: "Models of the Atom — Rutherford Scattering", tag: "THOMSON → RUTHERFORD → BOHR → CLOUD", eqn: "Most α-particles pass straight through gold foil; a few are deflected through large angles → tiny, dense, positive nucleus",
    controls: [K.sel("m", "Model", ["Thomson (plum pudding)", "Rutherford (nuclear)", "Bohr (energy levels)", "Electron cloud (quantum)"], 1), K.rng("E", "Alpha-particle energy", 2, 10, 0.5, 5, " MeV")],
    reset(s) { s.p = []; s.r = K.rnd(3); s.n = 0; s.big = 0; },
    step(s, c, dt) { if (s.r() < dt * 30) s.p.push({ x: 20, y: 60 + s.r() * 280, vx: 220, vy: 0, done: false }); const Z = 79, kk = 2400 / c.E; s.p.forEach((q) => { if (c.m === 1) { const dx = q.x - 320, dy = q.y - 200, r2 = dx * dx + dy * dy + 9, r = Math.sqrt(r2), a = kk / r2; q.vx += ((a * dx) / r) * dt * 60; q.vy += ((a * dy) / r) * dt * 60; } q.x += q.vx * dt; q.y += q.vy * dt; if (!q.done && (q.x > 600 || q.x < 10 || q.y < 20 || q.y > 380)) { q.done = true; s.n++; if (Math.abs(Math.atan2(q.vy, q.vx)) > 0.5) s.big++; } }); s.p = s.p.filter((q) => q.x > -20 && q.x < 660 && q.y > -20 && q.y < 420).slice(-120); },
    draw(ctx, s, c) {
      rect(ctx, 316, 40, 8, 320, "rgba(242,194,26,.3)"); txt(ctx, 320, 32, "gold foil", "#f2c21a", 10, "center");
      if (c.m === 0) { circ(ctx, 320, 200, 60, "rgba(255,120,120,.25)", C.red); for (let i = 0; i < 9; i++) txt(ctx, 290 + (i % 3) * 30, 175 + Math.floor(i / 3) * 28, "−", C.blue, 16, "center", true); }
      else if (c.m === 1) { circ(ctx, 320, 200, 5, C.red); circ(ctx, 320, 200, 70, null, "rgba(147,170,196,.25)", 1); }
      else if (c.m === 2) { circ(ctx, 320, 200, 6, C.red); [30, 55, 80].forEach((r, i) => { circ(ctx, 320, 200, r, null, "rgba(127,227,218,.5)", 1.4); const a = Date.now() / (600 + i * 400); circ(ctx, 320 + r * Math.cos(a), 200 + r * Math.sin(a), 4, C.blue); txt(ctx, 320 + r + 4, 196, "n=" + (i + 1), C.dim, 9); }); }
      else { const r = K.rnd(5); for (let i = 0; i < 260; i++) { const rr = -Math.log(r() + 1e-6) * 22, a = r() * K.TAU; circ(ctx, 320 + rr * Math.cos(a), 200 + rr * Math.sin(a), 1.2, "rgba(124,179,255,.55)"); } circ(ctx, 320, 200, 5, C.red); }
      (s.p || []).forEach((q) => circ(ctx, q.x, q.y, 2.2, C.amber)); rect(ctx, 10, 190, 20, 20, "#555"); txt(ctx, 20, 228, "α source", C.dim, 9.5, "center");
      const notesM = [["Thomson: positive 'pudding' with electrons embedded. Could not explain large-angle scattering.", "Rutherford: almost all mass and all positive charge in a tiny nucleus; electrons orbit far away. Limitation: orbiting electrons should radiate and spiral in.", "Bohr: electrons occupy fixed energy levels; light emitted only when they jump between levels (explains hydrogen line spectrum). Limitation: fails for many-electron atoms.", "Electron-cloud (quantum) model: electrons described by probability clouds (orbitals), not fixed paths."][c.m]];
      panel(ctx, 430, 250, 198, 130, null); notes(ctx, 438, 270, 185, [notesM[0], c.m === 1 ? ["Deflected > 30°: " + s.big + " of " + s.n, C.amber] : ""], 10);
    },
    readouts(s, c) { return [["Model", ["Thomson", "Rutherford", "Bohr", "Electron cloud"][c.m]], ["Particles detected", s.n || 0], ["Large-angle deflections", c.m === 1 ? s.big || 0 : "—"]]; },
  });

  /* ---------- T29 Thermionic emission ---------- */
  K.add("29", {
    modeName: "Thermionic Emission — Diode Valve & CRO", tag: "HOT CATHODE EMITS ELECTRONS", eqn: "Heated metal surfaces emit electrons (thermionic emission); attracted to a positive anode → current flows one way only",
    controls: [K.rng("Th", "Cathode temperature", 800, 2500, 50, 1800, " K"), K.rng("Va", "Anode voltage", -50, 200, 5, 100, " V"), K.sel("m", "Device", ["Diode valve", "Cathode-ray tube"], 0)],
    reset(s) { s.p = []; s.r = K.rnd(8); }, step(s, c, dt) { const em = Math.exp(30160 * (1 / 2000 - 1 / c.Th)); if (s.r() < clamp(em * 12 * dt, 0, 0.9)) s.p.push({ x: 120, y: 160 + s.r() * 80, v: 10 }); s.p.forEach((q) => { const acc = c.Va > 0 ? c.Va * 3 : c.Va * 6; q.v += acc * dt; q.x += q.v * dt; }); s.p = s.p.filter((q) => q.x > 100 && q.x < (c.m === 0 ? 400 : 600)).slice(-200); },
    draw(ctx, s, c) {
      const em = Math.exp(30160 * (1 / 2000 - 1 / c.Th)), I = c.Va > 0 ? Math.min(em * 2, Math.pow(c.Va, 1.5) * 0.02) : 0; ctx.save(); ctx.beginPath(); ctx.ellipse(c.m === 0 ? 260 : 340, 200, c.m === 0 ? 190 : 290, 110, 0, 0, K.TAU); ctx.strokeStyle = "rgba(220,235,255,.6)"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); txt(ctx, 260, 80, "vacuum", C.dim, 10, "center");
      const glow = clamp((c.Th - 800) / 1700, 0, 1); rect(ctx, 100, 150, 20, 100, `rgb(${120 + glow * 135},${60 + glow * 120},${40})`); txt(ctx, 110, 270, "hot cathode (−)", C.dim, 10, "center");
      if (c.m === 0) { rect(ctx, 400, 140, 14, 120, "#9aa0a8"); txt(ctx, 407, 278, "anode (" + (c.Va >= 0 ? "+" : "−") + c.Va + " V)", C.dim, 10, "center"); } else { rect(ctx, 200, 170, 10, 60, "#9aa0a8"); rect(ctx, 228, 170, 10, 60, "#9aa0a8"); line(ctx, 300, 150, 360, 150, "#9aa0a8", 3); line(ctx, 300, 250, 360, 250, "#9aa0a8", 3); rect(ctx, 620, 100, 8, 200, "rgba(91,214,140,.4)"); circ(ctx, 624, 200, 6, `rgba(91,214,140,${clamp(I / 3, 0, 1)})`); txt(ctx, 600, 320, "fluorescent screen", C.dim, 10, "right"); }
      (s.p || []).forEach((q) => circ(ctx, q.x, q.y, 2, C.blue));
      panel(ctx, 20, 320, 600, 60, null); notes(ctx, 30, 342, 580, [["Emission rises steeply with temperature (more electrons gain enough energy to escape the work function). Anode current ≈ " + f(I, 2) + " mA (relative)", C.amber], c.Va <= 0 ? ["Anode negative: electrons are repelled — no current. The valve conducts one way only (rectifier).", C.red] : c.m === 1 ? "Applications: cathode-ray tube (CRO, old TV), X-ray tube, electron microscope." : "Saturation: at high anode voltage all emitted electrons reach the anode; raise the temperature for more current."], 10.5);
    },
    readouts(s, c) { const em = Math.exp(30160 * (1 / 2000 - 1 / c.Th)), I = c.Va > 0 ? Math.min(em * 2, Math.pow(c.Va, 1.5) * 0.02) : 0; return [["Emission (relative)", f(em, 2)], ["Anode current (relative)", f(I, 2)], ["Conducts?", c.Va > 0 ? "yes" : "no"]]; },
  });

  /* ---------- T30 Composition of the nucleus: nuclide builder ---------- */
  const EL = ["", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn"];
  const NM = ["", "hydrogen", "helium", "lithium", "beryllium", "boron", "carbon", "nitrogen", "oxygen", "fluorine", "neon", "sodium", "magnesium", "aluminium", "silicon", "phosphorus", "sulphur", "chlorine", "argon", "potassium", "calcium", "scandium", "titanium", "vanadium", "chromium", "manganese", "iron", "cobalt", "nickel", "copper", "zinc"];
  const STABLE = { "1,0": 1, "1,1": 1, "2,1": 1, "2,2": 1, "3,3": 1, "3,4": 1, "4,5": 1, "5,5": 1, "5,6": 1, "6,6": 1, "6,7": 1, "7,7": 1, "7,8": 1, "8,8": 1, "8,9": 1, "8,10": 1, "9,10": 1, "10,10": 1, "10,12": 1, "11,12": 1, "12,12": 1, "13,14": 1, "14,14": 1, "17,18": 1, "17,20": 1, "26,30": 1, "29,34": 1, "30,34": 1 };
  K.add("30", {
    modeName: "Nuclide Builder — A, Z, N and Isotopes", tag: "ᴬ_Z X", eqn: "Mass (nucleon) number A = Z + N · Z = proton (atomic) number · isotopes: same Z, different N",
    controls: [K.rng("Z", "Protons Z", 1, 30, 1, 6), K.rng("N", "Neutrons N", 0, 40, 1, 8)],
    draw(ctx, s, c) {
      const A = c.Z + c.N, r = K.rnd(A * 7 + c.Z), R = 10 + Math.cbrt(A) * 14, cx = 180, cy = 200; const parts = []; for (let i = 0; i < A; i++) parts.push(i < c.Z ? 1 : 0); parts.sort(() => r() - 0.5); parts.forEach((p, i) => { const rr = R * Math.sqrt(r()), a = r() * K.TAU; if (typeof dot === "function") dot(ctx, cx + rr * Math.cos(a), cy + rr * Math.sin(a), 7, p ? C.red : "#9aa0a8", 4); else circ(ctx, cx + rr * Math.cos(a), cy + rr * Math.sin(a), 7, p ? C.red : "#9aa0a8"); });
      txt(ctx, cx, cy + R + 30, "● proton   ● neutron", C.dim, 10.5, "center"); const st = STABLE[c.Z + "," + c.N], ratio = c.N / c.Z;
      txt(ctx, 380, 120, String(A), C.chalk, 22, "right", true); txt(ctx, 380, 200, String(c.Z), C.chalk, 22, "right", true); txt(ctx, 386, 170, EL[c.Z], C.amber, 56, "left", true);
      panel(ctx, 420, 30, 208, 340, NM[c.Z] + "-" + A); notes(ctx, 430, 70, 190, [["Z = " + c.Z + " protons (defines the element)", C.red], ["N = " + c.N + " neutrons", C.chalk], ["A = Z + N = " + A + " nucleons", C.amber], "Nuclear charge = +" + c.Z + "e = " + K.sci(c.Z * 1.6e-19) + " C", st ? ["Stable nuclide.", C.green] : ratio > 1.6 || ratio < 0.8 ? ["Far from stability: radioactive (" + (ratio > 1.2 ? "too many neutrons → β⁻ decay" : "too few neutrons → β⁺ / α decay") + ").", C.red] : ["Likely radioactive (not a common stable isotope).", C.amber], "Isotopes of " + NM[c.Z] + " have Z = " + c.Z + " but different N, so the same chemistry but different mass. e.g. carbon-12, carbon-14."], 10.5);
    },
    readouts(s, c) { return [["Nuclide", NM[c.Z] + "-" + (c.Z + c.N)], ["A = Z + N", c.Z + c.N], ["N/Z", f(c.N / c.Z, 2)]]; },
  });

  /* ---------- T30 Alpha, beta and gamma: penetration, deflection, G-M counter ---------- */
  const RAD = [["Alpha (α)", "helium nucleus ⁴₂He, charge +2e", ["paper", "skin"], 5, 0.04, "Strongly ionising, stopped by a sheet of paper or a few cm of air."], ["Beta (β⁻)", "fast electron, charge −e", ["3 mm aluminium"], 2, 1, "Moderately ionising, stopped by a few mm of aluminium; range in air about 1 m."], ["Gamma (γ)", "electromagnetic wave, no charge", ["several cm of lead (reduced)"], 0.1, 0, "Weakly ionising, very penetrating; intensity halved by about 1 cm of lead; not deflected by fields."]];
  K.add("30", {
    modeName: "α, β, γ — Penetration, Deflection & G-M Counter", tag: "IONISING RADIATION", eqn: "α: stopped by paper · β: stopped by ~3 mm Al · γ: reduced by thick lead · in a field α and β bend opposite ways, γ is undeflected",
    controls: [K.sel("t", "Radiation", RAD.map((x) => x[0]), 1), K.sel("abs", "Absorber", ["None", "Paper", "3 mm aluminium", "2 cm lead"], 0), K.sel("fld", "Electric field between plates", ["Off", "On"], 0)],
    reset(s) { s.p = []; s.r = K.rnd(12); s.cnt = 0; s.ct = 0; s.cpm = 0; },
    step(s, c, dt) { const pass = [[1, 1, 1], [0, 1, 1], [0, 0, 1], [0, 0, 0.25]][c.abs][c.t]; if (s.r() < dt * 25) s.p.push({ x: 60, y: 200 + (s.r() - 0.5) * 10, vx: [160, 260, 320][c.t], vy: 0, alive: true }); s.p.forEach((q) => { if (c.fld && q.x > 220 && q.x < 360) q.vy += [-120, 260, 0][c.t] * dt * 3; if (q.alive && c.abs && q.x > 200 && q.x < 206) { if (s.r() > pass) q.alive = false; } if (q.alive) { q.x += q.vx * dt; q.y += q.vy * dt; } if (q.alive && q.x > 540 && !q.counted) { q.counted = true; if (Math.abs(q.y - 200) < 30) s.cnt++; } }); s.p = s.p.filter((q) => q.x < 640 && q.alive !== null && q.x > 0 && (q.alive || s.r() > 0.02)); s.ct += dt; if (s.ct > 2) { s.cpm = (s.cnt / s.ct) * 60 + 18; s.cnt = 0; s.ct = 0; } },
    draw(ctx, s, c) {
      rect(ctx, 30, 185, 30, 30, "#5a5a60"); txt(ctx, 45, 235, "source", C.dim, 9.5, "center"); if (c.abs) rect(ctx, 200, 120, [3, 8, 22][c.abs - 1], 160, ["#f4f0e0", "#c8ccd4", "#6a6a74"][c.abs - 1]); if (c.fld) { rect(ctx, 220, 120, 140, 8, C.red); rect(ctx, 220, 272, 140, 8, C.blue); txt(ctx, 290, 114, "+ + + + +", C.red, 11, "center"); txt(ctx, 290, 296, "− − − − −", C.blue, 11, "center"); }
      (s.p || []).forEach((q) => { if (q.alive) circ(ctx, q.x, q.y, c.t === 0 ? 3.5 : 2, [C.red, C.blue, C.green][c.t]); });
      rect(ctx, 540, 175, 70, 50, "#2a2f38", "#888"); txt(ctx, 575, 205, f(s.cpm || 0, 0), C.green, 14, "center", true); txt(ctx, 575, 240, "G-M counter (counts/min)", C.dim, 9.5, "center"); txt(ctx, 575, 254, "background ≈ 18", C.dim, 9, "center");
      const R = RAD[c.t]; panel(ctx, 30, 300, 600, 80, R[0]); notes(ctx, 40, 336, 580, [[R[1] + ". " + R[5], C.amber], c.fld ? (c.t === 0 ? "α bends towards the negative plate (positive charge, large mass → small deflection)." : c.t === 1 ? "β bends strongly towards the positive plate (negative, very light)." : "γ is not deflected — it carries no charge.") : "G-M tube: radiation ionises the gas inside, each ionisation gives a pulse that is counted. Uses: smoke alarms (α), thickness gauges (β), sterilising and cancer treatment (γ)."], 10.5);
    },
    readouts(s, c) { return [["Radiation", RAD[c.t][0]], ["Count rate", f(s.cpm || 0, 0) + " /min"], ["Deflected by field", c.t === 2 ? "no" : "yes"]]; },
  });

  /* ---------- T30 Mass defect and binding energy ---------- */
  const NUC = [["Helium-4", 2, 2, 4.001506], ["Carbon-12", 6, 6, 11.996709], ["Oxygen-16", 8, 8, 15.990526], ["Iron-56", 26, 30, 55.920687], ["Uranium-235", 92, 143, 234.993459]];
  K.add("30", {
    modeName: "Mass Defect & Binding Energy", tag: "E = Δm·c²", eqn: "Mass defect Δm = Z·m_p + N·m_n − m_nucleus · binding energy E = Δm c² (1 u ≡ 931 MeV) · BE per nucleon peaks at iron",
    controls: [K.sel("n", "Nucleus", NUC.map((x) => x[0]), 0)],
    draw(ctx, s, c) {
      const [nm, Z, N, mN] = NUC[c.n], mp = 1.007276, mn = 1.008665, dm = Z * mp + N * mn - mN, BE = dm * 931, A = Z + N;
      const B = axes(ctx, 70, 40, 300, 280, { x0: 0, x1: 240, y0: 0, y1: 9.5, nx: 6, xl: "mass number A", yl: "BE per nucleon (MeV)", title: "Binding energy per nucleon" }); const semf = (a) => { const z = a / (1.98 + 0.0155 * Math.pow(a, 2 / 3)); return (15.75 * a - 17.8 * Math.pow(a, 2 / 3) - (0.711 * z * (z - 1)) / Math.cbrt(a) - (23.7 * Math.pow(a - 2 * z, 2)) / a) / a; }; plot(ctx, B, (a) => clamp(semf(a), 0, 9.5), 6, 240, C.teal); circ(ctx, B.X(A), B.Y(BE / A), 6, C.amber); txt(ctx, B.X(56), B.Y(8.79) - 10, "Fe-56 most stable", C.dim, 9.5, "center"); txt(ctx, B.X(30), B.Y(4), "fusion →", C.green, 10, "center"); txt(ctx, B.X(200), B.Y(5.5), "← fission", C.red, 10, "center");
      panel(ctx, 400, 30, 228, 340, nm); notes(ctx, 410, 70, 210, ["Z = " + Z + ", N = " + N, "Mass of separate nucleons = " + Z + " × 1.007276 + " + N + " × 1.008665 = " + f(Z * mp + N * mn, 6) + " u", "Mass of nucleus = " + mN + " u", ["Mass defect Δm = " + f(dm, 6) + " u = " + K.sci(dm * 1.66e-27) + " kg", C.amber], ["Binding energy = Δm × 931 = " + f(BE, 1) + " MeV", C.teal], ["Per nucleon = " + f(BE / A, 2) + " MeV", C.teal], "Energy is released when light nuclei fuse or heavy nuclei split, because the products are more tightly bound (higher on the curve)."], 10.5);
    },
    readouts(s, c) { const [nm, Z, N, mN] = NUC[c.n], dm = Z * 1.007276 + N * 1.008665 - mN; return [["Mass defect", f(dm, 5) + " u"], ["Binding energy", f(dm * 931, 1) + " MeV"], ["Per nucleon", f((dm * 931) / (Z + N), 2) + " MeV"]]; },
  });

  /* ---------- H4 Young's modulus ---------- */
  const WIRE = [["Steel", 200e9, 250e6, 450e6], ["Copper", 117e9, 70e6, 220e6], ["Brass", 100e9, 120e6, 350e6], ["Rubber (approx.)", 0.01e9, 7e6, 15e6]];
  K.add("H4", {
    modeName: "Young's Modulus — Stress & Strain", tag: "E = stress ÷ strain", eqn: "Stress = F/A (N/m²) · strain = e/L · Young's modulus E = (F·L)/(A·e) — valid up to the elastic limit (Hooke's law region)",
    controls: [K.sel("w", "Wire", WIRE.map((x) => x[0]), 0), K.rng("F", "Load", 0, 400, 5, 100, " N"), K.rng("d", "Wire diameter", 0.3, 2, 0.05, 0.8, " mm", 2), K.rng("L", "Original length", 0.5, 3, 0.1, 2, " m")],
    draw(ctx, s, c) {
      const [nm, E, el, uts] = WIRE[c.w], Ar = Math.PI * Math.pow((c.d / 2) * 1e-3, 2), st = c.F / Ar, strainEl = st / E, plastic = st > el, broke = st > uts, strain = plastic ? el / E + (st - el) / (E * 0.05) : strainEl, e = strain * c.L;
      line(ctx, 60, 40, 200, 40, C.dim, 6); const ext = clamp(e * 1000 * 4, 0, 120); line(ctx, 130, 40, 130, broke ? 120 : 220 + ext, broke ? C.red : "#c8ccd4", 2); if (!broke) { rect(ctx, 115, 220 + ext, 30, 30 + c.F / 15, "#8a8f99"); txt(ctx, 150, 240 + ext, c.F + " N", C.dim, 10); } else txt(ctx, 130, 140, "WIRE BROKE", C.red, 12, "center", true); txt(ctx, 60, 380, "extension e = " + f(e * 1000, 3) + " mm", C.amber, 11);
      const smax = uts * 1.1, A = axes(ctx, 290, 40, 320, 190, { x0: 0, x1: (el / E) * 4, y0: 0, y1: smax / 1e6, nx: 4, xl: "strain", yl: "stress (MPa)", title: nm + ": stress–strain" }); plot(ctx, A, (x) => (x <= el / E ? E * x : Math.min(uts, el + E * 0.05 * (x - el / E))) / 1e6, 0, (el / E) * 4, C.teal); circ(ctx, A.X(Math.min(strain, (el / E) * 4)), A.Y(Math.min(st, smax) / 1e6), 5, broke ? C.red : plastic ? C.amber : C.green); line(ctx, A.X(el / E), A.y, A.X(el / E), A.y + A.h, C.dim, 1, [3, 3]); txt(ctx, A.X(el / E) + 4, A.y + 12, "elastic limit", C.dim, 9.5);
      notes(ctx, 290, 270, 335, [["Stress = F/A = " + K.sci(st) + " N/m²", C.chalk], ["Strain = e/L = " + K.sci(strain), C.chalk], [plastic ? "Beyond the elastic limit: permanent (plastic) stretch, Hooke's law no longer holds." : "Young's modulus E = stress/strain = " + K.sci(E) + " N/m²", plastic ? C.red : C.amber], "Searle's apparatus uses a reference wire to cancel temperature and support sag."], 10.5);
    },
    readouts(s, c) { const [nm, E, el] = WIRE[c.w], Ar = Math.PI * Math.pow((c.d / 2) * 1e-3, 2), st = c.F / Ar; return [["Stress", K.sci(st) + " Pa"], ["Strain", K.sci(st / E)], ["Region", st > el ? "plastic" : "elastic (Hooke's law)"]]; },
  });

  /* ---------- H4 Thermal conductivity and the solar collector ---------- */
  const MATS = [["Copper", 400], ["Aluminium", 237], ["Steel", 50], ["Glass", 0.8], ["Wood", 0.15], ["Polystyrene foam", 0.03]];
  K.add("H4", {
    modeName: "Thermal Conductivity & Solar Water Heater", tag: "Q/t = kA(θ₁ − θ₂)/x", eqn: "Rate of heat flow by conduction Q/t = k·A·Δθ/x · solar collector: black absorber, glass cover (greenhouse effect), insulated back",
    controls: [K.sel("m", "Show", ["Conduction through a slab", "Flat-plate solar collector"], 0), K.sel("mat", "Material (slab)", MATS.map((x) => x[0]), 0), K.rng("x", "Thickness / insulation", 1, 50, 1, 10, " mm"), K.rng("I", "Sunlight intensity", 200, 1000, 50, 800, " W/m²")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      if (c.m === 0) { const k = MATS[c.mat][1], A = 0.01, dT = 80, q = (k * A * dT) / (c.x / 1000); rect(ctx, 80, 120, 80, 160, "#d84a3a"); txt(ctx, 120, 300, "100 °C", C.red, 11, "center"); const w = 20 + c.x * 3; const grd = ctx.createLinearGradient(160, 0, 160 + w, 0); grd.addColorStop(0, "#d84a3a"); grd.addColorStop(1, "#2a6ad8"); ctx.fillStyle = grd; ctx.fillRect(160, 120, w, 160); rect(ctx, 160 + w, 120, 80, 160, "#2a6ad8"); txt(ctx, 200 + w, 300, "20 °C", C.blue, 11, "center"); for (let i = 0; i < 5; i++) { const u = (s.t * clamp(q / 400, 0.05, 2) + i / 5) % 1; circ(ctx, 160 + u * w, 140 + i * 30, 3, C.amber); }
        panel(ctx, 380, 30, 248, 340, MATS[c.mat][0]); notes(ctx, 390, 70, 230, [["k = " + k + " W/(m·K)", C.chalk], ["Heat flow through 100 cm² = " + K.sci(q) + " W", C.amber], "Thicker slab or lower k → less heat flow.", "Good conductors: metals (free electrons). Poor conductors (insulators): wood, plastics, air, foam — used for lagging, handles, building insulation."], 10.5); }
      else { const eff = clamp(0.75 - (6 / c.x) * 0.3, 0.2, 0.75), P = c.I * 2 * eff, rise = (P * 3600) / (100 * 4200); ctx.save(); ctx.translate(100, 300); ctx.rotate(-0.5); rect(ctx, 0, -20, 260, 20, "#111"); rect(ctx, 0, -26, 260, 6, "rgba(200,230,255,.35)"); for (let i = 0; i < 8; i++) line(ctx, 10 + i * 32, -10, 10 + i * 32, -10, C.red, 4); rect(ctx, 0, 0, 260, Math.min(20, c.x / 2), "#e8d8a0"); ctx.restore(); for (let i = 0; i < 6; i++) { const yy = 40 + i * 12; arr(ctx, 80 + i * 40, yy - 30, 140 + i * 40, yy + 60, "#ffd84a", 1.4); } rect(ctx, 420, 60, 70, 110, "#c8ccd4", "#555"); txt(ctx, 455, 185, "hot-water tank", C.dim, 10, "center"); line(ctx, 330, 160, 420, 100, C.red, 3); line(ctx, 420, 150, 140, 300, C.blue, 3);
        panel(ctx, 30, 30, 300, 110, null); notes(ctx, 40, 52, 285, [["Collector 2 m², efficiency ≈ " + f(eff * 100, 0) + " %", C.chalk], ["Heat collected ≈ " + f(P, 0) + " W → 100 L warms ≈ " + f(rise, 1) + " °C per hour", C.amber], "Black surface absorbs radiation; glass traps infrared; insulation (" + c.x + " mm) cuts conduction losses; hot water rises to the tank by convection (thermosiphon)."], 10); }
    },
    readouts(s, c) { if (c.m === 0) { const k = MATS[c.mat][1]; return [["Conductivity k", k + " W/(m·K)"], ["Heat flow", K.sci((k * 0.01 * 80) / (c.x / 1000)) + " W"], ["Thickness", c.x + " mm"]]; } const eff = clamp(0.75 - (6 / c.x) * 0.3, 0.2, 0.75); return [["Efficiency", f(eff * 100, 0) + " %"], ["Power collected", f(c.I * 2 * eff, 0) + " W"], ["Sunlight", c.I + " W/m²"]]; },
  });

  /* ---------- H8 Band theory and doping ---------- */
  K.add("H8", {
    modeName: "Band Theory & Doping (p-type, n-type)", tag: "CONDUCTORS · SEMICONDUCTORS · INSULATORS", eqn: "Conduction needs electrons in the conduction band · band gap: metal 0, Si 1.1 eV, Ge 0.67 eV, insulator > 5 eV · doping adds carriers",
    controls: [K.sel("m", "Material", ["Metal (conductor)", "Intrinsic silicon", "n-type Si (phosphorus doped)", "p-type Si (boron doped)", "Insulator (diamond)"], 1), K.rng("T", "Temperature", 100, 600, 10, 300, " K")],
    reset(s) { s.t = 0; s.r = K.rnd(4); }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const gap = [0, 1.1, 1.1, 1.1, 5.5][c.m], vb = 260, cb = c.m === 0 ? 240 : vb - 40 - gap * 22; rect(ctx, 60, vb, 220, 70, "rgba(124,179,255,.35)", C.blue); txt(ctx, 170, vb + 90, "valence band", C.blue, 10.5, "center"); rect(ctx, 60, cb - 70, 220, 70, "rgba(255,183,3,.18)", C.amber); txt(ctx, 170, cb - 78, "conduction band", C.amber, 10.5, "center"); if (gap) { arr(ctx, 300, vb, 300, cb, C.dim, 1.4); txt(ctx, 306, (vb + cb) / 2, "gap " + gap + " eV", C.dim, 10.5); }
      const th = c.m === 4 ? 0 : Math.round(clamp(14 * Math.exp(-1000 * 1.1 * (1 / c.T - 1 / 600)), 0, 14)), ne = c.m === 0 ? 30 : c.m === 4 ? 0 : th + (c.m === 2 ? 10 : 0), nh = c.m === 0 || c.m === 4 ? 0 : th + (c.m === 3 ? 10 : 0);
      const r = K.rnd(7); for (let i = 0; i < ne; i++) circ(ctx, 70 + ((r() * 200 + s.t * 30 * (r() + 0.2)) % 200), cb - 60 + r() * 50, 4, C.blue); for (let i = 0; i < nh; i++) circ(ctx, 70 + ((r() * 200 - s.t * 15) % 200 + 200) % 200, vb + 10 + r() * 50, 4, null, C.red, 2);
      if (c.m === 2) { line(ctx, 70, cb + 12, 270, cb + 12, C.green, 1, [4, 3]); txt(ctx, 275, cb + 16, "donor level", C.green, 9.5); } if (c.m === 3) { line(ctx, 70, vb - 12, 270, vb - 12, C.pink, 1, [4, 3]); txt(ctx, 275, vb - 8, "acceptor level", C.pink, 9.5); }
      panel(ctx, 380, 30, 248, 340, null); notes(ctx, 390, 52, 230, [["Free electrons ● " + ne + "   holes ○ " + nh, C.amber], ["Metal: bands overlap — many free electrons; resistance RISES with temperature.", "Intrinsic Si/Ge: small gap; heat lifts a few electrons across, leaving holes. Equal numbers of electrons and holes; resistance FALLS as temperature rises.", "n-type: pentavalent impurity (P, As) gives spare electrons — majority carriers electrons.", "p-type: trivalent impurity (B, Ga, In) creates holes — majority carriers holes.", "Insulator: gap too wide, almost no carriers."][c.m], "A p-type and an n-type region together make the p-n junction diode (forward bias conducts, reverse bias blocks)."], 10.5);
    },
    readouts(s, c) { return [["Material", ["metal", "intrinsic Si", "n-type", "p-type", "insulator"][c.m]], ["Band gap", [0, 1.1, 1.1, 1.1, 5.5][c.m] + " eV"], ["Majority carriers", ["electrons", "electrons = holes", "electrons", "holes", "none"][c.m]]]; },
  });
});
