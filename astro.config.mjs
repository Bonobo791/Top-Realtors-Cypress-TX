import { defineConfig } from 'astro/config';
import { lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import site from './src/content/site.json' with { type: 'json' };
// Astro empties the output before rendering; reject symlinks before that cleanup.
if (
  lstatSync(fileURLToPath(new URL('./dist', import.meta.url)), {
    throwIfNoEntry: false,
  })?.isSymbolicLink()
)
  throw new Error('Refusing a symlinked build output directory');
if (
  site.origin !== 'https://toprealtorscypresstx.com' ||
  typeof site.indexing !== 'boolean'
)
  throw new Error('Invalid site configuration');
export default defineConfig({
  site: site.origin,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
