import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

export const config = {
  port: (() => {
    // Utilise le port fourni par Railway ou 3001 par défaut
    const envPort = process.env.PORT;
    if (envPort) {
      console.log(`🚀 Using Railway port: ${envPort}`);
      return parseInt(envPort, 10);
    }
    console.log('🔧 Using default port: 3001');
    return 3001;
  })(),
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },
  storage: {
    bucket: 'generated-pdfs',
  },
  pdf: {
    pageSize: 'A5',
    margins: 50, // mm
    bleed: 3, // mm
  },
} as const;

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
