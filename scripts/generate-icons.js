const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("Generating app icons and splash screens from logo...");

try {
  // Ensure assets directory exists and copy logo files
  const assetsDir = path.join(__dirname, "assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const logoPath = path.join(__dirname, "..", "src", "logo", "logo.svg");
  const iconPath = path.join(assetsDir, "icon.svg");
  const splashPath = path.join(assetsDir, "splash.svg");

  // Copy logo to assets directory
  fs.copyFileSync(logoPath, iconPath);
  fs.copyFileSync(logoPath, splashPath);

  console.log("📋 Copied logo to assets directory");

  // Run the Capacitor Assets generation
  execSync("npx @capacitor/assets generate", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  console.log("✅ App icons and splash screens generated successfully!");
  console.log("📱 Icons and splash screens have been updated for both iOS and Android");
} catch (error) {
  console.error("❌ Error generating assets:", error.message);
  process.exit(1);
}
