import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ImageCompressor } from './image-compressor.ts';

// Configuration
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
];
const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
];

export class TelegramService {
  private supabase: any;
  private botToken: string;

  constructor(
    botToken: string,
    supabaseUrl: string,
    supabaseServiceKey: string
  ) {
    this.botToken = botToken;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Télécharge un fichier depuis Telegram avec double stockage
   */
  async downloadFile(
    fileId: string,
    mediaType: string = 'image'
  ): Promise<{
    originalPath: string;
    displayPath: string;
    fileInfo: any;
    compressionStats?: any;
  }> {
    try {
      // 1. Obtenir les informations du fichier
      const fileInfo = await this.getFileInfo(fileId);
      if (!fileInfo) {
        throw new Error(`Could not get file info for ${fileId}`);
      }

      // 2. Vérifier la taille du fichier
      if (fileInfo.file_size && fileInfo.file_size > MAX_FILE_SIZE) {
        throw new Error(
          `File too large: ${fileInfo.file_size} bytes (max: ${MAX_FILE_SIZE})`
        );
      }

      // 3. Télécharger le fichier
      const fileUrl = `${TELEGRAM_API_BASE}${this.botToken}/file/${fileInfo.file_path}`;
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download file: ${response.status} ${response.statusText}`
        );
      }

      // 4. Lire le contenu du fichier
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 5. Déterminer le type MIME et l'extension
      const mimeType = this.detectMimeType(uint8Array, fileInfo.file_path);
      const extension = this.getFileExtension(fileInfo.file_path, mimeType);

      // 6. Générer un nom de fichier unique
      const fileName = `${Date.now()}_${fileId}${extension}`;
      const originalPath = `telegram-media/${fileName}`;
      const displayPath = `telegram-media/${fileName}`;

      // 7. Upload de l'image originale (haute qualité)
      const { error: originalUploadError } = await this.supabase.storage
        .from('post-images-original')
        .upload(originalPath, uint8Array, {
          contentType: mimeType,
          upsert: false,
        });

      if (originalUploadError) {
        throw new Error(
          `Original storage upload failed: ${originalUploadError.message}`
        );
      }

      let compressionStats: any = null;

      // 8. Compression et upload de l'image display (optimisée web)
      if (this.isImageType(mimeType)) {
        try {
          const imageCompressor = ImageCompressor.getInstance();
          const compressionOptions =
            imageCompressor.getCompressionOptionsForType(mediaType);

          const compressedImage = await imageCompressor.compressImage(
            uint8Array,
            mimeType,
            compressionOptions
          );

          // Upload de l'image compressée
          const { error: displayUploadError } = await this.supabase.storage
            .from('post-images-display')
            .upload(displayPath, compressedImage.data, {
              contentType: compressedImage.mimeType,
              upsert: false,
            });

          if (displayUploadError) {
            console.warn(
              `Display storage upload failed: ${displayUploadError.message}`
            );
            // On continue sans l'image display, l'original suffit
          } else {
            compressionStats = {
              originalSize: compressedImage.originalSize,
              compressedSize: compressedImage.compressedSize,
              compressionRatio: compressedImage.compressionRatio,
              width: compressedImage.width,
              height: compressedImage.height,
            };
          }
        } catch (compressionError) {
          console.warn(
            'Image compression failed, using original:',
            compressionError
          );
          // En cas d'échec de compression, on continue avec l'original
        }
      }

      return {
        originalPath,
        displayPath,
        fileInfo: {
          ...fileInfo,
          mime_type: mimeType,
          file_size: uint8Array.length,
          original_path: originalPath,
          display_path: displayPath,
        },
        compressionStats,
      };
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Obtient les informations d'un fichier Telegram
   */
  private async getFileInfo(fileId: string): Promise<any> {
    try {
      const response = await fetch(
        `${TELEGRAM_API_BASE}${this.botToken}/getFile?file_id=${fileId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get file info: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      return data.result;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }

  /**
   * Détecte le type MIME d'un fichier
   */
  private detectMimeType(uint8Array: Uint8Array, filePath: string): string {
    // Vérifier les signatures de fichiers courantes
    const header = uint8Array.slice(0, 4);

    // JPEG
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG
    if (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    ) {
      return 'image/png';
    }

    // GIF
    if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
      return 'image/gif';
    }

    // WebP
    if (
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x54
    ) {
      return 'image/webp';
    }

    // MP4
    if (
      header[0] === 0x00 &&
      header[1] === 0x00 &&
      header[2] === 0x00 &&
      header[3] === 0x18
    ) {
      return 'video/mp4';
    }

    // PDF
    if (
      header[0] === 0x25 &&
      header[1] === 0x50 &&
      header[2] === 0x44 &&
      header[3] === 0x46
    ) {
      return 'application/pdf';
    }

    // Par défaut, essayer de déduire du chemin de fichier
    return this.getMimeTypeFromPath(filePath);
  }

  /**
   * Obtient le type MIME à partir du chemin de fichier
   */
  private getMimeTypeFromPath(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'avi':
        return 'video/avi';
      case 'mov':
        return 'video/mov';
      case 'wmv':
        return 'video/wmv';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Obtient l'extension de fichier
   */
  private getFileExtension(filePath: string, mimeType: string): string {
    // Essayer d'abord depuis le chemin de fichier
    const pathExtension = filePath.split('.').pop();
    if (pathExtension && pathExtension.length <= 5) {
      return `.${pathExtension}`;
    }

    // Sinon, déduire depuis le type MIME
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/gif':
        return '.gif';
      case 'image/webp':
        return '.webp';
      case 'video/mp4':
        return '.mp4';
      case 'video/avi':
        return '.avi';
      case 'video/mov':
        return '.mov';
      case 'video/wmv':
        return '.wmv';
      case 'application/pdf':
        return '.pdf';
      default:
        return '';
    }
  }

  /**
   * Vérifie si un type de fichier est supporté
   */
  isFileTypeSupported(mimeType: string): boolean {
    return [
      ...SUPPORTED_IMAGE_TYPES,
      ...SUPPORTED_VIDEO_TYPES,
      ...SUPPORTED_DOCUMENT_TYPES,
    ].includes(mimeType);
  }

  /**
   * Vérifie si c'est un type d'image
   */
  isImageType(mimeType: string): boolean {
    return SUPPORTED_IMAGE_TYPES.includes(mimeType);
  }

  /**
   * Obtient l'URL publique d'un fichier stocké
   */
  async getPublicUrl(filePath: string, bucketName?: string): Promise<string> {
    try {
      const bucket = bucketName || 'post-images-display';
      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting public URL:', error);
      throw error;
    }
  }

  /**
   * Supprime un fichier du stockage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from('family-photos')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}
