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
 *   testFacebook()        – เช็คว่าโทเคน FB_TOKEN ใช้ได้ไหม
 *   syncFacebook()        – ดึงค่า Ads / งบ / แคมเปญ จาก Facebook ตอนนี้
 *   installAutoSync()     – ตั้งให้ดึงจาก Facebook อัตโนมัติทุก 3 ชั่วโมง
 */

// ====== ตั้งค่าที่แก้ได้ ======
var OLD_SHEET_ID = '10RES0HrYE5Ff13bp2LRKf9cZWmK7jh1-KGu8O3z-IQE';
var FIRST_USER = { name: 'Admin', pin: '1234' }; // เปลี่ยนก่อนรัน createFirstUser()
var TOKEN_DAYS = 30;
var TZ = 'Asia/Bangkok';

// ====== ดึงข้อมูลจาก Facebook Ads อัตโนมัติ ======
// โทเคนไม่ใส่ในโค้ด — วางใน Project Settings → Script Properties ชื่อ FB_TOKEN
var FB_AD_ACCOUNT = 'act_1153541378984020';
var FB_API = 'https://graph.facebook.com/v23.0/';
var FB_FIRST_DAYS = 90;   // ครั้งแรกดึงย้อนหลังกี่วัน
var FB_REFETCH_DAYS = 3;  // ดึงซ้ำย้อนหลังกี่วันทุกรอบ (Facebook ยังปรับตัวเลขช่วงล่าสุด)
var FB_INBOX_SINCE = '2026-09-01';
// ชีตภายนอก (อ่านอย่างเดียว — ระบบไม่เขียนอะไรกลับไป)
var PURCHASE_SHEET_ID = '1hsrvfwvkpZJE5Q6-75Fj5xg0FtePA-TceF8mJ8KF6iU'; // BIGCAT-TEST · แท็บ Orders_MM_YYYY
var METRICS_SHEET_ID  = '1AEwjnQ0komRSwLi2-8TUj-SxAM0jvUgKYG1THfA-80Y'; // Google Ads · แท็บ METRICS // ดึงรายชื่อคนทักเพจตั้งแต่วันนี้เป็นต้นไป
var FB_PAGE_ID = '';      // ว่าง = หาเพจให้เองจากโทเคน (ถ้ามีหลายเพจให้ใส่ ID เพจ Bigcat ตรงนี้)
var BACKEND_VERSION = 10; // หน้าเว็บจะเช็คเลขนี้ — ถ้าต่ำกว่าที่ต้องการจะไม่ยอมบันทึก (กันข้อมูลหาย)

// ====== โครงสร้างตาราง ======
var SCHEMA = {
  Chats:  ['id', 'date', 'customer', 'ad', 'adset', 'campaign', 'status', 'product', 'amount', 'note',
           'created_by', 'created_at', 'updated_by', 'updated_at', 'closed_date', 'closed_by',
           'psid', 'pic', 'source', 'review'],
  // คนที่ทักเพจ (ดึงจาก Inbox) — status: pending = รอคัดแยก · ad = เป็นแชทจากโฆษณาแล้ว (อยู่ในแท็บ Chats) · other = ทักมาจากช่องทางอื่น
  Inbox:  ['psid', 'name', 'pic', 'first_date', 'last_date', 'first_text', 'status', 'suggest', 'chat_id', 'updated_at', 'approx'],
  Ads:    ['id', 'ad_name', 'adset', 'campaign', 'post_url', 'creative_url', 'active', 'note', 'fb_id'],
  AdSets: ['id', 'campaign', 'name', 'active', 'note', 'fb_id'],
  Campaigns: ['id', 'name', 'start_date', 'end_date', 'objective', 'note', 'created_by', 'created_at', 'fb_id'],
  // งบที่ตั้งไว้ (แผน) — 1 แถว = งบ/วันที่เริ่มใช้ตั้งแต่ start_date จนกว่าจะมีแถวใหม่ของระดับเดียวกัน
  // adset ว่าง = งบระดับแคมเปญ (CBO)
  // รอบการยิง — 1 แถว = ยิงด้วยงบ/วันเดียวกัน ตั้งแต่ start_date ถึง end_date (ว่าง = ยังยิงอยู่)
  Budgets: ['id', 'campaign', 'adset', 'start_date', 'daily_budget', 'note', 'created_by', 'created_at', 'end_date'],
  // ค่า Ads ที่ใช้จริง — 1 แถว = ยอดของช่วง date → date_to (วันเดียวก็ได้) ระดับแคมเปญ (adset ว่าง) หรือ Ad set
  // source = 'fb' คือแถวที่ระบบดึงจาก Facebook เอง · results = จำนวนแชทที่ Facebook นับ (การเริ่มการสนทนา)
  Spend:  ['id', 'date', 'adset', 'amount', 'note', 'created_by', 'created_at', 'campaign', 'date_to', 'results', 'source'],
  Users:  ['name', 'pin_hash', 'active'],
  Config: ['key', 'value'],
  Log:    ['at', 'user', 'action', 'sheet', 'row_id', 'data'],
  // ประสิทธิภาพโฆษณา Facebook รายวัน ระดับโฆษณา
  FbAds:  ['date', 'campaign', 'adset', 'ad', 'spend', 'impressions', 'reach', 'clicks', 'chats', 'link_clicks'],
  // Google Ads รายวัน (คัดลอกจากแท็บ METRICS)
  GAds:   ['date', 'campaign', 'cost', 'conversions', 'impressions', 'clicks'],
  // รับซื้อสำเร็จ (คัดลอกจากแท็บ Orders_MM_YYYY ของบริษัท)
  Purchases: ['product_id', 'buy_date', 'seller', 'category', 'fb', 'line', 'bought', 'repair', 'sell', 'detail', 'updated_at'],
  // เคสประเมิน (คัดลอกจากแท็บ Estimations_MM_YYYY ของบริษัท · อ่านอย่างเดียว)
  Estimates: ['est_id', 'est_date', 'hour', 'category', 'fb', 'line', 'status', 'detail', 'updated_at'],
  // ค่า Ads Facebook รายชั่วโมง ระดับ Ad set (เวลาตามบัญชีโฆษณา)
  FbHourly: ['date', 'hour', 'campaign', 'adset', 'spend', 'chats']
};
// คอลัมน์ที่ต้องเก็บเป็นข้อความ: วันที่ (กันชีตแปลงรูปแบบ) และ ID ของ Facebook (ยาวเกิน 15 หลัก ถ้าเป็นตัวเลขชีตจะปัดเลขท้ายทิ้ง)
var TEXT_COL = /date|psid|fb_id|chat_id|product_id|est_id/;
var DEFAULT_CONFIG = { target_cost_per_case: 1000, brand: 'BIGCAT' };
var STATUSES = ['1-ทักแล้วเงียบ', '2-มีข้อมูลเครื่อง', 'X-ของไม่ตรง', '3-ประเมินราคาแล้ว',
                '7-สินค้าไม่รับซื้อ', '4-นัดรับของ', '5-ปิดการขาย', '6-ขอซื้อสินค้า'];

