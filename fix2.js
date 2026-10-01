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

const files = walk('app').filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = content;

  // Fix generateMetadata and page functions that have params: Promise<{...}>
  // Pattern: function signature has Promise params but body uses params.slug or params.id directly
  // Replace "params.slug" with "(await params).slug" etc. only when params is typed as Promise
  if (content.includes('params: Promise<')) {
    // Fix params.slug -> (await params).slug
    modified = modified.replace(/\bparams\.(slug|id)\b(?!\s*\))/g, '(await params).$1');
  }

  if (content !== modified) {
    fs.writeFileSync(file, modified, 'utf8');
    console.log('Fixed await params in', file);
  }
});
