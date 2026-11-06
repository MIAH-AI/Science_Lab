/* physics3d.js — shared photorealistic 3D engine for the Physics lab.
   Needs vendor/three.bundle.js (window.THREE). Scenes are registered per simulation by modeName in P3D.scenes.
   The 2D canvas (#cv) stays on top as a transparent HUD for graphs, labels, vectors and units.
   If WebGL is unavailable the lab falls back to its original 2D drawing, so nothing is lost. */
(function () {
  "use strict";
  const T = window.THREE;
  const P3D = (window.P3D = { ready: false, scenes: {}, S: null });
  if (!T) return;
  try {
    const t = document.createElement("canvas");
    if (!(t.getContext("webgl2") || t.getContext("webgl"))) return;
  } catch (e) { return; }
  P3D.ready = true;

  const TAU = Math.PI * 2, V3 = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------------- procedural textures ---------------- */
  function cv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function tex(c, rep, aniso) {
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping;
    if (rep) t.repeat.set(rep[0], rep[1]); t.anisotropy = aniso || 16; return t;
  }
  function woodCanvas() {
    const c = cv(512, 512), g = c.getContext("2d");
    g.fillStyle = "#b78a5b"; g.fillRect(0, 0, 512, 512);
    for (let p = 0; p < 4; p++) {                       // planks
      const y0 = p * 128, tone = rnd(-14, 14);
      g.fillStyle = `rgb(${183 + tone},${137 + tone},${92 + tone})`; g.fillRect(0, y0, 512, 128);
      for (let i = 0; i < 90; i++) {
        const y = y0 + rnd(0, 128), a = rnd(0.04, 0.2);
        g.strokeStyle = `rgba(${70 + rnd(0, 30)},${40 + rnd(0, 20)},20,${a})`; g.lineWidth = rnd(0.6, 2.2);
        g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.03 + i) * rnd(0.5, 2.2)); g.stroke();
      }
      g.fillStyle = "rgba(40,22,10,.55)"; g.fillRect(0, y0, 512, 2);
    }
    return c;
  }
  function benchCanvas() {                               // light grey-blue laminate lab bench
    const c = cv(512, 512), g = c.getContext("2d");
    g.fillStyle = "#c9ced6"; g.fillRect(0, 0, 512, 512);
    const im = g.getImageData(0, 0, 512, 512), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0);
    g.strokeStyle = "rgba(90,100,115,.35)"; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512);
    return c;
  }
  function grassCanvas() {
    const c = cv(512, 512), g = c.getContext("2d");
    g.fillStyle = "#4f7d36"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      const x = rnd(0, 512), y = rnd(0, 512), s = rnd(2, 14), l = rnd(-22, 26);
      g.fillStyle = `rgba(${70 + l},${120 + l * 1.4},${40 + l * 0.5},${rnd(0.15, 0.5)})`; g.beginPath(); g.ellipse(x, y, s, s * rnd(0.3, 1), rnd(0, 3), 0, TAU); g.fill();
    }
    for (let i = 0; i < 7000; i++) {
      const x = rnd(0, 512), y = rnd(0, 512); g.strokeStyle = `rgba(${40 + rnd(0, 50)},${90 + rnd(0, 80)},${30 + rnd(0, 30)},.35)`;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-2, 2), y - rnd(3, 9)); g.stroke();
    }
    return c;
  }
  function concreteCanvas() {
    const c = cv(256, 256), g = c.getContext("2d"); g.fillStyle = "#8d9096"; g.fillRect(0, 0, 256, 256);
    const im = g.getImageData(0, 0, 256, 256), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 38; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0); return c;
  }
  function softDot(size, color) {
    const c = cv(size, size), g = c.getContext("2d"), r = size / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, color || "rgba(255,255,255,1)"); gr.addColorStop(0.35, (color || "rgba(255,255,255,1)").replace(/[\d.]+\)$/, "0.5)"));
    gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, size, size);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function rulerCanvas(len, unit) {                      // len in units; 1 unit = 1 cm at 64 px
    const w = 64 * len, c = cv(Math.min(4096, w), 96), g = c.getContext("2d"), k = c.width / len;
    g.fillStyle = "#f2e6a8"; g.fillRect(0, 0, c.width, 96); g.fillStyle = "#2b2b2b"; g.font = "bold 26px sans-serif"; g.textAlign = "center";
    for (let i = 0; i <= len * 10; i++) {
      const x = i * k / 10, big = i % 10 === 0, mid = i % 5 === 0;
      g.fillRect(x, 0, big ? 3 : 2, big ? 44 : mid ? 32 : 20); if (big && i < len * 10) g.fillText(String(i / 10), x + 14, 78);
    }
    return tex(c, [1, 1]);
  }
  function graphPaperCanvas() {
    const c = cv(256, 256), g = c.getContext("2d"); g.fillStyle = "#f4f6f1"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i <= 256; i += 12.8) { g.strokeStyle = (Math.round(i / 12.8) % 5 === 0) ? "rgba(200,70,60,.45)" : "rgba(210,120,110,.22)"; g.lineWidth = 1; g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    return c;
  }

  /* ---------------- materials ---------------- */
  const M = (P3D.mat = {
    steel: () => new T.MeshPhysicalMaterial({ color: 0xc8ccd2, metalness: 1, roughness: 0.28 }),
    chrome: () => new T.MeshPhysicalMaterial({ color: 0xf2f4f7, metalness: 1, roughness: 0.06, clearcoat: 1 }),
    brass: () => new T.MeshPhysicalMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.22 }),
    gold: () => new T.MeshPhysicalMaterial({ color: 0xffc83d, metalness: 1, roughness: 0.14 }),
    copper: () => new T.MeshPhysicalMaterial({ color: 0xc8703f, metalness: 1, roughness: 0.25 }),
    aluminium: () => new T.MeshPhysicalMaterial({ color: 0xd6d9de, metalness: 1, roughness: 0.4 }),
    iron: () => new T.MeshPhysicalMaterial({ color: 0x4b4f57, metalness: 0.9, roughness: 0.5 }),
    rubber: () => new T.MeshStandardMaterial({ color: 0x1a1b1d, metalness: 0, roughness: 0.92 }),
    plastic: (col, r) => new T.MeshPhysicalMaterial({ color: col, metalness: 0, roughness: r == null ? 0.35 : r, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    matte: (col, r) => new T.MeshStandardMaterial({ color: col, metalness: 0, roughness: r == null ? 0.85 : r }),
    paint: (col) => new T.MeshPhysicalMaterial({ color: col, metalness: 0.1, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 }),
    glass: (col) => new T.MeshPhysicalMaterial({ color: col || 0xe8f6ff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, side: T.DoubleSide, depthWrite: false }),
    water: (col) => new T.MeshPhysicalMaterial({ color: col || 0x3d9fd6, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.52, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4, depthWrite: false }),
    glow: (col, op) => new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op == null ? 1 : op, blending: T.AdditiveBlending, depthWrite: false }),
    emissive: (col, k) => new T.MeshStandardMaterial({ color: 0x111111, emissive: col, emissiveIntensity: k || 2, roughness: 0.4 }),
    wood: () => new T.MeshStandardMaterial({ map: tex(woodCanvas(), [2, 1]), roughness: 0.55, metalness: 0 }),
    ceramic: (col) => new T.MeshPhysicalMaterial({ color: col || 0xf4f1ea, roughness: 0.18, clearcoat: 1 }),
  });

  /* ---------------- lifecycle ---------------- */
  let S = null, envCache = null;

  P3D.begin = function (variant, sc, cv2d) {
    P3D.end();
    const wrap = cv2d.parentElement, dpr = Math.min(2, window.devicePixelRatio || 1);
    const c3 = document.createElement("canvas"); c3.id = "cv3d";
    c3.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    wrap.insertBefore(c3, cv2d); wrap.classList.add("real");
    cv2d.style.cssText = "position:relative;z-index:2;pointer-events:none;";
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas: c3, antialias: true, powerPreference: "high-performance" }); }
    catch (e) { c3.remove(); wrap.classList.remove("real"); return false; }
    renderer.setPixelRatio(dpr); renderer.setSize(640, 400, false);
    renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = sc.exposure || 1;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    const scene = new T.Scene();
    const pm = new T.PMREMGenerator(renderer);
    const rm = new T.RoomEnvironment();
    scene.environment = pm.fromScene(rm, 0.04).texture; scene.environmentIntensity = sc.envI == null ? 0.55 : sc.envI;
    rm.dispose && rm.dispose();
    const camera = new T.PerspectiveCamera(sc.fov || 38, 640 / 400, 0.05, 400);
    S = P3D.S = {
      T, renderer, scene, camera, wrap, c3, cv2d, sc, variant, t: 0, objs: {}, anims: [], pm,
      orbit: { yaw: 0, pitch: 0.3, r: 8, target: V3(), ty: 0, tp: 0, tr: 8, dragging: false },
      mat: M, mk: null, proj: null, userMoved: false,
    };
    makeBuilders(S); makeCamera(S);
    S.setCam = (pos, target) => {
      const o = S.orbit, tg = V3(...target), d = V3(...pos).sub(tg);
      o.target.copy(tg); o.r = o.tr = d.length(); o.yaw = o.ty = Math.atan2(d.x, d.z); o.pitch = o.tp = Math.asin(d.y / o.r);
      o.home = { yaw: o.yaw, pitch: o.pitch, r: o.r, target: tg.clone() };
    };
    S.setCam(...(sc.cam || [[0, 2.2, 7], [0, 1, 0]]));
    S.orbit.free = !!sc.free;
    (P3D.envs[sc.env || "lab"] || P3D.envs.lab)(S, sc.envOpts || {});
    sc.build && sc.build(S, variant.state, variant.values);
    return true;
  };

  P3D.end = function () {
    if (!S) return;
    S.cleanup && S.cleanup();
    S.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); }); }
    });
    if (S.scene.environment) S.scene.environment.dispose();
    S.pm.dispose(); S.renderer.dispose(); try { S.renderer.forceContextLoss(); } catch (e) { }
    S.wrap.removeEventListener("pointerdown", S._pd); S.wrap.removeEventListener("wheel", S._wh); S.wrap.removeEventListener("dblclick", S._dc);
    window.removeEventListener("pointermove", S._pm); window.removeEventListener("pointerup", S._pu);
    S.c3.remove(); S.wrap.classList.remove("real"); S.cv2d.style.cssText = ""; S.wrap.classList.remove("grabbing");
    const hint = S.wrap.querySelector(".orbit-hint"); if (hint) hint.remove();
    S = P3D.S = null;
  };

  P3D.frame = function (dt, run, ts) {
    if (!S) return; const sdt = run === false ? 0 : dt; S.t += sdt;
    const o = S.orbit, k = 1 - Math.pow(0.0008, dt);
    o.yaw += (o.ty - o.yaw) * k; o.pitch += (o.tp - o.pitch) * k; o.r += (o.tr - o.r) * k;
    const cp = Math.cos(o.pitch);
    S.camera.position.set(o.target.x + o.r * Math.sin(o.yaw) * cp, o.target.y + o.r * Math.sin(o.pitch), o.target.z + o.r * Math.cos(o.yaw) * cp);
    S.camera.lookAt(o.target); S.camera.updateMatrixWorld();
    const vdt = sdt * (ts || 1);
    S.sc.update && S.sc.update(S, S.variant.state, S.variant.values, vdt);
    if (vdt) for (const a of S.anims) a(vdt, S.t);
    S.renderer.render(S.scene, S.camera);
  };

  /* project a world point to the 640x400 HUD canvas */
  function makeCamera(S) {
    const v = V3();
    S.proj = function (p) {
      v.set(p.x, p.y, p.z).project(S.camera);
      return { x: (v.x * 0.5 + 0.5) * 640, y: (-v.y * 0.5 + 0.5) * 400, z: v.z };
    };
    const o = S.orbit, wrap = S.wrap;
    const hint = document.createElement("span"); hint.className = "orbit-hint"; hint.textContent = "⟳ drag to orbit · scroll to zoom"; wrap.appendChild(hint);
    let lx = 0, ly = 0;
    S._pd = (e) => { if (e.button > 0) return; o.touched = true; o.dragging = true; lx = e.clientX; ly = e.clientY; wrap.classList.add("grabbing"); hint.style.opacity = 0; };
    S._pm = (e) => {
      if (!o.dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      o.ty -= dx * 0.008; if (e.pointerType !== "touch") o.tp = Math.max(o.free ? -1.4 : 0.03, Math.min(1.45, o.tp + dy * 0.006));
    };
    S._pu = () => { o.dragging = false; wrap.classList.remove("grabbing"); };
    S._wh = (e) => { e.preventDefault(); o.touched = true; o.tr = Math.max(o.home.r * 0.35, Math.min(o.home.r * 2.2, o.tr * (1 + Math.sign(e.deltaY) * 0.08))); };
    S._dc = () => { o.touched = false; o.ty = o.home.yaw; o.tp = o.home.pitch; o.tr = o.home.r; };
    wrap.addEventListener("pointerdown", S._pd); window.addEventListener("pointermove", S._pm); window.addEventListener("pointerup", S._pu);
    wrap.addEventListener("wheel", S._wh, { passive: false }); wrap.addEventListener("dblclick", S._dc);
  }

  /* ---------------- environments ---------------- */
  P3D.envs = {};
  function sun(S, pos, intensity, color, area, shadowSize) {
    const l = new T.DirectionalLight(color || 0xfff1dc, intensity); l.position.set(...pos); l.castShadow = true;
    l.shadow.mapSize.set(shadowSize || 2048, shadowSize || 2048); const a = area || 8;
    Object.assign(l.shadow.camera, { left: -a, right: a, top: a, bottom: -a, near: 0.5, far: 60 }); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; l.shadow.radius = 3;
    S.scene.add(l); S.scene.add(l.target); S.sunLight = l; return l;
  }
  P3D.envs.lab = function (S, o) {
    const sc = S.scene; sc.background = new T.Color(0x1d2230); sc.fog = new T.Fog(0x1d2230, 18, 46);
    const bw = o.w || 16, bd = o.d || 9;
    const top = new T.Mesh(new T.BoxGeometry(bw, 0.3, bd), o.steelTop ? M.matte(0x2b3039, 0.35) : new T.MeshStandardMaterial({ map: tex(o.dark ? benchCanvas() : woodCanvas(), [bw / 4, bd / 4]), roughness: o.dark ? 0.5 : 0.5 }));
    if (o.dark) { top.material.color = new T.Color(0x3a3f4a); }
    top.position.y = -0.15; top.receiveShadow = true; sc.add(top); S.objs.bench = top;
    const edge = new T.Mesh(new T.BoxGeometry(bw + 0.05, 0.05, bd + 0.05), M.matte(0x16181d, 0.6)); edge.position.y = -0.31; sc.add(edge);
    const wallH = 9, wc = cv(8, 256), wg = wc.getContext("2d"), gr = wg.createLinearGradient(0, 0, 0, 256);
    const wcol = new T.Color(o.wall || 0x46526e); gr.addColorStop(0, "#" + wcol.clone().multiplyScalar(0.45).getHexString()); gr.addColorStop(0.6, "#" + wcol.getHexString()); gr.addColorStop(1, "#" + wcol.clone().multiplyScalar(1.25).getHexString());
    wg.fillStyle = gr; wg.fillRect(0, 0, 8, 256);
    const wall = new T.Mesh(new T.PlaneGeometry(44, wallH), new T.MeshStandardMaterial({ map: tex(wc), roughness: 0.92 }));
    wall.position.set(0, wallH / 2 - 0.3, -bd / 2 - 0.2); wall.receiveShadow = true; sc.add(wall);
    const skirt = new T.Mesh(new T.BoxGeometry(44, 0.35, 0.12), M.matte(0x151a24, 0.5)); skirt.position.set(0, -0.12, -bd / 2 - 0.12); sc.add(skirt);
    sc.add(new T.HemisphereLight(0xcfe0ff, 0x3a2a1a, o.hemi == null ? 0.32 : o.hemi));
    sun(S, o.sunPos || [-5, 9, 6], o.sun == null ? 3.1 : o.sun, 0xfff2e0, o.shadowArea || 9);
    if (!o.dark) { const sp = new T.SpotLight(0xfff0d8, 260, 40, 0.75, 0.9, 1.4); sp.position.set(2, 11, 5); sp.target.position.set(0, 1.5, -bd / 2); sc.add(sp, sp.target); }
    const rim = new T.DirectionalLight(0x7fb4ff, 0.7); rim.position.set(6, 4, -5); sc.add(rim);
  };
  P3D.envs.dark = function (S, o) { P3D.envs.lab(S, Object.assign({ dark: true, wall: 0x0c0f16, hemi: 0.12, sun: 0.5, sunPos: [0, 10, 3] }, o)); S.scene.background = new T.Color(0x05070b); S.scene.fog = new T.Fog(0x05070b, 12, 30); S.scene.environmentIntensity = 0.12; };
  P3D.envs.outdoor = function (S, o) {
    const sc = S.scene;
    const sky = new T.Mesh(new T.SphereGeometry(300, 32, 16), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color(o.top || 0x2f6fc2) }, hor: { value: new T.Color(o.hor || 0xcfe5f4) }, sd: { value: V3(-0.5, 0.45, -0.7).normalize() } },
      vertexShader: "varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "varying vec3 vP;uniform vec3 top;uniform vec3 hor;uniform vec3 sd;void main(){float h=clamp(vP.y,0.,1.);vec3 c=mix(hor,top,pow(h,.55));float s=max(dot(vP,sd),0.);c+=vec3(1.,.85,.6)*(pow(s,900.)*3.+pow(s,24.)*.28);gl_FragColor=vec4(c,1.);}"
    }));
    sc.add(sky); sc.background = new T.Color(0xcfe5f4); sc.fog = new T.Fog(0xcfe5f4, 40, 220);
    const gtex = tex(grassCanvas(), [60, 60]);
    const g = new T.Mesh(new T.PlaneGeometry(600, 600, 1, 1), new T.MeshStandardMaterial({ map: gtex, roughness: 1, color: o.ground || 0xffffff }));
    g.rotation.x = -Math.PI / 2; g.position.y = -0.01; g.receiveShadow = true; sc.add(g); S.objs.ground = g; S.objs.skyMat = sky.material;
    sc.add(new T.HemisphereLight(0xbfe0ff, 0x4d6b35, 0.75));
    sun(S, [-18, 26, -14], 3.0, 0xfff0d8, o.shadowArea || 24, 2048);
    const treeGrp = new T.Group(); sc.add(treeGrp); S.objs.trees = treeGrp;
    const rnd2 = (() => { let q = 11; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
    const leaf = [0x2b5a2c, 0x35692f, 0x2a4f33, 0x3f7434];
    for (let i = 0; i < 46; i++) {                                           // tree line behind the action; the foreground corridor stays clear
      const x = -70 + rnd2() * 380, z = -(34 + rnd2() * 110), h = 5 + rnd2() * 8, round = rnd2() > 0.55, tr = new T.Group();
      const trunk = new T.Mesh(new T.CylinderGeometry(0.28, 0.45, h * 0.45, 7), M.matte(0x5a3d26)); trunk.position.y = h * 0.22; trunk.castShadow = true; tr.add(trunk);
      const lm = M.matte(leaf[(rnd2() * 4) | 0], 0.95);
      if (round) { for (let k = 0; k < 4; k++) { const b2 = new T.Mesh(new T.IcosahedronGeometry(h * (0.2 + rnd2() * 0.1), 1), lm); b2.position.set((rnd2() - 0.5) * h * 0.3, h * (0.55 + rnd2() * 0.3), (rnd2() - 0.5) * h * 0.3); b2.castShadow = true; tr.add(b2); } }
      else { const cone = new T.Mesh(new T.ConeGeometry(h * 0.3, h * 0.95, 9), lm); cone.position.y = h * 0.78; cone.castShadow = true; tr.add(cone); }
      tr.position.set(x, 0, z); treeGrp.add(tr);
    }
    for (let i = 0; i < 9; i++) {                                           // soft clouds
      const sp = new T.Sprite(new T.SpriteMaterial({ map: softDot(128, "rgba(255,255,255,1)"), transparent: true, opacity: 0.85, fog: false, depthWrite: false }));
      sp.scale.set(rnd(60, 110), rnd(14, 26), 1); sp.position.set(rnd(-180, 120), rnd(60, 110), rnd(-220, -80)); sc.add(sp);
    }
  };
  P3D.envs.space = function (S, o) {
    const sc = S.scene; sc.background = new T.Color(0x02030a); sc.fog = null; S.renderer.toneMappingExposure = 1.1; sc.environmentIntensity = 0.04;
    const n = 2600, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = rnd(-1, 1), a = rnd(0, TAU), r = Math.sqrt(1 - u * u) * 180; pos.set([Math.cos(a) * r, u * 180, Math.sin(a) * r], i * 3); const b = rnd(0.5, 1); col.set([b, b * rnd(0.85, 1), b], i * 3); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("color", new T.BufferAttribute(col, 3));
    sc.add(new T.Points(g, new T.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, fog: false })));
    const l = new T.DirectionalLight(0xfff4e6, 3.4); l.position.set(40, 14, 28); sc.add(l); sc.add(new T.AmbientLight(0x1a2440, 0.35)); S.sunLight = l;
  };
  P3D.envs.tank = function (S, o) { P3D.envs.lab(S, Object.assign({ wall: 0x243049 }, o)); };
  P3D.envs.void = function (S, o) { S.scene.background = new T.Color(o.bg || 0x070a12); S.scene.add(new T.HemisphereLight(0xaac4ff, 0x202030, 0.6)); sun(S, [3, 8, 6], 2.0, 0xffffff, 8); S.scene.environmentIntensity = 0.5; };

  /* ---------------- builders ---------------- */
  function makeBuilders(S) {
    const sc = S.scene, add = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; sc.add(m); return m; };
    const mk = (S.mk = {});
    mk.add = add;
    mk.sphere = (r, mat, x = 0, y = 0, z = 0) => { const m = add(new T.Mesh(new T.SphereGeometry(r, 48, 32), mat)); m.position.set(x, y, z); return m; };
    mk.box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = add(new T.Mesh(new T.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); return m; };
    mk.rbox = (w, h, d, r, mat, x = 0, y = 0, z = 0) => {            // rounded-edge box
      const s = new T.Shape(), hw = w / 2, hd = d / 2; r = Math.min(r, hw, hd);
      s.moveTo(-hw + r, -hd); s.lineTo(hw - r, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + r); s.lineTo(hw, hd - r); s.quadraticCurveTo(hw, hd, hw - r, hd); s.lineTo(-hw + r, hd); s.quadraticCurveTo(-hw, hd, -hw, hd - r); s.lineTo(-hw, -hd + r); s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
      const g = new T.ExtrudeGeometry(s, { depth: h - 2 * Math.min(r, h / 4), bevelEnabled: true, bevelThickness: Math.min(r, h / 4), bevelSize: Math.min(r, h / 4) * 0.8, bevelSegments: 3, curveSegments: 6 });
      g.rotateX(-Math.PI / 2); g.computeBoundingBox(); const b = g.boundingBox; g.translate(0, -b.min.y - h / 2, 0);
      const m = add(new T.Mesh(g, mat)); m.position.set(x, y, z); return m;
    };
    mk.cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 40) => { const m = add(new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), mat)); m.position.set(x, y, z); return m; };
    mk.cone = (r, h, mat, x = 0, y = 0, z = 0, seg = 36) => { const m = add(new T.Mesh(new T.ConeGeometry(r, h, seg), mat)); m.position.set(x, y, z); return m; };
    mk.torus = (R, r, mat, x = 0, y = 0, z = 0) => { const m = add(new T.Mesh(new T.TorusGeometry(R, r, 20, 64), mat)); m.position.set(x, y, z); return m; };
    mk.plane = (w, h, mat, x = 0, y = 0, z = 0) => { const m = add(new T.Mesh(new T.PlaneGeometry(w, h), mat), false, true); m.position.set(x, y, z); return m; };
    const UP = V3(0, 1, 0), tq = new T.Quaternion(), td = V3();
    /* cylinder between two points; cheap to update */
    mk.rod = (a, b, r, mat, seg = 16) => {
      const g = new T.CylinderGeometry(r, r, 1, seg); const m = add(new T.Mesh(g, mat)); S.setRod(m, a, b); return m;
    };
    S.setRod = (m, a, b) => {
      td.subVectors(b, a); const L = td.length() || 1e-6; m.position.copy(a).addScaledVector(td, 0.5); m.scale.set(1, L, 1); m.quaternion.copy(tq.setFromUnitVectors(UP, td.multiplyScalar(1 / L)));
    };
    mk.tube = (pts, r, mat, seg = 80, closed = false) => {
      const c = new T.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V3(...p))), closed, "centripetal"); return add(new T.Mesh(new T.TubeGeometry(c, seg, r, 12, closed), mat));
    };
    /* coil spring along +Y, bottom at origin, rest length 1 — scale.y sets length */
    mk.spring = (coils, R, wr, mat) => {
      const pts = [], n = coils * 28; for (let i = 0; i <= n; i++) { const a = i / 28 * TAU; pts.push(V3(Math.cos(a) * R, i / n, Math.sin(a) * R)); }
      const m = add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), n * 2, wr, 10, false), mat)); return m;
    };
    mk.helix = (coils, R, len, wr, mat, axis = "x") => {                // coil winding along an axis
      const pts = [], n = coils * 24; for (let i = 0; i <= n; i++) { const a = i / 24 * TAU, p = i / n * len - len / 2; pts.push(axis === "x" ? V3(p, Math.cos(a) * R, Math.sin(a) * R) : V3(Math.cos(a) * R, p, Math.sin(a) * R)); }
      return add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), n * 2, wr, 8, false), mat));
    };
    mk.arrow = (color, shaft = 0.05, head = 0.16) => {
      const g = new T.Group(), mat = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.4 });
      const s = new T.Mesh(new T.CylinderGeometry(shaft, shaft, 1, 14), mat), h = new T.Mesh(new T.ConeGeometry(head, head * 2.4, 20), mat);
      s.castShadow = true; g.add(s, h); g.userData = { s, h, head }; sc.add(g); return g;
    };
    S.setArrow = (g, from, vec, scale = 1) => {
      const L = vec.length() * scale; g.visible = L > 1e-4; if (!g.visible) return; const d = vec.clone().normalize(), hl = g.userData.head * 2.4, sl = Math.max(0.001, L - hl);
      g.userData.s.scale.set(1, sl, 1); g.userData.s.position.set(0, sl / 2, 0); g.userData.h.position.set(0, sl + hl / 2, 0);
      g.position.copy(from); g.quaternion.setFromUnitVectors(UP, d);
    };
    mk.label3 = null;
    mk.soft = (color, size, x, y, z, op = 1) => {                        // additive glow sprite
      const s = new T.Sprite(new T.SpriteMaterial({ map: P3D.softMap || (P3D.softMap = softDot(128)), color, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
      s.scale.set(size, size, 1); s.position.set(x, y, z); sc.add(s); return s;
    };
    mk.beam = (a, b, color, w = 0.025) => {                              // glowing light ray = bright core + soft halo
      const g = new T.Group(); const core = new T.Mesh(new T.CylinderGeometry(w, w, 1, 8), M.glow(0xffffff, 0.95)), halo = new T.Mesh(new T.CylinderGeometry(w * 3.2, w * 3.2, 1, 10), M.glow(color, 0.28));
      g.add(core, halo); g.userData = { core, halo }; sc.add(g); S.setBeam(g, a, b); return g;
    };
    S.setBeam = (g, a, b) => { td.subVectors(b, a); const L = td.length() || 1e-6; g.position.copy(a).addScaledVector(td, 0.5); g.scale.set(1, L, 1); g.quaternion.copy(tq.setFromUnitVectors(UP, td.multiplyScalar(1 / L))); g.visible = true; };
    mk.ruler = (len, w = 0.5, x = 0, y = 0.02, z = 0) => { const m = add(new T.Mesh(new T.BoxGeometry(len, 0.04, w), [M.matte(0xd9cf93, 0.6), M.matte(0xd9cf93, 0.6), new T.MeshStandardMaterial({ map: rulerCanvas(Math.round(len * 10) / 10 * 1), roughness: 0.5 }), M.matte(0xd9cf93, 0.6), M.matte(0xd9cf93, 0.6), M.matte(0xd9cf93, 0.6)]), false, true); m.position.set(x, y, z); return m; };
    /* shared helpers returning ready-made apparatus */
    mk.bob = (r, mat) => mk.sphere(r, mat || M.chrome());
    mk.beaker = (r, h, level, waterColor) => {                           // glass beaker with water volume; returns group with .water
      const g = new T.Group(), pts = []; const th = 0.03;
      pts.push(new T.Vector2(r - th, 0.02), new T.Vector2(r, 0), new T.Vector2(r + 0.005, 0.02), new T.Vector2(r + 0.005, h), new T.Vector2(r + 0.03, h + 0.025), new T.Vector2(r - th, h), new T.Vector2(r - th, 0.02));
      const gl = new T.Mesh(new T.LatheGeometry(pts, 56), M.glass()); gl.renderOrder = 3; g.add(gl);
      const w = new T.Mesh(new T.CylinderGeometry(r - th - 0.002, r - th - 0.002, 1, 48), M.water(waterColor)); w.renderOrder = 2; g.add(w); g.water = w;
      g.setLevel = (l) => { w.scale.y = Math.max(0.001, l); w.position.y = 0.03 + l / 2; }; g.setLevel(level); sc.add(g); return g;
    };
    mk.bulb = (color = 0xfff0c0, intensity = 8) => {
      const g = new T.Group(); const gl = new T.Mesh(new T.SphereGeometry(0.22, 32, 24), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.03, clearcoat: 1, depthWrite: false }));
      const fil = new T.Mesh(new T.SphereGeometry(0.06, 16, 12), new T.MeshBasicMaterial({ color })), base = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 0.22, 24), M.brass());
      base.position.y = -0.26; fil.position.y = 0; const glow = mk.soft(color, 1.2, 0, 0, 0, 0.7); g.add(gl, fil, base, glow); g.glow = glow; g.fil = fil;
      g.light = new T.PointLight(color, intensity, 7, 1.6); g.light.castShadow = false; g.add(g.light);
      g.setPower = (p) => { p = Math.max(0, Math.min(1.5, p)); g.light.intensity = intensity * p; g.glow.material.opacity = 0.75 * Math.min(1, p); g.glow.scale.setScalar(0.25 + 1.0 * Math.min(1.3, p)); g.fil.material.color.setRGB(0.3 + 0.7 * Math.min(1, p), 0.2 + 0.7 * Math.min(1, p), 0.15 + 0.55 * Math.min(1, p)); };
      sc.add(g); return g;
    };
    mk.stand = (h = 4, x = 0, z = 0) => {                                // retort stand
      const g = new T.Group(); const base = new T.Mesh(new T.BoxGeometry(1.5, 0.12, 0.9), M.matte(0x22262d, 0.45)); base.position.y = 0.06;
      const rod = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, h, 16), M.chrome()); rod.position.set(-0.45, h / 2, 0); base.castShadow = rod.castShadow = true; base.receiveShadow = true; g.add(base, rod); g.position.set(x, 0, z); sc.add(g); return g;
    };
    mk.particles = (n, r, mat) => { const im = new T.InstancedMesh(new T.SphereGeometry(r, 14, 10), mat, n); im.castShadow = false; sc.add(im); im.userData.m = new T.Matrix4(); im.set = (i, x, y, z, s = 1) => { const m = im.userData.m; m.makeScale(s, s, s); m.setPosition(x, y, z); im.setMatrixAt(i, m); }; return im; };
    mk.wheel = (r, w, tireMat, hubMat) => {                              // wheel with axis along Z
      const g = new T.Group(), tire = new T.Mesh(new T.CylinderGeometry(r, r, w, 28), tireMat || M.rubber()), hub = new T.Mesh(new T.CylinderGeometry(r * 0.55, r * 0.55, w * 1.04, 20), hubMat || M.chrome());
      tire.rotation.x = hub.rotation.x = Math.PI / 2; tire.castShadow = true;
      const spoke = new T.Mesh(new T.BoxGeometry(r * 1.0, r * 0.14, w * 1.06), M.matte(0x30343b, 0.5)); g.add(tire, hub, spoke); return g;
    };
    mk.car = (color) => {                                                // toy/real-looking car, facing +X; g.wheels[] spin about Z
      const g = new T.Group(), paint = M.paint(color);
      const body = new T.Mesh(new T.BoxGeometry(2.5, 0.5, 1.15), paint); body.position.y = 0.52;
      const hood = new T.Mesh(new T.BoxGeometry(0.8, 0.14, 1.1), paint); hood.position.set(0.85, 0.82, 0);
      const cab = new T.Mesh(new T.BoxGeometry(1.15, 0.42, 1.0), M.glass(0x203040)); cab.position.set(-0.2, 0.98, 0); cab.material.opacity = 0.7;
      const roof = new T.Mesh(new T.BoxGeometry(1.0, 0.07, 0.96), paint); roof.position.set(-0.2, 1.22, 0);
      for (const m of [body, hood, cab, roof]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
      for (const z of [-0.4, 0.4]) { const hl = new T.Mesh(new T.SphereGeometry(0.08, 12, 8), M.emissive(0xfff3c4, 3)); hl.position.set(1.25, 0.6, z); g.add(hl); const tl = new T.Mesh(new T.SphereGeometry(0.06, 12, 8), M.emissive(0xff3030, 1.6)); tl.position.set(-1.25, 0.6, z); g.add(tl); }
      g.wheels = []; for (const x of [-0.85, 0.85]) for (const z of [-0.6, 0.6]) { const w = mk.wheel(0.3, 0.2); w.position.set(x, 0.3, z); g.add(w); g.wheels.push(w); }
      sc.add(g); return g;
    };
    mk.cart = (w, d, color) => {                                         // dynamics trolley, facing +X
      const g = new T.Group(), base = new T.Mesh(new T.BoxGeometry(w, 0.16, d), M.paint(color)); base.position.y = 0.3; base.castShadow = base.receiveShadow = true; g.add(base);
      for (const sx of [-1, 1]) { const b = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.3, 14), M.chrome()); b.rotation.z = Math.PI / 2; b.position.set(sx * (w / 2 + 0.1), 0.3, 0); g.add(b); }
      g.wheels = []; for (const x of [-w * 0.33, w * 0.33]) for (const z of [-d / 2 - 0.02, d / 2 + 0.02]) { const wh = mk.wheel(0.17, 0.1, M.rubber(), M.steel()); wh.position.set(x, 0.17, z); g.add(wh); g.wheels.push(wh); }
      sc.add(g); return g;
    };
    mk.slotted = (m, mat) => { const g = new T.Group(); const n = Math.max(1, Math.min(6, Math.round(m))), h = 0.12; for (let i = 0; i < n; i++) { const d = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, h, 28), mat || M.brass()); d.position.y = h / 2 + i * (h + 0.01); d.castShadow = true; g.add(d); } g.height = n * (h + 0.01); sc.add(g); return g; };
    /* auto-frame the camera on a target unless the user has taken control */
    S.aim = (target, r, yaw, pitch) => {
      const o = S.orbit, tg = V3(...target); o.home.target.copy(tg); o.home.r = r; if (yaw != null) o.home.yaw = yaw; if (pitch != null) o.home.pitch = pitch;
      if (o.touched) return; o.target.lerp(tg, 0.12); o.tr = r; if (yaw != null) o.ty = yaw; if (pitch != null) o.tp = pitch;
    };
    /* dust / smoke / spark puffs */
    const puffs = []; S.puffList = puffs;
    S.puff = (x, y, z, o = {}) => {
      const n = o.n || 10;
      for (let i = 0; i < n; i++) {
        const sp = new T.Sprite(new T.SpriteMaterial({ map: P3D.softMap || (P3D.softMap = softDot(128)), color: o.color || 0xb9a98d, transparent: true, opacity: 0, depthWrite: false }));
        const a = rnd(0, TAU), spd = rnd(0.3, 1) * (o.speed || 2);
        sp.position.set(x, y, z); sp.userData = { vx: Math.cos(a) * spd, vy: rnd(0.3, 1.2) * (o.up == null ? 1.5 : o.up), vz: Math.sin(a) * spd, age: 0, life: o.life || 0.9, size: o.size || 0.7, op: o.op || 0.6, grow: o.grow == null ? 1.8 : o.grow };
        sc.add(sp); puffs.push(sp);
      }
    };
    S.anims.push((dt) => {
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i], u = p.userData; u.age += dt; const k = u.age / u.life;
        if (k >= 1) { sc.remove(p); p.material.dispose(); puffs.splice(i, 1); continue; }
        p.position.x += u.vx * dt; p.position.y += u.vy * dt; p.position.z += u.vz * dt; u.vx *= 0.97; u.vz *= 0.97; u.vy *= 0.96;
        p.scale.setScalar(u.size * (0.5 + k * u.grow)); p.material.opacity = u.op * (1 - k) * Math.min(1, k * 8);
      }
    });
    S.cleanup = null;
  }

  /* HUD helpers shared by all scenes (drawn on the transparent 2D canvas) */
  P3D.hud = {
    pill(ctx, x, y, text, color = "#e8f1ff", size = 11.5, align = "left") {
      ctx.save(); ctx.font = `600 ${size}px 'IBM Plex Mono',monospace`; const w = ctx.measureText(text).width + 12, h = size + 9; let x0 = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
      ctx.fillStyle = "rgba(6,12,24,.62)"; ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, y - h + 4, w, h, 7) : ctx.rect(x0, y - h + 4, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.fillText(text, x0 + 6, y - 1); ctx.restore();
    },
    panel(ctx, x, y, w, h) { ctx.save(); ctx.fillStyle = "rgba(6,12,24,.58)"; ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke(); ctx.restore(); },
    at(ctx, S, p, text, color, dx = 10, dy = -10, size) { const q = S.proj(p); P3D.hud.pill(ctx, q.x + dx, q.y + dy, text, color, size); },
    line(ctx, S, a, b, color = "#fff", w = 1.5, dash) { const p = S.proj(a), q = S.proj(b); ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore(); },
    vec(ctx, S, a, b, color, text) { const p = S.proj(a), q = S.proj(b); arrow(ctx, p.x, p.y, q.x, q.y, color, 2.4); if (text) P3D.hud.pill(ctx, q.x + 8, q.y - 4, text, color, 11); },
  };
  P3D.hud.graph = function (ctx, x, y, w, h, o) {
    // o: { series:[{pts:[[x,y],...], color, width}], xmin,xmax,ymin,ymax, xl, yl, dot:[x,y,color], fill:{pts,color}, ticksX, ticksY }
    const H = P3D.hud; H.panel(ctx, x, y, w, h);
    { const ny0 = o.ticksY || 4, raw = (o.ymax - o.ymin) / ny0, pw10 = Math.pow(10, Math.floor(Math.log10(raw || 1))), nf = raw / pw10, st = (nf <= 1 ? 1 : nf <= 2 ? 2 : nf <= 2.5 ? 2.5 : nf <= 5 ? 5 : 10) * pw10; o = Object.assign({}, o, { ymin: Math.floor(o.ymin / st) * st, ymax: Math.ceil(o.ymax / st) * st }); o.ticksY = Math.max(1, Math.round((o.ymax - o.ymin) / st)); } const px = x + 34, py = y + 16, pw = w - 46, ph = h - 40;
    const X = (v) => px + ((v - o.xmin) / (o.xmax - o.xmin)) * pw, Y = (v) => py + ph - ((v - o.ymin) / (o.ymax - o.ymin)) * ph;
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.fillStyle = "rgba(205,222,245,.9)"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.lineWidth = 1;
    const nx = o.ticksX || 5, ny = o.ticksY || 4;
    for (let i = 0; i <= nx; i++) { const v = o.xmin + ((o.xmax - o.xmin) * i) / nx, xx = X(v); ctx.beginPath(); ctx.moveTo(xx, py); ctx.lineTo(xx, py + ph); ctx.stroke(); ctx.textAlign = "center"; ctx.fillText((Math.abs(v) < 100 ? +v.toFixed(1) : Math.round(v)) + "", xx, py + ph + 11); }
    for (let i = 0; i <= ny; i++) { const v = o.ymin + ((o.ymax - o.ymin) * i) / ny, yy = Y(v); ctx.beginPath(); ctx.moveTo(px, yy); ctx.lineTo(px + pw, yy); ctx.stroke(); ctx.textAlign = "right"; ctx.fillText((Math.abs(v) < 100 ? +v.toFixed(1) : Math.round(v)) + "", px - 4, yy + 3); }
    if (o.ymin < 0 && o.ymax > 0) { ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.moveTo(px, Y(0)); ctx.lineTo(px + pw, Y(0)); ctx.stroke(); }
    ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    if (o.fill && o.fill.pts.length > 1) { ctx.fillStyle = o.fill.color; ctx.beginPath(); ctx.moveTo(X(o.fill.pts[0][0]), Y(0)); o.fill.pts.forEach((p) => ctx.lineTo(X(p[0]), Y(p[1]))); ctx.lineTo(X(o.fill.pts[o.fill.pts.length - 1][0]), Y(0)); ctx.closePath(); ctx.fill(); }
    (o.series || []).forEach((sr) => { if (!sr.pts || sr.pts.length < 2) return; ctx.strokeStyle = sr.color; ctx.lineWidth = sr.width || 2.2; ctx.lineJoin = "round"; ctx.beginPath(); sr.pts.forEach((p, i) => (i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])))); ctx.stroke(); });
    if (o.dot) { ctx.fillStyle = o.dot[2] || "#ffd27a"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(X(o.dot[0]), Y(o.dot[1]), 4.2, 0, TAU); ctx.fill(); }
    ctx.restore(); ctx.save(); ctx.fillStyle = "#bcd0ea"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; if (o.yl) ctx.fillText(o.yl, x + 8, y + 11); ctx.textAlign = "right"; if (o.xl) ctx.fillText(o.xl, x + w - 6, y + h - 4); ctx.restore();
  };
  P3D.util = { TAU, V3, rnd, tex, softDot, cv, M };
})();
