/**
 * Touch Handler for String Homework Tutor
 * Prevents spurious HTML element selections during swiping and provides proper touch handling
 */

export interface TouchEvent {
  type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
  target: EventTarget | null;
  touches: TouchList;
  changedTouches: TouchList;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export class TouchHandler {
  private static instance: TouchHandler;
  private isInitialized = false;
  private touchStartPoint: TouchPoint | null = null;
  private touchMoveThreshold = 10; // pixels
  private swipeThreshold = 50; // pixels
  private longPressThreshold = 500; // milliseconds
  private longPressTimer: number | null = null;
  private isLongPress = false;
  private isSwipe = false;
  private isScrolling = false;

  private constructor() {}

  public static getInstance(): TouchHandler {
    if (!TouchHandler.instance) {
      TouchHandler.instance = new TouchHandler();
    }
    return TouchHandler.instance;
  }

  /**
   * Initialize touch handling
   */
  public initialize(): void {
    if (this.isInitialized) return;

    this.setupGlobalTouchHandlers();
    this.setupPreventSelectionStyles();
    this.isInitialized = true;
    
    console.log('Touch handler initialized');
  }

  /**
   * Setup global touch event handlers
   */
  private setupGlobalTouchHandlers(): void {
    // Detect if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    
    // On iOS, be more conservative with event handling to avoid conflicts
    const touchOptions = isIOS ? { passive: true } : { passive: false };
    
    // Prevent default touch behaviors that can cause issues
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), touchOptions);
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), touchOptions);
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), touchOptions);
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), touchOptions);

    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Prevent text selection during touch
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Setup CSS styles to prevent text selection and improve touch handling
   */
  private setupPreventSelectionStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Prevent text selection during touch */
      * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }

      /* Allow text selection for input fields */
      input, textarea, [contenteditable] {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }

      /* Improve touch responsiveness */
      button, .fret-btn, .fret-cell, .quiz-note-btn {
        touch-action: manipulation;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
      }

      /* Prevent zoom on double tap */
      .fretboard-area, .fretboard-table {
        touch-action: pan-x pan-y;
      }

      /* Smooth scrolling for touch devices */
      .fretboard-area {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }

      /* Prevent pull-to-refresh */
      body {
        overscroll-behavior-y: contain;
      }

      /* Improve button touch targets */
      .fret-btn, .quiz-note-btn, button {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* Visual feedback for touch */
      .fret-btn:active, .quiz-note-btn:active, button:active {
        transform: scale(0.95);
        transition: transform 0.1s ease;
      }

      /* Prevent accidental selections */
      .fretboard-table, .fretboard-table * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.touchStartPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    this.isLongPress = false;
    this.isSwipe = false;
    this.isScrolling = false;

    // Start long press timer
    this.longPressTimer = window.setTimeout(() => {
      this.isLongPress = true;
      this.handleLongPress(event);
    }, this.longPressThreshold);

    // Prevent default to avoid text selection
    event.preventDefault();
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.touchStartPoint || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartPoint.x);
    const deltaY = Math.abs(touch.clientY - this.touchStartPoint.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If moved enough, cancel long press and determine if it's a swipe
    if (distance > this.touchMoveThreshold) {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      // Determine if it's a swipe or scroll
      if (deltaX > deltaY) {
        this.isSwipe = true;
        this.isScrolling = false;
      } else {
        this.isScrolling = true;
        this.isSwipe = false;
      }

      // Prevent default for swipes to avoid page scrolling
      if (this.isSwipe) {
        event.preventDefault();
      }
    }
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (!this.touchStartPoint) return;

    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartPoint.x);
    const deltaY = Math.abs(touch.clientY - this.touchStartPoint.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only trigger click if it wasn't a swipe or long press
    if (!this.isSwipe && !this.isLongPress && distance < this.touchMoveThreshold) {
      this.handleTap(event);
    }

    this.touchStartPoint = null;
    this.isLongPress = false;
    this.isSwipe = false;
    this.isScrolling = false;
  }

  /**
   * Handle touch cancel events
   */
  private handleTouchCancel(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    this.touchStartPoint = null;
    this.isLongPress = false;
    this.isSwipe = false;
    this.isScrolling = false;
  }

  /**
   * Handle tap events (short, intentional touches)
   */
  private handleTap(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Find the appropriate handler based on the target
    if (target.classList.contains('fret-btn')) {
      this.handleFretButtonTap(target);
    } else if (target.classList.contains('fret-cell')) {
      this.handleFretboardTap(target);
    } else if (target.classList.contains('quiz-note-btn')) {
      this.handleQuizNoteTap(target);
    } else if (target.classList.contains('skip-countdown')) {
      this.handleSkipCountdownTap(target);
    }
  }

  /**
   * Handle long press events
   */
  private handleLongPress(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Provide haptic feedback for long press
    if (window.mobileEnhancements) {
      window.mobileEnhancements.hapticLight();
    }

    // Could add long press functionality here if needed
    console.log('Long press detected on:', target.className);
  }

  /**
   * Handle fret button taps
   */
  private handleFretButtonTap(target: HTMLElement): void {
    const fret = parseInt(target.getAttribute('data-fret') || '0');
    const currentCard = (window as any).currentCard;
    
    if (!currentCard) return;

    // Provide haptic feedback
    if (window.mobileEnhancements) {
      window.mobileEnhancements.hapticLight();
    }

    // Trigger the fret button click handler
    if (typeof (window as any).handleFretClick === 'function') {
      (window as any).handleFretClick.call(target);
    }
  }

  /**
   * Handle fretboard taps
   */
  private handleFretboardTap(target: HTMLElement): void {
    const string = parseInt(target.getAttribute('data-string') || '0');
    const fret = parseInt(target.getAttribute('data-fret') || '0');
    const currentCard = (window as any).currentCard;
    
    if (!currentCard || string !== currentCard.string) return;

    // Provide haptic feedback
    if (window.mobileEnhancements) {
      window.mobileEnhancements.hapticLight();
    }

    // Trigger the fretboard click handler
    if (typeof (window as any).handleFretboardClick === 'function') {
      (window as any).handleFretboardClick.call(target);
    }
  }

  /**
   * Handle quiz note button taps
   */
  private handleQuizNoteTap(target: HTMLElement): void {
    // Provide haptic feedback
    if (window.mobileEnhancements) {
      window.mobileEnhancements.hapticLight();
    }

    // Trigger the quiz note click handler
    if (typeof (window as any).handleQuizNoteClick === 'function') {
      (window as any).handleQuizNoteClick.call(target);
    }
  }

  /**
   * Handle skip countdown taps
   */
  private handleSkipCountdownTap(target: HTMLElement): void {
    // Provide haptic feedback
    if (window.mobileEnhancements) {
      window.mobileEnhancements.hapticLight();
    }

    // Trigger the skip countdown click handler
    if (typeof (window as any).handleSkipCountdownClick === 'function') {
      (window as any).handleSkipCountdownClick.call(target);
    }
  }

  /**
   * Check if the current touch is a swipe
   */
  public isSwipeGesture(): boolean {
    return this.isSwipe;
  }

  /**
   * Check if the current touch is a scroll
   */
  public isScrollGesture(): boolean {
    return this.isScrolling;
  }

  /**
   * Check if the current touch is a long press
   */
  public isLongPressGesture(): boolean {
    return this.isLongPress;
  }

  /**
   * Get touch sensitivity settings
   */
  public getTouchSettings() {
    return {
      touchMoveThreshold: this.touchMoveThreshold,
      swipeThreshold: this.swipeThreshold,
      longPressThreshold: this.longPressThreshold
    };
  }

  /**
   * Update touch sensitivity settings
   */
  public updateTouchSettings(settings: Partial<{
    touchMoveThreshold: number;
    swipeThreshold: number;
    longPressThreshold: number;
  }>): void {
    if (settings.touchMoveThreshold !== undefined) {
      this.touchMoveThreshold = settings.touchMoveThreshold;
    }
    if (settings.swipeThreshold !== undefined) {
      this.swipeThreshold = settings.swipeThreshold;
    }
    if (settings.longPressThreshold !== undefined) {
      this.longPressThreshold = settings.longPressThreshold;
    }
  }
}

// Export singleton instance
export const touchHandler = TouchHandler.getInstance();

// Make it available globally for the main app
declare global {
  interface Window {
    touchHandler: TouchHandler;
  }
}

window.touchHandler = touchHandler;
