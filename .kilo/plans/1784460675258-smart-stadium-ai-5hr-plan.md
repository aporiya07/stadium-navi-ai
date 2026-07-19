# Smart Stadium AI — 5-Hour Implementation Plan
**Challenge 4: Smart Stadiums & Tournament Operations (FIFA World Cup 2026)**  
**Stack:** Python/FastAPI + React/Vite + Tailwind + Gemini API  
**Deadline:** 5 hours from now  

---

## 🎯 Goal: Ship ONE polished flagship stadium demo (not breadth)

**Flagship Venue:** Levi's Stadium (San Francisco Bay Area) — official FIFA 2026 host, strong accessibility credentials, good transit data available.

---

## 📋 Final Feature Scope (Locked for 5 Hours)

| Module | Fan View | Ops Dashboard | GenAI Role |
|--------|----------|---------------|------------|
| **1. Multilingual Fan Assistant** | ✅ Chat widget (EN/ES/FR/AR/PT/ZH) | — | RAG over venue facts + Gemini 2.0 Flash |
| **2. Crowd Intelligence** | — | ✅ Live zone heatmap + WebSocket feed | Gemini summarizes occupancy → risk alerts |
| **3. Smart Navigation** | ✅ Route to seat/gate/amenity avoiding congestion | — | Gemini reasons over zone graph + live density |
| **4. Accessibility Concierge** | ✅ Wheelchair/sensory/elderly personas + NaviLens-style routing | ✅ Staff assist alerts | Persona-aware Gemini prompts |
| **5. Transport/Sustainability** | ✅ Transit/rideshare/walk + CO₂ estimate | — | Gemini synthesizes GTFS + carbon factors |
| **6. Volunteer Ops Copilot** | — | ✅ Match-phase action cards + incident triage | Gemini prioritizes + drafts dispatch notes |

**Stretch (only if <30 min left):** Second stadium data file + voice input toggle.

---

## 🏗️ Architecture (Locked — No Changes)

```
┌─────────────────────────────────────────────────────────────┐
│  React + Vite + TypeScript + Tailwind + Framer Motion      │
│  Single SPA with animated ViewSwitcher (Fan ↔ Ops)         │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST + WebSocket (/ws/live)
┌─────────────────────────▼───────────────────────────────────┐
│  FastAPI (Python 3.11)                                      │
│  /assistant  /crowd  /navigate  /accessibility               │
│  /transport  /volunteer  /incident  /ws/live                 │
│                                                             │
│  gemini_service.py  — single entry point, persona routing  │
│  data_service.py    — venues/zones/schedules + simulator    │
│  crowd_simulator.py — background task, WebSocket broadcaster│
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   Gemini API (google-genai)          SQLite / JSON files
   gemini-2.0-flash                    venues.json, zones.json
   JSON mode for structured out        schedules.json
```

---

## 🗂️ Repo Structure (Create Exactly This)

```
smart-stadium-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── assistant.py
│   │   │   ├── crowd.py
│   │   │   ├── navigation.py
│   │   │   ├── accessibility.py
│   │   │   ├── transport.py
│   │   │   ├── volunteer.py
│   │   │   └── incident.py
│   │   ├── services/
│   │   │   ├── gemini_service.py
│   │   │   ├── data_service.py
│   │   │   └── crowd_simulator.py
│   │   ├── core/config.py
│   │   ├── models/schemas.py
│   │   └── main.py
│   ├── data/
│   │   ├── venues.json
│   │   ├── zones.json
│   │   └── schedules.json
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── FanView/
│   │   │   │   ├── ChatWidget.tsx
│   │   │   │   ├── WayfindingPanel.tsx
│   │   │   │   ├── AccessibilityPanel.tsx
│   │   │   │   └── TransportPanel.tsx
│   │   │   └── OpsDashboard/
│   │   │       ├── ZoneMap.tsx
│   │   │       ├── OccupancyBars.tsx
│   │   │       ├── AlertFeed.tsx
│   │   │       └── ActionCards.tsx
│   │   ├── components/
│   │   │   ├── ViewSwitcher.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── ZoneCard.tsx
│   │   │   └── Toast.tsx
│   │   ├── hooks/
│   │   │   ├── useLiveFeed.ts
│   │   │   └── useApi.ts
│   │   ├── lib/
│   │   │   ├── theme.ts
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
├── .env.example
├── README.md
└── docker-compose.yml (optional, for single-command deploy)
```

---

## ⚡ 5-Hour Execution Timeline

