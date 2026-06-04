// ESLint para análisis estático de SIDEM-PAN backend.
// Objetivo: medir complejidad ciclomática y detectar code smells / vulnerabilidades.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'security'],
  extends: ['plugin:security/recommended-legacy'],
  env: { node: true, es2020: true },
  rules: {
    // Reporta la complejidad ciclomática de CADA función (umbral McCabe = 10)
    complexity: ['warn', 10],
    // Code smells estructurales
    'max-lines-per-function': ['warn', { max: 50, skipComments: true, skipBlankLines: true }],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 4],
    'no-duplicate-imports': 'warn',
  },
  overrides: [
    {
      // El acceso por clave dinámica en los mocks de prueba es intencional,
      // no un hallazgo de seguridad de producción.
      files: ['**/*.test.ts'],
      rules: { 'security/detect-object-injection': 'off' },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '*.cjs'],
};
