const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const map = {
  'src/pages/Login.jsx': 'src/features/auth/pages/Login.jsx',
  'src/pages/Register.jsx': 'src/features/auth/pages/Register.jsx',
  'src/pages/Reapply.jsx': 'src/features/auth/pages/Reapply.jsx',
  'src/services/authService.js': 'src/features/auth/services/authService.js',
  'src/store/useAuthStore.js': 'src/features/auth/store/useAuthStore.js',
  'src/pages/admin/AdminDashboard.jsx': 'src/features/dashboard/pages/AdminDashboard.jsx',
  'src/pages/user/UserDashboard.jsx': 'src/features/dashboard/pages/UserDashboard.jsx',
  'src/pages/user/UserFloorsRoomsTab.jsx': 'src/features/dashboard/pages/UserFloorsRoomsTab.jsx',
  'src/pages/user/UserRequestSensorTab.jsx': 'src/features/dashboard/pages/UserRequestSensorTab.jsx',
  'src/components/widgets/EventTrends.jsx': 'src/features/dashboard/components/EventTrends.jsx',
  'src/components/widgets/RecentAlerts.jsx': 'src/features/dashboard/components/RecentAlerts.jsx',
  'src/components/widgets/RecentEvents.jsx': 'src/features/dashboard/components/RecentEvents.jsx',
  'src/components/widgets/DashboardSummary.jsx': 'src/features/dashboard/components/DashboardSummary.jsx',
  'src/components/widgets/DeviceStatusOverview.jsx': 'src/features/dashboard/components/DeviceStatusOverview.jsx',
  'src/services/dashboardService.js': 'src/features/dashboard/services/dashboardService.js',
  'src/pages/shared/Buildings.jsx': 'src/features/buildings/pages/Buildings.jsx',
  'src/pages/shared/BuildingDetails.jsx': 'src/features/buildings/pages/BuildingDetails.jsx',
  'src/pages/shared/AddBuildingModal.jsx': 'src/features/buildings/pages/AddBuildingModal.jsx',
  'src/pages/shared/EditBuildingModal.jsx': 'src/features/buildings/pages/EditBuildingModal.jsx',
  'src/services/buildingService.js': 'src/features/buildings/services/buildingService.js',
  'src/pages/shared/Devices.jsx': 'src/features/devices/pages/Devices.jsx',
  'src/services/deviceService.js': 'src/features/devices/services/deviceService.js',
  'src/pages/shared/SensorEvents.jsx': 'src/features/events/pages/SensorEvents.jsx',
  'src/pages/shared/Alerts.jsx': 'src/features/alerts/pages/Alerts.jsx',
  'src/pages/admin/AlertRules.jsx': 'src/features/alerts/pages/AlertRules.jsx',
  'src/services/alertService.js': 'src/features/alerts/services/alertService.js',
  'src/hooks/useLiveAlerts.js': 'src/features/alerts/hooks/useLiveAlerts.js',
  'src/pages/admin/Users.jsx': 'src/features/users/pages/Users.jsx',
  'src/pages/admin/EditUserModal.jsx': 'src/features/users/pages/EditUserModal.jsx',
  'src/services/userService.js': 'src/features/users/services/userService.js',
  'src/pages/admin/AuditLogs.jsx': 'src/features/audit/pages/AuditLogs.jsx',
  'src/pages/LandingPage.jsx': 'src/features/landing/pages/LandingPage.jsx',
  'src/components/landing/Hero.jsx': 'src/features/landing/components/Hero.jsx',
  'src/components/landing/Header.jsx': 'src/features/landing/components/Header.jsx',
  'src/components/landing/Features.jsx': 'src/features/landing/components/Features.jsx',
  'src/components/landing/Footer.jsx': 'src/features/landing/components/Footer.jsx',
};

// Create a reverse map to lookup new absolute paths
const oldToNewPaths = {};
for (const [oldRel, newRel] of Object.entries(map)) {
    const oldAbs = path.join(__dirname, oldRel);
    const newAbs = path.join(__dirname, newRel);
    oldToNewPaths[oldAbs] = newAbs;
    
    // Also map without extension for module resolution
    const ext = path.extname(oldAbs);
    oldToNewPaths[oldAbs.slice(0, -ext.length)] = newAbs.slice(0, -ext.length);
}

function resolveImport(currentFileAbs, importStr) {
    if (!importStr.startsWith('.')) return null; // Only handle relative
    
    const currentDir = path.dirname(currentFileAbs);
    const importedAbs = path.resolve(currentDir, importStr);
    
    let matchedOldAbs = null;
    let targetNewAbs = null;

    // Check if the imported file was moved
    if (oldToNewPaths[importedAbs]) {
        targetNewAbs = oldToNewPaths[importedAbs];
    } else {
        // Test with .js and .jsx
        if (oldToNewPaths[importedAbs + '.js']) targetNewAbs = oldToNewPaths[importedAbs + '.js'];
        if (oldToNewPaths[importedAbs + '.jsx']) targetNewAbs = oldToNewPaths[importedAbs + '.jsx'];
    }

    if (!targetNewAbs) {
        // The imported file was NOT moved. But what if the CURRENT file was moved?
        // We still need to rewrite the import path relative to the new location!
        const currentFileWasMovedTo = oldToNewPaths[currentFileAbs];
        if (!currentFileWasMovedTo) return null; // Nothing moved
        
        // Target didn't move, current file did.
        let newRel = path.relative(path.dirname(currentFileWasMovedTo), importedAbs);
        if (!newRel.startsWith('.')) newRel = './' + newRel;
        return newRel;
    }

    // The imported file WAS moved.
    // Did the current file move?
    const currentFileNewAbs = oldToNewPaths[currentFileAbs] || currentFileAbs;
    
    let newRel = path.relative(path.dirname(currentFileNewAbs), targetNewAbs);
    if (!newRel.startsWith('.')) newRel = './' + newRel;
    
    return newRel.replace(/\\/g, '/'); // normalize for imports
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Regex to match ES6 imports
            const importRegex = /(import.*?from\s+['"])(.*?)(['"])/g;
            content = content.replace(importRegex, (match, p1, p2, p3) => {
                const newPath = resolveImport(fullPath, p2);
                if (newPath) {
                    modified = true;
                    return `${p1}${newPath}${p3}`;
                }
                return match;
            });

            // Regex to match dynamic imports / requires if any
            // (Assuming mostly ES6 imports for now)

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated imports in ${fullPath}`);
            }
        }
    }
}

// 1. Update contents using the CURRENT file paths (before move)
processDirectory(srcDir);

// 2. Move files
console.log('Moving files...');
for (const [oldRel, newRel] of Object.entries(map)) {
    const oldAbs = path.join(__dirname, oldRel);
    const newAbs = path.join(__dirname, newRel);
    
    if (fs.existsSync(oldAbs)) {
        const destDir = path.dirname(newAbs);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.renameSync(oldAbs, newAbs);
        console.log(`Moved ${oldRel} -> ${newRel}`);
    }
}

// 3. Clean up empty dirs
const dirsToClean = [
  'src/pages/admin', 'src/pages/shared', 'src/pages/user', 'src/pages',
  'src/components/landing', 'src/components/widgets',
  'src/services', 'src/store'
];
for (let dir of dirsToClean) {
  const absDir = path.join(__dirname, dir);
  if (fs.existsSync(absDir)) {
    try {
      fs.rmdirSync(absDir);
    } catch(e) {}
  }
}
console.log('Done.');
