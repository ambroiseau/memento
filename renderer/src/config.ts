export const config = {
  port: parseInt(process.env.PORT || '3001'),
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
