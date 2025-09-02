// Configuration pour l'Edge Function Telegram Webhook

export const config = {
  // Limites et contraintes
  limits: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxMediaPerMessage: 10,
    maxConcurrentDownloads: 5,
    downloadTimeout: 30000, // 30 secondes
  },
  
  // Types de fichiers supportés
  supportedTypes: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    documents: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'],
    audio: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
  },
  
  // Configuration du stockage
  storage: {
    bucket: 'family-photos',
    folder: 'telegram-media',
    publicAccess: true,
  },
  
  // Configuration de la base de données
  database: {
    tables: {
      externalDataSources: 'external_data_sources',
      externalMedia: 'external_media',
      families: 'families',
    },
  },
  
  // Configuration des webhooks
  webhook: {
    maxRetries: 3,
    retryDelay: 1000, // 1 seconde
    validateSignature: true,
  },
  
  // Configuration des logs
  logging: {
    level: 'info', // debug, info, warn, error
    includeMetadata: true,
    includeTimestamps: true,
  },
};

// Validation de la configuration
export function validateConfig() {
  const requiredEnvVars = [
    'TELEGRAM_BOT_TOKEN',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missing = requiredEnvVars.filter(varName => !Deno.env.get(varName));
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// Configuration par environnement
export function getEnvironmentConfig() {
  const env = Deno.env.get('ENVIRONMENT') || 'development';
  
  const configs = {
    development: {
      ...config,
      logging: { ...config.logging, level: 'debug' },
      limits: { ...config.limits, maxFileSize: 10 * 1024 * 1024 }, // 10MB en dev
    },
    staging: {
      ...config,
      logging: { ...config.logging, level: 'info' },
    },
    production: {
      ...config,
      logging: { ...config.logging, level: 'warn' },
      webhook: { ...config.webhook, validateSignature: true },
    },
  };
  
  return configs[env] || configs.development;
}
