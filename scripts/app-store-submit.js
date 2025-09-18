#!/usr/bin/env node

/**
 * App Store Submission Script for String Homework Tutor
 * Handles the complete submission process including TestFlight and App Store
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class AppStoreSubmit {
  constructor() {
    this.projectRoot = process.cwd();
    this.iosPath = path.join(this.projectRoot, "ios");
    this.metadataPath = path.join(this.projectRoot, "app-store-metadata.json");
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: "📱",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      rocket: "🚀"
    }[type] || "📱";

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkPrerequisites() {
    this.log("Checking submission prerequisites...");

    // Check if we're in the right directory
    if (!fs.existsSync("package.json")) {
      throw new Error("Not in project root directory");
    }

    // Check if iOS project exists
    if (!fs.existsSync(this.iosPath)) {
      throw new Error('iOS project not found. Run "npm run build:mobile" first.');
    }

    // Check if fastlane is installed
    try {
      execSync("which fastlane", { stdio: "pipe" });
    } catch (error) {
      throw new Error("Fastlane not installed. Run: sudo gem install fastlane");
    }

    // Check if screenshots exist
    const screenshotsPath = path.join(this.iosPath, "screenshots");
    if (!fs.existsSync(screenshotsPath)) {
      throw new Error("Screenshots not found. Run 'npm run app-store:screenshots' first.");
    }

    this.log("Prerequisites check passed", "success");
  }

  async buildForSubmission(action = "testflight") {
    this.log("Building app for App Store submission...");

    try {
      // Build the web app
      execSync("npm run build", { stdio: "inherit" });
      
      // Only generate assets for App Store submission, not TestFlight
      if (action === "appstore") {
        execSync("npm run generate:assets", { stdio: "inherit" });
      } else {
        this.log("Skipping asset generation for TestFlight (using existing assets)", "info");
      }
      
      // Sync with iOS
      execSync("npx cap sync ios", { stdio: "inherit" });
      
      this.log("App built successfully", "success");
    } catch (error) {
      throw new Error("Failed to build app: " + error.message);
    }
  }

  async uploadToTestFlight() {
    this.log("Uploading to TestFlight...");

    try {
      process.chdir(this.iosPath);
      execSync("fastlane testflight", { stdio: "inherit" });
      process.chdir(this.projectRoot);
      
      this.log("TestFlight upload completed", "success");
    } catch (error) {
      process.chdir(this.projectRoot);
      throw new Error("Failed to upload to TestFlight: " + error.message);
    }
  }

  async uploadToAppStore() {
    this.log("Uploading to App Store Connect...");

    try {
      process.chdir(this.iosPath);
      execSync("fastlane release", { stdio: "inherit" });
      process.chdir(this.projectRoot);
      
      this.log("App Store upload completed", "success");
    } catch (error) {
      process.chdir(this.projectRoot);
      throw new Error("Failed to upload to App Store: " + error.message);
    }
  }

  async generateSubmissionReport() {
    this.log("Generating submission report...");

    const report = {
      timestamp: new Date().toISOString(),
      app_name: "String Homework Tutor",
      bundle_id: "com.dled.stringhomeworktutor",
      version: "1.0.0",
      submission_type: "App Store",
      status: "Ready for Review",
      assets: {
        screenshots: fs.existsSync(path.join(this.iosPath, "screenshots")),
        app_icon: fs.existsSync(path.join(this.iosPath, "App/App/Assets.xcassets/AppIcon.appiconset")),
        metadata: fs.existsSync(this.metadataPath),
        privacy_policy: fs.existsSync(path.join(this.projectRoot, "docs/development/privacy-policy.md"))
      },
      next_steps: [
        "Monitor App Store Connect for review status",
        "Respond to any reviewer feedback",
        "Prepare for potential rejection and resubmission",
        "Set up app analytics and monitoring"
      ]
    };

    const reportPath = path.join(this.projectRoot, "app-store-submission-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Submission report saved to: ${reportPath}`, "success");
  }

  async run(action = "testflight") {
    try {
      this.log(`🚀 Starting App Store submission process: ${action}...`);

      await this.checkPrerequisites();
      await this.buildForSubmission(action);

      if (action === "testflight") {
        await this.uploadToTestFlight();
      } else if (action === "appstore") {
        await this.uploadToAppStore();
      } else {
        throw new Error("Invalid action. Use 'testflight' or 'appstore'");
      }

      await this.generateSubmissionReport();

      this.log("🎉 App Store submission completed successfully!", "success");
      this.log("📱 Check App Store Connect for processing status", "info");
      
    } catch (error) {
      this.log(`Error: ${error.message}`, "error");
      process.exit(1);
    }
  }
}

// Run the script
if (require.main === module) {
  const action = process.argv[2] || "testflight";
  const submit = new AppStoreSubmit();
  submit.run(action);
}

module.exports = AppStoreSubmit;
