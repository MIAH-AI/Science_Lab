/* Appearance stays in transient URL/UI state; no learner data is stored. */
(() => {
  const subjects = [
    ['Mathematics', '/waec-maths-dashboard'],
    ['Physics', '/physics_lab_full'],
    ['Chemistry', '/chemistry-simulations'],
    ['Biology', '/waec-biology-lab'],
    ['Geography', '/waec-geography-lab'],
  ];
  const container = document.getElementById('glass-navigation');
  const brand = document.createElement('a');
  brand.className = 'glass-brand';
  brand.href = '/';
  brand.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m2 9 10-5 10 5-10 5L2 9Z M6 11v6q6 5 12 0v-6 M22 9v8"/></svg>learnwithnehy.';
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
  const appearance = document.createElement('div');
  appearance.className = 'glass-appearance';
  appearance.setAttribute('role', 'group');
  appearance.setAttribute('aria-label', 'Appearance');
  const buttons = ['Default', 'Night'].map((label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => setAppearance(label === 'Night'));
    appearance.append(button);
    return button;
  });
  container.append(appearance);
  function setAppearance(night) {
    document.documentElement.classList.toggle('night', night);
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(night === (index === 1))));
    const url = new URL(location.href);
    url.searchParams.set('appearance', night ? 'night' : 'default');
    history.replaceState(null, '', url);
    nav.querySelectorAll('a').forEach((link, i) => { link.href = subjects[i][1] + '?appearance=' + (night ? 'night' : 'default'); });
    brand.href = '/?appearance=' + (night ? 'night' : 'default');
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
