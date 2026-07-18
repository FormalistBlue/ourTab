import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: {
    name: 'ourTab 新标签页',
    short_name: 'ourTab',
    description: '让常用的东西，回到它该在的位置。',
    version: '1.0.0',
    permissions: [],
    chrome_url_overrides: {
      newtab: 'newtab.html'
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png'
    }
  }
})
