/**
 * Bộ sưu tập thú.
 *
 * Thu phục thú là lý do để trẻ đi lang thang trong vùng đất thay vì chạy thẳng
 * từ cổng này sang cổng kia. Màn hình này phải cho thấy CÒN THIẾU CON NÀO -
 * chỗ trống mới là thứ kéo trẻ quay lại, chứ không phải chỗ đã có.
 *
 * Con chưa thu phục vẫn hiện hình nhưng tô xám, kèm gợi ý bắt được ở đâu.
 */

import { PETS, SPELLS } from '../../content/pets'
import { evolutionStage, nextEvolution, petLevel, resolvePet, xpToNextLevel } from '../../engine/pets'
import { SUBJECT_ELEMENT, SUBJECT_LABEL, SUBJECTS, type Subject } from '../../content/types'
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
}: {
  ownedIds: string[]
  petXp?: Record<string, number>
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
        và cấp 20. Nấc cuối học thêm phép tối thượng của hệ mình.
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
                return (
                  <div
                    key={pet.id}
                    className="card flex items-center gap-2"
                    style={{
                      padding: 10,
                      borderColor: have ? ELEMENT_COLOR[element] : undefined,
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

                      {have && (
                        <p className="text-sm leading-tight opacity-70">
                          {shown.spellIds.map((id) => SPELLS[id]?.name).filter(Boolean).join(', ')}
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
