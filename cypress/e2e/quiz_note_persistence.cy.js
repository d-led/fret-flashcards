describe('Quiz note persistence with score notation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visitApp();
    cy.setTimeoutSeconds(0);
  });

  it('keeps textual quiz note visible after reload when score notation is enabled', () => {
    // Enable score notation and ensure hide-quiz-note label becomes visible
    cy.get('#show-score-notation').check();
    cy.get('#score-key-row').should('be.visible');
    // Ensure the quiz note has a machine-readable value
    cy.get('#quiz-note-btn').should('exist');
    cy.get('#quiz-note-btn').invoke('attr', 'data-note').should('match', /^[A-G][b#]?$/);

    // Reload the app (simulate browser reload)
    cy.reloadAndVisitApp();

    // After reload, score notation should still be enabled and the textual quiz note should still be present
    cy.get('#show-score-notation').should('be.checked');
    cy.get('#quiz-note-btn').should('be.visible');
    cy.get('#quiz-note-btn').invoke('attr', 'data-note').should('match', /^[A-G][b#]?$/);
  });
});
