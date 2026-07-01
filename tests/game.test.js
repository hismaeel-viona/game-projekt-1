/* @vitest-environment jsdom */
import { describe, expect, test, beforeAll } from "vitest";

let importError = null;

beforeAll(async () => {
  document.body.innerHTML = `
    <div class="container">
      <section class="options">
        <input type="range" id="gameTimeSlider" value="20">
        <input type="range" id="speedSlider" value="5">
        <input type="range" id="fakeCountSlider" value="0">
        <input type="range" id="squareCountSlider" value="8">
        <input type="range" id="starCountSlider" value="24">
        <select id="difficultySelector">
          <option value="easy">Easy</option>
          <option value="medium" selected>Medium</option>
          <option value="hard">Hard</option>
        </select>
        <span id="gameTimeValue"></span>
        <span id="speedValue"></span>
        <span id="fakeCountValue"></span>
        <span id="squareCountValue"></span>
        <span id="starCountValue"></span>
      </section>
      <main class="spiel">
        <div class="anzeigen">
          <span id="punkte"></span>
          <span id="zeit"></span>
          <span id="rekord"></span>
        </div>
        <section id="spielfeld">
          <button id="target"></button>
        </section>
        <button id="start">Start</button>
        <section class="highscore">
          <ol id="highscoreEntries"></ol>
          <button id="clearHighscores">Highscores löschen</button>
        </section>
        <section class="highscore-entry hidden" id="highscoreEntryForm">
          <label for="highscoreText">Text für aktuellen Score eingeben:</label>
          <div class="highscore-entry-row">
            <input type="text" id="highscoreText" maxlength="50" placeholder="Kurztext eingeben" />
            <button id="submitHighscore">Speichern</button>
          </div>
        </section>
        <p id="meldung"></p>
      </main>
    </div>
  `;

  try {
    await import("../src/game.js");
  } catch (error) {
    importError = error;
  }
});

describe("game module", () => {
  test("game module loads without throwing", () => {
    expect(importError).toBeNull();
  });

  test("difficulty config returns presets and default fallback", async () => {
    const { getDifficultyConfig } = await import("../src/game.js");

    expect(getDifficultyConfig("easy")).toEqual({
      gameTime: 25,
      baseSpeed: 3,
      fakeTargetCount: 0,
    });

    expect(getDifficultyConfig("hard")).toEqual({
      gameTime: 15,
      baseSpeed: 8,
      fakeTargetCount: 3,
    });

    expect(getDifficultyConfig("unknown")).toEqual({
      gameTime: 20,
      baseSpeed: 5,
      fakeTargetCount: 1,
    });
  });

  test("applyDifficultyPreset updates state and slider values", async () => {
    const { applyDifficultyPreset, state } = await import("../src/game.js");

    applyDifficultyPreset("hard");

    expect(state.difficulty).toBe("hard");
    expect(state.gameTime).toBe(15);
    expect(state.baseSpeed).toBe(8);
    expect(state.fakeTargetCount).toBe(3);
    expect(document.getElementById("difficultySelector").value).toBe("hard");
    expect(document.getElementById("gameTimeSlider").value).toBe("15");
    expect(document.getElementById("speedSlider").value).toBe("8");
    expect(document.getElementById("fakeCountSlider").value).toBe("3");
  });

  test("records reaction time on target hit", async () => {
    const mod = await import("../src/game.js");
    const { state } = mod;

    // simulate playing and a target shown 150ms ago
    state.gameRunning = true;
    state.targetShownAt = Date.now() - 150;

    const target = document.getElementById("target");
    target.click();

    expect(state.reactionTimes.length).toBeGreaterThanOrEqual(1);
    expect(state.avgReaction).toBeGreaterThanOrEqual(50);
  });

  test("computes median, p90 and renders sparkline", async () => {
    const mod = await import("../src/game.js");
    const { state, showStatsOverlay } = mod;

    // prepare some reaction times
    state.reactionTimes = [120, 150, 90, 200, 180, 300, 110];
    state.bestReaction = Math.min(...state.reactionTimes);
    const overlayBefore = document.getElementById('statsOverlay');
    if (overlayBefore) overlayBefore.remove();

    showStatsOverlay();

    const medianEl = document.getElementById('statMedian');
    const p90El = document.getElementById('statP90');
    const spark = document.getElementById('statSparkline');

    expect(medianEl).toBeTruthy();
    expect(p90El).toBeTruthy();
    expect(spark).toBeTruthy();
    expect(medianEl.textContent).toMatch(/\d+\s*ms/);
    expect(p90El.textContent).toMatch(/\d+\s*ms/);
    // sparkline should contain a polyline
    const poly = spark.querySelector('polyline');
    expect(poly).toBeTruthy();
  });

  test("keyboard controls: S start, Enter hit, P pause/resume, Escape close overlay", async () => {
    const mod = await import("../src/game.js");
    const { state, showStatsOverlay } = mod;

    // ensure game not running
    state.gameRunning = false;

    // press 's' to start
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    expect(state.gameRunning).toBe(true);

    const target = document.getElementById('target');
    // ensure target visible and focusable
    expect(target.style.display).toBe('block');
    target.focus();

    const prevHits = state.hitCount || 0;
    // press Enter to hit
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(state.hitCount).toBeGreaterThanOrEqual(prevHits + 1);

    // toggle pause
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    expect(state.paused).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    expect(state.paused).toBe(false);

    // show overlay and close with Escape
    showStatsOverlay();
    expect(document.getElementById('statsOverlay').classList.contains('hidden')).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.getElementById('statsOverlay').classList.contains('hidden')).toBe(true);
  });

  test("pause overlay and live region announcements, Ctrl+S saves highscore", async () => {
    const mod = await import("../src/game.js");
    const { state } = mod;

    // ensure game running and not paused
    state.gameRunning = true;
    state.paused = false;

    // press P to pause
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    expect(state.paused).toBe(true);
    const pauseOv = document.getElementById('pauseOverlay');
    expect(pauseOv).toBeTruthy();
    expect(pauseOv.classList.contains('hidden')).toBe(false);

    const live = document.getElementById('liveRegion');
    expect(live).toBeTruthy();

    // resume
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
    expect(state.paused).toBe(false);
    expect(pauseOv.classList.contains('hidden')).toBe(true);

    // show highscore form and test Ctrl+S
    const form = document.getElementById('highscoreEntryForm');
    const text = document.getElementById('highscoreText');
    form.classList.remove('hidden');
    text.value = 'test save';

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    // after saving, form should be hidden again
    expect(form.classList.contains('hidden')).toBe(true);
  });
});
