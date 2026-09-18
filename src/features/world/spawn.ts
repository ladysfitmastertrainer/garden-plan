/**
 * Chỗ đặt chân khi một đứa trẻ bước vào vùng đất.
 *
 * Bản đồ chỉ có MỘT điểm xuất phát, và trước đây mọi đứa trẻ đều đứng đúng vào
 * ô ấy. Một mình thì không sao. Từ lúc bạn cùng lớp hiện lên bản đồ thì nó thành
 * một lỗi thấy rõ: hai em vào cùng một vùng là hai nhân vật CHỒNG KHÍT lên nhau
 * ở cùng một ô, và cái nhìn thấy được chỉ là một người - không ai biết bạn mình
 * đã vào hay chưa.
 *
 * Nên mỗi em một ô, bốc từ một nhúm ô quanh điểm xuất phát. Bốc bằng HẠT GIỐNG
 * chứ không bằng ngẫu nhiên: cùng một đứa trẻ thì lần nào vào cũng đứng đúng chỗ
 * ấy, và quan trọng hơn - MỌI MÁY cùng tính ra một kết quả, nên chỗ bạn mình
 * đứng trên màn hình của mình đúng là chỗ bạn ấy thấy mình đứng.
 *
 * Hàm THUẦN, không đụng React: chỉ đọc lưới ô của một bản đồ đã dựng xong.
 */

import { WALKABLE } from '../pixel/tiles'
import type { RouteMap } from './routemap'

/**
 * Bán kính nhúm ô quanh điểm xuất phát, tính bằng ô.
 *
 * Hai ô cho ra nhiều nhất hai mươi lăm ô, mà phần lớn trong số đó là cây cối
 * hay vách đá nên số ô thật sự dùng được thường chỉ còn mươi ô - vừa đủ cho một
 * lớp học thường vào cùng lúc, và vẫn đủ gần để cả nhóm nhìn thấy nhau ngay từ
 * lúc mở màn.
 *
 * Rộng hơn thì hai em vào cùng một vùng có thể mở ra ở hai đầu màn hình và
 * tưởng mình đang chơi một mình.
 */
const SPREAD = 2

export function spawnSpot(map: RouteMap, seed: string): { x: number; y: number } {
  const spots = spawnSpots(map)
  if (spots.length === 0) return map.start
  return spots[hash(seed) % spots.length]!
}

/**
 * Những ô quanh điểm xuất phát mà một đứa trẻ đứng vào được.
 *
 * Xếp theo thứ tự CỐ ĐỊNH (trên xuống, trái sang phải) chứ không theo thứ tự
 * quét ngẫu nhiên: phép bốc ở trên chia lấy dư trên danh sách này, nên danh sách
 * đổi thứ tự là mọi đứa trẻ đổi chỗ đứng.
 */
function spawnSpots(map: RouteMap): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []

  for (let y = map.start.y - SPREAD; y <= map.start.y + SPREAD; y++) {
    for (let x = map.start.x - SPREAD; x <= map.start.x + SPREAD; x++) {
      const tile = map.tiles[y]?.[x]
      if (!tile || !WALKABLE[tile]) continue

      /*
        Ba loại ô bị loại, và loại nào cũng vì cùng một lẽ: đứng SẴN ở đó thì
        thứ đang chờ ở ô ấy không bao giờ nổ ra.

        Cổng và cửa nhà chỉ kích hoạt khi trẻ BƯỚC VÀO; đặt em ấy đứng sẵn trên
        đó thì bước đầu tiên là bước RA, và con quái canh cổng coi như bị bỏ qua.
        Ô quái ẩn thì tệ hơn: nó là phần thưởng cho việc chịu khó đi tìm, mà đứng
        sẵn lên là vừa mất phần thưởng vừa mất cả chỗ bí mật.
      */
      if (tile === 'door') continue
      if (map.gates.some((gate) => gate.x === x && gate.y === y)) continue
      if (map.secrets.some((spot) => spot.x === x && spot.y === y)) continue

      out.push({ x, y })
    }
  }

  return out
}

/**
 * Băm một chuỗi thành một số không âm.
 *
 * Thuật toán djb2, đủ tốt cho việc duy nhất nó làm ở đây: rải vài chục id học
 * sinh ra mươi ô sao cho không dồn cục. Không dùng vào việc gì cần bảo mật.
 */
function hash(text: string): number {
  let value = 5381
  for (let i = 0; i < text.length; i++) {
    value = ((value << 5) + value + text.charCodeAt(i)) | 0
  }
  return Math.abs(value)
}
