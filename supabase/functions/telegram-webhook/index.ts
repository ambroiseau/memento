import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types pour Telegram
interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  photo?: TelegramPhoto[];
  caption?: string;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TelegramPhoto {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

// Configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async req => {
  console.log('=== START REQUEST ===');
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

    let body: TelegramUpdate;
    try {
      body = JSON.parse(raw);
    } catch {
      console.log('JSON parse failed');
      return new Response('ok', { status: 200 });
    }

    console.log('Parsed body:', JSON.stringify(body, null, 2));

    // Valider la structure de la requête
    if (!body || !body.update_id) {
      console.log('Invalid format, but returning 200 anyway (not 400)');
      return new Response('ok', { status: 200 });
    }

    // Extraire le message
    const message = body.message || body.edited_message || body.channel_post;

    if (!message) {
      console.log('No message to process');
      return new Response('ok', { status: 200 });
    }

    console.log('Received Telegram update', body.update_id);

    // Traiter le message
    const result = await processTelegramMessage(message);
    console.log('Final result:', result);

    console.log('=== END REQUEST ===');
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
 * Traite un message Telegram et extrait les photos
 */
async function processTelegramMessage(message: TelegramMessage) {
  console.log('Processing message:', message.message_id);

  // Traiter seulement les photos pour l'instant
  if (message.photo && message.photo.length > 0) {
    console.log('Photo detected!');

    // Prendre la photo de plus haute résolution (dernière du tableau)
    const photo = message.photo[message.photo.length - 1];

    try {
      await processPhoto(message.chat.id, photo, message.caption);
      return {
        success: true,
        message: 'Photo processed successfully',
        hasPhoto: true,
      };
    } catch (error) {
      console.error('Error processing photo:', error);
      return {
        success: false,
        message: 'Error processing photo',
        error: error.message,
      };
    }
  }

  console.log('No photo in message');
  return { success: true, message: 'No image to process' };
}

/**
 * Traite une photo Telegram
 */
async function processPhoto(
  chatId: number,
  photo: TelegramPhoto,
  caption?: string
) {
  console.log('Processing photo:', photo.file_id);
  console.log('Caption received:', caption || 'No caption');

  try {
    // Obtenir les variables d'environnement
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!botToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Identifier la famille basée sur le chat_id
    const family = await findFamilyByChatId(supabase, chatId.toString());
    if (!family) {
      throw new Error(`No family found for chat ID: ${chatId}`);
    }

    console.log('Found family:', family.id);

    // 2. Télécharger le fichier depuis Telegram
    const fileInfo = await downloadTelegramFile(botToken, photo.file_id);
    console.log('File info:', fileInfo);

    // 3. Upload vers Supabase Storage
    const storagePath = `telegram/${photo.file_unique_id}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images-display')
      .upload(storagePath, fileInfo.buffer, {
        contentType: 'image/jpeg',
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
        created_by: family.created_by,
        source_type: 'telegram',
        content_text: caption || null, // Caption dans le post
        metadata: {
          chat_id: chatId,
          message_id: photo.file_id,
          file_unique_id: photo.file_unique_id,
          caption: caption,
          telegram_user: 'Unknown',
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
        width: photo.width,
        height: photo.height,
        file_size: photo.file_size,
      })
      .select()
      .single();

    if (imageError) {
      throw new Error(`Failed to create post image: ${imageError.message}`);
    }

    console.log('Post image created:', imageData.id);
    return { postId: postData.id, imageId: imageData.id };
  } catch (error) {
    console.error('Error in processPhoto:', error);
    throw error;
  }
}

/**
 * Trouve la famille basée sur le chat_id Telegram
 */
async function findFamilyByChatId(supabase: any, chatId: string) {
  console.log('Looking for family with chat_id:', chatId);

  const { data, error } = await supabase
    .from('external_data_sources')
    .select('*')
    .eq('source_type', 'telegram')
    .eq('config->>chat_id', chatId)
    .single();

  if (error) {
    console.log('Error finding family:', error.message);
    return null;
  }

  if (!data) {
    console.log('No family found for chat_id:', chatId);
    return null;
  }

  console.log('Found external data source:', data.id);

  // Récupérer les informations de la famille
  const { data: familyData, error: familyError } = await supabase
    .from('families')
    .select('*')
    .eq('id', data.family_id)
    .single();

  if (familyError || !familyData) {
    console.log('Error finding family details:', familyError?.message);
    return null;
  }

  return familyData;
}

/**
 * Télécharge un fichier depuis Telegram
 */
async function downloadTelegramFile(botToken: string, fileId: string) {
  console.log('Downloading file from Telegram:', fileId);

  // 1. Obtenir le file_path
  const getFileResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
  );

  if (!getFileResponse.ok) {
    throw new Error(`Failed to get file info: ${getFileResponse.statusText}`);
  }

  const fileInfo = await getFileResponse.json();

  if (!fileInfo.ok) {
    throw new Error(`Telegram API error: ${fileInfo.description}`);
  }

  const filePath = fileInfo.result.file_path;
  console.log('File path:', filePath);

  // 2. Télécharger le fichier
  const downloadResponse = await fetch(
    `https://api.telegram.org/file/bot${botToken}/${filePath}`
  );

  if (!downloadResponse.ok) {
    throw new Error(`Failed to download file: ${downloadResponse.statusText}`);
  }

  const buffer = await downloadResponse.arrayBuffer();
  console.log('File downloaded, size:', buffer.byteLength);

  return {
    buffer: new Uint8Array(buffer),
    file_path: filePath,
    file_size: buffer.byteLength,
  };
}
