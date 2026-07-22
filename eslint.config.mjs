import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    // Browser React app (src/, scripts/, etc.). Firebase functions are Node
    // CommonJS and are handled by their own block below.
    files: ["**/*.{js,jsx}"],
    ignores: ["firebase-functions/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx"],
        },
      },
    },
    rules: {
      // React rules
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Not needed with React 17+
      "react/prop-types": "off",
      "react/no-array-index-key": "off",
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",

      // General rules
      "no-console": "off",
      "comma-dangle": ["error", "always-multiline"],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^React$" }],

      // Import rules
      "import/no-unresolved": "off", // Vite handles resolution
      "import/extensions": "off",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Firebase Cloud Functions: Node CommonJS, no React.
    files: ["firebase-functions/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Jest test files within firebase-functions.
    files: [
      "firebase-functions/**/*.test.js",
      "firebase-functions/**/test/**/*.js",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    ignores: [
      "build/**",
      "dist/**",
      "node_modules/**",
      "**/node_modules/**",
      "cioos-records-update/**",
      ".venv/**",
      "**/.venv/**",
      "src/serviceWorker.js",
      "src/**/__tests__/*.test*",
    ],
  },
  prettier, // Must be last to override other formatting rules
];
