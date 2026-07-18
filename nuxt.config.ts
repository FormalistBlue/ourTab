// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-07-18',
  ssr: false,
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@pinia/nuxt', 'nuxt-auth-utils', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databasePath: process.env.NUXT_DATABASE_PATH || './data/ourtab.db',
    uploadsDir: process.env.NUXT_UPLOADS_DIR || './uploads',
    setupToken: process.env.NUXT_SETUP_TOKEN || '',
    public: {
      appName: 'ourTab'
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'ourTab',
      meta: [
        { name: 'description', content: '安静、快速、属于自己的新标签页。' },
        { name: 'theme-color', content: '#17231f' },
        { name: 'color-scheme', content: 'dark' }
      ]
    }
  },
  devServer: { port: 3303 },
  nitro: { preset: 'node-server' },
  routeRules: {
    '/api/**': { headers: { 'cache-control': 'private, no-store' } },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/uploads/**': { headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=86400' } }
  },
  typescript: {
    strict: true,
    typeCheck: true
  },
  vite: {
    worker: { format: 'es' }
  }
})
