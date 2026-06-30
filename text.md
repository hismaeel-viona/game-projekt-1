# Reaction Game Analysis

sinnvollen ✅
unnötigen ❌
nicht verstehst ⁉️
geraten 🤔


## 1. ✅ Current structure

The game is a browser-based reaction game with a single page and modular JavaScript files.

- [`index.html`](index.html)
  - layout with sliders, game field, target button, start button, highscore area
  - includes [`src/game.js`](src/game.js)
- [`src/style.css`](src/style.css)
  - visual styling for field, target, fake targets, controls, background effects
- [`src/game.js`](src/game.js)
  - main game controller
  - manages state like `points`, `remainingTime`, `gameRunning`, `targetX/Y`, `velocityX/Y`
  - creates/updates the moving target and fake targets
  - handles start/end game flow, timer, animations, and click events
- [`src/scoring.js`](src/scoring.js)
  - display updates and score calculations
- [`src/storage.js`](src/storage.js)
  - `localStorage` persistence for record and highscore list
- [`src/ui.js`](src/ui.js)
  - DOM access helpers and fake target creation

## 2. ✅ Files responsible for UI, logic, and testing

### User interface

- [`index.html`](index.html)
- [`src/style.css`](src/style.css)
- [`src/ui.js`](src/ui.js)

### Game logic

- [`src/game.js`](src/game.js)
- [`src/scoring.js`](src/scoring.js)
- [`src/storage.js`](src/storage.js)

### Tests

- [`tests/game.test.js`](tests/game.test.js)
- [`tests/scoring.test.js`](tests/scoring.test.js)
- [`tests/storage.test.js`](tests/storage.test.js)
- [`tests/ui.test.js`](tests/ui.test.js)

## 3. Hard-to-understand or hard-to-extend parts

- ✅ [`src/game.js`](src/game.js) is monolithic
  - many global variables
  - mixes state, rendering, timers, event handling, and game rules
- ❌ No central difficulty abstraction
  - speed, fake count, and time come directly from sliders
- 🤔 No wrong-click detection
  - only target and fake targets handle clicks
  - empty-field clicks are ignored
- 🤔 No game-end statistics
  - only points, time, and record are tracked
- ✅ Test coverage is weak
  - [`tests/game.test.js`](tests/game.test.js) only checks module import
  - no behavioral tests for gameplay, click logic, or future statistics

## 4. Changes needed for requested features

### ✅ Three difficulty levels

- Add a difficulty selector in the UI
- Define difficulty presets for `easy`, `medium`, `hard`
- Derive `speed`, `fakeCount`, `gameTime`, and possibly target size from difficulty
- Replace direct slider values with a difficulty-based config

### ✅ Incorrect click detection

- Add click listener on the game field
- Track clicks on empty space separately from target and fake target clicks
- Add a `misses` or `misclicks` counter in game state
- Define behavior on misclicks (score penalty, stats only, or end game))

### ✅ Statistics after game end

- Track:
  - points scored
  - number of hits
  - number of misclicks
  - average reaction time
  - best reaction time
- Collect timing data per hit
- Display statistics in a post-game results panel or overlay

### Keyboard controls

- Make the target focusable and add ARIA attributes if needed
- Add keyboard event handling for `Enter` / `Space` on the target
- Optionally add keyboard start controls
- Ensure keyboard and mouse input both work cleanly

## Work plan in small, testable steps

1. Refactor `src/game.js` internally
   - separate state, event handlers, and rendering logic
   - test: module loads unchanged
2. Strengthen `src/ui.js`
   - centralize DOM element access and helper creation
   - test: UI helpers return expected elements and create fake targets
3. Add difficulty configuration
   - define `easy`, `medium`, `hard` presets
   - test: config lookup returns correct values
4. Add difficulty selector UI
   - add HTML control for difficulty
   - test: selector exists and can be read
5. Implement misclick detection
   - add game field click handling
   - test: clicking empty field increments misclick counter
6. Add statistics state tracking
   - add hit count, misclick count, and reaction timing
   - test: stats object initializes correctly on game start
7. Add end-game statistics display
   - show summary after the game ends
   - test: stats values appear in the DOM
8. Add keyboard controls
   - enable `Enter`/`Space` for target hits and start
   - test: keyboard action triggers the same hit logic as mouse
9. Extend tests
   - add coverage for difficulty, misclicks, stats, and keyboard input
   - test: behavior matches new game rules
10. Clean up and stabilize
   - remove duplication, clarify separation
   - test: full suite passes and old behavior still works
