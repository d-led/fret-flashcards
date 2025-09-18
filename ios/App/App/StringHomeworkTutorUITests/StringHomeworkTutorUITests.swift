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

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testScreenshots() throws {
        let app = XCUIApplication()

        app.activate()
        setupSnapshot(app)
        sleep(15)
        app/*@START_MENU_TOKEN@*/.staticTexts["🔊 Click here to enable audio"]/*[[".otherElements[\"banner\"].staticTexts",".otherElements.staticTexts[\"🔊 Click here to enable audio\"]",".staticTexts[\"🔊 Click here to enable audio\"]"],[[[-1,2],[-1,1],[-1,0]]],[0]]@END_MENU_TOKEN@*/.firstMatch.tap()
        sleep(1)
        app/*@START_MENU_TOKEN@*/.switches["Show score notation"]/*[[".otherElements.switches[\"Show score notation\"]",".switches[\"Show score notation\"]"],[[[-1,1],[-1,0]]],[0]]@END_MENU_TOKEN@*/.firstMatch.tap()
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
