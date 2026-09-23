/**
 * หน้าสรุปแคมเปญ — รูปแบบ 5 ส่วนที่ใช้ส่งทุกครั้ง + เทียบโฆษณาใน Ad set
 */
(function () {
  'use strict';
  const esc = UI.esc, icon = UI.icon;
  const st = { campaign: '' };

  function defaultCampaign() {
    const list = Store.campaigns().slice().sort((a, b) =>
      (a.status === 'ended') - (b.status === 'ended') || String(b.start_date).localeCompare(String(a.start_date)));
    return list[0] ? list[0].campaign_id : '';
  }

  function build() {
    const cp = Store.campaign(st.campaign);
    if (!cp) return null;
    const d = Store.d();
    const r = Metrics.campaignReport(
      Object.assign({}, cp, { start_date: cp.start_date || d.chats_from }),
      { chats: Store.chats(), spend: Store.spend(), adsets: Store.adsets(), statuses: d.statuses },
      Store.today(), Store.settings());
    const sMap = Store.sMap();
    const cs = Metrics.countableChats(Store.chats(), r.header.from, r.header.to, { campaign_id: cp.campaign_id });
    const quality = Metrics.adQuality(cs, Store.ads().filter(a => a.campaign_id === cp.campaign_id), sMap)
      .filter(q => q.chats > 0)
      .sort((a, b) => String(a.adset_id).localeCompare(String(b.adset_id)) || (b.quality_pct || 0) - (a.quality_pct || 0));
    return { cp, r, quality };
  }

  function render(el) {
    if (!st.campaign || !Store.campaign(st.campaign)) st.campaign = defaultCampaign();
    const x = build();
    const opts = Store.campaigns().slice().sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)))
      .map(c => '<option value="' + esc(c.campaign_id) + '"' + (c.campaign_id === st.campaign ? ' selected' : '') + '>' + esc(c.name) + (c.status === 'ended' ? ' (จบแล้ว)' : '') + '</option>').join('');

    let body = '';
    if (!x) {
      body = '<section class="card"><div class="empty">ยังไม่มีแคมเปญ — เพิ่มที่หน้า <a href="#/ads">แคมเปญ/โฆษณา</a></div></section>';
    } else {
      const { cp, r, quality } = x;
      const o = r.overview, h = r.header;
      const asById = {};
      Store.adsets().forEach(a => { asById[a.adset_id] = a; });
      body =
        // 1 หัวเรื่อง + 2 ภาพรวม
        '<section class="card">' +
        '<div class="card-h"><div class="report-title"><h2>' + esc(cp.name) + '</h2>' +
        '<div class="meta"><span>ยิง ' + UI.thDate(h.from, true) + ' – ' + UI.thDate(h.to, true) + ' (' + h.days + ' วัน)</span>' +
        (h.daily_budget ? '<span>· งบ ' + UI.num(h.daily_budget) + ' ฿/วัน</span>' : '') +
        '<span class="state ' + esc(cp.status) + '">' + stateLabel(cp.status) + '</span></div></div>' +
        '<button type="button" class="btn ghost" data-act="copy">' + icon('copy', 18) + 'คัดลอกเป็นข้อความ</button></div>' +
        '<div class="kpis">' +
        kpi('blue', 'งบที่ใช้รวม', UI.num(o.spend) + ' ฿') +
        kpi('blue', 'เฉลี่ยต่อวัน', UI.num(o.spend_per_day) + ' ฿') +
        kpi('green', 'Lead', UI.num(o.leads) + (o.outside_funnel ? ' <small style="font-size:13px;font-weight:500">+นอก funnel ' + o.outside_funnel + '</small>' : '')) +
        kpi('green', 'เคสปิด', UI.num(o.won)) +
        kpi('pink', 'ยอดรับซื้อรวม', UI.num(o.buy_amount) + ' ฿') +
        kpi('pink', '%ค่าแอด/ยอดรับซื้อ', UI.pct(o.ads_pct_of_buy)) +
        kpi('yellow', 'ต้นทุน/Lead', o.cost_per_lead === null ? '–' : UI.num(o.cost_per_lead) + ' ฿') +
        kpi('yellow', 'ต้นทุน/เคส', o.cost_per_won === null ? '–' : UI.num(o.cost_per_won) + ' ฿') +
        '</div></section>' +

        '<div class="grid3" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)">' +
        // 3 สถานะ
        '<section class="card"><div class="card-t"><h2>สถานะลูกค้า</h2></div>' +
        '<div class="table-wrap"><table><thead><tr><th>สถานะ</th><th class="r">จำนวน</th><th class="r">สัดส่วน</th></tr></thead><tbody>' +
        r.statuses.map(s => '<tr><td>' + UI.statusPill(Store.status(s.code)) + '</td><td class="r num">' + s.count + '</td><td class="r num">' + UI.pct(s.pct) + '</td></tr>').join('') +
        '<tr class="total"><td>รวม</td><td class="r num">' + r.statuses.reduce((t, s) => t + s.count, 0) + '</td><td class="r">100%</td></tr>' +
        '</tbody></table></div></section>' +
        // 4 เคสที่ปิด
        '<section class="card"><div class="card-t"><h2>เคสที่ปิดได้</h2></div>' +
        (r.won_cases.length > 1 ?
          '<div class="table-wrap"><table><thead><tr><th>ลูกค้า</th><th>สินค้า</th><th class="r">รับซื้อ</th><th>Ad set</th></tr></thead><tbody>' +
          r.won_cases.map((w, i) => '<tr' + (i === r.won_cases.length - 1 ? ' class="total"' : '') + '><td>' + esc(w.customer) + '</td><td>' + esc(w.product || '') + '</td><td class="r num">' + UI.num(w.buy_amount) + '</td><td>' + esc(w.adset) + '</td></tr>').join('') +
          '</tbody></table></div>' : '<div class="empty">ยังไม่มีเคสปิด</div>') +
        '</section></div>' +

        // 5 ผลตาม Ad set
        '<section class="card"><div class="card-t"><h2>ผลตาม Ad set</h2><span class="sub">เป้า ' + (Store.settings().target_cost_per_won ? UI.num(Store.settings().target_cost_per_won) + ' ฿/เคส' : 'ยังไม่ตั้ง') + '</span></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Ad set</th><th class="r">ใช้จ่าย</th><th class="r">Lead</th><th class="r">ต้นทุน/Lead</th><th class="r">ปิดได้</th><th class="r">ยอดรับซื้อ</th><th class="r">ต้นทุน/เคส</th><th>ควรทำอะไร</th></tr></thead><tbody>' +
        r.by_adset.rows.map(a => '<tr><td class="cell-name">' + esc(a.name) + '</td><td class="r num">' + UI.num(a.spend) + '</td><td class="r num">' + a.leads + '</td><td class="r num">' + UI.num(a.cost_per_lead) +
          '</td><td class="r num">' + a.won + '</td><td class="r num">' + UI.num(a.buy_amount) + '</td><td class="r num">' + UI.num(a.cost_per_won) + '</td><td>' + adviceChip(a.advice) + '</td></tr>').join('') +
        (() => { const t = r.by_adset.total; return '<tr class="total"><td>รวม</td><td class="r num">' + UI.num(t.spend) + '</td><td class="r num">' + t.leads + '</td><td class="r num">' + UI.num(t.cost_per_lead) + '</td><td class="r num">' + t.won + '</td><td class="r num">' + UI.num(t.buy_amount) + '</td><td class="r num">' + UI.num(t.cost_per_won) + '</td><td></td></tr>'; })() +
        '</tbody></table></div></section>' +

        // เทียบโฆษณา
        '<section class="card"><div class="card-t"><h2>โฆษณาตัวไหนดึงคนคุณภาพ</h2><span class="sub">% ที่ไปถึง "มีข้อมูลเครื่อง" ขึ้นไป — เทียบกันใน Ad set เดียวกัน</span></div>' +
        (quality.length ?
          '<div class="table-wrap"><table><thead><tr><th>โฆษณา</th><th>Ad set</th><th class="r">แชท</th><th class="r">ได้ข้อมูลเครื่อง</th><th class="r">% คุณภาพ</th><th class="r">ปิดได้</th></tr></thead><tbody>' +
          quality.map(q => '<tr><td class="cell-name">' + esc(q.name) + '</td><td>' + esc((asById[q.adset_id] || {}).name || '') + '</td><td class="r num">' + q.chats + '</td><td class="r num">' + q.got_device + '</td><td class="r num">' + UI.pct(q.quality_pct, 0) + '</td><td class="r num">' + q.won + '</td></tr>').join('') +
          '</tbody></table></div>' : '<div class="empty">ยังไม่มีแชท</div>') +
        '</section>';
    }

    el.innerHTML =
      '<div class="page-h"><div><h1>สรุปแคมเปญ</h1><p>เลือกแคมเปญ — นับตั้งแต่วันเริ่มยิงถึงวันจบ (หรือวันนี้ถ้ายังยิงอยู่)</p></div>' +
      '<label class="field" style="min-width:320px;max-width:100%"><span>แคมเปญ</span><select class="select" data-f="campaign">' + opts + '</select></label></div>' +
      body;
  }

  function kpi(color, label, value) { return '<div class="kpi ' + color + '"><span>' + esc(label) + '</span><b class="num">' + value + '</b></div>'; }
  function stateLabel(s) { return s === 'ended' ? 'จบแล้ว' : s === 'paused' ? 'หยุดชั่วคราว' : 'กำลังยิง'; }
  function adviceChip(a) {
    const bad = /เกินเป้า|หยุด|ปิดไม่ได้/.test(a), good = /คุ้ม|อยู่ในเป้า/.test(a);
    return '<span class="chip" style="' + (bad ? 'background:#FDE4E4;color:#A3272B' : good ? 'background:#E4F6E8;color:#1F6B34' : '') + '">' + esc(a) + '</span>';
  }

  /** ข้อความสรุปสำหรับวางใน LINE */
  function asText(x) {
    const { cp, r } = x, o = r.overview, h = r.header;
    const L = [];
    L.push('สรุปแคมเปญ: ' + cp.name);
    L.push('ยิง ' + UI.thDate(h.from, true) + ' – ' + UI.thDate(h.to, true) + ' (' + h.days + ' วัน)' + (h.daily_budget ? ' · งบ ' + UI.num(h.daily_budget) + ' ฿/วัน' : ''));
    L.push('');
    L.push('ภาพรวม');
    L.push('• งบที่ใช้รวม ' + UI.num(o.spend) + ' ฿ (เฉลี่ย ' + UI.num(o.spend_per_day) + ' ฿/วัน)');
    L.push('• Lead ' + o.leads + ' ราย · เคสปิด ' + o.won + ' เคส');
    L.push('• ยอดรับซื้อรวม ' + UI.num(o.buy_amount) + ' ฿ · %ค่าแอด/ยอดรับซื้อ ' + UI.pct(o.ads_pct_of_buy));
    L.push('• ต้นทุน/Lead ' + UI.num(o.cost_per_lead) + ' ฿ · ต้นทุน/เคส ' + UI.num(o.cost_per_won) + ' ฿');
    L.push('');
    L.push('สถานะลูกค้า');
    r.statuses.filter(s => s.count).forEach(s => L.push('• ' + s.label + ' ' + s.count + ' (' + UI.pct(s.pct) + ')'));
    if (r.won_cases.length > 1) {
      L.push('');
      L.push('เคสที่ปิดได้');
      r.won_cases.slice(0, -1).forEach(w => L.push('• ' + w.customer + ' · ' + (w.product || '-') + ' · ' + UI.num(w.buy_amount) + ' ฿ · ' + w.adset));
      L.push('รวม ' + UI.num(r.won_cases[r.won_cases.length - 1].buy_amount) + ' ฿');
    }
    L.push('');
    L.push('ผลตาม Ad set (ใช้จ่าย / Lead / ต้นทุนต่อ Lead / ปิด / รับซื้อ / ต้นทุนต่อเคส)');
    r.by_adset.rows.forEach(a => L.push('• ' + a.name + ': ' + UI.num(a.spend) + ' / ' + a.leads + ' / ' + UI.num(a.cost_per_lead) + ' / ' + a.won + ' / ' + UI.num(a.buy_amount) + ' / ' + UI.num(a.cost_per_won)));
    const t = r.by_adset.total;
    L.push('รวม: ' + UI.num(t.spend) + ' / ' + t.leads + ' / ' + UI.num(t.cost_per_lead) + ' / ' + t.won + ' / ' + UI.num(t.buy_amount) + ' / ' + UI.num(t.cost_per_won));
    return L.join('\n');
  }

  async function onClick(e) {
    const b = e.target.closest('[data-act="copy"]');
    if (!b) return;
    const x = build();
    if (!x) return;
    const text = asText(x);
    try { await navigator.clipboard.writeText(text); UI.toast('คัดลอกแล้ว — วางใน LINE ได้เลย'); }
    catch (err) {
      UI.modal({ title: 'คัดลอกข้อความ', body: '<textarea class="input" rows="16" style="width:100%;font-size:13px" readonly>' + esc(text) + '</textarea>' });
    }
  }

  function onChange(e) {
    if (e.target.dataset.f === 'campaign') {
      st.campaign = e.target.value;
      enter();
    }
  }

  function enter(params) {
    if (params && params.campaign) st.campaign = params.campaign;
    if (!st.campaign) st.campaign = defaultCampaign();
    const cp = Store.campaign(st.campaign);
    if (cp && cp.start_date) Store.ensureFrom(cp.start_date).then(ok => { if (ok) App.render(); }).catch(err => UI.toast(err.message, true));
    App.render();
  }

  App.page('report', { title: 'สรุปแคมเปญ', render, onClick, onChange, onEnter: p => { if (p.campaign) st.campaign = p.campaign; const cp = Store.campaign(st.campaign || defaultCampaign()); if (cp && cp.start_date) Store.ensureFrom(cp.start_date).then(ok => { if (ok) App.render(); }).catch(err => UI.toast(err.message, true)); } });
})();
