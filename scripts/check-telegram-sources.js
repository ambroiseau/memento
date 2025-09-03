#!/usr/bin/env node

/**
 * Script pour vérifier les sources Telegram enregistrées
 * Usage: node scripts/check-telegram-sources.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl =
  process.env.SUPABASE_URL || 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error(
    '❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required'
  );
  console.log('Please set it in your .env file or export it');
  console.log('\n💡 Alternative: Check directly in Supabase Dashboard');
  console.log(
    '   Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/editor'
  );
  console.log('   Run this SQL query:');
  console.log('\n   SELECT * FROM external_data_sources;');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTelegramSources() {
  try {
    console.log('🔍 Checking Telegram sources in database...\n');

    // 1. Vérifier la table external_data_sources
    console.log('1️⃣ Checking external_data_sources table...');
    try {
      const { data: sources, error } = await supabase
        .from('external_data_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (sources && sources.length > 0) {
        console.log(`   ✅ Found ${sources.length} source(s):`);
        sources.forEach((source, index) => {
          console.log(`\n   📋 Source #${index + 1}:`);
          console.log(`      - ID: ${source.id}`);
          console.log(`      - Name: ${source.name}`);
          console.log(
            `      - Type: ${source.source_type || source.type || 'N/A'}`
          );
          console.log(`      - Family ID: ${source.family_id}`);
          console.log(`      - Created by: ${source.created_by}`);
          console.log(`      - Active: ${source.is_active}`);
          console.log(`      - Created: ${source.created_at}`);
          console.log(`      - Updated: ${source.updated_at}`);

          if (source.config) {
            console.log(
              `      - Config: ${JSON.stringify(source.config, null, 2)}`
            );
          }
        });
      } else {
        console.log('   ❌ No sources found in external_data_sources');
      }
    } catch (error) {
      console.log('   ❌ Error querying external_data_sources:', error.message);
    }

    // 2. Vérifier la structure de la table
    console.log('\n2️⃣ Checking table structure...');
    try {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', 'external_data_sources')
        .order('ordinal_position');

      if (error) {
        throw error;
      }

      console.log('   📋 Table columns:');
      columns.forEach(col => {
        console.log(
          `      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`
        );
      });
    } catch (error) {
      console.log('   ❌ Error checking table structure:', error.message);
    }

    // 3. Vérifier les policies RLS
    console.log('\n3️⃣ Checking RLS policies...');
    try {
      const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('policyname, cmd, qual')
        .eq('tablename', 'external_data_sources');

      if (error) {
        throw error;
      }

      if (policies && policies.length > 0) {
        console.log('   🔒 RLS Policies:');
        policies.forEach(policy => {
          console.log(`      - ${policy.policyname}: ${policy.cmd}`);
        });
      } else {
        console.log('   ⚠️  No RLS policies found');
      }
    } catch (error) {
      console.log('   ❌ Error checking RLS policies:', error.message);
    }

    // 4. Test d'insertion (optionnel)
    console.log('\n4️⃣ Testing insertion (optional)...');
    const testInsert = process.argv.includes('--test-insert');

    if (testInsert) {
      try {
        console.log('   🧪 Testing insert with sample data...');

        // Note: This will fail if you don't have valid family_id and user_id
        const { data, error } = await supabase
          .from('external_data_sources')
          .insert({
            family_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            source_type: 'telegram',
            name: 'Test Source',
            config: { bot_token: 'test', chat_id: 'test' },
            is_active: true,
            created_by: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          })
          .select();

        if (error) {
          console.log(`      ❌ Insert test failed: ${error.message}`);
          console.log(
            `      💡 This might be due to RLS policies or invalid UUIDs`
          );
        } else {
          console.log('      ✅ Insert test successful');

          // Clean up test data
          await supabase
            .from('external_data_sources')
            .delete()
            .eq('id', data[0].id);
          console.log('      🧹 Test data cleaned up');
        }
      } catch (error) {
        console.log(`      ❌ Insert test error: ${error.message}`);
      }
    } else {
      console.log('   💡 Run with --test-insert to test insertion');
    }

    // 5. Résumé et recommandations
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
    console.log('='.repeat(50));

    if (sources && sources.length > 0) {
      console.log('✅ Sources found in database');
      console.log('💡 If credentials are not persisting in UI, check:');
      console.log('   - Browser console for JavaScript errors');
      console.log('   - Network tab for failed API calls');
      console.log('   - RLS policies blocking access');
    } else {
      console.log('❌ No sources found');
      console.log('💡 Possible issues:');
      console.log('   - Migration not executed');
      console.log('   - RLS policies too restrictive');
      console.log('   - Insert failing silently');
    }
  } catch (error) {
    console.error('❌ Error checking Telegram sources:', error.message);
    process.exit(1);
  }
}

// Exécuter la vérification
checkTelegramSources();

