// VexFlow Utilities Module
// Pure functional utilities for VexFlow score rendering and SVG optimization

import { getMidi, midiToNoteAndOctave, normalizeNoteForVexFlow, NoteAndOctave } from "./noteUtils";

export interface VexFlowNote {
  note: string;
  octave: number;
}

export interface VexFlowNoteObject {
  keys: string[];
  clef: "treble" | "bass";
  duration: string;
  stemDirection: number;
}

export interface ClefRange {
  min: number;
  max: number;
}

export interface SVGBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ScoreRenderingConfig {
  trebleOctaveShift: number;
  bassOctaveShift: number;
  trebleRange: ClefRange;
  bassRange: ClefRange;
  scoreKey: string;
}

export interface ScoreRenderingResult {
  trebleNotes: VexFlowNote[];
  bassNotes: VexFlowNote[];
  trebleNoteObj: VexFlowNoteObject | null;
  bassNoteObj: VexFlowNoteObject | null;
  width: number;
}

// Default configuration for score rendering
export const DEFAULT_SCORE_CONFIG: ScoreRenderingConfig = {
  trebleOctaveShift: 12, // conventional guitar treble is written an octave higher
  bassOctaveShift: 12, // bass clef notes written 3 octaves up for proper bass guitar notation
  trebleRange: { min: 40, max: 127 }, // ~E2 to G9
  bassRange: { min: 0, max: 91 }, // ~C-1 to G6
  scoreKey: "C",
};

/**
 * Calculate the distance from a MIDI note to a range
 * @param midi - MIDI note number
 * @param min - Minimum MIDI note in range
 * @param max - Maximum MIDI note in range
 * @returns Distance from range (0 if within range)
 */
export function calculateDistanceToRange(midi: number, min: number, max: number): number {
  if (midi >= min && midi <= max) return 0;
  if (midi < min) return min - midi;
  return midi - max;
}

/**
 * Determine which clef(s) to use for a given MIDI note
 * @param midi - MIDI note number
 * @param config - Score rendering configuration
 * @returns Object indicating which clefs to use
 */
export function determineClefUsage(
  midi: number,
  config: ScoreRenderingConfig
): { useTreble: boolean; useBass: boolean; preferBass: boolean } {
  const writtenTrebleMidi = midi + config.trebleOctaveShift;
  const writtenBassMidi = midi + config.bassOctaveShift;

  const trebleFits = writtenTrebleMidi >= config.trebleRange.min && writtenTrebleMidi <= config.trebleRange.max;
  const bassFits = writtenBassMidi >= config.bassRange.min && writtenBassMidi <= config.bassRange.max;

  // Logic for determining which clef(s) to use:
  // For bass guitar range (sounding MIDI up to G3 on 3rd string), prefer bass clef
  // For higher guitar range, prefer treble clef
  // Show both if the note fits well in both ranges
  const preferBass = midi <= 55 && bassFits;
  const useTreble = (midi > 55 && trebleFits) || (preferBass && trebleFits);
  const useBass = preferBass;

  return { useTreble, useBass, preferBass };
}

/**
 * Choose the best clef when neither fits well
 * @param writtenTrebleMidi - Written MIDI for treble clef
 * @param writtenBassMidi - Written MIDI for bass clef
 * @param config - Score rendering configuration
 * @returns The chosen clef and its written MIDI
 */
export function chooseBestClef(
  writtenTrebleMidi: number,
  writtenBassMidi: number,
  config: ScoreRenderingConfig
): { clef: "treble" | "bass"; writtenMidi: number } {
  const trebleDist = calculateDistanceToRange(writtenTrebleMidi, config.trebleRange.min, config.trebleRange.max);
  const bassDist = calculateDistanceToRange(writtenBassMidi, config.bassRange.min, config.bassRange.max);

  if (bassDist < trebleDist) {
    return { clef: "bass", writtenMidi: writtenBassMidi };
  } else {
    return { clef: "treble", writtenMidi: writtenTrebleMidi };
  }
}

/**
 * Add a note to the treble notes array, avoiding duplicates
 * @param noteName - Note name
 * @param octave - Octave number
 * @param trebleNotes - Array to add to
 */
