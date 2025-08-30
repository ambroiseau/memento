#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure for PDF Renderer Migration...\n')

  try {
    // Check if tables exist and their structure
    const tables = ['families', 'profiles', 'family_members', 'posts', 'post_images']
    
    for (const table of tables) {
      console.log(`📋 Checking table: ${table}`)
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: Exists`)
          if (data && data.length > 0) {
            const sampleRecord = data[0]
            console.log(`   Columns: ${Object.keys(sampleRecord).join(', ')}`)
            
            // Check for specific columns we need
            if (table === 'families') {
              if (sampleRecord.id) console.log('   ✅ Has "id" column')
              else console.log('   ❌ Missing "id" column')
            }
            
            if (table === 'profiles') {
              if (sampleRecord.id) console.log('   ✅ Has "id" column')
              else console.log('   ❌ Missing "id" column')
            }
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
      console.log()
    }

    // Check if render_jobs table already exists
    console.log('📋 Checking if render_jobs table exists...')
    try {
      const { data, error } = await supabase
        .from('render_jobs')
        .select('*')
        .limit(1)
      
      if (error && error.message.includes('does not exist')) {
        console.log('✅ render_jobs table does not exist (ready to create)')
      } else if (error) {
        console.log(`❌ render_jobs query error: ${error.message}`)
      } else {
        console.log('⚠️  render_jobs table already exists')
        console.log(`   Columns: ${Object.keys(data[0] || {}).join(', ')}`)
      }
    } catch (err) {
      console.log('✅ render_jobs table does not exist (ready to create)')
    }
    console.log()

    // Check if the RPC function exists
    console.log('📋 Checking if get_family_posts_with_images function exists...')
    try {
      const { data, error } = await supabase
        .rpc('get_family_posts_with_images', {
          p_family_id: '00000000-0000-0000-0000-000000000000',
          p_start_date: '2024-01-01',
          p_end_date: '2024-01-31'
        })
      
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('✅ get_family_posts_with_images function does not exist (ready to create)')
      } else if (error) {
        console.log(`❌ Function exists but error: ${error.message}`)
      } else {
        console.log('⚠️  get_family_posts_with_images function already exists')
      }
    } catch (err) {
      console.log('✅ get_family_posts_with_images function does not exist (ready to create)')
    }
    console.log()

    // Generate corrected migration SQL
    console.log('📝 Recommended Migration Steps:')
    console.log('1. First, verify the exact column names in your tables')
    console.log('2. Update the migration SQL if needed')
    console.log('3. Run the migration in Supabase SQL Editor')
    console.log()

  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

checkDatabaseStructure()
