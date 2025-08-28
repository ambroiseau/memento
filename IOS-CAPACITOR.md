# iOS Capacitor Setup Guide

This guide will help you create an iOS app wrapper for your Memento PWA using Capacitor.

## Prerequisites

1. **Production PWA**: Your app must be hosted on HTTPS with a valid domain
2. **Node.js**: Version 16 or higher
3. **Xcode**: Latest version from Mac App Store
4. **iOS Developer Account**: For App Store distribution
5. **macOS**: Required for iOS development

## Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
```

## Step 2: Initialize Capacitor

```bash
npx cap init "Memento" "com.yourdomain.memento"
```

This will:
- Create `capacitor.config.ts` configuration file
- Set up the basic Capacitor project structure

## Step 3: Configure Capacitor

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourdomain.memento',
  appName: 'Memento',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'yourdomain.com',
    allowNavigation: [
      'https://yourdomain.com/*',
      'https://*.supabase.co/*'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
```

## Step 4: Add iOS Platform

```bash
npx cap add ios
```

This will:
- Create the iOS project in the `ios/` directory
- Set up Xcode project files
- Configure basic iOS settings

## Step 5: Build and Copy Web Assets

```bash
# Build your PWA
npm run build

# Copy web assets to iOS project
npx cap copy ios
```

## Step 6: Open in Xcode

```bash
npx cap open ios
```

## Step 7: Configure iOS Settings in Xcode

### App Icons
1. In Xcode, select your project
2. Go to "App Icons and Launch Images"
3. Replace default icons with your PWA icons:
   - `AppIcon.appiconset/Icon-App-20x20@1x.png` (20x20)
   - `AppIcon.appiconset/Icon-App-20x20@2x.png` (40x40)
   - `AppIcon.appiconset/Icon-App-20x20@3x.png` (60x60)
   - `AppIcon.appiconset/Icon-App-29x29@1x.png` (29x29)
   - `AppIcon.appiconset/Icon-App-29x29@2x.png` (58x58)
   - `AppIcon.appiconset/Icon-App-29x29@3x.png` (87x87)
   - `AppIcon.appiconset/Icon-App-40x40@1x.png` (40x40)
   - `AppIcon.appiconset/Icon-App-40x40@2x.png` (80x80)
   - `AppIcon.appiconset/Icon-App-40x40@3x.png` (120x120)
   - `AppIcon.appiconset/Icon-App-60x60@2x.png` (120x120)
   - `AppIcon.appiconset/Icon-App-60x60@3x.png` (180x180)
   - `AppIcon.appiconset/Icon-App-76x76@1x.png` (76x76)
   - `AppIcon.appiconset/Icon-App-76x76@2x.png` (152x152)
   - `AppIcon.appiconset/Icon-App-83.5x83.5@2x.png` (167x167)
   - `AppIcon.appiconset/Icon-App-1024x1024@1x.png` (1024x1024)

