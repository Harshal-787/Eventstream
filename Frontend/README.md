# EventStream — Frontend Application

This is the official frontend for **EventStream**, a modern, real-time enterprise IoT and Smart Building monitoring platform.

## 🚀 Tech Stack

The frontend has been built with a focus on high performance, modern styling, and scalable state management:

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) for lightning-fast HMR and optimized builds.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) for utility-first responsive design.
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) for lightweight, scalable global state.
- **Routing**: [React Router v7](https://reactrouter.com/) for declarative client-side routing.
- **Data Visualization**: [Recharts](https://recharts.org/) for analytics and sensor telemetry trends.
- **Mapping**: [Leaflet](https://leafletjs.com/) + `react-leaflet` for interactive indoor building maps.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid UI micro-interactions.
- **Notifications**: `react-hot-toast` for elegant toast notifications.

## 🌟 Key Features

- **Real-Time Telemetry**: Connects directly to the backend's Server-Sent Events (SSE) stream to provide sub-second updates for device telemetry without polling.
- **Interactive Indoor Maps**: Visualize floor plans, rooms, and physical device locations dynamically using Leaflet.
- **Device Management & Twins**: Manage physical hardware via digital twins (Desired vs. Reported states).
- **Advanced Alerting**: Configure hierarchical alert rules, acknowledge anomalies, and track resolution workflows.
- **AI-Powered Diagnostics**: Built-in chatbot for autonomous diagnostic analysis of building events and hardware failures.
- **Multi-Tenant Architecture**: Supports isolated Organization data with distinct Admin and User roles.
- **Dark Mode Support**: Seamless toggle between light and dark modes utilizing `next-themes`.

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser:
   Navigate to [http://localhost:5173](http://localhost:5173) (Vite's default port).

### Building for Production

To create an optimized production build:

```bash
npm run build
```

The compiled assets will be output to the `/dist` directory. You can preview the production build locally using:

```bash
npm run preview
```

## 📁 Project Structure

```
Frontend/
├── public/                 # Static assets (images, icons)
├── src/
│   ├── components/         # Reusable UI components (buttons, modals, tables)
│   ├── features/           # Feature-based modules (alerts, auth, buildings, devices, etc.)
│   ├── hooks/              # Custom React hooks (e.g., useTelemetry)
│   ├── lib/                # Utility libraries and helpers
│   ├── providers/          # Global context providers (StreamProvider, SessionProvider)
│   ├── services/           # Axios-based API client services
│   ├── store/              # Zustand global state stores
│   ├── App.jsx             # Main application router and layout wrapper
│   └── main.jsx            # React DOM entry point
├── index.html              # Vite HTML template
├── tailwind.css            # Tailwind global stylesheet
└── vite.config.js          # Vite configuration
```
