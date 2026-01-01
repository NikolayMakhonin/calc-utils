import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // This will keep running your existing tests.
  // If you don't need to run those in Node.js anymore,
  // You can safely remove it from the workspace file
  // Or move the browser test configuration to the config file.
  'vite.config.ts',
  {
    extends: 'vite.config.ts',
    // server: {
    //   port: 4001,
    //   strictPort: true,
    // },
    test: {
      exclude: ['**/*.{test,manual,api,e2e}.{js,ts}'],
      include: ['**/*.chrome.{js,ts}', '!**/{tmp,temp,-tmp,-temp}/**'],
      name: 'browser',
      browser: {
        enabled: true,
        name: 'chrome',
        // note: to enable incognito mode, you should these vars in .env.local:
        // BROWSER=C:\Program Files\Google\Chrome\Application\chrome.exe
        // BROWSER_ARGS=--incognito
        // see: https://v4.vitejs.dev/config/server-options.html#server-open
        // see: https://github.com/vitest-dev/vitest/blob/main/packages/browser/src/node/providers/preview.ts#L40
        // see: this.ctx.browser.vite.openBrowser()
        api: {
          port: 4001,
        },
      },
    },
    server: {
      headers: {
        // Increase performance.now() precision
        // (This way doesn't work)
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  },
])
