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

  window.Charts = { ring: ring, segRing: segRing, donut: donut, wave: wave, bars: bars, bindTips: bindTips, esc: esc };
})();
