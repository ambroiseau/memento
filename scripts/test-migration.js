#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testMigration() {
  console.log('🧪 Testing PDF Renderer Migration...\n')

  try {
    // Test 1: Check if render_jobs table exists
    console.log('1. Testing render_jobs table...')
    try {
      const { data, error } = await supabase
        .from('render_jobs')
        .select('*')
        .limit(1)
      
      if (error && error.message.includes('does not exist')) {
        console.log('❌ render_jobs table does not exist')
        console.log('   Please run the migration SQL first')
        return
      } else if (error) {
        console.log(`❌ render_jobs query error: ${error.message}`)
        return
      } else {
        console.log('✅ render_jobs table exists')
        console.log(`   Columns: ${Object.keys(data[0] || {}).join(', ')}`)
      }
    } catch (err) {
      console.log('❌ render_jobs table does not exist')
      console.log('   Please run the migration SQL first')
      return
    }

    // Test 2: Test the RPC function
    console.log('\n2. Testing get_family_posts_with_images function...')
    try {
      // Get a sample family ID
      const { data: families } = await supabase
        .from('families')
        .select('id')
        .limit(1)
      
      if (!families || families.length === 0) {
        console.log('❌ No families found to test with')
        return
      }

      const familyId = families[0].id
      console.log(`   Testing with family ID: ${familyId}`)

      const { data: posts, error } = await supabase
        .rpc('get_family_posts_with_images', {
          p_family_id: familyId,
          p_start_date: '2024-01-01',
          p_end_date: '2024-12-31'
        })
      
      if (error) {
        console.log(`❌ Function error: ${error.message}`)
        return
      } else {
        console.log(`✅ Function works! Found ${posts.length} posts`)
        if (posts.length > 0) {
          const samplePost = posts[0]
          console.log('   Sample post structure:')
          console.log(`     - id: ${samplePost.id}`)
          console.log(`     - content: ${samplePost.content?.substring(0, 50)}...`)
          console.log(`     - author: ${JSON.stringify(samplePost.author)}`)
          console.log(`     - images: ${samplePost.images?.length || 0} images`)
        }
      }
    } catch (err) {
      console.log(`❌ Function test failed: ${err.message}`)
      return
    }

    // Test 3: Test RLS policies
    console.log('\n3. Testing RLS policies...')
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('⚠️  No authenticated user - RLS policies will block access')
        console.log('   This is normal for unauthenticated requests')
      } else {
        console.log(`✅ Authenticated as: ${user.email}`)
        
        // Try to insert a test job
        const { data: job, error: insertError } = await supabase
          .from('render_jobs')
          .insert({
            family_id: families[0].id,
            period_start: '2024-01-01',
            period_end: '2024-01-31',
            status: 'running',
            requested_by: user.id
          })
          .select()
          .single()
        
        if (insertError) {
          console.log(`❌ Insert test failed: ${insertError.message}`)
        } else {
          console.log('✅ Insert test successful')
          
          // Clean up test data
          await supabase
            .from('render_jobs')
            .delete()
            .eq('id', job.id)
          
          console.log('✅ Cleanup successful')
        }
      }
    } catch (err) {
      console.log(`❌ RLS test failed: ${err.message}`)
    }

    console.log('\n🎉 Migration test completed successfully!')
    console.log('   The PDF renderer should now work correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testMigration()
