import { describe, it, expect, beforeEach, vi } from "vitest";
import { SettingsManager, DEFAULT_SETTINGS, validateFretCount, validateTimeoutSeconds, validateNumStrings, validateScoreKey, validateTuning } from "../src/ts/modules/settings";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("SettingsManager", () => {
  let settingsManager: SettingsManager;
  let stateChangeCallback: vi.Mock;

  beforeEach(() => {
    stateChangeCallback = vi.fn();
    settingsManager = new SettingsManager("test-settings", DEFAULT_SETTINGS, stateChangeCallback);
    vi.clearAllMocks();
    // Reset localStorage mock to not throw errors
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe("initialization", () => {
    it("should initialize with default settings", () => {
      const state = settingsManager.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
      expect(state.isLoaded).toBe(false);
      expect(state.lastSaved).toBeNull();
    });
  });

  describe("loading settings", () => {
    it("should load settings from localStorage", () => {
      const testSettings = {
        fretCount: 24,
        showAccidentals: true,
        enableTTS: true,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testSettings));

      const result = settingsManager.loadSettings();

      expect(result).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith("test-settings");
      expect(stateChangeCallback).toHaveBeenCalled();

      const state = settingsManager.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.settings.fretCount).toBe(24);
      expect(state.settings.showAccidentals).toBe(true);
    });

    it("should handle missing settings", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = settingsManager.loadSettings();

      expect(result).toBe(false);
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should handle invalid JSON", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      const result = settingsManager.loadSettings();

      expect(result).toBe(false);
    });

    it("should handle backward compatibility with extendedRange", () => {
      const oldSettings = {
        extendedRange: true,
        showAccidentals: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(24);
    });

    it("should convert old fretCount 12 to 11", () => {
      const oldSettings = {
        fretCount: 12,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(11);
    });
  });

  describe("corrupted configuration handling", () => {
    it("should handle invalid fretCount values and use defaults", () => {
      const corruptedSettings = {
        fretCount: 999, // Invalid value
        showAccidentals: true,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(11); // Should use default
      expect(state.settings.showAccidentals).toBe(true); // Valid value should be preserved
    });

    it("should handle negative timeoutSeconds and use defaults", () => {
      const corruptedSettings = {
        timeoutSeconds: -5, // Invalid value
        fretCount: 24,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.timeoutSeconds).toBe(2); // Should use default
      expect(state.settings.fretCount).toBe(24); // Valid value should be preserved
    });

    it("should handle timeoutSeconds above maximum and use defaults", () => {
      const corruptedSettings = {
        timeoutSeconds: 15, // Invalid value (above max 10)
        fretCount: 24,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.timeoutSeconds).toBe(2); // Should use default
      expect(state.settings.fretCount).toBe(24); // Valid value should be preserved
    });

    it("should handle invalid numStrings and use defaults", () => {
      const corruptedSettings = {
        numStrings: 15, // Invalid value (above max 10)
        fretCount: 24,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.numStrings).toBe(6); // Should use default
      expect(state.settings.fretCount).toBe(24); // Valid value should be preserved
    });

    it("should handle invalid tuning array length and use defaults", () => {
      const corruptedSettings = {
        tuning: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          // Missing strings for 6-string guitar
        ],
        fretCount: 24,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.tuning).toEqual(DEFAULT_SETTINGS.tuning); // Should use default
      expect(state.settings.fretCount).toBe(24); // Valid value should be preserved
    });

    it("should handle invalid tuning objects and use defaults", () => {
      const corruptedSettings = {
        tuning: [
          { note: "E", octave: 4 },
          { note: "B" }, // Missing octave
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
        ],
        fretCount: 24,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.tuning).toEqual(DEFAULT_SETTINGS.tuning); // Should use default
      expect(state.settings.fretCount).toBe(24); // Valid value should be preserved
    });

    it("should handle invalid octave values and use defaults", () => {
      const corruptedSettings = {
        tuning: [
          { note: "E", octave: 4 },
          { note: "B", octave: -1 }, // Invalid octave
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
        ],
        fretCount: 24,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.tuning).toEqual(DEFAULT_SETTINGS.tuning); // Should use default
      expect(state.settings.fretCount).toBe(24); // Valid value should be preserved
    });

    it("should handle non-string selectedVoice and use defaults", () => {
      const corruptedSettings = {
        selectedVoice: 123, // Invalid type
        fretCount: 24,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.selectedVoice).toBeNull(); // Should use default
      expect(state.settings.fretCount).toBe(24); // Valid value should be preserved
    });

    it("should handle multiple corrupted values and use appropriate defaults", () => {
      const corruptedSettings = {
        fretCount: 999,
        timeoutSeconds: -5,
        numStrings: 15,
        selectedVoice: 123,
        tuning: [{ note: "E" }], // Invalid tuning
        showAccidentals: true, // Valid value
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      const state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(11); // Default
      expect(state.settings.timeoutSeconds).toBe(2); // Default
      expect(state.settings.numStrings).toBe(6); // Default
      expect(state.settings.selectedVoice).toBeNull(); // Default
      expect(state.settings.tuning).toEqual(DEFAULT_SETTINGS.tuning); // Default
      expect(state.settings.showAccidentals).toBe(true); // Valid value preserved
    });
  });

  describe("saving settings", () => {
    it("should save settings to localStorage", () => {
      const result = settingsManager.saveSettings();

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("test-settings", JSON.stringify(DEFAULT_SETTINGS));
      expect(stateChangeCallback).toHaveBeenCalled();
    });

    it("should handle save errors", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      const result = settingsManager.saveSettings();

      expect(result).toBe(false);
    });
  });

  describe("configuration correction and saving", () => {
    it("should save corrected values after loading corrupted settings", () => {
      // First, load corrupted settings
      const corruptedSettings = {
        fretCount: 999, // Invalid value
        timeoutSeconds: -5, // Invalid value
        numStrings: 15, // Invalid value
        showAccidentals: true, // Valid value
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      // Verify corrupted values were corrected to defaults
      let state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(11); // Corrected to default
      expect(state.settings.timeoutSeconds).toBe(2); // Corrected to default
      expect(state.settings.numStrings).toBe(6); // Corrected to default
      expect(state.settings.showAccidentals).toBe(true); // Valid value preserved

      // Now save the corrected settings
      const result = settingsManager.saveSettings();

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "test-settings",
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          showAccidentals: true, // Only the valid value should be different from defaults
        }),
      );
    });

    it("should save valid settings after loading mixed valid/invalid settings", () => {
      const mixedSettings = {
        fretCount: 24, // Valid value
        timeoutSeconds: 5, // Valid value
        numStrings: 15, // Invalid value - should be corrected
        selectedVoice: "Test Voice", // Valid value
        showAccidentals: false, // Valid value
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mixedSettings));

      settingsManager.loadSettings();

      // Verify only invalid values were corrected
      let state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(24); // Valid value preserved
      expect(state.settings.timeoutSeconds).toBe(5); // Valid value preserved
      expect(state.settings.numStrings).toBe(6); // Invalid value corrected to default
      expect(state.settings.selectedVoice).toBe("Test Voice"); // Valid value preserved
      expect(state.settings.showAccidentals).toBe(false); // Valid value preserved

      // Save the corrected settings
      const result = settingsManager.saveSettings();

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "test-settings",
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          fretCount: 24,
          timeoutSeconds: 5,
          selectedVoice: "Test Voice",
          showAccidentals: false,
        }),
      );
    });

    it("should save all defaults when all loaded values are invalid", () => {
      const allInvalidSettings = {
        fretCount: 999,
        timeoutSeconds: -10,
        numStrings: 0,
        selectedVoice: 123,
        tuning: "invalid",
        // Note: showAccidentals: 'not a boolean' would be converted to true by Boolean()
        // so we'll use a different invalid value that won't be converted
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(allInvalidSettings));

      settingsManager.loadSettings();

      // Verify all values were corrected to defaults
      let state = settingsManager.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);

      // Save the corrected settings
      const result = settingsManager.saveSettings();

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("test-settings", JSON.stringify(DEFAULT_SETTINGS));
    });

    it("should update and save corrected values after manual updates", () => {
      // Load some corrupted settings
      const corruptedSettings = {
        fretCount: 999,
        timeoutSeconds: -5,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(corruptedSettings));

      settingsManager.loadSettings();

      // Manually update some settings
      settingsManager.updateSettings({
        fretCount: 24, // Valid value
        timeoutSeconds: 3, // Valid value
        showAccidentals: true, // New valid value
      });

      // Save the updated settings
      const result = settingsManager.saveSettings();

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "test-settings",
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          fretCount: 24,
          timeoutSeconds: 3,
          showAccidentals: true,
        }),
      );
    });

    it("should handle partial settings updates with validation", () => {
      // Load valid settings first
      const validSettings = {
        fretCount: 24,
        timeoutSeconds: 5,
        showAccidentals: true,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validSettings));

      settingsManager.loadSettings();

      // Update with some invalid values
      settingsManager.updateSettings({
        fretCount: 999, // Invalid - should be rejected
        timeoutSeconds: 3, // Valid
        numStrings: 15, // Invalid - should be rejected
      });

      // The invalid values should be rejected, only valid ones applied
      let state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(24); // Should remain unchanged (invalid value rejected)
      expect(state.settings.timeoutSeconds).toBe(3); // Valid value applied
      expect(state.settings.numStrings).toBe(6); // Should remain default (invalid value rejected)

      // Save the settings
      const result = settingsManager.saveSettings();

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "test-settings",
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          fretCount: 24,
          timeoutSeconds: 3,
          showAccidentals: true,
        }),
      );
    });
  });

  describe("updating settings", () => {
    it("should update single setting", () => {
      settingsManager.updateSetting("fretCount", 24);

      expect(stateChangeCallback).toHaveBeenCalled();
      const state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(24);
    });

    it("should update multiple settings", () => {
      const updates = {
        fretCount: 24,
        showAccidentals: true,
        enableTTS: true,
      };
      settingsManager.updateSettings(updates);

      expect(stateChangeCallback).toHaveBeenCalled();
      const state = settingsManager.getState();
      expect(state.settings.fretCount).toBe(24);
      expect(state.settings.showAccidentals).toBe(true);
      expect(state.settings.enableTTS).toBe(true);
    });
  });

  describe("resetting settings", () => {
    it("should reset to default settings", () => {
      settingsManager.updateSetting("fretCount", 24);
      settingsManager.resetToDefaults(DEFAULT_SETTINGS);

      expect(stateChangeCallback).toHaveBeenCalled();
      const state = settingsManager.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });
  });
});

