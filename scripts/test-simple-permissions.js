#!/usr/bin/env node

/**
 * Script simple pour tester les permissions de suppression
 * Sans clé de service
 */

console.log('🔍 Test Simple - Permissions Suppression');
console.log('=======================================');

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

async function testSimplePermissions() {
  try {
    console.log('🔍 Connexion à Supabase...');

    // 1. Lister les posts
    console.log('\n1️⃣ Récupération des posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (postsError) {
      throw new Error(`Erreur récupération posts: ${postsError.message}`);
    }

    console.log(`📊 Posts trouvés: ${posts.length}`);

    // Afficher les détails des posts
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. ID: ${post.id}`);
      console.log(`      Type: ${post.source_type || 'unknown'}`);
      console.log(`      User ID: ${post.user_id || 'null'}`);
      console.log(`      Créé: ${post.created_at}`);
      console.log('');
    });

    // 2. Tester la suppression d'un post normal (avec user_id)
    const normalPost = posts.find(p => p.user_id !== null);
    if (normalPost) {
      console.log(
        `\n2️⃣ Test suppression post normal (user_id: ${normalPost.user_id})...`
      );

      try {
        const { data, error } = await supabase
          .from('posts')
          .delete()
          .eq('id', normalPost.id)
          .select();

        if (error) {
          console.log('❌ Échec suppression post normal:', error.message);
          console.log('🔒 Problème de permissions ou RLS');
        } else {
          console.log('✅ Succès suppression post normal:', data);
          console.log('✅ Permissions de base OK');
        }
      } catch (deleteError) {
        console.log('❌ Erreur lors de la suppression:', deleteError.message);
      }
    }

    // 3. Tester la suppression d'un post Telegram (user_id: null)
    const telegramPost = posts.find(
      p => p.source_type === 'telegram' || p.user_id === null
    );
    if (telegramPost) {
      console.log(
        `\n3️⃣ Test suppression post Telegram (user_id: ${telegramPost.user_id})...`
      );

      try {
        const { data, error } = await supabase
          .from('posts')
          .delete()
          .eq('id', telegramPost.id)
          .select();

        if (error) {
          console.log('❌ Échec suppression post Telegram:', error.message);
          console.log('🔒 Problème confirmé pour les posts sans user_id');
        } else {
          console.log('✅ Succès suppression post Telegram:', data);
          console.log('⚠️  Permissions OK - le problème est ailleurs');
        }
      } catch (deleteError) {
        console.log(
          '❌ Erreur lors de la suppression Telegram:',
          deleteError.message
        );
      }
    }

    // 4. Diagnostic
    console.log('\n🎯 Diagnostic');
    console.log('==============');
    console.log('📋 Si la suppression des posts normaux échoue :');
    console.log('   - Problème de permissions générales');
    console.log('   - Policies RLS trop restrictives');
    console.log('');
    console.log('📋 Si seule la suppression des posts Telegram échoue :');
    console.log('   - Problème spécifique aux posts sans user_id');
    console.log('   - Policies RLS qui bloquent user_id = null');
    console.log('');
    console.log('📋 Si tout fonctionne :');
    console.log("   - Le problème est dans l'application, pas dans la base");

    console.log('\n✅ Test terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testSimplePermissions();
