# Night City for Claude

A browser extension that reskins claude.ai in the style of a certain neon-soaked city's in-game UI: chamfered message frames, condensed type, data rails in the margins.

Three presets: **Phone** (holo-phone messenger), **Journal** (menu screen) and **Johnny** (his phone). Focus mode hides the decoration and keeps the colors.

## Develop (Firefox)

```sh
npm run start   # opens a test Firefox profile on claude.ai, reloads on file changes
npm run lint    # AMO validation
npm run build   # zip in web-ext-artifacts/ for upload
```

Or load it into your own profile: `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick `manifest.json`. It stays until Firefox restarts.

## How it works

- `src/sites/claude.js` maps claude.ai elements to roles (`npc`, `v`, `composer`, `row`, ...). When claude.ai changes its markup, this is the file to fix. The popup's **Link status** shows which roles matched.
- `src/content.js` tags matched elements with `data-nc` attributes and positions the overlay.
- `src/theme.css` overrides claude.ai's color variables (so unmatched parts still recolor), then styles the tagged elements.
- `src/noise.js` builds the decoration overlay outside `<body>`, so it never touches the site's React tree.
- `mockup/` is the design reference, not shipped.

## Privacy

No network requests and no data collection. The only permission is `storage`, for your preset.

## Credits

Fonts: Rajdhani, Barlow Semi Condensed and Share Tech Mono, all under the SIL Open Font License (`fonts/OFL-*.txt`).

Unofficial fan project. Not affiliated with, endorsed by or connected to CD PROJEKT RED or Anthropic. Cyberpunk 2077 is a trademark of CD PROJEKT S.A. Claude is a trademark of Anthropic.

## License

[MIT](LICENSE)
