/**
 * Bộ sưu tập thú.
 *
 * Thu phục thú là lý do để trẻ đi lang thang trong vùng đất thay vì chạy thẳng
 * từ cổng này sang cổng kia. Màn hình này phải cho thấy CÒN THIẾU CON NÀO -
 * chỗ trống mới là thứ kéo trẻ quay lại, chứ không phải chỗ đã có.
 *
 * Con chưa thu phục vẫn hiện hình nhưng tô xám, kèm gợi ý bắt được ở đâu.
 *
 * VÀ ĐÂY LÀ CHỖ CHỌN CON ĐI THEO. Ra trận chỉ một con, nên câu hỏi "con nào đi
 * với mình" là quyết định lớn nhất trẻ đưa ra ngoài trận đấu - nó phải nằm ngay
 * cạnh chỉ số và bộ chiêu của từng con, chứ không phải trong một màn hình riêng
 * mà trẻ phải nhớ số để so.
 */

import { PETS, SPELLS, borrowedElement } from '../../content/pets'
import {
  evolutionStage,
  nextEvolution,
  petLevel,
  resolvePet,
  unlockedSpellCount,
  xpToNextLevel,
} from '../../engine/pets'
import { SUBJECT_ELEMENT, SUBJECT_LABEL, SUBJECTS, type Subject } from '../../content/types'
import { NATURE_AFTER, NATURE_INFO, natureOf, type NatureCounts } from '../../engine/nature'
import { ALL_SPRITES, recolor } from '../pixel/creatures'
import { PixelSprite } from '../pixel/sprite'

const ELEMENT_COLOR: Record<Subject, string> = {
  math: '#f59e0b',
  vietnamese: '#ef4476',
  music: '#8b5cf6',
  ethics: '#0ea5e9',
}

const ELEMENT_TINT: Record<Subject, Record<string, string>> = {
  math: { B: '#f2b23a', S: '#c4861f', '#': '#6b4410' },
  vietnamese: { B: '#ef6b90', S: '#c43f66', '#': '#6b1f36' },
  music: { B: '#a78bfa', S: '#7c5cd6', '#': '#3b2a6b' },
  ethics: { B: '#5fc9ea', S: '#3a9ac6', '#': '#154a63' },
}

const GREY_TINT: Record<string, string> = {
  B: '#a9b5c4',
  S: '#7b8694',
  L: '#d2dae4',
  '#': '#39424f',
  E: '#d2dae4',
  P: '#39424f',
  Y: '#8e9bab',
}

export function petSpriteFor(spriteId: string, element: Subject, owned = true) {
  const base = ALL_SPRITES[spriteId] ?? ALL_SPRITES.slime!
  return recolor(base, owned ? ELEMENT_TINT[element] : GREY_TINT)
}

