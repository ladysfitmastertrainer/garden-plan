/**
 * Kho đồ: xem và mặc trang bị đã nhặt được.
 *
 * Với trẻ 6-10 tuổi, phần thưởng chỉ có ý nghĩa khi NHÌN THẤY được. Màn hình này
 * cho trẻ ngắm những gì mình đã kiếm và thấy rõ chỉ số thay đổi thế nào.
 */

import { motion } from 'framer-motion'
import { findLootItem, levelFromTotalXp, statsForLevel, RARITY_LABEL } from '../../engine/rewards'
import { useGame } from '../../store/game'
import { useUi } from '../../store/ui'
import { companionOf } from '../../content/pets'
import { PetCollection } from './PetCollection'
import { SpellLoadout } from './SpellLoadout'

const RARITY_COLOR: Record<string, string> = {
  common: 'var(--color-ink-soft)',
  rare: 'var(--color-brand)',
  epic: 'var(--color-gold)',
}

export function InventoryScreen() {
  const go = useUi((s) => s.go)
  const student = useGame((s) => s.student)
  const progress = useGame((s) => s.progress)
  const setCompanion = useGame((s) => s.setCompanion)
  const equip = useGame((s) => s.toggleEquip)

  if (!student) return null

  const { level } = levelFromTotalXp(student.totalXp)

  // Dựng qua đúng hàm trận đấu dùng, để hai nơi không bao giờ lệch nhau. Môn
  // truyền vào chỉ đổi kết quả khi trẻ chưa từng chọn con nào - xem SpellLoadout.
  const companion = companionOf(progress.pets, progress.companion, 'math', progress.petXp ?? {})

  // Đếm theo số lượng: nhặt được hai cái mũ thì hiện hai dòng.
  const owned = progress.inventory
    .map((id) => findLootItem(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const uniqueOwned = [...new Map(owned.map((item) => [item.id, item])).values()]
  const countOf = (id: string) => owned.filter((item) => item.id === id).length

  const bonus = student.equippedItemIds.reduce(
    (acc, id) => {
      const item = findLootItem(id)
      return {
        bonusHp: acc.bonusHp + (item?.bonus.bonusHp ?? 0),
        bonusPower: acc.bonusPower + (item?.bonus.bonusPower ?? 0),
      }
    },
    { bonusHp: 0, bonusPower: 0 },
  )

  const base = statsForLevel(level)
  const withGear = statsForLevel(level, bonus)

  return (
    <div className="pixel-ui mx-auto grid max-w-2xl gap-5 px-4 py-5">
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => go('game')} className="btn btn-ghost px-4">
          ←
        </button>
        <h1 className="pixel-font flex-1 text-2xl">KHO ĐỒ CỦA {student.name.toUpperCase()}</h1>
      </header>

      <section className="pixel-panel grid gap-2">
        <h2 className="text-xl font-extrabold">Chỉ số hiện tại</h2>
        {/*
          MÁU LÀ MÁU CỦA CON THÚ, không phải của nhân vật.

          Dòng này từng đọc `statsForLevel(level).maxHp`, và con số ấy giờ không
          còn nghĩa: ra trận là con thú chịu đòn, nên thanh máu trong trận đọc
          từ `battle.pet`. Để nguyên thì kho đồ khai 98 trong khi trận đấu hiện
          260/260 - hai màn hình của cùng một trò chơi nói hai con số khác nhau,
          và trẻ sẽ tin vào con số sai.

          Sức mạnh thì vẫn là của nhân vật: nó nhân vào sát thương mọi chiêu
          (xem `state.player.power` trong `castSpell`).
        */}
        <StatLine label="❤️ Máu của thú đi theo" base={companion.maxHp} now={companion.maxHp} />
        <StatLine
          label="⚔️ Sức mạnh"
          base={Math.round(base.power * 100)}
          now={Math.round(withGear.power * 100)}
          suffix="%"
        />
      </section>

      <section className="pixel-panel grid gap-3">
        <h2 className="text-xl font-extrabold">Trang bị ({uniqueOwned.length} loại)</h2>

        {uniqueOwned.length === 0 && (
          <p className="opacity-70">
            Chưa nhặt được món nào. Thắng trận sẽ có cơ hội rơi đồ — càng ít sai càng dễ rơi đồ tốt.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {uniqueOwned.map((item) => {
            const equipped = student.equippedItemIds.includes(item.id)
            const count = countOf(item.id)
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => void equip(item.id)}
                className="flex items-center gap-3 rounded-2xl border-4 p-3 text-left"
                style={{
                  borderColor: equipped ? 'var(--color-good)' : 'transparent',
                  background: equipped ? 'var(--color-good-soft)' : 'var(--color-paper-sunk)',
                }}
                aria-pressed={equipped}
              >
                <span className="text-4xl">{item.emoji}</span>
                <span className="flex-1">
                  <span className="block font-extrabold">
                    {item.name}
                    {count > 1 && <span className="opacity-60"> ×{count}</span>}
                  </span>
                  <span className="block text-base" style={{ color: RARITY_COLOR[item.rarity] }}>
                    {RARITY_LABEL[item.rarity]}
                  </span>
                  <span className="block text-base opacity-70">
                    {item.bonus.bonusHp ? `+${item.bonus.bonusHp} máu ` : ''}
                    {item.bonus.bonusPower ? `+${Math.round(item.bonus.bonusPower * 100)}% sức mạnh` : ''}
                  </span>
                </span>
                <span className="text-base font-bold">{equipped ? '✅ Đang mặc' : 'Mặc'}</span>
              </motion.button>
            )
          })}
        </div>
      </section>

      <PetCollection
        ownedIds={progress.pets ?? []}
        petXp={progress.petXp ?? {}}
        companionId={progress.companion}
        onChoose={setCompanion}
      />

      <SpellLoadout />
    </div>
  )
}

function StatLine({
  label,
  base,
  now,
  suffix = '',
}: {
  label: string
  base: number
  now: number
  suffix?: string
}) {
  const gain = now - base
  return (
    <p className="flex justify-between text-lg">
      <span>{label}</span>
      <span className="font-extrabold">
        {now}
        {suffix}
        {gain > 0 && (
          <span className="ml-2 text-base" style={{ color: 'var(--color-good)' }}>
            (+{gain}
            {suffix} nhờ trang bị)
          </span>
        )}
      </span>
    </p>
  )
}
