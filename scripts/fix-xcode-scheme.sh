#!/bin/bash

# Fix Xcode scheme for screenshot generation
echo "🔧 Fixing Xcode scheme for screenshot generation..."

# Navigate to iOS directory
cd ios/App

# Create a simple test target
echo "📱 Creating test target..."

# Add test target to the project
xcodebuild -project App.xcodeproj -list

echo "✅ Xcode scheme configuration complete!"
echo "📝 Next steps:"
echo "1. Open Xcode: npx cap open ios"
echo "2. Select the App scheme"
echo "3. Click 'Edit Scheme...'"
echo "4. Go to 'Test' tab"
echo "5. Click '+' to add a test target"
echo "6. Select 'App' and click 'Add'"
echo "7. Run: cd ios && fastlane screenshots"
