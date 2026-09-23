/**
 * หน้าแคมเปญ/โฆษณา — แคมเปญ → Ad set → โฆษณา (+ลิงก์โพสต์ที่บูสต์, ครีเอทีฟ)
 */
(function () {
  'use strict';
  const esc = UI.esc, icon = UI.icon;
  const st = { showEnded: false };
  const STATES = [['active', 'กำลังยิง'], ['paused', 'หยุดชั่วคราว'], ['ended', 'จบแล้ว']];
  const stateLabel = s => (STATES.find(x => x[0] === s) || STATES[0])[1];

  function stateOptions(v) { return STATES.map(x => '<option value="' + x[0] + '"' + (x[0] === (v || 'active') ? ' selected' : '') + '>' + x[1] + '</option>').join(''); }
  function safeUrl(u) { return /^https?:\/\//i.test(String(u || '')) ? u : ''; }

  function render(el) {
    const camps = Store.campaigns().slice()
      .filter(c => st.showEnded || c.status !== 'ended')
      .sort((a, b) => (a.status === 'ended') - (b.status === 'ended') || String(b.start_date).localeCompare(String(a.start_date)));
    const endedCount = Store.campaigns().filter(c => c.status === 'ended').length;
    const today = Store.today();
    const month = UI.monthRange(today);
    const chats = Metrics.countableChats(Store.chats(), month.from, today);

    el.innerHTML =
      '<div class="page-h"><div><h1>แคมเปญ / โฆษณา</h1><p>ตั้งให้ตรงกับ Ads Manager — แชทเลือกได้เฉพาะโฆษณาที่ "กำลังยิง"</p></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      (endedCount ? '<label class="check"><input type="checkbox" data-f="ended"' + (st.showEnded ? ' checked' : '') + '>แสดงที่จบแล้ว (' + endedCount + ')</label>' : '') +
      '<button type="button" class="btn primary" data-act="new-camp">' + icon('plus', 18, null, 2.2) + 'แคมเปญใหม่</button></div></div>' +
      (camps.length ? camps.map(c => {
        const sets = Store.adsets().filter(a => a.campaign_id === c.campaign_id);
        const nChat = chats.filter(x => x.campaign_id === c.campaign_id).length;
        return '<section class="card camp">' +
          '<div class="camp-h"><div style="display:flex;flex-direction:column;gap:6px;min-width:0">' +
          '<h2>' + esc(c.name) + '</h2>' +
          '<div class="meta"><span class="state ' + esc(c.status) + '">' + stateLabel(c.status) + '</span>' +
          (c.objective ? '<span>' + esc(c.objective) + '</span>' : '') + (c.product_group ? '<span>· ' + esc(c.product_group) + '</span>' : '') +
          '<span>· เริ่ม ' + UI.thDate(c.start_date, true) + (c.end_date ? ' – ' + UI.thDate(c.end_date, true) : '') + '</span>' +
          (c.daily_budget ? '<span>· ' + UI.num(c.daily_budget) + ' ฿/วัน</span>' : '') +
          '<span>· แชทเดือนนี้ ' + nChat + '</span></div></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<a class="btn sm" href="#/report?campaign=' + encodeURIComponent(c.campaign_id) + '">' + icon('chart', 16) + 'สรุป</a>' +
          '<button type="button" class="btn sm" data-edit-camp="' + esc(c.campaign_id) + '">' + icon('edit', 16) + 'แก้</button>' +
          '<button type="button" class="btn sm dark" data-new-set="' + esc(c.campaign_id) + '">' + icon('plus', 16, null, 2) + 'Ad set</button></div></div>' +
          (sets.length ? '<div class="adsets">' + sets.map(s => {
            const ads = Store.ads().filter(a => a.adset_id === s.adset_id);
            return '<div class="adset">' +
              '<div class="adset-h"><div style="min-width:0"><b>' + esc(s.name) + '</b>' + (s.audience ? '<div class="cell-sub">' + esc(s.audience) + '</div>' : '') + '</div>' +
              '<div style="display:flex;gap:4px;align-items:center"><span class="state ' + esc(s.status) + '">' + stateLabel(s.status) + '</span>' +
              '<div class="row-actions"><button type="button" data-edit-set="' + esc(s.adset_id) + '" aria-label="แก้ Ad set ' + esc(s.name) + '">' + icon('edit', 16) + '</button></div></div></div>' +
              ads.map(a => {
                const post = safeUrl(a.post_url), cr = safeUrl(a.creative_url);
                return '<div class="ad"><div class="t"><div>' + esc(a.name) + '</div><small>' +
                  '<span class="state ' + esc(a.status) + '" style="padding:0 8px">' + stateLabel(a.status) + '</span>' +
                  (a.format ? '<span>' + esc(a.format) + '</span>' : '') +
                  (post ? '<a href="' + esc(post) + '" target="_blank" rel="noopener">' + icon('link', 13) + ' โพสต์</a>' : '') +
                  (cr ? '<a href="' + esc(cr) + '" target="_blank" rel="noopener">' + icon('image', 13) + ' ครีเอทีฟ</a>' : '') +
                  '</small></div><div class="row-actions"><button type="button" data-edit-ad="' + esc(a.ad_id) + '" aria-label="แก้โฆษณา ' + esc(a.name) + '">' + icon('edit', 16) + '</button></div></div>';
              }).join('') +
              '<button type="button" class="btn sm ghost" data-new-ad="' + esc(s.adset_id) + '" style="align-self:flex-start">' + icon('plus', 14, null, 2) + 'โฆษณา / โพสต์ที่บูสต์</button>' +
              '</div>';
          }).join('') + '</div>' : '<div class="empty" style="padding:16px 0">ยังไม่มี Ad set</div>') +
          '</section>';
      }).join('') : '<section class="card"><div class="empty">ยังไม่มีแคมเปญ — กด "แคมเปญใหม่"</div></section>');
  }

  // ---------- ฟอร์ม ----------
  function campForm(c) {
    c = c || { status: 'active', start_date: Store.today(), objective: 'Message' };
    UI.modal({
      title: c.campaign_id ? 'แก้แคมเปญ' : 'แคมเปญใหม่',
      body: '<form id="f-camp" class="form-grid">' +
        '<label class="field full"><span>ชื่อแคมเปญ (ตาม Ads Manager)</span><input class="input" name="name" value="' + esc(c.name) + '" required autofocus></label>' +
        '<label class="field"><span>วัตถุประสงค์</span><input class="input" name="objective" value="' + esc(c.objective) + '" list="objs"><datalist id="objs"><option value="Message"><option value="Engagement"><option value="Traffic"><option value="Leads"></datalist></label>' +
        '<label class="field"><span>กลุ่มสินค้า</span><input class="input" name="product_group" value="' + esc(c.product_group) + '" placeholder="Apple, Comset, Console…"></label>' +
        '<label class="field"><span>วันเริ่มยิงจริง</span><input class="input" type="date" name="start_date" value="' + esc(c.start_date) + '" required></label>' +
        '<label class="field"><span>วันจบ (ว่าง = ยังยิงอยู่)</span><input class="input" type="date" name="end_date" value="' + esc(c.end_date) + '"></label>' +
        '<label class="field"><span>งบต่อวัน (บาท)</span><input class="input num" name="daily_budget" value="' + esc(c.daily_budget) + '" inputmode="numeric"></label>' +
        '<label class="field"><span>สถานะ</span><select class="select" name="status">' + stateOptions(c.status) + '</select></label>' +
        '<label class="field full"><span>หมายเหตุ</span><input class="input" name="note" value="' + esc(c.note) + '"></label>' +
        '</form>',
      footer: '<button type="button" class="btn ghost" data-close>ยกเลิก</button><button type="submit" form="f-camp" class="btn primary">บันทึก</button>',
      onSubmit: async (m, form) => {
        const v = UI.formData(form);
        if (!v.name) return UI.toast('ต้องใส่ชื่อแคมเปญ', true);
        if (v.end_date && v.start_date && v.end_date < v.start_date) return UI.toast('วันจบต้องไม่ก่อนวันเริ่ม', true);
        v.daily_budget = v.daily_budget.replace(/[,\s฿]/g, '');
        if (c.campaign_id) v.campaign_id = c.campaign_id;
        await UI.busy(m.querySelector('[type=submit]'), () => Store.saveCampaign(v));
        UI.close(); UI.toast('บันทึกแคมเปญแล้ว'); App.render();
      },
    });
  }

  function setForm(s, campaignId) {
    s = s || { campaign_id: campaignId, status: 'active' };
    const cp = Store.campaign(s.campaign_id);
    UI.modal({
      title: (s.adset_id ? 'แก้ Ad set' : 'Ad set ใหม่') + ' — ' + (cp ? cp.name : ''),
      body: '<form id="f-set" class="form-grid">' +
        '<label class="field full"><span>ชื่อ Ad set (ตาม Ads Manager)</span><input class="input" name="name" value="' + esc(s.name) + '" required autofocus placeholder="Ad Set B : iPhone 14 / 15 / 16 / 17"></label>' +
        '<label class="field full"><span>กลุ่มเป้าหมายโดยย่อ</span><input class="input" name="audience" value="' + esc(s.audience) + '" placeholder="เช่น iPhone 14–17, กทม. 25–45"></label>' +
        '<label class="field"><span>สถานะ</span><select class="select" name="status">' + stateOptions(s.status) + '</select></label>' +
        '<label class="field"><span>หมายเหตุ</span><input class="input" name="note" value="' + esc(s.note) + '"></label>' +
        (s.adset_id ? '' : '<label class="check full"><input type="checkbox" name="make_ad" checked>สร้างโฆษณาชื่อเดียวกันให้ด้วย (แก้ทีหลังได้)</label>') +
        '</form>',
      footer: '<button type="button" class="btn ghost" data-close>ยกเลิก</button><button type="submit" form="f-set" class="btn primary">บันทึก</button>',
      onSubmit: async (m, form) => {
        const v = UI.formData(form);
        if (!v.name) return UI.toast('ต้องใส่ชื่อ Ad set', true);
        const makeAd = v.make_ad; delete v.make_ad;
        v.campaign_id = s.campaign_id;
        if (s.adset_id) v.adset_id = s.adset_id;
        await UI.busy(m.querySelector('[type=submit]'), async () => {
          const saved = await Store.saveAdset(v);
          if (makeAd) await Store.saveAd({ adset_id: saved.adset_id, name: saved.name, status: saved.status, start_date: (cp || {}).start_date || '' });
        });
        UI.close(); UI.toast('บันทึก Ad set แล้ว'); App.render();
      },
    });
  }

  function adForm(a, adsetId) {
    a = a || { adset_id: adsetId, status: 'active', format: 'image', start_date: Store.today() };
    const as = Store.adset(a.adset_id);
    const sets = Store.adsets().filter(x => as && x.campaign_id === as.campaign_id);
    UI.modal({
      title: a.ad_id ? 'แก้โฆษณา' : 'โฆษณาใหม่',
      wide: true,
      body: '<form id="f-ad" class="form-grid">' +
        '<label class="field full"><span>ชื่อโฆษณา (ที่แอดมินจะเห็นตอนบันทึกแชท)</span><input class="input" name="name" value="' + esc(a.name) + '" required autofocus></label>' +
        '<label class="field"><span>อยู่ใน Ad set</span><select class="select" name="adset_id">' + sets.map(x => '<option value="' + esc(x.adset_id) + '"' + (x.adset_id === a.adset_id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select></label>' +
        '<label class="field"><span>รูปแบบ</span><select class="select" name="format">' + [['image', 'รูป'], ['video', 'วิดีโอ'], ['carousel', 'หลายรูป']].map(x => '<option value="' + x[0] + '"' + (x[0] === a.format ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></label>' +
        '<label class="field full"><span>ลิงก์โพสต์ที่บูสต์</span><input class="input" type="url" name="post_url" value="' + esc(a.post_url) + '" placeholder="https://www.facebook.com/…"></label>' +
        '<label class="field full"><span>ลิงก์รูป/วิดีโอครีเอทีฟ</span><input class="input" type="url" name="creative_url" value="' + esc(a.creative_url) + '" placeholder="https://drive.google.com/…"></label>' +
        '<label class="field"><span>เริ่มยิง</span><input class="input" type="date" name="start_date" value="' + esc(a.start_date) + '"></label>' +
        '<label class="field"><span>หยุดยิง</span><input class="input" type="date" name="end_date" value="' + esc(a.end_date) + '"></label>' +
        '<label class="field"><span>สถานะ</span><select class="select" name="status">' + stateOptions(a.status) + '</select></label>' +
        '<label class="field"><span>หมายเหตุ</span><input class="input" name="note" value="' + esc(a.note) + '"></label>' +
        '</form>',
      footer: '<button type="button" class="btn ghost" data-close>ยกเลิก</button><button type="submit" form="f-ad" class="btn primary">บันทึก</button>',
      onSubmit: async (m, form) => {
        const v = UI.formData(form);
        if (!v.name) return UI.toast('ต้องใส่ชื่อโฆษณา', true);
        if (a.ad_id) v.ad_id = a.ad_id;
        await UI.busy(m.querySelector('[type=submit]'), () => Store.saveAd(v));
        UI.close(); UI.toast('บันทึกโฆษณาแล้ว'); App.render();
      },
    });
  }

  function onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const ds = b.dataset;
    if (ds.act === 'new-camp') campForm(null);
    if (ds.editCamp) campForm(Store.campaign(ds.editCamp));
    if (ds.newSet) setForm(null, ds.newSet);
    if (ds.editSet) setForm(Store.adset(ds.editSet));
    if (ds.newAd) adForm(null, ds.newAd);
    if (ds.editAd) adForm(Store.ad(ds.editAd));
  }
  function onChange(e) {
    if (e.target.dataset.f === 'ended') { st.showEnded = e.target.checked; App.render(); }
  }

  App.page('ads', { title: 'แคมเปญ/โฆษณา', render, onClick, onChange });
})();
