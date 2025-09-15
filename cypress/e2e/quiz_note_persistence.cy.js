describe("Quiz note persistence with score notation", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visitApp();
    cy.setTimeoutSeconds(0);
  });

  it("keeps textual quiz note visible after reload when score notation is enabled", () => {
    // Enable score notation and ensure related UI becomes visible
    cy.setScoreNotation(true);
    cy.shouldHaveScoreNotation(true);

    // Ensure the quiz note has a machine-readable value
    cy.shouldHaveQuizNoteExist();
    cy.shouldHaveQuizNoteMachineReadable();

    // Reload the app (simulate browser reload)
    cy.reloadAndVisitApp();

    // After reload, score notation should still be enabled and the textual quiz note should still be present
    cy.shouldHaveScoreNotation(true);
    cy.shouldHaveQuizNoteVisible();
    cy.shouldHaveQuizNoteMachineReadable();
  });
});
