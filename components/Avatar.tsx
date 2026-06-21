'use client'

export default function Avatar({ totalCo2e, size = 'large' }: { totalCo2e: number; size?: 'large' | 'small' }) {
  const health = Math.max(0, Math.min(1, (10 - totalCo2e) / 30))
  const dims = size === 'large' ? { w: 220, h: 160, vb: '0 0 220 160' } : { w: 64, h: 46, vb: '0 0 220 160' }

  // Growth stage thresholds
  const stage =
    health < 0.2 ? 'sapling' : health < 0.45 ? 'budding' : health < 0.75 ? 'growing' : 'thriving'

  const trunkHeight = 30 + health * 24
  const trunkTopY = 130 - trunkHeight
  const sway = stage === 'thriving' ? 2 : 0

  // Canopy cluster opacities/scales fade in progressively by stage
  const clusters = [
    { cx: 110, cy: trunkTopY, r: 16 + health * 22, fill: '#2D6A4F', opacity: Math.min(1, health * 2.2), key: 'core' },
    { cx: 88, cy: trunkTopY + 6, r: 10 + health * 14, fill: '#3E7C3E', opacity: health > 0.25 ? Math.min(1, (health - 0.15) * 2) : 0, key: 'left' },
    { cx: 134, cy: trunkTopY + 4, r: 10 + health * 13, fill: '#3E7C3E', opacity: health > 0.25 ? Math.min(1, (health - 0.15) * 2) : 0, key: 'right' },
    { cx: 110, cy: trunkTopY - 16, r: 8 + health * 11, fill: '#5DCAA5', opacity: health > 0.5 ? Math.min(1, (health - 0.4) * 2.5) : 0, key: 'top' },
    { cx: 96, cy: trunkTopY - 4, r: 7 + health * 9, fill: '#5DCAA5', opacity: health > 0.6 ? Math.min(1, (health - 0.5) * 3) : 0, key: 'topleft' },
    { cx: 124, cy: trunkTopY - 6, r: 7 + health * 9, fill: '#5DCAA5', opacity: health > 0.6 ? Math.min(1, (health - 0.5) * 3) : 0, key: 'topright' },
  ]

  const blossoms = stage === 'thriving'
    ? [
        { cx: 96, cy: trunkTopY - 10, r: 2.4 },
        { cx: 122, cy: trunkTopY - 18, r: 2.2 },
        { cx: 108, cy: trunkTopY - 28, r: 2.4 },
        { cx: 134, cy: trunkTopY + 2, r: 2 },
        { cx: 84, cy: trunkTopY + 8, r: 2.2 },
      ]
    : []

  const fallenLeaves = stage === 'sapling'
    ? [
        { cx: 70, cy: 142, rot: 20 },
        { cx: 150, cy: 138, rot: -15 },
        { cx: 100, cy: 146, rot: 40 },
      ]
    : []

  const caption =
    stage === 'sapling' ? 'Your tree is just a sapling' :
    stage === 'budding' ? 'Your tree is budding' :
    stage === 'growing' ? 'Your tree is growing' :
    'Your tree is thriving'

  return (
    <div style={{ textAlign: 'center' }}>
      <svg
        viewBox={dims.vb}
        width={dims.w}
        height={dims.h}
        role="img"
        aria-label={`Carbon tracking tree, currently at the ${stage} stage`}
        style={{ margin: '0 auto', display: 'block', overflow: 'visible' }}
      >
        {/* ground shadow */}
        <ellipse cx="110" cy="146" rx="68" ry="10" fill="rgba(31,43,34,0.06)" />

        {/* fallen leaves around a struggling tree */}
        {fallenLeaves.map((l, i) => (
          <ellipse
            key={i}
            cx={l.cx}
            cy={l.cy}
            rx="5"
            ry="2.4"
            fill="#C8723D"
            opacity="0.6"
            transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
          />
        ))}

        {/* trunk */}
        <path
          d={`M 106 146 C 105 ${trunkTopY + 40}, 107 ${trunkTopY + 20}, 110 ${trunkTopY}
              C 113 ${trunkTopY + 20}, 115 ${trunkTopY + 40}, 114 146 Z`}
          fill="#6B4F3A"
          opacity={0.55 + health * 0.45}
        />

        {/* small side branches once growing */}
        {health > 0.4 && (
          <>
            <path d={`M 109 ${trunkTopY + 18} L 95 ${trunkTopY + 4}`} stroke="#6B4F3A" strokeWidth="2.5" opacity={0.5 + health * 0.5} strokeLinecap="round" />
            <path d={`M 112 ${trunkTopY + 16} L 126 ${trunkTopY + 2}`} stroke="#6B4F3A" strokeWidth="2.5" opacity={0.5 + health * 0.5} strokeLinecap="round" />
          </>
        )}

        {/* canopy clusters, gentle sway on thriving */}
        <g className="ct-avatar-canopy" style={{ transform: `rotate(${sway}deg)`, transformOrigin: '110px 146px' }}>
          {clusters.map((c) => (
            <circle key={c.key} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} opacity={c.opacity} />
          ))}
          {blossoms.map((b, i) => (
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="#F3D9C4" opacity="0.9" />
          ))}
        </g>
      </svg>
      {size === 'large' && (
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '4px 0 0' }}>{caption}</p>
      )}
    </div>
  )
}