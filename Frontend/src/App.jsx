import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import FloorsRooms from './pages/FloorsRooms';
import Devices from './pages/Devices';
import SensorEvents from './pages/SensorEvents';
import Alerts from './pages/Alerts';
import AlertRules from './pages/AlertRules';
import Analytics from './pages/Analytics';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Sidebar>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/buildings" element={<Buildings />} />
                <Route path="/floors-rooms" element={<FloorsRooms />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/sensor-events" element={<SensorEvents />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/alert-rules" element={<AlertRules />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Sidebar>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
