const { netpostTailwindConfig } = require("./dist/index.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  ...netpostTailwindConfig,
  plugins: [require("tailwindcss-animate")],
};