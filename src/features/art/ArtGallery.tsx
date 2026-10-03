'use client'

/**
 * Trang soát hình: mọi nhân vật, vẽ qua ĐÚNG những hàm game dùng.
 *
 * Không tự tra `public/art` mà gọi `petSpriteFor`, `monsterSpriteFor`,
 * `tintedViews`... - nên cái hiện ở đây là cái trẻ sẽ thấy, kể cả chỗ hình vẽ
 * tay còn thiếu và game rơi về điểm ảnh.
 */

import { PETS } from '../../content/pets'
import type { Pet } from '../../engine/pets'
import { SUBJECT_LABEL, SUBJECTS, type Habitat } from '../../content/types'
import { BOSS_SPRITE, HERO_NAMES, monsterSpriteFor, towerSpriteFor, type HeroCreatureId } from '../pixel/creatures'
import { HERO_TINTS, tintedViews } from '../pixel/heroes'
import { artOf, PixelSprite, type Sprite } from '../pixel/sprite'
import { petSpriteFor } from '../inventory/PetCollection'
import { ART_MANIFEST } from './manifest'

const HABITATS: Habitat[] = ['sea', 'cave', 'forest', 'lava', 'deep']
const HEROES: HeroCreatureId[] = ['fox', 'panda', 'dragon']

/** Con thú ở nấc thứ `stage` (1..4): đúng hai trường `resolvePet` đổi theo nấc. */
function atStage(pet: Pet, stage: number): Pet {
  if (stage === 1) return pet
  const evo = pet.evolutions[stage - 2]!
  return { ...pet, name: evo.name, sprite: evo.sprite }
}

function Cell({ sprite, label, scale = 6, flip }: { sprite: Sprite; label: string; scale?: number; flip?: boolean }) {
  const drawn = artOf(sprite) !== null
  return (
    <figure className="grid justify-items-center gap-1 rounded-xl bg-white p-2 shadow-sm">
      <PixelSprite sprite={sprite} scale={scale} flip={flip} />
      <figcaption className="text-center text-xs leading-tight">
        <span className={drawn ? 'text-emerald-700' : 'text-slate-400'}>{drawn ? '●' : '○'}</span> {label}
      </figcaption>
    </figure>
  )
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <div className="flex flex-wrap items-start gap-2">{children}</div>
    </section>
  )
}

export function ArtGallery() {
  const total = Object.keys(ART_MANIFEST).length
  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-4" style={{ background: '#eef1f6', minHeight: '100vh' }}>
      <header>
        <h1 className="text-2xl font-extrabold">Soát hình</h1>
        <p className="text-sm opacity-70">
          {total} hình vẽ tay đang có. <span className="text-emerald-700">●</span> hình vẽ tay ·{' '}
          <span className="text-slate-400">○</span> còn điểm ảnh. Chạy <code>npm run art</code> sau khi thêm tờ mới
          vào <code>art-src/</code>.
        </p>
      </header>

      {HEROES.map((shape) => (
        <Row key={shape} title={`Nhân vật - ${HERO_NAMES[shape]}`}>
          {HERO_TINTS.map((tint) => {
            const views = tintedViews(shape, tint)
            return (
              <div key={tint.id} className="grid gap-1">
                <Cell sprite={views.down} label={tint.name} />
                {tint.id === 'goc' && (
                  <>
                    <Cell sprite={views.side} label="nghiêng, đi trái" />
                    <Cell sprite={views.side} label="nghiêng, đi phải" flip />
                    {/* Bản điểm ảnh để so: hình vẽ tay phải quay ĐÚNG hướng bản cũ. */}
                    <Cell sprite={{ ...views.side, art: undefined }} label="điểm ảnh, đi trái" />
                    <Cell sprite={views.up} label="sau lưng" />
                  </>
                )}
              </div>
            )
          })}
        </Row>
      ))}

      {PETS.map((pet) => (
        <Row key={pet.id} title={`Thú - ${pet.name} (${SUBJECT_LABEL[pet.element]})`}>
          {[1, 2, 3, 4].map((stage) => {
            const shown = atStage(pet, stage)
            return <Cell key={stage} sprite={petSpriteFor(shown)} label={`${stage}. ${shown.name}`} />
          })}
          <Cell sprite={petSpriteFor(pet, false)} label="chưa gặp" />
        </Row>
      ))}

      {SUBJECTS.map((subject) => (
        <Row key={subject} title={`Quái - ${SUBJECT_LABEL[subject]}`}>
          {[0, 1, 2, 3].map((v) => (
            <Cell key={v} sprite={monsterSpriteFor(subject, v, false)} label={`con ${v + 1}`} />
          ))}
          <Cell sprite={BOSS_SPRITE[subject]} label="trùm" />
          <Cell sprite={towerSpriteFor(subject)} label="trùm trong tháp" />
        </Row>
      ))}

      {HABITATS.map((habitat) => (
        <Row key={habitat} title={`Quái nơi chốn - ${habitat}`}>
          {[0, 1, 2, 3].map((v) => (
            <Cell key={v} sprite={monsterSpriteFor('math', v, false, habitat)} label={`con ${v + 1}`} />
          ))}
        </Row>
      ))}
    </main>
  )
}
