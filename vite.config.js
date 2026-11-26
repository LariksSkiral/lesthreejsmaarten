import { defineConfig } from 'vite';

// The ":" in the project folder path trips Vite's fs allow-list check (403),
// so disable strict mode for local dev.
export default defineConfig({
  server: { fs: { strict: false } },
});
