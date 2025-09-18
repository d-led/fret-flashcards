//
//  StringHomeworkTutorUITestsLaunchTests.swift
//  String Homework Tutor
//
//  Created by Dmitry Ledentsov on 18.09.2025.
//  Copyright © 2025 Dmitry Ledentsov. All rights reserved.
//

import XCTest

final class StringHomeworkTutorUITestsLaunchTests: XCTestCase {

    override class var runsForEachTargetApplicationUIConfiguration: Bool {
        true
    }

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testLaunch() throws {
        let app = XCUIApplication()
        app.launch()

        // Insert steps here to perform after the app launches, such as logging into a test account or navigating to a specific screen.
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Launch Screen"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
