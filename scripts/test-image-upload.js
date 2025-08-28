#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result
      resolve(result.split(',')[1]) // Remove data:image/...;base64, prefix
    }
    reader.onerror = error => reject(error)
  })
}

async function testImageUpload() {
  console.log('🔍 Testing Image Upload...\n')

  try {
    // Create a mock file for testing
    const mockFile = new File(['mock image data'], 'test.jpg', { type: 'image/jpeg' })
    
    console.log('📸 Mock file created:', {
      name: mockFile.name,
      type: mockFile.type,
      size: mockFile.size
    })
    console.log()

    // Test the uploadImage function logic
    const fileExt = mockFile.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const userId = 'test-user-id'
    
    console.log('🔄 Testing upload logic...')
    console.log(`- File name: ${fileName}`)
    console.log(`- User ID: ${userId}`)
    console.log()

    try {
      // Try to upload to storage bucket first
      const { data, error } = await supabase.storage
        .from('make-43af5861-family-photos')
        .upload(`${userId}/${fileName}`, mockFile)
      
      if (error) {
        console.log('❌ Storage bucket not available:', error.message)
        console.log('📝 Using base64 fallback...')
        
        // Use base64 fallback
        const base64Data = await fileToBase64(mockFile)
        const result = {
          imageId: fileName,
          url: `data:${mockFile.type};base64,${base64Data}`,
          path: `${userId}/${fileName}`
        }
        
        console.log('✅ Base64 fallback result:')
        console.log(`- Image ID: ${result.imageId}`)
        console.log(`- URL type: ${result.url.substring(0, 30)}...`)
        console.log(`- Path: ${result.path}`)
      } else {
        console.log('✅ Storage upload successful!')
        console.log('📝 Creating signed URL...')
        
        // Create signed URL
        const { data: signedUrlData } = await supabase.storage
          .from('make-43af5861-family-photos')
          .createSignedUrl(`${userId}/${fileName}`, 60 * 60 * 24 * 7) // 7 days
        
        const result = {
          imageId: fileName,
          url: signedUrlData?.signedUrl,
          path: `${userId}/${fileName}`
        }
        
        console.log('✅ Storage result:')
        console.log(`- Image ID: ${result.imageId}`)
        console.log(`- URL: ${result.url}`)
        console.log(`- Path: ${result.path}`)
      }
    } catch (error) {
      console.log('❌ Upload failed:', error.message)
      console.log('📝 Using base64 fallback...')
      
      // Use base64 fallback
      const base64Data = await fileToBase64(mockFile)
      const result = {
        imageId: fileName,
        url: `data:${mockFile.type};base64,${base64Data}`,
        path: `${userId}/${fileName}`
      }
      
      console.log('✅ Base64 fallback result:')
      console.log(`- Image ID: ${result.imageId}`)
      console.log(`- URL type: ${result.url.substring(0, 30)}...`)
      console.log(`- Path: ${result.path}`)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testImageUpload()
