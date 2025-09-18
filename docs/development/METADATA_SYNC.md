# 📱 App Store Metadata Sync Guide

This guide explains how to synchronize metadata between your local repository and App Store Connect using Fastlane.

## 🔄 **What is Metadata Sync?**

Metadata sync ensures that your local metadata files match exactly what's currently on App Store Connect. This prevents conflicts and ensures consistency during app submissions.

## 📁 **Metadata File Structure**

### **Primary Files (Used by Fastlane)**
```
fastlane/metadata/en-US/
├── name.txt              # App name
├── subtitle.txt          # App subtitle
├── description.txt       # Full app description
├── keywords.txt          # App Store keywords
├── marketing_url.txt     # Marketing website URL
├── privacy_url.txt       # Privacy policy URL
└── support_url.txt       # Support website URL
```

### **Secondary File (Documentation/Validation)**
```
app-store-metadata.json   # Comprehensive metadata reference
```

## 🚀 **Sync Commands**

### **Download from App Store Connect**

```bash
# Load environment variables and download metadata
source .env
cd ios
fastlane deliver download_metadata --username "$APPLE_ID" --app_identifier "com.dled.stringhomeworktutor"
```

### **Upload to App Store Connect**

```bash
# Upload local metadata to App Store Connect
source .env
cd ios
fastlane deliver --username "$APPLE_ID" --app_identifier "com.dled.stringhomeworktutor"
```

### **Screenshot Upload Commands**

#### **Replace All Screenshots (Recommended)**
```bash
npm run app-store:screenshots
```
- Deletes ALL existing screenshots and uploads new ones
- Uses `overwrite_screenshots: true`
- Best for complete screenshot refresh

#### **Add Screenshots to Existing**
```bash
npm run app-store:screenshots:add
```
- Adds new screenshots alongside existing ones
- Uses `overwrite_screenshots: false`
- Best for incremental updates

## ⚙️ **Environment Setup**

### **Required Environment Variables**

Create a `.env` file in your project root:

```bash
# Apple ID for authentication
APPLE_ID=your-apple-id@example.com
APPLE_USERNAME=your-apple-id@example.com

# API Key Configuration (alternative to username/password)
APP_STORE_CONNECT_API_KEY_PATH=/path/to/your/AuthKey_XXXXXXXXXX.p8
APP_STORE_CONNECT_API_KEY_ID=XXXXXXXXXX
APP_STORE_CONNECT_API_ISSUER_ID=your-issuer-id-uuid

# Team ID
APPLE_TEAM_ID=your-team-id

# Provisioning Profile
PROVISIONING_PROFILE_UUID=your-provisioning-profile-uuid
```

### **Getting API Keys**

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to **Users and Access** → **Integrations** → **App Store Connect API**
3. Generate API Key and download `.p8` file
4. Note the **Key ID** and **Issuer ID**

## 📋 **Sync Workflow**

### **1. Before Making Changes**
```bash
# Download current metadata from App Store Connect
npm run app-store:sync:download
```

### **2. Make Local Changes**
Edit the metadata files in `fastlane/metadata/en-US/` as needed.

### **3. Validate Changes**
```bash
# Validate metadata consistency
npm run app-store:validate
```

### **4. Upload Changes**
```bash
# Upload updated metadata to App Store Connect
npm run app-store:sync:upload

# Upload screenshots (if updated)
npm run app-store:screenshots  # Replace all
# OR
npm run app-store:screenshots:add  # Add to existing
```

## 🔍 **Consistency Checking**

### **Automatic Validation**
Our validation script checks:
- ✅ Project structure
- ✅ Screenshot requirements
- ✅ App icon quality
- ✅ Metadata completeness
- ✅ Privacy policy
- ✅ App build success

### **Manual Comparison**
Compare values between:
- `fastlane/metadata/en-US/*.txt` files
- `app-store-metadata.json`
- App Store Connect (via web interface)

## 📊 **Current Metadata Values**

