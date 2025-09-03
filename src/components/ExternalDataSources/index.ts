// Export des composants pour la gestion des sources de données externes
export { TelegramSourceConfig } from './TelegramSourceConfig';
export { ExternalDataSourcesManager } from './ExternalDataSourcesManager';

// Types et interfaces
export type { 
  ExternalDataSource,
  ExternalMedia,
  ExternalDataSourceType,
  MediaType,
  ExternalDataSourceConfig,
  ExternalMediaMetadata,
  CreateExternalDataSourceRequest,
  UpdateExternalDataSourceRequest,
  TelegramWebhookUpdate,
  TelegramMessage,
  TelegramUser,
  TelegramChat,
  TelegramPhoto,
  TelegramVideo,
  TelegramDocument,
  TelegramAudio,
  ExternalDataSourceResponse,
  ExternalMediaResponse,
  ExternalDataSourceFormData,
  TelegramBotSetupData,
  SyncStatus,
  ExternalDataSourceStats
} from '../../types/telegram-integration';
