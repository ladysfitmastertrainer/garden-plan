import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearCustomContinent,
  customContinent,
  customContinentSavedAt,
  mergeContent,
  replaceContent,
  sanitiseContent,
  setCustomContinent,
  continentId,
  type CustomContent,
} from '../../content/custom'
import { CONTINENTS, cellKind, continentFor, validateContinent } from './continent'

/** Lưới rỗng toàn biển, để dựng bản đồ thử từ đó. */
const blank = (): string[] => Array.from({ length: 12 }, () => '.'.repeat(12))

/** Một bản đồ khác hẳn bản gốc, chỉ cần khác chứ không cần hợp lệ. */
function drawn(): string[] {
  const rows = blank()
  rows[5] = '...TTCVV....'
  rows[6] = '...DDNN.....'
  return rows
}

const empty: CustomContent = { questions: [], hidden: [], skillNames: [], continents: [] }

beforeEach(() => {
  replaceContent({ ...empty })
})

describe('bản đồ tự vẽ chồng lên bản gốc', () => {
  it('chưa vẽ gì thì dùng đúng bản trong mã nguồn', () => {
    expect(customContinent(3)).toBeNull()
    expect(continentFor(3).rows).toEqual(CONTINENTS[3].rows)
  })

  it('vẽ xong thì bản đồ của lớp đó đổi theo', () => {
    setCustomContinent(3, drawn())

    expect(continentFor(3).rows).toEqual(drawn())
    expect(continentFor(3).rows).not.toEqual(CONTINENTS[3].rows)
  })

  it('chỉ đổi đúng lớp được vẽ, các lớp khác giữ nguyên', () => {
    setCustomContinent(3, drawn())

    for (const grade of [1, 2, 4, 5] as const) {
      expect(continentFor(grade).rows).toEqual(CONTINENTS[grade].rows)
    }
  })

  it('giữ nguyên tên vùng đất và màu biển của bản gốc', () => {
    // Trình vẽ chỉ sửa lưới ô. Đổi luôn cả tên lục địa thì trẻ mất mốc quen thuộc.
    setCustomContinent(3, drawn())

    expect(continentFor(3).title).toBe(CONTINENTS[3].title)
    expect(continentFor(3).sea).toEqual(CONTINENTS[3].sea)
  })

  it('những nơi đọc ô trên bản đồ cũng thấy bản mới', () => {
    /*
      Đây mới là phép kiểm quan trọng. Vẽ lại bản đồ mà `cellKind` vẫn đọc bản
      gốc thì trẻ đi trên một lục địa vô hình: màn hình vẽ một đằng, chân bước
      một nẻo.
    */
    const rows = blank()
    rows[4] = '....TTTT....'
    setCustomContinent(2, rows)

    expect(cellKind(2, 4, 4)).toBe('math')
    expect(cellKind(2, 0, 0)).toBe('sea')
  })

  it('trả về bản gốc thì mọi thứ về như cũ', () => {
    setCustomContinent(4, drawn())
    expect(continentFor(4).rows).toEqual(drawn())

    clearCustomContinent(4)

    expect(customContinent(4)).toBeNull()
    expect(continentFor(4).rows).toEqual(CONTINENTS[4].rows)
  })

  it('bản gốc trong mã nguồn không bao giờ bị sửa', () => {
    // `setCustomContinent` nhận vào mảng của nơi gọi; nếu nó giữ tham chiếu thì
    // một lần sửa tại chỗ là hỏng luôn hằng số dùng chung cho cả app.
    const before = [...CONTINENTS[5].rows]
    const rows = drawn()
    setCustomContinent(5, rows)
    rows[0] = 'TTTTTTTTTTTT'

    expect(CONTINENTS[5].rows).toEqual(before)
    expect(continentFor(5).rows[0]).not.toBe('TTTTTTTTTTTT')
  })

  it('nhớ mốc thời gian lưu, để màn hình nói được "đã lưu lúc nào"', () => {
    expect(customContinentSavedAt(1)).toBeNull()

    const before = Date.now()
    setCustomContinent(1, drawn())
    const at = customContinentSavedAt(1)

    expect(at).not.toBeNull()
    expect(at!).toBeGreaterThanOrEqual(before)
  })
})

describe('bản đồ tự vẽ đi qua đường đồng bộ', () => {
  it('hai máy sửa cùng một lớp thì bản mới hơn thắng, không thành hai bản đồ', () => {
    /*
      Lý do id cố định theo lớp. Nếu mỗi máy sinh một uuid riêng thì hợp nhất ra
      hai bản đồ cho lớp 3, và không ai nói được bản nào đang có hiệu lực.
    */
    const cu: CustomContent = {
      ...empty,
      continents: [
        { id: continentId(3), grade: 3, value: blank(), updatedAt: 1000, deletedAt: null, ownerId: 'co-ha' },
      ],
    }
    const moi: CustomContent = {
      ...empty,
      continents: [
        { id: continentId(3), grade: 3, value: drawn(), updatedAt: 2000, deletedAt: null, ownerId: 'co-ha' },
      ],
    }

    const merged = mergeContent(cu, moi)

    expect(merged.continents).toHaveLength(1)
    expect(merged.continents[0]!.value).toEqual(drawn())
  })

  it('lệnh trả về bản gốc từ máy khác cũng thắng theo mốc thời gian', () => {
    const con: CustomContent = {
      ...empty,
      continents: [
        { id: continentId(2), grade: 2, value: drawn(), updatedAt: 1000, deletedAt: null, ownerId: 'co-ha' },
      ],
    }
    const daBo: CustomContent = {
      ...empty,
      continents: [
        { id: continentId(2), grade: 2, value: drawn(), updatedAt: 2000, deletedAt: 2000, ownerId: 'co-ha' },
      ],
    }

    replaceContent(mergeContent(con, daBo))

    expect(customContinent(2)).toBeNull()
    expect(continentFor(2).rows).toEqual(CONTINENTS[2].rows)
  })

  it('dữ liệu méo từ máy chủ bị nắn về 12×12 chứ không làm hỏng bản đồ', () => {
    const meo = sanitiseContent({
      continents: [
        { grade: 3, value: ['TT', '...'], updatedAt: 5, deletedAt: null, ownerId: null },
      ],
    })

    expect(meo.continents).toHaveLength(1)
    expect(meo.continents[0]!.value).toHaveLength(12)
    for (const row of meo.continents[0]!.value) expect(row).toHaveLength(12)
  })

  it('bỏ hẳn bản đồ có ký tự lạ - thà dùng bản gốc còn hơn dựng bậy', () => {
    const rows = blank()
    rows[0] = 'XXXXXXXXXXXX'
    const out = sanitiseContent({
      continents: [{ grade: 3, value: rows, updatedAt: 5, deletedAt: null, ownerId: null }],
    })

    expect(out.continents).toHaveLength(0)
  })

  it('bỏ bản đồ ghi lớp không có thật', () => {
    const out = sanitiseContent({
      continents: [{ grade: 9, value: blank(), updatedAt: 5, deletedAt: null, ownerId: null }],
    })

    expect(out.continents).toHaveLength(0)
  })
})

describe('trình vẽ vẫn soi lỗi như cũ', () => {
  it('năm bản đồ gốc đều hợp lệ', () => {
    for (const grade of [1, 2, 3, 4, 5] as const) {
      expect(validateContinent(CONTINENTS[grade].rows)).toEqual([])
    }
  })

  it('bản vẽ dở dang thì báo lỗi, và đó là thứ khoá nút Lưu', () => {
    expect(validateContinent(blank()).length).toBeGreaterThan(0)
  })
})
