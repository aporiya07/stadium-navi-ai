"""
Crowd and AI Inference API Endpoints

This module defines all endpoints related to the Stadium Copilot's crowd simulation
and AI integration, including fan chat, accessible routing, crowd insights, and volunteer assignment.
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any
import asyncio
import json
from datetime import datetime
import logging

from app.models.schemas import (
    ChatRequest, ChatResponse, Language,
    NavigationRequest, NavigationResponse,
    AccessibilityRequest, AccessibilityResponse,
    TransportRequest, TransportResponse,
    VolunteerRequest, VolunteerResponse,
    IncidentRequest, IncidentResponse,
    HealthResponse, CrowdSnapshot,
    IncidentSeverity, MatchPhase
)
from app.services.gemini_service import gemini_service
from app.services.crowd_simulator import crowd_simulator
from app.services.data_service import data_service

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "gemini": "connected" if gemini_service._get_model() else "fallback_mode",
            "crowd_sim": "running" if crowd_simulator.running else "stopped"
        }
    )


# ==================== FAN ASSISTANT ====================

@router.post("/assistant/chat", response_model=ChatResponse)
async def chat_assistant(request: ChatRequest):
    """Multilingual fan assistant with RAG over venue facts."""
    try:
        session_id = (request.context or {}).get("session_id", f"session_{datetime.now().timestamp():.0f}")
        history = (request.context or {}).get("history", [])
        response = await gemini_service.fan_chat(
            message=request.message,
            language=request.language,
            session_history=history
        )
        return ChatResponse(
            response=response["response"],
            language=request.language,
            session_id=session_id,
            citations=response.get("citations", []),
            suggested_actions=response.get("suggested_actions", [])
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NAVIGATION ====================

@router.post("/navigate", response_model=NavigationResponse)
async def navigate(request: NavigationRequest):
    """Smart navigation avoiding congestion with accessibility support."""
    try:
        live_density = crowd_simulator.get_live_density()
        response = await gemini_service.get_route(
            from_zone=request.from_zone,
            to_zone=request.to_zone,
            persona=request.persona,
            live_density=live_density
        )
        return NavigationResponse(**response)
    except Exception as e:
        logger.error(f"Navigation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ACCESSIBILITY ====================

@router.post("/accessibility/route", response_model=AccessibilityResponse)
async def accessibility_route(request: AccessibilityRequest):
    """Persona-aware accessible routing with sensory/physical accommodations."""
    try:
        response = await gemini_service.accessibility_route(
            from_zone=request.from_zone,
            to_zone=request.to_zone,
            persona=request.persona,
            needs=request.needs
        )
        # Build NavigationResponse from route fields
        route_data = {
            "waypoints": response.get("waypoints", []),
            "total_distance_m": response.get("total_distance_m", 0),
            "estimated_time_min": response.get("estimated_time_min", 0),
            "congestion_warnings": response.get("congestion_warnings", [])
        }
        return AccessibilityResponse(
            route=NavigationResponse(**route_data),
            accommodations=response.get("accommodations", []),
            sensory_notes=response.get("sensory_notes", []),
            staff_assist_points=response.get("staff_assist_points", []),
            tactile_guidance=response.get("tactile_guidance", []),
            audio_cues=response.get("audio_cues", []),
            rest_stops=response.get("rest_stops", []),
            sensory_warnings=response.get("sensory_warnings", [])
        )
    except Exception as e:
        logger.error(f"Accessibility error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TRANSPORT ====================

@router.post("/transport/options", response_model=TransportResponse)
async def transport_options(request: TransportRequest):
    """Sustainable transport options with CO2 estimates."""
    try:
        response = await gemini_service.transport_options(
            from_loc=request.from_location,
            to_loc=request.to_location,
            prefer_sustainable=request.prefer_sustainable,
            wheelchair=request.wheelchair_accessible
        )
        return TransportResponse(**response)
    except Exception as e:
        logger.error(f"Transport error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== VOLUNTEER ====================

@router.post("/volunteer/actions", response_model=VolunteerResponse)
async def volunteer_actions(request: VolunteerRequest):
    """Phase-aware volunteer action cards with crowd context."""
    try:
        crowd_snapshot = crowd_simulator.get_snapshot()
        response = await gemini_service.volunteer_actions(
            role=request.role,
            zone=request.volunteer_zone or "UNASSIGNED",
            phase=request.phase,
            crowd_snapshot=crowd_snapshot
        )
        return VolunteerResponse(**response)
    except Exception as e:
        logger.error(f"Volunteer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== INCIDENT ====================

@router.post("/incident/triage", response_model=IncidentResponse)
async def triage_incident(request: IncidentRequest):
    """Incident triage with priority and dispatch note generation."""
    try:
        response = await gemini_service.triage_incident(
            incident_type=request.type,
            severity=request.severity.value,
            zone=request.zone_id,
            description=request.description
        )
        return IncidentResponse(**response)
    except Exception as e:
        logger.error(f"Incident error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CROWD ====================

@router.get("/crowd/snapshot", response_model=CrowdSnapshot)
async def crowd_snapshot():
    """Get current crowd snapshot."""
    return crowd_simulator.get_snapshot()


@router.get("/crowd/summary")
async def crowd_summary():
    """Get Gemini-powered crowd intelligence summary."""
    try:
        return await crowd_simulator.get_gemini_summary()
    except Exception as e:
        logger.error(f"Summary error: {e}")
        return {"summary": "Crowd data processing...", "alerts": [], "recommended_actions": []}


@router.post("/crowd/phase")
async def set_phase(phase: str):
    """Set match phase (for demo/testing)."""
    try:
        phase_enum = MatchPhase(phase)
        crowd_simulator.set_phase(phase_enum)
        return {"status": "ok", "phase": phase}
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid phase: {phase}. Valid: {[p.value for p in MatchPhase]}")


# ==================== DATA ====================

@router.get("/data/venues")
async def get_venues():
    return data_service.get_all_venues()


@router.get("/data/zones")
async def get_zones():
    return data_service.get_all_zones()


@router.get("/data/zone-graph")
async def get_zone_graph():
    graph = data_service.get_zone_graph_flat()
    return graph.model_dump() if graph else {"nodes": [], "edges": []}


@router.get("/data/schedules")
async def get_schedules():
    return data_service.get_schedules()


# ==================== WEBSOCKET ====================

@router.websocket("/ws/live")
async def websocket_live_feed(websocket: WebSocket):
    """WebSocket for live crowd updates."""
    await websocket.accept()
    queue = crowd_simulator.subscribe()

    try:
        # Send initial snapshot
        snapshot = crowd_simulator.get_snapshot()
        await websocket.send_json({
            "type": "initial_snapshot",
            "data": snapshot.model_dump(mode="json"),
            "timestamp": datetime.now().isoformat()
        })

        # Stream updates
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=30.0)
                await websocket.send_json(message)
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({"type": "heartbeat", "timestamp": datetime.now().isoformat()})

    except WebSocketDisconnect:
        crowd_simulator.unsubscribe(queue)
    except Exception as e:
        crowd_simulator.unsubscribe(queue)
        logger.error(f"WebSocket error: {e}")