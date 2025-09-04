#!/usr/bin/env node

/**
 * Script de monitoring du service PDF Railway
 * Usage: node scripts/monitor-pdf-service.js
 */

const https = require('https');

const PDF_SERVICE_URL = 'https://memento-production-5f3d.up.railway.app';
const FRONTEND_URL = 'https://memento-ruddy.vercel.app';

async function testService() {
  console.log('🔍 Test du service PDF...\n');

  try {
    // Test 1: Health check
    console.log('1. 🏥 Health check...');
    const healthResponse = await fetch(`${PDF_SERVICE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);

    // Test 2: CORS test
    console.log('\n2. 🌐 Test CORS...');
    const corsResponse = await fetch(`${PDF_SERVICE_URL}/cors-test`, {
      headers: {
        Origin: FRONTEND_URL,
      },
    });
    const corsData = await corsResponse.json();
    console.log('✅ CORS:', corsData);

    console.log('\n✅ Service PDF opérationnel !');
    return true;
  } catch (error) {
    console.error('❌ Service PDF en panne:', error.message);
    return false;
  }
}

// Test immédiat
testService().then(success => {
  if (!success) {
    console.log('\n🔧 Pour corriger: node scripts/fix-pdf-service.js');
    process.exit(1);
  }
});
