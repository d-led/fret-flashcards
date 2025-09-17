import { QuizCard, QuizSession, Settings, Statistics } from "../types/interfaces";

/**
 * Quiz Logic Module
 * Handles quiz session management, card generation, and scoring
 * Follows Single Responsibility Principle - only manages quiz state and logic
 */
export class QuizLogic {
  private session: QuizSession;
  private currentCard: QuizCard | null = null;
  private sessionIndex: number = 0;
  private consecutiveMistakes: number = 0;
  private consecutiveOctaveMistakes: number = 0;
  private foundFrets: number[] = [];
  private countdownValue: number = 0;
  private countdownInterval: number | null = null;
  private pendingTimeout: number | null = null;

  private settings: Settings;
  private statistics: Statistics;
  private tuning: Array<{ note: string; octave: number }>;

  // Note constants
  private readonly allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  private readonly naturalNotes = ["C", "D", "E", "F", "G", "A", "B"];

  constructor(settings: Settings, statistics: Statistics, tuning: Array<{ note: string; octave: number }>) {
    this.settings = settings;
    this.statistics = statistics;
    this.tuning = tuning;
    this.session = { cards: [], currentIndex: 0 };
  }

  /**
   * Create a new quiz session
   */
  public makeSession(): void {
    // Reset consecutive mistakes counter for new session
    this.consecutiveMistakes = 0;
    this.consecutiveOctaveMistakes = 0;

    // Clear TTS queue when starting a new session
    this.clearTimeouts();

    const fretCount = this.settings.fretCountSetting + 1; // includes 0th fret
    const notes = this.getNotesToSet();
    const frets = [...Array(fretCount).keys()]; // 0 ... 11 or 0 ... 24

    const cards: QuizCard[] = [];

    for (let s = 0; s < this.settings.numStrings; s++) {
      for (let n of notes) {
        const fretPositions = this.findFretPositionsForNote(n, s, frets);
        if (fretPositions.length > 0) {
          cards.push({
            note: n,
            stringIndex: s,
            frets: fretPositions,
          });
        }
      }
    }

    // Apply weighted shuffle based on statistics if available
    this.session = {
      cards: this.applyWeightedShuffle(cards),
      currentIndex: 0,
    };

    this.sessionIndex = 0;
  }

  /**
   * Get the current quiz card
   */
  public getCurrentCard(): QuizCard | null {
    return this.currentCard;
  }

  /**
   * Get the currently found frets for the current card
   */
  public getFoundFrets(): number[] {
    return [...this.foundFrets];
  }

  /**
   * Show the next card in the session
   */
  public showCard(): QuizCard | null {
    this.clearTimeouts();
    this.clearCountdown();

    if (this.sessionIndex >= this.session.cards.length) {
      console.log("Session complete!");
      this.makeSession();
    }

    if (this.sessionIndex < this.session.cards.length) {
      this.currentCard = this.session.cards[this.sessionIndex];
      this.foundFrets = [];
      return this.currentCard;
    }

    return null;
  }

  /**
   * Move to the next card
   */
  public nextCard(): void {
    this.sessionIndex++;
    if (this.sessionIndex >= this.session.cards.length) {
      console.log("Session complete!");
      this.makeSession();
    }
    this.showCard();
  }

  /**
   * Check if a fret position is correct for the current card
   */
  public checkAnswer(stringIndex: number, fret: number): boolean {
    if (!this.currentCard) return false;

    const isCorrect = this.currentCard.stringIndex === stringIndex && this.currentCard.frets.includes(fret);

    if (isCorrect && !this.foundFrets.includes(fret)) {
      this.foundFrets.push(fret);
    }

    return isCorrect;
  }

  /**
   * Check if all fret positions have been found for the current card
   */
  public isCardComplete(): boolean {
    if (!this.currentCard) return false;
    return this.foundFrets.length === this.currentCard.frets.length;
  }

  /**
   * Record an answer in statistics
   */
  public recordAnswer(correct: boolean, stringIndex: number, fret: number): void {
    if (!this.currentCard) return;

    this.statistics.answers.push({
      correct,
      note: this.currentCard.note,
      stringIndex,
      fret,
      timestamp: Date.now(),
    });

    if (correct) {
      this.consecutiveMistakes = 0;
      this.consecutiveOctaveMistakes = 0;
    } else {
      this.consecutiveMistakes++;
      this.consecutiveOctaveMistakes++;
    }
  }

