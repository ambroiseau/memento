#!/usr/bin/env node

// Script pour vérifier la structure de la table external_data_sources
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExternalDataSourcesStructure() {
  try {
    console.log('🔍 Vérification de la structure external_data_sources...\n');

    // 1. Vérifier si la table existe
    console.log('1️⃣ Vérification existence de la table...');

    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('external_data_sources')
        .select('*')
        .limit(1);

      if (tableError) {
        console.log('❌ Erreur accès table:', tableError.message);
        return;
      }

      console.log('✅ Table external_data_sources accessible');
    } catch (e) {
      console.log('❌ Table external_data_sources introuvable');
      return;
    }

    // 2. Vérifier la structure
    console.log('\n2️⃣ Structure de la table...');
    const { data: sample, error: sampleError } = await supabase
      .from('external_data_sources')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erreur récupération échantillon:', sampleError.message);
      return;
    }

    if (sample && sample.length > 0) {
      const columns = Object.keys(sample[0]);
      console.log('📋 Colonnes disponibles:', columns);
      console.log('📊 Exemple de données:', sample[0]);
    } else {
      console.log("ℹ️  Table vide, pas d'échantillon disponible");
    }

    // 3. Vérifier les colonnes spécifiques
    console.log('\n3️⃣ Vérification des colonnes spécifiques...');

    const importantColumns = [
      'id',
      'family_id',
      'config',
      'is_active',
      'type',
      'source_type',
    ];

    for (const column of importantColumns) {
      try {
        const { data: testQuery, error: testError } = await supabase
          .from('external_data_sources')
          .select(column)
          .limit(1);

        if (testError) {
          console.log(`   ❌ Colonne '${column}': ${testError.message}`);
        } else {
          console.log(`   ✅ Colonne '${column}': Accessible`);
        }
      } catch (e) {
        console.log(`   ❌ Colonne '${column}': Exception - ${e.message}`);
      }
    }

    // 4. Vérifier les données existantes
    console.log('\n4️⃣ Données existantes...');
    const { data: allSources, error: allError } = await supabase
      .from('external_data_sources')
      .select('*');

    if (allError) {
      console.log('❌ Erreur récupération données:', allError.message);
    } else {
      console.log(`📊 Sources de données trouvées: ${allSources?.length || 0}`);

      if (allSources && allSources.length > 0) {
        console.log('\n📋 Aperçu des sources:');
        allSources.forEach((source, index) => {
          console.log(`   ${index + 1}. ID: ${source.id}`);
          console.log(`      Family ID: ${source.family_id}`);
          console.log(`      Config: ${JSON.stringify(source.config)}`);
          console.log(`      Is Active: ${source.is_active}`);
          if (source.type) console.log(`      Type: ${source.type}`);
          if (source.source_type)
            console.log(`      Source Type: ${source.source_type}`);
          console.log('');
        });
      }
    }

    console.log('\n✅ Vérification terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkExternalDataSourcesStructure();
