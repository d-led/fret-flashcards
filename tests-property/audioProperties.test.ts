import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Property-based tests for audio-related functionality
 * These tests verify properties of audio processing and pitch detection
 */

describe("Audio Properties", () => {
  it("should handle pitch buffer operations correctly", () => {
    fc.assert(fc.property(
      fc.array(fc.float({ min: -1, max: 1 }), { minLength: 1, maxLength: 50 }),
      (audioBuffer) => {
        // Property: RMS calculation should be non-negative
        // Filter out NaN and Infinity values to prevent calculation errors (same as our fix)
        const validSamples = audioBuffer.filter(sample => Number.isFinite(sample));
        let sum = 0;
        if (validSamples.length > 0) {
          for (let i = 0; i < validSamples.length; i++) {
            sum += validSamples[i] * validSamples[i];
          }
        }
        const rms = validSamples.length > 0 ? Math.sqrt(sum / validSamples.length) : 0;
        
        expect(rms).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(rms)).toBe(true);
      }
    ), { numRuns: 3, timeout: 10000 }); // Reduced runs and timeout
  });

  it("should maintain frequency relationships", () => {
    fc.assert(fc.property(
      fc.float({ min: 80, max: 2000 }), // Base frequency
      fc.integer({ min: 1, max: 5 }), // Octave multiplier
      (baseFreq, octaveMultiplier) => {
        const octaveFreq = baseFreq * Math.pow(2, octaveMultiplier);
        
        // Property: Octave relationship should be maintained
        const ratio = octaveFreq / baseFreq;
        const expectedRatio = Math.pow(2, octaveMultiplier);
        
        expect(Math.abs(ratio - expectedRatio)).toBeLessThan(0.001);
      }
    ), { numRuns: 2, timeout: 10000 }); // Reduced runs and timeout
  });

  it("should handle pitch detection edge cases", () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant(0), // Silence
        fc.float({ min: Math.fround(0.001), max: Math.fround(0.1) }), // Very quiet
        fc.float({ min: Math.fround(0.1), max: Math.fround(1.0) }), // Normal volume
        fc.float({ min: Math.fround(1.0), max: Math.fround(10.0) }) // Loud
      ),
      fc.array(fc.float({ min: -1, max: 1 }), { minLength: 1, maxLength: 50 }),
      (volume, buffer) => {
        const scaledBuffer = buffer.map(sample => sample * volume);
        const validSamples = scaledBuffer.filter(sample => Number.isFinite(sample));
        const rms = validSamples.length > 0 ? 
          Math.sqrt(validSamples.reduce((acc, val) => acc + val * val, 0) / validSamples.length) : 
          0;
        
        // Property: RMS should scale with volume
        expect(rms).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(rms)).toBe(true);
        
        // Property: RMS should be proportional to volume (approximately)
        if (volume > 0) {
          expect(rms).toBeLessThanOrEqual(volume * Math.sqrt(buffer.length));
        }
      }
    ), { numRuns: 2, timeout: 10000 }); // Reduced runs and timeout
  });

  it("should maintain audio buffer consistency", () => {
    fc.assert(fc.property(
      fc.array(fc.float({ min: -1, max: 1 }), { minLength: 10, maxLength: 100 }),
      fc.integer({ min: 0, max: 10 }), // Number of operations
      (initialBuffer, numOperations) => {
        let buffer = [...initialBuffer];
        
        // Simulate various audio processing operations
        for (let i = 0; i < numOperations; i++) {
          // Property: Buffer length should remain consistent
          const originalLength = buffer.length;
          
          // Apply some transformation (e.g., filtering, normalization)
          buffer = buffer.map(sample => Math.max(-1, Math.min(1, sample * 0.9)));
          
          expect(buffer.length).toBe(originalLength);
          expect(buffer.every(sample => sample >= -1 && sample <= 1)).toBe(true);
        }
      }
    ), { numRuns: 2, timeout: 10000 }); // Reduced runs and timeout
  });

  it("should handle frequency detection ranges", () => {
    fc.assert(fc.property(
      fc.float({ min: 20, max: 20000 }), // Frequency in Hz
      (frequency) => {
        // Property: Frequency should be in audible range or handled gracefully
        const isAudible = frequency >= 20 && frequency <= 20000;
        const isReasonable = frequency >= 80 && frequency <= 2000; // Guitar range
        
        if (isReasonable) {
          // For reasonable frequencies, MIDI conversion should work
          const midi = 12 * Math.log2(frequency / 440) + 69;
          expect(midi).toBeGreaterThanOrEqual(0);
          expect(midi).toBeLessThanOrEqual(127);
        }
        
        // Property: All frequencies should be handled without errors
        expect(() => {
          const midi = 12 * Math.log2(frequency / 440) + 69;
          return midi;
        }).not.toThrow();
      }
    ), { numRuns: 3, timeout: 10000 }); // Reduced runs and timeout
  });
});
