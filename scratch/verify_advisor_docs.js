const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/e4ba62ed-6a90-46ea-8b49-59c16480a6bc';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxYzBlODE3YS01MzlhLTQ0MWUtOGJhMS1kMTIwYTZiZTgwYzUiLCJpYXQiOjE3ODkyODQ5NjAsImV4cCI6MTc4OTg4OTc2MH0.wmw2vA8hXrVvMVAFQHkGIqaK3otcqriTsz2YOoJWy2o';

async function run() {
  console.log('Launching browser with msedge...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Setup mock routes
  await context.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/v1/advisor/chat')) {
      const postData = route.request().postDataJSON() || {};
      const msg = (postData.message || '').toLowerCase();

      let mockText = '';
      if (msg.includes('compare') || msg.includes('conservative') || msg.includes('guru') || msg.includes('perspectives')) {
        mockText = `### THE SAFE PLAY
Anchor your surplus into emergency liquidity. At ₹30,000/mo salary with ₹14,200 committed to fixed living costs, prioritize 6 months of runway in high-yield liquid funds before expanding speculative positions.

### THE GROWTH PLAY
Deploy 65% of your discretionary surplus into broad-market index funds and aggressive equity SIPs. Your low debt overhead provides runway to compound through volatility over the next 5-7 years.

### THE BALANCED TAKE
Maintain a 50/30/20 rule: allocate ₹15,000 to essentials, ₹9,000 to lifestyle, and auto-route ₹6,000 into a hybrid portfolio split between debt funds and index funds.

Sources: Grounded in your ledger (transactions, budgets).`;
      } else {
        mockText = `Based on your recent transactions and budget allocations, your monthly burn rate is currently ₹18,450 out of your ₹30,000 income, leaving you with an investable surplus of ₹11,550 (38.5% savings rate).

Your top spending categories this month:
- Food & Dining: ₹6,200 (within ₹8,000 budget)
- Utilities & Rent: ₹8,000
- Shopping: ₹4,250 (approaching ₹5,000 budget limit)

Recommendation: Auto-transfer ₹6,000 to your Emergency Fund goal and keep shopping discretionary spend under ₹750 for the remainder of this cycle.

Sources: Ledger transactions (recent 30 days), category budgets, active goal targets.`;
      }

      const sseLines = mockText.split('\n');
      const sseBody = sseLines.map(l => `data: ${l}\n\n`).join('') + 'data: [DONE]\n\n';
      return route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: sseBody,
      });
    }

    if (url.includes('/api/v1/reports/export')) {
      return route.fulfill({
        status: 200,
        contentType: 'text/markdown',
        body: `# FinSage Financial Health Report
**Generated:** ${new Date().toISOString()}
**Overall Health Score:** 84/100 (Strong)

## Executive Summary
- Monthly Income: ₹30,000
- Burn Rate: 61.5%
- Active Savings Rate: 38.5%
- Emergency Runway: 4.2 Months

## Category Breakdown
- Essentials: ₹14,200 (47.3%)
- Discretionary: ₹4,250 (14.2%)
- Net Savings: ₹11,550 (38.5%)
`,
      });
    }

    if (url.includes('/api/v1/documents') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'doc-1',
            title: 'HDFC_Salary_Statement_August.pdf',
            docType: 'bank_statement',
            status: 'COMPLETED',
            confidence: 0.96,
            uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            extractedJson: {
              transactions: [
                { transactionDate: '2026-08-01', description: 'Acme Corp Salary Credit', category: 'Other', amount: 30000 },
                { transactionDate: '2026-08-05', description: 'Apartment Rent Auto-Debit', category: 'Bills', amount: 10000 },
              ]
            }
          },
          {
            id: 'doc-2',
            title: 'Blue_Tokai_Coffee_Receipt.png',
            docType: 'receipt',
            status: 'NEEDS_REVIEW',
            confidence: 0.62,
            uploadedAt: new Date(Date.now() - 86400000).toISOString(),
            extractedJson: {
              transactions: [
                { transactionDate: '2026-09-12', description: 'Blue Tokai Roasters - Latte & Croissant', category: 'Food', amount: 0 },
                { transactionDate: '2026-09-12', description: 'Packaging Fee', category: 'Food', amount: 25 },
              ]
            }
          },
          {
            id: 'doc-3',
            title: 'Blurry_Pharmacy_Bill.jpg',
            docType: 'receipt',
            status: 'FAILED',
            confidence: 0.18,
            uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            extractedJson: {
              transactions: [
                { transactionDate: '2026-09-13', description: 'Unreadable receipt scan', category: 'Other', amount: 0 }
              ]
            }
          }
        ]),
      });
    }

    return route.continue();
  });

  const page = await context.newPage();

  // 1. Visit advisor page and set token
  console.log('Navigating to advisor...');
  await page.goto('http://localhost:3000/advisor');
  await page.evaluate((tok) => {
    localStorage.setItem('finsage_token', tok);
  }, TEST_TOKEN);
  await page.goto('http://localhost:3000/advisor');
  await page.waitForLoadState('networkidle');

  // Verify floating robot is NOT present on /advisor
  const floatingCount = await page.locator('text=ASK FINSAGE').count();
  console.log('Floating robot on /advisor count (should be 0):', floatingCount);

  // Take initial advisor desktop view
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'advisor_standard_desktop.png'), fullPage: true });

  // 2. Send query in standard advisor mode
  console.log('Testing standard chat response & RAG citations...');
  const chatInput = page.locator('textarea');
  await chatInput.fill('Analyze my monthly burn rate and recent transactions');
  await page.locator('button:has-text("Transmit Query")').click();
  await page.waitForTimeout(2000);

  // Take screenshot with response and RAG citations
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'advisor_standard_response.png'), fullPage: true });

  // Click citation pill to test popover
  const citationChip = page.locator('button:has-text("Transactions · Sep 2026")').first();
  if (await citationChip.count() > 0) {
    await citationChip.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'advisor_citation_popover.png'), fullPage: true });
  }

  // 3. Switch to Guru Compare mode
  console.log('Switching to Guru Compare mode...');
  await page.locator('button:has-text("Guru Compare")').click();
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'advisor_guru_mode_active.png') });

  // Send a Guru comparison query
  await chatInput.fill('Compare conservative vs aggressive strategies for my ₹11,550 surplus');
  await page.locator('button:has-text("Transmit Query")').click();
  await page.waitForTimeout(2500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'advisor_guru_comparison_response.png'), fullPage: true });

  // Test Export Report button
  console.log('Testing Export Report...');
  const exportBtn = page.locator('button:has-text("Export Report")');
  console.log('Export button visible:', await exportBtn.isVisible());

  // 4. Test Viewports for Advisor
  console.log('Capturing responsive viewports for Advisor...');
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'advisor_laptop_1366.png'), fullPage: true });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'advisor_tablet_768.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'advisor_mobile_390.png'), fullPage: true });

  // 5. Test Documents Page with error handling and unreadable amounts
  console.log('Navigating to /documents to verify error handling...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/documents');
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'documents_vault_grid.png'), fullPage: true });

  // Open the NEEDS_REVIEW document (Blue Tokai)
  console.log('Opening NEEDS_REVIEW document...');
  const needsReviewCard = page.locator('text=Blue_Tokai_Coffee_Receipt.png');
  await needsReviewCard.click();
  await page.waitForTimeout(500);

  // Check that the modal opened and verify amount handling
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'documents_modal_needs_review.png') });

  // Close modal
  await page.locator('button:has-text("Close")').click();
  await page.waitForTimeout(300);

  // Open FAILED document (Blurry Pharmacy)
  console.log('Opening FAILED document...');
  const failedCard = page.locator('text=Blurry_Pharmacy_Bill.jpg');
  await failedCard.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'documents_modal_failed.png') });

  console.log('All visual verification screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error running verification:', err);
  process.exit(1);
});
