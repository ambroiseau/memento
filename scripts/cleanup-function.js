#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function cleanupFunction() {
  console.log('🧹 Cleaning up existing function...\n')

  try {
    // Try to drop the existing function
    console.log('1. Attempting to drop existing function...')
    
    // We can't drop functions via the client API, so we'll test if it exists
    const { data, error } = await supabase
      .rpc('get_family_posts_with_images', {
        p_family_id: '00000000-0000-0000-0000-000000000000',
        p_start_date: '2024-01-01',
        p_end_date: '2024-01-31'
      })
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('✅ Function does not exist (ready to create)')
    } else if (error && error.message.includes('return type')) {
      console.log('⚠️  Function exists but has different return type')
      console.log('   You need to drop it manually in SQL Editor:')
      console.log('   DROP FUNCTION IF EXISTS get_family_posts_with_images(UUID, DATE, DATE);')
    } else if (error) {
      console.log(`❌ Function test error: ${error.message}`)
    } else {
      console.log('⚠️  Function exists and works (but may have wrong structure)')
    }

    console.log('\n📋 Next steps:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Run this SQL command:')
    console.log('   DROP FUNCTION IF EXISTS get_family_posts_with_images(UUID, DATE, DATE);')
    console.log('3. Then run the migration from sql/migration-steps.sql')
    console.log('4. Test with: node scripts/test-migration.js')

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
  }
}

cleanupFunction()
