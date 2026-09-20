export interface FormatINROptions {
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

const defaultINRFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * Standardizes Indian currency formatting using the browser Intl.NumberFormat API.
 * Uses Indian numbering grouping (lakhs/crores), e.g.:
 * - formatINR(100000) -> "₹1,00,000"
 * - formatINR(1250000) -> "₹12,50,000"
 * - formatINR(10000000) -> "₹1,00,00,000"
 */
export function formatINR(amount: number | string | null | undefined, options?: FormatINROptions): string {
  if (amount === null || amount === undefined || amount === "") {
    return "";
  }

  const num = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(num)) {
    return "";
  }

  if (options) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
    }).format(num);
  }

  return defaultINRFormatter.format(num);
}
