module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    overrides: [
      {
        // Include @fastshot/ai packages for env var inlining
        include: /node_modules\/@fastshot\/ai/,
        plugins: [
          [
            'transform-inline-environment-variables',
            {
              include: [
                'EXPO_PUBLIC_GEMINI_API_KEY',
              ],
            },
          ],
        ],
      },
    ],
  };
};
