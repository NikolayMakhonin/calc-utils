import { defineConfig, mergeConfig } from 'vitest/config'
import configBase from './vite.config'

export default defineConfig(env =>
  mergeConfig(configBase(env), {
    test: {
      include: [
        '**/*.{test,node}.{js,ts}',
        '!**/*.{browser,perf,manual,api,e2e}.{js,ts}',
      ],
      projects: [
        {
          test: {
            name: {
              label: 'node',
              // color: 'blue',
            },
          },
        },
      ],
    },
  }),
)
