import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const output = path.join(root, 'dist');

const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
};

async function copySource(current, target) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  await fs.mkdir(target, { recursive: true });

  for (const entry of entries) {
    if (['dist', 'node_modules', 'scripts', '.env', '.gitignore', 'package.json', 'package-lock.json', 'vercel.json'].includes(entry.name)) continue;
    const sourcePath = path.join(current, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copySource(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function shouldObfuscateInline(attrs, body) {
  if (/\bsrc\s*=|application\/ld\+json|type\s*=\s*["']importmap/i.test(attrs)) return false;
  const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
  return (!type || type === 'text/javascript' || type === 'module') && body.trim().length > 0;
}

function obfuscateJavaScript(source, sourceName) {
  return JavaScriptObfuscator.obfuscate(source, {
    ...obfuscatorOptions,
    inputFileName: sourceName,
    sourceMap: false
  }).getObfuscatedCode();
}

async function processJavaScript(filePath) {
  const source = await fs.readFile(filePath, 'utf8');
  await fs.writeFile(filePath, obfuscateJavaScript(source, path.basename(filePath)), 'utf8');
}

async function processHtml(filePath) {
  const source = await fs.readFile(filePath, 'utf8');
  const result = source.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, body) => {
    if (!shouldObfuscateInline(attrs, body)) return full;
    try {
      return `<script${attrs}>${obfuscateJavaScript(body, path.basename(filePath))}</script>`;
    } catch (error) {
      throw new Error(`Could not obfuscate inline script in ${filePath}: ${error.message}`);
    }
  });
  await fs.writeFile(filePath, result, 'utf8');
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(filePath);
    } else if (entry.name.endsWith('.js')) {
      await processJavaScript(filePath);
    } else if (entry.name.endsWith('.html')) {
      await processHtml(filePath);
    }
  }
}

await fs.rm(output, { recursive: true, force: true });
await copySource(root, output);
await walk(output);
console.log(`PeaceFlow production build created at ${output}`);
