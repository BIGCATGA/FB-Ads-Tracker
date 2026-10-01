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
    link: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>'
  };
  var NAV = [
    { id: 'dashboard', label: 'ภาพรวม', icon: I.dash },
    { id: 'chats', label: 'บันทึกแชท', icon: I.chat },
    { id: 'campaigns', label: 'แคมเปญ', icon: I.mega },
    { id: 'settings', label: 'ตั้งค่า', icon: I.gear }
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
    var nav = NAV.map(function (n) {
      var cnt = n.id === 'chats' ? (S.data.inbox || []).filter(function (r) { return r.status === 'pending'; }).length : 0;
      return '<button data-nav="' + n.id + '" class="' + (S.page === n.id ? 'active' : '') + '">' + n.icon + '<span>' + n.label + '</span>' + (cnt ? '<i class="nav-badge">' + cnt + '</i>' : '') + '</button>';
    }).join('');
    var title = NAV.filter(function (n) { return n.id === S.page; })[0].label;
    root.innerHTML =
      '<div class="app">' +
      '<aside class="sidebar">' +
      '<div class="brand"><div class="brand-mark">' + (S.data.config.page_id ? '<img src="https://graph.facebook.com/' + esc(S.data.config.page_id) + '/picture?type=large" alt="" onerror="this.remove()">' : '') + 'B</div><div class="brand-name">' + esc(S.data.config.brand || window.APP_CONFIG.BRAND) + ' <span>Ads</span></div></div>' +
      '<div class="me"><div class="avatar">' + esc(initials(S.data.me)) + '</div><div><div class="me-name">' + esc(S.data.me) + '</div><div class="me-sub">' + (API.isDemo ? 'โหมดตัวอย่าง' : 'แอดมิน') + '</div></div></div>' +
      '<nav class="nav">' + nav + '</nav>' +
      '<div class="sidebar-foot"><div class="label">โหมดสี</div>' +
      '<div class="seg"><button data-theme="light" class="' + (!dark ? 'on' : '') + '">' + I.sun + 'สว่าง</button><button data-theme="dark" class="' + (dark ? 'on' : '') + '">' + I.moon + 'มืด</button></div>' +
      (API.isDemo ? '' : '<button class="linkish" id="logout">ออกจากระบบ</button>') +
      '</div></aside>' +
      '<main class="main">' +
      '<div class="topbar">' +
      '<h1 class="page-title">' + title + '</h1>' +
      '<label class="search">' + I.search + '<input id="globalSearch" placeholder="ค้นหาชื่อลูกค้า…" value="' + esc(S.page === 'chats' ? S.chatFilter.q : '') + '"></label>' +
      '<span class="spacer"></span>' +
      (API.isDemo ? '<span class="demo-badge">โหมดตัวอย่าง · ข้อมูลจำลอง</span>' : '') +
      (API.outdated ? '<div class="outdated">⚠️ หลังบ้าน (Apps Script) ยังเป็นเวอร์ชันเก่า — ถ้าบันทึกตอนนี้ข้อมูลบางส่วนจะหายหลังรีเฟรช จึงปิดการบันทึกไว้ก่อน · แก้: วาง Code.gs ใหม่ → Run <b>setup</b> → Deploy → Manage deployments → ✎ → <b>New version</b></div>' : '') +
      '<div class="avatar" title="' + esc(S.data.me) + '" style="width:40px;height:40px">' + esc(initials(S.data.me)) + '</div>' +
      '</div>' +
      '<div id="page"></div>' +
      '</main></div>' +
      '<nav class="bottom-nav">' + nav + '</nav>';

    $$('[data-nav]').forEach(function (b) {
      b.onclick = function () { if (b.dataset.nav === 'campaigns' && S.page === 'campaigns') S.campNav = null; go(b.dataset.nav); };
    });
    $$('[data-theme]').forEach(function (b) { b.onclick = function () { setTheme(b.dataset.theme); }; });
    if ($('#logout')) $('#logout').onclick = function () { API.token(null); boot(); };
    $('#globalSearch').onkeydown = function (e) {
      if (e.key === 'Enter') { S.chatFilter.q = this.value.trim(); go('chats'); }
    };
    if (S.page === 'chats') $('#globalSearch').oninput = function () { S.chatFilter.q = this.value.trim(); renderChatList(); };

    ({ dashboard: pageDashboard, chats: pageChats, campaigns: pageCampaigns, settings: pageSettings })[S.page]();
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

    // ---------- 2) Lead + ปิดได้ ตามเวลา ----------
    html += section('Lead และเคสที่ปิดได้ — แต่ละวัน', 'ดูว่าช่วงไหนคนทักเยอะ/น้อย และเพิ่มงบแล้ว Lead ขึ้นตามไหม',
      '<div class="tabs"><button data-ctab="day" class="' + (S.chartTab === 'day' ? 'on' : '') + '">รายวัน</button><button data-ctab="week" class="' + (S.chartTab === 'week' ? 'on' : '') + '">รายสัปดาห์</button></div>' +
      legend([['Lead', 'var(--primary)'], ['ปิดได้', 'var(--st-7)']]) + '<div class="chart-box" id="chLeads"></div>', 'full');
    var g = groupDaily(m.daily, S.chartTab);
    charts.push(['chLeads', { labels: g.labels, tips: g.tips, series: [{ name: 'Lead', color: 'var(--primary)', values: g.map('leads') }, { name: 'ปิดได้', color: 'var(--st-7)', values: g.map('closed') }], height: 340, showValues: S.chartTab === 'week', aria: 'Lead และเคสที่ปิดได้' }]);

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
    html += '<div class="grid row-2 mt">' +
      section('ลูกค้าหลุดตรงไหน (Funnel)', 'นับสะสม: คนที่ไปถึงขั้น 3 ถูกนับในขั้น 1–3 ด้วย · แถบแดง = ขั้นที่หลุดมากที่สุด',
        (m.leads ? Charts.hbars(funnelItems, { max: f1 }) + (leak ? '<div class="leak-note">หลุดมากสุดที่ขั้น ' + (leak.stage - 1) + '→' + leak.stage + ' (ผ่านแค่ ' + F.pct(leak.conv) + ') · ' + reason + '</div>' : '') : '<div class="empty">ยังไม่มีแชทในช่วงนี้</div>')) +
      section('ลูกค้าตอนนี้อยู่สถานะไหน', 'นับลูกค้าไม่ซ้ำ ' + m.people.length + ' คน · ใช้ดูว่าต้องตามแชทกลุ่มไหน',
        statusItems.length ? Charts.hbars(statusItems) : '<div class="empty">ยังไม่มีแชท</div>') + '</div>';

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
    S.drawCharts = function () { charts.forEach(function (c) { var el = document.getElementById(c[0]); if (el) Charts.columns(el, c[1]); }); };
    S.drawCharts();

    $$('[data-preset]').forEach(function (b) { b.onclick = function () { f.preset = b.dataset.preset; pageDashboard(); }; });
    if ($('#fFrom')) {
      $('#fFrom').onchange = function () { f.from = this.value; if (f.from > f.to) f.to = f.from; pageDashboard(); };
      $('#fTo').onchange = function () { f.to = this.value; if (f.to < f.from) f.from = f.to; pageDashboard(); };
    }
    $('#fCamp').onchange = function () { f.campaign = this.value; pageDashboard(); };
    $$('[data-ctab]').forEach(function (b) { b.onclick = function () { S.chartTab = b.dataset.ctab; pageDashboard(); }; });
    $('#btnSummary').onclick = function () { openSummary(m); };
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
  function adOptions(selected) {
    var byCamp = {};
    S.data.ads.forEach(function (a) {
      if (!isTrue(a.active) && a.ad_name !== selected) return;
      (byCamp[a.campaign || 'ไม่ระบุแคมเปญ'] = byCamp[a.campaign || 'ไม่ระบุแคมเปญ'] || []).push(a);
    });
    return '<option value="">— เลือกโฆษณา —</option>' + Object.keys(byCamp).sort().map(function (c) {
      return '<optgroup label="' + esc(c) + '">' + byCamp[c].map(function (a) { return opt(a.ad_name, a.ad_name, selected); }).join('') + '</optgroup>';
    }).join('');
  }

  function chatFormHtml(c, prefix) {
    c = c || {};
    return '<div class="form-grid">' +
      '<div class="f c3"><label for="' + prefix + 'Date">วันที่</label><input type="date" id="' + prefix + 'Date" value="' + esc(c.date || today()) + '" required></div>' +
      '<div class="f c4"><label for="' + prefix + 'Name">ชื่อลูกค้า</label><input id="' + prefix + 'Name" value="' + esc(c.customer || '') + '" autocomplete="off" placeholder="ชื่อในเฟส/ไลน์" required><div class="hint" id="' + prefix + 'Dup"></div></div>' +
      '<div class="f c5"><label for="' + prefix + 'Ad">โฆษณา</label><select id="' + prefix + 'Ad">' + adOptions(c.ad) + '</select><div class="ad-meta" id="' + prefix + 'AdMeta"></div></div>' +
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
      var ad = S.data.ads.filter(function (a) { return a.ad_name === $('#' + prefix + 'Ad', el).value; })[0];
      $('#' + prefix + 'AdMeta', el).textContent = ad ? 'Ad set: ' + ad.adset + ' · ' + ad.campaign : '';
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
      var ad = S.data.ads.filter(function (a) { return a.ad_name === $('#' + prefix + 'Ad', el).value; })[0];
      var hint = $('#' + prefix + 'Dup', el);
      if (!name) { hint.textContent = ''; return; }
      var hits = S.data.chats.filter(function (c) {
        return c.id !== state.id && String(c.customer).toLowerCase().replace(/[\s'’"`.]+/g, '') === name && (!ad || c.campaign === ad.campaign);
      });
      hint.className = 'hint' + (hits.length ? ' warn' : '');
      hint.textContent = hits.length ? '⚠️ ซ้ำ — มีแล้ว ' + hits.length + ' แถว (ล่าสุด ' + F.thDate(hits[hits.length - 1].date) + ' · ' + hits[hits.length - 1].status + ')' : '';
    }
    $('#' + prefix + 'Ad', el).onchange = function () { adMeta(); dup(); };
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
    var ad = S.data.ads.filter(function (a) { return a.ad_name === adName; })[0] || {};
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
      note: $('#' + prefix + 'Note', el).value.trim()
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
      '<form id="newChat">' + chatFormHtml({ date: newChatState.date, ad: newChatState.ad, status: newChatState.status }, 'n') +
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
        newChatState = { status: '', date: c.date, ad: c.ad }; // เก็บวันที่และโฆษณาไว้ กรอกคนต่อไปเร็วขึ้น
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
    var all = S.data.inbox || [];
    var pend = all.filter(function (r) { return r.status === 'pending'; }).sort(function (a, b) { return a.first_date < b.first_date ? 1 : -1; });
    var other = all.filter(function (r) { return r.status === 'other'; }).sort(function (a, b) { return a.last_date < b.last_date ? 1 : -1; });
    if (!pend.length && !other.length) { box.innerHTML = ''; return; }
    var lim = S.inboxLimit || 20;
    var activeAds = S.data.ads.filter(function (a) { return isTrue(a.active); });
    var html = '';
    if (pend.length) {
      html += '<div class="card inbox" style="margin-bottom:18px"><div class="card-head"><div><h2 class="card-title">ลูกค้าที่ทักมา รอเลือกโฆษณา (' + pend.length + ')</h2>' +
        '<div class="card-sub">ดึงจาก Inbox เพจอัตโนมัติ · Facebook ไม่บอกว่าแต่ละคนกดมาจากโฆษณาตัวไหน ระบบจึงแนะนำโฆษณาที่ได้แชทในวันนั้น (ตัวเลข = จำนวนแชทที่ Facebook นับ) · กดโฆษณาเพื่อย้ายเป็นแชท</div></div></div>' +
        '<div class="ib-list">' + pend.slice(0, lim).map(function (r) {
          var sug = String(r.suggest || '').split('|').filter(Boolean).map(function (x) { var i = x.lastIndexOf(':'); return { ad: x.slice(0, i), n: x.slice(i + 1) }; });
          var sugNames = sug.map(function (x) { return x.ad; });
          return '<div class="ib-row" data-psid="' + esc(r.psid) + '">' + face(r.name, r.pic, 44) +
            '<div class="ib-who"><b>' + esc(r.name) + '</b><span>ทักครั้งแรก ' + F.thDate(r.first_date, true) + (isTrue(r.approx) ? ' (อาจก่อนหน้านี้)' : '') + (r.first_text ? ' · “' + esc(r.first_text) + '”' : '') + '</span></div>' +
            '<div class="ib-act">' + sug.map(function (x) { return '<button class="chip ib-ad" data-ad="' + esc(x.ad) + '" title="' + esc(adCampaign(x.ad)) + '">' + esc(x.ad) + ' <em>' + esc(x.n) + '</em></button>'; }).join('') +
            '<select class="field-inline ib-sel"><option value="">' + (sug.length ? 'โฆษณาอื่น…' : 'เลือกโฆษณา…') + '</option>' + activeAds.filter(function (a) { return sugNames.indexOf(a.ad_name) < 0; }).map(function (a) { return opt(a.ad_name, a.ad_name + ' · ' + a.campaign); }).join('') + '</select>' +
            '<button class="btn ghost sm ib-other">ไม่ได้มาจากโฆษณา</button></div></div>';
        }).join('') + '</div>' + (pend.length > lim ? '<div class="actions" style="justify-content:center;margin-top:10px"><button class="btn ghost sm" id="ibMore">แสดงเพิ่ม (' + (pend.length - lim) + ')</button></div>' : '') + '</div>';
    }
    if (other.length) {
      html += '<details class="card ib-other-box" style="margin-bottom:18px"' + (S.otherOpen ? ' open' : '') + '><summary><b>ทักมาจากช่องทางอื่น (' + other.length + ')</b> <span class="muted">· ไม่ได้มาจากโฆษณา — เก็บไว้ดูเฉย ๆ ไม่นับใน Lead/ต้นทุน</span></summary>' +
        '<div class="ib-mini">' + other.slice(0, 200).map(function (r) {
          return '<div class="ib-m" data-psid="' + esc(r.psid) + '">' + face(r.name, r.pic, 32) + '<div><b>' + esc(r.name) + '</b><span>' + F.thDate(r.first_date) + (r.last_date && r.last_date !== r.first_date ? ' – ' + F.thDate(r.last_date) : '') + (r.first_text ? ' · ' + esc(r.first_text) : '') + '</span></div>' +
            '<button class="linkish ib-back">ย้ายไปรอเลือกโฆษณา</button></div>';
        }).join('') + '</div></details>';
    }
    box.innerHTML = html;
    function decide(psid, payload, msg) {
      var r = (S.data.inbox || []).filter(function (x) { return x.psid === psid; })[0];
      API.call('inboxDecide', Object.assign({ psid: psid }, payload)).then(function (res) {
        if (r) r.status = res.inbox.status;
        if (res.chat) S.data.chats.push(normalize({ chats: [res.chat], spend: [], budgets: [], campaigns: [] }).chats[0]);
        toast(msg); renderInbox(); renderChatList();
        var n = (S.data.inbox || []).filter(function (x) { return x.status === 'pending'; }).length;
        $$('[data-nav="chats"]').forEach(function (b) { var i = $('.nav-badge', b); if (n) { if (!i) { i = document.createElement('i'); i.className = 'nav-badge'; b.appendChild(i); } i.textContent = n; } else if (i) i.remove(); });
      }).catch(fail);
    }
    $$('.ib-row', box).forEach(function (row) {
      var psid = row.dataset.psid, name = $('.ib-who b', row).textContent;
      $$('.ib-ad', row).forEach(function (b) { b.onclick = function () { decide(psid, { ad: b.dataset.ad }, name + ' → ' + b.dataset.ad); }; });
      $('.ib-sel', row).onchange = function () { if (this.value) decide(psid, { ad: this.value }, name + ' → ' + this.value); };
      $('.ib-other', row).onclick = function () { decide(psid, { other: true }, name + ' → ช่องทางอื่น'); };
    });
    $$('.ib-back', box).forEach(function (b) { b.onclick = function () { S.otherOpen = true; decide(b.closest('.ib-m').dataset.psid, { pending: true }, 'ย้ายไปรอเลือกโฆษณาแล้ว'); }; });
    if ($('#ibMore')) $('#ibMore').onclick = function () { S.inboxLimit = lim + 50; renderInbox(); };
    var det = $('.ib-other-box', box); if (det) det.ontoggle = function () { S.otherOpen = det.open; };
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
    var st = { id: c.id, status: c.status, adset: c.adset, campaign: c.campaign };
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
      '<div class="muted small" style="margin-top:8px">ตั้งดึงอัตโนมัติทุก 1 ชั่วโมงด้วยการรัน installAutoSync() ใน Apps Script ครั้งเดียว · วันที่ Facebook มีตัวเลขแล้ว ระบบจะไม่นับค่า Ads ที่กรอกมือของวันนั้นซ้ำ</div></div>';
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
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (S.page === 'dashboard' && S.drawCharts) S.drawCharts(); }, 150); });
  boot();
})();
