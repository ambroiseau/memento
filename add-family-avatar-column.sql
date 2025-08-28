-- Add avatar column to families table
-- Run this in your Supabase SQL editor

ALTER TABLE families ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'families' 
AND column_name = 'avatar';
