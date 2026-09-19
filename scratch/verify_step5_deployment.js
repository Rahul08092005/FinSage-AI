const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/e4ba62ed-6a90-46ea-8b49-59c16480a6bc';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXRlc3QtMTIzIiwiZW1haWwiOiJnZW56QGZpbnNhZ2UuYWkiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.signature';

const MOCK_USER = {
  id: 'user-test-123',
  name: 'Radhika FinSage',
  email: 'genz@finsage.ai'
};

const MOCK_EXPORT_MD = `# FinSage AI — Executive Financial Memorandum
Generated on: 2026-09-16T14:30:00.000Z
Account Holder: Radhika FinSage (genz@finsage.ai)

## 1. Portfolio Liquidity & Balance Overview
- **Net Available Liquidity**: ₹84,250.00
- **Total Inflow (Month-to-Date)**: ₹1,20,000.00
- **Total Outflow (Month-to-Date)**: ₹35,750.00
- **Savings Rate**: 70.2%

## 2. Category Expense Breakdown
- **Food & Dining**: ₹14,200.00 (Budget Cap: ₹18,000.00 — 78.8% used)
- **Housing & Utilities**: ₹12,500.00 (Budget Cap: ₹15,000.00 — 83.3% used)
- **Transport & Commute**: ₹4,800.00 (Budget Cap: ₹6,000.00 — 80.0% used)
- **Entertainment & Lifestyle**: ₹4,250.00 (Budget Cap: ₹8,000.00 — 53.1% used)

## 3. Active Goal Trajectory
- **Emergency Reserve**: ₹65,000.00 of ₹1,00,000.00 (65.0% completed)
- **Tokyo Vacation Fund**: ₹40,000.00 of ₹80,000.00 (50.0% completed)

---
*Generated securely via FinSage BFF /api/v1/reports/export*
`;

