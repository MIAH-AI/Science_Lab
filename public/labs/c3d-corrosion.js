/* c3d-corrosion.js — chemistry 3D, new module: rusting of iron, conditions, sacrificial protection */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  /* rate factor f: rust fraction after d days = 1 − exp(−f·d/7); f = 0 means no rusting (qualitative classroom results) */
  const TUBES = [
    { k: "air", s: "water + air", f: 1.0, why: "Iron, oxygen AND water are all present, so it rusts steadily.", obs: "orange-brown rust forms on the nail and flakes into the water" },
    { k: "boil", s: "no O₂", f: 0, why: "Boiling drives dissolved oxygen out of the water and the oil layer stops air re-dissolving: no oxygen → no rust.", obs: "the nail stays bright" },
    { k: "dry", s: "no water", f: 0, why: "Anhydrous calcium chloride absorbs water vapour, so the air is dry: no water → no rust.", obs: "the nail stays bright" },
    { k: "salt", s: "salt water", f: 2.6, why: "Dissolved salt makes the water a better electrolyte, so the corrosion cell works faster.", obs: "much more rust, much sooner (why ships and cars rust fast by the sea)" },
    { k: "mg", s: "Mg ribbon", f: 0, why: "Magnesium is more reactive than iron, so it loses electrons first (sacrificial protection). The iron is the cathode and does not rust, while the magnesium slowly corrodes.", obs: "no rust on the iron; the Mg is eaten away" },
    { k: "cu", s: "Cu wire", f: 1.8, why: "Copper is less reactive than iron, so iron becomes the anode and corrodes faster than usual.", obs: "extra rust where the iron touches the copper" },
    { k: "zn", s: "zinc-coated", f: 0, why: "Zinc is more reactive than iron: it protects the steel by sacrificial protection even where the coating is scratched (galvanising).", obs: "no rust; a little white zinc compound forms" },
    { k: "paint", s: "painted", f: 0, why: "Paint keeps oxygen and water off the metal — but only while it is unbroken. Scratch it and the exposed iron rusts.", obs: "no rust while the paint is intact; rusts at a scratch" },
  ];
  const TX = (i) => -2.8 + i * 0.8, TZ = 0, TY = 0.26;
  const rate = (i, c) => { const t = TUBES[i]; if (t.k === "paint" && c.scr) return 0.9; return t.f; };
  const rust = (i, c) => 1 - Math.exp(-(rate(i, c) * c.day) / 7);

  C3.scenes.corrosion = {
    env: "chemlab", envI: 1, fov: 36, free: true, cam: [[0, 2.5, 8.2], [0, 1.45, 0]],
    values: { day: 0, sel: 0, scr: 0 },
    state: () => ({ play: false, rf: null, acc: 0 }),
    controls: [
      { type: "range", key: "day", label: "Time elapsed (days)", min: 0, max: 21, step: 0.1, unit: " days" },
      { type: "button", label: "▶ Run the time-lapse", action: (S, s, c, rf) => { s.play = true; s.rf = rf; if (c.day >= 21) c.day = 0; } },
      { type: "button", label: "⏸ Stop", action: (S, s) => { s.play = false; }, cls: "secondary" },
      { type: "select", key: "sel", label: "Explain this tube", options: TUBES.map((t, i) => ({ value: i, label: (i + 1) + ". " + t.s })) },
      { type: "toggle", key: "scr", label: "Scratch the paint and the zinc coat" },
    ],
    views: [{ label: "All tubes", cam: [[0, 2.5, 8.2], [0, 1.45, 0]] }, { label: "Tubes 1–4", cam: [[-1.4, 2.2, 5.0], [-1.4, 1.4, 0]] }, { label: "Tubes 5–8", cam: [[1.4, 2.2, 5.0], [1.4, 1.4, 0]] }],
    note: "Rusting is an electrochemical process: at the anode Fe(s) → Fe²⁺(aq) + 2e⁻; at the cathode O₂(g) + 2H₂O(l) + 4e⁻ → 4OH⁻(aq). The ions form Fe(OH)₂, which is oxidised further to hydrated iron(III) oxide, Fe₂O₃·xH₂O (rust). Iron needs BOTH oxygen and water. Protection: keep air/water out (paint, oil, plating) or use a more reactive metal (sacrificial protection: zinc, magnesium). Contact with a LESS reactive metal such as copper speeds rusting. Times are illustrative; the pattern is the real classroom result.",
    onChange() {},
    reset(S, s, c) { Object.assign(c, { day: 0, sel: 0, scr: 0 }); s.play = false; },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Tube</th><th>Rust, %</th><th style="text-align:left">Observation</th></tr>' + TUBES.map((t, i) => '<tr class="' + (i === c.sel ? "ok" : "") + '"><td style="text-align:left">' + (i + 1) + ". " + t.s + "</td><td>" + (rust(i, c) * 100).toFixed(0) + '</td><td style="text-align:left">' + (t.k === "paint" ? (c.scr ? "paint scratched → rusts at the scratch" : t.obs) : t.k === "zn" ? (c.scr ? "scratched, still protected (sacrificial)" : t.obs) : t.obs) + "</td></tr>").join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; const rk = M.matte(0x6b4a2c, 0.55);
      S.mk.rbox(7.0, 0.22, 0.9, 0.06, M.matte(0x7a5330, 0.55), 0, 0.11, TZ);
      s.t = TUBES.map((t, i) => {
        const x = TX(i), tb = K.testTube(); tb.group.position.set(x, TY, TZ);
        const o = { tb, x }; const wet = t.k !== "dry"; o.liq = tb.addLiquid({ color: [226, 241, 250], opacity: 0.3 }); o.liq.setVolume(wet ? 8 : 0.1); o.liq.setVisible(wet);
        o.ppt = K.precipitate(tb, o.liq, { n: 380, size: 0.1, color: 0xa4491d });
        /* nail */
        const nm = new T.MeshStandardMaterial({ color: t.k === "zn" ? 0xb9c4cf : t.k === "paint" ? 0x2a6fd6 : 0xb4bac2, metalness: 0.9, roughness: 0.3 });
        const nail = new T.Group(); const sh = new T.Mesh(new T.CylinderGeometry(0.02, 0.012, 0.8, 12), nm); const hd = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.022, 14), nm); hd.position.y = 0.41; nail.add(sh, hd);
        const rm = new T.MeshStandardMaterial({ color: 0x9a4a1e, roughness: 0.95, transparent: true, opacity: 0 }); const rs = new T.Mesh(new T.CylinderGeometry(0.024, 0.017, t.k === "paint" ? 0.18 : 0.8, 12), rm); rs.position.y = t.k === "paint" ? -0.02 : 0; nail.add(rs); o.rm = rm; o.nm = nm;
        nail.position.set(x + 0.02, TY + (wet ? 0.78 : 1.15), TZ); nail.rotation.z = 0.05; S.scene.add(nail); o.nail = nail;
        if (t.k === "mg") { const mg = new T.Mesh(new T.CylinderGeometry(0.034, 0.034, 0.5, 14, 1, true), new T.MeshStandardMaterial({ color: 0xd7dae0, metalness: 0.7, roughness: 0.35, side: T.DoubleSide })); mg.position.y = 0.0; nail.add(mg); o.mg = mg; }
        if (t.k === "cu") { o.cu = []; for (let k = 0; k < 6; k++) { const r = new T.Mesh(new T.TorusGeometry(0.03, 0.007, 8, 16), new T.MeshStandardMaterial({ color: 0xc8703a, metalness: 0.9, roughness: 0.3 })); r.rotation.x = Math.PI / 2; r.position.y = -0.2 + k * 0.045; nail.add(r); o.cu.push(r); } }
        if (t.k === "boil") { o.oil = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.035, 20), new T.MeshStandardMaterial({ color: 0xe8c230, transparent: true, opacity: 0.6, roughness: 0.15 })); o.oil.position.set(x, TY + o.liq.level * CM + 0.02, TZ); S.scene.add(o.oil); }
        if (t.k === "dry") { const gr = new T.Mesh(new T.SphereGeometry(0.1, 14, 10), new T.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.9 })); gr.scale.y = 0.5; gr.position.set(x, TY + 0.1, TZ); S.scene.add(gr); const ct = new T.Mesh(new T.SphereGeometry(0.12, 14, 10), new T.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 1 })); ct.position.set(x, TY + 0.32, TZ); S.scene.add(ct); nail.position.y = TY + 0.78; }
        return o;
      });
    },
    update(S, s, c, dt) {
      if (s.play && dt > 0) { c.day = Math.min(21, c.day + dt * 2.2); s.acc += dt; if (s.acc > 0.3 && s.rf) { s.acc = 0; s.rf(); } if (c.day >= 21) { s.play = false; s.rf && s.rf(); } }
      s.t.forEach((o, i) => {
        const t = TUBES[i], r = rust(i, c); o.rm.opacity = r * 0.95; o.nm.color.setRGB(lerp(0.7, 0.55, r), lerp(0.72, 0.28, r), lerp(0.76, 0.14, r)); if (t.k === "paint") o.nm.color.setHex(0x2a6fd6);
        const wet = t.k !== "dry"; if (wet) { o.liq.setColor([lerp(226, 222, r), lerp(241, 188, r * 0.8), lerp(250, 150, r * 0.9)], 0.3 + r * 0.12); o.liq.update(S.t); o.ppt.amount = r * 0.7; o.ppt.update(dt); }
        if (o.mg) { const k = 1 - 0.55 * clamp(c.day / 21, 0, 1); o.mg.scale.set(1, k, 1); o.mg.material.color.setRGB(lerp(0.84, 0.97, 1 - k), lerp(0.85, 0.97, 1 - k), lerp(0.88, 0.95, 1 - k)); }
        if (o.cu) o.cu.forEach((q) => q.material.color.setRGB(lerp(0.78, 0.2, r * 0.5), lerp(0.44, 0.6, r * 0.5), lerp(0.23, 0.5, r * 0.5)));
      });
    },
    overlay(ctx, s, c, w, h, S) {
      H.pill(ctx, 10, 22, "Rusting of iron nails — day " + c.day.toFixed(1), "#ffe9b8", 11);
      const t = TUBES[c.sel]; ctx.save(); ctx.textAlign = "left"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; H.panel(ctx, 10, 36, 620, 52); ctx.fillStyle = "#ffd27a"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillText((c.sel + 1) + ". " + t.s, 18, 51); ctx.fillStyle = "#dbe7ff"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; wrap(ctx, t.why, 18, 65, 600, 11); ctx.restore();
      TUBES.forEach((tb, i) => {
        const q = S.proj(V3(TX(i), TY + 15 * CM + 0.15, TZ)); H.pill(ctx, q.x, q.y, tb.s, i === c.sel ? "#ffd27a" : "#8fa6c8", 8, "center");
        const b = S.proj(V3(TX(i), 0, 0.5)), r = rust(i, c), bh = 44, bw = 26; ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(b.x - bw / 2, 372 - bh, bw, bh); ctx.fillStyle = "#b5541f"; ctx.fillRect(b.x - bw / 2, 372 - bh * r, bw, bh * r); ctx.fillStyle = "#dbe7ff"; ctx.textAlign = "center"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText((r * 100).toFixed(0) + "%", b.x, 372 - bh * r - 3);
      });
      ctx.save(); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillText("rust on each nail, %", 10, 346); ctx.restore();
    },
    readouts(s, c) { const t = TUBES[c.sel]; return [["Tube", (c.sel + 1) + ". " + t.s], ["Time", c.day.toFixed(1) + " days"], ["Rust on this nail", (rust(c.sel, c) * 100).toFixed(0) + " %"], ["Why", t.why], ["Anode (oxidation)", "Fe(s) → Fe²⁺(aq) + 2e⁻"], ["Cathode (reduction)", "O₂(g) + 2H₂O(l) + 4e⁻ → 4OH⁻(aq)"], ["Rust", "4Fe(OH)₂ + O₂ + 2H₂O → 4Fe(OH)₃ → Fe₂O₃·xH₂O"]]; },
    steps(s, c) { return [["Compare tube 1 with tubes 2 and 3: which condition is missing?", "done"], ["Run the time-lapse and watch the rust bars", c.day > 0 ? "done" : "now"], ["Compare salt water (4) and copper contact (6) with plain water (1)", ""], ["Compare Mg and Zn (more reactive) with Cu (less reactive); scratch the paint and the coat", c.scr ? "done" : ""]]; },
  };
  function wrap(ctx, text, x, y, maxW, lh) { const words = String(text).split(" "); let line = ""; for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = wd; } else line = t; } if (line) ctx.fillText(line, x, y); return y + lh; }
})();
