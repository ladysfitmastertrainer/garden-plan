/**
 * Cây kỹ năng của một vùng đất.
 *
 * Bản đồ đi cảnh cho biết ĐI TỚI ĐÂU RỒI. Cây này cho biết GIỎI CÁI GÌ RỒI - và
 * quan trọng hơn, cái gì phải học trước cái gì. Đường nối không phải trang trí:
 * nó vẽ đúng quan hệ `prerequisites` trong curriculum.ts.
 *
 * Vẽ từ trên xuống: gốc cây (học được ngay) ở DƯỚI, kỹ năng khó nằm TRÊN, đỉnh
 * là chặng trùm. Trẻ nhìn thấy mình đang leo lên, không phải đang tụt xuống.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MapNode, WorldMap } from '../../content/worldmap'
import { SUBJECT_LABEL } from '../../content/types'
import type { MasteryMap } from '../../engine/mastery'
import { biomeFor } from './biome'
import { buildSkillTree, type SkillState, type SkillTreeNode } from './skilltree'

const STATE_STYLE: Record<SkillState, { bg: string; border: string; label: string }> = {
  mastered: { bg: '#d7f5d0', border: '#2f7d32', label: 'Đã thạo' },
  learning: { bg: '#fff3c4', border: '#b8860b', label: 'Đang học' },
  available: { bg: '#f8f8f0', border: '#1b2432', label: 'Học được' },
  // "Chưa học" chứ không phải "Chưa mở": thẻ này vẫn bấm vào đánh được, chữ
  // trên nó chỉ nói trẻ chưa động tới kỹ năng đó bao giờ.
  notReady: { bg: '#c3ccd8', border: '#5d6a7d', label: 'Chưa học' },
}

interface Edge {
  points: string
  dim: boolean
}

export function SkillTreeScreen({
  map,
  mastery,
  onPlay,
}: {
  map: WorldMap
  mastery: MasteryMap
  onPlay: (node: MapNode) => void
}) {
  // PHẢI nhớ lại: đo vị trí các ô chạy trong useLayoutEffect và phụ thuộc vào
  // `tree`. Dựng cây mới ở mỗi lần vẽ thì lần đo nào cũng kích hoạt một lần vẽ
  // nữa - vòng lặp vô tận, màn hình trắng xoá.
  const tree = useMemo(
    () => buildSkillTree(map.subject, map.grade, mastery, map.clearedCount),
    [map.subject, map.grade, mastery, map.clearedCount],
  )
  const biome = biomeFor(map.subject, map.grade)

  const wrapRef = useRef<HTMLDivElement>(null)
  const boxes = useRef(new Map<string, HTMLElement>())
  const [edges, setEdges] = useState<Edge[]>([])
  const [size, setSize] = useState({ width: 0, height: 0 })

  const measure = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const base = wrap.getBoundingClientRect()
    setSize({ width: base.width, height: base.height })

    const next: Edge[] = []
    for (const node of tree.nodes) {
      const child = boxes.current.get(node.skill.id)
      if (!child) continue
      const c = child.getBoundingClientRect()

      for (const parentId of node.parents) {
        const parent = boxes.current.get(parentId)
        if (!parent) continue
        const p = parent.getBoundingClientRect()

        // Kỹ năng con nằm TRÊN kỹ năng cha, nên đường đi từ đỉnh cha lên đáy con.
        const x1 = p.left + p.width / 2 - base.left
        const y1 = p.top - base.top
        const x2 = c.left + c.width / 2 - base.left
        const y2 = c.bottom - base.top
        const mid = (y1 + y2) / 2

        // Gấp khúc vuông góc thay vì kẻ xiên: nét xiên bị làm mượt, phá mất
        // cảm giác pixel của cả màn hình.
        next.push({
          points: `${x1},${y1} ${x1},${mid} ${x2},${mid} ${x2},${y2}`,
          dim: node.state === 'notReady',
        })
      }
    }
    setEdges(next)
  }, [tree])

  useLayoutEffect(measure, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // Tầng cao vẽ trước để kỹ năng khó nằm ở trên.
  const tiers = [...tree.levels].reverse()

  return (
    <div className="pixel-ui grid gap-3">
      <div className="pixel-panel flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="pixel-font text-2xl leading-none">CÂY KỸ NĂNG</p>
          <p className="text-base opacity-70">
            {SUBJECT_LABEL[map.subject]} lớp {map.grade} · {biome.land}
          </p>
        </div>
        <div className="text-right">
          <p className="pixel-font text-2xl leading-none">
            {tree.masteredCount}/{tree.nodes.length} đã thạo
          </p>
          <p className="text-base opacity-70">Điểm thạo trung bình {tree.averageMastery}/100</p>
        </div>
      </div>

      <div ref={wrapRef} className="relative">
        <svg
          className="pointer-events-none absolute left-0 top-0"
          width={size.width}
          height={size.height}
          style={{ shapeRendering: 'crispEdges' }}
          aria-hidden="true"
        >
          {edges.map((edge, index) => (
            <polyline
              key={index}
              points={edge.points}
              fill="none"
              stroke={edge.dim ? '#9aa6b8' : '#1b2432'}
              strokeWidth={4}
            />
          ))}
        </svg>

        <div className="relative grid gap-4">
          <CrownCard tree={tree} map={map} onPlay={onPlay} />

          {tiers.map((tier, index) => (
            <div key={index} className="flex flex-wrap justify-center gap-3">
              {tier.map((node) => (
                <SkillCard
                  key={node.skill.id}
                  node={node}
                  mapNode={map.nodes[node.nodeIndex]}
                  register={(element) => {
                    if (element) boxes.current.set(node.skill.id, element)
                    else boxes.current.delete(node.skill.id)
                  }}
                  onPlay={onPlay}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-base opacity-70">
        Ô nối với nhau nghĩa là nên học ô dưới trước. Chạm vào ô nào cũng vào thẳng trận đó được.
      </p>
    </div>
  )
}

function CrownCard({
  tree,
  map,
  onPlay,
}: {
  tree: ReturnType<typeof buildSkillTree>
  map: WorldMap
  onPlay: (node: MapNode) => void
}) {
  const mapNode = map.nodes[tree.crown.nodeIndex]
  // `ready` chỉ là lời nhắn, KHÔNG phải cái chặn: trùm lúc nào cũng vào được.
  const ready = tree.crown.unlocked

  return (
    <div className="flex justify-center">
      <button
        type="button"
        disabled={!mapNode}
        onClick={() => mapNode && onPlay(mapNode)}
        className="pixel-panel w-full max-w-sm text-center"
        style={{
          background: tree.crown.cleared ? '#d7f5d0' : '#ffe0d0',
          borderColor: '#b4521f',
          cursor: 'pointer',
        }}
      >
        <p className="pixel-font text-3xl leading-none">
          {tree.crown.cleared ? '👑' : '★'} TRÙM CUỐI LỚP {map.grade}
        </p>
        <p className="mt-1 text-base">
          {tree.crown.cleared
            ? 'Con đã hạ được trùm vùng này rồi!'
            : ready
              ? 'Mọi chặng đã qua. Trùm đang đợi con ở sân đấu!'
              : 'Trùm đang đợi ở sân đấu. Chưa đi hết các chặng vẫn vào được - nhưng nó mạnh lắm đấy!'}
        </p>
      </button>
    </div>
  )
}

function SkillCard({
  node,
  mapNode,
  register,
  onPlay,
}: {
  node: SkillTreeNode
  mapNode: MapNode | undefined
  register: (element: HTMLElement | null) => void
  onPlay: (node: MapNode) => void
}) {
  const style = STATE_STYLE[node.state]
  const playable = Boolean(mapNode)

  return (
    <button
      ref={register}
      type="button"
      disabled={!playable || !mapNode}
      onClick={() => mapNode && onPlay(mapNode)}
      className="pixel-panel text-left"
      style={{
        width: 208,
        background: style.bg,
        borderColor: style.border,
        cursor: playable ? 'pointer' : 'default',
        padding: '10px 12px',
      }}
      aria-label={`${node.skill.name}, ${style.label}, điểm thạo ${node.mastery} trên 100`}
    >
      <p className="pixel-font text-lg leading-none opacity-70">{style.label}</p>
      <p className="text-base font-bold leading-tight">{node.skill.name}</p>

      <div
        className="mt-2 h-3 overflow-hidden"
        style={{ background: '#ffffff', border: '2px solid #1b2432', borderRadius: 3 }}
      >
        <div
          className="h-full"
          style={{
            width: `${node.mastery}%`,
            background: node.state === 'mastered' ? '#3f9b46' : '#f0c419',
          }}
        />
      </div>

      <p className="pixel-font mt-1 text-lg leading-none">
        {node.attempts === 0
          ? 'Chưa làm câu nào'
          : `${node.mastery}/100 · đúng ${Math.round((node.accuracy ?? 0) * 100)}%`}
      </p>

      {node.state === 'notReady' && node.externalParents.length > 0 && (
        <p className="mt-1 text-sm leading-tight opacity-70">
          Cần kỹ năng của lớp dưới trước.
        </p>
      )}
    </button>
  )
}
