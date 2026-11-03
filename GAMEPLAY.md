# Gameplay and rules

## Classic
Place the three available shapes on the 8 × 8 board. A complete horizontal row or vertical column clears. A single placement may clear both; intersection cells count only once. The tray refreshes only after all three pieces are consumed.

## Shape library
The engine defines 26 coordinate-based shapes and uses weighted selection. Each piece has a stable ID, color, shape ID and used state.

## Scoring
Each placed cell awards 10 points. Each cleared line awards 100, each additional simultaneous line adds 75, and a consecutive clearing turn adds 50 combo points. The Bloom meter gains 20 charge per cleared line.

## Bloom Burst
The meter fills to 100. The burst button becomes available; the intended target is a 3 × 3 region chosen by the player. This UI scaffold currently exposes the meter and action affordance but the region targeting and burst resolution are still incomplete and must not be treated as implemented.

## Modes
The scaffold includes Classic, a 30-node level journey with score/line/combo/multi-line objectives, and a local daily challenge. Level definitions and objective evaluators live in `src/levels.ts`.
