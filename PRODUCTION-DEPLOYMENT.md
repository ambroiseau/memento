# Production Deployment Guide

This guide will walk you through deploying your Memento PWA to production.

## 🎯 **Pre-Deployment Checklist**

### **1. Environment Setup**

Create a production `.env` file:
```bash
# .env.production
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_NAME=Memento
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://yourdomain.com
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_OFFLINE_SYNC=true
VITE_STORAGE_BUCKET=family-photos
VITE_MAX_FILE_SIZE=10485760
```

### **2. Supabase Production Setup**

1. **Create Production Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project for production
   - Note down the URL and anon key

2. **Database Migration**:
   ```sql
   -- Run your existing schema in production
   -- Ensure all tables and RLS policies are set up
   ```

3. **Storage Bucket**:
   ```sql
   -- Create storage bucket
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('family-photos', 'family-photos', true);
   
   -- Set up RLS policies for storage
   CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   
   CREATE POLICY "Allow users to view family images" ON storage.objects
   FOR SELECT USING (auth.role() = 'authenticated');
   ```

### **3. Domain & SSL Setup**

1. **Purchase Domain** (if not already owned)
2. **Configure DNS** to point to your hosting provider
3. **SSL Certificate** (usually automatic with modern hosting)

## 🚀 **Deployment Options**

### **Option 1: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
# ... add all other env vars
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/manifest.webmanifest",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    },
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache"
        }
      ]
    }
  ]
}
```

### **Option 2: Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the app
npm run build

# Deploy to production
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_SUPABASE_URL https://your-production-project.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY your-production-anon-key
```

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "no-cache"
```

### **Option 3: Firebase Hosting**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

**Firebase Configuration** (`firebase.json`):
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/manifest.webmanifest",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/manifest+json"
          }
        ]
      },
      {
        "source": "/service-worker.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

## 🔧 **Post-Deployment Steps**

### **1. Update PWA Configuration**

Update your production URLs in:
- `public/manifest.webmanifest` - Update start_url and scope
- `public/service-worker.js` - Update cache strategies if needed
- `index.html` - Update any hardcoded URLs

### **2. Test PWA Features**

```bash
# Test PWA functionality
npm run pwa:test

# Run Lighthouse audit
lighthouse https://yourdomain.com --only-categories=pwa,performance
```

### **3. Set Up Monitoring**

1. **Google Analytics** (optional):
   ```html
   <!-- Add to index.html -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

2. **Error Tracking** (optional):
   - Sentry
   - LogRocket
   - Bugsnag

### **4. Performance Optimization**

1. **Image Optimization**:
   ```bash
   # Install image optimization tools
   npm install -g imagemin-cli
   
   # Optimize images
   imagemin public/icons/* --out-dir=public/icons/optimized
   ```

2. **Bundle Analysis**:
   ```bash
   # Analyze bundle size
   npm install -g vite-bundle-analyzer
   npm run build -- --analyze
   ```

## 📱 **Mobile App Deployment**

### **Android TWA (Google Play Store)**

```bash
# Set up TWA
npm run twa:setup

# Build for production
npm run twa:build-release

# Upload .aab file to Google Play Console
```

### **iOS Capacitor (App Store)**

```bash
# Set up iOS app
npm run ios:setup

# Build and archive in Xcode
npm run ios:open
# Then archive and upload to App Store Connect
```

## 🔒 **Security Checklist**

- [ ] **HTTPS enforced** everywhere
- [ ] **CORS configured** properly
- [ ] **CSP headers** set
- [ ] **Environment variables** secured
- [ ] **API keys** are public (Supabase anon key is safe)
- [ ] **RLS policies** configured in Supabase
- [ ] **Rate limiting** implemented (if needed)

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**

1. **Performance**:
   - Core Web Vitals (LCP, FID, CLS)
   - Page load times
   - Bundle sizes

2. **User Engagement**:
   - PWA install rate
   - Time spent in app
   - Offline usage

3. **Technical**:
   - Error rates
   - Service worker updates
   - Cache hit rates

### **Tools to Set Up**

1. **Performance Monitoring**:
   - Google PageSpeed Insights
   - Web Vitals
   - Lighthouse CI

2. **Error Tracking**:
   - Sentry
   - LogRocket

3. **Analytics**:
   - Google Analytics 4
   - Mixpanel
   - Amplitude

## 🚨 **Common Issues & Solutions**

### **PWA Not Installing**
- Check manifest is served with correct content-type
- Verify HTTPS is enabled
- Test on different browsers/devices

### **Offline Not Working**
- Check service worker registration
- Verify cache strategies
- Test with DevTools offline mode

### **Images Not Loading**
- Check Supabase storage permissions
- Verify RLS policies
- Test image URLs directly

### **Authentication Issues**
- Check Supabase project settings
- Verify redirect URLs
- Test auth flow in incognito mode

## 🎉 **Launch Checklist**

- [ ] **Production environment** configured
- [ ] **Domain and SSL** set up
- [ ] **PWA features** tested
- [ ] **Performance** optimized
- [ ] **Security** verified
- [ ] **Monitoring** configured
- [ ] **Backup** strategy in place
- [ ] **Documentation** updated
- [ ] **Team** notified
- [ ] **Launch** announced

## 📞 **Support & Maintenance**

### **Regular Maintenance**

1. **Weekly**:
   - Check performance metrics
   - Monitor error rates
   - Review user feedback

2. **Monthly**:
   - Update dependencies
   - Review security
   - Optimize performance

3. **Quarterly**:
   - Plan new features
   - Review analytics
   - Update PWA capabilities

### **Emergency Contacts**

- **Hosting Provider**: Vercel/Netlify/Firebase support
- **Supabase**: Database and auth support
- **Domain Provider**: DNS and SSL support

---

**Ready to deploy?** Choose your hosting platform and follow the steps above. Your PWA is production-ready! 🚀
