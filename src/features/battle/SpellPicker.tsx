/**
 * Bảng chọn phép và dải đội thú.
 *
 * Đây là bước mới quan trọng nhất của trận đấu: trả lời đúng xong, trẻ được
 * chọn tung phép nào. Bảng này phải nói rõ phép nào khắc chế được con quái
 * trước mặt - nếu trẻ phải tự nhớ vòng khắc chế thì quyết định biến thành đoán
 * mò, mà đoán mò thì chán y như không có lựa chọn.
 *
 * Bảng ĐÈ LÊN khung trận chứ không nằm dưới đáy trang. Đặt ở dưới thì trên màn
 * hình dọc nó rơi khỏi tầm mắt, trẻ vừa trả lời đúng xong lại phải cúi xuống
 * tìm - mất đúng cái khoảnh khắc đáng lẽ phải sướng nhất. Hai cột cho gọn, quá
 * nhiều phép thì cuộn trong bảng.
 */

import { SUBJECT_ELEMENT, SUBJECT_LABEL, type Subject } from '../../content/types'
import { SPELLS } from '../../content/pets'
import { filterByLoadout } from '../../engine/loadout'
import { matchupLabel, teamAlive, type BattlePet } from '../../engine/pets'
import type { BattleState } from '../../engine/battle'
import { ALL_SPRITES, recolor } from '../pixel/creatures'
import { PixelSprite } from '../pixel/sprite'

/** Màu nhận diện của bốn nguyên tố, trùng màu môn học ở mọi nơi khác. */
const ELEMENT_COLOR: Record<Subject, string> = {
  math: '#f59e0b',
  vietnamese: '#ef4476',
  music: '#8b5cf6',
  ethics: '#0ea5e9',
}

/** Tô thú theo nguyên tố để nhìn hình là đoán được hệ. */
function petSprite(spriteId: string, element: Subject) {
  const base = ALL_SPRITES[spriteId] ?? ALL_SPRITES.slime!
  const tint: Record<Subject, Record<string, string>> = {
    math: { B: '#f2b23a', S: '#c4861f', '#': '#6b4410' },
    vietnamese: { B: '#ef6b90', S: '#c43f66', '#': '#6b1f36' },
    music: { B: '#a78bfa', S: '#7c5cd6', '#': '#3b2a6b' },
    ethics: { B: '#5fc9ea', S: '#3a9ac6', '#': '#154a63' },
  }
  return recolor(base, tint[element])
}

