// ESLint (flat config) — `npx eslint .` ile çalıştırın.
const browser = Object.fromEntries([
  'window', 'document', 'navigator', 'location', 'localStorage', 'performance', 'console',
  'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'getComputedStyle', 'matchMedia', 'URL', 'URLSearchParams', 'Event', 'EventTarget', 'fetch', 'Response', 'Request',
  'caches', 'self', 'clients', 'AudioContext',
].map(n => [n, 'readonly']));

export default [
  { ignores: ['node_modules/**', 'dist/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: browser },
    rules: {
      'no-undef': 'error',
      'no-import-assign': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
    },
  },
  { files: ['sw.js'], languageOptions: { sourceType: 'script' } },
];
