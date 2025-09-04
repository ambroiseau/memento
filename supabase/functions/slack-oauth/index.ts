import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Vérifier l'autorisation pour toutes les requêtes
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Gérer les paramètres GET (OAuth callback)
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: 'Code OAuth et Family ID manquants' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Échange du code contre un access_token
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('SLACK_CLIENT_ID')!,
        client_secret: Deno.env.get('SLACK_CLIENT_SECRET')!,
        code: code,
        redirect_uri: `https://zcyalwewcdgbftaaneet.supabase.co/functions/v1/slack-oauth`,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack OAuth error: ${data.error}`);
    }

    // Créer le client Supabase avec service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Vérifier si une source existe déjà pour cette famille
    const { data: existingSource } = await supabase
      .from('external_data_sources')
      .select('*')
      .eq('family_id', state)
      .eq('source_type', 'slack')
      .single();

    if (existingSource) {
      // Mettre à jour la source existante
      await supabase
        .from('external_data_sources')
        .update({
          name: `Slack - ${data.team.name}`,
          config: {
            ...existingSource.config,
            bot_token: data.access_token,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSource.id);
    } else {
      // Créer une nouvelle source
      await supabase.from('external_data_sources').insert({
        family_id: state,
        source_type: 'slack',
        name: `Slack - ${data.team.name}`,
        config: {
          bot_token: data.access_token,
        },
        is_active: true,
        created_by: null,
      });
    }

    // Rediriger vers l'app avec un message de succès
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `https://memento-ruddy.vercel.app/?slack_connected=true&family_id=${state}`,
      },
    });
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
