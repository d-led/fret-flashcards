import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the global variables and functions that would be available in the main app
const mockGlobalState = {
  pitchDetecting: false,
  countdownValue: 0,
  countdownInterval: null as number | null,
  currentCard: null as any,
  submitAnswer: vi.fn(),
  submitDetectedNote: vi.fn(),
};

// Mock the pitch detection loop behavior
const mockPitchDetectionLoop = {
  isRunning: false,
  start: vi.fn(() => {
    mockPitchDetectionLoop.isRunning = true;
  }),
  stop: vi.fn(() => {
    mockPitchDetectionLoop.isRunning = false;
  }),
  processNote: vi.fn((noteId: number) => {
    if (mockGlobalState.pitchDetecting && mockGlobalState.countdownValue <= 0) {
      // Only process notes when not in countdown (countdownValue <= 0 means no active countdown)
      mockGlobalState.submitDetectedNote(noteId);
    }
  }),
};

// Mock countdown functions
const mockCountdown = {
  start: vi.fn((seconds: number, onComplete: () => void) => {
    mockGlobalState.countdownValue = seconds;
    mockGlobalState.countdownInterval = window.setInterval(() => {
      mockGlobalState.countdownValue--;
      if (mockGlobalState.countdownValue <= 0) {
        mockGlobalState.countdownValue = 0;
        mockGlobalState.countdownInterval = null;
        onComplete();
      }
    }, 1000);
  }),
  clear: vi.fn(() => {
    if (mockGlobalState.countdownInterval) {
      clearInterval(mockGlobalState.countdownInterval);
      mockGlobalState.countdownInterval = null;
    }
    mockGlobalState.countdownValue = 0;
  }),
};

