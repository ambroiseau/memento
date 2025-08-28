#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple SVG icon generator for PWA
function generateIcon(size) {
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>
  <circle cx="${size * 0.5}" cy="${size * 0.4}" r="${size * 0.15}" fill="white" opacity="0.9"/>
  <circle cx="${size * 0.5}" cy="${size * 0.6}" r="${size * 0.1}" fill="white" opacity="0.7"/>
  <circle cx="${size * 0.5}" cy="${size * 0.75}" r="${size * 0.05}" fill="white" opacity="0.5"/>
</svg>`;

  return svg;
}

// Convert SVG to PNG using a simple base64 approach
// In a real scenario, you'd use a proper image processing library
function createPlaceholderPNG(size) {
  // Create a simple colored square as placeholder
  const canvas = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#667eea"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="${size * 0.1}">M</text>
</svg>`;
  
  return Buffer.from(canvas).toString('base64');
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');
  
  const iconsDir = path.join(__dirname, '../public/icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  const iconSizes = [
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'icon-maskable-192x192.png', size: 192 },
    { name: 'icon-maskable-512x512.png', size: 512 }
  ];
  
  for (const icon of iconSizes) {
    const svg = generateIcon(icon.size);
    const svgPath = path.join(iconsDir, icon.name.replace('.png', '.svg'));
    
    // Save SVG version
    fs.writeFileSync(svgPath, svg);
    
    // For now, create a simple placeholder PNG
    // In production, you'd convert SVG to PNG using a proper library
    const pngPath = path.join(iconsDir, icon.name);
    
    // Create a simple colored square as placeholder
    const placeholderSvg = `
<svg width="${icon.size}" height="${icon.size}" viewBox="0 0 ${icon.size} ${icon.size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${icon.size}" height="${icon.size}" rx="${icon.size * 0.2}" fill="url(#grad1)"/>
  <circle cx="${icon.size * 0.5}" cy="${icon.size * 0.4}" r="${icon.size * 0.15}" fill="white" opacity="0.9"/>
  <circle cx="${icon.size * 0.5}" cy="${icon.size * 0.6}" r="${icon.size * 0.1}" fill="white" opacity="0.7"/>
  <circle cx="${icon.size * 0.5}" cy="${icon.size * 0.75}" r="${icon.size * 0.05}" fill="white" opacity="0.5"/>
</svg>`;
    
    // For now, save as SVG with .png extension (browsers will handle it)
    fs.writeFileSync(pngPath, placeholderSvg);
    
    console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size})`);
  }
  
  // Also create a favicon
  const faviconSvg = generateIcon(32);
  const faviconPath = path.join(iconsDir, 'favicon.svg');
  fs.writeFileSync(faviconPath, faviconSvg);
  
  console.log('\n🎉 All PWA icons generated successfully!');
  console.log('\n📝 Note: These are SVG files with .png extensions.');
  console.log('   For production, convert them to actual PNG files using:');
  console.log('   - Online tools like convertio.co');
  console.log('   - Image editing software');
  console.log('   - Or use a proper image processing library');
}

generateIcons().catch(console.error);