export function addTrebleNote(noteName: string, octave: number, trebleNotes: VexFlowNote[]): void {
  const vexNote = normalizeNoteForVexFlow(noteName);
  const notePair = { note: vexNote, octave };
  if (!trebleNotes.some((n) => n.note === notePair.note && n.octave === notePair.octave)) {
    trebleNotes.push(notePair);
  }
}

/**
 * Add a note to the bass notes array, avoiding duplicates
 * @param noteName - Note name
 * @param octave - Octave number
 * @param bassNotes - Array to add to
 */
export function addBassNote(noteName: string, octave: number, bassNotes: VexFlowNote[]): void {
  const vexNote = normalizeNoteForVexFlow(noteName);
  const notePair = { note: vexNote, octave };
  if (!bassNotes.some((n) => n.note === notePair.note && n.octave === notePair.octave)) {
    bassNotes.push(notePair);
  }
}

/**
 * Calculate notes for score rendering based on fret positions
 * @param quizNote - The note being quizzed
 * @param stringIndex - String index (0-based)
 * @param frets - Array of fret positions
 * @param tuning - String tuning configuration
 * @param config - Score rendering configuration
 * @returns Object containing treble and bass notes and note objects
 */
export function calculateScoreNotes(
  quizNote: string,
  stringIndex: number,
  frets: number[],
  tuning: Array<{ note: string; octave: number }>,
  config: ScoreRenderingConfig
): ScoreRenderingResult {
  const trebleNotes: VexFlowNote[] = [];
  const bassNotes: VexFlowNote[] = [];

  if (!quizNote || !frets || frets.length === 0) {
    return {
      trebleNotes,
      bassNotes,
      trebleNoteObj: null,
      bassNoteObj: null,
      width: 120,
    };
  }

  // Calculate the actual notes and octaves for each fret position (sounding midi)
  const openMidi = getMidi(tuning[stringIndex].note, tuning[stringIndex].octave);

  for (const fret of frets) {
    const midi = openMidi + fret; // sounding midi

    // For notation, apply independent octave shifts per clef
    const writtenTrebleMidi = midi + config.trebleOctaveShift;
    const writtenBassMidi = midi + config.bassOctaveShift;

    const { useTreble, useBass, preferBass } = determineClefUsage(midi, config);

    if (preferBass) {
      // Low to mid-range - prefer bass clef
      const { note: bName, octave: bOct } = midiToNoteAndOctave(writtenBassMidi, quizNote, config.scoreKey);
      addBassNote(bName, bOct, bassNotes);

      // Also add to treble if it fits well (for comparison)
      if (useTreble) {
        const { note: tName, octave: tOct } = midiToNoteAndOctave(writtenTrebleMidi, quizNote, config.scoreKey);
        addTrebleNote(tName, tOct, trebleNotes);
      }
    } else if (useTreble) {
      // High range - prefer treble clef
      const { note: tName, octave: tOct } = midiToNoteAndOctave(writtenTrebleMidi, quizNote, config.scoreKey);
      addTrebleNote(tName, tOct, trebleNotes);
    } else {
      // Fallback: choose the clef that minimizes ledger lines
      const { clef, writtenMidi } = chooseBestClef(writtenTrebleMidi, writtenBassMidi, config);
      const { note: displayNoteName, octave } = midiToNoteAndOctave(writtenMidi, quizNote, config.scoreKey);

      if (clef === "treble") {
        addTrebleNote(displayNoteName, octave, trebleNotes);
      } else {
        addBassNote(displayNoteName, octave, bassNotes);
      }
    }
  }

  // Create note objects for VexFlow
  const trebleNoteObj: VexFlowNoteObject | null =
    trebleNotes.length > 0
      ? {
          keys: trebleNotes.map((n) => `${n.note}/${n.octave}`),
          clef: "treble",
          duration: "w",
          stemDirection: 1,
        }
      : null;

  const bassNoteObj: VexFlowNoteObject | null =
    bassNotes.length > 0
      ? {
          keys: bassNotes.map((n) => `${n.note}/${n.octave}`),
          clef: "bass",
          duration: "w",
          stemDirection: -1,
        }
      : null;

  const width = quizNote.includes("#") || quizNote.includes("b") ? 140 : 120;

  return {
    trebleNotes,
    bassNotes,
    trebleNoteObj,
    bassNoteObj,
    width,
  };
}

/**
 * Normalize VexFlow note keys to ASCII accidentals
 * @param keys - Array of note keys in format "note/octave"
 * @returns Normalized keys
 */
