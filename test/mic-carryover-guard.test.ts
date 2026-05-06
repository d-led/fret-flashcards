import { describe, expect, it } from "vitest";

import {
  createCarryoverGuard,
  shouldSuppressForCarryover,
  updateCarryoverGuard,
} from "../src/ts/modules/micDetectionState";

describe("mic carryover guard behavior", () => {
  it("suppresses same ringing note from previous card", () => {
    const guard = createCarryoverGuard(57); // e.g., A3 from previous answer
    expect(shouldSuppressForCarryover(guard, 57)).toBe(true);
  });

  it("releases after silence and no longer suppresses", () => {
    const guard = createCarryoverGuard(57);
    const afterSilence = updateCarryoverGuard(guard, null);

    expect(afterSilence.active).toBe(false);
    expect(shouldSuppressForCarryover(afterSilence, 57)).toBe(false);
  });

  it("releases after pitch change and allows new note processing", () => {
    const guard = createCarryoverGuard(57);
    const afterChange = updateCarryoverGuard(guard, 58);

    expect(afterChange.active).toBe(false);
    expect(shouldSuppressForCarryover(afterChange, 58)).toBe(false);
  });

  it("starts inactive when there was no previous stable note", () => {
    const guard = createCarryoverGuard(null);
    expect(guard.active).toBe(false);
    expect(shouldSuppressForCarryover(guard, 57)).toBe(false);
  });
});
