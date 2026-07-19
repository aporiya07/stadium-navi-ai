/**
 * Type definitions for Stadium Copilot API responses and payloads.
 * Includes data models for AI chat, navigation, crowd tracking, and operational tasks.
 */

export interface Language {
  EN: 'en'
  ES: 'es'
  FR: 'fr'
  AR: 'ar'
  PT: 'pt'
  ZH: 'zh'
}

export type LanguageCode = 'en' | 'es' | 'fr' | 'ar' | 'pt' | 'zh'

export interface ChatRequest {
  message: string
  language: LanguageCode
  context?: Record<string, any>
}

/**
 * Expected response from the AI assistant chat endpoint.
 */
export interface ChatResponse {
  response: string
  language: LanguageCode
  session_id: string
  citations: string[]
  suggested_actions: string[]
}

export interface NavigationRequest {
  from_zone: string
  to_zone: string
  persona?: string
  avoid_congestion?: boolean
}

export interface Waypoint {
  zone_id: string
  name: string
  instruction: string
  distance_m: number
  accessible: boolean
  landmarks?: string[]
}

/**
 * Full navigational route spanning multiple waypoints, returning distance and time estimates.
 */
export interface NavigationResponse {
  waypoints: Waypoint[]
  total_distance_m: number
  estimated_time_min: number
  congestion_warnings: string[]
}

export interface AccessibilityRequest {
  persona: 'wheelchair' | 'sensory' | 'elderly' | 'blind_low_vision'
  from_zone: string
  to_zone: string
  needs?: string[]
}

export interface AccessibilityResponse {
  route: NavigationResponse
  accommodations: string[]
  sensory_notes: string[]
  staff_assist_points: string[]
}

export interface TransportRequest {
  from_location: string
  to_location: string
  departure_time?: string
  prefer_sustainable?: boolean
  wheelchair_accessible?: boolean
}

export interface TransportOption {
  mode: 'walk' | 'rail' | 'bus' | 'rideshare_ev' | 'rideshare_ice' | 'private_car'
  duration_min: number
  cost_usd: number
  co2_g: number
  description: string
  steps: string[]
  real_time: boolean
  accessible: boolean
}

export interface TransportResponse {
  options: TransportOption[]
  recommended: string
  total_co2_saved_grams: number
}

export interface VolunteerAction {
  id: string
  title: string
  description: string
  priority: number
  zone: string
  phase: string
  estimated_duration_min: number
  required_skills: string[]
  dispatch_note: string
  urgency: 'high' | 'medium' | 'low'
}

export interface VolunteerRequest {
  role: string
  current_zone?: string
  phase: string
}

export interface VolunteerResponse {
  actions: VolunteerAction[]
  summary: string
  priority_zones: string[]
}

export interface IncidentRequest {
  zone_id: string
  type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  reporter_id?: string
}

export interface IncidentResponse {
  incident_id: string
  triage_level: number
  assigned_staff: string[]
  estimated_response_min: number
  dispatch_note: string
  escalation_required: boolean
}

export interface ZoneOccupancy {
  zone_id: string
  name: string
  type: string
  count: number
  capacity: number
  pct: number
  trend: 'rising' | 'falling' | 'stable'
  timestamp: string
}

export interface CrowdSnapshot {
  zones: ZoneOccupancy[]
  total_occupancy: number
  total_capacity: number
  overall_pct: number
  phase: 'PRE_MATCH' | 'LIVE' | 'HALFTIME' | 'POST_MATCH'
  timestamp: string
}

export interface CrowdSummary {
  summary: string
  alerts: Array<{
    zone: string
    level: 'watch' | 'warning' | 'critical'
    message: string
  }>
  recommended_actions: string[]
}

export interface ZoneConfig {
  zone_id: string
  name: string
  type: string
  capacity: number
  accessible: boolean
  coordinates: { x: number; y: number }
  connections: string[]
  description: string
}

export interface ZoneGraph {
  nodes: string[]
  edges: Array<{
    from: string
    to: string
    distance_m: number
    accessible: boolean
  }>
}

export interface Venue {
  id: string
  name: string
  city: string
  country: string
  timezone: string
  capacity: number
  fifa_2026_host: boolean
  accessibility_certified: boolean
  transit_connections: string[]
  parking_spaces: number
  sensory_rooms: number
  wheelchair_spaces: number
  navilens_enabled: boolean
  languages_supported: string[]
  facts: Array<{
    key: string
    value: string
    category: string
  }>
}

export interface MatchSchedule {
  match_id: string
  venue_id: string
  date: string
  kickoff_local: string
  timezone: string
  phase_timeline: Record<string, {
    start: string
    duration_min: number
    description: string
  }>
  teams: {
    home: string
    away: string
    group: string
  }
  expected_attendance: number
}

export interface ScheduleData {
  match_schedule: MatchSchedule[]
  transport_schedules: Record<string, any>
  sustainability: {
    co2_factors_g_per_passenger_km: Record<string, number>
    stadium_to_sfo_km: number
    stadium_to_downtown_sj_km: number
    stadium_to_san_francisco_km: number
  }
}