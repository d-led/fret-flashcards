import { describe, it, expect } from "vitest";

/**
 * Test to reproduce and fix the NaN bug in audio processing
 * This bug was discovered by property-based testing
 */

describe("Audio NaN Bug", () => {
  it("should handle NaN values in audio buffer gracefully", () => {
    // This reproduces the exact scenario that caused the property test to fail
    const audioBuffer = [Number.NaN, 0];
    const volume = 0.0010000000474974513;

    const scaledBuffer = audioBuffer.map((sample) => sample * volume);
    const sum = scaledBuffer.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / audioBuffer.length);

    // The bug: This will be NaN because NaN * anything = NaN
    expect(Number.isNaN(rms)).toBe(true);

    // The fix: We should handle NaN values in the buffer
    const validBuffer = audioBuffer.filter((sample) => !Number.isNaN(sample));
    if (validBuffer.length > 0) {
      const validSum = validBuffer.reduce((acc, val) => acc + val * val, 0);
      const validRms = Math.sqrt(validSum / validBuffer.length);
      expect(Number.isFinite(validRms)).toBe(true);
    }
  });

  it("should handle empty buffer after NaN filtering", () => {
    const audioBuffer = [Number.NaN, Number.NaN];
    const volume = 0.5;

    const scaledBuffer = audioBuffer.map((sample) => sample * volume);
    const validBuffer = scaledBuffer.filter((sample) => !Number.isNaN(sample));

    // If all values are NaN, we should handle this gracefully
    expect(validBuffer.length).toBe(0);

    // Should not crash when calculating RMS of empty buffer
    const rms = validBuffer.length > 0 ? Math.sqrt(validBuffer.reduce((acc, val) => acc + val * val, 0) / validBuffer.length) : 0;

    expect(rms).toBe(0);
  });

  it("should handle mixed valid and NaN values", () => {
    const audioBuffer = [0.5, Number.NaN, 0.3, Number.NaN, 0.1];
    const volume = 0.8;

    const scaledBuffer = audioBuffer.map((sample) => sample * volume);
    const validBuffer = scaledBuffer.filter((sample) => !Number.isNaN(sample));

    expect(validBuffer.length).toBe(3);
    expect(validBuffer[0]).toBeCloseTo(0.4, 5);
    expect(validBuffer[1]).toBeCloseTo(0.24, 5);
    expect(validBuffer[2]).toBeCloseTo(0.08, 5);

    const sum = validBuffer.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / validBuffer.length);

    expect(Number.isFinite(rms)).toBe(true);
    expect(rms).toBeGreaterThan(0);
  });

  it("should handle Infinity values in audio buffer", () => {
    const audioBuffer = [0.5, Number.POSITIVE_INFINITY, 0.3];
    const volume = 0.8;

    const scaledBuffer = audioBuffer.map((sample) => sample * volume);
    const validBuffer = scaledBuffer.filter((sample) => Number.isFinite(sample));

    expect(validBuffer.length).toBe(2);
    expect(validBuffer).toEqual([0.4, 0.24]);

    const sum = validBuffer.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / validBuffer.length);

    expect(Number.isFinite(rms)).toBe(true);
  });
});
