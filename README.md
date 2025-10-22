# Guitar Fretboard Flashcard Game

A compact browser-based tool to practice and memorize notes on a 3- to 12-string guitar-style fretboard.

![screenshot](./docs/img/app-screenshot-auto.png)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fd-led%2Ffret-flashcards.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fd-led%2Ffret-flashcards?ref=badge_shield)

## Web Version

- [d-led.github.io/fret-flashcards](https://d-led.github.io/fret-flashcards/)

## Mobile Version

If you need to be offline or not have to carry the computer out in the open with you:

[![Download on the App Store](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)](https://apps.apple.com/us/app/string-homework-tutor/id6752674139)

<!-- [![Get it on Google Play](https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png)](https://play.google.com/store/apps/details?id=com.dled.stringhomeworktutor)

-->

## Features

- Practice identifying notes on any string and fret.
- Choose between a basic 0-11th fret practice or 21, 22 or 24 frets with multiple notes to find on one string.
- Optionally include sharps/flats in quizzes.
- 3–10 strings with ready-made presets and per-string custom tuning.
- Reset tuning to standard 6-string configuration.
- Visual cues and audio feedback for correct/incorrect answers.
- Settings persist across browser sessions so your preferences are retained.
- Optional quiz bias towards strings of the current tuning with the most mistakes.
- You don't actually need a stringed instrument for practicing at all: try turning on the score notation and turning off the quiz note hint. Sing or play it on any instrument!
- You don't have to look at the monitor either: enable the synthetic "voice hints" (might not work in all browsers).

## Deployment

- Live at: https://d-led.github.io/fret-flashcards

## Quick Start

For developers, see the [Quick Start Guide](./docs/development/QUICK_START.md) for setup instructions.

**Basic web usage:**

- Run `npm i && npm run build`
- Or serve with: `npm run serve` then open the corresponding URL, e.g. http://localhost:8080

## Inspiration

Inspired by Steve Vai's anecdote about the first homework given to him by Joe Satriani: "learn all notes on the fretboard".

## Development

- **Quick Start**: [QUICK_START.md](./docs/development/QUICK_START.md)
- **Mobile Development**: [mobile_development.md](./docs/development/mobile_development.md)
- **Testing**: [accessibility-testing.md](./docs/development/accessibility-testing.md)
- **App Store**: [APP_STORE_SUBMISSION.md](./docs/development/APP_STORE_SUBMISSION.md)

## Notes for iOS users

- On iOS devices you may need to tap the "enable sound" banner to hear tones.

## Prominent Dependencies

This app wouldn't be possible without the work of thousands of OSS contributors. The prominent OSS used in this app:

- UI: [jQuery](https://jquery.com/)
- Cross-Platform Mobile App Builds: [Capacitor](https://capacitorjs.com/)
- Pitch detection: [pitchy](https://github.com/ianprime0509/pitchy)
- Score notation rendering: [vexflow](https://github.com/vexflow)

## 📄 Licensing

This project uses **dual licensing** (similar to VLC):

- **🌐 Web Version**: [Mozilla Public License 2.0 (MPLv2)](LICENSE) - Open source
- **📱 App Store Version**: [Commercial License](LICENSE-COMMERCIAL) - Proprietary

See [LICENSING.md](docs/development/LICENSING.md) for detailed information.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fd-led%2Ffret-flashcards.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fd-led%2Ffret-flashcards?ref=badge_large)
