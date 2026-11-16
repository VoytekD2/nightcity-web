// Paste into the console on a claude.ai chat with a code block (extension on).
// Reports how fonts, code token colors and the chat title are actually applied.
// Copies the result to the clipboard; no message text beyond 20-char samples.
(() => {
  const cs = el => el && getComputedStyle(el);
  const desc = el => el && {
    tag: el.tagName.toLowerCase(),
    cls: (el.getAttribute('class') || '').slice(0, 160),
    data: [...el.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name).join(' '),
    font: cs(el).fontFamily.slice(0, 120),
    color: cs(el).color,
  };
  const byText = (root, text) => [...root.querySelectorAll('*')].find(e => e.childElementCount === 0 && e.textContent.trim() === text);
  const side = document.querySelector('[data-testid="sidebar"]');
  const reply = document.querySelector('[data-testid="assistant-message"] p');
  const code = document.querySelector('pre code');
  const title = document.querySelector('[data-testid="session-title-split"]');

  // Who sets font-family on the reply paragraph? List matching rules.
  const fontRules = el => {
    const out = [];
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      const walk = rs => { for (const r of rs) {
        if (r.cssRules) walk(r.cssRules);
        if (r.style?.fontFamily && r.selectorText) { try { if (el.matches(r.selectorText)) out.push(`${r.selectorText.slice(0, 100)} => ${r.style.fontFamily.slice(0, 80)}${r.style.getPropertyPriority('font-family') ? ' !important' : ''}`); } catch {} }
      } };
      walk(rules);
    }
    return out.slice(-12);
  };

  const iconish = [...document.querySelectorAll('[data-testid="sidebar"] *')].filter(e => /icon|symbol/i.test(cs(e).fontFamily)).slice(0, 3);

  const out = {
    fontFaces: [...new Set([...document.fonts].map(f => f.family))],
    sidebarLabel: desc(side && byText(side, 'Recents')),
    sidebarLabelRules: side && byText(side, 'Recents') && fontRules(byText(side, 'Recents')),
    reply: desc(reply),
    replyRules: reply && fontRules(reply),
    replyVars: reply && ['--font-claude-response', '--_prose-font-body', '--cds-font-sans', '--font-anthropic-serif'].map(v => `${v}=${cs(reply).getPropertyValue(v).trim().slice(0, 60)}`),
    iconFontElements: iconish.map(desc),
    codeTokens: code && [...code.querySelectorAll('span')].filter(s => s.childElementCount === 0).slice(0, 14).map(s => ({
      text: s.textContent.slice(0, 20), cls: s.getAttribute('class'), style: (s.getAttribute('style') || '').slice(0, 120), color: cs(s).color,
    })),
    title: title && { ...desc(title), html: title.outerHTML.replace(/>[^<]{3,}</g, '>…<').slice(0, 600) },
  };
  const json = JSON.stringify(out, null, 1);
  copy(json);
  console.log(json);
  console.log('Copied to clipboard.');
})();
