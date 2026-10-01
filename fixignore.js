const fs = require('fs');

const files = [
  'components/3d/scenes/EarthNode.tsx',
  'components/3d/scenes/LeadershipCore.tsx',
  'components/3d/scenes/PremiumGlobe.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/\{\/\* @ts-ignore \*\/\}/g, '{/* @ts-expect-error */}');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed ignore in', file);
  }
});
