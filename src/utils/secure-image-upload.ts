import { supabase } from './supabase/client';

// 🔒 Configuration de sécurité
const SECURITY_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_DIMENSIONS: { width: 4000, height: 4000 },
  COMPRESSION_QUALITY: 0.8, // Qualité initiale
  COMPRESSION_MAX_WIDTH: 1200,
  COMPRESSION_MAX_HEIGHT: 1200,
  // 🆕 Compression adaptative intelligente
  DISPLAY_MAX_SIZE: 500 * 1024, // 500KB max pour les images display (UX mobile)
  MIN_QUALITY: 0.25, // Qualité minimale (25%)
  QUALITY_STEP: 0.05, // Réduction par étape (5% - plus progressif)
} as const;

// 🔒 Types sécurisés
interface UploadResult {
  imageId: string;
  originalUrl: string;
  displayUrl: string;
  compressionRatio: number;
  fileSizeOriginal: number;
  fileSizeDisplay: number;
  metadata: {
    originalWidth: number;
    originalHeight: number;
    displayWidth: number;
    displayHeight: number;
    mimeType: string;
    uploadTimestamp: string;
  };
}

interface SecurityValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 🔒 Service de Double Upload Sécurisé
 * Upload chaque image en double : original (privé) + display (public compressé)
 */
export class SecureImageUploadService {
  private static instance: SecureImageUploadService;

  private constructor() {}

  static getInstance(): SecureImageUploadService {
    if (!SecureImageUploadService.instance) {
      SecureImageUploadService.instance = new SecureImageUploadService();
    }
    return SecureImageUploadService.instance;
  }

  /**
   * 🔒 Validation de sécurité complète
   */
  private async validateFileSecurity(file: File): Promise<SecurityValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validation du type MIME
    if (!SECURITY_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      errors.push(`Type de fichier non autorisé: ${file.type}`);
    }

