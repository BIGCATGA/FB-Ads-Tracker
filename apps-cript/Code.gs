/**
 * FB Ads Tracker — Backend (Google Apps Script)
 * ------------------------------------------------------------
 * วางไฟล์นี้ใน Apps Script ที่ผูกกับ Google Sheet ไฟล์ใหม่
 * (Extensions → Apps Script) แล้วทำตาม README.md
 *
 * ฟังก์ชันที่กดรันเองใน editor:
 *   setup()               – สร้างแท็บ + หัวคอลัมน์ + กุญแจลับ (รันซ้ำได้ ไม่ลบข้อมูล — อัปเดตโค้ดแล้วให้รันอีกรอบ)
 *   createFirstUser()     – เพิ่มผู้ใช้คนแรกจาก FIRST_USER ด้านล่าง
 *   importFromOldSheet()  – ย้ายข้อมูลจากชีตเดิม (OLD_SHEET_ID)
 *   reimportFromOldSheet() – ล้างแถวที่นำเข้ารอบก่อน (แชท/ค่า Ads ที่ created_by = import + โฆษณาชื่อซ้ำ) แล้วนำเข้าใหม่
 */

// ====== ตั้งค่าที่แก้ได้ ======
var OLD_SHEET_ID = '10RES0HrYE5Ff13bp2LRKf9cZWmK7jh1-KGu8O3z-IQE';
var FIRST_USER = { name: 'Admin', pin: '1234' }; // เปลี่ยนก่อนรัน createFirstUser()
var TOKEN_DAYS = 30;
var TZ = 'Asia/Bangkok';

// ====== โครงสร้างตาราง ======
var SCHEMA = {
  Chats:  ['id', 'date', 'customer', 'ad', 'adset', 'campaign', 'status', 'product', 'amount', 'note',
           'created_by', 'created_at', 'updated_by', 'updated_at'],
  Ads:    ['id', 'ad_name', 'adset', 'campaign', 'post_url', 'creative_url', 'active', 'note'],
  AdSets: ['id', 'campaign', 'name', 'active', 'note'],
  Campaigns: ['id', 'name', 'start_date', 'end_date', 'objective', 'note', 'created_by', 'created_at'],
  // งบที่ตั้งไว้ (แผน) — 1 แถว = งบ/วันที่เริ่มใช้ตั้งแต่ start_date จนกว่าจะมีแถวใหม่ของระดับเดียวกัน
  // adset ว่าง = งบระดับแคมเปญ (CBO)
  Budgets: ['id', 'campaign', 'adset', 'start_date', 'daily_budget', 'note', 'created_by', 'created_at'],
  Spend:  ['id', 'date', 'adset', 'amount', 'note', 'created_by', 'created_at'],
  Users:  ['name', 'pin_hash', 'active'],
  Config: ['key', 'value'],
  Log:    ['at', 'user', 'action', 'sheet', 'row_id', 'data']
};
var DEFAULT_CONFIG = { target_cost_per_case: 1000, brand: 'BIGCAT' };
var STATUSES = ['1-ทักแล้วเงียบ', '2-มีข้อมูลเครื่อง', 'X-ของไม่ตรง', '3-ประเมินราคาแล้ว',
                '7-สินค้าไม่รับซื้อ', '4-นัดรับของ', '5-ปิดการขาย', '6-ขอซื้อสินค้า'];

