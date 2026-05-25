import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, 'templates');

async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  let changed = false;

  // We only care about relative imports going UP (e.g., ../ or ../../)
  // because those are the ones crossing major directories.
  const newContent = content.replace(/from\s+["'](\.\.\/[^"']+)["']/g, (match, relPath) => {
    // Determine the absolute directory of the current file
    const fileDir = path.dirname(filePath);
    
    // Resolve the absolute path of the imported file
    const absoluteImportPath = path.resolve(fileDir, relPath);
    
    // Find where 'src' is in the absolute import path
    const srcIndex = absoluteImportPath.lastIndexOf(path.sep + 'src' + path.sep);
    
    if (srcIndex !== -1) {
      // Extract everything after 'src/'
      let subPath = absoluteImportPath.substring(srcIndex + 5);
      
      // Convert Windows backslashes to forward slashes for imports
      subPath = subPath.replace(/\\/g, '/');
      
      changed = true;
      return `from "#${subPath}"`;
    }
    
    return match;
  });

  if (changed) {
    await fs.writeFile(filePath, newContent);
    console.log(`Updated: ${path.relative(__dirname, filePath)}`);
  }
}

async function walk(dir) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await walk(fullPath);
    } else if (/\.(js|ts|ejs)$/.test(file)) {
      await processFile(fullPath);
    }
  }
}

walk(templatesDir).then(() => console.log('Done mapping aliases!'));
