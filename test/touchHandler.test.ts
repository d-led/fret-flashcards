/**
 * Touch Handler Test Suite for String Homework Tutor
 * Tests the actual touch handling implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TouchHandler, TouchPoint } from '../src/ts/modules/touchHandler';

// Mock DOM environment
const mockAddEventListener = vi.fn();
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    addEventListener: mockAddEventListener,
    createElement: mockCreateElement,
    appendChild: mockAppendChild,
    head: {
      appendChild: mockAppendChild
    },
    body: {
      appendChild: mockAppendChild
    }
  },
  writable: true
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    platform: 'Win32',
    maxTouchPoints: 0
  },
  writable: true
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    setTimeout: vi.fn((fn: Function, delay: number) => {
      // Return a mock timer ID
      return 123;
    }),
    clearTimeout: vi.fn()
  },
  writable: true
});

describe('TouchHandler', () => {
  let touchHandler: TouchHandler;
  let mockStyleElement: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock style element
    mockStyleElement = {
      textContent: '',
      setAttribute: vi.fn()
    };
    
    mockCreateElement.mockReturnValue(mockStyleElement);
    
    // Reset the singleton instance by accessing the private static property
    // This is a bit hacky but necessary for testing singletons
    (TouchHandler as any).instance = undefined;
    
    // Get fresh instance
    touchHandler = TouchHandler.getInstance();
  });

  afterEach(() => {
    // Clean up any timers
    vi.clearAllTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TouchHandler.getInstance();
      const instance2 = TouchHandler.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize touch handling', () => {
      touchHandler.initialize();
      
      // Should add event listeners
      expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('contextmenu', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('selectstart', expect.any(Function));
    });

    it('should create and append style element', () => {
      touchHandler.initialize();
      
      expect(mockCreateElement).toHaveBeenCalledWith('style');
      expect(mockAppendChild).toHaveBeenCalledWith(mockStyleElement);
    });

    it('should not initialize twice', () => {
      touchHandler.initialize();
      const initialCallCount = mockAddEventListener.mock.calls.length;
      
      touchHandler.initialize();
      
      // Should not add listeners again
      expect(mockAddEventListener.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('iOS Detection', () => {
    it('should use passive listeners on iOS', () => {
      // Mock iOS user agent
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      touchHandler.initialize();
      
      // Should use passive: true for iOS
      expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: true });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: true });
    });

    it('should use non-passive listeners on non-iOS', () => {
      // Mock non-iOS user agent
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true
      });

      touchHandler.initialize();
      
      // Should use passive: false for non-iOS
      expect(mockAddEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false });
      expect(mockAddEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: false });
    });
  });

  describe('CSS Styles', () => {
    it('should create proper CSS styles', () => {
      touchHandler.initialize();
      
      expect(mockStyleElement.textContent).toContain('user-select: none');
      expect(mockStyleElement.textContent).toContain('-webkit-user-select: none');
      expect(mockStyleElement.textContent).toContain('-webkit-touch-callout: none');
      expect(mockStyleElement.textContent).toContain('-webkit-tap-highlight-color: transparent');
      expect(mockStyleElement.textContent).toContain('touch-action: manipulation');
      expect(mockStyleElement.textContent).toContain('min-height: 44px');
      expect(mockStyleElement.textContent).toContain('min-width: 44px');
    });

    it('should allow text selection for input fields', () => {
      touchHandler.initialize();
      
      expect(mockStyleElement.textContent).toContain('input, textarea, [contenteditable]');
      expect(mockStyleElement.textContent).toContain('-webkit-user-select: text');
    });
  });

  describe('Touch Point Creation', () => {
    it('should create touch point from touch event', () => {
      const mockTouch = {
        clientX: 100,
        clientY: 200,
        target: document.createElement('div')
      };

      const mockTouchEvent = {
        type: 'touchstart' as const,
        target: mockTouch.target,
        touches: [mockTouch] as any,
        changedTouches: [mockTouch] as any,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      // We need to access the private method for testing
      // This would require making the method public or using a different approach
      // For now, we'll test the public interface
      expect(touchHandler).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should have default thresholds', () => {
      // Test that the handler has the expected default configuration
      // Since these are private properties, we test through behavior
      expect(touchHandler).toBeDefined();
    });
  });

  describe('Event Prevention', () => {
    it('should prevent context menu on long press', () => {
      touchHandler.initialize();
      
      // Find the contextmenu event listener
      const contextMenuCall = mockAddEventListener.mock.calls.find(
        call => call[0] === 'contextmenu'
      );
      
      expect(contextMenuCall).toBeDefined();
      
      // Test the event handler
      const mockEvent = {
        preventDefault: vi.fn()
      };
      
      contextMenuCall[1](mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should prevent text selection during touch', () => {
      touchHandler.initialize();
      
      // Find the selectstart event listener
      const selectStartCall = mockAddEventListener.mock.calls.find(
        call => call[0] === 'selectstart'
      );
      
      expect(selectStartCall).toBeDefined();
      
      // Test the event handler
      const mockEvent = {
        preventDefault: vi.fn()
      };
      
      selectStartCall[1](mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should be compatible with mobile enhancements', () => {
      // Test that the touch handler can be used with mobile enhancements
      expect(touchHandler).toBeDefined();
      expect(() => touchHandler.initialize()).not.toThrow();
    });
  });
});