// ============================================================
// HTTP
// ============================================================
function doGet() {
  return json_({ ok: true, app: 'fb-ads-tracker', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var action = req.action;
    if (action === 'users') return json_({ ok: true, data: listUserNames_() });
    if (action === 'login') return json_({ ok: true, data: login_(req.name, req.pin) });

    var user = verifyToken_(req.token);
    if (!user) return json_({ ok: false, error: 'AUTH', message: 'กรุณาเข้าสู่ระบบใหม่' });

    switch (action) {
      case 'bootstrap':   return json_({ ok: true, data: bootstrap_(user) });
      case 'saveChat':    return json_({ ok: true, data: saveChat_(req.chat, user) });
      case 'deleteChat':  return json_({ ok: true, data: deleteRow_('Chats', req.id, user) });
      case 'saveAd':      return json_({ ok: true, data: saveAd_(req.ad, user) });
      case 'deleteAd':    return json_({ ok: true, data: deleteRow_('Ads', req.id, user) });
      case 'saveSpend':   return json_({ ok: true, data: saveSpend_(req.spend, user) });
      case 'deleteSpend': return json_({ ok: true, data: deleteRow_('Spend', req.id, user) });
      case 'saveConfig':  return json_({ ok: true, data: saveConfig_(req.key, req.value, user) });
      case 'saveCampaign':   return json_({ ok: true, data: saveCampaign_(req.campaign, user) });
      case 'deleteCampaign': return json_({ ok: true, data: deleteCampaign_(req.id, user) });
      case 'saveAdset':      return json_({ ok: true, data: saveAdset_(req.adset, user) });
      case 'deleteAdset':    return json_({ ok: true, data: deleteAdset_(req.id, user) });
      case 'saveBudget':     return json_({ ok: true, data: saveBudget_(req.budget, user) });
      case 'deleteBudget':   return json_({ ok: true, data: deleteRow_('Budgets', req.id, user) });
      case 'saveUser':    return json_({ ok: true, data: saveUser_(req.name, req.pin, req.active, user) });
      default:            return json_({ ok: false, error: 'UNKNOWN_ACTION', message: 'ไม่รู้จักคำสั่ง ' + action });
    }
  } catch (err) {
    return json_({ ok: false, error: 'SERVER', message: String(err && err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// Setup
// ============================================================
function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var cols = SCHEMA[name];
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#EEF0FF');
    sh.setFrozenRows(1);
    // เก็บวันที่เป็นข้อความ yyyy-mm-dd กันชีตแปลงรูปแบบเอง
    cols.forEach(function (c, i) {
      if (/date$/.test(c)) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
    });
  });
  var cfg = ss.getSheetByName('Config');
  var existing = readTable_('Config').map(function (r) { return r.key; });
  Object.keys(DEFAULT_CONFIG).forEach(function (k) {
    if (existing.indexOf(k) < 0) cfg.appendRow([k, DEFAULT_CONFIG[k]]);
  });
  var first = ss.getSheetByName('Sheet1') || ss.getSheetByName('ชีต1');
  if (first && ss.getSheets().length > 1 && first.getLastRow() === 0) ss.deleteSheet(first);
  secret_(); // สร้างกุญแจลับถ้ายังไม่มี
  var n = syncCampaigns_();
  syncAdsets_();
  Logger.log('setup เสร็จ' + (n ? ' · สร้างแคมเปญจากข้อมูลเดิม ' + n + ' แคมเปญ' : '') + ' — ครั้งแรกให้รัน createFirstUser() ต่อ');
}

function createFirstUser() {
  saveUser_(FIRST_USER.name, FIRST_USER.pin, true, 'setup');
  Logger.log('เพิ่มผู้ใช้ ' + FIRST_USER.name + ' แล้ว');
}

// ============================================================
// Auth
// ============================================================
function secret_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('TOKEN_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('TOKEN_SECRET', s); }
  return s;
}

function hashPin_(name, pin) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(name).trim() + ':' + String(pin));
  return raw.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function b64_(s) { return Utilities.base64EncodeWebSafe(s, Utilities.Charset.UTF_8).replace(/=+$/, ''); }
function unb64_(s) { return Utilities.newBlob(Utilities.base64DecodeWebSafe(s)).getDataAsString('UTF-8'); }

function sign_(payload) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payload, secret_())).replace(/=+$/, '');
}

function login_(name, pin) {
  var u = readTable_('Users').filter(function (r) {
    return String(r.name).trim() === String(name || '').trim() && isTrue_(r.active);
  })[0];
  if (!u || u.pin_hash !== hashPin_(name, pin)) throw new Error('ชื่อหรือ PIN ไม่ถูกต้อง');
  var exp = Date.now() + TOKEN_DAYS * 86400000;
  var payload = b64_(u.name + '|' + exp);
  return { token: payload + '.' + sign_(payload), name: u.name, exp: exp };
}

function verifyToken_(token) {
  if (!token || token.indexOf('.') < 0) return null;
  var parts = token.split('.');
  if (sign_(parts[0]) !== parts[1]) return null;
  var p = unb64_(parts[0]).split('|');
  if (Number(p[1]) < Date.now()) return null;
  return p[0];
}

