import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages phục vụ project site ở dạng subpath (https://<user>.github.io/<repo>/),
  // nên asset phải build với base đúng tên repo. Dev/preview local vẫn chạy ở "/" bình thường.
  base: process.env.GITHUB_PAGES === 'true' ? '/Peaceflow-App/' : '/',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
