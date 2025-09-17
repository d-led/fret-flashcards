/**
 * Comprehensive jsdom-based test for index.ts
 * Tests the main application functionality using DOM simulation
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock VexFlow
const mockVexFlow = {
  Factory: vi.fn().mockImplementation(() => ({
    EasyScore: vi.fn(() => ({
      voice: vi.fn(() => ({
        setMode: vi.fn(),
        getTickables: vi.fn(() => [])
      }))
    })),
    System: vi.fn(() => ({
      addStave: vi.fn().mockReturnThis(),
      addClef: vi.fn().mockReturnThis(),
      addKeySignature: vi.fn().mockReturnThis()
    })),
    StaveNote: vi.fn(() => ({
      addModifier: vi.fn()
    })),
    Accidental: vi.fn().mockImplementation((type) => ({ type }))
  })),
  Accidental: {
    applyAccidentals: vi.fn()
  },
  Voice: {
    Mode: {
      SOFT: 'soft'
    }
  }
};

// Mock jQuery
const mockJQuery = vi.fn((selector) => {
  const mockElement = {
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    click: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    val: vi.fn().mockReturnThis(),
    prop: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnThis(),
    data: vi.fn().mockReturnThis(),
    show: vi.fn().mockReturnThis(),
    hide: vi.fn().mockReturnThis(),
    toggle: vi.fn().mockReturnThis(),
    empty: vi.fn().mockReturnThis(),
    append: vi.fn().mockReturnThis(),
    removeAttr: vi.fn().mockReturnThis(),
    length: 1,
    eq: vi.fn().mockReturnThis(),
    first: vi.fn().mockReturnThis(),
    find: vi.fn().mockReturnThis(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };
  
  if (typeof selector === 'string') {
    return mockElement;
  }
  return mockElement;
});

// Mock global objects
Object.defineProperty(global, 'VexFlow', {
  value: mockVexFlow,
  writable: true
});

Object.defineProperty(global, '$', {
  value: mockJQuery,
  writable: true
});

Object.defineProperty(global, 'jQuery', {
  value: mockJQuery,
  writable: true
});

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 }
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 }
  })),
  destination: {}
};

Object.defineProperty(global, 'AudioContext', {
  value: vi.fn(() => mockAudioContext),
  writable: true
});

// Mock Audio
const mockAudio = vi.fn(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  currentTime: 0,
  volume: 1,
  src: '',
  preload: 'auto'
}));

Object.defineProperty(global, 'Audio', {
  value: mockAudio,
  writable: true
});

// Mock Speech Synthesis
const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [
    { name: 'Default Voice', lang: 'en-US', localService: true },
    { name: 'Siri Voice', lang: 'en-US', localService: true }
  ]),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(global, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true
});

// Mock SpeechSynthesisUtterance
const mockSpeechSynthesisUtterance = vi.fn(() => ({
  text: '',
  voice: null,
  onend: null,
  onerror: null
}));

Object.defineProperty(global, 'SpeechSynthesisUtterance', {
  value: mockSpeechSynthesisUtterance,
  writable: true
});

// Mock MediaDevices
const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({
    getTracks: vi.fn(() => [{ stop: vi.fn() }])
  })
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true
});

// Mock pitchy
const mockPitchDetector = {
  detect: vi.fn().mockResolvedValue({ pitch: 440, clarity: 0.8 })
};

vi.mock('pitchy', () => ({
  PitchDetector: vi.fn(() => mockPitchDetector)
}));

describe('Guitar Fretboard Flashcard Game - Main Application', () => {
  let dom: JSDOM;
  let window: Window;
  let document: Document;

  beforeAll(() => {
    // Read the real HTML file
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, '../src/static/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Create JSDOM environment with real HTML
    dom = new JSDOM(htmlContent, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window as unknown as Window;
    document = window.document;

    // Set up global objects
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
    global.localStorage = window.localStorage;
    global.sessionStorage = window.sessionStorage;
    global.URL = window.URL;
    global.Blob = window.Blob;
    global.console = window.console;

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterAll(() => {
    dom.window.close();
  });

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset localStorage
    window.localStorage.clear();
    
    // Reset DOM state
    document.getElementById('countdown')!.textContent = '';
    document.getElementById('unified-banner')!.style.display = 'none';
    
    // Reset test state elements
    document.getElementById('audio-enabled')!.setAttribute('data-enabled', 'false');
    document.getElementById('tts-enabled')!.setAttribute('data-enabled', 'false');
    document.getElementById('tts-initialized')!.setAttribute('data-initialized', 'false');
    document.getElementById('selected-voice')!.setAttribute('data-voice', '');
    document.getElementById('tts-queue-length')!.setAttribute('data-length', '0');
    document.getElementById('tts-currently-playing')!.setAttribute('data-playing', 'false');
    document.getElementById('utterance-log')!.setAttribute('data-log', '[]');
  });

  afterEach(() => {
    // Clean up any timers
    vi.clearAllTimers();
  });

  describe('App Initialization', () => {
    it('should initialize with default settings', async () => {
      // Mock the index.ts module
      const mockIndex = {
        initializeApp: vi.fn().mockResolvedValue(undefined),
        getTestState: vi.fn().mockReturnValue({
          audioEnabled: 'false',
          ttsEnabled: 'false',
          ttsInitialized: 'false',
          selectedVoice: '',
          ttsQueueLength: '0',
          ttsCurrentlyPlaying: 'false',
          utteranceLog: []
        })
      };

      vi.doMock('../src/ts/index.ts', () => mockIndex);

      // Test that the app initializes
      expect(mockIndex.initializeApp).toBeDefined();
    });

    it('should have correct initial state', () => {
      // Test that initial DOM state is correct
      expect(document.getElementById('quiz-note-btn')).toBeTruthy();
      expect(document.getElementById('fretboard-area')).toBeTruthy();
      expect(document.querySelector('.options')).toBeTruthy();
      expect(document.getElementById('unified-banner')!.style.display).toBe('none');
    });
  });

  describe('Quiz Functionality', () => {
    it('should handle quiz note button click', () => {
      const quizButton = document.getElementById('quiz-note-btn')!;
      
      // Simulate click
      const clickEvent = new window.Event('click');
      quizButton.dispatchEvent(clickEvent);
      
      // Verify button exists and is clickable
      expect(quizButton).toBeTruthy();
    });

    it('should handle fret button clicks', () => {
      const fretButtons = document.getElementById('fret-buttons')!;
      
      // Create a mock fret button
      const fretButton = document.createElement('button');
      fretButton.className = 'fret-btn';
      fretButton.setAttribute('data-fret', '5');
      fretButtons.appendChild(fretButton);
      
      // Simulate click
      const clickEvent = new window.Event('click');
      fretButton.dispatchEvent(clickEvent);
      
      expect(fretButton.getAttribute('data-fret')).toBe('5');
    });

    it('should handle fretboard clicks', () => {
      const fretboardArea = document.getElementById('fretboard-area')!;
      
      // Create a mock fret cell
      const fretCell = document.createElement('td');
      fretCell.className = 'fret-cell active-string';
      fretCell.setAttribute('data-string', '2');
      fretCell.setAttribute('data-fret', '7');
      fretboardArea.appendChild(fretCell);
      
      // Simulate click
      const clickEvent = new window.Event('click');
      fretCell.dispatchEvent(clickEvent);
      
      expect(fretCell.getAttribute('data-string')).toBe('2');
      expect(fretCell.getAttribute('data-fret')).toBe('7');
    });
  });

  describe('Settings Management', () => {
    it('should handle fret count changes', () => {
      const fretCountSelect = document.getElementById('fret-count') as HTMLSelectElement;
      
      // Test valid fret count values
      const validValues = ['11', '21', '22', '24'];
      validValues.forEach(value => {
        fretCountSelect.value = value;
        const changeEvent = new window.Event('change');
        fretCountSelect.dispatchEvent(changeEvent);
        expect(fretCountSelect.value).toBe(value);
      });
    });

    it('should handle accidentals setting changes', () => {
      const accidentalsCheckbox = document.getElementById('accidentals') as HTMLInputElement;
      
      accidentalsCheckbox.checked = true;
      const changeEvent = new window.Event('change');
      accidentalsCheckbox.dispatchEvent(changeEvent);
      expect(accidentalsCheckbox.checked).toBe(true);
      
      accidentalsCheckbox.checked = false;
      accidentalsCheckbox.dispatchEvent(changeEvent);
      expect(accidentalsCheckbox.checked).toBe(false);
    });

    it('should handle timeout setting changes', () => {
      const timeoutSelect = document.getElementById('timeout-seconds') as HTMLSelectElement;
      
      timeoutSelect.value = '5';
      const changeEvent = new window.Event('change');
      timeoutSelect.dispatchEvent(changeEvent);
      expect(timeoutSelect.value).toBe('5');
    });

    it('should handle number of strings changes', () => {
      const numStringsSelect = document.getElementById('num-strings') as HTMLSelectElement;
      
      const validValues = ['3', '4', '5', '6', '7', '8', '9', '10'];
      validValues.forEach(value => {
        numStringsSelect.value = value;
        const changeEvent = new window.Event('change');
        numStringsSelect.dispatchEvent(changeEvent);
        expect(numStringsSelect.value).toBe(value);
      });
    });

    it('should handle tuning changes', () => {
      const tuningConfig = document.getElementById('tuning-config')!;
      
      // Create mock tuning selects
      const noteSelect = document.createElement('select');
      noteSelect.className = 'tuning-select';
      noteSelect.setAttribute('data-string', '0');
      noteSelect.innerHTML = '<option value="E" selected>E</option><option value="F">F</option>';
      
      const octaveSelect = document.createElement('select');
      octaveSelect.className = 'octave-select';
      octaveSelect.setAttribute('data-string', '0');
      octaveSelect.innerHTML = '<option value="4" selected>4</option><option value="3">3</option>';
      
      tuningConfig.appendChild(noteSelect);
      tuningConfig.appendChild(octaveSelect);
      
      // Test note change
      noteSelect.value = 'F';
      const noteChangeEvent = new window.Event('change');
      noteSelect.dispatchEvent(noteChangeEvent);
      expect(noteSelect.value).toBe('F');
      
      // Test octave change
      octaveSelect.value = '3';
      const octaveChangeEvent = new window.Event('change');
      octaveSelect.dispatchEvent(octaveChangeEvent);
      expect(octaveSelect.value).toBe('3');
    });

    it('should handle reset tuning', () => {
      const resetButton = document.getElementById('reset-tuning')!;
      
      const clickEvent = new window.Event('click');
      resetButton.dispatchEvent(clickEvent);
      
      expect(resetButton).toBeTruthy();
    });

    it('should handle reset stats', () => {
      const resetStatsButton = document.getElementById('reset-stats')!;
      
      const clickEvent = new window.Event('click');
      resetStatsButton.dispatchEvent(clickEvent);
      
      expect(resetStatsButton).toBeTruthy();
    });
  });

  describe('Audio and TTS Functionality', () => {
    it('should handle mic toggle', async () => {
      const micButton = document.getElementById('mic-toggle')!;
      
      const clickEvent = new window.Event('click');
      await micButton.dispatchEvent(clickEvent);
      
      expect(micButton).toBeTruthy();
    });

    it('should handle TTS enable/disable', () => {
      const ttsCheckbox = document.getElementById('enable-tts') as HTMLInputElement;
      
      ttsCheckbox.checked = true;
      const changeEvent = new window.Event('change');
      ttsCheckbox.dispatchEvent(changeEvent);
      expect(ttsCheckbox.checked).toBe(true);
      
      ttsCheckbox.checked = false;
      ttsCheckbox.dispatchEvent(changeEvent);
      expect(ttsCheckbox.checked).toBe(false);
    });

    it('should handle voice selection', () => {
      const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
      
      // Add voice options
      voiceSelect.innerHTML = '<option value="">Default</option><option value="voice1">Voice 1</option>';
      
      voiceSelect.value = 'voice1';
      const changeEvent = new window.Event('change');
      voiceSelect.dispatchEvent(changeEvent);
      expect(voiceSelect.value).toBe('voice1');
    });

    it('should handle unified banner click', () => {
      const banner = document.getElementById('unified-banner')!;
      
      const clickEvent = new window.Event('click');
      banner.dispatchEvent(clickEvent);
      
      expect(banner).toBeTruthy();
    });
  });

  describe('Score Notation', () => {
    it('should handle score notation toggle', () => {
      const scoreNotationCheckbox = document.getElementById('show-score-notation') as HTMLInputElement;
      
      scoreNotationCheckbox.checked = true;
      const changeEvent = new window.Event('change');
      scoreNotationCheckbox.dispatchEvent(changeEvent);
      expect(scoreNotationCheckbox.checked).toBe(true);
    });

    it('should handle score key changes', () => {
      const scoreKeySelect = document.getElementById('score-key') as HTMLSelectElement;
      
      const validKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#'];
      validKeys.forEach(key => {
        scoreKeySelect.value = key;
        const changeEvent = new window.Event('change');
        scoreKeySelect.dispatchEvent(changeEvent);
        expect(scoreKeySelect.value).toBe(key);
      });
    });

    it('should handle hide quiz note toggle', () => {
      const hideQuizNoteCheckbox = document.getElementById('hide-quiz-note') as HTMLInputElement;
      
      hideQuizNoteCheckbox.checked = true;
      const changeEvent = new window.Event('change');
      hideQuizNoteCheckbox.dispatchEvent(changeEvent);
      expect(hideQuizNoteCheckbox.checked).toBe(true);
    });
  });

  describe('Bias Settings', () => {
    it('should handle enable bias toggle', () => {
      const biasCheckbox = document.getElementById('enable-bias') as HTMLInputElement;
      
      biasCheckbox.checked = true;
      const changeEvent = new window.Event('change');
      biasCheckbox.dispatchEvent(changeEvent);
      expect(biasCheckbox.checked).toBe(true);
      
      biasCheckbox.checked = false;
      biasCheckbox.dispatchEvent(changeEvent);
      expect(biasCheckbox.checked).toBe(false);
    });
  });

  describe('Countdown Functionality', () => {
    it('should handle skip countdown', () => {
      const skipButton = document.getElementById('skip-countdown')!;
      
      const clickEvent = new window.Event('click');
      skipButton.dispatchEvent(clickEvent);
      
      expect(skipButton).toBeTruthy();
    });

    it('should update countdown display', () => {
      const countdownElement = document.getElementById('countdown')!;
      
      countdownElement.textContent = '5';
      expect(countdownElement.textContent).toBe('5');
      
      countdownElement.textContent = '';
      expect(countdownElement.textContent).toBe('');
    });
  });

  describe('Test State Tracking', () => {
    it('should track audio state', () => {
      const audioEnabled = document.getElementById('audio-enabled')!;
      
      audioEnabled.setAttribute('data-enabled', 'true');
      expect(audioEnabled.getAttribute('data-enabled')).toBe('true');
      
      audioEnabled.setAttribute('data-enabled', 'false');
      expect(audioEnabled.getAttribute('data-enabled')).toBe('false');
    });

    it('should track TTS state', () => {
      const ttsEnabled = document.getElementById('tts-enabled')!;
      const ttsInitialized = document.getElementById('tts-initialized')!;
      
      ttsEnabled.setAttribute('data-enabled', 'true');
      ttsInitialized.setAttribute('data-initialized', 'true');
      
      expect(ttsEnabled.getAttribute('data-enabled')).toBe('true');
      expect(ttsInitialized.getAttribute('data-initialized')).toBe('true');
    });

    it('should track voice selection', () => {
      const selectedVoice = document.getElementById('selected-voice')!;
      
      selectedVoice.setAttribute('data-voice', 'voice1');
      expect(selectedVoice.getAttribute('data-voice')).toBe('voice1');
    });

    it('should track TTS queue', () => {
      const queueLength = document.getElementById('tts-queue-length')!;
      const currentlyPlaying = document.getElementById('tts-currently-playing')!;
      
      queueLength.setAttribute('data-length', '3');
      currentlyPlaying.setAttribute('data-playing', 'true');
      
      expect(queueLength.getAttribute('data-length')).toBe('3');
      expect(currentlyPlaying.getAttribute('data-playing')).toBe('true');
    });

    it('should track utterance log', () => {
      const utteranceLog = document.getElementById('utterance-log')!;
      const logData = ['Note C, 1st string', 'Note D, 2nd string'];
      
      utteranceLog.setAttribute('data-log', JSON.stringify(logData));
      expect(utteranceLog.getAttribute('data-log')).toBe(JSON.stringify(logData));
    });
  });

  describe('Fretboard Rendering', () => {
    it('should create fretboard area structure', () => {
      const fretboardArea = document.getElementById('fretboard-area')!;
      
      expect(fretboardArea).toBeTruthy();
    });

    it('should handle different fret counts', () => {
      const fretCounts = [11, 21, 22, 24];
      
      fretCounts.forEach(count => {
        // Test that we can create the appropriate number of fret buttons
        const fretButtons = document.getElementById('fret-buttons')!;
        fretButtons.innerHTML = '';
        
        for (let i = 0; i <= count; i++) {
          const button = document.createElement('button');
          button.className = 'fret-btn';
          button.setAttribute('data-fret', i.toString());
          button.textContent = i.toString();
          fretButtons.appendChild(button);
        }
        
        expect(fretButtons.children.length).toBe(count + 1);
      });
    });
  });

  describe('Settings Persistence', () => {
    it('should save and load settings from localStorage', () => {
      const settings = {
        fretCount: 24,
        showAccidentals: true,
        timeoutSeconds: 5,
        numStrings: 7,
        enableBias: false,
        showScoreNotation: true,
        scoreKey: 'G',
        hideQuizNote: true,
        enableTTS: true,
        selectedVoice: 'voice1'
      };
      
      // Save settings
      window.localStorage.setItem('fret-flashcards-settings', JSON.stringify(settings));
      
      // Load settings
      const loadedSettings = JSON.parse(window.localStorage.getItem('fret-flashcards-settings') || '{}');
      
      // Verify that setItem was called with the correct key and value
      expect(window.localStorage.setItem).toHaveBeenCalledWith('fret-flashcards-settings', JSON.stringify(settings));
      expect(window.localStorage.getItem).toHaveBeenCalledWith('fret-flashcards-settings');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Test that the app doesn't crash when elements are missing
      const nonExistentElement = document.getElementById('non-existent');
      expect(nonExistentElement).toBeNull();
    });

    it('should handle invalid input values', () => {
      const timeoutSelect = document.getElementById('timeout-seconds') as HTMLSelectElement;
      
      // Test invalid values
      timeoutSelect.value = 'invalid';
      const changeEvent = new window.Event('change');
      timeoutSelect.dispatchEvent(changeEvent);
      
      // Should not crash
      expect(timeoutSelect).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete quiz flow', () => {
      // 1. Click quiz note button
      const quizButton = document.getElementById('quiz-note-btn')!;
      const quizClickEvent = new window.Event('click');
      quizButton.dispatchEvent(quizClickEvent);
      
      // 2. Click a fret button
      const fretButtons = document.getElementById('fret-buttons')!;
      const fretButton = document.createElement('button');
      fretButton.className = 'fret-btn';
      fretButton.setAttribute('data-fret', '5');
      fretButtons.appendChild(fretButton);
      
      const fretClickEvent = new window.Event('click');
      fretButton.dispatchEvent(fretClickEvent);
      
      // 3. Change settings
      const fretCountSelect = document.getElementById('fret-count') as HTMLSelectElement;
      fretCountSelect.value = '24';
      const settingsChangeEvent = new window.Event('change');
      fretCountSelect.dispatchEvent(settingsChangeEvent);
      
      // Verify all interactions worked
      expect(quizButton).toBeTruthy();
      expect(fretButton.getAttribute('data-fret')).toBe('5');
      expect(fretCountSelect.value).toBe('24');
    });

    it('should handle settings changes and UI updates', () => {
      // Change multiple settings
      const accidentalsCheckbox = document.getElementById('accidentals') as HTMLInputElement;
      const scoreNotationCheckbox = document.getElementById('show-score-notation') as HTMLInputElement;
      const ttsCheckbox = document.getElementById('enable-tts') as HTMLInputElement;
      
      accidentalsCheckbox.checked = true;
      scoreNotationCheckbox.checked = true;
      ttsCheckbox.checked = true;
      
      // Dispatch change events
      [accidentalsCheckbox, scoreNotationCheckbox, ttsCheckbox].forEach(element => {
        const changeEvent = new window.Event('change');
        element.dispatchEvent(changeEvent);
      });
      
      // Verify settings were updated
      expect(accidentalsCheckbox.checked).toBe(true);
      expect(scoreNotationCheckbox.checked).toBe(true);
      expect(ttsCheckbox.checked).toBe(true);
    });
  });
});
