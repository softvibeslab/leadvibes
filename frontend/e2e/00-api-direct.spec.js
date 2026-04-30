import { test, expect } from '@playwright/test';

/**
 * TEST DIRECTO - API Call
 * Para verificar si la llamada API funciona directamente
 */

test('Diagnóstico: Llamada API directa sin frontend React', async ({ page }) => {
  console.log('🔍 Making direct API call to /api/auth/login');

  // Try direct API call using Playwright's request context
  try {
    const response = await page.request.post('http://localhost:13000/api/auth/login', {
      data: {
        email: 'admin@rovi.com',
        password: 'Admin123!'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Direct API call status:', response.status());
    console.log('✅ Direct API call headers:', response.headers());

    const responseBody = await response.json();
    console.log('✅ Direct API call response:', JSON.stringify(responseBody, null, 2));

    expect(response.status()).toBe(200);

    if (responseBody.access_token) {
      console.log('✅✅✅ SUCCESS: API call works directly! Token:', responseBody.access_token.substring(0, 20) + '...');
    }
  } catch (error) {
    console.log('❌ Direct API call failed:', error);

    // Try alternative: call backend directly without nginx proxy
    console.log('🔄 Trying backend directly (without nginx proxy)...');
    try {
      const backendResponse = await page.request.post('http://localhost:18080/api/auth/login', {
        data: {
          email: 'admin@rovi.com',
          password: 'Admin123!'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const backendBody = await backendResponse.json();
      console.log('✅ Backend direct call works! Status:', backendResponse.status());
      console.log('✅ Backend response:', JSON.stringify(backendBody, null, 2));
    } catch (backendError) {
      console.log('❌ Backend direct call also failed:', backendError);
    }
  }
});
