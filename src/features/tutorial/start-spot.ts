/**
 * Chỗ đặt nhân vật khi vào bàn hướng dẫn - và vì sao nó KHÔNG phải điểm xuất
 * phát của bản đồ.
 *
 * Bản đồ vùng đất nào cũng đặt điểm xuất phát ngay DƯỚI chặng đầu tiên, cách
 * đúng một ô. Trong game thật thì đó là đúng: trẻ vừa đặt chân tới vùng đất,
 * việc đầu tiên phải làm là con quái đang đứng ngay trước mặt.
 *
 * Trên bàn hướng dẫn thì nó phá mất cả bài học. Câu người dẫn vừa nói xong là
 * "bấm bốn mũi tên để đi"; bấm một cái đã vào trận thì trẻ không kịp học gì về
 * việc đi - mà đó là một trong ba việc bàn này hứa sẽ chỉ.
 *
 * Nên trẻ được đặt ở ĐẦU KIA của hàng dưới cùng: chừng mười bước đi ngang, đủ
 * để quen tay với bốn mũi tên, đủ để đi qua vài bụi cỏ cao, và vẫn thấy con quái
 * ở đằng xa suốt quãng đường. Hàng dưới cùng vì đó là hàng thông suốt - đường
 * đi bám sát nó - nên không có cách nào đi lạc.
 *
 * Hàm thuần, không đụng React: chỉ đọc lưới ô của một bản đồ đã dựng xong.
 */

import { WALKABLE } from '../pixel/tiles'
import type { RouteMap } from '../world/routemap'

export function tutorialStartSpot(map: RouteMap): { x: number; y: number } {
  const y = map.start.y
  const row = map.tiles[y]
  if (!row) return map.start

  let best = map.start
  for (let x = 0; x < row.length; x++) {
    const tile = row[x]
    if (!tile || !WALKABLE[tile]) continue
    /*
      Ô cổng bị loại thẳng.

      Đứng sẵn trên một cái cổng thì bước đầu tiên của trẻ là bước RA, và cổng
      chỉ nổ khi trẻ bước VÀO - nên con quái canh cổng ấy coi như bị bỏ qua.
      Trên bàn này hàng dưới cùng thường không có cổng nào ngoài chặng đầu, nên
      dòng này gần như chỉ để phòng cho bản đồ sau này đổi hình.
    */
    if (map.gates.some((gate) => gate.x === x && gate.y === y)) continue
    if (Math.abs(x - map.start.x) > Math.abs(best.x - map.start.x)) best = { x, y }
  }
  return best
}
