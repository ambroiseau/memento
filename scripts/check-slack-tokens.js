/**
 * Script pour vérifier les tokens Slack stockés
 */

console.log('🔍 Vérification des tokens Slack stockés...\n');

async function checkSlackTokens() {
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || 'https://zcyalwewcdgbftaaneet.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    console.log('❌ VITE_SUPABASE_ANON_KEY non configuré');
    return;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/external_data_sources?source_type=eq.slack`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const sources = await response.json();

    console.log(`📊 ${sources.length} source(s) Slack trouvée(s) :\n`);

    sources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name}`);
      console.log(`   Team ID: ${source.config?.team_id || 'N/A'}`);
      console.log(`   Team Name: ${source.config?.team_name || 'N/A'}`);
      console.log(
        `   Bot Token: ${source.config?.bot_token ? source.config.bot_token.substring(0, 20) + '...' : 'N/A'}`
      );
      console.log(`   Active: ${source.is_active ? '✅' : '❌'}`);
      console.log(`   Family ID: ${source.family_id || 'Non lié'}`);
      console.log('');
    });

    if (sources.length === 0) {
      console.log('💡 Aucune source Slack trouvée.');
      console.log(
        "   Installez l'app sur un espace Slack pour générer un token."
      );
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkSlackTokens().catch(console.error);
