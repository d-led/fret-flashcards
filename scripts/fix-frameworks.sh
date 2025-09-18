#!/bin/bash

# Fix CocoaPods Framework Paths
# 
# This script restores important CocoaPods framework settings that get removed
# by the standard `npx cap sync` command. The Capacitor sync process removes
# the inputPaths and outputPaths from the [CP] Embed Pods Frameworks build phase,
# which can cause build issues in Xcode.
#
# Usage: ./scripts/fix-frameworks.sh
# Called by: npm run mobile:sync:ios
#
# What it fixes:
# - inputPaths: Adds back the Pods-App-frameworks.sh script and Pods_App.framework
# - outputPaths: Adds back the target build directory path for the framework
#
# The script uses Python for reliable text replacement with proper regex patterns.
PROJECT_FILE="ios/App/App.xcodeproj/project.pbxproj"

# Check if the file exists
if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ Project file not found: $PROJECT_FILE"
    exit 1
fi

# Check if we need to fix the paths (look for empty inputPaths and outputPaths)
if grep -q 'inputPaths = (' "$PROJECT_FILE" && grep -q 'outputPaths = (' "$PROJECT_FILE"; then
    # Use Python for more reliable text replacement
    python3 -c "
import re

# Read the file
with open('$PROJECT_FILE', 'r') as f:
    content = f.read()

# Fix inputPaths
content = re.sub(
    r'inputPaths = \(\s*\);',
    'inputPaths = (\n\t\t\t\t\"\${PODS_ROOT}/Target Support Files/Pods-App/Pods-App-frameworks.sh\",\n\t\t\t\t\"\${PODS_ROOT}/Pods-App/Pods_App.framework\",\n\t\t\t);',
    content
)

# Fix outputPaths
content = re.sub(
    r'outputPaths = \(\s*\);',
    'outputPaths = (\n\t\t\t\t\"\${TARGET_BUILD_DIR}/\${FRAMEWORKS_FOLDER_PATH}/Pods_App.framework\",\n\t\t\t);',
    content
)

# Write the file back
with open('$PROJECT_FILE', 'w') as f:
    f.write(content)

print('✅ Fixed CocoaPods framework paths')
"
else
    echo "ℹ️  Framework paths already correct"
fi
