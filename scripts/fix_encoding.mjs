
import fs from 'fs';
import path from 'path';

const files = [
  'components/layout/SoundToggle.tsx',
  'components/ui/Buttons.tsx',
  'components/layout/Navigation.tsx',
  'app/(public)/contact/page.tsx',
  'styles/quantum-foundation.css',
  'app/(public)/leadership/[slug]/page.tsx'
];

for (const file of files) {
  try {
    const fullPath = path.resolve(file);
    const buffer = fs.readFileSync(fullPath);
    
    // Check for UTF-16 LE BOM (FF FE) or null bytes indicating UTF-16
    const isUTF16LE = (buffer[0] === 0xFF && buffer[1] === 0xFE) || buffer.includes(0x00);
    
    if (isUTF16LE) {
      console.log('Fixing ' + file + ' (detected UTF-16LE)');
      const content = fs.readFileSync(fullPath, 'utf16le');
      fs.writeFileSync(fullPath, content, 'utf8');
    } else {
      console.log(file + ' is already valid UTF-8/ASCII');
      // Just in case it has some other weird encoding, read/write as utf8
      const content = buffer.toString('utf8');
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  } catch (err) {
    console.error('Error processing ' + file + ':', err.message);
  }
}

