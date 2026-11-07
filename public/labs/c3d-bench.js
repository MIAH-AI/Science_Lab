/* c3d-bench.js — chemistry 3D, new modules: separation techniques bench; diffusion, vapour pressure and melting point */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (x) => x * x * (3 - 2 * x);
  const rnd = (() => { let a = 12345; return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const FONT = "'IBM Plex Mono',monospace";
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  function sp(ctx, px, y, h, title, lines, fs) { H.panel(ctx, px, y, 240, h); ctx.textAlign = "left"; ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText(title, px + 8, y + 15); ctx.font = (fs || 8.6) + "px " + FONT; let yy = y + 29; lines.forEach((t) => { ctx.fillStyle = "#e8f0ff"; yy = wrapT(ctx, t, px + 8, yy, 224, 10.5) + 11.5; }); }
  const glass = (op) => new T.MeshPhysicalMaterial({ color: 0xcfe8f5, transparent: true, opacity: op == null ? 0.25 : op, roughness: 0.05, side: T.DoubleSide, depthWrite: false });
  const ball = (r, col) => new T.Mesh(new T.SphereGeometry(r, 12, 10), new T.MeshStandardMaterial({ color: col, roughness: 0.6 }));
  const pillAt = (ctx, S, x, y, z, t, col) => { const p = S.proj(V3(x, y, z)); H.pill(ctx, p.x, p.y, t, col || "#cfe0f5", 8.6, "center"); };

  /* =================== 1. SEPARATION BENCH =================== */
  const METH = {
    filt: { n: "Filtration", mix: "sand + water (insoluble solid in a liquid)", prop: "sand grains are too large to pass through the filter paper; water passes through", res: "residue: sand   filtrate: water", use: "removing sand from water, collecting a precipitate" },
    evap: { n: "Evaporation to dryness", mix: "salt dissolved in water (soluble solid in a liquid)", prop: "water evaporates easily on heating; salt does not", res: "salt crystals remain in the dish", use: "getting salt from salt solution; crystallisation for salts that decompose on strong heating" },
    decant: { n: "Decantation", mix: "sand + water (sediment in a liquid)", prop: "the heavy sand settles to the bottom, so the liquid can be poured off", res: "sand stays in the first beaker; water is poured into the second", use: "quick separation of a settled solid from a liquid" },
    magnet: { n: "Magnetic separation", mix: "iron filings + sulphur powder", prop: "iron is attracted by a magnet; sulphur is not", res: "iron on the magnet, sulphur left on the tile", use: "separating magnetic metals (iron, nickel, cobalt) from non-magnetic solids; scrap recycling" },
    sublim: { n: "Sublimation", mix: "ammonium chloride + sodium chloride", prop: "ammonium chloride changes straight from solid to gas on heating; sodium chloride does not", res: "NH₄Cl deposits on the cold surface; NaCl stays in the dish", use: "separating a sublimable solid (NH₄Cl, iodine, naphthalene, dry ice) from a non-sublimable one" },
    funnel: { n: "Separating funnel", mix: "oil + water (immiscible liquids)", prop: "the two liquids do not mix and have different densities: oil floats on water", res: "the denser water is run off first, the oil is left", use: "separating immiscible liquids such as oil and water, or an organic solvent from an aqueous layer" },
  };
  const MK = Object.keys(METH);
  const CAMS = { filt: [[2.0, 3.2, 11.2], [2.0, 2.3, 0]], evap: [[2.0, 5.2, 9.6], [2.0, 2.6, 0]], decant: [[2.4, 2.9, 9.8], [2.4, 1.4, 0]], magnet: [[2.6, 3.4, 9.2], [2.6, 0.8, 0]], sublim: [[2.0, 4.6, 12.0], [2.0, 3.0, 0]], funnel: [[2.0, 3.2, 11.6], [2.0, 2.4, 0]] };
  C3.scenes.separationBench = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[2.0, 3.2, 11.2], [2.0, 2.3, 0]],
    values: { m: "filt", prog: 0, run: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "m", label: "Method", options: MK.map((k) => ({ value: k, label: METH[k].n + ": " + METH[k].mix })) },
        { type: "range", key: "prog", label: "Progress of separation (%)", min: 0, max: 100, step: 1, unit: " %" },
        { type: "toggle", key: "run", label: "Run automatically" },
        { type: "button", label: "Restart", action: (S, s, c) => { c.prog = 0; } },
      ];
    },
    views: [{ label: "Bench", cam: [[2.0, 2.7, 9.6], [2.0, 1.5, 0]] }, { label: "Close", cam: [[1.5, 2.5, 6.6], [1.5, 1.6, 0]] }],
    note: "A mixture can be separated by exploiting a difference in physical properties of its parts, because no chemical change takes place. Filtration separates an insoluble solid from a liquid by particle size. Evaporation removes a liquid from a dissolved solid. Decantation pours a liquid off a settled solid. A magnet separates iron, nickel or cobalt from non-magnetic solids. Sublimation separates a solid that goes straight to vapour (ammonium chloride, iodine) from one that does not. A separating funnel separates immiscible liquids by density. Pure substances (elements and compounds) cannot be separated by physical methods, and a compound can be broken down only by chemical reactions. The apparatus is drawn schematically.",
    onChange(S, s, c, key) { if (key === "m") { c.prog = 0; C3.setView(S, { cam: CAMS[c.m] }); } },
    reset(S, s, c) { Object.assign(c, { m: "filt", prog: 0, run: 1 }); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Mixture</th><th style="text-align:left">Property used</th><th style="text-align:left">Method</th></tr>' + MK.map((k) => '<tr><td style="text-align:left">' + METH[k].mix + '</td><td style="text-align:left">' + METH[k].prop + '</td><td style="text-align:left">' + METH[k].n + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(13, 0.1, 5, M.matte(0xb99a74, 0.6), 2.0, -0.05, 0); s.g = {}; const mk = (k) => { const g = new T.Group(); S.scene.add(g); s.g[k] = g; return g; };
      /* filtration */
      s.fl = K.vessel("flask"); s.fl.group.position.set(0, 0.07, 0); s.fliq = s.fl.addLiquid({ color: [200, 225, 245], opacity: 0.3 }); s.fliq.setVolume(0.1);
      const bx = new T.Box3().setFromObject(s.fl.group); s.flTop = bx.max.y; const g = mk("filt"); const fg = new T.Group(); fg.position.set(0, s.flTop - 0.25, 0); g.add(fg); s.fg = fg;
      const stem = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.7, 14, 1, true), glass(0.35)); stem.position.y = 0.35; fg.add(stem); const cone = new T.Mesh(new T.CylinderGeometry(0.95, 0.09, 1.3, 32, 1, true), glass(0.22)); cone.position.y = 1.35; fg.add(cone);
      const paper = new T.Mesh(new T.CylinderGeometry(0.86, 0.1, 1.15, 32, 1, true), new T.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.9, side: T.DoubleSide, transparent: true, opacity: 0.85 })); paper.position.y = 1.32; fg.add(paper);
      s.slurry = new T.Mesh(new T.CylinderGeometry(0.8, 0.2, 1.0, 24), new T.MeshStandardMaterial({ color: 0xa88a5e, transparent: true, opacity: 0.55, roughness: 0.8 })); s.slurry.position.y = 1.3; fg.add(s.slurry);
      s.sand = []; for (let i = 0; i < 70; i++) { const b = ball(0.045, 0xb78a4c); const y = 0.78 + rnd() * 0.22, r = (0.12 + 0.6 * (y - 0.75) / 0.6) * Math.sqrt(rnd()), a = rnd() * 6.28; b.position.set(r * Math.cos(a), y, r * Math.sin(a)); fg.add(b); s.sand.push(b); }
      s.drop = ball(0.05, 0x7fb6e6); s.drop.position.set(0, 0, 0); fg.add(s.drop);
      /* evaporation & sublimation share the burner */
      s.bun = K.bunsen({ x: 0, z: 0, flameH: 3 }); s.bun.setAir(1); s.bun.setGas(0.8); const bb = new T.Box3().setFromObject(s.bun.group || s.bun); s.bunTop = isFinite(bb.max.y) ? bb.max.y : 1.4;
      const ge = mk("evap"); const dy = 3.2; s.dishY = dy; const dish = new T.Mesh(new T.CylinderGeometry(1.15, 0.8, 0.32, 36, 1, true), new T.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.5, side: T.DoubleSide, transparent: true, opacity: 0.4, depthWrite: false })); dish.position.y = dy + 0.16; ge.add(dish); const dbot = new T.Mesh(new T.CircleGeometry(0.8, 28), new T.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.5, side: T.DoubleSide, transparent: true, opacity: 0.4, depthWrite: false })); dbot.rotation.x = -Math.PI / 2; dbot.position.y = dy + 0.01; ge.add(dbot);
      for (let i = 0; i < 3; i++) { const a = (i * 2.094) + 0.5, leg = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, dy - 0.02, 8), M.steel()); leg.position.set(0.9 * Math.cos(a), (dy - 0.02) / 2, 0.9 * Math.sin(a)); ge.add(leg); } const gz = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.03, 24), new T.MeshStandardMaterial({ color: 0x8c8f94, roughness: 0.7, wireframe: false })); gz.position.y = dy - 0.03; ge.add(gz);
      s.eliq = new T.Mesh(new T.CylinderGeometry(0.95, 0.78, 0.25, 32), new T.MeshStandardMaterial({ color: 0xbfe0f5, transparent: true, opacity: 0.55, roughness: 0.1 })); s.eliq.position.y = dy + 0.14; ge.add(s.eliq);
      s.cr = []; for (let i = 0; i < 45; i++) { const b = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })); const r = 0.7 * Math.sqrt(rnd()), a = rnd() * 6.28; b.position.set(r * Math.cos(a), dy + 0.06, r * Math.sin(a)); b.rotation.set(rnd(), rnd(), rnd()); ge.add(b); s.cr.push(b); }
      s.steam = []; for (let i = 0; i < 10; i++) { const sp_ = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(48, "rgba(235,242,250,1)"), color: 0xeaf2fa, transparent: true, opacity: 0.0, depthWrite: false })); sp_.scale.set(0.5, 0.5, 1); sp_.position.set(0, dy + 0.4, 0); ge.add(sp_); s.steam.push(sp_); }
      /* decantation */
      s.b1 = K.beaker(); s.b1.group.position.set(-1.6, 0.07, 0); s.l1 = s.b1.addLiquid({ color: [190, 160, 110], opacity: 0.5 }); s.l1.setVolume(200); s.b2 = K.beaker(); s.b2.group.position.set(1.4, 0.07, 0); s.l2 = s.b2.addLiquid({ color: [200, 225, 245], opacity: 0.3 }); s.l2.setVolume(0.1);
      const b1b = new T.Box3().setFromObject(s.b1.group); s.b1h = b1b.max.y - b1b.min.y; s.b1r = (b1b.max.x - b1b.min.x) / 2; s.dsand = []; for (let i = 0; i < 40; i++) { const b = ball(0.05, 0xb78a4c); const r = (s.b1r - 0.15) * Math.sqrt(rnd()), a = rnd() * 6.28; b.userData.end = V3(r * Math.cos(a), 0.1 + rnd() * 0.08, r * Math.sin(a)); b.userData.start = V3(r * Math.cos(a), 0.5 + rnd() * (s.b1h - 0.9), r * Math.sin(a)); s.b1.group.add(b); s.dsand.push(b); }
      s.stream = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 8), new T.MeshStandardMaterial({ color: 0x9ccbec, transparent: true, opacity: 0.7, roughness: 0.1 })); S.scene.add(s.stream);
      /* magnet */
      const gm = mk("magnet"); const tile = new T.Mesh(new T.BoxGeometry(5.2, 0.08, 2.6), M.matte(0xe8e2d6, 0.6)); tile.position.set(1.0, 0.04, 0); gm.add(tile);
      s.fe = []; s.su = []; for (let i = 0; i < 30; i++) { const f = new T.Mesh(new T.BoxGeometry(0.16, 0.05, 0.07), new T.MeshStandardMaterial({ color: 0x30343a, metalness: 0.7, roughness: 0.4 })); f.position.set(-1.3 + rnd() * 4.6, 0.1, -1.0 + rnd() * 2.0); f.rotation.y = rnd() * 3; f.userData.home = f.position.clone(); f.userData.att = null; gm.add(f); s.fe.push(f); const y = ball(0.085, 0xe8d23a); y.position.set(-1.3 + rnd() * 4.6, 0.12, -1.0 + rnd() * 2.0); gm.add(y); s.su.push(y); }
      s.mag = new T.Group(); const mr = new T.Mesh(new T.BoxGeometry(0.5, 0.34, 1.8), M.matte(0xd23a3a, 0.4)); mr.position.x = -0.3; const mb = new T.Mesh(new T.BoxGeometry(0.5, 0.34, 1.8), M.matte(0x3a5cd2, 0.4)); mb.position.x = 0.2; s.mag.rotation.y = Math.PI / 2; const mg = new T.Group(); mg.add(mr, mb); mg.rotation.y = 0; s.mag.add(mg); s.mag.position.set(-1.3, 1.1, 0); gm.add(s.mag); s.mag.userData.n = 0;
      /* sublimation */
      const gs = mk("sublim"); gs.position.set(0, 0, 0); const sd = new T.Mesh(new T.CylinderGeometry(1.15, 0.8, 0.32, 36, 1, true), new T.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.5, side: T.DoubleSide, transparent: true, opacity: 0.4, depthWrite: false })); sd.position.y = dy + 0.16; gs.add(sd); const sb = dbot.clone(); gs.add(sb); for (let i = 0; i < 3; i++) { const a = (i * 2.094) + 0.5, leg = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, dy - 0.02, 8), M.steel()); leg.position.set(0.9 * Math.cos(a), (dy - 0.02) / 2, 0.9 * Math.sin(a)); gs.add(leg); } const gz2 = gz.clone(); gs.add(gz2);
      s.plate = new T.Mesh(new T.BoxGeometry(2.8, 0.12, 2.0), glass(0.4)); s.plate.position.y = dy + 1.7; gs.add(s.plate); const ice = new T.Mesh(new T.BoxGeometry(2.6, 0.2, 1.8), new T.MeshStandardMaterial({ color: 0xa8d4ff, transparent: true, opacity: 0.55, roughness: 0.2 })); ice.position.y = dy + 1.86; gs.add(ice);
      s.nh = []; s.nacl = []; for (let i = 0; i < 40; i++) { const r = 0.65 * Math.sqrt(rnd()), a = rnd() * 6.28; const x = r * Math.cos(a), z = r * Math.sin(a); const w = ball(0.06, 0xffffff); w.position.set(x, dy + 0.07, z); w.userData.s = w.position.clone(); w.userData.e = V3((rnd() - 0.5) * 2.2, dy + 1.62, (rnd() - 0.5) * 1.5); w.userData.t = 0.05 + rnd() * 0.6; gs.add(w); s.nh.push(w); const q = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.1), new T.MeshStandardMaterial({ color: 0xaab6d0, roughness: 0.4 })); const r2 = 0.65 * Math.sqrt(rnd()), a2 = rnd() * 6.28; q.position.set(r2 * Math.cos(a2), dy + 0.06, r2 * Math.sin(a2)); q.rotation.set(rnd(), rnd(), rnd()); gs.add(q); s.nacl.push(q); }
      /* separating funnel */
      const gf2 = mk("funnel"); s.sf = new T.Group(); s.sf.position.set(0.4, 2.5, 0); gf2.add(s.sf); const RF = (y) => 0.12 + 0.78 * (y - 0.5) / 2.1; s.RF = RF; const body = new T.Mesh(new T.CylinderGeometry(0.9, 0.12, 2.1, 36, 1, true), glass(0.35)); body.position.y = 1.55; s.sf.add(body); const tube = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.5, 14, 1, true), glass(0.3)); tube.position.y = 0.25; s.sf.add(tube); const tap = new T.Mesh(new T.BoxGeometry(0.42, 0.1, 0.12), M.steel()); tap.position.y = 0.45; s.sf.add(tap); const stp = new T.Mesh(new T.CylinderGeometry(0.16, 0.2, 0.22, 14), M.rubber()); stp.position.y = 2.7; s.sf.add(stp); s.lw = null; s.lo = null;
      s.rb = K.beaker(); s.rb.group.position.set(0.4, 0.07, 0); s.rl = s.rb.addLiquid({ color: [140, 190, 230], opacity: 0.4 }); s.rl.setVolume(0.1); s.sfs = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 1, 8), new T.MeshStandardMaterial({ color: 0x8cc0e8, transparent: true, opacity: 0.8 })); S.scene.add(s.sfs); s.sfs.visible = false;
    },
    update(S, s, c, dt) {
      const m = c.m; if (c.run && c.prog < 100) c.prog = Math.min(100, c.prog + dt * 7); const p = c.prog / 100;
      Object.keys(s.g).forEach((k) => (s.g[k].visible = k === m)); s.fl.group.visible = m === "filt"; s.b1.group.visible = s.b2.group.visible = m === "decant"; s.stream.visible = false; s.rb.group.visible = m === "funnel"; s.bun.visible = m === "evap" || m === "sublim";
      if (s.bun.visible) { s.bun.setGas(p < 0.98 && c.prog > 0 ? 0.8 : 0.4); s.bun.flame.update(S.t); }
      if (m === "filt") { const n = Math.floor(70 * clamp(p * 1.15, 0, 1)); s.sand.forEach((b, i) => (b.visible = i < n)); s.slurry.scale.y = Math.max(0.02, 1 - p * 0.95); s.slurry.position.y = 0.78 + 0.5 * s.slurry.scale.y; s.slurry.visible = p < 0.98; s.fliq.setVolume(0.1 + p * 110); s.fliq.update(S.t); const f = (S.t * 1.6) % 1; s.drop.visible = p > 0.01 && p < 0.99; s.drop.position.set(0, -0.15 - f * (s.flTop * 0.35), 0); }
      else if (m === "evap") { const q = clamp(p / 0.65, 0, 1); s.eliq.scale.y = Math.max(0.01, 1 - q); s.eliq.position.y = s.dishY + 0.02 + 0.125 * s.eliq.scale.y; s.eliq.visible = q < 0.995; const n = Math.floor(45 * clamp((p - 0.5) / 0.4, 0, 1)); s.cr.forEach((b, i) => (b.visible = i < n)); s.steam.forEach((sp_, i) => { const ph = ((S.t * 0.4 + i / 10) % 1); sp_.position.set(0.35 * Math.sin(i * 2 + S.t), s.dishY + 0.4 + ph * 1.5, 0.3 * Math.cos(i * 3)); sp_.material.opacity = q < 0.98 ? 0.35 * (1 - ph) : 0; }); }
      else if (m === "decant") {
        const set = clamp(p / 0.3, 0, 1), tilt = 0.62 * sm(clamp((p - 0.35) / 0.2, 0, 1)) * (1 - sm(clamp((p - 0.88) / 0.1, 0, 1))), pour = clamp((p - 0.45) / 0.4, 0, 1);
        s.dsand.forEach((b) => b.position.lerpVectors(b.userData.start, b.userData.end, sm(set)));
        const col = [190 + (200 - 190) * set, 160 + (225 - 160) * set, 110 + (245 - 110) * set]; s.l1.setColor(col, 0.5 - 0.2 * set); s.l1.setVolume(200 - 150 * sm(pour)); s.l1.update(S.t); s.l2.setVolume(0.1 + 140 * sm(pour)); s.l2.update(S.t); s.b1.group.rotation.z = -tilt; s.b1.group.position.set(-1.6 + 0.5 * Math.sin(tilt), 0.07 + 0.2 * Math.sin(tilt), 0);
        if (tilt > 0.3 && pour > 0 && pour < 1) { s.b1.group.updateMatrixWorld(true); const lip = s.b1.group.localToWorld(V3(s.b1r, s.b1h, 0)), tgt = V3(1.4 - s.b1r * 0.3, 1.1, 0), d = tgt.clone().sub(lip), L = d.length(); s.stream.visible = true; s.stream.position.copy(lip).addScaledVector(d, 0.5); s.stream.scale.set(1, L, 1); s.stream.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); }
      } else if (m === "magnet") {
        const mx = -1.3 + 4.4 * clamp(p / 0.9, 0, 1); s.mag.position.x = mx; s.mag.position.y = 1.05 + 0.1 * Math.sin(S.t * 2) * 0;
        s.fe.forEach((f) => { const u = f.userData; if (p < 0.01) { u.att = null; f.position.copy(u.home); f.rotation.x = 0; } else if (!u.att && Math.abs(f.position.x - mx) < 0.7) { u.att = V3((rnd() - 0.5) * 0.5, -0.17 - rnd() * 0.12, (rnd() - 0.5) * 1.6); } if (u.att) { const tgt = V3(mx + u.att.x, s.mag.position.y + u.att.y, u.att.z); f.position.lerp(tgt, clamp(dt * 7, 0, 1)); } });
      } else if (m === "sublim") {
        s.nh.forEach((b) => { const u = b.userData, f = sm(clamp((p - u.t) / 0.22, 0, 1)); b.position.lerpVectors(u.s, u.e, f); b.position.y += 0.35 * Math.sin(f * Math.PI) * (1 - f) * 0 ; b.scale.setScalar(1 - 0.25 * f); });
      } else if (m === "funnel") {
        const d = clamp(p / 0.8, 0, 1), hw = 0.9 * (1 - d), hoil = 0.8; if (s.lw) { s.sf.remove(s.lw); s.lw.geometry.dispose(); } if (s.lo) { s.sf.remove(s.lo); s.lo.geometry.dispose(); }
        const mkL = (y0, y1, col, op) => { const g = new T.CylinderGeometry(s.RF(y1), s.RF(y0), Math.max(y1 - y0, 0.001), 32); const mm = new T.Mesh(g, new T.MeshStandardMaterial({ color: col, transparent: true, opacity: op, roughness: 0.15 })); mm.position.y = (y0 + y1) / 2; s.sf.add(mm); return mm; };
        const yb = 0.5; if (hw > 0.005) s.lw = mkL(yb, yb + hw, 0x7fb6e6, 0.55); else s.lw = null; s.lo = mkL(yb + hw, yb + hw + hoil, 0xe3c850, 0.6);
        s.rl.setVolume(0.1 + d * 70); s.rl.update(S.t); const on = d > 0.001 && d < 0.999; s.sfs.visible = on; if (on) { const y0 = s.sf.position.y, y1 = 0.8 + 0.6 * d; s.sfs.scale.set(1, y0 - y1, 1); s.sfs.position.set(0.4, (y0 + y1) / 2, 0); }
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = METH[c.m], px = w - 250, p = c.prog / 100; ctx.save(); ctx.textAlign = "left";
      H.pill(ctx, 10, 22, m.n + ": " + m.mix, "#ffe9b8", 9.6); H.pill(ctx, 10, 44, "progress " + c.prog.toFixed(0) + " %", "#ffd27a", 9.5);
      if (p >= 0.99) H.pill(ctx, 10, 66, m.res, "#8dffb8", 8.6);
      if (c.m === "filt") { pillAt(ctx, S, 0, s.flTop + 2.35, 0, "funnel + filter paper", "#cfe0f5"); pillAt(ctx, S, 0, 0.0, 0, "filtrate (water)", "#9fc4ff"); pillAt(ctx, S, 1.5, s.flTop + 1.3, 0, "residue: sand", "#e8c88a"); }
      else if (c.m === "evap") { pillAt(ctx, S, 0, s.dishY + 1.85, 0, p < 0.65 ? "salt solution" : "salt crystals", "#cfe0f5"); pillAt(ctx, S, 0, s.dishY + 1.55, 0, "evaporating dish", "#9fb2d2"); }
      else if (c.m === "decant") { pillAt(ctx, S, -1.6, 2.7, 0, "sand + water", "#e8c88a"); pillAt(ctx, S, 1.4, 2.7, 0, "clear water", "#9fc4ff"); }
      else if (c.m === "magnet") { pillAt(ctx, S, s.mag.position.x, 1.75, 0, "magnet", "#ffb0a0"); pillAt(ctx, S, 1.0, 0.0, 1.45, "sulphur stays on the tile", "#f2e27a"); }
      else if (c.m === "sublim") { pillAt(ctx, S, -2.1, s.dishY + 1.7, 0, "cold surface", "#9fc4ff"); pillAt(ctx, S, -2.1, s.dishY + 1.3, 0, "NH₄Cl re-forms", "#ffffff"); pillAt(ctx, S, 0, s.dishY - 0.2, 0, "NaCl stays in dish", "#cfd8ea"); }
      else if (c.m === "funnel") { pillAt(ctx, S, 1.6, 3.7, 0, "oil (top layer, less dense)", "#f0dc7a"); pillAt(ctx, S, 1.6, 3.0, 0, p < 0.8 ? "water (bottom layer)" : "water drained", "#9fc4ff"); pillAt(ctx, S, 0.4, 0.0, 0, "water collected", "#9fc4ff"); if (p > 0.78 && p < 0.99) H.pill(ctx, 10, 66, "close the tap when the water has all gone, before the oil", "#ffb48a", 8.6); }
      sp(ctx, px, 58, 140, "Property used", [m.prop, m.use], 8.4); sp(ctx, px, 206, 114, "Result", [m.res, "Mixture parts keep their own properties; no chemical change."], 8.4);
      ctx.restore();
    },
    readouts(s, c) { const m = METH[c.m]; return [["Method", m.n], ["Mixture", m.mix], ["Property used", m.prop], ["Result", m.res], ["Used for", m.use]]; },
    steps(s, c) { return [["Choose the method that suits the mixture", "now"], ["Run the separation and watch each part separate", c.prog > 5 ? "done" : ""], ["Name the property that made the separation work", c.prog > 95 ? "done" : ""], ["Try every method and match it to its mixture", ""]]; },
  };

  /* =================== 2. DIFFUSION, VAPOUR PRESSURE, MELTING POINT =================== */
  const GP = { nh3hcl: { a: "NH₃", ma: 17.03, b: "HCl", mb: 36.46, ca: 0x7fb4ff, cb: 0x66e08a }, nh3hbr: { a: "NH₃", ma: 17.03, b: "HBr", mb: 80.91, ca: 0x7fb4ff, cb: 0xe0a066 }, mah: { a: "CH₃NH₂", ma: 31.06, b: "HCl", mb: 36.46, ca: 0xb59cff, cb: 0x66e08a } };
  const GK = Object.keys(GP);
  const LQ = { water: { n: "Water", A: 8.07131, B: 1730.63, C: 233.426, col: [170, 210, 240], hx: "#7fb6e6" }, ethanol: { n: "Ethanol", A: 8.20417, B: 1642.89, C: 230.3, col: [235, 235, 220], hx: "#e6c27f" }, ether: { n: "Diethyl ether", A: 6.92032, B: 1064.07, C: 228.8, col: [240, 240, 232], hx: "#c8a0ff" } };
  const LK = Object.keys(LQ);
  const Pv = (L, T_) => 0.133322 * Math.pow(10, L.A - L.B / (L.C + T_)); /* kPa, T in °C */
  const Tb = (L, P) => L.B / (L.A - Math.log10(P / 0.133322)) - L.C;
  const SAMP = { pure: { n: "Pure naphthalene", t0: 80, t1: 81.2 }, impure: { n: "Naphthalene with 5 % impurity", t0: 72, t1: 78.5 }, benzoic: { n: "Pure benzoic acid", t0: 122, t1: 123.3 } };
  const SK2 = Object.keys(SAMP);
  C3.scenes.diffusionVapour = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[2.0, 2.4, 9.4], [2.0, 1.7, 0]],
    values: { mode: "graham", pair: "nh3hcl", Tk: 300, run: 1, liq: "water", Tc: 60, Pext: 101.3, samp: "pure", heat: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Activity", options: [{ value: "graham", label: "Diffusion: Graham's law tube" }, { value: "vapour", label: "Vapour pressure and boiling" }, { value: "mp", label: "Melting point and purity" }] },
        { type: "select", key: "pair", label: "Gas pair (diffusion)", options: GK.map((k) => ({ value: k, label: GP[k].a + " and " + GP[k].b })) },
        { type: "range", key: "Tk", label: "Temperature, T (diffusion)", min: 270, max: 360, step: 5, unit: " K" },
        { type: "toggle", key: "run", label: "Run automatically (diffusion, melting point)" },
        { type: "select", key: "liq", label: "Liquid (vapour pressure)", options: LK.map((k) => ({ value: k, label: LQ[k].n })) },
        { type: "range", key: "Tc", label: "Liquid temperature, θ (vapour pressure)", min: 0, max: 120, step: 1, unit: " °C" },
        { type: "range", key: "Pext", label: "External pressure, Pₑₓₜ (vapour pressure)", min: 40, max: 200, step: 1, unit: " kPa" },
        { type: "select", key: "samp", label: "Sample (melting point)", options: SK2.map((k) => ({ value: k, label: SAMP[k].n })) },
        { type: "button", label: "Restart diffusion / heating", action: (S, s, c) => { s.t = 0; s.th = 20; } },
      ];
    },
    views: [{ label: "Front", cam: [[2.0, 2.4, 9.4], [2.0, 1.7, 0]] }, { label: "Close", cam: [[1.6, 2.1, 6.4], [1.6, 1.7, 0]] }],
    note: "Diffusion is the spreading of particles from a region of high concentration to low concentration. Graham's law: at the same temperature and pressure the rate of diffusion of a gas is inversely proportional to the square root of its molar mass, r ∝ 1/√M, so r₁/r₂ = √(M₂/M₁). In the tube, ammonia (17 g/mol) travels about 1.46 times as far as hydrogen chloride (36.5 g/mol) before the two meet and form a ring of white ammonium chloride closer to the HCl end. Vapour pressure is the pressure of the vapour in equilibrium with its liquid; it rises with temperature, and a liquid boils when its vapour pressure equals the external pressure, so the boiling point falls at lower pressure (high altitude) and rises at higher pressure (pressure cooker). Pure solids melt sharply at a fixed temperature; impurities lower the melting point and widen the range, which is used as a purity test. Particle motion here is a schematic model; vapour pressures use the Antoine equation.",
    onChange(S, s, c, key) { if (key === "pair" || key === "Tk" || key === "mode") s.t = 0; if (key === "mode") { s.th = 20; C3.setView(S, { cam: [[2.0, 2.4, 9.4], [2.0, 1.7, 0]] }); } if (key === "samp") s.th = 20; },
    reset(S, s, c) { Object.assign(c, { mode: "graham", pair: "nh3hcl", Tk: 300, run: 1, liq: "water", Tc: 60, Pext: 101.3, samp: "pure", heat: 1 }); s.t = 0; s.th = 20; },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Gas</th><th style="text-align:left">Molar mass (g/mol)</th><th style="text-align:left">Relative rate of diffusion</th></tr><tr><td style="text-align:left">H₂</td><td style="text-align:left">2.0</td><td style="text-align:left">3.8</td></tr><tr><td style="text-align:left">NH₃</td><td style="text-align:left">17.0</td><td style="text-align:left">1.31</td></tr><tr><td style="text-align:left">N₂</td><td style="text-align:left">28.0</td><td style="text-align:left">1.0 (reference)</td></tr><tr><td style="text-align:left">HCl</td><td style="text-align:left">36.5</td><td style="text-align:left">0.88</td></tr><tr><td style="text-align:left">CO₂</td><td style="text-align:left">44.0</td><td style="text-align:left">0.80</td></tr></table>'; },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(13, 0.1, 5, M.matte(0xb99a74, 0.6), 2.0, -0.05, 0); s.t = 0; s.th = 20;
      s.gr = new T.Group(); S.scene.add(s.gr); const L = 4.2; s.L = L; const tube = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, L, 28, 1, true), new T.MeshPhysicalMaterial({ color: 0xbcd8ec, transparent: true, opacity: 0.42, roughness: 0.05, side: T.DoubleSide, depthWrite: false })); tube.rotation.z = Math.PI / 2; tube.position.set(0, 1.5, 0); s.gr.add(tube);
      const pl = (x, col) => { const m = new T.Mesh(new T.SphereGeometry(0.3, 14, 10), new T.MeshStandardMaterial({ color: col, roughness: 0.9 })); m.scale.set(0.8, 1, 1); m.position.set(x, 1.5, 0); s.gr.add(m); return m; }; s.pa = pl(-L / 2 - 0.15, 0x7fb4ff); s.pb = pl(L / 2 + 0.15, 0x66e08a);
      [-1, 1].forEach((sg) => { const st = new T.Mesh(new T.BoxGeometry(0.1, 1.1, 0.5), M.steel()); st.position.set(sg * 1.5, 0.55, 0); s.gr.add(st); });
      s.pa_ = []; s.pb_ = []; for (let i = 0; i < 46; i++) { [["pa_", 0x7fb4ff], ["pb_", 0x66e08a]].forEach(([k, col]) => { const b = ball(0.085, col); b.userData = { u: Math.pow(rnd(), 0.8), y: (rnd() - 0.5) * 0.4, z: (rnd() - 0.5) * 0.4, ph: rnd() * 6.28 }; s.gr.add(b); s[k].push(b); }); }
      s.ring = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.35, 28, 1, true), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, roughness: 0.6, side: T.DoubleSide, emissive: 0x555555 })); s.ring.rotation.z = Math.PI / 2; s.ring.position.y = 1.5; s.gr.add(s.ring);
      s.vb = K.beaker(); s.vb.group.position.set(1.8, 0.07, 0); s.vl = s.vb.addLiquid({ color: [170, 210, 240], opacity: 0.35 }); s.vl.setVolume(150); s.vbub = K.bubbles(s.vb, s.vl, { n: 60, x: 0, z: 0, baseY: 0.4, spread: 0.7 });
      const vb_ = new T.Box3().setFromObject(s.vb.group); s.vtop = vb_.max.y; s.vr = (vb_.max.x - vb_.min.x) / 2 - 0.1; s.vp = []; for (let i = 0; i < 70; i++) { const b = ball(0.05, 0xdfe9f5); b.userData = { x: (rnd() - 0.5) * 2, y: rnd(), z: (rnd() - 0.5) * 2, ph: rnd() * 6.28, t: i / 70 }; S.scene.add(b); s.vp.push(b); }
      s.cap = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 2.6, 14, 1, true), glass(0.45)); s.cap.position.set(1.8, 1.7, 0); S.scene.add(s.cap); s.csol = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 1, 14), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })); s.csol.position.set(1.8, 1.0, 0); S.scene.add(s.csol); s.cmelt = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 1, 14), new T.MeshStandardMaterial({ color: 0xdfe6ee, transparent: true, opacity: 0.45, roughness: 0.1 })); s.cmelt.position.set(1.8, 1.0, 0); S.scene.add(s.cmelt);
      s.bulb = new T.Mesh(new T.SphereGeometry(0.16, 16, 12), new T.MeshStandardMaterial({ color: 0xd04040, roughness: 0.3 })); s.bulb.position.set(1.8 + 0.34, 0.5, 0); S.scene.add(s.bulb); s.therm = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.7, 10), glass(0.5)); s.therm.position.set(1.8 + 0.34, 1.85, 0); S.scene.add(s.therm); s.mer = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 10), new T.MeshStandardMaterial({ color: 0xd04040 })); S.scene.add(s.mer);
    },
    update(S, s, c, dt) {
      const gm = c.mode === "graham", vp = c.mode === "vapour", mp = c.mode === "mp"; s.gr.visible = gm; s.vb.group.visible = vp; s.vp.forEach((b) => (b.visible = vp)); [s.cap, s.csol, s.cmelt, s.bulb, s.therm, s.mer].forEach((o) => (o.visible = mp));
      if (gm) {
        const g = GP[c.pair], L = s.L, rA = Math.sqrt(g.mb / g.ma), dA = L * rA / (1 + rA), dB = L - dA, k = Math.sqrt(c.Tk / 300), tm = 12 / k; if (c.run) s.t += dt; const fa = clamp(s.t / tm, 0, 1), fb = clamp(s.t / (tm * rA), 0, 1); s.dA = dA; s.dB = dB; s.fa = fa; s.fb = fb; s.ring.position.x = -L / 2 + dA; const rf = clamp((Math.min(fa, fb) >= 0.999 ? (s.t - tm * rA) / 4 : 0), 0, 1); s.ring.material.opacity = 0.75 * rf; s.ring.scale.set(1, 0.5 + rf, 1); s.meet = fa >= 0.999 && fb >= 0.999;
        s.pa.material.color.setHex(g.ca); s.pb.material.color.setHex(g.cb);
        s.pa_.forEach((b) => { const u = b.userData, x0 = -L / 2, x1 = x0 + dA * fa; b.position.set(x0 + (x1 - x0) * u.u + 0.05 * Math.sin(S.t * 5 + u.ph), 1.5 + u.y * 0.9 + 0.03 * Math.cos(S.t * 4 + u.ph), u.z * 0.9); b.material.color.setHex(g.ca); }); s.pb_.forEach((b) => { const u = b.userData, x0 = L / 2, x1 = x0 - dB * fb; b.position.set(x0 + (x1 - x0) * u.u + 0.05 * Math.sin(S.t * 5 + u.ph), 1.5 + u.y * 0.9 + 0.03 * Math.cos(S.t * 4 + u.ph), u.z * 0.9); b.material.color.setHex(g.cb); });
      } else if (vp) {
        const L_ = LQ[c.liq], Pvk = Pv(L_, c.Tc), tb = Tb(L_, c.Pext), boil = Pvk >= c.Pext - 1e-6; s.Pvk = Pvk; s.tb = tb; s.boil = boil; s.vl.setColor(L_.col, 0.35); s.vl.setVolume(150); s.vl.update(S.t); s.vbub.rate = boil ? 1.4 : (Pvk > c.Pext * 0.6 ? 0.1 : 0); s.vbub.update(dt, S.t);
        const n = Math.floor(clamp(Pvk / Math.max(c.Pext, 1), 0, 1.5) * 46); const lv = (s.vl.level > 0 && s.vl.level < s.vtop) ? s.vl.level : s.vtop * 0.5; s.vp.forEach((b, i) => { const u = b.userData; b.visible = i < n + 3; const y = lv + 0.12 + ((u.y * 0.6 + 0.1 * Math.sin(S.t * 2 + u.ph) + S.t * 0.0) % 1) * Math.max(0.2, s.vtop - lv - 0.2); b.position.set(1.8 + clamp(u.x + 0.15 * Math.sin(S.t * 3 + u.ph), -1, 1) * s.vr * 0.9, y + 0.1 * Math.sin(S.t * 5 + u.ph), clamp(u.z + 0.15 * Math.cos(S.t * 3.3 + u.ph), -1, 1) * s.vr * 0.9); });
      } else {
        const sa = SAMP[c.samp]; if (c.run) s.th = Math.min(sa.t1 + 8, s.th + dt * (c.samp === "benzoic" ? 10 : 6)); const f = clamp(1 - (s.th - sa.t0) / (sa.t1 - sa.t0), 0, 1); s.f = f;
        s.csol.scale.y = Math.max(0.001, 1.0 * f); s.csol.position.y = 0.55 + 0.5 * s.csol.scale.y; s.csol.visible = f > 0.002; s.cmelt.scale.y = Math.max(0.001, 1.0 * (1 - f)); s.cmelt.position.y = 0.55 + 1.0 * f + 0.5 * s.cmelt.scale.y; s.cmelt.visible = f < 0.998;
        const hgt = clamp((s.th - 20) / 130, 0, 1) * 2.4 + 0.05; s.mer.scale.set(1, hgt, 1); s.mer.position.set(1.8 + 0.34, 0.5 + hgt / 2, 0);
      }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      if (c.mode === "graham") {
        const g = GP[c.pair], rA = Math.sqrt(g.mb / g.ma), cm = (v) => (v * 3).toFixed(1); H.pill(ctx, 10, 22, g.a + " (" + g.ma.toFixed(1) + ") and " + g.b + " (" + g.mb.toFixed(1) + " g/mol)  ·  T = " + c.Tk + " K", "#ffe9b8", 9.4);
        H.pill(ctx, 10, 44, "r ∝ 1/√M   →   rate " + g.a + " / rate " + g.b + " = √(" + g.mb.toFixed(1) + "/" + g.ma.toFixed(1) + ") = " + rA.toFixed(2), "#9fe3ff", 9.2);
        H.pill(ctx, 10, 66, s.meet ? "ring of NH₄Cl-type solid forms " + (s.dA / s.L * 100).toFixed(0) + " % of the way from the " + g.a + " end" : "gases are spreading along the tube ...", s.meet ? "#8dffb8" : "#ffd27a", 8.8);
        pillAt(ctx, S, -1.9, 2.3, 0, "cotton wool + " + g.a, "#9fc4ff"); pillAt(ctx, S, 1.9, 2.3, 0, "cotton wool + " + g.b, "#a6f0b4"); if (s.meet) pillAt(ctx, S, s.ring.position.x, 2.2, 0, "white ring", "#ffffff");
        sp(ctx, px, 58, 128, "Distances travelled", ["d(" + g.a + ") = " + (s.dA * 6).toFixed(1) + " cm (lighter, faster)", "d(" + g.b + ") = " + (s.dB * 6).toFixed(1) + " cm (heavier, slower)", "d ratio = " + (s.dA / s.dB).toFixed(2) + "  =  √(M₂/M₁) = " + rA.toFixed(2)], 8.6);
        sp(ctx, px, 194, 126, "Graham's law", ["rate₁ / rate₂ = √(M₂ / M₁)", "Heavier gases diffuse more slowly.", "Raising T speeds both gases (∝ √T) but does not move the ring."], 8.4);
      } else if (c.mode === "vapour") {
        const L_ = LQ[c.liq], tb = s.tb, Pvk = s.Pvk; H.pill(ctx, 10, 22, L_.n + " at " + c.Tc + " °C   ·   Pₑₓₜ = " + c.Pext.toFixed(0) + " kPa", "#ffe9b8", 9.4); H.pill(ctx, 10, 44, "vapour pressure P = " + Pvk.toFixed(1) + " kPa   boiling point at Pₑₓₜ: " + tb.toFixed(1) + " °C", "#9fe3ff", 9.2); H.pill(ctx, 10, 66, s.boil ? "BOILING: P ≥ Pₑₓₜ, bubbles form throughout the liquid" : "not boiling: P < Pₑₓₜ, only evaporation at the surface", s.boil ? "#8dffb8" : "#ffd27a", 8.8);
        H.panel(ctx, px, 58, 240, 250); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Vapour pressure curves (kPa)", px + 8, 73);
        const series = LK.map((k) => { const pts = []; for (let t = 0; t <= 120; t += 4) pts.push([t, Math.min(Pv(LQ[k], t), 300)]); return { pts, color: LQ[k].hx, width: k === c.liq ? 2.6 : 1.4 }; }); series.push({ pts: [[0, c.Pext], [120, c.Pext]], color: "#ffffff", width: 1 });
        H.graph(ctx, px + 8, 82, 224, 170, { series, xmin: 0, xmax: 120, ymin: 0, ymax: 300, ticksX: 4, ticksY: 3, xl: "θ (°C)", yl: "P (kPa)", dot: [c.Tc, Math.min(Pvk, 300), "#ffffff"] });
        ctx.font = "8px " + FONT; ctx.fillStyle = "#e8f0ff"; ctx.fillText("white line: external pressure", px + 10, 272); LK.forEach((k, i) => { ctx.fillStyle = LQ[k].hx; ctx.fillText("— " + LQ[k].n, px + 10 + i * 78, 290); });
      } else {
        const sa = SAMP[c.samp]; H.pill(ctx, 10, 22, sa.n + ": bath at " + s.th.toFixed(1) + " °C", "#ffe9b8", 10); H.pill(ctx, 10, 44, s.f > 0.99 ? "solid" : s.f < 0.01 ? "fully melted" : "melting: " + ((1 - s.f) * 100).toFixed(0) + " % liquid", "#9fe3ff", 9.5); H.pill(ctx, 10, 66, "melting range " + sa.t0 + " – " + sa.t1 + " °C (" + (sa.t1 - sa.t0).toFixed(1) + " °C wide)", c.samp === "impure" ? "#ffb48a" : "#8dffb8", 8.8);
        pillAt(ctx, S, 1.8, 3.2, 0, "capillary tube with sample", "#cfe0f5"); pillAt(ctx, S, 2.7, 3.6, 0, "thermometer", "#ffb0a0");
        sp(ctx, px, 58, 110, "Purity test", ["Pure solid: sharp melting point (range under 2 °C).", "Impure solid: lower melting point and a wide range."], 8.4);
        H.panel(ctx, px, 176, 240, 144); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Solid remaining vs temperature", px + 8, 191);
        const mk = (ss) => { const pts = []; for (let t = ss.t0 - 10; t <= ss.t1 + 8; t += 0.5) pts.push([t, clamp(1 - (t - ss.t0) / (ss.t1 - ss.t0), 0, 1) * 100]); return pts; };
        H.graph(ctx, px + 8, 198, 224, 98, { series: [{ pts: mk(sa), color: "#ffd27a", width: 2.4 }], xmin: sa.t0 - 10, xmax: sa.t1 + 8, ymin: 0, ymax: 100, ticksX: 3, ticksY: 2, xl: "θ (°C)", yl: "solid %", dot: [clamp(s.th, sa.t0 - 10, sa.t1 + 8), s.f * 100, "#ffffff"] });
      }
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "graham") { const g = GP[c.pair], rA = Math.sqrt(g.mb / g.ma); return [["Gases", g.a + " (M = " + g.ma.toFixed(1) + ") and " + g.b + " (M = " + g.mb.toFixed(1) + ")"], ["Graham's law", "r₁/r₂ = √(M₂/M₁) = " + rA.toFixed(2)], ["Distance ratio d(" + g.a + ")/d(" + g.b + ")", (s.dA / s.dB || rA).toFixed(2)], ["Temperature", c.Tk + " K (speeds ∝ √T)"]]; }
      if (c.mode === "vapour") { const L_ = LQ[c.liq]; return [["Liquid", L_.n], ["Vapour pressure at " + c.Tc + " °C", (s.Pvk || Pv(L_, c.Tc)).toFixed(1) + " kPa"], ["External pressure", c.Pext.toFixed(0) + " kPa"], ["Boiling point at this pressure", (s.tb || Tb(L_, c.Pext)).toFixed(1) + " °C"], ["State", s.boil ? "boiling" : "evaporating only"]]; }
      const sa = SAMP[c.samp]; return [["Sample", sa.n], ["Melting range", sa.t0 + " – " + sa.t1 + " °C"], ["Bath temperature", (s.th || 20).toFixed(1) + " °C"], ["Purity", c.samp === "impure" ? "impure: low and wide range" : "pure: sharp melting point"]];
    },
    steps(s, c) { return [["Compare how fast two gases diffuse (Graham's law)", c.mode === "graham" ? "now" : "done"], ["Raise the temperature until the liquid boils", c.mode === "vapour" ? "now" : ""], ["Lower the external pressure and watch the boiling point fall", c.Pext < 90 ? "done" : ""], ["Compare pure and impure melting points", c.mode === "mp" ? "now" : ""]]; },
  };
})();
