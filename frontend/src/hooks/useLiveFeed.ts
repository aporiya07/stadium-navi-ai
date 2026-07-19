import { useEffect, useRef, useState, useCallback } from 'react'
import { CrowdSnapshot } from '../lib/api'

interface LiveFeedMessage {
  type: string
  data: any
  timestamp: string
}

interface UseLiveFeedOptions {
  onSnapshot?: (snapshot: CrowdSnapshot) => void
  onZoneUpdate?: (zone: any) => void
  onAlert?: (alert: any) => void
  onSummary?: (summary: any) => void
  onPhaseChange?: (phase: string) => void
  onError?: (error: Error) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useLiveFeed(options: UseLiveFeedOptions = {}) {
  const {
    onSnapshot,
    onZoneUpdate,
    onAlert,
    onSummary,
    onPhaseChange,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<LiveFeedMessage | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    // Use the Vite proxy: /api path proxied to backend
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/live`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected to', wsUrl)
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: LiveFeedMessage = JSON.parse(event.data)
          setLastMessage(message)

          switch (message.type) {
            case 'initial_snapshot':
              if (onSnapshot && message.data) {
                onSnapshot(message.data as CrowdSnapshot)
              }
              break
            case 'snapshot':
              if (onSnapshot && message.data) {
                onSnapshot(message.data as CrowdSnapshot)
              }
              break
            case 'zone_update':
              if (onZoneUpdate && message.data) {
                onZoneUpdate(message.data)
              }
              break
            case 'alert':
              if (onAlert && message.data) {
                onAlert(message.data)
              }
              break
            case 'summary':
              if (onSummary && message.data) {
                onSummary(message.data)
              }
              break
            case 'phase_change':
              if (onPhaseChange && message.data?.phase) {
                onPhaseChange(message.data.phase)
              }
              break
            case 'heartbeat':
              // Connection health check — no action needed
              break
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(reconnectInterval * reconnectAttempts.current, 30000)
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          console.error('Max reconnection attempts reached')
          onError?.(new Error('Max reconnection attempts reached'))
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        // Don't call onError here — onclose will handle reconnection
      }
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
    }
  }, [onSnapshot, onZoneUpdate, onAlert, onSummary, onPhaseChange, onError, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectAttempts.current = maxReconnectAttempts // prevent auto-reconnect
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [maxReconnectAttempts])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
  }
}