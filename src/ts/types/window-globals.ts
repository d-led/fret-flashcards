import type { ActiveQuizCard } from "./interfaces";

/**
 * Globals attached by legacy `src/ts/index.ts` on `window` for mobile/touch bridges.
 * Keeps modules type-safe without `window as any`.
 */
export type FretTouchSettings = Partial<{
  touchMoveThreshold: number;
  swipeThreshold: number;
  longPressThreshold: number;
}>;

export interface FretFlashcardsWindow extends Window {
  currentCard?: ActiveQuizCard | null;
  pitchDetecting?: boolean;
  micStream?: MediaStream | null;
  audioEnabled?: boolean;
  enableTTS?: boolean;
  handleAppBackgroundedUnified?: () => void;
  handleFretClick?: (this: HTMLElement) => void;
  handleFretboardClick?: (this: HTMLElement) => void;
  handleQuizNoteClick?: (this: HTMLElement) => void;
  handleSkipCountdownClick?: (this: HTMLElement) => void;
  updateUnifiedBanner?: () => void;
  checkAndReenableMicrophoneButton?: () => void;
  testAppBackgrounding?: () => void;
  micStateMonitor?: ReturnType<typeof setInterval> | null;
  populateVoiceOptions?: () => void;
  /** Present when the app runs inside Capacitor WebView. */
  Capacitor?: Record<string, unknown>;
  /** Safari / older WebKit prefix when global `AudioContext` is missing. */
  webkitAudioContext?: typeof AudioContext;
  /** Some environments expose the ctor only on `window`. */
  AudioContext?: typeof AudioContext;
}

export function fretWindow(): FretFlashcardsWindow {
  return window as FretFlashcardsWindow;
}
