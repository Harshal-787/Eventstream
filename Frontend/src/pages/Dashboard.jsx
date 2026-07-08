import DashboardSummary from '../components/widgets/DashboardSummary';
import RecentAlerts from '../components/widgets/RecentAlerts';
import RecentEvents from '../components/widgets/RecentEvents';
import DeviceStatusOverview from '../components/widgets/DeviceStatusOverview';
import EventTrends from '../components/widgets/EventTrends';

export default function Dashboard() {
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 w-full">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{now}</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 hover:border-gray-300 hover:text-gray-700 px-4 py-2 rounded-xl shadow-sm transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary stat cards */}
      <DashboardSummary />

      {/* Event trends full width */}
      <EventTrends />

      {/* Two column: recent alerts + recent events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentAlerts />
        <RecentEvents />
      </div>

      {/* Device status full width */}
      <DeviceStatusOverview />
    </div>
  );
}
