'use client'

/**
 * Trang quản trị: cân bằng game, soi nội dung, vẽ bản đồ, quản lý hồ sơ.
 *
 * TRANG RIÊNG, ẨN VỚI TRẺ. Không có nút nào trong giao diện trẻ dẫn tới đây -
 * vào bằng đường dẫn `/admin`. Đây là công cụ của người lớn, và một cái nút ở
 * màn chơi thì trẻ sẽ bấm, đúng như trẻ bấm mọi cái nút khác.
 *
 * Không phải cơ chế bảo mật, và không giả vờ là thế: ai gõ được địa chỉ thì vào
 * được. Nó chỉ nằm ngoài đường đi của trẻ, giống `ParentGate` ở trang phụ huynh.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ClassManager } from '../dashboard/ClassManager'
import { AccountsPanel } from './AccountsPanel'
import { ContentPanel } from './ContentPanel'
import { MapEditor } from './MapEditor'
import { StudentsPanel } from './StudentsPanel'
import { TabStrip } from './TabStrip'
import { TuningPanel } from './TuningPanel'

const TABS = [
  { id: 'tuning', label: '⚖️ Cân bằng', hint: 'Giờ đếm, sức quái, phần thưởng, tỉ lệ gặp quái' },
  { id: 'content', label: '📚 Nội dung', hint: 'Kỹ năng và câu hỏi của từng môn, từng lớp' },
  { id: 'map', label: '🗺️ Bản đồ', hint: 'Vẽ lục địa, soi lỗi, xuất lưới ký tự' },
  { id: 'students', label: '🧒 Hồ sơ trẻ', hint: 'Tiến độ, đổi lớp, đặt lại, xoá' },
  { id: 'accounts', label: '🔑 Tài khoản', hint: 'Tạo tài khoản cho giáo viên và phụ huynh' },
  /*
    Lớp học nằm luôn ở đây, không bắt đi vòng qua màn chơi.

    Màn quản lý lớp vốn chỉ có ở "Khu vực người lớn", mà muốn tới đó thì phải qua
    bản đồ game - tức phải có sẵn một hồ sơ TRẺ. Quản trị viên của trường thì
    không có con riêng nào trong app cả, nên họ rơi thẳng vào màn "tạo hồ sơ cho
    con" và không còn lối nào đi tiếp.
  */
  { id: 'classes', label: '🏫 Lớp học', hint: 'Lập lớp, lấy mã lớp, thêm học sinh, đặt mã PIN' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminScreen() {
  const [tab, setTab] = useState<TabId>('tuning')
  const active = TABS.find((item) => item.id === tab)!

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-4 px-4 py-4">
      <header className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Trang quản trị</h1>
          <p className="text-base opacity-70">
            Học Viện Trí Tuệ · thiết lập lưu trên máy này
          </p>
        </div>
        {/* `<Link>` chứ không phải `<a>`: Next chuyển màn ngay trong trang, không
            tải lại từ đầu, nên không phải dựng lại toàn bộ gói game một lần nữa.

            Quản trị viên đăng nhập là rơi thẳng vào đây (xem `GameShell`), nên
            đây là lối ra duy nhất xuống phần chơi. */}
        <Link href="/" className="btn btn-ghost">
          ← Về game
        </Link>
      </header>

      {/* Một dòng duy nhất, cuộn ngang khi không đủ chỗ - xem `TabStrip`. */}
      <nav>
        <TabStrip items={TABS} value={tab} onChange={setTab} label="Danh mục quản trị" />
      </nav>

      <p className="text-base opacity-70">{active.hint}</p>

      {tab === 'tuning' && <TuningPanel />}
      {tab === 'content' && <ContentPanel />}
      {tab === 'map' && <MapEditor />}
      {tab === 'students' && <StudentsPanel />}
      {tab === 'accounts' && <AccountsPanel />}
      {tab === 'classes' && <ClassManager />}
    </div>
  )
}
