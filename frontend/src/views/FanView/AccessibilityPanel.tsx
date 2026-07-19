'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccessibilityRoute } from '../../hooks/useApi'

const PERSONA_INFO = {
  wheelchair: {
    label: 'Wheelchair', icon: '♿',
    description: 'Step-free routes, wide paths, elevator access',
    needs: ['Ramp access', 'Wide doorways', 'Accessible restrooms', 'Elevator priority'],
  },
  sensory: {
    label: 'Sensory Friendly', icon: '🧩',
    description: 'Low-stimulation routes via sensory rooms',
    needs: ['Quiet paths', 'Dim lighting', 'Sensory room access', 'Predictable routing'],
  },
  elderly: {
    label: 'Elderly / Limited Mobility', icon: '👴',
    description: 'Shortest flat routes with frequent rest stops',
    needs: ['Minimal stairs', 'Bench every 100m', 'Handrails', 'Clear signage'],
  },
  blind_low_vision: {
    label: 'Blind / Low Vision', icon: '🦯',
    description: 'NaviLens codes, tactile guidance, audio cues',
    needs: ['Tactile paving', 'Audio beacons', 'NaviLens codes', 'Staff assistance points'],
  },
}

const ACCESSIBILITY_NEEDS = [
  'Step-free access', 'Elevator access', 'Accessible restroom', 'Sensory room',
  'Quiet area', 'Rest stops every 100m', 'Tactile guidance', 'Audio announcements',
  'High contrast signage', 'Staff assistance', 'Companion seating', 'Service animal relief',
]

export function AccessibilityPanel() {
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof PERSONA_INFO>('wheelchair')
  const [fromZone, setFromZone] = useState('GATE_A')
  const [toZone, setToZone]     = useState('SECTION_101')
  const [needs, setNeeds]       = useState<string[]>([])
  const [route, setRoute]       = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const accessibilityMutation   = useAccessibilityRoute()

  const toggleNeed = (need: string) =>
    setNeeds(prev => prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need])

  const handleFindRoute = async () => {
    setIsLoading(true)
    try {
      const res = await accessibilityMutation.mutateAsync({ persona: selectedPersona, from_zone: fromZone, to_zone: toZone, needs })
      setRoute(res)
    } catch { console.error('Route error') }
    finally { setIsLoading(false) }
  }

  const RESULT_SECTIONS: Array<{ key: string; icon: string; label: string; color: string; bgColor: string; borderColor: string }> = [
    { key: 'accommodations',    icon: '✅', label: 'Accommodations',        color: 'var(--c-ok)',     bgColor: 'rgba(63,185,80,0.06)',    borderColor: 'rgba(63,185,80,0.2)' },
    { key: 'sensory_notes',     icon: '🧩', label: 'Sensory Guidance',      color: 'var(--c-purple)', bgColor: 'rgba(188,140,255,0.06)', borderColor: 'rgba(188,140,255,0.2)' },
    { key: 'staff_assist_points',icon:'👤', label: 'Staff Assistance Points',color: 'var(--c-info)',   bgColor: 'rgba(88,166,255,0.06)',  borderColor: 'rgba(88,166,255,0.2)' },
    { key: 'rest_stops',        icon: '🪑', label: 'Rest Stops',            color: 'var(--c-warn)',   bgColor: 'rgba(210,153,34,0.06)',  borderColor: 'rgba(210,153,34,0.2)' },
  ]

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <h2 className="font-heading font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--c-text-primary)' }}>
          <svg className="w-4 h-4" style={{ color: 'var(--c-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Accessibility Concierge
        </h2>
        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Personalized routing for diverse needs</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Persona Selector */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--c-text-secondary)' }}>Select Profile</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PERSONA_INFO).map(([key, info]) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedPersona(key as any); setNeeds(info.needs) }}
                className="p-3 rounded-xl text-left transition-all"
                style={selectedPersona === key ? {
                  backgroundColor: 'var(--c-accent-dim)',
                  border: '1px solid rgba(0,212,255,0.25)',
                } : {
                  backgroundColor: 'var(--c-surface2)',
                  border: '1px solid var(--c-border)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{info.icon}</span>
                  <span className="font-medium text-sm" style={{ color: selectedPersona === key ? 'var(--c-accent)' : 'var(--c-text-primary)' }}>
                    {info.label}
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>{info.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Route Selectors */}
        <div className="grid grid-cols-2 gap-3">
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
              <option value="SECTION_101">Section 101</option>
              <option value="SECTION_103">Section 103</option>
              <option value="SECTION_105">Section 105</option>
              <option value="SECTION_107">Section 107</option>
              <option value="SENSORY_ROOM_N">North Sensory Room</option>
              <option value="SENSORY_ROOM_S">South Sensory Room</option>
              <option value="CONCOURSE_N">North Concourse</option>
              <option value="CLUB_EAST">East Club</option>
              <option value="CLUB_WEST">West Club</option>
              <option value="MEDICAL_MAIN">Medical Center</option>
              <option value="GATE_A">Gate A (Exit)</option>
            </select>
          </div>
        </div>

        {/* Specific Needs */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--c-text-secondary)' }}>Specific Needs</label>
          <div className="flex flex-wrap gap-1.5">
            {ACCESSIBILITY_NEEDS.map(need => (
              <motion.button
                key={need}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleNeed(need)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={needs.includes(need) ? {
                  backgroundColor: 'var(--c-accent)',
                  color: '#0D1117',
                  border: '1px solid var(--c-accent)',
                } : {
                  backgroundColor: 'var(--c-surface2)',
                  color: 'var(--c-text-secondary)',
                  border: '1px solid var(--c-border)',
                }}
              >
                {need}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleFindRoute}
          disabled={isLoading || fromZone === toZone}
          className="w-full btn-primary py-2.5"
        >
          {isLoading ? 'Finding Route…' : 'Find Accessible Route'}
        </motion.button>

        {/* Results */}
        {route && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
            >
              <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--c-text-primary)' }}>Your Accessible Route</h3>
              <div className="flex flex-wrap gap-2">
                <span className="chip-accent">{route.route.total_distance_m}m</span>
                <span className="chip-accent">~{route.route.estimated_time_min} min</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(63,185,80,0.12)', color: 'var(--c-ok)', border: '1px solid rgba(63,185,80,0.2)' }}
                >
                  ✓ Fully Accessible
                </span>
              </div>
            </div>

            {/* Waypoints */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {route.route.waypoints.map((wp: any, i: number) => (
                <motion.div
                  key={wp.zone_id}
                  initial={{ opacity: 0, x: -10 }}
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
                    {wp.accessible && (
                      <span className="text-[10px] mt-1 inline-block" style={{ color: 'var(--c-ok)' }}>✓ Accessible</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Extra sections */}
            {RESULT_SECTIONS.map(sec => {
              const items: string[] = route[sec.key] || []
              if (!items.length) return null
              return (
                <div key={sec.key} className="p-3 rounded-xl" style={{ backgroundColor: sec.bgColor, border: `1px solid ${sec.borderColor}` }}>
                  <h4 className="text-xs font-semibold mb-1.5" style={{ color: sec.color }}>
                    {sec.icon} {sec.label}
                  </h4>
                  <ul className="text-xs space-y-1" style={{ color: 'var(--c-text-secondary)' }}>
                    {items.map((item, i) => <li key={i}>• {item}</li>)}
                  </ul>
                </div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}