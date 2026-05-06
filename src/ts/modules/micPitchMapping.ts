export type OctaveHint = "higher" | "lower" | null;

import {
  areNotesEquivalent,
  normalizeAccidentals as normalizeCoreAccidentals,
  noteNameToPitchClass as coreNoteNameToPitchClass,
} from "./musicTheory";

export function normalizeAccidentals(noteName: string): string {
  return normalizeCoreAccidentals(noteName);
}

export function noteNameToPitchClass(noteName: string): number | null {
  return coreNoteNameToPitchClass(noteName);
}

export function areEnharmonicEquivalent(noteA: string, noteB: string): boolean {
  return areNotesEquivalent(noteA, noteB);
}

export function getMidiFromNoteName(noteName: string, octave: number): number | null {
  const pitchClass = noteNameToPitchClass(noteName);
  if (pitchClass === null || !Number.isFinite(octave)) return null;
  return 12 * (octave + 1) + pitchClass;
}

export function foldFretToVisibleRange(fretDiff: number, visibleMaxFret: number): number | null {
  if (!Number.isFinite(fretDiff) || visibleMaxFret < 0) return null;

  let folded = fretDiff;
  while (folded < 0) folded += 12;
  while (folded > visibleMaxFret) folded -= 12;

  return folded >= 0 && folded <= visibleMaxFret ? folded : null;
}

export function resolveDetectedMidiForVisibleRange(
  noteName: string,
  octavePart: number | null,
  openMidi: number,
  visibleMaxFret: number,
): { detectedMidi: number | null; octaveNormalized: boolean } {
  const normalizedName = normalizeAccidentals(noteName);

  if (octavePart !== null) {
    const candidateMidi = getMidiFromNoteName(normalizedName, octavePart);
    if (candidateMidi === null) {
      return { detectedMidi: null, octaveNormalized: false };
    }

    const fretDiff = candidateMidi - openMidi;
    if (fretDiff >= 0 && fretDiff <= visibleMaxFret) {
      return { detectedMidi: candidateMidi, octaveNormalized: false };
    }

    const foldedFret = foldFretToVisibleRange(fretDiff, visibleMaxFret);
    if (foldedFret === null) {
      return { detectedMidi: null, octaveNormalized: false };
    }

    return { detectedMidi: openMidi + foldedFret, octaveNormalized: true };
  }

  for (let octave = 1; octave <= 8; octave++) {
    const candidateMidi = getMidiFromNoteName(normalizedName, octave);
    if (candidateMidi === null) continue;

    const fretDiff = candidateMidi - openMidi;
    if (fretDiff >= 0 && fretDiff <= visibleMaxFret) {
      return { detectedMidi: candidateMidi, octaveNormalized: false };
    }
  }

  return { detectedMidi: null, octaveNormalized: false };
}

export function getOctaveHintForDetectedNote(
  detectedNoteName: string,
  targetNoteName: string,
  detectedMidi: number,
  expectedMidis: number[],
): OctaveHint {
  if (!areEnharmonicEquivalent(detectedNoteName, targetNoteName)) return null;
  if (!expectedMidis.length) return null;

  let nearestExpected = expectedMidis[0];
  let nearestAbsDelta = Math.abs(detectedMidi - nearestExpected);

  for (let i = 1; i < expectedMidis.length; i++) {
    const absDelta = Math.abs(detectedMidi - expectedMidis[i]);
    if (absDelta < nearestAbsDelta) {
      nearestAbsDelta = absDelta;
      nearestExpected = expectedMidis[i];
    }
  }

  const isOctaveLikeDelta =
    (nearestAbsDelta >= 11 && nearestAbsDelta <= 13) ||
    (nearestAbsDelta >= 23 && nearestAbsDelta <= 25);

  if (!isOctaveLikeDelta) return null;

  return detectedMidi > nearestExpected ? "lower" : "higher";
}
