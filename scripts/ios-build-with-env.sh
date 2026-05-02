#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    # shellcheck disable=SC2046
    export $(grep -v '^#' .env | xargs)
    echo "   APPLE_TEAM_ID: $APPLE_TEAM_ID"
    echo "   APPLE_ID: $APPLE_ID"
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Change to iOS directory
cd ios || exit 1

# Use bundle exec to ensure proper environment
echo "🔨 Building iOS app with proper environment..."
bundle exec fastlane ios build_testflight
