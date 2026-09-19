/**
 * HỘP CẢNH - mảnh vườn riêng của đứa trẻ.
 *
 * Mọi thứ khác trong game này đều dẫn tới một trận đánh. Bản đồ dẫn tới cổng,
 * cổng dẫn tới quái, kho đồ dẫn tới bộ chiêu mang ra trận. Chỗ này thì không
 * dẫn đi đâu cả, và đó chính là điểm của nó.
 *
 * Bộ sưu tập thú hiện là một danh sách thẻ - mười hai con xếp thành hàng như
 * một bảng kê. Ở đây chúng ĐI LẠI trên một mảnh đất của riêng em ấy, giữa những
 * cái cây và hòn đá do chính em đặt xuống. Với một đứa bé bảy tuổi, khác biệt
 * giữa hai điều đó lớn hơn mọi cơ chế ta đã dựng hôm nay.
 *
 * ---- BA LUẬT, VÀ CHỈ BA ----
 *
 *  1. MỖI Ô MỘT MÓN. Không chồng lên nhau, không xoay, không tầng.
 *  2. SỐ Ô CÓ HẠN, và nở ra theo cấp của trẻ. Đây là luật quan trọng nhất -
 *     xem `gardenSlots`.
 *  3. ĐẶT THÌ TRẢ VÀNG, DỠ THÌ LẤY LẠI ĐỦ. Không mất gì khi đổi ý.
 *
 * Luật thứ ba là một quyết định về trẻ con. Một em bảy tuổi sẽ đặt cái cây đầu
 * tiên vào chỗ xấu nhất có thể, rồi muốn dời nó. Nếu dời mà mất vàng thì em ấy
 * sẽ thôi không thử nữa - và một khu vườn không ai dám thử thì không phải khu
 * vườn, nó là một bài kiểm tra. Vàng ở đây không bị TIÊU, nó chỉ chuyển từ túi
 * ra vườn; muốn lấy lại lúc nào cũng được.
 */

import {
  PROP_ABACUS,
  PROP_BELLTOWER,
  PROP_BOOKSTAND,
  PROP_BUSH,
  PROP_CASTLE,
  PROP_CRYSTAL,
  PROP_DRUM,
  PROP_FLOWERS,
  PROP_HARP,
  PROP_LANTERN,
  PROP_LIGHTHOUSE,
  PROP_MUSHROOM,
  PROP_OBELISK,
  PROP_PALM,
  PROP_PINE,
  PROP_PORTAL,
  PROP_SHRINE,
  PROP_STONE,
  PROP_TOWER,
  PROP_TREE,
} from '../features/pixel/iso'
import type { Sprite } from '../features/pixel/sprite'

/** Bề ngang và bề dọc khu vườn, tính bằng ô. */
export const GARDEN_COLS = 6
export const GARDEN_ROWS = 4
export const GARDEN_CELLS = GARDEN_COLS * GARDEN_ROWS

/**
 * TO NHỎ THEO VAI, không phải theo kích thước tệp.
 *
 * Mọi món cảnh vật trong `iso.ts` đều được vẽ ở đúng 16x16 - vì chúng sinh ra
 * để đứng một mình giữa một hòn đảo trên bản đồ thế giới, nơi mỗi đảo chỉ có
 * một món. Đem nguyên cỡ ấy vào khu vườn thì một ngọn hải đăng to đúng bằng một
 * bụi cỏ, và cả hai cùng bé bằng một phần ba viên gạch.
 *
 * Ba bậc, và khoảng cách giữa chúng chính là thứ làm khu vườn có chiều sâu:
 *
 *   'nho'  (x2)  thứ mọc sát đất - cỏ, đá, hoa, nấm.
 *   'vua'  (x3)  thứ cao ngang người - cây cối, đèn, nhạc cụ, bia đá.
 *   'lon'  (x4)  CÔNG TRÌNH. To hơn cả viên gạch nó đứng, nên nó trùm sang ô
 *                phía sau - đúng như một toà tháp thật trông ra khi nhìn nghiêng.
 *
 * Bậc 'lon' cố ý vượt khỏi viên gạch. Một toà lâu đài nằm gọn trong một ô thì
 * nó là một món đồ chơi; tràn ra ngoài thì nó mới là một toà lâu đài.
 */
export type PartSize = 'nho' | 'vua' | 'lon'

export const PART_SCALE: Record<PartSize, number> = { nho: 2, vua: 3, lon: 4 }

export interface GardenPart {
  id: string
  name: string
  sprite: Sprite
  /** Vàng phải trả để đặt xuống. Dỡ ra thì lấy lại đủ bấy nhiêu. */
  cost: number
  size: PartSize
}

