const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/e4ba62ed-6a90-46ea-8b49-59c16480a6bc';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLXRlc3QtMTIzIiwiZW1haWwiOiJnZW56QGZpbnNhZ2UuYWkiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTgwMDAwMDAwMH0.signature';

const MOCK_DOCUMENTS = [
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
    id: "doc-fail-no-err",
    title: "corrupted_invoice.pdf",
    docType: "receipt",
    status: "FAILED",
    confidence: 0,
    uploadedAt: "2026-09-16T09:15:00.000Z",
    // No error field provided by backend -> must show fallback
  },
  {
    id: "doc-fail-long",
    title: "complex_bank_statement_scan.pdf",
    docType: "bank_statement",
    status: "FAILED",
    confidence: 0,
    uploadedAt: "2026-09-15T18:00:00.000Z",
    error: "Extraction engine failed during high-density multi-column table parsing: PDF layout contains overlapping bounding boxes and unreadable character streams that exceed parser tolerance limits.",
  },
  {
    id: "doc-review-err",
    title: "dim_cafe_bill.jpg",
    docType: "receipt",
    status: "NEEDS_REVIEW",
    confidence: 0.45,
    uploadedAt: "2026-09-15T14:20:00.000Z",
    ocrError: "Low contrast scan: merchant name and tax breakdown could not be verified.",
    extractedJson: [{ amount: 240, description: "Blue Tokai Coffee", category: "Food" }]
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
];

async function run() {
  console.log('--- Starting Document Processing Error Surfacing Verification ---');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  // 1. Desktop Viewport (1280x800)
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Set mock auth token in localStorage
  await page.addInitScript((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('finsage_token', token);
  }, TEST_TOKEN);

  // Mock API routes
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-test-123',
        name: 'Radhika FinSage',
        email: 'genz@finsage.ai'
      })
    });
  });

  await page.route('**/api/v1/documents', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DOCUMENTS)
    });
  });

  await page.route('**/api/v1/documents/*', async (route) => {
    const url = route.request().url();
    const docId = url.split('/').pop().split('?')[0];
    const found = MOCK_DOCUMENTS.find(d => d.id === docId) || MOCK_DOCUMENTS[0];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...found,
        ocrError: found.error || found.ocrError,
        processing_error: found.error || found.ocrError
      })
    });
  });

  console.log('Navigating to http://localhost:3000/documents...');
  await page.goto('http://localhost:3000/documents', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Take overview screenshot of cards grid with error surfacing
  const gridPath = path.join(ARTIFACT_DIR, 'document_errors_card_grid.png');
  await page.screenshot({ path: gridPath, fullPage: true });
  console.log(`Saved screenshot: ${gridPath}`);

  // Verification 1: Doc 1 shows actual backend error
  const content = await page.content();
  const doc1Msg = "Could not extract text from image — file may be corrupted or unsupported format.";
  if (content.includes(doc1Msg)) {
    console.log('PASS: Actual backend error message is displayed on doc-fail-1');
  } else {
    console.error('FAIL: Backend error message not found on doc-fail-1');
  }

  // Verification 2: Doc 2 with no error shows fallback
  const fallbackMsg = "Document processing failed. Please try again.";
  if (content.includes(fallbackMsg)) {
    console.log('PASS: Fallback error message is displayed when no backend error provided on doc-fail-no-err');
  } else {
    console.error('FAIL: Fallback error message not found');
  }

  // Verification 3: Check no raw JSON, [object Object], undefined, null
  if (content.includes('[object Object]')) {
    console.error('FAIL: Detected [object Object] in rendered DOM!');
  } else {
    console.log('PASS: No [object Object] rendered.');
  }
  if (content.includes('{"error":') || content.includes('"transactions":')) {
    console.error('FAIL: Raw JSON detected in rendered DOM!');
  } else {
    console.log('PASS: No raw JSON detected.');
  }

  // Verification 4: Truncated long error and toggle Show details
  const showDetailsBtn = page.locator('button:has-text("Show details")').first();
  if (await showDetailsBtn.isVisible()) {
    console.log('PASS: Long error has "Show details" toggle button.');
    await showDetailsBtn.click();
    await page.waitForTimeout(400);

    const longExpandedScreenshot = path.join(ARTIFACT_DIR, 'document_errors_expanded_long.png');
    await page.screenshot({ path: longExpandedScreenshot });
    console.log(`Saved expanded long error screenshot: ${longExpandedScreenshot}`);

    const showLessBtn = page.locator('button:has-text("Show less")').first();
    if (await showLessBtn.isVisible()) {
      console.log('PASS: "Show details" toggled to "Show less" after expansion.');
    }
  } else {
    console.warn('NOTE: "Show details" button not found or error not long enough');
  }

  // Verification 5: Open Review modal for failed document (doc-fail-1)
  console.log('Clicking Review on doc-fail-1 to inspect modal...');
  const cardFail1 = page.locator('text=damaged_receipt_scan.png').locator('..').locator('..');
  await cardFail1.click();
  await page.waitForTimeout(600);

  const modalScreenshot = path.join(ARTIFACT_DIR, 'document_errors_review_modal.png');
  await page.screenshot({ path: modalScreenshot });
  console.log(`Saved modal screenshot: ${modalScreenshot}`);

  const modalContent = await page.content();
  if (modalContent.includes('OCR Extraction Incomplete') || modalContent.includes('Could not extract text')) {
    console.log('PASS: Review modal surfaces the document failure and backend error banner');
  }
  if (modalContent.includes('Unreadable in scan') || modalContent.includes('Amount unreadable')) {
    console.log('PASS: Review modal flags unreadable amounts instead of misleading ₹0');
  }

  // Close modal
  const closeBtn = page.locator('button:has-text("Close")');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(400);
  }

  // Verification 6: Mobile viewport (390px iPhone style)
  console.log('Testing mobile responsive layout (390px)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  const mobileScreenshot = path.join(ARTIFACT_DIR, 'document_errors_mobile_390.png');
  await page.screenshot({ path: mobileScreenshot, fullPage: true });
  console.log(`Saved mobile screenshot: ${mobileScreenshot}`);

  await browser.close();
  console.log('--- Document Processing Error Surfacing Verification Complete ---');
}

run().catch((err) => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
