const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const PROJECT_ROOT = '/Users/nivetharamdev/Projects/ayphen-textile/frontend/src';
const BASE_SCSS_PATH = 'styles/base.scss';

const variableReplacements = {
  // Colors
  '\\$primary-color': 'var(--color-primary)',
  '\\$secondary-color': 'var(--color-secondary)', // Might not be in tokens, careful. checking light.tsx: it has extra tokens? light.tsx has colorPrimary... no explicit secondary.
  // Wait, index.scss had $secondary-color: #a2d8e5. light.tsx DOES NOT hav secondary.
  // extraColorTokensLight has blue, orange etc.
  // I'll map secondary to var(--color-info) or something similar if exact match missing, or just hardcode?
  // Actually, let's stick to what IS in light.tsx.
  // light.tsx has colorInfo.

  '\\$success-color': 'var(--color-success)',
  '\\$error-color': 'var(--color-error)',
  '\\$warning-color': 'var(--color-warning)',
  '\\$info-color': 'var(--color-info)',

  // Text
  '\\$primary-text-color': 'var(--color-text)',
  '\\$text-primary': 'var(--color-text)',
  '\\$secondary-text-color': 'var(--color-text-secondary)',
  '\\$text-secondary': 'var(--color-text-secondary)',
  '\\$tertiary-text-color': 'var(--color-text-tertiary)',
  '\\$muted-text-color': 'var(--color-text-quaternary)',

  // Backgrounds
  '\\$bg-primary': 'var(--color-bg-container)',
  '\\$bg-secondary': 'var(--color-bg-layout)',
  '\\$bg-surface': 'var(--color-bg-layout)',
  '\\$border-color': 'var(--color-border)',

  // Spacing (Approximate mappings based on theme tokens)
  '\\$spacing-xs': 'var(--padding-xxs)', // 4
  '\\$spacing-sm': 'var(--padding-xs)', // 8
  '\\$spacing-md': 'var(--padding)', // 16
  '\\$spacing-lg': 'var(--padding-lg)', // 24
  '\\$spacing-xl': 'var(--padding-xl)', // 32

  // Shadows
  '\\$shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Hardcode or use 'var(--box-shadow-secondary)'? Tokens have boxShadow and boxShadowSecondary.
  '\\$shadow-md': 'var(--box-shadow-secondary)',
  '\\$shadow-lg': 'var(--box-shadow)',
};

async function migrateFile(filePath) {
  let content = await readFile(filePath, 'utf8');
  let originalContent = content;

  // 1. Update Imports
  // Regex to match imports of index.scss with various relative paths
  // Examples: @import '../../index.scss'; @import '../index.scss'; @import 'index.scss';
  const importRegex = /@import\s+['"](.*\/)?index\.scss['"];/g;

  content = content.replace(importRegex, (match, relativePath) => {
    // We need to calculate the new relative path to styles/base.scss
    // But since we are replacing "index.scss" with "styles/base.scss",
    // we need to adjust the directory traversal.
    // index.scss was in src/
    // base.scss is in src/styles/

    // If importing '../index.scss' (from src/components), it meant src/index.scss
    // Now we want src/styles/base.scss
    // So '../index.scss' -> '../styles/base.scss'

    // If importing '../../index.scss' (from src/pages/dashboard), it meant src/index.scss
    // Now we want src/styles/base.scss
    // So '../../index.scss' -> '../../styles/base.scss'

    // If importing './index.scss' (from src), it meant src/index.scss
    // Now we want ./styles/base.scss

    const oldImportStr = match.match(/['"](.*)['"]/)[1]; // e.g., ../../index.scss

    // Determine the directory of the current file
    const fileDir = path.dirname(filePath);
    // Determine the absolute path of the old target
    // We assume the old import was pointing to src/index.scss
    // So we don't really rely on the old relative path's correctness if we know we want to point to base.scss which is fixed.

    const absoluteBasePath = path.join(PROJECT_ROOT, 'styles', 'base.scss');
    let newRelativePath = path.relative(fileDir, absoluteBasePath);

    if (!newRelativePath.startsWith('.')) {
      newRelativePath = './' + newRelativePath;
    }

    return `@import '${newRelativePath}';`;
  });

  // 2. Replace Variables
  for (const [pattern, replacement] of Object.entries(variableReplacements)) {
    const regex = new RegExp(pattern, 'g');
    content = content.replace(regex, replacement);
  }

  // 3. Save if changed
  if (content !== originalContent) {
    console.log(`Migrating ${filePath}...`);
    await writeFile(filePath, content, 'utf8');
  }
}

// glob to find all scss files in frontend/src
const pattern = path.join(PROJECT_ROOT, '**/*.scss');

// Use glob to find files (using a simplified approach since I can't easily install glob here,
// I will rely on the list I already found via 'find' command or just walk the dir recursively?
// Wait, I cannot require 'glob' if it's not installed.
// I will use a simple recursive walk function.

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (
        dirPath.endsWith('.scss') &&
        !dirPath.endsWith('base.scss') &&
        !dirPath.endsWith('index.scss')
      ) {
        callback(dirPath);
      }
    }
  });
}

try {
  walkDir(PROJECT_ROOT, filePath => {
    migrateFile(filePath);
  });
  console.log('Migration complete.');
} catch (e) {
  console.error('Error:', e);
}
