export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Code OAuth manquant');
  }

  // Échange du code contre un access_token
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      redirect_uri: 'https://memento-ruddy.vercel.app/api/slack-oauth',
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    return res.status(500).json({ error: data.error });
  }

  console.log('Slack OAuth success:', data);

  // Tu peux enregistrer data.access_token en DB si besoin
  return res.redirect('/success'); // redirige vers une page frontend de ton Vite
}