function listUserNames_() {
  return readTable_('Users').filter(function (r) { return isTrue_(r.active); })
    .map(function (r) { return r.name; });
}

function saveUser_(name, pin, active, by) {
  name = String(name || '').trim();
  if (!name) throw new Error('ต้องใส่ชื่อ');
  var sh = sheet_('Users');
  var rows = readTable_('Users');
  var idx = -1;
  rows.forEach(function (r, i) { if (String(r.name).trim() === name) idx = i; });
  if (idx < 0) {
    if (!/^\d{4,6}$/.test(String(pin || ''))) throw new Error('PIN ต้องเป็นตัวเลข 4–6 หลัก');
    sh.appendRow([name, hashPin_(name, pin), active === false ? false : true]);
  } else {
    var rowNo = idx + 2;
    if (pin) {
      if (!/^\d{4,6}$/.test(String(pin))) throw new Error('PIN ต้องเป็นตัวเลข 4–6 หลัก');
      sh.getRange(rowNo, 2).setValue(hashPin_(name, pin));
    }
    if (active !== undefined && active !== null) sh.getRange(rowNo, 3).setValue(!!active);
  }
  log_(by, 'saveUser', 'Users', name, { active: active, pinChanged: !!pin });
  return { name: name };
}

// ============================================================
// Data
// ============================================================
function bootstrap_(user) {
  var cfg = {};
  readTable_('Config').forEach(function (r) { cfg[r.key] = r.value; });
  Object.keys(DEFAULT_CONFIG).forEach(function (k) { if (cfg[k] === undefined || cfg[k] === '') cfg[k] = DEFAULT_CONFIG[k]; });
  return {
    me: user,
    chats: readTable_('Chats'),
    ads: readTable_('Ads'),
    spend: readTable_('Spend'),
    config: cfg,
    campaigns: readTable_('Campaigns'),
    budgets: readTable_('Budgets'),
    adsets: readTable_('AdSets'),
    users: readTable_('Users').map(function (r) { return { name: r.name, active: isTrue_(r.active) }; }),
    statuses: STATUSES,
    serverTime: new Date().toISOString()
  };
}

function saveChat_(chat, user) {
  if (!chat || !String(chat.customer || '').trim()) throw new Error('ต้องใส่ชื่อลูกค้า');
  if (STATUSES.indexOf(chat.status) < 0) throw new Error('สถานะไม่ถูกต้อง');
  if (chat.status === '5-ปิดการขาย' && !(Number(chat.amount) > 0)) throw new Error('เคสปิดการขายต้องใส่ยอดรับซื้อ');
  // เติม adset / campaign จากตาราง Ads ถ้าไม่ได้ส่งมา
  if (chat.ad && (!chat.adset || !chat.campaign)) {
    var ad = readTable_('Ads').filter(function (a) { return a.ad_name === chat.ad; })[0];
    if (ad) { chat.adset = chat.adset || ad.adset; chat.campaign = chat.campaign || ad.campaign; }
  }
  var now = new Date().toISOString();
  var rec = {
    id: chat.id, date: normDate_(chat.date) || today_(), customer: String(chat.customer).trim(),
    ad: chat.ad || '', adset: chat.adset || '', campaign: chat.campaign || '', status: chat.status,
    product: chat.product || '', amount: chat.amount === '' || chat.amount == null ? '' : Number(chat.amount),
    note: chat.note || '', updated_by: user, updated_at: now
  };
  return upsert_('Chats', rec, user, { created_by: user, created_at: now });
}

// ---------- แคมเปญ ----------
function saveCampaign_(cp, user) {
  var name = String(cp && cp.name || '').trim();
  if (!name) throw new Error('ต้องใส่ชื่อแคมเปญ');
  var start = normDate_(cp.start_date);
  if (!start) throw new Error('ต้องใส่วันที่เริ่มยิง');
  var end = normDate_(cp.end_date);
  if (end && end < start) throw new Error('วันที่ปิดต้องไม่ก่อนวันที่เริ่ม');
  var all = readTable_('Campaigns');
  if (all.some(function (c) { return c.name === name && c.id !== cp.id; })) throw new Error('มีแคมเปญชื่อนี้แล้ว');
  var old = cp.id ? all.filter(function (c) { return c.id === cp.id; })[0] : null;
  var rec = { id: cp.id, name: name, start_date: start, end_date: end, objective: cp.objective || '', note: cp.note || '' };
  var saved = upsert_('Campaigns', rec, user, { created_by: user, created_at: new Date().toISOString() });
  if (old && old.name !== name) renameCampaign_(old.name, name, user);
  return saved;
}

