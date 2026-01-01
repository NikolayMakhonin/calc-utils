import { defineConfig, mergeConfig } from 'vitest/config'
import configNode from './vitest.node'
import configBrowser from './vitest.browser'

export default defineConfig(env =>
  mergeConfig(configNode(env), configBrowser(env)),
)
