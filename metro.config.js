const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // The bundled whisper.rn speech model (models/ggml-base-q5_1.bin) is
    // loaded via require(), so Metro needs to treat .bin as a static asset.
    assetExts: [...defaultConfig.resolver.assetExts, 'bin'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
