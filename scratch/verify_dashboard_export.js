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
    acceptDownloads: true,
  });

  let shouldFailExport = false;
  let exportRequested = false;
  let authHeaderReceived = '';

  // Setup mock routes
  await context.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/v1/reports/export')) {
      exportRequested = true;
      authHeaderReceived = route.request().headers()['authorization'] || '';

      if (shouldFailExport) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'AI engine report synthesis failed' }),
        });
      }

      const mockMarkdown = `# FinSage Financial Health Report
**Date:** 15 Sept 2026
**User Health Score:** 88/100 (Exceptional)

## Monthly Cash Flow Summary
- Net Inflow: ₹30,000
- Discretionary Burn: ₹18,450
- Surplus Compounded: ₹11,550 (38.5%)

## Category Allocations
- Food & Dining: ₹6,200 / ₹8,000 cap
- Rent & Utilities: ₹8,000
- Discretionary: ₹4,250 / ₹5,000 cap

*Generated natively via FinSage AI Intelligence Desk.*
`;

      return route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="FinSage-Financial-Report-2026-09-15.md"',
        },
        body: mockMarkdown,
      });
    }

    if (url.includes('/api/v1/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'user-1', name: 'Demo User', email: 'demo@finsage.com', monthlySalary: 30000 }),
      });
    }

    if (url.includes('/api/v1/expenses/summary')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total: 18450,
          byCategory: [
            { category: 'Rent & Utilities', total: 8000, count: 2 },
            { category: 'Food & Dining', total: 6200, count: 9 },
            { category: 'Shopping', total: 4250, count: 4 },
          ],
        }),
      });
    }

    if (url.includes('/api/v1/health')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ database: 'up', redis: 'up', ai: 'online' }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  const page = await context.newPage();

  // Set token in localStorage
  await page.addInitScript((token) => {
    localStorage.setItem('finsage_token', token);
  }, TEST_TOKEN);

  console.log('Navigating to http://localhost:3000/dashboard...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

  // 1. Verify Export Report button exists in Dashboard header
  console.log('Checking Export Report button in Dashboard header...');
  const exportBtn = page.locator('button[aria-label="Export Financial Report"]');
  await exportBtn.waitFor({ state: 'visible', timeout: 5000 });

  const initialBtnText = await exportBtn.textContent();
  console.log('Export button text:', initialBtnText);
  if (!initialBtnText.includes('Export Report')) {
    throw new Error(`Expected "Export Report", got: ${initialBtnText}`);
  }

  // Also verify + Record Transaction is alongside it
  const recordLink = page.locator('a:has-text("+ Record Transaction")');
  await recordLink.waitFor({ state: 'visible' });
  console.log('Found + Record Transaction action alongside Export Report.');

  // Screenshot idle dashboard header
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_export_idle.png') });
  console.log('Saved dashboard_export_idle.png');

  // 2. Test successful download click
  console.log('Clicking Export Report button...');
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await exportBtn.click();

  // Verify loading state appears
  const loadingVisible = await page.locator('text=Packaging your money story…').isVisible();
  console.log('Loading state visible during export:', loadingVisible);

  // Await browser download event
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  console.log('Downloaded file name:', suggestedFilename);
  if (!suggestedFilename.includes('FinSage-Financial-Report') && !suggestedFilename.includes('financial-report')) {
    throw new Error(`Unexpected filename: ${suggestedFilename}`);
  }

  // Check downloaded file content
  const downloadPath = await download.path();
  if (downloadPath) {
    const content = fs.readFileSync(downloadPath, 'utf8');
    console.log('Downloaded content preview:\n', content.slice(0, 150));
    if (!content.includes('FinSage Financial Health Report')) {
      throw new Error('Downloaded file does not contain expected markdown title');
    }
  }

  // Verify Auth Header was transmitted
  console.log('Authorization header verified:', authHeaderReceived.startsWith('Bearer eyJ'));
  if (!authHeaderReceived.startsWith('Bearer eyJ')) {
    throw new Error('Expected Bearer auth header in export request');
  }

  // 3. Verify Success state on button
  console.log('Checking success state...');
  await page.waitForSelector("text=Report's ready", { timeout: 5000 });
  console.log("Success state: Found Report's ready");

  // Screenshot success state
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_export_success.png') });
  console.log('Saved dashboard_export_success.png');

  // 4. Test Error state & Retry
  console.log('Testing error state handling...');
  shouldFailExport = true;
  // Wait for success state to revert or click button
  await page.waitForTimeout(4000);
  await exportBtn.click();

  // Verify error alert appears
  const errorAlert = page.locator('[role="alert"]:has-text("Couldn\'t export your report")');
  await errorAlert.waitFor({ state: 'visible', timeout: 5000 });
  const errorText = await errorAlert.textContent();
  console.log('Error alert message:', errorText);
  if (!errorText.includes("Couldn't export your report")) {
    throw new Error(`Expected friendly error message, got: ${errorText}`);
  }

  // Screenshot error state
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_export_error.png') });
  console.log('Saved dashboard_export_error.png');

  // Test Retry action
  console.log('Testing Retry...');
  shouldFailExport = false;
  const retryBtn = errorAlert.locator('text=Retry');
  const retryDownloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await retryBtn.click();
  const retryDownload = await retryDownloadPromise;
  console.log('Retry download succeeded with file:', retryDownload.suggestedFilename());

  // 5. Test Responsive viewports
  console.log('Testing responsive layouts...');

  // Laptop (1366x768)
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_laptop_1366.png') });
  console.log('Saved dashboard_laptop_1366.png');

  // Mobile (390x844)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_mobile_390.png') });
  console.log('Saved dashboard_mobile_390.png');

  await browser.close();
  console.log('ALL DASHBOARD EXPORT REPORT TESTS PASSED!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
