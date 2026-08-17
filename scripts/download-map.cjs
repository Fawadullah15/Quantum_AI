const fs = require('fs');
const https = require('https');
const path = require('path');

const svgUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg';

https.get(svgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        let cleanData = data
            .replace(/<\?xml[\s\S]*?\?>/g, '')
            .replace(/<!DOCTYPE[\s\S]*?>/g, '')
            .replace(/<metadata[\s\S]*?<\/metadata>/g, '')
            .replace(/<defs[\s\S]*?<\/defs>/g, '')
            .replace(/<sodipodi:namedview[\s\S]*?\/>/g, '')
            .replace(/<svg[\s\S]*?>/, '<svg viewBox="0 0 1000 500" {...props}>')
            .replace(/id="[^"]*"/g, '')
            .replace(/style="[^"]*"/g, '') // we will style it with CSS
            .replace(/class="[^"]*"/g, '')
            .replace(/xmlns:[a-z]+="[^"]*"/g, '')
            .replace(/ [a-z]+:[a-z-]+="[^"]*"/g, (match) => {
                if (match.includes('xlink:href')) return match;
                return '';
            })
            .replace(/d="m/g, 'd="M') // Ensure standard paths
            .replace(/<!--[\s\S]*?-->/g, '');

        let reactComponent = `import React from 'react';\n\nexport default function WorldMapSVG(props: React.SVGProps<SVGSVGElement>) {\n  return (\n    ${cleanData}\n  );\n}`;
        
        fs.writeFileSync(path.join(__dirname, '../components/WorldMapSVG.tsx'), reactComponent);
        console.log('Successfully created components/WorldMapSVG.tsx');
    });
});
