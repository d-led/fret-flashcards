import { describe, it, expect, beforeEach, vi } from "vitest";
import { FretboardRenderer, FretboardConfig, StringInfo, FretboardRenderOptions } from "../src/ts/modules/fretboardRenderer";

// Mock jQuery
const mockJQuery = (html: string) => ({
  html: vi.fn().mockImplementation((content?: string) => {
    if (content !== undefined) {
      html = content;
    }
    return html;
  }),
});

// Mock DOM elements for testing
const createMockContainer = () => mockJQuery("");

describe("FretboardRenderer", () => {
  let renderer: FretboardRenderer;
  let mockContainer: ReturnType<typeof createMockContainer>;
  let defaultStringNames: StringInfo[];
  let defaultConfig: FretboardConfig;

  beforeEach(() => {
    renderer = new FretboardRenderer();
    mockContainer = createMockContainer();

    defaultStringNames = [
      { name: "1st", openNote: "E", midi: 64 },
      { name: "2nd", openNote: "B", midi: 59 },
      { name: "3rd", openNote: "G", midi: 55 },
      { name: "4th", openNote: "D", midi: 50 },
      { name: "5th", openNote: "A", midi: 45 },
      { name: "6th", openNote: "E", midi: 40 },
    ];

    defaultConfig = {
      fretCount: 12,
      fretCountSetting: 11,
      stringErrorCounts: [0, 0, 0, 0, 0, 0],
      typicalFretMarks: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
      doubleFretMarkers: [12, 24],
    };
  });

  describe("renderFretboard", () => {
    it("should render a basic fretboard", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      expect(mockContainer.html).toHaveBeenCalled();
      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain("fretboard-table");
      expect(html).toContain("open-note");
      expect(html).toContain("fret-cell");
    });

    it("should highlight the correct string", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 2,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain('class="fret-cell active-string"');
    });

    it("should mark found frets", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [3, 5],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain('class="fret-cell active-string fret-found"');
    });

    it("should include error counts in tooltips", () => {
      const configWithErrors = {
        ...defaultConfig,
        stringErrorCounts: [2, 0, 1, 0, 3, 0],
      };

      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: configWithErrors,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain('title="wrong: 2"');
      expect(html).toContain('title="wrong: 0"');
      expect(html).toContain('title="wrong: 1"');
    });
  });

  describe("generateFretboardHtml", () => {
    it("should generate correct number of string rows", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      // Count opening <tr> tags (each row has one opening tag)
      const stringRows = (html.match(/<tr[^>]*>/g) || []).length;
      expect(stringRows).toBe(defaultStringNames.length + 2); // +2 for marker row and header row
    });

    it("should generate correct number of fret columns", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      const fretCells = (html.match(/fret-cell/g) || []).length;
      const expectedCells = defaultStringNames.length * (defaultConfig.fretCount + 1); // +1 for extra fret
      expect(fretCells).toBe(expectedCells);
    });
  });

  describe("generateFretMarkerRow", () => {
    it("should generate fret markers for basic mode", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain("fretboard-mark-row");
      expect(html).toContain("fret-dot");
    });

    it("should generate double markers for 12th fret", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain("fret-dot double");
      expect(html).toContain("dot dot1");
      expect(html).toContain("dot dot2");
    });

    it("should handle extended range mode", () => {
      const extendedConfig = {
        ...defaultConfig,
        fretCount: 25,
        fretCountSetting: 24,
      };

      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: extendedConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain("fretboard-mark-row");
      // Should have more fret markers for extended range
      const fretDots = (html.match(/fret-dot/g) || []).length;
      expect(fretDots).toBeGreaterThan(0);
    });
  });

  describe("generateHeaderRow", () => {
    it("should generate fret number headers", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain("fretboard-header");
      expect(html).toContain("fret-label");

      // Should have fret numbers 0-11
      for (let i = 0; i < 12; i++) {
        expect(html).toContain(`>${i}<`);
      }
    });
  });

  describe("createDefaultConfig", () => {
    it("should create a valid default configuration", () => {
      const config = FretboardRenderer.createDefaultConfig();

      expect(config.fretCount).toBe(12);
      expect(config.fretCountSetting).toBe(11);
      expect(Array.isArray(config.stringErrorCounts)).toBe(true);
      expect(Array.isArray(config.typicalFretMarks)).toBe(true);
      expect(Array.isArray(config.doubleFretMarkers)).toBe(true);
      expect(config.typicalFretMarks).toContain(3);
      expect(config.typicalFretMarks).toContain(12);
      expect(config.doubleFretMarkers).toContain(12);
      expect(config.doubleFretMarkers).toContain(24);
    });
  });

  describe("updateConfig", () => {
    it("should update configuration with partial values", () => {
      const partialConfig = {
        fretCount: 25,
        fretCountSetting: 24,
      };

      const updatedConfig = renderer.updateConfig(partialConfig);

      expect(updatedConfig.fretCount).toBe(25);
      expect(updatedConfig.fretCountSetting).toBe(24);
      expect(updatedConfig.stringErrorCounts).toEqual([]); // Should keep default
    });

    it("should preserve existing values when updating", () => {
      const existingConfig = {
        fretCount: 12,
        fretCountSetting: 11,
        stringErrorCounts: [1, 2, 3],
        typicalFretMarks: [3, 5, 7],
        doubleFretMarkers: [12],
      };

      const updatedConfig = renderer.updateConfig(existingConfig);

      expect(updatedConfig).toEqual(existingConfig);
    });
  });

  describe("edge cases", () => {
    it("should handle empty string names array", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 0,
        foundFrets: [],
        stringNames: [],
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain("fretboard-table");
      // Should still have header and marker rows
      expect(html).toContain("fretboard-header");
      expect(html).toContain("fretboard-mark-row");
    });

    it("should handle negative highlight string index", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: -1,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain("fretboard-table");
      // Should not have any active-string classes
      expect(html).not.toContain("active-string");
    });

    it("should handle out-of-bounds highlight string index", () => {
      const options: FretboardRenderOptions = {
        highlightStringIdx: 999,
        foundFrets: [],
        stringNames: defaultStringNames,
        config: defaultConfig,
      };

      renderer.renderFretboard(mockContainer as any, options);

      const html = mockContainer.html.mock.calls[0][0];
      expect(html).toContain("fretboard-table");
      // Should not have any active-string classes
      expect(html).not.toContain("active-string");
    });
  });
});
