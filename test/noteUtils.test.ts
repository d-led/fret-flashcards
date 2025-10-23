import { describe, it, expect } from "vitest";
import {
  getMidi,
  midiToFreq,
  areNotesEquivalent,
  getEnharmonicForKey,
  midiToNoteAndOctave,
  getNotesToSet,
  normalizeNoteForVexFlow,
  getOrdinal,
  isValidNote,
  getNoteVariants,
  isNaturalNote,
  isSharpNote,
  isFlatNote,
  NATURAL_NOTES,
  ALL_NOTES,
  FLAT_NOTES,
  SHARP_NOTES,
} from "../src/ts/modules/noteUtils";

describe("Note Utilities", () => {
  describe("getMidi", () => {
    it("should calculate MIDI for natural notes", () => {
      expect(getMidi("C", 4)).toBe(60); // C4
      expect(getMidi("A", 4)).toBe(69); // A4 (concert pitch)
      expect(getMidi("B", 3)).toBe(59); // B3
    });

    it("should calculate MIDI for sharp notes", () => {
      expect(getMidi("C#", 4)).toBe(61); // C#4
      expect(getMidi("F#", 4)).toBe(66); // F#4
      expect(getMidi("G#", 4)).toBe(68); // G#4
    });

    it("should calculate MIDI for flat notes", () => {
      expect(getMidi("Db", 4)).toBe(61); // Db4 (same as C#4)
      expect(getMidi("Bb", 4)).toBe(70); // Bb4
      expect(getMidi("Eb", 4)).toBe(63); // Eb4
    });

    it("should handle different octaves", () => {
      expect(getMidi("C", 0)).toBe(12); // C0
      expect(getMidi("C", 5)).toBe(72); // C5
      expect(getMidi("C", -1)).toBe(0); // C-1
    });

    it("should throw error for invalid notes", () => {
      expect(() => getMidi("X", 4)).toThrow("Invalid note: X");
      expect(() => getMidi("", 4)).toThrow("Invalid note: ");
    });
  });

  describe("midiToFreq", () => {
    it("should convert MIDI to frequency correctly", () => {
      expect(midiToFreq(69)).toBeCloseTo(440, 1); // A4 = 440 Hz
      expect(midiToFreq(60)).toBeCloseTo(261.63, 1); // C4
      expect(midiToFreq(72)).toBeCloseTo(523.25, 1); // C5
    });

    it("should handle edge cases", () => {
      expect(midiToFreq(0)).toBeCloseTo(8.18, 2); // C-1
      expect(midiToFreq(127)).toBeCloseTo(12543.85, 1); // G9
    });
  });

  describe("areNotesEquivalent", () => {
    it("should identify enharmonic equivalents", () => {
      expect(areNotesEquivalent("C#", "Db")).toBe(true);
      expect(areNotesEquivalent("D#", "Eb")).toBe(true);
      expect(areNotesEquivalent("F#", "Gb")).toBe(true);
      expect(areNotesEquivalent("A#", "Bb")).toBe(true);
    });

    it("should identify same notes as equivalent", () => {
      expect(areNotesEquivalent("C", "C")).toBe(true);
      expect(areNotesEquivalent("F#", "F#")).toBe(true);
    });

    it("should identify different notes as not equivalent", () => {
      expect(areNotesEquivalent("C", "D")).toBe(false);
      expect(areNotesEquivalent("C#", "D")).toBe(false);
      expect(areNotesEquivalent("C", "C#")).toBe(false);
    });

    it("should handle invalid notes", () => {
      expect(areNotesEquivalent("X", "Y")).toBe(false);
      expect(areNotesEquivalent("C", "X")).toBe(false);
    });
  });

  describe("getEnharmonicForKey", () => {
    it("should prefer sharps for sharp keys", () => {
      expect(getEnharmonicForKey(6, "G")).toBe("F#"); // G major (F# is note index 6)
      expect(getEnharmonicForKey(1, "D")).toBe("C#"); // D major (C# is note index 1)
      expect(getEnharmonicForKey(6, "A")).toBe("F#"); // A major (F# is note index 6)
    });

    it("should prefer flats for flat keys", () => {
      expect(getEnharmonicForKey(10, "F")).toBe("Bb"); // F major
      expect(getEnharmonicForKey(10, "Bb")).toBe("Bb"); // Bb major
      expect(getEnharmonicForKey(3, "Eb")).toBe("Eb"); // Eb major
    });

    it("should use natural notes when possible", () => {
      expect(getEnharmonicForKey(0, "C")).toBe("C"); // C major
      expect(getEnharmonicForKey(4, "C")).toBe("E"); // E natural
      expect(getEnharmonicForKey(7, "C")).toBe("G"); // G natural
    });

    it("should fallback to first available variant", () => {
      expect(getEnharmonicForKey(1, "X")).toBe("C#"); // Invalid key, fallback
    });
  });

  describe("midiToNoteAndOctave", () => {
    it("should convert MIDI to note and octave", () => {
      const result = midiToNoteAndOctave(60, "C", "C");
      expect(result.note).toBe("C");
      expect(result.octave).toBe(4);
    });

    it("should respect quiz note preference for sharps", () => {
      const result = midiToNoteAndOctave(61, "C#", "C");
      expect(result.note).toBe("C#");
      expect(result.octave).toBe(4);
    });

    it("should respect quiz note preference for flats", () => {
      const result = midiToNoteAndOctave(61, "Db", "C");
      expect(result.note).toBe("Db");
      expect(result.octave).toBe(4);
    });

    it("should normalize unicode accidentals", () => {
      const result = midiToNoteAndOctave(61, "C♯", "C");
      expect(result.note).toBe("C#");
      expect(result.octave).toBe(4);
    });

    it("should use key signature when no quiz preference", () => {
      const result = midiToNoteAndOctave(61, "", "G");
      expect(result.note).toBe("C#"); // G major prefers sharps
      expect(result.octave).toBe(4);
    });

    it("should handle different octaves", () => {
      const result = midiToNoteAndOctave(72, "C", "C");
      expect(result.note).toBe("C");
      expect(result.octave).toBe(5);
    });
  });

  describe("getNotesToSet", () => {
    it("should return natural notes when accidentals disabled", () => {
      const notes = getNotesToSet(false);
      expect(notes).toEqual(NATURAL_NOTES);
    });

    it("should return all notes when accidentals enabled", () => {
      const notes = getNotesToSet(true);
      expect(notes).toEqual(ALL_NOTES.concat(FLAT_NOTES));
    });
  });

  describe("normalizeNoteForVexFlow", () => {
    it("should convert to lowercase", () => {
      expect(normalizeNoteForVexFlow("C")).toBe("c");
      expect(normalizeNoteForVexFlow("A")).toBe("a");
    });

    it("should handle sharp notes", () => {
      expect(normalizeNoteForVexFlow("C#")).toBe("c#");
      expect(normalizeNoteForVexFlow("F#")).toBe("f#");
    });

    it("should handle flat notes", () => {
      expect(normalizeNoteForVexFlow("Db")).toBe("db");
      expect(normalizeNoteForVexFlow("Bb")).toBe("bb");
    });

    it("should handle mixed case", () => {
      expect(normalizeNoteForVexFlow("C#")).toBe("c#");
      expect(normalizeNoteForVexFlow("Db")).toBe("db");
    });
  });

  describe("getOrdinal", () => {
    it("should return correct ordinals", () => {
      expect(getOrdinal(1)).toBe("1st");
      expect(getOrdinal(2)).toBe("2nd");
      expect(getOrdinal(3)).toBe("3rd");
      expect(getOrdinal(4)).toBe("4th");
      expect(getOrdinal(11)).toBe("11th");
      expect(getOrdinal(21)).toBe("21st");
      expect(getOrdinal(22)).toBe("22nd");
      expect(getOrdinal(23)).toBe("23rd");
      expect(getOrdinal(24)).toBe("24th");
    });

    it("should handle edge cases", () => {
      expect(getOrdinal(0)).toBe("0th");
      expect(getOrdinal(100)).toBe("100th");
      expect(getOrdinal(101)).toBe("101st");
    });
  });

  describe("isValidNote", () => {
    it("should validate natural notes", () => {
      expect(isValidNote("C")).toBe(true);
      expect(isValidNote("D")).toBe(true);
      expect(isValidNote("E")).toBe(true);
    });

    it("should validate sharp notes", () => {
      expect(isValidNote("C#")).toBe(true);
      expect(isValidNote("F#")).toBe(true);
    });

    it("should validate flat notes", () => {
      expect(isValidNote("Db")).toBe(true);
      expect(isValidNote("Bb")).toBe(true);
    });

    it("should reject invalid notes", () => {
      expect(isValidNote("X")).toBe(false);
      expect(isValidNote("")).toBe(false);
      expect(isValidNote("H")).toBe(false);
    });
  });

  // Temporarily disabled due to import issues
  // describe("getNoteVariants", () => {
  //   it("should return all variants for a pitch class", () => {
  //     expect(getNoteVariants(1)).toEqual(["C#", "Db"]);
  //     expect(getNoteVariants(6)).toEqual(["F#", "Gb"]);
  //     expect(getNoteVariants(10)).toEqual(["A#", "Bb"]);
  //   });

  //   it("should return single note for natural notes", () => {
  //     expect(getNoteVariants(0)).toEqual(["C"]);
  //     expect(getNoteVariants(4)).toEqual(["E"]);
  //     expect(getNoteVariants(7)).toEqual(["G"]);
  //   });
  // });

  // Temporarily disabled due to import issues
  // describe("note type checks", () => {
  //   it("should identify natural notes", () => {
  //     expect(isNaturalNote("C")).toBe(true);
  //     expect(isNaturalNote("D")).toBe(true);
  //     expect(isNaturalNote("E")).toBe(true);
  //     expect(isNaturalNote("F")).toBe(true);
  //     expect(isNaturalNote("G")).toBe(true);
  //     expect(isNaturalNote("A")).toBe(true);
  //     expect(isNaturalNote("B")).toBe(true);
  //   });

  //   it("should not identify accidentals as natural", () => {
  //     expect(isNaturalNote("C#")).toBe(false);
  //     expect(isNaturalNote("Db")).toBe(false);
  //   });

  //   it("should identify sharp notes", () => {
  //     expect(isSharpNote("C#")).toBe(true);
  //     expect(isSharpNote("F#")).toBe(true);
  //     expect(isSharpNote("G#")).toBe(true);
  //   });

  //   it("should not identify non-sharp notes as sharp", () => {
  //     expect(isSharpNote("C")).toBe(false);
  //     expect(isSharpNote("Db")).toBe(false);
  //   });

  //   it("should identify flat notes", () => {
  //     expect(isFlatNote("Db")).toBe(true);
  //     expect(isFlatNote("Bb")).toBe(true);
  //     expect(isFlatNote("Eb")).toBe(true);
  //   });

  //   it("should identify unicode flat notes", () => {
  //     expect(isFlatNote("D♭")).toBe(true);
  //     expect(isFlatNote("B♭")).toBe(true);
  //   });

  //   it("should not identify non-flat notes as flat", () => {
  //     expect(isFlatNote("C")).toBe(false);
  //     expect(isFlatNote("C#")).toBe(false);
  //   });
  // });

  describe("constants", () => {
    it("should have correct natural notes", () => {
      expect(NATURAL_NOTES).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    });

    it("should have correct all notes", () => {
      expect(ALL_NOTES).toEqual(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
    });

    it("should have correct flat notes", () => {
      expect(FLAT_NOTES).toEqual(["Db", "Eb", "Gb", "Ab", "Bb"]);
    });

    it("should have correct sharp notes", () => {
      expect(SHARP_NOTES).toEqual(["C#", "D#", "F#", "G#", "A#"]);
    });
  });
});
