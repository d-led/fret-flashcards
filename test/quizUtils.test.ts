import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateStringNames,
  findFretPositions,
  generateQuizCards,
  calculateMistakeStats,
  calculateWeights,
  weightedShuffle,
  shuffle,
  createQuizSession,
  validateAnswer,
  validateDetectedNote,
  isSessionComplete,
  getCurrentCard,
  advanceToNextCard,
  markFretFound,
  isCardComplete,
  QuizConfig,
  QuizCard,
  QuizSession,
} from "../src/ts/modules/quizUtils";

describe("Quiz Utilities", () => {
  const mockTuning = [
    { note: "E", octave: 4 },
    { note: "B", octave: 3 },
    { note: "G", octave: 3 },
    { note: "D", octave: 3 },
    { note: "A", octave: 2 },
    { note: "E", octave: 2 },
  ];

  const mockConfig: QuizConfig = {
    fretCount: 12,
    showAccidentals: false,
    numStrings: 6,
    tuning: mockTuning,
    enableBias: true,
  };

  const mockNoteVariants = [
    { name: "C", idx: 0 },
    { name: "C#", idx: 1 },
    { name: "Db", idx: 1 },
    { name: "D", idx: 2 },
    { name: "D#", idx: 3 },
    { name: "Eb", idx: 3 },
    { name: "E", idx: 4 },
    { name: "F", idx: 5 },
    { name: "F#", idx: 6 },
    { name: "G", idx: 7 },
    { name: "G#", idx: 8 },
    { name: "A", idx: 9 },
    { name: "A#", idx: 10 },
    { name: "B", idx: 11 },
  ];

  describe("generateStringNames", () => {
    it("should generate correct string names", () => {
      const stringNames = generateStringNames(mockTuning);
      
      expect(stringNames).toHaveLength(6);
      expect(stringNames[0]).toEqual({
        name: "1st",
        openNote: "E",
        midi: 64, // E4
      });
      expect(stringNames[5]).toEqual({
        name: "6th",
        openNote: "E",
        midi: 40, // E2
      });
    });

    it("should handle different tuning configurations", () => {
      const customTuning = [
        { note: "C", octave: 4 },
        { note: "G", octave: 3 },
      ];
      
      const stringNames = generateStringNames(customTuning);
      
      expect(stringNames).toHaveLength(2);
      expect(stringNames[0].openNote).toBe("C");
      expect(stringNames[1].openNote).toBe("G");
    });
  });

  describe("findFretPositions", () => {
    it("should find correct fret positions for natural notes", () => {
      const frets = findFretPositions("E", 0, mockTuning, 12, false);
      expect(frets).toContain(0); // Open string
      // Note: 12th fret would be beyond the fretCount range in this test
    });

    it("should find correct fret positions for different strings", () => {
      const frets = findFretPositions("E", 1, mockTuning, 12, false);
      expect(frets).toContain(5); // B string, 5th fret = E (B->C->D->E = 5 semitones)
    });

    it("should include enharmonic equivalents when showAccidentals is true", () => {
      const frets = findFretPositions("C#", 0, mockTuning, 12, true);
      expect(frets).toContain(9); // E string, 9th fret = C#
    });

    it("should not include enharmonic equivalents when showAccidentals is false", () => {
      const frets = findFretPositions("Db", 0, mockTuning, 12, false);
      expect(frets).toHaveLength(0); // Db not in natural notes and no exact match
    });

    it("should handle notes not found on string", () => {
      const frets = findFretPositions("X", 0, mockTuning, 12, false);
      expect(frets).toHaveLength(0);
    });
  });

  describe("generateQuizCards", () => {
    it("should generate cards for all valid note-string combinations", () => {
      const cards = generateQuizCards(mockConfig);
      
      expect(cards.length).toBeGreaterThan(0);
      
      // Check that all cards have valid properties
      cards.forEach((card) => {
        expect(card.string).toBeGreaterThanOrEqual(0);
        expect(card.string).toBeLessThan(mockConfig.numStrings);
        expect(card.note).toBeTruthy();
        expect(card.frets).toBeInstanceOf(Array);
        expect(card.frets.length).toBeGreaterThan(0);
        expect(card.found).toBeInstanceOf(Array);
        expect(card.found.length).toBe(0);
      });
    });

    it("should not generate cards for notes not found on strings", () => {
      const configWithLimitedFrets = { ...mockConfig, fretCount: 1 };
      const cards = generateQuizCards(configWithLimitedFrets);
      
      // Should have fewer cards due to limited fret range
      expect(cards.length).toBeLessThan(mockConfig.numStrings * 7); // 7 natural notes
    });

    it("should include enharmonic equivalents when showAccidentals is true", () => {
      const configWithAccidentals = { ...mockConfig, showAccidentals: true };
      const cards = generateQuizCards(configWithAccidentals);
      
      // Should have more cards due to accidentals
      expect(cards.length).toBeGreaterThan(mockConfig.numStrings * 7);
    });
  });

  describe("calculateMistakeStats", () => {
    it("should calculate correct mistake counts", () => {
      const answers = [
        { tuning: mockTuning, correct: false, string: 0 },
        { tuning: mockTuning, correct: true, string: 0 },
        { tuning: mockTuning, correct: false, string: 1 },
        { tuning: mockTuning, correct: false, string: 0 },
      ];
      
      const stats = calculateMistakeStats(answers, mockTuning, 6);
      
      expect(stats.mistakeCounts[0]).toBe(2);
      expect(stats.mistakeCounts[1]).toBe(1);
      expect(stats.mistakeCounts[2]).toBe(0);
      expect(stats.totalMistakes).toBe(3);
    });

    it("should only count mistakes for matching tuning", () => {
      const differentTuning = [
        { note: "D", octave: 4 },
        { note: "A", octave: 3 },
      ];
      
      const answers = [
        { tuning: mockTuning, correct: false, string: 0 },
        { tuning: differentTuning, correct: false, string: 0 },
      ];
      
      const stats = calculateMistakeStats(answers, mockTuning, 6);
      
      expect(stats.mistakeCounts[0]).toBe(1);
      expect(stats.totalMistakes).toBe(1);
    });

    it("should handle empty answers", () => {
      const stats = calculateMistakeStats([], mockTuning, 6);
      
      expect(stats.mistakeCounts).toEqual([0, 0, 0, 0, 0, 0]);
      expect(stats.totalMistakes).toBe(0);
    });
  });

  describe("calculateWeights", () => {
    it("should return equal weights when no mistakes", () => {
      const cards = generateQuizCards(mockConfig);
      const mistakeStats = { mistakeCounts: [0, 0, 0, 0, 0, 0], totalMistakes: 0 };
      
      const weights = calculateWeights(cards, mistakeStats, true);
      
      expect(weights.every(w => w === 1)).toBe(true);
    });

    it("should apply bias when mistakes exist and bias is enabled", () => {
      const cards = generateQuizCards(mockConfig);
      const mistakeStats = { mistakeCounts: [2, 0, 0, 0, 0, 0], totalMistakes: 2 };
      
      const weights = calculateWeights(cards, mistakeStats, true);
      
      // Cards on string 0 should have higher weights
      const string0Cards = cards.filter(card => card.string === 0);
      const string0Weights = string0Cards.map((_, index) => {
        const cardIndex = cards.findIndex(card => card.string === 0 && card.note === string0Cards[index].note);
        return weights[cardIndex];
      });
      
      expect(string0Weights.every(w => w > 1)).toBe(true);
    });

    it("should not apply bias when bias is disabled", () => {
      const cards = generateQuizCards(mockConfig);
      const mistakeStats = { mistakeCounts: [2, 0, 0, 0, 0, 0], totalMistakes: 2 };
      
      const weights = calculateWeights(cards, mistakeStats, false);
      
      expect(weights.every(w => w === 1)).toBe(true);
    });
  });

  describe("weightedShuffle", () => {
    it("should shuffle array based on weights", () => {
      const arr = ["a", "b", "c"];
      const weights = [1, 2, 1];
      
      // Mock Math.random to control shuffle
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = vi.fn(() => {
        callCount++;
        return callCount === 1 ? 0.3 : 0.7; // First call picks 'b', second picks 'a'
      });
      
      const result = weightedShuffle(arr, weights);
      
      expect(result).toHaveLength(3);
      expect(result).toContain("a");
      expect(result).toContain("b");
      expect(result).toContain("c");
      
      Math.random = originalRandom;
    });

    it("should handle empty array", () => {
      const result = weightedShuffle([], []);
      expect(result).toEqual([]);
    });
  });

  describe("shuffle", () => {
    it("should shuffle array", () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      
      expect(result).toHaveLength(5);
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result).toContain(4);
      expect(result).toContain(5);
    });

    it("should not modify original array", () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffle(arr);
      
      expect(arr).toEqual(original);
    });
  });

  describe("createQuizSession", () => {
    it("should create session with shuffled cards", () => {
      const session = createQuizSession(mockConfig);
      
      expect(session.cards.length).toBeGreaterThan(0);
      expect(session.currentIndex).toBe(0);
      expect(session.stringNames).toHaveLength(6);
    });

    it("should apply bias when previous answers exist", () => {
      const answers = [
        { tuning: mockTuning, correct: false, string: 0 },
        { tuning: mockTuning, correct: false, string: 0 },
      ];
      
      const session = createQuizSession(mockConfig, answers);
      
      expect(session.cards.length).toBeGreaterThan(0);
      expect(session.currentIndex).toBe(0);
    });
  });

  describe("validateAnswer", () => {
    const mockCard: QuizCard = {
      string: 0,
      note: "E",
      frets: [0, 12],
      found: [],
    };

    it("should validate correct answer", () => {
      const result = validateAnswer({ string: 0, fret: 0 }, mockCard, mockTuning);
      
      expect(result.isCorrect).toBe(true);
      expect(result.isOctaveError).toBe(false);
      expect(result.detectedFret).toBe(0);
      expect(result.detectedString).toBe(0);
    });

    it("should reject wrong string", () => {
      const result = validateAnswer({ string: 1, fret: 0 }, mockCard, mockTuning);
      
      expect(result.isCorrect).toBe(false);
      expect(result.isOctaveError).toBe(false);
      expect(result.feedbackMessage).toBe("Wrong string");
    });

    it("should reject wrong fret", () => {
      const result = validateAnswer({ string: 0, fret: 1 }, mockCard, mockTuning);
      
      expect(result.isCorrect).toBe(false);
      expect(result.isOctaveError).toBe(false);
    });
  });

  describe("validateDetectedNote", () => {
    const mockCard: QuizCard = {
      string: 0,
      note: "E",
      frets: [0, 12],
      found: [],
    };

    it("should validate correct detected note", () => {
      const result = validateDetectedNote("E", mockCard, mockTuning, mockNoteVariants, 12);
      
      expect(result.isCorrect).toBe(true);
      expect(result.isOctaveError).toBe(false);
      expect(result.detectedFret).toBe(0);
      expect(result.detectedString).toBe(0);
    });

    it("should reject unknown note", () => {
      const result = validateDetectedNote("X", mockCard, mockTuning, mockNoteVariants, 12);
      
      expect(result.isCorrect).toBe(false);
      expect(result.isOctaveError).toBe(false);
      expect(result.feedbackMessage).toBe("Unknown note: X");
    });

    it("should handle octave information", () => {
      const result = validateDetectedNote("E/4", mockCard, mockTuning, mockNoteVariants, 12);
      
      expect(result.isCorrect).toBe(true);
      expect(result.detectedFret).toBe(0);
    });

    it("should detect octave errors", () => {
      const result = validateDetectedNote("E/6", mockCard, mockTuning, mockNoteVariants, 12);
      
      expect(result.isCorrect).toBe(false);
      expect(result.isOctaveError).toBe(true);
      expect(result.feedbackMessage).toContain("octave");
    });
  });

  describe("session management", () => {
    let session: QuizSession;

    beforeEach(() => {
      session = createQuizSession(mockConfig);
    });

    it("should check if session is complete", () => {
      expect(isSessionComplete(session)).toBe(false);
      
      const completeSession = { ...session, currentIndex: session.cards.length };
      expect(isSessionComplete(completeSession)).toBe(true);
    });

    it("should get current card", () => {
      const card = getCurrentCard(session);
      
      expect(card).not.toBeNull();
      expect(card?.string).toBe(session.cards[0].string);
      expect(card?.note).toBe(session.cards[0].note);
    });

    it("should return null for current card when session is complete", () => {
      const completeSession = { ...session, currentIndex: session.cards.length };
      const card = getCurrentCard(completeSession);
      
      expect(card).toBeNull();
    });

    it("should advance to next card", () => {
      const originalIndex = session.currentIndex;
      const newSession = advanceToNextCard(session);
      
      expect(newSession.currentIndex).toBe(originalIndex + 1);
      expect(newSession.cards).toBe(session.cards);
    });
  });

  describe("card management", () => {
    let card: QuizCard;

    beforeEach(() => {
      card = {
        string: 0,
        note: "E",
        frets: [0, 12],
        found: [],
      };
    });

    it("should mark fret as found", () => {
      const updatedCard = markFretFound(card, 0);
      
      expect(updatedCard.found).toContain(0);
      expect(updatedCard.found).toHaveLength(1);
    });

    it("should not duplicate found frets", () => {
      const cardWithFound = { ...card, found: [0] };
      const updatedCard = markFretFound(cardWithFound, 0);
      
      expect(updatedCard.found).toHaveLength(1);
      expect(updatedCard.found).toContain(0);
    });

    it("should check if card is complete", () => {
      expect(isCardComplete(card)).toBe(false);
      
      const completeCard = { ...card, found: [0, 12] };
      expect(isCardComplete(completeCard)).toBe(true);
    });

    it("should check partial completion", () => {
      const partialCard = { ...card, found: [0] };
      expect(isCardComplete(partialCard)).toBe(false);
    });
  });
});
