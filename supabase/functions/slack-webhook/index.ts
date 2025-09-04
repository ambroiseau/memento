import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types pour Slack
interface SlackEvent {
  type: string;
  event?: SlackEventData;
  challenge?: string;
  token?: string;
}

interface SlackEventData {
  type: string;
  channel: string;
  user: string;
  text?: string;
  files?: SlackFile[];
  file?: SlackFile;
  ts: string;
}

interface SlackFile {
  id: string;
  name: string;
  title: string;
  mimetype: string;
  filetype: string;
  pretty_type: string;
  user: string;
  size: number;
  url_private: string;
  url_private_download: string;
  thumb_64?: string;
  thumb_80?: string;
  thumb_360?: string;
  thumb_360_w?: number;
  thumb_360_h?: number;
  permalink: string;
  permalink_public: string;
  is_external: boolean;
  is_public: boolean;
  public_url_shared: boolean;
  display_as_bot: boolean;
  username: string;
  timestamp: number;
}

// Configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async req => {
  console.log('=== START SLACK REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      console.log('Method not allowed, returning 200');
      return new Response('ok', { status: 200 });
    }

    // Parser le body de la requête
    const raw = await req.text();
    console.log('Raw body:', raw);

    let body: SlackEvent;
    try {
      body = JSON.parse(raw);
    } catch {
      console.log('JSON parse failed');
      return new Response('ok', { status: 200 });
    }

    console.log('Parsed body:', JSON.stringify(body, null, 2));

    // Gérer le challenge Slack (URL verification)
    if (body.type === 'url_verification' && body.challenge) {
      console.log('Slack URL verification challenge');
      return new Response(body.challenge, { status: 200 });
    }

    // Valider la structure de la requête
    if (!body || !body.event) {
      console.log('Invalid format, but returning 200 anyway');
      return new Response('ok', { status: 200 });
    }

    // Traiter l'événement Slack
    const result = await processSlackEvent(body.event);
    console.log('Final result:', result);

    console.log('=== END SLACK REQUEST ===');
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response('ok', { status: 200 });
  }
});

/**
 * Traite un événement Slack et extrait les fichiers
 */
async function processSlackEvent(event: SlackEventData) {
  console.log('Processing Slack event:', event.type);

  // Gérer l'ajout du bot au channel
  if (event.type === 'member_joined_channel') {
    console.log('Member joined channel event');
    const botUserId = Deno.env.get('SLACK_BOT_USER_ID');

    if (event.user === botUserId) {
      console.log('Bot joined channel:', event.channel);
      await handleBotJoinedChannel(event.channel);
      return {
        success: true,
        message: 'Bot joined channel, setup message sent',
      };
    }
  }

  // Gérer les mentions du bot
  if (event.type === 'app_mention') {
    console.log('App mention detected');
    await handleAppMention(event);
    return {
      success: true,
      message: 'App mention processed',
    };
  }

  // Traiter seulement les fichiers partagés
  if (event.type === 'file_shared' && event.file) {
    console.log('File shared detected!');

    try {
      await processSlackFile(event.channel, event.file, event);
      return {
        success: true,
        message: 'File processed successfully',
        hasFile: true,
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        message: 'Error processing file',
        error: error.message,
      };
    }
  }

  // Traiter les messages avec fichiers
  if (event.type === 'message' && event.files && event.files.length > 0) {
    console.log('Message with files detected!');

    try {
      for (const file of event.files) {
        await processSlackFile(event.channel, file, event);
      }
      return {
        success: true,
        message: 'Files processed successfully',
        hasFile: true,
      };
    } catch (error) {
      console.error('Error processing files:', error);
      return {
        success: false,
        message: 'Error processing files',
        error: error.message,
      };
    }
  }

  console.log('No files to process');
  return { success: true, message: 'No files to process' };
}

/**
 * Traite un fichier Slack
 */
