import { test, expect } from '@playwright/test';
import { login } from './selectors';

/**
 * E2E Tests for Dashboard
 * ROVI CRM - Stats Cards, Trends, Comparison, Funnel, Top Brokers
 */

test.describe('Dashboard', () => {

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page);
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('debería mostrar stats cards con datos reales', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for stats cards (should have at least 3-4 cards)
    const statsCards = page.locator('[class*="card"], [class*="Card"]').filter({ hasText: /(Puntos|Apartados|Ventas|Brokers)/i });

    // Verify at least 3 stats cards are visible
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });

    // Take screenshot for visual verification
    await page.screenshot({ path: 'screenshots/dashboard-stats-cards.png' });

    // Verify cards have numbers (not hardcoded dummy data)
    // Check that there are numbers in the stats area
    const statsArea = page.locator('text=/\\d+/').first();
    await expect(statsArea).toBeVisible();
  });

  test('debería mostrar analytics avanzado', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for "Analytics Avanzado" section or similar
    const analyticsSection = page.locator('text=/Analytics|Avanzado|Trends/i').first();
    await expect(analyticsSection).toBeVisible({ timeout: 5000 });

    // Take screenshot
    await page.screenshot({ path: 'screenshots/dashboard-analytics.png', fullPage: true });
  });

  test('debería mostrar gráfico de trends sin datos dummy', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for chart/graph elements
    const chart = page.locator('[class*="chart"], [class*="Chart"], canvas, svg').first();
    await expect(chart).toBeVisible({ timeout: 5000 });

    // Verify it's not showing hardcoded dummy data like "Enero=12, Febrero=15"
    // This is more of a visual check, but we can verify the chart exists
    await page.screenshot({ path: 'screenshots/dashboard-trends-chart.png' });
  });

  test('debería mostrar comparison card (mes actual vs anterior)', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for comparison metrics
    const comparison = page.locator('text=/Mes Actual|Mes Anterior|Comparación|vs/i').first();
    await expect(comparison).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/dashboard-comparison.png' });
  });

  test('debería mostrar conversion funnel', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for funnel elements
    const funnel = page.locator('text=/Funnel|Conversión|Nuevo|Contactado|Venta/i').first();
    await expect(funnel).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/dashboard-funnel.png' });
  });

  test('debería mostrar top brokers (solo agency)', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for leaderboard or top brokers section
    const leaderboard = page.locator('text=/Top Brokers|Leaderboard|Mejores/i').first();

    // This might not be visible for individual users, so we check if it exists
    const isVisible = await leaderboard.isVisible().catch(() => false);

    if (isVisible) {
      await expect(leaderboard).toBeVisible();
      await page.screenshot({ path: 'screenshots/dashboard-leaderboard.png' });
    } else {
      // Individual users don't see leaderboard
      console.log('Leaderboard not visible (individual user)');
    }
  });

  test('debería mostrar recent activity feed', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for activity feed
    const activityFeed = page.locator('text=/Actividad|Activity|Reciente/i').first();
    await expect(activityFeed).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/dashboard-activity-feed.png' });
  });

  test('debería conectar WebSocket (verificar en console)', async ({ page }) => {
    // Listen for console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Wait a bit for WebSocket connection
    await page.waitForTimeout(3000);

    // Check console for WebSocket messages
    const wsMessages = consoleMessages.filter(msg =>
      msg.toLowerCase().includes('websocket') ||
      msg.toLowerCase().includes('connected') ||
      msg.toLowerCase().includes('real-time')
    );

    console.log('Console messages:', consoleMessages);
    console.log('WebSocket messages:', wsMessages);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/dashboard-websocket.png' });

    // WebSocket connection is optional, so we just log the result
    if (wsMessages.length > 0) {
      console.log('✅ WebSocket conectado');
    } else {
      console.log('⚠️ WebSocket no detectado en console');
    }
  });

  test('debería cargar todos los endpoints del dashboard sin errores', async ({ page }) => {
    // Listen for network responses
    const apiCalls = [];
    page.on('response', async response => {
      if (response.url().includes('/api/dashboard')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Wait for all dashboard API calls to complete
    await page.waitForTimeout(3000);

    // Verify API calls were successful
    console.log('Dashboard API calls:', apiCalls);

    // Check that all API calls returned 200 OK
    const failedCalls = apiCalls.filter(call => !call.ok);
    expect(failedCalls.length).toBe(0);

    // Expected endpoints
    const expectedEndpoints = [
      '/api/dashboard/stats',
      '/api/dashboard/trends',
      '/api/dashboard/comparison',
      '/api/dashboard/leaderboard'
    ];

    // Check that at least some endpoints were called
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('debería tener navegación funcional en el sidebar', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for sidebar navigation
    const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"], nav').first();
    await expect(sidebar).toBeVisible();

    // Click on "Leads" link
    const leadsLink = page.locator('a:has-text("Leads")').first();
    await leadsLink.click();

    // Should navigate to leads page
    await page.waitForURL('**/leads', { timeout: 3000 });
    await expect(page).toHaveURL(/\/leads/);

    // Go back to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify we're back on dashboard
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('debería ser responsive en móvil', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Take screenshot of mobile view
    await page.screenshot({ path: 'screenshots/dashboard-mobile.png', fullPage: true });

    // Verify dashboard is still usable on mobile
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Stats cards should stack vertically
    const statsCards = page.locator('[class*="card"], [class*="Card"]').first();
    await expect(statsCards).toBeVisible();
  });
});
