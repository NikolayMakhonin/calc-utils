import { defineConfig, mergeConfig } from 'vitest/config'
import configBase from './vite.config'

export default defineConfig(env =>
  mergeConfig(configBase(env), {
    test: {
      include: [
        '**/*.{test,browser}.{js,ts}',
        '!**/*.{node,perf,manual,api,e2e}.{js,ts}',
      ],
      browser: {
        name: 'unknown',
        enabled: true,
        provider: 'playwright',
        headless: true,
      },
      projects: [
        {
          name: {
            label: 'browser',
            // color: 'green',
          },
          test: {
            name: 'chrome',
            browser: {
              name: 'chromium',
            },
          },
        },
        {
          name: {
            label: 'firefox',
            // color: 'orange',
          },
          test: {
            name: 'firefox',
            browser: {
              name: 'firefox',
            },
          },
        },
        {
          name: {
            label: 'safari',
            // color: 'purple',
          },
          test: {
            name: 'webkit',
            browser: {
              name: 'webkit',
            },
          },
        },
      ],
    },
  }),
)
