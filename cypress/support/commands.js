// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// ===========================================
// Environment Detection
// ===========================================

// Check if running in CI environment using Cypress env
Cypress.Commands.add("isRunningInCI", () => {
  const ciValue = Cypress.env("CI");
  const isCI = ciValue === true || ciValue === "true";
  return cy.wrap(isCI);
});

// Helper function to conditionally skip tests in CI
Cypress.Commands.add("skipInCI", (testName, testFn) => {
  const shouldSkipInCI = Cypress.env("CI") === true || Cypress.env("CI") === "true";
  return (shouldSkipInCI ? it.skip : it)(testName, testFn);
});
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Helper functions to reduce duplication

// Helper for checkbox settings (enable/disable pattern)
function setCheckboxSetting(selector, enabled) {
  if (enabled) {
    cy.get(selector).check();
  } else {
    cy.get(selector).uncheck();
  }
}

// Helper for select settings (choose from dropdown)
function setSelectSetting(selector, value) {
  cy.get(selector).select(value.toString());
}

// Helper for verifying checkbox state
function shouldHaveCheckboxState(selector, expected) {
  if (expected) {
    cy.get(selector).should("be.checked");
  } else {
    cy.get(selector).should("not.be.checked");
  }
}

// Helper for verifying select value
function shouldHaveSelectValue(selector, expected) {
  cy.get(selector).should("have.value", expected.toString());
}

// Helper for clicking correct frets (parameterized by click function)
function clickCorrectFrets(clickFn) {
  cy.withCurrentQuizState(({ correctFrets, fretCount, stringIdx }) => {
    correctFrets.forEach((fret) => {
      if (fret < fretCount) {
        clickFn(stringIdx, fret);
      }
    });
  });
}

// Helper for clicking wrong frets (parameterized by click function)
function clickWrongFret(clickFn) {
  cy.withCurrentQuizState(({ correctFrets, fretCount, stringIdx }) => {
    cy.findWrongFret(correctFrets, fretCount).then((wrongFret) => {
      if (wrongFret >= 0 && wrongFret < fretCount) {
        clickFn(stringIdx, wrongFret);
        cy.wait(100);
      }
    });
  });
}

Cypress.Commands.add("visitApp", () => {
  const base = Cypress.config("baseUrl") || Cypress.env("baseUrl");
  if (base) {
    const baseStr = String(base);
    // If it's an absolute URL, visit it directly to avoid runner URL-resolution issues.
    if (/^https?:\/\//i.test(baseStr)) {
      cy.visit(baseStr);
      return;
    }

    // If base looks like a path, fall back to visiting root so Cypress will resolve against config.baseUrl
    cy.visit("/");
    return;
  }

  const port = Cypress.env("port");
  if (port) {
    cy.visit(`http://localhost:${port}/`);
    return;
  }

  // If we don't have a baseUrl or a port, fail fast with a helpful message
  throw new Error("visitApp: no baseUrl provided and Cypress.env('port') is not set — start the dev server or provide baseUrl");
});

Cypress.Commands.add("shouldHaveMainElementsVisible", () => {
  cy.shouldBeVisible(".container");
  cy.shouldBeVisible("#quiz-note-btn");
  cy.shouldBeVisible("#flashcard-string");
  cy.shouldBeVisible("#fretboard-area");
  cy.shouldBeVisible(".fret-buttons");
});

