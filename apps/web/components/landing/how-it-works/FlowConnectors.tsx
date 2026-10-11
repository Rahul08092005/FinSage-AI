"use client";

interface ArrowProps {
  color?: string;
  hasEntered?: boolean;
  isDashed?: boolean;
}

/**
 * Horizontal curved connector between adjacent cards
 */
export function HorizontalConnector({ color = "#18122B", hasEntered = true, isDashed = false }: ArrowProps) {
  return (
    <div
      className="hidden lg:flex items-center justify-center -mx-3 z-20 pointer-events-none transition-opacity duration-500"
      style={{ opacity: hasEntered ? 0.9 : 0 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 18" fill="none" className="w-7 lg:w-8 h-4.5 overflow-visible">
        <path
          d="M 2 9 Q 18 3, 28 9"
          stroke={color}
          strokeWidth="2.2"
          strokeDasharray={isDashed ? "3.5 2.5" : "none"}
          strokeLinecap="round"
        />
        <path
          d="M 22 4.5 L 29 9 L 22 13.5"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/**
 * Step 1 to Step 5: Orange curved arrow pointing down into Card 5
 */
export function Step1To5Connector({ hasEntered = true }: { hasEntered?: boolean }) {
  return (
    <div
      className="hidden lg:block absolute left-8 top-[195px] w-12 h-20 z-0 pointer-events-none transition-opacity duration-600"
      style={{ opacity: hasEntered ? 0.85 : 0 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 80" fill="none" className="w-full h-full overflow-visible">
        <path
          d="M 24 0 C 10 20, 6 45, 14 68"
          stroke="#F97316"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M 6 58 L 14 69 L 22 62"
          stroke="#F97316"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/**
 * Step 4 to Step 7: Cyan/Green curved path sweeping towards Step 7
 */
export function Step4To7Connector({ hasEntered = true }: { hasEntered?: boolean }) {
  return (
    <div
      className="hidden xl:block absolute right-12 top-[190px] w-64 h-24 z-0 pointer-events-none transition-opacity duration-700"
      style={{ opacity: hasEntered ? 0.75 : 0 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 260 80" fill="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="step4to7Grad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path
          d="M 240 0 C 220 50, 120 70, 0 60"
          stroke="url(#step4to7Grad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Step 5 to Step 6: Pink dashed curved arrow
 */
export function Step5To6Connector({ hasEntered = true }: { hasEntered?: boolean }) {
  return (
    <div
      className="hidden md:flex items-center justify-center -mx-3 z-20 pointer-events-none transition-opacity duration-500"
      style={{ opacity: hasEntered ? 0.85 : 0 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 22" fill="none" className="w-8 lg:w-9 h-5 overflow-visible">
        <path
          d="M 2 4 Q 20 16, 32 14"
          stroke="#F43F5E"
          strokeWidth="2.2"
          strokeDasharray="3.5 2.5"
          strokeLinecap="round"
        />
        <path
          d="M 25 9 L 33 14 L 27 18"
          stroke="#F43F5E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/**
 * Step 6 to Step 7: Blue curved arrow
 */
export function Step6To7Connector({ hasEntered = true }: { hasEntered?: boolean }) {
  return (
    <div
      className="hidden md:flex items-center justify-center -mx-3 z-20 pointer-events-none transition-opacity duration-500"
      style={{ opacity: hasEntered ? 0.85 : 0 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 22" fill="none" className="w-8 lg:w-9 h-5 overflow-visible">
        <path
          d="M 2 16 Q 20 6, 32 8"
          stroke="#3B82F6"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M 25 4 L 33 8 L 26 13"
          stroke="#3B82F6"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/**
 * Mobile vertical connector between stacked steps
 */
export function VerticalStepConnector() {
  return (
    <div className="flex sm:hidden items-center justify-center py-1 text-[#18122B]/35" aria-hidden="true">
      <svg viewBox="0 0 16 20" fill="none" className="w-4 h-5">
        <path
          d="M 8 2 L 8 15 M 4 11 L 8 16 L 12 11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
}
