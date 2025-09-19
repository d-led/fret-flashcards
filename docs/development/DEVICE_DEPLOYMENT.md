# Device Deployment Guide

This guide explains how to configure and deploy the app to iOS devices without opening Xcode.

## Quick Start

```bash
# Deploy to your configured device
npm run ios:deploy
```

## Device Configuration

### Setting Up Your Device

1. **Create device configuration file:**
   ```bash
   cp .local-device.example .local-device
   ```

2. **Find your device ID** (see methods below)

3. **Update `.local-device` file:**
   ```bash
   DEVICE_ID=your-device-id-here
   DEVICE_NAME=Your Device Name
   ```

4. **Deploy:**
   ```bash
   npm run ios:deploy
   ```

## Finding Device IDs

### Method 1: Using Capacitor (Recommended)

```bash
# List all available iOS devices and simulators
npm run ios:list
```

This will show output like:
```
Name                                    API        Target ID
---------------------------------------------------------------------------------------
iPhone 13 mini (simulator)              iOS 26.0   1D9323A4-D5B5-4709-AE4E-90820CF7523A
iPhone 17 Pro (simulator)               iOS 26.0   53EE584B-475E-4C73-A9D6-D2BC7C9397EB
DPhoMit                                  iOS 17.0   589FBB3D-EF4B-5FF7-A745-AB2693F305EE
```

### Method 2: Using Xcode Command Line Tools

#### For Simulators:
```bash
xcrun simctl list devices
```

#### For Physical Devices:
```bash
xcrun devicectl list devices
```

### Method 3: Using Xcode GUI

1. Open Xcode
2. Go to **Window** → **Devices and Simulators**
3. Select your device
4. Copy the **Identifier** from the device info panel

## Device Types

### iOS Simulators
- **Format**: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
- **Example**: `53EE584B-475E-4C73-A9D6-D2BC7C9397EB`
- **Status**: Shows as "Booted" or "Shutdown"

### Physical iOS Devices
- **Format**: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
- **Example**: `589FBB3D-EF4B-5FF7-A745-AB2693F305EE`
- **Status**: Shows as "connected" or "disconnected"

## Configuration File Format

The `.local-device` file uses a simple key-value format:

```bash
# Device ID (required)
DEVICE_ID=589FBB3D-EF4B-5FF7-A745-AB2693F305EE

# Device name for reference (optional)
DEVICE_NAME=DPhoMit (iPhone 13 mini)

# iOS version (optional)
IOS_VERSION=17.0

# Additional comments and examples are ignored
```

## Deployment Process

The `npm run ios:deploy` command performs these steps:

1. **Read Configuration**: Loads device settings from `.local-device`
2. **Validate Device**: Checks if the device exists and is available
3. **Build App**: Runs `npm run build:mobile` to build web assets
4. **Sync Assets**: Updates iOS project with latest web content
5. **Deploy**: Installs and launches app on the target device

## Troubleshooting

### Device Not Found

**Error**: `Device with ID [ID] not found`

**Solutions**:
1. Verify device is connected and unlocked
2. Check device ID is correct: `npm run ios:list`
3. For physical devices, ensure they're trusted in Xcode
4. Try disconnecting and reconnecting the device

### Build Failures

**Error**: Build process fails

**Solutions**:
1. Clean build: `npm run build:mobile`
2. Reset iOS project: `npx cap sync ios`
3. Update CocoaPods: `cd ios && pod install`
4. Check Xcode is up to date

### Permission Issues

**Error**: Permission denied or signing issues

**Solutions**:
1. Ensure device is registered in Apple Developer account
2. Check provisioning profiles in Xcode
3. Verify code signing settings
4. For simulators, this usually isn't an issue

## Advanced Usage

### Multiple Device Configurations

You can create multiple configuration files for different devices:

```bash
# Create device-specific configs
cp .local-device .local-device-iphone
cp .local-device .local-device-ipad

# Deploy to specific device
DEVICE_CONFIG=.local-device-iphone npm run ios:deploy
```

### Custom Deployment Script

For more control, you can modify `scripts/deploy-ios-device.js`:

```javascript
// Add custom pre-deployment steps
console.log('Running custom pre-deployment checks...');

// Add custom post-deployment steps
console.log('Running custom post-deployment tasks...');
```

## Environment Variables

The deployment script supports these environment variables:

- `DEVICE_CONFIG`: Path to device configuration file (default: `.local-device`)
- `SKIP_BUILD`: Skip the build step if already built
- `VERBOSE`: Enable verbose logging

Example:
```bash
VERBOSE=1 npm run ios:deploy
```

## Integration with CI/CD

For automated deployments, you can set device configuration via environment variables:

```bash
# Set device ID via environment
export DEVICE_ID="589FBB3D-EF4B-5FF7-A745-AB2693F305EE"
export DEVICE_NAME="CI Test Device"

# Deploy
npm run ios:deploy
```

## Security Notes

- The `.local-device` file is gitignored for security
- Device IDs are not sensitive but device names might be
- Never commit device configuration files to version control
- Use environment variables in CI/CD for device configuration

## Related Commands

| Command | Description |
|---------|-------------|
| `npm run ios:list` | List all available iOS devices |
| `npm run ios:deploy` | Deploy to configured device |
| `npm run ios:dev` | Open in Xcode for development |
| `npm run ios:build` | Build iOS app for production |
| `npm run build:mobile` | Build web assets and sync to mobile |

## See Also

- [Mobile Development Guide](./mobile_development.md)
- [App Store Submission Guide](./APP_STORE_SUBMISSION.md)
- [Mobile Setup Guide](./MOBILE_SETUP.md)
