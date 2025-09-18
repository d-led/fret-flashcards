#!/bin/bash

# Fix Capacitor Dependencies for Test Target
# This script updates the Podfile to include Capacitor dependencies for the test target

set -e  # Exit on any error

echo "🔧 Fixing Capacitor dependencies for test target..."
echo "=================================================="

# Change to the iOS App directory
cd "$(dirname "$0")/../ios/App"

# Check if Podfile exists
if [ ! -f "Podfile" ]; then
    echo "❌ Error: Podfile not found. Are you in the correct directory?"
    exit 1
fi

echo "✅ Found Podfile"

# Create a backup of the original Podfile
cp Podfile Podfile.backup
echo "✅ Created backup: Podfile.backup"

# Update the Podfile to include test target
cat > Podfile << 'EOF'
require_relative '../../node_modules/@capacitor/ios/scripts/pods_helpers'

platform :ios, '14.0'
use_frameworks!

# workaround to avoid Xcode caching of Pods that requires
# Product -> Clean Build Folder after new Cordova plugins installed
# Requires CocoaPods 1.6 or newer
install! 'cocoapods', :disable_input_output_paths => true

def capacitor_pods
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorApp', :path => '../../node_modules/@capacitor/app'
  pod 'CapacitorHaptics', :path => '../../node_modules/@capacitor/haptics'
  pod 'CapacitorKeyboard', :path => '../../node_modules/@capacitor/keyboard'
  pod 'CapacitorPreferences', :path => '../../node_modules/@capacitor/preferences'
  pod 'CapacitorSplashScreen', :path => '../../node_modules/@capacitor/splash-screen'
  pod 'CapacitorStatusBar', :path => '../../node_modules/@capacitor/status-bar'
end

target 'App' do
  capacitor_pods
  # Add your Pods here
end

# Add Capacitor dependencies to the test target
target 'StringHomeworkTutorUITests' do
  capacitor_pods
end

post_install do |installer|
  assertDeploymentTarget(installer)
end
EOF

echo "✅ Updated Podfile to include test target dependencies"

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "❌ Error: CocoaPods not found. Please install CocoaPods:"
    echo "   sudo gem install cocoapods"
    exit 1
fi

echo "✅ CocoaPods found"

# Run pod install
echo "📦 Running pod install..."
pod install

echo ""
echo "✅ Capacitor dependencies fixed for test target!"
echo "📁 Updated files:"
echo "   - Podfile (with test target dependencies)"
echo "   - Podfile.lock (updated)"
echo "   - Pods/ (updated frameworks)"
echo ""
echo "📋 Next steps:"
echo "   1. Try running the snapshot script again:"
echo "      ./scripts/fastlane-snapshot.sh"
echo "   2. The test target should now have access to Capacitor frameworks"
echo ""
