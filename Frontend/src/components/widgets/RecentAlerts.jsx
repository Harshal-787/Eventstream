const ALERTS = [
  { id: 1, device: 'Smoke Sensor B2-04', type: 'Smoke Detected',   severity: 'critical', time: '2 min ago' },
  { id: 2, device: 'Temp Sensor A1-12',  type: 'High Temperature', severity: 'high',     time: '11 min ago' },
  { id: 3, device: 'Door Sensor C3-07',  type: 'Forced Open',      severity: 'high',     time: '28 min ago' },
  { id: 4, device: 'Leak Sensor D1-02',  type: 'Water Leak',       severity: 'medium',   time: '1 hr ago' },
  { id: 5, device: 'Power Meter A2-01',  type: 'High Consumption', severity: 'low',      time: '2 hr ago' },
];

const SEVERITY = {
  critical: { badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500' },
  high:     { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  medium:   { badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  low:      { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
};

export default function RecentAlerts() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Recent Alerts</h3>
        <button className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors">View all</button>
      </div>
      <div className="divide-y divide-gray-50">
        {ALERTS.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
            <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY[a.severity].dot}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{a.type}</p>
              <p className="text-xs text-gray-400 truncate">{a.device}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-lg capitalize ${SEVERITY[a.severity].badge}`}>
                {a.severity}
              </span>
              <span className="text-xs text-gray-400 w-16 text-right">{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
