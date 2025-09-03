#!/usr/bin/env node

/**
 * Script pour vérifier les contraintes de base de données
 * Identifie pourquoi la suppression des posts échoue
 */

console.log('🔍 Vérification des Contraintes de Base');
console.log('=====================================');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseConstraints() {
  try {
    console.log('🔍 Connexion à Supabase...');

    // 1. Vérifier la structure de la table posts
    console.log('\n1️⃣ Structure de la table posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (postsError) {
      console.log('❌ Erreur accès posts:', postsError.message);
    } else {
      console.log('✅ Accès posts OK');
    }

    // 2. Vérifier la structure de la table post_images
    console.log('\n2️⃣ Structure de la table post_images...');
    const { data: postImages, error: imagesError } = await supabase
      .from('post_images')
      .select('*')
      .limit(1);

    if (imagesError) {
      console.log('❌ Erreur accès post_images:', imagesError.message);
    } else {
      console.log('✅ Accès post_images OK');
    }

    // 3. Tester une suppression simple
    if (posts && posts.length > 0) {
      const testPost = posts[0];
      console.log(`\n3️⃣ Test suppression simple - Post: ${testPost.id}`);

      try {
        // D'abord vérifier que le post existe
        const { data: postCheck, error: checkError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', testPost.id)
          .single();

        if (checkError) {
          console.log('❌ Post introuvable:', checkError.message);
        } else {
          console.log('✅ Post trouvé:', postCheck.id);

          // Tenter la suppression
          const { data, error } = await supabase
            .from('posts')
            .delete()
            .eq('id', testPost.id)
            .select();

          if (error) {
            console.log('❌ Erreur suppression:', error.message);
            console.log('🔒 Problème de contraintes ou permissions');
          } else if (data && data.length > 0) {
            console.log('✅ Suppression réussie:', data);
            console.log('✅ Pas de problème de contraintes');
          } else {
            console.log('⚠️  Suppression échouée silencieusement');
            console.log('🔒 Problème de contraintes ou triggers');
          }
        }
      } catch (deleteError) {
        console.log('❌ Erreur lors du test:', deleteError.message);
      }
    }

    // 4. Vérifier les relations entre tables
    console.log('\n4️⃣ Vérification des relations...');

    if (posts && postImages && posts.length > 0 && postImages.length > 0) {
      const testPost = posts[0];
      const relatedImages = postImages.filter(
        img => img.post_id === testPost.id
      );

      console.log(
        `📊 Post ${testPost.id} a ${relatedImages.length} images associées`
      );

      if (relatedImages.length > 0) {
        console.log('🔗 Relations détectées - possible problème de cascade');
      }
    }

    // 5. Recommandations
    console.log('\n🎯 Recommandations');
    console.log('==================');
    console.log('📋 Si la suppression échoue silencieusement:');
    console.log('   1. Vérifiez les contraintes de clés étrangères');
    console.log('   2. Vérifiez les triggers de base de données');
    console.log('   3. Vérifiez les policies RLS sur les tables liées');
    console.log('   4. Utilisez la clé de service pour bypass RLS');

    console.log('\n✅ Vérification terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkDatabaseConstraints();
