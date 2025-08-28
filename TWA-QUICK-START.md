# TWA Quick Start Guide

## Prerequisites Checklist

- [ ] Production PWA hosted on HTTPS
- [ ] Node.js 16+ installed
- [ ] Java JDK 11+ installed
- [ ] Android Studio (optional, for advanced features)
- [ ] Google Play Console account

## Quick Setup

### 1. Automated Setup (Recommended)

```bash
npm run twa:setup
```

This interactive script will:
- Check prerequisites
- Install Bubblewrap CLI
- Initialize TWA project
- Configure settings
- Update assetlinks.json

### 2. Manual Setup

If you prefer manual setup:

```bash
# Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# Initialize TWA project (replace with your production URL)
npx @bubblewrap/cli init --manifest=https://yourdomain.com/manifest.webmanifest

# Build debug version
npm run twa:build

# Build release version
npm run twa:build-release
```

## Key Files Created

- `twa-manifest.json` - TWA configuration
- `public/.well-known/assetlinks.json` - Digital Asset Links
- `app-debug.apk` - Debug APK for testing
- `app-release.aab` - Release bundle for Play Store

## Testing

```bash
# Install debug APK on connected device
adb install app-debug.apk

# Test features:
# - App launch
# - Offline functionality
# - Deep linking
# - Share functionality
```

## Publishing

1. Upload `app-release.aab` to Google Play Console
2. Fill in store listing details
3. Set content rating
4. Configure pricing (free/paid)
5. Submit for review

## Troubleshooting

### Common Issues

**Build fails:**
```bash
# Check Java version
java -version

# Check Android SDK
echo $ANDROID_HOME

# Clean and rebuild
npx @bubblewrap/cli clean
npm run twa:build
```

**App not installing:**
```bash
# Check device compatibility
adb devices

# Verify APK signature
jarsigner -verify -verbose -certs app-debug.apk
```

**Asset links not working:**
- Ensure HTTPS is enabled
- Verify assetlinks.json is accessible at `/.well-known/assetlinks.json`
- Check SHA256 fingerprint matches your certificate

## Next Steps

After successful TWA deployment:

1. Monitor analytics in Play Console
2. Gather user feedback
3. Consider iOS App Clips for Apple ecosystem
4. Implement push notifications with Firebase

## Resources

- [Full TWA Guide](ANDROID-TWA.md)
- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Best Practices](https://web.dev/using-a-pwa-in-your-android-app/)
