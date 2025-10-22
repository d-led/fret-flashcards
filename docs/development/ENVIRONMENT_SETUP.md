# Environment Setup

This document explains how to properly configure environment variables for the String Homework Tutor project.

## Environment Variables

The project uses environment variables for Apple Developer credentials and configuration. These are stored in `.env` files.

### Required Environment Variables

```bash
APPLE_ID=your-apple-id@example.com
APPLE_TEAM_ID=your-team-id
PROVISIONING_PROFILE_UUID=your-provisioning-profile-uuid
FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD=your-app-specific-password
APP_STORE_CONNECT_API_KEY_PATH=$HOME/Downloads/AuthKey_XXXXX.p8
APP_STORE_CONNECT_API_KEY_ID=your-api-key-id
APP_STORE_CONNECT_ISSUER_ID=your-issuer-id
APPLE_USERNAME=your-apple-id@example.com
```

## .env File Locations

### Project Root (.env)

- **Location**: `/Users/dmitryledentsov/src/fret-flashcards/.env`
- **Purpose**: Used by npm scripts and general project tools
- **Format**: Values should be quoted for shell compatibility

### Fastlane Directory (.env)

- **Location**: `/Users/dmitryledentsov/src/fret-flashcards/ios/fastlane/.env`
- **Purpose**: Used by fastlane commands
- **Format**: Values should NOT be quoted (fastlane dotenv doesn't handle quotes properly)

## Important: .env File Format Rules

### ❌ Wrong Format (with quotes)

```bash
APPLE_ID="..."
FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD="unro-vrjf-thbx-jlaj"
```

### ✅ Correct Format (no quotes)

```bash
APPLE_ID=...
FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD=unro-vrjf-thbx-jlaj
```

## Setup Instructions

1. **Copy your environment file to the fastlane directory**:

   ```bash
   cp .env ios/fastlane/.env
   ```

2. **Remove quotes from the fastlane .env file**:

   ```bash
   cd ios/fastlane
   sed 's/="\(.*\)"/=\1/g' .env > .env.tmp && mv .env.tmp .env
   ```

3. **Verify the format**:
   ```bash
   cat ios/fastlane/.env
   ```

## Why Two .env Files?

- **Project root .env**: Used by npm scripts that use `source .env` (requires quotes)
- **Fastlane .env**: Used by fastlane's automatic dotenv loading (doesn't handle quotes)

## Troubleshooting

### Fastlane shows "❌ Not set" for environment variables

1. Check that the `.env` file exists in `ios/fastlane/.env`
2. Verify there are no quotes around values in the fastlane `.env` file
3. Ensure you're running fastlane from the `ios/` directory

### Environment variables not loading in npm scripts

1. Check that the project root `.env` file has quoted values
2. Verify the npm script uses `source .env` before the command

## Security Notes

- Never commit `.env` files to version control
- The `.env` files are already in `.gitignore`
- Keep your Apple Developer credentials secure
- Use application-specific passwords instead of your main Apple ID password

## File Structure

```
fret-flashcards/
├── .env                           # Project root (quoted values)
├── ios/
│   └── fastlane/
│       ├── .env                   # Fastlane specific (no quotes)
│       ├── Fastfile
│       └── Snapfile
└── docs/development/
    └── ENVIRONMENT_SETUP.md       # This file
```
