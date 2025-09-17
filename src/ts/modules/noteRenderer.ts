import { QuizCard } from "../types/interfaces";

/**
 * Note Rendering Module
 * Handles all VexFlow-related note rendering and SVG optimization
 * Follows Single Responsibility Principle - only manages musical notation rendering
 */
export class NoteRenderer {
  private trebleOctaveShift = 12; // conventional guitar treble is written an octave higher
  private bassOctaveShift = 12; // bass clef notes written 3 octaves up for proper bass guitar notation

  constructor() {
    // Initialize VexFlow if not already done
    if (typeof VexFlow === "undefined") {
      throw new Error("VexFlow library not loaded");
    }
  }

  /**
   * Render musical notation for a quiz card
   */
  public renderNoteScore(card: QuizCard, tuning: Array<{ note: string; octave: number }>, scoreKey: string): void {
    const trebleContainer = document.getElementById("treble-score")!;
    const bassContainer = document.getElementById("bass-score")!;

    // Completely clear and reset containers
    trebleContainer.innerHTML = "";
    bassContainer.innerHTML = "";
    trebleContainer.removeAttribute("style");
    bassContainer.removeAttribute("style");

    if (!card.note || !card.frets || card.frets.length === 0) return;

    console.log("renderNoteScore - Quiz note:", card.note, "String:", card.stringIndex, "Frets:", card.frets);
    console.log("String tuning:", tuning[card.stringIndex]);

    // Calculate the actual notes and octaves for each fret position (sounding midi)
    const openMidi = this.getMidi(tuning[card.stringIndex].note, tuning[card.stringIndex].octave);
    console.log("Open MIDI:", openMidi);

    // Staff MIDI ranges heuristic (to minimize ledger lines)
    const TREBLE_MIN = 40; // ~E2 (extended down for 8-string guitar low notes)
    const TREBLE_MAX = 127; // Open upwards for high notes
    const BASS_MIN = 0; // Open downwards for low notes
    const BASS_MAX = 91; // ~G6 (written 3 octaves up from G3)

    const trebleNotes: Array<{ note: string; octave: number }> = [];
    const bassNotes: Array<{ note: string; octave: number }> = [];

    for (let f of card.frets) {
      const midi = openMidi + f; // sounding midi
      console.log(`Fret ${f}: sounding MIDI ${midi}`);

      // For notation, apply independent octave shifts per clef
      const writtenTrebleMidi = midi + this.trebleOctaveShift;
      const writtenBassMidi = midi + this.bassOctaveShift;

      // Check if notes fit well in each clef
      const trebleFits = writtenTrebleMidi >= TREBLE_MIN && writtenTrebleMidi <= TREBLE_MAX;
      const bassFits = writtenBassMidi >= BASS_MIN && writtenBassMidi <= BASS_MAX;

      console.log(`Fret ${f}: trebleFits=${trebleFits}, bassFits=${bassFits}, writtenTreble=${writtenTrebleMidi}, writtenBass=${writtenBassMidi}`);

      // Logic for determining which clef(s) to use
      if (midi <= 55 && bassFits) {
        // Low to mid-range - prefer bass clef
        const { note: bName, octave: bOct } = this.midiToNoteAndOctave(writtenBassMidi, card.note);
        this.addBassNote(bName, bOct, bassNotes);

        // Also add to treble if it fits well
        if (trebleFits) {
          const { note: tName, octave: tOct } = this.midiToNoteAndOctave(writtenTrebleMidi, card.note);
          this.addTrebleNote(tName, tOct, trebleNotes);
        }
      } else if (midi > 55 && trebleFits) {
        // High range - prefer treble clef
        const { note: tName, octave: tOct } = this.midiToNoteAndOctave(writtenTrebleMidi, card.note);
        this.addTrebleNote(tName, tOct, trebleNotes);
      } else {
        // Fallback: choose the clef that minimizes ledger lines
        const distToRange = (m: number, min: number, max: number): number => {
          if (m >= min && m <= max) return 0;
          if (m < min) return min - m;
          return m - max;
        };

        const trebleDist = distToRange(writtenTrebleMidi, TREBLE_MIN, TREBLE_MAX);
        const bassDist = distToRange(writtenBassMidi, BASS_MIN, BASS_MAX);

        let targetWrittenMidi, targetClef;
        if (bassDist < trebleDist) {
          targetWrittenMidi = writtenBassMidi;
          targetClef = "bass";
        } else {
          targetWrittenMidi = writtenTrebleMidi;
          targetClef = "treble";
        }

        const { note: displayNoteName, octave } = this.midiToNoteAndOctave(targetWrittenMidi, card.note);
        console.log(`Fret ${f}: chosen clef ${targetClef}, written MIDI ${targetWrittenMidi}, note ${displayNoteName}${octave}`);

        let vexNote = displayNoteName.toLowerCase();
        if (displayNoteName.includes("#")) {
          vexNote = displayNoteName.charAt(0).toLowerCase() + "#";
        } else if (displayNoteName.includes("b")) {
          vexNote = displayNoteName.charAt(0).toLowerCase() + "b";
        }

        const pair = { note: vexNote, octave: octave };

        if (targetClef === "treble") {
          this.addTrebleNote(displayNoteName, octave, trebleNotes);
        } else {
          this.addBassNote(displayNoteName, octave, bassNotes);
        }
      }
    }

    console.log("Treble notes:", trebleNotes);
    console.log("Bass notes:", bassNotes);

    // Create note objects for VexFlow
    const trebleNoteObj =
      trebleNotes.length > 0
        ? {
            keys: trebleNotes.map((n) => `${n.note}/${n.octave}`),
            clef: "treble",
            duration: "w",
            stemDirection: 1,
          }
        : null;
    const bassNoteObj =
      bassNotes.length > 0
        ? {
            keys: bassNotes.map((n) => `${n.note}/${n.octave}`),
            clef: "bass",
            duration: "w",
            stemDirection: -1,
          }
        : null;

    const width = card.note.includes("#") || card.note.includes("b") ? 140 : 120;

    // Render treble clef if there are notes
    if (trebleNotes.length > 0) {
      this.renderClef(trebleContainer, trebleNoteObj!, "treble", width, scoreKey);
    }

    // Render bass clef if there are notes
    if (bassNotes.length > 0) {
      this.renderClef(bassContainer, bassNoteObj!, "bass", width, scoreKey);
    }
  }

