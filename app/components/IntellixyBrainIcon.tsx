export function IntellixyBrainIcon({ size = 28 }: { size?: number }) {
  const h = Math.round(size * 0.86);
  return (
    <svg width={size} height={h} viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ilx-g" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#F59E0B"/>
          <stop offset="25%"  stopColor="#F97316"/>
          <stop offset="52%"  stopColor="#EC4899"/>
          <stop offset="78%"  stopColor="#8B5CF6"/>
          <stop offset="100%" stopColor="#3B82F6"/>
        </linearGradient>
      </defs>

      {/* Left hemisphere */}
      <path
        d="M27 7 C22 7 15 8 11 13 C7 18 6 25 8 31 C10 37 15 41 20 43 C23 44 27 43 27 43"
        stroke="url(#ilx-g)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Right hemisphere */}
      <path
        d="M27 7 C32 7 38 9 41 14 C44 20 43 28 40 33 C38 37 34 41 27 43"
        stroke="url(#ilx-g)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Bottom chin lobe */}
      <path
        d="M20 43 C18 46 19 48 22 48 C25 48 28 46 27 43"
        stroke="url(#ilx-g)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Neural paths */}
      <path d="M15 17 L27 11 L39 18" stroke="url(#ilx-g)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 17 L23 27 L39 18" stroke="url(#ilx-g)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 17 L17 32"         stroke="url(#ilx-g)" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M17 32 L23 27"         stroke="url(#ilx-g)" strokeWidth="2.4" strokeLinecap="round"/>

      {/* Nodes */}
      <circle cx="27" cy="11" r="3.2" stroke="url(#ilx-g)" strokeWidth="2.2" fill="white"/>
      <circle cx="15" cy="17" r="3.2" stroke="url(#ilx-g)" strokeWidth="2.2" fill="white"/>
      <circle cx="39" cy="18" r="3.2" stroke="url(#ilx-g)" strokeWidth="2.2" fill="white"/>
      <circle cx="23" cy="27" r="3.2" stroke="url(#ilx-g)" strokeWidth="2.2" fill="white"/>
      <circle cx="17" cy="32" r="2.8" stroke="url(#ilx-g)" strokeWidth="2.2" fill="white"/>
    </svg>
  );
}
