-- Fix Family RLS Policies
-- Run this in your Supabase SQL Editor to fix the family creation issue

-- Step 1: Enable RLS if not already enabled
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can create families" ON families;
DROP POLICY IF EXISTS "Family members can read their family" ON families;
DROP POLICY IF EXISTS "Family members can update their family" ON families;
DROP POLICY IF EXISTS "Family members can delete their family" ON families;

-- Step 3: Create new policies

-- Policy to allow authenticated users to create families
CREATE POLICY "Authenticated users can create families" ON families
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy to allow family members to read their family
CREATE POLICY "Family members can read their family" ON families
    FOR SELECT USING (
        id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy to allow family members to update their family
CREATE POLICY "Family members can update their family" ON families
    FOR UPDATE USING (
        id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy to allow family admin to delete their family
CREATE POLICY "Family admin can delete their family" ON families
    FOR DELETE USING (
        id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Step 4: Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'families'
ORDER BY policyname;

-- Step 5: Test the policies (optional - run this to verify)
-- This will show you the current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'families';
