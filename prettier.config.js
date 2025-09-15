/** @type {import('prettier').Config} */
export default {
  semi: true,
  trailingComma: 'es5',
  singleQuote: false,
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './packages/config/tailwind.config.js',
  tailwindFunctions: ['cn', 'clsx'],
};