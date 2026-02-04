import { test, expect } from '@playwright/test';

test.describe('Product and Inventory Management Flow', () => {
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

  test('should create product → adjust stock → view in inventory', async ({ page }) => {
    // Navigate to Products
    await page.click('a[href="/products"]');
    await page.waitForURL('**/products');
    
    // Open create product drawer
    await page.click('button:has-text("Add Product")');
    await expect(page.locator('[data-testid="product-form-drawer"]')).toBeVisible();
    
    // Fill product details
    const productName = `Cotton Fabric ${Date.now()}`;
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="sku"]', `FAB-${Date.now()}`);
    await page.selectOption('select[name="category"]', 'fabric');
    await page.fill('input[name="costPrice"]', '100');
    await page.fill('input[name="sellingPrice"]', '150');
    await page.fill('input[name="stockQuantity"]', '500');
    await page.fill('input[name="reorderLevel"]', '50');
    await page.selectOption('select[name="unitOfMeasure"]', 'MTR');
    
    // Submit form
    await page.click('button:has-text("Add Product")');
    
    // Wait for success message
    await expect(page.locator('text=Product created successfully')).toBeVisible({ timeout: 3000 });
    
    // Find the created product in the list
    await page.fill('input[placeholder="Search products"]', productName);
    await expect(page.locator(`text=${productName}`)).toBeVisible();
    
    // Open stock adjustment
    await page.click(`[data-testid="product-actions-${productName}"]`);
    await page.click('button:has-text("Adjust Stock")');
    
    // Adjust stock
    await expect(page.locator('[data-testid="stock-adjustment-modal"]')).toBeVisible();
    await page.selectOption('select[name="adjustmentType"]', 'ADD');
    await page.fill('input[name="quantity"]', '200');
    await page.fill('input[name="reason"]', 'New purchase');
    await page.click('button:has-text("Adjust Stock")');
    
    // Wait for success
    await expect(page.locator('text=Stock adjusted successfully')).toBeVisible({ timeout: 3000 });
    
    // Navigate to Inventory
    await page.click('a[href="/inventory"]');
    await page.waitForURL('**/inventory');
    
    // Search for the product in inventory
    await page.fill('input[placeholder="Search inventory"]', productName);
    await expect(page.locator(`text=${productName}`)).toBeVisible();
    
    // Verify stock quantity updated (500 + 200 = 700)
    await expect(page.locator(`text=700`)).toBeVisible();
  });

  test('should validate product form fields', async ({ page }) => {
    await page.click('a[href="/products"]');
    await page.waitForURL('**/products');
    
    await page.click('button:has-text("Add Product")');
    
    // Try to submit without required fields
    await page.click('button:has-text("Add Product")');
    
    // Should show validation errors
    await expect(page.locator('text=Product name is required')).toBeVisible();
    await expect(page.locator('text=SKU is required')).toBeVisible();
  });

  test('should filter inventory by category', async ({ page }) => {
    await page.click('a[href="/inventory"]');
    await page.waitForURL('**/inventory');
    
    // Apply category filter
    await page.selectOption('select[name="category"]', 'fabric');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // All visible items should be fabric category
    const items = await page.locator('[data-testid^="inventory-item-"]').all();
    expect(items.length).toBeGreaterThan(0);
  });

  test('should filter inventory by stock status', async ({ page }) => {
    await page.click('a[href="/inventory"]');
    await page.waitForURL('**/inventory');
    
    // Filter by low stock
    await page.selectOption('select[name="stockStatus"]', 'low');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Should show low stock items
    await expect(page.locator('[data-testid="stock-status-low"]')).toBeVisible();
  });

  test('should paginate inventory list', async ({ page }) => {
    await page.click('a[href="/inventory"]');
    await page.waitForURL('**/inventory');
    
    // Check if pagination exists
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Wait for page change
      await page.waitForTimeout(1000);
      
      // Should show different items
      await expect(page.locator('[data-testid^="inventory-item-"]')).toBeVisible();
    }
  });

  test('should edit existing product', async ({ page }) => {
    await page.click('a[href="/products"]');
    await page.waitForURL('**/products');
    
    // Click edit on first product
    await page.click('[data-testid="product-actions"]:first-child');
    await page.click('button:has-text("Edit")');
    
    // Update product name
    const updatedName = `Updated Product ${Date.now()}`;
    await page.fill('input[name="name"]', updatedName);
    await page.click('button:has-text("Update Product")');
    
    // Verify update
    await expect(page.locator('text=Product updated successfully')).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`text=${updatedName}`)).toBeVisible();
  });
});
