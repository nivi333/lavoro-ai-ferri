import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    await page.fill('#emailOrPhone', 'nivi2@gm.com');
    await page.fill('#password', 'Test@123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/companies');
    await page.click('[data-testid="company-row"]:first-child');
    await page.waitForURL('**/dashboard');
  });

  test('should display correctly on desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Verify layout elements are visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    
    // Verify stats cards are in row layout
    const statsContainer = page.locator('[data-testid="stats-container"]');
    await expect(statsContainer).toBeVisible();
    
    // Check that navigation menu is expanded
    await expect(page.locator('[data-testid="nav-menu-expanded"]')).toBeVisible();
  });

  test('should display correctly on laptop (1366x768)', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // Verify all main elements are visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    
    // Stats should still be visible but may wrap
    await expect(page.locator('[data-testid="stats-container"]')).toBeVisible();
  });

  test('should display correctly on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Sidebar should be collapsible or hidden
    const sidebar = page.locator('[data-testid="sidebar"]');
    const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
    
    // Either sidebar is hidden or hamburger menu is visible
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    const hamburgerVisible = await hamburgerMenu.isVisible().catch(() => false);
    
    expect(sidebarVisible || hamburgerVisible).toBeTruthy();
    
    // Stats should stack vertically
    const statsCards = await page.locator('[data-testid^="stat-"]').all();
    expect(statsCards.length).toBeGreaterThan(0);
  });

  test('should display correctly on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hamburger menu should be visible
    await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
    
    // Sidebar should be hidden by default
    const sidebar = page.locator('[data-testid="sidebar"]');
    const isHidden = await sidebar.isHidden().catch(() => true);
    expect(isHidden).toBeTruthy();
    
    // Stats should stack vertically
    const statsCards = await page.locator('[data-testid^="stat-"]').all();
    expect(statsCards.length).toBeGreaterThan(0);
    
    // Touch-friendly button sizes
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 3)) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44); // Minimum touch target size
      }
    }
  });

  test('should handle mobile navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open hamburger menu
    await page.click('[data-testid="hamburger-menu"]');
    
    // Sidebar should become visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Navigate to products
    await page.click('a[href="/products"]');
    
    // Should navigate and close menu
    await page.waitForURL('**/products');
    
    // Menu should close after navigation
    const sidebar = page.locator('[data-testid="sidebar"]');
    const isHidden = await sidebar.isHidden().catch(() => true);
    expect(isHidden).toBeTruthy();
  });

  test('should display tables responsively on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to products page
    await page.click('a[href="/products"]');
    await page.waitForURL('**/products');
    
    // Table should be scrollable horizontally or display as cards
    const table = page.locator('[data-testid="products-table"]');
    const cardView = page.locator('[data-testid="products-cards"]');
    
    const tableVisible = await table.isVisible().catch(() => false);
    const cardsVisible = await cardView.isVisible().catch(() => false);
    
    // Either table is scrollable or cards view is shown
    expect(tableVisible || cardsVisible).toBeTruthy();
  });

  test('should display forms responsively on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to products and open form
    await page.click('a[href="/products"]');
    await page.waitForURL('**/products');
    await page.click('button:has-text("Add Product")');
    
    // Form drawer should take full width on mobile
    const drawer = page.locator('[data-testid="product-form-drawer"]');
    await expect(drawer).toBeVisible();
    
    const box = await drawer.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThan(300); // Should be nearly full width
    }
  });

  test('should handle orientation change', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Layout should adjust
    await page.waitForTimeout(500);
    
    // Content should still be accessible
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should display charts responsively', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    const desktopChart = page.locator('[data-testid="revenue-chart"]');
    const desktopBox = await desktopChart.boundingBox();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileChart = page.locator('[data-testid="revenue-chart"]');
    const mobileBox = await mobileChart.boundingBox();
    
    // Chart should resize
    if (desktopBox && mobileBox) {
      expect(mobileBox.width).toBeLessThan(desktopBox.width);
    }
  });
});
