/* p3dx-heat.js — photoreal 3D scenes for the T14–T16 simulations in p2d-heat.js (energy, work, machines, heat). */
(function () {
  "use strict";
  const X = window.PX3; if (!X || !X.ready) return;
  const T = THREE, P = window.P3D, M = P.mat, H = P.hud, V = X.V, K = window.PK, TAU = Math.PI * 2;
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180;
  const lab = (ctx, S, p, t, col, dx, dy, sz) => X.lbl(ctx, S, p, t, col, dx, dy, sz);
  const silver = () => new T.MeshPhysicalMaterial({ color: 0xd9dde3, metalness: 1, roughness: 0.08 });
  /* liquid-in-glass thermometer along +y; .set(f) sets the column to fraction f of the stem */
  const thermo = (parent, len, liq, r = 0.05) => { const g = new T.Group(); parent.add(g); const gl = M.glass(0xf0f8ff); gl.opacity = 0.32;
    const st = new T.Mesh(new T.CylinderGeometry(r, r, len, 24), gl); st.position.y = len / 2; st.renderOrder = 4; g.add(st); const bulb = new T.Mesh(new T.SphereGeometry(r * 1.9, 28, 20), gl); bulb.renderOrder = 4; g.add(bulb);
    const lm = liq === "Hg" ? silver() : M.plastic(liq, 0.2); X.mesh(new T.SphereGeometry(r * 1.6, 24, 16), lm, g); const col = X.mesh(new T.CylinderGeometry(r * 0.5, r * 0.5, 1, 12), lm, g); g.col = col; g.lm = lm;
    const back = new T.Mesh(new T.PlaneGeometry(r * 2.4, len * 0.96), M.matte(0xf6f2e6, 0.8)); back.position.set(0, len * 0.52, -r * 0.9); g.add(back);
    g.set = (f) => { const h = clampv(f, 0.001, 1) * len; col.scale.y = h; col.position.y = h / 2; }; g.len = len; return g; };
  const stand = (S, x, z, h) => { const g = X.group(S, x, 0, z); X.mesh(new T.BoxGeometry(1.3, 0.1, 0.8), M.matte(0x2a2f37, 0.45), g, 0, 0.05, 0); X.mesh(new T.CylinderGeometry(0.04, 0.04, h, 20), M.chrome(), g, -0.45, h / 2, 0); return g; };
  const flame = (S, x, y, z, k = 1) => { const g = X.group(S, x, y, z); const f1 = new T.Mesh(new T.ConeGeometry(0.08 * k, 0.32 * k, 20, 1, true), M.glow(0x3a7bff, 0.55)); f1.position.y = 0.16 * k; g.add(f1); const f2 = new T.Mesh(new T.ConeGeometry(0.05 * k, 0.2 * k, 16, 1, true), M.glow(0xbfe0ff, 0.6)); f2.position.y = 0.1 * k; g.add(f2); return g; };

  /* ---------- Sankey energy flow in 3D ---------- */
  const DEV = [[[85, 15]], [[25, 65, 10]], [[20, 80]], [[10, 90]], [[5, 95]], [[33, 67]], [[40, 60]]];
  const DN = [["Electrical", "Heat & sound"], ["Kinetic", "Heat", "Sound"], ["Electrical", "Heat"], ["Light", "Heat"], ["Sound", "Heat"], ["Electrical", "Heat"], ["Light", "Heat"]];
  const sx = (px) => (px - 225) * 0.0125, sy = (py) => (300 - py) * 0.0125;
  X.def("Energy Conversions (Sankey Diagram)", {
    env: "dark", envOpts: { w: 14, d: 8 }, cam: [[0.2, 2.0, 8.4], [0.1, 1.75, 0]], shift: [0, 40], exposure: 1.2,
    build(S, s, c, mk, o) { o.g = X.group(S); o.dots = mk.particles(60, 0.035, M.emissive(0xffd27a, 1.5)); },
    update(S, s, c) {
      const o = S.objs, outs = DEV[c.d][0], x0 = 40, y0 = 120, Hh = 140, xs = 230;
      if (X.changed(S, "d" + c.d)) { while (o.g.children.length) { const q = o.g.children.pop(); q.geometry.dispose(); } o.paths = [];
        const inp = X.mesh(new T.BoxGeometry(sx(xs) - sx(x0), Hh * 0.0125, 0.16), new T.MeshPhysicalMaterial({ color: 0xffb703, emissive: 0xb06a00, emissiveIntensity: 0.35, roughness: 0.25, clearcoat: 1, transparent: true, opacity: 0.85 }), o.g, (sx(x0) + sx(xs)) / 2, sy(y0 + Hh / 2), 0); void inp;
        let yy = 40; outs.forEach((p, i) => { const h = (Hh * p) / 100, useful = i === 0, ty = y0 + outs.slice(0, i).reduce((a, q) => a + (Hh * q) / 100, 0), ey = useful ? yy : yy + 40 * i;
          const sh = new T.Shape(), bz = (t, a, b) => { const u = 1 - t; return [u * u * u * xs + 3 * u * u * t * (xs + 90) + 3 * u * t * t * (xs + 90) + t * t * t * (xs + 180), u * u * u * a + 3 * u * u * t * a + 3 * u * t * t * b + t * t * t * b]; };
          for (let k = 0; k <= 30; k++) { const q = bz(k / 30, ty, ey); k ? sh.lineTo(sx(q[0]), sy(q[1])) : sh.moveTo(sx(q[0]), sy(q[1])); } for (let k = 30; k >= 0; k--) { const q = bz(k / 30, ty + h, ey + h); sh.lineTo(sx(q[0]), sy(q[1])); }
          const m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 4 }), new T.MeshPhysicalMaterial({ color: useful ? 0x37d6c6 : 0xef6a5a, emissive: useful ? 0x0c6a62 : 0x6a1a12, emissiveIntensity: 0.4, roughness: 0.25, clearcoat: 1, transparent: true, opacity: 0.86 }));
          m.position.z = -0.07; m.castShadow = true; o.g.add(m); o.paths.push({ ty, ey, h, i, p, mid: [sx(xs + 186), sy(ey + h / 2)] }); yy = ey + h + 30; }); }
      const t = S.t || 0; for (let i = 0; i < 60; i++) { const u = (t * 0.25 + i / 60) % 1, lane = o.paths[i % o.paths.length], seg = (i * 7919) % 100 / 100;
        let x, y; if (u < 0.5) { x = x0 + (u / 0.5) * (xs - x0); y = y0 + lane.ty - y0 + lane.h * seg; } else { const tt = (u - 0.5) / 0.5, a = lane.ty + lane.h * seg, b = lane.ey + lane.h * seg, w = 1 - tt; x = w * w * w * xs + 3 * w * w * tt * (xs + 90) + 3 * w * tt * tt * (xs + 90) + tt * tt * tt * (xs + 180); y = w * w * w * a + 3 * w * w * tt * a + 3 * w * tt * tt * b + tt * tt * tt * b; }
        o.dots.set(i, sx(x), sy(y), 0.1); } o.dots.instanceMatrix.needsUpdate = true;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.paths) return; lab(ctx, S, V(sx(40), sy(112), 0), "Input " + c.E + " J", "#ffd27a", 0, -4, 11.5); o.paths.forEach((q) => lab(ctx, S, V(q.mid[0], q.mid[1], 0), DN[c.d][q.i] + " " + K.f((c.E * q.p) / 100, 0) + " J (" + q.p + " %)", q.i ? "#ff8f80" : "#7fe3da", 0, 4, 10.5)); },
  });

  /* ---------- World energy resources: 3D bar wall ---------- */
  const RES = [["Oil", 0, 31], ["Coal", 0, 26], ["Natural gas", 0, 23], ["Hydro-electric", 1, 6], ["Nuclear", 0, 4], ["Wind", 1, 3], ["Solar", 1, 2.5], ["Biomass", 1, 4], ["Tidal & wave", 1, 0.1], ["Geothermal", 1, 0.4]];
  X.def("World Energy Resources", {
    cam: [[0.6, 2.2, 6.4], [0.3, 1.85, 0]], shift: 100,
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(4.6, 3.5, 0.06), M.matte(0x1d2533, 0.6), S.scene, 0.6, 1.95, -0.3); o.bars = RES.map((r, i) => { const m = X.mesh(new T.BoxGeometry(1, 0.22, 0.24), M.plastic(r[1] ? 0x3cc277 : 0xe0604f, 0.25), S.scene, 0, 3.4 - i * 0.32, 0); return m; }); },
    update(S, s, c) { const o = S.objs; o.bars.forEach((m, i) => { const w = Math.max(0.02, (RES[i][2] / 32) * 2.8); m.scale.x = w; m.position.x = -0.9 + w / 2; m.position.z = i === c.r ? 0.18 : 0; m.material.emissive = m.material.emissive || new T.Color(); m.material.emissive.set(i === c.r ? (RES[i][1] ? 0x0e5a2c : 0x5a1a10) : 0x000000); }); },
    hud(ctx, s, c, S) { RES.forEach((r, i) => { lab(ctx, S, V(-0.95, 3.4 - i * 0.32, 0), r[0], i === c.r ? "#e6eef8" : "#93aac4", -4 - r[0].length * 7.2, 4, 9.5); lab(ctx, S, V(-0.9 + Math.max(0.02, (r[2] / 32) * 2.8), 3.4 - i * 0.32, 0.12), r[2] + "%", "#c9d6ea", 4, 4, 9); }); H.pill(ctx, 14, 26, "Approximate share of world primary energy", "#e6eef8", 10.5); },
  });

  /* ---------- Work & power ---------- */
  X.def("Work & Power — Stairs, Pulling & kWh", {
    cam: [[0.0, 2.4, 8.2], [-0.2, 1.4, 0]], shift: 95,
    build(S, s, c, mk, o) {
      const g = (o.g = [0, 1, 2].map(() => X.group(S))); for (let i = 0; i < 10; i++) X.mesh(new T.BoxGeometry(0.4, 0.3 * (i + 1), 1.2), M.matte(0x8a7a66, 0.85), g[0], -2.0 + i * 0.4, 0.15 * (i + 1), 0);
      const pm = (o.person = X.group(S)); g[0].add(pm); X.mesh(new T.CapsuleGeometry(0.11, 0.34, 6, 16), M.matte(0x2f6fd0, 0.8), pm, 0, 0.42, 0); X.mesh(new T.SphereGeometry(0.1, 20, 14), M.matte(0x7a4a2c, 0.7), pm, 0, 0.78, 0);
      X.mesh(new T.BoxGeometry(5, 0.06, 1.6), M.matte(0xeef3f8, 0.6), g[1], -0.4, 0.03, 0); o.sled = X.mesh(new T.BoxGeometry(0.8, 0.28, 0.5), M.wood(), g[1], 0, 0.22, 0); [-0.2, 0.2].forEach((z) => X.mesh(new T.BoxGeometry(0.9, 0.04, 0.04), M.steel(), o.sled, 0, -0.16, z));
      o.rope = mk.rod(V(0, 0, 0), V(1, 0, 0), 0.012, M.matte(0xd8c9a0)); g[1].add(o.rope); o.aF = mk.arrow(0xffb703); o.aX = mk.arrow(0x2fd6c4); g[1].add(o.aF, o.aX);
      const met = X.group(S, -1.0, 0.0, 0); g[2].add(met); X.mesh(new T.BoxGeometry(1.1, 1.4, 0.4), M.plastic(0xe8e8ea, 0.35), met, 0, 1.4, 0); o.lcd = X.screen(met, 0.8, 0.3, { bg: "#0f1d10", fg: "#7dff9a" }); o.lcd.position.set(0, 1.6, 0.205); X.mesh(new T.CylinderGeometry(0.22, 0.22, 0.02, 32), M.glass(), met, 0, 1.1, 0.21).rotation.x = Math.PI / 2;
      o.disc = X.mesh(new T.CylinderGeometry(0.18, 0.18, 0.01, 32), M.aluminium(), met, 0, 1.1, 0.2); o.disc.rotation.x = Math.PI / 2; g[2].add(mk.tube([[-0.45, 1.0, 0], [-0.2, 0.3, 0.1], [0.5, 0.15, 0.2], [0.9, 0.1, 0]], 0.025, M.matte(0x1a1a1a)));
      o.bulb = mk.bulb(0xfff0c0, 10); o.bulb.position.set(0.9, 1.4, 0); g[2].add(o.bulb); X.mesh(new T.CylinderGeometry(0.03, 0.03, 1.1, 10), M.steel(), g[2], 0.9, 0.6, 0);
    },
    update(S, s, c) {
      const o = S.objs; o.g.forEach((q, i) => (q.visible = i === c.m)); const u = s.u || 0;
      if (c.m === 0) { const k = Math.floor(u * 10); o.person.position.set(-2.0 + k * 0.4, 0.3 * (k + 1), 0); }
      else if (c.m === 1) { const th = rad(Math.min(c.t, 80)), x = -2.3 + u * 2.2, A = V(x + 0.4, 0.25, 0); o.sled.position.x = x; S.setRod(o.rope, A, A.clone().add(V(Math.cos(th), Math.sin(th), 0).multiplyScalar(1.6))); S.setArrow(o.aF, A.clone().add(V(0, 0, 0.3)), V(Math.cos(th), Math.sin(th), 0), 1.1); S.setArrow(o.aX, A.clone().add(V(0, 0, 0.3)), V(Math.cos(th), 0, 0), 1.1); o.A = A; }
      else { const kwh = (c.a / 1000) * Math.min(c.b, 24) * 30; o.lcd.set(K.f(kwh, 1) + " kWh"); o.disc.rotation.y += c.a * 0.00005; o.bulb.setPower(clampv(c.a / 400, 0.2, 1.3)); }
    },
    hud(ctx, s, c, S) { const o = S.objs; if (c.m === 0) lab(ctx, S, o.person.position.clone().add(V(0, 1.0, 0)), "h = " + Math.min(c.b, 20) + " m", "#ffd27a", -20, -6, 10); else if (c.m === 1 && o.A) { lab(ctx, S, o.A.clone().add(V(Math.cos(rad(Math.min(c.t, 80))) * 1.1, Math.sin(rad(Math.min(c.t, 80))) * 1.1, 0.3)), "F", "#ffd27a", 6, 0, 11); lab(ctx, S, o.A.clone().add(V(1.1 * Math.cos(rad(Math.min(c.t, 80))), 0, 0.3)), "F cosθ", "#7fe3da", 6, 14, 10); } else lab(ctx, S, V(-1.0, 0.6, 0.2), "energy meter (month)", "#c9d6ea", -60, 20, 10); },
  });

  /* ---------- Machines: wheel & axle, screw jack, gears ---------- */
  const gearGeo = (r, n, th = 0.12) => { const sh = new T.Shape(); for (let i = 0; i < n * 4; i++) { const t = (i / (n * 4)) * TAU, R = i % 4 < 2 ? r + 0.06 : r; i ? sh.lineTo(R * Math.cos(t), R * Math.sin(t)) : sh.moveTo(R * Math.cos(t), R * Math.sin(t)); } sh.closePath(); const hole = new T.Path(); hole.absarc(0, 0, 0.05, 0, TAU, true); sh.holes.push(hole); const g = new T.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 6 }); g.translate(0, 0, -th / 2); return g; };
  X.def("Wheel & Axle, Screw Jack and Gears", {
    cam: [[0.2, 2.0, 6.4], [0.1, 1.6, 0]],
    build(S, s, c, mk, o) {
      const g = (o.g = [0, 1, 2].map(() => X.group(S)));
      [-0.5, 0.5].forEach((z) => X.mesh(new T.BoxGeometry(0.12, 2.6, 0.12), M.wood(), g[0], 0, 1.3, z * 1.6)); o.wa = X.group(S, 0, 2.5, 0); g[0].add(o.wa); o.wa.parts = new T.Group(); o.wa.add(o.wa.parts);
      o.r1 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.012, M.matte(0xd8c9a0)); o.r2 = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.012, M.matte(0xd8c9a0)); g[0].add(o.r1, o.r2); o.load = X.mesh(new T.CylinderGeometry(0.2, 0.17, 0.32, 28), M.iron(), g[0]); o.aE = mk.arrow(0xffb703); g[0].add(o.aE);
      X.mesh(new T.CylinderGeometry(0.5, 0.6, 0.3, 40), M.matte(0x2a2d33, 0.5), g[1], 0, 0.15, 0); o.screw = X.group(S); g[1].add(o.screw); o.top = X.group(S); g[1].add(o.top);
      X.mesh(new T.CylinderGeometry(0.12, 0.12, 1.8, 24), M.steel(), o.screw, 0, 0.9, 0); o.screw.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({ length: 241 }, (_, i) => V(0.13 * Math.cos(i * 0.5), 0.05 + i * 0.0072, 0.13 * Math.sin(i * 0.5)))), 480, 0.02, 6), M.steel()));
      X.mesh(new T.CylinderGeometry(0.3, 0.3, 0.12, 32), M.steel(), o.top, 0, 0, 0); X.mesh(new T.BoxGeometry(2.4, 0.25, 1.0), M.paint(0x2a5ad8), o.top, 0.4, 0.25, 0); o.handle = X.group(S); o.top.add(o.handle); X.mesh(new T.CylinderGeometry(0.025, 0.025, 1, 10), M.chrome(), o.handle, 0.5, -0.4, 0).rotation.z = Math.PI / 2;
      o.gA = X.group(S, 0, 1.7, 0); o.gB = X.group(S, 0, 1.7, 0); g[2].add(o.gA, o.gB); X.mesh(new T.BoxGeometry(3.4, 2.2, 0.1), M.matte(0x30343b, 0.5), g[2], 0.3, 1.7, -0.25);
    },
    update(S, s, c) {
      const o = S.objs, a = s.a || 0; o.g.forEach((q, i) => (q.visible = i === c.m));
      if (c.m === 0) { const R = 0.35 + c.p1 * 0.016, r = 0.06 + c.p2 * 0.012;
        if (X.changed(S, "w" + c.p1 + "," + c.p2)) { const pp = o.wa.parts; while (pp.children.length) pp.remove(pp.children[0]); const tor = X.mesh(new T.TorusGeometry(R, 0.03, 12, 64), M.wood(), pp); tor.position.z = 0.3; for (let k = 0; k < 6; k++) { const sp = new T.Mesh(new T.BoxGeometry(R * 2, 0.03, 0.03), M.wood()); sp.rotation.z = (k * Math.PI) / 6; sp.position.z = 0.3; pp.add(sp); } const dr = X.mesh(new T.CylinderGeometry(r, r, 0.6, 32), M.wood(), pp); dr.rotation.x = Math.PI / 2; dr.position.z = -0.25; X.mesh(new T.CylinderGeometry(0.03, 0.03, 1.7, 12), M.steel(), pp).rotation.x = Math.PI / 2; }
        o.wa.parts.rotation.z = a * 0.6; const ly = 1.1 + 0.25 * Math.sin(a * 0.3); S.setRod(o.r2, V(-r, 2.5, -0.25), V(-r, ly + 0.16, -0.25)); o.load.position.set(-r, ly, -0.25); S.setRod(o.r1, V(R, 2.5, 0.3), V(R, 1.3, 0.3)); S.setArrow(o.aE, V(R, 1.3, 0.3), V(0, -1, 0), 0.45); o.R = R; o.rr = r; }
      else if (c.m === 1) { const rise = ((a * 0.15) % 1) * 0.6; o.top.position.y = 1.0 + rise; o.handle.rotation.y = a * 2; o.screw.position.y = rise * 0.5; }
      else { const n1 = Math.round(c.p1), n2 = Math.round(c.p2), r1 = 0.15 + c.p1 * 0.012, r2 = 0.15 + c.p2 * 0.012;
        if (X.changed(S, "g" + n1 + "," + n2)) { X.clear(S, [o.m1, o.m2]); o.m1 = X.mesh(gearGeo(r1, n1), M.steel(), o.gA); o.m2 = X.mesh(gearGeo(r2, n2), M.brass(), o.gB); }
        o.gA.position.x = -0.9; o.gB.position.x = -0.9 + r1 + r2 + 0.07; o.gA.rotation.z = a; o.gB.rotation.z = (-a * c.p1) / c.p2 + Math.PI / n2; o.r1g = r1; o.r2g = r2; }
    },
    hud(ctx, s, c, S) { const o = S.objs; if (c.m === 0 && o.R) { lab(ctx, S, V(o.R, 0.85, 0.3), "effort", "#ffd27a", 8, 0, 10); lab(ctx, S, V(-o.rr, 0.85, -0.25), "load " + c.L + " N", "#c9d6ea", -70, 10, 10); lab(ctx, S, V(0, 3.1, 0), "windlass: wheel R and axle r", "#c9d6ea", -80, -6, 10); }
      else if (c.m === 1) { lab(ctx, S, V(0.4, o.top.position.y + 0.5, 0), "car (load)", "#c9d6ea", -30, -4, 10); lab(ctx, S, V(0, 0.4, 0.5), "one turn of handle raises load by one pitch", "#c9d6ea", -120, 26, 10); }
      else if (o.r1g) { lab(ctx, S, V(-0.9, 1.7 - o.r1g - 0.1, 0), "driver " + Math.round(c.p1) + " teeth", "#c9d6ea", -50, 20, 10); lab(ctx, S, V(-0.9 + o.r1g + o.r2g + 0.07, 1.7 - o.r2g - 0.1, 0), "driven " + Math.round(c.p2) + " teeth", "#c9d6ea", -50, 20, 10); } },
  });

  /* ---------- Thermometers ---------- */
  X.def("Thermometers & Temperature Scales", {
    cam: [[0.4, 2.0, 5.6], [0.2, 1.85, 0]], shift: 160,
    build(S, s, c, mk, o) { stand(S, 0.75, -0.1, 3.8); X.mesh(new T.BoxGeometry(0.5, 0.1, 0.12), M.matte(0x30343b), S.scene, 0.25, 3.3, -0.05); o.hg = thermo(S.scene, 3.0, "Hg", 0.06); o.al = thermo(S.scene, 3.0, 0xd8404f, 0.06); [o.hg, o.al].forEach((t) => t.position.set(0, 0.45, 0)); o.bk = mk.beaker(0.42, 0.7, 0.4, 0x8fc8ee); o.bk.position.set(0, 0, 0); },
    update(S, s, c) { const o = S.objs, t = c.liq === 0 ? o.hg : o.al; o.hg.visible = c.liq === 0; o.al.visible = c.liq === 1; const Lt = c.L0 + (c.th / 100) * 16, sc = 3.0 / 22; t.set(Math.max(0, Lt) * sc / 3.0); o.sc = sc; o.Lt = Lt; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.sc == null) return; const y = (L) => 0.45 + L * o.sc; [[c.L0, "0 °C (ice point)"], [c.L0 + 16, "100 °C (steam point)"]].forEach(([L, t]) => { H.line(ctx, S, V(0.07, y(L), 0), V(0.3, y(L), 0), "#ffb703", 1.5); lab(ctx, S, V(0.3, y(L), 0), t + " · L = " + K.f(L, 1) + " cm", "#ffd27a", 4, 4, 10); });
      H.line(ctx, S, V(-0.3, y(Math.max(0, o.Lt)), 0), V(-0.07, y(Math.max(0, o.Lt)), 0), "#7fe3da", 1.5); lab(ctx, S, V(-0.3, y(Math.max(0, o.Lt)), 0), K.f(o.Lt, 2) + " cm", "#7fe3da", -70, 4, 10); },
  });

  /* ---------- Anomalous expansion: frozen pond cut-away ---------- */
  X.def("Anomalous Expansion of Water", {
    env: "outdoor", cam: [[0.4, 2.1, 5.0], [0.3, 0.9, 0]], shift: [-168, 20],
    hudOpt0: { bgAll: 1 },
    build(S, s, c, mk, o) { const gl = new T.Mesh(new T.BoxGeometry(3.0, 2.0, 1.4), M.glass()); gl.position.set(0.3, 1.0, 0); gl.renderOrder = 3; S.scene.add(gl);
      o.layers = Array.from({ length: 6 }, (_, i) => { const m = new T.Mesh(new T.BoxGeometry(2.96, 1, 1.36), M.water(0x2a6ab8)); m.material.opacity = 0.82; m.renderOrder = 2; S.scene.add(m); return m; });
      o.ice = new T.Mesh(new T.BoxGeometry(2.96, 1, 1.36), new T.MeshPhysicalMaterial({ color: 0xeef7ff, roughness: 0.25, transmission: 0, transparent: true, opacity: 0.85, clearcoat: 1 })); S.scene.add(o.ice); X.mesh(new T.BoxGeometry(3.1, 0.12, 1.5), M.matte(0x4a3a2a, 1), S.scene, 0.3, 0.06, 0);
      o.fish = [0, 1, 2].map((i) => { const f = X.group(S, -0.5 + i * 0.75, 0.35 + (i % 2) * 0.1, 0.1 * i - 0.1); X.mesh(new T.SphereGeometry(0.11, 20, 14), M.plastic(0xf2a020, 0.3), f).scale.set(1.6, 0.8, 0.6); X.mesh(new T.ConeGeometry(0.08, 0.14, 12), M.plastic(0xf2a020, 0.3), f, -0.2, 0, 0).rotation.z = -Math.PI / 2; return f; }); },
    update(S, s, c) { const o = S.objs, ice = c.Ta < 0 ? clampv(-c.Ta * 0.04, 0, 0.6) : 0, top = 1.95, bot = 0.12, h = (top - ice - bot) / 6; o.ice.visible = ice > 0; o.ice.scale.y = Math.max(0.001, ice); o.ice.position.set(0.3, top - ice / 2, 0); o.T = [];
      o.layers.forEach((m, i) => { const T6 = c.Ta < 4 ? 4 - ((5 - i) / 5) * (4 - Math.max(0, c.Ta)) : c.Ta - (i / 5) * (c.Ta - 4), yTop = top - ice - i * h; m.scale.y = h; m.position.set(0.3, yTop - h / 2, 0); const k = clampv(T6 / 15, 0, 1); m.material.color.setRGB(0.12 + 0.5 * (1 - k) * 0.4, 0.38 + 0.2 * (1 - k), 0.75 - 0.25 * k); o.T.push([clampv(T6, 0, 30), yTop - h / 2]); });
      o.fish.forEach((f, i) => (f.position.x = -0.7 + i * 0.75 + 0.15 * Math.sin((S.t || 0) * 0.8 + i))); o.ic = ice; },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.T) return; o.T.forEach(([t, y]) => lab(ctx, S, V(1.8, y, 0.7), K.f(t, 1) + " °C", "#e8f4ff", 4, 4, 9.5)); lab(ctx, S, V(0.3, 2.05, 0), o.ic ? "Ice floats and insulates the water below" : "No ice · air " + c.Ta + " °C", "#e6eef8", -110, 22, 10.5); lab(ctx, S, V(0.3, 0.1, 0.7), "Bottom stays at ≈ 4 °C — fish survive", "#7fe3da", -110, 24, 10); },
  });

  /* ---------- Land & sea breezes / vacuum flask ---------- */
  X.def("Land & Sea Breezes · Vacuum Flask", {
    env: "void", cam: [[0, 2.4, 7.4], [0, 1.6, 0]], shift: 0,
    build(S, s, c, mk, o) {
      const g = (o.g = [X.group(S), X.group(S)]); X.mesh(new T.BoxGeometry(4, 1.2, 2), M.matte(0xc8a060, 0.95), g[0], -2, 0.6, 0); const sea = new T.Mesh(new T.BoxGeometry(4, 1.0, 2), new T.MeshPhysicalMaterial({ color: 0x1f5f96, roughness: 0.1, clearcoat: 1 })); sea.position.set(2, 0.5, 0); g[0].add(sea);
      [[-2.8, 0.15], [-1.5, -0.4], [-2.4, -0.6]].forEach(([x, z]) => { const p = X.group(S, x, 1.2, z); g[0].add(p); X.mesh(new T.CylinderGeometry(0.04, 0.06, 0.9, 8), M.matte(0x6a4a2a), p, 0, 0.45, 0); X.mesh(new T.ConeGeometry(0.35, 0.3, 7), M.matte(0x2f6a2a), p, 0, 0.95, 0); });
      o.sun = mk.sphere(0.35, new T.MeshBasicMaterial({ color: 0xffe07a })); g[0].add(o.sun); o.sg = mk.soft(0xffe8a0, 1.8, 0, 0, 0, 0.7); g[0].add(o.sg); o.air = mk.particles(30, 0.06, M.emissive(0xffffff, 0.8)); g[0].add(o.air); o.big = mk.arrow(0xffffff, 0.06, 0.2); g[0].add(o.big);
      const fl = X.group(S, -2.0, 0, 0); g[1].add(fl); X.mesh(new T.CylinderGeometry(0.6, 0.6, 2.4, 48, 1, true, 0, Math.PI * 1.4), M.matte(0x8a9099, 0.5), fl, 0, 1.3, 0).material.side = T.DoubleSide;
      const sil = silver(); sil.side = T.DoubleSide; X.mesh(new T.CylinderGeometry(0.5, 0.5, 2.1, 48, 1, true, 0, Math.PI * 1.4), sil, fl, 0, 1.25, 0); X.mesh(new T.CylinderGeometry(0.42, 0.42, 2.0, 48, 1, true, 0, Math.PI * 1.4), sil, fl, 0, 1.25, 0);
      o.tea = X.mesh(new T.CylinderGeometry(0.41, 0.41, 1.7, 48, 1, false, 0, Math.PI * 1.4), M.water(0x6a3a1a), fl, 0, 1.1, 0); X.mesh(new T.CylinderGeometry(0.36, 0.32, 0.4, 32), M.matte(0xb08a5a, 0.9), fl, 0, 2.45, 0); X.mesh(new T.CylinderGeometry(0.62, 0.62, 0.15, 48), M.matte(0x2a2d33), fl, 0, 0.07, 0);
      o.cup = X.group(S, -0.6, 0, 0.3); g[1].add(o.cup); const cp = [new T.Vector2(0.001, 0), new T.Vector2(0.3, 0), new T.Vector2(0.36, 0.55), new T.Vector2(0.33, 0.55), new T.Vector2(0.27, 0.04), new T.Vector2(0.001, 0.04)]; X.mesh(new T.LatheGeometry(cp, 48), M.ceramic(0xf4f1ea), o.cup); X.mesh(new T.CylinderGeometry(0.31, 0.27, 0.42, 40), M.water(0x6a3a1a), o.cup, 0, 0.27, 0);
    },
    update(S, s, c) {
      const o = S.objs, br = c.m < 2; o.g[0].visible = br; o.g[1].visible = !br; S.scene.background.set(br ? (c.m === 0 ? 0x4a86d0 : 0x060b18) : 0x0a0f18);
      if (br) { const day = c.m === 0; o.sun.position.set(day ? -3.2 : 3.2, 3.6, -1); o.sg.position.copy(o.sun.position); o.sun.material.color.set(day ? 0xffe07a : 0xe8e8f0); o.sg.material.color.set(day ? 0xffe8a0 : 0x9fb0d0);
        const cx1 = day ? -2 : 2, cx2 = day ? 2 : -2, loop = [V(cx2, 1.45, 0), V(cx1, 1.45, 0), V(cx1, 3.2, 0), V(cx2, 3.2, 0)]; for (let i = 0; i < 30; i++) { const u = (((s.u || 0) * 0.12 + i / 30) % 1) * 4, k = Math.floor(u), r = u - k, a = loop[k], b = loop[(k + 1) % 4]; o.air.set(i, a.x + (b.x - a.x) * r, a.y + (b.y - a.y) * r, ((i * 37) % 10) / 10 - 0.5); } o.air.instanceMatrix.needsUpdate = true;
        S.setArrow(o.big, V(cx2 * 0.8, 1.7, 0.6), V(cx1 - cx2, 0, 0), 0.4); o.day = day; }
      else { const Tf = 25 + 65 * Math.exp(-0.0025 * c.t), Tc = 25 + 65 * Math.exp(-0.03 * c.t); o.Tf = Tf; o.Tc = Tc; }
    },
    hud(ctx, s, c, S) { const o = S.objs; if (c.m < 2) { const d = o.day; H.pill(ctx, 200, 30, d ? "SEA BREEZE (from sea to land)" : "LAND BREEZE (from land to sea)", "#ffffff", 13); lab(ctx, S, V(d ? -2 : 2, 3.4, 0), "warm air rises", "#fff", -50, -4, 10); lab(ctx, S, V(d ? 2 : -2, 3.4, 0), "cool air sinks", "#fff", -50, -4, 10); lab(ctx, S, V(-2, 1.25, 1), d ? "land HOT (34 °C)" : "land COOL (20 °C)", "#ffd27a", -50, 20, 11); lab(ctx, S, V(2, 1.05, 1), d ? "sea cooler (27 °C)" : "sea warmer (25 °C)", "#9fd0ff", -50, 20, 11); }
      else if (o.Tf != null) { lab(ctx, S, V(-2.0, 2.7, 0), "flask " + K.f(o.Tf, 1) + " °C", "#7fe3da", -40, -6, 11); lab(ctx, S, V(-0.6, 0.7, 0.3), "cup " + K.f(o.Tc, 1) + " °C", "#ff8f80", -30, -8, 11); lab(ctx, S, V(-1.45, 1.8, 0.3), "vacuum + silvered walls", "#c9d6ea", 8, 0, 9.5); } },
    hudOpt: (s, c) => (c.m < 2 ? { keep: () => false } : null),
  });

  /* ---------- General gas law: piston cylinder ---------- */
  X.def("General Gas Law — PV/T = constant", {
    cam: [[0.2, 2.1, 6.2], [0.2, 1.6, 0]],
    build(S, s, c, mk, o) { o.gl = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 3.1, 64, 1, true), M.glass()); o.gl.position.set(-0.6, 1.85, 0); o.gl.renderOrder = 3; S.scene.add(o.gl);
      o.heat = X.mesh(new T.CylinderGeometry(0.95, 0.95, 0.2, 64), M.emissive(0xff3a1a, 0.2), S.scene, -0.6, 0.2, 0); X.mesh(new T.CylinderGeometry(0.88, 0.88, 0.05, 64), M.steel(), S.scene, -0.6, 0.32, 0);
      o.pist = X.mesh(new T.CylinderGeometry(0.83, 0.83, 0.16, 64), M.steel(), S.scene, -0.6, 2, 0); o.rod = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.06, M.chrome()); o.mol = mk.particles(70, 0.05, M.plastic(0xff8fc7, 0.25)); o.mz = Array.from({ length: 70 }, (_, i) => (((i * 61) % 100) / 100 - 0.5) * 1.2);
      o.gauge = X.group(S, 1.1, 2.6, 0.2); const cv = document.createElement("canvas"); cv.width = cv.height = 256; const g = cv.getContext("2d"); g.fillStyle = "#f4f1ea"; g.beginPath(); g.arc(128, 128, 128, 0, TAU); g.fill(); g.strokeStyle = g.fillStyle = "#111"; g.font = "bold 22px Arial"; g.textAlign = "center"; for (let i = 0; i <= 8; i++) { const a = -2.36 + (i / 8) * 4.71; g.lineWidth = 4; g.beginPath(); g.moveTo(128 + 112 * Math.sin(a), 128 - 112 * Math.cos(a)); g.lineTo(128 + 92 * Math.sin(a), 128 - 92 * Math.cos(a)); g.stroke(); g.fillText(String(i * 50), 128 + 72 * Math.sin(a), 128 - 72 * Math.cos(a) + 8); } g.fillText("kPa", 128, 190); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
      X.mesh(new T.CylinderGeometry(0.45, 0.45, 0.1, 48), M.chrome(), o.gauge).rotation.x = Math.PI / 2; X.mesh(new T.CircleGeometry(0.4, 48), new T.MeshStandardMaterial({ map: t, roughness: 0.5 }), o.gauge, 0, 0, 0.052); o.nd = new T.Group(); o.nd.position.z = 0.06; o.gauge.add(o.nd); X.mesh(new T.BoxGeometry(0.02, 0.34, 0.01), M.paint(0xd0261c), o.nd, 0, 0.14, 0); mk.tube([[0.65, 2.3, 0.2], [0.3, 2.0, 0.2], [0.25, 1.0, 0.3], [-0.3, 0.9, 0.5]], 0.03, M.matte(0x8a2f1c)); },
    update(S, s, c) { const o = S.objs, Hh = 1.2 * c.V, y0 = 0.36, top = y0 + Hh; o.pist.position.y = top + 0.08; S.setRod(o.rod, V(-0.6, top + 0.16, 0), V(-0.6, 3.9, 0)); const hot = clampv((c.T - 200) / 400, 0, 1); o.heat.material.emissiveIntensity = 0.1 + hot * 1.6;
      (s.p || []).forEach((q, i) => o.mol.set(i, -0.6 + (q.x - 0.5) * 1.5, y0 + 0.05 + q.y * (Hh - 0.1), o.mz[i])); o.mol.instanceMatrix.needsUpdate = true; const Pk = (100 * c.T) / 300 / c.V; o.nd.rotation.z = -(-2.36 + clampv(Pk / 400, 0, 1) * 4.71); o.Pk = Pk; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.Pk == null) return; lab(ctx, S, V(1.1, 2.0, 0.2), K.f(o.Pk, 1) + " kPa", "#7fe3da", -30, 10, 12); lab(ctx, S, V(-0.6, 0.2, 0.95), "heater " + c.T + " K", "#ffb07a", -40, 18, 10); },
  });

  /* ---------- Specific heat capacity ---------- */
  const MET = [["Copper", 390], ["Aluminium", 900], ["Iron", 450], ["Lead", 130]];
  X.def("Specific Heat Capacity — Mixtures & Electrical Method", {
    cam: [[0.2, 2.0, 5.6], [0.1, 1.3, 0]], shift: 165,
    build(S, s, c, mk, o) {
      const g = (o.g = [X.group(S), X.group(S)]); const cal = [new T.Vector2(0.001, 0), new T.Vector2(0.6, 0), new T.Vector2(0.62, 0.02), new T.Vector2(0.62, 1.3), new T.Vector2(0.59, 1.3), new T.Vector2(0.59, 0.04), new T.Vector2(0.001, 0.04)];
      const cm = new T.MeshPhysicalMaterial({ color: 0xc87a4a, metalness: 1, roughness: 0.22, side: T.DoubleSide }); const can = new T.Mesh(new T.LatheGeometry(cal, 64, 0, Math.PI * 1.55), cm); can.castShadow = true; g[0].add(can); X.mesh(new T.CylinderGeometry(0.75, 0.75, 1.36, 48, 1, true, 0, Math.PI * 1.55), M.matte(0x3a3a3a, 0.9), g[0], 0, 0.68, 0).material.side = T.DoubleSide;
      o.w = X.mesh(new T.CylinderGeometry(0.58, 0.58, 1, 48, 1, false, 0, Math.PI * 1.55), M.water(0x4aa8ff), g[0], 0, 0.5, 0); o.blk = X.mesh(new T.CylinderGeometry(0.22, 0.22, 0.4, 32), M.aluminium(), g[0], 0, 1, 0); o.th0 = thermo(g[0], 1.9, "Hg", 0.035); o.th0.position.set(0.32, 0.3, 0.2); o.thread = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.006, M.matte(0xeeeeee)); g[0].add(o.thread);
      const bl = (o.bl = X.mesh(new T.CylinderGeometry(0.55, 0.55, 1.1, 48), M.aluminium(), g[1], 0, 0.75, 0)); void bl; X.mesh(new T.CylinderGeometry(0.66, 0.66, 1.0, 48, 1, true, 0.6, Math.PI * 1.4), M.matte(0x8a6a4a, 1), g[1], 0, 0.75, 0).material.side = T.DoubleSide; X.mesh(new T.BoxGeometry(1.5, 0.2, 1.5), M.matte(0x3a3530, 1), g[1], 0, 0.1, 0);
      X.mesh(new T.CylinderGeometry(0.06, 0.06, 0.9, 16), M.paint(0xc84a2a), g[1], -0.2, 1.5, 0); o.th1 = thermo(g[1], 1.7, "Hg", 0.035); o.th1.position.set(0.22, 1.0, 0); g[1].add(mk.tube([[-0.2, 1.95, 0], [-0.4, 2.3, 0.1], [-1.0, 2.2, 0.3], [-1.3, 1.0, 0.3]], 0.02, M.matte(0xc0302a)));
    },
    update(S, s, c) {
      const o = S.objs, [nm, cm] = MET[c.met]; o.g[0].visible = c.m === 0; o.g[1].visible = c.m === 1; const mt = [M.copper, M.aluminium, M.iron, () => M.matte(0x6d7178, 0.45)][c.met];
      if (X.changed(S, "m" + c.met)) { o.blk.material = mt(); o.bl.material = mt(); }
      if (c.m === 0) { const thf = (c.mm * cm * 100 + (c.mw * 4200 + 0.1 * 390) * 25) / (c.mm * cm + c.mw * 4200 + 0.1 * 390), u = clampv((s.t || 0) / 6, 0, 1), thw = 25 + (thf - 25) * (1 - Math.exp(-4 * u)); const lw = 0.25 + c.mw * 2.2; o.w.scale.y = lw; o.w.position.y = 0.04 + lw / 2;
        const by = Math.max(0.26, 0.26 + (1 - u * 4) * 1.6); o.blk.position.y = by; o.blk.scale.setScalar(0.7 + c.mm * 0.6); S.setRod(o.thread, V(0, by + 0.2, 0), V(0, 3.2, 0)); o.th0.set((thw - 0) / 110); o.thw = thw; }
      else { const t = (s.t || 0) * 20, dth = ((c.P * t) / (c.mm * cm)) * 0.95; o.th1.set((20 + dth) / 110); o.dth = dth; }
    },
    hud(ctx, s, c, S) { const o = S.objs; if (c.m === 0 && o.thw != null) lab(ctx, S, V(0.36, 2.0, 0.2), K.f(o.thw, 1) + " °C", "#e6eef8", 6, 0, 11); else if (o.dth != null) { lab(ctx, S, V(0.22, 2.6, 0), "Δθ = " + K.f(o.dth, 2) + " K", "#ffd27a", 6, 0, 11); lab(ctx, S, V(-0.2, 1.95, 0), "heater " + c.P + " W", "#ff8f80", -80, -6, 10); lab(ctx, S, V(0, 0.2, 0.75), MET[c.met][0] + " block (" + c.mm + " kg), lagged", "#c9d6ea", -80, 24, 10); } },
  });

  /* ---------- Specific latent heat ---------- */
  X.def("Specific Latent Heat — Electrical Method", {
    cam: [[0.2, 2.1, 6.2], [0.1, 1.6, 0]], shift: 145,
    build(S, s, c, mk, o) {
      const g = (o.g = [X.group(S), X.group(S)]); o.fun = [-1.0, 0.8].map((x, i) => { const f = X.group(S, x, 0, 0); g[0].add(f); const cone = new T.Mesh(new T.CylinderGeometry(0.6, 0.08, 1.0, 40, 1, true), M.glass()); cone.position.y = 2.3; cone.renderOrder = 3; f.add(cone); X.mesh(new T.CylinderGeometry(0.05, 0.05, 0.5, 16), M.glass(), f, 0, 1.6, 0);
        const ice = mk.particles(46, 0.1, new T.MeshPhysicalMaterial({ color: 0xf2faff, roughness: 0.15, transparent: true, opacity: 0.9, clearcoat: 1 })); f.add(ice); const r = K.rnd(4 + i); for (let k = 0; k < 46; k++) { const h = r(), rr = 0.1 + h * 0.42, a = r() * TAU; ice.set(k, rr * Math.cos(a) * 0.85, 1.9 + h * 0.8, rr * Math.sin(a) * 0.85, 0.7 + r() * 0.6); } ice.instanceMatrix.needsUpdate = true;
        const bk = mk.beaker(0.35, 0.8, 0.02, 0x4aa8ff); bk.position.set(0, 0.0, 0); f.add(bk); if (i === 0) X.mesh(new T.CylinderGeometry(0.05, 0.05, 1.3, 16), M.paint(0xc84a2a), f, 0, 2.6, 0); const drip = mk.sphere(0.03, M.water(0x6fbfff)); f.add(drip); return { f, bk, drip }; });
      const sp = X.group(S, -0.4, 0, 0); g[1].add(sp); X.mesh(new T.BoxGeometry(1.4, 0.3, 1.1), M.matte(0x2a2f38, 0.5), sp, 0, 0.15, 0); o.lcd = X.screen(sp, 0.9, 0.18, { bg: "#0f1d10", fg: "#7dff9a" }); o.lcd.position.set(0, 0.15, 0.555);
      o.bk2 = mk.beaker(0.5, 1.1, 0.7, 0x4aa8ff); o.bk2.position.set(0, 0.3, 0); sp.add(o.bk2); X.mesh(new T.CylinderGeometry(0.05, 0.05, 1.6, 16), M.paint(0xc84a2a), sp, 0.15, 1.3, 0); o.bub = mk.particles(30, 0.035, M.emissive(0xffffff, 0.6)); sp.add(o.bub);
    },
    update(S, s, c) {
      const o = S.objs, fus = c.m === 0; o.g[0].visible = fus; o.g[1].visible = !fus; const L = fus ? 3.34e5 : 2.26e6, mt = (c.P * c.tm) / L + (fus ? 0.004 : 0), t = S.t || 0;
      if (fus) { [mt, 0.004].forEach((m, i) => { const f = o.fun[i]; f.bk.setLevel(clampv(m * 6, 0.01, 0.75)); f.drip.position.set(0, 1.3 - ((t * (i ? 0.4 : 1.4) + i * 0.3) % 1) * (1.2 - m * 6), 0); }); }
      else { o.lcd.set("−" + K.f(mt * 1000, 1) + " g"); for (let i = 0; i < 30; i++) o.bub.set(i, -0.35 + ((i * 37) % 70) / 100, 0.35 + ((t * 0.9 + i / 30) % 1) * 0.65, ((i * 13) % 50) / 100 - 0.25); o.bub.instanceMatrix.needsUpdate = true; if (Math.random() < 0.15) S.puff(-0.4 + Math.random() * 0.4 - 0.2, 1.45, 0, { color: 0xf0f4f8, n: 2, up: 1.2, speed: 0.3, life: 1.6, size: 0.6, op: 0.35 }); }
      o.mt = mt;
    },
    hud(ctx, s, c, S) { const o = S.objs; if (o.mt == null) return; if (c.m === 0) { lab(ctx, S, V(-1.0, 0.1, 0.4), K.f(o.mt * 1000, 1) + " g melted", "#7fe3da", -40, 24, 10.5); lab(ctx, S, V(0.8, 0.1, 0.4), "4.0 g melted", "#7fe3da", -40, 24, 10.5); lab(ctx, S, V(-1.0, 3.3, 0), "Test (heater ON)", "#c9d6ea", -50, -4, 10); lab(ctx, S, V(0.8, 3.3, 0), "Control (heater OFF)", "#c9d6ea", -60, -4, 10); }
      else lab(ctx, S, V(-0.4, 0.0, 0.6), "balance reading falls as water boils away", "#c9d6ea", -100, 26, 10); },
  });

  /* ---------- Evaporation ---------- */
  X.def("Evaporation — Factors and Cooling Effect", {
    cam: [[-0.6, 2.4, 6.2], [-0.7, 1.2, 0]], shift: 112,
    build(S, s, c, mk, o) { o.dish = X.group(S, -0.5, 0, 0); o.vap = mk.particles(160, 0.04, M.emissive(0x6fb2ff, 0.9));
      const fan = (o.fan = X.group(S, -2.3, 0.9, 0)); X.mesh(new T.CylinderGeometry(0.06, 0.08, 0.9, 12), M.matte(0x30343b), fan, 0, -0.45, 0); X.mesh(new T.TorusGeometry(0.5, 0.03, 8, 40), M.chrome(), fan).rotation.y = Math.PI / 2; o.blades = X.group(S); fan.add(o.blades); for (let k = 0; k < 3; k++) { const b = X.mesh(new T.BoxGeometry(0.02, 0.42, 0.16), M.plastic(0x7fb4ff, 0.3), o.blades, 0, 0, 0); b.geometry.translate(0, 0.21, 0); b.rotation.x = (k * TAU) / 3; } },
    update(S, s, c, dt) { const o = S.objs, R = 0.3 + Math.sqrt(c.A) * 0.07;
      if (X.changed(S, "A" + c.A)) { X.clear(S, [o.bowl, o.wat]); const pr = [new T.Vector2(0.001, 0), new T.Vector2(R, 0), new T.Vector2(R + 0.05, 0.25), new T.Vector2(R + 0.02, 0.25), new T.Vector2(R - 0.03, 0.03), new T.Vector2(0.001, 0.03)]; o.bowl = X.mesh(new T.LatheGeometry(pr, 64), M.glass(0xeef8ff), o.dish); o.bowl.renderOrder = 3; o.wat = X.mesh(new T.CylinderGeometry(R, R - 0.02, 0.17, 64), M.water(0x4aa8ff), o.dish, 0, 0.115, 0); o.wat.renderOrder = 2; }
      (s.p || []).slice(-160).forEach((q, i) => o.vap.set(i, -0.5 + (q.x - 60 - c.A * 0.3) * 0.012, 0.22 + (250 - q.y) * 0.011, ((i * 37) % 100) / 100 * R - R / 2)); for (let i = Math.min(160, (s.p || []).length); i < 160; i++) o.vap.set(i, 0, -5, 0); o.vap.instanceMatrix.needsUpdate = true;
      o.blades.rotation.x += c.w * dt * 3; o.fan.visible = c.w > 0; o.R = R; },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.R) return; const r = S.variant.rate(c), cool = clampv(r * 0.6, 0, 12); H.pill(ctx, 14, 372, "rate ≈ " + K.f(r, 2) + " g/min (relative)", "#7fe3da", 11); H.pill(ctx, 14, 392, "liquid cooled ≈ " + K.f(cool, 1) + " °C below surroundings", "#ffd27a", 10.5); if (c.w > 0) lab(ctx, S, V(-2.3, 1.5, 0), "draught " + c.w + " m/s", "#c9d6ea", -30, -6, 10); },
  });

  /* ---------- SVP and boiling: saucepan on a stove ---------- */
  X.def("Saturated Vapour Pressure & Boiling", {
    cam: [[0.1, 2.0, 4.4], [0, 0.9, 0]], shift: [-185, -60], hudOpt0: { bgAll: 1 },
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(1.6, 0.3, 1.2), M.matte(0x22252b, 0.4), S.scene, 0, 0.15, 0); X.mesh(new T.TorusGeometry(0.3, 0.03, 8, 32), M.iron(), S.scene, 0, 0.36, 0).rotation.x = Math.PI / 2; o.fl = flame(S, 0, 0.3, 0, 1.4);
      const pr = [new T.Vector2(0.001, 0), new T.Vector2(0.55, 0), new T.Vector2(0.57, 0.02), new T.Vector2(0.57, 0.7), new T.Vector2(0.54, 0.7), new T.Vector2(0.54, 0.04), new T.Vector2(0.001, 0.04)]; o.pan = X.mesh(new T.LatheGeometry(pr, 64), M.steel(), S.scene, 0, 0.4, 0); X.mesh(new T.CylinderGeometry(0.035, 0.035, 0.9, 12), M.matte(0x1a1a1a), S.scene, 0.95, 0.95, 0).rotation.z = Math.PI / 2;
      o.w = X.mesh(new T.CylinderGeometry(0.53, 0.53, 0.5, 48), M.water(0x4aa8ff), S.scene, 0, 0.7, 0); o.bub = mk.particles(40, 0.04, M.emissive(0xffffff, 0.6)); },
    update(S, s, c) { const o = S.objs, Pex = [101.3, 88, 50, 200, c.P][c.pl], Tb = S.variant ? (() => { let lo = 0, hi = 200; const ps = (T) => 0.6108 * Math.exp((17.27 * T) / (T + 237.3)); for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; ps(m) < Pex ? (lo = m) : (hi = m); } return (lo + hi) / 2; })() : 100, boil = c.T >= Tb, t = S.t || 0;
      o.bub.visible = boil; if (boil) { for (let i = 0; i < 40; i++) o.bub.set(i, Math.cos(i * 2.4) * 0.4 * ((i % 7) / 7), 0.48 + ((t * 1.3 + i / 40) % 1) * 0.42, Math.sin(i * 2.4) * 0.4 * ((i % 7) / 7)); o.bub.instanceMatrix.needsUpdate = true; if (Math.random() < 0.25) S.puff((Math.random() - 0.5) * 0.6, 1.1, 0, { color: 0xf0f4f8, n: 2, up: 1.2, speed: 0.25, life: 1.8, size: 0.7, op: 0.3 }); } o.boil = boil; o.Tb = Tb; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.Tb == null) return; lab(ctx, S, V(0, 1.4, 0), o.boil ? "boiling at " + K.f(o.Tb, 1) + " °C" : "water " + c.T + " °C — not boiling", o.boil ? "#ffd27a" : "#c9d6ea", -60, -6, 10.5); },
  });

  /* ---------- Wet & dry bulb hygrometer ---------- */
  const wetBulb = (T, RH) => T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) + Math.atan(T + RH) - Math.atan(RH - 1.676331) + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;
  X.def("Wet & Dry Bulb Hygrometer — Dew, Fog and Rain", {
    cam: [[0.2, 1.9, 6.2], [0.0, 1.8, 0]], shift: 172,
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(1.5, 3.3, 0.1), M.wood(), S.scene, 0, 1.85, -0.15); o.dry = thermo(S.scene, 2.5, "Hg", 0.05); o.dry.position.set(-0.35, 0.65, 0); o.wet = thermo(S.scene, 2.5, "Hg", 0.05); o.wet.position.set(0.35, 0.65, 0);
      X.mesh(new T.SphereGeometry(0.11, 24, 16), M.matte(0xf0ead8, 1), S.scene, 0.35, 0.65, 0); mk.tube([[0.35, 0.58, 0], [0.38, 0.4, 0.05], [0.45, 0.3, 0.1]], 0.03, M.matte(0xf0ead8, 1)); o.res = mk.beaker(0.18, 0.28, 0.2, 0x4aa8ff); o.res.position.set(0.5, 0.0, 0.12); },
    update(S, s, c) { const o = S.objs, Tw = wetBulb(c.T, c.rh); o.dry.set(c.T / 45); o.wet.set(Tw / 45); o.Tw = Tw; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.Tw == null) return; lab(ctx, S, V(-0.35, 3.25, 0), K.f(c.T, 1) + " °C", "#e6eef8", -26, -4, 11); lab(ctx, S, V(0.35, 3.25, 0), K.f(o.Tw, 1) + " °C", "#7fe3da", -26, -4, 11); lab(ctx, S, V(-0.35, 0.35, 0.2), "dry bulb", "#c9d6ea", -60, 10, 10); lab(ctx, S, V(0.5, 0.05, 0.3), "wick in water", "#c9d6ea", 6, 14, 10); },
  });
})();
