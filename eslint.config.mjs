// Import Third-party Dependencies
import {
  typescriptConfig,
  ESLintConfig,
  globals
} from "@openally/config.eslint";

export default [
  ...ESLintConfig,
  {
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    }
  },
  ...typescriptConfig()
];
