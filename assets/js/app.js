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

    if (!m.spend) html += '<div class="leak-note" style="margin:0 0 20px;background:var(--warn-bg);color:var(--warn)">ยังไม่ได้กรอกค่า Ads ในช่วงนี้ — ต้นทุน/Lead และต้นทุน/เคส จะยังคำนวณไม่ได้ (กรอกที่หน้า แคมเปญ → กรอกค่า Ads)</div>';

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

    // --- ทดลองงบ
    html += campaignCard(m);
    html += budgetTestCard(f);

    // --- Ad set table
    html += '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ผลตาม Ad set</h2><div class="card-sub">เป้าต้นทุน/เคส ' + F.baht(m.target) + ' · แก้ได้ที่หน้า ตั้งค่า</div></div></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th>Ad set</th><th class="r">งบตั้ง/วัน</th><th class="r">ค่า Ads</th><th class="r">Lead</th><th class="r">ต้นทุน/Lead</th><th class="r">ปิดได้</th><th class="r">ยอดรับซื้อ</th><th class="r">ต้นทุน/เคส</th><th>ควรทำอะไร</th></tr></thead><tbody>' +
      (m.adsetRows.length ? m.adsetRows.map(function (r) {
        return '<tr><td><div>' + esc(r.adset) + '</div><div class="muted" style="font-size:12.5px">' + esc(r.campaign) + '</div></td>' +
          '<td class="r num">' + (r.dailyBudget == null ? '<span class="muted">–</span>' : r.budgetLevel === 'campaign' ? '<span class="muted">CBO ' + F.baht(r.dailyBudget) + '</span>' : F.baht(r.dailyBudget)) + '</td>' +
          '<td class="r num">' + (r.cbo ? '<span class="muted">กรอกระดับแคมเปญ</span>' : F.baht(r.spend)) + '</td><td class="r num">' + r.leads + '</td><td class="r num">' + F.baht(r.cpl) + '</td>' +
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
    return '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ผลตามแคมเปญ</h2><div class="card-sub">ค่า Ads = ยอดที่กรอกไว้ในช่วงวันที่ที่เลือก</div></div></div>' +
      '<div class="table-wrap"><table class="t wide"><thead><tr><th>แคมเปญ</th><th class="r">ค่า Ads</th><th class="r">Lead</th><th class="r">ต้นทุน/Lead</th><th class="r">ปิดได้</th><th class="r">ยอดรับซื้อ</th><th class="r">ต้นทุน/เคส</th><th>ควรทำอะไร</th></tr></thead><tbody>' +
      m.campaignRows.map(function (r) {
        return '<tr><td>' + esc(r.campaign) + '</td><td class="r num">' + F.baht(r.spend) + '</td><td class="r num">' + r.leads + '</td><td class="r num">' + F.baht(r.cpl) + '</td>' +
          '<td class="r num">' + r.closed + '</td><td class="r num">' + F.baht(r.amount) + '</td><td class="r num">' + F.baht(r.cpc) + '</td><td><span class="pill ' + r.action.tone + '">' + esc(r.action.text) + '</span></td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function budgetTestCard(f) {
    var rows = C.budgetPeriods(S.data, { from: f.from, to: f.to, campaign: f.campaign, today: today() });
    var html = '<div class="card mt"><div class="card-head"><div><h2 class="card-title">ทดลองงบ — เทียบผลแต่ละช่วงงบ</h2>' +
      '<div class="card-sub">1 แถว = 1 ช่วงที่เปิดยิงด้วยงบเดียวกัน (มาจากไทม์ไลน์ในหน้า แคมเปญ) · ▲▼ เทียบกับช่วงก่อนหน้าของระดับเดียวกัน · สีเขียว = ดีขึ้น</div></div></div>';
    if (!rows.length) return html + '<div class="empty">ยังไม่มีช่วงงบในช่วงนี้ — กด เปิดยิง / ปรับงบ ที่หน้า แคมเปญ</div></div>';
    var lastCamp = null;
    html += '<div class="table-wrap"><table class="t wide"><thead><tr><th>ระดับ</th><th>ช่วงวันที่</th><th class="r">งบตั้ง/วัน</th><th class="r">ค่า Ads</th>' +
      '<th class="r">Lead</th><th class="r">Lead/วัน</th><th class="r">ต้นทุน/Lead</th><th class="r">ปิดได้</th><th class="r">ต้นทุน/เคส</th><th>สิ่งที่ทดลอง</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var head = r.campaign !== lastCamp ? '<tr class="grp"><td colspan="10">' + esc(r.campaign) + '</td></tr>' : '';
        lastCamp = r.campaign;
        return head + '<tr><td>' + (r.adset ? esc(r.adset) : '<span class="pill info">ทั้งแคมเปญ</span>') + '</td>' +
          '<td class="num" style="white-space:nowrap">' + F.thRange(r.from, r.to) + '<div class="muted" style="font-size:12.5px">' + r.days + ' วัน' + (r.ongoing ? ' · ใช้อยู่' : '') + '</div></td>' +
          '<td class="r num">' + F.baht(r.daily) + chg(r.budgetChange, true).replace('chg up', 'chg').replace('chg down', 'chg') + '</td>' +
          '<td class="r num">' + (r.spend ? F.baht(r.spend) : '<span class="muted">ยังไม่กรอก</span>') + '</td>' +
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
  // Campaigns — รายการ → หน้าแคมเปญ (ไทม์ไลน์ · ค่า Ads · Ad set/โฆษณา)
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
    if (s.state === 'running') {
      return '<div class="' + cls + '"><span class="sdot on"></span><b>กำลังยิง</b> · ' + F.baht(s.amount) + '/วัน' +
        (s.mode === 'adset' ? ' <span class="muted">(' + s.runningCount + ' Ad set)</span>' : '') + ' <span class="muted">· ตั้งแต่ ' + F.thDate(s.since, true) + '</span>' +
        (s.next ? ' <span class="pill info">ตั้งเวลา ' + F.thDate(s.next.date) + '</span>' : '') + '</div>';
    }
    if (s.state === 'paused') return '<div class="' + cls + '"><span class="sdot off"></span><b>หยุดอยู่</b> <span class="muted">· ตั้งแต่ ' + F.thDate(s.since, true) + '</span>' +
      (s.next ? ' <span class="pill info">ตั้งเวลาเปิด ' + F.thDate(s.next.date) + '</span>' : '') + '</div>';
    if (s.state === 'scheduled') return '<div class="' + cls + '"><span class="sdot wait"></span><b>ตั้งเวลาเปิดยิง</b> <span class="muted">· ' + F.thDate(s.since, true) + '</span></div>';
    return '<div class="' + cls + '"><span class="sdot none"></span><b>ยังไม่เปิดยิง</b> <span class="muted">· กด "เปิดยิง" เพื่อใส่วันที่และงบ</span></div>';
  }
  function missingHtml(camp, cov) {
    cov = cov || C.spendCoverage(S.data, camp, today());
    if (!cov.missing.length) return '';
    var a = cov.missing[0], b = cov.missing[cov.missing.length - 1];
    return '<div class="nudge"><span>ยังไม่กรอกค่า Ads ' + cov.missing.length + ' วัน (' + F.thRange(a, b) + ')</span>' +
      '<button class="btn sm" data-spend="' + esc(camp) + '" data-from="' + a + '" data-to="' + b + '">กรอกเลย</button></div>';
  }
  function actionButtons(camp) {
    var s = C.campState(S.data, camp, today());
    var h = '';
    if (s.state === 'running') h += '<button class="btn sm" data-act="adjust" data-camp="' + esc(camp) + '">ปรับงบ</button><button class="btn ghost sm" data-act="off" data-camp="' + esc(camp) + '">หยุดยิง</button>';
    else h += '<button class="btn sm" data-act="on" data-camp="' + esc(camp) + '">เปิดยิง</button>';
    h += '<button class="btn ghost sm" data-spend="' + esc(camp) + '">กรอกค่า Ads</button>';
    return h;
  }
  function wireActions(root) {
    $$('[data-act]', root).forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); eventDialog(b.dataset.camp, b.dataset.act, b.dataset.level != null ? [b.dataset.level] : null); };
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
  function campList() {
    var nv = S.campNav, td = today();
    var order = { running: 0, scheduled: 1, none: 2, paused: 3 };
    var list = S.data.campaigns.map(function (c) { return { c: c, st: C.campaignStatus(S.data, c, td) }; })
      .sort(function (a, b) { return order[a.st.key] - order[b.st.key] || (C.firstStart(S.data, a.c.name) < C.firstStart(S.data, b.c.name) ? 1 : -1); });
    var counts = { active: 0, paused: 0, all: list.length };
    list.forEach(function (x) { if (x.st.key === 'paused') counts.paused++; else counts.active++; });
    var shown = list.filter(function (x) { return nv.filter === 'all' || (nv.filter === 'paused' ? x.st.key === 'paused' : x.st.key !== 'paused'); });

    var html = '<div class="card-head" style="margin-bottom:16px"><div><div class="chip-group">' +
      '<button data-f="active" class="' + (nv.filter === 'active' ? 'on' : '') + '">กำลังใช้งาน (' + counts.active + ')</button>' +
      '<button data-f="paused" class="' + (nv.filter === 'paused' ? 'on' : '') + '">หยุดอยู่ (' + counts.paused + ')</button>' +
      '<button data-f="all" class="' + (nv.filter === 'all' ? 'on' : '') + '">ทั้งหมด (' + counts.all + ')</button></div></div>' +
      '<button class="btn" id="newCamp">+ สร้างแคมเปญ</button></div>';
    html += shown.length ? shown.map(function (x) {
      var c = x.c, st = campStats(c.name), mode = C.budgetMode(S.data, c.name);
      return '<div class="card camp-card">' +
        '<div class="cc-main" data-open="' + esc(c.id) + '">' +
        '<div class="cc-name">' + esc(c.name) + '</div>' + statusHtml(c.name) +
        '<div class="cc-meta">' + (C.firstStart(S.data, c.name) ? 'เริ่ม ' + F.thDate(C.firstStart(S.data, c.name), true) + ' · ' : '') + MODE_LABEL[mode] + ' · ' + C.adsetsOf(S.data, c.name).length + ' Ad set</div></div>' +
        '<div class="cc-stats">' +
        '<div><span>Lead</span><b>' + st.leads + '</b></div><div><span>ปิดได้</span><b>' + st.closed + '</b></div>' +
        '<div><span>ค่า Ads</span><b>' + (st.spend ? F.baht(st.spend) : '–') + '</b></div><div><span>ต้นทุน/Lead</span><b>' + F.baht(st.cpl) + '</b></div></div>' +
        '<div class="cc-actions">' + actionButtons(c.name) + '</div>' +
        missingHtml(c.name, st.cov) + '</div>';
    }).join('') : '<div class="card empty">ไม่มีแคมเปญในกลุ่มนี้</div>';
    $('#page').innerHTML = html;
    $$('[data-f]').forEach(function (b) { b.onclick = function () { nv.filter = b.dataset.f; campList(); }; });
    $('#newCamp').onclick = newCampaignDialog;
    $$('[data-open]').forEach(function (d) { d.onclick = function () { nv.camp = d.dataset.open; pageCampaigns(); window.scrollTo(0, 0); }; });
    wireActions($('#page'));
  }

  // ---------- หน้าแคมเปญ ----------
  function campDetail(cp) {
    var td = today(), st = campStats(cp.name), mode = C.budgetMode(S.data, cp.name);
    var html = '<button class="linkish back" id="back">← แคมเปญทั้งหมด</button>';
    html += '<div class="card"><div class="card-head"><div><h2 class="card-title">' + esc(cp.name) + ' <button class="linkish" id="editCp" title="แก้ชื่อ">✎</button></h2>' +
      statusHtml(cp.name, true) + '</div><div class="actions">' + actionButtons(cp.name) + '</div></div>' +
      '<div class="facts six">' +
      '<div><span>เริ่มยิง</span><b>' + (C.firstStart(S.data, cp.name) ? F.thDate(C.firstStart(S.data, cp.name), true) : '–') + '</b></div>' +
      '<div><span>ยิงไปแล้ว</span><b>' + st.days + ' วัน</b></div>' +
      '<div><span>Lead / ปิดได้</span><b>' + st.leads + ' / ' + st.closed + '</b></div>' +
      '<div><span>ค่า Ads (กรอกแล้ว)</span><b>' + (st.spend ? F.baht(st.spend) : '–') + '</b></div>' +
      '<div><span>ต้นทุน/Lead</span><b>' + F.baht(st.cpl) + '</b></div>' +
      '<div><span>ต้นทุน/เคส</span><b>' + F.baht(st.cpc) + '</b></div></div>' +
      missingHtml(cp.name, st.cov) + '</div>';

    html += '<div class="grid row-2 mt">' + timelineCard(cp, mode) + spendCard(cp, st.cov) + '</div>';
    html += adsetCard(cp, mode);
    $('#page').innerHTML = html;

    $('#back').onclick = function () { S.campNav.camp = null; pageCampaigns(); };
    $('#editCp').onclick = function () { editCampaign(cp.id); };
    wireActions($('#page'));
    $$('[data-ev]').forEach(function (r) { r.onclick = function () { editEvent(r.dataset.ev); }; });
    $$('[data-sp]').forEach(function (r) { r.onclick = function () { spendDialog(S.data.spend.filter(function (x) { return x.id === r.dataset.sp; })[0]); }; });
    $('#addAs').onclick = function () { editAdset({ campaign: cp.name }); };
    if ($('#spendAll')) $('#spendAll').onclick = function () { S.spendAll = true; campDetail(cp); };
    $$('[data-eas]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); editAdset(adsetRecs(cp.name).filter(function (a) { return a.name === b.dataset.eas; })[0]); }; });
    $$('[data-addad]').forEach(function (b) { b.onclick = function () { editAd(null, { campaign: cp.name, adset: b.dataset.addad }); }; });
    $$('[data-aid]').forEach(function (r) { r.onclick = function () { editAd(r.dataset.aid); }; });
  }

  function timelineCard(cp, mode) {
    var td = today(), daily = C.spendDaily(S.data);
    var levels = mode === 'adset' ? C.adsetsOf(S.data, cp.name).concat(['']) : [''].concat(C.adsetsOf(S.data, cp.name));
    var items = [];
    levels.forEach(function (lv) {
      var periods = C.levelPeriods(S.data, cp.name, lv, td, daily);
      var ev = C.levelEvents(S.data, cp.name, lv);
      ev.forEach(function (e, i) {
        var prev = null;
        for (var k = i - 1; k >= 0; k--) { if (ev[k].amount > 0) { prev = ev[k]; break; } }
        var p = periods.filter(function (x) { return x.event.date === e.date && x.event.id === e.id && x.event.amount === e.amount; })[0] || null;
        items.push({ e: e, lv: lv, prev: i > 0 ? ev[i - 1] : null, prevOn: prev, p: p });
      });
    });
    items.sort(function (a, b) { return a.e.date < b.e.date ? 1 : a.e.date > b.e.date ? -1 : 0; });
    var html = '<div class="card"><div class="card-head"><div><h2 class="card-title">ไทม์ไลน์ เปิด · ปรับงบ · หยุด</h2>' +
      '<div class="card-sub">' + MODE_LABEL[mode] + ' · ลืมบันทึก? กดปุ่มด้านบนแล้วเลือกวันย้อนหลังได้ · กดรายการเพื่อแก้</div></div></div>';
    if (!items.length) return html + '<div class="empty">ยังไม่มี — กด "เปิดยิง" ด้านบน</div></div>';
    html += '<div class="tl">' + items.map(function (it) {
      var e = it.e, kind, title;
      if (!(e.amount > 0)) { kind = 'off'; title = 'หยุดยิง'; }
      else if (!it.prev || !(it.prev.amount > 0)) { kind = 'on'; title = (it.prevOn ? 'เปิดยิงอีกครั้ง ' : 'เปิดยิง ') + F.baht(e.amount) + '/วัน'; }
      else {
        kind = 'adj';
        var ch = it.prev.amount ? (e.amount - it.prev.amount) / it.prev.amount : 0;
        title = 'ปรับงบ ' + F.baht(it.prev.amount) + ' → ' + F.baht(e.amount) + '/วัน <span class="chg ' + (ch >= 0 ? 'up' : 'down') + '" style="display:inline">(' + (ch >= 0 ? '+' : '') + Math.round(ch * 100) + '%)</span>';
      }
      var future = e.date > today();
      var res = '';
      if (it.p && it.p.running) {
        res = '<div class="tl-res">' + it.p.days + ' วัน' + (it.p.ongoing ? ' (ยังใช้อยู่)' : '') +
          ' · ค่า Ads ' + (it.p.spend ? F.baht(it.p.spend) : '<span class="muted">ยังไม่กรอก</span>') +
          ' · Lead ' + it.p.leads + ' (' + it.p.leadsPerDay.toFixed(1) + '/วัน' + inlineChg(it.p.lpdChange, true) + ')' +
          ' · ต้นทุน/Lead ' + F.baht(it.p.cpl) + inlineChg(it.p.cplChange, false) +
          ' · ปิดได้ ' + it.p.closed + '</div>';
      } else if (it.p && !it.p.running) {
        res = '<div class="tl-res muted">หยุด ' + it.p.days + ' วัน' + (it.p.ongoing ? ' (ถึงวันนี้)' : '') + (it.p.leads ? ' · ยังมี Lead เข้ามา ' + it.p.leads : '') + '</div>';
      }
      return '<div class="tl-item ' + kind + (e.virtual ? '' : ' click') + '"' + (e.virtual ? '' : ' data-ev="' + esc(e.id) + '"') + '>' +
        '<div class="tl-dot"></div><div class="tl-body">' +
        '<div class="tl-date">' + F.thDate(e.date, true) + (future ? ' <span class="pill info">ตั้งเวลาไว้</span>' : '') + (it.lv ? ' · <span class="muted">' + esc(it.lv) + '</span>' : '') + '</div>' +
        '<div class="tl-title">' + title + '</div>' +
        (e.note ? '<div class="tl-note">' + esc(e.note) + (e.virtual ? ' (จากวันที่ปิดเดิม)' : '') + '</div>' : '') + res + '</div></div>';
    }).join('') + '</div></div>';
    return html;
  }
  function inlineChg(v, goodUp) {
    if (v == null || !isFinite(v) || Math.abs(v) < 0.005) return '';
    var up = v > 0, good = goodUp ? up : !up;
    return ' <span class="chg ' + (good ? 'up' : 'down') + '" style="display:inline">' + (up ? '▲' : '▼') + Math.abs(v * 100).toFixed(0) + '%</span>';
  }

  function spendCard(cp, cov) {
    var list = cov.entries.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return '<div class="card"><div class="card-head"><div><h2 class="card-title">ค่า Ads ที่ใช้จริง</h2>' +
      '<div class="card-sub">รวม ' + F.baht(cov.total) + (cov.lastTo ? ' · กรอกถึง ' + F.thDate(cov.lastTo, true) : ' · ยังไม่ได้กรอก') + ' · ดูยอด Amount spent ใน Ads Manager</div></div>' +
      '<button class="btn sm" data-spend="' + esc(cp.name) + '">+ กรอกค่า Ads</button></div>' +
      (list.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>ช่วงวันที่</th><th>ระดับ</th><th class="r">ยอด</th><th class="r">เฉลี่ย/วัน</th></tr></thead><tbody>' +
        list.slice(0, S.spendAll ? 500 : 8).map(function (s) {
          var to = s.date_to || s.date, n = C.daysIncl(s.date, to);
          return '<tr class="click" data-sp="' + esc(s.id) + '"><td class="num">' + F.thRange(s.date, to) + (s.note ? '<div class="muted" style="font-size:12.5px">' + esc(s.note) + '</div>' : '') + '</td>' +
            '<td class="muted">' + (s.adset ? esc(s.adset) : 'ทั้งแคมเปญ') + '</td><td class="r num">' + F.baht(Number(s.amount)) + '</td><td class="r num muted">' + F.baht(Number(s.amount) / n) + '</td></tr>';
        }).join('') + '</tbody></table></div>' + (list.length > 8 && !S.spendAll ? '<button class="linkish" id="spendAll" style="margin-top:8px">ดูทั้งหมด (' + list.length + ' รายการ)</button>' : '') : '<div class="empty">ยังไม่มี — กด "+ กรอกค่า Ads"</div>') + '</div>';
  }

  function adsetCard(cp, mode) {
    var td = today(), sets = adsetRecs(cp.name);
    var people = C.uniquePeople(S.data.chats.filter(function (c) { return c.campaign === cp.name; })).filter(function (p) { return C.stageOf(p.status) >= 1; });
    function leadsOf(f) { return people.filter(f).length; }
    var html = '<div class="card mt"><div class="card-head"><div><h2 class="card-title">Ad set และโฆษณา</h2><div class="card-sub">โฆษณาที่ "แสดงในบันทึกแชท" คือรายการที่แอดมินเลือกตอนบันทึกแชท</div></div>' +
      '<button class="btn sm" id="addAs">+ Ad set</button></div>';
    if (!sets.length) return html + '<div class="empty">ยังไม่มี Ad set</div></div>';
    html += sets.map(function (a) {
      var ads = S.data.ads.filter(function (d) { return d.campaign === cp.name && d.adset === a.name; });
      var ls = mode === 'adset' ? C.levelState(S.data, cp.name, a.name, td) : null;
      var ctl = '';
      if (ls) {
        ctl = '<span class="as-state">' + (ls.state === 'running' ? '<span class="sdot on"></span>' + F.baht(ls.amount) + '/วัน' : '<span class="sdot off"></span>หยุด') + '</span>' +
          (ls.state === 'running'
            ? '<button class="btn ghost sm" data-act="adjust" data-camp="' + esc(cp.name) + '" data-level="' + esc(a.name) + '">ปรับงบ</button><button class="btn ghost sm" data-act="off" data-camp="' + esc(cp.name) + '" data-level="' + esc(a.name) + '">หยุด</button>'
            : '<button class="btn ghost sm" data-act="on" data-camp="' + esc(cp.name) + '" data-level="' + esc(a.name) + '">เปิด</button>');
      }
      return '<div class="as-block"><div class="as-head"><div class="as-name">' + esc(a.name) + ' <button class="linkish" data-eas="' + esc(a.name) + '">✎</button>' +
        '<div class="muted" style="font-size:13px">' + ads.length + ' โฆษณา · Lead ' + leadsOf(function (p) { return p.adset === a.name; }) + '</div></div>' +
        '<div class="actions">' + ctl + '</div></div>' +
        '<div class="as-ads">' + ads.map(function (d) {
          return '<div class="ad-row click" data-aid="' + esc(d.id) + '">' + (d.creative_url ? '<img class="thumb" src="' + esc(d.creative_url) + '" alt="" loading="lazy">' : '<div class="thumb"></div>') +
            '<div class="ad-name">' + esc(d.ad_name) + '</div>' +
            (d.post_url ? '<a href="' + esc(d.post_url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + I.link + '</a>' : '') +
            '<span class="muted num">Lead ' + leadsOf(function (p) { return p.ad === d.ad_name; }) + '</span>' +
            (isTrue(d.active) ? '<span class="pill good">แสดงในบันทึกแชท</span>' : '<span class="pill">ซ่อน</span>') + '</div>';
        }).join('') + '<button class="linkish addad" data-addad="' + esc(a.name) + '">+ โฆษณา</button></div></div>';
    }).join('') + '</div>';
    return html;
  }

  // ---------- บันทึกงบ ----------
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
  function saveCampRec(cp, patch) {
    return API.call('saveCampaign', { campaign: Object.assign({}, cp, patch) }).then(function (saved) {
      var i = S.data.campaigns.findIndex(function (x) { return x.id === saved.id; });
      if (i >= 0) S.data.campaigns[i] = saved; else S.data.campaigns.push(saved);
      return saved;
    });
  }
  /** แปลงวันที่ปิดแบบเก่า (end_date) เป็นเหตุการณ์ "หยุด" จริง แล้วล้าง end_date */
  function materialize(camp) {
    var cp = S.data.campaigns.filter(function (c) { return c.name === camp; })[0];
    if (!cp || !cp.end_date) return Promise.resolve();
    var chain = Promise.resolve();
    [''].concat(C.adsetsOf(S.data, camp)).forEach(function (lv) {
      C.levelEvents(S.data, camp, lv).filter(function (e) { return e.virtual; }).forEach(function (v) {
        chain = chain.then(function () { return saveBudgetSmart({ campaign: camp, adset: lv, start_date: v.date, daily_budget: 0, note: 'ปิดแคมเปญ' }); });
      });
    });
    return chain.then(function () { return saveCampRec(cp, { end_date: '' }); });
  }
  /** ให้วันที่เริ่มยิงในชีต = วันแรกที่เปิดยิง */
  function syncStart(camp) {
    var cp = S.data.campaigns.filter(function (c) { return c.name === camp; })[0];
    var first = C.firstStart(S.data, camp);
    if (cp && first && (cp.start_date !== first || cp.end_date)) return saveCampRec(cp, { start_date: first, end_date: '' });
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

  /**
   * เปิดยิง / ปรับงบ / หยุดยิง
   * kind: 'on' | 'adjust' | 'off' · levels: null = ตามวิธีตั้งงบของแคมเปญ
   */
  function eventDialog(camp, kind, levels) {
    var td = today(), mode = C.budgetMode(S.data, camp);
    if (!levels) {
      if (mode === 'campaign') levels = [''];
      else {
        levels = C.adsetsOf(S.data, camp);
        if (kind !== 'on') levels = levels.filter(function (a) { return C.levelState(S.data, camp, a, td).state === 'running'; });
        if (!levels.length) levels = [''];
      }
    }
    var states = levels.map(function (lv) { return C.levelState(S.data, camp, lv, td); });
    var T = { on: 'เปิดยิง', adjust: 'ปรับงบ', off: 'หยุดยิง' }[kind];
    var ph = { on: 'รอบนี้ทดลองอะไร เช่น ครีเอทีฟใหม่', adjust: 'ทดลองอะไร เช่น เพิ่มงบดูว่า Lead/วัน ขึ้นตามไหม', off: 'เหตุผลที่หยุด' }[kind];
    var rows = '';
    if (kind !== 'off') {
      rows = '<div class="c12"><table class="t"><tbody>' + levels.map(function (lv, i) {
        var cur = kind === 'adjust' ? states[i].amount : states[i].lastAmount;
        return '<tr><td>' + (lv ? esc(lv) : '<span class="pill info">ทั้งแคมเปญ</span>') +
          (kind === 'adjust' ? '<div class="muted" style="font-size:12.5px">ตอนนี้ ' + F.baht(cur) + '/วัน</div>' : '') + '</td>' +
          '<td class="r" style="width:270px"><input class="bk" data-lv="' + esc(lv) + '" data-old="' + esc(kind === 'adjust' ? cur : '') + '" type="number" min="1" inputmode="numeric" value="' + esc(cur || '') + '" placeholder="งบ/วัน">' +
          (kind === 'adjust' && cur ? '<div class="chips-row r"><button type="button" class="chip" data-pct="-0.2" data-i="' + i + '">−20%</button><button type="button" class="chip" data-pct="0.2" data-i="' + i + '">+20%</button><button type="button" class="chip" data-pct="0.5" data-i="' + i + '">+50%</button></div>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';
    } else {
      rows = '<div class="c12 muted">หยุด: ' + levels.map(function (lv) { return lv ? esc(lv) : 'ทั้งแคมเปญ'; }).join(', ') + '</div>';
    }
    modal('<h3>' + T + ' — ' + esc(camp) + '</h3><form id="evForm" class="form-grid">' +
      '<div class="f c12"><label>' + (kind === 'off' ? 'หยุดตั้งแต่วันที่' : kind === 'on' ? 'เริ่มยิงวันที่' : 'ใช้งบใหม่ตั้งแต่วันที่') + '</label>' +
      '<div class="date-line"><input type="date" id="evDate" value="' + td + '" required>' + dateChips('evDate') + '</div></div>' +
      (kind !== 'off' ? '<div class="f c12"><label>งบที่ตั้ง/วัน (บาท)' + (levels.length > 1 ? ' — เว้นว่าง = ไม่เปลี่ยน' : '') + '</label></div>' : '') + rows +
      '<div class="f c12"><label>' + (kind === 'off' ? 'หมายเหตุ' : 'สิ่งที่ทดลอง / เหตุผล') + '</label><input id="evNote" placeholder="' + ph + '"></div>' +
      '<div class="c12 actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">' + T + '</button></div></form>',
      function (el, close) {
        wireDateChips(el);
        $$('[data-pct]', el).forEach(function (b) {
          b.onclick = function () { var inp = $$('.bk', el)[Number(b.dataset.i)]; inp.value = Math.round(Number(inp.dataset.old) * (1 + Number(b.dataset.pct))); };
        });
        $('#evForm', el).onsubmit = function (e) {
          e.preventDefault();
          var date = $('#evDate', el).value, note = $('#evNote', el).value.trim();
          var todo = [];
          if (kind === 'off') levels.forEach(function (lv) { todo.push({ adset: lv, amount: 0 }); });
          else $$('.bk', el).forEach(function (i) {
            if (i.value === '') return;
            if (kind === 'adjust' && String(i.value) === String(i.dataset.old)) return;
            if (!(Number(i.value) > 0)) return;
            todo.push({ adset: i.dataset.lv, amount: Number(i.value) });
          });
          if (!todo.length) return toast(kind === 'adjust' ? 'ยังไม่ได้เปลี่ยนงบ' : 'ใส่งบ/วันก่อน', true);
          var chain = materialize(camp);
          todo.forEach(function (t) {
            chain = chain.then(function () { return saveBudgetSmart({ campaign: camp, adset: t.adset, start_date: date, daily_budget: t.amount, note: note }); });
          });
          chain.then(function () { return syncStart(camp); })
            .then(function () { close(); toast(T + 'แล้ว'); pageCampaigns(); }).catch(fail);
        };
      });
  }

  function editEvent(id) {
    var b = S.data.budgets.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    var off = !(Number(b.daily_budget) > 0);
    modal('<h3>แก้รายการ — ' + (off ? 'หยุดยิง' : 'งบ ' + F.baht(b.daily_budget) + '/วัน') + '</h3><form id="eeForm" class="form-grid">' +
      '<div class="f c12"><label>' + esc(b.campaign) + (b.adset ? ' · ' + esc(b.adset) : '') + '</label></div>' +
      '<div class="f c6"><label>วันที่</label><input type="date" id="eeDate" value="' + esc(b.start_date) + '" required></div>' +
      '<div class="f c6"><label>งบ/วัน (0 = หยุดยิง)</label><input type="number" id="eeAmt" min="0" value="' + esc(b.daily_budget) + '" required></div>' +
      '<div class="f c12"><label>หมายเหตุ / สิ่งที่ทดลอง</label><input id="eeNote" value="' + esc(b.note || '') + '"></div>' +
      '<div class="c12 actions" style="justify-content:space-between"><button type="button" class="btn danger" id="eeDel">ลบรายการนี้</button>' +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#eeForm', el).onsubmit = function (e) {
          e.preventDefault();
          saveBudgetSmart(Object.assign({}, b, { start_date: $('#eeDate', el).value, daily_budget: $('#eeAmt', el).value, note: $('#eeNote', el).value.trim() }))
            .then(function () { return syncStart(b.campaign); }).then(function () { close(); toast('บันทึกแล้ว'); pageCampaigns(); }).catch(fail);
        };
        $('#eeDel', el).onclick = function () {
          if (!window.confirm('ลบรายการนี้ออกจากไทม์ไลน์?')) return;
          API.call('deleteBudget', { id: b.id }).then(function () {
            S.data.budgets = S.data.budgets.filter(function (x) { return x.id !== b.id; });
            return syncStart(b.campaign);
          }).then(function () { close(); toast('ลบแล้ว'); pageCampaigns(); }).catch(fail);
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
          if (overlap.length && !window.confirm('ช่วงวันที่นี้ทับกับที่กรอกไว้แล้ว ' + overlap.length + ' รายการ — ยอดจะนับซ้ำ บันทึกต่อไหม?')) return;
          API.call('saveSpend', { spend: rec }).then(function (saved) {
            var i = S.data.spend.findIndex(function (x) { return x.id === saved.id; });
            if (i >= 0) S.data.spend[i] = saved; else S.data.spend.push(saved);
            close(); toast('บันทึกค่า Ads แล้ว'); render();
          }).catch(fail);
        };
        if ($('#spDel', el)) $('#spDel', el).onclick = function () {
          if (!window.confirm('ลบรายการค่า Ads นี้?')) return;
          API.call('deleteSpend', { id: sp.id }).then(function () {
            S.data.spend = S.data.spend.filter(function (x) { return x.id !== sp.id; }); close(); toast('ลบแล้ว'); render();
          }).catch(fail);
        };
      });
  }

  // ---------- สร้างแคมเปญ (ครบในหน้าเดียว) ----------
  function newCampaignDialog() {
    function asRow(i) {
      return '<tr><td><input class="nc-as" placeholder="ชื่อ Ad set เช่น Ad Set A : iPhone 11–13"></td>' +
        '<td><input class="nc-ad" placeholder="ชื่อโฆษณา (เว้นว่าง = ชื่อเดียวกับ Ad set)"></td>' +
        '<td class="abo-only" style="width:120px"><input class="nc-bd" type="number" min="1" inputmode="numeric" placeholder="งบ/วัน"></td>' +
        '<td style="width:36px"><button type="button" class="linkish nc-del">✕</button></td></tr>';
    }
    modal('<h3>สร้างแคมเปญ</h3><form id="ncForm" class="form-grid">' +
      '<div class="f c12"><label>ชื่อแคมเปญ (ตรงกับใน Ads Manager)</label><input id="ncName" required></div>' +
      '<div class="f c12"><label>เริ่มยิงวันที่</label><div class="date-line"><input type="date" id="ncDate" value="' + today() + '" required>' + dateChips('ncDate') + '</div></div>' +
      '<div class="f c12"><label>ตั้งงบที่</label><div class="seg2"><label><input type="radio" name="ncMode" value="campaign" checked> ทั้งแคมเปญ (CBO)</label><label><input type="radio" name="ncMode" value="adset"> แยกราย Ad set</label></div></div>' +
      '<div class="f c6 cbo-only"><label>งบ/วัน ทั้งแคมเปญ (บาท)</label><input type="number" id="ncBudget" min="1" inputmode="numeric"></div>' +
      '<div class="f c12"><label>Ad set และโฆษณา</label><table class="t nc-table"><tbody id="ncRows">' + asRow(0) + '</tbody></table>' +
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
          var name = $('#ncName', el).value.trim(), date = $('#ncDate', el).value, m = mode(), note = $('#ncNote', el).value.trim();
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
          if (m === 'campaign') chain = chain.then(function () { return saveBudgetSmart({ campaign: name, adset: '', start_date: date, daily_budget: $('#ncBudget', el).value, note: note || 'เริ่มยิง' }); });
          else rows.forEach(function (r) {
            if (Number(r.bd) > 0) chain = chain.then(function () { return saveBudgetSmart({ campaign: name, adset: r.as, start_date: date, daily_budget: r.bd, note: note || 'เริ่มยิง' }); });
          });
          chain.then(function () {
            var cp = S.data.campaigns.filter(function (c) { return c.name === name; })[0];
            S.campNav = { camp: cp ? cp.id : null, filter: 'active' };
            close(); toast('สร้างแคมเปญแล้ว'); pageCampaigns();
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
      '<div class="c12 muted" style="font-size:13px">วันที่เริ่ม/หยุด/งบ ไม่ต้องแก้ที่นี่ — ใช้ปุ่ม เปิดยิง / ปรับงบ / หยุดยิง แล้วดูในไทม์ไลน์</div>' +
      '<div class="c12 actions" style="justify-content:space-between">' + (!used ? '<button type="button" class="btn danger" id="cpDel">ลบแคมเปญ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#cpForm', el).onsubmit = function (e) {
          e.preventDefault();
          var oldName = c.name;
          saveCampRec(c, { name: $('#cpName', el).value.trim(), note: $('#cpNote', el).value.trim() }).then(function (saved) {
            if (oldName !== saved.name) {
              [S.data.ads, S.data.chats, S.data.budgets, S.data.adsets, S.data.spend].forEach(function (list) { list.forEach(function (x) { if (x.campaign === oldName) x.campaign = saved.name; }); });
            }
            close(); toast('บันทึกแล้ว'); pageCampaigns();
          }).catch(fail);
        };
        if ($('#cpDel', el)) $('#cpDel', el).onclick = function () {
          if (!window.confirm('ลบแคมเปญ ' + c.name + ' ?')) return;
          API.call('deleteCampaign', { id: c.id }).then(function () {
            S.data.campaigns = S.data.campaigns.filter(function (x) { return x.id !== c.id; });
            S.data.budgets = S.data.budgets.filter(function (x) { return x.campaign !== c.name; });
            S.campNav = { camp: null, filter: 'active' }; close(); toast('ลบแล้ว'); pageCampaigns();
          }).catch(fail);
        };
      });
  }

  function editAdset(a) {
    var isNew = !a.id && !a.name;
    var used = !isNew && (S.data.ads.some(function (x) { return x.campaign === a.campaign && x.adset === a.name; }) || S.data.chats.some(function (x) { return x.campaign === a.campaign && x.adset === a.name; }));
    var mode = C.budgetMode(S.data, a.campaign);
    modal('<h3>' + (isNew ? 'เพิ่ม Ad set' : 'แก้ไข Ad set') + '</h3><form id="asForm" class="form-grid">' +
      '<div class="f c12"><label>ชื่อ Ad set (ตรงกับใน Ads Manager)</label><input id="asName" value="' + esc(a.name || '') + '" required>' + (used ? '<div class="hint">เปลี่ยนชื่อได้ — แชท/โฆษณา/งบเดิมเปลี่ยนตามให้</div>' : '') + '</div>' +
      (isNew ? '<div class="f c12"><label>ชื่อโฆษณาแรก (เว้นว่าง = ชื่อเดียวกับ Ad set)</label><input id="asAd"></div>' : '') +
      (isNew && mode === 'adset' ? '<div class="f c6"><label>งบ/วัน (เริ่มวันนี้)</label><input type="number" id="asBudget" min="1" inputmode="numeric"></div>' : '') +
      '<div class="c12 actions" style="justify-content:space-between">' + (!isNew && !used && a.id ? '<button type="button" class="btn danger" id="asDel">ลบ</button>' : '<span></span>') +
      '<span class="actions"><button type="button" class="btn ghost" data-close>ยกเลิก</button><button class="btn" type="submit">บันทึก</button></span></div></form>',
      function (el, close) {
        $('#asForm', el).onsubmit = function (e) {
          e.preventDefault();
          var oldName = a.name, name = $('#asName', el).value.trim();
          var adName = $('#asAd', el) ? $('#asAd', el).value.trim() : '';
          var bd = $('#asBudget', el) ? $('#asBudget', el).value : '';
          API.call('saveAdset', { adset: { id: a.id || '', campaign: a.campaign, name: name, active: true, note: a.note || '' } }).then(function (saved) {
            var i = S.data.adsets.findIndex(function (x) { return x.id === saved.id; });
            if (i >= 0) S.data.adsets[i] = saved; else S.data.adsets.push(saved);
            if (oldName && oldName !== saved.name) {
              [S.data.ads, S.data.chats, S.data.budgets, S.data.spend].forEach(function (list) { list.forEach(function (x) { if (x.campaign === saved.campaign && x.adset === oldName) x.adset = saved.name; }); });
            }
            var chain = Promise.resolve();
            if (isNew) chain = chain.then(function () {
              return API.call('saveAd', { ad: { campaign: a.campaign, adset: name, ad_name: adName || name, active: true, post_url: '', creative_url: '', note: '' } }).then(function (s) { S.data.ads.push(s); });
            });
            if (Number(bd) > 0) chain = chain.then(function () { return saveBudgetSmart({ campaign: a.campaign, adset: name, start_date: today(), daily_budget: bd, note: 'เริ่มยิง' }); });
            return chain;
          }).then(function () { close(); toast('บันทึก Ad set แล้ว'); pageCampaigns(); }).catch(fail);
        };
        if ($('#asDel', el)) $('#asDel', el).onclick = function () {
          if (!window.confirm('ลบ Ad set ' + a.name + ' ?')) return;
          API.call('deleteAdset', { id: a.id }).then(function () {
            S.data.adsets = S.data.adsets.filter(function (x) { return x.id !== a.id; });
            S.data.budgets = S.data.budgets.filter(function (b) { return !(b.campaign === a.campaign && b.adset === a.name); });
            close(); toast('ลบแล้ว'); pageCampaigns();
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
