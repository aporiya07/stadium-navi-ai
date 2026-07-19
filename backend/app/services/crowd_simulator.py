import asyncio
import json
import random
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from collections import defaultdict

from app.models.schemas import (
    ZoneOccupancy, CrowdSnapshot, MatchPhase, ZoneType,
    ZoneConfig, LiveFeedMessage
)
from app.services.data_service import data_service

logger = logging.getLogger(__name__)


class CrowdSimulator:
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._subscribers: List[asyncio.Queue] = []
        self._zones: Dict[str, ZoneConfig] = {}
        self._current_occupancy: Dict[str, int] = {}
        self._previous_occupancy: Dict[str, int] = {}
        self._phase = MatchPhase.PRE_MATCH
        self._phase_start_time = datetime.now()
        self._interval = 3  # seconds
        self._tick_count = 0
        self._gemini_service = None  # lazy import to avoid circular

        self._init_zones()

    def _get_gemini_service(self):
        if self._gemini_service is None:
            from app.services.gemini_service import gemini_service
            self._gemini_service = gemini_service
        return self._gemini_service

    def _init_zones(self):
        """Initialize zones from data service with starting occupancy."""
        try:
            zones = data_service.get_zone_configs()
            for zone in zones:
                self._zones[zone.zone_id] = zone
                base_pct = self._get_base_occupancy_pct(zone.type)
                self._current_occupancy[zone.zone_id] = int(zone.capacity * base_pct)
                self._previous_occupancy[zone.zone_id] = self._current_occupancy[zone.zone_id]
        except Exception as e:
            logger.error(f"Failed to init zones: {e}")

    def _get_base_occupancy_pct(self, zone_type: ZoneType) -> float:
        """Get base occupancy percentage by zone type for PRE_MATCH phase."""
        base = {
            ZoneType.GATE: 0.15,
            ZoneType.CONCOURSE: 0.10,
            ZoneType.SEATING: 0.05,
            ZoneType.CLUB: 0.08,
            ZoneType.SENSORY: 0.05,
            ZoneType.MEDICAL: 0.02
        }
        return base.get(zone_type, 0.10)

    @property
    def running(self) -> bool:
        return self._running

    def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue(maxsize=50)
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    def _broadcast(self, message: Dict):
        dead = []
        for queue in self._subscribers:
            try:
                queue.put_nowait(message)
            except asyncio.QueueFull:
                pass
            except Exception:
                dead.append(queue)
        for q in dead:
            self._subscribers.remove(q)

    def get_snapshot(self) -> CrowdSnapshot:
        """Get current crowd snapshot."""
        zone_statuses = []
        total_occ = 0
        total_cap = 0

        for zone_id, zone in self._zones.items():
            count = self._current_occupancy.get(zone_id, 0)
            pct = (count / zone.capacity * 100) if zone.capacity > 0 else 0
            trend = self._get_trend(zone_id, pct)

            zone_statuses.append(ZoneOccupancy(
                zone_id=zone_id,
                name=zone.name,
                type=zone.type,
                count=count,
                capacity=zone.capacity,
                pct=round(pct, 1),
                trend=trend,
                timestamp=datetime.now()
            ))

            total_occ += count
            total_cap += zone.capacity

        overall_pct = (total_occ / total_cap * 100) if total_cap > 0 else 0

        return CrowdSnapshot(
            zones=zone_statuses,
            total_occupancy=total_occ,
            total_capacity=total_cap,
            overall_pct=round(overall_pct, 1),
            phase=self._phase,
            timestamp=datetime.now()
        )

    def _get_trend(self, zone_id: str, current_pct: float) -> str:
        """Determine occupancy trend by comparing to previous tick."""
        prev = self._previous_occupancy.get(zone_id, 0)
        zone = self._zones.get(zone_id)
        if not zone or zone.capacity == 0:
            return "stable"

        prev_pct = (prev / zone.capacity * 100)
        diff = current_pct - prev_pct

        if diff > 2:
            return "rising"
        elif diff < -2:
            return "falling"
        return "stable"

    def _get_phase_multiplier(self) -> float:
        """Get occupancy multiplier based on match phase."""
        multipliers = {
            MatchPhase.PRE_MATCH: 1.5,   # Ingress
            MatchPhase.LIVE: 1.0,        # Stable in seats
            MatchPhase.HALFTIME: 2.0,    # Surge to concessions/restrooms
            MatchPhase.POST_MATCH: 0.3   # Egress
        }
        return multipliers.get(self._phase, 1.0)

    def _get_zone_target_pct(self, zone: ZoneConfig) -> float:
        """Calculate target occupancy percentage for current phase."""
        base = self._get_base_occupancy_pct(zone.type)
        multiplier = self._get_phase_multiplier()

        # Zone-specific adjustments per phase
        if self._phase == MatchPhase.PRE_MATCH:
            if zone.type == ZoneType.GATE:
                return min(85, base * multiplier * 100)
            elif zone.type == ZoneType.CONCOURSE:
                return min(65, base * multiplier * 100)
            elif zone.type == ZoneType.SEATING:
                return min(20, base * multiplier * 100)
        elif self._phase == MatchPhase.LIVE:
            if zone.type == ZoneType.SEATING:
                return min(98, 90 + random.uniform(-5, 5))
            elif zone.type == ZoneType.CONCOURSE:
                return min(25, base * 100)
            elif zone.type == ZoneType.GATE:
                return min(15, base * 100)
        elif self._phase == MatchPhase.HALFTIME:
            if zone.type == ZoneType.CONCOURSE:
                return min(92, 75 + random.uniform(-5, 10))
            elif zone.type == ZoneType.SEATING:
                return min(40, base * 100)
            elif zone.type == ZoneType.SENSORY:
                return min(75, base * multiplier * 100)
        elif self._phase == MatchPhase.POST_MATCH:
            if zone.type == ZoneType.GATE:
                return min(80, 60 + random.uniform(-10, 15))
            elif zone.type == ZoneType.CONCOURSE:
                return min(60, base * multiplier * 100)
            elif zone.type == ZoneType.SEATING:
                return min(5, base * 100)

        return min(100, base * multiplier * 100)

    async def _update_occupancy(self):
        """Update occupancy for all zones with realistic dynamics."""
        alerts = []

        # Save previous state for trend calculation
        self._previous_occupancy = dict(self._current_occupancy)

        for zone_id, zone in self._zones.items():
            current = self._current_occupancy.get(zone_id, 0)
            target_pct = self._get_zone_target_pct(zone)
            target = int(zone.capacity * target_pct / 100)

            # Move toward target with noise
            diff = target - current
            step = max(1, int(abs(diff) * 0.15))  # 15% of gap per tick
            step = min(step, 200)  # Cap step size

            if diff > 0:
                current += min(step, diff)
            elif diff < 0:
                current -= min(step, abs(diff))

            # Add noise (±2%)
            noise = int(zone.capacity * 0.02 * (random.random() - 0.5))
            current = max(0, min(zone.capacity, current + noise))

            self._current_occupancy[zone_id] = current

            # Check for alerts
            pct = current / zone.capacity * 100 if zone.capacity > 0 else 0
            if pct >= 90:
                alerts.append({
                    "zone": zone_id,
                    "zone_name": zone.name,
                    "level": "critical",
                    "message": f"{zone.name} at {pct:.0f}% — CRITICAL: direct crowd away"
                })
            elif pct >= 80:
                alerts.append({
                    "zone": zone_id,
                    "zone_name": zone.name,
                    "level": "warning",
                    "message": f"{zone.name} at {pct:.0f}% — deploy staff"
                })

        # Broadcast zone updates
        snapshot = self.get_snapshot()

        # Send a single full snapshot every tick (easier for frontend to handle)
        self._broadcast({
            "type": "snapshot",
            "data": snapshot.model_dump(mode="json"),
            "timestamp": datetime.now().isoformat()
        })

        # Also send individual zone updates
        for zs in snapshot.zones:
            self._broadcast({
                "type": "zone_update",
                "data": zs.model_dump(mode="json"),
                "timestamp": datetime.now().isoformat()
            })

        # Send alerts
        for alert in alerts:
            self._broadcast({
                "type": "alert",
                "data": alert,
                "timestamp": datetime.now().isoformat()
            })

        # Periodically send Gemini summary (every 10 ticks = ~30s)
        self._tick_count += 1
        if self._tick_count % 10 == 0:
            try:
                summary = await self._get_gemini_service().summarize_crowd(snapshot)
                self._broadcast({
                    "type": "summary",
                    "data": summary,
                    "timestamp": datetime.now().isoformat()
                })
            except Exception as e:
                logger.error(f"Failed to generate Gemini summary: {e}")

    async def run(self, interval: int = 3):
        """Main simulation loop."""
        self._running = True
        self._interval = interval

        logger.info(f"Crowd simulator started (interval: {interval}s)")

        while self._running:
            try:
                await self._update_occupancy()
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulation error: {e}")
                await asyncio.sleep(interval)

        self._running = False
        logger.info("Crowd simulator stopped")

    def stop(self):
        self._running = False

    def get_live_density(self) -> Dict[str, float]:
        """Get current occupancy percentages for navigation."""
        result = {}
        for zone_id, zone in self._zones.items():
            count = self._current_occupancy.get(zone_id, 0)
            if zone.capacity > 0:
                result[zone_id] = round(count / zone.capacity * 100, 1)
            else:
                result[zone_id] = 0
        return result

    def set_phase(self, phase: MatchPhase):
        """Manually set match phase (for testing/demo)."""
        self._phase = phase
        self._phase_start_time = datetime.now()
        logger.info(f"Match phase changed to: {phase.value}")

        self._broadcast({
            "type": "phase_change",
            "data": {"phase": phase.value},
            "timestamp": datetime.now().isoformat()
        })

    async def get_gemini_summary(self) -> Dict:
        """Get Gemini-powered crowd summary."""
        snapshot = self.get_snapshot()
        return await self._get_gemini_service().summarize_crowd(snapshot)


crowd_simulator = CrowdSimulator()