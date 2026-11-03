# BLOCK BLOOM — gameplay specification

## Board and pieces

The board is an 8 × 8 matrix. Each cell stores either a piece colour index or `null`. The UI is a renderer only; all placement, line and score operations live in `src/engine.ts`.

The piece library currently contains 26 coordinate-defined shapes ranging from single-cell pieces to a 3 × 3 square. Piece selection uses weighted random generation. A tray contains exactly three pieces and is regenerated only after all three are consumed.

## Placement

A placement is valid only when every piece coordinate is an integer, falls inside the board, is unique within the shape and targets an empty cell. Placement is applied to a cloned board so invalid attempts cannot partially mutate the live board.

Pieces can be tapped to select, tapped onto the board, or dragged. Drag placement preserves the local shape cell grabbed by the pointer. A board preview indicates whether the complete shape fits.

## Clearing and score

Full horizontal rows and vertical columns clear after a placement. Simultaneous line intersections are counted once. The current score formula is:

- 10 points per placed cell.
- 100 points per completed line.
- 75 additional points for each extra line in the same placement.
- 50 combo points for each consecutive line-clearing turn after the first.

The combo resets on a placement that clears no line.

## Bloom Charge and Bloom Burst

Each cleared line adds 20 charge, capped at 100. When full, the player may select a fully in-bounds 3 × 3 area. Occupied cells in that area are removed and award 15 points each. The charge resets to zero and the combo resets. A ready Bloom Burst prevents game-over from triggering before the player can choose to spend it.

## Modes

### Classic
Endless placement with score and local best-score tracking.

### Level Journey
Thirty structured definitions with score, line, combo and simultaneous-line objectives, move limits, unlock progression and star rating. Level piece streams are seeded by level ID so the same level begins with the same piece sequence.

### Daily Bloom
The daily challenge targets 500 points. Its piece stream is seeded from the user's local calendar date, allowing the challenge to be replayed consistently on that date without a server. Completion and streak are stored locally.

## Controls and accessibility

- Tap a piece, then tap an empty board position.
- Drag a piece to the board for direct placement.
- Select a piece and use ROTATE to rotate it clockwise.
- HINT highlights one available piece and gives a legal coordinate.
- UNDO restores the prior game state.
- Keyboard activation works through native buttons; full keyboard grid navigation remains a future improvement.

Sound, ambient music and vibration can be switched independently in Settings. Audio is generated locally through Web Audio; it has no external audio asset dependency.
