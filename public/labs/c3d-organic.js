/* c3d-organic.js — chemistry 3D, batch D (part 3): organic chemistry — homologous series (real bond geometry), boiling points, combustion / bromine test / esterification.
   Also exports C3.chainMol(spec) — a zig-zag chain molecule builder used by the polymer scene. */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2, sub = C3.chem.sub;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180;
  const rotZ = (v, deg) => { const a = rad(deg), c = Math.cos(a), s = Math.sin(a); return V3(v.x * c - v.y * s, v.x * s + v.y * c, 0); };

  /* ============== zig-zag chain builder: atoms in Å, planar carbon backbone in the xy plane ============== */
  C3.chainMol = function (sp) {
    const n = sp.n, type = sp.type || "alkane", atoms = [], bonds = [], subs = sp.subs || {}, ez = V3(0, 0, 1);
    const add = (el, p) => { atoms.push({ el, p: [p.x, p.y, p.z] }); return atoms.length - 1; };
    const bond = (i, j, o) => bonds.push([i, j, o || 1]);
    const dbl = type === "alkene" ? 1 : 0, cc = (i) => (type === "alkene" && i === 0 ? 1.34 : 1.54);
    const pos = [V3(0, 0, 0)]; for (let i = 1; i < n; i++) { const L = cc(i - 1), d = V3(Math.sin(rad(56)) * L, (i % 2 ? 1 : -1) * Math.cos(rad(56)) * L, 0); pos.push(pos[i - 1].clone().add(d)); }
    const ci = pos.map((p) => add("C", p)); for (let i = 1; i < n; i++) bond(ci[i - 1], ci[i], type === "alkene" && i === 1 ? 2 : 1);
    const unit = (a, b) => b.clone().sub(a).normalize();
    for (let i = 0; i < n; i++) {
      const p = pos[i], nb = []; if (i > 0) nb.push(unit(p, pos[i - 1])); if (i < n - 1) nb.push(unit(p, pos[i + 1]));
      const H1 = (d, el, len, from) => { const q = add(el || "H", (from || p).clone().addScaledVector(d, len || 1.09)); bond(from ? from.idx : ci[i], q); return q; };
      const sp2 = type === "alkene" && i <= 1, head = i === 0 && (type === "alkanol" || type === "acid");
      if (type === "acid" && i === 0) {                                     // carboxyl carbon: planar, C=O and C–OH
        const u = nb.length ? nb[0] : V3(-1, 0, 0), dO = rotZ(u, 120), dOH = rotZ(u, -120);
        const o1 = add("O", p.clone().addScaledVector(dO, 1.21)); bond(ci[0], o1, 2); const o2p = p.clone().addScaledVector(dOH, 1.34), o2 = add("O", o2p); bond(ci[0], o2, 1);
        const dh = rotZ(dOH, -62); const h = add("H", o2p.clone().addScaledVector(dh, 0.96)); bond(o2, h, 1); if (!nb.length) { const hh = add("H", p.clone().addScaledVector(u.clone().multiplyScalar(-1).negate(), 1.09)); bond(ci[0], hh, 1); } continue;
      }
      if (sp2) {
        if (nb.length === 2) { const o = nb[0].clone().add(nb[1]).multiplyScalar(-1).normalize(); const q = add("H", p.clone().addScaledVector(o, 1.08)); bond(ci[i], q); }
        else { const u = nb[0]; [120, -120].forEach((a, k) => { const el = subs[i] && k === 0 ? subs[i] : "H", q = add(el, p.clone().addScaledVector(rotZ(u, a), el === "Cl" ? 1.73 : 1.08)); bond(ci[i], q); }); }
        continue;
      }
      if (nb.length === 2) {
        const o = nb[0].clone().add(nb[1]).multiplyScalar(-1).normalize();
        [1, -1].forEach((sg) => { const d = o.clone().multiplyScalar(0.577).addScaledVector(ez, sg * 0.816).normalize(); const el = subs[i] && sg === 1 ? subs[i] : "H", len = el === "Cl" ? 1.77 : el === "H" ? 1.09 : 1.43; const q = add(el, p.clone().addScaledVector(d, len)); bond(ci[i], q); });
      } else if (nb.length === 1) {
        const u = nb[0], ep = V3(-u.y, u.x, 0); [0, 120, 240].forEach((ph, k) => { const a = rad(ph), d = u.clone().multiplyScalar(-0.334).addScaledVector(ep, 0.943 * Math.cos(a)).addScaledVector(ez, 0.943 * Math.sin(a)).normalize();
          if (head && type === "alkanol" && k === 0) { const o2p = p.clone().addScaledVector(d, 1.43), o2 = add("O", o2p); bond(ci[i], o2); const h = add("H", o2p.clone().addScaledVector(d.clone().multiplyScalar(0.33).addScaledVector(ez, 0.94).normalize(), 0.96)); bond(o2, h); }
          else { const el = subs[i] && k === 1 ? subs[i] : "H", q = add(el, p.clone().addScaledVector(d, el === "Cl" ? 1.77 : 1.09)); bond(ci[i], q); } });
      } else {                                                                      // lone carbon (methane / methanol)
        const dirs = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map((v) => V3(...v).normalize());
        dirs.forEach((d, k) => { if (type === "alkanol" && k === 0) { const o2p = p.clone().addScaledVector(d, 1.43), o2 = add("O", o2p); bond(ci[i], o2); const h = add("H", o2p.clone().addScaledVector(V3(0.9, 0.2, 0.4).normalize(), 0.96)); bond(o2, h); } else { const q = add("H", p.clone().addScaledVector(d, 1.09)); bond(ci[i], q); } });
      }
    }
    const xs = atoms.map((a) => a.p[0]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = atoms.reduce((s, a) => s + a.p[1], 0) / atoms.length; atoms.forEach((a) => { a.p[0] -= cx; a.p[1] -= cy; });
    return { atoms, bonds, width: Math.max(...xs) - Math.min(...xs) };
  };
  function disposeGroup(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.material.userData.keep) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); g.parent && g.parent.remove(g); }

  /* ============== data ============== */
  const PRE = ["meth", "eth", "prop", "but", "pent", "hex", "hept", "oct", "non", "dec"];
  const BP = {   // boiling points, °C (approximate textbook values)
    alkane: [-161.5, -88.6, -42.1, -0.5, 36.1, 68.7, 98.4, 125.7, 150.8, 174.1],
    alkene: [null, -103.7, -47.6, -6.3, 30, 63.5, 93.6, 121.3, 146.9, 170.6],
    alkanol: [64.7, 78.4, 97.2, 117.7, 138, 157, 176, 195, 213, 231],
    acid: [100.8, 118, 141, 163.5, 186, 205, 223, 239.7, 254, 268.7],
  };
  const SER = {
    alkane: { label: "Alkanes (CₙH₂ₙ₊₂)", col: "#7fb5ff", min: 1, comp: (n) => [n, 2 * n + 2, 0], name: (n) => PRE[n - 1] + "ane", grp: "—C–C— single bonds only (saturated)" },
    alkene: { label: "Alkenes (CₙH₂ₙ)", col: "#ffb347", min: 2, comp: (n) => [n, 2 * n, 0], name: (n) => PRE[n - 1] + "ene", grp: "C=C double bond (unsaturated)" },
    alkanol: { label: "Alkanols (CₙH₂ₙ₊₁OH)", col: "#7dffbd", min: 1, comp: (n) => [n, 2 * n + 2, 1], name: (n) => (n < 3 ? PRE[n - 1] + "anol" : PRE[n - 1] + "an-1-ol"), grp: "—OH hydroxyl group" },
    acid: { label: "Alkanoic acids (CₙH₂ₙ₊₁… COOH)", col: "#ff9d8a", min: 1, comp: (n) => [n, 2 * n, 2], name: (n) => PRE[n - 1] + "anoic acid", grp: "—COOH carboxyl group" },
  };
  const AM = { C: 12.011, H: 1.008, O: 15.999 };
  const fm = (c) => { const [x, y, z] = SER[c.ser].comp(c.n); return { x, y, z, M: x * AM.C + y * AM.H + z * AM.O }; };
  function formulaText(c) {
    const n = c.n, s = c.ser, hh = (k) => (k > 0 ? "H" + (k > 1 ? sub(String(k)) : "") : "");
    if (s === "alkane") return "C" + (n > 1 ? sub(String(n)) : "") + hh(2 * n + 2); if (s === "alkene") return "C" + sub(String(n)) + hh(2 * n);
    if (s === "alkanol") return n === 1 ? "CH₃OH" : "C" + (n > 1 ? sub(String(n)) : "") + hh(2 * n + 1) + "OH"; return n === 1 ? "HCOOH" : "C" + (n > 2 ? sub(String(n - 1)) : "") + hh(2 * n - 1) + "COOH";
  }
  function combustion(c) {
    const [x, y, z] = SER[c.ser].comp(c.n); let o = x + y / 4 - z / 2, f = 1; if (Math.abs(o - Math.round(o)) > 1e-6) f = 2; const k = (v) => (v * f === 1 ? "" : v * f);
    return k(1) + formulaText(c) + " + " + k(o) + "O₂ → " + k(x) + "CO₂ + " + k(y / 2) + "H₂O";
  }
  const ESTER = (c) => { if (c.ser === "acid") return { acid: c.n, alc: 2 }; if (c.ser === "alkanol") return { acid: 2, alc: c.n }; return null; };
  const alk = (n) => PRE[n - 1] + "yl", ac = (n) => PRE[n - 1] + "anoate";

  C3.scenes.organicExplorer = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[0.2, 3.0, 12.5], [0.2, 1.9, 0]],
    values: { ser: "alkane", n: 4, rx: "none", sf: 0 },
    state: () => ({ t: 0, st: 0, ester: 0, shake: 0, bromine: 1 }),
    controls: [
      { type: "select", key: "ser", label: "Homologous series", options: Object.keys(SER).map((k) => ({ value: k, label: SER[k].label })) },
      { type: "range", key: "n", label: "Number of carbon atoms, n", min: 1, max: 10, step: 1 },
      { type: "select", key: "rx", label: "Reaction to demonstrate", options: [{ value: "none", label: "None — show properties" }, { value: "comb", label: "Combustion" }, { value: "add", label: "Bromine water test (addition)" }, { value: "est", label: "Esterification" }] },
      { type: "button", label: "▶ Start the reaction / shake with bromine water", action: (S, s, c) => { s.st = 0; s.shake = 1; s.ester = 0; s.run = true; } },
      { type: "toggle", key: "sf", label: "Space-filling view" },
    ],
    views: [{ label: "Molecule + bench", cam: [[0.2, 3.0, 12.5], [0.2, 1.9, 0]] }, { label: "Molecule", cam: [[0, 3.2, 8.0], [0, 3.0, 0]] }, { label: "Reaction", cam: [[2.6, 1.6, 7.2], [2.4, 1.0, 0]] }],
    note: "Members of a homologous series share a general formula and chemical properties, and each differs from the next by —CH₂—. Physical properties such as boiling point increase smoothly with chain length because longer molecules have stronger intermolecular forces. Alkanes burn and react by substitution; alkenes decolourise bromine water (addition across C=C); alkanols and alkanoic acids react to give esters.",
    onChange(S, s, c, key, ref) { const mn = SER[c.ser].min; if (c.n < mn) { c.n = mn; ref && ref(); } if (key === "ser" || key === "n") { s.sig = ""; s.st = 0; s.run = false; s.shake = 0; s.ester = 0; } if (key === "rx") { s.st = 0; s.run = false; s.shake = 0; s.ester = 0; s.bromine = 1; } },
    reset(S, s, c) { Object.assign(c, { ser: "alkane", n: 4, rx: "none", sf: 0 }); s.sig = ""; s.st = 0; s.run = false; },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.contact(2.4, 0, 0, 7, 0.45); s.mol = null; s.sig = ""; s.t = 0; s.mt = 0;
      /* reaction props */
      s.dish = new T.Group(); const d1 = new T.Mesh(new T.CylinderGeometry(0.55, 0.38, 0.22, 36), M.matte(0xe8e2d6, 0.6)); d1.position.y = 0.11; d1.castShadow = true; s.dish.add(d1); s.fuel = new T.Mesh(new T.CylinderGeometry(0.46, 0.42, 0.06, 28), new T.MeshPhysicalMaterial({ color: 0xd8ecf6, transparent: true, opacity: 0.6, roughness: 0.05 })); s.fuel.position.y = 0.2; s.dish.add(s.fuel); s.dish.position.set(2.2, 0, 0.2); S.scene.add(s.dish);
      s.flame = K.flame({ h: 8, r: 1.5 }); s.flame.group.position.set(2.2, 0.25, 0.2); S.scene.add(s.flame.group);
      s.tubes = [1.55, 3.2].map((x) => { const t = K.testTube(); t.group.position.set(x, 0, 0.2); const l = t.addLiquid({ color: 0xf0a13a, opacity: 0.5 }); l.setVolume(8); return { t, l }; });
      s.bath = K.beaker(); s.bath.group.position.set(2.4, 0, 0.2); s.bathL = s.bath.addLiquid({ color: 0xbfe0f5, opacity: 0.2 }); s.bathL.setVolume(180); s.et = K.testTube(); s.et.group.position.set(2.4, 0.5 / 1, 0.2); s.etL = s.et.addLiquid({ color: 0xe8e0c0, opacity: 0.3 }); s.etL.setVolume(6);
      s.gIm = new T.InstancedMesh(new T.SphereGeometry(1, 12, 8), new T.MeshPhysicalMaterial({ roughness: 0.4 }), 40); s.gIm.frustumCulled = false; S.scene.add(s.gIm); s.gp = []; for (let i = 0; i < 40; i++) s.gp.push({ on: false }); s.m4 = new T.Matrix4(); s.col = new T.Color(); s.sty = 0; s.acc = 0;
    },
    update(S, s, c, dt) {
      const sig = c.ser + c.n; if (sig !== s.sig) { s.sig = sig; if (s.mol) disposeGroup(s.mol.group); const t = c.ser === "alkene" && c.n < 2 ? 2 : c.n, spec = C3.chainMol({ n: t, type: c.ser }), K = s.K; s.mol = K.molecule({ atoms: spec.atoms, bonds: spec.bonds }); const sc = clamp(6.4 / (spec.width * 1.15 + 3), 0.25, 0.9); s.mol.group.scale.setScalar(sc); s.mol.group.position.set(-1.9, 3.0, 0); s.mol.refresh(c.sf ? 1 : 0); s.sty = c.sf ? 1 : 0; }
      s.sty += ((c.sf ? 1 : 0) - s.sty) * Math.min(1, dt * 5 + (dt ? 0 : 1)); if (Math.abs(s.sty - (s.lsty == null ? -1 : s.lsty)) > 0.002) { s.mol.refresh(s.sty); s.lsty = s.sty; }
      s.mol.group.rotation.y = Math.sin(S.t * 0.35) * 0.12; s.t += dt;
      const rx = c.rx; s.dish.visible = rx === "comb"; s.flame.group.visible = rx === "comb" && true; s.tubes.forEach((q) => (q.t.group.visible = rx === "add")); s.bath.group.visible = s.et.group.visible = rx === "est";
      if (rx === "comb") updComb(S, s, c, dt); else if (rx === "add") updAdd(S, s, c, dt); else if (rx === "est") updEst(S, s, c, dt); else { s.m4.makeScale(0, 0, 0); for (let i = 0; i < 40; i++) s.gIm.setMatrixAt(i, s.m4); s.gIm.instanceMatrix.needsUpdate = true; s.flame.group.visible = false; }
    },
    overlay(ctx, s, c, w, h, S) {
      const f = fm(c), nm = SER[c.ser].name(c.n), x = c.n, bp = BP[c.ser][c.n - 1];
      H.pill(ctx, 10, 22, nm.charAt(0).toUpperCase() + nm.slice(1) + "   " + formulaText(c), "#ffe9b8", 12); H.pill(ctx, 10, 44, SER[c.ser].grp + "   ·   consecutive members differ by —CH₂— (Mr + 14)", "#bcd0ea", 9.5);
      if (bp != null) H.pill(ctx, 10, 66, "b.p. " + bp + " °C · at 25 °C: " + (bp < 25 ? "gas" : "liquid") + " · Mr = " + f.M.toFixed(1), SER[c.ser].col, 10);
      /* boiling-point graph */
      const gx = 396, gy = 58, gw = 240, gh = 148, X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40;
      if (c.rx === "none") {
        const series = Object.keys(SER).map((k) => ({ pts: BP[k].map((v, i) => (v == null ? null : [i + 1, v])).filter(Boolean), color: SER[k].col, width: k === c.ser ? 3 : 1.2 }));
        H.graph(ctx, gx, gy, gw, gh, { series, xmin: 1, xmax: 10, ymin: -200, ymax: 300, ticksX: 9, ticksY: 5, xl: "number of carbon atoms", yl: "boiling point / °C", dot: bp != null ? [c.n, bp, "#ffd27a"] : undefined });
        ctx.save(); ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; Object.keys(SER).forEach((k, i) => { ctx.fillStyle = SER[k].col; ctx.fillText(k === "acid" ? "acids" : k + "s", X0 + 6 + (i % 2) * 62, Y0 + 10 + Math.floor(i / 2) * 10); }); ctx.restore();
        H.pill(ctx, gx + gw, gy + gh + 16, "longer chain → stronger forces → higher b.p.", "#bcd0ea", 9, "right");
      } else H.panel(ctx, gx, gy, gw, gh), ovRx(ctx, s, c, S, gx, gy);
      const m = s.mol; if (m) { const q = S.proj(V3(-1.6, 3.2 + 1.35, 0)); }
    },
    readouts(s, c) {
      const f = fm(c), bp = BP[c.ser][c.n - 1];
      return [["Name", SER[c.ser].name(c.n)], ["Molecular formula", formulaText(c)], ["Functional group", SER[c.ser].grp], ["Molar mass Mr", f.M.toFixed(2) + " g/mol"], ["Boiling point", bp == null ? "—" : bp + " °C"], ["State at room temperature", bp == null ? "—" : bp < 25 ? "gas" : "liquid"], ["Combustion", combustion(c)], ["Difference from previous member", c.n > SER[c.ser].min ? "+ CH₂ (Mr + 14)" : "—"]];
    },
  };
  function updComb(S, s, c, dt) {
    const [x, y, z] = SER[c.ser].comp(c.n), soot = clamp((c.n - 3) / 5, 0, 1) * (c.ser === "alkene" ? 1.2 : 1) * (z ? 0.3 : 1), gasy = c.n <= 4 && c.ser === "alkane";
    const burning = s.run || true; s.fuel.visible = true; s.fuel.material.opacity = 0.6; s.flame.set(0.9 - soot * 0.85, clamp(0.55 + c.n * 0.06, 0.4, 1.1)); s.flame.update(S.t); s.flame.group.position.set(2.2, 0.28, 0.2);
    s.acc += dt * 5 + 0; if (dt > 0) while (s.acc >= 1) { s.acc -= 1; const q = s.gp.find((v) => !v.on); if (q) Object.assign(q, { on: true, k: Math.random() < 0.5 ? "c" : "w", p: V3(2.2 + U.rnd(-0.2, 0.2), 1.4, 0.2 + U.rnd(-0.2, 0.2)), v: V3(U.rnd(-0.15, 0.15), U.rnd(0.5, 0.9), U.rnd(-0.1, 0.1)), age: 0 }); }
    for (let i = 0; i < 40; i++) { const q = s.gp[i]; if (!q.on) { s.m4.makeScale(0, 0, 0); s.gIm.setMatrixAt(i, s.m4); continue; } if (dt > 0) { q.p.addScaledVector(q.v, dt); q.age += dt; if (q.age > 3) q.on = false; } const r = q.k === "c" ? 0.1 : 0.07; s.m4.makeScale(r, r, r); s.m4.setPosition(q.p.x, q.p.y, q.p.z); s.gIm.setMatrixAt(i, s.m4); s.col.set(q.k === "c" ? 0x8a929c : 0x7fc4ff); s.gIm.setColorAt(i, s.col); }
    s.gIm.instanceMatrix.needsUpdate = true; s.gIm.instanceColor && (s.gIm.instanceColor.needsUpdate = true); s.soot = soot;
  }
  function updAdd(S, s, c, dt) {
    s.flame.group.visible = false; if (s.shake > 0) { s.shake = Math.max(0, s.shake - dt * 0.4); s.run = true; }
    const alkene = c.ser === "alkene"; if (s.run && dt > 0) { s.st = Math.min(1, s.st + dt * 0.35); }
    /* tube 1 = the chosen compound; tube 2 = a control of the other kind */
    const col = (decol) => [240 + 0 * 15, 161 + 80 * decol, 58 + 170 * decol];
    const d1 = alkene ? s.st : 0, d2 = alkene ? 0 : s.st * 0; s.tubes[0].l.setColor(col(d1), 0.5 - 0.35 * d1); s.tubes[1].l.setColor(col(alkene ? 0 : 1 * s.st), alkene ? 0.5 : 0.5 - 0.35 * s.st); s.tubes.forEach((q) => q.l.update(S.t)); s.m4.makeScale(0, 0, 0); for (let i = 0; i < 40; i++) s.gIm.setMatrixAt(i, s.m4); s.gIm.instanceMatrix.needsUpdate = true;
    s.tubes.forEach((q, i) => (q.t.group.rotation.z = s.run && s.st < 1 ? Math.sin(S.t * 14) * 0.05 * (1 - s.st) : 0)); s.dec = [d1, alkene ? 0 : 1 * s.st];
  }
  function updEst(S, s, c, dt) {
    s.flame.group.visible = false; const e = ESTER(c); if (s.run && e && dt > 0) s.ester = Math.min(1, s.ester + dt * 0.12);
    s.bathL.setColor([191, 224, 245], 0.2); s.bathL.update(S.t); const p = s.ester; s.etL.setVolume(6); s.etL.setColor([240, 232, 190 - 40 * p], 0.3 + 0.25 * p); s.etL.update(S.t); s.m4.makeScale(0, 0, 0); for (let i = 0; i < 40; i++) s.gIm.setMatrixAt(i, s.m4); s.gIm.instanceMatrix.needsUpdate = true;
  }
  function ovRx(ctx, s, c, S, gx, gy) {
    ctx.save(); ctx.font = "600 10px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#8fb4ff";
    if (c.rx === "comb") { ctx.fillText("Combustion", gx + 8, gy + 16); ctx.fillStyle = "#ffe9b8"; wrap(ctx, combustion(c), gx + 8, gy + 36, 224, 14); ctx.fillStyle = "#dbe7ff"; ctx.font = "9.5px 'IBM Plex Sans',sans-serif"; wrap(ctx, (s.soot > 0.5 ? "Long chains have a higher C:H ratio: the oxygen supply is insufficient, so the flame is yellow and sooty (carbon, CO). " : "Short chains burn cleanly with a blue flame. ") + "Complete combustion gives CO₂ and H₂O and releases heat (exothermic).", gx + 8, gy + 70, 224, 13); }
    else if (c.rx === "add") { ctx.fillText("Bromine water test", gx + 8, gy + 16); ctx.fillStyle = "#ffe9b8"; wrap(ctx, c.ser === "alkene" ? "CₙH₂ₙ + Br₂ → CₙH₂ₙBr₂  (orange → colourless)" : "No C=C double bond to add across: stays orange", gx + 8, gy + 36, 224, 14); ctx.fillStyle = "#dbe7ff"; ctx.font = "9.5px 'IBM Plex Sans',sans-serif"; wrap(ctx, "Left tube: " + SER[c.ser].name(c.n) + "  ·  right tube: " + (c.ser === "alkene" ? "an alkane (control)" : "an alkene (control)") + ". Shake with the button above.", gx + 8, gy + 70, 224, 13); }
    else { const e = ESTER(c); ctx.fillText("Esterification", gx + 8, gy + 16); ctx.fillStyle = "#ffe9b8"; if (e) { const nm = alk(e.alc) + " " + ac(e.acid); wrap(ctx, "alkanoic acid + alkanol ⇌ ester + water (conc. H₂SO₄ catalyst, warm)", gx + 8, gy + 36, 224, 14); ctx.fillStyle = "#7dffbd"; wrap(ctx, SER.acid.name(e.acid) + " + " + SER.alkanol.name(e.alc) + " → " + nm + " + H₂O", gx + 8, gy + 70, 224, 13); ctx.fillStyle = "#dbe7ff"; ctx.font = "9.5px 'IBM Plex Sans',sans-serif"; wrap(ctx, "Esters smell fruity. Progress " + (s.ester * 100).toFixed(0) + " %", gx + 8, gy + 104, 224, 13); } else wrap(ctx, "Choose the alkanol or the alkanoic acid series to see an ester form.", gx + 8, gy + 36, 224, 14); }
    ctx.restore();
  }
  function wrap(ctx, text, x, y, w, lh) { const words = text.split(" "); let line = ""; for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > w && line) { ctx.fillText(line, x, y); y += lh; line = wd; } else line = t; } ctx.fillText(line, x, y); }
})();
