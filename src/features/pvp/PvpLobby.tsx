/**
 * Bảng "bạn cùng lớp đang chơi", và cửa vào một trận đấu.
 *
 * ĐÂY LÀ CHỖ BẢN ĐỒ TRỞ THÀNH CỦA CHUNG. Trước đây mỗi trẻ đi một mình trên một
 * bản đồ giống hệt bản đồ của bạn bên cạnh, mà không bao giờ biết bạn ấy đang ở
 * đâu. Giờ cả lớp đứng trên cùng một tấm bản đồ: thấy nhau, thấy bạn nào đang ở
 * đảo nào, và thách nhau được ngay tại đảo đó.
 *
 * LUẬT CÙNG ĐẢO là luật quan trọng nhất ở đây, và nó không phải luật kỹ thuật:
 * đề bài của trận đấu lấy theo môn của hòn đảo. Thách một bạn đang ở đảo khác
 * nghĩa là bắt một trong hai làm bài của môn mình chưa mở tới - thua vì chưa
 * học thì không dạy được điều gì cho ai cả.
 */

import { useState } from 'react'
import { SUBJECT_LABEL, type Grade, type Subject } from '../../content/types'
import type { StudentProfile, StudentProgress } from '../../data/types'
import type { LobbyEntry } from '../../data/pvp-types'
import { usePvp } from '../../store/pvp'
import { PixelModal } from '../../ui/PixelModal'
import { buildPvpQuestions, pvpStats, PVP_QUESTIONS } from './pvp-setup'

interface Props {
  student: StudentProfile
  progress: StudentProgress
  /** Đảo trẻ đang đứng. null nghĩa là đang ở bản đồ thế giới. */
  region: { subject: Subject; grade: Grade } | null
}

