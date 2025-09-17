// Quiz Utilities Module
// Pure functional utilities for quiz generation, validation, and session management

import { getMidi, areNotesEquivalent, getNotesToSet, getOrdinal, NoteVariant } from "./noteUtils";

export interface QuizCard {
  string: number;
  note: string;
  frets: number[];
  found: number[];
  shownTime?: number;
}

export interface StringInfo {
  name: string;
  openNote: string;
  midi: number;
}

export interface QuizSession {
  cards: QuizCard[];
  currentIndex: number;
  stringNames: StringInfo[];
}

export interface QuizConfig {
  fretCount: number;
  showAccidentals: boolean;
  numStrings: number;
  tuning: Array<{ note: string; octave: number }>;
  enableBias: boolean;
}

export interface AnswerResult {
  isCorrect: boolean;
  isOctaveError: boolean;
  feedbackMessage?: string;
  detectedFret?: number;
  detectedString?: number;
}

export interface MistakeStats {
  mistakeCounts: number[];
  totalMistakes: number;
}

/**
 * Generate string information for a given tuning
 * @param tuning - Array of tuning notes and octaves
 * @returns Array of string information
 */
export function generateStringNames(tuning: Array<{ note: string; octave: number }>): StringInfo[] {
  return tuning.map((tune, index) => {
    const midi = getMidi(tune.note, tune.octave);
    const ordinal = getOrdinal(index + 1);
    return {
      name: ordinal,
      openNote: tune.note,
      midi,
    };
  });
}

/**
 * Find fret positions for a note on a specific string
 * @param note - Note to find
 * @param stringIndex - String index (0-based)
 * @param tuning - String tuning configuration
 * @param fretCount - Number of frets available
 * @param showAccidentals - Whether to include enharmonic equivalents
 * @returns Array of fret positions where the note can be played
 */
export function findFretPositions(note: string, stringIndex: number, tuning: Array<{ note: string; octave: number }>, fretCount: number, showAccidentals: boolean): number[] {
  const frets: number[] = [];
  const openNote = tuning[stringIndex].note;
  const openIdx = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].indexOf(openNote);

  for (let fret = 0; fret < fretCount; fret++) {
    const noteIdx = (openIdx + fret) % 12;
    const noteOnFret = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][noteIdx];

    // Check if the note matches exactly or if they are enharmonically equivalent
    if (noteOnFret === note || (showAccidentals && areNotesEquivalent(noteOnFret, note))) {
      frets.push(fret);
    }
  }

  return frets;
}

/**
 * Generate all possible quiz cards for a session
 * @param config - Quiz configuration
 * @returns Array of quiz cards
 */
export function generateQuizCards(config: QuizConfig): QuizCard[] {
  const cards: QuizCard[] = [];
  const notes = getNotesToSet(config.showAccidentals);

  for (let stringIndex = 0; stringIndex < config.numStrings; stringIndex++) {
    for (const note of notes) {
      const frets = findFretPositions(note, stringIndex, config.tuning, config.fretCount, config.showAccidentals);

      if (frets.length > 0) {
        cards.push({
          string: stringIndex,
          note,
          frets: [...frets],
          found: [],
        });
      }
    }
  }

  return cards;
}

/**
 * Calculate mistake statistics for bias weighting
 * @param answers - Array of previous answers
 * @param tuning - Current tuning configuration
 * @param numStrings - Number of strings
 * @returns Mistake statistics
 */
export function calculateMistakeStats(
  answers: Array<{ tuning: Array<{ note: string; octave: number }>; correct: boolean; string: number }>,
  tuning: Array<{ note: string; octave: number }>,
  numStrings: number,
): MistakeStats {
  const mistakeCounts = Array(numStrings).fill(0);
  let totalMistakes = 0;
  const currentTuningStr = JSON.stringify(tuning);

  answers.forEach((answer) => {
    if (JSON.stringify(answer.tuning) === currentTuningStr && !answer.correct) {
      mistakeCounts[answer.string]++;
      totalMistakes++;
    }
  });

  return { mistakeCounts, totalMistakes };
}

/**
 * Calculate weights for weighted shuffling based on mistake statistics
 * @param cards - Array of quiz cards
 * @param mistakeStats - Mistake statistics
 * @param enableBias - Whether to apply bias weighting
 * @returns Array of weights for each card
 */