  private renderClef(container: HTMLElement, noteObj: any, clef: string, width: number, scoreKey: string): void {
    try {
      const factory = new VexFlow.Factory({
        renderer: { elementId: container.id, width: width, height: 100 },
      });

      const score = factory.EasyScore();
      const system = factory.System();

      console.log(`Rendering ${clef} notes:`, noteObj);

      // Normalize keys to ASCII accidentals (VexFlow expects '#' and 'b')
      noteObj.keys = noteObj.keys.map((k: string) => k.replace(/♯/g, "#").replace(/♭/g, "b"));
      // Ensure keys are in the form 'c#' or 'cb' (lowercase note letter, accidental ASCII preserved)
      noteObj.keys = noteObj.keys.map((k: string) => {
        const parts = k.split("/");
        const notePart = parts[0];
        const octavePart = parts[1];
        const normalizedNote = notePart.charAt(0).toLowerCase() + (notePart.length > 1 ? notePart.slice(1) : "");
        return `${normalizedNote}/${octavePart}`;
      });

      const staveNote = factory.StaveNote(noteObj);
      const voice = score.voice([staveNote]);

      // Apply accidentals automatically using VexFlow's helper
      try {
        VexFlow.Accidental.applyAccidentals([voice], scoreKey);
      } catch (e) {
        console.warn(`applyAccidentals failed for ${clef} voice, falling back to explicit modifiers`, e);
        noteObj.keys.forEach((key: string, index: number) => {
          if (key.includes("#")) staveNote.addModifier(new VexFlow.Accidental("#"), index);
          else if (key.includes("b")) staveNote.addModifier(new VexFlow.Accidental("b"), index);
        });
      }

      if (!voice || typeof voice.getTickables !== "function") {
        console.warn(`Invalid ${clef} voice, skipping draw`, voice);
        return;
      }

      voice.setMode(VexFlow.Voice.Mode.SOFT);
      system
        .addStave({ voices: [voice] })
        .addClef(clef)
        .addKeySignature(scoreKey);

      factory.draw();

      // Apply smart SVG cropping
      this.optimizeSvg(container, clef);
    } catch (err) {
      console.error(`Error rendering ${clef} staff:`, err, `\n${clef}NoteObj=`, noteObj);
    }
  }

