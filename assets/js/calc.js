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
    if (row.cbo) return { text: 'ดูที่ระดับแคมเปญ (CBO)', tone: '' };
    if (!row.spend) return { text: 'ยังไม่ตั้งงบ', tone: 'info' };
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
    var spend = plannedSpend(data, opts.today).filter(function (s) { return s.date >= from && s.date <= to && (!camp || s.campaign === camp); });
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

  // ---------- ค่า Ads = งบที่ตั้ง/วัน × จำนวนวันที่ยิง ----------
  /**
   * คืนรายการ {date, campaign, adset, amount} ต่อวัน
   * adset = '' คืองบระดับแคมเปญ (CBO)
   * นับตั้งแต่วันที่เริ่มยิงของแคมเปญ (หรือวันที่เริ่มใช้งบ) ถึงวันที่ปิด/วันนี้
   */
  function plannedSpend(data, today) {
    today = today || iso(new Date());
    var camps = {};
    (data.campaigns || []).forEach(function (c) { camps[c.name] = c; });
    var groups = {};
    (data.budgets || []).forEach(function (b) {
      var k = b.campaign + '|' + (b.adset || '');
      (groups[k] = groups[k] || []).push(b);
    });
    var out = [];
    Object.keys(groups).forEach(function (k) {
      var list = groups[k].slice().sort(function (a, b) { return a.start_date < b.start_date ? -1 : 1; });
      var cp = camps[list[0].campaign] || {};
      var end = cp.end_date && cp.end_date < today ? cp.end_date : today;
      list.forEach(function (b, i) {
        var from = b.start_date;
        if (cp.start_date && cp.start_date > from) from = cp.start_date;
        var to = list[i + 1] ? addDays(list[i + 1].start_date, -1) : end;
        if (to > end) to = end;
        var amt = Number(b.daily_budget) || 0;
        if (!amt) return;
        var d = from, guard = 0;
        while (d <= to && guard++ < 2000) { out.push({ date: d, campaign: b.campaign, adset: b.adset || '', amount: amt }); d = addDays(d, 1); }
      });
    });
    return out;
  }

  // ---------- แคมเปญ + งบที่ตั้ง ----------
  function daysIncl(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000) + 1; }

  /** Ad set ทั้งหมดของแคมเปญ (จากตาราง Ads และแชท) */
  function adsetsOf(data, camp) {
    var set = {};
    (data.adsets || []).forEach(function (a) { if (a.campaign === camp && a.name) set[a.name] = true; });
    data.ads.forEach(function (a) { if (a.campaign === camp && a.adset) set[a.adset] = true; });
    data.chats.forEach(function (c) { if (c.campaign === camp && c.adset) set[c.adset] = true; });
    return Object.keys(set).sort();
  }

  /** งบ/วันที่ตั้งไว้ ณ วันที่ date ของ Ad set (หรือระดับแคมเปญ ถ้าไม่มีแถวของ Ad set) */
  function budgetAt(data, camp, adset, date) {
    var hit = null;
    (data.budgets || []).forEach(function (b) {
      if (b.campaign !== camp || b.start_date > date) return;
      var lvlOk = adset ? (b.adset === adset) : !b.adset;
      if (lvlOk && (!hit || b.start_date >= hit.start_date)) hit = b;
    });
    if (!hit && adset) { var c = budgetAt(data, camp, '', date); return c ? Object.assign({ level: 'campaign' }, c) : null; }
    return hit ? Object.assign({ level: hit.adset ? 'adset' : 'campaign' }, hit) : null;
  }

  function campaignStatus(cp, today) {
    if (cp.start_date && cp.start_date > today) return { text: 'ยังไม่เริ่ม', tone: 'info' };
    if (cp.end_date && cp.end_date < today) return { text: 'จบแล้ว', tone: '' };
    return { text: 'กำลังยิง', tone: 'good' };
  }

  /**
   * ช่วงงบ (ทดลองงบ): แต่ละแถวงบ = 1 ช่วง ตั้งแต่ start_date ถึงก่อนแถวถัดไปของระดับเดียวกัน
   * opts = { from, to, campaign, today }
   */
  function budgetPeriods(data, opts) {
    var today = opts.today || iso(new Date());
    var camps = {};
    (data.campaigns || []).forEach(function (c) { camps[c.name] = c; });
    var groups = {};
    (data.budgets || []).forEach(function (b) {
      if (opts.campaign && b.campaign !== opts.campaign) return;
      var k = b.campaign + '|' + (b.adset || '');
      (groups[k] = groups[k] || []).push(b);
    });
    var out = [];
    Object.keys(groups).forEach(function (k) {
      var list = groups[k].slice().sort(function (a, b) { return a.start_date < b.start_date ? -1 : 1; });
      var prev = null;
      list.forEach(function (b, i) {
        var cp = camps[b.campaign] || {};
        var from = b.start_date;
        if (cp.start_date && cp.start_date > from) from = cp.start_date;
        if (from > today) return;
        var to = list[i + 1] ? addDays(list[i + 1].start_date, -1) : today;
        if (cp.end_date && cp.end_date < to) to = cp.end_date;
        if (to < from) return;
        var scope = b.adset ? [b.adset] : adsetsOf(data, b.campaign);
        var inScope = {};
        scope.forEach(function (x) { inScope[x] = true; });
        var chats = data.chats.filter(function (c) { return c.campaign === b.campaign && (!b.adset || c.adset === b.adset) && c.date >= from && c.date <= to; });
        var people = uniquePeople(chats);
        var leads = people.filter(function (p) { return stageOf(p.status) >= 1; }).length;
        var closedP = people.filter(function (p) { return p.status === '5-ปิดการขาย'; });
        var days = daysIncl(from, to);
        var spend = (Number(b.daily_budget) || 0) * days;
        var row = {
          campaign: b.campaign, adset: b.adset || '', level: b.adset ? 'Ad set' : 'ทั้งแคมเปญ', from: from, to: to, days: days,
          ongoing: !list[i + 1] && !(cp.end_date && cp.end_date < today),
          daily: Number(b.daily_budget) || 0, planned: (Number(b.daily_budget) || 0) * days, spend: spend,
          leads: leads, closed: closedP.length, amount: closedP.reduce(function (a, p) { return a + (Number(p.amount) || 0); }, 0),
          leadsPerDay: leads / days, cpl: leads ? spend / leads : null, cpc: closedP.length ? spend / closedP.length : null,
          note: b.note || '', budget: b
        };
        if (prev) {
          row.budgetChange = prev.daily ? (row.daily - prev.daily) / prev.daily : null;
          row.lpdChange = prev.leadsPerDay ? (row.leadsPerDay - prev.leadsPerDay) / prev.leadsPerDay : null;
          row.cplChange = prev.cpl && row.cpl != null ? (row.cpl - prev.cpl) / prev.cpl : null;
        }
        prev = row;
        if (opts.campaign || (to >= opts.from && from <= opts.to)) out.push(row);
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
    L.push('• งบที่ใช้รวม ' + baht(m.spend) + ' (เฉลี่ย ' + baht(m.avgPerDay) + '/วัน, ' + m.spendDays + ' วัน · คิดจากงบที่ตั้ง)');
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
    adsetsOf: adsetsOf, budgetAt: budgetAt, plannedSpend: plannedSpend, budgetPeriods: budgetPeriods, campaignStatus: campaignStatus,
    fmt: { baht: baht, int: int, pct: pct, thDate: thDate, thRange: thRange }
  };
})();
