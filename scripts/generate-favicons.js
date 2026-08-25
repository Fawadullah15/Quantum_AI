const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const sourceImage = path.join(__dirname, '../public/quantum-q-logo.png');
  const publicDir = path.join(__dirname, '../public');
  const appDir = path.join(__dirname, '../app');

  console.log('Generating Quantum AI favicons and app icons from:', sourceImage);

  // Read metadata
  const metadata = await sharp(sourceImage).metadata();
  const maxDim = Math.max(metadata.width, metadata.height);

  // Create a clean square image with transparent padding
  const squareBuffer = await sharp(sourceImage)
    .resize(maxDim, maxDim, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const sizes = [
    { size: 16, file: 'favicon-16x16.png', dir: publicDir },
    { size: 32, file: 'favicon-32x32.png', dir: publicDir },
    { size: 32, file: 'favicon.png', dir: publicDir },
    { size: 48, file: 'favicon-48x48.png', dir: publicDir },
    { size: 180, file: 'apple-touch-icon.png', dir: publicDir },
    { size: 192, file: 'icon.png', dir: publicDir },
    { size: 192, file: 'icon-192.png', dir: publicDir },
    { size: 512, file: 'icon-512.png', dir: publicDir },
    { size: 32, file: 'icon.png', dir: appDir },
  ];

  for (const item of sizes) {
    const outputPath = path.join(item.dir, item.file);
    await sharp(squareBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${outputPath} (${item.size}x${item.size})`);
  }

  // Generate .ico (32x32 raw ICO or PNG-encoded ICO)
  const ico32Buffer = await sharp(squareBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32Buffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), ico32Buffer);
  console.log('Generated favicon.ico in public/ and app/');

  console.log('All Quantum AI icons generated successfully!');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
