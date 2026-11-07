/* c3d-atoms.js — chemistry 3D batch A1: atomic structure · electron configuration · periodic trends */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), TAU = Math.PI * 2, lerp = (a, b, t) => a + (b - a) * t;
  const EL = (z) => (typeof ELEMENTS !== "undefined" ? ELEMENTS.find((e) => e.z === z) : null) || { z, sym: "X", name: "Unknown", r: 100, ie: 800, en: 1.5, row: 1, col: 1 };
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹", sup = (n) => String(n).split("").map((d) => SUP[+d]).join("");
  const SUB = "₀₁₂₃₄₅₆₇₈₉";
  const AR = [0, 1.008, 4.003, 6.94, 9.012, 10.81, 12.011, 14.007, 15.999, 18.998, 20.18, 22.99, 24.305, 26.982, 28.085, 30.974, 32.06, 35.45, 39.948, 39.098, 40.078, 44.956, 47.867, 50.942, 51.996, 54.938, 55.845, 58.933, 58.693, 63.546, 65.38];

  /* ----- electron configuration (Aufbau + the two d-block exceptions Cr and Cu) ----- */
  const ORD = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p"], CAP = { "1s": 2, "2s": 2, "2p": 6, "3s": 2, "3p": 6, "4s": 2, "3d": 10, "4p": 6 }, NB = { s: 1, p: 3, d: 5 };
  const WRITE = ["1s", "2s", "2p", "3s", "3p", "3d", "4s", "4p"];                       // conventional order of writing (by n)
  function aufbau(z) { const occ = {}; let rem = z; ORD.forEach((o) => { const c = Math.min(CAP[o], rem); if (c > 0) occ[o] = c; rem -= c; }); return occ; }
  function cfgOf(z) { const occ = aufbau(z); if (z === 24) { occ["4s"] = 1; occ["3d"] = 5; } if (z === 29) { occ["4s"] = 1; occ["3d"] = 10; } return occ; }
  const REMOVE = ["4p", "4s", "3d", "3p", "3s", "2p", "2s", "1s"];                          // order electrons are lost (4s before 3d)
  function occFor(p, e) { if (e <= p) { const occ = cfgOf(p); let rem = p - e; for (const o of REMOVE) { const k = Math.min(occ[o] || 0, rem); if (k) { occ[o] -= k; rem -= k; } if (!rem) break; } return occ; } return cfgOf(e); }
  function shellsOf(e, p) { const occ = occFor(p === undefined ? e : p, e), n = [0, 0, 0, 0]; Object.keys(occ).forEach((o) => { n[+o[0] - 1] += occ[o]; }); while (n.length && !n[n.length - 1]) n.pop(); return n; }
  function cfgStr(occ, z, shorthand) {
    let skip = 0; const core = shorthand ? (z >= 19 ? ["1s", "2s", "2p", "3s", "3p"] : z >= 11 ? ["1s", "2s", "2p"] : z >= 3 ? ["1s"] : []) : [];
    const pre = core.length ? "[" + (z >= 19 ? "Ar" : z >= 11 ? "Ne" : "He") + "]" : "";
    return pre + WRITE.filter((o) => occ[o] && !core.includes(o)).map((o) => o + sup(occ[o])).join(" ");
  }
  /* Slater's rules: effective nuclear charge felt by an outer electron of the neutral atom */
  function zeff(z) {
    const occ = cfgOf(z), grp = (o) => (o === "2s" || o === "2p" ? "2sp" : o === "3s" || o === "3p" ? "3sp" : o === "4s" || o === "4p" ? "4sp" : o);
    const lvl = ["1s", "2sp", "3sp", "3d", "4sp"], n = (g) => +g[0], cnt = {}; Object.keys(occ).forEach((o) => { cnt[grp(o)] = (cnt[grp(o)] || 0) + occ[o]; });
    const top = lvl.filter((g) => cnt[g]).pop() || "1s"; let sg = 0;
    lvl.forEach((g) => {
      const k = cnt[g] || 0; if (!k) return;
      if (g === top) sg += (k - 1) * (g === "1s" ? 0.30 : 0.35);
      else if (n(g) === n(top) - 1) sg += k * 0.85;
      else sg += k * 1.0;
    });
    return z - sg;
  }
  C3.data.cfgOf = cfgOf; C3.data.zeff = zeff;

  /* =========================================================================== 1. ATOMIC STRUCTURE */
  const ISO = {
    "H-1": [1, 0], "H-2": [1, 1], "H-3": [1, 2], "C-12": [6, 6], "C-13": [6, 7], "C-14": [6, 8], "N-14": [7, 7], "O-16": [8, 8], "Na-23": [11, 12], "Mg-24": [12, 12], "Mg-25": [12, 13], "Mg-26": [12, 14], "Cl-35": [17, 18], "Cl-37": [17, 20], "Ca-40": [20, 20], "Fe-56": [26, 30],
  };
  const ABUND = { "H-1": "99.985 %", "H-2": "0.015 %", "H-3": "trace · radioactive (β⁻)", "C-12": "98.93 %", "C-13": "1.07 %", "C-14": "trace · radioactive (β⁻, t½ 5730 y)", "N-14": "99.63 %", "O-16": "99.76 %", "Na-23": "100 %", "Mg-24": "78.99 %", "Mg-25": "10.00 %", "Mg-26": "11.01 %", "Cl-35": "75.78 %", "Cl-37": "24.22 %", "Ca-40": "96.94 %", "Fe-56": "91.75 %" };
  const RING = [[0.9, 0.2], [-0.6, 0.9], [0.35, -0.8], [-1.1, 0.5]];                       // ring tilts (rx, rz)
  const ringR = (i) => 0.95 + 0.62 * i, ringW = (i) => 1.5 / Math.pow(i + 1, 1.15);
  const isoName = (p, n) => { const k = Object.keys(ISO).find((q) => ISO[q][0] === p && ISO[q][1] === n); return k || null; };

  C3.scenes.atomicStructure = {
    env: "studio", envOpts: {}, fov: 36, free: true, cam: [[0, 3.0, 10.6], [0, 0, 0]],
    values: { p: 6, n: 6, e: 6, iso: "C-12", show: 1 },
    state: () => ({ t: 0, fx: [], msg: "", msgT: 0, keyN: "" }),
    controls: [
      { type: "select", key: "iso", label: "Choose an isotope (or build your own)", options: [{ value: "custom", label: "— build my own —" }].concat(Object.keys(ISO).map((k) => ({ value: k, label: k + "  (Z=" + ISO[k][0] + ", n=" + ISO[k][1] + ")" }))) },
      { type: "range", key: "p", label: "Protons (atomic number Z)", min: 1, max: 30, step: 1 },
      { type: "range", key: "n", label: "Neutrons", min: 0, max: 40, step: 1 },
      { type: "range", key: "e", label: "Electrons", min: 0, max: 30, step: 1 },
      { type: "button", label: "Ionise: remove the outer electron", action: (S, s, c, ref) => ionise(S, s, c, ref) },
      { type: "button", label: "Add an electron (form an anion)", action: (S, s, c, ref) => addElectron(S, s, c, ref), cls: "secondary" },
      { type: "button", label: "Make the atom neutral (e = p)", action: (S, s, c, ref) => { c.e = c.p; ref(); }, cls: "secondary" },
      { type: "toggle", key: "show", label: "Show shell labels" },
    ],
    views: [{ label: "Atom", cam: [[0, 3.0, 10.6], [0, 0, 0]] }, { label: "Nucleus", cam: [[0, 0.4, 2.3], [0, 0, 0]] }, { label: "Side", cam: [[10.6, 0.5, 0.5], [0, 0, 0]] }],
    note: "Z = number of protons = atomic number. A = protons + neutrons = mass number. Isotopes have the same Z but different numbers of neutrons. Electrons occupy shells 2, 8, 8, … (maximum 2n² per shell); the outer-shell electrons are the valence electrons. Atoms are mostly empty space — the nucleus and electrons are not drawn to scale.",
    onChange(S, s, c, key, ref) {
      if (key === "iso") { const q = ISO[c.iso]; if (q) { c.p = q[0]; c.n = q[1]; c.e = q[0]; ref && ref(); } }
      else if (key === "p" || key === "n") { c.iso = isoName(c.p, c.n) || "custom"; ref && ref(); }
      else if (key === "e") { /* keep isotope */ }
    },
    reset(S, s, c) { Object.assign(c, { p: 6, n: 6, e: 6, iso: "C-12" }); s.fx.forEach((f) => (f.m.visible = false)); s.fx = []; },

    build(S, s, c) {
      s.nuc = new T.InstancedMesh(new T.SphereGeometry(0.1, 24, 16), new T.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.8 }), 72); s.nuc.castShadow = true; S.scene.add(s.nuc);
      s.nucGlow = S.mk.soft(0xff8a5a, 2.6, 0, 0, 0, 0.28);
      s.rings = []; for (let i = 0; i < 4; i++) {
        const g = new T.Group(); g.rotation.set(RING[i][0], 0, RING[i][1]); const t = new T.Mesh(new T.TorusGeometry(ringR(i), 0.0065, 8, 120), new T.MeshBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.5 })); g.add(t); S.scene.add(g); s.rings.push(g); }
      s.elec = []; const em = M.emissive(0x59b8ff, 3), gl = new T.SpriteMaterial({ map: U.softDot(64, "rgba(120,190,255,1)"), color: 0x7fc4ff, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false });
      for (let i = 0; i < 30; i++) { const m = new T.Mesh(new T.SphereGeometry(0.085, 18, 14), em); const sp = new T.Sprite(gl); sp.scale.set(0.55, 0.55, 1); m.add(sp); S.scene.add(m); s.elec.push(m); }
      s.fxPool = []; for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.SphereGeometry(0.1, 18, 14), M.emissive(0xffe08a, 3.4)); const sp = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(64, "rgba(255,230,150,1)"), color: 0xffd27a, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); sp.scale.set(0.9, 0.9, 1); m.add(sp); m.visible = false; S.scene.add(m); s.fxPool.push(m); }
      s.ringQ = s.rings.map((g) => g.quaternion);
    },

    update(S, s, c, dt) {
      s.t += dt; const sh = shellsOf(c.e, c.p);
      if (!S.userMoved && !S.orbit.touched) S.orbit.tr += ((5.4 + 1.5 * Math.max(1, shellsOf(c.p, c.p).length, sh.length)) - S.orbit.tr) * Math.min(1, dt * 3);
      /* nucleus: p red, n grey, packed in a ball whose radius grows as A^(1/3) */
      const key = c.p + "|" + c.n;
      if (key !== s.keyN) {
        s.keyN = key; const A = Math.min(72, c.p + c.n), R = 0.1 * Math.pow(A / 0.62, 1 / 3), gold = Math.PI * (3 - Math.sqrt(5)), m4 = new T.Matrix4(), col = new T.Color();
        let seed = A * 7919 + c.p; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647), order = Array.from({ length: A }, (_, i) => i < c.p);
        for (let i = A - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        for (let i = 0; i < A; i++) { const y = A === 1 ? 0 : 1 - (2 * i) / (A - 1), rr = Math.sqrt(Math.max(0, 1 - y * y)), th = gold * i, rad = A === 1 ? 0 : R * Math.pow((i + 0.5) / A, 1 / 3);
          m4.makeTranslation(Math.cos(th) * rr * rad, y * rad, Math.sin(th) * rr * rad); s.nuc.setMatrixAt(i, m4); s.nuc.setColorAt(i, col.set(order[i] ? 0xff4a3a : 0xa3acb6)); }
        s.nuc.count = A; s.nuc.instanceMatrix.needsUpdate = true; s.nuc.instanceColor && (s.nuc.instanceColor.needsUpdate = true); s.nucGlow.scale.setScalar(1.2 + R * 3.2);
      }
      s.nuc.rotation.y += dt * 0.35; s.nuc.rotation.x = Math.sin(s.t * 0.6) * 0.15;
      /* shells + orbiting electrons */
      s.rings.forEach((g, i) => { g.visible = i < sh.length; g.children[0].material.opacity = c.show ? 0.5 : 0.28; });
      let idx = 0;
      sh.forEach((n, i) => { for (let j = 0; j < n; j++) { s.elec[idx++].position.copy(ePos(s, i, j, n, s.t)); } });
      for (let k = 0; k < 30; k++) s.elec[k].visible = k < idx;
      /* flying electrons (ionisation out / capture in) */
      for (let i = s.fx.length - 1; i >= 0; i--) {
        const f = s.fx[i]; f.t += dt; const k = f.t / f.life;
        if (f.mode === "out") { f.m.position.copy(f.from).addScaledVector(f.dir, f.t * f.t * 1.4 + f.t * 0.6); f.m.children[0].material.opacity = 0.9 * (1 - k); }
        else { const e = k * k * (3 - 2 * k); f.m.position.lerpVectors(f.from, f.to, e); }
        if (k >= 1) { f.m.visible = false; if (f.mode === "in") { f.done && f.done(); } s.fx.splice(i, 1); }
      }
      if (s.msgT > 0) s.msgT -= dt; if (s.msgT <= 0) s.msg = "";
    },

    overlay(ctx, s, c, w, h, S) {
      const e = EL(c.p), A = c.p + c.n, q = c.p - c.e, sh = shellsOf(c.e, c.p), iso = isoName(c.p, c.n);
      const kind = q > 0 ? "cation  (" + (q > 1 ? q : "") + "+)" : q < 0 ? "anion  (" + (-q > 1 ? -q : "") + "−)" : "neutral atom";
      H.pill(ctx, 10, 22, e.name + "-" + A + "   ·   " + kind, q > 0 ? "#ff9d8a" : q < 0 ? "#8ab8ff" : "#ffe9b8", 12);
      H.pill(ctx, 10, 44, "electron arrangement  " + (sh.length ? sh.join(", ") : "—") + "     (" + c.e + " e⁻)", "#bcd0ea", 10.5);
      /* nuclide notation  ᴬ_Z X^q */
      ctx.save(); H.panel(ctx, 520, 8, 112, 76); ctx.fillStyle = "#fff"; ctx.font = "700 34px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(e.sym, 566, 62);
      ctx.font = "700 15px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#ffcf8a"; ctx.fillText(String(A), 528, 36); ctx.fillStyle = "#ff9a8a"; ctx.fillText(String(c.p), 528, 66);
      if (q) { ctx.fillStyle = q > 0 ? "#ff9d8a" : "#8ab8ff"; ctx.fillText((Math.abs(q) > 1 ? Math.abs(q) : "") + (q > 0 ? "+" : "−"), 566 + ctx.measureText(e.sym).width * 1.9, 36); }
      ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb3d1"; ctx.fillText("A = p + n", 524, 80); ctx.restore();
      if (c.show) {
        const rows = sh.length || 1, y0 = 66, hh = 30 + rows * 16; H.panel(ctx, 10, y0, 206, hh);
        ctx.save(); ctx.font = "600 10px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#9fb3d1"; ctx.fillText("shell    e⁻   max 2n²", 18, y0 + 15);
        sh.forEach((n, i) => { ctx.fillStyle = "#cfe0ff"; ctx.fillText("KLMN"[i] + "  n=" + (i + 1), 18, y0 + 32 + i * 16); ctx.fillStyle = "#79c7ff"; ctx.fillText(String(n), 100, y0 + 32 + i * 16); ctx.fillStyle = "#8fa3c4"; ctx.fillText(String(2 * (i + 1) * (i + 1)), 150, y0 + 32 + i * 16); });
        ctx.restore();
        if (sh.length) H.pill(ctx, 10, y0 + hh + 24, "outer-shell electrons: " + sh[sh.length - 1], "#ffd27a", 10.5);
      }
      if (s.msg) H.pill(ctx, 320, 386, s.msg, "#9dffd0", 11, "center");
      H.pill(ctx, 10, 386, "not to scale: nucleus ≈ 10⁻⁵ × the atom", "#8fa3c4", 9.5);
    },
    readouts(s, c) {
      const e = EL(c.p), A = c.p + c.n, q = c.p - c.e, sh = shellsOf(c.e, c.p), iso = isoName(c.p, c.n);
      const r = [["Element", e.name + " (" + e.sym + ")"], ["Atomic number Z", c.p], ["Mass number A", A + "  (" + c.p + " p + " + c.n + " n)"], ["Isotope notation", e.sym + "-" + A], ["Charge", (q > 0 ? "+" : "") + q + "  (" + c.p + " p⁺ − " + c.e + " e⁻)"],
        ["Electron arrangement", sh.length ? sh.join(", ") : "none"], ["Outer-shell electrons", sh.length ? sh[sh.length - 1] : 0], ["Group · period", (e.col < 3 || e.col > 12 ? (e.col > 12 ? e.col - 10 : e.col) : "transition") + " · " + e.row]];
      if (AR[c.p]) r.push(["Relative atomic mass Ar", AR[c.p] + "  (average of isotopes)"]);
      if (iso && ABUND[iso]) r.push(["Natural abundance of " + iso, ABUND[iso]]);
      return r;
    },
  };
  function ePos(s, i, j, n, t) { const R = ringR(i), a = t * ringW(i) + (j * TAU) / n + i * 0.9; return V3(R * Math.cos(a), R * Math.sin(a), 0).applyQuaternion(s.ringQ[i]); }
  function ionise(S, s, c, ref) {
    if (c.e <= 0) return; const sh = shellsOf(c.e, c.p), i = sh.length - 1, n = sh[i], j = n - 1, from = ePos(s, i, j, n, s.t), dir = from.clone().normalize();
    const m = s.fxPool.find((x) => !x.visible); if (!m) return; m.visible = true; m.children[0].material.opacity = 0.9; m.position.copy(from);
    s.fx.push({ m, mode: "out", from, dir, t: 0, life: 1.8 }); const wasNeutral = c.e === c.p, e = EL(c.p); c.e--; c.iso = isoName(c.p, c.n) || "custom"; ref && ref();
    s.msg = wasNeutral ? "1st ionisation energy of " + e.name + ":  " + e.sym + "(g) → " + e.sym + "⁺(g) + e⁻   ΔH = +" + e.ie + " kJ/mol" : "removing another electron: needs even more energy (the remaining electrons are held more tightly)"; s.msgT = 5;
  }
  function addElectron(S, s, c, ref) {
    if (c.e >= 30) return; const sh = shellsOf(c.e + 1, c.p), i = sh.length - 1, n = sh[i], j = n - 1, life = 1.1, to = ePos(s, i, j, n, s.t + life), from = to.clone().normalize().multiplyScalar(6.5).add(V3(0, 1.5, 0));
    const m = s.fxPool.find((x) => !x.visible); if (!m) return; m.visible = true; m.children[0].material.opacity = 0.9; m.position.copy(from);
    s.fx.push({ m, mode: "in", from, to, t: 0, life, done: () => { c.e++; c.iso = isoName(c.p, c.n) || "custom"; ref && ref(); s.msg = "electron captured → " + (c.p - c.e < 0 ? "negative ion (anion)" : "neutral atom") + ", charge " + (c.p - c.e > 0 ? "+" : "") + (c.p - c.e); s.msgT = 4; } });
  }

  /* =========================================================================== 2. ELECTRON CONFIGURATION */
  const LEVY = { "1s": 0, "2s": 0.95, "2p": 1.75, "3s": 2.65, "3p": 3.4, "4s": 4.1, "3d": 4.7, "4p": 5.5 };
  const KIND = { "1s": ["1s", "s"], "2s": ["2s", "s"], "2p": ["2p", "pz"], "3s": ["3s", "s"], "3p": ["3p", "pz"], "4s": ["3s", "s"], "3d": ["3d", "dz2"], "4p": ["3p", "pz"] };
  const SHAPE = { s: "sphere", p: "dumbbell", d: "cloverleaf" };
  function slot(o, j) { const nb = NB[o[1]]; return j < nb ? { box: j, up: true, nb } : { box: j - nb, up: false, nb }; }
  function makeEvents(z) {
    const au = aufbau(z), ev = [], last = {};                                   // last[o] = index of the event that put the highest electron in o
    ORD.forEach((o) => { for (let j = 0; j < (au[o] || 0); j++) { const sl = slot(o, j), nb = sl.nb; let rule = "Aufbau: fill the lowest-energy empty orbital first"; if (j > 0) rule = j < nb ? "Hund's rule: occupy each box of the sub-shell singly (all ↑) before pairing" : "Pauli exclusion: a second electron in a box must spin the opposite way (↓)"; if (nb === 1 && j === 1) rule = "Pauli exclusion: a second electron in a box must spin the opposite way (↓)"; ev.push({ o, j, rule, hop: false }); } });
    if (z === 24) ev.push({ hop: true, from: "4s", fromJ: 1, o: "3d", j: 4, rule: "Exception: one 4s electron moves to 3d — half-filled 3d⁵ 4s¹ is extra stable" });
    if (z === 29) ev.push({ hop: true, from: "4s", fromJ: 1, o: "3d", j: 9, rule: "Exception: one 4s electron moves to 3d — filled 3d¹⁰ 4s¹ is extra stable" });
    return ev;
  }
  function arrowSpin(up) {
    const g = new T.Group(), m = M.emissive(up ? 0x4fe3c1 : 0xffb454, 1.6), sft = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.34, 10), m), hd = new T.Mesh(new T.ConeGeometry(0.085, 0.17, 14), m);
    sft.position.y = -0.04; hd.position.y = 0.21; g.add(sft, hd); g.rotation.z = up ? 0 : Math.PI; const o = new T.Group(); o.add(g); return o;
  }
  C3.scenes.electronConfig = {
    env: "studio", envOpts: {}, fov: 36, free: false, cam: [[0, 3.4, 13.2], [0.2, 3.4, 0]],
    values: { z: 6, auto: 1 },
    state: () => ({ evs: [], i: 0, t: 0, go: 0, orb: null, cloudK: "" }),
    get controls() { return [
      { type: "select", key: "z", label: "Element", options: ELEMENTS.map((e) => ({ value: e.z, label: e.z + ". " + e.name + " (" + e.sym + ")" })) },
      { type: "toggle", key: "auto", label: "Fill automatically" },
      { type: "button", label: "Add next electron (step by step)", action: (S, s) => { s.go++; } },
      { type: "button", label: "⟲ Replay the filling", action: (S, s, c) => restart(S, s, c), cls: "secondary" },
      { type: "button", label: "Skip to the finished atom", action: (S, s, c) => { s.skip = true; }, cls: "secondary" },
    ]; },
    views: [{ label: "Energy diagram", cam: [[0, 3.4, 13.2], [0.2, 3.4, 0]] }, { label: "Low levels", cam: [[0, 1.2, 6.8], [0, 1.1, 0]] }, { label: "d-block", cam: [[0, 4.9, 6.8], [0, 4.9, 0]] }],
    note: "Aufbau: electrons fill the lowest-energy orbitals first (1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p). Pauli: an orbital holds at most two electrons, with opposite spins. Hund: orbitals of equal energy (the 3 p or 5 d boxes) each get one electron before any pairs up. Chromium and copper are exceptions: a half-filled or full 3d sub-shell is extra stable.",
    onChange(S, s, c, key) { if (key === "z") restart(S, s, c); },
    reset(S, s, c) { c.z = 6; restart(S, s, c); },

    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.plates = []; const plateM = new T.MeshStandardMaterial({ color: 0x15213a, roughness: 0.5, metalness: 0.1, emissive: 0x2563ff, emissiveIntensity: 0 });
      ORD.forEach((o) => { const nb = NB[o[1]], row = []; for (let b = 0; b < nb; b++) { const mat = plateM.clone(), m = new T.Mesh(new T.BoxGeometry(0.64, 0.64, 0.1), mat); m.position.set((b - (nb - 1) / 2) * 0.76, LEVY[o], 0); m.receiveShadow = true; S.scene.add(m);
          const ed = new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({ color: 0x6fa8ff, transparent: true, opacity: 0.8 })); ed.position.copy(m.position); S.scene.add(ed); row.push({ m, mat, x: m.position.x, y: m.position.y }); } s.plates.push({ o, row }); });
      /* energy axis */
      const ax = S.mk.rod(V3(-3.6, -0.5, 0), V3(-3.6, 6.2, 0), 0.012, M.glow(0x9fc4ff, 0.6), 6);
      s.src = S.mk.soft(0x7fc4ff, 1.4, -5.2, 0.3, 0, 0.9); s.srcCore = S.mk.sphere(0.11, M.emissive(0x59b8ff, 3), -5.2, 0.3, 0);
      s.arrows = []; for (let i = 0; i < 30; i++) { const a = arrowSpin(true), b = arrowSpin(false); a.visible = b.visible = false; S.scene.add(a); S.scene.add(b); s.arrows.push({ up: a, dn: b }); }
      s.trail = S.mk.soft(0x9fe6ff, 0.6, 0, 0, 0, 0.9); s.trail.visible = false; s.cloud = null; restart(S, s, c);
    },
    update(S, s, c, dt) {
      s.t += dt; const ev = s.evs, FL = 0.7, DW = 0.18;
      if (s.skip) { s.i = ev.length; s.skip = false; s.ph = -1; }
      const cur = s.i < ev.length ? ev[s.i] : null;
      if (cur) {
        if (s.ph < 0 && (c.auto || s.go > 0)) { s.ph = 0; if (!c.auto) s.go--; }
        if (s.ph >= 0) { s.ph += dt; if (s.ph >= FL + DW) { s.i++; s.ph = -1; } }
      }
      const flying = s.i < ev.length && s.ph >= 0 ? ev[s.i] : null, upto = Math.min(s.i, ev.length);
      const target = (e) => { const pl = s.plates.find((p) => p.o === e.o), sl = slot(e.o, e.j), bx = pl.row[sl.box]; return { p: V3(bx.x, bx.y, 0.1), up: sl.up }; };
      s.arrows.forEach((a) => { a.up.visible = a.dn.visible = false; });
      let k = 0; const slots = [], eIdx = {};
      ev.forEach((e, n) => {
        if (n >= upto + (flying ? 1 : 0)) return; const done = n < upto;
        if (!e.hop) { const idx = k++; slots[idx] = { o: e.o, j: e.j, done }; eIdx[e.o + e.j] = idx; }
        else { const idx = eIdx[e.from + e.fromJ]; slots[idx] = { o: e.o, j: e.j, done, hop: true, fo: e.from, fj: e.fromJ }; eIdx[e.o + e.j] = idx; }
      });
      s.trail.visible = false; const pairN = {}; slots.forEach((sl) => { const kk = sl.o + slot(sl.o, sl.j).box; pairN[kk] = (pairN[kk] || 0) + 1; });
      slots.forEach((sl, idx) => {
        const A = s.arrows[idx], tg = target(sl); let p = tg.p.clone(), up = tg.up;
        if (!sl.done) {
          const f = clamp(s.ph / FL, 0, 1), e = f * f * (3 - 2 * f); let st;
          if (sl.hop) { const fr = target({ o: sl.fo, j: sl.fj }); st = fr.p.clone(); up = e < 0.5 ? fr.up : tg.up; } else st = V3(-5.2, 0.3, 0);
          p = V3().lerpVectors(st, tg.p, e); p.y += Math.sin(e * Math.PI) * 0.9; s.trail.visible = f < 1; s.trail.position.copy(p);
        }
        const g = up ? A.up : A.dn; g.visible = true; g.position.copy(p); if (pairN[sl.o + slot(sl.o, sl.j).box] > 1) g.position.x += up ? -0.14 : 0.14; g.scale.setScalar(sl.done ? 1 : 1.15);
      });
      const co = flying ? flying.o : null;
      s.plates.forEach((pl) => pl.row.forEach((b) => { const on = pl.o === co; b.mat.emissiveIntensity += ((on ? 0.45 + 0.2 * Math.sin(s.t * 5) : 0) - b.mat.emissiveIntensity) * Math.min(1, dt * 10 + (dt === 0 ? 1 : 0)); }));
      const lastE = flying || ev[Math.max(0, Math.min(s.i, ev.length) - 1)] || ev[0]; s.curO = lastE ? lastE.o : null; s.curRule = lastE ? lastE.rule : "";
      const want = s.curO; if (want && want !== s.cloudK) { s.cloudK = want; if (s.cloud) { S.scene.remove(s.cloud.pts); s.cloud.pts.geometry.dispose(); s.cloud.pts.material.dispose(); } const kd = KIND[want]; s.cloud = S.chemKit.orbital(kd[0], { n: 4200, size: 1.35, pt: 0.1, angular: kd[1] }); s.cloud.pts.position.set(5.0, 2.8, 0); }
      if (s.cloud) s.cloud.pts.rotation.y += dt * 0.6;
      const pl = {}; slots.forEach((sl) => { const o = sl.done ? sl.o : sl.hop ? sl.fo : null; if (o) pl[o] = (pl[o] || 0) + 1; });
      s.placed = pl; s.nDone = upto;
    },
    overlay(ctx, s, c, w, h, S) {
      const e = EL(c.z), str = cfgStr(s.placed || {}, c.z, false), done = s.i >= s.evs.length;
      H.pill(ctx, 10, 22, e.name + "  (Z = " + c.z + ")   " + (done ? "complete" : "electron " + Math.min(s.nDone + 1, c.z) + " of " + c.z), "#ffe9b8", 12);
      H.pill(ctx, 10, 44, str || "—", "#9fe3ff", 12);
      /* level labels */
      ctx.save(); ctx.font = "700 12px 'IBM Plex Mono',monospace"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      s.plates.forEach((pl) => { const q = S.proj(V3(pl.row[0].x - 0.55 - (pl.row.length === 1 ? 0 : 0), pl.row[0].y, 0)), x0 = S.proj(V3(-3.55, pl.row[0].y, 0)); ctx.fillStyle = pl.o === s.curO ? "#ffd27a" : "#cfe0ff"; ctx.fillText(pl.o, x0.x - 6, x0.y); ctx.fillStyle = "#7f93b3"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillText("max " + CAP[pl.o], x0.x - 6, x0.y + 12); ctx.font = "700 12px 'IBM Plex Mono',monospace"; });
      ctx.restore();
      const a = S.proj(V3(-3.6, -0.55, 0)); H.pill(ctx, a.x + 8, a.y + 6, "energy ↑", "#9fb3d1", 10);
      if (s.curRule) H.pill(ctx, 10, 68, s.curRule, s.curRule.startsWith("Exception") ? "#ff9d8a" : "#9dffd0", 10);
      const cp = S.proj(V3(5.0, 1.15, 0)); H.pill(ctx, cp.x, cp.y + 10, (s.curO || "") + " orbital · " + (s.curO ? SHAPE[s.curO[1]] : ""), "#bcd0ea", 9.5, "center");
      ctx.save(); ctx.font = "600 10px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#4fe3c1"; ctx.fillText("↑ spin +½", 530, 386 - 58); ctx.fillStyle = "#ffb454"; ctx.fillText("↓ spin −½", 530, 386 - 44); ctx.restore();
    },
    readouts(s, c) {
      const e = EL(c.z), occ = s.placed || {}, str = cfgStr(occ, c.z, false), done = s.i >= s.evs.length, tot = Object.values(occ).reduce((q, v) => q + v, 0);
      let unp = 0; ORD.forEach((o) => { const n = occ[o] || 0, nb = NB[o[1]]; unp += n <= nb ? n : 2 * nb - n; });
      const full = cfgOf(c.z), val = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p"].reduce((m, o) => (full[o] ? o[0] : m), "1");
      const vals = Object.keys(full).filter((o) => o[0] === (full["4s"] || full["4p"] ? "4" : full["3s"] || full["3p"] ? "3" : full["2s"] ? "2" : "1")).reduce((q, o) => q + full[o], 0);
      return [["Element", e.name + " (" + e.sym + ")"], ["Electrons placed", tot + " / " + c.z], ["Configuration", str || "—"], ["Short form", cfgStr(full, c.z, true)], ["Unpaired electrons", unp], ["Magnetism", unp > 0 ? "paramagnetic" : "diamagnetic"], ["Outer-shell electrons", vals],
        ["Shell arrangement", shellsOf(c.z, c.z).join(", ")]].concat(c.z === 24 || c.z === 29 ? [["Note", "exception to Aufbau"]] : []);
    },
  };
  function restart(S, s, c) { s.evs = makeEvents(c.z); s.i = 0; s.ph = -1; s.t = 0; s.go = 0; s.skip = false; s.placed = {}; s.nDone = 0; s.slots = []; }

  /* =========================================================================== 3. PERIODIC TRENDS */
  const PROP = {
    r: { name: "Atomic radius", unit: "pm", f: (e) => e.r, max: 250, graph: 260, trendP: "decreases →", trendG: "increases ↓", col: 0 },
    ie: { name: "First ionisation energy", unit: "kJ/mol", f: (e) => e.ie, max: 2400, graph: 2500, trendP: "increases →", trendG: "decreases ↓", col: 1 },
    en: { name: "Electronegativity", unit: "(Pauling)", f: (e) => e.en, max: 4.0, graph: 4.2, trendP: "increases →", trendG: "decreases ↓", col: 2 },
  };
  const tx = (e) => (e.col - 9.5) * 0.6, tz = (e) => (e.row - 2.5) * 0.66;
  C3.scenes.periodicTrends = {
    env: "studio", envOpts: {}, fov: 38, free: true, cam: [[0, 11.6, 7.4], [0, 0.2, 0.35]],
    values: { prop: "r", z: 11, hl: 1 },
    state: () => ({ t: 0 }),
    get controls() { return [
      { type: "select", key: "prop", label: "Property shown as tile height", options: [{ value: "r", label: "Atomic radius (pm)" }, { value: "ie", label: "First ionisation energy (kJ/mol)" }, { value: "en", label: "Electronegativity" }] },
      { type: "select", key: "z", label: "Selected element (or click a tile)", options: ELEMENTS.map((e) => ({ value: e.z, label: e.z + ". " + e.name + " (" + e.sym + ")" })) },
      { type: "button", label: "◀ Previous element", action: (S, s, c, ref) => { c.z = c.z > 1 ? c.z - 1 : 30; ref(); }, cls: "secondary" },
      { type: "button", label: "Next element ▶", action: (S, s, c, ref) => { c.z = c.z < 30 ? c.z + 1 : 1; ref(); }, cls: "secondary" },
      { type: "toggle", key: "hl", label: "Highlight its period and group" },
    ]; },
    views: [{ label: "Table", cam: [[0, 11.6, 7.4], [0, 0.2, 0.35]] }, { label: "Top", cam: [[0, 12.5, 2.5], [0, 0, 0.2]] }, { label: "Side-on", cam: [[8.5, 3.2, 3.6], [0, 0.8, 0]] }],
    note: "Across a period the nuclear charge rises while electrons are added to the same shell, so the effective nuclear charge Zeff grows: atoms shrink, ionisation energy and electronegativity rise. Down a group extra shells are added, shielding the nucleus: atoms get bigger and ionisation energy and electronegativity fall. The noble gases have no electronegativity value, so their tiles stay flat.",
    reset(S, s, c) { c.z = 11; c.prop = "r"; },
    build(S, s, c) {
      const els = typeof ELEMENTS !== "undefined" ? ELEMENTS : []; s.tiles = [];
      S.mk.box(11.9, 0.12, 3.3, M.matte(0x0d1424, 0.5), 0, -0.07, 0.15).receiveShadow = true;
      els.forEach((e) => { const mat = new T.MeshPhysicalMaterial({ color: 0x4a6cf7, roughness: 0.32, clearcoat: 0.5, emissive: 0xffffff, emissiveIntensity: 0 }), m = S.mk.rbox(0.54, 1, 0.54, 0.05, mat, tx(e), 0.5, tz(e)); m.scale.y = 0.1; m.position.y = 0.05; m.userData.z = e.z; s.tiles.push({ e, m, mat, h: 0.1, col: new T.Color(0x4a6cf7) }); });
      s.sphere = S.mk.sphere(1, new T.MeshPhysicalMaterial({ color: 0xffb454, roughness: 0.25, clearcoat: 0.8, transparent: true, opacity: 0.95 }), 0, 0.5, 3.1);
      s.ghost = new T.Mesh(new T.SphereGeometry(1, 28, 20), new T.MeshBasicMaterial({ color: 0x9fc4ff, wireframe: true, transparent: true, opacity: 0.35 })); S.scene.add(s.ghost);
      s.rad = 0.5; s.hv = {};
      /* click a tile to select it */
      const rc = new T.Raycaster(), ndc = new T.Vector2(); let d0 = null;
      const dn = (ev) => { d0 = [ev.clientX, ev.clientY]; };
      const up = (ev) => { if (!d0) return; const moved = Math.hypot(ev.clientX - d0[0], ev.clientY - d0[1]); d0 = null; if (moved > 4) return; const r = S.c3.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); rc.setFromCamera(ndc, S.camera); const hit = rc.intersectObjects(s.tiles.map((t) => t.m), false)[0]; if (hit) { c.z = hit.object.userData.z; s.dirty = true; } };
      S.c3.addEventListener("pointerdown", dn); S.c3.addEventListener("pointerup", up); S.cleanup = () => { S.c3.removeEventListener("pointerdown", dn); S.c3.removeEventListener("pointerup", up); };
    },
    update(S, s, c, dt) {
      const P = PROP[c.prop], sel = EL(c.z); s.t += dt;
      s.tiles.forEach((t) => {
        const v = P.f(t.e), has = v != null, norm = has ? v / P.max : 0, tgtH = has ? 0.12 + norm * 1.5 : 0.07;
        t.h += (tgtH - t.h) * Math.min(1, dt * 6 + (dt === 0 ? 0 : 0)); t.m.scale.y = t.h; t.m.position.y = t.h / 2;
        const tcol = has ? new T.Color().setHSL(0.62 - 0.62 * clamp(norm, 0, 1), 0.72, 0.5) : new T.Color(0x56606f); t.col.lerp(tcol, Math.min(1, dt * 6)); t.mat.color.copy(t.col);
        const same = t.e.row === sel.row || t.e.col === sel.col, isSel = t.e.z === sel.z; t.mat.emissiveIntensity += ((isSel ? 0.55 + 0.25 * Math.sin(s.t * 5) : c.hl && same ? 0.16 : 0) - t.mat.emissiveIntensity) * Math.min(1, dt * 8);
        t.mat.emissive.set(isSel ? 0xffe9a0 : 0xffffff);
      });
      const rr = sel.r * 0.0052; s.rad += (rr - s.rad) * Math.min(1, dt * 6); s.sphere.scale.setScalar(s.rad); s.sphere.position.set(-2.6, s.rad, 2.9); s.sphere.material.color.setHSL(0.62 - 0.62 * clamp((PROP[c.prop].f(sel) || 0) / PROP[c.prop].max, 0, 1), 0.72, 0.52);
      s.ghost.scale.setScalar(53 * 0.0052); s.ghost.position.set(-0.9, 53 * 0.0052, 2.9);
    },
    overlay(ctx, s, c, w, h, S) {
      const P = PROP[c.prop], sel = EL(c.z), els = typeof ELEMENTS !== "undefined" ? ELEMENTS : [];
      H.pill(ctx, 10, 22, P.name + (P.unit ? "  (" + P.unit + ")" : "") + "  =  height of each tile", "#ffe9b8", 11.5);
      H.pill(ctx, 10, 44, sel.name + ": " + (P.f(sel) == null ? "no value (noble gas)" : P.f(sel) + " " + P.unit), "#9fe3ff", 11.5);
      ctx.save(); ctx.font = "700 11px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      s.tiles.forEach((t) => { const q = S.proj(V3(tx(t.e), t.h + 0.02, tz(t.e) + 0.05)); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.fillStyle = t.e.z === sel.z ? "#ffe9a0" : "#fff"; ctx.strokeText(t.e.sym, q.x, q.y); ctx.fillText(t.e.sym, q.x, q.y); }); ctx.restore();
      /* trend arrows */
      { const a = V3(-5.3, 0.04, -1.45), b = V3(5.3, 0.04, -1.45); H.vec(ctx, S, a, b, "#7dffbd"); const q = S.proj(V3(0, 0.04, -1.45)); H.pill(ctx, q.x, q.y - 6, "across a period: " + P.trendP, "#7dffbd", 10, "center"); }
      { const a = V3(-5.85, 0.04, -0.9), b = V3(-5.85, 0.04, 1.3); H.vec(ctx, S, a, b, "#ffb27d"); const q = S.proj(V3(-5.85, 0.04, 1.45)); H.pill(ctx, q.x - 8, q.y + 18, "down a group: " + P.trendG, "#ffb27d", 10); }
      /* property vs Z graph */
      const gx = 396, gy = 236, gw = 236, gh = 152, segs = []; let cur = []; els.forEach((e) => { const v = P.f(e); if (v == null) { if (cur.length > 1) segs.push(cur); cur = []; } else cur.push([e.z, v]); }); if (cur.length > 1) segs.push(cur);
      H.graph(ctx, gx, gy, gw, gh, { series: segs.map((p) => ({ pts: p, color: "#ffd27a", width: 2 })), xmin: 0, xmax: 30, ymin: 0, ymax: P.graph, ticksX: 6, ticksY: 4, xl: "atomic number Z", yl: P.name.split(" ").slice(-1)[0].toLowerCase() + (P.unit ? " / " + P.unit : ""), dot: P.f(sel) == null ? undefined : [sel.z, P.f(sel), "#fff"] });
      const rp = S.proj(V3(-1.6, s.rad * 2 + 0.1, 3.15)); H.pill(ctx, 10, 386, "to scale: " + sel.sym + " r = " + sel.r + " pm   (ghost = H, 53 pm)", "#ffcf8a", 10);
    },
    readouts(s, c) {
      const P = PROP[c.prop], e = EL(c.z), els = typeof ELEMENTS !== "undefined" ? ELEMENTS : [], per = els.filter((x) => x.row === e.row && P.f(x) != null);
      const grp = e.col <= 2 ? e.col : e.col >= 13 ? e.col - 10 : "transition metal";
      const r = [["Element", e.name + " (" + e.sym + ")"], ["Atomic number", e.z], ["Period · group", e.row + " · " + grp], ["Atomic radius", e.r + " pm"], ["1st ionisation energy", e.ie + " kJ/mol"], ["Electronegativity", e.en == null ? "—" : e.en],
        ["Effective nuclear charge Zeff", zeff(e.z).toFixed(2) + "  (Slater)"], ["Electron configuration", cfgStr(cfgOf(e.z), e.z, true)]];
      if (per.length > 1) { const a = per[0], b = per[per.length - 1]; r.push(["Period " + e.row + " trend", a.sym + " " + P.f(a) + " → " + b.sym + " " + P.f(b) + " " + P.unit]); }
      return r;
    },
  };
})();
