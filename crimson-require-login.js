/**
 * Доступ только после регистрации или входа (operator_access.html).
 * Сессия: localStorage c_user + c_pass.
 * Публично: operator_access.html, login.html, crimson_chat.html.
 */
(function () {
  'use strict';

  function pageFile() {
    var path = String(window.location.pathname || '').replace(/\\/g, '/');
    var segments = path.split('/').filter(function (s) {
      return s.length > 0;
    });
    var last = segments.length ? segments[segments.length - 1] : '';
    try {
      last = decodeURIComponent(last);
    } catch (e1) {
      /* оставляем как есть */
    }
    last = String(last).toLowerCase();
    if (!last) return 'index.html';
    return last;
  }

  function hasOperatorSession() {
    try {
      var u = localStorage.getItem('c_user');
      var p = localStorage.getItem('c_pass');
      if (u == null || p == null) return false;
      if (String(u).trim() === '') return false;
      if (String(p) === '') return false;
      return true;
    } catch (err) {
      return false;
    }
  }

  window.crimsonIsLoggedIn = function () {
    return hasOperatorSession();
  };

  window.crimsonLogout = function () {
    try {
      localStorage.removeItem('c_user');
      localStorage.removeItem('c_pass');
      localStorage.removeItem('c_verified');
      localStorage.removeItem('crimson_phone');
      localStorage.removeItem('c_role');
      localStorage.removeItem('crimson_ai_key');
      localStorage.removeItem('crimson_admin_feed_unlock');
    } catch (e) {}
    window.location.replace('operator_access.html');
  };

  var pub = { 'operator_access.html': 1, 'login.html': 1, 'crimson_chat.html': 1 };
  if (pub[pageFile()]) return;

  if (!hasOperatorSession()) {
    window.location.replace('operator_access.html');
  }
})();
