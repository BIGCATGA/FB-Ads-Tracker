/**
 * ui.js — ตัวช่วยหน้าจอ: escape, ตัวเลข, วันที่ไทย, ไอคอน, ป๊อปอัป, แจ้งเตือน
 */
(function () {
  'use strict';

  const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const TH_MONTH_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const TH_DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  // ไอคอนเส้น (path ในกรอบ 24x24)
  const ICONS = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8',
    wallet: 'M3 7h18v12H3zM3 11h18M7 15h3',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
    plus: 'M12 5v14M5 12h14',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    out: 'M7 17L17 7M9 7h8v8',
    drop: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',
    funnel: 'M3 4h18l-7 8v6l-4 2v-8z',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    x: 'M6 6l12 12M18 6L6 18',
    gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
    logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
    copy: 'M8 8h12v12H8zM4 16V4h12',
    history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  };

  function icon(name, size, color, width) {
    const d = ICONS[name] || '';
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="' +
      (color || 'currentColor') + '" stroke-width="' + (width || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function num(n, digits) {
    if (n === null || n === undefined || n === '' || !isFinite(n)) return '–';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
  }
  function pct(x, digits) {
    if (x === null || x === undefined || !isFinite(x)) return '–';
    return (x * 100).toFixed(digits === undefined ? 1 : digits) + '%';
  }

  // ---------- วันที่ (เวลาไทย) ----------
  function today() {
    const p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    return p.year + '-' + p.month + '-' + p.day;
  }
  function nowTime() {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  }
  function addDays(ymd, n) { return Metrics.fromDayNum(Metrics.toDayNum(ymd) + n); }
  function dow(ymd) { return (Metrics.toDayNum(ymd) + 4) % 7; } // 1970-01-01 = พฤหัส
  function dayOfMonth(ymd) { return Number(String(ymd).slice(8, 10)); }
  function thDate(ymd, withYear) {
    if (!ymd) return '–';
    const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
    return d + ' ' + TH_MONTH[m - 1] + (withYear ? ' ' + y : '');
  }
  function thMonth(ymd) {
    const [y, m] = String(ymd).split('-').map(Number);
    return TH_MONTH_FULL[m - 1] + ' ' + y;
  }
  function monthRange(ymd) {
    const [y, m] = String(ymd).split('-').map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const mm = ('0' + m).slice(-2);
    return { from: y + '-' + mm + '-01', to: y + '-' + mm + '-' + ('0' + last).slice(-2) };
  }
  function prevMonth(ymd) { return addDays(monthRange(ymd).from, -1); }
  function timeOf(ts) { return ts ? String(ts).slice(11, 16) : ''; }
  function daysAgo(ts, ref) { return Metrics.toDayNum(ref || today()) - Metrics.toDayNum(String(ts).slice(0, 10)); }

  // ---------- สีป้ายสถานะ ----------
  function hexToRgb(h) {
    const x = String(h || '#9e9e9e').replace('#', '');
    return [0, 2, 4].map(i => parseInt(x.substr(i, 2), 16));
  }
  function mix(rgb, target, t) { return rgb.map((c, i) => Math.round(c + (target[i] - c) * t)); }
  function rgbStr(rgb) { return 'rgb(' + rgb.join(',') + ')'; }
  function statusColors(s) {
    const rgb = hexToRgb(s && s.color);
    return { dot: rgbStr(rgb), bg: rgbStr(mix(rgb, [255, 255, 255], 0.84)), fg: rgbStr(mix(rgb, [0, 0, 0], 0.5)) };
  }
  function statusPill(s) {
    if (!s) return '<span class="status" style="background:#F2F1F6">?</span>';
    const c = statusColors(s);
    return '<span class="status" style="background:' + c.bg + ';color:' + c.fg + '">' + esc(s.label) + '</span>';
  }

  // ---------- แจ้งเตือน ----------
  function toast(msg, isErr) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), isErr ? 5000 : 2600);
  }

  // ---------- ป๊อปอัป ----------
  let lastFocus = null;
  let escHandler = null;
  /**
   * modal({ title, body (html), wide, onMount(el), actions: [{label, cls, act}] })
   * ปุ่มที่มี data-act ใน body/actions จะเรียก handlers[act](el, ev)
   */
  function modal(opts) {
    close();
    lastFocus = document.activeElement;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML =
      '<div class="modal' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<div class="modal-h"><h2 id="modal-title">' + esc(opts.title) + '</h2>' +
      '<button type="button" class="icon-btn sm" data-close aria-label="ปิด">' + icon('x', 18) + '</button></div>' +
      '<div class="modal-b">' + (opts.body || '') + '</div>' +
      (opts.footer ? '<div class="modal-f">' + opts.footer + '</div>' : '') +
      '</div>';
    document.body.appendChild(bg);
    document.body.style.overflow = 'hidden';
    bg.addEventListener('click', e => {
      if (e.target === bg || e.target.closest('[data-close]')) { close(); return; }
      const b = e.target.closest('[data-act]');
      if (b && opts.handlers && opts.handlers[b.dataset.act]) Promise.resolve(opts.handlers[b.dataset.act](bg.querySelector('.modal'), e, b)).catch(() => {});
    });
    escHandler = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', escHandler);
    const form = bg.querySelector('form');
    if (form && opts.onSubmit) form.addEventListener('submit', e => { e.preventDefault(); Promise.resolve(opts.onSubmit(bg.querySelector('.modal'), form)).catch(() => { /* busy แจ้งแล้ว */ }); });
    if (opts.onMount) opts.onMount(bg.querySelector('.modal'));
    const first = bg.querySelector('[autofocus]') || bg.querySelector('input, select, textarea, button:not([data-close])') || bg.querySelector('.modal');
    if (!first.matches('input, select, textarea, button')) first.setAttribute('tabindex', '-1');
    setTimeout(() => first.focus(), 30);
    return bg.querySelector('.modal');
  }
  function close() {
    if (escHandler) { document.removeEventListener('keydown', escHandler); escHandler = null; }
    const bg = document.querySelector('.modal-bg');
    if (bg) { bg.remove(); document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  }
  function confirmBox(title, text, okLabel) {
    return new Promise(resolve => {
      modal({
        title,
        body: '<p style="margin:0">' + esc(text) + '</p>',
        footer: '<button type="button" class="btn ghost" data-close>ยกเลิก</button><button type="button" class="btn dark" data-act="ok">' + esc(okLabel || 'ตกลง') + '</button>',
        handlers: { ok: () => { close(); resolve(true); } },
      });
      document.querySelector('.modal-bg').addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target.classList.contains('modal-bg')) resolve(false); });
    });
  }

  /** อ่านค่าฟอร์มเป็น object (ตามชื่อ name) */
  function formData(form) {
    const o = {};
    form.querySelectorAll('[name]').forEach(el => {
      if (el.type === 'checkbox') o[el.name] = el.checked;
      else o[el.name] = el.value.trim();
    });
    return o;
  }

  /** กันกดซ้ำระหว่างรอเซิร์ฟเวอร์ */
  async function busy(btn, fn) {
    if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = '<span class="spin" style="width:16px;height:16px;border-width:2px"></span>'; }
    try { return await fn(); }
    catch (e) { toast(e.message || String(e), true); throw e; }
    finally { if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = btn.dataset.label; } }
  }

  window.UI = {
    icon, esc, num, pct, today, nowTime, addDays, dow, dayOfMonth, thDate, thMonth, monthRange, prevMonth, timeOf, daysAgo,
    statusColors, statusPill, toast, modal, close, confirmBox, formData, busy, TH_DOW,
  };
})();
