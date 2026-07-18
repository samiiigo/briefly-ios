import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat';
import prettier from 'eslint-config-prettier';

/** Expo / React Native — keep eslint-config-expo, disable conflicting Prettier rules. */
export default defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ['dist/*', '.expo/*', 'android/**', 'ios/**'],
  },
]);
