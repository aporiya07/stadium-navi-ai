'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCrowdSnapshot, useCrowdSummary } from '../../hooks/useApi'
import { ZoneMap } from './ZoneMap'
import { OccupancyBars } from './OccupancyBars'
import { AlertFeed } from './AlertFeed'
import { ActionCards } from './ActionCards'

type Tab = 'overview' | 'volunteers' | 'incidents'

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: '📊' },
  { id: 'volunteers', label: 'Volunteers', icon: '👥' },
  { id: 'incidents',  label: 'Incidents',  icon: '🚨' },
]

const QUICK_ACTIONS = [
  { icon: '📢', label: 'Broadcast Announcement', action: 'broadcast' },
  { icon: '🚨', label: 'Escalate to Security',   action: 'escalate' },
  { icon: '🏥', label: 'Call Medical Team',       action: 'medical' },
  { icon: '🔄', label: 'Rotate Volunteers',       action: 'rotate' },
  { icon: '📋', label: 'View Shift Schedule',     action: 'schedule' },
]

export function OpsDashboard() {
  const [selectedZone, setSelectedZone] = useState<any>(null)
  const [activeTab, setActiveTab]       = useState<Tab>('overview')

  const { data: snapshot } = useCrowdSnapshot()
  const { data: summary, isLoading: summaryLoading } = useCrowdSummary()

  const alerts = (snapshot?.zones as any[] | undefined)
    ?.filter((z: any) => z.pct >= 75)
    .map((z: any) => ({
      id:        `alert-${z.zone_id}`,
      zone:       z.zone_id,
      zone_name:  z.name,
      level:      z.pct >= 90 ? 'critical' as const : z.pct >= 80 ? 'warning' as const : 'watch' as const,
      message:   `${z.name} at ${z.pct.toFixed(0)}% capacity${z.trend === 'rising' ? ' and rising' : ''}`,
      timestamp:  new Date().toLocaleTimeString(),
    })) || []

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: 'var(--c-canvas)' }}>

      {/* ── Dashboard Header ─────────────────────────────────── */}
      <section
        className="py-6"
        style={{ borderBottom: '1px solid var(--c-border)', backgroundColor: 'var(--c-surface)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl md:text-3xl font-heading font-bold" style={{ color: 'var(--c-text-primary)' }}>
                Operations{' '}
                <span className="text-gradient-accent">Dashboard</span>
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-secondary)' }}>
                Real-time crowd intelligence · Levi's Stadium
              </p>
            </motion.div>

            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(63,185,80,0.1)',
                  border: '1px solid rgba(63,185,80,0.25)',
                  color: 'var(--c-ok)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
              </div>
              <div className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                Phase:{' '}
                <span className="font-semibold" style={{ color: 'var(--c-accent)' }}>
                  {snapshot?.phase || 'PRE_MATCH'}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Pills */}
          {snapshot && (
            <div className="flex gap-3 mt-4">
              {[
                {
                  label: 'Total Occupancy',
                  value: `${((snapshot.zones as any[]).reduce((s: number, z: any) => s + z.count, 0) / 1000).toFixed(1)}k`,
                  sub: 'people',
                  color: 'var(--c-accent)',
                },
                {
                  label: 'High-Density Zones',
                  value: (snapshot.zones as any[]).filter((z: any) => z.pct >= 80).length.toString(),
                  sub: 'zones ≥ 80%',
                  color: (snapshot.zones as any[]).filter((z: any) => z.pct >= 80).length > 0 ? 'var(--c-warn)' : 'var(--c-ok)',
                },
                {
                  label: 'Critical Zones',
                  value: (snapshot.zones as any[]).filter((z: any) => z.pct >= 90).length.toString(),
                  sub: 'zones ≥ 90%',
                  color: (snapshot.zones as any[]).filter((z: any) => z.pct >= 90).length > 0 ? 'var(--c-danger)' : 'var(--c-ok)',
                },
                {
                  label: 'Active Alerts',
                  value: alerts.length.toString(),
                  sub: 'requiring attention',
                  color: alerts.length > 0 ? 'var(--c-danger)' : 'var(--c-ok)',
                },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="px-4 py-2.5 rounded-xl"
                  style={{ backgroundColor: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}
                >
                  <p className="text-[10px] mb-0.5" style={{ color: 'var(--c-text-muted)' }}>{m.label}</p>
                  <p className="text-xl font-bold leading-none" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{m.sub}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Tab Navigation ───────────────────────────────────── */}
      <div
        className="sticky z-30"
        style={{ top: 56, borderBottom: '1px solid var(--c-border)', backgroundColor: 'var(--c-surface)' }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                aria-label={`Switch to ${tab.name} tab`}
                onClick={() => setActiveTab(tab.id as Tab)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={activeTab === tab.id ? {
                  backgroundColor: 'var(--c-accent-dim)',
                  color: 'var(--c-accent)',
                  border: '1px solid rgba(0,212,255,0.2)',
                } : {
                  color: 'var(--c-text-secondary)',
                  border: '1px solid transparent',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">

          {/* ── Overview Tab ──────────────────────────────────── */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[560px]">
                  <ZoneMap snapshot={snapshot} onZoneClick={setSelectedZone} />
                </div>
                <div className="h-[560px]">
                  <OccupancyBars snapshot={snapshot} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Intelligence Panel */}
                <div className="card p-5">
                  <h3 className="font-heading font-semibold text-sm flex items-center gap-2 mb-3" style={{ color: 'var(--c-text-primary)' }}>
                    <svg className="w-4 h-4" style={{ color: 'var(--c-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Crowd Intelligence
                  </h3>
                  {summaryLoading ? (
                    <div className="flex items-center gap-2 py-6" style={{ color: 'var(--c-text-muted)' }}>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm">Generating analysis…</span>
                    </div>
                  ) : summary?.summary ? (
                    <div className="space-y-4">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-secondary)' }}>
                        {summary.summary}
                      </p>
                      {(summary.recommended_actions || []).length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--c-text-secondary)' }}>
                            Recommended Actions
                          </h4>
                          <ul className="space-y-1.5">
                            {(summary.recommended_actions || []).slice(0, 4).map((action: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--c-accent)' }} />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--c-text-muted)' }}>Waiting for AI analysis…</p>
                  )}
                </div>

                {/* Alert Feed */}
                <div className="h-72">
                  <AlertFeed alerts={alerts} onDismiss={id => console.log('dismiss', id)} onAction={a => console.log('action', a)} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Volunteers Tab ──────────────────────────────────── */}
          {activeTab === 'volunteers' && (
            <motion.div
              key="volunteers"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 h-[640px]">
                <ActionCards />
              </div>
              <div className="h-[640px]">
                <div className="card p-5 h-full flex flex-col">
                  <h3 className="font-heading font-semibold text-sm mb-4" style={{ color: 'var(--c-text-primary)' }}>
                    Quick Actions
                  </h3>
                  <div className="space-y-2 flex-1">
                    {QUICK_ACTIONS.map(item => (
                      <button
                        key={item.action}
                        className="w-full p-3 rounded-lg text-left transition-all"
                        style={{
                          backgroundColor: 'var(--c-surface2)',
                          border: '1px solid var(--c-border)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.3)'
                          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,212,255,0.06)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-border)'
                          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-surface2)'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="font-medium text-sm" style={{ color: 'var(--c-text-primary)' }}>
                            {item.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Incidents Tab ────────────────────────────────────── */}
          {activeTab === 'incidents' && (
            <motion.div
              key="incidents"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <IncidentForm />
              <div className="h-[500px]">
                <AlertFeed alerts={alerts} onDismiss={id => console.log('dismiss', id)} onAction={a => console.log('action', a)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Zone Detail Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedZone(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="card max-w-sm w-full p-6"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold" style={{ color: 'var(--c-text-primary)' }}>
                  {selectedZone.name}
                </h3>
                <button
                  aria-label="Close Zone Details"
                  onClick={() => setSelectedZone(null)}
                  style={{ color: 'var(--c-text-muted)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>Occupancy</span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: selectedZone.pct >= 90 ? 'var(--c-danger)' : selectedZone.pct >= 80 ? 'var(--c-warn)' : 'var(--c-ok)' }}
                  >
                    {selectedZone.pct.toFixed(0)}%
                  </span>
                </div>

                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-surface3)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(selectedZone.pct, 100)}%`,
                      backgroundColor: selectedZone.pct >= 90 ? 'var(--c-danger)' : selectedZone.pct >= 80 ? 'var(--c-warn)' : 'var(--c-ok)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Current',  value: selectedZone.count.toLocaleString() },
                    { label: 'Capacity', value: selectedZone.capacity.toLocaleString() },
                    { label: 'Trend',    value: selectedZone.trend },
                    { label: 'Type',     value: selectedZone.type },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}
                    >
                      <p className="text-xs mb-0.5" style={{ color: 'var(--c-text-muted)' }}>{label}</p>
                      <p className="font-medium text-sm capitalize" style={{ color: 'var(--c-text-primary)' }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button className="flex-1 btn-primary text-sm py-2">Deploy Staff</button>
                  <button className="flex-1 btn-secondary text-sm py-2">View Details</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function IncidentForm() {
  const [form, setForm] = useState({ zone: '', type: '', severity: 'medium', description: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5">
      <h3 className="font-heading font-semibold text-sm mb-4" style={{ color: 'var(--c-text-primary)' }}>
        Report New Incident
      </h3>
      <div className="space-y-3">
        {[
          {
            label: 'Zone', key: 'zone', type: 'select',
            options: [
              { value: '', label: 'Select zone' },
              { value: 'GATE_A',       label: 'Gate A' },
              { value: 'GATE_B',       label: 'Gate B' },
              { value: 'GATE_C',       label: 'Gate C' },
              { value: 'GATE_D',       label: 'Gate D' },
              { value: 'CONCOURSE_N',  label: 'North Concourse' },
              { value: 'CONCOURSE_E',  label: 'East Concourse' },
              { value: 'CONCOURSE_S',  label: 'South Concourse' },
              { value: 'CONCOURSE_W',  label: 'West Concourse' },
              { value: 'SECTION_101',  label: 'Section 101' },
              { value: 'SENSORY_ROOM_N', label: 'North Sensory Room' },
              { value: 'MEDICAL_MAIN', label: 'Medical Center' },
            ],
          },
          {
            label: 'Incident Type', key: 'type', type: 'select',
            options: [
              { value: '',             label: 'Select type' },
              { value: 'medical',      label: 'Medical Emergency' },
              { value: 'crowd',        label: 'Crowd Surge' },
              { value: 'security',     label: 'Security Issue' },
              { value: 'facility',     label: 'Facility Issue' },
              { value: 'accessibility', label: 'Accessibility Issue' },
              { value: 'lost_child',   label: 'Lost Child' },
              { value: 'other',        label: 'Other' },
            ],
          },
          {
            label: 'Severity', key: 'severity', type: 'select',
            options: [
              { value: 'low',      label: 'Low' },
              { value: 'medium',   label: 'Medium' },
              { value: 'high',     label: 'High' },
              { value: 'critical', label: 'Critical' },
            ],
          },
        ].map(field => (
          <div key={field.key}>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>
              {field.label}
            </label>
            <select
              value={(form as any)[field.key]}
              onChange={e => setForm({ ...form, [field.key]: e.target.value })}
              className="input-field"
              required={field.key !== 'severity'}
            >
              {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="input-field resize-none"
            placeholder="Describe the incident…"
            required
          />
        </div>
        <button type="submit" className="w-full btn-primary py-2.5" disabled={submitted}>
          {submitted ? '✓ Reported!' : 'Submit Incident Report'}
        </button>
      </div>
    </form>
  )
}