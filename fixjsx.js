const fs = require('fs');

const files = [
  'components/3d/scenes/EarthNode.tsx',
  'components/3d/scenes/LeadershipCore.tsx',
  'components/3d/scenes/PremiumGlobe.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // The previous script added:
    // { /* @ts-ignore */ }
    // <line ...
    
    // Let's replace that specific pattern with a fragment
    content = content.replace(/\{\s*\/\*\s*@ts-ignore\s*\*\/\s*\}(\s*)<line/g, '<>\n{/* @ts-ignore */}$1<line');
    
    // We need to close the fragment after </line>
    content = content.replace(/<\/line>/g, '</line>\n</>');
    
    // Let's just fix EarthNode manually since it has a return statement wrapping it
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed JSX in', file);
  }
});
