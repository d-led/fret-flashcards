import { PitchDetector } from "pitchy";
import { mobileEnhancements } from "./modules/mobileEnhancements";
import { touchHandler } from "./modules/touchHandler";

const buildInfo = "Build: unknown";

console.log(`loaded index.js`);

$(async function () {
  // Initialize mobile enhancements (includes touch handling)
  await mobileEnhancements.initialize();

  const SETTINGS_KEY = "guitar_flashcard_settings_v1";
  const STATS_KEY = "guitar_flashcard_stats_v1";

  // Fill build info
  const buildInfoElement = document.getElementById("build-info");
  if (buildInfoElement) {
    buildInfoElement.textContent = buildInfo;
  }

  const naturalNotes = ["C", "D", "E", "F", "G", "A", "B"];
  const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const flatNotes = ["Db", "Eb", "Gb", "Ab", "Bb"];
  const sharpNotes = ["C#", "D#", "F#", "G#", "A#"];
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

  // Independent octave shift (in semitones) applied when writing notation for each clef.
  // Adjust these to control where notes appear on the staff for treble and bass independently.
  let trebleOctaveShift = 12; // conventional guitar treble is written an octave higher
  let bassOctaveShift = 12; // bass clef notes written 3 octaves up for proper bass guitar notation

  // Helper function to process and add treble notes
  function addTrebleNote(tName: string, tOct: number, trebleNotes: Array<{ note: string; octave: number }>) {
    let vexT = tName.toLowerCase();
    if (tName.includes("#")) vexT = tName.charAt(0).toLowerCase() + "#";
    else if (tName.includes("b")) vexT = tName.charAt(0).toLowerCase() + "b";
    const tPair = { note: vexT, octave: tOct };
    if (!trebleNotes.some((n) => n.note === tPair.note && n.octave === tPair.octave)) trebleNotes.push(tPair);
  }

  // Helper function to update bounds from SVG elements
  function updateBoundsFromElements(elements: NodeListOf<Element>, bounds: { minX: number; minY: number; maxX: number; maxY: number }) {
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

  // Helper function to apply cropping to SVG element
  function applySvgCropping(svgEl: SVGSVGElement, bounds: { minX: number; minY: number; maxX: number; maxY: number }, clefName: string) {
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

  function renderNoteScore(note: string, stringIndex: number, frets: number[]) {
    const trebleContainer = document.getElementById("treble-score")!;
    const bassContainer = document.getElementById("bass-score")!;

    // Completely clear and reset containers
    trebleContainer.innerHTML = "";
    bassContainer.innerHTML = "";
    trebleContainer.removeAttribute("style");
    bassContainer.removeAttribute("style");

    if (!note || !frets || frets.length === 0) return;

    console.log("renderNoteScore - Quiz note:", note, "String:", stringIndex, "Frets:", frets);
    console.log("String tuning:", tuning[stringIndex]);

    // Calculate the actual notes and octaves for each fret position (sounding midi)
    const openMidi = getMidi(tuning[stringIndex].note, tuning[stringIndex].octave);
    console.log("Open MIDI:", openMidi);

    // Staff MIDI ranges heuristic (to minimize ledger lines)
    // Extended ranges to show notes in both clefs when appropriate
    const TREBLE_MIN = 40; // ~E2 (extended down for 8-string guitar low notes)
    const TREBLE_MAX = 127; // Open upwards for high notes
    const BASS_MIN = 0; // Open downwards for low notes
    const BASS_MAX = 91; // ~G6 (written 3 octaves up from G3)

    const trebleNotes: Array<{ note: string; octave: number }> = [];
    const bassNotes: Array<{ note: string; octave: number }> = [];

    for (let f of frets) {
      const midi = openMidi + f; // sounding midi
      console.log(`Fret ${f}: sounding MIDI ${midi}`);

      // For notation, apply independent octave shifts per clef so we can control written pitch separately
      const writtenTrebleMidi = midi + trebleOctaveShift;
      const writtenBassMidi = midi + bassOctaveShift;

      // Check if notes fit well in each clef (within staff range without too many ledger lines)
      const trebleFits = writtenTrebleMidi >= TREBLE_MIN && writtenTrebleMidi <= TREBLE_MAX;
      const bassFits = writtenBassMidi >= BASS_MIN && writtenBassMidi <= BASS_MAX;

      console.log(`Fret ${f}: trebleFits=${trebleFits}, bassFits=${bassFits}, writtenTreble=${writtenTrebleMidi}, writtenBass=${writtenBassMidi}`);

      // Logic for determining which clef(s) to use:
      // For bass guitar range (sounding MIDI up to G3 on 3rd string), prefer bass clef
      // For higher guitar range, prefer treble clef
      // Show both if the note fits well in both ranges

      if (midi <= 55 && bassFits) {
        // Low to mid-range - prefer bass clef
        const { note: bName, octave: bOct } = midiToNoteAndOctave(writtenBassMidi, note);
        let vexB = bName.toLowerCase();
        if (bName.includes("#")) vexB = bName.charAt(0).toLowerCase() + "#";
        else if (bName.includes("b")) vexB = bName.charAt(0).toLowerCase() + "b";
        const bPair = { note: vexB, octave: bOct };
        if (!bassNotes.some((n) => n.note === bPair.note && n.octave === bPair.octave)) bassNotes.push(bPair);

        // Also add to treble if it fits well (for comparison)
        if (trebleFits) {
          // Show treble clef for all notes that fit well
          const { note: tName, octave: tOct } = midiToNoteAndOctave(writtenTrebleMidi, note);
          addTrebleNote(tName, tOct, trebleNotes);
        }
      } else if (midi > 55 && trebleFits) {
        // High range - prefer treble clef
        const { note: tName, octave: tOct } = midiToNoteAndOctave(writtenTrebleMidi, note);
        addTrebleNote(tName, tOct, trebleNotes);
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

        const { note: displayNoteName, octave } = midiToNoteAndOctave(targetWrittenMidi, note);
        console.log(`Fret ${f}: chosen clef ${targetClef}, written MIDI ${targetWrittenMidi}, note ${displayNoteName}${octave}`);

        let vexNote = displayNoteName.toLowerCase();
        if (displayNoteName.includes("#")) {
          vexNote = displayNoteName.charAt(0).toLowerCase() + "#";
        } else if (displayNoteName.includes("b")) {
          vexNote = displayNoteName.charAt(0).toLowerCase() + "b";
        }

        const pair = { note: vexNote, octave: octave };

        if (targetClef === "treble") {
          if (!trebleNotes.some((n) => n.note === pair.note && n.octave === pair.octave)) trebleNotes.push(pair);
        } else {
          if (!bassNotes.some((n) => n.note === pair.note && n.octave === pair.octave)) bassNotes.push(pair);
        }
      }
    }

    console.log("Treble notes:", trebleNotes);
    console.log("Bass notes:", bassNotes);

    // Create note objects for VexFlow with explicit clef specification, matching library test style
    const trebleNoteObj = trebleNotes.length > 0 ? { keys: trebleNotes.map((n) => `${n.note}/${n.octave}`), clef: "treble", duration: "w", stemDirection: 1 } : null;
    const bassNoteObj = bassNotes.length > 0 ? { keys: bassNotes.map((n) => `${n.note}/${n.octave}`), clef: "bass", duration: "w", stemDirection: -1 } : null;

    console.log("Final treble note object:", trebleNoteObj);
    console.log("Final bass note object:", bassNoteObj);

    const width = note.includes("#") || note.includes("b") ? 140 : 120;

    // Create and render staves only when there are notes for that clef
    // (avoid rendering empty staff glyphs when no notes are present)
    if (trebleNotes.length > 0) {
      try {
        const factoryTreble = new VexFlow.Factory({
          renderer: { elementId: "treble-score", width: width, height: 100 },
        });

        const scoreTreble = factoryTreble.EasyScore();
        const systemTreble = factoryTreble.System();

        console.log("Rendering treble notes:", trebleNoteObj);

        // Defensive: don't attempt to create a voice from an empty array
        if (!trebleNoteObj) {
          console.warn("Skipping treble render: no notes");
        } else {
          // Normalize keys to ASCII accidentals (VexFlow expects '#' and 'b')
          trebleNoteObj.keys = trebleNoteObj.keys.map((k) => k.replace(/♯/g, "#").replace(/♭/g, "b"));
          // Ensure keys are in the form 'c#' or 'cb' (lowercase note letter, accidental ASCII preserved)
          trebleNoteObj.keys = trebleNoteObj.keys.map((k) => {
            const parts = k.split("/");
            const notePart = parts[0];
            const octavePart = parts[1];
            const normalizedNote = notePart.charAt(0).toLowerCase() + (notePart.length > 1 ? notePart.slice(1) : "");
            return `${normalizedNote}/${octavePart}`;
          });

          const trebleStaveNote = factoryTreble.StaveNote(trebleNoteObj);

          const voiceTreble = scoreTreble.voice([trebleStaveNote]);
          // Apply accidentals automatically using VexFlow's helper (respects key signature)
          try {
            VexFlow.Accidental.applyAccidentals([voiceTreble], scoreKey);
          } catch (e) {
            console.warn("applyAccidentals failed for treble voice, falling back to explicit modifiers", e);
            trebleNoteObj.keys.forEach((key, index) => {
              if (key.includes("#")) trebleStaveNote.addModifier(new VexFlow.Accidental("#"), index);
              else if (key.includes("b")) trebleStaveNote.addModifier(new VexFlow.Accidental("b"), index);
            });
          }

          // Defensive: ensure voiceTreble appears valid before formatting/drawing
          if (!voiceTreble || typeof voiceTreble.getTickables !== "function") {
            console.warn("Invalid treble voice, skipping draw", voiceTreble);
          } else {
            voiceTreble.setMode(VexFlow.Voice.Mode.SOFT);
            systemTreble
              .addStave({ voices: [voiceTreble] })
              .addClef("treble")
              .addKeySignature(scoreKey);

            factoryTreble.draw();

            // Apply smart SVG cropping (focus on visual content, not text bounding boxes)
            (async () => {
              const trebleSvgEl = trebleContainer?.querySelector("svg");
              if (trebleSvgEl) {
                try {
                  console.log("Applying smart SVG optimization to treble clef...");

                  // Instead of using getBBox() which includes oversized text bounds,
                  // manually calculate bounds based on visual elements
                  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
                  updateBoundsFromElements(trebleSvgEl.querySelectorAll("path"), bounds);

                  // Get bounds from circles (note heads)
                  updateBoundsFromElements(trebleSvgEl.querySelectorAll("circle"), bounds);

                  // If we found valid bounds, use them with minimal margin
                  applySvgCropping(trebleSvgEl, bounds, "Treble clef");
                } catch (error) {
                  console.error("Error optimizing treble SVG:", error);
                }
              }
            })();
          }
        }
      } catch (err) {
        console.error("Error rendering treble staff:", err, "\ntrebleNoteObj=", trebleNoteObj, "\ntrebleNotes=", trebleNotes);
      }
    }

    if (bassNotes.length > 0) {
      try {
        const factoryBass = new VexFlow.Factory({
          renderer: { elementId: "bass-score", width: width, height: 100 },
        });

        const scoreBass = factoryBass.EasyScore();
        const systemBass = factoryBass.System();

        console.log("Rendering bass notes:", bassNoteObj);

        if (!bassNoteObj) {
          console.warn("Skipping bass render: no notes");
        } else {
          // Normalize keys to ASCII accidentals for VexFlow
          bassNoteObj.keys = bassNoteObj.keys.map((k) => k.replace(/♯/g, "#").replace(/♭/g, "b"));
          bassNoteObj.keys = bassNoteObj.keys.map((k) => {
            const parts = k.split("/");
            const notePart = parts[0];
            const octavePart = parts[1];
            const normalizedNote = notePart.charAt(0).toLowerCase() + (notePart.length > 1 ? notePart.slice(1) : "");
            return `${normalizedNote}/${octavePart}`;
          });

          const bassStaveNote = factoryBass.StaveNote(bassNoteObj);

          const voiceBass = scoreBass.voice([bassStaveNote]);
          // Apply accidentals automatically for the bass voice as well
          try {
            VexFlow.Accidental.applyAccidentals([voiceBass], scoreKey);
          } catch (e) {
            console.warn("applyAccidentals failed for bass voice, falling back to explicit modifiers", e);
            bassNoteObj.keys.forEach((key, index) => {
              if (key.includes("#")) bassStaveNote.addModifier(new VexFlow.Accidental("#"), index);
              else if (key.includes("b")) bassStaveNote.addModifier(new VexFlow.Accidental("b"), index);
            });
          }

          if (!voiceBass || typeof voiceBass.getTickables !== "function") {
            console.warn("Invalid bass voice, skipping draw", voiceBass);
          } else {
            voiceBass.setMode(VexFlow.Voice.Mode.SOFT);
            systemBass
              .addStave({ voices: [voiceBass] })
              .addClef("bass")
              .addKeySignature(scoreKey);

            factoryBass.draw();

            // Apply smart SVG cropping (focus on visual content, not text bounding boxes)
            (async () => {
              const bassSvgEl = bassContainer?.querySelector("svg");
              if (bassSvgEl) {
                try {
                  console.log("Applying smart SVG optimization to bass clef...");

                  // Instead of using getBBox() which includes oversized text bounds,
                  // manually calculate bounds based on visual elements
                  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
                  updateBoundsFromElements(bassSvgEl.querySelectorAll("path"), bounds);

                  // Get bounds from circles (note heads)
                  updateBoundsFromElements(bassSvgEl.querySelectorAll("circle"), bounds);

                  // If we found valid bounds, use them with minimal margin
                  applySvgCropping(bassSvgEl, bounds, "Bass clef");
                } catch (error) {
                  console.error("Error optimizing bass SVG:", error);
                }
              }
            })();
          }
        }
      } catch (err) {
        console.error("Error rendering bass staff:", err, "\nbassNoteObj=", bassNoteObj, "\nbassNotes=", bassNotes);
      }
    }
  }

  const typicalFretMarks = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
  const doubleFretMarkers = [12, 24];

  let currentCard: any = null;
  let fretCountSetting = 11; // User's selected fret count (11 = basic mode with 0-11 positions)
  let showAccidentals = false;
  let timeoutSeconds = 2;
  let pendingTimeout: any = null;
  let session: any[] = [];
  let sessionIdx = 0;
  let foundFrets: any[] = [];
  let countdownInterval: any = null;
  let countdownValue = 0;
  let fretCount = 12; // calculated based on fretCountSetting (0th fret + selected count)

  // Declare stringNames as an empty array (was missing, causing UI breakage)
  let stringNames: any[] = [];

  // Add new variables for configurable strings and tuning
  let numStrings = 6;

  // Default tunings for different string counts (expanded to 3-12)
  const defaultTunings = {
    3: {
      name: "Kids guitar",
      strings: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
      ],
    },
    4: {
      name: "Mandolin",
      strings: [
        { note: "E", octave: 4 },
        { note: "A", octave: 3 },
        { note: "D", octave: 3 },
        { note: "G", octave: 2 },
      ],
    },
    5: {
      name: "Open G",
      strings: [
        { note: "D", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "G", octave: 2 },
      ],
    },
    6: {
      name: "Standard",
      strings: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
      ],
    },
    7: {
      name: "7-String Standard",
      strings: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
        { note: "B", octave: 2 },
      ],
    },
    8: {
      name: "8-String Standard",
      strings: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
        { note: "B", octave: 2 },
        { note: "F#", octave: 2 },
      ],
    },
    9: {
      name: "9-String Standard",
      strings: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
        { note: "B", octave: 2 },
        { note: "F#", octave: 2 },
        { note: "C#", octave: 1 },
      ],
    },
    10: {
      name: "10-String Standard",
      strings: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
        { note: "B", octave: 2 },
        { note: "F#", octave: 2 },
        { note: "C#", octave: 1 },
        { note: "G#", octave: 1 },
      ],
    },
    11: {
      name: "11-String Standard",
      strings: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
        { note: "B", octave: 2 },
        { note: "F#", octave: 2 },
        { note: "C#", octave: 1 },
        { note: "G#", octave: 1 },
        { note: "D#", octave: 1 },
      ],
    },
    12: {
      name: "12-String Standard",
      strings: [
        { note: "E", octave: 4 },
        { note: "B", octave: 3 },
        { note: "G", octave: 3 },
        { note: "D", octave: 3 },
        { note: "A", octave: 2 },
        { note: "E", octave: 2 },
        { note: "B", octave: 2 },
        { note: "F#", octave: 2 },
        { note: "C#", octave: 1 },
        { note: "G#", octave: 1 },
        { note: "D#", octave: 1 },
        { note: "A#", octave: 1 },
      ],
    },
  };

  let tuning = defaultTunings[6].strings.slice(); // Initialize from defaultTunings to avoid duplication

  let statistics: { answers: any[] } = {
    answers: [],
  }; // Object to hold answer events in 'answers' array

  let enableBias = true; // Default to true for improved learning
  let showScoreNotation = false; // Default to false, to hide score by default
  let scoreKey = "C"; // Default key for score notation
  let hideQuizNote = false; // Default to false, to show quiz note by default
  let enableTTS = false; // Default to false, text-to-speech for quiz notes
  let selectedVoice: string | null = null; // Selected voice for TTS, null means use default
  let ttsInitialized = false; // Track if TTS has been initialized with user interaction
  let ttsUserInitialized = false; // Track if TTS has been initialized by user interaction (banner click)
  let consecutiveMistakes = 0; // Track consecutive wrong answers for TTS repeat
  let consecutiveOctaveMistakes = 0; // Track consecutive octave mistakes for octave hint
  let lastOctaveHintTime = 0; // Track last time octave hint was given for debouncing
  let hintsCurrentlyPlaying = false; // Track if hints (TTS or sound) are still playing during transition

  // Test state tracking
  let utteranceLog: string[] = []; // Track all utterances for testing

  // Test state update functions
  function updateTestState() {
    const audioEnabledEl = document.getElementById("audio-enabled");
    const ttsEnabledEl = document.getElementById("tts-enabled");
    const ttsInitializedEl = document.getElementById("tts-initialized");
    const selectedVoiceEl = document.getElementById("selected-voice");
    const ttsQueueLengthEl = document.getElementById("tts-queue-length");
    const ttsCurrentlyPlayingEl = document.getElementById("tts-currently-playing");
    const utteranceLogEl = document.getElementById("utterance-log");

    if (audioEnabledEl) audioEnabledEl.setAttribute("data-enabled", audioEnabled.toString());
    if (ttsEnabledEl) ttsEnabledEl.setAttribute("data-enabled", enableTTS.toString());
    if (ttsInitializedEl) ttsInitializedEl.setAttribute("data-initialized", ttsInitialized.toString());
    if (selectedVoiceEl) selectedVoiceEl.setAttribute("data-voice", selectedVoice || "");
    if (ttsQueueLengthEl) ttsQueueLengthEl.setAttribute("data-length", ttsQueue.length.toString());
    if (ttsCurrentlyPlayingEl) ttsCurrentlyPlayingEl.setAttribute("data-playing", ttsCurrentlyPlaying.toString());
    if (utteranceLogEl) utteranceLogEl.setAttribute("data-log", JSON.stringify(utteranceLog));
  }

  function logUtterance(text: string) {
    utteranceLog.push(text);
    // Keep only last 50 utterances to prevent memory issues
    if (utteranceLog.length > 50) {
      utteranceLog = utteranceLog.slice(-50);
    }
    updateTestState();
  }

  // Simple TTS system with queuing
  interface TTSQueueItem {
    text: string;
    priority: number; // Lower numbers = higher priority
  }

  let ttsQueue: TTSQueueItem[] = [];
  let ttsCurrentlyPlaying = false;

  // Simple TTS functions
  function initializeTTS() {
    if (!("speechSynthesis" in window)) return false;

    speechSynthesis.cancel(); // removes anything 'stuck'
    speechSynthesis.getVoices();
    ttsInitialized = true;
    updateTestState();
    return true;
  }

  function addToTTSQueue(text: string, priority: number = 50, shouldLog: boolean = true) {
    if (!enableTTS || !("speechSynthesis" in window)) return;

    // Insert item in priority order (lower number = higher priority)
    let insertIndex = ttsQueue.length;
    for (let i = 0; i < ttsQueue.length; i++) {
      if (ttsQueue[i].priority > priority) {
        insertIndex = i;
        break;
      }
    }
    ttsQueue.splice(insertIndex, 0, { text, priority });

    // Log utterance for testing (only when TTS is enabled and shouldLog is true)
    if (shouldLog) {
      logUtterance(text);
    }

    // Update test state
    updateTestState();

    // Process queue if not already playing
    if (!ttsCurrentlyPlaying) {
      processTTSQueue();
    }
  }

  function processTTSQueue() {
    if (!enableTTS || ttsQueue.length === 0 || !("speechSynthesis" in window) || !ttsInitialized) {
      ttsCurrentlyPlaying = false;
      updateTestState();
      return;
    }

    ttsCurrentlyPlaying = true;
    updateTestState();
    const item = ttsQueue.shift()!;

    const utterance = new SpeechSynthesisUtterance(item.text);

    // Set voice if available
    const voices = speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      setBestVoice(utterance, voices, selectedVoice || undefined);
    }

    utterance.onend = () => {
      ttsCurrentlyPlaying = false;
      updateTestState();
      // Process next item in queue
      if (ttsQueue.length > 0) {
        setTimeout(() => processTTSQueue(), 100); // Small delay between items
      }
    };

    utterance.onerror = () => {
      ttsCurrentlyPlaying = false;
      updateTestState();
      // Process next item in queue even on error
      if (ttsQueue.length > 0) {
        setTimeout(() => processTTSQueue(), 100);
      }
    };

    try {
      speechSynthesis.speak(utterance);
    } catch (error) {
      // Handle synchronous errors
      ttsCurrentlyPlaying = false;
      updateTestState();
      // Process next item in queue even on error
      if (ttsQueue.length > 0) {
        setTimeout(() => processTTSQueue(), 100);
      }
    }
  }

  function clearTTSQueue() {
    ttsQueue = [];
    speechSynthesis.cancel();
    ttsCurrentlyPlaying = false;
    updateTestState();
  }

  function setBestVoice(utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[], selectedVoiceName?: string) {
    // If a specific voice was selected, try to use it
    if (selectedVoiceName) {
      const selectedVoice = voices.find((v) => v.name === selectedVoiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        return;
      }
    }

    // Otherwise, prefer local English voices over network voices
    const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
    const localEnglishVoices = englishVoices.filter((v) => v.localService);

    // iOS-specific: try to pick a consistent Siri US English voice if available
    try {
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (isiOS && englishVoices.length > 0) {
        // Prefer local Siri English; among Siri voices, try to pick a stable male voice variant when present
        const siriEnglish = englishVoices.filter((v) => /siri/i.test(v.name));
        const siriLocal = siriEnglish.filter((v) => v.localService);
        const candidates = (siriLocal.length ? siriLocal : siriEnglish).filter((v) => /en/i.test(v.lang));
        if (candidates.length > 0) {
          // Heuristic: pick a voice whose name suggests a lower-numbered variant (often male), else first
          const preferred = candidates.find((v) => /(voice\s*2|voice\s*4)/i.test(v.name)) || candidates[0];
          utterance.voice = preferred;
          return;
        }
      }
    } catch (e) {
      // ignore UA parsing issues
    }

    if (localEnglishVoices.length > 0) {
      // Use the first local English voice
      utterance.voice = localEnglishVoices[0];
    } else if (englishVoices.length > 0) {
      // Fallback to any English voice
      utterance.voice = englishVoices[0];
    }
    // If no English voices, let the browser choose the default
  }

  function speakTTSStatusMessage(message: string, force: boolean = false) {
    if (!("speechSynthesis" in window)) return;
    if (!enableTTS && !force) return;

    // Initialize TTS if not already initialized
    if (!ttsInitialized) {
      initializeTTS();
    }

    // Add status message to TTS queue with high priority
    addToTTSQueue(message, 10); // High priority for status messages
  }

  function speakSystemMessage(message: string) {
    if (!("speechSynthesis" in window)) return;

    // Initialize TTS if not already initialized
    if (!ttsInitialized) {
      initializeTTS();
    }

    // Always speak system messages regardless of TTS setting
    // Use addToTTSQueue but don't log for testing purposes
    addToTTSQueue(message, 5, false); // High priority for system messages, don't log
  }

  // Speak a status message immediately (bypassing the queue) to improve reliability on iOS
  function speakStatusImmediate(message: string) {
    if (!("speechSynthesis" in window)) return;

    // Initialize TTS if not already initialized
    if (!ttsInitialized) {
      initializeTTS();
    }

    // Add to queue with highest priority
    addToTTSQueue(message, 1);
  }

  // Load voices when available - based on Stack Overflow solution
  function loadVoicesWhenAvailable(onComplete = () => {}) {
    const voices = speechSynthesis.getVoices();

    if (voices.length !== 0) {
      onComplete();
    } else {
      // Wait for voices to load
      const handler = () => {
        speechSynthesis.removeEventListener("voiceschanged", handler);
        onComplete();
      };
      speechSynthesis.addEventListener("voiceschanged", handler, { once: true } as any);

      // Fallback timeout
      setTimeout(() => {
        speechSynthesis.removeEventListener("voiceschanged", handler);
        onComplete();
      }, 2000);
    }
  }

  // Speak quiz note immediately during user interaction (for iOS compatibility)
  function speakQuizNoteImmediately() {
    if (!currentCard || !enableTTS || !("speechSynthesis" in window)) return;

    const ordinalString = getOrdinal(currentCard.string + 1);
    let spokenNote = currentCard.note;

    // Spell out accidentals for clarity
    if (spokenNote.includes("#")) {
      spokenNote = spokenNote.replace("#", " sharp");
    } else if (spokenNote.includes("b") || spokenNote.includes("♭")) {
      spokenNote = spokenNote.replace(/[b♭]/, " flat");
    }

    const text = `Note ${spokenNote}, ${ordinalString} string`;
    console.log("Speaking quiz note immediately:", text);

    // Speak directly without using the queue system to ensure it happens during user interaction
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.7;
      utterance.volume = 0.9;
      utterance.pitch = 1.0;

      // Load voices when available
      loadVoicesWhenAvailable(() => {
        const voices = speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setBestVoice(utterance, voices, selectedVoice || undefined);
        }
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
      });
    } catch (e) {
      console.warn("speakQuizNoteImmediately failed:", e);
    }
  }

  // Functions to manage hint state during transitions
  function areHintsPlaying() {
    return ttsCurrentlyPlaying || audioCurrentlyPlaying || hintsCurrentlyPlaying;
  }

  function areHintsPlayingForMicMode() {
    // Only block input during hints if microphone is being used AND we're actively processing mic input
    // This prevents button clicks from interfering with microphone pitch detection feedback,
    // but allows button input during general hint playback (like transition sounds)
    return pitchDetecting && hintsCurrentlyPlaying;
  }

  function setHintsPlaying(playing: boolean) {
    hintsCurrentlyPlaying = playing;
  }

  function waitForHintsToComplete(callback: () => void) {
    if (!areHintsPlaying()) {
      callback();
      return;
    }

    const checkInterval = setInterval(() => {
      if (!areHintsPlaying()) {
        clearInterval(checkInterval);
        callback();
      }
    }, 100); // Check every 100ms
  }

  // Voice management functions
  function populateVoiceSelection() {
    const voiceSelect = $("#voice-select");
    voiceSelect.empty();
    voiceSelect.append('<option value="">Default</option>');

    if ("speechSynthesis" in window) {
      const voices = speechSynthesis.getVoices();
      
      // In CI/test environments, if no voices are available, add mock voices for testing
      if (voices.length === 0 && (navigator.userAgent.includes("HeadlessChrome") || navigator.userAgent.includes("Cypress"))) {
        const mockVoices = [
          { name: "Mock Voice 1", lang: "en-US", localService: true },
          { name: "Mock Voice 2", lang: "en-GB", localService: false }
        ];
        voices.push(...mockVoices);
      }

      // Filter to English only - iOS Safari has bugs with lang property
      // so we need to filter by both language code AND voice name
      const englishVoices: SpeechSynthesisVoice[] = voices.filter((v) => {
        if (!v || typeof v.lang !== "string") return false;
        const lang = v.lang.toLowerCase();
        const name = v.name.toLowerCase();

        // Only include voices that are exactly "en" or start with "en-" (like "en-US", "en-GB")
        const isEnglishLang = lang === "en" || lang.startsWith("en-");

        // Known non-English voice names (iOS Safari lang property is unreliable)
        const nonEnglishVoiceNames = [
          "grandpa",
          "german",
          "deutsch",
          "français",
          "francais",
          "español",
          "espanol",
          "italiano",
          "português",
          "portugues",
          "flo",
          "anna",
          "thomas",
          "katrin",
          "marco",
          "sophie",
          "hans",
          "greta",
          "klaus",
          "ingrid",
          "wolfgang",
        ];

        const hasNonEnglishName = nonEnglishVoiceNames.some((nonEngName) => name.includes(nonEngName));

        return isEnglishLang && !hasNonEnglishName;
      });

      englishVoices.forEach((voice) => {
        const quality = voice.localService ? " (Device)" : " (Network)";
        const option = `<option value="${voice.name}">${voice.name}${quality}</option>`;
        voiceSelect.append(option);
      });

      // Validate that the selected voice still exists in available English voices
      // Only do this validation when TTS is actually enabled
      if (selectedVoice && enableTTS) {
        const voiceExists = englishVoices.some((v) => v.name === selectedVoice);
        if (!voiceExists) {
          // If selected voice is not in the filtered English voices, reset to default
          selectedVoice = null;
          // Update the stored setting as well
          const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
          const updatedSettings = { ...settings, selectedVoice: null };
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
        }
      }
    }

    // Set the selected voice if one was previously chosen
    if (selectedVoice) {
      voiceSelect.val(selectedVoice);
    }
  }

  function updateVoiceSelectionVisibility() {
    const $voiceSelection = $("#voice-selection");
    const $enableTTS = $("#enable-tts");

    if ($enableTTS.is(":checked") && isTTSSupported()) {
      $voiceSelection.show();
    } else {
      $voiceSelection.hide();
    }
  }

  // Octaves for MIDI calculation based on string count (expanded to 3-12)
  // Removed: now combined into defaultTunings

  // Function to calculate MIDI from note and octave
  function getMidi(note: string, octave: number) {
    const baseMidi = {
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
    return 12 * (octave + 1) + baseMidi[note as keyof typeof baseMidi];
  }

  // Helper function to check if two notes are enharmonically equivalent (e.g., C# and Db)
  function areNotesEquivalent(note1: string, note2: string) {
    // Find the pitch class index for both notes using the static noteVariants
    const idx1 = noteVariants.find((nv) => nv.name === note1)?.idx;
    const idx2 = noteVariants.find((nv) => nv.name === note2)?.idx;
    return idx1 !== undefined && idx2 !== undefined && idx1 === idx2;
  }

  // Helper function to get the correct enharmonic spelling for a note based on key signature
  function getEnharmonicForKey(noteIndex: number, keySignature: string) {
    // Define key signature preferences for enharmonic spellings
    const keyPreferences = {
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

    const preferences = keyPreferences[keySignature as keyof typeof keyPreferences] || [];

    // Find all possible note names for this MIDI note index
    const possibleNames = noteVariants.filter((nv) => nv.idx === noteIndex).map((nv) => nv.name);

    // If natural note exists, and key has no strong preference, use natural
    const naturalNote = allNotes[noteIndex];
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
    return possibleNames[0] || allNotes[noteIndex];
  }

  // Function to convert MIDI back to note name and octave, preserving the quiz note preference
  function midiToNoteAndOctave(midi: number, quizNote: string) {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;

    // Normalize possible unicode accidentals passed from UI (e.g. '♯','♭')
    quizNote = quizNote.replace(/♯/g, "#").replace(/♭/g, "b");

    console.log(`midiToNoteAndOctave: midi=${midi}, noteIndex=${noteIndex}, quizNote=${quizNote}, scoreKey=${scoreKey}`);

    // First priority: respect an explicit quiz accidental preference (sharp/flat)
    let noteName = null;
    if (quizNote && quizNote.includes("b")) {
      const flatVariant = noteVariants.find((nv) => nv.idx === noteIndex && nv.name.includes("b"));
      if (flatVariant) {
        noteName = flatVariant.name;
        console.log(`Using quiz flat preference: ${noteName}`);
      }
    } else if (quizNote && quizNote.includes("#")) {
      const sharpVariant = noteVariants.find((nv) => nv.idx === noteIndex && nv.name.includes("#"));
      if (sharpVariant) {
        noteName = sharpVariant.name;
        console.log(`Using quiz sharp preference: ${noteName}`);
      }
    }

    // Second priority: if quiz didn't force a choice, use key signature preferences
    if (!noteName) {
      noteName = getEnharmonicForKey(noteIndex, scoreKey);
    }

    console.log(`midiToNoteAndOctave result: ${noteName}${octave} (key-context: ${getEnharmonicForKey(noteIndex, scoreKey)})`);
    return { note: noteName, octave: octave };
  }

  // Update saveSettings to include new config
  function saveSettings() {
    const settings = {
      fretCount: Number(fretCountSetting),
      showAccidentals: showAccidentals,
      timeoutSeconds: Number(timeoutSeconds),
      numStrings: Number(numStrings),
      tuning: tuning.slice(),
      enableBias: enableBias,
      showScoreNotation: showScoreNotation,
      scoreKey: scoreKey,
      hideQuizNote: hideQuizNote,
      enableTTS: enableTTS,
      selectedVoice: selectedVoice,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // Update loadSettings to load new config (adjusted validation for 3-12)
  let $timeout = $("#timeout-seconds");

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const settings = JSON.parse(raw);
      if (typeof settings !== "object") return;

      // Cache frequently used selectors
      const $fretCount = $("#fret-count");
      const $enableBias = $("#enable-bias");
      const $hideQuizNote = $("#hide-quiz-note");

      // Handle backward compatibility with extendedRange
      if ("extendedRange" in settings) {
        fretCountSetting = settings.extendedRange ? 24 : 11; // 11 frets for basics mode
        $fretCount.val(fretCountSetting);
      } else if ("fretCount" in settings) {
        let val = Number(settings.fretCount);
        // Accept both old (12) and new (11) values for basics mode for compatibility
        if (val === 12) val = 11; // Convert old 12 to new 11
        if (val === 11 || val === 21 || val === 22 || val === 24) {
          fretCountSetting = val;
          $fretCount.val(fretCountSetting);
        }
      }

      if ("showAccidentals" in settings) {
        showAccidentals = settings.showAccidentals;
        $("#accidentals").prop("checked", showAccidentals);
      }
      if ("timeoutSeconds" in settings) {
        let val = Number(settings.timeoutSeconds);
        if (isFinite(val) && val >= 0 && val <= 10) {
          timeoutSeconds = val;
          $timeout.val(timeoutSeconds);
        }
      }
      if ("numStrings" in settings) {
        let val = Number(settings.numStrings);
        if (val >= 3 && val <= 10) {
          numStrings = val;
          $("#num-strings").val(numStrings);
        }
      }
      if ("tuning" in settings && Array.isArray(settings.tuning) && settings.tuning.length === numStrings) {
        // Validate that each tuning element has note and octave
        if (settings.tuning.every((t: unknown) => t && typeof (t as any).note === "string" && typeof (t as any).octave === "number")) {
          tuning = settings.tuning.slice();
        } else {
          tuning = defaultTunings[numStrings as keyof typeof defaultTunings].strings.slice();
        }
      } else {
        tuning = defaultTunings[numStrings as keyof typeof defaultTunings].strings.slice();
      }
      if ("enableBias" in settings) {
        enableBias = settings.enableBias;
        $enableBias.prop("checked", enableBias);
      } else {
        $enableBias.prop("checked", enableBias); // Ensure default true is reflected
      }
      if ("showScoreNotation" in settings) {
        showScoreNotation = settings.showScoreNotation;
        $("#show-score-notation").prop("checked", showScoreNotation);
        $("#score-key-row").toggle(showScoreNotation);
        $("#hide-quiz-note-label").toggle(showScoreNotation);
        if (!showScoreNotation) {
          hideQuizNote = false;
          $hideQuizNote.prop("checked", false);
        }
      }
      if ("scoreKey" in settings) {
        scoreKey = settings.scoreKey;
        $("#score-key").val(scoreKey);
      }
      if ("hideQuizNote" in settings) {
        hideQuizNote = settings.hideQuizNote;
      }
      $hideQuizNote.prop("checked", hideQuizNote);
      if ("enableTTS" in settings) {
        enableTTS = settings.enableTTS;
        $("#enable-tts").prop("checked", enableTTS);
        // TTS is now handled by banner clicks and checkbox changes
      }
      if ("selectedVoice" in settings && typeof settings.selectedVoice === "string") {
        selectedVoice = settings.selectedVoice;
        // Update the voice dropdown selection
        $("#voice-select").val(selectedVoice || "");
      }

      // Update voice selection visibility after loading all settings
      updateVoiceSelectionVisibility();

      // Update unified banner after loading settings
      updateUnifiedBanner();

      // For testing: expose updateUnifiedBanner globally so tests can call it
      (window as any).updateUnifiedBanner = updateUnifiedBanner;
    } catch (e) {}
  }

  // Function to save statistics to localStorage
  function saveStatistics() {
    localStorage.setItem(STATS_KEY, JSON.stringify(statistics));
    updateStatsButton(); // Update button after saving
  }

  // Function to load statistics from localStorage
  function loadStatistics() {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Backward compatibility: if old data is an array, wrap it in object
          statistics = { answers: parsed };
        } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.answers)) {
          statistics = parsed;
        } else {
          statistics = { answers: [] };
        }
      }
    } catch (e) {
      statistics = { answers: [] };
    }
    updateStatsButton(); // Update button after loading
    computeStringErrorCounts(); // Compute after loading stats
  }

  // Function to update the reset stats button text
  function updateStatsButton() {
    const count = statistics.answers.length;
    $("#reset-stats").text(`Reset stats (${count})`);
  }

  function midiToFreq(midi: number) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function notesToSet() {
    if (showAccidentals) {
      return allNotes.concat(flatNotes);
    }
    return naturalNotes;
  }

  // Return English ordinal for a positive integer (1 -> "1st", 2 -> "2nd", 11 -> "11th", etc.)
  function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function makeSession() {
    // Set correct fret count based on user setting: includes 0th fret + selected count
    fretCount = fretCountSetting + 1;
    // Reset consecutive mistakes counter for new session
    consecutiveMistakes = 0;
    consecutiveOctaveMistakes = 0;
    // Clear TTS queue when starting a new session to prevent old announcements
    clearTTSQueue();
    // Dynamically build stringNames based on numStrings and tuning
    stringNames.length = 0; // Clear existing
    for (let i = 0; i < numStrings; i++) {
      let midi = getMidi(tuning[i].note, tuning[i].octave);
      const num = i + 1;
      const ord = getOrdinal(num); // e.g. "1st"
      let name = `${ord}`;
      stringNames.push({ name, openNote: tuning[i].note, midi });
    }
    session = [];
    let notes = notesToSet();
    let frets = [...Array(fretCount).keys()]; // 0 ... 11 or 0 ... 24
    for (let s = 0; s < stringNames.length; s++) {
      for (let n of notes) {
        let idxs = [];
        let openIdx = allNotes.indexOf(stringNames[s].openNote);
        for (let f of frets) {
          let noteIdx = (openIdx + f) % 12;
          let noteOnFret = allNotes[noteIdx];
          // Check if the note matches exactly or if they are enharmonically equivalent
          if (noteOnFret === n || (showAccidentals && areNotesEquivalent(noteOnFret, n))) {
            idxs.push(f);
          }
        }
        if (idxs.length > 0) {
          session.push({
            string: s,
            note: n,
            frets: idxs.slice(),
            found: [],
          });
        }
      }
    }
    session = shuffle(session);

    // Always use weighted shuffle, but bias only affects mistake amplification
    if (statistics.answers.length > 0) {
      const currentTuningStr = JSON.stringify(tuning);
      const mistakeCounts = Array(numStrings).fill(0);
      let totalMistakes = 0;
      statistics.answers.forEach((answer) => {
        if (JSON.stringify(answer.tuning) === currentTuningStr && !answer.correct) {
          mistakeCounts[answer.string]++;
          totalMistakes++;
        }
      });

      // Calculate weights: base weight = 1, mistakes add bias when enabled
      const biasStrength = enableBias ? 1 : 0; // Only apply bias if enabled
      const baseWeights = session.map((card: any) => 1 + mistakeCounts[card.string] * biasStrength);

      // Normalize by average and cap the difference to 3:1 ratio
      const avgWeight = baseWeights.reduce((sum: number, w: number) => sum + w, 0) / baseWeights.length;
      const maxWeight = avgWeight * 3;
      const minWeight = avgWeight / 3;

      const weights = baseWeights.map((w: number) => Math.max(minWeight, Math.min(maxWeight, w)));
      session = weightedShuffle(session, weights);
    } else {
      // No statistics yet, use equal weights (all 1.0)
      const weights = session.map(() => 1);
      session = weightedShuffle(session, weights);
    }

    // Recompute string error counts for the current tuning/session so UI tooltips are correct
    computeStringErrorCounts();
    sessionIdx = 0;
  }

  // Add weighted shuffle function
  function weightedShuffle(arr: any[], weights: number[]) {
    const result = [];
    let totalWeight = weights.reduce((sum: number, w: number) => sum + w, 0);
    while (arr.length > 0) {
      let rand = Math.random() * totalWeight;
      let cumWeight = 0;
      for (let i = 0; i < arr.length; i++) {
        cumWeight += weights[i];
        if (rand < cumWeight) {
          result.push(arr[i]);
          totalWeight -= weights[i];
          arr.splice(i, 1);
          weights.splice(i, 1);
          break;
        }
      }
    }
    return result;
  }

  function shuffle(a: any[]) {
    for (let i = a.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function updateQuizNoteDisplay() {
    if (!currentCard) return;

    // Cache frequently used selectors
    const $quizNoteBtn = $("#quiz-note-btn");
    const $noteScore = $("#note-score");

    if (hideQuizNote) {
      $quizNoteBtn.hide();
      if (showScoreNotation) {
        $noteScore.show();
        renderNoteScore(currentCard.note, currentCard.string, currentCard.frets);
      } else {
        $noteScore.hide();
      }
    } else {
      // Always ensure the quiz note button is visible and shows the note text
      $quizNoteBtn.show();
      // Update the button text while preserving aria-hidden spans
      $quizNoteBtn.html(`<span aria-hidden="true">${currentCard.note}</span>`);
      if (showScoreNotation) {
        $noteScore.show();
        renderNoteScore(currentCard.note, currentCard.string, currentCard.frets);
      } else {
        $noteScore.hide();
      }
    }
  }

  let $fretboard = $("#fretboard-area");

  function showCard() {
    clearTimeout(pendingTimeout);
    clearInterval(countdownInterval);
    $("#countdown").text("");
    // Ensure error counts match current tuning/session before rendering
    computeStringErrorCounts();

    // Cache frequently used selectors
    const $quizNoteBtn = $("#quiz-note-btn");
    const $flashcardString = $("#flashcard-string");
    const $fretButtons = $("#fret-buttons");
    const $fretboardArea = $fretboard;
    const $noteScore = $("#note-score");

    if (session.length === 0) {
      $quizNoteBtn.show();
      $quizNoteBtn.text("?");
      // clear machine-readable attributes when no session
      $quizNoteBtn.removeAttr("data-note");
      $flashcardString.removeAttr("data-string-index data-string-name data-frets-count");
      $flashcardString.text("Start!");
      $fretButtons.empty();
      $fretboardArea.empty();
      $noteScore.hide();
      return;
    }
    currentCard = session[sessionIdx];
    currentCard.shownTime = Date.now(); // Track when the card is shown
    foundFrets = currentCard.found.slice();
    // expose stable attributes for tests (and other tooling)
    $quizNoteBtn.attr("data-note", currentCard.note);

    // Update global reference for touch handler
    (window as any).currentCard = currentCard;
    updateQuizNoteDisplay();
    $flashcardString.attr("data-string-index", currentCard.string).attr("data-string-name", stringNames[currentCard.string].name).attr("data-frets-count", currentCard.frets.length);
    $flashcardString.text(
      // show as a readable sentence: "on the ... string"
      // Show note count for higher fret counts (21+ frets typically have 2-3 notes)
      (fretCountSetting > 11 ? stringNames[currentCard.string].name.replace(")", ", " + currentCard.frets.length + "x)") : stringNames[currentCard.string].name) + " string",
    );

    drawFretboardTable(currentCard.string, foundFrets);

    let btns = "";
    for (let f = 0; f < fretCount; f++) {
      let btnClass = "fret-btn";
      if (f === 0) btnClass += " open-fret";
      if (foundFrets.includes(f)) btnClass += " correct";
      btns += `<button class="${btnClass}" data-fret="${f}">${f}</button>`;
    }
    $fretButtons.html(btns);

    // Speak the quiz note if TTS is enabled - use queue with high priority for initial quiz
    // Only queue if TTS is already initialized (not during banner interactions)
    if (ttsInitialized) {
      queueQuizNoteAnnouncement();
    }
  }

  let stringErrorCounts: any[] = []; // Array to hold error counts per string for current tuning

  // Function to compute error counts per string for the current tuning
  function computeStringErrorCounts() {
    // Determine expected length from current tuning (fallback to numStrings)
    const len = Array.isArray(tuning) && tuning.length ? tuning.length : numStrings;
    stringErrorCounts = Array.from({ length: len }, () => 0);
    const currentTuningStr = JSON.stringify(tuning);
    statistics.answers.forEach((answer) => {
      try {
        if (JSON.stringify(answer.tuning) === currentTuningStr && !answer.correct) {
          const idx = Number(answer.string);
          // Guard: only count valid string indices
          if (Number.isFinite(idx) && idx >= 0 && idx < stringErrorCounts.length) {
            stringErrorCounts[idx]++;
          }
        }
      } catch (e) {
        // ignore malformed entries
      }
    });
  }

  function drawFretboardTable(highlightStringIdx, foundFretsArr) {
    let extraFret = fretCountSetting > 11 ? 0 : 1; // Add extra column for 12th fret marker in default mode (visual only)
    let fretRows = "";
    for (let s = 0; s < stringNames.length; s++) {
      fretRows += `<tr>`;
      // Add title attribute for hover tooltip showing error count (safe fallback to 0)
      const wrongCount = Array.isArray(stringErrorCounts) ? stringErrorCounts[s] || 0 : 0;
      fretRows += `<td class="open-note" title="wrong: ${wrongCount}" data-string="${s}" data-fret="0">${stringNames[s].openNote}</td>`;
      for (let f = 0; f < fretCount + extraFret; f++) {
        let fretClass = "fret-cell";
        if (f === 0) fretClass += " open-fret";
        if (s === highlightStringIdx) {
          fretClass += " active-string";
          if (foundFretsArr.includes(f)) fretClass += " fret-found";
        } else {
          fretClass += " inactive";
        }
        if (f >= fretCount) {
          fretClass += " inactive"; // Extra column is inactive (visual only)
          fretRows += `<td class="${fretClass}" style="visibility: hidden;" data-string="${s}" data-fret="${f}"></td>`;
        } else {
          fretRows += `<td class="${fretClass}" data-string="${s}" data-fret="${f}"></td>`;
        }
      }
      fretRows += `</tr>`;
    }

    // Fret marker row (dots)
    let markRow = '<tr class="fretboard-mark-row">';
    markRow += "<td></td>";
    for (let f = 0; f < fretCount + extraFret; f++) {
      let marker = "";
      let fretNum = f; // 0 = open, 1 = 1st fret, etc.
      if (fretCountSetting > 11) {
        if (typicalFretMarks.includes(fretNum)) {
          if (doubleFretMarkers.includes(fretNum)) {
            marker = `<span class="fret-dot double">
                        <span class="dot dot1"></span>
                        <span class="dot dot2"></span>
                    </span>`;
          } else {
            marker = `<span class="fret-dot"></span>`;
          }
        }
      } else {
        // Use same logic as extended for consistency, but limit to frets <=12
        if (typicalFretMarks.includes(fretNum) && fretNum <= 12) {
          if (doubleFretMarkers.includes(fretNum)) {
            marker = `<span class="fret-dot double">
                        <span class="dot dot1"></span>
                        <span class="dot dot2"></span>
                    </span>`;
          } else {
            marker = `<span class="fret-dot"></span>`;
          }
        }
      }
      if (f >= fretCount) {
        markRow += `<td class="fret-dot-cell">${marker}</td>`; // Marker visible
      } else {
        markRow += `<td class="fret-dot-cell">${marker}</td>`;
      }
    }
    markRow += "</tr>";

    // Table header row (fret numbers)
    let headerRow = '<tr class="fretboard-header">';
    headerRow += "<th></th>";
    for (let f = 0; f < fretCount + extraFret; f++) {
      if (f >= fretCount) {
        headerRow += `<th class="fret-label" style="visibility: hidden;">${f}</th>`; // Header hidden
      } else {
        headerRow += `<th class="fret-label">${f}</th>`;
      }
    }
    headerRow += "</tr>";

    let tableHtml = `<table class="fretboard-table"><thead>${headerRow}</thead><tbody>${fretRows}${markRow}</tbody></table>`;
    $fretboard.html(tableHtml);
  }

  function nextCard() {
    sessionIdx++;
    if (sessionIdx >= session.length) {
      console.log("Session complete!");
      makeSession();
    }
    // Clear mic feedback and status when moving to new question
    const feedbackEl = document.getElementById("mic-feedback");
    if (feedbackEl) {
      feedbackEl.textContent = "";
    }
    const statusEl = document.getElementById("mic-status");
    if (statusEl) {
      statusEl.textContent = "";
    }
    // Reset mic detection state to allow fresh submissions for the new card
    displayedNoteId = null;
    // Reset consecutive mistakes counter for new card
    consecutiveMistakes = 0;
    consecutiveOctaveMistakes = 0;
    // Reset octave hint debounce timer for fresh octave feedback on new card
    lastOctaveHintTime = 0;
    // Clear TTS queue when moving to new card to prevent old announcements
    clearTTSQueue();

    // Only apply transition delay and Next sound when microphone is active
    if (pitchDetecting) {
      if (areHintsPlaying()) {
        // Wait for all hints to complete before starting the new quiz
        waitForHintsToComplete(() => {
          playNextSound();
          // Small delay after the "Next" sound before showing the card
          setTimeout(() => {
            showCard();
          }, 300);
        });
      } else {
        // No hints playing, but still play the Next sound for microphone users
        playNextSound();
        setTimeout(() => {
          showCard();
        }, 300);
      }
    } else {
      // Immediate transition for UI-only mode (tests and manual clicking)
      showCard();
    }
  }

  // Track mistakes and handle TTS repeat logic
  function trackMistakeAndHandleTTS(isCorrect: boolean, source: string, isOctaveError: boolean = false) {
    if (isCorrect) {
      consecutiveMistakes = 0; // Reset counter on correct answer
      consecutiveOctaveMistakes = 0; // Reset octave counter on correct answer
    } else {
      consecutiveMistakes++;
      console.log(`Consecutive mistakes: ${consecutiveMistakes} (source: ${source})`);

      // For octave errors, give immediate feedback
      if (isOctaveError) {
        queueOctaveHint();
        // Don't increment consecutiveOctaveMistakes here since it's already incremented at call site
      }

      // After 3 consecutive mistakes, repeat the quiz note
      if (consecutiveMistakes === 3) {
        queueQuizNoteRepeat();
        // Reset counter after giving hint so it can trigger again
        consecutiveMistakes = 0;
      }
    }
  }

  // Queue TTS for quiz note repeat (separated from error handling)
  function queueQuizNoteRepeat() {
    if (!enableTTS || !currentCard) return;

    const ordinalString = getOrdinal(currentCard.string + 1);
    let spokenNote = currentCard.note;

    // Spell out accidentals for clarity
    if (spokenNote.includes("#")) {
      spokenNote = spokenNote.replace("#", " sharp");
    } else if (spokenNote.includes("b") || spokenNote.includes("♭")) {
      spokenNote = spokenNote.replace(/[b♭]/, " flat");
    }

    const text = `Note ${spokenNote}, ${ordinalString} string`;

    addToTTSQueue(text, 2); // Normal priority for quiz repeats
  }

  // Queue TTS for initial quiz note announcement (highest priority)
  function queueQuizNoteAnnouncement() {
    if (!enableTTS || !currentCard) return;

    const ordinalString = getOrdinal(currentCard.string + 1);
    let spokenNote = currentCard.note;

    // Spell out accidentals for clarity
    if (spokenNote.includes("#")) {
      spokenNote = spokenNote.replace("#", " sharp");
    } else if (spokenNote.includes("b") || spokenNote.includes("♭")) {
      spokenNote = spokenNote.replace(/[b♭]/, " flat");
    }

    const text = `Note ${spokenNote}, ${ordinalString} string`;

    addToTTSQueue(text, 5); // High priority for new quiz announcements
  }

  // Queue TTS for octave hint (separated from error handling)
  function queueOctaveHint() {
    if (!enableTTS || !currentCard) return;

    // Debounce: don't repeat octave hint more than once every 5 seconds
    const now = Date.now();
    if (now - lastOctaveHintTime < 5000) {
      console.log("Octave hint debounced - too soon since last hint");
      return;
    }

    lastOctaveHintTime = now;
    const text = "Another octave";

    addToTTSQueue(text, 3); // Higher priority for immediate feedback
  }

  // Centralized answer submission for both UI and mic sources.
  // `source` is a string like 'ui' or 'mic' to allow source-specific behavior later.
  // Can accept either a fret number OR a note name (string will be empty if note is provided)
  // Returns false if the answer was rejected (e.g., wrong octave), true/undefined otherwise
  function submitAnswer(stringIdx, fret, source, detectedNote) {
    if (!currentCard) return false;

    // Clear mic feedback when an answer is submitted
    const feedbackEl = document.getElementById("mic-feedback");
    if (feedbackEl && source !== "mic") {
      feedbackEl.textContent = "";
    }
    // Clear detected note status when a manual answer is submitted
    const statusEl = document.getElementById("mic-status");
    if (statusEl && source !== "mic") {
      statusEl.textContent = "";
    }

    // If a note name was provided, convert it to the appropriate fret on the current string
    if (detectedNote) {
      // detectedNote may be either "NAME" or "NAME/OCTAVE" (we pass octave from mic)
      let namePart = detectedNote;
      let octavePart = null;
      if (detectedNote.includes("/")) {
        const parts = detectedNote.split("/");
        namePart = parts[0];
        octavePart = parseInt(parts[1], 10);
        if (!isFinite(octavePart)) octavePart = null;
      }

      // Find variant matching the detected name
      const variant = noteVariants.find((v) => v.name === namePart);
      if (!variant) {
        console.warn(`Unknown detected note name: ${detectedNote}`);
        trackMistakeAndHandleTTS(false, source);
        const feedbackEl = document.getElementById("mic-feedback");
        if (feedbackEl) {
          feedbackEl.textContent = `Unknown note: ${detectedNote}`;
          feedbackEl.style.color = "#f44336";
        }
        return false;
      }

      // Try to compute MIDI using provided octave first (if any), otherwise search plausible octaves
      let detectedMidi: number | null = null;
      const openMidi = getMidi(tuning[currentCard.string].note, tuning[currentCard.string].octave);
      if (octavePart !== null) {
        const candidateMidi = getMidi(variant.name, octavePart);
        const fretDiff = candidateMidi - openMidi;
        if (fretDiff >= 0 && fretDiff <= 24) {
          detectedMidi = candidateMidi;
        } else {
          // When octave is explicitly provided (from mic), don't fall back to searching other octaves
          console.log(`Detected note ${namePart}${octavePart} maps to fret ${fretDiff}, out of range - rejecting`);

          // Track octave mistake
          consecutiveOctaveMistakes++;
          trackMistakeAndHandleTTS(false, source, true); // Pass isOctaveError=true

          const feedbackEl = document.getElementById("mic-feedback");
          if (feedbackEl) {
            // Calculate octave difference: remove note difference (mod 12) and focus on octave steps
            const octaveDiff = Math.floor(fretDiff / 12);
            const hint = octaveDiff < 0 ? "try octave higher" : "try octave lower";

            // Calculate expected octave for this note on this string
            const openMidi = getMidi(tuning[currentCard.string].note, tuning[currentCard.string].octave);
            const expectedMidi = openMidi + currentCard.frets[0]; // Use first valid fret position
            const expectedOctave = Math.floor(expectedMidi / 12) - 1;

            feedbackEl.textContent = `${namePart}${octavePart} - ${hint} (need ~${expectedOctave})`;
            feedbackEl.style.color = "#f44336";
          }
          return false;
        }
      } else {
        // Only search different octaves when no specific octave was provided
        for (let octave = 1; octave <= 8; octave++) {
          const candidateMidi = getMidi(variant.name, octave);
          const fretDiff = candidateMidi - openMidi;
          if (fretDiff >= 0 && fretDiff <= 24) {
            // Within reasonable fret range
            detectedMidi = candidateMidi;
            break;
          }
        }
      }

      if (detectedMidi !== null) {
        fret = detectedMidi - openMidi;
        stringIdx = currentCard.string; // Force to current quiz string

        // Check for approximate octave feedback - if detected note is roughly an octave off from expected
        const feedbackEl = document.getElementById("mic-feedback");
        if (feedbackEl && source === "mic") {
          // Calculate expected MIDI range for the current quiz note
          const expectedMidiValues = currentCard.frets.map((f: number) => openMidi + f);
          const minExpected = Math.min(...expectedMidiValues);
          const maxExpected = Math.max(...expectedMidiValues);

          // Check if detected note is approximately 1-2 octaves off (10-26 semitones to account for different notes)
          const lowerOctaveMin = detectedMidi - 26;
          const lowerOctaveMax = detectedMidi - 10;
          const higherOctaveMin = detectedMidi + 10;
          const higherOctaveMax = detectedMidi + 26;

          // Check if the expected range falls within 1-2 octaves of the detected note
          const isExpectedOctaveLower = minExpected >= lowerOctaveMin && maxExpected <= lowerOctaveMax;
          const isExpectedOctaveHigher = minExpected >= higherOctaveMin && maxExpected <= higherOctaveMax;

          if (isExpectedOctaveLower) {
            // Track octave mistake
            consecutiveOctaveMistakes++;
            trackMistakeAndHandleTTS(false, source, true); // Pass isOctaveError=true

            feedbackEl.textContent = `${namePart}${octavePart || ""} - try octave lower`;
            feedbackEl.style.color = "#f44336";
            return false; // Don't process as valid answer
          } else if (isExpectedOctaveHigher) {
            // Track octave mistake
            consecutiveOctaveMistakes++;
            trackMistakeAndHandleTTS(false, source, true); // Pass isOctaveError=true

            feedbackEl.textContent = `${namePart}${octavePart || ""} - try octave higher`;
            feedbackEl.style.color = "#f44336";
            return false; // Don't process as valid answer
          } else if (octavePart !== null) {
            // Show normal detection feedback only if no octave issue detected
            feedbackEl.textContent = `detected ${namePart}${octavePart} → fret ${fret}`;
            feedbackEl.style.color = "#4caf50";
          }
        }
      } else {
        console.warn(`Could not convert detected note ${detectedNote} to fret`);
        trackMistakeAndHandleTTS(false, source);
        return false;
      }
    }

    playAnsweredNote(stringIdx, fret);
    const isCorrect = currentCard.frets.includes(fret);

    // Provide haptic feedback for mobile
    if (isCorrect) {
      mobileEnhancements.hapticSuccess();
    } else {
      mobileEnhancements.hapticError();
    }

    // Track consecutive mistakes for TTS repeat functionality using unified function
    trackMistakeAndHandleTTS(isCorrect, source);

    // Record the answer event
    statistics.answers.push({
      tuning: tuning.slice(),
      string: currentCard.string,
      note: currentCard.note,
      userAnswer: fret,
      correct: isCorrect,
      timestamp: Date.now(),
      shownTimestamp: currentCard.shownTime,
    });
    saveStatistics();
    computeStringErrorCounts();
    drawFretboardTable(currentCard.string, foundFrets);

    if (isCorrect) {
      if (fretCountSetting > 11) {
        if (!foundFrets.includes(fret)) {
          foundFrets.push(fret);
          currentCard.found = foundFrets.slice();
          markButton($(`.fret-btn[data-fret=${fret}]`), true);
          highlightFretOnFretboard(currentCard.string, fret, true);
        }
        if (foundFrets.length === currentCard.frets.length) {
          doCountdownAndNext();
        }
      } else {
        markButton($(`.fret-btn[data-fret=${fret}]`), true);
        highlightFretOnFretboard(currentCard.string, fret, true);
        doCountdownAndNext();
      }
    } else {
      // Wrong answer behavior: replay desired note and mark wrong
      markButton($(`.fret-btn[data-fret=${fret}]`), false);
      highlightFretOnFretboard(currentCard.string, fret, false);
      playDesiredNote(currentCard.string, currentCard.frets[0]);
      // If this came from the mic, avoid advancing and suppress any countdown
      if (source === "mic") {
        clearTimeout(pendingTimeout);
        clearInterval(countdownInterval);
        countdownValue = 0;
      }
    }
    return true; // Successfully processed the answer
  }

  function markButton(btn, correct) {
    $(btn).addClass(correct ? "correct" : "wrong");
    if (!correct) setTimeout(() => $(btn).removeClass("wrong"), 1000);
  }

  function handleFretClick() {
    // TTS initialization and processing is handled by the gesture handler

    if (!currentCard) return;
    if (areHintsPlayingForMicMode()) {
      console.log("Ignoring fret button input - hints still playing during mic mode");
      return;
    }

    // Provide light haptic feedback for button tap
    mobileEnhancements.hapticLight();

    let fret = parseInt($(this).attr("data-fret"));
    submitAnswer(currentCard.string, fret, "ui", null);
  }

  function handleFretboardClick() {
    // TTS initialization and processing is handled by the gesture handler

    if (areHintsPlayingForMicMode()) {
      console.log("Ignoring fretboard click - hints still playing during mic mode");
      return;
    }

    // Provide light haptic feedback for fretboard tap
    mobileEnhancements.hapticLight();

    let s = Number($(this).attr("data-string"));
    let f = Number($(this).attr("data-fret"));
    if (s !== currentCard.string) return;
    submitAnswer(s, f, "ui", null);
  }

  function playAnsweredNote(stringIdx, fretIdx) {
    let midi = stringNames[stringIdx].midi + fretIdx;
    let freq = midiToFreq(midi);
    playTone(freq, 0.7);
  }

  function playDesiredNote(stringIdx, fretIdx) {
    let midi = stringNames[stringIdx].midi + fretIdx;
    let freq = midiToFreq(midi);

    // Only set hint playing state if microphone is active
    if (pitchDetecting) {
      setHintsPlaying(true);
    }

    setTimeout(() => {
      playTone(freq, 0.7);
      // Clear hint state after the tone finishes (only if we set it)
      if (pitchDetecting) {
        setTimeout(() => setHintsPlaying(false), 700);
      }
    }, 250);
  }

  function playNextSound() {
    // Play a brief atonal click to signal the next question is ready
    playAtonalClick();
  }

  function playAtonalClick() {
    try {
      const audio = new Audio();
      audio.src = generateClickDataURL();
      audio.volume = 1.0;
      audio.play().catch((err) => console.warn("Click play failed:", err));
    } catch (err) {
      console.warn("Click creation failed:", err);
    }
  }

  // Generate a brief "clack" sound
  function generateClickDataURL(duration = 0.05, sampleRate = 44100) {
    const length = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * 2, true);

    // Generate "clack" sound: sharp attack with mixed frequencies for woody/clicky sound
    for (let i = 0; i < length; i++) {
      // Mix of high and mid frequencies for "clack" character
      const t = i / sampleRate;

      // High frequency component (sharp attack)
      const highFreq = Math.sin(2 * Math.PI * 2000 * t) * 0.6;
      // Mid frequency component (body of the sound)
      const midFreq = Math.sin(2 * Math.PI * 800 * t) * 0.4;
      // Low frequency thump
      const lowFreq = Math.sin(2 * Math.PI * 200 * t) * 0.2;

      // Combine frequencies
      let sample = highFreq + midFreq + lowFreq;

      // Very sharp exponential decay for percussive "clack"
      const decay = Math.exp(-i / (length * 0.05));

      // Additional sharp attack envelope
      const attack = i < length * 0.02 ? i / (length * 0.02) : 1;

      // Scale to 16-bit range with twice the volume
      const amplification = 0.24;
      sample = sample * decay * attack * amplification * 32767;

      const offset = 44 + i * 2;
      if (offset + 1 < buffer.byteLength) {
        view.setInt16(offset, sample, true);
      }
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }

  function highlightFretOnFretboard(stringIdx, fretIdx, correct) {
    let selector = `.fret-cell[data-string="${stringIdx}"][data-fret="${fretIdx}"]`;
    console.log("selector", selector);
    let $fret = $(selector);
    if (correct) {
      $fret.removeClass("fret-wrong").addClass("fret-found");
    } else {
      $fret.addClass("fret-wrong");
      setTimeout(() => {
        $fret.removeClass("fret-wrong");
      }, 1000);
    }
  }

  function doCountdownAndNext() {
    clearInterval(countdownInterval);
    if (timeoutSeconds === 0) {
      nextCard();
      return;
    }
    countdownValue = timeoutSeconds;
    let $countdown = $("#countdown");
    $countdown.text("⏳ " + countdownValue);
    countdownInterval = setInterval(() => {
      countdownValue--;
      $countdown.text(countdownValue > 0 ? "⏳ " + countdownValue : "");
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        $countdown.text("");
        nextCard();
      }
    }, 1000);
  }

  function playNoteCard() {
    if (!currentCard) return;
    let fret = currentCard.frets[0];
    let midi = stringNames[currentCard.string].midi + fret;
    let freq = midiToFreq(midi);
    playTone(freq, 0.8);
  }

  // New: HTML5 Audio element approach instead of Web Audio API
  let audioElements = {}; // Cache for generated audio elements
  let audioEnabled = false;
  let isIOS = false;
  let audioCurrentlyPlaying = false; // Flag to track if audio is playing
  let resumeMicTimeout = null; // Timeout for resuming mic after audio

  // Pitch detection state (pitchy)
  let micStream = null;
  let audioContextForPitch = null;
  let analyserForPitch = null;
  let detector = null;
  let pitchDetecting = false;
  let pitchAnimFrame = null;
  let pitchBuffer = null;
  let smoothedLevel = 0;
  let micBaselineRms = 0;
  let baselineSamplesCount = 0;
  let collectBaselineUntil = 0;
  let lastDetectedNoteId: number | null = null;
  let noteStableSince: number | null = null;
  let displayedNoteId: number | null = null;
  let lastSubmissionTime: number = 0;
  const NOTE_STABLE_MS = 300;
  const MIN_RESUBMISSION_DELAY_MS = 1000; // Allow resubmission of same note after 1 second

  // Detect iOS devices
  function detectIOS() {
    // Check for static iOS mock configuration in localStorage first
    const iosMockConfig = localStorage.getItem("ios-mock-config");
    if (iosMockConfig === "true") {
      return true;
    }

    // Check for CI/test environments - treat as desktop
    const isCI = navigator.userAgent.includes("HeadlessChrome") || navigator.userAgent.includes("Cypress") || navigator.userAgent.includes("Electron");
    if (isCI) {
      return false;
    }

    // noinspection JSDeprecatedSymbols
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  // Detect macOS (excluding iOS)
  function detectMacOS() {
    return navigator.platform.indexOf("Mac") > -1 && !detectIOS();
  }

  // Detect browser type
  function detectBrowser() {
    const userAgent = navigator.userAgent;

    if (userAgent.indexOf("Firefox") > -1) {
      return "firefox";
    } else if (userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Edg") === -1) {
      return "chrome";
    } else if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
      return "safari";
    } else if (userAgent.indexOf("Edg") > -1) {
      return "edge";
    }
    return "unknown";
  }

  // Detect Brave browser
  function detectBrave() {
    // Brave browser detection - check for Brave-specific properties
    const hasBraveProperty = !!(navigator as any).brave;
    const isChromeBased = navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Edg") === -1;
    const isBrave = hasBraveProperty || (isChromeBased && (navigator as any).brave !== undefined);

    console.log("Brave detection - hasBraveProperty:", hasBraveProperty, "isChromeBased:", isChromeBased, "userAgent:", navigator.userAgent);
    return isBrave;
  }

  // Check if text-to-speech should be available based on browser/OS combination
  function isTTSSupported() {
    // Check for static speechSynthesis mock configuration in localStorage first
    const speechSynthesisMock = localStorage.getItem("speech-synthesis-mock");
    if (speechSynthesisMock === "false") {
      return false;
    }

    // Check if speechSynthesis is available at all
    return "speechSynthesis" in window;
  }

  // Generate a WAV data URL for a given frequency
  function generateToneDataURL(freq, duration = 0.8, sampleRate = 44100) {
    const length = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * 2, true);

    // Compute MIDI and octave from frequency
    const midi = 69 + 12 * Math.log2(freq / 440);
    const octave = Math.floor(midi / 12) - 1;
    const useTriangle = octave === 1 || octave === 2;
    // Slightly boost amplitude on iOS where overall output is quieter
    const amp = isIOS ? 0.52 : 0.25;

    // Generate wave data (triangle for octaves 1-2, sine otherwise)
    for (let i = 0; i < length; i++) {
      let sample;
      if (useTriangle) {
        sample = (4 * Math.abs((((i * freq) / sampleRate) % 1) - 0.5) - 1) * amp * 32767;
      } else {
        sample = Math.sin((2 * Math.PI * freq * i) / sampleRate) * amp * 32767;
      }
      const offset = 44 + i * 2;
      if (offset + 1 < buffer.byteLength) {
        view.setInt16(offset, sample, true);
      }
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }

  // Updated playTone to use HTML5 Audio elements
  function playTone(freq, duration) {
    // On non-iOS devices, ensure audio is initialized
    if (!isIOS && !audioEnabled) {
      audioEnabled = true; // Assume it works on non-iOS
      initAudioContext();
    }

    // For iOS, require explicit enabling
    if (isIOS && !audioEnabled) {
      console.warn("Audio not enabled on iOS - click enable sound banner");
      return;
    }

    try {
      const cacheKey = `${Math.round(freq)}_${duration}`;

      // Set audio playing flag to prevent microphone feedback
      audioCurrentlyPlaying = true;

      // Clear any existing resume timeout
      if (resumeMicTimeout) {
        clearTimeout(resumeMicTimeout);
        resumeMicTimeout = null;
      }

      // On iOS, don't reuse cached audio elements to prevent playback conflicts
      // Create a new audio element each time for reliable playback
      let audio;
      if (isIOS || !audioElements[cacheKey]) {
        audio = new Audio();
        try {
          audio.src = generateToneDataURL(freq, duration);
          audio.preload = "auto";
          if (!isIOS) {
            audioElements[cacheKey] = audio; // Only cache on non-iOS
          }
        } catch (err) {
          console.error("Error generating tone:", err);
          audioCurrentlyPlaying = false; // Reset flag on error
          return;
        }
      } else {
        audio = audioElements[cacheKey];
      }

      // For non-iOS cached elements, reset position
      if (!isIOS) {
        audio.currentTime = 0;
      }

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio played successfully");
            // Set up timeout to resume microphone after audio finishes
            resumeMicTimeout = setTimeout(
              () => {
                audioCurrentlyPlaying = false;
                resumeMicTimeout = null;
              },
              duration * 1000 + 200,
            ); // Add 200ms buffer
          })
          .catch((err) => {
            console.error("Error playing audio:", err);
            audioCurrentlyPlaying = false; // Reset flag on error
            // On first failure, try to re-enable audio
            if (!isIOS) {
              setTimeout(() => initAudioContext(), 100);
            }
          });
      } else {
        // Fallback for older browsers - use duration timeout
        resumeMicTimeout = setTimeout(
          () => {
            audioCurrentlyPlaying = false;
            resumeMicTimeout = null;
          },
          duration * 1000 + 200,
        );
      }
    } catch (err) {
      console.error("Error playing tone:", err);
      audioCurrentlyPlaying = false; // Reset flag on error
    }
  }

  // Add debounce function for saving timeout
  let timeoutSaveDebounce = null;
  function debouncedSaveTimeout() {
    clearTimeout(timeoutSaveDebounce);
    timeoutSaveDebounce = setTimeout(() => {
      let v = parseInt($timeout.val());
      if (isNaN(v) || v < 0 || v > 10) v = 2;
      timeoutSeconds = v;
      saveSettings();
    }, 200);
  }

  // Function to update the tuning UI
  let $tuning = $("#tuning-config");

  function updateTuningUI() {
    let html = '<div class="tuning-container">';
    for (let i = 0; i < numStrings; i++) {
      let noteOptions = allNotes.map((n) => `<option value="${n}" ${tuning[i].note === n ? "selected" : ""}>${n}</option>`).join("");
      let octaveOptions = "";
      for (let oct = 0; oct <= 8; oct++) {
        octaveOptions += `<option value="${oct}" ${tuning[i].octave === oct ? "selected" : ""}>${oct}</option>`;
      }
      html += `<div class="string-config">
            <div class="string-label">String ${i + 1}:</div>
            <div class="string-controls">
              <div class="control-row">
                <span>Note:</span>
                <select class="tuning-select" data-string="${i}">${noteOptions}</select>
              </div>
              <div class="control-row">
                <span>Octave:</span>
                <select class="octave-select" data-string="${i}">${octaveOptions}</select>
              </div>
            </div>
          </div>`;
    }
    html += "</div>";
    $tuning.html(html);
  }

  // Initialize audio - create test sound to enable audio context
  function initAudioContext() {
    try {
      // Create a short silent audio element and play it
      const testAudio = new Audio();
      testAudio.src =
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQfCjuP2O/Qfi8HI3/A7tqPQQkSUbDn56ZSFAk+ltztw2QfCTuN2bC/";

      const playPromise = testAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audioEnabled = true;
            updateTestState();
            if (isIOS) {
              updateUnifiedBanner();
              // Don't speak here - banner click handler will speak
              // Queue and speak the quiz note after audio is enabled
              if (enableTTS && currentCard) {
                queueQuizNoteAnnouncement();
              }
            }
            testAudio.pause();
            testAudio.currentTime = 0;
            console.log("Audio enabled successfully");
          })
          .catch((err) => {
            // Suppress expected autoplay policy warnings on desktop
            if (!isIOS && err.name === "NotAllowedError") {
              // This is expected on desktop - audio will work after user interaction
              audioEnabled = true;
            } else if (isIOS) {
              // On iOS, user interaction (banner click) should enable audio
              // Even if play() fails, the user interaction allows audio to work
              audioEnabled = true;
              console.log("Audio enabled on iOS via user interaction");
            } else {
              console.error("Failed to enable audio:", err);
              audioEnabled = false;
            }
            updateTestState();
          });
      } else {
        // Fallback for older browsers
        audioEnabled = true;
        updateTestState();
      }
    } catch (err) {
      console.error("Failed to initialize audio:", err);
      if (!isIOS) {
        // On non-iOS, assume audio will work
        audioEnabled = true;
      } else {
        // On iOS, user interaction (banner click) should enable audio
        audioEnabled = true;
        console.log("Audio enabled on iOS via user interaction (catch block)");
      }
      updateTestState();
    }
  }

  // Start microphone and pitch detection using pitchy
  async function startMic() {
    if (pitchDetecting) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("getUserMedia not supported");
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    audioContextForPitch = new AC();
    const src = audioContextForPitch.createMediaStreamSource(micStream);
    analyserForPitch = audioContextForPitch.createAnalyser();
    analyserForPitch.fftSize = 2048;
    src.connect(analyserForPitch);
    detector = PitchDetector.forFloat32Array(analyserForPitch.fftSize);
    pitchBuffer = new Float32Array(analyserForPitch.fftSize);
    pitchDetecting = true;
    smoothedLevel = 0;
    micBaselineRms = 0;
    baselineSamplesCount = 0;
    collectBaselineUntil = Date.now() + 300; // collect baseline for first 300ms
    const statusEl = document.getElementById("mic-status");
    const meterEl = document.getElementById("mic-meter");
    const feedbackEl = document.getElementById("mic-feedback");
    if (statusEl) statusEl.style.display = "inline";
    if (meterEl) meterEl.style.display = "inline-block";
    if (feedbackEl) feedbackEl.style.display = "inline";

    // statusEl already declared above

    // Ensure AudioContext is running (user gesture should have started it)
    if (audioContextForPitch && audioContextForPitch.state === "suspended") {
      audioContextForPitch.resume().catch(() => {});
    }

    const loop = () => {
      if (!pitchDetecting) return;

      // Skip processing if audio is currently playing to prevent feedback
      if (audioCurrentlyPlaying) {
        pitchAnimFrame = requestAnimationFrame(loop);
        return;
      }

      analyserForPitch.getFloatTimeDomainData(pitchBuffer);
      // Compute simple RMS to detect whether the mic is receiving any signal
      let sum = 0;
      for (let i = 0; i < pitchBuffer.length; i++) {
        sum += pitchBuffer[i] * pitchBuffer[i];
      }
      const rms = Math.sqrt(sum / pitchBuffer.length);

      // Use pitchy correctly: pass sampleRate as second arg
      const [frequency, clarity] = detector.findPitch(pitchBuffer, audioContextForPitch.sampleRate);
      // Collect baseline RMS for a short period after mic start to compensate for ambient noise / AGC
      if (Date.now() < collectBaselineUntil) {
        micBaselineRms += rms;
        baselineSamplesCount++;
      } else if (baselineSamplesCount > 0 && micBaselineRms > 0) {
        micBaselineRms = micBaselineRms / baselineSamplesCount;
        baselineSamplesCount = 0; // done collecting
      }

      // Subtract baseline and map to 0..1 using a dB scale. Add a small floor to avoid log(0).
      const effectiveRms = Math.max(0, rms - (micBaselineRms || 0) * 1.05);
      const rmsFloor = Math.max(effectiveRms, 1e-8);
      const db = 20 * Math.log10(rmsFloor);
      const level = Math.max(0, Math.min(1, (db + 80) / 80));
      smoothedLevel = smoothedLevel * 0.92 + level * 0.08;
      const now = Date.now();
      // Determine current detected note id (rounded MIDI) or null
      let currentNoteId: number | null = null;
      if (frequency && clarity) {
        const midi = 69 + 12 * Math.log2(frequency / 440);

        currentNoteId = Math.round(midi);
      }

      // Update stability timers
      if (currentNoteId === lastDetectedNoteId) {
        if (noteStableSince === null) noteStableSince = now;
      } else {
        lastDetectedNoteId = currentNoteId;
        noteStableSince = currentNoteId === null ? null : now;
      }

      // Only update visible status and meter when the same note persisted for NOTE_STABLE_MS
      const stable = noteStableSince !== null && now - noteStableSince >= NOTE_STABLE_MS;
      if (rms < 0.0005) {
        // Silence detected: immediately reset smoothed level and clear meters so UI returns to 0
        smoothedLevel = 0;
        const meterFillSilent = document.getElementById("mic-meter-fill");
        const meterEl = document.getElementById("mic-meter");
        if (meterFillSilent) {
          meterFillSilent.style.width = `0%`;
          meterFillSilent.style.background = "#4caf50";
        }
        // Change meter border to indicate no input
        if (meterEl) {
          meterEl.style.borderColor = "#555";
        }
      } else if (stable && currentNoteId !== null) {
        // Show note and update meter when stable
        const midiRound = currentNoteId;
        const noteName = allNotes[((midiRound % 12) + 12) % 12];
        const octave = Math.floor(midiRound / 12) - 1;
        if (statusEl) statusEl.textContent = `${noteName}${octave}`;
        // Update meter immediately when stable (use smoothedLevel)
        const meterFillStable = document.getElementById("mic-meter-fill");
        const meterEl = document.getElementById("mic-meter");
        if (meterFillStable) {
          const pct = Math.round(smoothedLevel * 100);
          meterFillStable.style.width = `${pct}%`;
          if (smoothedLevel < 0.4) meterFillStable.style.background = "#4caf50";
          else if (smoothedLevel < 0.8) meterFillStable.style.background = "#ffeb3b";
          else meterFillStable.style.background = "#f44336";
        }
        // Change meter border to indicate stable note detection
        if (meterEl) {
          meterEl.style.borderColor = "#4caf50";
        }
        // Submit this stable detected note to the quiz flow once
        const now = Date.now();
        if (displayedNoteId !== currentNoteId || (displayedNoteId === currentNoteId && now - lastSubmissionTime > MIN_RESUBMISSION_DELAY_MS)) {
          try {
            // Map to nearest fret and submit via unified handler
            submitDetectedNote(midiRound);
            displayedNoteId = currentNoteId;
            lastSubmissionTime = now;
          } catch (e) {
            console.error("submitDetectedNote error", e);
          }
        }
      } else {
        // Change meter border to indicate detecting/unstable
        const meterEl = document.getElementById("mic-meter");
        if (meterEl) {
          meterEl.style.borderColor = "#ffeb3b";
        }
      }
      pitchAnimFrame = requestAnimationFrame(loop);
    };

    loop();
  }

  function stopMic() {
    pitchDetecting = false;
    if (pitchAnimFrame) {
      cancelAnimationFrame(pitchAnimFrame);
      pitchAnimFrame = null;
    }
    if (analyserForPitch) {
      try {
        analyserForPitch.disconnect();
      } catch (e) {}
      analyserForPitch = null;
    }
    if (audioContextForPitch) {
      try {
        audioContextForPitch.close();
      } catch (e) {}
      audioContextForPitch = null;
    }
    if (micStream) {
      try {
        micStream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      micStream = null;
    }
    const statusEl = document.getElementById("mic-status");
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.style.display = "none";
    }
    const meterEl = document.getElementById("mic-meter");
    if (meterEl) {
      meterEl.style.display = "none";
      meterEl.style.borderColor = "#777"; // Reset border color
    }
    const feedbackEl = document.getElementById("mic-feedback");
    if (feedbackEl) feedbackEl.style.display = "none";
    // clear meter
    const meterFill = document.getElementById("mic-meter-fill");
    if (meterFill) meterFill.style.width = "0%";
    micBaselineRms = 0;
    baselineSamplesCount = 0;
    collectBaselineUntil = 0;
    detector = null;
    pitchBuffer = null;

    // Clear any pending resume timeout when stopping mic
    if (resumeMicTimeout) {
      clearTimeout(resumeMicTimeout);
      resumeMicTimeout = null;
    }
    audioCurrentlyPlaying = false; // Reset audio playing flag
  }

  // Map a detected MIDI note to nearest fret for the current card and submit it
  function submitDetectedNote(midiRound) {
    // Convert MIDI to note name and delegate to unified submitAnswer
    try {
      if (!currentCard) return false;
      const noteName = allNotes[((midiRound % 12) + 12) % 12];
      const octave = Math.floor(midiRound / 12) - 1;
      console.log(`Detected note: ${noteName}${octave} (MIDI ${midiRound})`);
      // Pass both name and octave (format: NAME/OCTAVE) so submitAnswer can use exact octave

      return submitAnswer(null, null, "mic", `${noteName}/${octave}`); // Return false if submitAnswer explicitly rejected the note
    } catch (e) {
      console.error("submitDetectedNote failed", e);
      return false;
    }
  }

  let $unifiedBanner = $("#unified-banner");

  function updateUnifiedBanner() {
    const banner = $unifiedBanner;

    if (audioEnabled && ttsUserInitialized) {
      banner.addClass("enabled").text("🔊🎤 Audio and voice enabled!");
      setTimeout(() => banner.hide(), 2000);
    } else if (isIOS && !audioEnabled) {
      // On iOS, show banner to enable audio
      // Only show "and voice" if TTS is enabled in settings
      const bannerText = enableTTS ? "🔊🎤 Click here to enable audio and voice" : "🔊 Click here to enable audio";
      banner.removeClass("enabled").text(bannerText).show();
    } else if (!isIOS && enableTTS && !ttsUserInitialized) {
      // On desktop, show banner when TTS is enabled but not initialized by user
      banner.removeClass("enabled").text("🔊 Click here to enable voice").show();
    } else {
      banner.hide();
    }
  }

  $(function () {
    // Detect iOS and show banner if needed
    isIOS = detectIOS();
    if (isIOS) {
      // Don't auto-initialize on iOS - require user action
      updateUnifiedBanner();
    } else {
      // On non-iOS devices, enable audio automatically (no need to test actual playback)
      audioEnabled = true;
      updateTestState();
    }

    loadSettings();
    loadStatistics(); // Load stats on init (now includes computeStringErrorCounts)

    // Initialize TTS if enabled in settings (but not on iOS - requires user interaction)
    if (enableTTS && isTTSSupported() && !isIOS) {
      initializeTTS();
    }

    // Update test state after all initialization is complete
    updateTestState();

    // Show unified banner on iOS if audio is not enabled
    updateUnifiedBanner();

    // Check TTS support and conditionally show/hide the option
    const $ttsOption = $("#enable-tts").closest("label");
    const $ttsUnavailable = $("#tts-unavailable");

    if (isTTSSupported()) {
      $ttsOption.show();
      $ttsUnavailable.hide();

      // Initialize voice selection
      populateVoiceSelection();
      updateVoiceSelectionVisibility();

      // Force early voice loading for better cross-browser compatibility
      if ("speechSynthesis" in window) {
        // Call getVoices() immediately to trigger loading - based on Stack Overflow solution
        speechSynthesis.cancel(); // removes anything 'stuck'
        speechSynthesis.getVoices();

        // Listen for voice changes
        speechSynthesis.addEventListener("voiceschanged", () => {
          populateVoiceSelection();
        });
      }
    } else {
      $ttsOption.hide();
      $ttsUnavailable.show();
      enableTTS = false; // Force disable TTS on unsupported browsers
      $("#enable-tts").prop("checked", false);
    }

    updateTuningUI(); // Initialize tuning UI
    makeSession();
    showCard();

    // Initialize test state
    updateTestState();

    // Expose functions for testing and touch handler
    (window as any).updateUnifiedBanner = updateUnifiedBanner;
    (window as any).handleFretClick = handleFretClick;
    (window as any).handleFretboardClick = handleFretboardClick;
    (window as any).handleQuizNoteClick = playNoteCard;
    (window as any).currentCard = currentCard;

    $("#fret-buttons").on("click", ".fret-btn", handleFretClick);

    $("#quiz-note-btn").on("click", function () {
      playNoteCard();
    });

    $("#fret-count").on("change", function () {
      let val = Number(this.value);
      if (val === 11 || val === 21 || val === 22 || val === 24) {
        fretCountSetting = val;
        saveSettings();
        makeSession();
        showCard();
      }
    });
    $("#accidentals").on("change", function () {
      showAccidentals = this.checked;
      saveSettings();
      makeSession();
      showCard();
    });
    $timeout.on("change", function () {
      let v = parseInt(this.value);
      timeoutSeconds = isNaN(v) ? 2 : v;
      saveSettings();
    });
    $timeout.on("keypress", debouncedSaveTimeout);

    $fretboard.on("click", ".fret-cell.active-string", handleFretboardClick);

    // Add event handler for open string note clicks
    $fretboard.on("click", ".open-note", function () {
      let stringIdx = parseInt($(this).attr("data-string"));
      playAnsweredNote(stringIdx, 0); // Play the open string (fret 0)
    });

    // Add event handler for number of strings change
    $("#num-strings").on("change", function () {
      numStrings = parseInt(this.value);
      tuning = defaultTunings[numStrings].strings.slice(); // Reset to default tuning for new count
      updateTuningUI();
      saveSettings();
      makeSession();
      showCard();
    });

    // Add event handler for individual tuning changes
    $tuning.on("change", ".tuning-select", function () {
      let stringIdx = $(this).data("string");
      tuning[stringIdx].note = this.value;
      saveSettings();
      makeSession();
      showCard();
    });

    // Add event handler for octave changes
    $tuning.on("change", ".octave-select", function () {
      let stringIdx = $(this).data("string");
      tuning[stringIdx].octave = parseInt(this.value);
      saveSettings();
      makeSession();
      showCard();
    });

    // Add event handler for reset button
    $("#reset-tuning").on("click", function () {
      numStrings = 6;
      $("#num-strings").val(6);
      tuning = defaultTunings[6].strings.slice();
      updateTuningUI();
      saveSettings();
      makeSession();
      showCard();
    });

    // Add event handler for reset stats button
    $("#reset-stats").on("click", function () {
      statistics = { answers: [] };
      saveStatistics();
    });

    // Unified banner click handler
    $unifiedBanner.on("click", async function () {
      // Initialize audio if not already enabled
      if (!audioEnabled) {
        initAudioContext();
      }

      // Initialize TTS if not already initialized (this is a user interaction)
      if ((!ttsInitialized || isIOS) && "speechSynthesis" in window) {
        ttsUserInitialized = true; // Mark that user has initialized TTS

        // On iOS, we need to speak immediately during user interaction
        if (isIOS) {
          // Load voices first
          const voices = speechSynthesis.getVoices();
          if (voices.length === 0) {
            // Wait for voices to load
            await new Promise<void>((resolve) => {
              const handler = () => {
                speechSynthesis.removeEventListener("voiceschanged", handler);
                resolve();
              };
              speechSynthesis.addEventListener("voiceschanged", handler, { once: true } as any);

              // Fallback timeout
              setTimeout(() => {
                speechSynthesis.removeEventListener("voiceschanged", handler);
                resolve();
              }, 2000);
            });
          }

          // Get available voices after loading
          const availableVoices = speechSynthesis.getVoices();
          let voiceToUse = null;

          // First, try to use the user's selected voice
          if (selectedVoice) {
            voiceToUse = availableVoices.find((v) => v.name === selectedVoice);
          }

          // If no selected voice or it's not available, pick the best English voice
          if (!voiceToUse && availableVoices.length > 0) {
            const englishVoices = availableVoices.filter((v) => v.lang.startsWith("en"));
            const localEnglishVoices = englishVoices.filter((v) => v.localService);

            if (localEnglishVoices.length > 0) {
              voiceToUse = localEnglishVoices[0];
            } else if (englishVoices.length > 0) {
              voiceToUse = englishVoices[0];
            }
          }

          // Speak the system message immediately - match the banner text
          const systemMessage = enableTTS ? "Audio and voice enabled" : "Audio enabled";
          const utterance = new SpeechSynthesisUtterance(systemMessage);
          if (voiceToUse) {
            utterance.voice = voiceToUse;
          }
          speechSynthesis.speak(utterance);

          // If there's a current quiz card and TTS is enabled, also speak the quiz hint immediately
          if (currentCard && enableTTS) {
            const ordinalString = getOrdinal(currentCard.string + 1);
            let spokenNote = currentCard.note;

            // Spell out accidentals for clarity
            if (spokenNote.includes("#")) {
              spokenNote = spokenNote.replace("#", " sharp");
            } else if (spokenNote.includes("b") || spokenNote.includes("♭")) {
              spokenNote = spokenNote.replace(/[b♭]/, " flat");
            }

            const quizText = `Note ${spokenNote}, ${ordinalString} string`;
            const quizUtterance = new SpeechSynthesisUtterance(quizText);
            if (voiceToUse) {
              quizUtterance.voice = voiceToUse;
            }
            speechSynthesis.speak(quizUtterance);
          }

          // Initialize TTS after iOS-specific logic
          initializeTTS();
        } else {
          // On non-iOS, use the existing logic
          speakSystemMessage("Voice enabled");
          if (currentCard && enableTTS) {
            queueQuizNoteAnnouncement();
          }

          // Initialize TTS after non-iOS logic
          initializeTTS();
        }
      } else {
        // TTS already initialized, use existing logic
        if (!isIOS) {
          speakSystemMessage("Voice enabled");
        }
        if (currentCard && enableTTS) {
          queueQuizNoteAnnouncement();
        }
      }

      // Hide banner when clicked (user is already interacting)
      $unifiedBanner.hide();
      updateTestState();
    });

    // Mic toggle handler
    $("#mic-toggle").on("click", async function () {
      const $btn = $(this);
      if (!pitchDetecting) {
        try {
          await startMic();
          $btn.text("🎤 Disable Mic");
        } catch (e) {
          console.error("Failed to start mic:", e);
          alert("Unable to access microphone: " + (e && e.message ? e.message : e));
        }
      } else {
        stopMic();
        $btn.text("🎤 Enable Mic");
      }
    });

    $("#enable-bias").on("change", function () {
      enableBias = this.checked;
      saveSettings();
      // Do not recreate session or change current card; bias applies to next makeSession()
    });

    $("#show-score-notation").on("change", function () {
      showScoreNotation = this.checked;
      saveSettings();
      $("#score-key-row").toggle(this.checked);
      $("#hide-quiz-note-label").toggle(this.checked);
      if (!this.checked) {
        $("#hide-quiz-note").prop("checked", false);
        hideQuizNote = false;
      }
      if (currentCard) updateQuizNoteDisplay();
    });

    $("#score-key").on("change", function () {
      scoreKey = this.value;
      saveSettings();
      showCard();
    });

    $("#hide-quiz-note").on("change", function () {
      hideQuizNote = this.checked;
      saveSettings();
      if (currentCard) updateQuizNoteDisplay();
    });

    $("#enable-tts").on("change", function () {
      enableTTS = this.checked;
      updateVoiceSelectionVisibility();
      saveSettings();
      updateTestState();

      // Hide banner when toggling via checkbox (user is already interacting)
      $unifiedBanner.hide();

      // Speak status message when enabling TTS
      if (enableTTS) {
        // Initialize TTS immediately when enabling (this is a user interaction)
        if (!ttsInitialized && "speechSynthesis" in window) {
          initializeTTS();
        }
        // Speak confirmation
        speakSystemMessage("Voice enabled");
        // Queue and speak the quiz note after voice is enabled
        if (currentCard) {
          queueQuizNoteAnnouncement();
        }
      } else {
        // When disabling TTS, clear the queue and reset state
        clearTTSQueue();
        ttsInitialized = false;
        ttsCurrentlyPlaying = false;
        // Clear utterance log when disabling TTS
        utteranceLog = [];
        updateTestState();
      }
    });

    $("#voice-select").on("change", function () {
      const newVoice = (this as HTMLSelectElement).value || null;
      const voiceName = newVoice || "Default";
      selectedVoice = newVoice;
      saveSettings();
      updateTestState();

      // Provide feedback to blind users and debug voice changes
      if (enableTTS && ttsInitialized) {
        speakSystemMessage(`Changed the voice to ${voiceName}`);
      }
    });

    // Add event handler for skip button
    $("#skip-countdown").on("click", function () {
      clearInterval(countdownInterval);
      countdownValue = 0;
      $("#countdown").text("");
      nextCard();
    });
    
    // Make populateVoiceSelection globally accessible for testing
    (window as any).populateVoiceOptions = populateVoiceSelection;
  });
});
