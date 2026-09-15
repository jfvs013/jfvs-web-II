import js from "@eslint/js";

export default [
  {
    ignores: ["node_modules/**", "generated/**", "coverage/**", "dist/**"],
  },

  js.configs.recommended,

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },

    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];
