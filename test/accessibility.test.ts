/**
 * Basic Accessibility Test Suite
 * This can be run with Vitest to validate accessibility features
 */

import { describe, test, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Accessibility Tests", () => {
  let htmlContent;

  beforeAll(() => {
    // Read the built HTML file
    const htmlPath = path.join(__dirname, "../dist/index.html");
    htmlContent = fs.readFileSync(htmlPath, "utf8");
  });

  describe("HTML Structure", () => {
    test("should have proper DOCTYPE and lang attribute", () => {
      expect(htmlContent).toMatch(/<!doctype html>/i);
      expect(htmlContent).toMatch(/<html lang="en">/);
    });

    test("should have proper title and meta description", () => {
      expect(htmlContent).toMatch(/<title>.*Guitar Fretboard Flashcard Game.*<\/title>/);
      expect(htmlContent).toMatch(/<meta name="description"/);
    });

    test("should have skip link for keyboard users", () => {
      expect(htmlContent).toMatch(/<a href="#main-content" class="skip-link">Skip to main content<\/a>/);
    });
  });

  describe("Semantic HTML", () => {
    test("should have proper heading hierarchy", () => {
      expect(htmlContent).toMatch(/<h1 class="sr-only">Guitar Fretboard Flashcard Game<\/h1>/);
      expect(htmlContent).toMatch(/<h2 id="flashcard-instruction"/);
      expect(htmlContent).toMatch(/<h2 id="options-heading"/);
    });

    test("should have semantic landmarks", () => {
      expect(htmlContent).toMatch(/<main id="main-content" role="main">/);
      expect(htmlContent).toMatch(/<section class="flashcard"/);
      expect(htmlContent).toMatch(/<section class="options"/);
      expect(htmlContent).toMatch(/<footer class="copyright" role="contentinfo">/);
    });

    test("should have proper form structure", () => {
      expect(htmlContent).toMatch(/<fieldset>/);
      expect(htmlContent).toMatch(/<legend>/);
    });
  });

  describe("ARIA Attributes", () => {
    test("should have proper ARIA labels on interactive elements", () => {
      expect(htmlContent).toMatch(/aria-label="Play the target note audio"/);
      expect(htmlContent).toMatch(/aria-label="Skip to next question"/);
      expect(htmlContent).toMatch(/aria-label="Enable microphone for voice input"/);
    });

    test("should have proper roles", () => {
      expect(htmlContent).toMatch(/role="main"/);
      expect(htmlContent).toMatch(/role="status"/);
      expect(htmlContent).toMatch(/role="application"/);
      expect(htmlContent).toMatch(/role="group"/);
    });

    test("should have live regions for dynamic content", () => {
      expect(htmlContent).toMatch(/aria-live="polite"/);
      expect(htmlContent).toMatch(/aria-live="assertive"/);
    });
  });

  describe("Form Accessibility", () => {
    test("should have proper labels for form controls", () => {
      // Check that form controls have associated labels
      const labelMatches = htmlContent.match(/<label for="[^"]+">/g);
      expect(labelMatches).toBeTruthy();
      expect(labelMatches.length).toBeGreaterThan(5);
    });

    test("should have aria-describedby for complex controls", () => {
      expect(htmlContent).toMatch(/aria-describedby="fret-count-help"/);
      expect(htmlContent).toMatch(/aria-describedby="timeout-help"/);
    });

    test("should have help text for form controls", () => {
      expect(htmlContent).toMatch(/id="fret-count-help"/);
      expect(htmlContent).toMatch(/id="timeout-help"/);
    });
  });

  describe("Screen Reader Support", () => {
    test("should hide decorative elements from screen readers", () => {
      expect(htmlContent).toMatch(/aria-hidden="true"/);
    });

    test("should have screen reader only content", () => {
      expect(htmlContent).toMatch(/class="sr-only"/);
    });

    test("should have proper link attributes", () => {
      expect(htmlContent).toMatch(/target="_blank" rel="noopener"/);
    });
  });

  describe("Focus Management", () => {
    test("should have tabindex on focusable elements", () => {
      expect(htmlContent).toMatch(/tabindex="0"/);
    });

    test("should have proper button descriptions", () => {
      // Check that buttons have meaningful content or aria-labels
      const buttonMatches = htmlContent.match(/<button[^>]*>/g);
      expect(buttonMatches).toBeTruthy();

      buttonMatches.forEach((button) => {
        const hasAriaLabel = button.includes("aria-label=");
        const hasText = button.includes(">") && !button.includes("/>");
        expect(hasAriaLabel || hasText).toBe(true);
      });
    });
  });

  describe("CSS Accessibility", () => {
    test("should have sr-only class defined", () => {
      const cssPath = path.join(__dirname, "../dist/main.css");
      const cssContent = fs.readFileSync(cssPath, "utf8");
      expect(cssContent).toMatch(/\.sr-only/);
    });

    test("should have focus styles defined", () => {
      const cssPath = path.join(__dirname, "../dist/main.css");
      const cssContent = fs.readFileSync(cssPath, "utf8");
      expect(cssContent).toMatch(/outline.*solid/);
    });

    test("should have skip link styles", () => {
      const cssPath = path.join(__dirname, "../dist/main.css");
      const cssContent = fs.readFileSync(cssPath, "utf8");
      expect(cssContent).toMatch(/\.skip-link/);
    });
  });
});
