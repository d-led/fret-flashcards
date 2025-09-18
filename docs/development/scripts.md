# Development Scripts

This document describes the various scripts available for development, testing, and deployment.

## Test Scripts

### Unit Tests

```bash
npm test
```

Runs all unit tests using Vitest. Tests are located in the `test/` directory and cover:

- Core application logic
- Audio and TTS functionality
- Touch handling
- Accessibility features
- UI controls and utilities

### E2E Tests

```bash
npm run test:e2e
```

Runs end-to-end tests using Cypress. This command:

1. Builds the application
2. Runs Cypress tests in headless Chrome
3. Generates test reports and screenshots

### Accessibility Tests

#### HTML/CSS Accessibility Check

```bash
npm run test:accessibility
```

**Purpose**: Validates accessibility features in the built HTML and CSS files.

**What it checks**:

- HTML structure (DOCTYPE, lang attribute, title, meta description)
- Semantic HTML (skip links, landmarks, heading hierarchy)
- ARIA attributes (labels, roles, live regions)
- Form accessibility (labels, descriptions, help text)
- Keyboard navigation (tabindex, focus management)
- Screen reader support (sr-only classes, proper attributes)
- CSS accessibility (focus styles, skip link styles)

**Output**: Console report showing passed/failed checks with success rate.

#### Cypress Test Structure Validation

```bash
npm run test:accessibility:cypress
```

**Purpose**: Validates that the Cypress accessibility test file is properly structured.

**What it checks**:

- Test file has proper describe blocks for different accessibility categories
- Tests cover all required accessibility areas
- Uses proper Cypress commands and assertions
- Tests focus functionality, ARIA attributes, and semantic elements

**Location**: `scripts/accessibility-cypress-check.js`

## Build Scripts

### Development Build

```bash
npm run build
```

Builds the application for development using the custom build script.

### Watch Mode

```bash
npm run watch
```

Builds the application and watches for changes, rebuilding automatically.

### Mobile Build

```bash
npm run build:mobile
```

Builds the application and generates mobile assets for iOS and Android.

## Asset Generation

### Generate Icons and Splash Screens

```bash
npm run generate:assets
```

**Purpose**: Generates app icons and splash screens from the source logo.

**What it does**:

1. Copies the logo from `src/logo/logo.svg` to `assets/`
2. Runs `@capacitor/assets generate` to create all required sizes
3. Generates icons for iOS, Android, and PWA
4. Creates splash screens for all platforms and orientations

**Location**: `scripts/generate-icons.js`

## Mobile Development

### iOS Development

```bash
npm run ios:dev          # Build and run on iOS simulator
npm run ios:build        # Build iOS app
npm run ios:open         # Open in Xcode
npm run ios:list         # List available simulators
```

### Android Development

```bash
npm run android:dev      # Build and run on Android emulator
npm run android:build    # Build Android app
```

### Mobile Sync

#### Standard Sync

```bash
npm run mobile:sync
```

**Purpose**: Syncs web assets to all mobile platforms (iOS, Android, Web).

**What it does**:
- Copies web assets from `dist/` to platform-specific directories
- Updates Capacitor configuration files
- Runs `pod install` for iOS dependencies
- Updates native plugins

#### iOS-Specific Sync with Framework Fix

```bash
npm run mobile:sync:ios
```

**Purpose**: Syncs web assets to iOS and preserves important CocoaPods framework settings.

**What it does**:
1. Runs standard `npm run mobile:sync`
2. Automatically restores CocoaPods framework paths that get removed by sync
3. Ensures `[CP] Embed Pods Frameworks` build phase has correct `inputPaths` and `outputPaths`

**Why needed**: The standard `npx cap sync` command removes important CocoaPods framework settings from `project.pbxproj`. This script restores them automatically.

**Location**: `scripts/fix-frameworks.sh`

## App Store Preparation

### Setup App Store Assets

```bash
npm run setup-app-store
```

**Purpose**: Prepares all assets and metadata for App Store submission.

**What it does**:

1. Generates screenshots for different device sizes
2. Creates app store metadata
3. Validates all required assets are present
4. Generates compliance report

**Location**: `scripts/setup-app-store.sh`

### App Store Preparation (Node.js)

```bash
node scripts/app-store-prep.js
```

**Purpose**: Alternative Node.js-based app store preparation with more detailed validation.

**Location**: `scripts/app-store-prep.js`

## Utility Scripts

### SSL Certificate Generation

```bash
./scripts/generate-cert.sh
```

**Purpose**: Generates self-signed SSL certificates for local HTTPS testing.

**Location**: `scripts/generate-cert.sh`

## Script Locations

All scripts are organized in the `scripts/` directory:

- `build.mjs` - Main build script
- `generate-icons.js` - Asset generation
- `generate-cert.sh` - SSL certificate generation
- `setup-app-store.sh` - App Store preparation (shell)
- `app-store-prep.js` - App Store preparation (Node.js)
- `accessibility-cypress-check.js` - Cypress test validation
- `fix-frameworks.sh` - iOS CocoaPods framework path restoration

## Development Workflow

### Typical Development Cycle

1. **Start development**: `npm run watch`
2. **Run tests**: `npm test`
3. **Test accessibility**: `npm run test:accessibility`
4. **Run E2E tests**: `npm run test:e2e`
5. **Test mobile**: `npm run ios:dev` or `npm run android:dev`

### Pre-deployment Checklist

1. All tests pass: `npm test && npm run test:e2e`
2. Accessibility validated: `npm run test:accessibility`
3. Mobile assets generated: `npm run generate:assets`
4. App Store ready: `npm run setup-app-store`

## Troubleshooting

### Common Issues

**Build fails**: Check that all dependencies are installed with `npm install`

**E2E tests fail**: Ensure the app builds successfully first with `npm run build`

**Accessibility tests fail**: Review the console output for specific failed checks

**Mobile build fails**: Ensure Capacitor is properly configured and platforms are added

**Asset generation fails**: Check that the source logo exists at `src/logo/logo.svg`
