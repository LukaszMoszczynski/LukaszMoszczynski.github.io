import { execFileSync } from 'node:child_process';

/**
 * Vitest runs Astro in "serve" mode, which reads the content data store from
 * `.astro/` (the dev location). `astro sync` writes it to `cacheDir`, so sync
 * once with `cacheDir` pointed at `.astro/` before the unit tests run. A child
 * Node process is used because Vite resolves the `astro` package to its
 * client entry inside the test runner.
 */
export default function setup(): void {
  const script = "import('astro').then((astro) => astro.sync({ cacheDir: './.astro/', logLevel: 'error' }))";
  execFileSync(process.execPath, ['--input-type=module', '-e', script], { stdio: 'inherit' });
}
