/* g3d-earth.js — Topic 3 The Earth as a Planet. A photographic globe (Solar System Scope / NASA textures):
   day map, night lights only on the dark side, bump + ocean roughness, a separate cloud shell and a thin atmosphere. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const D2R = Math.PI / 180;
  /* lat/lon (deg) → position on a sphere of radius r (matches THREE.SphereGeometry UVs: lon 0 at +x, 90°E at −z) */
  const ll = (lat, lon, r) => [r * Math.cos(lat * D2R) * Math.cos(lon * D2R), r * Math.sin(lat * D2R), -r * Math.cos(lat * D2R) * Math.sin(lon * D2R)];
  GK.ll = ll;
  const SPACE = { bgColor: 0x02040b, fog: false, hemi: 0.04, sun: 3.2, sunPos: [20, 4, 10], shadow: false, envI: 0.06, hdri: "dikhololo_night", tone: "neutral", exposure: 1.0 };

  /* ---------- shared textures ---------- */
  let TX = null;
  function textures() {
    if (TX) return TX;
    const T3 = T();
    TX = { day: GK.texture("earth/earth_day_4096.jpg", true), night: GK.texture("earth/earth_night_4096.jpg", true), brc: GK.texture("earth/earth_bump_roughness_clouds_4096.jpg", false) };
    /* clouds: pull the blue channel out into an alpha texture */
    const cc = BK.cv(2048, 1024); TX.clouds = new T3.CanvasTexture(cc); TX.clouds.colorSpace = T3.SRGBColorSpace;
    GK.img("earth/earth_bump_roughness_clouds_4096.jpg").then((im) => { if (!im) return; const g = cc.getContext("2d"); g.drawImage(im, 0, 0, 2048, 1024); const d = g.getImageData(0, 0, 2048, 1024); for (let i = 0; i < d.data.length; i += 4) { const b = d.data[i + 2]; d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = Math.min(255, b * 1.15); } g.putImageData(d, 0, 0); TX.clouds.needsUpdate = true; });
    return TX;
  }
  /* globe: returns group with .earth .clouds .atmo and .setSun(worldDir) */
  GK.globe = function (R = 2, o = {}) {
    const T3 = T(), tx = textures(), g = new T3.Group();
    const mat = new T3.MeshStandardMaterial({ map: tx.day, bumpMap: tx.brc, bumpScale: 3, roughnessMap: tx.brc, roughness: 1, metalness: 0, emissiveMap: tx.night, emissive: 0xffd9a0, emissiveIntensity: o.night === false ? 0 : 1.4 });
    const sunV = { value: V(1, 0, 0) };
    mat.onBeforeCompile = (sh) => { sh.uniforms.sunDirView = sunV; sh.fragmentShader = "uniform vec3 sunDirView;\n" + sh.fragmentShader.replace("#include <emissivemap_fragment>", "#ifdef USE_EMISSIVEMAP\n vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );\n float nd = dot( normalize( vNormal ), sunDirView );\n totalEmissiveRadiance *= emissiveColor.rgb * smoothstep( 0.05, -0.25, nd );\n#endif"); };
    const earth = new T3.Mesh(new T3.SphereGeometry(R, 128, 64), mat); g.add(earth);
    let clouds = null; if (o.clouds !== false) { clouds = new T3.Mesh(new T3.SphereGeometry(R * 1.008, 96, 48), new T3.MeshStandardMaterial({ map: tx.clouds, transparent: true, depthWrite: false, roughness: 1 })); g.add(clouds); }
    const atmo = new T3.Mesh(new T3.SphereGeometry(R * 1.06, 64, 32), new T3.ShaderMaterial({ side: T3.BackSide, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, uniforms: { sunDir: { value: V(1, 0, 0) } },
      vertexShader: "varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vW = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.); }",
      fragmentShader: "uniform vec3 sunDir; varying vec3 vN; varying vec3 vW; void main(){ vec3 v = normalize(cameraPosition - vW); float rim = pow(1. - abs(dot(vN, v)), 3.); float day = smoothstep(-0.35, 0.4, dot(-vN, sunDir) * -1.); gl_FragColor = vec4(vec3(0.35,0.6,1.)*rim*(0.25+0.9*day), rim); }" }));
    g.add(atmo);
    g.earth = earth; g.clouds = clouds; g.atmo = atmo;
    g.setSun = (S, dirW) => { sunV.value.copy(dirW).normalize().transformDirection(S.camera.matrixWorldInverse); atmo.material.uniforms.sunDir.value.copy(dirW).normalize(); };
    return g;
  };
  GK.stars = function (n = 2500, r = 160) {
    const T3 = T(), p = new Float32Array(n * 3), c = new Float32Array(n * 3), rr = BK.rng(42);
    for (let i = 0; i < n; i++) { const u = rr() * 2 - 1, a = rr() * 6.283, s = Math.sqrt(1 - u * u); p.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3); const k = 0.6 + rr() * 0.4, w = rr(); c.set([k, k * (0.9 + 0.1 * w), k * (0.8 + 0.2 * w)], i * 3); }
    const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.BufferAttribute(p, 3)); g.setAttribute("color", new T3.BufferAttribute(c, 3));
    return new T3.Points(g, new T3.PointsMaterial({ size: 0.6, vertexColors: true, sizeAttenuation: true, depthWrite: false }));
  };
  /* circle of latitude / meridian as a line */
  const latLine = (lat, R, col, op = 0.9) => { const P = []; for (let i = 0; i <= 120; i++) P.push(ll(lat, -180 + i * 3, R)); return GK.polyline(P, col, op); };
  const lonLine = (lon, R, col, op = 0.9) => { const P = []; for (let i = 0; i <= 90; i++) P.push(ll(-90 + i * 2, lon, R)); return GK.polyline(P, col, op); };
  const thick = (P, col, w) => GK.line(P, col, w);
  const latTube = (lat, R, col, w = 0.012) => { const P = []; for (let i = 0; i <= 72; i++) P.push(ll(lat, -180 + i * 5, R)); return thick(P, col, w); };
  const lonTube = (lon, R, col, w = 0.012, a = -90, b = 90) => { const P = []; for (let i = 0; i <= 60; i++) P.push(ll(a + (b - a) * i / 60, lon, R)); return thick(P, col, w); };
  const sunMesh = (r = 1.2) => { const T3 = T(), g = new T3.Group(); g.add(new T3.Mesh(new T3.SphereGeometry(r, 48, 32), new T3.MeshBasicMaterial({ color: 0xfff1c0 }))); const c = BK.cv(128, 128), x = c.getContext("2d"), gr = x.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, "rgba(255,230,160,1)"); gr.addColorStop(0.35, "rgba(255,170,60,.45)"); gr.addColorStop(1, "rgba(255,120,20,0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const sp = new T3.Sprite(new T3.SpriteMaterial({ map: new T3.CanvasTexture(c), blending: T3.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(r * 6); g.add(sp); return g; };

  /* ===================== EP-a  Solar system and the earth's shape ===================== */
  const PLANETS = [["Mercury", 0.39, 0.24, 0.12, 0x9a8f86, 4879], ["Venus", 0.72, 0.62, 0.2, 0xd8b981, 12104], ["Earth", 1.0, 1.0, 0.21, 0x3a78c0, 12756], ["Mars", 1.52, 1.88, 0.15, 0xc1592e, 6792], ["Jupiter", 5.2, 11.86, 0.55, 0xc8a27a, 142984], ["Saturn", 9.58, 29.46, 0.46, 0xdcc48e, 120536], ["Uranus", 19.2, 84.0, 0.32, 0x8fd3dc, 51118], ["Neptune", 30.05, 164.8, 0.31, 0x4a6fd8, 49528]];
  const orbitR = (au) => 2.2 + Math.sqrt(au) * 3.0;
  GK.def3d("EP-a", {
    title: "The solar system and the earth's shape",
    blurb: "The sun and its eight planets (sizes and distances not to scale), then the evidence that the earth is a sphere: a ship sinking hull-first below the curved horizon.",
    envOpts: SPACE, cam: [[0, 15, 31], [4.5, -1, 0]], fov: 42,
    values: { view: "system", speed: 1 },
    controls: [{ type: "tabs", key: "view", label: "Show", options: [["system", "Solar system"], ["globe", "Earth's shape"], ["ship", "Evidence: ship at sea"]] }, { type: "slider", key: "speed", label: "Orbit speed", min: 0, max: 4, step: 0.1 }],
    onChange(s, c, k, H) { if (k === "view" && H && H.setView) H.setView({ cam: { system: [[0, 15, 31], [4.5, -1, 0]], globe: [[0, 1.2, 7.2], [0.9, 0, 0]], ship: [[0, 30.5, 6], [0, 30.2, -4]] }[c.view] }); },
    build(S, s) { s.key = ""; s.t = 0; },
    update(S, s, c, dt) {
      const T3 = T();
      if (s.key !== c.view) {
        s.key = c.view; const g = BK.group(S, s); g.add(GK.stars()); s.pl = [];
        if (c.view === "system") {
          const sun = sunMesh(1.4); g.add(sun); s.light = new T3.PointLight(0xfff2dd, 600, 0, 2); g.add(s.light);
          PLANETS.forEach(([n, au, per, r, col], i) => { const R = orbitR(au); const ring = new T3.Mesh(new T3.RingGeometry(R - 0.015, R + 0.015, 128), new T3.MeshBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: 0.35, side: T3.DoubleSide })); ring.rotation.x = -Math.PI / 2; g.add(ring);
            const m = n === "Earth" ? GK.globe(r, { clouds: false, night: false }) : new T3.Mesh(new T3.SphereGeometry(r, 32, 20), new T3.MeshStandardMaterial({ color: col, roughness: 0.85 })); if (n === "Saturn") { const sr = new T3.Mesh(new T3.RingGeometry(r * 1.3, r * 2.1, 64), new T3.MeshStandardMaterial({ color: 0xcdb98a, side: T3.DoubleSide, transparent: true, opacity: 0.8 })); sr.rotation.x = -Math.PI / 2 + 0.45; m.add(sr); } g.add(m); s.pl.push({ m, R, per, a0: i * 1.7, n }); });
        } else if (c.view === "globe") {
          s.gl = GK.globe(2.2); g.add(s.gl); s.gl.rotation.z = 23.44 * D2R;
          const ax = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.012, 6, 8), new T3.MeshBasicMaterial({ color: 0xffd27a })); s.gl.add(ax);
          s.gl.add(latTube(0, 2.215, 0xff6a4a, 0.008));
        } else {
          const sea = new T3.Mesh(new T3.SphereGeometry(30, 160, 80, 0, Math.PI * 2, 0, 0.6), new T3.MeshPhysicalMaterial({ color: 0x1d5a7a, roughness: 0.15, clearcoat: 1, normalMap: GK.waterNormal(), normalScale: new T3.Vector2(0.4, 0.4) })); g.add(sea);
          const ship = new T3.Group(); const hull = new T3.Mesh(new T3.BoxGeometry(0.9, 0.35, 0.3), new T3.MeshStandardMaterial({ color: 0x8a2a20 })); hull.position.y = 0.12; ship.add(hull); const deck = new T3.Mesh(new T3.BoxGeometry(0.4, 0.3, 0.25), new T3.MeshStandardMaterial({ color: 0xeeeeee })); deck.position.set(-0.1, 0.45, 0); ship.add(deck); const mast = new T3.Mesh(new T3.CylinderGeometry(0.02, 0.02, 1.2), new T3.MeshStandardMaterial({ color: 0x333333 })); mast.position.set(0.15, 0.85, 0); ship.add(mast); const flag = new T3.Mesh(new T3.PlaneGeometry(0.3, 0.18), new T3.MeshBasicMaterial({ color: 0xffd23a, side: T3.DoubleSide })); flag.position.set(0.3, 1.35, 0); ship.add(flag); ship.rotation.y = Math.PI / 2; g.add(ship); s.ship = ship; s.shipA = 0.02;
          S.scene.background = new T3.Color(0x9cc2e0);
        }
      }
      s.t += dt * c.speed;
      if (c.view === "system") s.pl.forEach((p) => { const a = p.a0 + s.t * 0.8 / p.per; p.m.position.set(Math.cos(a) * p.R, 0, -Math.sin(a) * p.R); p.m.rotation.y += dt * 0.6; });
      if (c.view === "globe" && s.gl) { s.gl.earth.rotation.y += dt * 0.15 * (c.speed || 0.5); if (s.gl.clouds) s.gl.clouds.rotation.y += dt * 0.17 * (c.speed || 0.5); s.gl.setSun(S, V(1, 0.15, 0.6)); }
      if (c.view === "ship" && s.ship) { s.shipA = 0.02 + ((s.t * 0.02) % 0.24); const a = s.shipA; s.ship.position.set(0, 30 * Math.cos(a), -30 * Math.sin(a)); s.ship.rotation.x = -a; }
      if (c.view !== "ship" && S.scene.background && S.scene.background.getHex && S.scene.background.getHex() !== 0x02040b) S.scene.background.setHex(0x02040b);
    },
    overlay(ctx, s, c, S, B) {
      if (c.view !== "ship" || s.shipA == null) return; const x0 = 12, y0 = 250, w = 230, h = 138; B.panel(x0, y0, w, h); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("WHAT THE OBSERVER SEES", x0 + 10, y0 + 16);
      const hz = y0 + 92, k = Math.min(1, (s.shipA - 0.02) / 0.2), sh = 1 - k; ctx.save(); ctx.beginPath(); ctx.rect(x0 + 8, y0 + 22, w - 16, hz - y0 - 22); ctx.clip(); ctx.fillStyle = "#9cc2e0"; ctx.fillRect(x0 + 8, y0 + 22, w - 16, hz - y0); const cx = x0 + w / 2, sc = 0.35 + 0.65 * sh, base = hz + 50 * k * 1.2; ctx.fillStyle = "#8a2a20"; ctx.fillRect(cx - 30 * sc, base - 14 * sc, 60 * sc, 14 * sc); ctx.fillStyle = "#eee"; ctx.fillRect(cx - 14 * sc, base - 26 * sc, 18 * sc, 12 * sc); ctx.fillStyle = "#333"; ctx.fillRect(cx + 6 * sc, base - 52 * sc, 2, 40 * sc); ctx.fillStyle = "#ffd23a"; ctx.fillRect(cx + 8 * sc, base - 52 * sc, 12 * sc, 7 * sc); ctx.restore(); ctx.fillStyle = "#1d5a7a"; ctx.fillRect(x0 + 8, hz, w - 16, 26); ctx.fillStyle = "#cfe0f5"; ctx.font = "10px 'IBM Plex Sans',sans-serif"; ctx.fillText(k < 0.3 ? "Whole ship visible" : k < 0.7 ? "Hull disappears first…" : "…only the mast and flag remain", x0 + 10, y0 + h - 8);
    },
    labels: (s, c) => {
      if (c.view === "system") return (s.pl || []).map((p, i) => ({ id: p.n, p: p.m.position.toArray().map((v, j) => (j === 1 ? v + 0.3 : v)), t: (i + 1) + ". " + p.n + " · " + PLANETS[i][1] + " AU", col: p.n === "Earth" ? "#8fd0ff" : "#ffe7a8", dy: -18 })).concat([{ id: "sun", p: [0, 1.5, 0], t: "The Sun — a star", col: "#ffcf6a" }]);
      if (c.view === "globe") return [{ id: "np", p: ll(90, 0, 2.2).map((v, i) => v), t: "North Pole (axis tilted 23½°)", col: "#ffd27a" }, { id: "eq", p: ll(0, -40, 2.25), t: "Equator — 40 075 km round", col: "#ff9a8a", dy: 26 }];
      return s.ship ? [{ id: "ship", p: s.ship.position.toArray().map((v, j) => (j === 1 ? v + 1.4 : v)), t: "Ship sailing away", col: "#ffe7a8" }, { id: "hz", p: [0, 30 * Math.cos(0.12) + 0.1, -30 * Math.sin(0.12)], t: "Curved sea surface — horizon", col: "#8fd0ff", dy: 30 }] : [];
    },
    hud: (s, c) => [{ title: { system: "The solar system", globe: "Shape and size of the earth", ship: "Proof that the earth is spherical" }[c.view], lines: { system: [["Eight planets orbit the sun; the earth is the 3rd, 150 million km (1 AU) away.", "#ffd27a", true], "Inner (terrestrial) planets: Mercury, Venus, Earth, Mars. Outer (gas giants): Jupiter, Saturn, Uranus, Neptune.", "Sizes and distances here are NOT to scale."], globe: [["The earth is an oblate spheroid: flattened at the poles, bulging at the equator.", "#ffd27a", true], "Equatorial diameter 12 756 km · polar diameter 12 714 km.", "Circumference ≈ 40 075 km; surface area ≈ 510 million km²; 71% water."], ship: [["A ship sailing away disappears hull first, then the mast — the sea surface is curved.", "#ffd27a", true], "Other proofs: circular shadow on the moon in a lunar eclipse; photographs from space; circumnavigation; the horizon widens with altitude; sunrise reaches eastern places first."] }[c.view] }],
    story: [
      { d: 5, cap: "The sun is a star at the centre of our solar system. Eight planets travel around it in nearly circular orbits.", set: { view: "system", speed: 1 }, cam: [[0, 15, 31], [4.5, -1, 0]], hl: "sun" },
      { d: 5, cap: "The earth is the third planet from the sun. It takes 365¼ days to complete one orbit.", hl: "Earth", cam: [[0, 6, 14], [1, 0, 0]] },
      { d: 6, cap: "The earth is not a perfect sphere: it is an oblate spheroid, slightly flattened at the poles and bulging at the equator.", set: { view: "globe" }, cam: [[0, 1.2, 7.2], [0.9, 0, 0]] },
      { d: 7, cap: "Evidence: watch a ship sail away. The hull vanishes below the horizon before the mast, because the sea surface curves.", set: { view: "ship", speed: 2 }, cam: [[0, 30.5, 6], [0, 30.2, -4]] },
    ],
    draw: GK.fallback("The solar system", ["Eight planets orbit the sun; earth is third", "The earth is an oblate spheroid", "Proofs: ship's hull disappears first, eclipse shadow, photographs from space"]),
  });

  /* ===================== EP-b  Latitude and distance ===================== */
  const PARALLELS = [[66.56, "Arctic Circle 66½°N", 0x9fd8ff], [23.44, "Tropic of Cancer 23½°N", 0xffc04a], [0, "Equator 0°", 0xff6a4a], [-23.44, "Tropic of Capricorn 23½°S", 0xffc04a], [-66.56, "Antarctic Circle 66½°S", 0x9fd8ff]];
  const LON_B = 3.4;
  GK.def3d("EP-b", {
    title: "Latitude and distance",
    blurb: "Latitude is the angle at the centre of the earth, north or south of the equator. Move two places along the same meridian and measure the distance between them.",
    envOpts: SPACE, cam: [[7.4, 2.2, 1.0], [0.6, 0.3, -0.6]],
    values: { la: 6.5, lb: 13.5, mode: "meridian" },
    controls: [{ type: "slider", key: "la", label: "Latitude of P", min: -80, max: 80, step: 0.5, fmt: (v) => Math.abs(v).toFixed(1) + "°" + (v >= 0 ? "N" : "S") }, { type: "slider", key: "lb", label: "Latitude of Q", min: -80, max: 80, step: 0.5, fmt: (v) => Math.abs(v).toFixed(1) + "°" + (v >= 0 ? "N" : "S") }, { type: "tabs", key: "mode", label: "Measure", options: [["meridian", "Along a meridian (N–S)"], ["parallel", "Along P's parallel (E–W, 10° of longitude)"]] }],
    build(S, s) { const T3 = T(), g = BK.group(S, s); g.add(GK.stars()); s.gl = GK.globe(2, { clouds: false }); g.add(s.gl); PARALLELS.forEach(([lat, , col]) => s.gl.add(latTube(lat, 2.006, col, 0.01))); for (let la = -60; la <= 60; la += 30) if (la) s.gl.add(latLine(la, 2.004, 0xffffff, 0.35)); s.gl.add(lonTube(0, 2.006, 0xffffff, 0.006)); s.gl.add(lonTube(LON_B, 2.008, 0x7fffd4, 0.008)); s.dyn = new T3.Group(); g.add(s.dyn); s.k = ""; s.gl.earth.rotation.y = 0; },
    update(S, s, c) {
      s.gl.setSun(S, V(1, 0.3, 0.8));
      const key = c.la + "|" + c.lb + "|" + c.mode; if (s.k === key) return; s.k = key; const T3 = T(); BK.dispose(S, s.dyn); s.dyn = new T3.Group(); s.g.add(s.dyn);
      const P = ll(c.la, LON_B, 2), Q = ll(c.lb, LON_B, 2), E = ll(0, LON_B, 2);
      const sp = (p, col) => { const m = new T3.Mesh(new T3.SphereGeometry(0.05, 16, 12), new T3.MeshBasicMaterial({ color: col })); m.position.set(...p); s.dyn.add(m); };
      sp(P, 0xff4a3a); sp(c.mode === "meridian" ? Q : ll(c.la, LON_B + 10, 2), 0x3a8aff);
      s.dyn.add(GK.polyline([[0, 0, 0], E], 0xffffff, 0.8)); s.dyn.add(GK.polyline([[0, 0, 0], P], 0xff8a6a, 1));
      const arc = []; for (let i = 0; i <= 30; i++) arc.push(ll(c.la * i / 30, LON_B, 0.7)); s.dyn.add(GK.line(arc, 0xffd27a, 0.014));
      if (c.mode === "meridian") { const A = []; for (let i = 0; i <= 40; i++) A.push(ll(c.la + (c.lb - c.la) * i / 40, LON_B, 2.03)); s.dyn.add(GK.line(A, 0xffe14a, 0.02)); }
      else { const A = []; for (let i = 0; i <= 40; i++) A.push(ll(c.la, LON_B + 10 * i / 40, 2.03)); s.dyn.add(GK.line(A, 0xffe14a, 0.02)); }
      const disc = new T3.Mesh(new T3.CircleGeometry(2.6, 64), new T3.MeshBasicMaterial({ color: 0xff6a4a, transparent: true, opacity: 0.08, side: T3.DoubleSide, depthWrite: false })); disc.rotation.x = -Math.PI / 2; s.dyn.add(disc);
    },
    labels: (s, c) => PARALLELS.map(([lat, n, col]) => ({ id: n, p: ll(lat, -35, 2.02), t: n, col: "#" + col.toString(16).padStart(6, "0"), dx: -10 })).concat([{ id: "P", p: ll(c.la, LON_B, 2.05), t: "P " + Math.abs(c.la) + "°" + (c.la >= 0 ? "N" : "S"), col: "#ff9a8a", dx: 40, dy: -10 }, c.mode === "meridian" ? { id: "Q", p: ll(c.lb, LON_B, 2.05), t: "Q " + Math.abs(c.lb) + "°" + (c.lb >= 0 ? "N" : "S"), col: "#8fd0ff", dx: 40, dy: -10 } : { id: "Q", p: ll(c.la, LON_B + 10, 2.05), t: "10° east of P", col: "#8fd0ff", dx: 40 }, { id: "ang", p: ll(c.la / 2, LON_B, 0.75), t: "Angle at centre = " + Math.abs(c.la) + "°", col: "#ffd27a", dx: 50, dy: 10 }, { id: "np", p: [0, 2.05, 0], t: "North Pole 90°N", col: "#e8f1ff", dy: -18 }]),
    hud: (s, c) => { const d = Math.abs(c.la - c.lb), same = (c.la >= 0) === (c.lb >= 0), pk = 111.32 * Math.cos(c.la * D2R); return [{ title: c.mode === "meridian" ? "Distance P → Q along the meridian" : "Distance along a parallel", lines: c.mode === "meridian" ? [["Difference in latitude = " + f(d, 1) + "°" + (same ? "  (same hemisphere: subtract)" : "  (opposite hemispheres: add)"), "#e8f1ff"], ["Distance = " + f(d, 1) + "° × 111 km = " + Math.round(d * 111).toLocaleString("en-GB") + " km", "#ffd27a", true], "1° of latitude ≈ 111 km everywhere (all meridians are great circles).", "Latitude is measured from 0° (equator) to 90° N or S (the poles)."] : [["1° of longitude at " + Math.abs(c.la) + "° = 111.32 × cos " + Math.abs(c.la) + "° = " + f(pk, 1) + " km", "#e8f1ff"], ["10° of longitude here = " + Math.round(pk * 10).toLocaleString("en-GB") + " km", "#ffd27a", true], "Parallels get smaller towards the poles, so a degree of longitude shrinks: 111 km at the equator, 0 km at the poles."] }]; },
    readouts: (s, c) => [["P", f(c.la, 1) + "°"], ["Distance", Math.round(Math.abs(c.la - c.lb) * 111) + " km"]],
    story: [
      { d: 5, cap: "Lines of latitude (parallels) circle the earth parallel to the equator. Five important parallels are shown.", set: { la: 6.5, lb: 13.5, mode: "meridian" }, cam: [[7.4, 2.2, 1.0], [0.6, 0.3, -0.6]] },
      { d: 6, cap: "Latitude is an angle measured at the centre of the earth, north or south of the plane of the equator.", hl: "ang", tween: { la: [6.5, 40] } },
      { d: 6, cap: "Along a meridian, each degree of latitude is about 111 km. Lagos (6½°N) to Kano (12°N): 5½° × 111 ≈ 610 km.", set: { la: 6.5, lb: 12 } },
      { d: 6, cap: "For places in opposite hemispheres, add the latitudes: 10°N to 20°S is 30° apart = 3 330 km.", set: { la: 10, lb: -20 } },
      { d: 6, cap: "Along a parallel, a degree of longitude shrinks towards the poles: multiply 111.32 km by the cosine of the latitude.", set: { mode: "parallel" }, tween: { la: [0, 60] } },
    ],
    draw: GK.fallback("Latitude", ["Latitude: angle N or S of the equator at the earth's centre", "1° of latitude ≈ 111 km", "Same hemisphere subtract, opposite add"]),
  });

  /* ===================== EP-c  Longitude and time ===================== */
  const CITIES = [["Greenwich (London)", 51.5, 0], ["Lagos", 6.5, 3.4], ["Accra", 5.6, -0.2], ["Freetown", 8.5, -13.2], ["Monrovia", 6.3, -10.8], ["Banjul", 13.45, -16.6], ["Nairobi", -1.3, 36.8], ["Cairo", 30.0, 31.2], ["Dubai", 25.2, 55.3], ["Tokyo", 35.7, 139.7], ["New York", 40.7, -74.0], ["Rio de Janeiro", -22.9, -43.2]];
  const hhmm = (h) => { h = ((h % 24) + 24) % 24; const H = Math.floor(h), M = Math.round((h - H) * 60); return String(M === 60 ? H + 1 : H).padStart(2, "0") + ":" + String(M === 60 ? 0 : M).padStart(2, "0"); };
  GK.def3d("EP-c", {
    title: "Longitude and time",
    blurb: "The earth turns 360° in 24 hours — 15° every hour, 1° every 4 minutes. Set the time at Greenwich and pick a city: its local (sun) time is ahead if east, behind if west.",
    envOpts: Object.assign({}, SPACE, { sunPos: [30, 0, 0] }), cam: [[1.2, 3.2, 7.4], [0.8, 0.2, 0]],
    values: { gmt: 12, city: 1, spin: 0 },
    controls: [{ type: "slider", key: "gmt", label: "Time at Greenwich (GMT)", min: 0, max: 24, step: 0.25, fmt: hhmm }, { type: "select", key: "city", label: "Place", options: CITIES.map((x, i) => [i, x[0] + " (" + Math.abs(x[2]) + "°" + (x[2] >= 0 ? "E" : "W") + ")"]) }, { type: "toggle", key: "spin", label: "Let the earth turn (1 h per second)" }],
    build(S, s) { const T3 = T(), g = BK.group(S, s); g.add(GK.stars()); s.gl = GK.globe(2); g.add(s.gl); for (let lo = -165; lo <= 180; lo += 15) s.gl.earth.add(lonLine(lo, 2.004, lo === 180 ? 0xff8a3a : 0xffffff, lo === 180 ? 0.9 : 0.28)); s.gl.earth.add(lonTube(0, 2.006, 0xffd27a, 0.01)); s.gl.earth.add(latLine(0, 2.004, 0xff6a4a, 0.6)); s.mk = new T3.Group(); s.gl.earth.add(s.mk); s.k = -1; const sunArrow = new T3.ArrowHelper(V(-1, 0, 0), V(6.5, 0, 0), 2.2, 0xffd27a, 0.35, 0.18); g.add(sunArrow); },
    update(S, s, c, dt) {
      if (c.spin) { c.gmt = (c.gmt + dt) % 24; s.rf = (s.rf || 0) + dt; if (s.rf > 0.25) { s.rf = 0; s.H && s.H.refresh && s.H.refresh(); } }
      /* noon at Greenwich when lon 0 faces the sun (+x). Earth turns west→east (counter-clockwise seen from the north). */
      s.gl.earth.rotation.y = -(c.gmt - 12) * 15 * D2R; if (s.gl.clouds) s.gl.clouds.rotation.y = s.gl.earth.rotation.y + 0.3;
      s.gl.setSun(S, V(1, 0, 0));
      if (s.k !== c.city) { s.k = c.city; BK.dispose(S, s.mk); s.mk = new (T().Group)(); s.gl.earth.add(s.mk); const [n, la, lo] = CITIES[c.city]; const p = GK.pin(0xff4a3a, 0.35); p.position.set(...ll(la, lo, 2)); p.lookAt(0, 0, 0); p.rotateX(-Math.PI / 2); s.mk.add(p); const q = GK.pin(0xffd27a, 0.3); q.position.set(...ll(51.5, 0, 2)); q.lookAt(0, 0, 0); q.rotateX(-Math.PI / 2); s.mk.add(q); s.mk.add(lonTube(lo, 2.01, 0xff6a4a, 0.009)); }
    },
    onChange(s, c, k, H) { s.H = H; },
    labels: (s, c) => { const [n, la, lo] = CITIES[c.city], rot = s.gl ? s.gl.earth.rotation.y : 0, w = (lat, lon, r) => { const p = V(...ll(lat, lon, r)).applyAxisAngle(V(0, 1, 0), rot); return p.toArray(); }; return [{ id: "city", p: w(la, lo, 2.35), t: n + " " + hhmm(c.gmt + lo / 15), col: "#ff9a8a" }, { id: "gw", p: w(51.5, 0, 2.3), t: "Greenwich 0° · " + hhmm(c.gmt), col: "#ffd27a", dy: -40 }, { id: "idl", p: w(0, 180, 2.05), t: "International Date Line 180°", col: "#ffb36a" }, { id: "sun", p: [6.6, 0.3, 0], t: "Sunlight", col: "#ffd27a" }, { id: "day", p: [2.3, -1.2, 0.8], t: "Day side", col: "#e8f1ff", dy: 20 }, { id: "night", p: [-2.2, -1.0, 0.6], t: "Night side", col: "#9fb6d8", dy: 20 }]; },
    hud: (s, c) => { const [n, , lo] = CITIES[c.city], diff = lo / 15; return [{ title: n, lines: [["Longitude " + Math.abs(lo) + "°" + (lo >= 0 ? "E" : "W") + " → " + Math.abs(lo) + " × 4 min = " + Math.round(Math.abs(lo) * 4) + " min " + (lo >= 0 ? "ahead of" : "behind") + " Greenwich", "#e8f1ff"], ["Local time = " + hhmm(c.gmt) + (lo >= 0 ? " + " : " − ") + hhmm(Math.abs(diff)) + " = " + hhmm(c.gmt + diff), "#ffd27a", true], "Gain going East, Lose going West (GEL W).", "Standard time: countries keep one clock time per time zone — Nigeria uses GMT+1 (WAT); Ghana, Sierra Leone, Liberia and The Gambia use GMT.", "Crossing the date line westward you gain a day; eastward you lose a day."] }]; },
    readouts: (s, c) => [["GMT", hhmm(c.gmt)], ["Local", hhmm(c.gmt + CITIES[c.city][2] / 15)]],
    story: [
      { d: 5, cap: "Meridians (lines of longitude) run from pole to pole. The Prime Meridian, 0°, passes through Greenwich in London.", set: { gmt: 12, city: 0, spin: 0 }, hl: "gw" },
      { d: 6, cap: "The earth spins from west to east, 360° in 24 hours: that is 15° every hour, or 1° every 4 minutes.", tween: { gmt: [12, 18] } },
      { d: 6, cap: "Lagos is 3.4° east of Greenwich, so its sun time is 3.4 × 4 ≈ 14 minutes ahead.", set: { city: 1, gmt: 12 }, hl: "city", cam: [[4.6, 2.0, 5.4], [0.8, 0.2, 0]] },
      { d: 6, cap: "Banjul is 16.6° west: 16.6 × 4 ≈ 66 minutes behind. When it is noon in Greenwich, it is about 10:54 in Banjul.", set: { city: 5 } },
      { d: 6, cap: "Tokyo, 139.7° east, is about 9 h 19 min ahead. Places on the dark side of the globe are at night.", set: { city: 9 }, cam: [[1.2, 3.2, 7.4], [0.8, 0.2, 0]] },
    ],
    draw: GK.fallback("Longitude and time", ["15° = 1 hour; 1° = 4 minutes", "East ahead, west behind (GEL W)", "International Date Line at 180°"]),
  });

  /* ===================== EP-d  Rotation of the earth and its effects ===================== */
  GK.def3d("EP-d", {
    title: "Rotation of the earth and its effects",
    blurb: "The earth spins on its tilted axis once in 24 hours. Watch day and night sweep around the globe, and see how rotation deflects winds and ocean currents (Coriolis force).",
    envOpts: Object.assign({}, SPACE, { sunPos: [30, 0, 0] }), cam: [[2.6, 2.8, 7.0], [0.6, 0, 0]],
    values: { speed: 1, coriolis: 1, axis: 1 },
    controls: [{ type: "slider", key: "speed", label: "Spin speed", min: 0, max: 4, step: 0.1 }, { type: "toggle", key: "coriolis", label: "Show deflection of winds (Coriolis)" }, { type: "toggle", key: "axis", label: "Show axis and circle of illumination" }],
    build(S, s) { const T3 = T(), g = BK.group(S, s); g.add(GK.stars()); s.tilt = new T3.Group(); s.tilt.rotation.z = 23.44 * D2R; g.add(s.tilt); s.gl = GK.globe(2); s.tilt.add(s.gl); s.ax = new T3.Mesh(new T3.CylinderGeometry(0.014, 0.014, 5.6, 8), new T3.MeshBasicMaterial({ color: 0xffd27a })); s.tilt.add(s.ax); const ring = new T3.Mesh(new T3.TorusGeometry(2.03, 0.01, 8, 128), new T3.MeshBasicMaterial({ color: 0xffe14a })); ring.rotation.y = Math.PI / 2; g.add(ring); s.ring = ring;
      /* Coriolis paths: air moving from 30° towards the equator (trade winds) deflects right in the north, left in the south */
      s.cor = new T3.Group(); s.gl.earth.add(s.cor); [[30, 1], [-30, -1]].forEach(([la0, h]) => [-30, 30, 90, 150, 210].forEach((lo0) => { const P = []; for (let i = 0; i <= 30; i++) { const t = i / 30; P.push(ll(la0 * (1 - t * 0.92), lo0 - 22 * t * t, 2.02)); } const tube = GK.line(P, h > 0 ? 0x7fd6ff : 0xa7ff7f, 0.012); s.cor.add(tube); const tip = new T3.Mesh(new T3.ConeGeometry(0.045, 0.12, 10), new T3.MeshBasicMaterial({ color: h > 0 ? 0x7fd6ff : 0xa7ff7f })); const a = V(...P[29]), b = V(...P[30]); tip.position.copy(b); tip.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); s.cor.add(tip); })); },
    update(S, s, c, dt) { s.gl.earth.rotation.y += dt * 0.25 * c.speed; if (s.gl.clouds) s.gl.clouds.rotation.y += dt * 0.27 * c.speed; s.gl.setSun(S, V(1, 0, 0)); s.cor.visible = !!c.coriolis; s.ax.visible = s.ring.visible = !!c.axis; },
    labels: (s, c) => [{ id: "day", p: [2.1, 0.2, 0.9], t: "DAY — facing the sun", col: "#ffe7a8" }, { id: "night", p: [-2.0, 0.3, 0.8], t: "NIGHT — turned away", col: "#9fb6d8" }, c.axis ? { id: "ill", p: [0, 1.4, 1.45], t: "Circle of illumination (dawn / dusk)", col: "#ffe14a", dy: -36 } : null, c.axis ? { id: "axis", p: [-Math.sin(23.44 * D2R) * 2.8, Math.cos(23.44 * D2R) * 2.8, 0], t: "Axis tilted 23½° — points to the Pole Star", col: "#ffd27a" } : null, c.coriolis ? { id: "nh", p: [1.4, 1.0, 1.3], t: "N. hemisphere: deflected to the RIGHT", col: "#7fd6ff", dx: 60 } : null, c.coriolis ? { id: "sh", p: [1.4, -1.0, 1.3], t: "S. hemisphere: deflected to the LEFT", col: "#a7ff7f", dx: 60, dy: 26 } : null, { id: "sun", p: [6, 0, 0], t: "Sun's rays", col: "#ffd27a" }],
    hud: () => [{ title: "Rotation: one turn in 24 hours", lines: [["The earth spins from west to east on its axis, once every 24 hours (more exactly 23 h 56 min).", "#ffd27a", true], "Effects: day and night; the sun appears to rise in the east and set in the west; time differences between places (15° per hour); deflection of winds and ocean currents (Ferrel's law: right in the north, left in the south); two tides a day.", "Speed of rotation at the equator ≈ 1 670 km/h, decreasing to 0 at the poles."] }],
    story: [
      { d: 5, cap: "The earth spins on its axis from west to east. Half of the globe faces the sun and has day; the other half has night.", set: { speed: 1, coriolis: 0, axis: 1 }, hl: "day" },
      { d: 6, cap: "The circle of illumination divides day from night. Places crossing it into the light have dawn; places leaving it have dusk.", hl: "ill", set: { speed: 2 } },
      { d: 6, cap: "Because the earth turns eastward, the sun appears to rise in the east and set in the west.", cam: [[5.4, 1.0, 4.0], [0, 0, 0]] },
      { d: 7, cap: "Rotation deflects moving air and water: to the right in the northern hemisphere and to the left in the southern. This is why the trade winds blow from the north-east and south-east.", set: { coriolis: 1, speed: 0.6 }, cam: [[2.6, 2.8, 7.0], [0.6, 0, 0]], hl: "nh" },
    ],
    draw: GK.fallback("Rotation", ["One turn in 24 hours, west to east", "Causes day and night", "Deflects winds: right in N, left in S"]),
  });

  /* ===================== EP-e  Revolution, seasons and the noon sun ===================== */
  const decl = (n) => 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const dateOf = (n) => { let m = 0; n = Math.round(n); while (m < 11 && n > MD[m]) { n -= MD[m]; m++; } return n + " " + MONTHS[m]; };
  const KEY = [[80, "21 Mar · Spring (vernal) equinox"], [172, "21 Jun · Summer solstice"], [266, "23 Sep · Autumn equinox"], [356, "22 Dec · Winter solstice"]];
  const ORB = 7;
  /* orbit angle: day 172 (June solstice) puts the north pole tilted towards the sun */
  const orbPos = (n) => { const a = (n - 172) / 365.25 * 2 * Math.PI; return [-ORB * Math.cos(a), 0, ORB * Math.sin(a)]; };
  GK.def3d("EP-e", {
    title: "Revolution, seasons and the noon sun",
    blurb: "The earth travels round the sun in 365¼ days with its axis always tilted 23½° the same way. Drag the date: see where the sun is overhead, the noon sun's angle and the length of day at your latitude.",
    envOpts: Object.assign({}, SPACE, { sun: 0, hemi: 0.06 }), cam: [[3, 9, 15], [1.2, -0.5, 0]], fov: 42,
    values: { day: 172, lat: 6.5 },
    controls: [{ type: "slider", key: "day", label: "Date", min: 1, max: 365, step: 1, fmt: dateOf }, { type: "slider", key: "lat", label: "Your latitude", min: -66, max: 66, step: 0.5, fmt: (v) => Math.abs(v).toFixed(1) + "°" + (v >= 0 ? "N" : "S") }],
    build(S, s) { const T3 = T(), g = BK.group(S, s); g.add(GK.stars()); g.add(sunMesh(1.0)); g.add(new T3.PointLight(0xfff2dd, 120, 0, 1.2));
      const op = []; for (let i = 0; i <= 128; i++) op.push(orbPos(i / 128 * 365.25)); g.add(GK.polyline(op, 0x8aa0c8, 0.6));
      s.ghosts = KEY.map(([n]) => { const m = new T3.Mesh(new T3.SphereGeometry(0.22, 24, 16), new T3.MeshStandardMaterial({ color: 0x6a8ab0, transparent: true, opacity: 0.35 })); m.position.set(...orbPos(n)); g.add(m); return m; });
      s.holder = new T3.Group(); g.add(s.holder); s.tilt = new T3.Group(); s.tilt.rotation.z = -23.44 * D2R; s.holder.add(s.tilt); s.gl = GK.globe(1.0, { clouds: false }); s.tilt.add(s.gl); const ax = new T3.Mesh(new T3.CylinderGeometry(0.01, 0.01, 3.0, 8), new T3.MeshBasicMaterial({ color: 0xffd27a })); s.tilt.add(ax); s.tilt.add(latTube(0, 1.005, 0xff6a4a, 0.007)); s.tilt.add(latTube(23.44, 1.005, 0xffc04a, 0.006)); s.tilt.add(latTube(-23.44, 1.005, 0xffc04a, 0.006)); s.latRing = new T3.Group(); s.tilt.add(s.latRing); s.kl = null; },
    update(S, s, c, dt) { const p = orbPos(c.day); s.holder.position.set(...p); s.gl.earth.rotation.y += dt * 0.6; s.gl.setSun(S, V(-p[0], 0, -p[2])); if (s.kl !== c.lat) { s.kl = c.lat; BK.dispose(S, s.latRing); s.latRing = latTube(c.lat, 1.01, 0x7fffd4, 0.007); s.tilt.add(s.latRing); } },
    overlay(ctx, s, c, S, B) {
      const d = decl(c.day), alt = 90 - Math.abs(c.lat - d), x0 = GK.storyOn ? 428 : 12, y0 = (GK.storyOn ? 168 : 240), w = 200, h = 148; B.panel(x0, y0, w, h);
      ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("NOON SUN AT " + Math.abs(c.lat) + "°" + (c.lat >= 0 ? "N" : "S"), x0 + 10, y0 + 16);
      const gx = x0 + 100, gy = y0 + 122; ctx.strokeStyle = "#8fd06a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 12, gy); ctx.lineTo(x0 + w - 12, gy); ctx.stroke();
      const dirS = (c.lat - d) >= 0 ? -1 : 1, a = alt * D2R, L = 90; const sx = gx + dirS * Math.cos(a) * L, sy = gy - Math.sin(a) * L;
      ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(sx, sy); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#ffd23a"; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "#ffd27a"; ctx.beginPath(); ctx.arc(gx, gy, 26, dirS < 0 ? Math.PI : -a, dirS < 0 ? Math.PI + a : 0); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "700 11px 'IBM Plex Sans',sans-serif"; ctx.fillText(f(alt, 1) + "°", gx + (dirS < 0 ? -62 : 30), gy - 8); ctx.font = "9px 'IBM Plex Sans',sans-serif"; ctx.fillStyle = "#cfe0f5"; ctx.fillText(dirS < 0 ? "sun to the SOUTH" : "sun to the NORTH", x0 + 12, gy + 14); ctx.fillStyle = "#333"; ctx.fillRect(gx - 2, gy - 18, 4, 18);
    },
    labels: (s, c) => KEY.map(([n, t], i) => ({ id: "k" + i, p: orbPos(n).map((v, j) => (j === 1 ? 0.3 : v)), t, col: Math.abs(c.day - n) < 6 ? "#ffd27a" : "#b9c8e0", dy: i % 2 ? 24 : -24 })).concat([{ id: "earth", p: orbPos(c.day).map((v, j) => (j === 1 ? 0.9 : v)), t: "Earth · " + dateOf(c.day), col: "#8fd0ff", dy: -52, dx: 30 }, { id: "sun", p: [0, 1.1, 0], t: "Sun", col: "#ffcf6a" }, { id: "peri", p: orbPos(3).map((v, j) => (j === 1 ? -0.3 : v)), t: "Perihelion 3 Jan · 147 million km", col: "#9fb6d8", dy: 40 }, { id: "aph", p: orbPos(185).map((v, j) => (j === 1 ? -0.3 : v)), t: "Aphelion 4 Jul · 152 million km", col: "#9fb6d8", dy: 40 }]),
    hud: (s, c) => { const d = decl(c.day), alt = 90 - Math.abs(c.lat - d), x = -Math.tan(c.lat * D2R) * Math.tan(d * D2R), dl = x <= -1 ? 24 : x >= 1 ? 0 : 2 * Math.acos(x) / D2R / 15; return [{ title: dateOf(c.day) + " — sun overhead at " + f(Math.abs(d), 1) + "°" + (d >= 0 ? "N" : "S"), lines: [["Noon sun altitude = 90° − (" + f(Math.abs(c.lat), 1) + "° " + ((c.lat >= 0) === (d >= 0) ? "−" : "+") + " " + f(Math.abs(d), 1) + "°) = " + f(alt, 1) + "°", "#ffd27a", true], ["Length of day ≈ " + f(dl, 1) + " h · night ≈ " + f(24 - dl, 1) + " h", "#8fd0ff", true], "The overhead (vertical) noon sun migrates between 23½°N (21 June) and 23½°S (22 December), crossing the equator at the equinoxes.", "Effects of revolution with the tilted axis: seasons, changing lengths of day and night, varying altitude of the noon sun, midnight sun beyond the Arctic and Antarctic Circles."] }]; },
    readouts: (s, c) => [["Declination", f(decl(c.day), 1) + "°"], ["Noon sun", f(90 - Math.abs(c.lat - decl(c.day)), 1) + "°"]],
    story: [
      { d: 6, cap: "The earth revolves round the sun once in 365¼ days. Its axis stays tilted at 23½° and always points the same way in space.", set: { day: 80, lat: 6.5 }, cam: [[3, 9, 15], [1.2, -0.5, 0]], hl: "sun" },
      { d: 7, cap: "From March to June the northern hemisphere leans towards the sun. On 21 June the noon sun is overhead at the Tropic of Cancer, 23½°N.", tween: { day: [80, 172] }, hl: "k1" },
      { d: 7, cap: "By 23 September the sun is overhead at the equator again: day and night are equal everywhere — the equinox.", tween: { day: [172, 266] }, hl: "k2" },
      { d: 7, cap: "On 22 December the southern hemisphere leans towards the sun: the noon sun is overhead at the Tropic of Capricorn, 23½°S.", tween: { day: [266, 356] }, hl: "k3" },
      { d: 6, cap: "At Lagos (6½°N) the noon sun is always high — between 60° and 90° — so West Africa is hot all year.", set: { lat: 6.5, day: 172 } },
    ],
    draw: GK.fallback("Revolution and seasons", ["One revolution in 365¼ days", "Tilted axis (23½°) causes seasons", "Noon sun altitude = 90° − (lat ± declination)"]),
  });

  /* ===================== EP-f  Structure of the earth ===================== */
  const LAYERS = [
    ["crust", "Crust", 0, 35, 0x8a6a4a, "0–35 km (5–10 km under oceans, up to 70 km under mountains). Solid rock: SIAL (silica + aluminium, continents, lighter) over SIMA (silica + magnesium, ocean floor)."],
    ["mantle", "Mantle", 35, 2900, 0xd2552a, "35–2 900 km. Hot, dense rock rich in iron and magnesium; the upper part (asthenosphere) is partly molten and flows slowly, moving the plates."],
    ["outer", "Outer core", 2900, 5150, 0xf0a030, "2 900–5 150 km. Liquid iron and nickel (NIFE), about 4 000–5 000 °C. Its movement creates the earth's magnetic field."],
    ["inner", "Inner core", 5150, 6371, 0xfff0a0, "5 150–6 371 km. Solid iron and nickel, about 5 500 °C — solid because of the enormous pressure."],
  ];
  GK.def3d("EP-f", {
    title: "Structure of the earth",
    blurb: "A cut-away globe showing the crust, mantle, outer core and inner core to scale (the crust is thickened so you can see it). Pick a layer to read its depth, state and composition.",
    envOpts: Object.assign({}, SPACE, { sunPos: [-12, 9, 12], sun: 2.6, hemi: 0.25, envI: 0.25 }), cam: [[-4.4, 3.0, 6.6], [-0.9, 0.1, 0.5]],
    values: { layer: "mantle" },
    controls: [{ type: "tabs", key: "layer", label: "Layer", options: LAYERS.map((l) => [l[0], l[1]]) }],
    build(S, s) {
      const T3 = T(), g = BK.group(S, s), R = 2.4; g.add(GK.stars());
      const shell = GK.globe(R, { clouds: false, night: false }); shell.earth.geometry.dispose(); shell.earth.geometry = new T3.SphereGeometry(R, 128, 64, Math.PI * 0.5, Math.PI * 1.5); shell.remove(shell.atmo); shell.earth.material.side = T3.DoubleSide; g.add(shell);
      const rOf = (depth) => R * (1 - depth / 6371) - (depth > 0 && depth < 100 ? 0 : 0);
      s.rad = []; const cut = (r0, r1, col) => { const mat = new T3.MeshStandardMaterial({ color: col, roughness: 0.75, side: T3.DoubleSide, emissive: col, emissiveIntensity: 0.12 }); [0, Math.PI / 2].forEach((rot, k) => { const m = new T3.Mesh(new T3.RingGeometry(r0, r1, 96, 1, Math.PI / 2, Math.PI), mat); m.rotation.y = k ? Math.PI / 2 : 0; g.add(m); }); return mat; };
      /* thickened crust for visibility: 0.14 units */
      const CR = R - 0.14; s.mats = {};
      s.mats.crust = cut(CR, R, LAYERS[0][4]);
      s.mats.mantle = cut(rOf(2900), CR, LAYERS[1][4]);
      s.mats.outer = cut(rOf(5150), rOf(2900), LAYERS[2][4]);
      s.mats.inner = cut(0.001, rOf(5150), LAYERS[3][4]);
      s.R = R; s.CR = CR; s.rOf = rOf;
    },
    update(S, s, c) { Object.entries(s.mats).forEach(([k, m]) => { m.emissiveIntensity = k === c.layer ? 0.55 : 0.08; }); },
    labels: (s, c) => { if (!s.rOf) return []; const mid = (a, b) => (a + b) / 2, at = (r) => [r * 0.45, r * 0.62, r * 0.64]; const R = s.R; return [
      { id: "crust", p: [0.02, R - 0.07, 0.6], t: "Crust (SIAL / SIMA) 0–35 km", col: c.layer === "crust" ? "#ffd27a" : "#e8f1ff", dx: -70, dy: -30 },
      { id: "moho", p: [0.02, s.CR, 0.3], t: "Mohorovičić discontinuity", col: "#b9c8e0", dx: -110, dy: -6 },
      { id: "mantle", p: [0.02, mid(s.rOf(2900), s.CR), 0.9], t: "Mantle 35–2 900 km", col: c.layer === "mantle" ? "#ffd27a" : "#e8f1ff", dx: -90 },
      { id: "gut", p: [0.02, s.rOf(2900), 0.2], t: "Gutenberg discontinuity", col: "#b9c8e0", dx: -110, dy: 4 },
      { id: "outer", p: [0.02, mid(s.rOf(5150), s.rOf(2900)), 0.4], t: "Outer core (liquid) 2 900–5 150 km", col: c.layer === "outer" ? "#ffd27a" : "#e8f1ff", dx: -120, dy: 10 },
      { id: "inner", p: [0.02, 0.15, 0.12], t: "Inner core (solid) 5 150–6 371 km", col: c.layer === "inner" ? "#ffd27a" : "#e8f1ff", dx: -120, dy: 28 },
    ]; },
    hud: (s, c) => { const L = LAYERS.find((l) => l[0] === c.layer); return [{ title: L[1], lines: [[L[5], "#ffd27a", true], "—", "Temperature and density increase with depth.", "Evidence comes mainly from earthquake (seismic) waves: S-waves cannot pass through the liquid outer core.", "Lithosphere = crust + rigid upper mantle, broken into plates."] }]; },
    story: LAYERS.map((L, i) => ({ d: 5.5, title: L[1], cap: L[1] + ": " + L[5], set: { layer: L[0] }, hl: L[0], cam: [[-4.4 + i * 0.5, 3.0 - i * 0.4, 6.6 - i * 0.9], [-0.9 + i * 0.15, 0.1, 0.5]] })),
    draw: GK.fallback("Structure of the earth", LAYERS.map((l) => l[1] + ": " + l[5])),
  });
})();
