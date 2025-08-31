#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function checkCurrentRLS() {
  console.log('🔍 Checking Current RLS Policies on Families Table...\n')

  try {
    // Test 1: Check if we can read families
    console.log('1. Testing family read access...')
    const { data: families, error: readError } = await supabase
      .from('families')
      .select('*')
      .limit(1)
    
    if (readError) {
      console.log(`❌ Read error: ${readError.message}`)
      console.log(`   Code: ${readError.code}`)
    } else {
      console.log(`✅ Read access works (${families.length} families found)`)
    }

    // Test 2: Check if we can create families (this should fail without proper policies)
    console.log('\n2. Testing family creation (should fail without proper policies)...')
    const testFamilyName = `Test Family ${Date.now()}`
    const testFamilyCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { data: newFamily, error: createError } = await supabase
      .from('families')
      .insert({ 
        name: testFamilyName, 
        code: testFamilyCode 
      })
      .select()
      .single()

    if (createError) {
      console.log(`❌ Create error (expected): ${createError.message}`)
      console.log(`   Code: ${createError.code}`)
      
      if (createError.code === '42501') {
        console.log('   ✅ This confirms the RLS policy issue!')
      }
    } else {
      console.log(`⚠️  Family created successfully - RLS policies might already be fixed!`)
      console.log(`   ID: ${newFamily.id}`)
      console.log(`   Name: ${newFamily.name}`)
      
      // Clean up
      await supabase
        .from('families')
        .delete()
        .eq('id', newFamily.id)
    }

    // Test 3: Check authentication status
    console.log('\n3. Checking authentication status...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user')
      console.log('   This explains why family creation fails')
      console.log('   Users must be authenticated to create families')
    } else {
      console.log(`✅ Authenticated as: ${user.email}`)
      console.log(`   User ID: ${user.id}`)
    }

    console.log('\n📋 SUMMARY:')
    console.log('The family creation issue is caused by missing RLS policies.')
    console.log('To fix this, you need to:')
    console.log('\n1. Apply the RLS policies (see sql/fix-family-rls-policies.sql)')
    console.log('2. Ensure users are authenticated when creating families')
    console.log('3. Test the family creation functionality')

  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkCurrentRLS()
