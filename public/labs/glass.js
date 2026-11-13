/* Appearance and the focus timer stay in transient URL/UI state; no learner data is stored. */
(() => {
  const subjects = [
    ['Mathematics', '/waec-maths-dashboard'],
    ['Physics', '/physics_lab_full'],
    ['Chemistry', '/chemistry-simulations'],
    ['Biology', '/waec-biology-lab'],
    ['Geography', '/waec-geography-lab'],
    ['Agric', '/waec-agric-lab'],
  ];
  const container = document.getElementById('glass-navigation');
  const brand = document.createElement('a');
  brand.className = 'glass-brand';
  brand.href = '/';
  brand.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5L2 9Z M6 11v6q6 5 12 0v-6 M22 9v8"/></svg><span class="glass-word">learnwith<span>nehy</span>.</span>';
  container.append(brand);
  const nav = document.createElement('nav');
  nav.className = 'glass-labs';
  nav.setAttribute('aria-label', 'Study labs');
  for (const [label, path] of subjects) {
    const link = document.createElement('a');
    link.href = path;
    link.textContent = label;
    if (location.pathname.replace(/\.html$/, '').endsWith(path)) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  container.append(nav);
  // Everything after the subject tabs sits in one right-hand group, so the tabs stay centred on every lab.
  const end = document.createElement('div');
  end.className = 'glass-end';
  container.append(end);
  /* Focus timer started on the home page. It arrives as ?focus= (same format as src/lib/focus.ts:
     "<end ms>-<minutes>" while running, "p<seconds left>-<minutes>" while paused) and goes back out on every link. */
  const focus = readFocus(new URLSearchParams(location.search).get('focus'));
  let focusBtn = null, focusSay = null;
  if (focus) {
    focusBtn = document.createElement('button');
    focusBtn.type = 'button';
    focusBtn.className = 'glass-focus';
    focusSay = document.createElement('span');
    focusSay.className = 'glass-sr';
    focusSay.setAttribute('role', 'status');
    focusBtn.addEventListener('click', () => {
      if (focus.left === 0) return;
      if (focus.endAt) { focus.left = secondsLeft(); focus.endAt = null; }
      else focus.endAt = Date.now() + focus.left * 1000;
      paintFocus(); refreshLinks();
    });
    end.append(focusBtn, focusSay);
    paintFocus();
    setInterval(() => { if (focus.endAt) paintFocus(); }, 1000);
  }
  function readFocus(value) {
    const m = /^(p?)(\d{1,15})-(\d{1,3})$/.exec(value || '');
    if (!m) return null;
    const minutes = +m[3], n = +m[2], now = Date.now();
    if (minutes < 1 || minutes > 180) return null;
    if (m[1]) return n >= 1 && n <= minutes * 60 ? { minutes, endAt: null, left: n } : null;
    const left = Math.ceil((n - now) / 1000);
    if (left > minutes * 60 + 5 || now - n > 3600000) return null;
    return { minutes, endAt: n, left: Math.max(0, left) };
  }
  function secondsLeft() { return focus.endAt ? Math.max(0, Math.ceil((focus.endAt - Date.now()) / 1000)) : focus.left; }
  function focusParam() {
    if (!focus) return '';
    if (focus.endAt) return focus.endAt + '-' + focus.minutes;
    return focus.left > 0 ? 'p' + focus.left + '-' + focus.minutes : '';
  }
  function paintFocus() {
    const was = focus.left;
    focus.left = secondsLeft();
    const mm = String(Math.floor(focus.left / 60)).padStart(2, '0'), ss = String(focus.left % 60).padStart(2, '0');
    if (focus.left === 0) {
      focusBtn.textContent = '✓ Break time';
      focusBtn.setAttribute('aria-label', 'Focus session finished. Take a 5 minute break.');
      focusBtn.dataset.state = 'done';
      if (was > 0) focusSay.textContent = 'Focus session finished. Take a 5 minute break.';
      return;
    }
    focusBtn.textContent = (focus.endAt ? '⏱ ' : '⏸ ') + mm + ':' + ss;
    focusBtn.setAttribute('aria-label', 'Focus timer, ' + +mm + ' minutes ' + +ss + ' seconds left. ' + (focus.endAt ? 'Pause' : 'Resume'));
    focusBtn.dataset.state = focus.endAt ? 'running' : 'paused';
  }
  const appearance = document.createElement('div');
  appearance.className = 'glass-appearance';
  appearance.setAttribute('role', 'group');
  appearance.setAttribute('aria-label', 'Appearance');
  // "Day" is stored as appearance=default, so links from older pages keep working.
  const icons = {
    Day: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    Night: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
  };
  const buttons = ['Day', 'Night'].map((label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = icons[label] + label;
    button.addEventListener('click', () => setAppearance(label === 'Night'));
    appearance.append(button);
    return button;
  });
  end.append(appearance);
  // The learning layer (learn-kit.js) adds a floating tools bar; on wide screens it moves into this top bar
  // so it never covers simulation controls. Narrow screens keep it along the bottom.
  const wide = window.matchMedia('(min-width: 1100px)');
  function placeDock() {
    const dock = document.getElementById('lk-dock');
    if (!dock) return;
    if (wide.matches && dock.parentNode !== end) end.insertBefore(dock, focusBtn || appearance);
    else if (!wide.matches && dock.parentNode === end) document.body.append(dock);
    document.body.classList.toggle('glass-dock-in-nav', dock.parentNode === end);
  }
  placeDock();
  new MutationObserver(placeDock).observe(document.body, { childList: true });
  wide.addEventListener('change', placeDock);
  let isNight = false;
  function setAppearance(night) {
    isNight = night;
    document.documentElement.classList.toggle('night', night);
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(night === (index === 1))));
    refreshLinks();
  }
  // Rewrites the address bar and every lab link so appearance and the focus timer carry over.
  function refreshLinks() {
    const appearanceValue = isNight ? 'night' : 'default', focusValue = focusParam();
    const url = new URL(location.href);
    url.searchParams.set('appearance', appearanceValue);
    if (focusValue) url.searchParams.set('focus', focusValue); else url.searchParams.delete('focus');
    history.replaceState(null, '', url);
    const query = '?appearance=' + appearanceValue + (focusValue ? '&focus=' + focusValue : '');
    nav.querySelectorAll('a').forEach((link, i) => { link.href = subjects[i][1] + query; });
    brand.href = '/' + query;
  }
  setAppearance(new URLSearchParams(location.search).get('appearance') === 'night');
  document.querySelectorAll('input[type=text], input:not([type])').forEach(input => {
    if (!input.hasAttribute('aria-label')) input.setAttribute('aria-label', 'Search syllabus topics');
  });
  // Original chemistry topic rows respond to pointer events; expose the same action to keyboards.
  function enhanceTopics() {
    document.querySelectorAll('.topic-item').forEach(item => {
      item.setAttribute('role', 'button');
      item.tabIndex = 0;
      if (!item.dataset.keyboardReady) {
        item.dataset.keyboardReady = 'true';
        item.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); item.click(); }
        });
      }
    });
  }
  enhanceTopics();
  const topicList = document.getElementById('sidebarTopics');
  if (topicList) new MutationObserver(enhanceTopics).observe(topicList, {childList:true, subtree:true});
  // A link ending in #exam (the home page "Practise" buttons) opens the lab straight into Exam mode.
  function openExamFromLink() {
    if (location.hash !== '#exam') return;
    const entry = document.getElementById('examBtn') || document.querySelector('[data-topic="EXAM"]');
    if (entry) entry.click();
  }
  if (document.readyState === 'complete') openExamFromLink();
  else window.addEventListener('load', openExamFromLink, { once: true });
  window.addEventListener('hashchange', openExamFromLink);
})();
