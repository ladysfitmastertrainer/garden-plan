/**
 * Bảng chọn chiêu và dải con thú.
 *
 * Đây là bước quan trọng nhất của trận đấu: trả lời đúng xong, trẻ được chọn
 * tung chiêu nào. Bảng này phải nói rõ chiêu nào khắc chế được con quái trước
 * mặt - nếu trẻ phải tự nhớ vòng khắc chế thì quyết định biến thành đoán mò, mà
 * đoán mò thì chán y như không có lựa chọn.
 *
 * ĐÚNG HAI NÚT, vì con thú mang ra trận đúng hai chiêu (xem `engine/loadout`).
 * Trước đây bảng này gom chiêu của cả đội ba con và cho đổi con giữa trận; giờ
 * ra trận một con, nên việc "cầm chiêu nào" đã quyết xong từ kho đồ, và ở đây
 * chỉ còn đúng một câu hỏi: trong hai chiêu đang cầm, chiêu nào hợp lúc này.
 *
 * Bảng ĐÈ LÊN khung trận chứ không nằm dưới đáy trang. Đặt ở dưới thì trên màn
 * hình dọc nó rơi khỏi tầm mắt, trẻ vừa trả lời đúng xong lại phải cúi xuống
 * tìm - mất đúng cái khoảnh khắc đáng lẽ phải sướng nhất.
 */

