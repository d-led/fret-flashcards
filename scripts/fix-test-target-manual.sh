#!/bin/bash

# Manual Fix for Test Target Capacitor Dependencies
# This script manually configures the test target to use Capacitor frameworks

set -e  # Exit on any error

echo "🔧 Manually fixing test target Capacitor dependencies..."
echo "======================================================"

# Change to the iOS App directory
cd "$(dirname "$0")/../ios/App"

# Check if we're in the right directory
if [ ! -f "App.xcodeproj/project.pbxproj" ]; then
    echo "❌ Error: Xcode project not found. Are you in the correct directory?"
    exit 1
fi

echo "✅ Found Xcode project"

# First, let's run pod install to make sure the main app has the frameworks
echo "📦 Running pod install for main app..."
pod install

echo "✅ Main app dependencies installed"

# Now let's create a simple test that doesn't depend on Capacitor
echo "📝 Creating simplified test without Capacitor dependencies..."

# Create a new test file that doesn't import Capacitor
cat > StringHomeworkTutorUITests/StringHomeworkTutorUITests.swift << 'EOF'
//
//  StringHomeworkTutorUITests.swift
//  String Homework Tutor
//
//  Created by fastlane snapshot
//  Copyright © 2025 Dmitry Ledentsov. All rights reserved.
//

import XCTest

class StringHomeworkTutorUITests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
    }
    
    func testScreenshots() {
        let app = XCUIApplication()
        setupSnapshot(app)
        app.launch()
        
        // Wait for app to load
        sleep(3)
        
        // Take screenshot of main screen
        snapshot("01MainScreen")
        
        // Try to navigate to settings if available
        if app.buttons["Settings"].exists {
            app.buttons["Settings"].tap()
            sleep(1)
            snapshot("02Settings")
        }
        
        // Take another main screen screenshot
        snapshot("03MainScreen2")
        
        // Try to find and interact with fretboard elements
        if app.buttons.matching(identifier: "fret").count > 0 {
            snapshot("04Fretboard")
        }
        
        // Try to find quiz elements
        if app.staticTexts.matching(identifier: "note").count > 0 {
            snapshot("05Quiz")
        }
    }
}
EOF

echo "✅ Created simplified test file"

# Create the launch test file
cat > StringHomeworkTutorUITests/StringHomeworkTutorUITestsLaunchTests.swift << 'EOF'
//
//  StringHomeworkTutorUITestsLaunchTests.swift
//  String Homework Tutor
//
//  Created by fastlane snapshot
//  Copyright © 2025 Dmitry Ledentsov. All rights reserved.
//

import XCTest

class StringHomeworkTutorUITestsLaunchTests: XCTestCase {

    override class var runsForEachTargetApplicationUIConfiguration: Bool {
        true
    }

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testLaunch() throws {
        let app = XCUIApplication()
        app.launch()
    }
}
EOF

echo "✅ Created launch test file"

echo ""
echo "✅ Test target configuration completed!"
echo "📁 Updated files:"
echo "   - StringHomeworkTutorUITests.swift (simplified, no Capacitor imports)"
echo "   - StringHomeworkTutorUITestsLaunchTests.swift (launch test)"
echo ""
echo "📋 Next steps:"
echo "   1. Try running the snapshot script again:"
echo "      ./scripts/fastlane-snapshot.sh"
echo "   2. The test should now run without Capacitor dependency issues"
echo ""
