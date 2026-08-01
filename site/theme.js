// Applies the saved theme preference before first paint. Loaded synchronously
// in <head>, before the stylesheet, so there is no flash of the wrong theme.
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
  } catch (e) { /* storage unavailable — system preference applies */ }
})();
