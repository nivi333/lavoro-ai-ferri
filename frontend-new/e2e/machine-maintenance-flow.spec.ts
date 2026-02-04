import { test, expect } from '@playwright/test';

test.describe('Machine Maintenance and Breakdown Flow', () => {
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

  test('should create machine → schedule maintenance → log breakdown', async ({ page }) => {
    // Navigate to Machines
    await page.click('a[href="/machines"]');
    await page.waitForURL('**/machines');
    
    // Open create machine drawer
    await page.click('button:has-text("Add Machine")');
    await expect(page.locator('[data-testid="machine-form-drawer"]')).toBeVisible();
    
    // Fill machine details
    const machineName = `Loom Machine ${Date.now()}`;
    await page.fill('input[name="name"]', machineName);
    await page.selectOption('select[name="machineType"]', 'WEAVING_LOOM');
    await page.fill('input[name="serialNumber"]', `WL-${Date.now()}`);
    await page.fill('input[name="manufacturer"]', 'Textile Corp');
    await page.fill('input[name="model"]', 'TC-500');
    await page.fill('input[name="purchaseDate"]', '2024-01-15');
    await page.selectOption('select[name="location"]', 'Production Floor A');
    await page.selectOption('select[name="status"]', 'IDLE');
    
    // Submit form
    await page.click('button:has-text("Add Machine")');
    
    // Wait for success message
    await expect(page.locator('text=Machine created successfully')).toBeVisible({ timeout: 3000 });
    
    // Find the created machine
    await page.fill('input[placeholder="Search machines"]', machineName);
    await expect(page.locator(`text=${machineName}`)).toBeVisible();
    
    // Schedule maintenance
    await page.click(`[data-testid="machine-actions-${machineName}"]`);
    await page.click('button:has-text("Schedule Maintenance")');
    
    await expect(page.locator('[data-testid="maintenance-schedule-modal"]')).toBeVisible();
    await page.selectOption('select[name="maintenanceType"]', 'PREVENTIVE');
    await page.fill('input[name="scheduledDate"]', '2024-02-01');
    await page.fill('input[name="description"]', 'Regular preventive maintenance');
    await page.fill('input[name="estimatedCost"]', '5000');
    await page.click('button:has-text("Schedule")');
    
    // Wait for success
    await expect(page.locator('text=Maintenance scheduled successfully')).toBeVisible({ timeout: 3000 });
    
    // Log breakdown
    await page.click(`[data-testid="machine-actions-${machineName}"]`);
    await page.click('button:has-text("Report Breakdown")');
    
    await expect(page.locator('[data-testid="breakdown-report-modal"]')).toBeVisible();
    await page.selectOption('select[name="severity"]', 'HIGH');
    await page.fill('textarea[name="description"]', 'Motor malfunction detected');
    await page.fill('textarea[name="symptoms"]', 'Unusual noise and vibration');
    await page.fill('input[name="reportedBy"]', 'John Doe');
    await page.click('button:has-text("Report Breakdown")');
    
    // Wait for success
    await expect(page.locator('text=Breakdown reported successfully')).toBeVisible({ timeout: 3000 });
    
    // Verify machine status changed to UNDER_REPAIR
    await expect(page.locator(`[data-testid="machine-status-${machineName}"]`)).toContainText('Under Repair');
  });

  test('should validate machine form fields', async ({ page }) => {
    await page.click('a[href="/machines"]');
    await page.waitForURL('**/machines');
    
    await page.click('button:has-text("Add Machine")');
    
    // Try to submit without required fields
    await page.click('button:has-text("Add Machine")');
    
    // Should show validation errors
    await expect(page.locator('text=Machine name is required')).toBeVisible();
    await expect(page.locator('text=Machine type is required')).toBeVisible();
  });

  test('should filter machines by status', async ({ page }) => {
    await page.click('a[href="/machines"]');
    await page.waitForURL('**/machines');
    
    // Filter by IN_USE status
    await page.selectOption('select[name="status"]', 'IN_USE');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // All visible machines should have IN_USE status
    const statusBadges = await page.locator('[data-testid^="machine-status-"]').all();
    for (const badge of statusBadges) {
      await expect(badge).toContainText('In Use');
    }
  });

  test('should filter machines by location', async ({ page }) => {
    await page.click('a[href="/machines"]');
    await page.waitForURL('**/machines');
    
    // Filter by location
    await page.selectOption('select[name="location"]', 'Production Floor A');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Should show machines from selected location
    await expect(page.locator('text=Production Floor A')).toBeVisible();
  });

  test('should update machine status', async ({ page }) => {
    await page.click('a[href="/machines"]');
    await page.waitForURL('**/machines');
    
    // Click on first machine actions
    await page.click('[data-testid="machine-actions"]:first-child');
    await page.click('button:has-text("Update Status")');
    
    // Change status
    await page.selectOption('select[name="status"]', 'UNDER_MAINTENANCE');
    await page.fill('textarea[name="notes"]', 'Scheduled maintenance in progress');
    await page.click('button:has-text("Update Status")');
    
    // Verify status updated
    await expect(page.locator('text=Status updated successfully')).toBeVisible({ timeout: 3000 });
  });

  test('should view machine maintenance history', async ({ page }) => {
    await page.click('a[href="/machines"]');
    await page.waitForURL('**/machines');
    
    // Click on first machine
    await page.click('[data-testid="machine-row"]:first-child');
    
    // Should show machine details page
    await expect(page.locator('h1')).toContainText('Machine Details');
    
    // Navigate to maintenance history tab
    await page.click('button:has-text("Maintenance History")');
    
    // Should show maintenance records
    await expect(page.locator('[data-testid="maintenance-records"]')).toBeVisible();
  });

  test('should view machine breakdown history', async ({ page }) => {
    await page.click('a[href="/machines"]');
    await page.waitForURL('**/machines');
    
    // Click on first machine
    await page.click('[data-testid="machine-row"]:first-child');
    
    // Navigate to breakdown history tab
    await page.click('button:has-text("Breakdown History")');
    
    // Should show breakdown records
    await expect(page.locator('[data-testid="breakdown-records"]')).toBeVisible();
  });
});
