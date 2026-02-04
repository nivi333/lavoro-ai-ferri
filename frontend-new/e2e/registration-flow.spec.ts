import { test, expect } from '@playwright/test';

test.describe('Complete Registration Flow', () => {
  test('should complete registration → company creation → dashboard flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Step 1: Personal Information
    await expect(page.locator('h1')).toContainText('Create Account');
    await page.fill('#firstName', 'John');
    await page.fill('#lastName', 'Doe');
    const uniqueEmail = `test${Date.now()}@example.com`;
    await page.fill('#emailOrPhone', uniqueEmail);
    await page.fill('#password', 'Test@123');
    await page.fill('#confirmPassword', 'Test@123');

    // Accept terms and complete
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Create Account")');

    // Wait for redirect to company selection/creation page
    await page.waitForURL('**/companies', { timeout: 10000 });

    // Verify we are on companies page
    await expect(page.locator('h1')).toContainText('Select Company');

    // Check if we need to create a company
    const noCompanies = await page.isVisible('text=No companies yet');
    if (noCompanies) {
      await page.click('button:has-text("Add Company")');
      await page.fill('input[name="name"]', 'Test Company');
      await page.selectOption('select[name="industry"]', 'textile');
      await page.click('button:has-text("Create")');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } else {
      await page.click('[data-testid="company-row"]:first-child');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    }

    // Verify dashboard loaded
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should validate registration form fields', async ({ page }) => {
    await page.goto('/register');

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');

    // Should show validation errors
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/register');

    // Fill personal info
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'nivi2@gm.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.click('button:has-text("Next")');

    // Try weak password
    await page.fill('#password', '123');
    await page.fill('input[name="confirmPassword"]', '123');

    // Should show password strength error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should navigate back through registration steps', async ({ page }) => {
    await page.goto('/register');

    // Fill step 1
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'nivi2@gm.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.click('button:has-text("Next")');

    // Go back
    await page.click('button:has-text("Back")');

    // Verify data is preserved
    await expect(page.locator('input[name="firstName"]')).toHaveValue('John');
    await expect(page.locator('input[name="lastName"]')).toHaveValue('Doe');
  });
});
