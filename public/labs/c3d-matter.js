/* c3d-matter.js — chemistry 3D: kinetic theory & states of matter (Lennard-Jones particles + heating curve) · the gas laws */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const fmt = (v, d) => (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en") : (+v).toFixed(d == null ? 1 : d));

  /* =========================================================================== 1. STATES OF MATTER */
  const SUBS = {
    water: { name: "Water, H₂O", mp: 0, bp: 100, cs: 2.09, cl: 4.18, cg: 2.01, Lf: 334, Lv: 2260, T0: -40, forces: "hydrogen bonds (strong) between molecules", kind: "molecular" },
    ethanol: { name: "Ethanol, C₂H₅OH", mp: -114, bp: 78, cs: 1.4, cl: 2.44, cg: 1.43, Lf: 108, Lv: 841, T0: -140, forces: "hydrogen bonds + dispersion forces", kind: "molecular" },
    naphthalene: { name: "Naphthalene, C₁₀H₈", mp: 80, bp: 218, cs: 1.3, cl: 1.7, cg: 1.2, Lf: 149, Lv: 337, T0: 20, forces: "weak van der Waals (dispersion) forces", kind: "molecular" },
    lead: { name: "Lead, Pb", mp: 327, bp: 1749, cs: 0.129, cl: 0.14, cg: 0.1, Lf: 23, Lv: 854, T0: 20, forces: "metallic bonding", kind: "metal" },
  };
  function prof(S) { const Tend = S.bp + Math.max(60, 0.5 * (S.bp - S.mp)), E1 = S.cs * (S.mp - S.T0), E2 = E1 + S.Lf, E3 = E2 + S.cl * (S.bp - S.mp), E4 = E3 + S.Lv, E5 = E4 + S.cg * (Tend - S.bp); return { Tend, E1, E2, E3, E4, E5 }; }
  function stateAt(S, P, q) {
    let ph, T_, f = 0, ts;
    if (q < P.E1) { ph = "solid"; T_ = S.T0 + q / S.cs; ts = 0.12 + 0.33 * (T_ - S.T0) / (S.mp - S.T0); }
    else if (q < P.E2) { ph = "melting"; f = (q - P.E1) / S.Lf; T_ = S.mp; ts = 0.45 + 0.25 * f; }
    else if (q < P.E3) { ph = "liquid"; T_ = S.mp + (q - P.E2) / S.cl; ts = 0.7 + 0.2 * (T_ - S.mp) / (S.bp - S.mp); }
    else if (q < P.E4) { ph = "boiling"; f = (q - P.E3) / S.Lv; T_ = S.bp; ts = 0.9 + 0.35 * f; }
    else { ph = "gas"; T_ = S.bp + (q - P.E4) / S.cg; ts = 1.25 + 0.75 * (T_ - S.bp) / (P.Tend - S.bp); }
    const lat = clamp(q - P.E1, 0, S.Lf) + clamp(q - P.E3, 0, S.Lv);
    return { ph, T: T_, f, ts: clamp(ts, 0.1, 2.0), lat, sens: q - lat };
  }
  const PHCOL = { solid: "#7db7ff", melting: "#9be0ff", liquid: "#5fe0c4", boiling: "#ffd27a", gas: "#ff9d6a" };
  const PHDESC = {
    solid: "particles vibrate in fixed lattice positions, tightly packed",
    melting: "heat breaks the lattice: potential energy rises, T stays constant",
    liquid: "particles touch but slide past each other; no fixed shape",
    boiling: "heat separates the particles: potential energy rises, T stays constant",
    gas: "far apart, fast random motion; fills the whole container",
  };
  const NP = 108, LB = 8.5, SU = 0.46, GRAV = 0.3, RC2 = 6.25;
  C3.scenes.statesOfMatter = {
    env: "chemlab", envOpts: { w: 24, d: 10, wallH: 24, shadowArea: 9 }, envI: 0.7, fov: 36, free: true, cam: [[2.0, 3.8, 10.8], [1.6, 1.7, 0]],
    values: { sub: "water", q: 0, auto: 0, bonds: 1 },
    state: () => ({ t: 0, dir: 1, Ts: 0.12, acc: 0 }),
    controls: [
      { type: "select", key: "sub", label: "Substance", options: Object.keys(SUBS).map((k) => ({ value: k, label: SUBS[k].name })) },
      { type: "range", key: "q", label: "Heat supplied (0 % = cold solid → 100 % = hot gas)", min: 0, max: 100, step: 0.2, unit: " %" },
      { type: "toggle", key: "auto", label: "Heat / cool automatically" },
      { type: "button", label: "⇄ Reverse: heat ↔ cool", action: (S, s, c, ref) => { s.dir = -s.dir; c.auto = 1; ref(); }, cls: "secondary" },
      { type: "button", label: "Reset: cold solid", action: (S, s, c, ref) => { c.q = 0; s.dir = 1; c.auto = 0; initMD(s); ref(); }, cls: "secondary" },
      { type: "toggle", key: "bonds", label: "Show forces between neighbours" },
    ],
    views: [{ label: "Container", cam: [[2.0, 3.8, 10.8], [1.6, 1.7, 0]] }, { label: "Close-up", cam: [[1.0, 2.2, 5.8], [0.7, 1.3, 0]] }, { label: "Top", cam: [[0.1, 9.0, 1.2], [0, 1.0, 0]] }],
    note: "Temperature measures the average kinetic energy of the particles. Heating a solid raises T until the melting point; then the heat (latent heat of fusion) goes into breaking the forces holding the lattice, so T stays constant while it melts. The same happens at the boiling point (latent heat of vaporisation). Specific heat capacities are rounded textbook values; the particle model is qualitative (Lennard-Jones particles).",
    onChange(S, s, c, key, ref) { if (key === "sub") { c.q = 0; s.dir = 1; c.auto = 0; initMD(s); ref && ref(); } if (key === "q") { c.auto = 0; ref && ref(); } },
    reset(S, s, c) { c.sub = "water"; c.q = 0; c.auto = 0; s.dir = 1; initMD(s); },

    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.tile(18);
      const W = LB * SU;
      /* hot plate */
      const plate = S.mk.cyl(2.5, 2.6, 0.28, M.matte(0x1d2026, 0.45), 0, -0.16, 0); s.coil = new T.Mesh(new T.RingGeometry(0.9, 2.0, 64), new T.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); s.coil.rotation.x = -Math.PI / 2; s.coil.position.y = -0.015; S.scene.add(s.coil);
      s.heatGlow = new T.PointLight(0xff6a2a, 0, 6, 1.6); s.heatGlow.position.set(0, 0.3, 0); S.scene.add(s.heatGlow);
      /* glass container */
      const gm = K.glassMat({ opacity: 0.05 }); const box = new T.Mesh(new T.BoxGeometry(W + 0.12, W + 0.1, W + 0.12), gm); box.position.y = W / 2; box.renderOrder = 4; S.scene.add(box);
      const fr = new T.LineSegments(new T.EdgesGeometry(box.geometry), new T.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.4 })); fr.position.copy(box.position); S.scene.add(fr);
      K.contact(0, 0, 0, 18, 0.5);
      /* particles */
      s.inst = new T.InstancedMesh(new T.SphereGeometry(0.33 * SU, 20, 14), new T.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 0.8 }), NP); s.inst.castShadow = true; s.inst.frustumCulled = false; S.scene.add(s.inst);
      s.lines = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.4 })); s.linePos = new Float32Array(2400 * 6); s.lines.geometry.setAttribute("position", new T.BufferAttribute(s.linePos, 3)); s.lines.geometry.setDrawRange(0, 0); s.lines.frustumCulled = false; S.scene.add(s.lines);
      initMD(s); s.m4 = new T.Matrix4(); s.col = new T.Color();
    },
    update(S, s, c, dt) {
      s.t += dt; const SB = SUBS[c.sub], P = prof(SB);
      if (c.auto && dt > 0) { c.q = clamp(c.q + s.dir * dt * 3.6, 0, 100); if (c.q >= 100 && s.dir > 0 || c.q <= 0 && s.dir < 0) { c.auto = 0; } }
      const qJ = (c.q / 100) * P.E5, st = stateAt(SB, P, qJ); s.st = st; s.P = P; s.qJ = qJ;
      const heating = c.auto && s.dir > 0, cooling = c.auto && s.dir < 0; s.coil.material.opacity += ((heating ? 0.55 : 0.12 + 0.35 * clamp((st.ts - 0.12) / 1.5, 0, 1)) - s.coil.material.opacity) * Math.min(1, dt * 4 + (dt ? 0 : 1)); s.heatGlow.intensity = s.coil.material.opacity * 3.0;
      s.Ts += (st.ts - s.Ts) * (1 - Math.exp(-dt / 0.5));
      /* molecular dynamics (reduced Lennard-Jones units), velocity-Verlet + Berendsen thermostat */
      const md = s.md, steps = dt > 0 ? Math.min(20, Math.round(clamp(dt * 60, 0.5, 3) * 7)) : 0, h = 0.004, N = NP;
      for (let st2 = 0; st2 < steps; st2++) {
        for (let i = 0; i < N * 3; i++) { md.v[i] += 0.5 * h * md.f[i]; md.p[i] += h * md.v[i]; }
        for (let i = 0; i < N; i++) for (let d = 0; d < 3; d++) { const lo = 0.5, hi = LB - 0.5; let p = md.p[i * 3 + d]; if (p < lo) { md.p[i * 3 + d] = 2 * lo - p; md.v[i * 3 + d] = Math.abs(md.v[i * 3 + d]); } else if (p > hi) { md.p[i * 3 + d] = 2 * hi - p; md.v[i * 3 + d] = -Math.abs(md.v[i * 3 + d]); } }
        force(md, st2 === steps - 1);
        let ke = 0; for (let i = 0; i < N * 3; i++) { md.v[i] += 0.5 * h * md.f[i]; ke += md.v[i] * md.v[i]; }
        const Tk = ke / (3 * N), lam = Math.sqrt(1 + (h / 0.05) * (s.Ts / Math.max(Tk, 1e-4) - 1)); for (let i = 0; i < N * 3; i++) md.v[i] *= lam;
      }
      /* draw */
      const bondC = new T.Color(), cold = new T.Color(0x4c8dff), mid = new T.Color(0x4fe0c0), hot = new T.Color(0xff9a52);
      for (let i = 0; i < N; i++) {
        s.m4.makeTranslation((md.p[i * 3] - LB / 2) * SU, md.p[i * 3 + 1] * SU, (md.p[i * 3 + 2] - LB / 2) * SU); s.inst.setMatrixAt(i, s.m4);
        const cn = md.cn[i]; { const tt = clamp((cn - 1) / 8, 0, 1); if (tt < 0.5) s.col.copy(hot).lerp(mid, tt * 2); else s.col.copy(mid).lerp(cold, (tt - 0.5) * 2); } s.inst.setColorAt(i, s.col);
      }
      s.inst.instanceMatrix.needsUpdate = true; s.inst.instanceColor.needsUpdate = true;
      if (c.bonds) { let k = 0; const lp = s.linePos; for (let i = 0; i < N && k < 2300; i++) for (let j = i + 1; j < N && k < 2300; j++) { const dx = md.p[i * 3] - md.p[j * 3], dy = md.p[i * 3 + 1] - md.p[j * 3 + 1], dz = md.p[i * 3 + 2] - md.p[j * 3 + 2]; if (dx * dx + dy * dy + dz * dz < 1.62) { const o = k * 6; lp[o] = (md.p[i * 3] - LB / 2) * SU; lp[o + 1] = md.p[i * 3 + 1] * SU; lp[o + 2] = (md.p[i * 3 + 2] - LB / 2) * SU; lp[o + 3] = (md.p[j * 3] - LB / 2) * SU; lp[o + 4] = md.p[j * 3 + 1] * SU; lp[o + 5] = (md.p[j * 3 + 2] - LB / 2) * SU; k++; } } s.lines.geometry.setDrawRange(0, k * 2); s.lines.geometry.attributes.position.needsUpdate = true; s.lines.visible = true; } else s.lines.visible = false;
    },
    overlay(ctx, s, c, w, h, S) {
      const SB = SUBS[c.sub], st = s.st, P = s.P; if (!st) return;
      H.pill(ctx, 10, 22, SB.name + "   —   " + (st.ph === "melting" ? "melting (solid + liquid)" : st.ph === "boiling" ? "boiling (liquid + gas)" : st.ph), PHCOL[st.ph], 12);
      H.pill(ctx, 10, 44, "T = " + fmt(st.T, 1) + " °C  (" + fmt(st.T + 273.15, 1) + " K)", "#ffe9b8", 11.5);
      /* thermometer */
      const tx = 28, ty = 98, th = 222, Tmin = SB.T0, Tmax = P.Tend, Y = (T_) => ty + th - ((T_ - Tmin) / (Tmax - Tmin)) * th;
      ctx.save(); H.panel(ctx, 10, ty - 12, 52, th + 40); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(tx + 8, ty, 8, th); const g = ctx.createLinearGradient(0, ty + th, 0, ty); g.addColorStop(0, "#4c8dff"); g.addColorStop(0.5, "#ffd27a"); g.addColorStop(1, "#ff5a3a"); ctx.fillStyle = g; ctx.fillRect(tx + 8, Y(st.T), 8, ty + th - Y(st.T));
      ctx.beginPath(); ctx.arc(tx + 12, ty + th + 6, 9, 0, TAU); ctx.fill(); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.textAlign = "left";
      [["mp", SB.mp], ["bp", SB.bp]].forEach(([l, v]) => { ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.moveTo(tx + 3, Y(v)); ctx.lineTo(tx + 22, Y(v)); ctx.stroke(); ctx.fillStyle = "#cfe0ff"; ctx.fillText(l + " " + v, tx - 16, Y(v) - 3); });
      ctx.restore();
      /* heating / cooling curve */
      const gx = 392, gy = 56, gw = 242, gh = 168, pts = [[0, SB.T0], [P.E1, SB.mp], [P.E2, SB.mp], [P.E3, SB.bp], [P.E4, SB.bp], [P.E5, P.Tend]];
      H.graph(ctx, gx, gy, gw, gh, { series: [{ pts, color: "#ffd27a", width: 2.2 }], xmin: 0, xmax: P.E5, ymin: SB.T0, ymax: P.Tend, ticksX: 4, ticksY: 4, xl: "heat supplied q / J g⁻¹", yl: "T / °C", dot: [s.qJ, st.T, "#fff"] });
      const X0 = gx + 34, PW = gw - 46, Y0 = gy + 16, PH = gh - 40, XX = (q) => X0 + (q / P.E5) * PW, YY = (T_) => Y0 + PH - ((T_ - SB.T0) / (P.Tend - SB.T0)) * PH;
      ctx.save(); ctx.beginPath(); ctx.rect(X0, Y0, PW, PH); ctx.clip(); ctx.lineCap = "round"; ctx.lineWidth = 3.2;
      [["solid", 0, SB.T0, P.E1, SB.mp], ["melting", P.E1, SB.mp, P.E2, SB.mp], ["liquid", P.E2, SB.mp, P.E3, SB.bp], ["boiling", P.E3, SB.bp, P.E4, SB.bp], ["gas", P.E4, SB.bp, P.E5, P.Tend]].forEach(([n, a, ta, b2, tb]) => { ctx.strokeStyle = PHCOL[n]; ctx.globalAlpha = n === st.ph ? 1 : 0.55; ctx.beginPath(); ctx.moveTo(XX(a), YY(ta)); ctx.lineTo(XX(b2), YY(tb)); ctx.stroke(); });
      ctx.restore();
      H.pill(ctx, gx + gw - 4, gy + gh + 17, "q = m·c·ΔT   ·   q = m·L (at mp / bp)", "#bcd0ea", 9.5, "right");
      /* energy store bar */
      const bx = 392, by = 262, bw = 242, tot = Math.max(1, s.qJ), fs = st.sens / tot, fl = st.lat / tot; ctx.save(); H.panel(ctx, bx, by, bw, 50); ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(bx + 8, by + 22, bw - 16, 12); ctx.fillStyle = "#ff9d6a"; ctx.fillRect(bx + 8, by + 22, (bw - 16) * fs * (s.qJ / P.E5 > 0 ? 1 : 0), 12); ctx.fillStyle = "#6ad0ff"; ctx.fillRect(bx + 8 + (bw - 16) * fs, by + 22, (bw - 16) * fl, 12);
      ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#cfe0ff"; ctx.textAlign = "left"; ctx.fillText("where the heat went (" + fmt(s.qJ, 0) + " J/g)", bx + 8, by + 14); ctx.fillStyle = "#ff9d6a"; ctx.fillText("■ kinetic " + fmt(st.sens, 0), bx + 8, by + 46); ctx.fillStyle = "#6ad0ff"; ctx.fillText("■ potential (latent) " + fmt(st.lat, 0), bx + 110, by + 46); ctx.restore();
      H.pill(ctx, 10, 66, PHDESC[st.ph], "#bcd0ea", 9.5);
    },
    readouts(s, c) {
      const SB = SUBS[c.sub], st = s.st; if (!st) return []; const ke = 1.5 * 1.380649e-23 * (st.T + 273.15);
      return [["Substance", SB.name], ["State", st.ph], ["Temperature", fmt(st.T, 1) + " °C · " + fmt(st.T + 273.15, 1) + " K"], ["Heat supplied q", fmt(s.qJ, 0) + " J/g"], ["  of which kinetic (ΔT)", fmt(st.sens, 0) + " J/g"], ["  of which potential (L)", fmt(st.lat, 0) + " J/g"],
        ["Mean KE per particle", "3/2 kT = " + (ke * 1e21).toFixed(2) + " × 10⁻²¹ J"], ["Melting · boiling point", SB.mp + " °C · " + SB.bp + " °C"], ["Latent heats", "fusion " + SB.Lf + " · vaporisation " + SB.Lv + " J/g"], ["Forces between particles", SB.forces]];
    },
  };
  function initMD(s) {
    const a = 1.6, p = new Float64Array(NP * 3), v = new Float64Array(NP * 3); let n = 0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) for (const b of [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]]) { p[n * 3] = LB / 2 + (i + b[0] - 1.25) * a; p[n * 3 + 1] = 0.6 + (j + b[1]) * a; p[n * 3 + 2] = LB / 2 + (k + b[2] - 1.25) * a; n++; }
    let sd = 12345; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647); for (let i = 0; i < NP * 3; i++) v[i] = (rnd() + rnd() + rnd() - 1.5) * 0.6;
    s.md = { p, v, f: new Float64Array(NP * 3), cn: new Float64Array(NP) }; force(s.md, true); s.Ts = 0.12;
  }
  function force(md, countCn) {
    const { p, f, cn } = md, N = NP; f.fill(0); if (countCn) cn.fill(0);
    for (let i = 0; i < N; i++) {
      f[i * 3 + 1] -= GRAV;
      for (let j = i + 1; j < N; j++) {
        const dx = p[i * 3] - p[j * 3], dy = p[i * 3 + 1] - p[j * 3 + 1], dz = p[i * 3 + 2] - p[j * 3 + 2], r2 = dx * dx + dy * dy + dz * dz;
        if (r2 < RC2) { const s2 = 1 / Math.max(r2, 0.5), s6 = s2 * s2 * s2, ff = 24 * s2 * (2 * s6 * s6 - s6); f[i * 3] += ff * dx; f[i * 3 + 1] += ff * dy; f[i * 3 + 2] += ff * dz; f[j * 3] -= ff * dx; f[j * 3 + 1] -= ff * dy; f[j * 3 + 2] -= ff * dz; if (countCn && r2 < 1.69) { cn[i]++; cn[j]++; } }
      }
    }
  }

  /* =========================================================================== 2. THE GAS LAWS */
  const GASES = { He: { M: 4.0026, name: "Helium, He" }, H2: { M: 2.016, name: "Hydrogen, H₂" }, N2: { M: 28.014, name: "Nitrogen, N₂" }, CO2: { M: 44.01, name: "Carbon dioxide, CO₂" } };
  const RG = 0.08206, RJ = 8.314, KB = 1.380649e-23, RC = 1.3, UL = 0.5, HMAX = 14 * UL, NMAX = 90, VSC = 4.5 / 1368;
  const LAWS = {
    boyle: { name: "Boyle's law", f: "P ∝ 1/V  (n, T constant)  →  PV = constant", ind: "V", dep: "P" },
    charles: { name: "Charles' law", f: "V ∝ T  (n, P constant)  →  V/T = constant", ind: "T", dep: "V" },
    gay: { name: "Gay-Lussac's (pressure) law", f: "P ∝ T  (n, V constant)  →  P/T = constant", ind: "T", dep: "P" },
    avo: { name: "Avogadro's law", f: "V ∝ n  (P, T constant)  →  V/n = constant", ind: "n", dep: "V" },
    free: { name: "Ideal gas equation", f: "PV = nRT   (R = 0.0821 dm³ atm K⁻¹ mol⁻¹ = 8.314 J K⁻¹ mol⁻¹)", ind: "T, V, n", dep: "P" },
  };
  function solve(c) {
    let T_ = c.T, V = c.V, n = c.n, P, note = "";
    if (c.law === "charles" || c.law === "avo") { V = (n * RG * T_) / 1; if (V > 14) { V = 14; note = "piston at the stop (14 dm³)"; } if (V < 1) { V = 1; } }
    P = (n * RG * T_) / V; return { T: T_, V, n, P, note };
  }
  C3.scenes.gasLaws = {
    env: "chemlab", envOpts: { w: 24, d: 10, wallH: 26, shadowArea: 10 }, envI: 0.7, fov: 36, free: true, cam: [[0.6, 3.8, 15.8], [0, 3.5, 0]],
    values: { law: "boyle", gas: "He", T: 300, V: 5, n: 0.2 },
    state: () => ({ t: 0, rec: [], acc: 0, cur: null, hv: 5, N: 0 }),
    controls: [
      { type: "select", key: "law", label: "Gas law to investigate", options: Object.keys(LAWS).map((k) => ({ value: k, label: LAWS[k].name })) },
      { type: "select", key: "gas", label: "Gas", options: Object.keys(GASES).map((k) => ({ value: k, label: GASES[k].name })) },
      { type: "range", key: "T", label: "Temperature T (K)", min: 150, max: 800, step: 10, unit: " K" },
      { type: "range", key: "V", label: "Volume V (dm³)", min: 1, max: 10, step: 0.1, unit: " dm³" },
      { type: "range", key: "n", label: "Amount of gas n (mol)", min: 0.05, max: 0.4, step: 0.01, unit: " mol" },
      { type: "button", label: "Record this reading", action: (S, s, c, ref) => { const r = s.cur; if (r) { s.rec.push(Object.assign({}, r, { law: c.law })); if (s.rec.length > 8) s.rec.shift(); } } },
      { type: "button", label: "Clear the table", action: (S, s) => { s.rec = []; }, cls: "secondary" },
    ],
    views: [{ label: "Apparatus", cam: [[0.6, 3.8, 15.8], [0, 3.5, 0]] }, { label: "Close-up", cam: [[0.4, 2.4, 8.6], [0, 2.4, 0]] }, { label: "Top", cam: [[0.1, 15, 2.4], [0, 3.0, 0]] }],
    note: "The gas particles move at the speeds given by the kinetic theory (v_rms = √(3RT/M)). The pressure is found two ways: from PV = nRT, and by counting the momentum the particles hand to the walls — the two agree. Each law keeps two variables fixed: the slider that changes is the independent variable; the dependent one is calculated. Record readings to see which quantity stays constant.",
    onChange(S, s, c, key) { if (key === "law" || key === "gas") s.rec = []; },
    reset(S, s, c) { Object.assign(c, { law: "boyle", gas: "He", T: 300, V: 5, n: 0.2 }); s.rec = []; },

    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.tile(18); K.contact(0, 0, 0, 24, 0.55);
      S.mk.cyl(2.3, 2.4, 0.26, M.matte(0x1d2026, 0.45), 0, -0.25, 0); s.coil = new T.Mesh(new T.RingGeometry(0.7, 1.9, 64), new T.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); s.coil.rotation.x = -Math.PI / 2; s.coil.position.y = -0.1; S.scene.add(s.coil);
      S.mk.cyl(RC + 0.12, RC + 0.14, 0.2, M.steel(), 0, -0.02, 0);
      const tube = new T.Mesh(new T.CylinderGeometry(RC, RC, 7.6, 56, 1, true), K.glassMat({ opacity: 0.06 })); tube.position.y = 3.8; tube.renderOrder = 4; S.scene.add(tube);
      const rim = new T.Mesh(new T.TorusGeometry(RC, 0.025, 8, 64), M.matte(0xcfe6ff, 0.3)); rim.rotation.x = Math.PI / 2; rim.position.y = 7.6; S.scene.add(rim);
      for (let L = 2; L <= 14; L += 2) { const tk = new T.Mesh(new T.BoxGeometry(0.42, 0.03, 0.02), M.matte(0xe6f0ff, 0.5)); tk.position.set(RC * 0.86 + 0.0, L * UL, RC * 0.5); tk.position.x = RC * Math.cos(0.5); tk.position.z = RC * Math.sin(0.5) + 0.01; tk.rotation.y = -0.5; S.scene.add(tk); }
      /* piston */
      const pg = new T.Group(); pg.add(new T.Mesh(new T.CylinderGeometry(RC * 0.98, RC * 0.98, 0.2, 48), M.steel())); const ring = new T.Mesh(new T.TorusGeometry(RC * 0.98, 0.04, 8, 48), M.rubber()); ring.rotation.x = Math.PI / 2; ring.position.y = -0.06; pg.add(ring);
      const rod = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.4, 14), M.chrome()); rod.position.y = 1.3; pg.add(rod); const knob = new T.Mesh(new T.SphereGeometry(0.2, 20, 16), M.paint(0xd23b2e)); knob.position.y = 2.6; pg.add(knob);
      s.weights = new T.Group(); for (let i = 0; i < 3; i++) { const wt = new T.Mesh(new T.CylinderGeometry(0.75 - i * 0.12, 0.75 - i * 0.12, 0.2, 36), M.iron()); wt.position.y = 0.22 + i * 0.21; s.weights.add(wt); } pg.add(s.weights); s.piston = pg; S.scene.add(pg);
      pg.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      /* particles */
      s.inst = new T.InstancedMesh(new T.SphereGeometry(0.075, 14, 10), new T.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.6 }), NMAX); s.inst.frustumCulled = false; S.scene.add(s.inst);
      s.pp = []; s.vv = []; s.m4 = new T.Matrix4(); s.col = new T.Color(); s.N = 0; s.sd = 7; s.lastT = c.T; s.lastG = c.gas;
      s.hv = solve(c).V;
    },
    update(S, s, c, dt) {
      s.t += dt; const so = solve(c), G = GASES[c.gas], Mkg = G.M / 1000, N = Math.round(so.n * 200), sig = Math.sqrt((RJ * so.T) / Mkg);
      /* particle count & speed normalisation */
      const rnd = () => ((s.sd = (s.sd * 16807) % 2147483647) / 2147483647), gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 1.7320508;
      while (s.pp.length < N) { const a = rnd() * TAU, r = RC * 0.9 * Math.sqrt(rnd()); s.pp.push(V3(r * Math.cos(a), 0.2 + rnd() * Math.max(0.3, s.hv - 0.4), r * Math.sin(a))); s.vv.push(V3(gauss() * sig, gauss() * sig, gauss() * sig)); }
      while (s.pp.length > N) { s.pp.pop(); s.vv.pop(); }
      let ss = 0; s.vv.forEach((v) => (ss += v.lengthSq())); const want = 3 * N * (RJ * so.T) / Mkg; if (N > 0 && ss > 0) { const k = Math.sqrt(want / ss); if (Math.abs(k - 1) > 1e-3) s.vv.forEach((v) => v.multiplyScalar(k)); }
      /* piston follows the volume (smoothly) */
      const hT = so.V * UL; s.hv += (hT - s.hv) * Math.min(1, dt * 6 + (dt ? 0 : 1)); const hh = s.hv; s.piston.position.y = hh + 0.1;
      /* motion + wall collisions (impulse counted for the measured pressure) */
      let imp = 0; const pr = 0;
      if (dt > 0) for (let i = 0; i < N; i++) {
        const p = s.pp[i], v = s.vv[i]; p.x += v.x * VSC * dt; p.y += v.y * VSC * dt; p.z += v.z * VSC * dt;
        if (p.y < pr) { p.y = 2 * pr - p.y; imp += 2 * Math.abs(v.y); v.y = Math.abs(v.y); } else if (p.y > hh - pr) { p.y = 2 * (hh - pr) - p.y; if (p.y < pr) p.y = pr; imp += 2 * Math.abs(v.y); v.y = -Math.abs(v.y); }
        const r = Math.hypot(p.x, p.z), lim = RC - pr; if (r > lim) { const nx = p.x / r, nz = p.z / r, vn = v.x * nx + v.z * nz; p.x = nx * (2 * lim - r); p.z = nz * (2 * lim - r); if (vn > 0) { imp += 2 * vn; v.x -= 2 * vn * nx; v.z -= 2 * vn * nz; } }
      }
      const TAUP = 2.0; if (!s.warm && N) { s.warm = 1; s.acc = (so.P * 101325 * TAUP * VSC * (2 * Math.PI * RC * RC + 2 * Math.PI * RC * hh)) / (((Mkg * so.n) / Math.max(1, N)) * ((Math.PI * RC * RC * hh) / (so.V * 1e-3))); } s.acc = s.acc * Math.exp(-dt / TAUP) + imp;
      const Vu = Math.PI * RC * RC * hh, Au = 2 * Math.PI * RC * RC + 2 * Math.PI * RC * hh, mp = (Mkg * so.n) / Math.max(1, N);
      s.Pmeas = N ? (mp * (Vu / (so.V * 1e-3)) * s.acc) / (TAUP * VSC * Au) / 101325 : 0; if (s.Pm == null || !isFinite(s.Pm)) s.Pm = so.P; s.Pm += (s.Pmeas - s.Pm) * Math.min(1, dt * 2);
      /* draw */
      const vp = Math.sqrt((2 * RJ * so.T) / Mkg), cool = new T.Color(0x3d7bff), warm = new T.Color(0xff6a3a), mid = new T.Color(0x57e6c1);
      for (let i = 0; i < NMAX; i++) { if (i < N) { const p = s.pp[i], k = clamp(s.vv[i].length() / (2.2 * vp), 0, 1); s.m4.makeTranslation(p.x, p.y, p.z); s.inst.setMatrixAt(i, s.m4); s.col.copy(k < 0.5 ? cool.clone().lerp(mid, k * 2) : mid.clone().lerp(warm, (k - 0.5) * 2)); s.inst.setColorAt(i, s.col); } else { s.m4.makeScale(0, 0, 0); s.inst.setMatrixAt(i, s.m4); } }
      s.inst.count = NMAX; s.inst.instanceMatrix.needsUpdate = true; s.inst.instanceColor && (s.inst.instanceColor.needsUpdate = true);
      s.weights.visible = c.law === "charles" || c.law === "avo"; s.coil.material.opacity += ((0.1 + 0.55 * clamp((so.T - 150) / 650, 0, 1)) - s.coil.material.opacity) * Math.min(1, dt * 4 + (dt ? 0 : 1));
      s.cur = { P: so.P, V: so.V, T: so.T, n: so.n }; s.so = so; s.N = N; s.vp = vp; s.sig = sig; s.hh = hh;
      s.hist = histo(s.vv.map((v) => v.length()), vp);
    },
    overlay(ctx, s, c, w, h, S) {
      const so = s.so, L = LAWS[c.law]; if (!so) return;
      H.pill(ctx, 10, 22, L.name, "#ffe9b8", 12); H.pill(ctx, 10, 44, L.f, "#9fe3ff", 10);
      H.pill(ctx, 10, 66, "independent: " + L.ind + "   →   dependent: " + L.dep + (so.note ? "   ⚠ " + so.note : ""), so.note ? "#ff9d8a" : "#bcd0ea", 10);
      /* pressure gauge */
      const cx = 66, cy = 150, R = 44, a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, ang = (P) => a0 + (a1 - a0) * Math.sqrt(clamp(P, 0, 30) / 30);
      ctx.save(); H.panel(ctx, 10, 84, 112, 96); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = "rgba(235,240,248,.92)"; ctx.fill(); ctx.strokeStyle = "#8a96a8"; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = "600 8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#223"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.strokeStyle = "#445";
      [0, 1, 2, 5, 10, 20, 30].forEach((v) => { const a = ang(v), c1 = Math.cos(a), s1 = Math.sin(a); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx + c1 * (R - 6), cy + s1 * (R - 6)); ctx.lineTo(cx + c1 * (R - 1), cy + s1 * (R - 1)); ctx.stroke(); ctx.fillText(String(v), cx + c1 * (R - 14), cy + s1 * (R - 14)); });
      const na = ang(so.P); ctx.strokeStyle = "#d23b2e"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(na) * (R - 9), cy + Math.sin(na) * (R - 9)); ctx.stroke(); ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, TAU); ctx.fill();
      ctx.font = "700 9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#334"; ctx.fillText("P / atm", cx, cy + 20); ctx.restore();
      H.pill(ctx, 10, 198, "P = " + so.P.toFixed(2) + " atm = " + (so.P * 101.325).toFixed(0) + " kPa", "#ffd27a", 10.5);
      H.pill(ctx, 10, 220, "from collisions: " + (s.Pm || 0).toFixed(2) + " atm", "#7dffbd", 10.5);
      H.pill(ctx, 10, 242, "V = " + so.V.toFixed(1) + " dm³   T = " + so.T + " K", "#cfe0ff", 10);
      /* volume scale numbers */
      ctx.save(); ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#cfe0ff"; ctx.textAlign = "left"; for (let Lv = 2; Lv <= 14; Lv += 2) { const q = S.proj(V3(RC * Math.cos(0.5) + 0.3, Lv * UL, RC * Math.sin(0.5))); ctx.fillText(Lv, q.x, q.y + 3); } const q0 = S.proj(V3(RC + 0.5, 7.5, 0)); ctx.fillText("dm³", q0.x, q0.y); ctx.restore();
      /* law graph */
      const gx = 392, gy = 56, gw = 242, gh = 150, pts = [], dot = [], rec = s.rec.filter((r) => r.law === c.law);
      let xl, yl, xr, yr, pt, getx, gety;
      if (c.law === "boyle" || c.law === "free") { xl = "V / dm³"; yl = "P / atm"; xr = [0.5, 10.5]; for (let V = 1; V <= 10.01; V += 0.2) pts.push([V, (so.n * RG * so.T) / V]); yr = [0, Math.max(2, (so.n * RG * so.T) * 1.05)]; pt = [so.V, so.P]; getx = (r) => r.V; gety = (r) => r.P; }
      else if (c.law === "charles") { xl = "T / K"; yl = "V / dm³"; xr = [100, 800]; for (let T_ = 100; T_ <= 800; T_ += 20) pts.push([T_, clamp(so.n * RG * T_, 0, 14)]); yr = [0, 14]; pt = [so.T, so.V]; getx = (r) => r.T; gety = (r) => r.V; }
      else if (c.law === "gay") { xl = "T / K"; yl = "P / atm"; xr = [100, 800]; for (let T_ = 100; T_ <= 800; T_ += 20) pts.push([T_, (so.n * RG * T_) / so.V]); yr = [0, Math.max(1, (so.n * RG * 800) / so.V * 1.05)]; pt = [so.T, so.P]; getx = (r) => r.T; gety = (r) => r.P; }
      else { xl = "n / mol"; yl = "V / dm³"; xr = [0, 0.42]; for (let n = 0.05; n <= 0.401; n += 0.01) pts.push([n, clamp(n * RG * so.T, 0, 14)]); yr = [0, 14]; pt = [so.n, so.V]; getx = (r) => r.n; gety = (r) => r.V; }
      H.graph(ctx, gx, gy, gw, gh, { series: [{ pts, color: "rgba(150,190,255,.85)", width: 2 }], xmin: xr[0], xmax: xr[1], ymin: yr[0], ymax: yr[1], ticksX: 4, ticksY: 4, xl, yl, dot: [clamp(pt[0], xr[0], xr[1]), clamp(pt[1], yr[0], yr[1]), "#ffd27a"] });
      const X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40; ctx.save(); ctx.fillStyle = "#7dffbd"; rec.forEach((r) => { const x = X0 + ((getx(r) - xr[0]) / (xr[1] - xr[0])) * PW, y = Y0 + PH - ((gety(r) - yr[0]) / (yr[1] - yr[0])) * PH; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); }); ctx.restore();
      /* Maxwell–Boltzmann speed distribution */
      const hx = 392, hy = 220, hw = 242, hh2 = 142, hs = s.hist; H.panel(ctx, hx, hy, hw, hh2);
      if (hs) { const px = hx + 12, py = hy + 22, pw = hw - 24, ph = hh2 - 46, vmax = hs.vmax, fx = (v) => (4 / (Math.sqrt(Math.PI) * s.vp ** 3)) * v * v * Math.exp(-(v * v) / (s.vp * s.vp)), fm = fx(s.vp) * 1.25;
        ctx.save(); ctx.fillStyle = "rgba(111,200,255,.45)"; hs.bins.forEach((b, i) => { const bh = clamp((b / (Math.max(1, s.N) * (vmax / hs.bins.length))) / fm, 0, 1) * ph; ctx.fillRect(px + (i * pw) / hs.bins.length + 1, py + ph - bh, pw / hs.bins.length - 2, bh); });
        ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 60; i++) { const v = (i / 60) * vmax, x = px + (i / 60) * pw, y = py + ph - clamp(fx(v) / fm, 0, 1) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.strokeRect(px, py, pw, ph); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#bcd0ea"; ctx.textAlign = "center"; for (let i = 0; i <= 4; i++) ctx.fillText(Math.round((vmax * i) / 4), px + (pw * i) / 4, py + ph + 11); ctx.textAlign = "left"; ctx.fillText("count", hx + 8, hy + 12); ctx.textAlign = "right"; ctx.fillText("speed / m s⁻¹ (Maxwell–Boltzmann)", hx + hw - 6, hy + 12); ctx.restore(); }
    },
    table(s, c) {
      const R = s.rec.filter((r) => r.law === c.law); if (!R.length) return '<div style="font:12px IBM Plex Sans;color:#9fb3d1;margin:8px 0">Use “Record this reading” at several settings to test the law — the constant column should stay the same.</div>';
      const cols = { boyle: [["P (atm)", (r) => r.P.toFixed(2)], ["V (dm³)", (r) => r.V.toFixed(1)], ["PV (atm dm³)", (r) => (r.P * r.V).toFixed(2), 1]], charles: [["T (K)", (r) => r.T], ["V (dm³)", (r) => r.V.toFixed(2)], ["V/T (dm³/K)", (r) => (r.V / r.T).toFixed(4), 1]], gay: [["T (K)", (r) => r.T], ["P (atm)", (r) => r.P.toFixed(2)], ["P/T (atm/K)", (r) => (r.P / r.T).toFixed(4), 1]], avo: [["n (mol)", (r) => r.n.toFixed(2)], ["V (dm³)", (r) => r.V.toFixed(2)], ["V/n (dm³/mol)", (r) => (r.V / r.n).toFixed(2), 1]], free: [["P (atm)", (r) => r.P.toFixed(2)], ["V (dm³)", (r) => r.V.toFixed(1)], ["T (K)", (r) => r.T], ["n (mol)", (r) => r.n.toFixed(2)], ["PV/nT", (r) => ((r.P * r.V) / (r.n * r.T)).toFixed(4), 1]] }[c.law];
      let h = '<table class="c3-table"><tr><th>#</th>' + cols.map((x) => "<th>" + x[0] + "</th>").join("") + "</tr>";
      R.forEach((r, i) => { h += "<tr><td>" + (i + 1) + "</td>" + cols.map((x) => "<td" + (x[2] ? ' style="color:#5bd68c"' : "") + ">" + x[1](r) + "</td>").join("") + "</tr>"; });
      return h + "</table>" + (c.law === "free" ? '<div style="font:12px IBM Plex Mono;color:#7dffbd">PV/nT = R = 0.0821 dm³ atm K⁻¹ mol⁻¹ every time</div>' : "");
    },
    readouts(s, c) {
      const so = s.so; if (!so) return []; const G = GASES[c.gas], ke = 1.5 * KB * so.T;
      return [["Pressure P (PV = nRT)", so.P.toFixed(3) + " atm · " + (so.P * 101.325).toFixed(1) + " kPa"], ["Pressure from collisions", (s.Pm || 0).toFixed(2) + " atm"], ["Volume V", so.V.toFixed(2) + " dm³"], ["Temperature T", so.T + " K · " + (so.T - 273.15).toFixed(0) + " °C"], ["Amount n", so.n.toFixed(2) + " mol"],
        ["Gas", G.name + "  (M = " + G.M + " g/mol)"], ["v_rms = √(3RT/M)", Math.round(Math.sqrt((3 * RJ * so.T) / (G.M / 1000))) + " m/s"], ["Most probable speed", Math.round(s.vp || 0) + " m/s"], ["Mean KE per particle", "3/2 kT = " + (ke * 1e21).toFixed(2) + " × 10⁻²¹ J"], ["Particles drawn", s.N + "  (1 per " + (1 / 200 * 1000).toFixed(1) + " mmol)"]];
    },
  };
  function histo(speeds, vp) { const vmax = Math.max(1000, Math.ceil((vp * 3.2) / 500) * 500), nb = 14, bins = new Array(nb).fill(0); speeds.forEach((v) => { const i = Math.min(nb - 1, Math.floor((v / vmax) * nb)); bins[i]++; }); return { vmax, bins }; }
})();
