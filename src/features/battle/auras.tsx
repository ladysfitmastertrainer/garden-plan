/**
 * HIỆU ỨNG QUANH TRÙM VÀ ĐẦU ĐÀN.
 *
 * Mỗi trùm một kiểu, theo đúng con vật của nó - phượng hoàng thì lửa cháy quanh
 * người, rồng âm nhạc thì sóng âm loang ra, chúa tể bóng đêm thì khói tím cuộn
 * lên. Cùng một vầng sáng chung cho mọi con thì cả bốn trận cuối lớp lại giống
 * nhau, chỉ khác màu.
 *
 * Đầu đàn có hiệu ứng NHẸ hơn trùm (vòng sáng dưới chân, hai ngôi sao trên đầu)
 * - đủ thấy "con này không phải quái thường", mà không lấn mất trận trùm.
 *
 * Toàn bộ là phần tử HTML + hoạt cảnh CSS (khung hình trong globals.css), không
 * nhận chạm, và chỗ gọi không dựng nó khi máy bật giảm chuyển động.
 */

export type AuraKind = 'runes' | 'fire' | 'sound' | 'shadow' | 'leader'

export interface AuraSpec {
  kind: AuraKind
  /** Màu chủ đạo - theo môn của con quái. */
  color: string
}

/** To hơn quái thường bao nhiêu lần: trùm 1,6, đầu đàn 1,25. */
export function auraGrow(spec: AuraSpec | undefined): number {
  if (!spec) return 1
  return spec.kind === 'leader' ? 1.25 : 1.6
}

/**
 * Hiệu ứng của một con, ở một trong hai lớp: \`back\` vẽ SAU hình (vầng sáng,
 * khói, lửa phía sau lưng), \`front\` vẽ TRƯỚC hình (lửa liếm ở chân, sao lấp
 * lánh trên đầu) - thiếu lớp trước thì mọi thứ đều nằm sau con vật và trông như
 * một tấm phông chứ không phải đang bao quanh nó.
 */
export function CreatureAura({ spec, width, layer }: { spec: AuraSpec; width: number; layer: 'back' | 'front' }) {
  const { kind, color } = spec
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: layer === 'front' ? 2 : 0 }} aria-hidden="true">
      {layer === 'back' && kind !== 'leader' && <Glow color={color} width={width} />}
      {kind === 'fire' && <Fire width={width} layer={layer} />}
      {kind === 'runes' && <Runes color={color} width={width} layer={layer} />}
      {kind === 'sound' && <Sound color={color} width={width} layer={layer} />}
      {kind === 'shadow' && <Shadow width={width} layer={layer} />}
      {kind === 'leader' && <Leader color={color} width={width} layer={layer} />}
    </div>
  )
}

