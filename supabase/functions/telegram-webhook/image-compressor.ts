// Service de compression d'images pour l'Edge Function
// Utilise Canvas API pour la compression côté serveur

export interface CompressionOptions {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface CompressedImage {
  data: Uint8Array;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export class ImageCompressor {
  private static instance: ImageCompressor;

  static getInstance(): ImageCompressor {
    if (!ImageCompressor.instance) {
      ImageCompressor.instance = new ImageCompressor();
    }
    return ImageCompressor.instance;
  }

  /**
   * Compresse une image avec les options spécifiées
   */
  async compressImage(
    imageData: Uint8Array,
    mimeType: string,
    options: CompressionOptions
  ): Promise<CompressedImage> {
    try {
      // Créer un canvas pour la compression
      const canvas = new OffscreenCanvas(1, 1);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible de créer le contexte canvas');
      }

      // Créer une image à partir des données
      const imageBitmap = await createImageBitmap(
        new Blob([imageData], { type: mimeType })
      );

      // Calculer les nouvelles dimensions
      const { width, height } = this.calculateDimensions(
        imageBitmap.width,
        imageBitmap.height,
        options.maxWidth,
        options.maxHeight
      );

      // Redimensionner le canvas
      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(imageBitmap, 0, 0, width, height);

      // Convertir en format souhaité
      const compressedBlob = await canvas.convertToBlob({
        type: `image/${options.format}`,
        quality: options.quality,
      });

      // Convertir en Uint8Array
      const compressedArrayBuffer = await compressedBlob.arrayBuffer();
      const compressedData = new Uint8Array(compressedArrayBuffer);

      // Calculer les statistiques de compression
      const originalSize = imageData.length;
      const compressedSize = compressedData.length;
      const compressionRatio = compressedSize / originalSize;

      return {
        data: compressedData,
        mimeType: compressedBlob.type,
        width,
        height,
        originalSize,
        compressedSize,
        compressionRatio,
      };

    } catch (error) {
      console.error('Erreur lors de la compression:', error);
      throw new Error(`Compression échouée: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calcule les nouvelles dimensions en conservant le ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Redimensionner si nécessaire
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    return { width, height };
  }

  /**
   * Détermine le format optimal pour la compression
   */
  getOptimalFormat(mimeType: string): 'jpeg' | 'png' | 'webp' {
    if (mimeType.includes('png') && mimeType.includes('transparency')) {
      return 'png'; // Garder la transparence
    }
    
    if (mimeType.includes('webp')) {
      return 'webp'; // Format moderne et efficace
    }
    
    return 'jpeg'; // Format par défaut, bonne compression
  }

  /**
   * Vérifie si une image peut être compressée
   */
  canCompress(mimeType: string): boolean {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return supportedTypes.includes(mimeType);
  }

  /**
   * Obtient les options de compression par défaut
   */
  getDefaultOptions(): CompressionOptions {
    return {
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      format: 'jpeg',
    };
  }

  /**
   * Obtient les options de compression pour un type de média
   */
  getCompressionOptionsForType(mediaType: string): CompressionOptions {
    switch (mediaType) {
      case 'image':
        return {
          quality: 0.8,
          maxWidth: 1200,
          maxHeight: 1200,
          format: 'jpeg',
        };
      
      case 'video':
        // Pour les vidéos, on ne compresse que la thumbnail
        return {
          quality: 0.7,
          maxWidth: 800,
          maxHeight: 600,
          format: 'jpeg',
        };
      
      case 'document':
        // Pour les documents, compression légère
        return {
          quality: 0.9,
          maxWidth: 1600,
          maxHeight: 1600,
          format: 'jpeg',
        };
      
      default:
        return this.getDefaultOptions();
    }
  }
}
