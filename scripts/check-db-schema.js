#!/usr/bin/env node

/**
 * Script pour vérifier la structure actuelle de la base de données
 * Usage: node scripts/check-db-schema.js
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking current database schema...\n');

    // 1. Vérifier si external_data_sources existe
    console.log('1️⃣ Checking external_data_sources table...');
    try {
      const { data: tableExists, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'external_data_sources')
        .single();

      if (tableExists) {
        console.log('   ✅ Table external_data_sources exists');

        // Vérifier la structure
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', 'external_data_sources')
          .order('ordinal_position');

        if (columnsError) {
          console.log(
            '   ⚠️  Could not get column details:',
            columnsError.message
          );
        } else {
          console.log('   📋 Current columns:');
          columns.forEach(col => {
            console.log(
              `      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`
            );
          });
        }
      } else {
        console.log('   ❌ Table external_data_sources does NOT exist');
      }
    } catch (error) {
      console.log('   ❌ Error checking table:', error.message);
    }

    // 2. Vérifier si external_posts existe
    console.log('\n2️⃣ Checking external_posts table...');
    try {
      const { data: tableExists, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'external_posts')
        .single();

      if (tableExists) {
        console.log('   ✅ Table external_posts exists');
      } else {
        console.log('   ❌ Table external_posts does NOT exist');
      }
    } catch (error) {
      console.log('   ❌ Error checking table:', error.message);
    }

    // 3. Vérifier la structure de post_images
    console.log('\n3️⃣ Checking post_images table structure...');
    try {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', 'post_images')
        .order('ordinal_position');

      if (columnsError) {
        console.log(
          '   ⚠️  Could not get column details:',
          columnsError.message
        );
      } else {
        console.log('   📋 Current columns:');
        const hasSource = columns.some(col => col.column_name === 'source');
        const hasExternalPostId = columns.some(
          col => col.column_name === 'external_post_id'
        );
        const hasFamilyId = columns.some(
          col => col.column_name === 'family_id'
        );

        columns.forEach(col => {
          let status = '';
          if (col.column_name === 'source') status = hasSource ? ' ✅' : ' ❌';
          if (col.column_name === 'external_post_id')
            status = hasExternalPostId ? ' ✅' : ' ❌';
          if (col.column_name === 'family_id')
            status = hasFamilyId ? ' ✅' : ' ❌';

          console.log(
            `      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}${status}`
          );
        });
      }
    } catch (error) {
      console.log('   ❌ Error checking post_images:', error.message);
    }

    // 4. Vérifier les contraintes et index
    console.log('\n4️⃣ Checking constraints and indexes...');
    try {
      // Contraintes
      const { data: constraints, error: constraintsError } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, constraint_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'external_data_sources');

      if (constraintsError) {
        console.log(
          '   ⚠️  Could not get constraints:',
          constraintsError.message
        );
      } else if (constraints && constraints.length > 0) {
        console.log('   🔒 Constraints:');
        constraints.forEach(constraint => {
          console.log(
            `      - ${constraint.constraint_name}: ${constraint.constraint_type}`
          );
        });
      } else {
        console.log('   ⚠️  No constraints found');
      }

      // Index
      const { data: indexes, error: indexesError } = await supabase
        .from('pg_indexes')
        .select('indexname, indexdef')
        .eq('tablename', 'external_data_sources');

      if (indexesError) {
        console.log('   ⚠️  Could not get indexes:', indexesError.message);
      } else if (indexes && indexes.length > 0) {
        console.log('   📊 Indexes:');
        indexes.forEach(index => {
          console.log(`      - ${index.indexname}`);
        });
      } else {
        console.log('   ⚠️  No indexes found');
      }
    } catch (error) {
      console.log('   ❌ Error checking constraints/indexes:', error.message);
    }

    // 5. Résumé des actions nécessaires
    console.log('\n📋 SUMMARY - Actions needed:');
    console.log('='.repeat(50));

    // Cette partie sera remplie après l'analyse
    console.log('Run this script to see what needs to be done');
  } catch (error) {
    console.error('❌ Error checking database schema:', error.message);
    process.exit(1);
  }
}

// Exécuter la vérification
checkDatabaseSchema();

