/**
 * SỰ KIỆN 20/10: BỐN TRÙM SẤM.
 *
 * Đúng 0h00 ngày 20/10/2026 (giờ Việt Nam), mỗi môn có một con TRÙM ẨN thức
 * dậy trong vùng đất của môn ấy. Hết ngày 20/10 thì cả sự kiện biến mất.
 *
 *   - Trước giờ G: trên bản đồ thế giới có đồng hồ đếm ngược. Trong vùng đất
 *     đã có sẵn một DẤU TIA SÉT in mờ dưới mặt đất - chỗ con trùm sẽ hiện ra.
 *     Trẻ tinh mắt có thể đi tìm trước, nhớ chỗ, rồi đúng ngày quay lại.
 *   - Trong ngày 20/10: con trùm chưa bị hạ thì cả vùng đất của nó dính một
 *     LỜI NGUYỀN (xem `CURSES`) - mọi trận ở đó khó hơn một chút. Bước lên đúng
 *     dấu tia sét là gặp nó.
 *   - Hạ được thì nhận một món đồ ĐỘC QUYỀN (chỉ có ở sự kiện này) và vàng.
 *
 * Chỗ dấu tia sét: NGẪU NHIÊN THEO TỪNG EM - hai bạn cùng lớp không chỉ chỗ cho
 * nhau được - nhưng cố định với chính em ấy, để tìm ra từ trước thì đúng ngày
 * quay lại vẫn thấy đúng chỗ. Chọn ở góc khuất: cạnh cây, đá, vách - xa đường
 * đi, xa cổng chặng. Xem `lightningSpot`.
 */

import type { BattleState, Enemy } from '../engine/battle'
import type { RouteMap } from '../features/world/routemap'
import { WALKABLE, type TileKind } from '../features/pixel/tiles'
import { createRng } from '../engine/rng'
import type { Subject } from './types'

/** Mã sự kiện - dùng làm khoá lưu "đã hạ con nào" trong tiến độ của trẻ. */
export const EVENT_ID = '2010-2026'

/** 0h00 ngày 20/10/2026 giờ Việt Nam (UTC+7). */
export const EVENT_START = Date.UTC(2026, 9, 19, 17, 0, 0)
/** 0h00 ngày 21/10/2026 giờ Việt Nam - sự kiện khép lại. */
export const EVENT_END = Date.UTC(2026, 9, 20, 17, 0, 0)

export type EventPhase = 'before' | 'live' | 'over'

/**
 * Giờ hiện tại của sự kiện.
 *
 * Ngoài bản chạy thật, thêm \`?eventNow=2026-10-20T09:00:00%2B07:00\` vào địa chỉ
 * để xem trước sự kiện mà không phải chờ - chỉ cho người làm game, bản chạy thật
 * luôn dùng giờ máy.
 */
export function eventNow(): number {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const forced = new URLSearchParams(window.location.search).get('eventNow')
    const at = forced ? Date.parse(forced) : NaN
    if (!Number.isNaN(at)) return at
  }
  return Date.now()
}

export function eventPhase(now: number = eventNow()): EventPhase {
  if (now < EVENT_START) return 'before'
  if (now < EVENT_END) return 'live'
  return 'over'
}

/** "15 ngày 06:12:33" - đếm ngược cho trẻ đọc được. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const pad = (n: number) => String(n).padStart(2, '0')
  const clock = `${pad(Math.floor((total % 86400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`
  return days > 0 ? `${days} ngày ${clock}` : clock
}

// --- Lời nguyền -----------------------------------------------------------------

export type CurseKind = 'weaken' | 'fury' | 'hurry' | 'tough'

export interface Curse {
  kind: CurseKind
  name: string
  /** Một câu cho trẻ: chuyện gì đang xảy ra với các trận trong vùng này. */
  text: string
}

/**
 * Lời nguyền mỗi con trùm ẩn phủ lên vùng đất của nó, cho tới khi bị hạ.
 *
 * Nhẹ thôi - một trận thường vẫn thắng được - nhưng đủ để thấy: đây là lý do
 * phải đi tìm con trùm, chứ không chỉ là một trận thưởng thêm.
 */
