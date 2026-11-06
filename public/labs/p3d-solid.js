/* p3d-solid.js — semiconductors, rectification, magnetic domains, gas diffusion (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.elec || !P.util.wave) return;
  const T = window.THREE, { V3, TAU } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, E = P.util.elec, W = P.util.wave;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lab = E.lab, bench = E.bench, eng = E.eng;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hide = (im, i) => im.set(i, 0, -60, 0, 0.0001);
  const glassBox = (S, w, h, d, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), M.glass(0xdff1ff)); m.position.set(x, y, z); m.renderOrder = 3; S.scene.add(m); const e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w, h, d)), new T.LineBasicMaterial({ color: 0xb8d8ff, transparent: true, opacity: 0.6 })); e.position.copy(m.position); S.scene.add(e); return m; };
  const diodeBody = (S, a, b, glowMat) => { const d = b.clone().sub(a), L = d.length(), g = new T.Group(); const body = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, L * 0.5, 20), M.matte(0x16181c, 0.35)); body.castShadow = true; const band = new T.Mesh(new T.CylinderGeometry(0.355, 0.355, 0.2, 20), glowMat); band.position.y = L * 0.21; const lead = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, L, 8), M.steel()); g.add(lead, body, band); g.position.copy(a).addScaledVector(d, 0.5); g.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); S.scene.add(g); return g; };

  /* ================= JUNCTION DIODE — BIAS ================= */
  const DR = 100, VBI = 0.7, VBR = -8;
  const diodeI = (v) => (v >= VBI ? (v - VBI) / DR : v <= VBR ? (v - VBR) / DR - 1e-7 : -1e-7 - 1e-8 * Math.abs(v)); /* A */
  S_["Junction Diode — Bias"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 8, 19], [0, 3.4, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); o.bl = 4.0; const pm = new T.MeshStandardMaterial({ color: 0x3f6fd0, transparent: true, opacity: 0.28, roughness: 0.3, depthWrite: false }), nm = new T.MeshStandardMaterial({ color: 0xd8503f, transparent: true, opacity: 0.28, roughness: 0.3, depthWrite: false });
      o.p = mk.box(4, 2.6, 2.6, pm, -2, 3.6, 0); o.n = mk.box(4, 2.6, 2.6, nm, 2, 3.6, 0); [o.p, o.n].forEach((m) => { const e = new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })); m.add(e); });
      o.dep = new T.Mesh(new T.BoxGeometry(1, 2.62, 2.62), new T.MeshStandardMaterial({ color: 0x20242c, transparent: true, opacity: 0.88, roughness: 0.6, emissive: 0x201030, emissiveIntensity: 0.3 })); o.dep.position.set(0, 3.6, 0); S.scene.add(o.dep);
      o.el = mk.particles(28, 0.2, new T.MeshBasicMaterial({ color: 0x35b0ff })); o.ho = mk.particles(28, 0.2, new T.MeshBasicMaterial({ color: 0xffffff })); o.el.frustumCulled = o.ho.frustumCulled = false;
      o.ce = []; o.ch = []; for (let i = 0; i < 28; i++) { o.ce.push({ x: rnd(0.2, 3.8), y: rnd(-1.1, 1.1), z: rnd(-1.1, 1.1), fl: 0 }); o.ch.push({ x: rnd(-3.8, -0.2), y: rnd(-1.1, 1.1), z: rnd(-1.1, 1.1), fl: 0 }); }
      o.sup = E.supply(S); o.sup.position.set(-8.2, 1.7, 1.0); o.sup.scale.setScalar(0.85); o.am = E.meter(S, "AMMETER", 2.6); o.am.position.set(7.0, 1.0, 2.2); o.rs = E.resistor(S, 2.6); o.rs.position.set(3.0, 0.9, 2.4);
      o.w1 = E.lead(S, V3(-8.2, 3.5, 1.0), V3(-4.1, 3.6, 0.0), 1.6, 0xc0392b); o.w2 = E.lead(S, V3(4.1, 3.6, 0), V3(4.1, 0.9, 2.4), 0.6, 0x222222); E.lead(S, V3(1.8, 0.9, 2.4), V3(5.6, 1.0, 2.2), 0.3, 0x222222); E.lead(S, V3(8.4, 1.0, 2.2), V3(-8.2, 0.0, 1.2), -0.5, 0x111111);
      o.bulb = mk.bulb(0xffe9a0, 7); o.bulb.position.set(6.2, 4.4, 1.2); o.bulb.scale.setScalar(1.5); mk.cyl(0.4, 0.5, 0.3, M.matte(0x222222, 0.5), 6.2, 3.1, 1.2); E.lead(S, V3(4.1, 4.0, 0.3), V3(6.2, 3.6, 1.2), 0.4, 0x777777);
      o.hi = []; o.fl = mk.soft(0xffffff, 3, 0, 3.6, 0, 0);
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, V = c.voltage, I = diodeI(V), fw = V >= VBI, brk = V <= VBR; dt = dt || 0.016;
      const Wd = V >= VBI ? 0.15 : clamp(1.4 * Math.sqrt((VBI - V) / VBI), 0.15, 5.6) * (V <= 0 ? 1 : 1) * (V > 0 ? 1 : 1); const wd = clamp(Wd, 0.15, 5.4); o.dep.scale.x = wd; o.dep.visible = true; o.dep.material.opacity = V >= VBI ? 0.2 : 0.88;
      const k = fw ? clamp(I / 0.09, 0.08, 1) : brk ? clamp(-I / 0.02, 0.1, 1) : 0.02, sp = 0.25 + 5.5 * k;
      const dirE = (V >= 0 || brk) ? (fw ? -1 : brk ? 1 : 0.3) : 0.3; /* electrons: forward → toward junction (−x) */
      o.ce.forEach((e, i) => { if (fw) { e.x -= sp * dt; if (e.x < wd / 2) { e.x = rnd(3.2, 3.9); e.fl = 1; } } else if (brk) { e.x += sp * dt * 0.9; if (e.x > 3.9) e.x = wd / 2 + 0.2; } else { e.x += (rnd(-1, 1)) * dt * 1.2 + 0.5 * dt * (V < 0 ? 1 : 0); e.x = clamp(e.x, wd / 2 + 0.17, 3.85); } e.y = clamp(e.y + rnd(-1, 1) * dt * 2.2, -1.1, 1.1); e.z = clamp(e.z + rnd(-1, 1) * dt * 2.2, -1.1, 1.1); if (e.x < wd / 2 + 0.17 && !fw) e.x = wd / 2 + 0.17; e.fl = Math.max(0, e.fl - dt * 3); o.el.set(i, e.x, 3.6 + e.y, e.z, 1); });
      o.ch.forEach((h, i) => { if (fw) { h.x += sp * dt; if (h.x > -wd / 2) { h.x = -rnd(3.2, 3.9); } } else if (brk) { h.x -= sp * dt * 0.9; if (h.x < -3.9) h.x = -wd / 2 - 0.2; } else { h.x += rnd(-1, 1) * dt * 1.2 - 0.5 * dt * (V < 0 ? 1 : 0); h.x = clamp(h.x, -3.85, -wd / 2 - 0.17); } h.y = clamp(h.y + rnd(-1, 1) * dt * 2.2, -1.1, 1.1); h.z = clamp(h.z + rnd(-1, 1) * dt * 2.2, -1.1, 1.1); o.ho.set(i, h.x, 3.6 + h.y, h.z, 1); });
      o.el.instanceMatrix.needsUpdate = true; o.ho.instanceMatrix.needsUpdate = true;
      o.fl.material.opacity = fw ? 0.25 + 0.2 * Math.sin(S.t * 14) : 0; o.fl.scale.setScalar(2.2 + k * 2); o.bulb.setPower(fw ? clamp(k * 1.1, 0.25, 1.3) : 0); o.sup.set(`${V >= 0 ? "" : "−"}${f1(Math.abs(V), 1)} V`, V >= 0 ? "P(+) → N(−)" : "REVERSED");
      o.am.set(Math.abs(I) >= 1e-3 ? `${f1(I * 1000, 1)} mA` : `${f1(I * 1e6, 2)} µA`, fw ? "#7dffa0" : "#ff9d8a"); o.I = I; o.wd = wd; o.fw = fw; o.brk = brk; S.aim([0.4, 3.2, 0], 21, 0.0, 0.3);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, V = c.voltage; H.pill(ctx, 14, 26, "Si diode:  conducts when V_forward > 0.7 V;  I = (V − 0.7) / R,   R = 100 Ω", "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, o.fw ? `FORWARD BIAS: depletion layer collapses → I = (${f1(V, 1)} − 0.7)/100 = ${f1(o.I * 1000, 1)} mA` : o.brk ? `REVERSE BREAKDOWN at ${f1(V, 1)} V: avalanche current ${f1(Math.abs(o.I) * 1000, 1)} mA` : V > 0 ? `V = ${f1(V, 1)} V < 0.7 V threshold → barrier not overcome, I ≈ 0` : `REVERSE BIAS: depletion layer widens, only leakage ≈ ${f1(Math.abs(o.I) * 1e6, 2)} µA`, o.fw ? "#8df0be" : "#ff9d8a", 10);
      H.pill(ctx, 14, 70, `depletion width ≈ ${f1(o.wd / 5.4 * 100, 0)} % of max      holes (○) in p-type · electrons (●) in n-type`, "#cfe0ff", 9.5); H.pill(ctx, 14, 92, "diode = one-way valve: low resistance forward, very high resistance reverse", "#9fb8d8", 9.5);
      lab(ctx, S, V3(-2, 5.3, 0), "p-type (holes)", "#8fb2ff"); lab(ctx, S, V3(2, 5.3, 0), "n-type (electrons)", "#ff9d8a"); lab(ctx, S, V3(0, 1.8, 0), "depletion layer", "#cfc8e8"); lab(ctx, S, V3(-4.7, 3.6, 1.6), V >= 0 ? "+" : "−", V >= 0 ? "#ff8a7a" : "#9fb8d8"); lab(ctx, S, V3(4.7, 3.6, 1.6), V >= 0 ? "−" : "+", V >= 0 ? "#9fb8d8" : "#ff8a7a"); lab(ctx, S, V3(5.6, 2.7, 1.2), "lamp (glows if conducting)", "#ffd27a", "left");
      const pts = []; for (let v = -10; v <= 10.01; v += 0.25) pts.push([v, diodeI(v) * 1000]); H.graph(ctx, 14, h - 132, 208, 114, { series: [{ pts, color: "#7fe3da", width: 2 }], xmin: -10, xmax: 10, ymin: -25, ymax: 95, xl: "V (volt)", yl: "I (mA)", dot: [V, o.I * 1000, "#ffb703"], ticksX: 4, ticksY: 3 });
    },
    readouts(s, c) { const I = diodeI(c.voltage); return [["Bias", c.voltage >= VBI ? "Forward — conducting" : c.voltage > 0 ? "Forward but below 0.7 V" : c.voltage <= VBR ? "Reverse breakdown" : "Reverse — blocking"], ["Applied voltage", `${c.voltage} V`], ["Current", Math.abs(I) >= 1e-3 ? `${f1(I * 1000, 1)} mA` : `${f1(I * 1e6, 2)} µA`]]; },
  };

  /* ================= RECTIFICATION ================= */
  const VM = 10;
  S_["Rectification"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 8, 22], [1.5, 4, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.t = 0; o.sig = ""; o.grp = new T.Group(); S.scene.add(o.grp);
      o.src = E.supply(S); o.src.position.set(-9, 2.2, 0); o.src.scale.setScalar(0.85); o.load = E.resistor(S, 3.2); o.load.rotation.z = Math.PI / 2; o.load.position.set(5.0, 3.6, 0); o.lp = o.load;
      o.scr = mk.box(9.4, 4.6, 0.2, M.matte(0x05110a, 0.3), 5.6, 7.6, -2.6); mk.box(9.8, 5.0, 0.12, M.matte(0x1c2028, 0.4), 5.6, 7.6, -2.75); mk.box(0.12, 4.2, 0.02, M.glow(0x335533, 0.5), 5.6 - 4.5, 7.6, -2.48); mk.rod(V3(1.0, 7.6, -2.48), V3(10.2, 7.6, -2.48), 0.012, M.glow(0xffffff, 0.35), 6);
      o.cin = W.curve(S, 150, 0.045, new T.MeshBasicMaterial({ color: 0xffb703, transparent: true, opacity: 0.55 })); o.cout = W.curve(S, 150, 0.055, new T.MeshBasicMaterial({ color: 0x4af0e0 }));
      o.gm = new T.MeshStandardMaterial({ color: 0x555555, emissive: 0x2cff7a, emissiveIntensity: 0, roughness: 0.4 }); o.gms = [0, 1, 2, 3].map(() => new T.MeshStandardMaterial({ color: 0xd8d8d8, emissive: 0x2cff7a, emissiveIntensity: 0, roughness: 0.4, metalness: 0.6 })); o.dg = [];
      o.cp = E.mkPath([V3(5.0, 5.8, 0), V3(3.0, 5.8, 0), V3(3.0, 1.4, 0), V3(5.0, 1.4, 0)], false);
      o.ca = null;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t += dt; },
    update(S, s, c, dt) {
      const o = S.objs, full = Math.round(c.type) === 1, sig = String(full); dt = dt || 0.016;
      if (o.sig !== sig) { o.sig = sig; while (o.grp.children.length) { const m = o.grp.children.pop(); o.grp.remove(m); } o.dg = []; const add = (m) => { S.scene.remove(m); o.grp.add(m); return m; };
        const mw = (pts, r) => E.wires(S, pts, r).forEach(add);
        if (!full) { /* half-wave */ mw([V3(-9, 4.0, 0), V3(-9, 6.0, 0), V3(-4.2, 6.0, 0)]); o.dg.push(add(diodeBody(S, V3(-4.6, 6.0, 0), V3(-1.4, 6.0, 0), o.gms[0]))); mw([V3(-1.0, 6.0, 0), V3(5.0, 6.0, 0), V3(5.0, 5.3, 0)]); mw([V3(5.0, 1.9, 0), V3(5.0, 0.8, 0), V3(-9, 0.8, 0), V3(-9, 0.4, 0)]); }
        else { const L = V3(-6.2, 3.8, 0), Tn = V3(-3.4, 6.2, 0), R = V3(-0.6, 3.8, 0), B = V3(-3.4, 1.4, 0); o.dg.push(add(diodeBody(S, L.clone().lerp(Tn, 0.14), Tn.clone().lerp(L, 0.14), o.gms[0])), add(diodeBody(S, R.clone().lerp(Tn, 0.14), Tn.clone().lerp(R, 0.14), o.gms[1])), add(diodeBody(S, B.clone().lerp(L, 0.14), L.clone().lerp(B, 0.14), o.gms[2])), add(diodeBody(S, B.clone().lerp(R, 0.14), R.clone().lerp(B, 0.14), o.gms[3])));
          mw([V3(-9, 4.0, 0), V3(-9, 3.8, 0), V3(-6.4, 3.8, 0)]); mw([V3(-9, 0.4, 0), V3(-9, 0.4, -1.4), V3(-0.4, 0.4, -1.4), V3(-0.4, 3.8, -1.4), V3(-0.4, 3.8, 0)]); mw([V3(-3.4, 6.5, 0), V3(-3.4, 7.0, 0), V3(5.0, 7.0, 0), V3(5.0, 5.3, 0)].slice(0, 4)); mw([V3(5.0, 1.9, 0), V3(5.0, 1.0, 0), V3(-3.4, 1.0, 0), V3(-3.4, 1.2, 0)]); }
        o.ca = E.carriers(S, E.mkPath([V3(5.0, 5.3, 0.45), V3(5.0, 4.6, 0.45), V3(5.0, 2.6, 0.45), V3(5.0, 1.9, 0.45)], false), 14); add(o.ca.im); }
      const v = Math.sin(TAU * c.freq * s.t), out = full ? Math.abs(v) : Math.max(v, 0); o.src.set(`${Math.abs(VM * v) < 0.05 ? "0.0" : f1(VM * v, 1)} V`, `AC  ${c.freq} Hz`);
      const T0 = 3.0, x0 = 1.0, x1 = 10.2, y0 = 7.6, A = 1.7, pi = [], po = []; for (let i = 0; i <= 150; i++) { const x = x0 + ((x1 - x0) * i) / 150, tt = s.t - T0 * (1 - i / 150), vv = Math.sin(TAU * c.freq * tt), ov = full ? Math.abs(vv) : Math.max(vv, 0); pi.push(V3(x, y0 + A * vv, -2.45)); po.push(V3(x, y0 + A * ov, -2.43)); } o.cin.setPts(pi); o.cout.setPts(po);
      o.dg.forEach((g, i) => { let on; if (!full) on = v > 0; else on = v > 0 ? i === 0 || i === 3 : i === 1 || i === 2; const mt = g.children[1].children ? null : null; }); const mats = full ? o.gms : [o.gms[0]]; mats.forEach((mt, i) => { let on; if (!full) on = v > 0.02; else on = v > 0.02 ? i === 0 || i === 3 : v < -0.02 ? i === 1 || i === 2 : false; mt.emissiveIntensity += ((on ? 2.0 : 0) - mt.emissiveIntensity) * 0.35; });
      o.ph = ((o.ph || 0) + dt * out * 1.6) % 1; if (o.ca) { for (let i = 0; i < 14; i++) { const u = ((i / 14 + o.ph) % 1) * o.ca.path.len, p = o.ca.path.pos(u); o.ca.im.set(i, p.x, p.y, p.z, out > 0.03 ? 1 : 0.0001); } o.ca.im.instanceMatrix.needsUpdate = true; }
      const bd = o.load.children[0]; if (bd && bd.material && bd.material.emissive) { bd.material.emissive.setHex(0xff5a1a); bd.material.emissiveIntensity = clamp(out * out * 1.1, 0, 1.2); } o.v = v; o.out = out; o.full = full; S.aim([1.5, 4.7, 0], 24, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, full = o.full, vdc = full ? (2 * VM) / Math.PI : VM / Math.PI, vrms = full ? VM / Math.SQRT2 : VM / 2; H.pill(ctx, 14, 26, full ? "FULL-WAVE (bridge): V_out = |V_in|     V_dc = 2V_m / π     f_ripple = 2f" : "HALF-WAVE: V_out = V_in when V_in > 0, else 0     V_dc = V_m / π     f_ripple = f", "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `V_m = ${VM} V   V_in = ${f1(Math.abs(VM * o.v) < 0.05 ? 0 : VM * o.v, 1)} V   V_out = ${f1(Math.abs(VM * o.out) < 0.05 ? 0 : VM * o.out, 1)} V   (ideal diode)`, "#cfe0ff", 10); H.pill(ctx, 14, 70, `V_dc(mean) = ${f1(vdc, 2)} V      V_rms = ${f1(vrms, 2)} V      ripple frequency = ${f1(c.freq * (full ? 2 : 1), 1)} Hz`, "#8df0be", 10);
      H.pill(ctx, 14, 92, `${full ? "4 diodes: two conduct on each half-cycle (green band glows)" : "1 diode: conducts on positive half-cycles only"}   amber = input, cyan = output`, "#9fb8d8", 9.5);
      lab(ctx, S, V3(-9, 0.2, 1.6), "a.c. source", "#cfe0ff", "left"); lab(ctx, S, V3(5.0, 1.0, 1.4), "load R", "#ffb27a"); lab(ctx, S, V3(5.6, 4.9, -2.6), "oscilloscope", "#cfe0ff"); lab(ctx, S, V3(full ? -3.4 : -3.0, full ? 7.4 : 6.9, 0), full ? "bridge rectifier" : "diode", "#cfe0ff");
    },
    readouts(s, c) { const full = Math.round(c.type) === 1; return [["Type", full ? "Full-wave (bridge)" : "Half-wave"], ["Diodes", full ? "4" : "1"], ["Mean d.c. output", `${f1(full ? 2 * VM / Math.PI : VM / Math.PI, 2)} V (for V_m = 10 V)`], ["Ripple frequency", `${f1(c.freq * (full ? 2 : 1), 1)} Hz`]]; },
  };

  /* ================= MAGNETIC DOMAINS ================= */
  const NC = 6, NR = 4, CS = 1.55;
  const mkDomains = () => Array.from({ length: NC * NR }, () => { const a = rnd(-Math.PI, Math.PI); return { ang: a, th0: a, h: rnd(0.1, 1.3) }; });
  const eqAng = (d, al) => d.th0 * clamp(1 - al / d.h, 0, 1);
  const wrapPi = (a) => { a = ((a % TAU) + TAU) % TAU; return a > Math.PI ? a - TAU : a; };
  S_["Magnetic Domains"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 8, 17], [0, 4.6, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.sig = ""; if (!s.domains || s.domains.length !== NC * NR || s.domains[0].th0 === undefined) s.domains = mkDomains();
      o.slab = mk.box(NC * CS + 0.5, NR * CS + 0.5, 0.9, M.matte(0x5c636e, 0.35), 0, 4.6, 0); o.slab.material.metalness = 0.6;
      o.cells = []; o.ar = []; for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) { const x = (i - (NC - 1) / 2) * CS, y = 4.6 + ((NR - 1) / 2 - j) * CS, m = new T.MeshStandardMaterial({ color: 0x6688cc, roughness: 0.45 }); const cell = mk.box(CS * 0.92, CS * 0.92, 0.16, m, x, y, 0.5); o.cells.push({ m, x, y }); const a = mk.arrow(0xffffff, 0.06, 0.22); o.ar.push(a); }
      o.H = [0, 1, 2].map(() => mk.arrow(0x7fe3da, 0.09, 0.3)); o.Mn = mk.arrow(0xffb703, 0.14, 0.4);
      o.pins = []; for (let i = 0; i < 8; i++) { const g = new T.Group(), sh = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.9, 8), M.steel()), hd = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), M.steel()); sh.rotation.z = Math.PI / 2; hd.position.x = -0.46; g.add(sh, hd); g.userData = { hx: 6.4 + (i % 4) * 0.8, hz: -0.6 + Math.floor(i / 4) * 1.2 }; g.position.set(g.userData.hx, 0.06, g.userData.hz); S.scene.add(g); o.pins.push(g); }
      o.sup = E.supply(S); o.sup.position.set(-8.6, 1.7, 0.4); o.sup.scale.setScalar(0.85);
    },
    reset(s, c) { s.domains = mkDomains(); },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, al = c.field / 100; dt = dt || 0.016;
      s.domains.forEach((d) => { const tg = eqAng(d, al); d.ang += (tg - d.ang) * Math.min(1, 3.0 * dt) + (1 - al * 0.8) * rnd(-0.5, 0.5) * dt * 3; });
      let mx = 0, my = 0; s.domains.forEach((d, k) => { const cell = o.cells[k], a = o.ar[k], dx = Math.cos(d.ang), dy = Math.sin(d.ang); mx += dx; my += dy; const hue = (d.ang / TAU + 1) % 1; cell.m.color.setHSL(hue, 0.55, 0.42); S.setArrow(a, V3(cell.x - dx * 0.5, cell.y - dy * 0.5, 0.65), V3(dx, dy, 0), 1); });
      const Mn = mx / s.domains.length; o.Mn_ = Mn; const stot = Math.hypot(mx, my) / s.domains.length; S.setArrow(o.Mn, V3(-3.6, 0.9, 0.6), V3(Mn * 4.0, 0, 0), 1);
      o.H.forEach((a, i) => S.setArrow(a, V3(-9.3 + 0.0, 3.0 + i * 1.6, 0.6), V3(al * 3.4 > 0.05 ? 0.6 + al * 3.0 : 0, 0, 0), 1)); o.sup.set(`${c.field}%`, "MAGNETISING H");
      const k = clamp(Math.floor(Math.max(0, Mn) * 9), 0, 8); o.pins.forEach((g, i) => { const att = i < k, tp = att ? V3(NC * CS / 2 + 0.7 + (i % 2) * 0.2, 4.6 + 0.9 - i * 0.28, 0.05 * (i % 3)) : V3(g.userData.hx, 0.06, g.userData.hz); g.position.lerp(tp, 0.12); g.rotation.z += ((att ? -Math.PI / 2 * 0 : 0) - g.rotation.z) * 0.12; }); o.k = k; o.stot = stot;
      S.aim([0, 4.4, 0], 19, 0.0, 0.22);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, Mn = o.Mn_, al = c.field / 100; H.pill(ctx, 14, 26, "M / M_sat = (1/N) Σ cos θᵢ          (N = 24 domains)", "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `applied H = ${c.field} % of max   →   net magnetisation M/M_sat = ${f1(Mn, 2)}`, "#8df0be", 10.5); H.pill(ctx, 14, 70, Mn < 0.2 ? "domains point every way → fields cancel → UNMAGNETISED" : Mn < 0.7 ? "domains rotate / grow along H → partly magnetised" : Mn < 0.92 ? "most domains aligned → strongly magnetised" : "domains aligned → SATURATION: strong external field", "#cfe0ff", 10);
      H.pill(ctx, 14, 92, `arrow = domain moment (colour = direction);  graph = this sample's M–H curve;  pins held: ${o.k}`, "#9fb8d8", 9.5);
      lab(ctx, S, V3(1.4, 0.55, 0.9), "iron: 24 magnetic domains", "#cfe0ff", "left"); lab(ctx, S, V3(-3.6, 1.6, 0.6), "net M", "#ffb703", "left"); lab(ctx, S, V3(-9.4, 7.3, 0.6), "applied H →", "#7fe3da", "left"); lab(ctx, S, V3(7.8, 1.2, 0.4), "steel pins", "#cfe0ff");
      const pts = []; for (let f = 0; f <= 100; f += 2) { const a = f / 100; pts.push([f, s.domains.reduce((q, d) => q + Math.cos(eqAng(d, a)), 0) / s.domains.length]); } H.graph(ctx, w - 178, 116, 166, 96, { series: [{ pts, color: "#7fe3da", width: 2 }], xmin: 0, xmax: 100, ymin: -0.2, ymax: 1.05, xl: "H (%)", yl: "M / M_sat", dot: [c.field, clamp(Math.max(0, Mn), 0, 1), "#ffb703"], ticksX: 4, ticksY: 2 });
    },
    readouts(s, c) { const al = c.field / 100; const m = (s.domains || []).reduce((a, d) => a + Math.cos(d.ang), 0) / ((s.domains || []).length || 1); return [["Applied field", `${c.field} %`], ["Net magnetisation", `${f1(Math.max(0, m), 2)} M_sat`], ["State", m < 0.2 ? "Unmagnetised" : m < 0.75 ? "Partly magnetised" : "Saturated"]]; },
  };

  /* ================= DIFFUSION OF GASES ================= */
  const BX = 7.0, BY0 = 0.3, BH = 6.0, BZ = 2.6, NA = 55, NB = 55;
  S_["Diffusion of Gases"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 9, 20], [0, 3.2, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.t = 0; s.sigT = null; glassBox(S, 2 * BX, BH, 2 * BZ, 0, BY0 + BH / 2, 0);
      o.A = mk.particles(NA, 0.2, new T.MeshStandardMaterial({ color: 0x4af0e0, emissive: 0x1a9a90, emissiveIntensity: 0.9, roughness: 0.3 })); o.B = mk.particles(NB, 0.34, new T.MeshStandardMaterial({ color: 0xf0705f, emissive: 0x902a20, emissiveIntensity: 0.8, roughness: 0.3 })); o.A.frustumCulled = o.B.frustumCulled = false;
      o.part = mk.box(0.12, BH, 2 * BZ, new T.MeshStandardMaterial({ color: 0xaab0bb, transparent: true, opacity: 0.55, metalness: 0.6, roughness: 0.3 }), 0, BY0 + BH / 2, 0); o.pa = []; o.pb = [];
      o.lit = mk.cyl(0.8, 0.9, 0.5, M.matte(0x22262d, 0.45), 0, 0.05, 0); mk.box(2 * BX + 1, 0.3, 2 * BZ + 1, M.matte(0x22262d, 0.45), 0, 0.15, 0);
    },
    reset(s, c) { s.sigT = null; },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs; dt = dt || 0.016; const vs = Math.sqrt(c.temp / 300);
      if (s.sigT === null || s.t > 30) { s.sigT = c.temp; s.t = 0; o.pa = Array.from({ length: NA }, () => ({ x: rnd(-BX + 0.3, -0.3), y: rnd(BY0 + 0.3, BY0 + BH - 0.3), z: rnd(-BZ + 0.3, BZ - 0.3), d: V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize() })); o.pb = Array.from({ length: NB }, () => ({ x: rnd(0.3, BX - 0.3), y: rnd(BY0 + 0.3, BY0 + BH - 0.3), z: rnd(-BZ + 0.3, BZ - 0.3), d: V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize() })); }
      s.t += dt; const open = s.t > 1.5, pu = open ? clamp((s.t - 1.5) / 1.2, 0, 1) : 0; o.part.position.y = BY0 + BH / 2 + pu * (BH + 0.2); o.part.visible = pu < 1;
      const tau = 0.12, va = 5.0 * vs, vb = 5.0 * vs / Math.sqrt(10);
      const upd = (arr, v, im, r) => arr.forEach((p, i) => { if (Math.random() < dt / tau) p.d.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize(); p.x += p.d.x * v * dt; p.y += p.d.y * v * dt; p.z += p.d.z * v * dt; const px = open ? -BX + r : (arr === o.pa ? -BX + r : 0.06 + r); const hx = open ? BX - r : (arr === o.pa ? -0.06 - r : BX - r); if (p.x < px) { p.x = px; p.d.x = Math.abs(p.d.x); } if (p.x > hx) { p.x = hx; p.d.x = -Math.abs(p.d.x); } if (p.y < BY0 + r) { p.y = BY0 + r; p.d.y = Math.abs(p.d.y); } if (p.y > BY0 + BH - r) { p.y = BY0 + BH - r; p.d.y = -Math.abs(p.d.y); } if (p.z < -BZ + r) { p.z = -BZ + r; p.d.z = Math.abs(p.d.z); } if (p.z > BZ - r) { p.z = BZ - r; p.d.z = -Math.abs(p.d.z); } im.set(i, p.x, p.y, p.z, 1); });
      upd(o.pa, va, o.A, 0.2); upd(o.pb, vb, o.B, 0.34); o.A.instanceMatrix.needsUpdate = true; o.B.instanceMatrix.needsUpdate = true; o.va = va; o.vb = vb;
      const bins = 8, ha = new Array(bins).fill(0), hb = new Array(bins).fill(0); o.pa.forEach((p) => ha[clamp(Math.floor(((p.x + BX) / (2 * BX)) * bins), 0, bins - 1)]++); o.pb.forEach((p) => hb[clamp(Math.floor(((p.x + BX) / (2 * BX)) * bins), 0, bins - 1)]++); o.ha = ha; o.hb = hb; o.aR = ha.slice(4).reduce((a, b) => a + b, 0) / NA; o.bL = hb.slice(0, 4).reduce((a, b) => a + b, 0) / NB; o.open = open;
      S.aim([0, 3.2, 0], 21, 0.0, 0.32);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, T0 = c.temp, vr = (m) => Math.sqrt((3 * 1.381e-23 * T0) / (m * 1.66e-27)); H.pill(ctx, 14, 26, "v_rms = √(3kT / m)        rate ∝ 1/√M  (Graham's law)        diffusion: high → low concentration", "#ffd27a", 10);
      H.pill(ctx, 14, 48, `T = ${T0} K   →   He (4 u): v_rms = ${f1(vr(4), 0)} m/s     Ar (40 u): v_rms = ${f1(vr(40), 0)} m/s`, "#cfe0ff", 10); H.pill(ctx, 14, 70, `light gas moves √(40/4) = 3.2× faster; higher T → faster mixing.   He now in right half: ${f1(o.aR * 100, 0)} %,  Ar in left half: ${f1(o.bL * 100, 0)} %`, "#8df0be", 9.5);
      H.pill(ctx, 14, 92, o.open ? "partition removed: random collisions carry molecules from high to low concentration → uniform" : "partition in place: He (left) and Ar (right) are separated", "#9fb8d8", 9.5);
      lab(ctx, S, V3(-BX + 0.2, BY0 + BH + 0.5, BZ), "● He (light, fast)", "#4af0e0", "left"); lab(ctx, S, V3(BX - 0.2, BY0 + BH + 0.5, BZ), "● Ar (heavy, slow)", "#f0705f", "right");
      const x0 = 14, y0 = h - 110, bw = 13, mx = 22; ctx.save(); ctx.fillStyle = "rgba(8,12,22,0.62)"; ctx.fillRect(x0 - 6, y0 - 22, 8 * (bw * 2 + 2) + 18, 124); ctx.font = "9px sans-serif"; ctx.fillStyle = "#9fb8d8"; ctx.fillText("concentration along the tube (per slice)", x0, y0 - 10); for (let i = 0; i < 8; i++) { const bx = x0 + i * (bw * 2 + 2); ctx.fillStyle = "#4af0e0"; const ha = (o.ha[i] / mx) * 80; ctx.fillRect(bx, y0 + 90 - ha, bw, ha); ctx.fillStyle = "#f0705f"; const hb = (o.hb[i] / mx) * 80; ctx.fillRect(bx + bw, y0 + 90 - hb, bw, hb); } ctx.strokeStyle = "rgba(160,190,230,0.6)"; ctx.beginPath(); ctx.moveTo(x0 - 2, y0 + 90); ctx.lineTo(x0 + 8 * (bw * 2 + 2), y0 + 90); ctx.stroke(); ctx.restore();
    },
    readouts(s, c) { const vr = (m) => Math.sqrt((3 * 1.381e-23 * c.temp) / (m * 1.66e-27)); return [["Temperature", `${c.temp} K`], ["He v_rms", `${f1(vr(4), 0)} m/s`], ["Ar v_rms", `${f1(vr(40), 0)} m/s`], ["Graham ratio", "√(40/4) = 3.16"]]; },
  };
})();
