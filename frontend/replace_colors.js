const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components', 'website');

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(file => {
    file = path.join(directory, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(dir);

let replacements = [
  { from: /\[#2563EB\]/g, to: 'brand' },
  { from: /\[#7C3AED\]/g, to: 'ai' },
  { from: /\[#EFF6FF\]/g, to: 'brand-50' },
  { from: /\[#BFDBFE\]/g, to: 'brand-100' },
  { from: /\[#F5F3FF\]/g, to: 'ai-50' },
  { from: /\[#EDE9FE\]/g, to: 'ai-100' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  replacements.forEach(r => {
    newContent = newContent.replace(r.from, r.to);
  });
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated:', file);
  }
});
