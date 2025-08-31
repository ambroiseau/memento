-- Fix Family RLS Policies (Safe Version)
-- Run this in your Supabase SQL Editor to fix the family creation issue
-- This version is more conservative and won't drop existing policies

-- Step 1: Enable RLS if not already enabled
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies only if they don't exist (safer approach)

-- Policy to allow authenticated users to create families
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'families' 
        AND policyname = 'Authenticated users can create families'
    ) THEN
        CREATE POLICY "Authenticated users can create families" ON families
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
        RAISE NOTICE 'Created policy: Authenticated users can create families';
    ELSE
        RAISE NOTICE 'Policy "Authenticated users can create families" already exists';
    END IF;
END $$;

-- Policy to allow family members to read their family
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'families' 
        AND policyname = 'Family members can read their family'
    ) THEN
        CREATE POLICY "Family members can read their family" ON families
            FOR SELECT USING (
                id IN (
                    SELECT family_id FROM family_members 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy: Family members can read their family';
    ELSE
        RAISE NOTICE 'Policy "Family members can read their family" already exists';
    END IF;
END $$;

-- Policy to allow family members to update their family
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'families' 
        AND policyname = 'Family members can update their family'
    ) THEN
        CREATE POLICY "Family members can update their family" ON families
            FOR UPDATE USING (
                id IN (
                    SELECT family_id FROM family_members 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy: Family members can update their family';
    ELSE
        RAISE NOTICE 'Policy "Family members can update their family" already exists';
    END IF;
END $$;

-- Policy to allow family admin to delete their family
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'families' 
        AND policyname = 'Family admin can delete their family'
    ) THEN
        CREATE POLICY "Family admin can delete their family" ON families
            FOR DELETE USING (
                id IN (
                    SELECT family_id FROM family_members 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
        RAISE NOTICE 'Created policy: Family admin can delete their family';
    ELSE
        RAISE NOTICE 'Policy "Family admin can delete their family" already exists';
    END IF;
END $$;

-- Step 3: Verify the policies were created
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

-- Step 4: Show current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'families';
