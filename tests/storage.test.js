/* @vitest-environment jsdom */
import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadRecord, saveRecord, loadHighscoreList, getHighscoreList, saveHighscoreEntry, clearHighscoreList } from "../src/storage.js";

describe("storage module", () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
  });

  test("loadRecord returns 0 when no saved record exists", () => {
    global.localStorage.getItem.mockReturnValue(null);
    expect(loadRecord()).toBe(0);
    expect(global.localStorage.getItem).toHaveBeenCalledWith("reaction_hunter_record");
  });

  test("loadRecord returns parsed record when record exists", () => {
    global.localStorage.getItem.mockReturnValue("24");
    expect(loadRecord()).toBe(24);
  });

  test("loadHighscoreList returns parsed list when saved highscore list exists", () => {
    const savedList = JSON.stringify([
      { score: 10, text: "First", date: "2026-01-01T00:00:00.000Z" },
    ]);
    global.localStorage.getItem.mockReturnValue(savedList);
    expect(loadHighscoreList()).toEqual([
      { score: 10, text: "First", date: "2026-01-01T00:00:00.000Z" },
    ]);
  });

  test("getHighscoreList returns the same parsed list", () => {
    const savedList = JSON.stringify([
      { score: 20, text: "Best", date: "2026-01-02T00:00:00.000Z" },
    ]);
    global.localStorage.getItem.mockReturnValue(savedList);
    expect(getHighscoreList()).toEqual([
      { score: 20, text: "Best", date: "2026-01-02T00:00:00.000Z" },
    ]);
  });

  test("saveHighscoreEntry appends and sorts highscores", () => {
    const savedList = JSON.stringify([
      { score: 10, text: "First", date: "2026-01-01T00:00:00.000Z" },
    ]);
    global.localStorage.getItem.mockReturnValue(savedList);

    saveHighscoreEntry({ score: 20, text: "Second", date: "2026-01-02T00:00:00.000Z" });

    expect(global.localStorage.setItem).toHaveBeenCalledWith(
      "reaction_hunter_highscores",
      JSON.stringify([
        { score: 20, text: "Second", date: "2026-01-02T00:00:00.000Z" },
        { score: 10, text: "First", date: "2026-01-01T00:00:00.000Z" },
      ])
    );
  });

  test("clearHighscoreList removes the highscore storage key", () => {
    clearHighscoreList();
    expect(global.localStorage.removeItem).toHaveBeenCalledWith("reaction_hunter_highscores");
  });

  test("saveRecord writes the record to localStorage", () => {
    saveRecord(18);
    expect(global.localStorage.setItem).toHaveBeenCalledWith("reaction_hunter_record", "18");
  });
});
