/* p2d-kit.js — helpers and registry for the extra 2D physics simulations (p2d-*.js).
   The physics lab defines SIMS and its canvas helpers (dot, arrow, label, glowLine, fmt…) in its inline script,
   which runs after these files. Each p2d file therefore queues a function in window.PX; the lab calls them once
   SIMS exists. Every simulation follows the lab's engine contract:
   { modeName, tag, eqn, controls[], values:null, state:{}, reset(s,c), step(s,c,dt), draw(ctx,s,c,w,h), readouts(s,c) } */
(function () {
  "use strict";
  window.PX = window.PX || [];
  const C = { teal: "#7fe3da", amber: "#ffb703", red: "#ef7a6d", blue: "#7cb3ff", green: "#5bd68c", purple: "#c4a7ff", pink: "#ff8fc7", chalk: "#e6eef8", dim: "#93aac4", line: "#1c3350", panel: "rgba(12,26,46,.88)" };
  const K = (window.PK = {
    C, TAU: Math.PI * 2, g: 9.8, G: 6.67e-11, k: 9e9, e: 1.6e-19, h: 6.63e-34, c: 3e8, me: 9.11e-31,
    rad: (d) => (d * Math.PI) / 180, deg: (r) => (r * 180) / Math.PI,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    /* add variants to a topic */
    add(num, ...variants) { const S = window.SIMS || (typeof SIMS !== "undefined" ? SIMS : null); if (!S) return; (S[num] = S[num] || []).push(...variants.map((v) => Object.assign({ values: null, state: {}, reset() {}, step() {}, readouts: () => [] }, v))); },
    sel: (key, label, opts, def = 0) => ({ key, label, type: "select", options: opts.map((l) => ({ label: l })), default: def }),
    rng: (key, label, min, max, step, def, unit = "", dp) => ({ key, label, min, max, step, default: def, unit, dp }),
    /* drawing */
    txt(ctx, x, y, s, col = C.dim, size = 12, align = "left", bold) { ctx.save(); ctx.fillStyle = col; ctx.font = `${bold ? "600 " : ""}${size}px 'IBM Plex Mono',monospace`; ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.fillText(s, x, y); ctx.restore(); },
    wrap(ctx, x, y, s, maxW, col = C.dim, size = 11.5, lh = 15) { ctx.save(); ctx.font = `${size}px 'IBM Plex Mono',monospace`; ctx.fillStyle = col; const words = String(s).split(" "); let line = "", yy = y; for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; } if (line) ctx.fillText(line, x, yy); ctx.restore(); return yy + lh; },
    line(ctx, x1, y1, x2, y2, col = C.dim, w = 1.5, dash) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); },
    poly(ctx, pts, col, fill, w = 2, close = true) { ctx.save(); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (close) ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); } ctx.restore(); },
    rect(ctx, x, y, w, h, fill, stroke, lw = 1.5) { ctx.save(); if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); } ctx.restore(); },
    circ(ctx, x, y, r, fill, stroke, lw = 1.5) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } ctx.restore(); },
    arr(ctx, x1, y1, x2, y2, col = C.amber, lw = 2.2) { if (Math.hypot(x2 - x1, y2 - y1) < 2) return; if (typeof arrow === "function") arrow(ctx, x1, y1, x2, y2, col, lw); },
    panel(ctx, x, y, w, h, title) { K.rect(ctx, x, y, w, h, C.panel, "rgba(127,227,218,.25)", 1); if (title) K.txt(ctx, x + 10, y + 18, title, C.amber, 12, "left", true); },
    /* lines of text in a panel: items are strings or [string, colour] */
    notes(ctx, x, y, w, items, size = 11.5) { let yy = y; items.forEach((it) => { const [s, col] = Array.isArray(it) ? it : [it, C.dim]; yy = K.wrap(ctx, x, yy, s, w, col, size, size + 3.5) + 2; }); return yy; },
    /* graph axes: returns X(v), Y(v) mappers */
    axes(ctx, x, y, w, h, o) { const X = (v) => x + ((v - o.x0) / (o.x1 - o.x0)) * w, Y = (v) => y + h - ((v - o.y0) / (o.y1 - o.y0)) * h; K.rect(ctx, x, y, w, h, "rgba(5,12,23,.6)", "rgba(255,255,255,.12)", 1);
      const nx = o.nx || 4, ny = o.ny || 4; for (let i = 0; i <= nx; i++) { const v = o.x0 + (i * (o.x1 - o.x0)) / nx, xx = X(v); K.line(ctx, xx, y, xx, y + h, "rgba(255,255,255,.05)", 1); K.txt(ctx, xx, y + h + 13, K.n(v, (o.x1 - o.x0) / nx), C.dim, 9.5, "center"); }
      for (let i = 0; i <= ny; i++) { const v = o.y0 + (i * (o.y1 - o.y0)) / ny, yy = Y(v); K.line(ctx, x, yy, x + w, yy, "rgba(255,255,255,.05)", 1); K.txt(ctx, x - 4, yy + 3, K.n(v, (o.y1 - o.y0) / ny), C.dim, 9.5, "right"); }
      if (o.xl) K.txt(ctx, x + w / 2, y + h + 26, o.xl, C.dim, 10.5, "center"); if (o.yl) { ctx.save(); ctx.translate(x - 30, y + h / 2); ctx.rotate(-Math.PI / 2); K.txt(ctx, 0, 0, o.yl, C.dim, 10.5, "center"); ctx.restore(); } if (o.title) K.txt(ctx, x, y - 6, o.title, C.chalk, 11, "left", true);
      return { X, Y, x, y, w, h, o }; },
    plot(ctx, A, f, x0, x1, col = C.teal, w = 2.2, n = 120, dash) { const pts = []; const lo = Math.min(A.o.y0, A.o.y1), hi = Math.max(A.o.y0, A.o.y1); const segs = [[]]; for (let i = 0; i <= n; i++) { const xv = x0 + ((x1 - x0) * i) / n, yv = f(xv); if (isFinite(yv) && yv >= lo && yv <= hi) segs[segs.length - 1].push([A.X(xv), A.Y(yv)]); else if (segs[segs.length - 1].length) segs.push([]); } segs.forEach((p) => { if (p.length > 1) { if (dash) K.poly(ctx, p, col, null, w, false); else if (typeof glowLine === "function") glowLine(ctx, p, col, w, 6); else K.poly(ctx, p, col, null, w, false); } }); },
    n(v, span) { const a = Math.abs(v); if (v === 0) return "0"; if (span && span < a * 0.02) return String(+v.toFixed(Math.max(0, Math.ceil(-Math.log10(span)) + 1))); if (a >= 1e5 || a < 1e-4) return v.toExponential(1); if (a >= 100) return String(Math.round(v)); if (a < 1) return String(+v.toPrecision(2)); return String(+v.toFixed(a >= 10 ? 1 : 2)); },
    f: (v, d = 2) => (typeof fmt === "function" ? fmt(v, d) : (+v).toFixed(d)),
    sci(v, d = 2) { if (!isFinite(v)) return "—"; if (v === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(v))); if (e >= -2 && e < 5) return K.f(v, d); const m = v / Math.pow(10, e); return m.toFixed(d) + "×10" + String(e).replace(/-/g, "⁻").replace(/\d/g, (q) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[q]); },
    /* simple seeded random for repeatable layouts */
    rnd(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; },
  });
})();
