/**
 * Fretboard Rendering Module
 * Handles all fretboard table rendering and fret marker logic
 * Follows Single Responsibility Principle - only manages fretboard visualization
 */

export interface StringInfo {
  name: string;
  openNote: string;
  midi: number;
}

export interface FretboardConfig {
  fretCount: number;
  fretCountSetting: number;
  stringErrorCounts: number[];
  typicalFretMarks: number[];
  doubleFretMarkers: number[];
}

export interface FretboardRenderOptions {
  highlightStringIdx: number;
  foundFrets: number[];
  stringNames: StringInfo[];
  config: FretboardConfig;
}

export class FretboardRenderer {
  /**
   * Render a fretboard table with the given configuration
   * @param container - jQuery element to render the fretboard into
   * @param options - Configuration options for the fretboard
   */
  public renderFretboard(container: JQuery, options: FretboardRenderOptions): void {
    const { highlightStringIdx, foundFrets, stringNames, config } = options;

    const tableHtml = this.generateFretboardHtml(highlightStringIdx, foundFrets, stringNames, config);
    container.html(tableHtml);
  }

  /**
   * Generate the HTML for the fretboard table
   * @param highlightStringIdx - Index of the string to highlight
   * @param foundFrets - Array of fret positions that have been found
   * @param stringNames - Array of string information
   * @param config - Fretboard configuration
   * @returns HTML string for the fretboard table
   */
  private generateFretboardHtml(highlightStringIdx: number, foundFrets: number[], stringNames: StringInfo[], config: FretboardConfig): string {
    const { fretCount, fretCountSetting, stringErrorCounts, typicalFretMarks, doubleFretMarkers } = config;

    const extraFret = fretCountSetting > 11 ? 0 : 1; // Add extra column for 12th fret marker in default mode (visual only)

    // Generate string rows
    const fretRows = this.generateStringRows(highlightStringIdx, foundFrets, stringNames, fretCount, extraFret, stringErrorCounts);

    // Generate fret marker row
    const markRow = this.generateFretMarkerRow(fretCount, extraFret, fretCountSetting, typicalFretMarks, doubleFretMarkers);

    // Generate header row
    const headerRow = this.generateHeaderRow(fretCount, extraFret);

    return `<table class="fretboard-table"><thead>${headerRow}</thead><tbody>${fretRows}${markRow}</tbody></table>`;
  }

  /**
   * Generate the string rows for the fretboard
   */
  private generateStringRows(highlightStringIdx: number, foundFrets: number[], stringNames: StringInfo[], fretCount: number, extraFret: number, stringErrorCounts: number[]): string {
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
          if (foundFrets.includes(f)) fretClass += " fret-found";
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

    return fretRows;
  }

  /**
   * Generate the fret marker row (dots)
   */
  private generateFretMarkerRow(fretCount: number, extraFret: number, fretCountSetting: number, typicalFretMarks: number[], doubleFretMarkers: number[]): string {
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
    return markRow;
  }

  /**
   * Generate the header row with fret numbers
   */
  private generateHeaderRow(fretCount: number, extraFret: number): string {
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
    return headerRow;
  }

  /**
   * Create a default fretboard configuration
   */
  public static createDefaultConfig(): FretboardConfig {
    return {
      fretCount: 12,
      fretCountSetting: 11,
      stringErrorCounts: [],
      typicalFretMarks: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
      doubleFretMarkers: [12, 24],
    };
  }

  /**
   * Update the fretboard configuration
   */
  public updateConfig(config: Partial<FretboardConfig>): FretboardConfig {
    const defaultConfig = FretboardRenderer.createDefaultConfig();
    return { ...defaultConfig, ...config };
  }
}
