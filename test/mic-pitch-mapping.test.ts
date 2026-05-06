import { describe, expect, it } from "vitest";

import {
  areEnharmonicEquivalent,
  foldFretToVisibleRange,
  getOctaveHintForDetectedNote,
  normalizeAccidentals,
  resolveDetectedMidiForVisibleRange,
} from "../src/ts/modules/micPitchMapping";

describe("mic pitch mapping", () => {
  it("normalizes unicode accidentals", () => {
    expect(normalizeAccidentals("A♯")).toBe("A#");
    expect(normalizeAccidentals("B♭")).toBe("Bb");
  });

  it("treats sharps and flats as enharmonic equivalents", () => {
    expect(areEnharmonicEquivalent("A#", "Bb")).toBe(true);
    expect(areEnharmonicEquivalent("G#", "Ab")).toBe(true);
    expect(areEnharmonicEquivalent("A#", "A")).toBe(false);
  });

  it("folds octave offsets into visible 0-11 fret range", () => {
    // A string open MIDI (A2) is 45. A#4 is MIDI 70 -> fret 25.
    // In 11-fret mode, this should fold down by octaves to fret 1.
    const resolved = resolveDetectedMidiForVisibleRange("A#", 4, 45, 11);
    expect(resolved.detectedMidi).toBe(46);
    expect(resolved.octaveNormalized).toBe(true);
  });

  it("keeps direct in-range octave mapping without normalization", () => {
    // A#2 on A2 string => fret 1, already visible.
    const resolved = resolveDetectedMidiForVisibleRange("A#", 2, 45, 11);
    expect(resolved.detectedMidi).toBe(46);
    expect(resolved.octaveNormalized).toBe(false);
  });

  it("returns null when no octave fits visible range", () => {
    // On E2 string (40), F never lands on fret 0 (only visible fret here).
    const resolved = resolveDetectedMidiForVisibleRange("F", null, 40, 0);
    expect(resolved.detectedMidi).toBeNull();
    expect(resolved.octaveNormalized).toBe(false);
  });

  it("calculates octave hint only when pitch class matches and is octave-like", () => {
    // Target Ab3 on A-string fret 11 => expected MIDI 56
    const expected = [56];

    // Same pitch class, one octave too high => should advise lower
    expect(getOctaveHintForDetectedNote("G#", "Ab", 68, expected)).toBe("lower");

    // Same pitch class, one octave too low => should advise higher
    expect(getOctaveHintForDetectedNote("Ab", "G#", 44, expected)).toBe("higher");

    // Wrong pitch class must not produce octave hint
    expect(getOctaveHintForDetectedNote("A#", "Ab", 58, expected)).toBeNull();

    // Non-octave offset must not produce octave hint
    expect(getOctaveHintForDetectedNote("Ab", "G#", 58, expected)).toBeNull();
  });

  it("fold helper returns null when folded pitch still cannot fit visible frets", () => {
    expect(foldFretToVisibleRange(40, 11)).toBe(4);
    expect(foldFretToVisibleRange(-20, 5)).toBe(4);
    expect(foldFretToVisibleRange(7, -1)).toBeNull();
  });
});
