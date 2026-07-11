const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'public');
const destDir = path.join(__dirname, 'furrcircle-expo', 'public');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) {
    console.error(`Source directory does not exist: ${from}`);
    return;
  }
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }

  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);

    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
      console.log(`Copied: ${element}`);
    }
  });
}

console.log('Starting copy of assets...');
copyFolderSync(srcDir, destDir);
console.log('Copy complete! All landing page assets are now in furrcircle-expo.');
