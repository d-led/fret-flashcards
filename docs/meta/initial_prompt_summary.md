# Fret Flashcards - Development Prompt Log

This document contains the sequential development requirements and tasks for implementing the fret flashcards application, formatted as instructions for a coding agent.

## Initial Implementation

**Task:** Make a clean web-based (use jquery) flashcard game to find notes (the fret) on the fretboard with the following properties

**Implementation Steps:**

1. **Basic Fretboard Setup**
   - Create a fretboard view that displays frets aligned properly on small screens
   - Add the possibility to click the correct fret on the fretboard
   - Put typical fret marks outside the fretboard below the fretboard view: 3, 5, 7, 9, 12 and so on in the extended mode

2. **Visual Feedback System**
   - Do not show the right answer on the fretboard in advance
   - Make the color of the string in question neutral (not green initially)
   - Green should be the color when the answer is correct
   - When clicking on the note while answering, play the answered note and if it's wrong, play the desired note as well

3. **Layout and Timing**
   - Move the countdown into the same line as the note so that the layout doesn't move during the countdown
   - Save all settings to local storage upon change and restore them (validated, safely!) upon app load

4. **Fret Markers and Range**
   - Fix fret markers: the first marker should be on the 3rd fret, not the 2nd
   - The double fret marker should only appear in the extended range mode
   - In extended range: there should be 25 cells total (0th fret for open string + 24 frets)
   - In default mode: don't show the 12th fret (make one less fret in the default mode)

5. **User Interface Improvements**
   - Increase the font size to twice the size for the quiz note
   - Add visual aid to the desired note (background styling)
   - Make the quiz note a button instead of separate play button, keeping the same button styling
   - Remove any correct answer hints that might appear
   - Don't add an h2 title to the page
   - Put the quiz note and quiz string in one line, filling the width
   - Center both elements and make them read like one sentence: "G on the 5th..."
   - On wider screens, make the quiz note have the same bigger font as the quiz string sentence

6. **Content and Readability**
   - Remove outer parentheses from descriptions. Sentences should read: "D on 4th (D, 2x)"
   - Center align numbers in fret buttons
   - Add less padding to UI elements

7. **Configuration System**
   - Make number of strings configurable
   - Put all configuration into a 1-column table
   - Combine string notes config into one cell with a 1-column table (each note in 1 cell)
   - Make "reset to standard tuning" also reset the number of strings to 6
   - Add input field validation for timeout settings - listen to keypresses (debounced) and save validated values

8. **Mobile Responsiveness**
   - Make config buttons and input fields mobile-friendly (styling changes only)
   - Fix iPhone browsers not switching to mobile view
   - Add an hourglass symbol to the countdown

9. **Audio System**
   - Add iOS sound workaround for browser compatibility
   - Switch default 3-string tuning to EBG (like Loog guitar)
   - Switch default 5-string tuning to Keith Richards' Open G: G-D-G-B-D (low to high)
   - Make tunings and notes into objects instead of parallel arrays
   - Combine parallel arrays into defaultTunings object: `defaultTunings = { 3: { strings: [{note ...}]}}`
   - Give names to the default tunings
   - Change waveform to be more audible on lower octaves
   - Make square wave only for 1st and 2nd octave, use sine wave for the rest
   - Choose something smoother than square wave
   - Align the left of the quiz note button with the fretboard beginning

10. **Testing Infrastructure**
    - Set up Cypress testing scaffold
    - Reset local storage before each test case
    - Keep the server running during tests
    - Refactor assertions and actions into custom cy.{command} functions in commands.js for human-readable specifications
    - Add basic playability testing
    - Refactor reusable cy.get commands in gameShouldBePlayable into cy.{command} functions
    - Set timeout-seconds to 0s for testing to avoid assertion race conditions in beforeEach()
    - Fix sporadic test failures with proper wait handling
    - Replace cy.wait(500) with separate command cy.allowUItoSettle and reduce wait time to 50ms
    - Move waitForFretButtons into shouldHaveSessionStarted
    - Replace "verify" verbs with "should" form in tests
    - Add more comprehensive tests
    - Remove unnecessary test cases

11. **String Tuning Interface**
    - Refactor string tuning commands to use natural count from 1 (removes need for comments)
    - Change `cy.setStringTuning(0, "F")` to use 1-based indexing for musicians
    - To avoid player confusion, simplify quiz questions: "3rd (low G) string" -> "3rd string"

12. **Code Quality and Formatting**
    - Configure prettier to keep `<script src="...">` references on one line
    - Run prettier for code formatting
    - Now that basic functionality is complete, put all styling into a single `<style>` tag
    - Refactor CSS while keeping functionality but minimizing code
    - Improve table cell sizing and layout spacing

13. **Final Polish**
    - Add readable quiz sentences with proper articles: "on the..." and add "string" at the end
    - Add small copyright header at bottom citing "GitHub Copilot and Dmitry Ledentsov's 🧠"
    - Add the year 2025 to the copyright note
    - Add proper LICENSE file
    - Add a comprehensive README file

## Implementation Notes

- The application should be a single HTML file with embedded CSS and JavaScript
- Use jQuery for DOM manipulation and event handling  
- Implement local storage for settings persistence with proper validation
- Focus on mobile-first responsive design
- Ensure audio works across different browsers and mobile devices
- Prioritize user experience and readability of the quiz interface
- Maintain comprehensive test coverage with Cypress

## Audio Requirements

- Generate musical notes programmatically using Web Audio API
- Support different waveforms (sine, square) optimized for different octaves
- Include iOS-specific audio handling for mobile browsers
- Allow configurable string tunings with preset options

## Testing Strategy

- Use Cypress for end-to-end testing
- Create custom commands for reusable test actions
- Test core gameplay functionality and configuration options
- Ensure tests are stable and don't have timing issues
- Validate that the application works as expected on different screen sizes