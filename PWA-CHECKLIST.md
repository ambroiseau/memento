# PWA Readiness Checklist

This checklist ensures your Memento PWA is fully optimized and ready for production deployment across all platforms.

## 0) Hosting & Basics

- [ ] **HTTPS Everywhere**: App is served over HTTPS in all environments (prod, preview)
- [ ] **Final URL**: The app's public URL is final (affects start_url, TWA, asset links)
- [ ] **Cache Headers**: No global cache headers like `Cache-Control: no-store` on static files
- [ ] **Domain Setup**: Production domain configured and SSL certificate installed

## 1) Manifest (/manifest.webmanifest)

- [ ] **File Location**: File exists at site root (or adjust `<link rel="manifest">` to correct path)
- [ ] **Content Type**: Served with `Content-Type: application/manifest+json` or `application/json`
- [ ] **Required Fields**: Contains:
  - [ ] `name` and `short_name`
  - [ ] `start_url` (returns HTTP 200 even when offline)
  - [ ] `scope`
  - [ ] `display: "standalone"`
  - [ ] `theme_color` and `background_color`
- [ ] **Icons**: Include at least:
  - [ ] 192x192 icon
  - [ ] 512x512 icon
  - [ ] One icon with `"purpose": "maskable"` (512x512)
- [ ] **Optional**: 
  - [ ] `categories` (social, lifestyle, family)
  - [ ] `screenshots` (1080×1920, 1920×1080)
  - [ ] `shortcuts` for quick actions

## 2) Service Worker (/service-worker.js)

- [ ] **Registration**: Registered from pages that need it (in index.html or app bootstrap)
- [ ] **Path Matching**: Registration path matches where the SW file lives
- [ ] **Offline Support**: Handles offline (at least an offline.html fallback)
- [ ] **Versioned Caches**: Uses versioned cache names (e.g., `static-v1.0.3`) and clears old caches
- [ ] **Caching Strategy**:
  - [ ] Network-first for HTML (fresh UI)
  - [ ] Stale-while-revalidate for static assets
  - [ ] Only caches GET requests
  - [ ] Avoids caching POST/PUT auth calls
- [ ] **Error Handling**: Graceful failure with offline.html fallback
- [ ] **No Infinite Loops**: Avoids fetching requests already fulfilled from cache

## 3) SPA Routing

- [ ] **Server Rewrites**: Unknown routes (e.g., `/dashboard`) rewrite to `/index.html`
- [ ] **Scope Alignment**: `scope` and `start_url` align with subpaths if hosted at `/app/`
- [ ] **Deep Links**: Deep links reload without 404s
- [ ] **Navigation**: Client-side routing works correctly

## 4) iOS & Installability

- [ ] **Apple Touch Icon**: `<link rel="apple-touch-icon" href="/icons/icon-192.png">` present
- [ ] **Web App Capable**: `<meta name="apple-mobile-web-app-capable" content="yes">` set
- [ ] **Status Bar Style**: `<meta name="apple-mobile-web-app-status-bar-style" content="default">` set
- [ ] **iOS Testing**: Test Add to Home Screen on iOS:
  - [ ] Opens standalone
  - [ ] Status bar looks OK
  - [ ] Icon is crisp
- [ ] **HTTPS Only**: All network calls are HTTPS (ATS compliance)

## 5) Performance & UX

- [ ] **Lighthouse Scores**: PWA and Performance scores ≥ 90
- [ ] **Image Optimization**: Images sized/compressed appropriately
- [ ] **No Render Blocking**: No obvious render-blocking resources
- [ ] **Fast Paint**: First meaningful paint is reasonable
- [ ] **No Console Errors**: Clean console without errors
- [ ] **Loading States**: App shows skeleton/loading state when offline restores
- [ ] **Core Web Vitals**: LCP, FID, CLS within acceptable ranges

## 6) Security & Privacy

- [ ] **No Secrets**: No secrets in client bundle (only intended public tokens)
- [ ] **CORS Lockdown**: CORS locked down (only your domains)
- [ ] **Content Security Policy**: CSP set with appropriate directives:
  - [ ] `script-src`
  - [ ] `connect-src`
  - [ ] `img-src`
  - [ ] `frame-ancestors`
- [ ] **Secure Storage**: If using localStorage/IndexedDB, sensitive data is minimized/encrypted
- [ ] **HTTPS Enforcement**: All requests use HTTPS

## 7) Versioning & Updates

- [ ] **SW Version Bump**: Bump SW cache version on each deploy
- [ ] **Update Notification**: Optionally implement "New version available — Reload" toast
- [ ] **Update Flow Test**: Deploy → hard reload → verify new assets served
- [ ] **Version Management**: Service worker version is properly managed

## 8) Quick Manual Tests (Chrome DevTools → Application tab)

- [ ] **Manifest Panel**: Shows correct fields; icons render properly
- [ ] **Service Workers**: Activated and controlling the page
- [ ] **Offline Simulation**: Simulate offline → Reload: app still renders core UI
- [ ] **Storage Clear**: Clear storage → Hard reload → app re-installs SW cleanly
- [ ] **Cache Inspection**: Verify caches are populated correctly

## 9) Android TWA Prep

- [ ] **Manifest Hosted**: manifest.webmanifest hosted at your public URL
- [ ] **Start URL**: Start URL equals your main entry route
- [ ] **Asset Links**: Plan to serve `/.well-known/assetlinks.json`
- [ ] **Lighthouse Pass**: All Lighthouse checks pass
- [ ] **Play Store Ready**: App meets Play Store requirements

