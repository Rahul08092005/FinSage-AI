"use client";

interface ConnectorLinesProps {
  readonly hasEntered?: boolean;
}

export function ConnectorLines({ hasEntered = true }: ConnectorLinesProps) {
  const strokeColor = "#D5C8B2";
  const dotColor = "#BAAA90";
  const sparkColor = "#F97316";

  const pathStyle = {
    strokeDasharray: 900,
    strokeDashoffset: hasEntered ? 0 : 900,
    transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.25s, opacity 0.6s ease 0.25s",
    opacity: hasEntered ? 1 : 0,
  };

  const beadStyle = {
    transition: "opacity 0.6s ease 0.55s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.55s",
    opacity: hasEntered ? 1 : 0,
  };

  const sparkStyle = {
    transition: "opacity 0.6s ease 0.75s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.75s",
    opacity: hasEntered ? 1 : 0,
  };

  return (
    <svg
      viewBox="0 0 1672 941"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Capture -> Track (Smooth upward arc) */}
      <path
        d="M 435 233 C 445 175, 462 160, 482 175"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        style={pathStyle}
      />
      <g style={beadStyle}>
        <circle cx="435" cy="233" r="3.5" fill={dotColor} />
        <circle cx="482" cy="175" r="3.5" fill={dotColor} />
      </g>

      {/* 2. Track -> Goals (Horizontal connector with middle bead) */}
      <path
        d="M 832 192 L 903 192"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        style={pathStyle}
      />
      <g style={beadStyle}>
        <circle cx="832" cy="192" r="3.5" fill={dotColor} />
        <circle cx="867.5" cy="192" r="4" fill={dotColor} />
        <circle cx="903" cy="192" r="3.5" fill={dotColor} />
      </g>

      {/* 3. Goals -> Household (Sweeping downward curve) */}
      <path
        d="M 1253 195 C 1335 195, 1380 235, 1380 303"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        style={pathStyle}
      />
      <g style={beadStyle}>
        <circle cx="1253" cy="195" r="3.5" fill={dotColor} />
        <circle cx="1380" cy="303" r="3.5" fill={dotColor} />
      </g>

      {/* 4. Household -> AI Guidance (Vertical connector) */}
      <path
        d="M 1408 487 L 1408 558"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        style={pathStyle}
      />
      <g style={beadStyle}>
        <circle cx="1408" cy="487" r="3.5" fill={dotColor} />
        <circle cx="1408" cy="558" r="3.5" fill={dotColor} />
      </g>

      {/* 5. AI Guidance -> under the podium -> Discover Insights (Grand sweeping curve) */}
      <path
        d="M 1227 695 C 1110 835, 680 845, 531 745"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={pathStyle}
      />
      <g style={beadStyle}>
        <circle cx="1227" cy="695" r="3.5" fill={dotColor} />
        <circle cx="531" cy="745" r="3.5" fill={dotColor} />
      </g>

      {/* 6. Discover Insights -> Plan (Short vertical link) */}
      <path
        d="M 268 659 L 268 617"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        style={pathStyle}
      />
      <g style={beadStyle}>
        <circle cx="268" cy="659" r="3.5" fill={dotColor} />
        <circle cx="268" cy="617" r="3.5" fill={dotColor} />
      </g>

      {/* 7. Plan -> Capture (Short vertical link) */}
      <path
        d="M 268 443 L 268 404"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        style={pathStyle}
      />
      <g style={beadStyle}>
        <circle cx="268" cy="443" r="3.5" fill={dotColor} />
        <circle cx="268" cy="404" r="3.5" fill={dotColor} />
      </g>

      {/* ===================================================================== */}
      {/* Orange Spark Tick Marks (Exact positions from reference)              */}
      {/* ===================================================================== */}
      
      {/* Near Capture (Left top corner) */}
      <g transform="translate(80, 245)" style={sparkStyle}>
        <line x1="0" y1="-8" x2="0" y2="8" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-7" y1="-3" x2="7" y2="3" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="-5" y1="6" x2="5" y2="-6" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Near Track (Top-left) */}
      <g transform="translate(468, 125)" style={sparkStyle}>
        <line x1="-6" y1="-6" x2="6" y2="6" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-6" y1="6" x2="6" y2="-6" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Near AI Guidance (Top-right) */}
      <g transform="translate(1595, 550)" style={sparkStyle}>
        <line x1="0" y1="-8" x2="0" y2="8" stroke={sparkColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="-7" y1="-3" x2="7" y2="3" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="-5" y1="6" x2="5" y2="-6" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
