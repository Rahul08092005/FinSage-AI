import { OWL_ASSETS } from "@/lib/owlAssets";

export interface OwlFeatureCardData {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly iconPath: string;
  readonly iconBg: string;
  readonly linkTarget?: string;
  readonly badgeText?: string;
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
    iconBg: "bg-[#F3E8FF]",
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
    iconBg: "bg-[#EDE9FE]",
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
    iconBg: "bg-[#ECFDF5]",
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
    iconBg: "bg-[#FEF3C7]",
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
    iconBg: "bg-[#EFF6FF]",
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
    iconBg: "bg-[#F0FDF4]",
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
    iconBg: "bg-[#FEFCE8]",
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
    style: {
      left: "28.5%",
      top: "33.5%",
      width: "4.8%",
      transform: "rotate(-8deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-coin-1",
    imagePath: OWL_ASSETS.decor.coin1,
    width: 311,
    height: 354,
    style: {
      left: "49.2%",
      top: "8.5%",
      width: "4.2%",
      transform: "rotate(6deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-pie",
    imagePath: OWL_ASSETS.decor.pie,
    width: 343,
    height: 367,
    style: {
      left: "67.8%",
      top: "23.5%",
      width: "5.0%",
      transform: "rotate(8deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-card",
    imagePath: OWL_ASSETS.decor.card,
    width: 370,
    height: 387,
    style: {
      left: "30.5%",
      top: "56.5%",
      width: "5.6%",
      transform: "rotate(10deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-sparkle-1",
    imagePath: OWL_ASSETS.decor.sparkle,
    width: 285,
    height: 377,
    style: {
      left: "69.5%",
      top: "52.8%",
      width: "3.6%",
      transform: "rotate(-5deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-coin-2",
    imagePath: OWL_ASSETS.decor.coin2,
    width: 304,
    height: 341,
    style: {
      left: "64.2%",
      top: "69.5%",
      width: "4.4%",
      transform: "rotate(-12deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-cube",
    imagePath: OWL_ASSETS.decor.cube,
    width: 286,
    height: 381,
    style: {
      left: "32.5%",
      top: "74.0%",
      width: "4.0%",
      transform: "rotate(14deg)",
      zIndex: 15,
    },
  },
  {
    id: "decor-gem",
    imagePath: OWL_ASSETS.decor.gem,
    width: 379,
    height: 375,
    style: {
      left: "35.5%",
      top: "22.0%",
      width: "4.2%",
      transform: "rotate(-10deg)",
      zIndex: 15,
    },
  },
] as const;
