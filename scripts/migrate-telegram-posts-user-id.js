#!/usr/bin/env node

// Script pour migrer tous les posts Telegram existants
// en leur donnant l'user_id de l'admin principal
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

// UUID de l'admin principal
const ADMIN_USER_ID = 'a02767db-c62c-42b0-a89b-a70022c5eca9';

async function migrateTelegramPosts() {
  try {
    console.log('🔄 Migration des posts Telegram existants...\n');

    // 1. Compter les posts Telegram avec user_id = null
    console.log('1️⃣ Comptage des posts Telegram à migrer...');
    const { data: postsToMigrate, error: countError } = await supabase
      .from('posts')
      .select('id, content_text, created_at, source_type')
      .eq('source_type', 'telegram')
      .is('user_id', null);

    if (countError) {
      console.log('❌ Erreur comptage posts:', countError.message);
      return;
    }

    if (!postsToMigrate || postsToMigrate.length === 0) {
      console.log('✅ Aucun post Telegram à migrer !');
      return;
    }

    console.log(`📊 Posts Telegram à migrer: ${postsToMigrate.length}`);

    // 2. Afficher un aperçu des posts
    console.log('\n2️⃣ Aperçu des posts à migrer:');
    postsToMigrate.slice(0, 5).forEach((post, index) => {
      console.log(`   ${index + 1}. ID: ${post.id}`);
      console.log(`      Contenu: ${post.content_text || 'Aucun'}`);
      console.log(`      Créé: ${post.created_at}`);
    });

    if (postsToMigrate.length > 5) {
      console.log(`   ... et ${postsToMigrate.length - 5} autres`);
    }

    // 3. Demander confirmation
    console.log(
      '\n⚠️  ATTENTION: Cette opération va modifier la base de données !'
    );
    console.log(`   - ${postsToMigrate.length} posts seront modifiés`);
    console.log(`   - user_id sera changé de null vers: ${ADMIN_USER_ID}`);
    console.log('\n   Continuer ? (y/N)');

    // En mode script, on continue automatiquement
    console.log('   Mode script - continuation automatique...');

    // 4. Effectuer la migration
    console.log('\n3️⃣ Début de la migration...');

    let successCount = 0;
    let errorCount = 0;

    for (const post of postsToMigrate) {
      try {
        console.log(`🔄 Migration du post ${post.id}...`);

        const { data: updateResult, error: updateError } = await supabase
          .from('posts')
          .update({ user_id: ADMIN_USER_ID })
          .eq('id', post.id)
          .select();

        if (updateError) {
          console.log(`   ❌ Erreur: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Succès: user_id mis à jour`);
          successCount++;
        }
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
        errorCount++;
      }
    }

    // 5. Résumé
    console.log('\n4️⃣ Résumé de la migration:');
    console.log(`   ✅ Posts migrés avec succès: ${successCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📊 Total traité: ${postsToMigrate.length}`);

    // 6. Vérification
    console.log('\n5️⃣ Vérification post-migration...');
    const { data: remainingPosts, error: verifyError } = await supabase
      .from('posts')
      .select('id')
      .eq('source_type', 'telegram')
      .is('user_id', null);

    if (verifyError) {
      console.log('❌ Erreur vérification:', verifyError.message);
    } else {
      console.log(
        `📊 Posts Telegram restants avec user_id = null: ${remainingPosts?.length || 0}`
      );

      if (remainingPosts && remainingPosts.length === 0) {
        console.log('🎉 Tous les posts Telegram ont été migrés avec succès !');
      } else {
        console.log("⚠️  Certains posts n'ont pas été migrés");
      }
    }

    console.log('\n✅ Migration terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

migrateTelegramPosts();
