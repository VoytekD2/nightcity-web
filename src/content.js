// Night City content script.
// 1. Mirrors the saved settings onto <html> as data attributes (the CSS keys off them).
// 2. Tags site elements with data-nc roles from the site hook map (React leaves
//    unknown data attributes alone, unlike className which it rewrites).
// 3. Keeps the decoration overlay aligned with the chat column.

const DEFAULTS = { enabled: true, preset: 'phone', body: 'calm', noise: 'on' };
const root = document.documentElement;

// Apply defaults right away so the page never flashes unthemed, then load the real settings.
const apply = s => {
  root.toggleAttribute('data-nc-on', s.enabled);
  root.dataset.ncPreset = s.preset;
  root.dataset.ncBody = s.body;
  root.dataset.ncNoise = s.noise;
  forceMode();
};

// Night City is a dark theme: switch the site's light/dark attributes to dark while
// enabled, remembering the original (data-nc-mode) to restore when switched off.
function forceMode() {
  for (const el of document.querySelectorAll(NC_SITE.modeTargets)) {
    const mode = el.getAttribute('data-mode');
    if (settings.enabled) {
      if (mode !== 'dark') { el.setAttribute('data-nc-mode', mode ?? ''); el.setAttribute('data-mode', 'dark'); }
    } else if (el.hasAttribute('data-nc-mode')) {
      el.setAttribute('data-mode', el.getAttribute('data-nc-mode'));
      el.removeAttribute('data-nc-mode');
    }
  }
}
// The site may set the mode again (system theme change, settings); re-apply.
new MutationObserver(muts => {
  if (settings.enabled && muts.some(m => m.target.matches(NC_SITE.modeTargets) && m.target.getAttribute('data-mode') !== 'dark')) forceMode();
}).observe(root, { attributes: true, attributeFilter: ['data-mode'], subtree: true });
let settings = { ...DEFAULTS };
apply(settings);
chrome.storage.local.get(DEFAULTS).then(s => { settings = s; apply(s); schedule(); });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const [k, { newValue }] of Object.entries(changes)) settings[k] = newValue;
  apply(settings); schedule();
});

// ---------- Fonts ----------
// Loaded from bytes rather than a CSS url(): the page's security policy and the
// browser's URL resolution for extension stylesheets can both block url() fonts.
const FONTS = [
  ['NC Rajdhani', 'Rajdhani-Medium', 500], ['NC Rajdhani', 'Rajdhani-SemiBold', 600], ['NC Rajdhani', 'Rajdhani-Bold', 700],
  ['NC Barlow', 'BarlowSemiCondensed-Regular', 400], ['NC Barlow', 'BarlowSemiCondensed-Medium', 500],
  ['NC Barlow', 'BarlowSemiCondensed-SemiBold', 600], ['NC Share Tech Mono', 'ShareTechMono-Regular', 400],
];
let fontsLoaded = 0;
const fontErrors = [];
(async () => {
  for (const [family, file, weight] of FONTS) {
    try {
      const bytes = await (await fetch(chrome.runtime.getURL(`fonts/${file}.woff2`))).arrayBuffer();
      const face = new FontFace(family, bytes, { weight: String(weight), display: 'swap' });
      document.fonts.add(await face.load());
      fontsLoaded++;
    } catch (err) {
      fontErrors.push(`${file}: ${err}`);
      console.warn('[Night City] font failed', file, err);
    }
  }
})();

// ---------- Tagging ----------
const hits = {};

const resolve = (el, rule) => {
  if (rule.closest) return el.closest(rule.closest);
  let node = el;
  for (let i = 0; i < (rule.up || 0) && node; i++) node = node.parentElement;
  return node;
};

const addRole = (el, role) => {
  const roles = (el.dataset.nc || '').split(' ').filter(Boolean);
  if (!roles.includes(role)) el.dataset.nc = [...roles, role].join(' ');
};

const tag = () => {
  for (const [role, rules] of Object.entries(NC_SITE.roles)) {
    hits[role] = 0;
    for (const rule of rules) {
      const found = rule.all ? [...document.querySelectorAll(rule.sel)] : [document.querySelector(rule.sel)];
      const els = found.map(el => el && resolve(el, rule)).filter(Boolean);
      if (!els.length) continue;
      els.forEach(el => addRole(el, role));
      hits[role] = els.length;
      break;
    }
  }
  document.querySelectorAll('[data-nc~="row"]').forEach(el =>
    el.toggleAttribute('data-nc-active', NC_SITE.isActiveRow(el)));
};

