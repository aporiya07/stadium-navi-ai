# Smart Stadium AI — Project Plan
### Prompt Wars · Challenge 4: Smart Stadiums & Tournament Operations (FIFA World Cup 2026)

---

## 1. Problem Framing

FIFA World Cup 2026 spans **16 stadiums, 3 countries, 48 teams, 104 matches**, and tens of millions of attendees — the largest and most logistically complex tournament ever staged. Real deployments (Lenovo's Intelligent Command Centre, stadium digital twins, Football AI Pro) already show where the industry is heading: unified operational views, predictive crowd management, and AI-driven fan-facing tools.

This challenge asks for a **GenAI-enabled solution**, not a full IoT stack — so the winning move is to treat **Gemini as a reasoning/orchestration layer** on top of simulated or lightweight real data (crowd counts, transit feeds, incident reports), rather than trying to build actual sensor hardware. Judges will be scoring how *intelligently* GenAI is used, not how much infrastructure you fake.

## 2. Solution Concept: "Stadium Copilot"

A GenAI-enabled operations and fan-experience platform with **two faces**:

- **Fan-facing assistant** — multilingual chat/voice-style Q&A for navigation, accessibility, transport, and live info.
- **Ops-facing intelligence layer** — real-time summaries, alerts, and recommended actions for staff/volunteers based on crowd density, incidents, and match-state signals.

One Gemini-powered reasoning core, two personas, six functional modules — this maps cleanly to the challenge's listed focus areas (navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, real-time decision support), which is likely also how judges will score.

**Demo scope:** One flagship stadium, fully seeded and polished — real venue layout (zones, gates, amenities), realistic capacity numbers, and a backend simulator that continuously generates a believable, auto-updating crowd feed (no manual CSV upload required for the demo). Depth over breadth: one venue done convincingly beats several done thinly, and it keeps the seed data manageable within the build timeline. The data model stays multi-venue-ready (`venues.json` supports N stadiums), so adding more later is just adding data, not re-architecting.

---

## 3. Core Modules & Features

| # | Module | What it does | GenAI role |
|---|--------|--------------|------------|
| 1 | **Multilingual Fan Assistant** | Chat interface answering questions on gates, seating, food, rules, schedules | Gemini generates natural-language, persona-aware, multilingual responses grounded in venue data (RAG over stadium facts) |
| 2 | **Crowd Intelligence & Predictive Congestion** | A backend background task auto-generates a realistic, ever-changing zone-level headcount/capacity feed (no manual upload needed) — pushed to the Ops Dashboard over WebSocket; flags congestion and predicts bottlenecks before halftime/full-time surges | Gemini turns raw occupancy numbers into human-readable risk summaries and staff recommendations, only triggering when thresholds shift (cost control) |
| 3 | **Smart Navigation & Wayfinding** | Suggests routes to seats/gates/amenities that avoid predicted high-density zones | Gemini reasons over zone graph + live density to produce turn-by-turn textual guidance |
| 4 | **Accessibility Concierge** | Tailored guidance for wheelchair users, sensory-sensitive fans, elderly attendees — accessible routes, quiet zones, assistance requests | Gemini personalizes instructions based on stated needs; can draft assistance requests to staff |
| 5 | **Transportation & Sustainability Advisor** | Recommends transit/rideshare/walking options factoring in congestion + carbon footprint; suggests low-emission choices | Gemini synthesizes transit data + sustainability framing into a recommendation with rationale |
| 6 | **Volunteer/Staff Ops Copilot** | Given match-phase context (pre-match/live/halftime/post-match) + live incident/crowd data, suggests next best actions | Gemini acts as a decision-support layer, prioritizing and explaining recommended actions |
| 7 | **Incident & Emergency Triage** (stretch) | Staff describe an incident in free text; system classifies severity, suggests protocol, drafts dispatch note | Gemini does structured classification + response drafting |

**Design principle carried through every module:** Gemini never touches raw safety-critical decisions autonomously — it drafts, summarizes, and recommends; a human (staff/volunteer) confirms. This is a strong point to state explicitly in your submission — judges care about responsible AI framing.

---

## 4. Architecture

```
        ┌───────────────────────────────────────────────┐
        │            React Frontend (Vite + TS)           │
        │            Tailwind CSS + Framer Motion          │
        │                                                   │
        │   Single app, single shell, view-switcher:        │
        │   ┌─────────────┐        ┌────────────────────┐  │
        │   │  Fan View    │  <──>  │  Ops Dashboard      │  │
        │   │  (chat +     │        │  (live crowd map,   │  │
        │   │  wayfinding) │        │  alerts, actions)   │  │
        │   └─────────────┘        └────────────────────┘  │
        └───────────────────────┬───────────────────────────┘
                                 │ REST/JSON (+ WebSocket for live updates)
                    ┌────────────▼─────────────┐
                    │     FastAPI Backend       │
                    │  (Python)                 │
                    │                            │
                    │  /assistant   /crowd       │
                    │  /navigate    /accessibility│
                    │  /transport   /volunteer   │
                    │  /incident    /ws/live     │
                    └──┬───────────┬────────────┘
                       │           │
            ┌──────────▼──┐   ┌────▼─────────────┐
            │ Gemini API   │   │ Data Layer        │
            │ (google-genai)│  │ SQLite/JSON store │
            │  - persona    │  │  - zones/venues   │
            │    prompts    │  │  - simulated       │
            │  - RAG context│  │    sensor feed     │
            │  - guardrails │  │  - schedules       │
            └───────────────┘  └────────────────────┘
```

**Why this shape:** FastAPI backend serves a single React SPA with two views behind a toggle (fan / ops) so the whole demo lives at one URL — cleaner for judges to navigate than two separate apps. Gemini is called server-side only (API key never touches the client). A WebSocket channel (`/ws/live`) pushes crowd/alert updates to the ops dashboard in real time so it actually *feels* live rather than polling. Simulated data layer stands in for real IoT/venue systems — realistic for a hackathon timeline while still demonstrating the full pipeline.

---

## 5. Tech Stack

- **Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic, WebSockets (`fastapi.WebSocket`) for live push updates
- **LLM:** Google Gemini API via `google-genai` SDK (`gemini-2.0-flash` or similar — fast + cheap, good for real-time ops use case)
- **Data:** SQLite (or plain JSON/CSV) for zones, venues, schedules; in-memory store + background task for simulated live "sensor" stream
- **Frontend:** React 18 + Vite + TypeScript, Tailwind CSS (design tokens, utility classes), Framer Motion (page/view transitions, micro-interactions, live-data animations e.g. animated occupancy bars, alert pop-ins)
- **Design direction:** Clean, minimal, official-tournament look — white/light neutral base, a restrained accent palette (deep blue/green, not overly saturated), generous whitespace, clear typographic hierarchy, subtle motion rather than flashy effects. Think "official FIFA app" polish, not "hackathon dashboard."
- **Maps/visuals:** Mapbox GL JS or Leaflet (via `react-leaflet`) for the venue/zone map; Recharts or `visx` for occupancy/trend charts
- **State/data fetching:** TanStack Query (React Query) for REST calls + a small WebSocket hook for live ops updates
- **Auth/config:** `python-dotenv` for API key management
- **Testing:** `pytest` (backend), Vitest/React Testing Library (frontend, if time allows)
- **Deployment:** Backend on Render/Railway/Fly.io, frontend on Vercel/Netlify — two deploy targets, one custom domain if possible, for a clean live demo link

---

## 6. Gemini Integration Pattern

Keep this consistent across all modules — one `gemini_service.py` with:

1. **Persona routing** — system prompt varies by caller type (`fan` → warm/simple tone, `staff` → terse/operational).
2. **Grounding/RAG** — inject relevant structured data (zone occupancy JSON, venue facts, schedule) into the prompt context rather than letting Gemini invent facts.
3. **Structured output** — request JSON-mode responses for anything downstream code consumes (e.g., severity classification, recommended action), plain text for chat replies.
4. **Guardrails** — strip/ignore prompt-injection attempts from user input before it reaches the model; validate output schema.
5. **Cost/latency control** — only call Gemini when state actually changes (e.g., don't re-summarize crowd data every second — only on threshold crossing).
6. **Graceful degradation** — a rule-based fallback (e.g., simple occupancy thresholds) if the Gemini API errors out or rate-limits, so the demo never fully breaks.

---

## 7. Suggested Repo Structure

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
│   │   │   └── data_service.py
│   │   ├── core/config.py
│   │   ├── models/
│   │   └── main.py
│   └── tests/
├── data/
│   ├── venues.json
│   ├── zones.json
│   └── sample_crowd_feed.csv
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── FanView/           # chat, wayfinding, accessibility, transport
│   │   │   └── OpsDashboard/      # live crowd map, alerts, volunteer actions
│   │   ├── components/
│   │   │   ├── ViewSwitcher.tsx    # animated toggle between Fan / Ops
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── ZoneMap.tsx
│   │   │   ├── OccupancyBar.tsx
│   │   │   └── AlertToast.tsx
│   │   ├── hooks/
│   │   │   ├── useLiveFeed.ts      # WebSocket hook
│   │   │   └── useApi.ts           # React Query wrappers
│   │   ├── lib/theme.ts            # Tailwind design tokens
│   │   └── App.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── .env.example
├── requirements.txt
└── README.md
```

---

## 8. Build Roadmap

| Phase | Time | Deliverable |
|---|---|---|
| **1. Setup** | Day 1 | Repo scaffold (backend + Vite/React frontend), FastAPI skeleton, Gemini API key wired, `/health` endpoint, Tailwind design tokens + base layout (`ViewSwitcher`, shell) in place; seed flagship stadium's `venues.json`/`zones.json` |
| **2. Crowd Intelligence (proves the stack end-to-end)** | Day 1–2 | Background simulator generating a live, auto-updating occupancy feed; `/ws/live` WebSocket; occupancy calc → Gemini summary + alerts (module 2); `ZoneMap` + `OccupancyBar` + `AlertToast` wired up with Framer Motion transitions in the Ops Dashboard |
| **3. Core Assistant** | Day 2–3 | Multilingual fan Q&A module with grounded venue data (module 1), animated `ChatWidget` in Fan View |
| **4. Navigation + Accessibility** | Day 3 | Route suggestions factoring in live density; accessibility persona (modules 3–4), route UI on the map |
| **5. Transport/Sustainability + Volunteer Ops** | Day 4 | Advisor + staff copilot (modules 5–6), Ops Dashboard alert/action feed with animated toasts |
| **6. Polish & Demo** | Day 5 | Motion polish (page transitions, micro-interactions), final polish pass on the flagship stadium's data/visuals, README, deploy live link, record demo video |
| **7. Stretch** | If time | Add a 2nd/3rd stadium to prove multi-venue scale, incident triage module, voice input, digital-twin-style 3D/map view |

---

## 9. What Will Make This Stand Out to Judges

- **Explicit mapping to every listed focus area** (navigation, crowd, accessibility, transport, sustainability, multilingual, operational intelligence, real-time decision support) — state this mapping directly in your README/pitch.
- **Responsible-AI framing**: Gemini recommends, humans decide, especially for anything safety-related.
- **Real-world grounding**: reference actual FIFA 2026 initiatives (digital twins, Lenovo command centre, Football AI Pro) in your pitch to show you understood the real deployment context, then explain how your prototype complements/simplifies that for a GenAI-focused hackathon scope.
- **Working, deployed demo** > slide deck. A live React/FastAPI link with one deeply polished, believably "live" stadium beats a thin multi-venue mockup or a slide deck.
- **Graceful degradation** story — shows engineering maturity (AI outage ≠ system outage).

---

## 10. Next Steps

Build order is locked in: **Crowd Intelligence first** (proves backend simulator → Gemini → WebSocket → animated React dashboard end-to-end), one flagship stadium, simulated auto-updating feed.

I can start scaffolding now: FastAPI backend + `gemini_service.py` + the crowd simulator + the React/Tailwind/Framer Motion Ops Dashboard shell. Say the word and I'll start writing the actual code.
