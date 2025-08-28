#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testProfileUpdate() {
  console.log('🔍 Testing Profile Update...\n')

  try {
    // Get existing profiles
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
    console.log('📝 Found profile:', {
      user_id: profile.user_id,
      name: profile.name,
      avatar_url: profile.avatar_url
    })
    console.log()

    // Test profile update
    console.log('🔄 Testing profile update...')
    const newName = `Test User ${Date.now()}`
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ name: newName })
      .eq('user_id', profile.user_id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Profile update failed:', updateError.message)
    } else {
      console.log('✅ Profile updated successfully:')
      console.log(`- Old name: ${profile.name}`)
      console.log(`- New name: ${updatedProfile.name}`)
    }
    console.log()

    // Test family update
    console.log('🔄 Testing family update...')
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
      console.log('📝 Found family:', {
        id: family.id,
        name: family.name,
        code: family.code
      })
      
      const newFamilyName = `Test Family ${Date.now()}`
      
      const { data: updatedFamily, error: familyUpdateError } = await supabase
        .from('families')
        .update({ name: newFamilyName })
        .eq('id', family.id)
        .select()
        .single()
      
      if (familyUpdateError) {
        console.error('❌ Family update failed:', familyUpdateError.message)
      } else {
        console.log('✅ Family updated successfully:')
        console.log(`- Old name: ${family.name}`)
        console.log(`- New name: ${updatedFamily.name}`)
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testProfileUpdate()
