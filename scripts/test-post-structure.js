#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testPostStructure() {
  console.log('🔍 Testing Post Data Structure...\n')

  try {
    // Get a single post
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Posts query failed:', error.message)
      return
    }

    if (posts.length === 0) {
      console.log('❌ No posts found')
      return
    }

    const post = posts[0]
    console.log('📝 Raw post from database:')
    console.log(JSON.stringify(post, null, 2))
    console.log()

    // Test the transformation logic
    console.log('🔄 Testing transformation...')
    
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
      .order('image_order')
    
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
      imageUrls: images?.map(img => img.image_url) || [],
      reactions: reactionsMap,
      // Keep original fields for compatibility
      profiles: profile || { name: 'Unknown User', avatar_url: null },
      post_images: images || []
    }

    console.log('✅ Transformed post:')
    console.log(JSON.stringify(transformedPost, null, 2))

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testPostStructure()
