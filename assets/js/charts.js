/**
 * Charts — SVG วาดเอง ไม่ใช้ไลบรารี
 * ทุกกราฟคืนค่าเป็น string ของ SVG; tooltip ใช้ attribute data-tip
 */
(function () {
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /** วงแหวน % */
  function ring(pct, color, opts) {
    opts = opts || {};
    var size = opts.size || 78, sw = opts.stroke || 7, r = (size - sw) / 2, c = 2 * Math.PI * r;
    var p = Math.max(0, Math.min(1, pct || 0));
    var label = opts.label != null ? opts.label : Math.round(p * 100) + '%';
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + esc(label) + '"' +
      (opts.tip ? ' data-tip="' + esc(opts.tip) + '"' : '') + '>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="' + sw + '"/>' +
      (p > 0 ? '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-linecap="round"' +
        ' stroke-dasharray="' + (c * p).toFixed(2) + ' ' + c.toFixed(2) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' : '') +
      '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="' + (opts.fontSize || 14) + '">' + esc(label) + '</text></svg>';
  }

  /** วงแหวนหลายช่วง (segments = [{value,color,label}]) */
  function segRing(segments, opts) {
    opts = opts || {};
    var size = opts.size || 96, sw = opts.stroke || 9, r = (size - sw) / 2, c = 2 * Math.PI * r;
    var total = segments.reduce(function (a, s) { return a + s.value; }, 0);
    var gap = total ? 4 : 0, off = 0, out = '';
    out += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="' + sw + '"/>';
    segments.forEach(function (s) {
      if (!s.value) return;
      var len = c * s.value / total;
      var draw = Math.max(0.5, len - gap);
      out += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="' + sw + '" stroke-linecap="round"' +
        ' stroke-dasharray="' + draw.toFixed(2) + ' ' + c.toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"' +
        ' data-tip="' + esc('<b>' + s.label + '</b><br>' + s.value + ' คน (' + Math.round(s.value / total * 100) + '%)') + '" style="cursor:default"/>';
      off += len;
    });
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + out +
      '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="' + (opts.fontSize || 16) + '">' + esc(opts.label || '') + '</text></svg>';
  }

  /** โดนัทใหญ่ (สถานะลูกค้า) */
  function donut(segments, opts) {
    opts = opts || {};
    var size = opts.size || 230, cx = size / 2, cy = size / 2, R = size / 2 - 4, r0 = R * 0.56;
    var total = segments.reduce(function (a, s) { return a + s.value; }, 0);
    var out = '', a0 = -Math.PI / 2;
    if (!total) {
      out = '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + r0) / 2 + '" fill="none" stroke="var(--line)" stroke-width="' + (R - r0) + '"/>';
    }
    segments.forEach(function (s) {
      if (!s.value) return;
      var a1 = a0 + 2 * Math.PI * s.value / total;
      var large = a1 - a0 > Math.PI ? 1 : 0;
      var path;
      if (s.value === total) {
        path = 'M' + cx + ' ' + (cy - R) + 'A' + R + ' ' + R + ' 0 1 1 ' + (cx - 0.01) + ' ' + (cy - R) + 'L' + (cx - 0.01) + ' ' + (cy - r0) + 'A' + r0 + ' ' + r0 + ' 0 1 0 ' + cx + ' ' + (cy - r0) + 'Z';
      } else {
        path = 'M' + (cx + R * Math.cos(a0)) + ' ' + (cy + R * Math.sin(a0)) +
          'A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + (cx + R * Math.cos(a1)) + ' ' + (cy + R * Math.sin(a1)) +
          'L' + (cx + r0 * Math.cos(a1)) + ' ' + (cy + r0 * Math.sin(a1)) +
          'A' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + (cx + r0 * Math.cos(a0)) + ' ' + (cy + r0 * Math.sin(a0)) + 'Z';
      }
      out += '<path d="' + path + '" fill="' + s.color + '" stroke="var(--card)" stroke-width="2" stroke-linejoin="round"' +
        ' data-tip="' + esc('<b>' + s.label + '</b><br>' + s.value + ' คน · ' + (s.value / total * 100).toFixed(1) + '%') + '"/>';
      a0 = a1;
    });
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r0 - 2) + '" fill="var(--card)"/>';
    out += '<text x="' + cx + '" y="' + (cy - 8) + '" text-anchor="middle" style="fill:var(--text);font-weight:600;font-size:26px">' + esc(opts.center || total) + '</text>';
    out += '<text x="' + cx + '" y="' + (cy + 18) + '" text-anchor="middle" style="fill:var(--text-3);font-size:12px">' + esc(opts.sub || '') + '</text>';
    return '<svg class="chart" viewBox="0 0 ' + size + ' ' + size + '" style="max-width:' + size + 'px;margin:auto" role="img" aria-label="สัดส่วนสถานะลูกค้า">' + out + '</svg>';
  }

  /** เส้นโค้งผ่านจุด (Catmull-Rom → Bezier) */
  function smooth(pts) {
    if (!pts.length) return '';
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /** คลื่นในการ์ดไล่สี (sparkline) */
  function wave(values) {
    var W = 300, H = 72, pad = 10;
    var vals = values.length > 1 ? values : [0, 0];
    // เฉลี่ยเคลื่อนที่ 3 จุด ให้เส้นนุ่ม
    vals = vals.map(function (v, i) { var a = vals[i - 1] != null ? vals[i - 1] : v, b = vals[i + 1] != null ? vals[i + 1] : v; return (a + v + b) / 3; });
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    var span = max - min || 1;
    var pts = vals.map(function (v, i) { return [i / (vals.length - 1) * W, pad + (1 - (v - min) / span) * (H - pad * 2 - 14) + 10]; });
    var line = smooth(pts);
    return '<svg class="wave" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + line + 'L' + W + ' ' + H + 'L0 ' + H + 'Z" fill="var(--primary)" fill-opacity=".08"/>' +
      '<path d="' + line + '" fill="none" stroke="var(--primary)" stroke-opacity=".7" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  }

  /** กราฟแท่งคู่ (series = [{key,label,color}]) ; rows = [{label, tipLabel, ...}] */
  function bars(rows, series, opts) {
    opts = opts || {};
    var W = opts.width || 640, H = opts.height || 230, L = 30, B = 26, T = 10;
    var max = 0;
    rows.forEach(function (r) { series.forEach(function (s) { max = Math.max(max, r[s.key] || 0); }); });
    var step = niceStep(max);
    var top = Math.max(step * Math.ceil(max / step), step);
    var plotW = W - L - 6, plotH = H - B - T;
    var gw = plotW / Math.max(rows.length, 1);
    var bw = Math.max(2, Math.min(10, (gw - 6) / series.length - 2));
    var out = '';
    for (var v = 0; v <= top + 1e-9; v += step) {
      var y = T + plotH - v / top * plotH;
      out += '<line class="grid-line" x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>';
      out += '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '</text>';
    }
    var every = Math.ceil(rows.length / (opts.maxLabels || 12));
    rows.forEach(function (r, i) {
      var gx = L + i * gw + gw / 2;
      var totalW = series.length * bw + (series.length - 1) * 3;
      var tip = '<b>' + esc(r.tipLabel || r.label) + '</b>' + series.map(function (s) {
        return '<div class="row"><span>' + esc(s.label) + '</span><b>' + (r[s.key] || 0) + '</b></div>';
      }).join('');
      out += '<rect x="' + (L + i * gw) + '" y="' + T + '" width="' + gw + '" height="' + plotH + '" fill="transparent" data-tip="' + esc(tip) + '"/>';
      series.forEach(function (s, k) {
        var val = r[s.key] || 0;
        if (!val) return;
        var h = Math.max(2, val / top * plotH);
        var x = gx - totalW / 2 + k * (bw + 3);
        var y = T + plotH - h;
        var rad = Math.min(4, bw / 2, h);
        out += '<path d="M' + x + ' ' + (T + plotH) + 'V' + (y + rad) + 'Q' + x + ' ' + y + ' ' + (x + rad) + ' ' + y + 'H' + (x + bw - rad) +
          'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + rad) + 'V' + (T + plotH) + 'Z" fill="' + s.color + '" pointer-events="none"/>';
      });
      if (i % every === 0) out += '<text x="' + gx + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(r.label) + '</text>';
    });
    out += '<line x1="' + L + '" x2="' + W + '" y1="' + (T + plotH) + '" y2="' + (T + plotH) + '" stroke="var(--line-strong)"/>';
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.aria || 'กราฟแท่ง') + '">' + out + '</svg>';
  }

  function niceStep(max) {
    if (max <= 5) return 1;
    var raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
  }

  // ---------- Tooltip ----------
  var tipEl = null;
  function bindTips() {
    if (tipEl) return;
    tipEl = document.createElement('div');
    tipEl.className = 'tip hidden';
    document.body.appendChild(tipEl);
    document.addEventListener('mousemove', function (e) {
      var t = e.target.closest ? e.target.closest('[data-tip]') : null;
      if (!t) { tipEl.classList.add('hidden'); return; }
      tipEl.innerHTML = t.getAttribute('data-tip');
      tipEl.classList.remove('hidden');
      var x = e.clientX + 14, y = e.clientY + 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
      if (y + h > window.innerHeight - 8) y = e.clientY - h - 14;
      tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
    });
    document.addEventListener('scroll', function () { tipEl.classList.add('hidden'); }, true);
  }

  /**
   * กราฟแท่งแนวตั้ง วาดตามความกว้างจริงของกล่อง (คมชัด ไม่ยืด)
   * opts = { labels:[], tips:[], series:[{name, color, values:[]}], height, fmt(v), showValues }
   */
  function columns(el, opts) {
    var W = Math.max(280, el.clientWidth), H = opts.height || 320;
    var L = opts.left || 64, R = 12, T = 18, B = 34;
    var series = opts.series, n = opts.labels.length;
    var fmt = opts.fmt || function (v) { return String(Math.round(v)); };
    var max = 0;
    series.forEach(function (s) { s.values.forEach(function (v) { if (v > max) max = v; }); });
    var step = niceStep(max), top = Math.max(step * Math.ceil(max / step), step);
    var maxLen = Math.max.apply(null, opts.labels.map(function (l) { return Math.max.apply(null, String(l).split('\n').map(function (x) { return x.length; })); }).concat([2]));
    var two = opts.labels.some(function (l) { return String(l).indexOf('\n') >= 0; });
    if (two) B += 18;
    var plotW = W - L - R, plotH = H - T - B, gw = plotW / Math.max(n, 1);
    var bw = Math.max(3, Math.min(34, (gw * 0.74) / series.length));
    var anim = !el.dataset.drawn && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    el.dataset.drawn = '1';
    var out = '';
    for (var v = 0; v <= top + 1e-9; v += step) {
      var y = T + plotH - v / top * plotH;
      out += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>';
      out += '<text class="ax" x="' + (L - 10) + '" y="' + (y + 4) + '" text-anchor="end">' + esc(fmt(v)) + '</text>';
    }
    var every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / Math.max(46, maxLen * 7.5 + 12)))));
    var showVals = (opts.showValues && n <= 16) || (opts.showValues !== false && bw >= 11 && n <= 45);
    for (var i = 0; i < n; i++) {
      var gx = L + i * gw, cx = gx + gw / 2, totalW = series.length * bw + (series.length - 1) * 4;
      var tip = '<b>' + esc(opts.tips ? opts.tips[i] : opts.labels[i]) + '</b>' + series.map(function (s) {
        return '<div class="row"><span><i class="tip-dot" style="background:' + s.color + '"></i>' + esc(s.name) + '</span><b>' + esc(fmt(s.values[i] || 0)) + '</b></div>';
      }).join('');
      out += '<rect class="hover-band" x="' + gx + '" y="' + T + '" width="' + gw + '" height="' + plotH + '" data-tip="' + esc(tip) + '"/>';
      series.forEach(function (s, k) {
        var val = s.values[i] || 0;
        if (!val) return;
        var h = Math.max(2, val / top * plotH), x = cx - totalW / 2 + k * (bw + 4), y = T + plotH - h, r = Math.min(5, bw / 2, h);
        out += '<path class="bar" style="--i:' + i + '" pointer-events="none" fill="' + s.color + '" d="M' + x + ' ' + (T + plotH) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (T + plotH) + 'Z"/>';
        if (showVals) out += '<text class="val" style="--i:' + i + '" x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle">' + esc(fmt(val)) + '</text>';
      });
      if (i % every === 0) {
        var ls = String(opts.labels[i]).split('\n');
        out += '<text class="ax" x="' + cx + '" y="' + (H - (ls.length > 1 ? 28 : 10)) + '" text-anchor="middle">' + ls.map(function (t, k) { return '<tspan x="' + cx + '" dy="' + (k ? 18 : 0) + '"' + (k ? ' class="ax2"' : '') + '>' + esc(t) + '</tspan>'; }).join('') + '</text>';
      }
    }
    if (opts.avg && opts.avg.value > 0 && opts.avg.value <= top) {
      var ay = T + plotH - opts.avg.value / top * plotH;
      out += '<line class="avg-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + ay + '" y2="' + ay + '" stroke="' + (opts.avg.color || 'var(--text-2)') + '"/>' +
        '<text class="avg-l" x="' + (W - R - 4) + '" y="' + (ay - 7) + '" text-anchor="end">' + esc(opts.avg.label) + '</text>';
    }
    out += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + plotH) + '" y2="' + (T + plotH) + '" stroke="var(--line-strong)"/>';
    el.innerHTML = '<svg class="chart big' + (anim ? ' anim' : '') + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.aria || '') + '">' + out + '</svg>';
  }

  /**
   * แถบแนวนอน (HTML) — อ่านง่าย ป้ายยาวได้
   * items = [{label, value, display, sub, color, tip}] · opts = { max, target, targetLabel }
   */
  function hbars(items, opts) {
    opts = opts || {};
    var max = opts.max || Math.max.apply(null, items.map(function (x) { return x.value || 0; }).concat([opts.target || 0, 1]));
    var tgt = opts.target ? '<i class="hb-target" style="left:' + (opts.target / max * 100) + '%" title="' + esc(opts.targetLabel || '') + '"></i>' : '';
    return '<div class="hbars">' + items.map(function (x) {
      var w = Math.max(x.value ? 1.5 : 0, (x.value || 0) / max * 100);
      return '<div class="hb"' + (x.tip ? ' data-tip="' + esc(x.tip) + '"' : '') + '><div class="hb-label">' + esc(x.label) + (x.sub ? '<span>' + esc(x.sub) + '</span>' : '') + '</div>' +
        '<div class="hb-track"><i style="width:' + w + '%;background:' + (x.color || 'var(--primary)') + '"></i>' + tgt + '</div>' +
        '<div class="hb-val">' + esc(x.display != null ? x.display : x.value) + '</div></div>';
    }).join('') + '</div>';
  }

  /**
   * ไทม์ไลน์แคมเปญ: แท่ง = Lead ต่อวัน (แกนซ้าย) · เส้นขั้นบันได = งบ/วันที่ตั้ง (แกนขวา) · เส้นประ = วันที่ปรับงบ
   * opts: { dates, leads, budget, marks:[{i,label}], tips, labels, height, aria }
   */
  function timeline(el, o) {
    var W = Math.max(280, el.clientWidth), H = o.height || 320, L = 46, R = 70, T = 34, B = 34;
    var n = o.dates.length, plotW = W - L - R, plotH = H - T - B, gw = plotW / Math.max(n, 1);
    var maxL = Math.max.apply(null, o.leads.concat([1])), sL = niceStep(maxL), topL = Math.max(sL * Math.ceil(maxL / sL), sL);
    var maxB = Math.max.apply(null, o.budget.concat([1])), sB = niceStep(maxB), topB = Math.max(sB * Math.ceil(maxB * 1.15 / sB), sB);
    var yL = function (v) { return T + plotH - v / topL * plotH; }, yB = function (v) { return T + plotH - v / topB * plotH; };
    var out = '';
    for (var v = 0; v <= topL + 1e-9; v += sL) out += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + yL(v) + '" y2="' + yL(v) + '"/><text class="ax" x="' + (L - 8) + '" y="' + (yL(v) + 4) + '" text-anchor="end">' + v + '</text>';
    for (var b = 0; b <= topB + 1e-9; b += sB) out += '<text class="ax" x="' + (W - R + 8) + '" y="' + (yB(b) + 4) + '" fill="var(--budget)">' + (b >= 1000 ? (b / 1000) + 'k' : b) + ' ฿</text>';
    var bw = Math.max(2, Math.min(22, gw * 0.62));
    var every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 44))));
    for (var i = 0; i < n; i++) {
      var gx = L + i * gw, cx = gx + gw / 2;
      out += '<rect class="hover-band" x="' + gx + '" y="' + T + '" width="' + gw + '" height="' + plotH + '" data-tip="' + esc(o.tips[i]) + '"/>';
      var lv = o.leads[i];
      if (lv) { var h = Math.max(2, lv / topL * plotH), x = cx - bw / 2, y = T + plotH - h, r = Math.min(4, bw / 2, h);
        out += '<path class="bar" style="--i:' + i + '" pointer-events="none" fill="var(--primary)" opacity=".85" d="M' + x + ' ' + (T + plotH) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (T + plotH) + 'Z"/>'; }
      if (i % every === 0) out += '<text class="ax" x="' + cx + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(o.labels[i]) + '</text>';
    }
    // เส้นงบ (ขาดช่วงวันที่หยุด)
    var path = '', on = false;
    for (var k = 0; k < n; k++) {
      var bv = o.budget[k], x0 = L + k * gw, x1 = x0 + gw;
      if (bv > 0) { path += (on ? 'L' + x0 + ' ' + yB(bv) : 'M' + x0 + ' ' + yB(bv)) + 'L' + x1 + ' ' + yB(bv); on = true; } else on = false;
    }
    out += '<path d="' + path + '" fill="none" stroke="var(--budget)" stroke-width="3" stroke-linejoin="round" pointer-events="none"/>';
    (o.marks || []).forEach(function (m, j) {
      var mx = L + m.i * gw;
      out += '<line x1="' + mx + '" x2="' + mx + '" y1="' + (T - 4) + '" y2="' + (T + plotH) + '" stroke="var(--text-3)" stroke-dasharray="4 4" pointer-events="none"/>';
      var anchor = mx > W - R - 60 ? 'end' : mx < L + 60 ? 'start' : 'middle';
      out += '<text class="mark-l" x="' + mx + '" y="' + (T - 12 - (j % 2) * 0) + '" text-anchor="' + anchor + '">' + esc(m.label) + '</text>';
    });
    out += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + plotH) + '" y2="' + (T + plotH) + '" stroke="var(--line-strong)"/>';
    var animT = !el.dataset.drawn; el.dataset.drawn = '1';
    el.innerHTML = '<svg class="chart big' + (animT ? ' anim' : '') + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || '') + '">' + out + '</svg>';
  }
  /** ตัวเลขวิ่งจาก 0 → ค่าจริง (การ์ดตัวเลข) */
  /** ตัวเลขวิ่ง: .kpi-v/.facts b/... และทุก [data-n] (รองรับหลายตัวเลขในกล่องเดียว) */
  function countUp(root) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var nodes = [];
    Array.prototype.forEach.call((root || document).querySelectorAll('.kpi-v, .facts b, .cc2-stats b, .xp-v, [data-n]'), function (el) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) if (/\d/.test(n.nodeValue) && nodes.indexOf(n) < 0) nodes.push(n);
    });
    nodes.forEach(function (node) {
      var m = /^([^\d]*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(node.nodeValue);
      if (!m) return;
      var target = Number(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, comma = m[2].indexOf(',') >= 0 || target >= 1000;
      if (!(target > 0)) return;
      var t0 = null, dur = 1000;
      function fmt(v) { var s2 = v.toFixed(dec); return comma ? Number(s2).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : s2; }
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        node.nodeValue = m[1] + fmt(target * e) + m[3];
        if (p < 1) requestAnimationFrame(step);
      }
      node.nodeValue = m[1] + fmt(0) + m[3];
      requestAnimationFrame(step);
    });
  }
  /** กราฟจิ๋วในการ์ดแคมเปญ: แท่ง Lead รายวัน + เส้นงบ (ไม่ต้องวาดใหม่ตอนย่อจอ) */
  function spark(leads, budget) {
    var n = leads.length, W = 100, H = 36, gw = W / Math.max(n, 1);
    var mL = Math.max.apply(null, leads.concat([1])), mB = Math.max.apply(null, budget.concat([1])) * 1.15;
    var out = '';
    leads.forEach(function (v, i) { if (v) { var h = Math.max(1.5, v / mL * (H - 4)); out += '<rect x="' + (i * gw + gw * 0.18) + '" y="' + (H - h) + '" width="' + (gw * 0.64) + '" height="' + h + '" rx="0.6" fill="var(--primary)" opacity=".8"/>'; } });
    var path = '', on = false;
    budget.forEach(function (v, i) { if (v > 0) { var y = H - v / mB * (H - 4); path += (on ? 'L' : 'M') + (i * gw) + ' ' + y + 'L' + ((i + 1) * gw) + ' ' + y; on = true; } else on = false; });
    out += '<path d="' + path + '" fill="none" stroke="var(--budget)" stroke-width="1.6" vector-effect="non-scaling-stroke"/>';
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + out + '</svg>';
  }

  /**
   * กราฟเส้น: opts { labels, tips, series:[{name,values,color,width,dash,area,dots}], target:{value,label}, fmt, height, marks:[{i,label}] }
   * ชี้เมาส์ = ดูค่าทุกเส้นของวันนั้น
   */
  function line(el, o) {
    var W = Math.max(280, el.clientWidth), H = o.height || 300, L = 58, R = 16, T = 26, B = 30, pw = W - L - R, ph = H - T - B, n = o.labels.length;
    var fmt = o.fmt || function (v) { return String(Math.round(v)); };
    var vals = [];
    o.series.forEach(function (s) { s.values.forEach(function (v) { if (v != null && isFinite(v)) vals.push(v); }); });
    if (o.target && o.target.value != null) vals.push(o.target.value);
    var max = (Math.max.apply(null, vals.concat([0])) || 1) * 1.12, step = niceStep(max), top = Math.max(step * Math.ceil(max / step), step);
    function x(i) { return L + (n <= 1 ? pw / 2 : i / (n - 1) * pw); }
    function y(v) { return T + ph - v / top * ph; }
    var out = '<defs><linearGradient id="lg' + el.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--primary)" stop-opacity=".26"/><stop offset="1" stop-color="var(--primary)" stop-opacity="0"/></linearGradient></defs>';
    for (var v = 0; v <= top + 1e-9; v += step) out += '<line class="grid-line" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ax" x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + esc(fmt(v)) + '</text>';
    function path(vs) { var s = ''; vs.forEach(function (v, i) { if (v == null || !isFinite(v)) return; s += (s ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }); return s; }
    o.series.forEach(function (s) {
      var d = path(s.values);
      if (!d) return;
      if (s.area) { var fi = s.values.findIndex(function (v) { return v != null; }), li = s.values.length - 1; while (li > 0 && s.values[li] == null) li--; out += '<path d="' + d + 'L' + x(li) + ' ' + (T + ph) + 'L' + x(fi) + ' ' + (T + ph) + 'Z" fill="url(#lg' + el.id + ')"/>'; }
      out += '<path class="ln" d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.width || 3) + '"' + (s.dash ? ' stroke-dasharray="' + s.dash + '"' : '') + (s.opacity ? ' stroke-opacity="' + s.opacity + '"' : '') + ' stroke-linejoin="round" stroke-linecap="round"/>';
      if (s.dots) s.values.forEach(function (v, i) { if (v != null) out += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="5" fill="' + (typeof s.dots === 'function' ? s.dots(v, i) : s.color) + '" stroke="var(--card)" stroke-width="2"/>'; });
    });
    if (o.target && o.target.value != null) out += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(o.target.value) + '" y2="' + y(o.target.value) + '" stroke="var(--text)" stroke-opacity=".6" stroke-width="2" stroke-dasharray="7 5"/><text class="mark-l" x="' + (W - R) + '" y="' + (y(o.target.value) - 8) + '" text-anchor="end">' + esc(o.target.label) + '</text>';
    (o.marks || []).forEach(function (m) { var mx = x(m.i); out += '<line x1="' + mx + '" x2="' + mx + '" y1="' + T + '" y2="' + (T + ph) + '" stroke="var(--text-3)" stroke-dasharray="3 4"/><text class="mark-l" x="' + mx + '" y="' + (T - 8) + '" text-anchor="' + (mx > W - 140 ? 'end' : mx < L + 80 ? 'start' : 'middle') + '">' + esc(m.label) + '</text>'; });
    var every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / 70))));
    o.labels.forEach(function (l, i) { if (i % every === 0 || i === n - 1) out += '<text class="ax" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>'; });
    var gw = n > 1 ? pw / (n - 1) : pw;
    for (var i = 0; i < n; i++) {
      var tip = '<b>' + esc(o.tips ? o.tips[i] : o.labels[i]) + '</b>' + o.series.filter(function (s) { return !s.noTip; }).map(function (s) { return '<div class="row"><span><i class="tip-dot" style="background:' + s.color + '"></i>' + esc(s.name) + '</span><b>' + (s.values[i] == null ? '–' : esc(fmt(s.values[i]))) + '</b></div>'; }).join('');
      out += '<rect class="hover-band" x="' + (x(i) - gw / 2) + '" y="' + T + '" width="' + gw + '" height="' + ph + '" data-tip="' + esc(tip) + '"/>';
    }
    var anim = !el.dataset.drawn; el.dataset.drawn = '1';
    el.innerHTML = '<svg class="chart big' + (anim ? ' anim-ln' : '') + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' + out + '</svg>';
  }

  window.Charts = { line: line, countUp: countUp, timeline: timeline, spark: spark, columns: columns, hbars: hbars, ring: ring, segRing: segRing, donut: donut, wave: wave, bars: bars, bindTips: bindTips, esc: esc };
})();
