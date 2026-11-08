/* bio-kit.js — shared building blocks for the WAEC Biology 3D labs (runs on top of maths-kit.js + physics3d.js).
   Environments: micro (microscope field), studio (soft photographic backdrop) — plus physics3d's lab / outdoor / dark.
   Organic materials (membrane, cytoplasm, tissue with sheen, leaf, bark, bone, muscle), procedural geometry
   (noise blobs, leaves, plants, trees, creatures, a translucent human figure) and HUD helpers.
   Realism comes from PBR materials, lighting and procedural textures — there are no photo assets. */
(function () {
  "use strict";
  const MK = window.MK;
  const BK = (window.BK = {});
  const T = () => window.THREE, P = () => window.P3D;

  /* ---------- tiny deterministic noise ---------- */
  BK.rng = (seed) => { let q = (seed >>> 0) || 1; return () => (q = (Math.imul(q, 1664525) + 1013904223) >>> 0) / 4294967296; };
  const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  BK.noise3 = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf); let r = 0;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) r += hash(xi + a, yi + b, zi + c) * (a ? u : 1 - u) * (b ? v : 1 - v) * (c ? w : 1 - w);
    return r;
  };
  BK.fbm = (x, y, z) => BK.noise3(x, y, z) * 0.6 + BK.noise3(x * 2.1, y * 2.1, z * 2.1) * 0.28 + BK.noise3(x * 4.3, y * 4.3, z * 4.3) * 0.12;

  /* ---------- canvas textures ---------- */
  function cv(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function tex(c, rep) { const t = new (T().CanvasTexture)(c); t.colorSpace = T().SRGBColorSpace; t.wrapS = t.wrapT = T().RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); t.anisotropy = 16; return t; }
  BK.tex = tex; BK.cv = cv;
  const cache = {};
  BK.leafTex = (col = "#3f8a3a", vein = "#9ccc7a") => { const c = cv(256, 512), g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, col); gr.addColorStop(0.5, shade(col, 18)); gr.addColorStop(1, col); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = vein; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 512); g.lineTo(128, 0); g.stroke(); g.lineWidth = 2.2;
    for (let y = 470; y > 20; y -= 34) { g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(70, y - 30, 8, y - 70); g.moveTo(128, y); g.quadraticCurveTo(186, y - 30, 248, y - 70); g.stroke(); }
    speckle(g, 256, 512, 10); return tex(c); };
  BK.barkTex = () => cache.bark || (cache.bark = (() => { const c = cv(256, 512), g = c.getContext("2d"); g.fillStyle = "#5b4330"; g.fillRect(0, 0, 256, 512); for (let i = 0; i < 260; i++) { const x = Math.random() * 256; g.strokeStyle = `rgba(${30 + Math.random() * 40},${20 + Math.random() * 25},12,${0.3 + Math.random() * 0.4})`; g.lineWidth = 1 + Math.random() * 4; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= 512; y += 32) g.lineTo(x + Math.sin(y * 0.03 + i) * 4, y); g.stroke(); } speckle(g, 256, 512, 18); return tex(c, [1, 2]); })());
  BK.soilTex = (rep = [4, 4]) => { const c = cv(256, 256), g = c.getContext("2d"); g.fillStyle = "#5a4130"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${60 + Math.random() * 70},${40 + Math.random() * 45},${25 + Math.random() * 30},${0.4 + Math.random() * 0.5})`; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 0.6 + Math.random() * 2.4, 0, 6.3); g.fill(); } return tex(c, rep); };
  BK.muscleTex = () => cache.mus || (cache.mus = (() => { const c = cv(128, 256), g = c.getContext("2d"); g.fillStyle = "#a8423c"; g.fillRect(0, 0, 128, 256); for (let x = 0; x < 128; x += 3) { g.strokeStyle = `rgba(${90 + Math.random() * 60},20,25,.5)`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + Math.random() * 3, 256); g.stroke(); } return tex(c, [2, 1]); })());
  BK.spotTex = (base, spot, n = 120, rmax = 7) => { const c = cv(256, 256), g = c.getContext("2d"); g.fillStyle = base; g.fillRect(0, 0, 256, 256); for (let i = 0; i < n; i++) { g.fillStyle = spot; g.globalAlpha = 0.25 + Math.random() * 0.5; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * rmax, 0, 6.3); g.fill(); } g.globalAlpha = 1; return tex(c); };
  function speckle(g, w, h, amt) { const im = g.getImageData(0, 0, w, h), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(im, 0, 0); }
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const r = Math.min(255, Math.max(0, (n >> 16) + k)), gg = Math.min(255, Math.max(0, ((n >> 8) & 255) + k)), b = Math.min(255, Math.max(0, (n & 255) + k)); return "#" + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1); }
  BK.shade = shade;

  /* ---------- organic materials ---------- */
  BK.mat = {
    membrane: (col = 0xbfe3ff, op = 0.28) => new (T().MeshPhysicalMaterial)({ color: col, roughness: 0.15, transparent: true, opacity: op, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 1, sheenColor: new (T().Color)(0xffffff), side: T().DoubleSide, depthWrite: false }),
    cyto: (col = 0x9fd6c4, op = 0.22) => new (T().MeshPhysicalMaterial)({ color: col, roughness: 0.3, transparent: true, opacity: op, side: T().DoubleSide, depthWrite: false }),
    tissue: (col = 0xd77a6e, r = 0.55) => new (T().MeshPhysicalMaterial)({ color: col, roughness: r, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new (T().Color)(0xffd8d0), clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    wet: (col = 0xc0504d) => new (T().MeshPhysicalMaterial)({ color: col, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.5 }),
    organelle: (col, emiss = 0) => new (T().MeshPhysicalMaterial)({ color: col, roughness: 0.4, clearcoat: 0.6, sheen: 0.6, emissive: col, emissiveIntensity: emiss }),
    leaf: (col, vein) => new (T().MeshStandardMaterial)({ map: BK.leafTex(col, vein), roughness: 0.6, side: T().DoubleSide }),
    bark: () => new (T().MeshStandardMaterial)({ map: BK.barkTex(), roughness: 0.95 }),
    bone: () => new (T().MeshPhysicalMaterial)({ color: 0xeee3c8, roughness: 0.55, clearcoat: 0.3, sheen: 0.3 }),
    muscle: () => new (T().MeshPhysicalMaterial)({ map: BK.muscleTex(), roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    blood: () => new (T().MeshPhysicalMaterial)({ color: 0xb3121b, roughness: 0.3, clearcoat: 1, sheen: 0.6, sheenColor: new (T().Color)(0xff6060) }),
    soil: (rep) => new (T().MeshStandardMaterial)({ map: BK.soilTex(rep), roughness: 1 }),
    skin: (col = 0x8d5a3b, op = 1) => new (T().MeshPhysicalMaterial)({ color: col, roughness: 0.55, sheen: 1, sheenColor: new (T().Color)(0xffc8a8), sheenRoughness: 0.6, transparent: op < 1, opacity: op, depthWrite: op >= 1 }),
    glassSkin: (col = 0x9fc6ff) => new (T().MeshPhysicalMaterial)({ color: col, roughness: 0.1, transparent: true, opacity: 0.16, clearcoat: 1, depthWrite: false, side: T().DoubleSide }),
    glow: (col, op = 0.7) => new (T().MeshBasicMaterial)({ color: col, transparent: true, opacity: op, blending: T().AdditiveBlending, depthWrite: false }),
  };

  /* ---------- environments ---------- */
  const gradSky = (top, bot, r = 120) => new (T().Mesh)(new (T().SphereGeometry)(r, 32, 16), new (T().ShaderMaterial)({ side: T().BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new (T().Color)(top) }, bot: { value: new (T().Color)(bot) } },
    vertexShader: "varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "varying vec3 vP;uniform vec3 top;uniform vec3 bot;void main(){float h=clamp(vP.y*.5+.5,0.,1.);gl_FragColor=vec4(mix(bot,top,smoothstep(0.,1.,h)),1.);\n#include <colorspace_fragment>\n}" }));
  BK.gradSky = gradSky;
  /* microscope field: luminous blue-teal backdrop, drifting motes, soft key + rim lights */
  MK.envs3d.micro = function (S, o) {
    const sc = S.scene; sc.background = new (T().Color)(o.bot || 0x06131f); sc.fog = null;
    sc.add(gradSky(o.top || 0x1d4f6e, o.bot || 0x050b14, 90)); S.scene.environmentIntensity = o.envI == null ? 0.7 : o.envI;
    sc.add(new (T().HemisphereLight)(0xcfefff, 0x10202c, 0.9));
    const key = new (T().DirectionalLight)(0xffffff, 2.2); key.position.set(4, 7, 6); sc.add(key);
    const rim = new (T().DirectionalLight)(0x7fdcff, 1.4); rim.position.set(-6, 2, -5); sc.add(rim);
    const n = 160, pts = new Float32Array(n * 3), rr = BK.rng(7); for (let i = 0; i < n; i++) pts.set([(rr() - 0.5) * 30, (rr() - 0.5) * 18, (rr() - 0.5) * 30 - 4], i * 3);
    const geo = new (T().BufferGeometry)(); geo.setAttribute("position", new (T().BufferAttribute)(pts, 3));
    const motes = new (T().Points)(geo, new (T().PointsMaterial)({ size: 0.08, color: 0x9fe7ff, transparent: true, opacity: 0.45, depthWrite: false })); sc.add(motes);
    S.anims.push((dt, t) => { motes.rotation.y = t * 0.01; motes.position.y = Math.sin(t * 0.2) * 0.2; });
  };
  /* photographic studio sweep: gradient backdrop + matte floor that catches soft shadows */
  MK.envs3d.studio = function (S, o) {
    const sc = S.scene; sc.background = new (T().Color)(o.bot || 0x1b2232); sc.fog = new (T().Fog)(o.bot || 0x1b2232, 30, 70);
    sc.add(gradSky(o.top || 0x3a4a68, o.bot || 0x141a26, 80));
    const floor = new (T().Mesh)(new (T().CircleGeometry)(40, 64), new (T().MeshStandardMaterial)({ color: o.floor || 0x2a3348, roughness: 0.92 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
    sc.add(new (T().HemisphereLight)(0xdfe9ff, 0x2a2a35, 0.8));
    const key = new (T().DirectionalLight)(0xfff4e6, 2.6); key.position.set(5, 10, 7); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; sc.add(key);
    const rim = new (T().DirectionalLight)(0x9cc8ff, 1.2); rim.position.set(-6, 5, -6); sc.add(rim);
  };

  /* ---------- geometry ---------- */
  /* organic blob: sphere displaced by fbm noise */
  BK.blob = (r, seed = 1, amp = 0.18, seg = 48, sx = 1, sy = 1, sz = 1) => {
    const g = new (T().SphereGeometry)(r, seg, Math.round(seg * 0.7)), p = g.attributes.position, v = new (T().Vector3)();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = BK.fbm(v.x / r * 1.6 + seed, v.y / r * 1.6 + seed * 2, v.z / r * 1.6 - seed); v.multiplyScalar(1 + (n - 0.5) * 2 * amp); v.x *= sx; v.y *= sy; v.z *= sz; p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g;
  };
  /* animate a blob's vertices (amoeba, cytoplasm) — keeps a base copy */
  BK.wobble = (mesh, r, t, amp = 0.15, speed = 0.6, seed = 1) => {
    const g = mesh.geometry, p = g.attributes.position; if (!g.userData.base) g.userData.base = p.array.slice(); const b = g.userData.base;
    for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2], l = Math.hypot(x, y, z) || 1; const n = BK.noise3(x / r * 1.4 + t * speed + seed, y / r * 1.4, z / r * 1.4 - t * speed * 0.7); const k = 1 + (n - 0.5) * 2 * amp; p.setXYZ(i, x * k, y * k, z * k); }
    p.needsUpdate = true; g.computeVertexNormals();
  };
  /* curved leaf blade (length along +y), with midrib droop */
  BK.leafGeo = (len = 1, wid = 0.4, droop = 0.25, seg = 12) => {
    const g = new (T().PlaneGeometry)(wid, len, 6, seg), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i) + len / 2; const t = y / len, w = Math.sin(Math.PI * Math.min(1, t * 1.05)) * (1 - t * 0.25); x *= w * 1.0; const z = -droop * t * t * len + Math.abs(x) * 0.25; p.setXYZ(i, x, y, z); }
    g.computeVertexNormals(); return g;
  };
  BK.leaf = (len, wid, mat, droop) => { const m = new (T().Mesh)(BK.leafGeo(len, wid, droop), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  /* simple dicot plant: curved stem, alternate leaves; returns group with .stem .leaves .tip */
  BK.plant = (o = {}) => {
    const h = o.h || 2, grp = new (T().Group)(), bend = o.bend || 0, lean = o.lean || 0;
    const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new (T().Vector3)(Math.sin(t * Math.PI * 0.5) * bend * h + lean * t * h, t * h, 0)); }
    const stemMat = o.stemMat || new (T().MeshPhysicalMaterial)({ color: o.stemCol || 0x5f9a3c, roughness: 0.5, sheen: 0.4 });
    const stem = new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts), 40, o.r || 0.045, 10), stemMat); stem.castShadow = true; grp.add(stem); grp.stem = stem; grp.leaves = []; grp.curve = pts;
    const lm = o.leafMat || BK.mat.leaf(o.leafCol || "#3f8a3a", "#a8d47e"), n = o.leaves || 6;
    for (let i = 0; i < n; i++) { const t = 0.3 + 0.65 * i / Math.max(1, n - 1), idx = Math.round(t * 12), p = pts[idx]; const lf = BK.leaf((o.leafLen || 0.55) * (1.1 - t * 0.4), (o.leafW || 0.28), lm, 0.3); const piv = new (T().Group)(); piv.position.copy(p); piv.rotation.y = i * 2.4; lf.rotation.x = -1.0; piv.add(lf); grp.add(piv); grp.leaves.push(lf); }
    grp.tip = pts[12].clone(); return grp;
  };
  /* tree: bark trunk + clustered canopy blobs */
  BK.tree = (h = 4, seed = 1, leafCol = 0x2f6b2e) => {
    const grp = new (T().Group)(), trunk = new (T().Mesh)(new (T().CylinderGeometry)(h * 0.045, h * 0.075, h * 0.6, 10), BK.mat.bark()); trunk.position.y = h * 0.3; trunk.castShadow = true; grp.add(trunk);
    const lm = new (T().MeshStandardMaterial)({ color: leafCol, roughness: 0.85 }), rr = BK.rng(seed);
    for (let i = 0; i < 6; i++) { const b = new (T().Mesh)(BK.blob(h * (0.17 + rr() * 0.08), seed + i, 0.28, 20), lm); b.position.set((rr() - 0.5) * h * 0.38, h * (0.62 + rr() * 0.28), (rr() - 0.5) * h * 0.38); b.castShadow = true; grp.add(b); }
    return grp;
  };
  BK.grassTuft = (mat, n = 9, h = 0.35, seed = 3) => { const grp = new (T().Group)(), rr = BK.rng(seed); for (let i = 0; i < n; i++) { const b = new (T().Mesh)(BK.leafGeo(h * (0.6 + rr() * 0.6), 0.04, 0.2, 6), mat); b.rotation.y = rr() * 6.3; b.rotation.x = -0.1 - rr() * 0.3; grp.add(b); } return grp; };
  BK.mushroom = (s = 1, capCol = 0xb5583a) => { const grp = new (T().Group)(); const st = new (T().Mesh)(new (T().CylinderGeometry)(0.08 * s, 0.11 * s, 0.5 * s, 16), new (T().MeshPhysicalMaterial)({ color: 0xefe6d2, roughness: 0.7, sheen: 0.5 })); st.position.y = 0.25 * s; grp.add(st);
    const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI / 2; pts.push(new (T().Vector2)(Math.sin(a) * 0.36 * s, Math.cos(a) * 0.2 * s)); } pts.push(new (T().Vector2)(0.02, 0));
    const cap = new (T().Mesh)(new (T().LatheGeometry)(pts, 40), new (T().MeshPhysicalMaterial)({ map: BK.spotTex("#" + capCol.toString(16).padStart(6, "0"), "#f3e7d3", 60, 9), roughness: 0.5, clearcoat: 0.4, side: T().DoubleSide })); cap.position.y = 0.48 * s; grp.add(cap);
    grp.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return grp; };
  /* fish (Tilapia-like): lathe body + fins + eye; faces +x */
  BK.fish = (s = 1, col = 0x7d8a6a) => { const grp = new (T().Group)(), pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new (T().Vector2)(Math.sin(Math.PI * t) * 0.32 * (1 - 0.35 * t) + 0.01, (t - 0.5) * 1.6)); }
    const body = new (T().Mesh)(new (T().LatheGeometry)(pts, 32), new (T().MeshPhysicalMaterial)({ map: BK.spotTex("#" + col.toString(16).padStart(6, "0"), "#3b4636", 90, 4), roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.2, iridescence: 0.4 }));
    body.rotation.z = -Math.PI / 2; body.scale.set(1, 1, 0.55); grp.add(body);
    const fm = new (T().MeshPhysicalMaterial)({ color: 0x9a8f72, roughness: 0.4, transparent: true, opacity: 0.8, side: T().DoubleSide });
    const tail = new (T().Mesh)(new (T().ConeGeometry)(0.28, 0.4, 3), fm); tail.rotation.z = -Math.PI / 2; tail.scale.set(1, 1, 0.12); tail.position.x = -0.95; grp.add(tail); grp.tail = tail;
    const dorsal = new (T().Mesh)(new (T().ConeGeometry)(0.42, 0.25, 3), fm); dorsal.scale.set(1, 1, 0.08); dorsal.position.set(-0.05, 0.32, 0); grp.add(dorsal);
    const eye = new (T().Mesh)(new (T().SphereGeometry)(0.05, 12, 8), new (T().MeshPhysicalMaterial)({ color: 0x111111, roughness: 0.05, clearcoat: 1 })); eye.position.set(0.55, 0.06, 0.13); grp.add(eye); const e2 = eye.clone(); e2.position.z = -0.13; grp.add(e2);
    grp.scale.setScalar(s); grp.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return grp; };
  /* stylised quadruped (cow/goat/rabbit) from rounded primitives; faces +x */
  BK.quad = (s = 1, col = 0x8a6a4a, o = {}) => { const grp = new (T().Group)(), m = BK.mat.skin(col); const body = new (T().Mesh)(new (T().CapsuleGeometry)(0.32, 0.7, 6, 14), m); body.rotation.z = Math.PI / 2; body.position.y = 0.75; grp.add(body);
    const head = new (T().Mesh)(new (T().CapsuleGeometry)(0.15, 0.22, 4, 10), m); head.rotation.z = Math.PI / 2.6; head.position.set(0.72, 0.98, 0); grp.add(head);
    for (const x of [-0.32, 0.32]) for (const z of [-0.17, 0.17]) { const l = new (T().Mesh)(new (T().CylinderGeometry)(0.06, 0.05, 0.55, 8), m); l.position.set(x, 0.3, z); grp.add(l); }
    if (o.ears) { const e = new (T().Mesh)(new (T().ConeGeometry)(0.05, 0.25, 8), m); e.position.set(0.68, 1.22, 0.07); grp.add(e); const e2 = e.clone(); e2.position.z = -0.07; grp.add(e2); }
    grp.scale.setScalar(s); grp.traverse((q) => { if (q.isMesh) { q.castShadow = true; } }); return grp; };
  /* insect body: head + thorax + abdomen + 6 legs (+ optional wings); faces +x */
  BK.insect = (s = 1, col = 0x5a3a1a, o = {}) => { const grp = new (T().Group)(), m = new (T().MeshPhysicalMaterial)({ color: col, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2 });
    const ab = new (T().Mesh)(new (T().SphereGeometry)(0.22, 20, 14), m); ab.scale.set(1.7, 0.75, 0.9); ab.position.x = -0.32; grp.add(ab);
    const th = new (T().Mesh)(new (T().SphereGeometry)(0.13, 16, 12), m); th.position.x = 0.02; grp.add(th);
    const hd = new (T().Mesh)(new (T().SphereGeometry)(0.09, 16, 12), m); hd.position.x = 0.2; grp.add(hd);
    const lm = new (T().MeshStandardMaterial)({ color: 0x2a1a0a, roughness: 0.6 });
    for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const leg = new (T().Mesh)(new (T().CylinderGeometry)(0.012, 0.01, 0.34, 6), lm); leg.position.set(0.08 - i * 0.1, -0.08, sd * 0.13); leg.rotation.x = sd * 0.9; leg.rotation.z = (i - 1) * 0.5; grp.add(leg); }
    if (o.wings) { const wm = new (T().MeshPhysicalMaterial)({ color: o.wingCol || 0xffffff, transparent: true, opacity: o.wingOp || 0.35, roughness: 0.1, iridescence: 1, side: T().DoubleSide, depthWrite: false }); grp.wings = [];
      for (const sd of [-1, 1]) { const w = new (T().Mesh)(new (T().CircleGeometry)(o.wingR || 0.3, 24), wm); w.scale.set(1.6, 0.6, 1); const piv = new (T().Group)(); piv.position.set(0, 0.08, sd * 0.06); w.rotation.x = -Math.PI / 2; w.position.set(-0.15, 0, sd * 0.28); piv.add(w); grp.add(piv); grp.wings.push(piv); } }
    if (o.antennae !== false) for (const sd of [-1, 1]) { const a = new (T().Mesh)(new (T().CylinderGeometry)(0.006, 0.006, 0.4, 5), lm); a.position.set(0.36, 0.12, sd * 0.06); a.rotation.z = -1.0; a.rotation.x = sd * 0.4; grp.add(a); }
    grp.scale.setScalar(s); grp.traverse((q) => { if (q.isMesh) q.castShadow = true; }); return grp; };
  /* translucent human figure (mannequin) — y up, standing on y=0, height ~ 3.4 */
  BK.human = (mat) => { const grp = new (T().Group)(), m = mat || BK.mat.glassSkin(); const add = (geo, x, y, z, rx = 0, rz = 0) => { const q = new (T().Mesh)(geo, m); q.position.set(x, y, z); q.rotation.x = rx; q.rotation.z = rz; q.renderOrder = 5; grp.add(q); return q; };
    add(new (T().SphereGeometry)(0.26, 32, 24), 0, 3.12, 0).scale.set(0.9, 1.1, 1);
    add(new (T().CylinderGeometry)(0.09, 0.1, 0.2, 16), 0, 2.78, 0);
    add(new (T().CapsuleGeometry)(0.42, 0.75, 8, 20), 0, 2.15, 0).scale.set(1, 1, 0.62);
    add(new (T().CapsuleGeometry)(0.36, 0.2, 8, 20), 0, 1.45, 0).scale.set(1, 1, 0.65);
    for (const sd of [-1, 1]) { add(new (T().CapsuleGeometry)(0.09, 0.95, 6, 12), sd * 0.6, 2.05, 0, 0, sd * 0.12); add(new (T().CapsuleGeometry)(0.13, 1.25, 6, 12), sd * 0.2, 0.68, 0); }
    return grp; };

  /* ---------- scene helpers ---------- */
  BK.group = (S, s, name = "g") => { if (s[name]) BK.dispose(S, s[name]); const g = new (T().Group)(); S.scene.add(g); s[name] = g; return g; };
  BK.dispose = (S, g) => { if (!g) return; g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); }); }); if (g.parent) g.parent.remove(g); };
  BK.shadow = (g, cast = true, recv = true) => { g.traverse((m) => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return g; };
  /* label a world point on the HUD if it is in front of the camera */
  BK.lab = (S, B, x, y, z, text, color = "#e8f1ff", dx = 10, dy = -8, size = 11) => { const q = MK.proj(S, x, y, z); if (q.z < 1 && q.x > -40 && q.x < 680) { B.pill(text, q.x + dx, q.y + dy, color, size, dx < 0 ? "right" : "left"); return q; } return null; };
  BK.labc = (S, B, x, y, z, text, color = "#e8f1ff", dy = 0, size = 10.5) => { const q = MK.proj(S, x, y, z); if (q.z < 1) B.pill(text, Math.max(8 + text.length * 3.3, q.x), q.y + dy, color, size, "center"); };
  BK.leader = (S, B, from, text, color, ox = 60, oy = -30) => { const q = MK.proj(S, from[0], from[1], from[2]); if (q.z >= 1) return; const tx = q.x + ox, ty = q.y + oy; B.line(q.x, q.y, tx, ty, color, 1.4); B.dot(q.x, q.y, color, 3); B.pill(text, tx + (ox < 0 ? -4 : 4), ty + 4, color, 11, ox < 0 ? "right" : "left"); };
  /* a mini bar/line graph panel on the HUD */
  BK.graph = (B, x, y, w, h, o) => { B.panel(x, y, w, h); const px = x + 30, py = y + 22, pw = w - 42, ph = h - 44, X = (v) => px + (v - o.x0) / (o.x1 - o.x0) * pw, Y = (v) => py + ph - (v - o.y0) / (o.y1 - o.y0) * ph;
    B.text(o.title || "", x + 10, y + 15, { size: 10, w: 700, color: "#9fc3ff", halo: false });
    B.line(px, py + ph, px + pw, py + ph, "#6f86ad", 1); B.line(px, py, px, py + ph, "#6f86ad", 1);
    (o.series || []).forEach((sr) => { if (sr.pts.length < 2) return; B.poly(sr.pts.map((p) => [X(p[0]), Y(p[1])]), sr.color, null, sr.w || 2, false, sr.dash); });
    (o.bars || []).forEach((b, i, arr) => { const bw = pw / arr.length; const yy = Y(b.v); B.poly([[px + i * bw + 4, py + ph], [px + i * bw + 4, yy], [px + (i + 1) * bw - 4, yy], [px + (i + 1) * bw - 4, py + ph]], null, b.color); B.text(b.label, px + i * bw + bw / 2, py + ph + 12, { size: 9, align: "center", color: "#c9d6ee", halo: false }); });
    if (o.dot) B.dot(X(o.dot[0]), Y(o.dot[1]), o.dot[2] || "#ffd27a", 4);
    B.text(o.yl || "", x + 6, py - 4, { size: 9, color: "#9fb3d6", halo: false }); B.text(o.xl || "", x + w - 8, y + h - 6, { size: 9, align: "right", color: "#9fb3d6", halo: false });
    return { X, Y }; };

  /* ---------- 2D fallback illustration: titled schematic card with key facts ---------- */
  BK.fallback = (title, facts, art) => function (g, s, c, B) {
    const W = B.W, H = B.H; const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#14304a"); gr.addColorStop(1, "#08121e"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (art) { g.save(); try { art(g, s, c, B); } catch (e) { } g.restore(); }
    const lines = typeof facts === "function" ? facts(s, c) : facts; let y = H - 22 - lines.length * 17;
    g.fillStyle = "rgba(6,12,24,.65)"; g.fillRect(12, y - 20, W - 24, lines.length * 17 + 30);
    B.text(title, 22, y - 4, { size: 12, w: 700, color: "#ffd27a", halo: false }); lines.forEach((l) => { y += 17; B.text("• " + l, 22, y, { size: 11.5, color: "#e8f1ff", halo: false, w: 500 }); });
  };
  /* reusable 2D organic drawing primitives for fallbacks and 2D scenes */
  BK.cell2d = (g, x, y, r, fill, edge, nucleus) => { g.save(); const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, fill); g.fillStyle = gr; g.strokeStyle = edge; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, r, r * 0.85, 0, 0, 6.3); g.fill(); g.stroke(); if (nucleus) { g.fillStyle = nucleus; g.beginPath(); g.arc(x + r * 0.15, y - r * 0.05, r * 0.28, 0, 6.3); g.fill(); } g.restore(); };
  BK.def3d = (key, sc) => MK.def(key, Object.assign({ kind: "3d", fov: 38, exposure: 1 }, sc));
})();
