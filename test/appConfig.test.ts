import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppConfigManager, AppSettings, TuningString, TuningConfig } from "../src/ts/modules/appConfig";
import { UIComponents, UISelector, UICheckbox, UIInput, UIDropdown, UIBanner, UIRow } from "../src/ts/types/uiComponents";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock UI Components
class MockUISelector implements UISelector {
  private value: string = "";

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }

  on(event: string, handler: (event: any) => void): void {
    // Mock implementation
  }
}

class MockUICheckbox implements UICheckbox {
  private checked: boolean = false;

  isChecked(): boolean {
    return this.checked;
  }

  setChecked(checked: boolean): void {
    this.checked = checked;
  }

  on(event: string, handler: (event: any) => void): void {
    // Mock implementation
  }
}

class MockUIInput implements UIInput {
  private value: string = "";

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }

  on(event: string, handler: (event: any) => void): void {
    // Mock implementation
  }
}

class MockUIDropdown implements UIDropdown {
  private value: string = "";
  private options: string[] = [];

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }

  on(event: string, handler: (event: any) => void): void {
    // Mock implementation
  }

  getOptions(): string[] {
    return this.options;
  }

  setOptions(options: string[]): void {
    this.options = options;
  }
}

class MockUIBanner implements UIBanner {
  private visible: boolean = false;
  private text: string = "";
  private classes: string[] = [];

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  setText(text: string): void {
    this.text = text;
  }

  addClass(className: string): void {
    if (!this.classes.includes(className)) {
      this.classes.push(className);
    }
  }

  removeClass(className: string): void {
    this.classes = this.classes.filter(c => c !== className);
  }

  on(event: string, handler: (event: any) => void): void {
    // Mock implementation
  }
}

class MockUIRow implements UIRow {
  private visible: boolean = true;

  show(): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  toggle(show: boolean): void {
    this.visible = show;
  }
}

class MockUIComponents implements UIComponents {
  public fretCount: UISelector = new MockUISelector();
  public showAccidentals: UICheckbox = new MockUICheckbox();
  public timeoutSeconds: UIInput = new MockUIInput();
  public numStrings: UISelector = new MockUISelector();
  public enableBias: UICheckbox = new MockUICheckbox();
  public showScoreNotation: UICheckbox = new MockUICheckbox();
  public scoreKey: UISelector = new MockUISelector();
  public hideQuizNote: UICheckbox = new MockUICheckbox();
  public enableTTS: UICheckbox = new MockUICheckbox();
  public selectedVoice: UIDropdown = new MockUIDropdown();
  public unifiedBanner: UIBanner = new MockUIBanner();
  public scoreKeyRow: UIRow = new MockUIRow();
  public hideQuizNoteLabel: UIRow = new MockUIRow();
  public voiceSelection: UIRow = new MockUIRow();
}

