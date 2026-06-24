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
});
