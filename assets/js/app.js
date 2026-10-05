/**
 * App — หน้าจอทั้งหมด (Dashboard / บันทึกแชท / แคมเปญ → Ad set → โฆษณา / ตั้งค่า)
 */
(function () {
  var C = window.Calc, F = C.fmt, esc = window.Charts.esc, CH = window.Charts;
  var root = document.getElementById('root');

  var S = {
    data: null,
    page: 'dashboard',
    filter: { preset: '30d', from: '', to: '', campaign: '' },
    chatFilter: { q: '', status: '', campaign: '', limit: 100 },
    chartTab: 'day',
    busy: false
  };

  // ---------- Icons ----------
  var I = {
    dash: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2.5"/><rect x="13" y="3" width="8" height="8" rx="2.5"/><rect x="3" y="13" width="8" height="8" rx="2.5"/><rect x="13" y="13" width="8" height="8" rx="2.5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    mega: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4a1 1 0 001 1h2l5 4V5L7 9H5a1 1 0 00-1 1z"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="3"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    sun: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14.5a6.5 6.5 0 013.5 5.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.5 9.5"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></svg>',
    copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg>',
    est: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5h6v3H9zM8.5 11h7M8.5 14.5h7M8.5 18h4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>'
  };
  var NAV = [
    { id: 'kpi', label: 'ต้นทุนต่อหมวด', short: 'ต้นทุน', icon: I.coin, group: 'biz' },
    { id: 'est', label: 'เคสประเมิน', short: 'ประเมิน', icon: I.est, group: 'biz' },
    { id: 'time', label: 'วิเคราะห์ช่วงเวลา', short: 'ช่วงเวลา', icon: I.clock, group: 'biz' },
    { id: 'dashboard', label: 'ภาพรวม Ads Facebook', short: 'ภาพรวม FB', icon: I.dash, group: 'fb' },
    { id: 'chats', label: 'บันทึกแชท', short: 'แชท', icon: I.chat, group: 'fb' },
    { id: 'campaigns', label: 'แคมเปญ', short: 'แคมเปญ', icon: I.mega, group: 'fb' },
    { id: 'settings', label: 'ตั้งค่า', short: 'ตั้งค่า', icon: I.gear, group: 'sys' }
  ];

  // ---------- Helpers ----------
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function today() { return C.iso(new Date()); }
  function initials(n) { return String(n || '?').trim().slice(0, 2).toUpperCase(); }
  function toast(msg, err) {
    var t = document.createElement('div');
    t.className = 'toast' + (err ? ' err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, err ? 4200 : 2400);
  }
  function fail(e) {
    if (e && e.code === 'AUTH') { API.token(null); boot(); }
    toast(e && e.message ? e.message : 'เกิดข้อผิดพลาด', true);
  }
  /** แปลงวันที่ทุกรูปแบบ → yyyy-mm-dd (รองรับ ISO timestamp, d/m/yyyy, ปี พ.ศ., ข้อความวันที่) */
  function nd(v) {
    if (v == null || v === '') return '';
    var s = String(v).trim();
    var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (m) { var y = Number(m[3]); if (y < 100) y += 2000; if (y > 2400) y -= 543; return y + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2); }
    var d = new Date(s);
    return isNaN(d) ? '' : C.iso(d);
  }
  function nn(v) { if (v === '' || v == null) return ''; var n = Number(String(v).replace(/[,฿\s]/g, '')); return isNaN(n) ? '' : n; }
  function normalize(d) {
    d.campaigns = d.campaigns || []; d.budgets = d.budgets || []; d.adsets = d.adsets || []; d.spend = d.spend || [];
    d.chats.forEach(function (c) { c.date = nd(c.date); c.closed_date = nd(c.closed_date); c.amount = nn(c.amount); });
    d.spend.forEach(function (s) { s.date = nd(s.date); s.date_to = nd(s.date_to) || s.date; s.amount = nn(s.amount) || 0; });
    d.budgets.forEach(function (b) { b.start_date = nd(b.start_date); b.end_date = nd(b.end_date); b.daily_budget = nn(b.daily_budget) || 0; });
    d.campaigns.forEach(function (c) { c.start_date = nd(c.start_date); c.end_date = nd(c.end_date); });
    d.fbads = (d.fbads || []).map(function (r) { r.date = nd(r.date); return r; });
    d.gads = (d.gads || []).map(function (r) { r.date = nd(r.date); r.cost = Number(r.cost) || 0; r.conversions = Number(r.conversions) || 0; return r; });
    d.purchases = (d.purchases || []).map(function (a) { var o = Array.isArray(a) ? { date: nd(a[0]), category: a[1], fb: !!a[2], line: !!a[3], bought: a[4], repair: a[5], sell: a[6], fbName: a[7] || '', detail: a[8] || '' } : a, pc = C.prodCat(o.category, o.detail); o.k = pc.k; o.cat = pc.sub; o.guess = pc.guess; return o; });
    d.estimates = (d.estimates || []).map(function (a) { var o = Array.isArray(a) ? { date: nd(a[0]), hour: Number(a[1]), category: a[2], fb: !!a[3], line: !!a[4], closed: !!a[5], detail: a[6] || '' } : a, pc = C.prodCat(o.category, o.detail); o.k = pc.k; o.cat = pc.sub; o.guess = pc.guess; return o; }).filter(function (e) { return e.date; });
    d.fbhourly = (d.fbhourly || []).map(function (a) { return Array.isArray(a) ? { date: nd(a[0]), hour: Number(a[1]) || 0, campaign: a[2], adset: a[3], spend: Number(a[4]) || 0, chats: Number(a[5]) || 0 } : a; }).filter(function (e) { return e.date; });
    d.inbox = (d.inbox || []).map(function (r) { r.psid = String(r.psid); r.first_date = nd(r.first_date); r.last_date = nd(r.last_date); return r; });
    d.spend = d.spend.filter(function (s) { return s.date; });
    return d;
  }
  function campaigns() {
    var set = {};
    (S.data.campaigns || []).forEach(function (c) { if (c.name) set[c.name] = true; });
    S.data.ads.forEach(function (a) { if (a.campaign) set[a.campaign] = true; });
    S.data.chats.forEach(function (c) { if (c.campaign) set[c.campaign] = true; });
    return Object.keys(set).sort();
  }
  function adsets() {
    var set = {};
    S.data.ads.forEach(function (a) { if (a.adset) set[a.adset] = true; });
    return Object.keys(set).sort();
  }
  /** รูปลูกค้า (จาก Facebook) — โหลดไม่ได้/ไม่มี → ตัวอักษรย่อ */
  function face(name, pic, size) {
    var st = size ? ' style="width:' + size + 'px;height:' + size + 'px"' : '';
    return '<span class="face"' + st + '><b>' + esc(initials(name)) + '</b>' + (pic ? '<img src="' + esc(pic) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '') + '</span>';
  }
  function statusPill(key) {
    var s = C.BY_KEY[key] || { color: 'var(--text-3)' };
    return '<span class="pill status-pill"><span class="dot" style="background:' + s.color + '"></span>' + esc(key) + '</span>';
  }
  function opt(v, label, sel) { return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(label == null ? v : label) + '</option>'; }
  function isTrue(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }

  function modal(html, onMount) {
    var back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(back);
    function close() { back.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', onKey);
    $$('[data-close]', back).forEach(function (b) { b.onclick = close; });
    if (onMount) onMount(back.firstChild, close);
    return close;
  }

  /** ยืนยันในหน้า (แทน window.confirm ที่บางที่เปิดไม่ได้) */
  function askConfirm(msg, onYes) {
    modal('<h3>ยืนยัน</h3><p style="font-size:16px;margin:0 0 18px">' + esc(msg) + '</p><div class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button type="button" class="btn" id="cfYes">ตกลง</button></div>',
      function (el, close) { $('#cfYes', el).onclick = function () { close(); onYes(); }; $('#cfYes', el).focus(); });
  }

  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    API.store('fbat_theme', t);
    render();
  }

  // ============================================================
  // Boot / Login
  // ============================================================
  function boot() {
    CH.bindTips();
    if (API.isDemo) { API.token('demo'); }
    if (!API.token()) return renderLogin();
    root.innerHTML = '<div class="loading">กำลังโหลดข้อมูล…</div>';
    API.call('bootstrap').then(function (d) {
      S.data = normalize(d);
      API.outdated = !API.isDemo && (Number(d.backend_version) || 0) < API.MIN_BACKEND;
      var hash = location.hash.replace('#', '');
      if (NAV.some(function (n) { return n.id === hash; })) S.page = hash;
      try { render(); } catch (err) {
        console.error(err);
        root.innerHTML = '<div class="loading"><div style="text-align:center;max-width:560px"><p>แสดงหน้าไม่ได้: ' + esc(err.message) + '</p><p class="muted">ลองกด Ctrl + F5 · ถ้ายังเป็น แคปข้อความนี้มาให้ดู</p></div></div>';
      }
    }).catch(function (e) {
      if (e.code === 'AUTH') { API.token(null); return renderLogin(); }
      root.innerHTML = '<div class="loading"><div style="text-align:center"><p>โหลดข้อมูลไม่ได้: ' + esc(e.message) + '</p><button class="btn" id="retry">ลองใหม่</button></div></div>';
      $('#retry').onclick = boot;
    });
  }

  function renderLogin() {
    root.innerHTML = '<div class="login-wrap"><form class="login" id="loginForm">' +
      '<div class="brand"><div class="brand-mark">B</div><div class="brand-name">' + esc(window.APP_CONFIG.BRAND) + ' <span>Ads</span></div></div>' +
      '<h1>เข้าสู่ระบบ</h1>' +
      '<div class="f"><label for="lgName">ชื่อ</label><select id="lgName"><option>กำลังโหลด…</option></select></div>' +
      '<div class="f"><label for="lgPin">PIN</label><input id="lgPin" class="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" required></div>' +
      '<button class="btn" type="submit" style="justify-content:center">เข้าสู่ระบบ</button>' +
      '<div class="muted" style="font-size:13px">ลืม PIN ให้คนที่เข้าระบบได้ไปตั้งใหม่ที่หน้า ตั้งค่า</div>' +
      '</form></div>';
    API.call('users').then(function (names) {
      var last = API.userName();
      $('#lgName').innerHTML = names.length ? names.map(function (n) { return opt(n, n, last); }).join('') : '<option value="">ยังไม่มีผู้ใช้ — รัน createFirstUser() ใน Apps Script</option>';
    }).catch(fail);
    $('#loginForm').onsubmit = function (e) {
      e.preventDefault();
      var name = $('#lgName').value, pin = $('#lgPin').value;
      API.call('login', { name: name, pin: pin }).then(function (r) {
        API.token(r.token); API.userName(r.name); boot();
      }).catch(fail);
    };
  }

  // ============================================================
  // Shell
  // ============================================================
  function render() {
    var dark = document.documentElement.dataset.theme === 'dark';
    var pendN = (S.data.inbox || []).filter(function (r) { return r.status === 'pending'; }).length;
    var fbOpen = true; try { fbOpen = localStorage.getItem('fbat_fbgrp') !== '0'; } catch (e) {}
    function nItem(n, big) {
      var cnt = n.id === 'chats' ? pendN : 0;
      return '<button data-nav="' + n.id + '" class="ni' + (big ? ' big' : '') + (S.page === n.id ? ' active' : '') + '"><span class="ni-ic">' + n.icon + '</span><span class="ni-tx"><b>' + n.label + '</b>' +
        (big ? '<small><i class="dot fb"></i>Facebook + <i class="dot gg"></i>Google</small>' : '') + '</span>' + (cnt ? '<i class="nav-badge">' + (cnt > 99 ? '99+' : cnt) + '</i>' : '') + '</button>';
    }
    var byId = {}; NAV.forEach(function (n) { byId[n.id] = n; });
    var fbIn = NAV.filter(function (n) { return n.group === 'fb'; }), fbAct = fbIn.some(function (n) { return n.id === S.page; });
    var lastSync = S.data.config.fb_last_sync ? new Date(S.data.config.fb_last_sync) : null;
    var nav = '<div class="nlab">ภาพรวมธุรกิจ</div>' + nItem(byId.kpi, true) + nItem(byId.est) + nItem(byId.time) +
      '<div class="nlab">ช่องทางโฆษณา</div>' +
      '<div class="ngrp' + (fbOpen || fbAct ? ' open' : '') + '"><button class="ngh" id="fbGrp"><b>Facebook Ads</b><span class="chev">' + I.chev + '</span></button><div class="nsub">' + fbIn.map(function (n) { return nItem(n); }).join('') + '</div></div>' +
      '<div class="ngrp soon"><div class="ngh"><b>Google Ads</b><span class="soon-t">เร็วๆ นี้</span></div></div>';
    var bnav = NAV.map(function (n) { var cnt = n.id === 'chats' ? pendN : 0; return '<button data-nav="' + n.id + '" class="' + (S.page === n.id ? 'active' : '') + '">' + n.icon + '<span>' + n.short + '</span>' + (cnt ? '<i class="nav-badge">' + (cnt > 99 ? '99+' : cnt) + '</i>' : '') + '</button>'; }).join('');
    var title = NAV.filter(function (n) { return n.id === S.page; })[0].label;
    root.innerHTML =
      '<div class="app">' +
      '<aside class="sidebar">' +
      '<div class="brand"><div class="brand-mark">' + (S.data.config.page_id ? '<img src="https://graph.facebook.com/' + esc(S.data.config.page_id) + '/picture?type=large" alt="" onerror="this.remove()">' : '') + 'B</div><div class="brand-name">' + esc(S.data.config.brand || window.APP_CONFIG.BRAND) + ' <span>Ads</span></div></div>' +
      '<div class="me"><div class="avatar">' + esc(initials(S.data.me)) + '</div><div><div class="me-name">' + esc(S.data.me) + '</div><div class="me-sub">' + (API.isDemo ? 'โหมดตัวอย่าง' : 'แอดมิน') + '</div></div></div>' +
      '<nav class="nav">' + nav + '</nav>' +
      '<div class="sidebar-foot">' + nItem(byId.settings) +
      (lastSync ? '<div class="syncbox"><span class="pulse"></span><div><b>ดึงข้อมูลอัตโนมัติ</b><small>ล่าสุด ' + lastSync.toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' · ทุก 1 ชม.</small></div></div>' : '') +
      '<div class="label">โหมดสี</div>' +
      '<div class="seg"><button data-theme="light" class="' + (!dark ? 'on' : '') + '">' + I.sun + 'สว่าง</button><button data-theme="dark" class="' + (dark ? 'on' : '') + '">' + I.moon + 'มืด</button></div>' +
      (API.isDemo ? '' : '<button class="linkish" id="logout">ออกจากระบบ</button>') +
      '</div></aside>' +
      '<main class="main">' +
      '<div class="topbar">' +
      '<h1 class="page-title"><small>' + ({ biz: 'ภาพรวมธุรกิจ', fb: 'Facebook Ads', sys: 'ระบบ' })[NAV.filter(function (n) { return n.id === S.page; })[0].group] + '</small>' + title + '</h1>' +
      '<label class="search">' + I.search + '<input id="globalSearch" placeholder="ค้นหาชื่อลูกค้า…" value="' + esc(S.page === 'chats' ? S.chatFilter.q : '') + '"></label>' +
      '<span class="spacer"></span>' +
      (API.isDemo ? '<span class="demo-badge">โหมดตัวอย่าง · ข้อมูลจำลอง</span>' : '') +
      (API.outdated ? '<div class="outdated">⚠️ หลังบ้าน (Apps Script) ยังเป็นเวอร์ชันเก่า — ถ้าบันทึกตอนนี้ข้อมูลบางส่วนจะหายหลังรีเฟรช จึงปิดการบันทึกไว้ก่อน · แก้: วาง Code.gs ใหม่ → Run <b>setup</b> → Deploy → Manage deployments → ✎ → <b>New version</b></div>' : '') +
      '<div class="avatar" title="' + esc(S.data.me) + '" style="width:40px;height:40px">' + esc(initials(S.data.me)) + '</div>' +
      '</div>' +
      '<div id="page"></div>' +
      '</main></div>' +
      '<nav class="bottom-nav">' + bnav + '</nav>';

    $$('[data-nav]').forEach(function (b) {
      b.onclick = function () { if (b.dataset.nav === 'campaigns' && S.page === 'campaigns') S.campNav = null; go(b.dataset.nav); };
    });
    $$('[data-theme]').forEach(function (b) { b.onclick = function () { setTheme(b.dataset.theme); }; });
    if ($('#fbGrp')) $('#fbGrp').onclick = function () { var g = this.parentNode; g.classList.toggle('open'); try { localStorage.setItem('fbat_fbgrp', g.classList.contains('open') ? '1' : '0'); } catch (e) {} };
    if ($('#logout')) $('#logout').onclick = function () { API.token(null); boot(); };
    $('#globalSearch').onkeydown = function (e) {
      if (e.key === 'Enter') { S.chatFilter.q = this.value.trim(); go('chats'); }
    };
    if (S.page === 'chats') $('#globalSearch').oninput = function () { S.chatFilter.q = this.value.trim(); renderChatList(); };

    ({ dashboard: pageDashboard, chats: pageChats, campaigns: pageCampaigns, kpi: pageKpi, est: pageEst, time: pageTime, settings: pageSettings })[S.page]();
  }

  function go(page) {
    S.page = page;
    try { history.replaceState(null, '', '#' + page); } catch (e) {}
    render();
    window.scrollTo(0, 0);
  }

  function refresh() {
    return API.call('bootstrap').then(function (d) { S.data = normalize(d); });
  }

  // ============================================================
  // Dashboard
  // ============================================================
  function pageDashboard() {
    var f = S.filter;
    if (f.preset !== 'custom') {
      var r = C.presetRange(f.preset, S.data, today());
      f.from = r.from; f.to = r.to;
    }
    var m = C.compute(S.data, f);
    var nDays = C.daysIncl(f.from, f.to);
    var prev = f.preset === 'all' ? null : C.compute(S.data, { from: C.addDays(f.from, -nDays), to: C.addDays(f.from, -1), campaign: f.campaign });
    var presets = [['7d', '7 วัน'], ['30d', '30 วัน'], ['month', 'เดือนนี้'], ['lastmonth', 'เดือนก่อน'], ['all', 'ทั้งหมด'], ['custom', 'กำหนดเอง']];
    var charts = [];

    var html = '<div class="filters">' +
      '<div class="chip-group" role="group" aria-label="ช่วงวันที่">' + presets.map(function (p) {
        return '<button data-preset="' + p[0] + '" class="' + (f.preset === p[0] ? 'on' : '') + '">' + p[1] + '</button>';
      }).join('') + '</div>' +
      (f.preset === 'custom' ? '<input type="date" class="field-inline" id="fFrom" value="' + f.from + '"><input type="date" class="field-inline" id="fTo" value="' + f.to + '">' : '<span class="muted">' + F.thRange(f.from, f.to) + '</span>') +
      '<select class="field-inline" id="fCamp">' + opt('', 'ทุกแคมเปญ', f.campaign) + campaigns().map(function (c) { return opt(c, c, f.campaign); }).join('') + '</select>' +
      '<span style="flex:1"></span><button class="btn" id="btnSummary">' + I.copy + 'คัดลอกสรุป</button></div>';

    // ---------- 1) ตัวเลขหลัก ----------
    function delta(cur, old, goodUp) {
      if (!prev || old == null || cur == null || !isFinite(old) || old === 0) return '';
      var v = (cur - old) / old;
      if (Math.abs(v) < 0.005) return '<span class="kd">เท่าเดิม</span>';
      var good = goodUp ? v > 0 : v < 0;
      return '<span class="kd ' + (good ? 'up' : 'down') + '">' + (v > 0 ? '▲ ' : '▼ ') + Math.abs(v * 100).toFixed(0) + '%</span>';
    }
    var cpcTone = m.cpc == null ? '' : m.cpc <= m.target ? 'good' : 'bad';
    html += '<div class="kpi5">' +
      kpi('Lead (ลูกค้าทักใหม่)', F.int(m.leads), 'เฉลี่ย ' + (m.leads / nDays).toFixed(1) + ' คน/วัน', delta(m.leads, prev && prev.leads, true)) +
      kpi('ปิดได้', F.int(m.closed) + ' เคส', 'อัตราปิด ' + F.pct(m.closeRate, 1) + ' ของ Lead', delta(m.closed, prev && prev.closed, true)) +
      kpi('ยอดรับซื้อ', F.baht(m.amount), m.closed ? 'เฉลี่ย ' + F.baht(m.amount / m.closed) + '/เคส' : 'ยังไม่มีเคสปิด', delta(m.amount, prev && prev.amount, true)) +
      kpi('ค่า Ads', m.spend ? F.baht(m.spend) : '–', m.spend ? (m.adsPct != null ? F.pct(m.adsPct, 1) + ' ของยอดรับซื้อ' : 'ยังไม่มียอดรับซื้อ') : 'ยังไม่ได้กรอกในช่วงนี้', delta(m.spend, prev && prev.spend, false)) +
      kpi('ต้นทุน/เคส', F.baht(m.cpc), '<span class="pill ' + cpcTone + '">เป้า ' + F.baht(m.target) + (m.cpc == null ? '' : m.cpc <= m.target ? ' · ผ่าน' : ' · เกิน') + '</span>', delta(m.cpc, prev && prev.cpc, false)) +
      '</div>' + (prev ? '<div class="muted small" style="margin:-8px 0 18px">▲▼ เทียบกับ ' + nDays + ' วันก่อนหน้า (' + F.thRange(C.addDays(f.from, -nDays), C.addDays(f.from, -1)) + ') · เขียว = ดีขึ้น</div>' : '');

    var spendRows = (S.data.spend || []).length;
    if (!m.spend) html += '<div class="nudge" style="margin:0 0 20px">' + (spendRows ? 'มีค่า Ads ที่กรอกไว้ ' + spendRows + ' รายการ แต่ไม่อยู่ในช่วงวันที่/แคมเปญที่เลือก' : 'ยังไม่ได้กรอกค่า Ads — ต้นทุน/Lead และต้นทุน/เคส จะยังคำนวณไม่ได้') + ' · กรอกที่หน้า แคมเปญ → กรอกค่า Ads</div>';

    // ---------- 1.5) ประสิทธิภาพโฆษณา Facebook ----------
    var prevR = prev ? [C.addDays(f.from, -nDays), C.addDays(f.from, -1)] : null;
    var perf = perfSection(f, m, prevR, charts);
    html += perf;

    // ---------- 2) Lead + ปิดได้ ตามเวลา ----------
    html += section('Lead และเคสที่ปิดได้ — แต่ละวัน', 'ดูว่าช่วงไหนคนทักเยอะ/น้อย และเพิ่มงบแล้ว Lead ขึ้นตามไหม',
      '<div class="tabs"><button data-ctab="day" class="' + (S.chartTab === 'day' ? 'on' : '') + '">รายวัน</button><button data-ctab="week" class="' + (S.chartTab === 'week' ? 'on' : '') + '">รายสัปดาห์</button></div>' +
      legend([['Lead', 'var(--primary)'], ['ปิดได้', 'var(--st-5)'], ['เส้นประ = ค่าเฉลี่ย', 'transparent']]) + '<div class="chart-box" id="chLeads"></div>', 'full');
    var g = groupDaily(m.daily, S.chartTab);
    var gl = g.map('leads'), avgL = gl.length ? gl.reduce(function (a, b) { return a + b; }, 0) / gl.length : 0;
    charts.push(['chLeads', { labels: g.labels, tips: g.tips, series: [{ name: 'Lead', color: 'var(--primary)', values: gl }, { name: 'ปิดได้', color: 'var(--st-5)', values: g.map('closed') }], height: 360,
      avg: { value: avgL, label: 'เฉลี่ย ' + (Math.round(avgL * 10) / 10) + ' Lead/' + (S.chartTab === 'week' ? 'สัปดาห์' : 'วัน') }, aria: 'Lead และเคสที่ปิดได้' }]);

    // ---------- 3) Funnel + สถานะ ----------
    var f1 = m.funnel[0].n || 1;
    var funnelItems = m.funnel.map(function (s, i) {
      return { label: (i + 1) + '. ' + s.name, sub: i ? 'ผ่านจากขั้นก่อน ' + F.pct(s.conv) : 'ทุกคนที่ทักมา', value: s.n, display: s.n + ' คน (' + F.pct(s.n / f1) + ')',
        color: m.leak && m.leak.stage === s.stage ? 'var(--bad)' : 'var(--primary)' };
    });
    var leak = m.leak, reason = !leak ? '' : leak.stage === 2 ? 'ทักแล้วไม่ส่งข้อมูลเครื่อง — ดูสคริปต์ตอบแชท/ความเร็วตอบ'
      : leak.stage === 3 ? 'ได้ข้อมูลแล้วยังไม่ได้ประเมินราคา — ตามแชทให้ครบ'
      : leak.stage === 4 ? 'ประเมินราคาแล้วไม่ไปต่อ = ปัญหาอยู่ที่ราคา ไม่ใช่โฆษณา' : 'นัดแล้วไม่ปิด — ดูขั้นตอนรับของ/ตรวจเครื่อง';
    var statusItems = m.statusCounts.filter(function (s) { return s.n; }).sort(function (a, b) { return b.n - a.n; }).map(function (s) {
      return { label: s.key, value: s.n, display: s.n + ' (' + F.pct(s.pct) + ')', color: s.color };
    });
    html += (perf ? section('ลูกค้าตอนนี้อยู่สถานะไหน', 'นับลูกค้าไม่ซ้ำ ' + m.people.length + ' คน · ใช้ดูว่าต้องตามแชทกลุ่มไหน', statusItems.length ? Charts.hbars(statusItems) : '<div class="empty">ยังไม่มีแชท</div>', 'full') : '<div class="grid row-2 mt">' +
      section('ลูกค้าหลุดตรงไหน (Funnel)', 'นับสะสม: คนที่ไปถึงขั้น 3 ถูกนับในขั้น 1–3 ด้วย · แถบแดง = ขั้นที่หลุดมากที่สุด',
        (m.leads ? Charts.hbars(funnelItems, { max: f1 }) + (leak ? '<div class="leak-note">หลุดมากสุดที่ขั้น ' + (leak.stage - 1) + '→' + leak.stage + ' (ผ่านแค่ ' + F.pct(leak.conv) + ') · ' + reason + '</div>' : '') : '<div class="empty">ยังไม่มีแชทในช่วงนี้</div>')) +
      section('ลูกค้าตอนนี้อยู่สถานะไหน', 'นับลูกค้าไม่ซ้ำ ' + m.people.length + ' คน · ใช้ดูว่าต้องตามแชทกลุ่มไหน',
        statusItems.length ? Charts.hbars(statusItems) : '<div class="empty">ยังไม่มีแชท</div>') + '</div>');

    // ---------- 4) เงิน: ค่า Ads vs ยอดรับซื้อ + แคมเปญไหนคุ้ม ----------
    var gw = groupDaily(m.daily, 'week');
    var campItems = m.campaignRows.filter(function (r) { return r.leads || r.spend; }).map(function (r) {
      return { label: r.campaign, value: r.cpl || 0, display: r.cpl == null ? (r.spend ? 'ยังไม่มี Lead' : 'ยังไม่กรอกค่า Ads') : F.baht(r.cpl) + '/Lead',
        sub: 'ค่า Ads ' + (r.spend ? F.baht(r.spend) : '–') + ' · Lead ' + r.leads + ' · ปิด ' + r.closed + (r.cpc != null ? ' · ' + F.baht(r.cpc) + '/เคส' : ''),
        color: r.cpc != null && r.cpc > m.target ? 'var(--bad)' : 'var(--primary)' };
    }).sort(function (a, b) { return (a.value || 1e9) - (b.value || 1e9); });
    html += '<div class="grid row-2 mt">' +
      section('ค่า Ads เทียบยอดรับซื้อ — รายสัปดาห์', 'แท่งยอดรับซื้อควรสูงกว่าค่า Ads มาก ๆ · ถ้าค่า Ads สูงแต่ยอดรับซื้อไม่ขึ้น = ยิงไม่คุ้ม',
        m.spend || m.amount ? legend([['ค่า Ads', 'var(--budget)'], ['ยอดรับซื้อ', 'var(--st-x)']]) + '<div class="chart-box" id="chMoney"></div>' : '<div class="empty">ยังไม่มีค่า Ads หรือยอดรับซื้อในช่วงนี้</div>') +
      section('แคมเปญไหนคุ้ม (ต้นทุนต่อ Lead)', 'แท่งสั้น = ได้ Lead ถูก · สีส้ม = ต้นทุนต่อเคสเกินเป้า ' + F.baht(m.target),
        campItems.length ? Charts.hbars(campItems) : '<div class="empty">ยังไม่มีข้อมูล</div>') + '</div>';
    if (m.spend || m.amount) charts.push(['chMoney', { labels: gw.labels, tips: gw.tips, series: [{ name: 'ค่า Ads', color: 'var(--budget)', values: gw.map('spend') }, { name: 'ยอดรับซื้อ', color: 'var(--st-x)', values: gw.map('amount') }],
      height: 300, left: 78, showValues: false, fmt: function (v) { return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k' : String(Math.round(v)); }, aria: 'ค่า Ads เทียบยอดรับซื้อ' }]);

    // ---------- 5) ระยะเวลา ทัก → ปิด ----------
    var L = m.closeList, st = m.closeStats;
    var closeTable = L.length ? '<div class="table-wrap scroll-y"><table class="t"><thead><tr><th>ลูกค้า</th><th>ทัก → ปิด</th><th class="r">ใช้เวลา</th><th class="r">ยอด</th><th>ปิดโดย</th></tr></thead><tbody>' +
      L.map(function (p) {
        return '<tr class="click" data-chat="' + esc(p.id) + '"><td>' + esc(p.customer) + '<div class="muted small">' + esc(p.product || '') + '</div></td>' +
          '<td class="num">' + F.thDate(p.firstDate) + ' → ' + (p.closed_date ? F.thDate(p.closed_date) : '<span class="muted">?</span>') + '</td>' +
          '<td class="r num"><b>' + (p.badDate ? '<span class="dup">วันที่ผิด</span>' : p.closeDays == null ? '–' : p.closeDays === 0 ? 'วันเดียว' : p.closeDays + ' วัน') + '</b></td>' +
          '<td class="r num">' + F.baht(Number(p.amount) || 0) + '</td><td>' + esc(p.closed_by || '–') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '';
    html += '<div class="grid row-2 mt">' +
      section('ใช้เวลากี่วันกว่าจะปิดได้', 'นับจากวันที่ลูกค้าทักครั้งแรก ถึงวันที่ปิดได้' + (st.known ? ' · เฉลี่ย ' + st.avg.toFixed(1) + ' วัน · ค่ากลาง ' + st.median + ' วัน · เร็วสุด ' + st.min + ' · ช้าสุด ' + st.max + ' วัน' : ''),
        st.known ? '<div class="chart-box" id="chDur"></div>' + (st.known < L.length ? '<div class="nudge" style="margin-top:12px">มี ' + (L.length - st.known) + ' เคสที่ยังไม่มีวันปิด/วันที่ไม่ถูก — กดชื่อในตารางขวาเพื่อแก้</div>' : '')
          : '<div class="empty">' + (L.length ? 'เคสที่ปิดได้ยังไม่มีวันปิด — กดชื่อในตารางเพื่อใส่' : 'ยังไม่มีเคสที่ปิดได้ในช่วงนี้') + '</div>') +
      section('เคสที่ปิดได้ (' + L.length + ')', 'กดแถวเพื่อแก้วันที่ปิด/ยอด', closeTable || '<div class="empty">ยังไม่มี</div>') + '</div>';
    if (st.known) charts.push(['chDur', { labels: st.buckets.map(function (b) { return b.label; }), series: [{ name: 'จำนวนเคส', color: 'var(--primary)', values: st.buckets.map(function (b) { return b.n; }) }], height: 280, showValues: true, aria: 'ระยะเวลาปิด' }]);

    // ---------- 5.5) สินค้าที่รับซื้อได้ ----------
    var pc = {};
    m.closeList.forEach(function (p) {
      var cat = C.splitProduct(S.data, p.product).cat || 'ไม่ระบุ';
      var o = pc[cat] || (pc[cat] = { n: 0, amt: 0 }); o.n++; o.amt += Number(p.amount) || 0;
    });
    var pItems = Object.keys(pc).map(function (k) { return { label: k, value: pc[k].amt, display: F.baht(pc[k].amt), sub: pc[k].n + ' เคส · เฉลี่ย ' + F.baht(pc[k].amt / pc[k].n) + '/เคส' }; })
      .sort(function (x, y) { return y.value - x.value; });
    if (pItems.length) html += section('รับซื้อได้เป็นสินค้าอะไร', 'ยอดรับซื้อรวมของเคสที่ปิดได้ แยกตามประเภทสินค้า · ใช้ดูว่าควรยิงโฆษณาสินค้าไหนเพิ่ม', Charts.hbars(pItems), 'full');

    // ---------- 7) โฆษณาไหนได้คนคุณภาพ ----------
    var adItems = m.adRows.filter(function (r) { return r.chats >= 5; }).sort(function (a, b) { return (b.qualityPct || 0) - (a.qualityPct || 0); }).map(function (r) {
      return { label: r.ad, sub: (r.adset || '') + ' · แชท ' + r.chats + ' · ปิด ' + r.closed, value: (r.qualityPct || 0) * 100, display: F.pct(r.qualityPct) + ' (' + r.quality + '/' + r.chats + ')',
        color: r.qualityPct >= 0.6 ? 'var(--st-x)' : r.qualityPct >= 0.35 ? 'var(--st-3)' : 'var(--bad)' };
    });
    var few = m.adRows.filter(function (r) { return r.chats < 5; }).length;
    html += section('โฆษณาไหนดึงคนที่ส่งข้อมูลเครื่องมาจริง', '% = คนที่ส่งข้อมูลเครื่อง (ขั้น 2 ขึ้นไป ไม่นับของไม่ตรง) จากคนที่ทัก · เขียว ≥ 60% · เหลือง 35–60% · แดง < 35%' + (few ? ' · ไม่แสดง ' + few + ' โฆษณาที่มีแชทน้อยกว่า 5' : ''),
      adItems.length ? Charts.hbars(adItems, { max: 100 }) : '<div class="empty">ยังไม่มีโฆษณาที่มีแชทถึง 5 คน</div>', 'full');

    $('#page').innerHTML = html;
    S.drawCharts = function () { charts.forEach(function (c) { var el = document.getElementById(c[0]); if (el) { if (c.length === 3) Charts[c[1]](el, c[2]); else Charts.columns(el, c[1]); } }); };
    S.drawCharts();
    Charts.countUp($('#page'));

    $$('[data-preset]').forEach(function (b) { b.onclick = function () { f.preset = b.dataset.preset; pageDashboard(); }; });
    if ($('#fFrom')) {
      $('#fFrom').onchange = function () { f.from = this.value; if (f.from > f.to) f.to = f.from; pageDashboard(); };
      $('#fTo').onchange = function () { f.to = this.value; if (f.to < f.from) f.from = f.to; pageDashboard(); };
    }
    $('#fCamp').onchange = function () { f.campaign = this.value; pageDashboard(); };
    $$('[data-ctab]').forEach(function (b) { b.onclick = function () { S.chartTab = b.dataset.ctab; pageDashboard(); }; });
    $('#btnSummary').onclick = function () { openSummary(m); };
    $$('[data-pm]').forEach(function (b) { b.onclick = function () { S.pmetric = b.dataset.pm; pageDashboard(); }; });
    $$('[data-pc]').forEach(function (b) { b.onclick = function () { S.popen = S.popen || {}; S.popen[b.dataset.pc] = !S.popen[b.dataset.pc]; pageDashboard(); }; });
    $$('[data-chat]').forEach(function (r) { r.onclick = function () { editChat(r.dataset.chat, pageDashboard); }; });
  }

  function kpi(label, value, sub, delta) {
    return '<div class="card kpi-b"><div class="kpi-l">' + label + '</div><div class="kpi-v num">' + value + '</div><div class="kpi-s">' + sub + '</div>' + (delta ? '<div class="kpi-d">' + delta + '</div>' : '') + '</div>';
  }
  function section(title, sub, body, cls) {
    return '<div class="card sec ' + (cls === 'full' ? 'mt' : '') + '"><div class="sec-h"><h2 class="card-title">' + title + '</h2><div class="card-sub">' + sub + '</div></div>' + body + '</div>';
  }
  function legend(items) {
    return '<div class="chart-legend">' + items.map(function (x) { return '<span><i style="background:' + x[1] + '"></i>' + x[0] + '</span>'; }).join('') + '</div>';
  }
  function groupDaily(daily, mode) {
    var rows = [];
    if (mode === 'week') {
      daily.forEach(function (d, i) {
        var w = Math.floor(i / 7);
        if (!rows[w]) rows[w] = { label: F.thDate(d.date), first: d.date, last: d.date, leads: 0, closed: 0, spend: 0, amount: 0 };
        var r = rows[w]; r.leads += d.leads; r.closed += d.closed; r.spend += d.spend; r.amount += d.amount; r.last = d.date;
      });
      rows.forEach(function (r) { r.tip = 'สัปดาห์ ' + F.thRange(r.first, r.last); });
    } else {
      rows = daily.map(function (d) { return { label: String(Number(d.date.slice(8))) + (d.date.slice(8) === '01' ? ' ' + F.thDate(d.date).split(' ')[1] : ''), tip: F.thDate(d.date, true), leads: d.leads, closed: d.closed, spend: d.spend, amount: d.amount }; });
    }
    return {
      labels: rows.map(function (r) { return r.label; }), tips: rows.map(function (r) { return r.tip; }),
      map: function (k) { return rows.map(function (r) { return Math.round(r[k] * 100) / 100; }); }
    };
  }
  // ---------- การ์ด "ปรับงบแล้วคุ้มไหม" (ใช้ทั้ง Dashboard และหน้าแคมเปญ) ----------
  var V_ICON = { good: '✓', bad: '✕', flat: '≈', wait: '…', nodata: '–' };
  var V_SHORT = { good: 'คุ้ม', bad: 'ไม่คุ้ม', flat: 'พอ ๆ เดิม', wait: 'รอผล', nodata: 'ไม่มี Lead' };
  function verdictPill(v, short) { return '<span class="verdict v-' + v.key + (short ? ' sm' : '') + '"><i>' + V_ICON[v.key] + '</i>' + (short ? V_SHORT[v.key] : v.title) + '</span>'; }
  function xpSummary(xps) {
    var c = { good: 0, bad: 0, flat: 0, wait: 0, nodata: 0 };
    xps.forEach(function (x) { c[x.v.key]++; });
    return '<div class="xp-sum"><span>ปรับงบ <b>' + xps.length + '</b> ครั้ง</span>' +
      ['good', 'bad', 'flat', 'wait'].filter(function (k) { return c[k]; }).map(function (k) { return verdictPill({ key: k }, true).replace('</span>', ' <b>' + c[k] + '</b></span>'); }).join('') + '</div>';
  }
  function xpMetric(label, hint, vals, fmtv, ch, goodUp, words) {
    var bv = vals[0], av = vals[1], max = Math.max(bv || 0, av || 0) || 1, tone = 'n', chTxt = '';
    if (ch != null && isFinite(ch) && Math.abs(ch) >= 0.005) {
      var up = ch > 0, good = goodUp ? up : !up;
      tone = Math.abs(ch) < 0.1 ? 'n' : good ? 'g' : 'b';
      var mag = up && ch >= 1 ? (1 + ch).toFixed(1) + ' เท่า' : Math.round(Math.abs(ch) * 100) + '%';
      chTxt = '<span class="xp-ch ' + tone + '">' + (up ? '▲ ' : '▼ ') + (up ? words[0] : words[1]) + ' ' + mag + '</span>';
    }
    function bar(k, v, cls) {
      return '<div class="xp-bar"><span class="xp-k">' + k + '</span><div class="xp-tr"><i class="' + cls + '" style="width:' + (v ? Math.max(2, v / max * 100) : 0) + '%"></i></div><span class="xp-v">' + (v == null ? '–' : fmtv(v)) + '</span></div>';
    }
    return '<div class="xp-m"><div class="xp-mh"><b>' + label + '</b><span class="muted">' + hint + '</span>' + chTxt + '</div>' +
      bar('ก่อน', bv, 'b0') + bar('หลัง', av, 'a-' + tone) + '</div>';
  }
  function xpCard(x, showCamp) {
    var b = x.before, a = x.after, v = x.v;
    var change = v.kind === 'same'
      ? (x.gap ? 'กลับมายิงหลังหยุด ' + x.gap + ' วัน · ' : 'เริ่มรอบใหม่ · ') + 'งบเดิม <b>' + F.baht(a.daily) + '</b>/วัน'
      : 'งบ/วัน <span class="old">' + F.baht(b.daily) + '</span> → <b>' + F.baht(a.daily) + '</b> <span class="pill ' + (v.kind === 'up' ? 'info' : '') + '">' + (x.budgetChange > 0 ? '+' : '') + Math.round(x.budgetChange * 100) + '%</span>' + (x.gap ? ' <span class="muted">(หยุด ' + x.gap + ' วันก่อนปรับ)</span>' : '');
    var who = (showCamp ? '<b>' + esc(x.campaign) + '</b>' : '') + '<span>' + (x.adset ? 'Ad set: ' + esc(x.adset) : 'ทั้งแคมเปญ') + '</span>';
    var aTo = a.ongoing ? 'วันนี้' : F.thDate(a.to);
    return '<div class="xp v-' + v.key + '">' +
      '<div class="xp-top"><div class="xp-who">' + who + '</div>' + verdictPill(v) + '</div>' +
      '<div class="xp-chg">' + change + '</div>' +
      '<div class="xp-when"><span>ก่อน: ' + F.thRange(b.from, b.to) + ' (' + b.days + ' วัน)</span><span>หลัง: ' + F.thDate(a.from) + ' – ' + aTo + ' (' + a.days + ' วัน)</span></div>' +
      xpMetric('ต้นทุนต่อ Lead', 'ถูกลง = ดี', v.cpl, function (n) { return F.baht(n); }, v.cplChange, false, ['แพงขึ้น', 'ถูกลง']) +
      xpMetric('Lead ต่อวัน', 'มากขึ้น = ดี', v.lpd, function (n) { return (Math.round(n * 10) / 10) + ' คน'; }, v.lpdChange, true, ['มากขึ้น', 'น้อยลง']) +
      '<div class="xp-foot">Lead รวม ก่อน ' + b.leads + ' · หลัง ' + a.leads + ' &nbsp;|&nbsp; ปิดได้ ก่อน ' + b.closed + ' · หลัง ' + a.closed +
      (x.note ? '<div>สิ่งที่ทดลอง: ' + esc(x.note) + '</div>' : '') + '</div>' +
      '<div class="xp-advice"><b>ควรทำ:</b> ' + esc(v.advice) + '</div>' +
      (v.few ? '<div class="xp-warn">Lead ยังน้อย ผลอาจเปลี่ยนได้ — ยิงต่ออีกหน่อยแล้วดูอีกครั้ง</div>' : '') +
      (v.est ? '<div class="xp-warn">ยังไม่ได้กรอกค่า Ads ของช่วงนี้ — ต้นทุนต่อ Lead ประมาณจากงบที่ตั้ง</div>' : '') +
      (v.partial ? '<div class="xp-warn">กรอกค่า Ads แล้ว ก่อน ' + b.covDays + '/' + b.days + ' วัน · หลัง ' + a.covDays + '/' + a.days + ' วัน — ต้นทุนต่อ Lead คิดเฉพาะวันที่กรอกแล้ว</div>' : '') +
      '</div>';
  }

  function openSummary(m) {
    var text = C.summaryText(m, S.data);
    modal('<h3>สรุปแคมเปญ</h3><textarea class="summary-box" id="sumText" readonly>' + esc(text) + '</textarea>' +
      '<div class="actions" style="margin-top:14px"><button class="btn ghost" data-close>ปิด</button><button class="btn" id="copySum">' + I.copy + 'คัดลอก</button></div>',
      function (el) {
        $('#copySum', el).onclick = function () {
          var ta = $('#sumText', el);
          (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(function () { toast('คัดลอกแล้ว'); })
            .catch(function () { ta.select(); document.execCommand('copy'); toast('คัดลอกแล้ว'); });
        };
      });
  }

  // ============================================================
  // Chats
  // ============================================================
  /** เลือกโฆษณา 2 ขั้น: กดแคมเปญ → กดโฆษณา (แคมเปญที่ยิงอยู่ขึ้นก่อน) */
  function findAd(name, camp) {
    var list = S.data.ads.filter(function (a) { return a.ad_name === name; });
    return list.filter(function (a) { return !camp || a.campaign === camp; })[0] || list[0] || null;
  }
  function adCampList() {
    var td = today(), byCamp = {};
    S.data.ads.forEach(function (a) { if (a.campaign) (byCamp[a.campaign] = byCamp[a.campaign] || []).push(a); });
    return Object.keys(byCamp).map(function (c) {
      var running = C.campState(S.data, c, td).state === 'running' || byCamp[c].some(function (a) { return isTrue(a.active); });
      return { name: c, ads: byCamp[c], running: running, start: C.firstStart(S.data, c) || '' };
    }).sort(function (a, b) { return (b.running - a.running) || (a.start < b.start ? 1 : -1); });
  }
  function adPickerHtml(prefix, c) {
    var ad = c.ad ? findAd(c.ad, c.campaign) : null;
    return '<div class="f c12"><label>มาจากโฆษณาไหน</label><input type="hidden" id="' + prefix + 'Ad" value="' + esc(ad ? ad.ad_name : c.ad || '') + '">' +
      '<input type="hidden" id="' + prefix + 'AdId" value="' + esc(ad ? ad.id : '') + '"><div class="adp" id="' + prefix + 'AdP" data-camp="' + esc(ad ? ad.campaign : c.campaign || '') + '"></div>' +
      '<div class="ad-meta" id="' + prefix + 'AdMeta"></div></div>';
  }
  function renderAdPicker(el, prefix, onPick) {
    var box = $('#' + prefix + 'AdP', el), cur = $('#' + prefix + 'AdId', el).value, camp = box.dataset.camp;
    var camps = adCampList(), showOld = box.dataset.old === '1' || camps.some(function (x) { return x.name === camp && !x.running; });
    var shown = camps.filter(function (x) { return x.running || showOld; });
    var html = '<div class="adp-step">1. แคมเปญ</div><div class="adp-camps">' + shown.map(function (x) {
      return '<button type="button" class="adp-c' + (x.name === camp ? ' on' : '') + (x.running ? '' : ' off') + '" data-c="' + esc(x.name) + '">' + (x.running ? '<i class="sdot on"></i>' : '') + esc(x.name) + '</button>';
    }).join('') + (camps.length > shown.length ? '<button type="button" class="linkish adp-more">+ แคมเปญที่หยุดแล้ว (' + (camps.length - shown.length) + ')</button>' : '') + '</div>';
    var sel = camps.filter(function (x) { return x.name === camp; })[0];
    if (sel) {
      var ads = sel.ads.slice().sort(function (a, b) { return isTrue(b.active) - isTrue(a.active); });
      html += '<div class="adp-step">2. โฆษณา</div><div class="adp-ads">' + ads.map(function (a) {
        return '<button type="button" class="adp-a' + (a.id === cur ? ' on' : '') + (isTrue(a.active) ? '' : ' off') + '" data-id="' + esc(a.id) + '">' + esc(a.ad_name) + (a.adset && a.adset !== a.ad_name ? '<small>' + esc(a.adset) + '</small>' : '') + '</button>';
      }).join('') + '</div>';
    } else html += '<div class="muted small" style="margin-top:6px">กดเลือกแคมเปญก่อน แล้วจะขึ้นโฆษณาในแคมเปญนั้น</div>';
    box.innerHTML = html;
    $$('.adp-c', box).forEach(function (b) { b.onclick = function () { box.dataset.camp = b.dataset.c; var one = (camps.filter(function (x) { return x.name === b.dataset.c; })[0] || { ads: [] }).ads;
      if (one.length === 1) { $('#' + prefix + 'AdId', el).value = one[0].id; $('#' + prefix + 'Ad', el).value = one[0].ad_name; onPick(); }
      renderAdPicker(el, prefix, onPick); }; });
    $$('.adp-a', box).forEach(function (b) { b.onclick = function () { var a = S.data.ads.filter(function (x) { return x.id === b.dataset.id; })[0]; $('#' + prefix + 'AdId', el).value = a.id; $('#' + prefix + 'Ad', el).value = a.ad_name; onPick(); renderAdPicker(el, prefix, onPick); }; });
    if ($('.adp-more', box)) $('.adp-more', box).onclick = function () { box.dataset.old = '1'; renderAdPicker(el, prefix, onPick); };
  }
  function adOf(el, prefix) {
    var id = $('#' + prefix + 'AdId', el).value;
    return S.data.ads.filter(function (a) { return a.id === id; })[0] || findAd($('#' + prefix + 'Ad', el).value) || null;
  }

  function chatFormHtml(c, prefix) {
    c = c || {};
    return '<div class="form-grid">' +
      '<div class="f c3"><label for="' + prefix + 'Date">วันที่ทัก</label><input type="date" id="' + prefix + 'Date" value="' + esc(c.date || today()) + '" required></div>' +
      '<div class="f c9"><label for="' + prefix + 'Name">ชื่อลูกค้า</label><div class="name-line"><span id="' + prefix + 'Face">' + (c.psid ? face(c.customer, c.pic, 38) : '') + '</span><input id="' + prefix + 'Name" value="' + esc(c.customer || '') + '" autocomplete="off" placeholder="ชื่อในเฟส/ไลน์ — หรือกดชื่อจากรายการ ลูกค้าที่ทักเพจ ด้านบน" required></div><div class="hint" id="' + prefix + 'Dup"></div></div>' +
      adPickerHtml(prefix, c) +
      '<div class="f c12"><label>สถานะ</label><div class="status-picker" id="' + prefix + 'Status">' + C.STATUSES.map(function (s) {
        return '<button type="button" data-st="' + esc(s.key) + '" class="' + (c.status === s.key ? 'on' : '') + '"><span class="dot" style="background:' + s.color + '"></span>' + esc(s.key) + '</button>';
      }).join('') + '</div></div>' +
      productPickerHtml(prefix, c.product) +
      '<div class="f c4 closeOnly"><label for="' + prefix + 'Amount">ยอดรับซื้อ (บาท)</label><input id="' + prefix + 'Amount" type="number" min="0" step="1" inputmode="numeric" value="' + esc(c.amount || '') + '"></div>' +
      '<div class="f c4 closedOnly"><label for="' + prefix + 'Closed">วันที่ปิดได้</label><input type="date" id="' + prefix + 'Closed" value="' + esc(c.closed_date || today()) + '"><div class="hint" id="' + prefix + 'Dur"></div></div>' +
      '<div class="f c4 closedOnly"><label for="' + prefix + 'By">ปิดโดย</label><select id="' + prefix + 'By">' + S.data.users.map(function (u) { return opt(u.name, u.name, c.closed_by || S.data.me); }).join('') +
        (c.closed_by && !S.data.users.some(function (u) { return u.name === c.closed_by; }) ? opt(c.closed_by, c.closed_by, c.closed_by) : '') + '</select></div>' +
      '<div class="f c12"><label for="' + prefix + 'Note">หมายเหตุ</label><input id="' + prefix + 'Note" value="' + esc(c.note || '') + '"></div>' +
      '</div>';
  }
  var OTHER = 'อื่น ๆ';
  function productPickerHtml(prefix, product) {
    var sp = C.splitProduct(S.data, product), list = C.productList(S.data).concat([OTHER]);
    return '<div class="f c12"><label>สินค้า <span class="muted">(กดเลือก · ไม่บังคับ)</span></label><div class="prod-picker" id="' + prefix + 'Cat">' + list.map(function (c) {
      return '<button type="button" data-cat="' + esc(c) + '" class="' + (sp.cat === c ? 'on' : '') + '">' + esc(c) + '</button>';
    }).join('') + '</div>' +
      '<input id="' + prefix + 'Product" class="prod-detail" value="' + esc(sp.detail) + '" autocomplete="off" placeholder="รุ่น / สเปก (ไม่บังคับ) เช่น 14 Pro 256GB"></div>';
  }
  function readProduct(el, prefix) {
    var on = $('#' + prefix + 'Cat button.on', el), cat = on ? on.dataset.cat : '', d = $('#' + prefix + 'Product', el).value.trim();
    if (!cat || cat === OTHER) return d;
    if (!d) return cat;
    return d.toLowerCase().indexOf(cat.toLowerCase()) >= 0 ? d : cat + ' ' + d;
  }

  function wireChatForm(el, prefix, state) {
    function adMeta() {
      var ad = adOf(el, prefix);
      $('#' + prefix + 'AdMeta', el).textContent = ad ? '✓ ' + ad.ad_name + ' · Ad set: ' + ad.adset + ' · ' + ad.campaign : '';
    }
    function closeFields() {
      var show = state.status === '5-ปิดการขาย' || state.status === '4-นัดรับของ';
      $$('.closeOnly', el).forEach(function (x) { x.style.display = show ? '' : 'none'; });
      $$('.closedOnly', el).forEach(function (x) { x.style.display = state.status === '5-ปิดการขาย' ? '' : 'none'; });
      dur();
    }
    function dur() {
      var d = $('#' + prefix + 'Date', el).value, cd = $('#' + prefix + 'Closed', el).value, h = $('#' + prefix + 'Dur', el);
      if (!h) return;
      var first = d;
      var name = $('#' + prefix + 'Name', el).value.trim().toLowerCase().replace(/[\s'’"`.]+/g, '');
      S.data.chats.forEach(function (c) { if (name && String(c.customer).toLowerCase().replace(/[\s'’"`.]+/g, '') === name && c.date && c.date < first) first = c.date; });
      h.textContent = d && cd ? (cd < first ? 'วันปิดอยู่ก่อนวันที่ทัก' : 'ทักครั้งแรก ' + F.thDate(first) + ' → ใช้เวลา ' + (C.daysIncl(first, cd) - 1) + ' วัน') : '';
    }
    function dup() {
      var name = $('#' + prefix + 'Name', el).value.trim().toLowerCase().replace(/[\s'’"`.]+/g, '');
      var ad = adOf(el, prefix);
      var hint = $('#' + prefix + 'Dup', el);
      if (!name) { hint.textContent = ''; return; }
      var hits = S.data.chats.filter(function (c) {
        return c.id !== state.id && String(c.customer).toLowerCase().replace(/[\s'’"`.]+/g, '') === name && (!ad || c.campaign === ad.campaign);
      });
      hint.className = 'hint' + (hits.length ? ' warn' : '');
      hint.textContent = hits.length ? '⚠️ ซ้ำ — มีแล้ว ' + hits.length + ' แถว (ล่าสุด ' + F.thDate(hits[hits.length - 1].date) + ' · ' + hits[hits.length - 1].status + ')' : '';
    }
    renderAdPicker(el, prefix, function () { adMeta(); dup(); });
    $('#' + prefix + 'Name', el).oninput = function () { dup(); dur(); };
    $('#' + prefix + 'Date', el).onchange = dur;
    $('#' + prefix + 'Closed', el).onchange = dur;
    $$('#' + prefix + 'Status button', el).forEach(function (b) {
      b.onclick = function () {
        state.status = b.dataset.st;
        $$('#' + prefix + 'Status button', el).forEach(function (x) { x.classList.toggle('on', x === b); });
        closeFields();
      };
    });
    $$('#' + prefix + 'Cat button', el).forEach(function (b) {
      b.onclick = function () {
        var was = b.classList.contains('on');
        $$('#' + prefix + 'Cat button', el).forEach(function (x) { x.classList.remove('on'); });
        if (!was) b.classList.add('on');
        $('#' + prefix + 'Product', el).placeholder = !was && b.dataset.cat === OTHER ? 'พิมพ์ชื่อสินค้า' : 'รุ่น / สเปก (ไม่บังคับ) เช่น 14 Pro 256GB';
        if (!was && b.dataset.cat === OTHER) $('#' + prefix + 'Product', el).focus();
      };
    });
    adMeta(); closeFields(); dup();
  }

  function readChatForm(el, prefix, state) {
    var adName = $('#' + prefix + 'Ad', el).value;
    var ad = adOf(el, prefix) || {};
    var showClose = state.status === '5-ปิดการขาย' || state.status === '4-นัดรับของ';
    return {
      id: state.id || '',
      date: $('#' + prefix + 'Date', el).value,
      customer: $('#' + prefix + 'Name', el).value.trim(),
      ad: adName, adset: ad.adset || state.adset || '', campaign: ad.campaign || state.campaign || '',
      status: state.status || '',
      product: readProduct(el, prefix),
      amount: showClose ? $('#' + prefix + 'Amount', el).value : '',
      closed_date: state.status === '5-ปิดการขาย' ? $('#' + prefix + 'Closed', el).value : '',
      closed_by: state.status === '5-ปิดการขาย' ? $('#' + prefix + 'By', el).value : '',
      note: $('#' + prefix + 'Note', el).value.trim(),
      psid: state.psid || '', pic: state.pic || ''
    };
  }

  function validateChat(c) {
    if (!c.customer) return 'ต้องใส่ชื่อลูกค้า';
    if (!c.ad) return 'ต้องเลือกโฆษณา';
    if (!c.status) return 'ต้องเลือกสถานะ';
    if (c.status === '5-ปิดการขาย' && !(Number(c.amount) > 0)) return 'เคสปิดการขายต้องใส่ยอดรับซื้อ';
    if (c.status === '5-ปิดการขาย' && c.closed_date && c.closed_date < c.date) return 'วันที่ปิดต้องไม่ก่อนวันที่ทัก';
    return '';
  }

  var newChatState = { status: '' };
  function pageChats() {
    var cf = S.chatFilter;
    var html = '<div id="inboxBox"></div><div class="card"><div class="card-head"><div><h2 class="card-title">บันทึกแชทใหม่ <span class="muted" style="font-weight:400;font-size:15px">(กรอกเอง)</span></h2><div class="card-sub">เลือกโฆษณาแล้ว Ad set กับแคมเปญเติมให้เอง · กด Enter เพื่อบันทึก</div></div></div>' +
      '<form id="newChat">' + chatFormHtml({ date: newChatState.date, ad: newChatState.ad, campaign: newChatState.campaign, status: newChatState.status }, 'n') +
      '<div class="actions" style="margin-top:16px"><button class="btn" type="submit" id="saveNew">บันทึก</button></div></form></div>';

    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">รายการแชท</h2><div class="card-sub" id="chatCount"></div></div>' +
      '<button class="btn ghost sm" id="csv">ดาวน์โหลด CSV</button></div>' +
      '<div class="filters" style="margin-bottom:12px">' +
      '<select class="field-inline" id="cfStatus">' + opt('', 'ทุกสถานะ', cf.status) + C.STATUSES.map(function (s) { return opt(s.key, s.key, cf.status); }).join('') + '</select>' +
      '<select class="field-inline" id="cfCamp">' + opt('', 'ทุกแคมเปญ', cf.campaign) + campaigns().map(function (c) { return opt(c, c, cf.campaign); }).join('') + '</select>' +
      (cf.q ? '<span class="pill info">ค้นหา: ' + esc(cf.q) + ' <button class="linkish" id="clearQ" style="padding:0">✕</button></span>' : '') +
      '</div><div id="chatList"></div></div>';
    $('#page').innerHTML = html;

    var form = $('#newChat');
    wireChatForm(form, 'n', newChatState);
    form.onsubmit = function (e) {
      e.preventDefault();
      var c = readChatForm(form, 'n', newChatState);
      var err = validateChat(c);
      if (err) return toast(err, true);
      $('#saveNew').disabled = true;
      API.call('saveChat', { chat: c }).then(function (saved) {
        S.data.chats.push(saved);
        if (c.psid) (S.data.inbox || []).forEach(function (r) { if (r.psid === c.psid) r.status = 'ad'; });
        newChatState = { status: '', date: c.date, ad: c.ad, campaign: c.campaign }; // เก็บวันที่และโฆษณาไว้ กรอกคนต่อไปเร็วขึ้น
        toast('บันทึกแล้ว: ' + saved.customer);
        pageChats();
        $('#nName').focus();
      }).catch(function (e) { fail(e); $('#saveNew').disabled = false; });
    };
    $('#cfStatus').onchange = function () { cf.status = this.value; cf.limit = 100; renderChatList(); };
    $('#cfCamp').onchange = function () { cf.campaign = this.value; cf.limit = 100; renderChatList(); };
    if ($('#clearQ')) $('#clearQ').onclick = function () { cf.q = ''; render(); };
    $('#csv').onclick = downloadCsv;
    renderInbox();
    renderChatList();
  }

  // ---------- คนที่ทักเพจ (ดึงจาก Inbox) รอคัดแยก ----------
  function adCampaign(adName) { var a = S.data.ads.filter(function (x) { return x.ad_name === adName; })[0]; return a ? a.campaign : ''; }
  function renderInbox() {
    var box = $('#inboxBox');
    if (!box) return;
    var pend = (S.data.inbox || []).filter(function (r) { return r.status === 'pending'; }).sort(function (a, b) { return a.first_date < b.first_date ? 1 : a.first_date > b.first_date ? -1 : 0; });
    if (!pend.length) { box.innerHTML = ''; return; }
    var q = (S.ibQ || '').toLowerCase(), list = q ? pend.filter(function (r) { return String(r.name).toLowerCase().indexOf(q) >= 0; }) : pend;
    var lim = S.inboxLimit || 12;
    box.innerHTML = '<div class="card inbox" style="margin-bottom:18px"><div class="card-head"><div><h2 class="card-title">ลูกค้าที่ทักเพจ ยังไม่ได้บันทึก (' + pend.length + ')</h2>' +
      '<div class="card-sub">ดึงชื่อจาก Inbox เพจอัตโนมัติ ตั้งแต่ 1 ก.ย. · กดชื่อ → ระบบใส่ชื่อ/วันที่ทักให้ในฟอร์มด้านล่าง → เลือกโฆษณา + สถานะ → บันทึก</div></div>' +
      '<input class="field-inline ib-q" id="ibQ" placeholder="ค้นหาชื่อ…" value="' + esc(S.ibQ || '') + '"></div>' +
      '<div class="ib-grid">' + list.slice(0, lim).map(function (r) {
        return '<div class="ib-card" data-psid="' + esc(r.psid) + '">' + face(r.name, r.pic, 40) +
          '<div class="ib-who"><b>' + esc(r.name) + '</b><span>ทัก ' + F.thDate(r.first_date, true) + (r.first_text ? ' · “' + esc(r.first_text) + '”' : '') + '</span></div>' +
          '<button class="ib-x" title="ไม่ใช่ลูกค้าจากโฆษณา — ซ่อน">✕</button></div>';
      }).join('') + '</div>' +
      (list.length > lim ? '<div class="actions" style="justify-content:center;margin-top:12px"><button class="btn ghost sm" id="ibMore">แสดงเพิ่ม (' + (list.length - lim) + ')</button></div>' : '') +
      (!list.length ? '<div class="empty">ไม่พบชื่อนี้</div>' : '') + '</div>';
    var qi = $('#ibQ', box);
    qi.oninput = function () { S.ibQ = this.value; var pos = this.selectionStart; renderInbox(); var n = $('#ibQ'); n.focus(); n.setSelectionRange(pos, pos); };
    if ($('#ibMore', box)) $('#ibMore', box).onclick = function () { S.inboxLimit = lim + 24; renderInbox(); };
    $$('.ib-card', box).forEach(function (card) {
      var r = pend.filter(function (x) { return x.psid === card.dataset.psid; })[0];
      card.onclick = function () { fillFromInbox(r); };
      $('.ib-x', card).onclick = function (e) {
        e.stopPropagation();
        API.call('inboxDecide', { psid: r.psid, other: true }).then(function () { r.status = 'other'; toast('ซ่อน ' + r.name + ' แล้ว'); renderInbox(); }).catch(fail);
      };
    });
  }
  function fillFromInbox(r) {
    var form = $('#newChat');
    if (!form) return;
    newChatState.psid = r.psid; newChatState.pic = r.pic;
    $('#nName', form).value = r.name;
    $('#nDate', form).value = r.first_date || today();
    $('#nFace', form).innerHTML = face(r.name, r.pic, 38);
    $('#nName', form).dispatchEvent(new Event('input'));
    $$('.ib-card').forEach(function (c) { c.classList.toggle('on', c.dataset.psid === r.psid); });
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function filteredChats() {
    var cf = S.chatFilter, q = cf.q.toLowerCase();
    return S.data.chats.filter(function (c) {
      return (!cf.status || c.status === cf.status) && (!cf.campaign || c.campaign === cf.campaign) &&
        (!q || String(c.customer).toLowerCase().indexOf(q) >= 0 || String(c.product || '').toLowerCase().indexOf(q) >= 0);
    }).sort(function (a, b) {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : String(b.created_at || b.id) < String(a.created_at || a.id) ? -1 : 1;
    });
  }

  function renderChatList() {
    var box = $('#chatList');
    if (!box) return;
    var list = filteredChats(), dups = C.dupMap(S.data.chats), lim = S.chatFilter.limit;
    $('#chatCount').textContent = list.length + ' แถว';
    if (!list.length) { box.innerHTML = '<div class="empty">ไม่พบแชท</div>'; return; }
    box.innerHTML = '<div class="table-wrap"><table class="t wide"><thead><tr><th>วันที่</th><th>ลูกค้า</th><th>โฆษณา / Ad set</th><th>สถานะ</th><th>สินค้า</th><th class="r">ยอดรับซื้อ</th><th>บันทึกโดย</th></tr></thead><tbody>' +
      list.slice(0, lim).map(function (c) {
        return '<tr class="click" data-id="' + esc(c.id) + '"><td class="num" style="white-space:nowrap">' + F.thDate(c.date) + '</td>' +
          '<td><div class="name-cell">' + face(c.customer, c.pic, 34) + '<div>' + esc(c.customer) + (dups[c.id] ? ' <span class="dup">⚠️ ซ้ำ</span>' : '') +
            (c.review === 'auto' ? '<div><span class="pill info" title="ระบบเลือกโฆษณาให้จากข้อมูล Facebook — กดเพื่อตรวจ/แก้">ดึงจาก Facebook · ตรวจโฆษณา</span></div>' : c.source === 'fb' ? '<div class="muted small">ดึงจาก Facebook</div>' : '') + '</div></div></td>' +
          '<td><div>' + esc(c.ad || '-') + '</div><div class="muted" style="font-size:12.5px">' + esc(c.adset || '') + '</div></td>' +
          '<td>' + statusPill(c.status) + (c.status === '5-ปิดการขาย' ? '<div class="muted small">' + (c.closed_date ? 'ปิด ' + F.thDate(c.closed_date) + ' · ' + (C.daysIncl(c.date, c.closed_date) - 1) + ' วัน' : 'ยังไม่ใส่วันปิด') + (c.closed_by ? ' · ' + esc(c.closed_by) : '') + '</div>' : '') + '</td><td>' + esc(c.product || '') + '</td>' +
          '<td class="r num">' + (c.amount ? F.baht(Number(c.amount)) : '') + '</td><td class="muted">' + esc(c.updated_by || c.created_by || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (list.length > lim ? '<div class="actions" style="justify-content:center;margin-top:12px"><button class="btn ghost sm" id="more">แสดงเพิ่ม (' + (list.length - lim) + ')</button></div>' : '');
    $$('tr[data-id]', box).forEach(function (tr) { tr.onclick = function () { editChat(tr.dataset.id); }; });
    if ($('#more')) $('#more').onclick = function () { S.chatFilter.limit += 200; renderChatList(); };
  }

  function editChat(id, after) {
    var c = S.data.chats.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var st = { id: c.id, status: c.status, adset: c.adset, campaign: c.campaign, psid: c.psid || '', pic: c.pic || '' };
    modal('<h3>แก้ไขแชท</h3><form id="editChat">' + chatFormHtml(c, 'e') +
      '<div class="muted" style="font-size:13px;margin-top:12px">บันทึกโดย ' + esc(c.created_by || '-') + (c.updated_by ? ' · แก้ล่าสุดโดย ' + esc(c.updated_by) : '') + '</div>' +
      '<div class="actions" style="margin-top:16px;justify-content:space-between"><button type="button" class="btn danger" id="delChat">ลบ</button>' +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        var form = $('#editChat', el);
        wireChatForm(form, 'e', st);
        form.onsubmit = function (e) {
          e.preventDefault();
          var nc = readChatForm(form, 'e', st);
          var err = validateChat(nc);
          if (err) return toast(err, true);
          API.call('saveChat', { chat: nc }).then(function (saved) {
            var i = S.data.chats.findIndex(function (x) { return x.id === saved.id; });
            if (i >= 0) S.data.chats[i] = saved;
            close(); toast('บันทึกแล้ว'); (after || renderChatList)();
          }).catch(fail);
        };
        $('#delChat', el).onclick = function () {
          askConfirm('ลบแชทของ ' + c.customer + ' ?', function () {
            API.call('deleteChat', { id: c.id }).then(function () {
              S.data.chats = S.data.chats.filter(function (x) { return x.id !== c.id; });
              close(); toast('ลบแล้ว'); (after || renderChatList)();
            }).catch(fail);
          });
        };
      });
  }

  function downloadCsv() {
    var cols = ['date', 'customer', 'ad', 'adset', 'campaign', 'status', 'product', 'amount', 'note', 'created_by'];
    var rows = [cols.join(',')].concat(filteredChats().map(function (c) {
      return cols.map(function (k) { return '"' + String(c[k] == null ? '' : c[k]).replace(/"/g, '""') + '"'; }).join(',');
    }));
    var blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chats-' + today() + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // ============================================================
  // Campaigns — รายการ → หน้าแคมเปญ (รอบการยิง · ค่า Ads · Ad set/โฆษณา)
  // ============================================================
  var MODE_LABEL = { campaign: 'งบทั้งแคมเปญ (CBO)', adset: 'แยกงบราย Ad set' };

  function findCampById(id) { return S.data.campaigns.filter(function (c) { return c.id === id; })[0]; }
  function campOptions(sel) { return campaigns().map(function (c) { return opt(c, c, sel); }).join(''); }
  function adsetRecs(camp) {
    return C.adsetsOf(S.data, camp).map(function (n) {
      return S.data.adsets.filter(function (a) { return a.campaign === camp && a.name === n; })[0] || { id: '', campaign: camp, name: n, active: true, note: '' };
    });
  }
  function campStats(camp) {
    var people = C.uniquePeople(S.data.chats.filter(function (c) { return c.campaign === camp; }));
    var leads = people.filter(function (p) { return C.stageOf(p.status) >= 1; }).length;
    var closed = people.filter(function (p) { return p.status === '5-ปิดการขาย'; }).length;
    var cov = C.spendCoverage(S.data, camp, today());
    return { leads: leads, closed: closed, spend: cov.total, cov: cov,
      cpl: leads && cov.total ? cov.total / leads : null, cpc: closed && cov.total ? cov.total / closed : null,
      days: C.runningDays(S.data, camp, today()).length };
  }
  function statusHtml(camp, big) {
    var s = C.campState(S.data, camp, today());
    var cls = big ? 'status-line big' : 'status-line';
    var nxt = s.next ? ' <span class="pill info">รอบถัดไป ' + F.thDate(s.next.from) + '</span>' : '';
    if (s.state === 'running') {
      return '<div class="' + cls + '"><span class="sdot on"></span><b>กำลังยิง</b> · ' + F.baht(s.amount) + '/วัน' +
        (s.mode === 'adset' ? ' <span class="muted">(' + s.runningCount + ' Ad set)</span>' : '') + ' <span class="muted">· ตั้งแต่ ' + F.thDate(s.since, true) +
        (s.endsOn ? ' ถึง ' + F.thDate(s.endsOn, true) : '') + '</span>' + nxt + '</div>';
    }
    if (s.state === 'paused') return '<div class="' + cls + '"><span class="sdot off"></span><b>หยุดแล้ว</b> <span class="muted">· ยิงวันสุดท้าย ' + F.thDate(s.lastDay || C.addDays(s.since, -1), true) + (s.lastDay === today() ? ' (วันนี้)' : '') + '</span>' + nxt + '</div>';
    if (s.state === 'scheduled') return '<div class="' + cls + '"><span class="sdot wait"></span><b>ตั้งเวลาเริ่มยิง</b> <span class="muted">· ' + F.thDate(s.since, true) + '</span></div>';
    return '<div class="' + cls + '"><span class="sdot none"></span><b>ยังไม่มีรอบยิง</b> <span class="muted">· กด "เพิ่มรอบยิง" ใส่วันที่และงบ (ย้อนหลังได้)</span></div>';
  }
  function missingHtml(camp, cov) {
    cov = cov || C.spendCoverage(S.data, camp, today());
    if (!cov.missing.length) return '';
    var a = cov.missing[0], b = cov.missing[cov.missing.length - 1];
    return '<div class="nudge"><span>ยังไม่กรอกค่า Ads ' + cov.missing.length + ' วัน (' + F.thRange(a, b) + ')</span>' +
      '<button class="btn sm" data-spend="' + esc(camp) + '" data-from="' + a + '" data-to="' + b + '">กรอกเลย</button></div>';
  }
  function actionButtons(camp, compact) {
    var s = C.campState(S.data, camp, today());
    var h = '';
    if (s.state === 'running') h += '<button class="btn sm" data-act="adjust" data-camp="' + esc(camp) + '">ปรับงบ</button><button class="btn ghost sm" data-act="stop" data-camp="' + esc(camp) + '">หยุดยิง</button>';
    else h += '<button class="btn sm" data-act="new" data-camp="' + esc(camp) + '">' + (s.state === 'none' ? 'เพิ่มรอบยิง' : 'เปิดยิงอีกครั้ง') + '</button>';
    if (!compact) h += '<button class="btn ghost sm" data-spend="' + esc(camp) + '">กรอกค่า Ads</button>';
    return h;
  }
  function wireActions(root) {
    $$('[data-act]', root).forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var lv = b.dataset.level != null ? [b.dataset.level] : null;
        if (b.dataset.act === 'new') runDialog({ campaign: b.dataset.camp, adset: lv ? lv[0] : null });
        else changeDialog(b.dataset.camp, b.dataset.act, lv);
      };
    });
    $$('[data-spend]', root).forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); spendDialog({ campaign: b.dataset.spend, date: b.dataset.from, date_to: b.dataset.to }); };
    });
  }

  function pageCampaigns() {
    var nv = S.campNav || (S.campNav = { camp: null, filter: 'active' });
    var cp = nv.camp ? findCampById(nv.camp) : null;
    if (!cp) { nv.camp = null; S.spendAll = false; return campList(); }
    campDetail(cp);
  }

  // ---------- รายการแคมเปญ ----------
  function sparkRange(camp) {
    var td = today(), s = C.campState(S.data, camp, td);
    var end = s.state === 'running' ? td : s.lastDay && s.lastDay < td ? s.lastDay : td;
    return { from: C.addDays(end, -13), to: end };
  }
  function campList() {
    var nv = S.campNav, td = today();
    var order = { running: 0, scheduled: 1, none: 2, paused: 3 };
    var list = S.data.campaigns.map(function (c) { return { c: c, st: C.campaignStatus(S.data, c, td) }; })
      .sort(function (a, b) { return order[a.st.key] - order[b.st.key] || (C.firstStart(S.data, a.c.name) < C.firstStart(S.data, b.c.name) ? 1 : -1); });
    var counts = { active: 0, paused: 0, all: list.length };
    list.forEach(function (x) { if (x.st.key === 'paused') counts.paused++; else counts.active++; });
    var shown = list.filter(function (x) { return nv.filter === 'all' || (nv.filter === 'paused' ? x.st.key === 'paused' : x.st.key !== 'paused'); });
    var miss = list.map(function (x) { return { name: x.c.name, cov: C.spendCoverage(S.data, x.c.name, td) }; }).filter(function (x) { return x.cov.missing.length; });

    var html = '<div class="camp-top"><div class="chip-group">' +
      '<button data-f="active" class="' + (nv.filter === 'active' ? 'on' : '') + '">กำลังใช้งาน (' + counts.active + ')</button>' +
      '<button data-f="paused" class="' + (nv.filter === 'paused' ? 'on' : '') + '">หยุดแล้ว (' + counts.paused + ')</button>' +
      '<button data-f="all" class="' + (nv.filter === 'all' ? 'on' : '') + '">ทั้งหมด (' + counts.all + ')</button></div>' +
      '<span class="actions"><button class="btn ghost" id="bulkSpend2">กรอกค่า Ads</button><button class="btn" id="newCamp">+ สร้างแคมเปญ</button></span></div>';
    if (miss.length) {
      var days = miss.reduce(function (n, x) { return n + x.cov.missing.length; }, 0);
      html += '<div class="todo"><div><b>ยังไม่กรอกค่า Ads</b> ' + miss.length + ' แคมเปญ (รวม ' + days + ' วัน) — ต้องกรอกก่อน ระบบจึงคิดต้นทุน/Lead ได้' +
        '<div class="muted small">' + miss.map(function (x) { return esc(x.name) + ' · ' + x.cov.missing.length + ' วัน'; }).join(' &nbsp;·&nbsp; ') + '</div></div>' +
        '<button class="btn" id="bulkSpend">กรอกทีเดียวทุกแคมเปญ</button></div>';
    }
    html += shown.length ? '<div class="cc-list">' + shown.map(function (x) {
      var c = x.c, st = campStats(c.name), mode = C.budgetMode(S.data, c.name), rg = sparkRange(c.name);
      var dd = C.campaignDaily(S.data, c.name, '', rg.from, rg.to);
      var xp = C.experiments(S.data, { campaign: c.name, today: td })[0];
      return '<div class="card cc2">' +
        '<div class="cc2-main" data-open="' + esc(c.id) + '"><div class="cc2-name">' + esc(c.name) + '</div>' + statusHtml(c.name) +
        '<div class="cc2-meta">' + MODE_LABEL[mode] + ' · ' + C.adsetsOf(S.data, c.name).length + ' Ad set' + (st.days ? ' · ยิงมาแล้ว ' + st.days + ' วัน' : '') + '</div></div>' +
        '<div class="cc2-spark" data-open="' + esc(c.id) + '">' + Charts.spark(dd.map(function (d) { return d.leads; }), dd.map(function (d) { return d.budget; })) +
        '<div class="cc2-cap"><span><i class="lg-bar"></i>Lead</span><span><i class="lg-line"></i>งบ/วัน</span><span>14 วันล่าสุด</span></div></div>' +
        '<div class="cc2-stats"><div><span>Lead</span><b>' + st.leads + '</b></div><div><span>ต้นทุน/Lead</span><b>' + F.baht(st.cpl) + '</b></div><div><span>ปิดได้</span><b>' + st.closed + '</b></div></div>' +
        '<div class="cc2-act">' + actionButtons(c.name, true) + '</div>' +
        (xp || st.cov.missing.length ? '<div class="cc2-foot">' +
          (xp ? '<span>ปรับงบล่าสุด ' + F.thDate(xp.after.from) + ': ' + F.baht(xp.before.daily) + ' → ' + F.baht(xp.after.daily) + ' ' + verdictPill(xp.v, true) + '</span>' : '<span></span>') +
          (st.cov.missing.length ? '<button class="linkish warn-link" data-spend="' + esc(c.name) + '" data-from="' + st.cov.missing[0] + '" data-to="' + st.cov.missing[st.cov.missing.length - 1] + '">ยังไม่กรอกค่า Ads ' + st.cov.missing.length + ' วัน · กรอก ›</button>' : '') + '</div>' : '') +
        '</div>';
    }).join('') + '</div>' : '<div class="card empty">ไม่มีแคมเปญในกลุ่มนี้</div>';
    $('#page').innerHTML = html;
    $$('[data-f]').forEach(function (b) { b.onclick = function () { nv.filter = b.dataset.f; campList(); }; });
    Charts.countUp($('#page'));
    $('#newCamp').onclick = newCampaignDialog;
    $('#bulkSpend2').onclick = bulkSpendDialog;
    if ($('#bulkSpend')) $('#bulkSpend').onclick = bulkSpendDialog;
    $$('[data-open]').forEach(function (d) { d.onclick = function () { nv.camp = d.dataset.open; S.tlLevel = null; pageCampaigns(); window.scrollTo(0, 0); }; });
    wireActions($('#page'));
  }

  // ---------- หน้าแคมเปญ ----------
  function campDetail(cp) {
    var st = campStats(cp.name), mode = C.budgetMode(S.data, cp.name), td = today();
    var xps = C.experiments(S.data, { campaign: cp.name, today: td });
    var html = '<button class="linkish back" id="back">← แคมเปญทั้งหมด</button>';
    html += '<div class="card"><div class="card-head"><div><h2 class="card-title big">' + esc(cp.name) + ' <button class="linkish" id="editCp" title="แก้ชื่อ">✎</button></h2>' +
      statusHtml(cp.name, true) + '<div class="cc2-meta">' + MODE_LABEL[mode] + ' · เริ่มยิง ' + (C.firstStart(S.data, cp.name) ? F.thDate(C.firstStart(S.data, cp.name), true) : '–') + '</div></div>' +
      '<div class="actions">' + actionButtons(cp.name) + '</div></div>' +
      '<div class="facts six">' +
      '<div><span>ยิงไปแล้ว</span><b>' + st.days + ' วัน</b></div>' +
      '<div><span>Lead ที่บันทึก' + (st.cov.hasFb ? ' / แชทที่ FB นับ' : '') + '</span><b>' + st.leads + (st.cov.hasFb ? ' / ' + st.cov.fbChats : '') + ' คน</b></div>' +
      '<div><span>ปิดได้</span><b>' + st.closed + ' เคส</b></div>' +
      '<div><span>' + (st.cov.hasFb ? 'ค่า Ads' : 'ค่า Ads ที่กรอก') + '</span><b>' + (st.spend ? F.baht(st.spend) : '–') + '</b></div>' +
      '<div><span>ต้นทุน/Lead</span><b>' + F.baht(st.cpl) + '</b></div>' +
      '<div><span>ต้นทุน/เคส</span><b>' + F.baht(st.cpc) + '</b></div></div>' +
      missingHtml(cp.name, st.cov) + '</div>';

    // ไทม์ไลน์ งบ vs Lead
    var levels = [''].concat(C.adsetsOf(S.data, cp.name).filter(function (a) { return C.runsOf(S.data, cp.name, a).length; }));
    if (S.tlLevel == null || levels.indexOf(S.tlLevel) < 0) S.tlLevel = '';
    var first = C.firstStart(S.data, cp.name), tl = null;
    if (first && first <= td) {
      var s = C.campState(S.data, cp.name, td), end = s.state === 'running' ? td : s.lastDay ? C.addDays(s.lastDay, 2) : td;
      if (end > td) end = td;
      var from = first;
      if (C.daysIncl(from, end) > 90) from = C.addDays(end, -89);
      tl = { from: from, to: end, days: C.campaignDaily(S.data, cp.name, S.tlLevel, from, end) };
    }
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">งบที่ตั้ง กับ Lead ที่ได้ — รายวัน</h2>' +
      '<div class="card-sub">ปรับงบแล้วแท่ง Lead สูงขึ้นตามเส้นงบไหม · เส้นประ = วันที่ปรับงบ · ชี้ที่วันเพื่อดูตัวเลข</div></div>' +
      (levels.length > 1 ? '<div class="chip-group">' + levels.map(function (lv) { return '<button data-tl="' + esc(lv) + '" class="' + (S.tlLevel === lv ? 'on' : '') + '">' + (lv ? esc(lv) : 'ทั้งแคมเปญ') + '</button>'; }).join('') + '</div>' : '') + '</div>' +
      (tl ? legend([['Lead ต่อวัน', 'var(--primary)'], ['งบ/วันที่ตั้ง', 'var(--budget)']]) + '<div class="chart-box" id="chTl"></div>' : '<div class="empty">ยังไม่มีรอบยิง — กด "เพิ่มรอบยิง"</div>') + '</div>';

    // ผลการปรับงบ
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ปรับงบแล้วคุ้มไหม</h2>' +
      '<div class="card-sub">เทียบช่วงก่อนปรับกับหลังปรับให้อัตโนมัติ · ตัดสินจากต้นทุนต่อ Lead</div></div></div>' +
      (xps.length ? '<div class="xp-grid">' + xps.map(function (x) { return xpCard(x, false); }).join('') + '</div>'
        : '<div class="empty">ยังไม่เคยปรับงบ — อยากทดลองเมื่อไหร่กด "ปรับงบ" ด้านบน ระบบจะเทียบผลก่อน/หลังให้ที่นี่ (สรุปได้หลังยิงครบ ' + C.MIN_DAYS + ' วัน)</div>') + '</div>';

    html += historyCard(cp);
    html += '<div class="grid row-2 mt">' + spendCard(cp, st.cov) + adsetCard(cp, mode) + '</div>';
    $('#page').innerHTML = html;

    if (tl) {
      var marks = [];
      var lvList = S.tlLevel ? [S.tlLevel] : levels;
      lvList.forEach(function (lv) {
        C.runsOf(S.data, cp.name, lv).forEach(function (r, i, arr) {
          var idx = C.daysIncl(tl.from, r.from) - 1;
          if (idx < 0 || r.from > tl.to) return;
          var prev = arr[i - 1];
          marks.push({ i: idx, label: (lvList.length > 1 && lv ? lv.slice(0, 10) + ': ' : '') + (prev && prev.amount !== r.amount && (!prev.to || C.addDays(prev.to, 1) === r.from) ? F.int(prev.amount) + '→' + F.int(r.amount) : 'เริ่ม ' + F.int(r.amount)) });
        });
      });
      var dd = tl.days;
      S.drawCharts = function () {
        var el = document.getElementById('chTl');
        if (el) Charts.timeline(el, {
          dates: dd.map(function (d) { return d.date; }), leads: dd.map(function (d) { return d.leads; }), budget: dd.map(function (d) { return d.budget; }), marks: marks,
          labels: dd.map(function (d) { return String(Number(d.date.slice(8))) + (d.date.slice(8) === '01' || d === dd[0] ? ' ' + F.thDate(d.date).split(' ')[1] : ''); }),
          tips: dd.map(function (d) {
            return '<b>' + F.thDate(d.date, true) + '</b><div class="row"><span>Lead</span><b>' + d.leads + ' คน</b></div><div class="row"><span>งบที่ตั้ง</span><b>' + (d.budget ? F.baht(d.budget) : 'หยุด') + '</b></div>' +
              '<div class="row"><span>ค่า Ads ที่กรอก</span><b>' + (d.spend ? F.baht(d.spend) : '–') + '</b></div>' + (d.closed ? '<div class="row"><span>ปิดได้ (ทักวันนี้)</span><b>' + d.closed + '</b></div>' : '');
          }), height: 320, aria: 'งบที่ตั้งกับ Lead รายวัน'
        });
      };
      S.drawCharts();
    } else S.drawCharts = null;
    Charts.countUp($('#page'));

    $('#back').onclick = function () { S.campNav.camp = null; S.drawCharts = null; pageCampaigns(); };
    $('#editCp').onclick = function () { editCampaign(cp.id); };
    $('#addRun').onclick = function () { runDialog({ campaign: cp.name, adset: mode === 'adset' ? null : '' }); };
    $$('[data-tl]').forEach(function (b) { b.onclick = function () { S.tlLevel = b.dataset.tl; campDetail(cp); }; });
    wireActions($('#page'));
    $$('[data-run]').forEach(function (r) { r.onclick = function () { runDialog(S.data.budgets.filter(function (b) { return b.id === r.dataset.run; })[0]); }; });
    $$('[data-sp]').forEach(function (r) { r.onclick = function () { spendDialog(S.data.spend.filter(function (x) { return x.id === r.dataset.sp; })[0]); }; });
    $('#addAs').onclick = function () { editAdset({ campaign: cp.name }); };
    if ($('#spendAll')) $('#spendAll').onclick = function () { S.spendAll = true; campDetail(cp); };
    $$('[data-eas]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); editAdset(adsetRecs(cp.name).filter(function (a) { return a.name === b.dataset.eas; })[0]); }; });
    $$('[data-addad]').forEach(function (b) { b.onclick = function () { editAd(null, { campaign: cp.name, adset: b.dataset.addad }); }; });
    $$('[data-aid]').forEach(function (r) { r.onclick = function () { editAd(r.dataset.aid); }; });
  }

  /** ประวัติรอบยิง — รายการเรียบ ๆ อ่านจากบนลงล่าง กดแถวเพื่อแก้ */
  function historyCard(cp) {
    var td = today(), daily = C.spendDaily(S.data);
    var groups = [''].concat(C.adsetsOf(S.data, cp.name)).map(function (lv) { return { lv: lv, rows: C.runResults(S.data, cp.name, lv, td, daily) }; }).filter(function (g) { return g.rows.length; });
    var html = '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ประวัติรอบยิง</h2>' +
      '<div class="card-sub">1 รอบ = ช่วงที่ยิงด้วยงบ/วันเท่าเดิม · ปรับงบ/หยุด/เปิดใหม่ ใช้ปุ่มด้านบน · ใส่ของเก่าย้อนหลังได้ · กดแถวเพื่อแก้</div></div>' +
      '<button class="btn ghost sm" id="addRun">+ เพิ่มรอบย้อนหลัง</button></div>';
    if (!groups.length) return html + '<div class="empty">ยังไม่มีรอบยิง</div></div>';
    groups.forEach(function (g) {
      if (groups.length > 1 || g.lv) html += '<div class="rh-grp">' + (g.lv ? 'Ad set: ' + esc(g.lv) : 'ทั้งแคมเปญ (CBO)') + '</div>';
      html += '<div class="rh">';
      var prevTo = null;
      g.rows.forEach(function (r, i) {
        if (prevTo && r.from > C.addDays(prevTo, 1)) {
          var gf = C.addDays(prevTo, 1), gt = C.addDays(r.from, -1);
          html += '<div class="rh-gap">หยุด ' + C.daysIncl(gf, gt) + ' วัน · ' + F.thRange(gf, gt) + '</div>';
        }
        prevTo = r.plannedTo || (r.future ? null : td);
        html += '<div class="rh-row click' + (r.ongoing ? ' live' : '') + (r.future ? ' future' : '') + '" data-run="' + esc(r.run.id) + '">' +
          '<span class="rh-no">' + (i + 1) + '</span>' +
          '<div class="rh-date"><b>' + F.thDate(r.from, true) + ' – ' + (r.plannedTo ? F.thDate(r.plannedTo, true) : '<span class="live-t">ยังยิงอยู่</span>') + '</b>' +
          '<span>' + (r.future ? 'ตั้งเวลาไว้' : r.days + ' วัน') + (r.note ? ' · ' + esc(r.note) : '') + (r.run.legacy ? ' · <span class="dup">ตรวจวันจบ</span>' : '') + '</span></div>' +
          '<div class="rh-bud"><b>' + F.baht(r.daily) + '</b><span>ต่อวัน</span></div>' +
          '<div class="rh-res">' + (r.future ? '<span>–</span>' : '<b>' + r.leads + ' Lead</b><span>' + r.leadsPerDay.toFixed(1) + '/วัน · ' + (r.cpl != null ? F.baht(r.cpl) + '/Lead' : r.spend ? 'ยังไม่มี Lead' : 'ยังไม่กรอกค่า Ads') + '</span>') + '</div>' +
          '<span class="rh-edit">แก้ ›</span></div>';
      });
      html += '</div>';
    });
    return html + '</div>';
  }
  function chgHtml(v, goodUp) {
    if (v == null || !isFinite(v) || Math.abs(v) < 0.005) return '';
    var up = v > 0, good = goodUp ? up : !up;
    return '<div class="chg ' + (good ? 'up' : 'down') + '">' + (up ? '▲ ' : '▼ ') + Math.abs(v * 100).toFixed(0) + '%</div>';
  }

  function spendCard(cp, cov) {
    var list = cov.entries.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return '<div class="card"><div class="card-head"><div><h2 class="card-title">ค่า Ads ที่ใช้จริง</h2>' +
      '<div class="card-sub">รวม ' + F.baht(cov.total) + (cov.lastTo ? ' · กรอกถึง ' + F.thDate(cov.lastTo, true) : ' · ยังไม่ได้กรอก') + ' · ยอด Amount spent จาก Ads Manager</div></div>' +
      '<button class="btn sm" data-spend="' + esc(cp.name) + '">+ กรอกค่า Ads</button></div>' +
      (list.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>ช่วงวันที่</th><th>ระดับ</th><th class="r">ยอด</th><th class="r">เฉลี่ย/วัน</th></tr></thead><tbody>' +
        list.slice(0, S.spendAll ? 500 : 8).map(function (s) {
          var to = s.date_to || s.date, n = C.daysIncl(s.date, to);
          return '<tr class="click" data-sp="' + esc(s.id) + '"><td class="num">' + F.thRange(s.date, to) + (s.note ? '<div class="muted small">' + esc(s.note) + '</div>' : '') + '</td>' +
            '<td class="muted">' + (s.source === 'fb' ? '<span class="pill info">ดึงจาก Facebook</span>' + (Number(s.results) ? ' ' + s.results + ' แชท' : '') : s.adset ? esc(s.adset) : 'กรอกเอง') + '</td><td class="r num">' + F.baht(Number(s.amount)) + '</td><td class="r num muted">' + F.baht(Number(s.amount) / n) + '</td></tr>';
        }).join('') + '</tbody></table></div>' + (list.length > 8 && !S.spendAll ? '<button class="linkish" id="spendAll" style="margin-top:8px">ดูทั้งหมด (' + list.length + ' รายการ)</button>' : '')
        : '<div class="empty">ยังไม่มี — กด "+ กรอกค่า Ads"</div>') + '</div>';
  }

  function adsetCard(cp, mode) {
    var td = today(), sets = adsetRecs(cp.name);
    var people = C.uniquePeople(S.data.chats.filter(function (c) { return c.campaign === cp.name; })).filter(function (p) { return C.stageOf(p.status) >= 1; });
    function leadsOf(f) { return people.filter(f).length; }
    var html = '<div class="card"><div class="card-head"><div><h2 class="card-title">Ad set และโฆษณา</h2><div class="card-sub">โฆษณาที่ "แสดงในบันทึกแชท" = รายการที่แอดมินเลือกตอนบันทึกแชท</div></div>' +
      '<button class="btn sm" id="addAs">+ Ad set</button></div>';
    if (!sets.length) return html + '<div class="empty">ยังไม่มี Ad set</div></div>';
    html += sets.map(function (a) {
      var ads = S.data.ads.filter(function (d) { return d.campaign === cp.name && d.adset === a.name; });
      var ls = mode === 'adset' ? C.levelState(S.data, cp.name, a.name, td) : null;
      var ctl = '';
      if (ls) {
        ctl = '<span class="as-state">' + (ls.state === 'running' ? '<span class="sdot on"></span>' + F.baht(ls.amount) + '/วัน' : '<span class="sdot off"></span>หยุด') + '</span>' +
          (ls.state === 'running'
            ? '<button class="btn ghost sm" data-act="adjust" data-camp="' + esc(cp.name) + '" data-level="' + esc(a.name) + '">ปรับงบ</button><button class="btn ghost sm" data-act="stop" data-camp="' + esc(cp.name) + '" data-level="' + esc(a.name) + '">หยุด</button>'
            : '<button class="btn ghost sm" data-act="new" data-camp="' + esc(cp.name) + '" data-level="' + esc(a.name) + '">เปิดยิง</button>');
      }
      return '<div class="as-block"><div class="as-head"><div class="as-name">' + esc(a.name) + ' <button class="linkish" data-eas="' + esc(a.name) + '">✎</button>' +
        '<div class="muted small">' + ads.length + ' โฆษณา · Lead ' + leadsOf(function (p) { return p.adset === a.name; }) + '</div></div>' +
        '<div class="actions">' + ctl + '</div></div>' +
        '<div class="as-ads">' + ads.map(function (d) {
          return '<div class="ad-row click" data-aid="' + esc(d.id) + '">' + (d.creative_url ? '<img class="thumb" src="' + esc(d.creative_url) + '" alt="" loading="lazy">' : '<div class="thumb"></div>') +
            '<div class="ad-name">' + esc(d.ad_name) + '</div>' +
            (d.post_url ? '<a href="' + esc(d.post_url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + I.link + '</a>' : '<span></span>') +
            '<span class="muted num">Lead ' + leadsOf(function (p) { return p.ad === d.ad_name; }) + '</span>' +
            (isTrue(d.active) ? '<span class="pill good">แสดงในบันทึกแชท</span>' : '<span class="pill">ซ่อน</span>') + '</div>';
        }).join('') + '<button class="linkish addad" data-addad="' + esc(a.name) + '">+ โฆษณา</button></div></div>';
    }).join('') + '</div>';
    return html;
  }

  // ---------- บันทึก + ตรวจกับชีต ----------
  function upsertLocal(list, saved) {
    var i = list.findIndex(function (x) { return x.id === saved.id; });
    if (i >= 0) list[i] = saved; else list.push(saved);
    return saved;
  }
  function saveRun(rec) { return API.call('saveBudget', { budget: rec }).then(function (s) { return upsertLocal(S.data.budgets, s); }); }
  function saveCampRec(cp, patch) {
    return API.call('saveCampaign', { campaign: Object.assign({}, cp, patch) }).then(function (s) { return upsertLocal(S.data.campaigns, s); });
  }
  /** โหลดข้อมูลใหม่จากชีตหลังบันทึก — สิ่งที่เห็นบนจอ = สิ่งที่อยู่ในชีตจริง */
  function reloadAfterSave(msg) {
    return refresh().then(function () { toast(msg); render(); }).catch(function () { toast(msg); render(); });
  }
  /**
   * เขียนข้อมูลแบบเก่าของแคมเปญให้เป็น "รอบ" ที่มีวันจบชัดเจน (ทำครั้งแรกที่แก้แคมเปญนั้น)
   */
  function normalizeCamp(camp) {
    if (!C.needsNormalize(S.data, camp)) return Promise.resolve();
    var chain = Promise.resolve();
    [''].concat(C.adsetsOf(S.data, camp)).forEach(function (lv) {
      C.runsOf(S.data, camp, lv).forEach(function (r) {
        if (r.legacy || (r.row.end_date || '') !== (r.to || '')) chain = chain.then(function () { return saveRun(Object.assign({}, r.row, { end_date: r.to || '' })); });
      });
    });
    S.data.budgets.filter(function (b) { return b.campaign === camp && !(Number(b.daily_budget) > 0); }).forEach(function (b) {
      chain = chain.then(function () { return API.call('deleteBudget', { id: b.id }); }).then(function () { S.data.budgets = S.data.budgets.filter(function (x) { return x.id !== b.id; }); });
    });
    var cp = S.data.campaigns.filter(function (c) { return c.name === camp; })[0];
    if (cp && cp.end_date) chain = chain.then(function () { return saveCampRec(cp, { end_date: '' }); });
    return chain;
  }
  function syncStart(camp) {
    var cp = S.data.campaigns.filter(function (c) { return c.name === camp; })[0];
    var first = C.firstStart(S.data, camp);
    if (cp && first && cp.start_date !== first) return saveCampRec(cp, { start_date: first });
    return Promise.resolve();
  }

  function dateChips(id) {
    return '<div class="chips-row"><button type="button" class="chip" data-d="' + id + '" data-v="' + today() + '">วันนี้</button>' +
      '<button type="button" class="chip" data-d="' + id + '" data-v="' + C.addDays(today(), -1) + '">เมื่อวาน</button>' +
      '<button type="button" class="chip" data-d="' + id + '" data-v="' + C.addDays(today(), 1) + '">พรุ่งนี้</button></div>';
  }
  function wireDateChips(el) {
    $$('[data-d]', el).forEach(function (b) { b.onclick = function () { $('#' + b.dataset.d, el).value = b.dataset.v; }; });
  }

  /** เพิ่ม/แก้ 1 รอบ: วันเริ่ม · วันจบ (ว่าง = ยังยิง) · งบ/วัน · ระดับ · สิ่งที่ทดลอง */
  function runDialog(b) {
    var isNew = !b.id, camp = b.campaign, sets = C.adsetsOf(S.data, camp);
    var mode = C.budgetMode(S.data, camp);
    var lv = b.adset != null ? b.adset : (mode === 'adset' && sets.length ? sets[0] : '');
    var lastRun = C.runsOf(S.data, camp, lv).slice(-1)[0];
    var amount = b.daily_budget != null ? b.daily_budget : lastRun ? lastRun.amount : '';
    var known = b.id ? C.runsOf(S.data, camp, b.adset || '').filter(function (r) { return r.id === b.id; })[0] : null;
    var endVal = b.end_date || (known && known.to) || '';
    modal('<h3>' + (isNew ? 'เพิ่มรอบยิง' : 'แก้รอบยิง') + ' — ' + esc(camp) + '</h3><form id="rnForm" class="form-grid">' +
      '<div class="f c6"><label>เริ่มยิงวันที่</label><input type="date" id="rnFrom" value="' + esc(b.start_date || today()) + '" required>' + dateChips('rnFrom') + '</div>' +
      '<div class="f c6"><label>ยิงถึงวันที่ <span class="muted">(ว่าง = ยังยิงอยู่)</span></label><input type="date" id="rnTo" value="' + esc(endVal) + '">' +
      '<div class="chips-row"><button type="button" class="chip" id="rnOpen">ยังยิงอยู่</button><button type="button" class="chip" data-plus="6">7 วัน</button><button type="button" class="chip" data-plus="13">14 วัน</button></div></div>' +
      '<div class="f c6"><label>งบที่ตั้ง/วัน (บาท)</label><input type="number" id="rnAmt" min="1" inputmode="numeric" value="' + esc(amount) + '" required></div>' +
      '<div class="f c6"><label>ใช้กับ</label><select id="rnLv">' + opt('', 'ทั้งแคมเปญ (CBO)', lv) + sets.map(function (s) { return opt(s, 'Ad set: ' + s, lv); }).join('') + '</select></div>' +
      '<div class="f c12"><label>สิ่งที่ทดลอง / หมายเหตุ</label><input id="rnNote" value="' + esc(b.note || '') + '" placeholder="เช่น ทดลองเพิ่มงบ +30% · ครีเอทีฟใหม่ · กลับมายิงหลังหยุด"></div>' +
      '<div class="c12 hint" id="rnWarn"></div>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (!isNew ? '<button type="button" class="btn danger" id="rnDel">ลบรอบนี้</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        wireDateChips(el);
        $('#rnOpen', el).onclick = function () { $('#rnTo', el).value = ''; check(); };
        $$('[data-plus]', el).forEach(function (x) { x.onclick = function () { $('#rnTo', el).value = C.addDays($('#rnFrom', el).value, Number(x.dataset.plus)); check(); }; });
        function overlaps() {
          var f = $('#rnFrom', el).value, t = $('#rnTo', el).value || '9999-12-31', l = $('#rnLv', el).value;
          return C.runsOf(S.data, camp, l).filter(function (r) { return r.id !== b.id && r.from <= t && (r.to || '9999-12-31') >= f; });
        }
        function check() {
          var o = overlaps(), w = $('#rnWarn', el);
          w.className = 'c12 hint' + (o.length ? ' warn' : '');
          w.textContent = o.length ? '⚠️ ทับกับรอบ ' + o.map(function (r) { return F.thDate(r.from) + '–' + (r.to ? F.thDate(r.to) : 'ปัจจุบัน'); }).join(', ') + ' — บันทึกแล้วระบบจะตัดวันจบของรอบเก่าให้ก่อนวันเริ่มรอบนี้' : '';
        }
        ['#rnFrom', '#rnTo', '#rnLv'].forEach(function (s) { $(s, el).onchange = check; });
        check();
        $('#rnForm', el).onsubmit = function (e) {
          e.preventDefault();
          var rec = { id: b.id || '', campaign: camp, adset: $('#rnLv', el).value, start_date: $('#rnFrom', el).value, end_date: $('#rnTo', el).value,
            daily_budget: $('#rnAmt', el).value, note: $('#rnNote', el).value.trim() };
          if (rec.end_date && rec.end_date < rec.start_date) return toast('วันจบต้องไม่ก่อนวันเริ่ม', true);
          if (!(Number(rec.daily_budget) > 0)) return toast('ใส่งบ/วัน', true);
          var chain = normalizeCamp(camp).then(function () {
            // รอบเก่าที่ทับ: ตัดวันจบให้จบก่อนวันเริ่มรอบนี้
            var fix = Promise.resolve();
            C.runsOf(S.data, camp, rec.adset).forEach(function (r) {
              if (r.id === rec.id || r.from >= rec.start_date) return;
              if (!r.to || r.to >= rec.start_date) fix = fix.then(function () { return saveRun(Object.assign({}, r.row, { end_date: C.addDays(rec.start_date, -1) })); });
            });
            return fix;
          }).then(function () { return saveRun(rec); }).then(function () { return syncStart(camp); });
          chain.then(function () { close(); return reloadAfterSave('บันทึกรอบยิงแล้ว'); }).catch(fail);
        };
        if ($('#rnDel', el)) $('#rnDel', el).onclick = function () {
          askConfirm('ลบรอบนี้?', function () {
            API.call('deleteBudget', { id: b.id }).then(function () {
              S.data.budgets = S.data.budgets.filter(function (x) { return x.id !== b.id; });
              return syncStart(camp);
            }).then(function () { close(); return reloadAfterSave('ลบรอบแล้ว'); }).catch(fail);
          });
        };
      });
  }

  /** ปรับงบ (จบรอบเดิม + เริ่มรอบใหม่) / หยุดยิง (ใส่วันจบให้รอบที่ยิงอยู่) */
  function changeDialog(camp, kind, levels) {
    var td = today(), mode = C.budgetMode(S.data, camp);
    if (!levels) {
      levels = mode === 'campaign' ? [''] : C.adsetsOf(S.data, camp);
    }
    levels = levels.filter(function (lv) { return C.levelState(S.data, camp, lv, td).state === 'running'; });
    if (!levels.length) return toast('ไม่มีรอบที่กำลังยิงอยู่', true);
    var states = levels.map(function (lv) { return C.levelState(S.data, camp, lv, td); });
    var isAdj = kind === 'adjust';
    var rows = '';
    if (isAdj) {
      rows = '<div class="c12"><table class="t"><tbody>' + levels.map(function (lv, i) {
        var cur = states[i].amount;
        return '<tr><td>' + (lv ? esc(lv) : '<span class="pill info">ทั้งแคมเปญ</span>') + '<div class="muted small">ตอนนี้ ' + F.baht(cur) + '/วัน</div></td>' +
          '<td class="r" style="width:280px"><input class="bk" data-lv="' + esc(lv) + '" data-old="' + cur + '" type="number" min="1" inputmode="numeric" value="' + cur + '">' +
          '<div class="chips-row r"><button type="button" class="chip" data-pct="-0.2" data-i="' + i + '">−20%</button><button type="button" class="chip" data-pct="0.2" data-i="' + i + '">+20%</button><button type="button" class="chip" data-pct="0.5" data-i="' + i + '">+50%</button></div></td></tr>';
      }).join('') + '</tbody></table></div>';
    } else {
      rows = '<div class="c12 muted">หยุด: ' + levels.map(function (lv) { return lv ? esc(lv) : 'ทั้งแคมเปญ'; }).join(', ') + '</div>';
    }
    modal('<h3>' + (isAdj ? 'ปรับงบ' : 'หยุดยิง') + ' — ' + esc(camp) + '</h3><form id="cgForm" class="form-grid">' +
      '<div class="f c12"><label>' + (isAdj ? 'ใช้งบใหม่ตั้งแต่วันที่' : 'ยิงวันสุดท้ายวันที่') + '</label><div class="date-line"><input type="date" id="cgDate" value="' + td + '" required>' + dateChips('cgDate') + '</div>' +
      '<div class="hint">' + (isAdj ? 'งบเดิมจะจบวันก่อนหน้า แล้วใช้งบใหม่ตั้งแต่วันนี้ · หลังยิงครบ ' + C.MIN_DAYS + ' วัน ระบบจะบอกว่าคุ้มไหมที่หน้าแคมเปญ' : 'รอบที่ยิงอยู่จะจบวันนี้ · กลับมายิงเมื่อไหร่กด "เปิดยิงรอบใหม่"') + '</div></div>' +
      rows +
      '<div class="f c12"><label>' + (isAdj ? 'สิ่งที่ทดลอง / เหตุผล' : 'หมายเหตุ') + '</label><input id="cgNote" placeholder="' + (isAdj ? 'เช่น เพิ่มงบดูว่า Lead/วัน ขึ้นตามไหม' : 'เหตุผลที่หยุด') + '"></div>' +
      '<div class="c12 actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">' + (isAdj ? 'ปรับงบ' : 'หยุดยิง') + '</button></div></form>',
      function (el, close) {
        wireDateChips(el);
        $$('[data-pct]', el).forEach(function (b) {
          b.onclick = function () { var inp = $$('.bk', el)[Number(b.dataset.i)]; inp.value = Math.round(Number(inp.dataset.old) * (1 + Number(b.dataset.pct))); };
        });
        $('#cgForm', el).onsubmit = function (e) {
          e.preventDefault();
          var date = $('#cgDate', el).value, note = $('#cgNote', el).value.trim();
          var chain = normalizeCamp(camp), n = 0;
          levels.forEach(function (lv, i) {
            chain = chain.then(function () {
              var cur = C.levelState(S.data, camp, lv, date < td ? date : td).run || C.levelState(S.data, camp, lv, td).run;
              if (!cur) return;
              if (!isAdj) {
                if (date < cur.from) throw new Error('วันหยุดต้องไม่ก่อนวันเริ่มรอบ (' + F.thDate(cur.from, true) + ')');
                n++;
                return saveRun(Object.assign({}, cur.row, { end_date: date, note: note ? (cur.note ? cur.note + ' · ' : '') + 'หยุด: ' + note : cur.note }));
              }
              var inp = $$('.bk', el)[i], amt = Number(inp.value);
              if (!(amt > 0) || amt === Number(inp.dataset.old)) return;
              n++;
              if (date <= cur.from) return saveRun(Object.assign({}, cur.row, { daily_budget: amt, note: note || cur.note }));
              return saveRun(Object.assign({}, cur.row, { end_date: C.addDays(date, -1) })).then(function () {
                return saveRun({ id: '', campaign: camp, adset: lv, start_date: date, end_date: cur.to || '', daily_budget: amt, note: note });
              });
            });
          });
          chain.then(function () {
            if (!n) { toast(isAdj ? 'ยังไม่ได้เปลี่ยนงบ' : 'ไม่มีอะไรเปลี่ยน', true); return; }
            close(); return reloadAfterSave(isAdj ? 'ปรับงบแล้ว' : 'หยุดยิงแล้ว');
          }).catch(fail);
        };
      });
  }

  // ---------- ค่า Ads ที่ใช้จริง ----------
  function spendDialog(sp) {
    var isNew = !sp.id, camp = sp.campaign;
    var cov = C.spendCoverage(S.data, camp, today());
    var y = C.addDays(today(), -1);
    var from = sp.date || (cov.missing[0] || y), to = sp.date_to || sp.date || (cov.missing.length ? cov.missing[cov.missing.length - 1] : y);
    var sets = C.adsetsOf(S.data, camp);
    modal('<h3>' + (isNew ? 'กรอกค่า Ads' : 'แก้ค่า Ads') + ' — ' + esc(camp) + '</h3><form id="spForm" class="form-grid">' +
      '<div class="f c6"><label>ตั้งแต่</label><input type="date" id="spFrom" value="' + esc(from) + '" required></div>' +
      '<div class="f c6"><label>ถึง</label><input type="date" id="spTo" value="' + esc(to) + '" required></div>' +
      '<div class="c12 chips-row"><button type="button" class="chip" data-r="' + y + '|' + y + '">เมื่อวาน</button>' +
      '<button type="button" class="chip" data-r="' + today() + '|' + today() + '">วันนี้</button>' +
      '<button type="button" class="chip" data-r="' + C.addDays(today(), -7) + '|' + y + '">7 วันล่าสุด</button>' +
      (cov.missing.length ? '<button type="button" class="chip" data-r="' + cov.missing[0] + '|' + cov.missing[cov.missing.length - 1] + '">วันที่ยังไม่กรอก</button>' : '') + '</div>' +
      '<div class="f c6"><label>ยอดที่ใช้ไป (บาท)</label><input type="number" id="spAmt" min="0" step="0.01" inputmode="decimal" value="' + esc(sp.amount == null ? '' : sp.amount) + '" required><div class="hint">Amount spent ใน Ads Manager ช่วงวันที่เดียวกัน</div></div>' +
      '<div class="f c6"><label>ระดับ</label><select id="spLv">' + opt('', 'ทั้งแคมเปญ', sp.adset || '') + sets.map(function (s) { return opt(s, 'Ad set: ' + s, sp.adset || ''); }).join('') + '</select><div class="hint">ส่วนใหญ่กรอกทั้งแคมเปญพอ</div></div>' +
      '<div class="f c12"><label>หมายเหตุ</label><input id="spNote" value="' + esc(sp.note || '') + '"></div>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (!isNew ? '<button type="button" class="btn danger" id="spDel">ลบ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $$('[data-r]', el).forEach(function (b) { b.onclick = function () { var r = b.dataset.r.split('|'); $('#spFrom', el).value = r[0]; $('#spTo', el).value = r[1]; }; });
        $('#spAmt', el).focus();
        $('#spForm', el).onsubmit = function (e) {
          e.preventDefault();
          var rec = { id: sp.id || '', campaign: camp, adset: $('#spLv', el).value, date: $('#spFrom', el).value, date_to: $('#spTo', el).value, amount: $('#spAmt', el).value, note: $('#spNote', el).value.trim() };
          if (rec.date_to < rec.date) return toast('วันที่ "ถึง" ต้องไม่ก่อน "ตั้งแต่"', true);
          var overlap = S.data.spend.filter(function (x) {
            return x.id !== rec.id && (x.campaign || '') === camp && (x.adset || '') === rec.adset && x.date <= rec.date_to && (x.date_to || x.date) >= rec.date;
          });
          var go = function () {
            API.call('saveSpend', { spend: rec }).then(function (saved) {
              upsertLocal(S.data.spend, saved); close(); return reloadAfterSave('บันทึกค่า Ads แล้ว');
            }).catch(fail);
          };
          if (overlap.length) askConfirm('ช่วงวันที่นี้ทับกับที่กรอกไว้แล้ว ' + overlap.length + ' รายการ — ยอดจะนับซ้ำ บันทึกต่อไหม?', go); else go();
        };
        if ($('#spDel', el)) $('#spDel', el).onclick = function () {
          askConfirm('ลบรายการค่า Ads นี้?', function () {
            API.call('deleteSpend', { id: sp.id }).then(function () {
              S.data.spend = S.data.spend.filter(function (x) { return x.id !== sp.id; }); close(); return reloadAfterSave('ลบแล้ว');
            }).catch(fail);
          });
        };
      });
  }

  /** กรอกค่า Ads หลายแคมเปญในครั้งเดียว (ช่วงวันที่เดียวกัน) */
  function bulkSpendDialog() {
    var td = today(), y = C.addDays(td, -1), typed = {};
    var allMiss = [];
    S.data.campaigns.forEach(function (c) { allMiss = allMiss.concat(C.spendCoverage(S.data, c.name, td).missing); });
    allMiss.sort();
    modal('<h3>กรอกค่า Ads</h3><form id="bsForm" class="form-grid">' +
      '<div class="f c6"><label>ตั้งแต่</label><input type="date" id="bsFrom" value="' + y + '" required></div>' +
      '<div class="f c6"><label>ถึง</label><input type="date" id="bsTo" value="' + y + '" required></div>' +
      '<div class="c12 chips-row"><button type="button" class="chip" data-r="' + y + '|' + y + '">เมื่อวาน</button>' +
      '<button type="button" class="chip" data-r="' + td + '|' + td + '">วันนี้</button>' +
      '<button type="button" class="chip" data-r="' + C.addDays(td, -7) + '|' + y + '">7 วันล่าสุด</button>' +
      (allMiss.length ? '<button type="button" class="chip" data-r="' + allMiss[0] + '|' + allMiss[allMiss.length - 1] + '">ช่วงที่ยังไม่กรอก (' + F.thRange(allMiss[0], allMiss[allMiss.length - 1]) + ')</button>' : '') + '</div>' +
      '<div class="c12" id="bsRows"></div>' +
      '<div class="c12 hint">ใส่ยอด <b>Amount spent</b> จาก Ads Manager ของแต่ละแคมเปญ ในช่วงวันที่เดียวกัน · ช่องว่าง = ข้าม · ใน Ads Manager เลือกช่วงวันที่ให้ตรงก่อนคัดลอกตัวเลข</div>' +
      '<div class="c12 actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></div></form>',
      function (el, close) {
        function range() { return { from: $('#bsFrom', el).value, to: $('#bsTo', el).value }; }
        function rows() {
          var r = range();
          if (!r.from || !r.to || r.to < r.from) { $('#bsRows', el).innerHTML = '<div class="empty">เลือกช่วงวันที่ให้ถูกต้อง</div>'; return; }
          var list = S.data.campaigns.map(function (c) {
            var dd = C.campaignDaily(S.data, c.name, '', r.from, r.to);
            var run = dd.filter(function (d) { return d.budget > 0; });
            var had = S.data.spend.filter(function (x) { return (x.campaign || '') === c.name && x.date <= r.to && (x.date_to || x.date) >= r.from; });
            return { name: c.name, runDays: run.length, planned: run.reduce(function (a, d) { return a + d.budget; }, 0), had: had };
          }).filter(function (x) { return x.runDays || x.had.length; });
          $('#bsRows', el).innerHTML = list.length ? '<table class="t bs-table"><thead><tr><th>แคมเปญ</th><th class="r">ยอดที่ใช้ไป (บาท)</th></tr></thead><tbody>' + list.map(function (x) {
            var sum = x.had.reduce(function (a, h) { return a + (Number(h.amount) || 0); }, 0);
            return '<tr><td><b>' + esc(x.name) + '</b><div class="muted small">ยิง ' + x.runDays + ' วันในช่วงนี้ · งบที่ตั้งรวม ~' + F.baht(x.planned) + '</div>' +
              (x.had.length ? '<div class="small warn-t">กรอกไว้แล้ว ' + F.baht(sum) + ' (' + x.had.length + ' รายการ) — ใส่อีกจะนับซ้ำ</div>' : '') + '</td>' +
              '<td class="r"><input class="bs-amt" data-c="' + esc(x.name) + '" data-had="' + x.had.length + '" type="number" min="0" step="0.01" inputmode="decimal" value="' + esc(typed[x.name] || '') + '" placeholder="' + (x.had.length ? 'กรอกแล้ว' : '0') + '"></td></tr>';
          }).join('') + '</tbody></table>' : '<div class="empty">ไม่มีแคมเปญที่ยิงในช่วงนี้</div>';
          $$('.bs-amt', el).forEach(function (i) { i.oninput = function () { typed[i.dataset.c] = i.value; }; });
          var f = $('.bs-amt[data-had="0"]', el) || $('.bs-amt', el);
          if (f) f.focus();
        }
        $$('[data-r]', el).forEach(function (b) { b.onclick = function () { var r = b.dataset.r.split('|'); $('#bsFrom', el).value = r[0]; $('#bsTo', el).value = r[1]; rows(); }; });
        $('#bsFrom', el).onchange = rows; $('#bsTo', el).onchange = rows;
        rows();
        $('#bsForm', el).onsubmit = function (e) {
          e.preventDefault();
          var r = range();
          if (r.to < r.from) return toast('วันที่ "ถึง" ต้องไม่ก่อน "ตั้งแต่"', true);
          var items = $$('.bs-amt', el).filter(function (i) { return i.value !== ''; });
          if (!items.length) return toast('ยังไม่ได้ใส่ยอด', true);
          var dup = items.filter(function (i) { return i.dataset.had !== '0'; }).length;
          var go = function () {
            var chain = Promise.resolve();
            items.forEach(function (i) {
              chain = chain.then(function () {
                return API.call('saveSpend', { spend: { id: '', campaign: i.dataset.c, adset: '', date: r.from, date_to: r.to, amount: i.value, note: '' } }).then(function (sv) { upsertLocal(S.data.spend, sv); });
              });
            });
            chain.then(function () { close(); return reloadAfterSave('บันทึกค่า Ads ' + items.length + ' แคมเปญแล้ว'); }).catch(fail);
          };
          if (dup) askConfirm(dup + ' แคมเปญมีค่า Ads ในช่วงนี้อยู่แล้ว — ยอดจะนับซ้ำ บันทึกต่อไหม?', go); else go();
        };
      });
  }

  // ---------- สร้างแคมเปญ (ครบในหน้าเดียว) ----------
  function newCampaignDialog() {
    function asRow() {
      return '<tr><td><input class="nc-as" placeholder="ชื่อ Ad set เช่น Ad Set A : iPhone 11–13"></td>' +
        '<td><input class="nc-ad" placeholder="ชื่อโฆษณา (ว่าง = ชื่อเดียวกับ Ad set)"></td>' +
        '<td class="abo-only" style="width:120px"><input class="nc-bd" type="number" min="1" inputmode="numeric" placeholder="งบ/วัน"></td>' +
        '<td style="width:36px"><button type="button" class="linkish nc-del">✕</button></td></tr>';
    }
    modal('<h3>สร้างแคมเปญ</h3><form id="ncForm" class="form-grid">' +
      '<div class="f c12"><label>ชื่อแคมเปญ (ตรงกับใน Ads Manager)</label><input id="ncName" required></div>' +
      '<div class="f c6"><label>เริ่มยิงวันที่</label><input type="date" id="ncDate" value="' + today() + '" required>' + dateChips('ncDate') + '</div>' +
      '<div class="f c6"><label>ยิงถึงวันที่ <span class="muted">(ว่าง = ยังยิงอยู่ · แคมเปญที่จบแล้วใส่วันจบได้)</span></label><input type="date" id="ncEnd"></div>' +
      '<div class="f c12"><label>ตั้งงบที่</label><div class="seg2"><label><input type="radio" name="ncMode" value="campaign" checked> ทั้งแคมเปญ (CBO)</label><label><input type="radio" name="ncMode" value="adset"> แยกราย Ad set</label></div></div>' +
      '<div class="f c6 cbo-only"><label>งบ/วัน ทั้งแคมเปญ (บาท)</label><input type="number" id="ncBudget" min="1" inputmode="numeric"></div>' +
      '<div class="f c12"><label>Ad set และโฆษณา</label><table class="t nc-table"><tbody id="ncRows">' + asRow() + '</tbody></table>' +
      '<button type="button" class="linkish" id="ncAdd" style="padding:6px 0">+ เพิ่ม Ad set</button></div>' +
      '<div class="f c12"><label>หมายเหตุ / สิ่งที่ทดลอง</label><input id="ncNote"></div>' +
      '<div class="c12 actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">สร้าง</button></div></form>',
      function (el, close) {
        wireDateChips(el);
        function mode() { return $('input[name=ncMode]:checked', el).value; }
        function syncMode() {
          $$('.abo-only', el).forEach(function (x) { x.style.display = mode() === 'adset' ? '' : 'none'; });
          $$('.cbo-only', el).forEach(function (x) { x.style.display = mode() === 'campaign' ? '' : 'none'; });
        }
        function wireDel() { $$('.nc-del', el).forEach(function (b) { b.onclick = function () { if ($$('#ncRows tr', el).length > 1) b.closest('tr').remove(); }; }); }
        $$('input[name=ncMode]', el).forEach(function (r) { r.onchange = syncMode; });
        $('#ncAdd', el).onclick = function () { $('#ncRows', el).insertAdjacentHTML('beforeend', asRow()); syncMode(); wireDel(); };
        syncMode(); wireDel();
        $('#ncForm', el).onsubmit = function (e) {
          e.preventDefault();
          var name = $('#ncName', el).value.trim(), date = $('#ncDate', el).value, end = $('#ncEnd', el).value, m = mode(), note = $('#ncNote', el).value.trim();
          if (end && end < date) return toast('วันจบต้องไม่ก่อนวันเริ่ม', true);
          var rows = $$('#ncRows tr', el).map(function (tr) {
            return { as: $('.nc-as', tr).value.trim(), ad: $('.nc-ad', tr).value.trim(), bd: $('.nc-bd', tr).value };
          }).filter(function (r) { return r.as; });
          if (m === 'campaign' && !(Number($('#ncBudget', el).value) > 0)) return toast('ใส่งบ/วันของแคมเปญ', true);
          if (m === 'adset' && !rows.some(function (r) { return Number(r.bd) > 0; })) return toast('ใส่งบ/วันอย่างน้อย 1 Ad set', true);
          var chain = saveCampRec({ id: '', name: name, start_date: date, end_date: '', objective: '', note: note }, {});
          rows.forEach(function (r) {
            chain = chain.then(function () {
              return API.call('saveAdset', { adset: { campaign: name, name: r.as, active: true, note: '' } }).then(function (s) { S.data.adsets.push(s); });
            }).then(function () {
              return API.call('saveAd', { ad: { campaign: name, adset: r.as, ad_name: r.ad || r.as, active: true, post_url: '', creative_url: '', note: '' } }).then(function (s) { S.data.ads.push(s); });
            });
          });
          if (m === 'campaign') chain = chain.then(function () { return saveRun({ campaign: name, adset: '', start_date: date, end_date: end, daily_budget: $('#ncBudget', el).value, note: note || 'เริ่มยิง' }); });
          else rows.forEach(function (r) {
            if (Number(r.bd) > 0) chain = chain.then(function () { return saveRun({ campaign: name, adset: r.as, start_date: date, end_date: end, daily_budget: r.bd, note: note || 'เริ่มยิง' }); });
          });
          chain.then(function () {
            var cp = S.data.campaigns.filter(function (c) { return c.name === name; })[0];
            S.campNav = { camp: cp ? cp.id : null, filter: 'active' };
            close(); return reloadAfterSave('สร้างแคมเปญแล้ว');
          }).catch(fail);
        };
      });
  }

  function editCampaign(id) {
    var c = findCampById(id);
    var used = S.data.ads.some(function (a) { return a.campaign === c.name; }) || S.data.chats.some(function (x) { return x.campaign === c.name; });
    modal('<h3>แก้ไขแคมเปญ</h3><form id="cpForm" class="form-grid">' +
      '<div class="f c12"><label>ชื่อแคมเปญ</label><input id="cpName" value="' + esc(c.name) + '" required><div class="hint">เปลี่ยนชื่อได้ — แชท/โฆษณา/งบเดิมเปลี่ยนตามให้</div></div>' +
      '<div class="f c12"><label>หมายเหตุ</label><input id="cpNote" value="' + esc(c.note || '') + '"></div>' +
      '<div class="c12 muted small">วันเริ่ม/วันจบ/งบ แก้ที่ตาราง "รอบการยิง" ในหน้าแคมเปญ</div>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (!used ? '<button type="button" class="btn danger" id="cpDel">ลบแคมเปญ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#cpForm', el).onsubmit = function (e) {
          e.preventDefault();
          saveCampRec(c, { name: $('#cpName', el).value.trim(), note: $('#cpNote', el).value.trim() })
            .then(function () { close(); return reloadAfterSave('บันทึกแล้ว'); }).catch(fail);
        };
        if ($('#cpDel', el)) $('#cpDel', el).onclick = function () {
          askConfirm('ลบแคมเปญ ' + c.name + ' ?', function () {
            API.call('deleteCampaign', { id: c.id }).then(function () {
              S.campNav = { camp: null, filter: 'active' }; close(); return reloadAfterSave('ลบแล้ว');
            }).catch(fail);
          });
        };
      });
  }

  function editAdset(a) {
    var isNew = !a.id && !a.name;
    var used = !isNew && (S.data.ads.some(function (x) { return x.campaign === a.campaign && x.adset === a.name; }) || S.data.chats.some(function (x) { return x.campaign === a.campaign && x.adset === a.name; }));
    var mode = C.budgetMode(S.data, a.campaign);
    modal('<h3>' + (isNew ? 'เพิ่ม Ad set' : 'แก้ไข Ad set') + '</h3><form id="asForm" class="form-grid">' +
      '<div class="f c12"><label>ชื่อ Ad set (ตรงกับใน Ads Manager)</label><input id="asName" value="' + esc(a.name || '') + '" required>' + (used ? '<div class="hint">เปลี่ยนชื่อได้ — แชท/โฆษณา/งบเดิมเปลี่ยนตามให้</div>' : '') + '</div>' +
      (isNew ? '<div class="f c12"><label>ชื่อโฆษณาแรก (ว่าง = ชื่อเดียวกับ Ad set)</label><input id="asAd"></div>' : '') +
      (isNew && mode === 'adset' ? '<div class="f c6"><label>งบ/วัน (เริ่มวันนี้)</label><input type="number" id="asBudget" min="1" inputmode="numeric"></div>' : '') +
      '<div class="c12 actions" style="justify-content:space-between">' + (!isNew && !used && a.id ? '<button type="button" class="btn danger" id="asDel">ลบ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#asForm', el).onsubmit = function (e) {
          e.preventDefault();
          var name = $('#asName', el).value.trim();
          var adName = $('#asAd', el) ? $('#asAd', el).value.trim() : '';
          var bd = $('#asBudget', el) ? $('#asBudget', el).value : '';
          API.call('saveAdset', { adset: { id: a.id || '', campaign: a.campaign, name: name, active: true, note: a.note || '' } }).then(function () {
            var chain = Promise.resolve();
            if (isNew) chain = chain.then(function () { return API.call('saveAd', { ad: { campaign: a.campaign, adset: name, ad_name: adName || name, active: true, post_url: '', creative_url: '', note: '' } }); });
            if (Number(bd) > 0) chain = chain.then(function () { return saveRun({ campaign: a.campaign, adset: name, start_date: today(), end_date: '', daily_budget: bd, note: 'เริ่มยิง' }); });
            return chain;
          }).then(function () { close(); return reloadAfterSave('บันทึก Ad set แล้ว'); }).catch(fail);
        };
        if ($('#asDel', el)) $('#asDel', el).onclick = function () {
          askConfirm('ลบ Ad set ' + a.name + ' ?', function () {
            API.call('deleteAdset', { id: a.id }).then(function () { close(); return reloadAfterSave('ลบแล้ว'); }).catch(fail);
          });
        };
      });
  }


  // ============================================================
  // ต้นทุนต่อหมวด (FB + Google)
  // ============================================================
  function dBadge(cur, old, goodUp, kind) {
    if (cur == null || old == null || !old || !isFinite(cur) || !isFinite(old)) return '<span class="badge n">–</span>';
    var diff, txt;
    if (kind === 'pt') { diff = (cur - old) * 100; txt = Math.abs(diff).toFixed(1) + ' จุด'; if (Math.abs(diff) < 0.05) return '<span class="badge n">เท่าเดิม</span>'; }
    else if (kind === 'abs') { diff = cur - old; txt = Math.abs(diff).toFixed(1); if (Math.abs(diff) < 0.05) return '<span class="badge n">เท่าเดิม</span>'; }
    else { diff = (cur - old) / old; txt = Math.abs(diff * 100).toFixed(0) + '%'; if (Math.abs(diff) < 0.005) return '<span class="badge n">เท่าเดิม</span>'; }
    var good = goodUp ? diff > 0 : diff < 0;
    return '<span class="badge ' + (good ? 'g' : 'b') + '">' + (diff > 0 ? '▲ ' : '▼ ') + txt + '</span>';
  }
  function tBadge(cur, t) {
    if (cur == null || t == null) return '<span class="badge n">' + (t == null ? 'ยังไม่มีเป้า' : 'ยังไม่มีข้อมูล') + '</span>';
    var d = (cur - t) / t;
    return d <= 0 ? '<span class="badge g">✓ ผ่านเป้า</span>' : '<span class="badge b">เกินเป้า ' + Math.round(d * 100) + '%</span>';
  }
  function bulletBar(cur, t) {
    if (cur == null) return '<div class="bl"></div>';
    var mx = Math.max(cur, t || 0) * 1.25 || 1, ok = t == null || cur <= t;
    return '<div class="bl"><i style="width:' + (cur / mx * 100) + '%;background:' + (t == null ? 'var(--primary)' : ok ? 'var(--good)' : 'var(--bad)') + '"></i>' +
      (t != null ? '<b style="left:' + (t / mx * 100) + '%"></b><small style="left:' + (t / mx * 100) + '%">เป้า ' + F.baht(t) + '</small>' : '') + '</div>';
  }
  // ---------- รูปสินค้า (ลายเส้น + รูปจริงถ้ามีไฟล์ assets/img/<หมวด>.png) ----------
  var DEV = {
    iphone: '<rect x="33" y="5" width="34" height="70" rx="8" fill="var(--card)" stroke="currentColor" stroke-width="3"/><rect x="38" y="10" width="15" height="15" rx="4" fill="currentColor" opacity=".18"/><circle cx="42" cy="14.5" r="2.6" fill="currentColor"/><circle cx="48.5" cy="20.5" r="2.6" fill="currentColor"/>',
    ipad: '<rect x="20" y="6" width="60" height="68" rx="7" fill="var(--card)" stroke="currentColor" stroke-width="3"/><rect x="26" y="12" width="48" height="56" rx="3" fill="currentColor" opacity=".12"/>',
    macbook: '<rect x="17" y="10" width="66" height="44" rx="4" fill="var(--card)" stroke="currentColor" stroke-width="3"/><rect x="22" y="15" width="56" height="34" rx="2" fill="currentColor" opacity=".12"/><path d="M6 58h88l-4 7H10z" fill="currentColor"/>',
    notebook: '<path d="M17 10h66v44H17z" fill="var(--card)" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M30 42l14-18 8 10 6-6 12 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M4 58h92l-6 8H10z" fill="currentColor"/>',
    computer: '<rect x="8" y="10" width="58" height="40" rx="4" fill="var(--card)" stroke="currentColor" stroke-width="3"/><path d="M31 50h12l3 12H28z" fill="currentColor"/><rect x="22" y="62" width="30" height="4" rx="2" fill="currentColor"/><rect x="72" y="12" width="22" height="54" rx="4" fill="var(--card)" stroke="currentColor" stroke-width="3"/><circle cx="83" cy="24" r="3.5" fill="currentColor"/>'
  };
  var CAT_SHADE = { iphone: 'var(--primary)', ipad: '#f2884a', macbook: '#f8b185', notebook: '#fbd4b8', computer: '#b9bdcc' };
  // รูปสินค้า: ใช้ไฟล์ใน assets/img/<หมวด>.png ก่อน ถ้าไม่มีใช้ลิงก์ด้านล่าง ถ้าโหลดไม่ได้แสดงลายเส้นแทน
  var PIMG_URL = {
    iphone: 'https://www.apple.com/th/iphone-duo/images/meta/iphone-duo_overview__bmsaaq50eyaa_og.png?202609150114',
    ipad: 'https://instore.studio7thailand.com/apple-product/ipad-pro-m4/images/flex_applecare_small_2x.png?1714498094200',
    macbook: 'https://www.jib.co.th/img_master/product/original/2026032317003284195_1.jpg',
    notebook: 'https://notebookspec.com/web/wp-content/uploads/2025/11/omen-1.jpg',
    computer: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxV9JRudbCedPWtotoSIu6GAR2YhgseFRD8YvneKCTYHX3zUzSjN4tIl_Q&s=10'
  };
  function pimg(k) {
    var alt = esc(PIMG_URL[k] || '');
    return '<span class="pimg' + '' + '"><svg viewBox="0 0 100 80" aria-hidden="true">' + (DEV[k] || '') + '</svg><img src="assets/img/' + k + '.png" data-alt="' + alt + '" alt="" referrerpolicy="no-referrer" loading="lazy"' +
      ' onload="this.parentNode.classList.add(\'ok\')" onerror="var a=this.getAttribute(\'data-alt\');if(a){this.removeAttribute(\'data-alt\');this.src=a}else this.remove()"></span>';
  }
  function nb(v) { return v == null || !isFinite(v) ? '–' : F.int(Math.round(v)); }
  function pctOf(v, t) { return v == null || t == null || !t ? null : (v - t) / t * 100; }
  function sgn(p) { return (p > 0 ? '+' : '−') + Math.abs(Math.round(p)) + '%'; }
  function verdict(v, t) {
    if (v == null) return '<span class="vd n">ยังไม่มีข้อมูล</span>';
    if (t == null) return '<span class="vd n">ยังไม่มีเป้า</span>';
    var d = v - t;
    return d > 0 ? '<span class="vd b">▲ แพงกว่าเป้า ' + F.baht(d) + ' <small>(' + sgn(pctOf(v, t)) + ')</small></span>'
                 : '<span class="vd g">▼ ถูกกว่าเป้า ' + F.baht(-d) + ' <small>(' + sgn(pctOf(v, t)) + ')</small></span>';
  }

  function pageKpi() {
    var kf = S.kf || (S.kf = { preset: 'month', from: '', to: '', cat: 'iphone', metric: 'unit', dm: 'unit' });
    if (!kf.dm) kf.dm = 'unit';
    if (kf.preset !== 'custom') { var r = C.presetRange(kf.preset, S.data, today()); kf.from = r.from; kf.to = r.to; }
    var res = C.costByCat(S.data, kf.from, kf.to).cats, tg = C.kpiTargets(S.data, ['3m', '6m', '1y'].indexOf(kf.preset) >= 0 ? C.presetRange('month', S.data, today()).from : kf.from), T = tg.t;
    var presets = [['month', 'เดือนนี้'], ['lastmonth', 'เดือนก่อน'], ['7d', '7 วัน'], ['30d', '30 วัน'], ['3m', '3 เดือน'], ['6m', '6 เดือน'], ['1y', '1 ปี'], ['custom', 'กำหนดเอง']];
    var noData = !(S.data.gads || []).length && !(S.data.purchases || []).length;
    var html = '<div class="filters"><div class="chip-group">' + presets.map(function (p) { return '<button data-kp="' + p[0] + '" class="' + (kf.preset === p[0] ? 'on' : '') + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      (kf.preset === 'custom' ? '<input type="date" class="field-inline" id="kFrom" value="' + kf.from + '"><input type="date" class="field-inline" id="kTo" value="' + kf.to + '">' : '<span class="muted">' + F.thRange(kf.from, kf.to) + '</span>') + '</div>';
    if (noData) html += '<div class="nudge" style="margin-bottom:18px">ยังไม่มีข้อมูล Google Ads / รับซื้อ — ไปที่ ตั้งค่า แล้วกด "ดึงข้อมูลตอนนี้"' + (S.data.config.gads_error ? ' · Google Ads: ' + esc(S.data.config.gads_error) : '') + (S.data.config.purchase_error ? ' · รับซื้อ: ' + esc(S.data.config.purchase_error) : '') + '</div>';

    // รวมทุกหมวด
    var tot = { spend: 0, cv: 0, u: 0, fb: 0, gg: 0, fbc: 0, ggc: 0, ufb: 0, ugg: 0, tu: 0, tc: 0, wu: 0, wc: 0 };
    C.KPI_CATS.forEach(function (c) { var o = res[c.k], t = T[c.k];
      ['spend', 'cv', 'u', 'fb', 'gg', 'fbc', 'ggc', 'ufb', 'ugg', 'est'].forEach(function (k) { tot[k] = (tot[k] || 0) + (o[k] || 0); });
      if (t.tU != null && o.u) { tot.tu += t.tU * o.u; tot.wu += o.u; } if (t.tC != null && o.cv) { tot.tc += t.tC * o.cv; tot.wc += o.cv; } });
    tot.cpu = tot.u ? tot.spend / tot.u : null; tot.cpcv = tot.cv ? tot.spend / tot.cv : null; tot.cpe = tot.est ? tot.spend / tot.est : null; tot.win = tot.est ? tot.u / tot.est : null;
    var TT = { tU: tot.wu ? tot.tu / tot.wu : null, tC: tot.wc ? tot.tc / tot.wc : null };

    // 0) สรุปรวม 5 หมวด (แสดงอันดับแรก)
    function sumCard(lbl, v, t, f1, f2) {
      var p = pctOf(v, t), ok = p != null && p <= 0;
      return '<div class="card sumk"><div class="sk-l">' + lbl + '</div>' +
        '<div class="sk-mid"><div class="sk-v" data-n>' + nb(v) + (v == null ? '' : '<small>บาท</small>') + '</div>' + (p == null ? '' : '<span class="stp ' + (ok ? 'g' : 'b') + '">' + (ok ? 'ผ่านเป้า ' : 'เกินเป้า ') + sgn(p) + '</span>') + '</div>' +
        '<div class="sk-f"><span>เป้า <b>' + nb(t) + '</b> บาท</span>' + (p == null ? '' : '<span class="' + (ok ? 'gt' : 'bt') + '">' + (ok ? 'ถูกกว่าเป้า ' : 'แพงกว่าเป้า ') + F.baht(Math.abs(v - t)) + '</span>') + '</div></div>';
    }
    html += '<div class="sum2k">' + sumCard('Cost / เครื่องที่รับซื้อสำเร็จ · รวม 5 หมวด', tot.cpu, TT.tU, tot.u, 'เครื่อง (มาจาก FB / LINE)') +
      sumCard('Cost / Conversion · รวม 5 หมวด', tot.cpcv, TT.tC, F.int(Math.round(tot.cv)), 'Conversion (แชท FB + Conversion Google)') + '</div>';
    var hasEst = (S.data.estimates || []).length > 0;
    html += '<div class="est3">' + [['เคสประเมิน · รวม 5 หมวด', hasEst ? F.int(tot.est) : '–', 'เคส', 'ลูกค้าส่งข้อมูลเครื่องมาประเมิน (FB + LINE)'],
      ['Cost / เคสประเมิน', hasEst ? nb(tot.cpe) : '–', 'บาท', 'ค่า Ads ÷ เคสประเมิน'],
      ['Win rate', hasEst && tot.win != null ? (tot.win * 100).toFixed(1) : '–', '%', 'รับซื้อสำเร็จ ÷ เคสประเมิน']].map(function (x, i) {
        return '<div class="card e3 e3-' + i + '"><span class="l">' + x[0] + '</span><span class="v" data-n>' + x[1] + (x[1] === '–' ? '' : '<small>' + x[2] + '</small>') + '</span><span class="s">' + (hasEst ? x[3] : 'ยังไม่มีข้อมูล — อัปเดต Apps Script แล้วกด ดึงข้อมูลตอนนี้') + '</span></div>'; }).join('') + '</div>';

    // 1) การ์ดสินค้า
    html += '<div class="kc5">' + C.KPI_CATS.map(function (c) {
      var o = res[c.k], t = T[c.k], ok = o.cpu != null && (t.tU == null || o.cpu <= t.tU), pc = pctOf(o.cpcv, t.tC);
      var pu = pctOf(o.cpu, t.tU);
      return '<button class="card kc' + (kf.cat === c.k ? ' on' : '') + '" data-kc="' + c.k + '">' +
        '<div class="kc-h"><span class="kc-art">' + pimg(c.k) + '</span><span class="kc-n"><b>' + c.n + '</b><small>' + F.int(Math.round(o.cv)) + ' Conv.</small></span>' +
          (pu == null ? '<span class="stp n">' + (o.cpu == null ? 'ยังไม่มีข้อมูล' : 'ยังไม่มีเป้า') + '</span>' : '<span class="stp ' + (ok ? 'g' : 'b') + '">' + (ok ? 'ผ่าน ' : 'เกิน ') + sgn(pu) + '</span>') + '</div>' +
        '<div class="kc-v ' + (o.cpu == null ? '' : ok ? 'ok' : 'ng') + '" data-n>' + nb(o.cpu) + (o.cpu == null ? '' : '<small>บาท / เครื่อง</small>') + '</div>' +
        '<div class="kq">' +
          '<span class="q tg"><i>เป้า</i><b>' + nb(t.tU) + '</b><small>บาท</small></span>' +
          '<span class="q bu"><i>รับซื้อ</i><b data-n>' + F.int(o.u) + '</b><small>เครื่อง</small></span>' +
          '<span class="q es"><i>เคสประเมิน</i><b data-n>' + F.int(o.est || 0) + '</b><small>เคส</small></span>' +
          '<span class="q wn"><i>Win</i><b>' + (o.win == null ? '–' : Math.round(o.win * 100) + '%') + '</b></span>' +
        '</div>' +
        '<div class="kq-c"><span>Cost/Conv. <b>' + F.baht(o.cpcv) + '</b></span>' + (pc == null ? '' : '<span class="stp ' + (pc > 0 ? 'b' : 'g') + '">' + (pc > 0 ? 'เกินเป้า ' : 'ผ่าน ') + sgn(pc) + '</span>') + '</div></button>';
    }).join('') + '</div>';

    // 2) กราฟรายสัปดาห์ของหมวดที่เลือก
    var cat = C.KPI_CATS.filter(function (c) { return c.k === kf.cat; })[0], isU = kf.metric === 'unit', o0 = res[kf.cat], t0 = T[kf.cat];
    var wk = C.weeksBack(kf.to, 12);
    // แกนเวลา: ช่วงสั้น = รายวัน · ช่วงยาว (เกิน 62 วัน / 3-6 เดือน / 1 ปี) = รายเดือน
    var spanD = Math.round((new Date(kf.to) - new Date(kf.from)) / 864e5) + 1, monthly = spanD > 62, bk = [];
    if (monthly) { var mc = kf.from.slice(0, 7); while (mc <= kf.to.slice(0, 7) && bk.length < 36) { var me = new Date(Number(mc.slice(0, 4)), Number(mc.slice(5, 7)), 0); var mto = mc + '-' + String(me.getDate()).padStart(2, '0'); bk.push({ from: mc + '-01' < kf.from ? kf.from : mc + '-01', to: mto > kf.to ? kf.to : mto, m: mc }); var nx = new Date(Number(mc.slice(0, 4)), Number(mc.slice(5, 7)), 1); mc = nx.getFullYear() + '-' + String(nx.getMonth() + 1).padStart(2, '0'); } }
    else { var dd = kf.from; while (dd <= kf.to && bk.length < 62) { bk.push({ from: dd, to: dd }); var nd2 = new Date(dd + 'T00:00:00'); nd2.setDate(nd2.getDate() + 1); dd = nd2.getFullYear() + '-' + String(nd2.getMonth() + 1).padStart(2, '0') + '-' + String(nd2.getDate()).padStart(2, '0'); } }
    var TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    function bLabel(b) { return monthly ? TH_M[Number(b.m.slice(5, 7)) - 1] + ' ' + String(Number(b.m.slice(0, 4)) + 543).slice(2) : F.thDate(b.to); }
    var wv = bk.map(function (w) { var x = C.costByCat(S.data, w.from, w.to).cats[kf.cat], v = isU ? x.cpu : x.cpcv; return v > 0 ? v : null; });
    var first = wv.findIndex(function (v) { return v != null; }); if (first < 0) first = wv.length;
    var unitTxt = monthly ? 'รายเดือน' : 'รายวัน', avgN = monthly ? 3 : 7, avgTxt = monthly ? 'เฉลี่ย 3 เดือนล่าสุด' : 'เฉลี่ย 7 วันล่าสุด';
    var wks = bk.slice(first), vals = wv.slice(first).map(function (v) { return v; }), tv = isU ? t0.tU : t0.tC, cur = isU ? o0.cpu : o0.cpcv;
    var nn = vals.filter(function (v) { return v != null; }), lastN = nn.slice(-avgN);
    var avg4 = lastN.length ? lastN.reduce(function (a, v) { return a + v; }, 0) / lastN.length : null;
    var best = nn.length ? Math.min.apply(null, nn) : null, worst = nn.length ? Math.max.apply(null, nn) : null;
    var passN = tv == null ? 0 : nn.filter(function (v) { return v <= tv; }).length, curOk = cur != null && tv != null && cur <= tv;
    html += '<div class="card kt-card mt"><div class="kt-head"><div class="kt-id"><span class="kt-art">' + pimg(kf.cat) + '</span><div><h2>' + cat.n + '</h2><div class="card-sub">' + (isU ? 'Cost / เครื่องรับซื้อ' : 'Cost / Conversion') + ' ' + unitTxt + (wks.length ? ' · เริ่มมีข้อมูล ' + bLabel(wks[0]) : '') + '</div></div></div>' +
      '<div class="tabs" style="margin:0"><button data-km="unit" class="' + (isU ? 'on' : '') + '">Cost / เครื่อง</button><button data-km="conv" class="' + (!isU ? 'on' : '') + '">Cost / Conversion</button></div></div>' +
      '<div class="kt5">' +
        '<div class="kt1 ' + (cur == null || tv == null ? '' : curOk ? 'g' : 'b') + '"><span>ช่วงที่เลือก</span><b data-n>' + nb(cur) + '<small>บาท</small></b><em>' + (cur == null || tv == null ? '–' : (curOk ? '▼ ถูกกว่าเป้า ' : '▲ แพงกว่าเป้า ') + F.baht(Math.abs(cur - tv))) + '</em></div>' +
        '<div class="kt1 y"><span>เป้า</span><b data-n>' + nb(tv) + '<small>บาท</small></b><em>ไม่เกินเส้นนี้ = ผ่าน</em></div>' +
        '<div class="kt1"><span>' + avgTxt + '</span><b data-n>' + nb(avg4) + '<small>บาท</small></b><em>' + (avg4 == null || tv == null ? '–' : avg4 <= tv ? 'อยู่ในเป้า' : 'สูงกว่าเป้า ' + Math.round(pctOf(avg4, tv)) + '%') + '</em></div>' +
        '<div class="kt1"><span>ดีที่สุด / แย่ที่สุด</span><b data-n><i class="gt">' + nb(best) + '</i> / <i class="bt">' + nb(worst) + '</i></b><em>' + (vals.length ? bLabel(wks[vals.indexOf(best)]) + ' / ' + bLabel(wks[vals.indexOf(worst)]) : '–') + '</em></div>' +
        '<div class="kt1"><span>' + (monthly ? 'เดือนที่ผ่านเป้า' : 'วันที่ผ่านเป้า') + '</span><b data-n>' + passN + '<small>จาก ' + nn.length + (monthly ? ' เดือน' : ' วัน') + '</small></b><div class="wdots">' + vals.map(function (v) { return '<i class="' + (tv == null ? '' : v <= tv ? 'g' : 'b') + '"></i>'; }).join('') + '</div></div>' +
      '</div>' +
      '<div class="kt-lg"><span><i class="g"></i>ผ่านเป้า</span><span><i class="b"></i>เกินเป้า</span><span><i class="dash"></i>เป้า ' + F.baht(tv) + '</span><span><i class="avg"></i>' + avgTxt + '</span></div>' +
      '<div class="wbars-box"><svg class="wbars" id="chK"></svg><div class="wtip" id="chKtip"></div></div></div>';

    // 3) เทียบเป้าทุกหมวด (แท่งออกจากเส้นกลาง)
    var dU = kf.dm === 'unit', list = C.KPI_CATS.map(function (c) { return { c: c, o: res[c.k], t: T[c.k] }; }).concat([{ c: { k: '_t', n: 'รวม 5 หมวด' }, o: tot, t: TT }]);
    function dv(x) { return dU ? x.o.cpu : x.o.cpcv; } function dt(x) { return dU ? x.t.tU : x.t.tC; }
    var mx = 0; list.forEach(function (x) { var p = pctOf(dv(x), dt(x)); if (p != null) mx = Math.max(mx, Math.abs(p) / 100); });
    var sc = [20, 40, 60, 80, 100, 150, 200].filter(function (v) { return v / 100 >= mx; })[0] || 300;
    function pos(p) { return 50 + p / sc * 50; }
    html += '<div class="card mt dvc"><div class="card-head"><div><h2 class="card-title">เทียบเป้าทุกหมวด</h2><div class="card-sub">เส้นกลาง = เป้า · แท่งเขียวไปซ้าย = ถูกกว่าเป้า · แท่งแดงไปขวา = แพงกว่าเป้า</div></div>' +
      '<div class="tabs" style="margin:0"><button data-dm="unit" class="' + (dU ? 'on' : '') + '">Cost / เครื่อง</button><button data-dm="conv" class="' + (!dU ? 'on' : '') + '">Cost / Conversion</button></div></div>' +
      '<div class="dvh"><span></span><div class="dax">' + [-sc, -sc / 2, 0, sc / 2, sc].map(function (p) { return '<span class="' + (p ? '' : 'c') + '" style="left:' + pos(p) + '%' + (p === -sc ? ';transform:none' : p === sc ? ';transform:translateX(-100%)' : '') + '">' + (p ? (p > 0 ? '+' : '') + p + '%' : 'เป้า') + '</span>'; }).join('') + '</div><span></span></div>' +
      list.map(function (x, i) {
        var v = dv(x), t = dt(x), p = pctOf(v, t), isT = x.c.k === '_t';
        var who = '<div class="dvw">' + (isT ? '<span class="kt-art tot">รวม</span>' : '<span class="kt-art">' + pimg(x.c.k) + '</span>') + '<div><b>' + x.c.n + '</b><div class="dvp"><span class="pl g">รับ <b>' + x.o.u + '</b> เครื่อง</span><span class="pl n"><b>' + F.int(Math.round(x.o.cv)) + '</b> Conv.</span></div></div></div>';
        var bar = '';
        if (p != null) {
          var w = Math.min(Math.max(Math.abs(p) / sc * 50, .6), 50), clip = Math.abs(p) > sc, side = p > 0 ? 'r' : 'l', inside = w >= 24;
          var lp = inside ? (side === 'r' ? 'right:' + (50 - w) + '%;padding-right:12px' : 'left:' + (50 - w) + '%;padding-left:12px') : (side === 'r' ? 'left:calc(' + (50 + w) + '% + 8px)' : 'right:calc(' + (50 + w) + '% + 8px)');
          bar = '<i class="dbar ' + side + (clip ? ' clip' : '') + '" style="width:' + w + '%;animation-delay:' + (i * 60) + 'ms"></i><span class="dlab ' + (inside ? 'in' : 'out') + ' ' + side + '" style="' + lp + '">' + nb(v) + ' บาท <small>' + sgn(p) + '</small></span>';
        }
        return '<div class="dvr' + (isT ? ' tot' : '') + (kf.cat === x.c.k ? ' on' : '') + '"' + (isT ? '' : ' data-kc="' + x.c.k + '"') + '>' + who +
          '<div class="dtrk"><i class="gl" style="left:' + pos(-sc / 2) + '%"></i><i class="gl" style="left:' + pos(sc / 2) + '%"></i>' + bar + '</div>' +
          '<div class="dvt"><span class="mv ' + (p > 0 ? 'b' : 'g') + '">' + nb(v) + (v == null ? '' : ' บาท') + (p == null ? '' : ' <small>' + sgn(p) + '</small>') + '</span><span class="pl y">เป้า <b>' + nb(t) + '</b> บาท</span>' + (p == null ? '' : '<span class="dd ' + (p > 0 ? 'b' : 'g') + '">' + (p > 0 ? 'แพงกว่าเป้า ' + F.baht(v - t) : 'ถูกกว่าเป้า ' + F.baht(t - v)) + '</span>') + '</div></div>';
      }).join('') + '</div>';

    // 4) ค่า Ads ไปอยู่หมวดไหน
    var rr = 80, CIR = 2 * Math.PI * rr, off = 0, dn = '<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="' + rr + '" fill="none" stroke="var(--bg-soft)" stroke-width="24"/>';
    C.KPI_CATS.forEach(function (c) { var L = tot.spend ? res[c.k].spend / tot.spend * CIR : 0; if (L > 0) dn += '<circle cx="100" cy="100" r="' + rr + '" fill="none" stroke="' + CAT_SHADE[c.k] + '" stroke-width="24" stroke-dasharray="' + Math.max(L - 2, 0) + ' ' + CIR + '" stroke-dashoffset="' + (-off) + '"/>'; off += L; });
    dn += '</svg>';
    html += '<div class="card mt spc"><div class="spd"><h2 class="card-title">ค่า Ads ไปอยู่หมวดไหน</h2><div class="card-sub">รวม Facebook + Google</div><div class="donut">' + dn + '<div class="dctr"><span>ค่า Ads รวม</span><b data-n>' + F.baht(tot.spend) + '</b><small class="fbv">FB ' + (tot.spend ? (tot.fb / tot.spend * 100).toFixed(1) : 0) + '%</small><small class="ggv">Google ' + (tot.spend ? (tot.gg / tot.spend * 100).toFixed(1) : 0) + '%</small></div></div></div>' +
      '<div class="spl"><div class="sph"><span>หมวด</span><span>ค่า Ads</span><span>ค่า Ads ต่อกำไร</span></div>' + C.KPI_CATS.slice().sort(function (a, b) { return res[b.k].spend - res[a.k].spend; }).map(function (c) {
        var o = res[c.k], pr = o.cpu != null && o.avgM ? Math.round(o.cpu / o.avgM * 100) : null, cl = pr == null ? 'n' : pr <= 15 ? 'g' : pr <= 25 ? 'y' : 'b';
        return '<div class="spr"><span class="kt-art sm">' + pimg(c.k) + '</span><div class="spn"><b><i style="background:' + CAT_SHADE[c.k] + '"></i>' + c.n + '</b><small><span class="fbv">FB ' + F.baht(o.fb) + '</span> · <span class="ggv">Google ' + F.baht(o.gg) + '</span></small></div>' +
          '<div class="spa"><b data-n>' + F.baht(o.spend) + '</b><small>' + (tot.spend ? Math.round(o.spend / tot.spend * 100) : 0) + '% ของทั้งหมด</small></div><div class="spe"><span class="pl ' + cl + '">' + (pr == null ? '–' : pr + '%') + '</span><small>กำไร ' + F.baht(o.avgM) + '/เครื่อง</small></div></div>';
      }).join('') + '</div></div>';

    // 5) มุมมองเสริม
    var mxr = Math.max.apply(null, C.KPI_CATS.map(function (c) { return res[c.k].close || 0; })) || 1;
    var mxm = Math.max.apply(null, C.KPI_CATS.map(function (c) { return res[c.k].avgM || 0; })) || 1;
    var chs = C.KPI_CATS.map(function (c) { var o = res[c.k]; return { c: c, o: o, f: o.ufb ? o.fb / o.ufb : null, g: o.ugg ? o.gg / o.ugg : null }; });
    var mxf = Math.max.apply(null, chs.map(function (x) { return Math.max(x.f || 0, x.g || 0); })) || 1;
    function xr(c, mid, val) { return '<div class="xr"><span class="kt-art sm">' + pimg(c.k) + '</span><span class="xn">' + c.n + '</span>' + mid + '<span class="xv" data-n>' + val + '</span></div>'; }
    html += '<div class="xg mt">' +
      '<div class="card"><h2 class="card-title">อัตราปิดรับซื้อ</h2><div class="card-sub">ลูกค้าที่ทักมา (Conversion) กี่ % ที่ขายเครื่องให้เราจริง</div>' + C.KPI_CATS.map(function (c) { var o = res[c.k];
        return xr(c, '<div class="kb"><i class="o" style="width:' + ((o.close || 0) / mxr * 100) + '%"></i></div>', (o.close == null ? '–' : Math.round(o.close * 100) + '%') + '<small>' + o.u + ' จาก ' + F.int(Math.round(o.cv)) + '</small>'); }).join('') +
        '<div class="xnote">อัตราปิดต่ำแต่ทักมาเยอะ = แอดดึงคนได้ แต่ปิดรับซื้อไม่ได้ (ราคา / การตอบแชท)</div></div>' +
      '<div class="card"><h2 class="card-title">กำไรต่อเครื่อง หลังหักค่า Ads</h2><div class="card-sub">แท่งเต็ม = กำไรเฉลี่ย · ส่วนแดง = ค่า Ads ต่อเครื่อง · ส่วนเขียว = กำไรที่เหลือ</div>' + C.KPI_CATS.map(function (c) { var o = res[c.k];
        if (o.avgM == null) return xr(c, '<div class="kb"></div>', '–');
        var a = Math.min(o.cpu || 0, Math.max(o.avgM, 0)), g = Math.max(o.avgM - a, 0);
        return xr(c, '<div class="kb"><i class="b" style="width:' + (a / mxm * 100) + '%"></i><i class="g" style="width:' + (g / mxm * 100) + '%"></i></div>', F.baht(o.avgM - (o.cpu || 0)) + '<small>จาก ' + F.baht(o.avgM) + '</small>'); }).join('') + '</div>' +
      '<div class="card"><h2 class="card-title">Facebook vs Google ช่องทางไหนคุ้มกว่า</h2><div class="card-sub">Cost / เครื่องรับซื้อ แยกตามช่องทาง (สั้นกว่า = คุ้มกว่า)</div>' + chs.map(function (x) {
        return '<div class="xr two"><span class="kt-art sm">' + pimg(x.c.k) + '</span><span class="xn">' + x.c.n + '</span><div class="ch2">' +
          '<div class="kb sm"><i class="f" style="width:' + ((x.f || 0) / mxf * 100) + '%"></i></div><div class="lb"><span>Facebook · ' + x.o.ufb + ' เครื่อง</span><b>' + F.baht(x.f) + '</b></div>' +
          '<div class="kb sm"><i class="gg" style="width:' + ((x.g || 0) / mxf * 100) + '%"></i></div><div class="lb"><span>Google · ' + x.o.ugg + ' เครื่อง</span><b>' + F.baht(x.g) + '</b></div></div></div>'; }).join('') +
        '<div class="xnote">ช่องทางที่จำนวนเครื่องน้อย ตัวเลขยังแกว่งง่าย ใช้ดูแนวโน้มก่อน</div></div>' +
      '<div class="card"><h2 class="card-title">ปฏิทินผ่านเป้ารายสัปดาห์</h2><div class="card-sub">Cost / เครื่อง แต่ละสัปดาห์ · เขียว = ผ่าน · แดง = เกิน (ยิ่งเข้มยิ่งห่างเป้า)</div><div class="hm" id="kHeat"></div>' +
        '<div class="xnote">หมวดที่แดงติดกันหลายสัปดาห์ = ควรปรับแคมเปญ</div></div>' +
      '</div>';

    // 6) ตารางตัวเลข
    var rows = C.KPI_CATS.map(function (c) { var o = res[c.k], t = T[c.k];
      return '<tr><td><b>' + c.n + '</b></td><td class="r fbv">' + nb(o.fb) + '</td><td class="r ggv">' + nb(o.gg) + '</td><td class="r"><b>' + nb(o.spend) + '</b></td>' +
        '<td class="r">' + F.int(Math.round(o.cv)) + '</td><td class="r"><b>' + nb(o.cpcv) + '</b></td><td class="r">' + nb(t.tC) + '</td><td class="r ' + (pctOf(o.cpcv, t.tC) > 0 ? 'bt' : 'gt') + '">' + (pctOf(o.cpcv, t.tC) == null ? '–' : sgn(pctOf(o.cpcv, t.tC))) + '</td>' +
        '<td class="r">' + F.int(o.est || 0) + '</td><td class="r"><b>' + nb(o.cpe) + '</b></td><td class="r">' + (o.win == null ? '–' : Math.round(o.win * 100) + '%') + '</td>' +
        '<td class="r">' + o.u + '</td><td class="r"><b>' + nb(o.cpu) + '</b></td><td class="r">' + nb(t.tU) + '</td><td class="r ' + (pctOf(o.cpu, t.tU) > 0 ? 'bt' : 'gt') + '">' + (pctOf(o.cpu, t.tU) == null ? '–' : sgn(pctOf(o.cpu, t.tU))) + '</td>' +
        '<td class="r">' + nb(o.avgM) + '</td><td class="r">' + (o.cpu != null && o.avgM ? Math.round(o.cpu / o.avgM * 100) + '%' : '–') + '</td></tr>'; }).join('');
    html += '<div class="card mt"><h2 class="card-title">ตัวเลขทั้งหมด</h2><div class="card-sub">หน่วยเป็นบาท · ± คือห่างจากเป้ากี่ % · Win rate = เครื่อง ÷ เคสประเมิน · FB = แชทจากโฆษณา + เครื่องที่ช่อง FB มีชื่อ · Google = Conversion Google Ads + เครื่องที่ช่อง LINE มีชื่อ</div>' +
      '<div class="table-wrap" style="margin-top:12px"><table class="t kt"><thead><tr><th>หมวด</th><th class="r">ค่า Ads FB</th><th class="r">ค่า Ads Google</th><th class="r">รวม</th><th class="r">Conv.</th><th class="r">Cost/Conv.</th><th class="r">เป้า</th><th class="r">±</th><th class="r">เคสประเมิน</th><th class="r">Cost/เคส</th><th class="r">Win rate</th><th class="r">เครื่อง</th><th class="r">Cost/เครื่อง</th><th class="r">เป้า</th><th class="r">±</th><th class="r">กำไร/เครื่อง</th><th class="r">Ads % กำไร</th></tr></thead><tbody>' + rows +
      '<tr class="tot"><td>รวม</td><td class="r">' + nb(tot.fb) + '</td><td class="r">' + nb(tot.gg) + '</td><td class="r">' + nb(tot.spend) + '</td><td class="r">' + F.int(Math.round(tot.cv)) + '</td><td class="r">' + nb(tot.cpcv) + '</td><td class="r">' + nb(TT.tC) + '</td><td class="r ' + (pctOf(tot.cpcv, TT.tC) > 0 ? 'bt' : 'gt') + '">' + (pctOf(tot.cpcv, TT.tC) == null ? '–' : sgn(pctOf(tot.cpcv, TT.tC))) + '</td><td class="r">' + F.int(tot.est || 0) + '</td><td class="r">' + nb(tot.cpe) + '</td><td class="r">' + (tot.win == null ? '–' : Math.round(tot.win * 100) + '%') + '</td><td class="r">' + tot.u + '</td><td class="r">' + nb(tot.cpu) + '</td><td class="r">' + nb(TT.tU) + '</td><td class="r ' + (pctOf(tot.cpu, TT.tU) > 0 ? 'bt' : 'gt') + '">' + (pctOf(tot.cpu, TT.tU) == null ? '–' : sgn(pctOf(tot.cpu, TT.tU))) + '</td><td></td><td></td></tr></tbody></table></div></div>';

    // 7) ตั้งเป้า
    var tq = T[kf.cat];
    html += '<div class="card mt"><h2 class="card-title">ตั้งเป้า</h2><div class="card-sub">เป้า = ค่าที่ต่ำกว่าระหว่าง (1) ค่าฐาน = ค่ากลาง 8 สัปดาห์ก่อนช่วงนี้ ลดลงตาม % และ (2) เพดานจากกำไร · เลื่อนแล้วบันทึกให้ทุกคนเห็นเหมือนกัน</div>' +
      '<div class="tg3"><div class="box"><label>ลดจากค่าฐาน</label><div class="val" id="kv1">−' + tg.cut + '%</div><input type="range" id="kr1" min="0" max="30" value="' + tg.cut + '"></div>' +
      '<div class="box"><label>ค่า Ads ไม่เกินกี่ % ของกำไรต่อเครื่อง</label><div class="val" id="kv2">' + tg.cap + '%</div><input type="range" id="kr2" min="5" max="40" value="' + tg.cap + '"></div>' +
      '<div class="box formula"><b>ตัวอย่าง ' + cat.n + '</b><br>ค่าฐาน Cost/เครื่อง = ' + F.baht(tq.baseU) + (tq.baseU != null ? ' → ลด ' + tg.cut + '% = ' + F.baht(tq.baseU * (1 - tg.cut / 100)) : '') +
        '<br>เพดานจากกำไร = ' + F.baht(tq.avgM) + ' × ' + tg.cap + '% = ' + F.baht(tq.capU) + '<br>→ เป้า = <b>' + F.baht(tq.tU) + '</b>' + (tq.weeks < 4 ? '<br><span class="warn-t">ข้อมูลย้อนหลังมี ' + tq.weeks + ' สัปดาห์ เป้ายังไม่นิ่ง</span>' : '') + '</div></div></div>';

    $('#page').innerHTML = html;

    // ปฏิทินสี (คำนวณรายสัปดาห์ของทุกหมวด)
    var wAll = wk.map(function (w) { return C.costByCat(S.data, w.from, w.to).cats; });
    var fIdx = wAll.findIndex(function (x) { return C.KPI_CATS.some(function (c) { return x[c.k].cpu != null; }); });
    if (fIdx < 0) $('#kHeat').innerHTML = '<div class="empty">ยังไม่มีข้อมูลรายสัปดาห์</div>';
    else {
      var idx = wk.map(function (_, i) { return i; }).slice(fIdx);
      $('#kHeat').innerHTML = '<table><tr><th></th>' + idx.map(function (i) { return '<th>' + F.thDate(wk[i].to) + '</th>'; }).join('') + '</tr>' + C.KPI_CATS.map(function (c) {
        var t = T[c.k].tU;
        return '<tr><td class="cn">' + c.n + '</td>' + idx.map(function (i) { var v = wAll[i][c.k].cpu; if (v == null) return '<td class="n">–</td>';
          if (t == null) return '<td class="n">' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v)) + '</td>';
          var d = (v - t) / t, a = Math.round((.35 + .65 * Math.min(1, Math.abs(d) / .6)) * 100);
          return '<td title="' + F.baht(v) + ' (เป้า ' + F.baht(t) + ')" style="background:color-mix(in srgb,' + (d > 0 ? 'var(--bad)' : 'var(--good)') + ' ' + a + '%,var(--bg-soft))">' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
    }

    S.drawCharts = function () { drawWeekBars($('#chK'), $('#chKtip'), vals, wks.map(bLabel), wks.map(function (w) { return monthly ? bLabel(w) : F.thDate(w.to, true); }), tv, avg4, isU); };
    S.drawCharts(); Charts.countUp($('#page'));
    $$('[data-kp]').forEach(function (b) { b.onclick = function () { kf.preset = b.dataset.kp; pageKpi(); }; });
    if ($('#kFrom')) { $('#kFrom').onchange = function () { kf.from = this.value; pageKpi(); }; $('#kTo').onchange = function () { kf.to = this.value; pageKpi(); }; }
    $$('[data-kc]').forEach(function (b) { b.onclick = function () { kf.cat = b.dataset.kc; pageKpi(); if (b.classList.contains('dvr')) { var k = $('.kt-card'); if (k) k.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }; });
    $$('[data-km]').forEach(function (b) { b.onclick = function () { kf.metric = b.dataset.km; pageKpi(); }; });
    $$('[data-dm]').forEach(function (b) { b.onclick = function () { kf.dm = b.dataset.dm; pageKpi(); }; });
    var tmr;
    function saveT(key, v) { S.data.config[key] = v; clearTimeout(tmr); tmr = setTimeout(function () { API.call('saveConfig', { key: key, value: v }).catch(fail); }, 600); pageKpi(); }
    $('#kr1').onchange = function () { saveT('target_cut', Number(this.value)); };
    $('#kr1').oninput = function () { $('#kv1').textContent = '−' + this.value + '%'; };
    $('#kr2').onchange = function () { saveT('target_cap', Number(this.value)); };
    $('#kr2').oninput = function () { $('#kv2').textContent = this.value + '%'; };
  }

  /** กราฟแท่งรายสัปดาห์: เขียว = ผ่านเป้า แดง = เกินเป้า, เส้นประเหลือง = เป้า */
  function drawWeekBars(svg, tip, vals, labels, tips, t, avg, isU) {
    if (!svg) return;
    var W = svg.clientWidth || 800, nar = W < 560, H = nar ? 290 : 330, L = nar ? 4 : 12, R = nar ? 66 : 100, T = 30, B = nar ? 44 : 50;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.height = H + 'px';
    if (!vals.length) { svg.innerHTML = '<text x="' + W / 2 + '" y="' + H / 2 + '" text-anchor="middle" class="wb-empty">ยังไม่มีข้อมูลรายสัปดาห์</text>'; return; }
    var pw = W - L - R, ph = H - T - B, n = vals.length, gw = pw / n, bw = Math.min(nar ? 34 : 72, gw * .62), base = T + ph;
    var top = Math.max.apply(null, vals.filter(function (v) { return v != null; }).concat([t || 0])) * 1.22 || 1;
    function y(v) { return base - v / top * ph; }
    function bd(x, yy) { var r = Math.min(10, (base - yy) / 2, bw / 2); return 'M' + x + ' ' + base + 'V' + (yy + r) + 'Q' + x + ' ' + yy + ' ' + (x + r) + ' ' + yy + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + yy + ' ' + (x + bw) + ' ' + (yy + r) + 'V' + base + 'Z'; }
    function k(v) { return nar && v >= 1000 ? (v / 1000).toFixed(1) + 'k' : F.int(Math.round(v)); }
    var o = '', bars = [];
    if (t != null) o += '<rect x="' + L + '" y="' + y(t) + '" width="' + pw + '" height="' + (base - y(t)) + '" rx="8" class="wb-zone"/>';
    o += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + base + '" y2="' + base + '" class="wb-base"/>';
    vals.forEach(function (v, i) {
      if (v == null) { var cx0 = L + i * gw + gw / 2; if (!nar || n <= 6 || (n - 1 - i) % 2 === 0) o += '<text class="wb-x" x="' + cx0 + '" y="' + (base + 20) + '" text-anchor="middle">' + labels[i] + '</text>'; o += '<rect x="' + (cx0 - Math.min(nar ? 34 : 72, gw * .62) / 2) + '" y="' + (base - 6) + '" width="' + Math.min(nar ? 34 : 72, gw * .62) + '" height="6" rx="3" fill="var(--line)"/>'; bars.push(null); return; }
      var cx = L + i * gw + gw / 2, x = cx - bw / 2, ok = t == null || v <= t, dp = t ? Math.round((v - t) / t * 100) : null;
      bars.push({ x: x, yy: y(v) });
      o += '<path class="wb-bar ' + (t == null ? 'n' : ok ? 'g' : 'b') + '" d="' + bd(x, base) + '"/>';
      var show = !nar || n <= 6 || (n - 1 - i) % 2 === 0;
      o += '<text class="wb-val" x="' + cx + '" y="' + (base - 8) + '" text-anchor="middle" style="opacity:0' + (nar ? ';font-size:11px' : '') + (show ? '' : ';display:none') + '">' + k(v) + '</text>';
      if (show) o += '<text class="wb-x" x="' + cx + '" y="' + (base + 20) + '" text-anchor="middle">' + labels[i] + '</text>';
      if (dp != null && show) o += '<text class="wb-d ' + (ok ? 'g' : 'b') + '" x="' + cx + '" y="' + (base + 37) + '" text-anchor="middle">' + (dp > 0 ? '+' : '') + dp + '%</text>';
      o += '<rect class="wb-hv" data-i="' + i + '" x="' + (L + i * gw) + '" y="' + T + '" width="' + gw + '" height="' + ph + '"/>';
    });
    if (t != null) {
      var gx = W - R + 8, lw = R - 12;
      o += '<line x1="' + L + '" x2="' + (W - R + 6) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="wb-t"/>' +
        '<rect x="' + gx + '" y="' + (y(t) - 13) + '" width="' + lw + '" height="26" rx="13" class="wb-tp"/><text x="' + (gx + lw / 2) + '" y="' + (y(t) + 4.5) + '" text-anchor="middle" class="wb-tt">เป้า ' + k(t) + '</text>' +
        '<text x="' + (gx + lw / 2) + '" y="' + (y(t) + 30) + '" text-anchor="middle" class="wb-z">โซนผ่าน ↓</text>';
    }
    if (avg != null) o += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(avg) + '" y2="' + y(avg) + '" class="wb-avg"/>' + (t == null || Math.abs(y(avg) - y(t)) > 22 ? '<text x="' + (W - R + 8 + (R - 12) / 2) + '" y="' + (y(avg) + 4) + '" text-anchor="middle" class="wb-al">เฉลี่ย ' + k(avg) + '</text>' : '');
    svg.innerHTML = o;
    var P = svg.querySelectorAll('.wb-bar'), Lb = svg.querySelectorAll('.wb-val'), t0 = performance.now();
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (function grow(now) {
      var done = true;
      var bj = 0; bars.forEach(function (br) { if (!br) return; var j = bj++; var p = still ? 1 : Math.max(0, Math.min(1, (now - t0 - j * 70) / 800)); if (p < 1) done = false; var e = 1 - Math.pow(1 - p, 3), yy = base - (base - br.yy) * e;
        P[j].setAttribute('d', bd(br.x, yy)); Lb[j].setAttribute('y', yy - 9); Lb[j].style.opacity = Math.min(1, p * 1.6); });
      if (!done) requestAnimationFrame(grow);
    })(t0);
    $$('.wb-hv', svg).forEach(function (r) {
      r.onmouseenter = function () { var i = +r.dataset.i, v = vals[i], bx = svg.getBoundingClientRect();
        tip.innerHTML = '<b>' + tips[i] + '</b>' + (v == null ? '<div>ไม่มีเครื่องรับซื้อ / ไม่มีค่า Ads</div>' : '<div><span>' + (isU ? 'Cost / เครื่อง' : 'Cost / Conv.') + '</span><span>' + F.baht(v) + '</span></div>' + (t ? '<div><span>เทียบเป้า</span><span>' + (v <= t ? 'ต่ำกว่า ' : 'เกิน ') + Math.abs(Math.round((v - t) / t * 100)) + '%</span></div>' : '')) ;
        tip.style.left = ((L + i * gw + gw / 2) / W * bx.width) + 'px'; tip.style.top = (y(v == null ? 0 : v) / H * bx.height + 40) + 'px'; tip.style.opacity = 1; };
      r.onmouseleave = function () { tip.style.opacity = 0; };
    });
  }

  // ============================================================
  // วิเคราะห์ช่วงเวลา (ตัวเลข + กราฟ เท่านั้น)
  // ============================================================
  var DOW = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'], DOW_ORDER = [1, 2, 3, 4, 5, 6, 0], DOW_S = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  function dowOf(d) { return new Date(d + 'T00:00:00').getDay(); }
  /** สีตามอัตราส่วนเทียบค่าเฉลี่ย: ต่ำ = เขียว · สูง = แดง (ค่าใช้จ่าย) */
  var HB = [[0.7, '#1e9a58', '#fff'], [0.9, '#86c98a', '#13361f'], [1.15, '#f3d65a', '#3d2f00'], [1.6, '#f19a45', '#3d1d00'], [Infinity, '#d64545', '#fff']];
  function heatCol(ratio) { for (var i = 0; i < HB.length; i++) if (ratio <= HB[i][0]) return HB[i]; return HB[HB.length - 1]; }
  function hhmm(h) { return ('0' + h).slice(-2) + ':00'; }
  function hhLab(h) { return ('0' + h).slice(-2) + ':00'; }
  function hhRange(h) { return ('0' + h).slice(-2) + ':00–' + ('0' + h).slice(-2) + ':59'; }
  function pageTime() {
    var tf = S.tf || (S.tf = { preset: '30d', from: '', to: '', camp: '', gcamp: '', est: 'all', src: 'fb' });
    if (!tf.src) tf.src = 'fb';
    if (tf.preset !== 'custom') { var r = C.presetRange(tf.preset, S.data, today()); tf.from = r.from; tf.to = r.to; }
    var isG = tf.src === 'gg';
    var presets = [['7d', '7 วัน'], ['30d', '30 วัน'], ['3m', '3 เดือน'], ['custom', 'กำหนดเอง']];
    var inR = function (d) { return d >= tf.from && d <= tf.to; };
    var hr = (S.data.fbhourly || []).filter(function (x) { return inR(x.date); });
    var gd = (S.data.gads || []).filter(function (x) { return inR(x.date); });
    var camps = {}; (isG ? gd : hr).forEach(function (x) { camps[x.campaign] = (camps[x.campaign] || 0) + (isG ? x.cost : x.spend); });
    var ck = isG ? 'gcamp' : 'camp';
    if (tf[ck] && !camps[tf[ck]]) tf[ck] = '';
    // เคสประเมินของช่องทางนั้น (FB = ช่อง FB · Google = ช่อง LINE)
    var esAll = (S.data.estimates || []).filter(function (e) { return inR(e.date); });
    var esSrc = esAll.filter(function (e) { return isG ? e.line : e.fb; });
    var html = '<div class="filters"><div class="chip-group tsrc"><button data-ts="fb" class="' + (!isG ? 'on' : '') + '">Facebook Ads</button><button data-ts="gg" class="' + (isG ? 'on' : '') + '">Google Ads</button></div>' +
      '<div class="chip-group">' + presets.map(function (p) { return '<button data-tp="' + p[0] + '" class="' + (tf.preset === p[0] ? 'on' : '') + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      (tf.preset === 'custom' ? '<input type="date" class="field-inline" id="tFrom" value="' + tf.from + '"><input type="date" class="field-inline" id="tTo" value="' + tf.to + '">' : '<span class="muted">' + F.thRange(tf.from, tf.to) + '</span>') +
      '<select class="field-inline" id="tCamp"><option value="">ทุกแคมเปญ ' + (isG ? 'Google' : 'Facebook') + '</option>' + Object.keys(camps).sort(function (a, b) { return camps[b] - camps[a]; }).map(function (c) { return opt(c, c, tf[ck]); }).join('') + '</select></div>';
    var draw = [];
    html += isG ? timeGoogle(tf, gd, esSrc, draw) : timeFacebook(tf, hr, esSrc, draw);

    // ---- เคสประเมินตามเวลาโพสต์ ----
    var es = esAll.filter(function (e) { return e.hour >= 0 && (tf.est === 'all' || (tf.est === 'fb' ? e.fb : e.line)); });
    var ec = {}, emax = 0; es.forEach(function (e) { var k = dowOf(e.date) + '|' + e.hour; ec[k] = (ec[k] || 0) + 1; if (ec[k] > emax) emax = ec[k]; });
    var ehm = hmHead();
    DOW_ORDER.forEach(function (d) { ehm += '<tr><td class="dn">' + DOW[d] + '</td>'; for (var h = 0; h < 24; h++) { var n = ec[d + '|' + h] || 0, a = emax ? n / emax : 0;
      ehm += n ? '<td title="' + DOW[d] + ' ' + hhRange(h) + ' · ' + n + ' เคส" style="background:rgba(232,159,0,' + (0.15 + a * 0.85).toFixed(2) + ');color:' + (a > 0.55 ? '#fff' : '#3d2f00') + '">' + n + '</td>' : '<td class="e"></td>'; } ehm += '</tr>'; });
    ehm += '</table>';
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">เคสประเมินเข้ามา · วัน × ชั่วโมง</h2><div class="card-sub">นับจากเวลาโพสต์ในชีตเคสประเมิน · ทุกหมวด · ' + F.int(es.length) + ' เคส · สีเข้ม = เคสเยอะ</div></div>' +
      '<div class="tabs" style="margin:0"><button data-te="all" class="' + (tf.est === 'all' ? 'on' : '') + '">ทั้งหมด</button><button data-te="fb" class="' + (tf.est === 'fb' ? 'on' : '') + '">Facebook</button><button data-te="line" class="' + (tf.est === 'line' ? 'on' : '') + '">LINE</button></div></div>' +
      (S.data.estimates && S.data.estimates.length ? '<div class="hmw">' + ehm + '</div>' : '<div class="nudge">ยังไม่มีข้อมูลเคสประเมิน — วาง Code.gs ใหม่ แล้วกด ดึงข้อมูลตอนนี้ ในหน้าตั้งค่า</div>') + '</div>';

    // ---- วันในสัปดาห์ × หมวด (FB + Google) ----
    var dc = {}; C.KPI_CATS.forEach(function (c) { dc[c.k] = DOW_ORDER.map(function () { return { sp: 0, cv: 0 }; }); });
    for (var dte = tf.from, g = 0; dte <= tf.to && g < 400; dte = C.addDays(dte, 1), g++) {
      var di = DOW_ORDER.indexOf(dowOf(dte)), cb = C.costByCat(S.data, dte, dte).cats;
      C.KPI_CATS.forEach(function (c) { dc[c.k][di].sp += cb[c.k].spend; dc[c.k][di].cv += cb[c.k].cv; });
    }
    function dowRow(name, arr) { var s = 0, c = 0; arr.forEach(function (x) { s += x.sp; c += x.cv; }); var av = c ? s / c : null;
      return '<tr><td><b>' + esc(name) + '</b>' + (av ? '<div class="muted small">เฉลี่ย ' + F.baht(av) + '</div>' : '') + '</td>' + arr.map(function (x) { if (!x.cv || !av) return '<td class="r muted">–</td>'; var v = x.sp / x.cv, p = (v / av - 1) * 100, col = heatCol(v / av);
        return '<td><div class="dw" style="background:' + col[1] + ';color:' + col[2] + '"><b>' + F.int(Math.round(v)) + '</b><small>' + (p > 0 ? '+' : '') + Math.round(p) + '%</small></div></td>'; }).join('') + '</tr>'; }
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">Cost / Conversion · วันในสัปดาห์ × หมวดสินค้า</h2><div class="card-sub">Facebook + Google · ตัวเลขใหญ่ = บาทต่อ Conversion · % = เทียบค่าเฉลี่ยของหมวดนั้น</div></div></div>' +
      '<div class="table-wrap"><table class="t dwt"><thead><tr><th>หมวด</th>' + DOW_ORDER.map(function (d) { return '<th>' + DOW_S[d] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      C.KPI_CATS.map(function (c) { return dowRow(c.n, dc[c.k]); }).join('') + '</tbody></table></div></div>';

    // ---- วันในสัปดาห์ × แคมเปญ ----
    var cm = {};
    function addC(name, src, d, sp, cv) { var k = src + '|' + name, o = cm[k] || (cm[k] = { name: name, src: src, tot: 0, a: DOW_ORDER.map(function () { return { sp: 0, cv: 0 }; }) }); var i = DOW_ORDER.indexOf(dowOf(d)); o.a[i].sp += sp; o.a[i].cv += cv; o.tot += sp; }
    hr.forEach(function (x) { addC(x.campaign, 'Facebook', x.date, x.spend, x.chats); });
    gd.forEach(function (x) { addC(x.campaign, 'Google', x.date, x.cost, x.conversions); });
    var cl = Object.keys(cm).map(function (k) { return cm[k]; }).filter(function (o) { return o.tot > 0; }).sort(function (a, b) { return b.tot - a.tot; }).slice(0, 12);
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">Cost / Conversion · วันในสัปดาห์ × แคมเปญ</h2><div class="card-sub">12 แคมเปญที่ใช้เงินมากสุดในช่วงนี้ · Facebook = บาทต่อแชท · Google = บาทต่อ Conversion · % = เทียบค่าเฉลี่ยของแคมเปญนั้น</div></div></div>' +
      (cl.length ? '<div class="table-wrap"><table class="t dwt"><thead><tr><th>แคมเปญ</th>' + DOW_ORDER.map(function (d) { return '<th>' + DOW_S[d] + '</th>'; }).join('') + '</tr></thead><tbody>' +
        cl.map(function (o) { return dowRow(o.name, o.a).replace('</b>', '</b> <span class="srcb ' + (o.src === 'Facebook' ? 'sf' : 'sg') + '">' + (o.src === 'Facebook' ? 'FB' : 'G') + '</span>'); }).join('') + '</tbody></table></div>' : '<div class="empty">ยังไม่มีข้อมูล</div>') + '</div>';

    $('#page').innerHTML = html;
    Charts.countUp($('#page'));
    var lastW = -1;
    S.drawCharts = function () { var w = $('#page').clientWidth; if (w === lastW) return; lastW = w; draw.forEach(function (f) { f(); }); };
    S.drawCharts();
    if (S.tfBind) S.tfBind();
    $$('[data-ts]').forEach(function (b) { b.onclick = function () { tf.src = b.dataset.ts; pageTime(); }; });
    $$('[data-tp]').forEach(function (b) { b.onclick = function () { tf.preset = b.dataset.tp; pageTime(); }; });
    $$('[data-te]').forEach(function (b) { b.onclick = function () { tf.est = b.dataset.te; pageTime(); }; });
    if ($('#tFrom')) { $('#tFrom').onchange = function () { tf.from = this.value; pageTime(); }; $('#tTo').onchange = function () { tf.to = this.value; pageTime(); }; }
    $('#tCamp').onchange = function () { tf[ck] = this.value; pageTime(); };
  }
  function hmHead() {
    return '<table class="hmt"><colgroup><col class="c0">' + Array(25).join('<col>') + '</colgroup><tr><th></th>' + Array.apply(null, Array(24)).map(function (_, h) { return '<th><b>' + ('0' + h).slice(-2) + '</b>:00</th>'; }).join('') + '</tr>';
  }
  /** Facebook: วัน×ชั่วโมง + รายชั่วโมง (ข้อมูลรายชั่วโมงจาก Facebook) */
  function timeFacebook(tf, hr, esSrc, draw) {
    var rows = tf.camp ? hr.filter(function (x) { return x.campaign === tf.camp; }) : hr, html = '';
    var cell = {}, byHour = [], tot = { sp: 0, ch: 0 }, ecell = {}, eHour = [];
    for (var h = 0; h < 24; h++) { byHour.push({ sp: 0, ch: 0 }); eHour.push(0); }
    rows.forEach(function (x) { var k = dowOf(x.date) + '|' + x.hour, c = cell[k] || (cell[k] = { sp: 0, ch: 0 }); c.sp += x.spend; c.ch += x.chats; byHour[x.hour].sp += x.spend; byHour[x.hour].ch += x.chats; tot.sp += x.spend; tot.ch += x.chats; });
    esSrc.forEach(function (e) { if (e.hour < 0) return; var k = dowOf(e.date) + '|' + e.hour; ecell[k] = (ecell[k] || 0) + 1; eHour[e.hour]++; });
    var avg = tot.ch ? tot.sp / tot.ch : null, nDays = Math.max(1, Math.round((new Date(tf.to) - new Date(tf.from)) / 864e5) + 1), minCell = Math.max(30, tot.sp / 168 * 0.25);
    var zero = 0, zeroN = 0; Object.keys(cell).forEach(function (k) { var c = cell[k]; if (!c.ch && c.sp >= minCell) { zero += c.sp; zeroN++; } });
    var hb = byHour.map(function (b, i) { return { h: i, cpc: b.ch ? b.sp / b.ch : null, sp: b.sp, ch: b.ch }; }).filter(function (b) { return b.cpc != null && b.sp >= tot.sp * 0.01; });
    var best = hb.slice().sort(function (a, b) { return a.cpc - b.cpc; })[0];
    var dd = DOW_ORDER.map(function (d) { var s = 0, c = 0; for (var h = 0; h < 24; h++) { var x = cell[d + '|' + h]; if (x) { s += x.sp; c += x.ch; } } return { d: d, cpc: c ? s / c : null }; }).filter(function (x) { return x.cpc != null; });
    var dHi = dd.slice().sort(function (a, b) { return b.cpc - a.cpc; })[0];
    if (!hr.length) return '<div class="nudge">ยังไม่มีข้อมูลรายชั่วโมงของ Facebook — วาง Code.gs ใหม่ → Run <b>refetchFacebook</b> หนึ่งครั้ง → Deploy เวอร์ชันใหม่' + (S.data.config.fb_hourly_error ? ' · ' + esc(S.data.config.fb_hourly_error) : '') + '</div>';
    html += '<div class="tstat">' +
      '<div class="card ts"><span class="l">ค่า Ads Facebook</span><span class="v" data-n>' + F.int(Math.round(tot.sp)) + '<small>บาท</small></span><span class="s">' + F.int(tot.ch) + ' แชท · เฉลี่ย ' + F.baht(avg) + ' / แชท</span></div>' +
      '<div class="card ts bad"><span class="l">ใช้เงินในช่วงที่ไม่มีคนทัก</span><span class="v" data-n>' + F.int(Math.round(zero)) + '<small>บาท</small></span><span class="s">' + (tot.sp ? Math.round(zero / tot.sp * 100) : 0) + '% ของค่า Ads · ' + zeroN + ' ช่องในตาราง</span></div>' +
      '<div class="card ts good"><span class="l">ชั่วโมงที่ Cost/แชท ต่ำสุด</span><span class="v">' + (best ? hhRange(best.h) : '–') + '</span><span class="s">' + (best ? F.baht(best.cpc) + ' / แชท · ต่ำกว่าเฉลี่ย ' + Math.round((1 - best.cpc / avg) * 100) + '%' : '') + '</span></div>' +
      '<div class="card ts"><span class="l">วันที่ Cost/แชท สูงสุด</span><span class="v">' + (dHi ? 'วัน' + DOW[dHi.d] : '–') + '</span><span class="s">' + (dHi ? F.baht(dHi.cpc) + ' / แชท · สูงกว่าเฉลี่ย ' + Math.round((dHi.cpc / avg - 1) * 100) + '%' : '') + '</span></div></div>';

    var hm = hmHead();
    DOW_ORDER.forEach(function (d) {
      hm += '<tr><td class="dn">' + DOW[d] + '</td>';
      for (var h = 0; h < 24; h++) {
        var k = d + '|' + h, c = cell[k], en = ecell[k] || 0, eb = en ? '<i class="eb">' + en + '</i>' : '';
        if (!c || c.sp < minCell) { hm += '<td class="e" data-k="' + k + '">' + eb + '</td>'; continue; }
        if (!c.ch) { hm += '<td class="z" data-k="' + k + '">0' + eb + '</td>'; continue; }
        var v = c.sp / c.ch, col = heatCol(v / avg);
        hm += '<td data-k="' + k + '" style="background:' + col[1] + ';color:' + col[2] + '">' + Math.round(v) + eb + '</td>';
      }
      hm += '</tr>';
    });
    hm += '</table>';
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">Cost / แชท · วัน × ชั่วโมง (Facebook)</h2><div class="card-sub">ตัวเลขในช่อง = บาทต่อแชท · <span class="ebx">3</span> มุมขวาบน = เคสประเมินจาก Facebook ในช่วงเวลานั้น · รวมทุกสัปดาห์ในช่วงที่เลือก</div></div></div>' +
      '<div class="hmw">' + hm + '</div><div class="hlg">' + ['ถูกมาก', 'ถูก', 'ใกล้ค่าเฉลี่ย', 'แพง', 'แพงมาก'].map(function (t, i) { return '<span><i style="background:' + HB[i][1] + '"></i>' + t + '</span>'; }).join('') +
      '<span><i style="background:#3b3b48"></i>ใช้เงิน ไม่มีแชท</span><span><i class="e"></i>ใช้เงินน้อย</span><span class="avg">ค่าเฉลี่ย ' + F.baht(avg) + ' / แชท</span></div><div class="htip" id="hmTip">ชี้ช่องในตารางเพื่อดูวัน เวลา ยอดเงิน แชท และเคสประเมิน</div></div>';

    var items = byHour.map(function (b, i) { return { lab: hhLab(i), tip: hhRange(i) + ' น.', sp: b.sp, cv: b.ch, est: eHour[i] }; });
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">เคสประเมิน + Cost / แชท รายชั่วโมง (Facebook)</h2><div class="card-sub">เคสประเมิน = เคสจาก Facebook ที่โพสต์ในชั่วโมงนั้น · ค่าเฉลี่ย ' + F.baht(avg) + ' / แชท · รวมทุกวันในช่วงที่เลือก</div></div></div>' + barsLegend('แชท') +
      '<div class="bx"><svg class="hbar" id="hourBars"></svg><div class="es-tip" id="hourTip"></div></div></div>';
    draw.push(function () { drawBarsEst($('#hourBars'), $('#hourTip'), items, avg, 'แชท'); });

    // waste table
    var as = {}; rows.forEach(function (x) { var k = x.campaign + '\u0001' + x.adset, a = as[k] || (as[k] = { c: x.campaign, a: x.adset, h: [] }); var b = a.h[x.hour] || (a.h[x.hour] = { sp: 0, ch: 0 }); b.sp += x.spend; b.ch += x.chats; });
    var blocks = [];
    Object.keys(as).forEach(function (k) { var a = as[k], cur = null;
      for (var h = 0; h <= 24; h++) { var b = a.h[h], bad = b && b.sp > 0 && (!b.ch || b.sp / b.ch >= avg * 3);
        if (bad) { if (!cur) cur = { c: a.c, a: a.a, h1: h, h2: h, sp: 0, ch: 0 }; cur.h2 = h; cur.sp += b.sp; cur.ch += b.ch; }
        else if (cur) { blocks.push(cur); cur = null; } } });
    blocks = blocks.filter(function (b) { return b.sp >= 300; }).sort(function (a, b) { return b.sp - a.sp; }).slice(0, 15);
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ช่วงเวลาที่ใช้เงินแต่ไม่มีแชท หรือ Cost/แชท สูงกว่าเฉลี่ย 3 เท่า</h2><div class="card-sub">แยกตาม Ad set · รวมช่วงชั่วโมงที่ติดกัน · แสดงเฉพาะที่ใช้เงินตั้งแต่ 300 บาท · ' + nDays + ' วัน</div></div></div>' +
      (blocks.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Ad set</th><th>ช่วงเวลา</th><th class="r">ใช้เงิน</th><th class="r">แชท</th><th class="r">Cost/แชท</th><th class="r">เทียบค่าเฉลี่ย</th></tr></thead><tbody>' +
        blocks.map(function (b) { var cp = b.ch ? b.sp / b.ch : null;
          return '<tr><td><b>' + esc(b.a || '–') + '</b><div class="muted small">' + esc(b.c) + '</div></td><td>' + hhLab(b.h1) + '–' + ('0' + b.h2).slice(-2) + ':59 น.</td><td class="r">' + F.baht(b.sp) + '</td><td class="r">' + b.ch + '</td><td class="r">' + (cp ? F.baht(cp) : '–') + '</td>' +
            '<td class="r">' + (cp ? '<span class="stp b">แพงกว่า ' + (cp / avg).toFixed(1) + ' เท่า</span>' : '<span class="stp b">ไม่มีแชท</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">ไม่มีช่วงเวลาที่เข้าเงื่อนไข</div>') + '</div>';

    S.tfBind = function () {
      $$('.hmt td[data-k]').forEach(function (td) { td.onmouseenter = function () { var c = cell[td.dataset.k] || { sp: 0, ch: 0 }, p = td.dataset.k.split('|'), en = ecell[td.dataset.k] || 0;
        $('#hmTip').innerHTML = '<b>วัน' + DOW[+p[0]] + ' ' + hhRange(+p[1]) + ' น.</b> · ใช้เงิน ' + F.baht(c.sp) + ' · ' + c.ch + ' แชท' + (c.ch ? ' · ' + F.baht(c.sp / c.ch) + ' / แชท' : '') + ' · <b class="ebt">เคสประเมิน ' + en + ' เคส</b>'; }; });
    };
    return html;
  }
  /** Google Ads: มีเฉพาะรายวัน (แท็บ METRICS ไม่มีรายชั่วโมง) */
  function timeGoogle(tf, gd, esSrc, draw) {
    var rows = tf.gcamp ? gd.filter(function (x) { return x.campaign === tf.gcamp; }) : gd, html = '';
    S.tfBind = null;
    if (!gd.length) return '<div class="nudge">ยังไม่มีข้อมูล Google Ads ในช่วงนี้' + (S.data.config.gads_error ? ' · ' + esc(S.data.config.gads_error) : '') + '</div>';
    var byDay = {}, tot = { sp: 0, cv: 0 }, eDay = {}, dow = DOW_ORDER.map(function () { return { sp: 0, cv: 0, est: 0, n: 0 }; });
    rows.forEach(function (x) { var b = byDay[x.date] || (byDay[x.date] = { sp: 0, cv: 0 }); b.sp += x.cost; b.cv += x.conversions; tot.sp += x.cost; tot.cv += x.conversions; });
    esSrc.forEach(function (e) { eDay[e.date] = (eDay[e.date] || 0) + 1; });
    var days = []; for (var d = tf.from, g = 0; d <= tf.to && g < 400; d = C.addDays(d, 1), g++) days.push(d);
    var avg = tot.cv ? tot.sp / tot.cv : null;
    days.forEach(function (d) { var i = DOW_ORDER.indexOf(dowOf(d)), b = byDay[d] || { sp: 0, cv: 0 }; dow[i].sp += b.sp; dow[i].cv += b.cv; dow[i].est += eDay[d] || 0; dow[i].n++; });
    var dl = dow.map(function (x, i) { return { d: DOW_ORDER[i], cpc: x.cv ? x.sp / x.cv : null }; }).filter(function (x) { return x.cpc != null; });
    var dLo = dl.slice().sort(function (a, b) { return a.cpc - b.cpc; })[0], dHi = dl.slice().sort(function (a, b) { return b.cpc - a.cpc; })[0];
    var eTot = 0; days.forEach(function (d) { eTot += eDay[d] || 0; });
    html += '<div class="nudge soft">Google Ads มีข้อมูลเป็นรายวันเท่านั้น (แท็บ METRICS ไม่มีรายชั่วโมง) — หน้านี้จึงแสดงเป็นวันที่และวันในสัปดาห์ · เคสประเมินฝั่ง Google นับจากช่อง LINE</div>';
    html += '<div class="tstat">' +
      '<div class="card ts"><span class="l">ค่า Ads Google</span><span class="v" data-n>' + F.int(Math.round(tot.sp)) + '<small>บาท</small></span><span class="s">' + F.int(Math.round(tot.cv)) + ' Conv. · เฉลี่ย ' + F.baht(avg) + ' / Conv.</span></div>' +
      '<div class="card ts"><span class="l">เคสประเมินจาก LINE</span><span class="v" data-n>' + F.int(eTot) + '<small>เคส</small></span><span class="s">' + (eTot ? 'ค่า Ads ' + F.baht(tot.sp / eTot) + ' / เคส' : '–') + '</span></div>' +
      '<div class="card ts good"><span class="l">วันที่ Cost/Conv. ต่ำสุด</span><span class="v">' + (dLo ? 'วัน' + DOW[dLo.d] : '–') + '</span><span class="s">' + (dLo && avg ? F.baht(dLo.cpc) + ' / Conv. · ต่ำกว่าเฉลี่ย ' + Math.round((1 - dLo.cpc / avg) * 100) + '%' : '') + '</span></div>' +
      '<div class="card ts bad"><span class="l">วันที่ Cost/Conv. สูงสุด</span><span class="v">' + (dHi ? 'วัน' + DOW[dHi.d] : '–') + '</span><span class="s">' + (dHi && avg ? F.baht(dHi.cpc) + ' / Conv. · สูงกว่าเฉลี่ย ' + Math.round((dHi.cpc / avg - 1) * 100) + '%' : '') + '</span></div></div>';
    var di = days.map(function (d) { var b = byDay[d] || { sp: 0, cv: 0 }; return { lab: DOW_S[dowOf(d)] + ' ' + F.thDate(d), tip: 'วัน' + DOW[dowOf(d)] + ' ' + F.thDate(d, true), sp: b.sp, cv: b.cv, est: eDay[d] || 0 }; });
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">เคสประเมิน + Cost / Conversion รายวัน (Google)</h2><div class="card-sub">เคสประเมิน = เคสจาก LINE วันนั้น · ค่าเฉลี่ย ' + F.baht(avg) + ' / Conv.</div></div></div>' + barsLegend('Conv.') +
      '<div class="bx"><svg class="hbar" id="gDay"></svg><div class="es-tip" id="gDayTip"></div></div></div>';
    var wi = dow.map(function (x, i) { return { lab: 'วัน' + DOW[DOW_ORDER[i]], tip: 'วัน' + DOW[DOW_ORDER[i]] + ' · รวม ' + x.n + ' วันในช่วงนี้', sp: x.sp, cv: x.cv, est: x.est }; });
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">เคสประเมิน + Cost / Conversion ตามวันในสัปดาห์ (Google)</h2><div class="card-sub">รวมทุกสัปดาห์ในช่วงที่เลือก · เคสประเมิน = เคสจาก LINE รวมของวันนั้น</div></div></div>' + barsLegend('Conv.') +
      '<div class="bx"><svg class="hbar" id="gDow"></svg><div class="es-tip" id="gDowTip"></div></div></div>';
    draw.push(function () { drawBarsEst($('#gDay'), $('#gDayTip'), di, avg, 'Conv.'); drawBarsEst($('#gDow'), $('#gDowTip'), wi, avg, 'Conv.'); });
    return html;
  }
  /** แท่ง Cost/Conv. (เขียว/แดงเทียบค่าเฉลี่ย) · 2 แถวบนสุดมีป้ายกำกับ: "เคสประเมิน" และ "Cost / …" ตรงกับแท่งแต่ละแท่ง */
  function drawBarsEst(svg, tip, items, avg, unit) {
    if (!svg) return;
    var W = svg.clientWidth || 900, nar = W < 600, G = nar ? 58 : 96, n = items.length, gw = (W - G - 4) / n, H = nar ? 320 : 370, R1 = 16, R2 = 44, T = 66, XB = 26, ph = H - T - XB, base = T + ph, bw = Math.min(30, gw * 0.66);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.height = H + 'px';
    var vals = items.map(function (b) { return b.cv ? b.sp / b.cv : null; }), mx = Math.max.apply(null, vals.filter(function (v) { return v != null; }).concat([avg || 0, 1])) * 1.08;
    var cap = Math.min(mx, (avg || 0) * 4 || mx);
    function y(v) { return base - Math.min(v, cap) / cap * ph; }
    function X(i) { return G + i * gw + gw / 2; }
    var step = Math.ceil(n / ((W - G) / (nar ? 52 : 64))), vstep = Math.ceil(n / ((W - G) / (nar ? 22 : 30))), fs = gw < 28 ? 10.5 : 12.5;
    var o = '<rect x="0" y="' + (R1 - 13) + '" width="' + W + '" height="22" rx="8" class="rowb e"/><rect x="0" y="' + (R2 - 14) + '" width="' + W + '" height="22" rx="8" class="rowb c"/>' +
      '<text x="8" y="' + (R1 + 2) + '" class="rowl e">' + (nar ? 'เคส' : 'เคสประเมิน') + '</text><text x="8" y="' + (R2 + 1) + '" class="rowl c">' + (nar ? 'Cost' : 'Cost / ' + unit) + '</text>' +
      '<line x1="' + G + '" x2="' + (W - 4) + '" y1="' + base + '" y2="' + base + '" stroke="var(--line)" stroke-width="2"/>';
    if (avg) o += '<line x1="' + G + '" x2="' + (W - 4) + '" y1="' + y(avg) + '" y2="' + y(avg) + '" stroke="var(--text-2)" stroke-width="1.5" stroke-dasharray="6 5" pointer-events="none"/><text x="' + (G - 6) + '" y="' + (y(avg) + 4) + '" text-anchor="end" class="hb-x">เฉลี่ย ' + F.int(Math.round(avg)) + '</text>';
    items.forEach(function (b, i) { var v = vals[i], cx = X(i), x = cx - bw / 2;
      o += '<g class="grp"><rect x="' + (cx - gw / 2) + '" y="0" width="' + gw + '" height="' + H + '" fill="transparent"/>';
      if (v == null) { if (b.sp > 0) o += '<rect x="' + x + '" y="' + (base - 6) + '" width="' + bw + '" height="6" rx="3" fill="#3b3b48"/>'; }
      else o += '<rect class="col" x="' + x + '" y="' + y(v) + '" width="' + bw + '" height="' + (base - y(v)) + '" rx="' + Math.min(5, bw / 3) + '" fill="' + (v <= avg ? 'var(--good)' : 'var(--bad)') + '"/>';
      if (i % vstep === 0) {
        o += '<text x="' + cx + '" y="' + (R1 + 2) + '" text-anchor="middle" class="rowv e" style="font-size:' + fs + 'px">' + b.est + '</text>';
        o += '<text x="' + cx + '" y="' + (R2 + 1) + '" text-anchor="middle" class="rowv ' + (v == null ? 'n' : v <= avg ? 'g' : 'b') + '" style="font-size:' + fs + 'px">' + (v == null ? '–' : F.int(Math.round(v))) + '</text>';
      }
      o += '</g>';
      if (i % step === 0) o += '<text x="' + cx + '" y="' + (base + 17) + '" text-anchor="middle" class="hb-x">' + b.lab + '</text>';
    });
    svg.innerHTML = o;
    $$('g.grp', svg).forEach(function (g, i) { var b = items[i], v = vals[i];
      g.onmouseenter = function () { svg.classList.add('hov');
        esTipAt(tip, svg, X(i), (v == null ? base : y(v)) - 8, W, H, '<b>' + b.tip + '</b><div><span><i style="background:#f5a800;border-radius:50%"></i>เคสประเมิน</span><span>' + b.est + ' เคส</span></div><div><span><i style="background:' + (v != null && v <= avg ? 'var(--good)' : 'var(--bad)') + '"></i>Cost / ' + unit + '</span><span>' + (v == null ? '–' : F.baht(v)) + '</span></div><div><span>ใช้เงิน</span><span>' + F.baht(b.sp) + '</span></div><div><span>' + unit + '</span><span>' + F.int(Math.round(b.cv)) + '</span></div>'); };
      g.onmouseleave = function () { svg.classList.remove('hov'); tip.style.opacity = 0; };
    });
  }
  function barsLegend(unit) {
    return '<div class="bxl"><span><em class="bxs g"></em>Cost / ' + unit + ' ต่ำกว่าค่าเฉลี่ย</span><span><em class="bxs b"></em>สูงกว่าค่าเฉลี่ย</span><span><em class="bxd"></em>ค่าเฉลี่ย</span><span class="muted">ชี้ที่แท่งเพื่อดูยอดเงินและจำนวน ' + unit + '</span></div>';
  }
  // ============================================================
  // เคสประเมิน — เทียบช่วงนี้กับช่วงก่อน แยกประเภทสินค้า
  // ============================================================
  var EST_COL = ['#f5a800', '#2a78d6', '#16a172', '#e8590c', '#7c5cff', '#d6336c', '#0f9da8', '#8f6a00', '#5f6b7a', '#b45fd1', '#2f9e44', '#9aa0ae'];
  function pageEst() {
    var ef = S.ef || (S.ef = { c: 'w', h: 'all', all: false });
    var t = today(), now = new Date(), curH = now.getHours();
    var all = (S.data.estimates || []).filter(function (e) { return ef.h === 'all' || (ef.h === 'fb' ? e.fb : e.line); });
    var cfg, n, lim, side, pN = 99;
    if (['d', 'w', 'm'].indexOf(ef.c) < 0) ef.c = 'w';
    var yd = C.addDays(t, -1); // นับเฉพาะวันที่จบแล้ว (ไม่รวมวันนี้)
    function diff(a, b) { return Math.round((new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00')) / 864e5); }
    if (ef.c === 'd') {
      var pd1 = C.addDays(yd, -7);
      n = 24; lim = 24;
      cfg = { r1: 'เมื่อวาน · วัน' + DOW[dowOf(yd)] + ' ' + F.thDate(yd), r2: 'เทียบ วัน' + DOW[dowOf(pd1)] + 'ก่อน ' + F.thDate(pd1) + ' (วันเดียวกันของสัปดาห์ก่อน)', prev: 'สัปดาห์ก่อน', unit: 'รายชั่วโมง', tt: 'เคสประเมินรายชั่วโมง · ' + F.thDate(yd),
        lab: function (i) { return hhmm(i); }, tip: function (i) { return F.thDate(yd) + ' ' + hhmm(i) + '–' + ('0' + i).slice(-2) + ':59'; }, ptip: function (i) { return F.thDate(pd1) + ' ' + hhmm(i); } };
      side = function (e) { return e.date === yd ? ['n', e.hour] : e.date === pd1 ? ['p', e.hour] : null; };
    } else {
      n = ef.c === 'w' ? 7 : 30; lim = n;
      var s1 = C.addDays(yd, -(n - 1)), ps = C.addDays(s1, -n), pe = C.addDays(s1, -1);
      cfg = { r1: n + ' วันล่าสุด · ' + F.thRange(s1, yd), r2: 'เทียบ ' + n + ' วันก่อนหน้า · ' + F.thRange(ps, pe), prev: n + ' วันก่อนหน้า', unit: 'รายวัน', tt: 'เคสประเมินรายวัน · ' + n + ' วันล่าสุด',
        lab: function (i) { var d = C.addDays(s1, i); return n <= 7 ? DOW_S[dowOf(d)] + '. ' + Number(d.slice(8)) : F.thDate(d); },
        tip: function (i) { var d = C.addDays(s1, i); return 'วัน' + DOW[dowOf(d)] + ' ' + F.thDate(d, true); }, ptip: function (i) { var d = C.addDays(ps, i); return 'วัน' + DOW[dowOf(d)] + ' ' + F.thDate(d); } };
      side = function (e) { if (e.date >= s1 && e.date <= yd) return ['n', diff(e.date, s1)]; if (e.date >= ps && e.date <= pe) return ['p', diff(e.date, ps)]; return null; };
    }
    // ---- รวมตามประเภทสินค้า ----
    var map = {};
    all.forEach(function (e) {
      var s = side(e); if (!s) return;
      var k = String(e.cat || e.category || '').trim() || 'ไม่ระบุ', o = map[k] || (map[k] = { n: k, now: [], prev: [], N: 0, P: 0 });
      var j = ef.c === 'd' ? (e.hour >= 0 ? e.hour : -1) : s[1];
      if (s[0] === 'n') { if (j >= lim) return; o.N++; if (j >= 0) o.now[j] = (o.now[j] || 0) + 1; }
      else { if (j < lim) o.P++; if (j >= 0) o.prev[j] = (o.prev[j] || 0) + 1; }
    });
    var D = Object.keys(map).map(function (k) { var o = map[k]; for (var j = 0; j < n; j++) { o.now[j] = j < lim ? (o.now[j] || 0) : null; o.prev[j] = j < pN ? (o.prev[j] || 0) : null; } return o; })
      .filter(function (o) { return o.N || o.P; }).sort(function (a, b) { return b.N - a.N || b.P - a.P; });
    D.forEach(function (d, i) { d.col = EST_COL[i % EST_COL.length]; });
    var N = 0, P = 0; D.forEach(function (d) { N += d.N; P += d.P; });
    function chg(a, b) { if (!b) return a ? ['n', 'ใหม่'] : ['n', 'เท่าเดิม']; var p = (a - b) / b * 100; if (Math.abs(p) < 1) return ['n', 'เท่าเดิม']; return [p > 0 ? 'g' : 'b', (p > 0 ? 'เพิ่มขึ้น ' : 'ลดลง ') + F.int(Math.round(Math.abs(p))) + '%']; }
    function pick(dir) { var c = D.filter(function (d) { return dir > 0 ? d.N > d.P : d.N < d.P; });
      return c.sort(function (a, b) { return dir * ((b.N - b.P) - (a.N - a.P)) || (b.N + b.P) - (a.N + a.P); })[0]; }
    function dlt(d) { var x = d.N - d.P; return (x > 0 ? '+' : '−') + F.int(Math.abs(x)) + ' เคส'; }
    var top = D[0], gr = pick(1), dr = pick(-1);

    var html = '<div class="es-top"><div class="chip-group" role="group" aria-label="ช่วงที่เทียบ">' + [['d', 'เมื่อวาน vs สัปดาห์ก่อน'], ['w', '7 วัน vs 7 วันก่อนหน้า'], ['m', '30 วัน vs 30 วันก่อนหน้า']].map(function (p) { return '<button data-ec="' + p[0] + '" class="' + (ef.c === p[0] ? 'on' : '') + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<div class="chip-group" role="group" aria-label="ช่องทาง">' + [['all', 'ทุกช่องทาง'], ['fb', 'Facebook'], ['line', 'LINE']].map(function (p) { return '<button data-eh="' + p[0] + '" class="' + (ef.h === p[0] ? 'on' : '') + '">' + p[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="es-rng"><span><span class="es-ring"></span><b>' + cfg.r1 + '</b></span><span><i></i>' + cfg.r2 + '</span></div>';
    if (!(S.data.estimates || []).length) {
      $('#page').innerHTML = html + '<div class="nudge">ยังไม่มีข้อมูลเคสประเมิน — วาง Code.gs ใหม่ แล้วกด ดึงข้อมูลตอนนี้ ในหน้าตั้งค่า</div>';
      bindEst(); S.drawCharts = null; return;
    }
    function kc(l, v, big, c, s) { return '<div class="card es-k"><div class="l">' + l + '</div><div class="v' + (big ? ' es-num' : ' es-name') + '"' + (big ? ' data-n' : '') + '>' + v + '</div><div class="row"><span class="es-chg ' + c[0] + '">' + c[1] + '</span>' + (s || '') + '</div></div>'; }
    html += '<section class="es-k4">' +
      kc('เคสประเมินทั้งหมด', F.int(N) + '<small>เคส</small>', true, chg(N, P), cfg.prev + ' ' + F.int(P)) +
      kc('ประเภทที่มากสุด', top ? esc(top.n) : '–', false, ['n', top ? F.int(top.N) + ' เคส · ' + (N ? Math.round(top.N / N * 100) : 0) + '%' : '–']) +
      kc('เพิ่มขึ้นมากสุด (จำนวนเคส)', gr ? esc(gr.n) : '–', false, gr ? ['g', dlt(gr)] : ['n', 'ไม่มี'], gr ? F.int(gr.P) + ' → ' + F.int(gr.N) + ' เคส · ' + chg(gr.N, gr.P)[1] : '') +
      kc('ลดลงมากสุด (จำนวนเคส)', dr ? esc(dr.n) : '–', false, dr ? ['b', dlt(dr)] : ['n', 'ไม่มี'], dr ? F.int(dr.P) + ' → ' + F.int(dr.N) + ' เคส · ' + chg(dr.N, dr.P)[1] : '') + '</section>';
    html += '<section class="card mt"><div class="card-head"><div><h2 class="card-title">เคสประเมินแยกประเภทสินค้า</h2><div class="card-sub">แท่งเหลือง = ช่วงนี้ · แท่งเทา = ' + cfg.prev + ' · ตัวเลขสีใต้ชื่อ = เปลี่ยนจากช่วงก่อน · เรียงจากมากไปน้อย</div></div>' + (D.length > 11 ? '<button class="btn ghost sm" id="esAll">' + (ef.all ? 'ย่อเหลือ 10 อันดับ' : 'ดูทั้งหมด ' + D.length + ' ประเภท') + '</button>' : '') + '</div>' +
      '<div class="es-lg"><span><i class="a"></i>ช่วงนี้</span><span><i class="p"></i>' + cfg.prev + '</span></div><div class="es-cw"><div class="es-scroll"><svg class="es-svg" id="esCat" role="img" aria-label="เคสประเมินแยกประเภทสินค้า"></svg></div><div class="es-tip" id="esTip1"></div></div></section>';
    html += '<section class="es-g2 mt"><div class="card"><div class="card-head"><div><h2 class="card-title">' + cfg.tt + '</h2><div class="card-sub">ทุกประเภทสินค้ารวมกัน · ตัวเลขบนแท่ง = เคส · เส้นเทา = ' + cfg.prev + '</div></div></div>' +
      '<div class="es-lg"><span><i class="a"></i>ช่วงนี้</span><span><i class="ln"></i>' + cfg.prev + '</span></div><div class="es-cw"><svg class="es-svg" id="esTr"></svg><div class="es-tip" id="esTip2"></div></div></div>' +
      '<div class="card"><div class="card-head"><div><h2 class="card-title">สัดส่วนประเภทสินค้า</h2><div class="card-sub">ช่วงนี้ · % ของเคสทั้งหมด</div></div></div><div class="es-dnw" id="esDn"></div></div></section>';
    html += '<section class="card mt"><div class="card-head"><div><h2 class="card-title">แนวโน้มรายประเภท</h2><div class="card-sub">' + cfg.unit + ' · เส้นเหลือง = ช่วงนี้ · เส้นเทา = ' + cfg.prev + '</div></div></div><div class="es-sm">' +
      D.slice(0, 8).map(function (d) { var w = chg(d.N, d.P); return '<div class="es-smc"><div class="h"><b>' + esc(d.n) + '</b><span class="' + w[0] + '">' + w[1] + '</span></div><div class="v"><span data-n>' + F.int(d.N) + '</span><small>เคส · ก่อน ' + F.int(d.P) + '</small></div>' + esSpark(d.now, d.prev, n) + '</div>'; }).join('') + '</div></section>';

    // donut
    var r = 70, CI = 2 * Math.PI * r, o2 = 0, top6 = D.slice(0, 6), rest = N, parts = top6.filter(function (d) { return d.N; }).map(function (d) { rest -= d.N; return [d.n, d.N, d.col]; });
    if (rest > 0) parts.push(['อื่น ๆ', rest, '#c9ccd6']);
    var ds = '<svg viewBox="0 0 180 180"><circle cx="90" cy="90" r="' + r + '" fill="none" class="es-dtrack" stroke-width="26"/>';
    parts.forEach(function (p) { var L = N ? p[1] / N * CI : 0; ds += '<circle class="es-dseg" cx="90" cy="90" r="' + r + '" fill="none" stroke="' + p[2] + '" stroke-width="26" stroke-dasharray="' + Math.max(L - 2, 0) + ' ' + CI + '" stroke-dashoffset="' + (-o2) + '"/>'; o2 += L; });
    var dnHtml = '<div class="es-dn">' + ds + '</svg><div class="c"><b data-n>' + F.int(N) + '</b><span>เคส</span></div></div><div class="es-dl">' +
      (parts.length ? parts.map(function (p) { return '<div><i style="background:' + p[2] + '"></i><span>' + esc(p[0]) + '</span><b>' + F.int(p[1]) + '</b><small>' + (N ? Math.round(p[1] / N * 100) : 0) + '%</small></div>'; }).join('') : '<div class="muted">ยังไม่มีเคสในช่วงนี้</div>') + '</div>';

    $('#page').innerHTML = html;
    $('#esDn').innerHTML = dnHtml;
    var tn = [], tp = [];
    for (var j = 0; j < n; j++) { var a = j < lim ? 0 : null, b = j < pN ? 0 : null; D.forEach(function (d) { if (a != null) a += d.now[j] || 0; if (b != null) b += d.prev[j]; }); tn.push(a); tp.push(b); }
    var Dc = D;
    if (!ef.all && D.length > 11) { var rest = D.slice(10), o3 = { n: 'อื่น ๆ (' + rest.length + ' ประเภท)', N: 0, P: 0, now: [], prev: [] }; rest.forEach(function (d) { o3.N += d.N; o3.P += d.P; }); Dc = D.slice(0, 10).concat([o3]); }
    var lastW = -1;
    S.drawCharts = function (force) {
      var w = ($('#esTr') || {}).clientWidth; if (!force && w === lastW) return; lastW = w;
      esCat($('#esCat'), $('#esTip1'), Dc, cfg, chg); esTrend($('#esTr'), $('#esTip2'), tn, tp, cfg, chg);
    };
    S.drawCharts(true);
    Charts.countUp($('#page'));
    bindEst();
  }
  function bindEst() {
    $$('[data-ec]').forEach(function (b) { b.onclick = function () { S.ef.c = b.dataset.ec; pageEst(); }; });
    $$('[data-eh]').forEach(function (b) { b.onclick = function () { S.ef.h = b.dataset.eh; pageEst(); }; });
    if ($('#esAll')) $('#esAll').onclick = function () { S.ef.all = !S.ef.all; pageEst(); };
  }
  var ES_DEFS = '<defs><linearGradient id="esNow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23f"/><stop offset="1" stop-color="#f29a00"/></linearGradient><linearGradient id="esPrev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="es-p1"/><stop offset="1" class="es-p2"/></linearGradient></defs>';
  function esReduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  /** แท่งงอกขึ้น (เด้งเล็กน้อย) + ตัวเลขบนแท่งวิ่งตาม */
  function esGrow(items, dur) {
    var t0 = performance.now(), still = esReduced();
    (function f(ts) { var done = true;
      items.forEach(function (it) { var p = still ? 1 : Math.max(0, Math.min(1, (ts - t0 - it.d) / dur)); if (p < 1) done = false;
        var e = p < 1 ? 1 - Math.pow(1 - p, 3) * (1 - Math.sin(p * Math.PI) * 0.12) : 1, h = it.h * Math.min(e, 1.04);
        it.r.setAttribute('y', it.base - h); it.r.setAttribute('height', Math.max(h, 0));
        if (it.t) { it.t.setAttribute('y', it.base - h - 7); it.t.textContent = F.int(Math.round(it.v * Math.min(1, p * 1.15))); it.t.style.opacity = Math.min(1, p * 2); } });
      if (!done) requestAnimationFrame(f); })(t0);
  }
  function esTipAt(tip, svg, x, y, W, H, html) {
    var b = svg.getBoundingClientRect(), wr = tip.parentNode.getBoundingClientRect();
    tip.innerHTML = html; var tw = tip.offsetWidth || 180, px = b.left - wr.left + x / W * b.width;
    px = Math.max(tw / 2 + 4, Math.min(wr.width - tw / 2 - 4, px));
    tip.style.left = px + 'px'; tip.style.top = (b.top - wr.top + y / H * b.height) + 'px'; tip.style.opacity = 1;
  }
  function esCat(svg, tip, D, cfg, chg) {
    if (!svg) return;
    var box = svg.parentNode.clientWidth || 900, n = Math.max(D.length, 1), W = Math.max(box, n * 64), nar = box < 600, H = nar ? 320 : 370, L = 4, R = 4, T = 40, B = nar ? 74 : 66, pw = W - L - R, ph = H - T - B, gw = pw / n, bw = Math.min(30, gw * 0.32), base = T + ph;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.height = H + 'px'; svg.style.width = W + 'px';
    var mx = Math.max.apply(null, D.map(function (d) { return Math.max(d.N, d.P); }).concat([1])) * 1.15;
    function y(v) { return base - v / mx * ph; }
    var o = ES_DEFS;
    for (var g = 1; g <= 3; g++) o += '<line class="es-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + (base - ph * g / 3.4) + '" y2="' + (base - ph * g / 3.4) + '" stroke-dasharray="3 5"/>';
    o += '<line class="es-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + base + '" y2="' + base + '" stroke-width="2"/>';
    D.forEach(function (d, i) {
      var cx = L + i * gw + gw / 2, xa = cx - bw - 2, xp = cx + 2, w = chg(d.N, d.P), pc = d.P ? Math.round((d.N - d.P) / d.P * 100) : null;
      o += '<g class="grp"><rect x="' + (cx - gw / 2) + '" y="' + T + '" width="' + gw + '" height="' + ph + '" fill="transparent"/>';
      o += '<rect class="col a" x="' + xa + '" y="' + base + '" width="' + bw + '" height="0" rx="6" fill="url(#esNow)"/><rect class="col p" x="' + xp + '" y="' + base + '" width="' + bw + '" height="0" rx="6" fill="url(#esPrev)"/>';
      o += '<text class="es-va" x="' + (xa + bw / 2) + '" y="' + base + '" text-anchor="middle" font-size="' + (nar ? 10.5 : 13) + '" style="opacity:0">0</text>';
      o += '<text class="es-vp" x="' + (xp + bw / 2) + '" y="' + base + '" text-anchor="middle" font-size="' + (nar ? 9.5 : 11) + '" style="opacity:0">0</text>';
      var lab = /^[A-Za-z]/.test(d.n) ? d.n.split(' ') : [d.n];
      o += '<text class="es-n1" x="' + cx + '" y="' + (base + 18) + '" text-anchor="middle" font-size="' + (nar ? 10.5 : 12.5) + '">' + esc(lab[0]) + '</text>';
      if (lab[1]) o += '<text class="es-n2" x="' + cx + '" y="' + (base + 33) + '" text-anchor="middle" font-size="' + (nar ? 10 : 11.5) + '">' + esc(lab.slice(1).join(' ')) + '</text>';
      o += '<text class="es-pc ' + w[0] + '" x="' + cx + '" y="' + (base + (lab[1] ? 50 : 35)) + '" text-anchor="middle" font-size="' + (nar ? 10 : 12) + '">' + (pc == null ? (d.N ? 'ใหม่' : '') : pc === 0 ? '0%' : (pc > 0 ? '▲ +' : '▼ ') + pc + '%') + '</text></g>';
    });
    svg.innerHTML = o;
    var items = [];
    $$('g.grp', svg).forEach(function (g, i) { var d = D[i];
      items.push({ r: $('.a', g), t: $('.es-va', g), h: base - y(d.N), v: d.N, base: base, d: i * 70 });
      items.push({ r: $('.p', g), t: $('.es-vp', g), h: base - y(d.P), v: d.P, base: base, d: i * 70 + 120 });
      g.onmouseenter = function () { svg.classList.add('hov'); var w = chg(d.N, d.P);
        esTipAt(tip, svg, L + i * gw + gw / 2, y(Math.max(d.N, d.P)) - 10, W, H, '<b>' + esc(d.n) + '</b><div><span><i style="background:#f5a800"></i>ช่วงนี้</span><span>' + F.int(d.N) + ' เคส</span></div><div><span><i style="background:#cfd2dc"></i>' + cfg.prev + '</span><span>' + F.int(d.P) + ' เคส</span></div><div><span>เปลี่ยน</span><span>' + w[1] + '</span></div>'); };
      g.onmouseleave = function () { svg.classList.remove('hov'); tip.style.opacity = 0; };
    });
    esGrow(items, 900);
  }
  function esTrend(svg, tip, tn, tp, cfg, chg) {
    if (!svg) return;
    var W = svg.clientWidth || 700, H = 310, L = 4, R = 4, T = 26, B = 30, pw = W - L - R, ph = H - T - B, n = tn.length, gw = pw / n, bw = Math.min(40, gw * 0.6), base = T + ph;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.height = H + 'px';
    var mx = Math.max.apply(null, tn.concat(tp).filter(function (v) { return v != null; }).concat([1])) * 1.2;
    function y(v) { return base - v / mx * ph; }
    var o = ES_DEFS + '<line class="es-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + base + '" y2="' + base + '" stroke-width="2"/>',
      step = n > 20 ? (W < 600 ? 6 : 3) : n > 12 ? (W < 600 ? 4 : 2) : 1, vstep = gw < 16 ? (gw < 11 ? 3 : 2) : 1;
    tn.forEach(function (v, i) { var cx = L + i * gw + gw / 2;
      o += '<g class="grp"><rect x="' + (cx - gw / 2) + '" y="' + T + '" width="' + gw + '" height="' + ph + '" fill="transparent"/>';
      if (v != null) o += '<rect class="col a" x="' + (cx - bw / 2) + '" y="' + base + '" width="' + bw + '" height="0" rx="' + Math.min(6, bw / 3) + '" fill="url(#esNow)"/>' + (i % vstep === 0 ? '<text class="es-va" x="' + cx + '" y="' + base + '" text-anchor="middle" font-size="' + (gw < 20 ? 10 : 12) + '" style="opacity:0">0</text>' : '');
      else o += '<rect class="es-fut" x="' + (cx - bw / 2) + '" y="' + (base - 4) + '" width="' + bw + '" height="4" rx="2"/>';
      o += '</g>';
      if (i % step === 0) o += '<text class="es-x" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + cfg.lab(i) + '</text>';
    });
    o += '<polyline class="es-pl" points="' + tp.map(function (v, i) { return v == null ? null : (L + i * gw + gw / 2) + ',' + y(v); }).filter(Boolean).join(' ') + '" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    svg.innerHTML = o;
    var pl = $('.es-pl', svg), len = pl.getTotalLength ? pl.getTotalLength() : 2000;
    if (!esReduced()) { pl.style.strokeDasharray = len; pl.style.strokeDashoffset = len; pl.style.transition = 'stroke-dashoffset 1.4s ease .3s'; requestAnimationFrame(function () { requestAnimationFrame(function () { pl.style.strokeDashoffset = 0; }); }); }
    var items = [];
    $$('g.grp', svg).forEach(function (g, i) { var a = $('.a', g);
      if (a) items.push({ r: a, t: $('.es-va', g), h: base - y(tn[i]), v: tn[i], base: base, d: i * 35 });
      g.onmouseenter = function () { svg.classList.add('hov'); var v = tn[i], p = tp[i];
        esTipAt(tip, svg, L + i * gw + gw / 2, y(Math.max(v || 0, p || 0)) - 8, W, H, '<b>' + cfg.tip(i) + '</b><div><span><i style="background:#f5a800"></i>ช่วงนี้</span><span>' + (v == null ? 'ยังไม่ถึง' : F.int(v) + ' เคส') + '</span></div><div><span><i style="background:#8b90a7"></i>' + cfg.ptip(i) + '</span><span>' + (p == null ? '–' : F.int(p) + ' เคส') + '</span></div>' + (v != null && p ? '<div><span>เปลี่ยน</span><span>' + chg(v, p)[1] + '</span></div>' : '')); };
      g.onmouseleave = function () { svg.classList.remove('hov'); tip.style.opacity = 0; };
    });
    esGrow(items, 800);
  }
  function esSpark(a, b, n) {
    var mx = Math.max.apply(null, a.concat(b).filter(function (v) { return v != null; }).concat([1]));
    function pts(arr) { return arr.map(function (v, i) { return v == null ? null : (i / Math.max(n - 1, 1) * 100) + ',' + (44 - v / mx * 40); }).filter(Boolean).join(' '); }
    return '<svg viewBox="0 0 100 46" preserveAspectRatio="none"><polyline class="es-spp" points="' + pts(b) + '" fill="none" stroke-width="1.6" vector-effect="non-scaling-stroke"/><polyline class="es-spn" points="' + pts(a) + '" fill="none" stroke="#f5a800" stroke-width="2.6" vector-effect="non-scaling-stroke" stroke-linecap="round"/></svg>';
  }
  /** ตั้งค่า: ชื่อหมวดในชีตเคสประเมิน → นับเข้าหมวดไหน (ไว้เช็คว่าไม่มีเคสหลุด) */
  function estCatCard() {
    var from = C.addDays(today(), -89), m = {}, names = {}; C.KPI_CATS.forEach(function (c) { names[c.k] = c.n; });
    (S.data.estimates || []).forEach(function (e) { if (e.date < from) return; var k = String(e.category || '').trim() || '(ว่าง)', o = m[k] || (m[k] = { n: k, c: 0, nc: 0, to: {} });
      o.c++; if (!e.fb && !e.line) o.nc++; var t = e.k ? names[e.k] + (e.guess ? '*' : '') : '-'; o.to[t] = (o.to[t] || 0) + 1; });
    var list = Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return b.c - a.c; });
    if (!list.length) return '';
    var g = 0; (S.data.estimates || []).forEach(function (e) { if (e.date >= from && e.guess) g++; });
    return '<div class="card mt"><div class="card-head"><div><h2 class="card-title">หมวดในชีตเคสประเมิน → นับเข้าหมวดไหน</h2><div class="card-sub">90 วันล่าสุด · ถ้าหมวดในชีตไม่ใช่ 5 หมวด (เช่น อื่นๆ / Smart Phone) ระบบอ่านชื่อรุ่นจากรายละเอียดสินค้าเอง · <b>*</b> = อ่านจากชื่อรุ่น (' + F.int(g) + ' เคส) · เคสที่ไม่มีทั้ง FB และ LINE จะไม่ถูกนับ</div></div></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>หมวดในชีต</th><th class="r">เคส</th><th class="r">ไม่มี FB/LINE</th><th>นับเข้า</th></tr></thead><tbody>' +
      list.map(function (o) { return '<tr><td><b>' + esc(o.n) + '</b></td><td class="r">' + F.int(o.c) + '</td><td class="r' + (o.nc ? '' : ' muted') + '">' + F.int(o.nc) + '</td><td>' +
        Object.keys(o.to).sort(function (a, b) { return o.to[b] - o.to[a]; }).map(function (t) { return t === '-' ? '<span class="muted">ไม่นับ ' + F.int(o.to[t]) + '</span>' : '<span class="pl g">' + esc(t) + ' ' + F.int(o.to[t]) + '</span>'; }).join(' ') + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }
  /** ตั้งค่า: จับคู่แคมเปญ → หมวด */
  function catMapCard() {
    var map = C.catMap(S.data), fset = {}, gset = {};
    (S.data.fbads || []).forEach(function (r) { fset[r.campaign] = true; });
    (S.data.spend || []).forEach(function (r) { if (r.source === 'fb' && r.campaign) fset[r.campaign] = true; });
    (S.data.gads || []).forEach(function (r) { gset[r.campaign] = true; });
    var opts = [['auto', 'อัตโนมัติ (เดาจากชื่อ)']].concat(C.KPI_CATS.map(function (c) { return [c.k, c.n]; })).concat([['mixed', 'หลายหมวด (กระจายตามสัดส่วน)'], ['none', 'ไม่นับ']]);
    var name = { mixed: 'กระจาย', none: 'ไม่นับ' }; C.KPI_CATS.forEach(function (c) { name[c.k] = c.n; });
    function rowsOf(pf, set) {
      return Object.keys(set).sort().map(function (c) {
        var cur = map[pf + '|' + c] || 'auto', auto = C.adCat({}, pf, c, '');
        return '<tr><td>' + esc(c) + '</td><td class="muted small">' + (cur === 'auto' ? 'ตอนนี้: ' + name[auto] + (pf === 'f' && auto === 'mixed' ? ' (ดูจากชื่อ Ad set/โฆษณาก่อน)' : '') : '') + '</td><td><select class="field-inline cm" data-cm="' + esc(pf + '|' + c) + '">' + opts.map(function (o) { return opt(o[0], o[1], cur); }).join('') + '</select></td></tr>';
      }).join('');
    }
    var f = rowsOf('f', fset), g = rowsOf('g', gset);
    return '<div class="card mt"><h2 class="card-title">จับคู่แคมเปญ → หมวด (หน้า ต้นทุนต่อหมวด)</h2><div class="card-sub">ระบบเดาจากชื่อให้เอง แก้เฉพาะตัวที่ผิด · Google ที่ไม่รู้หมวด = ไม่นับ · Facebook ที่ไม่รู้หมวด = กระจายตามสัดส่วน</div>' +
      '<div class="table-wrap" style="margin-top:10px"><table class="t"><tbody>' + (f ? '<tr class="grp"><td colspan="3">Facebook</td></tr>' + f : '') + (g ? '<tr class="grp"><td colspan="3">Google Ads</td></tr>' + g : '') +
      (!f && !g ? '<tr><td class="empty">ยังไม่มีข้อมูลแคมเปญ — กด ดึงข้อมูลตอนนี้</td></tr>' : '') + '</tbody></table></div></div>';
  }
  function wireCatMap() {
    $$('.cm').forEach(function (s) {
      s.onchange = function () {
        var map = C.catMap(S.data);
        if (s.value === 'auto') delete map[s.dataset.cm]; else map[s.dataset.cm] = s.value;
        var v = JSON.stringify(map);
        API.call('saveConfig', { key: 'cat_map', value: v }).then(function () { S.data.config.cat_map = v; toast('บันทึกแล้ว'); }).catch(fail);
      };
    });
  }

  // ============================================================
  // ประสิทธิภาพโฆษณา Facebook (หน้า ภาพรวม)
  // ============================================================
  var PM = {
    cpc: { l: 'ต้นทุนต่อแชท', f: function (v) { return F.baht(v); }, up: false, k: 'pct' },
    imp: { l: 'อิมเพรสชัน', f: function (v) { return F.int(Math.round(v)); }, up: true, k: 'pct' },
    reach: { l: 'คนเห็นโฆษณา', f: function (v) { return F.int(Math.round(v)); }, up: true, k: 'pct' },
    lclk: { l: 'คลิกลิงก์', f: function (v) { return F.int(Math.round(v)); }, up: true, k: 'pct' },
    cplc: { l: 'ต้นทุนต่อคลิกลิงก์', f: function (v) { return F.baht(v); }, up: false, k: 'pct' },
    ctr: { l: 'CTR ลิงก์ (% คนคลิก)', f: function (v) { return F.pct(v, 1); }, up: true, k: 'pt' },
    freq: { l: 'ความถี่ (เห็นซ้ำ)', f: function (v) { return v == null ? '–' : v.toFixed(1) + ' ครั้ง'; }, up: false, k: 'abs' },
    cpm: { l: 'CPM (ต่อ 1,000 ครั้ง)', f: function (v) { return F.baht(v); }, up: false, k: 'pct' }
  };
  function perfSection(f, m, prevRange, charts) {
    if (!(S.data.fbads || []).length) return '';
    var cur = C.fbPerf(S.data, f.from, f.to, f.campaign), old = prevRange ? C.fbPerf(S.data, prevRange[0], prevRange[1], f.campaign) : {};
    var met = S.pmetric || 'cpc';
    var html = '<div class="pgrid mt">' + Object.keys(PM).map(function (k, i) { var p = PM[k];
      return '<div class="card pk' + (i === 0 ? ' main' : '') + (met === k ? ' on' : '') + '" data-pm="' + k + '"><div class="l"><span>' + p.l + '</span>' + dBadge(cur[k], old[k], p.up, p.k) + '</div><div class="v" data-n>' + p.f(cur[k]) + '</div><div class="o">ช่วงก่อน ' + p.f(old[k]) + '</div>' + (i === 0 ? '<div class="o">ค่า Ads ' + F.baht(cur.spend) + ' · ' + F.int(Math.round(cur.chat)) + ' แชท</div>' : '') + '</div>'; }).join('') + '</div>';
    // daily trend
    var days = []; for (var d = f.from; d <= f.to; d = C.addDays(d, 1)) days.push(d);
    var n = days.length, pv = days.map(function (d) { return C.fbPerf(S.data, d, d, f.campaign)[met]; }), pp = prevRange ? days.map(function (d, i) { var x = C.addDays(prevRange[0], i); return C.fbPerf(S.data, x, x, f.campaign)[met]; }) : [];
    html += section(PM[met].l + ' — รายวัน (Facebook)', 'กดการ์ดด้านบนเพื่อเปลี่ยนตัวเลข · เส้นประจาง = ช่วงก่อนหน้า · ชี้เพื่อดูค่า', legend([['ช่วงที่เลือก', 'var(--primary)'], ['ช่วงก่อนหน้า', 'var(--text-3)']]) + '<div class="chart-box" id="chP"></div>', 'full');
    charts.push(['chP', 'line', { labels: days.map(function (d) { return F.thDate(d); }), tips: days.map(function (d) { return F.thDate(d, true); }), height: 300, fmt: met === 'ctr' ? function (v) { return (v * 100).toFixed(1) + '%'; } : met === 'freq' ? function (v) { return v.toFixed(1); } : function (v) { return F.int(Math.round(v)); },
      series: [{ name: 'ช่วงก่อน', color: 'var(--text-3)', width: 2, dash: '5 4', opacity: .6, values: pp }, { name: 'ช่วงนี้', color: 'var(--primary)', width: 3.5, area: true, values: pv }] }]);
    // funnel
    var st = [['เห็นโฆษณา', cur.reach, old.reach, 'fb', 'Facebook'], ['คลิกลิงก์', cur.lclk || cur.clk, old.lclk || old.clk, 'fb', 'Facebook'], ['ทักแชท', cur.chat, old.chat, 'fb', 'Facebook'],
      ['บันทึกเป็น Lead', m.leads, null, 'us', 'แอดมินบันทึก'], ['ประเมินราคา', m.funnel[2] ? m.funnel[2].n : null, null, 'us', 'แอดมินบันทึก'], ['ปิดได้', m.closed, null, 'us', 'แอดมินบันทึก']];
    var bench = [0.02, 0.05, 0.6, 0.5, 0.06], widths = [100, 84, 68, 54, 42, 30], fh = '', worst = null;
    st.forEach(function (s, i) {
      var w = widths[i], nw = widths[i + 1] || w * 0.7, cut = ((w - nw) / 2 / w * 100).toFixed(1);
      fh += '<div class="fs"><div class="nm">' + s[0] + '<small>' + s[4] + '</small></div><div><div class="shape ' + s[3] + '" style="width:' + w + '%;--cut:' + cut + '%">' + F.int(Math.round(s[1] || 0)) + '</div></div><div class="dl">' + (s[2] != null ? dBadge(s[1], s[2], true, 'pct') : '') + '</div></div>';
      if (i < st.length - 1) {
        var a = s[1], b = st[i + 1][1], rr = a ? b / a : 0, lo = rr < bench[i];
        if (lo && (!worst || rr / bench[i] < worst.k)) worst = { k: rr / bench[i], i: i + 1, r: rr };
        fh += '<div class="gap"><div></div><div style="text-align:center"><span class="rate' + (lo ? ' lo' : '') + '">↓ ' + F.pct(rr, 1) + ' ไปต่อ</span></div><div class="miss">' + (i === 2 && a - b > 0 ? F.int(Math.round(a - b)) + ' คนยังไม่บันทึก' : '') + '</div></div>';
      }
    });
    var msg = { 1: ['คนเห็นแต่ไม่คลิก', 'ภาพ/ข้อความโฆษณายังไม่ดึงดูด → ลองเปลี่ยนครีเอทีฟ'], 2: ['คลิกแล้วไม่ทัก', 'เช็คข้อความต้อนรับ/ปุ่มคำถามในโฆษณา'], 3: ['ทักแล้วไม่ได้บันทึก', 'ตามให้แอดมินบันทึกให้ครบ ตัวเลขจะได้แม่น'], 4: ['ทักแล้วไม่ส่งข้อมูลเครื่อง', 'ดูสคริปต์ตอบแชทและความเร็วในการตอบ'], 5: ['ประเมินราคาแล้วไม่ขาย', 'โฆษณาทำงานปกติ ปัญหาอยู่ที่ราคาหรือการตามลูกค้า'] };
    var dg = worst ? '<div class="dg bad"><b>หลุดมากสุด: ' + msg[worst.i][0] + ' (' + F.pct(worst.r, 1) + ')</b><span>' + msg[worst.i][1] + '</span></div>' : '<div class="dg ok"><b>ทุกขั้นอยู่ในเกณฑ์ปกติ</b></div>';
    dg += '<div class="dg"><b>อ่านกรวยยังไง</b><span>ป้ายระหว่างขั้น = คนจากขั้นบนไปต่อขั้นล่างกี่ % · สีแดง = ต่ำกว่าเกณฑ์ · ▲▼ = เทียบช่วงก่อนหน้า</span></div>';
    html += section('ลูกค้าหลุดตรงไหน — ตั้งแต่เห็นโฆษณาจนรับซื้อได้', 'สีฟ้า = Facebook · สีส้ม = แอดมินบันทึก', '<div class="fwrap"><div class="vfun">' + fh + '</div><div class="diag">' + dg + '</div></div>', 'full');
    // campaign/ad table
    var all = !f.campaign, items;
    if (all) { var cs = {}; C.fbPerf; (S.data.fbads || []).forEach(function (r) { if (r.date >= f.from && r.date <= f.to) cs[r.campaign] = true; });
      items = Object.keys(cs).map(function (c) { return { name: c, camp: c, c: C.fbPerf(S.data, f.from, f.to, c), o: prevRange ? C.fbPerf(S.data, prevRange[0], prevRange[1], c) : {} }; }); }
    else { var as = {}; (S.data.fbads || []).forEach(function (r) { if (r.campaign === f.campaign && r.date >= f.from && r.date <= f.to) as[r.ad] = true; });
      items = Object.keys(as).map(function (a) { return { name: a, c: C.fbPerf(S.data, f.from, f.to, f.campaign, a), o: prevRange ? C.fbPerf(S.data, prevRange[0], prevRange[1], f.campaign, a) : {} }; }); }
    items = items.filter(function (x) { return x.c.spend > 0; });
    var cps = items.map(function (x) { return x.c.cpc; }).filter(Boolean), mn = Math.min.apply(null, cps), mx = Math.max.apply(null, cps), mxAll = mx;
    S.popen = S.popen || {};
    function prow(name, c, o, cls, extra, sub) {
      var col = !sub && items.length > 1 && c.cpc === mn ? 'var(--good)' : !sub && items.length > 1 && c.cpc === mx ? 'var(--bad)' : 'var(--primary)';
      var tag = c.freq > 3.5 ? '<span class="pill warn">เห็นซ้ำเยอะ</span>' : !sub && items.length > 1 && c.cpc === mn ? '<span class="pill good">คุ้มสุด</span>' : !sub && items.length > 1 && c.cpc === mx ? '<span class="pill bad">แพงสุด</span>' : '';
      return '<tr class="' + cls + '"' + extra + '><td>' + name + '</td><td class="r num">' + F.baht(c.spend) + '</td><td class="r num">' + F.int(Math.round(c.reach)) + '</td><td class="r num"' + (c.freq > 3.5 ? ' style="color:var(--bad);font-weight:600"' : '') + '>' + (c.freq ? c.freq.toFixed(1) : '–') + '</td>' +
        '<td class="r num"><div class="cell2">' + F.pct(c.ctr, 1) + dBadge(c.ctr, o.ctr, true, 'pt') + '</div></td><td class="r num">' + F.int(Math.round(c.chat)) + '</td>' +
        '<td class="r num"><div class="cpc2"><div class="cell2"><b>' + F.baht(c.cpc) + '</b>' + dBadge(c.cpc, o.cpc, false, 'pct') + '</div><div class="tr2"><i style="width:' + (c.cpc && mxAll ? Math.min(100, c.cpc / mxAll * 100) : 0) + '%;background:' + col + '"></i></div></div></td><td>' + tag + '</td></tr>';
    }
    var th = '<thead><tr><th>' + (all ? 'แคมเปญ' : 'โฆษณา') + '</th><th class="r">ค่า Ads</th><th class="r">คนเห็น</th><th class="r">ความถี่</th><th class="r">CTR</th><th class="r">แชท</th><th class="r">ต้นทุน/แชท</th><th></th></tr></thead><tbody>';
    items.forEach(function (x) {
      if (all) { var op = S.popen[x.camp]; th += prow('<span class="caret' + (op ? ' open' : '') + '">▸</span>' + esc(x.name), x.c, x.o, 'click pcamp', ' data-pc="' + esc(x.camp) + '"');
        if (op) { var as2 = {}; (S.data.fbads || []).forEach(function (r) { if (r.campaign === x.camp && r.date >= f.from && r.date <= f.to) as2[r.ad] = true; });
          Object.keys(as2).forEach(function (a) { var c = C.fbPerf(S.data, f.from, f.to, x.camp, a); if (c.spend > 0) th += prow(esc(a), c, prevRange ? C.fbPerf(S.data, prevRange[0], prevRange[1], x.camp, a) : {}, 'sub-row', '', true); }); } }
      else th += prow(esc(x.name), x.c, x.o, '', '', true);
    });
    html += section(all ? 'เทียบแคมเปญ (Facebook)' : 'เทียบโฆษณาในแคมเปญนี้', (all ? 'กดแถวเพื่อดูโฆษณาข้างใน · ' : '') + 'แถบสี = ต้นทุนต่อแชท (สั้น = ถูก) · ▲▼ เทียบช่วงก่อนหน้า',
      items.length ? '<div class="table-wrap"><table class="t">' + th + '</tbody></table></div>' : '<div class="empty">ไม่มีการยิงในช่วงนี้</div>', 'full');
    return html;
  }

  // ============================================================
  // Settings
  // ============================================================
  function pageSettings() {
    var html = '<div class="grid row-2">' +
      '<div class="card"><h2 class="card-title" style="margin-bottom:14px">เป้าหมาย</h2><form id="cfgForm" class="form-grid">' +
      '<div class="f c8"><label for="cfgTarget">เป้าต้นทุน/เคส (บาท)</label><input type="number" id="cfgTarget" min="1" value="' + esc(S.data.config.target_cost_per_case) + '"><div class="hint">ใช้ตัดสินในหน้าภาพรวมว่าต้นทุนต่อเคสผ่านเป้าไหม</div></div>' +
      '<div class="f c4" style="align-self:start;padding-top:27px"><button class="btn" type="submit">บันทึก</button></div></form></div>' +
      '<div class="card"><div class="card-head"><h2 class="card-title">ผู้ใช้</h2><button class="btn sm" id="addUser">+ เพิ่มผู้ใช้</button></div>' +
      '<table class="t"><tbody>' + S.data.users.map(function (u) {
        return '<tr><td><div class="name-cell"><div class="avatar" style="width:32px;height:32px;font-size:13px;box-shadow:none">' + esc(initials(u.name)) + '</div>' + esc(u.name) + '</div></td>' +
          '<td>' + (u.active ? '<span class="pill good">ใช้งาน</span>' : '<span class="pill">ปิด</span>') + '</td>' +
          '<td class="r"><button class="btn ghost sm" data-user="' + esc(u.name) + '">แก้</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
    var fbLast = S.data.config.fb_last_sync, fbRes = {};
    try { fbRes = JSON.parse(S.data.config.fb_last_result || '{}'); } catch (e) { fbRes = {}; }
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ดึงข้อมูลจาก Facebook Ads อัตโนมัติ</h2>' +
      '<div class="card-sub">ค่า Ads รายวัน · งบ/วัน · เปิด/หยุดยิง · แคมเปญ / Ad set / โฆษณา · รายชื่อลูกค้าที่ทักเพจ (ย้อนหลัง 3 เดือน) — อ่านอย่างเดียว ไม่แก้อะไรใน Facebook</div></div>' +
      '<button class="btn" id="fbSync">ดึงข้อมูลตอนนี้</button></div>' +
      (fbLast ? '<div class="status-line"><span class="sdot on"></span><b>เชื่อมต่อแล้ว</b> <span class="muted">· ดึงล่าสุด ' + esc(new Date(fbLast).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })) +
        (fbRes.spendDays != null ? ' · ค่า Ads ' + fbRes.spendDays + ' วัน-แคมเปญ · แคมเปญใหม่ ' + (fbRes.campaigns || 0) + ' · เปลี่ยนงบ/สถานะ ' + (fbRes.budgetChanges || 0) : '') + '</span></div>'
        : '<div class="status-line"><span class="sdot none"></span><b>ยังไม่ได้เชื่อมต่อ</b> <span class="muted">· ใส่ FB_TOKEN ใน Apps Script แล้วกด "ดึงข้อมูลตอนนี้" (ดูขั้นตอนใน README)</span></div>') +
      (fbLast ? (S.data.config.fb_inbox_error
        ? '<div class="nudge" style="margin-top:12px">แชทลูกค้าจาก Inbox ยังดึงไม่ได้: ' + esc(S.data.config.fb_inbox_error) + '</div>'
        : '<div class="status-line" style="margin-top:6px"><span class="sdot on"></span><b>แชทลูกค้าจาก Inbox</b> <span class="muted">· ' + (S.data.config.page_name ? 'เพจ ' + esc(S.data.config.page_name) + ' · ' : '') +
          (fbRes.inboxNew != null ? 'คนทักใหม่รอบล่าสุด ' + fbRes.inboxNew + ' คน (จับคู่โฆษณาให้เอง ' + (fbRes.inboxAuto || 0) + ')' : 'ยังไม่เคยดึง') + (fbRes.inboxDone === false ? ' · กำลังดึงย้อนหลัง 3 เดือน (ทยอยดึงทุกชั่วโมง)' : '') + '</span></div>') : '') +
      (fbLast ? '<div class="status-line" style="margin-top:6px"><span class="sdot ' + (S.data.config.gads_error ? 'off' : 'on') + '"></span><b>Google Ads (METRICS)</b> <span class="muted">· ' + (S.data.config.gads_error ? esc(S.data.config.gads_error) : (S.data.gads || []).length + ' แถว') + '</span></div>' +
        '<div class="status-line" style="margin-top:6px"><span class="sdot ' + (S.data.config.purchase_error ? 'off' : 'on') + '"></span><b>รับซื้อ (Orders)</b> <span class="muted">· ' + (S.data.config.purchase_error ? esc(S.data.config.purchase_error) : (S.data.purchases || []).length + ' เครื่อง · อ่านอย่างเดียว') + '</span></div>' +
        '<div class="status-line" style="margin-top:6px"><span class="sdot ' + (S.data.config.estimate_error ? 'off' : 'on') + '"></span><b>เคสประเมิน (Estimations)</b> <span class="muted">· ' + (S.data.config.estimate_error ? esc(S.data.config.estimate_error) : (S.data.estimates || []).length + ' เคส · อ่านอย่างเดียว') + '</span></div>' : '') +
      '<div class="muted small" style="margin-top:8px">ตั้งดึงอัตโนมัติทุก 1 ชั่วโมงด้วยการรัน installAutoSync() ใน Apps Script ครั้งเดียว · วันที่ Facebook มีตัวเลขแล้ว ระบบจะไม่นับค่า Ads ที่กรอกมือของวันนั้นซ้ำ</div></div>';
    html += catMapCard();
    html += estCatCard();
    html += '<div class="card mt"><h2 class="card-title">ประเภทสินค้า</h2><div class="card-sub" style="margin-bottom:12px">ปุ่มให้กดเลือกตอนบันทึกแชท · 1 บรรทัด = 1 ประเภท · เรียงตามลำดับที่อยากให้แสดง</div>' +
      '<form id="prodForm" class="form-grid"><div class="f c8"><textarea id="prodList" rows="6">' + esc(C.productList(S.data).join('\n')) + '</textarea></div>' +
      '<div class="f c4" style="align-self:end"><div class="prod-picker small-p">' + C.productList(S.data).map(function (x) { return '<button type="button" tabindex="-1">' + esc(x) + '</button>'; }).join('') + '</div><button class="btn" type="submit" style="margin-top:12px">บันทึก</button></div></form></div>';
    if (API.isDemo) {
      html += '<div class="card mt"><h2 class="card-title">โหมดตัวอย่าง</h2><p class="muted">ตอนนี้ยังไม่ได้ใส่ API_URL ใน assets/js/config.js — ข้อมูลทั้งหมดเป็นข้อมูลจำลองที่เก็บในเบราว์เซอร์นี้เท่านั้น</p>' +
        '<button class="btn ghost" id="resetDemo">รีเซ็ตข้อมูลตัวอย่าง</button></div>';
    }
    $('#page').innerHTML = html;
    $('#cfgForm').onsubmit = function (e) {
      e.preventDefault();
      var v = Number($('#cfgTarget').value);
      if (!(v > 0)) return toast('ใส่ตัวเลขมากกว่า 0', true);
      API.call('saveConfig', { key: 'target_cost_per_case', value: v }).then(function () { S.data.config.target_cost_per_case = v; toast('บันทึกเป้าแล้ว'); }).catch(fail);
    };
    $('#fbSync').onclick = function () {
      var b = this; b.disabled = true; b.textContent = 'กำลังดึง…';
      API.call('syncFacebook').then(function (r) {
        return refresh().then(function () { toast('ดึงจาก Facebook แล้ว · ค่า Ads ' + r.spendDays + ' รายการ' + (r.inboxNew ? ' · คนทักใหม่ ' + r.inboxNew + ' คน' : '')); render(); });
      }).catch(function (e) { fail(e); b.disabled = false; b.textContent = 'ดึงข้อมูลตอนนี้'; });
    };
    wireCatMap();
    $('#prodForm').onsubmit = function (e) {
      e.preventDefault();
      var list = $('#prodList').value.split(/[\n,]+/).map(function (x) { return x.trim(); }).filter(Boolean);
      if (!list.length) return toast('ใส่อย่างน้อย 1 ประเภท', true);
      var v = list.join('\n');
      API.call('saveConfig', { key: 'products', value: v }).then(function () { S.data.config.products = v; toast('บันทึกประเภทสินค้าแล้ว'); pageSettings(); }).catch(fail);
    };
    $('#addUser').onclick = function () { editUser(null); };
    $$('[data-user]').forEach(function (b) { b.onclick = function () { editUser(b.dataset.user); }; });
    if ($('#resetDemo')) $('#resetDemo').onclick = function () { API.resetDemo(); boot(); toast('รีเซ็ตแล้ว'); };
  }

  function editAd(id, preset) {
    var a = id ? S.data.ads.filter(function (x) { return x.id === id; })[0] : Object.assign({ active: true }, preset || {});
    var used = id ? S.data.chats.filter(function (c) { return c.ad === a.ad_name; }).length : 0;
    var asList = a.campaign ? C.adsetsOf(S.data, a.campaign) : adsets();
    if (!campaigns().length) return toast('เพิ่มแคมเปญก่อน แล้วค่อยเพิ่มโฆษณา', true);
    modal('<h3>' + (id ? 'แก้ไขโฆษณา' : 'เพิ่มโฆษณา') + '</h3><form id="adForm" class="form-grid">' +
      '<div class="f c12"><label>แคมเปญ</label><select id="adCamp" required>' + (a.campaign ? '' : '<option value="">— เลือกแคมเปญ —</option>') + campOptions(a.campaign) + '</select></div>' +
      '<div class="f c12"><label>Ad set</label><input id="adSet" list="dlAdset" value="' + esc(a.adset || '') + '" required></div>' +
      '<div class="f c12"><label>ชื่อโฆษณา (ที่จะเลือกตอนบันทึกแชท)</label><input id="adName" value="' + esc(a.ad_name || '') + '" required' + (used ? ' readonly' : '') + '>' +
      (used ? '<div class="hint">มีแชทใช้ชื่อนี้อยู่ ' + used + ' แถว — เปลี่ยนชื่อไม่ได้ ถ้าจะเลิกใช้ให้ปิดแทน</div>' : '') + '</div>' +
      '<div class="f c12"><label>ลิงก์โพสต์ที่บูสต์</label><input id="adPost" type="url" value="' + esc(a.post_url || '') + '" placeholder="https://www.facebook.com/..."></div>' +
      '<div class="f c12"><label>ลิงก์รูปครีเอทีฟ</label><input id="adImg" type="url" value="' + esc(a.creative_url || '') + '" placeholder="ลิงก์รูป (Google Drive แบบแชร์ หรือ URL รูป)"></div>' +
      '<div class="f c12"><label>หมายเหตุ</label><input id="adNote" value="' + esc(a.note || '') + '"></div>' +
      '<div class="f c12"><label><input type="checkbox" id="adActive"' + (isTrue(a.active) ? ' checked' : '') + ' style="width:auto;margin-right:8px">กำลังยิงอยู่ (โผล่ในหน้าบันทึกแชท)</label></div>' +
      '<datalist id="dlAdset">' + asList.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (id && !used ? '<button type="button" class="btn danger" id="adDel">ลบ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#adForm', el).onsubmit = function (e) {
          e.preventDefault();
          var rec = { id: a.id || '', ad_name: $('#adName', el).value.trim(), adset: $('#adSet', el).value.trim(), campaign: $('#adCamp', el).value,
            post_url: $('#adPost', el).value.trim(), creative_url: driveImg($('#adImg', el).value.trim()), note: $('#adNote', el).value.trim(), active: $('#adActive', el).checked };
          if (!rec.campaign) return toast('ต้องเลือกแคมเปญ', true);
          API.call('saveAd', { ad: rec }).then(function (saved) {
            var i = S.data.ads.findIndex(function (x) { return x.id === saved.id; });
            if (i >= 0) S.data.ads[i] = saved; else S.data.ads.push(saved);
            close(); toast('บันทึกโฆษณาแล้ว'); pageCampaigns();
          }).catch(fail);
        };
        if ($('#adDel', el)) $('#adDel', el).onclick = function () {
          askConfirm('ลบโฆษณานี้?', function () {
            API.call('deleteAd', { id: a.id }).then(function () {
              S.data.ads = S.data.ads.filter(function (x) { return x.id !== a.id; }); close(); toast('ลบแล้ว'); pageCampaigns();
            }).catch(fail);
          });
        };
      });
  }

  /** แปลงลิงก์แชร์ Google Drive ให้เป็นลิงก์รูปที่แสดงได้ */
  function driveImg(u) {
    var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w400' : u;
  }

  function editUser(name) {
    var u = name ? S.data.users.filter(function (x) { return x.name === name; })[0] : null;
    modal('<h3>' + (u ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้') + '</h3><form id="uForm" class="form-grid">' +
      '<div class="f c12"><label>ชื่อ</label><input id="uName" value="' + esc(name || '') + '"' + (u ? ' readonly' : '') + ' required></div>' +
      '<div class="f c12"><label>' + (u ? 'PIN ใหม่ (เว้นว่าง = ไม่เปลี่ยน)' : 'PIN') + '</label><input id="uPin" class="pin" type="password" inputmode="numeric" maxlength="6" pattern="\\d{4,6}"' + (u ? '' : ' required') + '><div class="hint">ตัวเลข 4–6 หลัก</div></div>' +
      (u ? '<div class="f c12"><label><input type="checkbox" id="uActive"' + (u.active ? ' checked' : '') + ' style="width:auto;margin-right:8px">ใช้งานได้</label></div>' : '') +
      '<div class="c12 actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></div></form>',
      function (el, close) {
        $('#uForm', el).onsubmit = function (e) {
          e.preventDefault();
          var nm = $('#uName', el).value.trim(), pin = $('#uPin', el).value, active = u ? $('#uActive', el).checked : true;
          API.call('saveUser', { name: nm, pin: pin, active: active }).then(function () {
            if (u) u.active = active; else S.data.users.push({ name: nm, active: true });
            close(); toast('บันทึกผู้ใช้แล้ว'); pageSettings();
          }).catch(fail);
        };
      });
  }

  var rz;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (S.drawCharts) S.drawCharts(); }, 150); });
  boot();
})();
