/**
 * Application Configuration Module
 * Handles all application settings, tuning configurations, and persistence
 * Follows Single Responsibility Principle - only manages application configuration
 */

import { UIComponents } from "../types/uiComponents";

export interface TuningString {
  note: string;
  octave: number;
}

export interface TuningConfig {
  name: string;
  strings: TuningString[];
}

export interface AppSettings {
  fretCount: number;
  showAccidentals: boolean;
  timeoutSeconds: number;
  numStrings: number;
  tuning: TuningString[];
  enableBias: boolean;
  showScoreNotation: boolean;
  scoreKey: string;
  hideQuizNote: boolean;
  enableTTS: boolean;
  selectedVoice: string | null;
}

export interface AppConfig {
  settings: AppSettings;
  defaultTunings: Record<number, TuningConfig>;
  constants: {
    typicalFretMarks: number[];
    doubleFretMarkers: number[];
    allNotes: string[];
    naturalNotes: string[];
    flatNotes: string[];
    sharpNotes: string[];
  };
}

export class AppConfigManager {
  private settings: AppSettings;
  private defaultTunings: Record<number, TuningConfig>;
  private constants: AppConfig["constants"];
  private settingsKey: string;
  private ui: UIComponents | null = null;
  private onSettingsChange: (() => void) | null = null;
  private onTTSChange: (() => void) | null = null;

  constructor(settingsKey: string = "guitar_flashcard_settings_v1", ui?: UIComponents) {
    this.settingsKey = settingsKey;
    this.ui = ui || null;
    this.constants = this.createConstants();
    this.defaultTunings = this.createDefaultTunings();
    this.settings = this.createDefaultSettings();
  }

  /**
   * Set callback for when settings change
   */
  public setOnSettingsChange(callback: () => void): void {
    this.onSettingsChange = callback;
  }

  /**
   * Set callback for when TTS settings change
   */
  public setOnTTSChange(callback: () => void): void {
    this.onTTSChange = callback;
  }

  /**
   * Create default application settings
   */
  private createDefaultSettings(): AppSettings {
    return {
      fretCount: 11,
      showAccidentals: false,
      timeoutSeconds: 2,
      numStrings: 6,
      tuning: this.defaultTunings[6].strings.slice(),
      enableBias: true,
      showScoreNotation: false,
      scoreKey: "C",
      hideQuizNote: false,
      enableTTS: false,
      selectedVoice: null,
    };
  }

  /**
   * Create application constants
   */
  private createConstants(): AppConfig["constants"] {
    return {
      typicalFretMarks: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
      doubleFretMarkers: [12, 24],
      allNotes: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
      naturalNotes: ["C", "D", "E", "F", "G", "A", "B"],
      flatNotes: ["Db", "Eb", "Gb", "Ab", "Bb"],
      sharpNotes: ["C#", "D#", "F#", "G#", "A#"],
    };
  }