export function normalizeVexFlowKeys(keys: string[]): string[] {
  return keys
    .map((k) => k.replace(/♯/g, "#").replace(/♭/g, "b"))
    .map((k) => {
      const parts = k.split("/");
      const notePart = parts[0];
      const octavePart = parts[1];
      const normalizedNote = notePart.charAt(0).toLowerCase() + (notePart.length > 1 ? notePart.slice(1) : "");
      return `${normalizedNote}/${octavePart}`;
    });
}

/**
 * Update bounds from SVG elements
 * @param elements - NodeList of SVG elements
 * @param bounds - Bounds object to update
 */
export function updateBoundsFromElements(elements: NodeListOf<Element>, bounds: SVGBounds): void {
  elements.forEach((element) => {
    try {
      const bbox = (element as SVGGraphicsElement).getBBox();
      bounds.minX = Math.min(bounds.minX, bbox.x);
      bounds.minY = Math.min(bounds.minY, bbox.y);
      bounds.maxX = Math.max(bounds.maxX, bbox.x + bbox.width);
      bounds.maxY = Math.max(bounds.maxY, bbox.y + bbox.height);
    } catch (e) {
      // Skip elements that can't be measured
    }
  });
}

/**
 * Apply smart cropping to SVG element
 * @param svgEl - SVG element to crop
 * @param bounds - Bounds to crop to
 * @param clefName - Name of clef for logging
 */
export function applySvgCropping(svgEl: SVGSVGElement, bounds: SVGBounds, clefName: string): void {
  if (bounds.minX !== Infinity && bounds.minY !== Infinity) {
    const margin = 5; // Smaller margin for tighter cropping
    const cropX = bounds.minX - margin;
    const cropY = bounds.minY - margin;
    const cropWidth = bounds.maxX - bounds.minX + 2 * margin;
    const cropHeight = bounds.maxY - bounds.minY + 2 * margin;

    svgEl.setAttribute("viewBox", `${cropX} ${cropY} ${cropWidth} ${cropHeight}`);
    svgEl.setAttribute("width", "100%");
    svgEl.setAttribute("height", "100%");

    console.log(`${clefName}: Smart cropped to ${cropWidth}x${cropHeight} from ${cropX},${cropY}`);
  } else {
    // Fallback to getBBox if smart cropping fails
    const bbox = svgEl.getBBox();
    const margin = 10;
    svgEl.setAttribute("viewBox", `${bbox.x - margin} ${bbox.y - margin} ${bbox.width + 2 * margin} ${bbox.height + 2 * margin}`);
    svgEl.setAttribute("width", "100%");
    svgEl.setAttribute("height", "100%");
    console.log(`${clefName}: Fallback to getBBox cropping`);
  }
}

/**
 * Optimize SVG by applying smart cropping
 * @param container - Container element containing SVG
 * @param clefName - Name of clef for logging
 */
export function optimizeSvg(container: HTMLElement, clefName: string): void {
  const svgEl = container.querySelector("svg") as SVGSVGElement;
  if (!svgEl) return;

  try {
    console.log(`Applying smart SVG optimization to ${clefName}...`);

    // Instead of using getBBox() which includes oversized text bounds,
    // manually calculate bounds based on visual elements
      const bounds: SVGBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    updateBoundsFromElements(svgEl.querySelectorAll("path"), bounds);
    updateBoundsFromElements(svgEl.querySelectorAll("circle"), bounds);

    // If we found valid bounds, use them with minimal margin
    applySvgCropping(svgEl, bounds, clefName);
  } catch (error) {
    console.error(`Error optimizing ${clefName} SVG:`, error);
  }
}

/**
 * Create a VexFlow factory configuration
 * @param elementId - ID of the container element
 * @param width - Width of the score
 * @param height - Height of the score
 * @returns VexFlow factory configuration
 */
export function createVexFlowConfig(elementId: string, width: number, height: number) {
  return {
    renderer: { elementId, width, height },
  };
}

/**
 * Validate that a VexFlow note object is valid
 * @param noteObj - VexFlow note object to validate
 * @returns True if valid
 */
export function isValidVexFlowNoteObject(noteObj: VexFlowNoteObject | null): boolean {
  return noteObj !== null && Array.isArray(noteObj.keys) && noteObj.keys.length > 0;
}
