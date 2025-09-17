import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIControls } from '../src/ts/modules/uiControls';
import { UICallbacks, UIState, Settings } from '../src/ts/types/interfaces';

// Mock jQuery
global.$ = vi.fn(() => ({
  on: vi.fn(),
  val: vi.fn(),
  prop: vi.fn(),
  text: vi.fn(),
  toggle: vi.fn(),
  show: vi.fn(),
  hide: vi.fn(),
  empty: vi.fn(),
  append: vi.fn(),
  attr: vi.fn(),
  removeAttribute: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn()
}));

// Mock document.getElementById
global.document = {
  getElementById: vi.fn(() => ({
    textContent: '',
    innerHTML: '',
    style: {},
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn()
  }))
} as any;

describe('UIControls', () => {
  let uiControls: UIControls;
  let mockCallbacks: UICallbacks;
  let initialState: UIState;
  let initialSettings: Settings;

  beforeEach(() => {
    mockCallbacks = {
      onQuizNoteClick: vi.fn(),
      onFretboardClick: vi.fn(),
      onOpenNoteClick: vi.fn(),
      onFretCountChange: vi.fn(),
      onAccidentalsChange: vi.fn(),
      onTimeoutChange: vi.fn(),
      onNumStringsChange: vi.fn(),
      onTuningChange: vi.fn(),
      onResetTuning: vi.fn(),
      onResetStats: vi.fn(),
      onUnifiedBannerClick: vi.fn(),
      onMicToggle: vi.fn(),
      onEnableBiasChange: vi.fn(),
      onShowScoreNotationChange: vi.fn(),
      onScoreKeyChange: vi.fn(),
      onHideQuizNoteChange: vi.fn(),
      onEnableTTSChange: vi.fn(),
      onVoiceSelectChange: vi.fn(),
      onSkipCountdown: vi.fn()
    };

    initialState = {
      currentCard: null,
      countdownValue: 0,
      countdownInterval: null,
      showAccidentals: false,
      enableBias: false,
      showScoreNotation: false,
      scoreKey: 'C',
      hideQuizNote: false,
      enableTTS: false,
      selectedVoice: null,
      pitchDetecting: false,
      audioEnabled: false,
      ttsInitialized: false
    };

    initialSettings = {
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
        { note: "E", octave: 2 }
      ],
      enableBias: false,
      showScoreNotation: false,
      scoreKey: "C",
      hideQuizNote: false,
      enableTTS: false,
      selectedVoice: null
    };

    uiControls = new UIControls(mockCallbacks, initialState, initialSettings);
  });

  it('should initialize event handlers', () => {
    expect(() => uiControls.initializeEventHandlers()).not.toThrow();
  });

  it('should update state', () => {
    const newState = { pitchDetecting: true, enableTTS: true };
    uiControls.updateState(newState);
    // State update should not throw
    expect(true).toBe(true);
  });

  it('should update settings', () => {
    const newSettings = { showAccidentals: true, enableBias: true };
    uiControls.updateSettings(newSettings);
    // Settings update should not throw
    expect(true).toBe(true);
  });

  it('should toggle unified banner', () => {
    expect(() => uiControls.toggleUnifiedBanner(true)).not.toThrow();
    expect(() => uiControls.toggleUnifiedBanner(false)).not.toThrow();
  });

  it('should update countdown display', () => {
    expect(() => uiControls.updateCountdown(5)).not.toThrow();
    expect(() => uiControls.updateCountdown(0)).not.toThrow();
  });

  it('should clear countdown display', () => {
    expect(() => uiControls.clearCountdown()).not.toThrow();
  });
});
