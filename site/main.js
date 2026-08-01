document.documentElement.classList.add('js');

// mobile navigation
const btn = document.querySelector('.menubtn');
const links = document.getElementById('sitemenu');
if (btn && links) {
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
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
