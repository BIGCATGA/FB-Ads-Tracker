/**
 * store.js — ข้อมูลที่โหลดมาไว้ในเบราว์เซอร์ + คำสั่งที่เขียนกลับเซิร์ฟเวอร์
 * หน้าจอทุกหน้าอ่านจากที่นี่ เขียนผ่านที่นี่ แล้วเรียก App.render() ใหม่
 */
(function () {
  'use strict';

  const S = { data: null, loading: null };

  async function load() {
    S.data = await Api.call('bootstrap');
    return S.data;
  }

  function d() { return S.data; }
  function today() { return (S.data && S.data.today) || UI.today(); }
  function settings() {
    const s = (S.data && S.data.settings) || {};
    return {
      dup_window_days: Number(s.dup_window_days || 30),
      stale_days: Number(s.stale_days || 3),
      stale_max_days: Number(s.stale_max_days || 14),
      target_cost_per_won: Number(s.target_cost_per_won || 0),
      min_spend_to_judge: Number(s.min_spend_to_judge || 1000),
      chat_days_on_load: Number(s.chat_days_on_load || 120),
    };
  }
  function statuses() { return S.data.statuses.slice().sort((a, b) => a.sort - b.sort); }
  function sMap() { return Metrics.statusMap(S.data.statuses); }
  function status(code) { return sMap()[String(code)]; }
  function index(list, key) { const m = {}; list.forEach(x => { m[x[key]] = x; }); return m; }
  function campaigns() { return S.data.campaigns; }
  function adsets() { return S.data.adsets; }
  function ads() { return S.data.ads; }
  function campaign(id) { return index(S.data.campaigns, 'campaign_id')[id]; }
  function adset(id) { return index(S.data.adsets, 'adset_id')[id]; }
  function ad(id) { return index(S.data.ads, 'ad_id')[id]; }
  function chats() { return S.data.chats.filter(c => !c.is_deleted); }
  function spend() { return S.data.spend.filter(s => !s.is_deleted); }

  /** โฆษณาที่ยังเปิดอยู่ (ใช้ในหน้าบันทึกแชท) จัดกลุ่มตามแคมเปญ */
  function activeAdGroups() {
    return S.data.campaigns.filter(c => c.status !== 'ended').map(c => ({
      campaign: c,
      ads: S.data.ads.filter(a => a.campaign_id === c.campaign_id && a.status === 'active')
        .map(a => ({ ad: a, adset: adset(a.adset_id) })),
    })).filter(g => g.ads.length);
  }

  /** ชื่อที่แอดมินเห็นตอนเลือกโฆษณา */
  function adLabel(a) {
    const as = adset(a.adset_id);
    if (!as || as.name.indexOf(a.name) >= 0) return as ? as.name : a.name;
    return a.name + ' · ' + as.name;
  }

  /** ต้องการแชทก่อนวันที่โหลดไว้ → ขอเพิ่มจากเซิร์ฟเวอร์ */
  async function ensureFrom(from) {
    if (!S.data || from >= S.data.chats_from) return false;
    const older = await Api.call('listChats', { from, to: UI.addDays(S.data.chats_from, -1) });
    const have = {};
    S.data.chats.forEach(c => { have[c.chat_id] = true; });
    older.forEach(c => { if (!have[c.chat_id]) S.data.chats.push(c); });
    S.data.chats_from = from;
    return true;
  }

  function put(list, key, obj) {
    const i = list.findIndex(x => x[key] === obj[key]);
    if (i >= 0) list[i] = obj; else list.push(obj);
    return obj;
  }

  // ---------- เขียน ----------
  async function saveChat(chat, force) {
    const r = await Api.call('saveChat', { chat, force: !!force });
    if (r.chat) put(S.data.chats, 'chat_id', r.chat);
    return r;
  }
  async function setStatus(payload) {
    const r = await Api.call('setStatus', payload);
    put(S.data.chats, 'chat_id', r.chat);
    return r.chat;
  }
  async function deleteChat(id) {
    const r = await Api.call('deleteChat', { chat_id: id });
    put(S.data.chats, 'chat_id', r);
  }
  /** กด "ตามแล้ว" = บันทึกแชทเดิมซ้ำ เพื่อให้เวลาอัปเดตล่าสุดเป็นตอนนี้ */
  async function touchChat(c) {
    return saveChat({ chat_id: c.chat_id, customer_name: c.customer_name, ad_id: c.ad_id });
  }
  async function saveCampaign(o) { return put(S.data.campaigns, 'campaign_id', await Api.call('saveCampaign', o)); }
  async function saveAdset(o) { return put(S.data.adsets, 'adset_id', await Api.call('saveAdset', o)); }
  async function saveAd(o) { return put(S.data.ads, 'ad_id', await Api.call('saveAd', o)); }
  async function saveSpend(o) { return put(S.data.spend, 'spend_id', await Api.call('saveSpend', o)); }
  async function deleteSpend(id) { return put(S.data.spend, 'spend_id', await Api.call('deleteSpend', { spend_id: id })); }
  async function saveSetting(key, value) {
    const r = await Api.call('saveSetting', { key, value });
    S.data.settings[key] = r.value === undefined ? value : r.value;
  }
  function history(chat_id) { return Api.call('chatHistory', { chat_id }); }

  window.Store = {
    load, d, today, settings, statuses, sMap, status, campaigns, adsets, ads, campaign, adset, ad, chats, spend,
    activeAdGroups, adLabel, ensureFrom,
    saveChat, setStatus, deleteChat, touchChat, saveCampaign, saveAdset, saveAd, saveSpend, deleteSpend, saveSetting, history,
  };
})();
