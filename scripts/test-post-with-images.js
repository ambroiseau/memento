#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testPostWithImages() {
  console.log('🔍 Testing Post with Images...\n')

  try {
    // Get a post that has images
    const { data: images, error: imagesError } = await supabase
      .from('post_images')
      .select('*')
      .limit(1)
    
    if (imagesError || !images || images.length === 0) {
      console.error('❌ No images found:', imagesError?.message)
      return
    }

    const image = images[0]
    console.log('📸 Found image:', image)
    console.log()

    // Get the post for this image
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', image.post_id)
      .single()
    
    if (postsError) {
      console.error('❌ Post query failed:', postsError.message)
      return
    }

    console.log('📝 Post for this image:')
    console.log(JSON.stringify(posts, null, 2))
    console.log()

    // Test the transformation logic
    console.log('🔄 Testing image URL generation...')
    
    // Get all images for this post
    const { data: postImages } = await supabase
      .from('post_images')
      .select('*')
      .eq('post_id', posts.id)
      .order('idx')
    
    console.log('📸 All images for this post:')
    console.log(postImages)
    console.log()

    // Test URL generation
    const imageUrls = postImages?.map(img => {
      if (img.storage_path) {
        const pathParts = img.storage_path.split('/')
        if (pathParts.length >= 2) {
          const bucket = 'make-43af5861-family-photos'
          const path = pathParts.slice(1).join('/')
          // For now, return a placeholder since the bucket might not exist
          return `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Unavailable`
        }
      }
      return img.image_url || `https://via.placeholder.com/400x300/cccccc/666666?text=Image+Unavailable`
    }) || []

    console.log('🔗 Generated image URLs:')
    imageUrls.forEach((url, index) => {
      console.log(`  ${index + 1}. ${url}`)
    })

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testPostWithImages()