## 10) Common Gotchas

- [ ] **Manifest Path**: Updated `<link rel="manifest">` path after moving files
- [ ] **SW Scope**: SW registered from correct path (no scope mismatch)
- [ ] **Start URL**: start_url doesn't include query params that don't work offline
- [ ] **Cache Headers**: Static hosting doesn't add no-store headers on HTML/JS
- [ ] **Maskable Icon**: Maskable icon present (prevents ugly crops on Android)
- [ ] **Deep Links**: Deep links don't 404 on refresh (rewrite rule present)
- [ ] **HTML Caching**: SW doesn't cache HTML with cache-first (users see updates)
- [ ] **Import Scripts**: No importScripts from non-HTTPS or blocked domains

## 11) Quick Commands (Paste in Terminal)

### Check Manifest Header & Reachability
```bash
curl -I https://yourdomain.tld/manifest.webmanifest
# Expect: 200 and content-type application/manifest+json or application/json
```

### Verify Service Worker Served
```bash
curl -I https://yourdomain.tld/service-worker.js
# Expect: 200, cacheable (not no-store), correct path
```

### Start URL Returns 200
```bash
curl -I https://yourdomain.tld/?source=pwa
# Expect: 200 OK
```

### Run Lighthouse Locally (Optional)
```bash
# Install once:
npm i -g lighthouse

# Run (headless):
lighthouse https://yourdomain.tld --only-categories=pwa,performance --preset=desktop --output=json --output-path=lh.json
```

### Test PWA Features
```bash
# Test offline functionality
npm run pwa:test

# Check service worker status
# Open DevTools → Application → Service Workers
```

## 12) Minimal SW Upgrade-Safe Template

```javascript
// /service-worker.js
const VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${VERSION}`;
const HTML_CACHE = `html-${VERSION}`;
const PRECACHE = [
  '/', 
  '/offline.html', 
  '/icons/icon-192.png', 
  '/icons/icon-512.png',
  '/manifest.webmanifest'
];

const isHTML = (req) =>
  req.destination === 'document' || (req.headers.get('accept')||'').includes('text/html');

const isAsset = (req) => ['style','script','image','font'].includes(req.destination);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== STATIC_CACHE && k !== HTML_CACHE) ? caches.delete(k) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;

  if (isHTML(r)) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(r, { cache: 'no-store' });
        const c = await caches.open(HTML_CACHE);
        c.put(r, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(r)) || (await caches.match('/offline.html'));
      }
    })());
    return;
  }

  if (isAsset(r)) {
    e.respondWith((async () => {
      const c = await caches.open(STATIC_CACHE);
      const cached = await c.match(r);
      const network = fetch(r).then(res => { 
        c.put(r, res.clone()); 
        return res; 
      }).catch(()=>undefined);
      return cached || network || Response.error();
    })());
    return;
  }
});
```

## 13) Memento-Specific Checks

### Family Features
- [ ] **Offline Posts**: Can view existing posts when offline
- [ ] **Image Caching**: Family photos are cached for offline viewing
- [ ] **Sync**: New posts sync when connection is restored
- [ ] **Authentication**: Auth state persists across app restarts

### Performance
- [ ] **Image Loading**: Images load quickly and are optimized
- [ ] **Infinite Scroll**: Smooth scrolling with proper loading states
- [ ] **Reactions**: Like/unlike works smoothly
- [ ] **Navigation**: Screen transitions are smooth

### Security
- [ ] **Supabase Integration**: All Supabase calls use HTTPS
- [ ] **RLS Policies**: Row Level Security properly configured
- [ ] **User Data**: User data is properly isolated
- [ ] **File Uploads**: Image uploads are secure

## 14) Pre-Deployment Checklist

### Final Verification
- [ ] **All Tests Pass**: Run `npm run pwa:test`
- [ ] **Lighthouse Audit**: All scores ≥ 90
- [ ] **Cross-Browser**: Test in Chrome, Safari, Firefox
- [ ] **Mobile Testing**: Test on iOS and Android devices
- [ ] **Offline Testing**: Verify offline functionality
- [ ] **Installation**: Test "Add to Home Screen" on all platforms

### Production Readiness
- [ ] **Environment Variables**: All production env vars set
- [ ] **Database**: Production Supabase instance configured
- [ ] **Storage**: Supabase Storage buckets configured
- [ ] **Monitoring**: Analytics and error tracking set up
- [ ] **Backup**: Database and assets backed up

## 15) Post-Deployment Monitoring

### Key Metrics to Track
- [ ] **Install Rate**: How many users install the PWA
- [ ] **Engagement**: Time spent in app, return visits
- [ ] **Performance**: Core Web Vitals scores
- [ ] **Offline Usage**: How often users use offline features
- [ ] **Error Rates**: Any service worker or app errors

### Regular Maintenance
- [ ] **Weekly**: Check Lighthouse scores
- [ ] **Monthly**: Update service worker version
- [ ] **Quarterly**: Review and optimize performance
- [ ] **As Needed**: Update PWA features and capabilities

---

## Quick Status Check

Run this command to get a quick overview of your PWA status:

```bash
# Check PWA readiness
npm run pwa:test

# Check all checklist items
echo "PWA Checklist Status:"
echo "✅ Manifest: $(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.tld/manifest.webmanifest)"
echo "✅ Service Worker: $(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.tld/service-worker.js)"
echo "✅ HTTPS: $(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.tld)"
```

**Remember**: A PWA is never truly "done" - it's an ongoing process of optimization and improvement based on user feedback and performance metrics.
