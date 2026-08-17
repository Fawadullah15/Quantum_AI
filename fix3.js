const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('app').filter(f => f.endsWith('route.ts') || f.endsWith('route.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = content;

  if (content.includes('params: Promise<')) {
    modified = modified.replace(/\bparams\.(id|slug)\b/g, '(await params).$1');
    // Fix context.params.id -> (await context.params).id
    modified = modified.replace(/context\.params\.(id|slug)\b/g, '(await context.params).$1');
  }

  if (content !== modified) {
    fs.writeFileSync(file, modified, 'utf8');
    console.log('Fixed route:', file);
  }
});
