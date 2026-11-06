/* p3d-mech-b.js — kinetic theory, fluids and weight: photoreal three.js scenes with corrected physics. */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, G = 9.80665, S_ = P.scenes;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const mixc = (a, b, k) => new T.Color(a).lerp(new T.Color(b), Math.max(0, Math.min(1, k)));
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* shared: glass box with steel frame, bottom at y0 */
  function glassBox(S, w, h, d, x, y0, z, op) {
    const g = new T.Group(), m = M.glass(), t = 0.06; if (op != null) m.opacity = op;
    const panes = [[w, t, d, 0, t / 2, 0], [w, h, t, 0, h / 2, d / 2], [w, h, t, 0, h / 2, -d / 2], [t, h, d, w / 2, h / 2, 0], [t, h, d, -w / 2, h / 2, 0]];
    panes.forEach((p) => { const m2 = new T.Mesh(new T.BoxGeometry(p[0], p[1], p[2]), m); m2.position.set(p[3], p[4], p[5]); m2.renderOrder = 3; g.add(m2); });
    const e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w, h, d)), new T.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.55 })); e.position.y = h / 2; g.add(e);
    g.position.set(x, y0, z); S.scene.add(g); return g;
  }
  P.util.glassBox = glassBox;
  function skyDome(top, hor) {
    return new T.Mesh(new T.SphereGeometry(200, 32, 16), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new T.Color(top) }, hor: { value: new T.Color(hor) } },
      vertexShader: "varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}", fragmentShader: "varying vec3 vP;uniform vec3 top;uniform vec3 hor;void main(){float h=clamp(vP.y*1.4+.1,0.,1.);gl_FragColor=vec4(mix(hor,top,pow(h,.6)),1.);}" }));
  }
  function noiseTex(base, var_, size = 256, rep = 8, blotch) {
    const c = P.util.cv(size, size), g = c.getContext("2d"); g.fillStyle = base; g.fillRect(0, 0, size, size);
    for (let i = 0; i < (blotch || 700); i++) { const x = rnd(0, size), y = rnd(0, size), r = rnd(1, 10), l = rnd(-var_, var_); g.fillStyle = `rgba(${l > 0 ? 255 : 0},${l > 0 ? 255 : 0},${l > 0 ? 255 : 0},${Math.abs(l) / 255 * 0.8})`; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    return P.util.tex(c, [rep, rep]);
  }
  function bandsTex() {
    const c = P.util.cv(512, 512), g = c.getContext("2d"); const cols = ["#c98a4a", "#e6c08a", "#a8693a", "#f0d6a8", "#b87b46", "#d9a36a"];
    for (let y = 0; y < 512; y += 16) { g.fillStyle = cols[(y / 16) % cols.length | 0]; g.fillRect(0, y, 512, 16); }
    for (let i = 0; i < 900; i++) { g.strokeStyle = `rgba(255,${200 + Math.random() * 50 | 0},150,${Math.random() * 0.12})`; g.lineWidth = rnd(1, 4); g.beginPath(); const y = rnd(0, 512), x = rnd(0, 512); g.moveTo(x, y); g.bezierCurveTo(x + 40, y - 8, x + 90, y + 8, x + 140, y); g.stroke(); }
    return P.util.tex(c, [6, 6]);
  }

  /* ================= STATES OF MATTER ================= */
  const NP = 48;
  S_["States of Matter"] = {
    env: "lab", envOpts: { w: 16, d: 10 }, cam: [[0, 3.8, 11.5], [0, 3.1, 0]], fov: 36, sub: 2,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.box(7.4, 0.3, 7.4, M.matte(0x1d2026, 0.5), 0, 0.15, 0); o.coil = mk.box(6.6, 0.06, 6.6, new T.MeshStandardMaterial({ color: 0x331a10, emissive: 0xff5a1a, emissiveIntensity: 0.2, roughness: 0.6 }), 0, 0.31, 0);
      o.glass = glassBox(S, 6, 6.2, 6, 0, 0.34, 0, 0.1); o.p = mk.particles(NP, 0.24, M.plastic(0x5bb6ff, 0.18)); o.light = new T.PointLight(0xff7a3a, 0, 14, 1.6); o.light.position.set(0, 0.7, 0); S.scene.add(o.light);
    },
    reset(s, c) { s.ph = -1; s.t = 0; s.pos = []; s.vel = []; s.hx = []; s.phs = []; s.fr = []; for (let i = 0; i < NP; i++) { s.pos.push(V3()); s.vel.push(V3()); s.hx.push(V3()); s.phs.push(V3(rnd(0, TAU), rnd(0, TAU), rnd(0, TAU))); s.fr.push(rnd(7, 13)); } },
    step(s, c, dt) {
      if (!s.pos) P.scenes["States of Matter"].reset(s, c); s.t += dt; const sp = Math.sqrt(c.temp / 300), X = 2.7, Y0 = 0.62, Y1 = 6.4;
      if (s.ph !== c.phase) { s.ph = c.phase; for (let i = 0; i < NP; i++) { const ix = i % 4, iz = ((i / 4) | 0) % 4, iy = (i / 16) | 0; s.hx[i].set(-1.45 + ix * 0.97, Y0 + 0.3 + iy * 0.97, -1.45 + iz * 0.97);
        if (c.phase === 0) s.pos[i].copy(s.hx[i]); else if (c.phase === 1) { s.pos[i].set(rnd(-X, X), rnd(Y0, Y0 + 2.6), rnd(-X, X)); s.vel[i].set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).setLength(1.5 * sp); } else { s.pos[i].set(rnd(-X, X), rnd(Y0, Y1), rnd(-X, X)); s.vel[i].set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).setLength(3.4 * sp); } } }
      if (c.phase === 0) { const A = 0.075 * sp; for (let i = 0; i < NP; i++) { const p = s.pos[i], h = s.hx[i], w = s.fr[i], f = s.phs[i]; p.set(h.x + A * Math.sin(w * s.t + f.x), h.y + A * Math.sin(w * 1.13 * s.t + f.y), h.z + A * Math.sin(w * 0.91 * s.t + f.z)); } return; }
      const top = c.phase === 1 ? Y0 + 2.7 : Y1, v0 = (c.phase === 1 ? 1.5 : 3.4) * sp;
      for (let i = 0; i < NP; i++) {
        const p = s.pos[i], v = s.vel[i]; p.addScaledVector(v, dt);
        if (p.x > X) { p.x = X; v.x *= -1; } if (p.x < -X) { p.x = -X; v.x *= -1; } if (p.z > X) { p.z = X; v.z *= -1; } if (p.z < -X) { p.z = -X; v.z *= -1; } if (p.y < Y0) { p.y = Y0; v.y *= -1; } if (p.y > top) { p.y = top; v.y *= -1; }
        if (c.phase === 1) for (let j = i + 1; j < NP; j++) { const q = s.pos[j], d = p.distanceTo(q); if (d < 0.55 && d > 1e-4) { const n = p.clone().sub(q).multiplyScalar(1 / d), push = (0.55 - d) * 0.5; p.addScaledVector(n, push); q.addScaledVector(n, -push); const vn = v.dot(n) - s.vel[j].dot(n); if (vn < 0) { v.addScaledVector(n, -vn * 0.5); s.vel[j].addScaledVector(n, vn * 0.5); } } }
        v.setLength(v0 * (0.6 + 0.8 * ((i * 37) % 10) / 10 + 0.0) * 1.0 * (0.9 + 0.2 * Math.sin(s.t + i)));
      }
    },
    update(S, s, c) {
      const o = S.objs; if (!s.pos) return; const k = (c.temp - 100) / 800; o.p.material.color.copy(mixc(0x4aa8ff, 0xff4a2e, k)); for (let i = 0; i < NP; i++) o.p.set(i, s.pos[i].x, s.pos[i].y, s.pos[i].z); o.p.instanceMatrix.needsUpdate = true;
      o.coil.material.emissiveIntensity = 0.15 + k * 3.2; o.light.intensity = k * 26; o.glass.visible = true; S.aim([0, 3.3, 0], 15.5, 0.18, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const kB = 1.380649e-23, vr = Math.sqrt((3 * kB * c.temp) / 4.65e-26), ke = 1.5 * kB * c.temp;
      H.pill(ctx, 14, 26, ["SOLID: particles vibrate about fixed positions in a lattice", "LIQUID: particles touch but slide past each other", "GAS: particles far apart, moving fast and randomly"][c.phase], "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `T = ${c.temp} K    average KE = 3/2·kT = ${(ke * 1e21).toFixed(2)} ×10⁻²¹ J`, "#cfe0ff", 10.5); H.pill(ctx, 14, 70, `v_rms = √(3kT/m) ≈ ${f1(vr, 0)} m/s  (nitrogen)    speed ∝ √T`, "#8df0be", 10.5);
    },
  };

  /* ================= MASS & WEIGHT ================= */
  const PL = [{ n: "EARTH", g: 9.8, top: 0x2f6fc2, hor: 0xcfe5f4, ground: 0x4f7d36 }, { n: "MOON", g: 1.6, top: 0x000000, hor: 0x05060a, ground: 0x8a8a8c }, { n: "MARS", g: 3.7, top: 0x9a6a4a, hor: 0xe8b88a, ground: 0xa8512d }, { n: "JUPITER", g: 24.8, top: 0x6a4a30, hor: 0xe3b27a, ground: 0xb98a55 }];
  S_["Mass & Weight"] = {
    env: "void", envOpts: { bg: 0x000000 }, cam: [[3, 2.8, 8], [0, 2.4, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.stage = PL.map((p, i) => {
        const g = new T.Group(); g.add(skyDome(p.top, p.hor));
        const gm = i === 1 ? new T.MeshStandardMaterial({ map: noiseTex("#8a8a8c", 70, 256, 14, 1500), roughness: 1 }) : i === 0 ? new T.MeshStandardMaterial({ map: noiseTex("#4f7d36", 40, 256, 18, 1500), roughness: 1 }) : i === 2 ? new T.MeshStandardMaterial({ map: noiseTex("#a8512d", 40, 256, 16, 1400), roughness: 1 }) : new T.MeshStandardMaterial({ map: bandsTex(), roughness: 0.9 });
        const gr = new T.Mesh(new T.CircleGeometry(150, 48), gm); gr.rotation.x = -Math.PI / 2; gr.position.y = -0.02; gr.receiveShadow = true; g.add(gr);
        if (i === 1) { const e = new T.Mesh(new T.SphereGeometry(7, 40, 28), new T.MeshStandardMaterial({ map: (() => { const cc = P.util.cv(512, 256), q = cc.getContext("2d"); q.fillStyle = "#1c5aa8"; q.fillRect(0, 0, 512, 256); q.fillStyle = "#3f7d3a"; for (let k = 0; k < 22; k++) { q.beginPath(); q.ellipse(rnd(0, 512), rnd(30, 226), rnd(15, 60), rnd(8, 30), rnd(0, 3), 0, TAU); q.fill(); } q.fillStyle = "rgba(255,255,255,.55)"; for (let k = 0; k < 40; k++) { q.beginPath(); q.ellipse(rnd(0, 512), rnd(0, 256), rnd(20, 70), rnd(3, 9), 0, 0, TAU); q.fill(); } const t = new T.CanvasTexture(cc); t.colorSpace = T.SRGBColorSpace; return t; })(), roughness: 0.7, emissive: 0x08214a, emissiveIntensity: 0.5 })); e.position.set(-34, 24, -70); e.scale.setScalar(2.2); g.add(e); const st = new T.Points(new T.BufferGeometry().setFromPoints(Array.from({ length: 700 }, () => { const u = rnd(0.02, 1), a = rnd(0, TAU), r = Math.sqrt(1 - u * u) * 180; return V3(Math.cos(a) * r, u * 180, Math.sin(a) * r); })), new T.PointsMaterial({ size: 1.6, sizeAttenuation: false, color: 0xffffff, fog: false })); g.add(st); }
        if (i === 3) { const spot = new T.Mesh(new T.SphereGeometry(20, 30, 20), new T.MeshStandardMaterial({ map: bandsTex(), roughness: 0.9, emissive: 0x2a1608, emissiveIntensity: 0.6 })); spot.position.set(60, 28, -150); spot.scale.set(1.1, 1, 0.3); g.add(spot); }
        g.visible = false; S.scene.add(g); return g;
      });
      mk.box(1.6, 0.14, 1.0, M.matte(0x22262d, 0.45), -1.5, 0.07, 0); mk.cyl(0.05, 0.05, 5.4, M.chrome(), -1.95, 2.7, 0); mk.rod(V3(-1.95, 5.3, 0), V3(0.0, 5.3, 0), 0.04, M.chrome()); mk.box(0.2, 0.16, 0.2, M.steel(), -1.95, 5.3, 0);
      mk.cyl(0.16, 0.16, 0.2, M.aluminium(), 0, 5.2, 0);
      const tube = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 1.7, 28, 1, true), M.glass(0xcfe8ff)); tube.position.y = 4.25; S.scene.add(tube); o.tube = tube;
      o.spring = mk.spring(10, 0.085, 0.012, M.steel()); o.spring.position.set(0, 4.25, 0); o.pointer = mk.box(0.3, 0.025, 0.025, M.matte(0xd8362c), 0, 4.2, 0.14); o.hook = mk.torus(0.07, 0.014, M.steel());
      o.mass = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.6, 36), M.brass()); o.mass.castShadow = true; S.scene.add(o.mass); o.cap = mk.cyl(0.15, 0.15, 0.1, M.steel());
      o.rodM = mk.rod(V3(0, 3, 0), V3(0, 2, 0), 0.02, M.steel(), 8); o.sig = -1;
    },
    reset(s, c) { s.x = 0.45; s.vx = 0; },
    step(s, c, dt) {
      const g = PL[c.planet].g, W = c.mass * g, eq = 0.45 + 1.7 * Math.sqrt(W / 2480), w0 = 7.5, z = 0.13, n = 4, h = dt / n; if (s.x === undefined) { s.x = 0.45; s.vx = 0; }
      for (let i = 0; i < n; i++) { const a = -w0 * w0 * (s.x - eq) - 2 * z * w0 * s.vx; s.vx += a * h; s.x += s.vx * h; } s.eq = eq;
    },
    update(S, s, c) {
      const o = S.objs; if (s.x === undefined) return; if (o.sig !== c.planet) { o.sig = c.planet; o.stage.forEach((g, i) => (g.visible = i === c.planet)); const p = PL[c.planet]; S.scene.background.set(p.hor); if (S.sunLight) S.sunLight.intensity = c.planet === 1 ? 3.6 : 2.6; S.scene.environmentIntensity = c.planet === 1 ? 0.12 : 0.5; }
      const ya = 5.05, L = Math.max(0.25, s.x), yh = ya - L, mr = 0.3 + 0.1 * Math.cbrt(c.mass);
      o.spring.position.set(0, yh, 0); o.spring.scale.y = L; o.hook.position.set(0, yh - 0.08, 0); o.pointer.position.set(0, yh, 0.15);
      o.cap.position.set(0, yh - 0.2, 0); o.mass.scale.set(mr / 0.4, mr / 0.4, mr / 0.4); o.mass.position.set(0, yh - 0.35 - mr * 0.8, 0); S.setRod(o.rodM, V3(0, yh - 0.1, 0), V3(0, yh - 0.35 - mr * 0.1, 0));
      S.aim([0, 3.5, 0], 11.5, 0.38, 0.14);
    },
    overlay(ctx, s, c, w, h, S) {
      const p = PL[c.planet], W = c.mass * p.g; H.pill(ctx, 14, 26, `${p.n}    g = ${p.g} m/s²`, "#ffd27a", 11.5); H.pill(ctx, 14, 48, `weight W = mg = ${c.mass} × ${p.g} = ${f1(W, 1)} N`, "#8df0be", 11); H.pill(ctx, 14, 70, `mass = ${c.mass} kg  (the same everywhere)`, "#cfe0ff", 10.5);
      const q = S.proj(V3(0.9, 5.05 - Math.max(0.25, s.x) - 0.5, 0)); H.pill(ctx, q.x + 6, q.y, `${f1(W, 0)} N`, "#ffe8b0", 11.5);
    },
  };

  /* ================= PRESSURE & FLOTATION ================= */
  const UM = 2, WH = 6.4, WY = 0.1 + WH;                       // 2 world-units per metre, water surface y
  S_["Pressure & Flotation"] = {
    env: "tank", envOpts: { w: 17, d: 9 }, cam: [[2, 4.6, 14], [0, 3.6, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.tank = glassBox(S, 8.4, 7.6, 4.4, 0, 0.05, 0, 0.07);
      o.water = new T.Mesh(new T.BoxGeometry(8.24, WH, 4.24), (() => { const m = M.water(0x1f86c8); m.opacity = 0.5; m.envMapIntensity = 0.5; m.clearcoat = 0; return m; })()); o.water.position.set(0, 0.1 + WH / 2, 0); o.water.renderOrder = 2; S.scene.add(o.water);
      o.surf = new T.Mesh(new T.PlaneGeometry(8.24, 4.24, 40, 20), new T.MeshPhysicalMaterial({ color: 0x4aa6e0, transparent: true, opacity: 0.22, roughness: 0.02, clearcoat: 1, envMapIntensity: 0.9, depthWrite: false })); o.surf.rotation.x = -Math.PI / 2; o.surf.position.y = WY + 0.005; o.surf.renderOrder = 4; S.scene.add(o.surf);
      mk.rod(V3(-2.6, 8.6, 0), V3(-2.6, WY + 0.4, 0), 0.04, M.chrome()); mk.box(1.6, 0.1, 0.2, M.steel(), -2.6, 8.6, 0).scale.x = 1;
      o.sensor = mk.cyl(0.26, 0.26, 0.5, M.steel(), -2.6, 4, 0); o.mem = mk.cyl(0.2, 0.2, 0.04, M.brass(), -2.6, 4, 0); o.stem = mk.rod(V3(-2.6, 4.2, 0), V3(-2.6, 8, 0), 0.05, M.chrome(), 10);
      o.aU = mk.arrow(0xffd27a, 0.03, 0.12); o.aD = mk.arrow(0xffd27a, 0.03, 0.12); o.aL = mk.arrow(0xffd27a, 0.03, 0.12); o.aR = mk.arrow(0xffd27a, 0.03, 0.12);
      o.obj = mk.box(1.4, 1.4, 1.4, M.wood(), 1.9, 8, 0); o.bu = mk.arrow(0x6ee7a8, 0.05, 0.18); o.wt = mk.arrow(0xff5a5a, 0.05, 0.18); o.sig = ""; o.ripPos = o.surf.geometry.attributes.position;
    },
    reset(s, c) { s.y = WY + 3.2; s.v = 0; s.rip = 0; s.entered = false; s.sig = `${c.density}|${c.objDensity}`; s.t = 0; },
    step(s, c, dt) {
      if (s.y === undefined || s.sig !== `${c.density}|${c.objDensity}`) P.scenes["Pressure & Flotation"].reset(s, c);
      const side = 1.4, A = side, n = 4, h = dt / n; s.t += dt; s.rip = (s.rip || 0) * Math.pow(0.35, dt);
      for (let i = 0; i < n; i++) {
        const bot = s.y - side / 2, sub = Math.max(0, Math.min(side, WY - bot)), frac = sub / side, ac = G * ((c.density * frac) / c.objDensity - 1) * UM, drag = (sub > 0 ? 3.2 : 0.0) * s.v + (sub > 0 ? 0.55 * Math.abs(s.v) * s.v : 0);
        s.v += (ac - drag) * h; s.y += s.v * h; if (!s.entered && bot < WY && s.v < 0) { s.entered = true; s.rip = Math.min(1, Math.abs(s.v) / 9); s.splash = Math.abs(s.v); }
        if (s.y - side / 2 < 0.1) { s.y = 0.1 + side / 2; s.v = 0; }
      }
    },
    update(S, s, c, dt) {
      const o = S.objs; if (s.y === undefined) return; o.obj.position.y = s.y; const sd = Math.min(3, Math.max(0, c.depth)), ys = WY - sd * UM - 0.15; o.sensor.position.y = ys; o.mem.position.y = ys - 0.27; S.setRod(o.stem, V3(-2.6, ys + 0.25, 0), V3(-2.6, 8.4, 0));
      const P_ = c.density * G * sd, k = 0.00004 * P_ + 0.18, ox = -2.6; S.setArrow(o.aU, V3(ox, ys + 0.25 + k + 0.15, 0), V3(0, -k, 0), 1); S.setArrow(o.aD, V3(ox, ys - 0.25 - k - 0.15, 0), V3(0, k, 0), 1); S.setArrow(o.aL, V3(ox - 0.26 - k - 0.15, ys, 0), V3(k, 0, 0), 1); S.setArrow(o.aR, V3(ox + 0.26 + k + 0.15, ys, 0), V3(-k, 0, 0), 1);
      const side = 1.4, sub = Math.max(0, Math.min(side, WY - (s.y - side / 2))), W = c.objDensity * 0.343 * G, Fb = c.density * (0.343 * (sub / side)) * G;
      S.setArrow(o.bu, V3(2.9, s.y, 0.8), V3(0, Fb * 0.0007, 0), 1); S.setArrow(o.wt, V3(2.9, s.y, 0.8), V3(0, -W * 0.0007, 0), 1);
      if (s.splash) { S.puff(1.9, WY + 0.2, 0, { n: 14, color: 0xcdeaff, size: 0.35, speed: 2.4, life: 0.8, op: 0.8, up: 3 }); s.splash = 0; }
      const pos = o.ripPos, rp = s.rip || 0, tt = S.t; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) - 1.9, z = -pos.getY(i), r = Math.hypot(x, z); pos.setZ(i, rp * 0.2 * Math.exp(-0.22 * r) * Math.sin(3.2 * r - 7 * tt) + Math.sin(tt * 0.8 + pos.getX(i) * 0.6) * 0.012); } pos.needsUpdate = true; o.surf.geometry.computeVertexNormals();
      S.aim([0, 3.7, 0], 17.5, 0.16, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.y === undefined) return; const sd = Math.min(3, Math.max(0, c.depth)), Pa = c.density * G * sd, floats = c.objDensity < c.density, sub = Math.max(0, Math.min(1.4, WY - (s.y - 0.7))) / 1.4;
      H.pill(ctx, 14, 26, `P = ρgh = ${c.density} × 9.8 × ${f1(sd, 1)} = ${f1(Pa, 0)} Pa`, "#ffd27a", 11); H.pill(ctx, 14, 48, "pressure acts equally in all directions at a given depth", "#cfe0ff", 10);
      H.pill(ctx, 14, 70, floats ? `object floats: ρ_obj < ρ_fluid → ${f1((c.objDensity / c.density) * 100, 0)}% submerged` : "object sinks: ρ_obj > ρ_fluid → upthrust < weight", floats ? "#8df0be" : "#ff9d8a", 10.5);
      for (let m = 0; m <= 3; m += 0.5) { const q = S.proj(V3(-4.3, WY - m * UM, 2.2)); H.pill(ctx, q.x - 4, q.y + 4, `${m} m`, "#fff", 9, "right"); }
      const q = S.proj(V3(2.9, s.y, 0.8)); H.pill(ctx, q.x + 10, q.y - 6, `W = ${f1(c.objDensity * 0.343 * G, 0)} N ↓`, "#ffb0b0", 9.5); H.pill(ctx, q.x + 10, q.y - 28, `Upthrust = ${f1(c.density * 0.343 * sub * G, 0)} N ↑`, "#8df0be", 9.5);
    },
  };

  /* ================= HYDRAULIC PRESS ================= */
  S_["Hydraulic Press (Pascal's Principle)"] = {
    env: "lab", envOpts: { w: 16, d: 9 }, cam: [[0, 4.6, 11], [0, 2.5, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.base = mk.box(11, 0.5, 2.6, M.matte(0x22262d, 0.45), 0, 0.25, 0); o.pipe = mk.cyl(0.22, 0.22, 7, new T.MeshPhysicalMaterial({ color: 0xc9201e, roughness: 0.1, clearcoat: 1 }), 0, 0.95, 0); o.pipe.rotation.z = Math.PI / 2;
      o.cl = new T.Group(); o.cr = new T.Group(); S.scene.add(o.cl, o.cr); o.sig = ""; o.fl = null; o.fr = null; o.ps = null; o.pl = null; o.rodS = null; o.load = null;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const mk = S.mk, o = S.objs, k = 0.13, r1 = k * Math.sqrt(c.a1), r2 = k * Math.sqrt(c.a2), sig = `${c.a1}|${c.a2}`;
      if (o.sig !== sig) {
        o.sig = sig; [o.cl, o.cr].forEach((g) => { while (g.children.length) { const m = g.children.pop(); m.geometry && m.geometry.dispose(); } }); const xl = -3.2, xr = 2.6;
        const mkcyl = (g, x, r) => { const gl = new T.Mesh(new T.CylinderGeometry(r + 0.06, r + 0.06, 3.4, 40, 1, true), M.glass()); gl.position.set(x, 2.2, 0); gl.renderOrder = 3; g.add(gl); const fl = new T.Mesh(new T.CylinderGeometry(r, r, 1, 36), new T.MeshPhysicalMaterial({ color: 0xc9201e, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85 })); g.add(fl); return fl; };
        o.fl = mkcyl(o.cl, xl, r1); o.fr = mkcyl(o.cr, xr, r2); o.xl = xl; o.xr = xr; o.r1 = r1; o.r2 = r2;
        if (o.ps) { S.scene.remove(o.ps, o.pl, o.rodS, o.load, o.plate); }
        o.ps = mk.cyl(r1, r1, 0.35, M.chrome(), xl, 3, 0); o.rodS = mk.cyl(0.05 + r1 * 0.2, 0.05 + r1 * 0.2, 2.2, M.chrome(), xl, 4.2, 0); o.pl = mk.cyl(r2, r2, 0.35, M.chrome(), xr, 2, 0); o.plate = mk.box(r2 * 2.4, 0.18, 1.8, M.steel(), xr, 2.3, 0); o.load = mk.box(Math.min(1.7, r2 * 1.8), 1.0, 1.0, M.paint(0xe2a21e), xr, 2.9, 0);
        o.cap = mk.cyl(r1 * 1.6 + 0.2, r1 * 1.6 + 0.2, 0.12, M.steel(), xl, 5.4, 0); o.aF1 = mk.arrow(0x6ee7a8, 0.07, 0.22); o.aF2 = mk.arrow(0xff9d5a, 0.07, 0.22);
      }
      const press = 0.5 * (1 - Math.cos(((s.t || 0) % 5) / 5 * TAU)) * (((s.t || 0) % 5) < 4 ? 1 : 0), x1 = 2.6 * Math.sin(Math.min(1, ((s.t || 0) % 5) / 4) * Math.PI), x2 = x1 * (c.a1 / c.a2);
      o.ps.position.y = 3.3 - x1; o.rodS.position.y = 4.5 - x1; o.cap.position.y = 5.65 - x1; o.pl.position.y = 2.0 + x2; o.plate.position.y = 2.3 + x2; o.load.position.y = 2.9 + x2;
      const Y1 = 2.75 - x1, Y2 = 1.83 + x2; o.fl.scale.y = Math.max(0.01, Y1 - 0.7); o.fl.position.set(o.xl, 0.7 + (Y1 - 0.7) / 2, 0); o.fr.scale.y = Math.max(0.01, Y2 - 0.7); o.fr.position.set(o.xr, 0.7 + (Y2 - 0.7) / 2, 0);
      const P = c.f1 / c.a1, f2 = P * c.a2; S.setArrow(o.aF1, V3(o.xl, 6.6 - x1, 0), V3(0, -Math.min(2.3, c.f1 * 0.022), 0), 1); S.setArrow(o.aF2, V3(o.xr + 1.9, 2.9 + x2, 0), V3(0, Math.min(3.2, f2 * 0.0042), 0), 1);
      S.aim([-0.3, 3.0, 0], 14, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const P = c.f1 / c.a1, f2 = P * c.a2, d1 = 2.6 * 10, d2 = d1 * (c.a1 / c.a2);
      H.pill(ctx, 14, 26, `P = F₁/A₁ = ${c.f1}/${c.a1} = ${f1(P, 2)} N/cm²  (same everywhere in the fluid)`, "#ffd27a", 10.5); H.pill(ctx, 14, 48, `F₂ = P × A₂ = ${f1(f2, 0)} N      ×${f1(c.a2 / c.a1, 1)} force multiplier`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, `energy conserved: F₁d₁ = F₂d₂  → big piston moves ${f1(c.a1 / c.a2 * 100, 0)}% as far`, "#cfe0ff", 10);
      const a = S.proj(V3(S.objs.xl, 6.9, 0)), b = S.proj(V3(S.objs.xr + 1.9, 3.4, 0)); H.pill(ctx, a.x, a.y - 4, `F₁ = ${c.f1} N  (A₁ = ${c.a1} cm²)`, "#8df0be", 10, "center"); H.pill(ctx, b.x - 30, b.y - 4, `F₂ = ${f1(f2, 0)} N  (A₂ = ${c.a2} cm²)`, "#ffb27a", 10, "right");
    },
  };

  /* ================= SIMPLE BAROMETER ================= */
  const MM = 0.0046, DISH = 0.9, RHO_HG = 13595;
  S_["Simple Barometer"] = {
    env: "lab", envOpts: { w: 14, d: 8 }, cam: [[1.5, 3.6, 9.5], [0, 3.0, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, hg = new T.MeshPhysicalMaterial({ color: 0xd8dde3, metalness: 1, roughness: 0.04, clearcoat: 1 });
      const dp = [new T.Vector2(0, 0), new T.Vector2(1.3, 0.02), new T.Vector2(1.45, 0.16), new T.Vector2(1.45, 0.42), new T.Vector2(1.6, 0.5), new T.Vector2(1.3, 0.5), new T.Vector2(1.3, 0.1), new T.Vector2(0, 0.1)];
      const dish = new T.Mesh(new T.LatheGeometry(dp, 48), M.glass()); dish.renderOrder = 3; S.scene.add(dish); o.pool = new T.Mesh(new T.CylinderGeometry(1.27, 1.27, 1, 48), hg); o.pool.scale.y = 0.62 - 0.1; o.pool.position.y = 0.1 + 0.26; o.pool.castShadow = true; S.scene.add(o.pool);
      o.tube = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 5.2, 36, 1, true), M.glass()); o.tube.position.y = DISH - 0.1 + 2.6 - 0.0; o.tube.renderOrder = 3; S.scene.add(o.tube); o.cap = mk.sphere(0.265, M.glass()); o.cap.scale.y = 0.6; o.cap.position.y = DISH - 0.1 + 5.2; o.cap.renderOrder = 3;
      o.col = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 1, 32), hg); o.col.castShadow = true; S.scene.add(o.col); mk.rod(V3(-1.2, 0.2, 0.8), V3(-1.2, 5.9, 0.8), 0.05, M.aluminium());
      o.aA = [-0.7, 0, 0.7].map((x) => { const a = mk.arrow(0x58a6ff, 0.05, 0.16); a.userData.x = x; return a; }); o.sig = "";
    },
    reset(s, c) { s.h = c.pressure * 7.5006; s.v = 0; },
    step(s, c, dt) { const tgt = c.pressure * 7.5006; if (s.h === undefined) s.h = tgt; const k = 40, z = 12; s.v += (-k * (s.h - tgt) - z * s.v) * dt; s.h += s.v * dt; },
    update(S, s, c) {
      const o = S.objs; if (s.h === undefined) return; const y0 = DISH - 0.1, h = s.h * MM; o.col.scale.y = Math.max(0.01, h); o.col.position.y = y0 + h / 2; o.tube.position.y = y0 + 2.6;
      const len = 0.011 * c.pressure; o.aA.forEach((a) => S.setArrow(a, V3(a.userData.x, y0 + 0.62 + len + 0.5, 0), V3(0, -len, 0), 1)); S.aim([0, 3.3, 0], 15, 0.22, 0.14);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.h === undefined) return; H.pill(ctx, 14, 26, `p = ρgh  →  h = ${f1(c.pressure * 1000 / (RHO_HG * G) * 1000, 0)} mm of mercury at ${c.pressure} kPa`, "#ffd27a", 10.5); H.pill(ctx, 14, 48, "the space above the mercury is a vacuum (Torricelli)", "#cfe0ff", 10); H.pill(ctx, 14, 70, "● atmospheric pressure pushes down on the mercury pool", "#8ec5ff", 10);
      for (let mm = 0; mm <= 900; mm += 100) { const q = S.proj(V3(-1.2, DISH - 0.1 + mm * MM, 0.8)); H.pill(ctx, q.x - 6, q.y + 4, `${mm}`, "#fff", 9, "right"); }
      const q = S.proj(V3(0.3, DISH - 0.1 + s.h * MM, 0)); H.pill(ctx, q.x + 16, q.y, `${f1(s.h, 0)} mmHg`, "#ffe8b0", 11);
    },
    readouts(s, c) { const h = c.pressure * 7.5006; return [["Mercury height", `${f1(h, 0)} mmHg`], ["Atmospheric pressure", `${c.pressure} kPa`], ["Standard sea-level", "101.3 kPa ≈ 760 mmHg"]]; },
  };

  /* ================= VISCOSITY — TERMINAL VELOCITY ================= */
  const RS = 7800, RF = 1260, UPM = 9, DROP = 0.9;
  function vTerm(c) { const r = c.radius / 1000, eta = c.viscosity; let v = (2 * r * r * (RS - RF) * G) / (9 * eta); for (let i = 0; i < 40; i++) { const Re = (RF * v * 2 * r) / eta, k = 1 + 0.15 * Math.pow(Math.max(Re, 0), 0.687); v = (2 * r * r * (RS - RF) * G) / (9 * eta * k); } return v; }
  S_["Viscosity — Terminal Velocity"] = {
    env: "lab", envOpts: { w: 14, d: 8 }, cam: [[2.6, 5.2, 9.6], [0, 4.8, 0]], fov: 38, sub: 4,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.jar = mk.beaker(1.15, 9.2, 8.5, 0xd89a2a); o.jar.water.material.opacity = 0.62; o.ball = mk.sphere(0.1, M.chrome());
      for (let i = 0; i <= 8; i++) { const t = new T.Mesh(new T.BoxGeometry(0.34, 0.025, 0.02), M.matte(0x111111, 0.5)); t.position.set(0, 0.3 + i * 0.9, 1.19); S.scene.add(t); }
      mk.rod(V3(-2.2, 0, 0), V3(-2.2, 11, 0), 0.05, M.chrome()); mk.rod(V3(-2.2, 10.7, 0), V3(0, 10.7, 0), 0.04, M.chrome()); o.release = mk.cyl(0.13, 0.13, 0.4, M.steel(), 0, 10.5, 0);
    },
    reset(s, c) { s.y = 0.0; s.v = 0; s.t = 0; s.hold = 0.8; s.rest = 0; s.tr = []; s.sig = `${c.radius}|${c.viscosity}`; s.vt = vTerm(c); },
    step(s, c, dt) {
      if (s.y === undefined || s.sig !== `${c.radius}|${c.viscosity}`) P.scenes["Viscosity — Terminal Velocity"].reset(s, c);
      if (s.hold > 0) { s.hold -= dt; return; } if (s.rest > 0) { s.rest -= dt; if (s.rest <= 0) P.scenes["Viscosity — Terminal Velocity"].reset(s, c); return; }
      const r = c.radius / 1000, eta = c.viscosity, m = (4 / 3) * Math.PI * r ** 3 * RS, ge = G * (1 - RF / RS), Re = (RF * s.v * 2 * r) / eta, k = 6 * Math.PI * eta * r * (1 + 0.15 * Math.pow(Re, 0.687));
      s.v = (s.v + dt * ge) / (1 + (dt * k) / m); s.y += s.v * dt; s.t += dt; s.Re = Re; s.tr.push([s.t, s.v]); if (s.tr.length > 400) s.tr.shift();
      if (s.y >= DROP) { s.y = DROP; s.v = 0; s.rest = 1.4; }
    },
    update(S, s, c) {
      const o = S.objs; if (s.y === undefined) return; const vr = 0.05 + c.radius * 0.0105; o.ball.scale.setScalar(vr / 0.1); o.ball.position.set(0, Math.max(0.06 + vr, 8.5 - vr - s.y * UPM), 0);
      S.aim([0, 5.0, 0], 21, 0.3, 0.1);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.y === undefined) return; const vt = s.vt || vTerm(c);
      H.pill(ctx, 14, 26, "at terminal velocity:  weight = upthrust + viscous drag", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `Stokes: v_t = 2r²(ρ_s − ρ_f)g / 9η = ${f1(vt, 3)} m/s`, "#cfe0ff", 10.5); H.pill(ctx, 14, 70, `Reynolds number Re = ${f1(s.Re || 0, 1)}   ${(s.Re || 0) > 1 ? "(inertial drag adds to Stokes)" : "(laminar, Stokes valid)"}`, "#8df0be", 10);
      const ymax = Math.max(vt * 1.25, 0.05); H.graph(ctx, w - 252, 12, 240, 140, { xmin: 0, xmax: Math.max(1, (s.tr.length ? s.tr[s.tr.length - 1][0] : 1) * 1.1), ymin: 0, ymax, xl: "t (s)", yl: "v (m/s)", series: [{ pts: [[0, vt], [1e3, vt]], color: "rgba(255,210,122,.5)", width: 1.2 }, { pts: s.tr, color: "#7fe3da", width: 2.4 }], dot: s.tr.length ? [s.tr[s.tr.length - 1][0], s.v, "#ffd27a"] : null });
      const q = S.proj(V3(1.3, Math.max(0.4, 8.4 - s.y * UPM), 0)); H.pill(ctx, q.x + 8, q.y, `v = ${f1(s.v, 3)} m/s`, "#ffe8b0", 10.5);
    },
    readouts(s, c) { const vt = s.vt || vTerm(c); return [["Current speed", `${f1(s.v || 0, 3)} m/s`], ["Terminal velocity (Stokes)", `${f1(vt, 3)} m/s`], ["Ball radius r", `${c.radius} mm`], ["Fluid viscosity η", `${c.viscosity} Pa·s`], ["Reynolds number", `${f1(s.Re || 0, 2)}`]]; },
  };
})();
