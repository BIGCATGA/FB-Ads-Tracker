/**
 * app.js — โครงเว็บ: ล็อกอิน, เมนู, เปลี่ยนหน้า (#/home …), ตั้งค่า
 * หน้าแต่ละหน้าอยู่ใน js/pages/*.js และลงทะเบียนด้วย App.page(name, {...})
 */
(function () {
  'use strict';
  const esc = (s) => UI.esc(s), icon = (...a) => UI.icon(...a);
  const pages = {};
  const NAV = [
    ['home', 'หน้าแรก', 'home'],
    ['chats', 'บันทึกแชท', 'chat'],
    ['report', 'สรุปแคมเปญ', 'chart'],
    ['ads', 'แคมเปญ/โฆษณา', 'megaphone'],
    ['spend', 'ค่าแอด', 'wallet'],
  ];
  let current = null;
  let root = null;

  function page(name, def) { pages[name] = def; }

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [name, qs] = h.split('?');
    const params = {};
    new URLSearchParams(qs || '').forEach((v, k) => { params[k] = v; });
    return { name: pages[name] ? name : 'home', params };
  }

  // ---------- ล็อกอิน ----------
  function needLogin() {
    current = null;
    root.innerHTML =
      '<div class="login"><form class="card" id="login-form" autocomplete="on">' +
      '<div class="brand"><div class="brand-mark">B</div><div><div class="brand-name">FB Ads Tracker</div><div class="brand-sub">BIGCAT รับซื้อ</div></div></div>' +
      '<h1>เข้าสู่ระบบ</h1>' +
      (Api.isDemo() ? '<div class="callout">โหมดทดลอง — ใส่ชื่ออะไรก็ได้ และ PIN ตัวเลข 4 หลักขึ้นไป ข้อมูลเป็นตัวอย่างและเก็บในเครื่องนี้เท่านั้น</div>' : '') +
      '<label class="field"><span>ชื่อ</span><input class="input" name="name" autocomplete="username" required autofocus></label>' +
      '<label class="field"><span>PIN</span><input class="input" name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></label>' +
      '<button type="submit" class="btn primary big">เข้าสู่ระบบ</button>' +
      '</form></div>';
    const f = document.getElementById('login-form');
    setTimeout(() => f.name.focus(), 30);
    f.addEventListener('submit', async e => {
      e.preventDefault();
      try {
        await UI.busy(f.querySelector('button'), () => Api.login(f.name.value.trim(), f.pin.value.trim()));
        start();
      } catch (err) { /* busy แจ้งแล้ว */ }
    });
  }

  // ---------- โครงหลัก ----------
  function shell() {
    const me = Api.me() || {};
    const initials = String(me.name || '?').trim().slice(0, 2).toUpperCase();
    root.innerHTML =
      '<div class="wrap">' +
      '<header class="topbar">' +
      '<a class="brand" href="#/home"><div class="brand-mark">B</div><div><div class="brand-name">FB Ads Tracker</div><div class="brand-sub">BIGCAT รับซื้อ</div></div></a>' +
      '<nav class="nav" aria-label="เมนูหลัก">' + NAV.map(n => '<a href="#/' + n[0] + '" data-nav="' + n[0] + '">' + icon(n[2], 18) + '<span>' + n[1] + '</span>' +
        (n[0] === 'chats' ? '<span class="badge" data-stale hidden></span>' : '') + '</a>').join('') + '</nav>' +
      '<span class="spacer"></span>' +
      '<form class="search" id="top-search" role="search"><label class="sr" for="top-q">ค้นหาลูกค้า</label>' + icon('search', 18, '#6B6A78', 2) +
      '<input id="top-q" type="search" placeholder="ค้นหาชื่อลูกค้า, สินค้า…"></form>' +
      '<button type="button" class="icon-btn" id="btn-settings" aria-label="ตั้งค่า">' + icon('gear', 20) + '</button>' +
      '<button type="button" class="avatar" id="btn-me" aria-label="บัญชี ' + esc(me.name) + '" title="' + esc(me.name) + '">' + esc(initials) + '</button>' +
      '</header>' +
      '<main id="page" style="display:flex;flex-direction:column;gap:24px"></main>' +
      '</div>';

    const main = document.getElementById('page');
    ['click', 'change', 'input', 'submit'].forEach(type => {
      main.addEventListener(type, e => {
        const p = current && pages[current.name];
        const fn = p && p['on' + type[0].toUpperCase() + type.slice(1)];
        if (fn) fn(e, main);
      });
    });
    document.getElementById('top-search').addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('top-q').value.trim();
      location.hash = '#/chats?q=' + encodeURIComponent(q);
    });
    document.getElementById('btn-settings').addEventListener('click', settingsModal);
    document.getElementById('btn-me').addEventListener('click', meModal);
  }

  function render() {
    if (!current || !Store.d()) return;
    const main = document.getElementById('page');
    if (!main) return;
    const p = pages[current.name];
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === current.name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const stale = Metrics.staleChats(Store.chats(), Store.sMap(), Store.today(), Store.settings().stale_days, Store.settings().stale_max_days).length;
    const badge = document.querySelector('[data-stale]');
    if (badge) { badge.hidden = !stale; badge.textContent = stale; badge.title = 'ต้องตาม ' + stale + ' ราย'; }
    document.title = p.title + ' · FB Ads Tracker';
    const y = window.scrollY;
    p.render(main);
    if (current.keepScroll) window.scrollTo(0, y);
    current.keepScroll = true;
  }

  function route() {
    if (!Api.me()) { needLogin(); return; }
    if (!document.getElementById('page')) return;
    const r = parseHash();
    current = { name: r.name, params: r.params, keepScroll: false };
    const p = pages[r.name];
    if (p.onEnter) p.onEnter(r.params);
    render();
    window.scrollTo(0, 0);
  }

  async function start() {
    shell();
    const main = document.getElementById('page');
    main.innerHTML = '<div class="loading"><span class="spin"></span>กำลังโหลดข้อมูล…</div>';
    try {
      await Store.load();
    } catch (err) {
      if (!Api.me()) return; // needLogin ทำงานไปแล้ว
      main.innerHTML = '<section class="card"><h2>โหลดข้อมูลไม่สำเร็จ</h2><p>' + esc(err.message) + '</p><button type="button" class="btn dark" id="retry" style="align-self:flex-start">ลองใหม่</button></section>';
      document.getElementById('retry').addEventListener('click', start);
      return;
    }
    route();
  }

  // ---------- ตั้งค่า ----------
  function settingsModal() {
    const s = Store.settings();
    UI.modal({
      title: 'ตั้งค่า',
      body: '<form id="f-set" class="form-grid">' +
        '<label class="field"><span>เป้าต้นทุนต่อเคสที่ปิดได้ (บาท)</span><input class="input num" name="target_cost_per_won" value="' + esc(s.target_cost_per_won || '') + '" inputmode="numeric"><span class="hint">ใช้ตัดสิน Ad set คุ้ม/ไม่คุ้ม</span></label>' +
        '<label class="field"><span>ค้างกี่วันถึงขึ้น "ต้องตาม"</span><input class="input num" name="stale_days" value="' + esc(s.stale_days) + '" inputmode="numeric"></label>' +
        '<label class="field"><span>ค้างเกินกี่วัน = ลูกค้าหาย (ไม่ต้องตามแล้ว)</span><input class="input num" name="stale_max_days" value="' + esc(s.stale_max_days) + '" inputmode="numeric"></label>' +
        '<label class="field"><span>ชื่อซ้ำภายในกี่วัน = ลูกค้าเดิม</span><input class="input num" name="dup_window_days" value="' + esc(s.dup_window_days) + '" inputmode="numeric"></label>' +
        '<label class="field"><span>ใช้เงินน้อยกว่านี้ยังไม่ตัดสิน Ad set (บาท)</span><input class="input num" name="min_spend_to_judge" value="' + esc(s.min_spend_to_judge) + '" inputmode="numeric"></label>' +
        '</form>' +
        '<p class="muted" style="font-size:13px;margin:14px 0 0">ป้ายสถานะแก้ได้ที่แท็บ STATUSES ในชีตหลังบ้าน</p>' +
        (Api.isDemo() ? '<div class="callout" style="margin-top:14px">โหมดทดลอง — ใส่ API_URL ใน <code>config.js</code> เพื่อต่อชีตจริง</div>' : ''),
      footer: (Api.isDemo() ? '<button type="button" class="btn danger left" data-act="reset">รีเซ็ตข้อมูลตัวอย่าง</button>' : '') +
        '<button type="button" class="btn ghost" data-close>ยกเลิก</button><button type="submit" form="f-set" class="btn primary">บันทึก</button>',
      handlers: {
        reset: () => { window.MockApi.reset(); UI.close(); UI.toast('รีเซ็ตแล้ว'); start(); },
      },
      onSubmit: async (m, form) => {
        const v = UI.formData(form);
        for (const k of Object.keys(v)) {
          const val = v[k].replace(/[,\s฿]/g, '');
          if (val !== '' && !(Number(val) >= 0)) return UI.toast('ใส่ตัวเลขเท่านั้น', true);
          v[k] = val;
        }
        await UI.busy(m.querySelector('[type=submit]'), async () => {
          const cur = Store.d().settings;
          for (const k of Object.keys(v)) if (String(cur[k] || '') !== v[k]) await Store.saveSetting(k, v[k]);
        });
        UI.close(); UI.toast('บันทึกตั้งค่าแล้ว'); render();
      },
    });
  }

  function meModal() {
    const me = Api.me() || {};
    UI.modal({
      title: me.name || 'บัญชี',
      body: '<p style="margin:0" class="muted">ทุกคนที่ล็อกอินแก้ได้ทุกอย่าง — ชื่อนี้จะถูกบันทึกว่าใครเป็นคนบันทึก/แก้</p>' +
        '<p style="margin:10px 0 0;font-size:13px" class="muted">' + (Api.isDemo() ? 'โหมดทดลอง (ข้อมูลในเครื่องนี้)' : 'เชื่อมต่อชีตหลังบ้าน') + '</p>',
      footer: '<button type="button" class="btn ghost" data-close>ปิด</button><button type="button" class="btn dark" data-act="out">' + icon('logout', 18) + 'ออกจากระบบ</button>',
      handlers: { out: () => { Api.logout(); UI.close(); location.hash = '#/home'; needLogin(); } },
    });
  }

  function boot() {
    root = document.getElementById('app');
    window.addEventListener('hashchange', route);
    if (!Api.me()) needLogin(); else start();
  }

  window.App = { page, render, needLogin, start };
  document.addEventListener('DOMContentLoaded', boot);
})();
