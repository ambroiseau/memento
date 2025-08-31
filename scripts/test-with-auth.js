#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import readline from 'readline'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function testWithAuth() {
  console.log('🧪 Testing Family Creation with Authentication...\n')

  try {
    // Step 1: Get user credentials
    console.log('📝 Please provide test credentials:')
    const email = await question('Email: ')
    const password = await question('Password: ')
    
    console.log('\n🔐 Signing in...')
    
    // Step 2: Sign in
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      console.log(`❌ Sign in failed: ${signInError.message}`)
      rl.close()
      return
    }

    console.log(`✅ Signed in as: ${user.email}`)
    console.log(`   User ID: ${user.id}`)

    // Step 3: Test family creation
    console.log('\n🏠 Testing family creation...')
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
      
      if (createError.code === '42501') {
        console.log('\n🔧 The RLS policies might not be applied correctly!')
        console.log('   Check that the SQL was executed successfully in Supabase.')
      }
    } else {
      console.log(`✅ Family created successfully!`)
      console.log(`   ID: ${newFamily.id}`)
      console.log(`   Name: ${newFamily.name}`)
      console.log(`   Code: ${newFamily.code}`)
      
      // Step 4: Test adding user as family member
      console.log('\n👤 Testing family member creation...')
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
      console.log('\n🧹 Cleaning up test data...')
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

    // Step 5: Sign out
    await supabase.auth.signOut()
    console.log('\n👋 Signed out')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    rl.close()
  }
}

testWithAuth()
