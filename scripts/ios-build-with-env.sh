#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
    echo "   APPLE_TEAM_ID: $APPLE_TEAM_ID"
    echo "   APPLE_ID: $APPLE_ID"
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Change to iOS directory
cd ios

# Use bundle exec to ensure proper environment
echo "🔨 Building iOS app with proper environment..."
bundle exec fastlane ios build_testflight