async function processSlackFile(
  channelId: string,
  file: SlackFile,
  event?: SlackEventData
) {
  console.log('Processing Slack file:', file.id);
  console.log('File name:', file.name);
  console.log('File type:', file.mimetype);

  try {
    // Obtenir les variables d'environnement
    const slackBotToken = Deno.env.get('SLACK_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!slackBotToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Identifier la famille basée sur le channel_id
    const family = await findFamilyByChannelId(supabase, channelId);
    if (!family) {
      throw new Error(`No family found for channel ID: ${channelId}`);
    }

    console.log('Found family:', family.id);

    // 2. Télécharger le fichier depuis Slack
    const fileInfo = await downloadSlackFile(slackBotToken, file);
    console.log('File downloaded, size:', fileInfo.buffer.byteLength);

    // 3. Upload vers Supabase Storage
    const fileExtension = getFileExtension(file.name, file.mimetype);
    const storagePath = `slack/${file.id}${fileExtension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images-display')
      .upload(storagePath, fileInfo.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('Upload successful:', storagePath);

    // 4. Créer le post dans la base de données
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        family_id: family.id,
        user_id: family.created_by,
        source_type: 'slack',
        content_text: event?.text || file.title || null,
        metadata: {
          channel_id: channelId,
          file_id: file.id,
          file_name: file.name,
          file_type: file.mimetype,
          file_size: file.size,
          slack_user: file.username || 'Unknown',
          slack_user_info: {
            user_id: file.user,
            username: file.username,
          },
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (postError) {
      throw new Error(`Failed to create post: ${postError.message}`);
    }

    console.log('Post created:', postData.id);

    // 5. Créer l'entrée dans post_images
    const { data: imageData, error: imageError } = await supabase
      .from('post_images')
      .insert({
        post_id: postData.id,
        family_id: family.id,
        storage_path: storagePath,
        display_url: supabase.storage
          .from('post-images-display')
          .getPublicUrl(storagePath).data.publicUrl,
        width: file.thumb_360_w || null,
        height: file.thumb_360_h || null,
        file_size: file.size,
      })
      .select()
      .single();

    if (imageError) {
      throw new Error(`Failed to create post image: ${imageError.message}`);
    }

    console.log('Post image created:', imageData.id);
    return { postId: postData.id, imageId: imageData.id };
  } catch (error) {
    console.error('Error in processSlackFile:', error);
    throw error;
  }
}

/**
 * Trouve la famille basée sur le channel_id Slack
 */
async function findFamilyByChannelId(supabase: any, channelId: string) {
  console.log('Looking for family with channel_id:', channelId);

  const { data, error } = await supabase
    .from('external_data_sources')
    .select('*')
    .eq('source_type', 'slack')
    .eq('config->>channel_id', channelId)
    .single();

  if (error) {
    console.log('Error finding family:', error.message);
    return null;
  }

  if (!data) {
    console.log('No family found for channel_id:', channelId);
    return null;
  }

  console.log('Found external data source:', data.id);

  // Récupérer les informations de la famille ET l'admin
  const { data: familyData, error: familyError } = await supabase
    .from('families')
    .select('*')
    .eq('id', data.family_id)
    .single();

  if (familyError || !familyData) {
    console.log('Error finding family details:', familyError?.message);
    return null;
  }

  // Récupérer l'admin de la famille
  const { data: adminData, error: adminError } = await supabase
    .from('family_members')
    .select('user_id')
    .eq('family_id', data.family_id)
    .eq('role', 'admin')
    .single();

  if (adminError || !adminData) {
    console.log('Error finding family admin:', adminError?.message);
    return null;
  }

  // Ajouter l'admin à l'objet famille
  return {
    ...familyData,
    created_by: adminData.user_id,
  };
}

/**
 * Télécharge un fichier depuis Slack
 */
async function downloadSlackFile(botToken: string, file: SlackFile) {
  console.log('Downloading file from Slack:', file.id);

  // Télécharger le fichier avec le token bot
  const downloadResponse = await fetch(file.url_private, {
    headers: {
      Authorization: `Bearer ${botToken}`,
    },
  });

  if (!downloadResponse.ok) {
    throw new Error(`Failed to download file: ${downloadResponse.statusText}`);
  }

  const buffer = await downloadResponse.arrayBuffer();
  console.log('File downloaded, size:', buffer.byteLength);

  return {
    buffer: new Uint8Array(buffer),
    file_size: buffer.byteLength,
  };
}

/**
 * Gère l'ajout du bot au channel
 */
async function handleBotJoinedChannel(channelId: string) {
  console.log('Bot joined channel:', channelId);

  try {
    const slackBotToken = Deno.env.get('SLACK_BOT_TOKEN');
    if (!slackBotToken) {
      throw new Error('SLACK_BOT_TOKEN not configured');
    }

    // Vérifier s'il y a un code de liaison en attente dans external_data_sources
    const pendingSource = await findPendingSlackSource();

    if (pendingSource) {
      // Mettre à jour la source existante avec le channel_id
      await updateSlackSourceChannel(pendingSource.id, channelId);

      const linkCode = pendingSource.config.link_code;
      const message = `🎉 **Memento Bot ajouté !**

Channel détecté : \`${channelId}\`

Code de liaison : \`${linkCode}\`

Pour lier ce channel à votre famille Memento :
1. Mentionnez-moi avec : \`@MementoBot ${linkCode}\`
2. Le channel sera automatiquement lié !

Une fois lié, toutes les photos partagées dans ce channel seront automatiquement ajoutées à votre album familial ! 📸`;

      await postSlackMessage(channelId, message);
    } else {
      // Générer un nouveau code de liaison
      const linkCode = generateLinkCode();

      const message = `🎉 **Memento Bot ajouté !**

Channel détecté : \`${channelId}\`

Code de liaison : \`${linkCode}\`

Pour lier ce channel à votre famille Memento :
1. Allez dans l'app Memento → Paramètres → Slack
2. Cliquez sur "Lier automatiquement"
3. Entrez ce code : \`${linkCode}\`
4. Mentionnez-moi avec : \`@MementoBot ${linkCode}\`

Une fois lié, toutes les photos partagées dans ce channel seront automatiquement ajoutées à votre album familial ! 📸`;

      await postSlackMessage(channelId, message);
    }
  } catch (error) {
    console.error('Error handling bot joined channel:', error);
  }
}

