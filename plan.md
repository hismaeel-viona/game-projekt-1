## Plan: Reaction Game v2 Implementation

This plan is based on the existing game analysis and the user requirements for a smaller Version 2 with:
- difficulty levels
- misclick detection
- game statistics after game end
- more accessible controls

Each step includes a goal, implementation path, and verification method.

### Step 1: Establish a clear game foundation and UI bindings
- Goal: Separate the core game state and DOM access so future features can attach cleanly.
- Path: refactor `src/game.js` into distinct sections for state, event registration, and rendering; ensure `src/ui.js` exposes all needed DOM elements and helper creation.
- Verification: game imports without errors, existing start/stop flow still works, and UI helper tests pass.

### Step 2: Add difficulty levels with a central configuration
- Goal: Support `easy`, `medium`, and `hard` as first-class game modes.
- Path: define difficulty presets that map to speed, fake target count, game duration, and optionally target size; add UI selection and make game startup use the selected preset.
- Verification: the selected difficulty changes gameplay parameters and a new unit test validates the preset lookup.

### Step 3: Implement misclick detection and keyboard controls
- Goal: Detect clicks outside the real target, handle fake target interactions, and make controls accessible by keyboard.
- Path: add a click listener on the game field, collect `misclicks`, and wire keyboard events for `Enter`/`Space` on the target and start button; preserve mouse behavior.
- Verification: clicks on empty space increment the misclick counter, keyboard activation triggers target hits, and new focused-input tests prove accessibility.

### Step 4: Add end-game statistics and results display
- Goal: Show a concise post-game summary including points, hits, misclicks, and reaction times.
- Path: collect hit count, misclick count, average reaction time, and best reaction time during play; add a result panel or overlay in the UI and populate it at game end.
- Verification: statistics are computed correctly on end-of-game and the new UI panel displays the expected values.

### Step 5: Extend tests and stabilize the implementation
- Goal: Ensure the new features are covered and the code remains maintainable.
- Path: add tests for difficulty selection, misclick handling, statistic generation, and keyboard input; refactor any duplicated or tangled logic identified during implementation.
- Verification: full test suite passes, new behavior-specific tests succeed, and the final game behavior remains consistent.