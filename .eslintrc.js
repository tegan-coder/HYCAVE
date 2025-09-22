module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest",
  },
  overrides: [],
  rules: {},
  globals: {
    $: true,
    switchView: true,
    currentView: true,
    bodymovin: true,
    __dirname: true,
  },
};
