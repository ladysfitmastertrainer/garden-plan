/**
 * Bảng chọn chiêu của đấu trường.
 *
 * Cùng một quyết định với bảng ở trận đánh quái, nhưng KHÔNG dùng lại được
 * thành phần bên ấy: bảng kia đọc thẳng `BattleState` - một cỗ máy trạng thái
 * chỉ sống trong trình duyệt của một người. Ở đây trận đấu sống trên máy chủ và
 * về tới đây dưới dạng `PvpSide`, nên cái bảng phải nhận vào đúng những gì nó
 * cần: mấy chiêu, hệ của con thú bên kia, và chiêu cuối còn nghỉ mấy vòng.
 *
 * Nối hai bên bằng một bộ tham số chung thì được, nhưng cái giá là một thành
 * phần phải hiểu cả hai thế giới, và mỗi lần sửa một bên phải nghĩ cho bên kia.
 * Hai bảng nhỏ, cùng đọc một bảng màu và một bảng hiệu ứng (`battle/effects`),
 * thì rẻ hơn.
 *
 * ---- VÌ SAO BẢNG NÀY PHẢI GỌN HƠN BẢNG KIA ----
 *
 * Ở đây ĐỒNG HỒ VẪN CHẠY, và bạn kia đang ngồi đợi. Nên không có dòng "quái hệ
 * gì" ở trên đầu như bảng bên trận đánh quái - thông tin ấy đã nằm ngay trên
 * từng nút rồi ("KHẮC"), và một dòng nữa ở đây là một dòng nữa phải đọc trước
 * khi kịp bấm.
 */

import { SUBJECT_ELEMENT, type Subject } from '../../content/types'
import { matchupLabel, type Spell } from '../../engine/pets'
import { EFFECT_UI } from '../battle/effects'

const ELEMENT_COLOR: Record<Subject, string> = {
  math: '#f59e0b',
  vietnamese: '#ef4476',
  music: '#8b5cf6',
  ethics: '#0ea5e9',
}

export function PvpSpellPicker({
  spells,
  foeElement,
  cooldown,
  onCast,
}: {
  spells: Spell[]
  /** Hệ con thú bên kia. null với trận cũ không biết con thú - khi ấy không khắc ai. */
  foeElement: Subject | null
  cooldown: number
  onCast: (spellId: string) => void
}) {
  // Chiêu khắc chế xếp lên đầu, y như bên trận đánh quái - trẻ nhỏ không phải
  // dò, và hai màn hình không dạy hai thói quen khác nhau.
  const sorted = [...spells].sort((a, b) => {
    if (!foeElement) return 0
    const rank = (s: Spell) => {
      const m = matchupLabel(s.element, foeElement)
      return m === 'strong' ? 0 : m === 'neutral' ? 1 : 2
    }
    return rank(a) - rank(b)
  })

  return (
    <div
      className="pixel-panel w-full"
      style={{
        background: '#fff8dc',
        borderColor: '#b8860b',
        padding: '10px 12px',
        maxWidth: 560,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <p className="pixel-font text-center text-xl leading-none">CHỌN CHIÊU</p>

      <div
        className="mt-2 grid gap-2"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {sorted.map((spell) => {
          const matchup = foeElement ? matchupLabel(spell.element, foeElement) : 'neutral'
          const ui = spell.effect ? EFFECT_UI[spell.effect.kind] : null
          const cooling = spell.tier === 4 && cooldown > 0

          return (
            <button
              key={spell.id}
              type="button"
              onClick={() => onCast(spell.id)}
              disabled={cooling}
              className="pixel-panel flex items-center gap-2 text-left"
              style={{
                padding: '8px 10px',
                borderColor: cooling ? '#8a94a6' : ELEMENT_COLOR[spell.element],
                background: cooling ? '#dfe4ea' : matchup === 'strong' ? '#ffe9b8' : '#f8f8f0',
                minHeight: 56,
                opacity: cooling ? 0.7 : 1,
              }}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-bold leading-tight">
                  {spell.tier === 4 && '⚡ '}
                  {spell.name}
                </span>
                <span
                  className="pixel-font block text-base leading-tight"
                  style={{ color: cooling ? '#5a6472' : ELEMENT_COLOR[spell.element] }}
                >
                  {cooling
                    ? `Nghỉ ${cooldown} vòng nữa`
                    : `${SUBJECT_ELEMENT[spell.element]} · ${Math.round(spell.power * 100)}%`}
                </span>
                {ui && !cooling && (
                  <span className="block truncate text-sm leading-tight" style={{ color: ui.color }}>
                    {ui.icon} {ui.hint}
                  </span>
                )}
              </span>
              {!cooling && matchup === 'strong' && (
                <span
                  className="pixel-font shrink-0 px-2 text-base"
                  style={{ color: '#b4521f', background: '#ffd9a8', borderRadius: 4 }}
                >
                  🔥 KHẮC
                </span>
              )}
              {!cooling && matchup === 'weak' && <span className="shrink-0 text-lg opacity-60">🪨</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
