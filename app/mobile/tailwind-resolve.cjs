const path = require('path');
const Module = require('module');

const mobileTailwind = path.resolve(__dirname, 'node_modules/tailwindcss');
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
    return resolveFilename.call(this, mobileTailwind + subpath, parent, isMain, options);
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};
