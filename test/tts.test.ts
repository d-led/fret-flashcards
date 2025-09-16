import { describe, it, expect, beforeEach, vi } from "vitest";
import { TTSManager, TTS_PRIORITIES, isTTSSupported, loadVoicesWhenAvailable, SpeechSynthesisWrapper } from "../src/ts/modules/tts";

// Mock SpeechSynthesisWrapper
const mockSpeechSynthesis: SpeechSynthesisWrapper = {
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text: string;
  voice: any = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

// Mock window.speechSynthesis for isTTSSupported function
Object.defineProperty(window, "speechSynthesis", {
  value: mockSpeechSynthesis,
  writable: true,
});

Object.defineProperty(window, "SpeechSynthesisUtterance", {
  value: MockSpeechSynthesisUtterance,
  writable: true,
});

describe("TTSManager", () => {
  let ttsManager: TTSManager;
  let stateChangeCallback: vi.Mock;

  beforeEach(() => {
    stateChangeCallback = vi.fn();
    ttsManager = new TTSManager({ enabled: false, selectedVoice: null }, stateChangeCallback, mockSpeechSynthesis);
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should check TTS support", () => {
      expect(ttsManager.isSupported()).toBe(true);
    });

    it("should initialize TTS", () => {
      const result = ttsManager.initialize();
      expect(result).toBe(true);
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should return false if TTS is not supported", () => {
      // Create a mock that doesn't support TTS by making isSupported return false
      const noTTSManager = new TTSManager({ enabled: false, selectedVoice: null }, stateChangeCallback, mockSpeechSynthesis);

      // Mock the isSupported method to return false
      vi.spyOn(noTTSManager, "isSupported").mockReturnValue(false);

      const result = noTTSManager.initialize();
      expect(result).toBe(false);
    });
  });

  describe("configuration", () => {
    it("should update configuration", () => {
      ttsManager.updateConfig({ enabled: true, selectedVoice: "test-voice" });
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should get current state", () => {
      const state = ttsManager.getState();
      expect(state).toEqual({
        enabled: false,
        initialized: false,
        selectedVoice: null,
        queueLength: 0,
        currentlyPlaying: false,
        utteranceLog: [],
      });
    });
  });

  describe("queue management", () => {
    beforeEach(() => {
      ttsManager.updateConfig({ enabled: true });
      ttsManager.initialize();
    });

    it("should add items to queue with correct priority", () => {
      ttsManager.addToQueue("test1", 10);
      ttsManager.addToQueue("test2", 5);
      ttsManager.addToQueue("test3", 15);

      const state = ttsManager.getState();
      expect(state.queueLength).toBe(2); // Only 2 items because one gets processed immediately
      expect(state.utteranceLog).toEqual(["test1", "test2", "test3"]);
    });

    it("should not add to queue when disabled", () => {
      ttsManager.updateConfig({ enabled: false });
      ttsManager.addToQueue("test");

      const state = ttsManager.getState();
      expect(state.queueLength).toBe(0);
      expect(state.utteranceLog).toHaveLength(0);
    });

    it("should clear queue", () => {
      ttsManager.addToQueue("test1");
      ttsManager.addToQueue("test2");
      ttsManager.clearQueue();

      const state = ttsManager.getState();
      expect(state.queueLength).toBe(0);
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it("should process queue when not playing", () => {
      ttsManager.addToQueue("test");
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe("utterance logging", () => {
    beforeEach(() => {
      ttsManager.updateConfig({ enabled: true, maxLogSize: 3 });
      ttsManager.initialize();
    });

    it("should log utterances", () => {
      ttsManager.addToQueue("test1");
      ttsManager.addToQueue("test2");

      const state = ttsManager.getState();
      expect(state.utteranceLog).toEqual(["test1", "test2"]);
    });

    it("should limit log size", () => {
      for (let i = 0; i < 5; i++) {
        ttsManager.addToQueue(`test${i}`);
      }

      const state = ttsManager.getState();
      expect(state.utteranceLog).toHaveLength(3);
      expect(state.utteranceLog).toEqual(["test2", "test3", "test4"]);
    });
  });

  describe("reset", () => {
    it("should reset to initial state", () => {
      ttsManager.updateConfig({ enabled: true });
      ttsManager.initialize();
      ttsManager.addToQueue("test");

      ttsManager.reset();

      const state = ttsManager.getState();
      expect(state.enabled).toBe(true); // Config should remain
      expect(state.initialized).toBe(false);
      expect(state.queueLength).toBe(0);
      expect(state.utteranceLog).toHaveLength(0);
    });
  });
});

describe("TTS utilities", () => {
  it("should check TTS support", () => {
    expect(isTTSSupported()).toBe(true);
  });

  it("should handle missing speechSynthesis", () => {
    // Since we can't easily mock the global window object, we'll test the logic indirectly
    // by creating a scenario where speechSynthesis is not available
    // We'll use vi.stubGlobal to temporarily replace the window object

    const originalWindow = global.window;
    const mockWindow = { ...window };
    delete (mockWindow as any).speechSynthesis;

    vi.stubGlobal("window", mockWindow);

    expect(isTTSSupported()).toBe(false);

    vi.unstubAllGlobals();
  });

  it("should load voices when available", async () => {
    mockSpeechSynthesis.getVoices.mockReturnValue([{ name: "test-voice", lang: "en-US" }]);

    await new Promise<void>((resolve) => {
      loadVoicesWhenAvailable(() => {
        expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
        resolve();
      }, mockSpeechSynthesis);
    });
  });

  it("should handle voice loading timeout", (done) => {
    mockSpeechSynthesis.getVoices.mockReturnValue([]);

    loadVoicesWhenAvailable(() => {
      done();
    }, mockSpeechSynthesis);

    // Should complete after timeout
    setTimeout(() => {
      done();
    }, 2100);
  }, 3000);
});

describe("TTS voice filtering", () => {
  let ttsManager: TTSManager;
  let stateChangeCallback: vi.Mock;

  beforeEach(() => {
    stateChangeCallback = vi.fn();
    ttsManager = new TTSManager({ enabled: true, selectedVoice: null }, stateChangeCallback, mockSpeechSynthesis);
    ttsManager.initialize();
    vi.clearAllMocks();
  });

  it("should prefer local English voices over network voices", () => {
    const voices = [
      { name: "English (US) - Local", lang: "en-US", localService: true },
      { name: "English (UK) - Network", lang: "en-GB", localService: false },
      { name: "Spanish - Local", lang: "es-ES", localService: true },
      { name: "French - Local", lang: "fr-FR", localService: true },
    ];

    mockSpeechSynthesis.getVoices.mockReturnValue(voices);

    ttsManager.addToQueue("test message");

    // The utterance should be created and voice selection should be tested
    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBe(voices[0]); // Should select the local English voice
  });

  it("should fallback to network English voices if no local English voices", () => {
    const voices = [
      { name: "English (UK) - Network", lang: "en-GB", localService: false },
      { name: "Spanish - Local", lang: "es-ES", localService: true },
      { name: "French - Local", lang: "fr-FR", localService: true },
    ];

    mockSpeechSynthesis.getVoices.mockReturnValue(voices);

    ttsManager.addToQueue("test message");

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBe(voices[0]); // Should select the network English voice
  });

  it("should prefer Siri English voices on iOS", () => {
    // Mock iOS user agent
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      writable: true,
    });
    Object.defineProperty(navigator, "platform", {
      value: "iPhone",
      writable: true,
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      value: 5,
      writable: true,
    });

    const voices = [
      { name: "Siri Voice 1", lang: "en-US", localService: true },
      { name: "Siri Voice 2", lang: "en-US", localService: true },
      { name: "English (US) - Regular", lang: "en-US", localService: true },
    ];

    mockSpeechSynthesis.getVoices.mockReturnValue(voices);

    ttsManager.addToQueue("test message");

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBe(voices[1]); // Should select Siri Voice 2 (matches voice 2 pattern)
  });

  it("should use selected voice if available", () => {
    const voices = [
      { name: "Selected Voice", lang: "en-US", localService: true },
      { name: "Other Voice", lang: "en-US", localService: true },
    ];

    mockSpeechSynthesis.getVoices.mockReturnValue(voices);

    ttsManager.updateConfig({ selectedVoice: "Selected Voice" });
    ttsManager.addToQueue("test message");

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBe(voices[0]); // Should select the specified voice
  });

  it("should fallback to default voice selection if selected voice not found", () => {
    const voices = [
      { name: "Available Voice", lang: "en-US", localService: true },
      { name: "Other Voice", lang: "en-US", localService: true },
    ];

    mockSpeechSynthesis.getVoices.mockReturnValue(voices);

    ttsManager.updateConfig({ selectedVoice: "Non-existent Voice" });
    ttsManager.addToQueue("test message");

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBe(voices[0]); // Should fallback to first available English voice
  });

  it("should handle no English voices available", () => {
    const voices = [
      { name: "Spanish Voice", lang: "es-ES", localService: true },
      { name: "French Voice", lang: "fr-FR", localService: true },
    ];

    mockSpeechSynthesis.getVoices.mockReturnValue(voices);

    ttsManager.addToQueue("test message");

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBeNull(); // Should not set a voice, let browser choose
  });

  it("should handle empty voices array", () => {
    mockSpeechSynthesis.getVoices.mockReturnValue([]);

    ttsManager.addToQueue("test message");

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
    expect(utterance.voice).toBeNull(); // Should not set a voice
  });
});

describe("TTS priorities", () => {
  it("should have correct priority values", () => {
    expect(TTS_PRIORITIES.SYSTEM).toBe(1);
    expect(TTS_PRIORITIES.QUIZ_REPEAT).toBe(2);
    expect(TTS_PRIORITIES.OCTAVE_HINT).toBe(3);
    expect(TTS_PRIORITIES.QUIZ_ANNOUNCEMENT).toBe(5);
    expect(TTS_PRIORITIES.STATUS).toBe(10);
    expect(TTS_PRIORITIES.NORMAL).toBe(50);
  });
});