export function calculateWeights(cards: QuizCard[], mistakeStats: MistakeStats, enableBias: boolean): number[] {
  if (mistakeStats.totalMistakes === 0) {
    // No statistics yet, use equal weights
    return cards.map(() => 1);
  }

  // Calculate weights: base weight = 1, mistakes add bias when enabled
  const biasStrength = enableBias ? 1 : 0;
  const baseWeights = cards.map((card) => 1 + mistakeStats.mistakeCounts[card.string] * biasStrength);

  // Normalize by average and cap the difference to 3:1 ratio
  const avgWeight = baseWeights.reduce((sum, w) => sum + w, 0) / baseWeights.length;
  const maxWeight = avgWeight * 3;
  const minWeight = avgWeight / 3;

  return baseWeights.map((w) => Math.max(minWeight, Math.min(maxWeight, w)));
}

/**
 * Perform weighted shuffle on an array
 * @param arr - Array to shuffle
 * @param weights - Weights for each element
 * @returns Shuffled array
 */
export function weightedShuffle<T>(arr: T[], weights: number[]): T[] {
  const result: T[] = [];
  const arrCopy = [...arr];
  const weightsCopy = [...weights];
  let totalWeight = weightsCopy.reduce((sum, w) => sum + w, 0);

  while (arrCopy.length > 0) {
    const rand = Math.random() * totalWeight;
    let cumWeight = 0;

    for (let i = 0; i < arrCopy.length; i++) {
      cumWeight += weightsCopy[i];
      if (rand < cumWeight) {
        result.push(arrCopy[i]);
        totalWeight -= weightsCopy[i];
        arrCopy.splice(i, 1);
        weightsCopy.splice(i, 1);
        break;
      }
    }
  }

  return result;
}

/**
 * Perform Fisher-Yates shuffle on an array
 * @param arr - Array to shuffle
 * @returns Shuffled array
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Create a new quiz session
 * @param config - Quiz configuration
 * @param answers - Previous answers for bias calculation
 * @returns New quiz session
 */
export function createQuizSession(config: QuizConfig, answers: Array<{ tuning: Array<{ note: string; octave: number }>; correct: boolean; string: number }> = []): QuizSession {
  const cards = generateQuizCards(config);
  const stringNames = generateStringNames(config.tuning);

  let shuffledCards: QuizCard[];

  if (answers.length > 0) {
    const mistakeStats = calculateMistakeStats(answers, config.tuning, config.numStrings);
    const weights = calculateWeights(cards, mistakeStats, config.enableBias);
    shuffledCards = weightedShuffle(cards, weights);
  } else {
    // No statistics yet, use equal weights
    const weights = cards.map(() => 1);
    shuffledCards = weightedShuffle(cards, weights);
  }

  return {
    cards: shuffledCards,
    currentIndex: 0,
    stringNames,
  };
}

/**
 * Validate a quiz answer
 * @param answer - Answer to validate
 * @param currentCard - Current quiz card
 * @param tuning - String tuning configuration
 * @returns Answer validation result
 */
export function validateAnswer(answer: { string: number; fret: number }, currentCard: QuizCard, tuning: Array<{ note: string; octave: number }>): AnswerResult {
  // Check if the answer is for the correct string
  if (answer.string !== currentCard.string) {
    return {
      isCorrect: false,
      isOctaveError: false,
      feedbackMessage: "Wrong string",
    };
  }

  // Check if the fret is correct
  const isCorrect = currentCard.frets.includes(answer.fret);

  return {
    isCorrect,
    isOctaveError: false,
    detectedFret: answer.fret,
    detectedString: answer.string,
  };
}

/**
 * Validate a detected note from microphone input
 * @param detectedNote - Detected note name (with optional octave)
 * @param currentCard - Current quiz card
 * @param tuning - String tuning configuration
 * @param noteVariants - Available note variants
 * @param fretCount - Number of frets available
 * @returns Answer validation result
 */