/** Vầng sáng phập phồng sau lưng và vòng sáng loang dưới chân - chung cho trùm. */
function Glow({ color, width }: { color: string; width: number }) {
  return (
    <>
      <div
        className="absolute left-1/2"
        style={{
          bottom: '-6%',
          width: width * 1.5,
          height: width * 1.3,
          marginLeft: -width * 0.75,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${color}, ${color}aa 45%, ${color}33 75%, transparent 100%)`,
          // Cộng sáng chứ không phủ màu: trên nền sáng vầng sáng vẫn rực lên.
          mixBlendMode: 'screen',
          animation: 'boss-aura 2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute left-1/2"
        style={{
          bottom: -width * 0.04,
          width: width * 1.2,
          height: width * 0.3,
          marginLeft: -width * 0.6,
          borderRadius: '50%',
          border: `${Math.max(3, width * 0.03)}px solid ${color}`,
          boxShadow: `0 0 12px 2px ${color}`,
          animation: 'boss-ring 2s ease-out infinite',
        }}
      />
    </>
  )
}

/** Đốm sáng / tàn lửa bay lên từ chân. */
function Rising({ width, color, core, count, duration }: { width: number; color: string; core: string; count: number; duration: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = (i * 0.37 + 0.08) % 1
        return (
          <span
            key={i}
            className="absolute"
            style={
              {
                left: `${x * 100}%`,
                bottom: '8%',
                width: Math.max(5, width * 0.05),
                height: Math.max(5, width * 0.05),
                background: core,
                boxShadow: `0 0 8px 2px ${color}`,
                '--rise': `${-width * 0.95}px`,
                animation: `boss-spark ${duration}s ease-out ${(i * duration) / count}s infinite`,
                opacity: 0,
              } as React.CSSProperties
            }
          />
        )
      })}
    </>
  )
}

/** Một ngọn lửa: giọt ngược, lõi vàng, viền đỏ cam, liếm lên liên tục. */
function Flame({ left, bottom, size, delay }: { left: string; bottom: string; size: number; delay: number }) {
  return (
    <span
      className="absolute"
      style={{
        left,
        bottom,
        width: size,
        height: size * 1.7,
        marginLeft: -size / 2,
        // Đầu nhọn, đáy tròn - ra hình ngọn lửa chứ không phải quả trứng.
        // Tính theo phần trăm để ngọn to ngọn nhỏ đều cùng một dáng.
        clipPath: 'polygon(50% 0, 64% 22%, 86% 44%, 99% 64%, 96% 82%, 80% 96%, 50% 100%, 20% 96%, 4% 82%, 1% 64%, 14% 44%, 36% 22%)',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at 50% 78%, #fff6b0 0%, #ffd23f 22%, #ff8a1f 48%, rgb(240 70 30 / 0.55) 70%, rgb(230 60 30 / 0) 100%)',
        opacity: 0.9,
        transformOrigin: '50% 100%',
        animation: `flame-flicker 0.9s ease-in-out ${delay}s infinite alternate`,
      }}
    />
  )
}

/** PHƯỢNG HOÀNG: lửa cháy vòng quanh người, tàn lửa bay lên. */
function Fire({ width, layer }: { width: number; layer: 'back' | 'front' }) {
  if (layer === 'back') {
    // Viền quanh thân, không đè lên giữa người: lửa BAO quanh phượng hoàng.
    const spots: Array<[number, number, number]> = [
      [-0.04, 0.05, 0.2], [0.06, 0.32, 0.24], [0.14, 0.6, 0.2],
      [0.86, 0.6, 0.2], [0.94, 0.32, 0.24], [1.04, 0.05, 0.2],
    ]
    return (
      <>
        {spots.map(([x, y, s], i) => (
          <Flame key={i} left={`${x * 100}%`} bottom={`${y * 100}%`} size={width * s} delay={i * 0.17} />
        ))}
        <Rising width={width} color="#ff8a1f" core="#fff1a8" count={7} duration={1.8} />
      </>
    )
  }
  // Lớp trước: lửa thấp liếm quanh chân, che một phần thân dưới.
  return (
    <>
      {[0.15, 0.4, 0.65, 0.88].map((x, i) => (
        <Flame key={i} left={`${x * 100}%`} bottom="-4%" size={width * 0.15} delay={i * 0.23 + 0.1} />
      ))}
    </>
  )
}

/** RỒNG SỐ HỌC: khối hình học vàng lơ lửng, xoay chậm quanh người. */
function Runes({ color, width, layer }: { color: string; width: number; layer: 'back' | 'front' }) {
  const runes: Array<{ x: number; y: number; shape: 'tri' | 'sq' | 'dot'; front: boolean }> = [
    { x: -0.08, y: 0.65, shape: 'tri', front: false },
    { x: 0.1, y: 0.92, shape: 'sq', front: false },
    { x: 0.5, y: 1.06, shape: 'dot', front: false },
    { x: 0.9, y: 0.88, shape: 'tri', front: false },
    { x: 1.06, y: 0.55, shape: 'sq', front: false },
    { x: 0.02, y: 0.25, shape: 'dot', front: true },
    { x: 0.98, y: 0.2, shape: 'tri', front: true },
  ]
  const s = Math.max(10, width * 0.11)
  return (
    <>
      {runes
        .filter((r) => r.front === (layer === 'front'))
        .map((r, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: `${r.x * 100}%`,
              bottom: `${r.y * 100}%`,
              width: s,
              height: s,
              marginLeft: -s / 2,
              background: '#ffe27a',
              border: `${Math.max(2, s * 0.14)}px solid #7a4a10`,
              borderRadius: r.shape === 'dot' ? '50%' : 2,
              clipPath: r.shape === 'tri' ? 'polygon(50% 0, 100% 100%, 0 100%)' : undefined,
              boxShadow: r.shape === 'tri' ? undefined : `0 0 10px 2px ${color}`,
              animation: `rune-float 3.2s ease-in-out ${i * 0.45}s infinite`,
            }}
          />
        ))}
      {layer === 'back' && <Rising width={width} color={color} core="#fffbe8" count={5} duration={2.4} />}
    </>
  )
}

