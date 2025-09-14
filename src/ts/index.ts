import { PitchDetector } from 'pitchy';

console.log(`loaded index.js`);

$(async function () {
  const SETTINGS_KEY = "guitar_flashcard_settings_v1";
  const STATS_KEY = "guitar_flashcard_stats_v1";

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

  function renderNoteScore(note, stringIndex, frets) {
    const trebleContainer = document.getElementById("treble-score");
    const bassContainer = document.getElementById("bass-score");

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

    const trebleNotes = [];
    const bassNotes = [];

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
        // Low to mid range - prefer bass clef
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
          let vexT = tName.toLowerCase();
          if (tName.includes("#")) vexT = tName.charAt(0).toLowerCase() + "#";
          else if (tName.includes("b")) vexT = tName.charAt(0).toLowerCase() + "b";
          const tPair = { note: vexT, octave: tOct };
          if (!trebleNotes.some((n) => n.note === tPair.note && n.octave === tPair.octave)) trebleNotes.push(tPair);
        }
      } else if (midi > 55 && trebleFits) {
        // High range - prefer treble clef
        const { note: tName, octave: tOct } = midiToNoteAndOctave(writtenTrebleMidi, note);
        let vexT = tName.toLowerCase();
        if (tName.includes("#")) vexT = tName.charAt(0).toLowerCase() + "#";
        else if (tName.includes("b")) vexT = tName.charAt(0).toLowerCase() + "b";
        const tPair = { note: vexT, octave: tOct };
        if (!trebleNotes.some((n) => n.note === tPair.note && n.octave === tPair.octave)) trebleNotes.push(tPair);
      } else {
        // Fallback: choose the clef that minimizes ledger lines
        const distToRange = (m, min, max) => {
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
            const trebleSvg = document.getElementById("treble-score").querySelector("svg");
            if (trebleSvg) {
              // Remove the white background rect added by VexFlow to eliminate extra white space
              const bgRect = trebleSvg.querySelector("rect");
              if (bgRect) bgRect.remove();
              // Calculate tight bounding box around stave and notes
              const staveG = trebleSvg.querySelector("g.vf-stave");
              const noteG = trebleSvg.querySelector("g.vf-stavenote");
              let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;
              if (staveG) {
                const b = staveG.getBBox();
                minX = Math.min(minX, b.x);
                minY = Math.min(minY, b.y);
                maxX = Math.max(maxX, b.x + b.width);
                maxY = Math.max(maxY, b.y + b.height);
              }
              if (noteG) {
                const rect = noteG.querySelector("rect");
                if (rect) {
                  const x = parseFloat(rect.getAttribute("x"));
                  const y = parseFloat(rect.getAttribute("y"));
                  const width = parseFloat(rect.getAttribute("width"));
                  const height = parseFloat(rect.getAttribute("height"));
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x + width);
                  maxY = Math.max(maxY, y + height);
                }
              }
              if (minX !== Infinity) {
                const margin = 24;
                trebleSvg.setAttribute("viewBox", `${minX - margin} ${minY - margin} ${maxX - minX + 2 * margin} ${maxY - minY + 2 * margin}`);
              } else {
                // Fallback
                const bbox = trebleSvg.getBBox();
                trebleSvg.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
              }
              trebleSvg.setAttribute("width", "100%");
              trebleSvg.setAttribute("height", "100%");
            }
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
            const bassSvg = document.getElementById("bass-score").querySelector("svg");
            if (bassSvg) {
              // Remove the white background rect added by VexFlow to eliminate extra white space and pessimize the bounding box
              const bgRect = bassSvg.querySelector("rect");
              if (bgRect) bgRect.remove();
              // Calculate tight bounding box around stave and notes
              const staveG = bassSvg.querySelector("g.vf-stave");
              const noteG = bassSvg.querySelector("g.vf-stavenote");
              let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;
              if (staveG) {
                const b = staveG.getBBox();
                minX = Math.min(minX, b.x);
                minY = Math.min(minY, b.y);
                maxX = Math.max(maxX, b.x + b.width);
                maxY = Math.max(maxY, b.y + b.height);
              }
              if (noteG) {
                const rect = noteG.querySelector("rect");
                if (rect) {
                  const x = parseFloat(rect.getAttribute("x"));
                  const y = parseFloat(rect.getAttribute("y"));
                  const width = parseFloat(rect.getAttribute("width"));
                  const height = parseFloat(rect.getAttribute("height"));
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x + width);
                  maxY = Math.max(maxY, y + height);
                }
              }
              if (minX !== Infinity) {
                const margin = 15;
                bassSvg.setAttribute("viewBox", `${minX - margin} ${minY - margin} ${maxX - minX + 2 * margin} ${maxY - minY + 2 * margin}`);
              } else {
                // Fallback
                const bbox = bassSvg.getBBox();
                bassSvg.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
              }
              bassSvg.setAttribute("width", "100%");
              bassSvg.setAttribute("height", "100%");
            }
          }
        }
      } catch (err) {
        console.error("Error rendering bass staff:", err, "\nbassNoteObj=", bassNoteObj, "\nbassNotes=", bassNotes);
      }
    }
  }

  const typicalFretMarks = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
  const doubleFretMarkers = [12, 24];

  let currentCard = null;
  let extendedRange = false;
  let showAccidentals = false;
  let timeoutSeconds = 2;
  let pendingTimeout = null;
  let session = [];
  let sessionIdx = 0;
  let foundFrets = [];
  let countdownInterval = null;
  let countdownValue = 0;
  let fretCount = 12; // default: 0th + frets 1-11

  // Declare stringNames as an empty array (was missing, causing UI breakage)
  let stringNames = [];

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

  let statistics = {
    answers: [],
  }; // Object to hold answer events in 'answers' array

  let enableBias = true; // Default to true for improved learning
  let showScoreNotation = false; // Default to false to hide score by default
  let scoreKey = "C"; // Default key for score notation

  // Octaves for MIDI calculation based on string count (expanded to 3-12)
  // Removed: now combined into defaultTunings

  // Function to calculate MIDI from note and octave
  function getMidi(note, octave) {
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
    return 12 * (octave + 1) + baseMidi[note];
  }

  // Helper function to get the correct enharmonic spelling for a note based on key signature
  function getEnharmonicForKey(noteIndex, keySignature) {
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

    const preferences = keyPreferences[keySignature] || [];

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
  function midiToNoteAndOctave(midi, quizNote) {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;

    // Normalize possible unicode accidentals passed from UI (e.g. '♯','♭')
    if (typeof quizNote === "string") {
      quizNote = quizNote.replace(/♯/g, "#").replace(/♭/g, "b");
    }

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
      extendedRange: !!extendedRange,
      showAccidentals: !!showAccidentals,
      timeoutSeconds: Number(timeoutSeconds),
      numStrings: Number(numStrings),
      tuning: tuning.slice(),
      enableBias: !!enableBias,
      showScoreNotation: !!showScoreNotation,
      scoreKey: scoreKey,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // Update loadSettings to load new config (adjusted validation for 3-12)
  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const settings = JSON.parse(raw);
      if (typeof settings !== "object") return;
      if ("extendedRange" in settings) {
        extendedRange = !!settings.extendedRange;
        $("#extended-range").prop("checked", extendedRange);
      }
      if ("showAccidentals" in settings) {
        showAccidentals = !!settings.showAccidentals;
        $("#accidentals").prop("checked", showAccidentals);
      }
      if ("timeoutSeconds" in settings) {
        let val = Number(settings.timeoutSeconds);
        if (isFinite(val) && val >= 0 && val <= 10) {
          timeoutSeconds = val;
          $("#timeout-seconds").val(timeoutSeconds);
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
        if (settings.tuning.every((t) => t && typeof t.note === "string" && typeof t.octave === "number")) {
          tuning = settings.tuning.slice();
        } else {
          tuning = defaultTunings[numStrings].strings.slice();
        }
      } else {
        tuning = defaultTunings[numStrings].strings.slice();
      }
      if ("enableBias" in settings) {
        enableBias = !!settings.enableBias;
        $("#enable-bias").prop("checked", enableBias);
      } else {
        $("#enable-bias").prop("checked", enableBias); // Ensure default true is reflected
      }
      if ("showScoreNotation" in settings) {
        showScoreNotation = !!settings.showScoreNotation;
        $("#show-score-notation").prop("checked", showScoreNotation);
        if (showScoreNotation) {
          $("#score-key-row").show();
        } else {
          $("#score-key-row").hide();
        }
      }
      if ("scoreKey" in settings) {
        scoreKey = settings.scoreKey;
        $("#score-key").val(scoreKey);
      }
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

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function getNoteIdxAtFret(stringIdx, fretIdx) {
    const openIdx = allNotes.indexOf(stringNames[stringIdx].openNote);
    return (openIdx + fretIdx) % 12;
  }

  // Convert string index and fret number to note name
  function fretToNote(stringIdx, fretIdx) {
    const openMidi = getMidi(tuning[stringIdx].note, tuning[stringIdx].octave);
    const fretMidi = openMidi + fretIdx;
    const { note } = midiToNoteAndOctave(fretMidi, currentCard?.note);
    return note;
  }

  function notesToSet() {
    if (showAccidentals) {
      return allNotes.concat(flatNotes);
    }
    return naturalNotes;
  }

  // Return English ordinal for a positive integer (1 -> "1st", 2 -> "2nd", 11 -> "11th", etc.)
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function makeSession() {
    // Set correct fret count: open string + 11 frets in default, +24 in extended
    fretCount = extendedRange ? 25 : 12;
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
          if (noteOnFret === n || (showAccidentals && ((sharpNotes.includes(n) && noteOnFret === n) || (flatNotes.includes(n) && allNotes[noteIdx] === n)))) {
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
    // Replace simple shuffle with weighted shuffle if stats exist, there are mistakes, and bias is enabled
    if (enableBias && statistics.answers.length > 0) {
      const currentTuningStr = JSON.stringify(tuning);
      const mistakeCounts = Array(numStrings).fill(0);
      let totalMistakes = 0;
      statistics.answers.forEach((answer) => {
        if (JSON.stringify(answer.tuning) === currentTuningStr && !answer.correct) {
          mistakeCounts[answer.string]++;
          totalMistakes++;
        }
      });
      const biasStrength = 1; // Adjust this value to increase/decrease bias effect
      if (totalMistakes > 0) {
        const weights = session.map((card) => 1 + (mistakeCounts[card.string] / totalMistakes) * biasStrength);
        session = weightedShuffle(session, weights);
      }
    }
    // Recompute string error counts for the current tuning/session so UI tooltips are correct
    computeStringErrorCounts();
    sessionIdx = 0;
  }

  // Add weighted shuffle function
  function weightedShuffle(arr, weights) {
    const result = [];
    let totalWeight = weights.reduce((sum, w) => sum + w, 0);
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

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showCard() {
    clearTimeout(pendingTimeout);
    clearInterval(countdownInterval);
    $("#countdown").text("");
    // Ensure error counts match current tuning/session before rendering
    computeStringErrorCounts();
    if (session.length === 0) {
      $("#quiz-note-btn").text("?");
      // clear machine-readable attributes when no session
      $("#quiz-note-btn").removeAttr("data-note");
      $("#flashcard-string").removeAttr("data-string-index data-string-name data-frets-count");
      $("#flashcard-string").text("Start!");
      $("#fret-buttons").empty();
      $("#fretboard-area").empty();
      $("#note-score").hide();
      return;
    }
    currentCard = session[sessionIdx];
    currentCard.shownTime = Date.now(); // Track when the card is shown
    foundFrets = currentCard.found.slice();
    $("#quiz-note-btn").text(currentCard.note);
    // expose stable attributes for tests (and other tooling)
    $("#quiz-note-btn").attr("data-note", currentCard.note);
    if (showScoreNotation) {
      $("#note-score").show();
      renderNoteScore(currentCard.note, currentCard.string, currentCard.frets);
    } else {
      $("#note-score").hide();
    }
    $("#flashcard-string").attr("data-string-index", currentCard.string).attr("data-string-name", stringNames[currentCard.string].name).attr("data-frets-count", currentCard.frets.length);
    $("#flashcard-string").text(
      // show as a readable sentence: "on the ... string"
      (extendedRange ? stringNames[currentCard.string].name.replace(")", ", " + currentCard.frets.length + "x)") : stringNames[currentCard.string].name) + " string",
    );

    drawFretboardTable(currentCard.string, foundFrets);

    let btns = "";
    for (let f = 0; f < fretCount; f++) {
      let btnClass = "fret-btn";
      if (f === 0) btnClass += " open-fret";
      if (foundFrets.includes(f)) btnClass += " correct";
      btns += `<button class="${btnClass}" data-fret="${f}">${f}</button>`;
    }
    $("#fret-buttons").html(btns);
  }

  let stringErrorCounts = []; // Array to hold error counts per string for current tuning

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
    let extraFret = extendedRange ? 0 : 1; // Add extra column for 12th fret marker in default mode (visual only)
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
      if (extendedRange) {
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
    $("#fretboard-area").html(tableHtml);
  }

  function nextCard() {
    sessionIdx++;
    if (sessionIdx >= session.length) {
      alert("Session complete!");
      makeSession();
    }
    // Clear mic feedback and status when moving to new question
    const feedbackEl = document.getElementById('mic-feedback');
    if (feedbackEl) {
      feedbackEl.textContent = '';
    }
    const statusEl = document.getElementById('mic-status');
    if (statusEl) {
      statusEl.textContent = '';
    }
    showCard();
  }

  // Centralized answer submission for both UI and mic sources.
  // `source` is a string like 'ui' or 'mic' to allow source-specific behavior later.
  // Can accept either a fret number OR a note name (string will be empty if note is provided)
  function submitAnswer(stringIdx, fret, source, detectedNote) {
    if (!currentCard) return;
    
    // Clear mic feedback when an answer is submitted
    const feedbackEl = document.getElementById('mic-feedback');
    if (feedbackEl && source !== 'mic') {
      feedbackEl.textContent = '';
    }
    // Clear detected note status when a manual answer is submitted
    const statusEl = document.getElementById('mic-status');
    if (statusEl && source !== 'mic') {
      statusEl.textContent = '';
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
        const feedbackEl = document.getElementById('mic-feedback');
        if (feedbackEl) {
          feedbackEl.textContent = `Unknown note: ${detectedNote}`;
          feedbackEl.style.color = '#f44336';
        }
        return;
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
          const feedbackEl = document.getElementById('mic-feedback');
          if (feedbackEl) {
            feedbackEl.textContent = `${namePart}${octavePart} out of range (fret ${fretDiff})`;
            feedbackEl.style.color = '#f44336';
          }
          return;
        }
      } else {
        // Only search different octaves when no specific octave was provided
        for (let octave = 1; octave <= 8; octave++) {
          const candidateMidi = getMidi(variant.name, octave);
          const fretDiff = candidateMidi - openMidi;
          if (fretDiff >= 0 && fretDiff <= 24) { // Within reasonable fret range
            detectedMidi = candidateMidi;
            break;
          }
        }
      }

      if (detectedMidi !== null) {
        fret = detectedMidi - openMidi;
        stringIdx = currentCard.string; // Force to current quiz string
        
        // Show success feedback
        const feedbackEl = document.getElementById('mic-feedback');
        if (feedbackEl && octavePart !== null) {
          feedbackEl.textContent = `${namePart}${octavePart} → fret ${fret}`;
          feedbackEl.style.color = '#4caf50';
        }
      } else {
        console.warn(`Could not convert detected note ${detectedNote} to fret`);
        return;
      }
    }
    
    playAnsweredNote(stringIdx, fret);
    const isCorrect = currentCard.frets.includes(fret);
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
      if (extendedRange) {
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
      if (source === 'mic') {
        clearTimeout(pendingTimeout);
        clearInterval(countdownInterval);
        countdownValue = 0;
      }
    }
  }

  function markButton(btn, correct) {
    $(btn).addClass(correct ? "correct" : "wrong");
    if (!correct) setTimeout(() => $(btn).removeClass("wrong"), 1000);
  }

  function handleFretClick(e) {
    if (!currentCard) return;
    let fret = parseInt($(this).attr("data-fret"));
    submitAnswer(currentCard.string, fret, 'ui', null);
  }

  function handleFretboardClick(e) {
    let s = Number($(this).attr("data-string"));
    let f = Number($(this).attr("data-fret"));
    if (s !== currentCard.string) return;
    submitAnswer(s, f, 'ui', null);
  }

  function playAnsweredNote(stringIdx, fretIdx) {
    let midi = stringNames[stringIdx].midi + fretIdx;
    let freq = midiToFreq(midi);
    playTone(freq, 0.7);
  }

  function playDesiredNote(stringIdx, fretIdx) {
    let midi = stringNames[stringIdx].midi + fretIdx;
    let freq = midiToFreq(midi);
    setTimeout(() => playTone(freq, 0.7), 250);
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
    $("#countdown").text("⏳ " + countdownValue);
    countdownInterval = setInterval(() => {
      countdownValue--;
      $("#countdown").text(countdownValue > 0 ? "⏳ " + countdownValue : "");
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        $("#countdown").text("");
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

  // Pitch detection state (pitchy)
  let micStream = null;
  let audioContextForPitch = null;
  let analyserForPitch = null;
  let detector = null;
  let pitchDetecting = false;
  let pitchAnimFrame = null;
  let pitchBuffer = null;
  let smoothedLevel = 0;
  let lastMeterUpdate = 0;
  let micBaselineRms = 0;
  let baselineSamplesCount = 0;
  let collectBaselineUntil = 0;
  let lastDetectedNoteId: number | null = null;
  let noteStableSince: number | null = null;
  let displayedNoteId: number | null = null;
  const NOTE_STABLE_MS = 300;

  // Detect iOS devices
  function detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
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

    // Generate wave data (triangle for octaves 1-2, sine otherwise)
    for (let i = 0; i < length; i++) {
      let sample;
      if (useTriangle) {
        sample = (4 * Math.abs((((i * freq) / sampleRate) % 1) - 0.5) - 1) * 0.15 * 32767;
      } else {
        sample = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.15 * 32767;
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
          })
          .catch((err) => {
            console.error("Error playing audio:", err);
            // On first failure, try to re-enable audio
            if (!isIOS) {
              setTimeout(() => initAudioContext(), 100);
            }
          });
      }
    } catch (err) {
      console.error("Error playing tone:", err);
    }
  }

  // Add debounce function for saving timeout
  let timeoutSaveDebounce = null;
  function debouncedSaveTimeout() {
    clearTimeout(timeoutSaveDebounce);
    timeoutSaveDebounce = setTimeout(() => {
      let v = parseInt($("#timeout-seconds").val());
      if (isNaN(v) || v < 0 || v > 10) v = 2;
      timeoutSeconds = v;
      saveSettings();
    }, 200);
  }

  // Function to update the tuning UI
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
    $("#tuning-config").html(html);
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
            if (isIOS) updateSoundBanner();
            testAudio.pause();
            testAudio.currentTime = 0;
            console.log("Audio enabled successfully");
          })
          .catch((err) => {
            // Suppress expected autoplay policy warnings on desktop
            if (!isIOS && err.name === "NotAllowedError") {
              // This is expected on desktop - audio will work after user interaction
              audioEnabled = true;
            } else {
              console.error("Failed to enable audio:", err);
              if (isIOS) {
                audioEnabled = false;
              } else {
                // On non-iOS, assume audio will work even if test fails
                audioEnabled = true;
              }
            }
          });
      } else {
        // Fallback for older browsers
        audioEnabled = true;
      }
    } catch (err) {
      console.error("Failed to initialize audio:", err);
      if (!isIOS) {
        // On non-iOS, assume audio will work
        audioEnabled = true;
      }
    }
  }

  // Start microphone and pitch detection using pitchy
  async function startMic() {
    if (pitchDetecting) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('getUserMedia not supported');
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
  lastMeterUpdate = 0;
  micBaselineRms = 0;
  baselineSamplesCount = 0;
  collectBaselineUntil = Date.now() + 300; // collect baseline for first 300ms
  const statusEl = document.getElementById('mic-status');
  const meterEl = document.getElementById('mic-meter');
  const feedbackEl = document.getElementById('mic-feedback');
  if (statusEl) statusEl.style.display = 'inline';
  if (meterEl) meterEl.style.display = 'inline-block';
  if (feedbackEl) feedbackEl.style.display = 'inline';

  // statusEl already declared above

    // Ensure AudioContext is running (user gesture should have started it)
    if (audioContextForPitch && audioContextForPitch.state === 'suspended') {
      audioContextForPitch.resume().catch(() => {});
    }

    const loop = () => {
      if (!pitchDetecting) return;
      analyserForPitch.getFloatTimeDomainData(pitchBuffer);
      // Compute simple RMS to detect whether the mic is receiving any signal
      let sum = 0;
      for (let i = 0; i < pitchBuffer.length; i++) {
        sum += pitchBuffer[i] * pitchBuffer[i];
      }
      const rms = Math.sqrt(sum / pitchBuffer.length);

  // Use pitchy correctly: pass sampleRate as second arg
  const [frequency, clarity] = detector.findPitch(pitchBuffer, audioContextForPitch.sampleRate);
      const meterFill = document.getElementById('mic-meter-fill');
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
        const midiRound = Math.round(midi);
        currentNoteId = midiRound;
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
        const meterFillSilent = document.getElementById('mic-meter-fill');
        const noteMeterFillSilent = document.getElementById('note-meter-fill');
        const meterEl = document.getElementById('mic-meter');
        if (meterFillSilent) {
          meterFillSilent.style.width = `0%`;
          meterFillSilent.style.background = '#4caf50';
        }
        if (noteMeterFillSilent) {
          noteMeterFillSilent.style.width = `0%`;
          noteMeterFillSilent.style.background = '#4caf50';
        }
        // Change meter border to indicate no input
        if (meterEl) {
          meterEl.style.borderColor = '#555';
        }
      } else if (stable && currentNoteId !== null) {
        // Show note and update meter when stable
        const midiRound = currentNoteId;
        const noteName = allNotes[(midiRound % 12 + 12) % 12];
        const octave = Math.floor(midiRound / 12) - 1;
        if (statusEl) statusEl.textContent = `${noteName}${octave}`;
        // Update meter immediately when stable (use smoothedLevel)
        const meterFillStable = document.getElementById('mic-meter-fill');
        const noteMeterFill = document.getElementById('note-meter-fill');
        const meterEl = document.getElementById('mic-meter');
        if (meterFillStable) {
          const pct = Math.round(smoothedLevel * 100);
          meterFillStable.style.width = `${pct}%`;
          if (smoothedLevel < 0.4) meterFillStable.style.background = '#4caf50';
          else if (smoothedLevel < 0.8) meterFillStable.style.background = '#ffeb3b';
          else meterFillStable.style.background = '#f44336';
        }
        if (noteMeterFill) {
          const pct = Math.round(smoothedLevel * 100);
          noteMeterFill.style.width = `${pct}%`;
          if (smoothedLevel < 0.4) noteMeterFill.style.background = '#4caf50';
          else if (smoothedLevel < 0.8) noteMeterFill.style.background = '#ffeb3b';
          else noteMeterFill.style.background = '#f44336';
        }
        // Change meter border to indicate stable note detection
        if (meterEl) {
          meterEl.style.borderColor = '#4caf50';
        }
        // Submit this stable detected note to the quiz flow once
        if (displayedNoteId !== currentNoteId) {
          try {
            // Map to nearest fret and submit via unified handler. Only mark displayedNoteId
            // when submission succeeded to avoid a spurious guard that blocks future tries.
            const ok = submitDetectedNote(midiRound);
            if (ok) displayedNoteId = currentNoteId;
          } catch (e) {
            console.error('submitDetectedNote error', e);
          }
        }
      } else {
        // Change meter border to indicate detecting/unstable
        const meterEl = document.getElementById('mic-meter');
        if (meterEl) {
          meterEl.style.borderColor = '#ffeb3b';
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
    const statusEl = document.getElementById('mic-status');
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.style.display = 'none';
    }
  const meterEl = document.getElementById('mic-meter');
    if (meterEl) {
      meterEl.style.display = 'none';
      meterEl.style.borderColor = '#777'; // Reset border color
    }
    const feedbackEl = document.getElementById('mic-feedback');
    if (feedbackEl) feedbackEl.style.display = 'none';
    // clear meter
    const meterFill = document.getElementById('mic-meter-fill');
    if (meterFill) meterFill.style.width = '0%';
  micBaselineRms = 0;
  baselineSamplesCount = 0;
  collectBaselineUntil = 0;
  const noteMeterFill = document.getElementById('note-meter-fill');
  if (noteMeterFill) noteMeterFill.style.width = '0%';
    detector = null;
    pitchBuffer = null;
  }

  // Map a detected MIDI note to nearest fret for the current card and submit it
  function submitDetectedNote(midiRound) {
    // Convert MIDI to note name and delegate to unified submitAnswer
    try {
      if (!currentCard) return;
      const noteName = allNotes[(midiRound % 12 + 12) % 12];
      const octave = Math.floor(midiRound / 12) - 1;
      console.log(`Detected note: ${noteName}${octave} (MIDI ${midiRound})`);
      // Pass both name and octave (format: NAME/OCTAVE) so submitAnswer can use exact octave
      submitAnswer(null, null, 'mic', `${noteName}/${octave}`);
      return true;
    } catch (e) {
      console.error('submitDetectedNote failed', e);
      return false;
    }
  }

  function updateSoundBanner() {
    const banner = $("#sound-banner");
    if (audioEnabled) {
      banner.addClass("enabled").text("🔊 Sound enabled!");
      setTimeout(() => banner.hide(), 2000);
    } else {
      banner.removeClass("enabled").text("🔊 Click here to enable sound").show();
    }
  }

  $(function () {
    // Detect iOS and show banner if needed
    isIOS = detectIOS();
    if (isIOS) {
      $("#sound-banner").show();
      // Don't auto-initialize on iOS - require user action
    } else {
      // On non-iOS devices, initialize audio automatically
      audioEnabled = true;
      initAudioContext();
    }

    loadSettings();
    loadStatistics(); // Load stats on init (now includes computeStringErrorCounts)
    updateTuningUI(); // Initialize tuning UI
    makeSession();
    showCard();

    $("#fret-buttons").on("click", ".fret-btn", handleFretClick);

    $("#quiz-note-btn").on("click", function () {
      playNoteCard();
    });

    $("#extended-range").on("change", function () {
      extendedRange = this.checked;
      saveSettings();
      makeSession();
      showCard();
    });
    $("#accidentals").on("change", function () {
      showAccidentals = this.checked;
      saveSettings();
      makeSession();
      showCard();
    });
    $("#timeout-seconds").on("change", function () {
      let v = parseInt(this.value);
      timeoutSeconds = isNaN(v) ? 2 : v;
      saveSettings();
    });
    $("#timeout-seconds").on("keypress", debouncedSaveTimeout);

    $("#fretboard-area").on("click", ".fret-cell.active-string", handleFretboardClick);

    // Add event handler for open string note clicks
    $("#fretboard-area").on("click", ".open-note", function () {
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
    $("#tuning-config").on("change", ".tuning-select", function () {
      let stringIdx = $(this).data("string");
      tuning[stringIdx].note = this.value;
      saveSettings();
      makeSession();
      showCard();
    });

    // Add event handler for octave changes
    $("#tuning-config").on("change", ".octave-select", function () {
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

    // Sound banner click handler (only needed on iOS)
    $("#sound-banner").on("click", function () {
      initAudioContext();
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
      if (showScoreNotation) {
        $("#score-key-row").show();
      } else {
        $("#score-key-row").hide();
      }
      showCard();
    });

    $("#score-key").on("change", function () {
      scoreKey = this.value;
      saveSettings();
      showCard();
    });

    // Add event handler for skip button
    $("#skip-countdown").on("click", function () {
      clearInterval(countdownInterval);
      countdownValue = 0;
      $("#countdown").text("");
      nextCard();
    });
  });
});
