# 🍎 App Store Submission Guide

Complete guide for submitting **String Homework Tutor** to the iOS App Store using Fastlane automation.

## ⚡ 60-Second Runbook (Copy/Paste)

Run these from the repo root:

```bash
# 0) Optional but recommended before release
scripts/quality-gate.sh

# 1) Validate App Store assets/config
npm run app-store:validate

# 2) Prepare assets/screenshots (WARNING: removes old screenshots)
npm run app-store:prep

# 3) Upload build to TestFlight
npm run app-store:testflight

# 4) Upload screenshots + metadata
npm run app-store:screenshots
npm run app-store:metadata

# 5) Submit release to App Store
npm run app-store:release
```

## 📋 Quick Start

### 1. Prerequisites

```bash
# Install Fastlane (if not already installed)
sudo gem install fastlane

# Verify installation
fastlane --version
```

### 2. Environment Setup

Set the following environment variables:

```bash
export APPLE_ID="your-apple-id@example.com"
export APPLE_TEAM_ID="your-team-id"
export PROVISIONING_PROFILE_UUID="your-provisioning-profile-uuid"
```

### 3. Complete Submission Workflow

```bash
# Step 1: Validate everything is ready
npm run app-store:validate

# Step 2: Prepare all assets (⚠️ WARNING: This deletes old screenshots!)
npm run app-store:prep

# Step 3: Submit to TestFlight first
npm run app-store:testflight

# Step 4: Upload screenshots to App Store Connect
npm run app-store:screenshots

# Step 5: Upload metadata to App Store Connect
npm run app-store:metadata

# Step 6: After testing, submit to App Store
npm run app-store:release
```

## 🚀 Available Commands

### Package.json Scripts

| Command                             | Purpose     | Description                                                                            |
| ----------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `npm run app-store:validate`        | Validation  | Validates all assets, metadata, and compliance                                         |
| `npm run app-store:prep`            | Preparation | **⚠️ WARNING: Deletes old screenshots!** Generates screenshots and prepares all assets |
| `npm run app-store:testflight`      | TestFlight  | **✅ WORKING** - Builds and uploads to TestFlight                                      |
| `npm run app-store:release`         | App Store   | Builds and uploads to App Store                                                        |
| `npm run app-store:metadata`        | Metadata    | Upload metadata only to App Store Connect                                              |
| `npm run app-store:screenshots`     | Screenshots | Upload screenshots (replaces existing)                                                 |
| `npm run app-store:screenshots:add` | Screenshots | Upload screenshots (adds to existing)                                                  |
| `npm run screenshots`               | Screenshots | Generate screenshots only (fastlane)                                                   |
| `npm run screenshots:fastlane`      | Screenshots | Generate screenshots using fastlane script                                             |

### Individual Scripts

| Script                          | Purpose                  |
| ------------------------------- | ------------------------ |
| `scripts/app-store-validate.js` | Comprehensive validation |
| `scripts/app-store-prep.js`     | Asset preparation        |

## 📱 App Information

- **Name**: String Homework Tutor
- **Subtitle**: Infinite fretboard practice
- **Bundle ID**: `com.dled.stringhomeworktutor`
- **Category**: Education
- **Age Rating**: 4+ (suitable for all ages)
- **Price**: $2.99 USD

## 🔧 Configuration Files

### Fastlane Configuration

- **Fastfile**: `ios/fastlane/Fastfile`
- **Snapfile**: `ios/fastlane/Snapfile`
- **Metadata**: `ios/fastlane/metadata/en-US/`

### App Store Metadata

- **JSON**: `app-store-metadata.json` (comprehensive metadata)
- **Individual files**: `ios/fastlane/metadata/en-US/*.txt`

## 📸 Screenshot Requirements

The app generates screenshots for these required devices:

