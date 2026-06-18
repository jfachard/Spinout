const path = require('path');

const { tailwindRoot } = require('./tailwind-resolve.cjs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.resolve(monorepoRoot, 'packages/shared')];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.blockList = [/app[\\/]web[\\/].*/];
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  tailwindcss: tailwindRoot,
};

module.exports = withNativeWind(config, {
  input: './global.css',
  configPath: path.resolve(projectRoot, 'tailwind.config.js'),
});
