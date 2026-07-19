'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigation, useAccessibilityRoute } from '../../hooks/useApi'

const PERSONAS = [
  { id: 'none',            label: 'Standard',   icon: '🚶' },
  { id: 'wheelchair',      label: 'Wheelchair',  icon: '♿' },
  { id: 'sensory',         label: 'Sensory',     icon: '🧩' },
  { id: 'elderly',         label: 'Elderly',     icon: '👴' },
  { id: 'blind_low_vision',label: 'Low Vision',  icon: '🦯' },
]

const QUICK_DESTINATIONS = [
  { zone: 'SECTION_101',    label: 'Section 101',        icon: '💺' },
  { zone: 'SENSORY_ROOM_N', label: 'North Sensory Room', icon: '🧩' },
  { zone: 'CONCOURSE_N',    label: 'North Concourse',    icon: '🍔' },
  { zone: 'GATE_A',         label: 'Gate A (Exit)',       icon: '🚪' },
  { zone: 'MEDICAL_MAIN',   label: 'Medical Center',     icon: '🏥' },
  { zone: 'CLUB_EAST',      label: 'East Club',          icon: '⭐' },
]

export function WayfindingPanel() {
  const [fromZone, setFromZone]   = useState('GATE_A')
  const [toZone, setToZone]       = useState('SECTION_101')
  const [persona, setPersona]     = useState<any>('none')
  const [avoidCongestion, setAvoidCongestion] = useState(true)
  const [route, setRoute]         = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const navigateMutation     = useNavigation()
  const accessibilityMutation = useAccessibilityRoute()

  const handleNavigate = async () => {
    setIsLoading(true); setError(null)
    try {
      if (persona !== 'none') {
        const res = await accessibilityMutation.mutateAsync({ persona, from_zone: fromZone, to_zone: toZone, needs: [] }) as any
        setRoute(res.route)
      } else {
        const res = await navigateMutation.mutateAsync({ from_zone: fromZone, to_zone: toZone, persona: undefined, avoid_congestion: avoidCongestion })
        setRoute(res)
      }
    } catch { setError('Failed to calculate route. Please try again.') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <h2 className="font-heading font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--c-text-primary)' }}>
          <svg className="w-4 h-4" style={{ color: 'var(--c-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343M12 2a10 10 0 1010 10A10 10 0 0012 2z" />
          </svg>
          Smart Navigation
        </h2>
        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Avoid congestion, find accessible routes</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* From / To */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>From</label>
            <select value={fromZone} onChange={e => setFromZone(e.target.value)} className="input-field">
              <option value="GATE_A">Gate A – Great America</option>
              <option value="GATE_B">Gate B – North</option>
              <option value="GATE_C">Gate C – East</option>
              <option value="GATE_D">Gate D – South</option>
              <option value="CONCOURSE_N">North Concourse</option>
              <option value="CONCOURSE_E">East Concourse</option>
              <option value="CONCOURSE_S">South Concourse</option>
              <option value="CONCOURSE_W">West Concourse</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>To</label>
            <select value={toZone} onChange={e => setToZone(e.target.value)} className="input-field">
              <option value="SECTION_101">Section 101 – Lower Bowl N</option>
              <option value="SECTION_103">Section 103 – Lower Bowl E</option>
              <option value="SECTION_105">Section 105 – Lower Bowl S</option>
              <option value="SECTION_107">Section 107 – Lower Bowl W</option>
              <option value="SENSORY_ROOM_N">North Sensory Room</option>
              <option value="SENSORY_ROOM_S">South Sensory Room</option>
              <option value="CONCOURSE_N">North Concourse</option>
              <option value="CONCOURSE_E">East Concourse</option>
              <option value="CONCOURSE_S">South Concourse</option>
              <option value="CONCOURSE_W">West Concourse</option>
              <option value="CLUB_EAST">East Club Level</option>
              <option value="CLUB_WEST">West Club Level</option>
              <option value="MEDICAL_MAIN">Medical Center</option>
              <option value="GATE_A">Gate A (Exit)</option>
              <option value="GATE_B">Gate B (Exit)</option>
              <option value="GATE_C">Gate C (Exit)</option>
              <option value="GATE_D">Gate D (Exit)</option>
            </select>
          </div>
        </div>

        {/* Accessibility Persona */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--c-text-secondary)' }}>Accessibility Mode</label>
          <div className="flex flex-wrap gap-1.5">
            {PERSONAS.map(p => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPersona(p.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={persona === p.id ? {
                  backgroundColor: 'var(--c-accent-dim)',
                  color: 'var(--c-accent)',
                  border: '1px solid rgba(0,212,255,0.25)',
                } : {
                  backgroundColor: 'var(--c-surface2)',
                  color: 'var(--c-text-secondary)',
                  border: '1px solid var(--c-border)',
                }}
              >
                <span>{p.icon}</span><span>{p.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Avoid congestion toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={avoidCongestion}
            onChange={e => setAvoidCongestion(e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--c-accent)' }}
          />
          <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>Avoid congested areas (&gt;80% capacity)</span>
        </label>

        {/* Quick Destinations */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--c-text-secondary)' }}>Quick Destinations</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_DESTINATIONS.map(dest => (
              <motion.button
                key={dest.zone}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setToZone(dest.zone); handleNavigate() }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--c-surface2)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text-secondary)',
                }}
              >
                <span>{dest.icon}</span><span>{dest.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Navigate Button */}
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleNavigate}
          disabled={isLoading || fromZone === toZone}
          className="w-full btn-primary py-2.5"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating…
            </span>
          ) : 'Find Route'}
        </motion.button>

        {error && (
          <p className="text-sm text-center p-3 rounded-lg" style={{ color: 'var(--c-danger)', backgroundColor: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)' }} role="alert">
            {error}
          </p>
        )}

        {/* Route Results */}
        {route && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div
              className="p-3 rounded-xl flex items-center justify-between"
              style={{ backgroundColor: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
            >
              <h3 className="font-semibold text-sm" style={{ color: 'var(--c-text-primary)' }}>Route Found</h3>
              <div className="flex gap-3 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
                <span>{route.total_distance_m}m</span>
                <span>~{route.estimated_time_min} min walk</span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {route.waypoints.map((wp: any, i: number) => (
                <motion.div
                  key={wp.zone_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}
                >
                  <div
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'rgba(0,212,255,0.12)', color: 'var(--c-accent)' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--c-text-primary)' }}>{wp.name || wp.zone_id}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-secondary)' }}>{wp.instruction}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
                      <span>{wp.distance_m}m</span>
                      {wp.accessible && <span style={{ color: 'var(--c-ok)' }}>✓ Accessible</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {route.congestion_warnings?.length > 0 && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.2)' }}>
                <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--c-warn)' }}>
                  ⚠️ Congestion Warnings
                </h4>
                <ul className="text-xs space-y-1" style={{ color: 'var(--c-text-secondary)' }}>
                  {route.congestion_warnings.map((w: string, i: number) => (
                    <li key={i}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}