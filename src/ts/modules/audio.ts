// Audio Module
// Provides a clean, unit-testable interface for audio functionality

export interface AudioState {
  enabled: boolean;
  currentlyPlaying: boolean;
  isIOS: boolean;
}

export interface AudioConfig {
  enabled: boolean;
  isIOS: boolean;
}

export class AudioManager {
  private config: AudioConfig;
  private currentlyPlaying = false;
  private audioElements: { [key: string]: HTMLAudioElement } = {};
  private resumeMicTimeout: number | null = null;
  private onStateChange?: (state: AudioState) => void;

  constructor(config: AudioConfig, onStateChange?: (state: AudioState) => void) {
    this.config = config;
    this.onStateChange = onStateChange;
  }

  // Update configuration
  updateConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.notifyStateChange();
  }

  // Initialize audio context (requires user interaction on some browsers)
  async initialize(): Promise<boolean> {
    try {
      // Create a short silent audio element and play it
      const testAudio = new Audio();
      testAudio.src =
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQfCjuP2O/Qfi8HI3/A7tqPQQkSUbDn56ZSFAk+ltztw2QfCTuN2bC/";

      const playPromise = testAudio.play();
      if (playPromise !== undefined) {
        await playPromise;
        this.config.enabled = true;
        this.notifyStateChange();
        testAudio.pause();
        testAudio.currentTime = 0;
        return true;
      } else {
        // Fallback for older browsers
        this.config.enabled = true;
        this.notifyStateChange();
        return true;
      }
    } catch (err) {
      console.error("Failed to initialize audio:", err);
      if (!this.config.isIOS) {
        // On non-iOS, assume audio will work
        this.config.enabled = true;
        this.notifyStateChange();
        return true;
      }
      return false;
    }
  }

  // Play a tone with given frequency and duration
  playTone(freq: number, duration: number): void {
    if (!this.config.enabled) {
      console.warn("Audio not enabled - cannot play tone");
      return;
    }

    try {
      const cacheKey = `${Math.round(freq)}_${duration}`;

      // Set audio playing flag to prevent microphone feedback
      this.currentlyPlaying = true;
      this.notifyStateChange();

      // Clear any existing resume timeout
      if (this.resumeMicTimeout) {
        clearTimeout(this.resumeMicTimeout);
        this.resumeMicTimeout = null;
      }

      // On iOS, don't reuse cached audio elements to prevent playback conflicts
      // Create a new audio element each time for reliable playback
      let audio: HTMLAudioElement;
      if (this.config.isIOS || !this.audioElements[cacheKey]) {
        audio = new Audio();
        try {
          audio.src = this.generateToneDataURL(freq, duration);
          audio.preload = "auto";
          if (!this.config.isIOS) {
            this.audioElements[cacheKey] = audio; // Only cache on non-iOS
          }
        } catch (err) {
          console.error("Error generating tone:", err);
          this.currentlyPlaying = false;
          this.notifyStateChange();
          return;
        }
      } else {
        audio = this.audioElements[cacheKey];
      }

      // For non-iOS cached elements, reset position
      if (!this.config.isIOS) {
        audio.currentTime = 0;
      }

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio played successfully");
            // Set up timeout to resume microphone after audio finishes
            this.resumeMicTimeout = setTimeout(
              () => {
                this.currentlyPlaying = false;
                this.resumeMicTimeout = null;
                this.notifyStateChange();
              },
              duration * 1000 + 200,
            ); // Add 200ms buffer
          })
          .catch((err) => {
            console.error("Error playing audio:", err);
            this.currentlyPlaying = false;
            this.notifyStateChange();
          });
      } else {
        // Fallback for older browsers - use duration timeout
        this.resumeMicTimeout = setTimeout(
          () => {
            this.currentlyPlaying = false;
            this.resumeMicTimeout = null;
            this.notifyStateChange();
          },
          duration * 1000 + 200,
        );
      }
    } catch (err) {
      console.error("Error playing tone:", err);
      this.currentlyPlaying = false;
      this.notifyStateChange();
    }
  }

  // Play a click sound
  playClick(): void {
    try {
      const audio = new Audio();
      audio.src = this.generateClickDataURL();
      audio.volume = 1.0;
      audio.play().catch((err) => console.warn("Click play failed:", err));
    } catch (err) {
      console.warn("Click creation failed:", err);
    }
  }

  // Generate a WAV data URL for a given frequency
  private generateToneDataURL(freq: number, duration = 0.8, sampleRate = 44100): string {
    const length = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * 2, true);

    // Compute MIDI and octave from frequency
    const midi = 69 + 12 * Math.log2(freq / 440);
    const octave = Math.floor(midi / 12) - 1;
    const useTriangle = octave === 1 || octave === 2;
    // Boost amplitude on iOS where overall output is quieter
    const amp = this.config.isIOS ? 0.75 : 0.25;

    // Generate wave data (triangle for octaves 1-2, sine otherwise)
    for (let i = 0; i < length; i++) {
      let sample: number;
      if (useTriangle) {
        sample = (4 * Math.abs((((i * freq) / sampleRate) % 1) - 0.5) - 1) * amp * 32767;
      } else {
        sample = Math.sin((2 * Math.PI * freq * i) / sampleRate) * amp * 32767;
      }
      const offset = 44 + i * 2;
      if (offset + 1 < buffer.byteLength) {
        view.setInt16(offset, sample, true);
      }
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }

  // Generate a brief "clack" sound
  private generateClickDataURL(duration = 0.05, sampleRate = 44100): string {
    const length = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * 2, true);

    // Generate "clack" sound: sharp attack with mixed frequencies for woody/clicky sound
    for (let i = 0; i < length; i++) {
      // Mix of high and mid frequencies for "clack" character
      const t = i / sampleRate;

      // High frequency component (sharp attack)
      const highFreq = Math.sin(2 * Math.PI * 2000 * t) * 0.6;
      // Mid frequency component (body of the sound)
      const midFreq = Math.sin(2 * Math.PI * 800 * t) * 0.4;
      // Low frequency thump
      const lowFreq = Math.sin(2 * Math.PI * 200 * t) * 0.2;

      // Combine frequencies
      let sample = highFreq + midFreq + lowFreq;

      // Very sharp exponential decay for percussive "clack"
      const decay = Math.exp(-i / (length * 0.05));

      // Additional sharp attack envelope
      const attack = i < length * 0.02 ? i / (length * 0.02) : 1;

      // Scale to 16-bit range with twice the volume
      const amplification = 0.24;
      sample = sample * decay * attack * amplification * 32767;

      const offset = 44 + i * 2;
      if (offset + 1 < buffer.byteLength) {
        view.setInt16(offset, sample, true);
      }
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }

  // Get current state
  getState(): AudioState {
    return {
      enabled: this.config.enabled,
      currentlyPlaying: this.currentlyPlaying,
      isIOS: this.config.isIOS,
    };
  }

  // Notify state change
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  // Check if audio is currently playing
  isPlaying(): boolean {
    return this.currentlyPlaying;
  }

  // Clear resume timeout (useful for cleanup)
  clearResumeTimeout(): void {
    if (this.resumeMicTimeout) {
      clearTimeout(this.resumeMicTimeout);
      this.resumeMicTimeout = null;
    }
  }

  // Reset to initial state
  reset(): void {
    this.clearResumeTimeout();
    this.currentlyPlaying = false;
    this.audioElements = {};
    this.notifyStateChange();
  }
}

// Utility functions for audio
export function detectIOS(): boolean {
  // Check for CI/test environments - treat as desktop
  const isCI = navigator.userAgent.includes("HeadlessChrome") || navigator.userAgent.includes("Cypress") || navigator.userAgent.includes("Electron");
  if (isCI) {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function detectMacOS(): boolean {
  return navigator.platform.indexOf("Mac") > -1 && !detectIOS();
}

export function detectBrowser(): string {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf("Firefox") > -1) {
    return "firefox";
  } else if (userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Edg") === -1) {
    return "chrome";
  } else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
    return "safari";
  } else if (userAgent.indexOf("Edg") > -1) {
    return "edge";
  }
  return "unknown";
}

export function detectBrave(): boolean {
  // Brave browser detection - check for Brave-specific properties
  const hasBraveProperty = !!(navigator as any).brave;
  const isChromeBased = navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Edg") === -1;
  const isBrave = hasBraveProperty || (isChromeBased && (navigator as any).brave !== undefined);

  console.log("Brave detection - hasBraveProperty:", hasBraveProperty, "isChromeBased:", isChromeBased, "userAgent:", navigator.userAgent);
  return isBrave;
}

// Audio frequency utilities
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
