export const baseEslintConfig = {
  extends: ["eslint:recommended", "@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error",
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
};

export const nextEslintConfig = {
  ...baseEslintConfig,
  extends: [...baseEslintConfig.extends, "next/core-web-vitals"],
  rules: {
    ...baseEslintConfig.rules,
    "react/no-unescaped-entities": "off",
    "@next/next/no-page-custom-font": "off",
  },
  parserOptions: {
    ...baseEslintConfig.parserOptions,
    ecmaFeatures: {
      jsx: true,
    },
  },
};
