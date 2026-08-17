const fs = require('fs');
const https = require('https');
const path = require('path');

const svgUrl = 'https://raw.githubusercontent.com/svg-maps/svg-world-map/master/world.svg';

https.get(svgUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Simple conversion to React component
        let reactComponent = import React from 'react';

export default function WorldMapSVG(props) {
  return (
     + data
    .replace(/<svg/g, '<svg {...props}')
    .replace(/xmlns:cc="[^"]*"/g, '')
    .replace(/xmlns:dc="[^"]*"/g, '')
    .replace(/xmlns:rdf="[^"]*"/g, '')
    .replace(/xmlns:svg="[^"]*"/g, '')
    .replace(/xmlns:sodipodi="[^"]*"/g, '')
    .replace(/xmlns:inkscape="[^"]*"/g, '')
    .replace(/class=/g, 'className=')
    .replace(/stroke-width=/g, 'strokeWidth=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
    .replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/fill-opacity=/g, 'fillOpacity=')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-path=/g, 'clipPath=')
    .replace(/clip-rule=/g, 'clipRule=')
    .replace(/<!--[\s\S]*?-->/g, '') + 
  );
};
        
        fs.writeFileSync(path.join(__dirname, '../components/WorldMapSVG.tsx'), reactComponent);
        console.log('Successfully created components/WorldMapSVG.tsx');
    });
}).on('error', err => {
    console.error('Error downloading SVG: ', err.message);
});
