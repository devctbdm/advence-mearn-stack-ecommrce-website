import js from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginSecurity from 'eslint-plugin-security';

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/'],
  },

  // Base recommended rules
  js.configs.recommended,

  // Security plugin
  pluginSecurity.configs.recommended,

  // Main config
  {
    plugins: {
      prettier: pluginPrettier,
      security: pluginSecurity,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // Prettier integration — all formatting is Prettier's job
      'prettier/prettier': 'error',

      // Logic rules (safe to keep alongside Prettier)
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },

  // Jest test files
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  },
];