// ---------- Code token colors ----------
// claude.ai's highlighter writes light-theme colors inline, which vanish on a dark
// background. Sort each token by the hue of its color into a kind; the CSS gives
// each kind the VS Code theme's color. Hue-based, so any highlighter theme works.
const tokenKind = color => {
  const [r, g, b] = (color.match(/\d+/g) || []).map(Number).map(v => v / 255);
  if (r === undefined) return 'p';
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < .2) return l < .35 ? 'p' : 'c';         // near-black = plain text, gray = comment
  const h = (max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  const hue = (h + 360) % 360;
  if (hue < 35 || hue >= 345) return 'a';          // red/orange: properties, attributes
  if (hue < 75) return 't';                        // yellow/brown: types, classes
  if (hue < 160) return 's';                       // green: strings
  if (hue < 195) return 'n';                       // teal: numbers, constants
  if (hue < 260) return 'f';                       // blue: functions, commands
  return 'k';                                      // purple/magenta: keywords
};

const tintCode = () => {
  // Includes <pre>/<code> themselves: untagged words inherit their (dark) inline color
  for (const el of document.querySelectorAll('[data-nc~="code"] pre[style*="color"], [data-nc~="code"] pre [style*="color"]')) {
    const src = el.style.color;
    if (el.dataset.ncSrc === src) continue;       // already sorted; re-sort only if the site recolored it
    el.dataset.ncSrc = src;
    el.dataset.ncTok = tokenKind(src);
  }
};

// ---------- Overlay placement ----------
// The overlay is fixed over the page; these variables tell it where the chat
// column and sidebar are, so decoration only lands in empty gutters.
const RAIL_ROOM = 190;
const measure = () => {
  const main = document.querySelector('[data-nc~="main"]');
  const column = document.querySelector('[data-nc~="composer"]') || document.querySelector('[data-nc~="npc"], [data-nc~="v"]');
  const side = document.querySelector('[data-nc~="sidebar"]');
  const set = (k, v) => root.style.setProperty(k, `${Math.round(v)}px`);
  if (main) {
    const m = main.getBoundingClientRect();
    // <main> can span under the sidebar; the usable area starts where the sidebar ends
    const left = Math.max(m.left, side ? side.getBoundingClientRect().right : 0);
    const c = column ? column.getBoundingClientRect() : { left: (left + m.right) / 2, right: (left + m.right) / 2 };
    set('--nc-main-l', left); set('--nc-main-r', innerWidth - m.right);
    set('--nc-col-l', c.left); set('--nc-col-r', innerWidth - c.right);
    root.toggleAttribute('data-nc-rails', c.left - left >= RAIL_ROOM && m.right - c.right >= RAIL_ROOM);
  }
  const composer = document.querySelector('[data-nc~="composer"]');
  if (composer) {
    const r = composer.getBoundingClientRect();
    set('--nc-comp-t', r.top); set('--nc-comp-l', r.left); set('--nc-comp-w', r.width);
  }
  // Only label the composer inside a conversation; the new-chat page has its own heading there
  root.toggleAttribute('data-nc-composer', !!composer && !!document.querySelector('[data-nc~="npc"], [data-nc~="v"]'));
  set('--nc-side-l', side ? side.getBoundingClientRect().left : -100);
  root.toggleAttribute('data-nc-dialog', !!document.querySelector('[role="dialog"]'));
};

// ---------- Scheduling ----------
// Streaming replies mutate the DOM constantly, so work is throttled.
let pending = false;
const run = () => {
  pending = false;
  if (!settings.enabled) return;
  tag();
  tintCode();
  forceMode();
  NC_NOISE.ensure();
  measure();
};
function schedule() {
  if (pending) return;
  pending = true;
  setTimeout(() => requestAnimationFrame(run), 200);
}

new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
addEventListener('resize', schedule);
// Layout can settle after the last DOM change (e.g. a notice's exit animation
// moves the composer), so re-measure when animations and transitions finish
addEventListener('transitionend', schedule, true);
addEventListener('animationend', schedule, true);
addEventListener('popstate', schedule);
document.addEventListener('DOMContentLoaded', schedule);

// The popup asks which hooks matched, to spot site changes.
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg && msg.type === 'nc-hooks') reply({
    site: NC_SITE.name,
    hits: { ...hits, fonts: fontsLoaded === FONTS.length ? fontsLoaded : 0 },
    fontErrors,
  });
});
