/**
 * mock-api.js — หลังบ้านจำลองในเบราว์เซอร์ (โหมดทดลอง)
 *
 * ทำงานเหมือน apps-script/Code.gs ทุก action แต่เก็บข้อมูลใน localStorage ของเครื่องนี้เท่านั้น
 * ใช้ลองระบบก่อนติดตั้ง Apps Script — ข้อมูลตัวอย่างสร้างใหม่ทุกครั้งที่กด "รีเซ็ตข้อมูลตัวอย่าง"
 */
(function () {
  'use strict';
  const KEY = 'fbads.demo.v1';

  // ---------- ตัวช่วย ----------
  function rng(seed) { // mulberry32 — สุ่มแบบกำหนดได้ ข้อมูลตัวอย่างออกมาเหมือนเดิมทุกครั้ง
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function today() { return UI.today(); }
  function now() { return today() + ' ' + UI.nowTime() + ':00'; }
  function pad(n, w) { return ('000000' + n).slice(-(w || 6)); }

  let db = null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* เต็ม/โหมดส่วนตัว */ } }
  function load() {
    if (db) return db;
    try { db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { db = null; }
    if (!db) { db = seed(); save(); }
    return db;
  }
  function nextId(prefix) {
    db.seq[prefix] = (db.seq[prefix] || 0) + 1;
    return prefix + pad(db.seq[prefix]);
  }

  // ---------- ข้อมูลตัวอย่าง ----------
  function seed() {
    const r = rng(20260923);
    const pick = a => a[Math.floor(r() * a.length)];
    const between = (a, b) => a + Math.floor(r() * (b - a + 1));
    const T = today();
    const d = n => UI.addDays(T, n);
    const s = { seq: {}, campaigns: [], adsets: [], ads: [], spend: [], chats: [], status_log: [], users: [] };
    const id = p => { s.seq[p] = (s.seq[p] || 0) + 1; return p + pad(s.seq[p]); };
    const stamp = (ymd, hh, mm) => ymd + ' ' + pad(hh, 2) + ':' + pad(mm, 2) + ':00';

    s.statuses = [
      ['1', '1-ทักแล้วเงียบ', 1, true, false, 1, '#9e9e9e'], ['2', '2-มีข้อมูลเครื่อง', 2, true, false, 2, '#42a5f5'],
      ['3', '3-ประเมินราคาแล้ว', 3, true, false, 3, '#7e57c2'], ['4', '4-นัดรับของ', 4, true, false, 4, '#ffa726'],
      ['5', '5-ปิดการขาย', 5, true, true, 5, '#43a047'], ['X', 'X-ของไม่ตรง', 2, true, false, 6, '#e53935'],
      ['6', '6-ขอซื้อสินค้า', 0, false, false, 7, '#26a69a'], ['7', '7-สินค้าไม่รับซื้อ', 3, false, false, 8, '#8d6e63'],
    ].map(x => ({ code: x[0], label: x[1], stage: x[2], in_funnel: x[3], is_won: x[4], sort: x[5], color: x[6] }));
    s.settings = { dup_window_days: '30', stale_days: '3', stale_max_days: '14', target_cost_per_won: '1000', min_spend_to_judge: '1000', chat_days_on_load: '120' };

    const plan = [
      { name: 'New – Message – Apple อ.เบิร์ด 09/02/2026', group: 'Apple', obj: 'Message', start: -40, end: null, daily: 350, sets: [
        ['Ad Set A : iPhone 11 / 12 / 13', 'iPhone', ['iPhone 11 64GB', 'iPhone 12 128GB', 'iPhone 13 128GB', 'iPhone 13 Pro'], [6000, 14000], 1.1],
        ['Ad Set B : iPhone 14 / 15 / 16 / 17', 'iPhone', ['iPhone 14 128GB', 'iPhone 15 Pro 256GB', 'iPhone 16 Pro', 'iPhone 15 128GB'], [14000, 32000], 1.6],
        ['Ad Set C : Macbook Air/Pro', 'MacBook', ['MacBook Air M1', 'MacBook Air M2', 'MacBook Pro M1 14"', 'MacBook Pro M3'], [14000, 42000], 1],
        ['Ad Set D : iPad ทุกรุ่น', 'iPad', ['iPad Gen 9', 'iPad Air 5', 'iPad Pro 11"', 'iPad mini 6'], [5000, 22000], 0.7],
        ['Ad Set F : Retargeting Lookalike', 'Apple', ['iPhone 14 Pro Max', 'MacBook Air M2', 'iPad Air 5', 'Apple Watch S8'], [5000, 30000], 0.6],
        ['Ad Set G : รับซื้อ iPhone วิดีโอ', 'iPhone', ['iPhone 14 256GB', 'iPhone 15 Pro Max', 'iPhone 13 mini'], [9000, 30000], 0.9],
      ] },
      { name: '202609 – Comset – Test01', group: 'Comset', obj: 'Message', start: -12, end: null, daily: 200, sets: [
        ['Ad Set A : Comset', 'Comset', ['Comset i5 RTX 3060', 'Comset Ryzen 5 RX 6600', 'Comset i7 RTX 4070'], [8000, 30000], 1],
      ] },
      { name: 'New Message - Game Console - PS4 PS5', group: 'Console', obj: 'Message', start: -18, end: null, daily: 150, sets: [
        ['AD-SET PS', 'Console', ['PS5 Slim', 'PS5 Digital', 'PS4 Pro 1TB'], [6000, 13000], 1],
      ] },
      { name: '202608-BIGCAT-CAM-ENGAGE-MSG-01', group: 'Apple', obj: 'Engagement', start: -45, end: -14, daily: 300, sets: [
        ['ADS-01', 'Apple', ['iPhone 13', 'iPhone 14', 'MacBook Air M1'], [7000, 25000], 1],
      ] },
    ];
    const first = ['พลอย', 'ฝน', 'มิว', 'นก', 'บีม', 'ต้น', 'แพรว', 'กอล์ฟ', 'เจน', 'ออม', 'ณัฐ', 'ปาล์ม', 'Arm', 'Beam', 'Jane', 'Top', 'Mint', 'Kittipong', 'Nut', 'Ploy', 'Fon', 'Bank', 'Oil', 'Ice', 'Praewa', 'Golf', 'Namtan', 'Aom'];
    const last = ['ศิริวรรณ', 'ชนิดา', 'พัทธมน', 'กมลชนก', 'ธนพล', 'วิรัช', 'ณัฐวุฒิ', 'N.', 'T.', 'Kanya', 'Suda', 'Wirat', 'Prasert', 'Chanon', 'Srisuk', 'Thanakorn', 'Pattama', 'Nattapol'];

    const sets = [];
    plan.forEach(p => {
      const cp = { campaign_id: id('CP'), name: p.name, objective: p.obj, product_group: p.group, start_date: d(p.start),
        end_date: p.end === null ? '' : d(p.end), daily_budget: p.daily, status: p.end === null ? 'active' : 'ended', note: '',
        created_at: stamp(d(p.start), 9, 0), updated_at: stamp(d(p.start), 9, 0) };
      s.campaigns.push(cp);
      const wsum = p.sets.reduce((t, x) => t + x[4], 0);
      p.sets.forEach(x => {
        const as = { adset_id: id('AS'), campaign_id: cp.campaign_id, name: x[0], audience: '', status: cp.status, note: '',
          created_at: cp.created_at, updated_at: cp.created_at };
        s.adsets.push(as);
        const ad = { ad_id: id('AD'), adset_id: as.adset_id, campaign_id: cp.campaign_id, name: x[0].replace(/^Ad Set [A-Z] : /, ''),
          post_url: 'https://www.facebook.com/bigcatth/posts/' + (100000 + s.ads.length), creative_url: '', format: /วิดีโอ/.test(x[0]) ? 'video' : 'image',
          start_date: cp.start_date, end_date: cp.end_date, status: cp.status, note: '', created_at: cp.created_at, updated_at: cp.created_at };
        s.ads.push(ad);
        sets.push({ cp, as, ad, products: x[2], price: x[3], weight: x[4], share: x[4] / wsum, daily: p.daily, start: p.start, end: p.end === null ? 0 : p.end });
      });
    });
    // โฆษณาตัวที่ 2 ใน Ad Set B (ไว้เทียบคุณภาพโฆษณา)
    const setB = sets[1];
    s.ads.push({ ad_id: id('AD'), adset_id: setB.as.adset_id, campaign_id: setB.cp.campaign_id, name: 'ขายง่าย ได้เงินไว ที่ BIGCAT',
      post_url: 'https://www.facebook.com/bigcatth/posts/200001', creative_url: '', format: 'image', start_date: setB.cp.start_date,
      end_date: '', status: 'active', note: '', created_at: setB.cp.created_at, updated_at: setB.cp.created_at });

    // ค่าแอด: รายสัปดาห์ต่อ Ad set
    sets.forEach(x => {
      let from = x.start;
      while (from <= x.end) {
        const to = Math.min(from + 6, x.end);
        const days = to - from + 1;
        const amt = Math.round(x.daily * x.share * days * (0.85 + r() * 0.3));
        s.spend.push({ spend_id: id('SP'), adset_id: x.as.adset_id, campaign_id: x.cp.campaign_id, date_from: d(from), date_to: d(to),
          amount: amt, note: '', is_deleted: false, created_by: 'ตัวอย่าง', created_at: stamp(d(to), 20, 0), updated_at: stamp(d(to), 20, 0) });
        from = to + 1;
      }
    });

    // แชท
    const statusByAge = age => {
      const x = r();
      if (age <= 1) return x < .4 ? '1' : x < .65 ? '2' : x < .88 ? '3' : x < .93 ? '6' : 'X';
      if (x < .22) return '1'; if (x < .33) return '2'; if (x < .55) return '3'; if (x < .63) return '4';
      if (x < .82) return '5'; if (x < .89) return 'X'; if (x < .96) return '6'; return '7';
    };
    const names = [];
    for (let day = -45; day <= 0; day++) {
      const live = sets.filter(x => day >= x.start && day <= x.end);
      if (!live.length) continue;
      const n = between(2, 5) + (day > -7 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        let t = r() * live.reduce((a, x) => a + x.weight, 0), x = live[0];
        for (const c of live) { t -= c.weight; if (t <= 0) { x = c; break; } }
        const ad = x === setB && r() < .45 ? s.ads[s.ads.length - 1] : x.ad;
        const name = pick(first) + ' ' + pick(last);
        const age = -day;
        const st = statusByAge(age);
        const date = d(day);
        const hh = between(8, 20), mm = between(0, 59);
        const created = stamp(date, hh, mm);
        const upd = ['2', '3', '4'].includes(st) ? Math.min(age, between(0, 7)) : Math.min(age, between(0, 3));
        const updated = stamp(d(day + upd), Math.min(hh + 1, 21), mm);
        const product = pick(x.products);
        const won = st === '5';
        const buy = won ? Math.round((x.price[0] + r() * (x.price[1] - x.price[0])) / 100) * 100 : '';
        const c = { chat_id: id('CH'), chat_date: date, customer_name: name, customer_key: Metrics.customerKey(name), contact: '',
          ad_id: ad.ad_id, adset_id: x.as.adset_id, campaign_id: x.cp.campaign_id, status: st,
          product: ['1', '6'].includes(st) ? '' : product, quoted_price: ['3', '4', '5', '7'].includes(st) ? (buy || Math.round((x.price[0] + r() * (x.price[1] - x.price[0])) / 100) * 100) : '',
          buy_amount: buy, closed_date: won ? d(Math.min(0, day + between(0, 3))) : '', product_code: won && r() < .5 ? 'ID' + date.slice(2, 4) + date.slice(5, 7) + pad(between(1, 900), 4) : '',
          duplicate_of: '', note: '', is_deleted: false,
          created_by: pick(['แอดมินแชท', 'บอส']), created_at: created, updated_by: 'แอดมินแชท', updated_at: updated };
        s.chats.push(c);
        s.status_log.push({ log_id: id('LG'), chat_id: c.chat_id, from_status: '', to_status: '1', changed_by: c.created_by, changed_at: created });
        if (st !== '1') s.status_log.push({ log_id: id('LG'), chat_id: c.chat_id, from_status: '1', to_status: st, changed_by: 'แอดมินแชท', changed_at: updated });
        names.push(name);
      }
    }
    return s;
  }

  // ---------- action เหมือน Code.gs ----------
  function tokenFor(name) { return btoa(unescape(encodeURIComponent(JSON.stringify({ n: name, exp: Date.now() + 14 * 86400000 })))) + '.demo'; }
  function userOf(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 2 || parts[1] !== 'demo') throw new Error('กรุณาล็อกอินใหม่');
    const p = JSON.parse(decodeURIComponent(escape(atob(parts[0]))));
    if (p.exp < Date.now()) throw new Error('กรุณาล็อกอินใหม่');
    return { name: p.n };
  }
  const byId = (list, key, v) => list.find(x => String(x[key]) === String(v));
  const clone = o => JSON.parse(JSON.stringify(o));
  function isWon(code) { const s = db.statuses.find(x => x.code === String(code)); return !!(s && s.is_won); }
  function log(chat_id, from, to, who) {
    db.status_log.push({ log_id: nextId('LG'), chat_id, from_status: from || '', to_status: to, changed_by: who, changed_at: now() });
  }
  function upsert(list, key, prefix, obj) {
    const cur = obj[key] && byId(list, key, obj[key]);
    if (cur) { Object.keys(obj).forEach(k => { if (obj[k] !== undefined && k !== key) cur[k] = obj[k]; }); cur.updated_at = now(); return clone(cur); }
    const o = Object.assign({}, obj);
    if (prefix) o[key] = nextId(prefix);
    o.created_at = now(); o.updated_at = o.created_at;
    list.push(o);
    return clone(o);
  }
  function fillFromAd(c) {
    if (!c.ad_id) throw new Error('ต้องเลือกโฆษณา');
    const ad = byId(db.ads, 'ad_id', c.ad_id);
    if (!ad) throw new Error('ไม่พบโฆษณา ' + c.ad_id);
    c.adset_id = ad.adset_id; c.campaign_id = ad.campaign_id;
  }

  const A = {
    login(d) {
      const name = String(d.name || '').trim();
      if (!name) throw new Error('ต้องใส่ชื่อ');
      if (!/^\d{4,8}$/.test(String(d.pin || ''))) throw new Error('PIN ต้องเป็นตัวเลข 4–8 หลัก');
      return { token: tokenFor(name), name };
    },
    bootstrap() {
      const days = Number(db.settings.chat_days_on_load || 120);
      const from = UI.addDays(today(), -days);
      return clone({
        today: today(), statuses: db.statuses, settings: db.settings, campaigns: db.campaigns, adsets: db.adsets, ads: db.ads,
        spend: db.spend.filter(s => !s.is_deleted), chats: db.chats.filter(c => !c.is_deleted && c.chat_date >= from), chats_from: from,
      });
    },
    listChats(d) { return clone(db.chats.filter(c => !c.is_deleted && c.chat_date >= d.from && c.chat_date <= d.to)); },
    chatHistory(d) { return clone(db.status_log.filter(l => l.chat_id === d.chat_id)); },
    saveChat(d, u) {
      const c = Object.assign({}, d.chat);
      if (!String(c.customer_name || '').trim()) throw new Error('ต้องใส่ชื่อลูกค้า');
      if (!c.status) c.status = '1';
      c.customer_name = String(c.customer_name).trim();
      c.customer_key = Metrics.customerKey(c.customer_name);
      fillFromAd(c);
      if (!c.chat_id) {
        if (!c.chat_date) c.chat_date = today();
        if (!d.force) {
          const win = Number(db.settings.dup_window_days || 30);
          const dup = db.chats.find(x => !x.is_deleted && x.customer_key === c.customer_key && x.campaign_id === c.campaign_id &&
            Math.abs(Metrics.toDayNum(x.chat_date) - Metrics.toDayNum(c.chat_date)) <= win);
          if (dup) return { duplicate: clone(dup) };
        }
        if (isWon(c.status)) {
          if (!Number(c.buy_amount)) throw new Error('ปิดการขายต้องใส่ยอดรับซื้อ');
          if (!c.closed_date) c.closed_date = c.chat_date;
        }
        c.created_by = u.name; c.updated_by = u.name; c.is_deleted = false;
        ['quoted_price', 'buy_amount'].forEach(k => { c[k] = c[k] === '' || c[k] === undefined ? '' : Number(c[k]); });
        const saved = upsert(db.chats, 'chat_id', 'CH', c);
        log(saved.chat_id, '', c.status, u.name);
        return { chat: saved };
      }
      const before = byId(db.chats, 'chat_id', c.chat_id);
      if (!before) throw new Error('ไม่พบแชท ' + c.chat_id);
      delete c.created_by; delete c.created_at;
      c.updated_by = u.name;
      if (isWon(c.status || before.status)) {
        if (!Number(c.buy_amount || before.buy_amount)) throw new Error('ปิดการขายต้องใส่ยอดรับซื้อ');
        if (!c.closed_date && !before.closed_date) c.closed_date = today();
      }
      ['quoted_price', 'buy_amount'].forEach(k => { if (k in c) c[k] = c[k] === '' ? '' : Number(c[k]); });
      const old = before.status;
      const saved = upsert(db.chats, 'chat_id', 'CH', c);
      if (old !== saved.status) log(c.chat_id, old, saved.status, u.name);
      return { chat: saved };
    },
    setStatus(d, u) {
      const before = byId(db.chats, 'chat_id', d.chat_id);
      if (!before) throw new Error('ไม่พบแชท ' + d.chat_id);
      const patch = { chat_id: d.chat_id, status: d.status, updated_by: u.name };
      if (isWon(d.status)) {
        const amt = Number(d.buy_amount || before.buy_amount || 0);
        if (!amt) throw new Error('ปิดการขายต้องใส่ยอดรับซื้อ');
        patch.buy_amount = amt;
        if (d.product) patch.product = d.product;
        if (d.product_code) patch.product_code = d.product_code;
        patch.closed_date = d.closed_date || before.closed_date || today();
      }
      const old = before.status;
      const saved = upsert(db.chats, 'chat_id', null, patch);
      if (old !== saved.status) log(d.chat_id, old, d.status, u.name);
      return { chat: saved };
    },
    deleteChat(d, u) { return upsert(db.chats, 'chat_id', null, { chat_id: d.chat_id, is_deleted: true, updated_by: u.name }); },
    saveCampaign(d) {
      if (!d.name) throw new Error('ต้องใส่ชื่อแคมเปญ');
      if (!d.status) d.status = 'active';
      if (d.daily_budget !== undefined) d.daily_budget = d.daily_budget === '' ? '' : Number(d.daily_budget);
      return upsert(db.campaigns, 'campaign_id', 'CP', d);
    },
    saveAdset(d) {
      if (!d.name || !d.campaign_id) throw new Error('ต้องมีชื่อ Ad set และแคมเปญ');
      if (!d.status) d.status = 'active';
      return upsert(db.adsets, 'adset_id', 'AS', d);
    },
    saveAd(d) {
      if (!d.name || !d.adset_id) throw new Error('ต้องมีชื่อโฆษณาและ Ad set');
      const as = byId(db.adsets, 'adset_id', d.adset_id);
      if (!as) throw new Error('ไม่พบ Ad set ' + d.adset_id);
      d.campaign_id = as.campaign_id;
      if (!d.status) d.status = 'active';
      const clash = db.ads.find(a => a.adset_id === d.adset_id && String(a.name).trim() === String(d.name).trim() && a.ad_id !== d.ad_id);
      if (clash) throw new Error('Ad set นี้มีโฆษณาชื่อนี้แล้ว');
      return upsert(db.ads, 'ad_id', 'AD', d);
    },
    saveSpend(d, u) {
      if (!d.adset_id || !d.date_from || !d.date_to) throw new Error('ต้องมี Ad set และช่วงวันที่');
      if (d.date_to < d.date_from) throw new Error('วันสิ้นสุดต้องไม่ก่อนวันเริ่ม');
      if (!(Number(d.amount) >= 0)) throw new Error('ยอดเงินไม่ถูกต้อง');
      const as = byId(db.adsets, 'adset_id', d.adset_id);
      if (!as) throw new Error('ไม่พบ Ad set ' + d.adset_id);
      d.campaign_id = as.campaign_id; d.amount = Number(d.amount); d.is_deleted = false;
      if (!d.spend_id) d.created_by = u.name;
      return upsert(db.spend, 'spend_id', 'SP', d);
    },
    deleteSpend(d) { return upsert(db.spend, 'spend_id', null, { spend_id: d.spend_id, is_deleted: true }); },
    saveSetting(d) { if (!d.key) throw new Error('ต้องมี key'); db.settings[d.key] = String(d.value); return { key: d.key, value: String(d.value) }; },
  };
  const OPEN = { login: true };

  async function handle(req) {
    await new Promise(r => setTimeout(r, 120)); // ให้รู้สึกเหมือนเรียกเซิร์ฟเวอร์
    load();
    try {
      const fn = A[req.action];
      if (!fn) throw new Error('ไม่รู้จักคำสั่ง ' + req.action);
      const user = OPEN[req.action] ? null : userOf(req.token);
      const data = fn(clone(req.data || {}), user);
      save();
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  function reset() { db = seed(); save(); }

  window.MockApi = { handle, reset };
})();
