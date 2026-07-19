import json
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum

import google.generativeai as genai

from app.core.config import settings
from app.models.schemas import (
    Language, MatchPhase, AccessibilityPersona, TransportMode,
    ZoneOccupancy, CrowdSnapshot, ZoneGraph
)
from app.services.data_service import data_service

logger = logging.getLogger(__name__)

# Configure Gemini once at import time
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


class Persona(str, Enum):
    FAN = "fan"
    STAFF = "staff"
    ACCESSIBILITY = "accessibility"
    TRANSPORT = "transport"
    VOLUNTEER = "volunteer"


PERSONA_PROMPTS = {
    Persona.FAN: """You are a warm, multilingual stadium concierge for Levi's Stadium (FIFA World Cup 2026). 
    Answer concisely in the user's language. Never invent facts. Cite specific zone names, gate numbers, or amenities.
    If you don't know, say so and suggest asking staff at the nearest info booth.""",

    Persona.STAFF: """You are an operations officer at Levi's Stadium. Be terse, operational, and prioritize: safety > flow > experience.
    Output JSON only. Include zone IDs, counts, and clear action items.""",

    Persona.ACCESSIBILITY: """You are an accessibility specialist at Levi's Stadium. Be patient, detailed, and sensory-aware.
    Include tactile/audio cues, step-free paths, sensory room locations, and rest stops every 100m.
    Address specific needs for wheelchair, sensory (autism), elderly, and blind/low-vision personas.""",

    Persona.TRANSPORT: """You are a transport advisor for Levi's Stadium. Be pragmatic and carbon-aware.
    Always give CO2 grams per option. Prioritize: transit/walk > rideshare EV > rideshare ICE > private car.
    CO2 factors per passenger-km: walk=0, rail=15g, bus=30g, rideshare_EV=50g, rideshare_ICE=180g, private_car=180g.""",

    Persona.VOLUNTEER: """You are a volunteer coordinator at Levi's Stadium. Be action-oriented and concise.
    Rank actions by urgency. Draft a one-sentence dispatch note for each action card.
    Match phases: PRE_MATCH (ingress), LIVE (game), HALFTIME (surge), POST_MATCH (egress)."""
}


