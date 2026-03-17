import StyleDictionary from 'style-dictionary';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

// --- Token validation ---

function isLeafToken(obj) {
  return typeof obj === 'object' && obj !== null && ('$value' in obj || '$type' in obj);
}

function validateTokens(obj, path = []) {
  const errors = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const currentPath = [...path, key];
    if (isLeafToken(value)) {
      if (!('$value' in value)) {
        errors.push(`Token "${currentPath.join('.')}" is missing required "$value" field`);
      }
      if (!('$type' in value)) {
        errors.push(`Token "${currentPath.join('.')}" is missing required "$type" field`);
      }
    } else if (typeof value === 'object' && value !== null) {
      errors.push(...validateTokens(value, currentPath));
    }
  }
  return errors;
}

function validateAllTokenFiles(dir) {
  const errors = [];
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      errors.push(...validateAllTokenFiles(fullPath));
    } else if (file.endsWith('.json')) {
      const content = JSON.parse(readFileSync(fullPath, 'utf-8'));
      const fileErrors = validateTokens(content);
      errors.push(...fileErrors.map(e => `${fullPath}: ${e}`));
    }
  }
  return errors;
}

const tokensDir = resolve(process.cwd(), 'tokens');
const validationErrors = validateAllTokenFiles(tokensDir);
if (validationErrors.length > 0) {
  console.error('Token validation failed:');
  validationErrors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

// --- Style Dictionary build ---

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  usesDtcg: true,
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'angular-app/src/styles/',
      files: [
        {
          destination: '_tokens.css',
          format: 'css/variables',
          options: {
            selector: ':root',
            outputReferences: true
          }
        }
      ]
    }
  }
});

await sd.buildAllPlatforms();