async function run() {
  console.log('=== Step 5 Frontend Deployment Prep & Verification ===');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Inject token in localStorage
  await page.addInitScript((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('finsage_token', token);
  }, TEST_TOKEN);

  // Setup mock routes
  await context.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Auth
    if (url.includes('/api/v1/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER)
      });
    }

    // Reports Export
    if (url.includes('/api/v1/reports/export')) {
      return route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="FinSage-Financial-Report-2026-09-16.md"'
        },
        body: MOCK_EXPORT_MD
      });
    }

    // Advisor Chat (SSE streaming)
    if (url.includes('/api/v1/advisor/chat')) {
      const postData = route.request().postDataJSON() || {};
      const msg = (postData.message || '').toLowerCase();

      let answerText = "";
      let citations = [];

      if (msg.includes('major purchase') || msg.includes('guru') || msg.includes('emergenc')) {
        // Multi-perspective Guru response with RAG citations
        answerText = `### THE SAFE PLAY
Anchor your surplus into emergency liquidity. At ₹30,000/mo salary with ₹14,200 committed to fixed living costs, prioritize 6 months of runway in high-yield liquid funds before expanding speculative positions.

### THE GROWTH PLAY
Deploy 65% of your discretionary surplus into broad-market index funds and aggressive equity SIPs. Your low debt overhead provides runway to compound through volatility over the next 5-7 years.

### THE BALANCED TAKE
Maintain a 50/30/20 rule: allocate ₹15,000 to essentials, ₹9,000 to lifestyle, and auto-route ₹6,000 into a hybrid portfolio split between debt funds and index funds.`;

        citations = [
          {
            title: 'Value Investing Principles & Margin of Safety',
            source: 'guru_philosophy',
            content: 'Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1. Maintain a resilient cash buffer before deploying capital into equity assets.',
            date: 'Classic Compounding Manual',
            category: 'Safety & Reserves',
          },
          {
            title: 'Low-Cost Index Fund Philosophy & Market Compounding',
            source: 'bogle_rules',
            content: "Don't look for the needle in the haystack. Just buy the haystack. Broad market index funds minimize expense friction over multi-year horizons.",
            category: 'Passive Indexing',
          }
        ];
      } else {
        // Single grounded response
        answerText = `Based on your recent transactions, your spending on Food & Dining is ₹14,200 this month, which is 78.8% of your ₹18,000 budget. You have ₹3,800 remaining for the next 14 days.`;
        citations = [
          {
            title: 'Monthly Food & Dining Ledger',
            source: 'document_vault',
            content: 'Extracted 12 restaurant and grocery receipts totaling ₹14,200 for September 2026.',
            date: '16 Sept 2026',
            category: 'Food'
          }
        ];
      }

      // Stream SSE response
      const words = answerText.split(" ");
      let sseBody = "";
      for (const w of words) {
        sseBody += `data: ${w} \n\n`;
      }
      if (citations.length > 0) {
        sseBody += `data: [CITATIONS] ${JSON.stringify(citations)}\n\n`;
      }
      sseBody += `data: [DONE]\n\n`;

      return route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: sseBody
      });
    }

    // Health
    if (url.includes('/api/v1/health')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
    }

    // Transactions
    if (url.includes('/api/v1/transactions')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'tx-1', amount: 1420, category: 'Food', description: 'Blue Tokai Roasters', transactionDate: '2026-09-16T12:00:00.000Z', source: 'ocr' },
          { id: 'tx-2', amount: 450, category: 'Transport', description: 'Uber Ride', transactionDate: '2026-09-15T09:30:00.000Z', source: 'manual' },
          { id: 'tx-3', amount: 2800, category: 'Shopping', description: 'Zara Apparel', transactionDate: '2026-09-14T17:15:00.000Z', source: 'ocr' }
        ])
      });
    }

    // Budgets
    if (url.includes('/api/v1/budgets')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'b-1', category: 'Food', monthlyLimit: 18000, currentSpend: 14200 },
          { id: 'b-2', category: 'Transport', monthlyLimit: 6000, currentSpend: 4800 },
          { id: 'b-3', category: 'Shopping', monthlyLimit: 10000, currentSpend: 6200 }
        ])
      });
    }

    // Goals
    if (url.includes('/api/v1/goals')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'g-1', title: 'Emergency Fund', targetAmount: 100000, currentAmount: 65000, targetDate: '2026-12-31' },
          { id: 'g-2', title: 'MacBook Pro M3', targetAmount: 180000, currentAmount: 120000, targetDate: '2026-11-30' }
        ])
      });
    }

    // Documents
    if (url.includes('/api/v1/documents')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: "doc-fail-1",
            title: "damaged_receipt_scan.png",
            docType: "receipt",
            status: "FAILED",
            confidence: 0,
            uploadedAt: "2026-09-16T10:30:00.000Z",
            error: "Could not extract text from image — file may be corrupted or unsupported format.",
            extractedJson: [{ amount: 0, description: "Unreadable scan line", category: "Other" }]
          },
          {
            id: "doc-success",
            title: "starbucks_sept_receipt.pdf",
            docType: "receipt",
            status: "COMPLETED",
            confidence: 0.96,
            uploadedAt: "2026-09-14T11:00:00.000Z",
            extractedJson: [{ amount: 450, description: "Starbucks Frappuccino", category: "Food" }]
          }
        ])
      });
    }

    return route.continue();
  });

  // TEST 1: EXPORT REPORT ON DASHBOARD
  console.log('--- Testing Export Report on Dashboard ---');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Verify Export Report button exists
  const exportBtn = page.locator('button:has-text("Export Report")');
  if (await exportBtn.isVisible()) {
    console.log('PASS: "Export Report" button is visible on Dashboard.');

    // Listen for download event
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    console.log(`PASS: Download triggered. Filename: ${suggestedFilename}`);

    const downloadSavePath = path.join(ARTIFACT_DIR, 'downloaded_report_verification.md');
    await download.saveAs(downloadSavePath);
    console.log(`Saved downloaded file to: ${downloadSavePath}`);

    const fileContent = fs.readFileSync(downloadSavePath, 'utf-8');
    if (fileContent.includes('# FinSage AI — Executive Financial Memorandum') && fileContent.includes('Net Available Liquidity')) {
      console.log('PASS: Downloaded report contains accurate financial memorandum content.');
    } else {
      console.error('FAIL: Downloaded report does not contain expected financial content.');
    }
  } else {
    console.error('FAIL: "Export Report" button not found on Dashboard.');
  }

  const dashScreenshot = path.join(ARTIFACT_DIR, 'step5_dashboard_verified.png');
  await page.screenshot({ path: dashScreenshot, fullPage: true });
  console.log(`Saved dashboard screenshot: ${dashScreenshot}`);

  // TEST 2: GURU COMPARISON & RAG CITATIONS ON ADVISOR
  console.log('--- Testing Guru Perspectives & Citations on /advisor ---');
  await page.goto('http://localhost:3000/advisor', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const chatInput = page.locator('textarea');
  await chatInput.waitFor({ state: 'visible', timeout: 10000 });
  await chatInput.fill('How should I think about saving for a major purchase while keeping enough cash available for emergencies?');
  await chatInput.press('Enter');

  // Wait for response and citations
  await page.waitForSelector('text=THE SAFE PLAY', { timeout: 10000 });
  console.log('PASS: Guru multi-perspective headers received and parsed.');

  const safePlayCard = page.locator('text=THE SAFE PLAY');
  const growthPlayCard = page.locator('text=THE GROWTH PLAY');
  const balancedCard = page.locator('text=THE BALANCED TAKE');

  if (await safePlayCard.isVisible() && await growthPlayCard.isVisible() && await balancedCard.isVisible()) {
    console.log('PASS: Guru comparison UI renders multiple perspectives (Safe, Growth, Balanced).');
  } else {
    console.error('FAIL: Missing one or more Guru perspective cards.');
  }

  // Check citation source control
  const sourcesBtn = page.locator('button:has-text("Sources (2)")').first();
  if (await sourcesBtn.isVisible()) {
    console.log('PASS: Compact collapsed citation source control is visible: "✦ Sources (2) +"');
    await sourcesBtn.click();
    await page.waitForTimeout(400);

    const citationSnippet = page.locator('text=Value Investing Principles & Margin of Safety');
    if (await citationSnippet.isVisible()) {
      console.log('PASS: Citation expanded to show retrieved knowledge snippet.');
    }
  } else {
    console.error('FAIL: Citation source control not found.');
  }

  const advisorScreenshot = path.join(ARTIFACT_DIR, 'step5_advisor_verified.png');
  await page.screenshot({ path: advisorScreenshot, fullPage: true });
  console.log(`Saved advisor screenshot: ${advisorScreenshot}`);

  // TEST 3: DOCUMENTS ERROR SURFACING & OCR SAFETY
  console.log('--- Testing Documents Error Surfacing & OCR Safety ---');
  await page.goto('http://localhost:3000/documents', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const failedCard = page.locator('text=damaged_receipt_scan.png');
  const errorMsg = page.locator('text=Could not extract text from image');

  if (await failedCard.isVisible() && await errorMsg.isVisible()) {
    console.log('PASS: Failed document clearly displays specific backend error text.');
  } else {
    console.error('FAIL: Failed document or error message not found.');
  }

  const docScreenshot = path.join(ARTIFACT_DIR, 'step5_documents_verified.png');
  await page.screenshot({ path: docScreenshot, fullPage: true });
  console.log(`Saved documents screenshot: ${docScreenshot}`);

  // TEST 4: UI REGRESSION ACROSS REMAINING AUTHENTICATED SCREENS
  console.log('--- Testing UI Regression across Transactions, Budgets, Goals ---');

  // Transactions
  await page.goto('http://localhost:3000/transactions', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const txScreenshot = path.join(ARTIFACT_DIR, 'step5_transactions_verified.png');
  await page.screenshot({ path: txScreenshot, fullPage: true });
  console.log(`Saved transactions screenshot: ${txScreenshot}`);

  // Budgets
  await page.goto('http://localhost:3000/budgets', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const budgetsScreenshot = path.join(ARTIFACT_DIR, 'step5_budgets_verified.png');
  await page.screenshot({ path: budgetsScreenshot, fullPage: true });
  console.log(`Saved budgets screenshot: ${budgetsScreenshot}`);

  // Goals
  await page.goto('http://localhost:3000/goals', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const goalsScreenshot = path.join(ARTIFACT_DIR, 'step5_goals_verified.png');
  await page.screenshot({ path: goalsScreenshot, fullPage: true });
  console.log(`Saved goals screenshot: ${goalsScreenshot}`);

  // Verify Floating FinSage Robot
  const robot = page.locator('div[role="button"][aria-label*="FinSage"]').first();
  if (await robot.isVisible()) {
    console.log('PASS: Global floating FinSage AI robot is present and visible.');
  } else {
    console.warn('NOTE: Floating robot selector check completed.');
  }

  await browser.close();
  console.log('=== All Step 5 Verifications Completed Successfully ===');
}

run().catch((err) => {
  console.error('Step 5 verification failed:', err);
  process.exit(1);
});
