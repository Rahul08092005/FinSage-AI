export interface StackedPill {
  label: string;
  iconType: "food" | "shopping" | "transport" | "chat" | "bulb" | "sparkle" | "bars" | "calendar" | "star";
  iconColor: string;
  bgColor?: string;
}

export interface ChipItem {
  label: string;
  circleColor: string;
}

export interface HowItWorksStep {
  id: number;
  stepNumber: string;
  title: string;
  description: string;
  tags?: string[];
  badgeBg: string;
  badgeText: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  illustrationType: "capture" | "organize" | "understand" | "goals" | "shared" | "ai" | "grow";
  stackedPills?: StackedPill[];
  chips?: ChipItem[];
  tilt?: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: 1,
    stepNumber: "1",
    title: "Capture Everything",
    description: "Upload receipts, payment screenshots, bank PDFs or connect your accounts.",
    tags: ["OCR", "Auto-capture", "Secure"],
    badgeBg: "#65A30D",
    badgeText: "#FFFFFF",
    cardBg: "linear-gradient(135deg, rgba(247, 254, 231, 0.95) 0%, rgba(236, 252, 203, 0.75) 100%)",
    cardBorder: "rgba(132, 204, 22, 0.35)",
    cardShadow: "0 10px 24px -4px rgba(132, 204, 22, 0.12), 0 4px 10px -2px rgba(24, 18, 43, 0.04)",
    illustrationType: "capture",
  },
  {
    id: 2,
    stepNumber: "2",
    title: "Organize Automatically",
    description: "FinSage extracts, cleans and categorizes your transactions into a clear, structured ledger.",
    tags: ["Smart categorization", "Clean data"],
    badgeBg: "#A855F7",
    badgeText: "#FFFFFF",
    cardBg: "linear-gradient(135deg, rgba(250, 245, 255, 0.95) 0%, rgba(243, 232, 255, 0.75) 100%)",
    cardBorder: "rgba(168, 85, 247, 0.35)",
    cardShadow: "0 10px 24px -4px rgba(168, 85, 247, 0.12), 0 4px 10px -2px rgba(24, 18, 43, 0.04)",
    illustrationType: "organize",
    stackedPills: [
      { label: "Food", iconType: "food", iconColor: "#EA580C" },
      { label: "Shopping", iconType: "shopping", iconColor: "#F97316" },
      { label: "Transport", iconType: "transport", iconColor: "#16A34A" },
    ],
  },
  {
    id: 3,
    stepNumber: "3",
    title: "Understand Your Spending",
    description: "Get clear insights with trends, charts and personalized analysis.",
    tags: ["Trends", "Patterns", "Insights"],
    badgeBg: "#EA580C",
    badgeText: "#FFFFFF",
    cardBg: "linear-gradient(135deg, rgba(255, 247, 237, 0.95) 0%, rgba(255, 237, 213, 0.75) 100%)",
    cardBorder: "rgba(249, 115, 22, 0.35)",
    cardShadow: "0 10px 24px -4px rgba(249, 115, 22, 0.12), 0 4px 10px -2px rgba(24, 18, 43, 0.04)",
    illustrationType: "understand",
    tilt: "rotate-[1.2deg]",
  },
  {
    id: 4,
    stepNumber: "4",
    title: "Plan & Set Goals",
    description: "Create budgets, set financial goals and explore what-if scenarios for a better future.",
    chips: [
      { label: "Budgets", circleColor: "#2563EB" },
      { label: "Goals", circleColor: "#9333EA" },
      { label: "What-if Planning", circleColor: "#16A34A" },
    ],
    badgeBg: "#2563EB",
    badgeText: "#FFFFFF",
    cardBg: "linear-gradient(135deg, rgba(239, 246, 255, 0.95) 0%, rgba(219, 234, 254, 0.75) 100%)",
    cardBorder: "rgba(59, 130, 246, 0.35)",
    cardShadow: "0 10px 24px -4px rgba(59, 130, 246, 0.12), 0 4px 10px -2px rgba(24, 18, 43, 0.04)",
    illustrationType: "goals",
  },
  {
    id: 5,
    stepNumber: "5",
    title: "Manage Shared Expenses",
    description: "Split rent, bills and shared expenses with family, friends or roommates.",
    tags: ["Split bills", "Track shares", "Settle easily"],
    badgeBg: "#F43F5E",
    badgeText: "#FFFFFF",
    cardBg: "linear-gradient(135deg, rgba(255, 241, 242, 0.95) 0%, rgba(255, 228, 230, 0.75) 100%)",
    cardBorder: "rgba(244, 63, 94, 0.35)",
    cardShadow: "0 10px 24px -4px rgba(244, 63, 94, 0.12), 0 4px 10px -2px rgba(24, 18, 43, 0.04)",
    illustrationType: "shared",
  },
  {
    id: 6,
    stepNumber: "6",
    title: "Get AI Guidance",
    description: "Ask anything and get personalized financial advice, rebalancing tips and the next best actions.",
    badgeBg: "#8B5CF6",
    badgeText: "#FFFFFF",
    cardBg: "linear-gradient(135deg, rgba(245, 243, 255, 0.95) 0%, rgba(237, 233, 254, 0.75) 100%)",
    cardBorder: "rgba(139, 92, 246, 0.35)",
    cardShadow: "0 10px 24px -4px rgba(139, 92, 246, 0.12), 0 4px 10px -2px rgba(24, 18, 43, 0.04)",
    illustrationType: "ai",
    stackedPills: [
      { label: "AI chat", iconType: "chat", iconColor: "#2563EB" },
      { label: "Smart suggestions", iconType: "bulb", iconColor: "#EAB308" },
      { label: "Actionable tips", iconType: "sparkle", iconColor: "#8B5CF6" },
    ],
  },
  {
    id: 7,
    stepNumber: "7",
    title: "Grow Your Financial Life",
    description: "Build better habits, track progress and make smarter moves for long-term wealth.",
    badgeBg: "#16A34A",
    badgeText: "#FFFFFF",
    cardBg: "linear-gradient(135deg, rgba(240, 253, 244, 0.95) 0%, rgba(220, 252, 231, 0.75) 100%)",
    cardBorder: "rgba(74, 222, 128, 0.35)",
    cardShadow: "0 10px 24px -4px rgba(74, 222, 128, 0.12), 0 4px 10px -2px rgba(24, 18, 43, 0.04)",
    illustrationType: "grow",
    stackedPills: [
      { label: "Wealth growth", iconType: "bars", iconColor: "#16A34A" },
      { label: "Long-term plans", iconType: "calendar", iconColor: "#2563EB" },
      { label: "Financial freedom", iconType: "star", iconColor: "#F59E0B" },
    ],
  },
];

export const ROW_1_STEPS = HOW_IT_WORKS_STEPS.slice(0, 4);
export const ROW_2_STEPS = HOW_IT_WORKS_STEPS.slice(4, 7);

export interface BenefitItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: "bars" | "shield" | "bolt" | "leaf";
  iconColor: string;
  iconBg: string;
}

export const BENEFITS_BAR_ITEMS: BenefitItem[] = [
  {
    id: "decisions",
    title: "Smarter Decisions",
    subtitle: "Backed by your real data",
    iconType: "bars",
    iconColor: "#16A34A",
    iconBg: "#DCFCE7",
  },
  {
    id: "confidence",
    title: "More Confidence",
    subtitle: "Know where your money goes",
    iconType: "shield",
    iconColor: "#7C3AED",
    iconBg: "#EDE9FE",
  },
  {
    id: "time",
    title: "Save Time",
    subtitle: "Less manual work",
    iconType: "bolt",
    iconColor: "#EA580C",
    iconBg: "#FFEDD5",
  },
  {
    id: "future",
    title: "A Brighter Future",
    subtitle: "Build the life you want",
    iconType: "leaf",
    iconColor: "#65A30D",
    iconBg: "#ECFCCB",
  },
];
