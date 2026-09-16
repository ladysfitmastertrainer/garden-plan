import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,

  /*
    `xlsx` chỉ có trang quản trị dùng, và nó nặng nửa megabyte.

    Bản Vite trước đây dặn service worker đừng tải sẵn gói này. Ở Next thì việc
    đó tự lo được: mọi chỗ dùng đều `await import('xlsx')`, nên webpack tách nó
    thành chunk riêng và trình duyệt chỉ đi lấy lúc thầy cô bấm nút nạp file.

    Đánh dấu `serverExternalPackages` để nếu có lúc nào đọc file trên máy chủ thì
    Next không cố gói nó vào bundle server.
  */
  serverExternalPackages: ['xlsx'],

  eslint: { ignoreDuringBuilds: true },
}

export default config
