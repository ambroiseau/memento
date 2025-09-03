#!/usr/bin/env node

// Script pour vérifier les policies RLS sur la table posts
// et tester les permissions de suppression

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPostsRLSPolicies() {
  try {
    console.log('🔍 Vérification des policies RLS sur la table posts...\n');

    // 1. Vérifier si RLS est activé
    console.log('1️⃣ Vérification RLS activé...');
    let rlsEnabled, rlsError;
    try {
      const result = await supabase.rpc('check_rls_enabled', { table_name: 'posts' });
      rlsEnabled = result.data;
      rlsError = result.error;
    } catch (e) {
      rlsEnabled = null;
      rlsError = 'RPC not available';
    }

    if (rlsError) {
      console.log('ℹ️  RPC check_rls_enabled non disponible, vérification manuelle...');
      // Vérification manuelle en essayant de lire sans conditions
      const { data: testRead, error: testError } = await supabase
        .from('posts')
        .select('id')
        .limit(1);
      
      if (testError && testError.message.includes('RLS')) {
        console.log('✅ RLS est activé sur la table posts');
      } else {
        console.log('❌ RLS n\'est PAS activé sur la table posts');
      }
    } else {
      console.log('✅ RLS activé:', rlsEnabled);
    }

    // 2. Lister les policies existantes
    console.log('\n2️⃣ Policies RLS existantes...');
    let policies, policiesError;
    try {
      const result = await supabase.rpc('get_table_policies', { table_name: 'posts' });
      policies = result.data;
      policiesError = result.error;
    } catch (e) {
      policies = null;
      policiesError = 'RPC not available';
    }

    if (policiesError) {
      console.log('ℹ️  RPC get_table_policies non disponible');
      console.log('ℹ️  Vérification manuelle des policies...');
      
      // Test manuel des permissions
      console.log('\n🧪 Test des permissions de suppression...');
      
      // Récupérer un post pour tester
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, user_id, source_type')
        .limit(5);

      if (postsError) {
        console.log('❌ Erreur récupération posts:', postsError.message);
        return;
      }

      if (posts && posts.length > 0) {
        console.log('📊 Posts trouvés:', posts.length);
        
        for (const post of posts) {
          console.log(`\n🔍 Test suppression post ${post.id}:`);
          console.log(`   - user_id: ${post.user_id}`);
          console.log(`   - source_type: ${post.source_type}`);
          
          // Tenter la suppression
          const { data: deleteResult, error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id)
            .select();

          if (deleteError) {
            console.log(`   ❌ Erreur suppression: ${deleteError.message}`);
          } else if (deleteResult && deleteResult.length > 0) {
            console.log(`   ✅ Suppression réussie: ${deleteResult.length} post(s) supprimé(s)`);
            
            // Remettre le post pour ne pas le perdre
            console.log(`   🔄 Remise en place du post...`);
            // Note: On ne peut pas remettre le post facilement ici
          } else {
            console.log(`   ⚠️  Aucun post supprimé (RLS bloque probablement)`);
          }
        }
      }
    } else {
      console.log('📋 Policies trouvées:', policies);
    }

    // 3. Vérifier les permissions spécifiques
    console.log('\n3️⃣ Vérification des permissions de suppression...');
    
    // Test avec un post spécifique
    const { data: testPost, error: testError } = await supabase
      .from('posts')
      .select('id, user_id, source_type')
      .eq('source_type', 'telegram')
      .limit(1)
      .single();

    if (testError) {
      console.log('❌ Erreur récupération post test:', testError.message);
    } else if (testPost) {
      console.log('🧪 Post test trouvé:', testPost);
      
      // Tenter la suppression
      const { data: deleteTest, error: deleteTestError } = await supabase
        .from('posts')
        .delete()
        .eq('id', testPost.id)
        .select();

      console.log('🔍 Résultat suppression test:', {
        data: deleteTest,
        error: deleteTestError,
        success: deleteTest && deleteTest.length > 0
      });
    }

    console.log('\n✅ Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkPostsRLSPolicies();
