describe("Guitar Fretboard Flashcard Game", () => {
  beforeEach(() => {
    // Reset local storage before each test to ensure consistent initial state
    cy.clearLocalStorage();
    // Visit the app first to load the page
    cy.visitApp();
    // Set timeout to 0 seconds to avoid race conditions in tests
    cy.setTimeoutSeconds(0);
  });

  it("app start-up", () => {
    cy.shouldHaveSessionStarted();
    cy.shouldHaveMainElementsVisible();
    cy.shouldHaveInitialState();
  });

  it("plays a note when quiz button is clicked", () => {
    cy.enableExtendedRange();
    cy.clickQuizButton();
    cy.shouldDisplayNoteOnQuizButton();
  });

  it("game should be playable in normal range", () => {
    cy.gameShouldBePlayable();
  });

  it("game should be playable in extended range", () => {
    cy.enableExtendedRange();
    cy.gameShouldBePlayable();
  });

  it("settings should persist after page reload", () => {
    // Change various settings
    cy.setExtendedRange(true);
    cy.setAccidentals(true);
    cy.setTimeoutSeconds(5);
    cy.setNumStrings(4);

    // Reload the page
    cy.reloadAndVisitApp();

    // Ensure settings are preserved
    cy.shouldHaveExtendedRange(true);
    cy.shouldHaveAccidentals(true);
    cy.shouldHaveTimeoutSeconds(5);
    cy.shouldHaveNumStrings(4);

    // Check the game still works with new settings
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();
  });

  it("should work with different tunings", () => {
    // Change some string tunings
    cy.setStringTuning(1, "F");
    cy.setStringTuning(2, "C");
    cy.setStringTuning(3, "A");
    cy.allowUItotSettle(); // Wait for UI to update

    // Check tunings are set
    cy.shouldHaveStringTuning(1, "F");
    cy.shouldHaveStringTuning(2, "C");
    cy.shouldHaveStringTuning(3, "A");

    // Check the game still works with custom tuning
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();
  });

  it("should work with different number of strings", () => {
    // Test 4 strings
    cy.setNumStrings(4);
    cy.allowUItotSettle(); // Wait for UI to update
    cy.shouldHaveNumStrings(4);
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Test 3 strings
    cy.setNumStrings(3);
    cy.allowUItotSettle(); // Wait for UI to update
    cy.shouldHaveNumStrings(3);
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Test 7 strings
    cy.setNumStrings(7);
    cy.allowUItotSettle(); // Wait for UI to update
    cy.shouldHaveNumStrings(7);
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Reset to 6 strings
    cy.setNumStrings(6);
    cy.allowUItotSettle(); // Wait for UI to update
    cy.shouldHaveNumStrings(6);
  });

  it("should work with different fret ranges", () => {
    // Test normal range (12 frets)
    cy.setExtendedRange(false);
    cy.shouldHaveExtendedRange(false);
    cy.allowUItotSettle(); // Wait for UI to update
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Test extended range (25 frets)
    cy.setExtendedRange(true);
    cy.shouldHaveExtendedRange(true);
    cy.allowUItotSettle(); // Wait for UI to update
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Test switching back to normal range
    cy.setExtendedRange(false);
    cy.shouldHaveExtendedRange(false);
    cy.allowUItotSettle(); // Wait for UI to update
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();
  });

  it("reset tuning should restore 6 string standard tuning", () => {
    // First change some settings
    cy.setNumStrings(4);
    cy.setStringTuning(1, "F");
    cy.setStringTuning(2, "C");
    cy.allowUItotSettle(); // Wait for UI to update

    // Check changes
    cy.shouldHaveNumStrings(4);
    cy.shouldHaveStringTuning(1, "F");
    cy.shouldHaveStringTuning(2, "C");

    // Click reset tuning
    cy.clickResetTuning();
    cy.allowUItotSettle(); // Wait for UI to update

    // Check reset to 6 strings standard tuning
    cy.shouldHaveNumStrings(6);
    cy.shouldHaveStringTuning(1, "E");
    cy.shouldHaveStringTuning(2, "B");
    cy.shouldHaveStringTuning(3, "G");
    cy.shouldHaveStringTuning(4, "D");
    cy.shouldHaveStringTuning(5, "A");
    cy.shouldHaveStringTuning(6, "E");

    // Check game still works
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();
  });

  it("should not suggest strings that don't exist", () => {
    // Set to 3 strings
    cy.setNumStrings(3);
    cy.allowUItotSettle(); // Wait for UI to update
    cy.shouldHaveNumStrings(3);

    // Play multiple rounds and check no string beyond 3rd is suggested
    for (let i = 0; i < 5; i++) {
      cy.clickQuizButton();
      cy.getFlashcardString().then((text) => {
        // Should not contain "4th", "5th", "6th", etc.
        expect(text).not.to.match(/^(4th|5th|6th|7th|8th|9th|10th|11th|12th)/);
      });
      cy.gameShouldBePlayable();
    }
  });

  it("should show 12th fret marker in default mode", () => {
    cy.setExtendedRange(false);
    cy.allowUItotSettle();
    cy.shouldHaveCorrectTableStructureInDefault();
    cy.shouldHave12thFretMarkerInDefault();
    // Verify game still works (no extra playable frets)
    cy.gameShouldBePlayable();
  });

  it("should show 12th fret marker in extended mode", () => {
    cy.setExtendedRange(true);
    cy.allowUItotSettle();
    cy.shouldHaveCorrectTableStructureInExtended();
    cy.shouldHave12thFretMarkerInExtended();
    // Verify game still works
    cy.gameShouldBePlayable();
  });
});
