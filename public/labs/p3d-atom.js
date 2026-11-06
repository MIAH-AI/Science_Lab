/* p3d-atom.js — quantum & atomic physics: photoelectric effect, Bohr hydrogen atom, X-ray tube (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.elec || !P.util.wave) return;
  const T = window.THREE, { V3, TAU } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, E = P.util.elec, W = P.util.wave;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lab = E.lab, bench = E.bench, sci = E.sci, eng = E.eng;
  const HEV = 4.136e-15, CC = 2.998e8, HC = 1239.84; /* eV·s, m/s, eV·nm */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sm = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

  function wl2hex(w) {
    let r = 0, g = 0, b = 0;
    if (w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else r = 1;
    const k = w < 420 ? 0.35 + (0.65 * (w - 380)) / 40 : w > 700 ? 0.35 + (0.65 * (780 - w)) / 80 : 1, c = (x) => Math.round(255 * Math.pow(Math.max(0, x * k), 0.8));
    return (c(r) << 16) | (c(g) << 8) | c(b);
  }
  const photonCol = (lam) => (lam < 380 ? 0xb48cff : lam > 750 ? 0xff5a44 : wl2hex(lam));
  const bandName = (lam) => (lam < 10 ? "γ-ray" : lam < 380 ? (lam < 100 ? "ultraviolet (far UV)" : "ultraviolet") : lam <= 750 ? "visible" : lam < 1e6 ? "infrared" : "radio");
  const hexCss = (h) => "#" + h.toString(16).padStart(6, "0");
  const glassTube = (S, x0, x1, y, r) => { const g = new T.Group(), L = x1 - x0, cy = new T.Mesh(new T.CylinderGeometry(r, r, L, 40, 1, true), M.glass(0xdff1ff)); cy.rotation.z = Math.PI / 2; cy.renderOrder = 3; g.add(cy); [x0, x1].forEach((x, i) => { const d = new T.Mesh(new T.SphereGeometry(r, 32, 16, 0, TAU, 0, Math.PI / 2), M.glass(0xdff1ff)); d.rotation.z = i ? -Math.PI / 2 : Math.PI / 2; d.scale.set(0.9, 1, 1); d.position.set(x, 0, 0); d.renderOrder = 3; g.add(d); }); g.position.set(0, y, 0); S.scene.add(g); return g; };

  /* ================= PHOTOELECTRIC EFFECT ================= */
  const WF = [2.3, 4.3, 4.7], MNAME = ["Sodium", "Zinc", "Copper"], MCOL = [0xdcd6c6, 0x9fb0c4, 0xc9783c], MSYM = ["Na", "Zn", "Cu"];
  const PX = -3.2, CX = 4.4, PY = 3.6;
  S_["Photoelectric Effect"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[2, 8, 19], [0, 3.8, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.e = []; s.heat = 0; s.cnt = 0; s.m = -1;
      glassTube(S, -5.0, 6.2, PY, 2.1); mk.cyl(0.5, 0.7, 0.5, M.matte(0x22262d, 0.45), 0.6, 0.25, 0); mk.box(10, 0.3, 2, M.matte(0x22262d, 0.45), 0.6, 0.15, 0);
      o.pm = new T.MeshStandardMaterial({ color: MCOL[0], metalness: 0.95, roughness: 0.28, emissive: 0xff5a20, emissiveIntensity: 0 }); o.plate = mk.box(0.18, 2.7, 2.7, o.pm, PX, PY, 0); mk.box(0.12, 2.1, 2.1, M.steel(), CX, PY, 0);
      mk.cyl(0.07, 0.07, 1.5, M.copper(), PX - 0.1, PY - 2.0, 0); mk.cyl(0.07, 0.07, 1.5, M.copper(), CX + 0.1, PY - 2.0, 0);
      o.am = E.meter(S, "MICROAMMETER", 3.0); o.am.position.set(1.0, 1.0, 4.0); o.am.scale.setScalar(1.1);
      E.lead(S, V3(PX - 0.1, PY - 2.7, 0), V3(-0.4, 1.4, 4.2), 0.2, 0xc0392b); E.lead(S, V3(CX + 0.1, PY - 2.7, 0), V3(2.4, 1.4, 4.2), 0.2, 0x111111);
      o.lp = V3(-7.2, 6.5, 0); const tg = V3(PX - 0.12, PY, 0), dir = tg.clone().sub(o.lp).normalize(); o.dir = dir; o.lamp = new T.Group(); o.lamp.position.copy(o.lp); o.lamp.quaternion.setFromUnitVectors(V3(0, 1, 0), dir);
      const hs = new T.Mesh(new T.CylinderGeometry(0.75, 1.15, 2.4, 28), M.matte(0x2a2f38, 0.35)); hs.castShadow = true; o.lamp.add(hs); o.lens = new T.Mesh(new T.CircleGeometry(0.72, 28), new T.MeshBasicMaterial({ color: 0xffffff })); o.lens.rotation.x = -Math.PI / 2; o.lens.position.y = 1.21; o.lamp.add(o.lens); S.scene.add(o.lamp);
      o.front = o.lp.clone().addScaledVector(dir, 1.3); o.beam = mk.beam(o.front, tg, 0xffffff, 0.04); o.beam.userData.core.material.transparent = true; o.beam.userData.halo.material.transparent = true;
      mk.cyl(0.3, 0.45, o.lp.y - 1.0, M.matte(0x2a2f38, 0.4), o.lp.x + 0.5, (o.lp.y - 1.0) / 2, 0).castShadow = true;
      o.ph = mk.particles(40, 0.13, new T.MeshBasicMaterial({ color: 0xffffff })); o.ph.frustumCulled = false; o.pp = []; for (let i = 0; i < 40; i++) o.pp.push({ u: -1, oy: rnd(-1.1, 1.1), oz: rnd(-1.1, 1.1) }); o.acc = 0;
      o.el = mk.particles(48, 0.17, new T.MeshStandardMaterial({ color: 0x4aa8ff, emissive: 0x2a7ee8, emissiveIntensity: 1.6, roughness: 0.3 })); o.el.frustumCulled = false;
      o.vac = null;
    },
    reset(s, c) { s.e = []; s.heat = 0; },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, f = c.freq * 1e12, Eph = HEV * f, phi = WF[c.metal], KE = Eph - phi, lam = (CC / f) * 1e9, col = photonCol(lam); dt = dt || 0.016;
      if (s.m !== c.metal) { s.m = c.metal; o.pm.color.setHex(MCOL[c.metal]); }
      o.beam.userData.core.material.color.setHex(col); o.beam.userData.halo.material.color.setHex(col); const bo = 0.25 + 0.5 * (c.intensity / 100); o.beam.userData.core.material.opacity = bo * 0.6; o.beam.userData.halo.material.opacity = bo * 0.4; o.lens.material.color.setHex(col); o.ph.material.color.setHex(col);
      o.acc += dt * (4 + 0.24 * c.intensity); const tg = V3(PX - 0.12, PY, 0), pos = V3();
      while (o.acc >= 1) { o.acc -= 1; const p = o.pp.find((q) => q.u < 0); if (p) { p.u = 0; p.oy = rnd(-1.1, 1.1); p.oz = rnd(-1.1, 1.1); } }
      o.pp.forEach((p, i) => { if (p.u < 0) { o.ph.set(i, 0, -50, 0, 0.0001); return; } p.u += dt * 1.0; if (p.u >= 1) { p.u = -1; o.ph.set(i, 0, -50, 0, 0.0001); if (KE > 0) { if (Math.random() < 0.8) { const ke = KE * rnd(0.25, 1), v = 2.0 + 2.6 * Math.sqrt(ke), a = rnd(-0.55, 0.55), b = rnd(-0.55, 0.55); s.e.push({ x: PX + 0.15, y: PY + p.oy, z: p.oz, vx: v * Math.cos(a) * Math.cos(b), vy: v * Math.sin(a), vz: v * Math.sin(b) }); } } else s.heat = Math.min(1, s.heat + 0.035); return; } pos.lerpVectors(o.front, V3(PX - 0.12, PY + p.oy, p.oz), p.u); o.ph.set(i, pos.x, pos.y, pos.z, 1); });
      o.ph.instanceMatrix.needsUpdate = true;
      s.e = s.e.filter((e) => { e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt; if (e.x > CX - 0.1 && Math.abs(e.y - PY) < 1.1 && Math.abs(e.z) < 1.1) { s.cnt++; return false; } if (Math.abs(e.y - PY) > 2.0 || Math.abs(e.z) > 2.0 || e.x > 6) return false; return true; });
      for (let i = 0; i < 48; i++) { const e = s.e[i]; if (e) o.el.set(i, e.x, e.y, e.z, 1); else o.el.set(i, 0, -50, 0, 0.0001); } o.el.instanceMatrix.needsUpdate = true;
      s.heat = Math.max(0, s.heat - dt * 0.6); o.pm.emissiveIntensity = KE > 0 ? 0 : s.heat * 0.5;
      o.am.set(KE > 0 ? `${f1((c.intensity / 100) * 2.4, 2)} µA` : "0.00 µA", KE > 0 ? "#7dffa0" : "#ff9d8a");
      o.Eph = Eph; o.phi = phi; o.KE = KE; o.lam = lam; S.aim([0.6, 3.6, 0], 21, -0.1, 0.34);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, f0 = (o.phi / HEV) / 1e12, v = Math.sqrt(Math.max(0, 2 * o.KE * 1.602e-19 / 9.109e-31));
      H.pill(ctx, 14, 26, "E = h f      KE(max) = h f − φ      (h = 4.136×10⁻¹⁵ eV·s)", "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `f = ${c.freq}×10¹² Hz  (λ = ${f1(o.lam, 0)} nm, ${bandName(o.lam)})    E = hf = ${f1(o.Eph, 2)} eV`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, o.KE > 0 ? `KEmax = ${f1(o.Eph, 2)} − ${o.phi} = ${f1(o.KE, 2)} eV   (v ≈ ${f1(v / 1e6, 2)}×10⁶ m/s)` : `hf < φ  (${f1(o.Eph, 2)} < ${o.phi} eV) → NO electrons, however intense the light`, o.KE > 0 ? "#8df0be" : "#ff9d8a", 10);
      H.pill(ctx, 14, 92, `${MNAME[c.metal]}: φ = ${o.phi} eV → threshold f₀ = φ/h = ${f1(f0, 0)}×10¹² Hz   |   intensity ↑ → more electrons, not faster ones`, "#9fb8d8", 9);
      lab(ctx, S, V3(PX - 0.6, PY + 2.2, 0), `${MNAME[c.metal]} emitter plate`, "#ffd27a", "right"); lab(ctx, S, V3(CX, PY + 2.2, 0), "collector", "#cfe0ff"); lab(ctx, S, V3(0.6, PY + 2.4, 0), "evacuated glass tube", "#9fb8d8"); lab(ctx, S, V3(1.0, 2.35, 4.0), "photocurrent ∝ intensity", "#cfe0ff"); lab(ctx, S, V3(-7.2, 4.8, 0), "monochromatic lamp", "#cfe0ff");
      const k1 = HEV * 1500e12 - o.phi; H.graph(ctx, 14, h - 130, 196, 112, { series: [{ pts: [[100, 0], [f0, 0], [1500, Math.max(k1, 0)]], color: "#7fe3da", width: 2 }], xmin: 100, xmax: 1500, ymin: 0, ymax: 4.5, xl: "f (×10¹² Hz)", yl: "KEmax (eV)", dot: [c.freq, Math.max(0, o.KE), "#ffb703"], ticksX: 3, ticksY: 3 });
    },
    readouts(s, c) { const f = c.freq * 1e12, Eph = HEV * f, phi = WF[c.metal], KE = Eph - phi; return [["Photon energy", `${f1(Eph, 2)} eV`], ["Work function φ", `${phi} eV`], ["KE(max)", KE > 0 ? `${f1(KE, 2)} eV` : "no emission"], ["Threshold frequency", `${f1(phi / HEV / 1e12, 0)}×10¹² Hz`]]; },
  };

  /* ================= BOHR MODEL ================= */
  const R0 = 0.45, RN = (n) => R0 * n * n, EN = (n) => -13.6 / (n * n), OM = (n) => 2.6 / Math.pow(n, 1.5);
  const SERIES = { 1: "Lyman", 2: "Balmer", 3: "Paschen", 4: "Brackett" };
  const tr = (c) => { const ni = Math.round(c.from), nf = Math.min(Math.round(c.to), ni - 1), dE = 13.6 * (1 / (nf * nf) - 1 / (ni * ni)), lam = HC / dE; return { ni, nf, dE, lam, f: dE / HEV }; };
  S_["Bohr Model — Energy Levels"] = {
    env: "void", cam: [[0, 24, 22], [0, 0, -2]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; s.t = 0; s.th = 0; o.rings = []; for (let n = 1; n <= 5; n++) { const m = new T.MeshBasicMaterial({ color: 0x5f9cf2, transparent: true, opacity: 0.28 }), t = new T.Mesh(new T.TorusGeometry(RN(n), 0.03, 8, 128), m); t.rotation.x = Math.PI / 2; S.scene.add(t); o.rings.push(t); }
      o.nuc = new T.Group(); const pm = new T.MeshStandardMaterial({ color: 0xe0443a, emissive: 0x801810, emissiveIntensity: 0.8, roughness: 0.4 }); o.nuc.add(new T.Mesh(new T.SphereGeometry(0.3, 24, 18), pm)); S.scene.add(o.nuc); const g = mk.soft(0xff6a4a, 2.4, 0, 0, 0, 0.55); o.nuc.add(g);
      o.e = new T.Mesh(new T.SphereGeometry(0.26, 24, 18), new T.MeshStandardMaterial({ color: 0x5ab8ff, emissive: 0x2a8cff, emissiveIntensity: 2.0, roughness: 0.3 })); S.scene.add(o.e); o.eg = mk.soft(0x6ac0ff, 1.5, 0, 0, 0, 0.8); o.e.add(o.eg);
      const hide = (m) => m.setPts(Array.from({ length: 61 }, () => V3(0, -90, 0)));
      o.pe = W.curve(S, 60, 0.07, new T.MeshBasicMaterial({ color: 0xffffff })); o.pa = W.curve(S, 60, 0.07, new T.MeshBasicMaterial({ color: 0xffffff })); hide(o.pe); hide(o.pa); o.ring = null;
      o.flash = mk.soft(0xffffff, 3, 0, 0, 0, 0); o.pts = Array.from({ length: 61 }, () => V3());
      o.st = new T.Mesh(new T.CylinderGeometry(0.01, 0.01, 0.01), new T.MeshBasicMaterial()); o.st.visible = false; S.scene.add(o.st);
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c, dt) {
      const o = S.objs, q = tr(c), PER = 7.0, t = (s.t || 0) % PER, col = photonCol(q.lam); dt = dt || 0.016;
      let n = q.ni, r = RN(q.ni), ph = "up";
      if (t < 2.2) { n = q.ni; r = RN(q.ni); ph = "hi"; } else if (t < 2.9) { const u = sm((t - 2.2) / 0.7); r = RN(q.ni) + (RN(q.nf) - RN(q.ni)) * u; n = u < 0.5 ? q.ni : q.nf; ph = "down"; } else if (t < 5.6) { n = q.nf; r = RN(q.nf); ph = "lo"; } else if (t < 6.3) { const u = sm((t - 5.6) / 0.7); r = RN(q.nf) + (RN(q.ni) - RN(q.nf)) * u; n = u < 0.5 ? q.nf : q.ni; ph = "upj"; } else { n = q.ni; r = RN(q.ni); ph = "hi"; }
      const nvis = ph === "down" || ph === "upj" ? 2 : n, om = ph === "down" || ph === "upj" ? 9 : OM(n); s.th = (s.th || 0) + om * dt; o.e.position.set(Math.cos(s.th) * r, 0, Math.sin(s.th) * r); o.eg.material.opacity = 0.6 + 0.4 * (ph === "down" || ph === "upj" ? 1 : 0.3);
      o.rings.forEach((m, i) => { const act = i + 1 === q.ni || i + 1 === q.nf; m.material.opacity = act ? 0.75 : 0.22; m.material.color.setHex(act ? 0x9fd0ff : 0x5f9cf2); });
      o.e.material.emissiveIntensity = 2.0 + (ph === "down" || ph === "upj" ? 1.5 : 0);
      const Lp = 3.4, Lv = 0.9 + q.lam / 190, A = 0.3, pts = o.pts;
      /* emitted photon: starts at 2.55 s from the electron's position, flies radially outward */
      if (t >= 2.5 && t < 5.4) { if (o.emD === undefined || o.emT !== Math.floor(s.t / PER)) { o.emT = Math.floor(s.t / PER); const a = s.th; o.emD = V3(Math.cos(a), 0, Math.sin(a)); o.emR = r; } const d = o.emD, head = o.emR + (t - 2.5) * 6.0; for (let i = 0; i <= 60; i++) { const u = i / 60, along = head - Lp * u, y = A * Math.sin(Math.PI * u) * Math.sin(TAU * ((u * Lp) / Lv)); pts[i].set(d.x * along, y, d.z * along); } o.pe.setPts(pts); o.pe.visible = true; o.pe.material.color.setHex(col); const fl = Math.max(0, 1 - Math.abs(t - 2.55) / 0.35); o.flash.material.color.setHex(col); o.flash.material.opacity = fl * 0.9; o.flash.position.set(o.emD.x * o.emR, 0, o.emD.z * o.emR); } else { o.pe.visible = false; o.flash.material.opacity = 0; }
      /* absorbed photon (incoming along −x) */
      if (t >= 4.7 && t < 5.6) { const head = -16 + (t - 4.7) / 0.9 * (16 - RN(q.nf)); for (let i = 0; i <= 60; i++) { const u = i / 60, x = head - Lp * u, y = A * Math.sin(Math.PI * u) * Math.sin(TAU * ((u * Lp) / Lv)); pts[i].set(x, y, 0); } o.pa.setPts(pts); o.pa.visible = true; o.pa.material.color.setHex(col); } else o.pa.visible = false;
      o.q = q; o.ph = ph; o.n = nvis; o.rnow = r; S.aim([0, 0, -3.2], 31, 0.0, 0.95);
    },
    overlay(ctx, s, c, w, h, S) {
      const q = S.objs.q, nm = q.nf <= 4 ? SERIES[q.nf] : "", ph = S.objs.ph; const lamTxt = q.lam < 1000 ? `${f1(q.lam, 1)} nm` : `${f1(q.lam / 1000, 2)} µm`;
      H.pill(ctx, 14, 26, "E_n = −13.6 / n²  eV        r_n = n² a₀        ΔE = hf = hc/λ", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `ΔE = E(${q.ni}) − E(${q.nf}) = ${f1(EN(q.ni), 2)} − (${f1(EN(q.nf), 2)}) = ${f1(q.dE, 2)} eV`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, `λ = 1240 / ΔE = ${lamTxt}  (${bandName(q.lam)})    f = ΔE/h = ${f1(q.f / 1e14, 2)}×10¹⁴ Hz`, "#cfe0ff", 10); H.pill(ctx, 14, 92, `${nm} series (transitions to n = ${q.nf})   ${c.to >= c.from ? "• “down to” must be below the start level (using n = " + q.nf + ")" : ""}`, "#9fb8d8", 9.5);
      for (let n = 1; n <= 5; n++) { const p = S.proj(V3(-RN(n) * 0.72, 0, RN(n) * 0.72)); if (n > 1) H.pill(ctx, p.x, p.y, `n=${n}`, n === q.ni || n === q.nf ? "#cfe8ff" : "#7a8aa0", 9.5); }
      H.pill(ctx, ...(() => { const p = S.proj(V3(0, 0.1, 0)); return [p.x, p.y + 24]; })(), "nucleus (p⁺)", "#ff9d8a", 9.5);
      const x0 = w - 150, yT = 150, yB = 352, yOf = (n) => yT + (yB - yT) * (1 / (n * n)) * 1.0 * 1; ctx.save(); ctx.fillStyle = "rgba(10,16,30,0.55)"; ctx.fillRect(x0 - 46, yT - 24, 190, yB - yT + 46); ctx.font = "10px sans-serif"; ctx.textAlign = "left";
      ctx.strokeStyle = "rgba(160,190,230,0.6)"; ctx.fillStyle = "#cfe0ff"; ctx.lineWidth = 1.4; const yE = (n) => yB - (yB - yT) * (1 - 1 / (n * n)); for (let n = 1; n <= 5; n++) { const y = yE(n); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 70, y); ctx.stroke(); if (n <= 3) ctx.fillText(`n=${n}  ${f1(EN(n), 2)} eV`, x0 - 42, y - 3); else ctx.fillText(`n=${n}`, x0 + 74, y + (n === 4 ? -2 : 10)); }
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, yT - 14); ctx.lineTo(x0 + 70, yT - 14); ctx.stroke(); ctx.setLineDash([]); ctx.fillText("n=∞  0 eV (ionised)", x0 - 42, yT - 17);
      ctx.strokeStyle = hexCss(photonCol(q.lam)); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2.4; const ax = x0 + 100; ctx.beginPath(); ctx.moveTo(ax, yE(q.ni)); ctx.lineTo(ax, yE(q.nf)); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ax, yE(q.nf)); ctx.lineTo(ax - 5, yE(q.nf) - 9); ctx.lineTo(ax + 5, yE(q.nf) - 9); ctx.fill(); ctx.fillText("hf", ax + 8, (yE(q.ni) + yE(q.nf)) / 2); ctx.restore();
    },
    readouts(s, c) { const q = tr(c); return [["Transition", `n = ${q.ni} → ${q.nf}`], ["Photon energy ΔE", `${f1(q.dE, 2)} eV`], ["Wavelength λ", q.lam < 1000 ? `${f1(q.lam, 1)} nm (${bandName(q.lam)})` : `${f1(q.lam / 1000, 2)} µm (${bandName(q.lam)})`], ["Frequency", `${f1(q.f / 1e14, 2)}×10¹⁴ Hz`]]; },
  };

  /* ================= X-RAY TUBE ================= */
  const XA = 3.0, XC0 = -3.6, XY = 3.7;
  const xr = (kv) => { const g = 1 + kv / 511, beta = Math.sqrt(1 - 1 / (g * g)), lmin = HC / kv; return { g, beta, lmin, kal: 20.9, kbe: 18.4, lines: kv > 69.5 }; };
  S_["X-ray Tube"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 8, 19], [0, 3.5, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.e = []; s.heat = 0; s.glow = 0;
      glassTube(S, -5.0, 5.0, XY, 1.9);
      /* filament cathode + focusing cup */
      o.fil = new T.Mesh(new T.TorusGeometry(0.22, 0.05, 8, 20), new T.MeshStandardMaterial({ color: 0x331100, emissive: 0xff7a22, emissiveIntensity: 2.2 })); o.fil.rotation.y = Math.PI / 2; o.fil.position.set(XC0, XY, 0); S.scene.add(o.fil); const cup = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 0.9, 24, 1, true), M.steel()); cup.rotation.z = Math.PI / 2; cup.position.set(XC0 - 0.35, XY, 0); S.scene.add(cup); mk.cyl(0.09, 0.09, 1.8, M.copper(), XC0 - 1.0, XY, 0).rotation.z = Math.PI / 2;
      /* anode: copper stem + tungsten target at 45° */
      const stem = mk.cyl(0.9, 0.9, 5.2, M.copper(), 4.5, XY, 0); stem.rotation.z = Math.PI / 2; for (let i = 0; i < 5; i++) mk.cyl(1.25, 1.25, 0.12, M.copper(), 5.4 + i * 0.45, XY, 0).rotation.z = Math.PI / 2;
      o.tm = new T.MeshStandardMaterial({ color: 0x8c8f99, metalness: 1, roughness: 0.25, emissive: 0xff3300, emissiveIntensity: 0 }); o.tar = new T.Mesh(new T.BoxGeometry(0.4, 1.7, 1.7), o.tm); o.tar.position.set(XA + 0.5, XY, 0); o.tar.rotation.z = -Math.PI / 4; o.tar.castShadow = true; S.scene.add(o.tar);
      o.spot = mk.soft(0xffe0a0, 1.4, XA - 0.1, XY, 0, 0);
      o.hv = E.supply(S); o.hv.position.set(-8.6, 1.7, 0); o.hv.scale.setScalar(0.85);
      E.lead(S, V3(-8.6, 3.5, 0.2), V3(XC0 - 1.9, XY, 0), 1.2, 0xc0392b); E.lead(S, V3(-8.6, 0.0, 0.5), V3(8.2, XY - 0.6, 0.3), 1.8, 0x111111);
      /* detector / fluorescent screen below the window */
      o.scrM = new T.MeshStandardMaterial({ color: 0x0b2a14, emissive: 0x2cff7a, emissiveIntensity: 0, roughness: 0.6 }); mk.box(3.4, 0.14, 3.4, o.scrM, XA - 0.8, 0.3, 0); mk.box(0.9, 0.9, 0.9, M.matte(0x7b7f88, 0.5), XA - 3.9, 0.45, 0); const win = mk.box(1.2, 0.08, 1.2, M.matte(0x303845, 0.4), XA - 0.4, XY - 1.95, 0); o.win = win;
      o.el = mk.particles(30, 0.14, new T.MeshStandardMaterial({ color: 0x4aa8ff, emissive: 0x2a7ee8, emissiveIntensity: 1.6, roughness: 0.3 })); o.el.frustumCulled = false;
      o.xp = mk.particles(60, 0.14, new T.MeshBasicMaterial({ color: 0xcbb6ff })); o.xp.frustumCulled = false; s.x = []; o.acc = 0;
    },
    reset(s, c) { s.e = []; s.x = []; },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, q = xr(c.voltage); dt = dt || 0.016; o.hv.set(`${c.voltage} kV`, "TUBE VOLTAGE");
      const k = 1.5 * Math.sqrt(c.voltage / 80); o.acc += dt * 11; while (o.acc >= 1) { o.acc -= 1; s.e.push({ u: 0, y: rnd(-0.14, 0.14), z: rnd(-0.14, 0.14) }); }
      let hits = 0; s.e = s.e.filter((e) => { e.u += k * Math.sqrt(e.u + 0.06) * dt; if (e.u >= 1) { hits++; return false; } return true; });
      const ex = (u) => XC0 + 0.8 + u * (XA - 0.3 - XC0 - 0.8); for (let i = 0; i < 30; i++) { const e = s.e[i]; if (e) o.el.set(i, ex(e.u), XY + e.y, e.z, 1); else o.el.set(i, 0, -50, 0, 0.0001); } o.el.instanceMatrix.needsUpdate = true;
      hits && (s.glow = 1); for (let j = 0; j < hits; j++) for (let m = 0; m < 3; m++) { s.x.push({ x: XA - 0.2, y: XY - 0.1, z: 0, a: rnd(-0.4, 0.4), b: rnd(-0.4, 0.4), v: rnd(9, 13) }); if (s.x.length > 60) s.x.shift(); }
      s.x = s.x.filter((p) => { const dx = Math.sin(p.a), dz = Math.sin(p.b); p.x += dx * p.v * dt * 0.6; p.y -= p.v * dt; p.z += dz * p.v * dt * 0.6; return p.y > 0.4; });
      for (let i = 0; i < 60; i++) { const p = s.x[i]; if (p) o.xp.set(i, p.x, p.y, p.z, 1); else o.xp.set(i, 0, -50, 0, 0.0001); } o.xp.instanceMatrix.needsUpdate = true;
      s.glow = Math.max(0, s.glow - dt * 4); const pw = Math.pow(c.voltage / 150, 2); o.tm.emissiveIntensity = 0.35 + 1.4 * pw + 0.8 * s.glow; o.spot.material.opacity = 0.25 + 0.5 * s.glow; o.scrM.emissiveIntensity = 0.2 + 2.2 * pw * (0.5 + 0.5 * (s.x.length ? 1 : 0.3)); o.fil.material.emissiveIntensity = 2.0 + 0.6 * Math.sin(S.t * 8);
      o.q = q; S.aim([0.3, 3.4, 0], 22, 0.0, 0.3);
    },
    overlay(ctx, s, c, w, h, S) {
      const q = S.objs.q, v = q.beta; H.pill(ctx, 14, 26, "eV = ½ m v² (relativistic: γ = 1 + eV/mc²)        λ_min = hc / eV", "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `V = ${c.voltage} kV  →  KE = ${c.voltage} keV     v = ${f1(v, 2)} c = ${f1(v * 2.998e8 / 1e8, 2)}×10⁸ m/s    γ = ${f1(q.g, 3)}`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `λ_min = 1239.84 / ${c.voltage} = ${f1(q.lmin, 1)} pm     E(max photon) = ${c.voltage} keV   (higher kV → shorter λ, more penetrating)`, "#8df0be", 9.5);
      H.pill(ctx, 14, 92, q.lines ? "V > 69.5 kV: K-shell electrons of tungsten ejected → sharp characteristic lines Kα, Kβ appear on the continuum" : "below 69.5 kV (W K-edge) → continuous bremsstrahlung only;  ≈99% of beam energy becomes heat", q.lines ? "#ffd27a" : "#9fb8d8", 9);
      lab(ctx, S, V3(XC0, XY + 2.3, 0), "cathode (hot filament)", "#ffb27a"); lab(ctx, S, V3(XA + 1.2, XY + 2.3, 0), "tungsten target (anode)", "#cfe0ff"); lab(ctx, S, V3(XA + 4.2, XY - 1.6, 0), "copper heat sink", "#ffb27a"); lab(ctx, S, V3(XA - 2.7, 0.35, 1.2), "X-rays → fluorescent screen", "#cbb6ff", "right"); lab(ctx, S, V3(0, XY - 2.35, 0.2), "vacuum tube: e⁻ accelerated", "#9fb8d8"); lab(ctx, S, V3(-8.6, 3.7, 0), "HT supply", "#cfe0ff");
      const pts = []; for (let l = Math.max(q.lmin, 5); l <= 130; l += 1.5) { const lm = q.lmin; pts.push([l, l <= lm ? 0 : ((l / lm - 1) / (l * l)) * 1000]); } const ser = [{ pts: [[Math.max(5, q.lmin - 0.01), 0]].concat(pts), color: "#7fe3da", width: 1.8 }]; if (q.lines) { ser.push({ pts: [[q.kal, 0], [q.kal, 4.2]], color: "#ffb703", width: 2 }); ser.push({ pts: [[q.kbe, 0], [q.kbe, 2.7]], color: "#ff8a5c", width: 2 }); }
      H.graph(ctx, w - 232, h - 132, 218, 114, { series: ser, xmin: 5, xmax: 130, ymin: 0, ymax: 4.6, xl: "λ (pm)", yl: "rel. intensity", dot: [Math.max(q.lmin, 5), 0, "#ffb703"], ticksX: 4, ticksY: 2 });
    },
    readouts(s, c) { const q = xr(c.voltage); return [["Tube voltage", `${c.voltage} kV`], ["Electron speed", `${f1(q.beta, 2)} c`], ["Shortest λ", `${f1(q.lmin, 1)} pm`], ["Characteristic lines", q.lines ? "Kα, Kβ present" : "none (V < 69.5 kV)"]]; },
  };
})();
