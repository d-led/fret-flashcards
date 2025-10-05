#!/bin/bash

# bump-build.sh - Increment only the build number (CURRENT_PROJECT_VERSION)
# This script only updates the build number without changing the app version
# Usage: ./scripts/bump-build.sh

set -e  # Exit on any error

echo "🔄 Incrementing build number..."

# Get current build number from iOS project
CURRENT_BUILD=$(grep -o "CURRENT_PROJECT_VERSION = [0-9]*" ios/App/App.xcodeproj/project.pbxproj | head -1 | grep -o "[0-9]*")
if [ -z "$CURRENT_BUILD" ]; then
    CURRENT_BUILD=10000  # Default starting build number
fi

# Increment build number
NEW_BUILD=$((CURRENT_BUILD + 1))

echo "📱 Build number: $CURRENT_BUILD → $NEW_BUILD"

# Update iOS Xcode project - CURRENT_PROJECT_VERSION (build number)
echo "🍎 Updating iOS Xcode project build number..."
sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*/CURRENT_PROJECT_VERSION = $NEW_BUILD/" ios/App/App.xcodeproj/project.pbxproj

echo ""
echo "✅ Build number increment complete!"
echo "📊 Summary:"
echo "   • Build number: $CURRENT_BUILD → $NEW_BUILD"
echo "   • Files updated:"
echo "     - ios/App/App.xcodeproj/project.pbxproj"
echo ""
echo "🚀 Next steps:"
echo "   1. Commit changes: git add ios/App/App.xcodeproj/project.pbxproj && git commit -m \"Bump build number to $NEW_BUILD\""
echo "   2. Build and test: npm run ios:build"