// ============================================================
// HTTP
// ============================================================
function doGet() {
  return json_({ ok: true, app: 'fb-ads-tracker', backend_version: BACKEND_VERSION, time: new Date().toISOString() });
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
      case 'syncFacebook':   return json_({ ok: true, data: syncFacebook_(user) });
      case 'inboxDecide':    return json_({ ok: true, data: inboxDecide_(req, user) });
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
/** ดึงข้อมูล Facebook ย้อนหลังใหม่ทั้งหมด 90 วัน (ใช้ครั้งเดียวหลังอัปเดต เพื่อเติม "คลิกลิงก์" ของวันเก่า) */
function refetchFacebook() {
  setConfig_('fb_synced_until', '');
  setConfig_('fb_hourly_until', '');
  syncFacebook();
}

function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var cols = SCHEMA[name];
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#EEF0FF');
    sh.setFrozenRows(1);
    // เก็บวันที่เป็นข้อความ yyyy-mm-dd กันชีตแปลงรูปแบบเอง
    cols.forEach(function (c, i) {
      if (TEXT_COL.test(c)) sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
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
    fbads: tableOrEmpty_('FbAds'),
    gads: tableOrEmpty_('GAds'),
    purchases: tableOrEmpty_('Purchases').map(function (r) { return [r.buy_date, r.category, r.fb ? 1 : 0, r.line ? 1 : 0, Number(r.bought) || 0, Number(r.repair) || 0, Number(r.sell) || 0, r.fb || '', needDetail_(r.category) ? r.detail || '' : '']; }),
    estimates: tableOrEmpty_('Estimates').map(function (r) { return [r.est_date, r.hour === '' ? -1 : Number(r.hour), r.category, r.fb ? 1 : 0, r.line ? 1 : 0, /ปิดสำเร็จ/.test(r.status) ? 1 : 0, needDetail_(r.category) ? r.detail || '' : '']; }),
    fbhourly: (function () { var lim = addDays_(today_(), -92); return tableOrEmpty_('FbHourly').filter(function (r) { return String(r.date) >= lim; })
      .map(function (r) { return [r.date, Number(r.hour), r.campaign, r.adset, Number(r.spend) || 0, Number(r.chats) || 0]; }); })(),
    inbox: tableOrEmpty_('Inbox').filter(function (r) { return r.status !== 'ad' && (!r.first_date || String(r.first_date) >= FB_INBOX_SINCE); }),
    users: readTable_('Users').map(function (r) { return { name: r.name, active: isTrue_(r.active) }; }),
    statuses: STATUSES,
    serverTime: new Date().toISOString(),
    backend_version: BACKEND_VERSION
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
    note: chat.note || '', updated_by: user, updated_at: now, review: ''
  };
  if (chat.status === '5-ปิดการขาย') {
    rec.closed_date = normDate_(chat.closed_date) || today_();
    rec.closed_by = chat.closed_by || user;
  } else { rec.closed_date = ''; rec.closed_by = ''; }
  if (chat.psid) { rec.psid = String(chat.psid); rec.pic = chat.pic || ''; rec.source = 'fb'; }
  var saved = upsert_('Chats', rec, user, { created_by: user, created_at: now });
  if (chat.psid) {
    try {
      var lock = LockService.getScriptLock(); lock.waitLock(20000);
      try {
        var inbox = readTable_('Inbox'), hit = false;
        inbox.forEach(function (r) { if (String(r.psid) === String(chat.psid)) { r.status = 'ad'; r.chat_id = saved.id; r.updated_at = now; hit = true; } });
        if (hit) rewriteTable_('Inbox', inbox);
      } finally { lock.releaseLock(); }
    } catch (e) {}
  }
  return saved;
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
  var end = normDate_(b.end_date);
  if (end && end < start) throw new Error('วันที่จบต้องไม่ก่อนวันที่เริ่ม');
  var rec = { id: b.id, campaign: b.campaign, adset: b.adset || '', start_date: start, end_date: end, daily_budget: Number(b.daily_budget), note: b.note || '' };
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
  if (!sp || (!sp.campaign && !sp.adset)) throw new Error('ต้องเลือกแคมเปญ');
  if (sp.amount === '' || !(Number(sp.amount) >= 0)) throw new Error('ยอดต้องเป็นตัวเลข');
  var from = normDate_(sp.date) || today_();
  var to = normDate_(sp.date_to) || from;
  if (to < from) throw new Error('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
  var rec = { id: sp.id, date: from, date_to: to, campaign: sp.campaign || '', adset: sp.adset || '', amount: Number(sp.amount), note: sp.note || '' };
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
      if (v instanceof Date) v = /date/.test(c) ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : v.toISOString();
      else if (/date/.test(c) && v !== '') v = normDate_(v) || v;
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
      appendObjects_(name, [rec]);
      log_(user, 'create', name, rec.id, rec);
    } else {
      var rowNo = idx + 2;
      var cur = sh.getRange(rowNo, 1, 1, cols.length).getValues()[0];
      var row = cols.map(function (c, i) { return rec[c] === undefined ? cur[i] : rec[c]; });
      sh.getRange(rowNo, 1, 1, cols.length).setValues([row]);
      cols.forEach(function (c, i) { rec[c] = row[i] instanceof Date ? (/date/.test(c) ? Utilities.formatDate(row[i], TZ, 'yyyy-MM-dd') : row[i].toISOString()) : row[i]; });
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
  sh.getRange(1, 1, 1, cols.length).setValues([cols]); // หัวตารางให้ตรงเสมอ (กันคอลัมน์ใหม่หาย)
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
  var sh = sheet_(name), cols = SCHEMA[name], start = sh.getLastRow() + 1;
  var rows = objs.map(function (o) { return cols.map(function (c) { return o[c] === undefined || o[c] === null ? '' : TEXT_COL.test(c) ? String(o[c]) : o[c]; }); });
  cols.forEach(function (c, i) { if (TEXT_COL.test(c)) sh.getRange(start, i + 1, rows.length, 1).setNumberFormat('@'); });
  sh.getRange(start, 1, rows.length, cols.length).setValues(rows);
}


// ============================================================
// Facebook Ads → ชีต (อ่านอย่างเดียว ไม่แก้อะไรใน Facebook)
// ============================================================
function fbToken_() {
  var t = PropertiesService.getScriptProperties().getProperty('FB_TOKEN');
  if (!t) throw new Error('ยังไม่ได้ใส่ FB_TOKEN — Project Settings → Script Properties → เพิ่ม FB_TOKEN');
  return String(t).trim();
}
function fbGetAll_(path, params, token) {
  token = token || fbToken_();
  var out = [];
  var q = Object.keys(params || {}).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
  var url = FB_API + path + '?' + q + (q ? '&' : '') + 'access_token=' + encodeURIComponent(token), guard = 0;
  while (url && guard++ < 50) {
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var body = JSON.parse(res.getContentText() || '{}');
    if (body.error) throw new Error('Facebook: ' + (body.error.message || 'error') + ' (code ' + body.error.code + ')');
    if (body.data) out = out.concat(body.data); else return body;
    url = body.paging && body.paging.next;
  }
  return out;
}
function fbDate_(iso) {
  if (!iso) return '';
  var d = new Date(String(iso).replace(/([+-]\d\d)(\d\d)$/, '$1:$2')); // Facebook ส่ง +0000 (ไม่มี :)
  return isNaN(d) ? String(iso).slice(0, 10) : Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
}
function addDays_(d, n) { var x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return Utilities.formatDate(x, 'UTC', 'yyyy-MM-dd'); }

/** กดรันใน editor เพื่อเช็คโทเคน */
function testFacebook() {
  var acc = fbGetAll_(FB_AD_ACCOUNT, { fields: 'name,currency,account_status' });
  Logger.log('เชื่อมต่อได้ ✓ บัญชี: ' + acc.name + ' · สกุลเงิน ' + acc.currency);
}
function syncFacebook() { Logger.log(JSON.stringify(syncFacebook_('facebook'))); }
function installAutoSync() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'syncFacebook') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncFacebook').timeBased().everyHours(1).create();
  Logger.log('ตั้งดึงอัตโนมัติทุก 1 ชั่วโมงแล้ว');
}

