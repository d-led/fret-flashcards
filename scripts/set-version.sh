#!/bin/bash

# set-version.sh - Update version numbers across the entire project
# Usage: ./scripts/set-version.sh 1.0.1

set -e  # Exit on any error

if [ $# -ne 1 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.1"
    exit 1
fi

NEW_VERSION="$1"
OLD_VERSION=$(node -p "require('./package.json').version")

# Validate version format (basic check)
if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format X.Y.Z (e.g., 1.0.1)"
    exit 1
fi

echo "🔄 Updating version from $OLD_VERSION to $NEW_VERSION..."

# Extract version components for build number calculation
IFS='.' read -ra VERSION_PARTS <<< "$NEW_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Calculate build number (major * 10000 + minor * 100 + patch)
BUILD_NUMBER=$((MAJOR * 10000 + MINOR * 100 + PATCH))

echo "📱 Build number will be: $BUILD_NUMBER"

# Update main package.json
echo "📦 Updating main package.json..."
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Note: quasar-project has been removed
echo "📦 Skipping quasar-project (removed)..."

# Update app-store-metadata.json
echo "📱 Updating app-store-metadata.json..."
sed -i '' "s/\"number\": \"[^\"]*\"/\"number\": \"$NEW_VERSION\"/" app-store-metadata.json

# Update iOS Xcode project
echo "🍎 Updating iOS Xcode project..."
# Update MARKETING_VERSION
sed -i '' "s/MARKETING_VERSION = [^;]*/MARKETING_VERSION = $NEW_VERSION/" ios/App/App.xcodeproj/project.pbxproj
# Update CURRENT_PROJECT_VERSION (build number)
sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*/CURRENT_PROJECT_VERSION = $BUILD_NUMBER/" ios/App/App.xcodeproj/project.pbxproj

# Update Android build.gradle
echo "🤖 Updating Android build.gradle..."
sed -i '' "s/versionName \"[^\"]*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle
sed -i '' "s/versionCode [0-9]*/versionCode $BUILD_NUMBER/" android/app/build.gradle

echo ""
echo "✅ Version update complete!"
echo "📊 Summary:"
echo "   • Version: $OLD_VERSION → $NEW_VERSION"
echo "   • Build number: $BUILD_NUMBER"
echo "   • Files updated:"
echo "     - package.json"
echo "     - quasar-project/package.json (removed)"
echo "     - app-store-metadata.json"
echo "     - ios/App/App.xcodeproj/project.pbxproj"
echo "     - android/app/build.gradle"
echo ""
echo "🚀 Next steps:"
echo "   1. Commit changes: git add . && git commit -m \"Bump version to $NEW_VERSION\""
echo "   2. Upload screenshots: npm run app-store:screenshots:add"
echo "   3. Build and upload: npm run ios:build && npm run android:build"
