/* c3d-ioniccrystal.js — chemistry 3D, new module: ionic bonding (electron transfer), crystal lattice and properties */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const SUP = { 1: "⁺", 2: "²⁺", "-1": "⁻", "-2": "²⁻" };
  /* ---- formation pairs ---- */
  const AT = { Li: { s: "Li", sh: [2, 1], m: 1, col: 0x9a8cff }, Na: { s: "Na", sh: [2, 8, 1], m: 1, col: 0x8fa8ff }, Mg: { s: "Mg", sh: [2, 8, 2], m: 1, col: 0xffb070 }, F: { s: "F", sh: [2, 7], m: 0, col: 0x9ff0a0 }, Cl: { s: "Cl", sh: [2, 8, 7], m: 0, col: 0x6fe08a }, O: { s: "O", sh: [2, 6], m: 0, col: 0xff6a6a } };
  const PAIRS = {
    NaCl: { n: "sodium chloride", f: "NaCl", M: "Na", nM: 1, X: "Cl", nX: 1, note: "Na (2,8,1) loses 1 electron to become Na⁺ (2,8); Cl (2,8,7) gains it to become Cl⁻ (2,8,8)" },
    LiF: { n: "lithium fluoride", f: "LiF", M: "Li", nM: 1, X: "F", nX: 1, note: "Li (2,1) loses 1 electron to become Li⁺ (2); F (2,7) gains it to become F⁻ (2,8)" },
    MgO: { n: "magnesium oxide", f: "MgO", M: "Mg", nM: 1, X: "O", nX: 1, note: "Mg (2,8,2) loses 2 electrons to become Mg²⁺ (2,8); O (2,6) gains 2 to become O²⁻ (2,8)" },
    MgCl2: { n: "magnesium chloride", f: "MgCl₂", M: "Mg", nM: 1, X: "Cl", nX: 2, note: "one Mg gives 1 electron to each of two Cl: Mg²⁺ and 2Cl⁻, so the formula is MgCl₂" },
    Na2O: { n: "sodium oxide", f: "Na₂O", M: "Na", nM: 2, X: "O", nX: 1, note: "two Na each give 1 electron to one O: 2Na⁺ and O²⁻, so the formula is Na₂O" },
  };
  /* ---- crystals ---- */
  const CRY = {
    NaCl: { n: "sodium chloride (NaCl)", st: "rock salt", cn: "6 : 6", cat: "Na⁺", an: "Cl⁻", rc: 0.102, ra: 0.181, cc: 0x8fa8ff, ca: 0x6fe08a, mp: 801, bp: 1413, sol: 1, ch: 1 },
    CsCl: { n: "caesium chloride (CsCl)", st: "caesium chloride", cn: "8 : 8", cat: "Cs⁺", an: "Cl⁻", rc: 0.167, ra: 0.181, cc: 0xc9a0ff, ca: 0x6fe08a, mp: 645, bp: 1300, sol: 1, ch: 1 },
    MgO: { n: "magnesium oxide (MgO)", st: "rock salt", cn: "6 : 6", cat: "Mg²⁺", an: "O²⁻", rc: 0.072, ra: 0.140, cc: 0xffb070, ca: 0xff6a6a, mp: 2852, bp: 3600, sol: 0, ch: 2 },
  };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  function sites(cry) {
    const out = [];
    if (cry === "CsCl") { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) out.push({ x: i - 1.5, y: j - 1.5, z: k - 1.5, t: 1 }); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) out.push({ x: i - 1, y: j - 1, z: k - 1, t: 0 }); }
    else for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) out.push({ x: i - 1.5, y: j - 1.5, z: k - 1.5, t: (i + j + k) % 2 });
    return out;
  }
  const scaleOf = (cry) => { const c = CRY[cry], nn = cry === "CsCl" ? 0.54 : 0.62, dist = cry === "CsCl" ? (c.rc + c.ra) : (c.rc + c.ra); return { f: nn / dist, nn, a: cry === "CsCl" ? nn / (Math.sqrt(3) / 2) : nn * 2 / 2 }; };
  const NSL = 91;

  C3.scenes.ionicCrystal = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.85, fov: 36, free: true, cam: [[1.2, 1.8, 7.6], [1.1, 1.8, 0]],
    values: { mode: "form", pair: "NaCl", cry: "NaCl", p: 0, shear: 0, T: 25, bat: 1, aq: 0 },
    state: () => ({ play: false, ph: 0, ions: null, t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Topic", options: [{ value: "form", label: "Forming an ionic bond (electron transfer)" }, { value: "lattice", label: "The giant ionic lattice and why it is brittle" }, { value: "props", label: "Melting, dissolving and conducting" }] },
        { type: "select", key: "pair", label: "Atoms that react", options: Object.keys(PAIRS).map((k) => ({ value: k, label: PAIRS[k].n + " (" + PAIRS[k].f + ")" })) },
        { type: "range", key: "p", label: "Electron transfer progress", min: 0, max: 1, step: 0.01 },
        { type: "button", label: "Play the reaction", action: (S, s, c) => { s.play = true; if (c.p >= 0.99) c.p = 0; } },
        { type: "select", key: "cry", label: "Crystal", options: Object.keys(CRY).map((k) => ({ value: k, label: CRY[k].n })) },
        { type: "range", key: "shear", label: "Shift the top layers sideways (0 → 1 ion)", min: 0, max: 1, step: 0.01 },
        { type: "range", key: "T", label: "Temperature (°C)", min: 25, max: 3000, step: 5, unit: " °C" },
        { type: "toggle", key: "aq", label: "Dissolve in water instead (only soluble crystals)" },
        { type: "toggle", key: "bat", label: "Battery connected" },
      ];
    },
    views: [{ label: "Front", cam: [[1.2, 1.8, 7.6], [1.1, 1.8, 0]] }, { label: "Wide", cam: [[1.4, 1.8, 9.4], [1.7, 1.8, 0]] }],
    note: "An ionic bond is the electrostatic attraction between oppositely charged ions formed when a metal atom transfers electrons to a non-metal atom, so both reach a full outer shell. Charges must balance: Mg²⁺ + 2Cl⁻ gives MgCl₂. In the solid, ions sit in a giant lattice (NaCl 6:6, CsCl 8:8), held by strong attractions in all directions, so ionic compounds have high melting points. Shifting a layer by one ion puts like charges side by side; they repel and the crystal cleaves, so ionic solids are brittle. Ions cannot move in the solid, so it does not conduct, but molten or dissolved ions are free to move and carry current. MgO (2+, 2−) melts at 2852 °C, much higher than NaCl, because the charges are larger. Ion sizes are drawn to scale with each other; the particle motion in liquids is illustrative.",
    onChange(S, s, c, key) { if (key === "mode" || key === "pair") C3.setView(S, { cam: c.mode === "form" ? formCam(c) : c.mode === "lattice" ? [[4.6, 2.4, 8.4], [2.4, 1.6, 0]] : [[2.6, 2.6, 9.2], [1.3, 1.9, 0]] }); if (key === "pair") { s.play = false; c.p = 0; } if (key === "cry" || key === "mode") { s.ions = null; if (CRY[c.cry].sol === 0) c.aq = 0; } if (key === "aq" && !CRY[c.cry].sol) c.aq = 0; },
    reset(S, s, c) { Object.assign(c, { mode: "form", pair: "NaCl", cry: "NaCl", p: 0, shear: 0, T: 25, bat: 1, aq: 0 }); s.play = false; s.ions = null; },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Crystal</th><th>structure</th><th>coordination</th><th>m.p. / °C</th><th>b.p. / °C</th><th>soluble in water</th></tr>' + Object.keys(CRY).map((k) => { const q = CRY[k]; return '<tr><td style="text-align:left">' + q.n + "</td><td>" + q.st + "</td><td>" + q.cn + "</td><td>" + q.mp + "</td><td>" + q.bp + "</td><td>" + (q.sol ? "yes" : "no (insoluble)") + "</td></tr>"; }).join("") + "</table>";
    },
    build(S, s, c) {
      s.K = C3.kit(S); S.mk.box(11, 0.1, 5, M.matte(0x1d222b, 0.7), 1.0, -0.05, 0); s.softTex = U.softDot(64, "rgba(255,255,255,1)");
      s.fm = new T.Group(); S.scene.add(s.fm); s.lat = new T.Group(); S.scene.add(s.lat); s.pr = new T.Group(); S.scene.add(s.pr);
      /* --- formation: atoms with shells --- */
      s.nuc = []; s.rings = []; s.el = [];
      for (let a = 0; a < 3; a++) {
        const g = new T.Group(); s.fm.add(g); const nuc = new T.Mesh(new T.SphereGeometry(0.1, 20, 14), new T.MeshStandardMaterial({ color: 0xffd27a, roughness: 0.3 })); g.add(nuc);
        const rs = []; for (let k = 0; k < 4; k++) { const r = new T.Mesh(new T.TorusGeometry(1, 0.008, 6, 64), new T.MeshBasicMaterial({ color: 0x8fb4ff, transparent: true, opacity: 0.35 })); g.add(r); rs.push(r); }
        s.nuc.push({ g, nuc, rings: rs });
      }
      const eg = new T.SphereGeometry(0.052, 12, 10); s.eM = []; for (let i = 0; i < 64; i++) { const m = new T.Mesh(eg, new T.MeshBasicMaterial({ color: 0x9fd0ff })); s.fm.add(m); s.eM.push(m); }
      /* --- lattice: instanced ions (91 sites max) --- */
      s.ic = new T.InstancedMesh(new T.SphereGeometry(1, 22, 16), M.matte(0xffffff, 0.35), NSL); s.ia = new T.InstancedMesh(new T.SphereGeometry(1, 22, 16), M.matte(0xffffff, 0.35), NSL); s.ic.frustumCulled = false; s.ia.frustumCulled = false; s.lat.add(s.ic); s.lat.add(s.ia);
      s.mat = new T.Matrix4(); s.qv = new T.Quaternion(); s.pv = new T.Vector3(); s.sv = new T.Vector3();
      /* --- properties tank + circuit --- */
      s.tank = new T.Mesh(new T.BoxGeometry(3.6, 2.4, 2.4), new T.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false })); s.tank.position.set(0, 1.2, 0); s.pr.add(s.tank);
      s.water = new T.Mesh(new T.BoxGeometry(3.4, 1.8, 2.2), new T.MeshBasicMaterial({ color: 0x4aa8ff, transparent: true, opacity: 0.22, depthWrite: false })); s.water.position.set(0, 1.0, 0); s.pr.add(s.water);
      const rod = (x) => { const m = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 2.8, 14), M.matte(0x2a2d33, 0.5)); m.position.set(x, 1.8, 0); s.pr.add(m); }; rod(-1.5); rod(1.5);
      const wire = (a, b) => { const g = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 1, 8), M.matte(0xb87333, 0.4)); const A = V3(...a), B = V3(...b), d = B.clone().sub(A), L = d.length(); g.position.copy(A).addScaledVector(d, 0.5); g.scale.set(1, L, 1); g.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); s.pr.add(g); };
      wire([-1.5, 3.2, 0], [-1.5, 3.9, 0]); wire([-1.5, 3.9, 0], [-0.7, 3.9, 0]); wire([-0.1, 3.9, 0], [0.5, 3.9, 0]); wire([1.0, 3.9, 0], [1.5, 3.9, 0]); wire([1.5, 3.9, 0], [1.5, 3.2, 0]);
      s.bulb = new T.Mesh(new T.SphereGeometry(0.28, 20, 16), new T.MeshStandardMaterial({ color: 0xdddddd, emissive: 0xffd060, emissiveIntensity: 0, transparent: true, opacity: 0.8, roughness: 0.2 })); s.bulb.position.set(-0.4, 3.9, 0); s.pr.add(s.bulb);
      s.glow = new T.Sprite(new T.SpriteMaterial({ map: s.softTex, color: 0xffd060, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); s.glow.scale.set(1.6, 1.6, 1); s.glow.position.copy(s.bulb.position); s.pr.add(s.glow);
      s.bat = new T.Mesh(new T.BoxGeometry(0.5, 0.3, 0.3), M.matte(0x2c3b4f, 0.4)); s.bat.position.set(0.75, 3.9, 0); s.pr.add(s.bat);
    },
    update(S, s, c, dt) {
      const mode = c.mode; s.fm.visible = mode === "form"; s.lat.visible = mode !== "form"; s.pr.visible = mode === "props"; s.t += dt;
      if (mode === "form") return updForm(S, s, c, dt);
      updIons(S, s, c, dt);
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      if (c.mode === "form") ovForm(ctx, s, c, w, h, S, px); else if (c.mode === "lattice") ovLat(ctx, s, c, w, h, S, px); else ovProps(ctx, s, c, w, h, S, px);
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "form") { const q = PAIRS[c.pair]; const mc = AT[q.M].sh[AT[q.M].sh.length - 1], xc = 8 - AT[q.X].sh[AT[q.X].sh.length - 1]; return [["Compound", q.n + " (" + q.f + ")"], ["Metal", AT[q.M].s + " (" + AT[q.M].sh.join(",") + ") loses " + mc + " e⁻ → " + AT[q.M].s + SUP[mc]], ["Non-metal", AT[q.X].s + " (" + AT[q.X].sh.join(",") + ") gains " + xc + " e⁻ → " + AT[q.X].s + SUP[-xc]], ["Charge balance", q.nM + " × (+" + mc + ") + " + q.nX + " × (−" + xc + ") = 0"], ["Bond", "electrostatic attraction between oppositely charged ions"]]; }
      const q = CRY[c.cry], st = state(c); if (c.mode === "lattice") return [["Crystal", q.n], ["Coordination number", q.cn], ["Ion charges", q.cat + " and " + q.an], ["Melting point", q.mp + " °C"], ["Top layers shifted by", (c.shear * 100).toFixed(0) + " % of an ion"], ["Result", c.shear > 0.9 ? "like charges adjacent: repulsion, crystal cleaves (brittle)" : "layers still in registry"]];
      return [["Crystal", q.n], ["Temperature", c.T + " °C (m.p. " + q.mp + " °C)"], ["State", st.label], ["Mobile ions?", st.mobile ? "yes: carry current" : "no: fixed in the lattice"], ["Conducts?", st.mobile && c.bat ? "yes" : st.mobile ? "yes, if a battery is connected" : "no"], ["Why", "current in an ionic substance is carried by moving ions, not electrons"]];
    },
    steps(s, c) { if (c.mode === "form") return [["Look at the electron arrangements", "done"], ["Play the transfer", c.p > 0.1 ? "done" : "now"], ["See both ions reach a full outer shell", c.p > 0.8 ? "done" : ""], ["Check the charges balance and write the formula", ""]]; if (c.mode === "lattice") return [["Study the alternating ion pattern", "done"], ["Shift the top layers sideways", c.shear > 0.05 ? "done" : "now"], ["See like charges meet and the crystal cleave", c.shear > 0.9 ? "done" : ""], ["Compare coordination in NaCl and CsCl", ""]]; return [["Test the solid", "done"], ["Heat above the melting point or dissolve", state(c).mobile ? "done" : "now"], ["Connect the battery and watch the ions drift", state(c).mobile && c.bat ? "done" : ""], ["Compare MgO and NaCl melting points", ""]]; },
  };
  const formCam = (c) => { const n = (PAIRS[c.pair].nM + PAIRS[c.pair].nX); return n === 2 ? [[1.2, 1.8, 7.6], [1.1, 1.8, 0]] : [[1.4, 1.8, 9.4], [1.7, 1.8, 0]]; };
  function state(c) { const q = CRY[c.cry]; if (c.aq && q.sol) return { mobile: true, label: "aqueous solution (ions hydrated and free)" }; if (c.T >= q.mp) return { mobile: true, label: c.T >= q.bp ? "boiling" : "molten liquid" }; return { mobile: false, label: "solid" }; }
  /* ---------------- formation ---------------- */
  function layout(c) {
    const q = PAIRS[c.pair], Mo = AT[q.M], Xo = AT[q.X], list = [];
    if (q.nM === 1 && q.nX === 1) { list.push({ a: Mo, m: 1 }, { a: Xo, m: 0 }); } else if (q.nX === 2) { list.push({ a: Xo, m: 0 }, { a: Mo, m: 1 }, { a: Xo, m: 0 }); } else { list.push({ a: Mo, m: 1 }, { a: Xo, m: 0 }, { a: Mo, m: 1 }); }
    const sp = 1.9, n = list.length; list.forEach((q2, i) => { q2.x0 = (i - (n - 1) / 2) * sp; q2.R = 0.2 + 0.17 * q2.a.sh.length; q2.Rion = q2.m ? 0.2 + 0.17 * (q2.a.sh.length - 1) : 0.2 + 0.17 * q2.a.sh.length * 1.08; });
    for (let i = 0; i < n; i++) { let x = 0; if (i > 0) x = list[i - 1].xc + (list[i - 1].Rion + list[i].Rion) * 0.9; list[i].xc = x; } const mid = (list[0].xc + list[n - 1].xc) / 2; list.forEach((q2) => (q2.xc -= mid));
    return list;
  }
  function updForm(S, s, c, dt) {
    if (s.play && dt > 0) { c.p = Math.min(1, c.p + dt / 7); if (c.p >= 1) s.play = false; }
    const list = layout(c), p = c.p, q = PAIRS[c.pair], close = ease(clamp((p - 0.72) / 0.28, 0, 1)); s.ph += dt * 1.1; s.lay = list;
    s.nuc.forEach((a, i) => { a.g.visible = i < list.length; });
    const els = []; let ei = 0;
    /* transfers: each metal's outer electrons -> nearest non-metal with vacancies */
    const needs = list.map((l) => (l.m ? 0 : 8 - l.a.sh[l.a.sh.length - 1])), have = list.map(() => 0), tr = [];
    list.forEach((l, i) => { if (!l.m) return; const out = l.a.sh[l.a.sh.length - 1]; for (let e = 0; e < out; e++) { let best = -1, bd = 1e9; list.forEach((t, j) => { if (!t.m && have[j] < needs[j]) { const d = Math.abs(i - j); if (d < bd) { bd = d; best = j; } } }); if (best >= 0) { tr.push({ from: i, to: best, k: e, slot: have[best] }); have[best]++; } } });
    list.forEach((l, i) => {
      const a = s.nuc[i], x = lerp(l.x0, l.xc, close); a.g.position.set(x, 1.8, 0); l.x = x; a.nuc.material.color.setHex(l.a.col);
      l.a.sh.forEach((cnt, k) => { const r = (l.m && k === l.a.sh.length - 1) ? 0.2 + 0.17 * (k + 1) : 0.2 + 0.17 * (k + 1); const ring = a.rings[k]; ring.visible = true; const lost = l.m && k === l.a.sh.length - 1 && p > 0.7; ring.scale.setScalar(r * (lost ? 0.001 : 1)); ring.material.opacity = lost ? 0 : 0.35; ring.material.color.setHex(l.m ? 0x8fb4ff : 0x9fe0a8); });
      for (let k = l.a.sh.length; k < 4; k++) a.rings[k].visible = false;
      if (!l.m) { const k = l.a.sh.length - 1, gain = have[i] > 0 && p > 0.7; a.rings[k].scale.setScalar((0.2 + 0.17 * (k + 1)) * (gain ? 1.08 : 1)); }
    });
    /* own electrons */
    list.forEach((l, i) => { l.a.sh.forEach((cnt, k) => { const R = (0.2 + 0.17 * (k + 1)) * (!l.m && k === l.a.sh.length - 1 && p > 0.7 && have[i] > 0 ? 1.08 : 1), w = (0.9 - 0.15 * k) * (k % 2 ? -1 : 1); for (let e = 0; e < cnt; e++) { const isOuterM = l.m && k === l.a.sh.length - 1; const ang = (2 * Math.PI * e) / cnt + s.ph * w + k * 0.7; const t = tr.find((x) => x.from === i && x.k === e); const m = s.eM[ei++]; m.material.color.setHex(0x9fd0ff); m.visible = true;
      if (isOuterM && t) { const ts = 0.12 + 0.12 * t.k + 0.04 * i, te = ts + 0.38, u = clamp((p - ts) / (te - ts), 0, 1); const tl = list[t.to], tR = (0.2 + 0.17 * tl.a.sh.length) * 1.08, nOut = tl.a.sh[tl.a.sh.length - 1] + have[t.to], slotAng = (2 * Math.PI * (tl.a.sh[tl.a.sh.length - 1] + t.slot + 0.5)) / nOut + s.ph * (tl.a.sh.length % 2 ? 0.9 - 0.15 * (tl.a.sh.length - 1) : -(0.9 - 0.15 * (tl.a.sh.length - 1))) * 0 + s.ph * 0.5;
        const sx = l.x + R * Math.cos(ang), sy = 1.8 + R * Math.sin(ang), ex = tl.x + tR * Math.cos(slotAng), ey = 1.8 + tR * Math.sin(slotAng), uu = ease(u); m.position.set(lerp(sx, ex, uu), lerp(sy, ey, uu) + 0.3 * Math.sin(Math.PI * uu), 0.05); m.material.color.setHex(u > 0 ? 0xffd27a : 0x9fd0ff); return; }
      m.position.set(l.x + R * Math.cos(ang), 1.8 + R * Math.sin(ang), 0); } }); });
    for (let j = ei; j < s.eM.length; j++) s.eM[j].visible = false; s.tr = tr; s.have = have;
  }
  function ovForm(ctx, s, c, w, h, S, px) {
    const q = PAIRS[c.pair], list = s.lay || layout(c), p = c.p;
    H.pill(ctx, 10, 22, "Ionic bonding: " + q.n + " (" + q.f + ")", "#ffe9b8", 11); H.pill(ctx, 10, 44, p < 0.12 ? "neutral atoms: outer shells not full" : p < 0.7 ? "electrons are transferred from the metal to the non-metal" : "ions formed: full outer shells, now attracted together", p > 0.7 ? "#8dffb8" : "#9fe3ff", 10);
    list.forEach((l) => { const pt = S.proj(V3(l.x || l.x0, 0.55, 0)); const charge = p > 0.7 ? (l.m ? AT[PAIRS[c.pair].M].sh[AT[PAIRS[c.pair].M].sh.length - 1] : -(8 - l.a.sh[l.a.sh.length - 1])) : 0; H.pill(ctx, pt.x, pt.y, l.a.s + (charge ? SUP[charge] : "") + "  (" + (p > 0.7 ? (l.m ? l.a.sh.slice(0, -1).join(",") : l.a.sh.slice(0, -1).concat([8]).join(",")) : l.a.sh.join(",")) + ")", p > 0.7 ? (l.m ? "#9fb8ff" : "#8dffb8") : "#bcd0ea", 9.5, "center"); });
    H.panel(ctx, px, 58, 240, 130); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Half-equations", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; const Mo = AT[q.M], Xo = AT[q.X], mc = Mo.sh[Mo.sh.length - 1], xc = 8 - Xo.sh[Xo.sh.length - 1];
    ctx.fillText(Mo.s + " → " + Mo.s + SUP[mc] + " + " + (mc > 1 ? mc : "") + "e⁻", px + 8, 89); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("oxidation: the metal loses electrons", px + 8, 101); ctx.fillStyle = "#e8f0ff"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillText(Xo.s + " + " + (xc > 1 ? xc : "") + "e⁻ → " + Xo.s + SUP[-xc], px + 8, 117); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("reduction: the non-metal gains electrons", px + 8, 129); ctx.fillStyle = "#ffd27a"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillText(q.nM + " × " + Mo.s + SUP[mc] + " + " + q.nX + " × " + Xo.s + SUP[-xc] + " → " + q.f, px + 8, 150); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.4px 'IBM Plex Mono',monospace"; wrapT(ctx, "charges: " + q.nM * mc + " − " + q.nX * xc + " = 0", px + 8, 165, 224, 10);
    H.panel(ctx, px, 194, 240, 84); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; wrapT(ctx, q.note, px + 8, 210, 224, 11);
  }
  /* ---------------- lattice & properties ---------------- */
  function updIons(S, s, c, dt) {
    const cr = CRY[c.cry], sc = scaleOf(c.cry), site = sites(c.cry), mode = c.mode, st = state(c), nn = sc.nn;
    if (!s.ions || s.ions.cry !== c.cry) { s.ions = { cry: c.cry, p: site.map((q) => ({ x: q.x * (c.cry === "CsCl" ? sc.a : nn), y: q.y * (c.cry === "CsCl" ? sc.a : nn), z: q.z * (c.cry === "CsCl" ? sc.a : nn), t: q.t, vx: rnd(-1, 1), vy: rnd(-1, 1), vz: rnd(-1, 1), ox: 0, oy: 0, oz: 0 })) }; }
    const ions = s.ions.p, rc = cr.rc * sc.f, ra = cr.ra * sc.f; let ic = 0, ia = 0; const m = s.mat, props = mode === "props";
    const base = props ? V3(0, 1.3, 0) : V3(1.0, 1.7, 0), shift = c.shear * nn * (c.cry === "CsCl" ? 1 : 1); s.shiftMax = nn; const free = props && st.mobile, drift = free && c.bat ? 1 : 0; const rs = props && st.mobile && c.aq ? 0.55 : props ? 0.8 : 1;
    const sol = props && !st.mobile ? Math.min(0.06, 0.01 + c.T * 0.00002) : 0;
    if (!(props && free)) ions.forEach((q, i) => { const k = c.cry === "CsCl" ? sc.a : nn, o = site[i]; q.x = o.x * k; q.y = o.y * k; q.z = o.z * k; });
    ions.forEach((q, i) => {
      let x, y, z; const cat = q.t === 0 && c.cry === "CsCl" || q.t === 0 && c.cry !== "CsCl" ? true : false;
      if (props && free) { const bx = c.aq ? 1.5 : 1.45, by = c.aq ? 0.8 : 1.0, bz = 1.0; q.x += q.vx * dt * (c.aq ? 0.8 : 1.1) + (drift ? (q.t === 0 ? -1 : 1) * dt * 0.55 : 0); q.y += q.vy * dt * 0.8; q.z += q.vz * dt * 0.8; if (Math.abs(q.x) > bx) { q.vx *= -1; q.x = Math.sign(q.x) * bx; } if (q.y > 0.95 || q.y < -0.95) { q.vy *= -1; q.y = clamp(q.y, -0.95, 0.95); } if (Math.abs(q.z) > bz) { q.vz *= -1; q.z = Math.sign(q.z) * bz; } if (Math.random() < 0.03) { q.vx = rnd(-1, 1); q.vy = rnd(-1, 1); q.vz = rnd(-1, 1); } x = q.x; y = q.y; z = q.z; }
      else { const upper = q.y > (c.cry === "CsCl" ? 0.2 : 0.01) * nn; const sh = mode === "lattice" && upper ? shift : 0; const gap = mode === "lattice" && upper && c.shear > 0.98 ? 0.1 : 0; const k = c.cry === "CsCl" ? sc.a : nn; x = q.x * 1 + sh; y = q.y + gap; z = q.z; if (sol) { q.ox += (Math.sin(S.t * 9 + i) * sol - q.ox) * 0.2; q.oy += (Math.cos(S.t * 8 + i * 1.3) * sol - q.oy) * 0.2; q.oz += (Math.sin(S.t * 7 + i * 0.7) * sol - q.oz) * 0.2; x += q.ox; y += q.oy; z += q.oz; } if (props) { q.x = q.x; } }
      const r = (q.t === 0 ? rc : ra) * rs; s.pv.set(base.x + x, base.y + y, base.z + z); s.sv.set(r, r, r); m.compose(s.pv, s.qv, s.sv); if (q.t === 0) s.ic.setMatrixAt(ic++, m); else s.ia.setMatrixAt(ia++, m);
    });
    s.ic.count = ic; s.ia.count = ia; s.ic.instanceMatrix.needsUpdate = true; s.ia.instanceMatrix.needsUpdate = true; s.ic.material.color.setHex(cr.cc); s.ia.material.color.setHex(cr.ca);
    if (props) { s.water.visible = !!(c.aq && cr.sol); s.tank.visible = true; const on = free && c.bat; s.bulb.material.emissiveIntensity += ((on ? 2.2 : 0) - s.bulb.material.emissiveIntensity) * Math.min(1, dt * 6); s.glow.material.opacity = s.bulb.material.emissiveIntensity / 2.2 * 0.8; }
    s.st = st;
  }
  function ovLat(ctx, s, c, w, h, S, px) {
    const q = CRY[c.cry]; H.pill(ctx, 10, 22, q.n + ": " + q.st + " lattice", "#ffe9b8", 11); H.pill(ctx, 10, 44, c.shear > 0.9 ? "like charges now adjacent: repulsion, the crystal splits (brittle)" : "alternating + and − ions: attraction in all directions", c.shear > 0.9 ? "#ff9aa8" : "#9fe3ff", 10);
    const a = S.proj(V3(-0.7, 3.3, 0)); H.pill(ctx, a.x, a.y, q.cat + "  (small, positive)", "#" + q.cc.toString(16).padStart(6, "0"), 9, "center"); const b = S.proj(V3(2.6, 0.2, 0)); H.pill(ctx, b.x, b.y, q.an + "  (larger, negative)", "#" + q.ca.toString(16).padStart(6, "0"), 9, "center");
    H.panel(ctx, px, 58, 240, 118); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Lattice facts", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("coordination number " + q.cn, px + 8, 89); ctx.fillText("radius " + q.cat + ": " + q.rc.toFixed(3) + " nm", px + 8, 103); ctx.fillText("radius " + q.an + ": " + q.ra.toFixed(3) + " nm", px + 8, 117); ctx.fillText("ratio r+/r− = " + (q.rc / q.ra).toFixed(2), px + 8, 131); ctx.fillStyle = "#ffd27a"; ctx.fillText("m.p. " + q.mp + " °C", px + 8, 150); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.2px 'IBM Plex Mono',monospace"; wrapT(ctx, q.ch === 2 ? "charges 2+ and 2− give much stronger attraction: very high m.p." : "strong attractions throughout the lattice: high m.p.", px + 8, 163, 224, 10);
    H.panel(ctx, px, 182, 240, 96); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; wrapT(ctx, c.shear < 0.05 ? "Slide the top layers sideways with the slider. One ion step puts like charges next to each other." : c.shear > 0.9 ? "Like charges face each other and repel with great force, so the crystal splits along the plane: ionic solids are hard but brittle." : "Layers moving out of registry: attractions turning into repulsions.", px + 8, 198, 224, 11);
  }
  function ovProps(ctx, s, c, w, h, S, px) {
    const q = CRY[c.cry], st = s.st || state(c); H.pill(ctx, 10, 22, "Conductivity of " + q.n, "#ffe9b8", 11); H.pill(ctx, 10, 44, st.label + (st.mobile ? ": ions free to move" : ": ions fixed, no current"), st.mobile ? "#8dffb8" : "#ff9aa8", 10);
    const a = S.proj(V3(-1.5, 3.4, 0)); H.pill(ctx, a.x - 6, a.y, "cathode (−)", "#9fb8ff", 8.5, "right"); const b = S.proj(V3(1.5, 3.4, 0)); H.pill(ctx, b.x + 6, b.y, "anode (+)", "#ffb27a", 8.5, "left");
    const d = S.proj(V3(-0.4, 3.45, 0)); H.pill(ctx, d.x, d.y, st.mobile && c.bat ? "bulb ON" : "bulb off", st.mobile && c.bat ? "#ffe9a0" : "#9fb2d2", 9, "center");
    const pts = [[0, 0], [q.mp - 1, 0], [q.mp, 1], [3000, 1]]; H.graph(ctx, px, 58, 240, 110, { series: [{ pts, color: "#7dd3ff", width: 2 }], xmin: 0, xmax: 3000, ymin: 0, ymax: 1.2, ticksX: 3, ticksY: 1, xl: "temperature / °C (mp " + q.mp + ")", yl: "mobile ions", dot: [c.T, st.mobile ? 1 : 0, "#ffd27a"] });
    H.panel(ctx, px, 174, 240, 110); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; wrapT(ctx, !st.mobile ? "Solid: " + (c.aq && !q.sol ? "MgO is insoluble in water. " : "") + "ions are held in fixed positions, so there are no charge carriers and the bulb stays off. Raise the temperature past " + q.mp + " °C" + (q.sol ? " or dissolve it in water." : ".") : (c.aq ? "Dissolved: water separates the ions, which move to the electrodes: Na⁺-type cations to the cathode, anions to the anode." : "Molten: the lattice has broken down; free ions move to opposite electrodes and carry the current.") + (c.bat ? "" : " Connect the battery to see the ions drift."), px + 8, 190, 224, 11);
  }
})();