export const CURSES: Record<CurseKind, Curse> = {
  weaken: { kind: 'weaken', name: 'Sấm Rút Sức', text: 'Thú của con vào trận chỉ còn 80% máu.' },
  fury: { kind: 'fury', name: 'Mực Sấm Cuồng Nộ', text: 'Quái trong vùng đánh mạnh hơn 25%.' },
  hurry: { kind: 'hurry', name: 'Trống Sấm Dồn Dập', text: 'Thời gian đỡ đòn ngắn đi 30%.' },
  tough: { kind: 'tough', name: 'Giáp Sấm Bạch Hổ', text: 'Quái trong vùng trâu hơn, thêm 20% máu.' },
}

// --- Bốn trùm ẩn ------------------------------------------------------------------

export interface HiddenBoss {
  subject: Subject
  name: string
  emoji: string
  /** Tên kỹ năng riêng, hiện ở hộp thoại chạm mặt. */
  skill: string
  /** Kỹ năng ấy làm gì - một câu cho trẻ. */
  skillText: string
  /**
   * Những nét làm nên kỹ năng, mượn từ bộ luật của trùm trong tháp (giáp, đổi
   * hệ, hồi máu khi trẻ sai, nổi giận) - xem \`Enemy\` trong \`engine/battle.ts\`.
   * Tính theo máu của con trùm vùng đất nó thay chỗ, nên nó mạnh NGANG trùm bàn
   * đó ở mọi lớp.
   */
  mechanics: (maxHp: number) => Partial<Enemy>
  curse: CurseKind
  /** Món đồ độc quyền rơi ra khi hạ nó - xem \`EVENT_ITEMS\` trong \`engine/rewards.ts\`. */
  rewardItemId: string
}

export const HIDDEN_BOSSES: Record<Subject, HiddenBoss> = {
  math: {
    subject: 'math',
    name: 'Kỳ Lân Sấm Số',
    emoji: '🦄',
    skill: 'Sấm Đổi Hệ',
    skillText: 'Cứ hai câu nó đổi nguyên tố một lần, và có giáp sấm chặn đòn sai hệ.',
    mechanics: () => ({ shiftEvery: 2, armor: 4 }),
    curse: 'weaken',
    rewardItemId: 'sung-sam-ky-lan',
  },
  vietnamese: {
    subject: 'vietnamese',
    name: 'Giao Long Mực Sấm',
    emoji: '🐉',
    skill: 'Hút Mực Hồi Sinh',
    skillText: 'Mỗi câu con sai, nó hút mực hồi máu. Còn 40% máu thì nổi giận, đánh mạnh hơn.',
    mechanics: (maxHp) => ({ regenOnMiss: Math.round(maxHp * 0.08), enrageAt: 0.4, enrageAttackScale: 1.5 }),
    curse: 'fury',
    rewardItemId: 'ngoc-muc-giao-long',
  },
  music: {
    subject: 'music',
    name: 'Lôi Điểu Trống Đồng',
    emoji: '🦅',
    skill: 'Nhịp Sấm Trống Đồng',
    skillText: 'Cứ ba câu nó đổi nguyên tố. Còn nửa máu thì nổi giận, đánh dồn dập hơn.',
    mechanics: () => ({ shiftEvery: 3, enrageAt: 0.5, enrageAttackScale: 1.4 }),
    curse: 'hurry',
    rewardItemId: 'long-vu-loi-dieu',
  },
  ethics: {
    subject: 'ethics',
    name: 'Bạch Hổ Sấm Sét',
    emoji: '🐯',
    skill: 'Giáp Sấm Hộ Thân',
    skillText: 'Giáp dày chặn đòn sai hệ, và mỗi câu con chọn chưa hay nó lại hồi máu.',
    mechanics: (maxHp) => ({ armor: 6, regenOnMiss: Math.round(maxHp * 0.06) }),
    curse: 'tough',
    rewardItemId: 'nanh-bach-ho',
  },
}

/** Vàng thưởng thêm khi hạ một trùm ẩn, ngoài món đồ độc quyền. */
export const EVENT_GOLD = 300

/** Con trùm ẩn của môn này đã bị em ấy hạ chưa. */
export function hiddenBossBeaten(beaten: string[] | undefined, subject: Subject): boolean {
  return (beaten ?? []).includes(`${EVENT_ID}:${subject}`)
}

export function beatenKey(subject: Subject): string {
  return `${EVENT_ID}:${subject}`
}

// --- Chỗ dấu tia sét ------------------------------------------------------------

