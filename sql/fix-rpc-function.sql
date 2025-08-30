-- Fix RPC function for get_family_posts_with_images
-- This script should be run in the Supabase SQL editor

-- Drop the existing function
DROP FUNCTION IF EXISTS get_family_posts_with_images(UUID, DATE, DATE);

-- Create the corrected function
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
        p.content_text as content,
        p.created_at,
        jsonb_build_object(
            'id', prof.user_id,
            'name', prof.name,
            'avatar', prof.avatar_url
        ) as author,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pi.id,
                    'storage_path', pi.storage_path,
                    'alt_text', ''
                )
            ) FILTER (WHERE pi.id IS NOT NULL),
            '[]'::jsonb
        ) as images
    FROM posts p
    LEFT JOIN profiles prof ON p.user_id = prof.user_id
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

-- Test the function
SELECT * FROM get_family_posts_with_images(
    '3d546976-eef8-4b17-81cf-717408ec003d'::UUID,
    '2024-01-01'::DATE,
    '2024-12-31'::DATE
);
