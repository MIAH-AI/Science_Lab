/* c3d-halogens.js — chemistry 3D, new module: Group 7 halogens (physical properties, displacement reactions, trends) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const CLR = [226, 238, 246];
  /* rank: 4 = F (most reactive) ... 1 = I */
  const HAL = {
    F: { n: "Fluorine", Z: 9, st: "pale yellow gas", mp: -220, bp: -188, En: 4.0, r: 4, col: [240, 238, 160], org: [240, 238, 160], Ar: 19.0, bond: 158 },
    Cl: { n: "Chlorine", Z: 17, st: "yellow-green gas", mp: -101, bp: -34, En: 3.2, r: 3, col: [200, 220, 100], org: [215, 225, 140], Ar: 35.5, bond: 242 },
    Br: { n: "Bromine", Z: 35, st: "red-brown liquid", mp: -7, bp: 59, En: 3.0, r: 2, col: [236, 130, 40], org: [226, 110, 30], Ar: 79.9, bond: 193 },
    I: { n: "Iodine", Z: 53, st: "grey-black solid (purple vapour)", mp: 114, bp: 184, En: 2.7, r: 1, col: [150, 90, 40], org: [140, 40, 190], Ar: 126.9, bond: 151 },
  };
  const REAG = { Cl: "chlorine water, Cl₂(aq)", Br: "bromine water, Br₂(aq)", I: "iodine solution, I₂(aq)" };
  const SALT = { Cl: "potassium chloride, KCl", Br: "potassium bromide, KBr", I: "potassium iodide, KI" };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const dispEq = (a, b) => "Cl₂Br₂I₂".length && ({ Cl: { Br: "Cl₂ + 2KBr → 2KCl + Br₂", I: "Cl₂ + 2KI → 2KCl + I₂" }, Br: { I: "Br₂ + 2KI → 2KBr + I₂" } }[a] || {})[b] || "";
  const reacts = (a, b) => HAL[a].r > HAL[b].r && a !== b;

  C3.scenes.halogens = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[1.4, 2.3, 8.4], [1.7, 1.3, 0]],
    values: { mode: "disp", reag: "Cl", salt: "Br", hex: 0, T: 20 },
    state: () => ({ t: 0, run: false, shake: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Topic", options: [{ value: "disp", label: "Displacement reactions" }, { value: "prop", label: "Physical properties and trends" }] },
        { type: "select", key: "reag", label: "Halogen solution added", options: Object.keys(REAG).map((k) => ({ value: k, label: REAG[k] })) },
        { type: "select", key: "salt", label: "Halide solution in the tube", options: Object.keys(SALT).map((k) => ({ value: k, label: SALT[k] })) },
        { type: "toggle", key: "hex", label: "Add hexane and shake (extract the halogen)" },
        { type: "button", label: "Mix the solutions", action: (S, s) => { s.run = true; s.t = 0; s.shake = 1.2; } },
        { type: "button", label: "Fresh tube", cls: "secondary", action: (S, s) => { s.run = false; s.t = 0; } },
        { type: "range", key: "T", label: "Temperature of the iodine and bromine samples (°C)", min: 10, max: 190, step: 1, unit: " °C" },
      ];
    },
    views: [{ label: "Bench", cam: [[1.4, 2.3, 8.4], [1.7, 1.3, 0]] }, { label: "Tubes", cam: [[0.8, 1.6, 4.8], [1.1, 1.0, 0]] }],
    note: "The halogens (Group 7) have seven outer electrons and gain one to form X⁻. Reactivity falls down the group (F > Cl > Br > I) because the outer shell is further from the nucleus and shielded, so an electron is attracted less strongly. So a more reactive halogen displaces a less reactive one from its salt: Cl₂ displaces Br⁻ and I⁻, Br₂ displaces I⁻ but not Cl⁻. Colours: Cl₂ pale green, Br₂ orange-brown, I₂ brown in water but violet in hexane. Melting and boiling points rise down the group as the molecules get larger and the van der Waals forces stronger: gas, liquid, solid.",
    onChange(S, s, c, key) { s.run = false; s.t = 0; if (key === "mode") C3.setView(S, { cam: c.mode === "prop" ? [[1.5, 2.2, 8.6], [1.6, 1.2, 0]] : [[1.4, 2.3, 8.4], [1.7, 1.3, 0]] }); },
    reset(S, s, c) { Object.assign(c, { mode: "disp", reag: "Cl", salt: "Br", hex: 0, T: 20 }); s.run = false; s.t = 0; },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Halogen</th><th>Z</th><th style="text-align:left">State at 20 °C</th><th>m.p. / °C</th><th>b.p. / °C</th><th>electronegativity</th><th>bond energy X–X / kJ</th></tr>' + Object.keys(HAL).map((k) => { const h = HAL[k]; return "<tr><td style=\"text-align:left\">" + h.n + " (" + k + "₂)</td><td>" + h.Z + '</td><td style="text-align:left">' + h.st + "</td><td>" + h.mp + "</td><td>" + h.bp + "</td><td>" + h.En + "</td><td>" + h.bond + "</td></tr>"; }).join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.m4 = new T.Matrix4(); S.mk.box(8, 0.1, 3, M.matte(0x2a2e36, 0.7), 1.7, -0.05, 0); s.blk = S.mk.rbox(1.7, 0.2, 1.0, 0.05, M.matte(0x7a5330, 0.55), 0.6, 0.1, 0);
      s.tube = K.vessel("testtube"); s.tube.group.position.set(0.6, 0.2, 0); s.liq = s.tube.addLiquid({ color: CLR, opacity: 0.45 }); s.liq.setVolume(5);
      s.org = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 1, 24), new T.MeshStandardMaterial({ color: 0xd8e0b0, transparent: true, opacity: 0.55, roughness: 0.2 })); s.tube.group.add(s.org); s.rtube = K.vessel("testtube"); s.rtube.group.position.set(0.0, 0.2, 0);
      s.dr = new T.Group(); const pg = new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 0.8, 14), M.matte(0xd8eaf5, 0.08)); pg.position.y = 0.4; s.dr.add(pg); const pb = new T.Mesh(new T.SphereGeometry(0.12, 18, 12), M.rubber()); pb.position.y = 0.95; pb.scale.y = 1.3; s.dr.add(pb); s.dr.position.set(0.6, 3.1, 0); S.scene.add(s.dr); s.drops = K.drops({ color: 0xc8dc64 });
      /* property samples */
      s.pg = new T.Group(); S.scene.add(s.pg); const jar = (x, col, op) => { const j = K.vessel("gasjar"); S.scene.remove(j.group); s.pg.add(j.group); j.group.position.set(x, 0.0, 0); j.group.scale.setScalar(0.7); const g = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 1.5, 28), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op * 0.8, depthWrite: false })); g.position.set(x, 0.85, 0); s.pg.add(g); return g; };
      s.fj = jar(-1.2, 0xe8e8a0, 0.28); s.cj = jar(0.0, 0xc8dc3c, 0.5);
      s.bb = new T.Group(); const bo = new T.Mesh(new T.CylinderGeometry(0.35, 0.4, 0.7, 24), new T.MeshStandardMaterial({ color: 0x40281a, transparent: true, opacity: 0.8, roughness: 0.2 })); bo.position.y = 0.35; s.bb.add(bo); s.bv = new T.Mesh(new T.CylinderGeometry(0.28, 0.3, 0.9, 20, 1, true), new T.MeshBasicMaterial({ color: 0xd9552a, transparent: true, opacity: 0.0, depthWrite: false })); s.bv.position.y = 1.15; s.bb.add(s.bv); s.bb.position.set(1.3, 0, 0); s.pg.add(s.bb);
      s.ic = new T.InstancedMesh(new T.OctahedronGeometry(0.07), new T.MeshStandardMaterial({ color: 0x3a3440, roughness: 0.3, metalness: 0.7 }), 40); s.ic.frustumCulled = false; s.pg.add(s.ic); for (let i = 0; i < 40; i++) { s.m4.makeRotationY(i); s.m4.setPosition(2.4 + Math.cos(i * 2.4) * 0.35 * Math.sqrt((i % 10) / 10 + 0.1), 0.1, Math.sin(i * 2.4) * 0.35 * Math.sqrt((i % 10) / 10 + 0.1)); s.ic.setMatrixAt(i, s.m4); }
      s.iv = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 1.4, 20, 1, true), new T.MeshBasicMaterial({ color: 0x8a30c0, transparent: true, opacity: 0.0, depthWrite: false })); s.iv.position.set(2.4, 0.8, 0); s.pg.add(s.iv); s.hot = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.04, 28), new T.MeshBasicMaterial({ color: 0x2a1414 })); s.hot.position.set(2.4, 0.02, 0); s.pg.add(s.hot);
    },
    update(S, s, c, dt) {
      const disp = c.mode === "disp"; [s.tube.group, s.dr, s.rtube.group].forEach((o) => { o.visible = disp; }); s.pg.visible = !disp; s.blk.visible = disp; s.rtube.group.visible = false;
      if (disp) {
        if (s.run && dt > 0) { s.t += dt / 4; if (s.shake > 0) s.shake -= dt; } const p = clamp(s.t, 0, 1), ok = reacts(c.reag, c.salt), a = HAL[c.reag], b = HAL[c.salt];
        const start = c.reag === "Cl" ? [220, 235, 210] : c.reag === "Br" ? [248, 190, 120] : [215, 170, 100], after = ok ? b.col : start; const aqueous = s.run ? mixc(CLR, ok ? mixc(start, b.col, 0) : start, clamp(p * 4, 0, 1)) : CLR; const fin = s.run ? (ok ? mixc(start, b.col, p) : mixc(CLR, start, clamp(p * 4, 0, 1)) ) : CLR; s.fin = fin;
        const vol = s.run ? 5 + 5 * Math.min(1, p * 5) : 5; s.liq.setVolume(vol); s.liq.setColor(fin, 0.55); s.liq.update(S.t);
        const showHex = c.hex && p > 0.6; s.org.visible = showHex; const hostCol = s.run ? (ok ? b.org : a.org) : CLR; if (showHex) { const g = ok ? b : a; s.org.material.color.setRGB(g.org[0] / 255, g.org[1] / 255, g.org[2] / 255); s.org.material.opacity = ok || c.reag !== "Cl" ? 0.8 : 0.3; s.org.scale.set(1, 0.8, 1); s.org.position.y = s.liq.level * CM + 0.42; if (ok) { s.liq.setColor(mixc(fin, CLR, 0.8), 0.4); } }
        s.dr.position.y = s.shake > 0.6 ? 3.0 : 3.1; s.tube.group.rotation.z = s.shake > 0 ? 0.04 * Math.sin(S.t * 28) : 0; if (dt > 0 && s.shake > 0.8) s.drops.emit(0.6, 2.95, 0, 0.14 + s.liq.level * CM, 0.03); s.drops.setColor(new T.Color().setRGB(start[0] / 255, start[1] / 255, start[2] / 255)); s.drops.update(dt);
      } else {
        const T0 = c.T, boil = T0 > 59, sub = T0 > 80; s.bv.material.opacity = clamp((T0 - 20) / 60, 0, 1) * 0.5; s.iv.material.opacity = sub ? clamp((T0 - 80) / 100, 0, 1) * 0.55 : 0; s.hot.material.color.setRGB(0.16 + 0.5 * clamp((T0 - 20) / 170, 0, 1), 0.07, 0.07); s.ic.visible = true;
      }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); const px = w - 250; ctx.textAlign = "left";
      if (c.mode === "disp") {
        const a = HAL[c.reag], b = HAL[c.salt], ok = reacts(c.reag, c.salt), same = c.reag === c.salt; H.pill(ctx, 10, 22, a.n + " + " + SALT[c.salt].split(",")[0], "#ffe9b8", 11); H.pill(ctx, 10, 44, !s.run ? "press ‘Mix the solutions’" : same ? "same halogen: nothing to displace" : ok ? (a.n + " is more reactive: it displaces " + b.n.toLowerCase() + (c.hex ? "; the hexane layer turns " + (c.salt === "I" ? "violet" : "orange") : "")) : a.n + " is less reactive: NO reaction", ok ? "#8dffb8" : "#cbd6e8", 9.5);
        const pts = [["F", 4], ["Cl", 3], ["Br", 2], ["I", 1]]; H.panel(ctx, px, 58, 240, 120); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Reactivity of the halogens", px + 8, 73); pts.forEach((q, i) => { const y = 84 + i * 21, sel = q[0] === c.reag || q[0] === c.salt; ctx.fillStyle = sel ? (q[0] === c.reag ? "#ffd27a" : "#7dd3ff") : "rgba(143,180,255,0.25)"; ctx.fillRect(px + 34, y, q[1] * 42, 10); ctx.fillStyle = "#e8f0ff"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText(q[0] + "₂", px + 8, y + 9); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText(i === 0 ? "most" : i === 3 ? "least" : "", px + 34 + q[1] * 42 + 6, y + 9); });
        H.panel(ctx, px, 184, 240, 100); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; const eq = ok ? dispEq(c.reag, c.salt) : same ? "no reaction" : "no reaction"; ctx.fillText(eq, px + 8, 200); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, ok ? "Ionic: " + c.reag + "₂ + 2" + c.salt + "⁻ → 2" + c.reag + "⁻ + " + c.salt + "₂. The halogen that is more reactive takes the electrons." : "A less reactive halogen cannot take electrons from the halide ion of a more reactive one.", px + 8, 216, 224, 10.5);
        const q = S.proj(V3(0.6, 2.8, 0)); H.pill(ctx, q.x + 30, q.y, SALT[c.salt].split(",")[0] + " (aq)", "#bcd0ea", 8.5, "left");
      } else {
        const T0 = c.T; H.pill(ctx, 10, 22, "Physical properties of the halogens", "#ffe9b8", 11); H.pill(ctx, 10, 44, "bromine vapour rises on warming; iodine sublimes above ~80 °C (T = " + T0 + " °C)", "#9fe3ff", 9.5);
        const labs = [[-1.2, "F₂ gas"], [0.0, "Cl₂ gas"], [1.3, "Br₂ liquid"], [2.4, "I₂ solid"]]; labs.forEach((l) => { const q = S.proj(V3(l[0], 2.4, 0)); H.pill(ctx, q.x, q.y, l[1], "#bcd0ea", 8, "center"); });
        const pts = Object.keys(HAL).map((k, i) => [i, HAL[k].bp]); H.graph(ctx, px, 58, 240, 130, { series: [{ pts, color: "#ffd27a", width: 2 }], xmin: 0, xmax: 3, ymin: -200, ymax: 200, ticksX: 3, ticksY: 4, xl: "F  Cl  Br  I", yl: "boiling point / °C" });
        H.panel(ctx, px, 194, 240, 94); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("Down the group:", px + 8, 210); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, "colour darkens, melting and boiling points rise (larger molecules, stronger van der Waals forces), reactivity and electronegativity fall.", px + 8, 224, 224, 10.5);
      }
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "prop") { const hs = Object.keys(HAL).map((k) => HAL[k]); return [["Fluorine", hs[0].st + ", b.p. " + hs[0].bp + " °C"], ["Chlorine", hs[1].st + ", b.p. " + hs[1].bp + " °C"], ["Bromine", hs[2].st + ", b.p. " + hs[2].bp + " °C"], ["Iodine", hs[3].st + ", m.p. " + hs[3].mp + " °C"], ["Trend", "reactivity and electronegativity decrease down the group"], ["Sublimation", "iodine changes straight from solid to purple vapour on gentle heating"]]; }
      const ok = reacts(c.reag, c.salt); return [["Reagent", REAG[c.reag]], ["Halide", SALT[c.salt]], ["Result", c.reag === c.salt ? "same halogen" : ok ? "displacement" : "no reaction"], ["Equation", ok ? dispEq(c.reag, c.salt) : "none"], ["Colour of the halogen formed", ok ? HAL[c.salt].st.split(" ").slice(0, 2).join(" ") + (c.hex ? "; in hexane: " + (c.salt === "I" ? "violet" : "orange") : "") : "-"], ["Rule", "a more reactive halogen displaces a less reactive one from its halide"]];
    },
    steps(s, c) { return c.mode === "disp" ? [["Choose a halogen and a halide", "done"], ["Mix them and watch the colour", s.run ? "done" : "now"], ["Add hexane to identify the halogen formed", c.hex ? "done" : ""], ["Try all nine combinations and rank the halogens", ""]] : [["Compare the four halogens at room temperature", "done"], ["Warm the bromine and iodine samples", c.T > 40 ? "done" : "now"], ["See iodine sublime", c.T > 100 ? "done" : ""], ["Relate the trend to molecular size", ""]]; },
  };
})();
