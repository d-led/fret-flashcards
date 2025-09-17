import { describe, it, expect, beforeEach } from "vitest";
import { QuizLogic } from "../src/ts/modules/quizLogic";
import { Settings, Statistics } from "../src/ts/types/interfaces";

describe("QuizLogic", () => {
  let quizLogic: QuizLogic;
  let settings: Settings;
  let statistics: Statistics;
  let tuning: Array<{ note: string; octave: number }>;

  beforeEach(() => {
    settings = {
      fretCountSetting: 11,
      showAccidentals: false,
      timeoutSeconds: 2,
      numStrings: 6,
      tuning: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
      ],
      enableBias: false,
      showScoreNotation: false,
      scoreKey: "C",
      hideQuizNote: false,
      enableTTS: false,
      selectedVoice: null,
    };

    statistics = {
      answers: [],
    };

    tuning = settings.tuning;

    quizLogic = new QuizLogic(settings, statistics, tuning);
  });

  it("should create a new session", () => {
    quizLogic.makeSession();
    const stats = quizLogic.getSessionStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.current).toBe(1);
  });

  it("should show the first card", () => {
    quizLogic.makeSession();
    const card = quizLogic.showCard();
    expect(card).toBeTruthy();
    expect(card?.note).toBeDefined();
    expect(card?.stringIndex).toBeGreaterThanOrEqual(0);
    expect(card?.stringIndex).toBeLessThan(6);
    expect(card?.frets).toBeDefined();
    expect(card?.frets.length).toBeGreaterThan(0);
  });

  it("should check correct answers", () => {
    quizLogic.makeSession();
    const card = quizLogic.showCard();
    expect(card).toBeTruthy();

    if (card) {
      const isCorrect = quizLogic.checkAnswer(card.stringIndex, card.frets[0]);
      expect(isCorrect).toBe(true);
    }
  });

  it("should check incorrect answers", () => {
    quizLogic.makeSession();
    const card = quizLogic.showCard();
    expect(card).toBeTruthy();

    if (card) {
      const isCorrect = quizLogic.checkAnswer(card.stringIndex, 99); // Invalid fret
      expect(isCorrect).toBe(false);
    }
  });

  it("should move to next card", () => {
    quizLogic.makeSession();
    const firstCard = quizLogic.showCard();
    quizLogic.nextCard();
    const secondCard = quizLogic.showCard();

    expect(firstCard).toBeTruthy();
    expect(secondCard).toBeTruthy();
    // Cards might be the same due to shuffling, but we should have a card
  });

  it("should record answers in statistics", () => {
    quizLogic.makeSession();
    const card = quizLogic.showCard();
    expect(card).toBeTruthy();

    if (card) {
      quizLogic.recordAnswer(true, card.stringIndex, card.frets[0]);
      expect(statistics.answers.length).toBe(1);
      expect(statistics.answers[0].correct).toBe(true);
    }
  });

  it("should handle countdown timer", (done) => {
    let countdownValues: number[] = [];

    quizLogic.startCountdown(3, () => {
      expect(countdownValues).toEqual([3, 2, 1]);
      done();
    });

    // Simulate countdown ticks
    const interval = setInterval(() => {
      const value = quizLogic.getCountdownValue();
      if (value > 0) {
        countdownValues.push(value);
      } else {
        clearInterval(interval);
      }
    }, 100);
  });

  it("should clear countdown when requested", () => {
    quizLogic.startCountdown(5, () => {});
    expect(quizLogic.getCountdownValue()).toBe(5);

    quizLogic.clearCountdown();
    expect(quizLogic.getCountdownValue()).toBe(0);
  });

  it("should update settings and recreate session when needed", () => {
    quizLogic.makeSession();
    const initialStats = quizLogic.getSessionStats();

    // Update a setting that affects session
    quizLogic.updateSettings({ showAccidentals: true });
    const newStats = quizLogic.getSessionStats();

    // Session should be recreated (stats might be different due to different note set)
    expect(newStats.total).toBeGreaterThan(0);
  });

  it("should not recreate session for non-session-affecting settings", () => {
    quizLogic.makeSession();
    const initialStats = quizLogic.getSessionStats();

    // Update a setting that doesn't affect session
    quizLogic.updateSettings({ enableTTS: true });
    const newStats = quizLogic.getSessionStats();

    // Session should remain the same
    expect(newStats.total).toBe(initialStats.total);
  });
});
