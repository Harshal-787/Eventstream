const stats = [
  {
    label: 'Total Buildings', value: 6,
    bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Total Devices', value: 124,
    bg: 'bg-violet-50', text: 'text-violet-700', iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    label: 'Online Devices', value: 98,
    bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
  },
  {
    label: 'Offline Devices', value: 26,
    bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100', iconColor: 'text-red-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01M3 3l18 18" />
      </svg>
    ),
  },
  {
    label: 'Open Alerts', value: 9,
    bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    label: 'Events Today', value: 3842,
    bg: 'bg-cyan-50', text: 'text-cyan-700', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function DashboardSummary() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${s.iconBg} ${s.iconColor} mb-3`}>
            {s.icon}
          </div>
          <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
