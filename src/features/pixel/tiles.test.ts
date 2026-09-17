/**
 * Mọi ô cảnh phải đúng 16×16 và không dùng ký tự màu nào chưa khai.
 *
 * Hai lỗi này không bao giờ nổ ra thành lỗi: một hàng thiếu ký tự thì ô bị hụt
 * mất một cột và ghép vào bản đồ thành một khe hở chạy dọc; một ký tự chưa khai
 * thì điểm ảnh đó vẽ ra trong suốt, để lại lỗ thủng giữa mặt đất. Cả hai chỉ
 * thấy được bằng mắt, trên đúng vùng đất có ô ấy - mà có mười hai vùng đất.
 */

import { describe, expect, it } from 'vitest'

import { TERRAIN, TILES, WALKABLE, buildTiles, type TileKind } from './tiles'

const KINDS = Object.keys(TILES) as TileKind[]

describe('ô cảnh dựng đúng khổ', () => {
  it('mỗi ô đúng 16 hàng, mỗi hàng đúng 16 ký tự', () => {
    for (const kind of KINDS) {
      const sprite = TILES[kind]
      expect(sprite.rows, kind).toHaveLength(16)
      for (const [index, row] of sprite.rows.entries()) {
        expect(row.length, `${kind} hàng ${index}`).toBe(16)
      }
    }
  })

  it('mọi ký tự trong ô đều có màu đã khai', () => {
    for (const kind of KINDS) {
      const sprite = TILES[kind]
      for (const row of sprite.rows) {
        for (const ch of row) {
          // Dấu chấm là trong suốt có chủ ý (tán cây nhô ra ngoài ô).
          if (ch === '.') continue
          expect(sprite.palette[ch], `${kind} thiếu màu cho '${ch}'`).toBeTruthy()
        }
      }
    }
  })

  it('mỗi ô đều trả lời được câu "đi vào được không"', () => {
    // Thiếu một mục ở đây thì `WALKABLE[kind]` ra undefined, và undefined là
    // "không đi được" một cách tình cờ - ô mới lặng lẽ thành bức tường.
    for (const kind of KINDS) {
      expect(typeof WALKABLE[kind], kind).toBe('boolean')
    }
  })

  it('đổi bảng màu thì ô vẫn đúng khổ', () => {
    // `biome.ts` tráo bảng màu cho từng vùng đất. Ô nào dựng màu theo kiểu khác
    // - ví dụ vùng cao và vùng trũng, vốn mượn lại ô cỏ - phải chịu được điều đó.
    const swapped = buildTiles({ ...TERRAIN, grass: '#123456' })
    for (const kind of KINDS) {
      expect(swapped[kind].rows, kind).toHaveLength(16)
    }
  })
})
