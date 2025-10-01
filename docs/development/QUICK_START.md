# 🚀 Quick Start Guide

Get up and running with the String Homework Tutor project quickly.

## Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control

## Web Development

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fret-flashcards
npm install
```

### 2. Build and Run

```bash
# Build the project
npm run build

# Open dist/index.html in a browser for a quick run
# Or serve the dist folder with a simple static server:
```

**Python 3:**
```bash
python3 -m http.server 8000 -d dist
# Then open http://localhost:8000
```

**Node:**
```bash
npx http-server ./dist
# Then open the corresponding URL (npm run serve)
```

## Mobile Development

### Prerequisites

#### iOS Development (macOS only)
- Xcode (latest version)
- iOS SDK (iOS 13.0+)
- CocoaPods: `sudo gem install cocoapods`

### Quick Mobile Start

```bash
# Install dependencies
npm install

# Build and sync for mobile
npm run build:mobile

# Run on iOS (requires Xcode on macOS)
npm run ios:dev
```

## Testing

### Run Tests

```bash
# Interactive: npm run cy or npx cypress open --e2e
# Headless: npm run e2e or npx cypress run --e2e
```

**Cypress spec:** `cypress/e2e/spec.cy.js`

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build web assets only |
| `npm run build:mobile` | Build web assets + sync to mobile |
| `npm run ios:dev` | Build and run on iOS |
| `npm run mobile:sync` | Sync web assets to mobile platforms |
| `npm run cy` | Run Cypress tests interactively |
| `npm run e2e` | Run Cypress tests headlessly |

## Next Steps

- **Web Development**: See the main project files in `src/ts/`
- **Mobile Development**: See [mobile_development.md](./mobile_development.md)
- **App Store Submission**: See [APP_STORE_SUBMISSION.md](./APP_STORE_SUBMISSION.md)
- **Testing**: See [accessibility-testing.md](./accessibility-testing.md)

## Notes for iOS Users

- On iOS devices you may need to tap the "enable sound" banner to hear tones.

---

**Happy coding!** 🎸
