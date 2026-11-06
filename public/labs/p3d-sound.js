/* p3d-sound.js — sound & vibrating systems: sonometer, echo, air-column resonance (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.wave) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, { curve, dim } = P.util.wave;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (x) => x * x * (3 - 2 * x);
  const NOTE = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const noteOf = (f) => { const n = 12 * Math.log2(f / 440) + 69, r = Math.round(n); return `${NOTE[((r % 12) + 12) % 12]}${Math.floor(r / 12) - 1} ${n - r >= 0 ? "+" : ""}${Math.round((n - r) * 100)}¢`; };

  /* ================= SONOMETER ================= */
  const SU = 11, SXL = -5.2, WY = 2.95, SN = 120;
  S_["Sonometer — Vibrating String"] = {
    env: "lab", envOpts: { w: 20, d: 8 }, cam: [[0, 4.2, 15], [0.4, 2.2, 0]], fov: 36, sub: 1,
    build(S, s, c) {
      const mk = S.mk, o = S.objs;
      const box = mk.box(12.8, 0.9, 1.8, M.wood(), 0, 2.15, 0); [-5.4, 5.4].forEach((x) => mk.box(0.5, 1.7, 1.4, M.matte(0x2a2e36, 0.45), x, 0.85, 0));
      [-1.2, 1.5].forEach((x) => { const h = new T.Mesh(new T.CircleGeometry(0.3, 28), M.matte(0x120a05, 0.9)); h.rotation.x = -Math.PI / 2; h.position.set(x, 2.605, 0.0); S.scene.add(h); });
      mk.cyl(0.07, 0.07, 0.5, M.brass(), -6.2, 2.8, 0.0); mk.box(0.22, 0.34, 0.6, M.wood(), SXL, 2.77, 0); o.bridge = mk.box(0.22, 0.34, 0.6, M.wood(), 0, 2.77, 0); o.bridge.material = M.matte(0x5a2f1a, 0.5);
      o.pul = mk.cyl(0.26, 0.26, 0.12, M.chrome(), 6.9, WY, 0); o.pul.rotation.x = Math.PI / 2; mk.rod(V3(6.9, WY - 0.35, 0), V3(6.9, 2.0, 0), 0.04, M.steel()); mk.box(0.3, 0.5, 0.8, M.matte(0x2a2e36, 0.45), 6.9, 2.0, 0);
      for (let i = 0; i <= 10; i++) { const t = new T.Mesh(new T.BoxGeometry(0.02, 0.012, i % 5 === 0 ? 0.34 : 0.2), M.matte(0x111111, 0.5)); t.position.set(SXL + i * 1.1, 2.608, 0.7); S.scene.add(t); }
      o.rl = new T.Mesh(new T.BoxGeometry(11.6, 0.012, 0.4), new T.MeshStandardMaterial({ color: 0xe9ddb0, roughness: 0.6 })); o.rl.position.set(SXL + 5.5, 2.603, 0.7); S.scene.add(o.rl);
      o.w = curve(S, SN, 0.03, M.chrome()); o.g1 = curve(S, SN, 0.012, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })); o.g2 = curve(S, SN, 0.012, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }));
      o.w1 = mk.rod(V3(-6.2, 2.8, 0), V3(SXL, WY, 0), 0.03, M.chrome(), 8); o.w2 = mk.rod(V3(0, WY, 0), V3(6.9, WY, 0), 0.03, M.chrome(), 8); o.w3 = mk.rod(V3(7.12, WY, 0), V3(7.12, 1.0, 0), 0.02, M.chrome(), 8);
      o.nl = mk.sphere(0.12, M.emissive(0xff3b3b, 1.5), SXL, WY, 0); o.nr = mk.sphere(0.12, M.emissive(0xff3b3b, 1.5), 0, WY, 0); o.mass = null; o.nM = 0; o.pts = Array.from({ length: SN + 1 }, () => V3()); o.sigL = "";
      s.t = 0;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs; if (s.t === undefined) return; const L = c.length * SU, xr = SXL + L, f = (1 / (2 * c.length)) * Math.sqrt(c.tension / c.mu), fv = clamp(f / 60, 0.8, 5.5), A = 0.2, ph = Math.cos(TAU * fv * s.t);
      o.bridge.position.x = xr; o.nr.position.x = xr; const r = 0.04 + 0.05 * Math.sqrt(c.mu / 0.01); o.w.scale.set(1, 1, 1);
      const pts = o.pts; for (let i = 0; i <= SN; i++) { const x = SXL + (L * i) / SN; pts[i].set(x, WY + A * Math.sin((Math.PI * i) / SN) * ph, 0); } o.w.setPts(pts);
      if (o.sigL !== c.length + "|" + c.mu) { o.sigL = c.length + "|" + c.mu; const q = pts.map((p) => p.clone()); for (let i = 0; i <= SN; i++) q[i].y = WY + A * Math.sin((Math.PI * i) / SN); o.g1.setPts(q); for (let i = 0; i <= SN; i++) q[i].y = WY - A * Math.sin((Math.PI * i) / SN); o.g2.setPts(q); o.w.geometry.dispose(); o.w.geometry = new T.CylinderGeometry(r, r, 1, 8); }
      S.setRod(o.w2, V3(xr, WY, 0), V3(6.9, WY, 0)); const n = clamp(Math.round(c.tension / 20), 1, 6); if (o.nM !== n) { o.nM = n; if (o.mass) S.scene.remove(o.mass); o.mass = S.mk.slotted(n); o.mass.scale.set(1.0, 1.0, 1.0); o.mass.position.set(7.12, 1.0, 0); } o.f = f; o.fv = fv;
      S.aim([1.0, 2.2, 0], 14.2, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs; if (!o.f) return; const v = Math.sqrt(c.tension / c.mu), f = o.f; H.pill(ctx, 14, 26, "f = (1/2l) √(T/μ)   (fundamental)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `v = √(T/μ) = √(${c.tension}/${c.mu}) = ${f1(v, 0)} m/s`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `f = v/2l = ${f1(v, 0)}/(2×${f1(c.length, 2)}) = ${f1(f, 1)} Hz  ≈ ${noteOf(f)}`, "#8df0be", 10.5); H.pill(ctx, 14, 92, `slow-motion: real ${f1(f, 0)} Hz drawn at ${f1(o.fv, 1)} Hz`, "#9fb8d8", 9.5);
      for (let i = 0; i <= 10; i += 2) { const q = S.proj(V3(SXL + i * 1.1, 2.6, 0.95)); H.pill(ctx, q.x, q.y + 4, `${i * 10}`, "#e8f1ff", 8.5, "center"); } const e = S.proj(V3(SXL + 11.4, 2.6, 0.95)); H.pill(ctx, e.x + 2, e.y + 4, "cm", "#cfe0ff", 8.5);
      dim(ctx, S, V3(SXL, WY + 0.75, 0), V3(SXL + c.length * SU, WY + 0.75, 0), `l = ${f1(c.length, 2)} m`, "#ffd27a"); const m = S.proj(V3(7.4, 1.4, 0)); H.pill(ctx, m.x - 14, m.y, `T = ${c.tension} N (${f1(c.tension / 9.8, 1)} kg)`, "#ffb0a0", 9.5, "right");
      const pts = []; for (let l = 0.2; l <= 1.0001; l += 0.02) pts.push([l, (1 / (2 * l)) * Math.sqrt(c.tension / c.mu)]); H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0.2, xmax: 1.0, ymin: 0, ymax: (1 / 0.4) * Math.sqrt(c.tension / c.mu), xl: "l (m)", yl: "f (Hz)", ticksX: 4, ticksY: 4, series: [{ pts, color: "#7fe3da", width: 2.2 }], dot: [c.length, f, "#ffd27a"] });
    },
    readouts(s, c) { const f = (1 / (2 * c.length)) * Math.sqrt(c.tension / c.mu); return [["Frequency", `${f1(f, 1)} Hz`], ["Wave speed v = √(T/μ)", `${f1(Math.sqrt(c.tension / c.mu), 0)} m/s`], ["Nearest note", noteOf(f)], ["Tension", `${c.tension} N`], ["Length", `${f1(c.length, 2)} m`]]; },
  };

  /* ================= ECHO & REVERBERATION ================= */
  const EU = 0.05, SLOW = 6;
  const brickTex = () => { const cv = P.util.cv(512, 256), x = cv.getContext("2d"); x.fillStyle = "#b9b1a6"; x.fillRect(0, 0, 512, 256); for (let r = 0; r < 16; r++) for (let q = -1; q < 9; q++) { const ox = (r % 2) * 32, v = 0.8 + Math.random() * 0.25; x.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(66 * v)},${Math.round(48 * v)})`; x.fillRect(q * 64 + ox + 2, r * 16 + 2, 60, 12); } return P.util.tex(cv, [1.5, 1]); };
  S_["Echo & Reverberation"] = {
    env: "outdoor", envOpts: {}, cam: [[8, 4.5, 14], [5, 1.5, 0]], fov: 36, sub: 1,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; S.renderer.localClippingEnabled = true; if (o.trees) o.trees.visible = false;
      o.wall = new T.Mesh(new T.BoxGeometry(0.8, 7, 16), new T.MeshStandardMaterial({ map: brickTex(), roughness: 0.85 })); o.wall.castShadow = o.wall.receiveShadow = true; S.scene.add(o.wall);
      const per = new T.Group(); const body = new T.Mesh(new T.CapsuleGeometry(0.22, 0.75, 6, 14), M.matte(0xe86a1a, 0.7)), head = new T.Mesh(new T.SphereGeometry(0.2, 20, 16), M.matte(0xd9a47a, 0.6)), leg1 = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.7, 10), M.matte(0x2a3a60, 0.8)), leg2 = leg1.clone(); body.position.y = 1.15; head.position.y = 1.78; leg1.position.set(0, 0.35, 0.1); leg2.position.set(0, 0.35, -0.1); const arm = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.55, 8), M.matte(0xe86a1a, 0.7)); arm.rotation.z = -1.1; arm.position.set(0.3, 1.8, 0.2); [body, head, leg1, leg2, arm].forEach((m) => { m.castShadow = true; per.add(m); }); S.scene.add(per); o.per = per;
      const rg = (i) => { const m = new T.Mesh(new T.RingGeometry(0.965, 1, 120), new T.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.55, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, clippingPlanes: [new T.Plane(new T.Vector3(-1, 0, 0), 1)] })); m.renderOrder = 5; S.scene.add(m); return m; };
      o.inc = [rg(), rg(), rg()]; o.ref = [rg(), rg(), rg()]; o.inc[0].rotation.x = -Math.PI / 2; o.ref[0].rotation.x = -Math.PI / 2; o.inc[0].position.y = o.ref[0].position.y = 0.04; o.inc[2].rotation.y = Math.PI / 2; o.ref[2].rotation.y = Math.PI / 2;
      o.ear = new T.PointLight(0x9fd8ff, 0, 6, 1.6); o.ear.position.set(0, 1.8, 0.4); S.scene.add(o.ear); s.t = 0;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c, dt) {
      const o = S.objs; if (s.t === undefined) return; const d = c.distance * EU, xw = d + 0.4, cu = c.soundSpeed * EU, tEcho = (2 * c.distance) / c.soundSpeed, cyc = 0.6 + tEcho * SLOW + 2.2, tc = s.t % cyc, tr = Math.max(0, (tc - 0.6) / SLOW), r = cu * tr;
      o.wall.position.set(xw, 3.5, 0); const clipX = xw - 0.4; [...o.inc, ...o.ref].forEach((m) => (m.material.clippingPlanes[0].constant = clipX));
      const fade = clamp(1 - r / (2 * clipX + 6), 0.25, 1), act = tc >= 0.6;
      o.inc.forEach((m) => { m.visible = act && r > 0.05 && r < clipX + 30; m.scale.setScalar(Math.max(0.01, r)); m.position.x = 0; m.material.opacity = 0.55 * fade; });
      o.ref.forEach((m) => { m.visible = act && r > clipX; m.scale.setScalar(Math.max(0.01, r)); m.position.x = 2 * clipX; m.material.opacity = 0.4 * fade; });
      o.heard = act && tr >= tEcho && tc < cyc - 0.4; o.ear.intensity = o.heard ? 6 * Math.max(0, 1 - (tr - tEcho) * SLOW * 0.6) : 0; o.tr = Math.min(tr, tEcho); o.tEcho = tEcho; o.d = d;
      const span = Math.max(11, d * 0.95 + 7); S.aim([d / 2, 2.0, 0], span * 1.05, -0.05, 0.22);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs; if (o.d === undefined) return; const t = o.tEcho, ok = t > 0.1;
      H.pill(ctx, 14, 26, "echo = sound reflected from a hard surface", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `t = 2d / v = 2 × ${c.distance} / ${c.soundSpeed} = ${f1(t, 3)} s`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, ok ? "t > 0.1 s → heard as a separate ECHO" : "t < 0.1 s → blends in: reverberation", ok ? "#8df0be" : "#ffb870", 10.5); H.pill(ctx, 14, 92, `⏱ ${f1(o.tr, 3)} s  (shown in slow motion, ×1/${SLOW})`, "#cfe0ff", 10);
      dim(ctx, S, V3(0, 0.15, 1.2), V3(o.d, 0.15, 1.2), `d = ${c.distance} m`, "#ffd27a"); const p = S.proj(V3(0, 2.5, 0)); H.pill(ctx, p.x, p.y, o.heard ? "👂 ECHO heard!" : "📣 shout", o.heard ? "#8df0be" : "#ffb870", 10.5, "center");
      const q = S.proj(V3(o.d + 0.4, 5.2, 0)); H.pill(ctx, q.x, q.y, "reflecting wall", "#e8f1ff", 9.5, "center"); H.pill(ctx, w - 14, 26, `min. distance for an echo ≈ ${f1((c.soundSpeed * 0.1) / 2, 0)} m`, "#9fb8d8", 9.5, "right");
    },
    readouts(s, c) { const t = (2 * c.distance) / c.soundSpeed; return [["Echo time", `${f1(t, 3)} s`], ["Distance", `${c.distance} m`], ["Separate echo?", t > 0.1 ? "Yes (t > 0.1 s)" : "No — blends as reverberation"], ["Min. distance for echo", `${f1((c.soundSpeed * 0.1) / 2, 0)} m`]]; },
  };

  /* ================= CLOSED vs OPEN PIPE RESONANCE ================= */
  const PU = 7, PR = 1.05;
  S_["Closed vs Open Pipe Resonance"] = {
    env: "lab", envOpts: { w: 22, d: 8 }, cam: [[0, 4.0, 15], [0, 2.4, 0]], fov: 36, sub: 1,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.tube = new T.Mesh(new T.CylinderGeometry(PR + 0.05, PR + 0.05, 1, 56, 1, true), M.glass()); o.tube.rotation.z = Math.PI / 2; o.tube.renderOrder = 3; S.scene.add(o.tube);
      o.cap = new T.Mesh(new T.CylinderGeometry(PR + 0.14, PR + 0.14, 0.24, 48), M.steel()); o.cap.rotation.z = Math.PI / 2; S.scene.add(o.cap); o.fl = [0, 1].map(() => { const t = new T.Mesh(new T.TorusGeometry(PR + 0.08, 0.07, 12, 48), M.chrome()); t.rotation.y = Math.PI / 2; S.scene.add(t); return t; });
      o.stand = [0, 1].map(() => mk.box(0.5, 1.1, 1.8, M.matte(0x2a2e36, 0.45), 0, 0.55, 0)); mk.box(26, 0.12, 3.0, M.matte(0x22262d, 0.5), 0, 0.06, 0);
      o.spk = new T.Group(); const sb = new T.Mesh(new T.BoxGeometry(1.2, 2.6, 2.6), M.paint(0x22262d)); sb.position.x = -0.6; const cone = new T.Mesh(new T.ConeGeometry(0.85, 0.6, 32, 1, true), new T.MeshStandardMaterial({ color: 0x15171b, roughness: 0.7, side: T.DoubleSide })); cone.rotation.z = Math.PI / 2; cone.position.x = 0.1; const dust = new T.Mesh(new T.SphereGeometry(0.28, 20, 14, 0, TAU, 0, Math.PI / 2), M.matte(0x30343c, 0.6)); dust.rotation.z = -Math.PI / 2; dust.position.x = 0.3; o.cone = new T.Group(); o.cone.add(cone, dust); o.spk.add(sb, o.cone); o.spk.scale.setScalar(0.75); o.spk.position.y = PR + 0.15; S.scene.add(o.spk);
      o.NP = 44 * 7; o.p = mk.particles(o.NP, 0.075, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0x333333, emissiveIntensity: 0.4 })); o.p.setColorAt(0, new T.Color(1, 1, 1)); o.sigL = ""; s.t = 0;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs; if (s.t === undefined) return; const closed = c.pipeType === 0, Lm = c.length, L = Lm * PU, f = closed ? c.soundSpeed / (4 * Lm) : c.soundSpeed / (2 * Lm), fv = clamp(f / 300, 0.8, 2.2), ph = Math.cos(TAU * fv * s.t), yc = PR + 0.15, A = Math.min(0.5, L * 0.05);
      o.tube.scale.y = L; o.tube.position.set(0, yc, 0); o.cap.visible = closed; o.cap.position.set(L / 2 + 0.1, yc, 0); o.fl[0].position.set(-L / 2, yc, 0); o.fl[1].position.set(L / 2, yc, 0); o.fl[1].visible = !closed; o.fl[0].visible = true;
      o.stand[0].position.x = -L * 0.3; o.stand[1].position.x = L * 0.3; const NX = clamp(Math.round(L / 0.28), 8, 44), col = new T.Color(); let n = 0; const ang = [0, 1, 2, 3, 4, 5];
      for (let i = 0; i < NX; i++) { const s0 = (i + 0.5) / NX, x0 = -L / 2 + s0 * L; let xi, nn; if (closed) { const sp = (1 - s0) * L; xi = A * Math.sin((Math.PI * sp) / (2 * L)) * ph; nn = -Math.cos((Math.PI * sp) / (2 * L)) * ph; } else { const sp = s0 * L; xi = A * Math.cos((Math.PI * sp) / L) * ph; nn = -Math.sin((Math.PI * sp) / L) * ph; }
        const kk = clamp(Math.abs(nn), 0, 1); col.set(0xdfe6ee).lerp(new T.Color(nn < 0 ? 0xff5a3a : 0x4a9cff), kk * 0.9);
        o.p.set(n, x0 + xi, yc, 0); o.p.setColorAt(n, col); n++; for (const a of ang) { o.p.set(n, x0 + xi, yc + Math.cos((a * TAU) / 6 + (i % 2) * 0.5) * PR * 0.62, Math.sin((a * TAU) / 6 + (i % 2) * 0.5) * PR * 0.62); o.p.setColorAt(n, col); n++; } }
      o.p.count = n; o.p.instanceMatrix.needsUpdate = true; o.p.instanceColor.needsUpdate = true; o.spk.position.x = -L / 2 - 0.35; o.cone.position.x = A * ph * (closed ? 0.0 : 1) + (closed ? A * 0.0 : 0); o.cone.position.x = 0.35 * ph * 0.5; o.L = L; o.f = f; o.fv = fv;
      S.aim([0, 2.2, 0], Math.max(8.5, L * 1.3 + 4), 0.0, 0.14);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs; if (!o.f) return; const closed = c.pipeType === 0, lam = closed ? 4 * c.length : 2 * c.length, f = o.f, L = o.L, yc = PR + 0.15;
      H.pill(ctx, 14, 26, closed ? "CLOSED pipe: L = λ/4   f = v/4L" : "OPEN pipe: L = λ/2   f = v/2L", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `λ = ${closed ? "4L" : "2L"} = ${f1(lam, 2)} m`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `f = ${c.soundSpeed} / ${closed ? "4" : "2"}×${f1(c.length, 2)} = ${f1(f, 1)} Hz`, "#8df0be", 10.5); H.pill(ctx, 14, 92, `slow-motion: drawn at ${f1(o.fv, 1)} Hz   (red = compression)`, "#9fb8d8", 9.5);
      const lab = (x, t, col) => { const q = S.proj(V3(x, yc + PR + 0.9, 0)); H.pill(ctx, q.x, q.y, t, col, 9.5, "center"); };
      if (closed) { lab(L / 2, "displacement NODE", "#ff8f8f"); lab(-L / 2, "displacement ANTINODE", "#7affb0"); } else { lab(-L / 2, "ANTINODE", "#7affb0"); lab(0, "NODE", "#ff8f8f"); lab(L / 2, "ANTINODE", "#7affb0"); }
      dim(ctx, S, V3(-L / 2, yc - PR - 0.6, 0.0), V3(L / 2, yc - PR - 0.6, 0.0), `L = ${f1(c.length, 2)} m`, "#ffd27a");
      const a = [], b = []; for (let i = 0; i <= 40; i++) { const x = (i / 40) * c.length, u = x / c.length; a.push([x, closed ? Math.cos((Math.PI * u) / 2) : Math.abs(Math.cos(Math.PI * u))]); b.push([x, closed ? Math.sin((Math.PI * u) / 2) : Math.abs(Math.sin(Math.PI * u))]); }
      H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0, xmax: c.length, ymin: 0, ymax: 1, xl: "x from left end (m)", yl: "amplitude", ticksX: 4, ticksY: 2, series: [{ pts: a, color: "#7affb0", width: 2.2 }, { pts: b, color: "#ffb870", width: 2.2 }] });
      H.pill(ctx, 14, 114, "graph:  green = displacement amplitude,  orange = pressure amplitude", "#cfe0ff", 9);
    },
  };
})();
