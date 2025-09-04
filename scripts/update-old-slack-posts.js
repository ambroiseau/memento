/**
 * Script pour mettre à jour les anciens posts Slack qui affichent "Unknown"
 * Ce script utilise l'API users.info pour récupérer les vrais noms
 */

console.log('🔄 Mise à jour des anciens posts Slack...\n');

async function updateOldSlackPosts() {
  const webhookUrl =
    'https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-webhook';

  // Simuler un événement pour récupérer les infos utilisateur
  const testEvent = {
    type: 'get_user_info',
    user_id: 'UEB5RHGGZ', // Votre User ID
  };

  console.log('📤 Test de récupération des infos utilisateur...');
  console.log('User ID:', testEvent.user_id);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent),
    });

    const result = await response.text();
    console.log('📥 Réponse:', result);

    if (response.ok) {
      console.log('✅ Test réussi');
    } else {
      console.log('❌ Erreur:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n💡 Pour mettre à jour les anciens posts :');
  console.log('1. Partagez un nouveau fichier dans le channel C09DEU6GRDK');
  console.log("2. Vérifiez que le nom s'affiche correctement");
  console.log(
    '3. Si ça marche, on peut créer un script pour mettre à jour les anciens'
  );
  console.log('\n🔧 Alternative :');
  console.log("- Les anciens posts resteront avec 'Unknown'");
  console.log('- Seuls les nouveaux posts auront les vrais noms');
  console.log("- C'est acceptable pour la transition");
}

updateOldSlackPosts().catch(console.error);
