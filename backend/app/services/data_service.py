import json
import os
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

from app.models.schemas import (
    ZoneType, MatchPhase, VenueFact, ZoneGraph, ZoneGraphFlat,
    ZoneConfig, ZoneEdge, ZoneNode
)


class DataService:
    def __init__(self):
        # Try multiple data directory locations
        base = Path(__file__).parent.parent.parent
        candidates = [
            base / "data",
            base.parent / "data",
            Path("data"),
        ]
        self.data_dir = None
        for c in candidates:
            if c.exists():
                self.data_dir = c
                break
        if self.data_dir is None:
            self.data_dir = base / "data"
            self.data_dir.mkdir(parents=True, exist_ok=True)
            logger.warning(f"Data dir not found, created: {self.data_dir}")

        self._venues: List[Dict] = []
        self._zones: List[Dict] = []
        self._edges: List[Dict] = []
        self._schedules: Dict = {}
        self._venue_facts: List[VenueFact] = []
        self._zone_graph: ZoneGraph = None
        self._zone_graph_flat: ZoneGraphFlat = None
        self._load_all()

    def _load_all(self):
        """Load all data files."""
        self._load_venues()
        self._load_zones()
        self._load_schedules()
        self._build_zone_graph()
        self._build_venue_facts()

    def _load_venues(self):
        venues_path = self.data_dir / "venues.json"
        if venues_path.exists():
            with open(venues_path, "r") as f:
                data = json.load(f)
                self._venues = data.get("venues", [])
        else:
            logger.warning(f"venues.json not found at {venues_path}")

    def _load_zones(self):
        zones_path = self.data_dir / "zones.json"
        if zones_path.exists():
            with open(zones_path, "r") as f:
                data = json.load(f)
                self._zones = data.get("zones", [])
                self._edges = data.get("edges", [])
        else:
            logger.warning(f"zones.json not found at {zones_path}")

    def _load_schedules(self):
        schedules_path = self.data_dir / "schedules.json"
        if schedules_path.exists():
            with open(schedules_path, "r") as f:
                self._schedules = json.load(f)
        else:
            logger.warning(f"schedules.json not found at {schedules_path}")

    def _build_venue_facts(self):
        """Build searchable venue facts from venue data."""
        facts = []
        for venue in self._venues:
            for fact in venue.get("facts", []):
                try:
                    facts.append(VenueFact(**fact))
                except Exception:
                    pass
        self._venue_facts = facts

    def _build_zone_graph(self):
        """Build zone graph from zones and edges."""
        # Rich graph for navigation (ZoneNode objects)
        nodes = []
        for z in self._zones:
            nodes.append(ZoneNode(
                zone_id=z["zone_id"],
                name=z["name"],
                type=ZoneType(z["type"]),
                accessible=z.get("accessible", True),
                coordinates=z.get("coordinates", {"x": 0, "y": 0})
            ))

        edges = []
        for edge in self._edges:
            edges.append(ZoneEdge(
                from_zone=edge["from_zone"],
                to_zone=edge["to_zone"],
                distance_m=edge["distance_m"],
                accessible=edge["accessible"]
            ))

        self._zone_graph = ZoneGraph(nodes=nodes, edges=edges)

        # Flat graph for /data/zone-graph endpoint
        flat_edges = []
        for edge in self._edges:
            flat_edges.append({
                "from": edge["from_zone"],
                "to": edge["to_zone"],
                "distance_m": edge["distance_m"],
                "accessible": edge["accessible"]
            })
        self._zone_graph_flat = ZoneGraphFlat(
            nodes=[z["zone_id"] for z in self._zones],
            edges=flat_edges
        )

    # ==================== VENUES ====================
    def get_all_venues(self) -> List[Dict]:
        return self._venues

    def get_venue(self, venue_id: str) -> Optional[Dict]:
        for v in self._venues:
            if v["id"] == venue_id:
                return v
        return None

    def get_venue_facts(self) -> List[VenueFact]:
        return self._venue_facts

    def get_venue_context(self) -> Dict[str, Any]:
        """Get structured venue context for AI prompts."""
        if not self._venues:
            return {"name": "Levi's Stadium", "capacity": 68500, "city": "Santa Clara, CA"}
        v = self._venues[0]  # Levi's Stadium
        return {
            "name": v.get("name", "Levi's Stadium"),
            "capacity": v.get("capacity", 68500),
            "city": v.get("city", "Santa Clara"),
            "timezone": v.get("timezone", "America/Los_Angeles"),
            "accessibility_certified": v.get("accessibility_certified", True),
            "transit_connections": v.get("transit_connections", ["VTA Light Rail", "VTA Bus"]),
            "sensory_rooms": v.get("sensory_rooms", 2),
            "wheelchair_spaces": v.get("wheelchair_spaces", 850),
            "navilens_enabled": v.get("navilens_enabled", True),
            "languages_supported": v.get("languages_supported", ["en", "es", "fr", "ar", "pt", "zh"]),
            "facts": [{"key": f.key, "value": f.value, "category": f.category} for f in self._venue_facts[:20]]
        }

    # ==================== ZONES ====================
    def get_all_zones(self) -> List[Dict]:
        return self._zones

    def get_zone(self, zone_id: str) -> Optional[Dict]:
        for z in self._zones:
            if z["zone_id"] == zone_id:
                return z
        return None

    def get_zones_by_type(self, zone_type: ZoneType) -> List[Dict]:
        return [z for z in self._zones if z["type"] == zone_type.value]

    def get_accessible_zones(self) -> List[Dict]:
        return [z for z in self._zones if z.get("accessible", False)]

    def get_zone_configs(self) -> List[ZoneConfig]:
        """Get zones as ZoneConfig objects for simulator."""
        configs = []
        for z in self._zones:
            try:
                configs.append(ZoneConfig(
                    zone_id=z["zone_id"],
                    name=z["name"],
                    type=ZoneType(z["type"]),
                    capacity=z["capacity"],
                    accessible=z.get("accessible", True),
                    coordinates=z.get("coordinates", {"x": 0, "y": 0}),
                    connections=z.get("connections", []),
                    description=z.get("description", "")
                ))
            except Exception as e:
                logger.error(f"Failed to parse zone {z.get('zone_id', '?')}: {e}")
        return configs

    # ==================== ZONE GRAPH ====================
    def get_zone_graph(self) -> ZoneGraph:
        return self._zone_graph

    def get_zone_graph_flat(self) -> ZoneGraphFlat:
        return self._zone_graph_flat

    def get_edges(self) -> List[ZoneEdge]:
        return self._zone_graph.edges if self._zone_graph else []

    def get_accessible_edges(self) -> List[ZoneEdge]:
        return [e for e in self.get_edges() if e.accessible]

    # ==================== SCHEDULES ====================
    def get_schedules(self) -> Dict:
        return self._schedules

    def get_match_schedule(self, match_id: str) -> Optional[Dict]:
        for m in self._schedules.get("match_schedule", []):
            if m["match_id"] == match_id:
                return m
        return None

    def get_current_match(self) -> Optional[Dict]:
        """Get the match for today (or next upcoming)."""
        today = datetime.now().strftime("%Y-%m-%d")
        matches = self._schedules.get("match_schedule", [])
        if not matches:
            return None
        for m in matches:
            if m.get("date", "") >= today:
                return m
        return matches[-1] if matches else None

    def get_transport_schedules(self) -> Dict:
        return self._schedules.get("transport_schedules", {})

    def get_sustainability_data(self) -> Dict:
        return self._schedules.get("sustainability", {})

    def get_current_phase(self) -> str:
        """Determine current match phase based on time. Returns string for JSON context."""
        try:
            match = self.get_current_match()
            if not match:
                return MatchPhase.PRE_MATCH.value

            try:
                from zoneinfo import ZoneInfo
                tz = ZoneInfo(match.get("timezone", "America/Los_Angeles"))
                now = datetime.now(tz)
            except Exception:
                now = datetime.now()

            kickoff_str = match.get("kickoff_local", "19:00")
            date_str = match.get("date", datetime.now().strftime("%Y-%m-%d"))
            try:
                kickoff = datetime.strptime(f"{date_str} {kickoff_str}", "%Y-%m-%d %H:%M")
                try:
                    from zoneinfo import ZoneInfo
                    kickoff = kickoff.replace(tzinfo=ZoneInfo(match.get("timezone", "America/Los_Angeles")))
                except Exception:
                    pass
            except Exception:
                return MatchPhase.PRE_MATCH.value

            # Make both tz-aware or both naive
            if hasattr(now, 'tzinfo') and now.tzinfo and hasattr(kickoff, 'tzinfo') and not kickoff.tzinfo:
                now = now.replace(tzinfo=None)

            pre_open_minutes = match.get("phase_timeline", {}).get("gates_open", {}).get("start", "-180")
            try:
                gates_open_offset = int(str(pre_open_minutes).replace("-", "")) * -1
            except Exception:
                gates_open_offset = -180

            from datetime import timedelta
            gates_open = kickoff + timedelta(minutes=gates_open_offset)
            halftime_start = kickoff + timedelta(minutes=45)
            halftime_end = kickoff + timedelta(minutes=60)
            post_start = kickoff + timedelta(minutes=105)

            if now < gates_open:
                return MatchPhase.PRE_MATCH.value
            elif now < halftime_start:
                return MatchPhase.LIVE.value
            elif now < halftime_end:
                return MatchPhase.HALFTIME.value
            elif now < post_start:
                return MatchPhase.LIVE.value
            else:
                return MatchPhase.POST_MATCH.value
        except Exception as e:
            logger.error(f"Error getting phase: {e}")
            return MatchPhase.PRE_MATCH.value


data_service = DataService()