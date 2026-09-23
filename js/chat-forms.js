/**
 * chat-forms.js — ป๊อปอัปที่ใช้ร่วมกันหลายหน้า: บันทึก/แก้แชท, ปิดการขาย, ชื่อซ้ำ, ประวัติสถานะ
 */
(function () {
  'use strict';
  const esc = UI.esc;

  function adOptions(selected) {
    const groups = Store.activeAdGroups();
    // โฆษณาที่ปิดไปแล้วแต่แชทเดิมใช้อยู่ ต้องยังเลือกได้ตอนแก้
    const cur = selected && Store.ad(selected);
    let html = '<option value="">— เลือกโฆษณา —</option>';
    groups.forEach(g => {
      html += '<optgroup label="' + esc(g.campaign.name) + '">';
      g.ads.forEach(x => {
        html += '<option value="' + esc(x.ad.ad_id) + '"' + (x.ad.ad_id === selected ? ' selected' : '') + '>' + esc(Store.adLabel(x.ad)) + '</option>';
      });
      html += '</optgroup>';
    });
    if (cur && cur.status !== 'active') {
      html += '<optgroup label="ปิดแล้ว"><option value="' + esc(cur.ad_id) + '" selected>' + esc(Store.adLabel(cur)) + '</option></optgroup>';
    }
    return html;
  }

  function statusOptions(selected) {
    return Store.statuses().map(s => '<option value="' + esc(s.code) + '"' + (String(s.code) === String(selected) ? ' selected' : '') + '>' + esc(s.label) + '</option>').join('');
  }

  function isWon(code) { const s = Store.status(code); return !!(s && s.is_won); }

  /** แสดง/ซ่อนช่องปิดการขายตามสถานะที่เลือก */
  function bindWonToggle(root) {
    const sel = root.querySelector('[name="status"]');
    const box = root.querySelector('[data-won]');
    if (!sel || !box) return;
    const upd = () => {
      const on = isWon(sel.value);
      box.hidden = !on;
      const amt = box.querySelector('[name="buy_amount"]');
      if (amt) amt.required = on;
    };
    sel.addEventListener('change', upd);
    upd();
  }

  function cleanNums(o) {
    ['quoted_price', 'buy_amount'].forEach(k => { if (k in o) o[k] = String(o[k]).replace(/[,\s฿]/g, ''); });
    return o;
  }

  // ---------- บันทึก / แก้แชท ----------
  function edit(chat, done) {
    const c = chat || { chat_date: Store.today(), status: '1' };
    const isNew = !c.chat_id;
    UI.modal({
      title: isNew ? 'บันทึกแชทใหม่' : 'แก้แชท',
      wide: true,
      body:
        '<form id="chat-form" class="form-grid" novalidate>' +
        '<label class="field"><span>วันที่ทักเข้ามา</span><input class="input" type="date" name="chat_date" value="' + esc(c.chat_date) + '" max="' + esc(Store.today()) + '" required></label>' +
        '<label class="field"><span>ชื่อลูกค้า</span><input class="input" name="customer_name" value="' + esc(c.customer_name) + '" autocomplete="off" required autofocus></label>' +
        '<label class="field full"><span>มาจากโฆษณา</span><select class="select" name="ad_id" required>' + adOptions(c.ad_id) + '</select><span class="hint">เลือกโฆษณาตัวเดียว ระบบเติม Ad set และแคมเปญให้เอง</span></label>' +
        '<label class="field"><span>สถานะ</span><select class="select" name="status">' + statusOptions(c.status) + '</select></label>' +
        '<label class="field"><span>เบอร์ / LINE (ไม่บังคับ)</span><input class="input" name="contact" value="' + esc(c.contact) + '" inputmode="tel"></label>' +
        '<label class="field"><span>สินค้าที่ลูกค้าจะขาย</span><input class="input" name="product" value="' + esc(c.product) + '" placeholder="เช่น iPhone 15 Pro 256GB"></label>' +
        '<label class="field"><span>ราคาที่ประเมิน (บาท)</span><input class="input num" name="quoted_price" value="' + esc(c.quoted_price) + '" inputmode="numeric"></label>' +
        '<div class="full form-grid" data-won style="grid-column:1/-1">' +
        '<label class="field"><span>ยอดรับซื้อจริง (บาท) *</span><input class="input num" name="buy_amount" value="' + esc(c.buy_amount) + '" inputmode="numeric"></label>' +
        '<label class="field"><span>Product ID (ถ้ามี)</span><input class="input" name="product_code" value="' + esc(c.product_code) + '" placeholder="ID26090338"></label>' +
        '</div>' +
        '<label class="field full"><span>หมายเหตุ</span><textarea class="input" name="note" rows="2">' + esc(c.note) + '</textarea></label>' +
        '</form>',
      footer:
        (isNew ? '' : '<button type="button" class="btn ghost left" data-act="history">' + UI.icon('history', 18) + 'ประวัติ</button>') +
        '<button type="button" class="btn ghost" data-close>ยกเลิก</button>' +
        '<button type="submit" form="chat-form" class="btn primary">บันทึก</button>',
      onMount: bindWonToggle,
      handlers: { history: () => showHistory(c) },
      onSubmit: async (m, form) => {
        const v = cleanNums(UI.formData(form));
        if (!v.customer_name) return UI.toast('ต้องใส่ชื่อลูกค้า', true);
        if (!v.ad_id) return UI.toast('ต้องเลือกโฆษณา', true);
        if (isWon(v.status) && !Number(v.buy_amount)) return UI.toast('ปิดการขายต้องใส่ยอดรับซื้อ', true);
        if (!isWon(v.status)) { delete v.buy_amount; delete v.product_code; }
        const payload = Object.assign({}, isNew ? {} : { chat_id: c.chat_id }, v);
        const btn = m.querySelector('button[type="submit"]');
        const r = await UI.busy(btn, () => Store.saveChat(payload));
        if (r.duplicate) { duplicate(r.duplicate, payload, done); return; }
        UI.close();
        UI.toast(isNew ? 'บันทึกแชทแล้ว' : 'แก้แชทแล้ว');
        if (done) done(r.chat);
      },
    });
  }

  // ---------- ชื่อซ้ำ ----------
  function duplicate(existing, payload, done) {
    const s = Store.status(existing.status);
    const as = Store.adset(existing.adset_id);
    UI.modal({
      title: 'ลูกค้านี้ทักมาแล้ว',
      body:
        '<div class="callout">' +
        '<b>' + esc(existing.customer_name) + '</b> ทักมาเมื่อ ' + UI.thDate(existing.chat_date) + ' จาก ' + esc(as ? as.name : '') +
        '<div style="margin-top:8px">' + UI.statusPill(s) + (existing.product ? ' <span class="chip">' + esc(existing.product) + '</span>' : '') + '</div></div>' +
        '<p style="margin:14px 0 0">คนเดียวกันในแคมเปญเดียวกัน นับเป็นแชทเดิม — อัปเดตสถานะของแชทเดิมแทนการเพิ่มแถวใหม่</p>',
      footer:
        '<button type="button" class="btn ghost" data-act="force">คนละคน — บันทึกใหม่</button>' +
        '<button type="button" class="btn dark" data-act="update">อัปเดตแชทเดิม</button>',
      handlers: {
        force: async (m, e, b) => {
          const r = await UI.busy(b, () => Store.saveChat(payload, true));
          UI.close(); UI.toast('บันทึกแชทใหม่แล้ว'); if (done) done(r.chat);
        },
        update: async (m, e, b) => {
          const patch = { chat_id: existing.chat_id, customer_name: existing.customer_name, ad_id: existing.ad_id };
          ['status', 'product', 'quoted_price', 'buy_amount', 'product_code', 'contact', 'note'].forEach(k => { if (payload[k]) patch[k] = payload[k]; });
          // ไม่ลดสถานะแชทเดิมลง (เช่น เดิมประเมินแล้ว แต่ฟอร์มใหม่ตั้งเป็น "ทักแล้วเงียบ")
          const sm = Store.sMap();
          const oldStage = (sm[existing.status] || {}).stage || 0, newStage = (sm[patch.status] || {}).stage || 0;
          if (newStage < oldStage) patch.status = existing.status;
          const r = await UI.busy(b, () => Store.saveChat(patch));
          UI.close(); UI.toast('อัปเดตแชทเดิมแล้ว'); if (done) done(r.chat);
        },
      },
    });
  }

  // ---------- ปิดการขาย ----------
  function closeSale(chat, code, done) {
    UI.modal({
      title: 'ปิดการขาย — ' + chat.customer_name,
      body:
        '<form id="won-form" class="form-grid">' +
        '<label class="field full"><span>สินค้า</span><input class="input" name="product" value="' + esc(chat.product) + '" placeholder="เช่น iPhone 15 Pro 256GB"></label>' +
        '<label class="field"><span>ยอดรับซื้อจริง (บาท) *</span><input class="input num" name="buy_amount" value="' + esc(chat.buy_amount || chat.quoted_price) + '" inputmode="numeric" required autofocus></label>' +
        '<label class="field"><span>Product ID (ถ้ามี)</span><input class="input" name="product_code" value="' + esc(chat.product_code) + '" placeholder="ID26090338"></label>' +
        '<label class="field"><span>วันที่ปิด</span><input class="input" type="date" name="closed_date" value="' + esc(chat.closed_date || Store.today()) + '" max="' + esc(Store.today()) + '"></label>' +
        '</form>',
      footer: '<button type="button" class="btn ghost" data-close>ยกเลิก</button><button type="submit" form="won-form" class="btn primary">ปิดการขาย</button>',
      onSubmit: async (m, form) => {
        const v = cleanNums(UI.formData(form));
        if (!Number(v.buy_amount)) return UI.toast('ต้องใส่ยอดรับซื้อ', true);
        const r = await UI.busy(m.querySelector('button[type="submit"]'), () =>
          Store.setStatus(Object.assign({ chat_id: chat.chat_id, status: code }, v)));
        UI.close(); UI.toast('ปิดการขายแล้ว'); if (done) done(r);
      },
    });
  }

  /** เปลี่ยนสถานะ — ถ้าเป็นปิดการขายจะถามยอดก่อน */
  async function changeStatus(chat, code, done) {
    if (String(code) === String(chat.status)) return;
    if (isWon(code)) { closeSale(chat, code, done); return; }
    try {
      const r = await Store.setStatus({ chat_id: chat.chat_id, status: code });
      UI.toast('เปลี่ยนเป็น ' + Store.status(code).label);
      if (done) done(r);
    } catch (e) { UI.toast(e.message, true); if (done) done(chat); }
  }

  async function showHistory(c) {
    const m = UI.modal({ title: 'ประวัติสถานะ — ' + c.customer_name, body: '<div class="loading" style="min-height:120px"><span class="spin"></span></div>' });
    try {
      const rows = (await Store.history(c.chat_id)).sort((a, b) => String(a.changed_at).localeCompare(String(b.changed_at)));
      m.querySelector('.modal-b').innerHTML = rows.length ? '<div class="table-wrap"><table><thead><tr><th>เวลา</th><th>จาก</th><th>เป็น</th><th>โดย</th></tr></thead><tbody>' +
        rows.map(l => '<tr><td class="num">' + UI.thDate(l.changed_at) + ' ' + UI.timeOf(l.changed_at) + '</td><td>' +
          (l.from_status ? UI.statusPill(Store.status(l.from_status)) : '<span class="muted">ใหม่</span>') + '</td><td>' +
          UI.statusPill(Store.status(l.to_status)) + '</td><td>' + esc(l.changed_by) + '</td></tr>').join('') +
        '</tbody></table></div>' : '<p class="muted">ยังไม่มีประวัติ</p>';
    } catch (e) { m.querySelector('.modal-b').innerHTML = '<p>' + esc(e.message) + '</p>'; }
  }

  window.ChatForms = { edit, duplicate, closeSale, changeStatus, showHistory, adOptions, statusOptions, isWon, cleanNums };
})();