    // 2. Validation de la taille
    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
      errors.push(
        `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
    }

    // 3. Validation des dimensions (si possible)
    try {
      const dimensions = await this.getImageDimensions(file);
      if (
        dimensions.width > SECURITY_CONFIG.MAX_DIMENSIONS.width ||
        dimensions.height > SECURITY_CONFIG.MAX_DIMENSIONS.height
      ) {
        warnings.push(
          `Image très grande: ${dimensions.width}x${dimensions.height}`
        );
      }
    } catch (error) {
      // Ne pas bloquer si on ne peut pas lire les dimensions
      warnings.push("Impossible de valider les dimensions de l'image");
    }

    // 4. Validation du nom de fichier
    if (
      file.name.includes('..') ||
      file.name.includes('/') ||
      file.name.includes('\\')
    ) {
      errors.push('Nom de fichier invalide');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 🔒 Récupération des dimensions d'image de manière sécurisée
   */
  private getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Impossible de lire les dimensions de l'image"));
      };

      img.src = url;
    });
  }

  /**
   * 🔒 Compression d'image sécurisée avec Canvas
   */
  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas non supporté'));
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        try {
          URL.revokeObjectURL(url);

          // Calculer les dimensions optimales
          const { width, height } = this.calculateOptimalDimensions(
            img.width,
            img.height
          );

          canvas.width = width;
          canvas.height = height;

          // 🔒 Sécurité : Vérifier que les dimensions sont raisonnables
          if (
            width > SECURITY_CONFIG.COMPRESSION_MAX_WIDTH * 2 ||
            height > SECURITY_CONFIG.COMPRESSION_MAX_HEIGHT * 2
          ) {
            reject(new Error('Dimensions de compression trop grandes'));
            return;
          }

          // Dessiner l'image compressée
          ctx.drawImage(img, 0, 0, width, height);

          // 🆕 Compression adaptative avec qualité progressive
          this.compressWithAdaptiveQuality(canvas, file, resolve, reject);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Impossible de charger l'image pour compression"));
      };

      img.src = url;
    });
  }

  /**
   * 🔒 Calcul des dimensions optimales de compression
   * Utilise LONG_EDGE comme recommandé (plus cohérent avec les ratios)
   */
  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number
  ): { width: number; height: number } {
    const longEdge = Math.max(originalWidth, originalHeight);

    if (longEdge <= SECURITY_CONFIG.COMPRESSION_MAX_WIDTH) {
      // Image déjà dans les bonnes dimensions
      return { width: originalWidth, height: originalHeight };
    }

    // Redimensionner en gardant le ratio (LONG_EDGE approach)
    const scale = SECURITY_CONFIG.COMPRESSION_MAX_WIDTH / longEdge;
    const newWidth = Math.round(originalWidth * scale);
    const newHeight = Math.round(originalHeight * scale);

    return { width: newWidth, height: newHeight };
  }

  /**
   * 🆕 Compression avec qualité adaptative intelligente
   * Réduit progressivement la qualité avec steps fins pour une compression optimale
   */
  private compressWithAdaptiveQuality(
    canvas: HTMLCanvasElement,
    file: File,
    resolve: (file: File) => void,
    reject: (error: Error) => void
  ) {
    let quality = SECURITY_CONFIG.COMPRESSION_QUALITY; // Commence à 80%
    let attempts = 0;
    const maxAttempts = 20; // Éviter les boucles infinies

    // 🎯 Taille cible fixe (500KB max)
    const targetSize = SECURITY_CONFIG.DISPLAY_MAX_SIZE;
    const targetKB = Math.round(targetSize / 1024);

    const tryCompression = () => {
      attempts++;

      canvas.toBlob(
        blob => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const sizeKB = Math.round(compressedFile.size / 1024);

            // 🎯 Vérifier si la taille cible est atteinte
            if (compressedFile.size <= targetSize) {
              console.log(
                `✅ Compression réussie: ${(quality * 100).toFixed(0)}% qualité, ${sizeKB}KB (objectif: ${targetKB}KB)`
              );
              resolve(compressedFile);
            } else if (
              quality > SECURITY_CONFIG.MIN_QUALITY &&
              attempts < maxAttempts
            ) {
              // 🔄 Réduire la qualité avec step fin et réessayer
              quality -= SECURITY_CONFIG.QUALITY_STEP;
              console.log(
                `🔄 Tentative ${attempts}: Qualité ${(quality * 100).toFixed(0)}% → ${sizeKB}KB (objectif: ${targetKB}KB)`
              );
              tryCompression();
            } else {
              // ⚠️ Limite atteinte, accepter le meilleur résultat
              const finalSizeKB = Math.round(compressedFile.size / 1024);
              console.log(
                `⚠️ Limite atteinte: ${(quality * 100).toFixed(0)}% qualité, ${finalSizeKB}KB (objectif: ${targetKB}KB)`
              );
              resolve(compressedFile);
            }
          } else {
            reject(new Error('Échec de la compression'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    // 🚀 Démarrer la compression adaptative intelligente
    console.log(
      `🎯 Début compression: Objectif ${targetKB}KB (${canvas.width}x${canvas.height}px)`
    );
    tryCompression();
  }

  /**
   * 🔒 Upload sécurisé vers un bucket spécifique
   */
  private async uploadToBucket(
    bucketName: string,
    path: string,
    file: File
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600', // Cache 1 heure
        });

      if (error) {
        // 🔒 Log sécurisé (pas d'exposition de données sensibles)
        console.error(
          'Upload failed for bucket:',
          bucketName,
          'Error code:',
          error.code
        );
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      // 🔒 Log sécurisé
      console.error('Upload exception for bucket:', bucketName);
      return { success: false, error: 'Upload exception' };
    }
  }

  /**
   * 🔒 Méthode principale : Double upload sécurisé
   */
  async uploadWithCompression(
    file: File,
    userId: string,
    familyId: string
  ): Promise<UploadResult> {
    // 1. 🔒 Validation de sécurité
    const validation = await this.validateFileSecurity(file);
    if (!validation.isValid) {
      throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
    }

    // 🔒 Log des warnings (non bloquants)
    if (validation.warnings.length > 0) {
      console.warn("Warnings lors de l'upload:", validation.warnings);
    }

    // 2. 🔒 Génération d'ID sécurisé
    const imageId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // 3. 🔒 Chemins de stockage sécurisés
    const originalPath = `post-images-original/${familyId}/${userId}/${imageId}.${fileExt}`;
    const displayPath = `post-images-display/${familyId}/${userId}/${imageId}.${fileExt}`;

    // 4. 🔒 Upload de l'image originale (privée)
    const originalResult = await this.uploadToBucket(
      'post-images-original',
      originalPath,
      file
    );
    if (!originalResult.success) {
      throw new Error(`Échec upload original: ${originalResult.error}`);
    }

    // 5. 🔒 Compression et upload de l'image display (publique)
    const compressedFile = await this.compressImage(file);
    const displayResult = await this.uploadToBucket(
      'post-images-display',
      displayPath,
      compressedFile
    );
    if (!displayResult.success) {
      // 🔒 Nettoyage en cas d'échec
      await this.cleanupFailedUpload('post-images-original', originalPath);
      throw new Error(`Échec upload display: ${displayResult.error}`);
    }

    // 6. 🔒 Calcul des métadonnées
    const dimensions = await this.getImageDimensions(file);
    const compressedDimensions = await this.getImageDimensions(compressedFile);
    const compressionRatio = compressedFile.size / file.size;

    // 7. 🔒 Retour des résultats sécurisés
    return {
      imageId,
      originalUrl: originalPath,
      displayUrl: displayPath,
      compressionRatio: Number(compressionRatio.toFixed(3)),
      fileSizeOriginal: file.size,
      fileSizeDisplay: compressedFile.size,
      metadata: {
        originalWidth: dimensions.width,
        originalHeight: dimensions.height,
        displayWidth: compressedDimensions.width,
        displayHeight: compressedDimensions.height,
        mimeType: file.type,
        uploadTimestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 🔒 Nettoyage en cas d'échec d'upload
   */
  private async cleanupFailedUpload(
    bucketName: string,
    path: string
  ): Promise<void> {
    try {
      await supabase.storage.from(bucketName).remove([path]);
    } catch (error) {
      // 🔒 Log silencieux pour éviter l'exposition d'erreurs
      console.warn('Cleanup failed for path:', path);
    }
  }

  /**
   * 🔒 Suppression sécurisée d'images
   */
  async deleteImages(
    imageIds: string[],
    userId: string,
    familyId: string
  ): Promise<void> {
    for (const imageId of imageIds) {
      try {
        // Supprimer des deux buckets
        const originalPath = `post-images-original/${familyId}/${userId}/${imageId}`;
        const displayPath = `post-images-display/${familyId}/${userId}/${imageId}`;

        await Promise.all([
          supabase.storage.from('post-images-original').remove([originalPath]),
          supabase.storage.from('post-images-display').remove([displayPath]),
        ]);
      } catch (error) {
        // 🔒 Log sécurisé
        console.error('Failed to delete image:', imageId);
      }
    }
  }
}

// 🔒 Export de l'instance unique
export const secureImageUpload = SecureImageUploadService.getInstance();
