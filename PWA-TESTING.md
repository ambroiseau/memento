# PWA Testing Guide for Memento App

## 🔍 **Manual Lighthouse Testing**

### **Step 1: Open Chrome DevTools**
1. Open Chrome and navigate to `http://localhost:3001/`
2. Press `F12` or right-click → "Inspect"
3. Go to the **Lighthouse** tab

### **Step 2: Configure Lighthouse**
- **Categories**: Check only **"PWA"**
- **Device**: Select **"Mobile"**
- **Mode**: Choose **"Navigation"**

### **Step 3: Run the Audit**
Click **"Generate report"** and wait for the analysis.

## 📊 **Expected PWA Score: 90-100/100**

### **✅ What Should Pass:**

#### **Manifest (Web App Manifest)**
- ✅ **Manifest exists** - `manifest.webmanifest` is present
- ✅ **Manifest is valid** - JSON structure is correct
- ✅ **Manifest has name** - "Memento App"
- ✅ **Manifest has short_name** - "Memento"
- ✅ **Manifest has start_url** - "/"
- ✅ **Manifest has display** - "standalone"
- ✅ **Manifest has theme_color** - "#0a0a0a"
- ✅ **Manifest has background_color** - "#0a0a0a"

#### **Icons**
- ✅ **192x192 icon** - `icon-192x192.png` (687B)
- ✅ **512x512 icon** - `icon-512x512.png` (611B)
- ✅ **Maskable icons** - `icon-maskable-192x192.png` and `icon-maskable-512x512.png`

#### **Service Worker**
- ✅ **Service Worker registered** - `service-worker.js` is present
- ✅ **Service Worker controls page** - Should work in production with HTTPS
- ✅ **Offline functionality** - `offline.html` is provided

#### **Other Requirements**
- ✅ **HTTPS** - Will pass in production (localhost is exempt)
- ✅ **Viewport meta tag** - Present in `index.html`
- ✅ **200 on start_url** - Should work correctly

### **⚠️ Potential Issues:**

#### **Development vs Production**
- **HTTPS**: Will fail in development (localhost is exempt)
- **Service Worker**: May have limited functionality in development

#### **Icon Format**
- **Current**: SVG files with .png extensions
- **Production**: Should be actual PNG files

## 🛠️ **PWA Features Testing**

### **1. Install Prompt**
1. Open Chrome DevTools
2. Go to **Application** tab
3. Click **"Manifest"** in the left sidebar
4. Look for **"Add to home screen"** button

### **2. Offline Functionality**
1. Open DevTools → **Application** tab
2. Go to **Service Workers**
3. Check if service worker is registered
4. Go to **Network** tab
5. Check **"Offline"** checkbox
6. Refresh the page
7. Should see offline page

### **3. App-like Experience**
1. Install the app (Add to home screen)
2. Launch from home screen
3. Should open in standalone mode (no browser UI)

## 📱 **Mobile Testing**

### **Chrome Mobile**
1. Open Chrome on mobile
2. Navigate to `http://localhost:3001/`
3. Look for **"Add to Home Screen"** prompt
4. Test offline functionality

### **Safari (iOS)**
1. Open Safari on iOS
2. Navigate to the app
3. Tap **Share** button
4. Select **"Add to Home Screen"**

## 🔧 **Production Deployment Checklist**

### **Before Deploying:**
- [ ] Convert SVG icons to actual PNG files
- [ ] Enable HTTPS on your hosting platform
- [ ] Test on actual mobile devices
- [ ] Verify service worker caching
- [ ] Test offline functionality

### **Hosting Platform Setup:**

#### **Netlify**
```bash
# Add to netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

#### **Vercel**
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

## 🐛 **Troubleshooting**

### **Service Worker Not Registering**
1. Check browser console for errors
2. Verify `service-worker.js` is accessible
3. Check for HTTPS requirement in production

### **Icons Not Loading**
1. Verify icon files exist in `/public/icons/`
2. Check file sizes (should be >100B)
3. Ensure correct paths in manifest

### **Manifest Not Loading**
1. Check `manifest.webmanifest` syntax
2. Verify it's served with correct MIME type
3. Check browser console for errors

### **Offline Not Working**
1. Check service worker registration
2. Verify `offline.html` exists
3. Test with DevTools Network tab

## 📈 **Performance Optimization**

### **Service Worker Caching**
- Static assets cached on install
- Dynamic content cached on first visit
- Offline fallback provided

### **Icon Optimization**
- Use WebP format for better compression
- Provide multiple sizes for different devices
- Use maskable icons for adaptive UI

### **Manifest Optimization**
- Keep manifest file small
- Use relative URLs
- Include only necessary properties

## 🎯 **PWA Best Practices**

### **User Experience**
- Fast loading times
- Smooth animations
- Responsive design
- Offline functionality

### **Installation**
- Clear install prompt
- App-like experience
- Proper app icons
- Descriptive app name

### **Performance**
- Efficient caching strategies
- Optimized assets
- Minimal network requests
- Fast startup time

## 📚 **Additional Resources**

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Lighthouse PWA Audits](https://web.dev/lighthouse-pwa/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
