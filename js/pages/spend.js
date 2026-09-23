/**
 * หน้าค่าแอด — ใส่ยอดหลาย Ad set ทีเดียวต่อช่วงวันที่ + รายการที่ใส่แล้ว
 */
(function () {
  'use strict';
  const esc = UI.esc, icon = UI.icon;
  const st = { from: null, to: null, month: null };

  function liveSets() {
    return Store.campaigns().filter(c => c.status !== 'ended').map(c => ({
      c, sets: Store.adsets().filter(s => s.campaign_id === c.campaign_id && s.status !== 'ended'),
    })).filter(g => g.sets.length);
  }

  function overlaps(adsetId, from, to) {
    return Store.spend().filter(s => s.adset_id === adsetId && s.date_from <= to && s.date_to >= from);
  }

  function render(el) {
    const today = Store.today();
    if (!st.from) { st.from = today; st.to = today; st.month = today.slice(0, 7); }
    const groups = liveSets();
    const mr = UI.monthRange(st.month + '-01');
    const sp = Metrics.spendInRange(Store.spend(), mr.from, mr.to);
    const entries = Store.spend().filter(s => s.date_from <= mr.to && s.date_to >= mr.from)
      .sort((a, b) => b.date_from.localeCompare(a.date_from) || String(a.adset_id).localeCompare(String(b.adset_id)));
    const months = [];
    for (let i = 0, d = today; i < 4; i++, d = UI.prevMonth(d)) months.push(d.slice(0, 7));

    el.innerHTML =
      '<div class="page-h"><div><h1>ค่าแอด</h1><p>ใส่ยอดที่ใช้จริงจาก Ads Manager ต่อ Ad set — ใส่รายวัน รายสัปดาห์ หรือรายเดือนก็ได้ ระบบเฉลี่ยตามวันให้เอง</p></div></div>' +

      '<div class="grid3" style="grid-template-columns:minmax(0,1fr) minmax(0,1.25fr)">' +
      '<section class="card" aria-labelledby="h-in">' +
      '<div class="card-t">' + icon('wallet', 24) + '<h2 id="h-in">ใส่ค่าแอด</h2></div>' +
      '<form id="spend-form" autocomplete="off" style="display:flex;flex-direction:column;gap:16px">' +
      '<div class="form-grid">' +
      '<label class="field"><span>ตั้งแต่</span><input class="input" type="date" name="date_from" data-f="from" value="' + esc(st.from) + '" max="' + today + '" required></label>' +
      '<label class="field"><span>ถึง</span><input class="input" type="date" name="date_to" data-f="to" value="' + esc(st.to) + '" max="' + today + '" required></label>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="btn sm" data-range="today">วันนี้</button>' +
      '<button type="button" class="btn sm" data-range="yesterday">เมื่อวาน</button>' +
      '<button type="button" class="btn sm" data-range="week">7 วันก่อน</button>' +
      '<button type="button" class="btn sm" data-range="month">เดือนนี้</button></div>' +
      '<div class="muted" style="font-size:13px">' + UI.thDate(st.from, true) + (st.to !== st.from ? ' – ' + UI.thDate(st.to, true) : '') + ' · ' + Math.max(0, Metrics.daysInclusive(st.from, st.to)) + ' วัน</div>' +
      (groups.length ? '<div class="spend-grid">' + groups.map(g =>
        '<div class="spend-camp"><h3>' + esc(g.c.name) + '</h3>' + g.sets.map(s => {
          const ov = st.to >= st.from ? overlaps(s.adset_id, st.from, st.to) : [];
          return '<div class="spend-row"><div style="min-width:0"><div>' + esc(s.name) + '</div>' +
            (ov.length ? '<div class="cell-sub" style="color:#8A4B00">มีแล้ว ' + ov.map(o => UI.num(o.amount) + ' ฿ (' + UI.thDate(o.date_from) + (o.date_to !== o.date_from ? '–' + UI.thDate(o.date_to) : '') + ')').join(', ') + '</div>' : '') +
            '</div><label class="money-in"><span class="sr">ยอด ' + esc(s.name) + '</span><input class="input num" name="amt_' + esc(s.adset_id) + '" inputmode="decimal" placeholder="0"><span>฿</span></label></div>';
        }).join('') + '</div>').join('') + '</div>'
        : '<div class="empty">ยังไม่มี Ad set ที่กำลังยิง — เพิ่มที่หน้า <a href="#/ads">แคมเปญ/โฆษณา</a></div>') +
      '<button type="submit" class="btn primary big"' + (groups.length ? '' : ' disabled') + '>บันทึกค่าแอด</button>' +
      '</form></section>' +

      '<section class="card" aria-labelledby="h-list">' +
      '<div class="card-h"><div class="card-t"><h2 id="h-list">ค่าแอด ' + esc(UI.thMonth(st.month + '-01')) + '</h2></div>' +
      '<div class="seg" role="group" aria-label="เดือน">' + months.slice().reverse().map(m => '<button type="button" data-month="' + m + '" aria-pressed="' + (m === st.month) + '">' + esc(UI.thMonth(m + '-01').replace(/ \d+$/, '')) + '</button>').join('') + '</div></div>' +
      '<div class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">' +
      '<div class="kpi blue"><span>รวมทั้งเดือน</span><b class="num">' + UI.num(sp.total) + ' ฿</b></div>' +
      Store.campaigns().filter(c => sp.byCampaign[c.campaign_id]).map(c => '<div class="kpi"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(c.name) + '</span><b class="num" style="font-size:20px">' + UI.num(sp.byCampaign[c.campaign_id]) + ' ฿</b></div>').join('') +
      '</div>' +
      '<p class="muted" style="font-size:12px;margin:-6px 0 0">ยอดที่คร่อมเดือนถูกเฉลี่ยตามจำนวนวันที่อยู่ในเดือนนี้</p>' +
      (entries.length ?
        '<div class="table-wrap"><table><thead><tr><th>ช่วงวันที่</th><th>Ad set</th><th class="r">ยอด</th><th>คนใส่</th><th><span class="sr">จัดการ</span></th></tr></thead><tbody>' +
        entries.map(s => {
          const as = Store.adset(s.adset_id), cp = Store.campaign(s.campaign_id);
          return '<tr><td class="num" style="white-space:nowrap">' + UI.thDate(s.date_from) + (s.date_to !== s.date_from ? ' – ' + UI.thDate(s.date_to) : '') + '</td>' +
            '<td><div class="cell-name">' + esc(as ? as.name : s.adset_id) + '</div><div class="cell-sub">' + esc(cp ? cp.name : '') + '</div></td>' +
            '<td class="r num">' + UI.num(s.amount, s.amount % 1 ? 2 : 0) + '</td><td>' + esc(s.created_by) + '</td>' +
            '<td><div class="row-actions"><button type="button" data-edit="' + esc(s.spend_id) + '" aria-label="แก้">' + icon('edit', 17) + '</button>' +
            '<button type="button" data-del="' + esc(s.spend_id) + '" aria-label="ลบ">' + icon('trash', 17) + '</button></div></td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<div class="empty">ยังไม่มีค่าแอดในเดือนนี้</div>') +
      '</section></div>';
  }

  function setRange(kind) {
    const t = Store.today();
    if (kind === 'today') { st.from = t; st.to = t; }
    if (kind === 'yesterday') { st.from = UI.addDays(t, -1); st.to = st.from; }
    if (kind === 'week') { st.from = UI.addDays(t, -7); st.to = UI.addDays(t, -1); }
    if (kind === 'month') { st.from = UI.monthRange(t).from; st.to = t; }
  }

  async function submit(el, form) {
    const from = form.date_from.value, to = form.date_to.value;
    if (!from || !to) return UI.toast('ต้องใส่ช่วงวันที่', true);
    if (to < from) return UI.toast('วันสิ้นสุดต้องไม่ก่อนวันเริ่ม', true);
    const items = [];
    form.querySelectorAll('.err').forEach(x => x.classList.remove('err'));
    form.querySelectorAll('input[name^="amt_"]').forEach(inp => {
      const raw = inp.value.replace(/[,\s฿]/g, '');
      if (raw === '') return;
      if (!(Number(raw) >= 0)) { inp.classList.add('err'); return; }
      items.push({ adset_id: inp.name.slice(4), date_from: from, date_to: to, amount: Number(raw) });
    });
    if (form.querySelector('.err')) return UI.toast('มียอดที่ไม่ใช่ตัวเลข', true);
    if (!items.length) return UI.toast('ยังไม่ได้ใส่ยอด', true);
    const dup = items.filter(i => overlaps(i.adset_id, from, to).length);
    if (dup.length && !(await UI.confirmBox('มียอดในช่วงนี้อยู่แล้ว', dup.length + ' Ad set มีค่าแอดที่ทับช่วงวันที่นี้แล้ว ถ้าบันทึกต่อ ยอดจะถูกนับรวมกัน — ถ้าจะแก้ยอดเดิม ให้กดแก้ในรายการด้านขวาแทน', 'บันทึกเพิ่ม'))) return;
    const btn = form.querySelector('[type=submit]');
    await UI.busy(btn, async () => { for (const it of items) await Store.saveSpend(it); });
    UI.toast('บันทึกค่าแอด ' + items.length + ' รายการ');
    st.month = from.slice(0, 7);
    App.render();
  }

  function editSpend(s) {
    const as = Store.adset(s.adset_id);
    UI.modal({
      title: 'แก้ค่าแอด — ' + (as ? as.name : ''),
      body: '<form id="f-sp" class="form-grid">' +
        '<label class="field"><span>ตั้งแต่</span><input class="input" type="date" name="date_from" value="' + esc(s.date_from) + '" required></label>' +
        '<label class="field"><span>ถึง</span><input class="input" type="date" name="date_to" value="' + esc(s.date_to) + '" required></label>' +
        '<label class="field"><span>ยอด (บาท)</span><input class="input num" name="amount" value="' + esc(s.amount) + '" inputmode="decimal" required autofocus></label>' +
        '<label class="field"><span>หมายเหตุ</span><input class="input" name="note" value="' + esc(s.note) + '"></label></form>',
      footer: '<button type="button" class="btn ghost" data-close>ยกเลิก</button><button type="submit" form="f-sp" class="btn primary">บันทึก</button>',
      onSubmit: async (m, form) => {
        const v = UI.formData(form);
        v.amount = v.amount.replace(/[,\s฿]/g, '');
        if (!(Number(v.amount) >= 0) || v.amount === '') return UI.toast('ยอดไม่ถูกต้อง', true);
        if (v.date_to < v.date_from) return UI.toast('วันสิ้นสุดต้องไม่ก่อนวันเริ่ม', true);
        await UI.busy(m.querySelector('[type=submit]'), () => Store.saveSpend(Object.assign({ spend_id: s.spend_id, adset_id: s.adset_id }, v)));
        UI.close(); UI.toast('แก้แล้ว'); App.render();
      },
    });
  }

  async function onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.range) { keepTyped(() => { setRange(b.dataset.range); App.render(); }); }
    if (b.dataset.month) {
      st.month = b.dataset.month;
      App.render();
    }
    if (b.dataset.edit) { const s = Store.spend().find(x => x.spend_id === b.dataset.edit); if (s) editSpend(s); }
    if (b.dataset.del) {
      const s = Store.spend().find(x => x.spend_id === b.dataset.del);
      if (s && await UI.confirmBox('ลบค่าแอดนี้?', UI.num(s.amount) + ' ฿ (' + UI.thDate(s.date_from) + ' – ' + UI.thDate(s.date_to) + ')', 'ลบ')) {
        try { await Store.deleteSpend(s.spend_id); UI.toast('ลบแล้ว'); App.render(); } catch (err) { UI.toast(err.message, true); }
      }
    }
  }
  /** เก็บยอดที่พิมพ์ไว้ ข้ามการ render ใหม่ */
  function keepTyped(fn) {
    const typed = {};
    document.querySelectorAll('input[name^="amt_"]').forEach(i => { typed[i.name] = i.value; });
    fn();
    Object.keys(typed).forEach(k => { const i = document.querySelector('input[name="' + k + '"]'); if (i) i.value = typed[k]; });
  }

  function onChange(e) {
    const f = e.target.dataset.f;
    if (f === 'from' || f === 'to') {
      keepTyped(() => {
        st[f] = e.target.value;
        if (st.to < st.from) { if (f === 'from') st.to = st.from; else st.from = st.to; }
        App.render();
      });
    }
  }
  function onSubmit(e, el) {
    if (e.target.id === 'spend-form') { e.preventDefault(); submit(el, e.target).catch(() => {}); }
  }

  App.page('spend', { title: 'ค่าแอด', render, onClick, onChange, onSubmit });
})();