/** LONG VƯƠNG THANH ÂM: những vòng sóng âm loang ra từ người, nối tiếp nhau. */
function Sound({ color, width, layer }: { color: string; width: number; layer: 'back' | 'front' }) {
  if (layer === 'front') {
    return (
      <>
        {[0.05, 0.92, 0.3].map((x, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={
              {
                left: `${x * 100}%`,
                bottom: '35%',
                width: Math.max(8, width * 0.08),
                height: Math.max(8, width * 0.08),
                border: `2px solid ${color}`,
                background: 'rgb(255 255 255 / 0.5)',
                '--rise': `${-width * 0.7}px`,
                animation: `boss-spark 2.6s ease-out ${i * 0.8}s infinite`,
                opacity: 0,
              } as React.CSSProperties
            }
          />
        ))}
      </>
    )
  }
  return (
    <>
      {[0, 0.7, 1.4].map((delay, i) => (
        <span
          key={i}
          className="absolute left-1/2 rounded-full"
          style={{
            top: '45%',
            width: width * 1.1,
            height: width * 1.1,
            marginLeft: -width * 0.55,
            marginTop: -width * 0.55,
            border: `${Math.max(3, width * 0.035)}px solid ${color}`,
            boxShadow: `0 0 10px ${color}, inset 0 0 10px ${color}`,
            animation: `sound-ring 2.1s ease-out ${delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </>
  )
}

/** CHÚA TỂ BÓNG ĐÊM: khói tím đen cuộn lên quanh chân, tan dần. */
function Shadow({ width, layer }: { width: number; layer: 'back' | 'front' }) {
  const puffs = layer === 'back' ? [0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.8] : [0.2, 0.55, 0.85]
  const size = width * (layer === 'back' ? 0.5 : 0.32)
  return (
    <>
      {puffs.map((x, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={
            {
              left: `${x * 100}%`,
              bottom: layer === 'back' ? '0%' : '-8%',
              width: size,
              height: size,
              marginLeft: -size / 2,
              background: 'radial-gradient(closest-side, rgb(60 20 90 / 0.75), rgb(30 10 50 / 0.45) 60%, rgb(30 10 50 / 0))',
              '--rise': `${-width * (layer === 'back' ? 0.85 : 0.3)}px`,
              animation: `smoke-rise ${layer === 'back' ? 3 : 2.4}s ease-out ${(i * 3) / puffs.length}s infinite`,
              opacity: 0,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}

/** ĐẦU ĐÀN: vòng sáng vàng dưới chân, hai ngôi sao lấp lánh trên đầu. */
function Leader({ color, width, layer }: { color: string; width: number; layer: 'back' | 'front' }) {
  if (layer === 'back') {
    return (
      <div
        className="absolute left-1/2"
        style={{
          bottom: -width * 0.05,
          width: width * 1.15,
          height: width * 0.32,
          marginLeft: -width * 0.575,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, #ffe27acc, ${color}55 60%, transparent)`,
          animation: 'boss-aura 2.4s ease-in-out infinite',
        }}
      />
    )
  }
  const star = Math.max(12, width * 0.13)
  return (
    <>
      {[0.3, 0.7].map((x, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${x * 100}%`,
            top: -star * 0.6,
            marginLeft: -star / 2,
            fontSize: star,
            lineHeight: 1,
            color: '#ffd23f',
            textShadow: '0 0 6px #fff3b0, 0 2px 0 #7a4a10',
            animation: `star-twinkle 1.6s ease-in-out ${i * 0.8}s infinite`,
          }}
        >
          ★
        </span>
      ))}
    </>
  )
}
