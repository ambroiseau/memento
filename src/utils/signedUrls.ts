import { supabase } from './supabase/client';

/**
 * Generate a signed URL for an image stored in Supabase Storage
 * @param {string} storagePath - The storage path of the image
 * @param {number} expirySeconds - URL expiry time in seconds (default: 600 = 10 minutes)
 * @returns {Promise<string|null>} - The signed URL or null if error
 */
export async function getSignedImageUrl(storagePath, expirySeconds = 600) {
  if (!storagePath) return null;

  // If it's already a base64 image, return as is (for backward compatibility)
  if (storagePath.startsWith('data:image')) {
    return storagePath;
  }

  try {
    // 🆕 Essayer d'abord le nouveau bucket (post-images-display)
    let { data, error } = await supabase.storage
      .from('post-images-display')
      .createSignedUrl(storagePath, expirySeconds);

    if (error) {
      console.log(
        `🔄 Image non trouvée dans post-images-display, essai post-images...`
      );

      // Fallback vers l'ancien bucket (post-images) pour la compatibilité
      const fallbackResult = await supabase.storage
        .from('post-images')
        .createSignedUrl(storagePath, expirySeconds);

      if (fallbackResult.error) {
        console.error(
          '❌ Erreur génération signed URL depuis les deux buckets:',
          error
        );
        return null;
      }

      return fallbackResult.data.signedUrl;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('❌ Erreur générale génération signed URL:', error);
    return null;
  }
}

/**
 * Get signed URLs for all images in a post
 * @param {Object} post - The post object with images array
 * @returns {Promise<Array>} - Array of images with signed URLs
 */
export async function getPostImageUrls(post) {
  if (!post.images || post.images.length === 0) {
    return [];
  }

  const imageUrls = await Promise.all(
    post.images.map(async image => {
      const signedUrl = await getSignedImageUrl(image.storage_path);
      return {
        ...image,
        url: signedUrl,
      };
    })
  );

  return imageUrls.filter(img => img.url !== null);
}

/**
 * Get signed URLs for multiple posts
 * @param {Array} posts - Array of post objects
 * @returns {Promise<Array>} - Array of posts with signed image URLs
 */
export async function getPostsImageUrls(posts) {
  if (!posts || posts.length === 0) {
    return [];
  }

  const postsWithUrls = await Promise.all(
    posts.map(async post => {
      const imagesWithUrls = await getPostImageUrls(post);
      return {
        ...post,
        images: imagesWithUrls,
      };
    })
  );

  return postsWithUrls;
}

/**
 * Preload images for better performance
 * @param {Array} imageUrls - Array of image URLs to preload
 */
export function preloadImages(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) return;

  imageUrls.forEach(url => {
    if (url && !url.startsWith('data:image')) {
      const img = new Image();
      img.src = url;
    }
  });
}

/**
 * Generate a signed URL for avatars (user and family)
 * @param {string} storagePath - The storage path of the avatar
 * @param {number} expirySeconds - URL expiry time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string|null>} - The signed URL or null if error
 */
export async function getSignedAvatarUrl(storagePath, expirySeconds = 3600) {
  if (!storagePath) return null;

  // If it's already a base64 image, return as is
  if (storagePath.startsWith('data:image')) {
    return storagePath;
  }

  // If it's already a full URL, return as is
  if (storagePath.startsWith('http')) {
    return storagePath;
  }

  try {
    // Try post-images bucket first (where avatars were probably stored)
    const { data, error } = await supabase.storage
      .from('post-images')
      .createSignedUrl(storagePath, expirySeconds);

    if (error) {
      console.error('Error generating avatar signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error generating avatar signed URL:', error);
    return null;
  }
}
