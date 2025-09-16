describe("Auto screenshot", () => {
  it("loads the app and takes a custom screenshot", () => {
    cy.visitApp();
    cy.shouldHaveMainElementsVisible();

    cy.setScoreNotation(true);

    cy.wait(300); // make sure everything is settled

    cy.appScreenshot();

    cy.then(() => {
      const src = `cypress/screenshots/screenshot.cy.js/app-screenshot-auto.png`;
      const dest = `docs/img/app-screenshot-auto.png`;
      cy.task("copyScreenshot", { src, dest }).then((res) => {
        if (res && res.error) throw new Error(res.error);
      });
    });
  });
});
