describe('New Booking Flow', () => {
  beforeEach(() => {
    // Seed a client account and log in via the API to get a real session
    cy.request('POST', '/api/auth/register', {
      firstName: 'Cypress',
      lastName: 'Tester',
      email: `cy_booking_${Date.now()}@example.com`,
      password: 'Password123!',
    }).then((res) => {
      const { token, user } = res.body.data;
      // Store auth state in localStorage the same way the Zustand store persists it
      localStorage.setItem(
        'kesmoving-auth',
        JSON.stringify({ state: { token, user }, version: 0 })
      );
    });
  });

  it('navigates through all 4 steps of the booking wizard', () => {
    cy.visit('/bookings/new');

    // Step 1 — Addresses
    cy.contains('Step 1').should('be.visible');
    cy.get('input[name="pickupStreet"], input[placeholder*="Pickup street"], input[placeholder*="pickup street"]')
      .first()
      .type('123 Maple St');
    cy.get('input[placeholder*="city"], input[name*="pickupCity"]').first().type('Toronto');
    cy.get('input[placeholder*="province"], input[name*="pickupProvince"]').first().type('ON');
    cy.get('input[placeholder*="postal"], input[name*="pickupPostal"]').first().type('M1A 1A1');

    cy.get('input[placeholder*="destination street"], input[name*="destStreet"]')
      .first()
      .type('456 Oak Ave');
    cy.get('input[placeholder*="destination city"], input[name*="destCity"]').first().type('Mississauga');
    cy.get('input[placeholder*="destination province"], input[name*="destProv"]').first().type('ON');
    cy.get('input[placeholder*="destination postal"], input[name*="destPostal"]').first().type('L5A 1B2');

    cy.contains(/next/i).click();

    // Step 2 — Move details
    cy.contains('Step 2').should('be.visible');
    cy.get('input[type="date"], input[name*="moveDate"]').first().type('2099-12-01');
    cy.contains(/next/i).click();

    // Step 3 — Photo upload (optional, just proceed)VM720:1 
     GET http://localhost:5173/api/bookings/undefined 422 (Unprocessable Entity)
    VM720:1 
     GET http://localhost:5173/api/bookings/undefined 422 (Unprocessable Entity)
    chunk-RPCDYKBN.js?v=9dc4a0c2:1232 Error: <svg> attribute width: Expected length, "lg".
    chunk-RPCDYKBN.js?v=9dc4a0c2:1232 Error: <svg> attribute height: Expected length, "lg".
    chunk-RPCDYKBN.js?v=9dc4a0c2:1232 Error: <svg> attribute width: Expected length, "lg".
    chunk-RPCDYKBN.js?v=9dc4a0c2:1232 Error: <svg> attribute height: Expected length, "lg".
    
    Understand this error
    ﻿
    
    cy.contains('Step 3').should('be.visible');
    cy.contains(/next|skip/i).click();

    // Step 4 — Estimate & confirm
    cy.contains('Step 4').should('be.visible');
    cy.contains(/confirm|book/i).should('be.visible');
  });
});
