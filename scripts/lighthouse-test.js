#!/usr/bin/env node

import { launch as chromeLauncher } from 'chrome-launcher';
import fs from 'fs';
import lighthouse from 'lighthouse';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runLighthouse() {
  console.log('🔍 Starting Lighthouse PWA audit...\n');
  
  // Launch Chrome
  const chrome = await chromeLauncher({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['pwa'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse('http://localhost:3001', options);
  const reportJson = runnerResult.lhr;
  
  await chrome.kill();
  
  // Extract PWA scores
  const pwaScore = reportJson.categories.pwa.score * 100;
  const pwaAudits = reportJson.audits;
  
  console.log(`📊 PWA Score: ${pwaScore.toFixed(0)}/100\n`);
  
  // Check specific PWA requirements
  const checks = {
    'Manifest': pwaAudits['web-app-manifest']?.score === 1,
    '192x192 Icon': pwaAudits['maskable-icon']?.score === 1,
    '512x512 Icon': pwaAudits['apple-touch-icon']?.score === 1,
    'Service Worker': pwaAudits['service-worker']?.score === 1,
    'Offline': pwaAudits['offline-start-url']?.score === 1,
    'Start URL': pwaAudits['start-url']?.score === 1,
    'HTTPS': pwaAudits['is-on-https']?.score === 1,
    'Viewport': pwaAudits['viewport']?.score === 1,
  };
  
  console.log('🔍 PWA Requirements Check:');
  Object.entries(checks).forEach(([requirement, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${requirement}`);
  });
  
  // Show detailed issues
  console.log('\n📋 Issues Found:');
  Object.entries(pwaAudits).forEach(([auditName, audit]) => {
    if (audit.score !== 1 && audit.score !== null) {
      console.log(`  ❌ ${auditName}: ${audit.title}`);
      if (audit.details && audit.details.items) {
        audit.details.items.forEach(item => {
          console.log(`     - ${item}`);
        });
      }
    }
  });
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'lighthouse-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportJson, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return pwaScore;
}

// Run the test
runLighthouse().catch(console.error);
