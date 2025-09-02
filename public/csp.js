// Content Security Policy Generator
// This script generates a CSP header based on environment variables

const generateCSP = () => {
  const isDev =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const csp = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // ✅ SECURITY: Only allow unsafe-inline in development
      ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
      'https://*.supabase.co',
      'https://unpkg.com',
    ],
    'worker-src': [
      "'self'",
      'blob:', // Required for heic2any Web Workers
    ],
    'style-src': [
      "'self'",
      // ✅ SECURITY: Allow unsafe-inline for toasters and dynamic styles
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
    ],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.supabase.co',
      'https://*.supabase.in',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.supabase.in',
      'wss://*.supabase.co',
      'wss://*.supabase.in',
      'https://memento-production-5f3d.up.railway.app',
    ],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  };

  // Add development-specific policies
  if (isDev) {
    csp['connect-src'].push(
      'ws://localhost:*',
      'ws://127.0.0.1:*',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3003'
    );
  }

  // Convert to CSP string
  return Object.entries(csp)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

// Export for use in HTML
window.generateCSP = generateCSP;
