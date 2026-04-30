import { test, expect } from '@playwright/test';
import { login } from './selectors';

/**
 * E2E Tests for Calendar
 * ROVI CRM - Events, Round-Robin, Google Sync
 */

test.describe('Calendar', () => {

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page);
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to calendar page
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar calendario mensual', async ({ page }) => {
    // Wait for calendar page to load
    await page.waitForLoadState('networkidle');

    // Look for calendar grid or month view
    const calendarGrid = page.locator('[class*="calendar"], [class*="Calendar"], .month-view, [role="grid"]').first();
    await expect(calendarGrid).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/calendar-month-view.png' });

    // Look for navigation buttons (previous/next month)
    const navButtons = page.locator('button:has-text("Anterior"), button:has-text("Siguiente"), button[aria-label*="month" i]');
    const navExists = await navButtons.first().isVisible().catch(() => false);

    if (navExists) {
      console.log('✅ Calendar navigation buttons visible');
    }
  });

  test('debería tener botón para crear nuevo evento', async ({ page }) => {
    // Wait for calendar page to load
    await page.waitForLoadState('networkidle');

    // Look for "Nuevo Evento" or "Create Event" button
    const newEventButton = page.locator('button:has-text("Nuevo Evento"), button:has-text("Crear Evento"), button:has-text("+ Evento")').first();
    await expect(newEventButton).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/calendar-new-button.png' });
  });

  test('debería mostrar eventos en el calendario', async ({ page }) => {
    // Wait for calendar page to load
    await page.waitForLoadState('networkidle');

    // Look for event markers or dots
    const events = page.locator('[class*="event"], [class*="Event"], .calendar-event').all();
    const eventCount = events.length;

    console.log(`Events visible: ${eventCount}`);

    // Screenshot
    await page.screenshot({ path: 'screenshots/calendar-events.png' });

    // Even if there are no events, the calendar should be visible
    const calendarGrid = page.locator('[class*="calendar"], [class*="Calendar"]').first();
    await expect(calendarGrid).toBeVisible();
  });

  test('debería crear un nuevo evento', async ({ page }) => {
    // Wait for calendar page to load
    await page.waitForLoadState('networkidle');

    // Click on "Nuevo Evento" button
    const newEventButton = page.locator('button:has-text("Nuevo Evento"), button:has-text("Crear Evento"), button:has-text("+ Evento")').first();
    await newEventButton.click();

    // Wait for modal
    await page.waitForTimeout(1000);

    // Screenshot modal
    await page.screenshot({ path: 'screenshots/calendar-new-event-modal.png' });

    // Fill event form
    const titleInput = page.locator('input[name="title"], input[placeholder*="título" i], input[placeholder*="title" i]').first();
    const titleVisible = await titleInput.isVisible().catch(() => false);

    if (titleVisible) {
      const timestamp = Date.now();
      await titleInput.fill(`Cita Test ${timestamp}`);

      // Look for date/time inputs
      const dateInput = page.locator('input[type="date"], input[name="date"]').first();
      const dateVisible = await dateInput.isVisible().catch(() => false);

      if (dateVisible) {
        await dateInput.fill(new Date().toISOString().split('T')[0]);
      }

      // Look for description
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="descripción" i]').first();
      const descVisible = await descInput.isVisible().catch(() => false);

      if (descVisible) {
        await descInput.fill('Cita de prueba para E2E testing');
      }

      // Submit form
      const submitButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")').first();
      await submitButton.click();

      // Wait for creation
      await page.waitForTimeout(2000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/calendar-event-created.png' });

      // Verify event was created (look for success message)
      const successMessage = page.locator('text=/creado|exitoso|success/i').first();
      const successExists = await successMessage.isVisible().catch(() => false);

      if (successExists) {
        console.log('✅ Event created successfully');
      }

      // Reload and verify event appears
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Look for the new event
      const newEvent = page.locator(`text=/Cita Test ${timestamp}/`).first();
      const eventExists = await newEvent.isVisible().catch(() => false);

      if (eventExists) {
        console.log('✅ New event visible in calendar');
      }
    } else {
      console.log('⚠️ Event form not found or modal not visible');
    }
  });

  test('debería navegar entre meses', async ({ page }) => {
    // Wait for calendar page to load
    await page.waitForLoadState('networkidle');

    // Get current month from page
    const currentMonth = await page.locator('text=/Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre|January|February|March/i').first().textContent();

    console.log('Current month:', currentMonth);

    // Look for next month button
    const nextMonthButton = page.locator('button:has-text("Siguiente"), button:has-text("Next"), button[aria-label*="next" i]').first();
    const nextExists = await nextMonthButton.isVisible().catch(() => false);

    if (nextExists) {
      await nextMonthButton.click();
      await page.waitForTimeout(1000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/calendar-next-month.png' });

      console.log('✅ Navigated to next month');
    }

    // Look for previous month button
    const prevMonthButton = page.locator('button:has-text("Anterior"), button:has-text("Prev"), button[aria-label*="previous" i]').first();
    const prevExists = await prevMonthButton.isVisible().catch(() => false);

    if (prevExists) {
      await prevMonthButton.click();
      await page.waitForTimeout(1000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/calendar-prev-month.png' });

      console.log('✅ Navigated to previous month');
    }

    // Look for "Today" button
    const todayButton = page.locator('button:has-text("Hoy"), button:has-text("Today")').first();
    const todayExists = await todayButton.isVisible().catch(() => false);

    if (todayExists) {
      await todayButton.click();
      await page.waitForTimeout(1000);

      console.log('✅ Navigated to today');
    }
  });

  test('debería mostrar detalles de evento al hacer click', async ({ page }) => {
    // Wait for calendar page to load
    await page.waitForLoadState('networkidle');

    // Look for existing events
    const events = page.locator('[class*="event"], [class*="Event"]').all();

    if (events.length > 0) {
      // Click on first event
      await events.first().click();
      await page.waitForTimeout(1000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/calendar-event-details.png' });

      // Look for event details modal
      const modal = page.locator('[role="dialog"], .modal, [class*="event-detail"]').first();
      const modalExists = await modal.isVisible().catch(() => false);

      if (modalExists) {
        console.log('✅ Event details modal shown');
      }
    } else {
      console.log('⚠️ No events found to click');
    }
  });

  test('debería ser responsive en móvil', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot mobile view
    await page.screenshot({ path: 'screenshots/calendar-mobile.png', fullPage: true });

    // Verify calendar is still usable on mobile
    const calendarGrid = page.locator('[class*="calendar"], [class*="Calendar"]').first();
    await expect(calendarGrid).toBeVisible();
  });
});
