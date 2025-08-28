#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testAvatarFields() {
  console.log('🔍 Testing Avatar Field Names...\n')

  try {
    // Test 1: Check profiles table structure
    console.log('📝 Test 1: Profiles Table Structure')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError.message)
      return
    }

    if (!profiles || profiles.length === 0) {
      console.log('❌ No profiles found to test with')
      return
    }

    const profile = profiles[0]
    console.log('✅ Profile fields:', Object.keys(profile))
    console.log('✅ Profile avatar field:', {
      avatar: profile.avatar,
      avatar_url: profile.avatar_url
    })
    console.log()

    // Test 2: Check families table structure
    console.log('📝 Test 2: Families Table Structure')
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('*')
      .limit(1)
    
    if (familiesError) {
      console.error('❌ Families query failed:', familiesError.message)
    } else if (!families || families.length === 0) {
      console.log('❌ No families found to test with')
    } else {
      const family = families[0]
      console.log('✅ Family fields:', Object.keys(family))
      console.log('✅ Family avatar field:', {
        avatar: family.avatar
      })
    }
    console.log()

    // Test 3: Try updating profile avatar
    console.log('📝 Test 3: Profile Avatar Update')
    const testAvatarUrl = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>').toString('base64')}`
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: testAvatarUrl })
      .eq('user_id', profile.user_id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Profile avatar update failed:', updateError.message)
    } else {
      console.log('✅ Profile avatar updated successfully')
      console.log('✅ New avatar_url:', updatedProfile.avatar_url ? 'Set' : 'Not set')
    }
    console.log()

    // Test 4: Try updating family avatar
    if (families && families.length > 0) {
      console.log('📝 Test 4: Family Avatar Update')
      const { data: updatedFamily, error: familyUpdateError } = await supabase
        .from('families')
        .update({ avatar: testAvatarUrl })
        .eq('id', families[0].id)
        .select()
        .single()
      
      if (familyUpdateError) {
        console.error('❌ Family avatar update failed:', familyUpdateError.message)
      } else {
        console.log('✅ Family avatar updated successfully')
        console.log('✅ New avatar:', updatedFamily.avatar ? 'Set' : 'Not set')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testAvatarFields()
