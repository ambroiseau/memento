import { supabase } from './supabase/client';

// 🔒 Configuration de sécurité pour les URLs signées
const SECURITY_CONFIG = {
  DEFAULT_EXPIRY: 600, // 10 minutes par défaut
  MAX_EXPIRY: 3600, // 1 heure maximum
  MIN_EXPIRY: 60, // 1 minute minimum
} as const;

// 🔒 Types sécurisés
interface SignedUrlResult {
  url: string;
  expiresAt: string;
  bucket: string;
  path: string;
}

interface SecurityContext {
  userId: string;
  familyId: string;
  operation: 'read' | 'write' | 'delete';
}

/**
 * 🔒 Service d'URLs Signées Sécurisé
 * Gère l'accès aux images avec validation et sécurité
 */
export class SecureSignedUrlService {
  private static instance: SecureSignedUrlService;
  private urlCache = new Map<string, { url: string; expiresAt: number }>();

  private constructor() {}

  static getInstance(): SecureSignedUrlService {
    if (!SecureSignedUrlService.instance) {
      SecureSignedUrlService.instance = new SecureSignedUrlService();
    }
    return SecureSignedUrlService.instance;
  }

  /**
   * 🔒 Validation de sécurité pour l'accès aux images
   */
  private async validateAccess(
    path: string,
    context: SecurityContext
  ): Promise<boolean> {
    try {
      // 1. Vérifier que l'utilisateur appartient à la famille
      const { data: familyMember, error } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_id', context.familyId)
        .eq('user_id', context.userId)
        .single();

      if (error || !familyMember) {
        // 🔒 Log sécurisé
        console.warn('Access denied: User not in family', {
          userId: context.userId,
          familyId: context.familyId,
        });
        return false;
      }

      // 2. Vérifier que le chemin correspond à la famille
      const pathParts = path.split('/');
      if (pathParts.length < 3 || pathParts[1] !== context.familyId) {
        // 🔒 Log sécurisé
        console.warn('Access denied: Path mismatch', {
          path: pathParts[1],
          familyId: context.familyId,
        });
        return false;
      }

      // 3. Vérifier que l'utilisateur accède à ses propres images (sauf pour la lecture)
      if (context.operation !== 'read' && pathParts[2] !== context.userId) {
        // 🔒 Log sécurisé
        console.warn('Access denied: User mismatch', {
          pathUser: pathParts[2],
          userId: context.userId,
        });
        return false;
      }

      return true;
    } catch (error) {
      // 🔒 Log sécurisé
      console.error('Validation error:', error);
      return false;
    }
  }

  /**
   * 🔒 Validation des paramètres d'expiration
   */
  private validateExpiry(expirySeconds: number): number {
    if (expirySeconds < SECURITY_CONFIG.MIN_EXPIRY) {
      return SECURITY_CONFIG.MIN_EXPIRY;
    }
    if (expirySeconds > SECURITY_CONFIG.MAX_EXPIRY) {
      return SECURITY_CONFIG.MAX_EXPIRY;
    }
    return expirySeconds;
  }

