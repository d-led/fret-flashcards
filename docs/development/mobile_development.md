# Mobile Development Guide

This guide covers everything you need to know about developing, building, and deploying the String Homework Tutor mobile app for iOS.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Mobile-Specific Features](#mobile-specific-features)
- [Development Workflow](#development-workflow)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [App Store Deployment](#app-store-deployment)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

### Required Software

#### iOS Development (macOS only)

- **Xcode** (latest version)
  - Download from Mac App Store
  - Includes iOS SDK and simulators
- **CocoaPods** (dependency manager)
  ```bash
  sudo gem install cocoapods
  ```
- **iOS Deployment Target**: 13.0+

#### General

- **Node.js** 18+ and npm
- **Git** for version control

### System Requirements

#### iOS

- **OS**: macOS 12.0+ (Monterey or later)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 15GB free space for Xcode and simulators

## Development Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fret-flashcards
npm install
```

### 2. Install Mobile Dependencies

```bash
# Capacitor and mobile plugins are already installed
npm list @capacitor/core @capacitor/cli
```

### 3. Verify Mobile Platforms

```bash
# Check if platforms are properly configured
npx cap doctor

# List available platforms
npx cap ls
```

### 4. Initial Mobile Build

```bash
# Build web assets and sync to mobile platforms
npm run build:mobile
```

## 🚀 Quick Mobile Start

For developers who want to get up and running quickly:

```bash
# Install dependencies
npm install

# Build and sync for mobile
npm run build:mobile

# Run on iOS (requires Xcode on macOS)
npm run ios:dev
```

## 📱 Mobile Features

- **Haptic Feedback**: Vibration for correct/incorrect answers and button taps
- **Native Performance**: Full native app experience with web development speed
- **App Store Ready**: Deploy to Google Play Store and Apple App Store
- **Touch Optimized**: All interactions work perfectly on touch screens
- **Enhanced Storage**: Better data persistence with native APIs
- **App Lifecycle**: Smart audio pause/resume when app goes to background

## 🛠️ Development Commands

| Command                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| `npm run build:mobile`  | Build web assets + sync to mobile platforms |
| `npm run ios:dev`       | Build and run on iOS device/simulator       |
| `npm run ios:build`     | Build iOS app for production                |
| `npm run mobile:sync`   | Sync web assets to mobile platforms         |
| `npm run mobile:sync:ios` | Sync web assets to iOS (preserves CocoaPods settings) |

## Mobile-Specific Features

### Haptic Feedback System

The app provides tactile feedback for better user experience:

```typescript
import { mobileEnhancements } from "./modules/mobileEnhancements";

// Success feedback (correct answer)
mobileEnhancements.hapticSuccess();

// Error feedback (incorrect answer)
mobileEnhancements.hapticError();

// Light feedback (button taps)
mobileEnhancements.hapticLight();
```

**Implementation Locations:**

- `src/ts/modules/mobileEnhancements.ts` - Core haptic system
- `src/ts/index.ts` - Integrated into quiz logic

### Native Status Bar

Dark theme status bar matching app design:

```typescript
// Configured in capacitor.config.ts
StatusBar: {
  style: "dark",
  backgroundColor: "#222222"
}
```

### Splash Screen

Custom branded loading screen:

```typescript
// Configured in capacitor.config.ts
SplashScreen: {
  launchShowDuration: 2000,
  backgroundColor: "#222222",
  androidSplashResourceName: "splash",
  // ... more options
}
```

### App Lifecycle Management

Handles app state changes for audio and performance:

```typescript
// Automatic audio pause/resume
App.addListener("appStateChange", ({ isActive }) => {
  if (isActive) {
    resumeAudio();
  } else {
    pauseAudio();
  }
});
```

### Enhanced Storage

Uses Capacitor Preferences for better data persistence:

```typescript
// Set preference (works on web and mobile)
await mobileEnhancements.setPreference("settings", userSettings);

// Get preference with fallback
const settings = await mobileEnhancements.getPreference("settings");
```

## Development Workflow

### Daily Development

1. **Start web development server:**

   ```bash
   npm run watch
   ```

2. **Make changes to TypeScript/CSS/HTML**

3. **Sync changes to mobile:**

   ```bash
   npm run mobile:sync
   ```

4. **Test on device/emulator:**

   ```bash
   # Android
   npm run android:dev

   # iOS (macOS only)
   npm run ios:dev
   ```

### Available Scripts

| Script                  | Description                         |
| ----------------------- | ----------------------------------- |
| `npm run build`         | Build web assets only               |
| `npm run build:mobile`  | Build web assets + sync to mobile   |
| `npm run mobile:sync`   | Sync web assets to mobile platforms |
| `npm run android:dev`   | Build and run on Android            |
| `npm run ios:dev`       | Build and run on iOS                |
| `npm run android:build` | Build Android APK                   |
| `npm run ios:build`     | Build iOS app                       |

### File Structure

```
fret-flashcards/
├── src/ts/modules/
│   └── mobileEnhancements.ts    # Mobile-specific features
├── android/                     # Android project
│   └── app/src/main/
│       ├── AndroidManifest.xml  # Permissions & config
│       └── res/                 # Android resources
├── ios/                        # iOS project
│   └── App/App/                # iOS app files
├── capacitor.config.ts         # Capacitor configuration
└── mobile_development.md       # This guide
```

## Building for Production

### iOS (App Store)

1. Run `npm run build:mobile`
2. Open in Xcode: `npx cap open ios`
3. Archive and upload from Xcode
4. Submit for review in App Store Connect

### Detailed Production Build Process

#### iOS Production Build

1. **Prepare for release:**

   ```bash
   npm run build:mobile
   ```

2. **Open in Xcode:**

   ```bash
   npx cap open ios
   ```

3. **In Xcode:**
   - Select your development team
   - Set bundle identifier: `com.dled.stringhomeworktutor`
   - Go to `Product` → `Archive`
   - Upload to App Store Connect

4. **Alternative command line build:**
   ```bash
   cd ios
   xcodebuild -workspace App.xcworkspace -scheme App -configuration Release
   ```

## Testing

### iOS Testing

#### Using Xcode

1. Open project: `npx cap open ios`
2. Select simulator or device
3. Click "Run" button or press `Cmd+R`

#### Using Command Line

```bash
# List available simulators
xcrun simctl list devices

# Run on specific simulator
npx cap run ios --target="iPhone 15 Pro"
```

#### Testing Checklist

- [ ] App launches successfully
- [ ] Haptic feedback works (real device only)
- [ ] Audio plays correctly
- [ ] Microphone input works
- [ ] Settings persist between sessions
- [ ] App handles background/foreground transitions
- [ ] All UI elements are touch-friendly

### Web Testing

Test the web version to ensure mobile features don't break:

```bash
npm run serve
# Open http://localhost:8080 in mobile browser
```

## Troubleshooting

### Common iOS Issues

#### Pod Install Failed

```bash
# Install CocoaPods
sudo gem install cocoapods

# Update pods
cd ios/App
pod install --repo-update
```

#### Xcode Build Failed

```bash
# Run first launch setup
xcodebuild -runFirstLaunch

# Clean build folder
# In Xcode: Product → Clean Build Folder
```

#### Simulator Issues

```bash
# Reset simulator
xcrun simctl erase all

# List available simulators
xcrun simctl list devices
```

### General Issues

#### Web Assets Not Updating

```bash
# Force sync
npm run mobile:sync

# Or manually
npx cap sync ios
```

#### Plugin Errors

```bash
# Check plugin versions
npm list @capacitor

# Update plugins
npm update @capacitor/core @capacitor/cli
```

#### Build Errors

```bash
# Clear everything and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build:mobile
```

## App Store Deployment

### Apple App Store (iOS)

1. **Create Developer Account**
   - Go to https://developer.apple.com
   - Pay $99/year fee
   - Complete developer profile

2. **Create App in App Store Connect**
   - App name: "String Homework Tutor"
   - Bundle ID: `com.dled.stringhomeworktutor`
   - Add app information and screenshots

3. **Upload via Xcode**
   - Archive app in Xcode
   - Upload to App Store Connect
   - Complete store listing
   - Submit for review

### App Store Assets Needed

#### Required Images

- **App Icon**: 1024x1024 PNG (no transparency)
- **Screenshots**: Various device sizes

#### App Information

- **App Name**: String Homework Tutor
- **Description**: Detailed app description
- **Keywords**: guitar, learning, music, education, fretboard
- **Category**: Education or Music
- **Age Rating**: 4+ (suitable for all ages)

## Advanced Configuration

### Logo and Asset Generation

The app automatically generates all required icons and splash screens from a single SVG logo using `@capacitor/assets`.

#### Logo Source

- **Location**: `src/logo/logo.svg`
- **Format**: SVG (128x128 recommended)
- **Background**: Should have a solid background color for best results

#### Automatic Generation

**Generate all assets:**

```bash
npm run generate:assets
```

**Assets are automatically generated during mobile builds:**

```bash
npm run build:mobile  # Includes asset generation
```

#### Generated Assets

The script automatically creates:

**iOS (10 files):**

- App icons for all required sizes
- Splash screens for all device sizes
- Dark mode splash screens

**PWA (7 files):**

- Web icons in various sizes (48x48 to 512x512)
- Automatically updates `www/manifest.json`

#### Manual Asset Management

If you need to manually replace specific assets:

**iOS Icons:**

```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
├── Contents.json
├── icon-20.png
├── icon-29.png
├── icon-40.png
├── icon-60.png
└── icon-1024.png
```

#### Updating the Logo

1. **Replace the source logo:**

   ```bash
   # Update src/logo/logo.svg with your new design
   ```

2. **Regenerate all assets:**

   ```bash
   npm run generate:assets
   ```

3. **Sync to mobile platforms:**
   ```bash
   npm run mobile:sync
   ```

#### Asset Generation Script

The `scripts/generate-icons.js` script:

- Copies your logo from `src/logo/logo.svg` to the `assets/` directory
- Runs `@capacitor/assets generate` to create all required sizes
- Maintains consistent branding across all platforms
- Handles both light and dark mode variants

### Custom Splash Screens

#### iOS

```
ios/App/App/
├── LaunchScreen.storyboard
└── Assets.xcassets/LaunchImage.imageset/
```

### Environment Configuration

Create environment-specific builds:

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: "com.dled.stringhomeworktutor",
  appName: "String Homework Tutor",
  webDir: "dist",
  server:
    process.env.NODE_ENV === "development"
      ? {
          url: "http://localhost:8080",
          cleartext: true,
        }
      : undefined,
};
```

### Performance Optimization

#### Web Assets

- Minify CSS and JavaScript
- Optimize images
- Use efficient bundling

#### Mobile-Specific

- Lazy load non-critical features
- Optimize for touch interactions
- Handle memory constraints

## Troubleshooting

### iOS Black Screen Issue

**Problem**: iOS app shows black screen with quarter circle, or SceneDelegate loading errors.

**Symptoms**:

```
Info.plist configuration "Default Configuration" for UIWindowSceneSessionRoleApplication contained UISceneDelegateClassName key, but could not load class with name "SceneDelegate".
There is no scene delegate set. A scene delegate class must be specified to use a main storyboard file.
```

**Solution**: Completely reset the iOS platform to get a fresh Capacitor configuration:

```bash
# Remove the corrupted iOS platform
rm -rf ios

# Re-add iOS platform with fresh configuration
npx cap add ios

# Test the app
npx cap run ios
```

**Why this works**: The iOS platform can get corrupted with incorrect SceneDelegate configurations or module loading issues. A fresh installation ensures proper Capacitor bridge setup and eliminates configuration conflicts.

### iOS Simulator Management

**List available simulators**:

```bash
npx cap run ios --list
```

**Run on specific simulator**:

```bash
# Using simulator ID directly
npx cap run ios --target="088DAA2D-0E24-4A7D-8BFF-1C7372FFED9B"

# Using flexible npm script (pass target as argument)
npm run ios:run "088DAA2D-0E24-4A7D-8BFF-1C7372FFED9B"

# Or use predefined npm scripts
npm run ios:ipadA16
npm run ios:iphone13Mini
```

**Open Xcode project**:

```bash
npx cap open ios
```

**Quick Reference**:

```bash
# 1. List available simulators
npm run ios:list

# 2. Copy a target ID from the list
# 3. Run on any simulator
npm run ios:run "TARGET_ID_HERE"

# Examples:
npm run ios:run "088DAA2D-0E24-4A7D-8BFF-1C7372FFED9B"  # iPad A16
npm run ios:run "1D9323A4-D5B5-4709-AE4E-90820CF7523A"  # iPhone 13 mini
```

### Common iOS Issues

1. **CocoaPods encoding errors**: Set `export LANG=en_US.UTF-8` in your shell profile
2. **Build failures**: Clean build folder in Xcode (Product → Clean Build Folder)
3. **Plugin issues**: Run `npx cap sync ios` to update native dependencies

## Support and Resources

### Documentation

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://developer.apple.com/ios/)

### Community

- [Capacitor Discord](https://discord.gg/capacitor)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor)
- [GitHub Issues](https://github.com/ionic-team/capacitor/issues)

### Tools

- [Xcode](https://developer.apple.com/xcode/)
- [Capacitor CLI](https://capacitorjs.com/docs/cli)

---

**Happy Mobile Development!** 🎸📱

For questions or issues, check the troubleshooting section or create an issue in the project repository.
