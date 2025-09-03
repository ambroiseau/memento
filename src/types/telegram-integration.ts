// Types pour l'intégration Telegram et sources de données externes

export type ExternalDataSourceType = 'telegram' | 'whatsapp' | 'email';

export type MediaType = 'image' | 'video' | 'document' | 'audio';

export interface ExternalDataSource {
  id: string;
  family_id: string;
  type: ExternalDataSourceType;
  name: string;
  config: ExternalDataSourceConfig;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalDataSourceConfig {
  // Configuration commune
  description?: string;
  
  // Configuration spécifique à Telegram
  bot_token?: string;
  chat_id?: string;
  chat_title?: string;
  webhook_url?: string;
  
  // Configuration spécifique à WhatsApp (pour le futur)
  phone_number?: string;
  api_key?: string;
  
  // Configuration spécifique à Email (pour le futur)
  email_address?: string;
  imap_server?: string;
  imap_port?: number;
  imap_username?: string;
  imap_password?: string;
}

export interface ExternalMedia {
  id: string;
  family_id: string;
  source_id: string;
  external_id: string;
  media_type: MediaType;
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  metadata: ExternalMediaMetadata;
  imported_at: string;
}

export interface ExternalMediaMetadata {
  // Métadonnées communes
  file_size?: number;
  mime_type?: string;
  duration?: number; // pour les vidéos/audio
  
  // Métadonnées spécifiques à Telegram
  message_id?: number;
  chat_id?: string;
  sender_id?: number;
  sender_name?: string;
  sender_username?: string;
  timestamp?: string;
  forward_from?: string;
  reply_to_message_id?: number;
  
  // Métadonnées spécifiques à WhatsApp
  phone_number?: string;
  contact_name?: string;
  
  // Métadonnées spécifiques à Email
  email_subject?: string;
  email_from?: string;
  email_date?: string;
}

// Types pour les requêtes API
export interface CreateExternalDataSourceRequest {
  family_id: string;
  type: ExternalDataSourceType;
  name: string;
  config: ExternalDataSourceConfig;
}

export interface UpdateExternalDataSourceRequest {
  name?: string;
  config?: Partial<ExternalDataSourceConfig>;
  is_active?: boolean;
}

export interface TelegramWebhookUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

export interface TelegramMessage {
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

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramPhoto {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramVideo {
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

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  thumbnail?: TelegramPhoto;
}

export interface TelegramAudio {
  file_id: string;
  file_unique_id: string;
  duration: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
}

// Types pour les réponses API
export interface ExternalDataSourceResponse {
  success: boolean;
  data?: ExternalDataSource;
  error?: string;
}

export interface ExternalMediaResponse {
  success: boolean;
  data?: ExternalMedia[];
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Types pour les composants React
export interface ExternalDataSourceFormData {
  name: string;
  type: ExternalDataSourceType;
  config: ExternalDataSourceConfig;
}

export interface TelegramBotSetupData {
  bot_token: string;
  chat_selection: 'existing' | 'new';
  chat_id?: string;
  chat_title?: string;
}

// Types pour les états de synchronisation
export interface SyncStatus {
  source_id: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  last_sync_at?: string;
  error_message?: string;
  media_count: number;
  progress?: number;
}

// Types pour les statistiques
export interface ExternalDataSourceStats {
  source_id: string;
  total_media: number;
  media_by_type: Record<MediaType, number>;
  last_sync_at?: string;
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  storage_used: number; // en bytes
}
