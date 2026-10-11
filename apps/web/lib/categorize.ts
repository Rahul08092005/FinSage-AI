export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Dining": [
    "food", "dinner", "lunch", "breakfast", "snack", "snacks",
    "restaurant", "cafe", "coffee", "tea", "chai", "pizza",
    "burger", "biryani", "swiggy", "swiggy dineout", "dineout",
    "bundl technologies", "zomato", "eternal limited", "eatsure",
    "dominos", "jubilant foodworks", "pizza hut", "mcdonalds",
    "kfc", "burger king", "subway", "starbucks", "chai point",
    "third wave coffee", "barbeque nation", "haldirams", "behrouz",
    "faasos", "box8", "magicpin food", "sweets", "bakery", "juice",
    "ice cream", "dessert", "canteen", "mess", "tiffin", "eating out",
    "takeaway",
  ],
  "Groceries": [
    "grocery", "groceries", "vegetables", "veggies", "fruits",
    "milk", "bread", "eggs", "rice", "atta", "dal", "oil",
    "kirana", "supermarket", "blinkit", "grofers", "zepto",
    "kiranakart", "swiggy instamart", "instamart", "bigbasket",
    "innovative retail", "dmart", "avenue supermarts", "jiomart",
    "reliance fresh", "more retail", "nature's basket", "licious",
    "freshtohome", "milkbasket", "country delight", "provisions",
  ],
  "Entertainment": [
    "movie", "movies", "cinema", "film", "pvr", "inox", "pvr inox",
    "cinepolis", "bookmyshow", "big tree entertainment", "paytm insider",
    "district", "concert", "game", "gaming", "gamer", "party",
    "club", "pub", "bar", "bowling", "amusement", "theme park",
    "event", "show", "ott ticket", "movie ticket", "cinema ticket",
  ],
  "Shopping": [
    "shopping", "clothes", "shirt", "tshirt", "jeans", "shoes",
    "sneakers", "dress", "amazon", "amazon pay", "flipkart",
    "myntra", "ajio", "meesho", "nykaa", "tata cliq", "snapdeal",
    "decathlon", "lifestyle", "westside", "pantaloons", "zudio",
    "croma", "reliance digital", "ikea", "lenskart", "mall",
    "gadget", "headphones", "watch", "bag", "accessories",
    "electronics", "gift",
  ],
  "Rent": [
    "rent", "house rent", "room rent", "pg", "hostel",
    "nobroker", "cred rent", "paytm rent", "rentomojo", "housing rent",
    "landlord", "lease", "deposit", "maintenance charge", "society",
  ],
  "Utilities": [
    "electricity", "electric", "power bill", "water bill", "gas bill",
    "lpg", "cylinder", "wifi", "broadband", "internet", "recharge",
    "mobile bill", "phone bill", "postpaid", "prepaid", "bescom",
    "tneb", "msedcl", "tata power", "adani electricity", "bses",
    "airtel", "bharti airtel", "jio", "reliance jio", "vodafone idea",
    "vi", "bsnl", "act fibernet", "hathway", "dth", "tata play",
    "dish tv", "indane", "hp gas", "bharat gas", "bwssb",
    "mahanagar gas", "piped gas", "utility", "utilities",
  ],
  "Travel": [
    "fuel", "fuelling", "petrol", "diesel", "cng", "gas station",
    "ev charging", "travel", "trip", "flight", "train", "bus",
    "metro", "cab", "taxi", "uber", "uber india", "ola",
    "ani technologies", "rapido", "namma yatri", "auto", "rickshaw",
    "toll", "fastag", "fastag recharge", "netc", "parking",
    "irctc", "redbus", "abhibus", "makemytrip", "goibibo",
    "cleartrip", "ixigo", "indigo", "air india", "spicejet",
    "akasa", "vistara", "yatra", "hotel", "hostel stay", "airbnb",
    "ticket", "commute", "bike service", "car service", "vehicle",
    "indian oil", "iocl", "hp petrol", "hp petrol pump", "petrol pump",
    "bharat petroleum", "bpcl", "hpcl", "shell", "nayara",
    "bmtc", "ksrtc", "namma metro",
  ],
  "Healthcare": [
    "doctor", "hospital", "clinic", "medicine", "medicines",
    "pharmacy", "medical", "chemist", "apollo", "apollo pharmacy",
    "apollo hospitals", "medplus", "pharmeasy", "tata 1mg", "1mg",
    "netmeds", "practo", "fortis", "manipal", "max healthcare",
    "narayana", "aster", "dr lal", "thyrocare", "metropolis",
    "diagnostics", "tablet", "tablets", "checkup", "health",
    "dental", "dentist", "lab test", "blood test", "scan", "xray",
    "insurance premium", "physio", "eye", "glasses", "vaccine",
  ],
  "Subscriptions": [
    "subscription", "netflix", "prime", "amazon prime", "prime video",
    "hotstar", "jiohotstar", "disney", "spotify", "youtube premium",
    "google youtube", "yt premium", "apple.com/bill", "apple services",
    "itunes", "apple music", "icloud", "google one", "google play",
    "openai", "chatgpt", "anthropic", "claude", "notion", "canva",
    "adobe", "microsoft 365", "gym membership", "membership",
    "annual plan", "monthly plan", "renewal", "sonyliv", "zee5",
    "audible", "linkedin premium", "cult.fit", "cultfit", "gym",
  ],
  "General": [],
};

