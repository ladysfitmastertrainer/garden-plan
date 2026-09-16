/**
 * Chọn hoặc tạo hồ sơ học sinh.
 *
 * Không có email, không mật khẩu, không thu thập gì ngoài tên hiển thị và lớp.
 * Trẻ nhận ra hồ sơ của mình bằng NHÂN VẬT chứ không phải bằng chữ - lớp 1 chưa
 * đọc thạo tên mình viết ra.
 *
 * Màn chọn nhân vật cố ý dựng như lúc chọn sinh vật khởi đầu trong game: ba con
 * bày ra, chạm vào là thấy tên, chọn xong mới đi tiếp.
 */

import { useState } from 'react'
import { GRADES, type Grade } from '../../content/types'
import { levelFromTotalXp } from '../../engine/rewards'
import { useAuth } from '../../store/auth'
import { useUi } from '../../store/ui'
import { useGame } from '../../store/game'
import { ConfirmModal } from '../../ui/ConfirmModal'
import { DialogueBox } from '../../ui/DialogueBox'
import {
  HERO_CREATURES,
  HERO_NAMES,
  creatureFromAvatar,
  type HeroCreatureId,
} from '../pixel/creatures'
import { PixelSprite } from '../pixel/sprite'

/** Emoji lưu trong hồ sơ ứng với từng nhân vật, để dữ liệu cũ và mới cùng định dạng. */
const AVATAR_OF: Record<HeroCreatureId, string> = {
  fox: '🦊',
  panda: '🐼',
  dragon: '🐢',
}

