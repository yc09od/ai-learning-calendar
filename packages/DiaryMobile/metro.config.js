const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');
const sharedPkg = path.resolve(monorepoRoot, 'packages/shared');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [monorepoRoot, sharedPkg],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@diary/shared': sharedPkg,
    },
    unstable_enableSymlinks: true,
  },
});
