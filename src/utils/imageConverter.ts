import heic2any from 'heic2any';

export interface ConvertedImage {
  file: File;
  preview: string;
  originalFormat: string;
  converted: boolean;
}

/**
 * Convert HEIC images to JPEG format
 * @param file - The image file to convert
 * @returns Promise<ConvertedImage> - The converted image data
 */
export async function convertImageIfNeeded(file: File): Promise<ConvertedImage> {
  const isHEIC = file.type === 'image/heic' || 
                 file.type === 'image/heif' || 
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  if (!isHEIC) {
    // Not a HEIC file, return as is
    const preview = await createPreview(file);
    return {
      file,
      preview,
      originalFormat: file.type || 'unknown',
      converted: false
    };
  }

  try {
    console.log(`🔄 Converting HEIC image: ${file.name}`);
    
    // Convert HEIC to JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8 // Good quality, reasonable file size
    });

    // Create new file with JPEG extension
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    const convertedFile = new File([convertedBlob], newFileName, {
      type: 'image/jpeg',
      lastModified: file.lastModified
    });

    // Create preview
    const preview = await createPreview(convertedFile);

    console.log(`✅ HEIC converted to JPEG: ${newFileName}`);
    
    return {
      file: convertedFile,
      preview,
      originalFormat: 'image/heic',
      converted: true
    };
  } catch (error) {
    console.error('❌ Error converting HEIC image:', error);
    
    // Fallback: try to create preview anyway
    try {
      const preview = await createPreview(file);
      return {
        file,
        preview,
        originalFormat: 'image/heic',
        converted: false
      };
    } catch (previewError) {
      console.error('❌ Error creating preview:', previewError);
      throw new Error('Unable to process HEIC image. Please convert it to JPEG or PNG first.');
    }
  }
}

/**
 * Create a preview URL for an image file
 * @param file - The image file
 * @returns Promise<string> - The preview URL
 */
async function createPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to create preview'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a file is a supported image format
 * @param file - The file to check
 * @returns boolean - True if supported
 */
export function isSupportedImageFormat(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ];
  
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
  
  // Check MIME type
  if (supportedTypes.includes(file.type)) {
    return true;
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (supportedExtensions.includes(extension)) {
    return true;
  }
  
  return false;
}

/**
 * Get file size in human readable format
 * @param bytes - File size in bytes
 * @returns string - Human readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
