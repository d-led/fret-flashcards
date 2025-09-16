import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioManager, detectIOS, detectMacOS, detectBrowser, detectBrave, midiToFreq } from "../src/ts/modules/audio";

// Mock Audio constructor
class MockAudio {
  src: string = "";
  volume: number = 1;
  preload: string = "auto";
  currentTime: number = 0;
  play: vi.Mock = vi.fn();
  pause: vi.Mock = vi.fn();

  constructor() {
    this.play.mockResolvedValue(undefined);
  }
}

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn((blob) => `blob:${Math.random()}`);
Object.defineProperty(URL, "createObjectURL", {
  value: mockCreateObjectURL,
  writable: true,
});

// Mock window.Audio
Object.defineProperty(window, "Audio", {
  value: MockAudio,
  writable: true,
});

describe("AudioManager", () => {
  let audioManager: AudioManager;
  let stateChangeCallback: vi.Mock;

  beforeEach(() => {
    stateChangeCallback = vi.fn();
    audioManager = new AudioManager({ enabled: false, isIOS: false }, stateChangeCallback);
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize audio successfully", async () => {
      const result = await audioManager.initialize();
      expect(result).toBe(true);
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should handle initialization errors", async () => {
      // Create a new manager for this test
      const errorManager = new AudioManager(
        { enabled: false, isIOS: true }, // Set isIOS to true to trigger error path
        stateChangeCallback,
      );

      // Mock Audio to throw error
      const originalAudio = window.Audio;
      // @ts-ignore
      window.Audio = vi.fn(() => {
        throw new Error("Audio creation failed");
      });

      const result = await errorManager.initialize();
      expect(result).toBe(false);

      // Restore original Audio
      window.Audio = originalAudio;
    });
  });

  describe("configuration", () => {
    it("should update configuration", () => {
      audioManager.updateConfig({ enabled: true, isIOS: true });
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should get current state", () => {
      const state = audioManager.getState();
      expect(state).toEqual({
        enabled: false,
        currentlyPlaying: false,
        isIOS: false,
      });
    });
  });

  describe("tone playback", () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it("should play tone when enabled", () => {
      // Mock successful audio creation
      const mockAudio = {
        src: "",
        volume: 1,
        preload: "auto",
        currentTime: 0,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
      };

      // @ts-ignore
      window.Audio = vi.fn(() => mockAudio);

      audioManager.playTone(440, 0.5);

      const state = audioManager.getState();
      expect(state.currentlyPlaying).toBe(true);
    });

    it("should not play tone when disabled", () => {
      audioManager.updateConfig({ enabled: false });
      audioManager.playTone(440, 0.5);

      const state = audioManager.getState();
      expect(state.currentlyPlaying).toBe(false);
    });

    it("should play click sound", () => {
      // Mock successful audio creation
      const mockAudio = {
        src: "",
        volume: 1,
        preload: "auto",
        currentTime: 0,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
      };

      // @ts-ignore
      window.Audio = vi.fn(() => mockAudio);

      audioManager.playClick();
      // Should not throw error
    });
  });

  describe("state management", () => {
    it("should track playing state", () => {
      expect(audioManager.isPlaying()).toBe(false);
    });

    it("should clear resume timeout", () => {
      audioManager.clearResumeTimeout();
      // Should not throw error
    });

    it("should reset to initial state", () => {
      audioManager.updateConfig({ enabled: true });
      audioManager.reset();

      const state = audioManager.getState();
      expect(state.enabled).toBe(true); // Config should remain
      expect(state.currentlyPlaying).toBe(false);
    });
  });
});

describe("Audio utilities", () => {
  describe("platform detection", () => {
    it("should detect iOS", () => {
      // Mock iOS user agent
      Object.defineProperty(navigator, "userAgent", {
        value: "iPhone",
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

      expect(detectIOS()).toBe(true);
    });

    it("should detect macOS", () => {
      Object.defineProperty(navigator, "platform", {
        value: "MacIntel",
        writable: true,
      });
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: 0,
        writable: true,
      });
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        writable: true,
      });

      expect(detectMacOS()).toBe(true);
    });

    it("should detect browsers", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        writable: true,
      });

      expect(detectBrowser()).toBe("chrome");
    });

    it("should detect Brave browser", () => {
      // Mock Brave-specific property
      (navigator as any).brave = {};
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        writable: true,
      });

      expect(detectBrave()).toBe(true);
    });
  });

  describe("frequency utilities", () => {
    it("should convert MIDI to frequency", () => {
      expect(midiToFreq(69)).toBeCloseTo(440, 1); // A4
      expect(midiToFreq(60)).toBeCloseTo(261.63, 1); // C4
      expect(midiToFreq(72)).toBeCloseTo(523.25, 1); // C5
    });
  });
});