| Time | Phase | Deliverable | Notes |
|------|-------|-------------|-------|
| **0:00–0:30** | **Scaffold** | Repo init, FastAPI + Vite/React/TS, Tailwind config, `ViewSwitcher` shell, `.env` with Gemini key | Run `bash scripts/init-artifact.sh smart-stadium-ai` (from artifacts-builder) then adapt |
| **0:30–1:15** | **Data + Simulator** | `venues.json` (Levi's), `zones.json` (12 zones), `schedules.json` (match timeline), `crowd_simulator.py` broadcasting WebSocket every 3s | Use realistic zone caps: 68,500 total; zones: gates, concourses, seats, clubs, sensory rooms |
| **1:15–2:15** | **Gemini Service + Crowd Endpoint** | `gemini_service.py` (persona routing, JSON mode, guardrails, fallback), `/crowd` REST + `/ws/live` WebSocket, `ZoneMap` + `OccupancyBars` + `AlertToast` wired with Framer Motion | **Critical path** — proves end-to-end live data |
| **2:15–3:15** | **Fan Assistant + Navigation** | `/assistant` (RAG over venue facts, multilingual), `/navigate` (zone graph + live density), `ChatWidget`, `WayfindingPanel` | Reuse same Gemini call pattern; cache venue facts in memory |
| **3:15–4:00** | **Accessibility + Transport** | `/accessibility` (persona prompts), `/transport` (GTFS-lite + CO₂), `AccessibilityPanel`, `TransportPanel` | NaviLens-style high-contrast routes; CO₂ factors: car=180g, bus=30g, rail=15g, walk=0 |
| **4:00–4:45** | **Ops Dashboard + Volunteer Copilot** | `/volunteer` (match-phase + crowd context → action cards), `/incident` (triage), `AlertFeed`, `ActionCards` | Phase enum: PRE_MATCH, LIVE, HALFTIME, POST_MATCH |
| **4:45–5:00** | **Polish & Deploy** | Motion polish (staggered entrance, hover lift, toast slide), README, `docker-compose up -d` or dual deploy (Render + Vercel), record 60-sec demo video | **Ship the link** |

---

## 🔑 Critical Implementation Details

### Gemini Service (`gemini_service.py`) — Single Source of Truth
```python
# Persona system prompts
PERSONAS = {
    "fan": "Warm, concise, multilingual. Never invent facts. Cite zone names.",
    "staff": "Terse, operational. Priority: safety > flow > experience. Output JSON.",
    "accessibility": "Patient, detailed, sensory-aware. Include tactile/audio cues.",
    "transport": "Pragmatic, carbon-aware. Give CO₂ grams per option.",
    "volunteer": "Action-oriented. Rank actions by urgency. Draft dispatch note."
}

# Grounding: inject structured context (zones, occupancy, schedule) into every call
# Structured output: response_schema for JSON-mode endpoints
# Guardrails: strip prompt injections, validate schema, fallback to rule-based
```

### Crowd Simulator — Realistic, Zero-Config
- 12 zones with capacity, type (gate/concourse/seating/club/sensory/medical)
- Match timeline: gates open → kickoff → halftime → full-time → exit surge
- Per-zone occupancy follows sinusoidal + noise + phase multipliers
- Broadcasts `{zone_id, count, capacity, pct, trend, timestamp}` every 3s via WebSocket
- **No manual CSV upload** — fully autonomous for demo

### Zone Graph for Navigation
```json
{
  "nodes": ["GATE_A", "CONCOURSE_N", "SECTION_101", "SENSORY_ROOM", ...],
  "edges": [{"from": "GATE_A", "to": "CONCOURSE_N", "dist": 50, "accessible": true}, ...]
}
```
Gemini receives: target zone, current zone, live density per zone → returns ordered waypoints + plain-language instructions.

### Accessibility Personas (from FIFA 2026 Playbook)
| Persona | Needs | Routing Adjustments |
|---------|-------|---------------------|
| Wheelchair | Step-free, wide paths, accessible toilets | Avoid stairs, prefer elevators, wider corridors |
| Sensory (autism) | Low-stimulation, quiet zones, predictable | Route via sensory rooms, avoid loud concourses |
| Elderly | Minimal walking, seating rests, clear signage | Shortest flat route, bench stops every 100m |
| Blind/Low-vision | NaviLens-style audio/tactile, high contrast | Landmark-based instructions, tactile paving hints |

### Sustainability CO₂ Factors (per passenger-km)
- Walk: 0 g
- Rail/Metro: 15 g
- Bus/BRT: 30 g
- Rideshare (EV): 50 g
- Rideshare (ICE): 180 g
- Private car: 180 g

---

## 🎨 Frontend Design Direction (from frontend-design skill)

**Aesthetic:** "Official Tournament Minimal" — clean, authoritative, high-contrast, motion with purpose.

- **Colors:** FIFA Blue `#004B87` (primary), Neutral `#F5F5F5` bg, Alert Red `#D32F2F`, Success Green `#2E7D32`, Warning Amber `#F57F17`
- **Typography:** `Inter` for UI, `Space Grotesk` for headings (distinctive, technical)
- **Motion:** Framer Motion — staggered entrance (80ms stagger), occupancy bars animate width, toast slides from top-right, view switch = 300ms cross-fade + scale
- **Map:** `react-leaflet` + custom zone polygons (GeoJSON from zones.json), color by occupancy % (green→amber→red)
- **Accessibility:** WCAG AA, focus rings, reduced-motion media query, high-contrast toggle

---

## 🔧 Commands to Run (Copy-Paste Ready)

```bash
# 1. Scaffold frontend (artifacts-builder)
bash scripts/init-artifact.sh smart-stadium-ai
cd smart-stadium-ai

# 2. Backend setup
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add GEMINI_API_KEY

# 3. Run both (two terminals)
# Terminal 1 - Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev

# 4. Deploy (when ready)
# Backend: render.com (Docker) | Frontend: vercel.com
# Or: docker-compose up -d (if Dockerfile added)
```

---

## 📦 requirements.txt (Backend)

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
pydantic==2.7.0
pydantic-settings==2.3.0
google-genai==0.8.0
websockets==12.0
python-dotenv==1.0.1
httpx==0.27.0
```

---

## 📦 package.json (Frontend Key Deps)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "framer-motion": "^11.0.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.0",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## ✅ Validation Checklist (Run Before Submit)

- [ ] `curl localhost:8000/health` → 200
- [ ] WebSocket connects, receives zone updates every ~3s
- [ ] Fan chat answers "Where is Gate A?" in Spanish
- [ ] Navigation returns route avoiding >80% zones
- [ ] Accessibility panel shows wheelchair route to sensory room
- [ ] Transport panel shows 3 options with CO₂ grams
- [ ] Ops dashboard shows live heatmap + alert toasts
- [ ] Volunteer copilot shows 3 prioritized actions for HALFTIME phase
- [ ] ViewSwitcher animates smoothly Fan ↔ Ops
- [ ] Deployed URL works end-to-end (no CORS errors)

---

## 🚨 Risk Mitigation (5-Hour Reality)

| Risk | Mitigation |
|------|------------|
| Gemini API latency / quota | Cache venue facts; call Gemini only on threshold cross; rule-based fallback in `gemini_service.py` |
| WebSocket drops in deploy | Frontend auto-reconnect with exponential backoff in `useLiveFeed.ts` |
| Map not rendering | Fallback to simple SVG zone grid (pre-built in `ZoneMap.tsx`) |
| Time overrun | **Hard stop at 4:45** — polish only, no new features |

---

## 📝 README.md Template (Fill at 4:45)

```markdown
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
- 🚨 Incident Triage (stretch)

## Architecture
React + FastAPI + Gemini 2.0 Flash + WebSocket live feed

## Run Locally
```bash
docker-compose up -d
# or: backend (port 8000) + frontend (port 5173)
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
```

---

## 🎬 Demo Script (60 Seconds)

1. **Landing** — ViewSwitcher toggles Fan ↔ Ops (show motion)
2. **Fan View** — Chat "¿Dónde está la puerta A?" → Spanish response with zone
3. **Fan View** — Wayfinding: "Section 101, wheelchair route" → map highlights accessible path avoiding 85% zones
4. **Fan View** — Transport: "Levi's Stadium to SFO" → 3 options with CO₂ grams
5. **Ops View** — Live heatmap pulsing, alert toast "Concourse N 87% — deploy staff"
6. **Ops View** — Volunteer Copilot: HALFTIME phase → 3 action cards with dispatch notes
7. **Close** — "One Gemini core, two personas, six modules, one flagship stadium. Deployed."

---

## 📌 Final Notes

- **Depth over breadth** — One stadium, fully real, beats three stubs
- **GenAI as reasoning layer** — Not a chatbot skin; every module uses structured Gemini output
- **Responsible AI** — Explicit: "Gemini recommends, staff decides" (state in demo)
- **Real-world grounding** — Cite Lenovo Command Centre, FIFA Sensory Inclusive, 87.8% travel emissions in pitch

---

**Plan status: IMPLEMENTATION-READY** — No open design decisions. Begin scaffold at T+0.