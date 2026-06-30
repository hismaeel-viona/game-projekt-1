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
});
