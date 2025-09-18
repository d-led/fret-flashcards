// Settings Module
// Provides a clean, unit-testable interface for settings management

export interface AppSettings {
  fretCount: number;
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

export interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  lastSaved: number | null;
}

export class SettingsManager {
  private settings: AppSettings;
  private isLoaded = false;
  private lastSaved: number | null = null;
  private storageKey: string;
  private onStateChange?: (state: SettingsState) => void;

  constructor(storageKey: string, defaultSettings: AppSettings, onStateChange?: (state: SettingsState) => void) {
    this.storageKey = storageKey;
    this.settings = { ...defaultSettings };
    this.onStateChange = onStateChange;
  }

  // Load settings from localStorage
  loadSettings(): boolean {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        this.isLoaded = true;
        this.notifyStateChange();
        return false;
      }

      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object") {
        this.isLoaded = true;
        this.notifyStateChange();
        return false;
      }

      // Apply loaded settings with validation
      this.applySettings(parsed);
      this.isLoaded = true;
      this.notifyStateChange();
      return true;
    } catch (e) {
      console.error("Failed to load settings:", e);
      this.isLoaded = true;
      this.notifyStateChange();
      return false;
    }
  }

  // Save settings to localStorage
  saveSettings(): boolean {
    try {
      const settingsJson = JSON.stringify(this.settings);
      localStorage.setItem(this.storageKey, settingsJson);
      this.lastSaved = Date.now();
      this.notifyStateChange();
      return true;
    } catch (e) {
      console.error("Failed to save settings:", e);
      return false;
    }
  }

  // Get current settings
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  // Update specific setting
  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
    this.notifyStateChange();
  }

  // Update multiple settings at once
  updateSettings(updates: Partial<AppSettings>): void {
    // Apply updates with validation
    const validatedUpdates: Partial<AppSettings> = {};

    for (const [key, value] of Object.entries(updates)) {
      const settingKey = key as keyof AppSettings;

      // Validate each setting value
      if (this.validateSettingValue(settingKey, value)) {
        validatedUpdates[settingKey] = value;
      }
    }

    this.settings = { ...this.settings, ...validatedUpdates };
    this.notifyStateChange();
  }

  // Validate a single setting value
  private validateSettingValue<K extends keyof AppSettings>(key: K, value: AppSettings[K]): boolean {
    switch (key) {
      case "fretCount":
        return validateFretCount(value as number);
      case "timeoutSeconds":
        return validateTimeoutSeconds(value as number);
      case "numStrings":
        return validateNumStrings(value as number);
      case "scoreKey":
        return validateScoreKey(value as string);
      case "tuning":
        return validateTuning(value as Array<{ note: string; octave: number }>, this.settings.numStrings);
      case "selectedVoice":
        return typeof value === "string" || value === null;
      default:
        return true; // For boolean and other simple types, accept any value
    }
  }

  // Reset to default settings
  resetToDefaults(defaultSettings: AppSettings): void {
    this.settings = { ...defaultSettings };
    this.notifyStateChange();
  }

  // Get current state
  getState(): SettingsState {
    return {
      settings: this.getSettings(),
      isLoaded: this.isLoaded,
      lastSaved: this.lastSaved,
    };
  }

  // Apply settings with validation
  private applySettings(loadedSettings: any): void {
    // Handle backward compatibility with extendedRange
    if ("extendedRange" in loadedSettings) {
      this.settings.fretCount = loadedSettings.extendedRange ? 24 : 11;
    } else if ("fretCount" in loadedSettings) {
      let val = Number(loadedSettings.fretCount);
      // Accept both old (12) and new (11) values for basics mode for compatibility
      if (val === 12) val = 11; // Convert old 12 to new 11
      if (val === 11 || val === 21 || val === 22 || val === 24) {
        this.settings.fretCount = val;
      }
    }

    if ("showAccidentals" in loadedSettings) {
      this.settings.showAccidentals = Boolean(loadedSettings.showAccidentals);
    }

    if ("timeoutSeconds" in loadedSettings) {
      let val = Number(loadedSettings.timeoutSeconds);
      if (isFinite(val) && val >= 0 && val <= 10) {
        this.settings.timeoutSeconds = val;
      }
    }

    if ("numStrings" in loadedSettings) {
      let val = Number(loadedSettings.numStrings);
      if (val >= 3 && val <= 10) {
        this.settings.numStrings = val;
      }
    }

    if ("tuning" in loadedSettings && Array.isArray(loadedSettings.tuning) && loadedSettings.tuning.length === this.settings.numStrings) {
      // Validate that each tuning element has note and octave, and octave is valid
      if (
        loadedSettings.tuning.every(
          (t: unknown) => t && typeof (t as any).note === "string" && typeof (t as any).octave === "number" && Number.isFinite((t as any).octave) && (t as any).octave >= 0 && (t as any).octave <= 8,
        )
      ) {
        this.settings.tuning = loadedSettings.tuning.slice();
      }
    }

    if ("enableBias" in loadedSettings) {
      this.settings.enableBias = Boolean(loadedSettings.enableBias);
    }

    if ("showScoreNotation" in loadedSettings) {
      this.settings.showScoreNotation = Boolean(loadedSettings.showScoreNotation);
    }

    if ("scoreKey" in loadedSettings) {
      this.settings.scoreKey = String(loadedSettings.scoreKey);
    }

    if ("hideQuizNote" in loadedSettings) {
      this.settings.hideQuizNote = Boolean(loadedSettings.hideQuizNote);
    }

    if ("enableTTS" in loadedSettings) {
      this.settings.enableTTS = Boolean(loadedSettings.enableTTS);
    }

    if ("selectedVoice" in loadedSettings && typeof loadedSettings.selectedVoice === "string") {
      this.settings.selectedVoice = loadedSettings.selectedVoice;
    }
  }

  // Notify state change
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  fretCount: 11,
  showAccidentals: false,
  timeoutSeconds: 2,
  numStrings: 6,
  tuning: [
    { note: "E", octave: 4 },
    { note: "B", octave: 3 },
    { note: "G", octave: 3 },
    { note: "D", octave: 3 },
    { note: "A", octave: 2 },
    { note: "E", octave: 2 },
  ],
  enableBias: true,
  showScoreNotation: false,
  scoreKey: "C",
  hideQuizNote: false,
  enableTTS: false,
  selectedVoice: null,
  micSensitivity: 0.5, // 0.0 = very sensitive, 1.0 = less sensitive
  micClarityThreshold: 0.3, // Minimum clarity required for pitch detection (0.0-1.0)
  micNoiseFloor: 0.0005, // RMS threshold below which input is considered silence
};

// Settings validation utilities
export function validateFretCount(value: number): boolean {
  return [11, 21, 22, 24].includes(value);
}

export function validateMicSensitivity(value: number): boolean {
  return value >= 0.0 && value <= 1.0;
}

export function validateMicClarityThreshold(value: number): boolean {
  return value >= 0.0 && value <= 1.0;
}

export function validateMicNoiseFloor(value: number): boolean {
  return value >= 0.0001 && value <= 0.01;
}

export function validateTimeoutSeconds(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 10;
}

export function validateNumStrings(value: number): boolean {
  return Number.isFinite(value) && value >= 3 && value <= 10;
}

export function validateScoreKey(value: string): boolean {
  const validKeys = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
  return validKeys.includes(value);
}

export function validateTuning(tuning: Array<{ note: string; octave: number }>, numStrings: number): boolean {
  if (!Array.isArray(tuning) || tuning.length !== numStrings) {
    return false;
  }

  return tuning.every((t) => t && typeof t.note === "string" && typeof t.octave === "number" && Number.isFinite(t.octave) && t.octave >= 0 && t.octave <= 8);
}
