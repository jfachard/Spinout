const fs = require('fs');
const path = require('path');
const Module = require('module');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

function findTailwindRoot() {
  const candidates = [
    path.join(projectRoot, 'node_modules/tailwindcss'),
    path.join(monorepoRoot, 'node_modules/tailwindcss'),
  ];

  for (const candidate of candidates) {
    const pkgPath = path.join(candidate, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const version = require(pkgPath).version;
    if (version.startsWith('3.')) return candidate;
  }

  throw new Error(
    'NativeWind needs tailwindcss v3 (app/mobile or monorepo root node_modules).',
  );
}

const tailwindRoot = findTailwindRoot();

const hookFlag = `--require ${path.resolve(__dirname, 'tailwind-resolve.cjs')}`;
if (!process.env.NODE_OPTIONS?.includes('tailwind-resolve.cjs')) {
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS
    ? `${process.env.NODE_OPTIONS} ${hookFlag}`
    : hookFlag;
}

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'tailwindcss' || request.startsWith('tailwindcss/')) {
    const subpath = request === 'tailwindcss' ? '' : request.slice('tailwindcss'.length);
    return resolveFilename.call(this, tailwindRoot + subpath, parent, isMain, options);
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

module.exports = { tailwindRoot };
