import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { MediaProcessor } from './media-processor.ts';

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
  video?: TelegramVideo;
  document?: TelegramDocument;
  audio?: TelegramAudio;
  caption?: string;
  forward_from?: TelegramUser;
  reply_to_message?: TelegramMessage;
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

interface TelegramVideo {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  duration: number;
  thumbnail?: TelegramPhoto;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail?: TelegramPhoto;
}

interface TelegramAudio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
}

// Configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier l'en-tête Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parser le body de la requête
    const body: TelegramUpdate = await req.json();
    
    // Valider la structure de la requête
    if (!body.update_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram update format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire le message (priorité: message > edited_message > channel_post)
    const message = body.message || body.edited_message || body.channel_post;
    
    if (!message) {
      // Pas de message, webhook valide mais rien à traiter
      return new Response(
        JSON.stringify({ success: true, message: 'No message to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Traiter le message
    const result = await processTelegramMessage(message);

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Traite un message Telegram et extrait les médias
 */
async function processTelegramMessage(message: TelegramMessage) {
  const mediaItems = [];
  
  // Traiter les photos
  if (message.photo && message.photo.length > 0) {
    // Prendre la photo de plus haute résolution (dernière du tableau)
    const photo = message.photo[message.photo.length - 1];
    mediaItems.push({
      type: 'image',
      file_id: photo.file_id,
      file_unique_id: photo.file_unique_id,
      width: photo.width,
      height: photo.height,
      file_size: photo.file_size,
      caption: message.caption,
      metadata: extractMessageMetadata(message),
    });
  }

  // Traiter les vidéos
  if (message.video) {
    mediaItems.push({
      type: 'video',
      file_id: message.video.file_id,
      file_unique_id: message.video.file_unique_id,
      width: message.video.width,
      height: message.video.height,
      duration: message.video.duration,
      file_name: message.video.file_name,
      mime_type: message.video.mime_type,
      file_size: message.video.file_size,
      caption: message.caption,
      metadata: extractMessageMetadata(message),
    });
  }

  // Traiter les documents
  if (message.document) {
    mediaItems.push({
      type: 'document',
      file_id: message.document.file_id,
      file_unique_id: message.document.file_unique_id,
      file_name: message.document.file_name,
      mime_type: message.document.mime_type,
      file_size: message.document.file_size,
      caption: message.caption,
      metadata: extractMessageMetadata(message),
    });
  }

  // Traiter les fichiers audio
  if (message.audio) {
    mediaItems.push({
      type: 'audio',
      file_id: message.audio.file_id,
      file_unique_id: message.audio.file_unique_id,
      duration: message.audio.duration,
      performer: message.audio.performer,
      title: message.audio.title,
      mime_type: message.audio.mime_type,
      file_size: message.audio.file_size,
      caption: message.caption,
      metadata: extractMessageMetadata(message),
    });
  }

  // Si des médias ont été trouvés, les traiter
  if (mediaItems.length > 0) {
    await processMediaItems(message.chat.id.toString(), mediaItems);
  }

  return {
    message_id: message.message_id,
    chat_id: message.chat.id,
    chat_type: message.chat.type,
    chat_title: message.chat.title || message.chat.first_name,
    media_count: mediaItems.length,
    media_types: mediaItems.map(item => item.type),
    processed_at: new Date().toISOString(),
  };
}

/**
 * Extrait les métadonnées d'un message Telegram
 */
function extractMessageMetadata(message: TelegramMessage) {
  return {
    message_id: message.message_id,
    chat_id: message.chat.id,
    chat_type: message.chat.type,
    chat_title: message.chat.title || message.chat.first_name,
    sender_id: message.from?.id,
    sender_name: message.from ? `${message.from.first_name} ${message.from.last_name || ''}`.trim() : undefined,
    sender_username: message.from?.username,
    timestamp: new Date(message.date * 1000).toISOString(),
    forward_from: message.forward_from ? {
      id: message.forward_from.id,
      name: `${message.forward_from.first_name} ${message.forward_from.last_name || ''}`.trim(),
      username: message.forward_from.username,
    } : undefined,
    reply_to_message_id: message.reply_to_message?.message_id,
  };
}

/**
 * Traite les éléments média et les sauvegarde
 */
async function processMediaItems(chatId: string, mediaItems: any[]) {
  try {
    // Obtenir les variables d'environnement
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!botToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }
    
    // Créer le processeur de médias
    const mediaProcessor = new MediaProcessor(botToken, supabaseUrl, supabaseServiceKey);
    
    // Traiter les médias
    const results = await mediaProcessor.processMediaItems(chatId, mediaItems);
    
    console.log(`Processed ${mediaItems.length} media items for chat ${chatId}`);
    console.log('Results:', results);
    
    return results;
    
  } catch (error) {
    console.error('Error processing media items:', error);
    throw error;
  }
}
