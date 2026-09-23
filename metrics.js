/**
 * metrics.js — สูตรคำนวณทั้งหมดของระบบ (ที่เดียว ใช้ทั้งหน้าเว็บและเทสต์)
 * ไม่มีการเรียกเซิร์ฟเวอร์ในไฟล์นี้ รับข้อมูลดิบเข้า → คืนตัวเลข
 *
 * วันที่ทุกตัวเป็นข้อความ 'YYYY-MM-DD' (เวลาไทย) — ไม่ใช้ Date object เก็บข้อมูล
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Metrics = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- วันที่ ----------
  function toDayNum(ymd) {
    const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 86400000);
  }
  function fromDayNum(n) {
    return new Date(n * 86400000).toISOString().slice(0, 10);
  }
  /** จำนวนวันแบบนับหัวนับท้าย: 2026-09-01..2026-09-01 = 1 */
  function daysInclusive(from, to) {
    return toDayNum(to) - toDayNum(from) + 1;
  }
  function inRange(ymd, from, to) {
    if (!ymd) return false;
    return ymd >= from && ymd <= to;
  }

  // ---------- ชื่อลูกค้า ----------
  /** ทำชื่อให้เทียบกันได้: ตัดช่องว่างซ้ำ ตัวอักษรล่องหน ตัวพิมพ์เล็ก */
  function customerKey(name) {
    return String(name || '')
      .normalize('NFC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * หาแชทเดิมของลูกค้าคนเดียวกัน (ใช้เตือนตอนบันทึก)
   * กติกา: ชื่อตรงกัน + แคมเปญเดียวกัน + ห่างกันไม่เกิน windowDays วัน
   */
  function findDuplicate(chats, { name, campaign_id, chat_date }, windowDays) {
    const key = customerKey(name);
    const d = toDayNum(chat_date);
    return chats.find(c =>
      !c.is_deleted &&
      c.customer_key === key &&
      c.campaign_id === campaign_id &&
      Math.abs(toDayNum(c.chat_date) - d) <= windowDays
    ) || null;
  }

  // ---------- สถานะ ----------
  function statusMap(statuses) {
    const m = {};
    statuses.forEach(s => { m[s.code] = s; });
    return m;
  }

  // ---------- คัดแชท ----------
  /**
   * แชทที่นับได้ในช่วงวันที่ (ตัดที่ลบแล้ว และแถวที่มาร์กว่าซ้ำ)
   * filter: { campaign_id?, adset_id?, ad_id? }
   */
  function countableChats(chats, from, to, filter) {
    filter = filter || {};
    return chats.filter(c =>
      !c.is_deleted &&
      !c.duplicate_of &&
      inRange(c.chat_date, from, to) &&
      (!filter.campaign_id || c.campaign_id === filter.campaign_id) &&
      (!filter.adset_id || c.adset_id === filter.adset_id) &&
      (!filter.ad_id || c.ad_id === filter.ad_id)
    );
  }

  // ---------- ค่าแอด ----------
  /**
   * ค่าแอดในช่วง [from,to] — ถ้ารายการงบคร่อมช่วง จะเฉลี่ยตามจำนวนวันที่ทับกัน
   * เช่น ใส่งบ 1–30 ก.ย. 9,000 บาท แล้วดู 1–10 ก.ย. → 3,000
   * คืน { total, byAdset: {adset_id: amount}, byCampaign: {...} }
   */
  function spendInRange(spendRows, from, to, filter) {
    filter = filter || {};
    const out = { total: 0, byAdset: {}, byCampaign: {} };
    const f = toDayNum(from), t = toDayNum(to);
    spendRows.forEach(s => {
      if (s.is_deleted) return;
      if (filter.campaign_id && s.campaign_id !== filter.campaign_id) return;
      if (filter.adset_id && s.adset_id !== filter.adset_id) return;
      const a = toDayNum(s.date_from), b = toDayNum(s.date_to);
      const lo = Math.max(a, f), hi = Math.min(b, t);
      if (hi < lo) return;
      const part = Number(s.amount || 0) * (hi - lo + 1) / (b - a + 1);
      out.total += part;
      out.byAdset[s.adset_id] = (out.byAdset[s.adset_id] || 0) + part;
      out.byCampaign[s.campaign_id] = (out.byCampaign[s.campaign_id] || 0) + part;
    });
    return out;
  }

  // ---------- Funnel ----------
  const STAGES = [
    { stage: 1, label: 'ทักเข้ามา' },
    { stage: 2, label: 'มีข้อมูลเครื่อง' },
    { stage: 3, label: 'ประเมินราคา' },
    { stage: 4, label: 'นัดรับของ' },
    { stage: 5, label: 'ปิดการขาย' },
  ];

  const LEAK_TEXT = {
    '1-2': 'ทักแล้วไม่ส่งข้อมูลเครื่อง = คนที่โฆษณาดึงมายังไม่ตรง → ดูที่ข้อความโฆษณา/กลุ่มเป้าหมาย',
    '2-3': 'ได้ข้อมูลแล้วแต่ยังไม่ได้ประเมิน = ตอบช้า/ตามไม่ทัน → ดูที่แอดมิน',
    '3-4': 'ประเมินราคาแล้วไม่นัด = ปัญหาที่ราคา ไม่ใช่โฆษณา',
    '4-5': 'นัดแล้วไม่ได้ของ = ปัญหาขั้นนัดรับ/รับของ',
  };

  /** แชทที่อยู่ใน funnel รับซื้อ (ตัด 6-ขอซื้อสินค้า, 7-สินค้าไม่รับซื้อ ตามตั้งค่า in_funnel) */
  function funnelChats(chats, sMap) {
    return chats.filter(c => sMap[c.status] && sMap[c.status].in_funnel);
  }

  /**
   * นับแต่ละขั้นแบบ "ไปถึงขั้นนี้แล้ว" (stage ของสถานะ >= ขั้น)
   * minLeads: ต่ำกว่านี้ไม่ชี้จุดรั่ว (ข้อมูลน้อยเกินไป)
   */
  function funnel(chats, sMap, minLeads) {
    minLeads = minLeads == null ? 10 : minLeads;
    const fc = funnelChats(chats, sMap);
    const first = fc.length;
    const rows = STAGES.map(s => {
      const count = fc.filter(c => sMap[c.status].stage >= s.stage).length;
      return { stage: s.stage, label: s.label, count, pct: first ? count / first : 0 };
    });
    let leak = null;
    if (first >= minLeads) {
      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1].count;
        const rate = prev ? rows[i].count / prev : 0;
        if (prev && (!leak || rate < leak.rate)) {
          const key = rows[i - 1].stage + '-' + rows[i].stage;
          leak = { from: rows[i - 1].stage, to: rows[i].stage, rate, text: LEAK_TEXT[key] };
        }
      }
    }
    return { leads: first, rows, leak };
  }

  /** จำนวนตามป้ายสถานะ (รวมที่อยู่นอก funnel ด้วย) */
  function statusBreakdown(chats, statuses) {
    const total = chats.length;
    return statuses
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .map(s => {
        const count = chats.filter(c => c.status === s.code).length;
        return { code: s.code, label: s.label, count, pct: total ? count / total : 0 };
      });
  }

  function isWon(c, sMap) { return !!(sMap[c.status] && sMap[c.status].is_won); }

  // ---------- ตารางราย Ad set ----------
  /**
   * คอลัมน์: ใช้จ่าย · Lead · ต้นทุน/Lead · ปิดได้ · ยอดรับซื้อ · ต้นทุน/เคส · %ค่าแอด/ยอดรับซื้อ · ควรทำอะไร
   * settings.target_cost_per_won: เป้าต้นทุนต่อเคส (บาท) ใช้ตัดสิน "ควรทำอะไร"
   */
  function adsetTable(chats, spendRows, adsets, sMap, from, to, settings) {
    settings = settings || {};
    const target = Number(settings.target_cost_per_won || 0);
    const minSpendToJudge = Number(settings.min_spend_to_judge || 1000);
    const sp = spendInRange(spendRows, from, to);
    const rows = adsets.map(as => {
      const cs = funnelChats(chats.filter(c => c.adset_id === as.adset_id), sMap);
      const won = cs.filter(c => isWon(c, sMap));
      const spend = sp.byAdset[as.adset_id] || 0;
      const buy = won.reduce((t, c) => t + Number(c.buy_amount || 0), 0);
      return finishRow({
        adset_id: as.adset_id, name: as.name, campaign_id: as.campaign_id,
        spend, leads: cs.length, won: won.length, buy_amount: buy,
      }, target, minSpendToJudge);
    }).filter(r => r.spend > 0 || r.leads > 0);
    const total = finishRow(rows.reduce((t, r) => ({
      name: 'รวม', spend: t.spend + r.spend, leads: t.leads + r.leads,
      won: t.won + r.won, buy_amount: t.buy_amount + r.buy_amount,
    }), { name: 'รวม', spend: 0, leads: 0, won: 0, buy_amount: 0 }), 0, Infinity);
    delete total.advice;
    return { rows, total };
  }

  function finishRow(r, target, minSpendToJudge) {
    r.cost_per_lead = r.leads ? r.spend / r.leads : null;
    r.cost_per_won = r.won ? r.spend / r.won : null;
    r.ads_pct_of_buy = r.buy_amount ? r.spend / r.buy_amount : null;
    r.advice = advise(r, target, minSpendToJudge);
    return r;
  }

  function advise(r, target, minSpendToJudge) {
    if (!r.spend) return 'ยังไม่ใส่งบ';
    if (r.spend < minSpendToJudge) return 'ข้อมูลยังน้อย';
    if (!r.won) return r.leads ? 'มีแชทแต่ยังปิดไม่ได้ — ดูจุดรั่ว' : 'ไม่มีแชท — พิจารณาหยุด';
    if (!target) return 'ตั้งเป้าต้นทุน/เคสก่อน';
    if (r.cost_per_won <= target * 0.7) return 'คุ้ม — เพิ่มงบได้';
    if (r.cost_per_won <= target) return 'อยู่ในเป้า — ยิงต่อ';
    return 'เกินเป้า — ลดงบ/เปลี่ยนครีเอทีฟ';
  }

  // ---------- เทียบโฆษณาใน Ad set เดียวกัน ----------
  /** % คุณภาพ = สัดส่วนแชทที่ไปถึง "มีข้อมูลเครื่อง" (ขั้น 2) ขึ้นไป */
  function adQuality(chats, ads, sMap) {
    return ads.map(ad => {
      const cs = funnelChats(chats.filter(c => c.ad_id === ad.ad_id), sMap);
      const good = cs.filter(c => sMap[c.status].stage >= 2).length;
      const won = cs.filter(c => isWon(c, sMap)).length;
      return {
        ad_id: ad.ad_id, adset_id: ad.adset_id, name: ad.name,
        chats: cs.length, got_device: good, won,
        quality_pct: cs.length ? good / cs.length : null,
        result: cs.length ? null : 'ยังไม่มีแชท',
      };
    });
  }

  // ---------- สรุปแคมเปญ (รูปแบบที่ใช้ส่งทุกครั้ง) ----------
  /**
   * คืน 5 ส่วน: หัวเรื่อง · ภาพรวม · สถานะลูกค้า · เคสที่ปิดได้ · ผลตาม Ad set
   * today: 'YYYY-MM-DD' — ถ้าแคมเปญยังไม่จบ ใช้วันนี้เป็นวันสุดท้าย
   */
  function campaignReport(campaign, data, today, settings) {
    const { chats, spend, adsets, statuses } = data;
    const sMap = statusMap(statuses);
    const from = campaign.start_date;
    const to = campaign.end_date && campaign.end_date < today ? campaign.end_date : today;
    const days = Math.max(daysInclusive(from, to), 1);
    const cs = countableChats(chats, from, to, { campaign_id: campaign.campaign_id });
    const fc = funnelChats(cs, sMap);
    const won = fc.filter(c => isWon(c, sMap));
    const sp = spendInRange(spend, from, to, { campaign_id: campaign.campaign_id }).total;
    const buy = won.reduce((t, c) => t + Number(c.buy_amount || 0), 0);
    const myAdsets = adsets.filter(a => a.campaign_id === campaign.campaign_id);
    const adsetById = {};
    myAdsets.forEach(a => { adsetById[a.adset_id] = a; });

    return {
      header: {
        campaign: campaign.name, from, to, days,
        daily_budget: Number(campaign.daily_budget || 0) || null,
      },
      overview: {
        spend: sp,
        spend_per_day: sp / days,
        leads: fc.length,
        outside_funnel: cs.length - fc.length,
        won: won.length,
        buy_amount: buy,
        ads_pct_of_buy: buy ? sp / buy : null,
        cost_per_lead: fc.length ? sp / fc.length : null,
        cost_per_won: won.length ? sp / won.length : null,
      },
      statuses: statusBreakdown(cs, statuses),
      won_cases: won.map(c => ({
        customer: c.customer_name, product: c.product, buy_amount: Number(c.buy_amount || 0),
        adset: (adsetById[c.adset_id] || {}).name || c.adset_id,
      })).concat([{ customer: 'รวม', product: '', buy_amount: buy, adset: '' }]),
      by_adset: adsetTable(cs, spend, myAdsets, sMap, from, to, settings),
    };
  }

  // ---------- งานต้องตาม ----------
  /**
   * แชทที่ค้างอยู่ขั้น 2–4 และไม่ได้อัปเดตเกิน staleDays วัน
   * maxDays: ค้างนานเกินนี้ถือว่าลูกค้าหายไปแล้ว ไม่ขึ้นในรายการ (ไม่ใส่ = ไม่ตัด)
   */
  function staleChats(chats, sMap, today, staleDays, maxDays) {
    const t = toDayNum(today);
    return chats.filter(c => {
      const s = sMap[c.status];
      if (c.is_deleted || c.duplicate_of || !s || !s.in_funnel) return false;
      if (s.stage < 2 || s.stage > 4 || c.status === 'X') return false;
      const last = String(c.updated_at || c.chat_date).slice(0, 10);
      const age = t - toDayNum(last);
      return age > staleDays && (!maxDays || age <= maxDays);
    });
  }

  return {
    toDayNum, fromDayNum, daysInclusive, inRange,
    customerKey, findDuplicate, statusMap, countableChats,
    spendInRange, funnel, funnelChats, statusBreakdown,
    adsetTable, adQuality, campaignReport, staleChats, STAGES,
  };
});
