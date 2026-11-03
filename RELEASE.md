# Release readiness

## Implemented in this branch

- Vite + TypeScript project shell and build scripts.
- Deterministic 8 × 8 engine, 26 shapes, placement validation, rotation, line detection, simultaneous clear handling, scoring, combo, valid-move search and 3 × 3 area clear.
- Engine and storage test suites.
- Midnight arcade visual system with dimensional, beveled block faces and responsive layouts.
- Tap placement, drag placement with pointer offset, valid/invalid board previews, rotation, hint, undo, pause, restart and game-over flow.
- Classic mode, 30-level journey definitions and date-seeded daily challenge.
- Versioned local save validation with corrupted-data and unavailable-storage fallbacks.
- Synthesized sound effects, optional ambient music and optional vibration.
- No-op advertising service boundary.
- PWA manifest, SVG icon and offline service worker.
- GitHub Actions test/build workflow.

## Verification status

Source files have been committed to the feature branch. The connected GitHub integration supports repository file operations but does not provide a local Node terminal, browser or Android SDK. A successful `npm test` or `npm run build` is **not claimed** until a workflow run reports success.

## Known limitations before a public release

- Android packaging is not included. Add and configure Capacitor, Android application ID, SDK/Gradle versions and signing in a local Android environment.
- No APK or AAB has been generated or device-tested.
- The ad service is no-op. No AdMob SDK, live ad IDs, consent form or revenue behaviour is enabled.
- Music is a synthesized ambient layer; no original soundtrack is bundled.
- PWA cache behaviour must be checked on a deployed HTTPS origin, including update and offline-start scenarios.
- The font import uses Google Fonts when online and falls back to system fonts when offline.
- Level objectives need playtesting and difficulty calibration, especially multi-line and combo goals.
- Interaction and visual behaviour need browser automation and real touch-device testing.

## Release checklist

1. Confirm the GitHub Actions workflow succeeds.
2. Run `npm install`, `npm test` and `npm run build` locally.
3. Exercise every game mode, all controls, invalid placements, rotation, undo, Bloom Burst and game-over sequences.
4. Validate the 30 level definitions for reliable completion and reasonable difficulty.
5. Test responsive layouts and accessibility on current mobile and desktop browsers.
6. Test PWA install, cache refresh and offline relaunch over HTTPS.
7. Add Android packaging only when an Android build environment is available; test on physical devices.
8. Add a real ad provider only after publisher setup, consent and policy review. Never ship test IDs as production IDs.
9. Review privacy disclosures, app icon and store listing assets.
10. Create and sign release artifacts. No store approval or publication is implied by this repository state.
