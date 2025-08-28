#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n')

  try {
    // Test 1: Check if we can connect to the database
    console.log('1. Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message)
      return
    }
    console.log('✅ Connection successful!\n')

    // Test 2: Check table structure
    console.log('2. Checking table structure...')
    const tables = ['profiles', 'families', 'family_members', 'posts', 'post_images', 'reactions']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: Accessible (${data.length} sample records)`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }
    console.log()

    // Test 3: Check RLS policies
    console.log('3. Testing Row Level Security...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user - RLS may block access')
      console.log('   (This is normal for unauthenticated requests)')
    } else {
      console.log(`✅ Authenticated as: ${user.email}`)
    }
    console.log()

    // Test 4: Check storage bucket
    console.log('4. Testing storage bucket...')
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      
      if (bucketError) {
        console.log(`❌ Storage error: ${bucketError.message}`)
      } else {
        const familyPhotosBucket = buckets.find(b => b.name === 'make-43af5861-family-photos')
        if (familyPhotosBucket) {
          console.log('✅ Storage bucket "make-43af5861-family-photos" found')
        } else {
          console.log('❌ Storage bucket "make-43af5861-family-photos" not found')
          console.log('   Available buckets:', buckets.map(b => b.name).join(', '))
        }
      }
    } catch (err) {
      console.log(`❌ Storage test failed: ${err.message}`)
    }
    console.log()

    // Test 5: Sample data check
    console.log('5. Checking sample data...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.log(`❌ Profiles query failed: ${profilesError.message}`)
    } else {
      console.log(`✅ Found ${profiles.length} profiles`)
    }

    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('*')
      .limit(5)
    
    if (familiesError) {
      console.log(`❌ Families query failed: ${familiesError.message}`)
    } else {
      console.log(`✅ Found ${families.length} families`)
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(5)
    
    if (postsError) {
      console.log(`❌ Posts query failed: ${postsError.message}`)
    } else {
      console.log(`✅ Found ${posts.length} posts`)
    }

    console.log('\n🎉 Database connection test completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Create a test user account')
    console.log('2. Create or join a family')
    console.log('3. Try creating a post')
    console.log('4. Check if posts appear in the database')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testDatabaseConnection()
