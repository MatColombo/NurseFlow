import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage', 'indexedDB'],
      'no-restricted-imports': ['error', { patterns: [
        { group: ['react', 'react/**', 'react-dom', 'react-dom/**', 'react-router*', 'dexie', 'dexie/**', '@app/*', '@features/*', '@shared/*', '@storage/*', '**/app/**', '**/features/**', '**/shared/**', '**/storage/**'], message: 'Il dominio deve restare puro e indipendente da UI e persistenza.' },
      ] }],
    },
  },
  {
    files: ['src/storage/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['react', 'react/**', 'react-dom', 'react-dom/**', '@app/*', '@features/*', '@shared/components/*', '**/app/**', '**/features/**', '**/shared/components/**'], message: 'La persistenza non importa componenti React.' },
      ] }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/shared/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['dexie', 'dexie/**', '@storage/db', '@storage/db.*', '**/storage/db', '**/storage/db.*'], message: 'Usare repository e comandi; nessun accesso diretto al DB dalla UI.' },
      ] }],
    },
  },
);
