-- Check current RLS policies on families table
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
WHERE tablename = 'families';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'families';

-- Example RLS policy that should allow family members to update their family
-- Run this if you don't have the right policies:

-- Enable RLS if not already enabled
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Policy to allow family members to update their family
CREATE POLICY "Family members can update their family" ON families
    FOR UPDATE USING (
        id IN (
            SELECT family_id 
            FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy to allow family members to read their family
CREATE POLICY "Family members can read their family" ON families
    FOR SELECT USING (
        id IN (
            SELECT family_id 
            FROM family_members 
            WHERE user_id = auth.uid()
        )
    );
