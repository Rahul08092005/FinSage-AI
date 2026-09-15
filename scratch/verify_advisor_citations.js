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
      let mockCitations = [];

      if (msg.includes('compare') || msg.includes('conservative') || msg.includes('guru') || msg.includes('perspectives')) {
        mockText = `### THE SAFE PLAY
Anchor your surplus into emergency liquidity. At ₹30,000/mo salary with ₹14,200 committed to fixed living costs, prioritize 6 months of runway in high-yield liquid funds before expanding speculative positions.

### THE GROWTH PLAY
Deploy 65% of your discretionary surplus into broad-market index funds and aggressive equity SIPs. Your low debt overhead provides runway to compound through volatility over the next 5-7 years.

### THE BALANCED TAKE
Maintain a 50/30/20 rule: allocate ₹15,000 to essentials, ₹9,000 to lifestyle, and auto-route ₹6,000 into a hybrid portfolio split between debt funds and index funds.`;

        mockCitations = [
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
          },
        ];
      } else if (msg.includes('zero') || msg.includes('nocite')) {
        mockText = `This is a direct conversational answer without any grounded knowledge retrieval citations. It verifies that messages with zero citations render cleanly without displaying empty source boxes or "Sources (0)".`;
        mockCitations = [];
      } else {
        mockText = `Your spending on Food & Dining has trended upward over the last 30 days, currently sitting at ₹6,200 out of your ₹8,000 budget cap.

Key drivers include two restaurant visits at Olive Bistro & Bar (₹2,140 total) and regular grocery top-ups via Swiggy Instamart (₹1,850).

With 12 days remaining in your billing cycle, your remaining safe burn rate for food is ₹150/day to stay within your allocation.`;

        mockCitations = [
          {
            title: 'Olive Bistro & Bar',
            source: 'receipt',
            content: 'Dinner at Olive Bistro & Bar, Indiranagar. Total ₹2,140 paid via UPI. 2 items billed: Mezze Platter, Wood-fired Pizza, Sparkling Mineral Water.',
            date: '06 Sept 2026',
            category: 'Food & Dining',
            page: 1,
          },
          {
            title: 'September 2026 Ledger Extract',
            source: 'bank_statement',
            content: 'Food & Dining category spending reached ₹6,200 across 9 transactions. Budget cap ₹8,000 with ₹1,800 remaining balance.',
            date: 'September 2026',
            category: 'Ledger Records',
          },
          {
            title: '50/30/20 Discretionary Spending Guideline',
            source: 'budget_rule',
            content: 'Discretionary lifestyle expenses should not exceed 30% of net monthly income (₹9,000 cap). Dining out is on track if kept under ₹8,000.',
            category: 'Budget Rules',
          },
          {
            title: 'HDFC UPI Auto-Debit Ledger',
            source: 'ledger',
            content: 'UPI-SWIGGY-INSTAMART debit records totaling ₹1,850 across 4 quick-commerce deliveries between Sept 2 and Sept 14.',
            date: '14 Sept 2026',
            category: 'Transactions',
          },
        ];
      }

      // Stream words/lines over SSE and emit [CITATIONS] before [DONE]
      const sseLines = mockText.split('\n');
      let sseBody = '';
      for (const line of sseLines) {
        sseBody += `data: ${line}\n\n`;
      }
      if (mockCitations.length > 0) {
        sseBody += `data: [CITATIONS] ${JSON.stringify(mockCitations)}\n\n`;
      }
      sseBody += 'data: [DONE]\n\n';

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
`,
      });
    }

    // Default mock response for other endpoints
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });

  const page = await context.newPage();

  // Set token in localStorage
  await page.addInitScript((token) => {
    localStorage.setItem('finsage_token', token);
  }, TEST_TOKEN);

  console.log('Navigating to http://localhost:3000/advisor...');
  await page.goto('http://localhost:3000/advisor', { waitUntil: 'networkidle' });

  // Verify welcome state
  console.log('Checking welcome state...');
  await page.waitForSelector('text=FINSAGE ADVISORY DESK');

  // Test 1: Ask food spending query -> Receives 4 citations
  console.log('Test 1: Sending query that yields citations...');
  const textarea = page.locator('textarea');
  await textarea.fill('How much did I spend on Food this month?');
  await textarea.press('Enter');

  // Wait for AI response to finish
  await page.waitForSelector('text=Your spending on Food & Dining has trended upward', { timeout: 10000 });
  console.log('AI response arrived.');

  // Verify Collapsed State: [ ✦ Sources (4) + ]
  console.log('Verifying collapsed source control...');
  const sourceBtn = page.locator('button[aria-label*="4 sources"]');
  await sourceBtn.waitFor({ state: 'visible', timeout: 5000 });

  const btnText = await sourceBtn.textContent();
  console.log('Source button text:', btnText);
  if (!btnText.includes('Sources (4)') || !btnText.includes('+')) {
    throw new Error(`Expected collapsed source button with Sources (4) +, got: ${btnText}`);
  }

  const ariaExpanded = await sourceBtn.getAttribute('aria-expanded');
  console.log('Source button aria-expanded:', ariaExpanded);
  if (ariaExpanded !== 'false') {
    throw new Error(`Expected aria-expanded="false", got: ${ariaExpanded}`);
  }

  // Screenshot collapsed state
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'citations_chat_collapsed.png') });
  console.log('Saved citations_chat_collapsed.png');

  // Test 2: Expand source control
  console.log('Test 2: Expanding source control...');
  await sourceBtn.click();
  await page.waitForTimeout(300);

  const ariaExpandedAfter = await sourceBtn.getAttribute('aria-expanded');
  console.log('Source button aria-expanded after click:', ariaExpandedAfter);
  if (ariaExpandedAfter !== 'true') {
    throw new Error(`Expected aria-expanded="true", got: ${ariaExpandedAfter}`);
  }

  // Verify expanded panel contents
  await page.waitForSelector('text=GROUNDED IN YOUR DATA');
  console.log('Found GROUNDED IN YOUR DATA micro-label.');

  // Verify citation cards
  await page.waitForSelector('text=RECEIPT · OLIVE BISTRO & BAR');
  console.log('Found Olive Bistro citation card.');

  await page.waitForSelector('text=06 Sept 2026');
  console.log('Found date metadata.');

  // Check progressive disclosure: "Show all 4 sources"
  const showAllBtn = page.locator('text=Show all 4 sources');
  await showAllBtn.waitFor({ state: 'visible' });
  console.log('Found "Show all 4 sources" button.');

  // Screenshot expanded state
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'citations_chat_expanded.png') });
  console.log('Saved citations_chat_expanded.png');

  // Test 3: Click "Show all 4 sources"
  await showAllBtn.click();
  await page.waitForTimeout(200);
  await page.waitForSelector('text=HDFC UPI Auto-Debit Ledger');
  console.log('Expanded to all 4 sources successfully.');

  // Screenshot full expanded citations
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'citations_all_expanded.png') });
  console.log('Saved citations_all_expanded.png');

  // Test 4: Collapse back
  await sourceBtn.click();
  await page.waitForTimeout(300);
  const panelVisible = await page.locator('text=GROUNDED IN YOUR DATA').isVisible();
  console.log('Panel visible after second click:', panelVisible);
  if (panelVisible) {
    throw new Error('Expected citation panel to be collapsed after second click');
  }

  // Test 5: Message with ZERO citations
  console.log('Test 5: Sending message with ZERO citations...');
  await textarea.fill('Testing zero citations mode');
  await textarea.press('Enter');

  await page.waitForSelector('text=This is a direct conversational answer without any grounded knowledge retrieval citations', { timeout: 10000 });
  console.log('Zero-citation AI response arrived.');

  // Check that NO Sources button was created for this second message
  const allSourceButtons = await page.locator('button[aria-label*="sources"]').all();
  console.log('Total source buttons on page:', allSourceButtons.length);
  // There should still only be 1 source button on the whole page (from the first message)
  if (allSourceButtons.length !== 1) {
    throw new Error(`Expected exactly 1 source button on page, got ${allSourceButtons.length}`);
  }

  // Test 6: Guru Mode query with citations
  console.log('Test 6: Testing Guru compare mode with citations...');
  await page.click('button:has-text("Guru Compare")');
  await page.waitForTimeout(200);

  await textarea.fill('Compare Conservative vs Growth perspectives on my spending pace');
  await textarea.press('Enter');

  await page.waitForSelector('text=THE SAFE PLAY', { timeout: 10000 });
  console.log('Guru response arrived.');

  // Verify Guru citations button: Sources (2)
  const guruSourceBtn = page.locator('button[aria-label*="2 sources"]');
  await guruSourceBtn.waitFor({ state: 'visible' });
  await guruSourceBtn.click();
  await page.waitForTimeout(300);
  await page.waitForSelector('text=Value Investing Principles & Margin of Safety');
  console.log('Found Guru citation card.');

  // Screenshot Guru response with citations
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'citations_guru_mode.png') });
  console.log('Saved citations_guru_mode.png');

  // Test 7: Responsive viewports
  console.log('Test 7: Responsive viewports...');

  // Laptop 1366x768
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'citations_laptop_1366.png') });
  console.log('Saved citations_laptop_1366.png');

  // Tablet 768x1024
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'citations_tablet_768.png') });
  console.log('Saved citations_tablet_768.png');

  // Mobile 390x844
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'citations_mobile_390.png') });
  console.log('Saved citations_mobile_390.png');

  await browser.close();
  console.log('ALL CITATION TESTS COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
