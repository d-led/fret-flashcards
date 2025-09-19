#!/usr/bin/env node

/**
 * Deploy iOS app to a connected device without opening Xcode
 * Reads device configuration from .local-device file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${colors.cyan}→ ${description}${colors.reset}`);
  log(`${colors.yellow}Running: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    return output;
  } catch (error) {
    log(`\n${colors.red}❌ Error: ${description} failed${colors.reset}`, 'red');
    log(`${colors.red}Command: ${command}${colors.reset}`, 'red');
    log(`${colors.red}Error: ${error.message}${colors.reset}`, 'red');
    process.exit(1);
  }
}

function readDeviceConfig() {
  const configPath = path.join(process.cwd(), '.local-device');
  
  if (!fs.existsSync(configPath)) {
    log(`\n${colors.red}❌ Error: .local-device file not found${colors.reset}`, 'red');
    log(`${colors.yellow}Please create a .local-device file with your device configuration.${colors.reset}`, 'yellow');
    log(`${colors.cyan}Example:${colors.reset}`, 'cyan');
    log(`${colors.cyan}DEVICE_ID=your-device-id-here${colors.reset}`, 'cyan');
    log(`${colors.cyan}DEVICE_NAME=Your Device Name${colors.reset}`, 'cyan');
    log(`\n${colors.yellow}Get your device ID by running: npm run ios:list${colors.reset}`, 'yellow');
    process.exit(1);
  }
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  const config = {};
  
  configContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split('=');
      if (key && value) {
        config[key.trim()] = value.trim();
      }
    }
  });
  
  if (!config.DEVICE_ID || config.DEVICE_ID === 'your-device-id-here') {
    log(`\n${colors.red}❌ Error: DEVICE_ID not configured in .local-device file${colors.reset}`, 'red');
    log(`${colors.yellow}Please set a valid DEVICE_ID in your .local-device file${colors.reset}`, 'yellow');
    log(`${colors.yellow}Get your device ID by running: npm run ios:list${colors.reset}`, 'yellow');
    process.exit(1);
  }
  
  return config;
}

function checkDeviceExists(deviceId) {
  try {
    log(`\n${colors.cyan}→ Checking if device exists${colors.reset}`);
    const output = execSync('xcrun simctl list devices --json', { encoding: 'utf8' });
    const devices = JSON.parse(output);
    
    // Check iOS simulators
    for (const [runtime, deviceList] of Object.entries(devices.devices)) {
      if (Array.isArray(deviceList)) {
        const device = deviceList.find(d => d.udid === deviceId);
        if (device) {
          log(`${colors.green}✅ Found device: ${device.name} (${device.state})${colors.reset}`, 'green');
          return true;
        }
      }
    }
    
    // Check physical devices
    try {
      const physicalDevices = execSync('xcrun devicectl list devices --json', { encoding: 'utf8' });
      const devices = JSON.parse(physicalDevices);
      if (devices.result && devices.result.devices) {
        const device = devices.result.devices.find(d => d.identifier === deviceId);
        if (device) {
          log(`${colors.green}✅ Found physical device: ${device.name} (${device.connectionState})${colors.reset}`, 'green');
          return true;
        }
      }
    } catch (e) {
      // devicectl might not be available on older Xcode versions
    }
    
    log(`${colors.red}❌ Device with ID ${deviceId} not found${colors.reset}`, 'red');
    log(`${colors.yellow}Available devices:${colors.reset}`, 'yellow');
    execCommand('npm run ios:list', 'Listing available devices');
    return false;
  } catch (error) {
    log(`${colors.red}❌ Error checking devices: ${error.message}${colors.reset}`, 'red');
    return false;
  }
}

function main() {
  log(`${colors.bright}${colors.blue}🚀 iOS Device Deployment Script${colors.reset}`, 'blue');
  log(`${colors.cyan}Deploying to connected device without opening Xcode${colors.reset}`, 'cyan');
  
  // Read device configuration
  const config = readDeviceConfig();
  const deviceId = config.DEVICE_ID;
  const deviceName = config.DEVICE_NAME || 'Unknown Device';
  
  log(`\n${colors.green}📱 Target Device: ${deviceName} (${deviceId})${colors.reset}`, 'green');
  
  // Check if device exists
  if (!checkDeviceExists(deviceId)) {
    process.exit(1);
  }
  
  // Build the mobile app
  execCommand('npm run build:mobile', 'Building mobile app');
  
  // Deploy to device using Capacitor
  execCommand(`npx cap run ios --target="${deviceId}"`, `Deploying to device: ${deviceName}`);
  
  log(`\n${colors.green}✅ Successfully deployed to ${deviceName}!${colors.reset}`, 'green');
  log(`${colors.cyan}The app should now be running on your device.${colors.reset}`, 'cyan');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, readDeviceConfig, checkDeviceExists };
