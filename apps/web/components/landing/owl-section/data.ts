import { OWL_ASSETS } from "@/lib/owlAssets";

export interface OwlFeatureCardData {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly iconPath: string;
  readonly cardGradient: string;
  readonly borderColor: string;
  readonly buttonBg: string;
  readonly glowColor: string;
  readonly linkTarget?: string;
  readonly position: {
    readonly left: string;
    readonly top: string;
    readonly width: string;
    readonly height: string;
  };
}

export const OWL_FEATURE_CARDS: readonly OwlFeatureCardData[] = [
  {
    id: "capture",
    title: "Capture Expenses",
    body: "Upload receipts, payment screenshots or bank PDFs. We extract and organize it for you.",
    iconPath: OWL_ASSETS.icons.capture,
    cardGradient: "bg-gradient-to-br from-[#FFFDF9] via-[#FFF8F3] to-[#FFF1E8]",
    borderColor: "border-[#FDBA74]/50 hover:border-[#FB923C]/80",
    buttonBg: "bg-[#F97316] hover:bg-[#EA580C]",
    glowColor: "bg-[#FB923C]/25",
    linkTarget: "#ocr",
    position: {
      left: "5.9%",
      top: "24.8%",
      width: "22.9%",
      height: "18.2%",
    },
  },
  {
    id: "track",
    title: "Track Spending",
    body: "See where your money goes with smart categorization and clear insights.",
    iconPath: OWL_ASSETS.icons.track,
    cardGradient: "bg-gradient-to-br from-[#FCFAFF] via-[#F8F3FF] to-[#F1E7FE]",
    borderColor: "border-[#D8B4FE]/50 hover:border-[#C084FC]/80",
    buttonBg: "bg-[#9333EA] hover:bg-[#7E22CE]",
    glowColor: "bg-[#A855F7]/25",
    linkTarget: "#showcase",
    position: {
      left: "28.8%",
      top: "11%",
      width: "20.9%",
      height: "18.7%",
    },
  },
  {
    id: "goals",
    title: "Set & Achieve Goals",
    body: "Save for what matters with personalized plans and progress tracking.",
    iconPath: OWL_ASSETS.icons.goals,
    cardGradient: "bg-gradient-to-br from-[#F8FDF9] via-[#F0FBF4] to-[#E3F8EB]",
    borderColor: "border-[#86EFAC]/50 hover:border-[#4ADE80]/80",
    buttonBg: "bg-[#10B981] hover:bg-[#059669]",
    glowColor: "bg-[#34D399]/25",
    linkTarget: "#showcase",
    position: {
      left: "54%",
      top: "11.3%",
      width: "20.9%",
      height: "19%",
    },
  },
  {
    id: "household",
    title: "Manage Household",
    body: "Split rent, bills and shared expenses with family or roommates.",
    iconPath: OWL_ASSETS.icons.household,
    cardGradient: "bg-gradient-to-br from-[#FFFDF5] via-[#FFFBE8] to-[#FFF6D4]",
    borderColor: "border-[#FDE047]/50 hover:border-[#FACC15]/80",
    buttonBg: "bg-[#F59E0B] hover:bg-[#D97706]",
    glowColor: "bg-[#FBBF24]/25",
    linkTarget: "#splitwise",
    position: {
      left: "73.3%",
      top: "32.2%",
      width: "21.7%",
      height: "19.6%",
    },
  },
  {
    id: "plan",
    title: "Plan & Optimize",
    body: "Run what-if scenarios, explore outcomes and find the best financial moves.",
    iconPath: OWL_ASSETS.icons.plan,
    cardGradient: "bg-gradient-to-br from-[#F8FBFF] via-[#EEF6FF] to-[#E1EFFF]",
    borderColor: "border-[#93C5FD]/50 hover:border-[#60A5FA]/80",
    buttonBg: "bg-[#0284C7] hover:bg-[#0369A1]",
    glowColor: "bg-[#38BDF8]/25",
    linkTarget: "#showcase",
    position: {
      left: "4.3%",
      top: "47.1%",
      width: "23.4%",
      height: "18.5%",
    },
  },
  {
    id: "ai",
    title: "Get AI Guidance",
    body: "Ask anything, get personalized insights and smarter financial advice.",
    iconPath: OWL_ASSETS.icons.ai,
    cardGradient: "bg-gradient-to-br from-[#FFF6F8] via-[#FFECF2] to-[#FFE0EB]",
    borderColor: "border-[#F472B6]/50 hover:border-[#EC4899]/80",
    buttonBg: "bg-[#EC4899] hover:bg-[#DB2777]",
    glowColor: "bg-[#F472B6]/25",
    linkTarget: "#advisor",
    position: {
      left: "73.4%",
      top: "59.3%",
      width: "21.7%",
      height: "19.9%",
    },
  },
  {
    id: "insights",
    title: "Discover Insights",
    body: "Get trend analysis, spending patterns and actions to improve your financial health.",
    iconPath: OWL_ASSETS.icons.insights,
    cardGradient: "bg-gradient-to-br from-[#FAFEED] via-[#F4FDCF] to-[#E9FABA]",
    borderColor: "border-[#BEF264]/50 hover:border-[#A3E635]/80",
    buttonBg: "bg-[#84CC16] hover:bg-[#65A30D]",
    glowColor: "bg-[#A3E635]/25",
    linkTarget: "#showcase",
    position: {
      left: "7.8%",
      top: "70%",
      width: "24%",
      height: "18%",
    },
  },
] as const;

