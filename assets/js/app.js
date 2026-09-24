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
    { id: 'dashboard', label: 'Dashboard', icon: I.dash },
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
  function normalize(d) {
    d.campaigns = d.campaigns || []; d.budgets = d.budgets || []; d.adsets = d.adsets || [];
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
      S.data = normalize(d);
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

    if (!m.spend) html += '<div class="leak-note" style="margin:0 0 20px;background:var(--warn-bg);color:var(--warn)">ยังไม่ได้ตั้งงบของแคมเปญในช่วงนี้ — ค่า Ads, ต้นทุน/Lead และต้นทุน/เคส จะยังคำนวณไม่ได้ (ไปตั้งงบที่หน้า แคมเปญ)</div>';

    // --- KPI cards
    var got2 = m.funnel[1].n, reached3 = m.funnel[2].n, reached4 = m.funnel[3].n;
    var cpcRatio = m.cpc == null ? 0 : m.cpc / m.target;
    var cpcColor = m.cpc == null ? 'var(--line)' : cpcRatio <= 1 ? 'var(--good)' : cpcRatio <= 1.5 ? 'var(--st-3)' : 'var(--bad)';
    html += '<div class="grid kpis">' +
      kpiCard(I.users, 'var(--primary-soft)', 'var(--primary)', F.int(m.leads), 'Lead (ไม่นับซ้ำ)',
        CH.ring(m.leads ? got2 / m.leads : 0, 'var(--primary)', { tip: '<b>ได้ข้อมูลเครื่อง</b><br>' + got2 + ' จาก ' + m.leads + ' คน' }),
        m.dupRows ? 'ตัดแชทซ้ำ ' + m.dupRows + ' แถว' : 'วงแหวน = ได้ข้อมูลเครื่อง') +
      kpiCard(I.check, 'var(--good-bg)', 'var(--good)', F.int(m.closed), 'ปิดการขาย',
        CH.ring(m.closeRate, 'var(--good)', { label: F.pct(m.closeRate, 1), fontSize: 13, tip: '<b>อัตราปิด</b><br>' + m.closed + ' จาก ' + m.leads + ' Lead' }),
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
      tile('blue', F.baht(m.spend), 'ค่า Ads รวม', 'คิดจากงบที่ตั้ง · เฉลี่ย ' + F.baht(m.avgPerDay) + '/วัน', d.map(function (x) { return x.spend; })) +
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

    // --- ทดลองงบ
    html += campaignCard(m);
    html += budgetTestCard(f);

    // --- Ad set table
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ผลตาม Ad set</h2><div class="card-sub">เป้าต้นทุน/เคส ' + F.baht(m.target) + ' · แก้ได้ที่หน้า ตั้งค่า</div></div></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th>Ad set</th><th class="r">งบตั้ง/วัน</th><th class="r">ค่า Ads</th><th class="r">Lead</th><th class="r">ต้นทุน/Lead</th><th class="r">ปิดได้</th><th class="r">ยอดรับซื้อ</th><th class="r">ต้นทุน/เคส</th><th>ควรทำอะไร</th></tr></thead><tbody>' +
      (m.adsetRows.length ? m.adsetRows.map(function (r) {
        return '<tr><td><div>' + esc(r.adset) + '</div><div class="muted" style="font-size:12.5px">' + esc(r.campaign) + '</div></td>' +
          '<td class="r num">' + (r.dailyBudget == null ? '<span class="muted">–</span>' : r.budgetLevel === 'campaign' ? '<span class="muted">CBO ' + F.baht(r.dailyBudget) + '</span>' : F.baht(r.dailyBudget)) + '</td>' +
          '<td class="r num">' + (r.cbo ? '<span class="muted">รวมใน CBO</span>' : F.baht(r.spend)) + '</td><td class="r num">' + r.leads + '</td><td class="r num">' + F.baht(r.cpl) + '</td>' +
          '<td class="r num">' + r.closed + '</td><td class="r num">' + F.baht(r.amount) + '</td><td class="r num">' + F.baht(r.cpc) + '</td>' +
          '<td><span class="pill ' + r.action.tone + '">' + esc(r.action.text) + '</span></td></tr>';
      }).join('') : '<tr><td colspan="9" class="empty">ไม่มีข้อมูลในช่วงนี้</td></tr>') +
      '</tbody><tfoot><tr><td>รวม</td><td></td><td class="r num">' + F.baht(m.spend) + '</td><td class="r num">' + m.leads + '</td><td class="r num">' + F.baht(m.cpl) + '</td><td class="r num">' + m.closed + '</td><td class="r num">' + F.baht(m.amount) + '</td><td class="r num">' + F.baht(m.cpc) + '</td><td></td></tr></tfoot></table></div></div>';

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

  function chg(v, goodWhenUp) {
    if (v == null || !isFinite(v)) return '';
    var up = v > 0, good = goodWhenUp ? up : !up;
    if (Math.abs(v) < 0.005) return '<div class="chg">0%</div>';
    return '<div class="chg ' + (good ? 'up' : 'down') + '">' + (up ? '▲ ' : '▼ ') + Math.abs(v * 100).toFixed(0) + '%</div>';
  }

  function campaignCard(m) {
    if (!m.campaignRows.length) return '';
    return '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ผลตามแคมเปญ</h2><div class="card-sub">ค่า Ads = งบที่ตั้ง/วัน × วันที่ยิงในช่วงที่เลือก</div></div></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th>แคมเปญ</th><th class="r">ค่า Ads</th><th class="r">Lead</th><th class="r">ต้นทุน/Lead</th><th class="r">ปิดได้</th><th class="r">ยอดรับซื้อ</th><th class="r">ต้นทุน/เคส</th><th>ควรทำอะไร</th></tr></thead><tbody>' +
      m.campaignRows.map(function (r) {
        return '<tr><td>' + esc(r.campaign) + '</td><td class="r num">' + F.baht(r.spend) + '</td><td class="r num">' + r.leads + '</td><td class="r num">' + F.baht(r.cpl) + '</td>' +
          '<td class="r num">' + r.closed + '</td><td class="r num">' + F.baht(r.amount) + '</td><td class="r num">' + F.baht(r.cpc) + '</td><td><span class="pill ' + r.action.tone + '">' + esc(r.action.text) + '</span></td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function budgetTestCard(f) {
    var rows = C.budgetPeriods(S.data, { from: f.from, to: f.to, campaign: f.campaign, today: today() });
    var html = '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ทดลองงบ — เทียบผลแต่ละช่วงงบ</h2>' +
      '<div class="card-sub">1 แถว = 1 ช่วงงบที่ตั้งไว้ (ตั้ง/ปรับงบที่หน้า แคมเปญ) · ▲▼ เทียบกับช่วงก่อนหน้าของระดับเดียวกัน · สีเขียว = ดีขึ้น</div></div></div>';
    if (!rows.length) return html + '<div class="empty">ยังไม่มีช่วงงบในช่วงนี้ — ไปตั้งงบที่หน้า แคมเปญ</div></div>';
    var lastCamp = null;
    html += '<div class="table-wrap"><table class="t wide"><thead><tr><th>ระดับ</th><th>ช่วงวันที่</th><th class="r">งบตั้ง/วัน</th><th class="r">ค่า Ads</th>' +
      '<th class="r">Lead</th><th class="r">Lead/วัน</th><th class="r">ต้นทุน/Lead</th><th class="r">ปิดได้</th><th class="r">ต้นทุน/เคส</th><th>สิ่งที่ทดลอง</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var head = r.campaign !== lastCamp ? '<tr class="grp"><td colspan="10">' + esc(r.campaign) + '</td></tr>' : '';
        lastCamp = r.campaign;
        return head + '<tr><td>' + (r.adset ? esc(r.adset) : '<span class="pill info">ทั้งแคมเปญ</span>') + '</td>' +
          '<td class="num" style="white-space:nowrap">' + F.thRange(r.from, r.to) + '<div class="muted" style="font-size:12.5px">' + r.days + ' วัน' + (r.ongoing ? ' · ใช้อยู่' : '') + '</div></td>' +
          '<td class="r num">' + F.baht(r.daily) + chg(r.budgetChange, true).replace('chg up', 'chg').replace('chg down', 'chg') + '</td>' +
          '<td class="r num">' + F.baht(r.spend) + '</td>' +
          '<td class="r num">' + r.leads + '</td>' +
          '<td class="r num">' + r.leadsPerDay.toFixed(1) + chg(r.lpdChange, true) + '</td>' +
          '<td class="r num">' + F.baht(r.cpl) + chg(r.cplChange, false) + '</td>' +
          '<td class="r num">' + r.closed + '</td><td class="r num">' + F.baht(r.cpc) + '</td>' +
          '<td class="muted" style="min-width:160px">' + esc(r.note) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
    return html;
  }

  function kpiCard(icon, bg, fg, value, label, ringSvg, note) {
    return '<div class="card"><div class="kpi"><div>' +
      '<div class="kpi-icon" style="background:' + bg + ';color:' + fg + '">' + icon + '</div>' +
      '<div class="kpi-value num">' + value + '</div><div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-note">' + esc(note || '') + '</div></div>' + ringSvg + '</div></div>';
  }

  function tile(color, value, label, sub, series) {
    return '<div class="tile"><div class="tile-value num">' + value + '</div><div class="tile-label">' + label + '</div>' +
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
          '<td><div>' + esc(c.ad || '-') + '</div><div class="muted" style="font-size:12.5px">' + esc(c.adset || '') + '</div></td>' +
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
  // Campaigns (แคมเปญ → Ad set → โฆษณา)
  // ============================================================
  function statsAll() {
    // Lead และค่า Ads ตลอดอายุ แยกตามแคมเปญ / Ad set / โฆษณา
    var people = C.uniquePeople(S.data.chats).filter(function (p) { return C.stageOf(p.status) >= 1; });
    var st = { camp: {}, adset: {}, ad: {} };
    function add(map, k, f, v) { var r = map[k] = map[k] || { leads: 0, closed: 0, spend: 0 }; r[f] += v; }
    people.forEach(function (p) {
      add(st.camp, p.campaign, 'leads', 1); add(st.adset, p.campaign + '|' + p.adset, 'leads', 1); add(st.ad, p.ad, 'leads', 1);
      if (p.status === '5-ปิดการขาย') { add(st.camp, p.campaign, 'closed', 1); add(st.adset, p.campaign + '|' + p.adset, 'closed', 1); add(st.ad, p.ad, 'closed', 1); }
    });
    C.plannedSpend(S.data, today()).forEach(function (s) {
      add(st.camp, s.campaign, 'spend', s.amount);
      if (s.adset) add(st.adset, s.campaign + '|' + s.adset, 'spend', s.amount);
    });
    return st;
  }
  function g(map, k) { return map[k] || { leads: 0, closed: 0, spend: 0 }; }
  function findCamp(id) { return S.data.campaigns.filter(function (c) { return c.id === id; })[0]; }
  function adsetRows(camp) {
    var rows = S.data.adsets.filter(function (a) { return a.campaign === camp; });
    C.adsetsOf(S.data, camp).forEach(function (n) {
      if (!rows.some(function (r) { return r.name === n; })) rows.push({ id: '', campaign: camp, name: n, active: true, note: '' });
    });
    return rows.sort(function (a, b) { return a.name.localeCompare(b.name, 'th'); });
  }
  function budgetCell(camp, adset, label) {
    var b = C.budgetAt(S.data, camp, adset, today());
    var own = b && (adset ? b.level === 'adset' : true);
    return '<button class="btn ghost sm" data-bset="' + esc(camp) + '" data-bas="' + esc(adset || '') + '">' +
      (own ? F.baht(b.daily_budget) + '/วัน' : (label || 'ตั้งงบ')) + '</button>';
  }
  function crumbs(parts) {
    return '<div class="crumbs">' + parts.map(function (p, i) {
      return i < parts.length - 1 ? '<button class="linkish" data-crumb="' + i + '">' + esc(p) + '</button><span class="muted">›</span>' : '<b>' + esc(p) + '</b>';
    }).join('') + '</div>';
  }
  function budgetHistory(camp, adset) {
    var bs = S.data.budgets.filter(function (b) { return b.campaign === camp && (b.adset || '') === (adset || ''); })
      .sort(function (a, b) { return a.start_date < b.start_date ? 1 : -1; });
    if (!bs.length) return '';
    return '<details class="hist"><summary>ประวัติงบ / ทดลองงบ (' + bs.length + ')</summary><table class="t"><tbody>' + bs.map(function (b) {
      return '<tr class="click" data-bid="' + esc(b.id) + '"><td class="num" style="white-space:nowrap">ตั้งแต่ ' + F.thDate(b.start_date, true) + '</td><td class="r num">' + F.baht(b.daily_budget) + '/วัน</td><td class="muted">' + esc(b.note || '') + '</td></tr>';
    }).join('') + '</tbody></table></details>';
  }

  function pageCampaigns() {
    var nv = S.campNav || (S.campNav = { camp: null, adset: null, all: false });
    var cp = nv.camp ? findCamp(nv.camp) : null;
    if (!cp) { nv.camp = null; nv.adset = null; return campList(); }
    if (nv.adset != null) return adsetView(cp, nv.adset);
    return campView(cp);
  }

  function campList() {
    var nv = S.campNav, td = today(), st = statsAll();
    var list = S.data.campaigns.slice().sort(function (a, b) { return a.start_date < b.start_date ? 1 : -1; });
    var running = list.filter(function (c) { return C.campaignStatus(c, td).text !== 'จบแล้ว'; });
    var shown = nv.all ? list : running;
    var html = '<div class="card"><div class="card-head"><div><h2 class="card-title">แคมเปญ</h2><div class="card-sub">กดแคมเปญเพื่อดู Ad set และโฆษณา · ค่า Ads คิดจากงบที่ตั้ง/วัน × จำนวนวันที่ยิง</div></div>' +
      '<div class="actions"><div class="chip-group"><button data-all="0" class="' + (!nv.all ? 'on' : '') + '">กำลังยิง (' + running.length + ')</button><button data-all="1" class="' + (nv.all ? 'on' : '') + '">ทั้งหมด (' + list.length + ')</button></div>' +
      '<button class="btn sm" id="addCamp">+ เพิ่มแคมเปญ</button></div></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th>แคมเปญ</th><th>ช่วงยิง</th><th>สถานะ</th><th class="r">งบที่ตั้ง/วัน</th><th class="r">Ad set</th><th class="r">โฆษณา</th><th class="r">Lead</th><th class="r">ค่า Ads รวม</th><th></th></tr></thead><tbody>' +
      (shown.length ? shown.map(function (c) {
        var s = C.campaignStatus(c, td), x = g(st.camp, c.name);
        return '<tr class="click" data-open="' + esc(c.id) + '"><td><b style="font-weight:500">' + esc(c.name) + '</b>' + (c.objective ? '<div class="muted" style="font-size:13px">' + esc(c.objective) + '</div>' : '') + '</td>' +
          '<td class="num">' + F.thDate(c.start_date, true) + ' – ' + (c.end_date ? F.thDate(c.end_date, true) : 'ปัจจุบัน') + '</td>' +
          '<td><span class="pill ' + s.tone + '">' + s.text + '</span></td>' +
          '<td class="r num">' + budgetSummary(c.name, c.end_date && c.end_date < td ? c.end_date : td) + '</td>' +
          '<td class="r num">' + adsetRows(c.name).length + '</td><td class="r num">' + S.data.ads.filter(function (a) { return a.campaign === c.name; }).length + '</td>' +
          '<td class="r num">' + x.leads + '</td><td class="r num">' + F.baht(x.spend) + '</td><td class="r muted">›</td></tr>';
      }).join('') : '<tr><td colspan="9" class="empty">ไม่มีแคมเปญ — กด + เพิ่มแคมเปญ</td></tr>') + '</tbody></table></div></div>';
    $('#page').innerHTML = html;
    $$('[data-all]').forEach(function (b) { b.onclick = function () { nv.all = b.dataset.all === '1'; campList(); }; });
    $('#addCamp').onclick = function () { editCampaign(null); };
    $$('tr[data-open]').forEach(function (tr) { tr.onclick = function () { nv.camp = tr.dataset.open; nv.adset = null; pageCampaigns(); window.scrollTo(0, 0); }; });
  }

  function campView(cp) {
    var nv = S.campNav, td = today(), st = statsAll(), s = C.campaignStatus(cp, td), x = g(st.camp, cp.name);
    var cb = C.budgetAt(S.data, cp.name, '', td);
    var rows = adsetRows(cp.name);
    var html = crumbs(['แคมเปญทั้งหมด', cp.name]) +
      '<div class="grid row-2">' +
      '<div class="card"><div class="card-head"><div><h2 class="card-title">' + esc(cp.name) + '</h2><div class="card-sub">' + esc(cp.objective || '') + '</div></div><button class="btn ghost sm" id="editCp">แก้ไข</button></div>' +
      '<div class="facts"><div><span>เริ่มยิง</span><b>' + F.thDate(cp.start_date, true) + '</b></div><div><span>ปิด</span><b>' + (cp.end_date ? F.thDate(cp.end_date, true) : '–') + '</b></div>' +
      '<div><span>สถานะ</span><b><span class="pill ' + s.tone + '">' + s.text + '</span></b></div>' +
      '<div><span>Lead</span><b>' + x.leads + '</b></div><div><span>ปิดได้</span><b>' + x.closed + '</b></div><div><span>ค่า Ads รวม</span><b>' + F.baht(x.spend) + '</b></div></div></div>' +
      '<div class="card"><div class="card-head"><div><h2 class="card-title">งบที่ตั้ง</h2><div class="card-sub">ตั้งทั้งแคมเปญ (CBO) หรือแยกราย Ad set ด้านล่างก็ได้</div></div><button class="btn sm" id="bulkBudget">ตั้งงบทั้งหมด</button></div>' +
      '<div class="facts"><div><span>งบทั้งแคมเปญ (CBO)</span><b>' + (cb && cb.level === 'campaign' ? F.baht(cb.daily_budget) + '/วัน' : '<span class="muted">ไม่ได้ใช้</span>') + '</b></div>' +
      '<div><span>รวมงบ/วันตอนนี้</span><b>' + budgetSummary(cp.name, cp.end_date && cp.end_date < td ? cp.end_date : td) + '</b></div></div>' +
      '<div class="actions" style="justify-content:flex-start;margin-top:12px">' + '<button class="btn ghost sm" data-bset="' + esc(cp.name) + '" data-bas="">' + (cb && cb.level === 'campaign' ? 'ปรับงบ CBO' : 'ตั้งงบ CBO') + '</button>' + '</div>' +
      budgetHistory(cp.name, '') + '</div></div>';

    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">Ad set</h2><div class="card-sub">กด Ad set เพื่อดูโฆษณาข้างใน · กดปุ่มงบเพื่อตั้ง/ปรับงบรายวัน</div></div><button class="btn sm" id="addAs">+ เพิ่ม Ad set</button></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th>Ad set</th><th class="r">งบที่ตั้ง/วัน</th><th class="r">โฆษณา</th><th class="r">Lead</th><th class="r">ปิดได้</th><th class="r">ค่า Ads รวม</th><th>สถานะ</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (a) {
        var y = g(st.adset, cp.name + '|' + a.name);
        var bd = C.budgetAt(S.data, cp.name, a.name, td);
        return '<tr class="click" data-as="' + esc(a.name) + '"><td><b style="font-weight:500">' + esc(a.name) + '</b></td>' +
          '<td class="r num">' + (bd && bd.level === 'campaign' ? '<span class="muted" style="margin-right:8px">ใช้ CBO</span>' : '') + budgetCell(cp.name, a.name, bd && bd.level === 'campaign' ? 'แยกงบ' : 'ตั้งงบ') + '</td>' +
          '<td class="r num">' + S.data.ads.filter(function (d) { return d.campaign === cp.name && d.adset === a.name; }).length + '</td>' +
          '<td class="r num">' + y.leads + '</td><td class="r num">' + y.closed + '</td><td class="r num">' + (y.spend ? F.baht(y.spend) : '<span class="muted">–</span>') + '</td>' +
          '<td>' + (isTrue(a.active) ? '<span class="pill good">เปิด</span>' : '<span class="pill">ปิด</span>') + '</td><td class="r muted">›</td></tr>';
      }).join('') : '<tr><td colspan="8" class="empty">ยังไม่มี Ad set — กด + เพิ่ม Ad set</td></tr>') + '</tbody></table></div></div>';
    $('#page').innerHTML = html;

    wireCrumbs();
    $('#editCp').onclick = function () { editCampaign(cp.id); };
    $('#bulkBudget').onclick = function () { bulkBudget(cp); };
    $('#addAs').onclick = function () { editAdset({ campaign: cp.name, active: true }); };
    $$('tr[data-as]').forEach(function (tr) { tr.onclick = function () { nv.adset = tr.dataset.as; pageCampaigns(); window.scrollTo(0, 0); }; });
    wireBudgetButtons();
  }

  function adsetView(cp, asName) {
    var nv = S.campNav, td = today(), st = statsAll();
    var a = adsetRows(cp.name).filter(function (r) { return r.name === asName; })[0];
    if (!a) { nv.adset = null; return campView(cp); }
    var y = g(st.adset, cp.name + '|' + a.name), bd = C.budgetAt(S.data, cp.name, a.name, td);
    var ads = S.data.ads.filter(function (d) { return d.campaign === cp.name && d.adset === a.name; });
    var html = crumbs(['แคมเปญทั้งหมด', cp.name, a.name]) +
      '<div class="card"><div class="card-head"><div><h2 class="card-title">' + esc(a.name) + '</h2><div class="card-sub">' + esc(cp.name) + '</div></div>' +
      '<div class="actions">' + budgetCell(cp.name, a.name, bd && bd.level === 'campaign' ? 'แยกงบจาก CBO' : 'ตั้งงบ') + '<button class="btn ghost sm" id="editAs">แก้ไข</button></div></div>' +
      '<div class="facts"><div><span>งบที่ตั้ง/วัน</span><b>' + (bd ? F.baht(bd.daily_budget) + (bd.level === 'campaign' ? ' <span class="muted">(CBO ทั้งแคมเปญ)</span>' : '') : '<span class="muted">ยังไม่ตั้ง</span>') + '</b></div>' +
      '<div><span>สถานะ</span><b>' + (isTrue(a.active) ? '<span class="pill good">เปิด</span>' : '<span class="pill">ปิด</span>') + '</b></div>' +
      '<div><span>Lead</span><b>' + y.leads + '</b></div><div><span>ปิดได้</span><b>' + y.closed + '</b></div><div><span>ค่า Ads รวม</span><b>' + (y.spend ? F.baht(y.spend) : '–') + '</b></div></div>' +
      budgetHistory(cp.name, a.name) + '</div>';
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">โฆษณา</h2><div class="card-sub">ชื่อโฆษณาคือชื่อที่แอดมินเลือกตอนบันทึกแชท · ปิดแล้วจะไม่โผล่ในหน้าบันทึกแชท</div></div><button class="btn sm" id="addAd">+ เพิ่มโฆษณา</button></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th></th><th>ชื่อโฆษณา</th><th>โพสต์</th><th class="r">Lead</th><th class="r">ปิดได้</th><th>สถานะ</th></tr></thead><tbody>' +
      (ads.length ? ads.map(function (d) {
        var z = g(st.ad, d.ad_name);
        return '<tr class="click" data-aid="' + esc(d.id) + '"><td style="width:56px">' + (d.creative_url ? '<img class="thumb" src="' + esc(d.creative_url) + '" alt="" loading="lazy">' : '<div class="thumb"></div>') + '</td>' +
          '<td>' + esc(d.ad_name) + '</td><td>' + (d.post_url ? '<a href="' + esc(d.post_url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + I.link + '</a>' : '<span class="muted">–</span>') + '</td>' +
          '<td class="r num">' + z.leads + '</td><td class="r num">' + z.closed + '</td>' +
          '<td>' + (isTrue(d.active) ? '<span class="pill good">กำลังยิง</span>' : '<span class="pill">ปิดแล้ว</span>') + '</td></tr>';
      }).join('') : '<tr><td colspan="6" class="empty">ยังไม่มีโฆษณา — กด + เพิ่มโฆษณา</td></tr>') + '</tbody></table></div></div>';
    $('#page').innerHTML = html;
    wireCrumbs();
    $('#editAs').onclick = function () { editAdset(a.id ? a : Object.assign({}, a)); };
    $('#addAd').onclick = function () { editAd(null, { campaign: cp.name, adset: a.name }); };
    $$('tr[data-aid]').forEach(function (tr) { tr.onclick = function () { editAd(tr.dataset.aid); }; });
    wireBudgetButtons();
  }

  function wireCrumbs() {
    $$('[data-crumb]').forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.dataset.crumb);
        if (i === 0) { S.campNav.camp = null; S.campNav.adset = null; } else { S.campNav.adset = null; }
        pageCampaigns(); window.scrollTo(0, 0);
      };
    });
  }
  function wireBudgetButtons() {
    $$('[data-bset]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); editBudget({ campaign: b.dataset.bset, adset: b.dataset.bas }, pageCampaigns); };
    });
    $$('tr[data-bid]').forEach(function (tr) {
      tr.onclick = function () { editBudget(S.data.budgets.filter(function (x) { return x.id === tr.dataset.bid; })[0], pageCampaigns); };
    });
  }

  /** บันทึกงบ: ถ้ามีแถวของระดับเดียวกันที่เริ่มวันเดียวกันอยู่แล้ว → แก้แถวนั้นแทนการเพิ่มใหม่ */
  function saveBudgetSmart(rec) {
    if (!rec.id) {
      var same = S.data.budgets.filter(function (b) { return b.campaign === rec.campaign && (b.adset || '') === (rec.adset || '') && b.start_date === rec.start_date; })[0];
      if (same) rec.id = same.id;
    }
    return API.call('saveBudget', { budget: rec }).then(function (saved) {
      var i = S.data.budgets.findIndex(function (x) { return x.id === saved.id; });
      if (i >= 0) S.data.budgets[i] = saved; else S.data.budgets.push(saved);
      return saved;
    });
  }
  /** วันที่ตั้งต้นของงบใหม่: ถ้ายังไม่เคยตั้งงบระดับนี้ = วันเริ่มแคมเปญ, ถ้าเคยแล้ว = วันนี้ */
  function defaultBudgetDate(camp, adset) {
    var has = S.data.budgets.some(function (b) { return b.campaign === camp && (b.adset || '') === (adset || ''); });
    var cp = S.data.campaigns.filter(function (c) { return c.name === camp; })[0];
    if (!has && cp && cp.start_date) return cp.start_date < today() ? cp.start_date : cp.start_date;
    return today();
  }

  function bulkBudget(cp) {
    var rows = adsetRows(cp.name), td = today();
    var anyBudget = S.data.budgets.some(function (b) { return b.campaign === cp.name; });
    function cur(as) { var b = C.budgetAt(S.data, cp.name, as, td); return b && (as ? b.level === 'adset' : true) ? b.daily_budget : ''; }
    modal('<h3>ตั้งงบทั้งหมด — ' + esc(cp.name) + '</h3><form id="bkForm" class="form-grid">' +
      '<div class="f c6"><label>เริ่มใช้งบนี้วันที่</label><input type="date" id="bkDate" value="' + (anyBudget ? td : esc(cp.start_date)) + '" required></div>' +
      '<div class="f c6"><label>สิ่งที่ทดลอง / เหตุผล</label><input id="bkNote" placeholder="เช่น ทดลองเพิ่มงบ +30%"></div>' +
      '<div class="f c12"><div class="hint">ใส่งบ/วันที่ตั้งไว้ใน Ads Manager · ช่องที่ไม่แก้จะไม่ถูกบันทึก · ใช้ CBO ให้ใส่ที่ "ทั้งแคมเปญ" แล้วเว้น Ad set ว่าง</div></div>' +
      '<div class="c12"><table class="t"><tbody>' +
      '<tr><td><span class="pill info">ทั้งแคมเปญ (CBO)</span></td><td class="r" style="width:180px"><input class="bk" data-as="" type="number" min="0" inputmode="numeric" value="' + esc(cur('')) + '" data-old="' + esc(cur('')) + '" placeholder="–"></td></tr>' +
      rows.map(function (a) {
        return '<tr><td>' + esc(a.name) + (isTrue(a.active) ? '' : ' <span class="pill">ปิด</span>') + '</td><td class="r"><input class="bk" data-as="' + esc(a.name) + '" type="number" min="0" inputmode="numeric" value="' + esc(cur(a.name)) + '" data-old="' + esc(cur(a.name)) + '" placeholder="–"></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="c12 actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></div></form>',
      function (el, close) {
        $('#bkForm', el).onsubmit = function (e) {
          e.preventDefault();
          var date = $('#bkDate', el).value, note = $('#bkNote', el).value.trim();
          var changes = $$('.bk', el).filter(function (i) { return i.value !== '' && String(i.value) !== String(i.dataset.old); });
          if (!changes.length) return toast('ยังไม่ได้แก้งบช่องไหน', true);
          var chain = Promise.resolve();
          changes.forEach(function (i) {
            chain = chain.then(function () { return saveBudgetSmart({ campaign: cp.name, adset: i.dataset.as, start_date: date, daily_budget: i.value, note: note }); });
          });
          chain.then(function () { close(); toast('บันทึกงบ ' + changes.length + ' รายการ'); pageCampaigns(); }).catch(fail);
        };
      });
  }

  function editAdset(a) {
    var isNew = !a.id;
    var used = !isNew && (S.data.ads.some(function (x) { return x.campaign === a.campaign && x.adset === a.name; }) || S.data.chats.some(function (x) { return x.campaign === a.campaign && x.adset === a.name; }));
    modal('<h3>' + (isNew ? 'เพิ่ม Ad set' : 'แก้ไข Ad set') + '</h3><form id="asForm" class="form-grid">' +
      '<div class="f c12"><label>แคมเปญ</label><input value="' + esc(a.campaign) + '" readonly></div>' +
      '<div class="f c12"><label>ชื่อ Ad set (ตรงกับใน Ads Manager)</label><input id="asName" value="' + esc(a.name || '') + '" required>' + (used ? '<div class="hint">เปลี่ยนชื่อได้ — แชท/โฆษณา/งบเดิมจะเปลี่ยนชื่อตามให้</div>' : '') + '</div>' +
      (isNew ? '<div class="f c6"><label>งบที่ตั้ง/วัน (ถ้าแยกงบราย Ad set)</label><input type="number" id="asBudget" min="0" inputmode="numeric" placeholder="ใช้ CBO ให้เว้นว่าง"></div>' : '') +
      '<div class="f c12"><label>หมายเหตุ</label><input id="asNote" value="' + esc(a.note || '') + '"></div>' +
      '<div class="f c12"><label><input type="checkbox" id="asActive"' + (isTrue(a.active) ? ' checked' : '') + ' style="width:auto;margin-right:8px">เปิดอยู่</label><div class="hint">ปิด Ad set ที่มีงบแยก → ระบบตั้งงบเป็น 0 ตั้งแต่วันนี้ให้ ค่า Ads จะหยุดนับ</div></div>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (!isNew && !used ? '<button type="button" class="btn danger" id="asDel">ลบ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#asForm', el).onsubmit = function (e) {
          e.preventDefault();
          var wasActive = isTrue(a.active);
          var rec = { id: a.id || '', campaign: a.campaign, name: $('#asName', el).value.trim(), active: $('#asActive', el).checked, note: $('#asNote', el).value.trim() };
          var first = $('#asBudget', el) ? $('#asBudget', el).value : '';
          var oldName = a.name;
          API.call('saveAdset', { adset: rec }).then(function (saved) {
            var i = S.data.adsets.findIndex(function (x) { return x.id === saved.id; });
            if (i >= 0) S.data.adsets[i] = saved; else S.data.adsets.push(saved);
            if (oldName && oldName !== saved.name) {
              [S.data.ads, S.data.chats, S.data.budgets].forEach(function (list) { list.forEach(function (x) { if (x.campaign === saved.campaign && x.adset === oldName) x.adset = saved.name; }); });
              if (S.campNav && S.campNav.adset === oldName) S.campNav.adset = saved.name;
            }
            if (first !== '') return saveBudgetSmart({ campaign: saved.campaign, adset: saved.name, start_date: defaultBudgetDate(saved.campaign, saved.name), daily_budget: first, note: 'งบเริ่มต้น' });
            var b = C.budgetAt(S.data, saved.campaign, saved.name, today());
            if (wasActive && !rec.active && b && b.level === 'adset' && Number(b.daily_budget) > 0) {
              return saveBudgetSmart({ campaign: saved.campaign, adset: saved.name, start_date: today(), daily_budget: 0, note: 'ปิด Ad set' });
            }
          }).then(function () { close(); toast('บันทึก Ad set แล้ว'); pageCampaigns(); }).catch(fail);
        };
        if ($('#asDel', el)) $('#asDel', el).onclick = function () {
          if (!window.confirm('ลบ Ad set ' + a.name + ' ?')) return;
          API.call('deleteAdset', { id: a.id }).then(function () {
            S.data.adsets = S.data.adsets.filter(function (x) { return x.id !== a.id; });
            S.data.budgets = S.data.budgets.filter(function (b) { return !(b.campaign === a.campaign && b.adset === a.name); });
            S.campNav.adset = null; close(); toast('ลบแล้ว'); pageCampaigns();
          }).catch(fail);
        };
      });
  }

  // ============================================================
  // Settings
  // ============================================================
  function pageSettings() {
    var html = '<div class="grid row-2">' +
      '<div class="card"><h2 class="card-title" style="margin-bottom:14px">เป้าหมาย</h2><form id="cfgForm" class="form-grid">' +
      '<div class="f c8"><label for="cfgTarget">เป้าต้นทุน/เคส (บาท)</label><input type="number" id="cfgTarget" min="1" value="' + esc(S.data.config.target_cost_per_case) + '"><div class="hint">ใช้ตัดสิน "ควรทำอะไร" ในตาราง Dashboard</div></div>' +
      '<div class="f c4" style="align-self:start;padding-top:27px"><button class="btn" type="submit">บันทึก</button></div></form></div>' +
      '<div class="card"><div class="card-head"><h2 class="card-title">ผู้ใช้</h2><button class="btn sm" id="addUser">+ เพิ่มผู้ใช้</button></div>' +
      '<table class="t"><tbody>' + S.data.users.map(function (u) {
        return '<tr><td><div class="name-cell"><div class="avatar" style="width:32px;height:32px;font-size:13px;box-shadow:none">' + esc(initials(u.name)) + '</div>' + esc(u.name) + '</div></td>' +
          '<td>' + (u.active ? '<span class="pill good">ใช้งาน</span>' : '<span class="pill">ปิด</span>') + '</td>' +
          '<td class="r"><button class="btn ghost sm" data-user="' + esc(u.name) + '">แก้</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
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
    $('#addUser').onclick = function () { editUser(null); };
    $$('[data-user]').forEach(function (b) { b.onclick = function () { editUser(b.dataset.user); }; });
    if ($('#resetDemo')) $('#resetDemo').onclick = function () { API.resetDemo(); boot(); toast('รีเซ็ตแล้ว'); };
  }

  /** งบที่ตั้ง ณ วันนี้ของแคมเปญ: ระดับแคมเปญ หรือผลรวมระดับ Ad set */
  function budgetSummary(camp, td) {
    var c = C.budgetAt(S.data, camp, '', td);
    var sets = C.adsetsOf(S.data, camp).map(function (as) {
      var b = C.budgetAt(S.data, camp, as, td);
      return b && b.level === 'adset' ? Number(b.daily_budget) : 0;
    });
    var adsetTotal = sets.reduce(function (a, b) { return a + b; }, 0);
    if (c && !adsetTotal) return F.baht(c.daily_budget) + ' <span class="muted">(ทั้งแคมเปญ)</span>';
    if (adsetTotal) return F.baht(adsetTotal + (c ? Number(c.daily_budget) : 0)) + ' <span class="muted">(รวม Ad set)</span>';
    return '<span class="muted">–</span>';
  }

  function campOptions(sel) {
    return campaigns().map(function (c) { return opt(c, c, sel); }).join('');
  }

  function editCampaign(id) {
    var c = id ? S.data.campaigns.filter(function (x) { return x.id === id; })[0] : { start_date: today() };
    modal('<h3>' + (id ? 'แก้ไขแคมเปญ' : 'เพิ่มแคมเปญ') + '</h3><form id="cpForm" class="form-grid">' +
      '<div class="f c12"><label>ชื่อแคมเปญ (ตรงกับใน Ads Manager)</label><input id="cpName" value="' + esc(c.name || '') + '" required></div>' +
      '<div class="f c6"><label>วันที่เริ่มยิง</label><input type="date" id="cpStart" value="' + esc(c.start_date || '') + '" required></div>' +
      '<div class="f c6"><label>วันที่ปิด (เว้นว่าง = ยังยิงอยู่)</label><input type="date" id="cpEnd" value="' + esc(c.end_date || '') + '"></div>' +
      '<div class="f c6"><label>เป้าหมายแคมเปญ</label><input id="cpObj" list="dlObj" value="' + esc(c.objective || '') + '" placeholder="เช่น Message, Engagement"></div>' +
      '<div class="f c6"><label>หมายเหตุ</label><input id="cpNote" value="' + esc(c.note || '') + '"></div>' +
      (id ? '' : '<div class="f c6"><label>งบที่ตั้ง/วัน ทั้งแคมเปญ (ถ้ามี)</label><input type="number" id="cpBudget" min="0" inputmode="numeric" placeholder="ถ้าตั้งงบราย Ad set ให้เว้นว่าง"></div>') +
      '<datalist id="dlObj"><option value="Message"><option value="Engagement"><option value="Traffic"><option value="Leads"></datalist>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (id ? '<button type="button" class="btn danger" id="cpDel">ลบ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#cpForm', el).onsubmit = function (e) {
          e.preventDefault();
          var rec = { id: c.id || '', name: $('#cpName', el).value.trim(), start_date: $('#cpStart', el).value, end_date: $('#cpEnd', el).value,
            objective: $('#cpObj', el).value.trim(), note: $('#cpNote', el).value.trim() };
          var firstBudget = $('#cpBudget', el) ? $('#cpBudget', el).value : '';
          var oldName = c.name;
          API.call('saveCampaign', { campaign: rec }).then(function (saved) {
            var i = S.data.campaigns.findIndex(function (x) { return x.id === saved.id; });
            if (i >= 0) S.data.campaigns[i] = saved; else S.data.campaigns.push(saved);
            if (oldName && oldName !== saved.name) {
              [S.data.ads, S.data.chats, S.data.budgets, S.data.adsets].forEach(function (list) { list.forEach(function (x) { if (x.campaign === oldName) x.campaign = saved.name; }); });
            }
            if (!id) S.campNav = { camp: saved.id, adset: null, all: (S.campNav || {}).all };
            if (firstBudget !== '') return saveBudgetSmart({ campaign: saved.name, adset: '', start_date: saved.start_date, daily_budget: firstBudget, note: 'งบเริ่มต้น' });
          }).then(function () { close(); toast('บันทึกแคมเปญแล้ว'); pageCampaigns(); }).catch(fail);
        };
        if ($('#cpDel', el)) $('#cpDel', el).onclick = function () {
          if (!window.confirm('ลบแคมเปญ ' + c.name + ' ?')) return;
          API.call('deleteCampaign', { id: c.id }).then(function () {
            S.data.campaigns = S.data.campaigns.filter(function (x) { return x.id !== c.id; });
            S.data.budgets = S.data.budgets.filter(function (x) { return x.campaign !== c.name; });
            S.campNav = { camp: null, adset: null }; close(); toast('ลบแล้ว'); pageCampaigns();
          }).catch(fail);
        };
      });
  }

  /** ตั้งงบ / ปรับงบ 1 ช่วง  b = แถวเดิม หรือ {campaign, adset?} สำหรับแถวใหม่ */
  function editBudget(b, after) {
    var isNew = !b.id;
    var sets = C.adsetsOf(S.data, b.campaign);
    var cur = C.budgetAt(S.data, b.campaign, b.adset || '', today());
    modal('<h3>' + (isNew ? 'ตั้งงบ / ปรับงบ' : 'แก้ไขช่วงงบ') + '</h3><form id="bdForm" class="form-grid">' +
      '<div class="f c12"><label>แคมเปญ</label><input value="' + esc(b.campaign) + '" readonly></div>' +
      '<div class="f c12"><label>ใช้กับ</label><select id="bdLevel">' + opt('', 'ทั้งแคมเปญ (CBO)', b.adset || '') + sets.map(function (s) { return opt(s, 'Ad set: ' + s, b.adset || ''); }).join('') + '</select></div>' +
      '<div class="f c6"><label>เริ่มใช้งบนี้วันที่</label><input type="date" id="bdStart" value="' + esc(b.start_date || defaultBudgetDate(b.campaign, b.adset)) + '" required><div class="hint">ปรับงบกลางแคมเปญ = ใส่วันที่เริ่มใช้งบใหม่ งบเดิมยังนับถึงวันก่อนหน้า</div></div>' +
      '<div class="f c6"><label>งบที่ตั้ง/วัน (บาท)</label><input type="number" id="bdAmt" min="0" inputmode="numeric" value="' + esc(b.daily_budget == null ? '' : b.daily_budget) + '" required>' +
      (isNew && cur ? '<div class="hint">ตอนนี้ตั้งไว้ ' + F.baht(cur.daily_budget) + '/วัน' + (cur.level === 'campaign' ? ' (ทั้งแคมเปญ)' : '') + '</div>' : '') + '</div>' +
      '<div class="f c12"><label>สิ่งที่ทดลอง / เหตุผลที่ปรับ</label><input id="bdNote" value="' + esc(b.note || '') + '" placeholder="เช่น ทดลองเพิ่มงบ +30% ดูว่า Lead/วัน ขึ้นตามไหม"></div>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (!isNew ? '<button type="button" class="btn danger" id="bdDel">ลบ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#bdForm', el).onsubmit = function (e) {
          e.preventDefault();
          var rec = { id: b.id || '', campaign: b.campaign, adset: $('#bdLevel', el).value, start_date: $('#bdStart', el).value, daily_budget: $('#bdAmt', el).value, note: $('#bdNote', el).value.trim() };
          if (rec.daily_budget === '') return toast('ใส่งบ/วัน', true);
          saveBudgetSmart(rec).then(function () {
            close(); toast('บันทึกงบแล้ว'); if (after) after();
          }).catch(fail);
        };
        if ($('#bdDel', el)) $('#bdDel', el).onclick = function () {
          if (!window.confirm('ลบช่วงงบนี้?')) return;
          API.call('deleteBudget', { id: b.id }).then(function () {
            S.data.budgets = S.data.budgets.filter(function (x) { return x.id !== b.id; }); close(); toast('ลบแล้ว'); if (after) after();
          }).catch(fail);
        };
      });
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
          if (!window.confirm('ลบโฆษณานี้?')) return;
          API.call('deleteAd', { id: a.id }).then(function () {
            S.data.ads = S.data.ads.filter(function (x) { return x.id !== a.id; }); close(); toast('ลบแล้ว'); pageCampaigns();
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
