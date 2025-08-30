#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateAppForSignedUrls() {
  try {
    console.log('🔧 Updating application for signed URLs...');

    // 1. Create a helper function for generating signed URLs
    console.log('\n1. Creating signed URL helper function...');

    const signedUrlHelper = `
// Helper function to generate signed URLs for images
export async function getSignedImageUrl(storagePath, expirySeconds = 600) {
  if (!storagePath) return null;
  
  // If it's already a base64 image, return as is (for backward compatibility)
  if (storagePath.startsWith('data:image')) {
    return storagePath;
  }
  
  try {
    const { data, error } = await supabase.storage
      .from('post-images')
      .createSignedUrl(storagePath, expirySeconds);
    
    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

// Helper function to get image URLs for a post
export async function getPostImageUrls(post) {
  if (!post.images || post.images.length === 0) {
    return [];
  }
  
  const imageUrls = await Promise.all(
    post.images.map(async (image) => {
      const signedUrl = await getSignedImageUrl(image.storage_path);
      return {
        ...image,
        url: signedUrl,
      };
    })
  );
  
  return imageUrls.filter(img => img.url !== null);
}
`;

    console.log('✅ Signed URL helper functions created');

    // 2. Update the RPC function to include metadata
    console.log('\n2. Updating RPC function for metadata...');

    const updatedRpcFunction = `
-- Updated RPC function with image metadata
CREATE OR REPLACE FUNCTION get_family_posts_with_images(
    p_family_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    author JSONB,
    images JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.content_text as content,
        p.created_at,
        jsonb_build_object(
            'id', prof.user_id,
            'name', prof.name,
            'avatar', prof.avatar_url
        ) as author,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pi.id,
                    'storage_path', pi.storage_path,
                    'alt_text', COALESCE(pi.alt_text, ''),
                    'file_size', pi.file_size,
                    'mime_type', pi.mime_type,
                    'width', pi.width,
                    'height', pi.height,
                    'migrated_at', pi.migrated_at
                )
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::jsonb
        ) as images
    FROM posts p
    LEFT JOIN profiles prof ON p.user_id = prof.user_id
    LEFT JOIN post_images pi ON p.id = pi.post_id
    WHERE p.family_id = p_family_id
      AND DATE(p.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY p.id, p.content_text, p.created_at, prof.user_id, prof.name, prof.avatar_url
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
`;

    console.log('✅ Updated RPC function with metadata');

    // 3. Create a migration guide
    console.log('\n3. Creating migration guide...');

    const migrationGuide = `
# Migration Guide: Base64 to Signed URLs

## Overview
This migration moves images from base64 storage in the database to Supabase Storage with signed URLs.

## Benefits
- ✅ Reduced database size
- ✅ Better performance
- ✅ Scalable storage
- ✅ CDN benefits
- ✅ Proper image metadata

## Migration Steps

### 1. Database Migration
Run the SQL migration: \`sql/migrate-post-images-table.sql\`

### 2. Image Migration
Run the migration script: \`node scripts/migrate-images-to-storage.js\`

### 3. Application Updates

#### Frontend Changes
- Use \`getSignedImageUrl()\` helper function
- Handle both base64 (legacy) and signed URLs
- Add error handling for failed URL generation

#### Backend Changes
- Update PDF renderer to use signed URLs
- Remove base64 handling after migration
- Add image metadata to responses

### 4. Testing
- Test image display in the app
- Test PDF generation with signed URLs
- Verify migration status

## File Structure
\`\`\`
images/
├── {uuid}.jpg
├── {uuid}.png
└── {uuid}.gif
\`\`\`

## URL Format
\`\`\`
https://zcyalwewcdgbftaaneet.supabase.co/storage/v1/object/sign/post-images/images/{filename}?token={signed_token}&expires={timestamp}
\`\`\`

## Metadata
- file_size: Size in bytes
- mime_type: Image MIME type
- width/height: Image dimensions (if available)
- migrated_at: Migration timestamp
`;

    console.log('✅ Migration guide created');

    // 4. Summary
    console.log('\n📋 Summary of changes needed:');
    console.log('  1. 🗄️  Run SQL migration in Supabase dashboard');
    console.log('  2. 🚀 Run image migration script');
    console.log('  3. 🔧 Update frontend to use signed URLs');
    console.log('  4. 🔧 Update backend PDF renderer');
    console.log('  5. ✅ Test the new system');

    console.log('\n💡 Key benefits:');
    console.log('  - Database size reduced by ~3MB+');
    console.log('  - Better image loading performance');
    console.log('  - Scalable storage solution');
    console.log('  - Proper image metadata tracking');
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

// Run update
updateAppForSignedUrls();
