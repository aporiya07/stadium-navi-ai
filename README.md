# Stadium Copilot - FIFA World Cup 2026

**GenAI-powered operations & fan experience for Levi's Stadium (San Francisco Bay Area)**

## 1. Chosen Vertical
**Sports Technology & Smart Stadiums**
This project specifically targets the challenges of managing mega-events (like the FIFA World Cup) by bridging the gap between stadium operations and fan experience.

## 2. Approach and Logic
Our logic is based on a **Dual Persona Architecture**:
1. **Fan View**: A mobile-first interface for stadium attendees, providing accessible wayfinding, multilingual AI assistance, and sustainable transport options.
2. **Ops Dashboard**: A desktop-class interface for stadium management and volunteers, providing real-time crowd heatmaps, incident triage, and automated action cards.

The system uses a centralized Intelligence layer (Google Gemini 2.5 Flash-Lite) to analyze crowd data and provide contextual advice to both personas simultaneously.

## 3. How the Solution Works
The architecture utilizes a unidirectional real-time data flow:
- **Data Generation**: A FastAPI background task (`CrowdSimulator`) continuously generates realistic zonal occupancy data mimicking IoT crowd sensors.
- **Real-Time Distribution**: The backend pushes these crowd snapshots via a persistent `WebSocket` connection to all connected clients.
- **Client rendering**: The React/Vite frontend uses `@tanstack/react-query` and Framer Motion to visualize this data in real-time on a stadium SVG map.
- **AI Inference**: User queries (from fans) and systemic alerts (from ops) are routed to the Gemini API, which has full context of the stadium's layout, current congestion levels, and accessibility nodes, returning actionable responses.

## 4. Assumptions Made
- **Mocked Sensor Data**: We assume the presence of live overhead cameras/sensors measuring zone capacities. In this solution, this is mocked via a Python simulation loop.
- **Fixed Stadium Layout**: The current application is hardcoded for the topology of Levi's Stadium.
- **Gemini Context Window**: We assume the Gemini model has sufficient context to parse the full JSON snapshot of the stadium state in a single prompt for rapid inference.

## 5. Security & Accessibility
- **Security**: Environment variables are strictly managed, and API keys are restricted to backend proxy layers (the frontend never exposes the Gemini API key).
- **Accessibility**: The frontend UI complies with WCAG AA contrast ratios, utilizes semantic HTML, and implements comprehensive `aria-label` tags for screen readers. The routing logic explicitly prioritizes ADA-accessible paths for users who need them.

## 6. Run Locally
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