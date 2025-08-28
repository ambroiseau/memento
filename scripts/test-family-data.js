#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testFamilyData() {
  console.log('🔍 Testing Family Data Structure...\n')

  try {
    // Test 1: Check families table structure
    console.log('1. Checking families table...')
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('*')
      .limit(3)
    
    if (familiesError) {
      console.error('❌ Families query failed:', familiesError.message)
    } else {
      console.log(`✅ Found ${families.length} families:`)
      families.forEach((family, index) => {
        console.log(`   Family ${index + 1}:`, {
          id: family.id,
          name: family.name,
          code: family.code,
          created_at: family.created_at
        })
      })
    }
    console.log()

    // Test 2: Check family_members table
    console.log('2. Checking family_members table...')
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .limit(3)
    
    if (membersError) {
      console.error('❌ Family members query failed:', membersError.message)
    } else {
      console.log(`✅ Found ${members.length} family members:`)
      members.forEach((member, index) => {
        console.log(`   Member ${index + 1}:`, {
          id: member.id,
          family_id: member.family_id,
          user_id: member.user_id,
          role: member.role,
          created_at: member.created_at
        })
      })
    }
    console.log()

    // Test 3: Check posts table
    console.log('3. Checking posts table...')
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(3)
    
    if (postsError) {
      console.error('❌ Posts query failed:', postsError.message)
    } else {
      console.log(`✅ Found ${posts.length} posts:`)
      posts.forEach((post, index) => {
        console.log(`   Post ${index + 1}:`, {
          id: post.id,
          family_id: post.family_id,
          user_id: post.user_id,
          content_text: post.content_text?.substring(0, 50) + '...',
          created_at: post.created_at
        })
      })
    }
    console.log()

    // Test 4: Test the getUserFamily function logic
    console.log('4. Testing getUserFamily logic...')
    if (families.length > 0 && members.length > 0) {
      const testUserId = members[0].user_id
      const testFamilyId = members[0].family_id
      
      console.log(`   Testing with user_id: ${testUserId}`)
      console.log(`   Expected family_id: ${testFamilyId}`)
      
      const { data: familyMember, error: memberQueryError } = await supabase
        .from('family_members')
        .select(`
          *,
          families (*)
        `)
        .eq('user_id', testUserId)
        .single()
      
      if (memberQueryError) {
        console.log(`   ❌ Member query failed: ${memberQueryError.message}`)
      } else {
        console.log(`   ✅ Found family member:`, {
          id: familyMember.id,
          family_id: familyMember.family_id,
          user_id: familyMember.user_id,
          role: familyMember.role
        })
        
        if (familyMember.families) {
          console.log(`   ✅ Family data:`, {
            id: familyMember.families.id,
            name: familyMember.families.name,
            code: familyMember.families.code
          })
        } else {
          console.log(`   ❌ No family data found`)
        }
      }
    }
    console.log()

    // Test 5: Test getFamilyPosts function logic
    console.log('5. Testing getFamilyPosts logic...')
    if (families.length > 0) {
      const testFamilyId = families[0].id
      console.log(`   Testing with family_id: ${testFamilyId}`)
      
      // First get the posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('family_id', testFamilyId)
        .order('created_at', { ascending: false })
      
      if (postsError) {
        console.log(`   ❌ Posts query failed: ${postsError.message}`)
      } else {
        console.log(`   ✅ Found ${posts.length} posts for family`)
        
        // Get related data for each post
        const postsWithData = await Promise.all(
          posts.map(async (post) => {
            // Get profile data
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('user_id', post.user_id)
              .single()
            
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
            
            return {
              ...post,
              profiles: profile || { name: 'Unknown User', avatar_url: null },
              post_images: images || [],
              reactions: reactions || []
            }
          })
        )
        
        postsWithData.forEach((post, index) => {
          console.log(`     Post ${index + 1}:`, {
            id: post.id,
            content_text: post.content_text?.substring(0, 30) + '...',
            author: post.author?.name || 'Unknown',
            createdAt: post.createdAt,
            caption: post.caption?.substring(0, 30) + '...',
            imageUrls: post.imageUrls?.length || 0,
            reactions: Object.keys(post.reactions || {}).length
          })
        })
      }
    }

    console.log('\n🎉 Family data test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testFamilyData()
