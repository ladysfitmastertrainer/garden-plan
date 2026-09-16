/** Khu vực người lớn: báo cáo tiến độ và quản lý lớp. */

import { useEffect, useState } from 'react'
import { getRepository, useGame } from '../../store/game'
import { useAuth } from '../../store/auth'
import { useUi } from '../../store/ui'
import type { StudentProfile, StudentProgress } from '../../data/types'
import { emptyProgress } from '../../data/types'
import { AccountLabel, SignOutButton } from '../../ui/account'
import { ChangePassword } from '../../ui/ChangePassword'
import { ClassManager } from './ClassManager'
import { ParentGate } from './ParentGate'
import { ProgressReport } from './ProgressReport'

type Tab = 'progress' | 'classes'

export function DashboardScreen() {
  const unlocked = useUi((s) => s.adultUnlocked)
  const unlock = useUi((s) => s.unlockAdult)
  const go = useUi((s) => s.go)
  const role = useAuth((s) => s.role)
  const mode = useAuth((s) => s.mode)
  const student = useGame((s) => s.student)

  /*
    Quản trị cũng là "nhân viên nhà trường", nên cũng quản lý lớp được.

    Bản đầu chỉ nhận đúng 'teacher'. Lúc đó chưa có vai 'admin' nên không sai;
    nhưng khi 0004 thêm vai ấy vào thì người quản trị đăng nhập xong lại KHÔNG
    thấy tab quản lý lớp đâu - tức là không giao được lớp cho trẻ, đúng việc mà
    họ vào đây để làm.
  */
  const canManageClasses = mode === 'adult' && (role === 'teacher' || role === 'admin')

  // Giáo viên mở màn này ra là để làm việc với lớp, không phải để xem tiến độ một
  // em lẻ; phụ huynh thì ngược lại. Mở sẵn đúng tab của từng người.
  const [tab, setTab] = useState<Tab>(canManageClasses ? 'classes' : 'progress')

  /*
    Nhân viên nhà trường KHÔNG phải giải phép nhân.

    Cổng ấy sinh ra để trẻ trên máy gia đình không tự mò vào xem số liệu về chính
    mình. Với giáo viên thì màn này là chỗ làm việc, và họ vừa gõ email cùng mật
    khẩu để vào - bắt họ giải toán mỗi lần mở chỗ làm của mình là phiền mà không
    chặn thêm được ai.
  */
  if (!unlocked && !canManageClasses) {
    return <ParentGate onPass={unlock} onCancel={() => go('game')} />
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-4 py-5">
      <header className="pixel-ui flex items-center gap-3">
        {/*
          Đang có em nào được chọn thì "←" là quay lại đúng ván đang dở. Không có
          thì đây là màn hạ cánh của giáo viên, và mũi tên quay lại chẳng trỏ vào
          đâu cả - lúc ấy thứ họ cần là một lối ĐI TỚI phần chơi.
        */}
        {student ? (
          <button type="button" onClick={() => go('game')} className="btn btn-ghost px-4">
            ←
          </button>
        ) : (
          <button type="button" onClick={() => go('profiles')} className="btn btn-ghost px-4">
            🎮
          </button>
        )}
        <h1 className="pixel-font flex-1 text-2xl">KHU VỰC NGƯỜI LỚN</h1>
      </header>

      {/*
        Ai đang đăng nhập, và lối ra hẳn.

        Chỉ cho người lớn đăng nhập bằng email. Trẻ trên máy dùng chung không bao
        giờ vào tới đây, và phụ huynh chơi trên máy nhà đã có nút thoát ở màn bản
        đồ rồi - nhưng giáo viên thì hạ cánh THẲNG xuống màn này, nên nếu đây
        không có nút Đăng xuất thì họ không có nút Đăng xuất nào cả.
      */}
      {mode === 'adult' && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AccountLabel />
          <ChangePassword />
          <SignOutButton />
        </div>
      )}

      {canManageClasses && (
        <div className="flex gap-2">
          {(['progress', 'classes'] as Tab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className="flex-1 rounded-2xl border-4 py-3 font-extrabold"
              style={{
                borderColor: tab === value ? 'var(--color-brand)' : 'transparent',
                background: tab === value ? 'var(--color-brand-soft)' : 'var(--color-paper-sunk)',
              }}
            >
              {value === 'progress' ? '📊 Tiến độ' : '🏫 Lớp học'}
            </button>
          ))}
        </div>
      )}

      {tab === 'classes' && canManageClasses ? <ClassManager /> : <ProgressSection />}
    </div>
  )
}

/** Chọn học sinh rồi xem báo cáo. Có sẵn một em thì vào thẳng báo cáo của em đó. */
function ProgressSection() {
  const students = useGame((s) => s.students)
  const currentStudent = useGame((s) => s.student)
  const currentProgress = useGame((s) => s.progress)

  const [selectedId, setSelectedId] = useState<string | null>(currentStudent?.id ?? null)
  const [progress, setProgress] = useState<StudentProgress | null>(
    currentStudent ? currentProgress : null,
  )

  useEffect(() => {
    if (!selectedId) return
    // Học sinh đang chơi thì dùng luôn tiến độ trong bộ nhớ (mới nhất);
    // em khác thì đọc từ kho lưu trữ.
    if (selectedId === currentStudent?.id) {
      setProgress(currentProgress)
      return
    }
    let alive = true
    void getRepository()
      .getProgress(selectedId)
      .then((loaded) => {
        if (alive) setProgress(loaded)
      })
      .catch(() => {
        if (alive) setProgress(emptyProgress())
      })
    return () => {
      alive = false
    }
  }, [selectedId, currentStudent?.id, currentProgress])

  if (students.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-lg">Chưa có hồ sơ học sinh nào.</p>
      </div>
    )
  }

  const selected: StudentProfile | undefined = students.find((s) => s.id === selectedId)

  return (
    <div className="grid gap-4">
      {students.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => setSelectedId(student.id)}
              className="flex items-center gap-2 rounded-2xl border-4 px-4 py-2 font-bold"
              style={{
                borderColor: selectedId === student.id ? 'var(--color-brand)' : 'transparent',
                background: selectedId === student.id ? 'var(--color-brand-soft)' : 'var(--color-paper-sunk)',
              }}
            >
              <span className="text-2xl">{student.avatar}</span>
              {student.name}
            </button>
          ))}
        </div>
      )}

      {!selected && <p className="opacity-70">Chọn một bạn để xem tiến độ.</p>}
      {selected && progress && <ProgressReport student={selected} progress={progress} />}
      {selected && !progress && <p className="opacity-60">Đang tải dữ liệu...</p>}
    </div>
  )
}
