# BLOCK BLOOM

**A dimensional puzzle garden. Place with purpose. Clear with joy.**

BLOCK BLOOM is a portrait-first block-placement puzzle built with TypeScript and Vite. Its visual direction uses a midnight arcade palette, beveled dimensional blocks, soft bloom lighting, subtle pointer-driven board tilt and tactile interaction feedback.

> Current status: active development. The web game, engine, progression and browser interactions are implemented and passing CI. Android packaging, real-device testing, production advertising and store release are still outstanding.

## Play locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Quality checks

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs the engine, campaign and storage suite, a strict TypeScript/Vite production build, and Chromium browser interaction tests. Browser screenshots and traces are uploaded as workflow artifacts.

## Gameplay

- 8 × 8 board with 26 coordinate-defined piece shapes.
- Three-piece tray. The next tray appears only after all three pieces are used.
- Tap-to-select and tap-to-place, or drag-and-drop with a grabbed-cell offset and valid/invalid placement preview.
- Rotate a selected piece, request a hint, or undo a recent move. Move search and game-over detection account for rotations.
- Complete rows and columns. Simultaneous line intersections are cleared and scored once.
- Bloom Charge powers Bloom Burst: choose a 3 × 3 board region, inspect the highlighted preview, then confirm or cancel.
- Classic endless play, a 30-level objective journey in three chapters, and a date-seeded daily challenge.
- Local save records, sound effects, optional ambient synth music and vibration where supported.
- Responsive installable web shell with offline cache support after the first network load.

See [GAMEPLAY.md](./GAMEPLAY.md) for rules and [RELEASE.md](./RELEASE.md) for limitations and release steps.

## Offline web install

The web build includes a manifest, custom SVG app icon and service worker cache. Serve the production build over HTTPS (or localhost), then use the browser's install action. First load requires a network connection so the browser can cache the application shell and assets.

## Technology

- TypeScript and Vite
- Vitest and Playwright
- Native DOM, CSS 3D transforms and Web Audio API
- Browser localStorage and Service Worker APIs

No backend, account, analytics SDK or live advertising SDK is required for gameplay. The ad interface is intentionally a no-op until a real provider, consent flow and publisher configuration are supplied.
