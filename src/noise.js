// Decoration overlay: glow, dot grid, data rails and the "SEND REPLY" label.
// Seeded, so the layout is identical on every load. Lives outside <body>
// (appended to <html>) so it never touches the site's React tree.

var NC_NOISE = (() => {
  let seed = 2077;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const hex = () => int(0, 255).toString(16).toUpperCase().padStart(2, '0');
  const svg = (w, h, body) => `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

  const barcode = (w, h) => {
    let x = 0, bars = '';
    while (x < w) { const bw = int(1, 3); bars += `<rect x="${x}" y="0" width="${bw}" height="${h}"/>`; x += bw + int(1, 3); }
    return svg(w, h, bars);
  };
  const hexdump = (rows, egg) => Array.from({ length: rows }, (_, i) => {
    const bytes = Array.from({ length: 6 }, hex);
    if (i === egg) bytes.splice(2, 3, 'FF', '06', 'B5');
    return `0x${(0x7f3a0 + i * 8).toString(16).toUpperCase()}  ${bytes.join(' ')}`;
  }).join('\n');
  const readout = rows => Array.from({ length: rows }, () =>
    `${rnd().toFixed(5)}  ${int(0, 9)} . ${int(0, 9)} ${int(0, 9)} ${int(0, 9)} ${int(0, 9)}  ${int(0, 9)}`).join('\n');
  const bits = rows => Array.from({ length: rows }, (_, i) =>
    i % 6 === 5 ? '' : Array.from({ length: 4 }, () => int(0, 1)).join('')).join('\n');
  const ruler = h => {
    let t = `<line x1="10" y1="0" x2="10" y2="${h}" stroke-width="1"/>`;
    for (let y = 0; y <= h; y += 8) t += `<line x1="${y % 40 ? 6 : 2}" y1="${y}" x2="10" y2="${y}" stroke-width="1"/>`;
    for (let y = 20; y < h; y += 60) t += `<rect x="13" y="${y}" width="5" height="5" fill="none" stroke-width="1"/>`;
    return svg(20, h, t);
  };
  const dots = (cols, rows) => {
    let d = '';
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (rnd() > .25) d += `<circle cx="${c * 7 + 2}" cy="${r * 7 + 2}" r="1"/>`;
    return svg(cols * 7, rows * 7, d);
  };

  // Each module: [index, label, body html, extra class]
  const rail = (side, mods) =>
    `<div class="nc-rail nc-${side}">` + mods.map(([i, label, body, cls = '']) =>
      `<div class="nc-mod ${cls}"><div class="nc-mod-head"><span>${i}</span><span>${label}</span></div>` +
      `<div class="nc-mod-body">${body}</div></div>`).join('') + '</div>';

  const build = () => {
    const el = document.createElement('div');
    el.id = 'nc-overlay';
    el.setAttribute('aria-hidden', 'true');
    // Static markup built above; parsed rather than assigned to innerHTML (AMO lint rule)
    const html =
      '<div class="nc-glow"></div><div class="nc-dots"></div>' +
      '<div class="nc-vtext">SYS.LINK // NC.WATSON.KABUKI :: 0451-77 :: NETWATCH NODE 3A</div>' +
      '<div class="nc-send-label"><b>SEND REPLY</b><span>NEURO NETPROTOCOL 3888_M</span></div>' +
      rail('l', [
        ['01', 'NC-0451-77-B', barcode(140, 14), 'nc-flick nc-slow'],
        ['02', 'MEM.DUMP', hexdump(7, 4)],
        ['03', 'GRID.SCAN', dots(20, 4), 'nc-alt'],
        ['04', 'TELEMETRY', readout(3), 'nc-end'],
      ]) +
      rail('r', [
        ['01', 'CLEARANCE', '<span class="nc-tag"><b>SPEC OPS</b><span>COMBAT COLLAB.\nDEFENCE PROGRAM</span></span>', 'nc-alt'],
        ['02', 'SIGNAL', `<div>${bits(11)}</div>` + ruler(100)],
        ['03', 'AUTH.KEY', barcode(140, 10), 'nc-flick'],
        ['04', '277.093.522.00.1', dots(20, 3), 'nc-end nc-alt'],
      ]);
    el.append(...new DOMParser().parseFromString(html, 'text/html').body.childNodes);
    return el;
  };

  let overlay = null;
  return {
    ensure() {
      if (!document.body) return;
      if (!overlay) { seed = 2077; overlay = build(); }
      if (!overlay.isConnected) document.documentElement.appendChild(overlay);
    },
  };
})();