describe("Settings validation", () => {
  describe("validateFretCount", () => {
    it("should validate correct fret counts", () => {
      expect(validateFretCount(11)).toBe(true);
      expect(validateFretCount(21)).toBe(true);
      expect(validateFretCount(22)).toBe(true);
      expect(validateFretCount(24)).toBe(true);
    });

    it("should reject invalid fret counts", () => {
      expect(validateFretCount(10)).toBe(false);
      expect(validateFretCount(25)).toBe(false);
      expect(validateFretCount(0)).toBe(false);
    });
  });

  describe("validateTimeoutSeconds", () => {
    it("should validate correct timeout values", () => {
      expect(validateTimeoutSeconds(0)).toBe(true);
      expect(validateTimeoutSeconds(5)).toBe(true);
      expect(validateTimeoutSeconds(10)).toBe(true);
    });

    it("should reject invalid timeout values", () => {
      expect(validateTimeoutSeconds(-1)).toBe(false);
      expect(validateTimeoutSeconds(11)).toBe(false);
      expect(validateTimeoutSeconds(NaN)).toBe(false);
    });
  });

  describe("validateNumStrings", () => {
    it("should validate correct string counts", () => {
      expect(validateNumStrings(3)).toBe(true);
      expect(validateNumStrings(6)).toBe(true);
      expect(validateNumStrings(10)).toBe(true);
    });

    it("should reject invalid string counts", () => {
      expect(validateNumStrings(2)).toBe(false);
      expect(validateNumStrings(11)).toBe(false);
      expect(validateNumStrings(0)).toBe(false);
    });
  });

  describe("validateScoreKey", () => {
    it("should validate correct score keys", () => {
      expect(validateScoreKey("C")).toBe(true);
      expect(validateScoreKey("G")).toBe(true);
      expect(validateScoreKey("F#")).toBe(true);
      expect(validateScoreKey("Bb")).toBe(true);
    });

    it("should reject invalid score keys", () => {
      expect(validateScoreKey("X")).toBe(false);
      expect(validateScoreKey("")).toBe(false);
      expect(validateScoreKey("C#")).toBe(true); // Valid key
    });
  });

  describe("validateTuning", () => {
    const validTuning = [
      { note: "E", octave: 4 },
      { note: "B", octave: 3 },
      { note: "G", octave: 3 },
    ];

    it("should validate correct tuning", () => {
      expect(validateTuning(validTuning, 3)).toBe(true);
    });

    it("should reject wrong number of strings", () => {
      expect(validateTuning(validTuning, 4)).toBe(false);
    });

    it("should reject invalid tuning objects", () => {
      const invalidTuning = [
        { note: "E", octave: 4 },
        { note: "B" }, // missing octave
        { note: "G", octave: 3 },
      ];
      expect(validateTuning(invalidTuning, 3)).toBe(false);
    });

    it("should reject invalid octave values", () => {
      const invalidTuning = [
        { note: "E", octave: 4 },
        { note: "B", octave: -1 }, // invalid octave
        { note: "G", octave: 3 },
      ];
      expect(validateTuning(invalidTuning, 3)).toBe(false);
    });
  });
});
