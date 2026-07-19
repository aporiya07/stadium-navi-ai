'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatWidget } from './ChatWidget'
import { WayfindingPanel } from './WayfindingPanel'
import { AccessibilityPanel } from './AccessibilityPanel'
import { TransportPanel } from './TransportPanel'

type Tab = 'chat' | 'navigate' | 'accessibility' | 'transport'

const TABS: { id: Tab; label: string; icon: string; description: string }[] = [
  { id: 'chat',          label: 'Assistant',    icon: '💬', description: 'Multilingual AI assistant' },
  { id: 'navigate',      label: 'Navigate',     icon: '🗺️', description: 'Find your way around' },
  { id: 'accessibility', label: 'Accessibility', icon: '♿', description: 'Accessible routing' },
  { id: 'transport',     label: 'Transport',    icon: '🚌', description: 'Sustainable travel' },
]

export function FanView() {
  const [activeTab, setActiveTab] = useState<Tab>('chat')

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: 'var(--c-canvas)' }}>

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section
        className="py-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, var(--c-canvas) 55%)',
          borderBottom: '1px solid var(--c-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-text-secondary)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                FIFA World Cup 2026 · Levi's Stadium
              </span>
            </div>

            <h1
              className="text-3xl md:text-4xl font-heading font-bold mb-3"
              style={{ color: 'var(--c-text-primary)' }}
            >
              Your Smart{' '}
              <span className="text-gradient-accent">Stadium Companion</span>
            </h1>
            <p className="text-base mb-6" style={{ color: 'var(--c-text-secondary)' }}>
              AI-powered assistance in 6 languages. Navigate, travel sustainably,
              and get personalized accessibility routing.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: '🌍', label: '6 Languages' },
                { icon: '♿', label: 'Accessibility First' },
                { icon: '🌱', label: 'Carbon Aware' },
                { icon: '🤖', label: 'Gemini AI' },
              ].map((f, i) => (
                <motion.span
                  key={f.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--c-surface2)',
                    border: '1px solid var(--c-border)',
                    color: 'var(--c-text-secondary)',
                  }}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map((tab, i) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap text-sm font-medium"
              style={activeTab === tab.id ? {
                backgroundColor: 'var(--c-accent-dim)',
                color: 'var(--c-accent)',
                border: '1px solid rgba(0,212,255,0.2)',
              } : {
                backgroundColor: 'var(--c-surface)',
                color: 'var(--c-text-secondary)',
                border: '1px solid var(--c-border)',
              }}
            >
              <span className="text-base">{tab.icon}</span>
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-xs hidden sm:block" style={{ color: 'var(--c-text-muted)' }}>
                  {tab.description}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Tab Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="lg:col-span-2"
            >
              {activeTab === 'chat'          && <ChatWidget />}
              {activeTab === 'navigate'      && <WayfindingPanel />}
              {activeTab === 'accessibility' && <AccessibilityPanel />}
              {activeTab === 'transport'     && <TransportPanel />}
            </motion.div>
          </AnimatePresence>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Stadium Info */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="card p-5"
            >
              <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: 'var(--c-text-primary)' }}>
                Levi's Stadium
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Capacity',          value: '68,500',          accent: false },
                  { label: 'Location',          value: 'Santa Clara, CA', accent: false },
                  { label: 'Certification',     value: 'LEED Gold',       accent: 'ok' },
                  { label: 'Sensory Rooms',     value: '2 (N & S)',       accent: false },
                  { label: 'Wheelchair Spaces', value: '850',             accent: false },
                  { label: 'NaviLens',          value: 'Enabled',         accent: 'cyan' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span style={{ color: 'var(--c-text-secondary)' }}>{row.label}</span>
                    <span
                      className="font-medium"
                      style={{
                        color: row.accent === 'ok'   ? 'var(--c-ok)'
                             : row.accent === 'cyan' ? 'var(--c-accent)'
                             : 'var(--c-text-primary)',
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Live Status */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--c-text-primary)' }}>
                  Live Status
                </h3>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--c-ok)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 6px #3FB950' }} />
                  Live
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ color: 'var(--c-text-secondary)' }}>Overall Attendance</span>
                    <span style={{ color: 'var(--c-text-primary)' }} className="font-medium">Updating…</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-surface2)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, var(--c-accent), #7DD3FC)' }}
                      animate={{ width: ['0%', '65%'] }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--c-text-secondary)' }}>Current Phase</span>
                  <span className="badge badge-cyan">PRE_MATCH</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--c-text-secondary)' }}>Active Zones</span>
                  <span style={{ color: 'var(--c-text-primary)' }} className="font-medium">23 zones</span>
                </div>
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="card p-5"
              style={{ borderColor: 'rgba(0,212,255,0.15)', backgroundColor: 'rgba(0,212,255,0.04)' }}
            >
              <h3 className="font-heading font-semibold text-sm mb-2" style={{ color: 'var(--c-accent)' }}>
                💡 Helpful Tips
              </h3>
              <ul className="text-sm space-y-1.5" style={{ color: 'var(--c-text-secondary)' }}>
                <li>• Arrive early to avoid ingress congestion</li>
                <li>• Use Gate A for VTA Light Rail access</li>
                <li>• Sensory rooms available at N & S Concourses</li>
                <li>• All gates are step-free accessible</li>
                <li>• Download the official app for NaviLens codes</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Chat FAB — always visible */}
      {activeTab !== 'chat' && <ChatWidget fabOnly />}
    </div>
  )
}