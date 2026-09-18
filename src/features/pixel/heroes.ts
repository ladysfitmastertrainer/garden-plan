/**
 * CÙNG MỘT LINH VẬT, KHÁC MÀU - để hai đứa trẻ không bao giờ là một.
 *
 * Game chỉ vẽ ba hình nhân vật: cáo, gấu trúc, rồng. Ba là con số đủ cho một
 * đứa trẻ chơi một mình, nhưng một lớp có ba mươi em, và từ lúc bạn cùng lớp
 * hiện lên bản đồ thì ba hình là quá ít: hai em cùng chọn con cáo sẽ đứng cạnh
 * nhau như hai bản sao, không ai nhận ra mình ở đâu.
 *
 * Vẽ thêm hình mới không phải câu trả lời. Mỗi nhân vật cần ba góc nhìn (trước,
 * sau, nghiêng) vẽ tay từng điểm ảnh; thêm năm con là thêm mười lăm lưới ký tự,
 * và vẫn sẽ thiếu ở lớp thứ ba mươi mốt.
 *
 * Nên: HÌNH là thứ trẻ CHỌN, MÀU là thứ trẻ ĐƯỢC PHÁT. Mười hai tông màu nhân ba
 * hình là ba mươi sáu vẻ khác nhau, và không ai phải chọn màu cả - nó tự tới
 * theo tên của em ấy.
 *
 * Đây đúng mẹo mà chính game này đã dùng cho thú đồng hành, và đúng mẹo của máy
 * điện tử thời đó khi bộ nhớ không đủ chứa hàng chục hình khác nhau.
 *
 * ---- VÌ SAO MÀU LẤY THEO TÊN, KHÔNG PHẢI THEO ID ----
 *
 * Id hồ sơ chắc chắn không trùng, nên thoạt nghe nó là hạt giống tốt hơn. Nhưng
 * id chỉ có SAU KHI hồ sơ được tạo, mà màn chọn linh vật thì diễn ra TRƯỚC đó -
 * và nếu ô chọn vẽ con cáo cam rồi vào game lại ra con cáo tím thì lời hứa "con
 * chọn con nào thì thấy đúng con ấy" bị phá ngay ở bước đầu tiên.
 *
 * Tên thì có mặt ở mọi nơi nhân vật được vẽ ra - hồ sơ, bảng bạn cùng lớp, trận
 * PVP - và có mặt ngay trong lúc trẻ đang gõ. Nhờ vậy ô chọn xem trước được
 * đúng con sẽ ra, và màu đổi dần theo từng chữ cái em gõ vào: một chi tiết nhỏ
 * mà trẻ con rất thích.
 *
 * ĐÁNH ĐỔI, nói thẳng ra: hai em TRÙNG TÊN và chọn CÙNG linh vật thì vẫn giống
 * nhau. Trong một lớp thì đó là chuyện hiếm, và khi nó xảy ra thì cô giáo đổi
 * cho một em sang linh vật khác là xong. Đổi lại, không có một lượt ghi dữ liệu
 * nào, không thêm một cột nào, và ô chọn không bao giờ nói dối.
 */

import { CREATURE_VIEWS, creatureFromAvatar, recolor, type CreatureViews } from './creatures'
import type { Sprite } from './sprite'

/**
 * Một tông màu. Cả ba hình đều dùng chung một bộ KHOÁ màu, nên một tông ở đây tô
 * được cho bất cứ hình nào:
 *
 *   #  viền ngoài   B  thân   S  mảng tối (mõm, bóng)   Y  bàn chân
 *
 * `L` (bụng, mảng sáng) và cặp mắt `E`/`P` KHÔNG bao giờ bị đổi. Bụng sáng là
 * thứ giữ cho con vật vẫn đọc ra được là con vật ấy dù thân đã đổi màu, còn đổi
 * màu mắt thì khuôn mặt thôi đọc ra được ở khổ mười sáu điểm ảnh.
 */
export interface HeroTint {
  /** Khoá ngắn không dấu - dùng làm `key` trong React và trong test. */
  id: string
  name: string
  /** `null` nghĩa là GIỮ NGUYÊN bảng màu gốc của hình. Xem ghi chú ở HERO_TINTS. */
  palette: { '#': string; B: string; S: string; Y: string } | null
}

/**
 * Mười hai tông màu.
 *
 * Tông đầu tiên là BẢN GỐC, và nó phải là tông đầu tiên: cáo cam, gấu trúc đen
 * trắng, rồng xanh lá là hình mà ô chọn linh vật vẫn vẽ ra từ trước tới nay.
 * Bỏ nó đi thì không đứa trẻ nào còn nhận được con vật quen thuộc nữa.
 *
 * Mười một tông còn lại rải đều quanh vòng màu, không có hai tông nào cạnh nhau. Hai
 * sắc xanh gần nhau thì ở khổ bản đồ thế giới - nơi nhân vật chỉ còn vài chục
 * điểm ảnh - lại hoá ra giống hệt, đúng cái lỗi bảng này sinh ra để chữa.
 */
