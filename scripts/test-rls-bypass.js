#!/usr/bin/env node

/**
 * Script pour tester si le problème de suppression vient des policies RLS
 * En utilisant la clé de service qui ignore RLS
 */

console.log('🧪 Test Bypass RLS - Suppression Posts');
console.log('=====================================');

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.log('❌ VITE_SUPABASE_URL manquant');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.log('❌ VITE_SUPABASE_SERVICE_ROLE_KEY manquant');
  console.log('📋 Pour obtenir la clé de service :');
  console.log('   1. Allez sur https://supabase.com/dashboard');
  console.log('   2. Sélectionnez votre projet');
  console.log('   3. Settings → API');
  console.log('   4. Copiez la "Service Role Key"');
  console.log(
    '   5. Ajoutez dans votre .env : VITE_SUPABASE_SERVICE_ROLE_KEY=votre_clé'
  );
  process.exit(1);
}

// Créer deux clients : un avec clé anonyme (sujet à RLS), un avec clé service (ignore RLS)
const supabaseWithRLS = createClient(supabaseUrl, supabaseAnonKey);
const supabaseWithoutRLS = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSBypass() {
  try {
    console.log('🔍 Connexion à Supabase...');

    // 1. Lister tous les posts
    console.log('\n1️⃣ Récupération de tous les posts...');
    const { data: posts, error: postsError } = await supabaseWithRLS
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (postsError) {
      throw new Error(`Erreur récupération posts: ${postsError.message}`);
    }

    console.log(`📊 Posts trouvés: ${posts.length}`);

    // Afficher les premiers posts
    posts.slice(0, 3).forEach((post, index) => {
      console.log(
        `   ${index + 1}. ID: ${post.id}, Type: ${post.source_type}, User: ${post.user_id || 'null'}`
      );
    });

    // 2. Tester la suppression avec clé anonyme (sujet à RLS)
    if (posts.length > 0) {
      const testPost = posts[0];
      console.log(
        `\n2️⃣ Test suppression avec clé anonyme (RLS actif) - Post: ${testPost.id}`
      );

      try {
        const { data, error } = await supabaseWithRLS
          .from('posts')
          .delete()
          .eq('id', testPost.id)
          .select();

        if (error) {
          console.log('❌ Échec avec clé anonyme (RLS):', error.message);
          console.log('🔒 Cela confirme un problème de policies RLS !');
        } else {
          console.log('✅ Succès avec clé anonyme:', data);
          console.log('⚠️  RLS ne bloque pas - le problème est ailleurs');
        }
      } catch (deleteError) {
        console.log(
          '❌ Erreur lors de la suppression avec clé anonyme:',
          deleteError.message
        );
      }
    }

    // 3. Tester la suppression avec clé de service (ignore RLS)
    if (posts.length > 1) {
      const testPost2 = posts[1];
      console.log(
        `\n3️⃣ Test suppression avec clé de service (RLS ignoré) - Post: ${testPost2.id}`
      );

      try {
        const { data, error } = await supabaseWithoutRLS
          .from('posts')
          .delete()
          .eq('id', testPost2.id)
          .select();

        if (error) {
          console.log('❌ Échec même avec clé de service:', error.message);
          console.log("🚨 Le problème n'est PAS RLS - c'est autre chose !");
        } else {
          console.log('✅ Succès avec clé de service:', data);
          console.log('🔒 Le problème EST bien les policies RLS !');
        }
      } catch (deleteError) {
        console.log(
          '❌ Erreur lors de la suppression avec clé de service:',
          deleteError.message
        );
      }
    }

    // 4. Recommandations
    console.log('\n🎯 Recommandations');
    console.log('==================');

    if (supabaseServiceKey) {
      console.log('✅ Clé de service disponible');
      console.log('📋 Actions suggérées:');
      console.log(
        "   1. Utiliser la clé de service dans l'app pour les suppressions admin"
      );
      console.log('   2. Ou modifier les policies RLS dans Supabase Dashboard');
    } else {
      console.log('❌ Clé de service manquante');
      console.log('📋 Actions suggérées:');
      console.log(
        '   1. Ajouter VITE_SUPABASE_SERVICE_ROLE_KEY dans votre .env'
      );
      console.log('   2. Ou modifier les policies RLS dans Supabase Dashboard');
    }

    console.log('\n✅ Test terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testRLSBypass();
