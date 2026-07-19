import { motion } from 'framer-motion'

interface ZoneCardProps {
  zoneId: string
  name: string
  type: string
  count: number
  capacity: number
  pct: number
  trend: 'rising' | 'falling' | 'stable'
  onClick?: () => void
}

function getColor(pct: number) {
  if (pct >= 90) return 'text-red-600 bg-red-50 border-red-200'
  if (pct >= 80) return 'text-amber-600 bg-amber-50 border-amber-200'
  if (pct >= 70) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-green-600 bg-green-50 border-green-200'
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'rising':
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      )
    case 'falling':
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      )
  }
}

export function ZoneCard({ zoneId, name, type, count, capacity, pct, trend, onClick }: ZoneCardProps) {
  const colorClass = getColor(pct)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`card cursor-pointer transition-all ${colorClass} border`}
      onClick={onClick}
      style={{ '--progress': `${pct}%` }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">{name}</h3>
            <span className={`badge ${pct >= 80 ? 'badge-red' : pct >= 70 ? 'badge-amber' : 'badge-green'}`}>
              {type}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon(trend)}
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-600">{count.toLocaleString()} / {capacity.toLocaleString()}</span>
            <span className={`font-semibold ${colorClass.split(' ')[0]}`}>{pct.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 90 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="text-xs text-neutral-500 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${pct >= 80 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`} />
          {trend === 'rising' && 'Rising'}
          {trend === 'falling' && 'Falling'}
          {trend === 'stable' && 'Stable'}
        </div>
      </div>
    </motion.div>
  )
}