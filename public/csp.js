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
      "'unsafe-inline'", // Required for Vite HMR in development
      "'unsafe-eval'", // Required for Vite in development
      'https://*.supabase.co',
      'https://unpkg.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS
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
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': [],
  };

  // Add development-specific policies
  if (isDev) {
    csp['script-src'].push("'unsafe-eval'");
    csp['connect-src'].push(
      'ws://localhost:*',
      'ws://127.0.0.1:*',
      'http://localhost:3002',
      'http://127.0.0.1:3002'
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
