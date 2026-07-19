'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { CrowdSnapshot, ZoneOccupancy } from '../../lib/api'

interface ZoneMapProps {
  snapshot: CrowdSnapshot | null
  onZoneClick?: (zone: ZoneOccupancy) => void
}

const ZONE_COLORS = {
  gate: '#3B82F6',
  concourse: '#10B981',
  seating: '#F59E0B',
  club: '#8B5CF6',
  sensory: '#EC4899',
  medical: '#EF4444',
}

function getOccupancyColor(pct: number) {
  if (pct >= 90) return '#EF4444'
  if (pct >= 80) return '#F59E0B'
  if (pct >= 70) return '#F59E0B'
  if (pct >= 50) return '#10B981'
  return '#3B82F6'
}

const ZONE_LAYOUT: Record<string, { x: number; y: number; width: number; height: number }> = {
  GATE_A: { x: 50, y: 50, width: 80, height: 40 },
  GATE_B: { x: 300, y: 50, width: 80, height: 40 },
  GATE_C: { x: 520, y: 250, width: 80, height: 40 },
  GATE_D: { x: 300, y: 500, width: 80, height: 40 },
  CONCOURSE_N: { x: 150, y: 120, width: 200, height: 60 },
  CONCOURSE_E: { x: 400, y: 250, width: 100, height: 60 },
  CONCOURSE_S: { x: 200, y: 400, width: 200, height: 60 },
  CONCOURSE_W: { x: 100, y: 280, width: 80, height: 60 },
  SECTION_101: { x: 160, y: 200, width: 60, height: 40 },
  SECTION_102: { x: 230, y: 200, width: 60, height: 40 },
  SECTION_103: { x: 400, y: 320, width: 60, height: 40 },
  SECTION_104: { x: 460, y: 340, width: 60, height: 40 },
  SECTION_105: { x: 310, y: 360, width: 60, height: 40 },
  SECTION_106: { x: 250, y: 360, width: 60, height: 40 },
  SECTION_107: { x: 180, y: 340, width: 60, height: 40 },
  SECTION_108: { x: 230, y: 340, width: 60, height: 40 },
  SECTION_201: { x: 180, y: 180, width: 50, height: 30 },
  SECTION_203: { x: 410, y: 310, width: 50, height: 30 },
  CLUB_EAST: { x: 410, y: 230, width: 70, height: 50 },
  CLUB_WEST: { x: 180, y: 250, width: 70, height: 50 },
  SENSORY_ROOM_N: { x: 120, y: 200, width: 40, height: 30 },
  SENSORY_ROOM_S: { x: 280, y: 450, width: 40, height: 30 },
  MEDICAL_MAIN: { x: 250, y: 300, width: 60, height: 40 },
}

export function ZoneMap({ snapshot, onZoneClick }: ZoneMapProps) {
  const [selectedZone, setSelectedZone] = useState<any>(null)

  const zones = snapshot?.zones || []

  const handleClick = (zone: any) => {
    setSelectedZone(zone)
    onZoneClick?.(zone)
  }

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-neutral-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-fifa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Stadium Live Map
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: '#10B981' }} />
              <span className="text-neutral-600">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: '#F59E0B' }} />
              <span className="text-neutral-600">High</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: '#EF4444' }} />
              <span className="text-neutral-600">Critical</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-neutral-50 p-4 relative">
        <div className="relative" style={{ width: '600px', height: '550px', margin: '0 auto' }}>
          {/* Stadium outline */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 550" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="300" cy="275" rx="280" ry="250" fill="white" stroke="#E5E7EB" strokeWidth="2" />
            <ellipse cx="300" cy="275" rx="200" ry="180" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
            {/* Field */}
            <rect x="250" y="240" width="100" height="70" fill="#D1FAE5" stroke="#10B981" strokeWidth="1.5" rx="4" />
            <text x="300" y="280" textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="bold">FIELD</text>
          </svg>

          {/* Zone markers */}
          {zones.map((zone) => {
            const layout = ZONE_LAYOUT[zone.zone_id]
            if (!layout) return null

            const color = getOccupancyColor(zone.pct)
            const isSelected = selectedZone?.zone_id === zone.zone_id

            return (
              <motion.div
                key={zone.zone_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleClick(zone)}
                className={`absolute rounded-lg cursor-pointer transition-all overflow-hidden border-2 ${
                  isSelected ? 'border-fifa-blue shadow-lg' : 'border-white'
                }`}
                style={{
                  width: `${layout.width}px`,
                  height: `${layout.height}px`,
                  left: `${layout.x}px`,
                  top: `${layout.y}px`,
                  background: `${color}30`,
                  borderColor: color,
                }}
                title={`${zone.name}: ${zone.pct.toFixed(0)}%`}
              >
                {/* Fill bar */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  style={{ background: color, opacity: 0.4 }}
                  initial={{ height: '0%' }}
                  animate={{ height: `${Math.min(zone.pct, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />

                {/* Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                  <span className="text-[10px] font-bold text-neutral-900 leading-tight text-center">
                    {zone.zone_id.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-xs font-bold ${zone.pct >= 80 ? 'text-red-600' : 'text-neutral-700'}`}>
                    {zone.pct.toFixed(0)}%
                  </span>
                </div>

                {/* Pulse for critical */}
                {zone.pct >= 90 && (
                  <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{ background: color }}
                    animate={{ opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            )
          })}

          {/* Selected Zone Detail */}
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-3 border border-neutral-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-neutral-900">{selectedZone.name}</p>
                  <p className="text-xs text-neutral-600">
                    {selectedZone.count.toLocaleString()} / {selectedZone.capacity.toLocaleString()} ({selectedZone.pct.toFixed(0)}%)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${selectedZone.pct >= 80 ? 'badge-red' : selectedZone.pct >= 70 ? 'badge-amber' : 'badge-green'}`}>
                    {selectedZone.pct >= 90 ? 'CRITICAL' : selectedZone.pct >= 80 ? 'WARNING' : 'NORMAL'}
                  </span>
                  <span className="text-xs text-neutral-600 capitalize">{selectedZone.trend}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}