/**
 * Gère les mentions du bot
 */
async function handleAppMention(event: SlackEventData) {
  console.log('Processing app mention:', event.text);

  try {
    const text = event.text || '';
    const linkCodeMatch = text.match(/`?([A-Z0-9]{6,8})`?/);

    if (linkCodeMatch) {
      const linkCode = linkCodeMatch[1];
      console.log('Link code found:', linkCode);

      // Vérifier si le code existe dans external_data_sources
      console.log('Looking for link code:', linkCode);
      const slackSource = await getSlackSourceByLinkCode(linkCode);
      console.log('Found slack source:', slackSource);

      if (slackSource && slackSource.config.channel_id === event.channel) {
        // Le code correspond au bon channel
        await activateSlackSource(slackSource.id);

        // Répondre avec succès
        await postSlackMessage(
          event.channel,
          `✅ **Channel lié avec succès !**

Ce channel est maintenant connecté à votre famille Memento. Toutes les photos partagées ici seront automatiquement ajoutées à votre album familial ! 📸`
        );
      } else {
        // Code invalide ou mauvais channel
        await postSlackMessage(
          event.channel,
          `❌ **Code invalide**

Le code \`${linkCode}\` n'est pas valide pour ce channel. Vérifiez le code dans l'app Memento.`
        );
      }
    } else {
      // Pas de code trouvé
      await postSlackMessage(
        event.channel,
        `👋 **Salut !**

Pour lier ce channel à votre famille Memento, mentionnez-moi avec un code de liaison de l'app Memento.

Exemple : \`@MementoBot ABC123\``
      );
    }
  } catch (error) {
    console.error('Error handling app mention:', error);
  }
}

