// Dynamic import for heic2any to handle ES modules
let heic2any: any = null;

// Lazy load heic2any
async function loadHeic2Any() {
  if (!heic2any) {
    try {
      const module = await import('heic2any');
      heic2any = module.default;
    } catch (error) {
      console.error('Failed to load heic2any:', error);
      throw new Error('HEIC conversion not supported in this browser');
    }
  }
  return heic2any;
}

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
export async function convertImageIfNeeded(
  file: File
): Promise<ConvertedImage> {
  const isHEIC =
    file.type === 'image/heic' ||
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
      converted: false,
    };
  }

  try {
    console.log(`🔄 Converting HEIC image: ${file.name}`);

    // Load heic2any dynamically
    const heic2anyModule = await loadHeic2Any();

    // Convert HEIC to JPEG with timeout
    const convertedBlob = await Promise.race([
      heic2anyModule({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8, // Good quality, reasonable file size
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('HEIC conversion timeout')), 10000)
      ),
    ]);

    // Create new file with JPEG extension
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    const convertedFile = new File([convertedBlob], newFileName, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });

    // Create preview
    const preview = await createPreview(convertedFile);

    console.log(`✅ HEIC converted to JPEG: ${newFileName}`);

    return {
      file: convertedFile,
      preview,
      originalFormat: 'image/heic',
      converted: true,
    };
  } catch (error) {
    console.error('❌ Error converting HEIC image:', error);

    // Fallback: try to create preview anyway
    try {
      console.log('🔄 Trying fallback preview creation...');
      const preview = await createPreview(file);
      console.log('✅ Fallback preview created successfully');
      console.log('📸 Preview URL length:', preview.length);
      return {
        file,
        preview,
        originalFormat: 'image/heic',
        converted: false,
      };
    } catch (previewError) {
      console.error('❌ Error creating preview:', previewError);

      // Final fallback: create a placeholder
      console.log('🔄 Creating placeholder for HEIC image...');
      return {
        file,
        preview:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5IRUlDIEluYWJsZTwvdGV4dD4KPC9zdmc+',
        originalFormat: 'image/heic',
        converted: false,
      };
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
    // For HEIC files, try using URL.createObjectURL first
    if (
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')
    ) {
      try {
        console.log('🔄 Creating object URL for HEIC file...');
        const objectUrl = URL.createObjectURL(file);
        console.log('✅ Object URL created:', objectUrl);
        resolve(objectUrl);
      } catch (error) {
        console.log('❌ Object URL failed, trying FileReader...');
        // Fallback to FileReader
        const reader = new FileReader();
        reader.onload = e => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to create preview'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      }
    } else {
      // For other formats, use FileReader
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to create preview'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }
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
    'image/heif',
  ];

  const supportedExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.heic',
    '.heif',
  ];

  // Check MIME type
  if (supportedTypes.includes(file.type)) {
    return true;
  }

  // Check file extension
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'));
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
