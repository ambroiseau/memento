#!/usr/bin/env node

/**
 * Script pour déployer manuellement l'Edge Function Telegram
 * Usage: node scripts/deploy-telegram-function.js
 */

import fs from 'fs';
import path from 'path';

const PROJECT_REF = 'zcyalwewcdgbftaaneet';
const FUNCTION_NAME = 'telegram-webhook';

console.log('🚀 Deploying Telegram Edge Function manually...\n');

// 1. Vérifier que les fichiers existent
const functionPath = path.join(
  process.cwd(),
  'supabase/functions/telegram-webhook'
);
const requiredFiles = [
  'index.ts',
  'config.ts',
  'telegram-service.ts',
  'media-processor.ts',
  'image-compressor.ts',
];

console.log('1️⃣ Checking required files...');
for (const file of requiredFiles) {
  const filePath = path.join(functionPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    process.exit(1);
  }
}

// 2. Instructions de déploiement manuel
console.log('\n2️⃣ Manual deployment instructions:');
console.log('='.repeat(60));

console.log('\n📋 Option 1: Deploy via Supabase Dashboard');
console.log(
  '   1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF
);
console.log('   2. Navigate to: Edge Functions');
console.log('   3. Click "Create a new function"');
console.log('   4. Name: telegram-webhook');
console.log('   5. Copy the content of these files:');

for (const file of requiredFiles) {
  const filePath = path.join(functionPath, file);
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n   📄 ${file}:`);
  console.log('   ' + '='.repeat(50));
  console.log(content);
  console.log('   ' + '='.repeat(50));
}

console.log(
  '\n📋 Option 2: Deploy via Supabase CLI (if config issues resolved)'
);
console.log('   1. Fix supabase/config.toml (remove duplicate sections)');
console.log(
  '   2. Run: supabase functions deploy telegram-webhook --project-ref ' +
    PROJECT_REF
);

console.log('\n📋 Option 3: Deploy via GitHub Actions (if connected)');
console.log('   1. Push your code to GitHub');
console.log('   2. Supabase will auto-deploy if GitHub integration is set up');

// 3. Configuration du webhook après déploiement
console.log('\n3️⃣ After deployment, configure Telegram webhook:');
console.log('='.repeat(60));

console.log('\n🌐 Set webhook URL:');
console.log(
  `   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \\`
);
console.log('     -H "Content-Type: application/json" \\');
console.log("     -d '{");
console.log(
  `       "url": "https://${PROJECT_REF}.supabase.co/functions/v1/telegram-webhook",`
);
console.log(
  '       "allowed_updates": ["message", "edited_message", "channel_post"],'
);
console.log('       "drop_pending_updates": true');
console.log("     }'");

console.log('\n🔍 Verify webhook:');
console.log(
  '   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"'
);

console.log('\n🧪 Test:');
console.log('   1. Send a photo to your Telegram bot');
console.log('   2. Check Supabase Dashboard > Functions > Logs');
console.log('   3. Check your app feed for the new photo');

// 4. Variables d'environnement nécessaires
console.log('\n4️⃣ Required environment variables in Supabase Dashboard:');
console.log('='.repeat(60));
console.log('   Go to: Settings > API > Environment Variables');
console.log('   Add these variables:');
console.log('   - TELEGRAM_BOT_TOKEN: your_bot_token_here');
console.log('   - SUPABASE_URL: https://' + PROJECT_REF + '.supabase.co');
console.log('   - SUPABASE_SERVICE_ROLE_KEY: your_service_role_key');
console.log('   - ENVIRONMENT: production');

console.log('\n🎯 Next steps:');
console.log('   1. Deploy the function using one of the options above');
console.log('   2. Configure the webhook with your bot token');
console.log('   3. Test by sending a photo to Telegram');
console.log('   4. Check your app feed for automatic photo import!');

console.log(
  '\n💡 Need help? Check the deploy.md file in the telegram-webhook folder'
);

