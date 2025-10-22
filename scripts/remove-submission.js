#!/usr/bin/env node

/**
 * Remove App Store Submission Script for String Homework Tutor
 * Removes version 1.0.1 from App Store review using App Store Connect API
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class RemoveSubmission {
  constructor() {
    this.projectRoot = process.cwd();
    this.appIdentifier = "com.dled.stringhomeworktutor";
    this.version = "1.0.1";
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: "📱",
        success: "✅",
        warning: "⚠️",
        error: "❌",
        rocket: "🚀",
      }[type] || "📱";

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkEnvironment() {
    this.log("Checking environment variables...");

    const requiredEnvVars = ["APPLE_ID", "APPLE_TEAM_ID"];

    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
    }

    this.log("Environment variables check passed", "success");
  }

  async removeSubmissionViaFastlane() {
    this.log("Attempting to remove submission using fastlane...");

    try {
      // Use fastlane's spaceship to remove the submission
      const fastlaneScript = `
        require 'spaceship'
        
        # Login to App Store Connect
        Spaceship::ConnectAPI.login("#{ENV['APPLE_ID']}")
        
        # Find the app
        app = Spaceship::ConnectAPI::App.find("#{this.appIdentifier}")
        puts "Found app: #{app.name}"
        
        # Get the app version
        app_version = app.get_app_store_versions.first
        if app_version
          puts "Found app version: #{app_version.version_string}"
          
          # Check if there's a submission
          submission = app_version.get_app_store_version_submission
          if submission
            puts "Found submission with state: #{submission.app_store_review_state}"
            
            # Try to remove the submission
            begin
              submission.delete!
              puts "Successfully removed submission from review"
            rescue => e
              puts "Failed to remove submission: #{e.message}"
              puts "You may need to use the web interface instead"
            end
          else
            puts "No submission found for this version"
          end
        else
          puts "No app version found"
        end
      `;

      // Write temporary script
      const scriptPath = path.join(this.projectRoot, "temp_remove_submission.rb");
      fs.writeFileSync(scriptPath, fastlaneScript);

      // Execute the script
      execSync(`ruby "${scriptPath}"`, { stdio: "inherit" });

      // Clean up
      fs.unlinkSync(scriptPath);

      this.log("Fastlane script completed", "success");
    } catch (error) {
      this.log(`Fastlane approach failed: ${error.message}`, "warning");
      this.log("Falling back to manual instructions", "info");
    }
  }

  async generateInstructions() {
    this.log("Generating manual removal instructions...");

    const instructions = {
      timestamp: new Date().toISOString(),
      app_name: "String Homework Tutor",
      bundle_id: this.appIdentifier,
      version: this.version,
      action: "Remove from Review",
      methods: {
        web_interface: {
          steps: [
            "1. Go to https://appstoreconnect.apple.com/",
            "2. Log in with your Apple ID",
            "3. Select 'String Homework Tutor' from the Apps section",
            "4. Click on version 1.0.1 in the sidebar",
            "5. Click 'Remove this version from review' at the top",
            "6. Confirm by clicking 'Remove' in the dialog",
          ],
          note: "This will change the status to 'Developer Rejected'",
        },
        api_method: {
          description: "Using App Store Connect API DELETE endpoint",
          endpoint: "DELETE /v1/appStoreVersionSubmissions/{id}",
          note: "Only works if review hasn't started yet",
        },
      },
      current_status: "Waiting for review or In Review",
      next_steps: [
        "Remove the submission using the web interface",
        "Fix any issues that caused the need to remove",
        "Resubmit when ready (review process will start over)",
        "Monitor App Store Connect for new review status",
      ],
    };

    const instructionsPath = path.join(this.projectRoot, "remove-submission-instructions.json");
    fs.writeFileSync(instructionsPath, JSON.stringify(instructions, null, 2));

    this.log(`Instructions saved to: ${instructionsPath}`, "success");
  }

  async run() {
    try {
      this.log(`🚀 Starting removal process for version ${this.version}...`);

      await this.checkEnvironment();
      await this.removeSubmissionViaFastlane();
      await this.generateInstructions();

      this.log("📋 Manual removal instructions generated", "info");
      this.log("🌐 Use the web interface method for guaranteed success", "info");
      this.log("📱 Check App Store Connect after removal", "info");
    } catch (error) {
      this.log(`Error: ${error.message}`, "error");
      process.exit(1);
    }
  }
}

// Run the script
if (require.main === module) {
  const remover = new RemoveSubmission();
  remover.run();
}

module.exports = RemoveSubmission;
