/**
 * Sprite viết tay bằng ký tự rất dễ gõ thiếu một ô mà mắt không thấy - hàng lệch
 * một điểm ảnh là cả nhân vật méo. Test này bắt lỗi đó ngay.
 */

import { describe, expect, it } from 'vitest'
import {
  ALL_SPRITES,
  BOSS_SPRITE,
  MONSTER_FAMILY,
  monsterSpriteFor,
  CREATURE_VIEWS,
  creatureFromAvatar,
  HERO_CREATURES,
  HERO_NAMES,
  viewFor,
} from './creatures'
import { spriteSize, validateSprite } from './sprite'
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
  PROP_PIN,
  PROP_PINE,
  PROP_PORTAL,
  PROP_SHRINE,
  PROP_STONE,
  PROP_TOWER,
  PROP_TREE,
} from './iso'

describe('sprite', () => {
  for (const [name, sprite] of Object.entries(ALL_SPRITES)) {
    it(`${name}: mọi hàng dài bằng nhau và dùng đúng bảng màu`, () => {
      expect(validateSprite(sprite)).toEqual([])
    })

    it(`${name}: đúng khổ 16×16`, () => {
      expect(spriteSize(sprite)).toEqual({ width: 16, height: 16 })
    })

    it(`${name}: có điểm ảnh, không phải khung rỗng`, () => {
      const filled = sprite.rows.join('').split('').filter((c) => c !== '.').length
      expect(filled).toBeGreaterThan(60)
    })

    it(`${name}: có mắt để nhìn ra là sinh vật`, () => {
      expect(sprite.rows.join('')).toContain('P')
    })
  }

  it('bắt được hàng bị lệch', () => {
    const broken = { palette: { B: '#fff' }, rows: ['BB', 'B'] }
    expect(validateSprite(broken).join(' ')).toContain('Hàng 1')
  })

  it('bắt được ký tự không có trong bảng màu', () => {
    const broken = { palette: { B: '#fff' }, rows: ['BX'] }
    expect(validateSprite(broken).join(' ')).toContain("'X'")
  })
})

describe('creatureFromAvatar', () => {
  it('hồ sơ cũ lưu emoji vẫn ra được một nhân vật hợp lệ', () => {
    for (const emoji of ['🦊', '🐼', '🐯', '🐨', '🦁', '🐸', '🐧', '🦄', '🐢', '🐙', '🦉', '🐝']) {
      expect(HERO_CREATURES[creatureFromAvatar(emoji)]).toBeDefined()
    }
  })

  it('emoji lạ thì rơi về nhân vật mặc định chứ không vỡ', () => {
    expect(creatureFromAvatar('🛸')).toBe('fox')
    expect(creatureFromAvatar('')).toBe('fox')
  })

  it('mỗi nhân vật đều có tên tiếng Việt', () => {
    for (const id of Object.keys(HERO_CREATURES) as Array<keyof typeof HERO_CREATURES>) {
      expect(HERO_NAMES[id]).toBeTruthy()
    }
  })
})

describe('sprite theo hướng đi', () => {
  for (const id of Object.keys(CREATURE_VIEWS) as Array<keyof typeof CREATURE_VIEWS>) {
    for (const view of ['down', 'up', 'side'] as const) {
      it(`${id}.${view}: lưới vuông vắn, đúng bảng màu`, () => {
        expect(validateSprite(CREATURE_VIEWS[id][view])).toEqual([])
        expect(spriteSize(CREATURE_VIEWS[id][view])).toEqual({ width: 16, height: 16 })
      })
    }

    it(`${id}: ba góc nhìn KHÁC NHAU, không phải cùng một hình`, () => {
      const { down, up, side } = CREATURE_VIEWS[id]
      expect(up.rows).not.toEqual(down.rows)
      expect(side.rows).not.toEqual(down.rows)
      expect(side.rows).not.toEqual(up.rows)
    })

    it(`${id}: nhìn từ sau thì KHÔNG thấy mắt`, () => {
      // Đi lên mà vẫn thấy mặt là lỗi dễ lọt nhất khi vẽ sprite theo hướng.
      expect(CREATURE_VIEWS[id].up.rows.join('')).not.toContain('P')
    })
  }
})

