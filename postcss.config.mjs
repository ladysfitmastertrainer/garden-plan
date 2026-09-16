/*
  Tailwind v4 dưới Next dùng plugin PostCSS, không dùng plugin Vite như trước.
  Toàn bộ cấu hình màu và font vẫn nằm trong `@theme` ở `app/globals.css` -
  Tailwind v4 không cần `tailwind.config.js`.
*/
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
