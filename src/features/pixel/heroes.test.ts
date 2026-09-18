import { describe, expect, it } from 'vitest'

import { HERO_TINTS, heroSprite, heroTint, heroViewFor, heroViews } from './heroes'
import { CREATURE_VIEWS, HERO_CREATURES, creatureFromAvatar } from './creatures'
import { spriteSize, validateSprite } from './sprite'

describe('bảng tông màu', () => {
  it('tông đầu tiên GIỮ NGUYÊN màu gốc của hình', () => {
    // Bỏ nó đi thì không đứa trẻ nào còn nhận được con vật quen thuộc nữa.
    expect(HERO_TINTS[0]!.palette).toBeNull()
  })

  it('mọi tông còn lại đều tô đủ bốn khoá màu', () => {
    for (const tint of HERO_TINTS.slice(1)) {
      expect(tint.palette, tint.id).not.toBeNull()
      expect(Object.keys(tint.palette!).sort()).toEqual(['#', 'B', 'S', 'Y'])
      for (const colour of Object.values(tint.palette!)) {
        expect(colour, `${tint.id} ${colour}`).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })

  /*
    Hai tông trùng màu thân là hai tông vô dụng: ở khổ bản đồ thế giới, nơi nhân
    vật chỉ còn vài chục điểm ảnh, màu thân gần như là thứ DUY NHẤT đọc được.
  */
  it('không có hai tông nào trùng màu thân', () => {
    const bodies = HERO_TINTS.slice(1).map((tint) => tint.palette!.B)
    expect(new Set(bodies).size).toBe(bodies.length)
  })

  it('id và tên đều có, và id không trùng nhau', () => {
    const ids = HERO_TINTS.map((tint) => tint.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const tint of HERO_TINTS) expect(tint.name, tint.id).toBeTruthy()
  })
})

describe('màu lấy theo tên', () => {
  it('cùng một tên thì lần nào cũng ra đúng một màu', () => {
    expect(heroTint('Bảo An')).toBe(heroTint('Bảo An'))
    expect(heroTint('')).toBe(heroTint(''))
  })

  /*
    Đây là cả lý do hệ thống này tồn tại: hai em cùng chọn con cáo thì vẫn phải
    ra hai con cáo khác nhau.
  */
  it('hai cái tên khác nhau, cùng một linh vật, ra hai CON KHÁC MÀU', () => {
    // Đây đúng là chuyện người dùng báo: hai em cùng chọn con cáo, vào game
    // thấy hai nhân vật giống hệt nhau.
    const an = heroSprite('🦊', 'Bảo An')
    const binh = heroSprite('🦊', 'Minh Bình')
    expect(an.rows).toEqual(binh.rows)
    expect(an.palette).not.toEqual(binh.palette)
  })

  it('cùng một tên, hai linh vật khác nhau cũng ra hai màu khác nhau', () => {
    // 🐯 và 🦁 cùng ra hình con cáo - game chỉ vẽ ba hình - nên nếu màu chỉ lấy
    // theo tên thì hai lựa chọn khác nhau lại cho đúng một kết quả.
    expect(heroTint('🐯Bảo An').id).not.toBe(heroTint('🦁Bảo An').id)
  })

  it('một lớp ba mươi em thì màu rải đều, không dồn về một tông', () => {
    // Băm đúng như lúc chạy thật: emoji cộng tên.
    const seeds = Array.from({ length: 30 }, (_, i) => `🦊Học sinh ${i + 1}`)
    const used = new Set(seeds.map((seed) => heroTint(seed).id))
    // Mười hai tông, ba mươi hạt giống: dồn xuống dưới bảy tông là phép băm hỏng.
    expect(used.size).toBeGreaterThanOrEqual(7)
  })

  it('tên rỗng vẫn ra một màu hợp lệ chứ không vỡ', () => {
    expect(HERO_TINTS).toContain(heroTint(''))
  })
})

describe('hình của nhân vật', () => {
  it('emoji quyết định HÌNH, tên chỉ quyết định màu', () => {
    for (const emoji of ['🦊', '🐼', '🐢']) {
      const shape = creatureFromAvatar(emoji)
      for (const name of ['Bảo An', 'Minh Bình', 'Chi Mai']) {
        expect(heroSprite(emoji, name).rows).toEqual(HERO_CREATURES[shape].rows)
      }
    }
  })

  it('ba góc nhìn sau khi tô màu vẫn là lưới vuông vắn, đúng bảng màu', () => {
    for (const emoji of ['🦊', '🐼', '🐢']) {
      for (const name of ['Bảo An', 'Minh Bình', 'Chi Mai', 'Dũng', 'Én']) {
        const views = heroViews(emoji, name)
        for (const view of [views.down, views.up, views.side]) {
          expect(validateSprite(view)).toEqual([])
          expect(spriteSize(view)).toEqual({ width: 16, height: 16 })
        }
      }
    }
  })

  /*
    Tô lại một bảng màu là dựng một đối tượng mới, và `PixelSprite` vẽ lại canvas
    mỗi khi hình đổi DANH TÍNH. Không nhớ lại thì cả bản đồ tô lại từng con một,
    sáu mươi lần một giây.
  */
  it('cùng một (linh vật, tên) trả về ĐÚNG MỘT đối tượng, không tô lại', () => {
    expect(heroViews('🦊', 'Bảo An')).toBe(heroViews('🦊', 'Bảo An'))
    expect(heroSprite('🐼', 'Minh Bình')).toBe(heroSprite('🐼', 'Minh Bình'))
  })

  it('tông màu gốc dùng thẳng hình gốc, không tô lại làm gì', () => {
    const plain = HERO_TINTS[0]!
    // Tìm một cái tên rơi vào tông gốc, rồi kiểm nó không đi qua bước tô màu.
    const name = Array.from({ length: 60 }, (_, i) => `ten${i}`).find(
      (candidate) => heroTint(`🦊${candidate}`).id === plain.id,
    )
    expect(name, 'không có tên nào rơi vào tông gốc - sửa danh sách thử').toBeTruthy()
    expect(heroViews('🦊', name!)).toBe(CREATURE_VIEWS.fox)
  })
})

describe('hình theo hướng đi', () => {
  it('mỗi hướng ra đúng góc nhìn của chính linh vật đó', () => {
    const views = heroViews('🐼', 'Bảo An')
    expect(heroViewFor('🐼', 'Bảo An', 'up').sprite).toBe(views.up)
    expect(heroViewFor('🐼', 'Bảo An', 'down').sprite).toBe(views.down)
    expect(heroViewFor('🐼', 'Bảo An', 'right').sprite).toBe(views.side)
  })

  it('đi sang trái dùng lại hình nghiêng nhưng lật gương', () => {
    const left = heroViewFor('🦊', 'Minh Bình', 'left')
    const right = heroViewFor('🦊', 'Minh Bình', 'right')
    expect(left.sprite).toBe(right.sprite)
    expect(left.flip).toBe(true)
    expect(right.flip).toBe(false)
  })

  it('tô màu rồi thì nhìn từ sau vẫn KHÔNG thấy mắt', () => {
    for (const name of ['Bảo An', 'Minh Bình', 'Chi Mai']) {
      expect(heroViews('🦊', name).up.rows.join('')).not.toContain('P')
    }
  })
})
