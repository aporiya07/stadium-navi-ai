'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVolunteerActions } from '../../hooks/useApi'

const PHASES = [
  { id: 'PRE_MATCH',  label: 'Pre-Match',  icon: '🏟️' },
  { id: 'LIVE',       label: 'Live',       icon: '⚽' },
  { id: 'HALFTIME',   label: 'Halftime',   icon: '⏸️' },
  { id: 'POST_MATCH', label: 'Post-Match', icon: '👋' },
]

const ROLES = [
  { id: 'greeter',       label: 'Greeter',         icon: '👋' },
  { id: 'usher',         label: 'Usher',            icon: '🧑‍💼' },
  { id: 'medical',       label: 'Medical',          icon: '🏥' },
  { id: 'accessibility', label: 'Accessibility Aid', icon: '♿' },
  { id: 'crowd_control', label: 'Crowd Control',    icon: '🛡️' },
]

const URGENCY_CONFIG: Record<string, { color: string; badgeClass: string; label: string }> = {
  high:   { color: 'var(--c-danger)', badgeClass: 'badge-red',   label: 'HIGH' },
  medium: { color: 'var(--c-warn)',   badgeClass: 'badge-amber', label: 'MEDIUM' },
  low:    { color: 'var(--c-info)',   badgeClass: 'badge-blue',  label: 'LOW' },
}

interface ActionCardsProps { matchPhase?: string }

export function ActionCards({ matchPhase = 'PRE_MATCH' }: ActionCardsProps) {
  const [phase, setPhase]               = useState(matchPhase)
  const [role, setRole]                 = useState('usher')
  const [zone, setZone]                 = useState('CONCOURSE_N')
  const [actions, setActions]           = useState<any[]>([])
  const [summary, setSummary]           = useState('')
  const [priorityZones, setPriorityZones] = useState<string[]>([])
  const [isLoading, setIsLoading]       = useState(false)
  const volunteerMutation               = useVolunteerActions()

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const res = await volunteerMutation.mutateAsync({ role, volunteer_zone: zone, phase }) as any
      setActions(res.actions || [])
      setSummary(res.summary || '')
      setPriorityZones(res.priority_zones || [])
    } catch {
      setActions([{
        id: 'fallback_1',
        title: 'Check assigned zone',
        description: `Patrol ${zone} and assist fans`,
        urgency: 'high', zone, phase,
        dispatch_note: `${role} deployed to ${zone}`,
        estimated_duration_min: 30,
      }])
    } finally { setIsLoading(false) }
  }

  const currentPhase = PHASES.find(p => p.id === phase) || PHASES[0]

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="card-header">
        <h2 className="font-heading font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--c-text-primary)' }}>
          <svg aria-hidden="true" className="w-4 h-4" style={{ color: 'var(--c-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Volunteer Ops Copilot
        </h2>
        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>AI-powered action cards</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Phase Selector */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--c-text-secondary)' }}>Match Phase</label>
          <div className="grid grid-cols-4 gap-1.5">
            {PHASES.map(p => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPhase(p.id)}
                className="p-2 rounded-lg text-center transition-all"
                style={phase === p.id ? {
                  backgroundColor: 'var(--c-accent-dim)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  color: 'var(--c-accent)',
                } : {
                  backgroundColor: 'var(--c-surface2)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text-secondary)',
                }}
              >
                <span className="block text-base mb-0.5">{p.icon}</span>
                <span className="text-[10px] font-medium">{p.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Role & Zone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>Zone</label>
            <select value={zone} onChange={e => setZone(e.target.value)} className="input-field">
              <option value="GATE_A">Gate A</option>
              <option value="GATE_B">Gate B</option>
              <option value="GATE_C">Gate C</option>
              <option value="GATE_D">Gate D</option>
              <option value="CONCOURSE_N">North Concourse</option>
              <option value="CONCOURSE_E">East Concourse</option>
              <option value="CONCOURSE_S">South Concourse</option>
              <option value="CONCOURSE_W">West Concourse</option>
              <option value="SECTION_101">Section 101</option>
              <option value="SENSORY_ROOM_N">North Sensory Room</option>
              <option value="MEDICAL_MAIN">Medical Center</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full btn-primary py-2.5"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating…
            </span>
          ) : `Generate Cards for ${currentPhase.label}`}
        </motion.button>

        {/* Summary */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl"
            style={{ backgroundColor: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <p className="text-sm" style={{ color: 'var(--c-text-primary)' }}>{summary}</p>
            {priorityZones.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Priority zones:</span>
                {priorityZones.map(z => <span key={z} className="badge badge-red">{z}</span>)}
              </div>
            )}
          </motion.div>
        )}

        {/* Action Cards */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {actions.map((action, i) => {
              const cfg = URGENCY_CONFIG[action.urgency || 'medium'] || URGENCY_CONFIG.medium
              return (
                <motion.div
                  key={action.id || i}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: 'var(--c-surface2)',
                    border: `1px solid var(--c-border)`,
                    borderLeft: `3px solid ${cfg.color}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm" style={{ color: 'var(--c-text-primary)' }}>{action.title}</h3>
                    <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--c-text-secondary)' }}>{action.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--c-text-muted)' }}>
                    <span>📍 {action.zone}</span>
                    <span>⏱ {action.estimated_duration_min} min</span>
                  </div>

                  {action.dispatch_note && (
                    <div
                      className="mt-3 p-2.5 rounded-lg"
                      style={{ backgroundColor: 'var(--c-surface3)', border: '1px solid var(--c-border)' }}
                    >
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--c-text-muted)' }}>Dispatch Note</p>
                      <p className="text-xs" style={{ color: 'var(--c-text-primary)' }}>{action.dispatch_note}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button className="btn-secondary text-xs py-1 px-3">Acknowledge</button>
                    <button className="btn-ghost text-xs py-1 px-3">Reassign</button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}