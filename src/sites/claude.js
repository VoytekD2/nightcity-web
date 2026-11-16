// Hook map for claude.ai: which page elements get which Night City role.
// This is the only file that should need edits when claude.ai changes its markup.
// Each role lists selectors from most to least stable; the first one that matches wins.
// `up` climbs that many parents from the match (to reach the visible box).
// `closest` jumps to the nearest ancestor matching that selector instead.
//
// Verified against a dev/dom-dump.js capture from 2026-10-29.

var NC_SITE = {
  name: 'claude.ai',
  roles: {
    main:     [{ sel: 'main[data-perf-region="main"]' }, { sel: 'main' }],
    sidebar:  [{ sel: '[data-testid="sidebar"]' }],
    newchat:  [{ sel: '[data-testid="sidebar"] a[href="/new"][data-row-nav]' },
               { sel: 'a[href="/new"][data-row]' }],
    // The link is the text; the hoverable pill around it is the [data-row] parent
    row:      [{ sel: ':is([data-testid="sidebar-pinned"], [data-testid="sidebar-recents"]) [data-row-main-button]', all: true, closest: '[data-row]' },
               { sel: '[data-testid="sidebar"] a[href^="/chat/"]', all: true, closest: '[data-row]' }],
    v:        [{ sel: '[data-testid="user-message"]', all: true, closest: '[class*="message-bubble"]' },
               { sel: '[data-testid="user-message"]', all: true }],
    npc:      [{ sel: '[data-testid="assistant-message"]', all: true }],
    code:     [{ sel: '[data-testid="assistant-message"] pre', all: true, closest: '[role="group"]' }],
    composer: [{ sel: '[data-testid="chat-input"]', closest: '.rounded-composer' },
               { sel: '[data-testid="chat-input"]', closest: '[data-cds="ChatComposer"]' }],
    send:     [{ sel: '[data-testid="chat-input-send"]' }],
    title:    [{ sel: '[data-testid="session-title-split"]' }],
  },
  // Elements carrying the light/dark switch; Night City needs them dark.
  modeTargets: 'html, .cds-root[data-mode]',
  isActiveRow: el => el.querySelector('a[href]')?.getAttribute('href') === location.pathname,
};
