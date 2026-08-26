import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Site chạy ở domain riêng (peaceflow.vn, xem file CNAME) nên phục vụ ở gốc "/",
  // không phải subpath kiểu <user>.github.io/<repo>/. Giữ base "/" cho cả dev và production.
  base: '/',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