/** เปลี่ยนชื่อแคมเปญ → แก้ชื่อใน Ads / Chats / Budgets ให้ตรงกัน */
function renameCampaign_(from, to, user) {
  ['Ads', 'Chats', 'Budgets', 'AdSets'].forEach(function (name) {
    var sh = sheet_(name), cols = SCHEMA[name], ci = cols.indexOf('campaign');
    var last = sh.getLastRow();
    if (last < 2) return;
    var rg = sh.getRange(2, ci + 1, last - 1, 1);
    var vals = rg.getValues();
    var changed = false;
    vals.forEach(function (r) { if (r[0] === from) { r[0] = to; changed = true; } });
    if (changed) rg.setValues(vals);
  });
  log_(user, 'renameCampaign', 'Campaigns', '', { from: from, to: to });
}

function deleteCampaign_(id, user) {
  var cp = readTable_('Campaigns').filter(function (c) { return c.id === id; })[0];
  if (!cp) throw new Error('ไม่พบแคมเปญ');
  var used = readTable_('Ads').some(function (a) { return a.campaign === cp.name; }) ||
             readTable_('Chats').some(function (c) { return c.campaign === cp.name; });
  if (used) throw new Error('แคมเปญนี้มีโฆษณา/แชทอยู่ ลบไม่ได้ — ใส่วันที่ปิดแทน');
  readTable_('Budgets').filter(function (b) { return b.campaign === cp.name; })
    .forEach(function (b) { deleteRow_('Budgets', b.id, user); });
  return deleteRow_('Campaigns', id, user);
}

// ---------- Ad set ----------
function saveAdset_(a, user) {
  var name = String(a && a.name || '').trim();
  if (!a.campaign) throw new Error('ต้องเลือกแคมเปญ');
  if (!name) throw new Error('ต้องใส่ชื่อ Ad set');
  var all = readTable_('AdSets');
  if (all.some(function (x) { return x.campaign === a.campaign && x.name === name && x.id !== a.id; })) throw new Error('แคมเปญนี้มี Ad set ชื่อนี้แล้ว');
  var old = a.id ? all.filter(function (x) { return x.id === a.id; })[0] : null;
  var saved = upsert_('AdSets', { id: a.id, campaign: a.campaign, name: name, active: a.active === false ? false : true, note: a.note || '' }, user, {});
  if (old && old.name !== name) renameAdset_(a.campaign, old.name, name, user);
  return saved;
}

/** เปลี่ยนชื่อ Ad set → แก้ใน Ads / Chats / Budgets ของแคมเปญเดียวกัน */
function renameAdset_(campaign, from, to, user) {
  ['Ads', 'Chats', 'Budgets'].forEach(function (name) {
    var sh = sheet_(name), cols = SCHEMA[name], ai = cols.indexOf('adset'), ci = cols.indexOf('campaign');
    var last = sh.getLastRow();
    if (last < 2) return;
    var rg = sh.getRange(2, 1, last - 1, cols.length);
    var vals = rg.getValues(), changed = false;
    vals.forEach(function (r) { if (r[ci] === campaign && r[ai] === from) { r[ai] = to; changed = true; } });
    if (changed) sh.getRange(2, ai + 1, last - 1, 1).setValues(vals.map(function (r) { return [r[ai]]; }));
  });
  log_(user, 'renameAdset', 'AdSets', '', { campaign: campaign, from: from, to: to });
}

function deleteAdset_(id, user) {
  var a = readTable_('AdSets').filter(function (x) { return x.id === id; })[0];
  if (!a) throw new Error('ไม่พบ Ad set');
  var used = readTable_('Ads').some(function (x) { return x.campaign === a.campaign && x.adset === a.name; }) ||
             readTable_('Chats').some(function (x) { return x.campaign === a.campaign && x.adset === a.name; });
  if (used) throw new Error('Ad set นี้มีโฆษณา/แชทอยู่ ลบไม่ได้ — ปิดแทน');
  readTable_('Budgets').filter(function (b) { return b.campaign === a.campaign && b.adset === a.name; })
    .forEach(function (b) { deleteRow_('Budgets', b.id, user); });
  return deleteRow_('AdSets', id, user);
}

