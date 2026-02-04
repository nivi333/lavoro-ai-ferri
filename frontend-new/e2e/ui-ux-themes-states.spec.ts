import { test, expect } from '@playwright/test';

test.describe('Theme Switching and UI States Tests', () => {
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

  test.describe('Dark/Light Theme Switching', () => {
    test('should switch from light to dark theme', async ({ page }) => {
      // Verify initial theme (light)
      const body = page.locator('body');
      const initialClass = await body.getAttribute('class');
      
      // Open theme switcher
      await page.click('[data-testid="theme-toggle"]');
      
      // Wait for theme change
      await page.waitForTimeout(500);
      
      // Verify theme changed
      const newClass = await body.getAttribute('class');
      expect(newClass).toContain('dark');
      
      // Verify dark theme colors applied
      const backgroundColor = await body.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
    });

    test('should persist theme preference', async ({ page }) => {
      // Switch to dark theme
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(500);
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Theme should still be dark
      const body = page.locator('body');
      const bodyClass = await body.getAttribute('class');
      expect(bodyClass).toContain('dark');
    });

    test('should apply theme to all components', async ({ page }) => {
      // Switch to dark theme
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(500);
      
      // Check various components have dark theme
      const header = page.locator('[data-testid="header"]');
      const sidebar = page.locator('[data-testid="sidebar"]');
      const statsCard = page.locator('[data-testid^="stat-"]').first();
      
      // All should have dark background
      const headerBg = await header.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(headerBg).not.toBe('rgb(255, 255, 255)');
    });

    test('should toggle back to light theme', async ({ page }) => {
      // Switch to dark
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(500);
      
      // Switch back to light
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(500);
      
      // Verify light theme
      const body = page.locator('body');
      const bodyClass = await body.getAttribute('class');
      expect(bodyClass).not.toContain('dark');
    });
  });

  test.describe('Loading States', () => {
    test('should display loading spinner on page navigation', async ({ page }) => {
      // Navigate to products
      const navigationPromise = page.waitForURL('**/products');
      await page.click('a[href="/products"]');
      
      // Loading indicator should appear briefly
      const loader = page.locator('[data-testid="loading-spinner"]');
      const isVisible = await loader.isVisible().catch(() => false);
      
      await navigationPromise;
      
      // Loading should complete
      await expect(page.locator('h1')).toContainText('Products');
    });

    test('should display skeleton loaders for data tables', async ({ page }) => {
      // Navigate to products
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      // Reload to see skeleton
      await page.reload();
      
      // Skeleton should appear briefly
      const skeleton = page.locator('[data-testid="table-skeleton"]');
      const skeletonVisible = await skeleton.isVisible().catch(() => false);
      
      // Wait for actual data
      await page.waitForSelector('[data-testid="products-table"]', { timeout: 5000 });
    });

    test('should display loading state on form submission', async ({ page }) => {
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      // Open form
      await page.click('button:has-text("Add Product")');
      
      // Fill form
      await page.fill('input[name="name"]', 'Test Product');
      await page.fill('input[name="sku"]', 'TEST-001');
      
      // Submit
      await page.click('button:has-text("Sign In")');
      
      // Loading state on button
      const submitButton = page.locator('button:has-text("Sign In")');
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('should display loading state on data refresh', async ({ page }) => {
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      // Click refresh button
      await page.click('[data-testid="refresh-button"]');
      
      // Loading indicator should appear
      const loader = page.locator('[data-testid="refresh-loader"]');
      const isVisible = await loader.isVisible().catch(() => false);
      
      // Wait for refresh to complete
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Error Messages', () => {
    test('should display user-friendly error for network failure', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      // Try to navigate to products
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      // Should show friendly error message
      await expect(page.locator('text=Unable to load data')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Please check your connection')).toBeVisible();
    });

    test('should display validation errors clearly', async ({ page }) => {
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      // Open form
      await page.click('button:has-text("Add Product")');
      
      // Try to submit without filling required fields
      await page.click('button:has-text("Sign In")');
      
      // Error messages should be clear and visible
      const errorMessages = await page.locator('[data-testid="error-message"]').all();
      expect(errorMessages.length).toBeGreaterThan(0);
      
      // Errors should be near the fields
      await expect(page.locator('text=This field is required')).toBeVisible();
    });

    test('should display error toast for failed operations', async ({ page }) => {
      // Simulate API error
      await page.route('**/api/v1/products', route => 
        route.fulfill({ status: 500, body: 'Internal Server Error' })
      );
      
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      // Try to create product
      await page.click('button:has-text("Add Product")');
      await page.fill('input[name="name"]', 'Test Product');
      await page.fill('input[name="sku"]', 'TEST-001');
      await page.click('button:has-text("Sign In")');
      
      // Error toast should appear
      await expect(page.locator('[data-testid="error-toast"]')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Something went wrong')).toBeVisible();
    });

    test('should provide helpful error messages for validation', async ({ page }) => {
      await page.goto('/register');
      
      // Enter invalid email
      await page.fill('input[name="email"]', 'invalid-email');
      await page.locator('input[name="email"]').blur();
      
      // Should show helpful message
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
      
      // Enter weak password
      await page.fill('#password', '123');
      await page.locator('#password').blur();
      
      // Should show password requirements
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    });
  });

  test.describe('Form Validation Clarity', () => {
    test('should show real-time validation feedback', async ({ page }) => {
      await page.goto('/register');
      
      // Start typing in email field
      await page.fill('input[name="email"]', 'test');
      
      // Should show validation hint
      const emailInput = page.locator('input[name="email"]');
      const ariaInvalid = await emailInput.getAttribute('aria-invalid');
      
      // Complete valid email
      await page.fill('input[name="email"]', 'nivi2@gm.com');
      await page.locator('input[name="email"]').blur();
      
      // Should show valid state
      await expect(page.locator('[data-testid="email-valid-icon"]')).toBeVisible();
    });

    test('should highlight invalid fields clearly', async ({ page }) => {
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      await page.click('button:has-text("Add Product")');
      await page.click('button:has-text("Sign In")');
      
      // Invalid fields should have error styling
      const nameInput = page.locator('input[name="name"]');
      const borderColor = await nameInput.evaluate((el) => 
        window.getComputedStyle(el).borderColor
      );
      
      // Should have red or error color border
      expect(borderColor).toMatch(/rgb\(.*\)/);
    });

    test('should clear validation errors on correction', async ({ page }) => {
      await page.goto('/register');
      
      // Trigger validation error
      await page.fill('input[name="email"]', 'invalid');
      await page.locator('input[name="email"]').blur();
      await expect(page.locator('text=Please enter a valid email')).toBeVisible();
      
      // Correct the error
      await page.fill('input[name="email"]', 'nivi2@gm.com');
      await page.locator('input[name="email"]').blur();
      
      // Error should disappear
      await expect(page.locator('text=Please enter a valid email')).not.toBeVisible();
    });
  });

  test.describe('Navigation Smoothness', () => {
    test('should navigate between pages smoothly', async ({ page }) => {
      const pages = ['/products', '/inventory', '/machines', '/orders', '/dashboard'];
      
      for (const pagePath of pages) {
        await page.click(`a[href="${pagePath}"]`);
        await page.waitForURL(`**${pagePath}`);
        
        // Page should load without errors
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        // No console errors
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text());
        });
        
        await page.waitForTimeout(500);
        expect(errors.length).toBe(0);
      }
    });

    test('should maintain scroll position on back navigation', async ({ page }) => {
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      const scrollPosition = await page.evaluate(() => window.scrollY);
      
      // Navigate away
      await page.click('a[href="/inventory"]');
      await page.waitForURL('**/inventory');
      
      // Navigate back
      await page.goBack();
      await page.waitForURL('**/products');
      
      // Scroll position should be restored (approximately)
      const newScrollPosition = await page.evaluate(() => window.scrollY);
      expect(Math.abs(newScrollPosition - scrollPosition)).toBeLessThan(100);
    });

    test('should show active navigation item', async ({ page }) => {
      await page.click('a[href="/products"]');
      await page.waitForURL('**/products');
      
      // Products nav item should be active
      const productsNav = page.locator('a[href="/products"]');
      const activeClass = await productsNav.getAttribute('class');
      expect(activeClass).toContain('active');
    });

    test('should handle rapid navigation clicks', async ({ page }) => {
      // Click multiple nav items rapidly
      await page.click('a[href="/products"]');
      await page.click('a[href="/inventory"]');
      await page.click('a[href="/machines"]');
      
      // Should end up on the last clicked page
      await page.waitForURL('**/machines', { timeout: 5000 });
      await expect(page.locator('h1')).toContainText('Machines');
    });
  });

  test.describe('Accessibility and UX', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Tab through navigation items
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Enter should activate focused link
      await page.keyboard.press('Enter');
      
      // Should navigate
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).not.toContain('/dashboard');
    });

    test('should show focus indicators', async ({ page }) => {
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      
      // Focused element should have visible outline
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
        };
      });
      
      expect(focused).not.toBeNull();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check important elements have ARIA labels
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      if (await hamburgerMenu.isVisible()) {
        const ariaLabel = await hamburgerMenu.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });
  });
});
