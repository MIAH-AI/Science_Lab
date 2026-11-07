/* c3d-electrolysis.js — chemistry 3D, batch C (part 2): electrolysis & Faraday's laws */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const F = 96500, VM = 24.0;                                    // C/mol, dm³/mol of gas at r.t.p.
  const BX = -2.0, XC = BX - 0.45, XA = BX + 0.45, TUBE_H = 3.1, TUBE_Y0 = 0.45, TUBE_CAP = 300;   // tube drawn to hold 300 cm³ of gas (illustrative scale)
  const GAS = { H2: { l: "H₂", col: 0xe9f4ff, op: 0.32, test: "burns with a squeaky pop" }, O2: { l: "O₂", col: 0xdceaff, op: 0.3, test: "relights a glowing splint" }, Cl2: { l: "Cl₂", col: 0xb5df4c, op: 0.55, test: "bleaches damp litmus paper" }, Br2: { l: "Br₂", col: 0xb45a1c, op: 0.6, test: "red-brown vapour" } };
  const CASES = {
    cuC: { name: "Copper(II) sulfate solution, graphite electrodes", liq: [86, 150, 232, 0.4], qmax: 38600, ions: [[0x4f94e8, 1], [0xffd24a, -1], [0x4f94e8, 1], [0xffd24a, -1], [0xff4a3a, 1], [0x4a8dff, -1]], ca: { t: "m", sym: "Cu", M: 63.5, n: 2, col: 0xc8733a, eq: "Cu²⁺ + 2e⁻ → Cu" }, an: { t: "g", g: "O2", ne: 4, eq: "4OH⁻ → 2H₂O + O₂ + 4e⁻" }, elC: 0x2b2d31, elA: 0x2b2d31, note: "Cu²⁺ is discharged at the cathode (below H⁺ in the reactivity series); OH⁻ is discharged at the anode, so O₂ is released and the blue colour fades." },
    cuCu: { name: "Copper(II) sulfate solution, copper electrodes (refining)", liq: [86, 150, 232, 0.4], qmax: 1e9, ions: [[0x4f94e8, 1], [0xffd24a, -1], [0x4f94e8, 1], [0xffd24a, -1]], ca: { t: "m", sym: "Cu", M: 63.5, n: 2, col: 0xc8733a, eq: "Cu²⁺ + 2e⁻ → Cu" }, an: { t: "d", sym: "Cu", M: 63.5, n: 2, eq: "Cu → Cu²⁺ + 2e⁻" }, elC: 0xc8733a, elA: 0xc8733a, note: "The copper anode dissolves and an equal mass of pure copper plates the cathode, so the blue colour stays the same. This is how copper is refined and how objects are electroplated." },
    ag: { name: "Silver nitrate solution, graphite electrodes", liq: [200, 228, 244, 0.16], qmax: 19300, ions: [[0xe6e9ee, 1], [0x4fd6c6, -1], [0xe6e9ee, 1], [0x4fd6c6, -1]], ca: { t: "m", sym: "Ag", M: 107.9, n: 1, col: 0xdfe3e8, eq: "Ag⁺ + e⁻ → Ag" }, an: { t: "g", g: "O2", ne: 4, eq: "4OH⁻ → 2H₂O + O₂ + 4e⁻" }, elC: 0x2b2d31, elA: 0x2b2d31, note: "Silver is below hydrogen in the reactivity series, so Ag⁺ is discharged (n = 1: one electron per atom — twice the mass of copper per mole of electrons)." },
    brine: { name: "Concentrated sodium chloride solution (brine), graphite", liq: [200, 228, 244, 0.16], qmax: 1e9, ions: [[0xa98bff, 1], [0x9fe08a, -1], [0xa98bff, 1], [0x9fe08a, -1], [0xff4a3a, 1], [0x4a8dff, -1]], ca: { t: "g", g: "H2", ne: 2, eq: "2H₂O + 2e⁻ → H₂ + 2OH⁻" }, an: { t: "g", g: "Cl2", ne: 2, eq: "2Cl⁻ → Cl₂ + 2e⁻" }, elC: 0x2b2d31, elA: 0x2b2d31, note: "H⁺ (from water) is discharged instead of Na⁺, and the concentrated Cl⁻ instead of OH⁻. Cl₂ and H₂ are made and NaOH is left in solution: the chlor-alkali process." },
    acid: { name: "Dilute sulfuric acid (electrolysis of water), graphite", liq: [200, 228, 244, 0.16], qmax: 1e9, ions: [[0xff4a3a, 1], [0xffd24a, -1], [0xff4a3a, 1], [0xff4a3a, 1], [0x4a8dff, -1]], ca: { t: "g", g: "H2", ne: 2, eq: "2H⁺ + 2e⁻ → H₂" }, an: { t: "g", g: "O2", ne: 4, eq: "4OH⁻ → 2H₂O + O₂ + 4e⁻" }, elC: 0x2b2d31, elA: 0x2b2d31, note: "Water is split: twice as much H₂ as O₂ by volume (2 : 1) because 4 electrons give 2 H₂ but only 1 O₂." },
    pb: { name: "Molten lead(II) bromide, graphite electrodes", liq: [255, 150, 60, 0.62], qmax: 38600, ions: [[0x8c929b, 1], [0xb45a1c, -1], [0x8c929b, 1], [0xb45a1c, -1]], ca: { t: "m", sym: "Pb", M: 207.2, n: 2, col: 0x8c929b, eq: "Pb²⁺ + 2e⁻ → Pb" }, an: { t: "g", g: "Br2", ne: 2, eq: "2Br⁻ → Br₂ + 2e⁻" }, elC: 0x2b2d31, elA: 0x2b2d31, note: "A molten salt contains only its own ions, so the products are simply the metal at the cathode and the non-metal at the anode (lead beads, red-brown bromine vapour)." },
  };
  const gasOf = (h) => (h && h.t === "g");
  function prod(c, s) {                                      // everything that follows from Q (coulombs)
    const k = CASES[c.cs], q = Math.min(s.q, k.qmax), ne = q / F, o = { q, ne, t: q / Math.max(0.1, c.I) };
    [["ca", k.ca], ["an", k.an]].forEach(([w, h]) => {
      if (h.t === "g") { const mol = ne / h.ne; o[w] = { mol, vol: mol * VM * 1000, label: GAS[h.g].l + " gas", txt: (mol * VM * 1000).toFixed(1) + " cm³ " + GAS[h.g].l }; }
      else { const mol = ne / h.n, mass = mol * h.M; o[w] = { mol, mass, label: h.t === "d" ? h.sym + " dissolved" : h.sym + " deposited", txt: mass.toFixed(3) + " g " + h.sym }; }
    });
    o.full = s.q >= k.qmax; return o;
  }

  C3.scenes.electrolysis = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[0.5, 2.9, 9.4], [-1.2, 1.9, 0]],
    values: { cs: "cuC", I: 2, lapse: 120, on: 1 },
    state: () => ({ t: 0, q: 0, hist: [] }),
    controls: [
      { type: "select", key: "cs", label: "Electrolyte and electrodes", options: Object.keys(CASES).map((k) => ({ value: k, label: CASES[k].name })) },
      { type: "range", key: "I", label: "Current I (A)", min: 0.5, max: 10, step: 0.5, unit: " A" },
      { type: "select", key: "lapse", label: "Time-lapse (1 s on screen = …)", options: [{ value: 30, label: "30 s of electrolysis" }, { value: 120, label: "2 min of electrolysis" }, { value: 600, label: "10 min of electrolysis" }] },
      { type: "toggle", key: "on", label: "Current switched on" },
      { type: "button", label: "Jump to exactly 10 minutes (600 s)", action: (S, s, c) => { s.q = Math.min(CASES[c.cs].qmax, c.I * 600); } },
      { type: "button", label: "Fresh electrolyte & electrodes", action: (S, s) => { s.q = 0; s.hist = []; }, cls: "secondary" },
    ],
    views: [{ label: "Cell", cam: [[0.5, 2.9, 9.4], [-1.2, 1.9, 0]] }, { label: "Electrodes", cam: [[-1.6, 1.4, 4.8], [-2.0, 1.0, 0]] }, { label: "Gas tubes", cam: [[-1.6, 2.8, 5.4], [-2.0, 2.4, 0]] }],
    note: "Faraday's laws: Q = I × t, moles of electrons = Q ÷ 96 500, and mass deposited m = (Q × M) ÷ (n × F) where n is the electrons needed per atom. For a gas, volume = moles × 24 dm³ (r.t.p.). Cations go to the cathode (−) and are reduced; anions go to the anode (+) and are oxidised. The ion discharged depends on its position in the reactivity series and on its concentration.",
    reset(S, s, c) { Object.assign(c, { cs: "cuC", I: 2, lapse: 120, on: 1 }); s.q = 0; s.hist = []; },
    onChange(S, s, c, key) { if (key === "cs") { s.q = 0; s.hist = []; s.sig = ""; } },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.contact(BX, 0, 0, 5.6, 0.5); K.contact(1.0, 0, 0, 5, 0.4);
      s.bk = K.beaker(); s.bk.group.position.set(BX, 0, 0); s.liq = s.bk.addLiquid({ color: 0xcfe8f5, opacity: 0.2 }); s.liq.setVolume(200);
      const mkEl = (x) => { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshPhysicalMaterial({ color: 0x2b2d31, metalness: 0.5, roughness: 0.55 })); m.position.set(x, 1.45, 0); m.castShadow = true; S.scene.add(m); return m; };
      s.elC = mkEl(XC); s.elA = mkEl(XA); s.coat = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshPhysicalMaterial({ color: 0xc8733a, metalness: 0.85, roughness: 0.4 })); S.scene.add(s.coat);
      /* battery + wires */
      S.mk.rbox(1.6, 0.9, 0.8, 0.1, M.paint(0x2d3a52), 0.9, 0.45, 0.1); S.mk.cyl(0.11, 0.11, 0.14, M.paint(0xd23b2e), 1.4, 0.96, 0.1); S.mk.cyl(0.11, 0.11, 0.14, M.paint(0x15171a), 0.4, 0.96, 0.1);
      const wp = [[V3(XC, 2.65, 0), V3(XC, 3.0, 0), V3(0.4, 3.0, 0.1), V3(0.4, 1.0, 0.1)], [V3(XA, 2.65, 0), V3(XA, 2.85, 0), V3(1.4, 2.85, 0.1), V3(1.4, 1.0, 0.1)]];
      wp.forEach((pp, w) => { for (let i = 0; i < pp.length - 1; i++) S.mk.rod(pp[i], pp[i + 1], 0.03, w ? M.paint(0xc8352b) : M.paint(0x222222)); });
      /* gas collection tubes over each electrode (inverted: open end down) */
      s.tubes = [XC, XA].map((x) => { const g = new T.Group(); g.position.set(x, TUBE_Y0, 0); S.scene.add(g); const glass = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, TUBE_H, 28, 1, true), K.glassMat({ opacity: 0.09 })); glass.position.y = TUBE_H / 2; glass.renderOrder = 4; g.add(glass);
        const cap = new T.Mesh(new T.SphereGeometry(0.22, 24, 12, 0, TAU, 0, Math.PI / 2), K.glassMat({ opacity: 0.09 })); cap.position.y = TUBE_H; cap.renderOrder = 4; g.add(cap);
        const fl = new T.Mesh(new T.CylinderGeometry(0.205, 0.205, 1, 28), new T.MeshPhysicalMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.2, roughness: 0.05, depthWrite: false })); fl.renderOrder = 2; g.add(fl);
        const gs = new T.Mesh(new T.CylinderGeometry(0.205, 0.205, 1, 28), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false })); gs.renderOrder = 3; g.add(gs);
        const ticks = new T.Group(); for (let v = 60; v <= 300; v += 60) { const tk = new T.Mesh(new T.BoxGeometry(0.1, 0.012, 0.01), M.matte(0xe6f0ff, 0.5)); tk.position.set(0.17, (v / TUBE_CAP) * TUBE_H, 0.14); tk.rotation.y = -0.6; ticks.add(tk); } g.add(ticks);
        return { g, fl, gs }; });
      /* ions + bubbles */
      s.iIm = new T.InstancedMesh(new T.SphereGeometry(0.06, 12, 8), new T.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 0.6 }), 44); s.iIm.frustumCulled = false; S.scene.add(s.iIm);
      s.ip = []; for (let i = 0; i < 44; i++) s.ip.push({ p: V3(U.rnd(XC, XA), U.rnd(0.45, 1.0), U.rnd(-0.4, 0.4)), k: i % 6 });
      s.bIm = new T.InstancedMesh(new T.SphereGeometry(0.05, 10, 8), K.glassMat({ opacity: 0.35, env: 3 }), 60); s.bIm.frustumCulled = false; s.bIm.renderOrder = 5; S.scene.add(s.bIm);
      s.bp = []; for (let i = 0; i < 60; i++) s.bp.push({ on: false, w: 0, x: 0, y: 0, z: 0, v: 0 }); s.m4 = new T.Matrix4(); s.col = new T.Color(); s.acc = [0, 0]; s.sig = "";
    },
    update(S, s, c, dt) {
      const k = CASES[c.cs], on = !!c.on && s.q < k.qmax;
      if (on && dt > 0) { s.q = Math.min(k.qmax, s.q + c.I * c.lapse * dt); s.t += dt; }
      const o = (s.o = prod(c, s)); s.on = on;
      if (c.cs + "" !== s.sig) { s.sig = c.cs; s.elC.material.color.set(k.elC); s.elA.material.color.set(k.elA); s.elC.material.metalness = s.elA.material.metalness = k.elC === 0x2b2d31 ? 0.4 : 0.9; if (k.ca.t === "m") s.coat.material.color.set(k.ca.col); s.coat.material.color.set(k.ca.col || 0xffffff); s.liq.setColor(k.liq.slice(0, 3), k.liq[3]); }
      const frac = k.qmax < 1e8 ? clamp(s.q / k.qmax, 0, 1) : 0, base = k.liq[3];
      s.liq.setColor(k.liq.slice(0, 3), c.cs === "cuC" ? 0.14 + (base - 0.14) * (1 - 0.9 * frac) : base); s.liq.update(S.t);
      /* electrodes: deposit grows on the cathode; a metal anode shrinks */
      const maxMass = k.ca.t === "m" ? (k.qmax < 1e8 ? k.qmax : 36000) / F * k.ca.M / k.ca.n : 1, mCath = k.ca.t === "m" ? o.ca.mass : 0;
      s.elC.scale.set(0.12, 2.2, 0.34); const dep = k.ca.t === "m" ? 0.03 + 0.22 * clamp(mCath / 3, 0, 1) : 0; s.coat.scale.set(0.12 + dep, 1.5, 0.36); s.coat.position.set(XC - dep / 2 + 0.0, 1.0, 0); s.coat.visible = k.ca.t === "m" && mCath > 0.001;
      const aTh = k.an.t === "d" ? 0.12 * (1 - 0.7 * clamp(o.an.mass / (maxMass * 0.6), 0, 1)) : 0.12; s.elA.scale.set(Math.max(0.03, aTh), 2.2, 0.34);
      /* gas tubes */
      [[k.ca, o.ca], [k.an, o.an]].forEach(([h, p], i) => {
        const tb = s.tubes[i], gas = gasOf(h); tb.g.visible = gas; if (!gas) return; const G = GAS[h.g], gh = clamp(p.vol / TUBE_CAP, 0, 1) * TUBE_H;
        tb.gs.material.color.set(G.col); tb.gs.material.opacity = G.op; tb.gs.scale.set(1, Math.max(0.0001, gh), 1); tb.gs.position.y = TUBE_H - gh / 2; tb.gs.visible = gh > 0.005;
        const lh = TUBE_H - gh; tb.fl.scale.set(1, Math.max(0.0001, lh), 1); tb.fl.position.y = lh / 2; tb.fl.material.color.setRGB(k.liq[0] / 255, k.liq[1] / 255, k.liq[2] / 255).convertSRGBToLinear();
      });
      /* bubbles rise from a gas electrode into its tube */
      [[k.ca, XC, 0], [k.an, XA, 1]].forEach(([h, x, w]) => { if (gasOf(h) && on && dt > 0) { s.acc[w] += dt * 9 * Math.min(2, 0.4 + c.I / 5); while (s.acc[w] >= 1) { s.acc[w] -= 1; const b = s.bp.find((q) => !q.on); if (!b) break; Object.assign(b, { on: true, w, x: x + U.rnd(-0.07, 0.07), y: U.rnd(0.5, 0.9), z: U.rnd(-0.1, 0.1), v: U.rnd(0.9, 1.5) }); } } });
      for (let i = 0; i < 60; i++) {
        const b = s.bp[i]; if (b.on) { if (dt > 0) { b.y += b.v * dt * (0.6 + 0.4 * Math.min(2, c.lapse / 120)); } const top = TUBE_Y0 + TUBE_H - (clamp(([o.ca, o.an][b.w].vol || 0) / TUBE_CAP, 0, 1) * TUBE_H); if (b.y >= top - 0.03) b.on = false; }
        if (!b.on) { s.m4.makeScale(0, 0, 0); s.bIm.setMatrixAt(i, s.m4); continue; } s.m4.makeTranslation(b.x, b.y, b.z); s.bIm.setMatrixAt(i, s.m4);
      }
      s.bIm.instanceMatrix.needsUpdate = true;
      /* ions drift to the electrodes (cations → cathode, anions → anode) and are discharged */
      const sp = on ? 0.35 + c.I / 8 : 0.05, ic = k.ions;
      for (let i = 0; i < 44; i++) {
        const q = s.ip[i], d = ic[i % ic.length], cat = d[1] > 0, tx = cat ? XC + 0.1 : XA - 0.1;
        if (dt > 0) { q.p.x += (tx - q.p.x) * Math.min(1, dt * sp * 0.6) * 0.8 + Math.sin(S.t * 3 + i) * 0.002; q.p.y += Math.sin(S.t * 2 + i * 1.7) * 0.004; q.p.z += Math.cos(S.t * 2.3 + i) * 0.003; if (Math.abs(q.p.x - tx) < 0.07) { q.p.x = cat ? U.rnd(XC + 0.3, XA) : U.rnd(XC, XA - 0.3); q.p.y = U.rnd(0.45, 1.0); q.p.z = U.rnd(-0.4, 0.4); } }
        q.p.y = clamp(q.p.y, 0.4, 1.0); s.m4.makeScale(1, 1, 1); s.m4.setPosition(q.p.x, q.p.y, q.p.z); s.iIm.setMatrixAt(i, s.m4); s.col.set(d[0]); s.iIm.setColorAt(i, s.col);
      }
      s.iIm.instanceMatrix.needsUpdate = true; s.iIm.instanceColor && (s.iIm.instanceColor.needsUpdate = true);
    },
    overlay(ctx, s, c, w, h, S) {
      const k = CASES[c.cs], o = s.o; if (!o) return;
      H.pill(ctx, 10, 22, k.name, "#ffe9b8", 11); H.pill(ctx, 10, 44, "Q = I × t     n(e⁻) = Q ÷ F     m = Q·M ÷ (n·F)     F = 96 500 C mol⁻¹", "#bcd0ea", 9.5);
      const qc = S.proj(V3(XC, 0.0, 0.5)), qa = S.proj(V3(XA, 0.0, 0.5));
      H.pill(ctx, qc.x - 4, qc.y + 16, "CATHODE (−)", "#9fd2ff", 9.5, "right"); H.pill(ctx, qc.x - 4, qc.y + 33, k.ca.eq, "#a9d4ff", 9.5, "right"); H.pill(ctx, qa.x + 4, qa.y + 16, "ANODE (+)", "#ff9d8a", 9.5); H.pill(ctx, qa.x + 4, qa.y + 33, k.an.eq, "#ffb199", 9.5);
      [[k.ca, o.ca, XC], [k.an, o.an, XA]].forEach(([hh, p, x]) => { if (gasOf(hh)) { const q = S.proj(V3(x, TUBE_Y0 + TUBE_H + 0.15, 0)); H.pill(ctx, q.x, clamp(q.y, 60, 100) + (x === XC ? 0 : 20), GAS[hh.g].l + " " + p.vol.toFixed(1) + " cm³", "#dbe7ff", 10, "center"); } });
      /* charge-product graph */
      const gx = 394, gy = 56, gw = 244, gh = 156, G = k.ca.t === "m", xmax = 36000, qm = Math.min(xmax, k.qmax);
      const per = (hh, q) => (hh.t === "g" ? (q / F / hh.ne) * VM * 1000 : (q / F / hh.n) * hh.M), maxY = Math.max(per(k.ca, qm), gasOf(k.ca) && gasOf(k.an) ? per(k.an, qm) : 0) * 1.05, pts = (hh) => [[0, 0], [qm, per(hh, qm)]];
      const ser = [{ pts: pts(k.ca), color: "#9fd2ff", width: 2.2 }]; if (gasOf(k.ca) && gasOf(k.an)) ser.push({ pts: pts(k.an), color: "#ffb199", width: 2.2 });
      H.graph(ctx, gx, gy, gw, gh, { series: ser, xmin: 0, xmax: xmax, ymin: 0, ymax: maxY, ticksX: 4, ticksY: 4, xl: "charge Q / C", yl: G ? "mass of " + k.ca.sym + " / g" : "volume of gas / cm³", dot: [Math.min(o.q, xmax), per(k.ca, o.q), "#ffd27a"] });
      H.pill(ctx, gx + gw, gy + gh + 17, "straight line: product ∝ charge", "#bcd0ea", 9.5, "right");
      const px = 394, py = 246; H.panel(ctx, px, py, 244, 92);
      ctx.save(); ctx.font = "600 10px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#ffd27a"; ctx.fillText("Q = " + c.I + " A × " + o.t.toFixed(0) + " s = " + o.q.toFixed(0) + " C", px + 8, py + 17); ctx.fillStyle = "#cfe0ff"; ctx.fillText("n(e⁻) = " + o.q.toFixed(0) + " ÷ 96500 = " + o.ne.toFixed(4) + " mol", px + 8, py + 34);
      ctx.fillStyle = "#9fd2ff"; ctx.fillText("cathode: " + o.ca.txt, px + 8, py + 52); ctx.fillStyle = "#ffb199"; ctx.fillText("anode:   " + o.an.txt, px + 8, py + 69); ctx.fillStyle = "#8fa4c8"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText(G ? "m = " + o.q.toFixed(0) + " × " + k.ca.M + " ÷ (" + k.ca.n + " × 96500)" : "V = n(e⁻) ÷ " + k.ca.ne + " × 24 dm³", px + 8, py + 85); ctx.restore();
      if (o.full) H.pill(ctx, 10, 364, "Electrolyte used up — fresh solution needed", "#ff9d8a", 10.5);
      if (gasOf(k.ca) && o.ca.vol > TUBE_CAP || gasOf(k.an) && o.an.vol > TUBE_CAP) H.pill(ctx, 10, 386, "gas tube drawn full at " + TUBE_CAP + " cm³ — the readings keep counting", "#ffd27a", 10);
      else if (G) H.pill(ctx, 10, 386, "deposit thickness exaggerated for visibility", "#9fb3d1", 9.5);
    },
    readouts(s, c) {
      const o = s.o, k = CASES[c.cs]; if (!o) return [];
      return [["Charge Q = I × t", o.q.toFixed(0) + " C  (" + c.I + " A × " + o.t.toFixed(0) + " s)"], ["Electrons n(e⁻) = Q ÷ F", o.ne.toFixed(4) + " mol"], ["Cathode (−) product", o.ca.txt], ["Anode (+) product", o.an.txt], ["Cathode half-equation", k.ca.eq], ["Anode half-equation", k.an.eq], ["Why these products", k.note], ["Gas test", gasOf(k.an) ? GAS[k.an.g].l + ": " + GAS[k.an.g].test : "—"], ["Elapsed (electrolysis)", Math.floor(o.t / 60) + " min " + (o.t % 60).toFixed(0) + " s"]];
    },
    steps(s, c) { const k = CASES[c.cs]; return [["Identify the ions present, including H⁺ and OH⁻ from water", "done"], ["Cations go to the cathode: which is discharged? " + k.ca.eq, "done"], ["Anions go to the anode: which is discharged? " + k.an.eq, "done"], ["Calculate Q = I × t, then n(e⁻) = Q ÷ 96 500", s.q > 0 ? "done" : "now"], ["Use the mole ratio from the half-equation to find the mass or gas volume", s.q > 0 ? "now" : ""]]; },
  };
})();