/** สร้างแถว Ad set จากชื่อที่มีใน Ads / Chats / Budgets แต่ยังไม่อยู่ในแท็บ AdSets */
function syncAdsets_() {
  var have = {};
  readTable_('AdSets').forEach(function (a) { have[a.campaign + '|' + a.name] = true; });
  var add = {};
  readTable_('Ads').concat(readTable_('Chats')).concat(readTable_('Budgets')).forEach(function (x) {
    if (x.campaign && x.adset && !have[x.campaign + '|' + x.adset]) add[x.campaign + '|' + x.adset] = { campaign: x.campaign, name: x.adset };
  });
  var rows = Object.keys(add).map(function (k, i) {
    return { id: newId_('AdSets') + i, campaign: add[k].campaign, name: add[k].name, active: true, note: '' };
  });
  appendObjects_('AdSets', rows);
  return rows.length;
}

function saveBudget_(b, user) {
  if (!b || !b.campaign) throw new Error('ต้องเลือกแคมเปญ');
  var start = normDate_(b.start_date);
  if (!start) throw new Error('ต้องใส่วันที่เริ่มใช้งบนี้');
  if (!(Number(b.daily_budget) >= 0) || b.daily_budget === '') throw new Error('งบ/วัน ต้องเป็นตัวเลข');
  var rec = { id: b.id, campaign: b.campaign, adset: b.adset || '', start_date: start, daily_budget: Number(b.daily_budget), note: b.note || '' };
  return upsert_('Budgets', rec, user, { created_by: user, created_at: new Date().toISOString() });
}

/** สร้างแถวแคมเปญจากชื่อที่มีใน Ads/Chats แต่ยังไม่อยู่ในแท็บ Campaigns (วันที่เริ่ม = แชทแรก) */
function syncCampaigns_() {
  var have = {};
  readTable_('Campaigns').forEach(function (c) { have[c.name] = true; });
  var first = {};
  readTable_('Chats').forEach(function (c) {
    if (!c.campaign) return;
    if (!first[c.campaign] || (c.date && c.date < first[c.campaign])) first[c.campaign] = c.date || first[c.campaign] || '';
  });
  readTable_('Ads').forEach(function (a) { if (a.campaign && !(a.campaign in first)) first[a.campaign] = ''; });
  var now = new Date().toISOString();
  var rows = Object.keys(first).filter(function (n) { return !have[n]; }).map(function (n, i) {
    return { id: newId_('Campaigns') + i, name: n, start_date: first[n] || today_(), end_date: '', objective: '', note: 'สร้างจากข้อมูลเดิม', created_by: 'sync', created_at: now };
  });
  appendObjects_('Campaigns', rows);
  return rows.length;
}

function saveAd_(ad, user) {
  if (!ad || !String(ad.ad_name || '').trim()) throw new Error('ต้องใส่ชื่อโฆษณา');
  if (!String(ad.adset || '').trim()) throw new Error('ต้องใส่ Ad set');
  var dup = readTable_('Ads').filter(function (a) { return a.ad_name === ad.ad_name.trim() && a.id !== ad.id; })[0];
  if (dup) throw new Error('ชื่อโฆษณาซ้ำ — ถ้าใช้ครีเอทีฟเดียวกัน 2 Ad set ให้เติม (AS-1) (AS-2) ต่อท้าย');
  var rec = {
    id: ad.id, ad_name: ad.ad_name.trim(), adset: ad.adset.trim(), campaign: (ad.campaign || '').trim(),
    post_url: ad.post_url || '', creative_url: ad.creative_url || '',
    active: ad.active === false ? false : true, note: ad.note || ''
  };
  var savedAd = upsert_('Ads', rec, user, {});
  if (rec.campaign && rec.adset) syncAdsets_();
  return savedAd;
}

