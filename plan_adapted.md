# Development Plan: Reaction Game v2

## Current situation

The existing reaction game is a browser-based click game with:
- a modular JS structure in `src/`
- separated UI, scoring, storage modules
- weak test coverage
- missing difficulty presets, misclick tracking, end-game statistics, and full keyboard accessibility

The goal is to upgrade it into a smaller Version 2 with:
- three difficulty levels
- misclick detection
- game-end statistics
- keyboard controls and accessibility

---

## Stage 1: Clean game structure and foundation

**Priority:** High

### Goal
Create a stable, maintainable foundation by clarifying the game architecture.

### Path
1. Inspect `src/game.js` and separate responsibilities:
   - state storage
   - event registration
   - animation / rendering
   - game lifecycle
2. Consolidate UI bindings in `src/ui.js`:
   - expose DOM references via `getElements()`
   - keep helpers like `createFakeTargetButton()` centralized
3. Remove any duplicated or tangled logic from `src/game.js`
4. Ensure existing gameplay still works after restructuring

### Verification
- `npm test` runs without import errors
- starting the game works
- target hit increments points
- game end triggers correctly

---

## Stage 2: Difficulty levels

**Priority:** High

### Goal
Add explicit difficulty presets: `easy`, `medium`, and `hard`.

### Path
1. Define a difficulty config object with values for:
   - speed
   - fake target count
   - game time
   - optional target size
2. Add a difficulty selector UI element
3. Update `startGame()` to read the selected preset
4. Keep slider overrides optional, but use the preset as the default game state

### Verification
- selecting a difficulty changes game parameters
- easy vs hard behavior differs visibly
- unit test confirms preset mapping is correct

---

## Stage 3: Misclick detection and hit classification

**Priority:** Medium

### Goal
Differentiate real hits, fake hits, and empty-field misclicks.

### Path
1. Add a click listener on the game field
2. Track:
   - `hitCount`
   - `fakeHitCount`
   - `missCount`
3. Handle fake targets separately
4. Decide rule behavior:
   - misclicks are counted
   - fake clicks may trigger a penalty or game over
5. Keep mouse and target hit logic separate and explicit

### Verification
- clicking blank space increases miss count
- clicking fake target triggers the expected failure path
- clicking real target increments hit count and points

---

## Stage 4: End-game statistics display

**Priority:** Medium

### Goal
Show a summary of session performance after the game ends.

### Path
1. Collect session metrics:
   - points
   - hits
   - misclicks
   - average reaction time
   - best reaction time
2. Measure reaction time per hit
3. Add a result panel or overlay to the UI
4. Populate the stats panel at `endGame()`

### Verification
- game end shows the stats panel
- displayed values match collected session metrics
- reaction time calculations are correct

---

## Stage 5: Keyboard accessibility and stabilization

**Priority:** Medium

### Goal
Make the game usable with keyboard controls and ensure feature stability.

### Path
1. Make the target focusable and accessible
2. Add keyboard controls:
   - `Enter` / `Space` for target activation
   - optional `S` to start
   - optional `P` to pause
   - optional `Escape` to quit
3. Expand tests to cover:
   - difficulty selection
   - misclick and fake-click logic
   - statistics generation
   - keyboard input behavior
4. Refactor and remove any duplicated logic found during implementation

### Verification
- keyboard input triggers the same behavior as mouse input
- focus and ARIA support are present
- new tests pass alongside existing tests

---

## Summary table

| Stage | Feature | Status | Priority |
|---|---|---|---|
| 1 | Structure cleanup | planned | High |
| 2 | Difficulty levels | planned | High |
| 3 | Misclick detection | planned | Medium |
| 4 | End-game stats | planned | Medium |
| 5 | Keyboard accessibility | planned | Medium |

---

## Recommended order

1. **Stage 1** – establish a clean code base
2. **Stage 2** – add difficulty presets
3. **Stage 3** – implement misclick logic
4. **Stage 4** – add end-game statistics
5. **Stage 5** – add keyboard controls and finalize tests

---

## Implementation status

| Stage | Task | Result | Notes |
|---|---|---|---|
| 1 | Refactor `src/game.js` to use a centralized `state` object and keep UI bindings in `src/ui.js` | Success | `src/game.js` now uses `state` and `ui`; `npm test` passes. |
| 2 | Add difficulty presets and selector UI, plus preset-driven game state | Success | Difficulty presets added; new tests added and `npm test` passes (16/16). |
| 3 | Add misclick tracking for blank field clicks and classify hit types | Success | `hitCount`, `fakeHitCount`, and `missCount` added; blank-field clicks now increment miss count. |