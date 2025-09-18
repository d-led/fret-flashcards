#!/bin/bash

# Configure Xcode scheme for Fastlane snapshot
echo "🔧 Configuring Xcode scheme for Fastlane snapshot..."

cd ios/App

# Create a test target if it doesn't exist
echo "📱 Creating test target..."

# Add the test target to the project
cat > AppTests.swift << 'EOF'
//
//  AppTests.swift
//  String Homework Tutor
//
//  Created by fastlane snapshot
//  Copyright © 2025 Dmitry Ledentsov. All rights reserved.
//

import XCTest
@testable import App

class AppTests: XCTestCase {
    
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
        
        // Try to navigate to settings
        if app.buttons["Settings"].exists {
            app.buttons["Settings"].tap()
            sleep(1)
            snapshot("02Settings")
        }
        
        // Take another main screen screenshot
        snapshot("03MainScreen2")
    }
}
EOF

echo "✅ Test target created!"
echo "📝 Now run: cd ios && fastlane screenshots"
