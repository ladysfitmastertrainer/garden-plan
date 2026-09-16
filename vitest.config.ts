/*
  Vitest đứng RIÊNG, không còn ké `vite.config.ts` như bản cũ.

  Next không dùng Vite, nên file này là nơi duy nhất còn cấu hình Vite - và nó
  chỉ phục vụ test. Nhờ tách ra, đổi cấu hình build không còn làm hỏng test và
  ngược lại.
*/
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      /*
        `server-only` là một cái chốt cửa dành cho bộ đóng gói của Next: nhập nó
        từ mã chạy trong trình duyệt là build hỏng ngay, nên khoá `service_role`
        không bao giờ lọt xuống máy người dùng.

        Ngoài Next thì module đó chỉ biết ném lỗi. Vitest chạy `src/server/**` ở
        Node thật, nên trỏ nó vào một file rỗng - cái chốt vẫn giữ nguyên tác
        dụng ở nơi nó cần có tác dụng, còn test thì chạy được.
      */
      'server-only': new URL('./src/server/server-only.stub.ts', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'supabase/**/*.test.ts'],
    testTimeout: 30_000,
  },
})
