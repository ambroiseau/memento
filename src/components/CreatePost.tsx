import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { secureImageUpload } from '../utils/secure-image-upload';
import { getSignedImageUrl } from '../utils/signedUrls';
import { supabaseApi } from '../utils/supabase-api';
import { supabase } from '../utils/supabase/client';
import { DraggableImageGrid } from './DraggableImageGrid';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export function CreatePost({
  user,
  userProfile,
  family,
  accessToken,
  setCurrentScreen,
  addNewPostToFeed,
}) {
  const [caption, setCaption] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    // Limit to 4 images max
    const remainingSlots = 4 - selectedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    // Process each file with HEIC conversion
    for (const file of filesToProcess) {
      try {
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          setError(
            `Unsupported file format: ${file.name}. Please use JPEG, PNG, GIF, or WebP.`
          );
          continue;
        }

        // Create preview for image
        const reader = new FileReader();
        reader.onload = e => {
          setSelectedImages(prev => [
            ...prev,
            {
              file: file,
              preview: e.target?.result as string,
              id: Math.random().toString(36).substr(2, 9),
            },
          ]);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing image:', error);
        setError(
          `Failed to process image: ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = imageId => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleImagesReorder = reorderedImages => {
    setSelectedImages(reorderedImages);
  };

  const uploadImages = async () => {
    const uploadedImages = [];

    console.log('🚀 Début de uploadImages avec le NOUVEAU système');
    console.log('📁 Images à uploader:', selectedImages.length);
    console.log('🔒 Service disponible:', !!secureImageUpload);

    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      try {
        console.log(`📤 Upload de l'image ${i + 1}/${selectedImages.length}`);
        console.log('📋 Détails:', {
          fileName: image.file.name,
          fileSize: image.file.size,
          fileType: image.file.type,
          userId: user.id,
          familyId: family.id,
        });

        // ✅ NOUVEAU SYSTÈME : Double upload sécurisé
        console.log('🔄 Appel de secureImageUpload.uploadWithCompression...');
        const result = await secureImageUpload.uploadWithCompression(
          image.file,
          user.id,
          family.id
        );

        console.log('✅ Upload réussi !', result);
        uploadedImages.push(result.imageId);
        // Store the display URL for display (optimized for web)
        selectedImages[i].uploadedUrl = result.displayUrl;
        // Store the original URL for future use (high quality)
        selectedImages[i].originalUrl = result.originalUrl;
      } catch (error) {
        console.error("❌ Erreur lors de l'upload:", error);
        console.error('❌ Stack trace:', error.stack);
        throw new Error('Failed to upload image');
      }
    }

    console.log('🎯 Upload terminé, images uploadées:', uploadedImages);
    return uploadedImages;
  };

  const handlePost = async () => {
    if (!caption.trim() && selectedImages.length === 0) {
      setError('Please add a caption or select at least one image');
      return;
    }

    setIsPosting(true);
    setError('');

    try {
      // Upload images first
      setIsUploading(true);
      const imageIds = await uploadImages();
      setIsUploading(false);

      // Create the post in the database
      const now = new Date();
      const monthTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const postData = {
        family_id: family.id,
        user_id: user.id,
        content_text: caption.trim(),
        month_tag: monthTag,
      };

      const { post } = await supabaseApi.createPost(postData);

      // If we have images, create post_images records
      if (imageIds.length > 0) {
        for (let i = 0; i < imageIds.length; i++) {
          const imageId = imageIds[i];
          const selectedImage = selectedImages[i];

          await supabase.from('post_images').insert({
            post_id: post.id,
            storage_path: selectedImage.uploadedUrl, // Use the storage path from upload
            idx: i,
          });
        }
      }

      // Generate signed URLs for the new post images
      const signedImageUrls = await Promise.all(
        selectedImages.map(async img => {
          if (img.uploadedUrl && !img.uploadedUrl.startsWith('data:')) {
            const signedUrl = await getSignedImageUrl(img.uploadedUrl);
            return signedUrl || img.uploadedUrl;
          }
          return img.uploadedUrl;
        })
      );

      // Create the new post object with all the data
      const newPost = {
        ...post,
        author: {
          name: userProfile?.name || user?.email || 'Unknown User',
          avatar: userProfile?.avatar_url || null,
        },
        createdAt: post.created_at,
        caption: post.content_text,
        imageUrls: signedImageUrls,
        reactions: {},
        profiles: userProfile || { name: 'Unknown User', avatar_url: null },
        post_images: selectedImages.map((img, idx) => ({
          post_id: post.id,
          storage_path: img.uploadedUrl,
          idx: idx,
        })),
      };

      // Add the new post to the feed
      if (addNewPostToFeed) {
        addNewPostToFeed(newPost);
      }

      // Success! Go back to feed and scroll to top
      setCurrentScreen('feed');

      // Scroll to top after a short delay to ensure the feed is rendered
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.log('Error creating post:', error);
      setError(error.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentScreen('feed')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg">New Post</h1>
            </div>

            <Button
              onClick={handlePost}
              disabled={
                isPosting ||
                isUploading ||
                (!caption.trim() && selectedImages.length === 0)
              }
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-orange-500"
            >
              {isPosting ? 'Posting...' : 'Share'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Share a moment with {family.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Photos (up to 4)</Label>
                {selectedImages.length > 1 && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    💡 Drag to reorder photos
                  </div>
                )}
              </div>

              {/* Selected Images with Drag & Drop */}
              {selectedImages.length > 0 && (
                <>
                  <DraggableImageGrid
                    images={selectedImages}
                    onImagesReorder={handleImagesReorder}
                    onRemoveImage={removeImage}
                  />
                </>
              )}

              {/* Add Images Button */}
              {selectedImages.length < 4 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-pink-500 flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="bg-gray-100 p-3 rounded-full">
                      <ImageIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm">Add Photos</p>
                      <p className="text-xs text-gray-500">
                        {selectedImages.length} of 4 selected
                      </p>
                    </div>
                  </Button>
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Share what's happening..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-blue-700 text-sm">
                    Uploading images...
                  </span>
                </div>
              </div>
            )}

            {/* Post Info */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Posting to: {family.name}</span>
                <span>Family Code: {family.code}</span>
              </div>
              <p className="mt-2 text-xs">
                This post will be tagged with the current month for the family
                magazine.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
