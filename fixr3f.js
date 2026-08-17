const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(f => {
    const full = dir + '/' + f;
    if (fs.statSync(full).isDirectory()) results = results.concat(walk(full));
    else results.push(full);
  });
  return results;
}

const files = walk('components/3d').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = content;

  // Remove the old eslint-disable we added for EarthNode (not needed anymore)
  modified = modified.replace(/\/\/ eslint-disable-next-line @typescript-eslint\/ban-ts-comment\n\s*\/\/ @ts-expect-error R3F line element conflicts with SVG line type\n/g, '');

  // Replace <line ref={...} geometry={...}> with @ts-ignore suppressed version
  modified = modified.replace(
    /(\s*)(<line\s)/g,
    (match, indent, tag) => `${indent}{ /* @ts-ignore */ }\n${indent}${tag}`
  );

  if (content !== modified) {
    fs.writeFileSync(file, modified, 'utf8');
    console.log('Processed:', file);
  }
});
