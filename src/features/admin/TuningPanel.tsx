/**
 * Chỉnh các con số cân bằng game.
 *
 * Mỗi ô là một thanh kéo kèm ô nhập số: thanh kéo để dò nhanh, ô nhập để gõ
 * đúng con số mình muốn. Ăn ngay lập tức, không có nút "Lưu" - lưu là việc của
 * kho thiết lập, và một nút Lưu chỉ tổ để người dùng chỉnh xong rồi quên bấm.
 */

import {
  DEFAULT_TUNING,
  MOTION_MODES,
  TUNING_RANGE,
  resetTuning,
  setMotionMode,
  setTuning,
  type Tuning,
} from '../../content/tuning'
import { useMotionMode, useTuning } from './useTuning'

interface Field {
  key: keyof Tuning
  label: string
  hint: string
  /** Cách hiện giá trị cho người đọc - giây, phần trăm, lần... */
  format: (value: number) => string
}

const GROUPS: Array<{ title: string; note: string; fields: Field[] }> = [
  {
    title: 'Trận đấu',
    note:
      'Mỗi vòng có hai lượt: con ra đòn, rồi quái ra đòn. Đồng hồ khi CON RA ĐÒN ' +
      'chỉ chạy ở trận trùm và đầu đàn - trận thường không đếm giờ. Đồng hồ khi ' +
      'QUÁI RA ĐÒN thì luôn chạy: đó chính là cú đánh đang bay tới.',
    fields: [
      {
        key: 'questionsPerBattle',
        label: 'Số câu mỗi trận ở cổng chặng',
        hint: 'Đủ dài để có tiến triển, đủ ngắn để không chán.',
        format: (v) => `${v} câu`,
      },
      {
        key: 'bossSeconds',
        label: 'Giờ mỗi câu khi đánh trùm',
        hint: 'Gấp hơn đầu đàn: trùm là bài kiểm tra cuối vùng đất.',
        format: (v) => `${v} giây`,
      },
      {
        key: 'miniBossSeconds',
        label: 'Giờ mỗi câu khi đánh đầu đàn',
        hint: 'Đầu đàn là chỗ tập dượt gặp giữa đường.',
        format: (v) => `${v} giây`,
      },
      {
        key: 'towerSeconds',
        label: 'Giờ mỗi câu khi đánh trùm trong tháp',
        hint: 'Gấp hơn trùm vùng đất - ở đó còn phải đọc lại hệ của quái trước khi chọn phép.',
        format: (v) => `${v} giây`,
      },
      {
        key: 'defendSeconds',
        label: 'Giờ đỡ đòn ở trận thường',
        hint: 'Trả lời kịp thì quái mất lượt đánh; không kịp thì ăn đòn.',
        format: (v) => String(v) + " giây",
      },
      {
        key: 'defendBossSeconds',
        label: 'Giờ đỡ đòn ở trận trùm và đầu đàn',
        hint: 'Luôn ngắn hơn giờ ra đòn của chính trận đó - đặt dài hơn thì máy tự cắt xuống.',
        format: (v) => String(v) + " giây",
      },
      {
        key: 'youngReaderFactor',
        label: 'Thêm giờ cho lớp 1-2',
        hint: 'Các em còn đánh vần cả đề bài.',
        format: (v) => `× ${v.toFixed(1)}`,
      },
    ],
  },
  {
    title: 'Sức của quái',
    note: 'Lớp yếu thì hạ xuống, lớp khá thì nâng lên. 1.0 là mức mặc định.',
    fields: [
      {
        key: 'enemyHpScale',
        label: 'Máu quái',
        hint: 'Máu cao thì trận dài hơn, cần trả lời đúng nhiều câu hơn.',
        format: (v) => `× ${v.toFixed(1)}`,
      },
      {
        key: 'enemyAttackScale',
        label: 'Sát thương quái',
        hint: 'Để thấp có chủ ý: trẻ sai 4-5 câu vẫn còn cơ hội gỡ.',
        format: (v) => `× ${v.toFixed(1)}`,
      },
    ],
  },
  {
    title: 'Phần thưởng',
    note: 'Nhân vào vàng và kinh nghiệm nhận được sau mỗi trận.',
    fields: [
      { key: 'goldScale', label: 'Vàng', hint: 'Dùng để mua đồ trong kho.', format: (v) => `× ${v.toFixed(1)}` },
      { key: 'xpScale', label: 'Kinh nghiệm', hint: 'Quyết định tốc độ lên cấp.', format: (v) => `× ${v.toFixed(1)}` },
    ],
  },
  {
    title: 'Màn đi cảnh',
    note: 'Quái hoang nhảy ra từ ô cỏ cao. Đặt 0% là tắt hẳn chuyện gặp quái dọc đường.',
    fields: [
      {
        key: 'encounterChance',
        label: 'Gặp quái mỗi bước vào cỏ cao',
        hint: 'Ở mức 8%, đi hết một bản đồ dính khoảng 7 trận.',
        format: (v) => `${Math.round(v * 100)} %`,
      },
      {
        key: 'monsterStepMs',
        label: 'Nhịp đi của đàn quái',
        hint: 'Càng nhỏ đàn quái đi càng nhanh. Quá nhanh thì trẻ không đuổi kịp.',
        format: (v) => `${v} ms`,
      },
    ],
  },
]