/** Mặt đất trơn đứng lên được - dấu chỉ in ở những ô này, không in lên đường hay cổng. */
const GROUND: ReadonlySet<TileKind> = new Set<TileKind>(['grass', 'sand', 'highland', 'hollow', 'caveFloor', 'ash', 'canopy'])

/**
 * Ô in dấu tia sét trên một tấm bản đồ, cố định theo \`seed\` (thường là id của
 * em + vùng đất).
 *
 * GIẤU KỸ: chấm điểm từng ô mặt đất theo độ khuất - càng nhiều ô chắn đường
 * (cây, đá, vách, nước) quanh nó càng cao điểm, càng xa đường đi và cổng chặng
 * càng cao điểm - rồi bốc ngẫu nhiên trong nhóm khuất nhất. Một cái dấu nằm
 * giữa đường thì ai đi ngang cũng giẫm phải; nằm trong một góc kẹt giữa hai gốc
 * cây thì phải cố ý đi tìm mới thấy.
 */
export function lightningSpot(map: RouteMap, seed: string): { x: number; y: number } | null {
  const taken = new Set<string>([
    `${map.start.x},${map.start.y}`,
    ...map.gates.map((g) => `${g.x},${g.y}`),
    ...map.secrets.map((s) => `${s.x},${s.y}`),
  ])
  const inside = (rect: { left: number; right: number; top: number; bottom: number } | null, x: number, y: number) =>
    rect !== null && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  const tile = (x: number, y: number): TileKind | null => map.tiles[y]?.[x] ?? null

  const scored: Array<{ x: number; y: number; score: number }> = []
  for (let y = 1; y < map.height - 1; y++) {
    for (let x = 1; x < map.width - 1; x++) {
      const here = tile(x, y)
      if (!here || !GROUND.has(here) || taken.has(`${x},${y}`)) continue
      if (inside(map.arena, x, y) || inside(map.den, x, y)) continue

      let blocked = 0
      let nearPath = false
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const n = tile(x + dx, y + dy)
          if (n === null || !WALKABLE[n]) blocked++
          if (n === 'path' || n === 'gate' || n === 'door' || n === 'stairs') nearPath = true
        }
      }
      // Phải còn ít nhất một lối vào - một ô bị vây kín thì không ai tới được.
      const reachable = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => {
        const n = tile(x + dx!, y + dy!)
        return n !== null && WALKABLE[n]
      })
      if (!reachable) continue
      scored.push({ x, y, score: blocked * 2 - (nearPath ? 5 : 0) })
    }
  }
  if (scored.length === 0) return null

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]!.score
  // Nhóm khuất nhất: điểm cao nhất, nới thêm một bậc để có đủ chỗ mà bốc.
  const pool = scored.filter((s) => s.score >= best - 2)
  const rng = createRng(`${EVENT_ID}-${seed}`)
  const pick = rng.pick(pool)
  return { x: pick.x, y: pick.y }
}

// --- Áp lời nguyền vào một trận ---------------------------------------------------

/**
 * Trận đấu sau khi dính lời nguyền của con trùm ẩn đang nấp trong vùng.
 *
 * Gọi NGAY SAU khi dựng trận, trước khi trẻ thấy gì - con số máu, sát thương,
 * đồng hồ đều phải là con số đã nguyền ngay từ khung hình đầu tiên. Thêm một
 * dòng vào nhật ký trận để có chỗ nói ra là vì sao.
 */
export function curseBattle(state: BattleState, kind: CurseKind): BattleState {
  const curse = CURSES[kind]
  const log = [...state.log, `⚡ Lời nguyền ${curse.name}: ${curse.text}`]
  switch (kind) {
    case 'weaken': {
      const hp = Math.max(1, Math.round(state.pet.hp * 0.8))
      return { ...state, pet: { ...state.pet, hp }, playerHp: hp, log }
    }
    case 'fury':
      return { ...state, enemy: { ...state.enemy, attack: Math.round(state.enemy.attack * 1.25) }, log }
    case 'hurry':
      return { ...state, defendLimitMs: Math.round(state.defendLimitMs * 0.7), log }
    case 'tough': {
      const maxHp = Math.round(state.enemy.maxHp * 1.2)
      return { ...state, enemy: { ...state.enemy, maxHp }, enemyHp: maxHp, log }
    }
  }
}
