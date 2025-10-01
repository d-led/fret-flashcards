# String Homework Tutor - Mobile Setup

This document explains how to build and run the String Homework Tutor app on iOS devices.

## Prerequisites

### iOS Development (macOS only)

- Xcode (latest version)
- iOS SDK (iOS 13.0 or higher)
- CocoaPods: `sudo gem install cocoapods`

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Mobile

```bash
npm run build:mobile
```

### 3. Run on iOS (macOS only)

```bash
npm run ios:dev
```

## Available Scripts

- `npm run build:mobile` - Build web assets and sync with mobile platforms
- `npm run ios:dev` - Build and run on iOS device/simulator
- `npm run ios:build` - Build iOS app
- `npm run mobile:sync` - Sync web assets to mobile platforms
- `npm run mobile:sync:ios` - Sync web assets to iOS with framework path preservation

## Mobile Features

### Enhanced User Experience

- **Haptic Feedback**: Vibration feedback for correct/incorrect answers
- **Native Status Bar**: Dark theme matching the app
- **Splash Screen**: Custom loading screen with app branding
- **Keyboard Handling**: Optimized for mobile keyboards
- **App Lifecycle**: Proper pause/resume handling

### Native APIs Used

- `@capacitor/haptics` - Vibration feedback
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/splash-screen` - Custom splash screen
- `@capacitor/keyboard` - Keyboard behavior
- `@capacitor/app` - App lifecycle events
- `@capacitor/preferences` - Enhanced storage

## Building for Production

### iOS

1. Build the web assets: `npm run build`
2. Sync with iOS: `npm run mobile:sync:ios` (preserves CocoaPods settings)
3. Open in Xcode: `npx cap open ios`
4. In Xcode, archive and upload to App Store

**Note**: Use `npm run mobile:sync:ios` instead of `npx cap sync ios` to preserve important CocoaPods framework settings that get removed by the standard sync command.

## Troubleshooting

### iOS Issues

- **Pod install failed**: Run `sudo gem install cocoapods`
- **Xcode build failed**: Update Xcode to latest version
- **Simulator issues**: Reset iOS Simulator
- **CocoaPods framework paths missing**: Use `npm run mobile:sync:ios` instead of `npm run mobile:sync`

### General Issues

- **Web assets not updating**: Run `npm run mobile:sync`
- **Plugin errors**: Check Capacitor plugin versions
- **Build errors**: Clear node_modules and reinstall

## App Store Preparation

### iOS (App Store)

1. Create app in App Store Connect
2. Generate distribution certificate
3. Archive and upload from Xcode
4. Submit for review

## Development Tips

- Use `npm run watch` for web development
- Use `npm run mobile:sync:ios` after web changes (preserves CocoaPods settings)
- Test on real devices for best experience
- Use Chrome DevTools for debugging web content
- Check Capacitor logs for native issues

## App Information

- **App Name**: String Homework Tutor
- **Package ID**: com.dled.stringhomeworktutor
- **Description**: The homework tutor you always wished for
- **Platforms**: iOS, Web
- **Framework**: Capacitor + TypeScript + jQuery
