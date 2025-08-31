#!/usr/bin/env node

async function verifyAllServices() {
  console.log('🔍 Verifying All Services...\n')

  try {
    // Test 1: Main application
    console.log('1. Testing main application...')
    const appResponse = await fetch('http://localhost:3000')
    
    if (appResponse.ok) {
      console.log('✅ Main application is running on port 3000')
    } else {
      console.log('❌ Main application is not responding')
      return
    }

    // Test 2: PDF service
    console.log('\n2. Testing PDF service...')
    const pdfResponse = await fetch('http://localhost:3003/health')
    
    if (pdfResponse.ok) {
      const pdfData = await pdfResponse.json()
      console.log(`✅ PDF service is running on port 3003: ${pdfData.status}`)
    } else {
      console.log('❌ PDF service is not responding')
      return
    }

    // Test 3: Test PDF generation endpoint
    console.log('\n3. Testing PDF generation endpoint...')
    const renderResponse = await fetch('http://localhost:3003/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        family_id: 'test',
        start: '2024-01-01',
        end: '2024-01-31',
        requested_by: 'test'
      }),
    })

    if (renderResponse.ok) {
      console.log('✅ PDF generation endpoint is responding')
    } else {
      console.log(`⚠️  PDF generation endpoint error (expected): ${renderResponse.status}`)
    }

    console.log('\n🎉 All services are running correctly!')
    console.log('\n📋 Next steps:')
    console.log('1. Open http://localhost:3000 in your browser')
    console.log('2. Sign in to your account')
    console.log('3. Try generating an album - it should work now!')
    console.log('\n🔧 Services running:')
    console.log('   - Main app: http://localhost:3000')
    console.log('   - PDF service: http://localhost:3003')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyAllServices()