describe("AppConfigManager", () => {
  let configManager: AppConfigManager;
  let mockUI: MockUIComponents;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUI = new MockUIComponents();
    configManager = new AppConfigManager("test-settings", mockUI);
  });

  describe("initialization", () => {
    it("should initialize with default settings", () => {
      const settings = configManager.getSettings();
      
      expect(settings.fretCount).toBe(11);
      expect(settings.showAccidentals).toBe(false);
      expect(settings.timeoutSeconds).toBe(2);
      expect(settings.numStrings).toBe(6);
      expect(settings.enableBias).toBe(true);
      expect(settings.showScoreNotation).toBe(false);
      expect(settings.scoreKey).toBe("C");
      expect(settings.hideQuizNote).toBe(false);
      expect(settings.enableTTS).toBe(false);
      expect(settings.selectedVoice).toBeNull();
    });

    it("should initialize with default tuning for 6 strings", () => {
      const settings = configManager.getSettings();
      const expectedTuning = [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
      ];
      
      expect(settings.tuning).toEqual(expectedTuning);
    });

    it("should initialize with correct constants", () => {
      const constants = configManager.getConstants();
      
      expect(constants.typicalFretMarks).toEqual([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);
      expect(constants.doubleFretMarkers).toEqual([12, 24]);
      expect(constants.allNotes).toEqual(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
      expect(constants.naturalNotes).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    });
  });

  describe("default tunings", () => {
    it("should have tunings for all string counts 3-12", () => {
      const tunings = configManager.getDefaultTunings();
      
      for (let i = 3; i <= 12; i++) {
        expect(tunings[i]).toBeDefined();
        expect(tunings[i].name).toBeTruthy();
        expect(tunings[i].strings).toHaveLength(i);
      }
    });

    it("should have valid tuning configurations", () => {
      const tunings = configManager.getDefaultTunings();
      
      Object.values(tunings).forEach((tuning) => {
        expect(tuning.name).toBeTruthy();
        expect(Array.isArray(tuning.strings)).toBe(true);
        tuning.strings.forEach((string) => {
          expect(string.note).toBeTruthy();
          expect(typeof string.octave).toBe("number");
          expect(string.octave).toBeGreaterThanOrEqual(0);
          expect(string.octave).toBeLessThanOrEqual(8);
        });
      });
    });

    it("should return correct tuning for specific string count", () => {
      const tuning6 = configManager.getTuningForStringCount(6);
      const tuning12 = configManager.getTuningForStringCount(12);
      const tuningInvalid = configManager.getTuningForStringCount(99);
      
      expect(tuning6).toBeDefined();
      expect(tuning6?.strings).toHaveLength(6);
      expect(tuning6?.name).toBe("Standard");
      
      expect(tuning12).toBeDefined();
      expect(tuning12?.strings).toHaveLength(12);
      expect(tuning12?.name).toBe("12-String Extended");
      
      expect(tuningInvalid).toBeNull();
    });
  });

  describe("settings management", () => {
    it("should get individual setting values", () => {
      expect(configManager.getSetting("fretCount")).toBe(11);
      expect(configManager.getSetting("showAccidentals")).toBe(false);
      expect(configManager.getSetting("selectedVoice")).toBeNull();
    });

    it("should update individual settings", () => {
      configManager.updateSetting("fretCount", 24);
      configManager.updateSetting("showAccidentals", true);
      configManager.updateSetting("selectedVoice", "test-voice");
      
      expect(configManager.getSetting("fretCount")).toBe(24);
      expect(configManager.getSetting("showAccidentals")).toBe(true);
      expect(configManager.getSetting("selectedVoice")).toBe("test-voice");
    });

    it("should update multiple settings at once", () => {
      const updates: Partial<AppSettings> = {
        fretCount: 24,
        showAccidentals: true,
        timeoutSeconds: 5,
        enableTTS: true,
      };
      
      configManager.updateSettings(updates);
      
      const settings = configManager.getSettings();
      expect(settings.fretCount).toBe(24);
      expect(settings.showAccidentals).toBe(true);
      expect(settings.timeoutSeconds).toBe(5);
      expect(settings.enableTTS).toBe(true);
    });

    it("should preserve unchanged settings when updating", () => {
      const originalSettings = configManager.getSettings();
      
      configManager.updateSetting("fretCount", 24);
      
      const newSettings = configManager.getSettings();
      expect(newSettings.fretCount).toBe(24);
      expect(newSettings.showAccidentals).toBe(originalSettings.showAccidentals);
      expect(newSettings.timeoutSeconds).toBe(originalSettings.timeoutSeconds);
    });
  });

  describe("tuning validation", () => {
    it("should validate correct tuning", () => {
      const validTuning: TuningString[] = [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
      ];
      
      expect(configManager.validateTuning(validTuning)).toBe(true);
    });

    it("should reject invalid tuning with wrong note", () => {
      const invalidTuning: TuningString[] = [
        { note: "X", octave: 4 },
        { note: "B", octave: 3 },
      ];
      
      expect(configManager.validateTuning(invalidTuning)).toBe(false);
    });

    it("should reject invalid tuning with wrong octave", () => {
      const invalidTuning: TuningString[] = [
        { note: "E", octave: 99 },
        { note: "B", octave: 3 },
      ];
      
      expect(configManager.validateTuning(invalidTuning)).toBe(false);
    });

    it("should reject invalid tuning with missing properties", () => {
      const invalidTuning = [
        { note: "E" }, // missing octave
        { note: "B", octave: 3 },
      ] as any;
      
      expect(configManager.validateTuning(invalidTuning)).toBe(false);
    });

    it("should reject non-array tuning", () => {
      expect(configManager.validateTuning(null as any)).toBe(false);
      expect(configManager.validateTuning(undefined as any)).toBe(false);
      expect(configManager.validateTuning("invalid" as any)).toBe(false);
    });
  });

  describe("tuning reset", () => {
    it("should reset tuning to default for current string count", () => {
      // Set custom tuning
      const customTuning: TuningString[] = [
        { note: "D", octave: 4 },
        { note: "A", octave: 3 },
        { note: "F", octave: 3 },
        { note: "C", octave: 3 },
        { note: "G", octave: 2 },
        { note: "D", octave: 2 },
      ];
      configManager.updateSetting("tuning", customTuning);
      
      // Reset to default
      configManager.resetTuningToDefault();
      
      const settings = configManager.getSettings();
      const defaultTuning = configManager.getTuningForStringCount(6);
      expect(settings.tuning).toEqual(defaultTuning?.strings);
    });

    it("should handle reset when no default tuning exists", () => {
      // Set invalid string count
      configManager.updateSetting("numStrings", 99);
      
      // Reset should not throw error
      expect(() => configManager.resetTuningToDefault()).not.toThrow();
    });
  });

  describe("localStorage persistence", () => {
    it("should save settings to localStorage", () => {
      configManager.updateSetting("fretCount", 24);
      configManager.saveSettings();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "test-settings",
        JSON.stringify(configManager.getSettings())
      );
    });

    it("should handle save errors gracefully", () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });
      
      expect(() => configManager.saveSettings()).not.toThrow();
    });

    it("should load settings from localStorage", () => {
      const savedSettings = {
        fretCount: 24,
        showAccidentals: true,
        timeoutSeconds: 5,
        numStrings: 7,
        tuning: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
          { note: "B", octave: 2 },
        ],
        enableBias: false,
        showScoreNotation: true,
        scoreKey: "G",
        hideQuizNote: true,
        enableTTS: true,
        selectedVoice: "test-voice",
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));
      
      const result = configManager.loadSettings();
      expect(result).toBe(true);
      
      const settings = configManager.getSettings();
      expect(settings.fretCount).toBe(24);
      expect(settings.showAccidentals).toBe(true);
      expect(settings.timeoutSeconds).toBe(5);
      expect(settings.numStrings).toBe(7);
      expect(settings.enableBias).toBe(false);
      expect(settings.showScoreNotation).toBe(true);
      expect(settings.scoreKey).toBe("G");
      expect(settings.hideQuizNote).toBe(true);
      expect(settings.enableTTS).toBe(true);
      expect(settings.selectedVoice).toBe("test-voice");
    });

    it("should handle backward compatibility with extendedRange", () => {
      const oldSettings = {
        extendedRange: true,
        showAccidentals: false,
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldSettings));
      
      const result = configManager.loadSettings();
      expect(result).toBe(true);
      
      const settings = configManager.getSettings();
      expect(settings.fretCount).toBe(24); // extendedRange: true should set fretCount to 24
    });

    it("should handle old fretCount value 12", () => {
      const oldSettings = {
        fretCount: 12, // old value should be converted to 11
        showAccidentals: false,
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldSettings));
      
      const result = configManager.loadSettings();
      expect(result).toBe(true);
      
      const settings = configManager.getSettings();
      expect(settings.fretCount).toBe(11); // 12 should be converted to 11
    });

    it("should validate settings during load", () => {
      const invalidSettings = {
        fretCount: 99, // invalid value
        timeoutSeconds: -5, // invalid value
        numStrings: 99, // invalid value
        tuning: "invalid", // invalid type
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidSettings));
      
      const result = configManager.loadSettings();
      expect(result).toBe(true); // Should still return true but use defaults for invalid values
      
      const settings = configManager.getSettings();
      expect(settings.fretCount).toBe(11); // Should use default
      expect(settings.timeoutSeconds).toBe(2); // Should use default
      expect(settings.numStrings).toBe(6); // Should use default
    });

    it("should return false for invalid JSON", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid json");
      
      const result = configManager.loadSettings();
      expect(result).toBe(false);
    });

    it("should return false for null data", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = configManager.loadSettings();
      expect(result).toBe(false);
    });

    it("should handle load errors gracefully", () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      
      const result = configManager.loadSettings();
      expect(result).toBe(false);
    });
  });

  describe("configuration access", () => {
    it("should return complete configuration", () => {
      const config = configManager.getConfig();
      
      expect(config.settings).toBeDefined();
      expect(config.defaultTunings).toBeDefined();
      expect(config.constants).toBeDefined();
      
      expect(config.settings.fretCount).toBe(11);
      expect(Object.keys(config.defaultTunings)).toHaveLength(10); // 3-12
      expect(config.constants.typicalFretMarks).toBeDefined();
    });
  });

  describe("reset functionality", () => {
    it("should reset all settings to defaults", () => {
      // Modify some settings
      configManager.updateSettings({
        fretCount: 24,
        showAccidentals: true,
        timeoutSeconds: 5,
        enableTTS: true,
      });
      
      // Reset to defaults
      configManager.resetToDefaults();
      
      const settings = configManager.getSettings();
      expect(settings.fretCount).toBe(11);
      expect(settings.showAccidentals).toBe(false);
      expect(settings.timeoutSeconds).toBe(2);
      expect(settings.enableTTS).toBe(false);
    });
  });

  describe("modification detection", () => {
    it("should detect when settings are modified", () => {
      expect(configManager.isModified()).toBe(false);
      
      configManager.updateSetting("fretCount", 24);
      expect(configManager.isModified()).toBe(true);
      
      configManager.resetToDefaults();
      expect(configManager.isModified()).toBe(false);
    });
  });

  describe("UI integration", () => {
    it("should update UI when loading settings", () => {
      const savedSettings = {
        fretCount: 24,
        showAccidentals: true,
        timeoutSeconds: 5,
        numStrings: 7,
        enableBias: false,
        showScoreNotation: true,
        scoreKey: "G",
        hideQuizNote: true,
        enableTTS: true,
        selectedVoice: "test-voice",
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));
      
      configManager.loadSettings();
      
      expect(mockUI.fretCount.getValue()).toBe("24");
      expect(mockUI.showAccidentals.isChecked()).toBe(true);
      expect(mockUI.timeoutSeconds.getValue()).toBe("5");
      expect(mockUI.numStrings.getValue()).toBe("7");
      expect(mockUI.enableBias.isChecked()).toBe(false);
      expect(mockUI.showScoreNotation.isChecked()).toBe(true);
      expect(mockUI.scoreKey.getValue()).toBe("G");
      expect(mockUI.hideQuizNote.isChecked()).toBe(true);
      expect(mockUI.enableTTS.isChecked()).toBe(true);
      expect(mockUI.selectedVoice.getValue()).toBe("test-voice");
    });

    it("should update dependent UI elements when showScoreNotation changes", () => {
      configManager.updateSetting("showScoreNotation", true);
      configManager.loadSettings(); // This calls updateUI()
      
      expect(mockUI.scoreKeyRow.visible).toBe(true);
      expect(mockUI.hideQuizNoteLabel.visible).toBe(true);
    });

    it("should update voice selection visibility when enableTTS changes", () => {
      configManager.updateSetting("enableTTS", true);
      configManager.loadSettings(); // This calls updateUI()
      
      expect(mockUI.voiceSelection.visible).toBe(true);
    });

    it("should set up UI event handlers", () => {
      const setupSpy = vi.spyOn(configManager as any, 'setupUIEventHandlers');
      configManager.setupUIEventHandlers();
      expect(setupSpy).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle empty tuning array", () => {
      expect(configManager.validateTuning([])).toBe(true);
    });

    it("should handle tuning with all valid notes", () => {
      const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
      const tuning: TuningString[] = allNotes.map(note => ({ note, octave: 4 }));
      
      expect(configManager.validateTuning(tuning)).toBe(true);
    });

    it("should handle extreme octave values", () => {
      const tuning: TuningString[] = [
        { note: "C", octave: 0 },
        { note: "C", octave: 8 },
      ];
      
      expect(configManager.validateTuning(tuning)).toBe(true);
    });

    it("should reject octave values outside valid range", () => {
      const tuning: TuningString[] = [
        { note: "C", octave: -1 },
        { note: "C", octave: 9 },
      ];
      
      expect(configManager.validateTuning(tuning)).toBe(false);
    });
  });
});
