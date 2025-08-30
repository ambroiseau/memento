#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcyalwewcdgbftaaneet.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA1MzM3NSwiZXhwIjoyMDcxNjI5Mzc1fQ.HxEQ8tkvuL32WgnxIVhGS8LXEIuzS6otqDqi0qyqlWA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRpcWithCorrectDates() {
  try {
    console.log('🔍 Testing RPC function with correct dates...');

    // Test with 2025 dates (since posts were created in 2025)
    console.log('\n1. Testing with 2025 dates...');
    const { data: rpcResult2025, error: rpcError2025 } = await supabase.rpc(
      'get_family_posts_with_images',
      {
        p_family_id: '3d546976-eef8-4b17-81cf-717408ec003d',
        p_start_date: '2025-01-01',
        p_end_date: '2025-12-31',
      }
    );

    if (rpcError2025) {
      console.error('❌ Error calling RPC with 2025 dates:', rpcError2025);
    } else {
      console.log('✅ RPC with 2025 dates successful');
      console.log('RPC result:', rpcResult2025.length, 'posts');
      if (rpcResult2025.length > 0) {
        console.log('First result:');
        console.log(JSON.stringify(rpcResult2025[0], null, 2));
      }
    }

    // Test with a wider date range
    console.log('\n2. Testing with wider date range...');
    const { data: rpcResultWide, error: rpcErrorWide } = await supabase.rpc(
      'get_family_posts_with_images',
      {
        p_family_id: '3d546976-eef8-4b17-81cf-717408ec003d',
        p_start_date: '2020-01-01',
        p_end_date: '2030-12-31',
      }
    );

    if (rpcErrorWide) {
      console.error('❌ Error calling RPC with wide date range:', rpcErrorWide);
    } else {
      console.log('✅ RPC with wide date range successful');
      console.log('RPC result:', rpcResultWide.length, 'posts');
      if (rpcResultWide.length > 0) {
        console.log('First result:');
        console.log(JSON.stringify(rpcResultWide[0], null, 2));
      }
    }

    // Test with current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-31`;

    console.log(
      `\n3. Testing with current month (${startDate} to ${endDate})...`
    );
    const { data: rpcResultCurrent, error: rpcErrorCurrent } =
      await supabase.rpc('get_family_posts_with_images', {
        p_family_id: '3d546976-eef8-4b17-81cf-717408ec003d',
        p_start_date: startDate,
        p_end_date: endDate,
      });

    if (rpcErrorCurrent) {
      console.error(
        '❌ Error calling RPC with current month:',
        rpcErrorCurrent
      );
    } else {
      console.log('✅ RPC with current month successful');
      console.log('RPC result:', rpcResultCurrent.length, 'posts');
      if (rpcResultCurrent.length > 0) {
        console.log('First result:');
        console.log(JSON.stringify(rpcResultCurrent[0], null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testRpcWithCorrectDates();
