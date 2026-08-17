const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure Metro watches all source files for Fast Refresh
config.watchFolders = [__dirname];

module.exports = withNativeWind(config, {
  input: "./src/global.css",
  inlineRem: 16,
});