export interface FloatingDecorItem {
  readonly id: string;
  readonly imagePath: string;
  readonly width: number;
  readonly height: number;
  readonly animType: "slow" | "medium" | "fast";
  readonly animDelay: string;
  readonly style: {
    readonly left: string;
    readonly top: string;
    readonly width: string;
    readonly transform?: string;
    readonly zIndex?: number;
    readonly opacity?: number;
  };
}

export const FLOATING_DECOR: readonly FloatingDecorItem[] = [
  {
    id: "decor-chart",
    imagePath: OWL_ASSETS.decor.chart,
    width: 348,
    height: 368,
    animType: "slow",
    animDelay: "0.2s",
    style: {
      left: "34.0%",
      top: "37.5%",
      width: "5.4%",
      transform: "rotate(-6deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-pie",
    imagePath: OWL_ASSETS.decor.pie,
    width: 343,
    height: 367,
    animType: "medium",
    animDelay: "0.8s",
    style: {
      left: "61.5%",
      top: "39.5%",
      width: "5.2%",
      transform: "rotate(8deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-coin-top",
    imagePath: OWL_ASSETS.decor.coin2,
    width: 304,
    height: 341,
    animType: "fast",
    animDelay: "0.4s",
    style: {
      left: "38.0%",
      top: "49.5%",
      width: "3.8%",
      transform: "rotate(14deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-card",
    imagePath: OWL_ASSETS.decor.card,
    width: 370,
    height: 387,
    animType: "slow",
    animDelay: "1.1s",
    style: {
      left: "34.5%",
      top: "56.0%",
      width: "6.8%",
      transform: "rotate(-12deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-cube",
    imagePath: OWL_ASSETS.decor.cube,
    width: 286,
    height: 381,
    animType: "fast",
    animDelay: "0.6s",
    style: {
      left: "66.0%",
      top: "52.5%",
      width: "3.2%",
      transform: "rotate(18deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-coin-right",
    imagePath: OWL_ASSETS.decor.coin2,
    width: 304,
    height: 341,
    animType: "medium",
    animDelay: "1.4s",
    style: {
      left: "63.0%",
      top: "65.0%",
      width: "4.2%",
      transform: "rotate(-10deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-gem",
    imagePath: OWL_ASSETS.decor.gem,
    width: 379,
    height: 375,
    animType: "slow",
    animDelay: "0.9s",
    style: {
      left: "33.8%",
      top: "70.5%",
      width: "3.4%",
      transform: "rotate(12deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-coin-bottom",
    imagePath: OWL_ASSETS.decor.coin1,
    width: 311,
    height: 354,
    animType: "fast",
    animDelay: "1.6s",
    style: {
      left: "39.0%",
      top: "70.0%",
      width: "3.8%",
      transform: "rotate(-6deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-sparkle-1",
    imagePath: OWL_ASSETS.decor.sparkle,
    width: 285,
    height: 377,
    animType: "medium",
    animDelay: "0.3s",
    style: {
      left: "60.0%",
      top: "35.5%",
      width: "2.0%",
      transform: "rotate(4deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-sparkle-2",
    imagePath: OWL_ASSETS.decor.sparkle,
    width: 285,
    height: 377,
    animType: "slow",
    animDelay: "1.2s",
    style: {
      left: "61.6%",
      top: "52.0%",
      width: "1.8%",
      transform: "rotate(-8deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-sparkle-3",
    imagePath: OWL_ASSETS.decor.sparkle,
    width: 285,
    height: 377,
    animType: "fast",
    animDelay: "0.7s",
    style: {
      left: "27.8%",
      top: "13.0%",
      width: "1.9%",
      transform: "rotate(6deg)",
      zIndex: 15,
    },
  },
] as const;
