/**
 * Sinh mã PIN ngẫu nhiên cho học sinh.
 *
 * Vì sao cần: giáo viên tự nghĩ mã cho ba mươi em thì mã sẽ na ná nhau và đoán
 * được - ngày sinh, số thứ tự trong sổ, hoặc cả lớp cùng một mã cho dễ nhớ. Mã
 * PIN ở đây không chống được người lớn, nhưng nó phải chống được BẠN CÙNG LỚP,
 * và bạn cùng lớp thì biết thừa ngày sinh của nhau.
 *
 * Bốn chữ số, không hơn: máy chủ nhận tới tám (xem `server/classes.ts`), nhưng
 * bàn phím của trẻ chỉ có bốn ô (xem `AuthScreen`). Sinh ra mã dài hơn là sinh ra
 * mã không nhập được.
 */

/** Số lần bốc lại tối đa trước khi kết luận là nguồn ngẫu nhiên bị hỏng. */
const MAX_TRIES = 50

/** Dãy tăng và giảm liên tiếp: 0123...6789 và 9876...3210. */
const SEQUENCES = new Set<string>()
for (let start = 0; start <= 6; start += 1) {
  const up = [start, start + 1, start + 2, start + 3].join('')
  SEQUENCES.add(up)
  SEQUENCES.add([...up].reverse().join(''))
}

/**
 * Những mã người ta gõ đầu tiên khi thử mò.
 *
 * Bốn góc bàn phím, cột giữa, hai cặp lặp - trẻ con mò máy của bạn thì mò đúng
 * mấy cái này trước.
 */
const COMMON = new Set([
  '1379', '9731', '1793', '3971',
  '2580', '0852',
  '1212', '2121', '1010', '0101', '1313',
  '2468', '1357',
])

/** Mã yếu: cả lớp đoán ra trong vài lần thử. */
export function isWeakPin(pin: string): boolean {
  // Bốn chữ số giống nhau: 0000, 7777.
  if (/^(\d)\1{3}$/.test(pin)) return true
  if (SEQUENCES.has(pin)) return true
  if (COMMON.has(pin)) return true
  return false
}

/**
 * Một chữ số ngẫu nhiên, lấy từ nguồn ngẫu nhiên của trình duyệt.
 *
 * KHÔNG dùng `Math.random()`: nó không hứa hẹn gì về chất lượng ngẫu nhiên, và
 * đây là thứ khoá hồ sơ học tập của một đứa trẻ khỏi các bạn trong lớp.
 *
 * Bỏ những byte từ 250 trở lên trước khi chia lấy dư: 256 không chia hết cho 10,
 * nên nếu lấy tuốt thì các chữ số 0-5 hay ra hơn 6-9. Lệch nhỏ, nhưng sửa chỉ
 * tốn một dòng.
 */
function cryptoDigit(): number {
  const byte = new Uint8Array(1)
  for (;;) {
    crypto.getRandomValues(byte)
    if (byte[0]! < 250) return byte[0]! % 10
  }
}

/**
 * Một mã PIN bốn chữ số không nằm trong danh sách dễ đoán.
 *
 * `randomDigit` chỉ để test bơm vào nguồn ngẫu nhiên đã biết trước; chỗ dùng
 * thật luôn lấy mặc định.
 *
 * Ném lỗi khi bốc `MAX_TRIES` lần mà lần nào cũng ra mã yếu. Với nguồn ngẫu
 * nhiên lành lặn thì chuyện đó không xảy ra - tập mã yếu chỉ khoảng ba mươi
 * trong mười nghìn. Nên nếu nó xảy ra thì nguồn ngẫu nhiên hỏng, và lúc ấy báo
 * lỗi đúng hơn là lặng lẽ phát ra "0000" cho cả lớp.
 */
export function generatePin(randomDigit: () => number = cryptoDigit): string {
  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    let pin = ''
    for (let i = 0; i < 4; i += 1) pin += randomDigit()
    if (!isWeakPin(pin)) return pin
  }
  throw new Error('Không sinh được mã PIN ngẫu nhiên. Thử lại hoặc tự nhập mã.')
}
