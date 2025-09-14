# Guitar Fretboard Flashcard Game

A compact browser tool to practice and memorize notes on a 3- to 12-string guitar-style fretboard.

![screenshot](./docs/img/app-screenshot.png)

## Features

- Practice identifying notes on any string and fret
- Choose normal (12-fret) or extended (24-fret) ranges
- Optionally include sharps/flats in quizzes
- 3–12 strings with ready-made presets and per-string custom tuning
- Reset tuning to standard 6-string configuration
- Visual cues and audio feedback for correct/incorrect answers
- Settings persist across browser sessions so your preferences are retained
- Optional quiz bias towards strings of the current tuning with the most mistakes

## Deployment

- Live at: https://d-led.github.io/fret-flashcards

## Quick start

- run `npm i && npm build`
- Open `src/dist/index.html` in a browser for a quick run.
- Or serve the dist folder with a simple static server:
  - Python 3: `python3 -m http.server 8000 -d dist` then open `http://localhost:8000`
  - Node: `npx http-server ./dist` then open the corresponding URL. (`npm run serve`)

## Inspiration

Inspired by Steve Vai's anecdote about the first homework given to him by Joe Satriani: "learn all notes on the fretboard".

## Tests

- Cypress spec: `cypress/e2e/spec.cy.js`.
- Run tests:
  - Interactive: `npm run cy` or `npx cypress open --e2e`
  - Headless: `npm run e2e`or `npx cypress run --e2e`

## Notes for iOS users

- On iOS devices you may need to tap the "enable sound" banner to hear tones.
