# Security Guide for Memento App

## 🔐 Environment Variables & Secrets Management

### **Never Commit Secrets to Git**

✅ **DO:**
- Use `.env` files for local development
- Add `.env` to `.gitignore`
- Use environment variables in production
- Use `env.example` as a template

❌ **DON'T:**
- Commit API keys to version control
- Hardcode secrets in source code
- Share `.env` files publicly

### **Environment Variables Setup**

1. **Copy the example file:**
   ```bash
   cp env.example .env
   ```

2. **Run the setup script:**
   ```bash
   npm run setup-env
   ```

3. **Or manually configure:**
   ```bash
   # Required
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Optional
   VITE_APP_NAME=Memento App
   VITE_STORAGE_BUCKET=family-photos
   VITE_MAX_FILE_SIZE=10485760
   ```

### **Production Deployment**

#### **Netlify**
```bash
# Set environment variables in Netlify dashboard
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### **Vercel**
```bash
# Set environment variables in Vercel dashboard
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### **Docker**
```dockerfile
# Use build args or environment variables
ENV VITE_SUPABASE_URL=https://your-project.supabase.co
ENV VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🛡️ Content Security Policy (CSP)

### **Current CSP Configuration**

The app includes a comprehensive CSP that:

- **Prevents XSS attacks** with strict script-src
- **Blocks data injection** with object-src 'none'
- **Controls resource loading** with specific domains
- **Supports development** with necessary unsafe-inline/unsafe-eval

### **CSP Headers**

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in;
  connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
">
```

### **Additional Security Headers**

```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
```

## 🔒 CORS Configuration

### **Supabase CORS Settings**

Configure your Supabase project with proper CORS:

1. **Go to Supabase Dashboard** → Settings → API
2. **Add your domains:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```

3. **For development:**
   ```
   http://localhost:3000
   http://127.0.0.1:3000
   ```

4. **For production:**
   ```
   https://your-app.com
   https://www.your-app.com
   ```

### **CORS Best Practices**

✅ **DO:**
- Whitelist specific domains
- Use HTTPS in production
- Limit to necessary domains only

❌ **DON'T:**
- Use wildcard (*) in production
- Allow HTTP in production
- Include unnecessary domains

## 🔐 Authentication Security

### **Supabase Auth Configuration**

1. **Email Confirmation:**
   - Enable email confirmation for new users
   - Set proper redirect URLs

2. **Password Policy:**
   - Minimum 8 characters
   - Require uppercase, lowercase, numbers
   - Consider special characters

3. **Session Management:**
   - Auto-refresh tokens enabled
   - Persistent sessions for better UX
   - Secure session storage

### **Row Level Security (RLS)**

Ensure RLS policies are properly configured:

```sql
-- Example: Users can only access their family's data
CREATE POLICY "Users can access their family data" ON posts
FOR ALL USING (
  family_id IN (
    SELECT family_id FROM family_members 
    WHERE user_id = auth.uid()
  )
);
```

## 📁 File Upload Security

### **File Validation**

- **File size limits:** 10MB maximum
- **File type validation:** Images only
- **Virus scanning:** Consider server-side scanning
- **Secure storage:** Use Supabase Storage with RLS

### **Storage Bucket Security**

```sql
-- Example RLS policy for storage
CREATE POLICY "Users can upload to their family folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'family-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 🚨 Security Checklist

### **Before Deployment**

- [ ] Environment variables configured
- [ ] `.env` file in `.gitignore`
- [ ] CSP headers implemented
- [ ] CORS properly configured
- [ ] RLS policies enabled
- [ ] HTTPS enabled
- [ ] Security headers set
- [ ] File upload limits configured
- [ ] Authentication flow tested
- [ ] Error messages don't leak sensitive info

### **Regular Security Review**

- [ ] Update dependencies regularly
- [ ] Review access logs
- [ ] Monitor for suspicious activity
- [ ] Test authentication flows
- [ ] Verify RLS policies
- [ ] Check CSP violations
- [ ] Review error handling

## 🛠️ Security Tools

### **Development Tools**

```bash
# Validate environment variables
npm run env:validate

# Check environment variables
npm run env:check

# Security audit
npm audit

# Type checking
npm run type-check
```

### **Production Monitoring**

- **Supabase Dashboard:** Monitor API usage and errors
- **Browser DevTools:** Check CSP violations
- **Error Tracking:** Monitor for security-related errors
- **Access Logs:** Review authentication patterns

## 🚨 Incident Response

### **If Secrets Are Compromised**

1. **Immediate Actions:**
   - Rotate all API keys
   - Revoke compromised tokens
   - Check for unauthorized access

2. **Investigation:**
   - Review access logs
   - Identify breach source
   - Assess data exposure

3. **Recovery:**
   - Update all environment variables
   - Re-deploy with new secrets
   - Monitor for suspicious activity

### **Contact Information**

- **Security Issues:** Create a GitHub issue with [SECURITY] tag
- **Supabase Support:** Use Supabase dashboard support
- **Emergency:** Contact your hosting provider

## 📚 Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/security)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
