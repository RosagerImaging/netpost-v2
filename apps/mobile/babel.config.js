module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-react',
      ['@babel/preset-typescript', { allowDeclareFields: true }],
    ],
    plugins: [
      '@babel/plugin-transform-flow-strip-types',
    ],
  };
};