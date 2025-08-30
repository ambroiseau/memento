# Memento App

A modern React TypeScript application built with Vite, featuring a comprehensive UI component library, Supabase integration, and PWA support.

## 🚀 Features

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** components for accessible UI
- **Supabase** for backend services
- **ESLint & Prettier** for code quality
- **Modern tooling** with hot reload
- **PWA Support** with offline capabilities and app installation
- **PDF Album Generation** with professional layouts

## 📱 PWA Features

This app includes full Progressive Web App (PWA) support:

- **Offline Support**: App works without internet connection
- **Installable**: Can be installed on mobile and desktop devices
- **Push Notifications**: Real-time family updates
- **App-like Experience**: Full-screen mode and native feel
- **Background Sync**: Syncs data when connection is restored
- **Automatic Updates**: Seamless app updates

### PWA Installation

1. **Mobile**: Use "Add to Home Screen" from browser menu
2. **Desktop**: Click the install button in the browser address bar
3. **Chrome**: Look for the install icon in the toolbar

### PWA Testing & Validation

```bash
# Run PWA checklist
npm run pwa:checklist

# Run Lighthouse PWA audit
npm run pwa:test

# Generate PWA icons
npm run pwa:generate-icons
```

📚 **See [PWA Checklist](PWA-CHECKLIST.md) for comprehensive validation guide**

## 🚀 **Production Deployment**

Your Memento app is ready for production deployment!

### **Quick Deploy**

```bash
# Automated deployment (recommended)
npm run deploy

# Manual deployment
npm run build
# Then upload dist/ folder to your hosting provider
```

### **Deployment Options**

1. **Vercel** (Recommended) - Best for React apps
2. **Netlify** - Great for static sites
3. **Firebase Hosting** - Google's hosting solution
4. **Manual** - Any hosting provider

📚 **See [Production Deployment Guide](PRODUCTION-DEPLOYMENT.md) for detailed instructions**

## 📄 PDF Album Generation

The Memento app includes a powerful PDF album generation feature:

### Features

- **Professional A5 Layout**: Beautiful album format with cover page
- **One Post Per Page**: Clean, readable layout for each memory
- **Image Support**: Multiple images per post with grid layout
- **Date Range Selection**: Generate albums for specific periods
- **Job Tracking**: Monitor generation progress and download results
- **Family-Specific**: Each family can generate their own albums

### Setup

1. **Database Migration**: Run the SQL migration to create the required table:

   ```sql
   -- Execute sql/create-render-jobs-table.sql
   ```

2. **PDF Renderer Service**: Set up the Node.js service:

   ```bash
   cd renderer
   npm install
   cp env.example .env
   # Configure environment variables
   npm run dev
   ```

3. **Environment Variables**: Add to your `.env`:
   ```env
   VITE_PDF_RENDERER_URL=http://localhost:3001
   ```

### Usage

1. **Generate Album**: Click the "Generate Album" button in the app header
2. **View Past Albums**: Check the "Past Albums" section in Settings
3. **Download**: Click download buttons to open PDFs in browser

📚 **See [renderer/README.md](renderer/README.md) for detailed service documentation**

## 📱 Android App (TWA)

The Memento app can be packaged as a native Android app using Trusted Web Activity (TWA):

### Quick Setup

```bash
# Automated setup (recommended)
npm run twa:setup

# Manual setup
npm install -g @bubblewrap/cli
npx @bubblewrap/cli init --manifest=https://yourdomain.com/manifest.webmanifest
npm run twa:build
```

### Publishing to Google Play Store

1. Build release version: `npm run twa:build-release`
2. Upload the generated `.aab` file to Google Play Console
3. Configure store listing and submit for review

📚 **See [TWA Quick Start](TWA-QUICK-START.md) for detailed instructions**

## 📱 iOS App (Capacitor)

The Memento app can also be packaged as a native iOS app using Capacitor:

### Quick Setup

```bash
# Automated setup (recommended)
npm run ios:setup

# Manual setup
npm install @capacitor/core @capacitor/cli
npx cap init "Memento" "com.yourdomain.memento"
npx cap add ios
npm run build
npx cap copy ios
npx cap open ios
```

### Publishing to App Store

1. Configure app in Xcode (icons, signing, permissions)
2. Test on iOS Simulator and physical device
3. Archive and upload to App Store Connect
4. Submit for review

📚 **See [iOS Quick Start](IOS-QUICK-START.md) for detailed instructions**
