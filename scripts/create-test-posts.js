#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function createTestPosts() {
  console.log('📝 Creating Test Posts...\n')

  try {
    // Step 1: Get family and user data
    console.log('1. Getting family and user data...')
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, name')
      .limit(1)
    
    if (familiesError || !families || families.length === 0) {
      console.log('❌ No families found')
      return
    }

    const family = families[0]
    console.log(`✅ Family: ${family.name} (${family.id})`)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .limit(1)
    
    if (profilesError || !profiles || profiles.length === 0) {
      console.log('❌ No users found')
      return
    }

    const user = profiles[0]
    console.log(`✅ User: ${user.name} (${user.user_id})`)

    // Step 2: Create test posts for the current month
    console.log('\n2. Creating test posts...')
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const testPosts = [
      {
        content_text: "Beautiful sunset at the beach today! 🌅",
        created_at: new Date(currentYear, currentMonth, 15, 14, 30).toISOString(),
        month_tag: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      },
      {
        content_text: "Family dinner was amazing! Everyone loved the new recipe. 👨‍👩‍👧‍👦",
        created_at: new Date(currentYear, currentMonth, 18, 19, 15).toISOString(),
        month_tag: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      },
      {
        content_text: "Weekend hike in the mountains. The view was breathtaking! ⛰️",
        created_at: new Date(currentYear, currentMonth, 22, 11, 45).toISOString(),
        month_tag: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      },
      {
        content_text: "Birthday celebration for our little one! 🎂🎉",
        created_at: new Date(currentYear, currentMonth, 25, 16, 20).toISOString(),
        month_tag: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      },
      {
        content_text: "Movie night with popcorn and blankets. Perfect evening! 🍿",
        created_at: new Date(currentYear, currentMonth, 28, 20, 10).toISOString(),
        month_tag: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      }
    ]

    console.log(`   Creating ${testPosts.length} test posts...`)

    for (let i = 0; i < testPosts.length; i++) {
      const postData = {
        family_id: family.id,
        user_id: user.user_id,
        ...testPosts[i]
      }

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()

      if (postError) {
        console.log(`❌ Error creating post ${i + 1}:`, postError.message)
      } else {
        console.log(`✅ Created post ${i + 1}: "${postData.content_text.substring(0, 30)}..."`)
      }
    }

    // Step 3: Verify posts were created
    console.log('\n3. Verifying posts...')
    const { data: createdPosts, error: verifyError } = await supabase
      .from('posts')
      .select('id, content_text, created_at')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (verifyError) {
      console.log('❌ Error verifying posts:', verifyError.message)
    } else {
      console.log(`✅ Found ${createdPosts.length} posts in the family`)
      createdPosts.forEach((post, index) => {
        const date = new Date(post.created_at).toLocaleDateString()
        console.log(`   ${index + 1}. ${date}: ${post.content_text}`)
      })
    }

    console.log('\n🎉 Test posts created successfully!')
    console.log('You can now test album generation in the app.')
    console.log('The posts are for the current month, so the album generation should work.')

  } catch (error) {
    console.error('❌ Failed to create test posts:', error.message)
  }
}

createTestPosts()
