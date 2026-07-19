# Stadium Copilot — FIFA World Cup 2026

**GenAI-powered operations & fan experience for Levi's Stadium (San Francisco Bay Area)**

## Live Demo
[https://stadium-copilot.vercel.app](https://stadium-copilot.vercel.app)

## Features
- 🌍 Multilingual Fan Assistant (EN/ES/FR/AR/PT/ZH)
- 📊 Real-time Crowd Intelligence (WebSocket, 12 zones)
- 🗺️ Smart Navigation avoiding congestion
- ♿ Accessibility Concierge (wheelchair, sensory, elderly, low-vision)
- 🚌 Transport + CO₂ Advisor (transit/rideshare/walk)
- 👥 Volunteer Ops Copilot (phase-aware action cards)
- 🚨 Incident Triage

## Architecture
React + FastAPI + Gemini 2.0 Flash + WebSocket live feed

## Run Locally
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Add GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Judges: Mapping to Challenge Areas
| Area | Module |
|------|--------|
| Navigation | Smart Navigation + Accessibility routing |
| Crowd Management | Crowd Intelligence + Predictive alerts |
| Accessibility | Accessibility Concierge (FIFA Sensory Inclusive aligned) |
| Transportation | Transport/Sustainability Advisor |
| Sustainability | CO₂-aware recommendations (87.8% fan travel emissions) |
| Multilingual | 6-language fan chat |
| Operational Intelligence | Ops Dashboard + Volunteer Copilot |
| Real-time Decision Support | Live WebSocket + Gemini summaries |

## Demo Script (60 Seconds)
1. **Landing** — ViewSwitcher toggles Fan ↔ Ops (show motion)
2. **Fan View** — Chat "¿Dónde está la puerta A?" → Spanish response with zone
3. **Fan View** — Wayfinding: "Section 101, wheelchair route" → map highlights accessible path avoiding 85% zones
4. **Fan View** — Transport: "Levi's Stadium to SFO" → 3 options with CO₂ grams
5. **Ops View** — Live heatmap pulsing, alert toast "Concourse N 87% — deploy staff"
6. **Ops View** — Volunteer Copilot: HALFTIME phase → 3 action cards with dispatch notes
7. **Close** — "One Gemini core, two personas, six modules, one flagship stadium. Deployed."