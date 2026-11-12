/* learn-kit.js — shared learning layer for the WAEC labs (piloted in Agricultural Science).
   Topic checks with scoring and mastery, progress tracking, daily five with streaks, badges and levels,
   mistake notebook, flashcards, four lab games, teacher tools (presentation mode, test builder, lesson
   plan and worksheet), a printable certificate and offline install.
   Everything about the learner is saved on this device only (localStorage). Nothing is sent anywhere.
   A subject plugs in with LK.init(cfg) — see a-learn.js. */
(function () {
  "use strict";
  const LK = (window.LK = {});
  let CFG = null, ST = null, mem = null;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => (n < 10 ? "0" : "") + n;
  const day = (d) => { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  const addDays = (iso, n) => { const p = iso.split("-").map(Number), d = new Date(p[0], p[1] - 1, p[2] + n); return day(d); };
  const nice = (iso) => { if (!iso) return "—"; const p = iso.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= store (device only) ================= */
  const blank = () => ({ v: 1, name: "", topics: {}, seen: {}, mistakes: [], cards: {}, xp: 0, badges: {}, games: {}, daily: { last: "", streak: 0, best: 0, total: 0, days: [] }, stats: { answered: 0, correct: 0, secs: 0, fixed: 0, cards: 0 }, chal: {} });
  const key = () => "lwn.learn." + CFG.id;
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(key()) || "null"); } catch (e) { d = mem; }
    const b = blank(); ST = d && d.v === 1 ? Object.assign(b, d, { daily: Object.assign(b.daily, d.daily), stats: Object.assign(b.stats, d.stats) }) : b;
  }
  let saveT = 0;
  function save() { mem = ST; clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(key(), JSON.stringify(ST)); } catch (e) { /* private window or full storage: progress lasts for this visit only */ } }, 120); }

  /* ================= syllabus helpers ================= */
  const sections = () => CFG.sections();
  const allTopics = () => [].concat(...sections().map((s) => s.topics.map((t) => Object.assign({ section: s.key, sectionLabel: s.label }, t))));
  const topic = (code) => allTopics().find((t) => t.code === code);
  const subCount = () => allTopics().reduce((n, t) => n + t.subtopics.length, 0);
  const rec = (code) => ST.topics[code] || null;
  const best = (code) => (rec(code) ? rec(code).best : -1);
  const LEVELS = [["new", "Not started"], ["learning", "Learning"], ["secure", "Secure"], ["mastered", "Mastered"]];
  const level = (code) => { const b = best(code); return b < 0 ? 0 : b >= 80 ? 3 : b >= 50 ? 2 : 1; };
  const XPL = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  const rank = () => { let i = 0; while (i + 1 < XPL.length && ST.xp >= XPL[i + 1]) i++; const names = CFG.ranks || ["Starter", "Explorer", "Learner", "Scholar", "Expert", "Master", "Professor"]; return { n: i + 1, name: names[Math.min(i, names.length - 1)], lo: XPL[i], hi: XPL[i + 1] || XPL[i] + 1000 }; };

  /* ================= questions ================= */
  function bankQs(code) {
    return (CFG.bank[code] || []).map((row, i) => { const p = row.split("|").map((x) => x.trim()); return { id: code + ":" + i, topic: code, q: p[0], ans: p[1], opts: shuffle(p.slice(1, 5)), steps: p[5] ? [p[5]] : [] }; });
  }
  function themeQs(code, n) {
    if (!n) return []; let out = [];
    if (CFG.extraQs) { try { out = CFG.extraQs(code, n) || []; } catch (e) { out = []; } }
    else { const th = (CFG.themeOf && CFG.themeOf[code]) || [], EK = window.ExamKit; if (!th.length || !EK || !CFG.gens) return []; try { out = EK.make(CFG.gens, th, n, (Date.now() & 0xffffff) + 11, "p1"); } catch (e) { out = []; } }
    return out.map((q) => ({ id: "T:" + hash(q.q), topic: code, q: q.q, ans: q.ans, opts: q.opts.slice(), steps: (q.steps || []).slice(), unit: q.unit }));
  }
  function topicQs(code, n = 8) { const own = shuffle(bankQs(code)).slice(0, Math.max(5, n - 3)), extra = themeQs(code, n - own.length), seen = new Set(own.map((q) => q.q)); return own.concat(extra.filter((q) => !seen.has(q.q))); }
  function mixedQs(codes, n) { const out = [], used = new Set(); let guard = 0; while (out.length < n && guard++ < n * 30) { const c = codes[Math.floor(Math.random() * codes.length)], pool = bankQs(c); if (!pool.length) continue; const q = pool[Math.floor(Math.random() * pool.length)]; if (used.has(q.id)) continue; used.add(q.id); out.push(q); } return out; }
  function dailyQs() {
    const bag = []; allTopics().forEach((t) => { if (!(CFG.bank[t.code] || []).length) return; const b = best(t.code), seen = t.subtopics.some((s) => ST.seen[t.code + "-" + s.code]); const w = b >= 0 && b < 80 ? 4 : seen && b < 0 ? 3 : b < 0 ? 1 : 1; for (let i = 0; i < w; i++) bag.push(t.code); });
    const picks = []; let guard = 0; while (picks.length < 5 && guard++ < 400 && bag.length) { const c = bag[Math.floor(Math.random() * bag.length)]; if (!picks.includes(c)) picks.push(c); }
    return picks.map((c) => { const p = bankQs(c); return p[Math.floor(Math.random() * p.length)]; });
  }

  /* ================= scoring, mastery, badges ================= */
  const BADGES = [
    ["first", "🌱", "First steps", "Finish your first topic check", () => Object.keys(ST.topics).length >= 1],
    ["perfect", "💯", "Full marks", "Score 100 % in a topic check", () => Object.values(ST.topics).some((t) => t.best === 100)],
    ["five", "🖐", "High five", "Reach Secure in 5 topics", () => allTopics().filter((t) => level(t.code) >= 2).length >= 5],
    ["ten", "🏅", "Ten down", "Master 10 topics", () => allTopics().filter((t) => level(t.code) === 3).length >= 10],
    ["section", "🏆", "Section champion", "Reach Secure in every topic of one section", () => sections().some((s) => s.topics.length && s.topics.every((t) => level(t.code) >= 2))],
    ["q100", "🎯", "Century", "Answer 100 questions", () => ST.stats.answered >= 100],
    ["streak3", "🔥", "On a roll", "Daily five 3 days in a row", () => ST.daily.best >= 3],
    ["streak7", "⚡", "Unstoppable", "Daily five 7 days in a row", () => ST.daily.best >= 7],
    ["fixer", "🔧", "Mistake fixer", "Clear 10 mistakes from your notebook", () => ST.stats.fixed >= 10],
    ["cards", "🃏", "Card shark", "Review 50 flashcards", () => ST.stats.cards >= 50],
    ["explorer", "🧭", "Explorer", "Open 25 subtopics", () => Object.keys(ST.seen).length >= 25],
    ["matcher", "🔗", "Perfect match", "Finish Match it with no wrong pairs", () => !!(ST.games.match || {}).perfect],
    ["clock", "⏱", "Quick thinker", "Score 200 in Beat the clock", () => ((ST.games.clock || {}).best || 0) >= 200],
    ["sorter", "🗂", "Well sorted", "Finish Sort it with no wrong moves", () => !!(ST.games.sort || {}).perfect],
    ["finder", "🦅", "Eagle eye", "Find every part without a miss", () => !!(ST.games.parts || {}).perfect],
    ["labpro", "🧪", "Lab pro", "Solve 5 lab challenges", () => Object.keys(ST.chal).length >= 5],
  ];
  function award() { const got = []; BADGES.forEach(([id, ic, name, , test]) => { let ok = false; try { ok = test(); } catch (e) { ok = false; } if (ok && !ST.badges[id]) { ST.badges[id] = day(); got.push(ic + " " + name); } }); if (got.length) toast("Badge earned: " + got.join(", ")); return got; }
  function addXp(n) { const before = rank().n; ST.xp += Math.max(0, Math.round(n)); const after = rank(); if (after.n > before) toast("Level up: " + after.name + " (level " + after.n + ")"); }
  function noteAnswer(q, picked, ok) {
    ST.stats.answered++; if (ok) ST.stats.correct++;
    const i = ST.mistakes.findIndex((m) => m.id === q.id);
    if (!ok) { const m = { id: q.id, t: q.topic, q: q.q, a: q.ans, y: picked, o: q.opts, s: q.steps || [], d: day() }; if (i >= 0) ST.mistakes[i] = m; else ST.mistakes.unshift(m); if (ST.mistakes.length > 150) ST.mistakes.length = 150; }
    else if (i >= 0) { ST.mistakes.splice(i, 1); ST.stats.fixed++; }
  }
  function noteAttempt(code, score, n) {
    const p = pct(score, n), r = ST.topics[code] || (ST.topics[code] = { att: 0, best: 0, last: 0, when: "", hist: [] }), before = level(code);
    r.att++; r.last = p; r.best = Math.max(r.best, p); r.when = day(); r.hist.push([day(), p]); if (r.hist.length > 12) r.hist.shift();
    return { p, up: level(code) > before, lvl: level(code) };
  }

  /* ================= small UI pieces ================= */
  const COL = ["var(--lk-idle)", "var(--lk-warn)", "var(--lk-info)", "var(--lk-good)"];
  function ring(p, lvl, size = 40, label) {
    const r = size / 2 - 4, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, p < 0 ? 0 : p));
    return `<svg class="lk-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label || (p < 0 ? "Not started" : "Best score " + p + " per cent"))}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--lk-track)" stroke-width="4"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${COL[lvl]}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(c * v) / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${size * 0.28}" font-weight="700" fill="currentColor">${p < 0 ? "–" : p}</text></svg>`;
  }
  LK.ring = (code, size) => ring(best(code), level(code), size || 34, (topic(code) || {}).title + ": " + LEVELS[level(code)][1]);
  let toastT = 0;
  function toast(msg) { let t = $("#lk-toast"); if (!t) { t = document.createElement("div"); t.id = "lk-toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); } t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 4200); }
  function confetti(host) { if (reduced() || !host) return; const box = document.createElement("div"); box.className = "lk-confetti"; box.setAttribute("aria-hidden", "true"); for (let i = 0; i < 26; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = ["#ffd27a", "#5bd68c", "#7fb6ff", "#ff8fa3", "#c3a9ed"][i % 5]; s.style.animationDelay = Math.random() * 0.5 + "s"; s.style.animationDuration = 1.4 + Math.random() * 1.2 + "s"; box.appendChild(s); } host.appendChild(box); setTimeout(() => box.remove(), 3200); }

  /* sheet: a full-screen dialog used by checks, games and printouts */
  let sheet = null, lastFocus = null, onClose = null, backTo = null;
  function openSheet(title, bodyHtml, o = {}) {
    const prev = sheet ? sheet.dataset.page : ""; closeSheet(true); lastFocus = document.activeElement; if (o.page) backTo = null; else if (prev) backTo = prev;
    sheet = document.createElement("div"); sheet.dataset.page = o.page || ""; sheet.className = "lk-sheet" + (o.wide ? " wide" : ""); sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", title);
    sheet.innerHTML = `<div class="lk-sheet-in lk"><div class="lk-sheet-top"><span class="lk-badge">${esc(o.tag || CFG.subject)}</span><h2>${esc(title)}</h2><span class="lk-sp"></span>${o.print ? '<button type="button" class="lk-btn" data-lk="print">🖨 Print</button>' : ""}<button type="button" class="lk-btn ghost" data-lk="close" aria-label="Close">✕ Close</button></div><div class="lk-sheet-body">${bodyHtml}</div></div>`;
    document.body.appendChild(sheet); document.body.classList.add("lk-lock"); onClose = o.onClose || null;
    const f = $("[data-auto]", sheet) || $("button:not([data-lk=close])", sheet) || $("[data-lk=close]", sheet); if (f) f.focus();
    return $(".lk-sheet-body", sheet);
  }
  function closeSheet(silent) { if (!sheet) return; const cb = onClose; onClose = null; try { cb && cb(); } catch (e) { /* ignore */ } sheet.remove(); sheet = null; document.body.classList.remove("lk-lock"); if (!silent) { const b = backTo; backTo = null; if (b && CFG.dock) return LK.openPage(b); if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); CFG.rerender && CFG.rerender(); } }
  function refresh() { if (sheet && sheet.dataset.page) LK.render($(".lk-sheet-body", sheet), sheet.dataset.page); CFG.rerender && CFG.rerender(); }
  LK.close = closeSheet;

  /* ================= quiz runner (topic check, daily five, retry mistakes) ================= */
  function runQuiz(o) {
    const qs = o.qs; if (!qs.length) { toast("No questions are available for this yet."); return; }
    const body = openSheet(o.title, "", { tag: o.tag });
    let i = 0, score = 0, locked = false; const wrong = [];
    const show = () => {
      const q = qs[i]; locked = false;
      body.innerHTML = `<div class="lk-qz"><div class="lk-prog" aria-hidden="true"><span style="width:${(i / qs.length) * 100}%"></span></div>
        <div class="lk-qmeta"><span>Question ${i + 1} of ${qs.length}</span><span>${esc((topic(q.topic) || {}).title || "")}</span><span class="lk-sp"></span><span>Score ${score}</span></div>
        <p class="lk-q" id="lk-q">${esc(q.q)}</p>
        <div class="lk-opts" role="group" aria-labelledby="lk-q">${q.opts.map((t, k) => `<button type="button" class="lk-opt" data-k="${k}"${k === 0 ? " data-auto" : ""}><b>${"ABCD"[k]}</b><span>${esc(t)}${q.unit && /^[-\d.,\s×⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(t) ? " " + esc(q.unit) : ""}</span></button>`).join("")}</div>
        <div class="lk-fb" aria-live="polite"></div></div>`;
      const first = $(".lk-opt", body); if (first) first.focus();
    };
    const pick = (k) => {
      if (locked) return; locked = true; const q = qs[i], picked = q.opts[k], ok = picked === q.ans; if (ok) score++; else wrong.push(q);
      noteAnswer(q, picked, ok);
      $$(".lk-opt", body).forEach((b, j) => { b.disabled = true; if (q.opts[j] === q.ans) b.classList.add("ok"); else if (j === k) b.classList.add("bad"); });
      const lastQ = i === qs.length - 1;
      $(".lk-fb", body).innerHTML = `<div class="lk-verdict ${ok ? "ok" : "bad"}">${ok ? "✓ Correct" : "✗ Not quite — the answer is " + esc(q.ans)}</div>${(q.steps || []).length ? `<ul class="lk-steps">${q.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}<button type="button" class="lk-btn primary" data-next>${lastQ ? "See my result" : "Next question →"}</button>`;
      $("[data-next]", body).focus(); save();
    };
    const finish = () => {
      const n = qs.length; let extra = "", xp = score * 10;
      if (o.kind === "topic") { const r = noteAttempt(o.topic, score, n); if (r.p === 100) xp += 20; extra = `<p class="lk-note">${r.up ? "Mastery level up: <b>" + LEVELS[r.lvl][1] + "</b>. " : ""}Best for this topic: <b>${best(o.topic)} %</b> · attempts: ${rec(o.topic).att}. ${r.p >= 80 ? "Mastered — move to the next topic or try a lab game." : r.p >= 50 ? "Secure. Score 80 % or more to master it." : "Go through the notes and the simulation again, then retry."}</p>`; }
      if (o.kind === "daily") { const t = day(), d = ST.daily; if (d.last !== t) { d.streak = d.last === addDays(t, -1) ? d.streak + 1 : 1; d.best = Math.max(d.best, d.streak); d.last = t; d.total++; d.days.push(t); if (d.days.length > 60) d.days.shift(); xp += 15; } extra = `<p class="lk-note">Daily five done. Streak: <b>${d.streak} day${d.streak === 1 ? "" : "s"}</b> 🔥 — come back tomorrow to keep it going.</p>`; }
      if (o.kind === "mistakes") extra = `<p class="lk-note">${score} mistake${score === 1 ? "" : "s"} cleared from your notebook. ${ST.mistakes.length} left.</p>`;
      addXp(xp); award(); save();
      const p = pct(score, n);
      body.innerHTML = `<div class="lk-result"><div class="lk-big">${ring(p, p >= 80 ? 3 : p >= 50 ? 2 : 1, 120)}</div><h3>${score} out of ${n} correct</h3><p class="lk-xp">+${xp} XP · ${rank().name}, level ${rank().n}</p>${extra}
        ${wrong.length ? `<details class="lk-rev" open><summary>Review ${wrong.length} missed question${wrong.length > 1 ? "s" : ""} (saved to your mistake notebook)</summary>${wrong.map((q) => `<div class="lk-miss"><p>${esc(q.q)}</p><div><b>Answer:</b> ${esc(q.ans)}</div>${(q.steps || []).map((s) => `<div class="lk-dim">${esc(s)}</div>`).join("")}</div>`).join("")}</details>` : `<p class="lk-note">No mistakes. Well done.</p>`}
        <div class="lk-row">${o.again ? '<button type="button" class="lk-btn primary" data-again>Try again with new questions</button>' : ""}<button type="button" class="lk-btn" data-lk="close">Done</button></div></div>`;
      if (p >= 80) confetti($(".lk-sheet-in", sheet));
      const a = $("[data-again]", body); if (a) { a.addEventListener("click", () => runQuiz(Object.assign({}, o, { qs: o.again() }))); a.focus(); }
    };
    body.addEventListener("click", (e) => { const b = e.target.closest(".lk-opt"); if (b) return pick(+b.dataset.k); if (e.target.closest("[data-next]")) { i++; if (i >= qs.length) finish(); else show(); } });
    body.addEventListener("keydown", (e) => { const k = "abcd".indexOf(e.key.toLowerCase()); const n = k >= 0 ? k : "1234".indexOf(e.key); if (n >= 0 && !locked && n < qs[i].opts.length) { e.preventDefault(); pick(n); } });
    show();
  }
  LK.check = (code) => { const t = topic(code); if (!t) return; runQuiz({ title: "Check yourself — " + t.title, tag: "Topic " + (t.num || t.code), kind: "topic", topic: code, qs: topicQs(code), again: () => topicQs(code) }); };
  LK.daily = () => runQuiz({ title: "Daily five", tag: "Practice", kind: "daily", qs: dailyQs() });
  LK.retry = () => runQuiz({ title: "Retry my mistakes", tag: "Practice", kind: "mistakes", qs: shuffle(ST.mistakes.slice(0, 40)).slice(0, 10).map((m) => ({ id: m.id, topic: m.t, q: m.q, ans: m.a, opts: shuffle((m.o || [m.a]).slice()), steps: m.s || [] })) });

  /* ================= flashcards (five boxes, spaced out) ================= */
  let CARDS = null;
  /* Every card asks a full, self-contained question. Cards come from three places:
     the topic question bank (the stem becomes the question, the correct option the answer),
     definitions in the syllabus notes, and each subject's own formula and fact cards. */
  const lc1 = (t) => (/^[A-Z][a-z]/.test(t) && !/^[A-Z][\w.]*['’]s?\s/.test(t) && !/^[A-Z][a-z]+ [A-Z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
  const the = (t) => (/^(the|a|an|one|d\/dx|∫|sin|cos|tan|log|p\(|ⁿ|\(|[A-Z][\w.]*['’]s?\s)/i.test(t) ? t : "the " + t);
  const askOwn = (front0, back) => {
    if (/\?$/.test(front0)) return front0;
    const front = front0.replace(/\.$/, (m) => (/\b[A-Za-z]\.[A-Za-z]\.$/.test(front0) ? m : ""));
    if (/^[A-Z]{2,}( [A-Z]{2,})+$/.test(front)) return "What does “" + front + "” stand for?";
    if (/ process$/i.test(front)) return "Describe the " + front + ".";
    if (/^[a-z ]+ and [a-z ]+$/i.test(front) && !/formula|equation/i.test(front) && /=/.test(back)) return "How are " + lc1(front) + " related?";
    if (/^test for /i.test(front)) return "What is the " + lc1(front) + "?";
    if (/\b(law|principle|rule|theorem|equation|equations|constant|formula|relation)\b/i.test(front)) return "State " + the(lc1(front)) + ".";
    if (/^(\S*[(ⁿ]|log\b|d\/dx|∫|sin|cos|tan)/.test(front)) return "What is " + front + (/,/.test(front) ? "," : "") + " equal to?";
    if (!/[→;]/.test(back) && ((/[=∝√π×÷₀-₉⁰-⁹⅓½⅔+−\/Σ!^]|\d/.test(back) && back.length < 80) || /^\S{1,8}$/.test(back))) return "What is the formula for " + (/ of /.test(front) ? the(lc1(front)) : lc1(front)) + "?";
    return "What is meant by “" + lc1(front) + "”?";
  };
  const stem = (q) => (/[?.]$/.test(q) ? q : /____/.test(q) ? q + "." : q + " ____.");
  const needsOptions = (q) => /^which (of|one|statement|gas diffuses|radiation|metal|fish)\b|which of (these|the following)|of the following|\bthese\b.*\?$/i.test(q);
  const cap = (t) => (/^[a-z]{4,}\b/.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  function cards() {
    if (CARDS) return CARDS; CARDS = [];
    allTopics().forEach((t) => {
      t.subtopics.forEach((st) => (st.content || []).forEach((line, i) => { const k = line.indexOf(": "); if (k < 3 || k > 40) return; const front = line.slice(0, k), back = line.slice(k + 2).trim(); if (!/^(the|a|an|any)\s[a-z]/i.test(back) || back.length < 25 || /[;]/.test(back) || /[(,]/.test(front)) return; CARDS.push({ id: t.code + "-" + st.code + "-" + i, t: t.code, front, back: back.charAt(0).toUpperCase() + back.slice(1), q: "What is meant by “" + lc1(front) + "”?" }); }));
      (CFG.bank[t.code] || []).forEach((row, i) => { const p = row.split("|").map((x) => x.trim()); if (needsOptions(p[0])) return; CARDS.push({ id: "q:" + t.code + ":" + i, t: t.code, front: p[0], back: cap(p[1]), note: p[5] || "", q: stem(p[0]) }); });
      ((CFG.cards || {})[t.code] || []).forEach((row, i) => { const k = row.split("|"), front = k[0].trim(), back = (k[1] || "").trim(); CARDS.push({ id: t.code + "-x" + i, t: t.code, front, back: cap(back), q: askOwn(front, back) }); });
    });
    return CARDS;
  }
  const GAP = [0, 1, 2, 4, 8, 16];
  const due = (c) => { const s = ST.cards[c.id]; return !s || s.due <= day(); };
  function runCards(code) {
    const pool = cards().filter((c) => (!code || c.t === code)), deck = shuffle(pool.filter(due)).slice(0, 12);
    const t = code && topic(code); const title = "Flashcards" + (t ? " — " + t.title : "");
    if (!pool.length) { toast("No flashcards for this topic yet."); return; }
    if (!deck.length) { openSheet(title, `<div class="lk-result"><h3>Nothing due today</h3><p class="lk-note">You have reviewed every card in this set. They come back at wider gaps (1, 2, 4, 8 and 16 days) so you remember them for the exam.</p><div class="lk-row"><button type="button" class="lk-btn" data-lk="close">Done</button></div></div>`, { tag: "Practice" }); return; }
    const body = openSheet(title, "", { tag: "Practice" }); let i = 0, good = 0, flipped = false;
    const show = () => { const c = deck[i]; flipped = false; body.innerHTML = `<div class="lk-qz"><div class="lk-prog" aria-hidden="true"><span style="width:${(i / deck.length) * 100}%"></span></div><div class="lk-qmeta"><span>Card ${i + 1} of ${deck.length}</span><span>${esc((topic(c.t) || {}).title || "")}</span><span class="lk-sp"></span><span>Box ${(ST.cards[c.id] || { b: 1 }).b} of 5</span></div>
      <button type="button" class="lk-card" data-flip data-auto aria-live="polite"><span class="lk-card-k">Question</span><span class="lk-card-f">${esc(c.q)}</span><span class="lk-card-hint">Think of your answer, then tap the card to check it</span></button><div class="lk-row" data-rate hidden><button type="button" class="lk-btn" data-rate-v="0">↺ Again</button><button type="button" class="lk-btn primary" data-rate-v="1">✓ I knew it</button></div></div>`; $("[data-flip]", body).focus(); };
    body.addEventListener("click", (e) => {
      const c = deck[i];
      if (e.target.closest("[data-flip]") && !flipped) { flipped = true; const b = $("[data-flip]", body); b.classList.add("back"); b.innerHTML = `<span class="lk-card-q">${esc(c.q)}</span><span class="lk-card-k">Answer</span><span class="lk-card-b">${esc(c.back)}</span>${c.note ? `<span class="lk-card-q">${esc(c.note)}</span>` : ""}`; $("[data-rate]", body).hidden = false; $("[data-rate-v='1']", body).focus(); return; }
      const r = e.target.closest("[data-rate-v]"); if (!r) return; const ok = r.dataset.rateV === "1", s = ST.cards[c.id] || { b: 1, due: day() };
      s.b = ok ? Math.min(5, s.b + 1) : 1; s.due = addDays(day(), ok ? GAP[s.b] : 0); ST.cards[c.id] = s; ST.stats.cards++; if (ok) good++; i++; save();
      if (i < deck.length) return show();
      addXp(good * 3); award(); save();
      body.innerHTML = `<div class="lk-result"><h3>${good} of ${deck.length} known</h3><p class="lk-xp">+${good * 3} XP</p><p class="lk-note">Cards you knew move up a box and return later. Cards marked Again come back today.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-more>More cards</button><button type="button" class="lk-btn" data-lk="close">Done</button></div></div>`;
      $("[data-more]", body).addEventListener("click", () => runCards(code));
    });
    show();
  }
  LK.cards = runCards;

  /* ================= games ================= */
  const gameRec = (id) => ST.games[id] || (ST.games[id] = { plays: 0, best: 0 });
  function endGame(id, body, score, lines, o = {}) {
    const g = gameRec(id), was = g.best; g.plays++; g.best = Math.max(g.best, score); if (o.perfect) g.perfect = true; const xp = Math.round(Math.max(5, o.xp != null ? o.xp : score / 5)); addXp(xp); award(); save();
    body.innerHTML = `<div class="lk-result"><div class="lk-score">${score}</div><h3>${score > was && g.plays > 1 ? "New best score!" : o.head || "Round over"}</h3><p class="lk-xp">+${xp} XP · best ${g.best}</p>${lines.map((l) => `<p class="lk-note">${l}</p>`).join("")}<div class="lk-row"><button type="button" class="lk-btn primary" data-replay data-auto>Play again</button><button type="button" class="lk-btn" data-lk="close">Done</button></div></div>`;
    if (score > was) confetti($(".lk-sheet-in", sheet)); $("[data-replay]", body).addEventListener("click", () => GAMES[id].run()); $("[data-replay]", body).focus();
  }
  /* --- Beat the clock: two minutes, streak multiplier --- */
  function gameClock() {
    const codes = allTopics().map((t) => t.code).filter((c) => (CFG.bank[c] || []).length); let pool = shuffle(mixedQs(codes, 60));
    const body = openSheet("Beat the clock", "", { tag: "Lab game", onClose: () => clearInterval(tm) });
    let left = 120, score = 0, streak = 0, bestStreak = 0, n = 0, right = 0, i = 0, locked = false, tm = 0;
    const mult = () => Math.min(5, 1 + Math.floor(streak / 3));
    const hud = () => { const h = $(".lk-clock", body); if (h) h.innerHTML = `<span class="lk-time${left <= 15 ? " low" : ""}">⏱ ${Math.floor(left / 60)}:${pad(left % 60)}</span><span>Score <b>${score}</b></span><span>Streak <b>${streak}</b> · ×${mult()}</span>`; };
    const show = () => { if (i >= pool.length) { pool = shuffle(mixedQs(codes, 60)); i = 0; } const q = pool[i]; locked = false; $(".lk-stage", body).innerHTML = `<p class="lk-q">${esc(q.q)}</p><div class="lk-opts two">${q.opts.map((t, k) => `<button type="button" class="lk-opt" data-k="${k}"><b>${"ABCD"[k]}</b><span>${esc(t)}</span></button>`).join("")}</div>`; const f = $(".lk-opt", body); if (f) f.focus(); };
    const stop = () => { clearInterval(tm); endGame("clock", body, score, [`${right} of ${n} correct · longest streak ${bestStreak}.`, "Three correct in a row raises the multiplier, up to ×5. A wrong answer resets it."]); };
    body.innerHTML = `<div class="lk-qz"><div class="lk-clock"></div><div class="lk-stage"><p class="lk-note">Two minutes. Answer as many as you can. Every 3 correct in a row raises your multiplier.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-go data-auto>Start</button></div></div></div>`;
    hud(); $("[data-go]", body).focus();
    body.addEventListener("click", (e) => {
      if (e.target.closest("[data-go]")) { tm = setInterval(() => { left--; hud(); if (left <= 0) stop(); }, 1000); show(); return; }
      const b = e.target.closest(".lk-opt"); if (!b || locked) return; locked = true; const q = pool[i], picked = q.opts[+b.dataset.k], ok = picked === q.ans; n++;
      noteAnswer(q, picked, ok); if (ok) { right++; score += 10 * mult(); streak++; bestStreak = Math.max(bestStreak, streak); } else streak = 0;
      $$(".lk-opt", body).forEach((x, j) => { x.disabled = true; if (q.opts[j] === q.ans) x.classList.add("ok"); else if (x === b) x.classList.add("bad"); }); hud(); i++; setTimeout(() => { if (left > 0 && sheet) show(); }, ok ? 420 : 1300);
    });
    body.addEventListener("keydown", (e) => { const k = "abcd".indexOf(e.key.toLowerCase()), b = $$(".lk-opt", body)[k >= 0 ? k : "1234".indexOf(e.key)]; if (b && !locked) { e.preventDefault(); b.click(); } });
  }
  /* --- Sort it, then odd one out --- */
  function gameSort() {
    const sets = CFG.sorts || []; if (!sets.length) return toast("No sorting sets yet.");
    const set = sets[Math.floor(Math.random() * sets.length)], bins = Object.keys(set.bins);
    let items = shuffle([].concat(...bins.map((b) => shuffle(set.bins[b].slice()).slice(0, 4).map((t) => ({ t, b }))))), sel = null, wrongN = 0, done = 0, t0 = Date.now();
    const body = openSheet("Sort it", "", { tag: "Lab game", wide: true });
    const draw = () => { body.innerHTML = `<div class="lk-qz"><div class="lk-qmeta"><span>${esc(set.title)}</span><span class="lk-sp"></span><span>${done} of ${items.length} placed · ${wrongN} wrong</span></div><p class="lk-note">Tap an item, then tap the group it belongs to. You can also drag it.</p>
      <div class="lk-chips" role="group" aria-label="Items to sort">${items.map((it, k) => (it.done ? "" : `<button type="button" class="lk-chip${sel === k ? " sel" : ""}" draggable="true" data-it="${k}" aria-pressed="${sel === k}">${esc(it.t)}</button>`)).join("")}</div>
      <div class="lk-bins" style="--n:${bins.length}">${bins.map((b) => `<button type="button" class="lk-bin" data-bin="${esc(b)}"><b>${esc(b)}</b><span>${items.filter((it) => it.done && it.b === b).map((it) => `<i>${esc(it.t)}</i>`).join("")}</span></button>`).join("")}</div></div>`; };
    const place = (k, b, el) => { const it = items[k]; if (!it || it.done) return; if (it.b === b) { it.done = true; done++; sel = null; if (done === items.length) return odd(); draw(); } else { wrongN++; sel = null; draw(); const bn = $$(".lk-bin", body).find((x) => x.dataset.bin === b); if (bn) { bn.classList.add("no"); setTimeout(() => bn.classList.remove("no"), 500); } toast(it.t + " does not belong in " + b + "."); } };
    body.addEventListener("click", (e) => { const c = e.target.closest("[data-it]"); if (c) { sel = sel === +c.dataset.it ? null : +c.dataset.it; draw(); return; } const b = e.target.closest("[data-bin]"); if (b && sel != null) place(sel, b.dataset.bin); else if (b) toast("Pick an item first."); });
    body.addEventListener("dragstart", (e) => { const c = e.target.closest("[data-it]"); if (c) e.dataTransfer.setData("text/plain", c.dataset.it); });
    body.addEventListener("dragover", (e) => { if (e.target.closest("[data-bin]")) e.preventDefault(); });
    body.addEventListener("drop", (e) => { const b = e.target.closest("[data-bin]"); if (!b) return; e.preventDefault(); place(+e.dataTransfer.getData("text/plain"), b.dataset.bin); });
    /* bonus round: five odd-one-outs made from every set */
    function odd() {
      const secs = Math.round((Date.now() - t0) / 1000), base = Math.max(10, items.length * 10 - wrongN * 5); let r = 0, got = 0; const rounds = [];
      for (let k = 0; k < 5; k++) { const s2 = sets[Math.floor(Math.random() * sets.length)], bs = shuffle(Object.keys(s2.bins)); if (bs.length < 2 || s2.bins[bs[0]].length < 3) continue; const three = shuffle(s2.bins[bs[0]].slice()).slice(0, 3), one = s2.bins[bs[1]][Math.floor(Math.random() * s2.bins[bs[1]].length)]; rounds.push({ opts: shuffle(three.concat([one])), one, why: `${one} is ${bs[1].toLowerCase()}; the others are ${bs[0].toLowerCase()}.` }); }
      const showOdd = () => { const R = rounds[r]; body.innerHTML = `<div class="lk-qz"><div class="lk-qmeta"><span>Bonus: odd one out · ${r + 1} of ${rounds.length}</span><span class="lk-sp"></span><span>${got} correct</span></div><p class="lk-q">Which one does not belong with the others?</p><div class="lk-opts two">${R.opts.map((t, k) => `<button type="button" class="lk-opt" data-odd="${k}"><b>${"ABCD"[k]}</b><span>${esc(t)}</span></button>`).join("")}</div><div class="lk-fb" aria-live="polite"></div></div>`; $(".lk-opt", body).focus(); };
      const fin = () => endGame("sort", body, base + got * 10, [`Sorted ${items.length} items in ${secs} s with ${wrongN} wrong move${wrongN === 1 ? "" : "s"}.`, `Odd one out: ${got} of ${rounds.length}.`], { perfect: wrongN === 0 });
      if (!rounds.length) return fin();
      body.onclick = (e) => { const b = e.target.closest("[data-odd]"); if (b && !b.disabled) { const R = rounds[r], ok = R.opts[+b.dataset.odd] === R.one; if (ok) got++; $$(".lk-opt", body).forEach((x, j) => { x.disabled = true; if (R.opts[j] === R.one) x.classList.add("ok"); else if (x === b) x.classList.add("bad"); }); $(".lk-fb", body).innerHTML = `<div class="lk-verdict ${ok ? "ok" : "bad"}">${ok ? "✓ " : "✗ "}${esc(R.why)}</div><button type="button" class="lk-btn primary" data-onext>${r === rounds.length - 1 ? "Finish" : "Next →"}</button>`; $("[data-onext]", body).focus(); } else if (e.target.closest("[data-onext]")) { r++; if (r >= rounds.length) { body.onclick = null; fin(); } else showOdd(); } };
      showOdd();
    }
    draw();
  }
  /* --- Lab challenge: reach a target in a real simulation --- */
  const num = (v) => parseFloat(String(v).replace(/[^\d.\-]/g, ""));
  function listChallenges() {
    const L = chalList();
    const body = openSheet("Lab challenge", `<p class="lk-note">Each challenge opens a real simulation. Change the controls until you hit the target. Fewer moves and less time earn more stars.</p><div class="lk-grid">${L.map((c, i) => `<button type="button" class="lk-tile" data-ch="${i}"><span class="lk-stars" aria-label="${(ST.chal[c.id] || 0)} of 3 stars">${"★".repeat(ST.chal[c.id] || 0)}${"☆".repeat(3 - (ST.chal[c.id] || 0))}</span><b>${esc(c.title)}</b><span>${esc(c.goal)}</span></button>`).join("")}</div>`, { tag: "Lab game", wide: true });
    body.addEventListener("click", (e) => { const b = e.target.closest("[data-ch]"); if (b) { const ch = L[+b.dataset.ch]; if (ch.page) runPageChallenge(ch); else runChallenge(ch); } });
  }
  const chalList = () => (CFG.challenges || []).filter((c) => (c.page ? !!CFG.live && (!CFG.hasChallenge || CFG.hasChallenge(c)) : window.MK && MK.has && MK.has(c.key)));
  /* a challenge played on the lab's own simulation, with a floating target banner */
  let liveIv = 0;
  function stopLive(remove) { clearInterval(liveIv); liveIv = 0; if (remove) { const b = $("#lk-chal"); if (b) b.remove(); } }
  function runPageChallenge(ch) {
    backTo = null; closeSheet(true); stopLive(true);
    try { CFG.openChallenge(ch); } catch (e) { toast("This simulation could not open."); return; }
    const bar = document.createElement("div"); bar.id = "lk-chal"; bar.className = "lk"; bar.setAttribute("role", "status");
    bar.innerHTML = `<div class="lk-chal-top"><span class="lk-badge">Lab challenge</span><b>${esc(ch.title)}</b><span class="lk-sp"></span><span class="lk-live">0 moves · 0 s</span><button type="button" class="lk-btn sm" data-lk="chquit">Quit</button></div><div class="lk-chal-goal">${esc(ch.goal)}</div>${ch.hint ? `<details class="lk-hint"><summary>Need a hint?</summary>${esc(ch.hint)}</details>` : ""}`;
    document.body.appendChild(bar);
    let moves = 0, snap = null; const t0 = Date.now(); try { const L0 = CFG.live(); if (L0) snap = JSON.stringify(L0.c); } catch (e) { snap = null; }
    liveIv = setInterval(() => {
      let L = null; try { L = CFG.live(); } catch (e) { L = null; } if (!L) return; const now = JSON.stringify(L.c); if (snap === null) snap = now; else if (now !== snap) { snap = now; moves++; }
      const secs = Math.round((Date.now() - t0) / 1000); const lv = $(".lk-live", bar); if (lv) lv.textContent = `${moves} move${moves === 1 ? "" : "s"} · ${secs} s`;
      let ok = false; try { ok = !!ch.ok(L.R, L.c, num); } catch (e) { ok = false; }
      if (ok && moves > 0) { stopLive(false); const stars = secs <= (ch.par || 60) && moves <= (ch.moves || 8) ? 3 : secs <= (ch.par || 60) * 2.5 ? 2 : 1, first = !ST.chal[ch.id]; ST.chal[ch.id] = Math.max(ST.chal[ch.id] || 0, stars); addXp(first ? 20 + stars * 10 : stars * 3); award(); save();
        bar.classList.add("won"); bar.innerHTML = `<div class="lk-chal-top"><span class="lk-badge">Solved!</span><b>${"★".repeat(stars)}${"☆".repeat(3 - stars)} ${esc(ch.title)}</b><span class="lk-sp"></span><button type="button" class="lk-btn sm primary" data-lk="chlist">More challenges</button><button type="button" class="lk-btn sm" data-lk="chquit">Close</button></div><div class="lk-chal-goal">${moves} move${moves === 1 ? "" : "s"} in ${secs} s${ch.why ? " — " + esc(ch.why) : ""}</div>`; confetti(bar); CFG.rerender && CFG.rerender(); }
    }, 350);
  }
  /* --- Match it: pair each item with its partner --- */
  function gameMatch() {
    const sets = CFG.pairs || []; if (!sets.length) return toast("No matching sets yet.");
    const set = sets[Math.floor(Math.random() * sets.length)], pick = shuffle(set.pairs.slice()).slice(0, 6), left = shuffle(pick.map((p, i) => ({ t: p[0], i }))), right = shuffle(pick.map((p, i) => ({ t: p[1], i })));
    const done = new Set(); let selL = null, miss = 0; const t0 = Date.now();
    const body = openSheet("Match it", "", { tag: "Lab game", wide: true });
    const draw = (bad) => { body.innerHTML = `<div class="lk-qz"><div class="lk-qmeta"><span>${esc(set.title)}</span><span class="lk-sp"></span><span>${done.size} of ${pick.length} matched · ${miss} wrong</span></div><p class="lk-note">Tap an item on the left, then its partner on the right.</p><div class="lk-match"><div>${left.map((x) => `<button type="button" class="lk-opt${done.has(x.i) ? " ok" : ""}${selL === x.i ? " sel" : ""}" data-l="${x.i}" ${done.has(x.i) ? "disabled" : ""} aria-pressed="${selL === x.i}"><span>${esc(x.t)}</span></button>`).join("")}</div><div>${right.map((x) => `<button type="button" class="lk-opt${done.has(x.i) ? " ok" : ""}${bad === x.i ? " bad" : ""}" data-r="${x.i}" ${done.has(x.i) ? "disabled" : ""}><span>${esc(x.t)}</span></button>`).join("")}</div></div></div>`; };
    body.addEventListener("click", (e) => { const l = e.target.closest("[data-l]"), r = e.target.closest("[data-r]"); if (l) { selL = +l.dataset.l; draw(); return; } if (!r) return; if (selL == null) return toast("Pick an item on the left first."); const k = +r.dataset.r;
      if (k === selL) { done.add(k); selL = null; if (done.size === pick.length) { const secs = Math.round((Date.now() - t0) / 1000); return endGame("match", body, Math.max(10, pick.length * 15 - miss * 5 - Math.floor(secs / 3)), [`Matched ${pick.length} pairs in ${secs} s with ${miss} wrong.`, pick.map((p) => esc(p[0]) + " → " + esc(p[1])).join(" · ")], { perfect: miss === 0 }); } draw(); }
      else { miss++; draw(k); } });
    draw();
  }
  function runChallenge(ch) {
    let iv = 0, H = null, moves = 0, snap = "", t0 = Date.now(), won = false;
    const stop = () => { clearInterval(iv); try { if (H && H.S && window.MK && MK.unmount3d) MK.unmount3d(); } catch (e) { /* ignore */ } };
    const body = openSheet(ch.title, `<div class="lk-goal"><b>Target</b><span>${esc(ch.goal)}</span><span class="lk-sp"></span><span class="lk-live">0 moves · 0 s</span></div>${ch.hint ? `<details class="lk-hint"><summary>Need a hint?</summary>${esc(ch.hint)}</details>` : ""}<div class="sim-panel lk-sim"></div><div class="lk-row"><button type="button" class="lk-btn" data-back>← All challenges</button></div>`, { tag: "Lab challenge", wide: true, onClose: stop });
    const panel = $(".lk-sim", body); try { MK.mount(panel, ch.key); } catch (e) { panel.innerHTML = '<div class="sim-error">This simulation could not load.</div>'; return; }
    H = panel._mk; if (ch.start) { Object.assign(H.c, ch.start); H.refresh && H.refresh(); H.onCh && H.onCh("_reset"); } snap = JSON.stringify(H.c);
    $("[data-back]", body).addEventListener("click", () => { stop(); listChallenges(); });
    iv = setInterval(() => {
      if (!sheet || won) return; const now = JSON.stringify(H.c); if (now !== snap) { snap = now; moves++; }
      const secs = Math.round((Date.now() - t0) / 1000); $(".lk-live", body).textContent = `${moves} move${moves === 1 ? "" : "s"} · ${secs} s`;
      let ok = false; try { const R = {}; (H.sc.readouts(H.s, H.c) || []).forEach(([l, v]) => (R[l] = v)); ok = !!ch.ok(R, H.c, num); } catch (e) { ok = false; }
      if (ok && moves > 0) { won = true; clearInterval(iv); const stars = secs <= (ch.par || 60) && moves <= (ch.moves || 8) ? 3 : secs <= (ch.par || 60) * 2.5 ? 2 : 1; const first = !ST.chal[ch.id]; ST.chal[ch.id] = Math.max(ST.chal[ch.id] || 0, stars); addXp(first ? 20 + stars * 10 : stars * 3); award(); save();
        const g = $(".lk-goal", body); g.classList.add("won"); g.innerHTML = `<b>Solved!</b><span>${"★".repeat(stars)}${"☆".repeat(3 - stars)} · ${moves} move${moves === 1 ? "" : "s"} in ${secs} s${ch.why ? " — " + esc(ch.why) : ""}</span>`; confetti($(".lk-sheet-in", sheet)); toast("Challenge solved: " + ch.title); }
    }, 350);
  }
  /* --- Find the part: numbered markers on a 3D model --- */
  function gameParts() {
    const P = CFG.parts, MODS = ((P && P.models) || []).filter((m) => window.MK && MK.has && MK.has(m.key)); if (!MODS.length) return toast("This game needs the 3D lab.");
    let raf = 0, H = null, round = null, model = MODS[0];
    const stop = () => { cancelAnimationFrame(raf); try { window.MK && MK.unmount3d && MK.unmount3d(); } catch (e) { /* ignore */ } };
    const body = openSheet("Find the part", `<div class="lk-goal"><b>Model</b><span class="lk-seg">${MODS.map((m, k) => `<button type="button" class="lk-chip${k === 0 ? " sel" : ""}" data-model="${k}" aria-pressed="${k === 0}">${esc(m.label)}</button>`).join("")}</span></div><div class="lk-ask" aria-live="polite">Loading the 3D model…</div><div class="lk-partwrap"><div class="sim-panel lk-sim"></div><div class="lk-marks"></div></div><p class="lk-note">Drag to turn the model: some parts hide behind others. Tap the numbered marker for the part named above.</p>`, { tag: "Lab game", wide: true, onClose: stop });
    const panel = $(".lk-sim", body), marks = $(".lk-marks", body), ask = $(".lk-ask", body);
    const start = () => {
      stop(); round = null; marks.innerHTML = ""; ask.textContent = "Loading the 3D model…"; try { MK.mount(panel, model.key); } catch (e) { ask.textContent = "The 3D model could not load."; return; }
      H = panel._mk; Object.assign(H.c, model.set || {}); H.refresh && H.refresh(); const pb = $(".mk-poster button", panel); if (pb) pb.click(); else { ask.textContent = "This game needs WebGL, which this browser has switched off."; return; }
      const loop = () => {
        raf = requestAnimationFrame(loop); const S = H.S; if (!S || !S.proj) return; let pts = null; if (!round) { try { pts = P.pts(H.s, H.c, model); } catch (e) { pts = null; } if (!pts || pts.length < 3) return; }
        if (!round) { const pick = shuffle(pts.slice()).slice(0, Math.min(8, pts.length)); round = { pick, order: shuffle(pick.slice()), i: 0, miss: 0, t0: Date.now() }; marks.innerHTML = pick.map((p, k) => `<button type="button" class="lk-mark" data-m="${k}" aria-label="Marker ${k + 1}">${k + 1}</button>`).join(""); ask.innerHTML = `Find: <b>${esc(round.order[0].name)}</b> <span class="lk-dim">1 of ${pick.length}</span>`; }
        const st = $(".mk-stage", panel); if (marks.parentNode !== st) st.appendChild(marks); const w = st.clientWidth, h = st.clientHeight; $$(".lk-mark", marks).forEach((b, k) => { let q = null; try { q = S.proj(round.pick[k].pos()); } catch (e) { q = null; } if (!q || q.behind || !isFinite(q.x)) { b.style.display = "none"; return; } b.style.display = ""; b.style.left = (q.x / 640) * w + "px"; b.style.top = (q.y / 400) * h + "px"; });
      };
      loop();
    };
    marks.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b || !round || b.classList.contains("ok")) return; const p = round.pick[+b.dataset.m], want = round.order[round.i];
      if (p === want) { b.classList.add("ok"); b.textContent = "✓"; b.title = p.name; round.i++; if (round.i >= round.order.length) { const secs = Math.round((Date.now() - round.t0) / 1000), n = round.order.length, score = Math.max(10, n * 20 - round.miss * 5 - Math.floor(secs / 3)); cancelAnimationFrame(raf); const names = round.pick.map((x) => x.name).join(", "), miss = round.miss; stop(); endGame("parts", body, score, [`All ${n} parts found in ${secs} s with ${miss} miss${miss === 1 ? "" : "es"}.`, "Parts in this round: " + esc(names) + "."], { perfect: miss === 0 }); } else ask.innerHTML = `✓ Correct. Find: <b>${esc(round.order[round.i].name)}</b> <span class="lk-dim">${round.i + 1} of ${round.order.length}</span>`; }
      else { round.miss++; b.classList.add("no"); setTimeout(() => b.classList.remove("no"), 500); ask.innerHTML = `✗ That is the ${esc(p.name)}. Find: <b>${esc(want.name)}</b> <span class="lk-dim">${round.i + 1} of ${round.order.length}</span>`; }
    });
    body.addEventListener("click", (e) => { const m = e.target.closest("[data-model]"); if (!m) return; model = MODS[+m.dataset.model]; $$("[data-model]", body).forEach((x) => { const on = x === m; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", String(on)); }); start(); });
    start();
  }
  const GAMES = {
    parts: { ic: "🔎", name: "Find the part", text: "Tap the right numbered marker on a 3D machine or animal before time runs away.", run: gameParts },
    clock: { ic: "⏱", name: "Beat the clock", text: "Two minutes of quick questions. Streaks multiply your score up to ×5.", run: gameClock },
    chal: { ic: "🧪", name: "Lab challenge", text: "Hit a target in a real simulation in the fewest moves to earn three stars.", run: listChallenges },
    sort: { ic: "🗂", name: "Sort it", text: "Put every item in the right group, then spot the odd one out.", run: gameSort },
    match: { ic: "🔗", name: "Match it", text: "Pair each quantity, formula or term with its partner as fast as you can.", run: gameMatch },
  };
  const hasGame = (id) => (id === "parts" ? !!(CFG.parts && window.MK && MK.has && CFG.parts.models.some((m) => MK.has(m.key))) : id === "chal" ? chalList().length > 0 : id === "sort" ? (CFG.sorts || []).length > 0 : id === "match" ? (CFG.pairs || []).length > 0 : true);
  const gameIds = () => Object.keys(GAMES).filter(hasGame);

  /* ================= pages inside the lab ================= */
  const RAIL = [["PROGRESS", "◔", "MY LAB", "My progress", () => `${allTopics().filter((t) => level(t.code) === 3).length} of ${allTopics().length} topics mastered`], ["PRACTICE", "✦", "PRACTICE", "Daily five & revision", () => (ST.daily.last === day() ? "Done today · " : "") + `streak ${ST.daily.last === day() || ST.daily.last === addDays(day(), -1) ? ST.daily.streak : 0}`], ["GAMES", "▶", "PLAY", "Lab games", () => gameIds().length + " games"], ["TEACH", "▤", "TEACHERS", "Teacher tools", () => "Present · test · worksheet"]];
  LK.owns = (code) => RAIL.some((r) => r[0] === code);
  LK.rail = (active) => RAIL.map(([id, g, k, name, sub]) => `<div class="tick lk-tick ${active === id ? "active" : ""}"><button class="tick-btn" data-topic="${id}" aria-current="${active === id}"><span class="tick-glyph">${g}</span><span class="tick-text"><span class="tick-code">${k}</span><span class="tick-name">${name}</span><span class="tick-count">${esc(sub())}</span></span></button></div>`).join("");
  const streakNow = () => (ST.daily.last === day() || ST.daily.last === addDays(day(), -1) ? ST.daily.streak : 0);
  const head = (tag, title, text) => `<div class="lk-head"><span class="lk-badge">${esc(tag)}</span><h1>${esc(title)}</h1><p>${text}</p></div>`;
  const tiles = (arr) => `<div class="lk-tiles">${arr.map(([n, l]) => `<div class="lk-stat"><div class="n">${n}</div><div class="l">${esc(l)}</div></div>`).join("")}</div>`;
  const hm = (s) => (s >= 3600 ? Math.floor(s / 3600) + " h " + Math.round((s % 3600) / 60) + " min" : Math.round(s / 60) + " min");
  function suggest() {
    const T = allTopics().filter((t) => (CFG.bank[t.code] || []).length), weak = T.filter((t) => level(t.code) === 1 || level(t.code) === 2).sort((a, b) => best(a.code) - best(b.code)).slice(0, 3);
    const seenNot = T.find((t) => level(t.code) === 0 && t.subtopics.some((s) => ST.seen[t.code + "-" + s.code])), next = seenNot || T.find((t) => level(t.code) === 0);
    return { weak, next };
  }
  /* strip on the lab dashboard */
  LK.strip = () => { const r = rank(), s = suggest(), done = ST.daily.last === day(); return `<div class="lk lk-strip"><div class="lk-card0"><div class="lk-lvl"><b>Level ${r.n} · ${esc(r.name)}</b><span>${ST.xp} XP</span></div><div class="lk-bar"><span style="width:${pct(ST.xp - r.lo, r.hi - r.lo)}%"></span></div><div class="lk-row"><span class="lk-pill">🔥 ${streakNow()} day streak</span><span class="lk-pill">${allTopics().filter((t) => level(t.code) === 3).length} mastered</span><span class="lk-pill">${ST.mistakes.length} to fix</span></div></div>
    <div class="lk-card0"><b>${done ? "Daily five done ✓" : "Today's daily five"}</b><span class="lk-dim">${done ? "Come back tomorrow to keep your streak." : "Five quick questions that favour your weaker topics."}</span><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="daily">${done ? "Practise again" : "Start daily five"}</button>${s.next ? `<button type="button" class="lk-btn" data-lk="go" data-code="${s.next.code}">Next topic: ${esc(s.next.num || s.next.code)}</button>` : ""}</div></div></div>`; };
  /* bar on a topic page */
  LK.topicBar = (t) => { const n = (CFG.bank[t.code] || []).length, r = rec(t.code), nc = cards().filter((c) => c.t === t.code).length; return `<div class="lk lk-topicbar">${LK.ring(t.code, 54)}<div class="lk-tb-text"><b>${LEVELS[level(t.code)][1]}</b><span class="lk-dim">${r ? `Best ${r.best} % · last ${r.last} % · ${r.att} attempt${r.att === 1 ? "" : "s"}` : "No attempt yet. Score 80 % to master this topic."}</span></div><span class="lk-sp"></span>${n ? `<button type="button" class="lk-btn primary" data-lk="check" data-code="${t.code}">✓ Check yourself</button>` : ""}${nc ? `<button type="button" class="lk-btn" data-lk="cards" data-code="${t.code}">🃏 Flashcards (${nc})</button>` : ""}<button type="button" class="lk-btn" data-lk="sheet" data-code="${t.code}">▤ Worksheet</button></div>`; };

  function pageProgress() {
    const T = allTopics(), r = rank(), m = T.filter((t) => level(t.code) === 3).length, sec = T.filter((t) => level(t.code) === 2).length, seen = Object.keys(ST.seen).length, s = suggest();
    return `<div class="lk">${head("My lab", "My progress", `Saved on this device only. ${ST.name ? "Learner: <b>" + esc(ST.name) + "</b>. " : ""}<button type="button" class="lk-link" data-lk="name">${ST.name ? "Change name" : "Add your name"}</button>`)}
      <div class="lk-card0"><div class="lk-lvl"><b>Level ${r.n} · ${esc(r.name)}</b><span>${ST.xp} XP · ${r.hi - ST.xp} to the next level</span></div><div class="lk-bar"><span style="width:${pct(ST.xp - r.lo, r.hi - r.lo)}%"></span></div></div>
      ${tiles([[m + "/" + T.length, "Topics mastered"], [sec, "Topics secure"], ...(CFG.trackSeen === false ? [] : [[pct(seen, subCount()) + "%", "Syllabus opened"]]), [ST.stats.answered, "Questions answered"], [pct(ST.stats.correct, ST.stats.answered) + "%", "Accuracy"], ["🔥 " + streakNow(), "Day streak"], [hm(ST.stats.secs), "Time in the lab"]])}
      <div class="lk-two"><div class="lk-card0"><h3>What to do next</h3>${s.next ? `<p>Start <b>${esc(s.next.title)}</b>.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="go" data-code="${s.next.code}">Open topic ${esc(s.next.num || s.next.code)}</button></div>` : "<p>You have attempted every topic.</p>"}${s.weak.length ? `<p class="lk-dim" style="margin-top:12px">Weakest so far:</p>${s.weak.map((t) => `<div class="lk-line">${LK.ring(t.code, 30)}<span>${esc(t.title)}</span><span class="lk-sp"></span><button type="button" class="lk-btn sm" data-lk="check" data-code="${t.code}">Retry</button></div>`).join("")}` : ""}</div>
      <div class="lk-card0"><h3>Badges <span class="lk-dim">${Object.keys(ST.badges).length} of ${BADGES.length}</span></h3><div class="lk-badges">${BADGES.map(([id, ic, name, how]) => `<div class="lk-bdg${ST.badges[id] ? " on" : ""}" title="${esc(how)}"><span aria-hidden="true">${ic}</span><b>${esc(name)}</b><small>${ST.badges[id] ? nice(ST.badges[id]) : esc(how)}</small></div>`).join("")}</div></div></div>
      ${sections().map((S) => { const c = [0, 0, 0, 0]; S.topics.forEach((t) => c[level(t.code)]++); const n = S.topics.length || 1, cert = S.topics.length && S.topics.every((t) => level(t.code) >= 2);
        return `<details class="lk-card0 lk-sec"${S.topics.some((t) => level(t.code) > 0) ? " open" : ""}><summary><b>${esc(S.label)}</b><span class="lk-stack" aria-label="${c[3]} mastered, ${c[2]} secure, ${c[1]} learning, ${c[0]} not started"><i style="width:${(c[3] / n) * 100}%;background:var(--lk-good)"></i><i style="width:${(c[2] / n) * 100}%;background:var(--lk-info)"></i><i style="width:${(c[1] / n) * 100}%;background:var(--lk-warn)"></i></span><span class="lk-dim">${c[3]} mastered · ${c[2]} secure · ${c[1]} learning · ${c[0]} to start</span></summary>
          ${cert ? `<div class="lk-row"><button type="button" class="lk-btn primary" data-lk="cert" data-sec="${esc(S.key)}">🎓 Get the certificate for this section</button></div>` : `<p class="lk-dim">Reach Secure (50 % or more) in every topic here to unlock the certificate.</p>`}
          <table class="lk-table"><tr><th></th><th>Topic</th><th>Level</th><th>Best</th><th>Attempts</th><th>Last tried</th><th></th></tr>${S.topics.map((t) => { const q = rec(t.code); return `<tr><td>${LK.ring(t.code, 30)}</td><td><button type="button" class="lk-link" data-lk="go" data-code="${t.code}">${esc(t.num || t.code)} · ${esc(t.title)}</button></td><td>${LEVELS[level(t.code)][1]}</td><td>${q ? q.best + " %" : "—"}</td><td>${q ? q.att : 0}</td><td>${q ? nice(q.when) : "—"}</td><td>${(CFG.bank[t.code] || []).length ? `<button type="button" class="lk-btn sm" data-lk="check" data-code="${t.code}">Check</button>` : ""}</td></tr>`; }).join("")}</table></details>`; }).join("")}
      <div class="lk-card0"><h3>Keep or move your progress</h3><p class="lk-dim">Progress lives in this browser on this device. Use a backup file to move it to another device or to hand a report to your teacher.</p><div class="lk-row"><button type="button" class="lk-btn" data-lk="report">🖨 Print progress report</button><button type="button" class="lk-btn" data-lk="backup">⇩ Save backup file</button><button type="button" class="lk-btn" data-lk="restore">⇧ Load backup file</button><button type="button" class="lk-btn danger" data-lk="reset">Reset my progress</button></div></div></div>`;
  }
  function pagePractice() {
    const done = ST.daily.last === day(), d = ST.daily, dueN = cards().filter((c) => ST.cards[c.id] && due(c)).length, newN = cards().filter((c) => !ST.cards[c.id]).length;
    const week = []; for (let i = 6; i >= 0; i--) { const k = addDays(day(), -i); week.push([k, d.days.includes(k)]); }
    return `<div class="lk">${head("Practice", "Daily five and revision", "A few minutes a day beats one long session. Daily five picks questions from topics you have opened or found hard.")}
      <div class="lk-two"><div class="lk-card0"><h3>Daily five ${done ? "✓" : ""}</h3><div class="lk-week" aria-label="Last seven days">${week.map(([k, on]) => `<span class="${on ? "on" : ""}" title="${nice(k)}">${"SMTWTFS"[new Date(k.split("-")[0], k.split("-")[1] - 1, k.split("-")[2]).getDay()]}</span>`).join("")}</div><p>🔥 Streak <b>${streakNow()}</b> day${streakNow() === 1 ? "" : "s"} · best ${d.best} · ${d.total} completed</p><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="daily">${done ? "Practise again (streak already counted)" : "Start today's five"}</button></div></div>
      <div class="lk-card0"><h3>Flashcards</h3><p>${dueN} due for review · ${newN} new · ${cards().length} in total, each one a full question on a topic.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="cards">Review cards</button></div><p class="lk-dim">Cards you know come back after 1, 2, 4, 8 and 16 days.</p></div></div>
      <div class="lk-card0"><h3>Mistake notebook <span class="lk-dim">${ST.mistakes.length} open · ${ST.stats.fixed} cleared</span></h3>${ST.mistakes.length ? `<div class="lk-row"><button type="button" class="lk-btn primary" data-lk="retry">Retry my mistakes</button></div>${ST.mistakes.slice(0, 30).map((m) => `<details class="lk-miss"><summary>${esc(m.q)}</summary><div><b>Answer:</b> ${esc(m.a)}</div><div class="lk-dim">You chose: ${esc(m.y)} · ${esc((topic(m.t) || {}).title || "")} · ${nice(m.d)}</div>${(m.s || []).map((s) => `<div class="lk-dim">${esc(s)}</div>`).join("")}</details>`).join("")}${ST.mistakes.length > 30 ? `<p class="lk-dim">Showing 30 of ${ST.mistakes.length}.</p>` : ""}` : `<p class="lk-dim">Every question you miss is kept here with its answer. Get it right later and it clears itself.</p>`}</div></div>`;
  }
  function pageGames() {
    return `<div class="lk">${head("Play", "Lab games", "Short games built from the same questions, simulations and 3D models as the lessons. They earn XP and badges.")}<div class="lk-grid">${gameIds().map((id) => { const g = GAMES[id], r = ST.games[id] || {}; const extra = id === "chal" ? `${Object.keys(ST.chal).length} of ${chalList().length} solved` : r.plays ? `Best ${r.best} · played ${r.plays}×` : "Not played yet"; return `<button type="button" class="lk-tile big" data-lk="game" data-game="${id}"><span class="lk-ic" aria-hidden="true">${g.ic}</span><b>${g.name}</b><span>${g.text}</span><small>${extra}</small></button>`; }).join("")}</div></div>`;
  }
  function pageTeach() {
    const T = allTopics(), can = !!CFG.sw && "serviceWorker" in navigator && /^https?:$/.test(location.protocol);
    return `<div class="lk">${head("Teachers", "Teacher tools", "No sign-in is needed and nothing is collected. Every tool works from this page and prints on A4.")}
      <div class="lk-two"><div class="lk-card0"><h3>Presentation mode</h3><p>Hides the menus, enlarges the simulation and text, and turns the pointer into a laser dot for a projector. Press <kbd>Esc</kbd> to leave.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="present">Start presenting</button></div></div>
      <div class="lk-card0"><h3>Use without internet</h3><p>${can ? "Save this lab on the device so it opens without data. Simulations you have already opened are kept too." : "Offline saving is not available in this view. Open the lab on the main site to use it."}</p><div class="lk-row">${can ? '<button type="button" class="lk-btn" data-lk="offline">Save lab for offline use</button>' : ""}<span class="lk-dim" id="lk-off"></span></div></div></div>
      <div class="lk-card0"><h3>Test builder</h3><p>Choose topics and a length. You get a printable objective paper with fresh question order and a separate marking scheme.</p>
        <div class="lk-row"><label class="lk-k" for="lk-tn">Questions</label><select id="lk-tn"><option>10</option><option selected>20</option><option>30</option><option>40</option><option>50</option></select><label class="lk-k" for="lk-tt">Title</label><input id="lk-tt" type="text" value="${esc(CFG.subject)} class test" maxlength="60"><button type="button" class="lk-btn sm" data-lk="tall">All / none</button></div>
        ${sections().map((S) => `<div class="lk-pick"><b>${esc(S.label)}</b><div class="lk-chips">${S.topics.filter((t) => (CFG.bank[t.code] || []).length).map((t) => `<button type="button" class="lk-chip" data-pick="${t.code}" aria-pressed="false" title="${esc(t.title)}">${esc(t.num || t.code)} ${esc(t.title.length > 34 ? t.title.slice(0, 32) + "…" : t.title)}</button>`).join("")}</div></div>`).join("")}
        <div class="lk-row"><button type="button" class="lk-btn primary" data-lk="test">Build the test</button></div></div>
      <div class="lk-card0"><h3>Lesson plan and worksheet</h3><p>Pick a topic for a one-page lesson plan (objectives, key points, simulation activities) and a student worksheet with an answer key.</p><div class="lk-row"><label class="lk-k" for="lk-lt">Topic</label><select id="lk-lt">${T.map((t) => `<option value="${t.code}">${esc(t.num || t.code)} · ${esc(t.title)}</option>`).join("")}</select><button type="button" class="lk-btn primary" data-lk="plan">Lesson plan</button><button type="button" class="lk-btn" data-lk="sheet">Worksheet</button></div></div></div>`;
  }
  LK.openPage = (code) => { const r = RAIL.find((x) => x[0] === code); if (!r) return; const body = openSheet(r[3], "", { wide: true, tag: CFG.subject, page: code }); LK.render(body, code); };
  LK.seen = (k) => { if (CFG && ST && k && !ST.seen[k]) { ST.seen[k] = 1; award(); save(); } };
  function dock() { if ($("#lk-dock")) return; const d = document.createElement("nav"); d.id = "lk-dock"; d.setAttribute("aria-label", "Learning tools"); d.innerHTML = RAIL.map(([id, g, , name]) => `<button type="button" data-lk="page" data-page="${id}" title="${esc(name)}"><span aria-hidden="true">${g}</span><b>${esc(name.replace("Daily five & revision", "Practice").replace("My progress", "Progress").replace("Lab games", "Games").replace("Teacher tools", "Teachers"))}</b></button>`).join(""); document.body.appendChild(d); document.body.classList.add("lk-docked"); }
  LK.render = (root, code) => { root.innerHTML = code === "PROGRESS" ? pageProgress() : code === "PRACTICE" ? pagePractice() : code === "GAMES" ? pageGames() : pageTeach(); };

  /* ================= printouts ================= */
  const stamp = () => `<div class="lk-pr-foot">${esc(CFG.brand || "learnwithnehy.")} · ${esc(CFG.subject)} · ${nice(day())}</div>`;
  function printable(title, html) { openSheet(title, `<div class="lk-paper">${html}${stamp()}</div>`, { tag: "Printout", wide: true, print: true }); }
  function buildTest(codes, n, title) {
    const qs = mixedQs(codes, n); if (!qs.length) return toast("Choose at least one topic.");
    printable(title, `<h1>${esc(title)}</h1><p class="lk-pr-meta">Name: ____________________________ &nbsp; Class: __________ &nbsp; Date: __________ &nbsp; Score: ______ / ${qs.length}</p><p class="lk-pr-meta">Answer all questions. Each question has four options lettered A to D. Time allowed: ${qs.length} minutes.</p><ol class="lk-pr-q">${qs.map((q) => `<li><p>${esc(q.q)}</p><div class="lk-pr-o">${q.opts.map((o, k) => `<span><b>${"ABCD"[k]}.</b> ${esc(o)}</span>`).join("")}</div></li>`).join("")}</ol>
      <div class="lk-pr-break"></div><h1>Marking scheme — ${esc(title)}</h1><table class="lk-pr-t"><tr><th>No.</th><th>Answer</th><th>Topic</th></tr>${qs.map((q, i) => `<tr><td>${i + 1}</td><td><b>${"ABCD"[q.opts.indexOf(q.ans)]}</b> — ${esc(q.ans)}</td><td>${esc((topic(q.topic) || {}).title || "")}</td></tr>`).join("")}</table>`);
  }
  const sims = (t) => { const out = []; if (CFG.simsOf) { try { return CFG.simsOf(t) || []; } catch (e) { return out; } } if (!window.MK || !MK.scenes) return out; t.subtopics.forEach((st) => { const k = t.code + "-" + st.code; [k].concat(MK.extras ? MK.extras(k) : []).forEach((kk) => { const sc = MK.scenes[kk]; if (sc) out.push({ title: sc.title || st.title, tasks: sc.tasks || [] }); }); }); return out; };
  function lessonPlan(code) {
    const t = topic(code); if (!t) return; const S = sims(t);
    printable("Lesson plan — " + t.title, `<h1>Lesson plan: ${esc(t.title)}</h1><p class="lk-pr-meta">${esc(CFG.subject)} · ${esc(t.sectionLabel)} · Topic ${esc(t.num || t.code)} · Class: ________ · Duration: ${Math.max(1, Math.ceil(t.subtopics.length / 2))} × 40 minutes</p>
      <h2>Objectives</h2><p>By the end of the lesson, students should be able to:</p><ol>${t.subtopics.map((s) => `<li>explain ${esc(s.title.charAt(0).toLowerCase() + s.title.slice(1))}</li>`).join("")}</ol>
      <h2>Key points</h2>${t.subtopics.map((s) => `<h3>${esc(s.title)}</h3><ul>${(s.content || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ul>${s.notes ? `<p class="lk-pr-note"><b>Examiner's note:</b> ${esc(s.notes)}</p>` : ""}`).join("")}
      <h2>Lesson steps</h2><table class="lk-pr-t"><tr><th>Step</th><th>Teacher</th><th>Students</th></tr><tr><td>Starter (5 min)</td><td>Ask what students already know about ${esc(t.title.toLowerCase())}; note answers on the board.</td><td>Share ideas; attempt two warm-up questions.</td></tr><tr><td>Teach (15 min)</td><td>Project the lab in presentation mode; go through each subtopic and its simulation.</td><td>Take notes; predict what each control will change.</td></tr><tr><td>Practise (12 min)</td><td>Set the simulation activities below; move round the class.</td><td>Work in pairs; record readings on the experiment card.</td></tr><tr><td>Check (8 min)</td><td>Run “Check yourself” on the projector or hand out the worksheet.</td><td>Answer; correct mistakes with the worked solutions.</td></tr></table>
      <h2>Simulation activities</h2>${S.length ? `<ul>${S.slice(0, 8).map((x) => `<li><b>${esc(x.title)}</b>${x.tasks.length ? ": " + x.tasks.map(esc).join(" ") : ""}</li>`).join("")}</ul>` : "<p>Use the notes and specimen photos for this topic.</p>"}
      <h2>Assessment</h2><p>Topic check in the lab (8 questions) or the printed worksheet. Mastery is 80 % or more.</p><h2>Homework</h2><p>Daily five in the lab, and review the flashcards for this topic.</p>`);
  }
  function worksheet(code) {
    const t = topic(code); if (!t) return; const qs = shuffle(bankQs(code)).slice(0, 8), terms = cards().filter((c) => c.t === code && c.id.indexOf("q:") !== 0).slice(0, 5), S = sims(t)[0];
    printable("Worksheet — " + t.title, `<h1>Worksheet: ${esc(t.title)}</h1><p class="lk-pr-meta">Name: ____________________________ &nbsp; Class: __________ &nbsp; Date: __________</p>
      ${terms.length ? `<h2>A. Answer in a sentence or a short list</h2><ol>${terms.map((c) => `<li>${esc(c.q)} <span class="lk-pr-line"></span></li>`).join("")}</ol>` : ""}
      <h2>${terms.length ? "B" : "A"}. Choose the correct option</h2><ol class="lk-pr-q">${qs.map((q) => `<li><p>${esc(q.q)}</p><div class="lk-pr-o">${q.opts.map((o, k) => `<span><b>${"ABCD"[k]}.</b> ${esc(o)}</span>`).join("")}</div></li>`).join("")}</ol>
      ${S && S.tasks.length ? `<h2>${terms.length ? "C" : "B"}. In the lab: ${esc(S.title)}</h2><ol>${S.tasks.map((x) => `<li>${esc(x)} <span class="lk-pr-line"></span></li>`).join("")}</ol>` : ""}
      <div class="lk-pr-break"></div><h1>Answer key — ${esc(t.title)}</h1>${terms.length ? `<h2>A</h2><ol>${terms.map((c) => `<li>${esc(c.back)}</li>`).join("")}</ol>` : ""}<h2>${terms.length ? "B" : "A"}</h2><ol>${qs.map((q) => `<li><b>${"ABCD"[q.opts.indexOf(q.ans)]}</b> — ${esc(q.ans)}</li>`).join("")}</ol>`);
  }
  function report() {
    const T = allTopics(), r = rank();
    printable("Progress report", `<h1>Progress report — ${esc(CFG.subject)}</h1><p class="lk-pr-meta">Learner: ${ST.name ? esc(ST.name) : "____________________________"} &nbsp; Date: ${nice(day())}</p><p class="lk-pr-meta">Level ${r.n} (${esc(r.name)}) · ${ST.xp} XP · ${T.filter((t) => level(t.code) === 3).length} of ${T.length} topics mastered · ${ST.stats.answered} questions answered · accuracy ${pct(ST.stats.correct, ST.stats.answered)} % · daily-five streak ${streakNow()} · time in the lab ${hm(ST.stats.secs)}</p>
      ${sections().map((S) => `<h2>${esc(S.label)}</h2><table class="lk-pr-t"><tr><th>Topic</th><th>Level</th><th>Best</th><th>Last</th><th>Attempts</th><th>Last tried</th></tr>${S.topics.map((t) => { const q = rec(t.code); return `<tr><td>${esc(t.num || t.code)} · ${esc(t.title)}</td><td>${LEVELS[level(t.code)][1]}</td><td>${q ? q.best + " %" : "—"}</td><td>${q ? q.last + " %" : "—"}</td><td>${q ? q.att : 0}</td><td>${q ? nice(q.when) : "—"}</td></tr>`; }).join("")}</table>`).join("")}<p class="lk-pr-note">This report is produced on the learner's own device from saved practice results. It is not an examination record.</p>`);
  }
  function certificate(secKey) {
    const S = sections().find((s) => s.key === secKey); if (!S) return; const avg = Math.round(S.topics.reduce((n, t) => n + Math.max(0, best(t.code)), 0) / (S.topics.length || 1));
    const body = openSheet("Certificate", `<canvas class="lk-cert" width="1600" height="1130" role="img" aria-label="Certificate for ${esc(S.label)}"></canvas><div class="lk-row"><button type="button" class="lk-btn primary" data-dl data-auto>⇩ Download as an image</button><button type="button" class="lk-btn" data-lk="name">Change the name</button></div><p class="lk-note">This is a practice award from the lab, not an examination certificate.</p>`, { tag: "Award", wide: true });
    sheet.dataset.sec = secKey;
    const cv = $("canvas", body), x = cv.getContext("2d"), W = 1600, Hh = 1130;
    const g = x.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, "#fbf8ef"); g.addColorStop(1, "#f1ead6"); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
    x.strokeStyle = "#12203b"; x.lineWidth = 10; x.strokeRect(40, 40, W - 80, Hh - 80); x.strokeStyle = "#d9a441"; x.lineWidth = 3; x.strokeRect(62, 62, W - 124, Hh - 124);
    x.fillStyle = "#12203b"; x.textAlign = "center"; x.font = "600 30px 'JetBrains Mono', monospace"; x.fillText((CFG.brand || "learnwithnehy.").toUpperCase() + "  ·  WAEC " + CFG.subject.toUpperCase(), W / 2, 170);
    x.font = "600 86px 'Source Serif 4', Georgia, serif"; x.fillText("Certificate of Achievement", W / 2, 300);
    x.font = "400 34px 'IBM Plex Sans', sans-serif"; x.fillStyle = "#5b6478"; x.fillText("This is awarded to", W / 2, 400);
    x.fillStyle = "#b5322f"; x.font = "600 76px 'Source Serif 4', Georgia, serif"; x.fillText(ST.name || "________________________", W / 2, 505);
    x.fillStyle = "#12203b"; x.font = "400 34px 'IBM Plex Sans', sans-serif"; x.fillText("for reaching Secure or better in every topic of", W / 2, 600);
    x.font = "600 46px 'Source Serif 4', Georgia, serif"; const lab = S.label; x.fillText(lab.length > 56 ? lab.slice(0, 54) + "…" : lab, W / 2, 670);
    x.font = "500 30px 'JetBrains Mono', monospace"; x.fillStyle = "#1d7a63"; x.fillText(`${S.topics.length} topics  ·  average best score ${avg} %  ·  ${S.topics.filter((t) => level(t.code) === 3).length} mastered`, W / 2, 760);
    x.fillStyle = "#5b6478"; x.font = "400 28px 'IBM Plex Sans', sans-serif"; x.fillText(nice(day()), W / 2, 880); x.fillText("Practice award from the interactive science lab. Not an examination certificate.", W / 2, 990);
    x.beginPath(); x.arc(W / 2, 835, 0, 0, 0); x.strokeStyle = "#12203b"; x.lineWidth = 2; x.moveTo(W / 2 - 180, 900); x.lineTo(W / 2 + 180, 900); x.stroke();
    $("[data-dl]", body).addEventListener("click", () => { const a = document.createElement("a"); a.download = CFG.id + "-certificate-" + S.key + ".png"; a.href = cv.toDataURL("image/png"); a.click(); });
  }

  /* ================= presentation mode ================= */
  let laser = null;
  function present(on) {
    document.body.classList.toggle("lk-present", on);
    if (on) { if (!laser) { laser = document.createElement("div"); laser.id = "lk-laser"; laser.setAttribute("aria-hidden", "true"); document.body.appendChild(laser); document.addEventListener("pointermove", (e) => { if (document.body.classList.contains("lk-present")) laser.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }); const b = document.createElement("button"); b.type = "button"; b.id = "lk-exit"; b.textContent = "✕ Exit presentation (Esc)"; b.setAttribute("data-lk", "unpresent"); document.body.appendChild(b); } toast("Presentation mode on. Open a topic and launch its simulation. Press Esc to leave."); }
    window.dispatchEvent(new Event("resize"));
  }

  /* ================= events ================= */
  function act(a, el) {
    const code = el.dataset.code;
    if (a === "close") return closeSheet();
    if (a === "print") return window.print();
    if (a === "check") return LK.check(code);
    if (a === "cards") return runCards(code);
    if (a === "daily") return LK.daily();
    if (a === "retry") return LK.retry();
    if (a === "game") return GAMES[el.dataset.game].run();
    if (a === "go") { backTo = null; closeSheet(true); return CFG.go && CFG.go(code); }
    if (a === "cert") return certificate(el.dataset.sec);
    if (a === "report") return report();
    if (a === "present") { backTo = null; closeSheet(true); return present(true); }
    if (a === "page") return LK.openPage(el.dataset.page);
    if (a === "chquit") return stopLive(true);
    if (a === "chlist") { stopLive(true); return listChallenges(); }
    if (a === "unpresent") return present(false);
    if (a === "plan") return lessonPlan(code || ($("#lk-lt") || {}).value);
    if (a === "sheet") return worksheet(code || ($("#lk-lt") || {}).value);
    if (a === "tall") { const all = $$("[data-pick]"), on = all.some((b) => b.getAttribute("aria-pressed") !== "true"); all.forEach((b) => { b.setAttribute("aria-pressed", String(on)); b.classList.toggle("sel", on); }); return; }
    if (a === "test") { const codes = $$("[data-pick][aria-pressed=true]").map((b) => b.dataset.pick); if (!codes.length) return toast("Choose at least one topic for the test."); return buildTest(codes, +$("#lk-tn").value, ($("#lk-tt").value || "Class test").trim()); }
    if (a === "name") { const n = window.prompt("Name to show on reports and certificates:", ST.name || ""); if (n != null) { ST.name = n.trim().slice(0, 40); save(); const sec = sheet && $(".lk-cert", sheet) ? sheet.dataset.sec : null; if (sec) { closeSheet(true); certificate(sec); } else refresh(); } return; }
    if (a === "backup") { const blob = new Blob([JSON.stringify({ app: "lwn-learn", id: CFG.id, saved: new Date().toISOString(), data: ST })], { type: "application/json" }), l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = CFG.id + "-progress-" + day() + ".json"; l.click(); setTimeout(() => URL.revokeObjectURL(l.href), 2000); return; }
    if (a === "restore") { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json"; inp.addEventListener("change", () => { const f = inp.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => { try { const j = JSON.parse(fr.result); if (j.app !== "lwn-learn" || j.id !== CFG.id || !j.data || j.data.v !== 1) throw new Error("wrong file"); ST = Object.assign(blank(), j.data); save(); toast("Progress loaded from the backup file."); refresh(); } catch (e) { toast("That file is not a progress backup for this lab."); } }; fr.readAsText(f); }); inp.click(); return; }
    if (a === "reset") { if (window.confirm("Delete all saved progress for " + CFG.subject + " on this device? This cannot be undone.")) { ST = blank(); save(); refresh(); toast("Progress reset."); } return; }
    if (a === "offline") return goOffline();
  }
  function goOffline() {
    const out = $("#lk-off"), say = (t) => { if (out) out.textContent = t; };
    if (!("serviceWorker" in navigator)) return say("This browser cannot save the lab for offline use.");
    say("Saving…");
    navigator.serviceWorker.register(CFG.sw || "/sw.js").then(() => navigator.serviceWorker.ready).then((reg) => {
      const urls = [location.pathname].concat($$("script[src]").map((s) => s.getAttribute("src")), $$("link[rel=stylesheet][href]").map((s) => s.getAttribute("href"))).filter((u) => u && !/^https?:\/\//.test(u) || (u && u.indexOf(location.origin) === 0));
      const ch = new MessageChannel(); ch.port1.onmessage = (e) => say(e.data && e.data.ok ? `Saved ${e.data.n} files. The lab now opens without internet; 3D skies and textures are kept as you use them.` : "Some files could not be saved. Try again on a steady connection.");
      (reg.active || reg.waiting || reg.installing).postMessage({ type: "precache", urls }, [ch.port2]);
    }).catch(() => say("Offline saving is not available here."));
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-lk]"); if (el && CFG) { e.preventDefault(); act(el.dataset.lk, el); return; }
    const pk = e.target.closest("[data-pick]"); if (pk) { const on = pk.getAttribute("aria-pressed") !== "true"; pk.setAttribute("aria-pressed", String(on)); pk.classList.toggle("sel", on); return; }
    const hd = e.target.closest(".item-head[data-key]"); if (hd && CFG && !ST.seen[hd.dataset.key]) { ST.seen[hd.dataset.key] = 1; award(); save(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key !== "Escape") return; if (sheet) closeSheet(); else if (document.body.classList.contains("lk-present")) present(false); });
  setInterval(() => { if (CFG && ST && document.visibilityState === "visible") { ST.stats.secs += 20; save(); } }, 20000);

  /* ================= styles ================= */
  const css = `
.lk{--lk-good:#2f9e6e;--lk-info:#3b82c4;--lk-warn:#d9912b;--lk-bad:#d0463f;--lk-idle:var(--g-muted,#8c96b3);--lk-track:var(--g-well,rgba(120,120,150,.22));color:var(--g-ink,#1b2a4a);font-family:'IBM Plex Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:14px;max-width:1040px;margin:0 auto}
.lk *{box-sizing:border-box}.lk h1{font:600 clamp(24px,3.6vw,32px)/1.2 'Source Serif 4',Georgia,serif;margin:6px 0}.lk h2{font:600 20px/1.25 'Source Serif 4',Georgia,serif;margin:0}.lk h3{font:600 17px/1.3 'Source Serif 4',Georgia,serif;margin:0 0 8px}
.lk p{margin:0 0 8px;font-size:14.5px;line-height:1.55}.lk-head p{color:var(--g-muted,#5b6478);max-width:70ch}.lk-dim{color:var(--g-muted,#5b6478);font-size:12.5px}.lk-sp{flex:1}
.lk-badge{display:inline-block;font:700 10.5px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:var(--g-active,rgba(255,210,122,.25));color:var(--g-accent,#7962b1)}
.lk-card0{padding:16px 18px;border-radius:18px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.1));box-shadow:inset 1px 2px 2px var(--g-highlight,rgba(255,255,255,.4)),4px 8px 16px var(--g-shadow,rgba(0,0,0,.08));display:flex;flex-direction:column;gap:6px;min-width:0}
.lk-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px}.lk-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.lk-btn{font:600 13px 'IBM Plex Sans',sans-serif;padding:9px 14px;border-radius:12px;border:1px solid var(--g-edge,rgba(0,0,0,.18));background:var(--g-well,rgba(0,0,0,.05));color:inherit;cursor:pointer;min-height:40px}
.lk-btn:hover{filter:brightness(1.08)}.lk-btn:focus-visible,.lk-opt:focus-visible,.lk-chip:focus-visible,.lk-tile:focus-visible,.lk-card:focus-visible,.lk-bin:focus-visible,.lk-mark:focus-visible,.lk-link:focus-visible{outline:3px solid var(--g-accent,#7962b1);outline-offset:2px}
.lk-btn.primary{background:linear-gradient(135deg,#ffd27a,#ffb347);color:#3a2a10;border-color:transparent;font-weight:700}.lk-btn.sm{padding:5px 10px;min-height:32px;font-size:12px}.lk-btn.ghost{background:transparent}.lk-btn.danger{color:var(--lk-bad)}
.lk-link{background:none;border:0;padding:0;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;text-align:left}
.lk-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:10px}.lk-stat{padding:14px;border-radius:16px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.1))}.lk-stat .n{font:700 22px 'JetBrains Mono',monospace}.lk-stat .l{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--g-muted,#5b6478);margin-top:6px}
.lk-lvl{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:14px}.lk-lvl span{font:600 12px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}
.lk-bar,.lk-prog{height:8px;border-radius:99px;background:var(--lk-track);overflow:hidden}.lk-bar span,.lk-prog span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#ffb347,#ffd27a);transition:width .4s ease}
.lk-pill{font:600 12px 'JetBrains Mono',monospace;padding:5px 10px;border-radius:99px;background:var(--g-well,rgba(0,0,0,.06))}
.lk-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;max-width:none;margin:0 0 18px}
.lk-topicbar{flex-direction:row;flex-wrap:wrap;align-items:center;gap:10px 12px;max-width:none;margin:14px 0 4px;padding:12px 14px;border-radius:16px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.1))}.lk-tb-text{display:flex;flex-direction:column;min-width:160px}
.lk-ring{flex:none;vertical-align:middle}.oc-ring{float:right;margin:-2px -4px 0 8px}
.lk-line{display:flex;align-items:center;gap:10px;padding:5px 0;font-size:14px}
.lk-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}.lk-bdg{display:flex;flex-direction:column;gap:2px;padding:10px;border-radius:14px;background:var(--g-well,rgba(0,0,0,.05));opacity:.5;filter:grayscale(1)}.lk-bdg.on{opacity:1;filter:none;background:var(--g-active,rgba(255,210,122,.3))}.lk-bdg span{font-size:22px}.lk-bdg b{font-size:13px}.lk-bdg small{font-size:11px;color:var(--g-muted,#5b6478);line-height:1.35}
.lk-sec summary{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;cursor:pointer;font-size:15px}.lk-stack{flex:1 1 160px;display:flex;height:10px;border-radius:99px;overflow:hidden;background:var(--lk-track);gap:2px}.lk-stack i{display:block;height:100%}
.lk-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}.lk-table th{font:600 10.5px 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--g-muted,#5b6478);text-align:left;padding:6px 8px}.lk-table td{padding:6px 8px;border-top:1px solid var(--g-edge,rgba(0,0,0,.1));vertical-align:middle}
.lk-week{display:flex;gap:6px}.lk-week span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:700 11px 'JetBrains Mono',monospace;background:var(--lk-track)}.lk-week span.on{background:linear-gradient(135deg,#ffd27a,#ffb347);color:#3a2a10}
.lk-miss{padding:9px 12px;border-radius:12px;background:var(--g-well,rgba(0,0,0,.05));font-size:13.5px;margin-top:6px}.lk-miss summary{cursor:pointer}.lk-miss p{margin:0 0 4px;font-weight:600}
.lk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.lk-tile{display:flex;flex-direction:column;gap:6px;text-align:left;padding:16px;border-radius:18px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.1));color:inherit;cursor:pointer;font:13.5px/1.45 'IBM Plex Sans',sans-serif;transition:transform .12s ease}.lk-tile:hover{transform:translateY(-2px)}.lk-tile b{font:600 17px 'Source Serif 4',Georgia,serif}.lk-tile small{font:600 11.5px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}.lk-tile.big{min-height:170px}.lk-ic{font-size:30px}.lk-stars{color:#e0a22b;font-size:18px;letter-spacing:2px}
.lk-k{font:600 11px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}.lk select,.lk input[type=text]{font:600 13px 'IBM Plex Sans',sans-serif;padding:8px 10px;border-radius:10px;border:1px solid var(--g-edge,rgba(0,0,0,.2));background:var(--g-well,rgba(255,255,255,.5));color:inherit;max-width:100%;min-height:40px}.lk kbd{font:600 11px 'JetBrains Mono',monospace;padding:2px 6px;border-radius:6px;border:1px solid var(--g-edge,rgba(0,0,0,.2))}
.lk-pick{margin-top:8px}.lk-pick b{font-size:12.5px}.lk-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}.lk-chip{font:600 12.5px 'IBM Plex Sans',sans-serif;padding:8px 12px;border-radius:99px;border:1px solid var(--g-edge,rgba(0,0,0,.2));background:var(--g-well,rgba(0,0,0,.05));color:inherit;cursor:pointer;min-height:38px}.lk-chip.sel{background:linear-gradient(135deg,#ffd27a,#ffb347);color:#3a2a10;border-color:transparent}.lk-seg{display:flex;flex-wrap:wrap;gap:6px}
.lk-sheet{position:fixed;inset:0;z-index:9000;background:rgba(10,12,24,.62);display:flex;justify-content:center;align-items:flex-start;overflow:auto;padding:max(12px,env(safe-area-inset-top)) 12px 24px;backdrop-filter:blur(6px)}
.lk-sheet-in{width:min(760px,100%);max-width:none;margin:0;background:var(--g-bg,#f3f1fa);border:1px solid var(--g-edge,rgba(0,0,0,.15));border-radius:22px;padding:16px 18px 20px;position:relative;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.35)}.lk-sheet.wide .lk-sheet-in{width:min(1040px,100%)}
.lk-sheet-top{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}.lk-sheet-body{display:flex;flex-direction:column;gap:12px;min-width:0}body.lk-lock{overflow:hidden}
.lk-qz{display:flex;flex-direction:column;gap:12px}.lk-qmeta{display:flex;flex-wrap:wrap;gap:6px 14px;font:600 11.5px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}.lk-q{font:500 18px/1.5 'IBM Plex Sans',sans-serif!important;margin:4px 0!important}
.lk-opts{display:grid;gap:9px}.lk-opts.two{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.lk-opt{display:flex;gap:12px;align-items:center;text-align:left;padding:12px 14px;border-radius:14px;border:1px solid var(--g-edge,rgba(0,0,0,.18));background:var(--g-surface,rgba(255,255,255,.7));color:inherit;cursor:pointer;font:500 15px/1.4 'IBM Plex Sans',sans-serif;min-height:48px}.lk-opt b{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 12px 'JetBrains Mono',monospace;background:var(--g-well,rgba(0,0,0,.08))}.lk-opt:hover:not(:disabled){filter:brightness(1.06)}.lk-opt:disabled{cursor:default;opacity:.75}.lk-opt.ok{border-color:var(--lk-good);background:rgba(47,158,110,.2);opacity:1}.lk-opt.bad{border-color:var(--lk-bad);background:rgba(208,70,63,.18);opacity:1}
.lk-fb{display:flex;flex-direction:column;gap:8px;align-items:flex-start}.lk-verdict{font-weight:700;font-size:15px}.lk-verdict.ok{color:var(--lk-good)}.lk-verdict.bad{color:var(--lk-bad)}.lk-steps{margin:0;padding-left:18px;font:13px/1.6 'JetBrains Mono',monospace;border-left:3px solid #ffb347}
.lk-result{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:10px 0}.lk-result .lk-row{justify-content:center}.lk-xp{font:700 13px 'JetBrains Mono',monospace!important;color:var(--g-accent,#7962b1)}.lk-note{color:var(--g-muted,#5b6478);font-size:13.5px!important;max-width:64ch}.lk-rev{width:100%;text-align:left}.lk-rev summary{cursor:pointer;font-weight:600;font-size:14px;margin:8px 0}.lk-score{font:700 64px/1 'JetBrains Mono',monospace;color:var(--g-accent,#7962b1)}
.lk-card{display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;min-height:220px;padding:22px;border-radius:20px;border:1px solid var(--g-edge,rgba(0,0,0,.18));background:var(--g-surface,rgba(255,255,255,.7));color:inherit;cursor:pointer;text-align:center;width:100%}.lk-card-k{font:600 11.5px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--g-muted,#5b6478)}.lk-card-f{font:600 clamp(19px,2.6vw,24px)/1.35 'Source Serif 4',Georgia,serif;max-width:34ch}.lk-card-q{font:500 14px/1.45 'IBM Plex Sans',sans-serif;color:var(--g-muted,#5b6478);max-width:52ch}.lk-card-b{font:500 17px/1.55 'IBM Plex Sans',sans-serif}.lk-card-hint{font-size:12px;color:var(--g-muted,#5b6478)}.lk-card.back{background:var(--g-active,rgba(255,210,122,.3));cursor:default}
.lk-clock{display:flex;flex-wrap:wrap;gap:8px 18px;font:600 14px 'JetBrains Mono',monospace;align-items:center}.lk-time{font-size:22px;font-weight:700}.lk-time.low{color:var(--lk-bad)}
.lk-bins{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:10px}.lk-bin{min-height:150px;padding:12px;border-radius:16px;border:2px dashed var(--g-edge,rgba(0,0,0,.3));background:var(--g-well,rgba(0,0,0,.04));color:inherit;cursor:pointer;display:flex;flex-direction:column;gap:8px;text-align:left;font:inherit}.lk-bin b{font:600 14px 'Source Serif 4',Georgia,serif}.lk-bin span{display:flex;flex-wrap:wrap;gap:5px}.lk-bin i{font:normal 600 12px 'IBM Plex Sans',sans-serif;padding:4px 8px;border-radius:99px;background:rgba(47,158,110,.22)}.lk-bin.no,.lk-mark.no{animation:lk-shake .4s}
.lk-goal{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;padding:12px 14px;border-radius:14px;background:var(--g-active,rgba(255,210,122,.3));font-size:14.5px}.lk-goal.won{background:rgba(47,158,110,.25)}.lk-live{font:600 12px 'JetBrains Mono',monospace}.lk-hint{font-size:13.5px}.lk-hint summary{cursor:pointer;font-weight:600}
.lk-sim{min-width:0}.lk-partwrap{position:relative}.lk-ask{font-size:17px;padding:10px 14px;border-radius:14px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.12))}
.lk-marks{position:absolute;inset:0;pointer-events:none;z-index:6}.lk-partwrap .mk-hud{opacity:0}.lk-partwrap .mk-ctl,.lk-partwrap .mk-ro,.lk-partwrap .mk-hint{display:none}.lk-mark{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:2px solid #fff;background:#12203b;color:#fff;font:700 14px 'JetBrains Mono',monospace;cursor:pointer;pointer-events:auto;box-shadow:0 2px 8px rgba(0,0,0,.45);padding:0}.lk-mark.ok{background:var(--lk-good,#2f9e6e)}.lk-mark.no{background:#d0463f}
.lk-cert{width:100%;height:auto;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25)}
.lk-paper{background:#fff;color:#111;padding:28px 32px;border-radius:8px;font:13.5px/1.55 'IBM Plex Sans',Arial,sans-serif}.lk-paper h1{font:700 22px/1.25 Georgia,serif;margin:0 0 6px;color:#111}.lk-paper h2{font:700 15px Georgia,serif;margin:16px 0 6px;color:#111}.lk-paper h3{font:700 13.5px Georgia,serif;margin:10px 0 4px;color:#111}.lk-paper p{font-size:13.5px;color:#111}.lk-pr-meta{color:#333!important}.lk-pr-q li{margin-bottom:10px;break-inside:avoid}.lk-pr-q p{margin:0 0 4px}.lk-pr-o{display:grid;grid-template-columns:1fr 1fr;gap:2px 18px}.lk-pr-t{width:100%;border-collapse:collapse;font-size:12.5px}.lk-pr-t td,.lk-pr-t th{border:1px solid #999;padding:4px 7px;text-align:left;vertical-align:top}.lk-pr-line{display:block;border-bottom:1px solid #999;height:22px}.lk-pr-note{font-size:12px!important;color:#444!important}.lk-pr-foot{margin-top:18px;font-size:11px;color:#666;border-top:1px solid #ccc;padding-top:6px}.lk-pr-break{break-before:page;height:18px}
#lk-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,30px);z-index:9500;max-width:min(92vw,520px);padding:12px 18px;border-radius:14px;background:#12203b;color:#fff;font:600 14px 'IBM Plex Sans',sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:all .25s ease}#lk-toast.on{opacity:1;transform:translate(-50%,0)}
.lk-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden}.lk-confetti i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:lk-fall linear forwards}
@keyframes lk-fall{to{transform:translateY(110vh) rotate(540deg);opacity:.2}}@keyframes lk-shake{25%{transform:translate(calc(-50% - 5px),-50%)}75%{transform:translate(calc(-50% + 5px),-50%)}}.lk-bin.no{animation-name:lk-shake2}@keyframes lk-shake2{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.lk-match{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lk-match>div{display:flex;flex-direction:column;gap:8px}.lk-opt.sel{border-color:#ffb347;background:linear-gradient(135deg,rgba(255,210,122,.5),rgba(255,179,71,.35))}
#lk-dock{position:fixed;right:14px;bottom:12px;z-index:8000;display:flex;gap:4px;padding:6px;border-radius:99px;background:rgba(18,32,59,.92);box-shadow:0 8px 28px rgba(0,0,0,.4);backdrop-filter:blur(8px)}#lk-dock button{display:flex;align-items:center;gap:7px;border:0;border-radius:99px;background:transparent;color:#fff;font:600 13px 'IBM Plex Sans',system-ui,sans-serif;padding:9px 14px;cursor:pointer;min-height:40px}#lk-dock button:hover,#lk-dock button:focus-visible{background:rgba(255,255,255,.16);outline:none}#lk-dock button span{font-size:15px;color:#ffd27a}body.lk-docked{padding-bottom:72px}body.lk-lock #lk-dock,body.lk-present #lk-dock{display:none}
#lk-chal{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:8500;width:min(720px,calc(100vw - 20px));max-width:none;margin:0;gap:6px;padding:12px 14px;border-radius:16px;background:var(--g-bg,#f3f1fa);border:2px solid #ffb347;box-shadow:0 12px 34px rgba(0,0,0,.35);overflow:hidden}#lk-chal.won{border-color:var(--lk-good)}.lk-chal-top{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-size:14.5px}.lk-chal-goal{font-size:14.5px;line-height:1.45}
.lk-tick .tick-glyph{font-size:15px}.lk-tick .tick-count{display:block}#lk-tt{flex:1 1 220px;min-width:0}
body.lk-present .rail,body.lk-present .topbar,body.lk-present #glass-navigation,body.lk-present .glass-shell-nav,body.lk-present .back-link,body.lk-present .lk-topicbar,body.lk-present .lk-strip{display:none!important}body.lk-present .app{grid-template-columns:1fr!important}body.lk-present .content{max-width:none!important;padding:18px 3vw!important;font-size:118%}body.lk-present .topic-head h1{font-size:clamp(34px,5vw,56px)}body.lk-present .content-list,body.lk-present .note-box,body.lk-present .item-title{font-size:120%}body.lk-present,body.lk-present *{cursor:none!important}
#lk-laser{position:fixed;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#fff 0 18%,#ff2d2d 30% 55%,rgba(255,45,45,0) 72%);box-shadow:0 0 18px 6px rgba(255,45,45,.55);z-index:9800;pointer-events:none;display:none}body.lk-present #lk-laser{display:block}#lk-exit{position:fixed;right:14px;top:14px;z-index:9700;display:none;font:600 12px 'IBM Plex Sans',sans-serif;padding:8px 12px;border-radius:10px;border:0;background:rgba(18,32,59,.85);color:#fff;cursor:pointer!important;opacity:.35}#lk-exit:hover,#lk-exit:focus{opacity:1}body.lk-present #lk-exit{display:block}
.lk-sheet:not([data-page=""]) .lk-sheet-top h2{visibility:hidden}
@media (max-width:640px){#lk-dock{right:50%;transform:translateX(50%)}#lk-dock button{padding:9px 11px}#lk-dock b{display:none}#lk-dock button span{font-size:18px}.lk-match{gap:8px}.lk-sheet{padding:0}.lk-sheet-in{border-radius:0;min-height:100%;padding:14px}.lk-q{font-size:16.5px!important}.lk-bins{grid-template-columns:1fr 1fr}.lk-table th:nth-child(5),.lk-table td:nth-child(5),.lk-table th:nth-child(6),.lk-table td:nth-child(6){display:none}.lk-pr-o{grid-template-columns:1fr}.lk-paper{padding:16px}.lk-mark{width:30px;height:30px;font-size:12px}}
@media (prefers-reduced-motion:reduce){.lk *,#lk-toast{transition:none!important;animation:none!important}}
@media print{body.lk-lock>*:not(.lk-sheet){display:none!important}.lk-sheet{position:static;background:none;padding:0;overflow:visible;backdrop-filter:none}.lk-sheet-in{border:0;box-shadow:none;width:100%!important;padding:0;background:#fff}.lk-sheet-top,#lk-toast{display:none!important}.lk-paper{padding:0;border-radius:0}body.lk-lock{overflow:visible;background:#fff!important}}`;

  /* ================= start ================= */
  LK.init = (cfg) => {
    CFG = cfg; load();
    if (!$("#lk-css")) { const st = document.createElement("style"); st.id = "lk-css"; st.textContent = css; document.head.appendChild(st); }
    if (cfg.presentCss && !$("#lk-css2")) { const s2 = document.createElement("style"); s2.id = "lk-css2"; s2.textContent = cfg.presentCss; document.head.appendChild(s2); }
    if (cfg.dock) { if (document.body) dock(); else document.addEventListener("DOMContentLoaded", dock); }
    if (cfg.manifest && !$("link[rel=manifest]")) { const l = document.createElement("link"); l.rel = "manifest"; l.href = cfg.manifest; document.head.appendChild(l); }
    if (cfg.sw && "serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.getRegistration().then((r) => { if (r) navigator.serviceWorker.register(cfg.sw || "/sw.js").catch(() => {}); }).catch(() => {});
    return LK;
  };
  LK.state = () => ST; LK.cfg = () => CFG; LK.level = level; LK.best = best; LK._ = { topicQs, dailyQs, cards, bankQs, chalList: () => chalList(), runChallenge: (ch) => (ch.page ? runPageChallenge(ch) : runChallenge(ch)), games: () => gameIds() };
})();
