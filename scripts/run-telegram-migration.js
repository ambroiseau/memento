#!/usr/bin/env node

/**
 * Script pour exécuter la migration Telegram dans Supabase
 * Usage: node scripts/run-telegram-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const supabaseUrl =
  process.env.SUPABASE_URL || 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error(
    '❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required'
  );
  console.log('Please set it in your .env file or export it');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting Telegram integration migration...');

    // Lire le fichier de migration
    const migrationPath = path.join(
      process.cwd(),
      'database/migrations/001_create_telegram_integration_tables.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📖 Migration file loaded, executing...');

    // Exécuter la migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      throw error;
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - external_data_sources');
    console.log('   - external_posts');
    console.log('   - Modified post_images');

    // Vérifier que les tables existent
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['external_data_sources', 'external_posts']);

    if (tablesError) {
      console.warn('⚠️  Could not verify tables:', tablesError.message);
    } else {
      console.log('🔍 Tables verification:');
      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.code === 'PGRST301') {
      console.log(
        '\n💡 The exec_sql function might not exist. Try running this SQL directly in Supabase SQL Editor:'
      );
      console.log(
        '\n' +
          fs.readFileSync(
            path.join(
              process.cwd(),
              'database/migrations/001_create_telegram_integration_tables.sql'
            ),
            'utf8'
          )
      );
    }

    process.exit(1);
  }
}

// Alternative: exécuter directement via SQL Editor
async function showMigrationSQL() {
  console.log('📝 Migration SQL to run in Supabase SQL Editor:');
  console.log('='.repeat(80));

  const migrationPath = path.join(
    process.cwd(),
    'database/migrations/001_create_telegram_integration_tables.sql'
  );
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log(migrationSQL);
  console.log('='.repeat(80));
  console.log('💡 Copy and paste this SQL into your Supabase SQL Editor');
}

// Main execution
if (process.argv.includes('--show-sql')) {
  showMigrationSQL();
} else {
  runMigration();
}

