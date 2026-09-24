/**
 * App — หน้าจอทั้งหมด (Dashboard / บันทึกแชท / ค่า Ads / ตั้งค่า)
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
    { id: 'dashboard', label: 'Dashboard', icon: I.dash },
    { id: 'chats', label: 'บันทึกแชท', icon: I.chat },
    { id: 'spend', label: 'ค่า Ads', icon: I.money },
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
  function campaigns() {
    var set = {};
    S.data.ads.forEach(function (a) { if (a.campaign) set[a.campaign] = true; });
    S.data.chats.forEach(function (c) { if (c.campaign) set[c.campaign] = true; });
    return Object.keys(set).sort();
  }
  function adsets() {
    var set = {};
    S.data.ads.forEach(function (a) { if (a.adset) set[a.adset] = true; });
    return Object.keys(set).sort();
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
      S.data = d;
      var hash = location.hash.replace('#', '');
      if (NAV.some(function (n) { return n.id === hash; })) S.page = hash;
      render();
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
      '<div class="muted" style="font-size:12px">ลืม PIN ให้คนที่เข้าระบบได้ไปตั้งใหม่ที่หน้า ตั้งค่า</div>' +
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
      return '<button data-nav="' + n.id + '" class="' + (S.page === n.id ? 'active' : '') + '">' + n.icon + '<span>' + n.label + '</span></button>';
    }).join('');
    var title = NAV.filter(function (n) { return n.id === S.page; })[0].label;
    root.innerHTML =
      '<div class="app">' +
      '<aside class="sidebar">' +
      '<div class="brand"><div class="brand-mark">B</div><div class="brand-name">' + esc(S.data.config.brand || window.APP_CONFIG.BRAND) + ' <span>Ads</span></div></div>' +
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
      '<div class="avatar" title="' + esc(S.data.me) + '" style="width:40px;height:40px">' + esc(initials(S.data.me)) + '</div>' +
      '</div>' +
      '<div id="page"></div>' +
      '</main></div>' +
      '<nav class="bottom-nav">' + nav + '</nav>';

    $$('[data-nav]').forEach(function (b) { b.onclick = function () { go(b.dataset.nav); }; });
    $$('[data-theme]').forEach(function (b) { b.onclick = function () { setTheme(b.dataset.theme); }; });
    if ($('#logout')) $('#logout').onclick = function () { API.token(null); boot(); };
    $('#globalSearch').onkeydown = function (e) {
      if (e.key === 'Enter') { S.chatFilter.q = this.value.trim(); go('chats'); }
    };
    if (S.page === 'chats') $('#globalSearch').oninput = function () { S.chatFilter.q = this.value.trim(); renderChatList(); };

    ({ dashboard: pageDashboard, chats: pageChats, spend: pageSpend, settings: pageSettings })[S.page]();
  }

  function go(page) {
    S.page = page;
    try { history.replaceState(null, '', '#' + page); } catch (e) {}
    render();
    window.scrollTo(0, 0);
  }

  function refresh() {
    return API.call('bootstrap').then(function (d) { S.data = d; });
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
    var presets = [['7d', '7 วัน'], ['30d', '30 วัน'], ['month', 'เดือนนี้'], ['lastmonth', 'เดือนก่อน'], ['all', 'ทั้งหมด'], ['custom', 'กำหนดเอง']];

    var html = '<div class="filters">' +
      '<div class="chip-group" role="group" aria-label="ช่วงวันที่">' + presets.map(function (p) {
        return '<button data-preset="' + p[0] + '" class="' + (f.preset === p[0] ? 'on' : '') + '">' + p[1] + '</button>';
      }).join('') + '</div>' +
      (f.preset === 'custom' ? '<input type="date" class="field-inline" id="fFrom" value="' + f.from + '"><input type="date" class="field-inline" id="fTo" value="' + f.to + '">' : '<span class="muted" style="font-size:13px">' + F.thRange(f.from, f.to) + '</span>') +
      '<select class="field-inline" id="fCamp">' + opt('', 'ทุกแคมเปญ', f.campaign) + campaigns().map(function (c) { return opt(c, c, f.campaign); }).join('') + '</select>' +
      '<span style="flex:1"></span>' +
      '<button class="btn" id="btnSummary">' + I.copy + 'คัดลอกสรุป</button>' +
      '</div>';

    if (!m.spend) html += '<div class="leak-note" style="margin:0 0 20px;background:var(--warn-bg);color:var(--warn)">ยังไม่มีค่า Ads ในช่วงนี้ — ต้นทุน/Lead และต้นทุน/เคส จะยังคำนวณไม่ได้ (ไปกรอกที่หน้า ค่า Ads)</div>';

    // --- KPI cards
    var got2 = m.funnel[1].n, reached3 = m.funnel[2].n, reached4 = m.funnel[3].n;
    var cpcRatio = m.cpc == null ? 0 : m.cpc / m.target;
    var cpcColor = m.cpc == null ? 'var(--line)' : cpcRatio <= 1 ? 'var(--good)' : cpcRatio <= 1.5 ? 'var(--st-3)' : 'var(--bad)';
    html += '<div class="grid kpis">' +
      kpiCard(I.users, 'var(--primary-soft)', 'var(--primary)', F.int(m.leads), 'Lead (ไม่นับซ้ำ)',
        CH.ring(m.leads ? got2 / m.leads : 0, 'var(--primary)', { tip: '<b>ได้ข้อมูลเครื่อง</b><br>' + got2 + ' จาก ' + m.leads + ' คน' }),
        m.dupRows ? 'ตัดแชทซ้ำ ' + m.dupRows + ' แถว' : 'วงแหวน = ได้ข้อมูลเครื่อง') +
      kpiCard(I.check, 'var(--good-bg)', 'var(--good)', F.int(m.closed), 'ปิดการขาย',
        CH.ring(m.closeRate, 'var(--good)', { label: F.pct(m.closeRate, 1), fontSize: 12, tip: '<b>อัตราปิด</b><br>' + m.closed + ' จาก ' + m.leads + ' Lead' }),
        'Lead ฝั่งขาย ' + m.salesLeads + ' คน') +
      kpiCard(I.coin, 'var(--warn-bg)', 'var(--warn)', F.baht(m.cpc), 'ต้นทุน/เคส',
        CH.ring(Math.min(cpcRatio, 1), cpcColor, { label: m.cpc == null ? '–' : Math.round(cpcRatio * 100) + '%', tip: '<b>เทียบเป้า</b><br>ต้นทุน/เคส ' + F.baht(m.cpc) + ' จากเป้า ' + F.baht(m.target) }),
        'เป้า ' + F.baht(m.target)) +
      '<div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
      '<ul class="legend-list">' +
      '<li><span class="dot" style="background:var(--st-1)"></span>ยังไม่ถึงประเมิน <b>' + (m.leads - reached3) + '</b></li>' +
      '<li><span class="dot" style="background:var(--st-3)"></span>ประเมินแล้ว <b>' + (reached3 - reached4) + '</b></li>' +
      '<li><span class="dot" style="background:var(--st-4)"></span>นัด/ปิดแล้ว <b>' + reached4 + '</b></li></ul>' +
      CH.segRing([
        { value: m.leads - reached3, color: 'var(--st-1)', label: 'ยังไม่ถึงประเมิน' },
        { value: reached3 - reached4, color: 'var(--st-3)', label: 'ประเมินแล้ว ยังไม่นัด' },
        { value: reached4, color: 'var(--st-4)', label: 'นัด/ปิดแล้ว' }
      ], { label: F.pct(m.quoteRate) }) + '</div>' +
      '</div>';

    // --- Tiles + Status
    var d = m.daily;
    var cplDaily = d.map(function (x) { return x.leads ? x.spend / x.leads : 0; });
    var cum = 0, cumAmt = 0;
    var adsPctDaily = d.map(function (x) { cum += x.spend; cumAmt += x.amount; return cumAmt ? cum / cumAmt : 0; });
    html += '<div class="grid row-2-wide mt">' +
      '<div class="card tiles-card"><div class="grid tiles">' +
      tile('blue', F.baht(m.spend), 'ค่า Ads รวม', 'เฉลี่ย ' + F.baht(m.avgPerDay) + '/วัน', d.map(function (x) { return x.spend; })) +
      tile('violet', F.baht(m.amount), 'ยอดรับซื้อรวม', m.closed + ' เคส', d.map(function (x) { return x.amount; })) +
      tile('red', F.baht(m.cpl), 'ต้นทุน/Lead', m.leads + ' Lead', cplDaily) +
      tile('orange', F.pct(m.adsPct, 1), 'ค่า Ads ต่อยอดรับซื้อ', 'ยิ่งต่ำยิ่งดี', adsPctDaily) +
      '</div></div>' +
      '<div class="card"><div class="card-head"><div><h2 class="card-title">สถานะลูกค้า</h2><div class="card-sub">นับลูกค้าไม่ซ้ำ ' + m.people.length + ' คน</div></div></div>' +
      '<div class="split"><div class="table-wrap"><table class="t"><thead><tr><th>สถานะ</th><th class="r">คน</th><th class="r">%</th></tr></thead><tbody>' +
      m.statusCounts.map(function (s) {
        return '<tr><td><div class="name-cell"><span class="dot" style="background:' + s.color + '"></span>' + esc(s.key) + '</div></td><td class="r num">' + s.n + '</td><td class="r num muted">' + F.pct(s.pct, 1) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div>' + CH.donut(m.statusCounts.map(function (s) { return { value: s.n, color: s.color, label: s.key }; }), { size: 220, center: F.int(m.people.length), sub: 'ลูกค้า' }) + '</div></div></div>' +
      '</div>';

    // --- Bars + Funnel
    html += '<div class="grid row-2 mt">' +
      '<div class="card"><div class="card-head"><h2 class="card-title">Lead vs ปิดได้</h2></div>' +
      '<div class="tabs"><button data-ctab="day" class="' + (S.chartTab === 'day' ? 'on' : '') + '">รายวัน</button><button data-ctab="week" class="' + (S.chartTab === 'week' ? 'on' : '') + '">รายสัปดาห์</button></div>' +
      '<div class="chart-legend"><span><i style="background:var(--primary)"></i>Lead</span><span><i style="background:var(--st-7)"></i>ปิดได้</span></div>' +
      barChart(m) + '</div>' +
      '<div class="card"><div class="card-head"><div><h2 class="card-title">Funnel รับซื้อ</h2><div class="card-sub">นับแบบสะสม · ไม่รวมสถานะ 6 (ฝั่งขาย)</div></div></div>' +
      funnelHtml(m) + '</div>' +
      '</div>';

    // --- Ad set table
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ผลตาม Ad set</h2><div class="card-sub">เป้าต้นทุน/เคส ' + F.baht(m.target) + ' · แก้ได้ที่หน้า ตั้งค่า</div></div></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th>Ad set</th><th class="r">ใช้จ่าย</th><th class="r">Lead</th><th class="r">ต้นทุน/Lead</th><th class="r">ปิดได้</th><th class="r">ยอดรับซื้อ</th><th class="r">ต้นทุน/เคส</th><th>ควรทำอะไร</th></tr></thead><tbody>' +
      (m.adsetRows.length ? m.adsetRows.map(function (r) {
        return '<tr><td><div>' + esc(r.adset) + '</div><div class="muted" style="font-size:11.5px">' + esc(r.campaign) + '</div></td>' +
          '<td class="r num">' + F.baht(r.spend) + '</td><td class="r num">' + r.leads + '</td><td class="r num">' + F.baht(r.cpl) + '</td>' +
          '<td class="r num">' + r.closed + '</td><td class="r num">' + F.baht(r.amount) + '</td><td class="r num">' + F.baht(r.cpc) + '</td>' +
          '<td><span class="pill ' + r.action.tone + '">' + esc(r.action.text) + '</span></td></tr>';
      }).join('') : '<tr><td colspan="8" class="empty">ไม่มีข้อมูลในช่วงนี้</td></tr>') +
      '</tbody><tfoot><tr><td>รวม</td><td class="r num">' + F.baht(m.spend) + '</td><td class="r num">' + m.leads + '</td><td class="r num">' + F.baht(m.cpl) + '</td><td class="r num">' + m.closed + '</td><td class="r num">' + F.baht(m.amount) + '</td><td class="r num">' + F.baht(m.cpc) + '</td><td></td></tr></tfoot></table></div></div>';

    // --- Ad quality
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">โฆษณาตัวไหนดึงคนคุณภาพ</h2><div class="card-sub">คุณภาพ = ส่งข้อมูลเครื่องมา (ขั้น 2 ขึ้นไป ไม่นับของไม่ตรง) · ต้องมีอย่างน้อย 5 แชทถึงจะตัดสิน</div></div></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th>โฆษณา</th><th>Ad set</th><th class="r">แชท</th><th class="r">ได้ข้อมูลเครื่อง</th><th class="r">% คุณภาพ</th><th class="r">ปิดได้</th><th>ผล</th></tr></thead><tbody>' +
      (m.adRows.length ? m.adRows.map(function (r) {
        return '<tr><td>' + esc(r.ad) + '</td><td class="muted">' + esc(r.adset || '') + '</td><td class="r num">' + r.chats + '</td><td class="r num">' + r.quality + '</td>' +
          '<td class="r num">' + F.pct(r.qualityPct) + '</td><td class="r num">' + r.closed + '</td><td><span class="pill ' + r.verdict.tone + '">' + r.verdict.text + '</span></td></tr>';
      }).join('') : '<tr><td colspan="7" class="empty">ไม่มีข้อมูลในช่วงนี้</td></tr>') +
      '</tbody></table></div></div>';

    $('#page').innerHTML = html;

    $$('[data-preset]').forEach(function (b) { b.onclick = function () { f.preset = b.dataset.preset; pageDashboard(); }; });
    if ($('#fFrom')) {
      $('#fFrom').onchange = function () { f.from = this.value; if (f.from > f.to) f.to = f.from; pageDashboard(); };
      $('#fTo').onchange = function () { f.to = this.value; if (f.to < f.from) f.from = f.to; pageDashboard(); };
    }
    $('#fCamp').onchange = function () { f.campaign = this.value; pageDashboard(); };
    $$('[data-ctab]').forEach(function (b) { b.onclick = function () { S.chartTab = b.dataset.ctab; pageDashboard(); }; });
    $('#btnSummary').onclick = function () { openSummary(m); };
  }

  function kpiCard(icon, bg, fg, value, label, ringSvg, note) {
    return '<div class="card"><div class="kpi"><div>' +
      '<div class="kpi-icon" style="background:' + bg + ';color:' + fg + '">' + icon + '</div>' +
      '<div class="kpi-value num">' + value + '</div><div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-note">' + esc(note || '') + '</div></div>' + ringSvg + '</div></div>';
  }

  function tile(color, value, label, sub, series) {
    return '<div class="tile ' + color + '"><div class="tile-value num">' + value + '</div><div class="tile-label">' + label + '</div>' +
      '<div class="tile-sub">' + esc(sub) + '</div>' + CH.wave(series) + '</div>';
  }

  function barChart(m) {
    var rows;
    if (S.chartTab === 'week') {
      rows = [];
      m.daily.forEach(function (d, i) {
        var w = Math.floor(i / 7);
        if (!rows[w]) rows[w] = { label: F.thDate(d.date), tipLabel: 'สัปดาห์เริ่ม ' + F.thDate(d.date, true), leads: 0, closed: 0 };
        rows[w].leads += d.leads; rows[w].closed += d.closed;
      });
    } else {
      rows = m.daily.map(function (d) { return { label: String(Number(d.date.slice(8))), tipLabel: F.thDate(d.date, true), leads: d.leads, closed: d.closed }; });
    }
    if (!rows.length) return '<div class="empty">ไม่มีข้อมูล</div>';
    return CH.bars(rows, [
      { key: 'leads', label: 'Lead', color: 'var(--primary)' },
      { key: 'closed', label: 'ปิดได้', color: 'var(--st-7)' }
    ], { aria: 'Lead และเคสที่ปิดได้ ' + (S.chartTab === 'week' ? 'รายสัปดาห์' : 'รายวัน'), maxLabels: S.chartTab === 'week' ? 12 : 16 });
  }

  function funnelHtml(m) {
    var html = '<div class="funnel">' + m.funnel.map(function (f, i) {
      var isLeak = m.leak && m.leak.stage === f.stage;
      return '<div class="fstep"><div class="fnum num">' + f.n + '</div><div class="fname">' + (i + 1) + ' · ' + f.name + '</div>' +
        '<span class="fpill">' + F.pct(f.pct) + '</span>' +
        '<div class="fbar"><i style="width:' + (f.pct * 100).toFixed(1) + '%"></i></div>' +
        '<div class="fdrop' + (isLeak ? ' leak' : '') + '">' + (i === 0 ? 'จุดเริ่ม' : 'ผ่าน ' + F.pct(f.conv)) + '</div></div>';
    }).join('') + '</div>';
    if (!m.leads) return html + '<div class="empty">ยังไม่มีแชทในช่วงนี้</div>';
    var leak = m.leak;
    var reason = !leak ? '' : leak.stage === 2 ? 'ทักแล้วไม่ส่งข้อมูลเครื่อง — ดูสคริปต์ตอบแชท/ความเร็วตอบ'
      : leak.stage === 3 ? 'ได้ข้อมูลแล้วยังไม่ได้ประเมินราคา — ตามแชทให้ครบ'
      : leak.stage === 4 ? 'ประเมินราคาแล้วไม่ไปต่อ = ปัญหาอยู่ที่ราคา ไม่ใช่โฆษณา'
      : 'นัดแล้วไม่ปิด — ดูขั้นตอนรับของ/ตรวจเครื่อง';
    html += leak ? '<div class="leak-note">จุดรั่วอยู่ที่ขั้น ' + (leak.stage - 1) + '→' + leak.stage + ' (ผ่าน ' + F.pct(leak.conv) + ') · ' + reason + '</div>' : '';
    return html;
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
      '<div class="f c5 closeOnly"><label for="' + prefix + 'Product">สินค้า</label><input id="' + prefix + 'Product" value="' + esc(c.product || '') + '" placeholder="เช่น iPhone 14 Pro 256GB"></div>' +
      '<div class="f c3 closeOnly"><label for="' + prefix + 'Amount">ยอดรับซื้อ (บาท)</label><input id="' + prefix + 'Amount" type="number" min="0" step="1" inputmode="numeric" value="' + esc(c.amount || '') + '"></div>' +
      '<div class="f c4"><label for="' + prefix + 'Note">หมายเหตุ</label><input id="' + prefix + 'Note" value="' + esc(c.note || '') + '"></div>' +
      '</div>';
  }

  function wireChatForm(el, prefix, state) {
    function adMeta() {
      var ad = S.data.ads.filter(function (a) { return a.ad_name === $('#' + prefix + 'Ad', el).value; })[0];
      $('#' + prefix + 'AdMeta', el).textContent = ad ? 'Ad set: ' + ad.adset + ' · ' + ad.campaign : '';
    }
    function closeFields() {
      var show = state.status === '5-ปิดการขาย' || state.status === '4-นัดรับของ';
      $$('.closeOnly', el).forEach(function (x) { x.style.display = show ? '' : 'none'; });
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
    $('#' + prefix + 'Name', el).oninput = dup;
    $$('#' + prefix + 'Status button', el).forEach(function (b) {
      b.onclick = function () {
        state.status = b.dataset.st;
        $$('#' + prefix + 'Status button', el).forEach(function (x) { x.classList.toggle('on', x === b); });
        closeFields();
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
      product: showClose ? $('#' + prefix + 'Product', el).value.trim() : '',
      amount: showClose ? $('#' + prefix + 'Amount', el).value : '',
      note: $('#' + prefix + 'Note', el).value.trim()
    };
  }

  function validateChat(c) {
    if (!c.customer) return 'ต้องใส่ชื่อลูกค้า';
    if (!c.ad) return 'ต้องเลือกโฆษณา';
    if (!c.status) return 'ต้องเลือกสถานะ';
    if (c.status === '5-ปิดการขาย' && !(Number(c.amount) > 0)) return 'เคสปิดการขายต้องใส่ยอดรับซื้อ';
    return '';
  }

  var newChatState = { status: '' };
  function pageChats() {
    var cf = S.chatFilter;
    var html = '<div class="card"><div class="card-head"><div><h2 class="card-title">บันทึกแชทใหม่</h2><div class="card-sub">เลือกโฆษณาแล้ว Ad set กับแคมเปญเติมให้เอง · กด Enter เพื่อบันทึก</div></div></div>' +
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
    renderChatList();
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
          '<td>' + esc(c.customer) + (dups[c.id] ? ' <span class="dup">⚠️ ซ้ำ</span>' : '') + '</td>' +
          '<td><div>' + esc(c.ad || '-') + '</div><div class="muted" style="font-size:11.5px">' + esc(c.adset || '') + '</div></td>' +
          '<td>' + statusPill(c.status) + '</td><td>' + esc(c.product || '') + '</td>' +
          '<td class="r num">' + (c.amount ? F.baht(Number(c.amount)) : '') + '</td><td class="muted">' + esc(c.updated_by || c.created_by || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (list.length > lim ? '<div class="actions" style="justify-content:center;margin-top:12px"><button class="btn ghost sm" id="more">แสดงเพิ่ม (' + (list.length - lim) + ')</button></div>' : '');
    $$('tr[data-id]', box).forEach(function (tr) { tr.onclick = function () { editChat(tr.dataset.id); }; });
    if ($('#more')) $('#more').onclick = function () { S.chatFilter.limit += 200; renderChatList(); };
  }

  function editChat(id) {
    var c = S.data.chats.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var st = { id: c.id, status: c.status, adset: c.adset, campaign: c.campaign };
    modal('<h3>แก้ไขแชท</h3><form id="editChat">' + chatFormHtml(c, 'e') +
      '<div class="muted" style="font-size:12px;margin-top:12px">บันทึกโดย ' + esc(c.created_by || '-') + (c.updated_by ? ' · แก้ล่าสุดโดย ' + esc(c.updated_by) : '') + '</div>' +
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
            close(); toast('บันทึกแล้ว'); renderChatList();
          }).catch(fail);
        };
        $('#delChat', el).onclick = function () {
          if (!window.confirm('ลบแชทของ ' + c.customer + ' ?')) return;
          API.call('deleteChat', { id: c.id }).then(function () {
            S.data.chats = S.data.chats.filter(function (x) { return x.id !== c.id; });
            close(); toast('ลบแล้ว'); renderChatList();
          }).catch(fail);
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
  // Spend
  // ============================================================
  function pageSpend() {
    var sp = S.data.spend;
    var months = {};
    sp.forEach(function (s) { months[s.date.slice(0, 7)] = true; });
    var mList = Object.keys(months).sort().slice(-4);
    var pivot = {};
    sp.forEach(function (s) {
      var m = s.date.slice(0, 7);
      var r = pivot[s.adset] = pivot[s.adset] || { total: 0 };
      r[m] = (r[m] || 0) + Number(s.amount || 0);
      r.total += Number(s.amount || 0);
    });
    var TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    function mLabel(m) { return TH_M[Number(m.slice(5)) - 1] + ' ' + m.slice(2, 4); }

    var html = '<div class="card"><div class="card-head"><div><h2 class="card-title">กรอกค่า Ads</h2><div class="card-sub">กรอกรายวัน หรือยอดทั้งเดือนก้อนเดียว (ลงวันที่ 1 ของเดือน) ก็ได้ · ดูยอดใน Ads Manager</div></div></div>' +
      '<form id="spForm" class="form-grid">' +
      '<div class="f c3"><label for="spDate">วันที่</label><input type="date" id="spDate" value="' + today() + '" required></div>' +
      '<div class="f c4"><label for="spAdset">Ad set</label><select id="spAdset" required><option value="">— เลือก Ad set —</option>' + adsets().map(function (a) { return opt(a, a); }).join('') + '</select></div>' +
      '<div class="f c2"><label for="spAmt">ยอด (บาท)</label><input type="number" id="spAmt" min="0" step="1" inputmode="numeric" required></div>' +
      '<div class="f c3"><label for="spNote">หมายเหตุ</label><input id="spNote" placeholder="เช่น ยอดทั้งเดือน"></div>' +
      '<div class="c12 actions"><button class="btn" type="submit">บันทึก</button></div></form></div>';

    html += '<div class="card mt"><div class="card-head"><h2 class="card-title">รวมตามเดือน × Ad set</h2></div><div class="table-wrap"><table class="t"><thead><tr><th>Ad set</th>' +
      mList.map(function (m) { return '<th class="r">' + mLabel(m) + '</th>'; }).join('') + '<th class="r">รวมทั้งหมด</th></tr></thead><tbody>' +
      (Object.keys(pivot).length ? Object.keys(pivot).sort().map(function (a) {
        return '<tr><td>' + esc(a) + '</td>' + mList.map(function (m) { return '<td class="r num">' + (pivot[a][m] ? F.baht(pivot[a][m]) : '<span class="muted">–</span>') + '</td>'; }).join('') +
          '<td class="r num"><b>' + F.baht(pivot[a].total) + '</b></td></tr>';
      }).join('') : '<tr><td colspan="' + (mList.length + 2) + '" class="empty">ยังไม่มีค่า Ads</td></tr>') + '</tbody></table></div></div>';

    var recent = sp.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 60);
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">รายการล่าสุด</h2><div class="card-sub">กดแถวเพื่อแก้หรือลบ</div></div></div><div class="table-wrap"><table class="t"><thead><tr><th>วันที่</th><th>Ad set</th><th class="r">ยอด</th><th>หมายเหตุ</th><th>บันทึกโดย</th></tr></thead><tbody>' +
      (recent.length ? recent.map(function (s) {
        return '<tr class="click" data-sid="' + esc(s.id) + '"><td class="num">' + F.thDate(s.date, true) + '</td><td>' + esc(s.adset) + '</td><td class="r num">' + F.baht(Number(s.amount)) + '</td><td class="muted">' + esc(s.note || '') + '</td><td class="muted">' + esc(s.created_by || '') + '</td></tr>';
      }).join('') : '<tr><td colspan="5" class="empty">ยังไม่มีรายการ</td></tr>') + '</tbody></table></div></div>';
    $('#page').innerHTML = html;

    $('#spForm').onsubmit = function (e) {
      e.preventDefault();
      var rec = { date: $('#spDate').value, adset: $('#spAdset').value, amount: $('#spAmt').value, note: $('#spNote').value.trim() };
      if (!rec.adset) return toast('ต้องเลือก Ad set', true);
      API.call('saveSpend', { spend: rec }).then(function (saved) {
        S.data.spend.push(saved); toast('บันทึกค่า Ads แล้ว'); pageSpend();
      }).catch(fail);
    };
    $$('tr[data-sid]').forEach(function (tr) { tr.onclick = function () { editSpend(tr.dataset.sid); }; });
  }

  function editSpend(id) {
    var s = S.data.spend.filter(function (x) { return x.id === id; })[0];
    modal('<h3>แก้ไขค่า Ads</h3><form id="esForm" class="form-grid">' +
      '<div class="f c6"><label>วันที่</label><input type="date" id="esDate" value="' + esc(s.date) + '"></div>' +
      '<div class="f c6"><label>ยอด (บาท)</label><input type="number" id="esAmt" value="' + esc(s.amount) + '"></div>' +
      '<div class="f c12"><label>Ad set</label><select id="esAdset">' + adsets().map(function (a) { return opt(a, a, s.adset); }).join('') + '</select></div>' +
      '<div class="f c12"><label>หมายเหตุ</label><input id="esNote" value="' + esc(s.note || '') + '"></div>' +
      '<div class="c12 actions" style="justify-content:space-between"><button type="button" class="btn danger" id="esDel">ลบ</button><span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#esForm', el).onsubmit = function (e) {
          e.preventDefault();
          API.call('saveSpend', { spend: { id: s.id, date: $('#esDate', el).value, adset: $('#esAdset', el).value, amount: $('#esAmt', el).value, note: $('#esNote', el).value } })
            .then(function (saved) { Object.assign(s, saved); close(); toast('บันทึกแล้ว'); pageSpend(); }).catch(fail);
        };
        $('#esDel', el).onclick = function () {
          if (!window.confirm('ลบรายการนี้?')) return;
          API.call('deleteSpend', { id: s.id }).then(function () {
            S.data.spend = S.data.spend.filter(function (x) { return x.id !== s.id; }); close(); toast('ลบแล้ว'); pageSpend();
          }).catch(fail);
        };
      });
  }

  // ============================================================
  // Settings
  // ============================================================
  function pageSettings() {
    var ads = S.data.ads.slice().sort(function (a, b) { return (a.campaign + a.adset + a.ad_name).localeCompare(b.campaign + b.adset + b.ad_name, 'th'); });
    var html = '<div class="card"><div class="card-head"><div><h2 class="card-title">โฆษณา</h2><div class="card-sub">1 แถว = 1 ตัวโฆษณา · Ad set เดียวมีหลายโฆษณาได้ · ชื่อโฆษณาห้ามซ้ำ · ปิดแล้วจะไม่โผล่ในหน้าบันทึกแชท</div></div>' +
      '<button class="btn sm" id="addAd">+ เพิ่มโฆษณา</button></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th></th><th>ชื่อโฆษณา</th><th>Ad set</th><th>แคมเปญ</th><th>โพสต์</th><th>สถานะ</th></tr></thead><tbody>' +
      (ads.length ? ads.map(function (a) {
        return '<tr class="click" data-aid="' + esc(a.id) + '"><td>' + (a.creative_url ? '<img class="thumb" src="' + esc(a.creative_url) + '" alt="" loading="lazy">' : '<div class="thumb"></div>') + '</td>' +
          '<td>' + esc(a.ad_name) + '</td><td>' + esc(a.adset) + '</td><td class="muted">' + esc(a.campaign) + '</td>' +
          '<td>' + (a.post_url ? '<a href="' + esc(a.post_url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + I.link + '</a>' : '<span class="muted">–</span>') + '</td>' +
          '<td>' + (isTrue(a.active) ? '<span class="pill good">กำลังยิง</span>' : '<span class="pill">ปิดแล้ว</span>') + '</td></tr>';
      }).join('') : '<tr><td colspan="6" class="empty">ยังไม่มีโฆษณา</td></tr>') + '</tbody></table></div></div>';

    html += '<div class="grid row-2 mt">' +
      '<div class="card"><h2 class="card-title" style="margin-bottom:14px">เป้าหมาย</h2><form id="cfgForm" class="form-grid">' +
      '<div class="f c8"><label for="cfgTarget">เป้าต้นทุน/เคส (บาท)</label><input type="number" id="cfgTarget" min="1" value="' + esc(S.data.config.target_cost_per_case) + '"><div class="hint">ใช้ตัดสิน "ควรทำอะไร" ในตาราง Ad set</div></div>' +
      '<div class="f c4" style="align-self:start;padding-top:25px"><button class="btn" type="submit">บันทึก</button></div></form></div>' +
      '<div class="card"><div class="card-head"><h2 class="card-title">ผู้ใช้</h2><button class="btn sm" id="addUser">+ เพิ่มผู้ใช้</button></div>' +
      '<table class="t"><tbody>' + S.data.users.map(function (u) {
        return '<tr><td><div class="name-cell"><div class="avatar" style="width:32px;height:32px;font-size:12px;box-shadow:none">' + esc(initials(u.name)) + '</div>' + esc(u.name) + '</div></td>' +
          '<td>' + (u.active ? '<span class="pill good">ใช้งาน</span>' : '<span class="pill">ปิด</span>') + '</td>' +
          '<td class="r"><button class="btn ghost sm" data-user="' + esc(u.name) + '">แก้</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';

    if (API.isDemo) {
      html += '<div class="card mt"><h2 class="card-title">โหมดตัวอย่าง</h2><p class="muted">ตอนนี้ยังไม่ได้ใส่ API_URL ใน assets/js/config.js — ข้อมูลทั้งหมดเป็นข้อมูลจำลองที่เก็บในเบราว์เซอร์นี้เท่านั้น</p>' +
        '<button class="btn ghost" id="resetDemo">รีเซ็ตข้อมูลตัวอย่าง</button></div>';
    }
    $('#page').innerHTML = html;

    $('#addAd').onclick = function () { editAd(null); };
    $$('tr[data-aid]').forEach(function (tr) { tr.onclick = function () { editAd(tr.dataset.aid); }; });
    $('#cfgForm').onsubmit = function (e) {
      e.preventDefault();
      var v = Number($('#cfgTarget').value);
      if (!(v > 0)) return toast('ใส่ตัวเลขมากกว่า 0', true);
      API.call('saveConfig', { key: 'target_cost_per_case', value: v }).then(function () { S.data.config.target_cost_per_case = v; toast('บันทึกเป้าแล้ว'); }).catch(fail);
    };
    $('#addUser').onclick = function () { editUser(null); };
    $$('[data-user]').forEach(function (b) { b.onclick = function () { editUser(b.dataset.user); }; });
    if ($('#resetDemo')) $('#resetDemo').onclick = function () { API.resetDemo(); boot(); toast('รีเซ็ตแล้ว'); };
  }

  function editAd(id) {
    var a = id ? S.data.ads.filter(function (x) { return x.id === id; })[0] : { active: true };
    var used = id ? S.data.chats.filter(function (c) { return c.ad === a.ad_name; }).length : 0;
    var campList = campaigns(), asList = adsets();
    modal('<h3>' + (id ? 'แก้ไขโฆษณา' : 'เพิ่มโฆษณา') + '</h3><form id="adForm" class="form-grid">' +
      '<div class="f c12"><label>ชื่อโฆษณา (ที่จะเลือกตอนบันทึกแชท)</label><input id="adName" value="' + esc(a.ad_name || '') + '" required' + (used ? ' readonly' : '') + '>' +
      (used ? '<div class="hint">มีแชทใช้ชื่อนี้อยู่ ' + used + ' แถว — เปลี่ยนชื่อไม่ได้ ถ้าจะเลิกใช้ให้ปิดแทน</div>' : '') + '</div>' +
      '<div class="f c6"><label>Ad set</label><input id="adSet" list="dlAdset" value="' + esc(a.adset || '') + '" required></div>' +
      '<div class="f c6"><label>แคมเปญ</label><input id="adCamp" list="dlCamp" value="' + esc(a.campaign || '') + '"></div>' +
      '<div class="f c12"><label>ลิงก์โพสต์ที่บูสต์</label><input id="adPost" type="url" value="' + esc(a.post_url || '') + '" placeholder="https://www.facebook.com/..."></div>' +
      '<div class="f c12"><label>ลิงก์รูปครีเอทีฟ</label><input id="adImg" type="url" value="' + esc(a.creative_url || '') + '" placeholder="ลิงก์รูป (Google Drive แบบแชร์ หรือ URL รูป)"></div>' +
      '<div class="f c12"><label>หมายเหตุ</label><input id="adNote" value="' + esc(a.note || '') + '"></div>' +
      '<div class="f c12"><label><input type="checkbox" id="adActive"' + (isTrue(a.active) ? ' checked' : '') + ' style="width:auto;margin-right:8px">กำลังยิงอยู่ (โผล่ในหน้าบันทึกแชท)</label></div>' +
      '<datalist id="dlAdset">' + asList.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<datalist id="dlCamp">' + campList.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (id && !used ? '<button type="button" class="btn danger" id="adDel">ลบ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#adForm', el).onsubmit = function (e) {
          e.preventDefault();
          var rec = { id: a.id || '', ad_name: $('#adName', el).value.trim(), adset: $('#adSet', el).value.trim(), campaign: $('#adCamp', el).value.trim(),
            post_url: $('#adPost', el).value.trim(), creative_url: driveImg($('#adImg', el).value.trim()), note: $('#adNote', el).value.trim(), active: $('#adActive', el).checked };
          API.call('saveAd', { ad: rec }).then(function (saved) {
            var i = S.data.ads.findIndex(function (x) { return x.id === saved.id; });
            if (i >= 0) S.data.ads[i] = saved; else S.data.ads.push(saved);
            close(); toast('บันทึกโฆษณาแล้ว'); pageSettings();
          }).catch(fail);
        };
        if ($('#adDel', el)) $('#adDel', el).onclick = function () {
          if (!window.confirm('ลบโฆษณานี้?')) return;
          API.call('deleteAd', { id: a.id }).then(function () {
            S.data.ads = S.data.ads.filter(function (x) { return x.id !== a.id; }); close(); toast('ลบแล้ว'); pageSettings();
          }).catch(fail);
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

  boot();
})();
