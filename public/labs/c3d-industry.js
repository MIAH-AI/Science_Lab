/* c3d-industry.js — chemistry 3D, new module: industrial processes
   Haber (NH3), Contact (H2SO4), blast furnace (iron), crude-oil fractional distillation.
   Equilibrium yields use Kp(T) = exp(-ΔG/RT), ΔG = ΔH − TΔS (ΔH, ΔS taken as constant), solved for the mole fractions with the real stoichiometry. */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const Rg = 8.314;
  const CAMS = { haber: [[3.1, 4.6, 17.5], [3.1, 2.7, 0]], contact: [[3.1, 4.6, 17.5], [3.1, 2.7, 0]], blast: [[2.6, 4.2, 16.5], [2.6, 2.9, 0]], crude: [[3.2, 4.6, 16], [3.2, 3.2, 0]] };
  const CLOSE = { haber: [[3.4, 3.4, 9], [2.4, 2.6, 0]], contact: [[3.2, 3.4, 9], [2.2, 2.6, 0]], blast: [[2.4, 3.2, 8.5], [2.4, 2.6, 0]], crude: [[2.6, 3.4, 9], [1.6, 3.2, 0]] };
  const SIDE = { haber: [[12, 5, 12], [1.6, 2.7, 0]], contact: [[12, 5, 12], [1.6, 2.7, 0]], blast: [[9, 4, 8], [1.6, 2.8, 0]], crude: [[10, 5, 10], [1.6, 3.2, 0]] };
  const fmt = (v, d) => Number(v).toFixed(d == null ? 1 : d);

  /* ---------------- chemistry ---------------- */
  function haberEq(Tc, P) {                              // N2 + 3H2 ⇌ 2NH3, ΔH = −92 kJ, ΔS = −198.7 J/K, 1:3 feed
    const Tk = Tc + 273.15, K = Math.exp(-(-92000 + Tk * 198.7) / (Rg * Tk)); let lo = 0, hi = 0.99999;
    for (let i = 0; i < 70; i++) { const x = (lo + hi) / 2, t = 4 - 2 * x, yN = (1 - x) / t, yH = (3 - 3 * x) / t, yA = (2 * x) / t, Q = (yA * yA) / (yN * yH * yH * yH * P * P); if (Q < K) lo = x; else hi = x; }
    const x = (lo + hi) / 2, t = 4 - 2 * x; return { x, yN: (1 - x) / t, yH: (3 - 3 * x) / t, yA: (2 * x) / t, K };
  }
  function contactEq(Tc, P) {                            // 2SO2 + O2 ⇌ 2SO3, ΔH = −197 kJ, ΔS = −188 J/K, feed 7 % SO2, 11 % O2, 82 % N2
    const Tk = Tc + 273.15, K = Math.exp(-(-197000 + Tk * 188) / (Rg * Tk)); let lo = 0, hi = 0.99999;
    for (let i = 0; i < 70; i++) { const a = (lo + hi) / 2, tot = 100 - 3.5 * a, pS = ((7 * (1 - a)) / tot) * P, pO = ((11 - 3.5 * a) / tot) * P, pT = ((7 * a) / tot) * P, Q = (pT * pT) / (pS * pS * pO); if (Q < K) lo = a; else hi = a; }
    const a = (lo + hi) / 2, tot = 100 - 3.5 * a; return { a, ySO2: (7 * (1 - a)) / tot, yO2: (11 - 3.5 * a) / tot, ySO3: (7 * a) / tot, yN2: 82 / tot, K };
  }
  const rateRel = (Tc, Ea, cat, EaNo) => { const Tk = Tc + 273.15, E = cat ? Ea : EaNo; return Math.exp((-E / Rg) * (1 / Tk - 1 / 723.15)) * (cat ? 1 : Math.exp(-(EaNo - Ea) / (Rg * 723.15))); };
  function haberNums(c) { const e = haberEq(c.T, c.P), r = rateRel(c.T, 100000, c.cat, 230000), ap = 1 - Math.exp(-0.9 * r); return { e, r, ap, pass: e.yA * 100 * ap }; }
  function contactNums(c) { const e = contactEq(c.T, c.P), r = rateRel(c.T, 80000, c.cat, 190000), ap = 1 - Math.exp(-4 * r); return { e, r, ap, conv: e.a * 100 * ap }; }

  /* ---------------- crude oil ---------------- */
  const FR = [
    { n: "Refuse / petroleum gas", c: "C₁–C₄", bp: "below 40 °C", Tc: 30, share: 3, col: 0xbfe4ff, use: "bottled gas (LPG), fuel for cooking", visc: "very low" },
    { n: "Petrol (gasoline)", c: "C₅–C₁₀", bp: "40–180 °C", Tc: 110, share: 22, col: 0xf6e58d, use: "fuel for cars", visc: "low" },
    { n: "Kerosene (paraffin)", c: "C₁₀–C₁₆", bp: "180–250 °C", Tc: 215, share: 13, col: 0xf2c15e, use: "jet fuel, lamps, stoves", visc: "low–medium" },
    { n: "Diesel oil (gas oil)", c: "C₁₄–C₂₀", bp: "250–350 °C", Tc: 300, share: 20, col: 0xc9822c, use: "fuel for lorries, trains, generators", visc: "medium" },
    { n: "Lubricating / fuel oil", c: "C₂₀–C₅₀", bp: "350–500 °C", Tc: 380, share: 17, col: 0x6d4320, use: "lubricants, waxes, ship and furnace fuel", visc: "high" },
    { n: "Bitumen (residue)", c: "above C₅₀", bp: "above 500 °C", Tc: 9999, share: 25, col: 0x1a1612, use: "road surfacing, roofing", visc: "very high (solid-like)" },
  ];
  const ZONES = [   // furnace height fraction (0 bottom → 1 top)
    { lo: 0, hi: 0.18, name: "Hearth — molten iron and slag", Tn: "≈ 1500 °C", eq: "Fe(l) collects; the less dense molten slag (CaSiO₃) floats on top", note: "The two liquids are tapped off separately: iron from the lower tap-hole, slag from the upper." },
    { lo: 0.18, hi: 0.34, name: "Combustion zone (hot-air blast)", Tn: "≈ 1900 °C", eq: "C(s) + O₂(g) → CO₂(g)      ΔH = −394 kJ/mol", note: "Preheated air blown in at the bottom burns the coke: very exothermic — this heat keeps the furnace hot." },
    { lo: 0.34, hi: 0.5, name: "Reducing-gas and slag zone", Tn: "≈ 1200–1400 °C", eq: "CO₂(g) + C(s) → 2CO(g)      CaO + SiO₂ → CaSiO₃(l)", note: "Carbon dioxide is reduced by hot coke to carbon monoxide, the main reducing agent. Lime combines with sand impurity to form slag." },
    { lo: 0.5, hi: 0.65, name: "Limestone decomposes", Tn: "≈ 800–900 °C", eq: "CaCO₃(s) → CaO(s) + CO₂(g)", note: "Limestone is heated and decomposes; the calcium oxide (a basic oxide) will remove silica as slag." },
    { lo: 0.65, hi: 0.88, name: "Reduction of iron ore", Tn: "≈ 500–900 °C", eq: "Fe₂O₃(s) + 3CO(g) → 2Fe(s) + 3CO₂(g)", note: "Carbon monoxide takes the oxygen from haematite: the iron(III) oxide is reduced; CO is oxidised." },
    { lo: 0.88, hi: 1.0, name: "Charging and pre-heating", Tn: "≈ 200–400 °C", eq: "ore + coke + limestone fed in at the top; waste gas leaves", note: "The charge (haematite, coke, limestone) enters through the bell hopper; hot waste gases (CO, CO₂, N₂) leave and heat the incoming air." },
  ];
  const zoneAt = (z) => ZONES.find((q) => z >= q.lo && z < q.hi) || ZONES[ZONES.length - 1];
  const furnaceT = (h) => { const P = [[0, 1500], [0.12, 1600], [0.22, 1900], [0.34, 1450], [0.5, 1050], [0.65, 800], [0.88, 400], [1, 200]]; for (let i = 0; i < P.length - 1; i++) if (h >= P[i][0] && h <= P[i + 1][0]) return lerp(P[i][1], P[i + 1][1], (h - P[i][0]) / (P[i + 1][0] - P[i][0])); return 200; };

  /* ---------------- scene helpers ---------------- */
  const PAL = { N2: 0x3f8cff, H2: 0xf2f2f2, NH3: 0x45e08a, SO2: 0xf2d13a, O2: 0xff5a4a, SO3: 0xffffff, AIR: 0x7b8699, CO: 0x9ec1ff, CO2: 0xb9b2a8 };
  function pickMix(mix, hsh) { let a = 0; for (const [c, p] of mix) { a += p; if (hsh < a) return c; } return mix[mix.length - 1][0]; }
  function makeFlow(grp, pts, n, rad) {
    const cum = [0]; for (let i = 0; i < pts.length - 1; i++) cum.push(cum[i] + pts[i + 1].distanceTo(pts[i])); const L = cum[cum.length - 1];
    const im = new T.InstancedMesh(new T.SphereGeometry(rad, 10, 8), new T.MeshStandardMaterial({ roughness: 0.3, emissive: 0x151515 }), n); im.frustumCulled = false; grp.add(im);
    const u = [], ph = [], hs = []; for (let i = 0; i < n; i++) { u.push(i / n); ph.push(Math.random() * TAU); hs.push((i * 0.6180339) % 1); }
    const m4 = new T.Matrix4(), col = new T.Color(), v = V3();
    return { im, L, n, u, hs, update(dt, speed, mixFn, t, vis) {
      im.visible = vis !== false; if (!im.visible) return;
      for (let i = 0; i < n; i++) {
        u[i] = (u[i] + (dt * speed) / L) % 1; const d = u[i] * L; let k = 0; while (k < cum.length - 2 && d > cum[k + 1]) k++;
        const f = (d - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]); v.copy(pts[k]).lerp(pts[k + 1], f); v.x += Math.sin(ph[i] + t * 3) * 0.045; v.y += Math.cos(ph[i] * 1.3 + t * 2.4) * 0.045; v.z += Math.sin(ph[i] * 0.7 + t * 2.7) * 0.045;
        m4.makeTranslation(v.x, v.y, v.z); im.setMatrixAt(i, m4); col.setHex(pickMix(mixFn(u[i]), hs[i])); im.setColorAt(i, col);
      }
      im.instanceMatrix.needsUpdate = true; im.instanceColor && (im.instanceColor.needsUpdate = true);
    } };
  }
  function rodG(S, grp, a, b, r, mat) { const m = S.mk.rod(a, b, r, mat); S.scene.remove(m); grp.add(m); return m; }
  function pipe(S, grp, pts, r, mat) { for (let i = 0; i < pts.length - 1; i++) rodG(S, grp, pts[i], pts[i + 1], r, mat); pts.forEach((p, i) => { if (i > 0 && i < pts.length - 1) { const s = new T.Mesh(new T.SphereGeometry(r, 14, 10), mat); s.position.copy(p); grp.add(s); } }); }
  function cylM(grp, rt, rb, h, mat, x, y, z, rotZ) { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, 36), mat); m.position.set(x, y + (rotZ ? 0 : h / 2), z); if (rotZ) m.rotation.z = Math.PI / 2; m.castShadow = true; grp.add(m); return m; }
  function glassShell(grp, r, h, x, y, z, tint, op) { const m = new T.Mesh(new T.CylinderGeometry(r, r, h, 44, 1, true), new T.MeshPhysicalMaterial({ color: tint || 0xcfe8f5, transparent: true, opacity: op || 0.16, roughness: 0.06, clearcoat: 1, side: T.DoubleSide, depthWrite: false })); m.position.set(x, y + h / 2, z); m.renderOrder = 4; grp.add(m); return m; }
  const V = (x, y, z) => V3(x, y, z);

  C3.scenes.industrialProcesses = {
    env: "studio", envOpts: { top: "#0c1424", bottom: "#030509" }, envI: 0.75, fov: 38, free: true, cam: [[3.1, 4.6, 17.5], [3.1, 2.7, 0]],
    values: { proc: "haber", T: 450, P: 200, cat: 1, rec: 1, z: 0.75, blast: 1 },
    state: () => ({ t: 0, tank: 0, tap: 0, acc: 0, parts: [], col: [0, 0, 0, 0, 0, 0], built: null }),
    controls: [
      { type: "select", key: "proc", label: "Industrial process", options: [{ value: "haber", label: "Haber process — ammonia" }, { value: "contact", label: "Contact process — sulphuric acid" }, { value: "blast", label: "Blast furnace — extraction of iron" }, { value: "crude", label: "Fractional distillation of crude oil" }] },
      { type: "range", key: "T", label: "Temperature, T (°C) — reactor, or crude-oil furnace", min: 300, max: 650, step: 5, unit: " °C" },
      { type: "range", key: "P", label: "Pressure, P (atm) — Haber / Contact reactors", min: 1, max: 400, step: 1, unit: " atm" },
      { type: "toggle", key: "cat", label: "Catalyst present (Fe for Haber, V₂O₅ for Contact)" },
      { type: "toggle", key: "rec", label: "Recycle unreacted gases (Haber) / second absorption (Contact)" },
      { type: "range", key: "z", label: "Height in the furnace or column (0 = bottom, 1 = top)", min: 0, max: 1, step: 0.01 },
      { type: "button", label: "Set the usual industrial conditions", action: (S, s, c, rf) => { const d = { haber: [450, 200], contact: [450, 2], blast: [c.T, c.P], crude: [350, c.P] }[c.proc]; c.T = d[0]; c.P = d[1]; c.cat = 1; c.rec = 1; rf && rf(); } },
      { type: "button", label: "Tap the furnace / empty the tanks", action: (S, s) => { s.tap = 1; s.tank = 0; s.col = [0, 0, 0, 0, 0, 0]; } },
    ],
    views: [{ label: "Plant", cam: (S, s, c) => CAMS[c.proc] }, { label: "Unit close-up", cam: (S, s, c) => CLOSE[c.proc] }, { label: "Side view", cam: (S, s, c) => SIDE[c.proc] }],
    note: "Industry chooses conditions as a compromise between yield, rate and cost. Haber: high pressure and removing NH₃ raise the yield (4 gas moles → 2) but cost money; low T favours yield (the forward reaction is exothermic) yet is too slow, so ≈450 °C with an iron catalyst is the compromise. Contact: the equilibrium already lies far to the right at ≈450 °C, so only ≈2 atm is used with a V₂O₅ catalyst. Gas-mixture yields are calculated from Kp(T); the plant pictures are schematic.",
    onChange(S, s, c, key, rf) { if (key === "proc") { const d = { haber: [450, 200], contact: [450, 2], blast: [450, 2], crude: [350, 2] }[c.proc]; c.T = d[0]; c.P = d[1]; C3.setView(S, { cam: CAMS[c.proc] }); rf && rf(); } },
    reset(S, s, c, ) { Object.assign(c, { proc: "haber", T: 450, P: 200, cat: 1, rec: 1, z: 0.75, blast: 1 }); s.tank = 0; s.col = [0, 0, 0, 0, 0, 0]; },
    table(s, c) {
      const row = (a) => "<tr>" + a.map((x, i) => "<td" + (i ? "" : ' style="text-align:left"') + ">" + x + "</td>").join("") + "</tr>";
      if (c.proc === "haber") return '<table class="c3-table"><tr><th style="text-align:left">Change</th><th>Effect on equilibrium yield</th><th>Effect on rate</th></tr>' + row(["Raise T", "yield ↓ (exothermic)", "rate ↑"]) + row(["Raise P", "yield ↑ (4 → 2 mol gas)", "rate ↑"]) + row(["Catalyst (Fe)", "no change", "rate ↑ (lowers Eₐ)"]) + row(["Remove NH₃ (condense)", "yield ↑", "—"]) + row(["Industrial compromise", "≈ 450 °C, 200 atm, Fe", "unreacted N₂/H₂ recycled"]) + "</table>";
      if (c.proc === "contact") return '<table class="c3-table"><tr><th style="text-align:left">Stage</th><th>What happens</th></tr>' + row(["1  Make SO₂", "S(s) + O₂(g) → SO₂(g)   (or roast sulphide ores)"]) + row(["2  Purify", "remove dust and impurities that poison the catalyst"]) + row(["3  Convert", "2SO₂ + O₂ ⇌ 2SO₃   ≈450 °C, 1–2 atm, V₂O₅"]) + row(["4  Absorb", "SO₃ + H₂SO₄ → H₂S₂O₇ (oleum)"]) + row(["5  Dilute", "H₂S₂O₇ + H₂O → 2H₂SO₄"]) + "</table>";
      if (c.proc === "blast") return '<table class="c3-table"><tr><th style="text-align:left">Zone (top → bottom)</th><th>Temperature</th><th>Main reaction</th></tr>' + ZONES.slice().reverse().map((z, i) => '<tr class="' + (z === zoneAt(c.z) ? "ok" : "") + '"><td style="text-align:left">' + z.name + "</td><td>" + z.Tn + "</td><td>" + z.eq.split("      ")[0] + "</td></tr>").join("") + "</table>";
      return '<table class="c3-table"><tr><th style="text-align:left">Fraction</th><th>Carbon atoms</th><th>Boiling range</th><th style="text-align:left">Main use</th></tr>' + FR.map((f, i) => '<tr class="' + (i === s.sel ? "ok" : "") + '"><td style="text-align:left">' + f.n + "</td><td>" + f.c + "</td><td>" + f.bp + '</td><td style="text-align:left">' + f.use + "</td></tr>").join("") + "</table>";
    },
    build(S, s, c) {
      const sg = (g) => { g.visible = false; S.scene.add(g); return g; }, steel = M.steel(), dark = M.matte(0x1d222c, 0.45), paint = (c2) => M.paint(c2);
      s.g = { haber: sg(new T.Group()), contact: sg(new T.Group()), blast: sg(new T.Group()), crude: sg(new T.Group()) }; s.fl = { haber: [], contact: [] };
      /* ===== Haber / Contact: generic chain built from a spec ===== */
      const mkChain = (key, o) => {
        const g = s.g[key]; o.units.forEach((u) => { if (u.glass) { glassShell(g, u.glass, u.gh, u.x, u.y, u.z, u.tint, 0.2); cylM(g, u.r + 0.04, u.r + 0.04, 0.12, u.mat, u.x, u.y - 0.1, u.z); cylM(g, u.r + 0.04, u.r + 0.04, 0.12, u.mat, u.x, u.y + u.gh - 0.02, u.z); } else if (u.rot) cylM(g, u.r, u.r, u.h, u.mat, u.x, u.y, u.z, true); else cylM(g, u.r, u.r, u.h, u.mat, u.x, u.y, u.z); });
        o.boxes.forEach((b) => { const m = new T.Mesh(new T.BoxGeometry(b.w, b.h, b.d), b.mat); m.position.set(b.x, b.y, b.z); m.castShadow = true; g.add(m); });
        o.pipes.forEach((p) => pipe(S, g, p.pts, 0.045, steel));
        s.fl[key] = o.pipes.map((p) => Object.assign({ flow: makeFlow(g, p.pts, p.n, p.r || 0.06) }, p));
      };
      /* --- Haber --- */
      const catMat = new T.MeshStandardMaterial({ color: 0x8b4a22, roughness: 0.8, emissive: 0xff6a1a, emissiveIntensity: 0.3 });
      const hg = s.g.haber;
      mkChain("haber", {
        units: [{ r: 0.28, h: 1.6, x: -5.4, y: 0, z: 0.5, mat: paint(0x2a5fd0) }, { r: 0.28, h: 1.6, x: -5.4, y: 0, z: -0.5, mat: paint(0xd8d8d8) }, { r: 0.42, h: 1.6, x: -2.0, y: 1.0, z: 0, mat: paint(0x6a7a90), rot: 1 }, { r: 0.85, h: 4.4, x: 0.5, y: 0.2, z: 0, mat: M.matte(0x2a303c, 0.5), glass: 0.9, gh: 4.4, tint: 0xffd9a8 },
          { r: 0.5, h: 2.4, x: 3.1, y: 0.4, z: 0, mat: M.matte(0x2a303c, 0.5), glass: 0.55, gh: 2.4, tint: 0xa8d8ff }, { r: 0.65, h: 1.3, x: 4.8, y: 0, z: 0, mat: M.matte(0x2a303c, 0.5), glass: 0.7, gh: 1.3, tint: 0xd8ffe8 }],
        boxes: [{ w: 1.0, h: 0.9, d: 0.8, x: -3.7, y: 0.45, z: 0, mat: paint(0xb04a2a) }],
        pipes: [
          { pts: [V(-5.4, 1.7, 0.5), V(-5.4, 2.0, 0.0), V(-3.7, 2.0, 0), V(-3.7, 0.9, 0)], mix: () => [[PAL.N2, 0.25], [PAL.H2, 0.75]], n: 26, sp: 1.3, kind: "in" },
          { pts: [V(-3.2, 0.45, 0), V(-2.8, 0.45, 0), V(-2.8, 1.0, 0), V(-1.2, 1.0, 0), V(-0.4, 1.0, 0)], mix: () => [[PAL.N2, 0.25], [PAL.H2, 0.75]], n: 22, sp: 1.3, kind: "in" },
          { pts: [V(0.5, 0.5, 0), V(0.5, 4.5, 0)], mix: "reactor", n: 46, sp: 1.2, kind: "reactor", r: 0.07 },
          { pts: [V(0.5, 4.6, 0), V(0.5, 5.1, 0), V(3.1, 5.1, 0), V(3.1, 2.85, 0)], mix: "out", n: 30, sp: 1.3, kind: "out" },
          { pts: [V(3.1, 0.35, 0), V(4.3, 0.35, 0)], mix: () => [[PAL.NH3, 1]], n: 6, sp: 0.8, kind: "liq", r: 0.08 },
          { pts: [V(3.65, 1.4, 0), V(4.1, 1.4, 0), V(4.1, 5.7, 0), V(-3.4, 5.7, 0), V(-3.4, 0.95, 0)], mix: "rec", n: 36, sp: 1.3, kind: "rec" },
        ],
      });
      s.catBeds = [1.4, 2.4, 3.4].map((y) => { const m = new T.Mesh(new T.CylinderGeometry(0.82, 0.82, 0.3, 40), catMat.clone()); m.position.set(0.5, y, 0); hg.add(m); return m; });
      s.tankL = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 1, 32), new T.MeshPhysicalMaterial({ color: 0x45e08a, transparent: true, opacity: 0.6, roughness: 0.05 })); s.tankL.position.set(4.8, 0.05, 0); hg.add(s.tankL);
      /* --- Contact --- */
      const cg = s.g.contact;
      mkChain("contact", {
        units: [{ r: 0.5, h: 1.2, x: -5.0, y: 0, z: 0, mat: paint(0xd8a62a) }, { r: 0.45, h: 1.7, x: -3.2, y: 0.2, z: 0, mat: paint(0x6a7a90) }, { r: 0.85, h: 4.4, x: 0.4, y: 0.2, z: 0, mat: M.matte(0x2a303c, 0.5), glass: 0.9, gh: 4.4, tint: 0xffe29a }, { r: 0.7, h: 4.6, x: 3.4, y: 0.2, z: 0, mat: paint(0x8a93a4), glass: 0.75, gh: 4.6, tint: 0xd8d8e8 }, { r: 0.7, h: 1.2, x: 5.2, y: 0, z: 0, mat: M.matte(0x2a303c, 0.5), glass: 0.8, gh: 1.2, tint: 0xfff2c8 }],
        boxes: [],
        pipes: [
          { pts: [V(-4.5, 1.0, 0), V(-4.5, 1.6, 0), V(-3.2, 1.6, 0), V(-3.2, 1.8, 0), V(-3.2, 1.9, 0)], mix: () => [[PAL.SO2, 0.07], [PAL.O2, 0.11], [PAL.AIR, 0.82]], n: 24, sp: 1.3, kind: "in", r: 0.055 },
          { pts: [V(-2.8, 0.6, 0), V(-2.0, 0.6, 0), V(-2.0, 1.0, 0), V(-0.4, 1.0, 0)], mix: () => [[PAL.SO2, 0.07], [PAL.O2, 0.11], [PAL.AIR, 0.82]], n: 24, sp: 1.3, kind: "in", r: 0.055 },
          { pts: [V(0.4, 0.5, 0), V(0.4, 4.5, 0)], mix: "reactor", n: 50, sp: 1.2, kind: "reactor", r: 0.06 },
          { pts: [V(0.4, 4.6, 0), V(0.4, 5.1, 0), V(3.4, 5.1, 0), V(3.4, 4.85, 0)], mix: "out", n: 26, sp: 1.3, kind: "out", r: 0.055 },
          { pts: [V(3.4, 0.4, 0), V(4.2, 0.4, 0), V(4.2, 0.3, 0), V(4.6, 0.3, 0)], mix: () => [[PAL.SO3, 1]], n: 5, sp: 0.8, kind: "liq", r: 0.08 },
          { pts: [V(3.4, 4.4, 0), V(4.0, 4.4, 0), V(4.0, 5.6, 0), V(5.2, 5.6, 0)], mix: "rec", n: 14, sp: 1.2, kind: "rec", r: 0.05 },
        ],
      });
      s.catBeds2 = [1.2, 2.1, 3.0, 3.9].map((y) => { const m = new T.Mesh(new T.CylinderGeometry(0.82, 0.82, 0.22, 40), new T.MeshStandardMaterial({ color: 0xc89a2a, roughness: 0.8, emissive: 0xffaa22, emissiveIntensity: 0.3 })); m.position.set(0.4, y, 0); cg.add(m); return m; });
      /* --- Blast furnace --- */
      const bg = s.g.blast, prof = [[1.0, 0], [1.05, 0.8], [1.25, 1.4], [1.7, 3.0], [1.75, 3.9], [1.35, 5.2], [1.0, 5.9]];
      const lathe = new T.Mesh(new T.LatheGeometry(prof.map(([r, y]) => V3(r, y, 0).setZ(0)).map((v) => new T.Vector2(v.x, v.y)), 56), new T.MeshPhysicalMaterial({ color: 0xb8c4d0, transparent: true, opacity: 0.2, roughness: 0.2, metalness: 0.4, side: T.DoubleSide, depthWrite: false })); lathe.renderOrder = 4; lathe.position.set(0, 0, 0); bg.add(lathe);
      const shellEdge = new T.Mesh(new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r + 0.07, y)), 56, 0.2, 5.8), new T.MeshStandardMaterial({ color: 0x59606c, roughness: 0.5, metalness: 0.7, side: T.DoubleSide })); bg.add(shellEdge);
      s.zoneBands = ZONES.map((z) => { const y0 = z.lo * 5.9, y1 = z.hi * 5.9, rr = (y) => { for (let i = 0; i < prof.length - 1; i++) if (y <= prof[i + 1][1]) return lerp(prof[i][0], prof[i + 1][0], (y - prof[i][1]) / (prof[i + 1][1] - prof[i][1])); return 1; }; const m = new T.Mesh(new T.CylinderGeometry(rr(y1) - 0.05, rr(y0) - 0.05, y1 - y0 - 0.03, 36, 1, true), new T.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); m.position.y = (y0 + y1) / 2; bg.add(m); return m; });
      s.melt = new T.Mesh(new T.CylinderGeometry(0.96, 0.96, 0.5, 36), new T.MeshStandardMaterial({ color: 0xff9a3a, emissive: 0xff5a10, emissiveIntensity: 1.2, roughness: 0.3 })); s.melt.position.y = 0.3; bg.add(s.melt);
      s.slag = new T.Mesh(new T.CylinderGeometry(0.96, 0.96, 0.18, 36), new T.MeshStandardMaterial({ color: 0xc9a850, emissive: 0x9a6a10, emissiveIntensity: 0.6, roughness: 0.5 })); s.slag.position.y = 0.64; bg.add(s.slag);
      for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4, tu = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.5, 14), steel); tu.rotation.z = Math.PI / 2; tu.position.set(Math.cos(a) * 1.55, 1.35, Math.sin(a) * 1.55); tu.rotation.y = -a; tu.rotation.set(0, 0, 0); bg.add(tu); }
      s.ring = new T.Mesh(new T.TorusGeometry(1.65, 0.1, 12, 48), M.paint(0x8a3a2a)); s.ring.rotation.x = Math.PI / 2; s.ring.position.y = 1.5; bg.add(s.ring);
      cylM(bg, 0.25, 0.25, 1.1, steel, 0, 5.9, 0); cylM(bg, 0.5, 0.2, 0.28, M.paint(0x59606c), 0, 5.65, 0);
      s.ladle = [0, 1].map((k) => { const m = new T.Mesh(new T.CylinderGeometry(0.4, 0.3, 0.45, 24), M.matte(0x3a2a22, 0.6)); m.position.set(k ? 2.4 : -2.4, 0.22, 0); bg.add(m); const f = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.05, 24), new T.MeshStandardMaterial({ color: k ? 0xc9a850 : 0xff9a3a, emissive: k ? 0x9a6a10 : 0xff5a10, emissiveIntensity: 0.9 })); f.position.set(k ? 2.4 : -2.4, 0.2, 0); bg.add(f); return f; });
      /* charge, gas particles */
      const N = 220; s.charge = new T.InstancedMesh(new T.IcosahedronGeometry(0.075, 0), new T.MeshStandardMaterial({ roughness: 0.8 }), N); s.charge.frustumCulled = false; bg.add(s.charge); s.cp = []; for (let i = 0; i < N; i++) s.cp.push({ y: Math.random() * 5.8, a: Math.random() * TAU, r: Math.sqrt(Math.random()), t: Math.floor(Math.random() * 5), v: 0.2 + Math.random() * 0.15 });
      s.gasI = new T.InstancedMesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }), 120); s.gasI.frustumCulled = false; bg.add(s.gasI); s.gp = []; for (let i = 0; i < 120; i++) s.gp.push({ y: Math.random() * 5.8, a: Math.random() * TAU, r: Math.sqrt(Math.random()), v: 0.7 + Math.random() * 0.7 });
      /* --- Crude column --- */
      const kg = s.g.crude, trays = 8;
      glassShell(kg, 0.95, 6.3, 0, 0.2, 0, 0xd8e4f0, 0.18); cylM(kg, 1.0, 1.0, 0.2, steel, 0, 0.0, 0); cylM(kg, 0.95, 0.4, 0.5, steel, 0, 6.5, 0);
      s.trayM = []; for (let i = 0; i < trays; i++) { const y = 0.9 + i * 0.7, m = new T.Mesh(new T.CylinderGeometry(0.93, 0.93, 0.045, 36), M.matte(0x8a95a6, 0.35)); m.position.y = y; kg.add(m); s.trayM.push(y); for (let j = 0; j < 3; j++) { const cap = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 0.1, 14), steel); cap.position.set(-0.45 + j * 0.45, y + 0.07, 0.25 * (j % 2 ? -1 : 1)); kg.add(cap); } }
      cylM(kg, 0.55, 0.55, 1.1, paint(0xc65a2a), -3.6, 0.2, 0); cylM(kg, 0.38, 0.38, 0.9, dark, -3.6, 1.3, 0);
      pipe(S, kg, [V(-3.2, 0.6, 0), V(-1.6, 0.6, 0), V(-1.0, 1.2, 0)], 0.06, steel);
      const DRAW = [6.25, 5.0, 3.2, 1.8, 0.95, 0.35]; s.DRAW = DRAW;
      s.tanks = FR.map((f, i) => { const x = 5.1 - i * 0.62, t = new T.Mesh(new T.CylinderGeometry(0.27, 0.27, 0.9, 24, 1, true), new T.MeshPhysicalMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.2, roughness: 0.06, side: T.DoubleSide, depthWrite: false })); t.position.set(x, 0.45, 0); kg.add(t); const l = new T.Mesh(new T.CylinderGeometry(0.245, 0.245, 1, 24), new T.MeshStandardMaterial({ color: f.col, roughness: 0.25 })); l.position.set(x, 0.05, 0); kg.add(l); pipe(S, kg, [V(0.95, DRAW[i], 0), V(x, DRAW[i], 0), V(x, 0.95, 0)], 0.032, steel); return { l, x }; });
      s.vap = new T.InstancedMesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), 260); s.vap.frustumCulled = false; kg.add(s.vap); s.vp = []; for (let i = 0; i < 260; i++) s.vp.push({ on: false, y: 0, x: 0, z: 0, f: 0, st: 0, side: 0 });
      s.m4 = new T.Matrix4(); s.cl = new T.Color(); s.sel = 0;
    },
    update(S, s, c, dt) {
      const pr = c.proc; Object.keys(s.g).forEach((k) => { s.g[k].visible = k === pr; }); s.t += dt;
      if (pr === "haber" || pr === "contact") {
        const isH = pr === "haber", N = isH ? haberNums(c) : contactNums(c), fl = s.fl[pr], e = N.e, ap = isH ? N.ap : N.ap;
        const inMix = isH ? [[PAL.N2, 0.25], [PAL.H2, 0.75]] : [[PAL.SO2, 0.07], [PAL.O2, 0.11], [PAL.AIR, 0.82]];
        const frac = isH ? N.e.yA * N.ap : (7 * N.e.a * N.ap) / (100 - 3.5 * N.e.a * N.ap);
        let outMix; if (isH) { const yA = N.e.yA * N.ap / (1 - 0.0) , rest = 1 - yA; outMix = [[PAL.NH3, clamp(yA, 0, 0.99)], [PAL.N2, rest * 0.25], [PAL.H2, rest * 0.75]]; } else { const a = N.e.a * N.ap, tot = 100 - 3.5 * a; outMix = [[PAL.SO3, (7 * a) / tot], [PAL.SO2, (7 * (1 - a)) / tot], [PAL.O2, (11 - 3.5 * a) / tot], [PAL.AIR, 82 / tot]]; }
        const recMix = isH ? [[PAL.N2, 0.25], [PAL.H2, 0.75]] : [[PAL.SO2, 0.3], [PAL.O2, 0.2], [PAL.AIR, 0.5]];
        const reactorMix = (u) => (u < 0.25 ? inMix : u < 0.75 ? inMix.map(([cc, p], i) => [cc, p]).concat([]) : outMix);
        const rm = (u) => { const k = clamp((u - 0.25) / 0.5, 0, 1); if (k <= 0) return inMix; if (k >= 1) return outMix; return outMix.map(([cc, p]) => [cc, p * k]).concat(inMix.map(([cc, p]) => [cc, p * (1 - k)])); };
        const sp = clamp(0.4 + 0.9 * (c.T / 450), 0.4, 1.8);
        fl.forEach((f) => { const mix = f.mix === "reactor" ? rm : f.mix === "out" ? () => outMix : f.mix === "rec" ? () => recMix : f.mix; const vis = f.kind === "rec" ? !!c.rec : true; f.flow.update(dt, f.sp * 1.0 * (0.7 + 0.5 * N.r ** 0.2 * 0.8), mix, s.t, vis); });
        const beds = isH ? s.catBeds : s.catBeds2, hot = clamp((c.T - 300) / 350, 0, 1);
        beds.forEach((b) => { b.material.emissiveIntensity = (c.cat ? 0.25 + 0.6 * hot : 0.05) * (0.9 + 0.1 * Math.sin(S.t * 4)); b.material.color.setHex(c.cat ? (isH ? 0x8b4a22 : 0xc89a2a) : 0x444444); });
        if (isH) { s.acc += dt * frac * 0.9; s.tank = clamp(s.tank + dt * frac * 0.12 * (c.rec ? 1 : 0.8), 0, 1); s.tankL.scale.y = Math.max(0.01, s.tank * 1.15); s.tankL.position.y = 0.05 + s.tankL.scale.y * 0.5; }
      } else if (pr === "blast") {
        const z = c.z, bz = zoneAt(z); const bl = 0.6 + 0.8 * (c.blast == null ? 1 : c.blast);
        s.zoneBands.forEach((m, i) => { const cur = ZONES[i] === bz; m.material.opacity = cur ? 0.5 : 0.1 + 0.08 * Math.sin(S.t * 2 + i); m.material.color.setHex(cur ? 0xffb43a : 0xff5a1a); });
        const tapOn = s.tap > 0; if (tapOn) { s.tap = Math.max(0, s.tap - dt * 0.35); } s.ladle[0].scale.set(1, 1, 1); s.ladle[0].position.y = 0.2 + (1 - s.tap) * 0.18 * 0 + 0.15 * (1 - s.tap) * (s.tapDone || 0); if (dt > 0 && s.tap > 0) s.tapDone = Math.min(1, (s.tapDone || 0) + dt * 0.4);
        s.melt.scale.y = 1 + 0.15 * Math.sin(S.t * 1.7); s.melt.material.emissiveIntensity = 1.1 + 0.2 * Math.sin(S.t * 3);
        const colHex = [0x8a2a14, 0x222222, 0xe9e4d8, 0xc7a15a, 0xb5b0a8], W = 5.8;
        for (let i = 0; i < s.cp.length; i++) { const p = s.cp[i]; p.y -= dt * p.v * bl * 0.55; if (p.y < 0.75) { p.y = 5.8; p.a = Math.random() * TAU; p.r = Math.sqrt(Math.random()); } const hh = p.y / 5.9, rr = (hh < 0.2 ? 0.95 : hh < 0.6 ? 0.95 + (hh - 0.2) * 1.9 : 1.75 - (hh - 0.6) * 1.4) * 0.88 * p.r; s.m4.makeTranslation(Math.cos(p.a) * rr, p.y, Math.sin(p.a) * rr); s.charge.setMatrixAt(i, s.m4); const t = hh < 0.35 && p.t === 2 ? 0xe9e4d8 : colHex[p.t % 3]; s.cl.setHex(hh < 0.28 ? 0x8a8a8a : hh < 0.5 && p.t === 0 ? 0x9a9a9a : colHex[p.t % 3]); s.charge.setColorAt(i, s.cl); }
        s.charge.instanceMatrix.needsUpdate = true; s.charge.instanceColor && (s.charge.instanceColor.needsUpdate = true);
        for (let i = 0; i < s.gp.length; i++) { const p = s.gp[i]; p.y += dt * p.v * bl; if (p.y > 5.85) { p.y = 1.35; p.a = Math.random() * TAU; p.r = Math.sqrt(Math.random()); } const hh = p.y / 5.9, rr = (hh < 0.2 ? 0.95 : hh < 0.6 ? 0.95 + (hh - 0.2) * 1.9 : 1.75 - (hh - 0.6) * 1.4) * 0.8 * p.r; s.m4.makeTranslation(Math.cos(p.a) * rr + Math.sin(S.t * 3 + i) * 0.03, p.y, Math.sin(p.a) * rr); s.gasI.setMatrixAt(i, s.m4); s.cl.setHex(hh < 0.3 ? 0xffd27a : hh < 0.55 ? 0x9ec1ff : 0xb9b2a8); s.gasI.setColorAt(i, s.cl); }
        s.gasI.instanceMatrix.needsUpdate = true; s.gasI.instanceColor && (s.gasI.instanceColor.needsUpdate = true);
      } else if (pr === "crude") {
        const Tf = c.T, Tof = (h) => Tf - (Tf - 35) * h, topY = 6.3, botY = 0.9;
        const vapFrac = (f) => clamp((Tf - (f.Tc - 55)) / 70, 0, 1) * (f.Tc > 9000 ? 0 : 1);
        if (dt > 0) { s.acc += dt * 22; while (s.acc >= 1) { s.acc -= 1; let r = Math.random() * 100, k = 0; while (k < 5 && r > FR[k].share) { r -= FR[k].share; k++; } const f = FR[k], q = s.vp.find((p) => !p.on); if (!q) break; if (Math.random() < vapFrac(f)) { Object.assign(q, { on: true, y: 0.8, x: (Math.random() - 0.5) * 1.1, z: (Math.random() - 0.5) * 0.5, f: k, st: 0 }); } else if (k >= 4 || Tf < 330) { s.col[k] = Math.min(1, s.col[k] + 0.0009 * (k === 5 ? 1.5 : 1)); } } }
        s.vp.forEach((q, i) => { if (!q.on) { s.m4.makeScale(0, 0, 0); s.vap.setMatrixAt(i, s.m4); return; } const f = FR[q.f], hC = Tf <= f.Tc || f.Tc > 9000 ? 0 : clamp((Tf - f.Tc) / (Tf - 35), 0.02, 1), yCond = lerp(0.9, 6.3, hC);
          if (q.st === 0) { q.y += dt * 1.25; q.x += Math.sin(S.t * 3 + i) * 0.01; if (q.y >= yCond || q.y > 6.25) { if (q.f === 0 || f.Tc > 9000) { q.st = 2; } else q.st = 1; } }
          else if (q.st === 1) { q.x += dt * 1.6; q.y -= dt * 0.0; if (q.x > 0.95) { q.st = 3; } }
          else if (q.st === 2) { q.y += dt * 2.0; if (q.y > 6.9) { q.on = false; s.col[0] = Math.min(1, s.col[0] + 0.0012); } }
          if (q.st === 3) { s.col[q.f] = Math.min(1, s.col[q.f] + 0.0018); q.on = false; }
          s.m4.makeTranslation(q.x, q.y, q.z); s.vap.setMatrixAt(i, s.m4); s.cl.setHex(q.st === 1 ? f.col : q.st === 2 ? 0xdfe9f5 : 0xf6f6f6); s.vap.setColorAt(i, s.cl); });
        s.vap.instanceMatrix.needsUpdate = true; s.vap.instanceColor && (s.vap.instanceColor.needsUpdate = true);
        s.tanks.forEach((t, i) => { const h = Math.max(0.01, s.col[i] * 0.85); t.l.scale.y = h; t.l.position.y = 0.05 + h / 2; });
        { const yy = c.z * 6.2 + 0.2; let b = 0, bd = 99; s.DRAW.forEach((y, k) => { const d = Math.abs(y - yy); if (d < bd) { bd = d; b = k; } }); s.sel = b; }
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const pr = c.proc; ctx.save();
      if (pr === "haber" || pr === "contact") {
        const isH = pr === "haber", N = isH ? haberNums(c) : contactNums(c), e = N.e;
        H.pill(ctx, 10, 22, isH ? "N₂(g) + 3H₂(g) ⇌ 2NH₃(g)   ΔH = −92 kJ/mol" : "2SO₂(g) + O₂(g) ⇌ 2SO₃(g)   ΔH = −197 kJ/mol", "#ffe9b8", 10.5);
        H.pill(ctx, 10, 44, "T = " + c.T + " °C   P = " + c.P + " atm   catalyst: " + (c.cat ? (isH ? "Fe" : "V₂O₅") : "none"), "#9fe3ff", 10);
        const yv = isH ? e.yA * 100 : e.a * 100;
        const gx = 392, gy = 58, gw = 244, gh = 170, TS = []; for (let T0 = 300; T0 <= 650; T0 += 10) TS.push(T0);
        const Ps = isH ? [100, 200, 400] : [1, 2, 10], cols = ["#7ab8ff", "#ffd27a", "#ff9a7a"];
        H.graph(ctx, gx, gy, gw, gh, { series: Ps.map((P0, i) => ({ pts: TS.map((T0) => [T0, (isH ? haberEq(T0, P0).yA : contactEq(T0, P0).a) * 100]), color: cols[i], width: 1.6 })), xmin: 300, xmax: 650, ymin: 0, ymax: 100, ticksX: 7, ticksY: 5, xl: "T / °C", yl: isH ? "% NH₃ at equilibrium" : "% SO₂ converted", dot: [clamp(c.T, 300, 650), yv, "#ffffff"] });
        ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; Ps.forEach((P0, i) => { ctx.fillStyle = cols[i]; ctx.fillText(P0 + " atm", gx + 42 + i * 52, gy + 28); });
        const bx = 392, by = 234; H.panel(ctx, bx, by, 244, 62); ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff";
        ctx.fillText("equilibrium " + (isH ? "NH₃" : "SO₃") + " = " + fmt(yv, 1) + " %", bx + 8, by + 15);
        ctx.fillText("relative rate = " + (N.r < 0.001 ? N.r.toExponential(1) : fmt(N.r, 2)) + "  (1 = 450 °C, cat.)", bx + 8, by + 29);
        ctx.fillStyle = "#ffd27a"; ctx.fillText(isH ? "yield per pass ≈ " + fmt(N.pass, 1) + " %" : "conversion ≈ " + fmt(N.conv, 1) + " %", bx + 8, by + 43);
        ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText(isH ? (c.rec ? "unreacted N₂/H₂ recycled → overall ≈ 98 %" : "no recycling: unreacted gas is wasted") : (c.P > 10 ? "high P is unnecessary and expensive here" : "high conversion even at ~2 atm"), bx + 8, by + 56);
        const key = [[PAL.N2, "N₂"], [PAL.H2, "H₂"], [PAL.NH3, "NH₃"]]; const key2 = [[PAL.SO2, "SO₂"], [PAL.O2, "O₂"], [PAL.SO3, "SO₃"], [PAL.AIR, "N₂"]]; (isH ? key : key2).forEach(([hx, t], i) => { ctx.fillStyle = "#" + hx.toString(16).padStart(6, "0"); ctx.beginPath(); ctx.arc(18 + i * 52, 66, 5, 0, 6.3); ctx.fill(); ctx.fillStyle = "#bcd0ea"; ctx.fillText(t, 27 + i * 52, 69); });
        const lab = (x, y, z, t) => { const q = S.proj(V3(x, y, z)); H.pill(ctx, q.x, q.y, t, "#bcd0ea", 8.5, "center"); };
        if (isH) { lab(-5.4, 2.0, 0, "N₂ + H₂ (1 : 3)"); lab(-3.7, 1.1, 0, "compressor"); lab(0.5, 4.95, 0, "reactor"); lab(3.1, 3.0, 0, "condenser"); lab(4.8, 1.5, 0, "liquid NH₃"); lab(-0.3, 5.9, 0, "recycle"); }
        else { lab(-5.0, 1.4, 0, "burn sulphur"); lab(-3.2, 2.1, 0, "purify"); lab(0.4, 4.95, 0, "converter (V₂O₅)"); lab(3.4, 5.0, 0, "absorber"); lab(5.2, 1.4, 0, "H₂SO₄"); }
      } else if (pr === "blast") {
        const bz = zoneAt(c.z); H.pill(ctx, 10, 22, "Blast furnace — extraction of iron", "#ffe9b8", 11); H.pill(ctx, 10, 44, "height " + fmt(c.z * 100, 0) + " % · " + bz.name, "#ffb43a", 10);
        const gx = 392, gy = 58, gw = 244, gh = 150; const hs = []; for (let hh = 0; hh <= 1.0001; hh += 0.02) hs.push([furnaceT(hh), hh * 100]);
        H.graph(ctx, gx, gy, gw, gh, { series: [{ pts: hs, color: "#ff9a4a", width: 1.8 }], xmin: 0, xmax: 2000, ymin: 0, ymax: 100, ticksX: 4, ticksY: 5, xl: "T / °C", yl: "height %", dot: [furnaceT(c.z), c.z * 100, "#ffffff"] });
        const px = 392, py = 214, pw = 244, ph = 82; H.panel(ctx, px, py, pw, ph); ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#ffd27a"; ctx.fillText(bz.Tn + "  (" + fmt(furnaceT(c.z), 0) + " °C here)", px + 8, py + 14); ctx.fillStyle = "#e8f0ff"; let y = py + 29; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText(bz.eq.split("      ")[0], px + 8, y); const rest = bz.eq.split("      ")[1]; if (rest) ctx.fillText(rest.trim(), px + 8, y + 12);
        ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrap(ctx, bz.note, px + 8, py + (rest ? 54 : 44), pw - 16, 10);
        const lab = (x, y2, t, col) => { const q = S.proj(V3(x, y2, 0)); H.pill(ctx, q.x, q.y, t, col || "#bcd0ea", 8.5, "center"); };
        lab(0, 6.9, "waste gas out", "#b9b2a8"); lab(0, 6.1, "charge in: haematite, coke, limestone"); lab(2.4, 1.0, "slag", "#e6c76a"); lab(-2.4, 1.0, "molten iron", "#ff9a3a"); lab(-2.2, 1.9, "hot-air blast →", "#ffd27a");
      } else {
        H.pill(ctx, 10, 22, "Fractional distillation of crude oil", "#ffe9b8", 11); H.pill(ctx, 10, 44, "crude oil heated to " + c.T + " °C" + (c.T > 400 ? " — too hot: molecules begin to crack!" : c.T < 330 ? " — too cool: heavy fractions stay liquid" : ""), c.T > 400 ? "#ff9a7a" : "#9fe3ff", 10);
        const f = FR[s.sel]; const px = 392, py = 58, pw = 244; H.panel(ctx, px, py, pw, 150); ctx.textAlign = "left"; ctx.font = "600 10px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#" + f.col.toString(16).padStart(6, "0"); ctx.fillText(f.n, px + 8, py + 16); ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; ctx.fillText("carbon atoms: " + f.c, px + 8, py + 34); ctx.fillText("boiling range: " + f.bp, px + 8, py + 48); ctx.fillText("viscosity: " + f.visc, px + 8, py + 62); ctx.fillStyle = "#ffd27a"; wrap(ctx, "use: " + f.use, px + 8, py + 78, pw - 16, 11);
        ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrap(ctx, "Down the column: longer chains → higher boiling point, more viscous, darker, harder to ignite. Vapours rise until the column is cooler than their boiling point, then condense.", px + 8, py + 108, pw - 16, 10);
        FR.forEach((fr, i) => { const q = S.proj(V3(5.1 - i * 0.62, 1.15 + (i % 2) * 0.32, 0)); H.pill(ctx, q.x, q.y, ["gas", "petrol", "kerosene", "diesel", "oil", "bitumen"][i], i === s.sel ? "#ffd27a" : "#8fa6c8", 8, "center"); });
        const q = S.proj(V3(-3.6, 1.9, 0)); H.pill(ctx, q.x, q.y, "furnace", "#bcd0ea", 8.5, "center"); const q2 = S.proj(V3(0, 7.2, 0)); H.pill(ctx, q2.x, q2.y, "cooler ↑ (35 °C)", "#9fb2d2", 8.5, "center"); const q3 = S.proj(V3(0, 0.15, 0)); H.pill(ctx, q3.x, q3.y + 8, "hotter ↓ (" + c.T + " °C)", "#ff9a7a", 8.5, "center");
      }
      ctx.restore();
    },
    readouts(s, c) {
      if (c.proc === "haber") { const N = haberNums(c); return [["Process", "Haber: N₂ + 3H₂ ⇌ 2NH₃, ΔH = −92 kJ/mol"], ["Conditions", c.T + " °C, " + c.P + " atm, " + (c.cat ? "Fe catalyst" : "no catalyst")], ["Kp (atm⁻²)", N.e.K.toExponential(2)], ["NH₃ at equilibrium", fmt(N.e.yA * 100, 1) + " % (mole fraction)"], ["Relative rate", N.r < 0.001 ? N.r.toExponential(1) : fmt(N.r, 2)], ["Yield per pass (estimate)", fmt(N.pass, 1) + " %"], ["Why 450 °C, 200 atm?", "T low enough for a decent yield, high enough for an acceptable rate; P high for yield but limited by cost and safety"]]; }
      if (c.proc === "contact") { const N = contactNums(c); return [["Process", "Contact: 2SO₂ + O₂ ⇌ 2SO₃, ΔH = −197 kJ/mol"], ["Conditions", c.T + " °C, " + c.P + " atm, " + (c.cat ? "V₂O₅ catalyst" : "no catalyst")], ["Kp (atm⁻¹)", N.e.K.toExponential(2)], ["SO₂ converted at equilibrium", fmt(N.e.a * 100, 1) + " %"], ["Relative rate", N.r < 0.001 ? N.r.toExponential(1) : fmt(N.r, 2)], ["Conversion (estimate)", fmt(N.conv, 1) + " %"], ["Next stages", "SO₃ + H₂SO₄ → H₂S₂O₇ (oleum); then H₂S₂O₇ + H₂O → 2H₂SO₄ (SO₃ is not added to water directly: the reaction is violent and makes a mist)"]]; }
      if (c.proc === "blast") { const m = 1000, nF = (m * 1000) / 159.69, fe = nF * 2 * 55.845 / 1000, co = nF * 3 * 28.01 / 1000, co2 = nF * 3 * 44.01 / 1000, z = zoneAt(c.z); return [["Zone", z.name], ["Temperature here", fmt(furnaceT(c.z), 0) + " °C"], ["Reaction", z.eq.replace(/ {2,}/g, "  ;  ")], ["Per 1000 kg Fe₂O₃ (Mr 159.7)", "→ " + fmt(fe, 0) + " kg Fe  (2Fe per Fe₂O₃, Ar Fe = 55.8)"], ["CO needed", fmt(co, 0) + " kg"], ["CO₂ formed", fmt(co2, 0) + " kg"], ["Mass check", "1000 + " + fmt(co, 0) + " = " + fmt(1000 + co, 0) + " kg  =  " + fmt(fe, 0) + " + " + fmt(co2, 0) + " = " + fmt(fe + co2, 0) + " kg"]]; }
      const f = FR[s.sel]; return [["Fraction at this height", f.n], ["Carbon atoms per molecule", f.c], ["Boiling range", f.bp], ["Typical share of the crude", f.share + " %"], ["Main use", f.use], ["Trend", "chain length ↑ → boiling point ↑, viscosity ↑, volatility ↓, flammability ↓"]];
    },
    steps(s, c) {
      if (c.proc === "haber") return [["Compress N₂ and H₂ (1 : 3) to ~200 atm and pre-heat", "done"], ["Pass over Fe catalyst at ~450 °C (partial conversion)", "now"], ["Cool: NH₃ liquefies and is drawn off", ""], ["Recycle the unreacted N₂ and H₂ back to the compressor", c.rec ? "done" : ""]];
      if (c.proc === "contact") return [["Burn sulphur: S + O₂ → SO₂, then purify the gas", "done"], ["Convert over V₂O₅ at ~450 °C, 1–2 atm: 2SO₂ + O₂ ⇌ 2SO₃", "now"], ["Absorb SO₃ in concentrated H₂SO₄ → oleum", ""], ["Dilute the oleum with water to make H₂SO₄", ""]];
      if (c.proc === "blast") return [["Charge ore, coke and limestone at the top", "done"], ["Blow hot air in near the bottom: coke burns, CO forms", "now"], ["CO reduces Fe₂O₃ to iron; limestone forms slag", ""], ["Tap molten iron and slag from the hearth", s.tap > 0 ? "now" : ""]];
      return [["Heat crude oil to ~350 °C so most of it vaporises", "done"], ["Vapours rise through trays in the column", "now"], ["Each fraction condenses where the column is cooler than its boiling point", ""], ["Draw off the liquids; the residue (bitumen) leaves at the bottom", ""]];
    },
  };
  function wrap(ctx, text, x, y, maxW, lh) { const words = String(text).split(" "); let line = ""; for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = wd; } else line = t; } if (line) ctx.fillText(line, x, y); return y + lh; }
})();
