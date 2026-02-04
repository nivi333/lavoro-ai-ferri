import { test, expect } from '@playwright/test';

test.describe('Quality Inspection and Compliance Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and select company
    await page.goto('/login');
    await page.fill('#emailOrPhone', 'nivi2@gm.com');
    await page.fill('#password', 'Test@123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/companies');
    await page.click('[data-testid="company-row"]:first-child');
    await page.waitForURL('**/dashboard');
  });

  test('should perform quality inspection → report defect → ensure compliance', async ({ page }) => {
    // Navigate to Quality module
    await page.click('a[href="/quality"]');
    await page.waitForURL('**/quality');
    
    // Create new inspection
    await page.click('button:has-text("New Inspection")');
    await expect(page.locator('[data-testid="inspection-form"]')).toBeVisible();
    
    // Fill inspection details
    const inspectionRef = `INS-${Date.now()}`;
    await page.fill('input[name="inspectionReference"]', inspectionRef);
    await page.selectOption('select[name="inspectionType"]', 'INCOMING');
    await page.selectOption('select[name="product"]', { index: 1 });
    await page.fill('input[name="batchNumber"]', `BATCH-${Date.now()}`);
    await page.fill('input[name="quantity"]', '500');
    await page.fill('input[name="inspector"]', 'John Doe');
    
    // Add inspection parameters
    await page.click('button:has-text("Add Parameter")');
    await page.fill('input[name="parameters[0].name"]', 'Thread Count');
    await page.fill('input[name="parameters[0].expectedValue"]', '200');
    await page.fill('input[name="parameters[0].actualValue"]', '195');
    await page.selectOption('select[name="parameters[0].result"]', 'FAIL');
    
    await page.click('button:has-text("Add Parameter")');
    await page.fill('input[name="parameters[1].name"]', 'Color Consistency');
    await page.fill('input[name="parameters[1].expectedValue"]', 'Match Standard');
    await page.fill('input[name="parameters[1].actualValue"]', 'Slight Variation');
    await page.selectOption('select[name="parameters[1].result"]', 'FAIL');
    
    // Submit inspection
    await page.click('button:has-text("Submit Inspection")');
    
    // Wait for success
    await expect(page.locator('text=Inspection recorded successfully')).toBeVisible({ timeout: 3000 });
    
    // Since inspection failed, report defect
    await page.click('button:has-text("Report Defect")');
    await expect(page.locator('[data-testid="defect-report-form"]')).toBeVisible();
    
    // Fill defect details
    await page.selectOption('select[name="defectType"]', 'QUALITY_ISSUE');
    await page.selectOption('select[name="severity"]', 'MAJOR');
    await page.fill('textarea[name="description"]', 'Thread count below specification and color variation detected');
    await page.fill('textarea[name="rootCause"]', 'Supplier quality control issue');
    await page.fill('textarea[name="correctiveAction"]', 'Return batch to supplier and request replacement');
    await page.fill('input[name="affectedQuantity"]', '500');
    
    // Upload evidence (mock)
    await page.click('button:has-text("Upload Evidence")');
    
    // Submit defect report
    await page.click('button:has-text("Submit Defect Report")');
    
    // Wait for success
    await expect(page.locator('text=Defect reported successfully')).toBeVisible({ timeout: 3000 });
    
    // Navigate to Compliance
    await page.click('a[href="/compliance"]');
    await page.waitForURL('**/compliance');
    
    // Verify defect appears in compliance dashboard
    await expect(page.locator(`text=${inspectionRef}`)).toBeVisible();
    
    // Check compliance metrics updated
    await expect(page.locator('[data-testid="defect-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible();
    
    // Generate compliance report
    await page.click('button:has-text("Generate Report")');
    await page.selectOption('select[name="reportType"]', 'DEFECT_ANALYSIS');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.click('button:has-text("Generate")');
    
    // Verify report generated
    await expect(page.locator('text=Report generated successfully')).toBeVisible({ timeout: 3000 });
  });

  test('should validate inspection form fields', async ({ page }) => {
    await page.click('a[href="/quality"]');
    await page.waitForURL('**/quality');
    
    await page.click('button:has-text("New Inspection")');
    
    // Try to submit without required fields
    await page.click('button:has-text("Submit Inspection")');
    
    // Should show validation errors
    await expect(page.locator('text=Inspection reference is required')).toBeVisible();
    await expect(page.locator('text=Product is required')).toBeVisible();
  });

  test('should filter inspections by type', async ({ page }) => {
    await page.click('a[href="/quality"]');
    await page.waitForURL('**/quality');
    
    // Filter by INCOMING inspections
    await page.selectOption('select[name="inspectionType"]', 'INCOMING');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // All visible inspections should be INCOMING type
    const typeBadges = await page.locator('[data-testid^="inspection-type-"]').all();
    for (const badge of typeBadges) {
      await expect(badge).toContainText('Incoming');
    }
  });

  test('should filter inspections by result', async ({ page }) => {
    await page.click('a[href="/quality"]');
    await page.waitForURL('**/quality');
    
    // Filter by FAIL result
    await page.selectOption('select[name="result"]', 'FAIL');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Should show only failed inspections
    await expect(page.locator('[data-testid="result-fail"]')).toBeVisible();
  });

  test('should view inspection details', async ({ page }) => {
    await page.click('a[href="/quality"]');
    await page.waitForURL('**/quality');
    
    // Click on first inspection
    await page.click('[data-testid="inspection-row"]:first-child');
    
    // Should show inspection details
    await expect(page.locator('h1')).toContainText('Inspection Details');
    await expect(page.locator('[data-testid="inspection-parameters"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspection-results"]')).toBeVisible();
  });

  test('should view defect history', async ({ page }) => {
    await page.click('a[href="/quality"]');
    await page.waitForURL('**/quality');
    
    // Navigate to defects tab
    await page.click('button:has-text("Defects")');
    
    // Should show defect list
    await expect(page.locator('[data-testid="defect-list"]')).toBeVisible();
    
    // Filter by severity
    await page.selectOption('select[name="severity"]', 'MAJOR');
    await page.waitForTimeout(1000);
    
    // Should show only major defects
    await expect(page.locator('[data-testid="severity-major"]')).toBeVisible();
  });

  test('should track corrective actions', async ({ page }) => {
    await page.click('a[href="/quality"]');
    await page.waitForURL('**/quality');
    
    // Navigate to defects
    await page.click('button:has-text("Defects")');
    
    // Click on first defect
    await page.click('[data-testid="defect-row"]:first-child');
    
    // Add corrective action
    await page.click('button:has-text("Add Action")');
    await page.fill('textarea[name="action"]', 'Implement additional quality checks');
    await page.fill('input[name="assignedTo"]', 'Quality Manager');
    await page.fill('input[name="dueDate"]', '2024-03-01');
    await page.click('button:has-text("Save Action")');
    
    // Verify action added
    await expect(page.locator('text=Corrective action added')).toBeVisible({ timeout: 3000 });
  });

  test('should view compliance dashboard metrics', async ({ page }) => {
    await page.click('a[href="/compliance"]');
    await page.waitForURL('**/compliance');
    
    // Should show key metrics
    await expect(page.locator('[data-testid="total-inspections"]')).toBeVisible();
    await expect(page.locator('[data-testid="pass-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="defect-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="compliance-score"]')).toBeVisible();
    
    // Should show charts
    await expect(page.locator('[data-testid="inspection-trend-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="defect-distribution-chart"]')).toBeVisible();
  });

  test('should export compliance report', async ({ page }) => {
    await page.click('a[href="/compliance"]');
    await page.waitForURL('**/compliance');
    
    // Generate and export report
    await page.click('button:has-text("Export Report")');
    await page.selectOption('select[name="format"]', 'PDF');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    
    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('compliance-report');
  });
});
