/**
 * Selectors Helper para Playwright E2E Tests
 * ROVI CRM - Selectores CSS flexibles y reutilizables
 */

// Auth selectors
export const authSelectors = {
  emailInput: 'input#login-email, input[data-testid="login-email"], input[placeholder*="email" i], input[type="email"]',
  passwordInput: 'input#login-password, input[placeholder*="contraseña" i], input[placeholder*="password" i], input[type="password"]',
  submitButton: 'button[data-testid="login-submit"], form button[type="submit"]',
  registerLink: 'a:has-text("Registrarse"), a:has-text("Regístrate"), a:has-text("Crear cuenta"), a:has-text("Registrarse")',
  logoutButton: 'button[data-testid="logout-btn"], button[aria-label*="cerrar sesión" i], button[title*="cerrar sesión" i], button:has-text("Cerrar sesión"), button:has-text("Logout"), [aria-label*="logout" i]'
};

// Dashboard selectors
export const dashboardSelectors = {
  title: 'h1:has-text("Dashboard"), h2:has-text("Dashboard")',
  statsCard: '[class*="card"], [class*="Card"], [data-testid*="stat"]',
  analyticsSection: 'text=/Analytics|Avanzado|Trends/i',
  trendsChart: '[class*="chart"], [class*="Chart"], canvas, svg',
  comparisonCard: 'text=/Mes Actual|Mes Anterior|Comparación|vs/i',
  funnel: 'text=/Funnel|Conversión|Nuevo|Contactado|Venta/i',
  leaderboard: 'text=/Top Brokers|Leaderboard|Mejores/i',
  activityFeed: 'text=/Actividad|Activity|Reciente/i'
};

// Leads selectors
export const leadsSelectors = {
  table: 'table, [role="table"], [data-testid*="leads-table"]',
  newLeadButton: 'button:has-text("Nuevo Lead"), button:has-text("Crear Lead"), button:has-text("+ Lead"), button:has-text("+ Nuevo")',
  emailInput: 'input[name="email"], input[placeholder*="email" i], input[type="email"]',
  phoneInput: 'input[name="phone"], input[placeholder*="teléfono" i], input[placeholder*="phone" i]',
  nameInput: 'input[name="name"], input[placeholder*="nombre" i], input[placeholder*="name" i]',
  saveButton: 'button:has-text("Guardar"), button:has-text("Crear"), button:has-text("Save")',
  cancelButton: 'button:has-text("Cancelar"), button:has-text("Cancel")',
  editButton: 'button:has-text("Editar"), button[aria-label*="edit" i], [data-testid*="edit"]',
  deleteButton: 'button:has-text("Eliminar"), button[aria-label*="delete" i], [data-testid*="delete"]',
  kanbanButton: 'button:has-text("Kanban"), button[title*="Kanban" i], button:has-text("Tablero")',
  kanbanColumn: '[class*="column"], [class*="Column"], [data-testid*="column"]'
};

// Import selectors
export const importSelectors = {
  title: 'h1:has-text("Import"), h2:has-text("Import"), h1:has-text("Importar")',
  uploadArea: '[class*="upload"], input[type="file"], .dropzone, [data-testid*="upload"]',
  downloadButton: 'button:has-text("Descargar"), button:has-text("Plantilla"), a:has-text("Plantilla")',
  importButton: 'button:has-text("Importar"), button:has-text("Execute"), button:has-text("Iniciar")',
  previewTable: 'table tbody tr, [data-testid*="preview"]',
  statsGrid: 'text=/Total|Válidas|Duplicados|Errores/i',
  progressBar: '[role="progressbar"], progress, [class*="progress-bar"]'
};

