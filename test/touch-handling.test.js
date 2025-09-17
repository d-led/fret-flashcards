/**
 * Touch Handling Test Suite for String Homework Tutor
 * Tests touch event handling and gesture recognition
 */

// Mock touch events for testing
function createMockTouchEvent(type, clientX = 100, clientY = 100, touches = 1) {
  const touch = {
    clientX,
    clientY,
    target: document.createElement('div'),
    identifier: 1
  };

  const event = {
    type,
    target: touch.target,
    touches: Array(touches).fill(touch),
    changedTouches: [touch],
    preventDefault: jest.fn(),
    stopPropagation: jest.fn()
  };

  return event;
}

// Mock DOM elements
function createMockElement(className, attributes = {}) {
  const element = document.createElement('div');
  element.className = className;
  
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });

  return element;
}

describe('Touch Handling', () => {
  let touchHandler;
  let mockElement;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create mock elements
    mockElement = createMockElement('fret-btn', { 'data-fret': '5' });
    document.body.appendChild(mockElement);

    // Mock global functions
    global.window = {
      mobileEnhancements: {
        hapticLight: jest.fn(),
        hapticSuccess: jest.fn(),
        hapticError: jest.fn()
      },
      handleFretClick: jest.fn(),
      handleFretboardClick: jest.fn(),
      handleQuizNoteClick: jest.fn(),
      handleSkipCountdownClick: jest.fn(),
      currentCard: { string: 0, frets: [5] }
    };

    // Import touch handler (would need proper module loading in real test)
    // touchHandler = require('../src/ts/modules/touchHandler').touchHandler;
  });

  describe('Touch Event Handling', () => {
    test('should prevent text selection during touch', () => {
      const event = createMockTouchEvent('touchstart');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      
      // Simulate touch start
      document.dispatchEvent(event);
      
      // Should prevent default to avoid text selection
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should distinguish between tap and swipe', () => {
      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      const moveEvent = createMockTouchEvent('touchmove', 150, 100); // 50px horizontal move
      const endEvent = createMockTouchEvent('touchend', 150, 100);

      // Start touch
      document.dispatchEvent(startEvent);
      
      // Move touch (should be detected as swipe)
      document.dispatchEvent(moveEvent);
      
      // End touch
      document.dispatchEvent(endEvent);

      // Should not trigger click handler for swipe
      expect(window.handleFretClick).not.toHaveBeenCalled();
    });

    test('should trigger click for short tap', () => {
      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      const endEvent = createMockTouchEvent('touchend', 105, 105); // 5px move (within threshold)

      // Start touch
      document.dispatchEvent(startEvent);
      
      // End touch quickly
      document.dispatchEvent(endEvent);

      // Should trigger click handler for tap
      expect(window.handleFretClick).toHaveBeenCalled();
    });

    test('should detect long press', (done) => {
      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      
      // Start touch
      document.dispatchEvent(startEvent);
      
      // Wait for long press threshold
      setTimeout(() => {
        expect(window.mobileEnhancements.hapticLight).toHaveBeenCalled();
        done();
      }, 600); // Slightly longer than default 500ms threshold
    });

    test('should cancel long press on movement', () => {
      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      const moveEvent = createMockTouchEvent('touchmove', 120, 100);
      
      // Start touch
      document.dispatchEvent(startEvent);
      
      // Move before long press threshold
      setTimeout(() => {
        document.dispatchEvent(moveEvent);
      }, 200);

      // Long press should be cancelled
      setTimeout(() => {
        expect(window.mobileEnhancements.hapticLight).not.toHaveBeenCalled();
      }, 600);
    });
  });

  describe('Gesture Recognition', () => {
    test('should detect horizontal swipe', () => {
      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      const moveEvent = createMockTouchEvent('touchmove', 200, 100); // 100px horizontal
      const endEvent = createMockTouchEvent('touchend', 200, 100);

      document.dispatchEvent(startEvent);
      document.dispatchEvent(moveEvent);
      document.dispatchEvent(endEvent);

      // Should be detected as swipe
      expect(touchHandler.isSwipeGesture()).toBe(true);
    });

    test('should detect vertical scroll', () => {
      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      const moveEvent = createMockTouchEvent('touchmove', 100, 200); // 100px vertical
      const endEvent = createMockTouchEvent('touchend', 100, 200);

      document.dispatchEvent(startEvent);
      document.dispatchEvent(moveEvent);
      document.dispatchEvent(endEvent);

      // Should be detected as scroll
      expect(touchHandler.isScrollGesture()).toBe(true);
    });

    test('should not trigger actions during scroll', () => {
      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      const moveEvent = createMockTouchEvent('touchmove', 100, 200);
      const endEvent = createMockTouchEvent('touchend', 100, 200);

      document.dispatchEvent(startEvent);
      document.dispatchEvent(moveEvent);
      document.dispatchEvent(endEvent);

      // Should not trigger click handlers during scroll
      expect(window.handleFretClick).not.toHaveBeenCalled();
    });
  });

  describe('Element-Specific Handling', () => {
    test('should handle fret button taps', () => {
      const fretButton = createMockElement('fret-btn', { 'data-fret': '5' });
      document.body.appendChild(fretButton);

      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      startEvent.target = fretButton;
      
      const endEvent = createMockTouchEvent('touchend', 105, 105);
      endEvent.target = fretButton;

      document.dispatchEvent(startEvent);
      document.dispatchEvent(endEvent);

      expect(window.handleFretClick).toHaveBeenCalled();
    });

    test('should handle fretboard taps', () => {
      const fretCell = createMockElement('fret-cell', { 
        'data-string': '0', 
        'data-fret': '5' 
      });
      document.body.appendChild(fretCell);

      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      startEvent.target = fretCell;
      
      const endEvent = createMockTouchEvent('touchend', 105, 105);
      endEvent.target = fretCell;

      document.dispatchEvent(startEvent);
      document.dispatchEvent(endEvent);

      expect(window.handleFretboardClick).toHaveBeenCalled();
    });

    test('should provide haptic feedback for taps', () => {
      const startEvent = createMockTouchEvent('touchstart', 100, 100);
      const endEvent = createMockTouchEvent('touchend', 105, 105);

      document.dispatchEvent(startEvent);
      document.dispatchEvent(endEvent);

      expect(window.mobileEnhancements.hapticLight).toHaveBeenCalled();
    });
  });

  describe('CSS Touch Optimizations', () => {
    test('should apply user-select: none to prevent text selection', () => {
      const style = document.querySelector('style');
      expect(style).toBeTruthy();
      expect(style.textContent).toContain('user-select: none');
    });

    test('should apply touch-action: manipulation to buttons', () => {
      const style = document.querySelector('style');
      expect(style.textContent).toContain('touch-action: manipulation');
    });

    test('should set minimum touch target sizes', () => {
      const style = document.querySelector('style');
      expect(style.textContent).toContain('min-height: 44px');
      expect(style.textContent).toContain('min-width: 44px');
    });
  });

  describe('Performance', () => {
    test('should not cause memory leaks', () => {
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Simulate many touch events
      for (let i = 0; i < 1000; i++) {
        const event = createMockTouchEvent('touchstart', 100 + i, 100 + i);
        document.dispatchEvent(event);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Memory usage should not increase significantly
      expect(finalMemory - initialMemory).toBeLessThan(1000000); // 1MB threshold
    });

    test('should handle rapid touch events efficiently', () => {
      const startTime = performance.now();
      
      // Simulate rapid touch events
      for (let i = 0; i < 100; i++) {
        const startEvent = createMockTouchEvent('touchstart', 100, 100);
        const endEvent = createMockTouchEvent('touchend', 105, 105);
        
        document.dispatchEvent(startEvent);
        document.dispatchEvent(endEvent);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle 100 touch events in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});

// Integration test for the complete touch handling system
describe('Touch Handling Integration', () => {
  test('should work with mobile enhancements', () => {
    // Mock mobile enhancements
    const mockMobileEnhancements = {
      initialize: jest.fn(),
      isTouchHandlingActive: jest.fn(() => true),
      getTouchSettings: jest.fn(() => ({
        touchMoveThreshold: 10,
        swipeThreshold: 50,
        longPressThreshold: 500
      }))
    };

    // Touch handling should integrate with mobile enhancements
    expect(mockMobileEnhancements.isTouchHandlingActive()).toBe(true);
    expect(mockMobileEnhancements.getTouchSettings()).toBeDefined();
  });

  test('should prevent spurious selections during swiping', () => {
    // This is the main test - ensure no accidental selections during swipes
    const fretButton = createMockElement('fret-btn', { 'data-fret': '5' });
    document.body.appendChild(fretButton);

    // Simulate a swipe gesture over the button
    const startEvent = createMockTouchEvent('touchstart', 100, 100);
    startEvent.target = fretButton;
    
    const moveEvent = createMockTouchEvent('touchmove', 200, 100); // Horizontal swipe
    moveEvent.target = fretButton;
    
    const endEvent = createMockTouchEvent('touchend', 200, 100);
    endEvent.target = fretButton;

    document.dispatchEvent(startEvent);
    document.dispatchEvent(moveEvent);
    document.dispatchEvent(endEvent);

    // Button should NOT be triggered during swipe
    expect(window.handleFretClick).not.toHaveBeenCalled();
    
    // But swipe should be detected
    expect(touchHandler.isSwipeGesture()).toBe(true);
  });
});