  /**
   * Create default tunings for different string counts
   */
  private createDefaultTunings(): Record<number, TuningConfig> {
    return {
      3: {
        name: "Kids guitar",
        strings: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
        ],
      },
      4: {
        name: "Mandolin",
        strings: [
          { note: "E", octave: 4 },
          { note: "A", octave: 3 },
          { note: "D", octave: 3 },
          { note: "G", octave: 2 },
        ],
      },
      5: {
        name: "Open G",
        strings: [
          { note: "D", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "G", octave: 2 },
        ],
      },
      6: {
        name: "Standard",
        strings: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
        ],
      },
      7: {
        name: "7-String Standard",
        strings: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
          { note: "B", octave: 2 },
        ],
      },
      8: {
        name: "8-String Standard",
        strings: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
          { note: "B", octave: 2 },
          { note: "F#", octave: 2 },
        ],
      },
      9: {
        name: "9-String Extended",
        strings: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
          { note: "B", octave: 2 },
          { note: "F#", octave: 2 },
          { note: "C#", octave: 2 },
        ],
      },
      10: {
        name: "10-String Extended",
        strings: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
          { note: "B", octave: 2 },
          { note: "F#", octave: 2 },
          { note: "C#", octave: 2 },
          { note: "G#", octave: 1 },
        ],
      },
      11: {
        name: "11-String Extended",
        strings: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
          { note: "B", octave: 2 },
          { note: "F#", octave: 2 },
          { note: "C#", octave: 2 },
          { note: "G#", octave: 1 },
          { note: "D#", octave: 1 },
        ],
      },
      12: {
        name: "12-String Extended",
        strings: [
          { note: "E", octave: 4 },
          { note: "B", octave: 3 },
          { note: "G", octave: 3 },
          { note: "D", octave: 3 },
          { note: "A", octave: 2 },
          { note: "E", octave: 2 },
          { note: "B", octave: 2 },
          { note: "F#", octave: 2 },
          { note: "C#", octave: 2 },
          { note: "G#", octave: 1 },
          { note: "D#", octave: 1 },
          { note: "A#", octave: 1 },
        ],
      },
    };
  }

  /**
   * Get current settings
   */
  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Get a specific setting value
   */
  public getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * Update a specific setting
   */
  public updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
  }

  /**
   * Update multiple settings at once
   */
  public updateSettings(updates: Partial<AppSettings>): void {
    Object.assign(this.settings, updates);
  }

  /**
   * Get default tunings
   */
  public getDefaultTunings(): Record<number, TuningConfig> {
    return { ...this.defaultTunings };
  }

  /**
   * Get tuning for a specific string count
   */
  public getTuningForStringCount(stringCount: number): TuningConfig | null {
    return this.defaultTunings[stringCount] || null;
  }

  /**
   * Get application constants
   */
  public getConstants(): AppConfig["constants"] {
    return { ...this.constants };
  }

  /**
   * Validate tuning configuration
   */
  public validateTuning(tuning: TuningString[]): boolean {
    if (!Array.isArray(tuning)) return false;

    return tuning.every((t) => t && typeof t.note === "string" && typeof t.octave === "number" && this.constants.allNotes.includes(t.note) && t.octave >= 0 && t.octave <= 8);
  }

  /**
   * Reset tuning to default for current string count
   */
  public resetTuningToDefault(): void {
    const defaultTuning = this.getTuningForStringCount(this.settings.numStrings);
    if (defaultTuning) {
      this.settings.tuning = defaultTuning.strings.slice();
    }
  }

  /**
   * Save settings to localStorage
   */
  public saveSettings(): void {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }

  /**
   * Load settings from localStorage
   */
  public loadSettings(): boolean {
    try {
      const raw = localStorage.getItem(this.settingsKey);
      if (!raw) return false;

      const settings = JSON.parse(raw);
      if (typeof settings !== "object") return false;

      // Handle backward compatibility with extendedRange
      if ("extendedRange" in settings) {
        this.settings.fretCount = settings.extendedRange ? 24 : 11;
      } else if ("fretCount" in settings) {
        let val = Number(settings.fretCount);
        // Accept both old (12) and new (11) values for basics mode for compatibility
        if (val === 12) val = 11;
        if (val === 11 || val === 21 || val === 22 || val === 24) {
          this.settings.fretCount = val;
        }
      }

      // Load other settings with validation
      if ("showAccidentals" in settings) {
        this.settings.showAccidentals = Boolean(settings.showAccidentals);
      }

      if ("timeoutSeconds" in settings) {
        const val = Number(settings.timeoutSeconds);
        if (isFinite(val) && val >= 0 && val <= 10) {
          this.settings.timeoutSeconds = val;
        }
      }

      if ("numStrings" in settings) {
        const val = Number(settings.numStrings);
        if (val >= 3 && val <= 12) {
          this.settings.numStrings = val;
        }
      }

      if ("tuning" in settings && Array.isArray(settings.tuning) && settings.tuning.length === this.settings.numStrings) {
        if (this.validateTuning(settings.tuning)) {
          this.settings.tuning = settings.tuning.slice();
        } else {
          this.resetTuningToDefault();
        }
      } else {
        this.resetTuningToDefault();
      }

      if ("enableBias" in settings) {
        this.settings.enableBias = Boolean(settings.enableBias);
      }

      if ("showScoreNotation" in settings) {
        this.settings.showScoreNotation = Boolean(settings.showScoreNotation);
      }

      if ("scoreKey" in settings && typeof settings.scoreKey === "string") {
        this.settings.scoreKey = settings.scoreKey;
      }

      if ("hideQuizNote" in settings) {
        this.settings.hideQuizNote = Boolean(settings.hideQuizNote);
      }

      if ("enableTTS" in settings) {
        this.settings.enableTTS = Boolean(settings.enableTTS);
      }

      if ("selectedVoice" in settings && typeof settings.selectedVoice === "string") {
        this.settings.selectedVoice = settings.selectedVoice;
      }

      // Update UI if available
      this.updateUI();

      return true;
    } catch (error) {
      console.error("Failed to load settings:", error);
      return false;
    }
  }

  /**
   * Update UI components with current settings
   */
  private updateUI(): void {
    if (!this.ui) return;

    this.ui.fretCount.setValue(this.settings.fretCount.toString());
    this.ui.showAccidentals.setChecked(this.settings.showAccidentals);
    this.ui.timeoutSeconds.setValue(this.settings.timeoutSeconds.toString());
    this.ui.numStrings.setValue(this.settings.numStrings.toString());
    this.ui.enableBias.setChecked(this.settings.enableBias);
    this.ui.showScoreNotation.setChecked(this.settings.showScoreNotation);
    this.ui.scoreKey.setValue(this.settings.scoreKey);
    this.ui.hideQuizNote.setChecked(this.settings.hideQuizNote);
    this.ui.enableTTS.setChecked(this.settings.enableTTS);
    this.ui.selectedVoice.setValue(this.settings.selectedVoice || "");

    // Update dependent UI elements
    this.ui.scoreKeyRow.toggle(this.settings.showScoreNotation);
    this.ui.hideQuizNoteLabel.toggle(this.settings.showScoreNotation);

    // Update voice selection visibility
    this.ui.voiceSelection.toggle(this.settings.enableTTS);
  }

  /**
   * Force update UI components (public method)
   */
  public forceUpdateUI(): void {
    this.updateUI();
  }

  /**
   * Get the complete configuration
   */
  public getConfig(): AppConfig {
    return {
      settings: this.getSettings(),
      defaultTunings: this.getDefaultTunings(),
      constants: this.getConstants(),
    };
  }

  /**
   * Reset all settings to defaults
   */
  public resetToDefaults(): void {
    this.settings = this.createDefaultSettings();
  }

  /**
   * Check if a setting has been modified from default
   */
  public isModified(): boolean {
    const defaults = this.createDefaultSettings();
    return JSON.stringify(this.settings) !== JSON.stringify(defaults);
  }

  /**
   * Set up UI event handlers
   */
  public setupUIEventHandlers(): void {
    if (!this.ui) return;

    // Fret count change
    this.ui.fretCount.on("change", (event) => {
      const val = Number((event.target as HTMLSelectElement).value);
      if (val === 11 || val === 21 || val === 22 || val === 24) {
        this.updateSetting("fretCount", val);
        this.saveSettings();
        this.onSettingsChange?.();
      }
    });

    // Show accidentals change
    this.ui.showAccidentals.on("change", (event) => {
      this.updateSetting("showAccidentals", (event.target as HTMLInputElement).checked);
      this.saveSettings();
      this.onSettingsChange?.();
    });

    // Timeout seconds change
    this.ui.timeoutSeconds.on("change", (event) => {
      const val = parseInt((event.target as HTMLInputElement).value);
      this.updateSetting("timeoutSeconds", isNaN(val) ? 2 : val);
      this.saveSettings();
    });

    // Number of strings change
    this.ui.numStrings.on("change", (event) => {
      const val = parseInt((event.target as HTMLSelectElement).value);
      this.updateSetting("numStrings", val);
      this.resetTuningToDefault();
      this.saveSettings();
      this.onSettingsChange?.();
    });

    // Enable bias change
    this.ui.enableBias.on("change", (event) => {
      this.updateSetting("enableBias", (event.target as HTMLInputElement).checked);
      this.saveSettings();
    });

    // Show score notation change
    this.ui.showScoreNotation.on("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      this.updateSetting("showScoreNotation", checked);
      this.ui!.scoreKeyRow.toggle(checked);
      this.ui!.hideQuizNoteLabel.toggle(checked);
      if (!checked) {
        this.updateSetting("hideQuizNote", false);
        this.ui!.hideQuizNote.setChecked(false);
      }
      this.saveSettings();
    });

    // Score key change
    this.ui.scoreKey.on("change", (event) => {
      this.updateSetting("scoreKey", (event.target as HTMLSelectElement).value);
      this.saveSettings();
      this.onSettingsChange?.();
    });

    // Hide quiz note change
    this.ui.hideQuizNote.on("change", (event) => {
      this.updateSetting("hideQuizNote", (event.target as HTMLInputElement).checked);
      this.saveSettings();
    });

    // Enable TTS change
    this.ui.enableTTS.on("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      this.updateSetting("enableTTS", checked);
      this.ui!.voiceSelection.toggle(checked);
      this.saveSettings();
      this.onTTSChange?.();
    });

    // Selected voice change
    this.ui.selectedVoice.on("change", (event) => {
      const value = (event.target as HTMLSelectElement).value;
      this.updateSetting("selectedVoice", value || null);
      this.saveSettings();
      this.onTTSChange?.();
    });
  }
}