// Calendar selectors
export const calendarSelectors = {
  title: 'h1:has-text("Calendario"), h1:has-text("Calendar")',
  grid: '[class*="calendar"], [class*="Calendar"], .month-view, [role="grid"]',
  newEventButton: 'button:has-text("Nuevo Evento"), button:has-text("Crear Evento"), button:has-text("+ Evento")',
  eventTitle: 'input[name="title"], input[placeholder*="título" i], input[placeholder*="title" i]',
  eventDate: 'input[type="date"], input[name="date"]',
  eventDescription: 'textarea[name="description"], textarea[placeholder*="descripción" i]',
  nextMonthButton: 'button:has-text("Siguiente"), button:has-text("Next"), button[aria-label*="next" i]',
  prevMonthButton: 'button:has-text("Anterior"), button:has-text("Prev"), button[aria-label*="previous" i]',
  todayButton: 'button:has-text("Hoy"), button:has-text("Today")'
};

// Common selectors
export const commonSelectors = {
  sidebar: '[class*="sidebar"], [class*="Sidebar"], nav, [role="navigation"]',
  hamburgerButton: 'button[aria-label*="menu" i], button:has-text("☰"), [class*="hamburger"], [class*="menu-button"]',
  modal: '[role="dialog"], .modal, [class*="modal"], [data-testid*="modal"]',
  toast: '[class*="toast"], [role="alert"], [data-testid*="toast"]',
  loading: '[class*="loading"], [class*="spinner"], [aria-busy="true"]'
};

/**
 * Helper function to wait for page load and network idle
 */
export async function waitForPageLoad(page) {
  await page.waitForLoadState('load', { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // Network idle might timeout, continue anyway
  });
}

/**
 * Helper function to login with flexible selectors
 */
export async function login(page, email = 'admin@rovi.com', password = 'Admin123!') {
  const emailInput = page.locator(authSelectors.emailInput).first();
  const passwordInput = page.locator(authSelectors.passwordInput).first();
  const submitButton = page.locator(authSelectors.submitButton).first();

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Click submit and wait for response
  await Promise.all([
    page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 30000 }),
    submitButton.click()
  ]);

  // Wait for page to be fully loaded
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

  // Small wait for any animations/transitions
  await page.waitForTimeout(1000);

  // If onboarding appears, try to complete it
  const onboardingTitle = page.locator('h1:has-text("Onboarding"), h2:has-text("Bienvenido"), h1:has-text("Completa")').first();
  const onboardingVisible = await onboardingTitle.isVisible().catch(() => false);

  if (onboardingVisible) {
    console.log('⚠️ Onboarding detectado, intentando completar...');
    try {
      // Try multiple button texts for onboarding completion
      const completeButton = page.locator('button:has-text("Comenzar"), button:has-text("Finalizar"), button:has-text("Completar"), button:has-text("Continuar"), button:has-text("Skip")').first();
      await completeButton.click({ timeout: 5000 });

      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    } catch (e) {
      console.log('⚠️ No se pudo completar onboarding automáticamente:', e.message);
    }
  }
}

/**
 * Helper function to fill lead form
 */
export async function fillLeadForm(page, leadData) {
  const nameInput = page.locator(leadsSelectors.nameInput).first();
  const emailInput = page.locator(leadsSelectors.emailInput).first();
  const phoneInput = page.locator(leadsSelectors.phoneInput).first();

  await nameInput.fill(leadData.name || '');
  await emailInput.fill(leadData.email || '');
  await phoneInput.fill(leadData.phone || '');

  // Handle status dropdown if exists
  const statusDropdown = page.locator('select[name="status"]').first();
  const statusVisible = await statusDropdown.isVisible().catch(() => false);
  if (statusVisible && leadData.status) {
    await statusDropdown.selectOption(leadData.status);
  }
}

/**
 * Helper function to check if element exists and is visible
 */
export async function isVisible(page, selector) {
  const element = page.locator(selector).first();
  return await element.isVisible().catch(() => false);
}

/**
 * Helper function to click element if it exists
 */
export async function clickIfVisible(page, selector, timeout = 5000) {
  const element = page.locator(selector).first();
  const visible = await element.isVisible().catch(() => false);
  if (visible) {
    await element.click();
    return true;
  }
  return false;
}
