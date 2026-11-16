// Coverage scan: run in the console on several claude.ai pages and states (chat, new
// chat, settings, projects, artifacts, a menu or dialog open, a tooltip showing).
// Each run merges into localStorage; the last run downloads nc-coverage.json with
// every component seen so far. Records component names, roles and their look only.
// Waits 4 s after you press Enter, so you can hover a tooltip or open a menu first.
console.log('Night City coverage: scanning in 4 s. Hover or open what you want captured.');
setTimeout(() => {
  const KEY = 'nc-coverage';
  const ID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
  const acc = JSON.parse(localStorage.getItem(KEY) || '{"pages":[],"items":{}}');
  acc.pages = [...new Set([...acc.pages, location.pathname.replace(ID, ':id')])];

  const look = el => {
    const s = getComputedStyle(el);
    return {
      cls: (el.getAttribute('class') || '').slice(0, 140),
      bg: s.backgroundColor, color: s.color, radius: s.borderRadius,
      border: `${s.borderTopWidth} ${s.borderTopColor}`, font: s.fontFamily.split(',')[0],
      nc: el.closest('[data-nc]')?.dataset.nc || '',
    };
  };
  const add = (key, el) => {
    const item = acc.items[key] ||= { count: 0, pages: [] };
    item.count++;
    item.sample = look(el);                      // latest look, so fixes show up on rescan
    const page = location.pathname.replace(ID, ':id');
    if (!item.pages.includes(page)) item.pages.push(page);
  };

  document.querySelectorAll('[data-cds]').forEach(el => add(`cds:${el.dataset.cds}`, el));
  document.querySelectorAll('[role]').forEach(el => add(`role:${el.getAttribute('role')}`, el));
  // Anything still rounded or still on a gray, untinted background
  document.querySelectorAll('body *').forEach(el => {
    const s = getComputedStyle(el);
    if (parseFloat(s.borderTopLeftRadius) > 4 && !/50%|9999/.test(s.borderRadius) && el.offsetWidth > 24 && el.offsetHeight > 16) add(`rounded:${el.tagName.toLowerCase()}.${(el.classList[0] || '')}`, el);
    const m = s.backgroundColor.match(/\d+(\.\d+)?/g);
    if (m && (m[3] === undefined || +m[3] > .3)) {
      const [r, g, b] = m.map(Number);
      if (Math.max(r, g, b) - Math.min(r, g, b) < 6 && r > 20 && r < 235) add(`gray-bg:${el.tagName.toLowerCase()}.${(el.classList[0] || '')}`, el);
    }
  });

  localStorage.setItem(KEY, JSON.stringify(acc));
  const json = JSON.stringify(acc, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = 'nc-coverage.json';
  a.click();
  console.log(`Coverage: ${Object.keys(acc.items).length} kinds over ${acc.pages.length} pages. Run again on another page or state; the newest download has everything.`);
}, 4000);
