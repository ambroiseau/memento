export default async function handler(req, res) {
  // Parse les paramètres de l'URL
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  console.log('OAuth request received:', {
    code,
    state,
    url: req.url,
    searchParams: Object.fromEntries(url.searchParams),
  });

  if (!code) {
    return res.status(400).send('Code OAuth manquant');
  }

  if (!state) {
    console.log('State parameter missing:', {
      url: req.url,
      searchParams: Object.fromEntries(url.searchParams),
    });
    return res.status(400).send('Family ID manquant');
  }

  const family_id = state;

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
    const checkResponse = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/external_data_sources?source_type=eq.slack&config->>team_id=eq.${data.team.id}`,
      {
        headers: {
          apikey: process.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    );

    const existingSources = await checkResponse.json();

    if (existingSources.length > 0) {
      // Mettre à jour la source existante
      const updateResponse = await fetch(
        `${process.env.VITE_SUPABASE_URL}/rest/v1/external_data_sources?id=eq.${existingSources[0].id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            config: {
              ...existingSources[0].config,
              bot_token: data.access_token,
              team_name: data.team.name,
            },
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (updateResponse.ok) {
        console.log('Token updated successfully for team:', data.team.id);
      } else {
        console.error('Failed to update token:', await updateResponse.text());
      }
    } else {
      // Créer une nouvelle source (sans family_id pour l'instant)
      const createResponse = await fetch(
        `${process.env.VITE_SUPABASE_URL}/rest/v1/external_data_sources`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            family_id: family_id, // Lié à la famille qui a initié l'OAuth
            source_type: 'slack',
            name: `Slack - ${data.team.name}`,
            config: {
              team_id: data.team.id,
              bot_token: data.access_token,
              team_name: data.team.name,
            },
            is_active: true, // Actif immédiatement
            created_by: null, // Sera mis à jour lors de la configuration
          }),
        }
      );

      if (createResponse.ok) {
        console.log('Token stored successfully for team:', data.team.id);
      } else {
        console.error('Failed to store token:', await createResponse.text());
      }
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }

  // Rediriger vers les paramètres avec un message de succès
  return res.redirect(`/?slack_connected=true&family_id=${family_id}`);
}
