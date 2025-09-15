describe("Fret Range Functionality", () => {
  beforeEach(() => {
    // Reset local storage before each test to ensure consistent initial state
    cy.clearLocalStorage();
    // Visit the app first to load the page
    cy.visitApp();
    // Set timeout to 0 seconds to avoid race conditions in tests
    cy.setTimeoutSeconds(0);
  });

  it("should handle 12 frets (0-11) mode correctly", () => {
    cy.setFretCount(11);
    cy.shouldHaveFretCount(11);
    cy.allowUItotSettle();

    // Should have session started and game playable
    cy.shouldHaveSessionStarted();
    cy.shouldHaveMainElementsVisible();

    // Should show 12th fret marker in this special mode
    cy.shouldHaveCorrectTableStructureInDefault();
    cy.shouldHave12thFretMarkerInDefault();

    // Game should be playable
    cy.gameShouldBePlayable();

    // Should have exactly 1 note expected for any given quiz
    cy.shouldConsistentlyHaveExpectedNoteCount(1, 1, "11", 3);
  });

  it("should handle 21 frets mode correctly", () => {
    cy.setFretCount(21);
    cy.shouldHaveFretCount(21);
    cy.allowUItotSettle();

    // Should have session started and game playable
    cy.shouldHaveSessionStarted();
    cy.shouldHaveMainElementsVisible();
    cy.gameShouldBePlayable();

    // Should have 1-2 notes expected for any given quiz
    cy.shouldConsistentlyHaveExpectedNoteCount(1, 2, "21");
  });

  it("should handle 22 frets mode correctly", () => {
    cy.setFretCount(22);
    cy.shouldHaveFretCount(22);
    cy.allowUItotSettle();

    // Should have session started and game playable
    cy.shouldHaveSessionStarted();
    cy.shouldHaveMainElementsVisible();
    cy.gameShouldBePlayable();

    // Should have 1-2 notes expected for any given quiz
    cy.shouldConsistentlyHaveExpectedNoteCount(1, 2, "22");
  });

  it("should handle 24 frets mode correctly", () => {
    cy.setFretCount(24);
    cy.shouldHaveFretCount(24);
    cy.allowUItotSettle();

    // Should have session started and game playable
    cy.shouldHaveSessionStarted();
    cy.shouldHaveMainElementsVisible();
    cy.gameShouldBePlayable();

    // Should have 2-3 notes expected for any given quiz
    cy.shouldConsistentlyHaveExpectedNoteCount(2, 3, "24");
  });

  it("should switch between fret count modes correctly", () => {
    // Start with 11 frets
    cy.setFretCount(11);
    cy.shouldHaveFretCount(11);
    cy.allowUItotSettle();
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Switch to 21 frets
    cy.setFretCount(21);
    cy.shouldHaveFretCount(21);
    cy.allowUItotSettle();
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Switch to 24 frets
    cy.setFretCount(24);
    cy.shouldHaveFretCount(24);
    cy.allowUItotSettle();
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Switch back to 11 frets
    cy.setFretCount(11);
    cy.shouldHaveFretCount(11);
    cy.allowUItotSettle();
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();
  });

  it("should persist fret count setting after page reload", () => {
    // Set to 24 frets
    cy.setFretCount(24);
    cy.shouldHaveFretCount(24);
    cy.allowUItotSettle();

    // Reload the page
    cy.reloadAndVisitApp();

    // Should preserve the setting
    cy.shouldHaveFretCount(24);
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Set to 21 frets
    cy.setFretCount(21);
    cy.shouldHaveFretCount(21);
    cy.allowUItotSettle();

    // Reload again
    cy.reloadAndVisitApp();

    // Should preserve the new setting
    cy.shouldHaveFretCount(21);
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();
  });

  it("should show correct fret count in UI for each mode", () => {
    // Test 11 frets mode
    cy.setFretCount(11);
    cy.allowUItotSettle();
    cy.shouldHaveFretButtonCount(12); // 0-11 = 12 buttons

    // Test 21 frets mode
    cy.setFretCount(21);
    cy.allowUItotSettle();
    cy.shouldHaveFretButtonCount(22); // 0-21 = 22 buttons

    // Test 22 frets mode
    cy.setFretCount(22);
    cy.allowUItotSettle();
    cy.shouldHaveFretButtonCount(23); // 0-22 = 23 buttons

    // Test 24 frets mode
    cy.setFretCount(24);
    cy.allowUItotSettle();
    cy.shouldHaveFretButtonCount(25); // 0-24 = 25 buttons
  });

  it("should have correct fret markers in extended modes", () => {
    // Test 21 frets mode - should have 12th fret marker
    cy.setFretCount(21);
    cy.allowUItotSettle();
    // Should have 12th fret marker at position 12 (0-based)
    cy.shouldHaveFretMarkerAtPosition(12);

    // Test 24 frets mode - should have 12th and 24th fret markers
    cy.setFretCount(24);
    cy.allowUItotSettle();
    // Should have 12th fret marker at position 12 (0-based)
    cy.shouldHaveFretMarkerAtPosition(12);
    // Should have 24th fret marker at position 24 (0-based)
    cy.shouldHaveFretMarkerAtPosition(24);
  });

  it("should work correctly with different number of strings in each fret mode", () => {
    // Test 11 frets with different string counts
    cy.setFretCount(11);
    cy.setNumStrings(4);
    cy.allowUItotSettle();
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    cy.setNumStrings(7);
    cy.allowUItotSettle();
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Test 24 frets with different string counts
    cy.setFretCount(24);
    cy.setNumStrings(4);
    cy.allowUItotSettle();
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    cy.setNumStrings(8);
    cy.allowUItotSettle();
    cy.shouldHaveSessionStarted();
    cy.gameShouldBePlayable();

    // Reset to defaults
    cy.setFretCount(11);
    cy.setNumStrings(6);
    cy.allowUItotSettle();
  });

  // Test that the special behavior of 11 frets mode (12th fret marker without logic) works
  it("should show 12th fret marker in 11 frets mode without playable 12th fret", () => {
    cy.setFretCount(11);
    cy.allowUItotSettle();

    // Should have 12th fret marker visible
    cy.shouldHave12thFretMarkerInDefault();

    // But should only have 12 fret buttons (0-11)
    cy.shouldHaveFretButtonCount(12);

    // The 12th fret cell should be hidden
    cy.shouldHaveLastFretCellHidden();

    // Game should still work correctly
    cy.gameShouldBePlayable();
  });
});
