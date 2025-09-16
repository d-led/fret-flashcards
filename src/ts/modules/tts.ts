// TTS (Text-to-Speech) Module
// Provides a clean, unit-testable interface for TTS functionality

export interface TTSQueueItem {
  text: string;
  priority: number; // Lower numbers = higher priority
}

// Interface for speech synthesis to enable dependency injection and testing
export interface SpeechSynthesisWrapper {
  cancel(): void;
  speak(utterance: SpeechSynthesisUtterance): void;
  getVoices(): SpeechSynthesisVoice[];
  addEventListener(type: string, listener: EventListener, options?: any): void;
  removeEventListener(type: string, listener: EventListener, options?: any): void;
}

// Default implementation that wraps the browser's speechSynthesis
export class BrowserSpeechSynthesisWrapper implements SpeechSynthesisWrapper {
  cancel(): void {
    speechSynthesis.cancel();
  }

  speak(utterance: SpeechSynthesisUtterance): void {
    speechSynthesis.speak(utterance);
  }

  getVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  addEventListener(type: string, listener: EventListener, options?: any): void {
    speechSynthesis.addEventListener(type, listener, options);
  }

  removeEventListener(type: string, listener: EventListener, options?: any): void {
    speechSynthesis.removeEventListener(type, listener, options);
  }
}

export interface TTSState {
  enabled: boolean;
  initialized: boolean;
  selectedVoice: string | null;
  queueLength: number;
  currentlyPlaying: boolean;
  utteranceLog: string[];
}

export interface TTSConfig {
  enabled: boolean;
  selectedVoice: string | null;
  maxLogSize?: number;
}

export class TTSManager {
  private config: TTSConfig;
  private queue: TTSQueueItem[] = [];
  private currentlyPlaying = false;
  private initialized = false;
  private utteranceLog: string[] = [];
  private onStateChange?: (state: TTSState) => void;
  private speechSynthesis: SpeechSynthesisWrapper;

  constructor(config: TTSConfig, onStateChange?: (state: TTSState) => void, speechSynthesis?: SpeechSynthesisWrapper) {
    this.config = config;
    this.onStateChange = onStateChange;
    this.speechSynthesis = speechSynthesis || new BrowserSpeechSynthesisWrapper();
  }

  // Check if TTS is supported in the current browser
  isSupported(): boolean {
    return "speechSynthesis" in window;
  }

  // Initialize TTS (requires user interaction on some browsers)
  initialize(): boolean {
    if (!this.isSupported()) return false;

    this.speechSynthesis.cancel(); // removes anything 'stuck'
    this.speechSynthesis.getVoices();
    this.initialized = true;
    this.notifyStateChange();
    return true;
  }

  // Update configuration
  updateConfig(newConfig: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.notifyStateChange();
  }

