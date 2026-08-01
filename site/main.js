document.documentElement.classList.add('js');

// theme control: System → Light → Dark, persisted across pages
const THEME_LABEL = { system: 'Auto', light: 'Light', dark: 'Dark' };
const THEME_COLOR = { light: '#f5f5f3', dark: '#0f1115' };
const themeBtn = document.querySelector('.themebtn');
function currentTheme() {
  try { const t = localStorage.getItem('theme'); if (t === 'dark' || t === 'light') return t; } catch (e) {}
  return 'system';
}
function applyTheme(mode) {
  const html = document.documentElement;
  try {
    if (mode === 'system') { delete html.dataset.theme; localStorage.removeItem('theme'); }
    else { html.dataset.theme = mode; localStorage.setItem('theme', mode); }
  } catch (e) {}
  const effective = mode === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    if (!m.media || matchMedia(m.media).matches || mode !== 'system') m.content = THEME_COLOR[effective];
  });
  if (themeBtn) {
    themeBtn.textContent = THEME_LABEL[mode];
    themeBtn.setAttribute('aria-label', 'Color theme: ' + mode + ' — activate to change');
  }
}
if (themeBtn) {
  applyTheme(currentTheme());
  themeBtn.addEventListener('click', () => {
    const order = ['system', 'light', 'dark'];
    applyTheme(order[(order.indexOf(currentTheme()) + 1) % order.length]);
  });
}

// mobile navigation
const btn = document.querySelector('.menubtn');
const links = document.getElementById('sitemenu');
if (btn && links) {
  const setOpen = open => {
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  };
  btn.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) setOpen(false);
  });
}

// numbered-step scroll pattern (position only — content stays legible)
const steps = document.querySelectorAll('.step');
if (steps.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  steps.forEach(s => io.observe(s));
} else {
  steps.forEach(s => s.classList.add('active'));
}

// per-seat mailto builder
const BODY = seat => [
  'Seat: ' + seat, 'Who we are:', 'Why this seat:',
  "Where we'd operate (region/market):",
  "What we'd need first (grant / audit / introductions / nothing):"
].join('\r\n');
document.querySelectorAll('[data-seat]').forEach(a => {
  const seat = a.getAttribute('data-seat');
  a.href = 'mailto:lead@onym.app?subject=' +
    encodeURIComponent('Seat interest: ' + seat) +
    '&body=' + encodeURIComponent(BODY(seat));
});
