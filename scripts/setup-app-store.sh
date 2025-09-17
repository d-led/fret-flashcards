#!/bin/bash

# App Store Preparation Setup Script for String Homework Tutor
# This script installs all necessary tools for iOS App Store submission

set -e

echo "🍎 Setting up App Store preparation tools for String Homework Tutor..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only. iOS development requires macOS."
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed. Please install Xcode from the Mac App Store."
    exit 1
fi

echo "✅ Xcode found"

# Install Homebrew if not installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew already installed"
fi

# Install CocoaPods
echo "📦 Installing CocoaPods..."
if ! command -v pod &> /dev/null; then
    brew install cocoapods
else
    echo "✅ CocoaPods already installed"
fi

# Install Fastlane
echo "📦 Installing Fastlane..."
if ! command -v fastlane &> /dev/null; then
    sudo gem install fastlane
else
    echo "✅ Fastlane already installed"
fi

# Install Fastlane Snapshot plugin
echo "📦 Installing Fastlane Snapshot plugin..."
if ! gem list fastlane-plugin-snapshot &> /dev/null; then
    sudo gem install fastlane-plugin-snapshot
else
    echo "✅ Fastlane Snapshot plugin already installed"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p ios/fastlane
mkdir -p scripts
mkdir -p app-store-assets

# Make scripts executable
chmod +x scripts/app-store-prep.js

echo "✅ Directories created"

# Verify iOS project exists
if [ ! -d "ios/App" ]; then
    echo "📱 Building iOS project..."
    npm run build:mobile
else
    echo "✅ iOS project found"
fi

# Install iOS dependencies
echo "📱 Installing iOS dependencies..."
cd ios/App
pod install
cd ../..

echo "✅ iOS dependencies installed"

# Test Fastlane configuration
echo "🧪 Testing Fastlane configuration..."
cd ios
if [ -f "fastlane/Snapfile" ]; then
    echo "✅ Fastlane configuration found"
else
    echo "❌ Fastlane configuration not found. Please check the setup."
    exit 1
fi
cd ..

echo ""
echo "🎉 App Store preparation setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm run app-store:prep' to generate all assets"
echo "2. Run 'npm run app-store:screenshots' to generate screenshots"
echo "3. Check the generated assets in the 'ios/screenshots' directory"
echo "4. Upload to App Store Connect"
echo "5. Submit for review"
echo ""
echo "📚 Documentation:"
echo "- App Store preparation guide: docs/development/ios-app-store-prep.md"
echo "- Submission checklist: docs/development/APP_STORE_CHECKLIST.md"
echo "- Privacy policy: docs/development/privacy-policy.md"
echo "- App Store metadata: app-store-metadata.json"
echo ""
echo "🚀 Ready for App Store submission! Good luck! 🎸📱✨"
