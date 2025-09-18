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
                if direction == "up" {
                    scrollView.swipeUp()
                } else {
                    scrollView.swipeDown()
                }
                sleep(1)
            }
        } else {
            // Fallback: scroll the main window
            for _ in 1...times {
                if direction == "up" {
                    app.swipeUp()
                } else {
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
            sleep(1)
        }
        
        // First scroll up to find the "Show score notation" switch
        scrollMultipleTimes(app, direction: "up", times: 5)
        
        // Wait for the "Show score notation" checkbox to appear and tap it - try multiple approaches
        var scoreNotationSwitch: XCUIElement?
        var scoreNotationExists = false
        
        // Try by element ID first
        scoreNotationSwitch = app.checkBoxes["show-score-notation"]
        scoreNotationExists = scoreNotationSwitch?.waitForExistence(timeout: 10) ?? false
        
        // If not found by ID, try by label text
        if !scoreNotationExists {
            let scoreNotationPredicate = NSPredicate(format: "label CONTAINS[c] %@", "Show score notation")
            scoreNotationSwitch = app.checkBoxes.containing(scoreNotationPredicate).firstMatch
            scoreNotationExists = scoreNotationSwitch?.waitForExistence(timeout: 10) ?? false
        }
        
        // If still not found, try as a button
        if !scoreNotationExists {
            scoreNotationSwitch = app.buttons["show-score-notation"]
            scoreNotationExists = scoreNotationSwitch?.waitForExistence(timeout: 10) ?? false
        }
        
        if scoreNotationExists && scoreNotationSwitch != nil {
            // Scroll a bit more to ensure the checkbox is fully visible and clickable
            scrollMultipleTimes(app, direction: "up", times: 2)
            sleep(1)
            scoreNotationSwitch!.tap()
            sleep(1)
        }

        // Now scroll back down to show the main content better
        scrollMultipleTimes(app, direction: "down", times: 3)
        sleep(1)
        
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