  // Add text to TTS queue
  addToQueue(text: string, priority: number = 50): void {
    if (!this.config.enabled || !this.isSupported()) return;

    // Log utterance for testing
    this.logUtterance(text);

    // Insert item in priority order (lower number = higher priority)
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority > priority) {
        insertIndex = i;
        break;
      }
    }
    this.queue.splice(insertIndex, 0, { text, priority });

    this.notifyStateChange();

    // Process queue if not already playing
    if (!this.currentlyPlaying) {
      this.processQueue();
    }
  }

  // Process the TTS queue
  private processQueue(): void {
    if (!this.config.enabled || this.queue.length === 0 || !this.isSupported() || !this.initialized) {
      this.currentlyPlaying = false;
      this.notifyStateChange();
      return;
    }

    this.currentlyPlaying = true;
    this.notifyStateChange();
    const item = this.queue.shift()!;

    const utterance = new SpeechSynthesisUtterance(item.text);

    // Set voice if available
    const voices = this.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      this.setBestVoice(utterance, voices, this.config.selectedVoice || undefined);
    }

    utterance.onend = () => {
      this.currentlyPlaying = false;
      this.notifyStateChange();
      // Process next item in queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100); // Small delay between items
      }
    };

    utterance.onerror = () => {
      this.currentlyPlaying = false;
      this.notifyStateChange();
      // Process next item in queue even on error
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    };

    this.speechSynthesis.speak(utterance);
  }

  // Clear the TTS queue
  clearQueue(): void {
    this.queue = [];
    this.speechSynthesis.cancel();
    this.currentlyPlaying = false;
    this.notifyStateChange();
  }

  // Set the best voice for an utterance
  private setBestVoice(utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[], selectedVoiceName?: string): void {
    // If a specific voice was selected, try to use it
    if (selectedVoiceName) {
      const selectedVoice = voices.find((v) => v.name === selectedVoiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        return;
      }
    }

    // Otherwise, prefer local English voices over network voices
    const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
    const localEnglishVoices = englishVoices.filter((v) => v.localService);

    // iOS-specific: try to pick a consistent Siri US English voice if available
    try {
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (isiOS && englishVoices.length > 0) {
        // Prefer local Siri English; among Siri voices, try to pick a stable male voice variant when present
        const siriEnglish = englishVoices.filter((v) => /siri/i.test(v.name));
        const siriLocal = siriEnglish.filter((v) => v.localService);
        const candidates = (siriLocal.length ? siriLocal : siriEnglish).filter((v) => /en/i.test(v.lang));
        if (candidates.length > 0) {
          // Heuristic: pick a voice whose name suggests a lower-numbered variant (often male), else first
          const preferred = candidates.find((v) => /(voice\s*2|voice\s*4)/i.test(v.name)) || candidates[0];
          utterance.voice = preferred;
          return;
        }
      }
    } catch (e) {
      // ignore UA parsing issues
    }

    if (localEnglishVoices.length > 0) {
      // Use the first local English voice
      utterance.voice = localEnglishVoices[0];
    } else if (englishVoices.length > 0) {
      // Fallback to any English voice
      utterance.voice = englishVoices[0];
    }
    // If no English voices, let the browser choose the default
  }

  // Log utterance for testing
  private logUtterance(text: string): void {
    this.utteranceLog.push(text);
    // Keep only last N utterances to prevent memory issues
    const maxSize = this.config.maxLogSize || 50;
    if (this.utteranceLog.length > maxSize) {
      this.utteranceLog = this.utteranceLog.slice(-maxSize);
    }
  }

  // Get current state
  getState(): TTSState {
    return {
      enabled: this.config.enabled,
      initialized: this.initialized,
      selectedVoice: this.config.selectedVoice,
      queueLength: this.queue.length,
      currentlyPlaying: this.currentlyPlaying,
      utteranceLog: [...this.utteranceLog],
    };
  }

  // Notify state change
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  // Reset to initial state
  reset(): void {
    this.clearQueue();
    this.initialized = false;
    this.utteranceLog = [];
    this.notifyStateChange();
  }
}

// Utility functions for TTS
export function isTTSSupported(): boolean {
  return "speechSynthesis" in window;
}

export function loadVoicesWhenAvailable(onComplete = () => {}, speechSynthesis?: SpeechSynthesisWrapper): void {
  const synth = speechSynthesis || new BrowserSpeechSynthesisWrapper();
  const voices = synth.getVoices();

  if (voices.length !== 0) {
    onComplete();
  } else {
    // Wait for voices to load
    const handler = () => {
      synth.removeEventListener("voiceschanged", handler);
      onComplete();
    };
    synth.addEventListener("voiceschanged", handler, { once: true } as any);

    // Fallback timeout
    setTimeout(() => {
      synth.removeEventListener("voiceschanged", handler);
      onComplete();
    }, 2000);
  }
}

// TTS message types for different priorities
export const TTS_PRIORITIES = {
  SYSTEM: 1,
  QUIZ_REPEAT: 2,
  OCTAVE_HINT: 3,
  QUIZ_ANNOUNCEMENT: 5,
  STATUS: 10,
  NORMAL: 50,
} as const;