/*
  Giá đi từ 10 tới 200, và khoảng cách ấy là cố ý.

  Một bụi cỏ 10 vàng là thứ mua được sau đúng một trận - để em nào vừa vào cũng
  có ngay một thứ đặt xuống, không phải chờ. Còn toà lâu đài 200 vàng là mục
  tiêu của cả chục trận, và nó phải đáng chờ tới mức ấy.

  Bốn món giữa bảng gắn thẳng với bốn môn học - bàn tính, giá sách, trống, đàn.
  Trẻ nhặt được chúng bằng vàng kiếm từ đúng môn ấy, nên khu vườn dần kể lại
  em học gì nhiều nhất.
*/
export const GARDEN_PARTS: GardenPart[] = [
  { id: 'bui-co', name: 'Bụi cỏ', sprite: PROP_BUSH, cost: 10, size: 'nho' },
  { id: 'hon-da', name: 'Hòn đá', sprite: PROP_STONE, cost: 10, size: 'nho' },
  { id: 'luong-hoa', name: 'Luống hoa', sprite: PROP_FLOWERS, cost: 15, size: 'nho' },
  { id: 'nam', name: 'Cây nấm', sprite: PROP_MUSHROOM, cost: 15, size: 'nho' },
  { id: 'cay-thong', name: 'Cây thông', sprite: PROP_PINE, cost: 20, size: 'vua' },
  { id: 'cay-to', name: 'Cây to', sprite: PROP_TREE, cost: 20, size: 'vua' },
  { id: 'cay-dua', name: 'Cây dừa', sprite: PROP_PALM, cost: 25, size: 'vua' },
  { id: 'den-long', name: 'Đèn lồng', sprite: PROP_LANTERN, cost: 30, size: 'vua' },
  { id: 'ban-tinh', name: 'Bàn tính', sprite: PROP_ABACUS, cost: 35, size: 'vua' },
  { id: 'gia-sach', name: 'Giá sách', sprite: PROP_BOOKSTAND, cost: 35, size: 'vua' },
  { id: 'cai-trong', name: 'Cái trống', sprite: PROP_DRUM, cost: 35, size: 'vua' },
  { id: 'cay-dan', name: 'Cây đàn', sprite: PROP_HARP, cost: 35, size: 'vua' },
  { id: 'bia-da', name: 'Bia đá', sprite: PROP_OBELISK, cost: 50, size: 'vua' },
  { id: 'khoi-pha-le', name: 'Khối pha lê', sprite: PROP_CRYSTAL, cost: 60, size: 'vua' },
  { id: 'ngoi-mieu', name: 'Ngôi miếu', sprite: PROP_SHRINE, cost: 70, size: 'lon' },
  { id: 'thap-canh', name: 'Tháp canh', sprite: PROP_TOWER, cost: 90, size: 'lon' },
  { id: 'thap-chuong', name: 'Tháp chuông', sprite: PROP_BELLTOWER, cost: 110, size: 'lon' },
  { id: 'hai-dang', name: 'Ngọn hải đăng', sprite: PROP_LIGHTHOUSE, cost: 140, size: 'lon' },
  { id: 'cong-than', name: 'Cổng thần', sprite: PROP_PORTAL, cost: 170, size: 'lon' },
  { id: 'lau-dai', name: 'Toà lâu đài', sprite: PROP_CASTLE, cost: 200, size: 'lon' },
]

const PART_BY_ID = new Map(GARDEN_PARTS.map((part) => [part.id, part]))

export function getGardenPart(id: string): GardenPart | null {
  return PART_BY_ID.get(id) ?? null
}

/**
 * SỐ Ô ĐƯỢC ĐẶT, nở ra theo cấp của trẻ.
 *
 * Đây là luật quan trọng nhất của cả khu vườn, và nó mượn thẳng từ chỗ đã
 * chứng minh được ở bộ chiêu: bốn chiêu nhưng chỉ hai ô. Có hạn mức thì mỗi
 * lần đặt một cái cây là một quyết định - đặt cây thông hay để dành chỗ cho
 * toà lâu đài. Không có hạn mức thì trẻ rải hết mọi thứ mình có lên mặt đất, và
 * khu vườn thành một cái kho.
 *
 * Bắt đầu bằng BỐN, đủ để có ngay một hình dạng, chưa đủ để rải bừa. Cứ hai cấp
 * thêm một ô: cấp 10 được chín ô, cấp 20 mười bốn - nên một em chơi cả năm vẫn
 * còn chỗ trống để mong. Trần đúng bằng số ô trên mặt đất, vì hơn thì vô nghĩa.
 */
export function gardenSlots(level: number): number {
  return Math.min(GARDEN_CELLS, 4 + Math.floor(Math.max(1, level) / 2))
}

/** Cấp kế tiếp mở thêm một ô, hoặc `null` khi đã mở hết mặt đất. */
export function nextSlotLevel(level: number): number | null {
  if (gardenSlots(level) >= GARDEN_CELLS) return null
  // Ô mở ở mọi cấp CHẴN, nên mốc kế tiếp là số chẵn đầu tiên lớn hơn cấp này.
  return level % 2 === 0 ? level + 2 : level + 1
}

/** Khoá của một ô trong bảng `garden.parts`. */
export function cellKey(col: number, row: number): string {
  return `${col},${row}`
}

/** Đọc ngược khoá ra toạ độ. Trả `null` với khoá hỏng - hồ sơ chép tay. */
export function parseCell(key: string): { col: number; row: number } | null {
  const [c, r] = key.split(',')
  const col = Number(c)
  const row = Number(r)
  if (!Number.isInteger(col) || !Number.isInteger(row)) return null
  if (col < 0 || col >= GARDEN_COLS || row < 0 || row >= GARDEN_ROWS) return null
  return { col, row }
}

/**
 * Lọc bảng đã lưu còn lại những ô HỢP LỆ.
 *
 * Bỏ ô ngoài mặt đất và món không còn tồn tại. Một hồ sơ lưu từ bản trước có
 * thể trỏ tới một món đã gỡ khỏi bảng, và để nguyên thì màn hình vẽ ra một chỗ
 * trống không bấm được - trẻ tưởng mình mất đồ.
 */
export function cleanGarden(parts: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, id] of Object.entries(parts ?? {})) {
    if (parseCell(key) && getGardenPart(id)) out[key] = id
  }
  return out
}

/** Tổng vàng đang nằm trong vườn - dỡ hết ra thì lấy lại đúng bấy nhiêu. */
export function gardenWorth(parts: Record<string, string> | undefined): number {
  return Object.values(cleanGarden(parts)).reduce(
    (sum, id) => sum + (getGardenPart(id)?.cost ?? 0),
    0,
  )
}
