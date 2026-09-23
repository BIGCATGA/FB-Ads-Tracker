/**
 * api.js — ตัวเรียกหลังบ้าน (Apps Script)
 *
 * ถ้า web/config.js ยังไม่ใส่ API_URL → ใช้โหมดทดลอง (MockApi ในเบราว์เซอร์ ข้อมูลตัวอย่าง)
 * ใช้:  await Api.login('บอส', '1234');  const data = await Api.call('bootstrap');
 */
(function () {
  'use strict';
  const TOKEN_KEY = 'fbads.token.v1';

  function cfg() { return window.APP_CONFIG || {}; }
  function isDemo() { return !cfg().API_URL || /[?&]demo=1\b/.test(location.search); }

  function getToken() {
    try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null'); } catch (e) { return null; }
  }
  function setToken(t) {
    try { t ? localStorage.setItem(TOKEN_KEY, JSON.stringify(t)) : localStorage.removeItem(TOKEN_KEY); } catch (e) { /* โหมดส่วนตัว */ }
  }

  async function call(action, data) {
    const auth = getToken();
    const req = { action, data: data || {}, token: auth && auth.token };
    let out;
    if (isDemo()) {
      out = await window.MockApi.handle(req);
    } else {
      let res;
      try {
        res = await fetch(cfg().API_URL, {
          method: 'POST',
          // text/plain = ไม่มี preflight (Apps Script ตอบ OPTIONS ไม่ได้)
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(req),
          redirect: 'follow',
        });
      } catch (e) {
        throw new Error('ต่อเซิร์ฟเวอร์ไม่ได้ — เช็คอินเทอร์เน็ตแล้วลองใหม่');
      }
      try { out = await res.json(); } catch (e) { throw new Error('เซิร์ฟเวอร์ตอบผิดรูปแบบ — เช็ค API_URL ใน config.js'); }
    }
    if (!out.ok) {
      if (out.error === 'กรุณาล็อกอินใหม่') { setToken(null); if (window.App) window.App.needLogin(); }
      throw new Error(out.error);
    }
    return out.data;
  }

  async function login(name, pin) {
    const r = await call('login', { name, pin });
    setToken(r);
    return r;
  }

  window.Api = {
    call, login, isDemo,
    logout: () => setToken(null),
    me: () => getToken(),
  };
})();