function saveSpend_(sp, user) {
  if (!sp || !sp.adset) throw new Error('ต้องเลือก Ad set');
  if (!(Number(sp.amount) >= 0)) throw new Error('ยอดต้องเป็นตัวเลข');
  var rec = { id: sp.id, date: normDate_(sp.date) || today_(), adset: sp.adset, amount: Number(sp.amount), note: sp.note || '' };
  return upsert_('Spend', rec, user, { created_by: user, created_at: new Date().toISOString() });
}

function saveConfig_(key, value, user) {
  var sh = sheet_('Config');
  var rows = readTable_('Config');
  var idx = -1;
  rows.forEach(function (r, i) { if (r.key === key) idx = i; });
  if (idx < 0) sh.appendRow([key, value]); else sh.getRange(idx + 2, 2).setValue(value);
  log_(user, 'saveConfig', 'Config', key, value);
  return { key: key, value: value };
}

// ============================================================
// Table helpers
// ============================================================
function sheet_(name) {
  var sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบแท็บ ' + name + ' — รัน setup() ก่อน');
  return sh;
}

function readTable_(name) {
  var sh = sheet_(name);
  var last = sh.getLastRow();
  var cols = SCHEMA[name];
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, cols.length).getValues();
  return values.filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    var o = {};
    cols.forEach(function (c, i) {
      var v = r[i];
      if (v instanceof Date) v = /date$/.test(c) ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : v.toISOString();
      o[c] = v;
    });
    return o;
  });
}

function upsert_(name, rec, user, createOnly) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(name);
    var cols = SCHEMA[name];
    var ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
    var idx = rec.id ? ids.indexOf(String(rec.id)) : -1;
    if (idx < 0) {
      rec.id = rec.id || newId_(name);
      Object.keys(createOnly).forEach(function (k) { rec[k] = createOnly[k]; });
      sh.appendRow(cols.map(function (c) { return rec[c] === undefined ? '' : rec[c]; }));
      log_(user, 'create', name, rec.id, rec);
    } else {
      var rowNo = idx + 2;
      var cur = sh.getRange(rowNo, 1, 1, cols.length).getValues()[0];
      var row = cols.map(function (c, i) { return rec[c] === undefined ? cur[i] : rec[c]; });
      sh.getRange(rowNo, 1, 1, cols.length).setValues([row]);
      cols.forEach(function (c, i) { rec[c] = row[i] instanceof Date ? (/date$/.test(c) ? Utilities.formatDate(row[i], TZ, 'yyyy-MM-dd') : row[i].toISOString()) : row[i]; });
      log_(user, 'update', name, rec.id, rec);
    }
    return rec;
  } finally {
    lock.releaseLock();
  }
}

function deleteRow_(name, id, user) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(name);
    var cols = SCHEMA[name];
    var last = sh.getLastRow();
    if (last < 2) throw new Error('ไม่พบรายการ');
    var ids = sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); });
    var idx = ids.indexOf(String(id));
    if (idx < 0) throw new Error('ไม่พบรายการ');
    var before = sh.getRange(idx + 2, 1, 1, cols.length).getValues()[0];
    sh.deleteRow(idx + 2);
    var o = {}; cols.forEach(function (c, i) { o[c] = before[i]; });
    log_(user, 'delete', name, id, o);
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}

function log_(user, action, sheetName, rowId, data) {
  try {
    sheet_('Log').appendRow([new Date().toISOString(), user || '', action, sheetName, rowId || '', JSON.stringify(data || {})]);
  } catch (e) { /* ไม่ให้ log พังแล้วงานหลักพัง */ }
}

function newId_(name) {
  return name.charAt(0).toLowerCase() + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function isTrue_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }

/** รับได้ทั้ง Date, 'yyyy-mm-dd', 'd/m/yy', 'd/m/yyyy' (ปี พ.ศ. ก็ได้) */
function normDate_(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  var s = String(v).trim();
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + pad_(m[2]) + '-' + pad_(m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    var y = Number(m[3]);
    if (y < 100) y += 2000;
    if (y > 2400) y -= 543;
    return y + '-' + pad_(m[2]) + '-' + pad_(m[1]);
  }
  return '';
}
function pad_(n) { return ('0' + n).slice(-2); }

