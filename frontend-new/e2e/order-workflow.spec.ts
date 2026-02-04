import { test, expect } from '@playwright/test';

test.describe('Order Management Workflow', () => {
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

  test('should create order → process → complete workflow', async ({ page }) => {
    // Navigate to Orders
    await page.click('a[href="/orders"]');
    await page.waitForURL('**/orders');
    
    // Create new order
    await page.click('button:has-text("Create Order")');
    await expect(page.locator('[data-testid="order-form-drawer"]')).toBeVisible();
    
    // Fill order details
    const orderRef = `ORD-${Date.now()}`;
    await page.fill('input[name="customerName"]', 'ABC Corporation');
    await page.fill('input[name="customerEmail"]', 'contact@abc.com');
    await page.fill('input[name="customerPhone"]', '+1234567890');
    await page.fill('input[name="orderReference"]', orderRef);
    await page.fill('input[name="deliveryDate"]', '2024-03-01');
    
    // Add order items
    await page.click('button:has-text("Add Item")');
    await page.selectOption('select[name="items[0].product"]', { index: 1 });
    await page.fill('input[name="items[0].quantity"]', '100');
    await page.fill('input[name="items[0].unitPrice"]', '150');
    
    // Add another item
    await page.click('button:has-text("Add Item")');
    await page.selectOption('select[name="items[1].product"]', { index: 2 });
    await page.fill('input[name="items[1].quantity"]', '50');
    await page.fill('input[name="items[1].unitPrice"]', '200');
    
    // Submit order
    await page.click('button:has-text("Create Order")');
    
    // Wait for success
    await expect(page.locator('text=Order created successfully')).toBeVisible({ timeout: 3000 });
    
    // Find the created order
    await page.fill('input[placeholder="Search orders"]', orderRef);
    await expect(page.locator(`text=${orderRef}`)).toBeVisible();
    
    // Verify initial status is PENDING
    await expect(page.locator(`[data-testid="order-status-${orderRef}"]`)).toContainText('Pending');
    
    // Confirm order
    await page.click(`[data-testid="order-actions-${orderRef}"]`);
    await page.click('button:has-text("Confirm Order")');
    await page.click('button:has-text("Confirm")'); // Confirmation dialog
    
    // Wait for status update
    await expect(page.locator('text=Order confirmed successfully')).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`[data-testid="order-status-${orderRef}"]`)).toContainText('Confirmed');
    
    // Process order
    await page.click(`[data-testid="order-actions-${orderRef}"]`);
    await page.click('button:has-text("Start Processing")');
    
    await expect(page.locator('text=Order processing started')).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`[data-testid="order-status-${orderRef}"]`)).toContainText('Processing');
    
    // Complete order
    await page.click(`[data-testid="order-actions-${orderRef}"]`);
    await page.click('button:has-text("Complete Order")');
    await page.fill('textarea[name="completionNotes"]', 'Order completed successfully');
    await page.click('button:has-text("Complete")');
    
    // Verify completion
    await expect(page.locator('text=Order completed successfully')).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`[data-testid="order-status-${orderRef}"]`)).toContainText('Completed');
  });

  test('should validate order form fields', async ({ page }) => {
    await page.click('a[href="/orders"]');
    await page.waitForURL('**/orders');
    
    await page.click('button:has-text("Create Order")');
    
    // Try to submit without required fields
    await page.click('button:has-text("Create Order")');
    
    // Should show validation errors
    await expect(page.locator('text=Customer name is required')).toBeVisible();
    await expect(page.locator('text=At least one item is required')).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    await page.click('a[href="/orders"]');
    await page.waitForURL('**/orders');
    
    // Filter by CONFIRMED status
    await page.selectOption('select[name="status"]', 'CONFIRMED');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // All visible orders should have CONFIRMED status
    const statusBadges = await page.locator('[data-testid^="order-status-"]').all();
    for (const badge of statusBadges) {
      await expect(badge).toContainText('Confirmed');
    }
  });

  test('should filter orders by date range', async ({ page }) => {
    await page.click('a[href="/orders"]');
    await page.waitForURL('**/orders');
    
    // Set date range filter
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.click('button:has-text("Apply Filter")');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Should show orders within date range
    await expect(page.locator('[data-testid^="order-row-"]')).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    await page.click('a[href="/orders"]');
    await page.waitForURL('**/orders');
    
    // Click on first order
    await page.click('[data-testid="order-row"]:first-child');
    
    // Should show order details page
    await expect(page.locator('h1')).toContainText('Order Details');
    
    // Should show order items
    await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
    
    // Should show customer information
    await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
    
    // Should show order timeline
    await expect(page.locator('[data-testid="order-timeline"]')).toBeVisible();
  });

  test('should cancel order', async ({ page }) => {
    await page.click('a[href="/orders"]');
    await page.waitForURL('**/orders');
    
    // Find a pending order
    await page.selectOption('select[name="status"]', 'PENDING');
    await page.waitForTimeout(1000);
    
    // Cancel the order
    await page.click('[data-testid="order-actions"]:first-child');
    await page.click('button:has-text("Cancel Order")');
    await page.fill('textarea[name="cancellationReason"]', 'Customer request');
    await page.click('button:has-text("Confirm Cancellation")');
    
    // Verify cancellation
    await expect(page.locator('text=Order cancelled successfully')).toBeVisible({ timeout: 3000 });
  });

  test('should add payment to order', async ({ page }) => {
    await page.click('a[href="/orders"]');
    await page.waitForURL('**/orders');
    
    // Click on first order
    await page.click('[data-testid="order-row"]:first-child');
    
    // Add payment
    await page.click('button:has-text("Add Payment")');
    await page.selectOption('select[name="paymentMethod"]', 'BANK_TRANSFER');
    await page.fill('input[name="amount"]', '5000');
    await page.fill('input[name="transactionId"]', 'TXN123456');
    await page.click('button:has-text("Record Payment")');
    
    // Verify payment added
    await expect(page.locator('text=Payment recorded successfully')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="payment-history"]')).toContainText('5000');
  });

  test('should export order list', async ({ page }) => {
    await page.click('a[href="/orders"]');
    await page.waitForURL('**/orders');
    
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export")');
    
    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('orders');
  });
});
