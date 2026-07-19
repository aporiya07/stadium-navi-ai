import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

// ==================== FAN ASSISTANT ====================
export function useFanChat() {
  return useMutation({
    mutationFn: async (request: {
      message: string
      language?: string
      context?: Record<string, any>
    }) => {
      return fetcher('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ language: 'en', ...request }),
      })
    },
  })
}

export function useNavigation() {
  return useMutation({
    mutationFn: async (request: {
      from_zone: string
      to_zone: string
      persona?: string
      avoid_congestion?: boolean
    }) => {
      return fetcher('/navigate', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
  })
}

export function useAccessibilityRoute() {
  return useMutation({
    mutationFn: async (request: {
      persona: string
      from_zone: string
      to_zone: string
      needs?: string[]
    }) => {
      return fetcher('/accessibility/route', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
  })
}

export function useTransportOptions() {
  return useMutation({
    mutationFn: async (request: {
      from_location: string
      to_location: string
      departure_time?: string
      prefer_sustainable?: boolean
      wheelchair_accessible?: boolean
    }) => {
      return fetcher('/transport/options', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
  })
}

// ==================== OPS DASHBOARD ====================
export function useVolunteerActions() {
  return useMutation({
    mutationFn: async (request: {
      role?: string
      volunteer_zone?: string
      phase: string
    }) => {
      return fetcher('/volunteer/actions', {
        method: 'POST',
        body: JSON.stringify({ role: 'general', ...request }),
      })
    },
  })
}

export function useIncidentTriage() {
  return useMutation({
    mutationFn: async (request: {
      zone_id: string
      type: string
      description: string
      severity: string
      reporter_id?: string
    }) => {
      return fetcher('/incident/triage', {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
  })
}

export function useSetPhase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (phase: string) => {
      return fetcher(`/crowd/phase?phase=${phase}`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crowd'] })
    },
  })
}

// ==================== CROWD DATA ====================
export function useCrowdSnapshot() {
  return useQuery({
    queryKey: ['crowd', 'snapshot'],
    queryFn: () => fetcher<any>('/crowd/snapshot'),
    refetchInterval: 3000,
    staleTime: 1000,
  })
}

export function useCrowdSummary() {
  return useQuery({
    queryKey: ['crowd', 'summary'],
    queryFn: () => fetcher<any>('/crowd/summary'),
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
  })
}

export function useZoneGraph() {
  return useQuery({
    queryKey: ['zones', 'graph'],
    queryFn: () => fetcher<any>('/data/zone-graph'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: () => fetcher<any>('/data/zones'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useVenues() {
  return useQuery({
    queryKey: ['venues'],
    queryFn: () => fetcher<any>('/data/venues'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSchedules() {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: () => fetcher<any>('/data/schedules'),
    staleTime: 5 * 60 * 1000,
  })
}

// ==================== HEALTH ====================
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => fetcher<any>('/health'),
    refetchInterval: 30000,
  })
}

// ==================== UTILITIES ====================
export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  return useCallback((queryKeys: string[][]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key })
    })
  }, [queryClient])
}