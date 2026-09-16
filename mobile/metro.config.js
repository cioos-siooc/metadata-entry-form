// Metro in an npm workspace. Without this, Metro only watches `mobile/` and
// silently fails to resolve @cioos/shared, which lives one level up.
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so edits in shared/ trigger a reload.
config.watchFolders = [workspaceRoot];

// Resolve from the app first, then the hoisted root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// npm hoists to the root, so a package missing from mobile/node_modules is
// normal rather than a signal to walk further up the filesystem.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
