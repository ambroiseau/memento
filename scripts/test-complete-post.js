#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testCompletePost() {
  console.log('🔍 Testing Complete Post Transformation...\n')

  try {
    // Get a post with content
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .neq('content_text', '')
      .limit(1)
    
    if (error || !posts || posts.length === 0) {
      console.error('❌ No posts with content found:', error?.message)
      return
    }

    const post = posts[0]
    console.log('📝 Original post:')
    console.log(JSON.stringify(post, null, 2))
    console.log()

    // Test the complete transformation
    console.log('🔄 Testing complete transformation...')
    
    // Get profile data (only if user_id exists)
    let profile = null
    if (post.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', post.user_id)
        .single()
      profile = profileData
    }
    
    // Get post images
    const { data: images } = await supabase
      .from('post_images')
      .select('*')
      .eq('post_id', post.id)
      .order('idx')
    
    // Get reactions
    const { data: reactions } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', post.id)
    
    // Transform reactions to the expected format
    const reactionsMap = {}
    if (reactions && reactions.length > 0) {
      reactions.forEach(reaction => {
        if (!reactionsMap[reaction.emoji]) {
          reactionsMap[reaction.emoji] = []
        }
        reactionsMap[reaction.emoji].push(reaction.user_id)
      })
    }

    const transformedPost = {
      ...post,
      // Map to expected FeedScreen structure
      author: profile || { name: 'Unknown User', avatar: null },
      createdAt: post.created_at,
      caption: post.content_text,
      imageUrls: images?.map(img => {
        // Convert storage path to URL
        if (img.storage_path) {
          // Extract the bucket and path from storage_path
          const pathParts = img.storage_path.split('/')
          if (pathParts.length >= 2) {
            const bucket = 'make-43af5861-family-photos'
            const path = pathParts.slice(1).join('/')
            // For old storage paths, show a better placeholder
            return `https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=📸+Image+Not+Available`
          }
        }
        return img.image_url || `https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=📸+Image+Not+Available`
      }) || [],
      reactions: reactionsMap,
      // Keep original fields for compatibility
      profiles: profile || { name: 'Unknown User', avatar_url: null },
      post_images: images || []
    }

    console.log('✅ Transformed post:')
    console.log(JSON.stringify(transformedPost, null, 2))
    console.log()

    console.log('📊 Summary:')
    console.log(`- Author: ${transformedPost.author.name}`)
    console.log(`- Caption: "${transformedPost.caption}"`)
    console.log(`- Created: ${transformedPost.createdAt}`)
    console.log(`- Images: ${transformedPost.imageUrls.length}`)
    console.log(`- Reactions: ${Object.keys(transformedPost.reactions).length}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testCompletePost()
