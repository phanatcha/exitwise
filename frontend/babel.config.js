module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 setup: jsxImportSource on babel-preset-expo + nativewind/babel preset.
    // react-native-worklets/plugin MUST be last (required by Reanimated v4).
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};
