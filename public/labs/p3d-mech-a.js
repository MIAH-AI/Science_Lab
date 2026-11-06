/* p3d-mech-a.js — kinematics, dynamics and collisions as photoreal three.js scenes with corrected physics. */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, G = 9.80665, S_ = P.scenes;
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const mixc = (a, b, k) => new T.Color(a).lerp(new T.Color(b), Math.max(0, Math.min(1, k)));

  /* straight asphalt road with kerbs and distance posts */
  function road(S, x0, x1, tick) {
    const L = x1 - x0, cx = (x0 + x1) / 2, c = P.util.cv(512, 128), g = c.getContext("2d");
    g.fillStyle = "#3b3e44"; g.fillRect(0, 0, 512, 128);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${90 + Math.random() * 60},${90 + Math.random() * 60},${95 + Math.random() * 60},.18)`; g.fillRect(Math.random() * 512, Math.random() * 128, 2, 2); }
    g.fillStyle = "#ece6c4"; g.fillRect(0, 60, 256, 8); g.fillStyle = "#e9e9e9"; g.fillRect(0, 4, 512, 4); g.fillRect(0, 120, 512, 4);
    const t = P.util.tex(c, [L / 10, 1]), rd = new T.Mesh(new T.PlaneGeometry(L, 5), new T.MeshStandardMaterial({ map: t, roughness: 0.9 }));
    rd.rotation.x = -Math.PI / 2; rd.position.set(cx, 0.012, 0); rd.receiveShadow = true; S.scene.add(rd);
    const posts = [], pm = M.matte(0xf3f3f0, 0.5), cap = M.matte(0xd8362c, 0.5);
    for (let x = Math.ceil(x0 / tick) * tick; x <= x1; x += tick) {
      const a = new T.Mesh(new T.BoxGeometry(0.14, 1.2, 0.14), pm), b = new T.Mesh(new T.BoxGeometry(0.15, 0.3, 0.15), cap);
      a.position.set(x, 0.6, 3.3); b.position.set(x, 1.3, 3.3); a.castShadow = true; S.scene.add(a, b); posts.push(x);
    }
    return posts;
  }
  function postLabels(ctx, S, posts, near, unit = " m") { posts.forEach((x) => { if (Math.abs(x - near) < 45) { const q = S.proj(V3(x, 1.7, 3.3)); if (q.z < 1) H.pill(ctx, q.x, q.y, `${x}${unit}`, "#fff", 9.5, "center"); } }); }
  function carPose(car, x, v) { car.position.x = x; car.rotation.y = v < -0.01 ? Math.PI : 0; car.wheels.forEach((w) => (w.rotation.z -= 0)); }
  function spinWheels(car, dx) { car.wheels.forEach((w) => (w.rotation.z -= dx / 0.3)); }

  /* ================= DISTANCE–TIME GRAPH ================= */
  S_["Distance–Time Graph"] = {
    env: "outdoor", envOpts: { shadowArea: 30 }, cam: [[8, 4, 14], [4, 1, 0]], fov: 38,
    build(S, s, c) { const o = S.objs; o.posts = road(S, -30, 320, 20); o.car = S.mk.car(0xd8362c); },
    reset(s, c) { s.t = 0; s.d = 0; s.prev = 0; s.hold = 0; },
    step(s, c, dt) { if (s.hold > 0) { s.hold -= dt; if (s.hold <= 0) { s.t = 0; s.d = 0; s.prev = 0; } return; } s.t += dt; if (s.t >= 10) { s.t = 10; s.hold = 1.0; } s.d = s.t <= 5 ? c.v1 * s.t : c.v1 * 5 + c.v2 * (s.t - 5); },
    update(S, s, c, dt) { const o = S.objs; if (s.d === undefined) return; const dx = s.d - (s.prev || 0); s.prev = s.d; if (dx > 0) spinWheels(o.car, dx); o.car.position.x = s.d; S.aim([s.d + 9, 1.1, 0], 17, 0.5, 0.14); if (S.sunLight) { S.sunLight.target.position.set(s.d, 0, 0); S.sunLight.position.set(s.d - 18, 26, -14); } },
    overlay(ctx, s, c, w, h, S) {
      if (s.d === undefined) return; const D = 5 * c.v1 + 5 * c.v2, o = S.objs; postLabels(ctx, S, o.posts, s.d);
      const pts = [], live = []; for (let t = 0; t <= 10; t += 0.5) { const d = t <= 5 ? c.v1 * t : c.v1 * 5 + c.v2 * (t - 5); pts.push([t, d]); if (t <= s.t + 1e-6) live.push([t, d]); } live.push([s.t, s.d]);
      H.graph(ctx, w - 262, 12, 250, 150, { xmin: 0, xmax: 10, ymin: 0, ymax: Math.max(10, D), xl: "time t (s)", yl: "distance d (m)", series: [{ pts, color: "rgba(255,255,255,.22)", width: 1.5 }, { pts: live, color: "#7fe3da", width: 2.6 }], dot: [s.t, s.d, "#ffd27a"] });
      H.pill(ctx, 14, 26, "speed = gradient of d–t graph  (v = Δd/Δt)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `Stage 1: ${c.v1} m/s (0–5 s)  ·  Stage 2: ${c.v2} m/s (5–10 s)`, "#cfe0ff", 10.5);
      const q = S.proj(V3(s.d, 1.9, 0)); H.pill(ctx, q.x, q.y - 4, `d = ${f1(s.d, 1)} m`, "#ffe8b0", 10.5, "center");
    },
  };

  /* ================= VELOCITY–TIME GRAPH (SUVAT) ================= */
  S_["Velocity–Time Graph (SUVAT)"] = {
    env: "outdoor", envOpts: { shadowArea: 30 }, cam: [[8, 4, 14], [4, 1, 0]], fov: 38,
    build(S, s, c) { const o = S.objs; o.posts = road(S, -300, 340, 20); o.car = S.mk.car(0x2d6cdf); },
    reset(s, c) { s.t = 0; s.hold = 0; s.prev = 0; s.sig = ""; },
    step(s, c, dt) {
      const sig = c.u + "|" + c.a; if (s.sig !== sig) { s.sig = sig; s.t = 0; s.prev = 0; s.hold = 0.4; s.wrapNext = false; }
      if (s.hold > 0) { s.hold -= dt; if (s.hold <= 0 && s.wrapNext) { s.t = 0; s.prev = 0; s.wrapNext = false; } return; }
      s.t += dt; if (s.t >= 6) { s.t = 6; s.hold = 1.0; s.wrapNext = true; }
    },
    update(S, s, c, dt) {
      const o = S.objs; if (s.t === undefined) return; const x = c.u * s.t + 0.5 * c.a * s.t * s.t, v = c.u + c.a * s.t;
      const dx = x - (s.prev || 0); s.prev = x; spinWheels(o.car, dx); o.car.position.x = x; o.car.rotation.y = v < -0.05 ? Math.PI : 0;
      S.aim([x + (v >= 0 ? 8 : -8), 1.1, 0], 17, 0.5, 0.14); if (S.sunLight) { S.sunLight.target.position.set(x, 0, 0); S.sunLight.position.set(x - 18, 26, -14); }
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.t === undefined) return; const o = S.objs, x = c.u * s.t + 0.5 * c.a * s.t * s.t, v = c.u + c.a * s.t; postLabels(ctx, S, o.posts, x);
      const v0 = c.u, v6 = c.u + 6 * c.a, ymin = Math.min(0, v0, v6) - 1, ymax = Math.max(0, v0, v6) + 1, line = [[0, v0], [6, v6]], live = [[0, v0], [s.t, v]];
      H.graph(ctx, w - 262, 12, 250, 150, { xmin: 0, xmax: 6, ymin, ymax, xl: "time t (s)", yl: "velocity v (m/s)", series: [{ pts: line, color: "rgba(255,255,255,.22)", width: 1.5 }, { pts: live, color: "#7fe3da", width: 2.6 }], fill: { pts: live, color: "rgba(127,227,218,.22)" }, dot: [s.t, v, "#ffd27a"] });
      H.pill(ctx, 14, 26, "gradient = acceleration", "#ffd27a", 10.5); H.pill(ctx, 14, 48, "area under graph = displacement", "#ffd27a", 10.5); H.pill(ctx, 14, 70, "v = u + at   s = ut + ½at²   v² = u² + 2as", "#cfe0ff", 10);
      const q = S.proj(V3(x, 1.9, 0)); H.pill(ctx, q.x, q.y - 4, `v = ${f1(v, 1)} m/s`, "#ffe8b0", 10.5, "center");
    },
  };

  /* ================= POSITION & DISPLACEMENT ================= */
  const PS = 0.55;                                                 // metres → world units on the sheet
  S_["Position & Displacement"] = {
    env: "lab", envOpts: { w: 14, d: 10 }, cam: [[0, 7.6, 6.2], [0, 0, 0.1]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, can = P.util.cv(512, 400), g = can.getContext("2d"); g.fillStyle = "#f6f7f2"; g.fillRect(0, 0, 512, 400);
      for (let i = 0; i <= 16; i++) { const x = (i / 16) * 512; g.strokeStyle = i === 8 ? "#3a3a3a" : i % 4 === 0 ? "rgba(200,70,60,.55)" : "rgba(210,120,110,.28)"; g.lineWidth = i === 8 ? 3 : 1.4; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 400); g.stroke(); }
      for (let j = 0; j <= 12; j++) { const y = (j / 12) * 400; g.strokeStyle = j === 6 ? "#3a3a3a" : j % 4 === 0 ? "rgba(200,70,60,.55)" : "rgba(210,120,110,.28)"; g.lineWidth = j === 6 ? 3 : 1.4; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
      const sheet = new T.Mesh(new T.BoxGeometry(16 * PS, 0.05, 12 * PS), new T.MeshStandardMaterial({ map: new T.CanvasTexture(can), roughness: 0.85 })); sheet.material.map.colorSpace = T.SRGBColorSpace; sheet.position.y = 0.025; sheet.receiveShadow = true; S.scene.add(sheet);
      o.pin = mk.cone(0.12, 0.35, M.paint(0xe0382d), 0, 0.2, 0); o.pin.rotation.x = Math.PI;
      o.walker = new T.Group(); const body = new T.Mesh(new T.CapsuleGeometry(0.13, 0.28, 6, 16), M.paint(0x2d6cdf)), head = new T.Mesh(new T.SphereGeometry(0.11, 20, 16), M.matte(0xe9b98e, 0.6)); body.position.y = 0.38; head.position.y = 0.7; body.castShadow = head.castShadow = true; o.walker.add(body, head); S.scene.add(o.walker);
      o.target = new T.Mesh(new T.RingGeometry(0.16, 0.22, 32), M.glow(0xffc857, 0.95)); o.target.rotation.x = -Math.PI / 2; o.target.position.y = 0.06; S.scene.add(o.target);
      o.disp = mk.rod(V3(0, 0.07, 0), V3(1, 0.07, 0), 0.03, M.emissive(0xff4d4d, 1.4)); o.dots = mk.particles(40, 0.045, M.emissive(0xffc857, 1.2));
    },
    reset(s, c) { s.trail = [[0, 0]]; s.last = { x: c.x, y: c.y }; s.px = 0; s.py = 0; s.walked = 0; },
    step(s, c, dt) {
      if (s.px === undefined) P.scenes["Position & Displacement"].reset(s, c);
      if (c.path === 1 && (s.last.x !== c.x || s.last.y !== c.y)) { s.trail.push([c.x, c.y]); s.last = { x: c.x, y: c.y }; if (s.trail.length > 12) s.trail.shift(); }
      const tx = c.x, ty = c.y, dx = tx - s.px, dy = ty - s.py, d = Math.hypot(dx, dy), step = Math.min(d, 3.2 * dt); if (d > 1e-6) { s.px += (dx / d) * step; s.py += (dy / d) * step; s.walked += step; s.head = Math.atan2(dx, dy); }
    },
    update(S, s, c) {
      const o = S.objs; if (s.px === undefined) return; const X = (x) => x * PS, Z = (y) => -y * PS;
      o.walker.position.set(X(s.px), 0.05, Z(s.py)); o.walker.rotation.y = (s.head || 0); o.target.position.x = X(c.x); o.target.position.z = Z(c.y);
      o.target.visible = true; S.setRod(o.disp, V3(0, 0.08, 0), V3(X(c.x), 0.08, Z(c.y)));
      const tr = s.trail, n = Math.min(40, (tr.length - 1) * 5 + 1); o.dots.count = n; let k = 0;
      for (let i = 0; i < tr.length - 1 && k < 40; i++) for (let j = 0; j < 5 && k < 40; j++) { const t = j / 5; o.dots.set(k++, X(tr[i][0] + (tr[i + 1][0] - tr[i][0]) * t), 0.07, Z(tr[i][1] + (tr[i + 1][1] - tr[i][1]) * t)); } o.dots.count = k; o.dots.instanceMatrix.needsUpdate = true;
    },
    overlay(ctx, s, c, w, h, S) {
      const r = Math.hypot(c.x, c.y), bearing = (deg(Math.atan2(c.x, c.y)) + 360) % 360;
      H.at(ctx, S, V3(c.x * PS, 0.4, -c.y * PS), `(${c.x}, ${c.y})`, "#ffd27a", 12, -14, 12);
      H.at(ctx, S, V3(c.x * PS * 0.5, 0.2, -c.y * PS * 0.5), `r = ${f1(r, 2)} units`, "#ff8f8f", -10, 20, 11);
      H.pill(ctx, 14, 26, `displacement = straight-line distance O→P = √(x²+y²) = ${f1(r, 2)} units`, "#ffd27a", 10.5);
      H.pill(ctx, 14, 48, `bearing from O = ${f1(bearing, 0)}°   ·   path walked = ${f1(s.walked || 0, 1)} units`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, "● displacement (vector)   ● path walked (distance)", "#ff8f8f", 10);
    },
  };

  /* ================= BEARING & DIRECTION ================= */
  function compassTex() {
    const c = P.util.cv(1024, 1024), g = c.getContext("2d"), cx = 512; g.fillStyle = "#f2f0e6"; g.beginPath(); g.arc(cx, cx, 505, 0, TAU); g.fill();
    g.strokeStyle = "#232323"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cx, 500, 0, TAU); g.stroke(); g.fillStyle = "#1e1e1e"; g.textAlign = "center"; g.textBaseline = "middle";
    for (let d = 0; d < 360; d += 5) { const a = rad(d), big = d % 30 === 0, r0 = big ? 430 : d % 10 === 0 ? 455 : 475; g.lineWidth = big ? 4 : 2; g.beginPath(); g.moveTo(cx + 495 * Math.sin(a), cx - 495 * Math.cos(a)); g.lineTo(cx + r0 * Math.sin(a), cx - r0 * Math.cos(a)); g.stroke(); if (big) { g.font = "bold 34px sans-serif"; g.fillText(String(d).padStart(3, "0"), cx + 395 * Math.sin(a), cx - 395 * Math.cos(a)); } }
    g.font = "bold 74px serif"; [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach(([t, d]) => { const a = rad(d); g.fillStyle = t === "N" ? "#c8281e" : "#1e1e1e"; g.fillText(t, cx + 320 * Math.sin(a), cx - 320 * Math.cos(a)); });
    g.fillStyle = "#c8281e"; g.beginPath(); g.moveTo(cx, cx - 255); g.lineTo(cx - 22, cx - 150); g.lineTo(cx + 22, cx - 150); g.fill();
    for (let r = 100; r <= 300; r += 100) { g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cx, r, 0, TAU); g.stroke(); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  S_["Bearing & Direction"] = {
    env: "lab", envOpts: { w: 14, d: 10 }, cam: [[0, 6.6, 5.6], [0, 0, 0.2]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, R = 3.5; const disc = new T.Mesh(new T.CylinderGeometry(R, R, 0.1, 96), [M.matte(0x222, 0.4), new T.MeshStandardMaterial({ map: compassTex(), roughness: 0.6 }), M.matte(0x222, 0.4)]); disc.position.y = 0.05; disc.rotation.y = Math.PI / 2; disc.receiveShadow = true; S.scene.add(disc);
      o.arrow = mk.arrow(0xffc857, 0.06, 0.2); o.boat = new T.Group();
      const hull = new T.Mesh(new T.CylinderGeometry(0.2, 0.12, 0.7, 4, 1), M.paint(0x2d6cdf)); hull.rotation.z = Math.PI / 2; hull.rotation.x = Math.PI / 4; hull.scale.set(1, 1, 0.55); hull.position.y = 0.2; hull.castShadow = true;
      const sail = new T.Mesh(new T.PlaneGeometry(0.4, 0.5), new T.MeshStandardMaterial({ color: 0xffffff, side: T.DoubleSide })); sail.position.set(0, 0.55, 0); sail.rotation.y = Math.PI / 2; sail.castShadow = true;
      const mast = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.6, 8), M.matte(0x444444)); mast.position.y = 0.5; o.boat.add(hull, sail, mast); o.boat.position.y = 0.1; S.scene.add(o.boat);
      o.arc = null; o.sig = "";
    },
    reset(s, c) { s.k = 0; },
    step(s, c, dt) { s.k = ((s.k || 0) + dt / 4) % 1.3; },
    update(S, s, c) {
      const o = S.objs, b = rad(c.bearing), dist = c.dist * 0.33, dir = V3(Math.sin(b), 0, -Math.cos(b)), end = dir.clone().multiplyScalar(dist);
      S.setArrow(o.arrow, V3(0, 0.12, 0), end.clone().setY(0), 1); o.arrow.position.y = 0.12;
      const k = Math.min(1, s.k || 0); o.boat.position.set(end.x * k, 0.12, end.z * k); o.boat.rotation.y = Math.atan2(dir.x, dir.z) - Math.PI / 2;
      if (o.sig !== String(c.bearing)) { o.sig = String(c.bearing); if (o.arc) { S.scene.remove(o.arc); o.arc.geometry.dispose(); } const pts = []; const n = Math.max(2, Math.round(c.bearing / 4)); for (let i = 0; i <= n; i++) { const a = (b * i) / n; pts.push(V3(1.15 * Math.sin(a), 0.14, -1.15 * Math.cos(a))); } if (c.bearing > 1) { o.arc = S.mk.tube(pts, 0.035, M.emissive(0xffc857, 1.6), 60); o.arc.castShadow = false; } else o.arc = null; }
    },
    overlay(ctx, s, c, w, h, S) {
      const b = rad(c.bearing), dist = c.dist * 0.33; H.at(ctx, S, V3(Math.sin(b) * dist, 0.35, -Math.cos(b) * dist), `${String(c.bearing).padStart(3, "0")}° · ${c.dist} km`, "#ffe8b0", 12, -14, 12.5);
      H.at(ctx, S, V3(1.4 * Math.sin(b / 2), 0.2, -1.4 * Math.cos(b / 2)), `${c.bearing}°`, "#ffd27a", 4, 0, 11);
      H.pill(ctx, 14, 26, "bearing: measured clockwise from NORTH, written with 3 digits", "#ffd27a", 10.5); H.pill(ctx, 14, 48, "● 1 ring = 3 km on the chart", "#cfe0ff", 10);
    },
  };

  /* ================= VECTOR ADDITION ================= */
  const VS = 0.42;
  S_["Vector Addition"] = {
    env: "lab", envOpts: { w: 14, d: 10 }, cam: [[0, 8.4, 5.4], [0.3, 0, 0.3]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, can = P.util.cv(512, 512), g = can.getContext("2d"); g.fillStyle = "#f6f7f2"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i <= 20; i++) { g.strokeStyle = i === 10 ? "#444" : i % 5 === 0 ? "rgba(200,70,60,.5)" : "rgba(210,120,110,.26)"; g.lineWidth = i === 10 ? 2.5 : 1.2; const q = (i / 20) * 512; g.beginPath(); g.moveTo(q, 0); g.lineTo(q, 512); g.moveTo(0, q); g.lineTo(512, q); g.stroke(); }
      const sheet = new T.Mesh(new T.BoxGeometry(10, 0.05, 10), new T.MeshStandardMaterial({ map: new T.CanvasTexture(can), roughness: 0.85 })); sheet.material.map.colorSpace = T.SRGBColorSpace; sheet.position.y = 0.025; sheet.receiveShadow = true; S.scene.add(sheet);
      o.A = mk.arrow(0xff5a5a, 0.05, 0.17); o.B = mk.arrow(0x58a6ff, 0.05, 0.17); o.R = mk.arrow(0x6ee7a8, 0.07, 0.22);
      const dm = M.glow(0xffffff, 0.45); o.d1 = mk.rod(V3(), V3(1, 0, 0), 0.015, dm, 6); o.d2 = mk.rod(V3(), V3(1, 0, 0), 0.015, dm, 6);
      o.puck = mk.cyl(0.26, 0.26, 0.16, M.steel(), 0, 0.13, 0);
    },
    reset(s, c) { s.k = 0; },
    step(s, c, dt) { s.k = ((s.k || 0) + dt * 0.35) % 1.4; },
    update(S, s, c) {
      const o = S.objs, a1 = rad(c.angA), a2 = rad(c.angB), A = V3(Math.cos(a1), 0, -Math.sin(a1)).multiplyScalar(c.magA * VS), B = V3(Math.cos(a2), 0, -Math.sin(a2)).multiplyScalar(c.magB * VS), R = A.clone().add(B), y = 0.1, O = V3(0, y, 0);
      S.setArrow(o.A, O, A, 1); S.setArrow(o.B, O, B, 1); S.setArrow(o.R, O.clone().setY(y + 0.02), R, 1);
      S.setRod(o.d1, A.clone().setY(y), R.clone().setY(y)); S.setRod(o.d2, B.clone().setY(y), R.clone().setY(y));
      const k = Math.min(1, s.k || 0); o.puck.position.set(R.x * k * 0.0, 0.13, R.z * k * 0.0); o.puck.position.set(R.x * k, 0.13, R.z * k);
    },
    overlay(ctx, s, c, w, h, S) {
      const a1 = rad(c.angA), a2 = rad(c.angB), A = V3(Math.cos(a1), 0, -Math.sin(a1)).multiplyScalar(c.magA * VS), B = V3(Math.cos(a2), 0, -Math.sin(a2)).multiplyScalar(c.magB * VS), R = A.clone().add(B);
      const th = rad(c.angB - c.angA), Rm = Math.sqrt(c.magA ** 2 + c.magB ** 2 + 2 * c.magA * c.magB * Math.cos(th)), Rx = c.magA * Math.cos(a1) + c.magB * Math.cos(a2), Ry = c.magA * Math.sin(a1) + c.magB * Math.sin(a2), aR = (deg(Math.atan2(Ry, Rx)) + 360) % 360;
      H.at(ctx, S, A.clone().setY(0.2), `A = ${c.magA}`, "#ff8f8f", 8, -8, 11); H.at(ctx, S, B.clone().setY(0.2), `B = ${c.magB}`, "#8ec5ff", 8, -8, 11); H.at(ctx, S, R.clone().setY(0.3), `R = ${f1(Rm, 2)} @ ${f1(aR, 0)}°`, "#8df0be", 10, -12, 12);
      H.pill(ctx, 14, 26, "R² = A² + B² + 2AB cosθ      tan α = (B sinθ) / (A + B cosθ)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, "parallelogram law: the resultant is the diagonal from the common tail", "#cfe0ff", 10);
    },
  };

  /* ================= TYPES OF MOTION ================= */
  S_["Types of Motion"] = {
    env: "lab", envOpts: { w: 16, d: 10 }, cam: [[0, 5.2, 9], [0, 0.6, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, grp = (n) => { const g = new T.Group(); g.visible = false; S.scene.add(g); o[n] = g; return g; };
      /* 0 rectilinear: toy car on a plank track */
      const g0 = grp("g0"); const plank = new T.Mesh(new T.BoxGeometry(13, 0.1, 1.6), M.matte(0x555a63, 0.7)); plank.position.y = 0.05; plank.receiveShadow = true; g0.add(plank); for (let x = -6; x <= 6; x += 2) { const t = new T.Mesh(new T.BoxGeometry(0.06, 0.02, 1.6), M.matte(0xeeeeee, 0.6)); t.position.set(x, 0.11, 0); g0.add(t); }
      o.car = mk.car(0xe09a2d); o.car.scale.setScalar(0.7); o.car.position.y = 0.1; S.scene.remove(o.car); g0.add(o.car);
      /* 1 circular: toy train on round track */
      const g1 = grp("g1"); const rail = new T.Mesh(new T.TorusGeometry(2.8, 0.06, 10, 80), M.steel()); rail.rotation.x = Math.PI / 2; rail.position.y = 0.1; g1.add(rail); const rail2 = new T.Mesh(new T.TorusGeometry(2.8, 0.2, 6, 80), M.matte(0x7a5a3a, 0.8)); rail2.rotation.x = Math.PI / 2; rail2.position.y = 0.04; rail2.scale.z = 0.2; g1.add(rail2);
      o.train = []; for (let i = 0; i < 3; i++) { const cc = mk.cart(0.9, 0.55, i ? 0x3a7bd5 : 0xd8362c); S.scene.remove(cc); cc.position.y = 0.1; g1.add(cc); o.train.push(cc); }
      /* 2 oscillatory: mass on spring between walls */
      const g2 = grp("g2"); const rail3 = new T.Mesh(new T.BoxGeometry(11, 0.14, 0.7), M.aluminium()); rail3.position.y = 0.07; g2.add(rail3); for (const sx of [-1, 1]) { const wl = new T.Mesh(new T.BoxGeometry(0.3, 1.2, 1.0), M.matte(0x30353f, 0.6)); wl.position.set(sx * 5.65, 0.6, 0); wl.castShadow = true; g2.add(wl); }
      o.osc = mk.cart(1.1, 0.7, 0x2dbf8a); S.scene.remove(o.osc); o.osc.position.y = 0.14; g2.add(o.osc);
      o.sp1 = mk.spring(12, 0.28, 0.035, M.steel()); S.scene.remove(o.sp1); o.sp1.rotation.z = -Math.PI / 2; o.sp1.position.y = 0.5; g2.add(o.sp1); o.sp2 = mk.spring(12, 0.28, 0.035, M.steel()); S.scene.remove(o.sp2); o.sp2.rotation.z = -Math.PI / 2; o.sp2.position.y = 0.5; g2.add(o.sp2);
      /* 3 Brownian: pollen grain among water molecules in a glass cell */
      const g3 = grp("g3"); const cell = new T.Mesh(new T.BoxGeometry(8, 4, 4), M.glass(0x9fd8ff)); cell.position.y = 2.05; cell.material.opacity = 0.14; g3.add(cell);
      o.mol = mk.particles(150, 0.1, M.plastic(0x57b6ff, 0.2)); S.scene.remove(o.mol); g3.add(o.mol); o.grain = mk.sphere(0.42, M.paint(0xf2c230)); S.scene.remove(o.grain); g3.add(o.grain); o.gtrail = mk.particles(160, 0.04, M.glow(0xffe28a, 0.8)); S.scene.remove(o.gtrail); g3.add(o.gtrail);
      o.mp = Array.from({ length: 150 }, () => ({ p: V3((Math.random() - 0.5) * 7.4, 0.15 + Math.random() * 3.8, (Math.random() - 0.5) * 3.6), v: V3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(6) }));
    },
    reset(s, c) { s.t = 0; s.gp = V3(0, 2, 0); s.gv = V3(); s.gt = []; s.tt = 0; },
    step(s, c, dt) {
      s.t += dt; if (c.type !== 3 || !s.gp) return; const sg = 5.5; s.gv.multiplyScalar(1 - 3 * dt).add(V3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).multiplyScalar(sg * Math.sqrt(dt) * 3.6));
      s.gp.addScaledVector(s.gv, dt); const L = [3.5, 1.8, 1.6]; ["x", "y", "z"].forEach((k, i) => { const cc = i === 1 ? 2.05 : 0; if (Math.abs(s.gp[k] - cc) > L[i]) { s.gp[k] = cc + Math.sign(s.gp[k] - cc) * L[i]; s.gv[k] *= -0.6; } });
      s.tt += dt; if (s.tt > 0.06) { s.tt = 0; s.gt.push(s.gp.clone()); if (s.gt.length > 160) s.gt.shift(); }
    },
    update(S, s, c, dt) {
      const o = S.objs; if (s.gp === undefined) return; ["g0", "g1", "g2", "g3"].forEach((n, i) => (o[n].visible = i === c.type)); const t = s.t;
      if (c.type === 0) { const L = 12.4, x = ((t * 3.5) % L) - L / 2; o.car.position.x = x; spinWheelsT(o.car, 3.5 * dt / 0.21); S.aim([0, 0.8, 0], 11, 0.1, 0.34); }
      if (c.type === 1) { const w = 1.15; o.train.forEach((cc, i) => { const a = t * w - i * 0.36; cc.position.set(2.8 * Math.cos(a), 0.1, -2.8 * Math.sin(a)); cc.rotation.y = a; }); S.aim([0, 0.4, 0], 10.5, 0.0, 0.62); }
      if (c.type === 2) { const A = 2.6, w = 2.6, x = A * Math.cos(w * t); o.osc.position.x = x; const l1 = x - 0.55 + 5.5, l2 = 5.5 - x - 0.55; o.sp1.position.x = -5.5; o.sp1.scale.y = Math.max(0.2, l1); o.sp2.position.x = 5.5; o.sp2.scale.y = Math.max(0.2, l2); o.sp2.rotation.z = Math.PI / 2; S.aim([0, 0.5, 0], 11, 0.0, 0.3); }
      if (c.type === 3) { o.grain.position.copy(s.gp); o.mol.count = 150; o.mp.forEach((m, i) => { m.p.addScaledVector(m.v, dt); ["x", "y", "z"].forEach((k, j) => { const lim = [3.8, 3.9, 1.9][j], cc = j === 1 ? 2.05 : 0; if (Math.abs(m.p[k] - cc) > lim) { m.p[k] = cc + Math.sign(m.p[k] - cc) * lim; m.v[k] *= -1; } }); o.mol.set(i, m.p.x, m.p.y, m.p.z); }); o.mol.instanceMatrix.needsUpdate = true; o.gtrail.count = s.gt.length; s.gt.forEach((p, i) => o.gtrail.set(i, p.x, p.y, p.z)); o.gtrail.instanceMatrix.needsUpdate = true; S.aim([0, 2, 0], 11.5, 0.3, 0.2); }
    },
    overlay(ctx, s, c, w, h, S) {
      const txt = ["Rectilinear: motion along a straight line (v = constant here)", "Circular: constant distance from a fixed centre (a = v²/r towards centre)", "Oscillatory: to-and-fro about a fixed point (SHM)", "Random (Brownian): pollen grain kicked unevenly by water molecules"][c.type];
      H.pill(ctx, 14, 26, txt, "#ffd27a", 10.5); H.pill(ctx, 14, 48, ["example: car on a straight road", "example: satellite, fan blade, train on a loop", "example: pendulum, guitar string, mass on a spring", "example: smoke particles, pollen grains"][c.type], "#cfe0ff", 10);
    },
  };
  function spinWheelsT(car, ang) { car.wheels.forEach((w) => (w.rotation.z -= ang)); }

  /* ================= CIRCULAR MOTION ================= */
  S_["Circular Motion"] = {
    env: "lab", envOpts: { w: 16, d: 12, steelTop: true }, cam: [[0, 7.2, 6.6], [0, 0.4, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.cyl(0.14, 0.2, 0.9, M.steel(), 0, 0.45, 0); mk.cyl(0.24, 0.24, 0.05, M.chrome(), 0, 0.92, 0);
      o.string = mk.rod(V3(0, 0.92, 0), V3(1, 0.92, 0), 0.012, M.matte(0xf3efe2, 0.9), 8);
      o.ball = mk.sphere(0.2, M.paint(0xd8362c)); o.aF = mk.arrow(0x58a6ff, 0.05, 0.17); o.aV = mk.arrow(0x6ee7a8, 0.045, 0.15);
      o.ring = new T.Mesh(new T.TorusGeometry(1, 0.012, 8, 120), M.glow(0xffffff, 0.35)); o.ring.rotation.x = Math.PI / 2; o.ring.position.y = 0.92; S.scene.add(o.ring); o.trail = mk.particles(48, 0.05, M.glow(0xff8f7a, 0.9));
    },
    reset(s, c) { s.theta = 0; },
    step(s, c, dt) { s.theta = (s.theta || 0) + (TAU / c.period) * dt; },
    update(S, s, c, dt) {
      const o = S.objs, R = c.radius * 1.15, th = s.theta || 0, v = (TAU * c.radius) / c.period, F = (c.mass * v * v) / c.radius, br = 0.12 + 0.12 * Math.cbrt(c.mass), y = 0.92;
      const p = V3(R * Math.cos(th), y, -R * Math.sin(th)); o.ball.position.copy(p); o.ball.scale.setScalar(br / 0.2); S.setRod(o.string, V3(0, y, 0), p); o.ring.scale.setScalar(R);
      const tdir = V3(-Math.sin(th), 0, -Math.cos(th)), inw = p.clone().setY(y).multiplyScalar(-1).setY(0).normalize(); S.setArrow(o.aF, p, inw, Math.min(3.0, 0.11 * F) / 1); S.setArrow(o.aV, p, tdir, Math.min(3.4, 0.28 * v));
      o.trail.count = 40; for (let i = 0; i < 40; i++) { const a = th - i * 0.085; o.trail.set(i, R * Math.cos(a), y, -R * Math.sin(a), 1 - i / 48); } o.trail.instanceMatrix.needsUpdate = true; S.aim([0, 0.5, 0], Math.max(8.5, R * 2.5 + 3.5), 0.0, 0.85);
    },
    overlay(ctx, s, c, w, h, S) {
      const v = (TAU * c.radius) / c.period, F = (c.mass * v * v) / c.radius, th = s.theta || 0, R = c.radius * 1.15; const p = V3(R * Math.cos(th), 0.92, -R * Math.sin(th));
      H.at(ctx, S, p, `v = ${f1(v, 2)} m/s`, "#8df0be", 14, -18, 11); H.at(ctx, S, p.clone().multiplyScalar(0.5).setY(0.92), `F = ${f1(F, 1)} N`, "#8ec5ff", -6, 22, 11.5);
      H.pill(ctx, 14, 26, "F = mv²/r = mω²r  (towards the centre)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `ω = 2π/T = ${f1(TAU / c.period, 2)} rad/s    a = v²/r = ${f1((v * v) / c.radius, 1)} m/s²`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, "● centripetal force (string tension)", "#8ec5ff", 10); H.pill(ctx, 14, 92, "● velocity (tangent to the circle)", "#8df0be", 10);
    },
  };

  /* ================= FRICTION ON A BLOCK ================= */
  S_["Friction on a Block"] = {
    env: "lab", envOpts: { w: 17, d: 9 }, cam: [[1.5, 3.4, 9], [0, 0.6, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.track = mk.ruler(12, 1.2, 0, 0.03, 0.5); o.blk = mk.box(1, 1, 1, new T.MeshStandardMaterial({ color: 0xc58b4e, roughness: 0.55, metalness: 0 }), 0, 0.55, 0); { const e = new T.LineSegments(new T.EdgesGeometry(o.blk.geometry), new T.LineBasicMaterial({ color: 0x5a3a1c })); o.blk.add(e); } o.aA = mk.arrow(0x6ee7a8, 0.05, 0.17); o.aF = mk.arrow(0xff5a5a, 0.05, 0.17); o.heat = mk.soft(0xff7a2d, 2, 0, 0.1, 0, 0);
    },
    reset(s, c) { s.x = -5.4; s.v = 0; s.hold = 0.6; },
    step(s, c, dt) {
      if (s.x === undefined) P.scenes["Friction on a Block"].reset(s, c);
      if (s.hold > 0) { s.hold -= dt; return; } const N = c.mass * G, fk = c.mu * N; let a;
      if (s.v > 0.001) a = (c.applied - fk) / c.mass; else if (c.applied > fk) a = (c.applied - fk) / c.mass; else { s.v = 0; a = 0; }
      s.v = Math.max(0, s.v + a * dt); s.x += s.v * dt + 0.5 * a * dt * dt * 0; s.a = a; if (s.x > 5.4) { s.hold = 0.9; s.x = -5.4; s.v = 0; }
    },
    update(S, s, c, dt) {
      const o = S.objs; if (s.x === undefined) return; const side = 0.55 + 0.38 * Math.cbrt(c.mass / 10); o.blk.scale.set(side, side, side); o.blk.position.set(s.x, 0.03 + side * 0.5, 0);
      const N = c.mass * G, fk = c.mu * N, moving = s.v > 0.02, fric = moving || c.applied > fk ? fk : c.applied, k = 0.012;
      const ay = 0.03 + side * 0.5; S.setArrow(o.aA, V3(s.x + side * 0.5, ay + 0.14, 0.78), V3(c.applied * k, 0, 0), 1); S.setArrow(o.aF, V3(s.x, ay - 0.16, 0.78), V3(-fric * k, 0, 0), 1);
      o.heat.position.set(s.x, 0.1, 0); o.heat.material.opacity = moving ? Math.min(0.85, fk * s.v * 0.0012) : 0; o.heat.scale.setScalar(side * 1.6);
      if (moving && dt > 0 && Math.random() < Math.min(1, s.v * 0.15)) S.puff(s.x - side * 0.5, 0.08, (Math.random() - 0.5) * side, { n: 1, color: 0xb9a98d, size: 0.28, speed: 0.4, life: 0.7, op: 0.35, up: 0.3 });
      S.aim([s.x * 0.6, 0.7, 0], 8, 0.12, 0.46);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.x === undefined) return; const N = c.mass * G, fk = c.mu * N, moving = s.v > 0.02, fr = moving || c.applied > fk ? fk : c.applied, net = Math.max(0, c.applied - fk);
      const q = S.proj(V3(s.x, 1.5, 0.75)); H.pill(ctx, q.x, q.y - 14, `applied F = ${c.applied} N`, "#8df0be", 10.5, "center"); H.pill(ctx, q.x, q.y + 34, `friction f = ${f1(fr, 1)} N`, "#ff9d8a", 10.5, "center");
      H.pill(ctx, 14, 26, `N = mg = ${f1(N, 1)} N    f_max = μN = ${f1(fk, 1)} N`, "#ffd27a", 10.5); H.pill(ctx, 14, 48, c.applied <= fk && !moving ? "F ≤ μN → block stays still (static friction = applied force)" : `F > μN → a = (F − μN)/m = ${f1(net / c.mass, 2)} m/s²`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `speed v = ${f1(s.v, 2)} m/s`, "#cfe0ff", 10.5);
    },
  };

  /* ================= F = ma (TROLLEY) ================= */
  S_["F = ma (Trolley)"] = {
    env: "lab", envOpts: { w: 17, d: 9 }, cam: [[1.5, 3.4, 9.5], [0, 0.7, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; const rail = mk.box(15, 0.12, 1.0, M.aluminium(), 0, 0.0, 0); rail.position.y = 0.0; mk.ruler(14, 0.3, 0, 0.07, 0.62);
      o.tr = mk.cart(1.8, 1.0, 0x2d6cdf); o.tr.position.y = 0.06; S.scene.add(o.tr); o.mass = mk.slotted(1); o.aA = mk.arrow(0x6ee7a8, 0.06, 0.2); o.aF = mk.arrow(0xff5a5a, 0.06, 0.2); o.aN = mk.arrow(0xffc857, 0.06, 0.2); o.lastN = 0;
    },
    reset(s, c) { s.x = -6.4; s.v = 0; s.a = 0; s.hold = 0.6; },
    step(s, c, dt) {
      if (s.x === undefined) P.scenes["F = ma (Trolley)"].reset(s, c);
      if (s.hold > 0) { s.hold -= dt; return; } const fr = s.v > 0.01 ? c.friction : Math.min(c.force, c.friction); let net = c.force - fr; if (s.v <= 0.01 && c.force <= c.friction) { net = 0; s.v = 0; }
      s.a = net / c.mass; s.x += s.v * dt + 0.5 * s.a * dt * dt; s.v = Math.max(0, s.v + s.a * dt); if (s.x > 6.4) { s.hold = 0.9; s.x = -6.4; s.v = 0; s.a = 0; }
    },
    update(S, s, c, dt) {
      const o = S.objs; if (s.x === undefined) return; const n = Math.max(1, Math.round(c.mass / 17)); if (o.lastN !== n) { o.lastN = n; S.scene.remove(o.mass); o.mass = S.mk.slotted(n); }
      o.tr.position.x = s.x; o.mass.position.set(s.x, 0.4, 0); o.tr.wheels.forEach((w) => (w.rotation.z -= (s.v * dt) / 0.17));
      const k = 0.0085, fr = s.v > 0.01 || c.force > c.friction ? c.friction : c.force, y = 0.52; S.setArrow(o.aA, V3(s.x + 1.0, y, 0.75), V3(c.force * k, 0, 0), 1); S.setArrow(o.aF, V3(s.x + 1.0, y - 0.18, 0.75), V3(-fr * k, 0, 0), 1);
      const net = Math.max(0, c.force - fr); S.setArrow(o.aN, V3(s.x + 1.0, y + 0.2, 0.75), V3(net * k, 0, 0), 1); S.aim([s.x * 0.6, 0.7, 0], 8.5, 0.14, 0.42);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.x === undefined) return; const fr = s.v > 0.01 || c.force > c.friction ? c.friction : c.force, net = Math.max(0, c.force - fr);
      H.pill(ctx, 14, 26, "F_net = ma      a = (F − f) / m", "#ffd27a", 11); H.pill(ctx, 14, 48, `F = ${c.force} N    f = ${f1(fr, 0)} N    F_net = ${f1(net, 1)} N    m = ${c.mass} kg`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `a = ${f1(s.a, 2)} m/s²     v = ${f1(s.v, 2)} m/s`, "#8df0be", 11); H.pill(ctx, 14, 92, "● applied   ● friction   ● resultant", "#cfe0ff", 10);
    },
  };

  /* ================= MOMENTUM & COLLISIONS ================= */
  S_["Momentum & Collisions"] = {
    env: "lab", envOpts: { w: 18, d: 9 }, cam: [[0, 3.6, 10.5], [0, 0.7, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.box(16, 0.12, 0.9, M.aluminium(), 0, 0.0, 0); mk.ruler(15, 0.3, 0, 0.07, 0.62); for (const sx of [-1, 1]) { mk.box(0.3, 0.9, 1.0, M.matte(0x30353f, 0.5), sx * 8.1, 0.45, 0); mk.box(0.12, 0.5, 0.7, M.rubber(), sx * 7.9, 0.5, 0); }
      o.c1 = mk.cart(1, 0.9, 0xd8362c); o.c2 = mk.cart(1, 0.9, 0x2d6cdf); o.c1.position.y = o.c2.position.y = 0.06; o.p1 = mk.arrow(0xff8f8f, 0.05, 0.17); o.p2 = mk.arrow(0x8ec5ff, 0.05, 0.17); o.m1 = mk.cyl(0.25, 0.25, 0.3, M.brass(), 0, 0.5, 0); o.m2 = mk.cyl(0.25, 0.25, 0.3, M.brass(), 0, 0.5, 0);
    },
    reset(s, c) { s.x1 = -5; s.x2 = 5; s.v1 = c.u1; s.v2 = c.u2; s.collided = false; s.p_before = c.m1 * c.u1 + c.m2 * c.u2; s.p_after = null; s.ke0 = 0.5 * c.m1 * c.u1 ** 2 + 0.5 * c.m2 * c.u2 ** 2; s.ke1 = null; s.t = 0; s.stuck = false; s.sig = `${c.m1}|${c.u1}|${c.m2}|${c.u2}|${c.mode}`; s.spark = false; },
    step(s, c, dt) {
      if (s.x1 === undefined || s.sig !== `${c.m1}|${c.u1}|${c.m2}|${c.u2}|${c.mode}`) P.scenes["Momentum & Collisions"].reset(s, c);
      s.t += dt; if (s.t > 9) { P.scenes["Momentum & Collisions"].reset(s, c); return; }
      const w1 = 0.8 + 0.2 * Math.cbrt(c.m1), w2 = 0.8 + 0.2 * Math.cbrt(c.m2); s.w1 = w1; s.w2 = w2;
      s.x1 += s.v1 * dt; s.x2 += s.v2 * dt;
      if (s.stuck) { s.x2 = s.x1 + (w1 + w2) / 2 + 0.28; }
      else if (s.x2 - s.x1 <= (w1 + w2) / 2 + 0.28 && s.v1 - s.v2 > 0) {
        const m1 = c.m1, m2 = c.m2, u1 = s.v1, u2 = s.v2; if (c.mode === 1) { const v = (m1 * u1 + m2 * u2) / (m1 + m2); s.v1 = s.v2 = v; s.stuck = true; } else { s.v1 = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2); s.v2 = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2); }
        s.collided = true; s.p_after = m1 * s.v1 + m2 * s.v2; s.ke1 = 0.5 * m1 * s.v1 ** 2 + 0.5 * m2 * s.v2 ** 2; s.spark = true;
      }
      const lim = 7.6; if (s.x1 - (w1 / 2 + 0.2) < -lim) { s.x1 = -lim + w1 / 2 + 0.2; s.v1 = Math.abs(s.v1); if (s.stuck) s.v2 = s.v1; } if (s.x2 + (w2 / 2 + 0.2) > lim) { s.x2 = lim - w2 / 2 - 0.2; s.v2 = -Math.abs(s.v2); if (s.stuck) s.v1 = s.v2; }
    },
    update(S, s, c, dt) {
      const o = S.objs; if (s.x1 === undefined) return; const w1 = s.w1 || 1, w2 = s.w2 || 1; o.c1.scale.set(w1, 1, 0.95); o.c2.scale.set(w2, 1, 0.95); o.c1.position.x = s.x1; o.c2.position.x = s.x2;
      o.c1.wheels.forEach((w) => (w.rotation.z -= (s.v1 * dt) / 0.17)); o.c2.wheels.forEach((w) => (w.rotation.z -= (s.v2 * dt) / 0.17));
      o.m1.scale.set(Math.cbrt(c.m1) * 0.7, Math.cbrt(c.m1) * 0.7, Math.cbrt(c.m1) * 0.7); o.m1.position.set(s.x1, 0.55 + 0.1 * Math.cbrt(c.m1), 0); o.m2.scale.set(Math.cbrt(c.m2) * 0.7, Math.cbrt(c.m2) * 0.7, Math.cbrt(c.m2) * 0.7); o.m2.position.set(s.x2, 0.55 + 0.1 * Math.cbrt(c.m2), 0);
      const k = 0.022; S.setArrow(o.p1, V3(s.x1, 1.55, 0.7), V3(c.m1 * s.v1 * k, 0, 0), 1); S.setArrow(o.p2, V3(s.x2, 1.95, 0.7), V3(c.m2 * s.v2 * k, 0, 0), 1);
      if (s.spark) { s.spark = false; S.puff((s.x1 + s.x2) / 2, 0.5, 0, { n: 10, color: 0xffd27a, size: 0.35, speed: 3, life: 0.5, op: 0.9, up: 1 }); }
      S.aim([0, 0.8, 0], 10.5, 0.0, 0.36);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.x1 === undefined) return; const pn = c.m1 * s.v1 + c.m2 * s.v2, ke = 0.5 * c.m1 * s.v1 ** 2 + 0.5 * c.m2 * s.v2 ** 2;
      H.pill(ctx, 14, 26, "total momentum Σp = m₁v₁ + m₂v₂  is conserved in every collision", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `before: p = ${f1(s.p_before, 1)} kg·m/s     now: p = ${f1(pn, 1)} kg·m/s`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, c.mode === 0 ? `elastic: KE conserved  (${f1(s.ke0, 0)} J → ${f1(ke, 0)} J)` : `inelastic: KE lost as heat/sound  (${f1(s.ke0, 0)} J → ${f1(ke, 0)} J)`, c.mode === 0 ? "#8df0be" : "#ff9d8a", 10.5);
      const a = S.proj(V3(s.x1, 2.0, 0)), b = S.proj(V3(s.x2, 2.4, 0)); H.pill(ctx, a.x, a.y - 4, `${c.m1} kg · ${f1(s.v1, 1)} m/s`, "#ffb0b0", 10, "center"); H.pill(ctx, b.x, b.y - 4, `${c.m2} kg · ${f1(s.v2, 1)} m/s`, "#a8d0ff", 10, "center");
    },
  };

  /* ================= ROCKET PROPULSION ================= */
  const M0 = 800, MDRY = 300, VIS = 0.02;
  S_["Rocket Propulsion (Action–Reaction)"] = {
    env: "outdoor", envOpts: { shadowArea: 22 }, cam: [[9, 4.5, 16], [0, 5.2, 0]], fov: 40,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.world = new T.Group(); S.scene.add(o.world);
      const pad = new T.Mesh(new T.CylinderGeometry(4.2, 4.4, 0.4, 40), M.matte(0x8f9298, 0.9)); pad.position.y = 0.2; pad.receiveShadow = pad.castShadow = true; o.world.add(pad);
      const tw = new T.Group(); for (const [x, z] of [[-3, -1.6], [-3, 1.6]]) { const l = new T.Mesh(new T.BoxGeometry(0.22, 11, 0.22), M.matte(0xc8402c, 0.5)); l.position.set(x, 5.7, z); l.castShadow = true; tw.add(l); } for (let y = 1; y <= 11; y += 2.2) { const b = new T.Mesh(new T.BoxGeometry(0.12, 0.12, 3.2), M.matte(0xc8402c, 0.5)); b.position.set(-3, y, 0); tw.add(b); } o.world.add(tw);
      o.rocket = new T.Group(); const pts = [new T.Vector2(0, 0), new T.Vector2(0.55, 0.05), new T.Vector2(0.62, 0.5), new T.Vector2(0.62, 4.6), new T.Vector2(0.52, 5.2), new T.Vector2(0.3, 5.9), new T.Vector2(0, 6.4)];
      const body = new T.Mesh(new T.LatheGeometry(pts, 40), M.paint(0xf1f1ee)); body.castShadow = true; o.rocket.add(body);
      const band = new T.Mesh(new T.CylinderGeometry(0.625, 0.625, 0.7, 40, 1, true), M.paint(0xd8362c)); band.position.y = 3.3; o.rocket.add(band); const nose = new T.Mesh(new T.ConeGeometry(0.4, 1.0, 40), M.paint(0xd8362c)); nose.position.y = 5.65; nose.scale.set(1.0, 1, 1); o.rocket.add(nose);
      for (let i = 0; i < 4; i++) { const fin = new T.Mesh(new T.BoxGeometry(0.06, 1.3, 0.9), M.paint(0xd8362c)); fin.position.set(Math.cos(i * Math.PI / 2) * 0.85, 0.65, Math.sin(i * Math.PI / 2) * 0.85); fin.rotation.y = -i * Math.PI / 2; fin.castShadow = true; o.rocket.add(fin); }
      const noz = new T.Mesh(new T.CylinderGeometry(0.28, 0.45, 0.5, 24, 1, true), M.steel()); noz.position.y = -0.1; o.rocket.add(noz);
      const win = new T.Mesh(new T.SphereGeometry(0.2, 20, 14), M.glass(0x8fd0ff)); win.position.set(0, 4.3, 0.55); win.scale.z = 0.35; o.rocket.add(win);
      o.flame = new T.Mesh(new T.ConeGeometry(0.42, 1, 24, 1, true), M.glow(0xffa030, 0.9)); o.flame.geometry.translate(0, -0.5, 0); o.flame.position.y = -0.2; o.rocket.add(o.flame); o.core = new T.Mesh(new T.ConeGeometry(0.22, 1, 18, 1, true), M.glow(0xfff2c0, 0.95)); o.core.geometry.translate(0, -0.5, 0); o.core.position.y = -0.2; o.rocket.add(o.core);
      o.glow = mk.soft(0xff9a40, 4.5, 0, -0.5, 0, 0); S.scene.remove(o.glow); o.rocket.add(o.glow); o.light = new T.PointLight(0xffa860, 0, 30, 1.5); o.light.position.y = -0.6; o.rocket.add(o.light); S.scene.add(o.rocket); o.rocket.position.y = 0.6;
    },
    reset(s, c) { s.alt = 0; s.v = 0; s.m = M0; s.t = 0; s.hold = 1.0; s.end = 0; s.maxAlt = 0; s.vis0 = 0; },
    sub: 4,
    step(s, c, dt) {
      if (s.alt === undefined) P.scenes["Rocket Propulsion (Action–Reaction)"].reset(s, c);
      if (s.end > 0) { s.end -= dt; if (s.end <= 0) P.scenes["Rocket Propulsion (Action–Reaction)"].reset(s, c); return; } if (s.hold > 0) { s.hold -= dt; return; }
      s.t += dt; const burning = s.m > MDRY + 1e-6, thrust = burning ? c.burnRate * c.exhaustSpeed : 0; s.thrust = thrust; let a;
      if (s.alt <= 0 && s.v <= 0 && thrust < s.m * G) a = 0; else a = thrust / s.m - G;
      if (burning) s.m = Math.max(MDRY, s.m - c.burnRate * dt); s.v += a * dt; s.alt += s.v * dt; s.a = a; s.maxAlt = Math.max(s.maxAlt, s.alt);
      if (s.alt < 0) { s.alt = 0; if (s.v < 0) { s.v = 0; s.end = 2.5; } }
      if (!burning && s.alt <= 0 && s.end <= 0) s.end = 2.0;
    },
    update(S, s, c, dt) {
      const o = S.objs; if (s.alt === undefined) return; const burning = s.m > MDRY + 1e-6 && s.hold <= 0, thrust = burning ? c.burnRate * c.exhaustSpeed : 0, lift = s.alt * VIS, k = Math.min(1, s.alt / 15000);
      o.world.position.y = -lift; o.objsDone = 1; if (S.objs.ground) S.objs.ground.position.y = -0.01 - lift; if (S.objs.trees) S.objs.trees.position.y = -lift;
      if (S.puffList && dt > 0) { const dy = lift - (s.vis0 || 0); S.puffList.forEach((p) => (p.position.y -= dy)); } s.vis0 = lift;
      const m = S.objs.skyMat; if (m) { m.uniforms.top.value.copy(mixc(0x2f6fc2, 0x01020a, k * 1.2)); m.uniforms.hor.value.copy(mixc(0xcfe5f4, 0x16233f, Math.min(1, k * 1.6))); S.scene.background.copy(m.uniforms.hor.value); if (S.scene.fog) S.scene.fog.color.copy(m.uniforms.hor.value); }
      const fl = thrust > 0 ? Math.min(5, 0.8 + thrust / 12000) * (0.9 + 0.2 * Math.random()) : 0.001; o.flame.scale.set(1, fl, 1); o.core.scale.set(1, fl * 0.62, 1); o.flame.visible = o.core.visible = fl > 0.01; o.glow.material.opacity = thrust > 0 ? 0.8 : 0; o.light.intensity = thrust > 0 ? 40 : 0;
      o.rocket.position.y = 0.6 + (s.alt <= 0 ? 0 : 0); o.rocket.rotation.z = 0; o.rocket.position.x = 0;
      if (dt > 0 && thrust > 0) { S.puff(0, 0.3, 0, { n: 2, color: 0xffb860, size: 0.8, speed: 0.6, life: 0.4, op: 0.8, up: -4, grow: 1.2 }); S.puff(0, 0.2, 0, { n: 2, color: 0xcfcfcf, size: 1.4, speed: 1.4, life: 2.8, op: 0.45, up: -2.5, grow: 3.5 }); }
      if (s.alt <= 0 && thrust > 0) o.rocket.position.y += Math.sin(S.t * 90) * 0.012;
      S.aim([0, 4.6, 0], 17, 0.5, 0.12);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.alt === undefined) return; const burning = s.m > MDRY + 1e-6 && s.hold <= 0, thrust = burning ? c.burnRate * c.exhaustSpeed : 0, W = s.m * G, net = thrust - W;
      H.pill(ctx, 14, 26, "thrust F = (dm/dt)·vₑ = " + f1(c.burnRate * c.exhaustSpeed / 1000, 1) + " kN        Newton III: gas down → rocket up", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `weight W = mg = ${f1(W / 1000, 2)} kN (falls as fuel burns)`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, thrust > 0 && s.alt <= 0 && thrust < W ? "thrust < weight → stays on the pad (increase burn rate or exhaust speed)" : `a = F/m − g = ${f1(s.a || 0, 1)} m/s²   v = ${f1(s.v, 0)} m/s   altitude = ${f1(s.alt / 1000, 2)} km`, thrust < W && s.alt <= 0 ? "#ff9d8a" : "#8df0be", 10.5);
      const fuel = Math.max(0, (s.m - MDRY) / (M0 - MDRY)); H.panel(ctx, w - 44, 40, 30, 200); ctx.fillStyle = fuel > 0.2 ? "#4ee1d0" : "#ff6b5e"; ctx.fillRect(w - 38, 46 + 188 * (1 - fuel), 18, 188 * fuel); label(ctx, w - 44, 256, "FUEL", "#cfe0ff", 10); label(ctx, w - 46, 270, `${f1(s.m - MDRY, 0)} kg`, "#cfe0ff", 9.5);
    },
  };
})();
