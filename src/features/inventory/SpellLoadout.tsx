/**
 * Sắp bộ chiêu mang ra trận.
 *
 * Số ô nở theo cấp: 2 ô lúc mới vào, 3 ô ở cấp 5, 4 ô ở cấp 10. Ít ô không phải
 * để làm khó - hai lựa chọn là đủ để có một quyết định thật (đánh khắc hệ hay
 * đánh mạnh), còn chín cái nút thì trẻ lớp 1 bấm bừa cái gần nhất.
 *
 * Danh sách phép BIẾT được thì lớn dần theo đường khác: thu phục thêm thú, và
 * thú tiến hoá ở cấp 5 học thêm phép mới.
 */

import { buildTeam } from '../../content/pets'
import { SUBJECTS, SUBJECT_ELEMENT, SUBJECT_LABEL, type Subject } from '../../content/types'
import {
  MAX_SLOTS,
  knownSpells,
  nextSpellLevel,
  nextSlotLevel,
  resolveLoadout,
  usableSlots,
} from '../../engine/loadout'
import { levelFromTotalXp } from '../../engine/rewards'
import { useGame } from '../../store/game'

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

  const { level } = levelFromTotalXp(student.totalXp)

  /**
   * Gom phép của CẢ BỐN MÔN.
   *
   * Đội ra trận được dựng theo môn đang đánh, nên chỉ nhìn một môn là danh sách
   * thiếu hẳn ba phần tư. Trẻ sắp chiêu ở kho đồ, lúc đó chưa biết sắp tới sẽ
   * đánh vùng nào.
   */
  const known = knownSpells(
    SUBJECTS.flatMap((subject) => buildTeam(progress.pets ?? [], subject, 3, progress.petXp ?? {})),
    level,
  )

  const slots = usableSlots(level, known.length)
  const nextSlot = nextSlotLevel(level)
  const nextSpell = nextSpellLevel(level)
  const picked = resolveLoadout(progress.loadout, known, slots)

  /**
   * Bấm vào một chiêu là chọn nó, LUÔN LUÔN.
   *
   * Khi đã đủ ô thì chiêu mới đẩy chiêu CŨ NHẤT ra chứ không khoá nút lại. Với
   * trẻ 6-10 tuổi, một nút bấm không ăn thua là một nút hỏng - trẻ bấm lại vài
   * lần rồi bỏ đi, chứ không suy ra rằng mình phải gỡ bớt một cái ở chỗ khác.
   */
  const toggle = (id: string) => {
    if (picked.includes(id)) {
      // Trừ đúng một chỗ: gỡ cái cuối cùng là ra trận không có nút nào để bấm.
      if (picked.length <= 1) return
      setLoadout(picked.filter((item) => item !== id))
      return
    }
    const room = picked.length >= slots ? picked.slice(1) : picked
    setLoadout([...room, id])
  }

  return (
    <section className="card grid gap-3">
      <div>
        <h2 className="text-xl font-extrabold">✨ Bộ chiêu</h2>
        {/* Hai câu, hai chuyện khác nhau: HỌC thêm chiêu, và MANG thêm chiêu.
            Gộp làm một là trẻ tưởng lên cấp thì tự dưng đánh mạnh hơn. */}
        <p className="text-base opacity-70">
          Con đã học {known.length} chiêu.{' '}
          {nextSpell === null
            ? 'Con đã học hết bảng chiêu rồi!'
            : `Lên cấp ${nextSpell} con học thêm một chiêu nữa.`}
        </p>
        <p className="text-base opacity-70">
          Mỗi trận mang được {slots} chiêu.{' '}
          {nextSlot === null
            ? `Đã mở hết ${MAX_SLOTS} ô.`
            : `Lên cấp ${nextSlot} sẽ mở thêm một ô.`}
        </p>
      </div>

      {/* Các ô đã sắp, đọc từ trái sang - đúng thứ tự sẽ hiện trong trận. */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: slots }, (_, index) => {
          const id = picked[index]
          const spell = known.find((item) => item.id === id)
          return (
            <div
              key={index}
              className="flex flex-1 items-center justify-center px-3 py-2 text-center"
              style={{
                minWidth: 130,
                minHeight: 56,
                borderRadius: 10,
                border: `4px dashed ${spell ? ELEMENT_COLOR[spell.element] : 'color-mix(in srgb, var(--color-ink) 20%, transparent)'}`,
                background: spell ? 'var(--color-paper)' : 'var(--color-paper-sunk)',
              }}
            >
              {spell ? (
                <span>
                  <span className="block text-base font-extrabold leading-tight">{spell.name}</span>
                  <span
                    className="pixel-font block text-sm leading-tight"
                    style={{ color: ELEMENT_COLOR[spell.element] }}
                  >
                    {SUBJECT_ELEMENT[spell.element]}
                  </span>
                </span>
              ) : (
                <span className="text-base opacity-50">ô trống</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid gap-2">
        <h3 className="text-lg font-extrabold">Chiêu đã học ({known.length})</h3>

        {known.length === 0 && (
          <p className="text-base opacity-70">
            Chưa có thú nào trong đội. Thu phục thú ở màn đi cảnh để học chiêu nhé!
          </p>
        )}

        {known.length <= slots && known.length > 0 && (
          <p className="text-base opacity-70">
            Con mang được cả {known.length} chiêu ra trận, chưa cần bỏ chiêu nào.
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {known.map((spell) => {
            const inUse = picked.includes(spell.id)
            // Chỉ khoá đúng một trường hợp: chiêu duy nhất còn lại trong bộ.
            const locked = inUse && picked.length <= 1
            return (
              <button
                key={spell.id}
                type="button"
                onClick={() => toggle(spell.id)}
                disabled={locked}
                aria-pressed={inUse}
                className="flex items-center gap-3 px-3 py-2 text-left"
                style={{
                  borderRadius: 10,
                  border: `4px solid ${inUse ? ELEMENT_COLOR[spell.element] : 'color-mix(in srgb, var(--color-ink) 12%, transparent)'}`,
                  background: inUse ? 'var(--color-brand-soft)' : 'var(--color-paper)',
                  minHeight: 60,
                }}
              >
                <span className="flex-1">
                  <span className="block text-base font-extrabold leading-tight">{spell.name}</span>
                  <span className="block text-sm leading-snug opacity-70">{spell.flavour}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span
                    className="pixel-font block text-sm"
                    style={{ color: ELEMENT_COLOR[spell.element] }}
                  >
                    {SUBJECT_LABEL[spell.element]}
                  </span>
                  <span className="pixel-font block text-base">
                    {Math.round(spell.power * 100)}%
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {picked.length >= slots && known.length > slots && (
          <p className="text-base opacity-70">
            Đã đủ {slots} ô. Chọn chiêu khác thì chiêu cũ nhất sẽ nhường chỗ.
          </p>
        )}
      </div>
    </section>
  )
}
