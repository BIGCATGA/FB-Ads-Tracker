/**
 * หน้าแรก — Dashboard (ตาม mockup)
 */
(function () {
  'use strict';
  const esc = UI.esc, icon = UI.icon;
  const st = { day: null, anchor: null, period: 'month' };
  const ARC = 219.9, RING = 188.5;

  function periodRange(p, today) {
    if (p === 'week') return { from: UI.addDays(today, -6), to: today, label: '7 วันล่าสุด' };
    if (p === 'last') { const r = UI.monthRange(UI.prevMonth(today)); return { from: r.from, to: r.to, label: UI.thMonth(r.from) }; }
    return { from: UI.monthRange(today).from, to: today, label: 'เดือนนี้' };
  }

  function shortAdset(name) {
    const s = String(name).replace(/^Ad Set /i, '').replace(/\s*:\s*/, ' ');
    return s.length > 18 ? s.slice(0, 17) + '…' : s;
  }

  function render(el) {
    const today = Store.today();
    if (!st.day) { st.day = today; st.anchor = today; }
    const sMap = Store.sMap();
    const set = Store.settings();
    const all = Store.chats();
    const pr = periodRange(st.period, today);
    const days = Metrics.daysInclusive(pr.from, pr.to < today ? pr.to : today);
    const cs = Metrics.countableChats(all, pr.from, pr.to);
    const fn = Metrics.funnel(cs, sMap, 10);
    const fc = Metrics.funnelChats(cs, sMap);
    const won = fc.filter(c => sMap[c.status].is_won);
    const buy = won.reduce((t, c) => t + Number(c.buy_amount || 0), 0);
    const spend = Metrics.spendInRange(Store.spend(), pr.from, pr.to).total;
    const cpw = won.length ? spend / won.length : null;
    const cpl = fc.length ? spend / fc.length : null;
    const pctBuy = buy ? spend / buy : null;
    const target = set.target_cost_per_won;

    // ---- แชทรายวัน ----
    const dayChats = all.filter(c => c.chat_date === st.day && !c.duplicate_of)
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    const todayNew = all.filter(c => c.chat_date === today && !c.duplicate_of).length;
    const stale = Metrics.staleChats(all, sMap, today, set.stale_days, set.stale_max_days)
      .sort((a, b) => String(a.updated_at || a.chat_date).localeCompare(String(b.updated_at || b.chat_date)));
    const chatDays = {};
    all.forEach(c => { chatDays[c.chat_date] = true; });
    const strip = [-2, -1, 0, 1, 2].map(i => UI.addDays(st.anchor, i));

    // ---- sparkline Lead รายวัน ----
    const n = Metrics.daysInclusive(pr.from, pr.to);
    const perDay = [];
    for (let i = 0; i < n; i++) {
      const dd = UI.addDays(pr.from, i);
      if (dd > today) break;
      perDay.push(fc.filter(c => c.chat_date === dd).length);
    }
    const mx = Math.max(1, ...perDay);
    const spark = perDay.map((v, i) => (perDay.length === 1 ? 90 : (i / (perDay.length - 1)) * 180).toFixed(1) + ',' + (44 - v / mx * 40).toFixed(1)).join(' ');

    // ---- Ad set ----
    const tbl = Metrics.adsetTable(cs, Store.spend(), Store.adsets(), sMap, pr.from, pr.to, set);
    const rows = tbl.rows.filter(r => r.spend > 0)
      .sort((a, b) => (a.cost_per_won === null) - (b.cost_per_won === null) || (a.cost_per_won || 0) - (b.cost_per_won || 0))
      .slice(0, 6);
    const vals = rows.map(r => r.cost_per_won).filter(v => v !== null);
    const scale = Math.max(target ? target * 1.4 : 0, ...vals, 1);
    const best = vals.length ? Math.min(...vals) : null;

    const lk = fn.leak;
    el.innerHTML =
      '<div class="hello">' +
      '<div><h1>สวัสดี, <b>' + esc((Api.me() || {}).name || '') + '</b></h1>' +
      '<p>วันนี้มีแชทใหม่ <strong class="num">' + todayNew + '</strong> ราย · ต้องตาม <strong class="num">' + stale.length + '</strong> ราย</p></div>' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">' + UI.thDate(today, true) + '</span>' +
      (Api.isDemo() ? '<span class="pill-note">โหมดทดลอง · ข้อมูลตัวอย่าง</span>' : '') + '</div></div>' +

      '<div class="grid3">' +

      // ===== ซ้าย =====
      '<div class="col">' +
      '<section class="card" aria-labelledby="h-daily">' +
      '<div class="card-h"><div class="card-t">' + icon('chat', 24) + '<h2 id="h-daily">แชทเข้ารายวัน</h2></div>' +
      '<button type="button" class="icon-btn sm" data-act="new" aria-label="บันทึกแชทใหม่">' + icon('plus', 18, null, 2) + '</button></div>' +
      '<div class="days">' +
      '<button type="button" class="arrow" data-act="prev" aria-label="ย้อนหลัง">' + icon('left', 18, null, 2) + '</button>' +
      '<div class="days-list">' + strip.map(dd => '<button type="button" class="day" data-day="' + dd + '" aria-pressed="' + (dd === st.day) + '"' + (dd > today ? ' disabled style="opacity:.45"' : '') + '>' +
        '<b class="num">' + UI.dayOfMonth(dd) + '</b><span>' + UI.TH_DOW[UI.dow(dd)] + '</span>' + (chatDays[dd] && dd !== st.day ? '<i></i>' : '') + '</button>').join('') + '</div>' +
      '<button type="button" class="arrow" data-act="next" aria-label="ถัดไป"' + (UI.addDays(st.anchor, 2) >= today ? ' disabled style="opacity:.3"' : '') + '>' + icon('right', 18, null, 2) + '</button>' +
      '</div>' +
      '<div class="muted" style="font-size:13px;margin-top:-6px">' + UI.thDate(st.day, true) + ' · ' + dayChats.length + ' แชท</div>' +
      '<div class="timeline">' + (dayChats.length ? dayChats.map(c => {
        const s = sMap[c.status], col = UI.statusColors(s), as = Store.adset(c.adset_id);
        return '<div class="tl"><div class="tl-rail"><span class="ring" style="border-color:' + col.dot + '"></span><span class="line"></span></div>' +
          '<div class="tl-body"><span class="tl-meta">' + esc(UI.timeOf(c.created_at)) + (as ? ' · ' + esc(as.name) : '') + '</span>' +
          '<button type="button" class="tl-name" data-edit="' + esc(c.chat_id) + '">' + esc(c.customer_name) + '</button>' +
          '<div class="tags">' + statusSelect(c, s) +
          (c.product ? '<span class="chip">' + esc(c.product) + '</span>' : '') +
          (s && s.is_won && c.buy_amount ? '<span class="chip money">รับซื้อ ' + UI.num(c.buy_amount) + ' ฿</span>' : '') +
          '</div></div></div>';
      }).join('') : '<div class="empty">ยังไม่มีแชทในวันนี้</div>') + '</div>' +
      '</section>' +

      '<section class="leak" aria-label="จุดรั่ว">' +
      '<div class="top"><span class="ic">' + icon('drop', 18, '#fff', 2) + '</span>จุดรั่ว · ' + esc(pr.label) + '</div>' +
      (lk ? '<h3>ขั้น ' + lk.from + ' → ' + lk.to + ' ผ่านแค่ ' + Math.round(lk.rate * 100) + '%</h3>' +
        '<p>' + esc(lk.text) + ' · ค้างที่ขั้น ' + lk.from + ' อยู่ ' + (fn.rows[lk.from - 1].count - fn.rows[lk.to - 1].count) + ' เคส</p>' +
        '<a href="#/chats?stage=' + lk.from + '&from=' + pr.from + '&to=' + pr.to + '">ดูเคสที่ค้างขั้นนี้ ' + icon('out', 14, '#fff', 2.2) + '</a>'
        : '<h3>ข้อมูลยังน้อย</h3><p>ต้องมี Lead อย่างน้อย 10 รายในช่วงนี้ถึงจะชี้จุดรั่วได้ (ตอนนี้ ' + fn.leads + ')</p>') +
      '</section>' +
      '</div>' +

      // ===== กลาง =====
      '<div class="col">' +
      '<section class="card" aria-labelledby="h-over">' +
      '<div class="card-h"><div class="card-t"><h2 id="h-over">ภาพรวม</h2><span class="sub">เป้า ' + (target ? UI.num(target) + ' ฿/เคส' : 'ยังไม่ตั้ง') + '</span></div>' +
      '<div class="seg" role="group" aria-label="ช่วงเวลา">' +
      [['week', '7 วัน'], ['month', 'เดือนนี้'], ['last', 'เดือนก่อน']].map(x => '<button type="button" data-period="' + x[0] + '" aria-pressed="' + (st.period === x[0]) + '">' + x[1] + '</button>').join('') +
      '</div></div>' +
      '<div class="tiles">' +
      '<div class="tile blue"><svg class="wave" viewBox="0 0 240 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34 C40 10 80 52 130 30 S210 4 240 20 V120 H0z" fill="#9DCCFA"/><path d="M0 58 C50 36 100 74 150 52 S220 34 240 44 V120 H0z" fill="#5BAEF5"/></svg>' +
      '<h3>ค่าแอด</h3><div class="row"><span class="big num">' + UI.num(spend) + ' ฿</span><span class="note num">เฉลี่ย ' + UI.num(spend / Math.max(days, 1)) + ' ฿/วัน</span></div></div>' +
      '<div class="tile yellow"><h3>ต้นทุน/เคสที่ปิดได้</h3>' + gauge('#F4E3B0', '#F5A524', cpw !== null ? Math.min(cpw / (target ? target * 1.5 : Math.max(cpw, 1) * 1.5), 1) : 0) +
      '<div class="row"><span class="big num">' + (cpw !== null ? UI.num(cpw) + ' ฿' : '–') + '</span><span class="note">' + cpwNote(cpw, target) + '</span></div></div>' +
      '<div class="tile green"><h3>Lead</h3>' +
      '<svg width="100%" height="48" viewBox="0 0 180 48" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + spark + '" fill="none" stroke="#4E9A2E" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>' +
      '<div class="row"><span class="big num">' + fc.length + ' <small>ราย</small></span><span class="note num">' + (cpl !== null ? UI.num(cpl) + ' ฿/lead' : '–') + '</span></div></div>' +
      '<div class="tile pink"><h3>%ค่าแอด/ยอดรับซื้อ</h3>' + gauge('#F7CBD7', '#E5486E', pctBuy !== null ? Math.min(pctBuy / 0.1, 1) : 0) +
      '<div class="row"><span class="big num">' + UI.pct(pctBuy) + '</span><span class="note num">รับซื้อ ' + UI.num(buy) + ' ฿</span></div></div>' +
      '</div></section>' +

      '<section class="card" aria-labelledby="h-funnel">' +
      '<div class="card-h"><div class="card-t">' + icon('funnel', 24) + '<h2 id="h-funnel">Funnel รับซื้อ</h2></div>' +
      '<span class="muted" style="font-size:13px">ปิดได้ ' + won.length + ' จาก ' + fn.leads + ' ราย</span></div>' +
      '<div class="funnel">' + fn.rows.map((r, i) => {
        const colors = ['#4DA3F7', '#34B89A', '#7B61FF', '#FF9F43', '#3DAA5C'];
        return '<div class="fstep"><div class="fring"><svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">' +
          '<circle cx="38" cy="38" r="30" fill="none" stroke="#F0EFF5" stroke-width="8"/>' +
          '<circle cx="38" cy="38" r="30" fill="none" stroke="' + colors[i] + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (r.pct * RING).toFixed(1) + ' ' + RING + '" transform="rotate(-90 38 38)"/>' +
          '</svg><span class="num">' + r.count + '</span></div><span class="lbl">' + esc(r.label) + '</span><span class="pct num">' + Math.round(r.pct * 100) + '%</span></div>';
      }).join('') + '</div>' +
      '<div class="rates">' + fn.rows.slice(1).map((r, i) => {
        const prev = fn.rows[i].count, rate = prev ? r.count / prev : null;
        const bad = lk && lk.to === r.stage;
        return '<span class="' + (bad ? 'bad' : '') + '">' + fn.rows[i].stage + '→' + r.stage + ' ' + (rate === null ? '–' : Math.round(rate * 100) + '%') + '</span>';
      }).join('') +
      (cs.length - fc.length ? '<span>นอก funnel ' + (cs.length - fc.length) + ' ราย</span>' : '') + '</div>' +
      '</section>' +
      '</div>' +

      // ===== ขวา =====
      '<div class="col">' +
      '<section class="card" aria-labelledby="h-follow">' +
      '<div class="card-h"><div class="card-t">' + icon('clock', 24) + '<h2 id="h-follow">ต้องตาม</h2><span class="chip warn">ค้าง ' + (set.stale_days + 1) + '–' + set.stale_max_days + ' วัน</span></div>' +
      '<a class="icon-btn dark" href="#/chats?stale=1" aria-label="ดูทั้งหมด">' + icon('out', 16, '#fff', 2.2) + '</a></div>' +
      '<div class="follow">' + (stale.length ? stale.map(c => {
        const s = sMap[c.status], age = UI.daysAgo(c.updated_at || c.chat_date, today);
        return '<label><input type="checkbox" data-touch="' + esc(c.chat_id) + '" aria-label="ตามแล้ว ' + esc(c.customer_name) + '">' +
          '<span class="dot" style="background:' + UI.statusColors(s).dot + '"></span>' +
          '<span class="who"><b>' + esc(c.customer_name) + '</b><small>' + esc(s ? s.label : '') + (c.product ? ' · ' + esc(c.product) : '') + '</small></span>' +
          '<span class="age num" style="color:' + (age >= 5 ? '#C4234A' : '#8A4B00') + '">ค้าง ' + age + ' วัน</span></label>';
      }).join('') : '<div class="empty">ไม่มีแชทค้าง</div>') + '</div>' +
      '<p class="muted" style="font-size:12px;margin:-8px 0 0">ติ๊ก = ตามแล้ว (เริ่มนับวันใหม่)</p>' +
      '<button type="button" class="btn primary big" data-act="new">' + icon('plus', 18, null, 2.2) + 'บันทึกแชทใหม่</button>' +
      '</section>' +

      '<section class="card" aria-labelledby="h-bars">' +
      '<div class="card-h"><div class="card-t">' + icon('chart', 24) + '<h2 id="h-bars">Ad set ไหนคุ้ม</h2></div><span class="muted" style="font-size:13px">ต้นทุน/เคส · ' + esc(pr.label) + '</span></div>' +
      (rows.length ?
        '<div class="bars">' +
        (target ? '<div class="target" style="bottom:' + Math.round(target / scale * 170) + 'px"></div>' : '') +
        rows.map(r => {
          const v = r.cost_per_won;
          const color = v === null ? '#E2E1EA' : v === best ? '#6D4DFF' : (!target || v <= target) ? '#CFC6FF' : '#F4A7BA';
          return '<div class="bar" title="' + esc(r.name) + ' · ใช้ ' + UI.num(r.spend) + ' ฿ · ปิด ' + r.won + '"><b class="num">' + (v === null ? 'ยังไม่ปิด' : UI.num(v)) + '</b><i style="height:' + (v === null ? 6 : Math.max(6, Math.round(v / scale * 170))) + 'px;background:' + color + '"></i></div>';
        }).join('') + '</div>' +
        '<div class="bar-labels">' + rows.map(r => '<span>' + esc(shortAdset(r.name)) + '</span>').join('') + '</div>' +
        '<div class="legend">' + (target ? '<span><i style="background:none;border-top:2px dashed #F5A524;height:0;width:14px;border-radius:0"></i>เป้า ' + UI.num(target) + '</span>' : '') + '<span><i style="background:#6D4DFF"></i>ดีสุด</span><span><i style="background:#CFC6FF"></i>อยู่ในเป้า</span><span><i style="background:#F4A7BA"></i>เกินเป้า</span><span><i style="background:#E2E1EA"></i>ยังไม่ปิด</span></div>'
        : '<div class="empty">ยังไม่มีค่าแอดในช่วงนี้ — ใส่ที่หน้า <a href="#/spend">ค่าแอด</a></div>') +
      '</section>' +
      '</div>' +
      '</div>';
  }

  function statusSelect(c, s) {
    const col = UI.statusColors(s);
    return '<label class="sr" for="st-' + esc(c.chat_id) + '">สถานะ ' + esc(c.customer_name) + '</label>' +
      '<select id="st-' + esc(c.chat_id) + '" class="status-select" data-status="' + esc(c.chat_id) + '" style="background-color:' + col.bg + ';color:' + col.fg + '">' +
      ChatForms.statusOptions(c.status) + '</select>';
  }

  function gauge(track, fill, frac) {
    return '<svg class="gauge" width="140" height="72" viewBox="0 0 180 96" aria-hidden="true">' +
      '<path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="' + track + '" stroke-width="14" stroke-linecap="round"/>' +
      (frac > 0 ? '<path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="' + fill + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + (frac * ARC).toFixed(1) + ' ' + ARC + '"/>' : '') +
      '</svg>';
  }

  function cpwNote(cpw, target) {
    if (cpw === null) return 'ยังไม่มีเคสปิด';
    if (!target) return 'ยังไม่ตั้งเป้า';
    return cpw <= target ? 'อยู่ในเป้า (' + Math.round(cpw / target * 100) + '%)' : 'เกินเป้า ' + Math.round((cpw / target - 1) * 100) + '%';
  }

  function onClick(e, el) {
    const t = e.target;
    const day = t.closest('[data-day]');
    if (day && !day.disabled) { st.day = day.dataset.day; App.render(); return; }
    const per = t.closest('[data-period]');
    if (per) {
      st.period = per.dataset.period;
      const r = periodRange(st.period, Store.today());
      Store.ensureFrom(r.from).then(() => App.render()).catch(err => UI.toast(err.message, true));
      App.render();
      return;
    }
    const act = t.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'new') ChatForms.edit(null, () => App.render());
      if (a === 'prev' || a === 'next') {
        st.anchor = UI.addDays(st.anchor, a === 'prev' ? -5 : 5);
        if (st.anchor > Store.today()) st.anchor = Store.today();
        st.day = st.anchor;
        Store.ensureFrom(UI.addDays(st.anchor, -2)).then(() => App.render()).catch(err => UI.toast(err.message, true));
      }
      return;
    }
    const ed = t.closest('[data-edit]');
    if (ed) { const c = Store.chats().find(x => x.chat_id === ed.dataset.edit); if (c) ChatForms.edit(c, () => App.render()); }
  }

  function onChange(e) {
    const t = e.target;
    if (t.dataset.status) {
      const c = Store.chats().find(x => x.chat_id === t.dataset.status);
      if (c) ChatForms.changeStatus(c, t.value, () => App.render());
      // ถ้ายกเลิกป๊อปอัปปิดการขาย ให้ค่าในกล่องกลับเป็นเดิม
      if (c && ChatForms.isWon(t.value)) t.value = c.status;
    }
    if (t.dataset.touch) {
      const c = Store.chats().find(x => x.chat_id === t.dataset.touch);
      if (!c) return;
      t.disabled = true;
      Store.touchChat(c).then(() => { UI.toast('ตามแล้ว — ' + c.customer_name); App.render(); })
        .catch(err => { UI.toast(err.message, true); t.checked = false; t.disabled = false; });
    }
  }

  App.page('home', { title: 'หน้าแรก', render, onClick, onChange });
})();
