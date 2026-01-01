import { defineConfig } from 'vitest/config'

export default defineConfig({
  extends: './vitest.config.ts',
  test: {
    name: 'unknown',
    include: ['**/*.{test,browser}.{js,ts}'],
    coverage: {
      // vitest исключает файлы тестов, принудитеьно возвращаем их обратно
      exclude: ['!**/*.{test,browser}.{js,ts}', '**/{tmp,temp,-tmp,-temp}/**'],
    },
    browser: {
      name: 'unknown',
      enabled: true,
      provider: 'playwright',
    },
  },
})
