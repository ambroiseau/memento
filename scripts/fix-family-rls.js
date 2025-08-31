#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function fixFamilyRLS() {
  console.log('🔧 Diagnosing and fixing Family RLS issues...\n')

  try {
    // Test 1: Check if we can read families (should work for authenticated users)
    console.log('1. Testing family read access...')
    const { data: families, error: readError } = await supabase
      .from('families')
      .select('*')
      .limit(1)
    
    if (readError) {
      console.log(`❌ Read error: ${readError.message}`)
    } else {
      console.log(`✅ Read access works (${families.length} families found)`)
    }

    // Test 2: Try to create a family (this is what's failing)
    console.log('\n2. Testing family creation...')
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
      console.log(`❌ Create error: ${createError.message}`)
      console.log(`   Code: ${createError.code}`)
      console.log(`   Details: ${createError.details}`)
      console.log(`   Hint: ${createError.hint}`)
    } else {
      console.log(`✅ Family created successfully: ${newFamily.name}`)
      
      // Clean up the test family
      await supabase
        .from('families')
        .delete()
        .eq('id', newFamily.id)
    }

    // Test 3: Check authentication status
    console.log('\n3. Checking authentication status...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user - this explains the RLS issue!')
      console.log('   Users must be authenticated to create families')
    } else {
      console.log(`✅ Authenticated as: ${user.email}`)
    }

    console.log('\n📋 DIAGNOSIS:')
    console.log('The error "new row violates row-level security policy for table families"')
    console.log('indicates that there is no RLS policy allowing INSERT operations on the families table.')
    console.log('\n🔧 SOLUTION:')
    console.log('You need to add an INSERT policy to the families table. Run this SQL in your Supabase dashboard:')
    console.log('\n```sql')
    console.log('-- Enable RLS if not already enabled')
    console.log('ALTER TABLE families ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Policy to allow authenticated users to create families')
    console.log('CREATE POLICY "Authenticated users can create families" ON families')
    console.log('    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);')
    console.log('')
    console.log('-- Policy to allow family members to read their family')
    console.log('CREATE POLICY "Family members can read their family" ON families')
    console.log('    FOR SELECT USING (')
    console.log('        id IN (')
    console.log('            SELECT family_id FROM family_members')
    console.log('            WHERE user_id = auth.uid()')
    console.log('        )')
    console.log('    );')
    console.log('')
    console.log('-- Policy to allow family members to update their family')
    console.log('CREATE POLICY "Family members can update their family" ON families')
    console.log('    FOR UPDATE USING (')
    console.log('        id IN (')
    console.log('            SELECT family_id FROM family_members')
    console.log('            WHERE user_id = auth.uid()')
    console.log('        )')
    console.log('    );')
    console.log('```')

  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

fixFamilyRLS()
