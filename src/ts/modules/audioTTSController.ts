// Audio/TTS Controller
// Provides a unified interface for managing both audio and TTS functionality

import { TTSManager, TTSState, TTSConfig, TTS_PRIORITIES } from "./tts";
import { AudioManager, AudioState, AudioConfig, detectIOS } from "./audio";
import { SettingsManager, AppSettings } from "./settings";

export interface AudioTTSState {
  audio: AudioState;
  tts: TTSState;
  settings: AppSettings;
  isInitialized: boolean;
}

export interface AudioTTSConfig {
  settingsStorageKey: string;
  defaultSettings: AppSettings;
  enableTestStateTracking?: boolean;
}

export class AudioTTSController {
  private ttsManager: TTSManager;
  private audioManager: AudioManager;
  private settingsManager: SettingsManager;
  private isInitialized = false;
  private onStateChange?: (state: AudioTTSState) => void;
  private testStateUpdateCallback?: () => void;

  constructor(config: AudioTTSConfig, onStateChange?: (state: AudioTTSState) => void) {
    this.onStateChange = onStateChange;

    // Initialize settings manager
    this.settingsManager = new SettingsManager(config.settingsStorageKey, config.defaultSettings, () => this.handleSettingsChange());

    // Initialize TTS manager
    const ttsConfig: TTSConfig = {
      enabled: false,
      selectedVoice: null,
      maxLogSize: 50,
    };
    this.ttsManager = new TTSManager(ttsConfig, () => this.handleTTSStateChange());

    // Initialize audio manager
    const audioConfig: AudioConfig = {
      enabled: false,
      isIOS: detectIOS(),
    };
    this.audioManager = new AudioManager(audioConfig, () => this.handleAudioStateChange());

    // Set up test state tracking if enabled
    if (config.enableTestStateTracking) {
      this.setupTestStateTracking();
    }
  }

  // Initialize the controller
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    // Load settings first
    this.settingsManager.loadSettings();
    const settings = this.settingsManager.getSettings();

    // Update TTS and audio configs based on loaded settings
    this.ttsManager.updateConfig({
      enabled: settings.enableTTS,
      selectedVoice: settings.selectedVoice,
    });

    this.audioManager.updateConfig({
      enabled: !detectIOS(), // Auto-enable on desktop
      isIOS: detectIOS(),
    });

    // Initialize audio (may require user interaction on iOS)
    if (!detectIOS()) {
      await this.audioManager.initialize();
    }

