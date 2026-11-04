# BLOCK BLOOM — gameplay specification

## Board and pieces

The board is an 8 × 8 matrix. Each cell stores either a piece colour index or `null`. The UI is a renderer only; all placement, line and score operations live in `src/engine.ts`.

The piece library contains 26 coordinate-defined shapes ranging from single-cell pieces to a 3 × 3 square. Piece selection uses weighted random generation. A tray contains exactly three pieces and is regenerated only after all three are consumed.

## Placement

A placement is valid only when every piece coordinate is an integer, falls inside the board, is unique within the shape and targets an empty cell. Placement is applied to a cloned board so invalid attempts cannot partially mutate the live board.

Pieces can be tapped to select, tapped onto the board, or dragged. Drag placement preserves the local shape cell grabbed by the pointer. A board preview indicates whether the complete shape fits. Desktop pointer movement adds a restrained 3D tilt to the board surface; touch interaction avoids the tilt so it does not fight finger placement.

Pieces rotate clockwise. The move-search engine checks distinct rotations, so hints and game-over detection do not miss a legal move just because the current orientation does not fit.

## Clearing and score

Full horizontal rows and vertical columns clear after a placement. Simultaneous line intersections are counted once. In addition, four or more same-colour blocks connected edge-to-edge (not diagonally) form a Color Bloom cluster. All qualifying clusters are cleared on the same placement. Cluster cells receive a colour-match bonus, and cleared cluster cells add Bloom charge. When a cluster overlaps a line clear, its cells are removed only once from the board. The current line score formula is:

- 10 points per placed cell.
- 100 points per completed line.
- 75 additional points for each extra line in the same placement.
- 50 combo points for each consecutive line-clearing turn after the first.
- 22 bonus points per Color Bloom cell, plus 8 extra points for each cluster cell beyond the fourth.
- 6 Bloom charge per Color Bloom cell, in addition to 20 charge per cleared line.

The combo resets on a placement that clears no line.

## Bloom Charge and Bloom Burst

Each cleared line adds 20 charge, capped at 100. Each additional cell removed by a Color Bloom cluster adds another 6 charge. When full, the player can enter Burst targeting and choose a fully in-bounds 3 × 3 area. The candidate region is highlighted before commitment. The player must explicitly confirm or cancel. On confirmation, occupied cells in the region are removed and award 15 points each. The charge and combo reset. A ready Bloom Burst prevents game-over from triggering before the player can choose to spend it.

## Modes

### Classic
Endless placement with score and local best-score tracking.

### Level Journey
Thirty hand-authored definitions across three chapters: First Light, Wild Grove and Moon Garden. Objectives cover score, line clears, consecutive clearing turns and multi-line clears. Levels include move limits, unlock progression and star rating. Level piece streams are seeded by level ID so the same level begins with the same piece sequence.

### Daily Bloom
The daily challenge targets 500 points. Its piece stream is seeded from the user's local calendar date, allowing the challenge to be replayed consistently on that date without a server. Completion and streak are stored locally. An unfinished round is also stored as a versioned local session and can be resumed from the home screen after a refresh; invalid or stale daily sessions are discarded safely.

## Controls and accessibility

- Tap a piece, then tap an empty board position. Connect 4+ same-colour blocks edge-to-edge for a Color Bloom, or complete a full row or column.
- Drag a piece to the board for direct placement.
- Select a piece and use ROTATE to rotate it clockwise.
- HINT highlights a legal move and rotates the selected piece when needed.
- UNDO restores the prior game board and associated saved statistics.
- CONTINUE ROUND resumes a validated unfinished session after the app or browser is reopened.
- Escape pauses/resumes. R rotates the selected piece. Backspace undoes a move.
- Reduced-motion preferences are respected by the CSS animations.

Sound effects, ambient synth music and vibration can be switched independently in Settings. Audio is generated locally through Web Audio; it has no external audio asset dependency.
