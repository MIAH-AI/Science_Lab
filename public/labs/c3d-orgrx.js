/* c3d-orgrx.js — chemistry 3D, new module: reactions of organic compounds (bromine test, esterification, fermentation) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const BR = { hexane: { n: "Hexane (alkane)", f: "C₆H₁₄", rate: 0, note: "saturated: no C=C to add to, so no reaction in the dark (only slow substitution in sunlight)", eq: "no reaction (dark)" }, hexene: { n: "Hex-1-ene (alkene)", f: "C₆H₁₂", rate: 1, note: "addition across the C=C double bond: the orange colour disappears at once", eq: "C₆H₁₂ + Br₂ → C₆H₁₂Br₂ (1,2-dibromohexane, colourless)" }, hexyne: { n: "Hex-1-yne (alkyne)", f: "C₆H₁₀", rate: 0.55, note: "adds bromine across the C≡C triple bond: decolourises, a little more slowly", eq: "C₆H₁₀ + 2Br₂ → C₆H₁₀Br₄" }, benzene: { n: "Benzene (arene)", f: "C₆H₆", rate: 0, note: "delocalised ring is stable: does NOT decolourise bromine water (needs Br₂ and an FeBr₃ catalyst)", eq: "no reaction with bromine water" }, ethanol: { n: "Ethanol (alkanol)", f: "C₂H₅OH", rate: 0, note: "no C=C: bromine water stays orange (it mixes completely with ethanol)", eq: "no reaction" } };
  const ALC = [["methanol", "methyl", "CH₃OH"], ["ethanol", "ethyl", "C₂H₅OH"], ["propan-1-ol", "propyl", "C₃H₇OH"], ["butan-1-ol", "butyl", "C₄H₉OH"]];
  const ACD = [["methanoic acid", "methanoate", "HCOOH"], ["ethanoic acid", "ethanoate", "CH₃COOH"], ["propanoic acid", "propanoate", "C₂H₅COOH"], ["butanoic acid", "butanoate", "C₃H₇COOH"]];
  const SMELL = { "1-1": "ethyl methanoate smell" };
  const SM = { "ethyl ethanoate": "nail-polish remover / pear drops", "methyl ethanoate": "sweet, glue-like", "propyl ethanoate": "pears", "butyl ethanoate": "banana", "ethyl methanoate": "raspberry / rum", "methyl methanoate": "sharp, ether-like", "ethyl butanoate": "pineapple", "methyl butanoate": "apple / pineapple", "butyl butanoate": "pineapple", "propyl butanoate": "apricot", "ethyl propanoate": "pineapple / rum", "methyl propanoate": "fruity, rum-like" };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const ferRate = (T0) => (T0 < 5 ? 0.02 : T0 <= 38 ? Math.exp(-(((T0 - 38) / 14) ** 2)) : T0 <= 55 ? Math.exp(-(((T0 - 38) / 8) ** 2)) * (1 - (T0 - 38) / 17) : 0);
  const esterConv = (ac) => 2 / 3;

  C3.scenes.organicReactions = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[1.7, 2.8, 9.6], [2.0, 2.2, 0]],
    values: { mode: "br", sub: "hexene", alc: 1, acd: 1, cat: 1, T: 35, air: 0 },
    state: () => ({ t: 0, br: 0, brAdded: 0, shake: 0, p: 0, run: false, poured: 0, hr: 0, co2: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Reaction", options: [{ value: "br", label: "Bromine water test for unsaturation" }, { value: "est", label: "Esterification (alkanol + alkanoic acid)" }, { value: "fer", label: "Fermentation of glucose by yeast" }] },
        { type: "select", key: "sub", label: "Compound tested", options: Object.keys(BR).map((k) => ({ value: k, label: BR[k].n })) },
        { type: "button", label: "Add bromine water and shake", action: (S, s) => { s.br = 0; s.brAdded += 1; s.shake = 1; s.t = 0; } },
        { type: "select", key: "alc", label: "Alkanol", options: ALC.map((a, i) => ({ value: i, label: a[0] + " (" + a[2] + ")" })) },
        { type: "select", key: "acd", label: "Alkanoic acid", options: ACD.map((a, i) => ({ value: i, label: a[0] + " (" + a[2] + ")" })) },
        { type: "toggle", key: "cat", label: "Add concentrated H₂SO₄ catalyst" },
        { type: "button", label: "Heat under reflux / start", action: (S, s) => { s.run = true; } },
        { type: "button", label: "Pour into cold water and smell", action: (S, s) => { s.poured = 1; } },
        { type: "range", key: "T", label: "Temperature of the yeast mixture (°C)", min: 5, max: 70, step: 1, unit: " °C" },
        { type: "toggle", key: "air", label: "Leave the flask open to air (oxygen present)" },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s) => { Object.assign(s, { t: 0, br: 0, brAdded: 0, shake: 0, p: 0, run: false, poured: 0, hr: 0, co2: 0 }); } },
      ];
    },
    views: [{ label: "Bench", cam: [[1.7, 2.8, 9.6], [2.0, 2.2, 0]] }, { label: "Test tube", cam: [[1.4, 1.9, 5.4], [2.4, 1.2, 0]] }],
    note: "Bromine water (orange) tests for unsaturation: alkenes and alkynes add Br₂ across the multiple bond and decolourise it; alkanes, benzene and ethanol do not. Esterification: an alkanol and an alkanoic acid reach equilibrium with an ester and water (alkyl alkanoate), catalysed by concentrated H₂SO₄; esters smell fruity. Fermentation: yeast enzymes turn glucose into ethanol and CO₂ without oxygen (C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂); the CO₂ turns limewater milky. Yeast works best near 35–40 °C: too cold is slow, too hot denatures the enzymes; with oxygen it respires to CO₂ and water instead.",
    onChange(S, s, c, key) { Object.assign(s, { t: 0, br: 0, brAdded: 0, shake: 0, p: 0, run: false, poured: 0, hr: 0, co2: 0 }); },
    reset(S, s, c) { Object.assign(c, { mode: "br", sub: "hexene", alc: 1, acd: 1, cat: 1, T: 35, air: 0 }); Object.assign(s, { t: 0, br: 0, brAdded: 0, shake: 0, p: 0, run: false, poured: 0, hr: 0, co2: 0 }); },
    table(s, c) {
      if (c.mode === "br") return '<table class="c3-table"><tr><th style="text-align:left">Compound</th><th>bromine water</th><th style="text-align:left">Reason</th></tr>' + Object.keys(BR).map((k) => '<tr class="' + (k === c.sub ? "ok" : "") + '"><td style="text-align:left">' + BR[k].n + "</td><td>" + (BR[k].rate > 0 ? "decolourised" : "stays orange") + '</td><td style="text-align:left">' + BR[k].note + "</td></tr>").join("") + "</table>";
      if (c.mode === "est") return '<table class="c3-table"><tr><th style="text-align:left">Ester</th><th style="text-align:left">Made from</th><th style="text-align:left">Smell</th></tr>' + Object.keys(SM).map((k) => { const p = k.split(" "), al = ALC.find((a) => a[1] === p[0]), ac = ACD.find((a) => a[1] === p[1]); const sel = ALC[c.alc][1] + " " + ACD[c.acd][1] === k; return '<tr class="' + (sel ? "ok" : "") + '"><td style="text-align:left">' + k + '</td><td style="text-align:left">' + (al ? al[0] : "") + " + " + (ac ? ac[0] : "") + '</td><td style="text-align:left">' + SM[k] + "</td></tr>"; }).join("") + "</table>";
      return '<table class="c3-table"><tr><th>Temperature</th><th>relative rate</th><th style="text-align:left">Why</th></tr>' + [[10, "slow: little kinetic energy"], [25, "moderate"], [37, "optimum: enzymes work best"], [50, "enzymes denaturing"], [65, "stopped: enzymes denatured (permanent)"]].map((r) => "<tr><td>" + r[0] + " °C</td><td>" + ferRate(r[0]).toFixed(2) + '</td><td style="text-align:left">' + r[1] + "</td></tr>").join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.m4 = new T.Matrix4(); S.mk.box(10, 0.1, 3, M.matte(0x2a2e36, 0.7), 1.6, -0.05, 0);
      /* flask on hot plate with reflux column */
      s.hb = S.mk.box(1.9, 0.16, 1.9, M.matte(0x2a2c30, 0.5), -1.4, 0.08, 0); s.hot = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.02, 32), new T.MeshBasicMaterial({ color: 0x401010 })); s.hot.position.set(-1.4, 0.17, 0); S.scene.add(s.hot);
      s.fk = K.vessel("flask"); s.fk.group.position.set(-1.4, 0.18, 0); s.liq = s.fk.addLiquid({ color: [236, 240, 246], opacity: 0.5 }); s.liq.setVolume(100); s.bub = K.bubbles(s.fk, s.liq, { n: 60, x: 0, z: 0, baseY: 1.2, spread: 2.0 });
      s.layer = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.1, 36), new T.MeshStandardMaterial({ color: 0xf3d85a, roughness: 0.2, transparent: true, opacity: 0.95 })); s.fk.group.add(s.layer);
      s.col = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 2.4, 20, 1, true), new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.4, side: T.DoubleSide, roughness: 0.1, depthWrite: false })); s.col.position.set(-1.4, 3.3, 0); S.scene.add(s.col); s.colin = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.3, 12), new T.MeshStandardMaterial({ color: 0x9fd2ff, transparent: true, opacity: 0.35 })); s.colin.position.copy(s.col.position); S.scene.add(s.colin);
      s.stand = S.mk.rod(V3(-2.4, 0, -0.5), V3(-2.4, 4.6, -0.5), 0.04, M.steel()); s.bar = S.mk.rod(V3(-2.4, 3.3, -0.5), V3(-1.45, 3.3, -0.05), 0.03, M.steel());
      /* bung + delivery to limewater (fermentation) */
      s.bung = S.mk.cyl(0.25, 0.3, 0.3, M.rubber(), -1.4, 2.4, 0); s.seg = []; const gl = new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.75, roughness: 0.1 }); [[-1.4, 2.5, -1.4, 3.1], [-1.4, 3.1, 2.4, 3.1], [2.4, 3.1, 2.4, 0.9]].forEach((p) => { s.seg.push(S.mk.rod(V3(p[0], p[1], 0), V3(p[2], p[3], 0), 0.05, gl)); });
      /* test tubes: bromine test tube (x=3.4) and limewater (x=2.4) */
      s.tt = K.vessel("testtube"); s.tt.group.position.set(1.3, 0, 0); s.tl = s.tt.addLiquid({ color: [226, 238, 246], opacity: 0.4 }); s.tl.setVolume(6); s.org = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.3, 16), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })); s.tt.group.add(s.org);
      s.lw = K.vessel("testtube"); s.lw.group.position.set(2.4, 0, 0); s.lq = s.lw.addLiquid({ color: [228, 242, 250], opacity: 0.3 }); s.lq.setVolume(6); s.lppt = K.precipitate(s.lw, s.lq, { n: 600, size: 0.09, color: 0xf6f6f2 }); s.lb = K.bubbles(s.lw, s.lq, { n: 30, x: 0, z: 0, baseY: 0.6, spread: 0.2 });
      s.rack = S.mk.rbox(1.7, 0.2, 1.0, 0.05, M.matte(0x7a5330, 0.55), 1.3, 0.1, 0); s.dr = new T.Group(); const pg = new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 0.8, 14), M.matte(0xd8eaf5, 0.08)); pg.position.y = 0.4; s.dr.add(pg); const pb = new T.Mesh(new T.SphereGeometry(0.12, 18, 12), M.rubber()); pb.position.y = 0.95; pb.scale.y = 1.3; s.dr.add(pb); s.dr.position.set(1.3, 3.2, 0); S.scene.add(s.dr); s.drops = K.drops({ color: 0xf08a1a });
      s.sm = new T.InstancedMesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.4 }), 40); s.sm.frustumCulled = false; S.scene.add(s.sm); s.smd = []; for (let i = 0; i < 40; i++) s.smd.push({ u: Math.random(), x: (Math.random() - 0.5) * 0.8 });
    },
    update(S, s, c, dt) {
      const br = c.mode === "br", est = c.mode === "est", fer = c.mode === "fer";
      [s.tt.group, s.dr, s.rack].forEach((o) => { o.visible = br; }); [s.fk.group, s.hot, s.bung, s.hb].forEach((o) => { o.visible = !br; }); [s.col, s.colin, s.stand, s.bar, s.layer].forEach((o) => { o.visible = est; }); s.seg.forEach((o) => { o.visible = fer; }); s.lw.group.visible = fer; s.sm.visible = est;
      const BRC = [240, 140, 30];
      if (br) {
        const d = BR[c.sub]; if (dt > 0) { s.t += dt; if (s.shake > 0) s.shake -= dt; } const rate = d.rate, dec = rate > 0 ? clamp(s.t * rate * 0.5, 0, 1) : 0, n = clamp(s.brAdded, 0, 6); s.dec = dec;
        s.tl.setColor(mixc([226, 238, 246], BRC, clamp(n / 3, 0, 1) * (1 - dec)), 0.55); s.tl.setVolume(4 + n); s.tl.update(S.t); s.dr.position.y = s.shake > 0.6 ? 3.0 : 3.2; s.dr.visible = true;
        if (dt > 0 && s.shake > 0.7) s.drops.emit(1.3, 3.0, 0, 0.14 + s.tl.level * CM, 0.03); s.drops.update(dt); s.tt.group.rotation.z = s.shake > 0 ? 0.05 * Math.sin(S.t * 30) : 0; s.tt.group.position.y = 0;
      } else if (est) {
        const hot = s.run ? 1 : 0, rt = (c.cat ? 0.09 : 0.012) * (hot ? 1 : 0), conv = esterConv(); if (s.run && dt > 0) s.p = Math.min(conv, s.p + (conv - s.p) * rt * dt * 1.0 + 0.0005 * dt * (c.cat ? 3 : 0.3)); s.hot.material.color.setRGB(0.25 + 0.75 * hot, 0.06 + 0.14 * hot, 0.06);
        const frac = s.p / conv; s.liq.setColor(mixc([236, 240, 246], [244, 238, 200], frac * 0.6), 0.5); s.liq.setVolume(100 - 0 * frac); s.liq.update(S.t); s.bub.rate = hot ? 20 : 0; s.bub.update(dt, S.t);
        s.layer.visible = s.poured > 0 && s.p > 0.02; s.layer.position.y = s.liq.level * CM + 0.02; s.layer.scale.set(1, clamp(s.p * 5, 0.8, 3), 1);
        s.sm.visible = s.poured > 0 && s.p > 0.02; s.smd.forEach((q, i) => { q.u = (q.u + dt * 0.3) % 1; if (!s.sm.visible) s.m4.makeScale(0, 0, 0); else s.m4.makeTranslation(-1.4 + q.x * (0.6 + q.u * 1.6), 1.6 + q.u * 2.4, 0.2 * Math.sin(i)); s.sm.setMatrixAt(i, s.m4); }); s.sm.instanceMatrix.needsUpdate = true;
      } else {
        const r = ferRate(c.T), aer = c.air, eth = aer ? 0 : 1; if (dt > 0) { s.hr = Math.min(48, s.hr + dt * 1.5); } const t = s.hr, ethp = eth * 12 * (1 - Math.exp(-0.09 * r * t)), co2 = (aer ? 2.2 : 1) * r * t; s.eth = Math.min(ethp, 12); s.co2c = co2; s.r = r;
        s.liq.setColor(mixc([232, 214, 150], [226, 200, 120], clamp(t / 30, 0, 1)), 0.55); s.liq.setVolume(100); s.liq.update(S.t); s.hot.material.color.setRGB(0.2 + 0.5 * (c.T > 30 ? 1 : 0.2) * 0, 0.06, 0.06);
        s.bub.rate = clamp(r * 55 * (aer ? 1.2 : 1), 0, 60) * (t < 47 ? 1 : 0.2); s.bub.update(dt, S.t); s.lb.rate = !aer ? s.bub.rate * 0.4 : 0; s.lb.update(dt, S.t);
        s.lppt.amount = clamp((!aer ? co2 : 0) / 18, 0, 1); s.lq.setColor(s.lppt.amount > 0.1 ? [236, 238, 238] : [228, 242, 250], 0.3 + 0.45 * s.lppt.amount); s.lq.update(S.t); s.lppt.update(dt);
      }
      s.liq.setVisible(!br);
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); const px = w - 250; ctx.textAlign = "left";
      if (c.mode === "br") {
        const d = BR[c.sub]; H.pill(ctx, 10, 22, d.n + " + bromine water", "#ffe9b8", 11); H.pill(ctx, 10, 44, s.brAdded === 0 ? "add bromine water to the tube" : d.rate > 0 ? (s.dec > 0.9 ? "colourless: unsaturated (C=C / C≡C present)" : "orange colour fading…") : "stays orange: no C=C bond", s.brAdded > 0 && d.rate > 0 && s.dec > 0.9 ? "#8dffb8" : "#9fe3ff", 10);
        H.panel(ctx, px, 58, 240, 120); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText(d.f + " + Br₂(aq)", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; let y = wrapT(ctx, d.eq, px + 8, 89, 224, 11); ctx.fillStyle = "#9fb2d2"; wrapT(ctx, d.note, px + 8, y + 16, 224, 11);
        H.panel(ctx, px, 184, 240, 100); ctx.fillStyle = "#e8f0ff"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText("Result", px + 8, 200); ctx.fillStyle = d.rate > 0 ? "#7dffbd" : "#ffd27a"; ctx.fillText(d.rate > 0 ? "decolourised  → unsaturated" : "orange stays → saturated / aromatic", px + 8, 216); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, "Alkene and alkyne tests use the same reagent; alkenes react fastest. Benzene is unsaturated on paper but does not react because its π electrons are delocalised.", px + 8, 232, 224, 10.5);
        const q = S.proj(V3(1.3, 3.0, 0)); H.pill(ctx, q.x, q.y - 30, "dropper: bromine water", "#bcd0ea", 8.5, "center"); const q2 = S.proj(V3(1.3, 2.6, 0)); H.pill(ctx, q2.x + 18, q2.y, d.f, "#bcd0ea", 8.5, "left");
      } else if (c.mode === "est") {
        const al = ALC[c.alc], ac = ACD[c.acd], name = al[1] + " " + ac[1], pct = Math.round((s.p / esterConv()) * 67);
        H.pill(ctx, 10, 22, "Making " + name, "#ffe9b8", 11); H.pill(ctx, 10, 44, s.run ? "yield " + pct + " % (equilibrium reaches about 67 %)" : "heat under reflux with H₂SO₄ catalyst", "#9fe3ff", 10);
        H.panel(ctx, px, 58, 240, 120); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Esterification (reversible)", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; let y = wrapT(ctx, ac[2] + " + " + al[2] + " ⇌ ester + H₂O", px + 8, 89, 224, 11); ctx.fillStyle = "#9fb2d2"; y = wrapT(ctx, ac[0] + " + " + al[0] + " ⇌ " + name + " + water", px + 8, y + 15, 224, 11); wrapT(ctx, "Name = alkyl group of the alkanol + alkanoate from the acid. Conc. H₂SO₄ is a catalyst and removes water, pushing the equilibrium right.", px + 8, y + 15, 224, 10.5);
        H.panel(ctx, px, 184, 240, 100); ctx.fillStyle = "#e8f0ff"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText("Ester: " + name, px + 8, 200); ctx.fillStyle = "#ffd27a"; ctx.fillText("Smell: " + (SM[name] || "sweet and fruity"), px + 8, 216); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, s.poured > 0 ? "Poured into cold water, the water-insoluble ester floats as an oily layer with its fruity smell." : "Pour the cooled mixture into cold water to see the ester layer and smell it.", px + 8, 232, 224, 10.5);
        const q = S.proj(V3(-1.4, 2.8, 0)); H.pill(ctx, q.x + 24, q.y, "reflux condenser", "#bcd0ea", 8.5, "left"); const q2 = S.proj(V3(-1.4, 0.0, 0)); H.pill(ctx, q2.x, q2.y + 22, "flask on hot plate", "#bcd0ea", 8.5, "center");
      } else {
        const r = s.r; H.pill(ctx, 10, 22, "Fermentation at " + c.T + " °C" + (c.air ? " (with oxygen)" : " (no oxygen)"), "#ffe9b8", 11); H.pill(ctx, 10, 44, (c.air ? "aerobic: CO₂ + H₂O, no ethanol" : "ethanol " + s.eth.toFixed(1) + " % by volume") + "   time " + s.hr.toFixed(0) + " h", "#9fe3ff", 10);
        const pts = []; for (let T0 = 5; T0 <= 70; T0 += 1) pts.push([T0, ferRate(T0)]); H.graph(ctx, px, 58, 240, 140, { series: [{ pts, color: "#ffd27a", width: 2 }], xmin: 5, xmax: 70, ymin: 0, ymax: 1.1, ticksX: 5, ticksY: 4, xl: "temperature / °C", yl: "relative rate", dot: [c.T, r, "#7dd3ff"] });
        H.panel(ctx, px, 204, 240, 84); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂", px + 8, 220); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, c.air ? "With oxygen yeast respires: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O. No ethanol forms." : r > 0.8 ? "Near the optimum temperature the enzymes (zymase) work fastest." : r === 0 ? "Enzymes are denatured above about 55 °C: fermentation stops." : r < 0.3 ? "Too cold: molecules move slowly, so the enzymes work slowly." : "Rate is below the optimum.", px + 8, 236, 224, 10.5);
        const q = S.proj(V3(2.4, 3.3, 0)); H.pill(ctx, q.x, q.y, "CO₂ → limewater", "#bcd0ea", 8.5, "center"); const q2 = S.proj(V3(-1.4, 0.0, 0)); H.pill(ctx, q2.x, q2.y + 22, "yeast + glucose solution", "#bcd0ea", 8.5, "center");
      }
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "br") { const d = BR[c.sub]; return [["Compound", d.n + ", " + d.f], ["Test", "bromine water (orange)"], ["Result", d.rate > 0 ? "decolourised" : "stays orange"], ["Equation", d.eq], ["Meaning", d.note]]; }
      if (c.mode === "est") { const al = ALC[c.alc], ac = ACD[c.acd], name = al[1] + " " + ac[1]; return [["Reactants", ac[0] + " + " + al[0]], ["Catalyst", c.cat ? "concentrated H₂SO₄ (fast, dehydrates)" : "none (very slow)"], ["Ester", name], ["Smell", SM[name] || "sweet and fruity"], ["Yield", Math.round(s.p / esterConv() * 67) + " % (equilibrium about 67 % for 1:1)"], ["Type", "condensation: water is lost"]]; }
      return [["Temperature", c.T + " °C"], ["Relative rate", s.r.toFixed(2)], ["Ethanol", s.eth.toFixed(1) + " % by volume (yeast stops near 12–15 %)"], ["Time", s.hr.toFixed(0) + " h"], ["Oxygen", c.air ? "present: aerobic respiration, no ethanol" : "absent: anaerobic fermentation"], ["Test for CO₂", "limewater turns milky"]];
    },
    steps(s, c) { return c.mode === "br" ? [["Choose a compound", "done"], ["Add bromine water and shake", s.brAdded ? "done" : "now"], ["Compare alkane, alkene, alkyne and benzene", ""], ["Write the equation", ""]] : c.mode === "est" ? [["Choose an alkanol and an alkanoic acid", "done"], ["Heat under reflux with the catalyst", s.run ? "done" : "now"], ["Pour into water and smell the ester", s.poured ? "done" : ""], ["Name the ester", ""]] : [["Set the temperature", "done"], ["Watch the CO₂ turn limewater milky", s.hr > 8 ? "done" : "now"], ["Find the optimum temperature", ""], ["Leave it open to air and compare", c.air ? "done" : ""]]; },
  };
})();
