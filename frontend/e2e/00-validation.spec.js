import { test, expect } from '@playwright/test';

/**
 * TEST DE VALIDACIÓN - Login Form
 * Para verificar si hay errores de validación
 */

test('Diagnóstico: Verificar validación y errores del formulario', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:13000/login');
  await page.waitForLoadState('domcontentloaded');

  // Enable console logging
  page.on('console', msg => {
    console.log('Console:', msg.type(), msg.text());
  });

  // Find form elements
  const form = page.locator('form').first();
  const emailInput = page.locator('input#login-email, input[placeholder*="email" i], input[type="email"]').first();
  const passwordInput = page.locator('input#login-password, input[placeholder*="contraseña" i], input[type="password"]').first();
  const submitButton = page.locator('button[data-testid="login-submit"], form button[type="submit"]').first();

  // Verify form exists
  await expect(form).toBeVisible();
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(submitButton).toBeVisible();

  console.log('✅ Form elements found');

  // Check if button is disabled
  const isDisabled = await submitButton.isDisabled();
  console.log('🔘 Submit button disabled?', isDisabled);

  // Fill form
  await emailInput.fill('admin@rovi.com');
  await passwordInput.fill('Admin123!');

  console.log('✅ Form filled');

  // Check form validity
  const isEmailValid = await emailInput.evaluate(el => el.checkValidity());
  const isPasswordValid = await passwordInput.evaluate(el => el.checkValidity());
  console.log('✅ Email valid?', isEmailValid);
  console.log('✅ Password valid?', isPasswordValid);

  // Try checking the entire form validity
  const isFormValid = await form.evaluate(el => el.checkValidity());
  console.log('✅ Form valid?', isFormValid);

  // Check for custom validation attributes
  const emailRequired = await emailInput.evaluate(el => el.required);
  const passwordRequired = await passwordInput.evaluate(el => el.required);
  console.log('✅ Email required?', emailRequired);
  console.log('✅ Password required?', passwordRequired);

  // Try to check if React form has custom validation
  const emailValue = await emailInput.inputValue();
  const passwordValue = await passwordInput.inputValue();
  console.log('📧 Email value:', emailValue);
  console.log('🔒 Password value:', passwordValue);

  // Try clicking submit button directly
  console.log('🖱️  Clicking submit button...');

  // Also try to submit form programmatically
  try {
    await form.evaluate(el => {
      el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    console.log('✅ Form submit event dispatched programmatically');
  } catch (error) {
    console.log('❌ Error dispatching submit:', error.message);
  }

  // Wait for any response
  await page.waitForTimeout(3000);

  // Check final state
  const currentUrl = page.url();
  console.log('📍 Final URL:', currentUrl);

  // Check for any error messages
  const errorElements = page.locator('[class*="error"], [role="alert"], text=/error|inválido|incorrecto/i').all();
  console.log('⚠️  Error elements found:', errorElements.length);

  // Check localStorage again
  const token = await page.evaluate(() => localStorage.getItem('leadvibes_token'));
  if (token) {
    console.log('✅ Token found after submit dispatch!');
  } else {
    console.log('❌ Still no token after submit dispatch');
  }

  // Take screenshot
  await page.screenshot({ path: 'screenshots/diagnostic-validation.png', fullPage: true });

  // Don't fail, just report
  expect(true).toBe(true);
});