/**
 * Short or ambiguous keywords that must be whole-word match only,
 * never prefix or substring, to avoid false positives (e.g. autopay, kolkata, visa).
 */
export const AMBIGUOUS_KEYWORDS = new Set([
  "ola", "vi", "auto", "bar", "pg", "eye", "oil", "tea", "bus",
  "gas", "power", "show", "event", "watch", "bag", "club",
  "game", "shell", "lifestyle", "jio", "prime",
]);

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalises an input string: lowercases, converts non-alphanumeric to spaces,
 * and collapses multiple whitespace characters.
 */
function normalizeInput(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips noise, metadata, UPI handles, transaction IDs, banking terms,
 * dates, and non-alphanumeric noise from SMS text.
 */
export function cleanSmsText(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text.toLowerCase();

  // Strip UPI IDs / VPA handles: e.g. name@oksbi, user@ybl, merchant@paytm
  cleaned = cleaned.replace(/[\w.-]+@(oksbi|ybl|paytm|okaxis|okhdfcbank|okicici|upi|apl|axl|ibl|barodampay|icici|sbi|hdfcbank)/gi, " ");
  cleaned = cleaned.replace(/[\w.-]+@[a-z0-9.-]+/gi, " ");

  // Strip UPI tags with IDs: e.g. upi:131218382962, upi/131218382962, upi ref 123
  cleaned = cleaned.replace(/\bupi[:\s/]+[a-z0-9]+/gi, " ");

  // Strip dates like: 03-oct-26, 11/10/2026, on 03-oct-26
  cleaned = cleaned.replace(/\bon\s+\d{1,2}[-/]\w{3,}[-/]?\d*/gi, " ");
  cleaned = cleaned.replace(/\bon\s+\d{1,2}[-/]\d{1,2}[-/]?\d*/gi, " ");
  cleaned = cleaned.replace(/\b\d{1,2}[-/][a-z]{3,}[-/]?\d*/gi, " ");
  cleaned = cleaned.replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/gi, " ");

  // Strip long digit strings (account numbers, reference/UTR IDs, timestamps)
  cleaned = cleaned.replace(/\b\d{4,}\b/g, " ");

  // Strip currency amounts like Rs. 450, Rs 1400.00, INR 500, ₹450
  cleaned = cleaned.replace(/(?:rs\.?|inr|₹)\s*[\d,]+(?:\.\d{1,2})?/gi, " ");

  // Noise keywords specific to Indian banking SMS
  const noiseTerms = [
    "thru", "via", "upi", "ref no", "ref", "txn id", "txnid", "txn", "utr",
    "imps", "neft", "rtgs", "debited", "credited", "a/c", "acct", "account",
    "bank", "rs", "inr", "avl bal", "avl", "balance", "bal", "vpa",
    "towards", "for", "from", "to", "at", "on", "dated",
  ];

  for (const term of noiseTerms) {
    const termRegex = new RegExp(`(^|\\s)${escapeRegExp(term)}(\\s|$)`, "gi");
    cleaned = cleaned.replace(termRegex, " ");
  }

  // Replace punctuation/symbols with spaces and collapse whitespace
  return cleaned
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Suggests an existing category based on keywords in the text.
 * Returns the matching category string or null if no match is found.
 */
export function suggestCategory(text: string | null | undefined): string | null {
  if (!text || typeof text !== "string") {
    return null;
  }

  const normalized = normalizeInput(text);

  // Edge cases: empty or digits/symbols only
  if (!normalized || !/[a-z]/.test(normalized)) {
    return null;
  }

  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  const categories = Object.keys(CATEGORY_KEYWORDS);
  interface CategoryScore {
    category: string;
    hits: number;
    earliestIndex: number;
    order: number;
  }

  const scores: CategoryScore[] = [];

  categories.forEach((category, order) => {
    const keywords = CATEGORY_KEYWORDS[category];
    if (!keywords || keywords.length === 0) return;

    let hits = 0;
    let earliestIndex = Infinity;
    const matchedTokens = new Set<string>();

    for (const kw of keywords) {
      if (kw.includes(" ")) {
        // Multi-word keyword: match phrase with word boundaries
        const phraseRegex = new RegExp(`(^|\\s)${escapeRegExp(kw)}(\\s|$)`);
        if (phraseRegex.test(normalized)) {
          // Multi-word phrase hit carries priority (+2 hits)
          hits += 2;
          const idx = normalized.indexOf(kw);
          if (idx !== -1 && idx < earliestIndex) {
            earliestIndex = idx;
          }
        }
      } else {
        // Single-word keyword:
        // Exact match or prefix match for non-ambiguous keywords of 5+ characters
        for (const token of tokens) {
          const isExact = token === kw;
          const isPrefix =
            kw.length >= 5 &&
            !AMBIGUOUS_KEYWORDS.has(kw) &&
            token.startsWith(kw);

          if (isExact || isPrefix) {
            if (!matchedTokens.has(token)) {
              matchedTokens.add(token);
              hits += 1;
              const idx = normalized.indexOf(token);
              if (idx !== -1 && idx < earliestIndex) {
                earliestIndex = idx;
              }
            }
          }
        }
      }
    }

    if (hits > 0) {
      scores.push({
        category,
        hits,
        earliestIndex,
        order,
      });
    }
  });

  if (scores.length === 0) {
    return null;
  }

  // Sort by:
  // 1. Most keyword hits (descending)
  // 2. Earliest matched index (ascending)
  // 3. Category definition order (ascending)
  scores.sort((a, b) => {
    if (b.hits !== a.hits) return b.hits - a.hits;
    if (a.earliestIndex !== b.earliestIndex) return a.earliestIndex - b.earliestIndex;
    return a.order - b.order;
  });

  return scores[0].category;
}

/**
 * Suggests category for a bank/UPI SMS:
 * 1. Primary: matches extracted merchant/description
 * 2. Fallback: matches cleaned SMS body
 * 3. Default: returns "General"
 */
export function suggestCategoryFromSms(
  merchantOrDescription?: string | null,
  rawSmsBody?: string | null
): string {
  // 1. Primary: check extracted merchant / description
  if (merchantOrDescription) {
    const cleanedMerchant = cleanSmsText(merchantOrDescription);
    const matchCleanedMerchant = suggestCategory(cleanedMerchant);
    if (matchCleanedMerchant) return matchCleanedMerchant;

    const matchRawMerchant = suggestCategory(merchantOrDescription);
    if (matchRawMerchant) return matchRawMerchant;
  }

  // 2. Fallback: check cleaned SMS body if merchant gave no match
  if (rawSmsBody) {
    const cleanedBody = cleanSmsText(rawSmsBody);
    const matchCleanedBody = suggestCategory(cleanedBody);
    if (matchCleanedBody) return matchCleanedBody;
  }

  // 3. Default to General
  return "General";
}
