const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch monorepo packages
config.watchFolders = [monorepoRoot];

// Resolve from root node_modules first (prevents local duplicates)
config.resolver.nodeModulesPaths = [
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// Hard-pin React family to a single root copy — eliminates "multiple React" crash
const PINNED = ['react', 'react-native', 'react-dom', 'react-native/Libraries/Renderer/implementations'];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const pkg of PINNED) {
    if (moduleName === pkg || moduleName.startsWith(pkg + '/')) {
      const rest = moduleName.slice(pkg.length);
      const target = path.resolve(monorepoRoot, 'node_modules', pkg + rest);
      try {
        return { filePath: require.resolve(target), type: 'sourceFile' };
      } catch (_) {}
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
