import globals from 'globals';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2024,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-undef': 'error',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-return-await': 'error',
      'require-await': 'error',
      'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'max-lines': ['error', 500],
      'complexity': ['warn', 25],
      'max-depth': ['warn', 4],
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-template': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'no-throw-literal': 'error',
      'handle-callback-err': 'warn',
      'no-shadow': 'warn',
      'no-use-before-define': ['error', { 
        'functions': false,
        'classes': true,
        'variables': true,
      }],
    },
  },
];