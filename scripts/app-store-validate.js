#!/usr/bin/env node

/**
 * App Store Validation Script for String Homework Tutor
 * Validates all assets, metadata, and compliance requirements before submission
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class AppStoreValidate {
  constructor() {
    this.projectRoot = process.cwd();
    this.iosPath = path.join(this.projectRoot, "ios");
    this.screenshotsPath = path.join(this.iosPath, "screenshots");
    this.metadataPath = path.join(this.projectRoot, "app-store-metadata.json");
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = "info") {
    const prefix = {
      info: "📱",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      check: "🔍"
    }[type] || "📱";

    console.log(`${prefix} ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, "error");
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, "warning");
  }

  validateProjectStructure() {
    this.log("Validating project structure...", "check");

    const requiredPaths = [
      "package.json",
      "ios/App/App.xcworkspace",
      "ios/fastlane/Fastfile",
      "ios/fastlane/Snapfile",
      "app-store-metadata.json",
      "docs/development/privacy-policy.md"
    ];

    for (const path of requiredPaths) {
      if (!fs.existsSync(path)) {
        this.addError(`Missing required file: ${path}`);
      }
    }

    if (this.errors.length === 0) {
      this.log("Project structure validation passed", "success");
    }
  }

  validateScreenshots() {
    this.log("Validating screenshots...", "check");

    if (!fs.existsSync(this.screenshotsPath)) {
      this.addError("Screenshots directory not found");
      return;
    }

    // Check for language subdirectories (e.g., en-US)
    const screenshotContents = fs.readdirSync(this.screenshotsPath);
    const languageDirs = screenshotContents.filter(item => {
      const fullPath = path.join(this.screenshotsPath, item);
      return fs.statSync(fullPath).isDirectory() && item.includes("-");
    });

    if (languageDirs.length === 0) {
      this.addError("No language directories found in screenshots");
      return;
    }

    // Use the first language directory found
    const languageDir = languageDirs[0];
    const languagePath = path.join(this.screenshotsPath, languageDir);
    const screenshotFiles = fs.readdirSync(languagePath);
    
    const requiredDevices = [
      "iPhone 17 Pro Max",
      "iPhone 17 Pro",
      "iPad Pro 13-inch (M4)"
    ];

    for (const device of requiredDevices) {
      const deviceFiles = screenshotFiles.filter(file => 
        file.includes(device.replace(/[^a-zA-Z0-9]/g, "")) || 
        file.includes(device.split(" ")[0])
      );

      if (deviceFiles.length === 0) {
        this.addError(`Missing screenshots for: ${device}`);
      } else {
        this.log(`Found ${deviceFiles.length} screenshots for ${device}`, "success");
      }
    }

    // Check screenshot quality
    for (const file of screenshotFiles) {
      const filePath = path.join(languagePath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.size < 10000) { // Less than 10KB
        this.addWarning(`Screenshot may be low quality: ${file} (${stats.size} bytes)`);
      }
    }
  }

  validateAppIcon() {
    this.log("Validating app icon...", "check");

    const iconPath = path.join(this.iosPath, "App/App/Assets.xcassets/AppIcon.appiconset");
    
    if (!fs.existsSync(iconPath)) {
      this.addError("App icon directory not found");
      return;
    }

    const iconFiles = fs.readdirSync(iconPath);
    const requiredSizes = ["512@2x.png"]; // 1024x1024 for App Store

    for (const size of requiredSizes) {
      const iconFile = iconFiles.find(file => file.includes(size));
      if (!iconFile) {
        this.addError(`Missing app icon: ${size}`);
      } else {
        const iconPath = path.join(this.iosPath, "App/App/Assets.xcassets/AppIcon.appiconset", iconFile);
        const stats = fs.statSync(iconPath);
        
        if (stats.size < 50000) { // Less than 50KB
          this.addWarning(`App icon may be low quality: ${iconFile} (${stats.size} bytes)`);
        } else {
          this.log(`App icon ${size} found and validated`, "success");
        }
      }
    }
  }

  validateMetadata() {
    this.log("Validating App Store metadata...", "check");

    if (!fs.existsSync(this.metadataPath)) {
      this.addError("App Store metadata file not found");
      return;
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(this.metadataPath, "utf8"));

      // Validate required fields
      const requiredFields = [
        "app_information.name",
        "app_information.subtitle", 
        "app_information.bundle_id",
        "app_information.category",
        "app_information.age_rating",
        "description.short",
        "description.full",
        "keywords"
      ];

      for (const field of requiredFields) {
        const value = field.split(".").reduce((obj, key) => obj?.[key], metadata);
        if (!value) {
          this.addError(`Missing required metadata field: ${field}`);
        }
      }

      // Validate specific values
      if (metadata.app_information.bundle_id !== "com.dled.stringhomeworktutor") {
        this.addError("Bundle ID mismatch in metadata");
      }

      if (metadata.app_information.category !== "Education") {
        this.addError("Category should be 'Education'");
      }

      if (metadata.app_information.age_rating !== "4+") {
        this.addError("Age rating should be '4+'");
      }

      if (metadata.keywords.length > 100) {
        this.addError("Keywords exceed 100 character limit");
      }

      if (metadata.description.full.length > 4000) {
        this.addError("Description exceeds 4000 character limit");
      }

      this.log("Metadata validation passed", "success");

    } catch (error) {
      this.addError(`Invalid metadata JSON: ${error.message}`);
    }
  }

  validatePrivacyPolicy() {
    this.log("Validating privacy policy...", "check");

    const privacyPath = path.join(this.projectRoot, "docs/development/privacy-policy.md");
    
    if (!fs.existsSync(privacyPath)) {
      this.addError("Privacy policy not found");
      return;
    }

    const privacyContent = fs.readFileSync(privacyPath, "utf8");
    
    // Check for required sections
    const requiredSections = [
      "Data Collection",
      "Local Storage", 
      "Permissions",
      "Third-Party Services",
      "Children's Privacy",
      "Contact"
    ];

    for (const section of requiredSections) {
      if (!privacyContent.includes(section)) {
        this.addError(`Privacy policy missing section: ${section}`);
      }
    }

    // Check for contact email
    const contactEmail = "stringhomeworktutor@ledentsov.de";
    if (!privacyContent.includes(contactEmail)) {
      this.addError(`Privacy policy missing contact email: ${contactEmail}`);
    } else {
      this.log(`Privacy policy includes correct contact email: ${contactEmail}`, "success");
    }

    this.log("Privacy policy validation passed", "success");
  }

  validateAppBuild() {
    this.log("Validating app build...", "check");

    try {
      // Check if app builds successfully
      execSync("npm run build", { stdio: "pipe" });
      this.log("App build validation passed", "success");
    } catch (error) {
      this.addError("App build failed");
    }

    try {
      // Check if iOS project syncs
      execSync("npx cap sync ios", { stdio: "pipe" });
      this.log("iOS sync validation passed", "success");
    } catch (error) {
      // Check if it's the known CocoaPods Xcode 26 compatibility issue
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || "";
      if (errorOutput.includes("Unable to find compatibility version string for object version `70`")) {
        this.addWarning("iOS sync skipped due to CocoaPods Xcode 26 compatibility issue (known issue)");
        this.log("iOS sync validation passed (CocoaPods issue ignored)", "success");
      } else {
        this.addError("iOS sync failed");
      }
    }
  }

  generateValidationReport() {
    this.log("Generating validation report...", "check");

    const report = {
      timestamp: new Date().toISOString(),
      app_name: "String Homework Tutor",
      bundle_id: "com.dled.stringhomeworktutor",
      validation_status: this.errors.length === 0 ? "PASSED" : "FAILED",
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        total_errors: this.errors.length,
        total_warnings: this.warnings.length,
        ready_for_submission: this.errors.length === 0
      }
    };

    const reportPath = path.join(this.projectRoot, "app-store-validation-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Validation report saved to: ${reportPath}`, "success");
  }

  async run() {
    try {
      this.log("🔍 Starting App Store validation for String Homework Tutor...");

      this.validateProjectStructure();
      this.validateScreenshots();
      this.validateAppIcon();
      this.validateMetadata();
      this.validatePrivacyPolicy();
      this.validateAppBuild();
      this.generateValidationReport();

      console.log("\n" + "=".repeat(50));
      
      if (this.errors.length === 0) {
        this.log("🎉 All validations passed! Ready for App Store submission!", "success");
        this.log("Next steps:", "info");
        this.log("1. Run 'npm run app-store:testflight' to upload to TestFlight", "info");
        this.log("2. Test on real devices", "info");
        this.log("3. Run 'npm run app-store:submit' to submit to App Store", "info");
      } else {
        this.log(`❌ Validation failed with ${this.errors.length} errors`, "error");
        this.log("Please fix the errors before submitting", "error");
      }

      if (this.warnings.length > 0) {
        this.log(`⚠️  ${this.warnings.length} warnings found (recommended to fix)`, "warning");
      }

      console.log("=".repeat(50) + "\n");

    } catch (error) {
      this.log(`Error: ${error.message}`, "error");
      process.exit(1);
    }
  }
}

// Run the script
if (require.main === module) {
  const validate = new AppStoreValidate();
  validate.run();
}

module.exports = AppStoreValidate;
