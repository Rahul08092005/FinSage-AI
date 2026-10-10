"use client";

export function ConnectorLines() {
  const strokeColor = "#DDD5C4";
  const dotColor = "#B0A590";
  const sparkColor = "#F97316";

  return (
    <svg
      viewBox="0 0 1672 941"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Capture -> Track (Curved upward arc) */}
      <path
        d="M 380 233 C 400 170, 440 160, 481 185"
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="380" cy="233" r="3.5" fill={dotColor} />
      <circle cx="481" cy="185" r="3.5" fill={dotColor} />

      {/* 2. Track -> Goals (Connecting horizontal link) */}
      <path
        d="M 831 192 C 855 192, 875 195, 903 195"
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="831" cy="192" r="3.5" fill={dotColor} />
      <circle cx="903" cy="195" r="3.5" fill={dotColor} />

      {/* 3. Goals -> Household (Curved downward arc) */}
      <path
        d="M 1252 195 C 1310 195, 1345 240, 1345 303"
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="1252" cy="195" r="3.5" fill={dotColor} />
      <circle cx="1345" cy="303" r="3.5" fill={dotColor} />

      {/* 4. Household -> AI Guidance (Short vertical link) */}
      <path
        d="M 1407 487 L 1408 558"
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="1407" cy="487" r="3.5" fill={dotColor} />
      <circle cx="1408" cy="558" r="3.5" fill={dotColor} />

      {/* 5. AI Guidance -> around the podium -> Discover Insights */}
      <path
        d="M 1227 680 C 1120 830, 720 850, 532 743"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />
      <circle cx="1227" cy="680" r="3.5" fill={dotColor} />
      <circle cx="532" cy="743" r="3.5" fill={dotColor} />

      {/* 6. Discover Insights -> Plan (Short vertical link) */}
      <path
        d="M 267 658 L 267 617"
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="267" cy="658" r="3.5" fill={dotColor} />
      <circle cx="267" cy="617" r="3.5" fill={dotColor} />

      {/* 7. Plan -> Capture (Short vertical link) */}
      <path
        d="M 267 443 L 267 405"
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />
      <circle cx="267" cy="443" r="3.5" fill={dotColor} />
      <circle cx="267" cy="405" r="3.5" fill={dotColor} />

      {/* Orange Spark Ticks */}
      {/* Near Capture */}
      <g transform="translate(85, 205)">
        <line x1="0" y1="-7" x2="0" y2="7" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-7" y1="0" x2="7" y2="0" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-4" y1="-4" x2="4" y2="4" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="-4" x2="-4" y2="4" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Near Track */}
      <g transform="translate(470, 75)">
        <line x1="0" y1="-6" x2="0" y2="6" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-6" y1="0" x2="6" y2="0" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Near AI Guidance */}
      <g transform="translate(1485, 545)">
        <line x1="0" y1="-7" x2="0" y2="7" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-7" y1="0" x2="7" y2="0" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-4" y1="-4" x2="4" y2="4" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Near Household */}
      <g transform="translate(1480, 290)">
        <line x1="0" y1="-5" x2="0" y2="5" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="-5" y1="0" x2="5" y2="0" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
