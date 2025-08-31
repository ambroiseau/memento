#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  'https://zcyalwewcdgbftaaneet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU'
)

async function applyRLSFix() {
  console.log('🔧 Applying RLS Fix for Families Table...\n')

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'sql', 'fix-family-rls-policies.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📝 SQL content to apply:')
    console.log('---')
    console.log(sqlContent)
    console.log('---')
    
    console.log('\n⚠️  IMPORTANT: This script cannot directly execute SQL via the client API')
    console.log('   due to security restrictions. You need to manually apply the SQL.')
    console.log('\n📋 To fix the family creation issue:')
    console.log('\n1. Go to your Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/zcyalwewcdgbftaaneet')
    console.log('\n2. Navigate to SQL Editor')
    console.log('\n3. Copy and paste this SQL:')
    console.log('\n```sql')
    console.log('-- Enable RLS if not already enabled')
    console.log('ALTER TABLE families ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Drop existing policies if they exist')
    console.log('DROP POLICY IF EXISTS "Authenticated users can create families" ON families;')
    console.log('DROP POLICY IF EXISTS "Family members can read their family" ON families;')
    console.log('DROP POLICY IF EXISTS "Family members can update their family" ON families;')
    console.log('DROP POLICY IF EXISTS "Family members can delete their family" ON families;')
    console.log('')
    console.log('-- Create new policies')
    console.log('CREATE POLICY "Authenticated users can create families" ON families')
    console.log('    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);')
    console.log('')
    console.log('CREATE POLICY "Family members can read their family" ON families')
    console.log('    FOR SELECT USING (')
    console.log('        id IN (')
    console.log('            SELECT family_id FROM family_members')
    console.log('            WHERE user_id = auth.uid()')
    console.log('        )')
    console.log('    );')
    console.log('')
    console.log('CREATE POLICY "Family members can update their family" ON families')
    console.log('    FOR UPDATE USING (')
    console.log('        id IN (')
    console.log('            SELECT family_id FROM family_members')
    console.log('            WHERE user_id = auth.uid()')
    console.log('        )')
    console.log('    );')
    console.log('')
    console.log('CREATE POLICY "Family admin can delete their family" ON families')
    console.log('    FOR DELETE USING (')
    console.log('        id IN (')
    console.log('            SELECT family_id FROM family_members')
    console.log('            WHERE user_id = auth.uid() AND role = \'admin\'')
    console.log('        )')
    console.log('    );')
    console.log('```')
    console.log('\n4. Click "Run" to execute the SQL')
    console.log('\n5. After applying the fix, test family creation in your app')
    console.log('\n✅ The family creation should work after applying these policies!')

  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

applyRLSFix()
