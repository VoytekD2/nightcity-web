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

## Reproduce the build (for reviewers)

All code is hand-written and shipped unminified, with no bundler, transpiler or minifier. The only generated file is `src/palette.css`: a plain-text color table written by `dev/gen_palette.py` (readable Python, standard library only).

**Environment:** any OS with a POSIX shell (tested on Ubuntu 24.04 Linux; macOS works too).

**Programs:**
- Python 3.10 or newer (tested with 3.12.3). Ubuntu: `sudo apt install python3`. Others: https://www.python.org/downloads/
- Node.js 18 or newer with npm (tested with Node 24.18.0, npm 11.16.0). Install from https://nodejs.org/ or with `sudo apt install nodejs npm`.
- web-ext 8.3.0, fetched automatically by `npx` during the build (needs internet once). Nothing to install by hand.

**Steps:**
1. Unzip the source and open a terminal in its root folder.
2. Run `./build.sh` (or `sh build.sh`).

The script:
1. Runs `python3 dev/gen_palette.py`, which regenerates `src/palette.css` byte-identical to the shipped file.
2. Runs `npm run build`, which packages the extension with web-ext 8.3.0.

The result is `web-ext-artifacts/night_city_for_claude-<version>.zip`, with the same files as the uploaded package.

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
