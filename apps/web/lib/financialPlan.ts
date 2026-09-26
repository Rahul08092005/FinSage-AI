/**
 * Financial Plan parsing and utility helpers.
 * Parses the structured Financial Plan section (Section 5 / Unified Financial Plan)
 * from the exported financial report markdown.
 */

export interface FinancialGoalPlan {
  name: string;
  target: number;
  saved: number;
  remaining: number;
  monthlySip: number;
  timeline: string;
  completionDate: string;
}

export interface FinancialPlanData {
  hasPlan: boolean;
  annualIncome?: number;
  current80c?: number;
  remaining80c?: number;
  oldRegimeSavings?: number;
  newRegimeSavings?: number;
  recommendedInstruments?: string;
  recommendedTotalSip?: number;
  equityElssSip?: number;
  debtPpfSip?: number;
  topGoal?: FinancialGoalPlan | null;
  allGoals?: FinancialGoalPlan[];
  rawMarkdown?: string;
}

export function parseFinancialPlanReport(markdown: string): FinancialPlanData {
  if (!markdown || typeof markdown !== "string") {
    return { hasPlan: false };
  }

  // Look for Section 5 / Unified Financial Plan / Financial Plan / Tax Optimization
  const planMatch = markdown.match(
    /(?:##\s*(?:\d+\.\s*)?Unified Financial Plan|##\s*Financial Plan|###\s*Tax Optimization)[\s\S]*/i
  );
  if (!planMatch) {
    return { hasPlan: false, rawMarkdown: markdown };
  }

  const sectionText = planMatch[0];

  function extractNum(regex: RegExp): number | undefined {
    const m = sectionText.match(regex);
    if (!m || !m[1]) return undefined;
    const clean = m[1].replace(/[^0-9.]/g, "");
    const val = parseFloat(clean);
    return isNaN(val) ? undefined : val;
  }

  function extractStr(regex: RegExp): string | undefined {
    const m = sectionText.match(regex);
    return m && m[1] ? m[1].trim() : undefined;
  }

  const annualIncome = extractNum(/\*\*Annual Gross Income\*\*:\s*([^\n]+)/i);
  const current80c = extractNum(/\*\*Current (?:Section )?80C Investments\*\*:\s*([^\n]+)/i);
  const remaining80c = extractNum(/\*\*Remaining (?:Section )?80C Capacity\*\*:\s*([^\n]+)/i);
  const oldRegimeSavings = extractNum(/\*\*Estimated Potential Tax Savings\*\*:\s*([^\n]+)/i);
  const recommendedInstruments = extractStr(
    /\*\*Recommended Tax-Advantaged Instruments\*\*:\s*([^\n]+)/i
  );

  const recommendedTotalSip = extractNum(/\*\*Recommended Total Monthly SIP\*\*:\s*([^\n]+)/i);
  const equityElssSip = extractNum(/\*\*Equity & ELSS Mutual Funds\*\*:\s*([^\n]+)/i);
  const debtPpfSip = extractNum(/\*\*Debt & PPF Long-Term Reserves\*\*:\s*([^\n]+)/i);

  // New regime Section 80C deductions do not apply under Section 115BAC
  const newRegimeSavings = 0;

  // Extract goals from Goal Timelines table
  const goals: FinancialGoalPlan[] = [];
  const tablePart = sectionText.match(/### Goal Timelines[\s\S]*?(?=(?:##|\Z))/i);
  if (tablePart) {
    const lines = tablePart[0].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        !trimmed.startsWith("|") ||
        trimmed.includes(":---") ||
        trimmed.toLowerCase().includes("goal name")
      ) {
        continue;
      }
      const cells = trimmed
        .split("|")
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

      if (cells.length >= 4 && cells[0] && !cells[0].toLowerCase().includes("no active goals")) {
        const parseCellNum = (cell: string) => {
          const val = parseFloat(cell.replace(/[^0-9.]/g, ""));
          return isNaN(val) ? 0 : val;
        };

        goals.push({
          name: cells[0],
          target: parseCellNum(cells[1] || "0"),
          saved: parseCellNum(cells[2] || "0"),
          remaining: parseCellNum(cells[3] || "0"),
          monthlySip: parseCellNum(cells[4] || "0"),
          timeline: cells[5] || "",
          completionDate: cells[6] || "",
        });
      }
    }
  }

  const topGoal = goals.length > 0 ? goals[0] : null;

  const hasAnyData =
    annualIncome !== undefined ||
    current80c !== undefined ||
    oldRegimeSavings !== undefined ||
    recommendedTotalSip !== undefined ||
    goals.length > 0;

  return {
    hasPlan: hasAnyData,
    annualIncome,
    current80c,
    remaining80c,
    oldRegimeSavings,
    newRegimeSavings,
    recommendedInstruments,
    recommendedTotalSip,
    equityElssSip,
    debtPpfSip,
    topGoal,
    allGoals: goals,
    rawMarkdown: sectionText,
  };
}
