/**
 * API — คุยกับ Apps Script หรือจำลองในเบราว์เซอร์ (โหมดตัวอย่าง)
 */
(function () {
  var URL_ = (window.APP_CONFIG.API_URL || '').trim();
  var DEMO_KEY = 'fbat_demo_v2';

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (e) { return null; }
  }

  // ---------- โหมดจริง ----------
  function remote(action, payload) {
    var body = Object.assign({ action: action, token: store('fbat_token') }, payload || {});
    return fetch(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain = ไม่มี preflight CORS
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.ok) {
        var err = new Error(res.message || res.error || 'เกิดข้อผิดพลาด');
        err.code = res.error;
        throw err;
      }
      return res.data;
    });
  }

  // ---------- โหมดตัวอย่าง ----------
  var demo = null;
  function demoDb() {
    if (demo) return demo;
    var saved = store(DEMO_KEY);
    try { demo = saved ? JSON.parse(saved) : null; } catch (e) { demo = null; }
    if (!demo) demo = window.buildDemoData();
    return demo;
  }
  function demoSave() { store(DEMO_KEY, JSON.stringify(demo)); }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function upsert(list, rec, prefix, extra) {
    var i = rec.id ? list.findIndex(function (x) { return x.id === rec.id; }) : -1;
    if (i < 0) { rec = Object.assign({}, extra || {}, rec, { id: rec.id || uid(prefix) }); list.push(rec); }
    else { rec = Object.assign(list[i], rec); }
    demoSave();
    return JSON.parse(JSON.stringify(rec));
  }
  function remove(list, id) {
    var i = list.findIndex(function (x) { return x.id === id; });
    if (i >= 0) list.splice(i, 1);
    demoSave();
    return { id: id };
  }
  function local(action, p) {
    var db = demoDb();
    var me = db.me;
    var now = new Date().toISOString();
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          switch (action) {
            case 'users': return resolve(db.users.map(function (u) { return u.name; }));
            case 'login': return resolve({ token: 'demo', name: me });
            case 'bootstrap': return resolve(JSON.parse(JSON.stringify(db)));
            case 'saveChat':
              if (!String(p.chat.customer || '').trim()) throw new Error('ต้องใส่ชื่อลูกค้า');
              if (p.chat.status === '5-ปิดการขาย' && !(Number(p.chat.amount) > 0)) throw new Error('เคสปิดการขายต้องใส่ยอดรับซื้อ');
              return resolve(upsert(db.chats, Object.assign({}, p.chat, { updated_by: me, updated_at: now }), 'c', { created_by: me, created_at: now }));
            case 'deleteChat': return resolve(remove(db.chats, p.id));
            case 'saveAd':
              if (db.ads.some(function (a) { return a.ad_name === p.ad.ad_name && a.id !== p.ad.id; })) throw new Error('ชื่อโฆษณาซ้ำ — เติม (AS-1) (AS-2) ต่อท้ายถ้าใช้ครีเอทีฟเดียวกัน');
              return resolve(upsert(db.ads, Object.assign({}, p.ad), 'a'));
            case 'deleteAd': return resolve(remove(db.ads, p.id));
            case 'saveSpend': return resolve(upsert(db.spend, Object.assign({}, p.spend, { amount: Number(p.spend.amount) }), 's', { created_by: me, created_at: now }));
            case 'deleteSpend': return resolve(remove(db.spend, p.id));
            case 'saveCampaign':
              var cp = p.campaign;
              if (!String(cp.name || '').trim()) throw new Error('ต้องใส่ชื่อแคมเปญ');
              if (!cp.start_date) throw new Error('ต้องใส่วันที่เริ่มยิง');
              if (cp.end_date && cp.end_date < cp.start_date) throw new Error('วันที่ปิดต้องไม่ก่อนวันที่เริ่ม');
              if (db.campaigns.some(function (c) { return c.name === cp.name && c.id !== cp.id; })) throw new Error('มีแคมเปญชื่อนี้แล้ว');
              var old = cp.id && db.campaigns.find(function (c) { return c.id === cp.id; });
              if (old && old.name !== cp.name) {
                [db.ads, db.chats, db.budgets].forEach(function (list) { list.forEach(function (x) { if (x.campaign === old.name) x.campaign = cp.name; }); });
              }
              return resolve(upsert(db.campaigns, Object.assign({}, cp), 'k', { created_by: me, created_at: now }));
            case 'deleteCampaign':
              var dc = db.campaigns.find(function (c) { return c.id === p.id; });
              if (db.ads.some(function (a) { return a.campaign === dc.name; }) || db.chats.some(function (c) { return c.campaign === dc.name; })) throw new Error('แคมเปญนี้มีโฆษณา/แชทอยู่ ลบไม่ได้ — ใส่วันที่ปิดแทน');
              db.budgets = db.budgets.filter(function (b) { return b.campaign !== dc.name; });
              return resolve(remove(db.campaigns, p.id));
            case 'saveBudget':
              if (!p.budget.start_date) throw new Error('ต้องใส่วันที่เริ่มใช้งบนี้');
              if (p.budget.daily_budget === '' || !(Number(p.budget.daily_budget) >= 0)) throw new Error('งบ/วัน ต้องเป็นตัวเลข');
              return resolve(upsert(db.budgets, Object.assign({}, p.budget, { daily_budget: Number(p.budget.daily_budget) }), 'b', { created_by: me, created_at: now }));
            case 'deleteBudget': return resolve(remove(db.budgets, p.id));
            case 'saveConfig': db.config[p.key] = p.value; demoSave(); return resolve({ key: p.key, value: p.value });
            case 'saveUser':
              var u = db.users.find(function (x) { return x.name === p.name; });
              if (u) { if (p.active !== undefined) u.active = p.active; } else db.users.push({ name: p.name, active: true });
              demoSave(); return resolve({ name: p.name });
            default: throw new Error('ไม่รู้จักคำสั่ง ' + action);
          }
        } catch (e) { reject(e); }
      }, 120);
    });
  }

  window.API = {
    isDemo: !URL_,
    call: function (action, payload) { return URL_ ? remote(action, payload) : local(action, payload || {}); },
    token: function (v) { return store('fbat_token', v); },
    userName: function (v) { return store('fbat_user', v); },
    resetDemo: function () { store(DEMO_KEY, null); demo = null; },
    store: store
  };
})();