export function PetCollection({
  ownedIds,
  petXp = {},
  petNature = {},
  companionId,
  onChoose,
}: {
  ownedIds: string[]
  petXp?: Record<string, number>
  /** Nết trả lời đã tích được - xem `engine/nature.ts`. */
  petNature?: Record<string, NatureCounts>
  /** Con đang đi theo trẻ. Không có thì chưa ai được chọn. */
  companionId?: string
  onChoose: (petId: string) => void
}) {
  const owned = new Set(ownedIds)

  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-extrabold">🐾 Bộ sưu tập thú</h2>
        <p className="text-base opacity-70">
          Đã có {owned.size}/{PETS.length}
        </p>
      </div>

      <p className="text-base opacity-70">
        Thú thu phục được khi thắng quái hoang gặp trong cỏ cao. Mỗi môn học một hệ thú riêng.
        Đánh trận là thú lên cấp, và mỗi con tiến hoá <strong>ba lần</strong> - ở cấp 5, cấp 10
        và cấp 20.
      </p>
      <p className="text-base opacity-70">
        Chọn <strong>một con đi theo</strong> - chỉ con đó ra trận, và chỉ con đó được chia kinh
        nghiệm. Mỗi con có <strong>bốn chiêu riêng</strong>: hai chiêu có sẵn, chiêu thứ ba mở ở
        lần tiến hoá đầu (mượn sức một môn khác để đánh được cả những con quái khắc hệ mình), và
        chiêu cuối mở ở lần tiến hoá thứ hai.
      </p>
      <p className="text-base opacity-70">
        Đánh trận cùng một con thì nó <strong>nhiễm cái nết của con</strong>: bấm liền thì thành
        Gan Lì, nghĩ kỹ rồi mới bấm thì thành Điềm Tĩnh, hay mở gợi ý thì thành Ham Học. Nết nào
        cũng có cái hay riêng - không có nết nào là nết dở.
      </p>

      {SUBJECTS.map((element) => {
        const group = PETS.filter((pet) => pet.element === element)
        return (
          <div key={element} className="grid gap-2">
            <p className="pixel-font text-xl" style={{ color: ELEMENT_COLOR[element] }}>
              {SUBJECT_ELEMENT[element]} · {SUBJECT_LABEL[element]}
            </p>

            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
              {group.map((pet) => {
                const have = owned.has(pet.id)
                const xp = petXp[pet.id] ?? 0
                const level = petLevel(xp)
                const shown = resolvePet(pet, xp)
                const stage = evolutionStage(pet, xp)
                const upcoming = nextEvolution(pet, xp)
                const next = xpToNextLevel(xp)
                const mine = have && pet.id === companionId
                const open = unlockedSpellCount(pet, xp)
                const counts = petNature[pet.id]
                const nature = natureOf(counts)
                const answered = (counts?.fast ?? 0) + (counts?.careful ?? 0) + (counts?.hinted ?? 0)
                return (
                  <div
                    key={pet.id}
                    className="card flex items-center gap-2"
                    style={{
                      padding: 10,
                      // Con đang đi theo được viền dày hẳn: trong một lưới mười
                      // hai ô, một khác biệt nhỏ thì trẻ phải dò từng ô mới
                      // thấy con của mình đâu.
                      borderColor: have ? ELEMENT_COLOR[element] : undefined,
                      borderWidth: mine ? 5 : undefined,
                      background: mine ? '#fff3c4' : undefined,
                      opacity: have ? 1 : 0.65,
                    }}
                  >
                    <PixelSprite sprite={petSpriteFor(shown.sprite, element, have)} scale={2} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold leading-tight">
                        {have ? shown.name : '???'}
                        {/* Một ngôi sao cho mỗi nấc đã qua: nhìn cái là biết con
                            đang ở đâu trên đường ba nấc, không phải mở ra đọc số. */}
                        {have && stage > 0 && ` ${'🌟'.repeat(stage)}`}
                      </p>
                      <p className="text-sm opacity-70">
                        {have
                          ? `Cấp ${level} · ${shown.maxHp} máu · sức ${Math.round(shown.power * 100)}%`
                          : 'Chưa gặp'}
                      </p>

                      {have && next && (
                        <div
                          className="my-1 h-2 overflow-hidden"
                          style={{ background: '#fff', border: '2px solid #1b2432', borderRadius: 3 }}
                          role="img"
                          aria-label={`Còn ${next.need} kinh nghiệm nữa thì lên cấp`}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.round((next.into / next.span) * 100)}%`,
                              background: ELEMENT_COLOR[element],
                            }}
                          />
                        </div>
                      )}

                      {/*
                        Bốn chiêu bày cả ra, hai chiêu chưa mở để mờ và gạch
                        ngang. Giấu chúng đi thì trẻ không biết có gì đang chờ
                        mình ở nấc sau; bày ra thì lần tiến hoá kế tiếp có một
                        khuôn mặt cụ thể để mà trông tới.
                      */}
                      {have && (
                        <p className="text-sm leading-tight">
                          {pet.spellIds.map((id, at) => {
                            const spell = SPELLS[id]
                            if (!spell) return null
                            const locked = at >= open
                            return (
                              <span
                                key={id}
                                style={{
                                  opacity: locked ? 0.45 : 0.8,
                                  textDecoration: locked ? 'line-through' : undefined,
                                }}
                              >
                                {at > 0 && ', '}
                                {spell.tier === 4 && '⚡'}
                                {spell.name}
                              </span>
                            )
                          })}
                        </p>
                      )}
                      {have && open < 4 && (
                        <p className="text-sm leading-tight opacity-70">
                          Tiến hoá để học {SUBJECT_ELEMENT[borrowedElement(pet)]} và chiêu cuối.
                        </p>
                      )}
                      {have && upcoming && (
                        <p className="text-sm leading-tight" style={{ color: ELEMENT_COLOR[element] }}>
                          Cấp {upcoming.atLevel} → {upcoming.name}
                        </p>
                      )}
                      {have && !upcoming && (
                        <p className="text-sm leading-tight" style={{ color: ELEMENT_COLOR[element] }}>
                          Đã tới hình thái cuối cùng.
                        </p>
                      )}

                      {/*
                        Tính cách, và khi chưa rõ thì nói RÕ LÀ CHƯA RÕ kèm còn
                        bao nhiêu câu nữa. Để trống thì trẻ không biết là có thứ
                        ấy tồn tại; nói "còn 7 câu nữa" thì nó thành một cái mốc
                        để ngóng, và ngóng bằng cách đi đánh thêm vài trận.
                      */}
                      {have && nature && (
                        <p className="text-sm leading-tight" style={{ color: ELEMENT_COLOR[element] }}>
                          {NATURE_INFO[nature].emoji} {NATURE_INFO[nature].label} ·{' '}
                          {NATURE_INFO[nature].perk}
                        </p>
                      )}
                      {have && !nature && (
                        <p className="text-sm leading-tight opacity-60">
                          Tính cách chưa rõ - đánh thêm {NATURE_AFTER - answered} câu nữa cùng con này.
                        </p>
                      )}

                      {have && (
                        <button
                          type="button"
                          onClick={() => onChoose(pet.id)}
                          disabled={mine}
                          className={`btn mt-1 w-full text-sm ${mine ? 'btn-ghost' : 'btn-primary'}`}
                          style={{ padding: '4px 8px' }}
                        >
                          {mine ? '✓ Đang đi theo con' : 'Cho đi theo'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </section>
  )
}
