import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/** Shared base rules for packages and non-Expo apps. */
export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/.next/**', '**/.expo/**', '**/node_modules/**'],
  },
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
