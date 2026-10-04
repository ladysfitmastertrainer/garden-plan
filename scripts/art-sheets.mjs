/**
 * Danh sách TỜ HÌNH do Gemini vẽ, và mỗi tờ cắt ra thành những hình nào.
 *
 * Một tờ là một ảnh có nhiều nhân vật đứng thành MỘT HÀNG NGANG trên nền trắng.
 * Vẽ cả dòng tiến hoá trong một lần tạo ảnh là cách duy nhất để bốn nấc nhìn ra
 * cùng một con: tạo bốn lần riêng thì lần nào Gemini cũng vẽ ra một con hơi khác.
 *
 * Thứ tự trong `ids` là THỨ TỰ TỪ TRÁI SANG PHẢI trên tờ hình, và là hợp đồng với
 * prompt trong `docs/art/prompts.md`. Đổi một bên thì phải đổi bên kia.
 *
 * Ảnh gốc đặt ở `art-src/<file>`, chạy `npm run art`, hình đã cắt ra nằm ở
 * `public/art/<id>.webp`.
 */

const PET_IDS = [
  'so-con', 'rong-so', 'gau-dem',
  'cu-chu', 'cao-tho', 'vet-ke',
  'chuong-con', 'meo-hat', 'trong-nho',
  'dom-sang', 'nai-sang', 'hac-sang',
]

const SUBJECTS = ['math', 'vietnamese', 'music', 'ethics']
const HABITATS = ['sea', 'cave', 'forest', 'lava', 'deep']
const HEROES = ['fox', 'panda', 'dragon']

/**
 * Tờ có NỀN TRẮNG BỊ BAO KÍN bên trong hình: khe giữa đuôi và thân, vòng dải lụa,
 * vòng trống bao quanh. Loang nền từ mép ảnh không chạm tới những chỗ ấy, nên
 * với các tờ này script đục thêm mọi vùng trắng tinh bị bao kín.
 *
 * KHÔNG bật cho mọi tờ: ở tờ khác vùng trắng bị bao kín là thứ thật - lông gấu
 * trúc, chóp đuôi cáo, phím đàn, cánh đom đóm, lông hạc. Duyệt bằng mắt từng tờ
 * rồi mới thêm vào đây.
 */
const FILL_HOLES = new Set(['so-con', 'rong-so', 'cu-chu', 'cao-tho', 'vet-ke', 'trong-nho'])

const four = (prefix) => [1, 2, 3, 4].map((n) => `${prefix}-${n}`)

/** @type {{ file: string, ids: string[], fillHoles?: boolean }[]} */
export const SHEETS = [
  ...PET_IDS.map((id) => ({ file: `pet-${id}.png`, ids: four(`pet-${id}`), fillHoles: FILL_HOLES.has(id) })),
  ...SUBJECTS.map((s) => ({ file: `monsters-${s}.png`, ids: four(`monster-${s}`) })),
  { file: 'bosses-1.png', ids: ['boss-math', 'boss-vietnamese'] },
  { file: 'bosses-2.png', ids: ['boss-music', 'boss-ethics'] },
  ...HABITATS.map((h) => ({ file: `habitat-${h}.png`, ids: four(`habitat-${h}`) })),
  // Nhân vật của trẻ: mặt trước, mặt nghiêng (nhìn sang trái), mặt sau.
  ...HEROES.map((h) => ({ file: `hero-${h}.png`, ids: [`hero-${h}-down`, `hero-${h}-side`, `hero-${h}-up`] })),
  // Đầu đàn trong hang - xem `LEADERS` trong `content/bestiary.ts`.
  { file: 'leaders-1.png', ids: ['leader-math-1', 'leader-math-2', 'leader-vietnamese-1', 'leader-vietnamese-2'] },
  { file: 'leaders-2.png', ids: ['leader-music-1', 'leader-music-2', 'leader-ethics-1', 'leader-ethics-2'] },
  // Đồ trang trí của bản đồ thế giới và khu vườn - xem `PROP_ART` trong `pixel/iso.ts`.
  { file: 'props-1.png', ids: ['prop-castle', 'prop-tower', 'prop-belltower', 'prop-lighthouse'] },
  { file: 'props-2.png', ids: ['prop-shrine', 'prop-portal', 'prop-obelisk', 'prop-crystal'] },
  { file: 'props-3.png', ids: ['prop-tree', 'prop-pine', 'prop-palm', 'prop-bush'] },
  { file: 'props-4.png', ids: ['prop-mushroom', 'prop-flowers', 'prop-stone', 'prop-lantern'] },
  { file: 'props-5.png', ids: ['prop-abacus', 'prop-bookstand', 'prop-drum', 'prop-harp'] },
]

/**
 * Logo ngôi sao mờ Gemini đóng vào góc dưới bên phải mọi ảnh 1024×572 - cùng một
 * chỗ ở cả chín tấm nền.
 */
const GEMINI_STAR = { x: 935, y: 481, r: 20, dx: -48, dy: 0 }

/**
 * Ảnh NỀN TRẬN ĐẤU: một ảnh nguyên vẹn mỗi tấm, không cắt nhân vật.
 *
 * `patches` là những chỗ phải xoá: mỗi chỗ là một hình tròn tâm (x, y) bán kính
 * r, tính bằng điểm ảnh của ẢNH GỐC, được đắp bằng mảng nền lấy lệch (dx, dy) -
 * như cọ "clone" của trình sửa ảnh. Đo bằng mắt trên từng tấm, nên Gemini vẽ lại
 * tấm nào thì phải đo lại tấm đó.
 *
 * @type {{ file: string, id: string, patches: { x: number, y: number, r: number, dx: number, dy: number }[] }[]}
 */
export const SCENES = [...SUBJECTS, ...HABITATS].map((key) => ({
  file: `scene-${key}.png`,
  id: `scene-${key}`,
  patches: [
    GEMINI_STAR,
    // Gemini đánh số "1", "2" lên hai chỗ đứng dù prompt cấm chữ và số.
    ...(key === 'vietnamese'
      ? [
          { x: 311, y: 471, r: 15, dx: -34, dy: 0 },
          { x: 719, y: 403, r: 15, dx: -34, dy: 0 },
        ]
      : []),
  ],
}))
