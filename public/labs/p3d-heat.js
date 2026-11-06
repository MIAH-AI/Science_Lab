/* p3d-heat.js — heat, temperature and the gas laws: photoreal three.js scenes with corrected physics. */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, S_ = P.scenes;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mixc = (a, b, k) => new T.Color(a).lerp(new T.Color(b), clamp(k, 0, 1));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const disposeGroup = (g) => { while (g.children.length) { const m = g.children.pop(); if (m.geometry) m.geometry.dispose(); } };
  const sm = (x) => x * x * (3 - 2 * x);

  /* ---------- shared apparatus ---------- */
  function thermometer(S, x, y, z, h) {
    const g = new T.Group(), liq = new T.MeshStandardMaterial({ color: 0xe0302a, roughness: 0.25, emissive: 0xe0302a, emissiveIntensity: 0.35 });
    const tube = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, h, 16), M.glass()); tube.position.y = h / 2; tube.renderOrder = 3;
    const bulb = new T.Mesh(new T.SphereGeometry(0.13, 20, 14), liq), col = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 10), liq);
    for (let i = 0; i <= 10; i++) { const t = new T.Mesh(new T.BoxGeometry(0.1, 0.012, 0.01), M.matte(0x222222, 0.5)); t.position.set(0, 0.25 + (i / 10) * (h - 0.5), 0.075); g.add(t); }
    g.add(tube, bulb, col); g.position.set(x, y, z); S.scene.add(g);
    g.set = (f) => { const L = Math.max(0.03, clamp(f, 0, 1) * (h - 0.4)); col.scale.y = L; col.position.y = L / 2 + 0.05; };
    g.set(0.3); g.h = h; return g;
  }
  function bunsen(S, x, z) {
    const g = new T.Group(), mk = S.mk;
    const base = new T.Mesh(new T.CylinderGeometry(0.55, 0.62, 0.14, 32), M.matte(0x22262d, 0.4)); base.position.y = 0.07; base.castShadow = true;
    const barrel = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 1.05, 24), M.chrome()); barrel.position.y = 0.66; barrel.castShadow = true;
    const col = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.12, 20), M.brass()); col.position.y = 0.34;
    const fo = new T.Mesh(new T.ConeGeometry(0.2, 1, 24), new T.MeshBasicMaterial({ color: 0xffa23a, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
    const fi = new T.Mesh(new T.ConeGeometry(0.11, 1, 20), new T.MeshBasicMaterial({ color: 0x4a8cff, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
    const light = new T.PointLight(0xff9a40, 0, 9, 1.6); light.position.y = 1.7;
    g.add(base, barrel, col, fo, fi, light); g.position.set(x, 0, z); S.scene.add(g);
    g.set = (p, t) => { const k = 1 + 0.08 * Math.sin(t * 37) + 0.05 * Math.sin(t * 23 + 1); fo.visible = fi.visible = p > 0.02; const h1 = (0.25 + 0.95 * p) * k, h2 = (0.12 + 0.45 * p) * k; fo.scale.set(0.5 + 0.6 * p, h1, 0.5 + 0.6 * p); fo.position.y = 1.19 + h1 / 2; fi.scale.set(0.5 + 0.4 * p, h2, 0.5 + 0.4 * p); fi.position.y = 1.19 + h2 / 2; light.intensity = p * 14 * k; };
    g.set(0, 0); return g;
  }
  function hotplate(S, w, d, x, z) {
    const mk = S.mk, g = {}; mk.rbox(w, 0.34, d, 0.08, M.paint(0x24272e), x, 0.17, z);
    g.coil = new T.Mesh(new T.TorusGeometry(Math.min(w, d) * 0.3, 0.045, 10, 48), new T.MeshStandardMaterial({ color: 0x331a10, emissive: 0xff4a12, emissiveIntensity: 0.1, roughness: 0.6 })); g.coil.rotation.x = Math.PI / 2; g.coil.position.set(x, 0.36, z); S.scene.add(g.coil);
    g.coil2 = new T.Mesh(new T.TorusGeometry(Math.min(w, d) * 0.18, 0.04, 10, 40), g.coil.material); g.coil2.rotation.x = Math.PI / 2; g.coil2.position.set(x, 0.36, z); S.scene.add(g.coil2);
    g.light = new T.PointLight(0xff6a2a, 0, 8, 1.6); g.light.position.set(x, 0.9, z); S.scene.add(g.light);
    g.set = (p) => { g.coil.material.emissiveIntensity = 0.1 + p * 3.6; g.light.intensity = p * 16; }; return g;
  }
  /* analogue pressure gauge with a live canvas dial */
  function gauge(S, x, y, z, r, max, unit) {
    const cv = P.util.cv(256, 256), cx = cv.getContext("2d"), tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const g = new T.Group(), face = new T.Mesh(new T.CircleGeometry(r * 0.94, 48), new T.MeshStandardMaterial({ map: tex, roughness: 0.4 })), rim = new T.Mesh(new T.TorusGeometry(r, r * 0.07, 14, 56), M.chrome()), back = new T.Mesh(new T.CylinderGeometry(r, r, r * 0.35, 40), M.steel());
    back.rotation.x = Math.PI / 2; back.position.z = -r * 0.18; face.position.z = 0.002; const lens = new T.Mesh(new T.CircleGeometry(r * 0.94, 40), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.02, clearcoat: 1, depthWrite: false })); lens.position.z = r * 0.05;
    g.add(face, rim, back, lens); g.position.set(x, y, z); S.scene.add(g);
    let last = -1;
    g.set = (v) => {
      v = clamp(v, 0, max); if (Math.abs(v - last) < max * 0.002) return; last = v; const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
      cx.fillStyle = "#f4f1e6"; cx.fillRect(0, 0, 256, 256); cx.strokeStyle = "#222"; cx.fillStyle = "#222"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.font = "bold 17px sans-serif";
      for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * (i / 40), big = i % 5 === 0; cx.lineWidth = big ? 3 : 1.5; cx.beginPath(); cx.moveTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104); cx.lineTo(128 + Math.cos(a) * (big ? 86 : 94), 128 + Math.sin(a) * (big ? 86 : 94)); cx.stroke(); if (big) cx.fillText(Math.round((max * i) / 40) + "", 128 + Math.cos(a) * 68, 128 + Math.sin(a) * 68); }
      cx.font = "bold 20px sans-serif"; cx.fillText(unit, 128, 176); cx.font = "13px sans-serif"; cx.fillText("PRESSURE", 128, 198);
      const a = a0 + (a1 - a0) * (v / max); cx.strokeStyle = "#c4151c"; cx.lineWidth = 5; cx.lineCap = "round"; cx.beginPath(); cx.moveTo(128 - Math.cos(a) * 18, 128 - Math.sin(a) * 18); cx.lineTo(128 + Math.cos(a) * 84, 128 + Math.sin(a) * 84); cx.stroke(); cx.fillStyle = "#222"; cx.beginPath(); cx.arc(128, 128, 9, 0, TAU); cx.fill(); tex.needsUpdate = true;
    }; g.set(0); return g;
  }
  /* ideal-gas particles in a cylindrical region, axis 0 = x or 1 = y */
  function gasInit(s, N, reg) {
    s.pos = []; s.vel = []; s.f = []; for (let i = 0; i < N; i++) { const a = rnd(0, TAU), rr = reg.R * Math.sqrt(Math.random()) * 0.9, p = V3(); p.setComponent(reg.ax, rnd(reg.lo, reg.hi)); if (reg.ax === 0) { p.y = reg.yc + Math.cos(a) * rr; p.z = Math.sin(a) * rr; } else { p.x = Math.cos(a) * rr; p.z = Math.sin(a) * rr; p.y = clamp(p.y, reg.lo, reg.hi); }
      s.pos.push(p); s.vel.push(V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize()); s.f.push(0.55 + 0.9 * Math.random()); }
  }
  function gasStep(s, dt, reg, v0, rr) {
    let hits = 0;
    for (let i = 0; i < s.pos.length; i++) {
      const p = s.pos[i], v = s.vel[i]; p.addScaledVector(v, dt * v0 * s.f[i]); const ax = reg.ax, rad = ax === 0 ? ["y", "z"] : ["x", "z"], c0 = ax === 0 ? reg.yc : 0;
      let a = p.getComponent(ax); if (a < reg.lo + rr) { a = reg.lo + rr; if (v.getComponent(ax) < 0) { v.setComponent(ax, -v.getComponent(ax)); hits++; } } if (a > reg.hi - rr) { a = reg.hi - rr; if (v.getComponent(ax) > 0) { v.setComponent(ax, -v.getComponent(ax)); hits++; } } p.setComponent(ax, a);
      const u = p[rad[0]] - c0, w = p[rad[1]], d = Math.hypot(u, w); if (d > reg.R - rr) { const nu = u / d, nw = w / d; p[rad[0]] = c0 + nu * (reg.R - rr); p[rad[1]] = nw * (reg.R - rr); const vn = v[rad[0]] * nu + v[rad[1]] * nw; if (vn > 0) { v[rad[0]] -= 2 * vn * nu; v[rad[1]] -= 2 * vn * nw; hits++; } }
    }
    return hits;
  }

  /* ================= HEATING CURVE ================= */
  const cI = 2100, cW = 4200, cS = 2010, Lf = 334000, Lv = 2.26e6;
  const hq = (m) => { const q1 = m * cI * 20, q2 = q1 + m * Lf, q3 = q2 + m * cW * 100, q4 = q3 + m * Lv, q5 = q4 + m * cS * 20; return [q1, q2, q3, q4, q5]; };
  const hT = (Q, m) => { const [q1, q2, q3, q4, q5] = hq(m); if (Q < q1) return -20 + Q / (m * cI); if (Q < q2) return 0; if (Q < q3) return (Q - q2) / (m * cW); if (Q < q4) return 100; return 100 + (Math.min(Q, q5) - q4) / (m * cS); };
  const hStage = (Q, m) => { const q = hq(m); return Q < q[0] ? 0 : Q < q[1] ? 1 : Q < q[2] ? 2 : Q < q[3] ? 3 : 4; };
  const STG = ["ICE warming up", "ICE MELTING (0 °C plateau)", "WATER warming up", "WATER BOILING (100 °C plateau)", "STEAM warming up"];
  S_["Heating Curve"] = {
    env: "lab", envOpts: { w: 15, d: 8 }, cam: [[0, 3.6, 10], [0, 2.4, 0]], fov: 36, sub: 4,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.hp = hotplate(S, 3.4, 3.4, 0, 0); o.bk = mk.beaker(1.1, 3.0, 1, 0x2f93d8); o.bk.position.y = 0.34; o.bk.water.material.opacity = 0.62;
      o.ice = []; for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshPhysicalMaterial({ color: 0xd6efff, roughness: 0.12, transmission: 0.6, thickness: 0.5, transparent: true, opacity: 0.85, clearcoat: 1 })); m.castShadow = true; S.scene.add(m); o.ice.push(m); }
      o.th = thermometer(S, 0.3, 0.55, 0.25, 4.0); o.th.rotation.z = -0.1; o.bub = mk.particles(40, 0.06, M.plastic(0xeaf6ff, 0.1)); o.bub.material.transparent = true; o.bub.material.opacity = 0.75; o.bub.userData.p = Array.from({ length: 40 }, () => ({ x: rnd(-0.7, 0.7), y: rnd(0, 2), z: rnd(-0.7, 0.7), v: rnd(0.6, 1.4) }));
      o.steam = 0;
    },
    reset(s, c) { s.Q = 0; s.ts = 0; s.tr = [[0, -20]]; s.hold = 0; s.done = false; },
    step(s, c, dt) {
      if (s.Q === undefined) P.scenes["Heating Curve"].reset(s, c); if (s.hold > 0) { s.hold -= dt; if (s.hold <= 0 && s.done) P.scenes["Heating Curve"].reset(s, c); return; }
      const q5 = hq(c.mass)[4], warp = q5 / (c.power * 50); s.Q += c.power * dt * warp; s.ts += dt * warp;
      const last = s.tr[s.tr.length - 1]; if (s.Q / 1000 - last[0] > q5 / 1000 / 260) s.tr.push([s.Q / 1000, hT(s.Q, c.mass)]); if (s.Q >= q5) { s.Q = q5; s.done = true; s.hold = 2.5; s.tr.push([q5 / 1000, 120]); }
    },
    update(S, s, c, dt) {
      const o = S.objs; if (s.Q === undefined) return; const m = c.mass, q = hq(m), Q = s.Q, Tm = hT(Q, m), st = hStage(Q, m), hFull = 0.8 + 0.8 * m;
      const melt = clamp((Q - q[0]) / (q[1] - q[0]), 0, 1), vap = clamp((Q - q[2]) / (q[3] - q[2]), 0, 1), lvl = hFull * 0.95 * melt * (1 - vap) + 0.001;
      o.bk.setLevel(Math.max(0.001, lvl)); o.bk.water.visible = melt > 0.01 && vap < 0.995;
      const iceF = 1 - melt, sc = 0.1 + 0.4 * Math.cbrt(Math.max(0, iceF)) * (0.7 + 0.3 * Math.min(1, m)); o.ice.forEach((b, i) => { const a = i * 1.05, rr = i < 3 ? 0.0 : 0.38; b.visible = iceF > 0.01; b.scale.setScalar(sc * (1 + (i % 3) * 0.1)); const floatY = 0.34 + 0.03 + Math.max(lvl, sc * 0.6) - sc * 0.3 * (melt > 0 ? 1 : 0); b.position.set(Math.cos(a) * rr * (i < 3 ? 1.3 : 0.7) + (i < 3 ? (i - 1) * 0.28 : 0), (melt > 0.02 ? floatY : 0.34 + 0.05 + sc * 0.5) + (i < 3 ? 0 : sc * 0.75 * (melt > 0.02 ? 0 : 1)), Math.sin(a) * rr * 0.7); b.rotation.set(0.3 * i, 0.7 * i + S.t * 0.05 * melt, 0.2 * i); });
      o.hp.set(c.power / 1000); o.th.set((Tm + 20) / 140); o.th.position.y = 0.4;
      const boiling = st === 3, hot = Tm > 92, br = boiling ? 1 : clamp((Tm - 85) / 15, 0, 0.5); const bp = o.bub.userData.p;
      for (let i = 0; i < 40; i++) { const b = bp[i]; if (!o.bk.water.visible || br < 0.05 || i > 6 + 33 * br) { o.bub.set(i, 0, -50, 0, 0.001); continue; } b.y += b.v * dt * (0.8 + br); if (b.y > Math.max(0.2, lvl)) { b.y = 0; b.x = rnd(-0.75, 0.75); b.z = rnd(-0.75, 0.75); } o.bub.set(i, b.x, 0.4 + b.y, b.z, 0.6 + 0.7 * (b.y / Math.max(0.3, lvl))); } o.bub.instanceMatrix.needsUpdate = true;
      if ((hot && vap < 0.995) || st === 4) { o.steam += dt * (boiling ? 24 : st === 4 ? 30 : 6 * br); while (o.steam > 1) { o.steam -= 1; S.puff(rnd(-0.5, 0.5), 0.34 + 3.1, rnd(-0.5, 0.5), { n: 1, color: 0xf2f6fa, life: 1.6, size: 0.7, op: 0.38, speed: 0.4, up: 2.0, grow: 2.6 }); } }
      S.aim([0, 2.1, 0], 8.6, 0.1, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.Q === undefined) return; const m = c.mass, q = hq(m), Tm = hT(s.Q, m), st = hStage(s.Q, m), kJ = (v) => f1(v / 1000, 1);
      H.pill(ctx, 14, 26, STG[st], st % 2 ? "#ffb870" : "#8df0be", 10.5);
      const lines = [`Q = m c Δθ = ${m} × 2100 × Δθ   (c_ice)`, `Q = m L_f = ${m} × 334 000 = ${kJ(m * Lf)} kJ (flat)`, `Q = m c Δθ = ${m} × 4200 × Δθ   (c_water)`, `Q = m L_v = ${m} × 2.26×10⁶ = ${kJ(m * Lv)} kJ (flat)`, `Q = m c Δθ = ${m} × 2010 × Δθ   (c_steam)`];
      H.pill(ctx, 14, 48, lines[st], "#cfe0ff", 10); H.pill(ctx, 14, 70, `θ = ${f1(Tm, 0)} °C    Q supplied = ${kJ(s.Q)} kJ    P = ${c.power} W`, "#ffd27a", 10.5); H.pill(ctx, 14, 92, `simulated time ${f1(s.ts / 60, 1)} min  (Q = P t)`, "#9fb8d8", 9.5);
      H.graph(ctx, w - 200, 12, 188, 128, { xmin: 0, xmax: q[4] / 1000, ymin: -20, ymax: 120, xl: "Q (kJ)", yl: "θ (°C)", ticksX: 4, ticksY: 4, series: [{ pts: [[0, -20], [q[0] / 1000, 0], [q[1] / 1000, 0], [q[2] / 1000, 100], [q[3] / 1000, 100], [q[4] / 1000, 120]], color: "rgba(255,255,255,.22)", width: 1.2 }, { pts: s.tr, color: "#ffb703", width: 2.4 }], dot: [s.Q / 1000, Tm, "#ffd27a"] });
      const tp = S.proj(V3(0.0, 4.4, 0.2)); H.pill(ctx, tp.x + 12, tp.y, `${f1(Tm, 0)} °C`, "#ffe8b0", 10.5);
    },
    readouts(s, c) { if (s.Q === undefined) return [["Heat supplied", "0 kJ"], ["Temperature", "-20 °C"]]; const Tm = hT(s.Q, c.mass); return [["Heat supplied", `${f1(s.Q / 1000, 1)} kJ`], ["Temperature", `${f1(Tm, 0)} °C`], ["State", ["Ice", "Ice + water (melting)", "Water", "Water + steam (boiling)", "Steam"][hStage(s.Q, c.mass)]], ["Simulated time", `${f1(s.ts / 60, 1)} min`]]; },
  };

  /* ================= BOYLE'S LAW ================= */
  const BR = 1.45, BX0 = -4, BKU = 1.6, NB = 70;
  S_["Boyle's Law (P–V)"] = {
    env: "lab", envOpts: { w: 17, d: 8 }, cam: [[0, 3.8, 12], [0.3, 1.9, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, yc = 1.95;
      const tube = new T.Mesh(new T.CylinderGeometry(BR + 0.04, BR + 0.04, 8.4, 56, 1, true), M.glass()); tube.rotation.z = Math.PI / 2; tube.position.set(0.2, yc, 0); tube.renderOrder = 3; S.scene.add(tube);
      mk.cyl(BR + 0.2, BR + 0.2, 0.25, M.steel(), BX0 - 0.1, yc, 0).rotation.z = Math.PI / 2; mk.box(0.8, 0.4, 2.2, M.matte(0x22262d, 0.45), -2.5, 0.2, 0); mk.box(0.8, 0.4, 2.2, M.matte(0x22262d, 0.45), 2.8, 0.2, 0); mk.box(0.7, 0.5, 1.2, M.steel(), -2.5, 0.65, 0); mk.box(0.7, 0.5, 1.2, M.steel(), 2.8, 0.65, 0);
      for (let i = 0; i <= 5; i++) { const t = new T.Mesh(new T.BoxGeometry(0.03, 0.02, 0.4), M.matte(0x222222, 0.5)); t.position.set(BX0 + i * BKU, yc - BR - 0.04, 0.0); S.scene.add(t); }
      o.pis = new T.Group(); const disc = new T.Mesh(new T.CylinderGeometry(BR - 0.02, BR - 0.02, 0.32, 48), M.steel()); disc.rotation.z = Math.PI / 2; disc.castShadow = true; o.pis.add(disc); o.pisM = disc.material = new T.MeshPhysicalMaterial({ color: 0xc8ccd2, metalness: 1, roughness: 0.28, emissive: 0xffb050, emissiveIntensity: 0 });
      const rod = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 3.6, 16), M.chrome()); rod.rotation.z = Math.PI / 2; rod.position.x = 1.9; const knob = new T.Mesh(new T.SphereGeometry(0.34, 24, 18), M.rubber()); knob.position.x = 3.7; o.pis.add(rod, knob); o.pis.position.y = yc; S.scene.add(o.pis);
      o.g = gauge(S, 0.2, 4.55, 0, 0.78, 800, "kPa"); mk.rod(V3(0.2, yc + BR, 0), V3(0.2, 3.8, 0), 0.07, M.steel()); mk.torus(0.12, 0.04, M.brass(), 0.2, yc + BR + 0.02, 0).rotation.x = Math.PI / 2;
      s.init = false; o.gas = mk.particles(NB, 0.1, M.plastic(0x4aa8ff, 0.2)); o.reg = { ax: 0, lo: BX0 + 0.12, hi: 0, R: BR - 0.05, yc }; o.pv = 0; o.flash = 0;
    },
    reset(s, c) { s.vp = BX0 + c.volume * BKU; s.init = false; },
    step(s, c, dt) {
      const o = P.S && P.S.objs; if (!o || !o.reg) return; if (!s.init || !s.pos) { s.init = true; s.vp = BX0 + c.volume * BKU; o.reg.hi = s.vp; gasInit(s, NB, o.reg); }
      const tgt = BX0 + c.volume * BKU; s.vp += clamp(tgt - s.vp, -6 * dt, 6 * dt); o.reg.hi = s.vp; for (const p of s.pos) if (p.x > s.vp - 0.1) p.x = s.vp - 0.12;
      const h = gasStep(s, dt, o.reg, 3.4, 0.1); s.hits = (s.hits || 0) * 0.9 + h;
    },
    update(S, s, c) {
      const o = S.objs; if (!s.pos) return; const P_ = c.P0 / c.volume; o.pis.position.x = s.vp + 0.16; o.g.set(P_); for (let i = 0; i < NB; i++) o.gas.set(i, s.pos[i].x, s.pos[i].y, s.pos[i].z); o.gas.instanceMatrix.needsUpdate = true;
      o.pisM.emissiveIntensity = clamp((s.hits || 0) * 0.02, 0, 0.5); S.aim([0.3, 2.1, 0], 12.4, 0.0, 0.17);
    },
    overlay(ctx, s, c, w, h, S) {
      const P_ = c.P0 / c.volume; H.pill(ctx, 14, 26, "Boyle's law:  P V = constant  (T constant)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `P = ${c.P0} / ${f1(c.volume, 1)} = ${f1(P_, 1)} kPa`, "#8df0be", 10.5); H.pill(ctx, 14, 70, `P₁V₁ = P₂V₂ :  ${f1(P_, 0)} × ${f1(c.volume, 1)} = ${f1(P_ * c.volume, 0)} kPa·L`, "#cfe0ff", 10.5); H.pill(ctx, 14, 92, "smaller V → molecules hit the walls more often → higher P", "#9fb8d8", 9.5);
      for (let i = 1; i <= 5; i++) { const q = S.proj(V3(BX0 + i * BKU, 0.3, 1.6)); H.pill(ctx, q.x, q.y + 6, `${i} L`, "#e8f1ff", 9, "center"); }
      const pts = []; for (let v = 0.5; v <= 5.001; v += 0.1) pts.push([v, c.P0 / v]);
      H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0, xmax: 5, ymin: 0, ymax: c.P0 / 0.5, xl: "V (L)", yl: "P (kPa)", ticksX: 5, ticksY: 4, series: [{ pts, color: "#7fe3da", width: 2.2 }], dot: [c.volume, P_, "#ffd27a"] });
    },
  };

  /* ================= CHARLES' LAW ================= */
  const CH = 6.2, CYL = 5.3 / 18, NC = 56;
  S_["Charles' Law (V–T)"] = {
    env: "lab", envOpts: { w: 15, d: 8 }, cam: [[0, 4.2, 12.5], [0, 3.3, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.hp = hotplate(S, 3.6, 3.6, 0, 0); const R = 1.3;
      const tube = new T.Mesh(new T.CylinderGeometry(R + 0.04, R + 0.04, CH + 0.4, 56, 1, true), M.glass()); tube.position.y = 0.34 + (CH + 0.4) / 2; tube.renderOrder = 3; S.scene.add(tube);
      mk.cyl(R + 0.12, R + 0.12, 0.12, M.steel(), 0, 0.4, 0);
      o.pis = new T.Group(); const d = new T.Mesh(new T.CylinderGeometry(R - 0.02, R - 0.02, 0.28, 48), M.steel()); d.castShadow = true; o.pis.add(d); const wt = S.mk.slotted(3); S.scene.remove(wt); wt.scale.set(2.2, 2.2, 2.2); wt.position.y = 0.14; o.pis.add(wt); S.scene.add(o.pis);
      for (let i = 0; i <= 9; i++) { const t = new T.Mesh(new T.BoxGeometry(0.4, 0.03, 0.02), M.matte(0x111111, 0.5)); t.position.set(R + 0.02, 0.52 + i * 2 * CYL, 0.0); S.scene.add(t); }
      s.init = false; o.gas = mk.particles(NC, 0.1, M.plastic(0x4aa8ff, 0.2)); o.reg = { ax: 1, lo: 0.52, hi: 3, R: R - 0.05, yc: 0 }; o.th = thermometer(S, 2.6, 0.45, 0.3, 4.6); o.R = R;
    },
    reset(s, c) { s.init = false; },
    step(s, c, dt) {
      const o = P.S && P.S.objs; if (!o || !o.reg) return; const ytgt = 0.52 + c.k * c.temp * CYL;
      if (!s.init || !s.pos) { s.init = true; s.yp = ytgt; o.reg.hi = s.yp; gasInit(s, NC, o.reg); } s.yp += clamp(ytgt - s.yp, -3 * dt, 3 * dt); o.reg.hi = s.yp; for (const p of s.pos) if (p.y > s.yp - 0.1) p.y = s.yp - 0.12;
      gasStep(s, dt, o.reg, 3.2 * Math.sqrt(c.temp / 300), 0.1);
    },
    update(S, s, c) {
      const o = S.objs; if (!s.pos) return; const k = (c.temp - 250) / 350; o.pis.position.y = s.yp + 0.14; o.hp.set(clamp(k * 1.1, 0, 1)); o.th.set((c.temp - 250) / 350);
      for (let i = 0; i < NC; i++) o.gas.set(i, s.pos[i].x, s.pos[i].y, s.pos[i].z); o.gas.instanceMatrix.needsUpdate = true; o.gas.material.color.copy(mixc(0x4aa8ff, 0xff4a2e, k)); S.aim([0, 3.4, 0], 13, 0.12, 0.16);
    },
    overlay(ctx, s, c, w, h, S) {
      const V = c.k * c.temp; H.pill(ctx, 14, 26, "Charles' law:  V / T = constant  (P constant)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `V = k T = ${c.k} × ${c.temp} = ${f1(V, 2)} L      (T in kelvin!)`, "#8df0be", 10.5); H.pill(ctx, 14, 70, `θ = T − 273 = ${c.temp - 273} °C      V/T = ${f1(V / c.temp, 4)} L/K`, "#cfe0ff", 10.5); H.pill(ctx, 14, 92, "faster molecules push the free piston up (P unchanged)", "#9fb8d8", 9.5);
      H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0, xmax: 600, ymin: 0, ymax: c.k * 600, xl: "T (K)", yl: "V (L)", ticksX: 6, ticksY: 4, series: [{ pts: [[0, 0], [600, c.k * 600]], color: "#7fe3da", width: 2.2 }], dot: [c.temp, V, "#ffd27a"] });
      for (let i = 1; i <= 9; i += 2) { const q = S.proj(V3(1.9, 0.52 + i * 2 * CYL, 0.2)); H.pill(ctx, q.x + 2, q.y + 3, `${i * 2} L`, "#e8f1ff", 8.5); } const q = S.proj(V3(2.6, 0.9, 0.3)); H.pill(ctx, q.x + 12, q.y, `${c.temp} K`, "#ffe8b0", 10.5);
    },
  };

  /* ================= PRESSURE LAW ================= */
  S_["Pressure Law (P–T)"] = {
    env: "lab", envOpts: { w: 15, d: 8 }, cam: [[0, 4.4, 12], [0, 3.0, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.hp = hotplate(S, 3.6, 3.6, 0, 0); const R = 1.5, Hh = 3.6;
      const fl = new T.Mesh(new T.CylinderGeometry(R + 0.04, R + 0.04, Hh, 56, 1, true), M.glass()); fl.position.y = 0.4 + Hh / 2; fl.renderOrder = 3; S.scene.add(fl); mk.cyl(R + 0.12, R + 0.12, 0.14, M.steel(), 0, 0.42, 0); mk.cyl(R + 0.14, R + 0.14, 0.22, M.steel(), 0, 0.4 + Hh + 0.04, 0);
      mk.rod(V3(0, 0.4 + Hh + 0.1, 0), V3(0, 5.15, 0), 0.08, M.steel()); o.g = gauge(S, 0, 5.95, 0, 0.82, 800, "kPa");
      s.init = false; o.gas = mk.particles(60, 0.1, M.plastic(0x4aa8ff, 0.2)); o.reg = { ax: 1, lo: 0.58, hi: 0.4 + Hh - 0.1, R: R - 0.05, yc: 0 }; o.th = thermometer(S, 2.7, 0.45, 0.3, 4.6); o.flash = 0;
    },
    reset(s, c) { s.init = false; },
    step(s, c, dt) { const o = P.S && P.S.objs; if (!o || !o.reg) return; if (!s.init || !s.pos) { s.init = true; gasInit(s, 60, o.reg); } s.hits = (s.hits || 0) * 0.92 + gasStep(s, dt, o.reg, 3.1 * Math.sqrt(c.temp / 300), 0.1); },
    update(S, s, c) { const o = S.objs; if (!s.pos) return; const k = (c.temp - 250) / 350; o.hp.set(clamp(k * 1.1, 0, 1)); o.th.set(k); o.g.set(c.k * c.temp); for (let i = 0; i < 60; i++) o.gas.set(i, s.pos[i].x, s.pos[i].y, s.pos[i].z); o.gas.instanceMatrix.needsUpdate = true; o.gas.material.color.copy(mixc(0x4aa8ff, 0xff4a2e, k)); S.aim([0, 3.4, 0], 13, 0.1, 0.16); },
    overlay(ctx, s, c, w, h, S) {
      const Pk = c.k * c.temp; H.pill(ctx, 14, 26, "Pressure law:  P / T = constant  (V constant)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `P = k T = ${c.k} × ${c.temp} = ${f1(Pk, 1)} kPa     (T in kelvin)`, "#8df0be", 10.5); H.pill(ctx, 14, 70, `P₁/T₁ = P₂/T₂ :  P/T = ${f1(Pk / c.temp, 3)} kPa/K`, "#cfe0ff", 10.5); H.pill(ctx, 14, 92, "hotter → faster molecules → more wall hits → higher P", "#9fb8d8", 9.5);
      H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0, xmax: 600, ymin: 0, ymax: c.k * 600, xl: "T (K)", yl: "P (kPa)", ticksX: 6, ticksY: 4, series: [{ pts: [[0, 0], [600, c.k * 600]], color: "#7fe3da", width: 2.2 }], dot: [c.temp, Pk, "#ffd27a"] });
      const q = S.proj(V3(2.7, 0.9, 0.3)); H.pill(ctx, q.x + 12, q.y, `${c.temp} K`, "#ffe8b0", 10.5);
    },
  };
  P.util.heat = { thermometer, bunsen, hotplate, gauge };
})();
