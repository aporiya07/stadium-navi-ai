'use client'

import { motion } from 'framer-motion'
import { CrowdSnapshot } from '../../lib/api'

interface OccupancyBarsProps {
  snapshot: CrowdSnapshot | null
}

function getBar(pct: number): { color: string; label: string; badgeClass: string } {
  if (pct >= 90) return { color: 'var(--c-danger)', label: 'Critical', badgeClass: 'badge-red' }
  if (pct >= 80) return { color: 'var(--c-warn)',   label: 'Warning',  badgeClass: 'badge-amber' }
  if (pct >= 70) return { color: 'var(--c-warn)',   label: 'High',     badgeClass: 'badge-amber' }
  return           { color: 'var(--c-ok)',    label: 'Normal',   badgeClass: 'badge-green' }
}

function TrendIcon({ trend }: { trend: string }) {
  const color = trend === 'rising' ? 'var(--c-danger)' : trend === 'falling' ? 'var(--c-ok)' : 'var(--c-text-muted)'
  const char  = trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→'
  return <span style={{ color, fontSize: 11, fontWeight: 700 }}>{char}</span>
}

export function OccupancyBars({ snapshot }: OccupancyBarsProps) {
  const zones = snapshot?.zones || []
  const sorted = [...zones].sort((a, b) => b.pct - a.pct)

  const total    = zones.reduce((s, z) => s + z.count, 0)
  const capacity = zones.reduce((s, z) => s + z.capacity, 0)
  const alerts   = zones.filter(z => z.pct >= 80).length
  const pct      = capacity > 0 ? (total / capacity) * 100 : 0

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="card-header">
        <h2 className="font-heading font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--c-text-primary)' }}>
          <svg className="w-4 h-4" style={{ color: 'var(--c-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Zone Occupancy
        </h2>

        {/* Summary stats */}
        <div className="flex gap-3 text-xs">
          <div className="text-center">
            <p style={{ color: 'var(--c-text-muted)' }}>Overall</p>
            <p className="font-bold" style={{ color: 'var(--c-text-primary)' }}>{pct.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p style={{ color: 'var(--c-text-muted)' }}>People</p>
            <p className="font-bold" style={{ color: 'var(--c-text-primary)' }}>{(total / 1000).toFixed(1)}k</p>
          </div>
          <div className="text-center">
            <p style={{ color: 'var(--c-text-muted)' }}>Alerts</p>
            <p className="font-bold" style={{ color: alerts > 0 ? 'var(--c-danger)' : 'var(--c-ok)' }}>{alerts}</p>
          </div>
        </div>
      </div>

      {/* Zone list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--c-text-muted)' }}>
            Waiting for live data…
          </div>
        )}

        {sorted.map((zone, i) => {
          const bar = getBar(zone.pct)
          return (
            <motion.div
              key={zone.zone_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="status-row"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <TrendIcon trend={zone.trend} />
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--c-text-primary)' }}>
                    {zone.name}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>{zone.zone_id}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${bar.badgeClass}`}>{bar.label}</span>
                  <span className="text-xs font-medium w-9 text-right" style={{ color: 'var(--c-text-primary)' }}>
                    {zone.pct.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-surface3)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: bar.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(zone.pct, 100)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>

              <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                <span>{zone.count.toLocaleString()} / {zone.capacity.toLocaleString()}</span>
                <span className="capitalize">{zone.type}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}