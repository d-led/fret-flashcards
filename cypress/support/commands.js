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
  throw new Error(
    "visitApp: no baseUrl provided and Cypress.env('port') is not set — start the dev server or provide baseUrl"
  );
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
  cy.get("#extended-range").check();
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

Cypress.Commands.add("clickCorrectFretsForFretBtns", () => {
  cy.getCurrentNote().then((note) => {
    cy.getCurrentStringIndex().then((stringIdx) => {
      cy.getCurrentFretCount().then((fretCount) => {
        cy.calculateCorrectFrets(note, stringIdx, fretCount).then((correctFrets) => {
          correctFrets.forEach((fret) => {
            if (fret < fretCount) {
              cy.clickFretBtn(fret);
            }
          });
        });
      });
    });
  });
});

Cypress.Commands.add("clickWrongFretForFretBtns", () => {
  cy.getCurrentNote().then((note) => {
    cy.getCurrentStringIndex().then((stringIdx) => {
      cy.getCurrentFretCount().then((fretCount) => {
        cy.calculateCorrectFrets(note, stringIdx, fretCount).then((correctFrets) => {
          cy.findWrongFret(correctFrets, fretCount).then((wrongFret) => {
            if (wrongFret >= 0 && wrongFret < fretCount) {
              cy.clickFretBtn(wrongFret);
              cy.wait(100);
              cy.shouldHaveFretBtnWrong(wrongFret);
            }
          });
        });
      });
    });
  });
});

Cypress.Commands.add("clickCorrectFretsForFretCells", () => {
  cy.getQuizNote().then((note) => {
    cy.getActiveStringIndex().then((stringIdx) => {
      cy.getCurrentFretCount().then((fretCount) => {
        cy.calculateCorrectFrets(note, stringIdx, fretCount).then((correctFrets) => {
          correctFrets.forEach((fret) => {
            if (fret < fretCount) {
              cy.clickFretCell(stringIdx, fret);
            }
          });
        });
      });
    });
  });
});

Cypress.Commands.add("clickWrongFretForFretCells", () => {
  cy.getQuizNote().then((note) => {
    cy.getActiveStringIndex().then((stringIdx) => {
      cy.getCurrentFretCount().then((fretCount) => {
        cy.calculateCorrectFrets(note, stringIdx, fretCount).then((correctFrets) => {
          cy.findWrongFret(correctFrets, fretCount).then((wrongFret) => {
            if (wrongFret >= 0 && wrongFret < fretCount) {
              cy.clickFretCell(stringIdx, wrongFret);
              cy.wait(100);
              cy.shouldHaveFretCellWrong(stringIdx, wrongFret);
            }
          });
        });
      });
    });
  });
});

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
  if (enabled) {
    cy.get("#extended-range").check();
  } else {
    cy.get("#extended-range").uncheck();
  }
});

Cypress.Commands.add("setAccidentals", (enabled) => {
  if (enabled) {
    cy.get("#accidentals").check();
  } else {
    cy.get("#accidentals").uncheck();
  }
});

Cypress.Commands.add("setTimeoutSeconds", (seconds) => {
  cy.get("#timeout-seconds").select(seconds.toString());
});

// Score notation helpers
Cypress.Commands.add("setScoreNotation", (enabled) => {
  if (enabled) {
    cy.get("#show-score-notation").check();
  } else {
    cy.get("#show-score-notation").uncheck();
  }
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
  cy.get("#num-strings").select(num.toString());
});

Cypress.Commands.add("setStringTuning", (stringIndex, note) => {
  const zeroBasedIndex = stringIndex - 1;
  cy.get(`.tuning-select[data-string="${zeroBasedIndex}"]`).select(note);
});

Cypress.Commands.add("clickResetTuning", () => {
  cy.get("#reset-tuning").click();
});

// Settings verification commands
Cypress.Commands.add("shouldHaveExtendedRange", (expected) => {
  if (expected) {
    cy.get("#extended-range").should("be.checked");
  } else {
    cy.get("#extended-range").should("not.be.checked");
  }
});

Cypress.Commands.add("shouldHaveAccidentals", (expected) => {
  if (expected) {
    cy.get("#accidentals").should("be.checked");
  } else {
    cy.get("#accidentals").should("not.be.checked");
  }
});

Cypress.Commands.add("shouldHaveTimeoutSeconds", (expected) => {
  cy.get("#timeout-seconds").should("have.value", expected.toString());
});

Cypress.Commands.add("shouldHaveNumStrings", (expected) => {
  cy.get("#num-strings").should("have.value", expected.toString());
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
  // total fret-cells = strings * columns
  cy.get(".fret-cell").should("have.length", stringsDefault * columnsDefault);
  // header labels count == columns
  cy.get(".fret-label").should("have.length", columnsDefault);
  // dot-cells count == columns
  cy.get(".fret-dot-cell").should("have.length", columnsDefault);
});

// Verify table structure in extended mode
Cypress.Commands.add("shouldHaveCorrectTableStructureInExtended", () => {
  // columns = fretCount (25) in extended mode
  const columnsExtended = 25;
  const stringsExtended = 6;
  // total fret-cells = strings * columns
  cy.get(".fret-cell").should("have.length", stringsExtended * columnsExtended);
  // header labels count == columns
  cy.get(".fret-label").should("have.length", columnsExtended);
  // dot-cells count == columns
  cy.get(".fret-dot-cell").should("have.length", columnsExtended);
});
