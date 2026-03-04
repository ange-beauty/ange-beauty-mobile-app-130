const fs = require('fs');
const path = require('path');

const root = process.cwd();
const source = path.join(root, 'public', 'turnstile-widget.html');
const distDir = path.join(root, 'dist');
const destination = path.join(distDir, 'turnstile-widget.html');

if (!fs.existsSync(source)) {
  console.error(`[post-export-web] Missing source file: ${source}`);
  process.exit(1);
}

if (!fs.existsSync(distDir)) {
  console.error(`[post-export-web] Missing dist directory: ${distDir}`);
  process.exit(1);
}

fs.copyFileSync(source, destination);
console.log(`[post-export-web] Copied ${source} -> ${destination}`);

