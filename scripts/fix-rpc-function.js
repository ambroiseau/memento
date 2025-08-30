#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRpcFunction() {
  try {
    console.log('🔧 Fixing RPC function...');

    // Drop the existing function
    console.log('1. Dropping existing function...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS get_family_posts_with_images(UUID, DATE, DATE);',
    });

    if (dropError) {
      console.error('❌ Error dropping function:', dropError);
      return;
    }

    console.log('✅ Function dropped');

    // Create the corrected function
    console.log('2. Creating corrected function...');
    const createFunctionSQL = `
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
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL,
    });

    if (createError) {
      console.error('❌ Error creating function:', createError);
      return;
    }

    console.log('✅ Function created');

    // Grant permissions
    console.log('3. Granting permissions...');
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: `
        GRANT EXECUTE ON FUNCTION get_family_posts_with_images(UUID, DATE, DATE) TO authenticated;
        GRANT EXECUTE ON FUNCTION get_family_posts_with_images(UUID, DATE, DATE) TO service_role;
      `,
    });

    if (grantError) {
      console.error('❌ Error granting permissions:', grantError);
      return;
    }

    console.log('✅ Permissions granted');

    // Test the function
    console.log('4. Testing the function...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'get_family_posts_with_images',
      {
        p_family_id: '3d546976-eef8-4b17-81cf-717408ec003d',
        p_start_date: '2024-01-01',
        p_end_date: '2024-12-31',
      }
    );

    if (rpcError) {
      console.error('❌ Error testing function:', rpcError);
      return;
    }

    console.log('✅ Function test successful');
    console.log('RPC result:', rpcResult.length, 'posts');
    if (rpcResult.length > 0) {
      console.log('First result:');
      console.log(JSON.stringify(rpcResult[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixRpcFunction();
