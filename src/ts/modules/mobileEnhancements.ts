import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { App } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import { touchHandler } from "./touchHandler";

/**
 * Mobile-specific enhancements for String Homework Tutor
 */
export class MobileEnhancements {
  private static instance: MobileEnhancements;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): MobileEnhancements {
    if (!MobileEnhancements.instance) {
      MobileEnhancements.instance = new MobileEnhancements();
    }
    return MobileEnhancements.instance;
  }

  /**
   * Initialize mobile-specific features
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Only initialize touch handling on native platforms
      // This prevents context menu disabling in browsers while keeping it on mobile
      if (Capacitor.isNativePlatform()) {
        // Initialize touch handling on all native platforms (including iOS)
        touchHandler.initialize();
      } else {
        console.log("Skipping touch handler in browser - context menu will be available");
      }

      // Only run on native platforms
      if (Capacitor.isNativePlatform()) {
        await this.setupStatusBar();
        await this.setupKeyboard();
        await this.setupAppLifecycle();
        await this.hideSplashScreen();
      }

      this.isInitialized = true;
      console.log("Mobile enhancements initialized");
    } catch (error) {
      console.error("Failed to initialize mobile enhancements:", error);
    }
  }

  /**
   * Setup status bar styling
   */
  private async setupStatusBar(): Promise<void> {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#222222" });
    } catch (error) {
      console.error("Failed to setup status bar:", error);
    }
  }

  /**
   * Setup keyboard behavior
   */
  private async setupKeyboard(): Promise<void> {
    try {
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      await Keyboard.setStyle({ style: "dark" });
      await Keyboard.setScroll({ isDisabled: false });
    } catch (error) {
      console.error("Failed to setup keyboard:", error);
    }
  }

  /**
   * Setup app lifecycle events
   */
  private async setupAppLifecycle(): Promise<void> {
    try {
      // Handle app state changes (primary method)
      App.addListener("appStateChange", ({ isActive }) => {
        console.log("App state changed. Is active?", isActive);
        if (isActive) {
          // App became active - resume audio if needed
          this.resumeAudio();
        } else {
          // App became inactive - disable microphone and pause audio
          console.log("App became inactive - disabling microphone");
          this.pauseAudio();
          this.handleAppBackgrounded();
          // Also call direct method as backup
          this.disableMicrophoneOnInactive();
        }
      });

      // Handle pause event (more reliable for app minimization)
      App.addListener("pause", () => {
        console.log("App paused - handling microphone state");
        console.log("Current microphone state:", {
          pitchDetecting: !!(window as any).pitchDetecting,
          micStream: !!(window as any).micStream,
          micButtonText: document.getElementById("mic-toggle")?.textContent,
        });
        this.pauseAudio();
        this.handleAppBackgrounded();
        // Also call direct method as backup
        this.disableMicrophoneOnInactive();
      });

      // Handle resume event (more reliable for app restoration)
      App.addListener("resume", () => {
        console.log("App resumed - resuming audio if needed");
        this.resumeAudio();
        // Note: We don't re-enable microphone button here because iOS requires
        // microphone access to be initiated during a user interaction (user gesture)
      });

      // Add Page Visibility API fallback for browser compatibility
      this.setupPageVisibilityListener();

      // Add additional detection methods
      this.setupAdditionalDetectionMethods();
    } catch (error) {
      console.error("Failed to setup app lifecycle:", error);
    }
  }

  /**
   * Hide splash screen
   */
  private async hideSplashScreen(): Promise<void> {
    try {
      await SplashScreen.hide();
    } catch (error) {
      console.error("Failed to hide splash screen:", error);
    }
  }

  /**
   * Provide haptic feedback for correct answers
   */
  public async hapticSuccess(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error("Failed to provide success haptic feedback:", error);
    }
  }

  /**
   * Provide haptic feedback for incorrect answers
   */
  public async hapticError(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.error("Failed to provide error haptic feedback:", error);
    }
  }

  /**
   * Provide haptic feedback for button taps
   */
  public async hapticLight(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error("Failed to provide light haptic feedback:", error);
    }
  }

  /**
   * Resume audio when app becomes active
   */
  private resumeAudio(): void {
    // This will be called by the main audio module
    const event = new CustomEvent("mobileAppResume");
    window.dispatchEvent(event);
  }

  /**
   * Pause audio when app becomes inactive
   */
  private pauseAudio(): void {
    // This will be called by the main audio module
    const event = new CustomEvent("mobileAppPause");
    window.dispatchEvent(event);
  }

  /**
   * Enhanced storage using Capacitor Preferences
   */
  public async setPreference(key: string, value: any): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key, value: JSON.stringify(value) });
      } else {
        // Fallback to localStorage for web
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error("Failed to set preference:", error);
      // Fallback to localStorage
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  /**
   * Get preference with fallback
   */
  public async getPreference(key: string): Promise<any> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Preferences.get({ key });
        return result.value ? JSON.parse(result.value) : null;
      } else {
        // Fallback to localStorage for web
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      console.error("Failed to get preference:", error);
      // Fallback to localStorage
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
  }

  /**
   * Check if running on mobile device
   */
  public isMobile(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get platform information
   */
  public getPlatform(): string {
    return Capacitor.getPlatform();
  }

  /**
   * Check if touch handling is active
   */
  public isTouchHandlingActive(): boolean {
    return touchHandler.isInitialized;
  }

  /**
   * Get touch sensitivity settings
   */
  public getTouchSettings() {
    return touchHandler.getTouchSettings();
  }

  /**
   * Update touch sensitivity settings
   */
  public updateTouchSettings(settings: any): void {
    touchHandler.updateTouchSettings(settings);
  }

  /**
   * Check if current gesture is a swipe
   */
  public isSwipeGesture(): boolean {
    return touchHandler.isSwipeGesture();
  }

  /**
   * Check if current gesture is a scroll
   */
  public isScrollGesture(): boolean {
    return touchHandler.isScrollGesture();
  }

  /**
   * Check if current gesture is a long press
   */
  public isLongPressGesture(): boolean {
    return touchHandler.isLongPressGesture();
  }

  /**
   * Handle app going to background - disable audio, voice, and microphone if active
   */
  private handleAppBackgrounded(): void {
    // Check if any features are currently active
    const micButton = document.getElementById("mic-toggle");
    const isMicActive = micButton && micButton.textContent?.includes("Disable Mic");
    const hasActiveMicStream = this.checkForActiveMicrophoneStream();

    // Check audio and TTS state from global variables
    const audioEnabled = !!(window as any).audioEnabled;
    const enableTTS = !!(window as any).enableTTS;

    console.log("Checking features state for backgrounding:", {
      isMicActive,
      hasActiveMicStream,
      pitchDetecting: !!(window as any).pitchDetecting,
      micStream: !!(window as any).micStream,
      audioEnabled,
      enableTTS,
    });

    // If any features are active, dispatch the event to disable them
    if (isMicActive || hasActiveMicStream || audioEnabled || enableTTS) {
      console.log("App backgrounded - disabling audio, voice, and microphone to prevent access issues");
      // Dispatch a custom event that the main app can listen to
      window.dispatchEvent(
        new CustomEvent("appBackgrounded", {
          detail: { action: "disableMicrophone" },
        }),
      );
    } else {
      console.log("No active features detected - no action needed");
    }
  }

  /**
   * Directly disable audio, voice, and microphone when app becomes inactive
   * This can be called directly without relying on custom events
   */
  public disableMicrophoneOnInactive(): void {
    console.log("Directly disabling audio, voice, and microphone due to app inactivity");

    // Always use the unified function to prevent duplicate notifications
    if (typeof (window as any).handleAppBackgroundedUnified === "function") {
      (window as any).handleAppBackgroundedUnified();
    } else {
      console.error("Unified function not available - this should not happen");
    }
  }

  /**
   * Check if there's an active microphone stream
   */
  private checkForActiveMicrophoneStream(): boolean {
    try {
      // Check if there are any active audio tracks
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // This is a more reliable way to check if microphone is active
        // We'll check the global variables that should be available
        return !!(window as any).pitchDetecting || !!(window as any).micStream;
      }
    } catch (error) {
      console.log("Could not check microphone stream state:", error);
    }
    return false;
  }

  /**
   * Setup Page Visibility API listener for browser compatibility
   */
  private setupPageVisibilityListener(): void {
    if (typeof document !== "undefined" && "visibilityState" in document) {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          console.log("Page hidden - checking microphone state");
          this.handleAppBackgrounded();
        } else if (document.visibilityState === "visible") {
          console.log("Page visible - app resumed");
          // Could add logic here to re-enable microphone if needed
        }
      });
    }
  }

  /**
   * Setup additional detection methods for better coverage
   */
  private setupAdditionalDetectionMethods(): void {
    // Listen for window blur/focus events (additional fallback)
    if (typeof window !== "undefined") {
      window.addEventListener("blur", () => {
        console.log("Window blurred - checking microphone state");
        this.handleAppBackgrounded();
        this.disableMicrophoneOnInactive();
      });

      window.addEventListener("focus", () => {
        console.log("Window focused - app resumed");
        this.resumeAudio();
      });

      // Listen for beforeunload event (app is about to be closed/minimized)
      window.addEventListener("beforeunload", () => {
        console.log("App about to unload - handling microphone state");
        this.handleAppBackgrounded();
        this.disableMicrophoneOnInactive();
      });

      // Listen for pagehide event (additional fallback for mobile browsers)
      window.addEventListener("pagehide", () => {
        console.log("Page hidden - handling microphone state");
        this.handleAppBackgrounded();
        this.disableMicrophoneOnInactive();
      });

      // Listen for pageshow event (page is shown again)
      window.addEventListener("pageshow", (event) => {
        console.log("Page shown - app resumed");
        this.resumeAudio();
      });
    }
  }
}

// Export singleton instance
export const mobileEnhancements = MobileEnhancements.getInstance();