  /**
   * 🔒 Génération d'URL signée sécurisée pour les images display (publiques)
   */
  async getDisplayImageUrl(
    displayPath: string,
    context: SecurityContext,
    expirySeconds: number = SECURITY_CONFIG.DEFAULT_EXPIRY
  ): Promise<string | null> {
    try {
      // 1. Validation de sécurité
      if (!(await this.validateAccess(displayPath, context))) {
        return null;
      }

      // 2. Validation de l'expiration
      const validatedExpiry = this.validateExpiry(expirySeconds);

      // 3. Vérifier le cache
      const cacheKey = `display_${displayPath}_${validatedExpiry}`;
      const cached = this.urlCache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        return cached.url;
      }

      // 4. Générer l'URL signée
      const { data, error } = await supabase.storage
        .from('post-images-display')
        .createSignedUrl(displayPath, validatedExpiry);

      if (error) {
        // 🔒 Log sécurisé
        console.error('Failed to create display signed URL:', error.code);
        return null;
      }

      // 5. Mettre en cache
      this.urlCache.set(cacheKey, {
        url: data.signedUrl,
        expiresAt: Date.now() + validatedExpiry * 1000 - 60000, // Expire 1 min avant
      });

      return data.signedUrl;
    } catch (error) {
      // 🔒 Log sécurisé
      console.error('Display URL generation failed');
      return null;
    }
  }

  /**
   * 🔒 Génération d'URL signée sécurisée pour les images originales (privées)
   * Utilisé uniquement pour les opérations nécessitant la qualité maximale
   */
  async getOriginalImageUrl(
    originalPath: string,
    context: SecurityContext,
    expirySeconds: number = 300 // 5 minutes par défaut pour les images originales
  ): Promise<string | null> {
    try {
      // 1. Validation de sécurité stricte
      if (!(await this.validateAccess(originalPath, context))) {
        return null;
      }

      // 2. Validation de l'expiration (plus restrictive pour les images originales)
      const validatedExpiry = Math.min(
        this.validateExpiry(expirySeconds),
        600 // Maximum 10 minutes pour les images originales
      );

      // 3. Vérifier le cache
      const cacheKey = `original_${originalPath}_${validatedExpiry}`;
      const cached = this.urlCache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        return cached.url;
      }

      // 4. Générer l'URL signée
      const { data, error } = await supabase.storage
        .from('post-images-original')
        .createSignedUrl(originalPath, validatedExpiry);

      if (error) {
        // 🔒 Log sécurisé
        console.error('Failed to create original signed URL:', error.code);
        return null;
      }

      // 5. Mettre en cache
      this.urlCache.set(cacheKey, {
        url: data.signedUrl,
        expiresAt: Date.now() + validatedExpiry * 1000 - 60000, // Expire 1 min avant
      });

      return data.signedUrl;
    } catch (error) {
      // 🔒 Log sécurisé
      console.error('Original URL generation failed');
      return null;
    }
  }

  /**
   * 🔒 Récupération d'URLs signées pour tous les posts d'une famille
   */
  async getFamilyPostsUrls(
    posts: any[],
    context: SecurityContext
  ): Promise<any[]> {
    try {
      const postsWithUrls = await Promise.all(
        posts.map(async post => {
          if (post.post_images && post.post_images.length > 0) {
            const imagesWithUrls = await Promise.all(
              post.post_images.map(async (image: any) => {
                try {
                  // Utiliser l'URL display par défaut (plus rapide)
                  let displayUrl = null;
                  if (image.display_url) {
                    displayUrl = await this.getDisplayImageUrl(
                      image.display_url,
                      context
                    );
                  }

                  // Fallback vers l'ancien système si nécessaire
                  if (!displayUrl && image.storage_path) {
                    displayUrl = await this.getDisplayImageUrl(
                      image.storage_path,
                      context
                    );
                  }

                  return {
                    id: image.id,
                    displayUrl,
                    originalUrl: image.original_url, // Garder pour référence
                    altText: image.alt_text || '',
                    metadata: {
                      compressionRatio: image.compression_ratio,
                      fileSizeOriginal: image.file_size_original,
                      fileSizeDisplay: image.file_size_display,
                    },
                  };
                } catch (error) {
                  // 🔒 Log sécurisé
                  console.error('Failed to process image:', image.id);
                  return {
                    id: image.id,
                    displayUrl: null,
                    originalUrl: null,
                    altText: image.alt_text || '',
                    error: 'Failed to load image',
                  };
                }
              })
            );
            return { ...post, images: imagesWithUrls };
          }
          return { ...post, images: [] };
        })
      );

      return postsWithUrls;
    } catch (error) {
      // 🔒 Log sécurisé
      console.error('Failed to get family posts URLs');
      return posts;
    }
  }

  /**
   * 🔒 Nettoyage du cache des URLs expirées
   */
  cleanupExpiredUrls(): void {
    const now = Date.now();
    for (const [key, value] of this.urlCache.entries()) {
      if (value.expiresAt <= now) {
        this.urlCache.delete(key);
      }
    }
  }

  /**
   * 🔒 Invalidation forcée du cache
   */
  clearCache(): void {
    this.urlCache.clear();
  }
}

// 🔒 Export de l'instance unique
export const secureSignedUrls = SecureSignedUrlService.getInstance();

// 🔒 Nettoyage automatique du cache toutes les 5 minutes
setInterval(
  () => {
    secureSignedUrls.cleanupExpiredUrls();
  },
  5 * 60 * 1000
);
