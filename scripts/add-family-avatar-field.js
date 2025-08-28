#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function addFamilyAvatarField() {
  console.log('🔧 Adding avatar field to families table...\n')

  try {
    // First, let's check the current structure
    console.log('📝 Current families table structure:')
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('*')
      .limit(1)
    
    if (familiesError) {
      console.error('❌ Families query failed:', familiesError.message)
      return
    }

    if (!families || families.length === 0) {
      console.log('❌ No families found to test with')
      return
    }

    const family = families[0]
    console.log('✅ Current fields:', Object.keys(family))
    console.log()

    // Note: We can't add columns via the client API due to RLS
    // This would need to be done via the Supabase dashboard or SQL editor
    console.log('⚠️  IMPORTANT: Cannot add columns via client API due to RLS policies')
    console.log('📋 To add the avatar field to families table, you need to:')
    console.log('   1. Go to your Supabase dashboard')
    console.log('   2. Navigate to SQL Editor')
    console.log('   3. Run this SQL command:')
    console.log()
    console.log('   ALTER TABLE families ADD COLUMN avatar TEXT;')
    console.log()
    console.log('   This will add an avatar field to store family avatar URLs')
    console.log()

    // Test if the field exists after it's added
    console.log('🧪 After adding the field, you can test it with:')
    console.log('   - Update a family with avatar')
    console.log('   - Check if the field is accessible')
    console.log()

  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

// Run the script
addFamilyAvatarField()
