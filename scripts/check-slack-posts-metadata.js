#!/usr/bin/env node

/**
 * Script pour vérifier les métadonnées des posts Slack existants
 * Usage: node scripts/check-slack-posts-metadata.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ5NzQ4MDAsImV4cCI6MjA0MDU1MDgwMH0.8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlackPostsMetadata() {
  console.log('🔍 Vérification des métadonnées des posts Slack...\n');

  try {
    // Récupérer les posts Slack récents
    const { data: slackPosts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('source_type', 'slack')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Erreur:', error.message);
      return;
    }

    if (!slackPosts || slackPosts.length === 0) {
      console.log('❌ Aucun post Slack trouvé');
      console.log('💡 Partagez un fichier dans le channel Slack configuré');
      return;
    }

    console.log(`✅ ${slackPosts.length} post(s) Slack trouvé(s) :\n`);

    slackPosts.forEach((post, index) => {
      console.log(`${index + 1}. Post ID: ${post.id}`);
      console.log(`   - Créé: ${new Date(post.created_at).toLocaleString()}`);
      console.log(`   - Contenu: ${post.content_text || 'Aucun'}`);
      console.log(`   - Métadonnées:`);

      if (post.metadata) {
        console.log(
          `     - slack_user: "${post.metadata.slack_user || 'Non défini'}"`
        );
        console.log(
          `     - slack_user_info:`,
          JSON.stringify(post.metadata.slack_user_info, null, 6)
        );
        console.log(
          `     - channel_id: ${post.metadata.channel_id || 'Non défini'}`
        );
        console.log(
          `     - file_name: ${post.metadata.file_name || 'Non défini'}`
        );
      } else {
        console.log(`     - Aucune métadonnée`);
      }
      console.log('');
    });

    console.log('📋 Analyse :');
    const postsWithUserInfo = slackPosts.filter(
      post =>
        post.metadata?.slack_user && post.metadata.slack_user !== 'Unknown'
    );

    if (postsWithUserInfo.length > 0) {
      console.log(
        `✅ ${postsWithUserInfo.length} post(s) avec informations utilisateur`
      );
    } else {
      console.log('❌ Aucun post avec informations utilisateur complètes');
      console.log('💡 Les posts existants ont été créés avant la mise à jour');
      console.log(
        '💡 Partagez un nouveau fichier pour tester la fonctionnalité'
      );
    }
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

checkSlackPostsMetadata().catch(console.error);
