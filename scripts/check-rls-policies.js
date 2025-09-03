#!/usr/bin/env node

/**
 * Script pour vérifier les policies RLS sur la table posts
 * Identifie pourquoi la suppression échoue
 */

console.log('🔒 Vérification des Policies RLS');
console.log('================================');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Variables d'environnement manquantes:");
  console.log('   - VITE_SUPABASE_URL ou SUPABASE_URL');
  console.log('   - VITE_SUPABASE_ANON_KEY ou SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Connexion à Supabase...');

    // 1. Vérifier la structure de la table posts
    console.log('\n1️⃣ Structure de la table posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (postsError) {
      console.log('❌ Erreur accès table posts:', postsError.message);
      console.log('🔒 Cela peut indiquer un problème de RLS');
    } else {
      console.log('✅ Accès à la table posts réussi');
      if (posts && posts.length > 0) {
        console.log('📊 Exemple de post:', {
          id: posts[0].id,
          user_id: posts[0].user_id,
          source_type: posts[0].source_type,
          is_telegram: posts[0].is_telegram,
        });
      }
    }

    // 2. Tenter une lecture simple
    console.log('\n2️⃣ Test de lecture simple...');
    const { data: readTest, error: readError } = await supabase
      .from('posts')
      .select('id, user_id, source_type')
      .limit(5);

    if (readError) {
      console.log('❌ Erreur lecture:', readError.message);
    } else {
      console.log('✅ Lecture réussie, posts trouvés:', readTest?.length || 0);
    }

    // 3. Vérifier les permissions de l'utilisateur actuel
    console.log('\n3️⃣ Vérification des permissions...');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log('❌ Erreur récupération utilisateur:', userError.message);
    } else if (user) {
      console.log('👤 Utilisateur connecté:', {
        id: user.id,
        email: user.email,
      });
    } else {
      console.log('⚠️  Aucun utilisateur connecté');
    }

    // 4. Test de suppression simulée (sans vraiment supprimer)
    console.log('\n4️⃣ Test de permissions de suppression...');
    if (posts && posts.length > 0) {
      const testPostId = posts[0].id;
      console.log('🧪 Test sur post ID:', testPostId);

      // Tenter de lire le post spécifique
      const { data: singlePost, error: singleError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', testPostId)
        .single();

      if (singleError) {
        console.log('❌ Erreur lecture post spécifique:', singleError.message);
      } else {
        console.log('✅ Post spécifique accessible:', {
          id: singlePost.id,
          user_id: singlePost.user_id,
          source_type: singlePost.source_type,
        });
      }
    }

    // 5. Recommandations
    console.log('\n🎯 Recommandations');
    console.log('==================');

    if (postsError) {
      console.log('🔒 Problème RLS détecté:');
      console.log('   - Vérifiez les policies sur la table posts');
      console.log(
        "   - Assurez-vous que l'utilisateur a les bonnes permissions"
      );
    }

    console.log('📋 Actions suggérées:');
    console.log('   1. Vérifiez les policies RLS dans Supabase Dashboard');
    console.log('   2. Testez la suppression avec la clé de service');
    console.log('   3. Vérifiez les contraintes de clés étrangères');

    console.log('\n✅ Diagnostic terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkRLSPolicies();
