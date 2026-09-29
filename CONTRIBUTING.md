# Contributing to Aura Dial

Thanks for taking the time to contribute. Bug reports, feature ideas and pull requests are all
welcome.

## Development setup

```bash
npm install
npm run dev     # Vite dev server with UI preview harnesses
npm run build   # tsc + vite build → dist/
```

The preview harnesses let you work on the UI in a normal tab without loading the extension:
`http://localhost:5173/preview.html` (new tab page) and
`http://localhost:5173/preview-options.html` (settings). They mock `chrome.storage.local` with
`localStorage` and seed a few demo sites.

For anything that touches browser APIs — `chrome.storage`, the favicon lookup, opening tabs —
build and load `dist/` as an unpacked extension (`edge://extensions` or `chrome://extensions`,
developer mode on) and test in a real new tab.

## What a good pull request looks like

- **One concern per PR.** A focused diff reviews quickly; unrelated refactors belong in their own
  PR so a regression can be reverted without losing the feature.
- **It builds.** `npm run build` must pass (it type-checks with `tsc` before bundling).
- **It works in a real new tab.** Say in the PR what you did and what you saw — for UI changes,
  a before/after screenshot or a short screen recording goes a long way.
- **It matches the existing style.** Plain CSS with custom properties in `src/styles/`, design
  tokens from `base.css`, shared UI pieces from `src/components/ui.tsx`, icons from
  `lucide-react` (no emoji in the interface).
- **New UI text is in English**, and date/time output must respect the browser locale.
- **No new runtime dependencies** unless the PR explains why the platform (browser APIs, CSS,
  React) can't do the job.

## Reporting a bug

Please include:

- Browser and version (Edge, Chrome, Brave, …).
- Steps to reproduce, what you expected, and what happened instead.
- Whether it happens on a fresh profile / empty speed dial.
- A screenshot if it's visual, and any errors from the extension's own DevTools console
  (right-click the new tab page → *Inspect* → *Console*).

Sites that block automated requests (bot walls, private pages) are a known limitation —
see *Known limitations* in the README before filing one of those.

## License

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
