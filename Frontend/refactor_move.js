const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const moves = [
  // Auth
  { src: 'src/pages/Login.jsx', dest: 'src/features/auth/pages/Login.jsx' },
  { src: 'src/pages/Register.jsx', dest: 'src/features/auth/pages/Register.jsx' },
  { src: 'src/pages/Reapply.jsx', dest: 'src/features/auth/pages/Reapply.jsx' },
  { src: 'src/services/authService.js', dest: 'src/features/auth/services/authService.js' },
  { src: 'src/store/useAuthStore.js', dest: 'src/features/auth/store/useAuthStore.js' },

  // Dashboard
  { src: 'src/pages/admin/AdminDashboard.jsx', dest: 'src/features/dashboard/pages/AdminDashboard.jsx' },
  { src: 'src/pages/user/UserDashboard.jsx', dest: 'src/features/dashboard/pages/UserDashboard.jsx' },
  { src: 'src/pages/user/UserFloorsRoomsTab.jsx', dest: 'src/features/dashboard/pages/UserFloorsRoomsTab.jsx' },
  { src: 'src/pages/user/UserRequestSensorTab.jsx', dest: 'src/features/dashboard/pages/UserRequestSensorTab.jsx' },
  { src: 'src/components/widgets/EventTrends.jsx', dest: 'src/features/dashboard/components/EventTrends.jsx' },
  { src: 'src/components/widgets/RecentAlerts.jsx', dest: 'src/features/dashboard/components/RecentAlerts.jsx' },
  { src: 'src/components/widgets/RecentEvents.jsx', dest: 'src/features/dashboard/components/RecentEvents.jsx' },
  { src: 'src/components/widgets/DashboardSummary.jsx', dest: 'src/features/dashboard/components/DashboardSummary.jsx' },
  { src: 'src/components/widgets/DeviceStatusOverview.jsx', dest: 'src/features/dashboard/components/DeviceStatusOverview.jsx' },
  { src: 'src/services/dashboardService.js', dest: 'src/features/dashboard/services/dashboardService.js' },

  // Buildings
  { src: 'src/pages/shared/Buildings.jsx', dest: 'src/features/buildings/pages/Buildings.jsx' },
  { src: 'src/pages/shared/BuildingDetails.jsx', dest: 'src/features/buildings/pages/BuildingDetails.jsx' },
  { src: 'src/pages/shared/AddBuildingModal.jsx', dest: 'src/features/buildings/pages/AddBuildingModal.jsx' },
  { src: 'src/pages/shared/EditBuildingModal.jsx', dest: 'src/features/buildings/pages/EditBuildingModal.jsx' },
  { src: 'src/services/buildingService.js', dest: 'src/features/buildings/services/buildingService.js' },

  // Devices
  { src: 'src/pages/shared/Devices.jsx', dest: 'src/features/devices/pages/Devices.jsx' },
  { src: 'src/services/deviceService.js', dest: 'src/features/devices/services/deviceService.js' },

  // Events
  { src: 'src/pages/shared/SensorEvents.jsx', dest: 'src/features/events/pages/SensorEvents.jsx' },

  // Alerts
  { src: 'src/pages/shared/Alerts.jsx', dest: 'src/features/alerts/pages/Alerts.jsx' },
  { src: 'src/pages/admin/AlertRules.jsx', dest: 'src/features/alerts/pages/AlertRules.jsx' },
  { src: 'src/services/alertService.js', dest: 'src/features/alerts/services/alertService.js' },
  { src: 'src/hooks/useLiveAlerts.js', dest: 'src/features/alerts/hooks/useLiveAlerts.js' },

  // Users
  { src: 'src/pages/admin/Users.jsx', dest: 'src/features/users/pages/Users.jsx' },
  { src: 'src/pages/admin/EditUserModal.jsx', dest: 'src/features/users/pages/EditUserModal.jsx' },
  { src: 'src/services/userService.js', dest: 'src/features/users/services/userService.js' },

  // Audit
  { src: 'src/pages/admin/AuditLogs.jsx', dest: 'src/features/audit/pages/AuditLogs.jsx' },

  // Landing
  { src: 'src/pages/LandingPage.jsx', dest: 'src/features/landing/pages/LandingPage.jsx' },
  { src: 'src/components/landing/Hero.jsx', dest: 'src/features/landing/components/Hero.jsx' },
  { src: 'src/components/landing/Header.jsx', dest: 'src/features/landing/components/Header.jsx' },
  { src: 'src/components/landing/Features.jsx', dest: 'src/features/landing/components/Features.jsx' },
  { src: 'src/components/landing/Footer.jsx', dest: 'src/features/landing/components/Footer.jsx' },
];

// Helper to create dir and move file
for (let move of moves) {
  const destDir = path.dirname(move.dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  if (fs.existsSync(move.src)) {
    fs.renameSync(move.src, move.dest);
    console.log(`Moved ${move.src} -> ${move.dest}`);
  }
}

// Clean up empty directories
const dirsToClean = [
  'src/pages/admin', 'src/pages/shared', 'src/pages/user', 'src/pages',
  'src/components/landing', 'src/components/widgets',
  'src/services', 'src/store'
];
for (let dir of dirsToClean) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmdirSync(dir);
    } catch(e) {}
  }
}
