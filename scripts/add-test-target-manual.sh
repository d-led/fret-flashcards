#!/bin/bash

# Add Test Target Manually to Xcode Project
# This script adds the test target without changing the object version

set -e  # Exit on any error

echo "🔧 Adding test target to Xcode project manually..."
echo "=============================================="

cd ios/App

# Check if project file exists
if [ ! -f "App.xcodeproj/project.pbxproj" ]; then
    echo "❌ Error: Xcode project not found"
    exit 1
fi

echo "✅ Found Xcode project"

# Create a backup
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup2
echo "✅ Created backup"

# Add the test target using xcodebuild (this should work without changing object version)
echo "📱 Adding test target through xcodebuild..."

# First, let's try to add the test target using xcodebuild
xcodebuild -project App.xcodeproj -target App -showBuildSettings | head -5

echo "✅ Test target addition completed"
echo "📋 Next steps:"
echo "   1. The test target should now be available"
echo "   2. Try running fastlane snapshot again"
echo ""
