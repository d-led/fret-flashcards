// Note Utilities Module
// Pure functional utilities for note calculations, MIDI conversions, and enharmonic handling

export interface NoteAndOctave {
  note: string;
  octave: number;
}

export interface NoteVariant {
  name: string;
  idx: number;
}

// Note constants
export const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
export const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLAT_NOTES = ["Db", "Eb", "Gb", "Ab", "Bb"];
export const SHARP_NOTES = ["C#", "D#", "F#", "G#", "A#"];

export const NOTE_VARIANTS: NoteVariant[] = [
  { name: "C", idx: 0 },
  { name: "C#", idx: 1 },
  { name: "Db", idx: 1 },
  { name: "D", idx: 2 },
  { name: "D#", idx: 3 },
  { name: "Eb", idx: 3 },
  { name: "E", idx: 4 },
  { name: "F", idx: 5 },
  { name: "F#", idx: 6 },
  { name: "Gb", idx: 6 },
  { name: "G", idx: 7 },
  { name: "G#", idx: 8 },
  { name: "Ab", idx: 8 },
  { name: "A", idx: 9 },
  { name: "A#", idx: 10 },
  { name: "Bb", idx: 10 },
  { name: "B", idx: 11 },
];

// MIDI note mapping
const BASE_MIDI: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

// Key signature preferences for enharmonic spellings
const KEY_PREFERENCES: Record<string, string[]> = {
  // Sharp keys prefer sharps
  G: ["F#"],
  D: ["F#", "C#"],
  A: ["F#", "C#", "G#"],
  E: ["F#", "C#", "G#", "D#"],
  B: ["F#", "C#", "G#", "D#", "A#"],
  "F#": ["F#", "C#", "G#", "D#", "A#", "E#"],
  "C#": ["F#", "C#", "G#", "D#", "A#", "E#", "B#"],
  // Flat keys prefer flats
  F: ["Bb"],
  Bb: ["Bb", "Eb"],
  Eb: ["Bb", "Eb", "Ab"],
  Ab: ["Bb", "Eb", "Ab", "Db"],
  Db: ["Bb", "Eb", "Ab", "Db", "Gb"],
  Gb: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb"],
  Cb: ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"],
  // C major has no preference
  C: [],
};

/**
 * Calculate MIDI note number from note name and octave
 * @param note - Note name (e.g., "C", "C#", "Db")
 * @param octave - Octave number
 * @returns MIDI note number
 */
export function getMidi(note: string, octave: number): number {
  const baseMidi = BASE_MIDI[note];
  if (baseMidi === undefined) {
    throw new Error(`Invalid note: ${note}`);
  }
  return 12 * (octave + 1) + baseMidi;
}