Cypress.Commands.add("shouldHaveInitialState", () => {
  cy.getQuizNote().should("match", /^[A-G]#?$/);
  cy.shouldHaveFlashcardNotContain("Start!");
});

Cypress.Commands.add("enableExtendedRange", () => {
  cy.get("#fret-count").select("24");
});

Cypress.Commands.add("shouldHaveSessionStarted", () => {
  cy.shouldHaveQuizNoteNotContain("?");
  cy.shouldHaveFlashcardNotContain("Start!");
  cy.waitForFretButtons();
});

Cypress.Commands.add("clickQuizButton", () => {
  cy.get("#quiz-note-btn").click();
});

Cypress.Commands.add("shouldDisplayNoteOnQuizButton", () => {
  cy.getQuizNote().should("match", /^[A-G]#?$/);
});

Cypress.Commands.add("getQuizNote", () => {
  // Prefer the machine-readable data-note attribute (stable for tests),
  // fall back to the visible text for compatibility.
  return cy.get("#quiz-note-btn").then(($el) => {
    const attr = $el.attr("data-note");
    if (attr !== undefined && attr !== null) {
      return cy.wrap(attr);
    }
    return cy.wrap($el.text());
  });
});

// Return raw data-note attribute (may be undefined)
Cypress.Commands.add("getQuizNoteAttr", () => {
  return cy.get("#quiz-note-btn").invoke("attr", "data-note");
});

// Quiz note assertion helpers
Cypress.Commands.add("shouldHaveQuizNoteExist", () => {
  cy.get("#quiz-note-btn").should("exist");
});

Cypress.Commands.add("shouldHaveQuizNoteVisible", () => {
  cy.get("#quiz-note-btn").should("be.visible");
});

Cypress.Commands.add("shouldHaveQuizNoteMachineReadable", () => {
  cy.getQuizNoteAttr().should("match", /^[A-G][b#]?$/);
});

// Return structured flashcard data: index (number|null), name|null, fretsCount (number|null), and the visible text
Cypress.Commands.add("getFlashcardData", () => {
  return cy.get("#flashcard-string").then(($el) => {
    const idx = $el.attr("data-string-index");
    const name = $el.attr("data-string-name");
    const frets = $el.attr("data-frets-count");
    return cy.wrap({
      index: idx !== undefined && idx !== null && !isNaN(parseInt(idx, 10)) ? parseInt(idx, 10) : null,
      name: name || null,
      fretsCount: frets !== undefined && frets !== null && !isNaN(parseInt(frets, 10)) ? parseInt(frets, 10) : null,
      text: $el.text(),
    });
  });
});

// Convenience: get numeric string index (parses data-string-index)
Cypress.Commands.add("getFlashcardStringIndex", () => {
  return cy
    .get("#flashcard-string")
    .invoke("attr", "data-string-index")
    .then((s) => (s === undefined || s === null ? null : parseInt(s, 10)));
});

Cypress.Commands.add("getFlashcardString", () => {
  return cy.get("#flashcard-string").invoke("text");
});

Cypress.Commands.add("getActiveStringIndex", () => {
  return cy
    .get(".fret-cell.active-string")
    .first()
    .invoke("attr", "data-string")
    .then((s) => parseInt(s));
});

Cypress.Commands.add("clickFretBtn", (fret) => {
  cy.get(`.fret-btn[data-fret="${fret}"]`).should("exist").click();
});

Cypress.Commands.add("clickFretCell", (stringIdx, fret) => {
  cy.get(`.fret-cell[data-string="${stringIdx}"][data-fret="${fret}"]`).click();
});

Cypress.Commands.add("shouldHaveFretBtnWrong", (fret) => {
  cy.get(`.fret-btn[data-fret="${fret}"]`).should("have.class", "wrong");
});

Cypress.Commands.add("shouldHaveFretCellWrong", (stringIdx, fret) => {
  cy.get(`.fret-cell[data-string="${stringIdx}"][data-fret="${fret}"]`).should("have.class", "fret-wrong");
});

Cypress.Commands.add("shouldHaveFlashcardNotContain", (text) => {
  cy.getFlashcardString().should("not.contain", text);
});

Cypress.Commands.add("shouldHaveQuizNoteNotContain", (text) => {
  cy.getQuizNote().should("not.contain", text);
});

Cypress.Commands.add("shouldBeVisible", (selector) => {
  cy.get(selector).should("be.visible");
});

// New custom commands for refactoring
Cypress.Commands.add("getCurrentNote", () => {
  return cy.get("#quiz-note-btn").invoke("attr", "data-note");
});

Cypress.Commands.add("getCurrentStringIndex", () => {
  // Read the string index from the flashcard DOM and return parsed value (may be null)
  return cy
    .get("#flashcard-string")
    .invoke("attr", "data-string-index")
    .then((idx) => {
      const parsed = parseInt(idx, 10);
      return isNaN(parsed) ? null : parsed;
    });
});

Cypress.Commands.add("calculateCorrectFrets", (note, stringIdx, fretCount) => {
  // Use the actual DOM-rendered open-note for the given string index to compute correct frets.
  // This avoids mismatches between test assumptions and app tuning/ordering.
  const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  // Ensure stringIdx is a number (tests may pass string)
  const sIdx = Number(stringIdx);

  // Find an example fret cell for this string to locate its table row, then read the .open-note text
  return cy
    .get(`.fret-cell[data-string="${sIdx}"]`)
    .first()
    .then(($cell) => {
      // Use jQuery to find the corresponding open-note cell in the same row
      const $row = $cell.closest("tr");
      const openNote = $row.find(".open-note").text().trim();

      const openIdx = allNotes.indexOf(openNote);
      if (openIdx === -1) {
        // Fallback: return empty array if we can't determine open note
        return cy.wrap([]);
      }

      const targetIdx = allNotes.indexOf(note);
      const correctFrets = [];
      for (let f = 0; f < fretCount; f++) {
        if ((openIdx + f) % 12 === targetIdx) correctFrets.push(f);
      }
      return cy.wrap(correctFrets);
    });
});

Cypress.Commands.add("findWrongFret", (correctFrets, maxFret) => {
  for (let i = 0; i < maxFret; i++) {
    if (!correctFrets.includes(i)) return cy.wrap(i);
  }
  return cy.wrap(-1);
});

Cypress.Commands.add("getCurrentFretCount", () => {
  return cy.get(".fret-btn").its("length");
});

// Helper command to execute callback with current quiz state (note, stringIdx, fretCount, correctFrets)
Cypress.Commands.add("withCurrentQuizState", (callback) => {
  cy.getCurrentNote().then((note) => {
    cy.getCurrentStringIndex().then((stringIdx) => {
      cy.getCurrentFretCount().then((fretCount) => {
        cy.calculateCorrectFrets(note, stringIdx, fretCount).then((correctFrets) => {
          callback({ note, stringIdx, fretCount, correctFrets });
        });
      });
    });
  });
});

Cypress.Commands.add("clickCorrectFretsForFretBtns", () => {
  clickCorrectFrets((stringIdx, fret) => {
    cy.clickFretBtn(fret);
  });
});

Cypress.Commands.add("clickWrongFretForFretBtns", () => {
  clickWrongFret((stringIdx, wrongFret) => {
    cy.clickFretBtn(wrongFret);
    cy.shouldHaveFretBtnWrong(wrongFret);
  });
});

Cypress.Commands.add("clickCorrectFretsForFretCells", () => {
  clickCorrectFrets((stringIdx, fret) => {
    cy.clickFretCell(stringIdx, fret);
  });
});

Cypress.Commands.add("clickWrongFretForFretCells", () => {
  clickWrongFret((stringIdx, wrongFret) => {
    cy.clickFretCell(stringIdx, wrongFret);
    cy.shouldHaveFretCellWrong(stringIdx, wrongFret);
  });
});

// Helper for table structure verification
function verifyTableStructure(columns, strings) {
  // total fret-cells = strings * columns
  cy.get(".fret-cell").should("have.length", strings * columns);
  // header labels count == columns
  cy.get(".fret-label").should("have.length", columns);
  // dot-cells count == columns
  cy.get(".fret-dot-cell").should("have.length", columns);
}

Cypress.Commands.add("gameShouldBePlayable", () => {
  // Fret buttons rounds
  cy.clickCorrectFretsForFretBtns();
  cy.clickQuizButton();
  cy.clickWrongFretForFretBtns();
  cy.clickCorrectFretsForFretBtns();

  // Fretboard cells rounds
  cy.clickQuizButton();
  cy.clickCorrectFretsForFretCells();
  cy.clickQuizButton();
  cy.clickWrongFretForFretCells();
  cy.clickCorrectFretsForFretCells();
});

// Settings manipulation commands
Cypress.Commands.add("setExtendedRange", (enabled) => {
  const value = enabled ? "24" : "11";
  setSelectSetting("#fret-count", value);
});

Cypress.Commands.add("setAccidentals", (enabled) => {
  setCheckboxSetting("#accidentals", enabled);
});

Cypress.Commands.add("setTimeoutSeconds", (seconds) => {
  setSelectSetting("#timeout-seconds", seconds);
});

// Fret count commands
Cypress.Commands.add("setFretCount", (fretCount) => {
  setSelectSetting("#fret-count", fretCount);
});

Cypress.Commands.add("shouldHaveFretCount", (expected) => {
  shouldHaveSelectValue("#fret-count", expected);
});

// Score notation helpers
Cypress.Commands.add("setScoreNotation", (enabled) => {
  setCheckboxSetting("#show-score-notation", enabled);
});

Cypress.Commands.add("shouldHaveScoreNotation", (expected) => {
  if (expected) {
    cy.get("#show-score-notation").should("be.checked");
    cy.get("#score-key-row").should("be.visible");
  } else {
    cy.get("#show-score-notation").should("not.be.checked");
  }
});

Cypress.Commands.add("setNumStrings", (num) => {
  setSelectSetting("#num-strings", num);
});

Cypress.Commands.add("setStringTuning", (stringIndex, note) => {
  const zeroBasedIndex = stringIndex - 1;
  setSelectSetting(`.tuning-select[data-string="${zeroBasedIndex}"]`, note);
});

Cypress.Commands.add("clickResetTuning", () => {
  cy.get("#reset-tuning").click();
});

Cypress.Commands.add("appScreenshot", () => {
  const name = "app-screenshot-auto";
  const viewportWidth = 800;
  const viewportHeight = 1000;

  cy.viewport(viewportWidth, viewportHeight);

  cy.screenshot(name, {
    overwrite: true,
    clip: { x: 0, y: 75, height: 680, width: 800 },
  });

  cy.wait(500); // Wait a bit to ensure screenshot is saved
});

// Settings verification commands
Cypress.Commands.add("shouldHaveExtendedRange", (expected) => {
  const value = expected ? "24" : "11";
  shouldHaveSelectValue("#fret-count", value);
});

Cypress.Commands.add("shouldHaveAccidentals", (expected) => {
  shouldHaveCheckboxState("#accidentals", expected);
});

Cypress.Commands.add("shouldHaveTimeoutSeconds", (expected) => {
  shouldHaveSelectValue("#timeout-seconds", expected);
});

Cypress.Commands.add("shouldHaveNumStrings", (expected) => {
  shouldHaveSelectValue("#num-strings", expected);
});

Cypress.Commands.add("shouldHaveStringTuning", (stringIndex, expectedNote) => {
  const zeroBasedIndex = stringIndex - 1;
  cy.get(`.tuning-select[data-string="${zeroBasedIndex}"]`).should("have.value", expectedNote);
});

// Reload page command
Cypress.Commands.add("reloadAndVisitApp", () => {
  cy.reload();
  cy.visitApp();
});

// Check string doesn't exist in flashcard
Cypress.Commands.add("shouldNotSuggestString", (stringIndex) => {
  cy.getFlashcardString().should("not.contain", `${stringIndex + 1}`);
});

// Wait for fret buttons to be generated
Cypress.Commands.add("waitForFretButtons", () => {
  cy.get(".fret-btn").should("have.length.greaterThan", 0);
});

Cypress.Commands.add("allowUItotSettle", () => {
  cy.wait(50);
});

// Check for 12th fret marker (double dots) in default mode (extra column)
Cypress.Commands.add("shouldHave12thFretMarkerInDefault", () => {
  // In default mode, the last .fret-dot-cell should have double dots
  cy.get(".fret-dot-cell").last().find(".fret-dot.double").should("exist");
  // Ensure the extra fret cell is hidden
  cy.get(".fret-cell").last().should("have.css", "visibility", "hidden");
  // Ensure the extra header is hidden
  cy.get(".fret-label").last().should("have.css", "visibility", "hidden");
});

// Check for 12th fret marker in extended mode (within range)
Cypress.Commands.add("shouldHave12thFretMarkerInExtended", () => {
  // In extended mode, f=12 is at index 12 (0-based, after open)
  cy.get(".fret-dot-cell").eq(12).find(".fret-dot.double").should("exist");
});

// Verify table structure and hidden elements in default mode
Cypress.Commands.add("shouldHaveCorrectTableStructureInDefault", () => {
  // columns = fretCount + extraFret => 12 + 1 = 13
  const columnsDefault = 13;
  const stringsDefault = 6;
  verifyTableStructure(columnsDefault, stringsDefault);
});

// Verify table structure in extended mode
Cypress.Commands.add("shouldHaveCorrectTableStructureInExtended", () => {
  // columns = fretCount (25) in extended mode
  const columnsExtended = 25;
  const stringsExtended = 6;
  verifyTableStructure(columnsExtended, stringsExtended);
});

// Validate that the current quiz produces the expected number of notes for a given fret mode
Cypress.Commands.add("shouldHaveExpectedNoteCount", (minNotes, maxNotes, fretMode) => {
  cy.withCurrentQuizState(({ correctFrets }) => {
    expect(correctFrets.length).to.be.at.least(minNotes, `Expected at least ${minNotes} note(s) for ${fretMode} fret mode, got ${correctFrets.length}`);
    expect(correctFrets.length).to.be.at.most(maxNotes, `Expected at most ${maxNotes} note(s) for ${fretMode} fret mode, got ${correctFrets.length}`);
  });
});

// Test multiple rounds of quiz to ensure note count expectations are consistent
Cypress.Commands.add("shouldConsistentlyHaveExpectedNoteCount", (minNotes, maxNotes, fretMode, rounds = 5) => {
  for (let i = 0; i < rounds; i++) {
    cy.clickQuizButton();
    cy.shouldHaveExpectedNoteCount(minNotes, maxNotes, fretMode);
  }
});

// UI element verification commands
Cypress.Commands.add("shouldHaveFretButtonCount", (expectedCount) => {
  cy.get(".fret-btn").should("have.length", expectedCount);
});

Cypress.Commands.add("shouldHaveFretMarkerAtPosition", (position) => {
  cy.get(".fret-dot-cell").eq(position).find(".fret-dot.double").should("exist");
});

Cypress.Commands.add("shouldHaveLastFretCellHidden", () => {
  cy.get(".fret-cell").last().should("have.css", "visibility", "hidden");
});

// Audio/TTS test commands
Cypress.Commands.add("getTestState", () => {
  return cy.get("#test-state").then(($state) => {
    const audioEnabled = $state.find("#audio-enabled").attr("data-enabled");
    const ttsEnabled = $state.find("#tts-enabled").attr("data-enabled");
    const ttsInitialized = $state.find("#tts-initialized").attr("data-initialized");
    const selectedVoice = $state.find("#selected-voice").attr("data-voice");
    const ttsQueueLength = $state.find("#tts-queue-length").attr("data-length");
    const ttsCurrentlyPlaying = $state.find("#tts-currently-playing").attr("data-playing");
    const utteranceLog = JSON.parse($state.find("#utterance-log").attr("data-log") || "[]");

    return cy.wrap({
      audioEnabled,
      ttsEnabled,
      ttsInitialized,
      selectedVoice,
      ttsQueueLength,
      ttsCurrentlyPlaying,
      utteranceLog,
    });
  });
});

Cypress.Commands.add("enableTTS", () => {
  cy.get("#enable-tts").check();
});

Cypress.Commands.add("disableTTS", () => {
  cy.get("#enable-tts").uncheck();
});

Cypress.Commands.add("selectVoice", (voiceName) => {
  cy.get("#voice-select").select(voiceName);
});

Cypress.Commands.add("shouldHaveTTSEnabled", (enabled) => {
  cy.getTestState().then((state) => {
    expect(state.ttsEnabled).to.equal(enabled.toString());
  });
});

Cypress.Commands.add("shouldHaveAudioEnabled", (enabled) => {
  cy.getTestState().then((state) => {
    expect(state.audioEnabled).to.equal(enabled.toString());
  });
});

Cypress.Commands.add("shouldHaveTTSInitialized", (initialized) => {
  cy.getTestState().then((state) => {
    expect(state.ttsInitialized).to.equal(initialized.toString());
  });
});

Cypress.Commands.add("shouldHaveSelectedVoice", (voice) => {
  cy.getTestState().then((state) => {
    expect(state.selectedVoice).to.equal(voice);
  });
});

Cypress.Commands.add("shouldHaveTTSQueueLength", (length) => {
  cy.getTestState().then((state) => {
    expect(parseInt(state.ttsQueueLength)).to.equal(length);
  });
});

Cypress.Commands.add("shouldHaveUtteranceLogLength", (length) => {
  cy.getTestState().then((state) => {
    expect(state.utteranceLog).to.have.length(length);
  });
});

Cypress.Commands.add("shouldHaveUtteranceInLog", (expectedText) => {
  cy.getTestState().then((state) => {
    expect(state.utteranceLog).to.include(expectedText);
  });
});

Cypress.Commands.add("shouldHaveUtteranceMatching", (pattern) => {
  cy.getTestState().then((state) => {
    expect(state.utteranceLog.some((utterance) => new RegExp(pattern).test(utterance))).to.be.true;
  });
});

Cypress.Commands.add("waitForTTSQueueToEmpty", () => {
  cy.getTestState().then((state) => {
    if (parseInt(state.ttsQueueLength) > 0) {
      cy.wait(100);
      cy.waitForTTSQueueToEmpty();
    }
  });
});

Cypress.Commands.add("waitForTTSQueueToHaveLength", (expectedLength) => {
  cy.getTestState().then((state) => {
    if (parseInt(state.ttsQueueLength) !== expectedLength) {
      cy.wait(100);
      cy.waitForTTSQueueToHaveLength(expectedLength);
    }
  });
});

// ===========================================
// Accessibility Testing Commands
// ===========================================

// Custom command to simulate Tab key navigation
Cypress.Commands.add("tab", { prevSubject: "element" }, (subject) => {
  cy.wrap(subject).trigger("keydown", { key: "Tab" });
});

// Custom command to check if element is focused
Cypress.Commands.add("shouldBeFocused", { prevSubject: "element" }, (subject) => {
  cy.wrap(subject).should("be.focused");
});

// Custom command to check ARIA attributes
Cypress.Commands.add("shouldHaveAriaAttribute", { prevSubject: "element" }, (subject, attribute, value) => {
  if (value) {
    cy.wrap(subject).should("have.attr", attribute, value);
  } else {
    cy.wrap(subject).should("have.attr", attribute);
  }
});

// Custom command to check if element has proper focus styles
Cypress.Commands.add("shouldHaveFocusStyles", { prevSubject: "element" }, (subject) => {
  cy.wrap(subject).should("have.css", "outline");
});

// Custom command to test keyboard navigation sequence
Cypress.Commands.add("testKeyboardNavigation", (selectors) => {
  selectors.forEach((selector, index) => {
    cy.get("body").tab();
    cy.focused().should("match", selector);
  });
});

// Custom command to check screen reader only content
Cypress.Commands.add("shouldHaveScreenReaderContent", (selector, expectedText) => {
  cy.get(selector).should("have.class", "sr-only");
  if (expectedText) {
    cy.get(selector).should("contain", expectedText);
  }
});

// Custom command to check live regions
Cypress.Commands.add("shouldHaveLiveRegion", (selector, politeness = "polite") => {
  cy.get(selector).should("have.attr", "aria-live", politeness);
});

// Custom command to check form control accessibility
Cypress.Commands.add("shouldHaveFormAccessibility", (controlSelector) => {
  cy.get(controlSelector).then(($control) => {
    const id = $control.attr("id");
    if (id) {
      // Check for associated label
      cy.get(`label[for="${id}"]`).should("exist");

      // Check for aria-describedby if it exists
      const describedBy = $control.attr("aria-describedby");
      if (describedBy) {
        cy.get(`#${describedBy}`).should("exist");
      }
    }
  });
});

// Custom command to test color contrast (basic check)
Cypress.Commands.add("shouldHaveGoodContrast", { prevSubject: "element" }, (subject) => {
  cy.wrap(subject).then(($el) => {
    const styles = window.getComputedStyle($el[0]);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // This is a basic check - in a real scenario you'd use a proper contrast checking library
    expect(color).to.not.equal("rgba(0, 0, 0, 0)"); // Not transparent
    expect(backgroundColor).to.not.equal("rgba(0, 0, 0, 0)"); // Not transparent
  });
});

// Custom command to check if element is accessible to screen readers
Cypress.Commands.add("shouldBeScreenReaderAccessible", { prevSubject: "element" }, (subject) => {
  cy.wrap(subject).then(($el) => {
    const ariaHidden = $el.attr("aria-hidden");
    const role = $el.attr("role");
    const tabindex = $el.attr("tabindex");

    // Element should not be hidden from screen readers unless it's decorative
    if (ariaHidden === "true") {
      // If hidden, it should be decorative (like emojis)
      expect($el.text().length).to.be.lessThan(10); // Likely decorative
    } else {
      // If not hidden, should have accessible content
      const hasText = $el.text().trim().length > 0;
      const hasAriaLabel = $el.attr("aria-label");
      const hasRole = role;

      expect(hasText || hasAriaLabel || hasRole).to.be.true;
    }
  });
});
