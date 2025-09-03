#!/usr/bin/env node

/**
 * Script de déploiement de la fonction webhook sur Supabase Cloud
 * Utilise l'API Supabase pour déployer directement
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

console.log('🚀 Déploiement du Webhook Telegram sur Supabase Cloud');
console.log('==================================================');

// Vérifier les variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables d\'environnement manquantes:');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('');
  console.log('💡 Créez un fichier .env.local avec ces variables');
  console.log('   ou exportez-les dans votre terminal');
  process.exit(1);
}

console.log('✅ Variables d\'environnement trouvées');
console.log(`   URL: ${supabaseUrl}`);

// Lire le code de la fonction
const functionPath = path.join(process.cwd(), 'supabase/functions/telegram-webhook/index.ts');
const functionCode = fs.readFileSync(functionPath, 'utf8');

console.log('📁 Code de la fonction lu:', functionPath);

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployFunction() {
  try {
    console.log('\n🔧 Déploiement en cours...');
    
    // Note: Le déploiement via l'API n'est pas encore supporté
    // Utilisez plutôt la CLI Supabase ou l'interface web
    
    console.log('\n📋 Instructions de déploiement:');
    console.log('1. Allez sur https://supabase.com/dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Allez dans "Edge Functions"');
    console.log('4. Cliquez sur "New Function"');
    console.log('5. Nommez-la "telegram-webhook"');
    console.log('6. Copiez le code depuis: supabase/functions/telegram-webhook/index.ts');
    console.log('7. Cliquez sur "Deploy"');
    
    console.log('\n🔑 Variables d\'environnement à configurer:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    console.log('   - TELEGRAM_BOT_TOKEN');
    
    console.log('\n✅ Une fois déployée, configurez le webhook Telegram:');
    console.log(`   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook`);
    console.log(`   ?url=${supabaseUrl}/functions/v1/telegram-webhook`);
    
  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error.message);
    process.exit(1);
  }
}

deployFunction();
