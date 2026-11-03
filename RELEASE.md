# Release readiness

## Implemented in this branch

- Vite + TypeScript project shell and build scripts.
- Deterministic 8 × 8 engine, 26 shapes, placement validation, rotation, line detection, simultaneous clear handling, scoring, combo, valid-move search and 3 × 3 area clear.
- Engine and storage test suites.
- Midnight arcade visual system with dimensional, beveled block faces and responsive layouts.
- Tap placement, drag placement with pointer offset, valid/invalid board previews, rotation, hint, undo, pause, restart and game-over flow.
- Classic mode, 30-level journey definitions and date-seeded daily challenge.
- Versioned local save validation with corrupted-data and unavailable-storage fallbacks.
- Versioned active-round snapshots and Continue Round recovery, including stale daily-session rejection.
- Synthesized sound effects, optional ambient music and optional vibration.
- No-op advertising service boundary.
- PWA manifest, SVG icon and offline service worker.
- GitHub Actions test/build workflow.

## Verification status

GitHub Actions run [41702555691](https://github.com/yesu166/mini-game/actions/runs/41702555691) completed successfully on the current implementation commit:

- **23/23** Vitest engine, campaign and storage tests passed.
- TypeScript strict check and Vite production build passed.
- **8/8** Playwright Chromium browser flows passed, including real tap placement, drag placement, Undo/stat consistency, interrupted-round recovery, campaign navigation, settings/privacy and Bloom Burst preview/cancel/confirm.
- Browser screenshots and traces were uploaded as the [CI evidence artifact](https://github.com/yesu166/mini-game/actions/runs/41702555691/artifacts/13264126225).

This verifies the browser build in GitHub's Linux/Chromium environment. It does not substitute for Android device testing or store-release validation.

## Known limitations before a public release

- Android packaging is not included. Add and configure Capacitor, Android application ID, SDK/Gradle versions and signing in a local Android environment.
- No APK or AAB has been generated or device-tested.
- The ad service is no-op. No AdMob SDK, live ad IDs, consent form or revenue behaviour is enabled.
- Music is a synthesized ambient layer; no original soundtrack is bundled.
- PWA cache behaviour must be checked on a deployed HTTPS origin, including update and offline-start scenarios.
- The font import uses Google Fonts when online and falls back to system fonts when offline.
- Level objectives need playtesting and difficulty calibration, especially multi-line and combo goals.
- Browser interaction tests run in CI; real touch-device testing and accessibility review remain outstanding.

## Release checklist

1. Keep the GitHub Actions workflow green for each change.
2. Run `npm install`, `npm test`, `npm run build` and `npm run test:e2e` locally.
3. Exercise every game mode, all controls, invalid placements, rotation, undo, Bloom Burst and game-over sequences.
4. Validate the 30 level definitions for reliable completion and reasonable difficulty.
5. Test responsive layouts and accessibility on current mobile and desktop browsers.
6. Test PWA install, cache refresh and offline relaunch over HTTPS.
7. Add Android packaging only when an Android build environment is available; test on physical devices.
8. Add a real ad provider only after publisher setup, consent and policy review. Never ship test IDs as production IDs.
9. Review privacy disclosures, app icon and store listing assets.
10. Create and sign release artifacts. No store approval or publication is implied by this repository state.
