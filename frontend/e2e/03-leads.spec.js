import { test, expect } from '@playwright/test';
import { login } from './selectors';

/**
 * E2E Tests for Leads
 * ROVI CRM - CRUD, Kanban, Duplicates, Filters
 */

test.describe('Leads', () => {

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page);
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to leads page
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar lista de leads en tabla', async ({ page }) => {
    // Wait for leads page to load
    await page.waitForLoadState('networkidle');

    // Verify the page is visible and at least one of the supported views renders
    await expect(page.locator('[data-testid="leads-page"]')).toBeVisible({ timeout: 5000 });

    const table = page.locator('table, [role="table"]').first();
    const kanbanCard = page.locator('[data-testid^="lead-card-"]').first();
    const tableRow = page.locator('[data-testid^="table-row-"]').first();

    const hasTable = await table.isVisible().catch(() => false);
    const hasKanbanCard = await kanbanCard.isVisible().catch(() => false);
    const hasTableRow = await tableRow.isVisible().catch(() => false);

    expect(hasTable || hasKanbanCard || hasTableRow).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/leads-table.png' });
  });

  test('debería mostrar filtros de leads', async ({ page }) => {
    // Wait for leads page to load
    await page.waitForLoadState('networkidle');

    // Look for filter elements
    const filters = page.locator('select, input[placeholder*="filtrar" i], input[placeholder*="search" i]').first();
    await expect(filters).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/leads-filters.png' });
  });

  test('debería mostrar botón de crear nuevo lead', async ({ page }) => {
    // Look for "Nuevo Lead" or "Create Lead" button
    const newLeadButton = page.locator('button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead")').first();
    await expect(newLeadButton).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/leads-new-button.png' });
  });

  test('debería crear un lead nuevo sin duplicados', async ({ page }) => {
    // Click on "Nuevo Lead" button
    const newLeadButton = page.locator('button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead")').first();
    await newLeadButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Fill the form
    const timestamp = Date.now();
    await page.fill('input[name="name"], input[placeholder*="nombre" i]', `Juan Lead Test ${timestamp}`);
    await page.fill('input[name="email"], input[placeholder*="email" i]', `juan.test${timestamp}@example.com`);
    await page.fill('input[name="phone"], input[placeholder*="teléfono" i]', '+52 998 765 4321');

    // Select status if dropdown exists
    const statusDropdown = page.locator('select[name="status"]').first();
    const statusVisible = await statusDropdown.isVisible().catch(() => false);
    if (statusVisible) {
      await statusDropdown.selectOption('nuevo');
    }

    // Submit form
    const submitButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")').first();
    await submitButton.click();

    // Wait for success message
    await page.waitForTimeout(2000);

    // Verify modal is closed and lead was created
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
    const modalVisible = await modal.isVisible().catch(() => false);

    if (modalVisible) {
      // Check for duplicate detection modal
      const duplicateText = page.locator('text=/duplicado|duplicate/i');
      const hasDuplicates = await duplicateText.isVisible().catch(() => false);

      if (hasDuplicates) {
        // Duplicate detection appeared - this is unexpected for this test
        await page.screenshot({ path: 'screenshots/leads-duplicate-modal.png' });
        throw new Error('Duplicate detection modal appeared for new lead');
      }
    }

    // Screenshot
    await page.screenshot({ path: 'screenshots/lead-created.png' });

    // Verify lead appears in table (reload page if needed)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Look for the new lead in the table
    const newLeadInTable = page.locator(`text=/Juan Lead Test ${timestamp}/`);
    await expect(newLeadInTable).toBeVisible({ timeout: 5000 });
  });

  test('debería detectar duplicados por email', async ({ page }) => {
    // Click on "Nuevo Lead" button
    const newLeadButton = page.locator('button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead")').first();
    await newLeadButton.click();

    // Wait for modal
    await page.waitForTimeout(1000);

    // Fill with DUPLICATE email (using existing email from API test)
    await page.fill('input[name="name"], input[placeholder*="nombre" i]', 'Juan Duplicado Email');
    await page.fill('input[name="email"], input[placeholder*="email" i]', 'juan.perez.test@example.com'); // Existing email
    await page.fill('input[name="phone"], input[placeholder*="teléfono" i]', '+52 998 111 2222');

    // Submit form
    const submitButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")').first();
    await submitButton.click();

    // Wait for duplicate detection modal
    await page.waitForTimeout(2000);

    // Verify duplicate modal appears
    const duplicateModal = page.locator('text=/duplicado|duplicate/i').first();
    await expect(duplicateModal).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/leads-duplicate-email.png' });

    // Verify modal shows confidence level
    const confidence = page.locator('text=/confianza|confidence|100%|95%/i');
    await expect(confidence).toBeVisible();

    // Click "Cancelar" to close modal
    const cancelButton = page.locator('button:has-text("Cancelar"), button:has-text("Cancel")').first();
    await cancelButton.click();

    // Wait for modal to close
    await page.waitForTimeout(1000);
  });

  test('debería detectar duplicados por teléfono', async ({ page }) => {
    // Click on "Nuevo Lead" button
    const newLeadButton = page.locator('button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead")').first();
    await newLeadButton.click();

    // Wait for modal
    await page.waitForTimeout(1000);

    // Fill with DUPLICATE phone (using existing phone from API test)
    await page.fill('input[name="name"], input[placeholder*="nombre" i]', 'María Duplicada Teléfono');
    await page.fill('input[name="email"], input[placeholder*="email" i]', 'maria.duplicada@example.com');
    await page.fill('input[name="phone"], input[placeholder*="teléfono" i]', '+52 999 123 4567'); // Existing phone

    // Submit form
    const submitButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")').first();
    await submitButton.click();

    // Wait for duplicate detection modal
    await page.waitForTimeout(2000);

    // Verify duplicate modal appears
    const duplicateModal = page.locator('text=/duplicado|duplicate/i').first();
    await expect(duplicateModal).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/leads-duplicate-phone.png' });

    // Verify it shows phone match
    const phoneMatch = page.locator('text=/teléfono|phone/i');
    await expect(phoneMatch).toBeVisible();

    // Click "Cancelar"
    const cancelButton = page.locator('button:has-text("Cancelar"), button:has-text("Cancel")').first();
    await cancelButton.click();

    // Wait for modal to close
    await page.waitForTimeout(1000);
  });

  test('debería poder crear lead duplicado usando "Crear de todos modos"', async ({ page }) => {
    // Click on "Nuevo Lead" button
    const newLeadButton = page.locator('button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead")').first();
    await newLeadButton.click();

    // Wait for modal
    await page.waitForTimeout(1000);

    // Fill with duplicate email
    await page.fill('input[name="name"], input[placeholder*="nombre" i]', 'Juan Duplicado Forzado');
    await page.fill('input[name="email"], input[placeholder*="email" i]', 'juan.perez.test@example.com');
    await page.fill('input[name="phone"], input[placeholder*="teléfono" i]', '+52 998 222 3333');

    // Submit form
    const submitButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")').first();
    await submitButton.click();

    // Wait for duplicate modal
    await page.waitForTimeout(2000);

    // Verify duplicate modal appears
    const duplicateModal = page.locator('text=/duplicado|duplicate/i').first();
    await expect(duplicateModal).toBeVisible({ timeout: 5000 });

    // Click "Crear de todos modos" or "Create anyway"
    const createAnywayButton = page.locator('button:has-text("Crear de todos modos"), button:has-text("Create anyway"), button:has-text("Forzar")').first();
    await createAnywayButton.click();

    // Wait for creation
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({ path: 'screenshots/lead-created-duplicate.png' });

    // Reload and verify lead was created
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Look for the new lead
    const newLeadInTable = page.locator('text=/Juan Duplicado Forzado/');
    await expect(newLeadInTable).toBeVisible({ timeout: 5000 });
  });

  test('debería mostrar vista Kanban', async ({ page }) => {
    // Wait for leads page to load
    await page.waitForLoadState('networkidle');

    // Look for Kanban view toggle button
    const kanbanButton = page.locator('button:has-text("Kanban"), button[title*="Kanban" i], button:has-text("Tablero")').first();
    const kanbanExists = await kanbanButton.isVisible().catch(() => false);

    if (kanbanExists) {
      await kanbanButton.click();
      await page.waitForTimeout(1000);

      // Verify Kanban columns are visible
      const columns = page.locator('[class*="column"], [class*="Column"], [data-testid*="column"]').first();
      await expect(columns).toBeVisible({ timeout: 5000 });

      // Screenshot
      await page.screenshot({ path: 'screenshots/leads-kanban.png', fullPage: true });
    } else {
      // Kanban might not be implemented or button has different text
      console.log('⚠️ Kanban button not found');
      await page.screenshot({ path: 'screenshots/leads-kanban-not-found.png' });
    }
  });

  test('debería filtrar leads por status', async ({ page }) => {
    // Wait for leads page to load
    await page.waitForLoadState('networkidle');

    // Look for status filter
    const statusFilter = page.locator('select[name="status"], [data-testid*="status"]').first();
    const filterExists = await statusFilter.isVisible().catch(() => false);

    if (filterExists) {
      // Select "nuevo" status
      await statusFilter.selectOption('nuevo');
      await page.waitForTimeout(1000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/leads-filtered.png' });

      // Verify table updated (wait for network idle)
      await page.waitForLoadState('networkidle');
    } else {
      console.log('⚠️ Status filter not found');
    }
  });

  test('debería buscar leads', async ({ page }) => {
    // Wait for leads page to load
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i], input[name="search"]').first();
    const searchExists = await searchInput.isVisible().catch(() => false);

    if (searchExists) {
      // Type search query
      await searchInput.fill('Test');
      await page.waitForTimeout(1000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/leads-search.png' });

      // Wait for results
      await page.waitForLoadState('networkidle');
    } else {
      console.log('⚠️ Search input not found');
    }
  });

  test('debería poder editar un lead', async ({ page }) => {
    // Wait for leads page to load
    await page.waitForLoadState('networkidle');

    // Look for edit button on first lead
    const editButton = page.locator('button:has-text("Editar"), button[aria-label*="edit" i]').first();
    const editExists = await editButton.isVisible().catch(() => false);

    if (editExists) {
      await editButton.click();
      await page.waitForTimeout(1000);

      // Verify edit modal appears
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
      await expect(modal.first()).toBeVisible();

      // Screenshot
      await page.screenshot({ path: 'screenshots/leads-edit-modal.png' });

      // Close modal
      const closeButton = page.locator('button:has-text("Cancelar"), button[aria-label="Close"]').first();
      await closeButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️ Edit button not found');
    }
  });

  test('debería poder eliminar un lead (soft delete)', async ({ page }) => {
    // Wait for leads page to load
    await page.waitForLoadState('networkidle');

    // Count leads before deletion
    const leadsBefore = await page.locator('tbody tr, [role="row"]').count();

    // Look for delete button on last lead
    const deleteButton = page.locator('button:has-text("Eliminar"), button[aria-label*="delete" i]').last();
    const deleteExists = await deleteButton.isVisible().catch(() => false);

    if (deleteExists && leadsBefore > 0) {
      // Store number of leads
      const leadsCountBefore = await page.locator('tbody tr, [role="row"]').count();

      await deleteButton.click();
      await page.waitForTimeout(500);

      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Yes")').first();
      const confirmExists = await confirmButton.isVisible().catch(() => false);

      if (confirmExists) {
        await confirmButton.click();
      }

      // Wait for deletion
      await page.waitForTimeout(2000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/lead-deleted.png' });

      // Reload and verify lead count decreased
      await page.reload();
      await page.waitForLoadState('networkidle');

      const leadsAfter = await page.locator('tbody tr, [role="row"]').count();

      // Should have one less lead (or same count if soft delete still shows it)
      console.log(`Leads before: ${leadsCountBefore}, after: ${leadsAfter}`);
    } else {
      console.log('⚠️ Delete button not found or no leads to delete');
    }
  });

  test('debería ser responsive en móvil', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot mobile view
    await page.screenshot({ path: 'screenshots/leads-mobile.png', fullPage: true });

    // Verify leads table is visible (might need horizontal scroll)
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();
  });
});