// ============================================================
// Import จากชีตเดิม
// ============================================================
function importFromOldSheet() {
  var already = readTable_('Chats').some(function (c) { return c.created_by === 'import'; });
  if (already) throw new Error('นำเข้าไปแล้ว — ถ้าจะนำเข้าใหม่ให้รัน reimportFromOldSheet() แทน (จะลบแถวที่นำเข้ารอบก่อนออกก่อน)');
  importCore_();
}

/**
 * ล้างข้อมูลที่นำเข้ารอบก่อน แล้วนำเข้าใหม่
 * - ลบแชท/ค่า Ads ที่ created_by = import (แชทที่คนกรอกเองในเว็บไม่โดนลบ)
 * - ลบโฆษณาที่ชื่อซ้ำ (เก็บแถวแรก)
 * หมายเหตุ: ถ้าเคยแก้แชทที่นำเข้ามา (เช่น เติมยอดรับซื้อ) การแก้นั้นจะหาย
 */
function reimportFromOldSheet() {
  var chats = readTable_('Chats');
  var keepChats = chats.filter(function (c) { return c.created_by !== 'import'; });
  var spend = readTable_('Spend');
  var keepSpend = spend.filter(function (x) { return x.created_by !== 'import'; });
  var seen = {};
  var ads = readTable_('Ads');
  var keepAds = ads.filter(function (a) { if (seen[a.ad_name]) return false; seen[a.ad_name] = true; return true; });
  rewriteTable_('Chats', keepChats);
  rewriteTable_('Spend', keepSpend);
  rewriteTable_('Ads', keepAds);
  Logger.log('ลบแถวนำเข้าเดิม: แชท ' + (chats.length - keepChats.length) + ' · ค่า Ads ' + (spend.length - keepSpend.length) + ' · โฆษณาซ้ำ ' + (ads.length - keepAds.length));
  importCore_();
}

function rewriteTable_(name, objs) {
  var sh = sheet_(name), cols = SCHEMA[name];
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).clearContent();
  appendObjects_(name, objs);
}

