/**
 * ข้อมูลจำลองสำหรับ "โหมดตัวอย่าง" (ใช้ตอนยังไม่ได้ใส่ API_URL)
 * จำนวนแชทต่อแคมเปญ/Ad set/สถานะ อิงสัดส่วนจากชีตเดิม ณ 23 ก.ย. 2026
 * ชื่อลูกค้า ยอดรับซื้อ และค่า Ads เป็นตัวเลขสมมติ
 */
(function () {
  var CAMP = {
    ENG: 'New - Engagement - 2026 - Apple',
    MSG01: '202608-BIGCAT-CAM-ENGAGE-MSG-01',
    BIRD: 'New – Message – Apple อ.เบิร์ด 09/02/2026',
    PS: 'New Message - Game Console - PS4 PS5',
    COM: '202609 – Comset – Test01'
  };
  var ADS = [
    ['ขายง่าย ได้เงินไว ที่ BIGCAT', 'AS-1', CAMP.ENG],
    ['ขายง่าย ได้เงินไว ที่ BIGCAT รับซื้อสินค้า Apple', 'AS-1', CAMP.ENG],
    ['ทำไมใครๆก็ไว้ใจ BIGCAT', 'AS-2', CAMP.ENG],
    ['New Engagement Ad', 'ADS-01', CAMP.MSG01],
    ['Ad Set A : iPhone 11 / 12 / 13', 'Ad Set A : iPhone 11 / 12 / 13', CAMP.BIRD],
    ['Ad Set B : iPhone 14 / 15 / 16 / 17', 'Ad Set B : iPhone 14 / 15 / 16 / 17', CAMP.BIRD],
    ['Ad Set C : Macbook Air/Pro', 'Ad Set C : Macbook Air/Pro', CAMP.BIRD],
    ['Ad Set D : iPad ทุกรุ่น', 'Ad Set D : iPad ทุกรุ่น', CAMP.BIRD],
    ['Retargeting Lookalike', 'Ad Set F : Retargeting Lookalike', CAMP.BIRD],
    ['รับซื้อ iPhone วีดีโอทาม', 'Ad Set G : รับซื้อ iPhone วิดีโอ', CAMP.BIRD],
    ['PS5 ราคาขึ้นสูงมาก', 'AD-SET PS', CAMP.PS],
    ['Ad Set A : Comset', 'Ad Set A : Comset', CAMP.COM]
  ];
  // [ad index, status, count]
  var COUNTS = [
    [0, '1-ทักแล้วเงียบ', 1], [0, '2-มีข้อมูลเครื่อง', 1], [0, '3-ประเมินราคาแล้ว', 4], [1, '3-ประเมินราคาแล้ว', 3], [0, 'X-ของไม่ตรง', 1], [1, 'X-ของไม่ตรง', 2],
    [2, '3-ประเมินราคาแล้ว', 3], [2, 'X-ของไม่ตรง', 4],
    [3, '1-ทักแล้วเงียบ', 8], [3, '3-ประเมินราคาแล้ว', 8], [3, '4-นัดรับของ', 1], [3, '5-ปิดการขาย', 2], [3, '6-ขอซื้อสินค้า', 3], [3, '7-สินค้าไม่รับซื้อ', 1], [3, 'X-ของไม่ตรง', 3],
    [4, '3-ประเมินราคาแล้ว', 3], [4, '7-สินค้าไม่รับซื้อ', 2], [4, 'X-ของไม่ตรง', 1],
    [5, '2-มีข้อมูลเครื่อง', 3], [5, '3-ประเมินราคาแล้ว', 21], [5, '5-ปิดการขาย', 1], [5, '7-สินค้าไม่รับซื้อ', 3],
    [6, '1-ทักแล้วเงียบ', 3], [6, '3-ประเมินราคาแล้ว', 24], [6, '5-ปิดการขาย', 2], [6, '7-สินค้าไม่รับซื้อ', 4], [6, 'X-ของไม่ตรง', 1],
    [8, '1-ทักแล้วเงียบ', 6], [8, '3-ประเมินราคาแล้ว', 14], [8, '5-ปิดการขาย', 1], [8, '7-สินค้าไม่รับซื้อ', 4],
    [9, '1-ทักแล้วเงียบ', 1], [9, '3-ประเมินราคาแล้ว', 10], [9, '5-ปิดการขาย', 1], [9, '7-สินค้าไม่รับซื้อ', 1],
    [10, '1-ทักแล้วเงียบ', 1], [10, '2-มีข้อมูลเครื่อง', 1], [10, '3-ประเมินราคาแล้ว', 4], [10, '6-ขอซื้อสินค้า', 3],
    [11, '1-ทักแล้วเงียบ', 7], [11, '3-ประเมินราคาแล้ว', 10], [11, '7-สินค้าไม่รับซื้อ', 4]
  ];
  // ช่วงวันที่แต่ละแคมเปญ + ค่า Ads สมมติต่อวันต่อ Ad set
  var RANGE = {};
  RANGE[CAMP.ENG] = ['2026-08-24', '2026-08-28', 180];
  RANGE[CAMP.MSG01] = ['2026-08-29', '2026-09-03', 300];
  RANGE[CAMP.BIRD] = ['2026-09-04', '2026-09-22', 70];
  RANGE[CAMP.PS] = ['2026-09-07', '2026-09-12', 120];
  RANGE[CAMP.COM] = ['2026-09-15', '2026-09-22', 150];

  var PRODUCTS = [
    ['iPhone 13 128GB', 9800], ['iPhone 14 Pro 256GB', 18500], ['MacBook Air M1 8/256', 12900],
    ['MacBook Pro 14" M1 Pro', 29500], ['iPhone 12 64GB', 6500], ['iPhone 15 128GB', 17200], ['iPad Air 5 64GB', 10500]
  ];
  var FIRST = ['Nok', 'Ploy', 'Beam', 'Mint', 'Ton', 'Aom', 'Fern', 'Bank', 'Golf', 'Pim', 'Jay', 'Fah', 'Arm', 'Kan', 'Mew',
    'กิตติ', 'สมชาย', 'วรรณา', 'ปิยะ', 'อรทัย', 'ธนา', 'ศิริ', 'ณัฐ', 'พร', 'อนันต์'];
  var LAST = ['Sae-lim', 'Chaiyo', 'Wong', 'Srisuk', 'Boonma', 'Kaewta', 'ใจดี', 'รักไทย', 'ทองดี', 'มีสุข', 'แสงทอง', 'Pong'];

  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function addDays(d, n) { var x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }

  window.buildDemoData = function () {
    var r = rng(20260923);
    var ads = ADS.map(function (a, i) {
      return { id: 'a' + i, ad_name: a[0], adset: a[1], campaign: a[2], post_url: '', creative_url: '', active: i !== 7, note: '' };
    });
    var chats = [], n = 0;
    COUNTS.forEach(function (c) {
      var ad = ADS[c[0]], rg = RANGE[ad[2]], span = daysBetween(rg[0], rg[1]);
      for (var k = 0; k < c[2]; k++) {
        var name = FIRST[n % FIRST.length] + ' ' + LAST[(Math.floor(n / FIRST.length) + n) % LAST.length];
        var p = PRODUCTS[Math.floor(r() * PRODUCTS.length)];
        var closed = c[1] === '5-ปิดการขาย';
        chats.push({
          id: 'c' + (n++), date: addDays(rg[0], Math.floor(r() * (span + 1))), customer: name,
          ad: ad[0], adset: ad[1], campaign: ad[2], status: c[1],
          product: closed || c[1] === '4-นัดรับของ' ? p[0] : '', amount: closed ? p[1] + Math.round(r() * 20) * 100 : '',
          note: '', created_by: 'ตัวอย่าง', created_at: '', updated_by: '', updated_at: '',
          closed_date: '', closed_by: closed ? ['แอดมิน มิ้นท์', 'แอดมิน บีม', 'แอดมิน ต้น'][n % 3] : ''
        });
      }
    });
    // แชทซ้ำ 2 คู่ ให้เห็นป้าย ⚠️ ซ้ำ
    chats.push(Object.assign({}, chats[20], { id: 'c' + (n++), date: addDays(chats[20].date, 1), status: '3-ประเมินราคาแล้ว' }));
    chats.push(Object.assign({}, chats[90], { id: 'c' + (n++), date: addDays(chats[90].date, 1) }));
    chats.forEach(function (c, i) { if (c.status === '5-ปิดการขาย') c.closed_date = addDays(c.date, [0, 1, 2, 3, 5, 9, 1][i % 7]); });
    chats.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

    // แคมเปญ + งบที่ตั้ง (มีการทดลองปรับงบ 2 แคมเปญ)
    var ENDED = {}; ENDED[CAMP.ENG] = 1; ENDED[CAMP.MSG01] = 1;
    var campaigns = Object.keys(RANGE).map(function (name, i) {
      return { id: 'k' + i, name: name, start_date: RANGE[name][0], end_date: ENDED[name] ? RANGE[name][1] : '', objective: 'Message', note: '', created_by: 'ตัวอย่าง', created_at: '' };
    });
    var budgets = [
      [CAMP.ENG, 'AS-1', '2026-08-24', 180, ''], [CAMP.ENG, 'AS-2', '2026-08-24', 180, ''],
      [CAMP.MSG01, 'ADS-01', '2026-08-29', 300, ''],
      [CAMP.BIRD, '', '2026-09-04', 350, 'เริ่มยิง CBO 350/วัน', '2026-09-13'],
      [CAMP.BIRD, '', '2026-09-14', 500, 'ทดลองเพิ่มงบ +43% ดูว่า Lead/วัน ขึ้นตามไหม · หยุดใน Facebook · หยุดใน Facebook', '2026-09-22'],
      [CAMP.BIRD, '', '2026-09-24', 500, 'เปิดยิงใน Facebook · หยุดใน Facebook · หยุดใน Facebook', '2026-09-30'],
      [CAMP.BIRD, '', '2026-10-02', 500, 'เปิดยิงใน Facebook · หยุดใน Facebook', '2026-10-03'],
      [CAMP.BIRD, '', '2026-10-05', 500, 'เปิดยิงใน Facebook', ''],
      [CAMP.PS, 'AD-SET PS', '2026-09-07', 120, ''],
      [CAMP.PS, 'AD-SET PS', '2026-09-13', 0, 'หยุดยิง — คนทักมาขอซื้อมากกว่าขาย'],
      [CAMP.COM, 'Ad Set A : Comset', '2026-09-15', 150, 'ทดสอบกลุ่ม Comset'],
      [CAMP.COM, 'Ad Set A : Comset', '2026-09-19', 250, 'ทดลองเพิ่มงบ']
    ].map(function (b, i) {
      return { id: 'b' + i, campaign: b[0], adset: b[1], start_date: b[2], end_date: b[5] || '', daily_budget: b[3], note: b[4], created_by: 'ตัวอย่าง', created_at: '' };
    });

    // ค่า Ads จริง = งบที่ตั้ง ±15% (งบระดับแคมเปญหารเท่า ๆ กันตาม Ad set ที่เปิด)
    var spend = [], s = 0;
    var adsets = {};
    ads.forEach(function (a) { if (a.active) adsets[a.adset] = a.campaign; });
    function planned(as, camp, date) {
      var n = Object.keys(adsets).filter(function (x) { return adsets[x] === camp; }).length || 1;
      var hit = null;
      budgets.forEach(function (b) {
        if (b.campaign === camp && (b.adset === as || !b.adset) && b.start_date <= date && (!hit || b.start_date >= hit.start_date)) hit = b;
      });
      return hit ? (hit.adset ? hit.daily_budget : hit.daily_budget / n) : 0;
    }
    Object.keys(adsets).forEach(function (as) {
      var camp = adsets[as], rg = RANGE[camp], span = daysBetween(rg[0], rg[1]);
      for (var d = 0; d <= span; d++) {
        var date = addDays(rg[0], d);
        spend.push({ id: 's' + (s++), date: date, date_to: date, campaign: camp, adset: as, amount: Math.round(planned(as, camp, date) * (0.85 + r() * 0.3)), note: '', created_by: 'ตัวอย่าง', created_at: '' });
      }
    });
    return {
      me: 'ผู้ใช้ตัวอย่าง',
      chats: chats, ads: ads, spend: spend, campaigns: campaigns, budgets: budgets,
      fbstatus: [['2026-09-22 22:10', 'c', CAMP.BIRD, '', 0, 'แอดมิน มิ้นท์'], ['2026-09-24 09:30', 'c', CAMP.BIRD, '', 1, 'แอดมิน มิ้นท์'], ['2026-09-30 21:45', 'c', CAMP.BIRD, '', 0, 'แอดมิน ปีม'], ['2026-10-02 10:05', 'c', CAMP.BIRD, '', 1, 'แอดมิน ปีม'], ['2026-10-03 23:00', 'c', CAMP.BIRD, '', 0, 'แอดมิน มิ้นท์'], ['2026-10-05 08:40', 'c', CAMP.BIRD, '', 1, 'แอดมิน มิ้นท์']],
      adsets: (function () {
        var seen = {}, out = [];
        ads.forEach(function (a, i) {
          var k = a.campaign + '|' + a.adset;
          if (!seen[k]) { seen[k] = 1; out.push({ id: 'g' + i, campaign: a.campaign, name: a.adset, active: a.active, note: '' }); }
        });
        return out;
      })(),
      fbads: spend.map(function (x) { var imp = x.amount / 0.085 * (0.85 + r() * 0.3), clk = imp * (0.012 + r() * 0.02); return { date: x.date, campaign: x.campaign, adset: x.adset, ad: x.adset, spend: x.amount, impressions: Math.round(imp), reach: Math.round(imp / (1.6 + r())), clicks: Math.round(clk), chats: Math.round(clk * (0.06 + r() * 0.08)) }; }),
      gads: (function () {
        var out = [], t = new Date(), G = [['02Search-AppleiPhone-BKK_TopFunnel >30THB', 900, 9], ['03Search-AppleiPad KW รับซื้อ', 500, 6], ['05Search-AppleMacbook-BKK-New202602 - รับซื้อ', 450, 4], ['08-2Search-Laptop', 700, 8], ['08-1Search-ComPC', 300, 2], ['06Search-AppleWatch-BKK', 600, 7]];
        for (var i = 120; i >= 1; i--) { var d = new Date(t); d.setDate(d.getDate() - i); var ds = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
          G.forEach(function (g) { out.push({ date: ds, campaign: g[0], cost: Math.round(g[1] * (0.8 + r() * 0.4)), conversions: Math.round(g[2] * (0.6 + r() * 0.8)) }); }); }
        return out;
      })(),
      purchases: (function () {
        var out = [], t = new Date(), P = [['iPhone', 4, 4200], ['iPad', 2.5, 3300], ['MacBook', 1.6, 4300], ['Notebook Gaming', 1.4, 4700], ['Notebook Office', 1, 3800], ['Comset Gaming', 0.5, 3600], ['Apple Watch', 1.5, 2000]];
        for (var i = 120; i >= 1; i--) { var d = new Date(t); d.setDate(d.getDate() - i); var ds = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
          P.forEach(function (p) { var n = Math.floor(p[1] * (0.4 + r() * 1.2)); for (var k = 0; k < n; k++) { var fb = r() < 0.4, ln = !fb && r() < 0.85, b = 10000 + Math.round(r() * 10000); out.push([ds, p[0], fb ? 1 : 0, ln ? 1 : 0, b, 0, b + Math.round(p[2] * (0.7 + r() * 0.6)), '']); } }); }
        return out;
      })(),
      estimates: (function () {
        var out = [], t = new Date(), P = [['iPhone', 9], ['iPad', 5], ['MacBook', 3], ['Notebook Gaming', 3], ['Notebook Office', 2], ['Comset Gaming', 2], ['AirPods', 4], ['Apple Watch', 2], ['Game Console', 2]];
        for (var i = 120; i >= 0; i--) { var d = new Date(t); d.setDate(d.getDate() - i); var ds = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2), wk = d.getDay() === 0 || d.getDay() === 6;
          P.forEach(function (p) { var n = Math.floor(p[1] * (0.5 + r()) * (wk ? 0.8 : 1)); for (var k = 0; k < n; k++) { var h = Math.floor(8 + r() * 15) % 24, fb = r() < 0.35; var NB = ['ASUS TUF GAMING F15 FX506HE-HN011W', 'LENOVO IDEAPAD SLIM 3 15IRH8 83EM009STA', 'ACER NITRO V15 ANV15-41-R488', 'ASUS VIVOBOOK 15 X1502VA-NJ545WA', 'HP 15S-FQ2725TU'], isNb = /^Notebook/.test(p[0]) && r() < 0.6, dt = isNb ? NB[Math.floor(r() * NB.length)] : ''; out.push([ds, h, isNb ? (r() < 0.8 ? 'อื่นๆ' : 'Smart Phone') : p[0], fb ? 1 : 0, fb ? 0 : 1, r() < 0.4 ? 1 : 0, dt]); } }); }
        return out;
      })(),
      fbhourly: (function () {
        var out = [], W = [0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.4, 0.7, 0.9, 1, 1, 1.1, 1.1, 1, 1, 1, 1.1, 1.2, 1.3, 1.5, 1.6, 1.5, 1.2, 0.6], ws = W.reduce(function (a, b) { return a + b; }, 0);
        spend.forEach(function (x) { if (!x.adset) return; var dow = new Date(x.date + 'T00:00:00').getDay(), wk = dow === 0 || dow === 6;
          W.forEach(function (w, h) { var sp = x.amount * w / ws, eff = (h >= 1 && h <= 6 ? 0.1 : h >= 19 && h <= 22 ? 1.6 : 1) * (wk ? 0.75 : 1), ex = sp / 28 * eff * (0.6 + r() * 0.8), ch = Math.floor(ex) + (r() < ex - Math.floor(ex) ? 1 : 0);
            if (sp > 0.5) out.push([x.date, h, x.campaign, x.adset, Math.round(sp * 100) / 100, ch]); }); });
        return out;
      })(),
      inbox: (function () {
        var t = new Date(), iso = function (n) { var d = new Date(t); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
        var P = [['Nok Siriporn', 0, 'สนใจขาย iPhone 13 ครับ', 'Ad Set A : iPhone 11 / 12 / 13:3|Ad Set B : iPhone 14 / 15 / 16 / 17:2'],
          ['Krit Tanapat', 0, 'รับซื้อ MacBook ไหมครับ', 'Ad Set A : iPhone 11 / 12 / 13:3|Ad Set B : iPhone 14 / 15 / 16 / 17:2'],
          ['Pim Pimmy', 1, 'iPad Air 4 ให้ราคาเท่าไหร่คะ', 'Ad Set B : iPhone 14 / 15 / 16 / 17:4|Ad Set A : Comset:1'],
          ['Golf Chanin', 1, 'สนใจขายครับ', 'Ad Set B : iPhone 14 / 15 / 16 / 17:4|Ad Set A : Comset:1'],
          ['Mew Arisa', 2, 'มีโน๊ตบุ๊ครับซื้อไหม', 'Ad Set A : Comset:2'],
          ['Bank Teerapat', 3, 'PS5 รับไหมครับ', '']];
        var out = P.map(function (x, i) { return { psid: 'd' + i, name: x[0], pic: '', first_date: iso(x[1]), last_date: iso(x[1]), first_text: x[2], status: 'pending', suggest: x[3], chat_id: '', approx: '' }; });
        [['Jane Doe', 4, 'เปิดกี่โมงคะ'], ['Toey Pakorn', 6, 'ร้านอยู่ไหนครับ'], ['Fah Sirin', 9, 'ขอเบอร์ติดต่อหน่อย']].forEach(function (x, i) {
          out.push({ psid: 'o' + i, name: x[0], pic: '', first_date: iso(x[1]), last_date: iso(x[1]), first_text: x[2], status: 'other', suggest: '', chat_id: '', approx: '' });
        });
        return out;
      })(),
      config: { target_cost_per_case: 1000, brand: 'BIGCAT' },
      users: [{ name: 'ผู้ใช้ตัวอย่าง', active: true }, { name: 'แอดมิน มิ้นท์', active: true }, { name: 'แอดมิน บีม', active: true }, { name: 'แอดมิน ต้น', active: true }]
    };
  };
})();
