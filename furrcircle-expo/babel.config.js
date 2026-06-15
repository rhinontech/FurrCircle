module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // unstable_transformImportMeta: rewrite `import.meta` (used by some deps via
      // `import.meta.env`) to a runtime registry so the web/Hermes bundle doesn't ship
      // raw `import.meta`, which throws "Cannot use 'import.meta' outside a module".
      ["babel-preset-expo", { jsxImportSource: "nativewind", unstable_transformImportMeta: true }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin"
    ],
  };
};
