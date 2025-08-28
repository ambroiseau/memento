# Memento App Deployment Guide

## Server Configuration for SPA

Your memento app is a Single Page Application (SPA) that requires proper server configuration to handle client-side routing.

### **Root Deployment (e.g., `https://yourapp.com/`)**

Use the default configuration files:
- `public/manifest.webmanifest`
- `public/service-worker.js`

### **Subpath Deployment (e.g., `https://yourapp.com/app/`)**

Use the subpath configuration files:
- `public/manifest-subpath.webmanifest` → rename to `manifest.webmanifest`
- `public/service-worker-subpath.js` → rename to `service-worker.js`

## Hosting Platform Configurations

### **Netlify**
- Use `public/_redirects` file (already configured)
- Deploy to root or subpath

### **Vercel**
- Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### **Apache Server**
- Use `public/.htaccess` file (already configured)
- Ensure `mod_rewrite` is enabled

### **Nginx Server**
- Use `nginx.conf` file (already configured)
- Update `server_name` to your domain

### **Firebase Hosting**
- Create `firebase.json`:
```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### **AWS S3 + CloudFront**
- Configure CloudFront to redirect 404s to `/index.html`
- Set error page: `403` → `/index.html` (200)
- Set error page: `404` → `/index.html` (200)

### **GitHub Pages**
- Create `public/404.html` that redirects to `index.html`
- Or use a custom 404 page with JavaScript redirect

## Build and Deploy

### **Development**
```bash
npm run dev
```

### **Production Build**
```bash
npm run build
```

### **Preview Production Build**
```bash
npm run preview
```

## PWA Configuration

### **Root Deployment**
- `start_url`: `/`
- `scope`: `/`
- Service Worker: `/service-worker.js`

### **Subpath Deployment**
- `start_url`: `/app/`
- `scope`: `/app/`
- Service Worker: `/app/service-worker.js`
- Update all icon paths to include `/app/` prefix

## Testing

1. **Build the app**: `npm run build`
2. **Test locally**: `npm run preview`
3. **Test deep links**: Try accessing `/settings` directly
4. **Test PWA**: Install the app and test offline functionality
5. **Test service worker**: Check browser dev tools → Application → Service Workers

## Common Issues

### **404 on Refresh**
- Ensure server redirects all routes to `index.html`
- Check that your hosting platform supports SPA routing

### **PWA Not Working**
- Verify HTTPS is enabled
- Check manifest file paths
- Ensure service worker is registered correctly

### **Offline Not Working**
- Check service worker registration
- Verify cache strategies
- Test with browser dev tools → Application → Cache Storage

## Security Headers

The Nginx configuration includes security headers. For other platforms, add these headers:

```
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer-when-downgrade
Content-Security-Policy: default-src 'self' http: https: data: blob: 'unsafe-inline'
```
