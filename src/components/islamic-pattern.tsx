export function IslamicPatternBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* base surface */}
      <div className="absolute inset-0 bg-surface-container-lowest" />
      {/* tiled line-art motif */}
      <svg className="absolute inset-0 w-full h-full text-primary dark:text-primary-dark opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic-motif" width="220" height="220" patternUnits="userSpaceOnUse">
            {/* arch */}
            <path d="M20 170 V90 A30 30 0 0 1 80 90 V170" fill="none" stroke="currentColor" strokeWidth="2" />
            {/* 8-point star */}
            <g transform="translate(160,50)">
              <path
                d="M0 -22 L6 -6 L22 0 L6 6 L0 22 L-6 6 L-22 0 L-6 -6 Z M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4 Z"
                fill="none" stroke="currentColor" strokeWidth="1.5"
              />
            </g>
            {/* open book */}
            <g transform="translate(140,150)">
              <path d="M-24 -10 Q-12 -16 0 -10 V14 Q-12 8 -24 14 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M24 -10 Q12 -16 0 -10 V14 Q12 8 24 14 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </g>
            {/* graduation cap */}
            <g transform="translate(40,40)">
              <path d="M-18 0 L0 -9 L18 0 L0 9 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M-9 4.5 V13 Q0 19 9 13 V4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <line x1="18" y1="0" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-motif)" />
      </svg>
      {/* soft spotlight glow, top-right */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle at 80% 10%, rgb(var(--tertiary-container)) 0%, transparent 45%)", opacity: 0.5 }}
      />
      {/* vignette so the card stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/40 via-transparent to-surface-container-lowest/60" />
    </div>
  );
}
