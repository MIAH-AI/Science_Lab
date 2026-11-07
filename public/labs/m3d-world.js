/* m3d-world.js — WebGL labs set in the real world:
   F-b#3d     angles of elevation & depression (tower on a field, observer, sight lines)
   F-c#3d     bearings at sea (animated ships on shader water, compass rose, two-leg journey)
   H-B(i)#3d  experimental probability with tumbling dice (relative frequency → theoretical) */
(function () {
  "use strict";
  const MK = window.MK, f = MK.fmt, W = MK.when, R = (d) => d * Math.PI / 180;

  /* ---------- sea environment: sky dome + animated shader water ---------- */
  MK.envs3d.sea = function (S, o) {
    const T = window.THREE, sc = S.scene;
    const sky = new T.Mesh(new T.SphereGeometry(400, 32, 16), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color(0x2c6fbf) }, hor: { value: new T.Color(0xd6e9f6) }, sd: { value: new T.Vector3(-0.4, 0.35, -0.85).normalize() } },
      vertexShader: "varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec3 vP;uniform vec3 top;uniform vec3 hor;uniform vec3 sd;void main(){float h=clamp(vP.y,0.,1.);vec3 c=mix(hor,top,pow(h,.5));float s=max(dot(vP,sd),0.);c+=vec3(1.,.86,.62)*(pow(s,800.)*3.+pow(s,18.)*.3);gl_FragColor=vec4(c,1.);}" }));
    sc.add(sky); sc.background = new T.Color(0xd6e9f6); sc.fog = new T.Fog(0xd6e9f6, 60, 260);
    const wmat = new T.ShaderMaterial({ fog: false, uniforms: { t: { value: 0 }, sun: { value: new T.Vector3(-0.4, 0.35, -0.85).normalize() }, hor: { value: new T.Color(0xd6e9f6) } },
      vertexShader: "uniform float t;varying vec3 vW;varying vec3 vN;void main(){vec3 p=position;float w=sin(p.x*.35+t*1.3)*.12+sin(p.y*.42-t*1.1)*.1+sin((p.x+p.y)*.9+t*2.)*.04;p.z+=w;vec4 wp=modelMatrix*vec4(p,1.);vW=wp.xyz;float dx=cos(p.x*.35+t*1.3)*.042+cos((p.x+p.y)*.9+t*2.)*.036,dy=-cos(p.y*.42-t*1.1)*.042+cos((p.x+p.y)*.9+t*2.)*.036;vN=normalize(vec3(-dx,1.,dy));gl_Position=projectionMatrix*viewMatrix*wp;}",
      fragmentShader: "uniform vec3 sun;uniform vec3 hor;varying vec3 vW;varying vec3 vN;void main(){vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-max(dot(V,vN),0.),3.);vec3 deep=vec3(.03,.18,.32),sky=vec3(.72,.85,.95);vec3 c=mix(deep,sky,.15+fr*.75);vec3 H=normalize(sun+V);c+=vec3(1.,.9,.7)*pow(max(dot(vN,H),0.),220.)*1.6;float d=length(cameraPosition-vW);c=mix(c,hor,smoothstep(60.,260.,d));gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}" });
    const water = new T.Mesh(new T.PlaneGeometry(600, 600, 220, 220), wmat); water.rotation.x = -Math.PI / 2; sc.add(water); S.objs.water = wmat;
    sc.add(new T.HemisphereLight(0xcfe6ff, 0x1d3a52, 0.9));
    const sun = new T.DirectionalLight(0xfff0d8, 2.4); sun.position.set(-30, 40, -60); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 200 }); sc.add(sun);
    S.anims.push((dt, t) => { wmat.uniforms.t.value = t; });
  };

  /* ================= F-b#3d : elevation & depression ================= */
  function towerTex(T, U) { const c = U.cv(256, 512), g = c.getContext("2d"); g.fillStyle = "#c9c4b8"; g.fillRect(0, 0, 256, 512); for (let y = 12; y < 512; y += 36) for (let x = 14; x < 256; x += 48) { g.fillStyle = Math.random() > 0.35 ? "#33465c" : "#f4d58d"; g.fillRect(x, y, 26, 20); g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x, y, 26, 4); }
    const im = g.getImageData(0, 0, 256, 512), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(im, 0, 0); return U.tex(c, [1, 1]); }
  function person(T, P3D, col) { const g = new T.Group(), skin = P3D.mat.matte(0x7a4b2a, 0.6), cloth = P3D.mat.matte(col, 0.7);
    const legs = new T.Mesh(new T.CylinderGeometry(0.14, 0.12, 0.8, 12), P3D.mat.matte(0x1f2937, 0.8)); legs.position.y = 0.4; const body = new T.Mesh(new T.CylinderGeometry(0.2, 0.17, 0.65, 14), cloth); body.position.y = 1.12;
    const head = new T.Mesh(new T.SphereGeometry(0.14, 20, 14), skin); head.position.y = 1.6; [legs, body, head].forEach((m) => { m.castShadow = true; g.add(m); }); return g; }
  MK.def("F-b#3d", {
    kind: "3d", label: "3D lab — elevation & depression outdoors", title: "Elevation & depression (3D)",
    blurb: "A real tower on an open field. Walk the observer closer or further and watch the angle of elevation change; switch to the top of the tower for depression.",
    env: "outdoor", cam: [[-4, 7, 26], [6, 6, 0]], fov: 40, exposure: 1.0,
    values: { mode: "elev", h: 24, d: 30 },
    controls: [{ type: "tabs", key: "mode", label: "Problem", options: [["elev", "Elevation (from the ground)"], ["dep", "Depression (from the top)"]] }, { key: "h", label: "Tower height", min: 6, max: 40, unit: "m" }, { key: "d", label: "Distance from the foot", min: 5, max: 60, unit: "m" }],
    views: [{ label: "Side", cam: [[-4, 7, 26], [6, 6, 0]] }, { label: "Observer's eye", cam: (s, c) => (c.mode === "elev" ? [[-c.d - 3, 2.2, 3], [0, c.h * 0.6, 0]] : [[-1.5, c.h + 2.5, 1.5], [-c.d, 0, 0]]) }, { label: "Aerial", cam: [[-10, 45, 30], [-8, 0, 0]] }],
    build(S, s, c) { const T = window.THREE, P3D = window.P3D, U = P3D.util, mk = S.mk, sc = S.scene;
      s.tower = new T.Mesh(new T.BoxGeometry(4, 1, 4), [new T.MeshStandardMaterial({ map: towerTex(T, U), roughness: 0.8 }), new T.MeshStandardMaterial({ map: towerTex(T, U), roughness: 0.8 }), P3D.mat.matte(0x8c8c88), P3D.mat.matte(0x8c8c88), new T.MeshStandardMaterial({ map: towerTex(T, U), roughness: 0.8 }), new T.MeshStandardMaterial({ map: towerTex(T, U), roughness: 0.8 })]); s.tower.castShadow = true; s.tower.receiveShadow = true; sc.add(s.tower);
      s.flag = mk.box(0.08, 3, 0.08, P3D.mat.steel()); s.obs = person(T, P3D, 0xc0392b); sc.add(s.obs);
      s.boat = new T.Group(); const hull = new T.Mesh(new T.BoxGeometry(2.4, 0.6, 1), P3D.mat.paint(0x1f5fd6)); hull.position.y = 0.3; const cab = new T.Mesh(new T.BoxGeometry(0.9, 0.6, 0.8), P3D.mat.paint(0xf4f1ea)); cab.position.set(-0.3, 0.9, 0); s.boat.add(hull, cab); hull.castShadow = cab.castShadow = true; sc.add(s.boat);
      s.beam = mk.beam(new T.Vector3(), new T.Vector3(1, 1, 0), 0xffd27a, 0.03); s.hor = mk.beam(new T.Vector3(), new T.Vector3(1, 0, 0), 0x9ad0ff, 0.018);
      s.tape = mk.box(1, 0.02, 0.18, P3D.mat.matte(0xf2e6a8, 0.6)); },
    update(S, s, c) { const T = window.THREE, h = c.h, d = c.d; s.tower.scale.y = h; s.tower.position.set(2, h / 2, 0); s.flag.position.set(2, h + 1.5, 0);
      s.tape.scale.x = d; s.tape.position.set(-d / 2, 0.02, 2.4);
      if (c.mode === "elev") { s.obs.visible = true; s.boat.visible = false; s.obs.position.set(-d, 0, 0); s.obs.rotation.y = Math.PI / 2; const eye = new T.Vector3(-d, 1.6, 0), top = new T.Vector3(0, h, 0); S.setBeam(s.beam, eye, top); S.setBeam(s.hor, eye, new T.Vector3(0, 1.6, 0)); s.eye = eye; s.top = top; }
      else { s.obs.visible = true; s.obs.position.set(1, h, 0); s.obs.rotation.y = -Math.PI / 2; s.boat.visible = true; s.boat.position.set(-d, 0, 0); const eye = new T.Vector3(1, h + 1.6, 0), tgt = new T.Vector3(-d, 0.8, 0); S.setBeam(s.beam, eye, tgt); S.setBeam(s.hor, eye, new T.Vector3(-d, h + 1.6, 0)); s.eye = eye; s.top = tgt; }
      S.aim([-d / 2 + 2, h * 0.45, 0], Math.max(24, d * 1.05 + h * 0.6), -0.18, 0.18); },
    overlay(ctx, s, c, S, B) { if (!s.eye) return; const e = MK.proj(S, s.eye.x, s.eye.y, s.eye.z), t = MK.proj(S, s.top.x, s.top.y, s.top.z), hz = c.mode === "elev" ? MK.proj(S, 0, 1.6, 0) : MK.proj(S, -c.d, c.h + 1.6, 0);
      const a0 = Math.atan2(hz.y - e.y, hz.x - e.x), a1 = Math.atan2(t.y - e.y, t.x - e.x); B.angle(e.x, e.y, a0, a1, 46, "#ffd27a", f(MK.deg(Math.atan((c.mode === "elev" ? c.h - 1.6 : c.h + 0.8) / c.d)), 1) + "°");
      const mid = MK.proj(S, -c.d / 2, 0.1, 2.4); B.pill(c.d + " m", mid.x, mid.y + 18, "#f2e6a8", 11, "center"); const tp = MK.proj(S, 4.2, c.h / 2, 0); B.pill(c.h + " m", tp.x + 8, tp.y, "#9ad0ff", 11); },
    hud(s, c) { const ang = MK.deg(Math.atan((c.mode === "elev" ? c.h - 1.6 : c.h + 0.8) / c.d)); return [{ title: c.mode === "elev" ? "Angle of elevation" : "Angle of depression", lines: ["tan θ = opposite / adjacent", c.mode === "elev" ? `= (${c.h} − 1.6) / ${c.d}` : `= (${c.h} + 1.6 − 0.8) / ${c.d}`, [`θ = ${f(ang, 2)}°`, null, true], c.mode === "elev" ? "eye height 1.6 m above the ground" : "eye 1.6 m above the roof, boat deck 0.8 m"] }]; },
    readouts(s, c) { const ang = MK.deg(Math.atan((c.mode === "elev" ? c.h - 1.6 : c.h + 0.8) / c.d)); return [["Angle", f(ang, 2) + "°"], ["Line of sight", f(Math.hypot(c.d, c.mode === "elev" ? c.h - 1.6 : c.h + 0.8), 2) + " m"]]; },
    steps(s, c) { return ["The gold line is the line of sight, the blue line is the horizontal through the eye.", "The angle between them is the angle of elevation (looking up) or depression (looking down).", "Use tan θ = vertical difference ÷ horizontal distance."]; },
    note: "Real-world heights and distances. Include the observer's eye height when the question gives it.",
    mistake: "Ignoring the observer's height when the question states it.",
    draw(g, s, c, B) { B.text("3D unavailable — see the 2D diagram above.", B.area.x + 10, B.area.y + 60, { color: B.P.soft }); },
  });

  /* ================= F-c#3d : bearings at sea ================= */
  function ship(T, P3D, col) { const g = new T.Group(); const hullS = new T.Shape(); hullS.moveTo(-1.6, -0.5); hullS.lineTo(1.2, -0.5); hullS.quadraticCurveTo(2.0, 0, 1.2, 0.5); hullS.lineTo(-1.6, 0.5); hullS.closePath();
    const hull = new T.Mesh(new T.ExtrudeGeometry(hullS, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2 }), P3D.mat.paint(col)); hull.rotation.x = -Math.PI / 2; hull.position.y = 0.05; hull.castShadow = true; g.add(hull);
    const deck = new T.Mesh(new T.BoxGeometry(1.1, 0.5, 0.7), P3D.mat.paint(0xf4f1ea)); deck.position.set(-0.4, 0.95, 0); deck.castShadow = true; g.add(deck);
    const mast = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 1.4, 8), P3D.mat.steel()); mast.position.set(-0.4, 1.8, 0); g.add(mast); return g; }
  MK.def("F-c#3d", {
    kind: "3d", label: "3D lab — bearings at sea", title: "Bearings at sea",
    blurb: "A ship sails two legs on a real sea. North lines, bearing arcs and the return course are drawn as it goes.",
    env: "sea", cam: [[4, 24, 18], [4, 0, -4]], fov: 40, exposure: 1.0, envI: 0.4,
    values: { b1: 60, d1: 8, b2: 150, d2: 6, speed: 1 },
    controls: [{ key: "b1", label: "Leg 1 bearing", min: 0, max: 359, unit: "°" }, { key: "d1", label: "Leg 1 distance", min: 1, max: 12, step: 0.5, unit: "km" }, { key: "b2", label: "Leg 2 bearing", min: 0, max: 359, unit: "°" }, { key: "d2", label: "Leg 2 distance", min: 0, max: 12, step: 0.5, unit: "km" }, { key: "speed", label: "Speed", min: 0.25, max: 3, step: 0.25, unit: "×" }],
    views: [{ label: "Chart (top)", cam: [[0, 60, 2], [0, 0, -4]] }, { label: "Oblique", cam: [[0, 38, 30], [0, 0, -6]] }, { label: "From the ship", cam: [[-6, 4, 10], [0, 0, -6]] }],
    state: () => ({ t: 0 }),
    pts(c) { const k = 2.2, p1 = [c.d1 * Math.sin(R(c.b1)) * k, -c.d1 * Math.cos(R(c.b1)) * k], p2 = [p1[0] + c.d2 * Math.sin(R(c.b2)) * k, p1[1] - c.d2 * Math.cos(R(c.b2)) * k]; return { p1, p2, k }; },
    build(S, s, c) { const T = window.THREE, P3D = window.P3D, U = P3D.util, sc = S.scene;
      const rc = U.cv(512, 512), g = rc.getContext("2d"); g.translate(256, 256); for (let i = 0; i < 32; i++) { const t = i * Math.PI / 16, L = i % 8 === 0 ? 240 : i % 4 === 0 ? 170 : i % 2 === 0 ? 120 : 80; g.strokeStyle = i % 8 === 0 ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.55)"; g.lineWidth = i % 8 === 0 ? 5 : 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(t) * L, -Math.cos(t) * L); g.stroke(); }
      g.fillStyle = "#fff"; g.font = "bold 46px sans-serif"; g.textAlign = "center"; g.fillText("N", 0, -196); g.fillText("S", 0, 230); g.fillText("E", 214, 16); g.fillText("W", -214, 16);
      const rose = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshBasicMaterial({ map: U.tex(rc), transparent: true, opacity: 0.85, depthWrite: false })); rose.rotation.x = -Math.PI / 2; rose.position.y = 0.35; sc.add(rose);
      s.ship = ship(T, P3D, 0xc0392b); sc.add(s.ship); s.buoy = S.mk.cyl(0.5, 0.6, 1.2, P3D.mat.paint(0xffb347), 0, 0.4, 0);
      s.leg1 = S.mk.beam(new T.Vector3(), new T.Vector3(1, 0, 0), 0x7cb3ff, 0.06); s.leg2 = S.mk.beam(new T.Vector3(), new T.Vector3(1, 0, 0), 0x5bd68c, 0.06); s.ret = S.mk.beam(new T.Vector3(), new T.Vector3(1, 0, 0), 0xff7b72, 0.04);
      s.wake = []; for (let i = 0; i < 40; i++) { const sp = S.mk.soft(0xffffff, 0.8, 0, 0.3, 0, 0.0); s.wake.push(sp); } s.wi = 0; s.wt = 0; },
    update(S, s, c, dt) { const T = window.THREE, { p1, p2 } = this.pts(c), L1 = Math.hypot(p1[0], p1[1]), L2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), tot = L1 + L2 + 6; s.t = (s.t + dt * 3 * c.speed) % tot; const d = Math.min(s.t, L1 + L2);
      let x, z, hd; if (d <= L1) { const k = L1 ? d / L1 : 0; x = p1[0] * k; z = p1[1] * k; hd = c.b1; } else { const k = L2 ? (d - L1) / L2 : 0; x = p1[0] + (p2[0] - p1[0]) * k; z = p1[1] + (p2[1] - p1[1]) * k; hd = c.b2; }
      s.ship.position.set(x, 0.1 + Math.sin(S.t * 2) * 0.06, z); s.ship.rotation.y = Math.PI / 2 - R(hd); s.ship.rotation.z = Math.sin(S.t * 1.6) * 0.03;
      S.setBeam(s.leg1, new T.Vector3(0, 0.3, 0), new T.Vector3(p1[0], 0.3, p1[1])); S.setBeam(s.leg2, new T.Vector3(p1[0], 0.3, p1[1]), new T.Vector3(p2[0], 0.3, p2[1])); S.setBeam(s.ret, new T.Vector3(p2[0], 0.32, p2[1]), new T.Vector3(0, 0.32, 0)); s.ret.visible = s.t >= L1 + L2;
      s.wt += dt; if (s.wt > 0.08 && s.t < L1 + L2) { s.wt = 0; const w = s.wake[s.wi++ % s.wake.length]; w.position.set(x, 0.3, z); w.material.opacity = 0.7; w.scale.setScalar(0.6); }
      s.wake.forEach((w) => { w.material.opacity = Math.max(0, w.material.opacity - dt * 0.35); w.scale.multiplyScalar(1 + dt * 0.6); });
      const cxm = (p1[0] + p2[0]) / 3, czm = (p1[1] + p2[1]) / 3, ext = Math.max(8, Math.hypot(p1[0] - cxm, p1[1] - czm), Math.hypot(p2[0] - cxm, p2[1] - czm), Math.hypot(cxm, czm)); S.aim([cxm + ext * 0.35, 0, czm], ext * 2.6 + 6, 0, 0.95);
      s.p1 = p1; s.p2 = p2; },
    overlay(ctx, s, c, S, B) { if (!s.p1) return; const O = MK.proj(S, 0, 0.3, 0), A = MK.proj(S, s.p1[0], 0.3, s.p1[1]), Bq = MK.proj(S, s.p2[0], 0.3, s.p2[1]), N0 = MK.proj(S, 0, 0.3, -5), NA = MK.proj(S, s.p1[0], 0.3, s.p1[1] - 5);
      B.arrow(O.x, O.y, N0.x, N0.y, "#e8f1ff", 1.6, 8); B.arrow(A.x, A.y, NA.x, NA.y, "#e8f1ff", 1.6, 8); B.pill("O", O.x - 22, O.y + 6, "#e8f1ff", 11); B.pill("A", A.x + 8, A.y + 6, "#7cb3ff", 11); B.pill("B", Bq.x + 8, Bq.y + 6, "#5bd68c", 11);
      const r = MK.scenes["F-c"].calc(c); B.pill(`bearing of B from O: ${MK.bearing3(r.brg)}  ·  OB = ${f(r.dist, 2)} km`, 12, 386, "#ffd27a", 11); },
    hud(s, c) { return MK.scenes["F-c"].hud(s, c); }, readouts(s, c) { return MK.scenes["F-c"].readouts(s, c); }, steps(s, c) { return MK.scenes["F-c"].steps(s, c); },
    note: "Bearings are measured clockwise from north and written with three figures.", mistake: "Forgetting to draw a fresh north line at each turning point.",
    draw(g, s, c, B) { B.text("3D unavailable — use the 2D chart above.", B.area.x + 10, B.area.y + 60, { color: B.P.soft }); },
  });

  /* ================= H-B(i)#3d : dice ================= */
  function dieMats(T, U) { const pips = { 1: [[0.5, 0.5]], 2: [[0.28, 0.28], [0.72, 0.72]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]], 5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]], 6: [[0.28, 0.25], [0.72, 0.25], [0.28, 0.5], [0.72, 0.5], [0.28, 0.75], [0.72, 0.75]] };
    const face = (n) => { const c = U.cv(256, 256), g = c.getContext("2d"); const gr = g.createRadialGradient(128, 110, 30, 128, 128, 190); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#e7e3da"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); pips[n].forEach(([x, y]) => { const r2 = g.createRadialGradient(x * 256 - 4, y * 256 - 4, 2, x * 256, y * 256, 22); r2.addColorStop(0, n === 1 ? "#d33" : "#333"); r2.addColorStop(1, n === 1 ? "#7a1010" : "#000"); g.fillStyle = r2; g.beginPath(); g.arc(x * 256, y * 256, 20, 0, Math.PI * 2); g.fill(); }); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return new T.MeshPhysicalMaterial({ map: t, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2 }); };
    return [3, 4, 1, 6, 2, 5].map(face); }                           // box faces +x,−x,+y,−y,+z,−z (opposite faces sum to 7)
  const UPQ = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 2: [-Math.PI / 2, 0, 0], 5: [Math.PI / 2, 0, 0], 3: [0, 0, Math.PI / 2], 4: [0, 0, -Math.PI / 2] };
  MK.def("H-B(i)#3d", {
    kind: "3d", label: "3D lab — rolling real dice", title: "Experimental probability (dice)",
    blurb: "Glossy dice tumble on a felt table. Roll once or a hundred times and watch the relative frequencies settle towards the theoretical values.",
    env: "mathdesk", cam: [[-2.6, 7.2, 8.4], [-2.4, 0.4, 0]], fov: 38, exposure: 1.05,
    values: { dice: 1, target: 6 },
    controls: [{ type: "tabs", key: "dice", label: "Experiment", options: [[1, "One die"], [2, "Two dice (sum)"]] }, { key: "target", label: "Event: score / sum =", min: 1, max: 12 }],
    actions: [{ label: "🎲 Roll once", run: (s) => { s.req = 1; } }, { label: "Roll ×10", run: (s) => { s.req = 10; } }, { label: "Roll ×100", run: (s) => { s.req = 100; } }, { label: "Clear tally", run: (s) => { s.tally = {}; s.n = 0; s.hist = []; } }],
    state: () => ({ tally: {}, n: 0, hist: [], req: 0 }),
    onChange(s, c, k) { if (k === "dice") { s.tally = {}; s.n = 0; s.hist = []; } },
    build(S, s, c) { const T = window.THREE, P3D = window.P3D, U = P3D.util; const mats = dieMats(T, U); s.dice = [0, 1].map((i) => { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), mats); m.castShadow = true; S.scene.add(m); m.position.set(-3.6 + i * 2.2, 0.5, 0); return { m, anim: 0, from: new T.Quaternion(), to: new T.Quaternion(), val: 1, x0: 0, x1: 0 }; });
      const felt = new T.Mesh(new T.CircleGeometry(4.2, 64), P3D.mat.matte(0x1d6b45, 0.95)); felt.rotation.x = -Math.PI / 2; felt.position.set(-2.5, 0.01, 0); felt.receiveShadow = true; S.scene.add(felt); },
    roll(s, c, animate) { const T = window.THREE, vals = []; for (let i = 0; i < c.dice; i++) vals.push(1 + Math.floor(Math.random() * 6)); const sum = vals.reduce((a, b) => a + b, 0); s.tally[sum] = (s.tally[sum] || 0) + 1; s.n++; s.hist.push(s.tally[c.target] / s.n); if (s.hist.length > 300) s.hist.shift();
      if (animate) s.dice.forEach((d, i) => { if (i >= c.dice) return; d.val = vals[i]; d.from.copy(d.m.quaternion); const e = UPQ[vals[i]]; const qUp = new T.Quaternion().setFromEuler(new T.Euler(e[0], e[1], e[2])); const yaw = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.random() * Math.PI * 2); d.to.copy(yaw.multiply(qUp)); d.anim = 1; d.spin = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); }); s.last = vals; },
    update(S, s, c, dt) { const T = window.THREE; if (s.req) { if (s.req === 1) this.roll(s, c, true); else { for (let i = 0; i < s.req - 1; i++) this.roll(s, c, false); this.roll(s, c, true); } s.req = 0; }
      s.dice.forEach((d, i) => { d.m.visible = i < c.dice; if (d.anim > 0) { d.anim = Math.max(0, d.anim - dt * 0.9); const k = 1 - d.anim, h = Math.sin(k * Math.PI) * 2.2 * (1 - k * 0.4); d.m.position.y = 0.5 + Math.abs(h); const tumble = new T.Quaternion().setFromAxisAngle(d.spin, d.anim * 14); d.m.quaternion.copy(d.from).slerp(d.to, k * k).premultiply(tumble); if (d.anim === 0) d.m.quaternion.copy(d.to); } }); },
    theo(c, v) { if (c.dice === 1) return v >= 1 && v <= 6 ? 1 / 6 : 0; return v >= 2 && v <= 12 ? (6 - Math.abs(7 - v)) / 36 : 0; },
    overlay(ctx, s, c, S, B) { const x = 330, y = 230, w = 296, h = 150; B.panel(x - 8, y - 20, w + 16, h + 40); const lo = c.dice === 1 ? 1 : 2, hi = c.dice === 1 ? 6 : 12, n = hi - lo + 1, bw = w / n, mx = c.dice === 1 ? 0.4 : 0.25;
      for (let v = lo; v <= hi; v++) { const rf = s.n ? (s.tally[v] || 0) / s.n : 0, th = this.theo(c, v), bx = x + (v - lo) * bw; ctx.fillStyle = v === c.target ? "rgba(255,210,122,.9)" : "rgba(124,179,255,.85)"; ctx.fillRect(bx + 2, y + h - rf / mx * h, bw - 4, rf / mx * h); ctx.fillStyle = "#ff7b72"; ctx.fillRect(bx + 2, y + h - th / mx * h - 1, bw - 4, 2); B.text(String(v), bx + bw / 2, y + h + 13, { align: "center", size: 9.5, color: "#a9b6d3", halo: false }); }
      B.text("relative frequency (bars) vs theoretical (red)", x, y - 6, { size: 10, color: "#e8f1ff", halo: false }); if (s.last) B.pill("last roll: " + s.last.join(" + ") + (c.dice > 1 ? " = " + s.last.reduce((a, b) => a + b, 0) : ""), 12, 386, "#ffd27a", 11); },
    hud(s, c) { const th = this.theo(c, c.target), rf = s.n ? (s.tally[c.target] || 0) / s.n : 0; return [{ title: "Probability", lines: [`event: ${c.dice === 1 ? "score" : "sum"} = ${c.target}`, `theoretical P = ${MK.toFr(th).str()} = ${f(th, 4)}`, `experimental = ${s.tally[c.target] || 0}/${s.n} = ${f(rf, 4)}`, s.n ? `difference ${f(Math.abs(rf - th), 4)}` : "roll the dice to start"] }]; },
    readouts(s, c) { return [["Rolls", s.n], ["Event count", s.tally[c.target] || 0], ["Relative frequency", s.n ? f((s.tally[c.target] || 0) / s.n, 4) : "—"]]; },
    steps(s, c) { const th = this.theo(c, c.target); return [c.dice === 1 ? "A fair die has 6 equally likely outcomes." : "Two dice have 6 × 6 = 36 equally likely outcomes.", `Favourable outcomes for the event: ${c.dice === 1 ? (th ? 1 : 0) : Math.round(th * 36)}`, `Theoretical probability = ${MK.toFr(th).str()}`, "Experimental probability = number of successes ÷ number of trials; it approaches the theoretical value as the trials increase."]; },
    note: "Experimental probability (relative frequency) compared with theoretical probability for equally likely outcomes.", mistake: "Expecting exactly 10 sixes in 60 rolls — that is only the expected number.",
    draw(g, s, c, B) { B.text("3D unavailable — use the 2D probability simulator above.", B.area.x + 10, B.area.y + 60, { color: B.P.soft }); },
  });
})();
