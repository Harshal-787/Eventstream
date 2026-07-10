import React from 'react';

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-6 border-b border-(--color-border-main) mb-6 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`pb-3 text-sm font-bold flex items-center transition-colors whitespace-nowrap ${
              isActive 
                ? 'border-b-2 border-(--color-primary) text-(--color-primary)' 
                : 'text-(--color-text-muted) hover:text-(--color-text-main) border-b-2 border-transparent hover:border-(--color-border-main)'
            }`}
          >
            {Icon && <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-(--color-primary)' : 'text-(--color-text-muted)'}`} />}
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                isActive ? 'bg-(--color-primary) text-white' : 'bg-(--color-surface-hover) text-(--color-text-main)'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