/**
 * Convert MIDI note number to frequency in Hz
 * @param midi - MIDI note number
 * @returns Frequency in Hz
 */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Check if two notes are enharmonically equivalent (e.g., C# and Db)
 * @param note1 - First note name
 * @param note2 - Second note name
 * @returns True if notes are enharmonically equivalent
 */
export function areNotesEquivalent(note1: string, note2: string): boolean {
  const idx1 = NOTE_VARIANTS.find((nv) => nv.name === note1)?.idx;
  const idx2 = NOTE_VARIANTS.find((nv) => nv.name === note2)?.idx;
  return idx1 !== undefined && idx2 !== undefined && idx1 === idx2;
}

/**
 * Get the correct enharmonic spelling for a note based on key signature
 * @param noteIndex - MIDI note index (0-11)
 * @param keySignature - Key signature (e.g., "C", "G", "F#", "Bb")
 * @returns Preferred note name for the given key signature
 */
export function getEnharmonicForKey(noteIndex: number, keySignature: string): string {
  const preferences = KEY_PREFERENCES[keySignature] || [];

  // Find all possible note names for this MIDI note index
  const possibleNames = NOTE_VARIANTS.filter((nv) => nv.idx === noteIndex).map((nv) => nv.name);

  // If natural note exists, and key has no strong preference, use natural
  const naturalNote = ALL_NOTES[noteIndex];
  if (!naturalNote.includes("#") && !naturalNote.includes("b")) {
    return naturalNote;
  }

  // Check if any of the possible names match the key preferences
  for (const pref of preferences) {
    if (possibleNames.includes(pref)) {
      return pref;
    }
  }

  // Fall back to the first available variant or default
  return possibleNames[0] || ALL_NOTES[noteIndex];
}

/**
 * Convert MIDI note number back to note name and octave, preserving quiz note preference
 * @param midi - MIDI note number
 * @param quizNote - Preferred note name from quiz (for enharmonic preference)
 * @param keySignature - Key signature for fallback enharmonic selection
 * @returns Note name and octave
 */
export function midiToNoteAndOctave(midi: number, quizNote: string, keySignature: string = "C"): NoteAndOctave {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;

  // Normalize possible unicode accidentals passed from UI (e.g. '♯','♭')
  const normalizedQuizNote = quizNote.replace(/♯/g, "#").replace(/♭/g, "b");

  // First priority: respect an explicit quiz accidental preference (sharp/flat)
  let noteName: string | null = null;
  if (normalizedQuizNote && normalizedQuizNote.includes("b")) {
    const flatVariant = NOTE_VARIANTS.find((nv) => nv.idx === noteIndex && nv.name.includes("b"));
    if (flatVariant) {
      noteName = flatVariant.name;
    }
  } else if (normalizedQuizNote && normalizedQuizNote.includes("#")) {
    const sharpVariant = NOTE_VARIANTS.find((nv) => nv.idx === noteIndex && nv.name.includes("#"));
    if (sharpVariant) {
      noteName = sharpVariant.name;
    }
  }

  // Second priority: if quiz didn't force a choice, use key signature preferences
  if (!noteName) {
    noteName = getEnharmonicForKey(noteIndex, keySignature);
  }

  return { note: noteName, octave: octave };
}

/**
 * Get the set of notes to use based on whether accidentals are shown
 * @param showAccidentals - Whether to include accidental notes
 * @returns Array of note names
 */
export function getNotesToSet(showAccidentals: boolean): string[] {
  if (showAccidentals) {
    return ALL_NOTES.concat(FLAT_NOTES);
  }
  return NATURAL_NOTES;
}

/**
 * Normalize note name to VexFlow format (lowercase with ASCII accidentals)
 * @param noteName - Note name to normalize
 * @returns Normalized note name for VexFlow
 */
export function normalizeNoteForVexFlow(noteName: string): string {
  let normalized = noteName.toLowerCase();
  if (noteName.includes("#")) {
    normalized = noteName.charAt(0).toLowerCase() + "#";
  } else if (noteName.includes("b")) {
    normalized = noteName.charAt(0).toLowerCase() + "b";
  }
  return normalized;
}

/**
 * Get English ordinal for a positive integer (1 -> "1st", 2 -> "2nd", 11 -> "11th", etc.)
 * @param n - Positive integer
 * @returns Ordinal string
 */
export function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Validate that a note name is valid
 * @param note - Note name to validate
 * @returns True if note is valid
 */
export function isValidNote(note: string): boolean {
  return NOTE_VARIANTS.some((nv) => nv.name === note);
}

/**
 * Get all possible note names for a given MIDI note index
 * @param noteIndex - MIDI note index (0-11)
 * @returns Array of all possible note names for this pitch class
 */
export function getNoteVariants(noteIndex: number): string[] {
  return NOTE_VARIANTS.filter((nv) => nv.idx === noteIndex).map((nv) => nv.name);
}

/**
 * Check if a note is a natural note (no accidentals)
 * @param note - Note name to check
 * @returns True if note is natural
 */
export function isNaturalNote(note: string): boolean {
  return NATURAL_NOTES.includes(note);
}

/**
 * Check if a note is a sharp note
 * @param note - Note name to check
 * @returns True if note is sharp
 */
export function isSharpNote(note: string): boolean {
  return note.includes("#");
}

/**
 * Check if a note is a flat note
 * @param note - Note name to check
 * @returns True if note is flat
 */
export function isFlatNote(note: string): boolean {
  return note.includes("b") || note.includes("♭");
}