export function validateDetectedNote(detectedNote: string, currentCard: QuizCard, tuning: Array<{ note: string; octave: number }>, noteVariants: NoteVariant[], fretCount: number): AnswerResult {
  // Parse detected note (may be "NAME" or "NAME/OCTAVE")
  let namePart = detectedNote;
  let octavePart: number | null = null;

  if (detectedNote.includes("/")) {
    const parts = detectedNote.split("/");
    namePart = parts[0];
    octavePart = parseInt(parts[1], 10);
    if (!isFinite(octavePart)) octavePart = null;
  }

  // Find variant matching the detected name
  const variant = noteVariants.find((v) => v.name === namePart);
  if (!variant) {
    return {
      isCorrect: false,
      isOctaveError: false,
      feedbackMessage: `Unknown note: ${detectedNote}`,
    };
  }

  const openMidi = getMidi(tuning[currentCard.string].note, tuning[currentCard.string].octave);
  let detectedMidi: number | null = null;

  if (octavePart !== null) {
    // Try to compute MIDI using provided octave
    const candidateMidi = getMidi(variant.name, octavePart);
    const fretDiff = candidateMidi - openMidi;

    if (fretDiff >= 0 && fretDiff < fretCount) {
      detectedMidi = candidateMidi;
    } else {
      // Octave is out of range
      const octaveDiff = Math.floor(fretDiff / 12);
      const hint = octaveDiff < 0 ? "try octave higher" : "try octave lower";

      // Calculate expected octave for this note on this string
      const expectedMidi = openMidi + currentCard.frets[0];
      const expectedOctave = Math.floor(expectedMidi / 12) - 1;

      return {
        isCorrect: false,
        isOctaveError: true,
        feedbackMessage: `${namePart}${octavePart} - ${hint} (need ~${expectedOctave})`,
      };
    }
  } else {
    // Search different octaves when no specific octave was provided
    for (let octave = 1; octave <= 8; octave++) {
      const candidateMidi = getMidi(variant.name, octave);
      const fretDiff = candidateMidi - openMidi;

      if (fretDiff >= 0 && fretDiff < fretCount) {
        detectedMidi = candidateMidi;
        break;
      }
    }
  }

  if (detectedMidi === null) {
    return {
      isCorrect: false,
      isOctaveError: false,
      feedbackMessage: `Note ${namePart} not found in fret range`,
    };
  }

  const detectedFret = detectedMidi - openMidi;
  const isCorrect = currentCard.frets.includes(detectedFret);

  // Check for approximate octave feedback
  if (!isCorrect) {
    const expectedMidiValues = currentCard.frets.map((f) => openMidi + f);
    const minExpected = Math.min(...expectedMidiValues);
    const maxExpected = Math.max(...expectedMidiValues);

    // Check if detected note is approximately an octave off (10-14 semitones)
    const lowerOctaveMin = detectedMidi - 14;
    const lowerOctaveMax = detectedMidi - 10;
    const higherOctaveMin = detectedMidi + 10;
    const higherOctaveMax = detectedMidi + 14;

    const isLowerOctave = minExpected >= lowerOctaveMin && maxExpected <= lowerOctaveMax;
    const isHigherOctave = minExpected >= higherOctaveMin && maxExpected <= higherOctaveMax;

    if (isLowerOctave || isHigherOctave) {
      return {
        isCorrect: false,
        isOctaveError: true,
        feedbackMessage: `${namePart} - try ${isLowerOctave ? "octave higher" : "octave lower"}`,
        detectedFret,
        detectedString: currentCard.string,
      };
    }
  }

  return {
    isCorrect,
    isOctaveError: false,
    detectedFret,
    detectedString: currentCard.string,
  };
}

/**
 * Check if a session is complete
 * @param session - Quiz session
 * @returns True if session is complete
 */
export function isSessionComplete(session: QuizSession): boolean {
  return session.currentIndex >= session.cards.length;
}

/**
 * Get the current card from a session
 * @param session - Quiz session
 * @returns Current card or null if session is complete
 */
export function getCurrentCard(session: QuizSession): QuizCard | null {
  if (isSessionComplete(session)) {
    return null;
  }
  return session.cards[session.currentIndex];
}

/**
 * Advance to the next card in a session
 * @param session - Quiz session
 * @returns Updated session
 */
export function advanceToNextCard(session: QuizSession): QuizSession {
  return {
    ...session,
    currentIndex: session.currentIndex + 1,
  };
}

/**
 * Mark a fret as found on a card
 * @param card - Quiz card
 * @param fret - Fret to mark as found
 * @returns Updated card
 */
export function markFretFound(card: QuizCard, fret: number): QuizCard {
  if (card.found.includes(fret)) {
    return card; // Already found
  }

  return {
    ...card,
    found: [...card.found, fret],
  };
}

/**
 * Check if all frets for a card have been found
 * @param card - Quiz card
 * @returns True if all frets have been found
 */
export function isCardComplete(card: QuizCard): boolean {
  return card.frets.every((fret) => card.found.includes(fret));
}