  private optimizeSvg(container: HTMLElement, clefName: string): void {
    const svgEl = container.querySelector("svg") as SVGSVGElement;
    if (!svgEl) return;

    try {
      console.log(`Applying smart SVG optimization to ${clefName} clef...`);

      const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

      // Calculate bounds from visual elements only
      this.updateBoundsFromElements(svgEl.querySelectorAll("path"), bounds);
      this.updateBoundsFromElements(svgEl.querySelectorAll("circle"), bounds);

      this.applySvgCropping(svgEl, bounds, clefName);
    } catch (error) {
      console.error(`Error optimizing ${clefName} SVG:`, error);
    }
  }

  private updateBoundsFromElements(elements: NodeListOf<Element>, bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
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

  private applySvgCropping(svgEl: SVGSVGElement, bounds: { minX: number; minY: number; maxX: number; maxY: number }, clefName: string): void {
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

  private addTrebleNote(tName: string, tOct: number, trebleNotes: Array<{ note: string; octave: number }>): void {
    let vexT = tName.toLowerCase();
    if (tName.includes("#")) vexT = tName.charAt(0).toLowerCase() + "#";
    else if (tName.includes("b")) vexT = tName.charAt(0).toLowerCase() + "b";
    const tPair = { note: vexT, octave: tOct };
    if (!trebleNotes.some((n) => n.note === tPair.note && n.octave === tPair.octave)) trebleNotes.push(tPair);
  }

  private addBassNote(bName: string, bOct: number, bassNotes: Array<{ note: string; octave: number }>): void {
    let vexB = bName.toLowerCase();
    if (bName.includes("#")) vexB = bName.charAt(0).toLowerCase() + "#";
    else if (bName.includes("b")) vexB = bName.charAt(0).toLowerCase() + "b";
    const bPair = { note: vexB, octave: bOct };
    if (!bassNotes.some((n) => n.note === bPair.note && n.octave === bPair.octave)) bassNotes.push(bPair);
  }

  private getMidi(note: string, octave: number): number {
    const noteVariants = [
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

    const variant = noteVariants.find((v) => v.name === note);
    if (!variant) {
      throw new Error(`Unknown note: ${note}`);
    }

    return 12 + octave * 12 + variant.idx;
  }

  private midiToNoteAndOctave(midi: number, preferredNote: string): { note: string; octave: number } {
    const noteVariants = [
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

    const octave = Math.floor((midi - 12) / 12);
    const noteIndex = (((midi - 12) % 12) + 12) % 12;

    // Find the best enharmonic spelling based on preferred note
    const possibleNotes = noteVariants.filter((v) => v.idx === noteIndex);
    let chosenNote = possibleNotes[0].name;

    if (possibleNotes.length > 1) {
      // Prefer the same accidental type as the preferred note
      const preferredHasSharp = preferredNote.includes("#");
      const preferredHasFlat = preferredNote.includes("b");

      if (preferredHasSharp) {
        const sharpNote = possibleNotes.find((n) => n.name.includes("#"));
        if (sharpNote) chosenNote = sharpNote.name;
      } else if (preferredHasFlat) {
        const flatNote = possibleNotes.find((n) => n.name.includes("b"));
        if (flatNote) chosenNote = flatNote.name;
      }
    }

    return { note: chosenNote, octave };
  }
}
