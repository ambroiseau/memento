import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig();

export const config = {
  port: (() => {
    // Force le port 3001, mais permet de le changer via variable d'environnement si nécessaire
    const envPort = process.env.PORT;
    if (envPort && envPort !== '3001') {
      console.log(
        `⚠️  Port override detected: ${envPort}. Using 3001 instead for consistency.`
      );
    }
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