class GeminiService:
    def __init__(self):
        self._model_name = settings.GEMINI_MODEL
        self._model = None  # lazy init after config
        self._venue_context = None
        self._zone_graph = None

    def _get_model(self):
        if self._model is None:
            if not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.strip() or settings.GEMINI_API_KEY.startswith("your_gemini"):
                logger.warning("GEMINI_API_KEY not set — using fallback responses")
                return None
            try:
                self._model = genai.GenerativeModel(self._model_name)
            except Exception as e:
                logger.error(f"Failed to create Gemini model: {e}")
                return None
        return self._model

    def _get_venue_context(self) -> Dict:
        if self._venue_context is None:
            self._venue_context = data_service.get_venue_context()
        return self._venue_context

    def _get_zone_graph(self) -> ZoneGraph:
        if self._zone_graph is None:
            self._zone_graph = data_service.get_zone_graph()
        return self._zone_graph

    def _get_context_block(self, extra: Dict = None) -> str:
        ctx = {
            "venue": self._get_venue_context(),
            "timestamp": datetime.now().isoformat(),
            "match_phase": data_service.get_current_phase()
        }
        if extra:
            ctx.update(extra)
        return f"CONTEXT (JSON):\n{json.dumps(ctx, default=str)}\n\n---\n"

    async def _generate(self, persona: Persona, prompt: str, extra_context: Dict = None,
                        json_mode: bool = False) -> str:
        model = self._get_model()
        if model is None:
            return await self._fallback(persona, prompt)

        try:
            system_prompt = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS[Persona.FAN])
            context_block = self._get_context_block(extra_context)
            full_prompt = f"{system_prompt}\n\n{context_block}USER REQUEST:\n{prompt}"

            if json_mode:
                full_prompt += "\n\nRespond with valid JSON only. No markdown code blocks."

            generation_config = genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=2048,
            )

            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: model.generate_content(
                    full_prompt,
                    generation_config=generation_config
                )
            )

            return response.text.strip()

        except Exception as e:
            logger.error(f"Gemini error ({persona}): {e}")
            return await self._fallback(persona, prompt)

    async def _generate_json(self, persona: Persona, prompt: str, extra_context: Dict = None) -> Dict:
        """Generate JSON response, with fallback parsing."""
        raw = await self._generate(persona, prompt, extra_context, json_mode=True)
        try:
            # Strip markdown code blocks if present
            text = raw.strip()
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            try:
                start = raw.find("{")
                end = raw.rfind("}") + 1
                if start >= 0 and end > start:
                    return json.loads(raw[start:end])
            except Exception:
                pass
            logger.warning(f"Could not parse JSON from Gemini response: {raw[:200]}")
            return {}

    async def _fallback(self, persona: Persona, prompt: str) -> str:
        fallbacks = {
            Persona.FAN: "I'm having trouble connecting. Please visit the nearest info booth at Gates A, B, C, or D for assistance.",
            Persona.STAFF: json.dumps({"error": "Gemini unavailable", "fallback": True, "actions": ["Monitor zones manually", "Use radio for updates"]}),
            Persona.ACCESSIBILITY: "Accessibility routing is temporarily unavailable. All gates and concourses are step-free. Sensory rooms at North and East Concourses. Ask any staff in yellow vests.",
            Persona.TRANSPORT: json.dumps({"options": [{"mode": "rail", "description": "VTA Light Rail to Great America Station", "co2_grams": 15, "duration_min": 30, "cost_usd": 8.50, "accessible": True}], "fallback": True}),
            Persona.VOLUNTEER: json.dumps({"actions": [{"id": "fallback_1", "title": "Check assigned zone", "description": "Please check your assigned zone for any irregular activity or crowd buildup.", "urgency": "high", "dispatch_note": "Report to zone supervisor", "zone": "UNASSIGNED", "phase": "PRE_MATCH", "estimated_duration_min": 60}], "summary": "Fallback mode", "priority_zones": []})
        }
        return fallbacks.get(persona, fallbacks[Persona.FAN])

    def _extract_citations(self, text: str) -> List[str]:
        citations = []
        keywords = [
            "Gate A", "Gate B", "Gate C", "Gate D",
            "North Concourse", "East Concourse", "South Concourse", "West Concourse",
            "Section 101", "Section 102", "Section 103", "Section 104",
            "Sensory Room", "Club Level", "Medical Station", "Medical Center"
        ]
        for kw in keywords:
            if kw.lower() in text.lower():
                citations.append(kw)
        return citations

    def _suggest_actions(self, message: str) -> List[str]:
        actions = []
        msg = message.lower()
        if any(w in msg for w in ["seat", "section", "where"]):
            actions.append("Get directions to seat")
        if any(w in msg for w in ["food", "concession", "eat", "drink"]):
            actions.append("Find nearest concessions")
        if any(w in msg for w in ["restroom", "toilet", "bathroom"]):
            actions.append("Locate accessible restroom")
        if any(w in msg for w in ["transport", "transit", "train", "bus", "uber", "lyft"]):
            actions.append("Show transport options")
        if any(w in msg for w in ["wheelchair", "accessibility", "disabled"]):
            actions.append("Get accessible routing")
        return actions

    # ==================== FAN ASSISTANT ====================
    async def fan_chat(self, message: str, language: Language,
                       session_history: List[Dict] = None) -> Dict:
        lang_names = {
            Language.EN: "English", Language.ES: "Spanish", Language.FR: "French",
            Language.AR: "Arabic", Language.PT: "Portuguese", Language.ZH: "Chinese"
        }

        history_str = ""
        if session_history:
            history_str = "Previous conversation:\n" + "\n".join(
                [f"{m['role']}: {m['content']}" for m in (session_history or [])[-4:]]
            ) + "\n\n"

        prompt = f"Language: {lang_names.get(language, 'English')}\n{history_str}User: {message}"

        response = await self._generate(Persona.FAN, prompt)

        return {
            "response": response,
            "language": language,
            "citations": self._extract_citations(response),
            "suggested_actions": self._suggest_actions(message)
        }

    # ==================== CROWD INTELLIGENCE ====================
    async def summarize_crowd(self, snapshot: CrowdSnapshot) -> Dict:
        prompt = f"""Current stadium occupancy: {snapshot.overall_pct:.1f}% ({snapshot.total_occupancy}/{snapshot.total_capacity})
Phase: {snapshot.phase.value}

Zone breakdown:
{json.dumps([{"zone": z.zone_id, "name": z.name, "pct": round(z.pct, 1), "trend": z.trend} for z in snapshot.zones], indent=2)}

Provide JSON with:
- summary: 2-sentence operational overview
- alerts: array of {{zone, level, message}} for zones >80% or rising fast
- recommended_actions: array of strings for staff"""

        result = await self._generate_json(Persona.STAFF, prompt)

        if not result or "summary" not in result:
            result = await self._fallback_crowd(snapshot)

        return result

    async def _fallback_crowd(self, snapshot: CrowdSnapshot) -> Dict:
        alerts = []
        for z in snapshot.zones:
            if z.pct >= 90:
                alerts.append({"zone": z.zone_id, "level": "critical", "message": f"{z.name} at {z.pct:.0f}% — evacuate to adjacent zones"})
            elif z.pct >= 80:
                alerts.append({"zone": z.zone_id, "level": "warning", "message": f"{z.name} at {z.pct:.0f}% — deploy crowd control"})
            elif z.pct >= 70 and z.trend == "rising":
                alerts.append({"zone": z.zone_id, "level": "watch", "message": f"{z.name} rising to {z.pct:.0f}%"})

        return {
            "summary": f"Stadium at {snapshot.overall_pct:.1f}% capacity during {snapshot.phase.value}. {len(alerts)} zones need attention.",
            "alerts": alerts,
            "recommended_actions": [
                "Deploy staff to warning/critical zones",
                "Open overflow concourse routes",
                "Update digital signage with wait times"
            ]
        }

    # ==================== SMART NAVIGATION ====================
    async def get_route(self, from_zone: str, to_zone: str,
                        persona: Optional[AccessibilityPersona],
                        live_density: Dict[str, float]) -> Dict:
        zone_graph = self._get_zone_graph()

        zones_info = "\n".join([
            f"- {n.zone_id} ({n.name}): {live_density.get(n.zone_id, 0):.0f}% full, accessible={n.accessible}"
            for n in zone_graph.nodes
        ])

        edges_info = [
            {"from": e.from_zone, "to": e.to_zone, "dist_m": e.distance_m, "accessible": e.accessible}
            for e in zone_graph.edges
        ]

        persona_context = ""
        if persona == AccessibilityPersona.WHEELCHAIR:
            persona_context = "User needs step-free, wide paths. Avoid stairs. Prefer elevators. Cite ramp/elevator locations."
        elif persona == AccessibilityPersona.SENSORY:
            persona_context = "User needs low-stimulation route. Avoid loud concourses. Route via sensory rooms. Predictable paths."
        elif persona == AccessibilityPersona.ELDERLY:
            persona_context = "User needs minimal walking, flat paths, seating every 100m. Shortest accessible route."
        elif persona == AccessibilityPersona.BLIND_LOW_VISION:
            persona_context = "User needs landmark-based instructions, tactile paving hints, audio cues. NaviLens-style."

        prompt = f"""Find route from {from_zone} to {to_zone}.

Zone graph (nodes + live occupancy):
{zones_info}

Edges (all paths):
{json.dumps(edges_info, indent=2)}

{persona_context}

Return JSON with ordered waypoints. Each waypoint has: zone_id (string), name (string), instruction (string), distance_m (integer), accessible (boolean), landmarks (array of strings).
Also include total_distance_m (integer), estimated_time_min (integer), congestion_warnings (array of strings)."""

        result = await self._generate_json(Persona.STAFF, prompt)

        if not result or "waypoints" not in result:
            return self._fallback_route(from_zone, to_zone, live_density)

        # Normalize types
        waypoints = []
        for wp in result.get("waypoints", []):
            waypoints.append({
                "zone_id": str(wp.get("zone_id", "")),
                "name": str(wp.get("name", "")),
                "instruction": str(wp.get("instruction", "")),
                "distance_m": int(wp.get("distance_m", 0)),
                "accessible": bool(wp.get("accessible", True)),
                "landmarks": wp.get("landmarks", [])
            })

        return {
            "waypoints": waypoints,
            "total_distance_m": int(result.get("total_distance_m", 0)),
            "estimated_time_min": int(result.get("estimated_time_min", 0)),
            "congestion_warnings": result.get("congestion_warnings", [])
        }

    def _fallback_route(self, from_zone: str, to_zone: str, density: Dict) -> Dict:
        zone_graph = self._get_zone_graph()
        if zone_graph:
            for e in zone_graph.edges:
                if e.from_zone == from_zone and e.to_zone == to_zone:
                    # Find node names
                    from_name = next((n.name for n in zone_graph.nodes if n.zone_id == from_zone), from_zone)
                    to_name = next((n.name for n in zone_graph.nodes if n.zone_id == to_zone), to_zone)
                    return {
                        "waypoints": [
                            {"zone_id": from_zone, "name": from_name, "instruction": f"Start at {from_name}", "distance_m": 0, "accessible": True, "landmarks": []},
                            {"zone_id": to_zone, "name": to_name, "instruction": f"Proceed to {to_name}", "distance_m": e.distance_m, "accessible": e.accessible, "landmarks": []}
                        ],
                        "total_distance_m": e.distance_m,
                        "estimated_time_min": max(1, int(e.distance_m / 50)),
                        "congestion_warnings": []
                    }
        return {
            "waypoints": [
                {"zone_id": from_zone, "name": from_zone, "instruction": f"Start at {from_zone}", "distance_m": 0, "accessible": True, "landmarks": []},
                {"zone_id": to_zone, "name": to_zone, "instruction": f"Proceed to {to_zone}", "distance_m": 200, "accessible": True, "landmarks": []}
            ],
            "total_distance_m": 200,
            "estimated_time_min": 4,
            "congestion_warnings": ["Route estimated — live data unavailable"]
        }

    # ==================== ACCESSIBILITY ====================
    async def accessibility_route(self, from_zone: str, to_zone: str,
                                   persona: AccessibilityPersona, needs: List[str]) -> Dict:
        base_route = await self.get_route(from_zone, to_zone, persona, {})

        prompt = f"""Enhance this route for {persona.value} persona:
Base route waypoints: {json.dumps(base_route.get('waypoints', []))}

Specific needs: {needs}

Add accessibility enhancements as JSON with:
- accommodations: [list of specific accommodations provided]
- sensory_notes: [list of sensory warnings and quiet zones]
- staff_assist_points: [where yellow-vest staff can be found]
- tactile_guidance: [tactile paving and handrail locations]
- audio_cues: [NaviLens codes, announcements, beacons]
- rest_stops: [bench/rest locations every 100m]
- sensory_warnings: [loud areas, bright lights, crowds to avoid]"""

        enhancements = await self._generate_json(Persona.ACCESSIBILITY, prompt)

        if not enhancements:
            enhancements = {
                "accommodations": ["Step-free path confirmed", "Elevator available at North Concourse"],
                "sensory_notes": ["Avoid peak concourse times (gates open, halftime)"],
                "staff_assist_points": ["Info booths at Gates A, B, C, D", "Yellow-vest staff every 50m"],
                "tactile_guidance": ["Tactile paving at all crossings", "Handrails on all ramps"],
                "audio_cues": ["NaviLens codes at decision points", "Audible announcements at gates"],
                "rest_stops": ["Benches every 100m along route", "Wide areas at concourse junctions"],
                "sensory_warnings": ["Concourse N loud during peak times", "Bright lights at Gate A entrance"]
            }

        return {**base_route, **enhancements}

    # ==================== TRANSPORT ====================
    async def transport_options(self, from_loc: str, to_loc: str,
                                 prefer_sustainable: bool, wheelchair: bool) -> Dict:
        # Distances from Levi's Stadium
        distance_km_map = {
            "downtown san jose": 8,
            "san jose": 8,
            "sfo": 48,
            "san francisco": 55,
            "oakland": 50,
            "downtown sf": 55,
        }
        to_lower = to_loc.lower()
        distance_km = 15  # default
        for key, dist in distance_km_map.items():
            if key in to_lower:
                distance_km = dist
                break

        co2_factors = {
            TransportMode.WALK: 0,
            TransportMode.RAIL: 15,
            TransportMode.BUS: 30,
            TransportMode.RIDESHARE_EV: 50,
            TransportMode.RIDESHARE_ICE: 180,
            TransportMode.PRIVATE_CAR: 180
        }

        base_options = [
            {"mode": TransportMode.RAIL, "desc": "VTA Light Rail Green Line to Diridon, then Caltrain/BART", "time": 45, "cost": 8.50, "accessible": True},
            {"mode": TransportMode.BUS, "desc": "VTA Route 57 + Express to transit center", "time": 55, "cost": 3.00, "accessible": True},
            {"mode": TransportMode.RIDESHARE_EV, "desc": "Uber Green / Lyft Green Mode (EV)", "time": 25, "cost": 35.00, "accessible": True},
            {"mode": TransportMode.RIDESHARE_ICE, "desc": "Standard Uber/Lyft", "time": 25, "cost": 28.00, "accessible": False},
            {"mode": TransportMode.PRIVATE_CAR, "desc": "Drive and park at stadium (pre-booked)", "time": 30, "cost": 50.00, "accessible": False}
        ]

        options = []
        for opt in base_options:
            if wheelchair and not opt["accessible"]:
                continue
            co2 = int(co2_factors[opt["mode"]] * distance_km)
            options.append({
                "mode": opt["mode"].value,
                "duration_min": opt["time"],
                "cost_usd": opt["cost"],
                "co2_grams": co2,
                "description": opt["desc"],
                "steps": [opt["desc"]],
                "real_time": False,
                "accessible": opt["accessible"]
            })

        if prefer_sustainable:
            options.sort(key=lambda x: x["co2_grams"])
        else:
            options.sort(key=lambda x: x["duration_min"])

        recommended = options[0]["mode"] if options else "rail"
        total_saved = max(0, options[-1]["co2_grams"] - options[0]["co2_grams"]) if len(options) > 1 else 0

        return {
            "options": options,
            "recommended": recommended,
            "total_co2_saved_grams": total_saved
        }

    # ==================== VOLUNTEER ====================
    async def volunteer_actions(self, role: str, zone: str,
                                 phase: MatchPhase, crowd_snapshot: CrowdSnapshot) -> Dict:
        high_zones = [z.zone_id for z in crowd_snapshot.zones if z.pct > 80]
        rising_zones = [z.zone_id for z in crowd_snapshot.zones if z.trend == "rising" and z.pct > 60]

        prompt = f"""Volunteer role: {role}
Current zone: {zone}
Match phase: {phase.value}
Crowd context: {crowd_snapshot.overall_pct:.1f}% overall
High occupancy zones (>80%): {high_zones}
Rising zones: {rising_zones}

Generate 3-5 prioritized action cards as JSON with:
- actions: array of {{id, title, description, urgency (high/medium/low), zone, phase, dispatch_note, estimated_duration_min}}
- summary: one sentence overview
- priority_zones: array of zone_ids needing attention"""

        result = await self._generate_json(Persona.VOLUNTEER, prompt)

        if not result or "actions" not in result:
            result = self._fallback_volunteer(role, zone, phase, high_zones)

        # Ensure priority_zones exists
        if "priority_zones" not in result:
            result["priority_zones"] = high_zones

        return result

    def _fallback_volunteer(self, role: str, zone: str, phase: MatchPhase, high_zones: List[str]) -> Dict:
        actions_map = {
            MatchPhase.PRE_MATCH: [
                {"id": "v1", "title": "Gate ingress support", "description": "Assist fans at entry gates with ticket scanning and directions", "urgency": "high", "zone": zone, "phase": phase.value, "dispatch_note": "Report to gate supervisor for queue management", "estimated_duration_min": 60},
                {"id": "v2", "title": "Accessibility escort", "description": "Assist wheelchair users and families to accessible seating", "urgency": "medium", "zone": "GATE_A", "phase": phase.value, "dispatch_note": "Station at Gate A accessible entrance", "estimated_duration_min": 90}
            ],
            MatchPhase.LIVE: [
                {"id": "v3", "title": "Concourse patrol", "description": "Monitor crowd flow and assist lost fans", "urgency": "medium", "zone": zone, "phase": phase.value, "dispatch_note": "Walk assigned concourse every 15 minutes", "estimated_duration_min": 45},
                {"id": "v4", "title": "Concession queue management", "description": "Manage queues at busy concession stands", "urgency": "low", "zone": "CONCOURSE_N", "phase": phase.value, "dispatch_note": "Deploy to North Concourse concessions", "estimated_duration_min": 30}
            ],
            MatchPhase.HALFTIME: [
                {"id": "v5", "title": "Halftime surge management", "description": "Direct fans to restrooms, concessions, and smoking areas", "urgency": "high", "zone": high_zones[0] if high_zones else zone, "phase": phase.value, "dispatch_note": "Deploy to busiest concourse for 15-min surge", "estimated_duration_min": 15},
                {"id": "v6", "title": "Restroom queue control", "description": "Manage restroom queues to prevent bottlenecks", "urgency": "high", "zone": "CONCOURSE_N", "phase": phase.value, "dispatch_note": "Station at North Concourse restrooms", "estimated_duration_min": 20}
            ],
            MatchPhase.POST_MATCH: [
                {"id": "v7", "title": "Egress direction", "description": "Guide fans to nearest exits and transit connections", "urgency": "high", "zone": zone, "phase": phase.value, "dispatch_note": "Position at assigned gate for post-match egress", "estimated_duration_min": 90},
                {"id": "v8", "title": "Transit coordination", "description": "Direct fans to VTA Light Rail and bus connections", "urgency": "medium", "zone": "GATE_A", "phase": phase.value, "dispatch_note": "Station near Gate A transit walkway", "estimated_duration_min": 60}
            ]
        }
        actions = actions_map.get(phase, actions_map[MatchPhase.PRE_MATCH])
        return {
            "actions": actions,
            "summary": f"{len(actions)} priority actions for {phase.value} phase",
            "priority_zones": high_zones[:3]
        }

    # ==================== INCIDENT ====================
    async def triage_incident(self, incident_type: str, severity: str,
                               zone: str, description: str) -> Dict:
        prompt = f"""Triage incident:
Type: {incident_type}
Severity: {severity}
Zone: {zone}
Description: {description}

Return JSON with:
- incident_id (format: INC-HHMMSS)
- priority (1-5, 5=highest)
- recommended_actions (array of strings)
- dispatch_note (one sentence)
- estimated_response_time_min (integer)
- escalation_required (boolean)
- assigned_staff (array of role strings like "Security", "Medical")"""

        result = await self._generate_json(Persona.STAFF, prompt)

        if not result or "incident_id" not in result:
            sev_priority = {"critical": 5, "high": 4, "medium": 3, "low": 2}
            sev_time = {"critical": 2, "high": 4, "medium": 8, "low": 15}
            priority = sev_priority.get(severity, 3)
            result = {
                "incident_id": f"INC-{datetime.now().strftime('%H%M%S')}",
                "priority": priority,
                "triage_level": priority,
                "recommended_actions": ["Assess scene", "Dispatch response team", "Secure area", "Update incident log"],
                "dispatch_note": f"{severity.upper()} {incident_type} at {zone} — dispatch response team immediately",
                "estimated_response_time_min": sev_time.get(severity, 8),
                "estimated_response_min": sev_time.get(severity, 8),
                "escalation_required": severity in ["high", "critical"],
                "assigned_staff": ["Security", "Medical"] if severity in ["high", "critical"] else ["Security"]
            }

        # Ensure all required fields exist
        result.setdefault("triage_level", result.get("priority", 3))
        result.setdefault("estimated_response_min", result.get("estimated_response_time_min", 5))
        result.setdefault("assigned_staff", ["Security"])
        result.setdefault("escalation_required", False)

        return result


gemini_service = GeminiService()