describe("Accessibility Tests", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visitApp();
    cy.setTimeoutSeconds(0);
  });

  describe("Semantic HTML Structure", () => {
    it("should have proper heading hierarchy", () => {
      // Check for main heading (hidden but present for screen readers)
      cy.get("h1.sr-only").should("contain", "Guitar Fretboard Flashcard Game");

      // Check for section headings
      cy.get("h2#flashcard-instruction").should("contain", "Find the note");
      cy.get("h2#options-heading").should("contain", "Game Options");
      cy.get("h2#info-heading.sr-only").should("exist");

      // Check for subsection headings
      cy.get("h3#mic-controls-heading.sr-only").should("exist");
    });

    it("should have proper semantic landmarks", () => {
      // Check for main landmark
      cy.get("main#main-content").should("exist");

      // Check for sections
      cy.get("section.flashcard").should("exist");
      cy.get("section.options").should("exist");
      cy.get("section.info-section").should("exist");
      cy.get("section#mic-controls").should("exist");

      // Check for footer
      cy.get("footer.copyright").should("exist");

      // Check for banner
      cy.get('[role="banner"]').should("exist");
    });

    it("should have proper form structure", () => {
      // Check for fieldsets and legends
      cy.get("fieldset legend").should("contain", "Fretboard Configuration");
      cy.get("fieldset legend").should("contain", "Quiz Settings");
      cy.get("fieldset legend").should("contain", "Advanced Settings");
      cy.get("fieldset legend").should("contain", "Voice Settings");
    });
  });

  describe("ARIA Labels and Descriptions", () => {
    it("should have proper ARIA labels on interactive elements", () => {
      // Quiz button
      cy.get("#quiz-note-btn").should("have.attr", "aria-label", "Play the target note audio");

      // Skip button
      cy.get("#skip-countdown").should("have.attr", "aria-label", "Skip to next question");

      // Microphone button
      cy.get("#mic-toggle").should("have.attr", "aria-label", "Enable microphone for voice input");

      // Reset buttons
      cy.get("#reset-tuning").should("have.attr", "aria-label", "Reset guitar tuning to standard E-A-D-G-B-E");
      cy.get("#reset-stats").should("have.attr", "aria-label", "Reset all statistics to zero");
    });

    it("should have proper ARIA descriptions for form controls", () => {
      // Check aria-describedby attributes
      cy.get("#fret-count").should("have.attr", "aria-describedby", "fret-count-help");
      cy.get("#timeout-seconds").should("have.attr", "aria-describedby", "timeout-help");
      cy.get("#voice-select").should("have.attr", "aria-describedby", "voice-select-help");

      // Check that help text exists
      cy.get("#fret-count-help").should("contain", "Select the number of frets");
      cy.get("#timeout-help").should("contain", "Set how many seconds to wait");
      cy.get("#voice-select-help").should("contain", "Select a voice for text-to-speech");
    });

    it("should have proper roles and states", () => {
      // Check status roles
      cy.get("#note-score").should("have.attr", "role", "status");
      cy.get("#mic-status").should("have.attr", "role", "status");
      cy.get("#mic-feedback").should("have.attr", "role", "status");

      // Check progress bar role
      cy.get("#mic-meter").should("have.attr", "role", "progressbar");

      // Check application role for fretboard
      cy.get("#fretboard-area").should("have.attr", "role", "application");

      // Check group roles
      cy.get(".fret-buttons").should("have.attr", "role", "group");
    });

    it("should have proper live regions", () => {
      // Check aria-live regions
      cy.get("#unified-banner").should("have.attr", "aria-live", "polite");
      cy.get("#countdown").should("have.attr", "aria-live", "polite");
      cy.get("#mic-status").should("have.attr", "aria-live", "polite");
      cy.get("#mic-feedback").should("have.attr", "aria-live", "assertive");
      cy.get("#tts-unavailable").should("have.attr", "aria-live", "polite");

      // Check for game announcement regions
      cy.get("#game-announcements").should("have.attr", "aria-live", "polite");
      cy.get("#error-announcements").should("have.attr", "aria-live", "assertive");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should have skip link for keyboard users", () => {
      cy.get(".skip-link").should("exist");
      cy.get(".skip-link").should("have.attr", "href", "#main-content");
      cy.get(".skip-link").should("contain", "Skip to main content");
    });

    it("should have proper tabindex on focusable elements", () => {
      // Fretboard should be focusable
      cy.get("#fretboard-area").should("have.attr", "tabindex", "0");
    });

    it("should support keyboard navigation through form controls", () => {
      // Test that elements can be focused
      cy.get("#quiz-note-btn").should("be.visible").and("not.be.disabled");
      cy.get("#fretboard-area").should("be.visible");

      // Test focus functionality
      cy.get("#quiz-note-btn").focus();
      cy.get("#quiz-note-btn").should("have.focus");

      cy.get("#fretboard-area").focus();
      cy.get("#fretboard-area").should("have.focus");

      // Skip countdown button is hidden by default, only test if visible
      cy.get("#skip-countdown").then(($btn) => {
        if ($btn.is(":visible")) {
          cy.wrap($btn).focus();
          cy.wrap($btn).should("have.focus");
        }
      });
    });
  });

  describe("Form Accessibility", () => {
    it("should have proper labels for all form controls", () => {
      // Make hidden elements visible for testing
      cy.get("#hide-quiz-note-label").invoke("show");

      // Check that all visible form controls have associated labels
      cy.get('input[type="checkbox"]:visible').each(($checkbox) => {
        const id = $checkbox.attr("id");
        if (id) {
          // Check for either label[for="id"] or label containing the input
          cy.get(`label[for="${id}"], label:has(input#${id})`).should("exist");
        }
      });

      cy.get("select").each(($select) => {
        const id = $select.attr("id");
        if (id) {
          cy.get(`label[for="${id}"]`).should("exist");
        }
      });

      // Check that hide-quiz-note has a label when visible
      cy.get("#hide-quiz-note-label").should("be.visible");
      cy.get("#hide-quiz-note").should("exist");
    });

    it("should have descriptive option text", () => {
      // Check that select options are descriptive
      cy.get('#timeout-seconds option[value="0"]').should("contain", "0 (manual only)");
      cy.get('#num-strings option[value="6"]').should("contain", "6 strings (standard guitar)");

      // Check score key options are descriptive
      cy.get('#score-key option[value="G"]').should("contain", "G major / E minor (1 sharp)");
      cy.get('#score-key option[value="F"]').should("contain", "F major / D minor (1 flat)");
    });
  });

  describe("Screen Reader Support", () => {
    it("should hide decorative elements from screen readers", () => {
      // Wait for the page to be fully loaded
      cy.get("#quiz-note-btn").should("be.visible");
      cy.get("#mic-toggle").should("be.visible");

      // Check for aria-hidden elements in general first
      cy.get('[aria-hidden="true"]').should("have.length.at.least", 3);

      // Check specific elements that should have aria-hidden spans
      cy.get("#quiz-note-btn").should("exist");
      cy.get("#quiz-note-btn").within(() => {
        cy.get('span[aria-hidden="true"]').should("exist");
      });

      cy.get("#mic-toggle").should("exist");
      cy.get("#mic-toggle").within(() => {
        cy.get('span[aria-hidden="true"]').should("exist");
      });

      cy.get("#unified-banner").should("exist");
      cy.get("#unified-banner").should("not.be.visible"); // Banner should be hidden by default
      cy.get("#unified-banner").within(() => {
        cy.get('span[aria-hidden="true"]').should("exist");
      });
    });

    it("should have screen reader only content", () => {
      // Check for sr-only class elements
      cy.get(".sr-only").should("have.length.at.least", 4);

      // Check specific sr-only content
      cy.get("h1.sr-only").should("contain", "Guitar Fretboard Flashcard Game");
      cy.get("h2#info-heading.sr-only").should("exist");
      cy.get("h3#mic-controls-heading.sr-only").should("exist");
    });

    it("should have proper alt text and descriptions", () => {
      // Check that images have alt attributes (if any exist)
      // This app doesn't have images, so we'll just verify no images are present
      cy.get("img").should("not.exist");
    });
  });

  describe("Focus Management", () => {
    it("should have visible focus indicators", () => {
      // Focus on an element and check for focus styles
      cy.get("#quiz-note-btn").focus();
      cy.get("#quiz-note-btn").should("be.focused");

      // Check that focus is visible (CSS outline)
      cy.get("#quiz-note-btn").should("have.css", "outline");
    });

    it("should maintain focus order", () => {
      // Test that focus moves in logical order
      cy.get("#quiz-note-btn").focus();
      cy.get("#quiz-note-btn").should("have.focus");

      cy.get("#fretboard-area").focus();
      cy.get("#fretboard-area").should("have.focus");

      // Skip countdown button is hidden by default, only test if visible
      cy.get("#skip-countdown").then(($btn) => {
        if ($btn.is(":visible")) {
          cy.wrap($btn).focus();
          cy.wrap($btn).should("have.focus");
        }
      });
    });
  });

  describe("Error Handling and Alerts", () => {
    it("should have proper alert roles for errors", () => {
      // Check TTS unavailable message has alert role
      cy.get("#tts-unavailable").should("have.attr", "role", "alert");
    });

    it("should have proper live regions for dynamic content", () => {
      // Check that live regions exist for announcements
      cy.get("#game-announcements").should("exist");
      cy.get("#error-announcements").should("exist");
    });
  });

  describe("Content Accessibility", () => {
    it("should have proper link attributes", () => {
      // Check external links have proper attributes
      cy.get('a[href*="youtu.be"]').should("have.attr", "target", "_blank");
      cy.get('a[href*="youtu.be"]').should("have.attr", "rel", "noopener");
      cy.get('a[href*="github.com"]').should("have.attr", "target", "_blank");
      cy.get('a[href*="github.com"]').should("have.attr", "rel", "noopener");
    });

    it("should have proper page title and meta description", () => {
      cy.title().should("contain", "Guitar Fretboard Flashcard Game");
      cy.get('meta[name="description"]').should("have.attr", "content");
    });

    it("should have proper language declaration", () => {
      cy.get("html").should("have.attr", "lang", "en");
    });
  });

  describe("Interactive Element Accessibility", () => {
    it("should announce game state changes", () => {
      // Check that live regions are set up for announcements
      cy.get("#game-announcements").should("have.attr", "aria-live", "polite");
      cy.get("#game-announcements").should("have.attr", "aria-atomic", "true");
    });

    it("should have proper button descriptions", () => {
      // Check that buttons have meaningful text or aria-labels
      cy.get("button").each(($button) => {
        const text = $button.text().trim();
        const ariaLabel = $button.attr("aria-label");
        const title = $button.attr("title");

        // Button should have either visible text, aria-label, or title
        expect(text.length > 0 || ariaLabel || title).to.be.true;
      });
    });
  });
});
