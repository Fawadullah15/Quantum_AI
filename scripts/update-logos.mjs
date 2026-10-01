import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const inputPath = 'public/quantum-q-logo.jpg';

async function updateLogos() {
  try {
    const img = sharp(inputPath);
    
    // Convert to PNG for the main logo
    await img.png().toFile('public/quantum-q-logo.png');
    console.log('Updated quantum-q-logo.png');

    // Generate favicons and icons
    await img.resize(16, 16).png().toFile('public/favicon-16x16.png');
    await img.resize(32, 32).png().toFile('public/favicon-32x32.png');
    await img.resize(48, 48).png().toFile('public/favicon-48x48.png');
    await img.resize(192, 192).png().toFile('public/icon-192.png');
    await img.resize(512, 512).png().toFile('public/icon-512.png');
    await img.resize(180, 180).png().toFile('public/apple-touch-icon.png');
    await img.resize(32, 32).png().toFile('public/favicon.png');
    await img.resize(1200, 630, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } }).png().toFile('public/quantum-ai-og.png');

    // Also overwrite favicon.ico with the 32x32 png (simplest approach)
    fs.copyFileSync('public/favicon-32x32.png', 'public/favicon.ico');
    
    console.log('All icons generated successfully.');
  } catch (err) {
    console.error('Error generating logos:', err);
  }
}

updateLogos();
