#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function setupEnvironment() {
  console.log('🔐 Setting up environment variables for Memento App\n')
  
  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled')
      rl.close()
      return
    }
  }
  
  console.log('Please provide the following information:\n')
  
  // Get Supabase configuration
  const supabaseUrl = await question('🔗 Supabase Project URL: ')
  const supabaseAnonKey = await question('🔑 Supabase Anonymous Key: ')
  
  // Get app configuration
  const appName = await question('📱 App Name (default: Memento App): ') || 'Memento App'
  const appVersion = await question('📦 App Version (default: 1.0.0): ') || '1.0.0'
  
  // Get feature flags
  const enablePWA = await question('📱 Enable PWA features? (Y/n): ') || 'y'
  const enableOffline = await question('📴 Enable offline support? (Y/n): ') || 'y'
  const enablePushNotifications = await question('🔔 Enable push notifications? (y/N): ') || 'n'
  
  // Get development settings
  const debugMode = await question('🐛 Enable debug mode? (y/N): ') || 'n'
  const logLevel = await question('📝 Log level (default: info): ') || 'info'
  
  // Get storage configuration
  const storageBucket = await question('🪣 Storage bucket name (default: family-photos): ') || 'family-photos'
  const maxFileSize = await question('📁 Max file size in bytes (default: 10485760): ') || '10485760'
  
  // Get API configuration
  const apiTimeout = await question('⏱️  API timeout in ms (default: 30000): ') || '30000'
  const maxRetries = await question('🔄 Max retries (default: 3): ') || '3'
  
  // Generate .env content
  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}

# App Configuration
VITE_APP_NAME=${appName}
VITE_APP_VERSION=${appVersion}

# Feature Flags
VITE_ENABLE_PWA=${enablePWA === 'y' ? 'true' : 'false'}
VITE_ENABLE_OFFLINE=${enableOffline === 'y' ? 'true' : 'false'}
VITE_ENABLE_PUSH_NOTIFICATIONS=${enablePushNotifications === 'y' ? 'true' : 'false'}

# Development
VITE_DEBUG_MODE=${debugMode === 'y' ? 'true' : 'false'}
VITE_LOG_LEVEL=${logLevel}

# Storage Configuration
VITE_STORAGE_BUCKET=${storageBucket}
VITE_MAX_FILE_SIZE=${maxFileSize}

# API Configuration
VITE_API_TIMEOUT=${apiTimeout}
VITE_MAX_RETRIES=${maxRetries}
`
  
  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent)
    console.log('\n✅ Environment variables saved to .env file')
    console.log('\n📋 Next steps:')
    console.log('1. Add .env to your .gitignore file')
    console.log('2. Restart your development server')
    console.log('3. Test the app to ensure everything works')
  } catch (error) {
    console.error('❌ Error writing .env file:', error.message)
  }
  
  rl.close()
}

// Run the setup
setupEnvironment().catch(console.error)
