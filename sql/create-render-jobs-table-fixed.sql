-- Create render_jobs table (FIXED VERSION)
-- This version matches the actual database structure

CREATE TABLE IF NOT EXISTS render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
    pdf_url TEXT,
    page_count INTEGER,
    requested_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_render_jobs_family_id ON render_jobs(family_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_requested_at ON render_jobs(requested_at DESC);

-- Enable Row Level Security
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow family members to select their own render jobs
CREATE POLICY "Family members can view their render jobs" ON render_jobs
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM family_members 
            WHERE user_id = auth.uid()
        )
    );

-- Allow service role to insert/update (for backend operations)
CREATE POLICY "Service role can manage render jobs" ON render_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- Create RPC function to get family posts with images for a date range (FIXED VERSION)
-- This version matches the actual column names in the database
CREATE OR REPLACE FUNCTION get_family_posts_with_images(
    p_family_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    author JSONB,
    images JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.content_text as content,  -- Fixed: use content_text instead of content
        p.created_at,
        jsonb_build_object(
            'id', prof.user_id,     -- Fixed: use user_id instead of id
            'name', prof.name,
            'avatar', prof.avatar_url  -- Fixed: use avatar_url instead of avatar
        ) as author,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pi.id,
                    'storage_path', pi.storage_path,
                    'alt_text', ''  -- Fixed: no alt_text column exists, use empty string
                )
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::jsonb
        ) as images
    FROM posts p
    LEFT JOIN profiles prof ON p.user_id = prof.user_id  -- Fixed: use user_id instead of author_id
    LEFT JOIN post_images pi ON p.id = pi.post_id
    WHERE p.family_id = p_family_id
        AND DATE(p.created_at) >= p_start_date
        AND DATE(p.created_at) <= p_end_date
    GROUP BY p.id, p.content_text, p.created_at, prof.user_id, prof.name, prof.avatar_url
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION get_family_posts_with_images(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_family_posts_with_images(UUID, DATE, DATE) TO service_role;
