/* exam-kit.js — shared WAEC-style exam mode for the Physics and Chemistry labs.
   Same look and behaviour as the Maths exam (m-exam.js): Paper 1 objective (A–D) or Paper 2 structured
   (type the answer), timed at WAEC pace, fresh random numbers every time, worked solutions, per-topic table.
   Nothing is stored: the score lives on the page only. */
(function () {
  "use strict";
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sup = (n) => String(n).split("").map((ch) => SUP[ch] || ch).join("");
  const UNSUP = { "⁻": "-", "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };

  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const ri = (a, b, r) => a + Math.floor(r() * (b - a + 1));
  const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
  const sig = (v, n = 3) => +(+v).toPrecision(n);
  /* number → display string: ordinary numbers to 4 s.f.; very large / small ones in standard form */
  function show(v) {
    if (typeof v !== "number") return String(v);
    if (!isFinite(v)) return "NaN"; if (v === 0) return "0";
    const a = Math.abs(v);
    if (a >= 1e6 || a < 1e-3) { let e = Math.floor(Math.log10(a)), m = sig(v / Math.pow(10, e), 3); if (Math.abs(m) >= 10) { m = sig(m / 10, 3); e++; } return `${m} × 10${sup(e)}`; }
    return String(sig(v, 4));
  }
  /* typed answer → number. Accepts 6.6e-34, 6.6×10^-34, 6.6 x 10⁻³⁴, 3/4, 1,250, trailing units */
  function parseNum(s) {
    if (s == null) return NaN;
    let t = String(s).trim().replace(/\s+/g, "").replace(/[−–]/g, "-").replace(/,/g, "").replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => UNSUP[c]);
    t = t.replace(/[×xX*]10\^?\(?(-?\d+)\)?/, "e$1");
    const fr = t.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/); if (fr) return +fr[1] / +fr[2];
    return parseFloat(t);
  }
  const shuffle = (arr, r) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  /* fixed concept questions → generators (objective paper only unless acc[] typed answers are given) */
  const bank = (items) => items.map((it) => () => Object.assign({ mc: !it.acc }, it, { d: it.d.slice() }));

  function make(gens, topics, n, seed, paper) {
    const r = rng(seed), out = [], seen = new Set(), keys = topics.filter((k) => gens[k] && gens[k].length); if (!keys.length) return out;
    let guard = 0;
    while (out.length < n && guard++ < n * 60) {
      const k = out.length < keys.length ? keys[out.length] : keys[Math.floor(r() * keys.length)];
      const qq = pick(gens[k], r)(r, H); if (!qq) continue;
      if (paper === "p2" && typeof qq.a !== "number" && !qq.acc) continue;      // structured paper: answers you can type
      if (seen.has(qq.q) && guard < n * 40) continue; seen.add(qq.q);
      const ans = show(qq.a); const opts = [ans];
      (qq.d || []).forEach((d) => { const s2 = show(d); if (!opts.includes(s2) && s2 !== "NaN" && s2 !== "undefined" && opts.length < 4) opts.push(s2); });
      const isInt = typeof qq.a === "number" && Number.isInteger(qq.a) && Math.abs(qq.a) < 1e6;
      const alt = isInt ? [qq.a + 1, qq.a - 1, qq.a + 2, qq.a * 2, qq.a - 2, qq.a + 3, qq.a + 5] : typeof qq.a === "number" ? [2, 0.5, 10, 0.1, 1.5, 4, 3].map((f) => qq.a * f) : [];
      for (let i = 0; opts.length < 4 && i < alt.length; i++) { const s2 = show(alt[i]); if (!opts.includes(s2)) opts.push(s2); }
      if (opts.length < 4) continue;                                               // never pad with fake text options
      shuffle(opts, r); out.push(Object.assign(qq, { topic: k, opts, ans }));
    }
    return out;
  }
  function correct(q, a, paper) {
    if (a == null || a === "") return false;
    if (paper === "p1") return a === q.ans;
    if (typeof q.a === "number") { const v = parseNum(a); if (isNaN(v)) return false; return q.a === 0 ? Math.abs(v) <= 0.01 : Math.abs(v - q.a) <= Math.abs(q.a) * 0.01 + 1e-12; }
    const norm = (x) => String(x).toLowerCase().replace(/[\s.\-–]/g, "");
    return [q.a].concat(q.acc || []).some((x) => norm(x) === norm(a));
  }

  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) { if (k === "html") e.innerHTML = attrs[k]; else if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    kids.flat().forEach((k) => { if (k == null) return; e.appendChild(typeof k === "string" || typeof k === "number" ? document.createTextNode(String(k)) : k); });
    return e;
  }
  const table = (head, rows) => `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  const css = `.exk{display:flex;flex-direction:column;gap:14px;max-width:960px;margin:0 auto;color:var(--g-ink,#e8eef8);font-family:'IBM Plex Sans',system-ui,sans-serif}
.exk .card{padding:16px 18px;border-radius:18px;background:var(--g-surface,rgba(255,255,255,.06));border:1px solid var(--g-edge,rgba(255,255,255,.14));box-shadow:inset 1px 2px 2px var(--g-highlight,rgba(255,255,255,.08)),4px 8px 16px var(--g-shadow,rgba(0,0,0,.25))}
.exk .head h1{font:600 26px/1.2 'Source Serif 4',Georgia,serif;margin:6px 0}.exk .head p{margin:0;color:var(--g-muted,#9fb0c8);font-size:14px;line-height:1.5}
.exk .badge{display:inline-block;font:700 10.5px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:var(--g-active,rgba(255,210,122,.2));color:var(--g-accent,#ffd27a)}
.exk h2{font:600 20px 'Source Serif 4',Georgia,serif;margin:0 0 8px}.exk .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.exk label.k{font:600 11px 'JetBrains Mono',monospace;color:var(--g-muted,#9fb0c8)}
.exk select{font:600 12.5px 'JetBrains Mono',monospace;padding:7px 9px;border-radius:10px;border:1px solid var(--g-edge,rgba(255,255,255,.2));background:var(--g-well,rgba(0,0,0,.2));color:inherit;max-width:100%}
.exk .chip{font:600 12px 'IBM Plex Sans',sans-serif;padding:7px 11px;border-radius:999px;border:1px solid var(--g-edge,rgba(255,255,255,.2));background:var(--g-well,rgba(0,0,0,.15));cursor:pointer;color:inherit;opacity:.6}.exk .chip.on{background:var(--g-active,rgba(255,210,122,.22));opacity:1}
.exk .go{font:700 13px 'JetBrains Mono',monospace;padding:10px 16px;border-radius:12px;border:0;cursor:pointer;background:linear-gradient(135deg,#ffd27a,#ffb347);color:#3a2a10}.exk .go:disabled{opacity:.5;cursor:default}
.exk .q{padding:14px 16px;border-radius:16px;background:var(--g-well,rgba(0,0,0,.15));border:1px solid var(--g-edge,rgba(255,255,255,.14))}.exk .q .n{font:700 11px 'JetBrains Mono',monospace;color:var(--g-accent,#ffd27a);letter-spacing:.08em}.exk .q p{margin:6px 0 10px;font:15px/1.55 'IBM Plex Sans',sans-serif}
.exk .opt{display:flex;gap:9px;align-items:center;padding:8px 10px;border-radius:10px;cursor:pointer;font:600 13.5px/1.4 'JetBrains Mono',monospace}.exk .opt:hover{background:var(--g-active,rgba(255,255,255,.08))}.exk .opt.ok{background:rgba(91,214,140,.25)}.exk .opt.bad{background:rgba(255,123,114,.25)}.exk .opt input{flex:none;width:18px;height:18px}
.exk input.num{font:600 14px 'JetBrains Mono',monospace;padding:9px 11px;width:min(260px,100%);border-radius:10px;border:1px solid var(--g-edge,rgba(255,255,255,.2));background:var(--g-surface,rgba(255,255,255,.06));color:inherit}
.exk .sol{margin-top:9px;font:12.5px/1.6 'JetBrains Mono',monospace;border-left:3px solid var(--g-accent,#ffd27a);padding-left:10px}.exk .tag{font:700 10px 'JetBrains Mono',monospace;padding:3px 7px;border-radius:7px;background:var(--g-active,rgba(255,255,255,.1));margin-left:8px;letter-spacing:0}
.exk .timer{font:700 18px 'JetBrains Mono',monospace}.exk .score{font:700 34px 'JetBrains Mono',monospace;color:var(--g-accent,#ffd27a)}.exk .hint{font-size:12.5px;color:var(--g-muted,#9fb0c8);margin:6px 0 0}
.exk table{width:100%;border-collapse:collapse;font:12px 'JetBrains Mono',monospace;margin-top:8px}.exk td,.exk th{border:1px solid var(--g-edge,rgba(255,255,255,.14));padding:5px 8px;text-align:left}
.exk .bar{position:sticky;top:0;z-index:5;backdrop-filter:blur(12px)}body:not(.lab-chemistry) .exk .bar{top:72px}.exk select{width:auto}
@media (max-width:680px){body:not(.lab-chemistry) .exk .bar{top:112px}}
@media (max-width:560px){.exk .head h1{font-size:21px}.exk .q{padding:12px}.exk .q p{font-size:14.5px}.exk .score{font-size:26px}.exk .go{width:100%}}`;
  let styled = false;

  const H = { rng, ri, pick, sig, show, sup, shuffle, bank, parseNum };
  window.ExamKit = {
    H, make, show, parseNum, correct,
    /* cfg: { subject, title, blurb, gens, topics, perQ:{p1,p2}, lengths, p1Label, p2Label, note } */
    render(root, cfg) {
      if (!styled) { const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); styled = true; }
      const state = { n: 10, sel: new Set(Object.keys(cfg.topics)), timed: true };
      root.innerHTML = ""; const wrap = el("div", { class: "exk" }); root.appendChild(wrap);
      wrap.appendChild(el("div", { class: "head" }, el("span", { class: "badge" }, "Exam mode"), el("h1", null, cfg.title), el("p", null, cfg.blurb || "Fresh questions every time, generated with random numbers in the style of WAEC papers. Your score stays on this page only.")));
      const setup = el("div", { class: "card" }); wrap.appendChild(setup); const area = el("div", { class: "exk" }); wrap.appendChild(area);
      const paperSel = el("select", { "aria-label": "Paper" }); [["p1", cfg.p1Label || "Paper 1 — objective (choose A–D)"], ["p2", cfg.p2Label || "Paper 2 — structured (type the answer)"]].forEach(([v, l]) => paperSel.appendChild(el("option", { value: v }, l)));
      const nSel = el("select", { "aria-label": "Number of questions" }); (cfg.lengths || [5, 10, 20, 50]).forEach((v) => { const o = el("option", { value: v }, v + " questions"); if (v === 10) o.selected = true; nSel.appendChild(o); });
      const tBtn = el("button", { type: "button", class: "chip on", "aria-pressed": "true" }, "⏱ Timed (WAEC pace)"); tBtn.addEventListener("click", () => { state.timed = !state.timed; tBtn.classList.toggle("on", state.timed); tBtn.setAttribute("aria-pressed", String(state.timed)); });
      const chips = el("div", { class: "row" }); Object.entries(cfg.topics).forEach(([k, name]) => { const ch = el("button", { type: "button", class: "chip on", "aria-pressed": "true" }, name); ch.addEventListener("click", () => { if (state.sel.has(k)) state.sel.delete(k); else state.sel.add(k); ch.classList.toggle("on", state.sel.has(k)); ch.setAttribute("aria-pressed", String(state.sel.has(k))); }); chips.appendChild(ch); });
      const allBtn = el("button", { type: "button", class: "chip on" }, "All / none"); allBtn.addEventListener("click", () => { const on = state.sel.size !== Object.keys(cfg.topics).length; state.sel = new Set(on ? Object.keys(cfg.topics) : []); chips.querySelectorAll(".chip").forEach((c) => { c.classList.toggle("on", on); c.setAttribute("aria-pressed", String(on)); }); });
      const go = el("button", { type: "button", class: "go" }, "Start ▸"); go.addEventListener("click", start);
      setup.append(el("h2", null, "Set up your paper"), el("div", { class: "row" }, el("label", { class: "k" }, "Paper"), paperSel, el("label", { class: "k" }, "Length"), nSel, tBtn, go),
        el("p", { class: "hint" }, cfg.note || ""), el("div", { style: "height:8px" }), el("div", { class: "row" }, el("label", { class: "k" }, "Topics (tap to include / exclude)"), allBtn), el("div", { style: "height:6px" }), chips);
      let timerId = 0;
      const obs = new MutationObserver(() => { if (!document.body.contains(wrap)) { clearInterval(timerId); obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
      function start() {
        clearInterval(timerId); const paper = paperSel.value; state.n = +nSel.value; const topics = [...state.sel];
        if (!topics.length) { area.innerHTML = "<div class='card'>Choose at least one topic.</div>"; return; }
        const qs = make(cfg.gens, topics, state.n, (Date.now() & 0xffffff) + 7, paper); area.innerHTML = "";
        if (!qs.length) { area.innerHTML = "<div class='card'>No structured questions for these topics — choose Paper 1 or add topics.</div>"; return; }
        const perQ = (cfg.perQ || {})[paper] || (paper === "p1" ? 90 : 180);
        const head = el("div", { class: "card row bar" }), timer = el("span", { class: "timer", role: "timer", "aria-live": "off" }, ""), submit = el("button", { type: "button", class: "go" }, "Submit & mark ✓");
        head.append(el("b", null, `${paper === "p1" ? "Paper 1" : "Paper 2"} · ${qs.length} questions`), el("span", { style: "flex:1" }), timer, submit); area.appendChild(head);
        const answers = new Array(qs.length).fill(null), blocks = [];
        qs.forEach((q, i) => {
          const b = el("div", { class: "q" }); b.appendChild(el("div", { class: "n" }, `QUESTION ${i + 1}`, el("span", { class: "tag" }, cfg.topics[q.topic] || q.topic))); b.appendChild(el("p", null, q.q));
          const u = q.unit ? (q.unit === "°" || q.unit === "%" ? q.unit : " " + q.unit) : "";
          if (paper === "p1") q.opts.forEach((o, j) => { const lab = el("label", { class: "opt" }), rad = el("input", { type: "radio", name: "exq" + i, value: o }); rad.addEventListener("change", () => (answers[i] = o)); lab.append(rad, el("span", null, "ABCD"[j] + ".  " + o + (typeof q.a === "number" ? u : ""))); b.appendChild(lab); });
          else { const inp = el("input", { type: "text", class: "num", inputmode: typeof q.a === "number" ? "decimal" : "text", placeholder: "your answer" + (q.unit ? " (" + q.unit + ")" : ""), "aria-label": "Answer to question " + (i + 1) }); inp.addEventListener("input", () => (answers[i] = inp.value)); b.appendChild(inp); }
          area.appendChild(b); blocks.push(b);
        });
        let left = state.timed ? perQ * qs.length : 0;
        const tick = () => { if (!state.timed) { timer.textContent = ""; return; } const m = Math.floor(left / 60), s = left % 60; timer.textContent = `⏱ ${m}:${String(s).padStart(2, "0")}`; if (left-- <= 0) mark(); };
        tick(); if (state.timed) timerId = setInterval(tick, 1000);
        submit.addEventListener("click", mark); let marked = false;
        head.scrollIntoView({ behavior: "smooth", block: "start" });
        function mark() {
          if (marked) return; marked = true; clearInterval(timerId); let score = 0; const per = {};
          qs.forEach((q, i) => {
            const ok = correct(q, answers[i], paper); if (ok) score++; per[q.topic] = per[q.topic] || [0, 0]; per[q.topic][1]++; if (ok) per[q.topic][0]++;
            const b = blocks[i];
            b.querySelectorAll(".opt").forEach((lab) => { const inp = lab.querySelector("input"), v = inp.value; inp.disabled = true; if (v === q.ans) lab.classList.add("ok"); else if (v === answers[i]) lab.classList.add("bad"); });
            const inp = b.querySelector("input.num"); if (inp) inp.disabled = true;
            const u = q.unit ? " " + q.unit : "";
            b.appendChild(el("div", { class: "sol", html: `<b>${ok ? "✓ Correct" : "✗ Answer: " + show(q.a) + (typeof q.a === "number" ? u : "")}</b>${(q.steps || []).length ? "<br>" + q.steps.map((s3, k) => `${q.steps.length > 1 ? k + 1 + ". " : ""}${s3}`).join("<br>") : ""}` }));
          });
          const pct = Math.round((score / qs.length) * 100), res = el("div", { class: "card" });
          res.append(el("div", { class: "score" }, `${score} / ${qs.length}  (${pct}%)`), el("p", null, pct >= 75 ? "Excellent — A1 range. Keep practising the weaker topics below." : pct >= 50 ? "Good credit level. Review the worked solutions for the ones you missed." : "Keep going — open the topic simulations for the questions you missed and try again."));
          res.appendChild(el("div", { html: table(["Topic", "Correct", "Out of"], Object.entries(per).map(([k, v]) => [cfg.topics[k] || k, v[0], v[1]])) }));
          const again = el("button", { type: "button", class: "go" }, "New paper ↻"); again.addEventListener("click", start); res.append(el("div", { style: "height:10px" }), again);
          area.insertBefore(res, area.children[1]); submit.disabled = true; res.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    },
  };
})();
