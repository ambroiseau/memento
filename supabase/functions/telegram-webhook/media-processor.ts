import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TelegramService } from './telegram-service.ts';

export class MediaProcessor {
  private supabase: any;
  private telegramService: TelegramService;

  constructor(
    botToken: string,
    supabaseUrl: string,
    supabaseServiceKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.telegramService = new TelegramService(botToken, supabaseUrl, supabaseServiceKey);
  }

  /**
   * Traite et sauvegarde un ensemble de médias
   */
  async processMediaItems(chatId: string, mediaItems: any[]): Promise<any[]> {
    const results = [];
    
    for (const item of mediaItems) {
      try {
        const result = await this.processSingleMediaItem(chatId, item);
        results.push({ success: true, data: result });
      } catch (error) {
        console.error(`Error processing media item ${item.file_id}:`, error);
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          file_id: item.file_id 
        });
      }
    }
    
    return results;
  }

  /**
   * Traite un seul élément média
   */
  private async processSingleMediaItem(chatId: string, mediaItem: any): Promise<any> {
    try {
      // 1. Identifier la famille basée sur le chat_id
      const family = await this.findFamilyByChatId(chatId);
      if (!family) {
        throw new Error(`No family found for chat ID: ${chatId}`);
      }

      // 2. Vérifier si le média existe déjà
      const existingMedia = await this.checkExistingMedia(mediaItem.file_unique_id, family.id);
      if (existingMedia) {
        console.log(`Media already exists: ${mediaItem.file_unique_id}`);
        return existingMedia;
      }

      // 3. Télécharger le fichier depuis Telegram
      const { filePath, fileInfo } = await this.telegramService.downloadFile(mediaItem.file_id);
      
      // 4. Vérifier le type de fichier
      if (!this.telegramService.isFileTypeSupported(fileInfo.mime_type)) {
        throw new Error(`Unsupported file type: ${fileInfo.mime_type}`);
      }

      // 5. Obtenir l'URL publique
      const publicUrl = await this.telegramService.getPublicUrl(filePath);

      // 6. Sauvegarder dans la base de données
      const savedMedia = await this.saveMediaToDatabase(family.id, chatId, mediaItem, filePath, publicUrl, fileInfo);

      // 7. Mettre à jour la source avec la dernière synchronisation
      await this.updateSourceLastSync(chatId, family.id);

      return savedMedia;

    } catch (error) {
      console.error('Error processing single media item:', error);
      throw error;
    }
  }

  /**
   * Trouve la famille basée sur l'ID du chat Telegram
   */
  private async findFamilyByChatId(chatId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('external_data_sources')
        .select(`
          id,
          family_id,
          families (
            id,
            name,
            avatar
          )
        `)
        .eq('type', 'telegram')
        .eq('config->>chat_id', chatId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`No active Telegram source found for chat ID: ${chatId}`);
        }
        throw error;
      }

      return data.families;
    } catch (error) {
      console.error('Error finding family by chat ID:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un média existe déjà
   */
  private async checkExistingMedia(fileUniqueId: string, familyId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('external_media')
        .select('*')
        .eq('external_id', fileUniqueId)
        .eq('family_id', familyId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error checking existing media:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde un média dans la base de données
   */
  private async saveMediaToDatabase(
    familyId: string,
    chatId: string,
    mediaItem: any,
    filePath: string,
    publicUrl: string,
    fileInfo: any
  ): Promise<any> {
    try {
      // Préparer les données du média
      const mediaData = {
        family_id: familyId,
        source_id: await this.getSourceId(chatId, familyId),
        external_id: mediaItem.file_unique_id,
        media_type: this.mapTelegramTypeToMediaType(mediaItem.type),
        media_url: publicUrl,
        thumbnail_url: null, // TODO: Gérer les thumbnails
        caption: mediaItem.caption || null,
        metadata: {
          ...mediaItem.metadata,
          telegram_file_id: mediaItem.file_id,
          telegram_file_path: fileInfo.file_path,
          telegram_file_size: fileInfo.file_size,
          telegram_mime_type: fileInfo.mime_type,
          local_storage_path: filePath,
          processed_at: new Date().toISOString(),
        },
      };

      // Insérer dans la base de données
      const { data, error } = await this.supabase
        .from('external_media')
        .insert(mediaData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`Media saved successfully: ${data.id}`);
      return data;

    } catch (error) {
      console.error('Error saving media to database:', error);
      throw error;
    }
  }

  /**
   * Obtient l'ID de la source pour un chat donné
   */
  private async getSourceId(chatId: string, familyId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('external_data_sources')
        .select('id')
        .eq('family_id', familyId)
        .eq('type', 'telegram')
        .eq('config->>chat_id', chatId)
        .eq('is_active', true)
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Error getting source ID:', error);
      throw error;
    }
  }

  /**
   * Met à jour la dernière synchronisation d'une source
   */
  private async updateSourceLastSync(chatId: string, familyId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('external_data_sources')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('family_id', familyId)
        .eq('type', 'telegram')
        .eq('config->>chat_id', chatId);

      if (error) {
        console.error('Error updating source last sync:', error);
      }
    } catch (error) {
      console.error('Error updating source last sync:', error);
    }
  }

  /**
   * Mappe le type Telegram vers le type de média de l'app
   */
  private mapTelegramTypeToMediaType(telegramType: string): string {
    switch (telegramType) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'document':
        return 'document';
      case 'audio':
        return 'audio';
      default:
        return 'document';
    }
  }

  /**
   * Nettoie les médias orphelins (supprime les fichiers sans entrée en base)
   */
  async cleanupOrphanedMedia(): Promise<number> {
    try {
      // TODO: Implémenter la logique de nettoyage
      // 1. Lister tous les fichiers dans le storage
      // 2. Vérifier s'ils ont une entrée en base
      // 3. Supprimer les fichiers orphelins
      
      console.log('Cleanup orphaned media - not implemented yet');
      return 0;
    } catch (error) {
      console.error('Error cleaning up orphaned media:', error);
      return 0;
    }
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  async getSyncStats(familyId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('external_media')
        .select('media_type, created_at')
        .eq('family_id', familyId);

      if (error) {
        throw error;
      }

      const stats = {
        total_media: data.length,
        media_by_type: {},
        recent_activity: [],
      };

      // Compter par type
      data.forEach(media => {
        const type = media.media_type;
        stats.media_by_type[type] = (stats.media_by_type[type] || 0) + 1;
      });

      // Activité récente (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      stats.recent_activity = data
        .filter(media => new Date(media.created_at) > sevenDaysAgo)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      return stats;
    } catch (error) {
      console.error('Error getting sync stats:', error);
      throw error;
    }
  }
}