  /**
   * Start countdown timer
   */
  public startCountdown(seconds: number, onComplete: () => void): void {
    this.countdownValue = seconds;
    this.countdownInterval = window.setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue <= 0) {
        this.clearCountdown();
        onComplete();
      }
    }, 1000);
  }

  /**
   * Clear countdown timer
   */
  public clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.countdownValue = 0;
  }

  /**
   * Get current countdown value
   */
  public getCountdownValue(): number {
    return this.countdownValue;
  }

  /**
   * Set a timeout
   */
  public setTimeout(callback: () => void, delay: number): void {
    this.clearTimeout();
    this.pendingTimeout = window.setTimeout(callback, delay);
  }

  /**
   * Clear timeout
   */
  public clearTimeout(): void {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }

  /**
   * Clear all timeouts and intervals
   */
  public clearTimeouts(): void {
    this.clearTimeout();
    this.clearCountdown();
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): { total: number; current: number; remaining: number } {
    return {
      total: this.session.cards.length,
      current: this.sessionIndex + 1,
      remaining: this.session.cards.length - this.sessionIndex,
    };
  }

  /**
   * Update settings and recreate session if needed
   */
  public updateSettings(newSettings: Partial<Settings>): void {
    const needsNewSession = this.settingsChanged(newSettings);
    this.settings = { ...this.settings, ...newSettings };

    if (needsNewSession) {
      this.makeSession();
    }
  }

  /**
   * Update tuning and recreate session
   */
  public updateTuning(newTuning: Array<{ note: string; octave: number }>): void {
    this.tuning = newTuning;
    this.makeSession();
  }

  private getNotesToSet(): string[] {
    if (this.settings.showAccidentals) {
      return this.allNotes;
    } else {
      return this.naturalNotes;
    }
  }

  private findFretPositionsForNote(note: string, stringIndex: number, frets: number[]): number[] {
    const positions: number[] = [];
    const openNote = this.tuning[stringIndex].note;
    const openIdx = this.allNotes.indexOf(openNote);

    for (let f of frets) {
      const noteIdx = (openIdx + f) % 12;
      const noteOnFret = this.allNotes[noteIdx];

      if (noteOnFret === note || (this.settings.showAccidentals && this.areNotesEquivalent(noteOnFret, note))) {
        positions.push(f);
      }
    }

    return positions;
  }

  private areNotesEquivalent(note1: string, note2: string): boolean {
    const equivalents: { [key: string]: string[] } = {
      "C#": ["Db"],
      Db: ["C#"],
      "D#": ["Eb"],
      Eb: ["D#"],
      "F#": ["Gb"],
      Gb: ["F#"],
      "G#": ["Ab"],
      Ab: ["G#"],
      "A#": ["Bb"],
      Bb: ["A#"],
    };

    return note1 === note2 || (equivalents[note1] && equivalents[note1].includes(note2));
  }

  private applyWeightedShuffle(cards: QuizCard[]): QuizCard[] {
    if (this.statistics.answers.length === 0) {
      return this.shuffle(cards);
    }

    // Calculate mistake counts per string
    const mistakeCounts = Array(this.settings.numStrings).fill(0);
    const currentTuningStr = JSON.stringify(this.tuning);

    this.statistics.answers.forEach((answer) => {
      if (JSON.stringify(answer.tuning) === currentTuningStr && !answer.correct) {
        mistakeCounts[answer.stringIndex]++;
      }
    });

    // Calculate weights based on mistakes
    const biasStrength = this.settings.enableBias ? 1 : 0;
    const baseWeights = cards.map((card) => 1 + mistakeCounts[card.stringIndex] * biasStrength);

    // Normalize weights
    const avgWeight = baseWeights.reduce((sum, w) => sum + w, 0) / baseWeights.length;
    const maxWeight = avgWeight * 3;
    const minWeight = avgWeight / 3;

    const weights = baseWeights.map((w) => Math.max(minWeight, Math.min(maxWeight, w)));

    return this.weightedShuffle(cards, weights);
  }

  private weightedShuffle(arr: QuizCard[], weights: number[]): QuizCard[] {
    const result: QuizCard[] = [];
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

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private settingsChanged(newSettings: Partial<Settings>): boolean {
    const sessionAffectingSettings = ["fretCountSetting", "showAccidentals", "numStrings", "enableBias"];

    return sessionAffectingSettings.some((key) => newSettings[key as keyof Settings] !== undefined && newSettings[key as keyof Settings] !== this.settings[key as keyof Settings]);
  }
}
