/* m-number.js — WAEC Core Mathematics, Topic A: Number and Numeration (upgraded scenes A-a … A-o). */
(function () {
  "use strict";
  const MK = window.MK, f = MK.fmt, T = MK.table;
  const parseFr = (t) => { t = String(t).trim().replace(/−/g, "-"); const m = t.match(/^(-?\d+)\s+(\d+)\/(\d+)$/); if (m) { const w = +m[1], n = +m[2], d = +m[3]; return new MK.Fr((Math.abs(w) * d + n) * (w < 0 ? -1 : 1), d); } const q = t.match(/^(-?\d+)\/(-?\d+)$/); if (q) return new MK.Fr(+q[1], +q[2]); const v = parseFloat(t); return isNaN(v) ? null : MK.toFr(v); };
  MK.parseFr = parseFr;

  /* ---------------- A-a Number bases ---------------- */
  MK.def("A-a", {
    title: "Number bases", env: "graph",
    values: { mode: "convert", num: "10110", from: 2, to: 10, a: "1011", b: "111", base: 2 },
    controls: [
      { type: "tabs", key: "mode", label: "Mode", options: [["convert", "Convert"], ["add", "Add"], ["sub", "Subtract"], ["mul", "Multiply"]] },
      { type: "text", key: "num", label: "Number", wide: false, show: MK.when("mode", "convert") },
      { type: "select", key: "from", label: "From base", show: MK.when("mode", "convert"), options: [2, 3, 4, 5, 6, 7, 8, 9, 10, 16].map((b) => [b, "Base " + b]) },
      { type: "select", key: "to", label: "To base", show: MK.when("mode", "convert"), options: [2, 3, 4, 5, 6, 7, 8, 9, 10, 16].map((b) => [b, "Base " + b]) },
      { type: "text", key: "a", label: "First number", wide: false, show: MK.when("mode", "add", "sub", "mul") },
      { type: "text", key: "b", label: "Second number", wide: false, show: MK.when("mode", "add", "sub", "mul") },
      { type: "select", key: "base", label: "Base", show: MK.when("mode", "add", "sub", "mul"), options: [2, 3, 4, 5, 6, 7, 8, 9].map((b) => [b, "Base " + b]) },
    ],
    state: () => ({}),
    calc(c) {
      if (c.mode === "convert") { const v = MK.fromBase(c.num, c.from); return { v, ok: !isNaN(v) && String(c.num).length > 0, out: isNaN(v) ? "" : MK.toBase(v, c.to) }; }
      const A = MK.fromBase(c.a, c.base), Bv = MK.fromBase(c.b, c.base); const ok = !isNaN(A) && !isNaN(Bv) && c.a !== "" && c.b !== "";
      const R = c.mode === "add" ? A + Bv : c.mode === "sub" ? A - Bv : A * Bv; return { A, Bv, R, ok, out: ok ? MK.toBase(R, c.base) : "" };
    },
    draw(g, s, c, B) {
      const P = B.P, r = this.calc(c), a = B.area, x0 = a.x + 10;
      if (!r.ok) { B.text("Digits must be valid for the base (e.g. base 2 uses only 0 and 1).", x0, a.y + 60, { color: P.red, size: 12 }); return; }
      if (c.mode === "convert") {
        const ds = String(c.num).toUpperCase().split(""), n = ds.length, cw = Math.min(54, (a.w - 20) / n);
        B.text("Place values in base " + c.from, x0, a.y + 46, { size: 11, color: P.soft });
        ds.forEach((d, i) => {
          const p = n - 1 - i, x = x0 + i * cw, y = a.y + 56;
          B.panel(x, y, cw - 4, 66); B.text(c.from + MK.sup(p), x + cw / 2 - 2, y + 16, { align: "center", size: 10.5, color: P.blue, halo: false });
          B.text(d, x + cw / 2 - 2, y + 42, { align: "center", size: 20, w: 700, halo: false });
          B.text(f(MK.fromBase(d, 16) * Math.pow(c.from, p)), x + cw / 2 - 2, y + 60, { align: "center", size: 9, color: P.soft, halo: false });
        });
        B.text("= " + f(r.v) + " (base 10)", x0, a.y + 146, { size: 15, w: 700, color: P.green });
        // repeated division ladder
        let v = r.v, y = a.y + 176; const rows = []; if (v === 0) rows.push([0, 0, 0]);
        while (v > 0 && rows.length < 12) { rows.push([v, Math.floor(v / c.to), v % c.to]); v = Math.floor(v / c.to); }
        if (c.to !== 10) {
          B.text("Divide repeatedly by " + c.to + " — read remainders upward ↑", x0, y, { size: 11, color: P.soft }); y += 16;
          const lh = Math.min(16, (a.y + a.h - y - 10) / Math.max(1, rows.length));
          rows.forEach(([n0, q, rem], i) => { const yy = y + i * lh + 10; B.text(c.to + " | " + f(n0), x0 + 4, yy, { size: 11.5, halo: false }); B.text("rem " + MK.toBase(rem, 16), x0 + 170, yy, { size: 11.5, color: P.red, halo: false }); });
          B.arrow(x0 + 240, y + rows.length * lh, x0 + 240, y + 4, P.red, 2, 8);
        }
      } else {
        const A = MK.toBase(r.A, c.base), Bs = MK.toBase(r.Bv, c.base), L = Math.max(A.length, Bs.length, r.out.replace("−", "").length) + 1, cw = 26, xr = a.x + Math.min(a.w - 30, 60 + L * cw);
        const col = (str, y, color) => { const t = str.replace("−", ""); [...t].reverse().forEach((d, i) => B.text(d, xr - i * cw, y, { size: 22, w: 700, align: "center", color: color || P.ink })); };
        const opSym = c.mode === "add" ? "+" : c.mode === "sub" ? "−" : "×";
        B.text("Column method in base " + c.base, x0, a.y + 46, { size: 11, color: P.soft });
        if (c.mode === "add" || c.mode === "sub") {
          // carries / borrows digit by digit
          const da = [...A].reverse().map((d) => MK.fromBase(d, 16)), db = [...Bs].reverse().map((d) => MK.fromBase(d, 16)), marks = [];
          let carry = 0; for (let i = 0; i < L; i++) { const x = (da[i] || 0), y = (db[i] || 0);
            if (c.mode === "add") { const t = x + y + carry; carry = Math.floor(t / c.base); if (carry) marks[i + 1] = carry; }
            else { let t = x - y - carry; if (t < 0) { t += c.base; carry = 1; marks[i] = "+" + c.base; } else carry = 0; } }
          marks.forEach((m, i) => m && B.text(String(m), xr - i * cw + (c.mode === "sub" ? -2 : 0), a.y + 76, { size: 10, color: P.red, align: "center" }));
          col(A, a.y + 106); col(Bs, a.y + 140); B.text(opSym, xr - L * cw, a.y + 140, { size: 22, w: 700 });
          B.line(xr - L * cw, a.y + 150, xr + 14, a.y + 150, P.ink, 2); col(r.out, a.y + 182, P.green); if (r.R < 0) B.text("−", xr - (r.out.length) * cw, a.y + 182, { size: 22, w: 700, color: P.green });
          B.line(xr - L * cw, a.y + 192, xr + 14, a.y + 192, P.ink, 2); B.line(xr - L * cw, a.y + 196, xr + 14, a.y + 196, P.ink, 2);
        } else {
          col(A, a.y + 90); col(Bs, a.y + 122); B.text("×", xr - L * cw - 10, a.y + 122, { size: 22, w: 700 }); B.line(xr - (L + 2) * cw, a.y + 132, xr + 14, a.y + 132, P.ink, 2);
          const db = [...Bs].reverse(); let y = a.y + 160;
          db.forEach((d, i) => { if (y > a.y + a.h - 60) return; const pp = MK.toBase(r.A * MK.fromBase(d, 16), c.base) + "0".repeat(i); col(pp, y, P.soft); y += 26; });
          B.line(xr - (L + 2) * cw, y - 16, xr + 14, y - 16, P.ink, 2); col(r.out, y + 10, P.green);
        }
        B.text("Check in base 10: " + f(r.A) + " " + opSym + " " + f(r.Bv) + " = " + f(r.R), x0, a.y + a.h - 14, { size: 12, color: P.blue });
      }
    },
    hud(s, c) {
      const r = this.calc(c); if (!r.ok) return [{ title: "Formula", lines: ["N₁₀ = Σ dᵢ × bⁱ", "—", ["Invalid digit for this base", "#ff7b72"]] }];
      if (c.mode === "convert") { const ds = String(c.num).toUpperCase().split(""), n = ds.length; const terms = ds.map((d, i) => d + "×" + c.from + MK.sup(n - 1 - i)).slice(0, 6).join(" + ") + (n > 6 ? " + …" : "");
        return [{ title: "Formula", lines: ["N₁₀ = Σ dᵢ × bⁱ", terms, ["= " + f(r.v) + "₁₀", null, true], "—", "Base 10 → base " + c.to + ": divide by " + c.to + ", remainders read upward", [String(c.num).toUpperCase() + MK.sub(c.from) + " = " + r.out + MK.sub(c.to), "#ffd27a", true]] }, { title: "Notation", lines: ["Subscript = base. Base 16 digits: 0–9, A=10 … F=15"] }]; }
      const op = c.mode === "add" ? "+" : c.mode === "sub" ? "−" : "×";
      return [{ title: "Result", lines: [c.a + MK.sub(c.base) + " " + op + " " + c.b + MK.sub(c.base), ["= " + r.out + MK.sub(c.base), null, true], "—", "Carry/borrow in groups of " + c.base + " (not 10)"] }];
    },
    readouts(s, c) { const r = this.calc(c); if (!r.ok) return [["Status", "invalid digits"]]; return c.mode === "convert" ? [["Base 10 value", f(r.v)], ["In base " + c.to, r.out], ["Digits", String(c.num).length]] : [["First (base 10)", f(r.A)], ["Second (base 10)", f(r.Bv)], ["Answer (base " + c.base + ")", r.out]]; },
    steps(s, c) {
      const r = this.calc(c); if (!r.ok) return ["Check every digit is less than the base."];
      if (c.mode === "convert") {
        const ds = String(c.num).toUpperCase().split(""), n = ds.length, st = [];
        if (c.from !== 10) st.push(`Expand: ${ds.map((d, i) => `${d}×${c.from}${MK.sup(n - 1 - i)}`).join(" + ")}`, `= ${ds.map((d, i) => f(MK.fromBase(d, 16) * Math.pow(c.from, n - 1 - i))).join(" + ")} = ${f(r.v)}₁₀`);
        if (c.to !== 10) { let v = r.v; while (v > 0) { st.push(`${f(v)} ÷ ${c.to} = ${Math.floor(v / c.to)} remainder ${MK.toBase(v % c.to, 16)}`); v = Math.floor(v / c.to); } st.push(`Read remainders from the bottom up: ${r.out}${MK.sub(c.to)}`); }
        else st.push(`Answer: ${f(r.v)}₁₀`);
        return st;
      }
      const op = c.mode === "add" ? "+" : c.mode === "sub" ? "−" : "×";
      return [`Convert ${c.a}${MK.sub(c.base)} = ${f(r.A)}₁₀ and ${c.b}${MK.sub(c.base)} = ${f(r.Bv)}₁₀`, `${f(r.A)} ${op} ${f(r.Bv)} = ${f(r.R)}₁₀`, `Convert back: ${f(r.R)}₁₀ = ${r.out}${MK.sub(c.base)}`, `Or work in columns directly, carrying/borrowing ${c.base} at a time.`];
    },
    note: "Know both routes: convert through base 10, and direct column arithmetic in the given base. Always state the base as a subscript in your final answer.",
    mistake: "Carrying 10 instead of the base (in base 5, 3 + 4 = 12₅ — write 2, carry 1). Also reading remainders top-down instead of bottom-up.",
  });

  /* ---------------- A-b Modular arithmetic ---------------- */
  const CTX = { plain: null, clock: { n: 12, names: null, label: "12-hour clock" }, week: { n: 7, names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], label: "Days of the week" }, market: { n: 4, names: ["Eke", "Orie", "Afọ", "Nkwọ"], label: "Igbo market days" }, shift: { n: 3, names: ["Morning", "Afternoon", "Night"], label: "Shift duty" } };
  MK.def("A-b", {
    title: "Modular arithmetic", env: "paper",
    values: { ctx: "plain", a: 6, op: "+", b: 4, n: 7, start: 0 },
    controls: [
      { type: "select", key: "ctx", label: "Context", options: [["plain", "Plain modulo n"], ["clock", "12-hour clock"], ["week", "Days of the week (mod 7)"], ["market", "Market days (mod 4)"], ["shift", "Shift duty (mod 3)"]] },
      { key: "a", label: "a", min: 0, max: 60, step: 1 }, { type: "select", key: "op", label: "Operation", options: [["+", "+"], ["-", "−"], ["*", "×"]] },
      { key: "b", label: "b", min: 0, max: 60, step: 1 }, { key: "n", label: "Modulus n", min: 2, max: 16, step: 1, show: MK.when("ctx", "plain") },
    ],
    state: () => ({ walk: 0 }),
    mod(c) { const ctx = CTX[c.ctx]; return ctx ? ctx.n : c.n; },
    res(c) { const n = this.mod(c), raw = c.op === "+" ? c.a + c.b : c.op === "-" ? c.a - c.b : c.a * c.b; return { n, raw, r: ((raw % n) + n) % n, q: Math.floor(raw / n) }; },
    onChange(s) { s.walk = 0; },
    tick(dt, s, c) { const r = this.res(c), steps = c.op === "*" ? 0 : c.b; s.walk = Math.min(steps, s.walk + dt * Math.max(2, steps / 2.2)); return true; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, r = this.res(c), ctx = CTX[c.ctx], n = r.n, cx = a.x + a.w / 2, cy = a.y + a.h / 2 + 10, R = Math.min(a.w, a.h) * 0.36;
      // dial with face shading
      g.save(); const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R * 1.15); gr.addColorStop(0, MK.isNight() ? "#1d2a48" : "#ffffff"); gr.addColorStop(1, MK.isNight() ? "#0c1324" : "#e8e6dc");
      g.shadowColor = P.shadow; g.shadowBlur = 16; g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 1.12, 0, MK.TAU); g.fill(); g.restore();
      B.circle(cx, cy, R * 1.12, P.ink, null, 3); B.circle(cx, cy, R, P.faint, null, 1);
      const ang = (k) => -Math.PI / 2 + k * MK.TAU / n, lab = (k) => (ctx && ctx.names ? ctx.names[k] : c.ctx === "clock" ? String(k === 0 ? 12 : k) : String(k));
      for (let k = 0; k < n; k++) { const t = ang(k), on = k === r.r; B.dot(cx + Math.cos(t) * R, cy + Math.sin(t) * R, on ? P.red : P.ink, on ? 8 : 4); B.text(lab(k), cx + Math.cos(t) * (R + 22), cy + Math.sin(t) * (R + 22) + 4, { align: "center", size: n > 10 ? 10 : 12, w: on ? 800 : 600, color: on ? P.red : P.ink }); }
      // walking pointer: start at a mod n, step b times
      const a0 = ((c.a % n) + n) % n, sgn = c.op === "-" ? -1 : 1, pos = c.op === "*" ? r.r : a0 + sgn * s.walk;
      const t = ang(pos); g.save(); g.strokeStyle = P.red; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * R * 0.82, cy + Math.sin(t) * R * 0.82); g.stroke(); g.restore();
      B.circle(cx, cy, 6, null, P.ink);
      if (c.op !== "*") { B.arc(cx, cy, R * 0.55, ang(a0), ang(a0 + sgn * s.walk), P.amber, 3, null, sgn < 0); B.text("start " + lab(a0), cx, cy + R * 0.3, { align: "center", size: 11, color: P.soft }); }
      B.text((ctx ? ctx.label + " · " : "") + "mod " + n, a.x + 8, a.y + a.h - 6, { size: 11, color: P.soft });
    },
    hud(s, c) { const r = this.res(c), op = c.op === "*" ? "×" : c.op === "-" ? "−" : "+"; return [{ title: "Formula", lines: ["a ≡ r (mod n) ⇔ a = qn + r, 0 ≤ r < n", "—", `${c.a} ${op} ${c.b} = ${r.raw}`, `${r.raw} = ${r.q}×${r.n} + ${r.r}`, [`${c.a} ${op} ${c.b} ≡ ${r.r} (mod ${r.n})`, "#ffd27a", true]] }]; },
    readouts(s, c) { const r = this.res(c), ctx = CTX[c.ctx]; return [["Raw result", f(r.raw)], ["Remainder r", r.r], ["Meaning", ctx && ctx.names ? ctx.names[r.r] : c.ctx === "clock" ? (r.r === 0 ? 12 : r.r) + " o'clock" : r.r + " (mod " + r.n + ")"]]; },
    steps(s, c) { const r = this.res(c), op = c.op === "*" ? "×" : c.op === "-" ? "−" : "+", ctx = CTX[c.ctx]; const st = [`Work out ${c.a} ${op} ${c.b} = ${r.raw}.`, `Divide by ${r.n}: ${r.raw} = ${r.q} × ${r.n} + ${r.r}.`, `The remainder is the answer: ${r.r} (mod ${r.n}).`];
      if (ctx && ctx.names) st.push(`Counting ${c.b} ${c.op === "-" ? "back" : "on"} from ${ctx.names[((c.a % r.n) + r.n) % r.n]} lands on ${ctx.names[r.r]}.`); if (c.op === "-" && r.raw < 0) st.splice(1, 0, `Negative? Add ${r.n} until it is in 0 … ${r.n - 1}.`); return st; },
    table(s, c) { const n = this.mod(c); if (n > 9) return ""; const rows = []; for (let i = 0; i < n; i++) { const row = [c.op === "*" ? "×" + i : "+" + i]; for (let j = 0; j < n; j++) row.push(((c.op === "*" ? i * j : c.op === "-" ? i - j : i + j) % n + n) % n); rows.push(row); } return `<div style="font:600 11px IBM Plex Sans;margin-bottom:6px">Operation table mod ${n} (row ${c.op === "*" ? "×" : c.op === "-" ? "−" : "+"} column)</div>` + T([c.op === "*" ? "×" : c.op === "-" ? "−" : "+", ...Array.from({ length: n }, (_, j) => j)], rows); },
    note: "WAEC writes these as 6 + 4 = k (mod 7) or m ≡ 2 (mod 3). For “m ≡ 2 (mod 3)” list the values 2, 5, 8, 11, …",
    mistake: "Giving a remainder that is not between 0 and n − 1, e.g. answering 9 (mod 7) instead of 2.",
  });

  /* ---------------- A-c Fractions, decimals, approximation ---------------- */
  MK.def("A-c", {
    title: "Fractions, decimals & approximation", env: "graph",
    values: { mode: "frac", p: "2/3", q: "3/4", op: "+", x: 3.47286, how: "dp", k: 2, ctx: "none" },
    controls: [
      { type: "tabs", key: "mode", label: "Mode", options: [["frac", "Fraction operations"], ["round", "Approximation"]] },
      { type: "text", key: "p", label: "First fraction (e.g. 2/3, 1 1/2)", wide: false, show: MK.when("mode", "frac") }, { type: "select", key: "op", label: "Operation", options: [["+", "+"], ["-", "−"], ["*", "×"], ["/", "÷"]], show: MK.when("mode", "frac") }, { type: "text", key: "q", label: "Second fraction", wide: false, show: MK.when("mode", "frac") },
      { type: "number", key: "x", label: "Number to approximate", step: "any", show: MK.when("mode", "round") }, { type: "select", key: "how", label: "Round to", options: [["dp", "decimal places"], ["sf", "significant figures"], ["near", "nearest 10ᵏ"]], show: MK.when("mode", "round") }, { key: "k", label: "k (places / s.f. / power)", min: 0, max: 4, step: 1, show: MK.when("mode", "round") },
      { type: "select", key: "ctx", label: "Realistic context", show: MK.when("mode", "round"), options: [["none", "—"], ["road", "Road length (km)"], ["mass", "Bag of rice (kg)"], ["pop", "Town population"]] },
    ],
    frac(c) { const a = parseFr(c.p), b = parseFr(c.q); if (!a || !b || !a.d || !b.d) return null; const r = c.op === "+" ? a.add(b) : c.op === "-" ? a.sub(b) : c.op === "*" ? a.mul(b) : a.div(b); return { a, b, r }; },
    rnd(c) { const x = c.x; if (c.how === "dp") return { v: MK.round(x, c.k), s: x.toFixed(c.k), unit: Math.pow(10, -c.k) }; if (c.how === "sf") { const k = Math.max(1, c.k), e = Math.floor(Math.log10(Math.abs(x) || 1)), u = Math.pow(10, e - k + 1); return { v: Math.round(x / u) * u, s: MK.sig(x, k), unit: u }; } const u = Math.pow(10, c.k); return { v: Math.round(x / u) * u, s: f(Math.round(x / u) * u), unit: u }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "frac") {
        const r = this.frac(c); if (!r) { B.text("Enter fractions like 2/3, −5/4 or 1 1/2", a.x + 10, a.y + 60, { color: P.red }); return; }
        const bar = (fr, y, color, label) => { const w = a.w - 60, x = a.x + 30, d = Math.min(fr.d, 24); B.text(label, x, y - 8, { size: 12, w: 700 });
          const whole = Math.floor(Math.abs(fr.v)), part = Math.abs(fr.v) - whole, total = Math.max(1, Math.ceil(Math.abs(fr.v))), ww = w / Math.max(total, 1);
          for (let k = 0; k < total; k++) { const fillW = k < whole ? 1 : part; g.save(); g.fillStyle = color; g.globalAlpha = 0.55; g.fillRect(x + k * ww, y, ww * fillW, 26); g.restore(); for (let i = 0; i <= d; i++) B.line(x + k * ww + i * ww / d, y, x + k * ww + i * ww / d, y + 26, P.faint, 0.8); g.strokeStyle = P.ink; g.lineWidth = 1.5; g.strokeRect(x + k * ww, y, ww, 26); } };
        const sym = { "+": "+", "-": "−", "*": "×", "/": "÷" }[c.op];
        bar(r.a, a.y + 60, P.blue, r.a.mixed()); bar(r.b, a.y + 128, P.green, sym + "  " + r.b.mixed()); bar(r.r, a.y + 210, P.red, "=  " + r.r.mixed() + (r.r.d !== 1 ? "   (" + f(r.r.v, 4) + ")" : ""));
        const L = MK.lcm(r.a.d, r.b.d); if (c.op === "+" || c.op === "-") B.text("LCM of denominators = " + L, a.x + 30, a.y + 268, { size: 12, color: P.soft });
        if (r.r.v < 0) B.text("(negative result — bar shows its size)", a.x + 30, a.y + 286, { size: 10.5, color: P.soft });
      } else {
        const r = this.rnd(c), u = r.unit, lo = Math.floor(c.x / u) * u, hi = lo + u, x0 = a.x + 30, w = a.w - 60, y = a.y + a.h / 2;
        const X = (v) => x0 + (v - lo) / (hi - lo) * w;
        B.line(x0 - 10, y, x0 + w + 10, y, P.ink, 2);
        for (let i = 0; i <= 10; i++) { const v = lo + u * i / 10; B.line(X(v), y - (i % 5 ? 6 : 12), X(v), y + (i % 5 ? 6 : 12), P.ink, i % 5 ? 1 : 2); }
        B.text(MK.fmt(lo, 8), X(lo), y + 30, { align: "center", size: 12, w: 700 }); B.text(MK.fmt(hi, 8), X(hi), y + 30, { align: "center", size: 12, w: 700 }); B.text("halfway " + MK.fmt(lo + u / 2, 8), X(lo + u / 2), y - 22, { align: "center", size: 10.5, color: P.soft });
        B.line(X(lo + u / 2), y - 16, X(lo + u / 2), y + 16, P.amber, 2, [4, 3]);
        B.dot(X(c.x), y, P.red, 7, String(c.x), { dy: -26, size: 12, color: P.red }); B.arrow(X(c.x), y + 46, X(r.v), y + 46, P.green, 2.5); B.text("rounds to " + r.s, X(r.v), y + 68, { align: "center", size: 13, w: 700, color: P.green });
        const ctxL = { road: "A road is measured to about 0.1 km, never to the nearest cm.", mass: "Rice is sold to the nearest 0.5 kg or kg — not 0.001 kg.", pop: "Populations are quoted to the nearest hundred or thousand." }[c.ctx];
        if (ctxL) B.text(ctxL, a.x + 10, a.y + a.h - 10, { size: 11, color: P.blue });
      }
    },
    hud(s, c) {
      if (c.mode === "frac") { const r = this.frac(c); if (!r) return [{ title: "Formula", lines: ["a/b ± c/d = (ad ± bc)/bd"] }]; const sym = { "+": "+", "-": "−", "*": "×", "/": "÷" }[c.op];
        const rule = c.op === "+" || c.op === "-" ? "a/b ± c/d = (ad ± bc)/bd" : c.op === "*" ? "a/b × c/d = ac/bd" : "a/b ÷ c/d = a/b × d/c";
        return [{ title: "Formula", lines: [rule, "—", `${r.a.str()} ${sym} ${r.b.str()}`, [`= ${r.r.str()}`, null, true], r.r.d !== 1 ? `= ${r.r.mixed()} ≈ ${f(r.r.v, 4)}` : ""] }]; }
      const r = this.rnd(c), nm = c.how === "dp" ? c.k + " d.p." : c.how === "sf" ? Math.max(1, c.k) + " s.f." : "nearest " + f(Math.pow(10, c.k));
      return [{ title: "Rule", lines: ["Look at the next digit: ≥ 5 round up, < 5 round down", "—", `${c.x} → ${nm}`, [`= ${r.s}`, null, true], "Max error = ½ × " + MK.fmt(r.unit, 8)] }];
    },
    readouts(s, c) { if (c.mode === "frac") { const r = this.frac(c); return r ? [["Exact", r.r.str()], ["Mixed number", r.r.mixed()], ["Decimal", f(r.r.v, 5)]] : [["Status", "invalid input"]]; } const r = this.rnd(c); return [["Rounded", r.s], ["Absolute error", MK.fmt(Math.abs(c.x - r.v), 6)], ["% error", f(Math.abs(c.x - r.v) / c.x * 100, 3) + " %"]]; },
    steps(s, c) {
      if (c.mode === "frac") { const r = this.frac(c); if (!r) return ["Enter two fractions."]; const { a, b } = r;
        if (c.op === "+" || c.op === "-") { const L = MK.lcm(a.d, b.d), s1 = c.op === "+" ? "+" : "−"; return [`LCM of ${a.d} and ${b.d} is ${L}.`, `${a.str()} = ${a.n * L / a.d}/${L}, ${b.str()} = ${b.n * L / b.d}/${L}`, `${a.n * L / a.d} ${s1} ${b.n * L / b.d} = ${c.op === "+" ? a.n * L / a.d + b.n * L / b.d : a.n * L / a.d - b.n * L / b.d} → ${(c.op === "+" ? a.n * L / a.d + b.n * L / b.d : a.n * L / a.d - b.n * L / b.d)}/${L}`, `Simplify: ${r.r.str()}${r.r.d !== 1 ? " = " + r.r.mixed() : ""}`]; }
        if (c.op === "*") return [`Multiply numerators: ${a.n} × ${b.n} = ${a.n * b.n}`, `Multiply denominators: ${a.d} × ${b.d} = ${a.d * b.d}`, `Simplify: ${r.r.str()}`];
        return [`Invert the second fraction: ${b.str()} → ${b.d}/${b.n}`, `${a.str()} × ${b.d}/${b.n} = ${a.n * b.d}/${a.d * b.n}`, `Simplify: ${r.r.str()}${r.r.d !== 1 ? " = " + r.r.mixed() : ""}`]; }
      const r = this.rnd(c); return [`Unit of rounding: ${MK.fmt(r.unit, 8)}`, `${c.x} lies between ${MK.fmt(Math.floor(c.x / r.unit) * r.unit, 8)} and ${MK.fmt(Math.floor(c.x / r.unit) * r.unit + r.unit, 8)}`, `Compare with the halfway value → ${r.s}`];
    },
    note: "Approximations must be realistic for the context. Show the unrounded value before rounding in Paper 2.",
    mistake: "Counting leading zeros as significant figures: 0.004072 to 2 s.f. is 0.0041, not 0.00.",
  });

  /* ---------------- A-d Indices & standard form ---------------- */
  MK.def("A-d", {
    title: "Indices & standard form", env: "graph",
    values: { mode: "laws", law: "prod", a: 2, m: 3, n: 2, sf: 375300000 },
    controls: [
      { type: "tabs", key: "mode", label: "Mode", options: [["laws", "Laws of indices"], ["std", "Standard form"]] },
      { type: "select", key: "law", label: "Law", show: MK.when("mode", "laws"), options: [["prod", "aᵐ × aⁿ = aᵐ⁺ⁿ"], ["quot", "aᵐ ÷ aⁿ = aᵐ⁻ⁿ"], ["pow", "(aᵐ)ⁿ = aᵐⁿ"], ["zero", "a⁰ = 1"], ["neg", "a⁻ⁿ = 1/aⁿ"], ["frac", "a^(m/n) = (ⁿ√a)ᵐ"]] },
      { key: "a", label: "Base a", min: 2, max: 10, step: 1, show: MK.when("mode", "laws") }, { key: "m", label: "m", min: 0, max: 6, step: 1, show: MK.when("mode", "laws") }, { key: "n", label: "n", min: 1, max: 5, step: 1, show: MK.when("mode", "laws") },
      { type: "number", key: "sf", label: "Number for standard form", step: "any", show: MK.when("mode", "std") },
    ],
    law(c) { const a = c.a, m = c.m, n = c.n;
      switch (c.law) { case "prod": return { l: `${a}${MK.sup(m)} × ${a}${MK.sup(n)}`, r: `${a}${MK.sup(m + n)}`, v: Math.pow(a, m + n) };
        case "quot": return { l: `${a}${MK.sup(m)} ÷ ${a}${MK.sup(n)}`, r: `${a}${MK.sup(m - n)}`, v: Math.pow(a, m - n) };
        case "pow": return { l: `(${a}${MK.sup(m)})${MK.sup(n)}`, r: `${a}${MK.sup(m * n)}`, v: Math.pow(a, m * n) };
        case "zero": return { l: `${a}⁰`, r: "1", v: 1 };
        case "neg": return { l: `${a}${MK.sup(-n)}`, r: `1/${a}${MK.sup(n)}`, v: Math.pow(a, -n) };
        default: return { l: `${a}^(${m}/${n})`, r: `(${n === 2 ? "" : MK.sup(n)}√${a})${MK.sup(m)}`, v: Math.pow(a, m / n) }; } },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "laws") {
        const L = this.law(c), sq = (x, y, k, color, txt) => { g.save(); g.fillStyle = color; g.globalAlpha = 0.85; g.shadowColor = P.shadow; g.shadowBlur = 4; g.beginPath(); g.roundRect ? g.roundRect(x, y, k, k, 6) : g.rect(x, y, k, k); g.fill(); g.restore(); B.text(txt, x + k / 2, y + k / 2 + 5, { align: "center", size: 13, w: 700, color: "#fff", halo: false }); };
        const k = 30, x0 = a.x + 12;
        if (c.law === "prod" || c.law === "quot") {
          B.text(c.a + MK.sup(c.m) + " = " + (c.m ? Array(c.m).fill(c.a).join("×") : "1"), x0, a.y + 54, { size: 12 }); for (let i = 0; i < c.m; i++) sq(x0 + i * (k + 4), a.y + 62, k, P.blue, c.a);
          B.text(c.a + MK.sup(c.n) + " = " + Array(c.n).fill(c.a).join("×"), x0, a.y + 120, { size: 12 }); for (let i = 0; i < c.n; i++) sq(x0 + i * (k + 4), a.y + 128, k, c.law === "prod" ? P.green : P.red, c.a);
          const res = c.law === "prod" ? c.m + c.n : c.m - c.n;
          B.text(c.law === "prod" ? "Join the factors: " + (c.m + c.n) + " copies" : "Cancel " + Math.min(c.m, c.n) + " pairs: " + res + " left" + (res < 0 ? " in the denominator" : ""), x0, a.y + 190, { size: 12, color: P.soft });
          for (let i = 0; i < Math.min(12, Math.abs(res)); i++) sq(x0 + i * (k + 4), a.y + 198, k, res < 0 ? P.red : P.purple, c.a);
        } else if (c.law === "pow") { for (let j = 0; j < c.n; j++) { B.text("(" + c.a + MK.sup(c.m) + ")", x0, a.y + 66 + j * 40, { size: 12, color: P.soft }); for (let i = 0; i < c.m; i++) sq(x0 + 50 + i * (k + 4), a.y + 46 + j * 40, k, [P.blue, P.green, P.purple, P.amber, P.red][j % 5], c.a); } B.text(c.n + " groups of " + c.m + " = " + c.m * c.n + " factors", x0, a.y + 70 + c.n * 40, { size: 12, color: P.soft }); }
        else { // number line of powers for zero / negative / fractional
          const m = B.axes({ rect: { x: a.x + 6, y: a.y + 40, w: a.w - 12, h: a.h - 60 }, xmin: -3.5, xmax: 3.5, ymin: 0, ymax: Math.min(1000, Math.pow(c.a, 3) * 1.1), xl: "index", yl: c.a + "ˣ" });
          B.plot(m, (x) => Math.pow(c.a, x), P.blue, 2.6);
          const xv = c.law === "zero" ? 0 : c.law === "neg" ? -c.n : c.m / c.n; B.dot(m.X(xv), m.Y(Math.pow(c.a, xv)), P.red, 6, `(${f(xv, 3)}, ${f(Math.pow(c.a, xv), 4)})`);
          for (let i = -3; i <= 3; i++) B.dot(m.X(i), m.Y(Math.pow(c.a, i)), P.soft, 2.5);
        }
      } else {
        const v = c.sf, e = v ? Math.floor(Math.log10(Math.abs(v))) : 0, mant = v / Math.pow(10, e), str = String(Math.abs(v)).includes("e") ? Math.abs(v).toFixed(12).replace(/0+$/, "") : String(Math.abs(v));
        const digits = str.replace(".", ""), x0 = a.x + 16, cw = Math.min(22, (a.w - 40) / Math.max(10, digits.length + 2)), y = a.y + 120;
        B.text("Move the decimal point so one non-zero digit is before it", x0, a.y + 50, { size: 11.5, color: P.soft });
        const pointIdx = str.includes(".") ? str.indexOf(".") : str.length, firstNZ = digits.search(/[1-9]/);
        [...digits].forEach((d, i) => B.text(d, x0 + i * cw, y, { size: 20, w: 700, color: i === firstNZ ? P.red : P.ink }));
        const px = (i) => x0 + i * cw - 4; B.dot(px(pointIdx), y + 4, P.soft, 3); B.dot(px(firstNZ + 1), y + 4, P.green, 4.5);
        const from = px(pointIdx), to = px(firstNZ + 1); if (from !== to) { g.save(); g.strokeStyle = P.green; g.lineWidth = 2; g.beginPath(); g.moveTo(from, y + 12); g.quadraticCurveTo((from + to) / 2, y + 50, to, y + 12); g.stroke(); g.restore(); B.text((from > to ? "←" : "→") + " " + Math.abs(e) + " places", (from + to) / 2, y + 56, { align: "center", size: 12, color: P.green }); }
        B.text(f(v, 12) + " = " + MK.std(v, 4), x0, y + 100, { size: 18, w: 700, color: P.blue });
        B.text(e >= 0 ? "Large number → positive power of 10" : "Small number → negative power of 10", x0, y + 128, { size: 11.5, color: P.soft });
      }
    },
    hud(s, c) { if (c.mode === "laws") { const L = this.law(c); return [{ title: "Law of indices", lines: [L.l, ["= " + L.r, null, true], "= " + f(L.v, 5), "—", "valid for a ≠ 0; m, n real"] }]; }
      return [{ title: "Standard form", lines: ["A × 10ⁿ, 1 ≤ A < 10, n ∈ ℤ", "—", [MK.std(c.sf, 4), null, true]] }]; },
    readouts(s, c) { if (c.mode === "laws") { const L = this.law(c); return [["Expression", L.l], ["Simplified", L.r], ["Value", f(L.v, 6)]]; } const e = c.sf ? Math.floor(Math.log10(Math.abs(c.sf))) : 0; return [["Standard form", MK.std(c.sf, 4)], ["Power n", e], ["A", f(c.sf / Math.pow(10, e), 6)]]; },
    steps(s, c) { if (c.mode === "laws") { const L = this.law(c), a = c.a; const m = { prod: [`Same base: add indices ${c.m} + ${c.n} = ${c.m + c.n}`], quot: [`Same base: subtract indices ${c.m} − ${c.n} = ${c.m - c.n}`], pow: [`Power of a power: multiply ${c.m} × ${c.n} = ${c.m * c.n}`], zero: [`aᵐ ÷ aᵐ = aᵐ⁻ᵐ = a⁰, and any non-zero number ÷ itself = 1`], neg: [`a⁻ⁿ means 1 ÷ aⁿ = 1/${Math.pow(a, c.n)}`], frac: [`Denominator ${c.n} = root, numerator ${c.m} = power`, `${c.n}√${a} = ${f(Math.pow(a, 1 / c.n), 4)}`] }[c.law];
        return [...m, `${L.l} = ${L.r}`, `= ${f(L.v, 6)}`]; } const e = c.sf ? Math.floor(Math.log10(Math.abs(c.sf))) : 0; return [`Place the point after the first non-zero digit: A = ${f(c.sf / Math.pow(10, e), 6)}`, `The point moved ${Math.abs(e)} places ${e >= 0 ? "left, so n = +" + e : "right, so n = " + e}`, `${f(c.sf, 12)} = ${MK.std(c.sf, 4)}`]; },
    note: "Expect negative and fractional indices, e.g. 8^(−2/3) = 1/4. Standard form: 375 300 000 = 3.753 × 10⁸; 0.00000035 = 3.5 × 10⁻⁷.",
    mistake: "Multiplying the bases: 2³ × 2⁴ is 2⁷, not 4⁷. And (−8)^(1/3) is fine but 8^(−1/3) = ½, not −2.",
  });

  /* ---------------- A-e Logarithms (with 4-figure table method) ---------------- */
  const bar = (k) => (k < 0 ? MK.fmt(-k) + "̄" : String(k));    // bar notation for negative characteristic
  function logParts(x) { const e = Math.floor(Math.log10(x)), mant = MK.round(Math.log10(x) - e, 4); return { e, mant, str: (e < 0 ? bar(e) : e) + "." + mant.toFixed(4).slice(2) }; }
  MK.def("A-e", {
    title: "Logarithms", env: "graph",
    values: { mode: "table", p: 23.45, q: 3.6, r: 0.0482, op: "muldiv", pw: 2 },
    controls: [
      { type: "tabs", key: "mode", label: "Mode", options: [["table", "Log-table calculation"], ["graph", "Graph & laws"]] },
      { type: "number", key: "p", label: "p", step: "any", min: 0.0001 }, { type: "number", key: "q", label: "q", step: "any", min: 0.0001, show: (c) => c.mode === "table" && c.op === "muldiv" }, { type: "number", key: "r", label: "r", step: "any", min: 0.0001, show: (c) => c.mode === "table" && c.op === "muldiv" },
      { type: "select", key: "op", label: "Calculate", options: [["muldiv", "(p × q) ÷ r"], ["pow", "pⁿ"], ["root", "ⁿ√p"]], show: MK.when("mode", "table") }, { key: "pw", label: "n", min: 2, max: 5, step: 1, show: (c) => c.mode === "table" && c.op !== "muldiv" },
    ],
    calc(c) { const L = (x) => logParts(x); if (c.op === "muldiv") { const lp = L(c.p), lq = L(c.q), lr = L(c.r), sum = lp.e + lp.mant + lq.e + lq.mant, res = sum - (lr.e + lr.mant); return { rows: [[f(c.p, 6), lp.str], [f(c.q, 6), lq.str], ["(add)", logParts(Math.pow(10, sum)).str], ["÷ " + f(c.r, 6) + " (subtract)", lr.str]], res, val: Math.pow(10, res), exact: c.p * c.q / c.r }; }
      if (c.op === "pow") { const lp = L(c.p), res = (lp.e + lp.mant) * c.pw; return { rows: [[f(c.p, 6), lp.str], ["× " + c.pw, ""]], res, val: Math.pow(10, res), exact: Math.pow(c.p, c.pw) }; }
      const lp = L(c.p), res = (lp.e + lp.mant) / c.pw; return { rows: [[f(c.p, 6), lp.str], ["÷ " + c.pw, ""]], res, val: Math.pow(10, res), exact: Math.pow(c.p, 1 / c.pw) }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "graph") {
        const m = B.axes({ xmin: -1.5, xmax: 4, ymin: -1.5, ymax: 4, xstep: 1, ystep: 1 });
        B.plot(m, (x) => Math.pow(10, x), P.red, 2.4); B.plot(m, (x) => (x > 0 ? Math.log10(x) : NaN), P.blue, 2.6); B.plot(m, (x) => x, P.faint, 1.4, { dash: [5, 4] });
        const x = Math.min(c.p, 9999); if (x > 0 && x < 4) B.dot(m.X(x), m.Y(Math.log10(x)), P.blue, 5, `(${f(x, 2)}, ${f(Math.log10(x), 4)})`);
        B.text("y = 10ˣ", m.X(0.62), m.Y(3.6), { color: P.red, w: 700 }); B.text("y = log₁₀x", m.X(2.6), m.Y(0.7), { color: P.blue, w: 700 }); B.text("mirror y = x", m.X(3), m.Y(3.3), { color: P.soft, size: 10.5 });
        return;
      }
      const r = this.calc(c), x0 = a.x + 10, y0 = a.y + 50, cw = [180, 120];
      const logTxt = (str, x, y, col) => { const neg = str.indexOf("\u0304"); if (neg < 0) { B.text(str, x, y, { size: 14, w: 700, color: col, halo: false }); return; } const ch = str.slice(0, neg), rest = str.slice(neg + 1); g.save(); g.font = MK.font(700, 14); const w = g.measureText(ch).width; g.restore(); B.text(ch, x, y, { size: 14, w: 700, color: col, halo: false }); B.line(x, y - 13, x + w, y - 13, col, 1.6); B.text(rest, x + w, y, { size: 14, w: 700, color: col, halo: false }); };
      B.panel(x0, y0, cw[0] + cw[1], 30 + (r.rows.length + 2) * 30);
      B.text("Number", x0 + 12, y0 + 20, { w: 700, color: P.panelHead, halo: false }); B.text("Log", x0 + cw[0] + 12, y0 + 20, { w: 700, color: P.panelHead, halo: false });
      B.line(x0 + cw[0], y0 + 6, x0 + cw[0], y0 + 30 + (r.rows.length + 2) * 30 - 6, P.panelEdge, 1);
      r.rows.forEach(([n, l], i) => { const y = y0 + 48 + i * 30; B.text(n, x0 + 12, y, { size: 12.5, halo: false }); logTxt(l, x0 + cw[0] + 12, y, P.blue); });
      const yr = y0 + 48 + r.rows.length * 30; B.line(x0 + cw[0] + 6, yr - 18, x0 + cw[0] + cw[1] - 10, yr - 18, P.ink, 1.5);
      B.text("antilog →", x0 + 12, yr, { size: 12.5, color: P.soft, halo: false }); logTxt(logParts(r.val).str, x0 + cw[0] + 12, yr, P.red);
      B.text("Answer ≈ " + MK.sig(r.val, 4), x0 + 12, yr + 30, { size: 15, w: 800, color: P.green, halo: false });
      B.text("Calculator check: " + MK.sig(r.exact, 6), x0, yr + 70, { size: 11.5, color: P.soft });
    },
    hud(s, c) { return [{ title: "Laws of logarithms", lines: ["y = 10ᵏ ⇔ log₁₀ y = k", "log(pq) = log p + log q", "log(p/q) = log p − log q", "log pⁿ = n log p", "—", "Characteristic = power of 10", "Mantissa (from tables) is always +", "0.0482 → bar 2 .6830 (bar = negative)"] }]; },
    readouts(s, c) { const r = this.calc(c); return [["Log of answer", logParts(r.val).str], ["Answer (4 s.f.)", MK.sig(r.val, 4)], ["Exact (calculator)", MK.sig(r.exact, 7)]]; },
    steps(s, c) { const r = this.calc(c); const st = []; const ov = (t) => String(t).replace(/(\d+)\u0304/, '<span style="text-decoration:overline">$1</span>'); const write = (x) => { const L = logParts(x); return ov(`${f(x, 6)} = ${MK.std(x, 4)} → characteristic ${bar(L.e)}, mantissa .${L.mant.toFixed(4).slice(2)} → log = ${L.str}`); };
      if (c.op === "muldiv") { st.push(write(c.p), write(c.q), write(c.r), ov(`Add the logs of the numerator, subtract the log of the denominator → ${logParts(r.val).str}`)); }
      else if (c.op === "pow") st.push(write(c.p), `Multiply by ${c.pw}: ${logParts(r.val).str}`); else st.push(write(c.p), `Divide by ${c.pw} (make the characteristic divisible first if negative): ${logParts(r.val).str}`);
      st.push(ov(`Antilog: ${logParts(r.val).str} → ${MK.sig(r.val, 4)}`)); return st; },
    note: "Paper 2 often says “use tables”: set the work out in Number | Log columns and keep the bar characteristic for numbers less than 1.",
    mistake: "Writing log 0.0482 as −2.6830 (wrong) instead of 2̄.6830 = −1.3170. The mantissa stays positive.",
  });

  /* ---------------- A-f Sequences & series ---------------- */
  MK.def("A-f", {
    title: "Sequences: A.P. and G.P.", env: "graph",
    values: { type: "AP", a: 3, d: 4, n: 8, target: 43 },
    controls: [{ type: "tabs", key: "type", label: "Sequence", options: [["AP", "Arithmetic (A.P.)"], ["GP", "Geometric (G.P.)"]] }, { key: "a", label: "First term a", min: -10, max: 20, step: 1 }, { key: "d", label: "Common difference d / ratio r", min: -4, max: 6, step: 0.5 }, { key: "n", label: "Number of terms n", min: 2, max: 14, step: 1 }, { type: "number", key: "target", label: "Find which term equals…", step: "any" }],
    terms(c) { const t = []; for (let i = 1; i <= c.n; i++) t.push(c.type === "AP" ? c.a + (i - 1) * c.d : c.a * Math.pow(c.d, i - 1)); return t; },
    which(c) { if (c.type === "AP") { if (!c.d) return null; const k = (c.target - c.a) / c.d + 1; return Number.isInteger(MK.round(k, 9)) && k >= 1 ? MK.round(k, 9) : null; } if (!c.a || c.d <= 0 || c.d === 1 || c.target / c.a <= 0) return null; const k = Math.log(c.target / c.a) / Math.log(c.d) + 1; return Math.abs(k - Math.round(k)) < 1e-9 && k >= 1 ? Math.round(k) : null; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, t = this.terms(c), mx = Math.max(1, ...t.map(Math.abs)), hasNeg = t.some((v) => v < 0), base = hasNeg ? a.y + a.h / 2 + 10 : a.y + a.h - 40, sc = (hasNeg ? a.h / 2 - 50 : a.h - 90) / mx, bw = (a.w - 20) / t.length;
      B.line(a.x, base, a.x + a.w, base, P.ink, 1.5);
      t.forEach((v, i) => { const x = a.x + 10 + i * bw, h = v * sc; g.save(); const gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, v >= 0 ? P.blue : P.red); gr.addColorStop(1, (v >= 0 ? P.blue : P.red) + "66"); g.fillStyle = gr; g.shadowColor = P.shadow; g.shadowBlur = 3; g.fillRect(x + 3, Math.min(base, base - h), bw - 6, Math.abs(h)); g.restore();
        B.text(f(v, 2), x + bw / 2, (v >= 0 ? base - h - 6 : base - h + 14), { align: "center", size: bw < 30 ? 8.5 : 10.5, w: 700 }); B.text("U" + MK.sub(i + 1), x + bw / 2, base + (v >= 0 ? 16 : -6), { align: "center", size: 9.5, color: P.soft });
        if (i > 0 && bw > 34) B.text(c.type === "AP" ? (c.d >= 0 ? "+" : "") + f(c.d) : "×" + f(c.d), x, Math.min(base - h, base - t[i - 1] * sc) - 22, { align: "center", size: 9, color: P.amber }); });
      const k = this.which(c); if (k && k <= c.n) { const x = a.x + 10 + (k - 1) * bw; B.circle(x + bw / 2, base - t[k - 1] * sc, 10, P.green, null, 2.5); }
    },
    hud(s, c) { const t = this.terms(c); const L = c.type === "AP" ? ["Uₙ = a + (n − 1)d", `U${MK.sub(c.n)} = ${c.a} + ${c.n - 1}(${c.d}) = ${f(t[c.n - 1])}`, "Sₙ = n/2 [2a + (n − 1)d]", [`S${MK.sub(c.n)} = ${c.n}/2[${2 * c.a} + ${c.n - 1}(${c.d})] = ${f(c.n / 2 * (2 * c.a + (c.n - 1) * c.d))}`, null, false]] : ["Uₙ = a rⁿ⁻¹", `U${MK.sub(c.n)} = ${c.a} × ${c.d}${MK.sup(c.n - 1)} = ${f(t[c.n - 1], 4)}`, "(sum of a G.P. is not in the Core syllabus)"];
      return [{ title: "Formula", lines: L }]; },
    readouts(s, c) { const t = this.terms(c), k = this.which(c); return [["nth term", f(t[c.n - 1], 4)], c.type === "AP" ? ["Sum Sₙ", f(c.n / 2 * (2 * c.a + (c.n - 1) * c.d))] : ["Ratio r", f(c.d)], [f(c.target) + " is term", k ? "U" + MK.sub(k) : "not a term"]]; },
    steps(s, c) { const k = this.which(c); if (c.type === "AP") return [`a = ${c.a}, d = ${c.d}`, `Uₙ = ${c.a} + (n − 1)(${c.d})`, `Set Uₙ = ${c.target}: ${c.target} − ${c.a} = (n − 1)(${c.d}) ⇒ n − 1 = ${f((c.target - c.a) / (c.d || 1), 4)}`, k ? `n = ${k}, so ${c.target} is the ${k}th term` : `n is not a positive whole number, so ${c.target} is not in the sequence`];
      return [`a = ${c.a}, r = ${c.d}`, `Uₙ = ${c.a} × ${c.d}ⁿ⁻¹ = ${c.target}`, `${c.d}ⁿ⁻¹ = ${f(c.target / c.a, 5)}`, k ? `n − 1 = ${k - 1}, n = ${k}` : `No whole n satisfies this, so ${c.target} is not a term`]; },
    table(s, c) { const t = this.terms(c); return T(["n", ...t.map((_, i) => i + 1)], [["Uₙ", ...t.map((v) => f(v, 3))]]); },
    note: "Determine any term Uₙ. Include the sum for A.P.; the sum of a G.P. belongs to Further Mathematics. Word problems: salaries with fixed yearly increases are A.P.s.",
    mistake: "Using a + nd for the nth term (that is the (n+1)th term). It is a + (n − 1)d.",
  });

  /* ---------------- A-g Sets & Venn diagrams ---------------- */
  const OPS = { "A∪B": (r) => r.A || r.B, "A∩B": (r) => r.A && r.B, "A′": (r) => !r.A, "(A∪B)′": (r) => !(r.A || r.B), "A∩B′": (r) => r.A && !r.B, "A′∩B′": (r) => !r.A && !r.B, "A∪B∪C": (r) => r.A || r.B || r.C, "A∩B∩C": (r) => r.A && r.B && r.C, "(A∩B)∪C": (r) => (r.A && r.B) || r.C, "A∩(B∪C)": (r) => r.A && (r.B || r.C), "A only": (r) => r.A && !r.B && !r.C, "Exactly one": (r) => (r.A + r.B + r.C) === 1, "Exactly two": (r) => (r.A + r.B + r.C) === 2 };
  MK.def("A-g", {
    title: "Sets & Venn diagrams", env: "paper",
    values: { sets: 3, U: 60, nA: 25, nB: 28, nC: 20, AB: 10, AC: 8, BC: 9, ABC: 4, op: "A∪B" },
    controls: [{ type: "tabs", key: "sets", label: "Number of sets", options: [[2, "Two sets"], [3, "Three sets"]] }, { type: "select", key: "op", label: "Shade / count", options: Object.keys(OPS) }, { key: "U", label: "n(ℰ)", min: 10, max: 120 }, { key: "nA", label: "n(A)", min: 0, max: 80 }, { key: "nB", label: "n(B)", min: 0, max: 80 }, { key: "nC", label: "n(C)", min: 0, max: 80, show: MK.when("sets", 3) }, { key: "AB", label: "n(A∩B)", min: 0, max: 60 }, { key: "AC", label: "n(A∩C)", min: 0, max: 60, show: MK.when("sets", 3) }, { key: "BC", label: "n(B∩C)", min: 0, max: 60, show: MK.when("sets", 3) }, { key: "ABC", label: "n(A∩B∩C)", min: 0, max: 40, show: MK.when("sets", 3) }],
    regions(c) { const t = c.sets === 3, abc = t ? c.ABC : 0, ab = c.AB - abc, ac = t ? c.AC - abc : 0, bc = t ? c.BC - abc : 0, a = c.nA - ab - ac - abc, b = c.nB - ab - bc - abc, cc = t ? c.nC - ac - bc - abc : 0, none = c.U - (a + b + cc + ab + ac + bc + abc);
      return [{ A: 1, B: 0, C: 0, n: a }, { A: 0, B: 1, C: 0, n: b }, { A: 0, B: 0, C: 1, n: cc }, { A: 1, B: 1, C: 0, n: ab }, { A: 1, B: 0, C: 1, n: ac }, { A: 0, B: 1, C: 1, n: bc }, { A: 1, B: 1, C: 1, n: abc }, { A: 0, B: 0, C: 0, n: none }]; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, t = c.sets === 3, rg = this.regions(c), op = OPS[c.op] || OPS["A∪B"];
      const ux = a.x + 8, uy = a.y + 34, uw = a.w - 16, uh = a.h - 42; B.panel(ux, uy, uw, uh); B.text("ℰ", ux + 10, uy + 20, { size: 15, w: 700, fam: "serif" });
      const R = Math.min(uw, uh) * (t ? 0.27 : 0.31), cx = ux + uw / 2, cy = uy + uh / 2 + (t ? -R * 0.18 : 0);
      const C = { A: [cx - R * 0.62, cy], B: [cx + R * 0.62, cy], C: [cx, cy + R * 0.95] };
      // shade by pixel test on an offscreen mask for exact regions
      const combos = rg.map((r) => ({ r, on: op({ A: !!r.A, B: !!r.B, C: !!r.C && t }) && (t || !r.C) }));
      const ks = t ? ["A", "B", "C"] : ["A", "B"];
      combos.forEach(({ r, on }) => { if (!on || (!t && r.C)) return; g.save(); g.beginPath(); g.rect(ux, uy, uw, uh); g.clip();
        ks.forEach((k) => { g.beginPath(); if (r[k]) { g.arc(C[k][0], C[k][1], R, 0, MK.TAU); g.clip(); } else { g.rect(ux, uy, uw, uh); g.moveTo(C[k][0] + R, C[k][1]); g.arc(C[k][0], C[k][1], R, 0, MK.TAU); g.clip("evenodd"); } });
        g.fillStyle = MK.isNight() ? "rgba(255,210,122,.32)" : "rgba(217,140,20,.34)"; g.fillRect(ux, uy, uw, uh); g.restore(); });
      [["A", P.red], ["B", P.blue], ["C", P.green]].forEach(([k, col]) => { if (k === "C" && !t) return; B.circle(C[k][0], C[k][1], R, col, null, 2.6); B.text(k, C[k][0] + (k === "A" ? -R * 0.9 : k === "B" ? R * 0.8 : R * 0.75), C[k][1] + (k === "C" ? R * 0.85 : -R * 0.82), { size: 16, w: 800, color: col, fam: "serif" }); });
      const pos = t ? [[-1.05, -0.25], [1.05, -0.25], [0, 1.25], [0, -0.45], [-0.55, 0.62], [0.55, 0.62], [0, 0.22]] : [[-0.95, 0], [0.95, 0], null, [0, 0]];
      rg.forEach((r, i) => { if (!pos[i] || (i === 7)) return; if (!t && (r.C)) return; B.text(String(r.n), cx + pos[i][0] * R, cy + pos[i][1] * R + 5, { align: "center", size: 14, w: 800, color: r.n < 0 ? P.red : P.ink }); });
      B.text(String(rg[7].n), ux + uw - 22, uy + uh - 12, { align: "center", size: 14, w: 800, color: rg[7].n < 0 ? P.red : P.ink });
      if (rg.some((r) => r.n < 0)) B.text("⚠ These numbers are impossible — a region is negative", ux + 10, uy + uh - 12, { size: 11, color: P.red });
    },
    count(c) { const t = c.sets === 3, op = OPS[c.op]; return this.regions(c).filter((r) => (t || !r.C) && op({ A: !!r.A, B: !!r.B, C: !!r.C })).reduce((s, r) => s + r.n, 0); },
    hud(s, c) { const t = c.sets === 3; return [{ title: "Formula", lines: [t ? "n(A∪B∪C) = n(A)+n(B)+n(C) − n(A∩B) − n(A∩C) − n(B∩C) + n(A∩B∩C)" : "n(A∪B) = n(A) + n(B) − n(A∩B)", "—", [`n(${c.op}) = ${this.count(c)}`, "#ffd27a", true]] }, { title: "Notation", lines: ["ℰ universal set, ∅ empty set", "⊂ subset, A′ complement of A"] }]; },
    readouts(s, c) { const rg = this.regions(c); return [["n(" + c.op + ")", this.count(c)], ["In none of the sets", rg[7].n], ["In exactly one", rg.slice(0, 3).filter((r, i) => c.sets === 3 || i < 2).reduce((s, r) => s + r.n, 0)]]; },
    steps(s, c) { const rg = this.regions(c), t = c.sets === 3; const st = []; if (t) st.push(`Start in the middle: n(A∩B∩C) = ${c.ABC}`, `A∩B only = ${c.AB} − ${c.ABC} = ${rg[3].n}; A∩C only = ${c.AC} − ${c.ABC} = ${rg[4].n}; B∩C only = ${c.BC} − ${c.ABC} = ${rg[5].n}`, `A only = ${c.nA} − (${rg[3].n}+${rg[4].n}+${c.ABC}) = ${rg[0].n}; B only = ${rg[1].n}; C only = ${rg[2].n}`);
      else st.push(`A∩B = ${c.AB}`, `A only = ${c.nA} − ${c.AB} = ${rg[0].n}; B only = ${c.nB} − ${c.AB} = ${rg[1].n}`);
      st.push(`Outside all circles = ${c.U} − (sum of the regions) = ${rg[7].n}`, `n(${c.op}) = ${this.count(c)}`); return st; },
    note: "Fill a Venn diagram from the centre outwards. Restricted to at most 3 sets. Know the properties: commutative, associative and distributive laws.",
    mistake: "Writing n(A) inside circle A without subtracting the overlaps, so the overlap is counted twice.",
  });

  /* ---------------- A-h Logical reasoning ---------------- */
  const PAIRS = [["It is raining", "The ground is wet"], ["Ada is a doctor", "Ada studied hard"], ["x is even", "x is divisible by 4"], ["The light is on", "The switch is closed"]];
  MK.def("A-h", {
    title: "Logical reasoning", env: "paper",
    values: { pair: 0, p: 1, q: 1, show: "imp" },
    controls: [{ type: "select", key: "pair", label: "Statements", options: PAIRS.map((pp, i) => [i, `p: ${pp[0]} · q: ${pp[1]}`]) }, { type: "toggle", key: "p", label: "p is true" }, { type: "toggle", key: "q", label: "q is true" }, { type: "select", key: "show", label: "Highlight", options: [["neg", "Negation ¬p"], ["and", "p ∧ q"], ["or", "p ∨ q"], ["imp", "p ⇒ q"], ["conv", "Converse q ⇒ p"], ["contra", "Contrapositive ¬q ⇒ ¬p"]] }],
    val(k, p, q) { return { neg: !p, and: p && q, or: p || q, imp: !p || q, conv: !q || p, contra: q || !p }[k]; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, pp = PAIRS[c.pair], cols = ["p", "q", "¬p", "p∧q", "p∨q", "p⇒q", "q⇒p", "¬q⇒¬p"], keys = [null, null, "neg", "and", "or", "imp", "conv", "contra"];
      const x0 = a.x + 6, cw = (a.w - 12) / cols.length, y0 = a.y + 44, rh = 30;
      B.text("p: " + pp[0], x0, a.y + 30 + 0, { size: 11.5, color: P.red }); B.text("q: " + pp[1], x0 + a.w / 2, a.y + 30, { size: 11.5, color: P.blue });
      B.panel(x0, y0, cw * cols.length, rh * 5 + 8);
      cols.forEach((h, j) => { const hl = keys[j] === c.show; if (hl) { g.save(); g.fillStyle = P.fillA; g.fillRect(x0 + j * cw + 2, y0 + 4, cw - 4, rh * 5); g.restore(); } B.text(h, x0 + j * cw + cw / 2, y0 + 22, { align: "center", size: 11.5, w: 800, color: P.panelHead, halo: false }); });
      [[1, 1], [1, 0], [0, 1], [0, 0]].forEach(([p, q], i) => { const y = y0 + 22 + (i + 1) * rh, cur = p === c.p && q === c.q; if (cur) { g.save(); g.strokeStyle = P.red; g.lineWidth = 2; g.strokeRect(x0 + 2, y - 20, cw * cols.length - 4, rh - 2); g.restore(); }
        cols.forEach((h, j) => { const v = j === 0 ? p : j === 1 ? q : this.val(keys[j], p, q); B.text(v ? "T" : "F", x0 + j * cw + cw / 2, y, { align: "center", size: 13, w: 700, color: v ? P.green : P.red, halo: false }); }); });
      // Venn picture of p ⇒ q (P ⊂ Q)
      const vy = y0 + rh * 5 + 30, vr = Math.min(60, (a.y + a.h - vy) / 2 - 4); if (vr > 24) { const cx = a.x + a.w / 2, cy = vy + vr + 4; B.circle(cx, cy, vr * 1.5, P.blue, P.fillB, 2); B.circle(cx - vr * 0.35, cy, vr * 0.8, P.red, P.fillR, 2); B.text("Q", cx + vr * 1.05, cy - vr * 0.9, { color: P.blue, w: 800 }); B.text("P", cx - vr * 0.35, cy + 5, { color: P.red, w: 800, align: "center" }); B.text("p ⇒ q  ⇔  P ⊂ Q", cx + vr * 1.65, cy + 5, { size: 12 }); }
    },
    hud(s, c) { const pp = PAIRS[c.pair], v = this.val(c.show, c.p, c.q); return [{ title: "Statement", lines: [{ neg: `¬p: It is not true that "${pp[0].toLowerCase()}"`, and: `p ∧ q: ${pp[0]} and ${pp[1].toLowerCase()}`, or: `p ∨ q: ${pp[0]} or ${pp[1].toLowerCase()}`, imp: `p ⇒ q: If ${pp[0].toLowerCase()}, then ${pp[1].toLowerCase()}`, conv: `q ⇒ p: If ${pp[1].toLowerCase()}, then ${pp[0].toLowerCase()}`, contra: `¬q ⇒ ¬p: If not "${pp[1].toLowerCase()}", then not "${pp[0].toLowerCase()}"` }[c.show], "—", [`With p ${c.p ? "T" : "F"}, q ${c.q ? "T" : "F"}: ${v ? "TRUE" : "FALSE"}`, v ? "#5bd68c" : "#ff7b72", true]] }, { title: "Key fact", lines: ["p ⇒ q is false only when p is T and q is F", "p ⇒ q ≡ ¬q ⇒ ¬p (contrapositive)"] }]; },
    readouts(s, c) { return [["p ⇒ q", this.val("imp", c.p, c.q) ? "T" : "F"], ["Converse", this.val("conv", c.p, c.q) ? "T" : "F"], ["Contrapositive", this.val("contra", c.p, c.q) ? "T" : "F"]]; },
    steps(s, c) { return ["Write down the truth values of p and q.", "Use the rule for the connective (∧ needs both, ∨ needs at least one).", "For p ⇒ q, check the single failing case: p true and q false.", `Here p = ${c.p ? "T" : "F"}, q = ${c.q ? "T" : "F"} → ${this.val(c.show, c.p, c.q) ? "T" : "F"}.`]; },
    note: "Use ⇒ and ⇐ correctly and represent implications with Venn diagrams (P inside Q).",
    mistake: "Assuming the converse is automatically true: “if it rains the ground is wet” does not mean “if the ground is wet it rained”.",
  });

  /* ---------------- A-i Integers & rational numbers ---------------- */
  MK.def("A-i", {
    title: "Integers & rational numbers", env: "graph",
    values: { a: "-3/2", b: "11/4", op: "+" },
    controls: [{ type: "text", key: "a", label: "a (e.g. −3/2, 0.75, 4)", wide: false }, { type: "select", key: "op", label: "Operation", options: [["+", "+"], ["-", "−"], ["*", "×"], ["/", "÷"]] }, { type: "text", key: "b", label: "b", wide: false }],
    calc(c) { const A = parseFr(c.a), Bf = parseFr(c.b); if (!A || !Bf) return null; const R = c.op === "+" ? A.add(Bf) : c.op === "-" ? A.sub(Bf) : c.op === "*" ? A.mul(Bf) : A.div(Bf); return { A, B: Bf, R }; },
    kind(fr) { return fr.d === 1 ? (fr.n >= 1 ? "Natural number (also in ℤ and ℚ)" : "Integer (also rational)") : "Rational, not an integer"; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, r = this.calc(c); if (!r) { B.text("Enter numbers like −3/2, 0.75 or 4", a.x + 10, a.y + 60, { color: P.red }); return; }
      const vals = [r.A.v, r.B.v, r.R.v].filter(isFinite), lo = Math.floor(Math.min(-1, ...vals)) - 1, hi = Math.ceil(Math.max(1, ...vals)) + 1, y = a.y + 150;
      const X = (v) => a.x + 14 + (v - lo) / (hi - lo) * (a.w - 28);
      B.arrow(a.x + 4, y, a.x + a.w - 4, y, P.ink, 2, 9); B.arrow(a.x + a.w - 4, y, a.x + 4, y, P.ink, 2, 9);
      for (let k = lo; k <= hi; k++) { B.line(X(k), y - 8, X(k), y + 8, P.ink, 1.6); B.text(String(k).replace("-", "−"), X(k), y + 24, { align: "center", size: 11 }); for (let q = 1; q < 4; q++) B.line(X(k + q / 4), y - 4, X(k + q / 4), y + 4, P.faint, 1); }
      B.dot(X(r.A.v), y, P.blue, 6, "a = " + r.A.str(), { dy: -16, dx: -10 });
      if (c.op === "+" || c.op === "-") { const end = r.R.v; g.save(); g.strokeStyle = P.green; g.lineWidth = 2.5; g.beginPath(); const x1 = X(r.A.v), x2 = X(end), mid = (x1 + x2) / 2; g.moveTo(x1, y - 4); g.quadraticCurveTo(mid, y - 70, x2, y - 4); g.stroke(); g.restore(); B.arrow(x2 + (x1 < x2 ? -6 : 6), y - 14, x2, y - 4, P.green, 2.5, 9); B.text((c.op === "+" ? "+" : "−") + r.B.str() + (r.B.v < 0 ? " (move " + (c.op === "+" ? "left" : "right") + ")" : ""), mid, y - 52, { align: "center", size: 11.5, color: P.green, w: 700 }); }
      if (isFinite(r.R.v)) B.dot(X(r.R.v), y, P.red, 7, "= " + r.R.str(), { dy: 44, dx: -16, color: P.red, size: 13 });
      // nested set diagram N ⊂ Z ⊂ Q
      const ny = a.y + a.h - 70, nx = a.x + a.w / 2; [["ℚ", 1, P.purple], ["ℤ", 0.68, P.blue], ["ℕ", 0.38, P.green]].forEach(([L, k, col]) => { g.save(); g.beginPath(); g.ellipse(nx, ny + 20, (a.w / 2 - 10) * k, 46 * k + 6, 0, 0, MK.TAU); g.fillStyle = col + "18"; g.fill(); g.strokeStyle = col; g.lineWidth = 2; g.stroke(); g.restore(); B.text(L, nx - (a.w / 2 - 10) * k + 12, ny + 24, { size: 14, w: 800, color: col, fam: "serif" }); });
      const R = r.R, where = R.d !== 1 ? 0.84 : R.n >= 1 ? 0.0 : 0.53; B.dot(nx + (a.w / 2 - 10) * where * (R.d !== 1 ? 1 : 1), ny + 20, P.red, 5, R.str(), { size: 11 });
    },
    hud(s, c) { const r = this.calc(c); if (!r) return [{ title: "Rules", lines: ["(−) × (−) = (+)", "(−) × (+) = (−)"] }]; const sym = { "+": "+", "-": "−", "*": "×", "/": "÷" }[c.op]; return [{ title: "Calculation", lines: [`${r.A.str()} ${sym} ${r.B.str()}`, [`= ${r.R.str()}`, null, true], r.R.d !== 1 ? `= ${f(r.R.v, 4)}` : "", "—", this.kind(r.R)] }, { title: "Sign rules", lines: ["(−)×(−) = +, (−)×(+) = −", "Subtracting a negative = adding"] }]; },
    readouts(s, c) { const r = this.calc(c); return r ? [["Result", r.R.str()], ["Decimal", f(r.R.v, 5)], ["Set", r.R.d === 1 ? (r.R.n >= 1 ? "ℕ ⊂ ℤ ⊂ ℚ" : "ℤ ⊂ ℚ") : "ℚ"]] : [["Status", "invalid"]]; },
    steps(s, c) { const r = this.calc(c); if (!r) return ["Enter two rational numbers."]; return [`a = ${r.A.str()}, b = ${r.B.str()}`, c.op === "+" || c.op === "-" ? `On the number line start at ${r.A.str()} and move ${f(Math.abs(r.B.v), 4)} ${(c.op === "+") === (r.B.v >= 0) ? "right" : "left"}` : `Multiply/divide the sizes, then apply the sign rule`, `Result: ${r.R.str()}`, this.kind(r.R)]; },
    note: "Notation: ℕ natural numbers, ℤ integers, ℚ rational numbers (p/q, q ≠ 0). Match each rational number with a point on the number line.",
    mistake: "Treating −3 − (−5) as −8. Subtracting a negative moves right: −3 + 5 = 2.",
  });

  /* ---------------- A-j Surds ---------------- */
  MK.def("A-j", {
    title: "Surds", env: "graph",
    values: { mode: "simplify", n: 48, k: 6, a: 2, b: 3, p: 5, q: 12 },
    controls: [{ type: "tabs", key: "mode", label: "Mode", options: [["simplify", "Simplify √n"], ["addsub", "Add like surds"], ["rat1", "Rationalise k/√b"], ["rat2", "Rationalise k/(a+√b)"], ["conj", "(a+√b)(a−√b)"]] }, { key: "n", label: "n (radicand)", min: 2, max: 300, show: MK.when("mode", "simplify") }, { key: "k", label: "k", min: 1, max: 20, show: MK.when("mode", "rat1", "rat2") }, { key: "a", label: "a", min: 1, max: 9, show: MK.when("mode", "addsub", "rat2", "conj") }, { key: "b", label: "b", min: 2, max: 50, show: MK.when("mode", "addsub", "rat1", "rat2", "conj") }, { key: "p", label: "p (in p√q)", min: 1, max: 9, show: MK.when("mode", "addsub") }, { key: "q", label: "q (in p√q)", min: 2, max: 75, show: MK.when("mode", "addsub") }],
    res(c) {
      const S = MK.surd, str = MK.surdStr;
      if (c.mode === "simplify") { const [k, m] = S(c.n); return { q: `√${c.n}`, a: str(k, m), v: Math.sqrt(c.n), steps: [`Find the largest perfect square factor of ${c.n}: ${c.n} = ${k * k} × ${m}`, `√${c.n} = √${k * k} × √${m}`, `= ${str(k, m)}`] }; }
      if (c.mode === "addsub") { const [k1, m1] = S(c.b), [k2, m2] = S(c.q); const like = m1 === m2; return { q: `${c.a}√${c.b} + ${c.p}√${c.q}`, a: like ? str(c.a * k1 + c.p * k2, m1) : `${str(c.a * k1, m1)} + ${str(c.p * k2, m2)} (unlike)`, v: c.a * Math.sqrt(c.b) + c.p * Math.sqrt(c.q), steps: [`Simplify each: ${c.a}√${c.b} = ${str(c.a * k1, m1)}, ${c.p}√${c.q} = ${str(c.p * k2, m2)}`, like ? `Same surd √${m1}: add coefficients ${c.a * k1} + ${c.p * k2} = ${c.a * k1 + c.p * k2}` : `Different surds cannot be combined`, `= ${like ? str(c.a * k1 + c.p * k2, m1) : "left as a sum"}`] }; }
      if (c.mode === "rat1") { const [k, m] = S(c.b), num = new MK.Fr(c.k, k * m); return { q: `${c.k}/√${c.b}`, a: `${num.n === 1 ? "" : num.n}√${m}${num.d === 1 ? "" : "/" + num.d}`, v: c.k / Math.sqrt(c.b), steps: [`Multiply top and bottom by √${c.b}`, `${c.k}√${c.b} / ${c.b}`, `Simplify √${c.b} = ${str(k, m)} → ${c.k * k}√${m}/${c.b}`, `= ${num.n === 1 ? "" : num.n}√${m}${num.d === 1 ? "" : "/" + num.d}`] }; }
      if (c.mode === "rat2") { const den = c.a * c.a - c.b; return { q: `${c.k}/(${c.a} + √${c.b})`, a: den === 0 ? "undefined" : `${c.k}(${c.a} − √${c.b})/${den}`, v: c.k / (c.a + Math.sqrt(c.b)), steps: [`Multiply by the conjugate (${c.a} − √${c.b}) on top and bottom`, `Denominator: (${c.a})² − (√${c.b})² = ${c.a * c.a} − ${c.b} = ${den}`, `= ${c.k}(${c.a} − √${c.b})/${den} = (${c.k * c.a} − ${c.k}√${c.b})/${den}`] }; }
      return { q: `(${c.a} + √${c.b})(${c.a} − √${c.b})`, a: String(c.a * c.a - c.b), v: c.a * c.a - c.b, steps: [`Difference of two squares: (x + y)(x − y) = x² − y²`, `${c.a}² − (√${c.b})² = ${c.a * c.a} − ${c.b}`, `= ${c.a * c.a - c.b} (rational!)`] };
    },
    draw(g, s, c, B) {
      // spiral of Theodorus: hypotenuse k has length √(k+1)
      const P = B.P, a = B.area, N = c.mode === "simplify" ? Math.min(c.n, 60) : Math.min(c.b, 60), cx = a.x + a.w * 0.52, cy = a.y + a.h * 0.55, sc = Math.min(a.w, a.h) / (2.3 * Math.sqrt(N + 1) + 2);
      let ang = 0, pts = [[cx + sc, cy]];
      for (let k = 1; k < N; k++) { const r = Math.sqrt(k); ang += Math.atan(1 / r); const rr = Math.sqrt(k + 1); pts.push([cx + Math.cos(-ang) * rr * sc, cy + Math.sin(-ang) * rr * sc]); }
      for (let k = 0; k < pts.length; k++) { const p0 = k === 0 ? [cx, cy] : pts[k - 1], hi = k === pts.length - 1; B.poly([[cx, cy], p0, pts[k]], hi ? P.red : P.faint, hi ? P.fillR : (k % 2 ? P.fillB : P.fillG), hi ? 2.4 : 0.8); }
      const last = pts[pts.length - 1]; B.line(cx, cy, last[0], last[1], P.red, 3); B.text("√" + N + " ≈ " + f(Math.sqrt(N), 4), (cx + last[0]) / 2 + 10, (cy + last[1]) / 2, { size: 13, w: 800, color: P.red });
      B.text("Spiral of right triangles (legs √k and 1, hypotenuse √(k+1))", a.x + 6, a.y + a.h - 8, { size: 10.5, color: P.soft });
      const r = this.res(c); B.text(r.q + "  =  " + r.a, a.x + 8, a.y + 50, { size: 16, w: 800, color: P.blue });
    },
    hud(s, c) { const r = this.res(c); return [{ title: "Result", lines: [r.q, ["= " + r.a, null, true], "≈ " + f(r.v, 5)] }, { title: "Rules", lines: ["√(ab) = √a × √b", "√(a/b) = √a / √b", "(a+√b)(a−√b) = a² − b", "Excluded: 1/(√a ± √b)"] }]; },
    readouts(s, c) { const r = this.res(c); return [["Exact form", r.a], ["Decimal", f(r.v, 6)], ["Check", f(r.v, 6) === f(eval0(r.q), 6) ? "✓" : "—"]]; },
    steps(s, c) { return this.res(c).steps; },
    note: "Surds of the form √b, a√b and a ± √b where a is rational and b a positive integer. Rationalise denominators; leave answers in simplest surd form unless told otherwise.",
    mistake: "Writing √a + √b = √(a + b). √9 + √16 = 7, but √25 = 5.",
  });
  function eval0(q) { try { return MK.parse(q.replace(/√(\d+)/g, "sqrt($1)"), { vars: [] })({}); } catch (e) { return NaN; } }

  /* ---------------- A-k Matrices & determinants ---------------- */
  const mmul = (A, Bm) => A.map((row) => Bm[0].map((_, j) => row.reduce((s, v, k) => s + v * Bm[k][j], 0)));
  MK.mmul = mmul;
  MK.def("A-k", {
    title: "Matrices & determinants", env: "graph",
    values: { op: "mul", A: [[2, 1], [1, 3]], B: [[1, 2], [0, 1]], C: [[8], [9]], k: 3, cell: 0 },
    controls: [{ type: "tabs", key: "op", label: "Operation", options: [["add", "A + B"], ["sub", "A − B"], ["scal", "kA"], ["mul", "A × B"], ["det", "det A (area)"], ["solve", "Solve simultaneous"]] }, { type: "matrix", key: "A", label: "A (coefficients in solve mode)" }, { type: "matrix", key: "B", label: "B", show: MK.when("op", "add", "sub", "mul") }, { type: "matrix", key: "C", label: "C (constants)", show: MK.when("op", "solve") }, { key: "k", label: "Scalar k", min: -5, max: 5, show: MK.when("op", "scal") }, { key: "cell", label: "Highlight entry", min: 0, max: 3, show: MK.when("op", "mul") }],
    state: () => ({}),
    draw(g, s, c, B) {
      const P = B.P, a = B.area, A = c.A, Bm = c.B;
      const mat = (M, x, y, label, hiR, hiC, col) => { const cw = 44, rh = 32, w = M[0].length * cw, h = M.length * rh; B.text(label, x - 8, y + h / 2 + 5, { align: "right", size: 15, w: 800, fam: "serif" });
        g.save(); g.strokeStyle = P.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x, y); g.lineTo(x, y + h); g.lineTo(x + 6, y + h); g.moveTo(x + w - 6, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x + w - 6, y + h); g.stroke(); g.restore();
        M.forEach((row, i) => row.forEach((v, j) => { const hl = (hiR === i && hiC == null) || (hiC === j && hiR == null) || (hiR === i && hiC === j); if (hl) { g.save(); g.fillStyle = col || P.fillA; g.fillRect(x + j * cw + 3, y + i * rh + 3, cw - 6, rh - 6); g.restore(); } B.text(f(v, 2), x + j * cw + cw / 2, y + i * rh + rh / 2 + 5, { align: "center", size: 14, w: 700 }); })); return w; };
      const x0 = a.x + 40, y0 = a.y + 60;
      if (c.op === "det") {
        const d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; mat(A, x0, y0, "A");
        const m = B.axes({ rect: { x: a.x + 10, y: a.y + 140, w: a.w - 20, h: a.h - 150 }, xmin: -6, xmax: 6, ymin: -4, ymax: 6, xstep: 1, ystep: 1 });
        const u = [A[0][0], A[1][0]], v = [A[0][1], A[1][1]];
        B.poly([[m.X(0), m.Y(0)], [m.X(1), m.Y(0)], [m.X(1), m.Y(1)], [m.X(0), m.Y(1)]], P.soft, P.fillG, 1.5);
        B.poly([[m.X(0), m.Y(0)], [m.X(u[0]), m.Y(u[1])], [m.X(u[0] + v[0]), m.Y(u[1] + v[1])], [m.X(v[0]), m.Y(v[1])]], P.blue, P.fillB, 2.4);
        B.arrow(m.X(0), m.Y(0), m.X(u[0]), m.Y(u[1]), P.red, 2.4); B.arrow(m.X(0), m.Y(0), m.X(v[0]), m.Y(v[1]), P.green, 2.4);
        B.text("|det A| = " + f(Math.abs(d)) + " = area of image of the unit square", a.x + 14, a.y + 128, { size: 11.5, color: P.blue, w: 700 }); return;
      }
      if (c.op === "solve") {
        const [[a1, b1], [a2, b2]] = c.A, c1 = c.C[0][0], c2 = c.C[1][0], d = a1 * b2 - b1 * a2; mat([[a1, b1], [a2, b2]], x0, y0, ""); mat([["x"], ["y"]], x0 + 100, y0, "");
        B.text("=", x0 + 160, y0 + 38, { size: 18 }); mat([[c1], [c2]], x0 + 186, y0, "");
        if (d) { B.text("x = " + f((c1 * b2 - b1 * c2) / d, 4) + ",  y = " + f((a1 * c2 - c1 * a2) / d, 4), x0, y0 + 110, { size: 16, w: 800, color: P.green }); B.text("A⁻¹ = (1/" + d + ") [" + b2 + "  " + (-b1) + " ; " + (-a2) + "  " + a1 + "]", x0, y0 + 140, { size: 13, color: P.blue }); }
        else B.text("det = 0: no unique solution", x0, y0 + 110, { size: 14, color: P.red });
        B.text("Equations: " + a1 + "x + " + b1 + "y = " + c1 + ",   " + a2 + "x + " + b2 + "y = " + c2, a.x + 8, a.y + a.h - 10, { size: 11.5, color: P.soft }); return;
      }
      let R, sym; if (c.op === "add") { R = A.map((r, i) => r.map((v, j) => v + Bm[i][j])); sym = "+"; } else if (c.op === "sub") { R = A.map((r, i) => r.map((v, j) => v - Bm[i][j])); sym = "−"; } else if (c.op === "scal") { R = A.map((r) => r.map((v) => c.k * v)); sym = ""; } else { R = mmul(A, Bm); sym = "×"; }
      const ci = Math.floor(c.cell / 2), cj = c.cell % 2, mulMode = c.op === "mul";
      const w1 = c.op === "scal" ? 0 : 0; if (c.op === "scal") { B.text(String(c.k), x0 - 16, y0 + 37, { size: 16, w: 800, align: "right" }); mat(A, x0, y0, ""); } else { mat(A, x0, y0, "", mulMode ? ci : null, null, P.fillR); B.text(sym, x0 + 104, y0 + 37, { size: 18, w: 800, align: "center" }); mat(Bm, x0 + 124, y0, "", null, mulMode ? cj : null, P.fillB); }
      B.text("=", x0 + (c.op === "scal" ? 104 : 228), y0 + 37, { size: 18 }); mat(R, x0 + (c.op === "scal" ? 124 : 248), y0, "", mulMode ? ci : null, mulMode ? cj : null, P.fillG);
      if (mulMode) { const terms = A[ci].map((v, k) => `(${f(v)})(${f(Bm[k][cj])})`).join(" + "); B.text(`Row ${ci + 1} of A · column ${cj + 1} of B`, x0, y0 + 110, { size: 12, color: P.soft }); B.text(`${terms} = ${f(R[ci][cj])}`, x0, y0 + 134, { size: 14, w: 700, color: P.green }); }
      B.text("Order: 2 × 2 (rows × columns)", a.x + 8, a.y + a.h - 10, { size: 11, color: P.soft });
    },
    hud(s, c) { const A = c.A, d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      const L = { add: ["Add corresponding entries", "(A+B)ᵢⱼ = aᵢⱼ + bᵢⱼ"], sub: ["Subtract corresponding entries"], scal: ["Multiply every entry by k"], mul: ["(AB)ᵢⱼ = row i of A · column j of B", "AB ≠ BA in general"], det: ["det [a b; c d] = ad − bc", `= (${A[0][0]})(${A[1][1]}) − (${A[0][1]})(${A[1][0]})`, [`= ${f(d)}`, null, true]], solve: ["AX = C ⇒ X = A⁻¹C", "A⁻¹ = 1/(ad − bc) [d −b; −c a]"] }[c.op];
      return [{ title: "Rule", lines: L }]; },
    readouts(s, c) { const A = c.A, d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; return [["det A", f(d)], ["A singular?", d === 0 ? "yes (no inverse)" : "no"], ["Order", "2 × 2"]]; },
    steps(s, c) { const A = c.A, Bm = c.B; if (c.op === "mul") { const R = mmul(A, Bm); return [0, 1].flatMap((i) => [0, 1].map((j) => `Entry (${i + 1},${j + 1}): ${A[i].map((v, k) => `${f(v)}×${f(Bm[k][j])}`).join(" + ")} = ${f(R[i][j])}`)); }
      if (c.op === "det") { const d = A[0][0] * A[1][1] - A[0][1] * A[1][0]; return [`det A = ad − bc`, `= ${A[0][0]}×${A[1][1]} − ${A[0][1]}×${A[1][0]}`, `= ${f(d)}`]; }
      if (c.op === "solve") { const [[a1, b1], [a2, b2]] = c.A, c1 = c.C[0][0], c2 = c.C[1][0], d = a1 * b2 - b1 * a2; return [`Write as [${a1} ${b1}; ${a2} ${b2}] [x; y] = [${c1}; ${c2}]`, `det = ${a1}×${b2} − ${b1}×${a2} = ${d}`, d ? `x = (${c1}×${b2} − ${b1}×${c2})/${d} = ${f((c1 * b2 - b1 * c2) / d, 4)}` : "det = 0, no unique solution", d ? `y = (${a1}×${c2} − ${c1}×${a2})/${d} = ${f((a1 * c2 - c1 * a2) / d, 4)}` : ""].filter(Boolean); }
      return ["Check the matrices have the same order.", "Combine entry by entry."]; },
    note: "Up to 3 × 3 for addition and multiplication; determinants restricted to 2 × 2. Application: solving simultaneous linear equations in two variables.",
    mistake: "Multiplying matrices entry by entry. Matrix multiplication is row × column.",
  });

  /* ---------------- A-l Ratio, proportion & rates ---------------- */
  MK.def("A-l", {
    title: "Ratio, proportion & rates", env: "graph",
    values: { mode: "share", total: 120000, r1: 3, r2: 5, r3: 2, men: 6, days: 10, men2: 4, price: 50000, vat: 7.5, wht: 5, rate: 1550, usd: 200, dist: 150, time: 2.5, pop: 84000, area: 120 },
    controls: [{ type: "tabs", key: "mode", label: "Topic", options: [["share", "Share in a ratio"], ["work", "Rates of work"], ["tax", "VAT & withholding tax"], ["fx", "Foreign exchange"], ["speed", "Speed, distance, time"], ["dens", "Population density"]] },
      { key: "total", label: "Amount to share", min: 1000, max: 1000000, step: 1000, unit: "₦", show: MK.when("mode", "share") }, { key: "r1", label: "Partner A ratio", min: 1, max: 10, show: MK.when("mode", "share") }, { key: "r2", label: "Partner B ratio", min: 1, max: 10, show: MK.when("mode", "share") }, { key: "r3", label: "Partner C ratio", min: 0, max: 10, show: MK.when("mode", "share") },
      { key: "men", label: "Workers (first)", min: 1, max: 20, show: MK.when("mode", "work") }, { key: "days", label: "Days taken", min: 1, max: 40, show: MK.when("mode", "work") }, { key: "men2", label: "Workers (new)", min: 1, max: 30, show: MK.when("mode", "work") },
      { key: "price", label: "Price before tax", min: 1000, max: 500000, step: 500, unit: "₦", show: MK.when("mode", "tax") }, { key: "vat", label: "VAT", min: 0, max: 20, step: 0.5, unit: "%", show: MK.when("mode", "tax") }, { key: "wht", label: "Withholding tax", min: 0, max: 15, step: 0.5, unit: "%", show: MK.when("mode", "tax") },
      { key: "rate", label: "Exchange rate ₦ per $1", min: 400, max: 2000, step: 10, show: MK.when("mode", "fx") }, { key: "usd", label: "US dollars", min: 1, max: 2000, unit: "$", show: MK.when("mode", "fx") },
      { key: "dist", label: "Distance", min: 5, max: 600, step: 5, unit: "km", show: MK.when("mode", "speed") }, { key: "time", label: "Time", min: 0.25, max: 10, step: 0.25, unit: "h", show: MK.when("mode", "speed") }, { key: "pop", label: "Population", min: 1000, max: 500000, step: 1000, show: MK.when("mode", "dens") }, { key: "area", label: "Land area", min: 1, max: 1000, unit: "km²", show: MK.when("mode", "dens") }],
    state: () => ({ t: 0 }),
    tick(dt, s, c) { if (c.mode !== "speed") return true; s.t = (s.t + dt / 4) % 1; return true; },
    calc(c) { const parts = [c.r1, c.r2, c.r3].filter((v) => v > 0), sum = parts.reduce((a, b) => a + b, 0);
      return { sum, shares: parts.map((p) => c.total * p / sum), daysNew: c.men * c.days / c.men2, vatAmt: c.price * c.vat / 100, whtAmt: c.price * c.wht / 100, naira: c.usd * c.rate, speed: c.dist / c.time, dens: c.pop / c.area }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, r = this.calc(c), cols = [P.blue, P.green, P.purple];
      if (c.mode === "share") { const w = a.w - 20, x0 = a.x + 10, y = a.y + 80; let x = x0; const parts = [c.r1, c.r2, c.r3].filter((v) => v > 0);
        parts.forEach((p, i) => { const ww = w * p / r.sum; for (let k = 0; k < p; k++) { g.save(); g.fillStyle = cols[i]; g.globalAlpha = 0.8; g.fillRect(x + k * w / r.sum + 1, y, w / r.sum - 2, 50); g.restore(); } B.text("ABC"[i] + ": " + p + " part" + (p > 1 ? "s" : ""), x + ww / 2, y - 10, { align: "center", size: 11.5, w: 700, color: cols[i] }); B.text(MK.money(r.shares[i]), x + ww / 2, y + 80, { align: "center", size: 12.5, w: 800 }); x += ww; });
        B.text("1 part = " + MK.money(c.total) + " ÷ " + r.sum + " = " + MK.money(c.total / r.sum), x0, y + 130, { size: 13, color: P.soft }); return; }
      if (c.mode === "work") { const m = B.axes({ xmin: 0, xmax: 30, ymin: 0, ymax: Math.max(40, c.days * c.men / 1 / 1), xl: "workers", yl: "days" }); B.plot(m, (x) => (x > 0 ? c.men * c.days / x : NaN), P.blue, 2.6); B.dot(m.X(c.men), m.Y(c.days), P.green, 6, `${c.men} workers, ${c.days} days`); B.dot(m.X(c.men2), m.Y(r.daysNew), P.red, 6, `${c.men2} workers, ${f(r.daysNew, 2)} days`); B.text("Inverse proportion: workers × days = " + c.men * c.days + " worker-days", a.x + 40, a.y + 44, { size: 11.5, color: P.blue, w: 700 }); return; }
      if (c.mode === "tax") { const tot = c.price + r.vatAmt, net = c.price - r.whtAmt, mx = tot, h = a.h - 120, x0 = a.x + 30, bw = 70;
        const bar = (x, items, lab) => { let y = a.y + a.h - 50; items.forEach(([v, col, t]) => { const hh = v / mx * h; g.save(); g.fillStyle = col; g.globalAlpha = 0.85; g.fillRect(x, y - hh, bw, hh); g.restore(); if (hh > 14) B.text(t, x + bw / 2, y - hh / 2 + 4, { align: "center", size: 10, color: "#fff", halo: false, w: 700 }); y -= hh; }); B.text(lab, x + bw / 2, a.y + a.h - 32, { align: "center", size: 11, w: 700 }); };
        bar(x0, [[c.price, P.blue, "price"], [r.vatAmt, P.red, "VAT"]], "Buyer pays"); bar(x0 + 120, [[net, P.green, "net"], [r.whtAmt, P.amber, "WHT"]], "Supplier receives");
        B.text("Total with VAT: " + MK.money(tot), x0 + 240, a.y + 90, { size: 12, w: 700 }); B.text("After WHT: " + MK.money(net), x0 + 240, a.y + 114, { size: 12, w: 700 }); return; }
      if (c.mode === "fx") { const m = B.axes({ xmin: 0, xmax: 2000, ymin: 0, ymax: 2000 * c.rate, xl: "$", yl: "₦" }); B.plot(m, (x) => x * c.rate, P.green, 2.6); B.dot(m.X(c.usd), m.Y(r.naira), P.red, 6, "$" + c.usd + " = " + MK.money(r.naira)); B.line(m.X(c.usd), m.Y(0), m.X(c.usd), m.Y(r.naira), P.red, 1, [4, 3]); B.line(m.X(0), m.Y(r.naira), m.X(c.usd), m.Y(r.naira), P.red, 1, [4, 3]); return; }
      if (c.mode === "speed") { const y = a.y + 90, x0 = a.x + 20, w = a.w - 40; g.save(); g.fillStyle = MK.isNight() ? "#2a2f3a" : "#4b5563"; g.fillRect(x0, y - 16, w, 32); g.restore(); for (let i = 0; i < 12; i++) B.line(x0 + i * w / 12 + 6, y, x0 + i * w / 12 + 20, y, "#f8f1c6", 2);
        const cx = x0 + s.t * w; g.save(); g.fillStyle = P.red; g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = 6; g.beginPath(); g.roundRect ? g.roundRect(cx - 20, y - 12, 40, 18, 6) : g.rect(cx - 20, y - 12, 40, 18); g.fill(); g.restore(); B.circle(cx - 11, y + 7, 4, null, "#111"); B.circle(cx + 11, y + 7, 4, null, "#111");
        B.text("0 km", x0, y + 32, { size: 10 }); B.text(c.dist + " km", x0 + w, y + 32, { size: 10, align: "right" });
        const m = B.axes({ rect: { x: a.x + 10, y: a.y + 140, w: a.w - 20, h: a.h - 150 }, xmin: 0, xmax: c.time * 1.1, ymin: 0, ymax: c.dist * 1.1, xl: "t (h)", yl: "d (km)" }); B.plot(m, (t) => (t <= c.time ? r.speed * t : NaN), P.blue, 2.6); B.dot(m.X(s.t * c.time), m.Y(s.t * c.dist), P.red, 5); B.text("gradient = speed = " + f(r.speed, 2) + " km/h", m.X(c.time * 0.15), m.Y(c.dist), { size: 11.5, color: P.blue, w: 700 }); return; }
      const n = Math.min(400, Math.round(r.dens / 10)), side = Math.min(a.w, a.h - 60) - 20, x0 = a.x + (a.w - side) / 2, y0 = a.y + 40, rr = MK.rng(7); B.panel(x0, y0, side, side);
      for (let i = 0; i < n; i++) B.dot(x0 + 6 + rr() * (side - 12), y0 + 6 + rr() * (side - 12), P.blue, 1.8); B.text("1 km² sample (1 dot ≈ 10 people)", x0, y0 + side + 16, { size: 11, color: P.soft });
    },
    hud(s, c) { const r = this.calc(c), M = MK.money; const L = { share: ["Share = (part ÷ total parts) × amount", `Total parts = ${r.sum}`, ...r.shares.map((v, i) => `${"ABC"[i]}: ${[c.r1, c.r2, c.r3].filter((x) => x > 0)[i]}/${r.sum} × ${M(c.total)} = ${M(v)}`)], work: ["More workers → fewer days (inverse)", "men₁ × days₁ = men₂ × days₂", `${c.men} × ${c.days} = ${c.men2} × d`, [`d = ${f(r.daysNew, 2)} days`, null, true]], tax: ["VAT = rate × price", `VAT = ${c.vat}% × ${M(c.price)} = ${M(r.vatAmt)}`, `WHT = ${c.wht}% × ${M(c.price)} = ${M(r.whtAmt)}`], fx: ["₦ = $ × rate", `${c.usd} × ${c.rate} = ${M(r.naira)}`], speed: ["speed = distance ÷ time", `${c.dist} km ÷ ${c.time} h`, [`= ${f(r.speed, 2)} km/h`, null, true], `= ${f(r.speed / 3.6, 2)} m/s`], dens: ["density = population ÷ area", `${c.pop.toLocaleString()} ÷ ${c.area} km²`, [`= ${f(r.dens, 1)} people/km²`, null, true]] }[c.mode];
      return [{ title: "Formula", lines: L }, { title: "Units", lines: [{ share: "₦ (100 kobo = ₦1)", work: "worker-days", tax: "₦; rates in %", fx: "₦ per $1", speed: "km/h ÷ 3.6 = m/s", dens: "people per km²" }[c.mode]] }]; },
    readouts(s, c) { const r = this.calc(c), M = MK.money; return { share: r.shares.map((v, i) => ["Partner " + "ABC"[i], M(v)]), work: [["Worker-days", c.men * c.days], ["New time", f(r.daysNew, 2) + " days"]], tax: [["VAT", M(r.vatAmt)], ["Price + VAT", M(c.price + r.vatAmt)], ["WHT deducted", M(r.whtAmt)]], fx: [["Naira", M(r.naira)], ["$1 buys", M(c.rate)]], speed: [["Speed", f(r.speed, 2) + " km/h"], ["In m/s", f(r.speed / 3.6, 2) + " m/s"]], dens: [["Density", f(r.dens, 1) + " /km²"]] }[c.mode]; },
    steps(s, c) { const r = this.calc(c), M = MK.money; return { share: [`Add the ratio parts: ${[c.r1, c.r2, c.r3].filter((x) => x > 0).join(" + ")} = ${r.sum}`, `One part = ${M(c.total)} ÷ ${r.sum} = ${M(c.total / r.sum)}`, ...r.shares.map((v, i) => `Partner ${"ABC"[i]} gets ${[c.r1, c.r2, c.r3].filter((x) => x > 0)[i]} parts = ${M(v)}`)], work: [`Total work = ${c.men} × ${c.days} = ${c.men * c.days} worker-days`, `Time for ${c.men2} workers = ${c.men * c.days} ÷ ${c.men2} = ${f(r.daysNew, 2)} days`], tax: [`VAT = ${c.vat}/100 × ${M(c.price)} = ${M(r.vatAmt)}`, `Buyer pays ${M(c.price + r.vatAmt)}`, `WHT = ${c.wht}/100 × ${M(c.price)} = ${M(r.whtAmt)}, so the supplier receives ${M(c.price - r.whtAmt)}`], fx: [`Multiply dollars by the rate: ${c.usd} × ${c.rate} = ${M(r.naira)}`, `To convert back divide by ${c.rate}.`], speed: [`speed = ${c.dist} ÷ ${c.time} = ${f(r.speed, 2)} km/h`, `× 1000 ÷ 3600 → ${f(r.speed / 3.6, 2)} m/s`], dens: [`density = ${c.pop} ÷ ${c.area} = ${f(r.dens, 1)} people per km²`] }[c.mode]; },
    note: "Relate to real life: financial partnerships, rates of work, VAT and withholding tax, foreign exchange, density, speed. Average speed = total distance ÷ total time.",
    mistake: "Averaging two speeds directly. Average speed is total distance ÷ total time, not (v₁ + v₂)/2.",
  });

  /* ---------------- A-m Percentages ---------------- */
  MK.def("A-m", {
    title: "Percentages", env: "graph",
    values: { mode: "ci", P: 50000, r: 10, t: 3, cp: 8000, sp: 9600, price: 120000, dep: 30000, n: 12, inst: 8500, meas: 4.8, actual: 5.0, comm: 5, sales: 400000, disc: 15 },
    controls: [{ type: "tabs", key: "mode", label: "Topic", options: [["si", "Simple interest"], ["ci", "Compound interest"], ["pl", "Profit & loss"], ["comm", "Commission"], ["disc", "Discount"], ["hp", "Hire purchase"], ["err", "Percentage error"]] },
      { key: "P", label: "Principal P", min: 1000, max: 500000, step: 1000, unit: "₦", show: MK.when("mode", "si", "ci") }, { key: "r", label: "Rate", min: 1, max: 30, step: 0.5, unit: "% p.a.", show: MK.when("mode", "si", "ci") }, { key: "t", label: "Time (CI ≤ 3 years)", min: 1, max: 10, unit: "yr", show: MK.when("mode", "si", "ci") },
      { key: "cp", label: "Cost price", min: 100, max: 50000, step: 100, unit: "₦", show: MK.when("mode", "pl") }, { key: "sp", label: "Selling price", min: 100, max: 60000, step: 100, unit: "₦", show: MK.when("mode", "pl") },
      { key: "sales", label: "Sales", min: 10000, max: 2000000, step: 10000, unit: "₦", show: MK.when("mode", "comm") }, { key: "comm", label: "Commission rate", min: 0.5, max: 20, step: 0.5, unit: "%", show: MK.when("mode", "comm") }, { key: "disc", label: "Discount", min: 1, max: 60, unit: "%", show: MK.when("mode", "disc") },
      { key: "price", label: "Cash price", min: 10000, max: 1000000, step: 5000, unit: "₦", show: MK.when("mode", "disc", "hp") }, { key: "dep", label: "Deposit", min: 0, max: 500000, step: 1000, unit: "₦", show: MK.when("mode", "hp") }, { key: "n", label: "Instalments", min: 1, max: 36, show: MK.when("mode", "hp") }, { key: "inst", label: "Each instalment", min: 500, max: 100000, step: 500, unit: "₦", show: MK.when("mode", "hp") },
      { key: "meas", label: "Measured value", min: 0.1, max: 20, step: 0.1, show: MK.when("mode", "err") }, { key: "actual", label: "Actual value", min: 0.1, max: 20, step: 0.1, show: MK.when("mode", "err") }],
    onChange(s, c, k) { if (c.mode === "ci" && c.t > 3) c.t = 3; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, M = MK.money;
      if (c.mode === "si" || c.mode === "ci") { const t = c.mode === "ci" ? Math.min(3, c.t) : c.t, yrs = Array.from({ length: t + 1 }, (_, i) => i), si = yrs.map((y) => c.P * (1 + c.r * y / 100)), ci = yrs.map((y) => c.P * Math.pow(1 + c.r / 100, y)), mx = Math.max(...ci, ...si);
        const m = B.axes({ xmin: 0, xmax: t + 0.8, ymin: 0, ymax: mx * 1.15, xstep: 1, xl: "years", yl: "₦", padT: 44 }), bw = (m.X(1) - m.X(0)) * 0.32;
        B.line(m.X(0), m.Y(c.P), m.X(t + 0.8), m.Y(c.P), P.soft, 1.2, [6, 4]); B.text("P = " + M(c.P).replace(".00", ""), m.X(0) + 6, m.Y(c.P) - 6, { size: 10.5, color: P.soft });
        yrs.forEach((y) => { if (!y) return; const draw = (v, off, col) => { g.save(); g.fillStyle = col; g.globalAlpha = 0.8; g.fillRect(m.X(y) + off, m.Y(v), bw, m.Y(0) - m.Y(v)); g.restore(); }; draw(si[y], -bw - 1, P.blue); draw(ci[y], 1, P.green); if (c.mode === "ci" && y) B.text(M(ci[y]).replace(".00", ""), m.X(y) + bw / 2, m.Y(ci[y]) - 6, { align: "center", size: 9.5, w: 700 }); });
        B.legend([["simple interest", P.blue], ["compound interest", P.green]]); if (c.mode === "ci" && c.t > 3) B.text("Core syllabus limits CI to 3 years", a.x + 10, a.y + a.h - 6, { color: P.red, size: 11 }); return; }
      const bars = (items) => { const mx = Math.max(...items.map((i) => i[1])), bw = Math.min(90, (a.w - 40) / items.length - 20); items.forEach(([lab, v, col], i) => { const x = a.x + 30 + i * (bw + 30), h = v / mx * (a.h - 120); g.save(); const gr = g.createLinearGradient(0, a.y + a.h - 50 - h, 0, a.y + a.h - 50); gr.addColorStop(0, col); gr.addColorStop(1, col + "88"); g.fillStyle = gr; g.shadowColor = P.shadow; g.shadowBlur = 5; g.fillRect(x, a.y + a.h - 50 - h, bw, h); g.restore(); B.text(M(v).replace(".00", ""), x + bw / 2, a.y + a.h - 56 - h, { align: "center", size: 10.5, w: 700 }); B.text(lab, x + bw / 2, a.y + a.h - 32, { align: "center", size: 11, w: 700 }); }); };
      if (c.mode === "pl") { const pr = c.sp - c.cp; bars([["Cost price", c.cp, P.blue], ["Selling price", c.sp, pr >= 0 ? P.green : P.red], [pr >= 0 ? "Profit" : "Loss", Math.abs(pr), P.amber]]); }
      else if (c.mode === "comm") bars([["Sales", c.sales, P.blue], ["Commission", c.sales * c.comm / 100, P.green]]);
      else if (c.mode === "disc") bars([["Marked price", c.price, P.blue], ["Discount", c.price * c.disc / 100, P.red], ["Sale price", c.price * (1 - c.disc / 100), P.green]]);
      else if (c.mode === "hp") { const hp = c.dep + c.n * c.inst; bars([["Cash price", c.price, P.blue], ["Deposit", c.dep, P.purple], ["Instalments", c.n * c.inst, P.amber], ["H.P. total", hp, hp > c.price ? P.red : P.green]]); }
      else { const e = Math.abs(c.meas - c.actual); bars([["Actual", c.actual * 1000, P.blue], ["Measured", c.meas * 1000, P.green], ["Error ×1000", e * 1000, P.red]]); }
    },
    hud(s, c) { const M = MK.money, t = Math.min(3, c.t);
      const L = { si: ["I = PRT / 100", `= ${c.P}×${c.r}×${c.t}/100`, [`= ${M(c.P * c.r * c.t / 100)}`, null, true], `Amount = ${M(c.P + c.P * c.r * c.t / 100)}`],
        ci: ["A = P(1 + R/100)ᵀ", `= ${c.P}(1 + ${c.r}/100)${MK.sup(t)}`, [`= ${M(c.P * Math.pow(1 + c.r / 100, t))}`, null, true], `CI = A − P = ${M(c.P * Math.pow(1 + c.r / 100, t) - c.P)}`],
        pl: ["Profit % = (SP − CP)/CP × 100", `= ${c.sp - c.cp}/${c.cp} × 100`, [`= ${f((c.sp - c.cp) / c.cp * 100, 2)} %`, null, true]], comm: ["Commission = rate × sales", [`= ${M(c.sales * c.comm / 100)}`, null, true]],
        disc: ["Sale price = MP × (100 − d)/100", [`= ${M(c.price * (1 - c.disc / 100))}`, null, true]], hp: ["H.P. price = deposit + n × instalment", `= ${M(c.dep)} + ${c.n} × ${M(c.inst)}`, [`= ${M(c.dep + c.n * c.inst)}`, null, true], `Extra paid = ${M(c.dep + c.n * c.inst - c.price)}`],
        err: ["% error = |error| / actual × 100", `= ${f(Math.abs(c.meas - c.actual), 3)}/${c.actual} × 100`, [`= ${f(Math.abs(c.meas - c.actual) / c.actual * 100, 2)} %`, null, true]] }[c.mode];
      return [{ title: "Formula", lines: L }]; },
    readouts(s, c) { const M = MK.money, t = Math.min(3, c.t); return { si: [["Interest", M(c.P * c.r * c.t / 100)], ["Amount", M(c.P * (1 + c.r * c.t / 100))]], ci: [["Amount", M(c.P * Math.pow(1 + c.r / 100, t))], ["Compound interest", M(c.P * Math.pow(1 + c.r / 100, t) - c.P)], ["vs simple", M(c.P * Math.pow(1 + c.r / 100, t) - c.P * (1 + c.r * t / 100))]], pl: [[c.sp >= c.cp ? "Profit" : "Loss", M(Math.abs(c.sp - c.cp))], ["%", f(Math.abs(c.sp - c.cp) / c.cp * 100, 2) + " %"]], comm: [["Commission", M(c.sales * c.comm / 100)]], disc: [["Discount", M(c.price * c.disc / 100)], ["Pay", M(c.price * (1 - c.disc / 100))]], hp: [["H.P. total", M(c.dep + c.n * c.inst)], ["Extra over cash", M(c.dep + c.n * c.inst - c.price)]], err: [["Error", f(Math.abs(c.meas - c.actual), 3)], ["% error", f(Math.abs(c.meas - c.actual) / c.actual * 100, 2) + " %"]] }[c.mode]; },
    steps(s, c) { const M = MK.money, t = Math.min(3, c.t); if (c.mode === "ci") { const out = []; let A = c.P; for (let y = 1; y <= t; y++) { const I = A * c.r / 100; out.push(`Year ${y}: interest = ${c.r}% of ${M(A)} = ${M(I)}; new amount ${M(A + I)}`); A += I; } out.push(`Compound interest = ${M(A)} − ${M(c.P)} = ${M(A - c.P)}`); return out; }
      if (c.mode === "si") return [`I = P × R × T ÷ 100`, `= ${c.P} × ${c.r} × ${c.t} ÷ 100 = ${M(c.P * c.r * c.t / 100)}`, `Amount = P + I = ${M(c.P * (1 + c.r * c.t / 100))}`];
      if (c.mode === "hp") return [`Instalments: ${c.n} × ${M(c.inst)} = ${M(c.n * c.inst)}`, `H.P. price = ${M(c.dep)} + ${M(c.n * c.inst)} = ${M(c.dep + c.n * c.inst)}`, `Compared with cash: ${M(c.dep + c.n * c.inst - c.price)} more`];
      if (c.mode === "pl") return [`${c.sp >= c.cp ? "Profit" : "Loss"} = |SP − CP| = ${M(Math.abs(c.sp - c.cp))}`, `Percentage is always on the cost price: ${M(Math.abs(c.sp - c.cp))} ÷ ${M(c.cp)} × 100 = ${f(Math.abs(c.sp - c.cp) / c.cp * 100, 2)}%`];
      return ["Write the percentage as a fraction of 100.", "Multiply by the base amount.", "Add or subtract as the question requires."]; },
    note: "Simple interest, commission, discount, depreciation, profit and loss, compound interest (maximum 3 years), hire purchase and percentage error.",
    mistake: "Calculating profit % on the selling price. Profit and loss percentages are on the cost price.",
  });

  /* ---------------- A-n Financial arithmetic ---------------- */
  MK.def("A-n", {
    title: "Financial arithmetic", env: "graph",
    values: { mode: "dep", cost: 2400000, salv: 400000, life: 5, rate: 20, pmt: 50000, i: 10, n: 5, loan: 500000, face: 100000, coupon: 12, shares: 2000, div: 0.85 },
    controls: [{ type: "tabs", key: "mode", label: "Topic", options: [["dep", "Depreciation"], ["amort", "Amortisation"], ["annuity", "Annuity"], ["bond", "Bonds & shares"]] },
      { key: "cost", label: "Asset cost", min: 100000, max: 10000000, step: 50000, unit: "₦", show: MK.when("mode", "dep") }, { key: "salv", label: "Scrap value", min: 0, max: 2000000, step: 10000, unit: "₦", show: MK.when("mode", "dep") }, { key: "life", label: "Useful life", min: 2, max: 15, unit: "yr", show: MK.when("mode", "dep") }, { key: "rate", label: "Reducing-balance rate", min: 5, max: 50, unit: "%", show: MK.when("mode", "dep") },
      { key: "loan", label: "Loan", min: 50000, max: 5000000, step: 10000, unit: "₦", show: MK.when("mode", "amort") }, { key: "pmt", label: "Annual payment (annuity)", min: 5000, max: 500000, step: 5000, unit: "₦", show: MK.when("mode", "annuity") }, { key: "i", label: "Interest rate", min: 1, max: 30, step: 0.5, unit: "%", show: MK.when("mode", "amort", "annuity") }, { key: "n", label: "Years n", min: 1, max: 20, show: MK.when("mode", "amort", "annuity") },
      { key: "face", label: "Bond face value", min: 10000, max: 1000000, step: 10000, unit: "₦", show: MK.when("mode", "bond") }, { key: "coupon", label: "Coupon rate", min: 1, max: 25, step: 0.5, unit: "%", show: MK.when("mode", "bond") }, { key: "shares", label: "Shares held", min: 100, max: 50000, step: 100, show: MK.when("mode", "bond") }, { key: "div", label: "Dividend per share", min: 0.05, max: 5, step: 0.05, unit: "₦", show: MK.when("mode", "bond") }],
    sched(c) { const i = c.i / 100, n = c.n, R = c.loan * i / (1 - Math.pow(1 + i, -n)), rows = []; let bal = c.loan; for (let y = 1; y <= n; y++) { const int = bal * i, prin = R - int; bal -= prin; rows.push([y, int, prin, Math.max(0, bal)]); } return { R, rows }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "dep") { const sl = (y) => c.cost - (c.cost - c.salv) * y / c.life, rb = (y) => c.cost * Math.pow(1 - c.rate / 100, y); const m = B.axes({ xmin: 0, xmax: c.life + 0.5, ymin: 0, ymax: c.cost * 1.1, xstep: 1, xl: "years", yl: "₦", padT: 30 });
        B.plot(m, (y) => (y <= c.life ? sl(y) : NaN), P.blue, 2.6); B.plot(m, (y) => (y <= c.life ? rb(y) : NaN), P.red, 2.6); for (let y = 0; y <= c.life; y++) { B.dot(m.X(y), m.Y(sl(y)), P.blue, 3); B.dot(m.X(y), m.Y(rb(y)), P.red, 3); }
        B.text("straight line", m.X(c.life * 0.55), m.Y(sl(c.life * 0.55)) - 10, { color: P.blue, size: 11, w: 700 }); B.text("reducing balance", m.X(c.life * 0.3), m.Y(rb(c.life * 0.3)) + 18, { color: P.red, size: 11, w: 700 }); return; }
      if (c.mode === "amort") { const S = this.sched(c), m = B.axes({ xmin: 0, xmax: c.n + 1, ymin: 0, ymax: S.R * 1.15, xstep: Math.max(1, Math.ceil(c.n / 10)), xl: "year", yl: "₦" }), bw = (m.X(1) - m.X(0)) * 0.6;
        S.rows.forEach(([y, int, prin]) => { g.save(); g.fillStyle = P.red; g.globalAlpha = 0.8; g.fillRect(m.X(y) - bw / 2, m.Y(int), bw, m.Y(0) - m.Y(int)); g.fillStyle = P.green; g.fillRect(m.X(y) - bw / 2, m.Y(int + prin), bw, m.Y(int) - m.Y(int + prin)); g.restore(); });
        B.legend([["interest", P.red], ["principal repaid", P.green]]); return; }
      if (c.mode === "annuity") { const i = c.i / 100, vals = []; let A = 0; for (let y = 1; y <= c.n; y++) { A = A * (1 + i) + c.pmt; vals.push(A); } const m = B.axes({ xmin: 0, xmax: c.n + 1, ymin: 0, ymax: vals[vals.length - 1] * 1.12, xstep: Math.max(1, Math.ceil(c.n / 10)), xl: "year", yl: "₦", padT: 44 }), bw = (m.X(1) - m.X(0)) * 0.6;
        vals.forEach((v, k) => { const paid = c.pmt * (k + 1); g.save(); g.fillStyle = P.blue; g.globalAlpha = 0.8; g.fillRect(m.X(k + 1) - bw / 2, m.Y(paid), bw, m.Y(0) - m.Y(paid)); g.fillStyle = P.amber; g.fillRect(m.X(k + 1) - bw / 2, m.Y(v), bw, m.Y(paid) - m.Y(v)); g.restore(); });
        B.legend([["payments", P.blue], ["interest earned", P.amber]]); return; }
      const ci = c.face * c.coupon / 100, dv = c.shares * c.div, mx = Math.max(ci, dv), x0 = a.x + 40;
      [["Bond coupon / yr", ci, P.blue], ["Dividend / yr", dv, P.green]].forEach(([l, v, col], k) => { const h = v / mx * (a.h - 140), x = x0 + k * 150; g.save(); g.fillStyle = col; g.globalAlpha = 0.85; g.fillRect(x, a.y + a.h - 60 - h, 90, h); g.restore(); B.text(MK.money(v), x + 45, a.y + a.h - 66 - h, { align: "center", size: 11, w: 700 }); B.text(l, x + 45, a.y + a.h - 40, { align: "center", size: 11, w: 700 }); });
    },
    hud(s, c) { const M = MK.money; if (c.mode === "dep") return [{ title: "Formula", lines: ["Straight line: D = (cost − scrap)/life", `= (${M(c.cost)} − ${M(c.salv)}) / ${c.life} = ${M((c.cost - c.salv) / c.life)}/yr`, "Reducing balance: V = C(1 − r/100)ⁿ", `V${MK.sub(c.life)} = ${M(c.cost * Math.pow(1 - c.rate / 100, c.life))}`] }];
      if (c.mode === "amort") { const S = this.sched(c); return [{ title: "Formula", lines: ["R = L·i / (1 − (1 + i)⁻ⁿ)", `= ${M(c.loan)}×${c.i / 100} / (1 − ${1 + c.i / 100}${MK.sup(-c.n)})`, [`R = ${M(S.R)} per year`, null, true], `Total paid ${M(S.R * c.n)}`] }]; }
      if (c.mode === "annuity") { const i = c.i / 100, A = c.pmt * (Math.pow(1 + i, c.n) - 1) / i; return [{ title: "Formula", lines: ["A = R[(1 + i)ⁿ − 1] / i", `= ${M(c.pmt)}[(${1 + i})${MK.sup(c.n)} − 1]/${i}`, [`= ${M(A)}`, null, true]] }]; }
      return [{ title: "Formula", lines: ["Bond interest = face × coupon rate", `= ${M(c.face)} × ${c.coupon}% = ${M(c.face * c.coupon / 100)}`, "Dividend = shares × dividend/share", `= ${c.shares} × ${M(c.div)} = ${M(c.shares * c.div)}`] }]; },
    readouts(s, c) { const M = MK.money; if (c.mode === "dep") return [["SL charge / yr", M((c.cost - c.salv) / c.life)], ["RB value after " + c.life + " yr", M(c.cost * Math.pow(1 - c.rate / 100, c.life))]]; if (c.mode === "amort") { const S = this.sched(c); return [["Annual repayment", M(S.R)], ["Total interest", M(S.R * c.n - c.loan)]]; } if (c.mode === "annuity") { const i = c.i / 100, A = c.pmt * (Math.pow(1 + i, c.n) - 1) / i; return [["Future value", M(A)], ["Paid in", M(c.pmt * c.n)], ["Interest", M(A - c.pmt * c.n)]]; } return [["Coupon / yr", M(c.face * c.coupon / 100)], ["Dividend / yr", M(c.shares * c.div)]]; },
    table(s, c) { const M = MK.money; if (c.mode === "amort") { const S = this.sched(c); return T(["Year", "Interest", "Principal", "Balance"], S.rows.map(([y, i, p, b]) => [y, M(i), M(p), M(b)])); } if (c.mode === "dep") { const rows = []; for (let y = 0; y <= c.life; y++) rows.push([y, M(c.cost - (c.cost - c.salv) * y / c.life), M(c.cost * Math.pow(1 - c.rate / 100, y))]); return T(["Year", "Straight line", "Reducing balance"], rows); } return ""; },
    steps(s, c) { const M = MK.money; if (c.mode === "dep") return [`Straight line: (${M(c.cost)} − ${M(c.salv)}) ÷ ${c.life} = ${M((c.cost - c.salv) / c.life)} each year`, `Reducing balance: multiply by ${1 - c.rate / 100} each year`, `After ${c.life} years: ${M(c.cost)} × ${1 - c.rate / 100}${MK.sup(c.life)} = ${M(c.cost * Math.pow(1 - c.rate / 100, c.life))}`];
      if (c.mode === "amort") { const S = this.sched(c); return [`i = ${c.i}% = ${c.i / 100}`, `R = ${M(c.loan)} × ${c.i / 100} ÷ (1 − ${1 + c.i / 100}^−${c.n}) = ${M(S.R)}`, `Year 1 interest = ${M(S.rows[0][1])}, principal repaid = ${M(S.rows[0][2])}`]; }
      if (c.mode === "annuity") return [`Each payment earns interest until year ${c.n}`, `A = R[(1 + i)ⁿ − 1]/i`, `= ${M(c.pmt * (Math.pow(1 + c.i / 100, c.n) - 1) / (c.i / 100))}`];
      return [`Coupon = ${c.coupon}% × ${M(c.face)} = ${M(c.face * c.coupon / 100)} per year`, `Dividend = ${c.shares} × ${M(c.div)} = ${M(c.shares * c.div)}`]; },
    note: "Definition and calculation of depreciation on fixed assets, amortisation on capitalised assets, simple annuity problems, shares/stocks, debentures and bonds.",
    mistake: "Applying the reducing-balance rate to the original cost each year — it applies to the value at the start of each year.",
  });

  /* ---------------- A-o Variation ---------------- */
  MK.def("A-o", {
    title: "Variation", env: "graph",
    values: { type: "direct", x1: 4, y1: 12, z1: 3, xq: 7, zq: 2, fixed: 2000, x2: 10, y2: 6000 },
    controls: [{ type: "tabs", key: "type", label: "Type", options: [["direct", "Direct y ∝ x"], ["inverse", "Inverse y ∝ 1/x"], ["sq", "y ∝ x²"], ["joint", "Joint y ∝ xz"], ["jointinv", "y ∝ x/z"], ["partial", "Partial y = a + bx"]] },
      { key: "x1", label: "Given x", min: 1, max: 20, step: 0.5 }, { key: "y1", label: "Given y", min: 1, max: 200, step: 0.5 }, { key: "z1", label: "Given z (joint)", min: 1, max: 10, step: 0.5, show: MK.when("type", "joint", "jointinv") }, { key: "xq", label: "New x", min: 0.5, max: 20, step: 0.5 }, { key: "zq", label: "New z (joint)", min: 0.5, max: 10, step: 0.5, show: MK.when("type", "joint", "jointinv") },
      { key: "x2", label: "Partial: second x", min: 1, max: 30, step: 1, show: MK.when("type", "partial") }, { key: "y2", label: "Partial: second y", min: 100, max: 20000, step: 100, show: MK.when("type", "partial") }],
    k(c) { switch (c.type) { case "direct": return c.y1 / c.x1; case "inverse": return c.y1 * c.x1; case "sq": return c.y1 / (c.x1 * c.x1); case "joint": return c.y1 / (c.x1 * c.z1); case "jointinv": return c.y1 * c.z1 / c.x1; default: { const b = (c.y2 - c.y1) / (c.x2 - c.x1 || 1); return { a: c.y1 - b * c.x1, b }; } } },
    fn(c) { const k = this.k(c); switch (c.type) { case "direct": return (x) => k * x; case "inverse": return (x) => k / x; case "sq": return (x) => k * x * x; case "joint": return (x) => k * x * c.zq; case "jointinv": return (x) => k * x / c.zq; default: return (x) => k.a + k.b * x; } },
    draw(g, s, c, B) {
      const P = B.P, fn = this.fn(c), xm = 20, ys = [fn(1), fn(xm), c.y1, fn(c.xq), c.type === "partial" ? c.y2 : 0].filter(isFinite), ym = Math.max(...ys) * 1.15;
      const m = B.axes({ xmin: 0, xmax: xm, ymin: 0, ymax: ym, xl: "x", yl: "y" }); B.plot(m, (x) => (x > 0 ? fn(x) : NaN), P.blue, 2.8);
      if (c.type !== "joint" && c.type !== "jointinv") B.dot(m.X(c.x1), m.Y(c.y1), P.green, 6, `given (${c.x1}, ${c.y1})`);
      if (c.type === "partial") B.dot(m.X(c.x2), m.Y(c.y2), P.green, 6, `given (${c.x2}, ${c.y2})`);
      const yq = fn(c.xq); B.dot(m.X(c.xq), m.Y(yq), P.red, 6, `x = ${c.xq} → y = ${f(yq, 3)}`, { dy: 18 }); B.line(m.X(c.xq), m.Y(0), m.X(c.xq), m.Y(yq), P.red, 1, [4, 3]);
      if (c.type === "partial") { const k = this.k(c); B.line(m.X(0), m.Y(k.a), m.X(xm), m.Y(k.a), P.amber, 1.4, [6, 4]); B.text("fixed part a = " + f(k.a, 2), m.X(0.5), m.Y(k.a) - 6, { size: 11, color: P.amber, w: 700 }); }
    },
    hud(s, c) { const k = this.k(c), yq = this.fn(c)(c.xq), F = { direct: ["y = kx", `k = ${c.y1}/${c.x1} = ${f(k, 4)}`], inverse: ["y = k/x", `k = ${c.y1}×${c.x1} = ${f(k, 4)}`], sq: ["y = kx²", `k = ${c.y1}/${c.x1}² = ${f(k, 4)}`], joint: ["y = kxz", `k = ${c.y1}/(${c.x1}×${c.z1}) = ${f(k, 4)}`], jointinv: ["y = kx/z", `k = ${c.y1}×${c.z1}/${c.x1} = ${f(k, 4)}`], partial: ["y = a + bx", `b = (${c.y2} − ${c.y1})/(${c.x2} − ${c.x1}) = ${f(k.b, 3)}`, `a = ${f(k.a, 3)}`] }[c.type];
      return [{ title: "Formula", lines: [...F, "—", [`x = ${c.xq}${c.type.startsWith("joint") ? ", z = " + c.zq : ""} ⇒ y = ${f(yq, 4)}`, "#ffd27a", true]] }]; },
    readouts(s, c) { const k = this.k(c); return [["Constant", typeof k === "number" ? "k = " + f(k, 4) : `a = ${f(k.a, 2)}, b = ${f(k.b, 3)}`], ["New y", f(this.fn(c)(c.xq), 4)]]; },
    table(s, c) { const fn = this.fn(c), xs = [1, 2, 4, 5, 8, 10]; return T(["x", ...xs], [["y", ...xs.map((x) => f(fn(x), 3))]]); },
    steps(s, c) { const k = this.k(c), yq = this.fn(c)(c.xq); if (c.type === "partial") return [`y = a + bx. Substitute both pairs:`, `${c.y1} = a + ${c.x1}b and ${c.y2} = a + ${c.x2}b`, `Subtract: b = ${f(k.b, 4)}, then a = ${f(k.a, 4)}`, `When x = ${c.xq}: y = ${f(k.a, 3)} + ${f(k.b, 3)}×${c.xq} = ${f(yq, 4)}`];
      const eq = { direct: "y = kx", inverse: "y = k/x", sq: "y = kx²", joint: "y = kxz", jointinv: "y = kx/z" }[c.type]; return [`Write the relation: ${eq}`, `Substitute the given values to find k = ${f(k, 4)}`, `So ${eq.replace("k", f(k, 4))}`, `New values give y = ${f(yq, 4)}`]; },
    note: "Express each variation in symbols (z ∝ n, z ∝ 1/n, …), find the constant, then apply to practical problems. Partial variation has a fixed part plus a varying part (e.g. a taxi fare).",
    mistake: "For inverse variation dividing y by x to find k. For y ∝ 1/x, k = xy.",
  });
})();
