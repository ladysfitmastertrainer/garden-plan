/**
 * Sắp hai chiêu mang ra trận, cho CON ĐANG ĐI THEO.
 *
 * Con thú có bốn chiêu, trẻ cầm được hai. Đó là cả quyết định: hai chiêu nhà
 * cho chắc ăn, hay bỏ một chiêu nhà để cầm chiêu mượn hệ - thứ chỉ đáng giá khi
 * gặp đúng con quái khắc mình - hay dồn một ô cho chiêu cuối, vốn mạnh gấp đôi
 * nhưng phải nghỉ ba lượt sau mỗi lần tung.
 *
 * Màn hình này CHỈ nói về một con thú. Trước đây nó gom chiêu của cả bốn môn và
 * mở dần theo cấp của trẻ, vì ra trận là cả một đội ba con. Giờ đi một con, nên
 * gom chiêu của mười hai con lại rồi bắt trẻ tự lọc là bày ra một danh sách mà
 * ba phần tư không dùng được.
 *
 * Đổi con đi theo ở ngay trên, trong bộ sưu tập thú - và khi đổi thì bảng này
 * đổi theo, vì bộ chiêu lưu riêng cho từng con.
 */

import { SUBJECT_ELEMENT, type Subject } from '../../content/types'
import { companionOf } from '../../content/pets'
import { EQUIPPED_SLOTS, allSpellsOf, resolvePetLoadout, spellLockOf, unlockedSpells } from '../../engine/loadout'
import { petLevel } from '../../engine/pets'
import { useGame } from '../../store/game'
import { EFFECT_UI } from '../battle/effects'
import { petSpriteFor } from './PetCollection'
import { PixelSprite } from '../pixel/sprite'

const ELEMENT_COLOR: Record<Subject, string> = {
  math: '#f59e0b',
  vietnamese: '#ef4476',
  music: '#8b5cf6',
  ethics: '#0ea5e9',
}

export function SpellLoadout() {
  const student = useGame((s) => s.student)
  const progress = useGame((s) => s.progress)
  const setLoadout = useGame((s) => s.setLoadout)

  if (!student) return null

  /*
    Con thú dựng qua ĐÚNG hàm mà trận đấu dùng.

    Kho đồ không biết sắp tới trẻ sẽ đánh vùng nào, nên truyền tạm môn của lớp
    đang học. Điều đó chỉ đổi kết quả khi trẻ CHƯA từng chọn con nào - và lúc
    ấy bảng này bày ra con mà `companionOf` sẽ phát, tức vẫn đúng con sẽ ra
    trận ở vùng ấy.
  */
  const pet = companionOf(progress.pets, progress.companion, 'math', progress.petXp ?? {})
  const xp = progress.petXp?.[pet.id] ?? 0
  const all = allSpellsOf(pet)
  const unlocked = unlockedSpells(pet, xp)
  const picked = resolvePetLoadout(progress.petLoadout?.[pet.id], unlocked)

  /**
   * Bấm vào một chiêu là CHỌN nó, luôn luôn.
   *
   * Đủ hai ô rồi thì chiêu cũ nhất bị đẩy ra, chứ không phải báo "hết chỗ" rồi
   * bắt trẻ đi bỏ chọn một cái. Trẻ bảy tuổi bấm vào thứ mình muốn và mong nó
   * xảy ra; một thông báo từ chối ở đây là một bức tường.
   *
   * Bấm vào chiêu đang cầm thì bỏ nó ra - nhưng không bao giờ xuống dưới một
   * chiêu, vì một ô trống nghĩa là vào trận có lúc không còn nút nào để bấm.
   */
  const toggle = (spellId: string) => {
    const has = picked.includes(spellId)
    const next = has
      ? picked.length > 1
        ? picked.filter((id) => id !== spellId)
        : picked
      : [...picked, spellId].slice(-EQUIPPED_SLOTS)
    setLoadout(pet.id, next)
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-extrabold">✨ Chiêu mang ra trận</h2>
        <p className="text-base opacity-70">
          {picked.length}/{EQUIPPED_SLOTS} ô
        </p>
      </div>

      <div className="card flex items-center gap-2" style={{ padding: 10 }}>
        <PixelSprite sprite={petSpriteFor(pet.sprite, pet.element)} scale={2} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight">{pet.name}</p>
          <p className="text-sm opacity-70">
            Cấp {petLevel(xp)} · đã mở {unlocked.length}/{all.length} chiêu
          </p>
        </div>
      </div>

      <p className="text-base opacity-70">
        Bấm để chọn. Đủ hai chiêu rồi mà bấm thêm thì chiêu cũ nhất được thay ra.
      </p>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {all.map((spell) => {
          const lock = spellLockOf(pet, xp, spell.id)
          const on = picked.includes(spell.id)
          const ui = spell.effect ? EFFECT_UI[spell.effect.kind] : null
          const borrowed = spell.element !== pet.element

          return (
            <button
              key={spell.id}
              type="button"
              onClick={() => toggle(spell.id)}
              disabled={lock.locked}
              className="card text-left"
              style={{
                padding: 10,
                borderColor: lock.locked ? undefined : ELEMENT_COLOR[spell.element],
                borderWidth: on ? 5 : undefined,
                background: lock.locked ? '#eef1f5' : on ? '#fff3c4' : undefined,
                opacity: lock.locked ? 0.6 : 1,
              }}
            >
              <p className="text-base font-bold leading-tight">
                {spell.tier === 4 && '⚡ '}
                {spell.name}
                {on && ' ✓'}
              </p>
              <p
                className="text-sm leading-tight"
                style={{ color: lock.locked ? undefined : ELEMENT_COLOR[spell.element] }}
              >
                {SUBJECT_ELEMENT[spell.element]} · {Math.round(spell.power * 100)}% sát thương
              </p>

              {/* Chiêu mượn hệ phải NÓI RÕ nó để làm gì, nếu không thì nhìn nó
                  chỉ là một chiêu lạc hệ và trẻ sẽ không bao giờ cầm. */}
              {borrowed && !lock.locked && (
                <p className="text-sm leading-tight opacity-70">
                  Mượn hệ khác - đánh được cả quái khắc {SUBJECT_ELEMENT[pet.element]}
                </p>
              )}
              {ui && !lock.locked && (
                <p className="text-sm leading-tight" style={{ color: ui.color }}>
                  {ui.icon} {ui.hint} · nghỉ 3 lượt
                </p>
              )}
              {lock.locked && (
                <p className="text-sm leading-tight opacity-80">
                  🔒 {lock.atLevel ? `Tiến hoá ở cấp ${lock.atLevel} mới học được` : 'Chưa mở'}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
