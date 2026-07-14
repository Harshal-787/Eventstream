import React from 'react';

export const Logo = ({ className = "w-8 h-8", hideText = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Dynamic SVG Logo */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-(--color-primary-600) shrink-0"
        style={{ maxWidth: '40px', maxHeight: '40px' }}
      >
        <defs>
          <linearGradient id="streamGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="currentColor" />
            <stop offset="1" stopColor="var(--color-accent-500)" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Ring */}
        <circle cx="50" cy="50" r="45" stroke="url(#streamGrad)" strokeWidth="6" strokeOpacity="0.2" />
        
        {/* Abstract Waveform / Data Stream */}
        <path
          d="M 15 50 C 30 20, 40 80, 50 50 C 60 20, 70 80, 85 50"
          stroke="url(#streamGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Glowing Node */}
        <circle cx="50" cy="50" r="8" fill="var(--color-accent-500)" filter="url(#glow)" />
      </svg>
      
      {!hideText && (
        <span className="font-heading font-extrabold text-2xl tracking-tight text-(--color-text-main)">
          Event<span className="text-(--color-primary-600)">Stream</span>
        </span>
      )}
    </div>
  );
};
