// Paste into the browser console on a claude.ai chat page to map hooks.
// Saves nc-dump.json: page structure, test ids and color variables. It records tags,
// classes and attributes only, never message text; chat ids are replaced with :id.
(() => {
  const ID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
  const KEEP = /^(id|role|href|type|aria-label|aria-current|aria-expanded|contenteditable|data-[\w-]+)$/;
  const cls = el => (el.getAttribute('class') || '').slice(0, 200);
  const attrs = el => {
    const o = {};
    for (const a of el.attributes) if (KEEP.test(a.name)) o[a.name] = a.value.replace(ID, ':id').slice(0, 80);
    return o;
  };
  const node = el => el && { tag: el.tagName.toLowerCase(), cls: cls(el), ...attrs(el) };
  const skel = (el, depth) => el && {
    ...node(el),
    kids: depth ? [...el.children].slice(0, 8).map(c => skel(c, depth - 1)) : el.children.length,
  };
  const chain = (el, n = 10) => {
    const out = [];
    for (let e = el; e && n--; e = e.parentElement) out.push(node(e));
    return out;
  };
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  // Color variables declared on root/theme selectors (Tailwind's own --tw-* skipped)
  const vars = {};
  const walk = rules => {
    for (const r of rules) {
      if (r.cssRules) walk(r.cssRules);
      if (!r.style || !r.selectorText || !/:root|html|body|\[data-|\.dark|\.light/.test(r.selectorText)) continue;
      for (const p of r.style) {
        if (!p.startsWith('--') || p.startsWith('--tw-')) continue;
        (vars[r.selectorText.slice(0, 120)] ||= {})[p] = r.style.getPropertyValue(p).trim().slice(0, 60);
      }
    }
  };
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch { /* cross-origin sheet */ } }

  const editable = $('[contenteditable="true"]') || $('textarea');
  const pre = $('pre');
  const out = {
    path: location.pathname.replace(ID, ':id'),
    html: node(document.documentElement),
    body: skel(document.body, 3),
    vars,
    testids: [...new Set($$('[data-testid]').map(e => e.dataset.testid.replace(ID, ':id')))],
    ariaLabels: [...new Set($$('button[aria-label]').map(e => e.getAttribute('aria-label').replace(ID, ':id')))].slice(0, 80),
    mains: $$('main').map(node),
    navs: $$('nav').map(node),
    newLinks: $$('a[href="/new"]').map(e => ({ chain: chain(e, 3), skel: skel(e, 3) })),
    chatLink: chain($('a[href^="/chat/"]'), 10),
    chatLinkSkel: skel($('a[href^="/chat/"]'), 4),
    composer: editable && { chain: chain(editable, 10), skel: skel(editable.closest('fieldset, form') || editable.parentElement?.parentElement?.parentElement, 5) },
    userMessage: chain($('[data-testid="user-message"]'), 8),
    streaming: chain($('[data-is-streaming]'), 4),
    pre: { chain: chain(pre, 14), skel: skel(pre?.parentElement?.parentElement, 4) },
    heading: chain($('h1, h2, h3'), 8),
  };

  const json = JSON.stringify(out, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = 'nc-dump.json';
  a.click();
  console.log(`nc-dump.json saved (${Math.round(json.length / 1024)} KB)`);
})();
