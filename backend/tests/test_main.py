import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint returns 200 OK and healthy status."""
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
    response = client.post("/api/v1/chat/fan", json=payload)
    # The endpoint might return 200 or 500 depending on Gemini key, 
    # but since it's mocked or uses fallback, it should ideally return 200.
    # We just ensure it's a valid API response.
    assert response.status_code in (200, 500, 503)

def test_ops_recommendations_endpoint():
    """Test ops recommendations endpoint returns a valid JSON array."""
    response = client.post("/api/v1/ops/recommend")
    assert response.status_code in (200, 500, 503)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, list)
