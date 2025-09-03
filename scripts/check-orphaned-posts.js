#!/usr/bin/env node

/**
 * Script pour vérifier et nettoyer les posts orphelins
 * Identifie les posts qui ont été supprimés de l'interface mais pas de la base
 */

console.log('🔍 Vérification des Posts Orphelins');
console.log('==================================');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Variables d'environnement manquantes:");
  console.log('   - VITE_SUPABASE_URL ou SUPABASE_URL');
  console.log(
    '   - VITE_SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrphanedPosts() {
  try {
    console.log('🔍 Connexion à Supabase...');

    // 1. Vérifier tous les posts
    console.log('\n1️⃣ Récupération de tous les posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError) {
      throw new Error(`Erreur récupération posts: ${postsError.message}`);
    }

    console.log(`📊 Total posts dans la base: ${posts.length}`);

    // 2. Vérifier les posts avec images
    console.log('\n2️⃣ Vérification des posts avec images...');
    const { data: postImages, error: imagesError } = await supabase
      .from('post_images')
      .select('*');

    if (imagesError) {
      throw new Error(`Erreur récupération images: ${imagesError.message}`);
    }

    console.log(`📸 Total entrées post_images: ${postImages.length}`);

    // 3. Identifier les posts orphelins
    console.log('\n3️⃣ Identification des posts orphelins...');
    const postIds = new Set(posts.map(p => p.id));
    const orphanedImages = postImages.filter(img => !postIds.has(img.post_id));

    if (orphanedImages.length > 0) {
      console.log(`⚠️  Images orphelines trouvées: ${orphanedImages.length}`);
      orphanedImages.forEach(img => {
        console.log(
          `   - post_id: ${img.post_id}, storage_path: ${img.storage_path}`
        );
      });
    } else {
      console.log('✅ Aucune image orpheline trouvée');
    }

    // 4. Vérifier les posts sans images
    console.log('\n4️⃣ Vérification des posts sans images...');
    const imagePostIds = new Set(postImages.map(img => img.post_id));
    const postsWithoutImages = posts.filter(post => !imagePostIds.has(post.id));

    if (postsWithoutImages.length > 0) {
      console.log(`⚠️  Posts sans images: ${postsWithoutImages.length}`);
      postsWithoutImages.forEach(post => {
        console.log(
          `   - ID: ${post.id}, Type: ${post.source_type}, Créé: ${post.created_at}`
        );
      });
    } else {
      console.log('✅ Tous les posts ont des images');
    }

    // 5. Statistiques par type de source
    console.log('\n5️⃣ Statistiques par type de source...');
    const sourceStats = {};
    posts.forEach(post => {
      const source = post.source_type || 'unknown';
      sourceStats[source] = (sourceStats[source] || 0) + 1;
    });

    Object.entries(sourceStats).forEach(([source, count]) => {
      console.log(`   - ${source}: ${count} posts`);
    });

    // 6. Recommandations
    console.log('\n🎯 Recommandations');
    console.log('==================');

    if (orphanedImages.length > 0) {
      console.log('⚠️  Nettoyage recommandé:');
      console.log('   - Supprimer les entrées post_images orphelines');
      console.log('   - Vérifier les policies RLS sur la table posts');
    }

    if (postsWithoutImages.length > 0) {
      console.log('⚠️  Posts fantômes détectés:');
      console.log(
        "   - Ces posts existent dans la base mais n'ont pas d'images"
      );
      console.log(
        '   - Ils peuvent causer des placeholders vides dans les PDFs'
      );
    }

    console.log('\n✅ Vérification terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkOrphanedPosts();
