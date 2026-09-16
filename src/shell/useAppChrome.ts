'use client'

/**
 * Hai việc lặt vặt cấp trang mà cả phần chơi lẫn trang quản trị đều cần.
 *
 * Bản cũ để chúng trong `App.tsx` - thứ duy nhất bọc mọi màn hình. Next thì mỗi
 * đường dẫn một trang, nên chúng phải gom vào một hook để hai trang cùng gọi,
 * thay vì chép đôi và quên một chỗ.
 */

import { useEffect } from 'react'
import { ensureAudioContext } from '../audio/synth'
import { useMotionMode } from '../features/admin/useTuning'
import { preferLandscape } from './orientation'

export function useAppChrome(): void {
  // Chế độ chuyển động lên thẻ <html>, để CSS đọc được. Không có nó thì lựa chọn
  // "Luôn bật" trong trang quản trị chỉ tác động tới hoạt cảnh viết bằng
  // JavaScript, còn hoạt cảnh viết bằng CSS vẫn bị hệ điều hành tắt.
  const motionMode = useMotionMode()
  useEffect(() => {
    document.documentElement.dataset.motion = motionMode
  }, [motionMode])

  // Trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên của người dùng. Khoá
  // hướng màn hình cũng vậy - phải đi kèm một thao tác thật.
  useEffect(() => {
    const unlock = () => {
      ensureAudioContext()
      preferLandscape()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])
}
