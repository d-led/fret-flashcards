export interface NoteVariant {
  name: string;
  idx: number;
}

export const NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
export const ALL_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const FLAT_NOTES = ["Db", "Eb", "Gb", "Ab", "Bb"];

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

export function normalizeAccidentals(noteName: string): string {
  return noteName.replace(/♯/g, "#").replace(/♭/g, "b");
}

export function noteNameToPitchClass(noteName: string): number | null {
  const normalized = normalizeAccidentals(noteName);
  const idx = NOTE_VARIANTS.find((variant) => variant.name === normalized)?.idx;
  return typeof idx === "number" ? idx : null;
}

export function areNotesEquivalent(note1: string, note2: string): boolean {
  const idx1 = noteNameToPitchClass(note1);
  const idx2 = noteNameToPitchClass(note2);
  return idx1 !== null && idx2 !== null && idx1 === idx2;
}

export function getMidi(note: string, octave: number): number {
  const pitchClass = noteNameToPitchClass(note);
  if (pitchClass === null || !Number.isFinite(octave)) {
    return Number.NaN;
  }
  return 12 * (octave + 1) + pitchClass;
}