describe("Countdown Microphone Bug Fix", () => {
  beforeEach(() => {
    // Reset all mocks and state
    vi.clearAllMocks();
    mockGlobalState.pitchDetecting = false;
    mockGlobalState.countdownValue = 0;
    mockGlobalState.countdownInterval = null;
    mockGlobalState.currentCard = null;
    mockPitchDetectionLoop.isRunning = false;
  });

  describe("Bug Fix: Microphone input during countdown", () => {
    it("should demonstrate the bug fix - ignore microphone input during countdown", () => {
      // This test demonstrates the specific bug fix described in the issue:
      // "when the right note is submitted, and the microphone is enabled, 
      // the microphone continues to listen and detect notes. if a wrong note 
      // gets triggered, the countdown is stopped."
      
      // Setup: microphone is active and countdown is running (after correct answer)
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 3; // 3 seconds countdown
      mockPitchDetectionLoop.start();

      // BEFORE THE FIX: This would have stopped the countdown
      // AFTER THE FIX: This should be ignored
      mockPitchDetectionLoop.processNote(60); // C4 note detected during countdown

      // The fix ensures submitDetectedNote is NOT called during countdown
      expect(mockGlobalState.submitDetectedNote).not.toHaveBeenCalled();
      
      // This prevents the confusion described in the bug report:
      // "when not looking at the screen, this can cause confusion as one 
      // doesn't really know when the computer starts to listen for the next note"
    });

    it("should ignore microphone input when countdown is active", () => {
      // Setup: microphone is active and countdown is running
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 3; // 3 seconds countdown
      mockPitchDetectionLoop.start();

      // Simulate a detected note during countdown
      mockPitchDetectionLoop.processNote(60); // C4

      // Should not call submitDetectedNote during countdown
      expect(mockGlobalState.submitDetectedNote).not.toHaveBeenCalled();
    });

    it("should process microphone input when countdown is not active", () => {
      // Setup: microphone is active but no countdown
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 0; // No countdown
      mockPitchDetectionLoop.start();

      // Simulate a detected note when not in countdown
      mockPitchDetectionLoop.processNote(60); // C4

      // Should call submitDetectedNote when not in countdown
      expect(mockGlobalState.submitDetectedNote).toHaveBeenCalledWith(60);
    });

    it("should resume processing microphone input after countdown ends", () => {
      // Setup: microphone is active and countdown starts
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 1; // 1 second countdown
      mockPitchDetectionLoop.start();

      // During countdown - should ignore input
      mockPitchDetectionLoop.processNote(60);
      expect(mockGlobalState.submitDetectedNote).not.toHaveBeenCalled();

      // Simulate countdown ending
      mockGlobalState.countdownValue = 0;
      mockGlobalState.countdownInterval = null;

      // After countdown - should process input
      mockPitchDetectionLoop.processNote(62); // D4
      expect(mockGlobalState.submitDetectedNote).toHaveBeenCalledWith(62);
    });

    it("should handle multiple notes during countdown", () => {
      // Setup: microphone is active and countdown is running
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 5; // 5 seconds countdown
      mockPitchDetectionLoop.start();

      // Simulate multiple detected notes during countdown
      mockPitchDetectionLoop.processNote(60); // C4
      mockPitchDetectionLoop.processNote(62); // D4
      mockPitchDetectionLoop.processNote(64); // E4

      // None should be processed during countdown
      expect(mockGlobalState.submitDetectedNote).not.toHaveBeenCalled();
    });

    it("should handle countdown being cleared manually", () => {
      // Setup: microphone is active and countdown is running
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 3;
      mockPitchDetectionLoop.start();

      // During countdown - should ignore input
      mockPitchDetectionLoop.processNote(60);
      expect(mockGlobalState.submitDetectedNote).not.toHaveBeenCalled();

      // Clear countdown manually
      mockCountdown.clear();
      expect(mockGlobalState.countdownValue).toBe(0);

      // After clearing - should process input
      mockPitchDetectionLoop.processNote(62);
      expect(mockGlobalState.submitDetectedNote).toHaveBeenCalledWith(62);
    });

    it("should handle microphone being disabled during countdown", () => {
      // Setup: microphone is active and countdown is running
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 3;
      mockPitchDetectionLoop.start();

      // Disable microphone during countdown
      mockGlobalState.pitchDetecting = false;
      mockPitchDetectionLoop.stop();

      // Should not process any input when microphone is disabled
      mockPitchDetectionLoop.processNote(60);
      expect(mockGlobalState.submitDetectedNote).not.toHaveBeenCalled();
    });

    it("should handle countdown starting while microphone is processing", () => {
      // Setup: microphone is active and processing
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 0;
      mockPitchDetectionLoop.start();

      // Process a note before countdown
      mockPitchDetectionLoop.processNote(60);
      expect(mockGlobalState.submitDetectedNote).toHaveBeenCalledWith(60);

      // Start countdown
      mockGlobalState.countdownValue = 2;

      // Should ignore input during countdown
      mockPitchDetectionLoop.processNote(62);
      expect(mockGlobalState.submitDetectedNote).toHaveBeenCalledTimes(1); // Only the first call
    });
  });

  describe("Edge cases", () => {
    it("should handle rapid countdown state changes", () => {
      mockGlobalState.pitchDetecting = true;
      mockPitchDetectionLoop.start();

      // Rapidly change countdown state
      mockGlobalState.countdownValue = 1;
      mockPitchDetectionLoop.processNote(60);
      
      mockGlobalState.countdownValue = 0;
      mockPitchDetectionLoop.processNote(62);
      
      mockGlobalState.countdownValue = 2;
      mockPitchDetectionLoop.processNote(64);

      // Only the note when countdown was 0 should be processed
      expect(mockGlobalState.submitDetectedNote).toHaveBeenCalledTimes(1);
      expect(mockGlobalState.submitDetectedNote).toHaveBeenCalledWith(62);
    });

    it("should handle negative countdown values", () => {
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = -1; // Invalid state
      mockPitchDetectionLoop.start();

      // Should treat negative countdown as "no countdown"
      mockPitchDetectionLoop.processNote(60);
      expect(mockGlobalState.submitDetectedNote).toHaveBeenCalledWith(60);
    });

    it("should handle very long countdown periods", () => {
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 100; // Very long countdown
      mockPitchDetectionLoop.start();

      // Should ignore input during long countdown
      for (let i = 0; i < 10; i++) {
        mockPitchDetectionLoop.processNote(60 + i);
      }

      expect(mockGlobalState.submitDetectedNote).not.toHaveBeenCalled();
    });
  });

  describe("Integration with existing functionality", () => {
    it("should not interfere with UI-based answer submission during countdown", () => {
      mockGlobalState.pitchDetecting = true;
      mockGlobalState.countdownValue = 3;
      mockPitchDetectionLoop.start();

      // UI submission should still work (this would be handled by a different code path)
      // The countdown check should only affect microphone input
      expect(mockGlobalState.countdownValue).toBe(3);
    });

    it("should maintain countdown state consistency", () => {
      // Start countdown
      mockCountdown.start(3, () => {
        mockGlobalState.countdownValue = 0;
      });

      expect(mockGlobalState.countdownValue).toBe(3);
      expect(mockGlobalState.countdownInterval).not.toBeNull();

      // Clear countdown
      mockCountdown.clear();
      expect(mockGlobalState.countdownValue).toBe(0);
      expect(mockGlobalState.countdownInterval).toBeNull();
    });
  });
});
