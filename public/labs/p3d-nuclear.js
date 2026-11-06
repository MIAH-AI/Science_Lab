/* p3d-nuclear.js — radioactive decay, fission vs fusion, black-body radiation (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.elec) return;
  const T = window.THREE, { V3, TAU } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, E = P.util.elec;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lab = E.lab, bench = E.bench, sci = E.sci;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ================= RADIOACTIVE DECAY & HALF-LIFE ================= */
  const COLS = 16, SPC = 0.62;
  S_["Radioactive Decay & Half-life"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 7, 17], [0, 5, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.sig = ""; o.board = mk.box(11, 8.6, 0.3, M.matte(0x151b26, 0.5), 0, 5.5, -0.5); mk.box(11.5, 0.3, 1.4, M.matte(0x22262d, 0.45), 0, 0.35, -0.2); [-4.6, 4.6].forEach((x) => mk.box(0.4, 1.2, 0.9, M.matte(0x22262d, 0.45), x, 0.6, -0.4));
      o.at = new T.InstancedMesh(new T.SphereGeometry(0.26, 18, 14), new T.MeshBasicMaterial({ color: 0xffffff }), 200); o.at.frustumCulled = false; S.scene.add(o.at); o.at.setColorAt(0, new T.Color(1, 1, 1)); o.m = new T.Matrix4(); o.col = new T.Color();
      o.ray = new T.InstancedMesh(new T.SphereGeometry(0.1, 10, 8), new T.MeshBasicMaterial({ color: 0xfff3a8 }), 40); o.ray.frustumCulled = false; S.scene.add(o.ray); s.rays = [];
      o.gc = E.meter(S, "GEIGER COUNTER", 3.0); o.gc.position.set(7.8, 2.6, 1.6); o.gc.scale.setScalar(1.15); const pr = mk.cyl(0.14, 0.14, 3.2, M.matte(0x2a2f38, 0.4), 6.2, 4.0, 0.8); pr.rotation.z = Math.PI / 2.3; s.hist = []; s.ct = 0; s.rate = 0; s.rt = 0; s.cum = 0;
    },
    reset(s, c) { s.sig = ""; },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, n = Math.min(Math.round(c.n0), 192), sig = `${n}|${c.halflife}`; dt = dt || 0.016;
      if (s.sig !== sig) { s.sig = sig; s.t = 0; s.cum = 0; s.graph = []; s.ls = 0; s.hist = []; s.rays = []; const idx = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } const tau = c.halflife / Math.LN2; s.atoms = idx.map((cell) => ({ cell, dt: -tau * Math.log(1 - Math.random()), dec: false })); }
      s.t += dt; const tau = c.halflife / Math.LN2; let decs = 0;
      s.atoms.forEach((a) => { if (!a.dec && a.dt <= s.t) { a.dec = true; a.flash = 1; decs++; s.cum++; const rows = Math.ceil(n / COLS), cx = (a.cell % COLS - (COLS - 1) / 2) * SPC, cy = 5.5 + ((rows - 1) / 2 - Math.floor(a.cell / COLS)) * SPC; const ang = rnd(0, TAU), el = rnd(-0.3, 0.9); s.rays.push({ x: cx, y: cy, z: 0.1, vx: Math.cos(ang) * 4.2, vy: Math.sin(ang) * 4.2 * 0.8, vz: 3.5 * el + 2.5, life: 0.9 }); s.ct++; } });
      s.rt += dt; if (s.rt >= 1) { s.rate = s.ct / s.rt; s.ct = 0; s.rt = 0; } o.gc.set(`${Math.round(s.rate)} /s`, "#7dffa0");
      s.ls += dt; if (s.ls > 0.15) { s.ls = 0; s.graph.push([s.t, s.atoms.filter((a) => !a.dec).length]); } if (s.t > c.halflife * 8) { s.sig = ""; return; }
      const rows = Math.ceil(n / COLS), m = o.m, col = o.col; for (let i = 0; i < 200; i++) { const a = s.atoms[i]; if (!a) { m.makeScale(0.0001, 0.0001, 0.0001); m.setPosition(0, -50, 0); o.at.setMatrixAt(i, m); continue; } const cx = (a.cell % COLS - (COLS - 1) / 2) * SPC, cy = 5.5 + ((rows - 1) / 2 - Math.floor(a.cell / COLS)) * SPC; a.flash = Math.max(0, (a.flash || 0) - dt * 3); const k = a.dec ? 0.55 + a.flash * 0.9 : 1 + 0.06 * Math.sin(S.t * 6 + i); m.makeScale(k, k, k); m.setPosition(cx, cy, 0); o.at.setMatrixAt(i, m); if (a.dec) col.setRGB(0.2 + a.flash * 0.8, 0.42 + a.flash * 0.5, 0.58 + a.flash * 0.3); else col.setRGB(1.0, 0.62 + 0.1 * Math.sin(S.t * 5 + i), 0.18); o.at.setColorAt(i, col); } o.at.instanceMatrix.needsUpdate = true; o.at.instanceColor.needsUpdate = true;
      s.rays = s.rays.filter((r) => { r.x += r.vx * dt; r.y += r.vy * dt; r.z += r.vz * dt; r.life -= dt; return r.life > 0; }); for (let i = 0; i < 40; i++) { const r = s.rays[i]; if (r) { m.makeScale(r.life + 0.2, r.life + 0.2, r.life + 0.2); m.setPosition(r.x, r.y, r.z); } else { m.makeScale(0.0001, 0.0001, 0.0001); m.setPosition(0, -50, 0); } o.ray.setMatrixAt(i, m); } o.ray.instanceMatrix.needsUpdate = true;
      o.n = n; o.tau = tau; o.N = s.atoms.filter((a) => !a.dec).length; S.aim([1.0, 5.2, 0], 22, 0.0, 0.16);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, lam = Math.LN2 / c.halflife, act = lam * o.N; H.pill(ctx, 14, 26, "N = N₀ e^(−λt)        λ = ln 2 / t½        A = λN  (becquerel, Bq)", "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `t½ = ${c.halflife} s → λ = ${f1(lam, 3)} s⁻¹     t = ${f1(s.t, 1)} s  (${f1(s.t / c.halflife, 2)} half-lives)`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `undecayed N = ${o.N} of ${o.n}    expected N₀ e^(−λt) = ${f1(o.n * Math.exp(-lam * s.t), 0)}    activity A = ${f1(act, 1)} Bq`, "#8df0be", 10); H.pill(ctx, 14, 92, "each nucleus decays at random — only the PROBABILITY is fixed (half of them decay every t½)", "#9fb8d8", 9.5);
      lab(ctx, S, V3(-0.4, 0.7, 0.6), "● undecayed (parent)", "#ffb347", "left"); lab(ctx, S, V3(3.4, 0.7, 0.6), "● decayed (daughter)", "#5f9cc8", "left"); lab(ctx, S, V3(7.8, 4.0, 1.6), "counts radiation", "#cfe0ff");
      const lm = Math.LN2 / c.halflife, T8 = c.halflife * 8, th = []; for (let i = 0; i <= 40; i++) { const t = (T8 * i) / 40; th.push([t, o.n * Math.exp(-lm * t)]); }
      H.graph(ctx, 14, h - 132, 214, 114, { series: [{ pts: th, color: "rgba(255,255,255,0.45)", width: 1.4 }, { pts: s.graph.length > 1 ? s.graph : [[0, o.n], [0.01, o.n]], color: "#ffb703", width: 2 }], xmin: 0, xmax: T8, ymin: 0, ymax: o.n, xl: "t (s)", yl: "N undecayed", dot: [c.halflife, o.n / 2, "#7fe3da"], ticksX: 4, ticksY: 2 });
    },
    readouts(s, c) { const lam = Math.LN2 / c.halflife; return [["Decay constant λ", `${f1(lam, 3)} s⁻¹`], ["Half-life", `${c.halflife} s`], ["Elapsed", `${f1(s.t || 0, 1)} s`], ["Law", "N = N₀ e^(−λt)"]]; },
  };

  /* ================= FISSION vs FUSION ================= */
  const nucMat = [new T.MeshStandardMaterial({ color: 0xe0443a, roughness: 0.45, emissive: 0x401008, emissiveIntensity: 0.6 }), new T.MeshStandardMaterial({ color: 0xaeb4bd, roughness: 0.45, emissive: 0x202428, emissiveIntensity: 0.4 })];
  const nucGeo = new T.SphereGeometry(0.26, 14, 10);
  function cluster(n, pFrac) { const g = new T.Group(), R = 0.3 * Math.cbrt(n) * 0.75 + 0.18; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, phi = Math.acos(1 - 2 * t), th = Math.PI * (1 + Math.sqrt(5)) * i, r = R * Math.cbrt(rnd(0.15, 1)) * (n > 6 ? 1 : 0.5); const m = new T.Mesh(nucGeo, nucMat[Math.random() < pFrac ? 0 : 1]); m.position.set(Math.sin(phi) * Math.cos(th) * r, Math.sin(phi) * Math.sin(th) * r, Math.cos(phi) * r); g.add(m); } g.userData.R = R; return g; }
  const neutron = () => { const m = new T.Mesh(new T.SphereGeometry(0.3, 16, 12), nucMat[1]); return m; };
  S_["Fission vs Fusion"] = {
    env: "void", cam: [[0, 10, 24], [0, 0, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; s.t = 0; o.U = cluster(60, 0.39); o.Ba = cluster(36, 0.4); o.Kr = cluster(24, 0.39); o.U2 = cluster(60, 0.39); o.U3 = cluster(60, 0.39); o.D = cluster(2, 0.5); o.Tr = cluster(3, 0.34); o.He = cluster(4, 0.5);
      o.all = [o.U, o.Ba, o.Kr, o.U2, o.U3, o.D, o.Tr, o.He]; o.all.forEach((g) => S.scene.add(g)); o.ns = [0, 1, 2, 3].map(() => { const n = neutron(); S.scene.add(n); return n; });
      o.fl = mk.soft(0xfff1b0, 8, 0, 0, 0, 0); o.fl2 = mk.soft(0xff8a3a, 14, 0, 0, 0, 0); o.g = []; for (let i = 0; i < 10; i++) { const m = mk.soft(0xfff7c8, 1.2, 0, 0, 0, 0); o.g.push(m); } o.mode = -1; o.sig = ""; o.pl = mk.soft(0xff6a2a, 24, 0, 0, -3, 0);
      o.lbl = null;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c, dt) {
      const o = S.objs, mode = Math.round(c.type), PER = mode === 0 ? 11 : 9, t = (s.t || 0) % PER, ph = Math.floor((s.t || 0) / PER); dt = dt || 0.016;
      const hideAll = () => { o.all.forEach((g) => (g.visible = false)); o.ns.forEach((n) => (n.visible = false)); o.fl.material.opacity = 0; o.fl2.material.opacity = 0; o.g.forEach((m) => (m.material.opacity = 0)); }; hideAll();
      const jit = (g, a, base) => g.position.set(base.x + rnd(-a, a), base.y + rnd(-a, a), base.z + rnd(-a, a)); const burst = (t0, dur, pos, scale) => { const u = (t - t0) / dur; if (u < 0 || u > 1) return; o.fl.material.opacity = (1 - u) * 0.95; o.fl.scale.setScalar(scale * (0.4 + 1.6 * u)); o.fl.position.copy(pos); o.fl2.material.opacity = (1 - u) * 0.5; o.fl2.scale.setScalar(scale * (0.8 + 3 * u)); o.fl2.position.copy(pos); o.g.forEach((m, i) => { const a = (i / 10) * TAU + 0.3, d = u * 7 * (0.6 + 0.4 * ((i * 7) % 3) / 2); m.position.set(pos.x + Math.cos(a) * d, pos.y + Math.sin(a) * d * 0.8, pos.z + Math.sin(a * 2) * 2); m.material.opacity = (1 - u) * 0.9; m.scale.setScalar(0.8); }); };
      if (mode === 0) {
        const C = V3(0, 0, 0), Pa = V3(6, 4.6, -1), Pb = V3(6, -4.6, -1);
        o.U2.visible = o.U3.visible = true; o.U2.position.copy(Pa); o.U3.position.copy(Pb);
        if (t < 2.4) { o.U.visible = true; o.U.position.copy(C); o.U.rotation.y += dt * 0.5; const n = o.ns[0]; n.visible = true; n.position.set(lerp(-14, -1.5, sm(t / 2.4)), 0, 0); }
        else if (t < 3.8) { o.U.visible = true; const u = (t - 2.4) / 1.4; jit(o.U, 0.02 + 0.07 * u, C); o.U.scale.set(1 + 0.18 * Math.sin(u * 40) * u, 1 - 0.1 * Math.sin(u * 40) * u, 1); }
        else if (t < 4.5) { o.U.visible = false; const u = (t - 3.8) / 0.7; o.Ba.visible = o.Kr.visible = true; o.Ba.position.set(-0.4 - 1.6 * u, 0.5 * u, 0); o.Kr.position.set(0.6 + 1.6 * u, -0.4 * u, 0); }
        else { const u = (t - 4.5) / 4.5; o.Ba.visible = o.Kr.visible = true; o.Ba.position.set(-2.0 - 4.2 * u, 0.5 + 2.4 * u, 0); o.Kr.position.set(2.2 + 5.2 * u, -0.4 - 2.4 * u, 0); o.U.visible = false; }
        if (t >= 3.8) { const tn = t - 3.8; [[0.6, 0.35, 1], [0.1, -1.0, 2], [0.9, 0.0, 3]].forEach(([dx, dy], i) => { const n = o.ns[i + 1]; if (i === 0) { n.visible = true; const u = clamp((tn - 0.0) / 3.2, 0, 1); n.position.set(0.3 + u * (Pa.x - 0.3) * 0.9, u * Pa.y * 0.9, 0); if (u >= 1) n.visible = false; } else if (i === 1) { n.visible = true; const u = clamp(tn / 3.2, 0, 1); n.position.set(0.3 + u * (Pb.x - 0.3) * 0.9, u * Pb.y * 0.9, 0); if (u >= 1) n.visible = false; } else { n.visible = true; n.position.set(0.5 + tn * 4.5, 0.5 + tn * 2.0, 1.2 + tn); } }); }
        if (t >= 3.8) burst(3.8, 1.6, C, 5);
        const hit = t > 3.8 + 3.0; [o.U2, o.U3].forEach((g, i) => { if (hit) jit(g, 0.06, i ? Pb : Pa); g.scale.setScalar(hit ? 1.08 : 1); }); o.hint = hit ? "neutrons strike more U-235 nuclei → CHAIN REACTION" : t < 3.8 ? "slow neutron absorbed → U-236 (unstable) wobbles" : "nucleus splits: Ba-141 + Kr-92 + 3 neutrons + energy";
        o.stage = hit ? 2 : t < 3.8 ? 0 : 1;
      } else {
        const L = V3(-9, 0, 0), R = V3(9, 0, 0), C = V3(0, 0, 0);
        if (t < 4.0) { const u = sm(t / 4.0), hot = 0.04 + 0.12 * u; o.D.visible = o.Tr.visible = true; o.D.position.set(lerp(-9, -0.65, u), 0, 0); o.Tr.position.set(lerp(9, 0.65, u), 0, 0); jit(o.D, hot, o.D.position.clone()); jit(o.Tr, hot, o.Tr.position.clone()); o.stage = u < 0.85 ? 0 : 1; o.hint = u < 0.85 ? "T ≈ 10⁸ K: nuclei must overcome electrostatic repulsion (Coulomb barrier)" : "nuclei get within ~10⁻¹⁵ m — the strong force takes over"; }
        else { o.He.visible = o.ns[0].visible = true; const u = (t - 4.0) / 5.0; o.He.position.set(-u * 1.8, -u * 0.9, 0); o.ns[0].position.set(0.3 + u * 9, 0.3 + u * 6, 0); o.stage = 2; o.hint = "D + T → He-4 + n + 17.6 MeV  (the neutron carries 14.1 MeV)"; burst(4.0, 1.4, C, 4.5); }
      }
      o.pl.material.opacity = mode === 1 ? 0.22 + 0.06 * Math.sin(S.t * 2) : 0; o.mode = mode; o.o = null; S.aim([mode === 0 ? 1.5 : 0, 0, 0], mode === 0 ? 21 : 17, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, mode = Math.round(c.type), t = (s.t || 0) % (mode === 0 ? 11 : 9); H.pill(ctx, 14, 26, "E = Δm c²        1 u = 931.5 MeV/c²", "#ffd27a", 10.5);
      if (mode === 0) { H.pill(ctx, 14, 48, "²³⁵₉₂U + ¹₀n → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + 3 ¹₀n + 200 MeV", "#8df0be", 10.5); H.pill(ctx, 14, 70, "Δm ≈ 0.215 u → E = 0.215 × 931.5 ≈ 200 MeV  (≈ 0.85 MeV per nucleon)", "#cfe0ff", 10); }
      else { H.pill(ctx, 14, 48, "²₁H + ³₁H → ⁴₂He + ¹₀n + 17.6 MeV", "#8df0be", 10.5); H.pill(ctx, 14, 70, "Δm ≈ 0.0189 u → E = 0.0189 × 931.5 ≈ 17.6 MeV  (≈ 3.5 MeV per nucleon)", "#cfe0ff", 10); }
      H.pill(ctx, 14, 92, o.hint || "", "#ffd27a", 9.5);
      const P = (v3, tx, col, al) => { const q = S.proj(v3); H.pill(ctx, q.x, q.y, tx, col, 9.5, al || "center"); };
      if (mode === 0) { if (o.U.visible) P(V3(0, -2.0, 0), "U-235 (92 p, 143 n)", "#cfe0ff"); if (o.Ba.visible && t > 3.8) { P(V3(o.Ba.position.x, o.Ba.position.y - 1.8, 0), "Ba-141", "#cfe0ff"); P(V3(o.Kr.position.x, o.Kr.position.y - 1.6, 0), "Kr-92", "#cfe0ff"); } P(V3(6, 4.6 - 1.9, -1), "U-235", "#8a96a8"); P(V3(6, -4.6 - 1.9, -1), "U-235", "#8a96a8"); const n0 = o.ns[0]; if (n0.visible && t < 3) P(V3(n0.position.x, 1.0, 0), "slow n", "#aeb4bd"); if (t > 4.4 && t < 6) P(V3(o.ns[3].position.x, o.ns[3].position.y + 0.8, o.ns[3].position.z), "fast neutrons", "#aeb4bd"); }
      else { if (o.D.visible) { P(V3(o.D.position.x, -1.3, 0), "deuterium (¹p ¹n)", "#cfe0ff"); P(V3(o.Tr.position.x, -1.3, 0), "tritium (¹p ²n)", "#cfe0ff"); } if (o.He.visible) { P(V3(o.He.position.x, o.He.position.y - 1.4, 0), "He-4  (3.5 MeV)", "#cfe0ff"); P(V3(o.ns[0].position.x - 0.5, o.ns[0].position.y - 0.9, 0), "n (14.1 MeV)", "#aeb4bd"); } }
      const x0 = w - 168, y0 = h - 84; ctx.save(); ctx.fillStyle = "rgba(10,16,30,0.55)"; ctx.fillRect(x0 - 8, y0 - 22, 166, 76); ctx.font = "10px sans-serif"; ctx.fillStyle = "#cfe0ff"; ctx.textAlign = "left"; ctx.fillText("energy per reaction (MeV)", x0, y0 - 8); const bar = (y, v, col, txt) => { ctx.fillStyle = col; ctx.fillRect(x0, y, 100 * (v / 200), 12); ctx.fillStyle = "#cfe0ff"; ctx.fillText(txt, x0 + 4 + 100 * (v / 200), y + 10); }; bar(y0, 200, mode === 0 ? "#ffb347" : "#6a5a3a", "fission 200"); bar(y0 + 20, 17.6, mode === 1 ? "#7fe3da" : "#3a6a68", "fusion 17.6"); ctx.fillStyle = "#9fb8d8"; ctx.fillText("per nucleon: 0.85 vs 3.5", x0, y0 + 48); ctx.restore();
    },
    readouts(s, c) { return Math.round(c.type) === 0 ? [["Reaction", "Fission of U-235"], ["Energy released", "≈ 200 MeV"], ["Mass defect Δm", "≈ 0.215 u"], ["Uses", "nuclear power stations (chain reaction)"]] : [["Reaction", "D + T → He-4 + n"], ["Energy released", "17.6 MeV"], ["Mass defect Δm", "≈ 0.0189 u"], ["Needs", "T ≈ 10⁸ K, confinement (stars, tokamaks)"]]; },
  };

  /* ================= BLACK-BODY RADIATION ================= */
  const hcl = 1.4388e7; /* hc/k in nm·K */
  const planck = (lam, T) => 1 / (Math.pow(lam, 5) * (Math.exp(hcl / (lam * T)) - 1));
  const bbRGB = (T) => { const t = T / 100, cl = (x) => clamp(x, 0, 255), r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592), g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492), b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307; return [cl(r) / 255, cl(g) / 255, cl(b) / 255]; };
  const SX0 = -6.4, SW = 12.8, SL0 = 300, SL1 = 1000, SXAT = (l) => SX0 + (SW * (l - SL0)) / (SL1 - SL0);
  const spectrumTex = (cv, Tk) => { const x = cv.getContext("2d"), W = cv.width, Hh = cv.height; let mx = 0; for (let i = 0; i < W; i++) { const l = SL0 + ((SL1 - SL0) * i) / W; mx = Math.max(mx, planck(l, Tk)); } for (let i = 0; i < W; i++) { const l = SL0 + ((SL1 - SL0) * i) / W, b = Math.pow(planck(l, Tk) / mx, 0.55); let r = 0, g = 0, bl = 0; if (l < 380) { r = 0.45; g = 0.2; bl = 0.8; } else if (l > 750) { r = 0.9; g = 0.1; bl = 0.05; } else { const L = l; if (L < 440) { r = -(L - 440) / 60; bl = 1; } else if (L < 490) { g = (L - 440) / 50; bl = 1; } else if (L < 510) { g = 1; bl = -(L - 510) / 20; } else if (L < 580) { r = (L - 510) / 70; g = 1; } else if (L < 645) { r = 1; g = -(L - 645) / 65; } else r = 1; } const k = l >= 380 && l <= 750 ? 1 : 0.55; x.fillStyle = `rgb(${Math.round(255 * clamp(r * b * k, 0, 1))},${Math.round(255 * clamp(g * b * k, 0, 1))},${Math.round(255 * clamp(bl * b * k, 0, 1))})`; x.fillRect(i, 0, 2, Hh); } };
  S_["Black-Body Radiation"] = {
    env: "void", cam: [[0, 6, 22], [0, 3, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.floor = mk.box(30, 0.2, 14, M.matte(0x151a24, 0.8), 0, -0.1, 0); o.bm = new T.MeshBasicMaterial({ color: 0xffaa55 }); o.ball = mk.sphere(1.55, o.bm, -3.4, 5.4, 0); o.glow = mk.soft(0xffaa55, 8, -3.4, 5.4, 0, 0.6); o.glow2 = mk.soft(0xffaa55, 4.5, -3.4, 5.4, 0, 0.8);
      mk.cyl(0.12, 0.2, 4.6, M.matte(0x2a2f38, 0.4), -6.6, 2.3, 0); const arm = mk.cyl(0.08, 0.08, 3.4, M.matte(0x2a2f38, 0.4), -5.0, 5.4, 0); arm.rotation.z = Math.PI / 2; mk.cyl(0.9, 1.1, 0.3, M.matte(0x2a2f38, 0.4), -6.6, 0.15, 0);
      o.light = new T.PointLight(0xffaa55, 30, 30, 1.2); o.light.position.set(-3.4, 5.4, 2.5); S.scene.add(o.light);
      o.cv = document.createElement("canvas"); o.cv.width = 512; o.cv.height = 48; o.tex = new T.CanvasTexture(o.cv); o.tex.colorSpace = T.SRGBColorSpace; o.strip = new T.Mesh(new T.PlaneGeometry(SW, 1.6), new T.MeshBasicMaterial({ map: o.tex, toneMapped: false })); o.strip.position.set(0, 1.4, 1.0); S.scene.add(o.strip); mk.box(SW + 0.4, 2.0, 0.2, M.matte(0x0b0f16, 0.5), 0, 1.4, 0.88);
      o.col = mk.box(1.4, 1, 1.4, M.matte(0xff7a2a, 0.35), 8.3, 0.5, 0); o.base = mk.box(2.2, 0.1, 2.2, M.matte(0x22262d, 0.45), 8.3, 0.05, 0); o.tT = null;
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, Tk = c.temp, [r, g, b] = bbRGB(Tk).map((x) => Math.pow(x, 2.2)), br = clamp(Math.pow(Tk / 6000, 1.5), 0.35, 2.2); if (o.tT !== Tk) { o.tT = Tk; spectrumTex(o.cv, Tk); o.tex.needsUpdate = true; o.bm.color.setRGB(r, g, b); o.glow.material.color.setRGB(r, g, b); o.glow2.material.color.setRGB(r, g, b); o.light.color.setRGB(r, g, b); o.light.intensity = 10 + 30 * br; o.glow.scale.setScalar(5 + 4 * br); o.glow2.scale.setScalar(3.4 + 2 * br); o.glow.material.opacity = clamp(0.25 + 0.3 * br, 0, 0.85); const p4 = Math.pow(Tk / 10000, 4), hh = Math.max(0.1, 7.2 * p4); o.col.scale.y = hh; o.col.position.y = hh / 2 + 0.1; o.col.material.color.setRGB(r * 0.9, g * 0.7, b * 0.5); }
      o.glow.scale.setScalar(5 + 4 * br + 0.2 * Math.sin(S.t * 3)); S.aim([0.8, 3.6, 0], 23, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const Tk = c.temp, lmax = 2.898e6 / Tk, sig = 5.670e-8, pw = sig * Math.pow(Tk, 4); H.pill(ctx, 14, 26, "λ_max T = 2.898×10⁶ nm·K  (Wien)        P/A = σT⁴  (Stefan–Boltzmann)", "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `T = ${Tk} K     λ_max = 2.898×10⁶ / ${Tk} = ${f1(lmax, 0)} nm  (${lmax < 380 ? "ultraviolet" : lmax > 750 ? "infrared" : "visible"})`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, `P/A = 5.67×10⁻⁸ × ${Tk}⁴ = ${f1(pw / 1e6, 2)} MW/m²      (double T → 16× the power)`, "#cfe0ff", 10); H.pill(ctx, 14, 92, "hotter body: brighter, bluer, peak moves to shorter λ  (bulb ≈ 2900 K, Sun ≈ 5800 K)", "#9fb8d8", 9.5);
      lab(ctx, S, V3(-3.4, 3.3, 0), "glowing hot body", "#ffd27a"); lab(ctx, S, V3(8.3, 0.0, 2.0), "P/A ∝ T⁴", "#ffb27a"); [400, 500, 600, 700].forEach((l) => lab(ctx, S, V3(SXAT(l), 0.25, 1.1), `${l}`, "#9fb8d8")); lab(ctx, S, V3(2.6, -0.35, 1.1), "emitted spectrum 300–1000 nm:  UV ◀  visible  ▶ IR", "#cfe0ff");
      if (lmax >= SL0 && lmax <= SL1) { const q = S.proj(V3(SXAT(lmax), 2.5, 1.1)); ctx.save(); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(q.x, q.y + 6); ctx.lineTo(q.x - 5, q.y - 3); ctx.lineTo(q.x + 5, q.y - 3); ctx.fill(); ctx.restore(); H.pill(ctx, q.x, q.y - 12, "λ_max", "#ffffff", 9); }
      const gx = 14, gy = h - 132, gw = 232, gh = 114; ctx.save(); ctx.fillStyle = "rgba(8,12,22,0.62)"; ctx.fillRect(gx, gy, gw, gh); const px = (l) => gx + 28 + ((gw - 40) * (l - 100)) / 2900, py = (v) => gy + gh - 22 - (gh - 40) * v; const vg = ctx.createLinearGradient(px(380), 0, px(750), 0); [[0, "#8a4cff"], [0.2, "#3a6aff"], [0.4, "#3aff9a"], [0.6, "#ffee3a"], [0.8, "#ff7a2a"], [1, "#ff2a2a"]].forEach(([a, cc]) => vg.addColorStop(a, cc)); ctx.globalAlpha = 0.28; ctx.fillStyle = vg; ctx.fillRect(px(380), gy + 8, px(750) - px(380), gh - 30); ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(160,190,230,0.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx + 28, gy + 8); ctx.lineTo(gx + 28, gy + gh - 22); ctx.lineTo(gx + gw - 8, gy + gh - 22); ctx.stroke(); ctx.font = "9px sans-serif"; ctx.fillStyle = "#9fb8d8"; ctx.textAlign = "center"; [500, 1000, 2000, 3000].forEach((l) => ctx.fillText(l, px(l), gy + gh - 11)); ctx.fillText("λ (nm)", gx + gw / 2, gy + gh - 1); ctx.save(); ctx.translate(gx + 9, gy + gh / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("B(λ) / peak", 0, 0); ctx.restore();
      [3000, 6000, 10000].forEach((Tr) => { const lm = 2.898e6 / Tr, pk = planck(lm, Tr); ctx.strokeStyle = "rgba(190,210,240,0.22)"; ctx.lineWidth = 1; ctx.beginPath(); for (let l = 100; l <= 3000; l += 25) { const y = py(planck(l, Tr) / pk); l === 100 ? ctx.moveTo(px(l), y) : ctx.lineTo(px(l), y); } ctx.stroke(); });
      const pk = planck(lmax, Tk); ctx.strokeStyle = "#ffb703"; ctx.lineWidth = 2; ctx.beginPath(); for (let l = 100; l <= 3000; l += 15) { const y = py(planck(l, Tk) / pk); l === 100 ? ctx.moveTo(px(l), y) : ctx.lineTo(px(l), y); } ctx.stroke(); if (lmax >= 100 && lmax <= 3000) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(px(lmax), py(1), 3.5, 0, TAU); ctx.fill(); } ctx.restore();
    },
    readouts(s, c) { const lm = 2.898e6 / c.temp; return [["Temperature", `${c.temp} K`], ["Peak wavelength", `${f1(lm, 0)} nm`], ["Power per area σT⁴", `${f1(5.67e-8 * Math.pow(c.temp, 4) / 1e6, 2)} MW/m²`], ["Colour", c.temp < 3500 ? "red-orange" : c.temp < 5000 ? "yellow-orange" : c.temp < 7000 ? "white" : "blue-white"]]; },
  };
})();
