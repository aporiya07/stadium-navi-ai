'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'
import { FanView } from '../views/FanView/FanView'
import { OpsDashboard } from '../views/OpsDashboard/OpsDashboard'

type ViewMode = 'fan' | 'ops'

export function ViewSwitcher() {
  const [mode, setMode] = useState<ViewMode>('fan')

  const toggleView = useCallback((target: ViewMode) => {
    setMode(target)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--c-canvas)' }}>
      {/* ── Top Navigation Bar ─────────────────────────────────── */}
      <header
        style={{
          backgroundColor: 'var(--c-surface)',
          borderBottom: '1px solid var(--c-border)',
        }}
        className="sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--c-accent)', boxShadow: '0 0 12px rgba(0,212,255,0.4)' }}
              >
                <svg className="w-4 h-4" style={{ color: '#0D1117' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 18.657A8 8 0 016.343 7.343M12 2a10 10 0 1010 10A10 10 0 0012 2z" />
                </svg>
              </div>
              <div>
                <h1
                  className="font-heading font-semibold text-sm leading-tight"
                  style={{ color: 'var(--c-text-primary)' }}
                >
                  Stadium Copilot
                </h1>
                <p className="text-[10px] leading-tight" style={{ color: 'var(--c-text-muted)' }}>
                  Levi's Stadium · FIFA World Cup 2026
                </p>
              </div>
            </motion.div>

            {/* View Toggle */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-1 p-1 rounded-lg"
              style={{ backgroundColor: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}
            >
              {[
                { id: 'fan' as ViewMode, label: 'Fan View', icon: '👤' },
                { id: 'ops' as ViewMode, label: 'Ops Dashboard', icon: '📊' },
              ].map(({ id, label, icon }) => (
                <motion.button
                  key={id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleView(id)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                  style={mode === id ? {
                    backgroundColor: 'var(--c-accent-dim)',
                    color: 'var(--c-accent)',
                    border: '1px solid rgba(0,212,255,0.2)',
                  } : {
                    color: 'var(--c-text-secondary)',
                    border: '1px solid transparent',
                  }}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── View Content ───────────────────────────────────────── */}
      <main>
        <AnimatePresence mode="wait">
          {mode === 'fan' ? (
            <motion.div
              key="fan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <FanView />
            </motion.div>
          ) : (
            <motion.div
              key="ops"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <OpsDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}