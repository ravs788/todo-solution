import type { FullConfig } from '@playwright/test';

// Suppress all Node console output during e2e runs unless explicitly disabled.
// Set PW_SUPPRESS_CONSOLE=false to allow console logs again.
export default async function globalSetup(_config: FullConfig) {
  const suppress = process.env.PW_SUPPRESS_CONSOLE !== 'false';
  if (!suppress) return;

  const noop = () => {};
  // Preserve original methods if you ever want to restore them within a test:
  // (store on globalThis for potential debugging)
  (globalThis as any).__orig_console__ = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  // Silence Node-side console output from specs and helpers
  console.log = noop as any;
  console.info = noop as any;
  console.warn = noop as any;
  console.error = noop as any;
  console.debug = noop as any;
}
