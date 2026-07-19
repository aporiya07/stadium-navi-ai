'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTransportOptions } from '../../hooks/useApi'

const MODE_INFO: Record<string, { icon: string; label: string; desc: string }> = {
  walk:           { icon: '🚶',  label: 'Walk',                desc: 'Zero emissions, healthy option' },
  rail:           { icon: '🚊',  label: 'VTA Light Rail + Caltrain', desc: 'VTA Green Line → Diridon → Caltrain/BART' },
  bus:            { icon: '🚌',  label: 'VTA Bus',             desc: 'Route 57 or Express to transit center' },
  rideshare_ev:   { icon: '🚗⚡', label: 'Rideshare (EV)',      desc: 'Uber Green / Lyft Green Mode' },
  rideshare_ice:  { icon: '🚗',  label: 'Rideshare (Gas)',     desc: 'Standard Uber/Lyft' },
  private_car:    { icon: '🅿️',  label: 'Drive & Park',        desc: 'Pre-booked stadium parking' },
}

const DESTINATIONS = [
  { value: 'San Francisco Airport (SFO)', label: 'SFO Airport',        distance: 15 },
  { value: 'San Jose Downtown',           label: 'Downtown San Jose',   distance: 8 },
  { value: 'San Francisco',               label: 'San Francisco',       distance: 65 },
  { value: 'Oakland Airport (OAK)',        label: 'Oakland Airport',     distance: 40 },
  { value: 'Mountain View',               label: 'Mountain View',       distance: 12 },
  { value: 'Palo Alto',                   label: 'Palo Alto',           distance: 18 },
]

export function TransportPanel() {
  const [fromLocation, setFromLocation]     = useState("Levi's Stadium")
  const [toLocation, setToLocation]         = useState('San Francisco Airport (SFO)')
  const [preferSustainable, setPreferSustainable] = useState(true)
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false)
  const [results, setResults]               = useState<any>(null)
  const [isLoading, setIsLoading]           = useState(false)
  const transportMutation                   = useTransportOptions()

  const handleFindOptions = async () => {
    setIsLoading(true)
    try {
      const res = await transportMutation.mutateAsync({ from_location: fromLocation, to_location: toLocation, prefer_sustainable: preferSustainable, wheelchair_accessible: wheelchairAccessible })
      setResults(res)
    } catch { console.error('Transport error') }
    finally { setIsLoading(false) }
  }

  const co2Saved = useMemo(() => {
    if (!results) return 0
    const drive = results.options.find((o: any) => o.mode === 'private_car')
    const best  = results.options[0]
    return (drive && best && drive.co2_g > best.co2_g) ? drive.co2_g - best.co2_g : 0
  }, [results])

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <h2 className="font-heading font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--c-text-primary)' }}>
          <svg aria-hidden="true" className="w-4 h-4" style={{ color: 'var(--c-ok)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Transport & Sustainability
        </h2>
        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>Compare options with CO₂ impact</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* From / To */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>From</label>
            <input
              type="text"
              value={fromLocation}
              onChange={e => setFromLocation(e.target.value)}
              className="input-field"
              placeholder="Levi's Stadium"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>To</label>
            <select value={toLocation} onChange={e => setToLocation(e.target.value)} className="input-field">
              {DESTINATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label} ({d.distance} km)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {[
            { label: 'Prioritize sustainable options', value: preferSustainable, onChange: setPreferSustainable },
            { label: 'Wheelchair accessible only',     value: wheelchairAccessible, onChange: setWheelchairAccessible },
          ].map(({ label, value, onChange }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={e => onChange(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--c-accent)' }}
              />
              <span className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>{label}</span>
            </label>
          ))}
        </div>

        {/* Quick Destinations */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--c-text-secondary)' }}>Popular Destinations</label>
          <div className="flex flex-wrap gap-1.5">
            {DESTINATIONS.map(d => (
              <motion.button
                key={d.value}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setToLocation(d.value); handleFindOptions() }}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--c-surface2)',
                  border: '1px solid var(--c-border)',
                  color: 'var(--c-text-secondary)',
                }}
              >
                {d.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleFindOptions}
          disabled={isLoading}
          className="w-full btn-primary py-2.5"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Finding options…
            </span>
          ) : 'Compare Transport Options'}
        </motion.button>

        {/* Results */}
        {results && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Header */}
            <div
              className="p-3 rounded-xl flex items-center justify-between"
              style={{ backgroundColor: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
            >
              <h3 className="font-semibold text-sm" style={{ color: 'var(--c-text-primary)' }}>Available Options</h3>
              <select
                value={preferSustainable ? 'co2' : 'time'}
                onChange={e => setPreferSustainable(e.target.value === 'co2')}
                className="text-xs px-2 py-1 rounded-md"
                style={{ backgroundColor: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-text-primary)' }}
              >
                <option value="co2">CO₂ (Lowest First)</option>
                <option value="time">Time (Fastest First)</option>
                <option value="cost">Cost (Cheapest First)</option>
              </select>
            </div>

            {co2Saved > 0 && (
              <p className="text-xs text-center" style={{ color: 'var(--c-ok)' }}>
                💚 Best option saves <strong>{(co2Saved / 1000).toFixed(1)} kg CO₂</strong> vs driving
              </p>
            )}

            {/* Option Cards */}
            <div className="space-y-2">
              {results.options.map((option: any, i: number) => {
                const info = MODE_INFO[option.mode] || { icon: '🚌', label: option.mode, desc: option.description }
                const isRecommended = option.mode === results.recommended
                return (
                  <motion.div
                    key={option.mode}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl transition-all"
                    style={isRecommended ? {
                      backgroundColor: 'rgba(0,212,255,0.06)',
                      border: '1px solid rgba(0,212,255,0.25)',
                    } : {
                      backgroundColor: 'var(--c-surface2)',
                      border: '1px solid var(--c-border)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: 'var(--c-surface3)' }}
                      >
                        {info.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm" style={{ color: 'var(--c-text-primary)' }}>{info.label}</h4>
                          {isRecommended && <span className="badge badge-cyan">Recommended</span>}
                          {option.accessible && <span className="badge badge-green">♿ Accessible</span>}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{info.desc}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
                          <span>⏱ {option.duration_min} min</span>
                          <span>💵 ${option.cost_usd.toFixed(2)}</span>
                          <span style={{ color: 'var(--c-ok)' }}>🌱 {option.co2_g}g CO₂</span>
                        </div>
                      </div>
                    </div>
                    {isRecommended && (
                      <div
                        className="mt-3 p-2 rounded-lg text-xs"
                        style={{ backgroundColor: 'rgba(63,185,80,0.08)', color: 'var(--c-ok)', border: '1px solid rgba(63,185,80,0.2)' }}
                      >
                        💚 Best choice for sustainability — saves ~{Math.round(option.co2_g * 0.8)}g CO₂ vs driving
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Sustainability box */}
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(63,185,80,0.06)', border: '1px solid rgba(63,185,80,0.2)' }}>
              <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--c-ok)' }}>⚡ Sustainability Impact</h4>
              <p className="text-xs" style={{ color: 'var(--c-text-secondary)' }}>
                Fan travel accounts for <strong style={{ color: 'var(--c-text-primary)' }}>87.8%</strong> of event emissions.
                Choosing transit or EV rideshare significantly reduces your carbon footprint.
                Levi's Stadium is LEED Gold certified with 400kW solar capacity.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}