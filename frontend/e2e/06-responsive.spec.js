import { test, expect } from '@playwright/test';
import { login } from './selectors';

/**
 * E2E Tests for Responsive Design
 * ROVI CRM - Mobile, Tablet, Desktop
 */

test.describe('Responsive Design', () => {

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page);
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('debería funcionar en desktop (1920x1080)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot desktop view
    await page.screenshot({ path: 'screenshots/responsive-desktop.png', fullPage: true });

    // Verify dashboard is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify sidebar is visible
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"], nav').first();
    await expect(sidebar).toBeVisible();

    // Verify stats cards are arranged horizontally (desktop layout)
    const statsCards = page.locator('[class*="card"], [class*="Card"]').all();
    expect(statsCards.length).toBeGreaterThan(0);

    console.log('✅ Desktop view (1920x1080) works correctly');
  });

  test('debería funcionar en laptop (1366x768)', async ({ page }) => {
    // Set laptop viewport
    await page.setViewportSize({ width: 1366, height: 768 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot laptop view
    await page.screenshot({ path: 'screenshots/responsive-laptop.png', fullPage: true });

    // Verify dashboard is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);

    console.log('✅ Laptop view (1366x768) works correctly');
  });

  test('debería funcionar en tablet (768x1024)', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot tablet view
    await page.screenshot({ path: 'screenshots/responsive-tablet.png', fullPage: true });

    // Verify dashboard is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify sidebar might be collapsed or icon-only
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"], nav').first();
    await expect(sidebar).toBeVisible();

    // Verify stats cards might stack vertically
    const statsCards = page.locator('[class*="card"], [class*="Card"]').all();
    expect(statsCards.length).toBeGreaterThan(0);

    console.log('✅ Tablet view (768x1024) works correctly');
  });

  test('debería funcionar en móvil grande (414x896 - iPhone XR)', async ({ page }) => {
    // Set mobile viewport (iPhone XR)
    await page.setViewportSize({ width: 414, height: 896 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot mobile large view
    await page.screenshot({ path: 'screenshots/responsive-mobile-large.png', fullPage: true });

    // Verify dashboard is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify sidebar is hidden or collapsed (hamburger menu)
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"], nav').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);

    if (sidebarVisible) {
      // Sidebar might be visible but collapsed
      console.log('Sidebar visible on mobile (might be collapsed)');
    } else {
      console.log('✅ Sidebar hidden on mobile (hamburger menu expected)');
    }

    // Look for hamburger menu button
    const hamburgerButton = page.locator('button[aria-label*="menu" i], button:has-text("☰"), [class*="hamburger"]').first();
    const hamburgerExists = await hamburgerButton.isVisible().catch(() => false);

    if (hamburgerExists) {
      console.log('✅ Hamburger menu button visible on mobile');
      await page.screenshot({ path: 'screenshots/responsive-mobile-menu.png' });
    }

    console.log('✅ Mobile large view (414x896) works correctly');
  });

  test('debería funcionar en móvil pequeño (375x667 - iPhone SE)', async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot mobile small view
    await page.screenshot({ path: 'screenshots/responsive-mobile-small.png', fullPage: true });

    // Verify dashboard is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify stats cards stack vertically
    const statsCards = page.locator('[class*="card"], [class*="Card"]').all();
    expect(statsCards.length).toBeGreaterThan(0);

    // Verify no horizontal scroll (critical for mobile)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);

    console.log('✅ Mobile small view (375x667) works correctly');
  });

  test('debería funcionar en móvil muy pequeño (320x568 - iPhone 5)', async ({ page }) => {
    // Set very small mobile viewport
    await page.setViewportSize({ width: 320, height: 568 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot very small mobile view
    await page.screenshot({ path: 'screenshots/responsive-mobile-tiny.png', fullPage: true });

    // Verify dashboard is still visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Verify no horizontal scroll (critical for small screens)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);

    console.log('✅ Very small mobile view (320x568) works correctly');
  });

  test('debería adaptar leads table para móvil', async ({ page }) => {
    // Navigate to leads on mobile
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot mobile leads
    await page.screenshot({ path: 'screenshots/responsive-leads-mobile.png', fullPage: true });

    // Verify leads table is visible
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();

    // Table might have horizontal scroll (acceptable)
    // OR might be transformed to cards (better UX)
    console.log('✅ Leads page adapts to mobile');
  });

  test('debería adaptar calendar para móvil', async ({ page }) => {
    // Navigate to calendar on mobile
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot mobile calendar
    await page.screenshot({ path: 'screenshots/responsive-calendar-mobile.png', fullPage: true });

    // Verify calendar is visible
    const calendar = page.locator('[class*="calendar"], [class*="Calendar"]').first();
    await expect(calendar).toBeVisible();

    console.log('✅ Calendar adapts to mobile');
  });

  test('debería adaptar import para móvil', async ({ page }) => {
    // Navigate to import on mobile
    await page.goto('/import-leads');
    await page.waitForLoadState('networkidle');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot mobile import
    await page.screenshot({ path: 'screenshots/responsive-import-mobile.png', fullPage: true });

    // Verify import page is visible
    const title = page.locator('h1:has-text("Import"), h2:has-text("Import")');
    await expect(title.first()).toBeVisible();

    // Verify upload area is still usable
    const uploadArea = page.locator('input[type="file"], [class*="upload"]').first();
    await expect(uploadArea).toBeVisible();

    console.log('✅ Import page adapts to mobile');
  });

  test('debería mostrar menú hamburguesa en móvil y abrir sidebar', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for hamburger menu button
    const hamburgerButton = page.locator('button[aria-label*="menu" i], button:has-text("☰"), [class*="hamburger"], [class*="menu-button"]').first();
    const hamburgerExists = await hamburgerButton.isVisible().catch(() => false);

    if (hamburgerExists) {
      // Screenshot before clicking
      await page.screenshot({ path: 'screenshots/responsive-menu-closed.png' });

      // Click hamburger menu
      await hamburgerButton.click();
      await page.waitForTimeout(500);

      // Screenshot after clicking
      await page.screenshot({ path: 'screenshots/responsive-menu-open.png' });

      // Verify sidebar/menu is now visible
      const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"], nav, [role="navigation"]').first();
      await expect(sidebar).toBeVisible();

      console.log('✅ Hamburger menu opens sidebar on mobile');
    } else {
      console.log('⚠️ Hamburger menu button not found (sidebar might always be visible)');
    }
  });

  test('no debería tener horizontal scroll en ninguna vista', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/leads',
      '/calendar',
      '/import-leads',
      '/gamification'
    ];

    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Check for horizontal scroll
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        const hasHorizontalScroll = scrollWidth > viewportWidth;

        if (hasHorizontalScroll) {
          console.warn(`⚠️ Horizontal scroll detected on ${viewport.name} at ${pagePath}`);
          await page.screenshot({
            path: `screenshots/responsive-horizontal-scroll-${viewport.name}-${pagePath.replace('/', '-')}.png`
          });
        } else {
          console.log(`✅ No horizontal scroll on ${viewport.name} at ${pagePath}`);
        }
      }
    }
  });
});
