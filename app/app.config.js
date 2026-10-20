// GitHub Pages alt dizini için: EXPO_BASE_URL=/risale-takip npx expo export -p web
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL },
});