export const HERO_TINTS: HeroTint[] = [
  { id: 'goc', name: 'Màu gốc', palette: null },
  {
    id: 'do',
    name: 'Đỏ',
    palette: { '#': '#5e1616', B: '#e0553f', S: '#b03a28', Y: '#8a2a20' },
  },
  {
    id: 'cam-dam',
    name: 'Nghệ',
    palette: { '#': '#4a3406', B: '#f2b02e', S: '#c98a15', Y: '#7a5a0d' },
  },
  {
    id: 'luc',
    name: 'Cốm',
    palette: { '#': '#1f4d1c', B: '#7ac94f', S: '#549b38', Y: '#3a6e28' },
  },
  {
    id: 'ngoc',
    name: 'Ngọc',
    palette: { '#': '#0c4a47', B: '#3fc2b4', S: '#2a9187', Y: '#1b6b63' },
  },
  {
    id: 'lam',
    name: 'Lam',
    palette: { '#': '#0f2f52', B: '#3f95d9', S: '#2a6ea8', Y: '#1c4d77' },
  },
  {
    id: 'tim',
    name: 'Tím',
    palette: { '#': '#3a2260', B: '#9a72d6', S: '#7350ad', Y: '#513183' },
  },
  {
    id: 'hong',
    name: 'Hồng',
    palette: { '#': '#6b2444', B: '#f291bd', S: '#d06694', Y: '#9c3a66' },
  },
  {
    id: 'nau',
    name: 'Nâu',
    palette: { '#': '#3d2413', B: '#a9703f', S: '#7d5029', Y: '#5e3a1d' },
  },
  {
    id: 'xam',
    name: 'Xám',
    palette: { '#': '#252c38', B: '#8d9cb0', S: '#63718a', Y: '#3d485c' },
  },
  {
    id: 'chanh',
    name: 'Chanh',
    palette: { '#': '#5e5a12', B: '#e3dc55', S: '#b5ad2c', Y: '#8a8418' },
  },
  {
    id: 'man',
    name: 'Mận',
    palette: { '#': '#4a1430', B: '#a63d72', S: '#7d2a54', Y: '#601c3d' },
  },
]

/**
 * Tông màu của một đứa trẻ, suy ra từ tên.
 *
 * Hàm THUẦN và KHÔNG ĐỔI: cùng một cái tên thì lần nào cũng ra đúng một màu, ở
 * mọi màn hình, trên mọi máy. Không có lượt ghi nào xuống cơ sở dữ liệu.
 */
export function heroTint(seed: string): HeroTint {
  return HERO_TINTS[hash(seed) % HERO_TINTS.length]!
}

/**
 * Băm một chuỗi thành một số không âm.
 *
 * Thuật toán djb2, đủ tốt cho việc duy nhất nó làm ở đây: rải vài chục cái tên
 * ra mười hai ô sao cho không dồn cục. Không dùng vào việc gì cần bảo mật.
 */
function hash(text: string): number {
  let value = 5381
  for (let i = 0; i < text.length; i++) {
    value = ((value << 5) + value + text.charCodeAt(i)) | 0
  }
  return Math.abs(value)
}

/*
  Hình đã tô màu được NHỚ LẠI, không tô mới mỗi lần hỏi.

  `PixelSprite` vẽ lại canvas mỗi khi `sprite` đổi DANH TÍNH (nó nằm trong mảng
  phụ thuộc của một `useEffect`). Tô lại một bảng màu là dựng một đối tượng mới,
  nên trả về hình mới ở mỗi lần vẽ nghĩa là cả bản đồ tô lại từng con một, sáu
  mươi lần một giây. Cùng một lẽ với `petSpriteFor` ở kho thú.

  Kho nhớ này không bao giờ lớn quá ba mươi sáu mục - ba hình nhân mười hai tông.
*/
const VIEWS_CACHE = new Map<string, CreatureViews>()

/**
 * Ba góc nhìn của nhân vật một đứa trẻ.
 *
 * `avatar` chọn HÌNH (emoji lưu trong hồ sơ), `seed` chọn MÀU (tên của em ấy).
 */
export function heroViews(avatar: string, seed: string): CreatureViews {
  const shape = creatureFromAvatar(avatar)
  /*
    Hạt giống màu gồm CẢ linh vật lẫn tên, không chỉ tên.

    Cô giáo phát linh vật cho cả lớp từ mười hai emoji, nhưng game chỉ vẽ ba
    hình - nên bốn emoji khác nhau vẫn có thể ra cùng một hình. Nếu màu chỉ
    lấy theo tên thì hai em chọn 🐯 và 🦁 ra hai con cáo y hệt nhau, và người
    lớn không hiểu vì sao hai lựa chọn khác nhau lại cho cùng một kết quả.

    Gộp emoji vào hạt giống thì hai lựa chọn khác nhau gần như luôn ra hai màu
    khác nhau, mà ô chọn linh vật vẫn xem trước được (nó biết cả hai thứ).
  */
  const tint = heroTint(avatar + seed)
  const base = CREATURE_VIEWS[shape]
  if (!tint.palette) return base

  const key = `${shape}:${tint.id}`
  const cached = VIEWS_CACHE.get(key)
  if (cached) return cached

  const views: CreatureViews = {
    down: recolor(base.down, tint.palette),
    up: recolor(base.up, tint.palette),
    side: recolor(base.side, tint.palette),
  }
  VIEWS_CACHE.set(key, views)
  return views
}

/** Hình nhìn từ trước - dùng cho mọi chỗ chỉ cần một tấm chân dung. */
export function heroSprite(avatar: string, seed: string): Sprite {
  return heroViews(avatar, seed).down
}

/**
 * Hình hợp với hướng đang đi. Hướng trái dùng lại hình nghiêng, lật gương.
 *
 * Thay cho `viewFor(creature, direction)`: nơi gọi giờ cầm emoji và tên trong
 * tay chứ không cầm id hình dáng, và việc "ai ra hình nào, màu nào" là chuyện
 * của riêng file này.
 */
export function heroViewFor(
  avatar: string,
  seed: string,
  direction: 'up' | 'down' | 'left' | 'right',
): { sprite: Sprite; flip: boolean } {
  const views = heroViews(avatar, seed)
  if (direction === 'up') return { sprite: views.up, flip: false }
  if (direction === 'down') return { sprite: views.down, flip: false }
  return { sprite: views.side, flip: direction === 'left' }
}
