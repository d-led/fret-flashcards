import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { QuizLogic } from "../src/ts/modules/quizLogic";
import { Settings, Statistics } from "../src/ts/types/interfaces";

/**
 * Property-based tests for quiz game progression
 * These tests verify that certain properties always hold regardless of input
 */

describe("Quiz Game Progression Properties", () => {
  // Generator for valid settings
  const settingsArbitrary = fc.record({
    fretCountSetting: fc.integer({ min: 1, max: 24 }),
    showAccidentals: fc.boolean(),
    timeoutSeconds: fc.integer({ min: 1, max: 60 }),
    numStrings: fc.constant(6), // Fixed for guitar
    tuning: fc.constant([
      { note: "E", octave: 4 },
      { note: "B", octave: 3 },
      { note: "G", octave: 3 },
      { note: "D", octave: 3 },
      { note: "A", octave: 2 },
      { note: "E", octave: 2 },
    ]),
    enableBias: fc.boolean(),
    showScoreNotation: fc.boolean(),
    scoreKey: fc.constant("C"),
    hideQuizNote: fc.boolean(),
    enableTTS: fc.boolean(),
    selectedVoice: fc.constant(null),
  });

  // Generator for statistics
  const statisticsArbitrary = fc.record({
    answers: fc.array(fc.record({
      correct: fc.boolean(),
      string: fc.integer({ min: 0, max: 5 }),
      fret: fc.integer({ min: 0, max: 24 }),
      timestamp: fc.integer({ min: 0 }),
    })),
  });

  it("should always allow progression with correct answers", () => {
    fc.assert(fc.property(
      settingsArbitrary,
      statisticsArbitrary,
      (settings, statistics) => {
        const tuning = settings.tuning;
        const quizLogic = new QuizLogic(settings, statistics, tuning);
        quizLogic.makeSession();
        
        const initialStats = quizLogic.getSessionStats();
        const initialCurrent = initialStats.current;
        
        // Test just one correct answer to keep it fast
        const card = quizLogic.showCard();
        if (card) {
          const isCorrect = quizLogic.checkAnswer(card.stringIndex, card.frets[0]);
          expect(isCorrect).toBe(true);
          
          // Record the correct answer
          quizLogic.recordAnswer(true, card.stringIndex, card.frets[0]);
          
          // Move to next card
          quizLogic.nextCard();
        }
        
        const finalStats = quizLogic.getSessionStats();
        
        // Property: Game should always progress when correct answers are given
        expect(finalStats.current).toBeGreaterThan(initialCurrent);
      }
    ), { numRuns: 1, timeout: 5000 });
  });

  it("should maintain session integrity during progression", () => {
    fc.assert(fc.property(
      settingsArbitrary,
      statisticsArbitrary,
      (settings, statistics) => {
        const tuning = settings.tuning;
        const quizLogic = new QuizLogic(settings, statistics, tuning);
        quizLogic.makeSession();
        
        const initialStats = quizLogic.getSessionStats();
        const totalCards = initialStats.total;
        
        // Test just one step to keep it fast
        const card = quizLogic.showCard();
        if (card) {
          const isCorrect = quizLogic.checkAnswer(card.stringIndex, card.frets[0]);
          quizLogic.recordAnswer(isCorrect, card.stringIndex, card.frets[0]);
          quizLogic.nextCard();
        }
        
        const currentStats = quizLogic.getSessionStats();
        expect(currentStats.total).toBe(totalCards);
      }
    ), { numRuns: 1, timeout: 5000 });
  });

  it("should handle all valid fret positions correctly", () => {
    fc.assert(fc.property(
      settingsArbitrary,
      statisticsArbitrary,
      fc.integer({ min: 0, max: 5 }), // String index
      fc.integer({ min: 0, max: 24 }), // Fret position
      (settings, statistics, stringIndex, fret) => {
        const tuning = settings.tuning;
        const quizLogic = new QuizLogic(settings, statistics, tuning);
        quizLogic.makeSession();
        
        const card = quizLogic.showCard();
        if (card && card.stringIndex === stringIndex) {
          const isCorrect = quizLogic.checkAnswer(stringIndex, fret);
          
          // Property: Answer should be correct if and only if fret is in the card's frets array
          const expectedCorrect = card.frets.includes(fret);
          expect(isCorrect).toBe(expectedCorrect);
        }
      }
    ), { numRuns: 5, timeout: 10000 });
  });

  it("should never get stuck in infinite loops", () => {
    fc.assert(fc.property(
      settingsArbitrary,
      statisticsArbitrary,
      fc.integer({ min: 1, max: 5 }),
      (settings, statistics, maxIterations) => {
        const tuning = settings.tuning;
        const quizLogic = new QuizLogic(settings, statistics, tuning);
        quizLogic.makeSession();
        
        let iterations = 0;
        const maxSteps = maxIterations * 2; // Safety limit
        
        // Property: Should be able to progress through multiple cards without getting stuck
        while (iterations < maxSteps) {
          const card = quizLogic.showCard();
          if (!card) break;
          
          const isCorrect = quizLogic.checkAnswer(card.stringIndex, card.frets[0]);
          quizLogic.recordAnswer(isCorrect, card.stringIndex, card.frets[0]);
          quizLogic.nextCard();
          
          iterations++;
        }
        
        // Should not hit the safety limit (indicates potential infinite loop)
        expect(iterations).toBeLessThan(maxSteps);
      }
    ), { numRuns: 2, timeout: 10000 });
  });

  it("should maintain consistent state after correct answers", () => {
    fc.assert(fc.property(
      settingsArbitrary,
      statisticsArbitrary,
      fc.integer({ min: 1, max: 3 }),
      (settings, statistics, numCorrectAnswers) => {
        const tuning = settings.tuning;
        const quizLogic = new QuizLogic(settings, statistics, tuning);
        quizLogic.makeSession();
        
        const initialAnswersCount = statistics.answers.length;
        
        // Submit correct answers
        for (let i = 0; i < numCorrectAnswers; i++) {
          const card = quizLogic.showCard();
          if (card) {
            const isCorrect = quizLogic.checkAnswer(card.stringIndex, card.frets[0]);
            expect(isCorrect).toBe(true);
            
            quizLogic.recordAnswer(true, card.stringIndex, card.frets[0]);
            quizLogic.nextCard();
          }
        }
        
        // Property: Statistics should be updated correctly
        expect(statistics.answers.length).toBe(initialAnswersCount + numCorrectAnswers);
        
        // All recorded answers should be correct
        const newAnswers = statistics.answers.slice(initialAnswersCount);
        newAnswers.forEach(answer => {
          expect(answer.correct).toBe(true);
        });
      }
    ), { numRuns: 2, timeout: 10000 });
  });

  it("should handle edge cases in fret range", () => {
    fc.assert(fc.property(
      settingsArbitrary,
      statisticsArbitrary,
      fc.integer({ min: 0, max: 5 }), // String index
      fc.oneof(
        fc.constant(-1), // Below valid range
        fc.constant(25), // Above valid range
        fc.integer({ min: 0, max: 24 }) // Valid range
      ),
      (settings, statistics, stringIndex, fret) => {
        const tuning = settings.tuning;
        const quizLogic = new QuizLogic(settings, statistics, tuning);
        quizLogic.makeSession();
        
        const card = quizLogic.showCard();
        if (card && card.stringIndex === stringIndex) {
          const isCorrect = quizLogic.checkAnswer(stringIndex, fret);
          
          // Property: Invalid fret positions should never be correct
          if (fret < 0 || fret > 24) {
            expect(isCorrect).toBe(false);
          }
        }
      }
    ), { numRuns: 2, timeout: 10000 });
  });
});
