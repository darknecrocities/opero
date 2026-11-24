import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@opero/shared-types': path.resolve(__dirname, 'packages/shared-types/src/index.ts'),
      '@opero/document-schema': path.resolve(__dirname, 'packages/document-schema/src/index.ts'),
      '@opero/i18n': path.resolve(__dirname, 'packages/i18n/src/index.ts'),
      '@opero/jiggicons': path.resolve(__dirname, 'packages/jiggicons/src/index.ts'),
      '@opero/mascot': path.resolve(__dirname, 'packages/mascot/src/index.ts'),
    },
  },
  test: {
    include: ['tests/vitest/**/*.test.ts'],
    environment: 'node',
  },
});