export function SpellPicker({
  battle,
  loadout,
  onCast,
}: {
  battle: BattleState
  /** Bộ chiêu trẻ đã sắp. Chỉ những phép trong đây mới hiện ra. */
  loadout: string[]
  onCast: (spellId: string, casterIndex: number) => void
}) {
  const enemyElement = battle.enemyElement

  // Liệt kê phép của MỌI con còn sống, không chỉ con đang đứng.
  //
  // Thú chỉ biết phép cùng hệ của mình. Nếu chỉ được dùng con đang đứng thì gặp
  // quái khắc hệ là cả ba nút đều "bị khắc" - trẻ có ba lựa chọn nhưng không có
  // quyết định nào. Cho đổi con chính là nước đi đúng, và đó cũng là cách
  // Prodigy làm.
  const all = battle.team.flatMap((p, index) =>
    p.hp <= 0
      ? []
      : p.pet.spellIds
          .map((id) => SPELLS[id])
          .filter((spell): spell is NonNullable<typeof spell> => Boolean(spell))
          .map((spell) => ({ spell, pet: p, index })),
  )
  // Chỉ hiện những phép trẻ đã sắp vào bộ, mỗi phép đúng một nút, và không bao
  // giờ nhiều hơn số ô. Bày hết ra thì trẻ lớp 1 bấm bừa cái gần nhất.
  const options = filterByLoadout(all, loadout, loadout.length)
  if (options.length === 0) return null

  // Phép khắc chế xếp lên đầu để trẻ nhỏ không phải dò cả danh sách.
  options.sort((a, b) => {
    const rank = (m: string) => (m === 'strong' ? 0 : m === 'neutral' ? 1 : 2)
    return (
      rank(matchupLabel(a.spell.element, enemyElement)) -
      rank(matchupLabel(b.spell.element, enemyElement))
    )
  })

  return (
    <div
      className="pixel-panel"
      style={{
        background: '#fff8dc',
        borderColor: '#b8860b',
        padding: '14px 16px',
        // Chiếm hết bề ngang khung trận để xếp được hai cột. Để bảng tự co theo
        // nội dung thì nó thành một cột hẹp và lựa chọn thứ tư trở đi bị khuất
        // dưới mép - trẻ không biết là còn phép nữa để chọn.
        width: '100%',
        maxWidth: 680,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Chỉ còn "CHỌN PHÉP": lời khen đã có nhãn riêng treo ngay trên khung trận,
          nói hai lần trong một màn hình là thừa. */}
      <p className="pixel-font text-center text-2xl leading-none">CHỌN PHÉP</p>
      <p className="mb-2 text-center text-sm opacity-75">
        Quái hệ{' '}
        <strong style={{ color: ELEMENT_COLOR[enemyElement] }}>
          {SUBJECT_ELEMENT[enemyElement]}
        </strong>
      </p>

      <div
        className="grid gap-2"
        style={{
          // 280px chứ không phải 210px: ở 210 thì tên phép dài như "Búa Phép Tính"
          // đụng vào nhãn "KHẮC" bên phải, và cả hai đè lên rìa nút.
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {options.map(({ spell, pet, index }) => {
          const matchup = matchupLabel(spell.element, enemyElement)
          return (
            <button
              key={`${index}-${spell.id}`}
              type="button"
              onClick={() => onCast(spell.id, index)}
              className="pixel-panel flex items-center gap-3 text-left"
              style={{
                // Đệm rộng hẳn ra: ở mức 4px thì hình thú và nhãn "KHẮC" chạm sát
                // rìa nút, nhìn như tràn ra ngoài.
                padding: '8px 12px',
                borderColor: ELEMENT_COLOR[spell.element],
                background: matchup === 'strong' ? '#ffe9b8' : '#f8f8f0',
                minHeight: 60,
              }}
            >
              <PixelSprite sprite={petSprite(pet.pet.sprite, pet.pet.element)} scale={2} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-bold leading-tight">{spell.name}</span>
                <span
                  className="pixel-font block text-base leading-tight"
                  style={{ color: ELEMENT_COLOR[spell.element] }}
                >
                  {SUBJECT_ELEMENT[spell.element]} · {Math.round(spell.power * 100)}%
                </span>
              </span>
              {matchup === 'strong' && (
                <span
                  className="pixel-font shrink-0 px-2 text-base"
                  style={{ color: '#b4521f', background: '#ffd9a8', borderRadius: 4 }}
                >
                  🔥 KHẮC
                </span>
              )}
              {matchup === 'weak' && <span className="shrink-0 text-lg opacity-60">🪨</span>}
            </button>
          )
        })}
      </div>

    </div>
  )
}

/**
 * Dải đội thú dưới khung trận: con nào đang ra trận, con nào còn máu.
 * Trái tim đếm số thú còn đứng được - đúng cách Prodigy cho biết còn mấy mạng.
 */
export function TeamStrip({ team, activeIndex }: { team: BattlePet[]; activeIndex: number }) {
  const alive = teamAlive(team)

  return (
    <div className="pixel-panel flex items-center gap-2" style={{ padding: '6px 10px' }}>
      <span className="pixel-font shrink-0 text-xl" aria-label={`Còn ${alive} thú`}>
        {'❤️'.repeat(alive)}
        {'🖤'.repeat(team.length - alive)}
      </span>

      <div className="flex flex-1 flex-wrap gap-2">
        {team.map((p, index) => {
          const down = p.hp <= 0
          const active = index === activeIndex && !down
          return (
            <span
              key={p.pet.id}
              className="flex items-center gap-1"
              style={{
                padding: '2px 6px',
                border: `3px solid ${active ? '#b8860b' : '#1b2432'}`,
                background: active ? '#fff3c4' : down ? '#c3ccd8' : '#f8f8f0',
                borderRadius: 4,
                opacity: down ? 0.55 : 1,
              }}
              title={`${p.pet.name} - ${p.hp}/${p.pet.maxHp} máu`}
            >
              <PixelSprite sprite={petSprite(p.pet.sprite, p.pet.element)} scale={1} />
              <span className="pixel-font text-lg leading-none">
                {p.hp}/{p.pet.maxHp}
              </span>
            </span>
          )
        })}
      </div>

      <span className="pixel-font shrink-0 text-lg opacity-60">
        {SUBJECT_LABEL[team[activeIndex]?.pet.element ?? 'math']}
      </span>
    </div>
  )
}
