/**
 * หน้าบันทึกแชท — แถบบันทึกเร็ว + รายการแชททั้งหมด (ค้นหา/กรอง/เปลี่ยนสถานะ/แก้/ลบ)
 */
(function () {
  'use strict';
  const esc = UI.esc, icon = UI.icon;
  const st = { q: '', from: null, to: null, campaign: '', status: '', stage: '', stale: false, limit: 60, lastAd: '', lastDate: '' };

  function applyQuery(params) {
    const today = Store.today();
    st.from = params.from || UI.monthRange(today).from;
    st.to = params.to || today;
    st.q = params.q || '';
    st.stage = params.stage || '';
    st.stale = params.stale === '1';
    st.status = params.status || '';
    st.campaign = params.campaign || '';
    st.limit = 60;
    if (st.stale) st.from = Store.d().chats_from;
  }

  function filtered() {
    const sMap = Store.sMap();
    const set = Store.settings();
    let list = Store.chats().filter(c => c.chat_date >= st.from && c.chat_date <= st.to);
    if (st.stale) list = Metrics.staleChats(Store.chats(), sMap, Store.today(), set.stale_days, set.stale_max_days);
    if (st.campaign) list = list.filter(c => c.campaign_id === st.campaign);
    if (st.status) list = list.filter(c => String(c.status) === st.status);
    if (st.stage) list = list.filter(c => sMap[c.status] && sMap[c.status].in_funnel && sMap[c.status].stage === Number(st.stage));
    if (st.q) {
      const q = Metrics.customerKey(st.q);
      list = list.filter(c => (c.customer_key + ' ' + String(c.product).toLowerCase() + ' ' + String(c.contact) + ' ' + String(c.product_code).toLowerCase()).indexOf(q) >= 0);
    }
    return list.sort((a, b) => (b.chat_date + b.created_at).localeCompare(a.chat_date + a.created_at));
  }

  function render(el) {
    if (!st.from) applyQuery({});
    const today = Store.today();
    const list = filtered();
    const shown = list.slice(0, st.limit);
    const sMap = Store.sMap();
    const won = list.filter(c => sMap[c.status] && sMap[c.status].is_won && !c.duplicate_of);
    const buy = won.reduce((t, c) => t + Number(c.buy_amount || 0), 0);
    const adDefault = st.lastAd || '';

    el.innerHTML =
      '<div class="page-h"><div><h1>บันทึกแชท</h1><p>พิมพ์ชื่อลูกค้า เลือกโฆษณา แล้วกด Enter — Ad set กับแคมเปญระบบเติมให้เอง</p></div></div>' +

      '<section class="card" aria-labelledby="h-quick">' +
      '<div class="card-t"><h2 id="h-quick" style="font-size:18px">แชทใหม่</h2></div>' +
      '<form id="quick" autocomplete="off">' +
      '<div class="quick">' +
      '<label class="field"><span>วันที่</span><input class="input" type="date" name="chat_date" value="' + esc(st.lastDate || today) + '" max="' + today + '" required></label>' +
      '<label class="field"><span>ชื่อลูกค้า</span><input class="input" name="customer_name" id="q-name" required placeholder="ชื่อตามในเพจ"></label>' +
      '<label class="field"><span>มาจากโฆษณา</span><select class="select" name="ad_id" id="q-ad" required>' + ChatForms.adOptions(adDefault) + '</select></label>' +
      '<label class="field"><span>สถานะ</span><select class="select" name="status" id="q-status">' + ChatForms.statusOptions('1') + '</select></label>' +
      '<label class="field"><span>สินค้า</span><input class="input" name="product" placeholder="ไม่บังคับ"></label>' +
      '<button type="submit" class="btn primary">' + icon('plus', 18, null, 2.2) + 'บันทึก</button>' +
      '</div>' +
      '<div class="quick-extra" data-won hidden style="margin-top:12px">' +
      '<label class="field"><span>ยอดรับซื้อจริง (บาท) *</span><input class="input num" name="buy_amount" inputmode="numeric"></label>' +
      '<label class="field"><span>Product ID (ถ้ามี)</span><input class="input" name="product_code"></label>' +
      '</div>' +
      '<div id="q-hint" class="callout purple" style="margin-top:12px" hidden></div>' +
      '</form>' +
      '</section>' +

      '<section class="card" aria-labelledby="h-list">' +
      '<div class="card-h"><div class="card-t"><h2 id="h-list">แชททั้งหมด</h2><span class="sub num">' + list.length + ' ราย · ปิด ' + won.length + ' · รับซื้อ ' + UI.num(buy) + ' ฿</span></div></div>' +
      '<div class="filters">' +
      '<label class="sr" for="f-q">ค้นหา</label><input id="f-q" class="input grow" type="search" data-f="q" value="' + esc(st.q) + '" placeholder="ค้นหาชื่อ สินค้า เบอร์ Product ID">' +
      '<label class="sr" for="f-from">ตั้งแต่</label><input id="f-from" class="input" type="date" data-f="from" value="' + esc(st.from) + '"' + (st.stale ? ' disabled' : '') + '>' +
      '<span class="muted">ถึง</span>' +
      '<label class="sr" for="f-to">ถึง</label><input id="f-to" class="input" type="date" data-f="to" value="' + esc(st.to) + '"' + (st.stale ? ' disabled' : '') + '>' +
      '<label class="sr" for="f-c">แคมเปญ</label><select id="f-c" class="select" data-f="campaign"><option value="">ทุกแคมเปญ</option>' +
      Store.campaigns().map(c => '<option value="' + esc(c.campaign_id) + '"' + (c.campaign_id === st.campaign ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select>' +
      '<label class="sr" for="f-s">สถานะ</label><select id="f-s" class="select" data-f="status"><option value="">ทุกสถานะ</option>' +
      Store.statuses().map(s => '<option value="' + esc(s.code) + '"' + (String(s.code) === st.status ? ' selected' : '') + '>' + esc(s.label) + '</option>').join('') + '</select>' +
      '<label class="check"><input type="checkbox" data-f="stale"' + (st.stale ? ' checked' : '') + '>ต้องตาม</label>' +
      (st.stage ? '<button type="button" class="btn sm" data-act="clear-stage">ค้างขั้น ' + esc(st.stage) + ' ' + icon('x', 14) + '</button>' : '') +
      '</div>' +
      (shown.length ?
        '<div class="table-wrap"><table><thead><tr><th>วันที่</th><th>ลูกค้า</th><th>สินค้า</th><th>โฆษณา</th><th>สถานะ</th><th class="r">รับซื้อ</th><th><span class="sr">จัดการ</span></th></tr></thead><tbody>' +
        shown.map(c => {
          const s = sMap[c.status], ad = Store.ad(c.ad_id), as = Store.adset(c.adset_id), col = UI.statusColors(s);
          return '<tr>' +
            '<td class="num" style="white-space:nowrap">' + UI.thDate(c.chat_date) + '<div class="cell-sub">' + esc(UI.timeOf(c.created_at)) + '</div></td>' +
            '<td><div class="cell-name">' + esc(c.customer_name) + '</div>' +
            (c.duplicate_of ? '<div class="cell-sub">ซ้ำกับ ' + esc(c.duplicate_of) + '</div>' : c.contact ? '<div class="cell-sub">' + esc(c.contact) + '</div>' : '') + '</td>' +
            '<td>' + esc(c.product || '–') + (c.product_code ? '<div class="cell-sub">' + esc(c.product_code) + '</div>' : '') + '</td>' +
            '<td style="max-width:240px"><div>' + esc(ad ? ad.name : c.ad_id) + '</div>' + (as && ad && as.name !== ad.name ? '<div class="cell-sub">' + esc(as.name) + '</div>' : '') + '</td>' +
            '<td><label class="sr" for="s-' + esc(c.chat_id) + '">สถานะ</label><select id="s-' + esc(c.chat_id) + '" class="status-select" data-status="' + esc(c.chat_id) + '" style="background-color:' + col.bg + ';color:' + col.fg + '">' + ChatForms.statusOptions(c.status) + '</select></td>' +
            '<td class="r num">' + (s && s.is_won && c.buy_amount ? UI.num(c.buy_amount) : '') + '</td>' +
            '<td><div class="row-actions">' +
            '<button type="button" data-edit="' + esc(c.chat_id) + '" aria-label="แก้ ' + esc(c.customer_name) + '">' + icon('edit', 17) + '</button>' +
            '<button type="button" data-hist="' + esc(c.chat_id) + '" aria-label="ประวัติ ' + esc(c.customer_name) + '">' + icon('history', 17) + '</button>' +
            '<button type="button" data-del="' + esc(c.chat_id) + '" aria-label="ลบ ' + esc(c.customer_name) + '">' + icon('trash', 17) + '</button>' +
            '</div></td></tr>';
        }).join('') + '</tbody></table></div>' +
        (list.length > shown.length ? '<button type="button" class="btn" data-act="more" style="align-self:center">แสดงเพิ่ม (' + (list.length - shown.length) + ')</button>' : '')
        : '<div class="empty">ไม่พบแชทตามเงื่อนไข</div>') +
      '</section>';

    toggleWon(el);
  }

  function toggleWon(el) {
    const sel = el.querySelector('#q-status');
    const box = el.querySelector('#quick [data-won]');
    if (!sel || !box) return;
    const on = ChatForms.isWon(sel.value);
    box.hidden = !on;
  }

  /** เตือนตั้งแต่พิมพ์ว่าชื่อนี้เคยทักมาแล้ว */
  function hint(el) {
    const box = el.querySelector('#q-hint');
    const name = el.querySelector('#q-name').value;
    const key = Metrics.customerKey(name);
    if (key.length < 3) { box.hidden = true; return; }
    const hits = Store.chats().filter(c => c.customer_key === key).sort((a, b) => b.chat_date.localeCompare(a.chat_date)).slice(0, 3);
    if (!hits.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = '<b>ชื่อนี้เคยทักมาแล้ว</b> — ' + hits.map(c => {
      const cp = Store.campaign(c.campaign_id), s = Store.status(c.status);
      return UI.thDate(c.chat_date) + ' · ' + esc(cp ? cp.name : '') + ' · ' + esc(s ? s.label : '');
    }).join(' / ') + '<br><span style="font-size:13px">ถ้าเป็นแคมเปญเดียวกัน ระบบจะถามว่าจะอัปเดตแชทเดิมหรือไม่</span>';
  }

  async function submitQuick(el, form) {
    const v = ChatForms.cleanNums(UI.formData(form));
    if (!v.customer_name) return UI.toast('ต้องใส่ชื่อลูกค้า', true);
    if (!v.ad_id) return UI.toast('ต้องเลือกโฆษณา', true);
    if (ChatForms.isWon(v.status) && !Number(v.buy_amount)) return UI.toast('ปิดการขายต้องใส่ยอดรับซื้อ', true);
    if (!ChatForms.isWon(v.status)) { delete v.buy_amount; delete v.product_code; }
    st.lastAd = v.ad_id; st.lastDate = v.chat_date;
    const btn = form.querySelector('button[type="submit"]');
    const r = await UI.busy(btn, () => Store.saveChat(v));
    const after = () => { App.render(); const n = document.getElementById('q-name'); if (n) n.focus(); };
    if (r.duplicate) { ChatForms.duplicate(r.duplicate, v, after); return; }
    UI.toast('บันทึกแชทแล้ว — ' + r.chat.customer_name);
    after();
  }

  function find(id) { return Store.chats().find(x => x.chat_id === id); }

  async function onClick(e, el) {
    const t = e.target;
    const b = t.closest('[data-edit],[data-hist],[data-del],[data-act]');
    if (!b) return;
    if (b.dataset.edit) { const c = find(b.dataset.edit); if (c) ChatForms.edit(c, () => App.render()); }
    if (b.dataset.hist) { const c = find(b.dataset.hist); if (c) ChatForms.showHistory(c); }
    if (b.dataset.del) {
      const c = find(b.dataset.del);
      if (c && await UI.confirmBox('ลบแชทนี้?', c.customer_name + ' (' + UI.thDate(c.chat_date) + ') จะหายจากรายการและสรุป — ข้อมูลยังเก็บในชีตแบบซ่อน', 'ลบ')) {
        try { await Store.deleteChat(c.chat_id); UI.toast('ลบแล้ว'); App.render(); } catch (err) { UI.toast(err.message, true); }
      }
    }
    if (b.dataset.act === 'more') { st.limit += 60; App.render(); }
    if (b.dataset.act === 'clear-stage') { st.stage = ''; App.render(); }
  }

  function onChange(e, el) {
    const t = e.target;
    if (t.id === 'q-status') { toggleWon(el); return; }
    if (t.dataset.status) {
      const c = find(t.dataset.status);
      if (c) ChatForms.changeStatus(c, t.value, () => App.render());
      if (c && ChatForms.isWon(t.value)) t.value = c.status;
      return;
    }
    const f = t.dataset.f;
    if (f && f !== 'q') {
      st[f] = t.type === 'checkbox' ? t.checked : t.value;
      if (f === 'stale' && !st.stale) { st.from = UI.monthRange(Store.today()).from; st.to = Store.today(); }
      if (f === 'stale' && st.stale) st.from = Store.d().chats_from;
      st.limit = 60;
      if (f === 'from' && st.from) {
        Store.ensureFrom(st.from).then(() => App.render()).catch(err => UI.toast(err.message, true));
      }
      App.render();
    }
  }

  let qTimer = null;
  function onInput(e, el) {
    const t = e.target;
    if (t.id === 'q-name') hint(el);
    if (t.dataset.f === 'q') {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => {
        st.q = t.value; st.limit = 60;
        const pos = t.selectionStart;
        App.render();
        const n = document.getElementById('f-q');
        if (n) { n.focus(); n.setSelectionRange(pos, pos); }
      }, 250);
    }
  }

  function onSubmit(e, el) {
    if (e.target.id === 'quick') { e.preventDefault(); submitQuick(el, e.target).catch(() => {}); }
  }

  App.page('chats', { title: 'บันทึกแชท', render, onClick, onChange, onInput, onSubmit, onEnter: applyQuery });
})();