/**
 * Génère un code de liaison unique
 */
function generateLinkCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Trouve une source Slack en attente dans external_data_sources
 */
async function findPendingSlackSource() {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('external_data_sources')
      .select('*')
      .eq('source_type', 'slack')
      .eq('config->>channel_id', 'PENDING_AUTO_LINK')
      .eq('is_active', false)
      .gt('config->>expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Pending source query result:', { data, error });

    if (error || !data) {
      console.log('No pending Slack source found');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in findPendingSlackSource:', error);
    return null;
  }
}

/**
 * Met à jour le channel_id d'une source Slack
 */
async function updateSlackSourceChannel(sourceId: string, channelId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer la config actuelle
    const { data: currentData, error: fetchError } = await supabase
      .from('external_data_sources')
      .select('config')
      .eq('id', sourceId)
      .single();

    if (fetchError || !currentData) {
      throw new Error('Failed to fetch current config');
    }

    // Mettre à jour la config avec le nouveau channel_id
    const updatedConfig = {
      ...currentData.config,
      channel_id: channelId,
    };

    const { error } = await supabase
      .from('external_data_sources')
      .update({
        config: updatedConfig,
        name: `Slack Channel ${channelId}`,
      })
      .eq('id', sourceId);

    if (error) {
      console.error('Error updating Slack source channel:', error);
    } else {
      console.log('Slack source channel updated:', sourceId, '->', channelId);
    }
  } catch (error) {
    console.error('Error in updateSlackSourceChannel:', error);
  }
}

/**
 * Récupère la source Slack par code de liaison
 */
async function getSlackSourceByLinkCode(linkCode: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('external_data_sources')
      .select('*')
      .eq('source_type', 'slack')
      .eq('config->>link_code', linkCode)
      .gt('config->>expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      console.log('Link code not found or expired:', linkCode, 'Error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSlackSourceByLinkCode:', error);
    return null;
  }
}

/**
 * Active une source Slack (marque comme active)
 */
async function activateSlackSource(sourceId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer la config actuelle
    const { data: currentData, error: fetchError } = await supabase
      .from('external_data_sources')
      .select('config')
      .eq('id', sourceId)
      .single();

    if (fetchError || !currentData) {
      throw new Error('Failed to fetch current config');
    }

    // Nettoyer la config (supprimer link_code et expires_at)
    const { link_code, expires_at, ...cleanConfig } = currentData.config;

    const { error } = await supabase
      .from('external_data_sources')
      .update({
        config: cleanConfig,
        is_active: true,
      })
      .eq('id', sourceId);

    if (error) {
      console.error('Error activating Slack source:', error);
    } else {
      console.log('Slack source activated:', sourceId);
    }
  } catch (error) {
    console.error('Error in activateSlackSource:', error);
  }
}

/**
 * Poste un message dans Slack
 */
async function postSlackMessage(channelId: string, text: string) {
  try {
    const slackBotToken = Deno.env.get('SLACK_BOT_TOKEN');
    if (!slackBotToken) {
      throw new Error('SLACK_BOT_TOKEN not configured');
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        text: text,
      }),
    });

    const result = await response.json();
    console.log('Message posted:', result);
  } catch (error) {
    console.error('Error posting Slack message:', error);
  }
}

/**
 * Détermine l'extension de fichier basée sur le nom et le type MIME
 */
function getFileExtension(filename: string, mimetype: string): string {
  // Essayer d'extraire l'extension du nom de fichier
  const lastDot = filename.lastIndexOf('.');
  if (lastDot !== -1) {
    return filename.substring(lastDot);
  }

  // Fallback basé sur le type MIME
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf',
  };

  return mimeToExt[mimetype] || '.bin';
}
