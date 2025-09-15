// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
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