describe('viewFor', () => {
  it('mỗi hướng ra đúng góc nhìn', () => {
    expect(viewFor('fox', 'up').sprite).toBe(CREATURE_VIEWS.fox.up)
    expect(viewFor('fox', 'down').sprite).toBe(CREATURE_VIEWS.fox.down)
    expect(viewFor('fox', 'right').sprite).toBe(CREATURE_VIEWS.fox.side)
  })

  it('đi sang trái dùng lại hình nghiêng nhưng lật gương', () => {
    const left = viewFor('panda', 'left')
    const right = viewFor('panda', 'right')
    expect(left.sprite).toBe(right.sprite)
    expect(left.flip).toBe(true)
    expect(right.flip).toBe(false)
  })
})

describe('vật mốc trên đảo', () => {
  // Các prop này trước đây không có test nào ngó tới, trong khi chúng cũng là
  // lưới ký tự gõ tay y hệt nhân vật - và gõ thiếu một ô thì vật mốc méo hẳn.
  const PROPS = {
    ghim: PROP_PIN,
    'bàn tính': PROP_ABACUS,
    'bia đá': PROP_OBELISK,
    'tinh thể': PROP_CRYSTAL,
    'cây thông': PROP_PINE,
    nấm: PROP_MUSHROOM,
    'bục sách': PROP_BOOKSTAND,
    trống: PROP_DRUM,
    'đàn hạc': PROP_HARP,
    'cây dừa': PROP_PALM,
    'đèn lồng': PROP_LANTERN,
    miếu: PROP_SHRINE,
    'khóm hoa': PROP_FLOWERS,
    'lâu đài': PROP_CASTLE,
    tháp: PROP_TOWER,
    cây: PROP_TREE,
    'tháp chuông': PROP_BELLTOWER,
    'hải đăng': PROP_LIGHTHOUSE,
    cổng: PROP_PORTAL,
    bụi: PROP_BUSH,
    đá: PROP_STONE,
  }

  for (const [name, sprite] of Object.entries(PROPS)) {
    it(`${name}: mọi hàng dài bằng nhau và dùng đúng bảng màu`, () => {
      expect(validateSprite(sprite)).toEqual([])
    })

    it(`${name}: đúng khổ 16×16`, () => {
      expect(spriteSize(sprite)).toEqual({ width: 16, height: 16 })
    })
  }
})

describe('bầy quái của mỗi môn', () => {
  const SUBJECTS = ['math', 'vietnamese', 'music', 'ethics'] as const

  for (const subject of SUBJECTS) {
    it(`${subject}: bốn con KHÁC HÌNH nhau, không phải một hình sơn lại`, () => {
      const family = MONSTER_FAMILY[subject]
      expect(family).toHaveLength(4)

      const shapes = new Set(family.map((s) => s.rows.join('|')))
      expect(shapes.size).toBe(4)
    })

    it(`${subject}: con trùm khác hẳn cả bốn con thường`, () => {
      const boss = BOSS_SPRITE[subject].rows.join('|')
      for (const monster of MONSTER_FAMILY[subject]) {
        expect(monster.rows.join('|')).not.toBe(boss)
      }
    })
  }

  it('không con nào dùng chung hình với con của môn khác', () => {
    const all = SUBJECTS.flatMap((s) => [...MONSTER_FAMILY[s], BOSS_SPRITE[s]])
    expect(new Set(all.map((s) => s.rows.join('|'))).size).toBe(all.length)
  })

  it('cùng một biến thể luôn ra CÙNG MỘT object - giao diện không vẽ lại oan', () => {
    expect(monsterSpriteFor('math', 2, false)).toBe(monsterSpriteFor('math', 2, false))
  })

  it('số biến thể ngoài khoảng vẫn ra một con hợp lệ, không vỡ', () => {
    expect(monsterSpriteFor('math', 99, false)).toBeDefined()
    expect(monsterSpriteFor('math', -3, false)).toBeDefined()
  })
})
