/* c3d-flame.js — chemistry 3D, new module: flame tests, line spectra and electron transitions (E = hf = hc/λ) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t);
  const PLANCK = 6.626e-34, cc = 2.998e8, eV = 1.602e-19;
  const wl2rgb = (w) => { let r = 0, g = 0, b = 0; if (w < 440) { r = (440 - w) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = (510 - w) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = (645 - w) / 65; } else r = 1; const f = w < 420 ? 0.3 + (0.7 * (w - 380)) / 40 : w > 700 ? 0.3 + (0.7 * (780 - w)) / 80 : 1; return [r * f, g * f, b * f]; };
  const css = (c, a) => "rgba(" + Math.round(clamp(c[0], 0, 1) * 255) + "," + Math.round(clamp(c[1], 0, 1) * 255) + "," + Math.round(clamp(c[2], 0, 1) * 255) + "," + (a == null ? 1 : a) + ")";
  /* line wavelengths are real strong emission lines (nm); flame colours are the standard textbook observations */
  const ION = {
    Li: { name: "Lithium", salt: "LiCl", ion: "Li⁺", colour: "crimson red", rgb: [1, 0.1, 0.2], main: 670.8, lines: [[670.8, 1], [610.4, 0.25], [460.3, 0.12]], note: "Li⁺ gives a crimson-red flame, like Sr²⁺; the red line at 671 nm dominates." },
    Na: { name: "Sodium", salt: "NaCl", ion: "Na⁺", colour: "golden yellow", rgb: [1, 0.78, 0.08], main: 589.0, lines: [[589.0, 1], [589.6, 0.95], [568.8, 0.1]], note: "The Na D-lines (a 589.0 / 589.6 nm doublet) are so intense that traces of sodium colour every flame yellow." },
    K: { name: "Potassium", salt: "KCl", ion: "K⁺", colour: "lilac (pale violet)", rgb: [0.72, 0.45, 1], main: 766.5, lines: [[766.5, 1], [769.9, 0.7], [404.4, 0.35], [404.7, 0.3]], note: "K⁺ lines lie at the red edge (767 nm) and in the violet (404 nm); the eye blends them to lilac. Sodium's yellow can mask it." },
    Ca: { name: "Calcium", salt: "CaCl₂", ion: "Ca²⁺", colour: "brick-red (orange-red)", rgb: [1, 0.36, 0.08], main: 622, lines: [[622, 1], [554, 0.25], [423, 0.4]], note: "Ca²⁺ gives broad molecular bands near 620 nm (from CaOH/CaCl) — a brick-red flame." },
    Sr: { name: "Strontium", salt: "SrCl₂", ion: "Sr²⁺", colour: "crimson", rgb: [1, 0.08, 0.14], main: 605, lines: [[605, 0.7], [650, 0.6], [461, 0.6]], note: "Sr²⁺ gives a crimson flame (red SrOH/SrCl bands plus a blue line at 461 nm); used in red fireworks and flares." },
    Ba: { name: "Barium", salt: "BaCl₂", ion: "Ba²⁺", colour: "apple-green", rgb: [0.45, 1, 0.25], main: 553.5, lines: [[553.5, 1], [524, 0.5], [514, 0.5], [614, 0.35]], note: "Ba²⁺ shows a strong green line at 553.5 nm — the apple-green of green fireworks." },
    Cu: { name: "Copper(II)", salt: "CuCl₂", ion: "Cu²⁺", colour: "blue-green", rgb: [0.15, 0.9, 0.75], main: 515, lines: [[510, 0.8], [515, 1], [522, 0.8], [578, 0.3]], note: "Cu²⁺ emits groups of bands in the green (510–530 nm), giving a blue-green flame." },
  };
  const KEYS = Object.keys(ION), SPACE = 0.5, DX0 = -3.3, BX = 0.5, FY = 2.55;

  C3.scenes.flameTests = {
    env: "chemlab", envI: 1, fov: 36, free: true, cam: [[1.4, 4.2, 12.6], [1.4, 2.0, 0]],
    values: { ion: "Na", clean: 1 },
    state: () => ({ ph: "idle", tp: 0, tt: 0, burn: 0, dirtyBy: null, shown: null, pos: null }),
    controls: [
      { type: "select", key: "ion", label: "Salt sample (metal ion to test)", options: KEYS.map((k) => ({ value: k, label: ION[k].salt + "  —  " + ION[k].ion })) },
      { type: "button", label: "▶ Dip the wire loop in the salt and hold it in the flame", action: (S, s, c) => { s.ph = "dip"; s.tp = 0; s.tt = 0; s.dishOf = c.ion; s.loadedBy = c.ion; } },
      { type: "button", label: "Clean the loop (conc. HCl, then heat until no colour)", action: (S, s) => { s.ph = "idle"; s.tp = 0; s.dirtyBy = null; s.cleaned = true; } },
      { type: "button", label: "Take the loop out of the flame", action: (S, s) => { s.ph = "idle"; s.tp = 0; } },
    ],
    views: [{ label: "Bench", cam: [[1.4, 4.2, 12.6], [1.4, 2.0, 0]] }, { label: "Flame close-up", cam: [[1.4, 3.0, 4.6], [0.9, 2.5, 0]] }, { label: "Salts", cam: [[-1.8, 2.6, 6.5], [-1.8, 0.6, 0.6]] }],
    note: "Heated metal ions emit light of characteristic colours. Heat lifts an electron to a higher energy level; when it falls back it gives out a photon of energy ΔE = hf = hc/λ. Each element has its own energy levels, so it emits its own set of wavelengths (its line spectrum). Always clean the nichrome/platinum loop between tests: a trace of sodium gives a yellow flame that hides other colours.",
    onChange() {},
    reset(S, s, c) { Object.assign(c, { ion: "Na", clean: 1 }); s.ph = "idle"; s.tp = 0; s.dirtyBy = null; },
    table(s, c) { return '<table class="c3-table"><tr><th style="text-align:left">Ion</th><th style="text-align:left">Flame colour</th><th>Main line λ/nm</th><th>E = hc/λ /eV</th></tr>' + KEYS.map((k) => { const d = ION[k]; return '<tr class="' + (k === c.ion ? "ok" : "") + '"><td style="text-align:left">' + d.ion + '</td><td style="text-align:left">' + d.colour + "</td><td>" + d.main + "</td><td>" + (1239.84 / d.main).toFixed(2) + "</td></tr>"; }).join("") + "</table>"; },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.bun = K.bunsen({ x: BX, z: 0, flameH: 7.5 }); s.bun.setAir(1); s.bun.setGas(1);
      /* row of salt dishes, each a watch glass with a small mound of salt */
      s.dish = []; KEYS.forEach((k, i) => { const x = DX0 + i * SPACE, z = 1.5; S.mk.cyl(0.21, 0.21, 0.05, M.ceramic ? M.ceramic(0xf4f6f8) : M.matte(0xf0f2f5, 0.2), x, 0.04, z); const mound = S.mk.sphere(0.14, new T.MeshStandardMaterial({ color: k === "Cu" ? 0x4fc7b0 : 0xf6f6f2, roughness: 0.85 }), x, 0.09, z); mound.scale.y = 0.55; s.dish.push({ x, z }); });
      S.mk.cyl(0.22, 0.22, 0.52, M.matte(0x3a3028, 0.5), 2.9, 0.26, -0.4); S.mk.cyl(0.14, 0.14, 0.2, M.matte(0xb8c4d6, 0.1), 2.9, 0.62, -0.4); // HCl cleaning pot
      s.handle = S.mk.rod(V3(3.6, 4.4, 1.2), V3(2.2, 1.9, 1.3), 0.06, M.matte(0x1c2230, 0.4)); s.wire = S.mk.rod(V3(2.2, 1.9, 1.3), V3(2.1, 1.7, 1.3), 0.015, M.steel());
      s.bead = S.mk.sphere(0.07, new T.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.8, emissive: 0x000000 }), 2.1, 1.65, 1.3);
      s.tip = V3(2.2, 1.9, 1.3); s.sparks = U.softDot ? null : null;
      s.halo = S.mk.soft(0xffffff, 3.0, BX, FY, 0, 0);
    },
    update(S, s, c, dt) {
      const d = ION[c.ion], idle = V3(2.4, 2.1, 1.3), dish = s.dish[KEYS.indexOf(s.dishOf || c.ion)], flameP = V3(BX, FY - 0.15, 0.05);
      if (dt > 0 && s.ph !== "idle") { s.tt += dt; }
      let tgt = idle, tintK = 0, tintRGB = d.rgb, loaded = false;
      if (s.ph === "dip") { const dd = ION[s.dishOf].rgb; const u = s.tt; const dishP = V3(dish.x, 0.35, dish.z);
        if (u < 1.0) tgt = idle.clone().lerp(dishP.clone().add(V3(0, 0.45, 0)), ease(u)); else if (u < 1.5) { tgt = dishP; } else if (u < 2.6) { tgt = dishP.clone().lerp(flameP.clone().add(V3(0, 0.0, 1.2)), 0); const w = (u - 1.5) / 1.1; const mid = dishP.clone().add(V3(0, 1.8, 0)); tgt = w < 0.5 ? dishP.clone().lerp(mid, ease(w * 2)) : mid.clone().lerp(flameP, ease((w - 0.5) * 2)); } else { tgt = flameP; s.ph = "flame"; s.burn = 0; }
        loaded = u > 1.25; }
      if (s.ph === "flame") { tgt = flameP; if (dt > 0) s.burn += dt; loaded = true; }
      s.tip.lerp(tgt, s.ph === "idle" ? 0.12 : 0.6);
      s.tip.x += 0; const hb = s.tip.clone().add(V3(1.5, 2.5, -0.1));
      S.setRod(s.handle, hb, s.tip); S.setRod(s.wire, s.tip, s.tip.clone().add(V3(-0.02, -0.18, 0))); s.bead.position.set(s.tip.x - 0.02, s.tip.y - 0.2, s.tip.z);
      /* flame tint: ramps up while the salt is in the flame, and fades as the sample burns away */
      const inFlame = s.ph === "flame"; let k = 0, rgb = d.rgb; const warn = [];
      if (inFlame) { const lastIon = s.loadedBy || c.ion, dd = ION[lastIon]; k = clamp(s.burn / 0.6, 0, 1) * (s.burn > 22 ? clamp(1 - (s.burn - 22) / 6, 0.15, 1) : 1); rgb = dd.rgb;
        if (s.dirtyBy && s.dirtyBy !== lastIon && !s.cleaned) { const nd = ION.Na.rgb, m = 0.55; rgb = [lerp(rgb[0], nd[0], m), lerp(rgb[1], nd[1], m), lerp(rgb[2], nd[2], m)]; s.contam = true; } else s.contam = false;
        s.shown = lastIon; s.dirtyBy = lastIon; s.cleaned = false; }
      else if (s.ph === "idle") { k = Math.max(0, (s.kLast || 0) - dt * 2.5); rgb = s.rgbLast || rgb; }
      s.kLast = k; if (inFlame) s.rgbLast = rgb;
      s.bun.flame.tint(rgb, k); s.bun.flame.update(S.t); s.halo.material.color.setRGB(rgb[0], rgb[1], rgb[2]); s.halo.material.opacity = 0.18 * k; s.halo.scale.setScalar(0.8 + k * 0.5);
      s.bead.material.emissive.setRGB(rgb[0] * k * 0.8, rgb[1] * k * 0.8, rgb[2] * k * 0.8);
      s.k = k; s.cl = rgb;
    },
    overlay(ctx, s, c, w, h, S) {
      const d = ION[c.ion], sh = s.shown && s.ph === "flame" ? ION[s.shown] : d, inF = s.ph === "flame";
      H.pill(ctx, 10, 22, "Flame test: " + d.ion + "  (" + d.salt + ")", "#ffe9b8", 11);
      H.pill(ctx, 10, 44, inF ? "in the flame → " + ION[s.shown].colour : s.ph === "dip" ? "picking up the salt…" : "loop out of the flame — press ▶ to test", inF ? css(ION[s.shown].rgb) : "#9fe3ff", 10);
      if (s.contam && inF) H.pill(ctx, 10, 66, "⚠ contaminated by the previous salt — clean the loop first", "#ff9a7a", 9.5);
      KEYS.forEach((k, i) => { const q = S.proj(V3(DX0 + i * SPACE, 0.55, 1.5)); H.pill(ctx, q.x, q.y, ION[k].ion, k === c.ion ? "#ffd27a" : "#8fa6c8", k === c.ion ? 9.5 : 8.5, "center"); });
      /* emission spectrum strip */
      const px = 388, py = 58, pw = 248, ph = 94; H.panel(ctx, px, py, pw, ph); ctx.save(); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.textAlign = "left"; ctx.fillText("Line emission spectrum of " + sh.ion, px + 8, py + 14);
      const sx = px + 10, sw = pw - 20, sy = py + 24, sh2 = 34, wx = (nm) => sx + ((nm - 380) / (780 - 380)) * sw;
      ctx.fillStyle = "#05070c"; ctx.fillRect(sx, sy, sw, sh2); const act = inF ? clamp(s.burn / 0.8, 0, 1) : 0.0;
      for (let nm = 380; nm <= 780; nm += 4) { const col = wl2rgb(nm); ctx.fillStyle = css(col, 0.07); ctx.fillRect(wx(nm), sy + sh2, 2, 6); }
      sh.lines.forEach(([nm, I]) => { const col = wl2rgb(nm); const a = (act > 0 ? 1 : 0.0) * I; if (a > 0) { const g = ctx.createLinearGradient(wx(nm) - 4, 0, wx(nm) + 4, 0); g.addColorStop(0, css(col, 0)); g.addColorStop(0.5, css(col, 0.9 * a)); g.addColorStop(1, css(col, 0)); ctx.fillStyle = g; ctx.fillRect(wx(nm) - 4, sy, 8, sh2); ctx.fillStyle = css(col, 1); ctx.fillRect(wx(nm) - 0.8, sy, 1.6, sh2); } });
      ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; [400, 500, 600, 700].forEach((nm) => { ctx.fillText(nm, wx(nm), sy + sh2 + 18); ctx.fillRect(wx(nm), sy + sh2, 1, 4); }); ctx.textAlign = "right"; ctx.fillText("λ / nm", px + pw - 8, py + ph - 4);
      if (!act) { ctx.textAlign = "center"; ctx.fillStyle = "#5c6c86"; ctx.fillText("(put the salt in the flame to see its lines)", sx + sw / 2, sy + sh2 / 2 + 3); }
      ctx.restore();
      /* energy-level diagram: heat excites an electron, it falls back emitting a photon */
      const ex = 388, ey = 160, ew = 248, eh = 140; H.panel(ctx, ex, ey, ew, eh); ctx.save(); ctx.textAlign = "left"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Electron transition", ex + 8, ey + 14);
      const lv = [ey + eh - 16, ey + eh - 54, ey + eh - 78, ey + eh - 96, ey + eh - 108], lx0 = ex + 22, lx1 = ex + 120; const col = wl2rgb(sh.main);
      ctx.strokeStyle = "#7f93b5"; ctx.lineWidth = 1.4; lv.forEach((y, i) => { ctx.beginPath(); ctx.moveTo(lx0, y); ctx.lineTo(lx1, y); ctx.stroke(); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText(i === 0 ? "ground" : i === 1 ? "excited" : "", lx0 - 18 + (i === 0 ? 0 : 0), y - 3); });
      const tm = (S.t % 3.2), top = lv[1], bot = lv[0]; let ey2 = bot, ph2 = 0; const hot = inF;
      if (!hot) ey2 = bot; else if (tm < 1.0) { ey2 = lerp(bot, top, ease(tm)); ph2 = 1; } else if (tm < 1.6) { ey2 = top; ph2 = 2; } else if (tm < 2.2) { ey2 = lerp(top, bot, ease((tm - 1.6) / 0.6)); ph2 = 3; } else ey2 = bot;
      ctx.fillStyle = "#e9f0ff"; ctx.beginPath(); ctx.arc((lx0 + lx1) / 2, ey2 - 5, 4.5, 0, 6.3); ctx.fill();
      if (ph2 === 1) { ctx.fillStyle = "#ff9a5a"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText("heat in", lx0 + 2, (bot + top) / 2); }
      if (ph2 === 3 || (ph2 === 2 && tm > 1.5)) { const ph = clamp((tm - 1.55) / 0.9, 0, 1); ctx.strokeStyle = css(col, 1); ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const t2 = i / 40, xx = lx1 + 6 + t2 * 70 * ph, yy = lerp(top, bot, 0.55) - 6 + Math.sin(t2 * 22) * 4; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.fillStyle = css(col, 1); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText("photon, " + sh.main + " nm", lx1 + 8, bot - 6); }
      ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(lx1 + 14, top); ctx.lineTo(lx1 + 14, bot); ctx.stroke(); ctx.fillStyle = "#ffd27a"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText("ΔE", lx1 + 18, (top + bot) / 2 + 3);
      const f = cc / (sh.main * 1e-9), E = PLANCK * f; ctx.fillStyle = "#dbe7ff"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillText("ΔE = hf = hc/λ", ex + 134, ey + 40); ctx.fillText("f = " + (f / 1e14).toFixed(2) + "×10¹⁴ Hz", ex + 134, ey + 54); ctx.fillText("ΔE = " + (E / eV).toFixed(2) + " eV", ex + 134, ey + 68); ctx.fillText("   = " + (E * 1e19).toFixed(2) + "×10⁻¹⁹ J", ex + 134, ey + 82); ctx.restore();
    },
    readouts(s, c) {
      const d = ION[c.ion], f = cc / (d.main * 1e-9), E = PLANCK * f;
      return [["Ion tested", d.ion + "  (" + d.salt + ")"], ["Flame colour", d.colour], ["Main emission line, λ", d.main + " nm"], ["Frequency, f = c/λ", (f / 1e14).toFixed(2) + " × 10¹⁴ Hz"], ["Photon energy, E = hf", (E * 1e19).toFixed(2) + " × 10⁻¹⁹ J  (" + (E / eV).toFixed(2) + " eV)"], ["Explanation", d.note]];
    },
    steps(s, c) { return [["Choose a salt and press ▶ — the loop dips into it", s.loadedBy ? "done" : "now"], ["Hold it in the blue (non-luminous) flame and read the colour", s.ph === "flame" ? "now" : s.shown ? "done" : ""], ["Match the colour to the ion using the table", s.shown ? "now" : ""], ["Clean the loop in HCl before testing the next salt", s.cleaned ? "done" : ""]]; },
  };
})();
