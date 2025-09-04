/**
 * Script pour tester le flux OAuth Slack
 */

console.log('🧪 Test du flux OAuth Slack...\n');

async function testOAuthFlow() {
  const oauthUrl = 'https://memento-ruddy.vercel.app/api/slack-oauth';

  console.log('📋 Instructions pour tester :');
  console.log("1. Désinstallez l'app Memento de votre espace Slack");
  console.log("2. Utilisez cette URL d'autorisation :");
  console.log('');
  console.log(
    'https://slack.com/oauth/v2/authorize?client_id=486639851300.9450150412581&scope=files:read,channels:read,users:read,chat:write&redirect_uri=https://memento-ruddy.vercel.app/api/slack-oauth'
  );
  console.log('');
  console.log("3. Autorisez l'app dans Slack");
  console.log('4. Vous devriez être redirigé vers /success');
  console.log('5. Vérifiez les logs Vercel pour voir si le token est stocké');
  console.log('');
  console.log('🔍 Pour vérifier les logs Vercel :');
  console.log('1. Allez sur vercel.com/dashboard');
  console.log('2. Projet memento-app → Functions');
  console.log('3. Cliquez sur slack-oauth');
  console.log('4. Regardez les logs pour voir les erreurs');
  console.log('');
  console.log('💡 Si ça ne marche pas, vérifiez :');
  console.log("- Les variables d'environnement Vercel");
  console.log('- Les permissions RLS de la table external_data_sources');
  console.log("- Les logs d'erreur dans Vercel");
}

testOAuthFlow().catch(console.error);
