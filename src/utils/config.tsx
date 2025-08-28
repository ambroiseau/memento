// Environment configuration utility
export const config = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Memento App',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  
  // Feature Flags
  features: {
    pwa: import.meta.env.VITE_ENABLE_PWA === 'true',
    offline: import.meta.env.VITE_ENABLE_OFFLINE === 'true',
    pushNotifications: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true',
  },
  
  // Development
  development: {
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  },
  
  // Storage Configuration
  storage: {
    bucket: import.meta.env.VITE_STORAGE_BUCKET || 'family-photos',
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  
  // API Configuration
  api: {
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    maxRetries: parseInt(import.meta.env.VITE_MAX_RETRIES || '3'),
  },
}

// Validate required environment variables
export const validateEnvironment = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ]
  
  const missing = required.filter(key => !import.meta.env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }
}

// Development-only configuration
export const devConfig = {
  // Only available in development
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  // Debug logging
  log: (message: string, ...args: any[]) => {
    if (config.development.debugMode) {
      console.log(`[${config.app.name}]`, message, ...args)
    }
  },
  
  // Error logging
  error: (message: string, error?: any) => {
    if (config.development.debugMode) {
      console.error(`[${config.app.name}] Error:`, message, error)
    }
  },
}
