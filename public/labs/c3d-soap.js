/* c3d-soap.js — chemistry 3D, new module: making soap (saponification) and the cleaning action of soaps and detergents */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const OIL = {
    palm: { n: "Palm oil", col: [236, 150, 40], soap: "yellow-orange, firm soap, good cleaning", lather: "moderate", acid: "palmitic and oleic acids" },
    kernel: { n: "Palm kernel oil", col: [244, 226, 150], soap: "white, hard soap with plenty of lather", lather: "rich", acid: "lauric and myristic acids" },
    groundnut: { n: "Groundnut oil", col: [240, 210, 110], soap: "soft soap (more unsaturated acids)", lather: "low to moderate", acid: "oleic and linoleic acids" },
    shea: { n: "Shea butter", col: [238, 226, 176], soap: "creamy, mild soap", lather: "moderate", acid: "stearic and oleic acids" },
    tallow: { n: "Animal fat (tallow)", col: [242, 236, 214], soap: "hard white soap", lather: "moderate", acid: "stearic and palmitic acids" },
  };
  const ALK = { naoh: { n: "NaOH (sodium hydroxide)", soap: "sodium soap: hard bar soap", k: 1.0, f: "RCOONa" }, koh: { n: "KOH (potassium hydroxide)", soap: "potassium soap: soft or liquid soap", k: 1.15, f: "RCOOK" } };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const NMOL = 160, NEED = 90, R0 = 0.55;

  function seedMol(S, s, c) { s.mol = []; for (let i = 0; i < NMOL; i++) s.mol.push({ x: 1.4 + (Math.random() - 0.5) * 5.0, y: 0.5 + Math.random() * 2.2, z: (Math.random() - 0.5) * 1.4, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, vz: (Math.random() - 0.5) * 0.3, a: Math.random() * 6.28, b: Math.acos(2 * Math.random() - 1), st: 0, ph: Math.random() * 6.28 }); s.cdi = []; for (let i = 0; i < 40; i++) s.cdi.push({ x: 1.4 + (Math.random() - 0.5) * 5, y: 0.5 + Math.random() * 2.2, z: (Math.random() - 0.5) * 1.4, ph: Math.random() * 6.28 }); s.reseed = false; }
  C3.scenes.soapDetergent = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 38, free: true, cam: [[-0.2, 2.8, 9.2], [0.1, 2.3, 0]],
    values: { mode: "make", oil: "palm", alk: "naoh", cleaner: "soap", water: "soft", conc: 60, heat: 1 },
    state: () => ({ sap: 0, salt: 0, saltAdd: false, scrub: 0, att: 0, lost: 0, t: 0, clean: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Topic", options: [{ value: "make", label: "Making soap (saponification)" }, { value: "wash", label: "How soap and detergent clean" }] },
        { type: "select", key: "oil", label: "Oil or fat", options: Object.keys(OIL).map((k) => ({ value: k, label: OIL[k].n })) },
        { type: "select", key: "alk", label: "Alkali", options: Object.keys(ALK).map((k) => ({ value: k, label: ALK[k].n })) },
        { type: "toggle", key: "heat", label: "Heat the mixture (reflux)" },
        { type: "button", label: "Add sodium chloride (salting out)", action: (S, s) => { s.saltAdd = true; } },
        { type: "select", key: "cleaner", label: "Cleaning agent", options: [{ value: "soap", label: "Soap (RCOO⁻Na⁺)" }, { value: "det", label: "Soapless detergent (RSO₃⁻Na⁺)" }] },
        { type: "select", key: "water", label: "Water", options: [{ value: "soft", label: "Soft water" }, { value: "hard", label: "Hard water (Ca²⁺, Mg²⁺)" }] },
        { type: "range", key: "conc", label: "Amount of cleaning agent", min: 10, max: 160, step: 5, unit: " units" },
        { type: "button", label: "Scrub the cloth", action: (S, s) => { s.scrub = 5; } },
        { type: "button", label: "Reset", cls: "secondary", action: (S, s, c) => { Object.assign(s, { sap: 0, salt: 0, saltAdd: false, scrub: 0, att: 0, lost: 0, clean: 0 }); s.reseed = true; } },
      ];
    },
    views: [{ label: "Bench", cam: [[-0.2, 2.8, 9.2], [0.1, 2.3, 0]] }, { label: "Close up", cam: [[1.0, 1.4, 5.6], [1.6, 1.0, 0]] }],
    note: "Soap is made by saponification: a fat or oil (an ester of propane-1,2,3-triol, glycerol) is boiled with a strong alkali to give glycerol and the sodium or potassium salt of long-chain fatty acids. Adding concentrated NaCl solution makes the soap less soluble so the curds float on top. A soap ion has a hydrophilic (water-loving) head and a hydrophobic (grease-loving) hydrocarbon tail; the tails dissolve in grease, the heads stay in the water, so grease is broken into tiny droplets (an emulsion) and rinsed away. In hard water, Ca²⁺ and Mg²⁺ turn soap into insoluble scum, whereas soapless detergents form soluble calcium salts and keep cleaning.",
    onChange(S, s, c, key) { if (key === "mode") C3.setView(S, { cam: c.mode === "make" ? [[-0.2, 2.8, 9.2], [0.1, 2.3, 0]] : [[1.9, 2.6, 8.8], [1.9, 1.5, 0]] }); Object.assign(s, { sap: 0, salt: 0, saltAdd: false, scrub: 0, att: 0, lost: 0, clean: 0 }); s.reseed = true; },
    reset(S, s, c) { Object.assign(c, { mode: "make", oil: "palm", alk: "naoh", cleaner: "soap", water: "soft", conc: 60, heat: 1 }); Object.assign(s, { sap: 0, salt: 0, saltAdd: false, scrub: 0, att: 0, lost: 0, clean: 0 }); s.reseed = true; },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Oil / fat</th><th style="text-align:left">Fatty acids</th><th style="text-align:left">Soap made with NaOH</th><th>lather</th></tr>' + Object.keys(OIL).map((k) => '<tr class="' + (k === c.oil ? "ok" : "") + '"><td style="text-align:left">' + OIL[k].n + '</td><td style="text-align:left">' + OIL[k].acid + '</td><td style="text-align:left">' + OIL[k].soap + "</td><td>" + OIL[k].lather + "</td></tr>").join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.m4 = new T.Matrix4(); s.cl = new T.Color(); S.mk.box(9, 0.1, 3, M.matte(0x2a2e36, 0.7), 1.2, -0.05, 0);
      /* making soap: flask on hot plate with a condenser-like reflux column */
      S.mk.box(1.9, 0.16, 1.9, M.matte(0x2a2c30, 0.5), -2.4, 0.08, 0); s.hot = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.02, 32), new T.MeshBasicMaterial({ color: 0x401010 })); s.hot.position.set(-2.4, 0.17, 0); S.scene.add(s.hot);
      s.fk = K.vessel("flask"); s.fk.group.position.set(-2.4, 0.18, 0); s.liq = s.fk.addLiquid({ color: [236, 150, 40], opacity: 0.6 }); s.liq.setVolume(120);
      s.bub = K.bubbles(s.fk, s.liq, { n: 60, x: 0, z: 0, baseY: 1.2, spread: 2.0 });
      s.curd = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 36), new T.MeshStandardMaterial({ color: 0xf6f2e6, roughness: 0.9 })); s.curd.visible = false; s.fk.group.add(s.curd);
      s.col = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 2.4, 20, 1, true), new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.4, side: T.DoubleSide, roughness: 0.1, depthWrite: false })); s.col.position.set(-2.4, 3.3, 0); S.scene.add(s.col); s.colin = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.3, 12), new T.MeshStandardMaterial({ color: 0x9fd2ff, transparent: true, opacity: 0.35 })); s.colin.position.copy(s.col.position); S.scene.add(s.colin);
      s.stand = S.mk.rod(V3(-3.4, 0, -0.5), V3(-3.4, 4.6, -0.5), 0.04, M.steel()); s.bar = S.mk.rod(V3(-3.4, 3.3, -0.5), V3(-2.45, 3.3, -0.05), 0.03, M.steel());
      s.make = [s.fk.group, s.hot, s.col, s.colin, s.stand, s.bar];
      /* cleaning: water tank with cloth, grease droplet and soap molecules */
      s.wash = new T.Group(); S.scene.add(s.wash); s.tank = new T.Mesh(new T.BoxGeometry(5.6, 3.2, 1.8), new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.12, side: T.DoubleSide, depthWrite: false, roughness: 0.1 })); s.tank.position.set(1.4, 1.6, 0); s.wash.add(s.tank); s.wat = new T.Mesh(new T.BoxGeometry(5.5, 2.7, 1.7), new T.MeshStandardMaterial({ color: 0x4a9ae0, transparent: true, opacity: 0.22, depthWrite: false })); s.wat.position.set(1.4, 1.45, 0); s.wash.add(s.wat);
      s.cloth = new T.Mesh(new T.BoxGeometry(2.4, 0.06, 1.4), new T.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 1 })); s.cloth.position.set(1.4, 0.06, 0); s.wash.add(s.cloth);
      s.stain = new T.Mesh(new T.CylinderGeometry(R0 * 1.15, R0 * 1.15, 0.01, 32), new T.MeshStandardMaterial({ color: 0xe0b020, roughness: 0.6, transparent: true })); s.stain.position.set(1.4, 0.1, 0); s.wash.add(s.stain);
      s.drop = new T.Mesh(new T.SphereGeometry(R0, 36, 24), new T.MeshStandardMaterial({ color: 0xe8b81c, roughness: 0.2, transparent: true, opacity: 0.85 })); s.drop.scale.y = 0.55; s.drop.position.set(1.4, 0.3, 0); s.wash.add(s.drop);
      s.mh = new T.InstancedMesh(new T.SphereGeometry(0.055, 12, 10), new T.MeshStandardMaterial({ color: 0x3a8cff, roughness: 0.3 }), NMOL); s.mt = new T.InstancedMesh(new T.CylinderGeometry(0.012, 0.012, 0.24, 6), new T.MeshStandardMaterial({ color: 0xffe9a8, roughness: 0.5 }), NMOL); s.mh.frustumCulled = s.mt.frustumCulled = false; s.wash.add(s.mh); s.wash.add(s.mt);
      s.sc = new T.InstancedMesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 1 }), NMOL); s.sc.frustumCulled = false; s.wash.add(s.sc);
      s.cad = new T.InstancedMesh(new T.SphereGeometry(0.035, 8, 6), new T.MeshStandardMaterial({ color: 0xffb35a, roughness: 0.4 }), 40); s.cad.frustumCulled = false; s.wash.add(s.cad);
      seedMol(S, s, c);
    },
    update(S, s, c, dt) {
      const make = c.mode === "make"; s.make.forEach((o) => { o.visible = make; }); s.wash.visible = !make;
      if (s.reseed) seedMol(S, s, c);
      if (make) {
        const oil = OIL[c.oil], alk = ALK[c.alk]; if (c.heat && dt > 0) s.sap = Math.min(1, s.sap + dt * 0.085 * alk.k); if (s.saltAdd && s.sap > 0.05 && dt > 0) s.salt = Math.min(1, s.salt + dt * 0.25);
        s.hot.material.color.setRGB(0.25 + 0.75 * (c.heat ? 1 : 0), 0.06 + 0.14 * (c.heat ? 1 : 0), 0.06);
        const base = mixc(oil.col, [240, 238, 232], clamp(s.sap * 0.8, 0, 1) * 0.5); s.liq.setColor(mixc(base, [230, 236, 240], s.salt * 0.6), lerp(0.7, 0.45, s.sap)); s.liq.setVolume(120 + 15 * s.sap); s.liq.update(S.t);
        s.bub.rate = c.heat && s.sap < 1 ? 28 : c.heat ? 18 : 0; s.bub.update(dt, S.t);
        const curd = s.salt * Math.min(1, s.sap * 1.05); s.curd.visible = curd > 0.02; s.curd.scale.set(0.62, 0.12 * curd + 0.001, 0.62); s.curd.position.y = s.liq.level * CM + 0.06 * curd; s.curd.material.color.setHex(oil.col[2] < 120 ? 0xf1d9a0 : oil.col[2] < 160 ? 0xf3e6b8 : 0xf6f2e6);
      } else {
        const hard = c.water === "hard", soap = c.cleaner === "soap", scumFrac = hard && soap ? 0.78 : 0, avail = Math.round(c.conc * (1 - scumFrac));
        if (dt > 0) { s.t += dt; if (s.scrub > 0) s.scrub -= dt; }
        const agit = (s.scrub > 0 ? 1 : 0) + 0.12, want = Math.min(avail, NEED + 20); let att = 0; s.mol.forEach((q, i) => {
          const isScum = i < NMOL * (c.conc * scumFrac) / c.conc && hard && soap && i < Math.round(c.conc * scumFrac); const active = i < c.conc;
          if (!active) { q.st = -1; return; } if (isScum) { q.st = 2; return; }
          if (q.st === 0 && dt > 0 && Math.random() < dt * agit * 0.9) q.st = 1; if (q.st < 0) q.st = 0; if (q.st === 2) q.st = 0;
          if (q.st === 1) att++;
        });
        /* enforce coverage-limited attachment */
        let k = 0; s.mol.forEach((q) => { if (q.st === 1) { k++; if (k > NEED + 20) q.st = 0; } }); s.att = att = Math.min(att, NEED + 20); const cov = clamp(att / NEED, 0, 1); s.cov = cov; s.avail = avail; s.scumFrac = scumFrac;
        s.clean = lerp(s.clean, cov, 0.1); const lift = clamp((cov - 0.35) / 0.65, 0, 1); s.drop.visible = true; s.drop.position.y = lerp(0.3, 1.5, lift) + (lift > 0.9 ? 0.1 * Math.sin(S.t * 2) : 0); s.drop.scale.set(1, lerp(0.55, 1, lift), 1); s.drop.material.opacity = lerp(0.9, 0.45, lift); s.stain.material.opacity = 1 - lift; s.stain.visible = lift < 0.98; s.cloth.material.color.setRGB(lerp(0.9, 0.98, lift), lerp(0.85, 0.97, lift), lerp(0.7, 0.95, lift));
        let ai = 0; s.mol.forEach((q, i) => {
          let hx, hy, hz, tx, ty, tz, dx, dy, dz;
          if (q.st === 1) { const ci = ai++ / (NEED + 20); const phi = Math.acos(1 - 2 * ((ai * 0.618) % 1)), th = ai * 2.399; dx = Math.sin(phi) * Math.cos(th); dy = Math.cos(phi); dz = Math.sin(phi) * Math.sin(th); const cy = s.drop.position.y + 0.0, rr = R0 * (1 + 0 * ci) * (dy < 0 && lift < 0.9 ? 0.0 : 1); if (dy < 0 && lift < 0.9) { dy = Math.abs(dy) * 0.5; } hx = 1.4 + dx * (R0 + 0.2); hy = cy + dy * (R0 * s.drop.scale.y + 0.2); hz = dz * (R0 + 0.2); }
          else { if (q.st >= 0 && dt > 0) { q.x += q.vx * dt * (1 + agit); q.y += q.vy * dt * (1 + agit); q.z += q.vz * dt; if (q.x < -1.3 || q.x > 4.1) q.vx *= -1; if (q.y < 0.35 || q.y > 2.7) q.vy *= -1; if (Math.abs(q.z) > 0.7) q.vz *= -1; q.a += dt * 0.5; } hx = q.x; hy = q.y; hz = q.z; dx = Math.sin(q.b) * Math.cos(q.a); dy = Math.cos(q.b); dz = Math.sin(q.b) * Math.sin(q.a); }
          if (q.st < 0 || q.st === 2) { s.m4.makeScale(0, 0, 0); s.mh.setMatrixAt(i, s.m4); s.mt.setMatrixAt(i, s.m4); if (q.st === 2) { s.m4.makeTranslation(q.x, 2.6 + 0.04 * Math.sin(S.t + q.ph), q.z); s.sc.setMatrixAt(i, s.m4); } else s.sc.setMatrixAt(i, s.m4.makeScale(0, 0, 0)); return; }
          s.m4.makeScale(1, 1, 1); s.m4.setPosition(hx, hy, hz); s.mh.setMatrixAt(i, s.m4); s.sc.setMatrixAt(i, s.m4.makeScale(0, 0, 0));
          const dir = new T.Vector3(dx, dy, dz).normalize(), mid = new T.Vector3(hx, hy, hz).addScaledVector(dir, -0.14), qn = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir); s.m4.compose(mid, qn, new T.Vector3(1, 1, 1)); s.mt.setMatrixAt(i, s.m4);
        });
        s.mh.instanceMatrix.needsUpdate = s.mt.instanceMatrix.needsUpdate = s.sc.instanceMatrix.needsUpdate = true;
        s.mh.material.color.setHex(soap ? 0x3a8cff : 0x2fd6a0); const nCa = hard ? 30 : 0; s.cdi.forEach((q, i) => { if (i >= nCa) s.m4.makeScale(0, 0, 0); else { if (dt > 0) { q.x += Math.sin(S.t * 0.6 + q.ph) * 0.2 * dt; q.y += Math.cos(S.t * 0.5 + q.ph) * 0.15 * dt; } s.m4.makeTranslation(q.x, clamp(q.y, 0.4, 2.6), q.z); } s.cad.setMatrixAt(i, s.m4); }); s.cad.instanceMatrix.needsUpdate = true;
      }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); const px = w - 250; ctx.textAlign = "left";
      if (c.mode === "make") {
        const oil = OIL[c.oil], alk = ALK[c.alk]; H.pill(ctx, 10, 22, oil.n + " + " + alk.n.split(" ")[0], "#ffe9b8", 11); H.pill(ctx, 10, 44, s.salt > 0.5 ? "soap curds float on the salt solution" : s.sap >= 1 ? "saponification complete: now add NaCl" : c.heat ? "saponifying: " + Math.round(s.sap * 100) + " %" : "heat the mixture to start", s.salt > 0.5 ? "#8dffb8" : "#9fe3ff", 10);
        H.panel(ctx, px, 58, 240, 120); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Saponification", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; let y = wrapT(ctx, "fat/oil + 3" + (c.alk === "naoh" ? "NaOH" : "KOH") + " → glycerol + 3 " + alk.f, px + 8, 88, 224, 11); ctx.fillStyle = "#9fb2d2"; y = wrapT(ctx, "C₃H₅(OOCR)₃ + 3" + (c.alk === "naoh" ? "NaOH" : "KOH") + " → C₃H₅(OH)₃ + 3" + alk.f, px + 8, y + 15, 224, 11); y = wrapT(ctx, "ester + alkali → alcohol + salt of a fatty acid", px + 8, y + 15, 224, 11); wrapT(ctx, "Product: " + alk.soap, px + 8, y + 15, 224, 11);
        H.panel(ctx, px, 184, 240, 100); const bx = px + 12, by = 214, bw = 216; ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("oil converted to soap + glycerol", bx, by - 6); ctx.fillStyle = "rgba(143,180,255,0.2)"; ctx.fillRect(bx, by, bw, 10); ctx.fillStyle = "#ffd27a"; ctx.fillRect(bx, by, bw * s.sap, 10); ctx.fillStyle = "#e8f0ff"; ctx.fillText(Math.round(s.sap * 100) + " %", bx + bw - 28, by + 8); ctx.fillStyle = "#9fb2d2"; ctx.fillText("soap separated (salting out)", bx, by + 30); ctx.fillStyle = "rgba(143,180,255,0.2)"; ctx.fillRect(bx, by + 36, bw, 10); ctx.fillStyle = "#f6f2e6"; ctx.fillRect(bx, by + 36, bw * s.salt * Math.min(1, s.sap * 1.05), 10); ctx.fillStyle = "#9fb2d2"; wrapT(ctx, "Lather: " + oil.lather + ". " + oil.soap + ".", bx, by + 62, bw, 10);
        const q = S.proj(V3(-2.4, 2.4, 0)); H.pill(ctx, q.x, q.y, "flask on hot plate", "#bcd0ea", 8.5, "center"); const q2 = S.proj(V3(-2.2, 3.9, 0)); H.pill(ctx, q2.x + 8, q2.y, "reflux condenser", "#bcd0ea", 8.5, "left");
      } else {
        const hard = c.water === "hard", soap = c.cleaner === "soap"; H.pill(ctx, 10, 22, (soap ? "Soap" : "Detergent") + " in " + (hard ? "hard" : "soft") + " water", "#ffe9b8", 11); H.pill(ctx, 10, 44, s.cov >= 0.95 ? "grease lifted off: cloth is clean" : s.cov > 0.3 ? "grease being surrounded by molecules" : "press ‘Scrub the cloth’", s.cov >= 0.95 ? "#8dffb8" : "#9fe3ff", 10);
        H.panel(ctx, px, 58, 240, 110); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Cleaning action", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#3a8cff"; ctx.fillText("● hydrophilic head (in water)", px + 8, 89); ctx.fillStyle = "#ffe9b8"; ctx.fillText("│ hydrocarbon tail (in grease)", px + 8, 102); ctx.fillStyle = "#e8b81c"; ctx.fillText("● grease", px + 8, 115); ctx.fillStyle = "#e9e6dc"; ctx.fillText("● scum (insoluble Ca soap)", px + 8, 128); ctx.fillStyle = "#ffb35a"; ctx.fillText("● Ca²⁺ / Mg²⁺ ions", px + 8, 141); ctx.fillStyle = "#9fb2d2"; ctx.fillText(soap ? "2RCOO⁻ + Ca²⁺ → (RCOO)₂Ca ↓" : "RSO₃⁻ + Ca²⁺ → soluble salt", px + 8, 156);
        H.panel(ctx, px, 174, 240, 110); const bx = px + 12, bw = 216; ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("molecules available to clean: " + s.avail + " of " + c.conc, bx, 192); ctx.fillText("coverage of the grease drop (needs ~" + NEED + ")", bx, 214); ctx.fillStyle = "rgba(143,180,255,0.2)"; ctx.fillRect(bx, 220, bw, 10); ctx.fillStyle = s.cov >= 0.95 ? "#7dffbd" : "#ffd27a"; ctx.fillRect(bx, 220, bw * s.cov, 10); ctx.fillStyle = "#e8f0ff"; ctx.fillText(Math.round(s.cov * 100) + " %", bx + bw - 28, 229); ctx.fillStyle = "#9fb2d2"; wrapT(ctx, hard && soap ? "Hard water wastes soap as scum (about 80 % here): you need much more soap, and a grey scum floats on top." : hard ? "A detergent forms a soluble salt with Ca²⁺, so no scum forms and it cleans as well in hard water." : "In soft water, soap lathers easily and cleans well.", bx, 246, bw, 10);
      }
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "make") { const oil = OIL[c.oil], alk = ALK[c.alk]; return [["Oil or fat", oil.n + " (" + oil.acid + ")"], ["Alkali", alk.n], ["Soap formed", alk.soap], ["Saponified", Math.round(s.sap * 100) + " %"], ["Salting out", s.salt > 0 ? "NaCl added: soap curds rise (" + Math.round(s.salt * 100) + " %)" : "not yet added"], ["By-product", "glycerol (propane-1,2,3-triol), dissolved in the lower layer"]]; }
      return [["Cleaning agent", c.cleaner === "soap" ? "soap, RCOO⁻Na⁺ (from fats and oils)" : "soapless detergent, RSO₃⁻Na⁺ (from petroleum)"], ["Water", c.water === "hard" ? "hard (Ca²⁺, Mg²⁺ present)" : "soft"], ["Molecules available", s.avail + " of " + c.conc], ["Grease covered", Math.round(s.cov * 100) + " %"], ["Scum", c.cleaner === "soap" && c.water === "hard" ? "forms: (RCOO)₂Ca is insoluble" : "none"], ["Environment", "detergents with branched chains do not biodegrade well; modern ones use straight chains"]];
    },
    steps(s, c) { return c.mode === "make" ? [["Pick an oil and an alkali", "done"], ["Heat the mixture until saponification is complete", s.sap >= 1 ? "done" : "now"], ["Add NaCl so the soap separates", s.salt > 0.5 ? "done" : ""], ["Compare the soaps from different oils", ""]] : [["Choose soap or detergent and the water type", "done"], ["Scrub and watch molecules surround the grease", s.cov > 0.3 ? "done" : "now"], ["Switch to hard water and compare", ""], ["Add more soap to overcome the scum", ""]]; },
  };
})();
