#!/bin/bash

# Clean sensitive information from App Store metadata
# This script removes personal information that shouldn't be committed to version control

set -e

echo "🧹 Cleaning sensitive metadata from App Store files..."

METADATA_DIR="ios/fastlane/metadata"

if [ ! -d "$METADATA_DIR" ]; then
    echo "❌ Metadata directory not found: $METADATA_DIR"
    exit 1
fi

# Delete sensitive review information files
REVIEW_DIR="$METADATA_DIR/review_information"

if [ -d "$REVIEW_DIR" ]; then
    echo "🗑️  Deleting sensitive review information files..."
    
    # Delete personal contact information files
    rm -f "$REVIEW_DIR/phone_number.txt"
    rm -f "$REVIEW_DIR/email_address.txt"
    rm -f "$REVIEW_DIR/first_name.txt"
    rm -f "$REVIEW_DIR/last_name.txt"
    rm -f "$REVIEW_DIR/demo_user.txt"
    rm -f "$REVIEW_DIR/demo_password.txt"
    
    # Keep notes file but clear it (this is less sensitive)
    if [ -f "$REVIEW_DIR/notes.txt" ]; then
        echo "" > "$REVIEW_DIR/notes.txt"
    fi
    
    echo "✅ Sensitive review information files deleted"
fi

# Delete promotional text and release notes (these should be set per release)
if [ -f "$METADATA_DIR/en-US/promotional_text.txt" ]; then
    rm -f "$METADATA_DIR/en-US/promotional_text.txt"
    echo "✅ Promotional text file deleted"
fi

if [ -f "$METADATA_DIR/en-US/release_notes.txt" ]; then
    rm -f "$METADATA_DIR/en-US/release_notes.txt"
    echo "✅ Release notes file deleted"
fi

# Delete secondary categories (these might be set per release)
if [ -f "$METADATA_DIR/secondary_category.txt" ]; then
    rm -f "$METADATA_DIR/secondary_category.txt"
    echo "✅ Secondary category file deleted"
fi

if [ -f "$METADATA_DIR/secondary_first_sub_category.txt" ]; then
    rm -f "$METADATA_DIR/secondary_first_sub_category.txt"
    echo "✅ Secondary first sub-category file deleted"
fi

if [ -f "$METADATA_DIR/secondary_second_sub_category.txt" ]; then
    rm -f "$METADATA_DIR/secondary_second_sub_category.txt"
    echo "✅ Secondary second sub-category file deleted"
fi

if [ -f "$METADATA_DIR/primary_first_sub_category.txt" ]; then
    rm -f "$METADATA_DIR/primary_first_sub_category.txt"
    echo "✅ Primary first sub-category file deleted"
fi

if [ -f "$METADATA_DIR/primary_second_sub_category.txt" ]; then
    rm -f "$METADATA_DIR/primary_second_sub_category.txt"
    echo "✅ Primary second sub-category file deleted"
fi

echo ""
echo "🎉 Metadata cleaning completed!"
echo ""
echo "📋 What was deleted:"
echo "   • Personal contact information files (phone, email, name)"
echo "   • Demo credentials files"
echo "   • Promotional text and release notes files"
echo "   • Secondary category files"
echo ""
echo "📝 Next steps:"
echo "   1. Review the remaining metadata files"
echo "   2. Add appropriate review information files before submission"
echo "   3. Set promotional text and release notes per release"
echo "   4. Commit the cleaned metadata to version control"
echo ""
echo "⚠️  Remember: Review information files will need to be created before App Store submission!"
echo "   • Create files like phone_number.txt, email_address.txt, etc. as needed"
