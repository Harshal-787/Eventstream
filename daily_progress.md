# Daily Progress - July 10, 2026

1. Implemented a unified boxy design system with dynamic CSS variables, enabling flawless Light and Dark mode toggling.
2. Standardized all shared UI components (Buttons, Inputs, Selects, Modals, Badges) with sharp corners, 2px borders, and heavy typography.
3. Upgraded the main Sidebar to be fully collapsible while ensuring the Dashboard layout shifts responsively.
4. Refactored all Dashboard and Detail pages to remove misaligned cards and standardize them into a uniform grid.
5. Redesigned the Login and Registration screens with modern, professional forms that match the new aesthetic.
6. Replaced harsh, cartoonish brutalist drop-shadows globally with sleek, professional soft shadows (`shadow-md`).
7. Added playful, highly-responsive "popping" hover animations to the cards and icons on the Landing Page.
8. Enhanced the Landing Page header with a professional frosted-glass scroll blur and sharp uppercase navigation links.
9. Stripped away legacy hardcoded colors (`bg-white`, `border-black`) to ensure 100% theme consistency across all pages.

# Daily Progress - July 13, 2026

1. **Neo-Brutalist Dashboard Overhaul:** Reverted both Admin and User dashboards to the bold, high-contrast Neo-Brutalist design language (thick borders, stark 4px shadows, sharp uppercase typography) to match the core website aesthetic.
2. **Chart Styling:** Converted all Recharts area and line charts to use rigid `step` lines instead of smooth curves, reinforcing the industrial theme.
3. **User Analytics Expansion:** Deployed three new real-time analytics charts to the User Dashboard: Sensor Fleet Distribution, Incident Timeline (Stacked Bar), and Fleet Connectivity Status.
4. **Dynamic Simulator Configuration:** Upgraded the Go backend simulator to hot-reload `.env` variables (`SIMULATE_ALERTS`, `SIMULATE_SPIKE_PROBABILITY`) on every tick, allowing instant toggling of alerts without server restarts.
5. **Sensor Support:** Expanded the live telemetry rendering engine to explicitly support `motion` sensors, resolving an issue where motion data would render blank.
6. **Dashboard Stability:** Patched a fatal crashing bug in the Admin Dashboard's Alert Status donut chart caused by an unhandled empty state when all database alerts were cleared.

### System Architecture Notes: Live Telemetry & SSE
- **Background Simulator (`simulator.go`)**: Runs a persistent goroutine ticking every 3 seconds. It fetches active devices, calculates random realistic environmental telemetry (e.g. 21°C-23°C), and dynamically rolls a "spike" probability to trigger anomalies (e.g. 35°C). All data is persisted to PostgreSQL instantly.
- **Server-Sent Events (SSE) Hub (`events/hub.go`)**: Acts as a high-performance switchboard. Once the simulator saves data, it immediately pushes the exact payload into the Hub's broadcast channel. The server maintains permanent open HTTP connections with connected clients, blasting JSON payloads downstream in real-time.
- **React Listeners (`useTelemetry.js` & `useLiveAlerts.js`)**: The frontend abandons traditional REST polling in favor of the browser's native `EventSource` API. Upon receiving `"telemetry"` packets, it instantly repaints the step-charts. Upon `"alert"` packets, it drops UI toasts and merges the state without ever requiring a browser refresh.
