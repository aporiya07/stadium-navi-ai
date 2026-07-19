# Testing Strategy

This document outlines the testing methodologies used to validate the functionality, security, and efficiency of the Stadium Copilot application.

## 1. Automated Backend Testing (Pytest)
We utilize `pytest` alongside `httpx` to run integration and unit tests on the FastAPI backend.
- **Health Checks**: Asserts that the API base route and health endpoints return `200 OK` and proper JSON payloads.
- **WebSocket Validation**: Tests the connectivity and message payload formatting of the `/ws/live` crowd simulation feed.
- **AI Integration**: Mocks the Gemini API to ensure the `gemini_service` properly handles fallback logic in case of upstream rate limits or outages.

*To run tests:*
```bash
cd backend
pytest tests/ -v
```

## 2. Frontend Testing (Vitest & React Testing Library)
We utilize `vitest` alongside `@testing-library/react` to ensure the UI behaves predictably.
- **Component Rendering**: Tests validate that core routing and ViewSwitcher logic successfully mount the correct `FanView` or `OpsDashboard` components.
- **Provider Wrapping**: Tests ensure that the `QueryClientProvider` and contexts are correctly injected into the component tree.
- **Type Checking**: Strict TypeScript configurations ensure compile-time safety and eliminate runtime `TypeError`s.

*To run tests:*
```bash
cd frontend
npm run test
```

## 3. Accessibility Testing (A11y)
The application has been audited for inclusive design:
- All interactive elements (buttons, inputs) possess contextual `aria-label`s.
- Color contrast ratios adhere to WCAG AA standards (especially the dark mode glassmorphism UI).
- Scalable SVG elements ensure icons remain crisp for low-vision users.

## 4. Efficiency & Performance Profiling
- **Background Tasks**: The `CrowdSimulator` loop relies on asynchronous `asyncio.sleep` to prevent blocking the main event loop, ensuring optimal resource use even under heavy load.
- **Vite Bundling**: The frontend utilizes Vite's Rollup build process to chunk dynamic imports, minimizing the initial load time.
