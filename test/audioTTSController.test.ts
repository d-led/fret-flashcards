import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the modules
const mockTTSManager = {
  isSupported: vi.fn(() => true),
  initialize: vi.fn(() => true),
  updateConfig: vi.fn(),
  addToQueue: vi.fn(),
  clearQueue: vi.fn(),
  getState: vi.fn(() => ({
    enabled: false,
    initialized: false,
    selectedVoice: null,
    queueLength: 0,
    currentlyPlaying: false,
    utteranceLog: [],
  })),
  reset: vi.fn(),
};

const mockAudioManager = {
  initialize: vi.fn(() => Promise.resolve(true)),
  updateConfig: vi.fn(),
  playTone: vi.fn(),
  playClick: vi.fn(),
  getState: vi.fn(() => ({
    enabled: false,
    currentlyPlaying: false,
    isIOS: false,
  })),
  isPlaying: vi.fn(() => false),
  clearResumeTimeout: vi.fn(),
  reset: vi.fn(),
};

const mockSettingsManager = {
  loadSettings: vi.fn(() => true),
  saveSettings: vi.fn(() => true),
  getSettings: vi.fn(() => ({
    fretCount: 11,
    showAccidentals: false,
    timeoutSeconds: 2,
    numStrings: 6,
    tuning: [],
    enableBias: true,
    showScoreNotation: false,
    scoreKey: "C",
    hideQuizNote: false,
    enableTTS: false,
    selectedVoice: null,
  })),
  updateSetting: vi.fn(),
  updateSettings: vi.fn(),
  resetToDefaults: vi.fn(),
};

vi.mock("../src/ts/modules/tts", () => ({
  TTSManager: class MockTTSManager {
    constructor() {
      return mockTTSManager;
    }
  },
  TTS_PRIORITIES: {
    SYSTEM: 1,
    QUIZ_REPEAT: 2,
    OCTAVE_HINT: 3,
    QUIZ_ANNOUNCEMENT: 5,
    STATUS: 10,
    NORMAL: 50,
  },
}));

vi.mock("../src/ts/modules/audio", () => ({
  AudioManager: class MockAudioManager {
    constructor() {
      return mockAudioManager;
    }
  },
  detectIOS: vi.fn(() => false),
}));

vi.mock("../src/ts/modules/settings", () => ({
  SettingsManager: class MockSettingsManager {
    constructor() {
      return mockSettingsManager;
    }
  },
}));

describe("AudioTTSController", () => {
  let controller: any;
  let stateChangeCallback: vi.Mock;
  let config: any;

  beforeEach(async () => {
    stateChangeCallback = vi.fn();
    config = {
      settingsStorageKey: "test-settings",
      defaultSettings: {
        fretCount: 11,
        showAccidentals: false,
        timeoutSeconds: 2,
        numStrings: 6,
        tuning: [],
        enableBias: true,
        showScoreNotation: false,
        scoreKey: "C",
        hideQuizNote: false,
        enableTTS: false,
        selectedVoice: null,
      },
      enableTestStateTracking: true,
    };

    // Import the controller after mocks are set up
    const { AudioTTSController } = await import("../src/ts/modules/audioTTSController");
    controller = new AudioTTSController(config, stateChangeCallback);
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize successfully", async () => {
      const result = await controller.initialize();

      expect(result).toBe(true);
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should not initialize twice", async () => {
      await controller.initialize();
      const result = await controller.initialize();

      expect(result).toBe(true);
    });
  });

  describe("audio management", () => {
    it("should enable audio", async () => {
      const result = await controller.enableAudio();

      expect(result).toBe(true);
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should play tone", () => {
      controller.playTone(440, 0.5);
      // Should not throw error
    });

    it("should play click", () => {
      controller.playClick();
      // Should not throw error
    });

    it("should check if audio is playing", () => {
      const result = controller.isAudioPlaying();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("TTS management", () => {
    it("should enable TTS", async () => {
      const result = await controller.enableTTS();

      expect(result).toBe(true);
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should disable TTS", () => {
      controller.disableTTS();
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should set selected voice", () => {
      controller.setSelectedVoice("test-voice");
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should add to TTS queue", () => {
      controller.addToTTSQueue("test message");
      // Should not throw error
    });

    it("should clear TTS queue", () => {
      controller.clearTTSQueue();
      // Should not throw error
    });

    it("should speak status message", () => {
      controller.speakStatusMessage("test status");
      // Should not throw error
    });

    it("should speak system message", () => {
      controller.speakSystemMessage("test system");
      // Should not throw error
    });

    it("should speak quiz note", () => {
      controller.speakQuizNote("C", 1);
      // Should not throw error
    });

    it("should speak octave hint", () => {
      controller.speakOctaveHint();
      // Should not throw error
    });

    it("should check if TTS is playing", () => {
      const result = controller.isTTSPlaying();
      expect(typeof result).toBe("boolean");
    });

    it("should check if any audio is playing", () => {
      const result = controller.isAnyAudioPlaying();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("settings management", () => {
    it("should get settings", () => {
      const settings = controller.getSettings();
      expect(settings).toEqual({
        fretCount: 11,
        showAccidentals: false,
        timeoutSeconds: 2,
        numStrings: 6,
        tuning: [],
        enableBias: true,
        showScoreNotation: false,
        scoreKey: "C",
        hideQuizNote: false,
        enableTTS: false,
        selectedVoice: null,
      });
    });

    it("should update settings", () => {
      const updates = { fretCount: 24, enableTTS: true };
      controller.updateSettings(updates);

      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should reset to defaults", () => {
      controller.resetToDefaults();
      expect(stateChangeCallback).toHaveBeenCalled();
    });
  });

  describe("state management", () => {
    it("should get current state", () => {
      const state = controller.getState();

      expect(state).toHaveProperty("audio");
      expect(state).toHaveProperty("tts");
      expect(state).toHaveProperty("settings");
      expect(state).toHaveProperty("isInitialized");
    });
  });

  describe("test state tracking", () => {
    it("should set up test state tracking when enabled", () => {
      // Mock DOM elements
      const mockElement = {
        setAttribute: vi.fn(),
      };

      vi.spyOn(document, "getElementById").mockReturnValue(mockElement as any);

      // Trigger state change
      controller.updateSettings({ enableTTS: true });

      // Should not throw error
      expect(document.getElementById).toHaveBeenCalled();
    });
  });
});