export function PvpLobby({ student, progress, region }: Props) {
  const lobby = usePvp((s) => s.lobby)
  const match = usePvp((s) => s.match)
  const busy = usePvp((s) => s.busy)
  const error = usePvp((s) => s.error)
  const challenge = usePvp((s) => s.challenge)
  const respond = usePvp((s) => s.respond)
  const leave = usePvp((s) => s.leave)
  const dismiss = usePvp((s) => s.dismiss)
  const clearError = usePvp((s) => s.clearError)
  const [open, setOpen] = useState(false)

  const pending = match?.status === 'pending' ? match : null
  const incoming = pending && pending.opponent.studentId === student.id ? pending : null
  const outgoing = pending && pending.challenger.studentId === student.id ? pending : null

  /*
    Lời thách bị từ chối, nhìn từ phía người đã thách.

    Không có khung này thì khung "Đang chờ..." ở dưới treo lại vĩnh viễn: trận đã
    sang 'declined' ở máy chủ, còn trên màn hình thì con vật đại diện của bạn kia
    vẫn nhấp nháy như thể bạn ấy sắp nhận lời. Một lời từ chối tử tế vẫn hơn một
    lời hứa không bao giờ tới.
  */
  const declined =
    match?.status === 'declined' && match.challenger.studentId === student.id ? match : null

  const send = (entry: LobbyEntry) => {
    if (!region) return
    void challenge({
      studentId: student.id,
      opponentId: entry.studentId,
      subject: region.subject,
      grade: region.grade,
      questions: buildPvpQuestions(student.id, region.subject, region.grade, progress.mastery),
      stats: pvpStats(student, progress, region.subject),
    })
  }

  const accept = () => {
    if (!incoming) return
    void respond(student.id, true, pvpStats(student, progress, incoming.subject))
  }

  // Không ở lớp nào, hoặc cả lớp đang tắt máy: giấu hẳn bảng này đi. Một danh
  // sách trống kèm câu "chưa có bạn nào" chỉ chiếm chỗ và nhắc trẻ rằng mình
  // đang chơi một mình.
  if (lobby.length === 0 && !pending && !declined) return null

  return (
    <>
      <section className="pixel-panel grid gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-expanded={open}
        >
          <span className="pixel-font text-xl">⚔️ Bạn cùng lớp</span>
          <span className="text-base opacity-70">{lobby.length} bạn đang chơi</span>
          <span className="ml-auto text-lg">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="grid gap-2">
            {region === null && (
              <p className="text-sm leading-snug opacity-70">
                Bước vào một hòn đảo thì mới thách đấu được - trận đấu lấy đề theo môn của đảo đó.
              </p>
            )}

            {lobby.map((entry) => {
              const sameIsland =
                region !== null && entry.subject === region.subject && entry.grade === region.grade
              return (
                <div key={entry.studentId} className="card flex items-center gap-2" style={{ padding: 8 }}>
                  <span className="text-2xl">{entry.avatar}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold leading-tight">{entry.name}</span>
                    <span className="block text-sm leading-tight opacity-70">{whereIs(entry)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => send(entry)}
                    disabled={!sameIsland || entry.busy || busy || pending !== null}
                    className="btn btn-primary text-base"
                    style={{ opacity: sameIsland && !entry.busy && !pending ? 1 : 0.4 }}
                  >
                    {entry.busy ? 'Đang bận' : sameIsland ? 'Thách đấu' : 'Khác đảo'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {incoming && (
        <PixelModal title="Có người thách đấu!" onClose={() => void respond(student.id, false)}>
          <div className="grid justify-items-center gap-2 text-center">
            <p className="text-5xl">{incoming.challenger.avatar}</p>
            <h3 className="pixel-font text-2xl leading-none">{incoming.challenger.name}</h3>
            <p className="text-lg leading-snug">
              muốn thi {SUBJECT_LABEL[incoming.subject]} lớp {incoming.grade} với con!
            </p>
            <p className="text-base leading-snug opacity-70">
              {PVP_QUESTIONS} câu. Hai bên cùng nhìn một câu hỏi - ai trả lời đúng trước thì được
              tấn công.
            </p>
            <div className="mt-1 flex w-full gap-2">
              <button
                type="button"
                onClick={() => void respond(student.id, false)}
                disabled={busy}
                className="btn btn-ghost flex-1 text-lg"
              >
                Để lúc khác
              </button>
              <button
                type="button"
                onClick={accept}
                disabled={busy}
                className="btn btn-primary flex-[2] text-xl"
              >
                Nhận lời!
              </button>
            </div>
          </div>
        </PixelModal>
      )}

      {outgoing && (
        <PixelModal title="Đang chờ..." onClose={() => void leave(student.id)}>
          <div className="grid justify-items-center gap-2 text-center">
            <p className="animate-pulse text-5xl">{outgoing.opponent.avatar}</p>
            <p className="text-lg leading-snug">
              Đã gửi lời thách tới <strong>{outgoing.opponent.name}</strong>. Đợi bạn ấy nhận lời
              nhé!
            </p>
            <button
              type="button"
              onClick={() => void leave(student.id)}
              className="btn btn-ghost mt-1 w-full text-lg"
            >
              Thôi không thách nữa
            </button>
          </div>
        </PixelModal>
      )}

      {declined && (
        <PixelModal title="Lần khác nhé" onClose={dismiss}>
          <div className="grid justify-items-center gap-2 text-center">
            <p className="text-5xl">{declined.opponent.avatar}</p>
            <p className="text-lg leading-snug">
              <strong>{declined.opponent.name}</strong> đang bận chút việc. Rủ bạn khác, hoặc đi
              đánh quái một lát rồi quay lại nhé!
            </p>
            <button type="button" onClick={dismiss} className="btn btn-primary mt-1 w-full text-lg">
              Được thôi
            </button>
          </div>
        </PixelModal>
      )}

      {error && (
        <PixelModal title="Chưa đấu được" onClose={clearError}>
          <div className="grid justify-items-center gap-2 text-center">
            <p className="text-lg leading-snug">{error}</p>
            <button type="button" onClick={clearError} className="btn btn-primary w-full text-lg">
              Đã hiểu
            </button>
          </div>
        </PixelModal>
      )}
    </>
  )
}

/** "Đang ở Đảo Toán lớp 2" hoặc "Đang ở sảnh". */
function whereIs(entry: LobbyEntry): string {
  if (!entry.subject || !entry.grade) return 'Đang ở bản đồ thế giới'
  return `Đảo ${SUBJECT_LABEL[entry.subject]} lớp ${entry.grade}`
}
