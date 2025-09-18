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
        let maxScrollAttempts = 5
        
        while !scoreNotationFound && scrollAttempts < maxScrollAttempts {
            scrollAttempts += 1
            print("Scroll attempt \(scrollAttempts) to find score notation")
            scrollMultipleTimes(app, direction: "down", times: 2)
            
            // Try multiple element types for score notation
            let scoreNotationPredicate = NSPredicate(format: "label CONTAINS[c] %@", "score notation")
            
            // Try checkBoxes first
            var scoreNotationSwitch = app.checkBoxes.containing(scoreNotationPredicate).firstMatch
            var scoreNotationExists = scoreNotationSwitch.waitForExistence(timeout: 3)
            
            // If not found as checkbox, try as button
            if !scoreNotationExists {
                scoreNotationSwitch = app.buttons.containing(scoreNotationPredicate).firstMatch
                scoreNotationExists = scoreNotationSwitch.waitForExistence(timeout: 3)
            }
            
            // If not found as button, try as switch
            if !scoreNotationExists {
                scoreNotationSwitch = app.switches.containing(scoreNotationPredicate).firstMatch
                scoreNotationExists = scoreNotationSwitch.waitForExistence(timeout: 3)
            }
            
            if scoreNotationExists {
                print("Found score notation element: \(scoreNotationSwitch.label)")
                // Scroll a bit more to ensure the element is fully visible and clickable
                scrollMultipleTimes(app, direction: "down", times: 1)
                sleep(1)
                
                if scoreNotationSwitch.isHittable {
                    print("Tapping score notation switch: \(scoreNotationSwitch.label)")
                    scoreNotationSwitch.tap()
                    sleep(2)
                    scoreNotationFound = true
                } else {
                    print("Score notation switch found but not hittable, trying to scroll more")
                }
            } else {
                print("Score notation not found on attempt \(scrollAttempts)")
            }
        }
        
        if !scoreNotationFound {
            print("Score notation switch not found after \(maxScrollAttempts) scroll attempts")
        }

        // Now scroll back up to show the main content better for the snapshot
        scrollMultipleTimes(app, direction: "up", times: 5)
        sleep(2)
        
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