export function TuningPanel() {
  const tuning = useTuning()
  const changed = (Object.keys(DEFAULT_TUNING) as Array<keyof Tuning>).filter(
    (key) => tuning[key] !== DEFAULT_TUNING[key],
  )

  return (
    <div className="grid gap-4">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <p className="text-base">
          {changed.length === 0
            ? 'Đang dùng toàn bộ giá trị mặc định.'
            : `Đã đổi ${changed.length} mục so với mặc định.`}
        </p>
        <button
          type="button"
          onClick={resetTuning}
          disabled={changed.length === 0}
          className="btn btn-ghost"
          style={{ opacity: changed.length === 0 ? 0.4 : 1 }}
        >
          Về mặc định hết
        </button>
      </div>

      <MotionSetting />

      {GROUPS.map((group) => (
        <section key={group.title} className="card grid gap-4">
          <div>
            <h3 className="text-xl font-extrabold">{group.title}</h3>
            <p className="text-base opacity-70">{group.note}</p>
          </div>

          {group.fields.map((field) => (
            <TuningField key={field.key} field={field} value={tuning[field.key]} />
          ))}
        </section>
      ))}
    </div>
  )
}

/**
 * Bật/tắt hoạt cảnh, đè được lên cài đặt của hệ điều hành.
 *
 * Để ngay đầu trang vì đây là thứ dễ làm người lớn tưởng app hỏng nhất: máy
 * trường học hay bị tắt sẵn hiệu ứng động, và khi đó trận đấu mở ra là hai
 * nhân vật đứng đơ, không có gì báo hiệu trận vừa bắt đầu.
 */
function MotionSetting() {
  const mode = useMotionMode()
  const systemReduces =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const active = MOTION_MODES.find((item) => item.value === mode)!

  return (
    <section className="card grid gap-2">
      <div>
        <h3 className="text-xl font-extrabold">Hoạt cảnh</h3>
        <p className="text-base opacity-70">
          {systemReduces
            ? 'Máy này đang TẮT hiệu ứng động ở mức hệ điều hành.'
            : 'Máy này đang bật hiệu ứng động ở mức hệ điều hành.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MOTION_MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setMotionMode(item.value)}
            aria-pressed={mode === item.value}
            className="btn flex-1 text-base"
            style={{
              minWidth: 120,
              background: mode === item.value ? 'var(--color-brand)' : 'var(--color-paper-sunk)',
              color: mode === item.value ? '#fff' : 'var(--color-ink)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="text-sm opacity-60">{active.hint}</p>

      {systemReduces && mode === 'system' && (
        <p className="text-base" style={{ color: '#a32e2e' }}>
          ⚠ Đang theo máy, mà máy thì đang tắt — nên hoạt cảnh vào trận và nhịp nhún của nhân
          vật sẽ không chạy. Chọn <strong>Luôn bật</strong> nếu muốn thấy chúng.
        </p>
      )}
    </section>
  )
}

function TuningField({ field, value }: { field: Field; value: number }) {
  const range = TUNING_RANGE[field.key]
  const isDefault = value === DEFAULT_TUNING[field.key]

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={`tune-${field.key}`} className="text-lg font-extrabold">
          {field.label}
        </label>
        <span className="flex items-center gap-2">
          <span className="pixel-font text-lg">{field.format(value)}</span>
          {!isDefault && (
            <button
              type="button"
              onClick={() => setTuning({ [field.key]: DEFAULT_TUNING[field.key] })}
              className="text-sm font-bold underline opacity-60"
            >
              hoàn {field.format(DEFAULT_TUNING[field.key])}
            </button>
          )}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          id={`tune-${field.key}`}
          type="range"
          className="flex-1"
          min={range.min}
          max={range.max}
          step={range.step}
          value={value}
          onChange={(event) => setTuning({ [field.key]: Number(event.target.value) })}
        />
        <input
          type="number"
          aria-label={`${field.label}, nhập số`}
          className="w-24 rounded-xl border-4 bg-white px-2 py-1 text-right text-base"
          style={{ borderColor: 'color-mix(in srgb, var(--color-ink) 15%, transparent)' }}
          min={range.min}
          max={range.max}
          step={range.step}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value)
            // Ô trống hoặc gõ dở thì bỏ qua, đừng nhảy về min giữa chừng.
            if (event.target.value !== '' && Number.isFinite(next)) {
              setTuning({ [field.key]: next })
            }
          }}
        />
      </div>

      <p className="text-sm opacity-60">{field.hint}</p>
    </div>
  )
}
