import { OWL_ASSETS } from "@/lib/owlAssets";

export const OWL_FRONT_ASSETS = {
  base: "/owl/owl-front-blank.png",
  iris: "/owl/iris-front.png",
  original: "/owl/owl-front.png",
  naturalDimensions: {
    width: 1156,
    height: 1361,
  },
  irisNaturalDimensions: {
    width: 256,
    height: 256,
  },
} as const;

export interface OwlFeatureCardData {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly iconPath: string;
  readonly cardGradient: string;
  readonly borderColor: string;
  readonly buttonBg: string;
  readonly glowColor: string;
  readonly accentColor: string;
  readonly description: string;
  readonly bullets: readonly [string, string, string];
  readonly ctaText: string;
  readonly ctaHref: string;
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
    accentColor: "#F97316",
    description: "Turn paper receipts, payment screenshots and bank statements into clean, structured records in seconds. Powered by intelligent OCR with confidence scoring, you stay in total control of every entry before it hits your ledger.",
    bullets: [
      "Drop a receipt, payment screenshot or bank statement (PDF, PNG, JPG or CSV)",
      "OCR reads amounts, dates and merchants and scores its own confidence",
      "Review anything uncertain, then confirm it into your ledger",
    ],
    ctaText: "Upload a document",
    ctaHref: "/documents",
    position: {
      left: "98px",
      top: "233px",
      width: "383px",
      height: "171px",
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
    accentColor: "#9333EA",
    description: "Gain instant clarity over your cash flow with automatic categorization and real-time breakdowns. Filter transactions by date, category or account to see exactly where every rupee goes without tedious manual spreadsheets.",
    bullets: [
      "Add transactions or bulk-import a CSV",
      "Automatic categorization, filterable by category and date",
      "Category breakdown and monthly spending at a glance",
    ],
    ctaText: "Open transactions",
    ctaHref: "/transactions",
    position: {
      left: "482px",
      top: "104px",
      width: "350px",
      height: "176px",
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
    accentColor: "#10B981",
    description: "Define personalized savings targets for emergencies, vacations or big life purchases with dedicated milestones. Watch live projected completion dates adjust automatically as your real-world savings grow.",
    bullets: [
      "Create savings goals with a target amount and date",
      "See a projected completion date based on your real net savings",
      "Track progress as your money moves",
    ],
    ctaText: "Set a goal",
    ctaHref: "/goals",
    position: {
      left: "903px",
      top: "106px",
      width: "350px",
      height: "179px",
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
    accentColor: "#F59E0B",
    description: "Eliminate awkward money talks by sharing bills, rent and household groceries with flatmates or family in one shared hub. Keep running balances transparent so everyone knows who owes whom with single-tap settlements.",
    bullets: [
      "See shared group expenses and who owes whom",
      "Split rent, groceries and bills with flatmates or family",
      "Keep unsettled balances visible next to your own spending",
    ],
    ctaText: "Open transactions",
    ctaHref: "/transactions",
    position: {
      left: "1226px",
      top: "303px",
      width: "363px",
      height: "184px",
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
    accentColor: "#0284C7",
    description: "Take the guesswork out of monthly budgeting with dynamic category limits and live variance gauges. Leverage moving-average forecasts and tailored recommendations drawn directly from your genuine spending history.",
    bullets: [
      "Monthly limits per category with live variance gauges",
      "Moving-average expense forecasts",
      "Budget suggestions based on your spending history",
    ],
    ctaText: "Open budgets",
    ctaHref: "/budgets",
    position: {
      left: "72px",
      top: "443px",
      width: "392px",
      height: "174px",
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
    accentColor: "#EC4899",
    description: "Receive unbiased financial insights tailored to your specific balances, spending habits and future aspirations. Explore Safe, Growth and Balanced perspectives side by side with citations directly sourced from your ledger.",
    bullets: [
      "Ask anything about your money and watch answers stream in live",
      "Answers show their sources so you can check them",
      "Compare Safe, Growth and Balanced perspectives side by side",
    ],
    ctaText: "Ask the Advisor",
    ctaHref: "/advisor",
    position: {
      left: "1227px",
      top: "558px",
      width: "362px",
      height: "187px",
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
    accentColor: "#84CC16",
    description: "Uncover hidden patterns in your lifestyle with proactive anomaly alerts and an overarching financial health score. Generate executive summary reports ready for export whenever you need a comprehensive big-picture review.",
    bullets: [
      "A financial health score for your overall picture",
      "Spending anomaly detection that flags unusual charges",
      "Export an executive report as a Markdown file",
    ],
    ctaText: "Open dashboard",
    ctaHref: "/dashboard",
    position: {
      left: "130px",
      top: "659px",
      width: "401px",
      height: "170px",
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
  readonly depth: number;
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
    depth: 0.8,
    style: {
      left: "560px",
      top: "350px",
      width: "90px",
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
    depth: 0.7,
    style: {
      left: "1030px",
      top: "365px",
      width: "90px",
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
    depth: 1.2,
    style: {
      left: "630px",
      top: "465px",
      width: "64px",
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
    depth: 0.9,
    style: {
      left: "575px",
      top: "530px",
      width: "115px",
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
    depth: 1.3,
    style: {
      left: "1100px",
      top: "490px",
      width: "55px",
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
    depth: 1.1,
    style: {
      left: "1050px",
      top: "610px",
      width: "70px",
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
    depth: 0.6,
    style: {
      left: "565px",
      top: "660px",
      width: "60px",
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
    depth: 1.0,
    style: {
      left: "650px",
      top: "660px",
      width: "65px",
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
    depth: 0.5,
    style: {
      left: "1005px",
      top: "330px",
      width: "32px",
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
    depth: 0.4,
    style: {
      left: "1030px",
      top: "490px",
      width: "28px",
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
    depth: 0.5,
    style: {
      left: "465px",
      top: "115px",
      width: "32px",
      transform: "rotate(6deg)",
      zIndex: 15,
    },
  },
] as const;
