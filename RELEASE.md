# Release notes and readiness

## Current implementation
- Browser-first Vite + TypeScript project.
- Pure board engine, coordinate-based shapes, line clearing and score calculations.
- Local save schema, 30 level definitions, daily date helper.
- Responsive interface shell and Web Audio synthesized effects.
- No-op ad provider; no external monetization is active.

## Local verification
Run `npm install`, `npm test`, then `npm run build`.

## Android packaging
Android packaging is not configured in this repository baseline. To produce an Android app, install a compatible Node.js/JDK/Android SDK, add and configure Capacitor, set the application ID and signing configuration, then build and test on physical devices. Do not commit signing keys or local SDK paths.

## Before public release
- Finish and test Bloom Burst region selection and clearing.
- Improve drag placement offset/preview and test pointer/touch flows.
- Implement daily challenge determinism from local date and timezone policy; this scaffold currently uses local date for completion only.
- Add reliable pause/resume overlay, settings privacy navigation, and persisted active sessions.
- Add full level test scenarios and calibrate level objective solvability.
- Replace remote Google Fonts dependency with bundled licensed font or system stack for offline polish.
- Add app icons, PWA manifest/service worker and Capacitor Android shell if needed.
- Implement consent and a production ad provider only after verifying current platform policies and providing valid publisher IDs.
- Run automated tests, production build, browser interaction tests and real Android device tests.
