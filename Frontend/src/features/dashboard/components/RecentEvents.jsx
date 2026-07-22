const EVENTS = [
  { id: 1, device: 'Temp Sensor A1-12',    type: 'temperature', value: '38.4 °C',  time: '1 min ago' },
  { id: 2, device: 'Humidity Sensor B1-03',type: 'humidity',    value: '82 %',     time: '3 min ago' },
  { id: 3, device: 'Motion Sensor C2-09',  type: 'motion',      value: 'Detected', time: '5 min ago' },
  { id: 4, device: 'Power Meter A2-01',    type: 'power',       value: '4.7 kW',   time: '7 min ago' },
  { id: 5, device: 'Door Sensor C3-07',    type: 'door',        value: 'Opened',   time: '9 min ago' },
  { id: 6, device: 'Leak Sensor D1-02',    type: 'water_leak',  value: 'Clear',    time: '12 min ago' },
];

const TYPE_STYLE = {
  temperature: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-600 dark:text-orange-400' },
  humidity:    { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-600 dark:text-blue-400' },
  motion:      { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400' },
  power:       { bg: 'bg-amber-100 dark:bg-amber-900/40',  text: 'text-amber-600 dark:text-amber-400' },
  door:        { bg: 'bg-cyan-100 dark:bg-cyan-900/40',   text: 'text-cyan-600 dark:text-cyan-400' },
  water_leak:  { bg: 'bg-teal-100 dark:bg-teal-900/40',   text: 'text-teal-600 dark:text-teal-400' },
};
};

export default function RecentEvents() {
  return (
  return (
    <div className="bg-surface border border-border-main rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-main">
        <h3 className="text-sm font-semibold text-text-main">Recent Events</h3>
        <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">View all</button>
      </div>
      <div className="divide-y divide-border-main">
        {EVENTS.map((e) => {
          const style = TYPE_STYLE[e.type];
          return (
            <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-hover transition-colors">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                <span className={`text-xs font-bold uppercase ${style.text}`}>
                  {e.type.replace('_', ' ').slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">{e.device}</p>
                <p className={`text-xs capitalize ${style.text}`}>{e.type.replace('_', ' ')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-text-main">{e.value}</p>
                <p className="text-xs text-text-muted">{e.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
