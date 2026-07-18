import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['extension/.wxt/**', 'extension/.output/**'],
  rules: {
    'vue/multi-word-component-names': 'off'
  }
})
