// Core interfaces for dependency injection between modules

export interface QuizCard {
  note: string;
  stringIndex: number;
  frets: number[];
}

export interface QuizSession {
  cards: QuizCard[];
  currentIndex: number;
}

export interface Settings {
  fretCountSetting: number;
  showAccidentals: boolean;
  timeoutSeconds: number;
  numStrings: number;
  tuning: Array<{ note: string; octave: number }>;
  enableBias: boolean;
  showScoreNotation: boolean;
  scoreKey: string;
  hideQuizNote: boolean;
  enableTTS: boolean;
  selectedVoice: string | null;
  micSensitivity: number;
  micClarityThreshold: number;
  micNoiseFloor: number;
}

export interface Statistics {
  answers: Array<{
    correct: boolean;
    note: string;
    stringIndex: number;
    fret: number;
    timestamp: number;
  }>;
}

export interface AudioContext {
  enabled: boolean;
  initialized: boolean;
}

export interface TTSContext {
  initialized: boolean;
  currentlyPlaying: boolean;
  queue: Array<{ text: string; priority: number; shouldLog: boolean }>;
  utteranceLog: string[];
}

export interface PitchDetectionContext {
  detecting: boolean;
  detector: any; // PitchDetector from pitchy
  stream: MediaStream | null;
}

// Callback interfaces for UI events
export interface UICallbacks {
  onQuizNoteClick: () => void;
  onFretboardClick: (stringIndex: number, fret: number) => void;
  onOpenNoteClick: (stringIndex: number) => void;
  onFretButtonClick: (fret: number) => void;
  onFretCountChange: (count: number) => void;
  onAccidentalsChange: (show: boolean) => void;
  onTimeoutChange: (seconds: number) => void;
  onNumStringsChange: (count: number) => void;
  onTuningChange: (stringIndex: number, note: string, octave: number) => void;
  onResetTuning: () => void;
  onResetStats: () => void;
  onUnifiedBannerClick: () => void;
  onMicToggle: () => Promise<void>;
  onEnableBiasChange: (enabled: boolean) => void;
  onShowScoreNotationChange: (show: boolean) => void;
  onScoreKeyChange: (key: string) => void;
  onHideQuizNoteChange: (hide: boolean) => void;
  onEnableTTSChange: (enabled: boolean) => void;
  onVoiceSelectChange: (voice: string | null) => void;
  onSkipCountdown: () => void;
}

// State interfaces for UI updates
export interface UIState {
  currentCard: QuizCard | null;
  countdownValue: number;
  countdownInterval: number | null;
  showAccidentals: boolean;
  enableBias: boolean;
  showScoreNotation: boolean;
  scoreKey: string;
  hideQuizNote: boolean;
  enableTTS: boolean;
  selectedVoice: string | null;
  pitchDetecting: boolean;
  audioEnabled: boolean;
  ttsInitialized: boolean;
}
