module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|react-native-svg|react-native-css-interop|nativewind)/)',
  ],
};