import { SUBJECT_ELEMENT, SUBJECT_LABEL, type Subject } from '../../content/types'
import { SPELLS } from '../../content/pets'
import { matchupLabel, type BattlePet } from '../../engine/pets'
import type { BattleState } from '../../engine/battle'
import { ALL_SPRITES, recolor } from '../pixel/creatures'
import { PixelSprite } from '../pixel/sprite'
import { EFFECT_UI } from './effects'

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
  /** Hai chiêu trẻ đã sắp cho con thú này. Chỉ những chiêu trong đây mới hiện ra. */
  loadout: string[]
  onCast: (spellId: string) => void
}) {
  const enemyElement = battle.enemyElement
  const pet = battle.pet

  const options = loadout
    .map((id) => SPELLS[id])
    .filter((spell): spell is NonNullable<typeof spell> => Boolean(spell))
  if (options.length === 0) return null

  // Chiêu khắc chế xếp lên đầu để trẻ nhỏ không phải dò cả danh sách.
  const sorted = [...options].sort((a, b) => {
    const rank = (m: string) => (m === 'strong' ? 0 : m === 'neutral' ? 1 : 2)
    return rank(matchupLabel(a.element, enemyElement)) - rank(matchupLabel(b.element, enemyElement))
  })

  return (
    <div
      className="pixel-panel"
      style={{
        background: '#fff8dc',
        borderColor: '#b8860b',
        padding: '14px 16px',
        // Chiếm hết bề ngang khung trận để xếp được hai cột. Để bảng tự co theo
        // nội dung thì nó thành một cột hẹp và lựa chọn thứ hai bị khuất dưới
        // mép - trẻ không biết là còn chiêu nữa để chọn.
        width: '100%',
        maxWidth: 680,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Chỉ còn "CHỌN CHIÊU": lời khen đã có nhãn riêng treo ngay trên khung
          trận, nói hai lần trong một màn hình là thừa. */}
      <p className="pixel-font text-center text-2xl leading-none">CHỌN CHIÊU</p>
      <p className="mb-2 text-center text-sm opacity-75">
        Quái hệ{' '}
        <strong style={{ color: ELEMENT_COLOR[enemyElement] }}>
          {SUBJECT_ELEMENT[enemyElement]}
        </strong>
      </p>

      <div
        className="grid gap-2"
        style={{
          // 280px chứ không phải 210px: ở 210 thì tên chiêu dài như "Búa Phép Tính"
          // đụng vào nhãn "KHẮC" bên phải, và cả hai đè lên rìa nút.
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {sorted.map((spell) => {
          const matchup = matchupLabel(spell.element, enemyElement)
          const ui = spell.effect ? EFFECT_UI[spell.effect.kind] : null
          /*
            Chiêu cuối đang nghỉ thì nút KHOÁ LẠI CHỨ KHÔNG BIẾN MẤT.

            Giấu nó đi thì bảng chọn tự dưng còn một nút, và trẻ tưởng mình vừa
            mất chiêu. Để nó nằm đó kèm con số đếm ngược thì cái hồi chiêu trở
            thành một thứ trẻ ĐỌC ĐƯỢC và trông tới - "còn 2 lượt nữa".
          */
          const cooling = spell.tier === 4 && battle.ultimateCooldown > 0
          return (
            <button
              key={spell.id}
              type="button"
              onClick={() => onCast(spell.id)}
              disabled={cooling}
              className="pixel-panel flex items-center gap-3 text-left"
              style={{
                // Đệm rộng hẳn ra: ở mức 4px thì hình thú và nhãn "KHẮC" chạm sát
                // rìa nút, nhìn như tràn ra ngoài.
                padding: '8px 12px',
                borderColor: cooling ? '#8a94a6' : ELEMENT_COLOR[spell.element],
                background: cooling ? '#dfe4ea' : matchup === 'strong' ? '#ffe9b8' : '#f8f8f0',
                minHeight: 60,
                opacity: cooling ? 0.7 : 1,
              }}
            >
              <PixelSprite sprite={petSprite(pet.pet.sprite, pet.pet.element)} scale={2} />
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
                    ? `Nghỉ ${battle.ultimateCooldown} lượt nữa`
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
              {!cooling && matchup === 'weak' && (
                <span className="shrink-0 text-lg opacity-60">🪨</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Dải dưới khung trận: con thú đang đánh, và những gì đang bám trên con quái.
 *
 * Chỗ này từng là dải ĐỘI THÚ - mấy trái tim đếm số con còn đứng được, và một ô
 * cho mỗi con. Đi một con thì không còn gì để đếm, nên bề ngang ấy được trả cho
 * hai thứ trẻ thật sự cần liếc giữa trận:
 *
 *   HỒI CHIÊU - còn mấy lượt nữa thì chiêu cuối dùng lại được. Không có nó thì
 *               trẻ phải nhớ, mà giữa trận thì không ai nhớ.
 *   HIỆU ỨNG  - quái đang cháy hay đang bị trói, và còn mấy lượt. Đây là bằng
 *               chứng cho thấy chiêu cuối vừa rồi CÒN ĐANG làm việc; thiếu nó
 *               thì hiệu ứng chỉ là một hoạt cảnh chớp qua rồi thôi.
 */
export function PetStrip({
  pet,
  ultimateCooldown,
  status,
}: {
  pet: BattlePet
  ultimateCooldown: number
  status: BattleState['enemyStatus']
}) {
  const ratio = pet.pet.maxHp === 0 ? 0 : Math.max(0, pet.hp) / pet.pet.maxHp

  return (
    <div className="pixel-panel team-strip flex items-center gap-2" style={{ padding: '6px 10px' }}>
      <PixelSprite sprite={petSprite(pet.pet.sprite, pet.pet.element)} scale={2} />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-base font-bold leading-tight">{pet.pet.name}</span>
          <span className="pixel-font shrink-0 text-base opacity-70">
            {Math.max(0, pet.hp)}/{pet.pet.maxHp}
          </span>
        </span>
        <span
          className="mt-1 block h-3 overflow-hidden"
          style={{ background: '#5a6472', border: '2px solid #1b2432', borderRadius: 3 }}
        >
          <span
            className="block h-full"
            style={{
              width: `${ratio * 100}%`,
              background: ratio > 0.5 ? '#4caf50' : ratio > 0.2 ? '#f0c419' : '#e2584d',
              transition: 'width 0.3s',
            }}
          />
        </span>
      </span>

      {/* Hiệu ứng đang bám trên quái, kèm số lượt còn lại. */}
      {status.map((effect) => {
        const ui = EFFECT_UI[effect.kind]
        return (
          <span
            key={effect.kind}
            className="pixel-font shrink-0 px-1 text-base leading-none"
            style={{ background: ui.tint, color: ui.color, borderRadius: 4, padding: '3px 5px' }}
            title={`${ui.label} - còn ${effect.turnsLeft} lượt`}
          >
            {ui.icon}
            {effect.turnsLeft}
          </span>
        )
      })}

      <span
        className="pixel-font shrink-0 text-base leading-none"
        style={{
          background: ultimateCooldown > 0 ? '#dfe4ea' : '#fff3c4',
          color: ultimateCooldown > 0 ? '#5a6472' : '#b4521f',
          border: '2px solid #1b2432',
          borderRadius: 4,
          padding: '3px 5px',
        }}
        title={ultimateCooldown > 0 ? `Chiêu cuối nghỉ ${ultimateCooldown} lượt` : 'Chiêu cuối sẵn sàng'}
      >
        ⚡{ultimateCooldown > 0 ? ultimateCooldown : '✓'}
      </span>

      {/*
        Tên môn ẩn đi trên màn hình hẹp.

        Nó là thứ ĐÁNG BỎ NHẤT trong dải này: hình con thú đã tô theo hệ rồi,
        và khung hỏi ngay dưới còn in tên môn bằng chữ to. Trong khi thứ nó đang
        chiếm chỗ của - TÊN CON THÚ - thì không nói ở đâu khác, và đo trên máy
        390px thì "Cú Bác Học" bị cắt còn "C...".
      */}
      <span className="pixel-font hidden shrink-0 text-lg opacity-60 sm:inline">
        {SUBJECT_LABEL[pet.pet.element]}
      </span>
    </div>
  )
}
