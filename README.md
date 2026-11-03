# BLOCK BLOOM

**A dimensional puzzle garden. Place with purpose. Clear with joy.**

BLOCK BLOOM is a portrait-first block-placement puzzle built with TypeScript and Vite. Its visual direction combines a midnight arcade palette, dimensional CSS block faces, soft bloom lighting and short, tactile interaction feedback.

> Current status: active development. This branch is a working implementation foundation, not a store-ready release. The web shell, engine and interaction loop are under construction and still require CI/device verification.

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
npm run preview
```

A GitHub Actions workflow runs the engine/storage tests and production build on pushes to `feature/block-bloom-game` and `main`.

## Gameplay

- 8 × 8 board with 26 coordinate-defined piece shapes.
- Three-piece tray. The next tray appears only after all three pieces are used.
- Tap-to-select and tap-to-place, or drag-and-drop with a grabbed-cell offset and valid/invalid placement preview.
- Rotate a selected piece, request a hint, or undo a recent move.
- Complete rows and columns. Simultaneous line intersections are cleared and scored once.
- Bloom Charge powers Bloom Burst: pick a 3 × 3 board region and clear its occupied cells.
- Classic endless play, a 30-level objective journey and a date-seeded daily challenge.
- Local save records, sound effects, optional ambient synth music and vibration where supported.

See [GAMEPLAY.md](./GAMEPLAY.md) for rules and [RELEASE.md](./RELEASE.md) for limitations and release steps.

## Offline web install

The web build includes a manifest, custom SVG app icon and service worker cache. Serve the production build over HTTPS (or localhost), then use the browser's install action. First load requires a network connection so the browser can cache the application shell and assets.

## Technology

- TypeScript
- Vite
- Vitest
- Native DOM, CSS 3D transforms and Web Audio API
- Browser localStorage and Service Worker APIs

No backend, account, analytics SDK or live advertising SDK is required for gameplay. The ad interface is intentionally a no-op until a real provider, consent flow and publisher configuration are supplied.
