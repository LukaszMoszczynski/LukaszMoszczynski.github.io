/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: { include: ['tests/unit/**/*.test.ts'], globalSetup: ['tests/unit/content-setup.ts'] },
});
