/* agric-kit3.js — Agricultural Science toolkit part 3: farm machinery and tractor implements (with
   exploded part views), hand tools, survey kit, farm buildings and structures, irrigation and drainage,
   soil columns and profiles, animated cycles / flow diagrams, organ chains (digestive and reproductive
   tracts), 3D bar charts, and 2D board helpers (graphs, curves, bar charts, tables, money). */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, AK = window.AK;
  const T = () => window.THREE, V3 = (x, y, z) => new (T().Vector3)(x, y, z);
  const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new (T().Mesh)(new (T().BoxGeometry)(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
  const cyl = (r0, r1, h, mat, x = 0, y = 0, z = 0, seg = 16) => { const m = new (T().Mesh)(new (T().CylinderGeometry)(r0, r1, h, seg), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
  const sph = (r, mat, x = 0, y = 0, z = 0) => { const m = new (T().Mesh)(new (T().SphereGeometry)(r, 18, 12), mat); m.position.set(x, y, z); m.castShadow = true; return m; };
  AK.box = box; AK.cyl = cyl; AK.sph = sph;
  /* a named part: parts carry .home (assembled position) and .ex (exploded offset) */
  const part = (g, obj, name, ex) => { obj.name = name; obj.userData.home = obj.position.clone(); obj.userData.ex = V3(...(ex || [0, 0, 0])); g.add(obj); (g.parts = g.parts || []).push(obj); return obj; };
  AK.explode = (g, k) => (g.parts || []).forEach((p) => p.position.copy(p.userData.home).addScaledVector(p.userData.ex, k));

  /* ---------- wheel with tread ---------- */
  const treadTex = () => { if (AK._tread) return AK._tread; const c = BK.cv(64, 256), g = c.getContext("2d"); g.fillStyle = "#808080"; g.fillRect(0, 0, 64, 256); g.fillStyle = "#ffffff"; for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(32, y + 14); g.lineTo(64, y); g.lineTo(64, y + 10); g.lineTo(32, y + 24); g.lineTo(0, y + 10); g.fill(); } const t = new (T().CanvasTexture)(c); t.wrapS = t.wrapT = T().RepeatWrapping; t.repeat.set(1, 3); AK._tread = t; return t; };
  AK.wheel = (r = 0.5, w = 0.3, rim = 0xd8a020) => { const T3 = T(), g = new T3.Group(), tyre = new T3.Mesh(new T3.TorusGeometry(r * 0.78, r * 0.24, 12, 32), new T3.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9, bumpMap: treadTex(), bumpScale: 4 })); tyre.scale.z = w / (r * 0.5); g.add(tyre); const hub = cyl(r * 0.56, r * 0.56, w * 0.6, AK.paint(rim)); hub.rotation.x = Math.PI / 2; g.add(hub); const cap = cyl(r * 0.18, r * 0.18, w * 0.7, AK.metal()); cap.rotation.x = Math.PI / 2; g.add(cap); BK.shadow(g); return g; };

  /* ---------- tractor (parts labelled; facing +x) ---------- */
  AK.tractor = (col = 0xc8321e) => {
    const T3 = T(), g = new T3.Group(), body = AK.paint(col), dark = AK.std(0x222428, { roughness: 0.6 }), steel = AK.metal();
    part(g, box(1.3, 0.55, 0.62, body, 0.55, 0.95, 0), "Engine bonnet", [0.4, 0.5, 0]);
    part(g, box(0.18, 0.5, 0.56, AK.std(0x3a3a3a, { roughness: 0.4, metalness: 0.6 }), 1.25, 0.92, 0), "Radiator grille", [0.9, 0, 0]);
    part(g, box(0.6, 0.45, 0.5, dark, 0.4, 0.55, 0), "Engine and gearbox", [0, -0.4, 0.9]);
    part(g, box(0.5, 0.7, 0.9, body, -0.35, 1.05, 0), "Seat and fuel tank", [-0.2, 0.6, 0]);
    const cab = new T3.Group(); [[-0.6, 0.42], [-0.6, -0.42], [-0.05, 0.42], [-0.05, -0.42]].forEach(([x, z]) => cab.add(cyl(0.03, 0.03, 1.1, dark, x, 1.95, z, 8))); cab.add(box(0.75, 0.05, 1.0, body, -0.33, 2.5, 0)); part(g, cab, "Safety frame (ROPS)", [0, 1.0, 0]);
    part(g, cyl(0.04, 0.05, 0.6, AK.std(0x2a2a2a, { metalness: 0.6, roughness: 0.4 }), 0.9, 1.5, 0.2, 8), "Exhaust", [0, 0.8, 0]);
    const sw = new T3.Mesh(new T3.TorusGeometry(0.16, 0.02, 8, 20), dark); sw.position.set(-0.1, 1.55, 0); sw.rotation.set(0, Math.PI / 2, 0.5); part(g, sw, "Steering wheel", [0.3, 0.6, 0]);
    const rw1 = AK.wheel(0.75, 0.42), rw2 = AK.wheel(0.75, 0.42); rw1.position.set(-0.45, 0.75, 0.62); rw2.position.set(-0.45, 0.75, -0.62); part(g, rw1, "Rear wheel (drive)", [0, 0, 0.8]); part(g, rw2, "Rear wheel", [0, 0, -0.8]);
    const fw1 = AK.wheel(0.42, 0.24), fw2 = AK.wheel(0.42, 0.24); fw1.position.set(1.0, 0.42, 0.45); fw2.position.set(1.0, 0.42, -0.45); part(g, fw1, "Front wheel (steering)", [0.3, 0, 0.6]); part(g, fw2, "Front wheel", [0.3, 0, -0.6]);
    const hitch = new T3.Group(); hitch.add(box(0.5, 0.05, 0.05, steel, -1.05, 0.55, 0.3)); hitch.add(box(0.5, 0.05, 0.05, steel, -1.05, 0.55, -0.3)); hitch.add(box(0.05, 0.4, 0.05, steel, -0.95, 0.85, 0)); part(g, hitch, "Three-point hitch", [-0.8, 0, 0]);
    part(g, cyl(0.04, 0.04, 0.2, AK.paint(0xe0a020), -0.98, 0.7, 0, 10), "PTO shaft", [-0.9, -0.3, 0]).rotation.z = Math.PI / 2;
    part(g, box(0.2, 0.25, 0.25, AK.std(0x1a1a1a, { roughness: 0.5 }), 0.7, 1.3, -0.45), "Battery", [0, 0.4, -0.8]);
    part(g, cyl(0.06, 0.06, 0.6, AK.paint(0xd8d8d8), -0.75, 1.0, 0.3, 10), "Hydraulic cylinder", [-0.5, 0.4, 0.4]).rotation.z = 0.5;
    g.wheels = [rw1, rw2, fw1, fw2]; BK.shadow(g); return g;
  };
  /* implements (hitched behind at -x). type: disc | mouldboard | harrow | ridger | planter | sprayer | cultivator | harvester | trailer | slasher */
  AK.implement = (type = "disc") => {
    const T3 = T(), g = new T3.Group(), frame = AK.paint(0x2a5aa8), steel = AK.metal(0xb8b8b8);
    g.add(box(0.12, 0.12, 1.8, frame, 0, 0.6, 0));
    if (type === "disc" || type === "harrow") { const n = type === "disc" ? 3 : 8; for (let i = 0; i < n; i++) { const d = new T3.Mesh(new T3.SphereGeometry(type === "disc" ? 0.32 : 0.22, 20, 10, 0, 6.283, 0, 0.5), AK.metal(0xd8d8d8)); d.rotation.set(0, 0.35, Math.PI / 2); d.position.set(-0.2, 0.3, -0.7 + i * (1.4 / Math.max(1, n - 1))); d.material.side = T3.DoubleSide; g.add(d); g.add(cyl(0.02, 0.02, 0.4, frame, -0.1, 0.45, d.position.z, 6)); } if (type === "harrow") g.add(box(0.1, 0.1, 1.8, frame, -0.4, 0.55, 0)); }
    if (type === "mouldboard") for (let i = 0; i < 2; i++) { const mb = new T3.Mesh(new T3.CylinderGeometry(0.3, 0.3, 0.5, 16, 1, true, 0, 1.8), AK.metal(0xd0d0d0)); mb.material.side = T3.DoubleSide; mb.rotation.z = Math.PI / 2; mb.position.set(-0.3, 0.3, -0.35 + i * 0.7); g.add(mb); g.add(box(0.5, 0.03, 0.1, steel, -0.3, 0.06, mb.position.z)); }
    if (type === "ridger") for (let i = 0; i < 3; i++) { const r = new T3.Mesh(new T3.ConeGeometry(0.22, 0.5, 4), AK.metal(0xd0d0d0)); r.rotation.z = Math.PI / 2; r.position.set(-0.25, 0.2, -0.6 + i * 0.6); g.add(r); }
    if (type === "planter") for (let i = 0; i < 2; i++) { g.add(cyl(0.18, 0.12, 0.4, AK.paint(0xf2c21a), -0.2, 0.95, -0.45 + i * 0.9)); const w = AK.wheel(0.18, 0.08, 0x2a5aa8); w.rotation.y = 0; w.position.set(-0.4, 0.18, -0.45 + i * 0.9); g.add(w); }
    if (type === "sprayer") { AK.addm(g, cyl(0.35, 0.35, 0.8, AK.phys(0xf4f4f0, { roughness: 0.3 }), -0.2, 0.95, 0)).rotation.x = Math.PI / 2; g.add(box(0.05, 0.05, 4, steel, -0.5, 0.7, 0)); for (let i = 0; i < 9; i++) g.add(cyl(0.012, 0.02, 0.06, AK.std(0x2a2a2a), -0.5, 0.64, -1.8 + i * 0.45, 6)); }
    if (type === "cultivator" || type === "slasher") for (let i = 0; i < 7; i++) g.add(box(0.04, 0.5, 0.04, steel, -0.2, 0.3, -0.75 + i * 0.25));
    if (type === "trailer") { g.add(box(1.6, 0.5, 1.2, AK.paint(0x4a7a2a), -0.9, 0.75, 0)); const w1 = AK.wheel(0.3, 0.2), w2 = AK.wheel(0.3, 0.2); w1.position.set(-0.9, 0.3, 0.65); w2.position.set(-0.9, 0.3, -0.65); g.add(w1, w2); }
    BK.shadow(g); return g;
  };
  AK.combine = () => { const T3 = T(), g = new T3.Group(), b = AK.paint(0x2a8a3a); part(g, box(2.4, 1.4, 1.5, b, 0, 1.4, 0), "Threshing body (drum and sieves)", [0, 0.6, 0]); part(g, box(0.9, 0.9, 1.0, AK.glass(), 0.8, 2.5, 0), "Cab", [0.3, 0.8, 0]); part(g, box(0.6, 0.6, 3.2, b, 1.6, 0.5, 0), "Header (cutter bar and reel)", [1.0, 0, 0]); const reel = cyl(0.3, 0.3, 3.0, AK.paint(0xf2c21a), 1.85, 0.85, 0, 12); reel.rotation.x = Math.PI / 2; part(g, reel, "Reel", [1.2, 0.4, 0]); const sp = cyl(0.12, 0.12, 1.6, b, -0.4, 2.4, 0.9, 10); sp.rotation.z = 1.2; part(g, sp, "Grain unloading auger", [0, 0.6, 0.8]); part(g, box(0.8, 0.6, 1.0, b, -0.6, 2.4, 0), "Grain tank", [-0.4, 0.8, 0]); const w = [[0.6, 0.65, 0.85], [0.6, 0.65, -0.85], [-0.9, 0.45, 0.75], [-0.9, 0.45, -0.75]].map(([x, r, z]) => { const wh = AK.wheel(r, 0.35); wh.position.set(x, r, z); g.add(wh); return wh; }); g.wheels = w; BK.shadow(g); return g; };
  AK.bulldozer = () => { const T3 = T(), g = new T3.Group(), y = AK.paint(0xf2b21a); part(g, box(1.8, 0.8, 1.2, y, 0, 1.0, 0), "Engine and body", [0, 0.5, 0]); part(g, box(0.7, 0.7, 0.9, AK.glass(), -0.4, 1.75, 0), "Cab", [0, 0.6, 0]); [-0.7, 0.7].forEach((z) => part(g, box(2.2, 0.5, 0.4, AK.std(0x2a2a2a, { roughness: 0.8 }), 0, 0.3, z), z > 0 ? "Crawler track" : "Track", [0, -0.2, z * 0.8])); part(g, box(0.15, 0.8, 2.2, y, 1.4, 0.45, 0), "Blade", [0.7, 0, 0]); part(g, box(0.3, 0.6, 0.1, AK.metal(), -1.2, 0.4, 0), "Ripper", [-0.6, 0, 0]); BK.shadow(g); return g; };
  /* small machines: sheller | dryer | incubator | milker | knapsack | grater | winnower | pump | thresher | mill | candler */
  AK.machine = (type) => {
    const T3 = T(), g = new T3.Group(), b = AK.paint(0x2a6ad8), steel = AK.metal(0xc8c8c8);
    if (type === "sheller" || type === "thresher" || type === "mill") { part(g, box(0.8, 0.6, 0.6, b, 0, 0.8, 0), "Drum housing", [0, 0.3, 0]); part(g, new T3.Mesh(new T3.ConeGeometry(0.35, 0.4, 4, 1, true), steel), "Hopper (feed in)", [0, 0.5, 0]).position.set(0, 1.3, 0); [[-0.3, 0.25], [-0.3, -0.25], [0.3, 0.25], [0.3, -0.25]].forEach(([x, z]) => g.add(cyl(0.025, 0.025, 0.5, steel, x, 0.25, z, 6))); part(g, box(0.3, 0.06, 0.4, steel, 0.55, 0.55, 0), "Grain outlet chute", [0.4, 0, 0]); part(g, cyl(0.2, 0.2, 0.05, AK.std(0x2a2a2a), 0, 0.8, 0.36), "Pulley (engine drive)", [0, 0, 0.5]).rotation.x = Math.PI / 2; }
    if (type === "dryer") { part(g, box(1.2, 1.4, 0.8, AK.metal(0xd8d8d8), 0, 0.7, 0), "Drying chamber with trays", [0, 0.4, 0]); for (let i = 0; i < 5; i++) g.add(box(1.1, 0.02, 0.7, AK.std(0x8a6a3a), 0, 0.3 + i * 0.25, 0.05)); part(g, cyl(0.15, 0.15, 0.3, AK.std(0x2a2a2a), -0.75, 0.4, 0), "Heater and fan", [-0.5, 0, 0]).rotation.z = Math.PI / 2; part(g, cyl(0.06, 0.06, 0.5, steel, 0.3, 1.6, 0), "Moist air outlet", [0, 0.5, 0]); }
    if (type === "incubator") { part(g, box(0.9, 0.7, 0.6, AK.paint(0xf4f4f0), 0, 0.35, 0), "Insulated cabinet", [0, 0, 0]); part(g, box(0.75, 0.04, 0.5, steel, 0, 0.45, 0), "Egg-turning tray", [0, 0.5, 0]); for (let i = 0; i < 12; i++) { const e = sph(0.035, AK.phys(0xe8d8c0, { roughness: 0.5 }), -0.3 + (i % 6) * 0.12, 0.5, -0.12 + Math.floor(i / 6) * 0.24); e.scale.y = 1.3; g.add(e); } part(g, box(0.2, 0.12, 0.02, AK.std(0x111111, { emissive: 0x22aa44, emissiveIntensity: 0.6 }), 0.25, 0.6, 0.31), "Thermostat (37.5 °C) and humidity display", [0, 0.2, 0.4]); }
    if (type === "milker") { part(g, cyl(0.2, 0.2, 0.4, AK.metal(0xe0e0e0), 0, 0.2, 0), "Milk bucket", [0, 0, 0.4]); part(g, box(0.25, 0.2, 0.2, AK.std(0x2a2a2a), 0.4, 0.1, 0), "Vacuum pump", [0.4, 0, 0]); const cl = new T3.Group(); for (let i = 0; i < 4; i++) cl.add(cyl(0.03, 0.025, 0.14, AK.metal(), (i % 2) * 0.08 - 0.04, 0.6, Math.floor(i / 2) * 0.08 - 0.04, 8)); part(g, cl, "Teat cups (cluster)", [0, 0.4, 0]); g.add(AK.line([[0, 0.4, 0], [0, 0.55, 0]], 0x111111, 0.01)); }
    if (type === "knapsack") { part(g, box(0.35, 0.5, 0.18, AK.phys(0xe8e8e0, { roughness: 0.4 }), 0, 0.9, 0), "Tank (16 litres)", [0, 0, -0.3]); part(g, cyl(0.02, 0.02, 0.5, AK.std(0x2a2a2a), 0.25, 0.9, 0.05, 6), "Pump lever", [0.3, 0, 0]); part(g, cyl(0.01, 0.01, 0.8, steel, 0.55, 0.55, 0, 6), "Lance", [0.4, 0, 0]).rotation.z = 1.0; part(g, sph(0.02, AK.std(0xf2c21a), 0.88, 0.32, 0), "Nozzle", [0.5, 0, 0]); }
    if (type === "grater") { part(g, box(0.6, 0.4, 0.5, b, 0, 0.6, 0), "Grating drum", [0, 0.3, 0]); part(g, box(0.3, 0.3, 0.3, AK.std(0x2a2a2a), -0.5, 0.5, 0), "Engine", [-0.4, 0, 0]); part(g, box(0.4, 0.05, 0.4, steel, 0.45, 0.35, 0), "Mash tray", [0.4, 0, 0]); [[-0.25, 0.2], [0.25, 0.2], [-0.25, -0.2], [0.25, -0.2]].forEach(([x, z]) => g.add(cyl(0.02, 0.02, 0.4, steel, x, 0.2, z, 6))); }
    if (type === "winnower") { part(g, box(0.8, 0.8, 0.5, AK.wood(), 0, 0.8, 0), "Fan box", [0, 0.3, 0]); part(g, cyl(0.3, 0.3, 0.05, AK.std(0x3a3a3a), -0.42, 0.8, 0), "Fan handle", [-0.3, 0, 0]).rotation.z = Math.PI / 2; part(g, new T3.Mesh(new T3.ConeGeometry(0.3, 0.35, 4, 1, true), AK.wood()), "Grain hopper", [0, 0.4, 0]).position.set(0.1, 1.35, 0); part(g, box(0.25, 0.05, 0.4, AK.wood(), 0.5, 0.45, 0), "Clean grain outlet", [0.3, 0, 0]); }
    if (type === "pump") { part(g, box(0.4, 0.3, 0.3, AK.paint(0xc8321e), 0, 0.15, 0), "Engine", [0, 0.3, 0]); part(g, cyl(0.12, 0.12, 0.2, AK.paint(0x2a5aa8), 0.3, 0.15, 0), "Pump body", [0.3, 0, 0]).rotation.x = Math.PI / 2; part(g, cyl(0.05, 0.05, 0.6, AK.std(0x2a2a2a), 0.3, 0.15, 0.4), "Suction hose", [0, 0, 0.5]).rotation.x = Math.PI / 2; }
    if (type === "candler") { part(g, box(0.3, 0.25, 0.3, AK.std(0x2a2a2a), 0, 0.12, 0), "Lamp box", [0, 0, 0]); part(g, cyl(0.03, 0.03, 0.02, AK.std(0xffffff, { emissive: 0xfff0b0, emissiveIntensity: 2 }), 0, 0.26, 0), "Light hole", [0, 0.1, 0]); const e = sph(0.05, AK.phys(0xf0d8b0, { transmission: 0.4, roughness: 0.3, emissive: 0xffa040, emissiveIntensity: 0.4 }), 0, 0.33, 0); e.scale.y = 1.3; part(g, e, "Egg (shows air cell and embryo)", [0, 0.2, 0]); }
    BK.shadow(g); return g;
  };

  /* ---------- hand tools (each ~1 m long scale) ---------- */
  AK.tool = (type) => {
    const T3 = T(), g = new T3.Group(), wood = AK.wood(), steel = AK.metal(0xb8bcc0), dark = AK.metal(0x6a6a6a), handle = (L = 1.1, r = 0.018) => { const h = cyl(r, r * 1.1, L, wood, 0, L / 2, 0, 8); g.add(h); return h; };
    switch (type) {
      case "hoe": { handle(0.75); const bl = box(0.22, 0.2, 0.012, dark, 0.11, 0.78, 0); bl.rotation.z = 0.2; g.add(bl); break; }
      case "longhoe": { handle(1.4); g.add(box(0.15, 0.14, 0.01, steel, 0.08, 1.42, 0)); break; }
      case "cutlass": case "machete": { const h = cyl(0.016, 0.018, 0.14, AK.std(0x2a1a10), 0, 0.07, 0, 8); g.add(h); const bl = new T3.Mesh(BK.leafGeo(0.58, 0.07, 0.0, 10), AK.metal(0xd0d4d8)); bl.position.y = 0.14; g.add(bl); break; }
      case "spade": { handle(0.8); g.add(box(0.2, 0.28, 0.01, steel, 0, -0.12, 0)); g.add(box(0.14, 0.02, 0.02, wood, 0, 0.82, 0)); break; }
      case "shovel": { handle(1.0); const bl = new T3.Mesh(new T3.SphereGeometry(0.16, 16, 8, 0, 3.14, 0, 1.4), steel); bl.material.side = T3.DoubleSide; bl.position.y = -0.12; bl.scale.set(1, 1.3, 0.4); g.add(bl); break; }
      case "rake": { handle(1.3); g.add(box(0.36, 0.03, 0.03, steel, 0, 1.3, 0)); for (let i = 0; i < 12; i++) g.add(cyl(0.004, 0.004, 0.08, steel, -0.17 + i * 0.031, 1.27, 0.03, 4)); break; }
      case "fork": case "handfork": { const L = type === "fork" ? 1.0 : 0.15; handle(L); for (let i = 0; i < 4; i++) g.add(cyl(0.006, 0.004, type === "fork" ? 0.28 : 0.13, steel, -0.06 + i * 0.04, -0.12, 0, 5)); break; }
      case "trowel": { handle(0.15); const bl = new T3.Mesh(BK.leafGeo(0.18, 0.1, 0.05, 6), steel); bl.rotation.x = Math.PI; bl.position.y = 0; g.add(bl); break; }
      case "sickle": { handle(0.15); const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * 3.3; pts.push(V3(Math.sin(a) * 0.2, 0.15 + (1 - Math.cos(a)) * 0.15, 0)); } g.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 24, 0.012, 4), steel)); break; }
      case "axe": { handle(0.8); g.add(box(0.16, 0.1, 0.03, dark, 0.06, 0.78, 0)); break; }
      case "pickaxe": { handle(0.9); const h = cyl(0.015, 0.006, 0.55, dark, 0, 0.9, 0, 6); h.rotation.z = Math.PI / 2; g.add(h); break; }
      case "secateurs": case "shears": { const L = type === "shears" ? 0.25 : 0.1; [-1, 1].forEach((sd) => { const b = box(0.015, L, 0.006, steel, sd * 0.01, L * 1.4, 0); b.rotation.z = sd * 0.12; g.add(b); const h = box(0.025, L * 1.2, 0.012, AK.paint(0xc8321e), sd * 0.03, L * 0.5, 0); h.rotation.z = -sd * 0.15; g.add(h); }); break; }
      case "buddingknife": case "pruningknife": { g.add(box(0.025, 0.1, 0.015, wood, 0, 0.05, 0)); const bl = box(0.018, 0.07, 0.003, steel, 0, 0.14, 0); g.add(bl); if (type === "pruningknife") bl.rotation.z = 0.4; break; }
      case "dibber": { const d = cyl(0.02, 0.004, 0.25, wood, 0, 0.12, 0, 8); g.add(d); g.add(box(0.08, 0.03, 0.03, wood, 0, 0.26, 0)); break; }
      case "wateringcan": { g.add(cyl(0.12, 0.13, 0.25, AK.metal(0x9ab0a0), 0, 0.13, 0)); const sp = cyl(0.015, 0.02, 0.35, AK.metal(0x9ab0a0), 0.2, 0.22, 0, 8); sp.rotation.z = -0.9; g.add(sp); AK.addm(g, cyl(0.04, 0.02, 0.04, AK.metal(0x9ab0a0), 0.34, 0.33, 0, 10)).rotation.z = -0.9; const h = new T3.Mesh(new T3.TorusGeometry(0.1, 0.01, 6, 14, Math.PI), AK.metal(0x9ab0a0)); h.position.set(-0.02, 0.27, 0); g.add(h); break; }
      case "wheelbarrow": { g.add(box(0.7, 0.3, 0.5, AK.metal(0x5a7a5a), 0, 0.45, 0)); const w = AK.wheel(0.15, 0.06, 0x2a2a2a); w.rotation.y = 0; w.position.set(0.45, 0.15, 0); g.add(w); [-1, 1].forEach((sd) => g.add(box(1.0, 0.03, 0.03, wood, -0.2, 0.42, sd * 0.24))); break; }
      case "tape": { const c = cyl(0.06, 0.06, 0.03, AK.paint(0xf2c21a), 0, 0.06, 0, 20); c.rotation.x = Math.PI / 2; g.add(c); g.add(box(0.6, 0.002, 0.016, AK.std(0xf4f0e0), 0.33, 0.01, 0)); break; }
      case "rangingpole": { for (let i = 0; i < 8; i++) g.add(cyl(0.015, 0.015, 0.25, AK.paint(i % 2 ? 0xffffff : 0xc8321e), 0, 0.125 + i * 0.25, 0, 8)); AK.addm(g, new T3.Mesh(new T3.ConeGeometry(0.015, 0.06, 8), steel)).rotation.x = Math.PI; break; }
      case "arrow": { g.add(cyl(0.004, 0.004, 0.35, steel, 0, 0.18, 0, 5)); AK.addm(g, new T3.Mesh(new T3.TorusGeometry(0.02, 0.004, 4, 10), steel)).position.y = 0.37; break; }
      case "chain": { for (let i = 0; i < 24; i++) { const l = new T3.Mesh(new T3.TorusGeometry(0.02, 0.004, 4, 8), steel); l.scale.x = 2; l.position.set(i * 0.06, 0.005, 0); l.rotation.x = i % 2 ? Math.PI / 2 : 0; g.add(l); } break; }
      case "theodolite": { [0, 2.09, 4.19].forEach((a) => { const l = cyl(0.012, 0.012, 1.3, wood, Math.cos(a) * 0.2, 0.62, Math.sin(a) * 0.2, 6); l.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); g.add(l); }); g.add(cyl(0.08, 0.1, 0.08, AK.paint(0xf2c21a), 0, 1.3, 0)); g.add(box(0.12, 0.18, 0.1, AK.paint(0xf2c21a), 0, 1.45, 0)); const t = cyl(0.03, 0.035, 0.25, AK.std(0x2a2a2a), 0, 1.5, 0, 12); t.rotation.z = Math.PI / 2; g.add(t); break; }
      case "compass": { g.add(cyl(0.06, 0.06, 0.02, AK.metal(0xc8a050), 0, 0.01, 0, 24)); g.add(cyl(0.055, 0.055, 0.005, AK.std(0xf4f0e0), 0, 0.022, 0, 24)); g.add(box(0.09, 0.004, 0.01, AK.std(0xc8321e), 0, 0.027, 0)); break; }
      case "plumbbob": { const b = new T3.Mesh(new T3.ConeGeometry(0.03, 0.08, 10), AK.metal(0xc8a050)); b.rotation.x = Math.PI; b.position.y = 0.04; g.add(b); g.add(cyl(0.002, 0.002, 0.6, AK.std(0xf4f0e0), 0, 0.38, 0, 4)); break; }
      case "peg": { g.add(box(0.04, 0.3, 0.04, wood, 0, 0.15, 0)); break; }
      case "emasculator": case "burdizzo": { [-1, 1].forEach((sd) => { const a = box(0.03, 0.4, 0.02, steel, sd * 0.03, 0.2, 0); a.rotation.z = sd * 0.15; g.add(a); }); g.add(box(0.12, 0.04, 0.04, steel, 0, 0.42, 0)); break; }
      case "debeaker": { g.add(box(0.3, 0.25, 0.25, AK.paint(0x2a2a2a), 0, 0.12, 0)); g.add(box(0.06, 0.02, 0.1, AK.std(0xff6020, { emissive: 0xff4010, emissiveIntensity: 0.8 }), 0.12, 0.26, 0)); break; }
      case "eartag": { g.add(box(0.05, 0.06, 0.004, AK.paint(0xf2c21a), 0, 0.03, 0)); break; }
      case "brandingiron": { handle(0.6, 0.012); g.add(box(0.12, 0.02, 0.02, dark, 0, 0.62, 0)); break; }
      case "hivetool": { g.add(box(0.03, 0.25, 0.006, steel, 0, 0.12, 0)); break; }
      case "smoker": { g.add(cyl(0.07, 0.07, 0.22, AK.metal(0xd8d8d8), 0, 0.11, 0)); AK.addm(g, new T3.Mesh(new T3.ConeGeometry(0.07, 0.08, 14), AK.metal(0xd8d8d8))).position.y = 0.26; AK.addm(g, box(0.16, 0.03, 0.12, AK.std(0x8a5a3a), -0.12, 0.12, 0)).rotation.z = 0.2; break; }
      case "net": { const n = new T3.Mesh(new T3.SphereGeometry(0.3, 16, 8, 0, 6.283, 0, 1.2), AK.pbr("Net001A", { repeat: 2, side: T3.DoubleSide })); n.material.transparent = true; n.material.alphaTest = 0.3; n.rotation.x = Math.PI; n.position.y = 0.3; g.add(n); break; }
      case "hookline": { AK.addm(g, cyl(0.012, 0.006, 1.6, AK.std(0x3a3a2a), 0, 0.8, 0, 6)).rotation.z = 0.4; g.add(cyl(0.001, 0.001, 0.8, AK.std(0xf4f4f4), 0.62, 1.1, 0, 3)); break; }
      default: handle(0.8);
    }
    BK.shadow(g); g.userData.tool = type; return g;
  };

  /* ---------- buildings & structures ---------- */
  AK.building = (type = "barn", o = {}) => {
    const T3 = T(), g = new T3.Group(), w = o.w || 2.2, d = o.d || 1.6, h = o.h || 1.0, wall = AK.pbr(o.wall || "clay_block_wall", { repeat: [w, h], color: o.wallCol || 0xffffff }), roof = AK.pbr(o.roof || "corrugated_iron_02", { repeat: [w * 1.5, 1], roughness: 0.6 });
    const open = type === "pen" || type === "shed" || type === "poultry" || type === "hutch";
    if (!open) g.add(box(w, h, d, wall, 0, h / 2, 0));
    else { [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([x, z]) => g.add(cyl(0.05, 0.05, h, AK.wood(), x, h / 2, z, 8))); g.add(box(w, h * 0.35, 0.05, wall, 0, h * 0.175, -d / 2)); g.add(box(w, h * 0.35, 0.05, wall, 0, h * 0.175, d / 2)); if (type === "poultry") { const mesh = new T3.Mesh(new T3.PlaneGeometry(w, h * 0.6), AK.pbr("Net002A", { repeat: [w * 3, 2], side: T3.DoubleSide })); mesh.material.transparent = true; mesh.material.alphaTest = 0.3; mesh.position.set(0, h * 0.65, d / 2 + 0.01); g.add(mesh); const m2 = mesh.clone(); m2.position.z = -d / 2 - 0.01; g.add(m2); } }
    const rp = new T3.Group(); [-1, 1].forEach((sd) => { const r = box(w * 1.12, 0.03, d * 0.62, roof, 0, 0, sd * d * 0.27); r.rotation.x = sd * 0.42; rp.add(r); }); rp.position.y = h + d * 0.12; g.add(rp);
    if (type === "silo") { g.clear(); g.add(cyl(0.6, 0.6, 2.6, AK.metal(0xd0d4d8), 0, 1.3, 0, 24)); AK.addm(g, new T3.Mesh(new T3.ConeGeometry(0.65, 0.5, 24), AK.metal(0xc0c4c8))).position.y = 2.85; }
    if (type === "hut") { g.clear(); g.add(GK.hut(o.r || 0.6)); }
    if (type === "store" || type === "barn" || type === "house") { const door = box(0.4, 0.7, 0.03, AK.wood(), 0, 0.35, d / 2 + 0.01); g.add(door); }
    if (type === "cribs") { g.clear(); g.add(box(1.2, 1.6, 0.6, AK.pbr("Wicker004", { repeat: 2 }), 0, 1.1, 0)); [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([x, z]) => g.add(cyl(0.04, 0.04, 0.6, AK.wood(), x, 0.3, z, 6))); g.add(box(1.4, 0.04, 0.8, AK.pbr("thatch_roof_angled", { repeat: 1 }), 0, 1.95, 0)); }
    BK.shadow(g); g.userData.type = type; return g;
  };
  AK.fence = (pts, h = 0.5) => { const T3 = T(), g = new T3.Group(), w = AK.wood(); for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 0.8)); for (let k = 0; k <= n; k++) { const t = k / n; g.add(cyl(0.025, 0.03, h, w, x0 + (x1 - x0) * t, h / 2, z0 + (z1 - z0) * t, 6)); } [0.35, 0.8].forEach((f) => { const r = box(L, 0.025, 0.02, w, (x0 + x1) / 2, h * f, (z0 + z1) / 2); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); g.add(r); }); } BK.shadow(g); return g; };
  AK.hive = (type = "langstroth") => { const T3 = T(), g = new T3.Group(), w = AK.paint(0xf2e6c8, 0.7); if (type === "log") { const l = cyl(0.18, 0.18, 0.9, AK.pbr("Bark004", { repeat: 1 }), 0, 0.2, 0); l.rotation.z = Math.PI / 2; g.add(l); } else if (type === "topbar") { AK.addm(g, new T3.Mesh(new T3.CylinderGeometry(0.3, 0.3, 1.0, 4, 1, false), w)).rotation.set(0, 0, Math.PI / 2); g.children[0].position.y = 0.75; g.add(box(1.1, 0.04, 0.5, AK.pbr("corrugated_iron_02"), 0, 1.0, 0)); [-0.4, 0.4].forEach((x) => g.add(cyl(0.03, 0.03, 0.6, AK.wood(), x, 0.3, 0, 6))); } else { for (let i = 0; i < 3; i++) g.add(box(0.5, 0.24, 0.42, i === 0 ? AK.paint(0xe8d8a8, 0.7) : w, 0, 0.32 + i * 0.25, 0)); g.add(box(0.56, 0.05, 0.48, AK.pbr("corrugated_iron_02"), 0, 1.07, 0)); g.add(box(0.56, 0.18, 0.48, AK.wood(), 0, 0.09, 0)); } BK.shadow(g); return g; };
  AK.pond = (g, w = 4, d = 2.6, depth = 0.5, x = 0, z = 0) => { const T3 = T(), wat = GK.water(w, d, 0x3a6a4a, 0.92); wat.position.set(x, -0.05, z); g.add(wat); const bank = new T3.Mesh(new T3.BoxGeometry(w + 0.3, depth, d + 0.3), AK.pbr("brown_mud_02", { repeat: 2 })); bank.position.set(x, -depth / 2 - 0.06, z); g.add(bank); return wat; };
  AK.tank = (r = 0.5, h = 0.8, col = 0x2a5aa8) => { const g = new (T().Group)(); g.add(cyl(r, r, h, AK.phys(col, { roughness: 0.4 }), 0, h / 2, 0, 24)); return g; };
  AK.sack = (col = 0xe8dcc0, label) => { const T3 = T(), m = new T3.Mesh(new T3.CapsuleGeometry(0.16, 0.28, 6, 12), AK.furMat({ col, wool: 0 })); m.scale.set(1, 1, 0.65); m.position.y = 0.3; const g = new T3.Group(); g.add(m); BK.shadow(g); return g; };
  AK.crate = (col) => box(0.4, 0.3, 0.3, AK.pbr("wood_planks_dirt", { repeat: 0.5, color: col || 0xffffff }), 0, 0.15, 0);
  AK.sign = (text, col = "#ffd27a") => { const T3 = T(), c = BK.cv(256, 96), g = c.getContext("2d"); g.fillStyle = "#1e2a1e"; g.fillRect(0, 0, 256, 96); g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(4, 4, 248, 88); g.fillStyle = col; g.font = "700 30px 'IBM Plex Sans',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 128, 50); const tx = new T3.CanvasTexture(c); tx.colorSpace = T3.SRGBColorSpace; const grp = new T3.Group(); grp.add(cyl(0.02, 0.02, 0.8, AK.wood(), 0, 0.4, 0, 6)); const pl = new T3.Mesh(new T3.PlaneGeometry(0.6, 0.22), new T3.MeshStandardMaterial({ map: tx, side: T3.DoubleSide })); pl.position.y = 0.85; grp.add(pl); return grp; };

  /* ---------- water helpers ---------- */
  AK.rain = (n = 600, area = 10, top = 6) => { const p = GK.particles(n, 0x9ac8ff, 0.03, 0.7); for (let i = 0; i < n; i++) { p.pos[i * 3] = (Math.random() - 0.5) * area; p.pos[i * 3 + 1] = Math.random() * top; p.pos[i * 3 + 2] = (Math.random() - 0.5) * area * 0.7; } p.flush(); p.step = (dt, rate = 1) => { for (let i = 0; i < n; i++) { if (i / n > rate) { p.pos[i * 3 + 1] = -5; continue; } p.pos[i * 3 + 1] -= dt * 7; if (p.pos[i * 3 + 1] < 0) p.pos[i * 3 + 1] = top; } p.flush(); }; return p; };
  /* particles flowing along a polyline path pts [[x,y,z]...] */
  AK.flow = (pts, n = 120, col = 0x4aa8ff, size = 0.05, speed = 0.25) => { const T3 = T(), curve = new T3.CatmullRomCurve3(pts.map((p) => V3(...p))), P = GK.particles(n, col, size, 0.9), off = new Float32Array(n).map(() => Math.random()); P.t = 0; P.speed = speed; P.step = (dt, on = 1) => { P.t += dt * P.speed; for (let i = 0; i < n; i++) { const u = (off[i] + P.t) % 1, q = curve.getPointAt(u); P.pos[i * 3] = q.x + (on ? 0 : 999); P.pos[i * 3 + 1] = q.y; P.pos[i * 3 + 2] = q.z; } P.flush(); }; P.curve = curve; P.step(0); return P; };
  AK.pipe = (pts, r = 0.04, col = 0x2a2a2a) => GK.line(pts, col, r);
  AK.line = (pts, col, r) => GK.line(pts, col, r);

  /* ---------- soil column / profile ----------
     horizons: [[name, thickness, textureId, tint]] top-down; returns group with .H (horizon centres) */
  AK.HORIZONS = [["O — organic litter", 0.18, "forest_floor", 0x5a4a32], ["A — topsoil (humus-rich)", 0.55, "farm_soil", 0x4a3424], ["B — subsoil (clay, iron and aluminium oxides)", 0.75, "red_laterite_soil_stones", 0xa05a34], ["C — weathered parent material", 0.7, "rocky_terrain_02", 0xa08a6a], ["R — bedrock (parent rock)", 0.5, "gray_rocks", 0x8a8a88]];
  AK.soilColumn = (o = {}) => {
    const T3 = T(), g = new T3.Group(), w = o.w || 1.6, d = o.d || 1.6, hz = o.horizons || AK.HORIZONS; let y = 0; g.H = [];
    hz.forEach(([name, th, tex, tint], i) => { const m = box(w, th, d, GK.pbr(tex, { repeat: [w, th * 1.5], color: tint ? new T3.Color(tint).lerp(new T3.Color(0xffffff), 0.45).getHex() : 0xffffff }), 0, y - th / 2, 0); g.add(m); g.H.push({ name, y: y - th / 2, th, mesh: m }); y -= th; });
    const top = new T3.Mesh(new T3.PlaneGeometry(w, d), AK.pbr("leafy_grass", { repeat: 1 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.002; g.add(top);
    if (o.roots !== false) { const rm = AK.std(0xd8c8a0); for (let i = 0; i < 14; i++) { const x = (Math.random() - 0.5) * w * 0.8, z = d / 2 + 0.003, L = 0.2 + Math.random() * 0.6; const pts = [V3(x, 0, z)]; for (let k = 1; k < 6; k++) pts.push(V3(x + (Math.random() - 0.5) * 0.15, -L * k / 5, z)); g.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 12, 0.006, 4), rm)); } }
    if (o.worms) for (let i = 0; i < 3; i++) { const wm = AK.pest("worm", 0.25); wm.position.set((i - 1) * 0.4, -0.3 - i * 0.12, d / 2 + 0.01); g.add(wm); }
    g.depth = -y; BK.shadow(g); return g;
  };
  /* glass cylinder of liquid / layers (lab benches). layers: [[height, colour, opacity]] bottom-up */
  AK.cylinder = (r = 0.12, h = 0.6, layers = []) => { const T3 = T(), g = new T3.Group(); g.add(cyl(r, r, h, AK.phys(0xe8f4ff, { roughness: 0.05, transmission: 0.95, transparent: true, opacity: 0.25, depthWrite: false }), 0, h / 2, 0, 24)); let y = 0.01; layers.forEach(([lh, col, op = 1]) => { const m = cyl(r * 0.95, r * 0.95, lh, AK.phys(col, { roughness: 0.6, transparent: op < 1, opacity: op }), 0, y + lh / 2, 0, 24); g.add(m); y += lh; }); g.layerTop = y; return g; };
  AK.beaker = (r = 0.1, h = 0.18, fill = 0.6, col = 0x8ac8ff) => AK.cylinder(r, h, [[h * fill, col, 0.6]]);
  AK.bench = (g, w = 4, d = 1.6) => { g.add(box(w, 0.08, d, AK.pbr("wood_table_worn", { repeat: [2, 1] }), 0, 0.9, 0)); [[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]].forEach(([x, z]) => g.add(box(0.07, 0.9, 0.07, AK.metal(0x5a5a5a), x, 0.45, z))); return 0.94; };
  AK.scale3d = (g, x, y, z, reading) => { const s = new (T().Group)(); s.add(box(0.36, 0.08, 0.3, AK.paint(0xf4f4f0), 0, 0.04, 0)); s.add(box(0.3, 0.01, 0.24, AK.metal(0xd8d8d8), 0, 0.085, 0)); s.add(box(0.14, 0.04, 0.005, AK.std(0x0a1a0a, { emissive: 0x30ff60, emissiveIntensity: 0.25 }), 0, 0.04, 0.152)); s.position.set(x, y, z); g.add(s); return s; };

  /* ---------- cycles and flow diagrams in 3D ----------
     nodes: [{id, n, p:[x,y,z], col, obj?}], links: [[from, to, label?, col?]] → particles run along curved arrows */
  AK.cycle = (g, nodes, links, o = {}) => {
    const T3 = T(), byId = {}, flows = [];
    nodes.forEach((N) => { byId[N.id] = N; if (N.obj) { N.obj.position.set(...N.p); g.add(N.obj); } else if (o.spheres !== false) { const m = new T3.Mesh(new T3.SphereGeometry(N.r || 0.18, 20, 14), AK.phys(N.col || 0x4a8ad8, { roughness: 0.3, clearcoat: 1, emissive: N.col || 0x4a8ad8, emissiveIntensity: 0.15 })); m.position.set(...N.p); g.add(m); } });
    links.forEach(([a, b, lab, col], i) => { const A = V3(...byId[a].p), B = V3(...byId[b].p), mid = A.clone().add(B).multiplyScalar(0.5).add(V3(0, o.lift == null ? 0.5 : o.lift, 0)); const pts = [A, mid, B].map((v) => [v.x, v.y, v.z]); const tube = GK.line(pts, col || 0xffd27a, 0.012); tube.material.transparent = true; tube.material.opacity = 0.5; g.add(tube); const f = AK.flow(pts, o.n || 26, col || 0xffd27a, 0.06, 0.18); g.add(f); flows.push(f); const tip = GK.arrow([mid.x * 0.3 + B.x * 0.7, mid.y * 0.3 + B.y * 0.7, mid.z * 0.3 + B.z * 0.7], [B.x, B.y, B.z], col || 0xffd27a, 0.02); g.add(tip); });
    return { step: (dt, on = 1) => flows.forEach((f) => f.step(dt, on)), flows, byId };
  };
  /* labels for cycle nodes (for GK labels) */
  AK.cycleLabels = (nodes, sel) => nodes.map((N) => ({ id: N.id, p: [N.p[0], N.p[1] + (N.r || 0.18) + 0.05, N.p[2]], t: N.n, col: N.id === sel ? "#ffd27a" : "#e8f1ff" }));

  /* ---------- organ chain (digestive / reproductive tracts) ----------
     segs: [{id, n, len, r, col, shape:'tube'|'sac'|'bulb'}] laid along a winding path; returns {group, at: {id: [x,y,z]}} */
  AK.organChain = (segs, o = {}) => {
    const T3 = T(), g = new T3.Group(), at = {}; let x = o.x0 == null ? -3 : o.x0, y = o.y0 == null ? 1.6 : o.y0, z = 0, dir = 1;
    const path = [];
    segs.forEach((S, i) => {
      const mat = BK.mat.tissue(S.col || 0xd77a6e, 0.45), L = S.len || 0.6;
      if (S.shape === "sac" || S.shape === "bulb") { const m = new T3.Mesh(new T3.SphereGeometry(S.r || 0.3, 28, 20), mat); m.scale.set(S.sx || 1.2, S.sy || 1, S.sz || 1); m.position.set(x + dir * L / 2, y, z); g.add(m); at[S.id] = [x + dir * L / 2, y, z]; path.push([x, y, z]); x += dir * L; }
      else { const pts = []; const wig = S.coil ? 8 : 1; for (let k = 0; k <= 12 * wig; k++) { const t = k / (12 * wig); pts.push([x + dir * L * t, y + (S.coil ? Math.sin(t * wig * 6.28) * 0.15 : 0), z + (S.coil ? Math.cos(t * wig * 6.28) * 0.15 : 0)]); } const m = GK.line(pts, S.col || 0xd77a6e, S.r || 0.06); m.material = mat; g.add(m); at[S.id] = [x + dir * L / 2, y + 0.05, z]; x += dir * L; }
      if (o.wrap && x > (o.wrapX || 3) && dir === 1 && i < segs.length - 1) { y -= o.drop || 0.9; dir = -1; g.add(GK.line([[x, y + (o.drop || 0.9), z], [x + 0.25, y + (o.drop || 0.9) / 2, z], [x, y, z]], segs[i].col || 0xd77a6e, segs[i].r || 0.06)); }
      else if (o.wrap && x < -(o.wrapX || 3) && dir === -1 && i < segs.length - 1) { y -= o.drop || 0.9; dir = 1; g.add(GK.line([[x, y + (o.drop || 0.9), z], [x - 0.25, y + (o.drop || 0.9) / 2, z], [x, y, z]], segs[i].col || 0xd77a6e, segs[i].r || 0.06)); }
    });
    BK.shadow(g); return { group: g, at, end: [x, y, z] };
  };

  /* ---------- 3D bar chart ---------- */
  AK.bars3d = (g, values, o = {}) => { const T3 = T(), max = o.max || Math.max(...values.map((v) => v[1])), w = o.w || 0.5, gap = o.gap || 0.3, x0 = o.x0 == null ? -((values.length - 1) * (w + gap)) / 2 : o.x0, H = o.h || 2, out = []; values.forEach(([n, v, col], i) => { const h = Math.max(0.01, (v / max) * H), m = box(w, h, w, AK.paint(col || 0x4a8ad8), x0 + i * (w + gap), h / 2 + (o.y || 0), o.z || 0); g.add(m); out.push({ n, v, p: [m.position.x, h + (o.y || 0) + 0.1, o.z || 0] }); }); return out; };

  /* ---------- 2D board helpers ---------- */
  AK.money = (v, cur = "₦") => (v < 0 ? "−" : "") + cur + Math.abs(Math.round(v)).toLocaleString("en-GB");
  /* axes panel with ticks; returns {X, Y, px, py, pw, ph} */
  AK.axes = (B, x, y, w, h, o) => {
    if (y < 36) { h -= 36 - y; y = 36; } // keep clear of the board's title pill
    const tk = (v) => { const a = Math.abs(v); return a >= 1e6 ? MK.fmt(v / 1e6, 3) + "M" : a >= 1e4 ? MK.fmt(v / 1e3, 3) + "k" : MK.fmt(v, 3); };
    const g = B.g, P = B.P; B.panel(x, y, w, h); const px = x + 46, py = y + 26, pw = w - 62, ph = h - 62, X = (v) => px + (v - o.x0) / (o.x1 - o.x0) * pw, Y = (v) => py + ph - (v - o.y0) / (o.y1 - o.y0) * ph;
    B.line(px, py + ph, px + pw, py + ph, P.ink, 1.5); B.line(px, py, px, py + ph, P.ink, 1.5);
    const nx = o.nx || 5, ny = o.ny || 5; for (let i = 0; i <= nx; i++) { const v = o.x0 + (o.x1 - o.x0) * i / nx, xx = X(v); B.line(xx, py + ph, xx, py + ph + 4, P.ink, 1); B.text(tk(v), xx, py + ph + 16, { size: 10, align: "center", color: P.soft }); if (o.grid !== false && i) B.line(xx, py, xx, py + ph, P.grid || "rgba(120,130,150,.18)", 0.7); }
    for (let i = 0; i <= ny; i++) { const v = o.y0 + (o.y1 - o.y0) * i / ny, yy = Y(v); B.line(px - 4, yy, px, yy, P.ink, 1); B.text(tk(v), px - 7, yy + 3, { size: 10, align: "right", color: P.soft }); if (o.grid !== false && i) B.line(px, yy, px + pw, yy, P.grid || "rgba(120,130,150,.18)", 0.7); }
    if (o.xl) B.text(o.xl, px + pw / 2, y + h - 8, { size: 11, align: "center", color: P.ink }); if (o.yl) { g.save(); g.translate(x + 13, py + ph / 2); g.rotate(-Math.PI / 2); B.text(o.yl, 0, 0, { size: 11, align: "center", color: P.ink }); g.restore(); }
    if (o.title) B.text(o.title, x + 12, y + 17, { size: 12, w: 700, color: P.ink });
    return { X, Y, px, py, pw, ph, y0: o.y0, y1: o.y1 };
  };
  /* plots y = f(x); the line is cut where it leaves the plotted y range instead of running flat along the edge */
  AK.curve = (B, A, f, x0, x1, col, w = 2.4, n = 80, dash) => { const lo = A.y0 == null ? -Infinity : Math.min(A.y0, A.y1), hi = A.y0 == null ? Infinity : Math.max(A.y0, A.y1), segs = [[]]; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); if (isFinite(y) && y >= lo - 1e-9 && y <= hi + 1e-9) segs[segs.length - 1].push([A.X(x), A.Y(y)]); else if (segs[segs.length - 1].length) segs.push([]); } segs.forEach((pts) => pts.length > 1 && B.poly(pts, col, null, w, false, dash)); };
  AK.barChart = (B, x, y, w, h, items, o = {}) => { const A = AK.axes(B, x, y, w, h, Object.assign({ x0: 0, x1: items.length, nx: 1, y0: 0, y1: o.max || Math.max(...items.map((i) => i[1])) * 1.15, grid: true }, o)); const bw = A.pw / items.length * 0.62; items.forEach(([n, v, col], i) => { const cx = A.px + (i + 0.5) * A.pw / items.length, top = A.Y(v); B.g.fillStyle = col || B.P.blue; B.g.fillRect(cx - bw / 2, top, bw, A.py + A.ph - top); B.text(o.fmt ? o.fmt(v) : MK.fmt(v, 3), cx, top - 5, { size: 10.5, align: "center", color: B.P.ink }); B.text(n, cx, A.py + A.ph + 28, { size: 10, align: "center", color: B.P.soft }); }); return A; };
  AK.pie = (B, cx, cy, r, items) => { const tot = items.reduce((a, b) => a + b[1], 0); let a = -Math.PI / 2; items.forEach(([n, v, col]) => { const da = v / tot * Math.PI * 2; B.g.fillStyle = col; B.g.beginPath(); B.g.moveTo(cx, cy); B.g.arc(cx, cy, r, a, a + da); B.g.closePath(); B.g.fill(); const m = a + da / 2; if (v / tot > 0.04) B.text(n + " " + Math.round(v / tot * 100) + "%", cx + Math.cos(m) * (r + 14), cy + Math.sin(m) * (r + 14) + 4, { size: 10.5, align: Math.cos(m) > 0 ? "left" : "right" }); a += da; }); };
  /* a table drawn on the board: rows of strings, first row header */
  AK.btable = (B, x, y, colW, rows, o = {}) => { const g = B.g, rh = o.rh || 20; rows.forEach((r, i) => { let xx = x; r.forEach((cell, j) => { const w = colW[j]; g.fillStyle = i === 0 ? (B.P.fillA || "rgba(120,140,200,.18)") : i === o.hi ? "rgba(217,164,65,.25)" : "rgba(255,255,255,.02)"; g.fillRect(xx, y + i * rh, w, rh); g.strokeStyle = B.P.grid || "rgba(120,130,150,.3)"; g.strokeRect(xx, y + i * rh, w, rh); B.text(String(cell), xx + 6, y + i * rh + 14, { size: o.size || 10.5, w: i === 0 ? 700 : 500, halo: false }); xx += w; }); }); return y + rows.length * rh; };
  /* card list on the board (definitions / steps) */
  AK.notes = (B, x, y, w, title, lines) => B.card(x, y, w, title, lines);
})();
