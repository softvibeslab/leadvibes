# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-leads.spec.js >> Leads >> debería mostrar lista de leads en tabla
- Location: e2e/03-leads.spec.js:22:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="leads-page"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="leads-page"]')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { login } from './selectors';
  3   | 
  4   | /**
  5   |  * E2E Tests for Leads
  6   |  * ROVI CRM - CRUD, Kanban, Duplicates, Filters
  7   |  */
  8   | 
  9   | test.describe('Leads', () => {
  10  | 
  11  |   // Login before each test
  12  |   test.beforeEach(async ({ page }) => {
  13  |     await page.goto('/login');
  14  |     await login(page);
  15  |     await page.waitForURL('**/dashboard', { timeout: 10000 });
  16  | 
  17  |     // Navigate to leads page
  18  |     await page.goto('/leads');
  19  |     await page.waitForLoadState('networkidle');
  20  |   });
  21  | 
  22  |   test('debería mostrar lista de leads en tabla', async ({ page }) => {
  23  |     // Wait for leads page to load
  24  |     await page.waitForLoadState('networkidle');
  25  | 
  26  |     // Verify the page is visible and at least one of the supported views renders
> 27  |     await expect(page.locator('[data-testid="leads-page"]')).toBeVisible({ timeout: 5000 });
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  28  | 
  29  |     const table = page.locator('table, [role="table"]').first();
  30  |     const kanbanCard = page.locator('[data-testid^="lead-card-"]').first();
  31  |     const tableRow = page.locator('[data-testid^="table-row-"]').first();
  32  | 
  33  |     const hasTable = await table.isVisible().catch(() => false);
  34  |     const hasKanbanCard = await kanbanCard.isVisible().catch(() => false);
  35  |     const hasTableRow = await tableRow.isVisible().catch(() => false);
  36  | 
  37  |     expect(hasTable || hasKanbanCard || hasTableRow).toBe(true);
  38  | 
  39  |     // Take screenshot
  40  |     await page.screenshot({ path: 'screenshots/leads-table.png' });
  41  |   });
  42  | 
  43  |   test('debería mostrar filtros de leads', async ({ page }) => {
  44  |     // Wait for leads page to load
  45  |     await page.waitForLoadState('networkidle');
  46  | 
  47  |     // Look for filter elements
  48  |     const filters = page.locator('select, input[placeholder*="filtrar" i], input[placeholder*="search" i]').first();
  49  |     await expect(filters).toBeVisible({ timeout: 5000 });
  50  | 
  51  |     // Screenshot
  52  |     await page.screenshot({ path: 'screenshots/leads-filters.png' });
  53  |   });
  54  | 
  55  |   test('debería mostrar botón de crear nuevo lead', async ({ page }) => {
  56  |     // Look for "Nuevo Lead" or "Create Lead" button
  57  |     const newLeadButton = page.locator('button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead")').first();
  58  |     await expect(newLeadButton).toBeVisible({ timeout: 5000 });
  59  | 
  60  |     // Screenshot
  61  |     await page.screenshot({ path: 'screenshots/leads-new-button.png' });
  62  |   });
  63  | 
  64  |   test('debería crear un lead nuevo sin duplicados', async ({ page }) => {
  65  |     // Click on "Nuevo Lead" button
  66  |     const newLeadButton = page.locator('button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead")').first();
  67  |     await newLeadButton.click();
  68  | 
  69  |     // Wait for modal to appear
  70  |     await page.waitForTimeout(1000);
  71  | 
  72  |     // Fill the form
  73  |     const timestamp = Date.now();
  74  |     await page.fill('input[name="name"], input[placeholder*="nombre" i]', `Juan Lead Test ${timestamp}`);
  75  |     await page.fill('input[name="email"], input[placeholder*="email" i]', `juan.test${timestamp}@example.com`);
  76  |     await page.fill('input[name="phone"], input[placeholder*="teléfono" i]', '+52 998 765 4321');
  77  | 
  78  |     // Select status if dropdown exists
  79  |     const statusDropdown = page.locator('select[name="status"]').first();
  80  |     const statusVisible = await statusDropdown.isVisible().catch(() => false);
  81  |     if (statusVisible) {
  82  |       await statusDropdown.selectOption('nuevo');
  83  |     }
  84  | 
  85  |     // Submit form
  86  |     const submitButton = page.locator('button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")').first();
  87  |     await submitButton.click();
  88  | 
  89  |     // Wait for success message
  90  |     await page.waitForTimeout(2000);
  91  | 
  92  |     // Verify modal is closed and lead was created
  93  |     const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
  94  |     const modalVisible = await modal.isVisible().catch(() => false);
  95  | 
  96  |     if (modalVisible) {
  97  |       // Check for duplicate detection modal
  98  |       const duplicateText = page.locator('text=/duplicado|duplicate/i');
  99  |       const hasDuplicates = await duplicateText.isVisible().catch(() => false);
  100 | 
  101 |       if (hasDuplicates) {
  102 |         // Duplicate detection appeared - this is unexpected for this test
  103 |         await page.screenshot({ path: 'screenshots/leads-duplicate-modal.png' });
  104 |         throw new Error('Duplicate detection modal appeared for new lead');
  105 |       }
  106 |     }
  107 | 
  108 |     // Screenshot
  109 |     await page.screenshot({ path: 'screenshots/lead-created.png' });
  110 | 
  111 |     // Verify lead appears in table (reload page if needed)
  112 |     await page.reload();
  113 |     await page.waitForLoadState('networkidle');
  114 | 
  115 |     // Look for the new lead in the table
  116 |     const newLeadInTable = page.locator(`text=/Juan Lead Test ${timestamp}/`);
  117 |     await expect(newLeadInTable).toBeVisible({ timeout: 5000 });
  118 |   });
  119 | 
  120 |   test('debería detectar duplicados por email', async ({ page }) => {
  121 |     // Click on "Nuevo Lead" button
  122 |     const newLeadButton = page.locator('button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead")').first();
  123 |     await newLeadButton.click();
  124 | 
  125 |     // Wait for modal
  126 |     await page.waitForTimeout(1000);
  127 | 
```