# iOS Capacitor Quick Start Guide

## Prerequisites Checklist

- [ ] Production PWA hosted on HTTPS
- [ ] Node.js 16+ installed
- [ ] Xcode latest version
- [ ] iOS Developer Account
- [ ] macOS (required for iOS development)

## Quick Setup

### 1. Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
```

### 2. Initialize Capacitor

```bash
npx cap init "Memento" "com.yourdomain.memento"
```

### 3. Add iOS Platform

```bash
npx cap add ios
```

### 4. Build and Copy Assets

```bash
npm run build
npx cap copy ios
```

### 5. Open in Xcode

```bash
npx cap open ios
```

## Key Configuration Files

- `capacitor.config.ts` - Capacitor configuration
- `ios/App/App/Info.plist` - iOS app settings
- `ios/App/App/AppDelegate.swift` - App lifecycle
- `ios/App/App/ViewController.swift` - Main view controller

## Essential Plugins

```bash
# Camera access
npm install @capacitor/camera
npx cap sync ios

# Push notifications
npm install @capacitor/push-notifications
npx cap sync ios

# Status bar control
npm install @capacitor/status-bar
npx cap sync ios

# Splash screen
npm install @capacitor/splash-screen
npx cap sync ios
```

## Xcode Configuration

### Required Settings

1. **Bundle Identifier**: `com.yourdomain.memento`
2. **Display Name**: "Memento"
3. **Team**: Your Apple Developer Team
4. **App Icons**: Replace with your PWA icons
5. **Launch Screen**: Custom splash screen

### Permissions (Info.plist)

```xml
<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>Memento needs camera access to take photos for family posts.</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Memento needs photo library access to select images for family posts.</string>

<!-- Network -->
<key>NSLocalNetworkUsageDescription</key>
<string>Memento needs network access to sync with your family.</string>
```

### App Transport Security

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>yourdomain.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.2</string>
        </dict>
    </dict>
</dict>
```

## Testing

### Simulator Testing

```bash
# Run on iOS Simulator
npx cap run ios
```

### Device Testing

1. Connect iOS device
2. Select device in Xcode
3. Build and run project
4. Trust developer certificate on device

### Test Checklist

- [ ] App launches correctly
- [ ] Camera functionality works
- [ ] Photo library access works
- [ ] Offline functionality works
- [ ] Push notifications work
- [ ] Navigation is smooth
- [ ] No web browser UI elements

## Publishing

### App Store Connect

1. Create app in App Store Connect
2. Set bundle identifier
3. Upload screenshots
4. Write app description
5. Set content rating

### Submission

1. Archive app in Xcode
2. Upload to App Store Connect
3. Submit for review
4. Monitor review status

## Common Commands

```bash
# Sync changes
npx cap sync ios

# Copy web assets
npx cap copy ios

# Open in Xcode
npx cap open ios

# Run on device/simulator
npx cap run ios

# Build for production
npx cap build ios
```

## Troubleshooting

### Build Issues

```bash
# Clean build
npx cap clean ios
npx cap sync ios

# Check Xcode version
xcodebuild -version

# Verify dependencies
npm list @capacitor/core
```

### Permission Issues

- Test on physical device (simulator has limitations)
- Verify all permissions in Info.plist
- Check usage descriptions are clear

### Network Issues

- Verify ATS settings
- Check allowNavigation in capacitor.config.ts
- Test with different network conditions

## App Store Guidelines

### Key Requirements

1. **App-like Experience**: Not just a web wrapper
2. **Offline Functionality**: Works without internet
3. **Native Navigation**: No browser UI elements
4. **Proper Permissions**: Clear usage descriptions
5. **Performance**: Fast loading and smooth operation

### Common Rejection Reasons

- App looks like a web wrapper
- No offline functionality
- Poor performance
- Missing permissions
- Incomplete app description

## Next Steps

After successful iOS deployment:

1. Monitor analytics in App Store Connect
2. Gather user feedback and reviews
3. Consider Android TWA for cross-platform coverage
4. Implement advanced features (biometrics, etc.)

## Resources

- [Full iOS Guide](IOS-CAPACITOR.md)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
