/* maths-kit.js — shared engine for the WAEC Mathematics lab.
   One scene contract for every subtopic (2D board or 3D WebGL), matching the Physics/Chemistry standard:
     { title, kind:'2d'|'3d', env, values, controls[], draw(g,s,c,B) | build/update/overlay (3D),
       hud(s,c) -> [{title, lines:[text | [text,color]]}],  readouts(s,c) -> [[label,value]],
       steps(s,c) -> [worked-solution lines],  table(s,c) -> html,  note, mistake,
       pointer:{down,move,up},  tick(dt,s,c) (animation),  onChange(s,c,key) }
   2D boards are DPR-sharp, theme-aware (day paper / night blueprint), and accept mouse, pen and touch.
   3D scenes load three.js + physics3d.js on demand and fall back to a 2D drawing when WebGL is missing. */
(function () {
  "use strict";
  const MK = (window.MK = window.MK || {});
  MK.scenes = MK.scenes || {};
  const cs = document.currentScript;
  MK.base = cs && cs.src ? cs.src.replace(/[^\/]*(\?.*)?$/, "") : "/labs/";
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  MK.TAU = TAU; MK.clamp = clamp; MK.rad = (d) => d * Math.PI / 180; MK.deg = (r) => r * 180 / Math.PI;

  /* ======================= number helpers ======================= */
  const gcd = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) { const t = a % b; a = b; b = t; } return a; };
  MK.gcd = gcd; MK.lcm = (a, b) => (a && b ? Math.abs(a / gcd(a, b) * b) : 0);
  MK.round = (n, d) => { const f = Math.pow(10, d); return Math.round(n * f) / f; };
  MK.fmt = (n, d = 3) => {
    if (typeof n !== "number") return String(n);
    if (!isFinite(n)) return isNaN(n) ? "undefined" : n > 0 ? "∞" : "−∞";
    let r = MK.round(n, d); if (Math.abs(r) < 1e-12) r = 0;
    const a = Math.abs(r); let s = a >= 1e9 || (a > 0 && a < 1e-6) ? r.toExponential(3) : String(r);
    return s.replace(/^-/, "−");
  };
  MK.num = (n, d = 2) => (typeof n === "number" && isFinite(n) ? MK.round(n, d).toLocaleString("en-GB", { maximumFractionDigits: d }).replace(/^-/, "−") : MK.fmt(n));
  MK.money = (n, cur = "₦") => (n < 0 ? "−" : "") + cur + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  MK.sig = (n, s) => (n === 0 ? "0" : MK.fmt(Number(n.toPrecision(s)), 12));
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹", SUB = "₀₁₂₃₄₅₆₇₈₉";
  MK.sup = (v) => String(v).replace(/[0-9]/g, (d) => SUP[d]).replace(/[-−]/g, "⁻").replace(/\+/g, "⁺").replace(/\./g, "·");
  MK.sub = (v) => String(v).replace(/[0-9]/g, (d) => SUB[d]);
  MK.std = (n, d = 3) => {                                   // standard form  a × 10ⁿ
    if (n === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(n))), a = MK.round(n / Math.pow(10, e), d);
    return (a === 10 || a === -10) ? MK.fmt(a / 10) + " × 10" + MK.sup(e + 1) : MK.fmt(a, d) + " × 10" + MK.sup(e);
  };
  MK.fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
  MK.nPr = (n, r) => (r > n || r < 0 ? 0 : MK.fact(n) / MK.fact(n - r));
  MK.nCr = (n, r) => { if (r > n || r < 0) return 0; r = Math.min(r, n - r); let c = 1; for (let i = 1; i <= r; i++) c = c * (n - r + i) / i; return Math.round(c); };
  /* exact fractions */
  class Fr {
    constructor(n, d = 1) { if (d === 0) { this.n = n; this.d = 0; return; } if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; this.n = n / g; this.d = d / g; }
    add(o) { o = Fr.of(o); return new Fr(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Fr.of(o); return new Fr(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Fr.of(o); return new Fr(this.n * o.n, this.d * o.d); }
    div(o) { o = Fr.of(o); return new Fr(this.n * o.d, this.d * o.n); }
    get v() { return this.n / this.d; }
    str() { if (this.d === 0) return "undefined"; return this.d === 1 ? MK.fmt(this.n) : MK.fmt(this.n) + "/" + this.d; }
    mixed() { if (this.d <= 1 || Math.abs(this.n) < this.d) return this.str(); const w = Math.trunc(this.n / this.d), r = Math.abs(this.n % this.d); return MK.fmt(w) + " " + r + "/" + this.d; }
    static of(x) { return x instanceof Fr ? x : MK.toFr(x); }
  }
  MK.Fr = Fr;
  MK.toFr = (x, maxD = 1000) => {                           // continued-fraction approximation
    if (Number.isInteger(x)) return new Fr(x, 1);
    let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    for (let i = 0; i < 40; i++) { const a = Math.floor(b), h2 = a * h1 + h0, k2 = a * k1 + k0; if (k2 > maxD) break; h0 = h1; h1 = h2; k0 = k1; k1 = k2; if (Math.abs(x - h1 / k1) < 1e-10) break; b = 1 / (b - a); if (!isFinite(b)) break; }
    return new Fr(h1, k1);
  };
  MK.surd = (n) => { n = Math.round(n); let k = 1, m = n; for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; } return [k, m]; };
  MK.surdStr = (k, m) => (m === 1 ? MK.fmt(k) : (k === 1 ? "" : k === -1 ? "−" : MK.fmt(k)) + "√" + m);
  MK.factorise = (n) => { const f = []; n = Math.abs(Math.round(n)); for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; } if (n > 1) f.push(n); return f; };
  const DIG = "0123456789ABCDEF";
  MK.toBase = (n, b) => { if (n === 0) return "0"; let s = "", x = Math.abs(n); while (x > 0) { s = DIG[x % b] + s; x = Math.floor(x / b); } return (n < 0 ? "−" : "") + s; };
  MK.fromBase = (s, b) => { let v = 0; for (const ch of String(s).toUpperCase()) { const d = DIG.indexOf(ch); if (d < 0 || d >= b) return NaN; v = v * b + d; } return v; };
  /* seeded random (question generators, repeatable simulations) */
  MK.rng = (seed) => { let q = (seed >>> 0) || 1; return () => (q = (Math.imul(q, 1664525) + 1013904223) >>> 0) / 4294967296; };
  MK.ri = (a, b, r = Math.random) => a + Math.floor(r() * (b - a + 1));
  MK.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

  /* ======================= expression parser =======================
     MK.parse("2x^2 - 3x + 1", {vars:['x'], deg:false}) -> f(x)   (implicit products, ^, √, ², π, sin/cos/tan/ln/log…) */
  const FUN = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, sqrt: Math.sqrt, abs: Math.abs,
    ln: Math.log, log: Math.log10, exp: Math.exp, sec: (x) => 1 / Math.cos(x), cosec: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x),
  };
  MK.parse = function (src, opt = {}) {
    const vars = opt.vars || ["x"], deg = !!opt.deg;
    const s = String(src).replace(/\s+/g, "").replace(/[−–]/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/π/g, "pi").replace(/²/g, "^2").replace(/³/g, "^3");
    const toks = []; let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/[0-9.]/.test(ch)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; toks.push({ t: "n", v: parseFloat(s.slice(i, j)) }); i = j; continue; }
      if (/[a-zA-Z]/.test(ch)) {
        let j = i; while (j < s.length && /[a-zA-Z]/.test(s[j])) j++; let w = s.slice(i, j); i = j;
        while (w.length) {                                    // split "xsinx" / "pix" into known words and single-letter variables
          const f = Object.keys(FUN).concat(["pi"]).sort((a, b) => b.length - a.length).find((k) => w.startsWith(k));
          if (f) { toks.push(f === "pi" ? { t: "n", v: Math.PI } : { t: "f", v: f }); w = w.slice(f.length); continue; }
          const c = w[0]; w = w.slice(1);
          if (vars.includes(c)) toks.push({ t: "v", v: c }); else if (c === "e") toks.push({ t: "n", v: Math.E }); else throw new Error("Unknown symbol '" + c + "'");
        }
        continue;
      }
      if ("+-*/^(),√!".includes(ch)) { toks.push({ t: "o", v: ch }); i++; continue; }
      throw new Error("Unexpected '" + ch + "'");
    }
    let p = 0; const peek = () => toks[p], eat = (v) => { const k = toks[p]; if (!k || (v && k.v !== v)) throw new Error("Expected " + (v || "more")); p++; return k; };
    const startsFactor = (k) => k && (k.t === "n" || k.t === "v" || k.t === "f" || (k.t === "o" && (k.v === "(" || k.v === "√")));
    function expr() { let a = term(); for (;;) { const k = peek(); if (k && k.t === "o" && (k.v === "+" || k.v === "-")) { p++; const b = term(), A = a; a = k.v === "+" ? (e) => A(e) + b(e) : (e) => A(e) - b(e); } else return a; } }
    function term() {
      let a = unary();
      for (;;) {
        const k = peek();
        if (k && k.t === "o" && (k.v === "*" || k.v === "/")) { p++; const b = unary(), A = a; a = k.v === "*" ? (e) => A(e) * b(e) : (e) => A(e) / b(e); }
        else if (startsFactor(k)) { const b = power(), A = a; a = (e) => A(e) * b(e); }
        else return a;
      }
    }
    function unary() { const k = peek(); if (k && k.t === "o" && (k.v === "-" || k.v === "+")) { p++; const a = unary(); return k.v === "-" ? (e) => -a(e) : a; } return power(); }
    function power() { const a = postfix(), k = peek(); if (k && k.t === "o" && k.v === "^") { p++; const b = unary(); return (e) => Math.pow(a(e), b(e)); } return a; }
    function postfix() { let a = primary(); while (peek() && peek().v === "!") { p++; const A = a; a = (e) => MK.fact(Math.round(A(e))); } return a; }
    function primary() {
      const k = eat();
      if (k.t === "n") return () => k.v;
      if (k.t === "v") return (e) => e[k.v];
      if (k.t === "o" && k.v === "(") { const a = expr(); eat(")"); return a; }
      if (k.t === "o" && k.v === "√") { const a = power(); return (e) => Math.sqrt(a(e)); }
      if (k.t === "f") {
        let a; if (peek() && peek().v === "(") { p++; a = expr(); eat(")"); } else a = power();
        const f = FUN[k.v], trig = /^(sin|cos|tan|sec|cosec|cot)$/.test(k.v), inv = /^a(sin|cos|tan)$/.test(k.v);
        if (deg && trig) return (e) => f(a(e) * Math.PI / 180);
        if (deg && inv) return (e) => f(a(e)) * 180 / Math.PI;
        return (e) => f(a(e));
      }
      throw new Error("Unexpected '" + k.v + "'");
    }
    const root = expr(); if (p < toks.length) throw new Error("Unexpected '" + toks[p].v + "'");
    const fn = vars.length === 1 ? (x) => root({ [vars[0]]: x }) : (o) => root(o);
    fn.multi = root; return fn;
  };
  MK.tryParse = (src, opt) => { try { return { fn: MK.parse(src, opt), err: "" }; } catch (e) { return { fn: null, err: e.message }; } };
  MK.deriv = (f, x, h = 1e-4) => (f(x + h) - f(x - h)) / (2 * h);
  MK.integrate = (f, a, b, n = 400) => { if (a === b) return 0; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
  MK.solve = (f, a, b) => { let fa = f(a); for (let i = 0; i < 80; i++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
  MK.roots = (f, a, b, n = 400) => { const out = []; let x0 = a, y0 = f(a); for (let i = 1; i <= n; i++) { const x1 = a + (b - a) * i / n, y1 = f(x1); if (isFinite(y0) && isFinite(y1)) { if (y0 === 0) out.push(x0); else if (y0 * y1 < 0 && Math.abs(y0 - y1) < 1e3) out.push(MK.solve(f, x0, x1)); } x0 = x1; y0 = y1; } return out.filter((r, i) => i === 0 || Math.abs(r - out[i - 1]) > 1e-6); };
  /* polynomials as coefficient arrays [a0,a1,a2,...] */
  MK.poly = {
    ev: (c, x) => c.reduceRight((s, a) => s * x + a, 0),
    d: (c) => c.slice(1).map((a, i) => a * (i + 1)),
    str(c, v = "x") {
      let out = ""; for (let i = c.length - 1; i >= 0; i--) { const a = MK.round(c[i], 4); if (!a) continue; const sgn = a < 0 ? " − " : out ? " + " : "", m = Math.abs(a);
        const coef = (m === 1 && i > 0) ? "" : MK.fmt(m); out += (out ? sgn : a < 0 ? "−" : "") + coef + (i > 0 ? v + (i > 1 ? MK.sup(i) : "") : ""); }
      return out || "0";
    },
  };

  /* ======================= theme palette ======================= */
  MK.isNight = () => document.documentElement.classList.contains("night");
  const PAL = {
    day: { bg: "#fbfaf4", paper2: "#f3f1e6", gridMin: "rgba(40,120,104,.10)", gridMaj: "rgba(40,120,104,.30)", axis: "#1d2433", ink: "#1d2433", soft: "#5b6478", faint: "#9aa1b2",
      red: "#c0392b", blue: "#1f5fd6", green: "#15803d", amber: "#c27406", purple: "#7c3aed", teal: "#0f766e", pink: "#be185d",
      fillR: "rgba(192,57,43,.16)", fillB: "rgba(31,95,214,.15)", fillG: "rgba(21,128,61,.16)", fillA: "rgba(217,140,20,.22)", fillP: "rgba(124,58,237,.14)",
      panel: "rgba(255,255,255,.9)", panelEdge: "rgba(29,36,51,.14)", panelInk: "#1d2433", panelSoft: "#5b6478", panelHead: "#1f5fd6", halo: "rgba(251,250,244,.92)", shadow: "rgba(30,30,40,.22)" },
    night: { bg: "#0d1426", paper2: "#111a30", gridMin: "rgba(120,170,255,.07)", gridMaj: "rgba(120,170,255,.20)", axis: "#dbe6ff", ink: "#e8eefc", soft: "#a9b6d3", faint: "#5d6b8a",
      red: "#ff7b72", blue: "#7cb3ff", green: "#5bd68c", amber: "#ffd27a", purple: "#c4a7ff", teal: "#5eead4", pink: "#f9a8d4",
      fillR: "rgba(255,123,114,.18)", fillB: "rgba(124,179,255,.17)", fillG: "rgba(91,214,140,.17)", fillA: "rgba(255,210,122,.2)", fillP: "rgba(196,167,255,.16)",
      panel: "rgba(6,12,24,.74)", panelEdge: "rgba(255,255,255,.14)", panelInk: "#e8f1ff", panelSoft: "#a9b6d3", panelHead: "#8fb4ff", halo: "rgba(13,20,38,.9)", shadow: "rgba(0,0,0,.5)" },
  };
  MK.pal = () => (MK.isNight() ? PAL.night : PAL.day);
  const FONT = (w, s, fam) => `${w} ${s}px ${fam === "serif" ? "'Source Serif 4',Georgia,serif" : fam === "sans" ? "'IBM Plex Sans',sans-serif" : "'JetBrains Mono','IBM Plex Mono',monospace"}`;
  MK.font = FONT;

  /* ======================= procedural environments (cached per theme) ======================= */
  const envCache = {};
  function noise(c, amt, alpha) { const g = c.getContext("2d"), im = g.getImageData(0, 0, c.width, c.height), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; if (alpha) d[i + 3] = alpha; } g.putImageData(im, 0, 0); }
  function envTex(kind) {
    const key = kind + (MK.isNight() ? "n" : "d"); if (envCache[key]) return envCache[key];
    const c = document.createElement("canvas"); c.width = 512; c.height = 512; const g = c.getContext("2d"), P = MK.pal();
    if (kind === "desk") {                                  // wooden desk
      const night = MK.isNight(); g.fillStyle = night ? "#3a2a1d" : "#a77b4f"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 160; i++) { const y = Math.random() * 512, a = 0.04 + Math.random() * 0.16; g.strokeStyle = `rgba(${night ? 20 : 70},${night ? 12 : 40},10,${a})`; g.lineWidth = 0.6 + Math.random() * 2; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 2.2); g.stroke(); }
      noise(c, 14);
    } else { g.fillStyle = P.bg; g.fillRect(0, 0, 512, 512); noise(c, MK.isNight() ? 6 : 7); }
    return (envCache[key] = c);
  }
  /* paper sheet with 2 mm / 1 cm graph ruling (WAEC graph paper) */
  function drawEnv(g, B, env) {
    const P = MK.pal(), W = B.W, H = B.H;
    if (env === "desk") {
      g.fillStyle = g.createPattern(envTex("desk"), "repeat"); g.fillRect(0, 0, W, H);
      const m = 14; g.save(); g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 14; g.shadowOffsetY = 4; g.fillStyle = MK.isNight() ? "#162038" : "#fdfcf6"; g.fillRect(m, m, W - 2 * m, H - 2 * m); g.restore();
      g.save(); g.beginPath(); g.rect(m, m, W - 2 * m, H - 2 * m); g.clip(); g.globalAlpha = 0.5; g.fillStyle = g.createPattern(envTex("paper"), "repeat"); g.fillRect(0, 0, W, H); g.restore();
      return;
    }
    g.fillStyle = g.createPattern(envTex("paper"), "repeat"); g.fillRect(0, 0, W, H);
    if (env === "graph") {
      const s = 8;                                            // 1 small square = 2 mm (at 4 px/mm)
      g.lineWidth = 1; for (let x = 0, i = 0; x <= W; x += s, i++) { g.strokeStyle = i % 5 ? P.gridMin : P.gridMaj; g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
      for (let y = 0, i = 0; y <= H; y += s, i++) { g.strokeStyle = i % 5 ? P.gridMin : P.gridMaj; g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
    }
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, MK.isNight() ? "rgba(0,0,0,.35)" : "rgba(60,50,20,.08)"); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  /* ======================= drawing toolkit (B) ======================= */
  function makeBoard(g, W, H, wide) {
    const P = MK.pal();
    const B = { g, W, H, P, wide, narrow: !wide, area: wide ? { x: 14, y: 14, w: 372, h: H - 28 } : { x: 10, y: 10, w: W - 20, h: H - 20 } };
    B.full = { x: 10, y: 10, w: W - 20, h: H - 20 };
    B.text = (t, x, y, o = {}) => {
      g.save(); g.font = FONT(o.w || 600, o.size || 12, o.fam); g.textAlign = o.align || "left"; g.textBaseline = o.base || "alphabetic";
      if (o.halo !== false) { g.lineWidth = o.haloW || 3.5; g.strokeStyle = o.haloColor || P.halo; g.lineJoin = "round"; g.strokeText(t, x, y); }
      g.fillStyle = o.color || P.ink; g.fillText(t, x, y); g.restore();
    };
    B.line = (x1, y1, x2, y2, color, w = 2, dash) => { g.save(); g.strokeStyle = color || P.ink; g.lineWidth = w; g.lineCap = "round"; if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); };
    B.poly = (pts, stroke, fill, w = 2, close = true, dash) => { if (!pts.length) return; g.save(); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); if (close) g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = w; g.lineJoin = "round"; if (dash) g.setLineDash(dash); g.stroke(); } g.restore(); };
    B.circle = (x, y, r, stroke, fill, w = 2, dash) => { g.save(); g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = w; if (dash) g.setLineDash(dash); g.stroke(); } g.restore(); };
    B.arc = (x, y, r, a0, a1, stroke, w = 2, dash, ccw) => { g.save(); g.beginPath(); g.arc(x, y, r, a0, a1, !!ccw); g.strokeStyle = stroke || P.ink; g.lineWidth = w; if (dash) g.setLineDash(dash); g.stroke(); g.restore(); };
    B.dot = (x, y, color, r = 4.5, label, lo = {}) => { g.save(); g.fillStyle = color || P.red; g.shadowColor = P.shadow; g.shadowBlur = 4; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore(); if (label) B.text(label, x + (lo.dx == null ? 8 : lo.dx), y + (lo.dy == null ? -8 : lo.dy), Object.assign({ size: 12, color: lo.color || P.ink }, lo)); };
    B.arrow = (x1, y1, x2, y2, color, w = 2.4, head = 10) => {
      const a = Math.atan2(y2 - y1, x2 - x1); g.save(); g.strokeStyle = g.fillStyle = color || P.ink; g.lineWidth = w; g.lineCap = "round";
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); g.stroke();
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - head * Math.cos(a - 0.38), y2 - head * Math.sin(a - 0.38)); g.lineTo(x2 - head * Math.cos(a + 0.38), y2 - head * Math.sin(a + 0.38)); g.closePath(); g.fill(); g.restore();
    };
    /* angle arc at vertex V from ray direction a0 to a1 (canvas radians, ccw in maths sense handled by caller) with label */
    B.angle = (vx, vy, a0, a1, r, color, label, fill) => {
      let d = a1 - a0; while (d <= -Math.PI) d += TAU; while (d > Math.PI) d -= TAU;
      g.save(); g.beginPath(); g.moveTo(vx, vy); g.arc(vx, vy, r, a0, a0 + d, d < 0); g.closePath(); g.fillStyle = fill || (color ? color + "22" : P.fillA); if (/^#[0-9a-f]{6}$/i.test(color || "")) g.fillStyle = color + "26"; g.fill();
      g.beginPath(); g.arc(vx, vy, r, a0, a0 + d, d < 0); g.strokeStyle = color || P.amber; g.lineWidth = 2; g.stroke(); g.restore();
      if (label) { const m = a0 + d / 2; B.text(label, vx + Math.cos(m) * (r + 14), vy + Math.sin(m) * (r + 14) + 4, { align: "center", size: 11.5, color: color || P.ink }); }
    };
    B.right = (vx, vy, a0, a1, s = 11, color) => { const p1 = [vx + Math.cos(a0) * s, vy + Math.sin(a0) * s], p2 = [vx + Math.cos(a1) * s, vy + Math.sin(a1) * s]; B.poly([p1, [p1[0] + p2[0] - vx, p1[1] + p2[1] - vy], p2], color || P.ink, null, 1.5, false); };
    B.ticks = (x1, y1, x2, y2, n = 1, color) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 4, cx = mx + Math.cos(a - Math.PI / 2) * o, cy = my + Math.sin(a - Math.PI / 2) * o; B.line(cx - Math.cos(a) * 6, cy - Math.sin(a) * 6, cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, color || P.ink, 1.6); } };
    B.dim = (x1, y1, x2, y2, label, color, off = 16) => {        // dimension line offset from a segment
      const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * off, ny = Math.cos(a) * off, c = color || P.soft;
      B.line(x1 + nx, y1 + ny, x2 + nx, y2 + ny, c, 1.2); B.line(x1, y1, x1 + nx * 1.25, y1 + ny * 1.25, c, 0.8, [2, 3]); B.line(x2, y2, x2 + nx * 1.25, y2 + ny * 1.25, c, 0.8, [2, 3]);
      B.text(label, (x1 + x2) / 2 + nx * 1.7, (y1 + y2) / 2 + ny * 1.7 + 4, { align: "center", size: 11.5, color: color || P.ink });
    };
    B.pill = (t, x, y, color, size = 11.5, align = "left") => {
      g.save(); g.font = FONT(600, size); const w = g.measureText(t).width + 14, h = size + 10, x0 = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
      g.fillStyle = P.panel; g.strokeStyle = P.panelEdge; g.lineWidth = 1; g.beginPath(); g.roundRect ? g.roundRect(x0, y - h + 5, w, h, 8) : g.rect(x0, y - h + 5, w, h); g.fill(); g.stroke();
      g.fillStyle = color || P.panelInk; g.textBaseline = "alphabetic"; g.fillText(t, x0 + 7, y); g.restore(); return w;
    };
    B.panel = (x, y, w, h) => { g.save(); g.shadowColor = P.shadow; g.shadowBlur = 10; g.shadowOffsetY = 2; g.fillStyle = P.panel; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, 10) : g.rect(x, y, w, h); g.fill(); g.restore(); g.save(); g.strokeStyle = P.panelEdge; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, 10) : g.rect(x, y, w, h); g.stroke(); g.restore(); };
    /* HUD card: title + lines, auto height; returns bottom y */
    B.card = (x, y, w, title, lines) => {
      const lh = 17, wrapped = [], cmap = MK.isNight() ? {} : { "#ffd27a": P.amber, "#5bd68c": P.green, "#ff7b72": P.red, "#7cb3ff": P.blue, "#c4a7ff": P.purple, "#8fb4ff": P.blue }; g.save(); g.font = FONT(500, 11.5);
      lines.forEach((ln) => { if (ln == null || ln === "") return; const t = Array.isArray(ln) ? ln[0] : ln, col0 = Array.isArray(ln) ? ln[1] : null, col = col0 && cmap[col0] ? cmap[col0] : col0, big = Array.isArray(ln) && ln[2];
        if (t === "—") { wrapped.push({ sep: true }); return; }
        const words = String(t).split(" "); let cur = ""; g.font = big ? FONT(700, 14) : FONT(500, 11.5);
        words.forEach((wd) => { const test = cur ? cur + " " + wd : wd; if (g.measureText(test).width > w - 20 && cur) { wrapped.push({ t: cur, col, big }); cur = wd; } else cur = test; });
        wrapped.push({ t: cur, col, big }); });
      g.restore();
      const h = 30 + wrapped.reduce((s, l) => s + (l.sep ? 8 : l.big ? 21 : lh), 0);
      B.panel(x, y, w, h); B.text(title.toUpperCase(), x + 10, y + 18, { size: 10, color: P.panelHead, halo: false, w: 700 });
      let yy = y + 36; wrapped.forEach((l) => { if (l.sep) { B.line(x + 10, yy - 6, x + w - 10, yy - 6, P.panelEdge, 1); yy += 8; return; } B.text(l.t, x + 10, yy, { size: l.big ? 14 : 11.5, w: l.big ? 700 : 500, color: l.col || P.panelInk, halo: false }); yy += l.big ? 21 : lh; });
      return y + h;
    };
    /* Cartesian axes in a rect with numbered ticks; returns mapping {X,Y,ix,iy,r} */
    B.axes = (o) => {
      const xmin = o.xmin, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax, r0 = o.rect || B.area;
      const fx = (v) => { if (Math.abs(v) < 1e-9) return "0"; const a = Math.abs(v); return a >= 1e6 ? MK.fmt(v / 1e6, 2) + "M" : a >= 1e4 ? MK.fmt(v / 1e3, 1) + "k" : MK.fmt(v, 2); };
      const padL = o.labels === false ? 0 : xmin >= 0 ? Math.min(46, 10 + 6.2 * Math.max(fx(ymax).length, fx(ymin).length)) : 0, padB = o.labels === false ? 0 : ymin >= 0 ? 18 : 0;
      const r = { x: r0.x + padL, y: r0.y + (o.padT || 0), w: r0.w - padL, h: r0.h - padB - (o.padT || 0) };
      const X = (x) => r.x + (x - xmin) / (xmax - xmin) * r.w, Y = (y) => r.y + r.h - (y - ymin) / (ymax - ymin) * r.h;
      const ix = (px) => xmin + (px - r.x) / r.w * (xmax - xmin), iy = (py) => ymin + (r.y + r.h - py) / r.h * (ymax - ymin);
      const nice = (span, n) => { const raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
      const sx = o.xstep || nice(xmax - xmin, r.w / 46), sy = o.ystep || nice(ymax - ymin, r.h / 34);
      g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
      if (o.grid !== false) {
        g.lineWidth = 1;
        for (let x = Math.ceil(xmin / sx) * sx; x <= xmax + 1e-9; x += sx) { g.strokeStyle = P.gridMaj; g.beginPath(); g.moveTo(X(x) + 0.5, r.y); g.lineTo(X(x) + 0.5, r.y + r.h); g.stroke(); }
        for (let y = Math.ceil(ymin / sy) * sy; y <= ymax + 1e-9; y += sy) { g.strokeStyle = P.gridMaj; g.beginPath(); g.moveTo(r.x, Y(y) + 0.5); g.lineTo(r.x + r.w, Y(y) + 0.5); g.stroke(); }
      }
      g.restore();
      const ax0 = clamp(Y(0), r.y, r.y + r.h), ay0 = clamp(X(0), r.x, r.x + r.w);
      B.arrow(r.x, ax0, r.x + r.w + 2, ax0, P.axis, 1.6, 8); B.arrow(ay0, r.y + r.h, ay0, r.y - 2, P.axis, 1.6, 8);
      if (o.labels !== false) {
        for (let x = Math.ceil(xmin / sx) * sx; x <= xmax + 1e-9; x += sx) { if (Math.abs(x) < 1e-9 && ymin < 0 && ymax > 0) continue; B.line(X(x), ax0 - 3, X(x), ax0 + 3, P.axis, 1.2); B.text(fx(x), X(x), ax0 + 14, { size: 9.5, align: "center", color: P.soft, w: 500 }); }
        for (let y = Math.ceil(ymin / sy) * sy; y <= ymax + 1e-9; y += sy) { if (Math.abs(y) < 1e-9) continue; B.line(ay0 - 3, Y(y), ay0 + 3, Y(y), P.axis, 1.2); B.text(fx(y), ay0 - 6, Y(y) + 3.5, { size: 9.5, align: "right", color: P.soft, w: 500 }); }
        B.text(o.xl || "x", r.x + r.w - 2, ax0 - 8, { size: 12, align: "right", w: 700, fam: "serif", color: P.ink });
        B.text(o.yl || "y", ay0 + 8, r.y + 12, { size: 12, w: 700, fam: "serif", color: P.ink });
      }
      return { X, Y, ix, iy, r, xmin, xmax, ymin, ymax, sx, sy };
    };
    B.legend = (items, x, y) => { let xx = x == null ? B.area.x + 8 : x; const yy = y == null ? B.area.y + 48 : y; items.forEach(([t, col]) => { g.save(); g.fillStyle = col; g.fillRect(xx, yy - 9, 10, 10); g.restore(); B.text(t, xx + 14, yy, { size: 11, w: 700, color: col }); g.save(); g.font = FONT(700, 11); xx += g.measureText(t).width + 30; g.restore(); }); };
    /* plot y=f(x) on mapping m, breaking at discontinuities */
    B.plot = (m, f, color, w = 2.6, o = {}) => {
      g.save(); g.beginPath(); g.rect(m.r.x, m.r.y, m.r.w, m.r.h); g.clip(); g.strokeStyle = color; g.lineWidth = w; g.lineJoin = "round"; if (o.dash) g.setLineDash(o.dash);
      g.beginPath(); let pen = false, py0 = 0; const x0 = o.from == null ? m.xmin : o.from, x1 = o.to == null ? m.xmax : o.to, n = Math.max(80, Math.round(m.r.w * 1.5));
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); if (!isFinite(y)) { pen = false; continue; } const py = m.Y(y); if (pen && Math.abs(py - py0) > m.r.h * 1.5) pen = false; if (!pen) { g.moveTo(m.X(x), py); pen = true; } else g.lineTo(m.X(x), py); py0 = py; }
      g.stroke(); g.restore();
    };
    B.shade = (m, f, a, b, fill, base = () => 0) => {
      g.save(); g.beginPath(); g.rect(m.r.x, m.r.y, m.r.w, m.r.h); g.clip(); g.beginPath(); const n = 160;
      for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; const p = [m.X(x), m.Y(f(x))]; i ? g.lineTo(...p) : g.moveTo(...p); }
      for (let i = n; i >= 0; i--) { const x = a + (b - a) * i / n; g.lineTo(m.X(x), m.Y(base(x))); }
      g.closePath(); g.fillStyle = fill; g.fill(); g.restore();
    };
    /* realistic geometry instruments */
    B.ruler = (x, y, len, ang = 0, unitPx = 40) => {
      g.save(); g.translate(x, y); g.rotate(ang); g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = 8; g.shadowOffsetY = 3;
      const gr = g.createLinearGradient(0, 0, 0, 30); gr.addColorStop(0, "rgba(250,246,222,.92)"); gr.addColorStop(1, "rgba(226,218,176,.92)"); g.fillStyle = gr; g.fillRect(-8, 0, len + 16, 30); g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.strokeStyle = "rgba(90,80,40,.5)"; g.strokeRect(-8, 0, len + 16, 30); g.fillStyle = "#2b2b2b"; g.font = FONT(600, 8);
      for (let i = 0; i <= Math.floor(len / unitPx * 10); i++) { const xx = i * unitPx / 10, big = i % 10 === 0; g.fillRect(xx, 0, 1, big ? 10 : i % 5 === 0 ? 7 : 4); if (big) g.fillText(String(i / 10), xx - 2, 20); }
      g.restore();
    };
    B.protractor = (cx, cy, r, ang = 0) => {
      g.save(); g.translate(cx, cy); g.rotate(ang); g.beginPath(); g.arc(0, 0, r, Math.PI, TAU); g.closePath(); g.fillStyle = "rgba(170,210,255,.22)"; g.fill(); g.strokeStyle = "rgba(40,90,160,.7)"; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = "rgba(20,60,120,.9)"; g.font = FONT(600, 7.5); g.textAlign = "center";
      for (let d = 0; d <= 180; d += 5) { const a = Math.PI + d * Math.PI / 180, l = d % 10 === 0 ? 9 : 5; g.beginPath(); g.moveTo(Math.cos(a) * r, Math.sin(a) * r); g.lineTo(Math.cos(a) * (r - l), Math.sin(a) * (r - l)); g.stroke(); if (d % 30 === 0) g.fillText(String(d), Math.cos(a) * (r - 17), Math.sin(a) * (r - 17) + 3); }
      g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.stroke(); g.restore();
    };
    B.compass = (px, py, qx, qy) => {                         // pivot needle at P, pencil at Q
      const mx = (px + qx) / 2, my = (py + qy) / 2, d = Math.hypot(qx - px, qy - py), up = Math.max(30, 110 - d * 0.35);
      const hx = mx, hy = my - up; g.save(); g.lineCap = "round";
      const leg = (x, y, col) => { const gr = g.createLinearGradient(hx, hy, x, y); gr.addColorStop(0, "#e9edf2"); gr.addColorStop(1, col); g.strokeStyle = gr; g.lineWidth = 4.5; g.beginPath(); g.moveTo(hx, hy); g.lineTo(x, y); g.stroke(); };
      g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 6; leg(px, py, "#8b95a3"); leg(qx, qy, "#d4a017"); g.shadowBlur = 0;
      g.fillStyle = "#c0c6cf"; g.beginPath(); g.arc(hx, hy, 6, 0, TAU); g.fill(); g.fillStyle = "#59606b"; g.fillRect(hx - 2, hy - 16, 4, 11);
      g.fillStyle = "#3a3a3a"; g.beginPath(); g.arc(qx, qy, 2.2, 0, TAU); g.fill(); g.restore();
    };
    return B;
  }
  MK.makeBoard = makeBoard;

  /* ======================= DOM helpers ======================= */
  const el = (tag, attrs, ...kids) => { const e = document.createElement(tag); if (attrs) for (const k in attrs) { if (k === "class") e.className = attrs[k]; else if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); } kids.flat().forEach((k) => k != null && e.appendChild(typeof k === "string" ? document.createTextNode(k) : k)); return e; };
  MK.el = el;
  const css = `
.mk{display:flex;flex-direction:column;gap:10px}
.mk-stage{position:relative;width:100%;border-radius:14px;overflow:hidden;box-shadow:0 6px 22px rgba(20,20,40,.18);background:#0b1220;touch-action:none;user-select:none}
.mk-stage.k2d{aspect-ratio:16/10}.mk-stage.k2d.narrow{aspect-ratio:4/3}
.mk-stage.k3d{aspect-ratio:16/10;cursor:grab;touch-action:pan-y pinch-zoom}.mk-stage.k3d.grabbing{cursor:grabbing}
.mk-canvas,.mk-hud{display:block;width:100%;height:100%;border-radius:0!important}
.mk-stage .orbit-hint{position:absolute;right:12px;bottom:10px;z-index:3;font:600 9.5px 'JetBrains Mono',monospace;color:#dbe7ff;background:rgba(6,12,24,.55);padding:4px 8px;border-radius:7px;pointer-events:none;transition:opacity .6s}
.mk-hint{position:absolute;left:10px;bottom:8px;font:600 9.5px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478);background:var(--g-well,#eef);padding:3px 7px;border-radius:7px;pointer-events:none;opacity:.9}
.mk-poster{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(ellipse at 30% 20%,#2a3d66,#0b1220 70%);color:#e8f1ff;text-align:center;padding:18px}
.mk-poster b{font:700 15px 'Source Serif 4',serif}.mk-poster small{font:500 11.5px 'IBM Plex Sans',sans-serif;color:#a9b9d8;max-width:46ch}
.mk-poster button{font:700 12px 'JetBrains Mono',monospace!important;color:#0b1220!important;background:linear-gradient(135deg,#ffd27a,#ffb347)!important;border:0!important;padding:10px 16px!important;border-radius:11px!important;cursor:pointer;box-shadow:0 6px 18px rgba(255,180,70,.35)!important}
.mk-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.mk-bar .lbl{font:700 9.5px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--g-muted,#5b6478)}.mk-bar .sp{flex:1}
.mk-btn{font:600 11.5px 'JetBrains Mono',monospace!important;padding:7px 11px!important;border-radius:10px!important;cursor:pointer;border:1px solid var(--g-edge,#ccd)!important;background:var(--g-well,#eef)!important;color:var(--g-ink,#1d2433)!important}
.mk-btn:hover{filter:brightness(1.06)}.mk-btn.on,.mk-btn.primary{background:var(--g-active,#dde)!important;box-shadow:inset 0 2px 2px var(--g-highlight,#fff),2px 3px 7px var(--g-shadow,#0002)!important}
.mk-ctl{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:flex-end}
.mk-f{display:flex;flex-direction:column;gap:5px;min-width:140px;flex:1 1 150px}
.mk-f.wide{flex-basis:100%}
.mk-f label{font:600 10.5px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}.mk-f label b{color:var(--red,#b5322f)}
.mk-f input[type=range]{width:100%;accent-color:var(--g-accent,#7962b1)}
.mk-f input[type=text],.mk-f input[type=number],.mk-f select{font:600 12.5px 'JetBrains Mono',monospace;padding:7px 9px;width:100%;box-sizing:border-box}
.mk-f .err{font:600 10.5px 'IBM Plex Sans',sans-serif;color:var(--red,#b5322f);min-height:12px}
.mk-ro{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.mk-ro div{padding:8px 10px;border-radius:12px;background:var(--g-well,#eef);border:1px solid var(--g-edge,#dde)}
.mk-ro i{display:block;font:600 9.5px 'JetBrains Mono',monospace;font-style:normal;letter-spacing:.06em;text-transform:uppercase;color:var(--g-muted,#5b6478)}
.mk-ro b{display:block;font:700 13.5px 'JetBrains Mono',monospace;color:var(--g-ink,#1d2433);margin-top:3px;word-break:break-word}
.mk-box{padding:11px 13px;border-radius:14px;background:var(--g-well,#eef);border:1px solid var(--g-edge,#dde);font:13px/1.55 'IBM Plex Sans',sans-serif;color:var(--g-ink,#1d2433)}
.mk-box h4{margin:0 0 7px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--g-accent,#7962b1);display:flex;gap:8px;align-items:center}
.mk-box h4 .sp{flex:1}
.mk-steps ol{margin:0;padding:0;list-style:none;counter-reset:s}
.mk-steps li{counter-increment:s;padding:4px 0 4px 30px;position:relative;font-family:'JetBrains Mono',monospace;font-size:12.5px}
.mk-steps li::before{content:counter(s);position:absolute;left:0;top:4px;width:20px;height:20px;border-radius:50%;background:var(--g-active,#dde);font:700 10.5px 'JetBrains Mono',monospace;display:flex;align-items:center;justify-content:center}
.mk-steps li.hid{display:none}.mk-steps .more{font:600 11px 'IBM Plex Sans',sans-serif;color:var(--g-muted,#5b6478);padding-left:30px}
.mk-tbl table{width:100%;border-collapse:collapse;font:12px 'JetBrains Mono',monospace}
.mk-tbl th,.mk-tbl td{border:1px solid var(--g-edge,#dde);padding:5px 7px;text-align:center}.mk-tbl th{background:var(--g-active,#dde);font-weight:700}
.mk-tbl tr.hi td{background:rgba(217,164,65,.22);font-weight:700}
.mk-note{border-left:3px solid var(--g-accent,#7962b1)}.mk-mistake{border-left:3px solid var(--red,#b5322f)}
.mk-hudtxt{display:none}.mk.narrow .mk-hudtxt{display:block}
.mk-hudtxt .ln{font:600 12.5px 'JetBrains Mono',monospace;padding:2px 0}
.mk-matrix{display:inline-grid;gap:4px;padding:4px 8px;border-left:2px solid currentColor;border-right:2px solid currentColor;border-radius:6px}
.mk-matrix input{width:54px!important;text-align:center}
@media (max-width:600px){.mk-f{min-width:120px}}`;
  const stl = document.createElement("style"); stl.textContent = css; document.head.appendChild(stl);

  function control(cc, c, onCh) {
    const f = el("div", { class: "mk-f" + (cc.wide ? " wide" : "") });
    const fmtV = (v) => (cc.fmt ? cc.fmt(v) : (typeof v === "number" ? MK.fmt(v, 4) : v)) + (cc.unit ? " " + cc.unit : "");
    if (cc.type === "select") {
      const lab = el("label", null, cc.label), sel = el("select", { "aria-label": cc.label });
      cc.options.forEach((o) => { const op = Array.isArray(o) ? o : [o, o]; const e = el("option", { value: op[0] }, op[1]); if (String(op[0]) === String(c[cc.key])) e.selected = true; sel.appendChild(e); });
      sel.addEventListener("change", () => { c[cc.key] = isNaN(+sel.value) || sel.value === "" ? sel.value : +sel.value; onCh(cc.key); });
      f.append(lab, sel); f.sync = () => { sel.value = String(c[cc.key]); }; return f;
    }
    if (cc.type === "text" || cc.type === "number") {
      const lab = el("label", null, cc.label), inp = el("input", { type: cc.type, value: c[cc.key], "aria-label": cc.label, spellcheck: "false" }), err = el("div", { class: "err" });
      if (cc.type === "number") { if (cc.min != null) inp.min = cc.min; if (cc.max != null) inp.max = cc.max; if (cc.step != null) inp.step = cc.step; }
      inp.addEventListener("input", () => { let v = inp.value; if (cc.type === "number") { v = parseFloat(v); if (isNaN(v)) return; if (cc.min != null) v = Math.max(cc.min, v); if (cc.max != null) v = Math.min(cc.max, v); } c[cc.key] = v; onCh(cc.key); });
      f.append(lab, inp, err); f.sync = () => { if (document.activeElement !== inp) inp.value = c[cc.key]; }; f.err = err; if (cc.wide !== false && cc.type === "text") f.classList.add("wide"); return f;
    }
    if (cc.type === "matrix") {
      const lab = el("label", null, cc.label), grid = el("div", { class: "mk-matrix" }), M = c[cc.key]; grid.style.gridTemplateColumns = `repeat(${M[0].length},auto)`;
      const inputs = []; M.forEach((row, i) => row.forEach((v, j) => { const inp = el("input", { type: "number", value: v, "aria-label": `${cc.label} row ${i + 1} column ${j + 1}` }); inp.addEventListener("input", () => { const n = parseFloat(inp.value); c[cc.key][i][j] = isNaN(n) ? 0 : n; onCh(cc.key); }); inputs.push([inp, i, j]); grid.appendChild(inp); }));
      f.style.flex = "0 0 auto"; f.style.minWidth = "0"; f.append(lab, grid); f.sync = () => inputs.forEach(([inp, i, j]) => { if (document.activeElement !== inp) inp.value = c[cc.key][i][j]; }); return f;
    }
    if (cc.type === "button") { const b = el("button", { type: "button", class: "mk-btn primary" }, cc.label); b.addEventListener("click", () => { cc.action(c); onCh(cc.key || "_btn"); }); f.style.flex = "0 0 auto"; f.style.minWidth = "0"; f.appendChild(b); f.sync = () => {}; return f; }
    if (cc.type === "toggle") { const b = el("button", { type: "button", class: "mk-btn" }); const paint = () => { b.textContent = (c[cc.key] ? "☑ " : "☐ ") + cc.label; b.classList.toggle("on", !!c[cc.key]); }; b.addEventListener("click", () => { c[cc.key] = c[cc.key] ? 0 : 1; paint(); onCh(cc.key); }); paint(); f.style.flex = "0 0 auto"; f.style.minWidth = "0"; f.appendChild(b); f.sync = paint; return f; }
    if (cc.type === "tabs") {                                  // segmented mode switch
      const lab = el("label", null, cc.label), row = el("div", { class: "mk-bar" }), bs = [];
      cc.options.forEach((o) => { const op = Array.isArray(o) ? o : [o, o]; const b = el("button", { type: "button", class: "mk-btn" }, op[1]); b.addEventListener("click", () => { c[cc.key] = op[0]; paint(); onCh(cc.key); }); bs.push([b, op[0]]); row.appendChild(b); });
      const paint = () => bs.forEach(([b, v]) => b.classList.toggle("on", String(v) === String(c[cc.key]))); paint(); f.classList.add("wide"); f.append(lab, row); f.sync = paint; return f;
    }
    const lab = el("label"), val = el("b"), inp = el("input", { type: "range", min: cc.min, max: cc.max, step: cc.step || 1, value: c[cc.key], "aria-label": cc.label });
    lab.append(cc.label + ": ", val); val.textContent = fmtV(c[cc.key]);
    inp.addEventListener("input", () => { c[cc.key] = parseFloat(inp.value); val.textContent = fmtV(c[cc.key]); onCh(cc.key); });
    f.append(lab, inp); f.sync = () => { inp.value = c[cc.key]; val.textContent = fmtV(c[cc.key]); }; return f;
  }

  /* ======================= host ======================= */
  const mounted = new Set();
  MK.def = (key, sc) => { MK.scenes[key] = sc; return sc; };
  MK.when = (k, ...vals) => (c) => vals.includes(c[k]);
  MK.has = (key) => !!MK.scenes[key];

  MK.mount = function (panel, key) {
    const sc = MK.scenes[key]; if (!sc) return false;
    panel.innerHTML = ""; panel.classList.add("mk-host");
    const c = JSON.parse(JSON.stringify(sc.values || {})), s = sc.state ? sc.state(c) : {};
    const is3d = sc.kind === "3d";
    const root = el("div", { class: "mk" }), stage = el("div", { class: "mk-stage " + (is3d ? "k3d" : "k2d") });
    root.appendChild(stage); panel.appendChild(root);
    const bar = el("div", { class: "mk-bar" }), ctl = el("div", { class: "mk-ctl" }), ro = el("div", { class: "mk-ro" });
    const hudTxt = el("div", { class: "mk-box mk-hudtxt" }), work = el("div", { class: "mk-box mk-steps" }), tbl = el("div", { class: "mk-box mk-tbl" });
    const H = { sc, s, c, key, stage, root, ctl, ro, work, tbl, hudTxt, bar, dirty: true, shown: 2, visible: true };
    const syncers = [];
    const vis = () => syncers.forEach((f) => { if (f.cc && f.cc.show) f.style.display = f.cc.show(c) ? "" : "none"; });
    H.refresh = () => { syncers.forEach((f) => f.sync && f.sync()); vis(); };
    const onCh = (k) => { sc.onChange && sc.onChange(s, c, k, H); if (k === "_reset" || sc.syncAll) H.refresh(); else vis(); H.dirty = true; H.side(); if (H.render2d) H.render2d(); };
    H.onCh = onCh;
    (typeof sc.controls === "function" ? sc.controls(c) : sc.controls || []).forEach((cc) => { const f = control(cc, c, onCh); f.cc = cc; syncers.push(f); ctl.appendChild(f); });
    H.controlEls = syncers; vis();
    // transport / bar
    const bReset = el("button", { type: "button", class: "mk-btn" }, "⟲ Reset");
    bReset.addEventListener("click", () => { const v = JSON.parse(JSON.stringify(sc.values || {})); Object.keys(c).forEach((k) => delete c[k]); Object.assign(c, v); const ns = sc.state ? sc.state(c) : {}; Object.keys(s).forEach((k) => delete s[k]); Object.assign(s, ns); sc.reset && sc.reset(s, c, H); H.shown = 2; onCh("_reset"); if (H.reset3d) H.reset3d(); });
    if (sc.tick) { H.playing = sc.autoplay !== false; const bp = el("button", { type: "button", class: "mk-btn" }); const paint = () => { bp.textContent = H.playing ? "❚❚ Pause" : "▶ Play"; }; paint(); bp.addEventListener("click", () => { H.playing = !H.playing; paint(); if (H.playing) H.kick && H.kick(); }); bar.appendChild(bp); H.paintPlay = paint; }
    bar.appendChild(bReset);
    (sc.actions || []).forEach((a) => { const b = el("button", { type: "button", class: "mk-btn" }, a.label); b.addEventListener("click", () => { a.run(s, c, H); onCh("_act"); H.kick && H.kick(); }); bar.appendChild(b); });
    if (is3d && sc.views) { bar.appendChild(el("span", { class: "sp" })); bar.appendChild(el("span", { class: "lbl" }, "view")); sc.views.forEach((v) => { const b = el("button", { type: "button", class: "mk-btn" }, v.label); b.addEventListener("click", () => H.setView && H.setView(v)); bar.appendChild(b); }); }
    root.append(bar, ctl, hudTxt, ro);
    if (sc.steps) root.appendChild(work);
    if (sc.table) root.appendChild(tbl);
    if (sc.note) root.appendChild(el("div", { class: "mk-box mk-note", html: "<h4>Examiner's focus</h4>" + sc.note }));
    if (sc.mistake) root.appendChild(el("div", { class: "mk-box mk-mistake", html: "<h4>Common mistake</h4>" + sc.mistake }));
    // worked solution with progressive reveal
    work.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; const a = b.dataset.a; if (a === "next") H.shown++; else if (a === "all") H.shown = 99; else if (a === "hide") H.shown = 0; H.dirty = true; H.side(true); });
    let roKey = "", stKey = "", tbKey = "", hdKey = "";
    H.side = (force) => {
      if (sc.readouts) { const items = sc.readouts(s, c) || [], k = JSON.stringify(items); if (k !== roKey) { roKey = k; ro.innerHTML = items.map(([l, v]) => `<div><i>${l}</i><b>${v}</b></div>`).join(""); } }
      if (sc.steps) { const st = sc.steps(s, c) || [], k = JSON.stringify(st) + H.shown; if (k !== stKey || force) { stKey = k; const n = st.length, sh = Math.min(H.shown, n);
        work.innerHTML = `<h4>Worked solution <span class="sp"></span><button class="mk-btn" data-a="next" ${sh >= n ? "disabled" : ""}>Next step ▸</button><button class="mk-btn" data-a="all">Show all</button><button class="mk-btn" data-a="hide">Hide</button></h4><ol>${st.map((t, i) => `<li class="${i < sh ? "" : "hid"}">${t}</li>`).join("")}</ol>${sh < n ? `<div class="more">${n - sh} more step${n - sh > 1 ? "s" : ""} — try it yourself, then reveal.</div>` : ""}`; } }
      if (sc.table) { const h = sc.table(s, c) || "", k = h; if (k !== tbKey) { tbKey = k; tbl.innerHTML = "<h4>Table</h4>" + h; tbl.style.display = h ? "" : "none"; } }
      if (sc.hud) { const p = sc.hud(s, c) || [], k = JSON.stringify(p); if (k !== hdKey) { hdKey = k; hudTxt.innerHTML = p.map((pp) => `<h4>${pp.title}</h4>` + pp.lines.filter((l) => l !== "—").map((l) => `<div class="ln">${Array.isArray(l) ? l[0] : l}</div>`).join("")).join(""); } }
    };
    if (is3d) mount3d(H); else mount2d(H);
    H.side(true);
    mounted.add(H); panel._mk = H;
    return true;
  };

  /* ---------- 2D board ---------- */
  function mount2d(H) {
    const { sc, s, c, stage } = H;
    const cv = el("canvas", { class: "mk-canvas", role: "img", "aria-label": (sc.title || "simulation") + " diagram" }); stage.appendChild(cv);
    if (sc.hint) stage.appendChild(el("span", { class: "mk-hint" }, sc.hint));
    const g = cv.getContext("2d"); let W = 640, Hh = 400, wide = true, scale = 1;
    function size() {
      const w = stage.clientWidth || 640; wide = w >= 560; stage.classList.toggle("narrow", !wide); H.root.classList.toggle("narrow", !wide);
      W = wide ? 640 : 440; Hh = wide ? 400 : 330; const dpr = Math.min(2.5, window.devicePixelRatio || 1); scale = (w / W) * dpr;
      const nw = Math.round(W * scale), nh = Math.round(Hh * scale); if (cv.width !== nw || cv.height !== nh) { cv.width = nw; cv.height = nh; return true; } return false;
    }
    H.render2d = () => {
      g.setTransform(scale, 0, 0, scale, 0, 0); const B = makeBoard(g, W, Hh, wide); H.B = B;
      drawEnv(g, B, sc.env || "graph");
      try { sc.draw && sc.draw(g, s, c, B, H); } catch (e) { console.error(H.key, e); B.text("⚠ " + e.message, 20, 30, { color: B.P.red }); }
      if (sc.title) B.pill(sc.title, 12, 26, B.P.panelHead, 11);
      if (wide && sc.hud) { let y = 12; (sc.hud(s, c) || []).forEach((p) => { if (y < Hh - 40) y = B.card(W - 246, y, 236, p.title, p.lines) + 8; }); }
    };
    size(); H.render2d();
    const ro = new ResizeObserver(() => { if (size()) H.render2d(); }); ro.observe(stage);
    // pointer input (mouse, pen, touch)
    const toL = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * Hh }; };
    let drag = false;
    if (sc.pointer) {
      stage.style.touchAction = "none";
      cv.addEventListener("pointerdown", (e) => { const p = toL(e); if (sc.pointer.down && sc.pointer.down(p, s, c, H.B, H)) { drag = true; cv.setPointerCapture(e.pointerId); e.preventDefault(); H.dirty = true; H.side(); H.render2d(); } });
      cv.addEventListener("pointermove", (e) => { const p = toL(e); if (drag) { sc.pointer.move && sc.pointer.move(p, s, c, H.B, H); H.side(); H.render2d(); } else if (sc.pointer.hover) { cv.style.cursor = sc.pointer.hover(p, s, c, H.B) ? "grab" : "default"; } });
      const up = (e) => { if (!drag) return; drag = false; sc.pointer.up && sc.pointer.up(toL(e), s, c, H.B, H); H.side(); H.render2d(); };
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    } else stage.style.touchAction = "pan-y";
    // animation (only while on screen)
    if (sc.tick) {
      let last = 0, raf = 0;
      const loop = (t) => { raf = 0; if (!H.playing || !H.visible || !document.body.contains(cv)) { last = 0; return; } const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t; const keep = sc.tick(dt, s, c, H); H.side(); H.render2d(); if (keep === false) { H.playing = false; H.paintPlay && H.paintPlay(); last = 0; return; } raf = requestAnimationFrame(loop); };
      H.kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
      const io = new IntersectionObserver((en) => { H.visible = en[0].isIntersecting; if (H.visible) H.kick(); }); io.observe(stage);
      H.kick();
    }
  }
  // redraw 2D boards on theme change
  new MutationObserver(() => mounted.forEach((H) => { if (!document.body.contains(H.stage)) { mounted.delete(H); return; } H.render2d && H.render2d(); })).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  /* ---------- 3D (three.js via physics3d.js, loaded on demand) ---------- */
  MK.envs3d = MK.envs3d || {};
  MK.load3D = function () {
    if (MK._l3) return MK._l3;
    const load = (src) => new Promise((res, rej) => { const sEl = document.createElement("script"); sEl.src = MK.base + src; sEl.onload = res; sEl.onerror = rej; document.head.appendChild(sEl); });
    MK._l3 = (window.THREE ? Promise.resolve() : load("vendor/three.bundle.js")).then(() => (window.P3D ? 0 : load("physics3d.js"))).then(() => {
      const ok = !!(window.P3D && window.P3D.ready); if (ok) Object.keys(MK.envs3d).forEach((k) => { window.P3D.envs[k] = MK.envs3d[k]; }); return ok;
    }).catch(() => false);
    return MK._l3;
  };
  let active3d = null;
  MK.unmount3d = function () { if (!active3d) return; const a = active3d; active3d = null; cancelAnimationFrame(a.raf); try { window.P3D.end(); } catch (e) { } a.poster(); };
  function webglOK() { try { const t = document.createElement("canvas"); return !!(t.getContext("webgl2") || t.getContext("webgl")); } catch (e) { return false; } }
  function mount3d(H) {
    const { sc, s, c, stage } = H;
    const showFallback = () => {
      stage.classList.remove("k3d"); stage.classList.add("k2d"); stage.innerHTML = "";
      if (sc.draw) { H.sc = Object.assign({}, sc); mount2d(H); H.render2d(); }
      else stage.appendChild(el("div", { class: "mk-poster" }, el("b", null, sc.title || "3D lab"), el("small", null, "This 3D lab needs WebGL, which this browser has switched off. The controls, readouts and worked solution below still work.")));
    };
    if (!webglOK()) { showFallback(); return; }
    const poster = () => {
      stage.innerHTML = ""; const btn = el("button", { type: "button" }, "▶ Launch 3D lab");
      stage.appendChild(el("div", { class: "mk-poster" }, el("b", null, sc.title || "3D lab"), el("small", null, sc.blurb || "Photoreal three.js scene — drag to orbit, scroll to zoom, double-click to reset the camera."), btn));
      btn.addEventListener("click", launch);
    };
    H.poster = poster;
    async function launch() {
      stage.innerHTML = ""; stage.appendChild(el("div", { class: "mk-poster" }, el("b", null, "Loading 3D engine…")));
      const ok = await MK.load3D(); if (!ok) { showFallback(); return; }
      MK.unmount3d();
      stage.innerHTML = ""; const hud = el("canvas", { class: "mk-hud", width: 640, height: 400 }); stage.appendChild(hud);
      const variant = { state: s, values: c, modeName: "maths:" + H.key };
      const P3D = window.P3D; let ok2 = false;
      try { ok2 = P3D.begin(variant, sc, hud); } catch (e) { console.error("maths3d begin", e); }
      if (!ok2) { try { P3D.end(); } catch (e) { } showFallback(); return; }
      const S = P3D.S, ctx = hud.getContext("2d");
      H.S = S;
      H.setView = (v) => { const o = S.orbit, cam = typeof v.cam === "function" ? v.cam(s, c) : v.cam, tg = P3D.util.V3(...cam[1]), d = P3D.util.V3(...cam[0]).sub(tg), r = d.length(); o.touched = true; o.home.target.copy(tg); o.target.copy(tg); o.tr = r; o.home.r = r; o.ty = o.home.yaw = Math.atan2(d.x, d.z); o.tp = o.home.pitch = Math.asin(d.y / r); };
      H.reset3d = () => { sc.reset3d && sc.reset3d(S, s, c); };
      const handle = { raf: 0, poster };
      active3d = handle; let last = null;
      const loop = (t) => {
        if (active3d !== handle) return;
        if (!document.body.contains(hud)) { MK.unmount3d(); return; }
        if (last === null) last = t; const dt = Math.min((t - last) / 1000, 0.05); last = t;
        ctx.clearRect(0, 0, 640, 400); P3D.frame(dt, H.playing !== false, 1);
        const HB = hudBoard(ctx);
        try { sc.overlay && sc.overlay(ctx, s, c, S, HB); } catch (e) { console.error(e); } if (sc.title) HB.pill(sc.title, 12, 26, PAL.night.panelHead, 11);
        if (sc.hud) { let y = 12; (sc.hud(s, c) || []).forEach((p) => { if (y < 360) y = HB.card(640 - 246, y, 236, p.title, p.lines) + 8; }); }
        H.side();
        handle.raf = requestAnimationFrame(loop);
      };
      handle.raf = requestAnimationFrame(loop);
    }
    poster();
  }
  /* HUD board for 3D overlays: always uses the night palette (dark panels over the 3D render) */
  function hudBoard(ctx) { const saved = MK.isNight; MK.isNight = () => true; const B = makeBoard(ctx, 640, 400, true); MK.isNight = saved; return B; }
  MK.hudBoard = hudBoard;
  MK.proj = (S, x, y, z) => { const v = new window.THREE.Vector3(x, y, z).project(S.camera); return { x: (v.x * 0.5 + 0.5) * 640, y: (-v.y * 0.5 + 0.5) * 400, z: v.z }; };

  /* table helper */
  MK.table = (head, rows, hiRow) => `<table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r, i) => `<tr class="${i === hiRow ? "hi" : ""}">${r.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("")}</table>`;
})();
