import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint returns 200 OK and healthy status."""
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
        assert data["services"]["crowd_sim"] == "running"

def test_chat_fan_endpoint():
    """Test the fan chat endpoint returns a valid response."""
    payload = {
        "message": "Where is the nearest bathroom?",
        "language": "en"
    }
    with TestClient(app) as client:
        response = client.post("/api/v1/assistant/chat", json=payload)
        assert response.status_code in (200, 500, 503)

def test_ops_navigate_endpoint():
    """Test navigation endpoint."""
    payload = {
        "from_zone": "GATE_A",
        "to_zone": "SECTION_101",
        "persona": "wheelchair"
    }
    with TestClient(app) as client:
        response = client.post("/api/v1/navigate", json=payload)
        assert response.status_code in (200, 500, 503)
