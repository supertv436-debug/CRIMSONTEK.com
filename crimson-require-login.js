/**
 * Доступ только после регистрации или входа (operator_access.html).
 * Сессия: localStorage c_user + c_pass.
 * Публично: operator_access.html, login.html, crimson_chat.html.
 */
(function () {
  'use strict';
  var REQUIRED_AUTH_REV = '2';

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
      var rev = localStorage.getItem('c_auth_rev');
      if (u == null || p == null) return false;
      if (String(u).trim() === '') return false;
      if (String(p) === '') return false;
      if (String(rev || '') !== REQUIRED_AUTH_REV) return false;
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
      localStorage.removeItem('crimson_email');
      localStorage.removeItem('c_auth_rev');
      localStorage.removeItem('c_role');
      localStorage.removeItem('crimson_ai_key');
      sessionStorage.removeItem('crimson_admin_feed_unlock');
      sessionStorage.removeItem('crimson_admin_media_ok');
      sessionStorage.removeItem('crimson_pending_reg_otp');
    } catch (e) {}
    window.location.replace('operator_access.html');
  };

  var pub = { 'operator_access.html': 1, 'login.html': 1, 'crimson_chat.html': 1 };
  if (pub[pageFile()]) return;

  if (!hasOperatorSession()) {
    window.location.replace('operator_access.html');
  }
})();
