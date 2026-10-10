"use client";

export function ConnectorLines() {
  const strokeColor = "#D5C8B2";
  const dotColor = "#BAAA90";
  const sparkColor = "#F97316";

  return (
    <svg
      viewBox="0 0 1672 941"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Capture -> Track (Smooth upward arc) */}
      <path
        d="M 430 233 C 440 180, 455 160, 481 160"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="430" cy="233" r="3.5" fill={dotColor} />
      <circle cx="481" cy="160" r="3.5" fill={dotColor} />

      {/* 2. Track -> Goals (Horizontal connector with middle bead) */}
      <path
        d="M 831 160 L 903 160"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="831" cy="160" r="3.5" fill={dotColor} />
      <circle cx="867" cy="160" r="4" fill={dotColor} />
      <circle cx="903" cy="160" r="3.5" fill={dotColor} />

      {/* 3. Goals -> Household (Sweeping downward curve) */}
      <path
        d="M 1252 185 C 1315 185, 1345 235, 1345 303"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="1252" cy="185" r="3.5" fill={dotColor} />
      <circle cx="1345" cy="303" r="3.5" fill={dotColor} />

      {/* 4. Household -> AI Guidance (Vertical connector) */}
      <path
        d="M 1407 487 L 1408 558"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="1407" cy="487" r="3.5" fill={dotColor} />
      <circle cx="1408" cy="558" r="3.5" fill={dotColor} />

      {/* 5. AI Guidance -> under the podium -> Discover Insights (Grand sweeping curve) */}
      <path
        d="M 1227 720 C 1110 795, 680 815, 546 750"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="1227" cy="720" r="3.5" fill={dotColor} />
      <circle cx="546" cy="750" r="3.5" fill={dotColor} />

      {/* 6. Discover Insights -> Plan (Short vertical link) */}
      <path
        d="M 280 658 L 280 617"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="280" cy="658" r="3.5" fill={dotColor} />
      <circle cx="280" cy="617" r="3.5" fill={dotColor} />

      {/* 7. Plan -> Capture (Short vertical link) */}
      <path
        d="M 280 443 L 280 405"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="280" cy="443" r="3.5" fill={dotColor} />
      <circle cx="280" cy="405" r="3.5" fill={dotColor} />

      {/* ===================================================================== */}
      {/* Orange Spark Tick Marks (Exact positions from reference)              */}
      {/* ===================================================================== */}
      
      {/* Near Capture (Left top corner) */}
      <g transform="translate(80, 245)">
        <line x1="0" y1="-8" x2="0" y2="8" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-7" y1="-3" x2="7" y2="3" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="-5" y1="6" x2="5" y2="-6" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Near Track (Top-left) */}
      <g transform="translate(468, 125)">
        <line x1="-6" y1="-6" x2="6" y2="6" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-6" y1="6" x2="6" y2="-6" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Near AI Guidance (Top-right) */}
      <g transform="translate(1595, 550)">
        <line x1="0" y1="-8" x2="0" y2="8" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-7" y1="-3" x2="7" y2="3" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="-5" y1="6" x2="5" y2="-6" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
