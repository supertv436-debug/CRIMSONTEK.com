/**
 * Открытие/закрытие бокового меню (вызывается из страниц с .ct-burger).
 */
(function () {
  function qs(s, r) {
    return (r || document).querySelector(s);
  }
  document.addEventListener('DOMContentLoaded', function () {
    var burger = qs('.ct-burger');
    var drawer = qs('.ct-drawer');
    var overlay = qs('.ct-drawer-overlay');
    if (!burger || !drawer || !overlay) return;

    function close() {
      drawer.classList.remove('on');
      overlay.classList.remove('on');
      document.body.style.overflow = '';
    }
    function open() {
      drawer.classList.add('on');
      overlay.classList.add('on');
      document.body.style.overflow = 'hidden';
    }

    burger.addEventListener('click', function () {
      if (drawer.classList.contains('on')) close();
      else open();
    });
    overlay.addEventListener('click', close);
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        close();
      });
    });
  });
})();