function importCore_() {
  var old = SpreadsheetApp.openById(OLD_SHEET_ID);
  var user = 'import';
  var now = new Date().toISOString();
  var monthMap = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8,
                   September: 9, October: 10, November: 11, December: 12 };

  // ---- 1) ตั้งค่า → Ads + Spend
  var setSh = old.getSheetByName('ตั้งค่า');
  var setVals = setSh.getDataRange().getValues();
  var ads = [], spends = [];
  var hdrRow = -1, cAd = -1, cAdset = -1, cCamp = -1, cMonth = -1, cSpAdset = -1, cSpAmt = -1;
  for (var r = 0; r < setVals.length && hdrRow < 0; r++) {
    for (var c = 0; c < setVals[r].length; c++) {
      var t = String(setVals[r][c]);
      if (t.indexOf('ชื่อโฆษณา') === 0) { hdrRow = r; cAd = c; cAdset = c + 1; cCamp = c + 2; }
      if (t === 'เดือน') cMonth = c;
      if (t === 'Ad set' && cMonth >= 0 && cSpAdset < 0) cSpAdset = c;
      if (t.indexOf('งบที่ใช้') === 0) cSpAmt = c;
    }
  }
  if (hdrRow < 0) throw new Error('หาตารางโฆษณาในแท็บ ตั้งค่า ไม่เจอ');
  var seenAds = {};
  readTable_('Ads').forEach(function (a) { seenAds[a.ad_name] = true; }); // ไม่สร้างโฆษณาที่มีอยู่แล้วซ้ำ
  for (r = hdrRow + 1; r < setVals.length; r++) {
    var row = setVals[r];
    var name = String(row[cAd] || '').trim();
    if (name && row[cAdset] && !seenAds[name]) {
      seenAds[name] = true;
      ads.push({ id: newId_('Ads') + ads.length, ad_name: name, adset: String(row[cAdset]).trim(),
                 campaign: String(row[cCamp] || '').trim(), post_url: '', creative_url: '', active: true, note: '' });
    }
    if (cMonth >= 0 && cSpAmt >= 0 && Number(row[cSpAmt]) > 0 && row[cSpAdset]) {
      var mv = row[cMonth], d = '';
      if (mv instanceof Date) d = Utilities.formatDate(mv, TZ, 'yyyy-MM') + '-01';
      else {
        var mm = String(mv).match(/([A-Za-z]+)\s+(\d{4})/);
        if (mm && monthMap[mm[1]]) d = mm[2] + '-' + pad_(monthMap[mm[1]]) + '-01';
      }
      if (d) spends.push({ id: newId_('Spend') + spends.length, date: d, adset: String(row[cSpAdset]).trim(),
                           amount: Number(row[cSpAmt]), note: 'นำเข้าจากชีตเดิม (ยอดทั้งเดือน)', created_by: user, created_at: now });
    }
  }

  // ---- 2) แชท → Chats
  var chatSh = old.getSheetByName('แชท');
  var cv = chatSh.getDataRange().getValues();
  // วันที่ใช้ "ค่าที่แสดงในชีต" (d/m/yy) — ชีตเดิมบางช่องถูกแปลงเป็นวันที่แบบ ด/ว สลับกัน (เช่น 11/9 กลายเป็น 9 พ.ย.)
  var cvShow = chatSh.getDataRange().getDisplayValues();
  var h = -1, cName = -1, cAdC = -1, cAdsetC = -1, cCampC = -1, cStatus = -1;
  for (r = 0; r < Math.min(cv.length, 10) && h < 0; r++) {
    for (c = 0; c < cv[r].length; c++) {
      var tx = String(cv[r][c]).trim();
      if (tx === 'ชื่อลูกค้า') { h = r; cName = c; }
    }
  }
  if (h < 0) throw new Error('หาหัวตาราง ชื่อลูกค้า ในแท็บ แชท ไม่เจอ');
  cv[h].forEach(function (x, i) {
    x = String(x).trim();
    if (x === 'โฆษณา') cAdC = i;
    if (x === 'Ad set') cAdsetC = i;
    if (x === 'แคมเปญ') cCampC = i;
    if (x === 'สถานะ') cStatus = i;
  });
  var cDate = cName - 1;
  var chats = [], lastDate = '';
  for (r = h + 1; r < cv.length; r++) {
    var rr = cv[r];
    var cust = String(rr[cName] || '').trim();
    if (!cust) continue;
    var dt = normDate_(String(cvShow[r][cDate] || '').trim());
    var note = '';
    if (dt) lastDate = dt; else { dt = lastDate; note = 'ชีตเดิมไม่มีวันที่ — ใช้วันที่ของแถวก่อนหน้า'; }
    var st = String(rr[cStatus] || '').trim();
    if (STATUSES.indexOf(st) < 0) { note = (note ? note + ' · ' : '') + 'สถานะเดิม: ' + st; st = '1-ทักแล้วเงียบ'; }
    var adName = String(rr[cAdC] || '').trim();
    var adsetName = String(rr[cAdsetC] || '').trim();
    if (adName && !seenAds[adName]) {
      seenAds[adName] = true;
      ads.push({ id: newId_('Ads') + ads.length, ad_name: adName, adset: adsetName,
                 campaign: String(rr[cCampC] || '').trim(), post_url: '', creative_url: '', active: true, note: 'สร้างจากแท็บแชท' });
    }
    chats.push({ id: newId_('Chats') + chats.length, date: dt, customer: cust, ad: adName, adset: adsetName,
                 campaign: String(rr[cCampC] || '').trim(), status: st, product: '', amount: '', note: note,
                 created_by: user, created_at: now, updated_by: user, updated_at: now });
  }

  // ---- 3) เขียนลงชีตใหม่ (ต่อท้าย)
  appendObjects_('Ads', ads);
  appendObjects_('Spend', spends);
  appendObjects_('Chats', chats);
  var nc = syncCampaigns_();
  syncAdsets_();
  log_(user, 'import', 'ALL', '', { ads: ads.length, spend: spends.length, chats: chats.length });
  Logger.log('นำเข้าแล้ว: โฆษณา ' + ads.length + ' · ค่า Ads ' + spends.length + ' · แชท ' + chats.length + ' · แคมเปญ ' + nc);
}

function appendObjects_(name, objs) {
  if (!objs.length) return;
  var sh = sheet_(name), cols = SCHEMA[name];
  var rows = objs.map(function (o) { return cols.map(function (c) { return o[c] === undefined ? '' : o[c]; }); });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, cols.length).setValues(rows);
}
