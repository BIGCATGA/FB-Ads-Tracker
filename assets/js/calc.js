/**
 * Calc — กติกาการนับทั้งหมดอยู่ที่ไฟล์นี้ไฟล์เดียว
 */
(function () {
  var STATUSES = [
    { key: '1-ทักแล้วเงียบ', short: 'ทักแล้วเงียบ', stage: 1, color: 'var(--st-1)' },
    { key: '2-มีข้อมูลเครื่อง', short: 'มีข้อมูลเครื่อง', stage: 2, color: 'var(--st-2)' },
    { key: 'X-ของไม่ตรง', short: 'ของไม่ตรง', stage: 2, color: 'var(--st-x)' },
    { key: '3-ประเมินราคาแล้ว', short: 'ประเมินราคาแล้ว', stage: 3, color: 'var(--st-3)' },
    { key: '7-สินค้าไม่รับซื้อ', short: 'สินค้าไม่รับซื้อ', stage: 3, color: 'var(--st-7)' },
    { key: '4-นัดรับของ', short: 'นัดรับของ', stage: 4, color: 'var(--st-4)' },
    { key: '5-ปิดการขาย', short: 'ปิดการขาย', stage: 5, color: 'var(--st-5)' },
    { key: '6-ขอซื้อสินค้า', short: 'ขอซื้อสินค้า (ฝั่งขาย)', stage: 0, color: 'var(--st-6)' }
  ];
  var BY_KEY = {};
  STATUSES.forEach(function (s) { BY_KEY[s.key] = s; });
  var STAGES = ['ทักเข้ามา', 'มีข้อมูลเครื่อง', 'ประเมินราคา', 'นัดรับของ', 'ปิดการขาย'];

  function stageOf(status) { return BY_KEY[status] ? BY_KEY[status].stage : 0; }
  function normName(s) { return String(s || '').toLowerCase().replace(/[\s'’"`.]+/g, ''); }
  function dupKey(c) { return (c.campaign || '') + '|' + normName(c.customer); }

  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function addDays(s, n) { var d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function dayList(from, to) {
    var out = [], d = from, guard = 0;
    while (d <= to && guard++ < 1000) { out.push(d); d = addDays(d, 1); }
    return out;
  }

  /** ป้ายซ้ำ: คืน map id → true ถ้าชื่อเดียวกันในแคมเปญเดียวกันมีมากกว่า 1 แถว */
  function dupMap(chats) {
    var groups = {};
    chats.forEach(function (c) { var k = dupKey(c); (groups[k] = groups[k] || []).push(c.id); });
    var out = {};
    Object.keys(groups).forEach(function (k) { if (groups[k].length > 1) groups[k].forEach(function (id) { out[id] = true; }); });
    return out;
  }

  /** ลูกค้าไม่ซ้ำ: เลือกแถวที่ไปได้ไกลสุด ใช้วันที่ของแถวแรกเป็นวันที่ทักเข้ามา */
  function uniquePeople(chats) {
    var groups = {};
    chats.forEach(function (c) { var k = dupKey(c); (groups[k] = groups[k] || []).push(c); });
    return Object.keys(groups).map(function (k) {
      var rows = groups[k].slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      var best = rows[0];
      rows.forEach(function (r) {
        var sr = stageOf(r.status), sb = stageOf(best.status);
        if (sr > sb || (sr === sb && r.status === '5-ปิดการขาย')) best = r;
      });
      return Object.assign({}, best, { firstDate: rows[0].date, rows: rows.length });
    });
  }

  function presetRange(preset, data, today) {
    today = today || iso(new Date());
    if (preset === '7d') return { from: addDays(today, -6), to: today };
    if (preset === '30d') return { from: addDays(today, -29), to: today };
    if (preset === '3m') return { from: addDays(today, -91), to: today };
    if (preset === '6m') return { from: addDays(today, -182), to: today };
    if (preset === '1y') return { from: addDays(today, -364), to: today };
    if (preset === 'month') return { from: today.slice(0, 8) + '01', to: today };
    if (preset === 'lastmonth') {
      var d = new Date(today.slice(0, 8) + '01T00:00:00'); d.setDate(0);
      return { from: iso(d).slice(0, 8) + '01', to: iso(d) };
    }
    // all
    var dates = data.chats.map(function (c) { return c.date; }).concat((data.campaigns || []).map(function (c) { return c.start_date; })).filter(Boolean).sort();
    return { from: dates[0] || today, to: dates[dates.length - 1] || today };
  }

  function actionFor(row, target) {
    if (row.cbo) return { text: 'ดูที่ระดับแคมเปญ', tone: '' };
    if (!row.spend) return { text: 'ยังไม่กรอกค่า Ads', tone: 'info' };
    if (!row.closed) {
      if (row.spend >= target) return { text: 'ใช้เกินเป้า ยังไม่ปิด — พิจารณาหยุด', tone: 'bad' };
      return { text: 'รอข้อมูลเพิ่ม', tone: '' };
    }
    if (row.cpc <= target) return { text: 'คุ้ม — เพิ่มงบได้', tone: 'good' };
    if (row.cpc <= target * 1.5) return { text: 'ปรับครีเอทีฟ/กลุ่มเป้าหมาย', tone: 'warn' };
    return { text: 'ลดงบหรือหยุด', tone: 'bad' };
  }

  /**
   * คำนวณ Dashboard
   * opts = { from, to, campaign }
   */
  function compute(data, opts) {
    var from = opts.from, to = opts.to, camp = opts.campaign || '';
    var target = Number(data.config.target_cost_per_case) || 1000;

    // adset → campaign (จากตาราง Ads และจากแชท)
    var adsetCamp = {};
    data.ads.forEach(function (a) { if (a.adset) adsetCamp[a.adset] = a.campaign; });
    data.chats.forEach(function (c) { if (c.adset && !adsetCamp[c.adset]) adsetCamp[c.adset] = c.campaign; });

    var chats = data.chats.filter(function (c) { return c.date >= from && c.date <= to && (!camp || c.campaign === camp); });
    var spend = spendDaily(data).filter(function (s) { return s.date >= from && s.date <= to && (!camp || s.campaign === camp); });
    var people = uniquePeople(chats);

    var funnelPeople = people.filter(function (p) { return stageOf(p.status) >= 1; });
    var closedPeople = people.filter(function (p) { return p.status === '5-ปิดการขาย'; });
    var salesLeads = people.filter(function (p) { return p.status === '6-ขอซื้อสินค้า'; });

    var totalSpend = sum(spend, 'amount');
    var totalAmount = closedPeople.reduce(function (a, p) { return a + (Number(p.amount) || 0); }, 0);
    var spendDays = {};
    spend.forEach(function (s) { if (Number(s.amount) > 0) spendDays[s.date] = true; });
    var nSpendDays = Object.keys(spendDays).length;

    var statusCounts = STATUSES.map(function (s) {
      var n = people.filter(function (p) { return p.status === s.key; }).length;
      return { key: s.key, short: s.short, color: s.color, stage: s.stage, n: n, pct: people.length ? n / people.length : 0 };
    });

    var funnel = STAGES.map(function (name, i) {
      var n = funnelPeople.filter(function (p) { return stageOf(p.status) >= i + 1; }).length;
      return { stage: i + 1, name: name, n: n, pct: funnelPeople.length ? n / funnelPeople.length : 0 };
    });
    funnel.forEach(function (f, i) { f.conv = i === 0 ? 1 : (funnel[i - 1].n ? f.n / funnel[i - 1].n : 0); });
    // จุดรั่ว = ขั้นที่อัตราผ่านต่ำสุด (ข้ามขั้นแรก)
    var leak = null;
    funnel.slice(1).forEach(function (f) { if (funnel[f.stage - 2].n > 0 && (!leak || f.conv < leak.conv)) leak = f; });

    // รายวัน
    var days = dayList(from, to);
    var idx = {};
    var daily = days.map(function (d, i) { idx[d] = i; return { date: d, leads: 0, closed: 0, spend: 0, amount: 0 }; });
    funnelPeople.forEach(function (p) { if (idx[p.firstDate] !== undefined) daily[idx[p.firstDate]].leads++; });
    closedPeople.forEach(function (p) { if (idx[p.date] !== undefined) { daily[idx[p.date]].closed++; daily[idx[p.date]].amount += Number(p.amount) || 0; } });
    spend.forEach(function (s) { if (idx[s.date] !== undefined) daily[idx[s.date]].spend += Number(s.amount) || 0; });

    // ตาม Ad set
    var adsets = {};
    function as(name) {
      return adsets[name] = adsets[name] || { adset: name, campaign: adsetCamp[name] || '', spend: 0, leads: 0, closed: 0, amount: 0 };
    }
    var cboCamp = {};
    spend.forEach(function (s) { if (s.adset) as(s.adset).spend += s.amount; else cboCamp[s.campaign] = true; });
    funnelPeople.forEach(function (p) { as(p.adset || '(ไม่ระบุ)').leads++; });
    closedPeople.forEach(function (p) { var r = as(p.adset || '(ไม่ระบุ)'); r.closed++; r.amount += Number(p.amount) || 0; });
    var adsetRows = Object.keys(adsets).map(function (k) {
      var r = adsets[k];
      r.cbo = !r.spend && !!cboCamp[r.campaign];
      r.cpl = r.leads && r.spend ? r.spend / r.leads : null;
      r.cpc = r.closed && r.spend ? r.spend / r.closed : null;
      r.action = actionFor(r, target);
      var bd = r.campaign ? budgetAt(data, r.campaign, r.adset, to) : null;
      r.dailyBudget = bd ? Number(bd.daily_budget) : null;
      r.budgetLevel = bd ? bd.level : '';
      return r;
    }).sort(function (a, b) { return b.spend - a.spend || b.leads - a.leads; });

    // ตามแคมเปญ
    var cmap = {};
    function cr(name) { return cmap[name] = cmap[name] || { campaign: name, spend: 0, leads: 0, closed: 0, amount: 0 }; }
    spend.forEach(function (s) { cr(s.campaign).spend += s.amount; });
    funnelPeople.forEach(function (p) { cr(p.campaign || '(ไม่ระบุ)').leads++; });
    closedPeople.forEach(function (p) { var r = cr(p.campaign || '(ไม่ระบุ)'); r.closed++; r.amount += Number(p.amount) || 0; });
    var campaignRows = Object.keys(cmap).map(function (k) {
      var r = cmap[k];
      r.cpl = r.leads && r.spend ? r.spend / r.leads : null;
      r.cpc = r.closed && r.spend ? r.spend / r.closed : null;
      r.action = actionFor(r, target);
      return r;
    }).sort(function (a, b) { return b.spend - a.spend || b.leads - a.leads; });

    // ตามตัวโฆษณา
    var ads = {};
    people.forEach(function (p) {
      var k = p.ad || '(ไม่ระบุ)';
      var r = ads[k] = ads[k] || { ad: k, adset: p.adset, chats: 0, quality: 0, closed: 0 };
      if (stageOf(p.status) >= 1) r.chats++;
      if (stageOf(p.status) >= 2 && p.status !== 'X-ของไม่ตรง') r.quality++;
      if (p.status === '5-ปิดการขาย') r.closed++;
    });
    var adRows = Object.keys(ads).map(function (k) {
      var r = ads[k];
      r.qualityPct = r.chats ? r.quality / r.chats : null;
      r.verdict = r.chats < 5 ? { text: 'ข้อมูลยังน้อย', tone: '' }
        : r.qualityPct >= 0.6 ? { text: 'ดึงคนคุณภาพ', tone: 'good' }
        : r.qualityPct >= 0.35 ? { text: 'พอใช้', tone: 'warn' } : { text: 'คนไม่ตรงกลุ่ม', tone: 'bad' };
      return r;
    }).sort(function (a, b) { return b.chats - a.chats; });

    return {
      from: from, to: to, campaign: camp, target: target,
      chats: chats, people: people, closedPeople: closedPeople,
      leads: funnelPeople.length, closed: closedPeople.length, salesLeads: salesLeads.length,
      rawRows: chats.length, dupRows: chats.length - people.length,
      spend: totalSpend, amount: totalAmount, spendDays: nSpendDays,
      avgPerDay: nSpendDays ? totalSpend / nSpendDays : 0,
      cpl: funnelPeople.length ? totalSpend / funnelPeople.length : null,
      cpc: closedPeople.length ? totalSpend / closedPeople.length : null,
      closeRate: funnelPeople.length ? closedPeople.length / funnelPeople.length : 0,
      adsPct: totalAmount ? totalSpend / totalAmount : null,
      quoteRate: funnelPeople.length ? funnel[2].n / funnelPeople.length : 0,
      statusCounts: statusCounts, funnel: funnel, leak: leak, daily: daily,
      adsetRows: adsetRows, adRows: adRows, campaignRows: campaignRows,
      closeList: closeDurations(people), closeStats: durationStats(closeDurations(people))
    };
  }

  // ============================================================
  // แคมเปญ: "รอบการยิง" (เก็บในแท็บ Budgets)
  //   1 แถว = 1 รอบ: ยิงด้วยงบ/วันเดียวกัน ตั้งแต่ start_date ถึง end_date (ว่าง = ยังยิงอยู่)
  //   adset ว่าง = ทั้งแคมเปญ (CBO), มีชื่อ = งบราย Ad set
  //   อ่านข้อมูลแบบเก่าได้ด้วย: แถวไม่มี end_date → จบก่อนแถวถัดไป 1 วัน · แถวงบ 0 = หยุด · end_date ของแคมเปญ = วันจบ
  // ============================================================
  function daysIncl(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000) + 1; }
  function findCampaign(data, camp) { return (data.campaigns || []).filter(function (c) { return c.name === camp; })[0] || null; }

  function adsetsOf(data, camp) {
    var set = {};
    (data.adsets || []).forEach(function (a) { if (a.campaign === camp && a.name) set[a.name] = true; });
    data.ads.forEach(function (a) { if (a.campaign === camp && a.adset) set[a.adset] = true; });
    data.chats.forEach(function (c) { if (c.campaign === camp && c.adset) set[c.adset] = true; });
    (data.budgets || []).forEach(function (b) { if (b.campaign === camp && b.adset) set[b.adset] = true; });
    return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'th'); });
  }

  /** รอบการยิงของ 1 ระดับ เรียงตามวันเริ่ม → [{id, row, from, to(null = ยังยิงอยู่), amount, note, legacy}] */
  function runsOf(data, camp, adset) {
    adset = adset || '';
    var rows = (data.budgets || []).filter(function (b) { return b.campaign === camp && (b.adset || '') === adset; })
      .slice().sort(function (a, b) { return a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0; });
    var cp = findCampaign(data, camp);
    var out = [];
    rows.forEach(function (r, i) {
      var amt = Number(r.daily_budget) || 0;
      if (!(amt > 0)) return; // แถวงบ 0 แบบเก่า = หยุด (ใช้เป็นจุดจบของแถวก่อนหน้า)
      var to = r.end_date || null, legacy = false;
      if (!to && rows[i + 1]) { to = addDays(rows[i + 1].start_date, -1); legacy = true; }
      if (!to && cp && cp.end_date && cp.end_date >= r.start_date) { to = cp.end_date; legacy = true; }
      out.push({ id: r.id, row: r, campaign: camp, adset: adset, from: r.start_date, to: to, amount: amt, note: r.note || '', legacy: legacy });
    });
    return out;
  }
  /** แคมเปญนี้มีข้อมูลแบบเก่าที่ควรเขียนให้ชัด (end_date) ไหม */
  function needsNormalize(data, camp) {
    var cp = findCampaign(data, camp);
    if (cp && cp.end_date) return true;
    return (data.budgets || []).some(function (b) { return b.campaign === camp && !(Number(b.daily_budget) > 0); }) ||
      [''].concat(adsetsOf(data, camp)).some(function (lv) { return runsOf(data, camp, lv).some(function (r) { return r.legacy; }); });
  }

  function budgetMode(data, camp) {
    var last = null;
    (data.budgets || []).forEach(function (b) {
      if (b.campaign !== camp || !(Number(b.daily_budget) > 0)) return;
      if (!last || b.start_date >= last.start_date) last = b;
    });
    return last && last.adset ? 'adset' : 'campaign';
  }

  function activeRun(runs, date) {
    var hit = null;
    runs.forEach(function (r) { if (r.from <= date && (!r.to || r.to >= date)) hit = r; });
    return hit;
  }

  /** สถานะของ 1 ระดับ ณ วันที่ today */
  function levelState(data, camp, adset, today) {
    var runs = runsOf(data, camp, adset);
    var cur = activeRun(runs, today);
    var future = runs.filter(function (r) { return r.from > today; });
    var past = runs.filter(function (r) { return r.from <= today; });
    var last = past[past.length - 1] || null;
    // รอบที่จบวันนี้ = กดหยุดแล้ว (วันนี้ยังนับเป็นวันยิงวันสุดท้าย)
    var live = cur && (!cur.to || cur.to > today) ? cur : null;
    var st = live ? 'running' : past.length ? 'paused' : future.length ? 'scheduled' : 'none';
    return {
      state: st, run: live, todayRun: cur, amount: live ? live.amount : 0, lastDay: !live && last ? last.to : '',
      since: live ? live.from : last && last.to ? addDays(last.to, 1) : future[0] ? future[0].from : '',
      endsOn: cur && cur.to ? cur.to : '', lastAmount: last ? last.amount : future[0] ? future[0].amount : 0,
      next: future[0] || null, runs: runs
    };
  }

  function campState(data, camp, today) {
    var mode = budgetMode(data, camp);
    if (mode === 'campaign') { var s = levelState(data, camp, '', today); s.mode = mode; return s; }
    var sets = adsetsOf(data, camp).filter(function (a) { return runsOf(data, camp, a).length; });
    var states = sets.map(function (a) { return Object.assign({ adset: a }, levelState(data, camp, a, today)); });
    var run = states.filter(function (x) { return x.state === 'running'; });
    return {
      mode: mode, perAdset: states, runningCount: run.length,
      state: run.length ? 'running' : states.some(function (x) { return x.state === 'paused'; }) ? 'paused' : states.some(function (x) { return x.state === 'scheduled'; }) ? 'scheduled' : 'none',
      amount: run.reduce(function (a, x) { return a + x.amount; }, 0),
      since: run.length ? run.map(function (x) { return x.since; }).sort()[0] : states.map(function (x) { return x.since; }).filter(Boolean).sort().pop() || '',
      lastDay: run.length ? '' : states.map(function (x) { return x.lastDay; }).filter(Boolean).sort().pop() || '',
      next: states.map(function (x) { return x.next; }).filter(Boolean).sort(function (a, b) { return a.from < b.from ? -1 : 1; })[0] || null,
      endsOn: ''
    };
  }

  function campaignStatus(data, cp, today) {
    var s = campState(data, cp.name, today);
    if (s.state === 'running') return { text: 'กำลังยิง', tone: 'good', key: 'running' };
    if (s.state === 'paused') return { text: 'หยุดแล้ว', tone: '', key: 'paused' };
    if (s.state === 'scheduled') return { text: 'ตั้งเวลาไว้', tone: 'info', key: 'scheduled' };
    return { text: 'ยังไม่มีรอบยิง', tone: 'warn', key: 'none' };
  }

  function firstStart(data, camp) {
    var d = '';
    (data.budgets || []).forEach(function (b) { if (b.campaign === camp && Number(b.daily_budget) > 0 && (!d || b.start_date < d)) d = b.start_date; });
    var cp = findCampaign(data, camp);
    return d || (cp && cp.start_date) || '';
  }

  /** งบ/วันที่ตั้ง ณ วันที่ date (Ad set ก่อน → ไม่มีใช้ทั้งแคมเปญ) */
  function budgetAt(data, camp, adset, date) {
    var r = adset ? activeRun(runsOf(data, camp, adset), date) : null;
    if (r) return { daily_budget: r.amount, start_date: r.from, level: 'adset', note: r.note };
    r = activeRun(runsOf(data, camp, ''), date);
    return r ? { daily_budget: r.amount, start_date: r.from, level: 'campaign', note: r.note } : null;
  }

  /** วันที่ยิงอยู่ของแคมเปญ ถึง untilDate */
  function runningDays(data, camp, untilDate) {
    var days = {};
    [''].concat(adsetsOf(data, camp)).forEach(function (lv) {
      runsOf(data, camp, lv).forEach(function (r) {
        var to = !r.to || r.to > untilDate ? untilDate : r.to;
        var d = r.from, guard = 0;
        while (d <= to && guard++ < 2000) { days[d] = true; d = addDays(d, 1); }
      });
    });
    return Object.keys(days).sort();
  }

  // ---------- ค่า Ads ที่ใช้จริง (กรอกเอง) ----------
  function spendDaily(data) {
    var adsetCamp = {};
    data.ads.forEach(function (a) { if (a.adset && a.campaign) adsetCamp[a.adset] = a.campaign; });
    (data.adsets || []).forEach(function (a) { adsetCamp[a.name] = adsetCamp[a.name] || a.campaign; });
    var out = [], fbDay = {};
    // วันที่มีตัวเลขจาก Facebook แล้ว → ไม่นับยอดที่กรอกมือของแคมเปญนั้นในวันนั้น (กันนับซ้ำ)
    (data.spend || []).forEach(function (s) { if (s.source === 'fb') fbDay[(s.campaign || '') + '|' + s.date] = true; });
    (data.spend || []).forEach(function (s) {
      var from = s.date, to = s.date_to && s.date_to >= from ? s.date_to : from;
      var camp = s.campaign || adsetCamp[s.adset] || '';
      var n = daysIncl(from, to), per = (Number(s.amount) || 0) / n;
      var d = from, guard = 0;
      while (d <= to && guard++ < 1000) {
        if (s.source === 'fb' || !fbDay[camp + '|' + d]) out.push({ date: d, campaign: camp, adset: s.adset || '', amount: per, results: s.source === 'fb' ? Number(s.results) || 0 : 0, fb: s.source === 'fb' });
        d = addDays(d, 1);
      }
    });
    return out;
  }

  function spendCoverage(data, camp, today) {
    var yesterday = addDays(today, -1);
    var covered = {}, total = 0, lastTo = '', entries = [];
    var adsetSet = {};
    adsetsOf(data, camp).forEach(function (a) { adsetSet[a] = true; });
    (data.spend || []).forEach(function (s) {
      var c = s.campaign || (adsetSet[s.adset] ? camp : '');
      if (c !== camp) return;
      entries.push(s);
      total += Number(s.amount) || 0;
      var to = s.date_to && s.date_to >= s.date ? s.date_to : s.date;
      if (!lastTo || to > lastTo) lastTo = to;
      var d = s.date, guard = 0;
      while (d <= to && guard++ < 1000) { covered[d] = true; d = addDays(d, 1); }
    });
    var gaps = runningDays(data, camp, yesterday).filter(function (d) { return !covered[d]; });
    var fbChats = 0;
    total = 0;
    spendDaily(data).forEach(function (x) { if (x.campaign === camp) { total += x.amount; fbChats += x.results || 0; } });
    var hasFb = entries.some(function (e) { return e.source === 'fb'; });
    // แคมเปญที่ดึงค่า Ads จาก Facebook: วันที่ไม่มีค่าใช้จ่าย = วันที่ไม่ได้ยิง (idle) ไม่ใช่ "ยังไม่กรอก" — เตือนให้กรอกเฉพาะแคมเปญที่กรอกเอง
    return { total: total, lastTo: lastTo, missing: hasFb ? [] : gaps, idle: hasFb ? gaps : [], entries: entries, fbChats: fbChats, hasFb: hasFb };
  }

  /** ผลของแต่ละรอบ (เทียบกับรอบก่อนหน้าของระดับเดียวกัน) */
  function runResults(data, camp, adset, today, daily) {
    daily = daily || spendDaily(data);
    var prev = null;
    return runsOf(data, camp, adset || '').map(function (r) {
      var future = r.from > today;
      var to = !r.to || r.to > today ? today : r.to;
      var days = future ? 0 : daysIncl(r.from, to);
      var chats = future ? [] : data.chats.filter(function (c) { return c.campaign === camp && (!adset || c.adset === adset) && c.date >= r.from && c.date <= to; });
      var people = uniquePeople(chats);
      var leads = people.filter(function (p) { return stageOf(p.status) >= 1; }).length;
      var closedP = people.filter(function (p) { return p.status === '5-ปิดการขาย'; });
      var spend = future ? 0 : daily.filter(function (s) { return s.campaign === camp && (!adset || s.adset === adset) && s.date >= r.from && s.date <= to; })
        .reduce(function (a, s) { return a + s.amount; }, 0);
      var row = {
        run: r, campaign: camp, adset: adset || '', from: r.from, to: to, plannedTo: r.to, days: days, future: future,
        ongoing: !future && (!r.to || r.to >= today), daily: r.amount, spend: spend, leads: leads, closed: closedP.length,
        amount: closedP.reduce(function (a, p) { return a + (Number(p.amount) || 0); }, 0),
        leadsPerDay: days ? leads / days : 0, cpl: leads && spend ? spend / leads : null, cpc: closedP.length && spend ? spend / closedP.length : null,
        note: r.note
      };
      if (prev && !future) {
        row.budgetChange = prev.daily ? (row.daily - prev.daily) / prev.daily : null;
        row.lpdChange = prev.leadsPerDay ? (row.leadsPerDay - prev.leadsPerDay) / prev.leadsPerDay : null;
        row.cplChange = prev.cpl && row.cpl != null ? (row.cpl - prev.cpl) / prev.cpl : null;
      }
      if (!future) prev = row;
      return row;
    });
  }

  /** ทุกรอบที่ยิงแล้ว (การ์ดทดลองงบบน Dashboard) opts = { from, to, campaign, today } */
  function budgetPeriods(data, opts) {
    var today = opts.today || iso(new Date());
    var daily = spendDaily(data);
    var camps = {};
    (data.budgets || []).forEach(function (b) { if (!opts.campaign || b.campaign === opts.campaign) camps[b.campaign] = true; });
    var out = [];
    Object.keys(camps).forEach(function (camp) {
      [''].concat(adsetsOf(data, camp)).forEach(function (lv) {
        runResults(data, camp, lv, today, daily).forEach(function (r) {
          if (!r.future && (opts.campaign || (r.to >= opts.from && r.from <= opts.to))) out.push(r);
        });
      });
    });
    return out.sort(function (a, b) { return a.campaign.localeCompare(b.campaign, 'th') || a.adset.localeCompare(b.adset, 'th') || (a.from < b.from ? -1 : 1); });
  }

  // ---------- ระยะเวลา ทัก → ปิด ----------
  /** เคสที่ปิดได้ พร้อมจำนวนวันจากวันที่ทักครั้งแรกถึงวันปิด */
  function closeDurations(people) {
    return people.filter(function (p) { return p.status === '5-ปิดการขาย'; }).map(function (p) {
      var cd = p.closed_date || '';
      var d = cd && p.firstDate ? daysIncl(p.firstDate, cd) - 1 : null;
      return Object.assign({}, p, { closeDays: d != null && d >= 0 ? d : null, badDate: d != null && d < 0 });
    }).sort(function (a, b) { return (a.closed_date || a.date) < (b.closed_date || b.date) ? 1 : -1; });
  }
  function durationStats(list) {
    var v = list.map(function (x) { return x.closeDays; }).filter(function (x) { return x != null; }).sort(function (a, b) { return a - b; });
    if (!v.length) return { n: 0, known: 0 };
    var mid = Math.floor(v.length / 2);
    return {
      n: list.length, known: v.length, avg: v.reduce(function (a, b) { return a + b; }, 0) / v.length,
      median: v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2, min: v[0], max: v[v.length - 1],
      buckets: [
        { label: 'วันเดียวกัน', n: v.filter(function (x) { return x === 0; }).length },
        { label: '1–3 วัน', n: v.filter(function (x) { return x >= 1 && x <= 3; }).length },
        { label: '4–7 วัน', n: v.filter(function (x) { return x >= 4 && x <= 7; }).length },
        { label: 'มากกว่า 7 วัน', n: v.filter(function (x) { return x > 7; }).length }
      ]
    };
  }

  function sum(list, key) { return list.reduce(function (a, x) { return a + (Number(x[key]) || 0); }, 0); }

  // ---------- รูปแบบตัวเลข ----------
  var fmtInt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });
  function baht(n) { return n == null || isNaN(n) ? '–' : fmtInt.format(Math.round(n)) + ' บาท'; }
  function int(n) { return n == null || isNaN(n) ? '–' : fmtInt.format(n); }
  function pct(n, d) { return n == null || isNaN(n) ? '–' : (n * 100).toFixed(d == null ? 0 : d) + '%'; }
  var TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  function thDate(s, withYear) {
    if (!s) return '';
    var p = s.split('-');
    return Number(p[2]) + ' ' + TH_MONTH[Number(p[1]) - 1] + (withYear ? ' ' + p[0] : '');
  }
  function thRange(a, b) {
    if (a === b) return thDate(a, true);
    if (a.slice(0, 7) === b.slice(0, 7)) return Number(a.slice(8)) + '–' + thDate(b, true);
    if (a.slice(0, 4) === b.slice(0, 4)) return thDate(a) + ' – ' + thDate(b, true);
    return thDate(a, true) + ' – ' + thDate(b, true);
  }

  /** ข้อความสรุปแคมเปญ (รูปแบบที่ใช้ส่งใน LINE) */
  function summaryText(m, data) {
    var name = m.campaign || 'ทุกแคมเปญ';
    var datesUsed = m.chats.map(function (c) { return c.date; }).concat(m.daily.filter(function (d) { return d.spend > 0; }).map(function (d) { return d.date; })).sort();
    var a = datesUsed[0] || m.from, b = datesUsed[datesUsed.length - 1] || m.to;
    var L = [];
    L.push('📊 ' + name);
    L.push('ช่วงยิง ' + thRange(a, b) + ' · งบเฉลี่ย ' + baht(m.avgPerDay) + '/วัน');
    L.push('');
    L.push('ภาพรวม');
    L.push('• งบที่ใช้รวม ' + baht(m.spend) + ' (เฉลี่ย ' + baht(m.avgPerDay) + '/วัน, ' + m.spendDays + ' วัน)');
    L.push('• Lead ' + int(m.leads) + ' คน · ปิดได้ ' + int(m.closed) + ' เคส (' + pct(m.closeRate, 1) + ')');
    L.push('• ยอดรับซื้อรวม ' + baht(m.amount));
    L.push('• ค่า Ads ต่อยอดรับซื้อ ' + pct(m.adsPct, 1));
    L.push('• ต้นทุน/Lead ' + baht(m.cpl) + ' · ต้นทุน/เคส ' + baht(m.cpc));
    L.push('');
    L.push('สถานะลูกค้า (' + int(m.people.length) + ' คน)');
    m.statusCounts.forEach(function (s) { if (s.n) L.push('• ' + s.key + ' — ' + s.n + ' (' + pct(s.pct) + ')'); });
    L.push('');
    L.push('เคสที่ปิดได้');
    if (!m.closedPeople.length) L.push('• ยังไม่มี');
    m.closedPeople.forEach(function (p) {
      L.push('• ' + p.customer + ' | ' + (p.product || '-') + ' | ' + baht(Number(p.amount) || 0) + ' | ' + (p.adset || '-'));
    });
    if (m.closedPeople.length) L.push('รวม ' + m.closedPeople.length + ' เคส | ' + baht(m.amount));
    L.push('');
    L.push('ผลตาม Ad Set (ใช้จ่าย / Lead / ต้นทุนต่อ Lead / ปิดได้ / ยอดรับซื้อ / ต้นทุนต่อเคส)');
    m.adsetRows.forEach(function (r) {
      L.push('• ' + r.adset + ': ' + (r.cbo ? 'CBO' : baht(r.spend)) + ' / ' + r.leads + ' / ' + baht(r.cpl) + ' / ' + r.closed + ' / ' + baht(r.amount) + ' / ' + baht(r.cpc));
    });
    L.push('รวม: ' + baht(m.spend) + ' / ' + m.leads + ' / ' + baht(m.cpl) + ' / ' + m.closed + ' / ' + baht(m.amount) + ' / ' + baht(m.cpc));
    return L.join('\n');
  }

  // ---------- ผลการปรับงบ: เทียบ "ก่อนปรับ" กับ "หลังปรับ" ----------
  var MIN_DAYS = 3;
  function cplOf(r) {
    if (r.covDays && r.covLeads) return { v: r.covSpend / r.covLeads, est: false };
    if (r.leads && r.daily) return { v: r.daily * r.days / r.leads, est: true }; // ยังไม่กรอกค่า Ads → ประมาณจากงบที่ตั้ง
    return { v: null, est: !r.spend };
  }
  function verdictOf(b, a) {
    var kind = a.daily > b.daily ? 'up' : a.daily < b.daily ? 'down' : 'same';
    var cb = cplOf(b), ca = cplOf(a);
    var useEst = cb.est || ca.est;
    if (useEst) { cb = { v: b.leads && b.daily ? b.daily * b.days / b.leads : null }; ca = { v: a.leads && a.daily ? a.daily * a.days / a.leads : null }; }
    var lpdCh = b.leadsPerDay ? (a.leadsPerDay - b.leadsPerDay) / b.leadsPerDay : null;
    var cplCh = cb.v && ca.v ? (ca.v - cb.v) / cb.v : null;
    var key;
    if (a.days < MIN_DAYS) key = 'wait';
    else if (!b.leads && !a.leads) key = 'nodata';
    else if (!a.leads) key = 'bad';
    else if (!b.leads) key = 'good';
    else if (cplCh <= -0.1) key = 'good';
    else if (cplCh >= 0.2) key = 'bad';
    else if (kind === 'up' && lpdCh >= 0.1) key = 'good';
    else key = 'flat';
    var T = {
      up: { good: 'เพิ่มงบแล้วคุ้ม', bad: 'เพิ่มงบแล้วไม่คุ้ม', flat: 'เพิ่มงบแล้วผลพอ ๆ เดิม' },
      down: { good: 'ลดงบแล้วคุ้มกว่า', bad: 'ลดงบแล้วแย่ลง', flat: 'ลดงบแล้วผลพอ ๆ เดิม' },
      same: { good: 'รอบใหม่ดีกว่าเดิม', bad: 'รอบใหม่แย่กว่าเดิม', flat: 'ผลพอ ๆ เดิม' }
    };
    var title = key === 'wait' ? 'รอผลอีก ' + (MIN_DAYS - a.days) + ' วัน' : key === 'nodata' ? 'ยังไม่มี Lead' : T[kind][key];
    var advice = '';
    if (key === 'wait') advice = 'เพิ่งเปลี่ยน ' + a.days + ' วัน — ผลช่วงแรกยังไม่นิ่ง ยิงให้ครบ ' + MIN_DAYS + ' วันก่อนค่อยตัดสิน';
    else if (key === 'nodata') advice = 'ทั้งก่อนและหลังปรับยังไม่มีคนทัก — ลองเปลี่ยนครีเอทีฟหรือกลุ่มเป้าหมาย';
    else if (key === 'good') advice = kind === 'up' ? 'ยิงงบนี้ต่อได้ — ถ้าอยากได้ Lead เพิ่ม ลองขยับอีกครั้งละ 20–30%' : kind === 'down' ? 'งบนี้คุ้มกว่า ใช้ต่อได้' : 'รอบนี้ดีกว่า ยิงต่อได้';
    else if (key === 'bad') advice = kind === 'up' ? 'ลองกลับไปงบเดิม ' + baht(b.daily) + '/วัน หรือเปลี่ยนครีเอทีฟ/กลุ่มเป้าหมายก่อนเพิ่มงบ' : kind === 'down' ? 'ลองกลับไปงบเดิม ' + baht(b.daily) + '/วัน' : 'ดูครีเอทีฟ/กลุ่มเป้าหมายของรอบนี้';
    else advice = 'ต้นทุนต่อ Lead ใกล้เดิม — ' + (kind === 'up' ? 'ได้ Lead เพิ่มตามงบ ยิงต่อได้ถ้าทีมตอบแชททัน' : 'ยิงต่ออีกสักพักแล้วดูอีกครั้ง');
    var few = key !== 'wait' && key !== 'nodata' && (b.leads < 5 || a.leads < 5);
    var partial = !useEst && (b.covDays < b.days || a.covDays < a.days);
    return { key: key, kind: kind, title: title, advice: advice, few: few, est: useEst, partial: partial,
      lpd: [b.leadsPerDay, a.leadsPerDay], lpdChange: lpdCh, cpl: [cb.v, ca.v], cplChange: cplCh };
  }
  /** ทุกครั้งที่เปลี่ยนรอบ (ปรับงบ / กลับมายิง) → 1 การทดลอง */
  /** เวลาที่โฆษณาเปิดจริงในช่วง from..to (รวมวัน) → { hours, pauses:[{off,on,hrs,by}], src: 'fb' | 'hourly' | 'day' }
   *  1) ประวัติเปิด/ปิดจาก Facebook (แม่นระดับนาที)  2) ค่า Ads รายชั่วโมง (ชั่วโมงที่มีค่าใช้จ่าย)  3) นับเป็นวันเต็ม */
  function tmin(s) { var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(s || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) / 60000 : 0; }
  function tstr(x) { var d = new Date(x * 60000); return d.toISOString().slice(0, 10) + ' ' + d.toISOString().slice(11, 16); }
  function activeTime(data, camp, adset, from, to, nowStr) {
    var now = nowStr || (function () { var d = new Date(); return iso(d) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); })();
    var S0 = tmin(from + ' 00:00'), E0 = Math.min(tmin(to + ' 23:59') + 1, tmin(now));
    if (E0 <= S0) return { hours: 0, pauses: [], src: 'day' };
    var ev = (data.fbstatus || []).filter(function (e) { return e.campaign === camp && (e.lvl === 'c' || (adset && e.lvl === 's' && e.adset === adset)); });
    if (ev.length) {
      // ก่อนเหตุการณ์แรก = สถานะตรงข้ามกับเหตุการณ์แรกของแต่ละระดับ
      var st = { c: true, s: true }, on = true, pauses = [], cur = null, acc = 0, t0 = S0, seen = {};
      ev.forEach(function (e) { if (!seen[e.lvl]) { seen[e.lvl] = 1; st[e.lvl] = !e.on; } });
      ev.forEach(function (e) { if (tmin(e.t) <= S0) st[e.lvl] = e.on; });
      on = st.c && st.s;
      if (!on) cur = { off: tstr(S0), by: '' };
      ev.forEach(function (e) {
        var x = tmin(e.t); if (x <= S0 || x > E0) return;
        st[e.lvl] = e.on; var nOn = st.c && st.s; if (nOn === on) return;
        if (on) { acc += x - t0; cur = { off: e.t, by: e.by }; } else { t0 = x; if (cur) { cur.on = e.t; cur.hrs = (x - tmin(cur.off)) / 60; pauses.push(cur); cur = null; } }
        on = nOn;
      });
      if (on) acc += E0 - t0; else if (cur) { cur.on = ''; cur.hrs = (E0 - tmin(cur.off)) / 60; pauses.push(cur); }
      return { hours: acc / 60, pauses: pauses.filter(function (p) { return p.hrs >= 0.25; }), src: 'fb' };
    }
    var hr = (data.fbhourly || []).filter(function (h) { return h.campaign === camp && (!adset || h.adset === adset) && h.date >= from && h.date <= to && h.spend > 0; });
    if (hr.length) {
      var act = {}; hr.forEach(function (h) { act[h.date + ' ' + ('0' + h.hour).slice(-2) + ':00'] = 1; });
      var keys = Object.keys(act).sort(), ps = [];
      for (var i = 1; i < keys.length; i++) { var g = (tmin(keys[i]) - tmin(keys[i - 1])) / 60 - 1; if (g >= 8) ps.push({ off: tstr(tmin(keys[i - 1]) + 60), on: keys[i], hrs: g, by: '' }); }
      return { hours: keys.length, pauses: ps, src: 'hourly' };
    }
    return { hours: null, pauses: [], src: 'day' };
  }
  /** ตัดข้อความอัตโนมัติจาก Facebook (หยุด/เปิดยิงใน Facebook) และข้อความซ้ำออก */
  function cleanNote(n) { var seen = {}; return String(n || '').split(' · ').filter(function (x) { x = x.trim(); if (!x || /^(หยุดใน Facebook|เปิดยิงใน Facebook)$/.test(x) || seen[x]) return false; seen[x] = 1; return true; }).join(' · '); }
  /** รวมรอบที่งบ/วันเท่าเดิมติดกัน (แค่ปิดแล้วเปิดใหม่) เป็นรอบเดียว — การเทียบ "ปรับงบแล้วคุ้มไหม" จะเกิดเฉพาะตอนงบเปลี่ยนจริง */
  function mergeSameBudget(rows) {
    var out = [];
    rows.forEach(function (r) {
      var m = out[out.length - 1];
      if (m && m.daily === r.daily) {
        m.pauses.push(r.from); m.to = r.to; m.plannedTo = r.plannedTo; m.ongoing = r.ongoing; m.run = r.run;
        m.days += r.days; m.leads += r.leads; m.spend += r.spend; m.closed += r.closed; m.amount += r.amount;
        m.leadsPerDay = m.days ? m.leads / m.days : 0; m.cpl = m.leads && m.spend ? m.spend / m.leads : null; m.cpc = m.closed && m.spend ? m.spend / m.closed : null;
        var nn = cleanNote(r.note); if (nn && cleanNote(m.note).indexOf(nn) < 0) m.note = cleanNote(m.note) ? cleanNote(m.note) + ' · ' + nn : nn;
        return;
      }
      var c = {}; Object.keys(r).forEach(function (k) { c[k] = r[k]; }); c.pauses = []; c.note = cleanNote(r.note); out.push(c);
    });
    return out;
  }
  function experiments(data, opts) {
    var today = opts.today || iso(new Date()), daily = spendDaily(data), out = [];
    var camps = {};
    (data.budgets || []).forEach(function (b) { if (b.campaign && (!opts.campaign || b.campaign === opts.campaign)) camps[b.campaign] = true; });
    Object.keys(camps).forEach(function (camp) {
      [''].concat(adsetsOf(data, camp)).forEach(function (lv) {
        var rows = mergeSameBudget(runResults(data, camp, lv, today, daily).filter(function (r) { return !r.future; }));
        for (var i = 1; i < rows.length; i++) {
          var b = rows[i - 1], a = rows[i];
          if (opts.from && (a.to < opts.from || a.from > opts.to)) continue;
          [b, a].forEach(function (r) {
            if (r.covDays != null) return;
            var cov = campaignDaily(data, camp, lv, r.from, r.to).filter(function (d) { return d.spend > 0; });
            r.covDays = cov.length;
            r.covSpend = cov.reduce(function (t, d) { return t + d.spend; }, 0);
            r.covLeads = cov.reduce(function (t, d) { return t + d.leads; }, 0);
          });
          var gapFrom = b.plannedTo ? addDays(b.plannedTo, 1) : null;
          var gap = gapFrom && gapFrom < a.from ? daysIncl(gapFrom, addDays(a.from, -1)) : 0;
          out.push({ id: a.run.id, campaign: camp, adset: lv, before: b, after: a, gap: gap, note: a.note || '',
            budgetChange: b.daily ? (a.daily - b.daily) / b.daily : null, v: verdictOf(b, a) });
        }
      });
    });
    return out.sort(function (x, y) { return x.after.from < y.after.from ? 1 : x.after.from > y.after.from ? -1 : 0; });
  }
  /** รายวันของแคมเปญ (หรือ 1 Ad set): Lead · งบที่ตั้ง · ค่า Ads ที่กรอก */
  function campaignDaily(data, camp, adset, from, to) {
    var people = uniquePeople(data.chats.filter(function (c) { return c.campaign === camp && (!adset || c.adset === adset); }));
    var leads = {}, closed = {}, spend = {};
    people.forEach(function (p) { if (stageOf(p.status) >= 1) leads[p.firstDate] = (leads[p.firstDate] || 0) + 1; if (p.status === '5-ปิดการขาย') closed[p.firstDate] = (closed[p.firstDate] || 0) + 1; });
    spendDaily(data).forEach(function (s) { if (s.campaign === camp && (!adset || s.adset === adset)) spend[s.date] = (spend[s.date] || 0) + s.amount; });
    var levels = adset ? [adset] : [''].concat(adsetsOf(data, camp));
    var runs = levels.map(function (lv) { return runsOf(data, camp, lv); });
    return dayList(from, to).map(function (d) {
      var bud = 0;
      runs.forEach(function (rs) { var r = activeRun(rs, d); if (r) bud += r.amount; });
      return { date: d, leads: leads[d] || 0, closed: closed[d] || 0, spend: spend[d] || 0, budget: bud };
    });
  }

  // ---------- ประเภทสินค้า ----------
  var DEFAULT_PRODUCTS = ['iPhone', 'iPad', 'MacBook', 'iMac', 'Apple Watch', 'AirPods', 'Notebook', 'Computer', 'เกมคอนโซล', 'กล้อง'];
  function productList(data) {
    var raw = data && data.config && data.config.products;
    var list = raw ? String(raw).split(/[\n,]+/).map(function (x) { return x.trim(); }).filter(Boolean) : [];
    return list.length ? list : DEFAULT_PRODUCTS.slice();
  }
  /** แยก "iPhone 14 Pro 256GB" → { cat: 'iPhone', detail: '14 Pro 256GB' } */
  function splitProduct(data, product) {
    var p = String(product || '').trim(), list = productList(data).slice().sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (p.toLowerCase().indexOf(c.toLowerCase()) === 0) return { cat: c, detail: p.slice(c.length).replace(/^[\s·\-:]+/, '') };
    }
    var hit = list.filter(function (c) { return p.toLowerCase().indexOf(c.toLowerCase()) >= 0; })[0];
    return hit ? { cat: hit, detail: p, loose: true } : { cat: p ? 'อื่น ๆ' : '', detail: p };
  }

  // ============================================================
  // ต้นทุนต่อหมวด (FB + Google) · ประสิทธิภาพโฆษณา
  // ============================================================
  var KPI_CATS = [{ k: 'iphone', n: 'iPhone' }, { k: 'ipad', n: 'iPad' }, { k: 'macbook', n: 'MacBook' }, { k: 'notebook', n: 'Notebook' }, { k: 'computer', n: 'Computer' }];
  function purchaseCat(c) {
    c = String(c || '').toLowerCase().trim();
    if (c === 'iphone') return 'iphone';
    if (c === 'ipad') return 'ipad';
    if (c === 'macbook') return 'macbook';
    if (c === 'notebook gaming' || c === 'notebook office' || c === 'notebook') return 'notebook';
    if (c === 'comset gaming' || c === 'comset office') return 'computer';
    return '';
  }
  /** หมวดของเคสประเมิน/รับซื้อ — ชื่อตรงก่อน แล้วค่อยเดาจากคำ (Notebook-Gaming, โน้ตบุ๊ค, Laptop, NB …) */
  function itemCat(c) {
    var k = purchaseCat(c); if (k) return k;
    var s = String(c || '').toLowerCase().replace(/[\s\-_\/().]+/g, '');
    if (!s) return '';
    if (/iphone|ไอโฟน/.test(s)) return 'iphone';
    if (/ipad|ไอแพด/.test(s)) return 'ipad';
    if (/macbook|แมคบุ๊|แม็คบุ๊/.test(s)) return 'macbook';
    if (/notebook|laptop|โน้ตบุ|โน๊ตบุ|โน้ตบุ้|^nb/.test(s)) return 'notebook';
    if (/comset|compset|pcset|คอมเซ|คอมประกอบ/.test(s)) return 'computer';
    return '';
  }
  /** อ่านชื่อรุ่นจาก "รายละเอียดสินค้า" เมื่อหมวดในชีตไม่ใช่ 5 หมวด (บอทใส่โน้ตบุ๊กเป็น อื่นๆ / Smart Phone ฯลฯ) */
  var RX_NOT = /apple watch|airpods|\bwatch\b|nintendo|\bswitch\b|\bps[45]\b|playstation|xbox|legion go|\bclaw\b|steam deck|\bally\b|homepod|trackpad|ipad|iphone|macbook|imac|mac ?mini|mac studio/;
  var RX_PART = /monitor|จอมอนิเตอร์|\binch\b|นิ้ว|\b\d{2,3}\s?hz\b|mainboard|เมนบอร์ด|\bram\b|ddr\d|so-?dimm|\bssd\b|m\.2|nvme|gddr|geforce|radeon|\brx ?\d{4}|power ?supply|\bpsu\b|cooler|zoomflow|keyboard|คีย์บอร์ด|mouse|เมาส์|headset|หูฟัง|joystick|dualsense|ฟิล์ม|กระเป๋า|\bbag\b|adapter|อะแดปเตอร์|charger|\b[bhz]\d{3}[a-z]{0,2}\b|^\s*(intel )?core i\d-\d{4,5}[a-z]*\s*$|^\s*(amd )?ryzen \d \d{4}x?\d?[a-z]*\s*$|ideacentre|\baio\b|all.?in.?one|\bsff\b|mini ?pc|pavilion tp0|desktop/;
  var RX_PC = /comset|pc ?set|\bpc\d{1,2}\b|คอมเซ็ต|คอมเซต|คอมประกอบ/;
  var RX_NB = /vivobook|zenbook|expertbook|\btuf\b|\brog\b|zephyrus|strix|legion|\bloq\b|ideapad|thinkpad|thinkbook|\byoga|\bnitro\b|predator|aspire|\bswift\b|travelmate|katana|cyborg|gf63|\bthin (\d{2}|[ab]\d|gf)|\bsword\b|\bpulse\b|crosshair|\bbravo\b|stealth|raider|\bvector\b|\btitan\b|\bmodern [a-z]?\d|prestige|victus|\bomen\b|pavilion|\benvy\b|spectre|elitebook|probook|omnibook|zbook|inspiron|vostro|latitude|\bxps\b|precision|alienware|\bdell g1\d|aorus|ga?byte g\d|matebook|galaxy book|surface (laptop|pro|book|go)|razer blade|inbook|colorful|\bv1[456]\b|\bd5\d{2}[a-z]|chromebook|dell pro (max )?1[3-6]|\bleopard\b|\balpha 1[57]|\bip ?[35] |2 ?in ?1|x360|\baero 1[4-7]|\bspin ?\d|\bsword ?\d|\bgl6[35]|notebook|laptop|โน้ตบุ|โน๊ตบุ|\bhp 1[3-7]|\b1[3-7]s?-[a-z]{2}\d{4}[a-z]{2}\b/;
  var RX_GAME = /\brtx|\bgtx|\btuf\b|\brog\b|zephyrus|strix|legion|\bloq\b|gaming|gimang|\bnitro\b|predator|katana|cyborg|gf63|\bthin\b|\bsword|\bpulse\b|crosshair|\bbravo\b|stealth|raider|\bvector\b|\btitan\b|victus|\bomen\b|alienware|leopard|\balpha 1|\bgl6\d|aorus|razer|\bdell g1\d|colorful|\d{4}tx\b|\b(10|16|20|30|40|50)[5-9]0\b/;
  /** หมวดสุดท้าย: { k: 'notebook'|…|'', sub: ชื่อที่แสดง, guess: true ถ้าเดาจากชื่อรุ่น } */
  function prodCat(cat, detail) {
    var k = itemCat(cat), raw = String(cat || '').trim();
    if (k) return { k: k, sub: raw, guess: false };
    var d = String(detail || '').toLowerCase();
    if (!d || RX_NOT.test(d)) return { k: '', sub: raw, guess: false };
    if (RX_PC.test(d)) return { k: 'computer', sub: RX_GAME.test(d) ? 'Comset Gaming' : 'Comset Office', guess: true };
    if (RX_PART.test(d)) return { k: '', sub: raw, guess: false };
    if (RX_NB.test(d)) return { k: 'notebook', sub: RX_GAME.test(d) ? 'Notebook Gaming' : 'Notebook Office', guess: true };
    return { k: '', sub: raw, guess: false };
  }
  function guessCat(name) {
    var s = String(name || '').toLowerCase();
    if (/iphone/.test(s)) return 'iphone';
    if (/ipad/.test(s)) return 'ipad';
    if (/macbook/.test(s)) return 'macbook';
    if (/laptop|notebook|โน้ตบุ๊ก|โน๊ตบุ๊ค|โน๊ตบุ๊ก/.test(s)) return 'notebook';
    if (/compc|comset|คอมเซ็ต|คอมพิวเตอร์ตั้งโต๊ะ/.test(s)) return 'computer';
    return '';
  }
  function catMap(data) { try { return JSON.parse((data.config && data.config.cat_map) || '{}') || {}; } catch (e) { return {}; } }
  /** หมวดของค่า Ads: override ที่ตั้งไว้ → เดาจากชื่อ (Ad set/โฆษณา ก่อน แล้วแคมเปญ) · ไม่รู้: FB = กระจาย (mixed) · Google = ไม่นับ (none) */
  function adCat(map, platform, campaign, detail) {
    var o = map[platform + '|' + campaign];
    if (o && o !== 'auto') return o;
    return guessCat(detail) || guessCat(campaign) || (platform === 'f' ? 'mixed' : 'none');
  }
  /** ค่า Ads Facebook รายวัน: ใช้ข้อมูลรายโฆษณา (FbAds) ก่อน
   *  วัน/แคมเปญไหนยังไม่มีข้อมูลรายโฆษณา → ใช้ค่า Ads รายแคมเปญ (Spend) แทน กันยอดหายช่วงก่อนเริ่มดึงรายโฆษณา */
  function fbRows(data, from, to) {
    var rows = [], has = {};
    (data.fbads || []).forEach(function (r) {
      if (r.date < from || r.date > to) return;
      rows.push(r); has[r.campaign + '|' + r.date] = true;
    });
    spendDaily(data).forEach(function (s) {
      if (s.date < from || s.date > to || !s.campaign || has[s.campaign + '|' + s.date]) return;
      if (!(s.amount > 0) && !s.results) return;
      rows.push({ date: s.date, campaign: s.campaign, adset: s.adset || '', ad: '', spend: s.amount, impressions: 0, reach: 0, clicks: 0, link_clicks: 0, chats: s.results || 0, est: true });
    });
    return rows;
  }
  function costByCat(data, from, to) {
    var map = catMap(data), cats = {}, mixed = { fb: 0, fbc: 0, gg: 0, ggc: 0 };
    KPI_CATS.forEach(function (c) { cats[c.k] = { fb: 0, gg: 0, fbc: 0, ggc: 0, ufb: 0, ugg: 0, efb: 0, egg: 0, margin: 0 }; });
    fbRows(data, from, to).forEach(function (r) {
      var k = adCat(map, 'f', r.campaign, r.adset + ' ' + r.ad);
      if (k === 'none') return;
      var t = cats[k] || mixed; t.fb += Number(r.spend) || 0; t.fbc += Number(r.chats) || 0;
    });
    (data.gads || []).forEach(function (r) {
      if (r.date < from || r.date > to) return;
      var k = adCat(map, 'g', r.campaign, '');
      if (k === 'none') return;
      var t = cats[k] || mixed; t.gg += Number(r.cost) || 0; t.ggc += Number(r.conversions) || 0;
    });
    (data.purchases || []).forEach(function (p) {
      if (p.date < from || p.date > to) return;
      var t = cats[p.k != null ? p.k : prodCat(p.category, p.detail).k];
      if (!t) return;
      if (p.fb) t.ufb++; else if (p.line) t.ugg++; else return;
      t.margin += p.sell - p.bought - p.repair;
    });
    (data.estimates || []).forEach(function (e) {
      if (e.date < from || e.date > to) return;
      var t = cats[e.k != null ? e.k : prodCat(e.category, e.detail).k];
      if (!t) return;
      if (e.fb) t.efb++; else if (e.line) t.egg++;
    });
    // แคมเปญที่ไม่ระบุหมวด → กระจายตามสัดส่วน Conversion
    var totC = 0; KPI_CATS.forEach(function (c) { var t = cats[c.k]; totC += t.fbc + t.ggc; });
    KPI_CATS.forEach(function (c) {
      var t = cats[c.k], sh = totC ? (t.fbc + t.ggc) / totC : 1 / KPI_CATS.length;
      t.fb += mixed.fb * sh; t.fbc += mixed.fbc * sh; t.gg += mixed.gg * sh; t.ggc += mixed.ggc * sh;
      t.spend = t.fb + t.gg; t.cv = t.fbc + t.ggc; t.u = t.ufb + t.ugg;
      t.cpcv = t.cv ? t.spend / t.cv : null; t.cpu = t.u ? t.spend / t.u : null;
      t.avgM = t.u ? t.margin / t.u : null; t.close = t.cv ? t.u / t.cv : null;
      t.est = t.efb + t.egg; t.cpe = t.est ? t.spend / t.est : null; t.win = t.est ? t.u / t.est : null;
    });
    return { cats: cats, mixed: mixed };
  }
  function median(a) { a = a.filter(function (v) { return v != null && isFinite(v); }).sort(function (x, y) { return x - y; }); if (!a.length) return null; var m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
  /** สัปดาห์ (7 วัน) ย้อนหลังจากวัน end */
  function weeksBack(end, n) { var out = []; for (var i = n - 1; i >= 0; i--) { var to = addDays(end, -7 * i), from = addDays(to, -6); out.push({ from: from, to: to }); } return out; }
  function kpiTargets(data, from) {
    var cut = Number(data.config && data.config.target_cut); if (!(cut >= 0)) cut = 10;
    var cap = Number(data.config && data.config.target_cap); if (!(cap > 0)) cap = 20;
    var wk = weeksBack(addDays(from, -1), 8), out = {};
    var per = wk.map(function (w) { return costByCat(data, w.from, w.to).cats; });
    var all = costByCat(data, wk[0].from, wk[wk.length - 1].to).cats;
    KPI_CATS.forEach(function (c) {
      var baseU = median(per.map(function (x) { return x[c.k].cpu; })), baseC = median(per.map(function (x) { return x[c.k].cpcv; }));
      var a = all[c.k], capU = a.avgM != null ? a.avgM * cap / 100 : null;
      var cands = [baseU != null ? baseU * (1 - cut / 100) : null, capU].filter(function (v) { return v != null && v > 0; });
      var tU = cands.length ? Math.min.apply(null, cands) : null;
      var cc = [baseC != null ? baseC * (1 - cut / 100) : null, tU != null && a.close ? tU * a.close : null].filter(function (v) { return v != null && v > 0; });
      out[c.k] = { baseU: baseU, baseC: baseC, capU: capU, tU: tU, tC: cc.length ? Math.min.apply(null, cc) : null, avgM: a.avgM,
        by: tU == null ? '' : capU != null && tU === capU ? 'cap' : 'base', weeks: per.filter(function (x) { return x[c.k].u; }).length };
    });
    return { t: out, cut: cut, cap: cap };
  }
  /** ประสิทธิภาพ FB ช่วงหนึ่ง (แคมเปญเดียว หรือทั้งหมด) */
  function fbPerf(data, from, to, camp, ad, adset) {
    var o = { spend: 0, spi: 0, imp: 0, reach: 0, clk: 0, lclk: 0, chat: 0, days: {} };
    fbRows(data, from, to).forEach(function (r) {
      if (camp && r.campaign !== camp) return; if (ad && r.ad !== ad) return; if (adset != null && (r.adset || '') !== adset) return;
      o.spend += Number(r.spend) || 0; if (!r.est) o.spi += Number(r.spend) || 0; o.imp += Number(r.impressions) || 0; o.reach += Number(r.reach) || 0; o.clk += Number(r.clicks) || 0; o.lclk += Number(r.link_clicks) || 0; o.chat += Number(r.chats) || 0;
    });
    o.reach = o.reach * (daysIncl(from, to) > 1 ? 0.72 : 1); // คนเดียวกันเห็นหลายวัน — ประมาณจากผลรวมรายวัน
    o.ctr = o.imp ? (o.lclk ? o.lclk : o.clk) / o.imp : null; o.cplc = o.lclk ? o.spi / o.lclk : null; o.cpm = o.imp ? o.spi / o.imp * 1000 : null; o.freq = o.reach ? o.imp / o.reach : null; o.cpc = o.chat ? o.spend / o.chat : null;
    return o;
  }

  window.Calc = {
    STATUSES: STATUSES, BY_KEY: BY_KEY, STAGES: STAGES,
    stageOf: stageOf, dupMap: dupMap, uniquePeople: uniquePeople, compute: compute, presetRange: presetRange,
    summaryText: summaryText, iso: iso, addDays: addDays,
    adsetsOf: adsetsOf, budgetAt: budgetAt, budgetPeriods: budgetPeriods, campaignStatus: campaignStatus,
    runsOf: runsOf, needsNormalize: needsNormalize, levelState: levelState, campState: campState, budgetMode: budgetMode, firstStart: firstStart,
    spendDaily: spendDaily, spendCoverage: spendCoverage, runResults: runResults, runningDays: runningDays, daysIncl: daysIncl,
    closeDurations: closeDurations, durationStats: durationStats,
    experiments: experiments, activeTime: activeTime, mergeSameBudget: mergeSameBudget, cleanNote: cleanNote, KPI_CATS: KPI_CATS, purchaseCat: purchaseCat, itemCat: itemCat, prodCat: prodCat, guessCat: guessCat, catMap: catMap, adCat: adCat, costByCat: costByCat, kpiTargets: kpiTargets, weeksBack: weeksBack, fbPerf: fbPerf, median: median, campaignDaily: campaignDaily, productList: productList, splitProduct: splitProduct, MIN_DAYS: MIN_DAYS,
    fmt: { baht: baht, int: int, pct: pct, thDate: thDate, thRange: thRange }
  };
})();
