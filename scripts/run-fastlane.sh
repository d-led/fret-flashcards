#!/bin/bash

# Fastlane wrapper script that automatically sources .env
# Usage: ./scripts/run-fastlane.sh <fastlane_command>
# Example: ./scripts/run-fastlane.sh test_auth

set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Running fastlane with environment variables loaded..."
echo "Project root: $PROJECT_ROOT"

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "❌ Error: .env file not found at $PROJECT_ROOT/.env"
    exit 1
fi

# Source the .env file
echo "📋 Loading environment variables from .env..."
source "$PROJECT_ROOT/.env"

# Verify key variables are loaded
if [ -z "$APPLE_ID" ]; then
    echo "❌ Error: APPLE_ID not found in .env file"
    exit 1
fi

echo "✅ Environment variables loaded:"
echo "   APPLE_ID: $APPLE_ID"
echo "   FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD:+✅ Set}"
echo "   APPLE_TEAM_ID: $APPLE_TEAM_ID"

# Change to iOS directory
cd "$PROJECT_ROOT/ios"

# Check if fastlane directory exists
if [ ! -f "fastlane/Fastfile" ]; then
    echo "❌ Error: Fastfile not found in ios/fastlane/"
    exit 1
fi

# Run fastlane with all arguments passed to this script
echo "🎯 Running: fastlane $*"
fastlane "$@"
