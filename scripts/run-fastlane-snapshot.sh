#!/bin/bash

# Run Fastlane Snapshot Script
# This script follows the fastlane documentation to run snapshot correctly

set -e  # Exit on any error

echo "📱 Running Fastlane Snapshot for String Homework Tutor"
echo "====================================================="

# Change to the iOS directory where fastlane is configured
cd "$(dirname "$0")/../ios"

# Check if we're in the right directory
if [ ! -f "fastlane/Fastfile" ]; then
    echo "❌ Error: Fastfile not found. Are you in the correct directory?"
    exit 1
fi

echo "✅ Found fastlane configuration files"

# Check if Snapfile exists
if [ ! -f "fastlane/Snapfile" ]; then
    echo "❌ Error: Snapfile not found. This is required for snapshot configuration."
    exit 1
fi

echo "✅ Found Snapfile configuration"

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode command line tools not found. Please install Xcode."
    exit 1
fi

echo "✅ Xcode command line tools found"

# Check if fastlane is installed
if ! command -v fastlane &> /dev/null; then
    echo "❌ Error: fastlane not found. Please install fastlane:"
    echo "   gem install fastlane"
    exit 1
fi

echo "✅ fastlane found"

# Check if the App scheme exists
if ! xcodebuild -list -project App/App.xcodeproj | grep -q "App"; then
    echo "❌ Error: App scheme not found in Xcode project"
    exit 1
fi

echo "✅ App scheme found"

# Check if the test scheme exists
if ! xcodebuild -list -project App/App.xcodeproj | grep -q "StringHomeworkTutorUITests"; then
    echo "❌ Error: StringHomeworkTutorUITests scheme not found in Xcode project"
    exit 1
fi

echo "✅ Test scheme found"

# Create screenshots directory if it doesn't exist
mkdir -p screenshots
echo "✅ Screenshots directory ready"

# Check if simulators are available
echo "🔍 Checking available simulators..."
available_devices=$(xcrun simctl list devices available | grep -E "(iPhone|iPad)" | wc -l)
if [ "$available_devices" -eq 0 ]; then
    echo "⚠️  Warning: No iOS simulators found. You may need to install simulators in Xcode."
    echo "   Open Xcode > Preferences > Components > Simulators"
fi

echo "📸 Starting screenshot generation..."
echo "   This may take several minutes depending on the number of devices and screenshots."
echo "   Following fastlane documentation: https://docs.fastlane.tools/getting-started/ios/screenshots/"

# Run fastlane snapshot
# The configuration is handled by Snapfile, so we just call the lane
fastlane screenshots

echo ""
echo "✅ Screenshot generation completed!"
echo "📁 Screenshots saved to: ios/screenshots/"
echo ""
echo "📋 Next steps:"
echo "   1. Review the generated screenshots"
echo "   2. Upload to App Store Connect if they look good"
echo "   3. Run 'fastlane release' to build and upload the app"
echo ""
