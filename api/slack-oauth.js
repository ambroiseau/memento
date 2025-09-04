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

  // Stocker le token en base de données dans external_data_sources
  try {
    // Vérifier si une source Slack existe déjà pour ce team
    const checkResponse = await fetch(`https://zcyalwewcdgbftaaneet.supabase.co/rest/v1/external_data_sources?source_type=eq.slack&config->>team_id=eq.${data.team.id}`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    const existingSources = await checkResponse.json();
    
    if (existingSources.length > 0) {
      // Mettre à jour la source existante
      const updateResponse = await fetch(`https://zcyalwewcdgbftaaneet.supabase.co/rest/v1/external_data_sources?id=eq.${existingSources[0].id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          config: {
            ...existingSources[0].config,
            bot_token: data.access_token,
            team_name: data.team.name
          },
          updated_at: new Date().toISOString()
        })
      });

      if (updateResponse.ok) {
        console.log('Token updated successfully for team:', data.team.id);
      } else {
        console.error('Failed to update token:', await updateResponse.text());
      }
    } else {
      // Créer une nouvelle source (sans family_id pour l'instant)
      const createResponse = await fetch('https://zcyalwewcdgbftaaneet.supabase.co/rest/v1/external_data_sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          family_id: null, // Sera lié plus tard quand l'utilisateur configurera
          source_type: 'slack',
          name: `Slack - ${data.team.name}`,
          config: {
            team_id: data.team.id,
            bot_token: data.access_token,
            team_name: data.team.name
          },
          is_active: false, // Inactif jusqu'à configuration
          created_by: null // Sera mis à jour lors de la configuration
        })
      });

      if (createResponse.ok) {
        console.log('Token stored successfully for team:', data.team.id);
      } else {
        console.error('Failed to store token:', await createResponse.text());
      }
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }

  return res.redirect('/success'); // redirige vers une page frontend de ton Vite
}
