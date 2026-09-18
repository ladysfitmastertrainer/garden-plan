/**
 * Bản đồ thế giới: chọn môn rồi chọn node để vào trận.
 *
 * Node hiển thị theo đường zigzag từ dưới lên - trẻ thấy rõ mình đã đi được bao
 * xa và còn bao xa nữa, giống cảm giác leo bậc thang.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCompactLayout } from '../../shell/useCompactLayout'
import { AnimatePresence, motion } from 'framer-motion'
import { setMuted } from '../../audio/synth'
import { regionKey, useUi } from '../../store/ui'
import { Overworld } from '../world/Overworld'
import { DialogueBox } from '../../ui/DialogueBox'
import { HERO_CREATURES, creatureFromAvatar } from '../pixel/creatures'
import { PixelSprite } from '../pixel/sprite'
import { PETS, buildTeam } from '../../content/pets'
import { petSpriteFor } from '../inventory/PetCollection'
import { biomeFor, gradeLight } from '../world/biome'
import { SkillTreeScreen } from '../world/SkillTreeScreen'
import { SUBJECTS, SUBJECT_LABEL, type Grade, type Subject } from '../../content/types'
import { WorldMapScreen } from '../world/WorldMapScreen'
import { totalNodes, type MapNode } from '../../content/worldmap'
// Cùng tên với `regionKey` của store/ui nhưng khác chữ ký - cái này nhận (môn,
// lớp), cái kia nhận một đối tượng vùng. Đổi tên để không ai gọi nhầm.
import { regionKey as progressKey, type StudentProgress } from '../../data/types'
import { levelFromTotalXp } from '../../engine/rewards'
import { useAuth } from '../../store/auth'
import { useGame } from '../../store/game'
import { useTutorial } from '../../store/tutorial'
import { InstallCard } from '../../ui/InstallPrompt'
import { PvpLobby } from '../pvp/PvpLobby'
import { usePvpSync } from '../pvp/usePvpSync'

const SUBJECT_STYLE: Record<Subject, { color: string; emoji: string; land: string }> = {
  math: { color: 'var(--color-math)', emoji: '🔢', land: 'Thung lũng Con Số' },
  vietnamese: { color: 'var(--color-vietnamese)', emoji: '📖', land: 'Rừng Ngôn Từ' },
  music: { color: 'var(--color-music)', emoji: '🎵', land: 'Đảo Thanh Âm' },
  ethics: { color: 'var(--color-ethics)', emoji: '💛', land: 'Đồi Ánh Sáng' },
}

export function MapScreen() {
  const student = useGame((s) => s.student)
  const worldMap = useGame((s) => s.worldMap)
  const startBattle = useGame((s) => s.startBattle)
  const startWildBattle = useGame((s) => s.startWildBattle)
  const markFound = useGame((s) => s.markFound)
  const startTowerBattle = useGame((s) => s.startTowerBattle)
  const leaveStudent = useGame((s) => s.leaveStudent)
  const go = useUi((s) => s.go)
  // Vùng đất đang mở: null = đang ở bản đồ thế giới. Giữ ở store chứ không ở
  // state cục bộ - màn này bị gỡ khỏi cây khi vào trận (xem `store/ui.ts`).
  const region = useUi((s) => s.region)
  const setRegion = useUi((s) => s.enterRegion)
  const progress = useGame((s) => s.progress)

  /**
   * Bản đồ vùng đang mở.
   *
   * PHẢI nhớ lại: `worldMap()` dựng một mảng chặng MỚI TINH mỗi lần gọi (xem
   * `store/game.ts`). Gọi thẳng trong JSX thì mỗi lần màn này render lại là một
   * danh tính khác, và `Overworld` hiểu đó là "đã đổi bản đồ" - nó dựng lại đàn
   * quái rồi vẽ lại toàn bộ nền. Chỉ cần mở hộp thoại một cái là đủ kích hoạt.
   */
  const regionMap = useMemo(
    () => (region ? worldMap(region.subject, region.grade) : null),
    [region, worldMap, progress],
  )

  /*
    Nhịp tim của đấu trường lớp học, và nó PHẢI đứng trước mọi lệnh `return` sớm
    ở dưới - đó là luật của hook.

    Báo lên đúng hòn đảo trẻ đang đứng, nên bạn cùng lớp thấy em ấy ở đâu và
    thách đấu được ngay tại đó. Trẻ không ở lớp nào thì đây là một việc không
    làm gì cả (xem `heartbeat` trong `server/pvp.ts`) - app ở nhà vẫn chạy y hệt.
  */
  usePvpSync(student?.id ?? null, region)

  // Điện thoại và máy tính bảng dựng đứng: bản đồ chiếm trọn máy, mọi khung phụ
  // chui vào ngăn kéo. Xem cuối hàm này và `shell/useCompactLayout.ts`.
  const immersive = useCompactLayout()
  const [menuOpen, setMenuOpen] = useState(false)

  // Đóng ngăn kéo khi trẻ bước vào hay bước ra khỏi một vùng đất: sau cú bấm ấy
  // màn hình đã là một nơi khác, mà ngăn kéo thì vẫn che mất nó.
  useEffect(() => setMenuOpen(false), [region?.subject, region?.grade])

  /*
    Nút ☰, dựng MỘT LẦN và đi vào TRONG khung của màn đang mở.

    Cả hai màn - bản đồ thế giới và bản đồ vùng - đều vẽ một cái khung có viền,
    căn giữa màn hình, và đó mới là "màn hình game" theo mắt trẻ. Bản trước dán
    nút này vào mép MÀN HÌNH: trên điện thoại dựng đứng, nơi khung game không
    bao giờ cao bằng máy, nó nổi lên giữa dải trống phía trên khung, trông như
    một nút rơi ra ngoài trò chơi. Giờ nó là lớp phủ của chính cái khung, nên
    hai màn đều gọn trong đúng một khung duy nhất.
  */
  const menuButton = (
    <button
      type="button"
      onClick={() => setMenuOpen(true)}
      className="pixel-font hud-btn hud-btn-menu"
      aria-label="Mở bảng điều khiển"
      aria-expanded={menuOpen}
    >
      ☰
    </button>
  )

  if (!student) return null

  const { level, xpIntoLevel, xpForNext } = levelFromTotalXp(student.totalXp)
  // Đang đứng trong một vùng đất: phần đầu trang phải nhường chỗ cho bản đồ.
  const inRegion = region !== null

  /*
    Hàng nút thu lại còn biểu tượng khi đang đi cảnh - nhưng KHÔNG trong ngăn kéo.

    Trong ngăn kéo thì chỗ rộng rãi, mà ba biểu tượng trần trụi giữa một trang
    trống thì phải đoán nghĩa. Lý do thu gọn ban đầu là để nhường chỗ cho bản đồ;
    trong ngăn kéo không có bản đồ nào để nhường cả.
  */
  const navCompact = inRegion && !immersive


  /*
    Mọi khung PHỤ, gom lại một chỗ.

    Trên máy tính chúng xếp dọc phía trên bản đồ như cũ. Trên điện thoại chúng
    chui hết vào ngăn kéo sau nút ☰ - xem `immersive` ở cuối hàm này.
  */
  const chrome = (
    <>
      <header className="pixel-panel flex items-center gap-3">
        <PixelSprite sprite={HERO_CREATURES[creatureFromAvatar(student.avatar)]} scale={3} />
        <div className="flex-1">
          <p className="text-xl font-extrabold">{student.name}</p>
          <p className="pixel-font text-lg opacity-70">
            Lớp {student.grade} · Cấp {level} · 🪙 {student.gold}
          </p>
          <div className="mt-1 h-3 overflow-hidden" style={{ background: "#5a6472", border: "2px solid #1b2432", borderRadius: 3 }}>
            <div
              className="h-full"
              style={{
                background: "#f0c419",
                width: xpForNext === 0 ? '100%' : `${(xpIntoLevel / xpForNext) * 100}%`,
              }}
            />
          </div>
        </div>
        <ExitButton onLeave={leaveStudent} />
      </header>

      {/*
        Đang đứng trong một vùng thì hàng nút này thu lại còn ba biểu tượng.

        Nhãn đầy đủ trên điện thoại dọc phải xuống hai dòng và chiếm 127px - gần
        bằng một phần tư màn hình, chỉ để nói ba thứ mà trẻ đang không dùng tới:
        lúc này em đang đi cảnh. Giữ nguyên ô chạm 48px nên ngón tay vẫn bấm
        trúng, và tên vẫn còn cho trình đọc màn hình.
      */}
      {/*
        KHÔNG còn nút "Bố mẹ / Thầy cô" ở đây.

        Khu vực người lớn đã có lối vào riêng của nó: đăng xuất khỏi hồ sơ trẻ
        bằng nút ở thanh trên là về thẳng đó. Một nút thứ hai dẫn tới cùng chỗ,
        đặt giữa màn chơi của trẻ, chỉ làm hai việc: chiếm chỗ, và mời một đứa
        bé bảy tuổi bấm vào trang số liệu không dành cho nó.
      */}
      <nav className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => go('inventory')}
          className={navCompact ? 'btn btn-ghost px-4 text-lg' : 'btn btn-ghost flex-1 text-base'}
          aria-label="Kho đồ"
          title="Kho đồ"
        >
          {navCompact ? '🎒' : '🎒 Kho đồ'}
        </button>
        <MuteButton compact={navCompact} />
        <MusicButton compact={navCompact} />
      </nav>

      {/* Ngăn kéo là chỗ duy nhất trẻ dừng lại đọc, nên bảng tiến độ nằm ở đây. */}
      {immersive && <ProgressPanel progress={progress} grade={student.grade} region={region} />}

      {/*
        CÂY KỸ NĂNG NẰM TRONG NGĂN KÉO, không còn là một thẻ trên bản đồ.

        Nó vốn là một trong hai thẻ "Đi cảnh / Cây kỹ năng" ở đầu vùng đất, và
        cặp thẻ ấy ăn một dải ngang ngay trên bản đồ chỉ để nói rằng có một màn
        thứ hai tồn tại. Mà cây kỹ năng là thứ để ĐỌC - một bảng chi chít chữ,
        cuộn dài, trẻ mở ra xem mình giỏi cái gì rồi đóng lại - nên chỗ của nó
        đúng là ngăn kéo, cùng với hồ sơ và bảng tiến độ. Bản đồ thì trả lại
        trọn vẹn cho việc đi cảnh.

        Bấm một kỹ năng ở đây là vào trận luôn: lúc ấy màn này bị gỡ khỏi cây
        nên ngăn kéo tự biến mất, không cần đóng lại bằng tay.
      */}
      {immersive && region && regionMap && (
        <SkillTreeScreen
          map={regionMap}
          mastery={progress.mastery}
          onPlay={(node) => startBattle(region.subject, node, region.grade)}
        />
      )}

      {/*
        LỐI VÀO CHỦ ĐỘNG của bàn hướng dẫn, và nó KHÔNG quan tâm tới lời từ chối
        nào cả.

        Lời mời lúc mới vào app chỉ hỏi một lần rồi im - đúng như nó nên thế.
        Nhưng bấm "không" nghĩa là "đừng hỏi nữa", không phải "đừng bao giờ cho
        con xem", mà không có mục này thì một cú chạm nhầm là mất hẳn đường xem
        hướng dẫn. Cùng một lẽ với `InstallCard` ngay bên dưới.
      */}
      <TutorialCard />

      <InstallCard />

      {/*
        Bảng bạn cùng lớp, và cửa vào một trận PVP.

        Đặt ở ĐÂY - trên cả bản đồ thế giới lẫn bản đồ trong vùng - chứ không
        riêng một chỗ: bạn bè xuất hiện và biến mất suốt cả buổi học, nên trẻ
        phải thấy được điều đó dù đang đứng ở đâu. Tự thu lại khi cả lớp tắt máy.
      */}
      <PvpLobby student={student} progress={progress} region={region} />
    </>
  )

  const mapArea =
    region === null ? (
      <WorldMapScreen
        grade={student.grade}
        avatar={student.avatar}
        clearedByRegion={progress.clearedNodes}
        towerCleared={progress.towerCleared ?? []}
        onEnterRegion={(subject, grade) => setRegion({ subject, grade })}
        onEnterTower={(subject, grade) => startTowerBattle(subject, grade)}
        hud={immersive ? menuButton : undefined}
      />
    ) : (
      regionMap && (
        <SubjectMap
          key={regionKey(region)}
          subject={region.subject}
          grade={region.grade}
          map={regionMap}
          immersive={immersive}
          menu={menuButton}
          onBack={() => setRegion(null)}
          onPlay={(node) => startBattle(region.subject, node, region.grade)}
          onWild={(kind, variant) => startWildBattle(region.subject, region.grade, kind, variant)}
          onFound={(key) => markFound(key)}
          foundSpots={progress.foundSpots ?? []}
        />
      )
    )

  /*
    ---- ĐIỆN THOẠI: BẢN ĐỒ CHIẾM TRỌN MÁY ----

    Trên một máy 390×844, thanh hồ sơ (96px), hàng nút (56px), bảng bạn cùng lớp
    (52px) và lời mời cài app cộng lại ăn hơn một phần ba chiều cao - và chúng
    đứng NGAY TRÊN cái bản đồ mà trẻ đang chơi, đẩy nó xuống còn một ô bé tí ở
    giữa màn hình. Không khung nào trong số đó là thứ trẻ đang nhìn.

    Nên chúng chui hết vào một ngăn kéo sau nút ☰. Bản đồ lấy trọn màn hình, y
    như mọi game đi cảnh khác trên điện thoại.

    Máy tính giữ nguyên bố cục cũ: ở đó màn hình rộng rãi, xếp dọc không chật
    chội, và một ngăn kéo chỉ là thêm một cú bấm không để làm gì.
  */
  if (immersive) {
    return (
      <div className="pixel-ui map-layout map-immersive">
        {mapArea}

        {/*
          Lối ra của ngăn kéo: một nút GỌI TÊN NƠI NÓ TRẢ VỀ.

          Nút cũ ở đây viết "← Quay lại bản đồ" và nằm dưới đáy ngăn kéo. Cái
          nhãn ấy nói dối khi trẻ đang đứng trong một vùng đất - "quay lại bản
          đồ" là việc mà mũi tên ← trên khung game làm, tức về bản đồ thế giới -
          nên nó bị bỏ đi. Nhưng bỏ đi rồi thì ngăn kéo không còn lối ra nào có
          chữ, và đó là một ngõ cụt còn tệ hơn một cái nhãn mập mờ.

          Nên nó quay lại, lần này nói đúng tên chỗ nó trả về: tên vùng đất khi
          đang ở trong vùng, "bản đồ thế giới" khi đang ở ngoài. Không còn hai
          nút hứa cùng một việc mà làm hai việc khác nhau.

          DÍNH LÊN ĐỈNH ngăn kéo (`position: sticky`): ngăn kéo giờ chứa cả cây
          kỹ năng, một bảng cuộn dài, và một lối ra chỉ thấy được khi đã cuộn
          hết thì cũng gần như không có.
        */}
        {menuOpen && (
          <div className="map-immersive-sheet" role="dialog" aria-label="Bảng điều khiển">
            <div className="map-immersive-sheet-inner flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="btn btn-primary map-immersive-sheet-back w-full text-lg"
              >
                ← Quay lại {region ? biomeFor(region.subject, region.grade).land : 'bản đồ thế giới'}
              </button>
              {chrome}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pixel-ui map-layout mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-4">
      {chrome}
      {mapArea}
    </div>
  )
}

/**
 * "Xem hướng dẫn", nằm trong ngăn kéo sau nút ☰.
 *
 * Mở lại bàn hướng dẫn từ đầu, bất kể trước đó trẻ đã trả lời lời mời thế nào.
 * Bàn ấy không ghi gì xuống hồ sơ (xem `content/tutorial.ts`), nên xem lại bao
 * nhiêu lần cũng không mất gì - và một đứa trẻ quay lại app sau hai tuần nghỉ
 * hè thì việc muốn xem lại là chuyện bình thường.
 */
function TutorialCard() {
  const start = useTutorial((s) => s.start)

  return (
    <section className="pixel-panel grid gap-2">
      <p className="pixel-font text-xl">🎓 Xem hướng dẫn</p>
      <p className="text-base leading-snug">
        Một bãi tập nhỏ: đi thử một vòng, đánh thử một trận, rồi đọc sổ tay.
        Chừng ba phút.
      </p>
      <button type="button" onClick={start} className="btn btn-primary w-full text-lg">
        Vào bãi tập
      </button>
    </section>
  )
}

/**
 * "Con đang ở đâu, và con đã đi được tới đâu."
 *
 * Chỉ có mặt trong ngăn kéo trên điện thoại, và đó là chủ ý: ngăn kéo là chỗ
 * DUY NHẤT trẻ dừng lại để đọc. Mọi chỗ khác trên màn chơi, em ấy đang đi, đang
 * đánh, hoặc đang chọn - dán một bảng số liệu vào đó thì nó vừa bị lướt qua vừa
 * lấy mất chỗ của bản đồ.
 *
 * Số liệu ở đây là số của CHÍNH TRẺ, viết cho trẻ đọc: bao nhiêu chặng đã qua,
 * bao nhiêu con thú đã có, thắng bao nhiêu trận. Không có tỉ lệ phần trăm, không
 * có biểu đồ, không có mức thạo - những thứ ấy là ngôn ngữ của người lớn và đã
 * có chỗ riêng của chúng ở khu vực phụ huynh.
 */
function ProgressPanel({
  progress,
  grade,
  region,
}: {
  progress: StudentProgress
  grade: Grade
  region: { subject: Subject; grade: Grade } | null
}) {
  const here = region ? biomeFor(region.subject, region.grade) : null
  const pets = progress.pets?.length ?? 0

  return (
    <section className="pixel-panel grid gap-2">
      <p className="pixel-font text-xl">📍 Con đang ở</p>
      <p className="text-base leading-snug">
        {here ? (
          <>
            <strong>{here.land}</strong> — {SUBJECT_LABEL[region!.subject]} lớp {region!.grade}
          </>
        ) : (
          <>
            <strong>Bản đồ thế giới</strong> — quần đảo lớp {grade}
          </>
        )}
      </p>

      <p className="pixel-font mt-1 text-xl">📈 Con đã đi tới đâu</p>
      <div className="grid gap-1">
        {SUBJECTS.map((subject) => {
          const total = totalNodes(subject, grade)
          const cleared = Math.min(total, progress.clearedNodes[progressKey(subject, grade)] ?? 0)
          return (
            <div key={subject} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-base">{SUBJECT_LABEL[subject]}</span>
              <span
                className="h-3 overflow-hidden"
                style={{
                  width: 96,
                  background: '#5a6472',
                  border: '2px solid #1b2432',
                  borderRadius: 3,
                }}
                role="img"
                aria-label={`${cleared} trên ${total} chặng`}
              >
                <span
                  className="block h-full"
                  style={{
                    width: `${(cleared / total) * 100}%`,
                    background: SUBJECT_STYLE[subject].color,
                  }}
                />
              </span>
              <span className="pixel-font text-base tabular-nums opacity-70">
                {cleared}/{total}
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-1 text-base leading-snug">
        🐾 Thú đã thu phục: <strong>{pets}</strong>/{PETS.length} · 🏆 Thắng{' '}
        <strong>{progress.battlesWon}</strong>/{progress.battlesPlayed} trận
      </p>
    </section>
  )
}

/**
 * Trẻ trên máy dùng chung thì nút này là "thoát" (đăng xuất hẳn) chứ không phải
 * "đổi người chơi" - không để em này vào được hồ sơ của em khác.
 */
function ExitButton({ onLeave }: { onLeave: () => void }) {
  const mode = useAuth((s) => s.mode)
  const signOut = useAuth((s) => s.signOut)
  const isChild = mode === 'child'

  return (
    <button
      type="button"
      onClick={() => (isChild || mode === 'adult' ? void signOut() : onLeave())}
      className="shrink-0 rounded-xl px-3 py-2 text-sm font-bold"
      style={{ background: 'var(--color-paper-sunk)' }}
    >
      {isChild ? 'Thoát' : mode === 'adult' ? 'Đăng xuất' : 'Đổi\nngười chơi'}
    </button>
  )
}

/**
 * Bật/tắt RIÊNG nhạc nền, không đụng tới tiếng game.
 *
 * Hai công tắc chứ không một, vì hai thứ bị tắt vì hai lý do khác nhau: tắt
 * tiếng là "chỗ này không được phát ra tiếng gì", còn tắt nhạc là "tiếng game
 * thì vẫn cần, nhưng ba mươi cái máy cùng phát một bản nhạc thì thành ồn". Gộp
 * hai việc vào một cái nút thì lớp học chỉ còn hai lựa chọn, mà không lựa chọn
 * nào là thứ thầy cô đang muốn.
 */
function MusicButton({ compact = false }: { compact?: boolean }) {
  const musicOn = useUi((s) => s.musicOn)
  const setMusicOn = useUi((s) => s.setMusicOn)

  return (
    <button
      type="button"
      onClick={() => setMusicOn(!musicOn)}
      aria-pressed={!musicOn}
      aria-label={musicOn ? 'Nhạc nền đang bật' : 'Nhạc nền đang tắt'}
      title={musicOn ? 'Nhạc nền đang bật' : 'Nhạc nền đang tắt'}
      className={compact ? 'btn btn-ghost px-4 text-lg' : 'btn btn-ghost px-5 text-base'}
    >
      {/*
        Cùng một nốt nhạc ở cả hai trạng thái, chỉ khác gạch ngang và độ mờ.

        Không dùng một emoji thứ hai cho trạng thái tắt: 🔇 đã là của nút tắt
        tiếng ngay bên cạnh, và hai nút cạnh nhau cùng hiện 🔇 thì không ai đoán
        được cái nào vừa tắt cái gì.
      */}
      <span style={{ opacity: musicOn ? 1 : 0.5, textDecoration: musicOn ? 'none' : 'line-through' }}>
        {compact ? '🎵' : musicOn ? '🎵 Có nhạc' : '🎵 Tắt nhạc'}
      </span>
    </button>
  )
}

/** Bật/tắt tiếng. Lớp học đông hoặc giờ ngủ trưa thì rất cần. */
function MuteButton({ compact = false }: { compact?: boolean }) {
  const muted = useUi((s) => s.muted)
  const setUiMuted = useUi((s) => s.setMuted)

  // Store là nguồn chân lý; module âm thanh chỉ đi theo.
  useEffect(() => setMuted(muted), [muted])

  return (
    <button
      type="button"
      onClick={() => setUiMuted(!muted)}
      aria-pressed={muted}
      aria-label={muted ? 'Đang tắt tiếng' : 'Có tiếng'}
      title={muted ? 'Đang tắt tiếng' : 'Có tiếng'}
      className={compact ? 'btn btn-ghost px-4 text-lg' : 'btn btn-ghost px-5 text-base'}
    >
      {compact ? (muted ? '🔇' : '🔊') : muted ? '🔇 Đang tắt tiếng' : '🔊 Có tiếng'}
    </button>
  )
}

function SubjectMap({
  subject,
  grade,
  map,
  immersive = false,
  menu,
  onBack,
  onPlay,
  onWild,
  onFound,
  foundSpots,
}: {
  subject: Subject
  grade: Grade
  map: ReturnType<ReturnType<typeof useGame.getState>['worldMap']>
  /**
   * Điện thoại: hàng tiêu đề và hai thẻ biến đi, bản đồ chiếm trọn màn hình, và
   * hai nút duy nhất còn lại (← quay lại, ☰ bảng điều khiển) dọn vào TRONG khung
   * game. Cây kỹ năng chuyển sang nằm trong ngăn kéo của màn cha.
   */
  immersive?: boolean
  /** Nút ☰ của màn cha, để đặt vào góc trên - phải của khung game. */
  menu?: React.ReactNode
  onBack: () => void
  onPlay: (node: MapNode) => void
  onWild: (kind: 'wild' | 'mini' | 'secret', variant?: number) => void
  /** Ghi nhớ một chỗ vừa tìm ra, để lần sau không lục lại được nữa. */
  onFound: (key: string) => void
  /** Những chỗ đã tìm ra từ trước, đọc từ tiến độ của trẻ. */
  foundSpots: string[]
}) {
  const style = SUBJECT_STYLE[subject]

  const biome = biomeFor(subject, grade)
  const student = useGame((s) => s.student)
  const mastery = useGame((s) => s.progress.mastery)
  /**
   * Thứ đang hỏi trẻ "vào chứ?".
   *
   * CHỈ TRÙM VÀ ĐẦU ĐÀN MỚI ĐƯỢC HỎI. Quái thường chạm mặt là đánh luôn - đó là
   * con quái đang chặn đường, không phải một cánh cửa để ngắm. Hỏi ở mọi chỗ thì
   * cái hộp thoại mất hết trọng lượng, và lúc thật sự cần cân nhắc (trùm cuối
   * vùng đất) trẻ đã quen bấm "Vào trận!" theo quán tính rồi.
   *
   * `'mini'` là con đầu đàn trong hang - nó không gắn với chặng nào trên bản đồ.
   */
  const [preview, setPreview] = useState<MapNode | 'mini' | null>(null)
  const [tab, setTab] = useState<'world' | 'tree'>('world')
  /**
   * Chuyện vừa xảy ra ở một ngôi nhà hoặc một ô quái ẩn.
   *
   * Giữ cả LỜI THOẠI lẫn việc phải làm khi trẻ bấm tiếp, vì hai thứ ấy luôn đi
   * cùng nhau: mở cửa ra thấy vật phẩm thì bấm tiếp là đóng cửa lại, còn thấy
   * con đầu đàn thì bấm tiếp là vào trận.
   */
  const [visit, setVisit] = useState<Visit | null>(null)
  // Đàn quái đã hạ trong chuyến đi này, và chỗ ghi nhận con vừa đụng vào.
  const beaten = useUi((s) => s.beatenMonsters)
  const bumpMonster = useUi((s) => s.bumpMonster)

  // Con đầu đội hình đi theo trẻ trên bản đồ - đúng con sẽ ra trận đầu tiên.
  // PHẢI đọc qua selector: thu phục thêm thú xong thì con đi theo phải đổi ngay,
  // getState() chỉ chụp một lần nên bản đồ sẽ giữ con cũ tới lúc mở lại vùng.
  const ownedPets = useGame((s) => s.progress.pets)
  // PHẢI truyền kinh nghiệm vào: thiếu nó thì con đã tiến hoá vẫn đi theo trẻ
  // bằng hình cũ, trong khi vào trận lại ra hình mới - hai nơi lệch nhau.
  const petXp = useGame((s) => s.progress.petXp)
  const leader = buildTeam(ownedPets ?? [], subject, 3, petXp ?? {})[0]

  // Chỗ đứng trong vùng này, nhớ qua cả trận đấu.
  const posKey = regionKey({ subject, grade })
  const savedPos = useUi((s) => s.overworldPos[posKey])
  const rememberPos = useUi((s) => s.rememberPos)
  const onPosition = useCallback(
    (pos: { x: number; y: number }) => rememberPos(posKey, pos),
    [posKey, rememberPos],
  )
  // Nhớ theo GIÁ TRỊ (tên sprite + hệ), không theo object `leader`: `buildTeam`
  // trả về đội hình mới mỗi lần render, còn `petSpriteFor` tô lại màu ra sprite
  // mới - hai cái cộng lại là con thú vẽ lại canvas ở mọi lần render.
  const follower = useMemo(
    () =>
      leader ? { sprite: petSpriteFor(leader.sprite, leader.element) } : null,
    [leader?.sprite, leader?.element],
  )

  /**
   * Bước vào một ngôi nhà trên khu đất cao.
   *
   * Lục rồi thì không lục lại được - nếu không thì cái nhà thành một cái máy
   * phát vật phẩm, đi ra đi vào là có đồ, và mọi thứ khác trên bản đồ mất giá.
   *
   * Bốc thăm bằng CHÍNH TOẠ ĐỘ cửa, không bốc ngẫu nhiên: cùng một ngôi nhà
   * thì lần nào mở cũng ra cùng một chuyện, nên trẻ kể cho bạn nghe được và
   * lời kể ấy đúng. Ngẫu nhiên thật thì bấm lại là đổi kết quả.
   */
  const enterHouse = (at: { x: number; y: number }) => {
    const key = `${subject}.g${grade}.nha.${at.x}.${at.y}`
    if (foundSpots.includes(key)) {
      setVisit({ text: EMPTY_HOUSE, action: null })
      return
    }

    // Một phần ba số nhà có quái nấp trong, hai phần ba có đồ.
    if ((at.x * 7 + at.y * 13) % 3 === 0) {
      setVisit({
        text: HOUSE_MONSTER,
        action: () => {
          onFound(key)
          onWild('mini')
        },
      })
      return
    }

    onFound(key)
    setVisit({ text: HOUSE_LOOT, action: null })
  }

  /** Giẫm trúng ô có quái ẩn. Không có đường lùi - nó nhảy ra luôn. */
  const meetSecret = (at: { x: number; y: number }) => {
    const key = `${subject}.g${grade}.an.${at.x}.${at.y}`
    if (foundSpots.includes(key)) return
    setVisit({
      text: SECRET_MONSTER,
      action: () => {
        onFound(key)
        // Quái ẩn không phải con nào đứng trên bản đồ, nên xoá cờ "vừa đụng vào
        // con nào" - thắng trận này không được xoá nhầm một con quái khác.
        bumpMonster(null)
        onWild('secret')
      },
    })
  }

  return (
    <div className={`pixel-ui region-layout grid gap-3${immersive ? ' region-immersive' : ''}`}>
      <div className="region-head flex items-center gap-3">
        <button type="button" onClick={onBack} className="btn btn-ghost px-4">
          ←
        </button>
        <div className="flex-1">
          <h2 className="pixel-font text-2xl">{biome.land}</h2>
          <p className="pixel-font text-lg opacity-70">
            {SUBJECT_LABEL[subject]} lớp {map.grade} · {gradeLight(grade)} ·{' '}
            {map.clearedCount}/{map.nodes.filter((n) => n.kind !== 'review').length} chặng
          </p>
        </div>
      </div>

      {/*
        Hai cách nhìn cùng một vùng đất, CHỈ CÒN TRÊN MÁY TÍNH.

        Trên điện thoại cây kỹ năng đã dọn vào ngăn kéo sau nút ☰ (xem
        `MapScreen`), nên cặp thẻ này không còn gì để chuyển qua lại - và một
        dải thẻ ngang nằm đè lên bản đồ để chỉ tới một màn không còn ở đó nữa
        thì tệ hơn là không có.
      */}
      {!immersive && (
        <div className="region-tabs flex gap-2">
          {(['world', 'tree'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              aria-pressed={tab === value}
              className="btn flex-1 text-base"
              style={{
                background: tab === value ? style.color : 'var(--color-paper-sunk)',
                color: tab === value ? '#fff' : 'var(--color-ink)',
                minHeight: 48,
              }}
            >
              {value === 'world' ? '🗺️ Đi cảnh' : '🌳 Cây kỹ năng'}
            </button>
          ))}
        </div>
      )}

      {tab === 'tree' && !immersive ? (
        <SkillTreeScreen map={map} mastery={mastery} onPlay={onPlay} />
      ) : (
      <Overworld
        nodes={map.nodes}
        seed={`${subject}-g${grade}`}
        biome={biome}
        subject={subject}
        onWildEncounter={(variant) => onWild('wild', variant)}
        beaten={beaten}
        onMonsterBump={(node, id) => {
          bumpMonster(id ?? null)
          if (!node) setPreview('mini')
        }}
        onEnterHouse={enterHouse}
        onSecret={meetSecret}
        follower={follower}
        avatar={student?.avatar ?? '🦊'}
        startAt={savedPos}
        onPosition={onPosition}
        onEnterGate={(node) => (node.kind === 'battle' ? onPlay(node) : setPreview(node))}
        paused={preview !== null || visit !== null}
        fill={immersive}
        /*
          Mũi tên ← và nút ☰ đi VÀO TRONG khung game, hai góc trên.

          Trước đây chúng là một dải nút dán vào mép màn hình, và trên điện
          thoại dựng đứng khung game không cao bằng máy - nên dải nút ấy nổi
          giữa vùng trống phía trên khung, tách khỏi thứ nó điều khiển. Trong
          khung thì chúng đi theo khung ở mọi cỡ máy, và cả hai màn chỉ còn
          đúng một hình chữ nhật duy nhất chiếm trọn màn hình.
        */
        hud={
          immersive ? (
            <>
              <button
                type="button"
                onClick={onBack}
                className="pixel-font hud-btn hud-btn-back"
                aria-label="Về bản đồ thế giới"
              >
                ←
              </button>
              {menu}
            </>
          ) : undefined
        }
        dialogue={
          <AnimatePresence>
            {visit && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
              >
                <DialogueBox text={visit.text}>
                  <button
                    type="button"
                    onClick={() => {
                      const go = visit.action
                      setVisit(null)
                      go?.()
                    }}
                    autoFocus
                    className="btn btn-primary mt-2 w-full text-lg"
                    style={{ background: style.color, minHeight: 44 }}
                  >
                    {visit.action ? 'Vào trận!' : 'Đóng cửa lại'}
                  </button>
                </DialogueBox>
              </motion.div>
            )}
            {preview && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
              >
                <DialogueBox
                  text={preview === 'mini' ? MINI_BOSS_DIALOGUE : gateDialogue(preview)}
                >
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreview(null)}
                      className="btn btn-ghost flex-1 text-base"
                      style={{ minHeight: 44 }}
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = preview
                        setPreview(null)
                        if (target === 'mini') onWild('mini')
                        else onPlay(target)
                      }}
                      className="btn btn-primary flex-[2] text-lg"
                      style={{ background: style.color, minHeight: 44 }}
                    >
                      {preview !== 'mini' && preview.cleared ? 'Đánh lại' : 'Vào trận!'}
                    </button>
                  </div>
                </DialogueBox>
              </motion.div>
            )}
          </AnimatePresence>
        }
      />
      )}
    </div>
  )
}

/**
 * Lời thoại của con đầu đàn trong hang.
 *
 * Đầu đàn được hỏi vì nó KHÔNG chặn đường: trẻ phải tự tìm vào hang mới gặp, và
 * trận của nó khó hơn hẳn - có đếm giờ, đề nâng một bậc. Bị lôi vào mà không kịp
 * chuẩn bị thì đó là cái bẫy, không phải thử thách.
 */
const MINI_BOSS_DIALOGUE =
  'Một con đầu đàn!\nNó khoẻ hơn hẳn lũ quái ngoài kia, lại còn có đếm giờ. Con dám thử không?'

/** Lời thoại khi trẻ bước lên cổng. */
function gateDialogue(node: MapNode): string {
  if (node.kind === 'boss') {
    return `${node.title}!\nPhía sau cổng này là một đối thủ rất mạnh. Con sẵn sàng chưa?`
  }
  if (node.kind === 'review') {
    return `Cổng Ôn Tập.\n${node.subtitle}. Ôn lại một chút cho nhớ lâu nhé!`
  }
  if (node.cleared) {
    return `${node.title}.\nCon đã qua chặng này rồi. Muốn đánh lại để luyện thêm không?`
  }
  return `${node.title}.\n${node.subtitle}. Một đối thủ đang chờ phía trước!`
}

/**
 * Một lần ghé nhà hoặc một lần đụng phải quái ẩn.
 *
 * Giữ cả lời thoại lẫn việc phải làm khi bấm tiếp, vì hai thứ luôn đi cùng nhau:
 * mở cửa thấy vật phẩm thì bấm tiếp là đóng cửa, thấy quái thì bấm tiếp là vào
 * trận. `action` bằng null nghĩa là chẳng có gì để làm nữa.
 */
interface Visit {
  text: string
  action: (() => void) | null
}

/** Nhà đã lục rồi. Nói thẳng ra, đừng để trẻ đi vào đi ra mãi để thử lại. */
const EMPTY_HOUSE =
  'Căn nhà nhỏ trên đồi.\nCon đã ghé đây rồi - trong này không còn gì nữa.'

const HOUSE_LOOT =
  'Con đẩy cửa bước vào.\nTrên bàn có một thứ ai đó để lại cho người tìm ra căn nhà này. Đánh thắng trận sau là nó thuộc về con!'

const HOUSE_MONSTER =
  'Cửa vừa mở thì có tiếng gầm gừ.\nMột con đầu đàn đang ngủ trong này, và con vừa đánh thức nó dậy!'

/**
 * Quái ẩn - trận đáng giá nhất ngoài trùm.
 *
 * Lời thoại nói rõ vì sao nó thưởng hậu: không phải vì nó khoẻ, mà vì trẻ đã
 * tìm ra nó. Một đứa bé bảy tuổi cần được nghe điều đó thành lời thì mới biết
 * là việc chịu khó đi lang thang có được ghi nhận.
 */
const SECRET_MONSTER =
  'Một bóng đen bật dậy từ chỗ nấp!\nKhông ai tìm ra được chỗ này. Con thì tìm ra. Hạ nó đi - phần thưởng sẽ hậu hơn hẳn!'
