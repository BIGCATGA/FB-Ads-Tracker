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
      adsetRows: adsetRows, adRows: adRows, campaignRows: campaignRows
    };
  }

  // ============================================================
  // แคมเปญ: ไทม์ไลน์ เปิด / ปรับงบ / หยุด  (เก็บในแท็บ Budgets)
  //   1 แถว = เหตุการณ์ 1 ครั้ง: date + daily_budget (0 = หยุดยิง)
  //   adset ว่าง = ระดับแคมเปญ (CBO), มีชื่อ = งบราย Ad set (ABO)
  // ============================================================
  function daysIncl(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000) + 1; }
  function findCampaign(data, camp) { return (data.campaigns || []).filter(function (c) { return c.name === camp; })[0] || null; }

  /** Ad set ทั้งหมดของแคมเปญ (จากแท็บ AdSets, โฆษณา, แชท, งบ) */
  function adsetsOf(data, camp) {
    var set = {};
    (data.adsets || []).forEach(function (a) { if (a.campaign === camp && a.name) set[a.name] = true; });
    data.ads.forEach(function (a) { if (a.campaign === camp && a.adset) set[a.adset] = true; });
    data.chats.forEach(function (c) { if (c.campaign === camp && c.adset) set[c.adset] = true; });
    (data.budgets || []).forEach(function (b) { if (b.campaign === camp && b.adset) set[b.adset] = true; });
    return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'th'); });
  }

  /**
   * เหตุการณ์ของ 1 ระดับ เรียงตามวันที่
   * ถ้าแคมเปญมี end_date แบบเก่า → เติมเหตุการณ์ "หยุด" (virtual) วันถัดจาก end_date ให้
   */
  function levelEvents(data, camp, adset) {
    adset = adset || '';
    var ev = (data.budgets || []).filter(function (b) { return b.campaign === camp && (b.adset || '') === adset; })
      .map(function (b) { return { id: b.id, date: b.start_date, amount: Number(b.daily_budget) || 0, note: b.note || '', row: b }; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var cp = findCampaign(data, camp);
    if (cp && cp.end_date && ev.length) {
      var off = addDays(cp.end_date, 1);
      var after = ev.some(function (e) { return e.date >= off; });
      var before = ev.filter(function (e) { return e.date <= cp.end_date; });
      if (!after && before.length && before[before.length - 1].amount > 0) {
        ev.push({ id: '', date: off, amount: 0, note: 'ปิดแคมเปญ', virtual: true });
      }
    }
    return ev;
  }

  /** วิธีตั้งงบของแคมเปญ: 'campaign' (CBO) หรือ 'adset' (ABO) — ดูจากเหตุการณ์ล่าสุดที่มีงบ */
  function budgetMode(data, camp) {
    var last = null;
    (data.budgets || []).forEach(function (b) {
      if (b.campaign !== camp || !(Number(b.daily_budget) > 0)) return;
      if (!last || b.start_date >= last.start_date) last = b;
    });
    return last && last.adset ? 'adset' : 'campaign';
  }

  /** สถานะของ 1 ระดับ ณ วันที่ today */
  function levelState(data, camp, adset, today) {
    var ev = levelEvents(data, camp, adset);
    var past = ev.filter(function (e) { return e.date <= today; });
    var future = ev.filter(function (e) { return e.date > today; });
    var cur = past[past.length - 1] || null;
    var lastOn = null;
    past.forEach(function (e) { if (e.amount > 0) lastOn = e; });
    var st = !cur ? (future.length ? 'scheduled' : 'none') : cur.amount > 0 ? 'running' : 'paused';
    return { state: st, amount: cur ? cur.amount : 0, since: cur ? cur.date : (future[0] ? future[0].date : ''), lastAmount: lastOn ? lastOn.amount : 0, next: future[0] || null, events: ev };
  }

  /** สถานะแคมเปญ (รวมทุก Ad set ถ้าแยกงบ) */
  function campState(data, camp, today) {
    var mode = budgetMode(data, camp);
    if (mode === 'campaign') {
      var s = levelState(data, camp, '', today);
      s.mode = mode; s.levels = [''];
      return s;
    }
    var sets = adsetsOf(data, camp).filter(function (a) { return levelEvents(data, camp, a).length; });
    var states = sets.map(function (a) { return Object.assign({ adset: a }, levelState(data, camp, a, today)); });
    var run = states.filter(function (x) { return x.state === 'running'; });
    var out = {
      mode: mode, levels: sets, perAdset: states,
      state: run.length ? 'running' : states.some(function (x) { return x.state === 'paused'; }) ? 'paused' : states.some(function (x) { return x.state === 'scheduled'; }) ? 'scheduled' : 'none',
      amount: run.reduce(function (a, x) { return a + x.amount; }, 0),
      runningCount: run.length,
      since: run.length ? run.map(function (x) { return x.since; }).sort().pop() : states.map(function (x) { return x.since; }).filter(Boolean).sort().pop() || ''
    };
    return out;
  }

  function campaignStatus(data, cp, today) {
    var s = campState(data, cp.name, today);
    if (s.state === 'running') return { text: 'กำลังยิง', tone: 'good', key: 'running' };
    if (s.state === 'paused') return { text: 'หยุดอยู่', tone: '', key: 'paused' };
    if (s.state === 'scheduled') return { text: 'ตั้งเวลาไว้', tone: 'info', key: 'scheduled' };
    return { text: 'ยังไม่ตั้งงบ', tone: 'warn', key: 'none' };
  }

  /** วันแรกที่เปิดยิง */
  function firstStart(data, camp) {
    var d = '';
    (data.budgets || []).forEach(function (b) { if (b.campaign === camp && Number(b.daily_budget) > 0 && (!d || b.start_date < d)) d = b.start_date; });
    var cp = findCampaign(data, camp);
    return d || (cp && cp.start_date) || '';
  }

  /** งบ/วัน ณ วันที่ date (ระดับ Ad set → ถ้าไม่มีใช้ระดับแคมเปญ) */
  function budgetAt(data, camp, adset, date) {
    function at(level) {
      var ev = levelEvents(data, camp, level).filter(function (e) { return e.date <= date; });
      return ev.length ? ev[ev.length - 1] : null;
    }
    var hit = adset ? at(adset) : null;
    if (hit) return { daily_budget: hit.amount, start_date: hit.date, level: 'adset', note: hit.note };
    hit = at('');
    return hit ? { daily_budget: hit.amount, start_date: hit.date, level: 'campaign', note: hit.note } : null;
  }

  // ---------- ค่า Ads ที่ใช้จริง (กรอกเอง) ----------
  /** แตกทุกแถวค่า Ads เป็นรายวัน (ยอดช่วงหารเท่า ๆ กัน) → {date, campaign, adset, amount} */
  function spendDaily(data) {
    var adsetCamp = {};
    data.ads.forEach(function (a) { if (a.adset && a.campaign) adsetCamp[a.adset] = a.campaign; });
    (data.adsets || []).forEach(function (a) { adsetCamp[a.name] = adsetCamp[a.name] || a.campaign; });
    var out = [];
    (data.spend || []).forEach(function (s) {
      var from = s.date, to = s.date_to && s.date_to >= from ? s.date_to : from;
      var camp = s.campaign || adsetCamp[s.adset] || '';
      var n = daysIncl(from, to), per = (Number(s.amount) || 0) / n;
      var d = from, guard = 0;
      while (d <= to && guard++ < 1000) { out.push({ date: d, campaign: camp, adset: s.adset || '', amount: per }); d = addDays(d, 1); }
    });
    return out;
  }

  /** วันที่ยิงอยู่ (มีงบ > 0) ของแคมเปญ ตั้งแต่เริ่มถึง untilDate */
  function runningDays(data, camp, untilDate) {
    var days = {};
    var levels = [''].concat(adsetsOf(data, camp));
    levels.forEach(function (lv) {
      var ev = levelEvents(data, camp, lv);
      ev.forEach(function (e, i) {
        if (!(e.amount > 0) || e.date > untilDate) return;
        var to = ev[i + 1] ? addDays(ev[i + 1].date, -1) : untilDate;
        if (to > untilDate) to = untilDate;
        var d = e.date, guard = 0;
        while (d <= to && guard++ < 2000) { days[d] = true; d = addDays(d, 1); }
      });
    });
    return Object.keys(days).sort();
  }

  /** สถานะการกรอกค่า Ads ของแคมเปญ: กรอกถึงวันไหน, ขาดวันไหน (นับถึงเมื่อวาน) */
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
    var missing = runningDays(data, camp, yesterday).filter(function (d) { return !covered[d]; });
    return { total: total, lastTo: lastTo, missing: missing, entries: entries };
  }

  /**
   * ช่วงเวลาตามไทม์ไลน์ของ 1 ระดับ พร้อมผลในช่วงนั้น
   * running = ช่วงที่เปิดยิง, paused = ช่วงที่หยุด
   */
  function levelPeriods(data, camp, adset, today, daily) {
    daily = daily || spendDaily(data);
    var ev = levelEvents(data, camp, adset || '');
    var out = [], prevRun = null;
    ev.forEach(function (e, i) {
      if (e.date > today) return;
      var to = ev[i + 1] ? addDays(ev[i + 1].date, -1) : today;
      if (to > today) to = today;
      if (to < e.date) return;
      var days = daysIncl(e.date, to);
      var chats = data.chats.filter(function (c) { return c.campaign === camp && (!adset || c.adset === adset) && c.date >= e.date && c.date <= to; });
      var people = uniquePeople(chats);
      var leads = people.filter(function (p) { return stageOf(p.status) >= 1; }).length;
      var closedP = people.filter(function (p) { return p.status === '5-ปิดการขาย'; });
      var spend = daily.filter(function (s) { return s.campaign === camp && (!adset || s.adset === adset) && s.date >= e.date && s.date <= to; })
        .reduce(function (a, s) { return a + s.amount; }, 0);
      var row = {
        campaign: camp, adset: adset || '', event: e, from: e.date, to: to, days: days, running: e.amount > 0,
        ongoing: !ev[i + 1] || ev[i + 1].date > today,
        daily: e.amount, spend: spend, leads: leads, closed: closedP.length,
        amount: closedP.reduce(function (a, p) { return a + (Number(p.amount) || 0); }, 0),
        leadsPerDay: leads / days, cpl: leads && spend ? spend / leads : null, cpc: closedP.length && spend ? spend / closedP.length : null,
        note: e.note
      };
      if (row.running && prevRun) {
        row.budgetChange = prevRun.daily ? (row.daily - prevRun.daily) / prevRun.daily : null;
        row.lpdChange = prevRun.leadsPerDay ? (row.leadsPerDay - prevRun.leadsPerDay) / prevRun.leadsPerDay : null;
        row.cplChange = prevRun.cpl && row.cpl != null ? (row.cpl - prevRun.cpl) / prevRun.cpl : null;
      }
      if (row.running) prevRun = row;
      out.push(row);
    });
    return out;
  }

  /** ทุกช่วงที่เปิดยิง (สำหรับการ์ดทดลองงบบน Dashboard) opts = { from, to, campaign, today } */
  function budgetPeriods(data, opts) {
    var today = opts.today || iso(new Date());
    var daily = spendDaily(data);
    var camps = {};
    (data.budgets || []).forEach(function (b) { if (!opts.campaign || b.campaign === opts.campaign) camps[b.campaign] = true; });
    var out = [];
    Object.keys(camps).forEach(function (camp) {
      [''].concat(adsetsOf(data, camp)).forEach(function (lv) {
        levelPeriods(data, camp, lv, today, daily).forEach(function (r) {
          if (r.running && (opts.campaign || (r.to >= opts.from && r.from <= opts.to))) out.push(r);
        });
      });
    });
    return out.sort(function (a, b) { return a.campaign.localeCompare(b.campaign, 'th') || a.adset.localeCompare(b.adset, 'th') || (a.from < b.from ? -1 : 1); });
  }

  function sum(list, key) { return list.reduce(function (a, x) { return a + (Number(x[key]) || 0); }, 0); }

  // ---------- รูปแบบตัวเลข ----------
  var fmtInt = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });
  function baht(n) { return n == null || isNaN(n) ? '–' : fmtInt.format(Math.round(n)) + ' ฿'; }
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

  window.Calc = {
    STATUSES: STATUSES, BY_KEY: BY_KEY, STAGES: STAGES,
    stageOf: stageOf, dupMap: dupMap, uniquePeople: uniquePeople, compute: compute, presetRange: presetRange,
    summaryText: summaryText, iso: iso, addDays: addDays,
    adsetsOf: adsetsOf, budgetAt: budgetAt, budgetPeriods: budgetPeriods, campaignStatus: campaignStatus,
    levelEvents: levelEvents, levelState: levelState, campState: campState, budgetMode: budgetMode, firstStart: firstStart,
    spendDaily: spendDaily, spendCoverage: spendCoverage, levelPeriods: levelPeriods, runningDays: runningDays, daysIncl: daysIncl,
    fmt: { baht: baht, int: int, pct: pct, thDate: thDate, thRange: thRange }
  };
})();
