/* theme-toggle.js (v0.2.0) – tlačidlo vzhľadu: automaticky -> svetlý -> tmavý -> automaticky.
   Bez JavaScriptu tlačidlo ostane skryté a vzhľad sa riadi nastavením systému. */
(function () {
  var button = document.getElementById('theme-toggle');
  if (!button) return;
  var root = document.documentElement;
  var order = ['auto', 'light', 'dark'];

  function current() {
    var t = root.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : 'auto';
  }

  function render() {
    button.textContent = button.getAttribute('data-' + current());
  }

  button.addEventListener('click', function () {
    var next = order[(order.indexOf(current()) + 1) % order.length];
    if (next === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', next);
    }
    try {
      if (next === 'auto') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', next);
      }
    } catch (e) {
      /* voľba sa len neuloží */
    }
    render();
  });

  button.hidden = false;
  render();
})();
