import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getMidi, midiToNoteAndOctave, areNotesEquivalent, isValidNote } from "../src/ts/modules/noteUtils";

/**
 * Property-based tests for note utilities
 * These tests verify mathematical and logical properties of note calculations
 * Focus on functions that are actually used in the codebase
 */

describe("Note Utils Properties", () => {
  it("should maintain MIDI note consistency", () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant("C"), fc.constant("C#"), fc.constant("Db"),
        fc.constant("D"), fc.constant("D#"), fc.constant("Eb"),
        fc.constant("E"), fc.constant("F"), fc.constant("F#"), fc.constant("Gb"),
        fc.constant("G"), fc.constant("G#"), fc.constant("Ab"),
        fc.constant("A"), fc.constant("A#"), fc.constant("Bb"),
        fc.constant("B")
      ),
      fc.integer({ min: 0, max: 8 }), // Octave
      (noteName, octave) => {
        const midi = getMidi(noteName, octave);
        const reconstructed = midiToNoteAndOctave(midi, noteName, "C");
        
        // Property: MIDI to note name should be consistent
        expect(reconstructed.note).toBe(noteName);
        
        // Property: MIDI values should be in valid range
        expect(midi).toBeGreaterThanOrEqual(0);
        expect(midi).toBeLessThanOrEqual(127);
      }
    ), { numRuns: 10 });
  });

  it("should maintain octave relationships", () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant("C"), fc.constant("D"), fc.constant("E"),
        fc.constant("F"), fc.constant("G"), fc.constant("A"), fc.constant("B")
      ),
      fc.integer({ min: 0, max: 7 }), // Octave
      fc.integer({ min: 1, max: 3 }), // Octave difference
      (noteName, octave, octaveDiff) => {
        const midi1 = getMidi(noteName, octave);
        const midi2 = getMidi(noteName, octave + octaveDiff);
        
        // Property: Octave difference should be exactly 12 * octaveDiff
        expect(midi2 - midi1).toBe(12 * octaveDiff);
      }
    ), { numRuns: 5 });
  });

  it("should maintain enharmonic equivalence", () => {
    const enharmonicPairs = [
      ["C#", "Db"], ["D#", "Eb"], ["F#", "Gb"], ["G#", "Ab"], ["A#", "Bb"]
    ];
    
    fc.assert(fc.property(
      fc.oneof(...enharmonicPairs.map(pair => fc.constant(pair))),
      fc.integer({ min: 0, max: 7 }), // Octave
      (notePair, octave) => {
        const [note1, note2] = notePair;
        const midi1 = getMidi(note1, octave);
        const midi2 = getMidi(note2, octave);
        
        // Property: Enharmonic notes should have the same MIDI value
        expect(midi1).toBe(midi2);
        
        // Property: areNotesEquivalent should return true for enharmonic pairs
        expect(areNotesEquivalent(note1, note2)).toBe(true);
      }
    ), { numRuns: 5 });
  });

  it("should validate note names correctly", () => {
    const validNotes = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];
    const invalidNotes = ["X", "H", "Z", "C##", "Dbb", "", "123"];
    
    fc.assert(fc.property(
      fc.oneof(
        fc.oneof(...validNotes.map(note => fc.constant(note))),
        fc.oneof(...invalidNotes.map(note => fc.constant(note)))
      ),
      (noteName) => {
        const isValid = isValidNote(noteName);
        const shouldBeValid = validNotes.includes(noteName);
        
        // Property: isValidNote should match expected validity
        expect(isValid).toBe(shouldBeValid);
      }
    ), { numRuns: 5 });
  });

  it("should handle edge cases gracefully", () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant("C"), fc.constant("F#"), fc.constant("Bb")
      ),
      fc.oneof(
        fc.constant(-1), // Invalid octave
        fc.constant(9),  // High octave
        fc.constant(0),  // Valid low octave
        fc.constant(8)   // Valid high octave
      ),
      (noteName, octave) => {
        // Property: Function should not throw for any input
        expect(() => {
          const midi = getMidi(noteName, octave);
          if (midi >= 0 && midi <= 127) {
            const reconstructed = midiToNoteAndOctave(midi, noteName, "C");
            expect(reconstructed.note).toBeDefined();
          }
        }).not.toThrow();
      }
    ), { numRuns: 3 });
  });

  it("should maintain note equivalence consistency", () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant("C"), fc.constant("C#"), fc.constant("Db"),
        fc.constant("D"), fc.constant("D#"), fc.constant("Eb"),
        fc.constant("E"), fc.constant("F"), fc.constant("F#"), fc.constant("Gb"),
        fc.constant("G"), fc.constant("G#"), fc.constant("Ab"),
        fc.constant("A"), fc.constant("A#"), fc.constant("Bb"),
        fc.constant("B")
      ),
      fc.oneof(
        fc.constant("C"), fc.constant("C#"), fc.constant("Db"),
        fc.constant("D"), fc.constant("D#"), fc.constant("Eb"),
        fc.constant("E"), fc.constant("F"), fc.constant("F#"), fc.constant("Gb"),
        fc.constant("G"), fc.constant("G#"), fc.constant("Ab"),
        fc.constant("A"), fc.constant("A#"), fc.constant("Bb"),
        fc.constant("B")
      ),
      (note1, note2) => {
        const equivalent = areNotesEquivalent(note1, note2);
        
        // Property: Equivalence should be symmetric
        expect(areNotesEquivalent(note2, note1)).toBe(equivalent);
        
        // Property: A note should be equivalent to itself
        if (note1 === note2) {
          expect(equivalent).toBe(true);
        }
      }
    ), { numRuns: 5 });
  });
});