function syncFacebook_(user) {
  var t0 = Date.now(), sum_hrError = '';
  var cfg = {};
  readTable_('Config').forEach(function (r) { cfg[r.key] = r.value; });
  var today = today_();
  var since = cfg.fb_synced_until ? addDays_(normDate_(cfg.fb_synced_until) || today, -FB_REFETCH_DAYS) : addDays_(today, -FB_FIRST_DAYS + 1);
  if (since > today) since = today;

  // ---- 1) ดึงจาก Facebook (ยังไม่แตะชีต) ----
  var fbCamps = fbGetAll_(FB_AD_ACCOUNT + '/campaigns', { fields: 'id,name,effective_status,daily_budget,start_time', limit: 200 });
  var fbSets = fbGetAll_(FB_AD_ACCOUNT + '/adsets', { fields: 'id,name,campaign_id,effective_status,daily_budget', limit: 300 });
  var fbAds = fbGetAll_(FB_AD_ACCOUNT + '/ads', { fields: 'id,name,adset_id,campaign_id,effective_status', limit: 500 });
  var ins = fbGetAll_(FB_AD_ACCOUNT + '/insights', {
    level: 'campaign', time_increment: 1, limit: 500,
    time_range: JSON.stringify({ since: since, until: today }),
    fields: 'campaign_id,campaign_name,spend,actions'
  });
  var adIns = [];
  try {
    adIns = fbGetAll_(FB_AD_ACCOUNT + '/insights', {
      level: 'ad', time_increment: 1, limit: 500,
      time_range: JSON.stringify({ since: since, until: today }),
      fields: 'campaign_id,adset_name,ad_name,spend,impressions,reach,clicks,inline_link_clicks,actions'
    });
  } catch (e) { adIns = null; } // ไม่กระทบค่า Ads หลัก
  // ค่า Ads รายชั่วโมง (ระดับ Ad set) — ครั้งแรกย้อนหลัง 90 วัน
  var hrSince = cfg.fb_hourly_until ? addDays_(normDate_(cfg.fb_hourly_until) || today, -FB_REFETCH_DAYS) : addDays_(today, -FB_FIRST_DAYS + 1), hrIns = null;
  if (hrSince > today) hrSince = today;
  try {
    hrIns = fbGetAll_(FB_AD_ACCOUNT + '/insights', {
      level: 'adset', time_increment: 1, limit: 500, breakdowns: 'hourly_stats_aggregated_by_advertiser_time_zone',
      time_range: JSON.stringify({ since: hrSince, until: today }),
      fields: 'campaign_id,adset_name,spend,actions'
    });
  } catch (e) { hrIns = null; sum_hrError = String(e && e.message || e); }

  var spentCamp = {}, firstSpend = {}, lastSpend = {};
  ins.forEach(function (r) {
    if (!(Number(r.spend) > 0)) return;
    spentCamp[r.campaign_id] = true;
    if (!firstSpend[r.campaign_id] || r.date_start < firstSpend[r.campaign_id]) firstSpend[r.campaign_id] = r.date_start;
    if (!lastSpend[r.campaign_id] || r.date_start > lastSpend[r.campaign_id]) lastSpend[r.campaign_id] = r.date_start;
  });

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var sum = { campaigns: 0, adsets: 0, ads: 0, spendDays: 0, budgetChanges: 0, renamed: 0 };
  try {
    // ---- 2) แคมเปญ (จับคู่ด้วย fb_id ก่อน แล้วค่อยชื่อ) ----
    var camps = readTable_('Campaigns'), linked = {};
    camps.forEach(function (c) { if (c.fb_id) linked[String(c.fb_id)] = true; });
    var campName = {};
    fbCamps.forEach(function (fc) {
      var inScope = fc.effective_status === 'ACTIVE' || spentCamp[fc.id] || linked[fc.id];
      if (!inScope) return;
      var row = camps.filter(function (c) { return String(c.fb_id) === fc.id; })[0];
      if (row && row.name !== fc.name) { renameCampaign_(row.name, fc.name, 'facebook'); row.name = fc.name; sum.renamed++; }
      if (!row) row = camps.filter(function (c) { return c.name === fc.name; })[0];
      if (!row) {
        row = { id: newId_('Campaigns'), name: fc.name, start_date: firstSpend[fc.id] || fbDate_(fc.start_time) || today, end_date: '', objective: '',
                note: 'ดึงจาก Facebook', created_by: 'facebook', created_at: new Date().toISOString() };
        camps.push(row); sum.campaigns++;
      }
      row.fb_id = fc.id;
      campName[fc.id] = fc.name;
    });
    rewriteTable_('Campaigns', camps);

    // ---- 3) Ad set ----
    var sets = readTable_('AdSets'), setInfo = {};
    fbSets.forEach(function (fs) {
      var camp = campName[fs.campaign_id];
      if (!camp) return;
      var row = sets.filter(function (a) { return String(a.fb_id) === fs.id; })[0];
      if (row && row.name !== fs.name) { renameAdset_(camp, row.name, fs.name, 'facebook'); row.name = fs.name; sum.renamed++; }
      if (!row) row = sets.filter(function (a) { return a.campaign === camp && a.name === fs.name; })[0];
      if (!row) { row = { id: newId_('AdSets'), campaign: camp, name: fs.name, active: true, note: 'ดึงจาก Facebook' }; sets.push(row); sum.adsets++; }
      row.fb_id = fs.id; row.campaign = camp;
      row.active = fs.effective_status === 'ACTIVE';
      setInfo[fs.id] = { name: fs.name, camp: camp };
    });
    rewriteTable_('AdSets', sets);

    // ---- 4) โฆษณา (ให้เลือกในหน้าบันทึกแชท) ----
    var ads = readTable_('Ads');
    fbAds.forEach(function (fa) {
      var si = setInfo[fa.adset_id];
      if (!si) return;
      // จับคู่ด้วย id ก่อน แล้วค่อยชื่อ+แคมเปญ (id เก่าบางแถวอาจเพี้ยนจากชีตปัดตัวเลข)
      var row = ads.filter(function (a) { return String(a.fb_id) === fa.id; })[0] ||
                ads.filter(function (a) { return a.ad_name === fa.name && a.campaign === si.camp; })[0];
      if (!row) {
        row = { id: newId_('Ads'), ad_name: fa.name, post_url: '', creative_url: '', note: 'ดึงจาก Facebook' };
        ads.push(row); sum.ads++;
      }
      row.fb_id = fa.id; row.adset = si.name; row.campaign = si.camp;
      row.active = fa.effective_status === 'ACTIVE';
    });
    // ลบแถวโฆษณาซ้ำ (ชื่อ + Ad set + แคมเปญ เดียวกัน)
    var seenAd = {};
    ads = ads.filter(function (a) { var k = a.ad_name + '|' + a.adset + '|' + a.campaign; if (seenAd[k]) return false; seenAd[k] = true; return true; });
    rewriteTable_('Ads', ads);

    // ---- 5) ค่า Ads รายวัน (แทนที่แถว Facebook เดิมในช่วงที่ดึง) ----
    var spend = readTable_('Spend').filter(function (x) { return !(x.source === 'fb' && x.date >= since); });
    var now = new Date().toISOString();
    ins.forEach(function (r) {
      var camp = campName[r.campaign_id];
      if (!camp) return;
      var amt = Number(r.spend) || 0, msg = 0;
      (r.actions || []).forEach(function (a) { if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') msg = Number(a.value) || 0; });
      if (!amt && !msg) return;
      spend.push({ id: 'fb_' + r.campaign_id + '_' + r.date_start, date: r.date_start, date_to: r.date_start, campaign: camp, adset: '',
                   amount: Math.round(amt * 100) / 100, results: msg, note: 'Facebook', created_by: 'facebook', created_at: now, source: 'fb' });
      sum.spendDays++;
    });
    spend.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    rewriteTable_('Spend', spend);

    // ---- 5.1) ประสิทธิภาพรายโฆษณา (คนเห็น/คลิก/แชท) ----
    if (adIns) {
      var fa = tableOrEmpty_('FbAds').filter(function (x) { return String(x.date) < since; });
      adIns.forEach(function (r) {
        var camp = campName[r.campaign_id];
        if (!camp) return;
        var msg = 0;
        (r.actions || []).forEach(function (a) { if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') msg = Number(a.value) || 0; });
        if (!(Number(r.spend) > 0) && !(Number(r.impressions) > 0)) return;
        fa.push({ date: r.date_start, campaign: camp, adset: r.adset_name || '', ad: r.ad_name || '', spend: Math.round((Number(r.spend) || 0) * 100) / 100,
                  impressions: Number(r.impressions) || 0, reach: Number(r.reach) || 0, clicks: Number(r.clicks) || 0, chats: msg, link_clicks: Number(r.inline_link_clicks) || 0 });
      });
      fa.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      rewriteTable_('FbAds', fa);
    }

    // ---- 5.2) ค่า Ads รายชั่วโมง ----
    if (hrIns) {
      var keep = addDays_(today, -120);
      var hr = tableOrEmpty_('FbHourly').filter(function (x) { var d = String(x.date); return d < hrSince && d >= keep; });
      hrIns.forEach(function (r) {
        var camp = campName[r.campaign_id];
        if (!camp) return;
        var amt = Number(r.spend) || 0, msg = 0;
        (r.actions || []).forEach(function (a) { if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') msg = Number(a.value) || 0; });
        if (!amt && !msg) return;
        hr.push({ date: r.date_start, hour: parseInt(String(r.hourly_stats_aggregated_by_advertiser_time_zone || '0'), 10) || 0, campaign: camp, adset: r.adset_name || '',
                  spend: Math.round(amt * 100) / 100, chats: msg });
      });
      hr.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.hour - b.hour; });
      rewriteTable_('FbHourly', hr);
      sum.hourlyRows = hr.length;
    }

    // ---- 6) รอบการยิง: งบ/วันที่ตั้งใน Facebook ตอนนี้ ----
    var budgets = readTable_('Budgets'), yest = addDays_(today, -1);
    function level(camp, adset, active, amount, fbId) {
      var rows = budgets.filter(function (b) { return b.campaign === camp && (b.adset || '') === adset && Number(b.daily_budget) > 0; })
        .sort(function (a, b) { return a.start_date < b.start_date ? -1 : 1; });
      var last = rows[rows.length - 1];
      var open = last && last.start_date <= today && (!last.end_date || last.end_date >= today) ? last : null;
      if (active && amount > 0) {
        if (open && Number(open.daily_budget) === amount) return;
        if (open) {
          if (open.start_date === today) { open.daily_budget = amount; sum.budgetChanges++; return; }
          open.end_date = yest;
        }
        var start = !rows.length ? (firstSpend[fbId] || today) : today;
        budgets.push({ id: newId_('Budgets'), campaign: camp, adset: adset, start_date: start, end_date: '', daily_budget: amount,
          note: open ? 'ปรับงบใน Facebook ' + open.daily_budget + ' → ' + amount : rows.length ? 'เปิดยิงใน Facebook' : 'เริ่มยิง (ดึงจาก Facebook)',
          created_by: 'facebook', created_at: now });
        sum.budgetChanges++;
      } else if (!active && open) {
        var end = lastSpend[fbId] && lastSpend[fbId] >= open.start_date ? lastSpend[fbId] : yest;
        open.end_date = end < open.start_date ? open.start_date : end;
        open.note = (open.note ? open.note + ' · ' : '') + 'หยุดใน Facebook';
        sum.budgetChanges++;
      }
    }
    fbCamps.forEach(function (fc) {
      var camp = campName[fc.id];
      if (!camp) return;
      var campActive = fc.effective_status === 'ACTIVE';
      if (Number(fc.daily_budget) > 0) { level(camp, '', campActive, Number(fc.daily_budget) / 100, fc.id); return; }
      fbSets.filter(function (fs) { return fs.campaign_id === fc.id && Number(fs.daily_budget) > 0; }).forEach(function (fs) {
        level(camp, fs.name, campActive && fs.effective_status === 'ACTIVE', Number(fs.daily_budget) / 100, fc.id);
      });
    });
    rewriteTable_('Budgets', budgets);
  } finally {
    lock.releaseLock();
  }

  setConfig_('fb_synced_until', today);
  if (hrIns) setConfig_('fb_hourly_until', today);
  setConfig_('fb_hourly_error', sum_hrError);

  // ---- 7) แชทลูกค้าจาก Inbox ของเพจ (แยกส่วน — ถ้าพังจะไม่กระทบค่า Ads) ----
  try {
    var ib = syncInbox_(t0, user);
    sum.inboxNew = ib.added; sum.inboxAuto = ib.auto; sum.inboxDone = ib.finished;
    setConfig_('fb_inbox_error', '');
  } catch (e) {
    sum.inboxError = String(e && e.message || e);
    setConfig_('fb_inbox_error', sum.inboxError);
  }
  // ---- 8) ชีตภายนอก: Google Ads (METRICS) + รับซื้อ (Orders) — อ่านอย่างเดียว ----
  try { sum.gads = syncGAds_(); setConfig_('gads_error', ''); } catch (e) { sum.gadsError = String(e.message || e); setConfig_('gads_error', sum.gadsError); }
  try { sum.purchases = syncPurchases_(); setConfig_('purchase_error', ''); } catch (e) { sum.purchaseError = String(e.message || e); setConfig_('purchase_error', sum.purchaseError); }
  try { sum.estimates = syncEstimates_(); setConfig_('estimate_error', ''); } catch (e) { sum.estimateError = String(e.message || e); setConfig_('estimate_error', sum.estimateError); }
  setConfig_('fb_last_sync', new Date().toISOString());
  setConfig_('fb_last_result', JSON.stringify(sum));
  log_(user, 'syncFacebook', 'Spend', '', sum);
  return sum;
}

// ============================================================
// Inbox เพจ → รายชื่อลูกค้าที่ทักมา
// ============================================================
function tableOrEmpty_(name) { try { return readTable_(name); } catch (e) { return []; } }
function readConfig_() { var c = {}; readTable_('Config').forEach(function (r) { c[r.key] = r.value; }); return c; }
function normName_(s) { return String(s || '').toLowerCase().replace(/[\s'’"`.]+/g, ''); }
function daysBetween_(a, b) { return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000); }
function fetchJson_(url) {
  var body = JSON.parse(UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText() || '{}');
  if (body.error) throw new Error('Facebook: ' + (body.error.message || 'error') + ' (code ' + body.error.code + ')');
  return body;
}
function fbPage_() {
  var pages = fbGetAll_('me/accounts', { fields: 'id,name,access_token', limit: 50 });
  if (!pages.length) throw new Error('โทเคนยังเข้าเพจไม่ได้ — มอบเพจ Bigcat ให้ System User แล้วสร้างโทเคนใหม่ที่ติ๊ก pages_show_list, pages_messaging, pages_read_engagement');
  var p = FB_PAGE_ID ? pages.filter(function (x) { return x.id === FB_PAGE_ID; })[0] : pages.length === 1 ? pages[0] : null;
  if (!p) throw new Error('โทเคนเห็นหลายเพจ: ' + pages.map(function (x) { return x.name + ' (' + x.id + ')'; }).join(', ') + ' — ใส่ ID เพจ Bigcat ที่ FB_PAGE_ID ใน Code.gs');
  return p;
}

function syncInbox_(t0, user) {
  var page = fbPage_();
  var cfg = readConfig_(), today = today_(), now = new Date().toISOString();
  if (cfg.page_id !== page.id) setConfig_('page_id', page.id);
  if (cfg.page_name !== page.name) setConfig_('page_name', page.name);
  var resume = cfg.fb_inbox_after || '';
  var since = cfg.fb_inbox_until ? addDays_(normDate_(cfg.fb_inbox_until) || today, -1) : FB_INBOX_SINCE;
  if (since < FB_INBOX_SINCE) since = FB_INBOX_SINCE;
  if (!resume) setConfig_('fb_inbox_walk_start', today);

  // ---- ดึงรายการแชท (ใหม่ → เก่า) จนถึงวันที่ since หรือหมดเวลา ----
  var fields = 'participants,updated_time,messages.limit(20){created_time,from,message}';
  var url = FB_API + page.id + '/conversations?platform=messenger&limit=40&fields=' + encodeURIComponent(fields) +
            (resume ? '&after=' + encodeURIComponent(resume) : '') + '&access_token=' + encodeURIComponent(page.access_token);
  var convs = [], reachedEnd = false, cursor = resume;
  while (url) {
    if (Date.now() - t0 > 270000) break; // เผื่อเวลา — รอบหน้าดึงต่อจากจุดนี้
    var body = fetchJson_(url);
    Utilities.sleep(400);
    var stop = false;
    (body.data || []).forEach(function (c) { if (fbDate_(c.updated_time) < since) stop = true; else convs.push(c); });
    cursor = body.paging && body.paging.cursors ? body.paging.cursors.after : '';
    url = !stop && body.paging && body.paging.next ? body.paging.next : null;
    if (!url) reachedEnd = true;
  }

  // ---- โฆษณาที่ได้แชทในแต่ละวัน (ใช้เดาว่าลูกค้ามาจากโฆษณาไหน) ----
  var adsRows = readTable_('Ads'), adByFb = {};
  adsRows.forEach(function (a) { if (a.fb_id) adByFb[String(a.fb_id)] = a; });

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var added = 0, auto = 0;
  try {
    var inbox = readTable_('Inbox'), chats = readTable_('Chats');
    var byPsid = {}, chatByPsid = {}, chatsChanged = false;
    inbox.forEach(function (r) { byPsid[String(r.psid)] = r; });
    chats.forEach(function (c) { if (c.psid) chatByPsid[String(c.psid)] = c; });
    var fresh = [];
    convs.forEach(function (c) {
      var cust = ((c.participants && c.participants.data) || []).filter(function (p) { return p.id !== page.id; })[0];
      if (!cust) return;
      var all = (c.messages && c.messages.data) || [];
      var mine = all.filter(function (m) { return m.from && m.from.id === cust.id; })
        .sort(function (a, b) { return a.created_time < b.created_time ? -1 : 1; });
      if (!mine.length) return; // เพจส่งหาอย่างเดียว ลูกค้ายังไม่ตอบ
      var fd = fbDate_(mine[0].created_time), ld = fbDate_(mine[mine.length - 1].created_time);
      if (fd < FB_INBOX_SINCE && !byPsid[cust.id]) return; // ลูกค้าเก่าก่อนวันเริ่มเก็บ
      var approx = all.length >= 20; // คุยยาว — Facebook ให้ดูแค่ 20 ข้อความล่าสุด วันที่ทักแรกอาจเก่ากว่านี้
      var row = byPsid[cust.id];
      if (row) {
        if (ld > row.last_date) row.last_date = ld;
        row.updated_at = now;
        return;
      }
      if (chatByPsid[cust.id]) return;
      // แชทที่แอดมินเคยกรอกเองชื่อเดียวกัน (±7 วัน) → ผูกกัน ไม่สร้างซ้ำ
      var nm = normName_(cust.name);
      var hit = chats.filter(function (ch) { return !ch.psid && normName_(ch.customer) === nm && Math.abs(daysBetween_(ch.date, fd)) <= 7; })[0];
      row = { psid: cust.id, name: cust.name, pic: '', first_date: fd, last_date: ld, first_text: String(mine[0].message || '').slice(0, 120),
              status: hit ? 'ad' : 'pending', suggest: '', chat_id: hit ? hit.id : '', updated_at: now, approx: approx ? 'TRUE' : '' };
      if (hit) { hit.psid = cust.id; chatByPsid[cust.id] = hit; chatsChanged = true; }
      inbox.push(row); byPsid[cust.id] = row;
      if (!hit) { fresh.push(row); added++; }
    });

    // ---- ไม่จับคู่แคมเปญอัตโนมัติ (แอดมินเลือกเองตอนบันทึก) ----
    // ล้างแชทที่เวอร์ชันก่อนสร้างให้อัตโนมัติ (ที่ยังไม่มีใครแก้) → กลับไปเป็นรายชื่อรอบันทึก
    var autoIds = {};
    chats = chats.filter(function (c) {
      if (c.review === 'auto' && c.created_by === 'facebook') { autoIds[c.id] = true; delete chatByPsid[String(c.psid)]; chatsChanged = true; return false; }
      return true;
    });
    inbox.forEach(function (r) { if (autoIds[r.chat_id]) { r.status = 'pending'; r.chat_id = ''; } });
    // คนที่ทักก่อนวันเริ่มเก็บ ไม่ต้องเก็บ
    inbox = inbox.filter(function (r) { return !r.first_date || r.first_date >= FB_INBOX_SINCE || r.status === 'ad'; });

    // ---- รูปโปรไฟล์ (ถ้า Facebook อนุญาต) — ทีละน้อย เว้นจังหวะ กัน Google จำกัดความถี่ ----
    if (cfg.fb_pic_off !== today) {
      try {
        var need = inbox.filter(function (r) { return r.status !== 'other' && !r.pic && r.last_date >= addDays_(today, -14); }).slice(-40);
        var denied = 0, got = 0;
        for (var i = 0; i < need.length; i += 5) {
          if (Date.now() - t0 > 300000) break;
          var batch = need.slice(i, i + 5);
          var res;
          try {
            res = UrlFetchApp.fetchAll(batch.map(function (r) {
              return { url: FB_API + r.psid + '?fields=profile_pic&access_token=' + encodeURIComponent(page.access_token), muteHttpExceptions: true };
            }));
          } catch (e) { Utilities.sleep(2000); continue; } // ถูกจำกัดความถี่ → ข้ามรอบนี้ ไว้ดึงรอบหน้า
          res.forEach(function (rs, k) {
            var b = {}; try { b = JSON.parse(rs.getContentText() || '{}'); } catch (e) {}
            if (b.error) { denied++; return; }
            if (b.profile_pic) {
              got++;
              batch[k].pic = b.profile_pic;
              var ch = chatByPsid[batch[k].psid];
              if (ch && ch.pic !== b.profile_pic) { ch.pic = b.profile_pic; chatsChanged = true; }
            }
          });
          if (denied && !got) { setConfig_('fb_pic_off', today); break; }
          Utilities.sleep(1200);
        }
      } catch (e) { /* รูปไม่ใช่ข้อมูลสำคัญ — พังก็ไม่กระทบรายชื่อ */ }
    }

    inbox.sort(function (a, b) { return a.first_date < b.first_date ? -1 : a.first_date > b.first_date ? 1 : 0; });
    rewriteTable_('Inbox', inbox);
    if (chatsChanged) rewriteTable_('Chats', chats);
  } finally {
    lock.releaseLock();
  }

  if (reachedEnd) {
    setConfig_('fb_inbox_until', readConfig_().fb_inbox_walk_start || today);
    setConfig_('fb_inbox_after', '');
  } else {
    setConfig_('fb_inbox_after', cursor || '');
  }
  return { added: added, auto: auto, finished: reachedEnd };
}

/** แอดมินคัดแยกคนที่ทักมา: เลือกโฆษณา → เป็นแชท · ไม่ใช่โฆษณา → other · ย้อนกลับ → pending */
function inboxDecide_(req, user) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var inbox = readTable_('Inbox');
    var row = inbox.filter(function (r) { return String(r.psid) === String(req.psid); })[0];
    if (!row) throw new Error('ไม่พบรายชื่อนี้');
    var chat = null, now = new Date().toISOString();
    if (req.ad && row.status === 'ad') return { inbox: row, chat: null }; // เป็นแชทอยู่แล้ว ไม่สร้างซ้ำ
    if (req.ad) {
      var ad = readTable_('Ads').filter(function (a) { return a.ad_name === req.ad; })[0] || {};
      chat = { id: newId_('Chats'), date: row.first_date, customer: row.name, ad: req.ad, adset: ad.adset || '', campaign: ad.campaign || '',
               status: req.status || '1-ทักแล้วเงียบ', product: '', amount: '', note: '', created_by: user, created_at: now, updated_by: '', updated_at: '',
               closed_date: '', closed_by: '', psid: row.psid, pic: row.pic, source: 'fb', review: '' };
      appendObjects_('Chats', [chat]);
      row.status = 'ad'; row.chat_id = chat.id;
    } else if (req.other) row.status = 'other';
    else row.status = 'pending';
    row.updated_at = now;
    rewriteTable_('Inbox', inbox);
    log_(user, 'inboxDecide', 'Inbox', row.psid, { status: row.status, ad: req.ad || '' });
    return { inbox: row, chat: chat };
  } finally {
    lock.releaseLock();
  }
}
function setConfig_(key, value) {
  var sh = sheet_('Config'), rows = readTable_('Config'), idx = -1;
  rows.forEach(function (r, i) { if (r.key === key) idx = i; });
  var rowNo = idx < 0 ? sh.getLastRow() + 1 : idx + 2;
  sh.getRange(rowNo, 1).setValue(key);
  sh.getRange(rowNo, 2).setNumberFormat('@').setValue(String(value)); // เก็บเป็นข้อความ กันชีตแปลงเป็นวันที่
}


// ============================================================
// ชีตภายนอก — อ่านอย่างเดียว แล้วคัดลอกมาเก็บในชีตของเรา
// ============================================================
function num_(v) { var n = Number(String(v == null ? '' : v).replace(/[,฿\s%]/g, '')); return isNaN(n) ? 0 : n; }
function headerIndex_(head) { var m = {}; head.forEach(function (h, i) { m[String(h).trim()] = i; }); return m; }
function syncExternal() { Logger.log(JSON.stringify({ gads: syncGAds_(), purchases: syncPurchases_(), estimates: syncEstimates_() })); }

function syncGAds_() {
  if (!METRICS_SHEET_ID) return 0;
  var sh = SpreadsheetApp.openById(METRICS_SHEET_ID).getSheetByName('METRICS');
  if (!sh) throw new Error('ไม่พบแท็บ METRICS');
  var v = sh.getDataRange().getDisplayValues();
  var h = headerIndex_(v[0]), out = [];
  ['date', 'campaign', 'cost', 'conversions'].forEach(function (k) { if (h[k] == null) throw new Error('แท็บ METRICS ไม่มีคอลัมน์ ' + k); });
  for (var i = 1; i < v.length; i++) {
    var r = v[i], d = normDate_(r[h.date]);
    if (!d || !r[h.campaign]) continue;
    out.push({ date: d, campaign: String(r[h.campaign]).trim(), cost: num_(r[h.cost]), conversions: num_(r[h.conversions]),
               impressions: h.impressions != null ? num_(r[h.impressions]) : 0, clicks: h.clicks != null ? num_(r[h.clicks]) : 0 });
  }
  // ซ้ำ (วันเดียวกัน+แคมเปญเดียวกัน) → ใช้แถวล่าสุด
  var map = {};
  out.forEach(function (r) { map[r.date + '|' + r.campaign] = r; });
  out = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { rewriteTable_('GAds', out); } finally { lock.releaseLock(); }
  return out.length;
}

var MONTH_EN_ = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function buyDate_(s) {
  var m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(String(s).trim());
  if (m && MONTH_EN_[m[2].toLowerCase()]) return m[3] + '-' + pad_(MONTH_EN_[m[2].toLowerCase()]) + '-' + pad_(Number(m[1]));
  return normDate_(s);
}
function syncPurchases_() {
  if (!PURCHASE_SHEET_ID) return 0;
  var ss = SpreadsheetApp.openById(PURCHASE_SHEET_ID), out = [], now = new Date().toISOString();
  ss.getSheets().forEach(function (sh) {
    if (!/^Orders_\d{2}_\d{4}$/.test(sh.getName())) return;
    var v = sh.getDataRange().getDisplayValues();
    if (v.length < 2) return;
    var h = headerIndex_(v[0]);
    if (h.ProductID == null || h['หมวดหมู่'] == null) return;
    for (var i = 1; i < v.length; i++) {
      var r = v[i], id = String(r[h.ProductID] || '').trim();
      if (!id) continue;
      out.push({ product_id: id, buy_date: buyDate_(r[h.BuyDate]), seller: h['ชื่อคนขาย'] != null ? r[h['ชื่อคนขาย']] : '',
        category: String(r[h['หมวดหมู่']] || '').trim(), fb: h.FB != null ? String(r[h.FB] || '').trim() : '', line: h.LINE != null ? String(r[h.LINE] || '').trim() : '',
        bought: h.BoughtPrice != null ? num_(r[h.BoughtPrice]) : 0, repair: h.RepairCost != null ? num_(r[h.RepairCost]) : 0,
        sell: h.SellPrice != null ? num_(r[h.SellPrice]) : 0, detail: detailOf_(r, h), updated_at: now });
    }
  });
  var map = {};
  out.forEach(function (r) { map[r.product_id] = r; });
  out = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.buy_date < b.buy_date ? -1 : 1; });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { rewriteTable_('Purchases', out); } finally { lock.releaseLock(); }
  return out.length;
}

/** เคสประเมิน: แท็บ Estimations_MM_YYYY ของบริษัท (อ่านอย่างเดียว) · 1 แถว = 1 เคส ตาม EstimateID */
/** ชื่อรุ่นสินค้า (ตัดให้สั้น) — หน้าเว็บใช้เดาหมวดเมื่อบอทใส่หมวดผิด เช่น โน้ตบุ๊กเป็น "อื่นๆ" */
function detailOf_(r, h) {
  var cols = ['รายละเอียดสินค้า', 'ชื่อสินค้า', 'ProductName', 'Product', 'Model', 'รุ่น', 'Description'];
  for (var i = 0; i < cols.length; i++) if (h[cols[i]] != null) return String(r[h[cols[i]]] || '').replace(/\s+/g, ' ').trim().slice(0, 70);
  return '';
}
/** ส่งชื่อรุ่นไปหน้าเว็บเฉพาะแถวที่หมวดไม่ชัด (ลดขนาดข้อมูล) */
function needDetail_(cat) { return !/^(iphone|ipad|macbook|apple watch|airpods|apple accessories|game console|notebook gaming|notebook office|comset gaming|comset office)$/i.test(String(cat || '').trim()); }

function syncEstimates_() {
  if (!PURCHASE_SHEET_ID) return 0;
  var ss = SpreadsheetApp.openById(PURCHASE_SHEET_ID), out = [], now = new Date().toISOString();
  ss.getSheets().forEach(function (sh) {
    if (!/^Estimations_\d{2}_\d{4}$/.test(sh.getName())) return;
    var v = sh.getDataRange().getDisplayValues();
    if (v.length < 2) return;
    var h = headerIndex_(v[0]);
    if (h.EstimateID == null || h['หมวดหมู่'] == null) return;
    var dCol = h['วันที่ประเมิน'], tCol = h['เวลาโพสต์'];
    for (var i = 1; i < v.length; i++) {
      var r = v[i], id = String(r[h.EstimateID] || '').trim();
      if (!id) continue;
      var t = tCol != null ? String(r[tCol] || '') : '', hm = /(\d{1,2}):\d{2}/.exec(t);
      var d = dCol != null ? normDate_(r[dCol]) : '';
      if (!d && t) { var dm = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t); if (dm) d = dm[3] + '-' + pad_(Number(dm[2])) + '-' + pad_(Number(dm[1])); }
      if (!d) continue;
      out.push({ est_id: id, est_date: d, hour: hm ? Number(hm[1]) : '', category: String(r[h['หมวดหมู่']] || '').trim(),
        fb: h.FB != null ? String(r[h.FB] || '').trim() : '', line: h.LINE != null ? String(r[h.LINE] || '').trim() : '',
        status: h['สถานะ'] != null ? String(r[h['สถานะ']] || '').trim() : '', detail: detailOf_(r, h), updated_at: now });
    }
  });
  var map = {};
  out.forEach(function (r) { map[r.est_id] = r; });
  out = Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.est_date < b.est_date ? -1 : 1; });
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { rewriteTable_('Estimates', out); } finally { lock.releaseLock(); }
  return out.length;
}