    this.isInitialized = true;
    this.notifyStateChange();
    return true;
  }

  // Enable audio (requires user interaction on iOS)
  async enableAudio(): Promise<boolean> {
    const success = await this.audioManager.initialize();
    this.notifyStateChange();
    return success;
  }

  // Enable TTS
  async enableTTS(): Promise<boolean> {
    const success = await this.ttsManager.initialize();
    this.settingsManager.updateSetting("enableTTS", true);
    this.settingsManager.saveSettings();
    this.ttsManager.updateConfig({ enabled: true });
    this.notifyStateChange();
    return success;
  }

  // Disable TTS
  disableTTS(): void {
    this.ttsManager.updateConfig({ enabled: false });
    this.ttsManager.clearQueue();
    this.settingsManager.updateSetting("enableTTS", false);
    this.settingsManager.saveSettings();
    this.notifyStateChange();
  }

  // Set selected voice
  setSelectedVoice(voice: string | null): void {
    this.settingsManager.updateSetting("selectedVoice", voice);
    this.settingsManager.saveSettings();
    this.ttsManager.updateConfig({ selectedVoice: voice });
    this.notifyStateChange();
  }

  // Play a tone
  playTone(freq: number, duration: number): void {
    this.audioManager.playTone(freq, duration);
  }

  // Play a click sound
  playClick(): void {
    this.audioManager.playClick();
  }

  // Add text to TTS queue
  addToTTSQueue(text: string, priority: number = TTS_PRIORITIES.NORMAL): void {
    this.ttsManager.addToQueue(text, priority);
  }

  // Clear TTS queue
  clearTTSQueue(): void {
    this.ttsManager.clearQueue();
  }

  // Speak a status message
  speakStatusMessage(message: string, force: boolean = false): void {
    if (force || this.settingsManager.getSettings().enableTTS) {
      this.addToTTSQueue(message, TTS_PRIORITIES.STATUS);
    }
  }

  // Speak a system message (always speaks regardless of TTS setting)
  speakSystemMessage(message: string): void {
    this.addToTTSQueue(message, TTS_PRIORITIES.SYSTEM);
  }

  // Speak quiz note announcement
  speakQuizNote(note: string, stringNumber: number): void {
    const ordinalString = this.getOrdinal(stringNumber);
    let spokenNote = note;

    // Spell out accidentals for clarity
    if (spokenNote.includes("#")) {
      spokenNote = spokenNote.replace("#", " sharp");
    } else if (spokenNote.includes("b") || spokenNote.includes("♭")) {
      spokenNote = spokenNote.replace(/[b♭]/, " flat");
    }

    const text = `Note ${spokenNote}, ${ordinalString} string`;
    this.addToTTSQueue(text, TTS_PRIORITIES.QUIZ_ANNOUNCEMENT);
  }

  // Speak octave hint
  speakOctaveHint(): void {
    this.addToTTSQueue("Another octave", TTS_PRIORITIES.OCTAVE_HINT);
  }

  // Check if audio is currently playing
  isAudioPlaying(): boolean {
    return this.audioManager.isPlaying();
  }

  // Check if TTS is currently playing
  isTTSPlaying(): boolean {
    const ttsState = this.ttsManager.getState();
    return ttsState.currentlyPlaying;
  }

  // Check if any audio/TTS is playing
  isAnyAudioPlaying(): boolean {
    return this.isAudioPlaying() || this.isTTSPlaying();
  }

  // Get current state
  getState(): AudioTTSState {
    return {
      audio: this.audioManager.getState(),
      tts: this.ttsManager.getState(),
      settings: this.settingsManager.getSettings(),
      isInitialized: this.isInitialized,
    };
  }

  // Get settings
  getSettings(): AppSettings {
    return this.settingsManager.getSettings();
  }

  // Update settings
  updateSettings(updates: Partial<AppSettings>): void {
    this.settingsManager.updateSettings(updates);
    this.settingsManager.saveSettings();

    // Update TTS config if TTS settings changed
    if ("enableTTS" in updates || "selectedVoice" in updates) {
      this.ttsManager.updateConfig({
        enabled: updates.enableTTS ?? this.settingsManager.getSettings().enableTTS,
        selectedVoice: updates.selectedVoice ?? this.settingsManager.getSettings().selectedVoice,
      });
    }

    this.notifyStateChange();
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.settingsManager.resetToDefaults(this.settingsManager.getSettings());
    this.ttsManager.reset();
    this.audioManager.reset();
    this.notifyStateChange();
  }

  // Handle settings changes
  private handleSettingsChange(): void {
    this.notifyStateChange();
  }

  // Handle TTS state changes
  private handleTTSStateChange(): void {
    this.notifyStateChange();
  }

  // Handle audio state changes
  private handleAudioStateChange(): void {
    this.notifyStateChange();
  }

  // Notify state change
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }

    // Update test state if tracking is enabled
    if (this.testStateUpdateCallback) {
      this.testStateUpdateCallback();
    }
  }

  // Set up test state tracking
  private setupTestStateTracking(): void {
    this.testStateUpdateCallback = () => {
      const state = this.getState();

      // Update DOM elements for test state tracking
      const audioEnabledEl = document.getElementById("audio-enabled");
      const ttsEnabledEl = document.getElementById("tts-enabled");
      const ttsInitializedEl = document.getElementById("tts-initialized");
      const selectedVoiceEl = document.getElementById("selected-voice");
      const ttsQueueLengthEl = document.getElementById("tts-queue-length");
      const ttsCurrentlyPlayingEl = document.getElementById("tts-currently-playing");
      const utteranceLogEl = document.getElementById("utterance-log");

      if (audioEnabledEl) audioEnabledEl.setAttribute("data-enabled", state.audio.enabled.toString());
      if (ttsEnabledEl) ttsEnabledEl.setAttribute("data-enabled", state.tts.enabled.toString());
      if (ttsInitializedEl) ttsInitializedEl.setAttribute("data-initialized", state.tts.initialized.toString());
      if (selectedVoiceEl) selectedVoiceEl.setAttribute("data-voice", state.tts.selectedVoice || "");
      if (ttsQueueLengthEl) ttsQueueLengthEl.setAttribute("data-length", state.tts.queueLength.toString());
      if (ttsCurrentlyPlayingEl) ttsCurrentlyPlayingEl.setAttribute("data-playing", state.tts.currentlyPlaying.toString());
      if (utteranceLogEl) utteranceLogEl.setAttribute("data-log", JSON.stringify(state.tts.utteranceLog));
    };
  }

  // Get ordinal string (1st, 2nd, 3rd, etc.)
  private getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}
