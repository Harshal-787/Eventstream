const HOURS = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
const DATA = {
  temperature: [12, 10, 8,  14, 30, 48, 52, 60, 58, 44, 36, 20],
  motion:      [2,  1,  0,  3,  18, 35, 40, 38, 42, 30, 15, 6 ],
  smoke:       [0,  0,  0,  0,  1,  0,  2,  1,  0,  0,  1,  0 ],
};

const SERIES = [
  { key: 'temperature', label: 'Temperature', bar: 'bg-orange-400', dot: 'bg-orange-400' },
  { key: 'motion',      label: 'Motion',      bar: 'bg-emerald-400', dot: 'bg-emerald-400' },
  { key: 'smoke',       label: 'Smoke',       bar: 'bg-red-400',    dot: 'bg-red-400' },
];

const CHART_HEIGHT = 120;

export default function EventTrends() {
  const maxVal = Math.max(...Object.values(DATA).flat(), 1);

  return (
    <div className="bg-surface border border-border-main rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-main">
        <div>
          <h3 className="text-sm font-semibold text-text-main">Event Trends</h3>
          <p className="text-xs text-text-muted mt-0.5">Today — hourly breakdown</p>
        </div>
        <div className="flex items-center gap-4">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className={`w-2.5 h-2.5 rounded-sm ${s.dot} inline-block`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 pb-3">
        {/* Y-axis labels + chart area */}
        <div className="flex gap-2">
          {/* Y labels */}
          <div className="flex flex-col justify-between text-right pr-2" style={{ height: CHART_HEIGHT }}>
            {[maxVal, Math.round(maxVal / 2), 0].map((v) => (
              <span key={v} className="text-[10px] text-text-muted leading-none opacity-70">{v}</span>
            ))}
          </div>

          {/* Bars */}
          <div className="flex-1 flex items-end gap-1" style={{ height: CHART_HEIGHT }}>
            {HOURS.map((hour, i) => (
              <div key={hour} className="flex-1 flex flex-col justify-end gap-px" style={{ height: CHART_HEIGHT }}>
                {SERIES.map((s) => {
                  const val = DATA[s.key][i];
                  const h = Math.max((val / maxVal) * (CHART_HEIGHT - 16), val > 0 ? 2 : 0);
                  return (
                    <div
                      key={s.key}
                      title={`${s.label} at ${hour}:00 — ${val} events`}
                      className={`w-full rounded-sm ${s.bar} opacity-85 transition-all`}
                      style={{ height: h }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex gap-1 mt-2 pl-8">
          {HOURS.map((h) => (
            <div key={h} className="flex-1 text-center">
              <span className="text-[10px] text-text-muted opacity-70">{h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
