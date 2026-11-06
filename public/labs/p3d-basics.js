/* p3d-basics.js — wave–particle duality, de Broglie wavelength, SI units, dimensional analysis (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.elec || !P.util.wave) return;
  const T = window.THREE, { V3, TAU } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, E = P.util.elec, W = P.util.wave;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lab = E.lab, bench = E.bench, sci = E.sci;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hide = (im, i) => im.set(i, 0, -60, 0, 0.0001);
  const HP = 6.63e-34;

  /* ---- canvas label card ---- */
  const card = (S, w, h, draw, x, y, z) => { const cv = document.createElement("canvas"); cv.width = 512; cv.height = Math.round(512 * (h / w)); const cx = cv.getContext("2d"); draw(cx, cv.width, cv.height); const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); m.position.set(x || 0, y || 0, z || 0); S.scene.add(m); return m; };
  const roundRect = (cx, x, y, w, h, r) => { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); };
  const DCOL = [0xffb703, 0x4af0e0, 0xef7a6d]; /* M, L, T */
  const cubesFor = (e) => { const g = new T.Group(); const cs = 0.52; e.forEach((n, k) => { const cnt = Math.abs(n); for (let i = 0; i < cnt; i++) { const m = n > 0 ? new T.MeshStandardMaterial({ color: DCOL[k], roughness: 0.4, emissive: DCOL[k], emissiveIntensity: 0.25 }) : new T.MeshStandardMaterial({ color: DCOL[k], roughness: 0.4, transparent: true, opacity: 0.28, depthWrite: false }); const c = new T.Mesh(new T.BoxGeometry(cs, cs, cs), m); c.position.set((k - 1) * (cs + 0.06), cs / 2 + i * (cs + 0.04), 0); c.castShadow = true; g.add(c); if (n < 0) { const ed = new T.LineSegments(new T.EdgesGeometry(c.geometry), new T.LineBasicMaterial({ color: DCOL[k] })); ed.position.copy(c.position); g.add(ed); } } }); return g; };
  const dimStr = (e) => { const nm = ["M", "L", "T"], sup = { "-": "⁻", 1: "", 2: "²", 3: "³" }; let s = ""; e.forEach((n, k) => { if (!n) return; s += `[${nm[k]}]${n < 0 ? "⁻" : ""}${Math.abs(n) === 1 ? "" : ({ 2: "²", 3: "³" })[Math.abs(n)]}`; }); return s || "[1]"; };

  /* ================= WAVE–PARTICLE DUALITY (double slit) ================= */
  const LAM = 0.4, DS = 3.2, SA = 0.5, LL = 9.5, XP = -1.5, XS = 8.0, XG = -9.0, YB = 3.6;
  const Iz = (z) => { const sn = z / Math.sqrt(z * z + LL * LL), be = (Math.PI * DS * sn) / LAM, al = (Math.PI * SA * sn) / LAM, sc = al === 0 ? 1 : Math.sin(al) / al; return Math.cos(be) * Math.cos(be) * sc * sc; };
  S_["Wave–Particle Duality"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[-9, 9, 15], [0, 3.4, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.hits = s.hits && s.hits.length ? s.hits : []; s.fl = []; o.acc = 0;
      /* electron gun */
      const gun = mk.cyl(0.9, 1.1, 2.8, M.matte(0x2c323c, 0.35), XG - 1.0, YB, 0); gun.rotation.z = Math.PI / 2; const noz = mk.cyl(0.35, 0.6, 0.8, M.steel(), XG + 0.6, YB, 0); noz.rotation.z = Math.PI / 2; o.gl = mk.soft(0x6ac0ff, 1.6, XG + 1.05, YB, 0, 0.9); mk.cyl(0.6, 0.8, 0.5, M.matte(0x22262d, 0.45), XG - 1.0, 0.25, 0);
      /* slit plate: pieces between slits */
      const pm = M.matte(0x6b727d, 0.35), hh = 6.2, ys = YB; const seg = (z0, z1) => mk.box(0.3, hh, z1 - z0, pm, XP, ys, (z0 + z1) / 2); seg(-4, -DS / 2 - SA / 2); seg(-DS / 2 + SA / 2, DS / 2 - SA / 2); seg(DS / 2 + SA / 2, 4);
      /* interference field on the bench */
      const cv = document.createElement("canvas"); cv.width = 380; cv.height = 320; const cx = cv.getContext("2d"), im = cx.createImageData(380, 320); const lamF = LAM; for (let j = 0; j < 320; j++) for (let i = 0; i < 380; i++) { const x = (i / 380) * (XS - XP), z = ((j / 320) - 0.5) * 8, r1 = Math.hypot(x, z - DS / 2), r2 = Math.hypot(x, z + DS / 2), I = Math.pow(Math.cos((Math.PI * (r1 - r2)) / lamF), 2), fade = clamp(1.1 - x / (XS - XP) * 0.4, 0.4, 1), v = Math.round(255 * I * fade * 0.55); const k = (j * 380 + i) * 4; im.data[k] = Math.round(v * 0.45); im.data[k + 1] = Math.round(v * 0.85); im.data[k + 2] = v; im.data[k + 3] = x < 0.1 ? 0 : 255; } cx.putImageData(im, 0, 0); const ft = new T.CanvasTexture(cv); ft.colorSpace = T.SRGBColorSpace; o.field = new T.Mesh(new T.PlaneGeometry(XS - XP, 8), new T.MeshBasicMaterial({ map: ft, transparent: true, opacity: 0.75, toneMapped: false })); o.field.rotation.x = -Math.PI / 2; o.field.position.set((XS + XP) / 2, 0.06, 0); S.scene.add(o.field);
      /* ripples */
      o.rip = []; for (let k = 0; k < 2; k++) for (let i = 0; i < 5; i++) { const m = new T.Mesh(new T.RingGeometry(0.97, 1.0, 64, 1, -Math.PI / 2, Math.PI), new T.MeshBasicMaterial({ color: 0x8ad8ff, transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(XP + 0.18, 0.12, (k ? -1 : 1) * DS / 2); S.scene.add(m); o.rip.push({ m, ph: i / 5 }); }
      /* detector screen: back panel + hit canvas */
      mk.box(0.3, 7.0, 8.4, M.matte(0x1a1e26, 0.4), XS + 0.25, 3.5, 0); o.hc = document.createElement("canvas"); o.hc.width = 512; o.hc.height = 256; o.hx = o.hc.getContext("2d"); o.hx.fillStyle = "#04120a"; o.hx.fillRect(0, 0, 512, 256); o.ht = new T.CanvasTexture(o.hc); o.ht.colorSpace = T.SRGBColorSpace; o.scr = new T.Mesh(new T.PlaneGeometry(8.0, 4.0), new T.MeshBasicMaterial({ map: o.ht, toneMapped: false })); o.scr.rotation.y = -Math.PI / 2; o.scr.position.set(XS + 0.08, YB, 0); S.scene.add(o.scr); o.seen = 0;
      o.pe = mk.particles(60, 0.2, new T.MeshStandardMaterial({ color: 0x5ab8ff, emissive: 0x2a8cff, emissiveIntensity: 2, roughness: 0.3 })); o.pe.frustumCulled = false; o.fl = mk.soft(0xbfe4ff, 2.2, XS, YB, 0, 0); s.flyers = [];
    },
    reset(s, c) { s.hits = []; },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs; dt = dt || 0.016;
      o.acc += dt * c.rate; while (o.acc >= 1) { o.acc -= 1; let z, tries = 0; do { z = rnd(-3.9, 3.9); tries++; } while (Math.random() > Iz(z) && tries < 200); s.flyers.push({ u: 0, z, y: YB + rnd(-1.7, 1.7), zs: rnd(-0.2, 0.2) }); if (s.flyers.length > 60) s.flyers.shift(); }
      const pu = XP - XG, tot = XS - XG, T0 = 2.4; s.flyers = s.flyers.filter((f) => { f.u += dt / T0; if (f.u >= 1) { s.hits.push([f.z, f.y]); if (s.hits.length > 3000) { s.hits = []; o.hx.fillStyle = "#04120a"; o.hx.fillRect(0, 0, 512, 256); o.seen = 0; } o.fl.position.set(XS - 0.05, f.y, f.z); o.fl.material.opacity = 0.9; o.hx.fillStyle = "rgba(120,255,170,0.95)"; const px = ((f.z + 4) / 8) * 512, py = 256 - ((f.y - (YB - 2)) / 4) * 256; o.hx.beginPath(); o.hx.arc(px, py, 2.1, 0, TAU); o.hx.fill(); o.ht.needsUpdate = true; return false; } return true; });
      o.fl.material.opacity = Math.max(0, o.fl.material.opacity - dt * 3);
      for (let i = 0; i < 60; i++) { const f = s.flyers[i]; if (!f) { hide(o.pe, i); continue; } const x = XG + 1.0 + f.u * tot; if (x < XP) o.pe.set(i, x, f.y, f.zs, 1); else if (f.u < (XP - XG + 1) / tot + 0.08) o.pe.set(i, x, f.y, f.zs, 1); else hide(o.pe, i); } o.pe.instanceMatrix.needsUpdate = true;
      o.rip.forEach((r) => { r.ph = (r.ph + dt * 0.22) % 1; const rad = 0.3 + r.ph * 9.4; r.m.scale.set(rad, rad, 1); r.m.material.opacity = 0.55 * (1 - r.ph); });
      o.gl.material.opacity = 0.6 + 0.3 * Math.sin(S.t * 9); S.aim([0, 3.2, 0], 25, -0.62, 0.52);
    },
    overlay(ctx, s, c, w, h, S) {
      const n = s.hits.length, dz = (LAM * LL) / DS; H.pill(ctx, 14, 26, "λ = h / p        fringe spacing Δz = λL / d        I(z) ∝ cos²(πdz/λL)·sinc²(πaz/λL)", "#ffd27a", 10);
      H.pill(ctx, 14, 48, `electrons: ${c.rate} per second (one at a time)    detected so far: ${n}`, "#cfe0ff", 10); H.pill(ctx, 14, 70, n < 40 ? "each electron lands at ONE point — looks random (particle)" : n < 400 ? "dots start to bunch into bands …" : "interference fringes emerge — each electron interfered with itself (wave)", n < 40 ? "#9fb8d8" : "#8df0be", 10);
      H.pill(ctx, 14, 92, "e.g. 50 keV electrons: λ = h/√(2mE) ≈ 5.5 pm (illustration not to scale)", "#9fb8d8", 9.5);
      lab(ctx, S, V3(XG - 1.0, YB + 1.8, 0), "electron gun", "#cfe0ff"); lab(ctx, S, V3(XP, YB + 3.5, 0), "double slit", "#cfe0ff"); lab(ctx, S, V3(XS, YB - 2.7, 0), "detector screen", "#bff0d0"); lab(ctx, S, V3(3.2, 0.1, 3.4), "wave: ripples from both slits", "#8ad8ff");
      const x0 = 14, y0 = h - 112, gw = 224, gh = 86, bins = 26; ctx.save(); ctx.fillStyle = "rgba(8,12,22,0.62)"; ctx.fillRect(x0 - 6, y0 - 18, gw + 12, gh + 36); const cnt = new Array(bins).fill(0); s.hits.forEach((p) => { const b = Math.floor(((p[0] + 4) / 8) * bins); if (b >= 0 && b < bins) cnt[b]++; }); const mx = Math.max(6, ...cnt) * 1.1; ctx.fillStyle = "rgba(120,255,170,0.8)"; cnt.forEach((v, i) => ctx.fillRect(x0 + (i * gw) / bins, y0 + gh - (v / mx) * gh, gw / bins - 1, (v / mx) * gh)); ctx.strokeStyle = "#ffb703"; ctx.lineWidth = 1.6; ctx.beginPath(); let norm = 0; for (let i = 0; i < bins; i++) norm += Iz(((i + 0.5) / bins) * 8 - 4); const tot = Math.max(1, n); for (let i = 0; i <= 100; i++) { const z = (i / 100) * 8 - 4, v = (Iz(z) / norm) * tot * (1) / mx; const px = x0 + (i / 100) * gw, py = y0 + gh - clamp(v, 0, 1.2) * gh; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); ctx.font = "9px sans-serif"; ctx.fillStyle = "#9fb8d8"; ctx.fillText("hits per position  (amber = wave prediction)", x0, y0 - 6); ctx.fillText(`Δz = ${f1(dz, 2)} (model units)`, x0, y0 + gh + 12); ctx.restore();
    },
    readouts(s, c) { return [["Electrons detected", `${(s.hits || []).length}`], ["Rate", `${c.rate} /s`], ["Explanation", "wave function: |ψ|² = probability"], ["Fringe spacing", "Δz = λL / d"]]; },
  };

  /* ================= DE BROGLIE WAVELENGTH ================= */
  const lgmap = (pm) => 0.45 + 0.85 * Math.log10(Math.max(pm, 0.5) / 3.3);
  const DSP = 200; /* crystal plane spacing, pm */
  S_["de Broglie Wavelength"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 8, 19], [0, 3.6, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.t = 0; mk.box(18, 0.2, 1.6, M.matte(0x1c222c, 0.4), -1.5, 0.28, 0);
      o.pm = new T.MeshStandardMaterial({ color: 0xffb703, emissive: 0xc07800, emissiveIntensity: 0.8, roughness: 0.3 }); o.pt = mk.sphere(1, o.pm, 0, 3.6, 0); o.pg = mk.soft(0xffc233, 3, 0, 3.6, 0, 0.55);
      o.wv = W.curve(S, 200, 0.06, new T.MeshBasicMaterial({ color: 0x4af0e0 })); o.pts = Array.from({ length: 201 }, () => V3());
      o.cr = []; const sp = lgmap(DSP) * 0.0 + 1.3; for (let j = 0; j < 4; j++) for (let k = 0; k < 3; k++) { const a = mk.sphere(0.34, M.matte(0x8ea4c8, 0.3), 6.2 + k * sp, 2.35 + j * sp, 0); o.cr.push(a); } mk.box(0.12, 6.2, 5, new T.MeshStandardMaterial({ color: 0x20303e, transparent: true, opacity: 0.35 }), 6.2 - 0.0, 3.6, -0.0).visible = false;
      o.dif = [0, 1, 2].map(() => mk.beam(V3(), V3(1, 0, 0), 0x7fe3da, 0.06)); o.s = 0;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t += dt; },
    update(S, s, c, dt) {
      const o = S.objs, m = c.mass * 1e-31, v = c.speed * 1e6, lam = HP / (m * v), lpm = lam * 1e12, Lv = lgmap(lpm); dt = dt || 0.016;
      const r = 0.28 + 0.1 * Math.cbrt(c.mass); o.pt.scale.setScalar(r); const per = 5.0, u = (s.t % per) / per, px = -9 + u * 12.2, py = 3.6; o.pt.position.set(Math.min(px, 5.0), py, 0); o.pg.position.copy(o.pt.position); o.pg.scale.setScalar(1.5 + r * 2.4); o.pt.visible = px < 5.1; o.pg.visible = px < 5.1;
      const head = Math.min(px, 5.0) + 3.2, tail = Math.min(px, 5.0) - 5.5, A = 0.55, ph = -TAU * (s.t * 0.55);
      for (let i = 0; i <= 200; i++) { const x = tail + ((head - tail) * i) / 200, env = Math.exp(-Math.pow((x - Math.min(px, 5.0)) / 2.2, 2)), y = py + A * env * Math.sin(TAU * (x - Math.min(px, 5.0)) / Lv + ph); o.pts[i].set(x, y, 0); } o.wv.setPts(o.pts); o.wv.visible = px < 5.1;
      const sn = lam * 1e12 / DSP, th = sn < 1 ? Math.asin(sn) : null, org = V3(6.2 + 1.3 + 0.5, 3.6, 0); o.dif.forEach((b, i) => { if (th === null && i !== 1) { b.visible = false; return; } const ang = i === 1 ? 0 : (i === 0 ? th : -th), d = V3(Math.cos(ang), Math.sin(ang), 0), end = org.clone().addScaledVector(d, 3.6); S.setBeam(b, org, end); b.visible = true; b.userData.core.material.opacity = 1; }); o.th = th; o.lam = lam; o.lpm = lpm; o.Lv = Lv;
      S.aim([0, 3.4, 0], 21, 0.0, 0.25);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, m = c.mass * 1e-31, v = c.speed * 1e6, p = m * v, KE = (0.5 * m * v * v) / 1.602e-19; H.pill(ctx, 14, 26, "λ = h / p = h / (m v)         h = 6.63×10⁻³⁴ J·s", "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `m = ${c.mass}×10⁻³¹ kg    v = ${c.speed}×10⁶ m/s    p = mv = ${sci(p, 2)} kg·m/s    KE = ${f1(KE, 1)} eV`, "#cfe0ff", 10); H.pill(ctx, 14, 70, `λ = ${sci(HP, 2)} / ${sci(p, 2)} = ${sci(o.lam, 2)} m = ${f1(o.lpm, 1)} pm`, "#8df0be", 10.5);
      H.pill(ctx, 14, 92, o.th === null ? `λ > crystal spacing (200 pm): no diffracted beams — wave nature hard to see` : `crystal planes 200 pm apart → first-order diffraction at θ = asin(λ/d) = ${f1((o.th * 180) / Math.PI, 1)}°`, "#9fb8d8", 9.5);
      lab(ctx, S, V3(-6, 5.2, 0), "particle + its matter wave (λ drawn on a log scale)", "#4af0e0", "left"); lab(ctx, S, V3(7.4, 1.5, 0), "crystal (d ≈ 0.2 nm)", "#cfe0ff");
      const x0 = 30, y0 = h - 54, gw = 300, f = (l) => x0 + (gw * (Math.log10(l) - (-15))) / 8; ctx.save(); ctx.fillStyle = "rgba(8,12,22,0.62)"; ctx.fillRect(x0 - 8, y0 - 26, gw + 16, 62); ctx.strokeStyle = "rgba(160,190,230,0.7)"; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + gw, y0); ctx.stroke(); ctx.font = "9px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#9fb8d8"; [[1e-15, "1 fm"], [1e-12, "1 pm"], [1e-9, "1 nm"], [1e-7, "100 nm"]].forEach(([l, t]) => { ctx.beginPath(); ctx.moveTo(f(l), y0 - 3); ctx.lineTo(f(l), y0 + 3); ctx.stroke(); ctx.fillText(t, f(l), y0 + 14); }); ctx.fillStyle = "#cfe0ff"; ctx.beginPath(); ctx.arc(f(2e-10), y0, 4, 0, TAU); ctx.fill(); ctx.fillText("atom spacing", f(2e-10), y0 - 9); ctx.fillStyle = "#ffb703"; ctx.beginPath(); ctx.moveTo(f(o.lam), y0 - 2); ctx.lineTo(f(o.lam) - 5, y0 - 13); ctx.lineTo(f(o.lam) + 5, y0 - 13); ctx.fill(); ctx.fillText("λ", f(o.lam), y0 - 17); ctx.restore();
    },
    readouts(s, c) { const m = c.mass * 1e-31, v = c.speed * 1e6, lam = HP / (m * v); return [["Wavelength λ", `${f1(lam * 1e12, 2)} pm`], ["Momentum p = mv", `${sci(m * v, 2)} kg·m/s`], ["Regime", lam * 1e12 > 1 ? "noticeably wave-like" : "negligible wave effects"], ["Everyday object", "ball 0.057 kg at 30 m/s: λ ≈ 3.9×10⁻³⁴ m"]]; },
  };

  /* ================= SI BASE & DERIVED UNITS ================= */
  const SIQ = [
    { name: "Speed", sym: "v = d / t", unit: "m s⁻¹", unitN: "metre per second", e: [0, 1, -1], base: "m ÷ s" },
    { name: "Density", sym: "ρ = m / V", unit: "kg m⁻³", unitN: "kilogram per cubic metre", e: [1, -3, 0], base: "kg ÷ m³" },
    { name: "Volume", sym: "V = l × w × h", unit: "m³", unitN: "cubic metre", e: [0, 3, 0], base: "m × m × m" },
    { name: "Force", sym: "F = m a", unit: "N = kg m s⁻²", unitN: "newton", e: [1, 1, -2], base: "kg × m ÷ s²" },
    { name: "Pressure", sym: "p = F / A", unit: "Pa = N m⁻² = kg m⁻¹ s⁻²", unitN: "pascal", e: [1, -1, -2], base: "kg ÷ (m · s²)" },
  ];
  S_["SI Base & Derived Units"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 9, 20], [0, 3.2, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.t = 0; o.sig = ""; o.rt = new T.Group(); S.scene.add(o.rt);
      /* base units: metre rule, kilogram, second clock */
      const ru = mk.ruler(5.0, 0.7, -8.2, 0.02, 2.2); ru.rotation.y = 0; mk.box(0.001, 0.001, 0.001, M.matte(0xe6d27a, 0.3), -8.2, 0.12, 0.65);
      mk.cyl(1.0, 1.0, 0.25, M.matte(0x22262d, 0.45), -3.6, 0.13, 1.8); mk.cyl(0.55, 0.55, 0.85, M.gold ? M.gold() : M.brass(), -3.6, 0.78, 1.8).castShadow = true; const bell = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 1.7, 28, 1, true), M.glass(0xdff1ff)); bell.position.set(-3.6, 1.1, 1.8); bell.renderOrder = 3; S.scene.add(bell); const dome = new T.Mesh(new T.SphereGeometry(0.85, 24, 12, 0, TAU, 0, Math.PI / 2), M.glass(0xdff1ff)); dome.position.set(-3.6, 1.95, 1.8); dome.renderOrder = 3; S.scene.add(dome);
      o.clk = new T.Group(); const face = new T.Mesh(new T.CylinderGeometry(1.15, 1.15, 0.2, 40), M.matte(0xf2f2ee, 0.5)); face.rotation.x = Math.PI / 2; o.clk.add(face); const rim = new T.Mesh(new T.TorusGeometry(1.15, 0.08, 10, 40), M.chrome()); o.clk.add(rim); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, t = new T.Mesh(new T.BoxGeometry(0.06, i % 3 ? 0.14 : 0.24, 0.04), M.matte(0x111111, 0.5)); t.position.set(Math.sin(a) * 0.95, Math.cos(a) * 0.95, 0.12); t.rotation.z = -a; o.clk.add(t); } o.hand = new T.Mesh(new T.BoxGeometry(0.05, 0.95, 0.04), M.matte(0xd02a2a, 0.4)); o.hand.geometry.translate(0, 0.38, 0); o.hand.position.z = 0.16; o.clk.add(o.hand); o.clk.position.set(-0.4, 2.0, 1.8); S.scene.add(o.clk);
      o.dm = null;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t += dt; },
    update(S, s, c, dt) {
      const o = S.objs, q = Math.round(c.qty), PER = 4.0; dt = dt || 0.016; const t = s.t % PER;
      o.hand.rotation.z = -TAU * ((s.t % 1));
      if (o.sig !== String(q)) { o.sig = String(q); while (o.rt.children.length) { const m = o.rt.children.pop(); o.rt.remove(m); } const g = o.rt, add = (m) => { S.scene.remove(m); g.add(m); return m; }, mk = S.mk;
        o.d = {}; if (q === 0) { add(mk.box(8.0, 0.14, 0.7, M.matte(0x2a2e36, 0.4), 5.0, 0.14, 0)); for (let i = 0; i <= 4; i++) add(mk.box(0.07, 0.5, 0.7, M.matte(0xe6d27a, 0.3), 1.8 + i * 1.6, 0.4, 0)); o.d.car = add(mk.rbox(1.2, 0.5, 0.8, 0.12, M.paint(0xd02a2a), 0, 0.7, 0)); o.d.w = [add(mk.cyl(0.2, 0.2, 0.9, M.rubber(), -0.4, 0.4, 0)), add(mk.cyl(0.2, 0.2, 0.9, M.rubber(), 0.4, 0.4, 0))]; o.d.w.forEach((w) => (w.rotation.x = Math.PI / 2)); }
        if (q === 1) { const ed = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(3, 3, 3)), new T.LineBasicMaterial({ color: 0xcfe8ff })); ed.position.set(4.6, 1.5, 0); add(ed); add(mk.box(3, 3, 3, M.water ? M.water(0x3a8be8) : new T.MeshStandardMaterial({ color: 0x3a8be8, transparent: true, opacity: 0.4 }), 4.6, 1.5, 0)); o.d.kg = []; for (let i = 0; i < 6; i++) { const w = add(mk.cyl(0.4, 0.4, 0.55, M.brass(), 0, 0, 0)); o.d.kg.push(w); } }
        if (q === 2) { const ed = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(3.2, 3.2, 3.2)), new T.LineBasicMaterial({ color: 0x4af0e0 })); ed.position.set(4.6, 1.7, 0); add(ed); add(mk.box(3.2, 3.2, 3.2, new T.MeshStandardMaterial({ color: 0x4af0e0, transparent: true, opacity: 0.18, depthWrite: false }), 4.6, 1.7, 0)); }
        if (q === 3) { add(mk.box(8.4, 0.14, 1.4, M.matte(0x2a2e36, 0.4), 5.0, 0.14, 0)); o.d.cart = add(mk.box(1.5, 0.8, 1.0, M.paint(0xd0a030), 0, 0.7, 0)); o.d.ar = add(mk.arrow(0xff6b5a, 0.09, 0.3)); o.d.ar.visible = true; }
        if (q === 4) { [[3.2, 2.4, 1], [6.8, 1.2, 0.25]].forEach(([x, wd, A], k) => { add(mk.box(wd * 1.0, 0.2, wd * 1.0, M.steel(), x, 0.5, 0)); add(mk.box(wd, 0.3, wd, M.matte(0x8a7a5a, 0.9), x, 0.15, 0)); const ar = add(mk.arrow(0xff6b5a, 0.08, 0.26)); S.setArrow(ar, V3(x, 3.4, 0), V3(0, -2.4, 0), 1); add(mk.cyl(0.35, 0.35, 0.5, M.brass(), x, 2.3, 0)); }); } }
      if (q === 0 && o.d.car) { const u = Math.min(1, t / 3.0), x = 1.8 + u * 6.4 * 0.5 * 1.0 * 1.0; const sx = 1.8 + (t < 3 ? t * 1.6 : 4 * 1.6); o.d.car.position.x = sx; o.d.w.forEach((w, i) => (w.position.x = sx + (i ? 0.4 : -0.4))); }
      if (q === 1 && o.d.kg) o.d.kg.forEach((w, i) => w.position.set(4.6 - 1.0 + (i % 3) * 1.0, 0.45 + 1.7 * Math.floor(i / 3) + 0.2, 0.4 * ((i % 2) - 0.5)) );
      if (q === 3 && o.d.cart) { const a = 1.6, sx = 1.8 + 0.5 * a * Math.min(t, 3) * Math.min(t, 3) * 0.55; o.d.cart.position.x = sx; S.setArrow(o.d.ar, V3(sx - 0.8, 1.45, 0), V3(-1.8, 0, 0).multiplyScalar(-1), 1); }
      o.q = q; S.aim([0.4, 2.6, 0], 22, 0.0, 0.3);
    },
    overlay(ctx, s, c, w, h, S) {
      const q = SIQ[Math.round(c.qty)]; H.pill(ctx, 14, 26, "SI base units: metre (m) · kilogram (kg) · second (s) · ampere · kelvin · mole · candela", "#ffd27a", 10); H.pill(ctx, 14, 48, `${q.name}:  ${q.sym}    unit = ${q.unit}   (${q.unitN})`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, `dimension ${dimStr(q.e)}     built from: ${q.base}`, "#cfe0ff", 10); H.pill(ctx, 14, 92, "derived units are products / quotients of base units", "#9fb8d8", 9.5);
      lab(ctx, S, V3(-8.2, 0.9, 2.2), "metre (m)", "#4af0e0"); lab(ctx, S, V3(-3.6, 3.2, 1.8), "kilogram (kg)", "#ffb703"); lab(ctx, S, V3(-0.4, 3.7, 1.8), "second (s)", "#ef7a6d");
      const o = S.objs, qi = Math.round(c.qty); if (qi === 0) lab(ctx, S, V3(5.6, 2.4, 0), "1 m every 1 s → 1 m/s", "#cfe0ff"); if (qi === 1) lab(ctx, S, V3(4.6, 3.6, 0), "1 m³ of water ≈ 1000 kg → 1000 kg/m³", "#cfe0ff"); if (qi === 2) lab(ctx, S, V3(4.6, 3.8, 0), "1 m × 1 m × 1 m = 1 m³", "#cfe0ff"); if (qi === 3) lab(ctx, S, V3(6.6, 2.8, 0), "1 kg at 1 m/s² needs F = 1 N", "#cfe0ff"); if (qi === 4) { lab(ctx, S, V3(3.2, 4.1, 0), "1 N on 1 m² → 1 Pa", "#cfe0ff"); lab(ctx, S, V3(6.8, 4.1, 0), "1 N on 0.25 m² → 4 Pa", "#cfe0ff"); }
      const x0 = w - 150, y0 = h - 54; ctx.save(); ctx.fillStyle = "rgba(8,12,22,0.62)"; ctx.fillRect(x0 - 10, y0 - 40, 144, 62); ctx.font = "10px sans-serif"; ctx.textAlign = "left"; const ex = q.e; ["M", "L", "T"].forEach((n, k) => { ctx.fillStyle = hexC(DCOL[k]); ctx.fillRect(x0, y0 - 28 + k * 17, 11, 11); ctx.fillStyle = "#cfe0ff"; ctx.fillText(`[${n}]${ex[k] ? " power " + ex[k] : " —"}`, x0 + 17, y0 - 18 + k * 17); }); ctx.restore();
    },
    readouts(s, c) { const q = SIQ[Math.round(c.qty)]; return [["Quantity", q.name], ["SI unit", q.unit], ["Dimension", dimStr(q.e)], ["Built from", q.base]]; },
  };
  const hexC = (h) => "#" + h.toString(16).padStart(6, "0");

  /* ================= DIMENSIONAL ANALYSIS CHECKER ================= */
  const EQS = [
    { name: "v = u + at", L: [{ t: "v", e: [0, 1, -1] }], R: [{ t: "u", e: [0, 1, -1] }, { t: "a·t", e: [0, 1, -1] }], steps: "[L][T]⁻¹  =  [L][T]⁻¹ + [L][T]⁻²·[T]", bad: { name: "v = u + at²", R: [{ t: "u", e: [0, 1, -1] }, { t: "a·t²", e: [0, 1, 0] }] } },
    { name: "s = ½at²", L: [{ t: "s", e: [0, 1, 0] }], R: [{ t: "½·a·t²", e: [0, 1, 0] }], steps: "[L]  =  [L][T]⁻²·[T]²   (½ has no dimension)", bad: { name: "s = ½at", R: [{ t: "½·a·t", e: [0, 1, -1] }] } },
    { name: "F = ma", L: [{ t: "F", e: [1, 1, -2] }], R: [{ t: "m·a", e: [1, 1, -2] }], steps: "[M][L][T]⁻²  =  [M]·[L][T]⁻²", bad: { name: "F = mv", R: [{ t: "m·v", e: [1, 1, -1] }] } },
  ];
  const sumE = (arr) => arr[0].e.map((_, k) => arr.reduce((a, x) => a + x.e[k], 0));
  S_["Dimensional Analysis Checker"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 8, 19], [0, 3.8, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.t = 0; o.sig = ""; mk.cyl(0.9, 1.3, 0.3, M.matte(0x22262d, 0.45), 0, 0.15, 0); mk.cyl(0.14, 0.14, 4.6, M.chrome(), 0, 2.45, 0); mk.sphere(0.28, M.brass(), 0, 4.85, 0);
      o.beam = new T.Group(); o.beam.position.set(0, 4.85, 0); const bm = mk.box(10, 0.18, 0.4, M.brass(), 0, 0, 0); S.scene.remove(bm); o.beam.add(bm); S.scene.add(o.beam);
      o.pans = [-1, 1].map((sg) => { const g = new T.Group(); g.position.set(sg * 5, 2.0, 0); const pan = new T.Mesh(new T.CylinderGeometry(2.9, 2.7, 0.14, 36), M.brass()); pan.castShadow = true; g.add(pan); [[-1.6, 0], [1.6, 0], [0, 1.6], [0, -1.6]].slice(0, 2).forEach(([x]) => { const r = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 2.8, 6), M.steel()); r.position.set(x * 0.9, 1.4, 0); g.add(r); }); S.scene.add(g); return g; });
      o.cont = [new T.Group(), new T.Group()]; o.cont.forEach((g, i) => { S.scene.add(g); });
      o.tick = null; o.ang = 0;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t += dt; },
    update(S, s, c, dt) {
      const o = S.objs, eq = EQS[Math.round(c.eqn)], PER = 11, t = s.t % PER, bad = t >= 6.5, sig = `${Math.round(c.eqn)}|${bad}`; dt = dt || 0.016;
      if (o.sig !== sig) { o.sig = sig; const R = bad ? eq.bad.R : eq.R, Ls = eq.L; o.cont.forEach((g) => { while (g.children.length) { const m = g.children.pop(); m.traverse && m.traverse((n) => n.geometry && n.geometry.dispose()); } });
        const put = (g, terms) => { terms.forEach((tm, i) => { const x = (i - (terms.length - 1) / 2) * 3.0, cu = cubesFor(tm.e); cu.position.set(x, 0.14, 0.4); g.add(cu); const cd = card(S, 3.0, 1.0, (cx, w, h) => { cx.fillStyle = "rgba(10,16,30,0.85)"; roundRect(cx, 0, 0, w, h, 24); cx.fill(); cx.strokeStyle = "#7fb6ff"; cx.lineWidth = 3; cx.stroke(); cx.fillStyle = "#ffd27a"; cx.font = "bold 58px sans-serif"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(tm.t, w / 2, h * 0.42); cx.fillStyle = "#9fe3da"; cx.font = "bold 34px sans-serif"; cx.fillText(dimStr(tm.e), w / 2, h * 0.82); }, x, 3.1, 0.5); S.scene.remove(cd); g.add(cd); }); };
        put(o.cont[0], Ls); put(o.cont[1], R); o.Ls = Ls; o.R = R; o.bad = bad; o.eL = sumE(Ls); o.eR = sumE(R.length > 1 ? [R[1]] : R); o.ok = !bad; if (R.length > 1) { /* all terms must match the LHS */ o.ok = R.every((x) => x.e.join() === Ls[0].e.join()); } else o.ok = R[0].e.join() === Ls[0].e.join(); }
      const R = o.R, mis = R.reduce((a, x) => a + x.e.reduce((aa, v, k) => aa + (v - o.Ls[0].e[k]), 0), 0), target = o.ok ? 0 : clamp(mis * 0.14, -0.38, 0.38); o.ang += (target - o.ang) * Math.min(1, dt * 3); o.beam.rotation.z = -o.ang; const arm = 5; o.pans[0].position.set(-arm * Math.cos(o.ang), 4.85 + arm * Math.sin(o.ang) - 2.85, 0); o.pans[1].position.set(arm * Math.cos(o.ang), 4.85 - arm * Math.sin(o.ang) - 2.85, 0); o.cont[0].position.copy(o.pans[0].position); o.cont[1].position.copy(o.pans[1].position);
      o.t = t; S.aim([0, 3.4, 0], 16, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, eq = EQS[Math.round(c.eqn)], bad = o.bad, nm = bad ? eq.bad.name : eq.name; H.pill(ctx, 14, 26, "Rule: every term in a valid equation has the SAME dimensions  (M = mass, L = length, T = time)", "#ffd27a", 10);
      H.pill(ctx, 14, 48, `Checking:  ${nm}${bad ? "   ← deliberately wrong version" : ""}`, bad ? "#ff9d8a" : "#cfe0ff", 10.5); H.pill(ctx, 14, 70, bad ? `✗ left side ${dimStr(o.Ls[0].e)}  ≠  right side ${dimStr(o.R[o.R.length - 1].e)} → equation CANNOT be correct` : `✓ ${eq.steps}`, bad ? "#ff9d8a" : "#8df0be", 10);
      H.pill(ctx, 14, 92, "balance level ⇒ dimensions match;  tilts ⇒ NOT consistent  (necessary check, not sufficient)", "#9fb8d8", 9);
      lab(ctx, S, V3(-5, 6.2, 0), "LHS", "#ffd27a"); lab(ctx, S, V3(5, 6.2, 0), "RHS", "#ffd27a");
      const x0 = w - 150, y0 = h - 54; ctx.save(); ctx.fillStyle = "rgba(8,12,22,0.62)"; ctx.fillRect(x0 - 10, y0 - 58, 148, 82); ctx.font = "10px sans-serif"; ctx.textAlign = "left"; ["M mass", "L length", "T time"].forEach((n, k) => { ctx.fillStyle = hexC(DCOL[k]); ctx.fillRect(x0, y0 - 46 + k * 16, 11, 11); ctx.fillStyle = "#cfe0ff"; ctx.fillText(n, x0 + 17, y0 - 37 + k * 16); }); ctx.fillStyle = "#9fb8d8"; ctx.fillText("solid = power +, ghost = power −", x0 - 4, y0 + 14); ctx.restore();
    },
    readouts(s, c) { const eq = EQS[Math.round(c.eqn)]; return [["Equation", eq.name], ["Consistent?", "Yes"], ["Dimension check", eq.steps], ["Use", "verify equations, derive relations, find units"]]; },
  };
})();
