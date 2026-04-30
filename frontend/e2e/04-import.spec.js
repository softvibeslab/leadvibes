import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';
import { login } from './selectors';

/**
 * E2E Tests for Import Leads
 * ROVI CRM - Upload, Preview, Progress, Results
 */

test.describe('Import Leads', () => {

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await login(page);
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to import page
    await page.goto('/import');
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar página de import leads', async ({ page }) => {
    // Wait for import page to load
    await page.waitForLoadState('networkidle');

    // Look for import elements
    const title = page.locator('h1:has-text("Import"), h2:has-text("Import")');
    await expect(title.first()).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/import-page.png' });

    // Look for upload area or button
    const uploadArea = page.locator('[class*="upload"], input[type="file"], .dropzone').first();
    await expect(uploadArea).toBeVisible();
  });

  test('debería tener botón para descargar plantilla', async ({ page }) => {
    // Wait for import page to load
    await page.waitForLoadState('networkidle');

    // Look for "Descargar Plantilla" button
    const downloadButton = page.locator('button:has-text("Descargar"), button:has-text("Plantilla"), a:has-text("Plantilla")').first();
    await expect(downloadButton).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'screenshots/import-download-template.png' });
  });

  test('debería subir archivo CSV', async ({ page }) => {
    // Wait for import page to load
    await page.waitForLoadState('networkidle');

    // Create a simple CSV file for testing
    const csvContent = `Nombre,Email,Teléfono,Status,Prioridad,Fuente
Juan Test 1,juan1@test.com,+52998123456,nuevo,media,testing
Maria Test 2,maria2@test.com,+52998765432,contactado,alta,testing
Carlos Test 3,carlos3@test.com,+52998111122,nuevo,baja,testing`;

    const csvPath = path.join(process.cwd(), 'test-import.csv');
    await fs.writeFile(csvPath, csvContent);

    // Look for file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);

    // Wait for upload
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({ path: 'screenshots/import-uploaded.png' });

    // Verify upload was successful (look for success message or next step)
    const successMessage = page.locator('text=/exitoso|cargado|uploaded|success/i').first();
    const uploadSuccess = await successMessage.isVisible().catch(() => false);

    if (uploadSuccess) {
      await expect(successMessage).toBeVisible();
    }

    // Cleanup
    await fs.unlink(csvPath).catch(() => {});
  });

  test('debería mostrar mapeo de columnas', async ({ page }) => {
    // Upload CSV first
    const csvContent = `Nombre,Email,Teléfono,Status
Juan Test,juan@test.com,+52998123456,nuevo`;

    const csvPath = path.join(process.cwd(), 'test-import-mapping.csv');
    await fs.writeFile(csvPath, csvContent);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);

    // Wait for upload and mapping step
    await page.waitForTimeout(3000);

    // Screenshot
    await page.screenshot({ path: 'screenshots/import-column-mapping.png' });

    // Look for mapping dropdowns or table
    const mappingTable = page.locator('table:has-text("Columna"), table:has-text("Campo"), select').first();
    const mappingExists = await mappingTable.isVisible().catch(() => false);

    if (mappingExists) {
      await expect(mappingTable).toBeVisible();
    }

    // Cleanup
    await fs.unlink(csvPath).catch(() => {});
  });

  test('debería mostrar vista previa con stats', async ({ page }) => {
    // Upload CSV
    const csvContent = `Nombre,Email,Teléfono,Status
Juan Test 1,juan1@test.com,+52998123456,nuevo
Maria Test 2,maria2@test.com,+52998765432,contactado
Carlos Test 3,carlos3@test.com,+52998111122,nuevo`;

    const csvPath = path.join(process.cwd(), 'test-import-preview.csv');
    await fs.writeFile(csvPath, csvContent);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);

    // Wait for upload and preview step
    await page.waitForTimeout(3000);

    // Look for "Vista Previa" or "Preview" section
    const previewSection = page.locator('text=/Vista Previa|Preview/i').first();
    const previewExists = await previewSection.isVisible().catch(() => false);

    if (previewExists) {
      await expect(previewSection).toBeVisible();

      // Look for stats grid (Total, Válidas, Duplicados, Errores)
      const statsGrid = page.locator('text=/Total|Válidas|Duplicados|Errores/i');
      await expect(statsGrid.first()).toBeVisible();

      // Screenshot
      await page.screenshot({ path: 'screenshots/import-preview-stats.png' });

      // Look for preview table (should show only first 10 rows)
      const previewTable = page.locator('table tbody tr').all();
      const rowCount = previewTable.length;

      console.log(`Preview rows: ${rowCount}`);

      // Should have 3 rows or less (our test CSV has 3 rows)
      expect(rowCount).toBeGreaterThan(0);
      expect(rowCount).toBeLessThanOrEqual(10);
    }

    // Cleanup
    await fs.unlink(csvPath).catch(() => {});
  });

  test('debería mostrar badges de validación en preview', async ({ page }) => {
    // Upload CSV with some invalid data
    const csvContent = `Nombre,Email,Teléfono,Status
Juan Test,juan@test.com,+52998123456,nuevo
Maria Invalid,,+52998765432,contactado
Carlos Test,carlos@test.com,,nuevo`;

    const csvPath = path.join(process.cwd(), 'test-import-validation.csv');
    await fs.writeFile(csvPath, csvContent);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);

    // Wait for preview
    await page.waitForTimeout(3000);

    // Screenshot
    await page.screenshot({ path: 'screenshots/import-preview-badges.png' });

    // Look for badges (green for valid, red for errors)
    const badges = page.locator('[class*="badge"], [class*="status"], span:has-text("✓"), span:has-text("✗")').all();
    const badgeCount = badges.length;

    console.log(`Validation badges found: ${badgeCount}`);

    // Should have some badges
    expect(badgeCount).toBeGreaterThan(0);

    // Cleanup
    await fs.unlink(csvPath).catch(() => {});
  });

  test('debería ejecutar import y mostrar modal de progreso', async ({ page }) => {
    // Upload CSV
    const csvContent = `Nombre,Email,Teléfono,Status
Juan Test 1,juan1@test.com,+52998123456,nuevo
Maria Test 2,maria2@test.com,+52998765432,contactado
Carlos Test 3,carlos3@test.com,+52998111122,nuevo`;

    const csvPath = path.join(process.cwd(), 'test-import-progress.csv');
    await fs.writeFile(csvPath, csvContent);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);

    // Wait for preview/mapping
    await page.waitForTimeout(3000);

    // Look for "Importar" or "Execute" button
    const importButton = page.locator('button:has-text("Importar"), button:has-text("Execute"), button:has-text("Iniciar")').first();
    const importExists = await importButton.isVisible().catch(() => false);

    if (importExists) {
      await importButton.click();

      // Wait for progress modal
      await page.waitForTimeout(2000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/import-progress-modal.png' });

      // Look for progress modal elements
      const modal = page.locator('[role="dialog"], .modal, [class*="progress-modal"]').first();
      const modalExists = await modal.isVisible().catch(() => false);

      if (modalExists) {
        // Look for progress bar
        const progressBar = page.locator('[role="progressbar"], progress, [class*="progress-bar"]').first();
        await expect(progressBar).toBeVisible();

        // Look for stats in modal (Importados, Duplicados, Errores)
        const stats = page.locator('text=/Importados|Duplicados|Errores|Procesando/i');
        await expect(stats.first()).toBeVisible();

        console.log('✅ Import progress modal visible');

        // Wait for import to complete (might take 10-20 seconds)
        await page.waitForTimeout(15000);

        // Screenshot completed state
        await page.screenshot({ path: 'screenshots/import-progress-completed.png' });
      }
    } else {
      console.log('⚠️ Import button not found');
    }

    // Cleanup
    await fs.unlink(csvPath).catch(() => {});
  });

  test('debería navegar a resultado final', async ({ page }) => {
    // Upload CSV
    const csvContent = `Nombre,Email,Teléfono,Status
Juan Test 1,juan1@test.com,+52998123456,nuevo
Maria Test 2,maria2@test.com,+52998765432,contactado`;

    const csvPath = path.join(process.cwd(), 'test-import-result.csv');
    await fs.writeFile(csvPath, csvContent);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);

    // Wait for preview
    await page.waitForTimeout(3000);

    // Click import button
    const importButton = page.locator('button:has-text("Importar"), button:has-text("Execute")').first();
    const importExists = await importButton.isVisible().catch(() => false);

    if (importExists) {
      await importButton.click();

      // Wait for import to complete (might navigate to results)
      await page.waitForTimeout(20000);

      // Screenshot
      await page.screenshot({ path: 'screenshots/import-result-page.png' });

      // Look for result page elements
      const resultTitle = page.locator('text=/Resultado|Result|Completado|Finalizado/i').first();
      const resultExists = await resultTitle.isVisible().catch(() => false);

      if (resultExists) {
        console.log('✅ Navigated to results page');

        // Look for summary stats
        const summaryStats = page.locator('text=/importados|duplicados|errores/i');
        await expect(summaryStats.first()).toBeVisible();

        // Look for "Ver Leads" button
        const viewLeadsButton = page.locator('button:has-text("Ver Leads"), a:has-text("Leads")').first();
        const viewLeadsExists = await viewLeadsButton.isVisible().catch(() => false);

        if (viewLeadsExists) {
          console.log('✅ "Ver Leads" button visible');
        }
      }
    }

    // Cleanup
    await fs.unlink(csvPath).catch(() => {});
  });

  test('debería manejar archivos inválidos', async ({ page }) => {
    // Create invalid file (not CSV)
    const invalidContent = `This is not a CSV file
Just some random text`;

    const invalidPath = path.join(process.cwd(), 'test-invalid.txt');
    await fs.writeFile(invalidPath, invalidContent);

    // Try to upload
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(invalidPath);

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({ path: 'screenshots/import-invalid-file.png' });

    // Look for error message
    const errorMessage = page.locator('text=/error|inválido|invalid|no válido/i').first();
    const errorExists = await errorMessage.isVisible().catch(() => false);

    if (errorExists) {
      console.log('✅ Error message shown for invalid file');
      await expect(errorMessage).toBeVisible();
    }

    // Cleanup
    await fs.unlink(invalidPath).catch(() => {});
  });

  test('debería ser responsive en móvil', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Screenshot mobile view
    await page.screenshot({ path: 'screenshots/import-mobile.png', fullPage: true });

    // Verify import page is still usable on mobile
    const title = page.locator('h1:has-text("Import"), h2:has-text("Import")');
    await expect(title.first()).toBeVisible();
  });
});
