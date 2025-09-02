import { supabase } from './supabase/client';
import type {
  ExternalDataSource,
  ExternalMedia,
  CreateExternalDataSourceRequest,
  UpdateExternalDataSourceRequest,
  ExternalDataSourceResponse,
  ExternalMediaResponse,
  TelegramWebhookUpdate,
} from '../types/telegram-integration';

export const externalDataApi = {
  // ===== GESTION DES SOURCES DE DONNÉES =====
  
  /**
   * Créer une nouvelle source de données externe
   */
  createExternalDataSource: async (
    request: CreateExternalDataSourceRequest
  ): Promise<ExternalDataSourceResponse> => {
    try {
      const { data, error } = await supabase
        .from('external_data_sources')
        .insert({
          family_id: request.family_id,
          type: request.type,
          name: request.name,
          config: request.config,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating external data source:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Unexpected error creating external data source:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Récupérer toutes les sources de données d'une famille
   */
  getFamilyExternalDataSources: async (
    familyId: string
  ): Promise<ExternalDataSourceResponse> => {
    try {
      const { data, error } = await supabase
        .from('external_data_sources')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching external data sources:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Unexpected error fetching external data sources:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Récupérer une source de données spécifique
   */
  getExternalDataSource: async (
    sourceId: string
  ): Promise<ExternalDataSourceResponse> => {
    try {
      const { data, error } = await supabase
        .from('external_data_sources')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (error) {
        console.error('Error fetching external data source:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Unexpected error fetching external data source:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Mettre à jour une source de données
   */
  updateExternalDataSource: async (
    sourceId: string,
    updates: UpdateExternalDataSourceRequest
  ): Promise<ExternalDataSourceResponse> => {
    try {
      const { data, error } = await supabase
        .from('external_data_sources')
        .update(updates)
        .eq('id', sourceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating external data source:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Unexpected error updating external data source:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Supprimer une source de données
   */
  deleteExternalDataSource: async (
    sourceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('external_data_sources')
        .delete()
        .eq('id', sourceId);

      if (error) {
        console.error('Error deleting external data source:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting external data source:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Activer/désactiver une source de données
   */
  toggleExternalDataSource: async (
    sourceId: string,
    isActive: boolean
  ): Promise<ExternalDataSourceResponse> => {
    return externalDataApi.updateExternalDataSource(sourceId, { is_active: isActive });
  },

  // ===== GESTION DES MÉDIAS EXTERNES =====

  /**
   * Récupérer les médias d'une source externe
   */
  getExternalMedia: async (
    sourceId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ExternalMediaResponse> => {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('external_media')
        .select('*', { count: 'exact' })
        .eq('source_id', sourceId)
        .order('imported_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching external media:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      console.error('Unexpected error fetching external media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Récupérer tous les médias d'une famille
   */
  getFamilyExternalMedia: async (
    familyId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ExternalMediaResponse> => {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('external_media')
        .select('*', { count: 'exact' })
        .eq('family_id', familyId)
        .order('imported_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching family external media:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      console.error('Unexpected error fetching family external media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Supprimer un média externe
   */
  deleteExternalMedia: async (
    mediaId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('external_media')
        .delete()
        .eq('id', mediaId);

      if (error) {
        console.error('Error deleting external media:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting external media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // ===== UTILITAIRES TELEGRAM =====

  /**
   * Valider un token de bot Telegram
   */
  validateTelegramBotToken: async (botToken: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`
      );
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.ok === true && data.result?.is_bot === true;
    } catch (error) {
      console.error('Error validating Telegram bot token:', error);
      return false;
    }
  },

  /**
   * Récupérer les informations d'un chat Telegram
   */
  getTelegramChatInfo: async (
    botToken: string,
    chatId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatId}`
      );
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      if (!data.ok) {
        return {
          success: false,
          error: data.description || 'Telegram API error',
        };
      }

      return {
        success: true,
        data: data.result,
      };
    } catch (error) {
      console.error('Error fetching Telegram chat info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Tester la connexion à une source Telegram
   */
  testTelegramConnection: async (
    botToken: string,
    chatId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Test 1: Valider le bot
      const botValid = await externalDataApi.validateTelegramBotToken(botToken);
      if (!botValid) {
        return {
          success: false,
          error: 'Invalid bot token',
        };
      }

      // Test 2: Vérifier l'accès au chat
      const chatInfo = await externalDataApi.getTelegramChatInfo(botToken, chatId);
      if (!chatInfo.success) {
        return {
          success: false,
          error: `Cannot access chat: ${chatInfo.error}`,
        };
      }

      // Test 3: Envoyer un message de test (optionnel)
      // const testMessage = await fetch(
      //   `https://api.telegram.org/bot${botToken}/sendMessage`,
      //   {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       chat_id: chatId,
      //       text: '🤖 Test de connexion - Memento App',
      //     }),
      //   }
      // );

      return { success: true };
    } catch (error) {
      console.error('Error testing Telegram connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
