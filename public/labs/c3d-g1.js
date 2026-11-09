/* c3d-g1.js — chemistry 3D gap scenes: models of the atom (Dalton, Thomson, Rutherford, Bohr) and physical vs chemical change */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;

  /* ---------- wavelength (nm) → sRGB, for spectral lines ---------- */
  function waveRGB(nm) {
    let r = 0, g = 0, b = 0; if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else if (nm <= 780) { r = 1; }
    const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1; if (nm < 380 || nm > 780) return [200, 200, 220]; return [r * f * 255, g * f * 255, b * f * 255];
  }
  const SERIES = { 1: "Lyman (ultraviolet)", 2: "Balmer (visible)", 3: "Paschen (infrared)", 4: "Brackett (infrared)", 5: "Pfund (infrared)" };
  const MODES = ["Dalton (1808): indivisible solid spheres", "Thomson (1897): cathode rays and the plum-pudding atom", "Rutherford (1911): α-particle scattering by gold foil", "Bohr (1913): energy levels and line spectra"];
  const RB = 0.1, EPS0 = 8.854e-12, QE = 1.602e-19, ME = 9.109e-31;

  const AMV = [[[1.4, 2.8, 7.6], [1.0, 1.2, 0]], [[-0.6, 3.3, 10.2], [-0.9, 1.4, 0]], [[2.6, 4.6, 8.8], [1.3, 1.0, 0]], [[1.3, 6.0, 7.4], [1.3, 1.2, 0]]];
  C3.scenes.atomModels = {
    env: "chemlab", envOpts: { w: 26, d: 11, wallH: 26, shadowArea: 11 }, envI: 0.72, fov: 36, free: true, cam: [[-0.6, 3.3, 10.2], [-0.9, 1.4, 0]],
    values: { mode: 1, Vp: 300, Va: 2000, rate: 120, E: 5, b: 60, ni: 3, nf: 2 },
    state: () => ({ t: 0, hist: new Array(18).fill(0), fired: 0, back: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Model of the atom", options: MODES.map((m, i) => ({ value: i, label: m })) },
        { type: "range", key: "Vp", label: "Thomson: voltage across the deflecting plates (V)", min: -600, max: 600, step: 10 },
        { type: "range", key: "Va", label: "Thomson: accelerating voltage (V)", min: 1000, max: 5000, step: 100 },
        { type: "range", key: "rate", label: "Rutherford: α-particles fired per second", min: 10, max: 600, step: 10 },
        { type: "range", key: "E", label: "Rutherford: α-particle energy (MeV)", min: 2, max: 8, step: 0.5 },
        { type: "range", key: "b", label: "Rutherford close-up: impact parameter b (fm)", min: 5, max: 300, step: 5 },
        { type: "button", label: "Rutherford: clear the counter", cls: "secondary", action: (S, s) => { s.hist.fill(0); s.fired = 0; s.back = 0; } },
        { type: "select", key: "ni", label: "Bohr: electron starts in level n =", options: [2, 3, 4, 5, 6].map((n) => ({ value: n, label: "n = " + n })) },
        { type: "select", key: "nf", label: "Bohr: electron falls to level n =", options: [1, 2, 3].map((n) => ({ value: n, label: "n = " + n + " (" + SERIES[n] + ")" })) },
        { type: "button", label: "Bohr: excite the electron, then let it fall (emit a photon)", action: (S, s, c) => { if (c.nf >= c.ni) { s.msg = "the final level must be lower than the starting level"; return; } s.msg = ""; s.jump = { ph: 0, t: 0 }; } },
      ];
    },
    views: [{ label: "Apparatus", cam: (S, s, c) => AMV[c.mode | 0] }, { label: "Close", cam: [[0.3, 2.4, 5.6], [0, 1.4, 0]] }, { label: "Nucleus close-up (Rutherford)", cam: [[0, 2.0, 2.8], [0, 1.6, -3.4]] }],
    note: "Dalton: matter is made of tiny indivisible atoms; atoms of one element are identical and combine in simple whole-number ratios. Thomson found that cathode rays bend towards the positive plate, so they are negatively charged particles (electrons) with e/m = 1.76 × 10¹¹ C/kg, and pictured the atom as a sphere of positive charge with electrons embedded in it. Rutherford fired α-particles at thin gold foil: nearly all went straight through, a few were deflected through large angles and about 1 in 8000 bounced back, so the atom is mostly empty space with a tiny dense positive nucleus. Bohr: electrons move only in fixed energy levels Eₙ = −13.6/n² eV; an electron falling from a higher to a lower level emits a photon of energy ΔE = hf, which gives the line spectrum of hydrogen.",
    onChange(S, s, c, key) { if (key === "mode") { const v = AMV[c.mode | 0]; C3.setView(S, { cam: v }); s.jump = null; } if (key === "b" || key === "E") s.trackDirty = true; },
    reset(S, s, c) { Object.assign(c, { mode: 1, Vp: 300, Va: 2000, rate: 120, E: 5, b: 60, ni: 3, nf: 2 }); s.hist.fill(0); s.fired = 0; s.back = 0; s.jump = null; s.trackDirty = true; C3.setView(S, { cam: AMV[1] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K;
      S.mk.box(12, 0.08, 4.4, M.matte(0x9e8a6e, 0.62), 0, -0.04 + 0.04, 0).receiveShadow = true;
      /* ---- Dalton ---- */
      const gD = new T.Group(); sc.add(gD); s.gD = gD;
      const big = new T.Mesh(new T.SphereGeometry(0.85, 64, 48), new T.MeshPhysicalMaterial({ color: 0x8c8f96, roughness: 0.35, clearcoat: 0.6, metalness: 0.1 })); big.position.set(-1.6, 1.25, 0); big.castShadow = true; gD.add(big);
      const ped = new T.Mesh(new T.CylinderGeometry(0.35, 0.45, 0.4, 32), M.wood()); ped.position.set(-1.6, 0.2, 0); ped.castShadow = ped.receiveShadow = true; gD.add(ped);
      s.dAtoms = [["H", 0.22, 0xf4f4f4, 0.4], ["C", 0.34, 0x3b3f46, 1.0], ["N", 0.36, 0x3454e8, 1.6], ["O", 0.38, 0xe8281c, 2.25]].map(([el, r, col, x]) => { const m = new T.Mesh(new T.SphereGeometry(r, 40, 30), new T.MeshPhysicalMaterial({ color: col, roughness: 0.3, clearcoat: 0.8 })); m.position.set(x + 0.2, r + 0.05, 0.9); m.castShadow = true; gD.add(m); return { el, m }; });
      const mkPair = (cols, x, z) => { cols.forEach((cc, i) => { const m = new T.Mesh(new T.SphereGeometry(0.2, 32, 24), new T.MeshPhysicalMaterial({ color: cc, roughness: 0.3, clearcoat: 0.8 })); m.position.set(x + i * 0.38, 0.22, z); m.castShadow = true; gD.add(m); }); };
      mkPair([0x3b3f46, 0xe8281c], 0.8, -0.7); mkPair([0xe8281c, 0x3b3f46, 0xe8281c], 2.0, -0.7);
      /* ---- Thomson: cathode-ray tube (Maltese-free deflection tube) + plum pudding ---- */
      const gT = new T.Group(); sc.add(gT); s.gT = gT; const ty = 1.55;
      const prof = []; for (let i = 0; i <= 10; i++) { const x = -3.1 + i * 0.32; prof.push([0.42, x]); } for (let i = 0; i <= 14; i++) { const a = i / 14; prof.push([0.42 + a * 0.62, 0.1 + a * 0.85]); } prof.push([1.04, 1.0], [1.06, 1.05]);
      const tubeG = new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), 64); tubeG.rotateZ(-Math.PI / 2);
      const tube = new T.Mesh(tubeG, K.glassMat({ opacity: 0.08, env: 3 })); tube.position.y = ty; tube.renderOrder = 4; gT.add(tube);
      const screen = new T.Mesh(new T.CircleGeometry(1.02, 64), new T.MeshStandardMaterial({ color: 0x1a2a1c, emissive: 0x0b3a14, emissiveIntensity: 0.6, roughness: 0.6, side: T.DoubleSide })); screen.rotation.y = -Math.PI / 2; screen.position.set(1.0, ty, 0); gT.add(screen); s.screenX = 1.0;
      const cath = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.06, 32), M.steel()); cath.rotation.z = Math.PI / 2; cath.position.set(-3.0 - 0.0, ty, 0); gT.add(cath);
      const heat = new T.Mesh(new T.TorusGeometry(0.1, 0.012, 8, 30), M.emissive(0xff7a20, 3)); heat.rotation.y = Math.PI / 2; heat.position.set(-3.06, ty, 0); gT.add(heat);
      const anode = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.04, 40, 1, false), M.aluminium()); anode.rotation.z = Math.PI / 2; anode.position.set(-2.6, ty, 0); gT.add(anode);
      const slit = new T.Mesh(new T.CircleGeometry(0.04, 20), M.matte(0x020202, 1)); slit.rotation.y = Math.PI / 2; slit.position.set(-2.57, ty, 0); gT.add(slit);
      s.platesX = [-2.38, -1.55]; const pl = M.aluminium(); [1, -1].forEach((k) => { const p = new T.Mesh(new T.BoxGeometry(0.83, 0.02, 0.42), pl); p.position.set(-1.965, ty + k * 0.2, 0); gT.add(p); const lead = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1, 8), M.copper()); S.setRod(lead, V3(-1.925, ty + k * 0.2, 0), V3(-1.925, ty + k * 0.75, 0)); gT.add(lead); });
      s.plusTop = true; [[-3.4, 0.45], [0.2, 0.45]].forEach(([x, w]) => { const st = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, ty - 0.2, 16), M.steel()); st.position.set(x === -3.4 ? -2.9 : -0.6, (ty - 0.2) / 2, 0); st.castShadow = true; gT.add(st); const cl = new T.Mesh(new T.TorusGeometry(0.45, 0.03, 8, 30, Math.PI), M.steel()); cl.rotation.y = Math.PI / 2; cl.rotation.z = Math.PI; cl.position.set(st.position.x, ty - 0.02, 0); gT.add(cl); });
      const psu = S.mk.rbox(1.1, 0.55, 0.7, 0.05, M.plastic(0x2b3340, 0.4), -2.6, 0.28, -1.4); sc.remove(psu); gT.add(psu);
      s.beam = new T.InstancedMesh(new T.SphereGeometry(0.022, 8, 6), M.glow(0x7fd4ff, 0.9), 70); s.beam.frustumCulled = false; gT.add(s.beam);
      s.spot = S.mk.soft(0x7dff8a, 0.5, 0, 0, 0, 0.95); sc.remove(s.spot); gT.add(s.spot);
      const pud = new T.Mesh(new T.SphereGeometry(0.85, 64, 48), new T.MeshPhysicalMaterial({ color: 0xff8fb0, roughness: 0.35, transmission: 0, transparent: true, opacity: 0.42, clearcoat: 1, depthWrite: false })); pud.position.set(-4.3, 1.25, 0.5); pud.renderOrder = 5; gT.add(pud); s.pud = pud;
      s.plums = []; for (let i = 0; i < 14; i++) { const d = V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0.15, 0.7)); const e = new T.Mesh(new T.SphereGeometry(0.075, 20, 16), new T.MeshPhysicalMaterial({ color: 0x2f6bff, emissive: 0x0a2a8a, roughness: 0.25, clearcoat: 1 })); e.position.copy(pud.position).add(d); gT.add(e); s.plums.push({ e, d, ph: rnd(0, 6) }); }
      /* ---- Rutherford: source, gold foil, ZnS screen ---- */
      const gR = new T.Group(); sc.add(gR); s.gR = gR; const ry = 1.0;
      const base = new T.Mesh(new T.CylinderGeometry(2.5, 2.5, 0.12, 80), M.matte(0x2a2f37, 0.5)); base.position.y = 0.06; base.receiveShadow = true; gR.add(base);
      const lead = new T.Mesh(new T.BoxGeometry(0.7, 0.7, 0.7), M.iron()); lead.material.color.setHex(0x55585e); lead.position.set(-1.9, ry, 0); lead.castShadow = true; gR.add(lead);
      const col = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.6, 16, 1, true), M.matte(0x111111, 0.6)); col.rotation.z = Math.PI / 2; col.position.set(-1.35, ry, 0); gR.add(col);
      const lbl = G.labelCard("Po-210  α source", 6, 1.4, { bg: "#ffd34d" }); lbl.position.set(-1.9, ry, 0.352); gR.add(lbl);
      const foil = new T.Mesh(new T.BoxGeometry(0.004, 0.75, 0.75), M.gold()); foil.position.set(0, ry, 0); gR.add(foil);
      const fr = new T.Mesh(new T.TorusGeometry(0.42, 0.025, 8, 4), M.steel()); fr.rotation.y = Math.PI / 2; fr.rotation.x = Math.PI / 4; fr.position.set(0, ry, 0); gR.add(fr);
      const fst = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, ry - 0.42, 12), M.steel()); fst.position.set(0, (ry - 0.42) / 2 + 0.1, 0); gR.add(fst);
      const scr = new T.Mesh(new T.CylinderGeometry(2.0, 2.0, 0.9, 96, 1, true, -Math.PI / 2 + 0.25, TAU - 0.5), new T.MeshStandardMaterial({ color: 0x1b2620, emissive: 0x06220c, roughness: 0.7, side: T.DoubleSide })); scr.position.set(0, ry, 0); scr.receiveShadow = true; gR.add(scr);
      const scope = new T.Mesh(new T.CylinderGeometry(0.09, 0.12, 0.7, 24), M.iron()); scope.rotation.z = Math.PI / 2; scope.position.set(2.4, ry, 0); gR.add(scope); s.scope = scope;
      s.alphas = []; const am = M.glow(0xffa040, 1); for (let i = 0; i < 90; i++) { const m = new T.Mesh(new T.SphereGeometry(0.03, 10, 8), am); m.visible = false; gR.add(m); s.alphas.push({ m, on: false }); }
      s.flashes = []; for (let i = 0; i < 24; i++) { const f = S.mk.soft(0x8dff9a, 0.22, 0, 0, 0, 1); sc.remove(f); f.visible = false; gR.add(f); s.flashes.push({ f, age: 9 }); }
      s.acc = 0; s.ry = ry;
      /* nucleus close-up (behind): gold nucleus Z = 79 and hyperbolic α tracks */
      const gN = new T.Group(); gN.position.set(0, 1.6, -3.4); sc.add(gN); s.gN = gN;
      const nuc = new T.Group(); for (let i = 0; i < 60; i++) { const m = new T.Mesh(new T.SphereGeometry(0.045, 14, 10), new T.MeshPhysicalMaterial({ color: i % 2 ? 0xe04a3a : 0xc8ccd2, roughness: 0.3, clearcoat: 0.8 })); const d = V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(Math.cbrt(Math.random()) * 0.16); m.position.copy(d); nuc.add(m); } gN.add(nuc); s.nuc = nuc;
      const halo = S.mk.soft(0xffd27a, 0.9, 0, 0, 0, 0.35); sc.remove(halo); gN.add(halo);
      s.tracks = []; for (let i = 0; i < 9; i++) { const ln = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0.45 })); gN.add(ln); s.tracks.push(ln); }
      s.mainTrack = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffffff })); gN.add(s.mainTrack); s.aDot = new T.Mesh(new T.SphereGeometry(0.05, 14, 10), M.glow(0xffa040, 1)); gN.add(s.aDot); s.trackDirty = true; s.trkT = 0;
      /* ---- Bohr ---- */
      const gB = new T.Group(); gB.position.set(0, 1.4, 0); sc.add(gB); s.gB = gB;
      const nb = new T.Mesh(new T.SphereGeometry(0.1, 32, 24), new T.MeshPhysicalMaterial({ color: 0xe04a3a, emissive: 0x401008, roughness: 0.3, clearcoat: 1 })); gB.add(nb);
      s.rings = []; for (let n = 1; n <= 6; n++) { const r = RB * n * n, rg = new T.Mesh(new T.TorusGeometry(r, 0.008 + 0.002 * n, 8, 160), new T.MeshBasicMaterial({ color: 0x8fb4ff, transparent: true, opacity: 0.5 })); rg.rotation.x = Math.PI / 2; gB.add(rg); s.rings.push(rg); }
      s.el = new T.Mesh(new T.SphereGeometry(0.07, 20, 16), new T.MeshPhysicalMaterial({ color: 0x3f8bff, emissive: 0x1a4cff, emissiveIntensity: 1.2, roughness: 0.2 })); gB.add(s.el); s.elGlow = S.mk.soft(0x6aa8ff, 0.4, 0, 0, 0, 0.7); sc.remove(s.elGlow); gB.add(s.elGlow);
      s.photon = S.mk.soft(0xffffff, 0.5, 0, 0, 0, 1); sc.remove(s.photon); s.photon.visible = false; gB.add(s.photon); s.wave = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffffff })); gB.add(s.wave);
      s.n = c.ni; s.ang = 0; s.lines = [];
      if ((c.mode | 0) !== 1) C3.scenes.atomModels.onChange(S, s, c, "mode");
    },
    update(S, s, c, dt) {
      const m = c.mode | 0; s.gD.visible = m === 0; s.gT.visible = m === 1; s.gR.visible = m === 2; s.gN.visible = m === 2; s.gB.visible = m === 3; const t = S.t;
      if (m === 0) s.dAtoms.forEach((a, i) => { a.m.rotation.y += dt * 0.4; });
      if (m === 1) {
        const ty = 1.55, Va = c.Va, L = 0.05, d = 0.02, D = 0.15, V = c.Vp, k = V / (2 * d * Va); /* y(x) = V x²/(4 d Va) inside the plates (m) */
        const yIn = (xm) => (V * xm * xm) / (4 * d * Va), yOut = yIn(L), slope = (V * L) / (2 * d * Va); s.yScreen = yOut + slope * D; s.vel = Math.sqrt(2 * QE * Va / ME);
        const U2M = 0.3 / 0.05; /* scene units per metre along x is 6 (1 unit = 6 cm) → 1 m = 16.67 u */ const um = 1 / 0.06;
        const x0 = -2.95, xp0 = s.platesX[0], xp1 = s.platesX[1], xs = s.screenX, mm = new T.Matrix4();
        for (let i = 0; i < 70; i++) { const f = ((i / 70) + t * 1.6) % 1, x = lerp(x0, xs, f); let y = 0; if (x > xp0) { const xm = (Math.min(x, xp1) - xp0) / um; y = yIn(xm); if (x > xp1) y = yOut + slope * ((x - xp1) / um); }
          const yy = ty + clamp(y * um, -0.95, 0.95); mm.makeTranslation(x, yy, 0); s.beam.setMatrixAt(i, mm); } s.beam.instanceMatrix.needsUpdate = true;
        s.spot.position.set(xs - 0.01, ty + clamp(s.yScreen * um, -0.95, 0.95), 0); s.spot.material.opacity = 0.75 + 0.2 * Math.sin(t * 40);
        s.plums.forEach((p) => { p.e.position.copy(s.pud.position).add(p.d).addScaledVector(V3(Math.sin(t * 2 + p.ph), Math.cos(t * 1.7 + p.ph), 0), 0.012); });
      }
      if (m === 2) {
        const ry = s.ry, d0 = (2 * 79 * 1.44) / c.E; /* closest approach, fm */ const bmax = (d0 / 2) * Math.sqrt(8000);
        s.acc += c.rate * dt; while (s.acc >= 1) { s.acc -= 1; const a = s.alphas.find((q) => !q.on); if (!a) break; const b = bmax * Math.sqrt(Math.random()), th = 2 * Math.atan(d0 / (2 * b)), phi = rnd(0, TAU);
          Object.assign(a, { on: true, x: -1.45, th, phi, y0: rnd(-0.03, 0.03), z0: rnd(-0.03, 0.03), out: false, r: 0 }); a.m.visible = true; s.fired++; const bin = Math.min(17, Math.floor(th / Math.PI * 18)); s.hist[bin]++; if (th > Math.PI / 2) s.back++; }
        const sp = 7;
        s.alphas.forEach((a) => { if (!a.on) return; if (!a.out) { a.x += sp * dt; a.m.position.set(a.x, ry + a.y0, a.z0); if (a.x >= 0) { a.out = true; a.r = 0; } }
          else { a.r += sp * dt; const dir = V3(Math.cos(a.th), Math.sin(a.th) * Math.sin(a.phi), Math.sin(a.th) * Math.cos(a.phi)); a.m.position.set(dir.x * a.r, ry + a.y0 + dir.y * a.r, a.z0 + dir.z * a.r);
            const hor = Math.hypot(a.m.position.x, a.m.position.z); if (hor >= 1.98 || Math.abs(a.m.position.y - ry) > 0.45) { a.on = false; a.m.visible = false; if (Math.abs(a.m.position.y - ry) <= 0.45) { const f = s.flashes.find((q) => q.age > 0.4) || s.flashes[0]; f.age = 0; f.f.visible = true; f.f.position.copy(a.m.position).multiplyScalar(0.985); f.f.position.y = a.m.position.y; } } } });
        s.flashes.forEach((f) => { if (f.age > 0.4) { f.f.visible = false; return; } f.age += dt; f.f.material.opacity = 1 - f.age / 0.4; });
        if (s.trackDirty) { s.trackDirty = false; const bs = [10, 20, 35, 55, 80, 120, 170, 230, 300], sc = 0.004; /* fm → units */
          const traj = (b) => { const pts = []; let x = -420, y = b, vx = 1, vy = 0, acc = 0; const kk = d0 / 2; for (let i = 0; i < 20000; i++) { const r = Math.hypot(x, y), dt2 = clamp(r * 0.004, 0.02, 2), a = kk / (r * r); vx += a * (x / r) * dt2; vy += a * (y / r) * dt2; x += vx * dt2; y += vy * dt2; acc += Math.hypot(vx, vy) * dt2; if (acc > 6) { acc = 0; pts.push(V3(x * sc, y * sc, 0)); } if (Math.hypot(x, y) > 460 && i > 50) break; } return pts; };
          s.tracks.forEach((ln, i) => { ln.geometry.dispose(); ln.geometry = new T.BufferGeometry().setFromPoints(traj(bs[i])); }); s.main = traj(c.b); s.mainTrack.geometry.dispose(); s.mainTrack.geometry = new T.BufferGeometry().setFromPoints(s.main);
          const last = s.main[s.main.length - 1], prev = s.main[s.main.length - 3]; s.thB = Math.atan2(last.y - prev.y, last.x - prev.x); }
        s.trkT = (s.trkT + dt * 0.35) % 1; const idx = Math.floor(s.trkT * (s.main.length - 1)); s.aDot.position.copy(s.main[idx]); s.nuc.rotation.y += dt * 0.3;
      }
      if (m === 3) {
        const J = s.jump; let r = RB * s.n * s.n;
        if (J) { J.t += dt; if (J.ph === 0) { const k = clamp(J.t / 0.9, 0, 1); r = lerp(RB * s.n * s.n, RB * c.ni * c.ni, k); if (k >= 1) { s.n = c.ni; J.ph = 1; J.t = 0; } } else if (J.ph === 1) { r = RB * c.ni * c.ni; if (J.t > 1.2) { J.ph = 2; J.t = 0; } } else if (J.ph === 2) { const k = clamp(J.t / 0.35, 0, 1); r = lerp(RB * c.ni * c.ni, RB * c.nf * c.nf, k); if (k >= 1) { s.n = c.nf; J.ph = 3; J.t = 0; const dE = 13.6 * (1 / (c.nf * c.nf) - 1 / (c.ni * c.ni)), nm = 1239.84 / dE; s.lastLine = { nm, dE, ni: c.ni, nf: c.nf }; if (!s.lines.some((q) => Math.abs(q.nm - nm) < 0.5)) s.lines.push(s.lastLine); J.dir = V3(Math.cos(s.ang), 0, -Math.sin(s.ang)); J.p0 = V3(Math.cos(s.ang) * r, 0, -Math.sin(s.ang) * r); J.col = waveRGB(nm); } } else { if (J.t > 2.4) s.jump = null; } }
        s.ang += dt * 3.2 / Math.pow(Math.max(1, r / RB), 0.75); s.el.position.set(Math.cos(s.ang) * r, 0, -Math.sin(s.ang) * r); s.elGlow.position.copy(s.el.position);
        s.rings.forEach((rg, i) => { rg.material.opacity = i + 1 === s.n ? 0.95 : 0.35; rg.material.color.setHex(i + 1 === s.n ? 0xffd27a : 0x8fb4ff); });
        const ph = J && J.ph === 3; s.photon.visible = ph; s.wave.visible = ph;
        if (ph) { const d = J.t * 2.4, p = J.p0.clone().addScaledVector(J.dir, d); s.photon.position.copy(p); s.photon.material.color.copy(G.col(J.col)); s.photon.material.opacity = clamp(1.2 - J.t / 2.4, 0, 1);
          const pts = [], side = V3(0, 1, 0); for (let i = 0; i <= 60; i++) { const q = i / 60 * Math.min(d, 1.4); pts.push(p.clone().addScaledVector(J.dir, -q).addScaledVector(side, 0.08 * Math.sin(q * 30 - J.t * 20))); } s.wave.geometry.dispose(); s.wave.geometry = new T.BufferGeometry().setFromPoints(pts); s.wave.material.color.copy(G.col(J.col)); }
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250; ctx.save();
      if (m === 0) {
        G.titles(ctx, "Dalton's atomic theory (1808)", "atoms: tiny, indivisible, identical for one element");
        s.dAtoms.forEach((a) => G.tag(ctx, S, a.m.position.clone().add(V3(0, 0.45, 0)), a.el, "#ffe9b8", 9));
        G.tag(ctx, S, V3(1.0, 0.65, -0.7), "CO  (1 : 1)", "#cfe0f5", 8.5); G.tag(ctx, S, V3(2.4, 0.65, -0.7), "CO₂  (1 : 2)", "#cfe0f5", 8.5);
        G.panel(ctx, px, 58, 240, "Postulates", ["1. All matter is made of tiny particles called atoms.", "2. Atoms can neither be created nor destroyed (conservation of mass).", "3. Atoms of the same element are identical in mass and properties.", "4. Atoms combine in simple whole-number ratios to form compounds.", ["Later corrected: atoms contain electrons, protons and neutrons; isotopes have different masses.", "#ffb8a8"]]);
      } else if (m === 1) {
        G.titles(ctx, "Thomson: cathode rays bend towards the + plate", "electrons are negative particles in every atom: the plum-pudding model");
        const top = c.Vp >= 0 ? "+" : "−", bot = c.Vp >= 0 ? "−" : "+"; G.tag(ctx, S, V3(-1.925, 1.55 + 0.82, 0), top + " plate", top === "+" ? "#ff9d8a" : "#9fd0ff", 9); G.tag(ctx, S, V3(-1.925, 1.55 - 0.82, 0), bot + " plate", bot === "+" ? "#ff9d8a" : "#9fd0ff", 9);
        G.tag(ctx, S, V3(-3.0, 2.2, 0), "cathode (−)", "#9fd0ff", 8.5); G.tag(ctx, S, V3(-2.6, 1.05, 0), "anode (+)", "#ff9d8a", 8.5); G.tag(ctx, S, V3(1.0, 2.75, 0), "fluorescent screen", "#8dffb8", 8.5); G.tag(ctx, S, V3(-4.3, 0.2, 0.5), "+ sphere with embedded e⁻", "#ffc0d6", 8.5);
        G.panel(ctx, px, 58, 240, "Measurement", ["accelerating p.d. Vₐ = " + c.Va + " V", "electron speed v = √(2eVₐ/m) = " + (s.vel / 1e7).toFixed(2) + " × 10⁷ m/s", "plate p.d. V = " + c.Vp + " V, gap d = 2.0 cm, length 5.0 cm", "deflection on screen y = " + (s.yScreen * 100).toFixed(2) + " cm " + (s.yScreen > 0 ? "(up)" : s.yScreen < 0 ? "(down)" : ""), ["e/m = 1.76 × 10¹¹ C/kg: about 1840 times that of H⁺, so the particle is far lighter than any atom", "#ffe9b8"]]);
      } else if (m === 2) {
        G.titles(ctx, "Rutherford–Geiger–Marsden: α-particles on gold foil", "most pass straight through; a very few bounce back");
        G.tag(ctx, S, V3(-1.9, 1.65, 0), "α source in lead block", "#ffd27a", 8.5); G.tag(ctx, S, V3(0, 1.7, 0), "gold foil", "#ffe08a", 8.5); G.tag(ctx, S, V3(-1.2, 1.75, -1.6), "ZnS screen (flashes)", "#8dffb8", 8.5);
        G.tag(ctx, S, V3(0, 2.25, -3.4), "nucleus close-up (Z = 79)", "#ffe9b8", 8.5);
        const mx = Math.max(1, ...s.hist.map((v) => Math.log10(1 + v))); H.panel(ctx, px, 58, 240, 132); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.textAlign = "left"; ctx.fillText("Counts vs scattering angle (log)", px + 8, 73);
        s.hist.forEach((v, i) => { const hh = Math.log10(1 + v) / mx * 80; ctx.fillStyle = i >= 9 ? "#ff9d8a" : "#ffd27a"; ctx.fillRect(px + 12 + i * 12.5, 168 - hh, 10, hh); }); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ["0°", "45°", "90°", "135°", "180°"].forEach((l, i) => ctx.fillText(l, px + 8 + i * 54, 182));
        G.panel(ctx, px, 196, 240, "Result", ["fired " + s.fired + ";  deflected > 90°: " + s.back + (s.fired ? "  (1 in " + (s.back ? Math.round(s.fired / s.back) : "—") + ")" : ""), "closest approach d₀ = 2·79·e²/(4πε₀E) = " + ((2 * 79 * 1.44) / c.E).toFixed(0) + " fm", "close-up: b = " + c.b + " fm → θ = " + (2 * Math.atan(((2 * 79 * 1.44) / c.E) / (2 * c.b)) * 180 / Math.PI).toFixed(1) + "°", ["⇒ positive charge and almost all the mass are in a nucleus about 10⁻¹⁴ m across; the atom (10⁻¹⁰ m) is mostly empty space", "#ffe9b8"]]);
      } else {
        const n = s.n, E = -13.6 / (n * n); G.titles(ctx, "Bohr model of hydrogen: fixed energy levels", "Eₙ = −13.6 / n² eV;   a falling electron emits a photon ΔE = hf = hc/λ");
        for (let k = 1; k <= 6; k++) G.tag(ctx, S, V3(RB * k * k + 0.05, 1.4 + 0.06, 0), "n=" + k, k === n ? "#ffd27a" : "#9fb2d2", 8);
        /* energy level diagram */
        const ex = px, ey = 58; H.panel(ctx, ex, ey, 240, 160); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.textAlign = "left"; ctx.fillText("Energy levels (eV)", ex + 8, ey + 14);
        const Y = (En) => ey + 26 + (En / -13.6) * 120; for (let k = 1; k <= 6; k++) { const yy = Y(-13.6 / (k * k)); ctx.strokeStyle = k === n ? "#ffd27a" : "rgba(200,215,240,.6)"; ctx.lineWidth = k === n ? 2 : 1; ctx.beginPath(); ctx.moveTo(ex + 60, yy); ctx.lineTo(ex + 200, yy); ctx.stroke(); ctx.fillStyle = "#bcd0ea"; ctx.font = "8px 'IBM Plex Mono',monospace"; if (k <= 3 || k === n) ctx.fillText("n=" + k, ex + 30 + (k > 3 ? (k - 3) * 6 : 0), yy + 3); if (k <= 3 || k === n) ctx.fillText((-13.6 / (k * k)).toFixed(2), ex + 204, yy + 3); }
        if (s.lastLine) { const L = s.lastLine; ctx.strokeStyle = G.css(waveRGB(L.nm)); ctx.lineWidth = 2.5; const xx = ex + 130; ctx.beginPath(); ctx.moveTo(xx, Y(-13.6 / (L.ni * L.ni))); ctx.lineTo(xx, Y(-13.6 / (L.nf * L.nf)) - 4); ctx.stroke(); }
        /* spectrum */
        const sy = 226; H.panel(ctx, px, sy, 240, 70); ctx.fillStyle = "#8fb4ff"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillText("Lines seen so far (380–780 nm visible)", px + 8, sy + 14);
        ctx.fillStyle = "#06080e"; ctx.fillRect(px + 10, sy + 22, 220, 26); s.lines.forEach((L) => { if (L.nm < 380 || L.nm > 780) return; const x = px + 10 + (L.nm - 380) / 400 * 220; ctx.fillStyle = G.css(waveRGB(L.nm)); ctx.fillRect(x - 1.5, sy + 22, 3, 26); });
        ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("400", px + 26, sy + 60); ctx.fillText("500", px + 81, sy + 60); ctx.fillText("600", px + 136, sy + 60); ctx.fillText("700", px + 191, sy + 60);
        const uv = s.lines.filter((L) => L.nm < 380 || L.nm > 780).map((L) => L.ni + "→" + L.nf + " " + (L.nm < 380 ? "UV" : "IR")).join(", "); if (uv) { ctx.fillStyle = "#c8a8ff"; ctx.fillText("invisible: " + uv, px + 10, sy + 68 - 0); }
        if (s.lastLine) G.foot(ctx, "n = " + s.lastLine.ni + " → " + s.lastLine.nf + ":  ΔE = " + s.lastLine.dE.toFixed(2) + " eV,  λ = 1240/ΔE = " + s.lastLine.nm.toFixed(0) + " nm  (" + SERIES[s.lastLine.nf] + ")", "#ffe9b8");
        if (s.msg) G.status(ctx, s.msg, "bad");
      }
      ctx.restore();
    },
    readouts(s, c) {
      const m = c.mode | 0;
      if (m === 0) return [["Model", "solid indivisible sphere"], ["Explains", "laws of conservation of mass, constant and multiple proportions"], ["Could not explain", "electricity, radioactivity, isotopes"]];
      if (m === 1) return [["Particle", "electron, charge −1.6 × 10⁻¹⁹ C"], ["Deflection", (s.yScreen * 100 || 0).toFixed(2) + " cm"], ["Bends towards", c.Vp === 0 ? "no field: straight" : "the positive plate"], ["Electron speed", ((s.vel || 0) / 1e7).toFixed(2) + " × 10⁷ m/s"], ["Model", "plum pudding: electrons in a sphere of positive charge"]];
      if (m === 2) { const d0 = (2 * 79 * 1.44) / c.E; return [["α-particles fired", s.fired], ["Bounced back (> 90°)", s.back], ["Closest approach d₀", d0.toFixed(0) + " fm"], ["Close-up angle θ", (2 * Math.atan(d0 / (2 * c.b)) * 180 / Math.PI).toFixed(1) + "°  (tan θ/2 = d₀/2b)"], ["Conclusion", "tiny, dense, positive nucleus"]]; }
      const E = -13.6 / (s.n * s.n); return [["Electron level", "n = " + s.n], ["Energy Eₙ", E.toFixed(2) + " eV"], ["Orbit radius", (0.0529 * s.n * s.n).toFixed(3) + " nm (= n² × 0.0529 nm)"], ["Last photon", s.lastLine ? s.lastLine.nm.toFixed(0) + " nm, " + s.lastLine.dE.toFixed(2) + " eV" : "—"], ["Ionisation energy", "13.6 eV (n = 1 → ∞)"]];
    },
    steps(s, c) { const m = c.mode | 0; return MODES.map((t, i) => [t, i < m ? "done" : i === m ? "now" : ""]); },
  };

  /* =====================================================================================
     Physical and chemical change: melting ice, dissolving & evaporating salt, burning magnesium, heating iron + sulphur
     ===================================================================================== */
  const PC = [
    { label: "Melting ice (and freezing it again)", kind: "physical", eq: "H₂O(s) ⇌ H₂O(l)    ΔH = +6.0 kJ/mol", newSub: "no", rev: "yes: cool it and it freezes again", mass: "unchanged", energy: "small (latent heat absorbed)" },
    { label: "Dissolving salt, then evaporating the water", kind: "physical", eq: "NaCl(s) + water → NaCl(aq) → NaCl(s) + water vapour", newSub: "no", rev: "yes: the same salt is recovered", mass: "unchanged (salt recovered)", energy: "small" },
    { label: "Burning magnesium ribbon in air", kind: "chemical", eq: "2Mg(s) + O₂(g) → 2MgO(s)    ΔH = −1204 kJ", newSub: "yes: white magnesium oxide", rev: "no", mass: "increases (oxygen combines)", energy: "large: dazzling white light and heat" },
    { label: "Heating iron filings with sulphur", kind: "chemical", eq: "Fe(s) + S(s) → FeS(s)    ΔH = −100 kJ/mol", newSub: "yes: black iron(II) sulphide", rev: "no", mass: "unchanged (closed tube)", energy: "glows red-hot on its own once started" },
  ];
  const PCV = [[[1.0, 1.8, 4.2], [0.5, 0.8, 0]], [[1.4, 4.9, 6.6], [0.9, 3.0, 0]], [[1.2, 1.9, 4.6], [0.9, 0.8, 0]], [[1.5, 3.3, 6.2], [0.8, 2.2, 0]]];
  C3.scenes.physicalChemicalChange = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.72, fov: 36, free: true, cam: [[0.5, 1.7, 3.8], [0, 0.8, 0]],
    values: { exp: 0, run: 1, prog: 0 },
    state: () => ({ p: 0, magnet: 0, dir: 1 }),
    get controls() {
      return [
        { type: "select", key: "exp", label: "Experiment", options: PC.map((x, i) => ({ value: i, label: x.label + " — " + x.kind })) },
        { type: "toggle", key: "run", label: "Run (heat / let it happen)" },
        { type: "button", label: "Reverse it (cool / add water back)", cls: "secondary", action: (S, s, c) => { s.dir = -1; c.run = 1; } },
        { type: "button", label: "Bring a magnet near (iron + sulphur)", action: (S, s) => { s.magnet = 1; } },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s, c, ref) => { s.p = 0; s.dir = 1; s.magnet = 0; c.run = 1; s.puffT = 0; s.msg = ""; s.pullK = 0; ref(); } },
      ];
    },
    views: [{ label: "This experiment", cam: (S, s, c) => PCV[c.exp | 0] }, { label: "Wide", cam: [[0.8, 3.4, 8.0], [0, 1.4, 0]] }],
    note: "A physical change forms no new substance and is easily reversed: melting, freezing, boiling, dissolving, evaporating, sublimation, magnetising iron. A chemical change forms one or more new substances with new properties; it is not easily reversed and usually involves a large energy change: burning, rusting, decomposition, neutralisation, fermentation. In the iron and sulphur experiment the mixture can be separated with a magnet, but the product, iron(II) sulphide, is a compound: it is not attracted by a magnet and gives hydrogen sulphide (not hydrogen) with dilute acid.",
    onChange(S, s, c, key) { if (key === "exp") { s.p = 0; s.dir = 1; s.magnet = 0; c.run = 1; s.msg = ""; s.pullK = 0; C3.setView(S, { cam: PCV[c.exp | 0] }); } },
    reset(S, s, c) { Object.assign(c, { exp: 0, run: 1 }); s.p = 0; s.dir = 1; s.magnet = 0; s.msg = ""; s.pullK = 0; C3.setView(S, { cam: PCV[0] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(9, 0.06, 3.6, M.matte(0xb69a76, 0.62), 0, 0.0, 0).receiveShadow = true;
      /* (0) ice in a beaker with a thermometer */
      const g0 = new T.Group(); sc.add(g0); s.g0 = g0;
      const bk = K.beaker(); sc.remove(bk.group); g0.add(bk.group); s.bk0 = bk; s.w0 = bk.addLiquid({ color: [205, 232, 248], opacity: 0.25 });
      s.ice = []; const im = new T.MeshPhysicalMaterial({ color: 0xe8f6ff, roughness: 0.08, transmission: 0.0, transparent: true, opacity: 0.62, clearcoat: 1, ior: 1.31, envMapIntensity: 2 });
      for (let i = 0; i < 9; i++) { const m = S.mk.rbox(1.6 * CM, 1.5 * CM, 1.6 * CM, 0.04, im); sc.remove(m); m.position.set(rnd(-1.6, 1.6) * CM, (0.9 + (i % 3) * 1.5) * CM, rnd(-1.6, 1.6) * CM); m.rotation.set(rnd(0, 1), rnd(0, 3), rnd(0, 1)); bk.group.add(m); s.ice.push({ m, base: m.position.clone() }); }
      s.th0 = G.thermo(S, { x: 1.2 * CM, y: 0.5 * CM, z: -1.0 * CM, len: 22, min: -10, max: 50, T: -5 }); sc.remove(s.th0.group); s.th0.group.rotation.z = -0.15; g0.add(s.th0.group);
      /* (1) evaporating dish of salt solution on a tripod over a Bunsen */
      const g1 = new T.Group(); sc.add(g1); s.g1 = g1; const tp = G.tripod(S, 0, 0, 20); sc.remove(tp); g1.add(tp);
      const bn = K.bunsen({ x: 0, z: 0 }); sc.remove(bn); g1.add(bn); s.bn1 = bn; bn.setAir(1);
      const dish = K.vessel(G.DEFS.dish, { noAdd: true }); G.opaque(dish, M.ceramic(0xf3f0e8)); dish.group.position.y = tp.topY; g1.add(dish.group); s.dish = dish; s.sol = dish.addLiquid({ color: [220, 236, 244], opacity: 0.3 });
      s.salt = G.crystals(160, "box", [250, 250, 248], 0.32); dish.group.add(s.salt); s.salt.layout((i) => { const a = rnd(0, TAU), r = rnd(2.0, 5.6) * CM; return { x: Math.cos(a) * r, y: (0.5 + 2.4 * Math.pow((r / CM - 2) / 3.6, 1.6)) * CM, z: Math.sin(a) * r, rx: rnd(0, 3), ry: rnd(0, 3), s: rnd(0.5, 1.2) }; }); s.salt.count = 0;
      /* (2) magnesium ribbon in tongs over a heat-proof mat */
      const g2 = new T.Group(); sc.add(g2); s.g2 = g2; const mat = new T.Mesh(new T.BoxGeometry(2.4, 0.04, 1.6), M.matte(0x8a8f96, 0.95)); mat.position.y = 0.04; mat.receiveShadow = true; g2.add(mat);
      const tng = G.tongs(S, [0.25, 1.1, 0], [-1, -0.25, 0.3], 26); sc.remove(tng); g2.add(tng);
      s.mg = new T.Mesh(new T.BoxGeometry(1.1, 0.012, 0.05), new T.MeshPhysicalMaterial({ color: 0xc9ccd2, metalness: 1, roughness: 0.3 })); s.mg.geometry.translate(0.55, 0, 0); s.mg.position.set(0.25, 1.1, 0); s.mg.rotation.z = -0.35; g2.add(s.mg);
      s.ash = new T.Mesh(new T.BoxGeometry(1.1, 0.03, 0.07), M.matte(0xf6f6f2, 1)); s.ash.geometry.translate(0.55, 0, 0); s.ash.position.copy(s.mg.position); s.ash.rotation.z = -0.35; s.ash.scale.x = 0.001; g2.add(s.ash);
      s.mgLight = new T.PointLight(0xf4f6ff, 0, 12, 1.4); g2.add(s.mgLight); s.mgGlow = S.mk.soft(0xffffff, 1.4, 0, 0, 0, 1); sc.remove(s.mgGlow); g2.add(s.mgGlow);
      s.ashPile = G.heap(2.2, 0.9, [245, 245, 240]); s.ashPile.position.set(0.9, 0.06, 0.1); g2.add(s.ashPile);
      /* (3) iron + sulphur in an ignition (boiling) tube held over a Bunsen */
      const g3 = new T.Group(); sc.add(g3); s.g3 = g3; const st = K.retort({ x: -0.7, z: -0.3, h: 50 }); sc.remove(st); g3.add(st);
      const tube = K.vessel(G.DEFS.boilingtube, { noAdd: true }); tube.group.position.set(0, 2.45, 0); tube.group.rotation.z = 0.35; g3.add(tube.group); s.tube3 = tube;
      const arm = K.clampArm(st, (2.45 + Math.cos(0.35) * 9 * CM) / CM, -Math.sin(0.35) * 9 * CM, 0, 1.2); sc.remove(arm); g3.add(arm);
      const bn3 = K.bunsen({ x: 0, z: 0 }); sc.remove(bn3); g3.add(bn3); bn3.position.y = 0.04; s.bn3 = bn3;
      s.mixMat = new T.MeshStandardMaterial({ map: (() => { const cc = U.cv(256, 256), g = cc.getContext("2d"); for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? "rgb(" + (220 + rnd(0, 30)) + "," + (200 + rnd(0, 30)) + ",40)" : "rgb(" + (70 + rnd(0, 40)) + "," + (72 + rnd(0, 40)) + "," + (78 + rnd(0, 40)) + ")"; g.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); } const t = new T.CanvasTexture(cc); t.colorSpace = T.SRGBColorSpace; return t; })(), roughness: 0.95, emissive: new T.Color(1, 0.3, 0.05), emissiveIntensity: 0 });
      s.mix = new T.Mesh(new T.CylinderGeometry(0.95 * CM, 0.95 * CM, 3.2 * CM, 24), s.mixMat); s.mix.position.y = 2.0 * CM; tube.group.add(s.mix);
      s.fe = G.crystals(140, "needle", [60, 62, 68], 0.22, { mat: M.iron() }); g3.add(s.fe); s.feP = []; for (let i = 0; i < 140; i++) s.feP.push({ a: V3(rnd(-0.06, 0.06), rnd(-0.1, 0.1), rnd(-0.06, 0.06)), r: [rnd(0, 3), rnd(0, 3), rnd(0, 3)] });
      s.magnetG = new T.Group(); const red = M.paint(0xd02828), mg1 = new T.Mesh(new T.BoxGeometry(0.18, 0.7, 0.18), red); mg1.position.x = -0.12; const mg2 = mg1.clone(); mg2.position.x = 0.12; const brg = new T.Mesh(new T.TorusGeometry(0.12, 0.09, 12, 24, Math.PI), red); brg.position.y = 0.35; [mg1, mg2].forEach((q, i) => { const tip = new T.Mesh(new T.BoxGeometry(0.185, 0.14, 0.185), M.steel()); tip.position.set(q.position.x, -0.35, 0); s.magnetG.add(tip); }); s.magnetG.add(mg1, mg2, brg); s.magnetG.traverse((q) => { if (q.isMesh) q.castShadow = true; }); g3.add(s.magnetG);
      s.p = 0; s.puffT = 0; if (c.exp | 0) C3.setView(S, { cam: PCV[c.exp | 0] });
    },
    update(S, s, c, dt) {
      const e = c.exp | 0; [s.g0, s.g1, s.g2, s.g3].forEach((g, i) => { g.visible = i === e; }); const run = c.run && dt > 0;
      const rate = [0.05, 0.06, 0.14, 0.09][e]; if (run) s.p = clamp(s.p + s.dir * rate * dt, 0, 1); const p = s.p; const t = S.t;
      if (e === 0) { /* latent heat: temperature holds at 0 °C while ice melts */
        const melt = clamp(p / 0.8, 0, 1); s.ice.forEach((q, i) => { const k = clamp(1 - melt * (1 + i * 0.06), 0, 1); q.m.scale.setScalar(Math.max(0.001, k)); q.m.visible = k > 0.02; q.m.position.y = q.base.y * (0.4 + 0.6 * k) + 0.3 * CM; });
        s.w0.setVolume(4 + 150 * melt); const Tc = p < 0.04 ? lerp(-5, 0, p / 0.04) : p < 0.8 ? 0 : lerp(0, 22, (p - 0.8) / 0.2); s.T0 = Tc; s.th0.set(Tc); s.w0.update(t);
      } else if (e === 1) {
        const ev = s.dir > 0 ? clamp((p - 0.05) / 0.85, 0, 1) : clamp(p, 0, 1); s.sol.setVolume(Math.max(0.3, 60 * (1 - ev))); s.sol.setVisible(ev < 0.99); s.salt.count = Math.floor(160 * clamp((ev - 0.45) / 0.55, 0, 1)); s.bn1.setGas(c.run && s.dir > 0 ? 1 : 0); s.bn1.flame.update(t); s.sol.update(t);
        s.puffT += dt; if (c.run && s.dir > 0 && ev > 0.1 && ev < 0.98 && s.puffT > 0.25) { s.puffT = 0; G.wisp(S, rnd(-0.3, 0.3), 1.0 + 0.55, rnd(-0.3, 0.3), 0xf2f6fa, { op: 0.28 }); }
      } else if (e === 2) {
        if (s.dir < 0) { s.dir = 1; s.msg = "magnesium oxide cannot be turned back into magnesium by cooling"; } const burn = clamp(p, 0, 1), on = burn > 0.02 && burn < 0.98 && c.run;
        s.mg.scale.x = Math.max(0.001, 1 - burn); s.ash.scale.x = Math.max(0.001, burn); s.ash.position.copy(s.mg.position); s.ash.rotation.z = s.mg.rotation.z;
        const tip = V3(0.25 + Math.cos(-0.35) * 1.1 * (1 - burn), 1.1 + Math.sin(-0.35) * 1.1 * (1 - burn), 0); s.mgLight.position.copy(tip); s.mgGlow.position.copy(tip);
        const fl = on ? 0.8 + 0.2 * Math.sin(t * 47) + 0.1 * Math.sin(t * 31) : 0; s.mgLight.intensity = 26 * fl; s.mgGlow.material.opacity = fl; s.mgGlow.scale.setScalar(0.9 + 0.3 * fl);
        s.ashPile.scale.setScalar(Math.max(0.001, burn)); s.puffT += dt; if (on && s.puffT > 0.08) { s.puffT = 0; S.puff(tip.x, tip.y + 0.05, tip.z, { n: 1, color: 0xf4f4f0, speed: 0.15, up: 0.8, life: 1.8, size: 0.3, op: 0.5 }); }
      } else {
        if (s.dir < 0) { s.dir = 1; s.msg = "iron(II) sulphide does not change back into iron and sulphur"; } const r = clamp((p - 0.15) / 0.6, 0, 1); s.reacted = r;
        s.bn3.setGas(c.run && p < 0.3 ? 1 : 0); s.bn3.flame.update(t); s.bn3.flame.group.parent.updateWorldMatrix(true, true);
        const glow = r > 0 && r < 1 ? 1 : 0; s.mixMat.emissiveIntensity = glow * (1.6 + 0.4 * Math.sin(t * 9)); s.mixMat.color.setRGB(lerp(1, 0.12, r), lerp(1, 0.11, r), lerp(1, 0.12, r));
        /* magnet: before reaction it pulls iron filings out of the mixture; afterwards nothing moves */
        const tgt = V3(0.6, 2.75, 0.35); s.magnetG.position.lerp(s.magnet ? tgt : V3(1.6, 0.36, 0.6), clamp(dt * 3, 0, 1)); s.magnetG.rotation.z = s.magnet ? 0.2 : Math.PI / 2;
        const tw = s.tube3.group; tw.updateWorldMatrix(true, false); const m4 = new T.Matrix4(), q = new T.Quaternion(), sc3 = V3(0.22 * CM, 0.22 * CM, 0.22 * CM), base = V3(0, 2.0 * CM, 0).applyMatrix4(tw.matrixWorld);
        const pull = s.magnet && s.reacted < 0.05; s.pullK = clamp((s.pullK || 0) + (pull ? dt * 0.8 : -dt * 2), 0, 1); const tip = s.magnetG.position.clone().add(V3(0, -0.42, 0));
        s.fe.visible = s.pullK > 0.01; s.feP.forEach((f, i) => { const pp = base.clone().add(f.a).lerp(tip.clone().add(f.a.clone().multiplyScalar(0.8)), G.smooth(0, 1, s.pullK - (i % 7) * 0.02)); q.setFromEuler(new T.Euler(...f.r)); m4.compose(pp, q, sc3); s.fe.setMatrixAt(i, m4); }); s.fe.instanceMatrix.needsUpdate = true;
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const e = c.exp | 0, X = PC[e], px = w - 250; ctx.save(); G.titles(ctx, X.label, X.kind === "physical" ? "PHYSICAL change: no new substance, easily reversed" : "CHEMICAL change: a new substance is formed", null);
      G.foot(ctx, X.eq, "#ffe9b8");
      G.panel(ctx, px, 58, 240, "Is it physical or chemical?", ["New substance formed: " + X.newSub, "Easily reversed: " + X.rev, "Mass: " + X.mass, "Energy change: " + X.energy, [X.kind === "physical" ? "→ PHYSICAL CHANGE" : "→ CHEMICAL CHANGE", X.kind === "physical" ? "#8dffb8" : "#ffb38a"]]);
      if (e === 0) { G.tag(ctx, S, V3(0, 1.85, 0), "θ = " + s.T0.toFixed(1) + " °C", "#ffe9b8", 9.5); G.status(ctx, s.p > 0.04 && s.p < 0.8 ? "temperature stays at 0 °C while the ice melts (latent heat)" : s.p >= 0.8 ? "all melted: the water now warms up" : "", "info"); }
      if (e === 1) G.status(ctx, s.salt.count > 20 ? "white salt crystals left behind: the same substance as before" : s.p > 0.05 ? "the water evaporates; the salt stays" : "", "info");
      if (e === 2) { G.status(ctx, s.msg || (s.p > 0.02 && s.p < 0.98 ? "do not look straight at the flame: dazzling white light" : s.p >= 0.98 ? "white powder left: magnesium oxide (basic oxide)" : ""), s.msg ? "bad" : "info"); }
      if (e === 3) { G.status(ctx, s.msg || (s.magnet && s.reacted < 0.05 ? "magnet pulls out the iron: it is only a mixture" : s.magnet ? "nothing is attracted: FeS is a new compound" : s.reacted > 0 && s.reacted < 1 ? "the glow spreads through the mixture even after the flame is removed (exothermic)" : ""), s.msg ? "bad" : s.magnet && s.reacted >= 0.05 ? "ok" : "info");
        G.panel(ctx, px, 196, 240, "Mixture vs compound", ["Fe + S mixture: grey-yellow, magnet separates iron, CS₂ dissolves sulphur, dilute HCl gives H₂", "FeS compound: black, not magnetic, dilute HCl gives H₂S (rotten-egg smell)"]); }
      ctx.restore();
    },
    readouts(s, c) { const X = PC[c.exp | 0]; return [["Type of change", X.kind], ["Progress", Math.round(s.p * 100) + " %"], ["New substance?", X.newSub], ["Reversible?", X.rev]]; },
    steps(s, c) { return [["Observe the starting material", "done"], ["Run the experiment", s.p > 0.02 ? "done" : "now"], ["Look for a new substance and the energy change", s.p > 0.6 ? "now" : ""], ["Try to reverse it", ""]]; },
  };
})();
