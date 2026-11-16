const DEFAULTS = { enabled: true, preset: 'phone', body: 'calm', noise: 'on' };
let settings = { ...DEFAULTS };

// Storage keeps real booleans for `enabled`; buttons carry strings.
const asString = v => String(v);
const parse = (k, v) => (k === 'enabled' ? v === 'true' : v);

const sync = () => {
  document.body.dataset.preset = settings.preset;
  document.querySelectorAll('button[data-k]').forEach(btn =>
    btn.setAttribute('aria-pressed', asString(settings[btn.dataset.k]) === btn.dataset.v));
};

document.addEventListener('click', e => {
  const btn = e.target.closest('button[data-k]');
  if (!btn) return;
  const { k, v, toggle } = btn.dataset;
  const next = toggle && asString(settings[k]) === v ? toggle : v;
  settings[k] = parse(k, next);
  chrome.storage.local.set({ [k]: settings[k] });
  sync();
});

chrome.storage.local.get(DEFAULTS).then(s => { settings = s; sync(); });

// Ask the open claude.ai tab which hooks matched.
const showHooks = async () => {
  const body = document.getElementById('hooks-body');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'nc-hooks' });
    const entries = Object.entries(res.hits);
    const found = entries.filter(([, n]) => n > 0).length;
    const list = document.createElement('ul');
    for (const [role, n] of entries) {
      const li = document.createElement('li');
      li.className = n > 0 ? 'ok' : 'miss';
      li.textContent = n > 1 ? `${role} ×${n}` : role;
      list.append(li);
    }
    body.textContent = `${res.site}: ${found}/${entries.length} linked`;
    body.after(list);
    if (res.fontErrors?.length) {
      const err = document.createElement('div');
      err.className = 'micro';
      err.textContent = `Font error: ${res.fontErrors[0]}`;
      list.after(err);
    }
  } catch {
    // No content script in this tab (not claude.ai): keep the hint.
  }
};
showHooks();