### **App Information**
- **Name**: String Homework Tutor
- **Subtitle**: Infinite fretboard practice
- **Bundle ID**: com.dled.stringhomeworktutor
- **Category**: Education
- **Age Rating**: 4+

### **URLs**
- **Marketing**: https://github.com/dledentsov/fret-flashcards
- **Privacy**: https://github.com/dledentsov/fret-flashcards/blob/main/docs/development/privacy-policy.md
- **Support**: https://github.com/dledentsov/fret-flashcards

### **Keywords**
```
guitar,learning,music,fretboard,notes,practice,sheet music,offline,voice,strings,mandolin,tunings
```

## 🛠️ **Package.json Scripts**

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "app-store:sync:download": "source .env && cd ios && fastlane deliver download_metadata --username \"$APPLE_ID\" --app_identifier \"com.dled.stringhomeworktutor\"",
    "app-store:sync:upload": "source .env && cd ios && fastlane deliver --username \"$APPLE_ID\" --app_identifier \"com.dled.stringhomeworktutor\"",
    "app-store:sync:check": "npm run app-store:validate",
    "app-store:screenshots": "fastlane upload_screenshots",
    "app-store:screenshots:add": "fastlane upload_screenshots_add"
  }
}
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"No value found for 'username'"**
```bash
# Solution: Add APPLE_USERNAME to .env
echo "APPLE_USERNAME=your-apple-id@example.com" >> .env
```

#### **"Could not infer your App's Bundle Identifier"**
```bash
# Solution: Provide app_identifier parameter
fastlane deliver download_metadata --app_identifier "com.dled.stringhomeworktutor"
```

#### **"Available session is not valid anymore"**
```bash
# Solution: Re-authenticate
fastlane deliver download_metadata --username "your-apple-id@example.com"
```

### **Authentication Issues**

#### **Using Apple ID (Username/Password)**
```bash
# Set in .env
APPLE_ID=your-apple-id@example.com
APPLE_USERNAME=your-apple-id@example.com
```

#### **Using API Keys**
```bash
# Set in .env
APP_STORE_CONNECT_API_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
APP_STORE_CONNECT_API_KEY_ID=XXXXXXXXXX
APP_STORE_CONNECT_API_ISSUER_ID=your-issuer-id-uuid
```

## 📝 **Best Practices**

### **Version Control**
- ✅ Commit metadata changes to git
- ✅ Use descriptive commit messages
- ✅ Tag releases with metadata versions

### **Backup Strategy**
- ✅ Keep `app-store-metadata.json` as reference
- ✅ Export metadata before major changes
- ✅ Document any manual App Store Connect changes

### **Team Collaboration**
- ✅ Sync metadata before starting work
- ✅ Communicate metadata changes to team
- ✅ Use consistent formatting in metadata files

## 🎯 **Quick Reference**

### **Daily Workflow**
```bash
# 1. Sync before work
npm run app-store:sync:download

# 2. Make changes
# Edit fastlane/metadata/en-US/*.txt files

# 3. Validate
npm run app-store:validate

# 4. Upload changes
npm run app-store:sync:upload
```

### **Before Submission**
```bash
# 1. Final sync
npm run app-store:sync:download

# 2. Validate everything
npm run app-store:validate

# 3. Submit to TestFlight
npm run app-store:submit:testflight
```

## 📚 **Related Documentation**

- [App Store Submission Guide](./APP_STORE_SUBMISSION.md)
- [App Store Checklist](./APP_STORE_CHECKLIST.md)
- [Mobile Development Guide](./mobile_development.md)
- [Scripts Documentation](./scripts.md)

## 🔗 **External Resources**

- [Fastlane Deliver Documentation](https://docs.fastlane.tools/actions/appstore/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- [App Store Connect](https://appstoreconnect.apple.com/)

---

**Last Updated**: September 18, 2025  
**App**: String Homework Tutor  
**Bundle ID**: com.dled.stringhomeworktutor
