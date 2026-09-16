import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Học Viện Trí Tuệ',
        short_name: 'Trí Tuệ',
        description: 'Game học tập cho học sinh tiểu học: Toán, Tiếng Việt, Đạo đức, Âm nhạc',
        lang: 'vi',
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        // NGANG. Màn hình ngang cho khung trận và khung câu hỏi đứng cạnh nhau
        // thay vì chồng lên nhau, nên trẻ thấy cả con quái lẫn đề bài cùng lúc -
        // xem `.battle-layout` trong `src/index.css`. Bố cục dọc vẫn chạy tốt,
        // đây chỉ là hướng ƯU TIÊN khi cài app về máy.
        orientation: 'landscape',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        /*
          Bộ đọc Excel KHÔNG tải sẵn về máy.

          Nó nặng nửa megabyte và chỉ trang quản trị mới đụng tới - mà trang đó
          thì thầy cô mở vài lần một học kỳ, trên máy có mạng. Để service worker
          tải sẵn thì mọi máy tính bảng của trẻ đều phải cõng nó ngay lần mở đầu,
          đúng thứ mà `import()` động sinh ra để tránh.

          Không tải sẵn không có nghĩa là không chạy được: lúc bấm nút nạp file,
          trình duyệt tự đi lấy như mọi tài nguyên khác.
        */
        globIgnores: ['**/xlsx-*.js'],
        // Nửa megabyte là ngưỡng mặc định của workbox; gói chính của app đã vượt,
        // nên phải nới ra nếu không nó lặng lẽ bỏ gói đó khỏi danh sách tải sẵn.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'supabase/**/*.test.ts'],
    testTimeout: 30_000,
  },
})
