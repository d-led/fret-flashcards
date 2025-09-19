//
//  StringHomeworkTutorUITests.swift
//  String Homework Tutor
//
//  Created by Dmitry Ledentsov on 2025.
//  Copyright © 2025 String Homework Tutor. All rights reserved.
//

import XCTest

@MainActor
final class StringHomeworkTutorUITests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // In UI tests it's important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }
    
    private func scrollMultipleTimes(_ app: XCUIApplication, direction: String, times: Int) {
        let scrollView = app.scrollViews.firstMatch
        if scrollView.exists {
            for _ in 1...times {
                if direction == "down" {
                    // To scroll down, we swipe up (content moves up, revealing content below)
                    scrollView.swipeUp()
                } else {
                    // To scroll up, we swipe down (content moves down, revealing content above)
                    scrollView.swipeDown()
                }
                sleep(1)
            }
        } else {
            // Fallback: scroll the main window
            for _ in 1...times {
                if direction == "down" {
                    // To scroll down, we swipe up (content moves up, revealing content below)
                    app.swipeUp()
                } else {
                    // To scroll up, we swipe down (content moves down, revealing content above)
                    app.swipeDown()
                }
                sleep(1)
            }
        }
    }
    
    private func tryToToggleScoreNotation(_ app: XCUIApplication) -> Bool {
        // Method 1: Try to find and click the label (most reliable for HTML checkboxes)
        let scoreNotationPredicate = NSPredicate(format: "label CONTAINS[c] %@", "score notation")
        
        // Try staticTexts (labels) first - this is most likely what we need to click
        var scoreNotationElement = app.staticTexts.containing(scoreNotationPredicate).firstMatch
        var scoreNotationExists = scoreNotationElement.waitForExistence(timeout: 2)
        
        // If not found as staticText, try checkBoxes
        if !scoreNotationExists {
            scoreNotationElement = app.checkBoxes.containing(scoreNotationPredicate).firstMatch
            scoreNotationExists = scoreNotationElement.waitForExistence(timeout: 2)
        }
        
        // If not found as checkbox, try as button
        if !scoreNotationExists {
            scoreNotationElement = app.buttons.containing(scoreNotationPredicate).firstMatch
            scoreNotationExists = scoreNotationElement.waitForExistence(timeout: 2)
        }
        
        // If not found as button, try as switch
        if !scoreNotationExists {
            scoreNotationElement = app.switches.containing(scoreNotationPredicate).firstMatch
            scoreNotationExists = scoreNotationElement.waitForExistence(timeout: 2)
        }
        
        // Try alternative text patterns
        if !scoreNotationExists {
            let altPredicate = NSPredicate(format: "label CONTAINS[c] %@", "Show score")
            scoreNotationElement = app.staticTexts.containing(altPredicate).firstMatch
            scoreNotationExists = scoreNotationElement.waitForExistence(timeout: 2)
        }
        
        if scoreNotationExists {
            print("Found score notation element: \(scoreNotationElement.label)")
            print("Element exists: \(scoreNotationElement.exists)")
            print("Element is hittable: \(scoreNotationElement.isHittable)")
            
            // Scroll a bit more to ensure the element is fully visible and clickable
            scrollMultipleTimes(app, direction: "down", times: 1)
            sleep(1)
            
            // Method 1: Try direct tap
            if scoreNotationElement.isHittable {
                print("Tapping score notation element directly: \(scoreNotationElement.label)")
                scoreNotationElement.tap()
                sleep(2)
                return verifyScoreNotationToggled(app)
            }
            
            // Method 2: Try coordinate-based tapping
            print("Element not hittable, trying coordinate tap")
            let frame = scoreNotationElement.frame
            let centerX = frame.midX
            let centerY = frame.midY
            print("Attempting coordinate tap at (\(centerX), \(centerY))")
            app.coordinate(withNormalizedOffset: CGVector(dx: centerX / app.frame.width, dy: centerY / app.frame.height)).tap()
            sleep(2)
            return verifyScoreNotationToggled(app)
        }
        
        return false
    }
    
    private func verifyScoreNotationToggled(_ app: XCUIApplication) -> Bool {
        // Check if the checkbox value changed or if music staff appears
        let scoreNotationPredicate = NSPredicate(format: "label CONTAINS[c] %@", "score notation")
        let checkbox = app.checkBoxes.containing(scoreNotationPredicate).firstMatch
        
        if checkbox.exists {
            // Check the value attribute - "1" means checked, "0" means unchecked
            if let value = checkbox.value as? String {
                let isChecked = value == "1"
                print("Checkbox value: \(value), isChecked: \(isChecked)")
                return isChecked
            }
        }
        
        // Alternative: Check if music staff appears
        let musicStaffPredicate = NSPredicate(format: "label CONTAINS[c] %@", "treble clef")
        let musicStaff = app.staticTexts.containing(musicStaffPredicate).firstMatch
        if musicStaff.waitForExistence(timeout: 3) {
            print("Music staff found - score notation is enabled")
            return true
        }
        
        print("Could not verify score notation toggle")
        return false
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testScreenshots() throws {
        let app = XCUIApplication()

        app.activate()
        setupSnapshot(app)
        sleep(15)
        
        // Wait for the banner to appear and tap it to enable audio - search by partial text (case-insensitive)
        let audioBannerPredicate = NSPredicate(format: "label CONTAINS[c] %@", "here to enable")
        let audioBanner = app.staticTexts.containing(audioBannerPredicate).firstMatch
        let audioBannerExists = audioBanner.waitForExistence(timeout: 15)
        print("Audio banner exists: \(audioBannerExists)")
        if audioBannerExists {
            print("Audio banner is hittable: \(audioBanner.isHittable)")
            audioBanner.tap()
            sleep(2)
        }
        
        // Scroll down to find the "Show score notation" checkbox - try multiple scroll amounts
        var scoreNotationFound = false
        var scrollAttempts = 0
        let maxScrollAttempts = 8  // Increased attempts for larger screens
        
        while !scoreNotationFound && scrollAttempts < maxScrollAttempts {
            scrollAttempts += 1
            print("Scroll attempt \(scrollAttempts) to find score notation")
            scrollMultipleTimes(app, direction: "down", times: 2)
            
            // Try multiple approaches to find and interact with the checkbox
            scoreNotationFound = tryToToggleScoreNotation(app)
            
            if !scoreNotationFound {
                print("Score notation not found on attempt \(scrollAttempts)")
            }
        }
        
        if !scoreNotationFound {
            print("Score notation switch not found after \(maxScrollAttempts) scroll attempts")
            // Try one more time with different approach - scroll to very bottom and work backwards
            print("Trying alternative approach - scrolling to bottom and working backwards")
            scrollMultipleTimes(app, direction: "down", times: 10)
            sleep(2)
            
            scoreNotationFound = tryToToggleScoreNotation(app)
        }

        // Verify that score notation was actually enabled by checking for music staff
        print("Verifying score notation was enabled...")
        let musicStaffPredicate = NSPredicate(format: "label CONTAINS[c] %@", "treble clef")
        let musicStaff = app.staticTexts.containing(musicStaffPredicate).firstMatch
        let musicStaffExists = musicStaff.waitForExistence(timeout: 5)
        
        if musicStaffExists {
            print("Music staff found - score notation is enabled")
        } else {
            print("Music staff not found - score notation may not be enabled")
            // Try to find any musical notation elements
            let notationPredicate = NSPredicate(format: "label CONTAINS[c] %@", "clef")
            let notation = app.staticTexts.containing(notationPredicate).firstMatch
            if notation.waitForExistence(timeout: 2) {
                print("Found musical notation element: \(notation.label)")
            }
        }
        
        // Now scroll back up to show the main content better for the snapshot
        scrollMultipleTimes(app, direction: "up", times: 6)  // Increased scroll up
        sleep(3)  // Increased sleep time
        
        snapshot("01MainScreen")
    }

//    func testLaunchPerformance() throws {
        // Temporarily disabled to avoid repeated launches during testing
        // if #available(macOS 10.15, iOS 13.0, tvOS 13.0, watchOS 7.0, *) {
        //     // This measures how long it takes to launch your application.
        //     measure(metrics: [XCTApplicationLaunchMetric()]) {
        //         XCUIApplication().launch()
        //     }
        // }
//    }
}
