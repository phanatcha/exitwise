// Learn more: https://docs.expo.dev/guides/customizing-metro/
// NativeWind v4 requires withNativeWind — without it, `import "./global.css"`
// is parsed as JS and crashes Metro with a SyntaxError at line 0.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
