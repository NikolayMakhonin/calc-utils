import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Node.js
  // 'vite.config.ts',

  // Chrome
  {
    extends: 'vitest.browser.base.ts',
    test: {
      name: 'chromium',
      browser: {
        name: 'chromium',
      },
    },
  },

  // // Firefox
  // {
  //   extends: 'vitest.browser.base.ts',
  //   test: {
  //     name: 'firefox',
  //     include: ['**/*.{test,browser}.{js,ts}'],
  //     browser: {
  //       enabled: true,
  //       name: 'firefox',
  //       provider: 'playwright',
  //     },
  //   },
  // },
  //
  // // Safari
  // {
  //   extends: 'vitest.browser.base.ts',
  //   test: {
  //     name: 'webkit',
  //     include: ['**/*.{test,browser}.{js,ts}'],
  //     browser: {
  //       enabled: true,
  //       name: 'webkit',
  //       provider: 'playwright',
  //     },
  //   },
  // },
])
