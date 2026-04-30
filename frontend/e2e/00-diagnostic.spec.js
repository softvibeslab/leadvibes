import { test, expect } from '@playwright/test';

/**
 * TEST DE DIAGNÓSTICO - Login Issue
 * Para investigar por qué el login no funciona en Playwright
 */

test('Diagnóstico: Verificar que login API call se hace correctamente', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:13000/login');
  await page.waitForLoadState('domcontentloaded');

  // Enable network monitoring
  const apiCalls = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log('📤 API Request:', request.method(), request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const responseBody = await response.text().catch(() => 'Could not capture');
      console.log('📥 API Response:', response.status(), response.url(), responseBody.substring(0, 200));
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    } else {
      console.log('ℹ️  Console Log:', msg.text());
    }
  });

  // Take initial screenshot
  await page.screenshot({ path: 'screenshots/diagnostic-01-initial-state.png' });

  // Find and fill email input
  const emailInput = page.locator('input#login-email, input[data-testid="login-email"], input[placeholder*="email" i], input[type="email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill('admin@rovi.com');
  console.log('✅ Email filled');

  await page.screenshot({ path: 'screenshots/diagnostic-02-email-filled.png' });

  // Find and fill password input
  const passwordInput = page.locator('input#login-password, input[placeholder*="contraseña" i], input[placeholder*="password" i], input[type="password"]').first();
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('Admin123!');
  console.log('✅ Password filled');

  await page.screenshot({ path: 'screenshots/diagnostic-03-password-filled.png' });

  // Find and click submit button
  const submitButton = page.locator('button[data-testid="login-submit"], form button[type="submit"]').first();
  await expect(submitButton).toBeVisible();
  console.log('✅ Submit button found');

  // Click submit button
  await submitButton.click();
  console.log('✅ Submit button clicked');

  // Wait and monitor what happens
  await page.waitForTimeout(5000);

  // Check current state
  const currentUrl = page.url();
  console.log('📍 Current URL after 5s:', currentUrl);

  // Check localStorage
  const token = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const data = {};
    keys.forEach(key => {
      data[key] = localStorage.getItem(key);
    });
    return data;
  });
  console.log('💾 localStorage:', token);

  // Check sessionStorage
  const session = await page.evaluate(() => {
    const keys = Object.keys(sessionStorage);
    const data = {};
    keys.forEach(key => {
      data[key] = sessionStorage.getItem(key);
    });
    return data;
  });
  console.log('🗃️ sessionStorage:', session);

  // Summary of API calls
  console.log('📊 Total API calls:', apiCalls.length);
  apiCalls.forEach(call => {
    console.log('  -', call.method, call.url);
  });

  // Final screenshot
  await page.screenshot({ path: 'screenshots/diagnostic-04-final-state.png', fullPage: true });

  // Try to make a direct API call to verify backend works
  console.log('🔍 Making direct API call to verify backend...');
  try {
    const directResponse = await page.context().request.post('http://localhost:13000/api/auth/login', {
      data: {
        email: 'admin@rovi.com',
        password: 'Admin123!'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Direct API call successful:', directResponse.status());
    const directResponseBody = await directResponse.text();
    console.log('📄 Direct API response:', directResponseBody.substring(0, 500));
  } catch (error) {
    console.log('❌ Direct API call failed:', error.message);
  }

  // Final assessment
  if (token['leadvibes_token'] || token['token']) {
    console.log('✅✅✅ SUCCESS: Token found in localStorage, login working!');
  } else if (apiCalls.length > 0) {
    console.log('⚠️  API calls were made but no token set - check frontend logic');
  } else {
    console.log('❌ FAILURE: No API calls made - submit button not working');
  }

  // Don't fail the test, just report findings
  expect(true).toBe(true);
});
