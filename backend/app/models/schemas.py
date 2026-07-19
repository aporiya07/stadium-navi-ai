from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class Language(str, Enum):
    EN = "en"
    ES = "es"
    FR = "fr"
    AR = "ar"
    PT = "pt"
    ZH = "zh"


class Persona(str, Enum):
    FAN = "fan"
    STAFF = "staff"
    ACCESSIBILITY = "accessibility"
    TRANSPORT = "transport"
    VOLUNTEER = "volunteer"


class MatchPhase(str, Enum):
    PRE_MATCH = "PRE_MATCH"
    LIVE = "LIVE"
    HALFTIME = "HALFTIME"
    POST_MATCH = "POST_MATCH"


class AccessibilityPersona(str, Enum):
    WHEELCHAIR = "wheelchair"
    SENSORY = "sensory"
    ELDERLY = "elderly"
    BLIND_LOW_VISION = "blind_low_vision"


class ZoneType(str, Enum):
    GATE = "gate"
    CONCOURSE = "concourse"
    SEATING = "seating"
    CLUB = "club"
    SENSORY = "sensory"
    MEDICAL = "medical"


class TransportMode(str, Enum):
    WALK = "walk"
    RAIL = "rail"
    BUS = "bus"
    RIDESHARE_EV = "rideshare_ev"
    RIDESHARE_ICE = "rideshare_ice"
    PRIVATE_CAR = "private_car"


class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ==================== ZONE MODELS ====================

class ZoneOccupancy(BaseModel):
    """Used by CrowdSimulator for internal state."""
    zone_id: str
    name: str
    type: ZoneType
    count: int
    capacity: int
    pct: float
    trend: str  # "rising" | "falling" | "stable"
    timestamp: datetime


# Alias for backwards compat
ZoneStatus = ZoneOccupancy


class CrowdSnapshot(BaseModel):
    zones: List[ZoneOccupancy]
    total_occupancy: int
    total_capacity: int
    overall_pct: float
    phase: MatchPhase
    timestamp: datetime = Field(default_factory=datetime.now)


class ZoneConfig(BaseModel):
    zone_id: str
    name: str
    type: ZoneType
    capacity: int
    accessible: bool
    coordinates: Dict[str, int] = {"x": 0, "y": 0}
    connections: List[str] = []
    description: str = ""


class ZoneEdge(BaseModel):
    from_zone: str
    to_zone: str
    distance_m: int
    accessible: bool


class ZoneNode(BaseModel):
    """Rich zone node for navigation."""
    zone_id: str
    name: str
    type: ZoneType
    accessible: bool
    coordinates: Dict[str, int] = {"x": 0, "y": 0}


class ZoneGraph(BaseModel):
    nodes: List[ZoneNode]
    edges: List[ZoneEdge]


# Legacy flat ZoneGraph for /data/zone-graph endpoint
class ZoneGraphFlat(BaseModel):
    nodes: List[str]
    edges: List[Dict[str, Any]]


class VenueFact(BaseModel):
    key: str
    value: str
    category: str


# ==================== CHAT ====================

class ChatMessage(BaseModel):
    role: str
    content: str
    language: Language = Language.EN


class ChatRequest(BaseModel):
    message: str
    language: Language = Language.EN
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    language: Language
    session_id: str = "default"
    citations: List[str] = []
    suggested_actions: List[str] = []


# ==================== NAVIGATION ====================

class NavigationRequest(BaseModel):
    from_zone: str
    to_zone: str
    persona: Optional[AccessibilityPersona] = None
    avoid_congestion: bool = True


class Waypoint(BaseModel):
    zone_id: str
    name: str
    instruction: str
    distance_m: int
    accessible: bool
    landmarks: List[str] = []


class NavigationResponse(BaseModel):
    waypoints: List[Waypoint] = []
    total_distance_m: int = 0
    estimated_time_min: int = 0
    congestion_warnings: List[str] = []


# ==================== ACCESSIBILITY ====================

class AccessibilityRequest(BaseModel):
    persona: AccessibilityPersona
    from_zone: str
    to_zone: str
    needs: List[str] = []


class AccessibilityResponse(BaseModel):
    route: NavigationResponse
    accommodations: List[str] = []
    sensory_notes: List[str] = []
    staff_assist_points: List[str] = []
    tactile_guidance: List[str] = []
    audio_cues: List[str] = []
    rest_stops: List[str] = []
    sensory_warnings: List[str] = []


# ==================== TRANSPORT ====================

class TransportOption(BaseModel):
    mode: str  # TransportMode value
    duration_min: int
    cost_usd: float
    co2_grams: int
    description: str
    steps: List[str] = []
    real_time: bool = False
    accessible: bool = True


class TransportRequest(BaseModel):
    from_location: str
    to_location: str
    departure_time: Optional[datetime] = None
    prefer_sustainable: bool = True
    wheelchair_accessible: bool = False


class TransportResponse(BaseModel):
    options: List[TransportOption]
    recommended: str  # mode string
    total_co2_saved_grams: int = 0


# ==================== VOLUNTEER ====================

class VolunteerAction(BaseModel):
    id: str
    title: str
    description: str
    urgency: str = "medium"  # "high" | "medium" | "low"
    priority: int = 3
    zone: str
    phase: str
    dispatch_note: str = ""
    estimated_duration_min: int = 30
    required_skills: List[str] = []


class VolunteerRequest(BaseModel):
    role: str = "general"
    volunteer_zone: Optional[str] = None
    phase: MatchPhase = MatchPhase.PRE_MATCH


class VolunteerResponse(BaseModel):
    actions: List[VolunteerAction] = []
    summary: str = ""
    priority_zones: List[str] = []
    dispatch_note: str = ""


# ==================== INCIDENT ====================

class IncidentRequest(BaseModel):
    zone_id: str
    type: str
    description: str
    severity: IncidentSeverity
    reporter_id: Optional[str] = None


class IncidentResponse(BaseModel):
    incident_id: str
    priority: int = 3
    triage_level: int = 3
    assigned_staff: List[str] = []
    recommended_actions: List[str] = []
    dispatch_note: str
    estimated_response_time_min: int = 5
    estimated_response_min: int = 5  # alias
    escalation_required: bool = False


# ==================== LIVE FEED ====================

class LiveFeedMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: str


# ==================== HEALTH ====================

class HealthResponse(BaseModel):
    status: str
    version: str
    services: Dict[str, str]