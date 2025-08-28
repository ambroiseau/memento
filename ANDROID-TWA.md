# Android TWA (Trusted Web Activity) Setup Guide

This guide will help you create an Android app wrapper for your Memento PWA using Bubblewrap.

## Prerequisites

1. **Production PWA**: Your app must be hosted on HTTPS with a valid domain
2. **Node.js**: Version 16 or higher
3. **Java Development Kit (JDK)**: Version 11 or higher
4. **Android Studio**: For building the final APK/AAB
5. **Google Play Console Account**: For publishing the app

## Step 1: Prepare Your Production PWA

Before creating the TWA, ensure your PWA is:
- ✅ Hosted on HTTPS (e.g., `https://yourdomain.com`)
- ✅ Has a valid `manifest.webmanifest`
- ✅ Passes Lighthouse PWA audit
- ✅ Has proper icons (192x192 and 512x512)

## Step 2: Install Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
```

## Step 3: Initialize TWA Project

Replace `https://yourdomain.com` with your actual production URL:

```bash
npx @bubblewrap/cli init --manifest=https://yourdomain.com/manifest.webmanifest
```

This will:
- Download your manifest
- Create an Android project
- Configure the TWA settings

## Step 4: Configure TWA Settings

Edit the generated `twa-manifest.json`:

```json
{
  "packageId": "com.yourdomain.memento",
  "host": "yourdomain.com",
  "name": "Memento",
  "launcherName": "Memento",
  "display": "standalone",
  "themeColor": "#0a0a0a",
  "navigationColor": "#0a0a0a",
  "backgroundColor": "#0a0a0a",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "https://yourdomain.com/icons/icon-512x512.png",
  "maskableIconUrl": "https://yourdomain.com/icons/icon-maskable-512x512.png",
  "monochromeIconUrl": "https://yourdomain.com/icons/icon-192x192.png",
  "shortcuts": [
    {
      "name": "Create Post",
      "shortName": "New Post",
      "url": "/?screen=create-post",
      "chosenIconUrl": "https://yourdomain.com/icons/icon-192x192.png"
    },
    {
      "name": "View Gallery",
      "shortName": "Gallery", 
      "url": "/?screen=gallery",
      "chosenIconUrl": "https://yourdomain.com/icons/icon-192x192.png"
    }
  ],
  "generatorApp": "@bubblewrap/cli",
  "webManifestUrl": "https://yourdomain.com/manifest.webmanifest",
  "fallbackType": "customtabs",
  "features": {
    "playBilling": {
      "enabled": false
    }
  },
  "alphaDependencies": {
    "enabled": false
  },
  "enableSiteSettingsShortcut": true,
  "isChromeOSOnly": false,
  "orientation": "portrait-primary",
  "fingerprints": [],
  "additionalTrustedOrigins": [],
  "retention": "forever",
  "shareTarget": {
    "action": "/?share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "files",
          "accept": ["image/*"]
        }
      ]
    }
  }
}
```

## Step 5: Build the TWA

```bash
npx @bubblewrap/cli build
```

This will:
- Generate the Android project
- Create debug and release APKs
- Generate the `.aab` file for Play Store

## Step 6: Digital Asset Links

Create `/public/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.yourdomain.memento",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

Get your SHA256 fingerprint from the build output or run:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## Step 7: Test the TWA

1. **Install on device**:
   ```bash
   adb install app-debug.apk
   ```

2. **Test features**:
   - App launch
   - Offline functionality
   - Push notifications
   - Deep linking

## Step 8: Prepare for Play Store

1. **Create release build**:
   ```bash
   npx @bubblewrap/cli build --release
   ```

2. **Upload to Play Console**:
   - Upload the `.aab` file
   - Fill in store listing
   - Set up content rating
   - Configure pricing

## Troubleshooting

### Common Issues

1. **Manifest not accessible**:
   - Ensure HTTPS is enabled
   - Check CORS headers
   - Verify manifest URL is correct

2. **Build failures**:
   - Check Java/JDK version
   - Ensure Android SDK is installed
   - Verify all dependencies

3. **App not installing**:
   - Check device compatibility
   - Verify APK signature
   - Test on different Android versions

### Debug Commands

```bash
# Check Bubblewrap version
npx @bubblewrap/cli --version

# Validate manifest
npx @bubblewrap/cli validate

# Update dependencies
npx @bubblewrap/cli update

# Clean build
npx @bubblewrap/cli clean
```

## Advanced Configuration

### Custom Splash Screen

Add to `twa-manifest.json`:
```json
{
  "splashScreenFadeOutDuration": 300,
  "splashScreenBackgroundColor": "#0a0a0a"
}
```

### Offline Support

Ensure your service worker handles offline scenarios properly.

### Push Notifications

Configure Firebase Cloud Messaging in the TWA for push notifications.

## Security Considerations

1. **HTTPS Only**: TWA requires HTTPS
2. **Asset Links**: Must be properly configured
3. **Content Security Policy**: Ensure CSP allows TWA functionality
4. **Certificate Pinning**: Consider implementing for additional security

## Performance Optimization

1. **Preload critical resources**
2. **Optimize images and assets**
3. **Implement proper caching strategies**
4. **Monitor Core Web Vitals**

## Next Steps

After successful TWA deployment:

1. **Monitor analytics** in Play Console
2. **Gather user feedback**
3. **Iterate on PWA features**
4. **Consider iOS App Clips** for Apple ecosystem

## Resources

- [Bubblewrap Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Best Practices](https://web.dev/using-a-pwa-in-your-android-app/)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
