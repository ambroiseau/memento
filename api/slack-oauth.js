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

  // Stocker le token en base de données
  try {
    const response = await fetch('https://zcyalwewcdgbftaaneet.supabase.co/rest/v1/slack_workspace_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        team_id: data.team.id,
        bot_token: data.access_token,
        team_name: data.team.name
      })
    });

    if (response.ok) {
      console.log('Token stored successfully for team:', data.team.id);
    } else {
      console.error('Failed to store token:', await response.text());
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }

  return res.redirect('/success'); // redirige vers une page frontend de ton Vite
}
