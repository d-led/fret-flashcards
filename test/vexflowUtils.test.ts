import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateDistanceToRange,
  determineClefUsage,
  chooseBestClef,
  addTrebleNote,
  addBassNote,
  calculateScoreNotes,
  normalizeVexFlowKeys,
  updateBoundsFromElements,
  applySvgCropping,
  createVexFlowConfig,
  isValidVexFlowNoteObject,
  DEFAULT_SCORE_CONFIG,
  VexFlowNote,
  VexFlowNoteObject,
  ScoreRenderingConfig,
} from "../src/ts/modules/vexflowUtils";

// Mock DOM elements
const mockSVGElement = {
  getBBox: vi.fn(),
  setAttribute: vi.fn(),
  querySelectorAll: vi.fn(),
};

const mockContainer = {
  querySelector: vi.fn(() => mockSVGElement),
};

// Mock global VexFlow
global.VexFlow = {
  Factory: vi.fn(),
  Accidental: {
    applyAccidentals: vi.fn(),
  },
  Voice: {
    Mode: {
      SOFT: "soft",
    },
  },
} as any;

describe("VexFlow Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateDistanceToRange", () => {
    it("should return 0 for notes within range", () => {
      expect(calculateDistanceToRange(60, 50, 70)).toBe(0);
      expect(calculateDistanceToRange(50, 50, 70)).toBe(0);
      expect(calculateDistanceToRange(70, 50, 70)).toBe(0);
    });

    it("should return positive distance for notes below range", () => {
      expect(calculateDistanceToRange(40, 50, 70)).toBe(10);
      expect(calculateDistanceToRange(30, 50, 70)).toBe(20);
    });

    it("should return positive distance for notes above range", () => {
      expect(calculateDistanceToRange(80, 50, 70)).toBe(10);
      expect(calculateDistanceToRange(90, 50, 70)).toBe(20);
    });
  });

  describe("determineClefUsage", () => {
    const config: ScoreRenderingConfig = {
      trebleOctaveShift: 12,
      bassOctaveShift: 12,
      trebleRange: { min: 40, max: 127 },
      bassRange: { min: 0, max: 91 },
      scoreKey: "C",
    };

    it("should prefer bass clef for low notes", () => {
      const result = determineClefUsage(50, config); // Low note
      expect(result.useBass).toBe(true);
      expect(result.preferBass).toBe(true);
    });

    it("should prefer treble clef for high notes", () => {
      const result = determineClefUsage(80, config); // High note
      expect(result.useTreble).toBe(true);
      expect(result.preferBass).toBe(false);
    });

    it("should use both clefs when note fits in both ranges", () => {
      const result = determineClefUsage(60, config); // Mid-range note
      expect(result.useTreble).toBe(true);
      expect(result.useBass).toBe(false); // Only treble is used for mid-range notes
    });

    it("should not use clefs when note doesn't fit", () => {
      const result = determineClefUsage(10, config); // Very low note
      expect(result.useTreble).toBe(false);
      expect(result.useBass).toBe(true); // Very low notes still use bass clef
    });
  });

  describe("chooseBestClef", () => {
    const config: ScoreRenderingConfig = {
      trebleOctaveShift: 12,
      bassOctaveShift: 12,
      trebleRange: { min: 40, max: 127 },
      bassRange: { min: 0, max: 91 },
      scoreKey: "C",
    };

    it("should choose bass clef when it's closer to range", () => {
      const result = chooseBestClef(30, 50, config); // Treble too low, bass closer
      expect(result.clef).toBe("bass");
      expect(result.writtenMidi).toBe(50);
    });

    it("should choose treble clef when it's closer to range", () => {
      const result = chooseBestClef(50, 30, config); // Bass too low, treble closer
      expect(result.clef).toBe("treble");
      expect(result.writtenMidi).toBe(50);
    });

    it("should choose treble clef when distances are equal", () => {
      const result = chooseBestClef(40, 40, config); // Equal distances
      expect(result.clef).toBe("treble");
      expect(result.writtenMidi).toBe(40);
    });
  });

  describe("addTrebleNote", () => {
    it("should add note to treble notes array", () => {
      const trebleNotes: VexFlowNote[] = [];
      addTrebleNote("C", 4, trebleNotes);
      expect(trebleNotes).toHaveLength(1);
      expect(trebleNotes[0]).toEqual({ note: "c", octave: 4 });
    });

    it("should normalize sharp notes", () => {
      const trebleNotes: VexFlowNote[] = [];
      addTrebleNote("C#", 4, trebleNotes);
      expect(trebleNotes[0]).toEqual({ note: "c#", octave: 4 });
    });

    it("should normalize flat notes", () => {
      const trebleNotes: VexFlowNote[] = [];
      addTrebleNote("Db", 4, trebleNotes);
      expect(trebleNotes[0]).toEqual({ note: "db", octave: 4 });
    });

    it("should not add duplicate notes", () => {
      const trebleNotes: VexFlowNote[] = [];
      addTrebleNote("C", 4, trebleNotes);
      addTrebleNote("C", 4, trebleNotes);
      expect(trebleNotes).toHaveLength(1);
    });

    it("should add notes with different octaves", () => {
      const trebleNotes: VexFlowNote[] = [];
      addTrebleNote("C", 4, trebleNotes);
      addTrebleNote("C", 5, trebleNotes);
      expect(trebleNotes).toHaveLength(2);
    });
  });

  describe("addBassNote", () => {
    it("should add note to bass notes array", () => {
      const bassNotes: VexFlowNote[] = [];
      addBassNote("C", 4, bassNotes);
      expect(bassNotes).toHaveLength(1);
      expect(bassNotes[0]).toEqual({ note: "c", octave: 4 });
    });

    it("should normalize sharp notes", () => {
      const bassNotes: VexFlowNote[] = [];
      addBassNote("C#", 4, bassNotes);
      expect(bassNotes[0]).toEqual({ note: "c#", octave: 4 });
    });

    it("should not add duplicate notes", () => {
      const bassNotes: VexFlowNote[] = [];
      addBassNote("C", 4, bassNotes);
      addBassNote("C", 4, bassNotes);
      expect(bassNotes).toHaveLength(1);
    });
  });

  describe("calculateScoreNotes", () => {
    const config: ScoreRenderingConfig = {
      trebleOctaveShift: 12,
      bassOctaveShift: 12,
      trebleRange: { min: 40, max: 127 },
      bassRange: { min: 0, max: 91 },
      scoreKey: "C",
    };

    const tuning = [
      { note: "E", octave: 4 },
      { note: "B", octave: 3 },
      { note: "G", octave: 3 },
      { note: "D", octave: 3 },
      { note: "A", octave: 2 },
      { note: "E", octave: 2 },
    ];

    it("should return empty result for invalid input", () => {
      const result = calculateScoreNotes("", 0, [], tuning, config);
      expect(result.trebleNotes).toHaveLength(0);
      expect(result.bassNotes).toHaveLength(0);
      expect(result.trebleNoteObj).toBeNull();
      expect(result.bassNoteObj).toBeNull();
    });

    it("should calculate notes for single fret", () => {
      const result = calculateScoreNotes("C", 0, [0], tuning, config);
      expect(result.trebleNotes.length).toBeGreaterThan(0);
      expect(result.trebleNoteObj).not.toBeNull();
    });

    it("should calculate notes for multiple frets", () => {
      const result = calculateScoreNotes("C", 0, [0, 1, 2], tuning, config);
      expect(result.trebleNotes.length).toBeGreaterThan(0);
      expect(result.trebleNoteObj).not.toBeNull();
    });

    it("should set correct width for accidental notes", () => {
      const result = calculateScoreNotes("C#", 0, [0], tuning, config);
      expect(result.width).toBe(140);
    });

    it("should set correct width for natural notes", () => {
      const result = calculateScoreNotes("C", 0, [0], tuning, config);
      expect(result.width).toBe(120);
    });

    it("should create valid VexFlow note objects", () => {
      const result = calculateScoreNotes("C", 0, [0], tuning, config);
      if (result.trebleNoteObj) {
        expect(result.trebleNoteObj.clef).toBe("treble");
        expect(result.trebleNoteObj.duration).toBe("w");
        expect(result.trebleNoteObj.stemDirection).toBe(1);
        expect(Array.isArray(result.trebleNoteObj.keys)).toBe(true);
      }
    });
  });

  describe("normalizeVexFlowKeys", () => {
    it("should normalize unicode accidentals", () => {
      const keys = ["c♯/4", "d♭/4"];
      const normalized = normalizeVexFlowKeys(keys);
      expect(normalized).toEqual(["c#/4", "db/4"]);
    });

    it("should convert to lowercase", () => {
      const keys = ["C/4", "D/4"];
      const normalized = normalizeVexFlowKeys(keys);
      expect(normalized).toEqual(["c/4", "d/4"]);
    });

    it("should handle mixed case and accidentals", () => {
      const keys = ["C#/4", "Db/4"];
      const normalized = normalizeVexFlowKeys(keys);
      expect(normalized).toEqual(["c#/4", "db/4"]);
    });

    it("should handle empty array", () => {
      const normalized = normalizeVexFlowKeys([]);
      expect(normalized).toEqual([]);
    });
  });

  describe("updateBoundsFromElements", () => {
    it("should update bounds from elements", () => {
      const mockElement1 = {
        getBBox: vi.fn().mockReturnValue({ x: 10, y: 20, width: 30, height: 40 }),
      };
      const mockElement2 = {
        getBBox: vi.fn().mockReturnValue({ x: 5, y: 15, width: 25, height: 35 }),
      };

      const elements = [mockElement1, mockElement2] as any;
      const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

      updateBoundsFromElements(elements, bounds);

      expect(bounds.minX).toBe(5);
      expect(bounds.minY).toBe(15);
      expect(bounds.maxX).toBe(40); // 10 + 30
      expect(bounds.maxY).toBe(60); // 20 + 40
    });

    it("should handle elements that throw errors", () => {
      const mockElement = {
        getBBox: vi.fn().mockImplementation(() => {
          throw new Error("getBBox failed");
        }),
      };

      const elements = [mockElement] as any;
      const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

      updateBoundsFromElements(elements, bounds);

      // Bounds should remain unchanged
      expect(bounds.minX).toBe(Infinity);
      expect(bounds.minY).toBe(Infinity);
      expect(bounds.maxX).toBe(-Infinity);
      expect(bounds.maxY).toBe(-Infinity);
    });
  });

  describe("applySvgCropping", () => {
    it("should apply cropping with valid bounds", () => {
      const svgEl = {
        setAttribute: vi.fn(),
      } as any;

      const bounds = { minX: 10, minY: 20, maxX: 40, maxY: 60 };

      applySvgCropping(svgEl, bounds, "Test Clef");

      expect(svgEl.setAttribute).toHaveBeenCalledWith("viewBox", "5 15 40 50");
      expect(svgEl.setAttribute).toHaveBeenCalledWith("width", "100%");
      expect(svgEl.setAttribute).toHaveBeenCalledWith("height", "100%");
    });

    it("should fallback to getBBox when bounds are invalid", () => {
      const svgEl = {
        setAttribute: vi.fn(),
        getBBox: vi.fn().mockReturnValue({ x: 5, y: 10, width: 20, height: 30 }),
      } as any;

      const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

      applySvgCropping(svgEl, bounds, "Test Clef");

      expect(svgEl.getBBox).toHaveBeenCalled();
      expect(svgEl.setAttribute).toHaveBeenCalledWith("viewBox", "-5 0 40 50");
    });
  });

  describe("createVexFlowConfig", () => {
    it("should create correct configuration", () => {
      const config = createVexFlowConfig("test-element", 200, 100);
      expect(config).toEqual({
        renderer: { elementId: "test-element", width: 200, height: 100 },
      });
    });
  });

  describe("isValidVexFlowNoteObject", () => {
    it("should validate correct note object", () => {
      const noteObj: VexFlowNoteObject = {
        keys: ["c/4", "d/4"],
        clef: "treble",
        duration: "w",
        stemDirection: 1,
      };
      expect(isValidVexFlowNoteObject(noteObj)).toBe(true);
    });

    it("should reject null object", () => {
      expect(isValidVexFlowNoteObject(null)).toBe(false);
    });

    it("should reject object with empty keys", () => {
      const noteObj: VexFlowNoteObject = {
        keys: [],
        clef: "treble",
        duration: "w",
        stemDirection: 1,
      };
      expect(isValidVexFlowNoteObject(noteObj)).toBe(false);
    });

    it("should reject object without keys", () => {
      const noteObj = {
        clef: "treble",
        duration: "w",
        stemDirection: 1,
      } as any;
      expect(isValidVexFlowNoteObject(noteObj)).toBe(false);
    });
  });

  describe("DEFAULT_SCORE_CONFIG", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_SCORE_CONFIG.trebleOctaveShift).toBe(12);
      expect(DEFAULT_SCORE_CONFIG.bassOctaveShift).toBe(12);
      expect(DEFAULT_SCORE_CONFIG.trebleRange).toEqual({ min: 40, max: 127 });
      expect(DEFAULT_SCORE_CONFIG.bassRange).toEqual({ min: 0, max: 91 });
      expect(DEFAULT_SCORE_CONFIG.scoreKey).toBe("C");
    });
  });
});
