#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testFamilyCreation() {
  console.log('🧪 Testing Family Creation with Authentication...\n')

  try {
    // Step 1: Check current authentication status
    console.log('1. Checking authentication status...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user found')
      console.log('   You need to sign in first to test family creation')
      console.log('\n📋 To test this properly:')
      console.log('   1. Open your app in the browser')
      console.log('   2. Sign in with a test account')
      console.log('   3. Try to create a family')
      console.log('   4. Check the browser console for errors')
      return
    }

    console.log(`✅ Authenticated as: ${user.email}`)
    console.log(`   User ID: ${user.id}`)

    // Step 2: Test family creation
    console.log('\n2. Testing family creation...')
    const testFamilyName = `Test Family ${Date.now()}`
    const testFamilyCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    console.log(`   Creating family: "${testFamilyName}" with code: ${testFamilyCode}`)
    
    const { data: newFamily, error: createError } = await supabase
      .from('families')
      .insert({ 
        name: testFamilyName, 
        code: testFamilyCode 
      })
      .select()
      .single()

    if (createError) {
      console.log(`❌ Family creation failed: ${createError.message}`)
      console.log(`   Code: ${createError.code}`)
      console.log(`   Details: ${createError.details}`)
      console.log(`   Hint: ${createError.hint}`)
      
      if (createError.code === '42501') {
        console.log('\n🔧 This is a Row Level Security (RLS) issue!')
        console.log('   You need to run the SQL fix in your Supabase dashboard:')
        console.log('\n   Go to: Supabase Dashboard → SQL Editor')
        console.log('   Run the contents of: sql/fix-family-rls-policies.sql')
      }
    } else {
      console.log(`✅ Family created successfully!`)
      console.log(`   ID: ${newFamily.id}`)
      console.log(`   Name: ${newFamily.name}`)
      console.log(`   Code: ${newFamily.code}`)
      
      // Step 3: Test adding user as family member
      console.log('\n3. Testing family member creation...')
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: newFamily.id,
          user_id: user.id,
          role: 'admin',
        })

      if (memberError) {
        console.log(`❌ Member creation failed: ${memberError.message}`)
      } else {
        console.log(`✅ User added as family admin successfully!`)
      }
      
      // Clean up test data
      console.log('\n4. Cleaning up test data...')
      await supabase
        .from('family_members')
        .delete()
        .eq('family_id', newFamily.id)
      
      await supabase
        .from('families')
        .delete()
        .eq('id', newFamily.id)
      
      console.log('✅ Test data cleaned up')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testFamilyCreation()
