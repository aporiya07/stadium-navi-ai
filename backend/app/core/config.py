from pydantic_settings import BaseSettings
from typing import Optional, List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Stadium Copilot"
    DEBUG: bool = True

    # Gemini API
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "*"]

    # WebSocket / Crowd
    WS_HEARTBEAT_INTERVAL: int = 30
    ZONE_UPDATE_INTERVAL: int = 3
    CROWD_UPDATE_INTERVAL: int = 3  # alias used in main.py

    # Data paths
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "data")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()