- iPhone 17 Pro Max (6.7" display)
- iPhone 17 Pro (6.1" display)
- iPad Pro 13-inch (M4) (12.9" display)

Screenshots are automatically generated using fastlane snapshot and saved to `ios/screenshots/`.

### Screenshot Upload Options

You have two options for uploading screenshots to App Store Connect:

#### Option 1: Replace All Screenshots (Recommended)

```bash
npm run app-store:screenshots
```

- **Behavior**: Deletes ALL existing screenshots and uploads new ones
- **Use when**: You want to completely refresh your app store screenshots
- **Configuration**: Uses `overwrite_screenshots: true`

#### Option 2: Add to Existing Screenshots

```bash
npm run app-store:screenshots:add
```

- **Behavior**: Adds new screenshots alongside existing ones
- **Use when**: You want to add screenshots without affecting existing ones
- **Configuration**: Uses `overwrite_screenshots: false`

### Screenshot Upload Workflow

1. **Generate Screenshots**:

   npm run app-store:prep  # ⚠️ WARNING: Deletes old screenshots! Includes screenshot generation
   # OR
   npm run screenshots     # Screenshots only (fastlane)
   # OR
   npm run screenshots:fastlane  # Screenshots using fastlane script

2. **Upload Screenshots**:

   npm run app-store:screenshots  # Replace existing
   # OR
   npm run app-store:screenshots:add  # Add to existing
```raw

3. **Verify Upload**: Check App Store Connect to confirm screenshots were uploaded correctly.

## 🔍 Validation Process

The validation script (`app-store-validate.js`) checks:

### ✅ Project Structure

- Required files exist
- iOS project structure is correct
- Fastlane configuration is present

### ✅ Screenshots

- All required device screenshots exist
- Screenshot quality (file size validation)
- Proper language directory structure

### ✅ App Icon

- App icon exists in correct location
- Icon quality validation
- Required sizes present

### ✅ Metadata

- All required fields present
- Bundle ID matches project
- Character limits respected
- Category and age rating correct

### ✅ Privacy Policy

- Privacy policy exists
- Required sections present
- Contact information included

### ✅ App Build

- App builds successfully
- iOS sync works (with known CocoaPods exception handling)

## 📝 Metadata Details

### App Description

```
String Homework Tutor - Master the Fretboard

The homework tutor you always wished for! Learn guitar notes on the fretboard and their location in sheet music with this interactive, accessible flashcard game.

FEATURES
• Practice identifying notes on any string and fret
• Choose from 12, 21, 22, or 24 frets
• Include sharps/flats in quizzes
• 3-10 strings with custom tuning
• Visual cues and audio feedback
• Haptic feedback for mobile devices
• Voice hints and text-to-speech
• Score notation display
• Bias towards strings with mistakes
• Settings persist across sessions

PERFECT FOR
• Guitar students of all levels
• Music teachers and educators
• Self-taught musicians
• Anyone learning string instruments

ACCESSIBILITY
• Full VoiceOver support
• Keyboard navigation
• High contrast support
• Screen reader compatible
• Haptic feedback

INSPIRED BY
Steve Vai's anecdote about Joe Satriani's first homework: "learn all notes on the fretboard"

No internet required - everything works offline!
```raw

### Keywords

```
guitar,learning,music,fretboard,notes,practice,sheet music,offline,voice,strings,mandolin,tunings

### URLs

- **Marketing**: https://github.com/d-led/fret-flashcards
- **Privacy Policy**: https://github.com/d-led/fret-flashcards/blob/main/docs/development/privacy-policy.md
- **Support**: https://github.com/d-led/fret-flashcards

## 🔒 Permissions

The app requests these permissions with clear explanations:

- **Microphone**: "This app uses the microphone for pitch detection for touch-free operation to help you learn notes on your instrument."
- **Audio**: Used for playing notes and feedback sounds
- **Haptic**: Used for tactile feedback on correct/incorrect answers

## ♿ Accessibility Features

- Full VoiceOver support
- Keyboard navigation
- High contrast support
- Screen reader compatible
- Haptic feedback
- Dynamic Type support

## 📊 Compliance

- ✅ No internet required (offline app)
- ✅ No data collection
- ✅ COPPA compliant
- ✅ GDPR compliant
- ✅ CCPA compliant
- ✅ Encryption exempt

## 🧪 Testing Workflow

### 1. Pre-Submission Testing

```bash
# Run all tests
npm test
npm run test:e2e
npm run test:accessibility

# Validate App Store readiness
npm run app-store:validate
```

### 2. TestFlight Testing

```bash
# Upload to TestFlight
npm run app-store:testflight

# Test on real devices
# - iPhone SE (smallest screen)
# - iPhone 15 Pro Max (largest screen)
# - iPad (if supported)
# - Test with VoiceOver enabled
# - Test with Dynamic Type at largest size
```

### 3. Final Submission

```bash
# After successful TestFlight testing
npm run app-store:release
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clean and rebuild
npm run build:mobile
npx cap sync ios
```

#### Screenshot Generation Issues

```bash
# Check simulator availability
xcrun simctl list devices

# Reset simulators if needed
xcrun simctl erase all
```

#### Screenshot Upload Issues

```bash
# Verify screenshots exist before upload
ls -la ios/screenshots/en-US/

# Check screenshot file sizes (should be reasonable)
du -h ios/screenshots/en-US/*.png

# Upload screenshots individually if batch fails
npm run app-store:screenshots:add  # Safer option
```

#### Fastlane Issues

```bash
# Update fastlane
sudo gem update fastlane

# Check fastlane configuration
cd ios && fastlane lanes
```

#### CocoaPods Issues

```bash
# Known issue with Xcode 26 compatibility
# The validation script handles this automatically
# Manual fix if needed:
cd ios/App && pod install
```

### Validation Failures

If validation fails, check the generated report:

```bash
cat app-store-validation-report.json
```

Common fixes:

- Missing screenshots: Run `npm run screenshots`
- Missing metadata: Check `ios/fastlane/metadata/en-US/` files
- Build issues: Run `npm run build:mobile`

## 📈 Post-Submission

### Monitoring

1. Check App Store Connect for review status
2. Monitor for reviewer feedback
3. Respond quickly to any requests

### Expected Timeline

- **TestFlight**: Usually processed within 1-2 hours
- **App Store Review**: 24-48 hours typically
- **Release**: Immediate after approval (if set to automatic)

## 🎯 Success Checklist

Before submission, ensure:

- [ ] All tests pass
- [ ] Validation script passes with no errors
- [ ] Screenshots generated for all required devices
- [ ] Metadata is complete and accurate
- [ ] Privacy policy is accessible
- [ ] App works completely offline
- [ ] Accessibility features tested
- [ ] TestFlight testing completed on real devices

## 📞 Support

For issues with this submission process:

1. Check the validation report for specific errors
2. Review the troubleshooting section above
3. Check the [App Store Checklist](./APP_STORE_CHECKLIST.md) for detailed requirements
4. Refer to [Apple's App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

**Good luck with your App Store submission!** 🎸📱✨