### Launch Screen
1. Create a launch screen storyboard or use images
2. Set background color to match your app theme (#0a0a0a)
3. Add your app logo/name

### Bundle Identifier
1. Set Bundle Identifier to `com.yourdomain.memento`
2. Update Display Name to "Memento"
3. Set Version and Build numbers

### Signing & Capabilities
1. **Team**: Select your Apple Developer Team
2. **Bundle Identifier**: Ensure it matches your configuration
3. **Provisioning Profile**: Automatic or manual selection

### App Transport Security (ATS)
Add to `Info.plist`:
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
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
        </dict>
        <key>supabase.co</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <false/>
            <key>NSExceptionMinimumTLSVersion</key>
            <string>TLSv1.2</string>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <true/>
        </dict>
    </dict>
</dict>
```

### Permissions
Add required permissions to `Info.plist`:
```xml
<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>Memento needs camera access to take photos for family posts.</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Memento needs photo library access to select images for family posts.</string>

<!-- Microphone (if needed for video) -->
<key>NSMicrophoneUsageDescription</key>
<string>Memento needs microphone access for video recording.</string>

<!-- Network -->
<key>NSLocalNetworkUsageDescription</key>
<string>Memento needs network access to sync with your family.</string>
```

## Step 8: Add Native Plugins

### Camera Plugin
```bash
npm install @capacitor/camera
npx cap sync ios
```

### Push Notifications
```bash
npm install @capacitor/push-notifications
npx cap sync ios
```

### Status Bar
```bash
npm install @capacitor/status-bar
npx cap sync ios
```

### Splash Screen
```bash
npm install @capacitor/splash-screen
npx cap sync ios
```

## Step 9: Configure Native Features

### Camera Integration
In your React components, use the Capacitor Camera API:

```typescript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
  
  // Handle the captured image
  console.log(image.webPath);
};
```

### Push Notifications
Configure push notifications in your app:

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission
await PushNotifications.requestPermissions();

// Register for push notifications
await PushNotifications.register();

// Listen for registration
PushNotifications.addListener('registration', (token) => {
  console.log('Push registration success: ', token.value);
});

// Listen for notifications
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Push received: ', notification);
});
```

## Step 10: Test on Device

1. **Connect iOS device** or use **iOS Simulator**
2. **Select target device** in Xcode
3. **Build and run** the project
4. **Test all features**:
   - App launch and navigation
   - Camera functionality
   - Photo library access
   - Offline functionality
   - Push notifications

## Step 11: Prepare for App Store

### App Store Connect Setup
1. Create app in App Store Connect
2. Set bundle identifier
3. Configure app information
4. Set up pricing and availability

### Screenshots and Metadata
1. **Screenshots**: Take screenshots on different device sizes
2. **App Description**: Write compelling app description
3. **Keywords**: Optimize for App Store search
4. **Categories**: Select appropriate categories

### Content Rating
1. Complete content rating questionnaire
2. Set appropriate age rating
3. Configure content warnings if needed

### Privacy Policy
1. Create privacy policy
2. Add privacy policy URL to App Store Connect
3. Configure data collection practices

## Step 12: Submit for Review

1. **Archive the app** in Xcode
2. **Upload to App Store Connect**
3. **Submit for review**
4. **Monitor review status**

## Troubleshooting

### Common Issues

1. **Build Errors**:
   - Check Xcode version compatibility
   - Verify all dependencies are installed
   - Clean build folder and rebuild

2. **Permission Issues**:
   - Ensure all required permissions are in Info.plist
   - Test on physical device (simulator has limitations)

3. **Network Issues**:
   - Verify ATS settings
   - Check allowNavigation configuration
   - Test with different network conditions

4. **App Store Rejection**:
   - Ensure app is app-like (not just a web wrapper)
   - Test offline functionality
   - Verify all features work without web dependency

### Debug Commands

```bash
# Sync changes
npx cap sync ios

# Copy web assets
npx cap copy ios

# Open in Xcode
npx cap open ios

# Run on device
npx cap run ios

# Build for production
npx cap build ios
```

## Advanced Configuration

### Custom Native Code
Add custom native functionality in `ios/App/App/`:
- `AppDelegate.swift` - App lifecycle management
- `ViewController.swift` - Main view controller
- Custom plugins and extensions

### Performance Optimization
1. **Image optimization** for different screen densities
2. **Lazy loading** for better performance
3. **Caching strategies** for offline support
4. **Memory management** for large image galleries

### Security
1. **Certificate pinning** for additional security
2. **Biometric authentication** integration
3. **Secure storage** for sensitive data
4. **Network security** configuration

## Next Steps

After successful iOS deployment:

1. **Monitor analytics** in App Store Connect
2. **Gather user feedback** and reviews
3. **Iterate on features** based on usage data
4. **Consider Android TWA** for cross-platform coverage

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Capacitor iOS Plugin Guide](https://capacitorjs.com/docs/ios)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
