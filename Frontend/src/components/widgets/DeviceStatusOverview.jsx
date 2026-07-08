const BUILDINGS = [
  { name: 'HQ Tower',       total: 32, online: 28 },
  { name: 'Warehouse A',    total: 24, online: 18 },
  { name: 'Warehouse B',    total: 20, online: 20 },
  { name: 'Research Block', total: 18, online: 14 },
  { name: 'Data Center',    total: 30, online: 18 },
];

export default function DeviceStatusOverview() {
  const totalDevices = BUILDINGS.reduce((s, b) => s + b.total, 0);
  const totalOnline  = BUILDINGS.reduce((s, b) => s + b.online, 0);
  const totalOffline = totalDevices - totalOnline;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Device Status by Building</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Online
            <strong className="text-gray-700 ml-0.5">{totalOnline}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Offline
            <strong className="text-gray-700 ml-0.5">{totalOffline}</strong>
          </span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {BUILDINGS.map((b) => {
          const onlinePct  = Math.round((b.online / b.total) * 100);
          const offlinePct = 100 - onlinePct;
          return (
            <div key={b.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-700">{b.name}</span>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="text-emerald-600 font-semibold">{b.online} online</span>
                  <span className="text-gray-400">{b.total - b.online} offline</span>
                  <span className="text-gray-400 font-medium">{onlinePct}%</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${onlinePct}%` }}
                />
                <div
                  className="h-full bg-red-200 transition-all duration-500"
                  style={{ width: `${offlinePct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
