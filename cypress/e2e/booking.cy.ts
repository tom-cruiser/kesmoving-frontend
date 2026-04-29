describe('New Booking Flow', () => {
  it('navigates through all 4 steps of the booking wizard', () => {
    const email = `cy_booking_${Date.now()}@example.com`;

    cy.request('POST', '/api/auth/register', {
      firstName: 'Cypress',
      lastName: 'Tester',
      email,
      password: 'Password123!',
    }).then((res) => {
      const { token, refreshToken, user } = res.body.data;

      cy.visit('/bookings/new', {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            'kesmoving-auth',
            JSON.stringify({
              state: {
                token,
                refreshToken,
                user,
                isAuthenticated: true,
              },
              version: 0,
            })
          );
        },
      });
    });

    cy.contains('Book Your Move').should('be.visible');

    // Step 1 — Addresses
    cy.get('input[placeholder="Street address"]').first().type('123 Maple St');
    cy.get('input[placeholder="City"]').first().type('Toronto');
    cy.get('input[placeholder*="Postal code"]').first().type('M1A 1A1');

    cy.get('input[placeholder="Street address"]').eq(1).type('456 Oak Ave');
    cy.get('input[placeholder="City"]').eq(1).type('Mississauga');
    cy.get('input[placeholder*="Postal code"]').eq(1).type('L5A 1B2');

    cy.contains(/^Next$/i).click();

    // Step 2 — Move details
    cy.contains('Move Details').should('be.visible');
    cy.get('input[type="datetime-local"]').first().type('2099-12-01T10:00');
    cy.contains(/^Next$/i).click();

    // Step 3 — Photos
    cy.contains('Upload Item Photos').should('be.visible');
    cy.contains(/Get Estimate/i).click();

    // Step 4 — Confirm
    cy.contains('Confirm Your Booking').should('be.visible');
    cy.contains(/Confirm Booking/i).should('be.visible');
  });
});
