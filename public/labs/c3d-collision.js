/* c3d-collision.js — chemistry 3D, new module: collision theory and the factors affecting reaction rate */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const BOX = 1.35, NP = 44, R = 0.008314; /* kJ mol⁻¹ K⁻¹ */
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const eaEff = (c) => c.Ea * (c.cat ? 0.6 : 1);
  const mbf = (E, T0) => { const k = R * T0; return (2 / Math.sqrt(Math.PI)) * Math.sqrt(E) * Math.pow(k, -1.5) * Math.exp(-E / k); };
  const fracAbove = (Ea, T0) => { let s = 0, dE = 0.05; for (let E = Ea; E < 60 * R * T0 + Ea; E += dE) s += mbf(E + dE / 2, T0) * dE; return clamp(s, 0, 1); };
  const sig = 0.62; /* speed scale at 300 K */

  C3.scenes.collisionTheory = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.85, fov: 36, free: true, cam: [[1.6, 2.6, 8.6], [1.6, 1.7, 0]],
    values: { mode: "coll", T: 300, c: 0.6, Ea: 8, cat: 0, n: 1 },
    state: () => ({ t: 0, coll: 0, eff: 0, hist: [], run: true, win: [], tg: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Factor to explore", options: [{ value: "coll", label: "Collisions: temperature, concentration, catalyst" }, { value: "area", label: "Surface area of a solid reactant" }] },
        { type: "range", key: "T", label: "Temperature (K)", min: 273, max: 420, step: 1, unit: " K" },
        { type: "range", key: "c", label: "Concentration of reactants (relative)", min: 0.2, max: 1.0, step: 0.05 },
        { type: "range", key: "Ea", label: "Activation energy Ea (kJ/mol, scaled for the demo)", min: 4, max: 20, step: 0.5, unit: " kJ/mol" },
        { type: "toggle", key: "cat", label: "Add a catalyst (lowers Ea by 40 %)" },
        { type: "range", key: "n", label: "Cut the solid cube into n × n × n pieces", min: 1, max: 6, step: 1 },
        { type: "button", label: "Restart", action: (S, s) => { s.t = 0; s.coll = 0; s.eff = 0; s.hist = []; s.win = []; s.restart = 1; } },
      ];
    },
    views: [{ label: "Reaction vessel", cam: [[1.6, 2.6, 8.6], [1.6, 1.7, 0]] }, { label: "Close", cam: [[1.0, 2.4, 6.0], [1.3, 1.7, 0]] }],
    note: "Collision theory: a reaction needs particles to collide with at least the activation energy Ea and with the right orientation. Raising the temperature makes particles faster and, more importantly, increases the fraction with E ≥ Ea (the shaded area of the Maxwell–Boltzmann curve), so the rate rises sharply. Higher concentration means more collisions per second. A catalyst offers a path with lower Ea, so more collisions are successful, and is not used up. For a solid, breaking it into smaller pieces exposes more surface, so more particles can collide: the rate rises, but the total product is the same. In the simulation Ea is small (4–20 kJ/mol) so you can see reactions happen in seconds; real activation energies are larger. Collisions are simple hard spheres with a 50 % orientation factor.",
    onChange(S, s, c, key) { s.t = 0; s.coll = 0; s.eff = 0; s.hist = []; s.win = []; s.restart = 1; },
    reset(S, s, c) { Object.assign(c, { mode: "coll", T: 300, c: 0.6, Ea: 8, cat: 0, n: 1 }); s.t = 0; s.coll = 0; s.eff = 0; s.hist = []; s.win = []; s.restart = 1; },
    table(s, c) {
      const Ee = eaEff(c); return '<table class="c3-table"><tr><th style="text-align:left">Factor</th><th style="text-align:left">Effect on particles</th><th style="text-align:left">Effect on rate</th></tr><tr><td style="text-align:left">higher temperature</td><td style="text-align:left">faster; many more with E ≥ Ea</td><td style="text-align:left">large increase</td></tr><tr><td style="text-align:left">higher concentration</td><td style="text-align:left">more collisions per second</td><td style="text-align:left">increase</td></tr><tr><td style="text-align:left">catalyst</td><td style="text-align:left">lower Ea: larger fraction successful</td><td style="text-align:left">increase, not consumed</td></tr><tr><td style="text-align:left">smaller solid pieces</td><td style="text-align:left">larger exposed surface area</td><td style="text-align:left">increase, same final yield</td></tr></table><div style="font:12px/1.5 IBM Plex Mono;color:#7dffbd">At ' + c.T + ' K with Ea(eff) = ' + Ee.toFixed(1) + ' kJ/mol the fraction of collisions with E ≥ Ea is ' + (fracAbove(Ee, c.T) * 100).toFixed(1) + ' %</div>';
    },
    build(S, s, c) {
      S.mk.box(9, 0.1, 4, M.matte(0x1d222b, 0.7), 1.0, -0.05, 0); S.mk.rbox(3.4, 0.15, 3.4, 0.04, M.matte(0x2a2e36, 0.6), 0, 0.075, 0);
      const g = new T.BoxGeometry(BOX * 2, BOX * 2, BOX * 2); s.cube = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.09, roughness: 0.05, depthWrite: false })); s.cube.position.set(0, 0.15 + BOX, 0); S.scene.add(s.cube);
      s.edges = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.55 })); s.edges.position.copy(s.cube.position); S.scene.add(s.edges);
      const mk = (col, r) => { const m = new T.InstancedMesh(new T.SphereGeometry(r, 14, 10), new T.MeshStandardMaterial({ color: col, roughness: 0.3 }), NP * 2); m.frustumCulled = false; S.scene.add(m); return m; };
      s.mA = mk(0x4aa8ff, 0.11); s.mB = mk(0xffa040, 0.11); s.mC = mk(0x56e08a, 0.14); s.m4 = new T.Matrix4(); s.flash = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(64, "rgba(255,255,255,1)"), color: 0xfff2a0, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); s.flash.scale.set(0.5, 0.5, 1); S.scene.add(s.flash);
      /* solid pieces for the surface-area mode */
      s.K = C3.kit(S); s.bk = s.K.beaker(); s.bk.group.position.set(0, 0, 0); s.bl = s.bk.addLiquid({ color: 0xd9ecf8, opacity: 0.3 }); s.bl.setVolume(200); s.pieces = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), M.matte(0xe9e6df, 0.6), 216); s.pieces.frustumCulled = false; S.scene.add(s.pieces);
      s.bub = s.K.bubbles(s.bk, s.bl, { n: 60, x: 0, z: 0, baseY: 0.5, spread: 0.45 });
      s.parts = []; s.restart = 1;
    },
    update(S, s, c, dt) {
      const coll = c.mode === "coll"; s.cube.visible = s.edges.visible = s.mA.visible = s.mB.visible = s.mC.visible = coll; s.bk.group.visible = !coll; s.pieces.visible = !coll; s.flash.visible = coll;
      if (coll) updColl(S, s, c, dt); else updArea(S, s, c, dt);
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      if (c.mode === "coll") ovColl(ctx, s, c, w, h, S, px); else ovArea(ctx, s, c, w, h, S, px);
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "area") { const A = areaOf(c.n); return [["Pieces", c.n * c.n * c.n], ["Total surface area", "× " + (A / 6).toFixed(0) + " compared with the single cube"], ["Relative rate", "× " + (A / 6).toFixed(1)], ["Final volume of gas", "the same for any piece size"], ["Why", "more surface exposed to the acid: more collisions per second"]]; }
      const Ee = eaEff(c); return [["Temperature", c.T + " K"], ["Ea (effective)", Ee.toFixed(1) + " kJ/mol" + (c.cat ? " (catalysed)" : "")], ["Fraction of collisions with E ≥ Ea", (fracAbove(Ee, c.T) * 100).toFixed(1) + " %"], ["Collisions so far", String(s.coll)], ["Effective collisions", String(s.eff)], ["Rate (recent)", (s.rate || 0).toFixed(1) + " reactions per second"]];
    },
    steps(s, c) { return c.mode === "coll" ? [["Watch the collisions at the starting conditions", "done"], ["Raise the temperature: more particles above Ea", c.T > 330 ? "done" : "now"], ["Add a catalyst and compare the rate", c.cat ? "done" : ""], ["Change the concentration", ""]] : [["Start with one solid cube", "done"], ["Cut it into smaller pieces", c.n > 1 ? "done" : "now"], ["Compare the speed of gas production", ""], ["Note that the final volume is the same", ""]]; },
  };
  const areaOf = (n) => 6 * n; /* relative to a unit cube: total area = 6 L² n */
  function seed(s, c) {
    s.parts = []; const n = Math.round(NP * c.c); const sg = sig * Math.sqrt(c.T / 300);
    for (let i = 0; i < n * 2; i++) s.parts.push({ t: i < n ? 0 : 1, x: (Math.random() * 2 - 1) * (BOX - 0.2), y: (Math.random() * 2 - 1) * (BOX - 0.2), z: (Math.random() * 2 - 1) * (BOX - 0.2), vx: gauss() * sg, vy: gauss() * sg, vz: gauss() * sg, alive: true });
    s.restart = 0; s.sgT = c.T;
  }
  function updColl(S, s, c, dt) {
    if (s.restart || !s.parts.length) seed(s, c);
    const sg = sig * Math.sqrt(c.T / 300), k = sg / (s.sgT ? sig * Math.sqrt(s.sgT / 300) : sg); if (Math.abs(k - 1) > 1e-3) { s.parts.forEach((q) => { q.vx *= k; q.vy *= k; q.vz *= k; }); s.sgT = c.T; }
    const dts = Math.min(dt, 0.04), Ee = eaEff(c), L = BOX - 0.12, ps = s.parts; s.t += dts; let ev = 0;
    for (let sub = 0; sub < 2; sub++) { const d2 = dts / 2; ps.forEach((q) => { if (!q.alive) return; q.x += q.vx * d2; q.y += q.vy * d2; q.z += q.vz * d2; if (Math.abs(q.x) > L) { q.vx = -q.vx; q.x = Math.sign(q.x) * L; } if (Math.abs(q.y) > L) { q.vy = -q.vy; q.y = Math.sign(q.y) * L; } if (Math.abs(q.z) > L) { q.vz = -q.vz; q.z = Math.sign(q.z) * L; } });
      if (dts > 0) for (let i = 0; i < ps.length; i++) { const a = ps[i]; if (!a.alive || a.t === 2) continue; for (let j = i + 1; j < ps.length; j++) { const b = ps[j]; if (!b.alive || b.t === 2 || a.t === b.t) continue; const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z, d2c = dx * dx + dy * dy + dz * dz; if (d2c < 0.05) { const vx = a.vx - b.vx, vy = a.vy - b.vy, vz = a.vz - b.vz, v2 = vx * vx + vy * vy + vz * vz, Erel = R * 300 * (0.25 * v2) / (sig * sig); s.coll++; if (Erel >= Ee && Math.random() < 0.5) { a.t = 2; b.alive = false; s.eff++; ev++; s.fx = [a.x, a.y, a.z, 1]; } else { const d = Math.sqrt(d2c) || 1, nx = dx / d, ny = dy / d, nz = dz / d, dv = vx * nx + vy * ny + vz * nz; if (dv < 0) { a.vx -= dv * nx; a.vy -= dv * ny; a.vz -= dv * nz; b.vx += dv * nx; b.vy += dv * ny; b.vz += dv * nz; } } } } } }
    s.win.push([s.t, ev]); while (s.win.length && s.win[0][0] < s.t - 2) s.win.shift(); s.rate = s.win.reduce((q, e) => q + e[1], 0) / Math.max(0.5, Math.min(2, s.t));
    const nA = ps.filter((q) => q.alive && q.t === 0).length, nB = ps.filter((q) => q.alive && q.t === 1).length, nC = ps.filter((q) => q.alive && q.t === 2).length; s.cnt = [nA, nB, nC];
    if (dts > 0 && (!s.hist.length || s.t - s.hist[s.hist.length - 1][0] > 0.4)) s.hist.push([s.t, nA]);
    const m4 = s.m4; let ia = 0, ib = 0, ic = 0; ps.forEach((q) => { if (!q.alive) return; m4.makeTranslation(q.x, 0.15 + BOX + q.y, q.z); if (q.t === 0) s.mA.setMatrixAt(ia++, m4); else if (q.t === 1) s.mB.setMatrixAt(ib++, m4); else s.mC.setMatrixAt(ic++, m4); });
    s.mA.count = ia; s.mB.count = ib; s.mC.count = ic; s.mA.instanceMatrix.needsUpdate = s.mB.instanceMatrix.needsUpdate = s.mC.instanceMatrix.needsUpdate = true;
    if (s.fx) { s.fx[3] -= dt * 3; s.flash.position.set(s.fx[0], 0.15 + BOX + s.fx[1], s.fx[2]); s.flash.material.opacity = Math.max(0, s.fx[3]); }
  }
  function updArea(S, s, c, dt) {
    if (dt > 0) s.t += dt; const n = c.n, kk = 0.12 * n, tt = s.t, V = 1 - Math.exp(-kk * tt * 0.6); s.V = V; s.bub.rate = (1 - V) * 0.9 * n / 3;
    const m4 = s.m4, size = 1.2 / n, tot = n * n * n; let i = 0; const q = new T.Quaternion(), sc = new T.Vector3(), p = new T.Vector3(), rem = clamp(1 - V, 0.05, 1);
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let d = 0; d < n; d++) { const ps = size * Math.cbrt(rem) * 0.96; p.set(((a + 0.5) / n - 0.5) * 1.2, 0.2 + ((b + 0.5) / n) * 0.6, ((d + 0.5) / n - 0.5) * 1.2); sc.set(ps, ps, ps); m4.compose(p, q, sc); s.pieces.setMatrixAt(i++, m4); }
    s.pieces.count = tot; s.pieces.instanceMatrix.needsUpdate = true; s.bub.update(dt, S.t); s.bl.update(S.t);
  }
  function ovColl(ctx, s, c, w, h, S, px) {
    const Ee = eaEff(c), cnt = s.cnt || [0, 0, 0]; H.pill(ctx, 10, 22, "Collision theory: A + B → C", "#ffe9b8", 11); H.pill(ctx, 10, 44, "reaction only if collision energy ≥ Ea (and orientation is right)", "#9fe3ff", 9.5);
    const q = S.proj(V3(0, 3.1, 0)); H.pill(ctx, q.x, q.y, "● A: " + cnt[0] + "   ● B: " + cnt[1] + "   ● C: " + cnt[2], "#bcd0ea", 8.5, "center");
    const gx = px, gy = 58, gw = 240, gh = 130, Emax = Math.max(Ee * 2.2, R * 420 * 4), pts = [], ref = []; for (let i = 1; i <= 80; i++) { const E = (Emax * i) / 80; pts.push([E, mbf(E, c.T)]); ref.push([E, mbf(E, 300)]); }
    const ymax = Math.max(...pts.map((p) => p[1]), ...ref.map((p) => p[1])) * 1.1;
    H.graph(ctx, gx, gy, gw, gh, { series: [{ pts: ref, color: "rgba(150,170,200,0.55)", width: 1 }, { pts, color: "#ff9a5a", width: 2 }], xmin: 0, xmax: Emax, ymin: 0, ymax, ticksX: 4, ticksY: 3, xl: "energy E / kJ mol⁻¹", yl: "fraction of particles" });
    const X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40; ctx.fillStyle = "rgba(255,150,90,0.35)"; ctx.beginPath(); ctx.moveTo(X0 + (Ee / Emax) * PW, Y0 + PH); pts.forEach((p) => { if (p[0] >= Ee) ctx.lineTo(X0 + (p[0] / Emax) * PW, Y0 + PH - (p[1] / ymax) * PH); }); ctx.lineTo(X0 + PW, Y0 + PH); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#ffd27a"; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(X0 + (Ee / Emax) * PW, Y0); ctx.lineTo(X0 + (Ee / Emax) * PW, Y0 + PH); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#ffd27a"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("Ea", X0 + (Ee / Emax) * PW + 3, Y0 + 9); ctx.fillStyle = "#9fb2d2"; ctx.fillText("grey: 300 K", X0 + PW - 52, Y0 + 9);
    H.panel(ctx, px, 194, 240, 100); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Successful collisions", px + 8, 209); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("E ≥ Ea (" + Ee.toFixed(1) + " kJ/mol): " + (fracAbove(Ee, c.T) * 100).toFixed(1) + " %", px + 8, 224); ctx.fillText("collisions: " + s.coll + "   effective: " + s.eff, px + 8, 238); ctx.fillStyle = "#8dffb8"; ctx.fillText("rate ≈ " + (s.rate || 0).toFixed(1) + " reactions/s", px + 8, 252); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; wrapT(ctx, c.cat ? "catalyst: lower Ea, larger shaded area" : "shaded area = particles able to react", px + 8, 268, 224, 10);
  }
  function ovArea(ctx, s, c, w, h, S, px) {
    const n = c.n, A = areaOf(n); H.pill(ctx, 10, 22, "Surface area: " + n * n * n + " piece" + (n > 1 ? "s" : "") + " of marble in acid", "#ffe9b8", 11); H.pill(ctx, 10, 44, "total surface area × " + (A / 6).toFixed(0) + "  →  rate × " + (A / 6).toFixed(0), "#9fe3ff", 10);
    const pts1 = [], ptsn = []; for (let i = 0; i <= 50; i++) { const t = (i / 50) * 40; pts1.push([t, 1 - Math.exp(-0.12 * 0.6 * t)]); ptsn.push([t, 1 - Math.exp(-0.12 * n * 0.6 * t)]); }
    H.graph(ctx, px, 58, 240, 130, { series: [{ pts: pts1, color: "rgba(150,170,200,0.8)", width: 1.5 }, { pts: ptsn, color: "#56e08a", width: 2 }], xmin: 0, xmax: 40, ymin: 0, ymax: 1.05, ticksX: 4, ticksY: 3, xl: "time / s", yl: "volume of CO₂ (relative)", dot: [Math.min(s.t || 0, 40), s.V || 0, "#ffd27a"] });
    H.panel(ctx, px, 194, 240, 96); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; wrapT(ctx, "Grey: single cube. Green: your pieces. The curve rises faster with a bigger surface area, but both finish at the same volume because the same mass of marble reacts. Surface area is what counts for solids.", px + 8, 210, 224, 11);
  }
})();