export function ProfileScreen() {
  const students = useGame((s) => s.students)
  const role = useAuth((s) => s.role)
  const mode = useAuth((s) => s.mode)
  const go = useUi((s) => s.go)
  /*
    Nhân viên nhà trường thì việc ở đây không phải là "tạo hồ sơ cho con".

    Giáo viên và quản trị viên thường KHÔNG có con riêng nào trong app. Trước đây
    họ đăng nhập xong rơi thẳng vào màn tạo hồ sơ trẻ, và không còn lối nào tới
    chỗ quản lý lớp - vì lối đó nằm sau màn chơi, mà màn chơi chỉ hiện khi đã có
    ít nhất một hồ sơ trẻ. Kẹt cứng.
  */
  const isStaff = mode === 'adult' && (role === 'teacher' || role === 'admin')
  const selectStudent = useGame((s) => s.selectStudent)
  const deleteStudent = useGame((s) => s.deleteStudent)
  const [creating, setCreating] = useState(false)
  // Hồ sơ đang chờ xác nhận xoá. Giữ cả hồ sơ chứ không chỉ id: hộp thoại còn
  // phải vẽ con thú của em đó ra.
  const [pendingDelete, setPendingDelete] = useState<(typeof students)[number] | null>(null)

  if (creating || students.length === 0) {
    return (
      <>
        {isStaff && <StaffShortcut onGo={() => go('dashboard')} />}
        <CreateProfile onCancel={students.length > 0 ? () => setCreating(false) : null} />
      </>
    )
  }

  return (
    <div className="pixel-ui mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-5 px-4 py-8">
      <header className="text-center">
        <h1 className="pixel-font text-4xl">HỌC VIỆN TRÍ TUỆ</h1>
        <p className="mt-1 text-lg opacity-70">Ai đang chơi hôm nay?</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {students.map((student) => {
          const { level } = levelFromTotalXp(student.totalXp)
          const creature = creatureFromAvatar(student.avatar)
          return (
            <div key={student.id} className="pixel-panel flex items-center gap-3">
              <button
                type="button"
                onClick={() => void selectStudent(student.id)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <PixelSprite sprite={HERO_CREATURES[creature]} scale={3} />
                <span>
                  <span className="block text-xl font-extrabold">{student.name}</span>
                  <span className="pixel-font block text-lg opacity-70">
                    Lv{level} · Lớp {student.grade} · {student.gold}₫
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label={`Xoá hồ sơ ${student.name}`}
                onClick={() => setPendingDelete(student)}
                className="pixel-font shrink-0 px-3 py-2 text-xl opacity-50 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      <button type="button" onClick={() => setCreating(true)} className="btn btn-ghost text-lg">
        + Thêm bạn mới
      </button>

      {pendingDelete && (
        <ConfirmModal
          title={`Xoá hồ sơ của ${pendingDelete.name}?`}
          message={`Toàn bộ tiến độ, vàng và thú của ${pendingDelete.name} sẽ mất.\nKhông lấy lại được đâu.`}
          confirmLabel="Xoá hồ sơ"
          cancelLabel="Giữ lại"
          danger
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            void deleteStudent(pendingDelete.id)
            setPendingDelete(null)
          }}
        >
          {/* Vẽ đúng con thú của hồ sơ đó: người lớn xoá nhầm em này thay vì em
              kia là mất sạch tiến độ, mà tên trẻ con thì hay na ná nhau. */}
          <PixelSprite
            sprite={HERO_CREATURES[creatureFromAvatar(pendingDelete.avatar)]}
            scale={4}
          />
        </ConfirmModal>
      )}
    </div>
  )
}

/**
 * Lối tắt cho nhân viên nhà trường, đặt ngay trên đầu màn tạo hồ sơ trẻ.
 *
 * Không thay thế màn kia: giáo viên vẫn có thể có con của chính mình trong app.
 * Chỉ là phải có một đường đi tiếp cho người không có.
 */
function StaffShortcut({ onGo }: { onGo: () => void }) {
  return (
    <div className="pixel-ui mx-auto w-full max-w-xl px-4 pt-4">
      <div className="card flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-base">
          Bạn là <strong>giáo viên</strong> hoặc <strong>quản trị viên</strong>? Việc lập lớp và
          thêm học sinh nằm ở khu vực người lớn.
        </p>
        <button type="button" onClick={onGo} className="btn btn-primary shrink-0 px-5 text-base">
          🏫 Quản lý lớp
        </button>
      </div>
    </div>
  )
}

function CreateProfile({ onCancel }: { onCancel: (() => void) | null }) {
  const createStudent = useGame((s) => s.createStudent)
  const [name, setName] = useState('')
  const [creature, setCreature] = useState<HeroCreatureId>('fox')
  const [grade, setGrade] = useState<Grade>(1)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    await createStudent({ name: name.trim(), avatar: AVATAR_OF[creature], grade })
  }

  return (
    <div className="pixel-ui create-layout mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4 py-8">
      <h1 className="create-title pixel-font text-center text-3xl">CHÀO BẠN MỚI!</h1>

      <DialogueBox
        className="create-intro"
        text={`Chào con! Hãy chọn một người bạn đồng hành.\nBạn ấy sẽ cùng con đi khắp bốn vùng đất.`}
      />

      {/* Chọn nhân vật khởi đầu */}
      <div className="create-pets grid grid-cols-3 gap-3">
        {(Object.keys(HERO_CREATURES) as HeroCreatureId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setCreature(id)}
            aria-pressed={creature === id}
            className="pixel-panel grid justify-items-center gap-1"
            style={{
              background: creature === id ? '#fff3c4' : undefined,
              borderColor: creature === id ? '#b8860b' : undefined,
            }}
          >
            <PixelSprite sprite={HERO_CREATURES[id]} scale={4} />
            <span className="pixel-font text-lg">{HERO_NAMES[id]}</span>
          </button>
        ))}
      </div>

      <div className="create-form pixel-panel grid gap-4">
        <label className="grid gap-2">
          <span className="pixel-font text-lg">TÊN CỦA CON</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={20}
            placeholder="Ví dụ: Bảo An"
            className="bg-white px-4 py-3 text-xl font-bold outline-none"
            style={{ border: '4px solid #1b2432', borderRadius: 6 }}
          />
        </label>

        <div className="grid gap-2">
          <span className="pixel-font text-lg">CON HỌC LỚP MẤY?</span>
          <div className="grid grid-cols-5 gap-2">
            {GRADES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGrade(value)}
                className="pixel-font py-3 text-xl"
                style={{
                  border: '4px solid #1b2432',
                  borderRadius: 6,
                  background: grade === value ? '#fff3c4' : '#f8f8f0',
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="create-go grid gap-3">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!name.trim() || saving}
          className="btn btn-primary text-xl"
        >
          Bắt đầu chơi!
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Quay lại
          </button>
        )}
      </div>
    </div>
  )
}
