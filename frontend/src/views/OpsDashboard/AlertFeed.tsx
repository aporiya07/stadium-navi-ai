'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Alert {
  id: string
  zone: string
  zone_name?: string
  level: 'watch' | 'warning' | 'critical'
  message: string
  timestamp: string
}

interface AlertFeedProps {
  alerts: Alert[]
  onDismiss?: (id: string) => void
  onAction?: (alert: Alert) => void
}

const LEVEL_CONFIG = {
  watch:    { color: 'var(--c-info)',   badgeClass: 'badge-blue',  label: 'WATCH',    icon: '👁️' },
  warning:  { color: 'var(--c-warn)',   badgeClass: 'badge-amber', label: 'WARNING',  icon: '⚠️' },
  critical: { color: 'var(--c-danger)', badgeClass: 'badge-red',   label: 'CRITICAL', icon: '🚨' },
}

export function AlertFeed({ alerts, onDismiss, onAction }: AlertFeedProps) {
  return (
    <div className="card h-full flex flex-col">
      <div className="card-header">
        <h2 className="font-heading font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--c-text-primary)' }}>
          <svg aria-hidden="true" className="w-4 h-4" style={{ color: 'var(--c-danger)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Alert Feed
        </h2>
        {alerts.length > 0 && (
          <span className="badge badge-red">{alerts.length} Active</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[480px]">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(63,185,80,0.12)', border: '1px solid rgba(63,185,80,0.2)' }}
            >
              <svg aria-hidden="true" className="w-6 h-6" style={{ color: 'var(--c-ok)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--c-text-primary)' }}>No active alerts</p>
            <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>All zones operating normally</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {alerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} onDismiss={onDismiss} onAction={onAction} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function AlertItem({ alert, onDismiss, onAction }: { alert: Alert; onDismiss?: (id: string) => void; onAction?: (a: Alert) => void }) {
  const cfg = LEVEL_CONFIG[alert.level]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="p-3"
      style={{ borderBottom: '1px solid var(--c-border)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
            <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>{alert.timestamp}</span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--c-text-primary)' }}>
            {alert.zone_name || alert.zone}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-secondary)' }}>{alert.message}</p>

          <div className="flex items-center gap-3 mt-2">
            {onAction && (
              <button
                onClick={() => onAction(alert)}
                className="text-xs font-medium transition-colors"
                style={{ color: cfg.color }}
              >
                Take Action →
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="text-xs transition-colors"
                style={{ color: 'var(--c-text-muted)' }}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const addAlert = (alert: Omit<Alert, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setAlerts(prev => [{ ...alert, id, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 50))
  }

  const dismissAlert = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id))
  const clearAll = () => setAlerts([])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setAlerts(prev => prev.filter(a => now - new Date(a.timestamp).getTime() < 5 * 60 * 1000))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return { alerts, addAlert, dismissAlert, clearAll }
}